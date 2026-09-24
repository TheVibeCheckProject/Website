/**
 * Builds the numbered listicles (blog/<slug>.html) from data/listicles.json.
 * Fails if a message repeats or the count in the title doesn't match the data.
 */
const fs = require('fs');
const path = require('path');
const { escapeHtml, renderBubble, renderPage } = require('./lib/message-page');

const ROOT = path.join(__dirname, '..', '..');
const { listicles } = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/listicles.json'), 'utf8'));

const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

for (const list of listicles) {
    const all = list.sections.flatMap(s => s.messages);
    const unique = new Set(all.map(m => m.trim().toLowerCase()));
    if (unique.size !== all.length) {
        throw new Error(`${list.filename}: duplicate messages in data/listicles.json`);
    }
    const promised = parseInt(list.header_title, 10);
    if (promised && all.length !== promised) {
        throw new Error(`${list.filename}: title promises ${promised} messages but data has ${all.length}`);
    }

    const midSection = Math.floor(list.sections.length / 2);
    let n = 0;
    let messagesHtml = '';
    list.sections.forEach((section, si) => {
        const anchor = si === midSection ? 'messages-mid' : slugify(section.heading);
        messagesHtml += `\n        <h2 class="message-section-title" id="${anchor}">${escapeHtml(section.heading)}</h2>`;
        for (const msg of section.messages) {
            n += 1;
            messagesHtml += renderBubble(msg, `msg-${list.slug.substring(0, 6)}-${n}`, n);
        }
    });

    const html = renderPage({
        title: list.title,
        meta_description: list.description,
        description: list.description,
        header_title: list.header_title,
        path: list.slug,
        color_theme: list.color_theme,
    }, messagesHtml, 1);

    fs.writeFileSync(path.join(ROOT, 'blog', list.filename), html, 'utf8');
    console.log(`Generated listicle: ${list.filename} (${n} unique messages)`);
}
