/**
 * Static checks (no browser): JS syntax, JSON-LD, broken internal links, SEO rules
 * from CLAUDE.md, sitemap consistency, and that generated output is up to date.
 *   npm run test:static
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const crypto = require('crypto');
const { execFileSync } = require('child_process');
const cheerio = require('cheerio');
const { ROOT, listPages, reporter } = require('./lib/site');

const t = reporter('static');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const exists = (p) => fs.existsSync(p) || fs.existsSync(p + '.html') ||
    (fs.existsSync(p) && fs.statSync(p).isDirectory() && fs.existsSync(path.join(p, 'index.html')));

// ── JS syntax (site scripts are classic scripts; workers/ESM are checked by parse only) ──
for (const dir of ['js', 'scripts/build', 'scripts/build/lib', 'scripts/newsletter', 'scripts/marketing', 'workers']) {
    for (const f of fs.readdirSync(path.join(ROOT, dir)).filter(f => /\.(m?js)$/.test(f))) {
        const src = read(`${dir}/${f}`);
        const isModule = /^\s*(import|export)\s/m.test(src) || f.endsWith('.mjs');
        try {
            if (isModule) {
                execFileSync(process.execPath, ['--input-type=module', '--check'], { input: src, stdio: ['pipe', 'ignore', 'pipe'] });
            } else {
                new vm.Script(src, { filename: f });
            }
            t.check(true);
        } catch (e) { t.check(false, `syntax: ${dir}/${f}`, String(e.stderr || e.message).split('\n').slice(0, 4).join(' ')); }
    }
}

// ── Pages ──
const pages = listPages();
const sitemap = read('sitemap.xml');
const sitemapUrls = new Set([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]));
const assetHash = (rel) => crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, rel))).digest('hex').slice(0, 10);

for (const rel of pages) {
    const html = read(rel);
    const $ = cheerio.load(html);
    const dir = path.dirname(path.join(ROOT, rel));

    // Inline scripts parse; JSON-LD is valid JSON
    $('script').each((_, el) => {
        const type = $(el).attr('type') || '';
        const code = $(el).html();
        if ($(el).attr('src') || !code.trim()) return;
        if (type.includes('ld+json')) {
            try { JSON.parse(code); t.check(true); } catch (e) { t.check(false, `JSON-LD: ${rel}`, e.message); }
        } else {
            try { new vm.Script(code); t.check(true); } catch (e) { t.check(false, `inline script: ${rel}`, e.message); }
        }
    });

    // Internal links and assets resolve
    $('[href],[src]').each((_, el) => {
        for (const attr of ['href', 'src']) {
            let ref = $(el).attr(attr);
            if (!ref || /^(https?:|mailto:|tel:|sms:|javascript:|data:|#)/i.test(ref)) continue;
            ref = ref.split('#')[0].split('?')[0];
            if (!ref) continue;
            const target = ref.startsWith('/') ? path.join(ROOT, ref) : path.join(dir, ref);
            t.check(exists(target), `broken ${attr}: ${rel}`, ref);
        }
    });

    // css/js cache-busting hashes are current (npm run build:assets)
    for (const m of html.matchAll(/(?:\.\.\/)*((?:css|js)\/[\w.-]+\.(?:css|js))\?v=([\w]+)/g)) {
        t.check(fs.existsSync(path.join(ROOT, m[1])) && m[2] === assetHash(m[1]), `stale ?v= hash: ${rel}`, `${m[1]} (run npm run build)`);
    }

    // SEO rules
    const robots = $('meta[name="robots"]').attr('content') || '';
    const noindex = robots.includes('noindex');
    const canonical = $('link[rel="canonical"]').attr('href') || '';
    t.check(!!$('html').attr('lang'), `missing lang: ${rel}`);
    t.check(!!$('title').text().trim(), `missing <title>: ${rel}`);
    t.check(!!$('meta[name="description"]').attr('content'), `missing meta description: ${rel}`);
    t.check(!!canonical, `missing canonical: ${rel}`);
    t.check(!/www\.|\.html$/.test(canonical) || rel === 'view-card.html', `canonical must be bare-domain & extensionless: ${rel}`, canonical);
    t.check($('h1').length === 1 || rel === 'view-card.html', `expected one <h1>: ${rel}`, `found ${$('h1').length}`);
    if (!noindex) t.check(sitemapUrls.has(canonical), `indexable page missing from sitemap: ${rel}`, canonical);
    else t.check(!sitemapUrls.has(canonical), `noindex page listed in sitemap: ${rel}`);

    // Shared layout is present (npm run build:layout)
    if ($('#nav').length) {
        t.check(html.includes('<!-- site-nav:start'), `nav not generated from partial: ${rel}`);
        t.check(html.includes('<!-- site-footer:start'), `footer not generated from partial: ${rel}`);
    }
}

// Every sitemap URL points at a real page
for (const url of sitemapUrls) {
    const p = path.join(ROOT, url.replace('https://thevibecheckproject.com/', ''));
    t.check(exists(p), 'sitemap URL has no page', url);
}

// ── Guards: the owner's name stays off the site; fabricated numbers must not come back ──
const claims = /Maya R\.|12,480|5,200\+|5,000\+ humans|1,200\+ cards|100% of proceeds/;
const ownerName = /\bDevin\b|\bGriffin\b/i;
for (const rel of pages) {
    const html = read(rel);
    t.check(!claims.test(html), `fabricated claim reintroduced: ${rel}`);
    t.check(!ownerName.test(html), `owner's name appears on a public page: ${rel}`);
}

t.finish();
