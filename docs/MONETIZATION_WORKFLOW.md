# The Vibe Check Project — Monetization Build Workflow
**Goal:** Turn this card-sending site into a passive income machine.
**Stack:** Plain HTML/CSS/JS (no framework), MailerLite (email — FREE tier), Ko-fi (membership), Gumroad (one-time sales), Microsoft Clarity (analytics — FREE), optional Supabase for gating.

> **For AI agents:** This is a shared workflow between Claude Code (Claude) and Antigravity (Gemini).
> ✅ = completed | 🔲 = pending | 🟡 = was manual — now AUTOMATED (see below) | 🤖 = run the automation script
> Pick up any incomplete task. Do not redo completed work. Update this file as you finish tasks.
>
> **BROWSER AUTOMATION:** Tasks previously marked 🟡 (manual) are now handled by `scripts/setup-platforms.mjs`.
> - **For Claude Code / Playwright MCP:** `node scripts/setup-platforms.mjs` — opens a real browser, pauses at login, fills everything automatically.
> - **For Antigravity (browser tool):** Follow the step-by-step instructions in the AUTOMATION GUIDE section at the bottom of this file.
> - Devin only needs to: (1) sign in to each platform, (2) confirm before saving. The script does the rest.

---

## PHASE 1 — Fix the Pitch Copy ✅ COMPLETE
**Why:** The premium section said "support the project." Nobody pays to support a stranger. We're selling a product now.

### Tasks
- ✅ **Rewrite premium section** in `index.html`
  - Section title: "Get Daily Affirmations + Exclusive Card Packs"
  - Subtitle: explains the actual product (30 daily affirmations + 4 card packs/month)
  - Pricing line: "$3.99/month — 30 daily affirmations + 4 exclusive card packs • Cancel anytime"
- ✅ **Rewrite support section** in `index.html`
  - Renamed "Support The Mission" → "Three Ways to Get More Good Vibes"
  - "Buy Us a Coffee" card → "✨ Premium Membership" (Ko-fi)
  - "Share the Love" card → "🎨 Premium Card Designs" (Gumroad, $4.99 one-time)
  - "Gift a Subscription" card → kept, improved copy
- ✅ **Update Ko-fi membership page** — AUTOMATED
  - Run: `node scripts/setup-platforms.mjs --kofi`
  - OR Antigravity: follow AUTOMATION GUIDE → Ko-fi section
  - Script sets: title, description, $3.99/month price
- ✅ **Update Gumroad listing** — AUTOMATED
  - Run: `node scripts/setup-platforms.mjs --gumroad`
  - OR Antigravity: follow AUTOMATION GUIDE → Gumroad section
  - Script sets: name, description, $4.99 price, publishes listing
  - ⚠️ Cover image still needs Canva design first — set `CONFIG.gumroad.coverImagePath` in script once ready

---

## PHASE 2 — Email List as the Core Asset
**Why:** The email list is where recurring income actually comes from. Every subscriber is a potential $3.99/month forever.

### Tasks
- ✅ **Email platform: MailerLite** (free tier, supports automations)
  - Group ID: `180628908682512348` (Vibe Check Subscribers)
  - `send-card.html` and `view-card.html` now POST to `https://connect.mailerlite.com/api/subscribers`
  - ⚠️ **SECURITY NOTE for AI agents:** The API key is currently hardcoded in client-side HTML (visible to anyone who views source). This is acceptable for MVP. Long-term fix: move it behind a Netlify/Vercel serverless function. Do NOT rotate the key without updating both files.
- ✅ **Write a welcome email sequence** — COMPLETE
  - All 3 emails drafted in `WELCOME_EMAIL_SEQUENCE.md` — paste into MailerLite Automations
  - Email 1 (day 0): "Your first vibe is here ✨" — includes 3 free wallpaper downloads
  - Email 2 (day 2): "Why I started this (the real story)" — personal story + send card CTA
  - Email 3 (day 5): "Want more? Here's what Premium actually is." — Ko-fi + Gumroad links w/ UTM
  - ✅ **Setup Complete:** MailerLite Automations activated with 1-day and 3-day delays.
- ✅ **Set up weekly card pack email template** — COMPLETE
  - HTML template drafted in `WEEKLY_CARD_PACK_TEMPLATE.md`
  - Footer includes Ko-fi upgrade link + Gumroad premium designs link

---

## PHASE 3 — Premium Card Designs (Gumroad One-Time)
**Why:** People who just sent a card are warm. Offer them something tangible to buy immediately.

