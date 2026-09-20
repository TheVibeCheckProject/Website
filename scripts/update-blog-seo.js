const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const ROOT = path.join(__dirname, '..');
const BLOG_DIR = path.join(ROOT, 'blog');

const postsData = [
  {
    file: 'affirmations-to-send-someone-starting-a-new-job.html',
    title: 'New Job Affirmations - First Day | The Vibe Check Project',
    desc: 'Send comforting affirmations and encouraging texts to a friend starting a new job. Ease first-day imposter syndrome with thoughtful, uplifting words.',
    breadcrumb: 'New Job Affirmations',
    isSubHub: false
  },
  {
    file: 'birthday-wishes-for-someone-going-through-a-hard-time.html',
    title: 'Hard Time Birthday Wishes - Support | The Vibe Check Project',
    desc: 'What to write in a birthday card for someone having a difficult year. Compassionate, heartfelt birthday wishes that acknowledge hardships with love.',
    breadcrumb: 'Hard Time Birthday Wishes',
    isSubHub: false
  },
  {
    file: 'daily-affirmations-for-anxiety.html',
    title: 'Anxiety Affirmations - Daily Calm | The Vibe Check Project',
    desc: 'Discover 30 soothing daily affirmations for anxiety and racing thoughts. Ground your mind, release daily stress, and restore inner peace in minutes.',
    breadcrumb: 'Affirmations for Anxiety',
    isSubHub: false
  },
  {
    file: 'encouraging-words-for-students-during-exams.html',
    title: 'Exam Encouragement - Student Words | The Vibe Check Project',
    desc: 'Share positive, stress-relieving encouragement with students studying for big exams or finals. Uplifting messages to boost confidence and motivation.',
    breadcrumb: 'Exam Encouragement Words',
    isSubHub: false
  },
  {
    file: 'how-a-30-second-text-can-change-someones-day.html',
    title: 'Quick Encouraging Texts - Impact | The Vibe Check Project',
    desc: "Discover how sending a simple 30-second text message can completely transform someone's day. Practical examples and psychology behind daily kindness.",
    breadcrumb: 'Quick Encouraging Texts',
    isSubHub: false
  },
  {
    file: 'how-to-be-a-better-friend.html',
    title: 'How to Be a Better Friend - Habits | The Vibe Check Project',
    desc: 'Learn 12 actionable ways to be a more supportive, attentive, and reliable friend. Practical advice on communication, presence, and lasting loyalty.',
    breadcrumb: 'How to Be a Better Friend',
    isSubHub: false
  },
  {
    file: 'how-to-celebrate-a-friends-success.html',
    title: 'Celebrate Friend Success - Hype Up | The Vibe Check Project',
    desc: "Learn how to genuinely celebrate a friend's big milestone or win, even when you are personally struggling. Compassionate advice and copyable hype texts.",
    breadcrumb: 'Celebrate Friend Success',
    isSubHub: false
  },
  {
    file: 'how-to-check-on-a-friend-who-went-quiet.html',
    title: 'Check on Quiet Friends - Text Ideas | The Vibe Check Project',
    desc: 'How to check on a friend who went quiet or pulled away without making them feel overwhelmed or guilty. Low-pressure texts and gentle empathy tips.',
    breadcrumb: 'Check on Quiet Friends',
    isSubHub: false
  },
  {
    file: 'how-to-comfort-someone-who-lost-a-loved-one.html',
    title: 'Comforting Grief Words - Support | The Vibe Check Project',
    desc: 'Compassionate guides on comforting someone who lost a loved one. Thoughtful sympathy messages and supportive actions that provide meaningful comfort.',
    breadcrumb: 'Comforting Grief Words',
    isSubHub: false
  },
  {
    file: 'how-to-support-a-friend-going-through-a-breakup.html',
    title: 'Breakup Support Guide - What to Say | The Vibe Check Project',
    desc: 'Practical advice on supporting a close friend navigating a devastating breakup. Avoid hurtful cliches and send comforting texts that truly help them heal.',
    breadcrumb: 'Breakup Support Guide',
    isSubHub: false
  },
  {
    file: 'how-to-support-a-friend-with-cancer.html',
    title: 'Support a Friend with Cancer - Care | The Vibe Check Project',
    desc: 'Meaningful ways to support a loved one diagnosed with cancer or serious illness. Learn what to say, what to avoid, and helpful care actions to take.',
    breadcrumb: 'Support a Friend with Cancer',
    isSubHub: false
  },
  {
    file: 'how-to-write-a-heartfelt-letter-to-a-friend.html',
    title: 'Heartfelt Letter to Friend - Guide | The Vibe Check Project',
    desc: 'Step-by-step guidance on writing a meaningful, heartfelt appreciation letter to a close friend. Express gratitude and strengthen your friendship bond.',
    breadcrumb: 'Heartfelt Friendship Letter',
    isSubHub: false
  },
  {
    file: 'mindfulness-exercises-for-beginners.html',
    title: 'Mindfulness for Beginners - Calm | The Vibe Check Project',
    desc: 'Simple 5-minute mindfulness exercises and breathing techniques for beginners. Learn how to pause, ground yourself, and reduce anxiety anywhere, anytime.',
    breadcrumb: 'Mindfulness for Beginners',
    isSubHub: false
  },
  {
    file: 'positive-things-to-say-to-yourself-every-morning.html',
    title: 'Morning Affirmations - Daily Start | The Vibe Check Project',
    desc: 'Start each day centered with 25 empowering positive affirmations. Cultivate resilience, reduce morning stress, and set a grounded, confident intention.',
    breadcrumb: 'Morning Affirmations',
    isSubHub: false
  },
  {
    file: 'self-care-ideas-for-bad-mental-health-days.html',
    title: 'Bad Mental Health Days - Self-Care | The Vibe Check Project',
    desc: 'Low-energy self-care ideas and realistic coping tips for bad mental health days when getting out of bed feels hard. Be gentle with yourself today.',
    breadcrumb: 'Self-Care for Hard Days',
    isSubHub: false
  },
  {
    file: 'the-people-who-seem-fine-need-you-most.html',
    title: 'Check on Strong Friends - Empathy | The Vibe Check Project',
    desc: 'Why the strong friends who always seem fine often need support the most. Learn how to recognize quiet struggles and show up for resilient loved ones.',
    breadcrumb: 'Check on Strong Friends',
    isSubHub: false
  },
  {
    file: 'ways-to-show-someone-you-care-without-words.html',
    title: 'Show You Care Without Words - Acts | The Vibe Check Project',
    desc: 'Actions speak louder than texts. Explore meaningful, non-verbal ways to show love, support, and care for someone going through a challenging time.',
    breadcrumb: 'Show You Care Without Words',
    isSubHub: false
  },
  {
    file: 'what-to-say-to-someone-who-feels-like-giving-up.html',
    title: 'Words When Giving Up - Compassion | The Vibe Check Project',
    desc: 'Compassionate, grounded words to share when someone you care about feels hopeless or exhausted. Validate pain and remind them they are not alone.',
    breadcrumb: 'Words When Giving Up',
    isSubHub: false
  },
  {
    file: 'what-to-say-when-someone-is-depressed.html',
    title: 'What to Say to Depressed Friends | The Vibe Check Project',
    desc: 'Helpful, loving things you can say to a friend dealing with depression—and what to avoid. Empathetic peer support to help them through heavy days.',
    breadcrumb: 'What to Say for Depression',
    isSubHub: false
  },
  {
    file: 'what-to-text-someone-having-a-panic-attack.html',
    title: 'Panic Attack Texts - Grounding | The Vibe Check Project',
    desc: 'Exact calming text messages you can send someone currently having a panic attack. Grounding, step-by-step guidance to help them regain steady breath.',
    breadcrumb: 'Panic Attack Texts',
    isSubHub: false
  },
  {
    file: 'what-to-write-in-a-get-well-soon-card.html',
    title: 'Get Well Soon Messages - Quotes | The Vibe Check Project',
    desc: 'Heartfelt get well soon messages and card wishes for illness, surgery, or recovery. Thoughtful words that bring genuine comfort and encouragement.',
    breadcrumb: 'Get Well Soon Messages',
    isSubHub: false
  },
  {
    file: 'why-you-should-send-affirmations-for-no-reason.html',
    title: 'Send Affirmations - Just Because | The Vibe Check Project',
    desc: 'Why sending unexpected affirmations out of nowhere strengthens bonds and sparks genuine joy. Discover the positive impact of spontaneous kindness.',
    breadcrumb: 'Send Affirmations Just Because',
    isSubHub: false
  },
  {
    file: 'words-of-encouragement-for-someone-taking-a-big-risk.html',
    title: 'Big Risk Encouragement - Hype Words | The Vibe Check Project',
    desc: 'Inspiring words of encouragement for a friend taking a bold leap or risk. Build confidence, quell fear, and cheer them on with uplifting support.',
    breadcrumb: 'Big Risk Encouragement',
    isSubHub: false
  },
  // Sub-hubs
  {
    file: 'breakup-support-messages/index.html',
    title: 'Breakup Support Texts - Healing | The Vibe Check Project',
    desc: 'Empathetic text messages and card quotes to comfort a friend crying through heartbreak or a breakup. Thoughtful words to remind them they are loved.',
    breadcrumb: 'Breakup Support Texts',
    isSubHub: true
  },
  {
    file: 'encouraging-messages-for-cards/index.html',
    title: 'Encouraging Card Messages - Hype | The Vibe Check Project',
    desc: 'Copyable encouraging messages and quotes to write in a greeting card or send via text. Uplifting words to motivate, inspire, and brighten their day.',
    breadcrumb: 'Encouraging Card Messages',
    isSubHub: true
  },
  {
    file: 'just-because-messages/index.html',
    title: 'Just Because Messages - Friendship | The Vibe Check Project',
    desc: 'Short, sweet text messages and quotes to send someone just because you were thinking of them today. Brighten their day with unexpected positivity.',
    breadcrumb: 'Just Because Messages',
    isSubHub: true
  },
  {
    file: 'sympathy-card-messages/index.html',
    title: 'Sympathy Card Messages - Comfort | The Vibe Check Project',
    desc: 'Heartfelt sympathy messages to write in a condolence card or text when words fail. Offer sincere support and comfort to someone grieving a loved one.',
    breadcrumb: 'Sympathy Card Messages',
    isSubHub: true
  },
  {
    file: 'texts-for-anxiety/index.html',
    title: 'Texts for Anxiety - Calming Words | The Vibe Check Project',
    desc: 'Grounding, supportive text messages you can send someone who is feeling anxious, spiraling, or overwhelmed right now. Reassure them with steady love.',
    breadcrumb: 'Texts for Anxiety',
    isSubHub: true
  }
];

