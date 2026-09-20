# Agent Execution Runbook & Implementation Protocols
**Document ID:** `AGENT_EXECUTION_RUNBOOK.md`  
**Target Project:** The Vibe Check Project (`thevibecheckproject.com`)  
**Scope:** Standard Operating Procedures, Order of Operations, Forbidden Anti-Patterns, and Recovery Protocols  
**Status:** Canonical Implementation Runbook for Autonomous AI Agents & Developers  
**Date:** September 2026  

---

## 1. Phase-by-Phase Order of Operations

To prevent broken runtime dependencies, layout thrashing, or compilation errors, code changes must be executed in this **strict chronological sequence**:

```
┌────────────────────────────────────────────────────────┐
│  PHASE 0: Hotfixes & Core Utility Contracts           │
│  (js/script.js, core-utils.js, nav logo, counters)    │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│  PHASE 1: Dedicated Stylesheets & Layout Systems       │
│  (css/blog.css, css/styles.css, css/send-card.css)     │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│  PHASE 2: Page-Level DOM Structure Refactoring         │
│  (faq.html, situations.html, index.html, send-card)   │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│  PHASE 3: Static Compilation & Scraper Verification    │
│  (templates/message-page.html, generate-*.js)         │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│  PHASE 4: Viewport QA & Automated Regression Tests    │
│  (Edge Browser Automation, 390px to 1920px audit)      │
└────────────────────────────────────────────────────────┘
```

---