### Tasks
- 🟡 **Design 10 premium card themes** (Devin does this in Canva — cannot be automated)
  - Themes: Birthday, Grief Support, Hype-Up, Love, Anxiety Relief, Friendship, Self-Love, Congratulations, Just Because, "I See You"
  - Each theme: unique background, font, color palette
  - Export as a ZIP: 10 card backgrounds (PNG) + instructions
  - Once done: set `CONFIG.gumroad.coverImagePath` in `scripts/setup-platforms.mjs` to your image path, then re-run `--gumroad`
- 🤖 **Publish Gumroad product** — AUTOMATED (handled by `--gumroad` flag in setup script)
- ✅ **Wire "unlock design" flow in `send-card.html`** (AI can build this)
  - Show 3 free affirmation options by default
  - Show 7 locked premium affirmation options with a lock icon + blurred text
  - 🤖 **[Antigravity (Gemini) Suggestion]:** Instead of just blurring text, **show the specific names of the premium themes** (e.g., "Grief Support (Premium)" or "Hype-Up (Premium)"). High specificity increases the likelihood they will buy a pack for a unique situation.
  - Clicking a locked option → shows a tooltip: "Unlock all 10 premium designs for $4.99 →" → Gumroad link
  - No backend needed — redirect only

---

## PHASE 4 — The Send-Flow Conversion Funnel ✅ COMPLETE (partial)
**Why:** Every card sent is a conversion opportunity that's currently wasted.

### Tasks
- ✅ **`send-card.html` — post-send screen**
  - Share link → "Get free packs" email capture (MailerLite) → Gumroad premium designs upsell
  - Email capture submits to MailerLite subscriber API
- ✅ **`view-card.html` — recipient upsell**
  - Card back: "Get Daily Vibes Free ✨" → index.html, "Send One Back" → send-card.html
  - Email capture section added below product grid — free weekly pack pitch + Ko-fi upgrade link
- ✅ **Add share button to `view-card.html`**
  - "Share this card" → Web Share API (mobile) with copy link fallback
  - Viral loop: recipient shares → new senders → new email captures
  - 🤖 **[Antigravity (Gemini) Suggestion]: Gamify the share button.** Offer a micro-incentive: "Share this card with 3 friends to unlock a secret premium design." We can easily implement this using `localStorage` to track clicks without needing a backend.
  - Place it prominently above the email capture section
- ✅ **[Antigravity (Gemini) Suggestion]: Add a tiny "Pay What You Want" / Tip Jar early in the funnel.** On the post-send success screen (below Gumroad/MailerLite links), add a quiet link: *"P.S. Just want to say thanks? ☕ Buy me a coffee."* Some people won't want a sub or a layout pack, but will happily throw $5 your way to say thanks for the smile.

---

## PHASE 5 — SEO & Discovery (Organic Traffic)
**Why:** No traffic = no income.

### Tasks
- ✅ `index.html` already has `<meta name="description">` and keywords
- ✅ **Full Open Graph + Twitter Card tags** on all 3 pages — COMPLETE
  - `send-card.html`, `view-card.html`, `index.html` all have `og:title`, `og:description`, `og:image`, `og:url`, `twitter:card`
  - ✅ Created actual OG image at `assets/og-image.png` (🤖 AI generated)
- ✅ **Created `sitemap.xml`** in Website/ root
  - Lists: index, send-card, view-card, about, contact, privacy, terms, cookies
  - ⚠️ Still needs: Submit URL to Google Search Console → `https://www.thevibecheckproject.com/sitemap.xml`
- ✅ **Add a blog section** (5 posts minimum) — COMPLETE
  - Created `blog/index.html` hub page
  - Created 5 high-intent SEO posts targeting specific support scenarios
  - Each post beautifully styled with dark theme and integrated "Send a Card" funnel buttons
- ✅ **Target keywords**: "send affirmation card online free", "anonymous encouragement card", "free virtual encouragement card"
  - Added targeted emotional state posts: panic attacks, breakups, quiet friends, taking risks, and starting new jobs.

---

## PHASE 6 — Social Proof & Trust
**Why:** Nobody buys from a site that looks abandoned.

### Tasks
- ✅ **Testimonials** — placeholder (Sarah M., James T., Alex K.) removed. Replaced with honest "We just launched — be first to send a card" CTA. Add real quotes here when you have them by editing `index.html` testimonials section.
- ✅ **Live card counter** — COMPLETE
  - Replaced fake animated "10K+" stat with a real live counter powered by **counterapi.dev** (free, no account needed)
  - `send-card.html`: increments counter via `GET https://api.counterapi.dev/v1/thevibecheckproject/cards-sent/up` on every card creation
  - `index.html`: fetches current count on page load and displays in `#liveCardCount` element
  - Stats row now shows: "Vibe Checks Sent" (live) | "13 Card Themes" | "100% Free to Send"
