/* ================================================
   THE VIBE CHECK PROJECT — CORE SCRIPT
   ================================================ */

// ── AFFIRMATIONS DATA ────────────────────────────────
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

// ── CATEGORIZED AFFIRMATIONS REGISTRY ─────────────────
const categorizedAffirmations = {
    all: affirmations,
    grounding: [
        "Rest is not weakness. It is essential restoration.",
        "You don't have to control everything; just breathe through this moment.",
        "Breathe. You are exactly where you need to be.",
        "Small steps on solid ground still move you forward.",
        "Let today be today. You can carry tomorrow when it arrives."
    ],
    energy: [
        "You have survived 100% of your hardest days so far.",
        "You bring an energy into this world that no one else can replicate.",
        "Take up space boldly. Your voice carries genuine weight.",
        "You are capable of navigating hard things with grace.",
        "The momentum is building, even when you can't see the finish line."
    ],
    peace: [
        "It is okay to put your phone down and let the world wait.",
        "You are worthy of quiet moments that ask nothing of you.",
        "Your peace of mind is worth protecting at all costs.",
        "Not every thought deserves your full energy today.",
        "Release what you cannot adjust with your own hands."
    ],
    love: [
        "You deserve the exact gentleness and grace you give to others.",
        "You are enough, exactly in this skin, at this exact moment.",
        "Someone in your circle is deeply thankful you exist.",
        "You don't have to earn your place in people's hearts.",
        "Your worth is not measured by your productivity."
    ]
};

