# Quality Assurance & Testing Checklist Suite
**Document ID:** `TESTING_AND_QA_CHECKLIST.md`  
**Target Project:** The Vibe Check Project (`thevibecheckproject.com`)  
**Scope:** Automated & Manual Verification for Responsive Parity, Cross-Surface Flows, and Build Scripts  
**Status:** Canonical Acceptance Criteria & Pre-Deployment Standard  
**Date:** September 2026  

---

## 1. Responsive Viewport Acceptance Matrix

Every page modification must be audited across these 5 canonical viewports. **Failure on any single check blocks deployment.**

```
Viewport Dimensions Tested:
1. Mobile Portrait (iPhone 14/15/16):    390px × 844px
2. Tablet Portrait (iPad Mini / Air):    768px × 1024px
3. Tablet Landscape / Small Laptop:     1024px × 768px
4. Standard Desktop (MacBook / FHD):    1440px × 900px
5. Widescreen / 4K Monitor:             1920px × 1080px
```

### 1.1 Master Acceptance Criteria Table

| Viewport Width | Device Archetype | Critical Responsive Criteria | Pass / Fail Condition |
| :--- | :--- | :--- | :--- |
| **390px** | Mobile Smartphone | • **Zero Horizontal Overflow:** `document.documentElement.scrollWidth === window.innerWidth`.<br>• **Thumb Zone Anchoring:** Primary buttons (`[Send Card]`, `[Next]`, `[Copy]`) stay within bottom 40% of viewport via `position: sticky; bottom: 0;`.<br>• **Hit Targets:** All interactive pills, links, and accordion headers have `min-height: 48px;`.<br>• **Typography Clamping:** No headline wraps to more than 3 lines. | [ ] PASS<br>[ ] FAIL |
| **768px** | Tablet Portrait | • **Natural Grid Collapsing:** Situations and Blog Hub cards render in a balanced 2-column grid.<br>• **Stacked Studio Flow:** Studio preview remains sticky while inputs span full tablet column width.<br>• **Safe Margins:** Content lateral padding maintains `24px–32px` without edge clipping. | [ ] PASS<br>[ ] FAIL |
| **1024px** | Tablet Landscape / Laptop | • **Grid Threshold Activation:** FAQ and Situations shift from vertical stack into **2-Column Layout** (Sticky left rail + right content).<br>• **Desktop Navigation Visible:** Desktop nav links replace mobile hamburger menu.<br>• **Empty State Protection:** `my-cards.html` empty state CTA is 100% visible without scrolling. | [ ] PASS<br>[ ] FAIL |
| **1440px** | Standard Desktop Display | • **Split-Hero Balance:** Homepage displays Headline/Daily Spark on left (55%) and 3D Card Demo on right (45%) simultaneously.<br>• **Studio Pro Canvas:** `send-card.html` unlocks full 3-column studio grid.<br>• **Mouse Precision:** 3D cursor tilts and ambient hover glows activate smoothly. | [ ] PASS<br>[ ] FAIL |
| **1920px** | Ultra-Wide Monitor | • **Zero Dead Void:** Outer container expands fluidly to `1440px–1520px` with centered auto-margins.<br>• **Situations 4-Column Grid:** Situations cards expand to 4 cards per row without text distortion.<br>• **Zero Pixelation:** Canvas particles and SVG background masks render sharply without aliasing. | [ ] PASS<br>[ ] FAIL |

---

## 2. Cross-Feature User Journey Verification Protocols

### Protocol A: Situations $\rightarrow$ Studio $\rightarrow$ SMS Recipient Unboxing $\rightarrow$ Viral Reply

```
Test Surface: situations.html -> send-card.html -> view-card.html -> send-card.html
Goal: Verify full end-to-end viral loop, preset handoff, and audio/confetti unboxing.
```

1. **Step 1 (Situations Directory):**
   - Open `http://localhost:8085/situations.html` on a mobile viewport (390px).
   - Tap the horizontal pill **`Grief & Loss`**. Verify list filters to 3 grief cards instantly.
   - On the *Grief Support Guide* card, tap the direct action **`[💌 Send Card ✨]`**.
   - **Verification:** Browser navigates to `send-card.html?preset=grief`.
2. **Step 2 (Card Creator Studio):**
   - Verify `#panelMessage` displays the pre-selected *Healing* theme and quote: *"Sending you gentle love and holding space for you today."*.
   - Verify the sticky top preview reflects the rose/healing background.
   - Enter Recipient Name: `"Alex"`. Enter Personal Note: `"Thinking of you this week 🕊️"`.
   - Tap **`[Create & Share Card ✨]`**.
   - **Verification:** Generates `view-card.html?data=...`. Base64URL string must contain no `+`, `/`, or `=`. Link copies to clipboard or opens native share sheet.
   - Verify `my-cards.html` now displays Alex's card in the history list.
