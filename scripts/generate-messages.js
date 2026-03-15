const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../data/messages.json');
const TEMPLATE_FILE = path.join(__dirname, '../templates/message-page.html');
const BLOG_DIR = path.join(__dirname, '../blog');

const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
const template = fs.readFileSync(TEMPLATE_FILE, 'utf-8');

if (!fs.existsSync(BLOG_DIR)) {
    fs.mkdirSync(BLOG_DIR);
}

for (const cat of data.categories) {
    const slugDir = path.join(BLOG_DIR, cat.slug);
    if (!fs.existsSync(slugDir)) {
        fs.mkdirSync(slugDir, { recursive: true });
    }

    let messagesHtml = '';

    cat.messages.forEach((msg, index) => {
        const msgId = `msg-${cat.id}-${index}`;
        messagesHtml += `
        <div class="copyable-message-block">
            <div class="copyable-message-text" id="${msgId}">${msg}</div>
            <div class="copyable-message-actions">
                <button class="btn btn-copy" onclick="copyText('${msgId}', this)">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                    Copy Text
                </button>
                <a href="../send-card.html" 
                   onclick="var msg = this.closest('.copyable-message-actions').previousElementSibling.innerText.trim(); window.location.href = this.href + '?message=' + encodeURIComponent(msg); return false;"
                   class="btn btn-secondary" style="border: 1px solid rgba(255,255,255,0.2);">Send as Card ✨</a>
            </div>
        </div>
        `;
    });

    // Helper to fix relative URLs for deeper directory (blog/category/index.html is 2 levels deep)
    function fixUrls(html) {
        let fixed = html;
        // Fix asset/CSS/JS references - since these pages are in blog/category/ (2 levels deep),
        // they need ../../ to reach the root assets.
        fixed = fixed.replace(/(href|src)="(\.\.\/)+([^"]+)"/g, '$1="../../$3"');
        fixed = fixed.replace(/url\(\'(\.\.\/)+/g, "url('../../");
        
        // Ensure scripts and links that were already ../../ aren't double-processed (the regex above handles ../ correctly)
        
        return fixed;
    }

    let outputHtml = fixUrls(template
        .replace(/{{title}}/g, cat.title)
        .replace(/{{header_title}}/g, cat.header_title)
        .replace(/{{description}}/g, cat.description)
        .replace(/{{slug}}/g, cat.slug)
        .replace(/var\(--dynamic-color\)/g, cat.color_theme)
        .replace(/{{messages_html}}/g, messagesHtml));

    const outputPath = path.join(slugDir, 'index.html');
    fs.writeFileSync(outputPath, outputHtml, 'utf-8');

    console.log(`Generated page for ${cat.title} at /blog/${cat.slug}/index.html`);
}

console.log("Programmatic SEO generation complete!");
