/**
 * THE VIBE CHECK — Core Utilities
 * Centralized logic for shared UI components, sound engine, and animations.
 */

// ── Global Constants ──
const isMobile = window.matchMedia('(max-width: 768px)').matches;

// ── Toast Notification System ──
let toastTimer = null;
function showToast(message, icon) {
    let toast = document.getElementById('vibeToast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'vibeToast';
        toast.className = 'vibe-toast';
        toast.innerHTML = '<span class="toast-icon"></span><span class="toast-msg"></span>';
        document.body.appendChild(toast);
    }
    toast.querySelector('.toast-icon').textContent = icon;
    toast.querySelector('.toast-msg').textContent = message;
    toast.classList.add('visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('visible'), 3200);
}

// ── Sound Engine (Web Audio API synthesized sounds) ──
const soundEngine = {
    _ctx() { 
        if (!this.context) {
            this.context = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.context && this.context.state === 'suspended') {
            this.context.resume().catch(() => {});
        }
        return this.context;
    },
    _tone(ctx, freq, start, dur, vol = 0.08, type = 'sine') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(vol, ctx.currentTime + start);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + start);
        osc.stop(ctx.currentTime + start + dur + 0.1);
    },
    chime() {
        const ctx = this._ctx();
        [523.25, 659.25, 783.99].forEach((f, i) => this._tone(ctx, f, i * 0.1, 1.2));
    },
    bell() {
        const ctx = this._ctx();
        [440, 880, 1320, 1760].forEach((f, i) => this._tone(ctx, f, 0, 2 - i * 0.3, 0.06 / (i + 1)));
    },
    sparkle() {
        const ctx = this._ctx();
        [1318, 1174, 1046, 987, 880].forEach((f, i) => this._tone(ctx, f, i * 0.08, 0.6, 0.05, 'triangle'));
    },
    musicbox() {
        const ctx = this._ctx();
        [659, 784, 880, 784, 659, 523, 659].forEach((f, i) => this._tone(ctx, f, i * 0.2, 0.5, 0.06, 'triangle'));
    },
    harp() {
        const ctx = this._ctx();
        [261, 329, 392, 523, 659, 784, 1046].forEach((f, i) => this._tone(ctx, f, i * 0.1, 1.5, 0.05));
    },
    piano() {
        const ctx = this._ctx();
        [[261, 329, 392], [349, 440, 523]].forEach((chord, ci) => {
            chord.forEach(f => this._tone(ctx, f, ci * 0.6, 1.8, 0.06));
        });
    },
    celebration() {
        const ctx = this._ctx();
        [523, 659, 784, 1046, 784, 1046, 1318].forEach((f, i) => this._tone(ctx, f, i * 0.12, 0.4, 0.07, 'square'));
    },
    ocean() {
        const ctx = this._ctx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        osc.type = 'sine'; osc.frequency.value = 220;
        lfo.type = 'sine'; lfo.frequency.value = 0.3;
        lfoGain.gain.value = 100;
        lfo.connect(lfoGain); lfoGain.connect(osc.frequency);
        gain.gain.setValueAtTime(0.06, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 3);
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(); lfo.start();
        osc.stop(ctx.currentTime + 3.5); lfo.stop(ctx.currentTime + 3.5);
    },
    play(soundId) {
        try {
            if (this[soundId]) {
                this[soundId]();
            } else {
                this.chime();
            }
        } catch (e) {
            console.warn("Sound playback failed", e);
        }
    }
};

// ── Particle & Confetti Animations ──
function launchConfetti() {
    const colors = ['#cdff60', '#f472b6', '#60a5fa', '#fbbf24', '#c084fc', '#34d399', '#fb7185'];
    const count = isMobile ? 20 : 50;
    const frag = document.createDocumentFragment();
    for (let i = 0; i < count; i++) {
        const piece = document.createElement('div');
        piece.className = 'confetti-piece';
        piece.style.left = Math.random() * 100 + 'vw';
        piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        piece.style.animationDuration = (Math.random() * 2 + 1.5) + 's';
        piece.style.animationDelay = (Math.random() * 0.5) + 's';
        piece.style.width = (Math.random() * 8 + 6) + 'px';
        piece.style.height = (Math.random() * 8 + 6) + 'px';
        piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
        frag.appendChild(piece);
    }
    document.body.appendChild(frag);
    setTimeout(() => document.querySelectorAll('.confetti-piece').forEach(p => p.remove()), 4000);
}

