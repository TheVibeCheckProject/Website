# How the site works

- [scripts.md](scripts.md): every build script, newsletter job and Cloudflare Worker
- [email/](email/): welcome sequence and daily newsletter templates (copies of what lives in MailerLite)
- [marketing/](marketing/): Pinterest strategy, quickstart and pin tracker

## Pages

| Page | Role |
| :--- | :--- |
| `index.html` | Homepage: Daily Spark, interactive demo card, newsletter signup |
| `send-card.html` + `js/send-card-logic.js` | Card studio: 3 steps (affirmation → look & sound → names, note, send) |
| `view-card.html` | What the recipient opens (no nav, not indexed) |
| `my-cards.html` + `js/vibe-history.js` | Sender's history, stored in the browser only (not indexed) |
| `situations.html`, `faq.html`, `about.html`, `contact.html`, legal pages | Static pages |
| `blog/` | Articles, listicles, message pages and category hubs (see scripts.md for which are generated) |

Shared on every page: `css/styles.css`, `js/core-utils.js` (mobile nav, toasts, sound engine, Clarity telemetry, counters, Premium unlock). `js/script.js` powers the homepage, blog index, situations and FAQ; `js/article.js` the long-form articles.

## Card links

A card is not stored anywhere. `send-card-logic.js` turns it into a link:

```
JSON { id, recipientName, senderName, affirmation, personalMessage, sound, themeGroup, background, createdAt }
  → encodeURIComponent → btoa → base64url  →  https://thevibecheckproject.com/view-card.html?data=…
```

Limits: names 50, affirmation 280, note 500 characters. `view-card.html` decodes it, trims every field, and only accepts backgrounds from `assets/backgrounds/`. Links must keep the `view-card.html` path: old cards and the preview worker depend on it.

`?message=`, `?preset=` (birthday, tough_day, proud, gratitude, calm, healing + aliases), `?recipient=`, `?note=` and `?viralReply=1` pre-fill the studio.

## Premium

$4.99 via a Stripe Payment Link. It unlocks writing your own affirmation, the Calm/Celebrate/Love/Healing collections, 14 premium backgrounds (6 animated) and 5 extra sounds, stored as `premium_unlocked` in localStorage. Until `workers/premium-verify.js` is deployed, returning with `?premium=1` unlocks without a payment check.

## Editing rules

- Header/footer: edit `templates/partials/`, then `npm run build`. Never edit between the `site-nav` / `site-footer` markers.
- CSS/JS: never hand-edit `?v=`; `npm run build` sets content hashes.
- Listicles and message pages: edit `data/*.json`, not the generated HTML.
- Don't invent stats, testimonials or claims. Homepage counts only appear when the counter service returns real numbers.
