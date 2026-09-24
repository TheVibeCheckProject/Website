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
| `send-newsletter.js` | `daily-newsletter.yml` | Daily 14:00 UTC. Sends today's entry from `newsletter-content/batch.json` via MailerLite. Fails the run if today has no entry. |
| `generate-batch.mjs` | `generate-newsletter-batch.yml` | 25th of each month. Generates next month's missing days with Gemini and merges them into `batch.json` (never overwrites existing days). |

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