### Phase 0: Hotfixes & Core Utility Contracts
1. **Core Utilities First:** Add the universal `window.initItemFilter({...})`, `window.copyText(...)`, and `window.initMetricsCounters({...})` into [js/script.js](file:///c:/Users/devin/OneDrive/Website/js/script.js).
2. **Metrics Baseline:** Replace empty dashes (`—`) in [index.html](file:///c:/Users/devin/OneDrive/Website/index.html) with baseline counts (`12,480+` and `5,200+`).
3. **Nav Logo Alignment:** Fix `.logo-divider` styles in [css/styles.css](file:///c:/Users/devin/OneDrive/Website/css/styles.css) to eliminate the misaligned pipe character.
4. **Scraper Selector Lock:** Verify [scripts/generate-hubs.js](file:///c:/Users/devin/OneDrive/Website/scripts/generate-hubs.js) runs cleanly before any HTML modifications.

---

### Phase 1: Dedicated Stylesheets & Layout Systems
1. **Create `css/blog.css`:** Extract the 450+ lines of duplicate inline styles from `blog/index.html` and static blog posts into a single shared stylesheet.
2. **Define Responsive Grid Breakpoints:** Add the canonical `@media (min-width: 1024px)` and `@media (min-width: 1100px)` split-grid layout rules to [css/styles.css](file:///c:/Users/devin/OneDrive/Website/css/styles.css), [css/send-card.css](file:///c:/Users/devin/OneDrive/Website/css/send-card.css), and [css/view-card.css](file:///c:/Users/devin/OneDrive/Website/css/view-card.css).
3. **Isolate Touch vs. Hover:** Wrap all 3D tilts and hover box-shadows in `@media (hover: hover) and (pointer: fine)`. Apply `:active { transform: scale(0.97); }` for touch devices.

---

### Phase 2: Page-Level DOM Structure Refactoring
1. **`faq.html`:** Remove `50vh` hero padding, sync Schema.org JSON-LD with all 7 questions, structure the 2-column layout with category pills, and initialize `initItemFilter`.
2. **`situations.html`:** Add dual-action `[Send Card ✨]` buttons (`?preset=...`), extract embedded styles, and wire `#situationsSearchInput` into `initItemFilter`.
3. **`send-card.html`:** Structure the 3-panel layout, pin the card preview on mobile viewports, implement the 3D card flip note preview, and wire step indicator click jumps.
4. **`view-card.html`:** Pre-allocate the right-hand reciprocal bridge column to achieve **Zero Cumulative Layout Shift (CLS)** upon unboxing, add the audio control pill, and add token sanitization regex.
5. **`my-cards.html`:** Adjust empty state padding to eliminate laptop clipping and add desktop inspection drawer markup.

---

### Phase 3: Static Compilation & Scraper Verification
1. **Master Template Update:** Update [templates/message-page.html](file:///c:/Users/devin/OneDrive/Website/templates/message-page.html) with responsive styling and SMS chat bubbles.
2. **Execute Compilers:**
   ```powershell
   node scripts/generate-listicles.js
   node scripts/generate-hubs.js
   ```
3. **Integrity Check:** Confirm all 4 category hub files and 3 listicle articles compile with non-zero file sizes and 0 un-substituted template tags.

---

### Phase 4: Viewport QA & Automated Regression Tests
1. Execute the verification protocols from [TESTING_AND_QA_CHECKLIST.md](file:///c:/Users/devin/OneDrive/Website/TESTING_AND_QA_CHECKLIST.md).
2. Audit viewports at 390px, 768px, 1024px, 1440px, and 1920px.
3. Verify zero horizontal overflow (`scrollWidth === innerWidth`).

---

## 2. Forbidden Practices & Architectural Constraints

When modifying code or creating assets, agents and developers must adhere to the following **strict prohibitions**:

1. ❌ **NO New External Dependencies:** Do NOT install external runtime NPM packages, heavy UI component frameworks, or CDN libraries. The client frontend must remain pure vanilla JavaScript, HTML5, and native CSS.
2. ❌ **NO Large Inline `<style>` Blocks:** Never embed inline `<style>` tags exceeding 15 lines inside HTML files. All layout, responsive breakpoints, and theme rules belong in external stylesheets for browser caching.
3. ❌ **NO Breaking of Cheerio Target Selectors:** Never rename or remove `a.blog-card-img`, `.pre-text`, `.drop-v`, `.rest-text`, `.sub-desc`, `.slider-wrapper`, or `.category-grid` in [blog/index.html](file:///c:/Users/devin/OneDrive/Website/blog/index.html) without updating [scripts/generate-hubs.js](file:///c:/Users/devin/OneDrive/Website/scripts/generate-hubs.js).
4. ❌ **NO Disruption of Google Chrome:** The user utilizes Google Chrome as their primary daily browser. Browser automation and headless testing must strictly target **Microsoft Edge** (`channel: 'msedge'`). Never run commands that kill Chrome processes.
5. ❌ **NO Dual-DOM Branching:** Never create duplicate HTML elements for mobile vs. desktop (e.g. `<div class="desktop-card">` and `<div class="mobile-card">`). Mobile and desktop must share an identical semantic DOM driven by CSS Grid and container queries.
6. ❌ **NO Bare `localStorage` Calls:** Never call `localStorage.setItem()` directly without wrapping in a try/catch block that falls back to in-memory storage (protects against Safari Private Browsing quota exceptions).

---

## 3. Error Recovery Protocols

### Protocol 1: Build Script Fails or Produces 0 Cards
* **Symptom:** `scripts/generate-hubs.js` completes, but category hub files contain empty `.blog-grid` elements.
* **Root Cause:** A change in `blog/index.html` altered `a.blog-card-img` or made `href` attributes absolute (`http...`).
* **Recovery Steps:**
  1. Inspect `blog/index.html` around line 150.
  2. Verify that every card anchor has class `blog-card-img` and a relative `href` (e.g. `href="what-to-say...html"`).
  3. Re-run `node scripts/generate-hubs.js` and verify output size.

---

### Protocol 2: Canvas Particle or Audio Asset Fails with CORS / Missing Resource
* **Symptom:** Soundscape fails to play or canvas fails to initialize on `localhost:8085`.
* **Root Cause:** Relative pathing issue when navigating between root (`/`) and sub-directories (`/blog/` or `/blog/category/`).
* **Recovery Steps:**
  1. Use root-relative asset paths (`/assets/...`, `/audio/...`) or calibrate relative depths (`../` vs `../../`).
  2. In `SoundEngine`, ensure audio elements have `crossOrigin = "anonymous"`.
  3. Check developer console network tab for 404s.

---

### Protocol 3: `localStorage` Throws `QuotaExceededError` (iOS Safari)
* **Symptom:** `Uncaught DOMException: QuotaExceededError` in console when saving cards or toggling preferences.
* **Root Cause:** User is in iOS Safari Private Browsing mode where storage quota is 0 bytes.
* **Recovery Steps:**
  1. Ensure `StorageSafe` in [js/vibe-history.js](file:///c:/Users/devin/OneDrive/Website/js/vibe-history.js) catches the exception:
     ```javascript
     try {
       localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
     } catch (e) {
       _inMemoryCards = data; // Seamless fallback
     }
     ```
  2. Ensure UI methods read from `StorageSafe.read()` rather than raw `localStorage.getItem()`.

---

### Protocol 4: Horizontal Scrollbar Detected on Mobile Viewport
* **Symptom:** Page scrolls horizontally on mobile phones (`scrollWidth > innerWidth`).
* **Root Cause:** A nested element has a hardcoded pixel width (e.g. `width: 800px;` or unconstrained `pre` code block).
* **Recovery Steps:**
  1. In the console, execute the overflow detector snippet:
     ```javascript
     document.querySelectorAll('*').forEach(el => {
       if (el.offsetWidth > document.documentElement.clientWidth) {
         console.warn('Overflow element:', el);
       }
     });
     ```
  2. Replace hardcoded widths with `max-width: 100%;` and `box-sizing: border-box;`.

---
*End of Agent Execution Runbook & Implementation Protocols.*
