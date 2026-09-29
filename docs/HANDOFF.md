# Handoff — current state of The Vibe Check Project

Last updated: 2026-09-24. Read this first, then `CLAUDE.md` (project rules), `docs/README.md` (how the
site works) and `docs/scripts.md` (build scripts, newsletter jobs, workers).

---

## 1. How to work with the owner

- **Work in small phases.** Do one thing, show it, stop. Don't run long multi-step sessions unasked.
- **Explain simply.** The owner is not a developer. For dashboards (Cloudflare, Stripe, MailerLite,
  EmailJS, GitHub) give numbered click-by-click steps.
- **Honesty is a hard rule.** No invented stories, testimonials, statistics, or promises the site
  doesn't keep. If copy claims something, the code must actually do it. AI-written "stories" sent to
  subscribers were a real incident (Sept 2026); a content check now blocks them (see §4.3).
- **The owner's name must never appear on the website.** A static test enforces it.
- **Show, don't just describe.** For visual work, build a preview the owner can open, and take
  screenshots at phone size (iPhone 13) and desktop to check it yourself before reporting.
- **Browser automation uses Microsoft Edge** (Playwright `channel: 'msedge'`), never Chrome.
- **Git:** work directly on `main` (the owner asked to stop using branches). **Pushing to `main`
  deploys the live site** via GitHub Pages. Run `npm run build` and `npm test` before every push.
- Windows machine, repo in OneDrive. Many files have CRLF line endings: when doing string
  replacements in scripts, normalise `\r\n` → `\n` first or the match silently fails.

## 2. The site in one paragraph

Static site (plain HTML/CSS/JS, no framework) on GitHub Pages behind Cloudflare, at
`https://thevibecheckproject.com`. People make a free encouragement card; the card is not stored,
it is encoded into a link `view-card.html?data=<base64url JSON>` that they text/email. Premium
($4.99 one-time, Stripe) unlocks more backgrounds, sounds, collections and writing your own words.
There is a free daily affirmation email (MailerLite) and a welcome email series.

## 3. Live services (all deployed and working)

| Service | What | Where it's configured |
| :--- | :--- | :--- |
| GitHub Pages | hosts the site from `main` | repo `TheVibeCheckProject/Website` |
| Cloudflare Worker `vibe-card-preview` | personalised link previews for card links | `workers/og-preview.js`, route `thevibecheckproject.com/view-card.html*`, fails open |
| Cloudflare Worker `vibe-counter` + D1 `vibe-counter` | cards-sent / newsletter counters, My Vibes read receipts | `workers/counter.js`; URL in `js/core-utils.js` and `.github/workflows/daily-newsletter.yml` |
| Cloudflare Worker `vibe-premium` | verifies Stripe purchases before unlocking Premium | `workers/premium-verify.js`; Stripe Payment Link redirects to `send-card.html?premium=1&session_id={CHECKOUT_SESSION_ID}` |
| Cloudflare Worker `vibe-check-proxy` | adds sign-ups to MailerLite (keeps the API key secret) | `workers/mailerlite-proxy.js` |
| MailerLite (free plan: 3 automations, 2,500 emails/mo) | welcome series, 30-day check-in, daily emails | see §4 |
| EmailJS (free: 200 emails/mo) | emails a card to its recipient | `js/send-card-logic.js`, service `service_cn9gjbv`, template `template_bpj8rue`; sends from the Gmail noreply address, Reply-To `wecare@thevibecheckproject.com` |
| Stripe | Premium payment link | `https://buy.stripe.com/14A8wPd160dd9Cz0n11VK02` |
| GitHub Actions | daily email send + monthly content generation | `.github/workflows/` (their own schedules are a late, off-the-hour backup only) |
| Cloudflare Worker `vibe-newsletter-trigger` | starts those two workflows on time (GitHub's schedule ran 3–4 h late / skipped) | `workers/newsletter-trigger.js`; crons `0 14 * * *`, `0 15 * * *` (sends only when it's 9 AM in Chicago), `0 10 25 * *`; secret `GITHUB_TOKEN`. **Deployed 2026-09-25** (secret + 3 crons set). First real run: 2026-09-26 9 AM Central. Verify in GitHub → Actions → Daily Newsletter (event "workflow_dispatch"); if missing, check the worker's Logs (401/403 = token repo or "Actions: Read and write" permission). |

