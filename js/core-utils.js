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
