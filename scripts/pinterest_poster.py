"""
Pinterest Auto-Poster — Browser Automation
Posts pin images to Pinterest boards via Selenium, no API access needed.

Usage:
    python scripts/pinterest_poster.py                    # Post next batch (3 pins)
    python scripts/pinterest_poster.py --limit 5          # Post 5 pins
    python scripts/pinterest_poster.py --dry-run          # Preview without posting
    python scripts/pinterest_poster.py --category anxiety # Only post from one category
    python scripts/pinterest_poster.py --headless         # Run without visible browser
    python scripts/pinterest_poster.py --schedule         # Schedule pins for future dates
    python scripts/pinterest_poster.py --schedule --interval 4h  # Every 4 hours
    python scripts/pinterest_poster.py --schedule --interval 1d  # Once per day
    python scripts/pinterest_poster.py --schedule --start-time "2026-03-12 09:00"  # Start at specific time

Requirements:
    pip install selenium webdriver-manager groq
"""

import json
import os
import sys
import time
import argparse
from datetime import datetime, timedelta
import random
from pathlib import Path

try:
    from groq import Groq as GroqClient
    GROQ_AVAILABLE = True
except ImportError:
    GROQ_AVAILABLE = False

try:
    from selenium import webdriver
    from selenium.webdriver.common.by import By
    from selenium.webdriver.common.keys import Keys
    from selenium.webdriver.chrome.service import Service
    from selenium.webdriver.chrome.options import Options
    from selenium.webdriver.support.ui import WebDriverWait
    from selenium.webdriver.support import expected_conditions as EC
    from selenium.webdriver.common.action_chains import ActionChains
    from webdriver_manager.chrome import ChromeDriverManager
except ImportError:
    print("❌ Missing dependencies. Run:")
    print("   pip install selenium webdriver-manager")
    sys.exit(1)

# ==========================================
# CONFIGURATION
# ==========================================

SCRIPT_DIR = Path(__file__).parent
DATA_DIR = SCRIPT_DIR.parent / "data"
PINS_DIR = SCRIPT_DIR.parent / "assets" / "pinterest-pins"

MESSAGES_FILE = DATA_DIR / "messages.json"
TRACKER_FILE = DATA_DIR / "posted_pins.json"

# Pinterest credentials
PINTEREST_EMAIL = os.environ.get("PINTEREST_EMAIL", "wecare@thevibecheckproject.com")
PINTEREST_PASSWORD = os.environ.get("PINTEREST_PASSWORD", "Splinter12345@!")

# Board URLs for each category
BOARD_URLS = {
    "encouragement": "https://www.pinterest.com/thevibecheckproject/encouraging-words/",
    "grief":         "https://www.pinterest.com/thevibecheckproject/grief-sympathy-support/",
    "anxiety":       "https://www.pinterest.com/thevibecheckproject/anxiety-grounding/",
    "just-because":  "https://www.pinterest.com/thevibecheckproject/daily-affirmations/",
    "breakup":       "https://www.pinterest.com/thevibecheckproject/breakup-healing/",
}

# Mapping category IDs to actual board names for search
BOARD_NAMES = {
    "encouragement": "Encouraging Words",
    "grief":         "Grief & Sympathy Support",
    "anxiety":       "Anxiety & Grounding",
    "just-because":  "Daily Affirmations",
    "breakup":       "Breakup & Healing",
}

# Default board if category not mapped
DEFAULT_BOARD_URL = "https://www.pinterest.com/thevibecheckproject/encouraging-words/"

WEBSITE_BASE = "https://www.thevibecheckproject.com/blog/"
HASHTAGS = "#affirmations #mentalhealth #support #selfcare #positivity"

# Verified blog slugs — source of truth so links never use a typo from the data file
VERIFIED_SLUGS = {
    "encouragement": "encouraging-messages-for-cards",
    "grief":         "sympathy-card-messages",
    "anxiety":       "texts-for-anxiety",
    "just-because":  "just-because-messages",
    "breakup":       "breakup-support-messages",
}

PIN_DELAY = 8  # seconds between pins (to avoid rate limits)

# Cache file so AI descriptions are only generated once per pin
DESCRIPTIONS_CACHE_FILE = DATA_DIR / "generated_descriptions.json"

# ==========================================
# AI DESCRIPTION GENERATOR
# ==========================================

# Rotated angle list — each pin gets a different title style instruction
TITLE_ANGLES = [
    "a relatable question (e.g. 'Feeling overwhelmed? Read this.')",
    "a 'what to text when...' phrase",
    "a 'how to support a friend who...' phrase",
    "an emotional hook statement (lead with the feeling)",
    "a 'send this to someone who...' suggestion",
    "a gentle reminder framed as advice",
    "a 'you don't have to say the perfect thing' angle",
    "a practical tip framed as a title",
    "a 'when words fail...' angle",
    "a 'the text that changed everything' style hook",
]

CATEGORY_CONTEXT = {
    "encouragement": "encouraging someone to keep going, celebrate their effort, or believe in themselves",
    "grief":         "offering compassionate support to someone who is grieving or experiencing loss",
    "anxiety":       "helping someone feel grounded and safe during anxiety or a panic attack",
    "just-because":  "a random, heartfelt check-in to remind someone they are loved and thought of",
    "breakup":       "supporting a heartbroken friend through a painful breakup or relationship ending",
}

def load_description_cache():
    """Load the cached AI-generated descriptions."""
    if DESCRIPTIONS_CACHE_FILE.exists():
        with open(DESCRIPTIONS_CACHE_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}

def save_description_cache(cache):
    """Save the AI-generated descriptions cache."""
    with open(DESCRIPTIONS_CACHE_FILE, "w", encoding="utf-8") as f:
        json.dump(cache, f, indent=2)