function burstParticles(count) {
    const container = document.getElementById('particles');
    if (!container) return;
    
    // Ambient particles (count around 15) are skipped on mobile to save performance
    if (isMobile && count <= 15) return;

    const frag = document.createDocumentFragment();
    const actualCount = isMobile ? Math.floor(count / 2) : count;
    for (let i = 0; i < actualCount; i++) {
        const p = document.createElement('div');
        p.className = 'particle';
        p.style.left = Math.random() * 100 + '%';
        p.style.animationDelay = (Math.random() * 2) + 's';
        p.style.animationDuration = (Math.random() * 6 + 6) + 's';
        frag.appendChild(p);
    }
    container.appendChild(frag);
    
    // Auto-clean if this was a burst, otherwise let it stay (ambient)
    if (count > 15) {
        setTimeout(() => { container.innerHTML = ''; }, 12000);
    }
}

// ── Premium Unlock (Stripe return) ──
// Runs on every page via core-utils so buyers are unlocked no matter which
// page Stripe redirects them to after payment (?premium=1).
(function handlePremiumReturn() {
    try {
        const params = new URLSearchParams(window.location.search);
        if (params.get('premium') !== '1') return;
        localStorage.setItem('premium_unlocked', '1');
        window.history.replaceState({}, document.title, window.location.pathname);
        const badge = document.createElement('div');
        badge.textContent = '✦ Premium Unlocked';
        badge.style.cssText = 'position:fixed;top:12px;right:12px;background:#6c63ff;color:white;padding:6px 12px;border-radius:20px;font-size:12px;z-index:9999;font-weight:bold;box-shadow:0 4px 12px rgba(108,99,255,0.4);';
        const show = () => document.body.appendChild(badge);
        if (document.body) show();
        else document.addEventListener('DOMContentLoaded', show);
        setTimeout(() => {
            badge.style.transition = 'opacity 0.5s';
            badge.style.opacity = '0';
            setTimeout(() => badge.remove(), 500);
        }, 4000);
    } catch (e) { /* unlock is best-effort */ }
})();

// ── Mobile nav toggle with accessible focus trap ──
(function initMobileNav() {
    const btn = document.getElementById('nav-hamburger');
    const nav = document.getElementById('nav');
    if (!btn || !nav) return;

    let previouslyFocused = null;

    const getFocusable = () => {
        return Array.from(nav.querySelectorAll('a[href], button:not([disabled]), [tabindex="0"]'))
            .filter(el => el.offsetWidth > 0 || el.offsetHeight > 0 || el === btn);
    };

    const handleNavKeydown = (e) => {
        if (e.key === 'Escape') {
            close();
            return;
        }
        if (e.key === 'Tab') {
            const focusables = getFocusable();
            if (!focusables.length) return;
            const first = focusables[0];
            const last = focusables[focusables.length - 1];

            if (e.shiftKey) {
                if (document.activeElement === first) {
                    e.preventDefault();
                    last.focus();
                }
            } else {
                if (document.activeElement === last) {
                    e.preventDefault();
                    first.focus();
                }
            }
        }
    };

    const close = () => {
        nav.classList.remove('menu-open', 'nav-open');
        btn.setAttribute('aria-expanded', 'false');
        document.removeEventListener('keydown', handleNavKeydown);
        if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
            previouslyFocused.focus();
            previouslyFocused = null;
        }
    };

    const openMenu = () => {
        previouslyFocused = document.activeElement;
        nav.classList.add('menu-open', 'nav-open');
        btn.setAttribute('aria-expanded', 'true');
        document.addEventListener('keydown', handleNavKeydown);
        const firstLink = nav.querySelector('.nav-links a');
        if (firstLink) firstLink.focus();
    };

    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = nav.classList.contains('nav-open') || nav.classList.contains('menu-open');
        if (isOpen) {
            close();
        } else {
            openMenu();
        }
    });

    document.addEventListener('click', (e) => { if (!nav.contains(e.target)) close(); });
    nav.querySelectorAll('.nav-links a').forEach((a) => a.addEventListener('click', close));
    // Never restore the page with the menu stuck open (back/forward cache).
    window.addEventListener('pagehide', close);
    window.addEventListener('pageshow', close);
})();

