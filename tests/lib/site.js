/**
 * Test helpers: a static server that behaves like GitHub Pages (index.html for folders,
 * extensionless URLs), a page lister, and a card-link encoder matching send-card-logic.js.
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const SKIP = new Set(['node_modules', '.git', 'docs', 'scratch', 'tests', 'scripts', 'workers', 'templates', 'assets', 'css', 'js', 'data', 'newsletter-content', '.github']);

const TYPES = {
    '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
    '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.mp4': 'video/mp4', '.xml': 'application/xml',
};

/** Starts the server; resolves to { base, close() }. */
function startServer(port = 0) {
    const server = http.createServer((req, res) => {
        let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
        if (p.endsWith('/')) p += 'index.html';
        let file = path.join(ROOT, p);
        if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
        if (!fs.existsSync(file) && fs.existsSync(file + '.html')) file += '.html';
        fs.readFile(file, (err, data) => {
            if (err) { res.writeHead(404); return res.end(); }
            res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
            res.end(data);
        });
    });
    return new Promise((resolve, reject) => {
        server.on('error', (e) => reject(e.code === 'EADDRINUSE'
            ? new Error(`Port ${port} is in use (an earlier test run may still be open). Close it and retry.`)
            : e));
        server.listen(port, () => resolve({
            base: `http://localhost:${server.address().port}`,
            close: () => new Promise(r => server.close(r)),
        }));
    });
}

/** Every public HTML page, as site-relative paths like "blog/foo.html". */
function listPages(dir = ROOT, out = []) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        if (e.isDirectory()) { if (!SKIP.has(e.name)) listPages(path.join(dir, e.name), out); }
        else if (e.name.endsWith('.html')) out.push(path.relative(ROOT, path.join(dir, e.name)).replace(/\\/g, '/'));
    }
    return out.sort();
}

/** Page path -> URL path ("blog/x/index.html" -> "/blog/x/"). */
const urlPath = (rel) => '/' + rel.replace(/(^|\/)index\.html$/, '$1');

/** Same encoding as send-card-logic.js (JSON -> URI -> base64url). */
const encodeCard = (card) => Buffer.from(encodeURIComponent(JSON.stringify(card)), 'latin1')
    .toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

/** Tiny assertion collector so one run reports every failure. */
function reporter(name) {
    const failures = [];
    let passed = 0;
    return {
        check(ok, label, detail = '') {
            if (ok) passed++; else failures.push(`${label}${detail ? ` — ${detail}` : ''}`);
        },
        finish() {
            console.log(`\n${name}: ${passed} passed, ${failures.length} failed`);
            failures.forEach(f => console.log(`  ✗ ${f}`));
            if (failures.length) process.exitCode = 1;
        },
    };
}

module.exports = { ROOT, startServer, listPages, urlPath, encodeCard, reporter };
