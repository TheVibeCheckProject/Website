/**
 * THE VIBE CHECK PROJECT — Recipient card page (view-card.html)
 * Renders the card from window.__vibeCard (decoded by the inline preloader in <head>),
 * handles the flip/reveal, sound, share and the recipient newsletter signup.
 * Loaded after core-utils.js and vibe-history.js.
 */

// ── Newsletter signup + share ──
async function handleViewCardSignup(e) {
  e.preventDefault();
  const email = e.target.querySelector('input').value;
  const btn = e.target.querySelector('button');
  btn.textContent = 'Joining...';
  btn.disabled = true;

  if (window.VibeTelemetry) {
    window.VibeTelemetry.track('recipient_email_signup_started');
  }

  try {
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
      e.target.innerHTML = '<p class="email-success">✨ You\'re in! Check your inbox.</p>';
      if (window.VibeTelemetry) {
        window.VibeTelemetry.track('recipient_email_signup_success');
        window.VibeTelemetry.setTag('newsletter_subscriber', 'true');
      }
    } else {
      showViewCardEmailError('Hmm, that didn\'t go through — please try again.');
      btn.textContent = 'Join Free';
      btn.disabled = false;
    }
  } catch (err) {
    showViewCardEmailError('Couldn\'t connect — check your connection and try again.');
    btn.textContent = 'Join Free';
    btn.disabled = false;
  }
}

function showViewCardEmailError(msg) {
  const err = document.getElementById('viewCardEmailError');
  if (!err) return;
  err.textContent = msg;
  err.hidden = false;
}


