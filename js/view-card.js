/**
 * THE VIBE CHECK PROJECT — Recipient card page (view-card.html)
 * Renders the card from window.__vibeCard (decoded by the inline preloader in <head>):
 * the sealed card, one flip to open it (with the sender's sound), their note, then a quiet
 * way to send one back. Loaded after core-utils.js and vibe-history.js.
 */

// ── Newsletter signup ──
async function handleViewCardSignup(e) {
  e.preventDefault();
  const email = e.target.querySelector('input').value;
  const btn = e.target.querySelector('button');
  const label = btn.textContent;
  btn.textContent = 'Joining...';
  btn.disabled = true;

  if (window.VibeTelemetry) window.VibeTelemetry.track('recipient_email_signup_started');

  try {
    const PROXY_URL = 'https://vibe-check-proxy.caseagent72401.workers.dev/';
    const response = await fetch(PROXY_URL, {
      method: 'POST',
      mode: 'cors',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        email: email,
        groups: ['180628908682512348'],
        fields: { signup_source: 'view-card' }
      })
    });
    if (response.ok) {
      e.target.innerHTML = '<p class="email-success">You\'re in. Check your inbox to confirm.</p>';
      if (window.VibeTelemetry) {
        window.VibeTelemetry.track('recipient_email_signup_success');
        window.VibeTelemetry.setTag('newsletter_subscriber', 'true');
      }
    } else {
      showViewCardEmailError('Hmm, that didn\'t go through — please try again.');
      btn.textContent = label;
      btn.disabled = false;
    }
  } catch (err) {
    showViewCardEmailError('Couldn\'t connect — check your connection and try again.');
    btn.textContent = label;
    btn.disabled = false;
  }
}

function showViewCardEmailError(msg) {
  const err = document.getElementById('viewCardEmailError');
  if (!err) return;
  err.textContent = msg;
  err.hidden = false;
}

// Colours for cards without a background (older links), by the words' theme
const CARD_THEMES = { birthday: 'birthday', celebrate: 'celebrate', anxiety: 'anxiety', love: 'love', healing: 'healing', grief: 'healing' };

