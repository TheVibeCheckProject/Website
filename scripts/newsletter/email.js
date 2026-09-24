// Daily email: shared by send-newsletter.js (renders + checks at send time) and
// generate-batch.mjs (checks generated content before saving it).
//
// A batch.json entry:
//   { date, type: 'AFFIRMATION' | 'OCCASION', occasion?, subject, preview_text,
//     intro, affirmation, reflection }
// HTML is built at send time, so a design change applies to every queued email.

const SITE = 'https://thevibecheckproject.com';

// Same palette as the welcome emails (docs/email/)
const C = { bg: '#1A1625', card: '#241E33', text: '#EDE8F5', muted: '#C9BFDA', pink: '#FF6B9D', gold: '#FEC84A', rule: '#3A3150' };
const FONT = "'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Opens send-card.html with today's affirmation already on the card (free for everyone:
// it is our own content, see handleExternalMessage in js/send-card-logic.js)
function shareUrl(email) {
    const q = new URLSearchParams({
        message: email.affirmation,
        utm_source: 'mailerlite', utm_medium: 'email', utm_campaign: 'daily_' + email.date,
    });
    return `${SITE}/send-card.html?${q.toString()}`;
}

function renderEmail(email) {
    const p = (text, style = '') => `<p style="margin:0 0 16px;${style}">${esc(text)}</p>`;
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="dark">
<meta name="supported-color-schemes" content="dark">
<title>${esc(email.subject)}</title>
</head>
<body style="margin:0;padding:0;background-color:${C.bg};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(email.preview_text)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${C.bg};">
<tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;background-color:${C.bg};font-family:${FONT};font-size:17px;line-height:1.6;color:${C.text};">
<tr><td style="padding:0 8px;">
${p(`Hi {$name|default('there')},`)}
${email.intro ? p(email.intro) : ''}
</td></tr>
<tr><td style="padding:12px 8px 28px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
<tr><td align="center" style="padding:32px 28px;background-color:${C.card};border-radius:16px;border-top:4px solid ${C.pink};">
<p style="margin:0 0 14px;font-family:${FONT};font-size:12px;font-weight:700;letter-spacing:3px;color:${C.gold};">TODAY'S VIBE</p>
<p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-style:italic;font-size:24px;line-height:1.4;color:${C.text};">&ldquo;${esc(email.affirmation)}&rdquo;</p>
</td></tr>
</table>
</td></tr>
<tr><td style="padding:0 8px;">
${p(email.reflection)}
</td></tr>
<tr><td align="center" style="padding:12px 8px 28px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
<td align="center" bgcolor="${C.pink}" style="border-radius:999px;">
<a href="${esc(shareUrl(email))}" style="display:inline-block;padding:14px 30px;font-family:${FONT};font-size:17px;font-weight:700;color:${C.bg};text-decoration:none;border-radius:999px;">Send this to someone</a>
</td></tr></table>
</td></tr>
<tr><td style="padding:0 8px 32px;">
<p style="margin:0;">With warmth,<br><span style="color:${C.gold};font-weight:700;">The Vibe Check Project</span></p>
</td></tr>
<tr><td style="padding:20px 8px 0;border-top:1px solid ${C.rule};font-size:13px;line-height:1.5;color:${C.muted};">
<p style="margin:0 0 8px;">You're getting this because you signed up for daily vibes at <a href="${SITE}" style="color:${C.muted};">thevibecheckproject.com</a>.</p>
<p style="margin:0;"><a href="{$unsubscribe}" style="color:${C.muted};">Unsubscribe</a></p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

// Invented people and events must never go out (Sept 2026: AI-written "stories" such as
// "a friend of mine found a sticky note" were sent as if true). Also no statistics.
const STORY_PATTERNS = [
    // ("a friend" alone is fine: "send this to a friend")
    /\b(a|my|our|her|his) (woman|man|girl|guy|mom|mum|dad|mother|father|coworker|co-worker|roommate|stranger|barista|cashier|neighbou?r|reader|subscriber)\b/i,
    /\b(friend of (mine|ours)|my friend|her friend|his friend)\b/i,
    // Affirmations talk to "you"; he/she/her/his only ever show up in a story about someone
    /\b(she|he|her|hers|him|his)\b/i,
    /\b(they) (said|says|told|called|cried|found|sent|kept|wrote|replied|texted|laughed|smiled|remembered|realized)\b/i,
    /\b(grandma|grandpa|grandmother|grandfather|best friend)\b/i,
    /\b(true story|once upon|last (week|month|year),)\b/i,
    /\b\d+ years? (ago|later)\b/i,
    /\b(studies|research|science|experts) (show|shows|say|says|suggest)\b/i,
    /\b\d+(\.\d+)?\s?%/,
];

function checkEmail(email) {
    const problems = [];
    const need = ['date', 'type', 'subject', 'preview_text', 'affirmation', 'reflection'];
    for (const k of need) if (!email[k] || typeof email[k] !== 'string') problems.push(`missing ${k}`);
    if (email.intro != null && typeof email.intro !== 'string') problems.push('intro must be text');
    if (problems.length) return problems;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(email.date)) problems.push('bad date');
    if (!['AFFIRMATION', 'OCCASION'].includes(email.type)) problems.push(`type must be AFFIRMATION or OCCASION, got ${email.type}`);
    if (email.type === 'OCCASION' && !email.occasion) problems.push('OCCASION needs the occasion name');
    if (email.affirmation.length > 160) problems.push('affirmation over 160 characters');
    if (email.subject.length > 70) problems.push('subject over 70 characters');
    if (email.preview_text.length > 110) problems.push('preview_text over 110 characters');
    const text = [email.subject, email.preview_text, email.intro || '', email.affirmation, email.reflection].join('\n');
    for (const re of STORY_PATTERNS) {
        const m = text.match(re);
        if (m) problems.push(`reads like an invented story or claim: "${m[0]}"`);
    }
    return problems;
}

module.exports = { renderEmail, checkEmail, shareUrl };
