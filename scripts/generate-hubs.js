const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const BLOG_DIR = path.join(__dirname, '../blog');
const INDEX_HTML = path.join(BLOG_DIR, 'index.html');

const sourceHtml = fs.readFileSync(INDEX_HTML, 'utf-8');
const $ = cheerio.load(sourceHtml);

// 1. Extract all blog cards
const allCards = [];
$('.blog-card-img').each((i, el) => {
    const $card = $(el).clone();
    const href = $card.attr('href');
    if (href && !href.startsWith('http')) {
        allCards.push({
            href: href,
            html: $.html($card)
        });
    }
});

// Remove duplicates based on href
const uniqueCards = [];
const seen = new Set();
for (const card of allCards) {
    if (!seen.has(card.href)) {
        seen.add(card.href);
        uniqueCards.push(card);
    }
}

// 2. Define our 4 categories
const categories = [
    {
        id: 'mental-health',
        title: 'Mental Health Support',
        desc: 'Find supportive words, text ideas, and guidance for anxiety, depression, and mental wellness. Practical, grounding peer support for friends in need.',
        files: [
            'what-to-text-someone-having-a-panic-attack.html',
            'what-to-say-when-someone-is-depressed.html',
            'what-to-say-to-someone-who-feels-like-giving-up.html',
            'daily-affirmations-for-anxiety.html',
            'self-care-ideas-for-bad-mental-health-days.html',
            'mindfulness-exercises-for-beginners.html',
            'positive-things-to-say-to-yourself-every-morning.html',
            'how-to-check-on-a-friend-who-went-quiet.html',
            'the-people-who-seem-fine-need-you-most.html',
            'how-to-be-a-better-friend.html'
        ]
    },
    {
        id: 'grief-support',
        title: 'Grief & Loss Support',
        desc: 'Find thoughtful words, sympathy texts, and caring advice when someone you love is grieving. Genuine comfort, kindness, and support that truly helps.',
        files: [
            'how-to-comfort-someone-who-lost-a-loved-one.html',
            'how-to-support-a-friend-going-through-a-breakup.html',
            'what-to-say-to-someone-who-feels-like-giving-up.html'
        ]
    },
    {
        id: 'serious-illness',
        title: 'Serious Illness Support',
        desc: 'Learn what to say, what to do, and what to avoid when someone you love receives a serious illness diagnosis or spends extended time in the hospital.',
        files: [
            'how-to-support-a-friend-with-cancer.html',
            'what-to-write-in-a-get-well-soon-card.html',
            'how-a-30-second-text-can-change-someones-day.html'
        ]
    },
    {
        id: 'encouragement',
        title: 'Encouragement & Motivation',
        desc: 'Discover uplifting text messages and grounding affirmations for big days, nervous moments, new jobs, exams, and everyday friend encouragement.',
        files: [
            'words-of-encouragement-for-someone-taking-a-big-risk.html',
            'affirmations-to-send-someone-starting-a-new-job.html',
            'encouraging-words-for-students-during-exams.html',
            'how-to-celebrate-a-friends-success.html',
            'why-you-should-send-affirmations-for-no-reason.html',
            'how-a-30-second-text-can-change-someones-day.html',
            'ways-to-show-someone-you-care-without-words.html',
            'how-to-write-a-heartfelt-letter-to-a-friend.html',
            'birthday-wishes-for-someone-going-through-a-hard-time.html'
        ]
    }
];

// Helper to fix relative URLs for deeper directory (blog/category/index.html is 2 levels deep)
function fixUrls(html) {
    let fixed = html;

    // Fix asset/CSS/JS references - since these pages are in blog/category/ (2 levels deep),
    // they need ../../ to reach the root assets.
    fixed = fixed.replace(/(href|src)="(\.\.\/)+([^"]+)"/g, '$1="../../$3"');
    fixed = fixed.replace(/url\(\'\.\.\//g, "url('../../");

    // Fix links to sibling HTML files in the blog/ folder - they are 1 level up from blog/category/
    fixed = fixed.replace(/(href)="([a-zA-Z0-9-]+\.html)(#[^"]*)?"/g, '$1="../$2$3"');
    fixed = fixed.replace(/(href)="(\.\/)?([a-zA-Z0-9-]+\.html)(#[^"]*)?"/g, '$1="../$3$4"');

    // Specifically fix the blog index link (which is in the parent blog/ folder)
    fixed = fixed.replace(/href="\.\.\/index\.html"/g, 'href="../index.html"');

    // Fix root-relative links if any were missed
    fixed = fixed.replace(/(href|src)="\/([^"]+)"/g, '$1="../../$2"');

    return fixed;
}