// ── Render the card ──
(async function () {
  const card = window.__vibeCard;
  const hideLoader = () => document.getElementById('vibe-loader').classList.add('hidden');
  if (!card) { hideLoader(); return; }

  try {
    const $ = (id) => document.getElementById(id);
    const sender = (card.senderName || '').trim();
    const name = (card.recipientName || '').trim();

    // Front: who it's for and who it's from
    $('frontLabel').textContent = name ? `For ${name}` : 'For you';
    $('frontFrom').textContent = sender ? `from ${sender}` : 'from someone who cares';
    $('headerBadge').textContent = sender ? `${sender} sent you a card` : 'Someone sent you a card';
    if (name) document.title = `${name}, You've Got a Vibe Check! ✨`;

    // Back: the words and a sign-off
    $('cardAffirmation').textContent = `“${card.affirmation}”`;
    $('cardSign').textContent = sender ? `— ${sender}` : 'With love';

    // The note, under the card (built with textContent: card data is untrusted)
    const messageEl = $('cardMessage');
    messageEl.replaceChildren();
    const text = document.createElement('p');
    text.className = 'rc-note-text';
    if (card.personalMessage) {
      const from = document.createElement('span');
      from.className = 'rc-note-from';
      from.textContent = `${sender || 'Someone special'} says`;
      text.textContent = `“${card.personalMessage}”`;
      messageEl.append(from, text);
    } else {
      text.textContent = `${sender || 'Someone special'} wanted to send you some good vibes.`;
      messageEl.append(text);
    }

    // Send one back
    const bridgeTitle = $('viralBridgeTitle');
    const bridgeSubtitle = $('viralBridgeSubtitle');
    const btnReply1 = $('btnReplyThankYou');
    const btnReply2 = $('btnReplyEnergy');
    const track = (type) => () => { if (window.VibeTelemetry) window.VibeTelemetry.track('reciprocal_reply_clicked', { type }); };
    if (sender) {
      bridgeTitle.textContent = `Send ${sender} one back`;
      bridgeSubtitle.textContent = `${sender} took a moment for you today. A card back takes less than a minute.`;
      const note1 = encodeURIComponent(`Thank you so much for the vibe check, ${sender}! Your message meant the world to me ✨`);
      btnReply1.href = `send-card.html?recipient=${encodeURIComponent(sender)}&preset=gratitude&note=${note1}&viralReply=1`;
      btnReply1.textContent = `Send ${sender} a thank-you`;
      btnReply1.onclick = track('thank_you');
      const note2 = encodeURIComponent(`Sending you the biggest hug and warmest energy right back! You are amazing 🌟`);
      btnReply2.href = `send-card.html?recipient=${encodeURIComponent(sender)}&preset=healing&note=${note2}&viralReply=1`;
      btnReply2.textContent = 'Send warm energy back';
      btnReply2.onclick = track('warm_energy');
    } else {
      bridgeTitle.textContent = 'Send a little kindness on';
      bridgeSubtitle.textContent = 'Someone sent you a little kindness today. Send some to a friend.';
      btnReply1.href = 'send-card.html?preset=gratitude&viralReply=1';
      btnReply1.textContent = 'Send a card to a friend';
      btnReply1.onclick = track('pay_forward');
      btnReply2.href = 'send-card.html?preset=healing&viralReply=1';
      btnReply2.textContent = 'Send one anonymously';
      btnReply2.onclick = track('anonymous');
    }

    // Artwork: our own background files only; otherwise a gradient matched to the theme
    const front = $('cardFront');
    const back = $('cardBack');
    const themeClass = `theme-${CARD_THEMES[card.themeGroup] || 'default'}`;
    const bg = window.resolveVibeBackground(card.background);
    if (!bg) {
      front.classList.add(themeClass);
      back.classList.add(themeClass);
    } else if (bg.endsWith('.mp4')) {
      front.classList.add(themeClass);
      const backVid = $('backVideo');
      back.classList.add('has-video');
      backVid.src = bg;
      await new Promise(r => {
        backVid.oncanplaythrough = r;
        backVid.load();
        setTimeout(r, 3000); // Safety timeout
      });
    } else {
      front.style.backgroundImage = `url('${bg}')`;
      back.style.backgroundImage = `url('${bg}')`;
      await new Promise(r => {
        const img = window.preloadedBg || new Image();
        if (img.complete && img.naturalWidth) return r();
        img.onload = r;
        img.onerror = r;
        if (!img.src) img.src = bg;
        setTimeout(r, 2000); // Safety timeout
      });
    }

    if (document.readyState !== 'complete') await new Promise(r => window.addEventListener('load', r, { once: true }));
    setTimeout(hideLoader, 100);
  } catch (e) {
    console.error('Card init error:', e);
    hideLoader();
  }
})();

// ── Open the card: flip, sound, read receipt, then the reply panel ──
const flipCard = document.getElementById('flipCard');
const cardCol = document.querySelector('.rc-card-col');
const inner = document.getElementById('flipCardInner');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let cardOpen = false;
let cardSound = 'chime';

const vibeCard = window.__vibeCard;
if (vibeCard && vibeCard.sound) cardSound = vibeCard.sound;

// The sender opening their own link (the card is in this browser's My Vibes) is a
// preview, not a delivery: label it and don't record a read receipt.
const isSenderPreview = !!(vibeCard && vibeCard.id && window.VibeHistory && window.VibeHistory.get(vibeCard.id));
if (isSenderPreview) {
  const badge = document.getElementById('headerBadge');
  if (badge) badge.textContent = `👀 Preview: this is what ${vibeCard.recipientName || 'they'} will see`;
}

