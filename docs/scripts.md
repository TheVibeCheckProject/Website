# Scripts & Workers

## Build (`scripts/build/`) — run everything with `npm run build`

| Script | What it does | npm |
| :--- | :--- | :--- |
| `generate-hubs.js` | Builds the four category hubs (`blog/<topic>/index.html`) from `blog/index.html`. | `build:hubs` |
| `generate-listicles.js` | Builds the 100/50/75-message listicles from `data/listicles.json`. Fails on duplicate messages or a count that doesn't match the title. | `build:listicles` |
| `generate-messages.js` | Builds the five `blog/<slug>/` message pages from `data/messages.json`. | `build:messages` |
| `lib/message-page.js` | Shared renderer for both of the above (uses `templates/message-page.html`). | — |
| `sync-layout.js` | Stamps `templates/partials/nav.html` + `footer.html` into every page. | `build:layout` |
| `version-assets.js` | Rewrites `css/*.css?v=` / `js/*.js?v=` to a hash of the file (cache busting). | `build:assets` |
| `generate-sitemap.js` | Regenerates `sitemap.xml` with `lastmod` from git. | `build:sitemap` |

## Newsletter (`scripts/newsletter/`) — run by GitHub Actions

| Script | Workflow | When |
| :--- | :--- | :--- |
| `send-newsletter.js` | `daily-newsletter.yml` | Daily 14:00 UTC. Sends today's entry from `newsletter-content/batch.json` via MailerLite. Fails the run if today has no entry or it fails the content check. |
| `generate-batch.mjs` | `generate-newsletter-batch.yml` | 25th of each month. Generates next month's missing days with Gemini, keeps only those that pass the content check, and merges them into `batch.json` (never overwrites existing days). Fails the run if a day is still missing. |
| `email.js` | (shared) | The daily email design (`renderEmail`) and content check (`checkEmail`). |

Every daily email is an affirmation for the reader (`type` AFFIRMATION, or OCCASION for a real date such as World Mental Health Day), with a "Send this to someone" button that opens a card with that affirmation. `checkEmail` rejects invented stories and claims: third-person people (he/she, a coworker, a friend of mine…), anecdotes, statistics. In Sept 2026 AI-written stories were sent as if true; `npm run test:static` checks every queued day so it can't happen again. To edit a day, change its fields in `batch.json` (the HTML is built at send time).

## Marketing (`scripts/marketing/`)

| Script | What it does | npm |
| :--- | :--- | :--- |
| `generate-pins.js` | Renders Pinterest pin images from `data/messages.json` using `pin-generator.html`. | `generate-pins` |
| `pinterest_poster.py` | Selenium automation that posts pins (tracks state in `data/posted_pins.json`). | `pin-post` |

## Cloudflare Workers (`workers/`) — deployed by hand in the Cloudflare dashboard

Each file's header comment has step-by-step setup.

| Worker | Purpose | Status |
| :--- | :--- | :--- |
| `og-preview.js` | Personalised link previews (iMessage, WhatsApp…) for `view-card.html?data=` links. | Live; redeploy after changes. |
| `newsletter-trigger.js` | Cloudflare Cron Triggers start the daily email (9 AM Central) and the monthly generator (25th) on time via GitHub `workflow_dispatch`; GitHub's own schedules are only a later backup. Needs secret `GITHUB_TOKEN` (fine-grained, Actions read/write). | Deployed 2026-09-25 as `vibe-newsletter-trigger`; first run 2026-09-26. |
| `mailerlite-proxy.js` | Accepts newsletter signups without exposing the MailerLite key. | Live. |
| `counter.js` | Cards-sent / newsletter counters and My Vibes read receipts (Worker + D1). | Enable by setting `VIBE_COUNTER_URL` in `js/core-utils.js`. |
| `premium-verify.js` | Confirms a Stripe payment before Premium unlocks. | Enable by setting `PREMIUM_VERIFY_URL` in `js/core-utils.js`. |

## Tests (`tests/`)

| Command | What it checks | Time |
| :--- | :--- | :--- |
| `npm test` | Runs both checks below. Do this before every push. | ~2 min |
| `npm run test:static` | JS syntax, JSON-LD, broken internal links, SEO rules (canonical, one H1, sitemap), stale `?v=` hashes, shared nav/footer present, no fabricated claims. | seconds |
| `npm run test:e2e` | In Edge: every page loads with no JS errors or sideways scroll on a phone; blog "Send as Card" → create card → recipient opens it; sender preview; crafted links; My Vibes list/delete; Premium return; blog index and FAQ. | ~2 min |
| `npm run test:visual -- --update` then `npm run test:visual` | Before/after comparison of the computed styles of every element (phone + desktop, plus menu/modal/step/flip states). Use around refactors that shouldn't change the look. | ~4 min each |

The browser tests need Microsoft Edge installed (Playwright `channel: 'msedge'`).
