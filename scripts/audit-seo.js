const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const ROOT = path.join(__dirname, '..');

const publicFiles = [
  'index.html',
  'faq.html',
  'situations.html',
  'send-card.html',
  'about.html',
  'contact.html',
  'privacy.html',
  'terms.html',
  'cookies.html',
  'view-card.html',
  'my-cards.html',
  'blog/index.html',
  'blog/100-encouraging-messages-for-a-friend.html',
  'blog/50-texts-to-send-someone-having-a-hard-day.html',
  'blog/75-thinking-of-you-messages.html'
];

// Add static blog files
const blogDir = path.join(ROOT, 'blog');
const blogFiles = fs.readdirSync(blogDir).filter(f => f.endsWith('.html') && !publicFiles.includes(`blog/${f}`));
blogFiles.forEach(f => publicFiles.push(`blog/${f}`));

// Add sub-hubs
const subHubs = [
  'blog/breakup-support-messages/index.html',
  'blog/encouraging-messages-for-cards/index.html',
  'blog/just-because-messages/index.html',
  'blog/sympathy-card-messages/index.html',
  'blog/texts-for-anxiety/index.html',
  'blog/mental-health/index.html',
  'blog/grief-support/index.html',
  'blog/serious-illness/index.html',
  'blog/encouragement/index.html'
];
subHubs.forEach(f => {
  if (fs.existsSync(path.join(ROOT, f))) {
    publicFiles.push(f);
  }
});

console.log(`Auditing ${publicFiles.length} pages for Technical & On-Page SEO...\n`);

let errors = 0;
let warnings = 0;

for (const relPath of publicFiles) {
  const fullPath = path.join(ROOT, relPath);
  if (!fs.existsSync(fullPath)) {
    console.log(`[MISSING] ${relPath}`);
    errors++;
    continue;
  }
  const content = fs.readFileSync(fullPath, 'utf8');
  const $ = cheerio.load(content);

  const title = $('title').text().trim();
  const metaDesc = $('meta[name="description"]').attr('content') || '';
  const canonical = $('link[rel="canonical"]').attr('href') || '';
  const robots = $('meta[name="robots"]').attr('content') || '';
  const ogTitle = $('meta[property="og:title"]').attr('content') || '';
  const ogDesc = $('meta[property="og:description"]').attr('content') || '';
  const ogUrl = $('meta[property="og:url"]').attr('content') || '';
  const ogImage = $('meta[property="og:image"]').attr('content') || '';
  const twitterCard = $('meta[name="twitter:card"]').attr('content') || '';
  const h1Count = $('h1').length;

  const issues = [];

  // 1. Title checks
  if (!title) {
    issues.push('Missing <title>');
  } else if (title.length < 50 || title.length > 60) {
    issues.push(`Title length ${title.length} (target: 50-60) -> "${title}"`);
  }

  // 2. Meta description checks
  if (!metaDesc) {
    issues.push('Missing meta description');
  } else if (metaDesc.length < 140 || metaDesc.length > 155) {
    issues.push(`Meta desc length ${metaDesc.length} (target: 140-155)`);
  }

  // 3. Robots checks
  if (relPath === 'view-card.html') {
    if (robots !== 'noindex, follow') issues.push(`view-card.html robots expected 'noindex, follow', got '${robots}'`);
  } else if (relPath === 'my-cards.html') {
    if (robots !== 'noindex, nofollow') issues.push(`my-cards.html robots expected 'noindex, nofollow', got '${robots}'`);
  }

  // 4. Canonical checks
  if (relPath !== 'my-cards.html') { // my-cards is noindex, nofollow
    if (!canonical) {
      issues.push('Missing canonical tag');
    } else if (!canonical.startsWith('https://thevibecheckproject.com')) {
      issues.push(`Canonical URL not absolute bare domain: ${canonical}`);
    }
  }

  // 5. Open Graph & Twitter
  if (!ogTitle) issues.push('Missing og:title');
  if (!ogDesc) issues.push('Missing og:description');
  if (!ogImage) issues.push('Missing og:image');
  if (!twitterCard) issues.push('Missing twitter:card');

  // 6. Heading hierarchy
  if (relPath !== 'view-card.html') { // view card is interactive card canvas
    if (h1Count !== 1) {
      issues.push(`Expected exactly 1 <h1>, found ${h1Count}`);
    }
  }

  // 7. JSON-LD checks
  const jsonLdScripts = $('script[type="application/ld+json"]');
  if (jsonLdScripts.length === 0 && !['view-card.html', 'my-cards.html'].includes(relPath)) {
    issues.push('Missing JSON-LD structured data');
  } else {
    jsonLdScripts.each((i, el) => {
      try {
        JSON.parse($(el).html());
      } catch (err) {
        issues.push(`Invalid JSON-LD syntax: ${err.message}`);
      }
    });
  }

  if (issues.length > 0) {
    console.log(`[ISSUES] ${relPath}:`);
    issues.forEach(iss => console.log(`   - ${iss}`));
    errors += issues.length;
  } else {
    console.log(`[OK] ${relPath} (Title: ${title.length}c, Desc: ${metaDesc.length}c, H1: ${h1Count}, Canonical: OK)`);
  }
}

console.log(`\nAudit finished with ${errors} issues.`);
