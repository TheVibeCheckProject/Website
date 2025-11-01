# ✨ The Vibe Check Project

**Spreading good vibes, one message at a time.**

A social good platform delivering daily affirmations and uplifting messages to help people through tough days.

---

## 🎯 Mission

The world can be overwhelming. Sometimes all someone needs is a simple reminder that they matter. The Vibe Check Project exists to spread positivity through:
- Daily affirmations via email
- Uplifting messages when you need them
- A supportive community
- Beautiful shareable content

Small words. Big impact.

---

## 🚀 Quick Start

### For Testing Locally

1. **Open the site:**
   ```bash
   # Just open index.html in your browser
   # Or use a local server:
   python -m http.server 8000
   # Then visit: http://localhost:8000
   ```

2. **Test email signup:**
   - Click any "Get Started" button
   - Enter email (currently saves to localStorage)
   - Check browser console to see saved data

3. **View subscribers:**
   ```javascript
   // In browser console (F12):
   JSON.parse(localStorage.getItem('vibeCheckSubscribers'))
   ```

### For Deploying Live

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Your message"
   git push origin main
   ```

2. **Site auto-updates** at thevibecheckproject.com

---

## 📁 Project Structure

```
Website-main/
├── index.html              # Main homepage
├── styles.css              # All styling (warm pink/yellow theme)
├── script.js               # Functionality (email signup, animations)
├── about.html             # About page (needs customization)
├── contact.html           # Contact page (needs customization)
├── privacy.html           # Privacy policy (needs real content)
├── terms.html             # Terms of service (needs real content)
├── cookies.html           # Cookie policy (needs real content)
├── IMPLEMENTATION_GUIDE.md # How we built this
├── EMAIL_SETUP_GUIDE.md   # How to integrate email service
├── PREMIUM_SETUP_GUIDE.md # How to set up payments
├── LAUNCH_CHECKLIST.md    # Pre-launch checklist
└── README.md              # This file
```

---

## ✨ Features

### Current (Working)
- ✅ Beautiful responsive design
- ✅ Email signup modal (saves locally)
- ✅ Daily affirmation rotation
- ✅ Smooth animations
- ✅ Mobile-friendly
- ✅ Accessibility features

### Needs Integration
- ⚠️ Email service (Buttondown/ConvertKit)
- ⚠️ Premium payments (Gumroad/Stripe)
- ⚠️ Social media links
- ⚠️ Support links (Ko-fi/Patreon)

---

## 💰 Business Model

### Free Tier
- Daily affirmation via email
- Access to basic content
- Shareable messages

### Premium ($3.99/month)
- Full affirmation library (500+)
- Custom wallpapers & cards
- Personalized timing
- Community access
- Gift subscriptions
- Ad-free experience

### Additional Revenue
- Ko-fi donations
- Patreon memberships
- Future: Corporate wellness programs

---

## 🛠️ Tech Stack

- **Frontend:** Pure HTML, CSS, JavaScript (no framework)
- **Styling:** Custom CSS with CSS variables
- **Icons:** Lucide Icons
- **Fonts:** Google Fonts (Inter, Space Grotesk)
- **Hosting:** GitHub Pages
- **Domain:** thevibecheckproject.com

**Why no framework?**
- Faster load times
- Easier to maintain
- No build process
- Perfect for this use case

---

## 🎨 Design System

### Colors
```css
--color-primary: #FF6B9D;      /* Pink */
--color-secondary: #FEC84A;     /* Golden Yellow */
--color-accent: #A78BFA;        /* Purple */
--color-bg-dark: #1A1625;       /* Dark background */
--color-bg-medium: #2D2438;     /* Medium background */
```

### Typography
- **Display:** Space Grotesk (headers)
- **Body:** Inter (content)

### Philosophy
Warm, welcoming, uplifting. Every element should make someone smile.

---

## 📈 Launch Strategy

### Phase 1: Soft Launch (Week 1)
- Get 100 email subscribers
- Test all functionality
- Gather feedback
- Iterate quickly

### Phase 2: Content Creation (Weeks 2-4)
- Write 100 affirmations
- Create 10 wallpapers
- Build Discord community
- Establish posting rhythm

### Phase 3: Growth (Months 2-3)
- Reach 1,000 free subscribers
- Convert 5% to premium
- Partner with mental health orgs
- Build social media presence

### Phase 4: Scale (Months 4-12)
- 10,000+ subscribers
- 500+ premium members
- Automated workflows
- Team expansion (maybe!)

---

## 🔧 Customization Guide

### Change Daily Affirmation
Edit `script.js` around line 8:
```javascript
const affirmations = [
    { text: "Your new affirmation here", category: "Category" },
    // Add more...
];
```

### Update Email Service
See `EMAIL_SETUP_GUIDE.md` for detailed instructions

### Change Colors
Edit CSS variables in `styles.css` around line 7

### Update Premium Price
Search for "$3.99" in `index.html` and update

---

## 🐛 Troubleshooting

### Modal not showing?
1. Check browser console for errors (F12)
2. Verify script.js is loaded
3. Clear cache and try again

### Email not sending?
1. Currently emails are saved locally only
2. Follow EMAIL_SETUP_GUIDE.md to integrate real service

### Site not updating?
1. Clear browser cache
2. Try incognito mode
3. Check GitHub Pages settings
4. Wait 2-3 minutes for deployment

### Testing locally?
1. Use a local server (not file://)
2. Python: `python -m http.server 8000`
3. Node: `npx serve`
4. VS Code: Live Server extension

---

## 📊 Analytics

### What to Track
- Email signups
- Premium conversions
- Page views
- Bounce rate
- Social shares
- Support contributions

### Recommended Tools
- Google Analytics (free)
- Plausible (privacy-friendly)
- Simple Analytics (paid, simple)

---

## 🤝 Contributing

This is a personal project, but if you want to help:
1. Report bugs via email
2. Suggest affirmations
3. Share feedback
4. Spread the word

---

## 📝 License

Personal project. All rights reserved.

---

## 🙏 Credits

**Built with love for people who need a reminder that they matter.**

- Design & Development: You!
- Mission: Spread good vibes
- Inspiration: Everyone who's ever needed encouragement

---

## 📞 Support

Need help?
- Check the guides in this repo
- Test in browser console
- Review error messages
- Ask specific questions

---

## ✅ Pre-Launch Checklist

See `LAUNCH_CHECKLIST.md` for complete checklist.

**Minimum to launch:**
- [ ] Set up email service
- [ ] Update social links
- [ ] Set up Ko-fi
- [ ] Push to GitHub
- [ ] Test everything

**Time to launch: ~90 minutes**

---

## 🎉 Current Status

**Version:** 1.0.0-beta  
**Status:** Ready for email integration  
**Launch:** As soon as you integrate email service!

The website is **functional and beautiful**. Just needs:
1. Real email service integration
2. Your social media links
3. Your support links

That's it. You're 90 minutes from launch! 🚀

---

## 💭 Remember

> "Small words. Big impact."

Every affirmation you send could be the reason someone decides to keep going today. That's worth building.

Now go spread those good vibes! ✨

---

**The Vibe Check Project**  
Because everyone deserves a reminder that they matter.
