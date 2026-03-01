# The Ultimate Zapier Daily Email Guide

We are going to make this completely "Set it and forget it."
Instead of building a 365-day email sequence in MailerLite that runs out in a year, we are going to use a **31-Day Infinite Loop**.

Zapier will run every morning, look at the calendar (e.g., "Today is the 14th"), look up Row 14 on your Google Spreadsheet, and email that specific quote out to your Ko-fi Premium Members. 

## Step 1: Prep the Database
1. Run this script in your terminal to generate the database: `node scripts/generate-affirmations.mjs`
2. It will create a file called `affirmations_database.csv` in your `Website` folder.
3. Open **Google Sheets** and create a blank spreadsheet. Name it something like "Vibe Check Affirmations".
4. Go to **File > Import > Upload** and upload the `affirmations_database.csv` file you just generated.
5. You should now see two columns: **Day_of_Month** (1 through 31) and **Affirmation** (the quotes).

## Step 2: Set the Zapier Trigger
1. Go to Zapier and create a new Zap. Name it "Daily Affirmation Sender".
2. **Trigger:** Choose **Schedule by Zapier**.
3. **Event:** Choose **Every Day**.
4. **Time of Day:** Choose what time you want the email to go out (e.g., `8:00 AM`).
5. Wait, Zapier needs to know what day of the month it currently is when it runs! 
   - Click "Test Trigger". It will output the current date.

## Step 3: Format the Date (So Zapier knows the "Day")
Zapier outputs raw dates like `2026-03-14`. We need to extract just the `14` so it can find Row 14 on your sheet.
1. Add an Action step directly under the trigger.
2. Search for the app **Formatter by Zapier**.
3. **Event:** Choose **Date / Time**.
4. **Transform:** Choose **Format**.
5. **Input:** Select the Date output from your Schedule trigger.
6. **To Format:** Use Custom Value and type: `D` (This tells Zapier to output just the day of the month without leading zeros, e.g., "5" instead of "05").
7. Click Continue and Test. It should output the current day's number.

## Step 4: Grab the Quote from Google Sheets
1. Add another Action step.
2. Search for the app **Google Sheets**.
3. **Event:** Choose **Lookup Spreadsheet Row**.
4. Connect your Google account and select the "Vibe Check Affirmations" spreadsheet.
5. **Lookup Column:** Choose `Day_of_Month`
6. **Lookup Value:** Click inside the box and select the completely formatted `D` number from Step 3!
7. Click Continue and Test. Zapier will magically spit out the exact affirmation for today's date!

## Step 5: Send the Email via MailerLite
1. Add your final Action step.
2. Search for the app **MailerLite**.
3. **Event:** Choose **Create and Send Campaign**. (You may need to use "Send Campaign" depending on your MailerLite version, or "Send Email").
   *Note: If MailerLite doesn't allow sending a direct email to a group via Zapier on the free tier, you instead use Zapier's built in **Email by Zapier** or **Gmail** integration and BCC your `Premium Members` group.*
4. **Group:** Select your `Premium Members` group.
5. **Subject:** `Your Daily Vibe Check ✨`
6. **Content/HTML:** Copy the entire HTML block from `DAILY_AFFIRMATION_TEMPLATE.md`. Paste it into the email body box. 
7. Extremely important: Highlight the placeholder text `{$AFFIRMATION_TEXT_GOES_HERE}` in your pasted HTML, and replace it by clicking and insert the **Affirmation** variable that Zapier grabbed from Google Sheets in Step 4!
8. Click Continue, Test, and **PUBLISH!**

You are entirely done. Tomorrow morning at 8 AM, Zapier will look up tomorrow's date, grab the associated quote from your Google Sheet, and automatically inject it into your beautifully designed HTML template and send it to everyone who paid on Ko-Fi. Forever.