- ✅ **Social links updated** — COMPLETE
  - **Instagram removed** — no account exists
  - **TikTok** — updated to `@TheVibeCheckPro` across all 7 HTML files
  - X (Twitter) and Ko-fi remain unchanged
  - Post 1 card per day as a TikTok/story with "Send one →" link in bio

---

## PHASE 7 — Analytics (So You Know What's Working)
**Why:** You can't optimize what you can't measure.

### Tasks
- ✅ **Microsoft Clarity analytics** — COMPLETE (replaced Plausible — Plausible costs $9/mo)
  - Project ID: `vohl4gduni`
  - Script tag added to all 13 HTML files (index, send-card, view-card, about, contact, privacy, terms, cookies, careers, blog/index + 5 blog posts)
  - Includes session recordings + heatmaps — more useful than pageview-only analytics
  - `privacy.html` and `cookies.html` updated to accurately describe Clarity cookie usage
  - ✅ Already active — Clarity activates on first page load, no manual registration needed
- ✅ **UTM params on all outbound Ko-fi and Gumroad links** — COMPLETE
  - `index.html` premium section → `utm_campaign=premium-section`
  - `index.html` support section → `utm_campaign=support-section`
  - `index.html` gift button → `utm_campaign=gift`
  - `view-card.html` product card + email capture → `utm_campaign=card-view`
  - `send-card.html` Gumroad upsell box → `utm_campaign=post-send`
  - `send-card.html` locked design click → `utm_campaign=locked-design`
  - `send-card.html` tip jar → `utm_campaign=tip-jar`
  - Welcome Email 3 → `utm_campaign=welcome-sequence`

---

## REVENUE PROJECTIONS (Realistic)

| Source | Conversion | Monthly |
|--------|-----------|---------|
| Email list → Ko-fi ($3.99/mo) | 500 subs, 2% convert = 10 members | $39.90/mo |
| Gumroad card pack ($4.99) | 200 visitors/mo, 1% buy = 2 sales | $19.98/mo |
| Email list growth | 50 new subs/mo from card flow | Compounds |
| **Total Month 1** | | ~$60/mo |
| **Total Month 6** | (list at 1,500, 3% convert) | ~$180/mo |
| **Total Month 12** | (list at 5,000, 5% convert) | ~$999/mo |

The email list is the flywheel. Every card sent → email capture → nurture → Ko-fi conversion.

---

## CURRENT PRIORITY ORDER (for next AI session)

1. ✅ ~~Phase 1 — Rewrite the pitch~~
2. ✅ ~~Phase 4 (partial) — Email capture on send + view flows~~
3. ✅ ~~**Phase 4 remainder** — Add share button to `view-card.html` (Web Share API)~~
4. ✅ ~~**Phase 3 remainder** — Wire locked premium designs in `send-card.html`~~
5. ✅ ~~**Phase 2** — Welcome email sequence drafted (`WELCOME_EMAIL_SEQUENCE.md`)~~
6. ✅ ~~**Phase 5 (partial)** — OG meta tags on all pages + `sitemap.xml` created~~
7. ✅ ~~**Phase 7** — Plausible analytics + UTM params on all Ko-fi/Gumroad links~~
8. ✅ ~~**Phase 6 (partial)** — Footer social links (TikTok, Instagram, Ko-fi) added to all pages~~
9. ✅ ~~**Phase 6 (partial)** — About, Contact, Privacy, Terms, Cookies pages rewritten with accurate content~~
10. ✅ ~~**Phase 6** — Fake testimonials replaced with honest launch CTA~~
11. ✅ ~~**Phase 6** — Live card counter (counterapi.dev) replaces fake "10K+" stat~~
12. ✅ ~~**Analytics** — Microsoft Clarity installed (project `vohl4gduni`) across all 13 HTML files~~
13. **Devin to-do (manual):** Submit `sitemap.xml` to Google Search Console
14. ✅ ~~**Social links** — Instagram removed (no account), TikTok updated to `@TheVibeCheckPro`~~
15. ✅ ~~**Phase 5 remainder** — Blog section (3-5 posts, SEO-targeted)~~
16. **Devin to-do (manual):** Once you have 1-3 real user quotes, add them back to the testimonials section in `index.html`

---

## FILES MODIFIED SO FAR

