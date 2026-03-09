const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://www.thevibecheckproject.com';
const WEBSITE_DIR = path.join(__dirname, '..');
const SITEMAP_PATH = path.join(WEBSITE_DIR, 'sitemap.xml');

// Pages to exclude from sitemap
const EXCLUDE_FILES = [
    'sitemap.xml',
    'robots.txt',
    'package.json',
    'package-lock.json',
    'categorize-blog.js',
    'fix-heights.js',
    'fix-lineclamp.js',
    'fix-related.js',
    'migrate-cards.js',
    'index.html.bak',
    'send-card.html.bak'
];

const EXCLUDE_DIRS = [
    '.git',
    '.github',
    '.agents',
    'node_modules',
    'scripts',
    'templates',
    'assets',
    'css',
    'js',
    'docs',
    'newsletter-content'
];

function getHtmlFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            if (!EXCLUDE_DIRS.includes(file)) {
                getHtmlFiles(filePath, fileList);
            }
        } else if (file.endsWith('.html')) {
            if (!EXCLUDE_FILES.includes(file)) {
                fileList.push(filePath);
            }
        }
    });

    return fileList;
}

function generateSitemap() {
    const files = getHtmlFiles(WEBSITE_DIR);
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    files.forEach(file => {
        let relativePath = path.relative(WEBSITE_DIR, file).replace(/\\/g, '/');

        // SEO: Use directory-style URLs for index.html files
        if (relativePath === 'index.html') {
            relativePath = '';
        } else if (relativePath.endsWith('/index.html')) {
            relativePath = relativePath.replace('/index.html', '/');
        } else if (relativePath.endsWith('index.html')) {
            relativePath = relativePath.replace('index.html', '');
        }

        const url = `${BASE_URL}/${relativePath}`;

        // Determine priority and frequency
        let priority = '0.7';
        let freq = 'monthly';

        if (relativePath === '') {
            priority = '1.0';
            freq = 'weekly';
        } else if (relativePath.startsWith('blog/')) {
            if (relativePath === 'blog/') {
                priority = '0.8';
                freq = 'weekly';
            } else {
                priority = '0.7';
                freq = 'monthly';
            }
        } else if (['about.html', 'situations.html', 'send-card.html'].includes(relativePath)) {
            priority = '0.8';
            freq = 'monthly';
        } else if (['privacy.html', 'terms.html', 'cookies.html'].includes(relativePath)) {
            priority = '0.3';
            freq = 'yearly';
        }

        xml += '  <url>\n';
        xml += `    <loc>${url}</loc>\n`;
        xml += `    <changefreq>${freq}</changefreq>\n`;
        xml += `    <priority>${priority}</priority>\n`;
        xml += '  </url>\n';
    });

    xml += '</urlset>';

    fs.writeFileSync(SITEMAP_PATH, xml);
    console.log(`Sitemap generated with ${files.length} URLs at ${SITEMAP_PATH}`);
}

generateSitemap();
