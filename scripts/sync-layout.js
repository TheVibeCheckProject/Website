/**
 * Shared layout sync — stamps templates/partials/nav.html and footer.html into every page.
 *
 * The site is plain static HTML with no include mechanism, so the header/footer used to be
 * hand-copied into ~50 files and had drifted into five different versions (different links,
 * missing mobile menu on articles, broken logo styling). Edit the partials, then run:
 *
 *   npm run build:layout
 *
 * Per page it:
 *   - replaces the nav/footer between <!-- site-nav:start/end --> and <!-- site-footer:start/end -->
 *     markers (on the first run it replaces the existing <nav id="nav"> / <footer> element)
 *   - rewrites {{root}} to the page's relative path back to the site root
 *   - marks the current section with aria-current="page"
 *   - adds js/core-utils.js (mobile menu, telemetry) to pages that don't load it yet
 *
 * Pages without a site nav (view-card.html) are left alone.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PARTIALS = path.join(ROOT, 'templates', 'partials');
const SKIP_DIRS = new Set(['node_modules', '.git', 'docs', 'scratch', 'assets', 'css', 'js', 'data', 'scripts', 'partials', 'newsletter-content', '.github']);

const navPartial = fs.readFileSync(path.join(PARTIALS, 'nav.html'), 'utf8').trim();
const footerPartial = fs.readFileSync(path.join(PARTIALS, 'footer.html'), 'utf8').trim();

const NAV_START = '<!-- site-nav:start (generated from templates/partials/nav.html — edit there, then npm run build:layout) -->';
const NAV_END = '<!-- site-nav:end -->';
const FOOTER_START = '<!-- site-footer:start (generated from templates/partials/footer.html) -->';
const FOOTER_END = '<!-- site-footer:end -->';

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

function navKeyFor(rel) {
    if (rel.startsWith('blog/') || rel.startsWith('templates/')) return 'guides';
    return {
        'send-card.html': 'send',
        'situations.html': 'situations',
        'my-cards.html': 'vibes',
        'faq.html': 'faq',
        'about.html': 'about',
    }[rel] || null;
}

function rootPrefixFor(rel) {
    // templates/message-page.html renders into blog/<slug>.html, one level deep
    if (rel.startsWith('templates/')) return '../';
    return '../'.repeat(rel.split('/').length - 1);
}

function renderNav(rel) {
    let html = navPartial.replace(/\{\{root\}\}/g, rootPrefixFor(rel));
    const key = navKeyFor(rel);
    if (key) html = html.replace(`data-nav="${key}"`, `data-nav="${key}" aria-current="page"`);
    return `${NAV_START}\n${html}\n${NAV_END}`;
}

function renderFooter(rel) {
    return `${FOOTER_START}\n${footerPartial.replace(/\{\{root\}\}/g, rootPrefixFor(rel))}\n${FOOTER_END}`;
}

function replaceBlock(html, startMarker, endMarker, elementRe, replacement) {
    const s = html.indexOf(startMarker.slice(0, 20));
    if (s !== -1) {
        const e = html.indexOf(endMarker, s);
        if (e === -1) throw new Error(`unterminated ${startMarker.slice(5, 20)} marker`);
        return { html: html.slice(0, s) + replacement + html.slice(e + endMarker.length), changed: true };
    }
    const m = html.match(elementRe);
    if (!m) return { html, changed: false };
    return { html: html.replace(elementRe, () => replacement), changed: true };
}

let updated = 0;
for (const file of listPages(ROOT)) {
    const rel = path.relative(ROOT, file).replace(/\\/g, '/');
    const original = fs.readFileSync(file, 'utf8');
    const eol = original.includes('\r\n') ? '\r\n' : '\n';
    let html = original.replace(/\r\n/g, '\n');

    const nav = replaceBlock(html, NAV_START, NAV_END, /<nav id="nav"[\s\S]*?<\/nav>/, renderNav(rel));
    if (!nav.changed) continue; // no site chrome on this page (e.g. view-card.html)
    html = nav.html;
    html = replaceBlock(html, FOOTER_START, FOOTER_END, /<footer[\s>][\s\S]*?<\/footer>/, renderFooter(rel)).html;

    if (!/js\/core-utils\.js/.test(html) && !rel.startsWith('templates/')) {
        html = html.replace(/<\/body>/i, `    <script src="${rootPrefixFor(rel)}js/core-utils.js?v=0" defer></script>\n</body>`);
    }

    html = html.replace(/\n/g, eol);
    if (html !== original) {
        fs.writeFileSync(file, html, 'utf8');
        updated += 1;
    }
}
console.log(`sync-layout: updated ${updated} page(s)`);