GitHub Actions secrets in use: `MAILERLITE_API_KEY`, `MAILERLITE_GROUP_ID`, `GEMINI_API_KEY`. (Unused
`STRIPE_SECRET_KEY` and `ANTHROPIC_API_KEY` were deleted.) Support address: `wecare@thevibecheckproject.com`.

## 4. Emails

All email HTML copies live in `docs/email/` (they are copies of what's pasted into MailerLite/EmailJS;
edit both together). Design: background `#1A1625`, text `#EDE8F5`, secondary `#C9BFDA`, pink
`#FF6B9D`, gold `#FEC84A`. Details: `docs/email/WELCOME_EMAIL_SEQUENCE.md`.

### 4.1 Welcome series — MailerLite automation "Welcome"
Trigger: joins group **Vibe Check Subscribers** (`180628908682512348`) → Email 1 (`welcome-email.html`,
with the animated card GIF `assets/email/welcome-card.gif`) → wait 1 day → Email 2 → wait 3 days → Email 3
(honest Premium explainer). Name merge tag: `{$name|default('there')}`. The site sends a blank name
when none is typed (never "Friend").

### 4.2 30-day check-in — MailerLite automation "30-Day Check-in" (active)
When a sender ticks "Remind me to check back in on … in 30 days", the site adds them to group
**30-Day Check-ins** (`199536380251997858`, `CHECKIN_GROUP_ID` in `js/send-card-logic.js`) — NOT the
daily list — with fields `name`, `recipient_checked`. Automation: joins group → wait 30 days →
`checkin-30-day.html` → remove from group.

### 4.3 Daily email — GitHub Actions + MailerLite API
- `daily-newsletter.yml` (14:00 UTC) runs `scripts/newsletter/send-newsletter.js`: takes today's entry
  from `newsletter-content/batch.json`, **checks it** with `checkEmail`, renders it with `renderEmail`
  (`scripts/newsletter/email.js`), sends a MailerLite campaign. Fails loudly if today is missing or
  fails the check.
- `generate-newsletter-batch.yml` (25th monthly) runs `generate-batch.mjs`: Gemini writes next month's
  missing days, **only emails passing `checkEmail` are kept**, days are merged (never overwritten),
  the run fails if a day is still missing.
- Every daily email is an **affirmation for the reader** (type `AFFIRMATION`, or `OCCASION` for real
  dates like World Mental Health Day). Fields: `date, type, occasion?, subject, preview_text, intro,
  affirmation, reflection`. A "Send this to someone" button prefills a card with the affirmation.
- `checkEmail` rejects invented stories and claims (he/she/her/his, "a friend of mine", coworkers,
  baristas, statistics, "studies show"…). `npm run test:static` checks every queued day.
- Sept 25 – Oct 31 were written by hand. If you generate content, keep it true and reader-focused.

### 4.4 EmailJS card email
New dark design in `docs/email/emailjs-card-email.html` (variables `{{to_name}}`, `{{from_name}}`,
`{{message}}`, `{{card_link}}`). Live in the EmailJS dashboard (done 2026-09-24); recipient name falls
back to "there". Edit both copies together.

## 5. What was done in this round (Sept 2026), newest first

- Card page (`view-card.html`): panel under the card now waits ~4 s after the flip; only reply buttons,
  a "send a card to someone else" link and the daily sign-up remain (share button, Premium ad removed).
- Mobile fixes: sign-up popup fits small phones; round sound/mute buttons (a global 48px touch
  min-height was stretching circles); contact page no longer duplicates the FAQ.
- 30-day check-in built end to end (own group, honest copy, email).
- Removed the "3 free wallpapers" promise everywhere (nothing delivered them).
- Daily email rebuilt (affirmations only, content check, new design); outage fixed (batch.json was
  being overwritten); counter URL moved into the workflow.
