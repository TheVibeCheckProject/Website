/**
 * add-seo.js
 * Adds canonical tags, JSON-LD schema, and missing meta descriptions to all pages.
 * Safe to re-run — skips files that already have canonical tags.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const BASE_URL = 'https://www.thevibecheckproject.com';

// ─── helpers ────────────────────────────────────────────────────────────────

function readFile(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function writeFile(filePath, content) {
  fs.writeFileSync(filePath, content, 'utf8');
}

function extractMeta(html, property) {
  const match = html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']+)["']`, 'i'))
    || html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${property}["']`, 'i'));
  return match ? match[1] : null;
}

function extractTitle(html) {
  const match = html.match(/<title>([^<]+)<\/title>/i);
  return match ? match[1].replace(/\s*\|.*$/, '').replace(/\s*-.*$/, '').trim() : '';
}

function hasCanonical(html) {
  return /rel=["']canonical["']/.test(html);
}

function insertAfterOgUrl(html, insertion) {
  // Insert after the og:url line
  return html.replace(
    /(<meta[^>]+og:url[^>]+>)/i,
    `$1\n    ${insertion}`
  );
}

function insertBeforeClosingHead(html, insertion) {
  return html.replace('</head>', `    ${insertion}\n</head>`);
}

// ─── build JSON-LD for an Article page ──────────────────────────────────────

function buildArticleSchema(url, title, description) {
  return `<script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": ${JSON.stringify(title)},
      "description": ${JSON.stringify(description || '')},
      "url": ${JSON.stringify(url)},
      "publisher": {
        "@type": "Organization",
        "name": "The Vibe Check Project",
        "url": "https://www.thevibecheckproject.com"
      },
      "image": "https://www.thevibecheckproject.com/assets/og-image.png"
    }
    </script>`;
}

// ─── build JSON-LD for WebSite (homepage) ────────────────────────────────────

function buildWebSiteSchema() {
  return `<script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "The Vibe Check Project",
      "url": "https://www.thevibecheckproject.com",
      "description": "Send free anonymous affirmation cards, get daily uplifts in your inbox, and share good vibes with everyone who needs it.",
      "potentialAction": {
        "@type": "SearchAction",
        "target": "https://www.thevibecheckproject.com/blog/?q={search_term_string}",
        "query-input": "required name=search_term_string"
      }
    }
    </script>`;
}

// ─── process a blog post ─────────────────────────────────────────────────────

function processBlogPost(filePath) {
  let html = readFile(filePath);

  const title = extractMeta(html, 'og:title') || extractTitle(html);
  const description = extractMeta(html, 'description') || extractMeta(html, 'og:description') || '';

  const relativePath = path.relative(ROOT, filePath).replace(/\\/g, '/');
  const cleanPath = relativePath.endsWith('.html') ? relativePath.slice(0, -5) : relativePath;
  const canonicalUrl = `${BASE_URL}/${cleanPath}`;
  const canonical = `<link rel="canonical" href="${canonicalUrl}">`;
  const jsonLd = buildArticleSchema(canonicalUrl, title, description);

  // Sync og:url if it exists
  if (html.includes('og:url')) {
    html = html.replace(/(<meta[^>]+og:url[^>]+content=["'])([^"']+)(["'])/i, `$1${canonicalUrl}$3`);
  }

  // If has canonical, replace it. Otherwise insert it.
  if (hasCanonical(html)) {
    html = html.replace(/<link rel=["']canonical["'][^>]*>/i, canonical);
  } else {
    html = insertAfterOgUrl(html, canonical);
  }

  // Handle JSON-LD (update if exists OR insert)
  if (html.includes('application/ld+json')) {
    html = html.replace(/<script type=["']application\/ld\+json["']>[\s\S]*?<\/script>/i, jsonLd);
  } else {
    html = insertBeforeClosingHead(html, jsonLd);
  }

  writeFile(filePath, html);
  console.log(`  OK: ${path.relative(ROOT, filePath)}`);
}

// ─── process a main page ─────────────────────────────────────────────────────

function processMainPage(filePath, canonicalUrl, metaDescription, schemaHtml) {
  let html = readFile(filePath);

  if (hasCanonical(html)) {
    console.log(`  SKIP (already has canonical): ${path.relative(ROOT, filePath)}`);
    return;
  }

  const canonical = `<link rel="canonical" href="${canonicalUrl}">`;

  // Add meta description if missing
  if (metaDescription && !/<meta\s+name=["']description["']/.test(html)) {
    html = html.replace(
      /(<meta\s+name="viewport"[^>]+>)/i,
      `$1\n    <meta name="description" content="${metaDescription}">`
    );
  }

  // Insert canonical after og:url
  html = insertAfterOgUrl(html, canonical);

  // Insert JSON-LD before </head>
  if (schemaHtml) {
    html = insertBeforeClosingHead(html, schemaHtml);
  }

  writeFile(filePath, html);
  console.log(`  OK: ${path.relative(ROOT, filePath)}`);
}

// ─── main ────────────────────────────────────────────────────────────────────

console.log('\n=== Processing main pages ===');

// Homepage
processMainPage(
  path.join(ROOT, 'index.html'),
  `${BASE_URL}/`,
  null, // already has description
  buildWebSiteSchema()
);

// send-card.html
processMainPage(
  path.join(ROOT, 'send-card.html'),
  `${BASE_URL}/send-card.html`,
  'Send a free anonymous affirmation card to someone who needs to hear it. Pick a theme, write your message, and share the link — no account required.',
  null
);

// view-card.html
processMainPage(
  path.join(ROOT, 'view-card.html'),
  `${BASE_URL}/view-card.html`,
  "Someone sent you a Vibe Check — an anonymous affirmation card just for you. Open it and feel the good vibes.",
  null
);

// blog index
processMainPage(
  path.join(ROOT, 'blog', 'index.html'),
  `${BASE_URL}/blog/`,
  null,
  null
);

console.log('\n=== Processing blog posts ===');

function walkDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDir(fullPath);
    } else if (entry.name.endsWith('.html') && entry.name !== 'index.html') {
      processBlogPost(fullPath);
    } else if (entry.name === 'index.html' && dir !== path.join(ROOT, 'blog')) {
      processBlogPost(fullPath);
    }
  }
}

walkDir(path.join(ROOT, 'blog'));

console.log('\nDone.\n');