// ── DAILY AFFIRMATION FEATURE (INTERACTIVE VIBE DECK) ──
function initDailyAffirmation() {
    const vibeText = document.getElementById('vibeText');
    const vibeDate = document.getElementById('vibeDate');
    const vibeShareBtn = document.getElementById('vibeShareBtn');
    const vibeShuffleBtn = document.getElementById('vibeShuffleBtn');
    const vibeSendAsCardBtn = document.getElementById('vibeSendAsCardBtn');
    const moodTabs = document.getElementById('vibeMoodTabs');

    if (!vibeText) return;

    let currentMood = 'all';
    const now = new Date();
    const dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000);
    const initialList = categorizedAffirmations.all;
    let currentQuote = initialList[dayOfYear % initialList.length];

    function updateQuote(quote) {
        currentQuote = quote;
        vibeText.classList.add('swapping');
        setTimeout(() => {
            vibeText.textContent = `"${quote}"`;
            vibeText.classList.remove('swapping');
            if (vibeSendAsCardBtn) {
                vibeSendAsCardBtn.href = `send-card.html?msg=${encodeURIComponent(quote)}`;
            }
        }, 180);
    }

    vibeText.textContent = `"${currentQuote}"`;
    if (vibeDate) {
        vibeDate.textContent = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
    if (vibeSendAsCardBtn) {
        vibeSendAsCardBtn.href = `send-card.html?msg=${encodeURIComponent(currentQuote)}`;
    }

    // Mood Selector Tabs
    moodTabs?.addEventListener('click', (e) => {
        const btn = e.target.closest('.vibe-mood-btn');
        if (!btn) return;

        moodTabs.querySelectorAll('.vibe-mood-btn').forEach(b => {
            b.classList.remove('active');
            b.setAttribute('aria-selected', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');

        currentMood = btn.dataset.mood || 'all';
        const pool = categorizedAffirmations[currentMood] || categorizedAffirmations.all;
        const randomItem = pool[Math.floor(Math.random() * pool.length)];
        updateQuote(randomItem);

        if (window.soundEngine?.sparkle) {
            window.soundEngine.sparkle();
        }
    });

    // Shuffle Button Trigger
    vibeShuffleBtn?.addEventListener('click', () => {
        const pool = categorizedAffirmations[currentMood] || categorizedAffirmations.all;
        let nextQuote = pool[Math.floor(Math.random() * pool.length)];
        if (pool.length > 1 && nextQuote === currentQuote) {
            nextQuote = pool[(pool.indexOf(nextQuote) + 1) % pool.length];
        }
        updateQuote(nextQuote);
        if (window.soundEngine?.chime) {
            window.soundEngine.chime();
        }
    });

    // Share / Clipboard Copy Trigger
    vibeShareBtn?.addEventListener('click', async () => {
        const shareText = `✨ Today's Vibe Check: "${currentQuote}" — https://thevibecheckproject.com/`;
        if (navigator.clipboard?.writeText) {
            try {
                await navigator.clipboard.writeText(shareText);
                const originalText = vibeShareBtn.textContent;
                vibeShareBtn.textContent = '✅ Copied!';
                if (typeof showToast === 'function') {
                    showToast('Affirmation copied to clipboard!', '✨');
                }
                setTimeout(() => { vibeShareBtn.textContent = originalText; }, 2000);
            } catch (err) {
                console.warn('Clipboard write failed', err);
            }
        }
    });
}

// ── FAQ ACCORDION COMPONENT ───────────────────────────
function initFaqAccordion() {
    const accordion = document.getElementById('faqAccordion');
    if (!accordion) return;

    accordion.addEventListener('click', (e) => {
        const header = e.target.closest('.faq-question');
        if (!header) return;

        const currentItem = header.closest('.faq-item');
        if (!currentItem) return;
        const isActive = currentItem.classList.contains('active');

        // Close other accordion panels
        accordion.querySelectorAll('.faq-item').forEach(item => {
            item.classList.remove('active');
            item.querySelector('.faq-question')?.setAttribute('aria-expanded', 'false');
        });

        // Toggle current panel
        if (!isActive) {
            currentItem.classList.add('active');
            header.setAttribute('aria-expanded', 'true');
        }
    });
}

// ── EMAIL SIGNUP MODAL ───────────────────────────────
// Shared inline form-error helpers (accessible: role="alert" announces to screen readers)
function showFormError(id, msg) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = msg;
    el.hidden = false;
}
function clearFormError(id) {
    const el = document.getElementById(id);
    if (el) { el.hidden = true; el.textContent = ''; }
}
function createEmailModal() {
    if (document.getElementById('email-modal')) return;
    const modalHTML = `
        <div id="email-modal" class="modal-overlay" style="display: none;" role="dialog" aria-modal="true" aria-labelledby="email-modal-title">
            <div class="modal-content">
                <button class="modal-close" onclick="closeEmailModal()" aria-label="Close signup dialog">&times;</button>
                <div class="modal-header">
                    <h2 id="email-modal-title">✨ Get Your Daily Vibe Check</h2>
                    <p>Join our growing community receiving daily affirmations. Free, always.</p>
                </div>
                <form id="email-signup-form" class="modal-form">
                    <div class="form-group"><input type="email" id="signup-email" class="form-input" placeholder="your.email@example.com" required /></div>
                    <div class="form-group"><input type="text" id="signup-name" class="form-input" placeholder="Your first name (optional)" /></div>
                    <button type="submit" class="btn btn-primary btn-large btn-block">Start Getting Good Vibes</button>
                    <p class="form-error" id="signup-error" role="alert" hidden></p>
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

    // Clicking the overlay (outside the dialog) closes the modal
    const modalEl = document.getElementById('email-modal');
    modalEl.addEventListener('click', (e) => { if (e.target === modalEl) closeEmailModal(); });

    // Escape closes; Tab cycles focus within the dialog (focus trap)
    document.addEventListener('keydown', (e) => {
        const m = document.getElementById('email-modal');
        if (!m || m.style.display === 'none') return;
        if (e.key === 'Escape') { closeEmailModal(); return; }
        if (e.key === 'Tab') {
            const focusables = [...m.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')]
                .filter(el => el.offsetParent !== null);
            if (!focusables.length) return;
            const first = focusables[0], last = focusables[focusables.length - 1];
            if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
            else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        }
    });
}

let emailModalOpener = null;
function showEmailModal() {
    const modal = document.getElementById('email-modal');
    if (modal) {
        emailModalOpener = document.activeElement;
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
        if (emailModalOpener && document.contains(emailModalOpener)) emailModalOpener.focus();
        emailModalOpener = null;
    }
}

async function handleEmailSignup(e) {
    e.preventDefault();
    clearFormError('signup-error');
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
            showFormError('signup-error', 'Something went wrong. Please try again!');
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    } catch (e) {
        showFormError('signup-error', 'Connection error. Please check your connection and try again!');
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

// ── INLINE JOIN-SECTION SIGNUP ────────────────────────
// Same list as the modal, but a visible form for visitors who never open the popup.
function initJoinForm() {
    const form = document.getElementById('join-form');
    if (!form) return;
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearFormError('join-error');
        const emailInput = document.getElementById('join-email');
        const submitBtn = document.getElementById('join-submit');
        const email = (emailInput.value || '').trim();
        if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
            emailInput.focus();
            emailInput.style.borderColor = '#ef4444';
            showFormError('join-error', 'Please enter a valid email address.');
            return;
        }
        emailInput.style.borderColor = '';
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Joining...';
        submitBtn.disabled = true;

        try {
            const response = await fetch('https://vibe-check-proxy.caseagent72401.workers.dev/', {
                method: 'POST',
                mode: 'cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    fields: { name: 'Friend', signup_source: 'homepage-join-section' },
                    groups: ['180628908682512348']
                })
            });

            if (response.ok) {
                form.style.display = 'none';
                document.getElementById('join-success').style.display = 'block';
            } else {
                showFormError('join-error', 'Something went wrong. Please try again!');
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        } catch (err) {
            showFormError('join-error', 'Connection error. Please check your connection and try again!');
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    });
}

// ── INTERACTIVE CARD DEMO ─────────────────────────────
const demoVibes = {
    encouragement: {
        quote: '"You\'re doing better than you think you are."',
        bg: 'url("assets/backgrounds/bg_prem_emerald_1772750461402.webp") center/cover',
        isVideo: false,
        glow: 'linear-gradient(135deg, #052e16 0%, #166534 100%)',
        wash: 'rgba(22, 101, 52, 0.12)',
        sender: 'Your biggest fan'
    },
    calm: {
        quote: '"Breathe. You are safe right now."',
        videoSrc: 'assets/backgrounds/animated_ethereal.mp4',
        isVideo: true,
        glow: 'linear-gradient(135deg, #2e1065 0%, #6d28d9 100%)',
        wash: 'rgba(109, 40, 217, 0.1)',
        sender: 'Someone who cares'
    },
    celebrate: {
        quote: '"All your hard work is paying off!"',
        videoSrc: 'assets/backgrounds/animated_vibrant.mp4',
        isVideo: true,
        glow: 'linear-gradient(135deg, #451a03 0%, #b45309 100%)',
        wash: 'rgba(180, 83, 9, 0.1)',
        sender: 'Your biggest cheerleader'
    },
    love: {
        quote: '"You are deeply, profoundly loved."',
        bg: 'url("assets/backgrounds/bg_prem_cherry_1772750510659.webp") center/cover',
        isVideo: false,
        glow: 'linear-gradient(135deg, #4c0519 0%, #9f1239 100%)',
        wash: 'rgba(159, 18, 57, 0.11)',
        sender: 'Someone special ✨'
    },
    healing: {
        quote: '"There is no timeline for healing."',
        bg: 'url("assets/backgrounds/bg_prem_nebula_1772750433414.webp") center/cover',
        isVideo: false,
        glow: 'linear-gradient(135deg, #09090b 0%, #3b0764 100%)',
        wash: 'rgba(88, 28, 135, 0.12)',
        sender: 'A friend'
    },
    selflove: {
        quote: '"You are entirely enough as you are."',
        videoSrc: 'assets/backgrounds/animated_modern.mp4',
        isVideo: true,
        glow: 'linear-gradient(135deg, #0c1445 0%, #1e3a8a 100%)',
        wash: 'rgba(30, 58, 138, 0.1)',
        sender: 'Someone who sees you'
    }
};

let demoRotationTimer = null;
let demoIsHovered = false;
let demoIsFlipping = false;
let currentVibe = 'encouragement';

const demoParticleColors = {
    encouragement: ['rgba(52,211,153,ALPHA)', 'rgba(167,243,208,ALPHA)'],
    calm: ['rgba(196,181,253,ALPHA)', 'rgba(233,213,255,ALPHA)'],
    celebrate: ['rgba(251,191,36,ALPHA)', 'rgba(253,230,138,ALPHA)'],
    love: ['rgba(251,113,133,ALPHA)', 'rgba(255,182,193,ALPHA)'],
    healing: ['rgba(167,139,250,ALPHA)', 'rgba(216,180,254,ALPHA)'],
    selflove: ['rgba(147,197,253,ALPHA)', 'rgba(224,242,254,ALPHA)'],
};

function switchDemoVibe(vibe, skipRotationReset) {
    if (demoIsFlipping) return;
    const data = demoVibes[vibe];
    if (!data) return;

    currentVibe = vibe;
    document.querySelectorAll('.demo-pill').forEach(p => p.classList.toggle('active', p.dataset.vibe === vibe));

    const card = document.getElementById('demoCard');
    const bg = document.getElementById('demoBg');
    const quote = document.getElementById('demoQuote');
    const sender = document.getElementById('demoSender');
    const shimmer = document.getElementById('demoShimmer');
    const glow = document.getElementById('demoGlow');
    const section = document.querySelector('.send-card-section');

    if (!card || !bg || !quote) return;
    if (glow) glow.style.background = data.glow;
    if (section) section.style.setProperty('--vibe-wash', data.wash);
    if (window._demoUpdateParticles) window._demoUpdateParticles(vibe);

    // ── 3D card flip ─────────────────────────────────────────
    demoIsFlipping = true;

    // Phase 1: flip to edge (Zero-Reflow pattern)
    card.classList.remove('flip-in');
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            card.classList.add('flip-out');
        });
    });

    setTimeout(() => {
        // At edge — swap background invisibly
        const video = document.getElementById('demoBgVideo');
        if (data.isVideo && video) {
            bg.style.background = '#000';
            video.style.display = 'block';
            if (video.getAttribute('data-src') !== data.videoSrc) {
                video.setAttribute('data-src', data.videoSrc);
                video.src = data.videoSrc;
                video.play().catch(() => { });
            }
        } else {
            if (video) { video.style.display = 'none'; video.pause(); }
            bg.style.background = data.bg;
        }
        quote.textContent = data.quote;
        if (sender) sender.textContent = data.sender;

        // Phase 2: flip back in (Zero-Reflow pattern)
        card.classList.remove('flip-out');
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                card.classList.add('flip-in');
            });
        });

        // Shimmer sweep on landing
        if (shimmer) {
            shimmer.classList.remove('sweep');
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    shimmer.classList.add('sweep');
                });
            });
            setTimeout(() => shimmer.classList.remove('sweep'), 700);
        }

        setTimeout(() => {
            card.classList.remove('flip-in');
            demoIsFlipping = false;
        }, 210);
    }, 205);

    if (!skipRotationReset) startDemoRotation();
}

function startDemoRotation() {
    clearInterval(demoRotationTimer);
    if (demoIsHovered) return;
    const vibeKeys = Object.keys(demoVibes);
    demoRotationTimer = setInterval(() => {
        if (demoIsHovered) return;
        const next = vibeKeys[(vibeKeys.indexOf(currentVibe) + 1) % vibeKeys.length];
        switchDemoVibe(next, true);
    }, 3800);
}

function initCardDemo() {
    const stage = document.getElementById('demoStage');
    const card = document.getElementById('demoCard');
    const pills = document.getElementById('demoPills');
    if (!stage || !card) return;

    // Initial state
    const initData = demoVibes[currentVibe];
    const initBg = document.getElementById('demoBg');
    const initVideo = document.getElementById('demoBgVideo');
    const initGlow = document.getElementById('demoGlow');
    const initSection = document.querySelector('.send-card-section');

    if (initData.isVideo && initVideo) {
        if (initBg) initBg.style.background = '#000';
        initVideo.style.display = 'block';
        initVideo.src = initData.videoSrc;
        initVideo.setAttribute('data-src', initData.videoSrc);
        initVideo.play().catch(() => { });
    } else if (initBg) {
        initBg.style.background = initData.bg;
    }
    if (initGlow) initGlow.style.background = initData.glow;
    if (initSection) initSection.style.setProperty('--vibe-wash', initData.wash);

    if (pills) {
        pills.querySelectorAll('.demo-pill').forEach(pill => {
            pill.addEventListener('click', () => {
                clearInterval(demoRotationTimer);
                switchDemoVibe(pill.dataset.vibe, true);
                clearTimeout(pill._resumeTimer);
                pill._resumeTimer = setTimeout(startDemoRotation, 8000);
            });
        });
    }

    // 3D Tilt Logic
    if (window.innerWidth > 768) {
        let tiltX = 0, tiltY = 0, targetX = 0, targetY = 0;
        let tiltRaf = null;

        function tickTilt() {
            tiltX += (targetX - tiltX) * 0.09;
            tiltY += (targetY - tiltY) * 0.09;
            const dist = Math.abs(tiltX - targetX) + Math.abs(tiltY - targetY);

            card.style.transform = `rotateY(${tiltX}deg) rotateX(${-tiltY}deg)`;

            if (dist > 0.05) {
                tiltRaf = requestAnimationFrame(tickTilt);
            } else {
                tiltRaf = null;
                if (!demoIsHovered) card.style.transform = '';
            }
        }

        stage.addEventListener('mouseenter', () => {
            demoIsHovered = true;
            card.classList.add('is-tilting');
            clearInterval(demoRotationTimer);
        });

        stage.addEventListener('mousemove', (e) => {
            if (demoIsFlipping) return;
            const r = stage.getBoundingClientRect();
            targetX = ((e.clientX - r.left - r.width / 2) / (r.width / 2)) * 16;
            targetY = ((e.clientY - r.top - r.height / 2) / (r.height / 2)) * 12;
            if (!tiltRaf) tiltRaf = requestAnimationFrame(tickTilt);

            // Holo effect
            const holo = document.getElementById('demoHolo');
            if (holo) {
                const mx = ((e.clientX - r.left) / r.width) * 100;
                const my = ((e.clientY - r.top) / r.height) * 100;
                holo.style.background = `radial-gradient(ellipse at ${mx}% ${my}%, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.06) 35%, transparent 65%)`;
                holo.style.animation = 'none';
            }
        }, { passive: true });

        stage.addEventListener('mouseleave', () => {
            demoIsHovered = false;
            targetX = 0; targetY = 0;
            if (!tiltRaf) tiltRaf = requestAnimationFrame(tickTilt);
            const holo = document.getElementById('demoHolo');
            if (holo) { holo.style.background = ''; holo.style.animation = ''; }
            setTimeout(() => {
                card.classList.remove('is-tilting');
                startDemoRotation();
            }, 500);
        });
    }

    // Intersection observer for demo rotation
    const wrapper = document.querySelector('.card-demo-wrapper');
    if (wrapper && 'IntersectionObserver' in window) {
        new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) startDemoRotation();
            else clearInterval(demoRotationTimer);
        }, { threshold: 0.2 }).observe(wrapper);
    } else {
        startDemoRotation();
    }

    initDemoParticles();
}

function initDemoParticles() {
    const canvas = document.getElementById('demoCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const COUNT = isMobile ? 18 : 32;

    function resize() {
        canvas.width = canvas.offsetWidth || 900;
        canvas.height = canvas.offsetHeight || 700;
    }
    resize();
    window.addEventListener('resize', resize, { passive: true });

    let vibeAccents = (demoParticleColors[currentVibe] || demoParticleColors.encouragement).map(c => c.replace('ALPHA', '1'));
    window._demoUpdateParticles = function (vibe) {
        vibeAccents = (demoParticleColors[vibe] || demoParticleColors.encouragement).map(c => c.replace('ALPHA', '1'));
    };

    function makeParticle() {
        return {
            x: 20 + Math.random() * (canvas.width - 40),
            y: canvas.height * 0.2 + Math.random() * canvas.height * 0.65,
            size: 1.5 + Math.random() * 3.5,
            maxOp: 0.15 + Math.random() * 0.55,
            opacity: 0,
            vx: (Math.random() - 0.5) * 0.35,
            vy: -(0.3 + Math.random() * 0.7),
            phase: Math.random() * Math.PI * 2,
            life: Math.floor(Math.random() * 160),
            maxLife: 130 + Math.floor(Math.random() * 160),
            colorIdx: Math.random() < 0.5 ? 0 : 1,
            type: Math.random() < 0.6 ? 'cross' : 'dot',
        };
    }

    const particles = Array.from({ length: COUNT }, makeParticle);

    function drawCross(x, y, r, color, alpha) {
        ctx.save(); ctx.globalAlpha = alpha; ctx.strokeStyle = color; ctx.lineWidth = 1.2; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(x - r, y); ctx.lineTo(x + r, y); ctx.moveTo(x, y - r); ctx.lineTo(x, y + r); ctx.stroke();
        const d = r * 0.55;
        ctx.beginPath(); ctx.moveTo(x - d, y - d); ctx.lineTo(x + d, y + d); ctx.moveTo(x + d, y - d); ctx.lineTo(x - d, y + d); ctx.stroke();
        ctx.restore();
    }

    function drawDot(x, y, r, color, alpha) {
        ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    }

    let rafId;
    function tick() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach((p, i) => {
            p.life++;
            p.x += p.vx + Math.sin(p.phase + p.life * 0.018) * 0.28;
            p.y += p.vy;
            p.phase += 0.012;
            const t = p.life / p.maxLife;
            p.opacity = t < 0.2 ? (t / 0.2) * p.maxOp : t > 0.75 ? ((1 - t) / 0.25) * p.maxOp : p.maxOp;
            const col = vibeAccents[p.colorIdx] || vibeAccents[0];
            if (p.type === 'cross') drawCross(p.x, p.y, p.size, col, p.opacity);
            else drawDot(p.x, p.y, p.size * 0.7, col, p.opacity);
            if (p.life >= p.maxLife || p.y < -20) {
                particles[i] = makeParticle(); particles[i].y = canvas.height - 10 + Math.random() * 40; particles[i].life = 0;
            }
        });
        rafId = requestAnimationFrame(tick);
    }

    if ('IntersectionObserver' in window) {
        new IntersectionObserver(entries => {
            if (entries[0].isIntersecting) { if (!rafId) rafId = requestAnimationFrame(tick); }
            else { cancelAnimationFrame(rafId); rafId = null; }
        }, { threshold: 0.1 }).observe(canvas);
    } else {
        rafId = requestAnimationFrame(tick);
    }
}

// ── UTILITIES ────────────────────────────────────────
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

function initLiveCounters() {
    const endpoints = {
        'liveCardCount': 'https://api.counterapi.dev/v1/thevibecheckproject/cards-sent/',
        'liveNewsletterCount': 'https://api.counterapi.dev/v1/thevibecheckproject/newsletters-sent/'
    };
    Object.entries(endpoints).forEach(([id, url]) => {
        const el = document.getElementById(id);
        if (!el) return;
        fetch(url).then(r => r.json()).then(data => {
            if (data && typeof data.count === 'number') el.textContent = data.count.toLocaleString();
        }).catch(() => { });
    });
}

function initScrollProgress() {
    const barX = document.getElementById('scroll-progress');
    if (!barX) return;
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

// ── INITIALIZATION ───────────────────────────────────
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

    // Scroll reveal for .reveal / .reveal-left / .reveal-right elements
    const revealEls = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');
    if (revealEls.length && 'IntersectionObserver' in window) {
        const revObs = new IntersectionObserver(entries => {
            entries.forEach(e => {
                if (e.isIntersecting) {
                    e.target.classList.add('active');
                    revObs.unobserve(e.target);
                }
            });
        }, { threshold: 0.01, rootMargin: '0px' });
        revealEls.forEach(el => revObs.observe(el));

        // Safety fallback for mobile or slow renderers
        setTimeout(() => {
            revealEls.forEach(el => {
                if (!el.classList.contains('active')) {
                    const rect = el.getBoundingClientRect();
                    if (rect.top < window.innerHeight && rect.bottom > 0) {
                        el.classList.add('active');
                    }
                }
            });
        }, 2000);
    } else {
        // Fallback: just make everything visible
        revealEls.forEach(el => el.classList.add('active'));
    }

    // Critical Features
    initScrollProgress();
    initDailyAffirmation();
    initCardDemo();
    initJoinForm();
    initFaqAccordion();

    // Non-critical features deferred to 3s after load for Lighthouse performance
    setTimeout(() => {
        initRotatingLogo();
        initParallax();
        initLiveCounters();
        createEmailModal();
    }, 3000);

    // CTA Listeners
    document.querySelectorAll('#hero-cta').forEach(btn => {
        btn.addEventListener('click', e => {
            e.preventDefault();
            const modal = document.getElementById('email-modal');
            if (modal) showEmailModal();
            else { createEmailModal(); showEmailModal(); }
        });
    });
});

window.closeEmailModal = closeEmailModal;
window.updateStaticPreview = function () { };
