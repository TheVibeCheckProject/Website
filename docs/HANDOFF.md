# Handoff — current state of The Vibe Check Project

Last updated: 2026-11-10 (redesign on branch `claude/gallant-cerf-nb809b`, see §5a; not yet on `main`). Read this first, then `CLAUDE.md` (project rules), `docs/README.md` (how the
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
- **Git:** work directly on `main` for normal changes (the owner asked to stop using branches).
  **Pushing to `main` deploys the live site** via GitHub Pages. Run `npm run build` and `npm test`
  before every push. For a big change the owner wants to test first, use a branch + draft PR (as for
  the card flow, PR #3) and merge when they say go.
- **The owner's laptop runs on one fan** (a failing fan was unplugged 2026-09-29; CPU turbo is capped
  with Windows' "Maximum processor state" = 99%). Keep heavy work light: run the full browser suite
  when it's needed, not after every small edit, and stop any local servers you start.
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
- `generate-newsletter-batch.yml` (daily ~1 AM Central, plus the Cloudflare trigger on the 25th) runs
  `generate-batch.mjs`: Gemini fills every missing or broken day from today to the end of next month,
  **only emails passing `checkEmail` are kept**, valid days are merged (never overwritten), the run
  fails if a day is still missing. (Nov 2026: an outside tool overwrote `batch.json` on Oct 20 with
  November in the old `body_html` format, and the old 25th-only, next-month-only job couldn't repair it.)
- Every daily email is an **affirmation for the reader** (type `AFFIRMATION`, or `OCCASION` for real
  dates like World Mental Health Day). Fields: `date, type, occasion?, subject, preview_text, intro,
  affirmation, reflection`. A "Send this to someone" button prefills a card with the affirmation.
- `checkEmail` rejects invented stories and claims (he/she/her/his, "a friend of mine", coworkers,
  baristas, statistics, "studies show"…). `npm run test:static` checks every queued day.
- Sept 25 – Oct 31 were written by hand. If you generate content, keep it true and reader-focused.

### 4.4 EmailJS card email
`docs/email/emailjs-card-email.html` (variables `{{to_name}}`, `{{from_name}}`, `{{message}}`,
`{{card_link}}`), pasted into the EmailJS dashboard; edit both copies together. **It never shows the
card's words or note** (owner, 2026-09-29: that spoiled the card): the site sends a fixed `message`
("It's waiting for you inside…") and the template presents the card as sealed ("FOR SAM"). Updated
template pasted by the owner 2026-09-29.

## 5. What was done recently, newest first

- **2026-09-29 — the new card flow went live** (PR #3, see §6): carousel → portal → words → note →
  paper-plane Send → success screen; recipient page redesigned to match. Same day, after launch:
  phone keyboard no longer covers the note panel; send-time check also blocks Premium cards and
  sounds for free users; the card email no longer reveals the words; the plane holds 3.5 s on
  "Thanks for sending a vibe!" before the success screen.
- Card page (`view-card.html`): panel under the card waits ~4 s after the flip (kept in the redesign).
- Mobile fixes: sign-up popup fits small phones; round sound/mute buttons; contact page no longer
  duplicates the FAQ.
- 30-day check-in built end to end (own group, honest copy, email).
- Removed the "3 free wallpapers" promise everywhere (nothing delivered them).
- Daily email rebuilt (affirmations only, content check, new design); outage fixed.
- Welcome series rewritten (no invented origin story, honest Premium email).
- Site overhaul merged (PR #1): fabricated claims, AdSense, Amazon links and the owner's name removed;
  Premium verified with Stripe; counters/read receipts; shared nav/footer; SEO; tests.

## 5a. The November 2026 redesign (branch `claude/gallant-cerf-nb809b`, awaiting the owner's go)

The owner asked for a full redesign to beat the competition (affirmation apps, e-card sites, daily
newsletters). What changed:

- **Look, site-wide:** night ink `#14111F`, warm paper `#FFF6E4`, one gold `#F6C76B`, one rose `#F58FA8`.
  Cormorant Garamond for anything said out loud, Outfit for controls, Caveat for handwritten asides.
  Tokens are the `:root` block in `css/styles.css`; the shared chrome (nav, buttons, footer, headings,
  pills) is restyled by the "Design refresh" layer at the **end** of `css/styles.css`. New nav partial
  (SVG mark, no emoji, gold "Send a card" pill). Every page loads one shared Google Fonts URL.
- **Homepage rebuilt** (`index.html`, `css/home.css`, `js/home.js`; `js/animations.js` deleted):
  - **The sky** (`js/sky.js`, `window.VibeSky`): a canvas behind the whole page painted for the
    visitor's own clock: colours by hour, sun or moon in its real phase, stars, drifting cloud, seeded
    hills, a rare shooting star on clear nights. 15 fps, 1x pixels, paused when hidden (the one-fan
    laptop). `?sky=21.5` previews an hour. Reduced motion = one still frame a minute.
  - **Today's card** (`js/daily.js`, `window.VibeDaily`): sealed paper card, one tap breaks the seal
    and turns it over. The words are **the same as that morning's email** (read from
    `newsletter-content/batch.json`, which is published with the site; a fixed list picked by date is
    the fallback). Then: send it (name field → `send-card.html?message=&recipient=`), save it as an
    image (phone wallpaper 1179×2556 or square 1080, drawn by `VibeSky.renderImage`, share sheet on
    phones), keep it, copy it, breathe with it (three slow breaths). Opened days, the streak and kept
    days live in `localStorage.vc_daily`, nowhere else.
  - "Today's card has been opened N times" uses the existing counter worker (`daily-YYYY-MM-DD`);
    it only shows when the worker returns 2 or more. No worker change was needed.
  - **The vibe check:** five answers (Heavy, Restless, Worn out, Steady, Bright). Each changes the
    sky's weather and answers with words, a send button and a real guide. Stored in the browser only.
  - Join form keeps its IDs (`initJoinForm` in `js/script.js`); the success message no longer
    promises "download links" (nothing sent them).
- **Sealed cards (new, free):** "Seal it until a day" in the note panel adds an optional `openOn`
  (`YYYY-MM-DD`) to the card link. `view-card.html` keeps the card closed until that day on the
  recipient's own calendar, shows the date and offers a calendar file (.ics). The sender's preview is
  never sealed. Links without `openOn` are untouched (still the same nine fields). It is a courtesy
  seal, not security: the words are in the link.
- **My Vibes:** new "Kept days" gallery (`js/kept.js`), each day under the sky it was opened in, with
  Send / Wallpaper / Remove. Sent cards show "Sealed until …".
- **Tests:** `VC_TEST_BROWSER=/path/to/chromium npm run test:e2e` runs the browser tests without Edge
  (cloud sessions); on the owner's machine nothing changes (Edge). New journeys: homepage (8) and
  sealed cards (9). Pages no longer throw when the Lucide icon CDN is blocked.
- **Not changed on purpose:** the card flow's mechanics and the recipient page (owner-approved in
  §6.3), the emails, the workers, Premium rules and price.

**Needs a server, so proposed rather than built:** emailing a sealed card on its day (today the sender
shares the link and the page holds it shut); a real, tamper-proof seal; a daily push notification;
syncing Premium / kept days across devices; group cards signed by several people.

## 5b. Round 2 of the redesign (same branch, 2026-11-10)

The owner's second brief: micro-animations everywhere (top priority, "snappy and quick, never slow"),
downloads verified end to end, more to create, real rebuilds of the inner pages, and "wow".

- **Motion layer** (end of `css/styles.css` + `VibeMotion` in `js/core-utils.js`), on every page:
  press feedback on every button (uses the `scale` property so it never fights a `transform`),
  `[data-reveal]` scroll reveal (`--d` staggers; call `VibeMotion.scan(root)` after adding elements),
  `.lift` hover lift, `.is-loading` button spinner, `.skeleton`, a gold line across the top while the
  next page loads, cross-page View Transitions (fade-in fallback). Durations 70–420 ms. The owner's
  new rule replaces "take the time a move needs": **nothing slow, no drifting holds**.
- **Homepage:** hero words rise in, the card drops in; the card tilts to the pointer with a moving
  highlight; the seal cracks, splits in two and crumbles (about 0.4 s) and the card turns over in
  0.6 s with one sweep of light; a newly earned streak dot pops with a ring; the fan of cards deals
  itself out; the sky runs through the last five hours on arrival, leans with the pointer, clouds
  drift visibly, stars twinkle, the sun/moon glow breathes; tap the night sky for a shooting star.
  Return-visit details: "Welcome back", "N kept days →", "Tomorrow's card arrives in 5 h 12 min",
  the nav mark is a sun by day and a pale moon after dark. Clicks are handled on the whole paper
  face (a 3D-tilted card can deliver the click to the face instead of the button inside it).
- **Card maker:** 34 cards now: **17 free** (8 new painted scenes: Lighthouse, Golden Meadow, Rain on
  the Window, Snowfall, Paper Boat, Cherry Blossom, Mountain Sunrise, City Lights; rendered 1080 wide)
  and the same 17 Premium. 14 occasion quick-picks (8 new). 7 new free phrase sets of 10 (Grief,
  Exams & Interviews, Get Well, Long Distance, New Parent, Thank You, I'm Sorry): over 100 free phrases.
  The scene scripts accept `VC_TEST_BROWSER` like the tests.
- **Card images** (`js/card-image.js`, `window.VibeCardImage`): any card as a phone wallpaper
  (1179×2556) or square (1080×1080), drawn with the card's own art (a video frame for animated cards).
  Offered in the note panel before sending, on the success screen, and on the recipient page once the
  card is open (never while sealed). The Premium rule for sending applies to downloading too.
- **`OWN_WORDS_FREE`** (top of `js/send-card-logic.js`, **off**): one switch that would let everyone
  write their own words. Left off because that is what Premium sells and what welcome email 3 says;
  **the owner must decide**. If it is turned on, update the Premium copy (`index.html`, `faq.html`
  incl. JSON-LD, `about.html`, `docs/README.md`, welcome email 3 in MailerLite); the Premium sheet in
  the flow already hides that line by itself.
- **Inner pages rebuilt** (own stylesheets): `situations.html` + `css/situations.css` (editorial index:
  a sample message, guide link, send link and copy button per situation); `faq.html` + `css/faq.css`
  (category rail, animated open/close, live search, four new questions); `blog/index.html` +
  `css/guides.css` + `js/guides.js` (typographic header, featured guide, topic chips, always-visible
  `#crisis` panel, message lists) with the hubs regenerated by `scripts/build/generate-hubs.js`;
  `about.html` + `css/about.css` (no Lucide/unpkg any more). `css/blog.css` now only serves articles;
  its old index rules are dead code.
- **Owner's review of the homepage (2026-11-10), fixed:** the hero headline words rise in but never
  fade (fully opaque from the first frame); the sun/moon on the page sky stays in the clear band
  between the nav and the hero's first line (`measureClearSky` in `js/home.js`, `arc`/`bodyAlpha`/
  `bodyScale` options in `VibeSky.paint`), scrolls up with the hero and has faded before it reaches
  the nav, so it is never behind text further down. Where there is no clear band (phones, short
  windows) the page sky leaves it out; the opened card's sky still shows it. Shorter gap between the
  vibe check and "Then pass one on." (and on phones the fan now sits under that heading's lede). The
  sky caption has a soft frosted backdrop. Hamburger menu (all pages): solid panel (the translucent
  one let page text show through) and the Emergency Support pill keeps its padding and heart dot.
  **Breathe** (owner's follow-up): the card's entrance animation used `fill: both`, which held its
  `scale`/`translate` so the breath (and the hover lift) never moved; it is `backwards` now. The
  words and card swell over 4 s and settle over 6 s. The cue ("Breathe in" / "Breathe out")
  cross-fades and breathes letter by letter: an SVG displacement lens (`#cueLens`, made in
  `js/home.js`, strength `LENS`) bulges the middle of the word and bends the strokes while each
  letter puffs, lifts and leans out; on the out-breath it drains, briefly over-empties, then rests.
  This 4 s / 6 s breath is the one deliberate exception to the quick-motion rule, and only runs on
  request. Reduced motion: the cue changes words, nothing moves.
- **Tests:** e2e journeys 10 (new designs, occasions, sets), 11 (both image sizes really download in
  all three places) and 12 (the own-words switch).

## 6. The card flow (live since 2026-09-29)

`send-card.html` is the site's main flow. Full build notes: the **Portal Integration Guide** (a Claude
doc); the approved prototypes are in `assets/testassetcode/` (**git-ignored on purpose**: experiments
with third-party CodePen code; `concept-1-portal.html`, `preview.html`, `send-demo.html`).

### 6.1 How it works
1. **Choose a card** — 3D carousel of 34 cards: 17 free (8 added in round 2, see §5b; incl. sage/sand/slate from
   `scripts/marketing/backgrounds/generate.js --site`, and the painted Moonrise and Rose Dunes from
   `scenes.js --site`), 17 Premium grouped at the end (incl. painted Lanterns, Still Water, Desert
   Stars; 6 are videos).
   Free users see Premium cards frosted with a 🔒; arrows/swipes skip them, a tap opens the Premium
   sheet. Quick-pick occasion chips under the title (`occasionTemplates`).
2. **Fly into it (the portal)** — one continuous camera move: the card hands off to a full-screen
   window showing the same art (clip-path), which grows past the screen edges while a crisp particle
   field in the card's `light` colours streaks past. "Change Card" plays it in reverse and lands
   exactly on the card. `PACE` in `js/card-flow.js` sets the speed.
3. **Pick the words** — a vertical word wheel. Sets: General, Grounding, Worth, 7 more free sets (§5b) + 5 situations (free, over 100 phrases), Calm / Celebrate /
   Love / Healing (Premium: free users can browse them, the button turns into "Unlock Premium"),
   and "Your own words" (Premium, typed in place, 200 characters). Main button: "Next →".
4. **Names and note** (`#cardForm`, the note panel): To (required), From, note, their email, sound,
   30-day reminder. Fits above the phone keyboard (`visualViewport`).
5. **Send** — the saved paper-plane button (`js/send-plane.js` + GSAP) flies, writes "Thanks for
   sending a vibe!", lands as Sent!, holds 3.5 s (`SENT_HOLD_MS`), then the success screen: the card
   they made, "Your card for Sam is ready", Copy link + share buttons, daily-email sign-up.
6. **The recipient** (`view-card.html`) — sealed card ("For Sam / from Alex", its own art blurred)
   → one flip with the sender's sound → the words and "— Alex", the note under the card → after ~4 s
   a "Send Alex one back" panel. Old links without a background get a theme gradient.

### 6.2 Code map
| File | Holds |
| :--- | :--- |
| `js/card-flow.js` | all the UI above (carousel, portal, starfield, word wheel, composer, note panel, send stage, success, Premium draft restore) |
| `js/send-card-logic.js` | data (`backgroundDefs` + `light`, word sets, `SOUND_DEFS`, `occasionTemplates`), Premium state and sheet, `?message=` / preset / reply prefill, the send pipeline (card link, My Vibes, counter, EmailJS, reminder) |
| `js/send-plane.js` | the approved flight (`send-wide.js`), only runs when GSAP loaded; exposes `window.SendPlane` |
| `css/card-flow.css`, `css/view-card.css` | styles for the two pages |
| `send-card-classic.html` + `js/send-card-classic.js` | frozen old form, reached by `send-card?classic=1` (rollback; noindex, not in the sitemap) |

**Premium rules in code:** the portal's locks are the experience; the **send-time check** in the
submit handler is the rule: free users can't send custom words, a Premium collection's words, a
Premium card or a Premium sound. Before Stripe the sender's place is saved
(`localStorage.vc_flow_draft`, 24 h) and restored after the verified unlock.

**Fallbacks:** no GSAP (offline/blocked) or reduced motion → plain Send button, card still sends;
reduced motion → crossfades, no particles.

### 6.3 Owner's design rules (don't regress)
- **Quality bar:** one seamless, physically believable move. No glow blobs, expanding rings, blur-in
  text or confetti (the first slowed-down portal with those was called "trash"). Take the time a move
  needs; too fast "doesn't mean anything".
- **Paper plane:** wide wonky flight, trail stays on the plane, letters come OUT of the plane where it
  is (no reveal/bounce), one colour `#FFF6DC` in *Gochi Hand*, "!" first near 90°, ✓ lands upright.
- **Carousel:** portrait cards, no auto-advance, one tap = one action (side card → front, front card → enter).
- **Words:** rejected before: a docked bottom panel with a 3D wheel, and smoky floating "sky of words".
- Recipient page: owner happy with it as it is (2026-09-29).

### 6.4 Next steps
1. **~2026-10-13: retire the old form** if nobody needed it: delete `send-card-classic.html`,
   `js/send-card-classic.js`, the `?classic=1` redirect in `send-card.html`, and its entry in
   `EXCLUDE_FILES` (`scripts/build/generate-sitemap.js`).
2. ~~More free words~~ Done 2026-09-29: **Grounding** and **Worth** sets (10 each, from the homepage's
   affirmations; `FREE_WORD_SETS` in `send-card-logic.js`, included in `isFreeWords`). Free users now
   have 50 phrases. Left out on purpose: "Today is proof that you're stronger than yesterday", "The hard
   days make the good ones so much better", "You've survived 100% of your worst days so far"
   (stat-like), and awkward/near-duplicate variants.
3. **Premium backgrounds:** the owner plans to make more. Each needs its file in `assets/backgrounds/`
   and an entry in `backgroundDefs` with 3 `light` colours; never rename or delete existing files (old
   card links point at them). Keep the "17 more backgrounds" count true everywhere it appears: the Premium sheet in
   `send-card.html`, `index.html` (the Premium note), `about.html`, `faq.html` (2×, incl. JSON-LD), `docs/README.md`, and welcome
   email 3 (`docs/email/welcome-email-3.html` + MailerLite). New painted scenes: add to `scenes.html`,
   render with `node scripts/marketing/backgrounds/scenes.js --site <name>`.
4. **Still worth checking after launch:** a real Stripe purchase round trip (lands back on the same card
   and words), the flow on a mid-range Android.
5. **Parked idea — delivery scenes:** the recipient's card arrives in a pre-rendered scene (e.g. the
   treasure chest from `C:\Projects\TiktokVideos`), the real card rising out of it; later the sender
   could pick the scene (new optional `scene` field in the card link, old links get the default). A
   Gemini/Veo test clip was promising but had a slow push-in, a doubled padlock and 720p.

## 7. Technical traps we already hit (save yourself the time)

- **Hidden layers must be `visibility: hidden`, not just `opacity: 0`.** Invisible words with `pointer-events: auto` sat on top of the cards and swallowed taps ("takes 4 clicks"). A `preserve-3d` rig's own box sits in front of cards pushed back in Z and eats their clicks: give the rig `pointer-events: none` and the cards `auto`.
- `body { overflow-x: hidden }` is still scrollable by script (focus/scrollIntoView shifted the whole page 68px); use `overflow-x: clip`.
- **Handing a shared element back** (portal window → card): turn the card's `transition` off for that frame before making it visible, and close the window a frame later. Otherwise it inherits the carousel's 0.75 s opacity fade and leaves an empty hole where the card should be.
- **Full-screen effects: size them with `document.documentElement.clientWidth/Height`, not `window.innerWidth/Height`.** `innerWidth` includes a desktop scrollbar (15px on Windows), so the portal window came out narrower than its gold frame. Headless test browsers hide scrollbars; launch with `ignoreDefaultArgs: ['--hide-scrollbars']` to see it.
- **Phone keyboards shrink only the visual viewport,** not the page: a `position: fixed; inset: 0` panel stays full height and the keyboard covers its lower half. Size it from `window.visualViewport` (height + offsetTop) and scroll the focused field into view.
- **A scrolling overlay over a scrolling page = two scrollbars:** lock the page (`html.flow-lock`) while the success screen is open.
- **Test selectors:** "Calm" matches both the Calm & Safe quick pick and the Calm collection chip; scope chip lookups to `#portalTopicsDock`.
- **send-plane.js converts every `<rect>`/`<circle>` on the page to a `<path>` at load** (`MorphSVGPlugin.convertToPath`). `send-card.html` has none elsewhere; if you add any, scope that line to `#sendStage`.
- **MotionPathPlugin drifted** the plane ~70 units off the drawn route (rotation pivot off-centre). The
  plane is driven manually each frame from `route.getPointAtLength()`; set `svgOrigin` **once**
  (setting it every frame makes GSAP compensate and the plane flies off-screen).
- Element IDs become globals: a `window.vcWords` object clashed with `<div id="vcWords">`. Pick
  global names that aren't element IDs. `card-flow.js` is wrapped in an IIFE and exposes only `window.CardFlow`.
- A 3D word wheel magnifies the centre item unless the drum is pushed back by its radius (`translateZ(-R)`).
- `styles.css` gives all touch-device buttons `min-height: 48px`; small round buttons need their own
  `min-height` or they become ovals.
- A tap that opens a sheet can also "click" the sheet's backdrop and close it instantly — ignore
  backdrop clicks for ~400 ms after opening.
- Windows "Animation effects" off ⇒ browsers report `prefers-reduced-motion: reduce` ⇒ the flow uses crossfades.
- Build: nav/footer partials may be CRLF; `sync-layout.js` normalises them (fixed a stray-CR bug).
- Python edit scripts: `\b` inside a normal Python string is a backspace character, not a regex word
  boundary (it silently broke the `?classic=1` redirect once). Use raw strings.

## 8. Commands

```
npm run build        # generated pages, nav/footer, ?v= hashes, sitemap — after any page/CSS/JS change
npm test             # static checks + Edge browser tests (must pass before pushing)
npm run test:visual  # computed-style fingerprint vs baseline (--update to accept a change)
```

## 9. Other open items (smaller)

See `docs/REFACTOR_PLAN.md` for the remaining cleanup list (split `js/script.js` by page, two odd
articles onto `article.css`, self-host Unsplash images, review Gemini-written blog posts).
Owner task that may still be outstanding: a real Premium purchase round trip in Stripe (see §6.4).
