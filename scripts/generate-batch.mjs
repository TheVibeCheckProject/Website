#!/usr/bin/env node
// Auto-generates newsletter-content/batch.json for the next calendar month.
// Uses Google Gemini API (free tier) to produce varied, on-brand email content.
// Run via GitHub Actions on the 25th of each month, or manually:
//   TARGET_MONTH=2026-05 node scripts/generate-batch.mjs

import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  console.error('Missing GEMINI_API_KEY');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-3.7-flash' });

function getTargetMonth() {
  const override = process.env.TARGET_MONTH;
  if (override && /^\d{4}-\d{2}$/.test(override)) return override;
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function getDatesForMonth(yearMonth) {
  const [year, month] = yearMonth.split('-').map(Number);
  const days = new Date(year, month, 0).getDate();
  const dates = [];
  for (let d = 1; d <= days; d++) {
    dates.push(`${yearMonth}-${String(d).padStart(2, '0')}`);
  }
  return dates;
}

function buildEmailHtml(subject, paragraphs) {
  const body = paragraphs.map(p => `<p>${p}</p>`).join('\n');
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${subject}</title></head><body style="margin:0;padding:0;background:#f9f4ff;font-family:Georgia,serif;"><table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 16px;"><table width="560" style="background:#fff;border-radius:12px;overflow:hidden;max-width:100%;"><tr><td style="background:#7c3aed;padding:20px 32px;text-align:center;"><span style="color:#fff;font-size:22px;font-weight:bold;letter-spacing:1px;">✨ The Vibe Check Project</span></td></tr><tr><td style="padding:32px;color:#1a1a1a;font-size:16px;line-height:1.7;">${body}</td></tr><tr><td style="padding:0 32px 32px;text-align:center;"><a href="https://thevibecheckproject.com/send-card.html" style="display:inline-block;background:#7c3aed;color:#fff;text-decoration:none;padding:14px 32px;border-radius:50px;font-size:16px;font-weight:bold;">Send a Vibe Check →</a></td></tr><tr><td style="background:#f3f0ff;padding:16px 32px;text-align:center;font-size:12px;color:#888;">You're receiving this because you signed up at thevibecheckproject.com<br><a href="{$unsubscribe}" style="color:#7c3aed;">Unsubscribe</a></td></tr></table></td></tr></table></body></html>`;
}

const BATCH_PATH = path.join(__dirname, '..', 'newsletter-content', 'batch.json');
const KEEP_PAST_DAYS = 14; // prune older entries so the file doesn't grow forever

function readExistingBatch() {
  try {
    const batch = JSON.parse(fs.readFileSync(BATCH_PATH, 'utf8'));
    return Array.isArray(batch.emails) ? batch.emails : [];
  } catch {
    return [];
  }
}

async function main() {
  const targetMonth = getTargetMonth();
  const [year, month] = targetMonth.split('-').map(Number);
  const monthName = new Date(year, month - 1, 1).toLocaleString('en-US', { month: 'long' });

  // Merge, never replace: this runs on the 25th, and overwriting batch.json with only next
  // month deleted the unsent last days of the current month. Dates that already have an
  // email (including hand-edited ones) are kept and not regenerated.
  const existing = readExistingBatch();
  const have = new Set(existing.map(e => e.date));
  const dates = getDatesForMonth(targetMonth).filter(d => !have.has(d));
  if (dates.length === 0) {
    console.log(`✅ ${monthName} ${year} is already fully covered in batch.json — nothing to generate.`);
    return;
  }

  console.log(`Generating ${dates.length} missing day(s) for ${monthName} ${year}...`);

  const prompt = `Generate ${dates.length} daily newsletter emails for "The Vibe Check Project" — a platform that encourages people to send emotional support and affirmation cards to their friends and loved ones.

Target month: ${monthName} ${year}
Dates to cover (one email per date): ${dates.join(', ')}

Return ONLY a valid JSON array with exactly ${dates.length} objects. No markdown fences, no commentary, just the raw JSON array.

Each object must have exactly these fields:
{
  "date": "YYYY-MM-DD",
  "type": "OCCASION" | "AFFIRMATION" | "NUDGE" | "STORY",
  "occasion": "string — only include this field when type is OCCASION",
  "subject": "string — casual, warm, 5-9 words, mostly lowercase",
  "preview_text": "string — one compelling sentence, under 90 characters",
  "body_text": "string — plain text, 2-3 short paragraphs separated by \\n\\n",
  "paragraphs": ["paragraph 1", "paragraph 2", "paragraph 3"]
}

Type distribution across the month (roughly 25% each):
- OCCASION: tied to a real holiday, season moment, or cultural event in ${monthName}
- AFFIRMATION: a warm daily affirmation to send to someone you care about
- NUDGE: a gentle prompt to reach out to someone you haven't talked to recently
- STORY: a short relatable story (2-3 sentences) that ends with a call to send someone a card

Brand voice rules:
- Warm and casual, not corporate or preachy
- Short sentences. Like how you'd text a friend.
- Every email should make the reader want to reach out to someone right now
- Vary the tone — some energetic, some quiet and reflective
- Never repeat a subject line or central theme across the month`;

  const result = await model.generateContent(prompt);
  const raw = result.response.text().trim();

  // Strip any markdown code fences if Claude wrapped it
  const jsonMatch = raw.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    console.error('Response did not contain a JSON array');
    console.error('First 500 chars:', raw.slice(0, 500));
    process.exit(1);
  }

  let emails;
  try {
    emails = JSON.parse(jsonMatch[0]);
  } catch (err) {
    console.error('Failed to parse JSON:', err.message);
    process.exit(1);
  }

  if (emails.length !== dates.length) {
    console.warn(`⚠️  Expected ${dates.length} emails, got ${emails.length}`);
  }

  const wanted = new Set(dates);
  const processed = emails.slice(0, dates.length).map((email, i) => {
    const paragraphs = Array.isArray(email.paragraphs) && email.paragraphs.length > 0
      ? email.paragraphs
      : (email.body_text || '').split('\n\n').filter(Boolean);

    const result = {
      // Trust the requested date list over whatever date the model echoed back
      date: wanted.has(email.date) ? email.date : dates[i],
      type: email.type,
      subject: email.subject,
      preview_text: email.preview_text,
      body_text: email.body_text,
      body_html: buildEmailHtml(email.subject, paragraphs),
    };
    if (email.occasion) result.occasion = email.occasion;
    return result;
  });

  const cutoff = new Date(Date.now() - KEEP_PAST_DAYS * 86400000).toISOString().slice(0, 10);
  const byDate = new Map();
  for (const e of existing) if (e.date >= cutoff) byDate.set(e.date, e);
  for (const e of processed) if (!byDate.has(e.date)) byDate.set(e.date, e);
  const merged = [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));

  const batch = {
    generated: new Date().toISOString().split('T')[0],
    start_date: merged[0].date,
    end_date: merged[merged.length - 1].date,
    emails: merged,
  };

  fs.writeFileSync(BATCH_PATH, JSON.stringify(batch, null, 2), 'utf8');
  console.log(`✅ Added ${processed.length} emails → newsletter-content/batch.json`);
  console.log(`   Coverage: ${batch.start_date} to ${batch.end_date} (${merged.length} emails)`);
}

main().catch(err => {
  console.error('❌', err.message);
  process.exit(1);
});
