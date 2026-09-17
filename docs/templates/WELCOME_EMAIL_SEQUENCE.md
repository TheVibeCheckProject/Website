# MailerLite Lifecycle & Retention Blueprint — The Vibe Check Project

**Target CRM:** MailerLite  
**Group:** `The Vibe Check Project Community` (`ID: 180628908682512348`)  
**API Proxy:** Cloudflare Worker (`https://vibe-check-proxy.caseagent72401.workers.dev/`)

---

## 1. CRM Schema: Fields & Segmentation Tags

### Custom Fields (In MailerLite -> Subscribers -> Fields)
* `signup_source` (Text): `send-card-checkin-30d`, `homepage`, `view-card`, `modal`
* `recipient_checked` (Text): The recipient's first name (e.g., `Sarah`), dynamically piped from Step 3

### Subscriber Tags
* `card-sender`: Users who crafted or sent a card
* `reminder-subscriber-30d`: Users who checked *"Remind me to check in on [Name] in 30 days"*
* `premium-buyer`: Users who purchased the $4.99 Lifetime Card Pack
* `newsletter-free`: General homepage subscribers

---

## 2. Master Welcome Sequence (Automation Workflow)

**Trigger:** When subscriber joins group `180628908682512348`

```
[Trigger: Joins Group 180628908682512348]
       │
       ▼
[Action: Send Email 1 — Immediately]
"Your first vibe is here (+ 3 free wallpapers) ✨"
       │
       ▼
[Delay: 2 Days]
       │
       ▼
[Condition: Does subscriber have tag `premium-buyer`?]
       ├─ YES ──> [Send: VIP Founder Note & Ambient Theme Guide]
       └─ NO  ──> [Send Email 2: "Why I started this (and a 60-second challenge)"]
                     │
                     ▼
              [Delay: 3 Days] (Day 5 Total)
                     │
                     ▼
              [Send Email 3: "How we keep this free (and what Premium actually is)"]
                     │
                     ▼
              [Delay: 25 Days] (Day 30 Total)
                     │
                     ▼
              [Condition: Does subscriber have tag `reminder-subscriber-30d`?]
                     └─ YES ──> [Send Email 4: "A gentle reminder about {$recipient_checked|your friend} 💌"]
```

---

### EMAIL 1 — Day 0 (Send immediately on signup)
**Subject:** Your first vibe is here (+ 3 free wallpapers) ✨  
**Preview Text:** A gentle reminder you might have needed today. Open for your downloads.

```markdown
Hey {$name|friend},

Welcome to The Vibe Check Project. You just made a really good call.

Every morning, you'll receive one short, grounding affirmation in your inbox. No fluff, no sales pitches, and no unsolicited advice—just a steady 30-second breath before the day begins.

Here is your first spark for today:

> **"You are allowed to take up space. Your needs matter. Your feelings are valid."**

Save that. Screenshot it. Let it anchor your thoughts today.

---

### 🎁 Your 3 Free Mobile Affirmation Wallpapers:
Designed in high-resolution for your phone lock screen so your first glance of the day is centered:

1. *"You're doing better than you think you are."* — [Download Wallpaper 1](https://thevibecheckproject.com/assets/wallpapers/wallpaper_1_better.png)
2. *"Rest is not weakness. It's essential."* — [Download Wallpaper 2](https://thevibecheckproject.com/assets/wallpapers/wallpaper_2_rest.png)
3. *"Your presence makes a difference, even when you don't see it."* — [Download Wallpaper 3](https://thevibecheckproject.com/assets/wallpapers/wallpaper_3_presence.png)

See you tomorrow morning.

Warmly,  
Devin @ The Vibe Check Project
```

---

### EMAIL 2 — Day 2
**Subject:** Why I started this (and a 60-second challenge)  
**Preview Text:** A short message that arrived on exactly the right day.

```markdown
Hey {$name|friend},

Two days ago you joined our community. I want to tell you why The Vibe Check Project actually exists.

A while back, I went through a very quiet, heavy stretch. Not the kind you post about online—the silent kind, where you smile at work and tell everyone you're fine, but inside you're running on empty.

One Tuesday afternoon, an old friend sent me a simple text message. Three sentences. It wasn't profound. But it arrived at the exact moment I felt like folding, and it reminded me that someone had held me in their thoughts for 30 seconds.

**That is the whole mission of this project.**

I built this so that feeling—that *"someone sees me"* feeling—is something anyone can give to anyone else, for free, in about 60 seconds.

---

### Your 60-Second Challenge:
Think of one person who has been on your mind recently. Someone who is stressed, working hard, or just overdue for a smile.

👉 **[Send a Free Vibe Check Card (Takes 60 Seconds) →](https://thevibecheckproject.com/send-card.html?utm_source=mailerlite&utm_medium=email&utm_campaign=welcome_seq_day2)**

Pick someone. It takes one minute. You never know which day is the day someone desperately needed to hear from you.

Talk soon,  
Devin
```