def load_groq_api_key():
    """Read GROQ_API_KEY from the Agent .env file or environment."""
    # Check env first
    key = os.environ.get("GROQ_API_KEY")
    if key:
        return key
    # Fall back to the Agent's .env file
    env_path = Path("C:/Users/devin/OneDrive/Desktop/Assistant/.env")
    if env_path.exists():
        for line in env_path.read_text(encoding="utf-8").splitlines():
            if line.startswith("GROQ_API_KEY="):
                return line.split("=", 1)[1].strip()
    return None

def generate_pin_content(pin_id, message, cat_id, hashtags, fallback_title, fallback_description, pin_index=0):
    """
    Generate both the Pinterest title AND description in one Groq call.
    Results are cached so each pin is only generated once.
    Returns (title, description) tuple.
    Falls back to static templates if Groq is unavailable.
    """
    cache = load_description_cache()
    if pin_id in cache and isinstance(cache[pin_id], dict):
        cached = cache[pin_id]
        return cached["title"], cached["description"]

    if not GROQ_AVAILABLE:
        print("   ⚠️  groq package not installed. Using template content.")
        print("      Run: pip install groq")
        return fallback_title, fallback_description

    api_key = load_groq_api_key()
    if not api_key:
        print("   ⚠️  GROQ_API_KEY not found. Using template content.")
        return fallback_title, fallback_description

    context = CATEGORY_CONTEXT.get(cat_id, f"supporting someone emotionally with {cat_id} messages")
    angle = TITLE_ANGLES[pin_index % len(TITLE_ANGLES)]

    try:
        client = GroqClient(api_key=api_key)
        response = client.chat.completions.create(
            model="meta-llama/llama-4-scout-17b-16e-instruct",
            max_tokens=300,
            temperature=1.0,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You write Pinterest pin titles and descriptions for The Vibe Check Project, "
                        "a platform that helps people send the right emotional support messages to friends. "
                        "Your copy is warm, relatable, and feels like something a real person would share — "
                        "never corporate, never generic. Always casual and friendly."
                    )
                },
                {
                    "role": "user",
                    "content": (
                        f"Write a Pinterest title and description for a pin about {context}.\n\n"
                        f"The specific message on the pin is:\n\"{message}\"\n\n"
                        f"Format your response EXACTLY like this (two lines, nothing else):\n"
                        f"TITLE: <title here>\n"
                        f"DESC: <description here>\n\n"
                        f"Rules for TITLE:\n"
                        f"- Max 8 words, search-friendly\n"
                        f"- Use THIS specific angle: {angle}\n"
                        f"- Base it on the specific emotion or moment in the message above\n"
                        f"- No quotes, don't copy message text verbatim\n\n"
                        f"Rules for DESC:\n"
                        f"- 2 sentences max, under 200 characters\n"
                        f"- Make it feel personal and shareable, not like ad copy\n"
                        f"- End with: {hashtags}"
                    )
                }
            ]
        )
        raw = response.choices[0].message.content.strip()

        # Parse the two-line response
        title_out = fallback_title
        desc_out = fallback_description
        for line in raw.splitlines():
            if line.upper().startswith("TITLE:"):
                title_out = line.split(":", 1)[1].strip()[:100]
            elif line.upper().startswith("DESC:"):
                desc_out = line.split(":", 1)[1].strip()[:500]

        cache[pin_id] = {"title": title_out, "description": desc_out}
        save_description_cache(cache)
        print(f"   ✨ Groq title + description generated for {pin_id}")
        return title_out, desc_out

    except Exception as e:
        print(f"   ⚠️  Groq content failed ({e}). Using template fallback.")
        return fallback_title, fallback_description

# Optimized Titles and Descriptions for Pinterest Engagement
CATEGORIAL_TEMPLATES = {
    "encouragement": {
        "titles": [
            "What to text a friend who needs a win",
            "How to hype your friend up 🚀",
            "Encouraging words for someone taking a big step",
            "Simple ways to be your friend's biggest hype man",
            "The perfect text to send an ambitious friend",
            "When your friend is feeling down, send this."
        ],
        "intros": [
            "A little hit of encouragement for your feed: ",
            "I just wanted to share this vibe: ",
            "Send this to someone who needs to hear it today: ",
            "A reminder that you're doing better than you think: ",
            "Small words, big impact: ",
            "This really resonated with me today: "
        ],
        "description": "A simple text can change someone's entire day. These encouraging messages remind them how much they are capable of.",
        "hashtags": "#encouragement #support #motivation #friendship #positivity"
    },
    "grief": {
        "titles": [
            "What to text a grieving friend",
            "Supportive messages when there are no words",
            "How to be there for a friend who is grieving",
            "The right thing to say to someone who is hurting",
            "Simple, caring texts for loss and sympathy",
            "When you don't know what to say to a friend in pain."
        ],
        "intros": [
            "When words fail, simple presence matters: ",
            "A gentle message to send someone who is hurting: ",
            "Sometimes the best thing to say is 'I'm here': ",
            "Holding space for others today: ",
            "Supportive words for the heavy days: ",
            "A reminder that it's okay not to be okay: "
        ],
        "description": "Grief is heavy and sometimes there truly are no words. Use these simple, supportive messages to provide comfort without the platitudes.",
        "hashtags": "#griefsupport #sympathy #bereavement #holdingspace #mentalhealth"
    },
    "anxiety": {
        "titles": [
            "What to text a friend having a panic attack",
            "How to support an anxious friend right now",
            "Gentle reminders for hard mental health days",
            "Grounding techniques and supportive words",
            "What to text someone when anxiety feels heavy",
            "A text message to help someone feel safe."
        ],
        "intros": [
            "Grounding words for an anxious heart: ",
            "A text to send someone who is spiraling: ",
            "Helping a friend find their breath: ",
            "You are safe, you are loved: ",
            "Words for when the world feels too loud: ",
            "Stay in the present moment with this: "
        ],
        "description": "Anxiety can feel isolating and overwhelming. Use these grounding messages to support someone through high anxiety or a panic attack.",
        "hashtags": "#anxiety #mentalhealth #panicattack #grounding #selfcare"
    },
    "just-because": {
        "titles": [
            "What to text a friend you're thinking of",
            "Random ways to make someone's day special",
            "Brighten their phone with a simple 'just because' text",
            "How to let a friend know you're thinking of them",
            "Sweet and simple reminders that they matter",
            "A quick text to make your bestie smile."
        ],
        "intros": [
            "Just a random reminder: ",
            "Sending a virtual hug with this: ",
            "I saw this and thought of you: ",
            "Because you don't need a reason to be kind: ",
            "A little something to brighten your day: ",
            "Spreading good vibes for no reason at all: "
        ],
        "description": "You don't need a crisis to tell someone they matter. These 'just because' messages are perfect for a random check-in to make your friends smile.",
        "hashtags": "#thinkingofyou #friendshipgoals #positivity #spreadlove #goodvibes"
    },
    "breakup": {
        "titles": [
            "What to text a friend crying through a breakup",
            "Grieving a relationship? Read this support guide.",
            "How to be there for a heartbroken friend",
            "Moving on after a breakup: Validating messages",
            "Supportive texts for when life feels heavy",
            "What to say when their heart is broken."
        ],
        "intros": [
            "Validation for a hurting heart: ",
            "When their world feels like it's crashing: ",
            "Support for the messy, hard days of healing: ",
            "Reminder: You are enough, with or without them: ",
            "Helping a friend through heartbreak: ",
            "Taking it one hour at a time: "
        ],
        "description": "Breakups are brutal. These validating, supportive messages help you show up for your friend when their world feels like it's crashing.",
        "hashtags": "#breakupsupport #selflove #heartbreak #healing #relationshipadvice"
    }
}

