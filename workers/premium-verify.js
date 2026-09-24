/**
 * Vibe Check Premium Verifier — Cloudflare Worker
 *
 * Problem it solves: Premium used to unlock for anyone who opened any page with ?premium=1,
 * so the Stripe success URL could simply be shared. With this worker deployed, the site only
 * unlocks after Stripe confirms the Checkout Session was actually paid.
 *
 * Endpoint:
 *   GET /verify?session_id=cs_...   -> { valid: true } | { valid: false, reason }
 *
 * Deployment (one time):
 *   1. Stripe Dashboard → Developers → API keys → create a *restricted* key with
 *      "Checkout Sessions: Read" only.
 *   2. Stripe Dashboard → Payment Links → your $4.99 Premium link → After payment →
 *      "Don't show confirmation page" → redirect to:
 *        https://thevibecheckproject.com/send-card.html?premium=1&session_id={CHECKOUT_SESSION_ID}
 *   3. Cloudflare → Workers & Pages → Create Worker "vibe-premium" → paste this file → Deploy.
 *   4. Worker → Settings → Variables and Secrets:
 *        STRIPE_SECRET_KEY      (secret)   the restricted key from step 1
 *        STRIPE_PAYMENT_LINK_ID (optional) plink_... of the Premium link, so sessions from
 *                                          other products can't unlock Premium
 *      Optional: bind the "vibe-counter" D1 database as DB (see counter.js) to cap
 *      how many browsers one purchase can unlock (MAX_DEVICES below).
 *   5. Put the worker URL in PREMIUM_VERIFY_URL in js/core-utils.js, then `npm run build:assets`.
 *      Until then the site keeps the old unverified behaviour, so real buyers are never locked out.
 */

const ALLOWED_ORIGINS = [
    'https://thevibecheckproject.com',
    'https://www.thevibecheckproject.com',
];
const MAX_DEVICES = 3; // browsers one purchase may unlock (only enforced when DB is bound)
const SESSION_RE = /^cs_(test|live)_[A-Za-z0-9]{10,200}$/;

function corsHeaders(request) {
    const origin = request.headers.get('Origin') || '';
    const allowed = ALLOWED_ORIGINS.includes(origin) || /^http:\/\/localhost(:\d+)?$/.test(origin);
    return {
        'Access-Control-Allow-Origin': allowed ? origin : ALLOWED_ORIGINS[0],
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Vary': 'Origin',
        'Cache-Control': 'no-store',
    };
}

function json(request, body, status = 200) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json', ...corsHeaders(request) },
    });
}

export default {
    async fetch(request, env) {
        if (request.method === 'OPTIONS') return new Response(null, { headers: corsHeaders(request) });

        const url = new URL(request.url);
        if (url.pathname !== '/verify' || request.method !== 'GET') {
            return json(request, { error: 'Not found' }, 404);
        }
        if (!env.STRIPE_SECRET_KEY) {
            return json(request, { valid: false, reason: 'not_configured' }, 500);
        }

        const sessionId = url.searchParams.get('session_id') || '';
        if (!SESSION_RE.test(sessionId)) {
            return json(request, { valid: false, reason: 'bad_session_id' }, 400);
        }

        let session;
        try {
            const res = await fetch(`https://api.stripe.com/v1/checkout/sessions/${sessionId}`, {
                headers: { Authorization: `Bearer ${env.STRIPE_SECRET_KEY}` },
            });
            if (res.status === 404) return json(request, { valid: false, reason: 'unknown_session' });
            if (!res.ok) return json(request, { valid: false, reason: 'stripe_error' }, 502);
            session = await res.json();
        } catch (e) {
            return json(request, { valid: false, reason: 'stripe_unreachable' }, 502);
        }

        if (session.payment_status !== 'paid') {
            return json(request, { valid: false, reason: 'not_paid' });
        }
        if (env.STRIPE_PAYMENT_LINK_ID && session.payment_link !== env.STRIPE_PAYMENT_LINK_ID) {
            return json(request, { valid: false, reason: 'wrong_product' });
        }

        // Optional redemption cap (shared D1 with the counter worker)
        if (env.DB) {
            try {
                const row = await env.DB.prepare(
                    `INSERT INTO counters (name, count) VALUES (?1, 1)
                     ON CONFLICT(name) DO UPDATE SET count = count + 1
                     RETURNING count`
                ).bind(`premium:${sessionId}`).first();
                if (row && row.count > MAX_DEVICES) {
                    return json(request, { valid: false, reason: 'too_many_devices' });
                }
            } catch (e) {
                // Never block a paying customer because the cap store is unavailable
            }
        }

        return json(request, { valid: true });
    },
};
