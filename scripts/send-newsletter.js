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

// Today in America/Chicago — matches the 9:00 AM Central scheduled trigger
function getTodayCentral() {
  const now = new Date();
  const central = new Date(now.toLocaleString('en-US', { timeZone: 'America/Chicago' }));
  return central.toISOString().split('T')[0];
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

// Idempotency guard: skip if a campaign for this date was already sent,
// is sending, or is scheduled. Prevents duplicate emails when a run is
// retried or manually re-dispatched for the same date.
async function alreadySent(today) {
  const data = await mailerlite('GET', '/campaigns?limit=25');
  const items = (data && data.data) || [];
  const prefix = `Daily Vibe ${today}`;
  return items.some(c => {
    const name = c.name || '';
    const status = String(c.status || '').toLowerCase();
    return name.startsWith(prefix) && ['sent', 'sending', 'scheduled'].includes(status);
  });
}

async function main() {
  const today = process.env.DATE_OVERRIDE || getTodayCentral();
  console.log(`📅 Date: ${today}`);

  const batchPath = path.join(__dirname, '..', 'newsletter-content', 'batch.json');
  if (!fs.existsSync(batchPath)) {
    console.error('batch.json not found');
    process.exit(1);
  }

  const batch = JSON.parse(fs.readFileSync(batchPath, 'utf8'));
  const email = batch.emails.find(e => e.date === today);

  if (!email) {
    // Fail loudly: a silent skip hid a multi-day outage in Sept 2026 when batch.json was
    // overwritten. A failed run triggers GitHub's failure email and the notify step.
    console.error(`❌ No email in batch.json for ${today} (covers ${batch.start_date} → ${batch.end_date}). Add content or run the "Generate Newsletter Batch" workflow.`);
    process.exit(1);
  }

  console.log(`📧 Subject: "${email.subject}" (${email.type})`);

  // Idempotency check before creating anything
  console.log('Checking for an existing send for this date...');
  if (await withRetry(() => alreadySent(today))) {
    console.log(`⏭️ A campaign for ${today} was already sent — skipping duplicate.`);
    process.exit(0);
  }

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

  // Increment newsletter send counter (scripts/vibe-counter-worker.js); skipped when not configured
  if (process.env.VIBE_COUNTER_URL) {
    await fetch(`${process.env.VIBE_COUNTER_URL.replace(/\/$/, '')}/hit/newsletters-sent`, { method: 'POST' }).catch(() => {});
  }
}

main().catch(err => {
  console.error('❌', err.message);
  process.exit(1);
});