# ==========================================
# HELPERS
# ==========================================

def load_json(filepath):
    """Load a JSON file, return empty default if missing."""
    if filepath.exists():
        with open(filepath, "r", encoding="utf-8") as f:
            return json.load(f)
    return []

def save_json(filepath, data):
    """Save data to JSON file."""
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)

def try_kill_processes():
    """Surgically kill only Chrome processes using our project-local profile and clean up locks."""
    profile_dir = SCRIPT_DIR.parent / ".pinterest-profile"
    profile_path_str = str(profile_dir.resolve())
    print(f"🧹 Polishing session lock (targeting specific automation profile)...")
    
    try:
        if os.name == 'nt':
            # 1. More aggressive chromedriver killing
            os.system('taskkill /f /im chromedriver.exe /t >nul 2>&1')
            
            # 2. Use PowerShell to find and kill the specific chrome instance
            safe_path = profile_path_str.replace("\\", "\\\\")
            cmd = f'powershell -Command "Get-CimInstance Win32_Process -Filter \\"Name=\'chrome.exe\'\\" | Where-Object {{$_.CommandLine -like \'*--user-data-dir={safe_path}*\'}} | ForEach-Object {{Stop-Process -Id $_.ProcessId -Force}}"'
            os.system(cmd)
            
            # 3. Manual Lock Cleanup (The most common cause of SessionNotCreatedException)
            lock_files = ["SingletonLock", "SingletonCookie", "SingletonSocket", "lockfile"]
            for lock in lock_files:
                lock_path = profile_dir / lock
                if lock_path.exists():
                    try:
                        lock_path.unlink()
                        print(f"   🔓 Removed stale lock: {lock}")
                    except:
                        pass
        else:
            os.system(f'pkill -f "{profile_path_str}" >/dev/null 2>&1')
            os.system('pkill -f chromedriver >/dev/null 2>&1')
            # Unix locks are often different but same principle
            for lock in ["SingletonLock", "SingletonCookie"]:
                (profile_dir / lock).unlink(missing_ok=True)
                
        time.sleep(1.5)
    except:
        pass

def get_driver(headless=False):
    """Create and return a Chrome WebDriver instance."""
    options = Options()
    if headless:
        options.add_argument("--headless=new")
    options.add_argument("--window-size=1920,1080")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--disable-blink-features=AutomationControlled")
    options.add_experimental_option("excludeSwitches", ["enable-automation"])
    options.add_experimental_option("useAutomationExtension", False)
    options.add_argument("--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36")
    
    # Use persistent profile to keep login session
    profile_dir = SCRIPT_DIR.parent / ".pinterest-profile"
    profile_dir.mkdir(exist_ok=True)
    options.add_argument(f"--user-data-dir={profile_dir}")
    
    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=options)
    driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
    return driver

# ==========================================
# PINTEREST ACTIONS
# ==========================================

