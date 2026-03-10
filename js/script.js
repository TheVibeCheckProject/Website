// Daily affirmations database (Consolidated)
const affirmations = [
    "You're trying, and that's what counts.",
    "Your feelings are valid, and you deserve to be heard.",
    "Every new day is a fresh chance to try again.",
    "You're doing better than you think you are.",
    "Your presence makes a difference, even when you don't see it.",
    "Rest is not weakness. It's essential.",
    "You are allowed to take up space.",
    "It's okay to not have it all figured out.",
    "Someone out there is grateful you exist.",
    "You don't have to earn the right to be loved.",
    "Your story isn't over. Keep going.",
    "Progress isn't always visible, but it's always happening.",
    "You are more resilient than you realize.",
    "The hard days make the good ones so much better.",
    "You are enough, exactly as you are right now.",
    "It's brave to ask for help.",
    "You bring something to this world that no one else can.",
    "Healing isn't linear, and that's okay.",
    "Your best is always enough.",
    "Small steps still move you forward.",
    "You deserve the kindness you give to others.",
    "Today is proof that you're stronger than yesterday.",
    "The people who love you aren't keeping score.",
    "You're not behind. You're on your own timeline.",
    "Breathe. You're exactly where you need to be.",
    "It's okay to outgrow things that once fit you.",
    "Your value isn't measured by your productivity.",
    "You've survived 100% of your worst days so far.",
    "Someone needs exactly the energy you bring.",
    "You are worthy of good things happening to you."
];

// ====================
// Daily Affirmation System
// ====================
function initDailyAffirmation() {
    const vibeText = document.getElementById('vibeText');
    const vibeDate = document.getElementById('vibeDate');
    const vibeShareBtn = document.getElementById('vibeShareBtn');

    if (!vibeText) return;

    const now = new Date();
    const dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000);
    const todayVibe = affirmations[dayOfYear % affirmations.length];

    vibeText.textContent = `"${todayVibe}"`;
    if (vibeDate) vibeDate.textContent = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    vibeShareBtn?.addEventListener('click', async () => {
        const shareText = `✨ Today's Vibe Check: "${todayVibe}" — thevibecheckproject.com`;
        if (navigator.share) {
            try { await navigator.share({ text: shareText }); } catch (e) { }
        } else {
            await navigator.clipboard.writeText(shareText);
            const originalText = vibeShareBtn.textContent;
            vibeShareBtn.textContent = '✅ Copied!';
            setTimeout(() => vibeShareBtn.textContent = originalText, 2000);
        }
    });
}

