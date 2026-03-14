// View Card page logic (extracted from inline scripts in view-card.html)

async function handleViewCardSignup(e) {
  e.preventDefault();
  const email = e.target.querySelector('input').value;
  const btn = e.target.querySelector('button');
  btn.textContent = 'Joining...';
  btn.disabled = true;

  try {
    // Subscribe via secure Cloudflare Worker proxy (prevents API key exposure)
    const PROXY_URL = 'https://vibe-check-proxy.caseagent72401.workers.dev/';

    const response = await fetch(PROXY_URL, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        email: email,
        groups: ['180628908682512348'],
        fields: { signup_source: 'view-card' }
      })
    });
    if (response.ok) {
      e.target.innerHTML = '<p style="color:var(--green);font-size:16px;font-weight:700;">✨ You\\\'re in! Check your inbox.</p>';
    } else {
      btn.textContent = 'Join Free';
      btn.disabled = false;
    }
  } catch (err) {
    btn.textContent = 'Join Free';
    btn.disabled = false;
  }
}

(async function initViewCard() {
  const params = new URLSearchParams(window.location.search);
  const encoded = params.get('data');
  if (!encoded) {
    document.getElementById('vibe-loader')?.classList.add('hidden');
    return;
  }

  try {
    const card = JSON.parse(decodeURIComponent(atob(encoded)));
    const affirmationEl = document.getElementById('cardAffirmation');
    const messageEl = document.getElementById('cardMessage');
    const headerEl = document.getElementById('headerBadge');

    // Apply Text Content
    if (affirmationEl) affirmationEl.textContent = card.affirmation;
    if (messageEl) {
      const sender = card.senderName;
      if (sender) {
        messageEl.textContent = card.personalMessage
          ? `${sender} says: "${card.personalMessage}"`
          : `${sender} wanted to send you some good vibes ✨`;
      } else {
        messageEl.textContent = card.personalMessage
          ? `Someone special says: "${card.personalMessage}"`
          : 'Someone special wanted to send you some good vibes ✨';
      }
    }
    if (headerEl) {
      headerEl.textContent = card.senderName
        ? `✨ ${card.senderName} sent you a vibe`
        : '✨ Someone anonymously sent you a vibe';
    }
    if (card.recipientName) document.title = `${card.recipientName}, You've Got a Vibe Check! ✨`;

    // Apply Themes
    if (card.themeGroup && card.themeGroup !== 'default') {
      const frontFace = document.getElementById('cardFront');
      const backFace = document.getElementById('cardBack');
      if (frontFace) frontFace.classList.add(`theme-${card.themeGroup}`);
      if (backFace && !card.background) backFace.classList.add(`theme-${card.themeGroup}`);
    }

    // Apply Backgrounds (Image or Video) - BACK ONLY
    if (card.background) {
      const backFace = document.getElementById('cardBack');
      const isVideo = card.background.endsWith('.mp4');

      if (isVideo) {
        const backVid = document.getElementById('backVideo');
        if (backVid && backFace) {
          backVid.src = card.background;
          backFace.classList.add('has-bg');

          await new Promise(r => {
            backVid.oncanplaythrough = r;
            backVid.load();
            setTimeout(r, 3000); // Safety timeout
          });
          backVid.play().catch(() => { });
        }
      } else {
        let bgUrl = card.background;
        if (!bgUrl.startsWith('http') && !bgUrl.startsWith('data:')) {
          bgUrl = bgUrl.includes('assets/') ? bgUrl : `assets/backgrounds/${bgUrl}`;
        }
        const cssUrl = `url('${bgUrl}')`;

        if (backFace) {
          backFace.style.backgroundImage = cssUrl;
          backFace.classList.add('has-bg');
        }

        // Wait for image to load
        await new Promise(r => {
          const img = new Image();
          img.onload = r;
          img.onerror = r;
          img.src = card.background;
          setTimeout(r, 2000); // Safety timeout
        });
      }
    }

    // Everything is ready
    setTimeout(() => {
      document.getElementById('vibe-loader')?.classList.add('hidden');
    }, 100);
  } catch (e) {
    console.error("Card init error:", e);
    document.getElementById('vibe-loader')?.classList.add('hidden');
  }
})();

// Flip card + particles + sound logic
(() => {
  const flipCard = document.getElementById('flipCard');
  if (!flipCard) return;

  let cardOpen = false;
  let cardSound = 'chime'; // default, updated from card data

  // Read sound from card data
  (function () {
    const params = new URLSearchParams(window.location.search);
    const encoded = params.get('data');
    if (!encoded) return;
    try {
      const card = JSON.parse(decodeURIComponent(atob(encoded)));
      if (card.sound) cardSound = card.sound;
    } catch (e) { }
  })();

  // Sound engine — Web Audio API synthesized sounds
  const soundEngine = {
    _ctx() { return new (window.AudioContext || window.webkitAudioContext)(); },
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
    }
  };

  function playCardSound() {
    try { soundEngine[cardSound](); } catch (e) { try { soundEngine.chime(); } catch (e2) { } }
  }

  // ── Desktop 3D Tilt ──
  (function () {
    if (window.matchMedia("(pointer: fine)").matches) {
      const inner = document.getElementById('flipCardInner');
      if (!inner) return;

      flipCard.addEventListener('mousemove', (e) => {
        if (cardOpen) return;

        const rect = flipCard.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = (centerY - y) / 10;
        const rotateY = (x - centerX) / 10;

        inner.style.transition = 'transform 0.1s ease-out';
        inner.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
      });

      flipCard.addEventListener('mouseleave', () => {
        if (cardOpen) return;
        inner.style.transition = 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)';
        inner.style.transform = 'rotateX(0deg) rotateY(0deg)';
      });
    }
  })();

  // Confetti burst — capped at 20 on mobile to avoid compositor overload
  const isMobile = window.matchMedia('(max-width: 768px)').matches;
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

  flipCard.addEventListener('click', () => {
    cardOpen = !cardOpen;
    flipCard.classList.toggle('flipped', cardOpen);

    const inner = document.getElementById('flipCardInner');
    if (inner) {
      // Reset 3D tilt before flipping
      inner.style.transform = '';
      inner.style.transition = 'transform 0.9s cubic-bezier(0.34, 1.56, 0.64, 1)';

      inner.classList.remove('flipping');
      // trigger reflow
      void inner.offsetWidth;
      inner.classList.add('flipping');
      setTimeout(() => inner.classList.remove('flipping'), 1000);
    }

    if (cardOpen) {
      burstParticles(30);
      launchConfetti();
      playCardSound();

      // Cinematic Reveal Sequence
      if (!document.body.classList.contains('is-revealed')) {
        setTimeout(() => {
          document.body.classList.add('is-revealed');
        }, 1200);
      }
    }
  });
  flipCard.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flipCard.click(); }
  });

  // Particles — skipped on mobile, batched via DocumentFragment on desktop
  function burstParticles(count) {
    if (isMobile && count === 15) return; // skip ambient particles on mobile
    const container = document.getElementById('particles');
    if (!container) return;
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
    setTimeout(() => { container.innerHTML = ''; }, 12000);
  }
  // Ambient particles (desktop only)
  burstParticles(15);
})();