---

### EMAIL 3 — Day 5
**Subject:** How we keep this free (and what Premium actually is)  
**Preview Text:** Transparent pricing, zero recurring subscriptions, and our mission.

```markdown
Hey {$name|friend},

You've been getting morning vibes for five days now. Hopefully they're hitting right.

If you enjoy sending cards to friends, family, or coworkers, here is the honest breakdown of our Premium Unlock:

### ✨ The Premium Lifetime Unlock — $4.99 (One-Time)
Store paper cards cost $6.99 for a single folded piece of paper. For $4.99 once, you unlock:

* 🌌 **14+ Dynamic Card Themes:** Full access to all live animated canvases (Silk, Liquid Gold, Emerald, Neon Glow).
* 🎵 **All 8 Audio Soundscapes:** Music box, harp, warm piano, and ocean chimes.
* ✍️ **Custom Message Freedom:** Craft your own affirmations with unlimited character limits.
* 🔒 **Yours Forever:** Lifetime device access with zero recurring subscriptions.

👉 **[Unlock Lifetime Premium for $4.99 →](https://buy.stripe.com/14A8wPd160dd9Cz0n11VK02)**

*(Not required. The free card tool and daily morning sparks remain 100% free forever).*

Talk soon,  
Devin @ The Vibe Check Project

P.S. Reply to this email anytime. I read every single one.
```

---

## 3. The Automated 30-Day Check-in Loop (Day 30)

**Target:** Subscribers tagged `reminder-subscriber-30d`  
**Delay:** 30 days after card creation  
**Subject:** A gentle reminder about {$recipient_checked|your friend} 💌  
**Preview Text:** It's been 30 days since you sent them a vibe check.

```markdown
Hey {$name|friend},

Exactly 30 days ago, you took a moment out of your busy schedule to create and send a personalized Vibe Check to **{$recipient_checked|someone special}**.

Life moves fast, and weeks slip away before we notice. 

When people are carrying heavy loads, support often rushes in during week one—and then goes completely quiet by week four.

If you have two minutes today, send {$recipient_checked|them} a quick text, give them a call, or send another little reminder that they're still in your corner:

👉 **[Send {$recipient_checked|Them} a Fresh Vibe Check →](https://thevibecheckproject.com/send-card.html?utm_source=mailerlite&utm_medium=email&utm_campaign=30day_checkin_loop)**

Thank you for being someone who stays in touch.

With gratitude,  
The Vibe Check Project Team
```

---

## 4. Seasonal Campaign Blueprint: World Mental Health Day (Broadcast)

**Audience:** All active subscribers  
**Date:** October 10 at 08:00 AM recipient local time  
**Subject:** For when you don't know what to say 💙  
**Preview Text:** Today is World Mental Health Day. Here's a script if someone you love is struggling.

```markdown
Hey {$name|friend},

Today is World Mental Health Day.

Usually, social media fills up with hashtags, pastel graphics, and advice to "reach out." But rarely does anyone talk about how difficult it is to know what to say when a friend is drowning in anxiety, depression, or burnout.

You don't want to say the wrong thing. You don't want to offer toxic positivity ("Everything happens for a reason!"). So often, we end up saying nothing at all.

If someone you care about is having a difficult season, here are three phrases that actually help, backed by peer counselors:

1. *"I don't expect a reply to this. I just wanted you to know I'm thinking of you and you don't have to carry this alone."*
2. *"You don't have to explain anything to me or put on a brave face. I'm here whenever you're ready."*
3. *"Would you like company without having to talk, or would you prefer quiet space today?"*

If words feel too heavy right now, you can send them one of our gentle, low-pressure affirmation cards:

👉 **[Browse Grounding & Healing Cards →](https://thevibecheckproject.com/situations.html?filter=anxiety&utm_source=mailerlite&utm_medium=email&utm_campaign=wmhd_pulse)**

And remember: check in on yourself today, too.

Warmly,  
Devin & The Vibe Check Project
```

---

## 5. How to Configure in MailerLite (Step-by-Step)

1. **Add Custom Field:** Go to **Subscribers** → **Fields** → **Add field**:
   * Name: `recipient_checked`
   * Type: `Text`
2. **Create Workflow:** Go to **Automations** → **Create workflow**:
   * Name: `Welcome & Retention Sequence 2026`
   * Trigger: `When subscriber joins a group` → Select group `180628908682512348`.
3. **Insert Steps:**
   * Step 1: Send Email 1 immediately.
   * Step 2: Delay 2 days.
   * Step 3: Condition (Tag `premium-buyer`). Branch accordingly.
   * Step 4: Delay 3 days. Send Email 3.
   * Step 5: Delay 25 days. Condition (Tag `reminder-subscriber-30d`). Send 30-Day Check-in Email.
4. **Activate:** Review links, toggle **Active**, and test with a test card send.
