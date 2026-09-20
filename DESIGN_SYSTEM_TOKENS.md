# Design System Tokens & Fluid Responsive Standards
**Document ID:** `DESIGN_SYSTEM_TOKENS.md`  
**Target Project:** The Vibe Check Project (`thevibecheckproject.com`)  
**Scope:** Universal Design Tokens, Typography Scales, Breakpoint Thresholds, and Interaction Bounds  
**Status:** Canonical Visual Design Specification  
**Date:** September 2026  

---

## 1. Color Palette & Semantic Tokens

All color variables are established on `:root` in [css/styles.css](file:///c:/Users/devin/OneDrive/Website/css/styles.css) and contextualized through [css/design-upgrade.css](file:///c:/Users/devin/OneDrive/Website/css/design-upgrade.css).

### 1.1 Core Brand Colors

```css
:root {
  /* Brand Accents - Vibrant Warmth */
  --color-primary:          #FF6B9D; /* Sunset Pink - Primary Conversion Triggers */
  --color-primary-dark:     #E85285; /* Active/Pressed State */
  --color-primary-light:    #FFB5D1; /* Subdued Glow / Tag Badges */
  --color-secondary:        #FEC84A; /* Radiant Amber - Secondary Highlights */
  --color-secondary-dark:   #F5B82E; /* Amber Hover */
  --color-accent:           #A78BFA; /* Mindful Lavender - Meditative Highlights */
  --color-success:          #34D399; /* Emerald Green - Verified / Copied States */
  --color-warning:          #F59E0B; /* Warm Orange */
  --color-danger:           #F43F5E; /* Crisis Support Hotline Heart */

  /* Surface & Background Depths */
  --color-bg-dark:          #1A1625; /* Base App Canvas */
  --color-bg-medium:        #2D2438; /* Cards, Modals, Accordions */
  --color-bg-light:         #3F3449; /* Hover Surfaces, Inset Wells */
  --color-bg-obsidian:      #0D0A14; /* Concept 2 High-Contrast Deep Void */
  --color-bg-glass:         rgba(24, 19, 34, 0.72); /* Concept 1 Frosted Backdrop */

  /* Text & Typography Hierarchy */
  --color-text-primary:     #FEFEFE; /* High Contrast Display & Headlines (WCAG AAA) */
  --color-text-secondary:   #E0D4F0; /* Body Copy & Subtitles */
  --color-text-muted:       #B4A5C7; /* Captions, Footnotes, Dates */
  --color-text-disabled:    #76688B; /* Disabled Form Buttons */
}
```

---

### 1.2 Dual Concept Theme Tokens (`data-design-concept`)

The project supports two curated design layers toggled via `#themeSwitcherDock`:

| Token Name | Concept 1: Warm Modern Editorial (`editorial`) | Concept 2: Playful Kinetic (`kinetic`) |
| :--- | :--- | :--- |
| **`--concept-accent`** | `#FF7FA7` (Soft Rose Gold) | `#FF3377` (Hyper Radiant Neon Pink) |
| **`--concept-glow`** | `rgba(255, 127, 167, 0.25)` | `rgba(255, 51, 119, 0.35)` |
| **Headline Gradient** | `linear-gradient(135deg, #FFA3BA 0%, #FED876 100%)` | `linear-gradient(135deg, #FF1493 0%, #FF8C00 50%, #FFD700 100%)` |
| **Card Dock Surface** | `rgba(24, 19, 34, 0.72)` + `backdrop-filter: blur(24px)` | `rgba(13, 10, 20, 0.88)` + `border: 1.5px solid #FF3377` |
| **Card Border Radius**| `24px` (Curved Organic Pill) | `20px` (Crisp Geometric Squircle) |
| **Quote Typography** | `'Caveat', cursive` (Personal Handwritten Note) | `'Space Grotesk', sans-serif` (Bold Punchy Kinetic) |
| **Pill Animation** | Smooth linear fade (`0.3s ease`) | Kinetic bounce (`0.15s cubic-bezier(0.34, 1.56, 0.64, 1)`) |

---

### 1.3 Signature Gradient Tokens

```css
:root {
  /* Brand Sunset Hero */
  --grad-sunset:   linear-gradient(135deg, #FF6B9D 0%, #FEC84A 100%);
  /* Cyber Kinetic */
  --grad-kinetic:  linear-gradient(135deg, #FF1493 0%, #FF8C00 50%, #FFD700 100%);
  /* Aurora Glow */
  --grad-aurora:   linear-gradient(135deg, #38BDF8 0%, #818CF8 50%, #C084FC 100%);
  /* Gentle Healing */
  --grad-healing:  linear-gradient(135deg, #34D399 0%, #10B981 100%);
  /* Obsidian Edge */
  --grad-border:   linear-gradient(135deg, rgba(255, 107, 157, 0.4), rgba(254, 200, 74, 0.2));
}
```

---

## 2. Fluid Typography & Sizing Rules

Typography and spatial dimensions leverage CSS `clamp()` to scale fluidly from small smartphones (375px) up to 4K ultra-wide monitors without line wrapping or text overflow bugs.

### 2.1 Font Family Declarations
```css
:root {
  --font-body:     'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-display:  'Space Grotesk', sans-serif;
  --font-cursive:  'Caveat', cursive, sans-serif;
}
```

---

### 2.2 Fluid Type Scale Tokens

| Semantic Role | HTML Element | Fluid CSS Clamp Token | Rendered Size (390px Mobile) | Rendered Size (1440px Desktop) | Line Height |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Display Hero** | `.hero-title` | `clamp(2.25rem, 5.5vw, 4.00rem)` | `36px` | `64px` | `1.12` |
| **Page Headline**| `h1` | `clamp(2.00rem, 4.5vw, 3.25rem)` | `32px` | `52px` | `1.18` |
| **Section Title**| `h2` | `clamp(1.50rem, 3.2vw, 2.25rem)` | `24px` | `36px` | `1.25` |
| **Card Headline**| `h3` | `clamp(1.15rem, 2.2vw, 1.50rem)` | `18.5px` | `24px` | `1.30` |
| **Sub-Header**   | `h4` | `clamp(1.00rem, 1.8vw, 1.25rem)` | `16px` | `20px` | `1.35` |
| **Body Large**   | `.lead-text` | `clamp(1.05rem, 1.6vw, 1.20rem)` | `16.8px` | `19.2px` | `1.55` |
| **Body Standard**| `p, li` | `clamp(0.95rem, 1.2vw, 1.05rem)` | `15.2px` | `16.8px` | `1.65` |
| **Small / Meta** | `small, .meta`| `clamp(0.80rem, 1.0vw, 0.88rem)` | `12.8px` | `14.0px` | `1.45` |
| **Handwritten**  | `.vibe-quote` | `clamp(1.50rem, 3.0vw, 2.15rem)` | `24px` | `34.4px` | `1.40` |

---

### 2.3 Fluid Container Bounds & Layout Spacing
```css
:root {
  /* Standard Page Width Container */
  --container-fluid: min(100% - 32px, 1440px);
  --container-narrow: min(100% - 32px, 1100px);
  --container-reader: min(100% - 32px, 760px);

  /* Fluid Lateral Padding */
  --pad-fluid: clamp(16px, 4vw, 48px);
  --gap-fluid: clamp(16px, 3vw, 36px);
}
```

---

## 3. Canonical Responsive Breakpoints

All stylesheets must align to these **4 canonical responsive breakpoint tiers**:

```
0px                  768px                 1024px                1440px                1920px+
├─────────────────────┼─────────────────────┼─────────────────────┼─────────────────────┤
│   MOBILE PHONE      │   TABLET / STACK    │   DESKTOP STUDIO    │  WIDESCREEN CANVAS  │
│  (Thumb Ergonomics) │ (Adaptive 2-Column) │ (Multi-Column Grid) │ (Expansive Spatial) │
```

### Breakpoint Matrix

| Tier Name | Breakpoint Query | Layout Behavior & Structural Rules |
| :--- | :--- | :--- |
| **Tier 1: Mobile Phone** | `@media (max-width: 767px)` | • 1-column vertical feed.<br>• Conversion triggers anchored to `position: sticky; bottom: 0;`.<br>• Edge-to-edge swipeable pill rails with `scroll-snap-type: x mandatory`.<br>• Card creator preview pinned at top; controls scroll below in bottom drawer. |
| **Tier 2: Tablet / Stacked** | `@media (min-width: 768px) and (max-width: 1023px)` | • 2-column card grid for blogs & situations.<br>• Bottom navigation docks remain active.<br>• Hero sections adjust to stacked orientation with relaxed margins. |
| **Tier 3: Desktop Grid** | `@media (min-width: 1024px)` | • 2-to-3 column workspaces unlocked.<br>• FAQ: Sticky left search & category rail (320px) + right accordion.<br>• Situations: Sticky filter rail (300px) + 3-column card grid.<br>• Recipient View: Zero-CLS side-by-side reveal stage. |
| **Tier 4: Widescreen Studio** | `@media (min-width: 1440px)` | • Container expands to `1440px–1520px` (eliminates empty margins).<br>• Card Creator Studio unlocks full **3-Column Canvas** (Message $\rightarrow$ 3D Stage $\rightarrow$ Delivery).<br>• Situations grid unlocks 4-column card display. |

---

## 4. Touch vs. Pointer Interaction Standards

To ensure a first-class experience for both a thumb on an iPhone and a precision cursor on a 4K monitor, hover states and touch states must be strictly separated.

### 4.1 Touch Device Standards (`@media (hover: none)`)
1. **Minimum Touch Target:** All interactive buttons, tabs, accordions, and pills must have a **minimum touch height and width of 48px** (`min-height: 48px; min-width: 48px;`).
2. **Tactile Compression Feedback:**
   ```css
   @media (hover: none) {
     button:active,
     .btn:active,
     .filter-pill:active,
     .situation-card:active {
       transform: scale(0.97) !important;
       transition: transform 0.1s cubic-bezier(0.16, 1, 0.3, 1) !important;
     }
   }
   ```
3. **Safe Area Insets:** All sticky bottom navigation docks must respect hardware bottom bars:
   ```css
   padding-bottom: calc(12px + env(safe-area-inset-bottom, 16px));
   ```

---

### 4.2 Precision Mouse Standards (`@media (hover: hover) and (pointer: fine)`)
1. **3D Cursor Tilt & Perspective:**
   All 3D tilt tracking, holographic sheen updates, and particle canvas mouse-tracking must only bind and calculate when `@media (hover: hover) and (pointer: fine)` is true:
   ```javascript
   const isFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
   if (isFinePointer) {
     card.addEventListener('mousemove', handleCardTilt);
   }
   ```
2. **Hover Elevations & Glows:**
   ```css
   @media (hover: hover) and (pointer: fine) {
     .blog-card-img:hover,
     .situation-card:hover {
       transform: translateY(-4px);
       box-shadow: 0 16px 36px rgba(0, 0, 0, 0.4), 0 0 24px rgba(255, 107, 157, 0.25);
       border-color: rgba(255, 107, 157, 0.4);
     }
   }
   ```

---
*End of Design System Tokens & Fluid Responsive Standards.*