postsData.forEach(p => {
  const fullPath = path.join(BLOG_DIR, p.file);
  if (!fs.existsSync(fullPath)) {
    console.error(`File missing: ${p.file}`);
    return;
  }
  let html = fs.readFileSync(fullPath, 'utf8');
  const $ = cheerio.load(html);

  const slug = p.file.endsWith('.html') && !p.isSubHub ? p.file.slice(0, -5) : p.file.replace('/index.html', '');
  const canonicalUrl = p.isSubHub 
    ? `https://thevibecheckproject.com/blog/${slug}/`
    : `https://thevibecheckproject.com/blog/${slug}`;

  // 1. Title & Meta
  $('title').text(p.title);
  $('meta[name="description"]').attr('content', p.desc);

  // 2. Canonical
  if ($('link[rel="canonical"]').length > 0) {
    $('link[rel="canonical"]').attr('href', canonicalUrl);
  } else {
    $('head').append(`    <link rel="canonical" href="${canonicalUrl}">\n`);
  }

  // 3. Open Graph
  $('meta[property="og:title"]').attr('content', p.title);
  $('meta[property="og:description"]').attr('content', p.desc);
  $('meta[property="og:url"]').attr('content', canonicalUrl);
  if (!$('meta[property="og:image"]').length) {
    $('head').append(`    <meta property="og:image" content="https://thevibecheckproject.com/assets/og-image.png">\n`);
  }
  if (!$('meta[property="og:image:width"]').length) {
    $('head').append(`    <meta property="og:image:width" content="1200">\n`);
  } else {
    $('meta[property="og:image:width"]').attr('content', '1200');
  }
  if (!$('meta[property="og:image:height"]').length) {
    $('head').append(`    <meta property="og:image:height" content="630">\n`);
  } else {
    $('meta[property="og:image:height"]').attr('content', '630');
  }

  // 4. Twitter Card
  if (!$('meta[name="twitter:card"]').length) {
    $('head').append(`    <meta name="twitter:card" content="summary_large_image">\n`);
  }
  if (!$('meta[name="twitter:title"]').length) {
    $('head').append(`    <meta name="twitter:title" content="${p.title}">\n`);
  } else {
    $('meta[name="twitter:title"]').attr('content', p.title);
  }
  if (!$('meta[name="twitter:description"]').length) {
    $('head').append(`    <meta name="twitter:description" content="${p.desc}">\n`);
  } else {
    $('meta[name="twitter:description"]').attr('content', p.desc);
  }
  if (!$('meta[name="twitter:image"]').length) {
    $('head').append(`    <meta name="twitter:image" content="https://thevibecheckproject.com/assets/og-image.png">\n`);
  }

  // 5. Structured Data (Article + BreadcrumbList)
  $('script[type="application/ld+json"]').remove();
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": p.isSubHub ? "CollectionPage" : "Article",
        "@id": `${canonicalUrl}#article`,
        "headline": p.title.replace(/\s*\|\s*The Vibe Check Project$/, ''),
        "description": p.desc,
        "url": canonicalUrl,
        "mainEntityOfPage": canonicalUrl,
        "publisher": {
          "@type": "Organization",
          "name": "The Vibe Check Project",
          "url": "https://thevibecheckproject.com/",
          "logo": {
            "@type": "ImageObject",
            "url": "https://thevibecheckproject.com/assets/og-image.png"
          }
        },
        "image": "https://thevibecheckproject.com/assets/og-image.png",
        "author": {
          "@type": "Organization",
          "name": "The Vibe Check Project"
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
            "name": p.breadcrumb,
            "item": canonicalUrl
          }
        ]
      }
    ]
  };
  $('head').append(`\n    <script type="application/ld+json">\n    ${JSON.stringify(schema, null, 2)}\n    </script>\n`);

  // 6. Image optimizations (protect Core Web Vitals)
  $('img').each((i, el) => {
    const $img = $(el);
    const src = $img.attr('src') || '';
    if (src.includes('blog_cover_')) {
      if (!$img.attr('width')) $img.attr('width', '600');
      if (!$img.attr('height')) $img.attr('height', '400');
      if (!$img.attr('loading')) $img.attr('loading', 'lazy');
      if (!$img.attr('alt') || $img.attr('alt').trim() === '') {
        $img.attr('alt', p.breadcrumb);
      }
    } else if (src.includes('atomic_habits_mockup')) {
      if (!$img.attr('width')) $img.attr('width', '400');
      if (!$img.attr('height')) $img.attr('height', '400');
      if (!$img.attr('loading')) $img.attr('loading', 'lazy');
      $img.attr('alt', 'Atomic Habits book mockup');
    } else if (src.includes('maybe_talk_to_someone_mockup')) {
      if (!$img.attr('width')) $img.attr('width', '400');
      if (!$img.attr('height')) $img.attr('height', '400');
      if (!$img.attr('loading')) $img.attr('loading', 'lazy');
      $img.attr('alt', 'Maybe You Should Talk to Someone book mockup');
    }
  });

  fs.writeFileSync(fullPath, $.html(), 'utf8');
  console.log(`Updated SEO: ${p.file}`);
});

console.log('Finished updating all blog posts and sub-hubs!');