3. **Step 3 (Recipient Experience Unboxing):**
   - Open the generated `view-card.html?data=...` link in a private/incognito window.
   - Verify sealed envelope appears with pulsing green heart and text: *"Alex, You've got a Vibe Check!"*.
   - Tap/click the envelope.
   - **Verification:**
     - Confetti explodes across the screen.
     - Audio chime plays clearly.
     - Card flips 180° to reveal affirmation quote, sender name, and personal note.
     - **Zero Layout Shift (CLS):** Reciprocal viral bridge deck slides in smoothly below (mobile) or illuminates on the right (desktop) without pushing the card off-screen.
4. **Step 4 (Reciprocal Viral Reply):**
   - On the revealed card, tap **`[💌 Send a "Thank You" Vibe]`**.
   - **Verification:** Navigates to `send-card.html?recipient=Alex&message=Thank%20you...&viralReply=1`.
   - Studio displays top banner: `"Replying to Alex ✨"`.

---

### Protocol B: Blog Reading $\rightarrow$ Copy SMS Message $\rightarrow$ Haptic & Card Handoff

```
Test Surface: blog/50-texts-to-send-someone-having-a-hard-day.html -> send-card.html
Goal: Verify clipboard API, haptic feedback, and text handoff to studio.
```

1. **Step 1 (Article Reading):**
   - Open `blog/50-texts-to-send-someone-having-a-hard-day.html`.
   - Scroll to message card #3: *"Sending you a giant hug right now."*.
2. **Step 2 (Clipboard Verification):**
   - Tap the **`[Copy Text]`** button.
   - **Verification:**
     - Button content immediately changes to `Copied! ✨` with a green checkmark icon.
     - Button adds CSS class `.copied`.
     - Device vibrates for 15ms (on supported mobile devices).
     - System clipboard contains exact text without leading/trailing curly quotes.
     - After 2,000ms, button reverts to original `Copy Text` markup and `.copied` is removed.
3. **Step 3 (Send As Card Handoff):**
   - Tap the adjacent button **`[Send as Card ✨]`**.
   - **Verification:** Navigates to `send-card.html?message=Sending%20you%20a%20giant%20hug%20right%20now.`.
   - Card Studio initializes with that exact text rendered on the live card stage.

---

### Protocol C: FAQ Search $\rightarrow$ Live Keyword Filter $\rightarrow$ Hash Anchor Deep Link

```
Test Surface: faq.html
Goal: Verify universal filter engine, zero empty states, and hash anchor auto-expansion.
```

1. **Step 1 (Universal Filter):**
   - Open `faq.html`.
   - Type `"anonymous"` into `#faqSearchInput`.
   - **Verification:** Question 3 (*"Can I remain anonymous when sending a card?"*) remains visible; non-matching questions are hidden (`display: none;`).
   - Clear input. Tap category pill **`Privacy & Safety`**.
   - **Verification:** Shows 2 matching privacy questions.
2. **Step 2 (Hash Anchor Deep Link):**
   - Open URL directly with fragment: `http://localhost:8085/faq.html#faq-anonymous`.
   - **Verification:**
     - Page loads and automatically scrolls to `#faq-anonymous`.
     - Accordion item #3 is pre-expanded (`aria-expanded="true"`).
     - Left border illuminates with radiant accent glow.

---

## 3. Build & Scraper Safety Pre-Commit Checks

Before committing changes to `blog/index.html` or `templates/message-page.html`, execute the following automated validation tests in the terminal:

### Test 1: Category Hub Scraper Integrity
```bash
node scripts/generate-hubs.js
```
**Pass Criteria:**
- Console outputs: `Finished generating category hubs!`
- Verify all 4 category files exist and have file size > 5 KB:
  - `blog/mental-health/index.html` (Must contain $\ge 10$ `.blog-card-img` elements)
  - `blog/grief-support/index.html` (Must contain $\ge 3$ `.blog-card-img` elements)
  - `blog/serious-illness/index.html` (Must contain $\ge 3$ `.blog-card-img` elements)
  - `blog/encouragement/index.html` (Must contain $\ge 9$ `.blog-card-img` elements)

### Test 2: Listicle Generator Integrity
```bash
node scripts/generate-listicles.js
```
**Pass Criteria:**
- Console outputs: `Listicles complete!`
- Verify compiled listicles exist and contain zero un-substituted `{{...}}` tokens:
  - `blog/100-encouraging-messages-for-a-friend.html`
  - `blog/50-texts-to-send-someone-having-a-hard-day.html`
  - `blog/75-thinking-of-you-messages.html`

---

## 4. Mobile Ergonomics & Accessibility Checklist

- [ ] **Thumb Reach Test:** Can a user create and copy a card using only their right thumb without shifting their hand grip?
- [ ] **Contrast Compliance:** All headline text must meet **WCAG AAA** ($\ge 7:1$) against background surfaces; body copy must meet **WCAG AA** ($\ge 4.5:1$).
- [ ] **Reduced Motion Preference:** Toggling system "Reduce Motion" (`prefers-reduced-motion: reduce`) or clicking the *"Motion Off"* button halts all particle canvases, card hover bobbing, and text rotation.
- [ ] **Private Browsing Mode:** Opening `my-cards.html` and creating a card in Safari Private Browsing mode executes without `QuotaExceededError` crashes.

---
*End of Quality Assurance & Testing Checklist Suite.*
