# The Vibe Check Project — Audit Report
**Date:** March 1, 2026

---

## What's GREAT

These are the parts that are working exceptionally well — above what most indie projects achieve.

### Automated Daily Newsletter Pipeline
The GitHub Actions → MailerLite flow is genuinely solid. Pre-generating a full month of content in `batch.json`, date-matching at send time, and using `DATE_OVERRIDE` for manual testing is a clean, professional pattern. Most solo projects manually send emails. This one runs itself.

### No-Signup Card Sending
The core UX decision — send a card via a shareable link without creating an account — is excellent product thinking. It removes the biggest friction point for casual users and fits the "low-stakes positivity" brand perfectly.

### API Key Security
Credentials are stored as GitHub Secrets, not hardcoded. `.gitignore` covers `.env`. This is done right.

### Multi-Email Type Rotation
The `batch.json` structure using OCCASION / AFFIRMATION / NUDGE / STORY types prevents email fatigue. It's a real content strategy baked into the architecture, not an afterthought.

### Inline CSS in Emails
All email HTML uses inline styles — correct for email clients. This shows awareness of email rendering quirks that trip up most developers.

### Timezone-Aware Scheduling
The `getTodayEST()` function correctly converts to America/New_York before date comparison. Small detail, but it prevents sends firing on the wrong day for East Coast users.

---

## What's GOOD

Solid work, but more expected than exceptional.

### Clean Tech Stack
Pure HTML/CSS/JS with no framework overhead is a smart call for a GitHub Pages site. Fast load times, zero build pipeline to break.

### Responsive Design
CSS uses `max-width: 100%` patterns and a consistent design token system (`--color-primary`, `--color-bg-dark`, etc.). The site works on mobile.

### Blog SEO Foundation
Five SEO-targeted blog articles with intent-driven titles (`what-to-text-someone-having-a-panic-attack`) is a smart organic growth strategy. The URLs are clean and keyword-rich.

### Analytics in Place
Microsoft Clarity provides session replay and heatmaps without advertising cookies — privacy-respecting choice that still gives real behavior data.

### Documentation
The `docs/` folder is well-populated with setup guides, monetization strategy, and templates. Future-you (or a collaborator) will thank current-you.

### Manual Workflow Trigger
`workflow_dispatch` with a `date_override` input in the GitHub Actions YAML is great for testing and recovery if a send fails.

---

## What Needs Work

These are real gaps that could cause problems or limit growth.

### `batch.json` Has No Auto-Regeneration
Content only covers through March 30, 2026. There's no workflow to generate April's content. When March 30 passes, the newsletter silently skips every day. **Priority: High.** Either add a workflow that auto-generates the next month's batch, or add an alert when the batch is within 5 days of running out.

### `{{unsubscribe_url}}` Is a Literal Placeholder
Every email HTML contains `{{unsubscribe_url}}` — MailerLite does **not** auto-replace this. It renders literally in the email footer. This is a CAN-SPAM compliance issue and a broken UX. **Priority: High.** Use MailerLite's actual unsubscribe variable: `{$unsubscribe}`.

### No Error Alerting
If the daily send fails, GitHub Actions logs the error — but you won't know unless you check. A failed day means a gap in the subscriber experience. **Fix:** Add a failure notification step to the workflow (email to yourself, or a webhook to Discord/Slack).

### Email Signup Flow Is Unclear
`EMAIL_SETUP_GUIDE.md` is marked "ARCHIVED" and `script.js` references a Buttondown integration. It's not clear if newsletter signup from the homepage is actually working or depositing subscribers into MailerLite. If they're going to Buttondown and your sends are going to a MailerLite group, those are two separate lists. **Verify which platform your actual subscribers are on.**

### `setup-platforms.mjs` Is Fragile
The Playwright automation for Ko-fi/Gumroad setup depends on CSS selectors that Ko-fi and Gumroad can change at any time. It also requires manual login, which means it's a one-time-use helper, not a repeatable automation. This is fine as a setup tool, but don't rely on it being runnable in the future without maintenance.

