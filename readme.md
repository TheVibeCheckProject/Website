# The Vibe Check Project

**A free online card sender.** No account required. Send an uplifting card in under a minute.

Live at **[thevibecheckproject.com](https://thevibecheckproject.com)**

## What it is

Anyone can send a personalised encouragement card as a link: no sign-up, no app. The sender picks an affirmation, a background and a sound, adds a note and shares the link; the recipient opens an animated card and can send one back.

**Revenue:** free cards forever; an optional $4.99 one-time Premium Unlock (Stripe); Ko-fi tips; AdSense on content pages.

## Tech stack

- Plain HTML, CSS and JavaScript (no framework), hosted on GitHub Pages behind Cloudflare
- MailerLite for the newsletter (daily send via GitHub Actions)
- Cloudflare Workers for link previews, signups, counters and Premium verification (`workers/`)
- Microsoft Clarity analytics, EmailJS for "email this card"

## Folders

```
*.html                 top-level pages (home, card studio, card viewer, My Vibes, FAQ, legal…)
blog/                  articles, listicles, message pages, category hubs
css/  js/              styles and scripts (?v= hashes are set by the build)
assets/                images, card backgrounds, wallpapers, Pinterest pins
data/                  source data for generated pages and Pinterest tooling
templates/             message-page template + shared nav/footer partials
scripts/build/         static-site build (npm run build)
scripts/newsletter/    daily send + monthly content generation (GitHub Actions)
scripts/marketing/     Pinterest pin generation and posting
workers/               Cloudflare Workers (deployed in the Cloudflare dashboard)
newsletter-content/    batch.json — the daily newsletter queue
docs/                  how the site works, scripts, email templates, marketing notes
```

Start with [docs/README.md](docs/README.md) and [docs/scripts.md](docs/scripts.md).

## Develop

```bash
npm install
npx serve .          # local preview (supports extensionless URLs)
npm run build        # hubs → listicles → message pages → shared nav/footer → asset hashes → sitemap
```

## Deploy

```bash
npm run build
git add -A && git commit -m "your message"
git push origin main
```

GitHub Pages publishes from `main`. Workers in `workers/` are deployed separately; each file's header explains how.
