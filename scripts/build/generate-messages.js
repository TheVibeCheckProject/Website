/**
 * Builds the message pages (blog/<slug>/index.html) from data/messages.json.
 * `title` / `meta_description` are the search-facing values; `description` is the
 * visible intro under the H1.
 */
const fs = require('fs');
const path = require('path');
const { renderBubble, renderPage } = require('./lib/message-page');

const ROOT = path.join(__dirname, '..', '..');
const { categories } = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/messages.json'), 'utf8'));

for (const cat of categories) {
    const mid = Math.floor(cat.messages.length / 2);
    const messagesHtml = cat.messages
        // #messages-mid is the template's "Curated Favorites" table-of-contents target
        .map((msg, i) => (i === mid ? '\n        <span id="messages-mid"></span>' : '') + renderBubble(msg, `msg-${cat.id}-${i}`))
        .join('');

    const html = renderPage({ ...cat, path: `${cat.slug}/` }, messagesHtml, 2);

    const dir = path.join(ROOT, 'blog', cat.slug);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'index.html'), html, 'utf8');
    console.log(`Generated message page: blog/${cat.slug}/`);
}
