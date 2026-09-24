/**
 * Shared renderer for pages built from templates/message-page.html:
 *   - blog/<slug>.html          listicles      (scripts/build/generate-listicles.js)
 *   - blog/<slug>/index.html    message pages  (scripts/build/generate-messages.js)
 */
const fs = require('fs');
const path = require('path');

const TEMPLATE = fs.readFileSync(path.join(__dirname, '../../../templates/message-page.html'), 'utf8');

const escapeHtml = (s) => String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const COPY_ICON = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';

/** One copyable message with Copy + "Send as Card" (which hands the text to the studio). */
function renderBubble(message, id, number) {
    const num = number ? `\n            <span class="sms-bubble-number" aria-hidden="true">${number}</span>` : '';
    return `
        <div class="copyable-message-block sms-message-bubble">${num}
            <div class="copyable-message-text sms-bubble-text" id="${id}">${escapeHtml(message)}</div>
            <div class="copyable-message-actions sms-bubble-actions">
                <button class="btn btn-copy btn-copy-sms" onclick="copyText('${id}', this)">
                    ${COPY_ICON}
                    Copy Text
                </button>
                <a href="../send-card.html"
                   onclick="var msg = this.closest('.copyable-message-actions').previousElementSibling.innerText.trim(); window.location.href = this.href + '?message=' + encodeURIComponent(msg); return false;"
                   class="btn btn-secondary btn-send-as-card" style="border: 1px solid rgba(255,255,255,0.2);">Send as Card ✨</a>
            </div>
        </div>`;
}

/**
 * @param {object} page
 * @param {string} page.title            SEO title, without the " | The Vibe Check Project" suffix
 * @param {string} page.meta_description meta/OG/JSON-LD description
 * @param {string} page.description      visible intro under the H1
 * @param {string} page.header_title     H1
 * @param {string} page.path             URL path after /blog/ (e.g. "texts-for-anxiety/")
 * @param {string} page.color_theme      accent colour for the H1
 * @param {string} messagesHtml
 * @param {number} depth                 folders below the site root (1 = blog/x.html, 2 = blog/x/index.html)
 */
function renderPage(page, messagesHtml, depth) {
    let html = TEMPLATE
        .replace(/{{title}}/g, escapeHtml(page.title))
        .replace(/{{meta_description}}/g, escapeHtml(page.meta_description))
        .replace(/{{description}}/g, escapeHtml(page.description))
        .replace(/{{header_title}}/g, escapeHtml(page.header_title))
        .replace(/{{path}}/g, page.path)
        .replace(/var\(--dynamic-color\)/g, page.color_theme)
        .replace(/{{messages_html}}/g, () => messagesHtml);
    if (depth === 2) {
        // The template is written for blog/<x>.html; one folder deeper needs one more "../"
        html = html.replace(/(href|src)="\.\.\//g, '$1="../../');
    }
    return html;
}

module.exports = { escapeHtml, renderBubble, renderPage };
