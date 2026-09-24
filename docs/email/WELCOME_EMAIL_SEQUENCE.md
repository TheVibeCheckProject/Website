# Welcome emails (MailerLite)

**Automation:** "Welcome" — trigger: subscriber joins group "Vibe Check Subscribers" (ID `180628908682512348`).
Sign-ups reach MailerLite through the proxy worker `https://vibe-check-proxy.caseagent72401.workers.dev/`.

| Step | Wait | File | Subject | Preview text |
|---|---|---|---|---|
| Email 1 | right away | `welcome-email.html` | Welcome — we made you something ✨ | A little card, just for you. |
| Email 2 | 1 day | `welcome-email-2.html` | Someone on your mind? | Three easy things you could send them today. |
| Email 3 | 3 days | `welcome-email-3.html` | What Premium is (and isn't) | The free cards stay free. Here's what $4.99 adds. |

Each file is pasted whole into MailerLite's code editor (Content → Custom HTML code).

## Notes
- **Sender:** wecare@thevibecheckproject.com (MailerLite can't send from Gmail addresses). Replies land in Zoho.
- **Name:** `{$name|default('there')}`. The site sends a blank name when none is typed, so the fallback applies.
  Older subscribers may have "Friend" saved as their name.
- **Card GIF (Email 1):** `assets/email/welcome-card.gif`, uploaded to MailerLite's File manager.
  Rebuild with `node scripts/marketing/welcome-card/render.js`.
- **Premium copy (Email 3)** must match the Premium popup on `send-card.html`. Update both together.
- **Fields the site sends:** `name`, `signup_source` (`homepage`, `homepage-join-section`,
  `send-card-checkin-30d`) and, for 30-day reminders, `recipient_checked`. The site sends **no tags**,
  so automations must branch on fields, not tags.
- **Design:** background `#1A1625`, text `#EDE8F5`, secondary `#C9BFDA`, pink `#FF6B9D`, gold `#FEC84A`.

## Still to do
- 30-day check-in email: separate automation for `signup_source = send-card-checkin-30d`, using `recipient_checked`.
