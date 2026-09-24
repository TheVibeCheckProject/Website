/**
 * THE VIBE CHECK — Core Utilities
 * Centralized logic for shared UI components, sound engine, and animations.
 */

// ── Global Constants ──
const isMobile = window.matchMedia('(max-width: 768px)').matches;

// ── Toast Notification System ──
let toastTimer = null;
function showToast(message, icon, durationMs = 3200) {
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
    toastTimer = setTimeout(() => toast.classList.remove('visible'), durationMs);
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

// ── Counters & read receipts ──
// Backed by our own Cloudflare Worker (workers/counter.js). counterapi.dev v1,
// which this used to call, was shut down (HTTP 410). Leave the URL empty to disable all
// counter traffic; pages then show their static fallback numbers.
const VIBE_COUNTER_URL = 'https://vibe-counter.caseagent72401.workers.dev';

const VibeCounter = {
    enabled: !!VIBE_COUNTER_URL,
    _name(name) {
        return String(name).toLowerCase().replace(/[^a-z0-9_:-]/g, '').slice(0, 64);
    },
    /** Fire-and-forget increment. */
    hit(name) {
        if (!this.enabled) return;
        try {
            fetch(`${VIBE_COUNTER_URL}/hit/${this._name(name)}`, { method: 'POST', keepalive: true, mode: 'cors' }).catch(() => { });
        } catch (e) { }
    },
    /** Resolves to { name: count } for the requested names, or null when unavailable. */
    async getMany(names, timeoutMs = 4000) {
        if (!this.enabled || !names.length) return null;
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);
        try {
            const qs = names.map(n => this._name(n)).join(',');
            const res = await fetch(`${VIBE_COUNTER_URL}/get?names=${encodeURIComponent(qs)}`, { signal: controller.signal, cache: 'no-store' });
            if (!res.ok) return null;
            const data = await res.json();
            return data && typeof data.counts === 'object' ? data.counts : null;
        } catch (e) {
            return null;
        } finally {
            clearTimeout(timer);
        }
    }
};

// ── Premium Unlock (Stripe return) ──
// Runs on every page via core-utils so buyers are unlocked no matter which
// page Stripe redirects them to after payment (?premium=1&session_id=cs_...).
//
// With PREMIUM_VERIFY_URL set (workers/premium-verify.js), the unlock only happens
// after Stripe confirms the session was paid. While it is empty, ?premium=1 alone unlocks
// (the original behaviour), so buyers are never locked out before the worker is deployed.
const PREMIUM_VERIFY_URL = '';

(function handlePremiumReturn() {
    let params;
    try { params = new URLSearchParams(window.location.search); } catch (e) { return; }
    if (params.get('premium') !== '1') return;
    const sessionId = params.get('session_id') || '';
    // Strip ?premium/&session_id once we have a definite answer (kept on network errors so a
    // refresh retries the check)
    const cleanUrl = () => {
        try { window.history.replaceState({}, document.title, window.location.pathname); } catch (e) { }
    };

    const whenReady = (fn) => (document.body ? fn() : document.addEventListener('DOMContentLoaded', fn));
    const failed = (msg) => whenReady(() => showToast(msg, '💌', 9000));

    const unlock = (reloadAfter) => {
        cleanUrl();
        try { localStorage.setItem('premium_unlocked', '1'); } catch (e) {
            failed("Your browser blocked saving Premium. Try again outside private browsing.");
            return;
        }
        if (reloadAfter) {
            // Pages read the premium flag at load, so reload once to apply it
            try { sessionStorage.setItem('premium_just_unlocked', '1'); } catch (e) { }
            window.location.reload();
            return;
        }
        whenReady(() => showToast('Premium unlocked. Thank you for supporting the project!', '✨'));
    };

    if (!PREMIUM_VERIFY_URL) {
        unlock(false);
        return;
    }
    const help = 'If you were charged, email WeCare@TheVibeCheckProject.com and we’ll fix it right away.';
    if (!sessionId) {
        cleanUrl();
        failed(`We couldn’t confirm that purchase. ${help}`);
        return;
    }
    fetch(`${PREMIUM_VERIFY_URL}/verify?session_id=${encodeURIComponent(sessionId)}`, { cache: 'no-store' })
        .then(res => res.json())
        .then(data => {
            if (data && data.valid) return unlock(true);
            cleanUrl();
            failed(`We couldn’t confirm that purchase. ${help}`);
        })
        .catch(() => failed(`We couldn’t reach our payment check. Refresh this page to try again. ${help}`));
})();

// Confirmation after the verified-unlock reload
(function () {
    try {
        if (sessionStorage.getItem('premium_just_unlocked') !== '1') return;
        sessionStorage.removeItem('premium_just_unlocked');
        const show = () => showToast('Premium unlocked. Thank you for supporting the project!', '✨');
        if (document.body) show(); else document.addEventListener('DOMContentLoaded', show);
    } catch (e) { }
})();

// ── Mobile nav toggle with accessible focus trap ──
(function initMobileNav() {
    const btn = document.getElementById('nav-hamburger');
    const nav = document.getElementById('nav');
    if (!nav) return;

    // Solid header once the page scrolls
    const syncScrolled = () => nav.classList.toggle('scrolled', window.pageYOffset > 50);
    window.addEventListener('scroll', syncScrolled, { passive: true });
    syncScrolled();

    if (!btn) return;

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
window.VibeCounter = VibeCounter;

