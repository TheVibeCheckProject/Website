# Initial Refactor — Remaining Plan

Status as of 2026-09-24: the overhaul is merged and live (PRs #1 and #2); work now happens directly on `main`.
For the overall picture and the card-flow redesign in progress, read [HANDOFF.md](HANDOFF.md) first.
Each phase is sized to be done and reviewed on its own. Tick items off as they land.

Legend: **You** = needs your accounts/decisions · **Claude** = code work I can do · Size: S (<30 min) · M (~1 hr) · L (multi-hour)

---

## Phase 0 — Ship what's done (urgent)

- [x] **You** · S — Merged and pushed (2026-09-24); daily newsletter fix live
- [x] **You** · S — Spot-checked on a phone; the issues found were fixed (sign-up popup, sound buttons, contact page, card page reveal)
- [ ] **You** · S — Confirm the daily email arrives each morning (GitHub → Actions → Daily Newsletter)
- [ ] **You** · S — Real Premium test purchase + refund in Stripe
- [x] **You** · S — New EmailJS card email template pasted into the dashboard (2026-09-24)
- [x] ~~Welcome email wallpaper links~~: wallpapers dropped (Sept 2026); the new welcome email has none

## Phase 1 — Turn on the new services (your accounts)

Code is ready and switched off until configured. Setup steps are in each worker's header comment.

- [x] **You** · S — Deploy `workers/og-preview.js` as the `vibe-card-preview` worker on route `thevibecheckproject.com/view-card.html*` (done 2026-09-24, verified live)
- [x] **You** · M — Deploy `workers/counter.js` + D1 (done 2026-09-24: `vibe-counter.caseagent72401.workers.dev`, wired into `js/core-utils.js`, read receipts verified). The counter URL is set in `daily-newsletter.yml` (it is public, so not a secret), so newsletter sends are counted too
- [x] **You** · M — Deploy `workers/premium-verify.js` (done 2026-09-24: `vibe-premium` worker, restricted Stripe key, payment-link ID, D1 cap; Payment Link redirects with `session_id`; site switched to verified mode)
- [x] **You** · S — AdSense: decided to drop it (2026-09-24). Removed from all pages, CSS, ads.txt and the legal pages. *You:* you can also close the site in your AdSense account
- [ ] **You + Claude** — Subscriber gift brainstorm (after the refactor): better signup gift; decide then whether the old premium-designs zip is reused or deleted
- [x] **Claude** · S — After you set the URLs above: rebuild, verify counters/receipts/premium end to end

## Phase 2 — Safety net (do before more refactoring)

- [x] **Claude** · M — Add `npm test`: syntax check, broken-link + SEO audit, and browser tests for the core flows (create card → open card, blog "Send as Card", My Vibes, Premium unlock) using Edge
- [x] **Claude** · S — Add a visual-regression check (the computed-style fingerprint used during this refactor) so CSS cleanups can prove nothing changed
- [x] **Claude** · S — Add `.gitattributes` to normalise line endings (removes the constant CRLF warnings and whitespace noise in diffs)

## Phase 3 — Remaining code cleanup

Ordered by value. Each item is verified with the Phase 2 tests before committing.

- [x] **Claude** · M — Move `view-card.html`'s ~300 lines of inline script into `js/view-card.js` (the recipient page is the most important page to keep maintainable)
- [x] **Claude** · M — Replace inline `style="…"` attributes with classes on send-card, view-card and the homepage (upsell box, hints, buttons)
- [x] **Claude** · L — Consolidate `css/styles.css`: drop overridden declarations and duplicates (done). *Not done on purpose:* physically regrouping rules into base / components / pages — reordering CSS changes which rule wins, so it only pays off alongside a design refresh.
- [x] **Claude** · S — Remove duplicate rules shared between `styles.css` and `blog.css` (e.g. the ad containers)
- [x] **Claude** · S — Trim Google Fonts (already resolved: every page now loads only the 5 families in use, once)
- [ ] **Claude** · M — Split `js/script.js` by page (home, blog/situations filters, FAQ) so each page loads only what it uses
- [ ] **You + Claude** · S — Bring the 2 odd articles (mindfulness, self-care) onto the shared `css/article.css` — small visual change, you approve screenshots first

## Phase 4 — Content & polish (optional, after the refactor)

- [ ] **You** · M — Skim the Gemini-written blog posts for anything inaccurate or off-voice (I removed the obvious unsourced claims only)
- [ ] **Claude** · S — Self-host the homepage hero and newsletter background images (currently hot-linked from Unsplash)
- [ ] **Claude** · S — Tighten the large empty gap under the blog index header art
- [ ] **Claude** · L — Move long-form articles to a data/markdown source + template (like the listicles), so all blog pages share one design

---

## Open questions for you

1. ~~AdSense~~ — dropped.
2. Premium: keep the per-device model, or add a "restore purchase" flow (email + Stripe receipt lookup) later?
3. ~~Support email~~ — confirmed `wecare@thevibecheckproject.com`. Card emails (EmailJS, template_bpj8rue) send from the Gmail noreply address with Reply-To set to wecare@ (done 2026-09-24). EmailJS free plan = 200 emails/month; if it runs out regularly, move card emails to MailerSend (3,000/month free, own domain) via a worker.
4. Should Premium stay at $4.99, and should the premium zip (if kept) be delivered to buyers?
