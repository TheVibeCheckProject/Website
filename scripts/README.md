# Scripts & Automations Directory

This directory contains the build compilers, automated GitHub Actions cron jobs, Cloudflare Edge Workers, and marketing automation tools for **The Vibe Check Project**.

---

## 🛠️ Static Site Compilers & Build Tools

These active scripts compile templates and CSV datasets into production-ready static HTML files.

| Script | Purpose | Execution |
| :--- | :--- | :--- |
| **`generate-hubs.js`** | Compiles the four category hub pages (`blog/mental-health/index.html`, etc.) from `blog/index.html`. | `npm run build:hubs` |
| **`generate-listicles.js`** | Compiles the 100/50/75-message listicles from `data/listicles.json` (fails if a title's count doesn't match or a message repeats). | `npm run build:listicles` |
| **`sync-layout.js`** | Stamps `templates/partials/nav.html` + `footer.html` into every page (relative paths, active link, core-utils include). | `npm run build:layout` |
| **`version-assets.js`** | Rewrites every `css/*.css?v=` / `js/*.js?v=` reference to a hash of the file contents (cache busting). | `npm run build:assets` |
| **`generate-sitemap.js`** | Scans all static pages and blog posts to regenerate the root `sitemap.xml` (lastmod from git). | `npm run build:sitemap` |
| **`generate-affirmations.mjs`** | Generates morning affirmation batches using Gemini AI for the daily newsletter. | `node scripts/generate-affirmations.mjs` |
| **`generate-messages.js`** | Generates the five `blog/<slug>/` message pages from `data/messages.json`. ⚠️ Don't run as-is: it would overwrite SEO edits made to those pages afterwards (see file header). | — |
| **`add-seo.js`** | Injects Schema.org JSON-LD and OpenGraph metadata into static articles. | `node scripts/add-seo.js` |
| **`convert-images.js`** | Batch converts raw images into web-optimized `.webp` format. | `node scripts/convert-images.js` |

> [!TIP]
> Run all static generation tasks at once with:
> ```bash
> npm run build
> ```

---

## ⏰ Automated Cron Workflows (GitHub Actions)

These scripts are triggered automatically on scheduled crons via `.github/workflows/`.

| Script | Workflow | Schedule | Description |
| :--- | :--- | :--- | :--- |
| **`send-newsletter.js`** | `.github/workflows/daily-newsletter.yml` | Daily at 9:00 AM EST (14:00 UTC) | Reads today's entry from `newsletter-content/batch.json` and broadcasts the daily morning affirmation email via MailerLite. |
| **`generate-batch.mjs`** | `.github/workflows/generate-newsletter-batch.yml` | Monthly, 10:00 UTC on the 25th | Generates next month's emails with Gemini and **merges** them into `batch.json` (existing dates are never overwritten; a fully covered month is skipped). |

---

## ☁️ Cloudflare Edge Workers

Serverless workers deployed to Cloudflare to support dynamic features on the static site.

| Script | Purpose |
| :--- | :--- |
| **`vibe-card-og-worker.js`** | Edge worker that intercepts crawler requests (iMessage, WhatsApp, Twitter, Slack) to serve dynamic Open Graph image and card preview metadata for `?data=` links. |
| **`mailerlite-proxy.js`** | Edge worker proxy that securely captures newsletter signups and forwards them to MailerLite without exposing API credentials to the client. |
| **`vibe-counter-worker.js`** | Worker + D1 database behind the homepage stats and My Vibes read receipts (replaces counterapi.dev v1, which was shut down). Enable by setting `VIBE_COUNTER_URL` in `js/core-utils.js`. |
| **`premium-verify-worker.js`** | Confirms a Stripe Checkout Session was paid before Premium unlocks. Enable by setting `PREMIUM_VERIFY_URL` in `js/core-utils.js` and adding `session_id={CHECKOUT_SESSION_ID}` to the Payment Link redirect. |

---

## 📌 Marketing & Social Media Automations

| Script | Purpose | Execution |
| :--- | :--- | :--- |
| **`generate-pins.js`** | Batch generates Pinterest pin definitions and copy from blog articles. | `npm run generate-pins` |
| **`pinterest_poster.py`** | Selenium browser automation for scheduled pinning to Pinterest boards. | `npm run pin-post` or `python scripts/pinterest_poster.py` |

---

## 🗄️ Legacy & Archived Utilities (`scripts/legacy/`)

One-off migration scripts, obsolete transformers, and historical QA test scripts are safely archived in [`scripts/legacy/`](./legacy/):

- **`categorize-blog.js`** — *Archived:* Obsolete categorization script that wrapped blog cards in destructive DOM wrappers and hardcoded outdated `.png` covers. Replaced by `generate-hubs.js`.
- **`inject-components.js`** — *Archived:* Injected duplicate inline `<script>` tags for `copyText` and legacy related-reading blocks. Replaced by centralized `window.copyText` in `js/script.js` and `css/blog.css`.
- **`minify.js`** — *Archived:* Unsafe regex minifier producing out-of-sync `.min` files. Production site directly loads modular, versioned unminified assets.
- **`cleanup-blog-layout.js`** — Removed legacy inline related reading blocks from static post files.
- **`fix-heights.js`** — Fixed early card layout flex heights.
- **`fix-lineclamp.js`** — Normalized line-clamp CSS across cards.
- **`fix-related.js`** — Cleaned up related post references.
- **`migrate-cards.js`** — Migrated early card storage formats.
- **`test-edge-capture.cjs`** — Headless Microsoft Edge screenshot capture runner for dual-theme verification.