// ====================
// Email Signup Modal
// ====================
function createEmailModal() {
    if (document.getElementById('email-modal')) return;
    const modalHTML = `
        <div id="email-modal" class="modal-overlay" style="display: none;">
            <div class="modal-content">
                <button class="modal-close" onclick="closeEmailModal()">&times;</button>
                <div class="modal-header">
                    <h2>✨ Get Your Daily Vibe Check</h2>
                    <p>Join thousands receiving daily affirmations. Free, always.</p>
                </div>
                <form id="email-signup-form" class="modal-form">
                    <div class="form-group"><input type="email" id="signup-email" class="form-input" placeholder="your.email@example.com" required /></div>
                    <div class="form-group"><input type="text" id="signup-name" class="form-input" placeholder="Your first name (optional)" /></div>
                    <button type="submit" class="btn btn-primary btn-large btn-block">Start Getting Good Vibes</button>
                    <p class="form-note">No spam, ever. Unsubscribe anytime.</p>
                </form>
                <div id="signup-success" style="display: none;" class="success-message">
                    <div class="success-icon">✨</div>
                    <h3>Welcome to the community!</h3>
                    <p>Check your email for a confirmation link. Your first daily vibe check arrives tomorrow morning.</p>
                    <button class="btn btn-secondary" onclick="closeEmailModal()">Close</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    document.getElementById('email-signup-form').addEventListener('submit', handleEmailSignup);
}

function showEmailModal() {
    const modal = document.getElementById('email-modal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        setTimeout(() => document.getElementById('signup-email').focus(), 100);
    }
}

function closeEmailModal() {
    const modal = document.getElementById('email-modal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

async function handleEmailSignup(e) {
    e.preventDefault();
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Subscribing...';
    submitBtn.disabled = true;

    try {
        const response = await fetch('https://vibe-check-proxy.caseagent72401.workers.dev/', {
            method: 'POST',
            mode: 'cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: document.getElementById('signup-email').value,
                fields: { name: document.getElementById('signup-name').value || 'Friend', signup_source: 'homepage' },
                groups: ['180628908682512348']
            })
        });

        if (response.ok) {
            document.getElementById('email-signup-form').style.display = 'none';
            document.getElementById('signup-success').style.display = 'block';
        } else {
            alert('Something went wrong. Please try again!');
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    } catch (e) {
        alert('Connection error. Please try again!');
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

// ====================
// Static Preview Rotation
// ====================
const previewExamples = {
    'encouragement': { text: '"You\'re doing better than you think you are."', bg: 'linear-gradient(135deg, #11998e, #38ef7d)' },
    'selflove': { text: '"You are entirely enough as you are."', bg: 'url("assets/backgrounds/bg_prem_nebula_1772750433414.webp") center/cover' },
    'anxiety': { text: '"Breathe. You are safe right now."', bg: 'linear-gradient(135deg, #00b4db, #0083b0)' },
    'patience': { text: '"Healing isn\'t linear. You\'re doing it."', bg: 'url("assets/backgrounds/bg_prem_crystal_1772750533689.webp") center/cover' },
    'justbecause': { text: '"Just a reminder that you\'re awesome."', bg: 'linear-gradient(135deg, #f953c6, #b91d73)' },
    'validation': { text: '"I see how hard you\'re trying."', bg: 'url("assets/backgrounds/bg_prem_velvet_1772750498877.webp") center/cover' },
    'birthday': { text: '"I am so incredibly glad you exist."', bg: 'linear-gradient(135deg, #ff6b6b, #ffa500)' },
    'abundance': { text: '"You deserve every good thing coming your way."', bg: 'url("assets/backgrounds/bg_prem_gold_1772750445716.webp") center/cover' },
    'grief': { text: '"There is no rush. Take all the time you need."', bg: 'linear-gradient(135deg, #6b73ff, #9b59b6)' }
};

let previewAutoRotation;
function updateStaticPreview(category, btnElement, isAuto = false) {
    if (!isAuto && previewAutoRotation) clearInterval(previewAutoRotation);
    document.querySelectorAll('.vibe-btn').forEach(btn => btn.classList.remove('active'));
    if (btnElement) btnElement.classList.add('active');

    const data = previewExamples[category];
    if (!data) return;

    const textEl = document.getElementById('staticPreviewQuote');
    const boxEl = document.getElementById('staticPreviewBox');
    const senderEl = document.getElementById('staticPreviewSenderText');
    if (!textEl || !boxEl) return;

    textEl.style.opacity = 0;
    if (senderEl) senderEl.style.opacity = 0;

    setTimeout(() => {
        textEl.textContent = data.text;
        boxEl.style.background = data.bg;
        if (senderEl) {
            const randomSenders = ["Sarah", "Marcus", "Elena", "James", "Aisha", "David", "Chloe", "Someone special", "Mom", "Your Bestie"];
            senderEl.innerHTML = `<strong>${randomSenders[Math.floor(Math.random() * randomSenders.length)]}</strong> wanted to send you some good vibes ✨`;
        }
        textEl.style.opacity = 1;
        if (senderEl) senderEl.style.opacity = 1;
    }, 300);
}

function initPreviewRotation() {
    const rotationKeys = Object.keys(previewExamples);
    let idx = 0;

    function rotate() {
        idx = (idx + 1) % rotationKeys.length;
        const key = rotationKeys[idx];
        const btn = document.querySelector(`.vibe-btn[onclick*="'${key}'"]`);
        updateStaticPreview(key, btn, true);
    }

    // Only run rotation while the section is visible — saves CPU/battery
    const section = document.querySelector('.send-flow-grid');
    if (section && 'IntersectionObserver' in window) {
        const obs = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                if (!previewAutoRotation) previewAutoRotation = setInterval(rotate, 3000);
            } else {
                clearInterval(previewAutoRotation);
                previewAutoRotation = null;
            }
        }, { threshold: 0.2 });
        obs.observe(section);
    } else {
        previewAutoRotation = setInterval(rotate, 3000);
    }
}

// ====================
// Parallax & Features
// ====================
function initParallax() {
    if (window.innerWidth <= 768) return;
    const heroBg = document.getElementById('hero-bg');
    if (!heroBg) return;
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        if (scrolled < window.innerHeight) {
            heroBg.style.transform = `translateY(${scrolled * 0.5}px)`;
        }
    }, { passive: true });
}

function initRotatingLogo() {
    const words = ["Advice", "Guides", "Blogs"];
    const fonts = ["'Pacifico', cursive", "'Caveat', cursive", "'Permanent Marker', cursive"];
    const colors = ["#FEC84A", "#67E8F9", "#FF6B9D"];
    const spans = document.querySelectorAll('.rotating-logo-word');
    if (!spans.length) return;

    let idx = 0;
    setInterval(() => {
        idx = (idx + 1) % words.length;
        spans.forEach(span => {
            span.classList.add('out');
            setTimeout(() => {
                span.textContent = words[idx];
                span.style.fontFamily = fonts[idx];
                span.style.color = colors[idx];
                document.title = `The Vibe Check Project | ${words[idx]}`;
                span.classList.remove('out');
                span.classList.add('in');
            }, 500);
        });
    }, 3000);
}

// ====================
// Live Counters
// ====================
function initLiveCounters() {
    const endpoints = {
        'liveCardCount': 'https://api.counterapi.dev/v1/thevibecheckproject/cards-sent/',
        'liveNewsletterCount': 'https://api.counterapi.dev/v1/thevibecheckproject/newsletters-sent/'
    };

    Object.entries(endpoints).forEach(([id, url]) => {
        const el = document.getElementById(id);
        if (!el) return;

        fetch(url)
            .then(r => r.json())
            .then(data => {
                if (data && typeof data.count === 'number') {
                    el.textContent = data.count.toLocaleString();
                }
            })
            .catch(() => { /* fail silently */ });
    });
}

// ====================
// Scroll Progress Bars
// ====================
function initScrollProgress() {
    const barX = document.getElementById('scroll-progress');
    if (!barX) return;

    // Create vertical bar via JS — no HTML changes needed
    const barY = document.createElement('div');
    barY.id = 'scroll-progress-y';
    document.body.appendChild(barY);

    let ticking = false;
    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(() => {
                const scrolled = window.scrollY;
                const total = document.documentElement.scrollHeight - document.documentElement.clientHeight;
                const pct = total > 0 ? (scrolled / total) * 100 : 0;
                barX.style.width = pct + '%';
                barY.style.height = pct + '%';
                ticking = false;
            });
            ticking = true;
        }
    }, { passive: true });
}

// ====================
// Initialization
// ====================
document.addEventListener('DOMContentLoaded', () => {
    // Core Navigation
    const nav = document.getElementById('nav');
    const hamburger = document.getElementById('nav-hamburger');
    if (nav) {
        window.addEventListener('scroll', () => {
            nav.classList.toggle('scrolled', window.pageYOffset > 50);
        }, { passive: true });
    }
    if (hamburger && nav) {
        hamburger.addEventListener('click', () => {
            const isOpen = nav.classList.toggle('nav-open');
            hamburger.setAttribute('aria-expanded', isOpen);
        });
    }

    // Features
    initScrollProgress();
    initDailyAffirmation();
    initPreviewRotation();
    initRotatingLogo();
    initParallax();
    initLiveCounters();

    // Lazy
    setTimeout(createEmailModal, 1000);

    // CTA Listeners
    document.querySelectorAll('#hero-cta, #cta-button').forEach(btn => {
        btn.addEventListener('click', e => {
            e.preventDefault();
            showEmailModal();
        });
    });
});

window.closeEmailModal = closeEmailModal;
window.updateStaticPreview = updateStaticPreview;