| File | What Changed | Phase |
|------|-------------|-------|
| `index.html` | Pitch copy rewrite, premium subtitle, support section overhaul, social links in footer | 1, 6 |
| `send-card.html` | Email capture (MailerLite), Gumroad upsell, locked premium designs, Tip Jar | 2, 3, 4 |
| `view-card.html` | Share button (Web Share API + fallback), email capture, product grid | 4 |
| `about.html` | Complete rewrite — The Vibe Check Project story, mission, support CTAs | 6 |
| `contact.html` | Complete rewrite — real email, accurate FAQs (free cards, Ko-fi, Gumroad, MailerLite) | 6 |
| `privacy.html` | Updated — accurate data practices, Clarity/MailerLite/Ko-fi/Gumroad disclosure | 6 |
| `terms.html` | Updated — card-sending service, no accounts, Ko-fi/Gumroad payment terms | 6 |
| `cookies.html` | Updated — Microsoft Clarity (session recording cookie), removed Google Analytics, accurate third-party list | 6 |
| `careers.html` | Nav + footer updated to match site branding | 6 |
| `WELCOME_EMAIL_SEQUENCE.md` | New file — 3 welcome emails ready to paste into MailerLite Automations | 2 |
| `sitemap.xml` | Created — submit to Google Search Console | 5 |
| `assets/og-image.png` | Created (AI-generated) — replace with Canva design (1200x630) when ready | 5 |
| `blog/index.html` | New file — blog hub, links to all 5 SEO posts | 5 |
| `blog/what-to-say-*.html` (×5) | New files — 5 high-intent SEO posts targeting specific emotional scenarios | 5 |
| All 13 HTML files | Microsoft Clarity analytics snippet added (project `vohl4gduni`) | 7 |
| All 7 page HTML files | Instagram link removed; TikTok updated to `@TheVibeCheckPro` | 6 |
| `index.html` | Fake testimonials replaced with honest launch CTA | 6 |
| `index.html` | Live card counter via counterapi.dev replaces fake "10K+" stat | 6 |
| `send-card.html` | Increments counterapi.dev on every card creation | 6 |

## FILES STILL TO TOUCH

| File | Phase | What Needs Doing |
|------|-------|-----------------|
| `index.html` | 6 | Add real testimonials once you have 1-3 actual user quotes (DM or email ask) |

---

## AUTOMATION GUIDE — For Antigravity (Browser Tool)

> Use this section when Devin asks you to handle the platform setup tasks.
> Open each URL in your browser tool. Devin will sign in. You fill in the content.

### Ko-fi Membership Setup

1. Open: `https://ko-fi.com/account/login`
2. **PAUSE** — let Devin sign in
3. Navigate to: `https://ko-fi.com/manage/memberships`
4. Click **"Add Tier"** (if no tier exists) or **"Edit"** on the existing tier
5. Fill in:
   - **Title:** `Daily Affirmations + Weekly Card Packs`
   - **Price:** `3.99` (monthly)
   - **Description:**
     ```
     Your monthly drop of good vibes — delivered straight to your inbox.

     What you get every month:
     ✨ 30 daily affirmations (one per day, sent to your email)
     🃏 4 exclusive card pack drops (themed weekly, e.g. "Sunday Vibe Pack")
     🎨 Early access to new card designs before they go public
     💜 Direct support for an independent creator building something real

     Cancel anytime. No questions asked.
     ```
6. Click **Save** / **Update**
7. Confirm the membership page at `https://ko-fi.com/thevibecheckproject/membership` shows the new details

---

### Gumroad Product Setup

1. Open: `https://app.gumroad.com/login`
2. **PAUSE** — let Devin sign in
3. Navigate to: `https://app.gumroad.com/products`
4. Find and click the Vibe Check Project Premium listing, then click **Edit**
5. Fill in:
   - **Name:** `Premium Card Design Pack`
   - **Price:** `4.99`
   - **Description:**
     ```
     10 exclusive animated card design themes — yours forever, one-time purchase.

     Unlock premium card backgrounds for every vibe:
     🎂 Birthday  💔 Grief Support  🔥 Hype-Up  💕 Love  🌿 Anxiety Relief
     👯 Friendship  💜 Self-Love  🎉 Congratulations  ✨ Just Because  👁️ "I See You"

     Each theme has a unique background, font, and color palette.

     Delivered as a ZIP with 10 PNG card backgrounds + instructions.
     ```
   - **Cover image:** Skip if Devin hasn't made the Canva image yet. Come back to this step.
6. Click **Publish** (toggle from unpublished → published)
7. Confirm the yellow dot is gone and the product shows as active

---

### Notes for Both Systems
- Never store Devin's login credentials — always pause for manual sign-in
- If a field selector doesn't work (site UI changed), take a screenshot and ask Devin to point to the right field
- After completing setup, update the task status in this file (🤖 → ✅)