// ========================================================
// ── UNIVERSAL DUAL THEME CONTROLLER (Warm vs Kinetic) ──
// ========================================================
(function initGlobalThemeController() {
    function getStoredTheme() {
        try {
            return localStorage.getItem('vibe_theme_concept') || localStorage.getItem('vibe_design_concept') || 'editorial';
        } catch (e) {
            return 'editorial';
        }
    }

    function applyTheme(themeName, trackEvent = false) {
        const theme = (themeName === 'kinetic') ? 'kinetic' : 'editorial';
        document.documentElement.setAttribute('data-design-concept', theme);
        if (document.body) {
            document.body.setAttribute('data-design-concept', theme);
        }

        try {
            localStorage.setItem('vibe_theme_concept', theme);
            localStorage.setItem('vibe_design_concept', theme);
        } catch (e) { }

        // Update switcher buttons across any header nav
        const btnEditorial = document.getElementById('btnThemeEditorial');
        const btnKinetic = document.getElementById('btnThemeKinetic');
        if (btnEditorial && btnKinetic) {
            if (theme === 'editorial') {
                btnEditorial.classList.add('active');
                btnEditorial.setAttribute('aria-pressed', 'true');
                btnKinetic.classList.remove('active');
                btnKinetic.setAttribute('aria-pressed', 'false');
            } else {
                btnKinetic.classList.add('active');
                btnKinetic.setAttribute('aria-pressed', 'true');
                btnEditorial.classList.remove('active');
                btnEditorial.setAttribute('aria-pressed', 'false');
            }
        }

        // Homepage hero updates if present
        const titleMain = document.querySelector('.hero-title-main');
        const titleGradient = document.querySelector('.hero-title-gradient');
        const tagBadge = document.querySelector('.hero-tag-badge');
        if (titleMain && titleGradient) {
            if (theme === 'kinetic') {
                titleMain.textContent = "Drop Good Vibes.";
                titleGradient.textContent = "Zero Awkwardness.";
                if (tagBadge) tagBadge.textContent = "⚡ 100% Free · Anonymous · No Sign-Up";
            } else {
                titleMain.textContent = "Words that lift.";
                titleGradient.textContent = "Moments that matter.";
                if (tagBadge) tagBadge.textContent = "✨ Anonymous Affirmations & Vibe Checks";
            }
        }

        if (trackEvent && window.VibeTelemetry) {
            window.VibeTelemetry.track('theme_switched', { theme: theme });
        }
    }

    function wireThemeListeners() {
        const toggleBtn = document.getElementById('themeToggleBtn');
        const btnEditorial = document.getElementById('btnThemeEditorial');
        const btnKinetic = document.getElementById('btnThemeKinetic');

        if (toggleBtn && !toggleBtn._themeWired) {
            toggleBtn._themeWired = true;
            toggleBtn.addEventListener('click', (e) => {
                const specificSegment = e.target.closest('[data-theme]');
                const currentTheme = document.documentElement.getAttribute('data-design-concept') || 'editorial';
                let nextTheme;
                if (specificSegment) {
                    const clickedTheme = specificSegment.getAttribute('data-theme');
                    nextTheme = (clickedTheme === currentTheme) ? (currentTheme === 'editorial' ? 'kinetic' : 'editorial') : clickedTheme;
                } else {
                    nextTheme = currentTheme === 'editorial' ? 'kinetic' : 'editorial';
                }
                applyTheme(nextTheme, true);
            });
        } else if (!toggleBtn) {
            if (btnEditorial && !btnEditorial._themeWired) {
                btnEditorial._themeWired = true;
                btnEditorial.addEventListener('click', () => applyTheme('editorial', true));
            }
            if (btnKinetic && !btnKinetic._themeWired) {
                btnKinetic._themeWired = true;
                btnKinetic.addEventListener('click', () => applyTheme('kinetic', true));
            }
        }
    }

    // Apply immediately on script execution to avoid flash of unstyled theme
    applyTheme(getStoredTheme(), false);

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            applyTheme(getStoredTheme(), false);
            wireThemeListeners();
        });
    } else {
        wireThemeListeners();
    }

    window.applyThemeConcept = applyTheme;
    window.initThemeConcept = wireThemeListeners;
})();

