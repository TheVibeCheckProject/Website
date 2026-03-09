const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const BLOG_DIR = path.join(__dirname, '../blog');

// Helper to sanitize quotes
const cleanQuotes = (str) => str.replace(/^["“”]/, '').replace(/["“”]$/, '').trim();

// The copy function to inject into each file
const copyScriptHtml = `
<script>
function copyText(elementId, btn) {
    let text = document.getElementById(elementId).innerText;
    text = text.replace(/^["“”]/, '').replace(/["“”]$/, '').trim();
    navigator.clipboard.writeText(text).then(function() {
        const originalText = btn.innerHTML;
        btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> Copied!';
        btn.classList.add('copied');
        setTimeout(function() {
            btn.innerHTML = originalText;
            btn.classList.remove('copied');
        }, 2000);
    });
}
</script>
`;

// Read all blog post files directly in /blog/
const files = fs.readdirSync(BLOG_DIR).filter(file => file.endsWith('.html') && file !== 'index.html');

// Create metadata map
const postMap = [];
for (const file of files) {
    const fullPath = path.join(BLOG_DIR, file);
    const html = fs.readFileSync(fullPath, 'utf-8');
    const $ = cheerio.load(html);
    const title = $('h1').first().text().trim();
    postMap.push({ file, title });
}

for (const file of files) {
    const fullPath = path.join(BLOG_DIR, file);
    let html = fs.readFileSync(fullPath, 'utf-8');
    const $ = cheerio.load(html);

    let hasChanges = false;

    // 1. Inject Inline CTAs
    // If the post does not have .text-box, or even if it does, an inline CTA is great
    // Let's add the inline CTA after the 4th paragraph, or before <section class="premium-resources">
    if ($('.inline-cta-block').length === 0) {
        const ctaHtml = `
        <div class="inline-cta-block">
            <div class="inline-cta-text">
                <strong>Don't just read it. Send it.</strong>
                <p>Send an anonymous, beautifully designed digital affirmation card straight to their phone.</p>
            </div>
            <div class="inline-cta-btn">
                <a href="../send-card.html" class="btn btn-primary">Send a Free Card ✨</a>
            </div>
        </div>
        `;

        let target = $('main.blog-post p').eq(4);
        if (target.length) {
            target.after(ctaHtml);
        } else if ($('section.premium-resources').length) {
            $('section.premium-resources').before(ctaHtml);
        }
        hasChanges = true;
    }

    // 2. Convert .text-box to .copyable-message-block
    if ($('.text-box').length > 0) {
        $('.text-box').each((i, el) => {
            const rawText = $(el).text().trim();
            const msgId = 'msg-' + Math.random().toString(36).substr(2, 9);

            const newBlock = `
            <div class="copyable-message-block">
                <div class="copyable-message-text" id="${msgId}">${rawText}</div>
                <div class="copyable-message-actions">
                    <button class="btn btn-copy" onclick="copyText('${msgId}', this)">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                        Copy Text
                    </button>
                    <a href="../send-card.html" class="btn btn-secondary" style="border: 1px solid rgba(255,255,255,0.2);">Send as Card ✨</a>
                </div>
            </div>
            `;
            $(el).replaceWith(newBlock);
        });
        hasChanges = true;
    }

    // 3. Add Contextual Related Reading (2 links per post)
    // We filter out the current file
    const others = postMap.filter(p => p.file !== file);
    // Shuffle
    others.sort(() => 0.5 - Math.random());

    if ($('.inline-related-reading').length === 0 && others.length >= 2) {
        const link1 = `
        <div class="inline-related-reading">
            <p><strong>Related Reading:</strong> If you found this helpful, you might also like our guide on <a href="${others[0].file}">${others[0].title}</a>.</p>
        </div>
        `;
        const link2 = `
        <div class="inline-related-reading">
            <p><strong>Related Reading:</strong> Also check out: <a href="${others[1].file}">${others[1].title}</a>.</p>
        </div>
        `;

        // Inject link 1 after paragraph 3
        if ($('main.blog-post p').length >= 3) {
            $('main.blog-post p').eq(2).after(link1);
        }

        // Inject link 2 near the end of the post content (before premium resources or CTA)
        const lastP = $('main.blog-post p').last();
        if (lastP.length) {
            lastP.after(link2);
        }

        hasChanges = true;
    }

    // 4. Inject the Copy JS script if it doesn't exist and if we added copyable blocks
    if (hasChanges && html.indexOf('function copyText') === -1) {
        $('body').append(copyScriptHtml);
    }

    if (hasChanges) {
        fs.writeFileSync(fullPath, $.html(), 'utf-8');
        console.log(`Updated ${file}`);
    }
}
console.log("Done injecting components!");
