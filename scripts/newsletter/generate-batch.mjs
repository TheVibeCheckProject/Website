#!/usr/bin/env node
// Auto-generates daily emails into newsletter-content/batch.json: any missing or broken day from
// today through the end of next month.
// Uses Google Gemini API (free tier). Every email is checked by email.js (checkEmail) before
// it is saved; days that fail are regenerated, and the run fails if any day is still missing.
// Run via GitHub Actions daily (and on the 25th by the Cloudflare trigger), or manually:
//   TARGET_MONTH=2026-05 node scripts/newsletter/generate-batch.mjs

import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const { checkEmail } = createRequire(import.meta.url)('./email.js');

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  console.error('Missing GEMINI_API_KEY');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-3.7-flash' });

const BATCH_PATH = path.join(__dirname, '..', '..', 'newsletter-content', 'batch.json');
const KEEP_PAST_DAYS = 14; // prune older entries so the file doesn't grow forever
const ATTEMPTS = 3;

function getTargetMonth() {
  const override = process.env.TARGET_MONTH;
  if (override && /^\d{4}-\d{2}$/.test(override)) return override;
  const d = new Date();
  d.setDate(1); // on Jan 29-31, setMonth(+1) would land in March and skip February
  d.setMonth(d.getMonth() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function getDatesForMonth(yearMonth) {
  const [year, month] = yearMonth.split('-').map(Number);
  const days = new Date(year, month, 0).getDate();
  const dates = [];
  for (let d = 1; d <= days; d++) dates.push(`${yearMonth}-${String(d).padStart(2, '0')}`);
  return dates;
}

const weekday = (date) => new Date(date + 'T12:00:00Z').toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' });

function readExistingBatch() {
  try {
    const batch = JSON.parse(fs.readFileSync(BATCH_PATH, 'utf8'));
    return Array.isArray(batch.emails) ? batch.emails : [];
  } catch {
    return [];
  }
}

function buildPrompt(dates, monthName, year, avoid) {
  return `Write ${dates.length} daily emails for "The Vibe Check Project". People signed up to get one gentle affirmation in their inbox every morning. Each email is that affirmation, for the reader themselves. The site also lets people send free affirmation cards, and every email ends with a button that sends that day's affirmation to someone as a card (the button is added automatically, so don't mention it or ask the reader to send anything).

Month: ${monthName} ${year}
Dates (one email each; weekday in brackets): ${dates.map(d => `${d} [${weekday(d)}]`).join(', ')}

Return ONLY a JSON array with exactly ${dates.length} objects, no markdown fences or commentary. Each object:
{
  "date": "YYYY-MM-DD",
  "type": "AFFIRMATION" or "OCCASION",
  "occasion": "only for OCCASION: the name of the day",
  "subject": "warm, 3-8 words, mostly lowercase",
  "preview_text": "one sentence, under 90 characters",
  "intro": "one short opening line, or an empty string",
  "affirmation": "the affirmation itself: one or two sentences, under 140 characters, spoken to the reader ('you')",
  "reflection": "one or two short sentences that sit with the affirmation"
}

Rules (strict):
- Every email is an affirmation for the reader. No sales, no Premium, no "send a card", no "reach out to someone".
- NEVER invent people, events or anecdotes: no stories, no "a friend of mine", no "she/he said", no strangers, baristas, coworkers, parents or roommates, nothing that "happened". Talk only to the reader, in the present.
- No statistics, studies, percentages or claims about what research shows.
- No medical or therapy advice. Gentle and supportive, never preachy or toxic-positive.
- OCCASION only for real, well-known dates that fall on that exact day (e.g. World Mental Health Day is October 10). Keep them to a few per month; everything else is AFFIRMATION. Only mention a weekday if it matches the one given in brackets.
- Warm, calm, short sentences, like a kind text from a friend. Vary the tone across the month.
- Never repeat an affirmation, subject line or central theme.${avoid.length ? `\n- Do not reuse any of these recent affirmations:\n${avoid.map(a => `  - ${a}`).join('\n')}` : ''}`;
}

async function generate(dates, monthName, year, avoid) {
  const result = await model.generateContent(buildPrompt(dates, monthName, year, avoid));
  const raw = result.response.text().trim();
  const jsonMatch = raw.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    console.error('Response did not contain a JSON array. First 500 chars:', raw.slice(0, 500));
    return [];
  }
  try {
    return JSON.parse(jsonMatch[0]);
  } catch (err) {
    console.error('Failed to parse JSON:', err.message);
    return [];
  }
}

async function main() {
  // Covers every day from today to the end of the target month: the rest of this month as well
  // as all of next month, so a day that went missing or broke after the last run is refilled
  // too. Runs daily (see the workflow); when nothing is missing it exits without calling Gemini.
  const targetMonth = getTargetMonth();
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Chicago' }).format(new Date());
  const months = [...new Set([today.slice(0, 7), targetMonth])].sort();

  // Merge, never replace: this runs on the 25th, and overwriting batch.json with only next
  // month deleted the unsent last days of the current month. Dates that already have an
  // email (including hand-written ones) are kept and not regenerated — but only if that email
  // passes checkEmail. A date whose email would fail at send time (e.g. the old body_html
  // format, Oct 2026) counts as missing and is replaced, instead of "fully covered".
  const existing = readExistingBatch();
  const isValid = (e) => checkEmail(e).length === 0;
  const invalid = existing.filter(e => !isValid(e)).map(e => e.date);
  if (invalid.length) console.warn(`⚠️  Replacing ${invalid.length} email(s) that fail the content check: ${invalid.join(', ')}`);
  const have = new Set(existing.filter(isValid).map(e => e.date));
  const accepted = [];
  let missing = [];
  const avoid = existing.map(e => e.affirmation).filter(Boolean).slice(-40);
  for (const ym of months) {
    const [year, month] = ym.split('-').map(Number);
    const monthName = new Date(year, month - 1, 1).toLocaleString('en-US', { month: 'long' });
    let todo = getDatesForMonth(ym).filter(d => d >= today && !have.has(d));
    if (todo.length === 0) {
      console.log(`✅ ${monthName} ${year} is already fully covered in batch.json.`);
      continue;
    }
    console.log(`Generating ${todo.length} day(s) for ${monthName} ${year}...`);
    for (let attempt = 1; attempt <= ATTEMPTS && todo.length; attempt++) {
      const wanted = new Set(todo);
      for (const e of await generate(todo, monthName, year, avoid.concat(accepted.map(a => a.affirmation)))) {
        if (!e || !wanted.has(e.date)) continue;
        const email = {
          date: e.date, type: e.type, subject: e.subject, preview_text: e.preview_text,
          intro: e.intro || '', affirmation: e.affirmation, reflection: e.reflection,
        };
        if (e.occasion) email.occasion = e.occasion;
        const problems = checkEmail(email);
        if (problems.length) {
          console.warn(`⚠️  ${e.date} rejected: ${problems.join('; ')}`);
          continue;
        }
        accepted.push(email);
        wanted.delete(e.date);
      }
      todo = [...wanted].sort();
      if (todo.length) console.log(`Attempt ${attempt}: ${todo.length} day(s) still missing.`);
    }
    missing = missing.concat(todo);
  }
  if (accepted.length === 0 && missing.length === 0) {
    console.log('✅ Every day through the end of the target month has an email — nothing to generate.');
    return;
  }

  const cutoff = new Date(Date.now() - KEEP_PAST_DAYS * 86400000).toISOString().slice(0, 10);
  const byDate = new Map();
  for (const e of existing) if (e.date >= cutoff) byDate.set(e.date, e);
  for (const e of accepted) if (!byDate.has(e.date) || !isValid(byDate.get(e.date))) byDate.set(e.date, e);
  const merged = [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));

  const batch = {
    generated: new Date().toISOString().split('T')[0],
    start_date: merged[0].date,
    end_date: merged[merged.length - 1].date,
    emails: merged,
  };
  fs.writeFileSync(BATCH_PATH, JSON.stringify(batch, null, 2) + '\n', 'utf8');
  console.log(`✅ Added ${accepted.length} emails → newsletter-content/batch.json`);
  console.log(`   Coverage: ${batch.start_date} to ${batch.end_date} (${merged.length} emails)`);

  if (missing.length) {
    // Saved what passed; fail so GitHub emails the owner about the gap before it's reached
    console.error(`❌ No acceptable email for: ${missing.join(', ')}. Write these by hand in batch.json or rerun the workflow.`);
    process.exit(1);
  }
}

main().catch(err => {
  console.error('❌', err.message);
  process.exit(1);
});
