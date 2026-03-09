const fs = require('fs');
const path = require('path');

const blogDir = path.join(__dirname, 'blog');
const files = fs.readdirSync(blogDir).filter(f => f.endsWith('.html') && f !== 'index.html');

for (const file of files) {
    const filePath = path.join(blogDir, file);
    let html = fs.readFileSync(filePath, 'utf-8');

    // Quick regex replace for line clamp warning
    html = html.replace(/-webkit-line-clamp: 3;/g, '-webkit-line-clamp: 3; line-clamp: 3;');

    fs.writeFileSync(filePath, html, 'utf-8');
}

console.log('Fixed line clamp warning');
