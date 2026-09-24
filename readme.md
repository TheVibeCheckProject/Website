# The Vibe Check Project

**A free online card sender.** No account required. Send an uplifting card in under a minute.

Live at: **[thevibecheckproject.com](https://thevibecheckproject.com)**

---

## What It Is

The Vibe Check Project lets anyone send a personalized encouragement card via shareable link — no sign-up, no app, nothing to install. The sender picks a theme, writes a message, and shares the link. The recipient opens it and unboxes their card with interactive animations and reciprocal viral reply support.

**Revenue model:**
- **Free card sending** — always free, no account needed
- **Premium Unlock** — $4.99 one-time for custom front affirmations, premium themes, and sound effects (via Stripe)
- **Ko-fi tips** — optional tips to support the project

---

## 📚 Documentation & Architecture

Comprehensive technical specifications, design tokens, monetization flows, and runbooks are organized in the **[`docs/`](docs/README.md)** directory:

- 📐 [**System Wiring & URL Contracts**](docs/SYSTEM_WIRING_SPEC.md) — Canonical URL parameters (`?data=`, `?preset=`, `?note=`, `?viralReply=`), serialization, and base64 compression.
- 🎨 [**Design System Tokens**](docs/DESIGN_SYSTEM_TOKENS.md) — Design tokens, color palettes, responsive breakpoints (390px to 1920px), and typography.
- 📋 [**Agent Execution Runbook**](docs/AGENT_EXECUTION_RUNBOOK.md) — Architecture migration phases, static compilation rules, and invariants.
- 🧪 [**Testing & QA Verification Checklist**](docs/TESTING_AND_QA_CHECKLIST.md) — Viewport acceptance matrices and critical path Journey Protocols (A, B, C).
- 💎 [**Monetization Workflow**](docs/MONETIZATION_WORKFLOW.md) — Stripe webhook integration, premium unlocks, and 30-day email follow-ups.
- 🗂️ [**Documentation Hub**](docs/README.md) — Central directory index of all guides, strategies, and templates.

---

## Tech Stack

- **Frontend:** Pure HTML5, Vanilla CSS3, Modern JavaScript (ES6+ modular logic, zero heavyweight frameworks)
- **Hosting:** GitHub Pages with custom apex domain routing (`CNAME`)
- **Fonts:** Space Grotesk (display), Outfit (body) via Google Fonts
- **Icons:** Inline SVG (Lucide-style) and emoji
- **Email & Newsletters:** MailerLite API (subscriber capture + daily 9:00 AM EST automated affirmation broadcast)
- **Edge Functions:** Cloudflare Workers: OpenGraph card link previews, MailerLite signup proxy, counters/read receipts (Worker + D1), optional Stripe Premium verification
- **Analytics:** Microsoft Clarity (privacy-first heatmaps and session telemetry)
- **Counters & Read Receipts:** self-hosted Cloudflare Worker + D1 (`scripts/vibe-counter-worker.js`); counterapi.dev v1, used previously, was shut down

---

## File Structure

```
Website/
├── index.html               # Homepage — hero, live counter, situation discovery, footer
├── send-card.html           # Card creator studio — 3D card preview, theme picker, personal note
├── view-card.html           # Card viewer — recipient unboxing, flip envelope, reciprocal reply
├── situations.html          # Situations directory — 4-column responsive mood & scenario grid
├── faq.html                 # Interactive FAQ — 2-column layout, instant search & category filter
├── my-cards.html            # Saved vibes dashboard — localStorage sent & received cards
├── about.html               # About page — mission and background
├── contact.html             # Contact page — support inquiry form
├── privacy.html             # Privacy policy (GDPR & CCPA compliant)
├── terms.html               # Terms of service
├── cookies.html             # Cookie policy
├── sitemap.xml              # Search engine index sitemap
├── CNAME                    # GitHub Pages custom domain
├── .nojekyll                # GitHub Pages Jekyll bypass flag
│
├── assets/                  # Static media, icons, and blog cover illustrations
│   ├── blog_cover_*.webp    # Canonical blog post cover images
│   ├── downloads/           # Downloadable bundles (premium ZIP wallpapers)
│   ├── logos/               # Brand logos and profile avatars
│   └── wallpapers/          # Mobile & desktop affirmation wallpapers
│
├── blog/                    # Editorial articles & category hubs
│   ├── *.html               # Long-form advice and message listicles
│   ├── mental-health/       # Category hub for anxiety, depression, and overwhelm
│   ├── grief-support/       # Category hub for bereavement and loss
│   ├── serious-illness/     # Category hub for cancer and chronic illness support
│   └── encouragement/       # Category hub for friendships, milestones, and uplifting vibes
│
├── css/                     # Modular design system stylesheets
│   ├── styles.css           # Core design tokens, global layout, typography, components
│   ├── blog.css             # Dedicated blog layout, SMS chat bubbles, reading dock
│   ├── send-card.css        # Card studio layout, 3D flip card, color pickers
│   ├── view-card.css        # Recipient card unboxing, sound controls, viral reply bar
│   └── my-cards.css         # Saved vibes dashboard cards, empty states, export controls
│
├── data/                    # Structured data assets
│   ├── affirmations_database.csv # One affirmation per day of the month (daily spark)
│   ├── listicles.json       # Source messages for the 100/50/75 message listicles
│   └── messages.json        # Source messages for the /blog/<slug>/ message pages
│
├── docs/                    # Central engineering, design, and marketing documentation
│   ├── README.md            # Master documentation index
│   ├── design-improvements/ # Deep-dive audits and wireframe specs per surface
│   └── templates/           # Email onboarding sequences and newsletter templates
│
├── js/                      # Modular client-side scripts
│   ├── core-utils.js        # Loaded on every page: mobile nav, toasts, sound, telemetry, counters, premium unlock
│   ├── script.js            # Homepage/blog/situations behaviour: daily spark, demo card, filters, FAQ
│   ├── send-card-logic.js   # Card composer state machine, serialization, paywall logic
│   └── vibe-history.js      # LocalStorage history manager for sent and received cards
│
├── newsletter-content/      # Pre-generated daily morning affirmation JSON batches
│
├── scripts/                 # Compilers, GitHub Actions cron jobs, Cloudflare Edge workers
│   ├── README.md            # Comprehensive documentation index of all automation scripts
│   ├── generate-hubs.js     # Category hub compiler
│   ├── generate-listicles.js# Viral message listicle compiler
│   ├── generate-sitemap.js  # SEO sitemap regenerator (with git-based lastmod)
│   ├── sync-layout.js       # Stamps the shared nav/footer partials into every page
│   ├── version-assets.js    # Content-hash cache busting for css/ and js/
│   ├── send-newsletter.js   # Daily morning newsletter sender (called by GitHub Actions)
│   ├── generate-batch.mjs   # AI affirmation batch generator (called by GitHub Actions)
│   ├── vibe-card-og-worker.js # Cloudflare Open Graph crawler preview worker
│   ├── mailerlite-proxy.js  # Cloudflare MailerLite proxy worker
│   ├── vibe-counter-worker.js   # Cloudflare Worker + D1: counters and read receipts
│   ├── premium-verify-worker.js # Cloudflare Worker: verifies Stripe Premium purchases
│   ├── pinterest_poster.py  # Selenium Pinterest automation
│   └── legacy/              # Archived migration & verification scripts
│
└── templates/               # Reusable HTML templates
    ├── partials/            # nav.html + footer.html shared by every page (npm run build:layout)
    └── message-page.html    # Template for message listicles and message pages
                             # (category hubs are generated from blog/index.html)
```

---

## Development & Build Commands

```bash
# Run local preview server
npx serve .
# or
python -m http.server 8085

# Full build: hubs -> listicles -> shared nav/footer -> asset cache-busting -> sitemap
npm run build

# Build individual targets
npm run build:hubs
npm run build:listicles
npm run build:layout     # stamp templates/partials/{nav,footer}.html into every page
npm run build:assets     # rewrite css/js ?v= to content hashes (run after editing any asset)
npm run build:sitemap

# Marketing & Automations
npm run generate-pins
npm run pin-post
```

---

## Deploying

```bash
npm run build            # keeps nav/footer, asset versions and sitemap in sync
git add .
git commit -m "your message"
git push origin main
```

GitHub Pages publishes from `main`. Cloudflare Workers in `scripts/*-worker.js` and `scripts/mailerlite-proxy.js` are deployed separately in the Cloudflare dashboard; each file has setup steps in its header comment.

### Editing the header or footer

The nav and footer on every page are generated. Edit `templates/partials/nav.html` or `footer.html`, then run `npm run build:layout`. Hand edits between the `site-nav` / `site-footer` markers are overwritten.

---

**The Vibe Check Project** — Because sometimes three words can change someone's whole day.
