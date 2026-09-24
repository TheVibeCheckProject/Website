/**
 * Cache-busting for css/ and js/ — rewrites every `css/x.css?v=…` / `js/x.js?v=…` reference
 * in the site's HTML to a short hash of the file's current contents.
 *
 * Cloudflare caches these files aggressively, and the hand-bumped ?v= numbers had drifted
 * (pages were requesting styles.css?v=6, ?v=108, core-utils.js?v=104 …), so some pages kept
 * getting stale CSS/JS after deploys. Run after editing any asset:
 *
 *   npm run build:assets        (also part of `npm run build`)
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..');
const SKIP_DIRS = new Set(['node_modules', '.git', 'docs', 'scratch', 'assets', 'css', 'js', 'data', 'scripts', 'newsletter-content', '.github']);

const hashes = {};
for (const dir of ['css', 'js']) {
    for (const name of fs.readdirSync(path.join(ROOT, dir))) {
        if (!/\.(css|js)$/.test(name)) continue;
        const buf = fs.readFileSync(path.join(ROOT, dir, name));
        hashes[`${dir}/${name}`] = crypto.createHash('sha256').update(buf).digest('hex').slice(0, 10);
    }
}

function listPages(dir, out = []) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.isDirectory()) {
            if (!SKIP_DIRS.has(entry.name)) listPages(path.join(dir, entry.name), out);
        } else if (entry.name.endsWith('.html')) {
            out.push(path.join(dir, entry.name));
        }
    }
    return out;
}

// Matches "css/styles.css", "../js/core-utils.js?v=108", etc. inside src/href attributes
const REF_RE = /((?:src|href)=["'](?:\.\.\/)*)((?:css|js)\/[\w.-]+\.(?:css|js))(?:\?v=[\w.-]*)?(["'])/g;

let changedFiles = 0;
const missing = new Set();
for (const file of listPages(ROOT)) {
    const html = fs.readFileSync(file, 'utf8');
    const out = html.replace(REF_RE, (m, pre, asset, quote) => {
        const h = hashes[asset];
        if (!h) { missing.add(asset); return m; }
        return `${pre}${asset}?v=${h}${quote}`;
    });
    if (out !== html) {
        fs.writeFileSync(file, out, 'utf8');
        changedFiles += 1;
    }
}

console.log(`version-assets: updated ${changedFiles} page(s)`);
if (missing.size) {
    console.warn(`version-assets: referenced but not found: ${[...missing].join(', ')}`);
    process.exitCode = 1;
}
