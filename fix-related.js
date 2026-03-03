const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const blogDir = path.join(__dirname, 'blog');
const files = fs.readdirSync(blogDir).filter(f => f.endsWith('.html') && f !== 'index.html');

// First, parse blog/index.html to get all posts data
const indexFile = fs.readFileSync(path.join(blogDir, 'index.html'), 'utf-8');
const $index = cheerio.load(indexFile);
const postData = {};

$index('a.blog-card-img').each(function () {
    const $el = $index(this);
    const href = $el.attr('href');
    const bgStyle = $el.attr('style') || '';
    const imgMatch = bgStyle.match(/url\(['"]?([^'"]+)['"]?\)/);
    const bgUrl = imgMatch ? imgMatch[1] : '../assets/blog_cover_panic.png';
    const tag = $el.find('.blog-tag').text().trim();
    const title = $el.find('h2').text().trim();
    const excerpt = $el.find('.card-info p').text().trim();

    postData[href] = { bgUrl, tag, title, excerpt };
});

for (const file of files) {
    const filePath = path.join(blogDir, file);
    let html = fs.readFileSync(filePath, 'utf-8');

    // Fix the literal '\n' strings in script tags that the IDE caught
    html = html.replace(/\\n/g, '\n');

    const $ = cheerio.load(html, { decodeEntities: false });

    // Find the related articles container
    // It's the div with display:grid inside the last section
    const $relatedGrid = $('section h3:contains("Keep Reading")').next('div');

    if ($relatedGrid.length > 0) {
        $relatedGrid.attr('style', 'display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 20px;');

        $relatedGrid.find('a').each(function () {
            const $el = $(this);
            const href = $el.attr('href');
            const data = postData[href];

            if (data) {
                const newHtml = `
            <a href="${href}" class="blog-card-img related-card" style="background-image: url('${data.bgUrl}');">
                <div class="color-overlay"></div>
                <div class="gradient-overlay"></div>
                
                <div class="title-content">
                    <span class="blog-tag">${data.tag}</span>
                    <h2 style="font-size: 1.2rem;">${data.title}</h2>
                </div>
                
                <div class="card-info">
                    <p style="font-size: 0.85rem; margin-bottom: 15px; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;">${data.excerpt}</p>
                    <div class="read-more-btn" style="padding: 6px 14px; font-size: 0.8rem;">
                        Read 
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                            <polyline points="12 5 19 12 12 19"></polyline>
                        </svg>
                    </div>
                </div>
            </a>`;
                $el.replaceWith(newHtml);
            }
        });
    }

    fs.writeFileSync(filePath, $.html(), 'utf-8');
}

console.log('Fixed related cards and scripts');
