# 📧 Email Integration for Card Sending

## Overview
This guide shows you how to automatically send cards via email when users create them.

---

## Option 1: Buttondown API (Recommended - Already Setup!)

Since you already have Buttondown for your newsletter, you can use it to send card emails too!

### Step 1: Get Your Buttondown API Key

1. Go to https://buttondown.email/settings
2. Scroll to "API Key"
3. Copy your API key

### Step 2: Update send-card.html

Add this code to the `<script>` section in send-card.html, right after the form submission code:

```javascript
// Add this function
async function sendCardEmail(cardData, cardUrl) {
    const emailBody = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 0; background: #f5f5f5; }
        .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #FF6B9D, #FEC84A); padding: 40px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 32px; }
        .content { padding: 40px; }
        .message { font-size: 18px; color: #333; line-height: 1.6; margin-bottom: 30px; }
        .cta-button { display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #FF6B9D, #FEC84A); color: white; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 18px; margin: 20px 0; }
        .footer { padding: 20px 40px; background: #f9f9f9; text-align: center; font-size: 14px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>✨ You've Got a Vibe Check!</h1>
        </div>
        <div class="content">
            <p class="message">
                Hi ${cardData.recipientName}! 👋
            </p>
            <p class="message">
                ${cardData.senderName} sent you a special affirmation card from The Vibe Check Project.
            </p>
            <p class="message">
                They wanted to brighten your day with some positive vibes! ✨
            </p>
            <div style="text-align: center;">
                <a href="${cardUrl}" class="cta-button">
                    Open Your Card 💌
                </a>
            </div>
            <p class="message" style="font-size: 14px; color: #888; margin-top: 30px;">
                This is a one-time message. Your card will open with a beautiful animation just for you!
            </p>
        </div>
        <div class="footer">
            <p>Sent with love from The Vibe Check Project</p>
            <p><a href="https://thevibecheckproject.com" style="color: #FF6B9D;">Visit Us</a></p>
        </div>
    </div>
</body>
</html>
    `;

    try {
        const response = await fetch('https://api.buttondown.email/v1/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Token YOUR_BUTTONDOWN_API_KEY_HERE`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: cardData.recipientEmail,
                subject: `✨ ${cardData.senderName} sent you a Vibe Check Card!`,
                body: emailBody,
                email_type: 'transactional'
            })
        });

        if (response.ok) {
            console.log('Email sent successfully!');
            return true;
        } else {
            console.error('Email failed:', await response.text());
            return false;
        }
    } catch (error) {
        console.error('Email error:', error);
        return false;
    }
}

// Then modify the form submission to call this:
if (recipientEmail) {
    sendCardEmail(cardData, cardUrl).then(success => {
        if (success) {
            console.log('Card email sent to:', recipientEmail);
        }
    });
}
```

**IMPORTANT:** Replace `YOUR_BUTTONDOWN_API_KEY_HERE` with your actual API key from Buttondown.

---

## Option 2: Simple Backend (Node.js + Netlify Functions)

If you want more control, create a serverless function:

### Step 1: Create netlify/functions/send-card-email.js

```javascript
const fetch = require('node-fetch');

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const { cardData, cardUrl } = JSON.parse(event.body);
    
    const emailBody = `
    <!DOCTYPE html>
    <html>
    <!-- Same HTML template as above -->
    </html>
    `;

    try {
        const response = await fetch('https://api.buttondown.email/v1/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Token ${process.env.BUTTONDOWN_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: cardData.recipientEmail,
                subject: `✨ ${cardData.senderName} sent you a Vibe Check Card!`,
                body: emailBody,
                email_type: 'transactional'
            })
        });

        return {
            statusCode: 200,
            body: JSON.stringify({ success: true })
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};
```

### Step 2: Add API Key to Netlify

1. Go to Netlify dashboard
2. Site settings → Environment variables
3. Add: `BUTTONDOWN_API_KEY` = your key

### Step 3: Update send-card.html

```javascript
if (recipientEmail) {
    fetch('/.netlify/functions/send-card-email', {
        method: 'POST',
        body: JSON.stringify({ cardData, cardUrl })
    });
}
```

---

## Option 3: Email Service (SendGrid/Mailgun)

### SendGrid Setup

1. Sign up at https://sendgrid.com (free tier: 100 emails/day)
2. Get API key
3. Use similar code as Buttondown option

---

## Quick Start (No Code)

**Want to test first?**

For now, the card creates a shareable link that users can copy and paste. This works perfectly and many people prefer sharing links on social media anyway!

**Later, when ready:**
1. Get Buttondown API key
2. Add the JavaScript code above
3. Replace API key
4. Test with your own email
5. Go live!

---

## Testing

1. Create a test card with your own email
2. Check if email arrives (might take 1-2 minutes)
3. Click link in email
4. Watch the beautiful animation!

---

## Email Best Practices

**Subject Lines That Work:**
- ✨ You've got a Vibe Check from [Name]!
- 💌 [Name] sent you something special
- Someone is thinking of you today ✨

**Send Timing:**
- Instant delivery (transactional)
- Don't add to newsletter list
- One-time message only

---

## Cost

**Buttondown:**
- Free tier: 100 emails/month
- After that: $5/month for 1,000 emails

**SendGrid:**
- Free tier: 100 emails/day (3,000/month)
- After that: Pay as you go

**Mailgun:**
- Free tier: 5,000 emails/month
- After that: $35/month

---

## Current Status

✅ Card creation works perfectly
✅ Shareable links work
✅ Beautiful 3D animation
⏳ Email sending (add when ready)

**For now:** Users can copy the link and text/email it themselves!
**Next:** Add automatic email with the code above when you're ready.

---

## Need Help?

Just ask and I'll help you:
1. Set up the Buttondown API integration
2. Create the Netlify function
3. Test the email sending
4. Debug any issues

The card feature is already AWESOME - email sending is just the cherry on top! 🍒✨