// ========================================================
// ── APEX TELEMETRY & EXPERIMENTATION ENGINE (VibeTelemetry) ──
// ========================================================
const VibeTelemetry = (function () {
    const _eventQueue = [];
    let _clarityReady = typeof window.clarity === 'function';

    function _flushQueue() {
        if (typeof window.clarity !== 'function') return;
        _clarityReady = true;
        while (_eventQueue.length > 0) {
            const item = _eventQueue.shift();
            try {
                if (item.type === 'event') {
                    window.clarity('event', item.name);
                } else if (item.type === 'tag') {
                    window.clarity('set', item.key, String(item.val));
                }
            } catch (err) {
                // Fail silently to never affect UX
            }
        }
    }

    // Monitor for clarity initialization
    if (!_clarityReady) {
        const clarityCheckTimer = setInterval(() => {
            if (typeof window.clarity === 'function') {
                clearInterval(clarityCheckTimer);
                _flushQueue();
            }
        }, 200);
        setTimeout(() => clearInterval(clarityCheckTimer), 10000); // 10s safety max
    }

    return {
        track(eventName, meta = {}) {
            try {
                if (typeof window.clarity === 'function') {
                    window.clarity('event', eventName);
                    // Also attach key event metadata as tags when relevant
                    if (meta && typeof meta === 'object') {
                        Object.keys(meta).forEach(k => {
                            if (meta[k] !== undefined && meta[k] !== null) {
                                window.clarity('set', `${eventName}_${k}`, String(meta[k]));
                            }
                        });
                    }
                } else {
                    _eventQueue.push({ type: 'event', name: eventName });
                    if (meta && typeof meta === 'object') {
                        Object.keys(meta).forEach(k => {
                            if (meta[k] !== undefined && meta[k] !== null) {
                                _eventQueue.push({ type: 'tag', key: `${eventName}_${k}`, val: String(meta[k]) });
                            }
                        });
                    }
                }
            } catch (e) { }
        },

        setTag(key, value) {
            try {
                if (typeof window.clarity === 'function') {
                    window.clarity('set', key, String(value));
                } else {
                    _eventQueue.push({ type: 'tag', key: key, val: String(value) });
                }
            } catch (e) { }
        },

        getQueueSize() {
            return _eventQueue.length;
        }
    };
})();

// ── PERSISTENT A/B TESTING ENGINE (VibeAB) ──
const VibeAB = (function () {
    return {
        getVariant(testName, variants, defaultVariant = null) {
            if (!Array.isArray(variants) || variants.length === 0) {
                return defaultVariant;
            }
            const storageKey = `vibe_ab_${testName}`;
            let assigned = null;
            try {
                assigned = localStorage.getItem(storageKey);
            } catch (e) { }

            if (!assigned || !variants.includes(assigned)) {
                const randomIndex = Math.floor(Math.random() * variants.length);
                assigned = variants[randomIndex];
                try {
                    localStorage.setItem(storageKey, assigned);
                } catch (e) { }
            }

            // Sync with Clarity tag
            VibeTelemetry.setTag(`ab_${testName}`, assigned);
            return assigned;
        }
    };
})();

// ── PASSIVE SCROLL-DEPTH & OUTBOUND TELEMETRY ──
(function initGlobalPassiveTelemetry() {
    if (typeof window === 'undefined') return;

    // Track initial page context
    const path = window.location.pathname.split('/').pop() || 'index.html';
    VibeTelemetry.setTag('page_view', path);
    VibeTelemetry.track('page_loaded', { path: path });

    // Passive Scroll Depth Telemetry (25%, 50%, 75%, 90%)
    const thresholds = [25, 50, 75, 90];
    const reachedThresholds = new Set();

    let scrollScheduled = false;
    function checkScrollDepth() {
        scrollScheduled = false;
        const h = document.documentElement;
        const b = document.body;
        const scrollTop = h.scrollTop || b.scrollTop;
        const scrollHeight = (h.scrollHeight || b.scrollHeight) - h.clientHeight;
        if (scrollHeight <= 0) return;

        const percent = Math.round((scrollTop / scrollHeight) * 100);
        thresholds.forEach(t => {
            if (percent >= t && !reachedThresholds.has(t)) {
                reachedThresholds.add(t);
                VibeTelemetry.track('scroll_depth', { depth: `${t}%`, path: path });
                VibeTelemetry.setTag(`scroll_${t}`, 'true');
            }
        });
    }

    window.addEventListener('scroll', () => {
        if (!scrollScheduled) {
            scrollScheduled = true;
            window.requestAnimationFrame(checkScrollDepth);
        }
    }, { passive: true });

    // Delegated Outbound Click Telemetry (Stripe, Ko-fi, External Links)
    document.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (!link || !link.href) return;

        const href = link.href;
        if (href.includes('buy.stripe.com')) {
            VibeTelemetry.track('stripe_checkout_click', {
                source_page: path,
                url: href
            });
            VibeTelemetry.setTag('monetization_intent', 'stripe_click');
        } else if (href.includes('ko-fi.com')) {
            VibeTelemetry.track('kofi_tip_click', {
                source_page: path,
                url: href
            });
            VibeTelemetry.setTag('monetization_intent', 'kofi_click');
        } else if (link.getAttribute('href') === 'send-card.html' || href.includes('send-card.html')) {
            VibeTelemetry.track('send_card_intent', {
                source_page: path,
                button_text: (link.textContent || '').trim().substring(0, 30)
            });
        }
    }, { passive: true });
})();

// ── Global Window Exports ──
window.soundEngine = soundEngine;
window.showToast = showToast;
window.launchConfetti = launchConfetti;
window.burstParticles = burstParticles;
window.isMobile = isMobile;
window.VibeTelemetry = VibeTelemetry;
window.VibeAB = VibeAB;