// 3. Generate each hub page
categories.forEach(cat => {
    const $hub = cheerio.load(sourceHtml);

    const canonicalUrl = `https://thevibecheckproject.com/blog/${cat.id}/`;
    const pageTitle = `${cat.title} - Guides | The Vibe Check Project`;

    // Update title, meta, canonical, and social tags
    $hub('title').text(pageTitle);
    $hub('meta[name="description"]').attr('content', cat.desc);
    $hub('link[rel="canonical"]').attr('href', canonicalUrl);
    $hub('meta[property="og:url"]').attr('content', canonicalUrl);
    $hub('meta[property="og:title"]').attr('content', pageTitle);
    $hub('meta[property="og:description"]').attr('content', cat.desc);
    $hub('meta[name="twitter:title"]').attr('content', pageTitle);
    $hub('meta[name="twitter:description"]').attr('content', cat.desc);

    // Update Header Text to the category title
    $hub('.pre-text').text('');
    $hub('.drop-v').text('');
    $hub('.rest-text').html(`${cat.title}`);
    $hub('.sub-desc').text(cat.desc);

    // Remove the slider and crisis chip
    $hub('.slider-wrapper').remove();

    // Remove all existing grids and crisis sections
    $hub('.crisis-section').remove();
    $hub('.category-grid').remove();

    // Recreate a single grid for this category
    const gridHtml = `
    <div class="category-grid active" style="display: block;">
        <div class="blog-grid">
            ${cat.files.map(file => {
        const card = uniqueCards.find(c => c.href === file || c.href.includes(file));
        return card ? card.html : '';
    }).join('\n')}
        </div>
    </div>
    `;

    // Insert new grid right after the .sub-desc paragraph
    $hub('.sub-desc').after(gridHtml);

    // Inject structured data for CollectionPage and BreadcrumbList
    const hubSchema = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "CollectionPage",
                "@id": `${canonicalUrl}#collection`,
                "url": canonicalUrl,
                "name": `${cat.title} Guides`,
                "description": cat.desc,
                "publisher": {
                    "@type": "Organization",
                    "name": "The Vibe Check Project",
                    "url": "https://thevibecheckproject.com/"
                }
            },
            {
                "@type": "BreadcrumbList",
                "@id": `${canonicalUrl}#breadcrumb`,
                "itemListElement": [
                    {
                        "@type": "ListItem",
                        "position": 1,
                        "name": "Home",
                        "item": "https://thevibecheckproject.com/"
                    },
                    {
                        "@type": "ListItem",
                        "position": 2,
                        "name": "Blog",
                        "item": "https://thevibecheckproject.com/blog/"
                    },
                    {
                        "@type": "ListItem",
                        "position": 3,
                        "name": cat.title,
                        "item": canonicalUrl
                    }
                ]
            }
        ]
    };
    $hub('script[type="application/ld+json"]').remove();
    $hub('head').append(`\n    <script type="application/ld+json">\n    ${JSON.stringify(hubSchema, null, 2)}\n    </script>\n`);

    // Fix URLs in the generated HTML
    let finalHtml = fixUrls($hub.html());

    // Create directory
    const catDir = path.join(BLOG_DIR, cat.id);
    if (!fs.existsSync(catDir)) {
        fs.mkdirSync(catDir, { recursive: true });
    }

    // Write index.html
    fs.writeFileSync(path.join(catDir, 'index.html'), finalHtml, 'utf-8');
    console.log(`Generated ${cat.id}/index.html`);
});

console.log("Finished generating category hubs!");
