const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const blogDir = path.join(__dirname, 'blog');
const files = fs.readdirSync(blogDir).filter(f => f.endsWith('.html') && f !== 'index.html');

for (const file of files) {
    const filePath = path.join(blogDir, file);
    let html = fs.readFileSync(filePath, 'utf-8');

    // We use cheerio to reliably target just the related-card anchor tags
    const $ = cheerio.load(html, { decodeEntities: false });

    $('a.related-card').each(function () {
        let currentStyle = $(this).attr('style') || '';

        // Strip out any existing height declaration if it got in there
        currentStyle = currentStyle.replace(/height:\s*[^;]+;?/g, '').trim();

        // Append the new explicit smaller height for these specific cards
        $(this).attr('style', currentStyle + (currentStyle.endsWith(';') ? '' : ';') + ' height: 250px;');

        // Also adjust the title margin so it acts appropriately in the smaller card
        $(this).find('.title-content').attr('style', 'margin-top: 100px;');

        // Make the text slightly smaller to fit better
        $(this).find('h2').css('font-size', '1.1rem');
    });

    fs.writeFileSync(filePath, $.html(), 'utf-8');
}

console.log('Successfully adjusted related card dimensions.');
