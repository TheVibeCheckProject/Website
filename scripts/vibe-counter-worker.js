/**
 * Vibe Check Counter — Cloudflare Worker + D1
 *
 * Replaces counterapi.dev v1 (shut down, returns HTTP 410). Backs:
 *   - the "cards sent" / "newsletters sent" stats on the homepage
 *   - read receipts on My Vibes (one counter per card: "open:<cardId>")
 *
 * Endpoints (names: lowercase a-z 0-9 _ : -, max 64 chars):
 *   POST /hit/:name              -> { name, count }   increments by 1
 *   GET  /get?names=a,b,c        -> { counts: { a: 3, b: 0, c: 12 } }   (max 50 names)
 *
 * Deployment (one time, ~5 minutes):
 *   1. Cloudflare Dashboard → Storage & Databases → D1 → Create database "vibe-counter".
 *   2. In its Console tab run:
 *        CREATE TABLE IF NOT EXISTS counters (name TEXT PRIMARY KEY, count INTEGER NOT NULL DEFAULT 0);
 *   3. Workers & Pages → Create Worker "vibe-counter" → paste this file → Deploy.
 *   4. Worker → Settings → Bindings → Add D1 database: variable name DB → "vibe-counter".
 *   5. Copy the worker URL (https://vibe-counter.<account>.workers.dev) into:
 *        - VIBE_COUNTER_URL in js/core-utils.js (then bump its ?v= via `npm run build:assets`)
 *        - a GitHub Actions secret named VIBE_COUNTER_URL (newsletter counter)
 *
 * Free tier: D1 allows 100k writes/day and 5M reads/day, far above current traffic.
 */

const ALLOWED_ORIGINS = [
    'https://thevibecheckproject.com',
    'https://www.thevibecheckproject.com',
];
const NAME_RE = /^[a-z0-9_:-]{1,64}$/;
const MAX_BATCH = 50;

function corsHeaders(request) {
    const origin = request.headers.get('Origin') || '';
    const allowed = ALLOWED_ORIGINS.includes(origin) || /^http:\/\/localhost(:\d+)?$/.test(origin);
    return {
        'Access-Control-Allow-Origin': allowed ? origin : ALLOWED_ORIGINS[0],
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
        'Vary': 'Origin',
    };
}

function json(request, body, status = 200, extra = {}) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json', ...corsHeaders(request), ...extra },
    });
}

export default {
    async fetch(request, env) {
        if (request.method === 'OPTIONS') {
            return new Response(null, { headers: corsHeaders(request) });
        }

        const url = new URL(request.url);
        const parts = url.pathname.split('/').filter(Boolean);

        try {
            // POST /hit/:name
            if (parts[0] === 'hit' && parts.length === 2) {
                if (request.method !== 'POST') return json(request, { error: 'Use POST' }, 405);
                const name = decodeURIComponent(parts[1]).toLowerCase();
                if (!NAME_RE.test(name)) return json(request, { error: 'Invalid counter name' }, 400);

                const row = await env.DB.prepare(
                    `INSERT INTO counters (name, count) VALUES (?1, 1)
                     ON CONFLICT(name) DO UPDATE SET count = count + 1
                     RETURNING count`
                ).bind(name).first();
                return json(request, { name, count: row ? row.count : 1 });
            }

            // GET /get?names=a,b,c
            if (parts[0] === 'get' && parts.length === 1) {
                if (request.method !== 'GET') return json(request, { error: 'Use GET' }, 405);
                const names = [...new Set((url.searchParams.get('names') || '')
                    .split(',').map(n => n.trim().toLowerCase()).filter(n => NAME_RE.test(n)))]
                    .slice(0, MAX_BATCH);
                const counts = Object.fromEntries(names.map(n => [n, 0]));
                if (names.length) {
                    const placeholders = names.map((_, i) => `?${i + 1}`).join(',');
                    const { results } = await env.DB.prepare(
                        `SELECT name, count FROM counters WHERE name IN (${placeholders})`
                    ).bind(...names).all();
                    for (const r of results) counts[r.name] = r.count;
                }
                // Short edge cache for the public homepage stats; read receipts bypass it via cache: 'no-store'
                return json(request, { counts }, 200, { 'Cache-Control': 'public, max-age=30' });
            }

            return json(request, { error: 'Not found' }, 404);
        } catch (err) {
            return json(request, { error: 'Counter unavailable' }, 500);
        }
    },
};
