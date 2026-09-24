const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const BASE_URL = 'https://thevibecheckproject.com';
const WEBSITE_DIR = path.join(__dirname, '..');
const SITEMAP_PATH = path.join(WEBSITE_DIR, 'sitemap.xml');

// Pages to exclude from sitemap (e.g. non-content files and noindexed pages)
const EXCLUDE_FILES = [
    'sitemap.xml',
    'robots.txt',
    'package.json',
    'package-lock.json',
    'readme.md',
    'CNAME',
    'view-card.html',
    'my-cards.html'
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
    'newsletter-content',
    'scratch',
    'data'
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

// Last-modified date (YYYY-MM-DD) from git history; falls back to the file's mtime for
// uncommitted files or when git isn't available (e.g. a shallow CI checkout).
function lastModified(file) {
    try {
        const out = execFileSync('git', ['log', '-1', '--format=%cs', '--', file], { cwd: WEBSITE_DIR, encoding: 'utf8' }).trim();
        if (/^\d{4}-\d{2}-\d{2}$/.test(out)) return out;
    } catch (e) { /* fall through */ }
    return fs.statSync(file).mtime.toISOString().slice(0, 10);
}

function generateSitemap() {
    const files = getHtmlFiles(WEBSITE_DIR).sort();
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
        } else if (relativePath.endsWith('.html')) {
            relativePath = relativePath.replace('.html', '');
        }

        const url = `${BASE_URL}/${relativePath}`;

        // Determine priority and frequency
        let priority = '0.7';
        let freq = 'monthly';

        if (relativePath === '') {
            priority = '1.0';
            freq = 'daily';
        } else if (relativePath === 'send-card') {
            priority = '0.9';
            freq = 'daily';
        } else if (relativePath === 'situations' || relativePath === 'about') {
            priority = '0.8';
            freq = 'weekly';
        } else if (relativePath.startsWith('blog/')) {
            if (relativePath === 'blog/') {
                priority = '0.8';
                freq = 'weekly';
            } else {
                priority = '0.7';
                freq = 'monthly';
            }
        } else if (['privacy', 'terms', 'cookies'].includes(relativePath)) {
            priority = '0.5';
            freq = 'monthly';
        }

        xml += '  <url>\n';
        xml += `    <loc>${url}</loc>\n`;
        xml += `    <lastmod>${lastModified(file)}</lastmod>\n`;
        xml += `    <changefreq>${freq}</changefreq>\n`;
        xml += `    <priority>${priority}</priority>\n`;
        xml += '  </url>\n';
    });

    xml += '</urlset>';

    fs.writeFileSync(SITEMAP_PATH, xml);
    console.log(`Sitemap generated with ${files.length} URLs at ${SITEMAP_PATH}`);
}

generateSitemap();
