const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const blogDir = path.join(__dirname, 'blog');
const indexFile = path.join(blogDir, 'index.html');

let html = fs.readFileSync(indexFile, 'utf-8');
const $ = cheerio.load(html, { decodeEntities: false });

const $grid = $('.blog-grid');
const posts = {};

$grid.find('a.blog-card-img').each(function () {
    const $el = $(this);
    const href = $el.attr('href');

    // Override covers for the last 3 identical posts
    if (href === 'why-you-should-send-affirmations-for-no-reason.html') {
        $el.attr('style', "background-image: url('../assets/blog_cover_affirmations_random.png');");
    } else if (href === 'the-people-who-seem-fine-need-you-most.html') {
        $el.attr('style', "background-image: url('../assets/blog_cover_friendship_1772534526563.png');");
    } else if (href === 'how-a-30-second-text-can-change-someones-day.html') {
        $el.attr('style', "background-image: url('../assets/blog_cover_new_job_1772534337585.png');");
    }

    posts[href] = $.html($el); // Getting the outerHTML of the element
});

const groups = [
    {
        title: "Mental Health & Crisis Support",
        desc: "When they are in the dark, these words provide a flashlight.",
        posts: [
            'what-to-text-someone-having-a-panic-attack.html',
            'what-to-say-when-someone-is-depressed.html',
            'what-to-say-to-someone-who-feels-like-giving-up.html',
            'how-to-support-a-friend-with-cancer.html',
            'how-to-comfort-someone-who-lost-a-loved-one.html'
        ]
    },
    {
        title: "Checking In & Showing Up",
        desc: "Ways to bridge the gap when someone goes quiet or life gets hard.",
        posts: [
            'how-to-check-on-a-friend-who-went-quiet.html',
            'the-people-who-seem-fine-need-you-most.html',
            'how-to-support-a-friend-going-through-a-breakup.html',
            'what-to-write-in-a-get-well-soon-card.html',
            'birthday-wishes-for-someone-going-through-a-hard-time.html',
            'how-to-be-a-better-friend.html',
            'ways-to-show-someone-you-care-without-words.html',
            'how-to-write-a-heartfelt-letter-to-a-friend.html',
            'how-a-30-second-text-can-change-someones-day.html',
            'why-you-should-send-affirmations-for-no-reason.html'
        ]
    },
    {
        title: "Encouragement & Motivation",
        desc: "Hype texts and grounding wisdom for big days and nervous moments.",
        posts: [
            'affirmations-to-send-someone-starting-a-new-job.html',
            'words-of-encouragement-for-someone-taking-a-big-risk.html',
            'encouraging-words-for-students-during-exams.html',
            'how-to-celebrate-a-friends-success.html'
        ]
    },
    {
        title: "Self-Care & Daily Habits",
        desc: "Tools to protect your own peace and build a stronger foundation.",
        posts: [
            'daily-affirmations-for-anxiety.html',
            'self-care-ideas-for-bad-mental-health-days.html',
            'positive-things-to-say-to-yourself-every-morning.html',
            'mindfulness-exercises-for-beginners.html'
        ]
    }
];

let newHtmlContent = '<div class="blog-categories-wrapper">';

groups.forEach(group => {
    newHtmlContent += `
        <section class="blog-category" style="margin-bottom: 80px;">
            <div style="text-align: center; margin-bottom: 40px;">
                <h2 style="font-size: 2.5rem; font-family: var(--font-display); color: var(--color-text-primary); margin-bottom: 15px;">${group.title}</h2>
                <p style="font-size: 1.1rem; color: var(--color-text-secondary); max-width: 600px; margin: 0 auto;">${group.desc}</p>
            </div>
            <div class="blog-grid" style="padding: 0 20px;">
    `;

    group.posts.forEach(href => {
        if (posts[href]) {
            newHtmlContent += posts[href] + '\n';
        }
    });

    newHtmlContent += `
            </div>
        </section>
    `;
});

newHtmlContent += '</div>';

$grid.replaceWith(newHtmlContent);

// Fix multiple instances of closing tags if any outerHTML hack caused weirdness
let finalHtml = $.html();

fs.writeFileSync(indexFile, finalHtml, 'utf-8');
console.log('Blog categorized successfully!');