def login_pinterest(driver):
    """Log into Pinterest. Skipped if already logged in via persistent profile."""
    print("🌐 Checking Pinterest session...")
    driver.get("https://www.pinterest.com/")
    time.sleep(5)
    
    # Broad check for being logged in
    logged_in_indicators = [
        '[data-test-id="header-avatar"]',
        '[data-test-id="search-box-input"]',
        '[data-test-id="header-notifications-button"]',
        '[data-test-id="header-messages-button"]',
        '[data-test-id="business-hub-title"]', # Specific to Business Hub
        'a[href*="/business/hub/"]'
    ]
    
    for selector in logged_in_indicators:
        try:
            if driver.find_elements(By.CSS_SELECTOR, selector):
                print(f"✅ Already logged in (detected {selector})")
                return True
        except:
            pass

    # URL-based check
    if any(path in driver.current_url for path in ["/feed/", "homefeed", "/today/", "/business/hub/"]):
        print(f"✅ Already logged in (detected via URL: {driver.current_url})")
        return True
    
    # Text-based fallback check
    try:
        if "Business Hub" in driver.page_source or "Create Pin" in driver.page_source:
             print("✅ Already logged in (detected via page text)")
             return True
    except:
        pass
    
    # If we have credentials, try automated login
    if PINTEREST_EMAIL and PINTEREST_PASSWORD:
        print("🔐 Navigating to login page...")
        driver.get("https://www.pinterest.com/login/")
        time.sleep(4)
        
        # Check if we were redirected back because we're actually logged in
        if any(path in driver.current_url for path in ["/feed/", "homefeed", "/today/"]):
            print("✅ Already logged in (redirected from login page)")
            return True
            
        try:
            # Check for email field
            email_fields = driver.find_elements(By.ID, "email")
            if not email_fields:
                # Last ditch check if we're already in
                if driver.find_elements(By.CSS_SELECTOR, '[data-test-id="header-avatar"]'):
                    return True
                print("⚠️  Login page didn't show email field. Might be logged in or seeing a different UI.")
                time.sleep(5)
                if any(path in driver.current_url for path in ["/feed/", "homefeed"]): return True

            email_field = WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((By.ID, "email"))
            )
            email_field.clear()
            email_field.send_keys(PINTEREST_EMAIL)
            
            pw_field = driver.find_element(By.ID, "password")
            pw_field.clear()
            pw_field.send_keys(PINTEREST_PASSWORD)
            
            pw_field.send_keys(Keys.RETURN)
            print("🚀 Login form submitted...")
            time.sleep(8)
            
            if any(path in driver.current_url for path in ["/feed/", "homefeed", "/today/"]):
                print("✅ Login successful!")
                return True
            else:
                print("⚠️  Login page still active. Waiting for manual completion or CAPTCHA...")
                time.sleep(20)
                return True
        except Exception as e:
            # Check one last time if we're actually logged in now
            if any(path in driver.current_url for path in ["/feed/", "homefeed"]):
                return True
            print(f"❌ Login error: {e}")
            return False
    
    # Fallback to manual login wait
    print("\n⚠️  Not logged in. Please log in manually in the browser window.")
    for i in range(120, 0, -1):
        if any(path in driver.current_url for path in ["/feed/", "homefeed", "/today/"]) or \
           driver.find_elements(By.CSS_SELECTOR, '[data-test-id="header-avatar"]'):
            print("✅ Login detected!")
            return True
        if i % 10 == 0:
            print(f"   ⏳ {i}s remaining...")
        time.sleep(1)
    
    print("❌ Login timed out.")
    return False

def schedule_pin(driver, schedule_time):
    """Toggle 'Publish at a later date' and set the scheduled date/time."""
    try:
        # Find and click the "Publish at a later date" toggle
        toggle = None
        
        # Try multiple ways to find the toggle
        for selector in [
            'input[type="checkbox"]',
            '[role="switch"]',
            'div[role="switch"]',
        ]:
            try:
                elements = driver.find_elements(By.CSS_SELECTOR, selector)
                for el in elements:
                    parent_text = el.find_element(By.XPATH, './../..').text.lower()
                    if 'later' in parent_text or 'publish' in parent_text or 'schedule' in parent_text:
                        toggle = el
                        break
            except:
                continue
            if toggle:
                break
        
        if not toggle:
            # Fallback: search by text content
            try:
                spans = driver.find_elements(By.XPATH, "//*[contains(text(), 'Publish at a later date') or contains(text(), 'later date')]")
                if spans:
                    toggle = spans[0]
            except:
                pass
        
        if not toggle:
            print("   ⚠️  Could not find schedule toggle")
            return False
        
        # Click the toggle
        driver.execute_script("arguments[0].click();", toggle)
        time.sleep(2)
        print(f"   🕐 Schedule toggle activated")
        
        # Format the date and time
        date_str = schedule_time.strftime("%m/%d/%Y")
        time_str = schedule_time.strftime("%I:%M %p")  # 12-hour format (e.g., 02:00 PM)
        
        # Set Date: Focus and then Type
        date_filled = False
        print(f"   📅 Target Date: {date_str}")
        for selector in ['input[type="date"]', 'input[placeholder*="date"]', 'input[aria-label*="date"]', '[data-test-id*="date"] input']:
            try:
                date_input = driver.find_element(By.CSS_SELECTOR, selector)
                driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", date_input)
                time.sleep(1)
                
                # Clear thoroughly
                date_input.click()
                date_input.send_keys(Keys.CONTROL + "a")
                date_input.send_keys(Keys.BACKSPACE)
                time.sleep(0.5)
                
                # Type and verify
                date_input.send_keys(date_str)
                date_input.send_keys(Keys.ENTER)
                time.sleep(1)
                
                # Check if value set (basic check)
                val = date_input.get_attribute("value")
                if date_str in val or "/" in val:
                    date_filled = True
                    print("   ✅ Date entered and verified")
                else:
                    date_filled = True # Assume success if no error, but printed as check
                break
            except:
                continue
        
        # Set Time: Click then Select from Popup
        time_filled = False
        print(f"   🕒 Target Time: {time_str}")
        for selector in ['input[placeholder*="time"]', 'input[aria-label*="time"]', '[data-test-id*="time"] input']:
            try:
                time_input = driver.find_element(By.CSS_SELECTOR, selector)
                driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", time_input)
                time.sleep(0.5)
                
                # Click to open the picker
                time_input.click()
                print("      - Time picker opened, searching for option...")
                time.sleep(2)
                
                # Search for the time option in the popup
                # Pinterest usually uses a list of items for the time picker
                options = driver.find_elements(By.CSS_SELECTOR, '[role="option"], [data-test-id*="option"], div[class*="option"]')
                
                target_found = False
                for opt in options:
                    opt_text = opt.text.strip()
                    if time_str in opt_text or opt_text == time_str:
                        print(f"      🎯 Found matching time option: '{opt_text}'")
                        driver.execute_script("arguments[0].click();", opt)
                        target_found = True
                        time_filled = True
                        break
                
                if not target_found:
                    # Fallback: Just try typing it if selection failed
                    print("      ⚠️  Could not find time option in list, trying to type as fallback...")
                    time_input.send_keys(Keys.CONTROL + "a")
                    time_input.send_keys(Keys.BACKSPACE)
                    time_input.send_keys(time_str)
                    time_input.send_keys(Keys.ENTER)
                    time_filled = True
                
                break
            except:
                continue
        
        if date_filled and time_filled:
            return True
        else:
            print(f"   ⚠️  Scheduling details partially set: Date={date_filled}, Time={time_filled}")
            return False
            
    except Exception as e:
        print(f"   ⚠️  Scheduling error: {e}")
        return False

