const fs = require('fs');
const path = require('path');

const blogDir = path.join(__dirname, 'blog');
const files = fs.readdirSync(blogDir).filter(f => f.endsWith('.html') && f !== 'index.html');

// Map of post names to image filenames. We have 14 new images, plus the original panic attack one (15 total).
// Let's use them and repeat a few for the last 5 posts so they all have a cover image.
const imageMap = {
    'what-to-text-someone-having-a-panic-attack.html': 'blog_cover_panic.png',
    'how-to-check-on-a-friend-who-went-quiet.html': 'blog_cover_quiet_1772534313015.png',
    'how-to-support-a-friend-going-through-a-breakup.html': 'blog_cover_breakup_1772534324219.png',
    'affirmations-to-send-someone-starting-a-new-job.html': 'blog_cover_new_job_1772534337585.png',
    'words-of-encouragement-for-someone-taking-a-big-risk.html': 'blog_cover_risk_1772534353037.png',
    'how-to-comfort-someone-who-lost-a-loved-one.html': 'blog_cover_grief_1772534407866.png',
    'what-to-say-when-someone-is-depressed.html': 'blog_cover_depression_1772534420076.png',
    'encouraging-words-for-students-during-exams.html': 'blog_cover_exams_1772534436768.png',
    'how-to-celebrate-a-friends-success.html': 'blog_cover_success_1772534454340.png',
    'what-to-write-in-a-get-well-soon-card.html': 'blog_cover_get_well_1772534500993.png',
    'daily-affirmations-for-anxiety.html': 'blog_cover_anxiety_1772534512339.png',
    'how-to-be-a-better-friend.html': 'blog_cover_friendship_1772534526563.png',
    'self-care-ideas-for-bad-mental-health-days.html': 'blog_cover_self_care_1772534542941.png',
    'positive-things-to-say-to-yourself-every-morning.html': 'blog_cover_morning_1772534601600.png',
    'how-to-support-a-friend-with-cancer.html': 'blog_cover_cancer_1772534614299.png',
    'birthday-wishes-for-someone-going-through-a-hard-time.html': 'blog_cover_birthday_1772534627129.png',
    'what-to-say-to-someone-who-feels-like-giving-up.html': 'blog_cover_giving_up_1772534638363.png',
    'ways-to-show-someone-you-care-without-words.html': 'blog_cover_friendship_1772534526563.png', // Fallback
    'how-to-write-a-heartfelt-letter-to-a-friend.html': 'blog_cover_success_1772534454340.png', // Fallback
    'mindfulness-exercises-for-beginners.html': 'blog_cover_quiet_1772534313015.png' // Fallback
};

// 1. Update individual blog post "Keep Reading" sections
for (const file of files) {
    const filePath = path.join(blogDir, file);
    let html = fs.readFileSync(filePath, 'utf-8');

    // For the small "Keep Reading" links, we can inject a simpler version of the card
    // The current pattern is: 
    // <a href="..." style="...">
    //    <span style="...">Tag</span>
    //    <h4 style="...">Title</h4>
    // </a>

    // We will find all related links and upgrade them to use the new CSS classes
    const relatedLinkRegex = /<a href="([^"]+\.html)"[^>]*>[\s\S]*?<span[^>]*>(.*?)<\/span>[\s\S]*?<h4[^>]*>(.*?)<\/h4>[\s\S]*?<\/a>/g;

    html = html.replace(relatedLinkRegex, (match, href, tag, title) => {
        const imageName = imageMap[href] || 'blog_cover_panic.png';
        return `
                <a href="${href}" class="blog-card-img" style="background-image: url('../assets/${imageName}'); height: 300px; margin-bottom: 20px;">
                    <div class="color-overlay"></div>
                    <div class="gradient-overlay"></div>
                    <div class="title-content" style="margin-top: 60px;">
                        <span class="blog-tag">${tag}</span>
                        <h2 style="font-size: 1.4rem;">${title}</h2>
                    </div>
                </a>`;
    });

    // Also inject the CSS link for Baloo 2 if not present (Wait, google fonts are already in the head)
    // Save file
    fs.writeFileSync(filePath, html, 'utf-8');
}

// 2. Update blog/index.html to upgrade all existing `.blog-card` elements to `.blog-card-img`
const indexFilePath = path.join(blogDir, 'index.html');
let indexHtml = fs.readFileSync(indexFilePath, 'utf-8');

// Pattern for main index cards
const mainCardRegex = /<a href="([^"]+\.html)" class="blog-card">[\s\S]*?<span class="blog-tag">(.*?)<\/span>[\s\S]*?<h2>(.*?)<\/h2>[\s\S]*?<p>(.*?)<\/p>[\s]*<div class="read-more">([\s\S]*?)<\/div>[\s]*<\/a>/g;

indexHtml = indexHtml.replace(mainCardRegex, (match, href, tag, title, excerpt, readMoreContent) => {
    const imageName = imageMap[href] || 'blog_cover_panic.png';
    return `
            <a href="${href}" class="blog-card-img" style="background-image: url('../assets/${imageName}');">
                <div class="color-overlay"></div>
                <div class="gradient-overlay"></div>
                
                <div class="title-content">
                    <span class="blog-tag">${tag}</span>
                    <h2>${title}</h2>
                </div>
                
                <div class="card-info">
                    <p>${excerpt}</p>
                    <div class="read-more-btn">
                        Read Guide 
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                            <polyline points="12 5 19 12 12 19"></polyline>
                        </svg>
                    </div>
                </div>
            </a>`;
});

// Remove the old CSS block from blog/index.html to rely on styles.css
indexHtml = indexHtml.replace(/\/\* --- New Image-Backed Card Mockup --- \*\/[\s\S]*?(?=\/\* Banner CTA \*\/)/g, '');

fs.writeFileSync(indexFilePath, indexHtml, 'utf-8');
console.log('Blog update complete.');
