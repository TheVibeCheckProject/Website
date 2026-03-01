#!/usr/bin/env node
// Daily newsletter sender — runs via GitHub Actions
// Reads today's email from newsletter-content/batch.json
// Creates a MailerLite campaign and sends it immediately

const fs = require('fs');
const path = require('path');

const API_KEY = process.env.MAILERLITE_API_KEY;
const GROUP_ID = process.env.MAILERLITE_GROUP_ID;
const BASE_URL = 'https://connect.mailerlite.com/api';

if (!API_KEY || !GROUP_ID) {
  console.error('Missing MAILERLITE_API_KEY or MAILERLITE_GROUP_ID');
  process.exit(1);
}

// Today in EST (UTC-5 / UTC-4 DST) — matches 9am EST trigger
function getTodayEST() {
  const now = new Date();
  const est = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  return est.toISOString().split('T')[0];
}

async function mailerlite(method, endpoint, body) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(`MailerLite ${method} ${endpoint} failed: ${JSON.stringify(data)}`);
  }
  return data;
}

async function main() {
  const today = process.env.DATE_OVERRIDE || getTodayEST();
  console.log(`Checking newsletter batch for date: ${today}`);

  const batchPath = path.join(__dirname, '..', 'newsletter-content', 'batch.json');
  if (!fs.existsSync(batchPath)) {
    console.error('batch.json not found — run the newsletter-content-generator skill first');
    process.exit(1);
  }

  const batch = JSON.parse(fs.readFileSync(batchPath, 'utf8'));
  const email = batch.emails.find(e => e.date === today);

  if (!email) {
    console.log(`No email scheduled for ${today} — skipping send.`);
    process.exit(0);
  }

  console.log(`Sending: "${email.subject}" (type: ${email.type})`);

  // Create campaign
  const campaignBody = {
    name: `Daily Vibe — ${today}`,
    type: 'regular',
    emails: [
      {
        subject: email.subject,
        from_name: 'The Vibe Check',
        from: 'wecare@thevibecheckproject.com',
        reply_to: 'wecare@thevibecheckproject.com',
        content: email.body_html,
        plain_text: email.body_text || `${email.subject}\n\nUnsubscribe: {$unsubscribe}`,
      }
    ],
    groups: [GROUP_ID],
  };
  console.log(`Creating campaign: "${email.subject}" for ${today}`);
  const campaign = await mailerlite('POST', '/campaigns', campaignBody);

  const campaignId = campaign.data.id;
  console.log(`Campaign created: ${campaignId}`);

  // Send immediately using V3 schedule endpoint
  await mailerlite('POST', `/campaigns/${campaignId}/schedule`, { delivery: 'instant' });
  console.log(`Newsletter sent for ${today}: "${email.subject}"`);
}

main().catch(err => {
  console.error(err.message);
  process.exit(1);
});
