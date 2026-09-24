const fs = require('fs');
const path = require('path');

const TEMPLATE_FILE = path.join(__dirname, '../../templates/message-page.html');
const DATA_FILE = path.join(__dirname, '../../data/listicles.json');
const BLOG_DIR = path.join(__dirname, '../../blog');

const template = fs.readFileSync(TEMPLATE_FILE, 'utf-8');
const { listicles } = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));

const escapeHtml = (s) => String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

listicles.forEach(list => {
    const allMessages = list.sections.flatMap(s => s.messages);

    // The page title promises a number ("100 Encouraging Messages"); every entry must be unique.
    const expected = parseInt(list.header_title, 10);
    const unique = new Set(allMessages.map(m => m.trim().toLowerCase()));
    if (unique.size !== allMessages.length) {
        throw new Error(`${list.filename}: duplicate messages in data/listicles.json`);
    }
    if (expected && allMessages.length !== expected) {
        throw new Error(`${list.filename}: title promises ${expected} messages but data has ${allMessages.length}`);
    }

    const midSection = Math.floor(list.sections.length / 2);
    let n = 0;
    let messagesHtml = '';

    list.sections.forEach((section, si) => {
        const anchor = si === midSection ? 'messages-mid' : slugify(section.heading);
        messagesHtml += `
        <h2 class="message-section-title" id="${anchor}">${escapeHtml(section.heading)}</h2>`;

        section.messages.forEach(msg => {
            n += 1;
            const msgId = `msg-${list.slug.substring(0, 6)}-${n}`;
            messagesHtml += `
        <div class="copyable-message-block sms-message-bubble">
            <span class="sms-bubble-number" aria-hidden="true">${n}</span>
            <div class="copyable-message-text sms-bubble-text" id="${msgId}">${escapeHtml(msg)}</div>
            <div class="copyable-message-actions sms-bubble-actions">
                <button class="btn btn-copy btn-copy-sms" onclick="copyText('${msgId}', this)">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                    Copy Text
                </button>
                <a href="../send-card.html"
                   onclick="var msg = this.closest('.copyable-message-actions').previousElementSibling.innerText.trim(); window.location.href = this.href + '?message=' + encodeURIComponent(msg); return false;"
                   class="btn btn-secondary btn-send-as-card" style="border: 1px solid rgba(255,255,255,0.2);">Send as Card ✨</a>
            </div>
        </div>`;
        });
    });

    const outputHtml = template
        .replace(/{{title}}/g, list.title)
        .replace(/{{header_title}}/g, list.header_title)
        .replace(/{{description}}/g, list.description)
        .replace(/{{slug}}/g, list.slug)
        .replace(/var\(--dynamic-color\)/g, list.color_theme)
        .replace(/{{messages_html}}/g, messagesHtml);

    fs.writeFileSync(path.join(BLOG_DIR, list.filename), outputHtml, 'utf-8');
    console.log(`Generated listicle: ${list.filename} (${n} unique messages)`);
});

console.log('Listicles complete!');