- Welcome series rewritten (no invented origin story, honest Premium email).
- Site overhaul merged (PR #1): fabricated claims, AdSense, Amazon links and the owner's name removed;
  Premium verified with Stripe; counters/read receipts; shared nav/footer; SEO; tests.

## 6. In progress: the card-creation flow redesign (the big creative project)

The owner wants to reinvent `send-card.html` (the site's main flow) — "out of the box", ambitious,
beautiful, especially on phones. Problems with today's flow: step 1 is ~4.5 phone screens tall;
"Next" leaves you at the bottom of the next step; the sound grid overflows.

**Prototypes live in `assets/testassetcode/`. This folder is git-ignored on purpose**: `assets/` is
published, and these are experiments (with third-party CodePen code). Don't commit it; move ideas into
real files when building. Open the files directly in a browser.

### 6.1 `preview.html` — the card flow (owner: "beautiful, looks amazing")
Built on the owner's CodePen carousel (`1.html`, `2.css`, `3.js`, used unchanged; overrides in
`preview.html`). What's in it:
1. **3D parallax carousel of cards** (Vibe Check colours, portrait cards, side-card blur only 0.6px,
   no auto-advance). Tap any card to bring it to the front. The background's **name** shows as a big
   serif title under the carousel with tags (Animated / New / 🔒 Premium).
2. **Premium vs free:** free users can never bring premium cards (animated backgrounds, Nebula) into
   focus. Premium cards sit grouped at the end of the ring, behind frosted glass with a sweeping light
   band and a 🔒 badge; tapping one opens a Premium sheet. A preview-only Free/Premium switch sits top-left.
3. **Words: removed for now (2026-09-25); Portal Zoom chosen 2026-09-29, see §6.3.** The owner rejected every word picker so far: a docked
   bottom panel with mood bubbles + 3D wheel ("don't like docked, don't like the look"), and a "sky of
   words" with smoky floating phrases ("not fluid, laggy"). All word-picker code was taken out of
   `preview.html`, and other experiments were moved to `assets/testassetcode/_archive/`. The owner's
   direction: **keep only the carousel and the send button (the pieces worked on most)**. For the words,
   wait for the owner to bring a reference effect they love (as with the carousel and send button).
   Content to reuse later: the "situations" with quotes (e.g. "They went quiet") in the archived files.
4. **"Choose this card"** → card lifts, flips open ("Write inside"): affirmation hero panel on the
   chosen background, To / From / note / sound. A **mandatory glass help guide** shows on first open
   (until "Got it"; "Don't show this again" is saved in localStorage `vc_skip_write_help`); a **?** next
   to FROM reopens it. "Change card" flips back; "Send it" closes and floats the card away.
5. Reduced-motion users get crossfades instead of flips/flights.

### 6.2 `send-demo.html` + `send-wide.js` — the Send button (owner: "Yes!!! looks amazing")
Based on the owner's GSAP CodePen (`send.html`, `send.css`, `send.js` — originals untouched).
Pink→gold "Send" button; press → it morphs to a circle; a paper plane flies a wide loop (up over the
button, down the right side, back along the bottom, round the left, in from the left) with a short
glowing ribbon and **stardust** (sparkles and hearts). Along its own path it **writes "Thanks for
sending a vibe!"** in *Gochi Hand*, one warm-white colour (`#FFF6DC`): letters appear exactly where the
plane is (quick fade, no bounce), **back-to-front** — the "!" comes out first on the right side where
the plane dives straight down, so "vibe!" stands sideways (you tilt your head to read it) and the rest
curves round the bottom. The plane levels upright on landing, becomes a ✓, "Sent!" slides out.

Owner feedback that shaped it (don't regress): wide wonky flight, trail must stay on the plane,
✓ must land upright, letters must come OUT of the plane (not reveal/appear magically, not fly/bounce
into place), one colour (no gradient, no rainbow letters), hard curve with the first letter near 90°.

### 6.3 Affirmation picker: Portal Zoom (in `assets/testassetcode/`)
**Decision 2026-09-29: the owner chose Concept 1, Portal Zoom.** Concepts 2 (Kinetic Diptych), 3 (Camera Dolly), 4 (Orbital Halo) and 5 (Horizon Split) and the concepts hub were deleted.
1. **Concept 1: The Portal Zoom** (`concept-1-portal.html`). **Transition rebuilt 2026-09-29** after the owner called the first slowed-down version (light burst, gold ripple, blur fades) "trash": now one continuous JS-driven camera move. The card hands off to a full-screen "window" (clip-path) showing the same artwork in the same spot (no visible swap), the window grows past the screen edges (geometric growth, gold rim carried along), a crisp canvas light field in the card's colours streaks past at mid-move and settles to a drift; then title, chips and words arrive from depth (no blur). "Change Card" plays the same move in reverse. Owner direction: comprehensive, seamless, high quality; no cheap glow/blur effects. `PACE` sets speed; particle colours are `light` in `CARDS`.

**Premium + write your own in the Portal (2026-09-29, owner decisions):** word sets = both (the prototype "situations" free; Calm/Celebrate/Love/Healing from the live site as locked chips); free users tapping a locked collection **see its words** and the main button turns into "Unlock Premium — $4.99"; premium cards stay **locked in the carousel** (frosted veil + 🔒, arrows skip them, tap opens the Premium sheet; same as `preview.html`). Every word set ends with a **"Your own words"** stop: Premium users type right where the words float (same serif, 200-character limit like the live site, rotating fixed prompts, Enter/Done to finish); free users get the Premium sheet. Animated backgrounds: the card's playing video is moved into the portal, so it never jumps. A preview-only "Viewing as Free / Premium" switch is in the header; "Unlock" in the prototype just flips it. **For the real build:** before sending someone to Stripe, save their card + words (localStorage) and bring them back to that exact spot (today the payment link returns to the start of `send-card.html`); keep the send-time check that custom words need Premium.

### 6.3b Built on branch `feature/portal-card-flow` (2026-09-29), not merged yet
Follows the Portal Integration Guide (Claude doc). What's in it:
- `send-card.html` rewritten: carousel (21 cards: 7 free incl. new sage/sand/slate in `assets/backgrounds/`, 14 Premium incl. 6 videos), portal, words, note panel (`#cardForm`), Premium sheet (`#premOverlay`), the saved Send SVG, success overlay. `css/card-flow.css`, `js/card-flow.js` (UI), `js/send-plane.js` (the prototype's `send-wide.js`, unchanged inside, wrapped so it only runs when GSAP loaded; exposes `window.SendPlane`).
- `js/send-card-logic.js` trimmed to data + Premium + sending: word sets (General + 5 situations free; Calm/Celebrate/Love/Healing Premium), `SOUND_DEFS`, `backgroundDefs` (+ `light` particle colours), paywall at send now also blocks Premium collection quotes for free users (`isFreeWords`), submit plays the plane while the card is created, success after landing (no confetti).
- Premium return: before Stripe the place is saved in `localStorage.vc_flow_draft` (24 h), the Stripe link opens in the same tab, and after the verified unlock the page flies straight back into that card/words (`restoreDraft`). A purchase in another tab unlocks in place (`storage` event).
- Fallbacks: no GSAP (offline/blocked) or reduced motion → plain Send button, card still sends; reduced motion → crossfades, no particles. Rollback: `send-card.html?classic=1` → `send-card-classic.html` (+ `js/send-card-classic.js`, frozen copies of the old form; noindex, excluded from the sitemap).
- Tests: `tests/e2e.js` drives the new flow (+ section 7: taps, locks, paywall at send, own words 200-char cap, 9 card fields, saved place, no-GSAP send, classic redirect). `npm test` green (2815 static, 141 e2e). `tests/visual.js` states updated (baseline is local; re-save it).
- Still to do by hand before merging (guide's checklist): mid-range Android (fly-through measured 52 fps desktop / 72 fps phone at 4x CPU slowdown in headless Edge; real GPU should be better), a real Stripe purchase round trip, a real EmailJS send, open 3 pre-change card links, WhatsApp/iMessage link preview. Owner decisions taken as recommended: General kept, presets as chips under the title, sound row in the note panel, neutrals added, same-tab checkout, classic kept 2 weeks.

### 6.4 Next steps / open decisions (ask the owner)
1. How to pick the words: **Portal Zoom chosen** (§6.3); next is building it into the card flow.
2. **Send animation in the flow: done in the Portal prototype (2026-09-29).** The note panel's send button is the saved `send-demo.html` SVG, lined up on a slot in the panel; `send-wide.js` is loaded unchanged and driven through its own `onBtnDown`/`onBtnUp`. On press the panel fades, the button glides to centre stage at the demo's size, then the plane flies, writes and lands as Sent!. The main button inside the portal now says **"Next →"** (owner: "Write Inside Card" was unclear).
3. **GSAP: allowed (owner decision 2026-09-29)** for the send animation (GSAP + MorphSVG/DrawSVG/MotionPath from jsDelivr); CLAUDE.md updated.
4. Only 10 free affirmations → free moods feel thin. The homepage has ~30 more to reuse.
5. Background redesign + adding the neutral backgrounds (sage/sand/slate from
   `scripts/marketing/backgrounds/`) belong in this project. The owner will make premium backgrounds.
6. Restyle `view-card.html` (still old lime-green) to match.
7. Build real: phones first, test on a mid-range Android, keep card links backward compatible.

## 7. Technical traps we already hit (save yourself the time)

- **Hidden layers must be `visibility: hidden`, not just `opacity: 0`.** Concept 1 hid the word layer with opacity only; its phrases had `pointer-events: auto`, so invisible words sat on top of the cards and each click spun the hidden wheel ("takes 4 clicks"). Also: a `preserve-3d` rig's own box sits in front of cards pushed back in Z and eats their clicks, so give the rig `pointer-events: none` and the cards `auto`.
- `body { overflow-x: hidden }` is still scrollable by script (focus/scrollIntoView shifted the whole page 68px); use `overflow-x: clip`.
- **Handing a shared element back** (portal window → card): turn the card's `transition` off for that frame before making it visible, and close the window a frame later. Otherwise it inherits the carousel's 0.75 s opacity fade and leaves an empty hole where the card should be.
- **Full-screen effects: size them with `document.documentElement.clientWidth/Height`, not `window.innerWidth/Height`.** `innerWidth` includes a desktop scrollbar (15px on Windows), so the portal window came out 15px narrower than its gold frame (a dark strip down the right). Headless test browsers hide scrollbars; launch with `ignoreDefaultArgs: ['--hide-scrollbars']` to see it.
- **send.js converts every `<rect>`/`<circle>` to a `<path>` at load** (`MorphSVGPlugin.convertToPath`).
  Anything you add that must stay a rect (e.g. a clip rect you move) gets converted; use a `<path>`.
- **MotionPathPlugin drifted** the plane ~70 units off the drawn route (rotation pivot off-centre). The
  plane is now driven manually each frame from `route.getPointAtLength()`; set `svgOrigin` **once**
  (setting it every frame makes GSAP compensate and the plane flies off-screen).
- Element IDs become globals: a `window.vcWords` object clashed with `<div id="vcWords">`. Pick
  global names that aren't element IDs.
- A 3D word wheel magnifies the centre item unless the drum is pushed back by its radius (`translateZ(-R)`).
- `styles.css` gives all touch-device buttons `min-height: 48px`; small round buttons need their own
  `min-height` or they become ovals.
- `.vc-flip` studio overlay must be `visibility: hidden` when closed or it leaves a ghost card.
- A tap that opens a sheet can also "click" the sheet's backdrop and close it instantly — ignore
  backdrop clicks for ~400 ms after opening.
- Carousel captures pointers for dragging, so taps are detected manually (moved < 8px, < 500 ms)
  and matched with `document.elementsFromPoint`.
- Windows "Animation effects" off ⇒ browsers report `prefers-reduced-motion: reduce` ⇒ flips don't play.
- Build: nav/footer partials may be CRLF; `sync-layout.js` normalises them (fixed a stray-CR bug).

## 8. Commands

```
npm run build        # generated pages, nav/footer, ?v= hashes, sitemap — after any page/CSS/JS change
npm test             # static checks + Edge browser tests (must pass before pushing)
npm run test:visual  # computed-style fingerprint vs baseline (--update to accept a change)
```

## 9. Other open items (smaller)

See `docs/REFACTOR_PLAN.md` for the remaining cleanup list (split `js/script.js` by page, two odd
articles onto `article.css`, self-host Unsplash images, review Gemini-written blog posts).
Owner task that may still be outstanding: a real Premium test purchase + refund in Stripe.