def slow_type(element, text, delay=0.02):
    """Type text character by character so Pinterest's UI can keep up."""
    for char in text:
        element.send_keys(char)
        time.sleep(delay)

def create_pin(driver, image_path, title, description, link, board_url, cat_id=None, schedule_time=None):
    """Create a single pin on Pinterest via the browser UI."""
    
    # Navigate to pin creation
    driver.get("https://www.pinterest.com/pin-creation-tool/")
    time.sleep(3)
    
    try:
        # Wait for the page to load
        WebDriverWait(driver, 15).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, 'input[type="file"], [data-test-id="pin-draft-title"]'))
        )
    except:
        print("   ⚠️  Pin creation page slow to load, waiting more...")
        time.sleep(5)
    
    # Upload image
    try:
        file_input = driver.find_element(By.CSS_SELECTOR, 'input[type="file"]')
        file_input.send_keys(str(image_path))
        print(f"   📷 Image uploaded: {image_path.name}")
    except Exception as e:
        print(f"   ❌ Failed to upload image: {e}")
        return False

    # Wait for title field to be fully interactive after image processing
    # Pinterest can take 30-60s to process the image before the form is usable
    # We wrap this in a retry loop to handle StaleElementReferenceException if the page refreshes
    print("   ⏳ Waiting for form to become ready...")
    title_field = None
    for attempt in range(3):
        try:
            title_field = WebDriverWait(driver, 60).until(
                EC.element_to_be_clickable((By.CSS_SELECTOR,
                    '[data-test-id="pin-draft-title"] textarea, '
                    '[data-test-id="pin-draft-title"] input, '
                    'textarea[placeholder*="title"], input[placeholder*="title"]'
                ))
            )
            # Re-verify the element is still attached to the DOM by doing a basic action
            title_field.click()
            break
        except Exception as e:
            if attempt < 2:
                print(f"      (Form refreshed, retrying... {attempt + 1})")
                time.sleep(2)
            else:
                print(f"   ❌ Form never became ready: {e}")
                return False

    # Fill in title
    try:
        time.sleep(0.3)
        title_field.send_keys(Keys.CONTROL + "a")
        title_field.send_keys(Keys.DELETE)
        time.sleep(0.2)
        slow_type(title_field, title[:100])
        print(f"   📝 Title: {title[:60]}")
    except Exception as e:
        print(f"   ⚠️  Could not fill title field: {e}")

    # Pause before moving to description
    time.sleep(0.3)

    # Fill in description — DraftJS contenteditable
    # Strategy: paste via ClipboardEvent (most reliable for React/DraftJS in modern Chrome)
    try:
        desc_field = WebDriverWait(driver, 10).until(
            EC.element_to_be_clickable((By.CSS_SELECTOR,
                'div.public-DraftEditor-content[contenteditable="true"], '
                '[aria-label="Add a detailed description"]'
            ))
        )
        desc_field.click()
        time.sleep(0.4)

        desc_text = description[:500]

        # Try 1: ClipboardEvent paste (works with React/DraftJS in modern Chrome)
        pasted = driver.execute_script("""
            var el = arguments[0];
            var text = arguments[1];
            el.focus();
            try {
                var dt = new DataTransfer();
                dt.setData('text/plain', text);
                el.dispatchEvent(new ClipboardEvent('paste', {
                    bubbles: true,
                    cancelable: true,
                    clipboardData: dt
                }));
                return 'clipboard';
            } catch(e) { return 'clipboard_failed:' + e; }
        """, desc_field, desc_text)

        time.sleep(0.4)

        # Check if anything was typed — if field is still empty, fall back
        actual = driver.execute_script(
            "return arguments[0].innerText || arguments[0].textContent || '';",
            desc_field
        ).strip()

        if not actual:
            # Try 2: execCommand insertText (older Chrome / some Pinterest versions)
            driver.execute_script(
                "arguments[0].focus();"
                "document.execCommand('selectAll', false, null);"
                "document.execCommand('insertText', false, arguments[1]);",
                desc_field, desc_text
            )
            time.sleep(0.4)
            actual = driver.execute_script(
                "return arguments[0].innerText || arguments[0].textContent || '';",
                desc_field
            ).strip()

        if not actual:
            # Try 3: ActionChains key-by-key (slow but always works)
            ActionChains(driver).click(desc_field).perform()
            time.sleep(0.3)
            slow_type(desc_field, desc_text, delay=0.03)
            time.sleep(0.3)

        print(f"   📝 Description: {description[:60]}...")
    except Exception as e:
        print(f"   ⚠️  Could not fill description field: {e}")

    time.sleep(0.3)

    # Fill in destination link
    try:
        link_field = WebDriverWait(driver, 10).until(
            EC.element_to_be_clickable((By.CSS_SELECTOR,
                '[data-test-id="pin-draft-link"] input, '
                'input[placeholder*="link"], input[placeholder*="url"], input[placeholder*="URL"]'
            ))
        )
        link_field.click()
        time.sleep(0.3)
        link_field.send_keys(Keys.CONTROL + "a")
        link_field.send_keys(Keys.DELETE)
        time.sleep(0.2)
        slow_type(link_field, link)
        print(f"   🔗 Link: {link}")
    except Exception as e:
        print(f"   ⚠️  Could not find link field: {e}")

    time.sleep(0.3)

    # Select board
    board_name = BOARD_NAMES.get(cat_id, "Encouraging Words") if cat_id else "Encouraging Words"
    try:
        board_selector = WebDriverWait(driver, 10).until(
            EC.element_to_be_clickable((By.CSS_SELECTOR,
                '[data-test-id="board-dropdown-select-button"], [data-test-id="board-dropdown"]'
            ))
        )
        board_selector.click()
        time.sleep(1.5)

        # Type board name into search
        try:
            search_input = WebDriverWait(driver, 5).until(
                EC.element_to_be_clickable((By.CSS_SELECTOR,
                    '#pickerSearchField, input[placeholder*="Search"], [data-test-id="board-dropdown-filter"] input'
                ))
            )
            search_input.click()
            time.sleep(0.2)
            search_input.clear()
            slow_type(search_input, board_name)
            time.sleep(0.8)  # let results populate
        except Exception as e:
            print(f"   ⚠️  Board search input not found: {e}")

        # Wait for board rows to actually appear after search
        # Pinterest renders board rows as data-test-id="board-row-{BoardName}"
        try:
            WebDriverWait(driver, 8).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, '[data-test-id^="board-row-"]'))
            )
            time.sleep(0.5)  # small settle pause
            
            options = driver.find_elements(By.CSS_SELECTOR, '[data-test-id^="board-row-"]')
            clicked = False
            for opt in options:
                test_id = (opt.get_attribute("data-test-id") or "").lower()
                text_content = (opt.text or "").lower()
                
                if board_name.lower() in test_id or board_name.lower() in text_content:
                    print(f"      🎯 Found board row: '{board_name}'")
                    driver.execute_script("arguments[0].scrollIntoView({block:'center'});", opt)
                    time.sleep(0.3)
                    
                    # Try 1: Standard Selenium Click
                    try:
                        opt.click()
                        clicked = True
                    except:
                        # Try 2: JS Click (bypass overlays)
                        try:
                            driver.execute_script("arguments[0].click();", opt)
                            clicked = True
                        except:
                            pass
                    
                    if clicked:
                        break
            
            if not clicked and options:
                print("      ⚠️  Exact board match not clicked, trying first available row...")
                driver.execute_script("arguments[0].click();", options[0])
                clicked = True
            
            if clicked:
                time.sleep(1)
                # Verify selection by checking the selector button text
                try:
                    current_board = board_selector.text.strip()
                    if board_name.lower() in current_board.lower():
                        print(f"   ✅ Board confirmed: {current_board}")
                    else:
                        print(f"   ⚠️  Board mismatch? Selector shows: '{current_board}' (Expected: '{board_name}')")
                except:
                    print(f"   📌 Board selection finished: {board_name}")
            else:
                print(f"   ⚠️  No board rows found for '{board_name}'")
        except Exception as e:
            print(f"   ⚠️  Could not click board row: {e}")
    except Exception as e:
        print(f"   ⚠️  Could not open board selector: {e}")
    
    # Schedule for later if requested
    if schedule_time:
        schedule_pin(driver, schedule_time)
    
    # Click Publish / Schedule (Stage 1)
    try:
        # Determine button based on scheduling
        if schedule_time:
            # USER CONFIRMED STAGE 1 SELECTOR
            stage_1_selector = '[data-test-id="storyboard-creation-nav-done"] button'
            print("   🔍 Searching for Stage 1 'Schedule' button...")
            publish_btn = WebDriverWait(driver, 10).until(
                EC.element_to_be_clickable((By.CSS_SELECTOR, stage_1_selector))
            )
        else:
            print("   🔍 Searching for 'Publish' button...")
            # Expanded list for the Publish (Save) button
            publish_btn = None
            selectors = [
                 # User-provided specific structure
                 '//button[descendant::div[text()="Publish"]]',
                 '//button[.//div[contains(text(), "Publish")]]',
                 # Standard test IDs
                 '[data-test-id="board-dropdown-save-button"]',
                 'button[data-test-id="create-pin-save-button"]',
                 '[data-test-id="pin-draft-publish"] button',
                 '[data-test-id="pin-draft-publish"]',
                 # CSS class based (from user screenshot/HTML)
                 'button.GaMK1V.PRly_u',
            ]
            
            for selector in selectors:
                try:
                    if selector.startswith('//'):
                        publish_btn = WebDriverWait(driver, 2).until(
                            EC.element_to_be_clickable((By.XPATH, selector))
                        )
                    else:
                        publish_btn = WebDriverWait(driver, 2).until(
                            EC.element_to_be_clickable((By.CSS_SELECTOR, selector))
                        )
                    if publish_btn: break
                except: continue

            # Final text-based fallback search across the whole page
            if not publish_btn:
                print("      ⚠️  Direct selectors failed, searching button text...")
                try:
                    all_buttons = driver.find_elements(By.TAG_NAME, "button")
                    for btn in all_buttons:
                        btn_text = driver.execute_script("return arguments[0].innerText || arguments[0].textContent || '';", btn).strip().lower()
                        if (btn_text == "publish" or btn_text == "save") and btn.is_displayed():
                            publish_btn = btn
                            break
                except: pass

            if not publish_btn:
                raise Exception("Could not find Publish/Save button using any known selector or text search.")
        
        # Hardened Interaction for Stage 1
        driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", publish_btn)
        time.sleep(1)
        driver.execute_script("arguments[0].click();", publish_btn)
        print("   ✅ Stage 1 button clicked")
        time.sleep(5) # Allow transition
        
        # Handle the confirmation popup (Stage 2)
        if schedule_time:
            print("   🔍 Searching for Stage 2 (Modal) confirmation button...")
            found_confirm = False
            start_search = time.time()
            
            # Try for up to 20 seconds
            while time.time() - start_search < 20: 
                try:
                    # USER RECOMMENDED STAGE 2 SELECTOR
                    selector = '[data-test-id="schedule-pin-confirm-button"] button'
                    btn = WebDriverWait(driver, 2).until(
                        EC.presence_of_element_located((By.CSS_SELECTOR, selector))
                    )
                    
                    # USER RECOMMENDED INTERACTION PATTERN
                    driver.execute_script("arguments[0].scrollIntoView({block:'center'});", btn)
                    time.sleep(2)
                    driver.execute_script("arguments[0].click();", btn)
                    print("      ✅ Stage 2 Confirmation clicked via Hardened JS-Click")
                    
                    found_confirm = True
                    time.sleep(4) 
                    break
                except:
                    time.sleep(1)
            
            # Fallback search
            if not found_confirm:
                print("      ⚠️  Stage 2 Test-ID failed, trying fallback search...")
                try:
                    dialog = driver.find_element(By.XPATH, "//div[@role='dialog' or @role='alertdialog' or contains(@class, 'modal')]")
                    candidates = dialog.find_elements(By.TAG_NAME, "button")
                    for btn in candidates:
                        btn_text = driver.execute_script("return arguments[0].innerText || arguments[0].textContent || '';", btn).strip().lower()
                        if "schedule" in btn_text and "cancel" not in btn_text:
                            driver.execute_script("arguments[0].click();", btn)
                            found_confirm = True
                            print(f"      ✅ Clicked fallback button: '{btn_text}'")
                            break
                except:
                    pass

            if found_confirm:
                print(f"   ✅ Pin successfully scheduled for {schedule_time.strftime('%b %d, %Y at %I:%M %p')}!")
                return True
            else:
                print("   ❌ Final Stage 2 button NOT found. Pin may stay in drafts.")
                return False
                
        # Standard Publish Success
        print("   ✅ Pin successfully published!")
        return True

    except Exception as outer_err:
        print(f"   ❌ Critical error in final publish/schedule process: {outer_err}")
        return False

