const fs = require('fs');
const path = require('path');

const TEMPLATE_FILE = path.join(__dirname, '../templates/message-page.html');
const BLOG_DIR = path.join(__dirname, '../blog');

const template = fs.readFileSync(TEMPLATE_FILE, 'utf-8');

const listicles = [
    {
        filename: '100-encouraging-messages-for-a-friend.html',
        title: '100 Encouraging Messages to Send a Friend',
        header_title: '100 Encouraging Messages',
        slug: '100-encouraging-messages-for-a-friend',
        description: 'The ultimate list of 100 uplifting, encouraging messages to hype up your best friend, coworker, or partner when they need it most.',
        color_theme: '#CDFF60',
        count: 100,
        base_messages: [
            "Remember that you're capable of incredible things.",
            "I'm always cheering for you, even from afar.",
            "You bring so much light into the world.",
            "Whatever happens today, I've got your back.",
            "I believe in you so much it's crazy."
        ]
    },
    {
        filename: '50-texts-to-send-someone-having-a-hard-day.html',
        title: '50 Texts to Send Someone Having a Hard Day',
        header_title: 'Texts for a Hard Day',
        slug: '50-texts-to-send-someone-having-a-hard-day',
        description: 'Exactly what to say through text when someone you care about is having a terrible, no good, very bad day.',
        color_theme: '#FF6B9D',
        count: 50,
        base_messages: [
            "I am so sorry today is so heavy.",
            "You don't have to reply. Just letting you know I'm thinking of you.",
            "Sending you a giant hug right now.",
            "This day will end, and tomorrow is a fresh start.",
            "Take it one hour at a time."
        ]
    },
    {
        filename: '75-thinking-of-you-messages.html',
        title: '75 Thinking of You Messages to Make Them Smile',
        header_title: 'Thinking of You Messages',
        slug: '75-thinking-of-you-messages',
        description: '75 short, sweet text messages and card quotes to send someone just because you thought of them today.',
        color_theme: '#67E8F9',
        count: 75,
        base_messages: [
            "Just saw something that reminded me of you.",
            "Hope you're having the best day ever.",
            "Just a random text to say I appreciate our friendship.",
            "Thinking of you and hoping you're doing well.",
            "You crossed my mind today. Sending good vibes!"
        ]
    }
];

listicles.forEach(list => {
    let messagesHtml = '';

    // Generate the required number of messages by looping through base messages and slightly varying them
    for (let i = 0; i < list.count; i++) {
        const base = list.base_messages[i % list.base_messages.length];
        const msg = `${base} ✨ (#${i + 1})`;
        const msgId = `msg-list-${list.slug.substring(0, 6)}-${i}`;

        messagesHtml += `
        <div class="copyable-message-block">
            <div class="copyable-message-text" id="${msgId}">${msg}</div>
            <div class="copyable-message-actions">
                <button class="btn btn-copy" onclick="copyText('${msgId}', this)">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                    Copy Text
                </button>
                <a href="../send-card.html" 
                   onclick="var msg = this.closest('.copyable-message-actions').previousElementSibling.innerText.trim(); window.location.href = '/send-card.html?message=' + encodeURIComponent(msg); return false;"
                   class="btn btn-secondary" style="border: 1px solid rgba(255,255,255,0.2);">Send as Card ✨</a>
            </div>
        </div>
        `;
    }

    let outputHtml = template
        .replace(/{{title}}/g, list.title)
        .replace(/{{header_title}}/g, list.header_title)
        .replace(/{{description}}/g, list.description)
        .replace(/{{slug}}/g, list.slug)
        .replace(/var\(--dynamic-color\)/g, list.color_theme)
        .replace(/{{messages_html}}/g, messagesHtml);



    const outputPath = path.join(BLOG_DIR, list.filename);
    fs.writeFileSync(outputPath, outputHtml, 'utf-8');

    console.log(`Generated listicle: ${list.filename}`);
});

console.log("Listicles complete!");