// Desktop: the reply panel has its column from the start (no layout shift later), so the
// card sits in the visual centre until the reveal, then glides into its place on the left.
const desktopMQ = window.matchMedia('(min-width: 901px)');
function centerCardUntilReveal() {
  if (!desktopMQ.matches || document.body.classList.contains('is-revealed')) {
    cardCol.style.translate = '';
    return;
  }
  cardCol.style.translate = '0px 0px';
  const main = document.querySelector('.main-content').getBoundingClientRect();
  const r = cardCol.getBoundingClientRect();
  cardCol.style.translate = `${Math.round((main.left + main.width / 2) - (r.left + r.width / 2))}px 0px`;
}
centerCardUntilReveal();
window.addEventListener('resize', centerCardUntilReveal);
// Stylesheets load async (media=print swap), so the grid may not exist yet on first run
window.addEventListener('load', centerCardUntilReveal);

// ── Sound on/off (remembered) ──
let isSoundMuted = false;
try { isSoundMuted = localStorage.getItem('vibe_sound_muted') === 'true'; } catch (e) { }
const soundToggleBtn = document.getElementById('soundToggleBtn');
const soundToggleIcon = document.getElementById('soundToggleIcon');
function updateSoundToggleUI() {
  if (soundToggleIcon) soundToggleIcon.textContent = isSoundMuted ? '🔇' : '🔊';
  if (soundToggleBtn) {
    soundToggleBtn.setAttribute('aria-label', isSoundMuted ? 'Turn sound on' : 'Turn sound off');
    soundToggleBtn.classList.toggle('is-muted', isSoundMuted);
  }
}
updateSoundToggleUI();
if (soundToggleBtn) {
  soundToggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    isSoundMuted = !isSoundMuted;
    try { localStorage.setItem('vibe_sound_muted', String(isSoundMuted)); } catch (err) { }
    updateSoundToggleUI();
  });
}
function playCardSound() {
  if (isSoundMuted) return;
  if (window.soundEngine && typeof soundEngine.play === 'function') soundEngine.play(cardSound);
}

// ── A gentle tilt under the pointer while the card is sealed (desktop) ──
if (window.matchMedia('(pointer: fine)').matches && !reducedMotion) {
  flipCard.addEventListener('mousemove', (e) => {
    if (cardOpen) return;
    const r = flipCard.getBoundingClientRect();
    const rx = ((r.height / 2) - (e.clientY - r.top)) / r.height * 8;
    const ry = ((e.clientX - r.left) - (r.width / 2)) / r.width * 8;
    inner.style.transition = 'transform 0.15s ease-out';
    inner.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
  });
  flipCard.addEventListener('mouseleave', () => {
    if (cardOpen) return;
    inner.style.transition = 'transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)';
    inner.style.transform = '';
  });
}

flipCard.addEventListener('click', () => {
  cardOpen = !cardOpen;
  inner.style.transition = '';
  inner.style.transform = '';
  flipCard.classList.toggle('flipped', cardOpen);
  document.body.classList.toggle('is-open', cardOpen);
  flipCard.setAttribute('aria-label', cardOpen ? 'Close your card' : 'Open your card');

  const video = document.getElementById('backVideo');
  if (cardOpen) {
    // The sound lands as the card turns to face them
    setTimeout(playCardSound, reducedMotion ? 0 : 450);
    if (video && video.src && !reducedMotion) video.play().catch(() => { });

    // Read receipt for the sender's My Vibes dashboard (skipped for the sender's own preview)
    if (vibeCard && vibeCard.id && !isSenderPreview && window.VibeHistory) {
      window.VibeHistory.beaconOpen(vibeCard.id);
    }
    if (window.VibeTelemetry) {
      window.VibeTelemetry.track('card_flipped', { sound: cardSound });
      window.VibeTelemetry.setTag('card_revealed', 'true');
    }

    // Give them time to read the card before anything else appears
    if (!document.body.classList.contains('is-revealed')) {
      setTimeout(() => {
        if (!cardOpen || document.body.classList.contains('is-revealed')) return; // closed meanwhile
        document.body.classList.add('is-revealed');
        if (!reducedMotion) cardCol.style.transition = 'translate 1s cubic-bezier(0.65, 0, 0.35, 1)';
        centerCardUntilReveal();
        if (window.VibeTelemetry) window.VibeTelemetry.track('post_card_revealed');
      }, 4000);
    }
  } else if (video) {
    video.pause();
  }
});
flipCard.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flipCard.click(); }
});
