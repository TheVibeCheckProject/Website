# The Vibe Check Project

**A free online card sender.** No account required. Send an uplifting card in under a minute.

Live at: **thevibecheckproject.com**

---

## What It Is

The Vibe Check Project lets anyone send a personalized encouragement card via shareable link — no sign-up, no app, nothing to install. The sender picks a theme, writes a message, and shares the link. The recipient opens it and sees their card.

**Revenue model:**
- Free card sending — always free, no account needed
- Ko-fi membership — $3.99/month for premium access
- Gumroad pack — $4.99 one-time for premium card theme bundle

---

## Tech Stack

- **Frontend:** Pure HTML, CSS, JavaScript (no framework, no build process)
- **Hosting:** GitHub Pages
- **Domain:** thevibecheckproject.com (via CNAME)
- **Fonts:** Google Fonts — Inter (body), Space Grotesk (display)
- **Icons:** Lucide Icons (CDN)
- **Email:** MailerLite (group `180628908682512348`) — email capture + 3-email welcome sequence
- **Analytics:** Microsoft Clarity (project `vohl4gduni`) — heatmaps, session replay, no advertising cookies
- **Card counter:** counterapi.dev — live persistent count, no auth required
- **Payments:** Ko-fi (`ko-fi.com/thevibecheckproject`) + Gumroad

---

## File Structure

```
Website/
├── index.html               # Homepage — hero, how it works, stats, blog CTA, footer
├── send-card.html           # Card composer — theme picker, message input, EmailJS
├── view-card.html           # Card viewer — shareable recipient page, share + tip
├── about.html               # About page
├── contact.html             # Contact page
├── privacy.html             # Privacy policy
├── terms.html               # Terms of service
├── cookies.html             # Cookie policy
├── careers.html             # Careers / contributors page
├── sitemap.xml              # SEO sitemap
├── CNAME                    # GitHub Pages custom domain
├── assets/
│   ├── og-image.png         # Open Graph preview image
│   ├── downloads/           # Downloadable bundles (premium ZIP)
│   ├── logos/               # Brand logos + profile images
│   ├── media/               # Blog + social media assets
│   ├── premium-themes/      # Premium theme source files
│   └── wallpapers/          # Wallpaper PNGs
├── blog/                    # Blog articles
├── css/
│   └── styles.css           # All site styling
├── data/
│   └── affirmations_database.csv
├── docs/
│   ├── templates/           # Email + content templates
│   └── *.md                 # Setup guides
├── js/
│   └── script.js            # Site JS
├── newsletter-content/      # Daily newsletter batch data
└── scripts/                 # Utility scripts (newsletter sender, etc.)
```

---

## Running Locally

```bash
# Option 1 — Python
python -m http.server 8000
# visit http://localhost:8000

# Option 2 — Node
npx serve .

# Option 3 — VS Code Live Server extension
```

No build step. Open `index.html` and it works.

---

## Deploying

```bash
git add .
git commit -m "your message"
git push origin main
```

GitHub Pages picks up the push automatically. Changes are live within ~2 minutes at thevibecheckproject.com.

---

## Design System

```css
--color-primary:    #FF6B9D;  /* Pink */
--color-secondary:  #FEC84A;  /* Golden Yellow */
--color-accent:     #A78BFA;  /* Purple */
--color-bg-dark:    #1A1625;  /* Page background */
--color-bg-medium:  #2D2438;  /* Card/section background */
```

Fonts: Space Grotesk (headers) / Inter (body)

---

## Social

- TikTok: [@TheVibeCheckPro](https://www.tiktok.com/@TheVibeCheckPro)
- X (Twitter): [@Thevibecheckpro](https://x.com/Thevibecheckpro)

---

## Contact

- General: hello@thevibecheckproject.com
- Privacy: privacy@thevibecheckproject.com

---

## Still To Do

- [ ] Submit `sitemap.xml` to Google Search Console
- [ ] Design 10 premium card theme PNGs in Canva → ZIP for Gumroad
- [ ] Add real testimonials when available
- [ ] TikTok posting cadence

---

**The Vibe Check Project** — Because sometimes three words can change someone's whole day.
