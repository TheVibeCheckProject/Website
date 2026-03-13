const fs = require('fs');
const path = require('path');
const BLOG_DIR = path.join(__dirname, '../../blog');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

walkDir(BLOG_DIR, (filePath) => {
    if (filePath.endsWith('.html')) {
        let html = fs.readFileSync(filePath, 'utf-8');

        // Quick regex replace for line clamp warning
        // Only replace if it doesn't already have line-clamp
        if (html.includes('-webkit-line-clamp') && !html.includes('line-clamp:')) {
            html = html.replace(/-webkit-line-clamp: (\d+);/g, '-webkit-line-clamp: $1; line-clamp: $1;');
            fs.writeFileSync(filePath, html, 'utf-8');
            console.log(`Fixed ${path.relative(BLOG_DIR, filePath)}`);
        }
    }
});

console.log('Finished fixing line clamp warnings');
