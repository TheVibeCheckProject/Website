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

// Retry wrapper with exponential backoff
async function withRetry(fn, retries = 2, delay = 3000) {
  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt > retries) throw err;
      console.log(`⚠️ Attempt ${attempt} failed, retrying in ${delay / 1000}s...`);
      await new Promise(r => setTimeout(r, delay));
      delay *= 2; // exponential backoff
    }
  }
}

async function mailerlite(method, endpoint, body) {
  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  };
  if (body) {
    options.body = JSON.stringify(body);
  }
  const res = await fetch(`${BASE_URL}${endpoint}`, options);
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }
  if (!res.ok) {
    console.error(`Response ${res.status}:`, JSON.stringify(data, null, 2));
    throw new Error(`MailerLite ${method} ${endpoint} failed (${res.status})`);
  }
  return data;
}

async function main() {
  const today = process.env.DATE_OVERRIDE || getTodayEST();
  console.log(`📅 Date: ${today}`);

  const batchPath = path.join(__dirname, '..', 'newsletter-content', 'batch.json');
  if (!fs.existsSync(batchPath)) {
    console.error('batch.json not found');
    process.exit(1);
  }

  const batch = JSON.parse(fs.readFileSync(batchPath, 'utf8'));
  const email = batch.emails.find(e => e.date === today);

  if (!email) {
    console.log(`No email scheduled for ${today} — skipping.`);
    process.exit(0);
  }

  console.log(`📧 Subject: "${email.subject}" (${email.type})`);

  // Step 1: Create campaign (with retry)
  const requestBody = {
    name: `Daily Vibe ${today} ${Date.now()}`,
    type: 'regular',
    emails: [
      {
        subject: email.subject,
        from_name: 'The Vibe Check Project',
        from: 'wecare@thevibecheckproject.com',
        content: email.body_html,
      }
    ],
    groups: [GROUP_ID],
  };

  console.log('Creating campaign...');
  const campaign = await withRetry(() => mailerlite('POST', '/campaigns', requestBody));
  const campaignId = campaign.data.id;
  console.log(`✅ Campaign created: ${campaignId}`);

  // Step 2: Schedule for immediate send (with retry)
  console.log('Scheduling for immediate delivery...');
  await withRetry(() => mailerlite('POST', `/campaigns/${campaignId}/schedule`, {
    delivery: 'instant',
  }));
  console.log(`🚀 Newsletter sent for ${today}: "${email.subject}"`);

  // Increment newsletter send counter (fire-and-forget)
  fetch('https://api.counterapi.dev/v1/thevibecheckproject/newsletters-sent/up').catch(() => {});
}

main().catch(err => {
  console.error('❌', err.message);
  process.exit(1);
});