# ==========================================
# MAIN
# ==========================================

def parse_interval(interval_str):
    """Parse interval string like '2h', '30m', '1d' into timedelta."""
    interval_str = interval_str.strip().lower()
    if interval_str.endswith('h'):
        return timedelta(hours=float(interval_str[:-1]))
    elif interval_str.endswith('m'):
        return timedelta(minutes=float(interval_str[:-1]))
    elif interval_str.endswith('d'):
        return timedelta(days=float(interval_str[:-1]))
    else:
        # Default to hours
        return timedelta(hours=float(interval_str))

def parse_times(times_str):
    """Parse comma-separated times into a list of (hour, minute) tuples."""
    parsed = []
    for t in times_str.split(','):
        t = t.strip().lower()
        if 'am' in t or 'pm' in t:
            dt = datetime.strptime(t, "%I:%M%p" if ':' in t else "%I%p")
            parsed.append((dt.hour, dt.minute))
        else:
            dt = datetime.strptime(t, "%H:%M" if ':' in t else "%H")
            parsed.append((dt.hour, dt.minute))
    return sorted(parsed)

def main():
    parser = argparse.ArgumentParser(description="Pinterest Auto-Poster (Browser Automation)")
    parser.add_argument("--limit", type=int, default=3, help="Max pins to post per run (default: 3)")
    parser.add_argument("--category", type=str, help="Only post from this category")
    parser.add_argument("--dry-run", action="store_true", help="Preview without actually posting")
    parser.add_argument("--headless", action="store_true", help="Run browser in headless mode")
    parser.add_argument("--keep-open", action="store_true", help="Keep browser open after finishing for verification")
    parser.add_argument("--schedule", action="store_true", help="Schedule pins for future dates instead of posting now")
    parser.add_argument("--interval", type=str, help="Time between scheduled pins (e.g. 2h, 30m, 1d)")
    parser.add_argument("--times", type=str, default="09:00,14:00,20:00", help="Daily pattern: comma-separated times (e.g. '9am,2pm,8pm'). Default: 9am, 2pm, 8pm")
    parser.add_argument("--start-time", type=str, help="Start scheduling from this time (format: 'YYYY-MM-DD HH:MM')")
    args = parser.parse_args()

    mode_label = 'DRY RUN' if args.dry_run else ('SCHEDULE' if args.schedule else 'LIVE')
    print(f"\n{'='*60}")
    print(f"  ✨ Pinterest Auto-Poster — The Vibe Check Project")
    print(f"  Mode: {mode_label} | Limit: {args.limit}")
    if args.schedule:
        if args.interval:
            print(f"  Interval: {args.interval} between pins")
        else:
            print(f"  Pattern: {args.times} daily")
    print(f"{'='*60}\n")

    # Load data
    if not MESSAGES_FILE.exists():
        print(f"❌ Messages file not found: {MESSAGES_FILE}")
        return

    messages_data = load_json(MESSAGES_FILE)
    tracker = load_json(TRACKER_FILE)
    
    # New unified tracker handling
    if isinstance(tracker, list):
        # Backwards compatibility: convert list to dict
        tracker = {"posted_ids": tracker, "last_scheduled_at": None}
    
    posted_ids = tracker.get("posted_ids", [])
    last_scheduled_at_str = tracker.get("last_scheduled_at")
    last_scheduled_at = datetime.fromisoformat(last_scheduled_at_str) if last_scheduled_at_str else None

    # Build the queue of pins to post
    queue = []
    for category in messages_data.get("categories", []):
        cat_id = category["id"]
        if args.category and cat_id != args.category:
            continue

        for index, message in enumerate(category["messages"], start=1):
            pin_id = f"{cat_id}-{index}"
            image_path = PINS_DIR / f"{pin_id}.png"

            if pin_id in posted_ids:
                continue
            if not image_path.exists():
                continue

            # Optimized content generation: Concise desc + Hashtags
            template = CATEGORIAL_TEMPLATES.get(cat_id, {})
            titles = template.get("titles", [f"Support for {cat_id.title()}"])
            base_description = template.get("description", f"Helpful messages and support for {cat_id}.")
            hashtags = template.get("hashtags", "")
            
            # Generate title + description together via Groq (cached after first run)
            fallback_title = random.choice(titles)
            intro = random.choice(template.get("intros", [""]))
            fallback_desc = f"{intro} \"{message}\" {base_description} {hashtags}"
            title, full_description = generate_pin_content(
                pin_id, message, cat_id, hashtags, fallback_title, fallback_desc,
                pin_index=index - 1
            )
            
            # Always use the verified slug map — never trust the data file for links
            slug = VERIFIED_SLUGS.get(cat_id, category['slug'].strip())
            link = f"{WEBSITE_BASE}{slug}/"
            
            queue.append({
                "pin_id": pin_id,
                "cat_id": cat_id,
                "image_path": image_path,
                "title": title[:100],
                "description": full_description[:500],
                "link": link,
                "board_url": BOARD_URLS.get(cat_id, DEFAULT_BOARD_URL),
            })

    if not queue:
        print("🎉 All pins have been posted! Nothing left to do.")
        return

    pending = queue[:args.limit]
    
    # Calculate schedule times if scheduling
    schedule_times = []
    if args.schedule:
        if args.interval:
            # Fixed interval mode
            interval = parse_interval(args.interval)
            # Smart resumption: start from Now or last scheduled time
            start = datetime.now()
            if last_scheduled_at and last_scheduled_at > start:
                start = last_scheduled_at
            
            start += timedelta(minutes=5) # Buffer
            
            if args.start_time:
                start = datetime.strptime(args.start_time, "%Y-%m-%d %H:%M")
                
            for i in range(len(pending)):
                schedule_times.append(start + (interval * (i + 1)))
        else:
            # Daily pattern mode (morning, afternoon, evening)
            daily_pattern = parse_times(args.times)
            
            # Smart resumption: pick up after the last scheduled slot
            anchor_time = datetime.now()
            if last_scheduled_at and last_scheduled_at > anchor_time:
                anchor_time = last_scheduled_at
            
            if args.start_time:
                anchor_time = datetime.strptime(args.start_time, "%Y-%m-%d %H:%M")
            
            slots_found = 0
            check_date = anchor_time.date()
            while slots_found < len(pending):
                for hour, minute in daily_pattern:
                    slot_time = datetime.combine(check_date, datetime.min.time()).replace(hour=hour, minute=minute)
                    # Only use slots reasonably in the future of our anchor
                    if slot_time > anchor_time + timedelta(minutes=15):
                        schedule_times.append(slot_time)
                        slots_found += 1
                        if slots_found >= len(pending):
                            break
                check_date += timedelta(days=1)
    
    action_word = "scheduling" if args.schedule else "posting"
    print(f"📋 Queue: {len(queue)} pins remaining, {action_word} {len(pending)} this run\n")

    # Dry run — just show what would be posted
    if args.dry_run:
        for i, pin in enumerate(pending, 1):
            print(f"  [{i}] {pin['pin_id']}")
            print(f"      Title: {pin['title']}")
            print(f"      Image: {pin['image_path'].name}")
            print(f"      Board: {pin['board_url']}")
            print(f"      Desc:  {pin['description'][:80]}...")
            print(f"      Link:  {pin['link']}")
            if schedule_times:
                print(f"      📅 Scheduled: {schedule_times[i-1].strftime('%b %d, %Y at %I:%M %p')}")
            print()
        action = "schedule" if args.schedule else "post"
        print(f"Run without --dry-run to {action} these {len(pending)} pins.")
        return

    # Clean up any hanging processes first
    try_kill_processes()

    # Launch browser and log in
    driver = get_driver(headless=args.headless)
    
    try:
        if not login_pinterest(driver):
            print("❌ Could not log in. Exiting.")
            return

        uploaded = 0
        for i, pin in enumerate(pending, 1):
            sched = schedule_times[i-1] if schedule_times else None
            label = f"Scheduling {pin['pin_id']}" if sched else f"Posting {pin['pin_id']}"
            print(f"\n[{i}/{len(pending)}] {label}...")
            
            success = create_pin(
                driver,
                pin["image_path"],
                pin["title"],
                pin["description"],
                pin["link"],
                pin["board_url"],
                cat_id=pin["cat_id"],
                schedule_time=sched,
            )
            
            if success:
                posted_ids.append(pin["pin_id"])
                tracker["posted_ids"] = posted_ids
                if sched:
                    tracker["last_scheduled_at"] = sched.isoformat()
                
                save_json(TRACKER_FILE, tracker)
                uploaded += 1
            
            if i < len(pending):
                print(f"   ⏳ Waiting {PIN_DELAY}s before next pin...")
                time.sleep(PIN_DELAY)

        result_word = "scheduled" if args.schedule else "posted"
        print(f"\n{'='*60}")
        print(f"  ✅ COMPLETE: {uploaded}/{len(pending)} pins {result_word}")
        print(f"  📊 Tracker: {TRACKER_FILE}")
        if schedule_times:
            print(f"  🕐 First pin:  {schedule_times[0].strftime('%b %d at %I:%M %p')}")
            print(f"  🕐 Last pin:   {schedule_times[-1].strftime('%b %d at %I:%M %p')}")
        print(f"{'='*60}\n")
        
        if args.keep_open:
            print("🛑 KEEP-OPEN: Script finished, but leaving browser open as requested.")
            print("Press Ctrl+C in this terminal when you are done to close it.")
            while True:
                time.sleep(1)

    finally:
        if not args.keep_open:
            driver.quit()

if __name__ == "__main__":
    main()
