# Daily Affirmation Template — The Vibe Check Project

**For:** MailerLite (Use this code for your Daily automated emails for Ko-fi members)
**Frequency:** Daily
**Subject Line Idea:** Your Daily Vibe: [Today's Theme] ✨
**Template Type:** Custom HTML Editor

---

### Copy this HTML Code into MailerLite:

```html
<!DOCTYPE html>
<html>
<head>
<style>
  body { margin: 0; padding: 0; background-color: #1A1625; color: #F8F9FA; font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; font-size: 16px; }
  .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
  .logo-text { font-weight: 800; font-size: 24px; letter-spacing: -0.5px; margin-bottom: 30px; color: #F8F9FA; text-align: center; }
  .highlight { color: #FF6B9D; }
  .green-glow { color: #bef264; }
  .affirmation-box { background: rgba(255, 107, 157, 0.05); border: 1px solid rgba(255, 107, 157, 0.2); padding: 40px 30px; border-radius: 16px; margin: 30px 0; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.3); }
  .quote-mark { font-size: 40px; color: #FF6B9D; line-height: 0; display: block; margin-bottom: 20px; font-family: Georgia, serif; }
  .affirmation-text { font-size: 22px; font-weight: 600; color: #F8F9FA; margin: 0; line-height: 1.4; }
  .theme-badge { display: inline-block; background: rgba(255, 255, 255, 0.1); padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; color: #94A3B8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 20px; }
  .cta-button { display: inline-block; background-color: #bef264; color: #1A1625; text-decoration: none; font-weight: 700; padding: 14px 28px; border-radius: 30px; margin: 30px 0; transition: opacity 0.2s; }
  .body-text { color: #cbd5e1; font-size: 16px; text-align: center; margin-top: 20px; }
  .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid rgba(255, 255, 255, 0.1); font-size: 13px; color: #94A3B8; text-align: center; }
  .footer-links { margin-top: 15px; }
  .footer-links a { color: #FF6B9D; text-decoration: none; margin: 0 10px; font-weight: 500; }
</style>
</head>
<body>
  <div class='container'>
    <div class='logo-text'>the<span class='highlight'>vibe</span>check<span class='green-glow'>.</span></div>
    
    <p class='body-text'>Good morning. Here is your daily reset.</p>

    <div class='affirmation-box'>
      <!-- Change this badge text to fit the day (e.g. Motivation Monday, Wellness Wednesday) -->
      <div class='theme-badge'>Motivation Monday</div>
      
      <span class='quote-mark'>"</span>
      <!-- Replace this text with the daily affirmation -->
      <h2 class='affirmation-text'>You do not have to have it all figured out today. Taking just one small step is enough.</h2>
    </div>

    <p style='text-align: center; margin-top: 40px;'>
      <a href='https://www.thevibecheckproject.com/send-card.html' class='cta-button'>Send this vibe to a friend &rarr;</a>
    </p>

    <div class='footer'>
      <p style='margin-bottom: 10px;'>Thank you for being a Premium Member. Your support keeps this project alive. 💜</p>
      <div class='footer-links'>
        <a href='https://www.thevibecheckproject.com'>Website</a> &bull; 
        <a href='https://ko-fi.com/thevibecheckproject'>Ko-fi</a> &bull;
        <a href='https://buy.stripe.com/14A8wPd160dd9Cz0n11VK02'>Premium Unlock — $4.99</a>
      </div>
      <p style='margin-top: 20px;'>{$unsubscribe}</p>
    </div>
  </div>
</body>
</html>
```