// ── Render the card ──
(async function () {
  const card = window.__vibeCard;
  if (!card) {
    document.getElementById('vibe-loader').classList.add('hidden');
    return;
  }

  try {
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

    // Setup Reciprocal Viral Bridge
    const sender = (card.senderName || '').trim();
    const bridgeTitle = document.getElementById('viralBridgeTitle');
    const bridgeSubtitle = document.getElementById('viralBridgeSubtitle');
    const btnReply1 = document.getElementById('btnReplyThankYou');
    const btnReply2 = document.getElementById('btnReplyEnergy');

    if (sender) {
      if (bridgeTitle) bridgeTitle.textContent = `Make ${sender}'s day right back! 💚`;
      if (bridgeSubtitle) bridgeSubtitle.textContent = `${sender} took a moment out of their day to send you good vibes. Send an instant reply card in 10 seconds:`;
      if (btnReply1) {
        const note1 = encodeURIComponent(`Thank you so much for the vibe check, ${sender}! Your message meant the world to me ✨`);
        btnReply1.href = `send-card.html?recipient=${encodeURIComponent(sender)}&preset=gratitude&note=${note1}&viralReply=1`;
        btnReply1.innerHTML = `<span>💌</span> <span>Send a "Thank You" Vibe to ${sender}</span>`;
        btnReply1.onclick = () => { if (window.VibeTelemetry) window.VibeTelemetry.track('reciprocal_reply_clicked', { type: 'thank_you' }); };
      }
      if (btnReply2) {
        const note2 = encodeURIComponent(`Sending you the biggest hug and warmest energy right back! You are amazing 🌟`);
        btnReply2.href = `send-card.html?recipient=${encodeURIComponent(sender)}&preset=healing&note=${note2}&viralReply=1`;
        btnReply2.innerHTML = `<span>🫂</span> <span>Send Warm Energy Back</span>`;
        btnReply2.onclick = () => { if (window.VibeTelemetry) window.VibeTelemetry.track('reciprocal_reply_clicked', { type: 'warm_energy' }); };
      }
    } else {
      if (bridgeTitle) bridgeTitle.textContent = `Pay this feeling forward 💚`;
      if (bridgeSubtitle) bridgeSubtitle.textContent = `Someone anonymously sent you love today. Pass the kindness along to a friend in your life:`;
      if (btnReply1) {
        btnReply1.href = `send-card.html?preset=gratitude&viralReply=1`;
        btnReply1.innerHTML = `<span>✨</span> <span>Send a Vibe Check to a Friend</span>`;
        btnReply1.onclick = () => { if (window.VibeTelemetry) window.VibeTelemetry.track('reciprocal_reply_clicked', { type: 'pay_forward' }); };
      }
      if (btnReply2) {
        btnReply2.href = `send-card.html?preset=healing&viralReply=1`;
        btnReply2.innerHTML = `<span>💌</span> <span>Send an Anonymous Card</span>`;
        btnReply2.onclick = () => { if (window.VibeTelemetry) window.VibeTelemetry.track('reciprocal_reply_clicked', { type: 'anonymous' }); };
      }
    }


    // Themed card front: emoji + palette per occasion (theme-* classes in view-card.css)
    const FRONT_THEMES = {
      birthday: { key: 'birthday', emoji: '🎂' },
      anxiety: { key: 'anxiety', emoji: '💙' },
      celebrate: { key: 'celebrate', emoji: '🌟' },
      love: { key: 'love', emoji: '💖' },
      healing: { key: 'healing', emoji: '🕊️' },
      grief: { key: 'healing', emoji: '🕊️' }
    };
    const theme = FRONT_THEMES[card.themeGroup];
    const frontFace = document.getElementById('cardFront');
    const backFace = document.getElementById('cardBack');
    if (theme) {
      if (frontFace) frontFace.classList.add(`theme-${theme.key}`);
      const emojiEl = document.getElementById('frontEmoji');
      if (emojiEl) emojiEl.textContent = theme.emoji;
    }
    const frontLabel = document.getElementById('frontLabel');
    if (frontLabel && card.recipientName) {
      frontLabel.textContent = `${card.recipientName}, you've got a Vibe Check!`;
    }

    // Background (image or video) on the back face — our own assets only
    const bg = window.resolveVibeBackground(card.background);
    if (!bg && theme && backFace) backFace.classList.add(`theme-${theme.key}`);
    if (bg && backFace) {
      if (bg.endsWith('.mp4')) {
        const backVid = document.getElementById('backVideo');
        if (backVid) {
          backVid.src = bg;
          backFace.classList.add('has-bg');
          await new Promise(r => {
            backVid.oncanplaythrough = r;
            backVid.load();
            setTimeout(r, 3000); // Safety timeout
          });
          backVid.play().catch(() => { });
        }
      } else {
        backFace.style.backgroundImage = `url('${bg}')`;
        backFace.classList.add('has-bg');
        await new Promise(r => {
          const img = window.preloadedBg || new Image();
          if (img.complete && img.naturalWidth) return r();
          img.onload = r;
          img.onerror = r;
          if (!img.src) img.src = bg;
          setTimeout(r, 2000); // Safety timeout
        });
      }
    }

    // Everything is ready
    setTimeout(() => {
      document.getElementById('vibe-loader').classList.add('hidden');
    }, 100);

  } catch (e) {
    console.error("Card init error:", e);
    document.getElementById('vibe-loader').classList.add('hidden');
  }
})();

// ── Flip, sound, tilt, reveal ──
// Flip card
const flipCard = document.getElementById('flipCard');
let cardOpen = false;
let cardSound = 'chime'; // default, updated from card data

const vibeCard = window.__vibeCard;
if (vibeCard && vibeCard.sound) cardSound = vibeCard.sound;

// The sender opening their own link (the card is in this browser's My Vibes) is a
// preview, not a delivery: label it and don't record a read receipt.
const isSenderPreview = !!(vibeCard && vibeCard.id && window.VibeHistory && window.VibeHistory.get(vibeCard.id));
if (isSenderPreview) {
  const badge = document.getElementById('headerBadge');
  if (badge) badge.textContent = `👀 Preview: this is what ${vibeCard.recipientName || 'they'} will see`;
}