### Counter API Is a Single Point of Failure
`counterapi.dev` is a free third-party service with no SLA. If it goes down or changes its API, the live card counter breaks silently. Minor, but worth noting.

### No Retry Logic in `send-newsletter.js`
If the MailerLite API returns a transient 5xx error, the script exits with code 1 and the day is missed. A single retry with exponential backoff would make the pipeline much more resilient.

---

## Ideas & New Features

Grouped by effort level.

### Quick Wins (hours)

**Fix `{$unsubscribe}` variable**
Replace `{{unsubscribe_url}}` with MailerLite's actual merge tag `{$unsubscribe}` in all `body_html` fields in `batch.json`. One find-and-replace.

**Add failure notification to GitHub Actions**
```yaml
- name: Notify on failure
  if: failure()
  run: |
    curl -X POST -H 'Content-type: application/json' \
    --data '{"text":"🚨 Vibe Check newsletter send FAILED for ${{ env.DATE_OVERRIDE || 'today' }}"}' \
    ${{ secrets.SLACK_WEBHOOK_URL }}
```

**Preview text in MailerLite**
The `preview_text` field exists in `batch.json` but isn't being sent to MailerLite. Add it to the campaign body: `preview_text: email.preview_text`.

### Medium Effort (days)

**Auto-regenerate `batch.json` monthly**
Add a second GitHub Actions workflow that runs on the 25th of each month, calls Claude API (or OpenAI) to generate next month's 30 emails in the `batch.json` format, and commits the file. The newsletter then runs forever without manual intervention.

**Subscriber count on homepage**
Surface the MailerLite subscriber count (via API) as a social proof number on the homepage — "Join 847 people spreading good vibes" updates automatically.

**Welcome email automation**
You have a `WELCOME_EMAIL_SEQUENCE.md` template but no automation sending it. MailerLite supports automation workflows — set up a 3-email welcome sequence that triggers on new subscriber join.

**A/B subject line testing**
`batch.json` could include an `subject_b` field for half the sends. Track open rates per type (OCCASION vs AFFIRMATION vs NUDGE vs STORY) and let data drive content decisions.

### Bigger Features (weeks)

**"Send a Card" from email**
The CTA button in emails links to the card composer. Add a pre-fill parameter: `send-card.html?message=Your+worth+isn't+measured+by+your+productivity` so clicking the email CTA auto-populates a relevant message. Directly ties newsletter engagement to card sends.

**Subscriber preferences**
Let subscribers choose their email frequency (daily vs weekly digest) or type preference (affirmations only, nudges only). Store preferences in MailerLite subscriber fields and filter sends accordingly.

**Card analytics dashboard**
The live counter tracks total cards sent but nothing else. A simple backend (Cloudflare Worker + KV) could track: cards sent per day, most-used messages, geographic spread. Valuable for press/partnerships.

**Blog RSS feed**
Add an `/blog/feed.xml` RSS file. Syndication to Feedly, newsletter aggregators, and Google Discover — free reach with no ongoing effort.

**Referral/share mechanic**
When a card recipient views a card, show a subtle "Send one back" CTA that pre-fills the composer pointing back to the original sender. Turns recipients into senders. Viral loop.

**Monthly subscriber wrap-up email**
On the last day of each month, send a "Your month in vibes" email: how many cards were sent platform-wide that month, a "top affirmation" of the month, a teaser for next month. Gives subscribers a sense of community.

---

## Summary Table

| Area | Status |
|------|--------|
| Newsletter automation | Solid, but no monthly regen |
| Email compliance (unsubscribe) | Broken — fix immediately |
| Error alerting | Missing |
| Signup → subscriber list | Unclear/verify |
| Core UX (no-signup cards) | Excellent |
| SEO content strategy | Good foundation |
| Security (API keys) | Done right |
| Analytics | In place |
| Monetization | Set up, needs traffic |
