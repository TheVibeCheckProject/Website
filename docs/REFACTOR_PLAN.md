# Initial Refactor — Remaining Plan

Status as of 2026-09-24. All work so far is on the `site-overhaul` branch (20 commits, not pushed).
Each phase is sized to be done and reviewed on its own. Tick items off as they land.

Legend: **You** = needs your accounts/decisions · **Claude** = code work I can do · Size: S (<30 min) · M (~1 hr) · L (multi-hour)

---

## Phase 0 — Ship what's done (urgent)

The daily newsletter has sent nothing since ~Sep 20. The fix only runs once it's on `main`.

- [ ] **You** · S — Merge and push: `git checkout main && git merge site-overhaul && git push`
- [ ] **You** · S — After deploy, spot-check: homepage, send a card, open it, My Vibes, one blog post
- [ ] **You** · S — Next morning, confirm the newsletter arrived (GitHub → Actions → Daily Newsletter)
- [ ] **You** · S — In MailerLite, change the welcome email's wallpaper links from `.png` to `.webp` (the `.png` files don't exist)

## Phase 1 — Turn on the new services (your accounts)

Code is ready and switched off until configured. Setup steps are in each worker's header comment.

- [ ] **You** · S — Paste the updated `workers/og-preview.js` into the existing Cloudflare worker (fixes duplicate/incorrect link previews)
- [ ] **You** · M — Deploy `workers/counter.js` + a D1 database → put its URL in `VIBE_COUNTER_URL` (`js/core-utils.js`) and a `VIBE_COUNTER_URL` GitHub secret. Brings back read receipts and the live "cards sent" stat
- [ ] **You** · M — Deploy `workers/premium-verify.js` with a restricted Stripe key → set `PREMIUM_VERIFY_URL`, and change the Payment Link redirect to include `session_id={CHECKOUT_SESSION_ID}`. Stops free Premium via `?premium=1`
- [ ] **You** · S — AdSense: create ad units and send me the slot IDs (all 28 spots use the invalid `"auto"`), **or** decide to rely on Auto ads and I'll remove the manual spots
- [ ] **You** · S — Decide on `assets/downloads/Premium_Vibe_Check_Themes.zip` (public, unlinked): keep or delete
- [ ] **Claude** · S — After you set the URLs above: rebuild, verify counters/receipts/premium end to end

## Phase 2 — Safety net (do before more refactoring)

- [x] **Claude** · M — Add `npm test`: syntax check, broken-link + SEO audit, and browser tests for the core flows (create card → open card, blog "Send as Card", My Vibes, Premium unlock) using Edge
- [x] **Claude** · S — Add a visual-regression check (the computed-style fingerprint used during this refactor) so CSS cleanups can prove nothing changed
- [x] **Claude** · S — Add `.gitattributes` to normalise line endings (removes the constant CRLF warnings and whitespace noise in diffs)

## Phase 3 — Remaining code cleanup

Ordered by value. Each item is verified with the Phase 2 tests before committing.

- [ ] **Claude** · M — Move `view-card.html`'s ~300 lines of inline script into `js/view-card.js` (the recipient page is the most important page to keep maintainable)
- [ ] **Claude** · M — Replace inline `style="…"` attributes with classes on send-card, view-card and the homepage (upsell box, hints, buttons)
- [ ] **Claude** · L — Consolidate `css/styles.css` (~4,700 lines): merge selectors defined multiple times, drop overridden declarations, split into base / components / page sections
- [ ] **Claude** · S — Remove duplicate rules shared between `styles.css` and `blog.css` (e.g. the ad containers)
- [ ] **Claude** · S — Trim Google Fonts: some pages load 6–7 families; standardise on Space Grotesk + Outfit (+ Caveat / Playfair where actually used)
- [ ] **Claude** · M — Split `js/script.js` by page (home, blog/situations filters, FAQ) so each page loads only what it uses
- [ ] **You + Claude** · S — Bring the 2 odd articles (mindfulness, self-care) onto the shared `css/article.css` — small visual change, you approve screenshots first

## Phase 4 — Content & polish (optional, after the refactor)

- [ ] **You** · M — Skim the Gemini-written blog posts for anything inaccurate or off-voice (I removed the obvious unsourced claims only)
- [ ] **Claude** · S — Self-host the homepage hero and newsletter background images (currently hot-linked from Unsplash)
- [ ] **Claude** · S — Tighten the large empty gap under the blog index header art
- [ ] **Claude** · L — Move long-form articles to a data/markdown source + template (like the listicles), so all blog pages share one design

---

## Open questions for you

1. AdSense: real ad units, or Auto ads only?
2. Premium: keep the per-device model, or add a "restore purchase" flow (email + Stripe receipt lookup) later?
3. Is `WeCare@TheVibeCheckProject.com` the right support address everywhere (site, Premium errors, legal pages)?
4. Should Premium stay at $4.99, and should the premium zip (if kept) be delivered to buyers?