// Desktop: the reveal panel reserves the right-hand column (no layout shift later), so
// shift the card to the visual centre until the reveal, then glide it into place.
const desktopMQ = window.matchMedia('(min-width: 1024px)');
function centerCardUntilReveal() {
  if (!desktopMQ.matches || document.body.classList.contains('is-revealed')) {
    flipCard.style.translate = '';
    return;
  }
  flipCard.style.translate = '0px 0px';
  const main = document.querySelector('.main-content').getBoundingClientRect();
  const r = flipCard.getBoundingClientRect();
  const dx = (main.left + main.width / 2) - (r.left + r.width / 2);
  flipCard.style.translate = `${Math.round(dx)}px 0px`;
}
centerCardUntilReveal();
window.addEventListener('resize', centerCardUntilReveal);
// Stylesheets load async (media=print swap), so the grid may not exist yet on first run
window.addEventListener('load', centerCardUntilReveal);

// Sound Mute Controller
let isSoundMuted = false;
try {
  isSoundMuted = localStorage.getItem('vibe_sound_muted') === 'true';
} catch (e) {}

const soundToggleBtn = document.getElementById('soundToggleBtn');
const soundToggleIcon = document.getElementById('soundToggleIcon');

function updateSoundToggleUI() {
  if (soundToggleIcon) soundToggleIcon.textContent = isSoundMuted ? '🔇' : '🔊';
  if (soundToggleBtn) {
    soundToggleBtn.setAttribute('aria-label', isSoundMuted ? 'Unmute sound effects' : 'Mute sound effects');
    soundToggleBtn.classList.toggle('is-muted', isSoundMuted);
  }
}
updateSoundToggleUI();

if (soundToggleBtn) {
  soundToggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    isSoundMuted = !isSoundMuted;
    try {
      localStorage.setItem('vibe_sound_muted', String(isSoundMuted));
    } catch (err) {}
    updateSoundToggleUI();
    if (window.soundEngine && typeof window.soundEngine.setMuted === 'function') {
      window.soundEngine.setMuted(isSoundMuted);
    }
  });
}

function playCardSound() {
  if (isSoundMuted) return;
  if (window.soundEngine && typeof soundEngine.play === 'function') {
    soundEngine.play(cardSound);
  }
}

// ── Desktop 3D Tilt ──
(function () {
  if (window.matchMedia("(pointer: fine)").matches) {
    const inner = document.getElementById('flipCardInner');

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

flipCard.addEventListener('click', () => {
  cardOpen = !cardOpen;
  flipCard.classList.toggle('flipped', cardOpen);

  const inner = document.getElementById('flipCardInner');

  // Reset 3D tilt before flipping
  inner.style.transform = '';
  inner.style.transition = 'transform 0.9s cubic-bezier(0.34, 1.56, 0.64, 1)';

  inner.classList.remove('flipping');
  void inner.offsetWidth; // trigger reflow
  inner.classList.add('flipping');
  setTimeout(() => inner.classList.remove('flipping'), 1000);

  if (cardOpen) {
    burstParticles(30);
    launchConfetti();
    playCardSound();

    // Read receipt for the sender's My Vibes dashboard (skipped for the sender's own preview)
    if (vibeCard && vibeCard.id && !isSenderPreview && window.VibeHistory) {
      window.VibeHistory.beaconOpen(vibeCard.id);
    }

    if (window.VibeTelemetry) {
      window.VibeTelemetry.track('card_flipped', { sound: cardSound });
      window.VibeTelemetry.setTag('card_revealed', 'true');
    }

    // Cinematic Reveal Sequence: give them time to read the card before anything else appears
    if (!document.body.classList.contains('is-revealed')) {
      setTimeout(() => {
        if (!cardOpen || document.body.classList.contains('is-revealed')) return; // flipped back meanwhile
        document.body.classList.add('is-revealed');
        if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          flipCard.style.transition = 'translate 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
        }
        centerCardUntilReveal();
        if (window.VibeTelemetry) {
          window.VibeTelemetry.track('post_card_revealed');
        }
      }, 4000);
    }
  }
});
flipCard.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flipCard.click(); }
});

// Ambient particles (desktop only)
burstParticles(15);
