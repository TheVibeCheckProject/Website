# Email Service Integration Guide

## Current Status

✅ **What's Working Now:**
- Beautiful email signup modal
- Email validation
- Subscribers stored in browser localStorage
- Success confirmation message
- Daily affirmation rotation (changes every day automatically)

⚠️ **What Needs Integration:**
- Actual email delivery service
- Automated daily affirmation emails
- Premium subscription payments

---

## Option 1: Buttondown (RECOMMENDED - Easiest)

**Why Buttondown:**
- Free for up to 1,000 subscribers
- Built specifically for newsletters
- Simple API
- Great for indie projects
- Beautiful email templates

**Setup Steps:**

1. **Sign up at [buttondown.email](https://buttondown.email)**
   - Free tier: 1,000 subscribers
   - Paid: $9/month for unlimited

2. **Get your API key:**
   - Go to Settings → Programming
   - Copy your API key

3. **Update script.js** (replace the `handleEmailSignup` function):

```javascript
async function handleEmailSignup(e) {
    e.preventDefault();
    
    const email = document.getElementById('signup-email').value;
    const name = document.getElementById('signup-name').value || 'Friend';
    
    try {
        const response = await fetch('https://api.buttondown.email/v1/subscribers', {
            method: 'POST',
            headers: {
                'Authorization': 'Token YOUR_BUTTONDOWN_API_KEY',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: email,
                metadata: {
                    name: name,
                    signup_date: new Date().toISOString()
                }
            })
        });
        
        if (response.ok) {
            // Show success
            document.getElementById('email-signup-form').style.display = 'none';
            document.getElementById('signup-success').style.display = 'block';
        } else {
            alert('Something went wrong. Please try again!');
        }
    } catch (error) {
        console.error('Signup error:', error);
        alert('Something went wrong. Please try again!');
    }
}
```

4. **Create your daily email template** in Buttondown:
   - Subject: "✨ Your Daily Vibe Check"
   - Body: Include today's affirmation
   - Set to send daily at 8am

---

## Option 2: ConvertKit (Best for Growth)

**Why ConvertKit:**
- Free for up to 1,000 subscribers
- Powerful automation
- Great for scaling
- Email sequences

**Setup Steps:**

1. **Sign up at [convertkit.com](https://convertkit.com)**

2. **Create a Form:**
   - Forms → New Form
   - Get the form embed code
   - We'll use the API instead

3. **Get API Secret:**
   - Settings → Advanced → API Secret

4. **Update script.js:**

```javascript
async function handleEmailSignup(e) {
    e.preventDefault();
    
    const email = document.getElementById('signup-email').value;
    const name = document.getElementById('signup-name').value || 'Friend';
    
    try {
        const response = await fetch('https://api.convertkit.com/v3/forms/YOUR_FORM_ID/subscribe', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                api_key: 'YOUR_API_KEY',
                email: email,
                first_name: name
            })
        });
        
        if (response.ok) {
            document.getElementById('email-signup-form').style.display = 'none';
            document.getElementById('signup-success').style.display = 'block';
        }
    } catch (error) {
        console.error('Signup error:', error);
    }
}
```

---

## Option 3: Mailchimp (Most Popular)

**Why Mailchimp:**
- Very established
- Free for up to 500 subscribers
- Lots of templates
- Good analytics

**Setup Steps:**

1. **Sign up at [mailchimp.com](https://mailchimp.com)**

2. **Create an Audience**

3. **Get API Key:**
   - Profile → Extras → API Keys

4. **Get Audience ID:**
   - Audience → Settings → Audience name and defaults

5. **Update script.js:**

```javascript
async function handleEmailSignup(e) {
    e.preventDefault();
    
    const email = document.getElementById('signup-email').value;
    const name = document.getElementById('signup-name').value || 'Friend';
    
    // Note: Mailchimp requires a server-side proxy due to CORS
    // You'll need to set up a simple serverless function
    
    try {
        const response = await fetch('YOUR_SERVERLESS_FUNCTION_URL', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: email,
                name: name
            })
        });
        
        if (response.ok) {
            document.getElementById('email-signup-form').style.display = 'none';
            document.getElementById('signup-success').style.display = 'block';
        }
    } catch (error) {
        console.error('Signup error:', error);
    }
}
```

---

## Option 4: Simple Form Service (No Code)

**Use Formspree or similar:**

1. **Sign up at [formspree.io](https://formspree.io)**

2. **Create a form** - You'll get a form endpoint

3. **Update script.js:**

```javascript
async function handleEmailSignup(e) {
    e.preventDefault();
    
    const email = document.getElementById('signup-email').value;
    const name = document.getElementById('signup-name').value || 'Friend';
    
    try {
        const response = await fetch('https://formspree.io/f/YOUR_FORM_ID', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: email,
                name: name,
                _subject: 'New Vibe Check Subscriber!'
            })
        });
        
        if (response.ok) {
            document.getElementById('email-signup-form').style.display = 'none';
            document.getElementById('signup-success').style.display = 'block';
        }
    } catch (error) {
        console.error('Signup error:', error);
    }
}
```

---

## Automated Daily Emails

Once you have email subscribers, you need to send daily affirmations. Here's how:

### Using Buttondown:
1. Create a scheduled email that sends daily
2. Use their template system
3. Manually update the affirmation each day, OR:
4. Use their API to programmatically send emails

### Using ConvertKit:
1. Create a "Sequence" (automated email series)
2. Add 30+ emails with different affirmations
3. Set them to send one per day
4. After 30 days, it loops back

### Using Zapier (Works with any email service):
1. Connect your email service to Zapier
2. Create a daily trigger
3. Randomly select an affirmation
4. Send to all subscribers

---

## Testing Locally

To test without an email service:

1. Open your browser console (F12)
2. Sign up with test emails
3. Check localStorage:
   ```javascript
   JSON.parse(localStorage.getItem('vibeCheckSubscribers'))
   ```
4. You'll see all test subscribers

---

## My Recommendation

**Start with Buttondown:**
1. Easiest to set up
2. Perfect for this use case
3. Free for first 1,000 subscribers
4. Simple API
5. Can automate daily sends

**Setup time:** ~15 minutes

Let me know which service you want to use and I'll help you integrate it!
