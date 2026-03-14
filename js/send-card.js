// Send Card page logic (extracted from inline scripts in send-card.html)

// ── Toast notification system (replaces browser alert()) ──
let toastTimer = null;
function showToast(message, icon) {
    icon = icon || '✨';
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

// Check for Stripe Premium Unlock
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get('premium') === '1') {
    localStorage.setItem('premium_unlocked', '1');
    window.history.replaceState({}, document.title, window.location.pathname);

    // Read message from URL and pre-fill
    const messageParam = urlParams.get('message');
    if (messageParam) {
        const textarea = document.getElementById('personalMessage');
        if (textarea) {
            textarea.value = decodeURIComponent(messageParam);
        }
    }

    // Show temporary badge
    const badge = document.createElement('div');
    badge.textContent = '✦ Premium Unlocked';
    badge.style.cssText = 'position:fixed;top:12px;right:12px;background:#6c63ff;color:white;padding:6px 12px;border-radius:20px;font-size:12px;z-index:9999;font-weight:bold;box-shadow:0 4px 12px rgba(108,99,255,0.4);';
    document.body.appendChild(badge);
    setTimeout(() => {
        badge.style.transition = 'opacity 0.5s';
        badge.style.opacity = '0';
        setTimeout(() => badge.remove(), 500);
    }, 4000);
}

const isPremium = localStorage.getItem('premium_unlocked') === '1';

const freeAffirmations = [
    "You're trying, and that's what counts.",
    "Your feelings are valid, and you deserve to be heard.",
    "Every new day is a fresh chance to try again.",
    "You're doing better than you think you are.",
    "Your presence makes a difference, even when you don't see it.",
    "Rest is not weakness. It's essential.",
    "You are enough, exactly as you are right now.",
    "Small steps still move you forward.",
    "Someone out there is grateful you exist.",
    "You deserve the kindness you give to others."
];

const premiumThemes = [
    { name: "Birthday", example: "Another year of you making the world better.", themeGroup: "birthday" },
    { name: "Grief Support", example: "There is no timeline for healing.", themeGroup: "grief" },
    { name: "Hype-Up", example: "You are absolutely crushing it.", themeGroup: "hype" },
    { name: "Love", example: "You are deeply, profoundly loved.", themeGroup: "love" },
    { name: "Anxiety Relief", example: "Breathe. You are safe right now.", themeGroup: "anxiety" },
    { name: "Friendship", example: "I'm so glad we exist at the same time.", themeGroup: "love" },
    { name: "Self-Love", example: "You are entirely up to you.", themeGroup: "love" },
    { name: "Congratulations", example: "All your hard work is paying off!", themeGroup: "hype" },
    { name: "Just Because", example: "Just a reminder that you're awesome.", themeGroup: "love" },
    { name: "I See You", example: "I see how hard you're trying.", themeGroup: "anxiety" }
];

let selectedAffirmation = '';
let selectedSound = 'chime';
let selectedThemeGroup = 'default';
let selectedBackground = '';

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
        osc.type = 'sine';
        osc.frequency.value = 220;
        lfo.type = 'sine';
        lfo.frequency.value = 0.3;
        lfoGain.gain.value = 100;
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);
        gain.gain.setValueAtTime(0.06, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(); lfo.start();
        osc.stop(ctx.currentTime + 3.5);
        lfo.stop(ctx.currentTime + 3.5);
    }
};

function selectSound(soundId, element) {
    selectedSound = soundId;
    document.querySelectorAll('.sound-option').forEach(el => el.classList.remove('selected'));
    element.classList.add('selected');
}

if (isPremium) {
    document.querySelectorAll('.premium-lock').forEach(el => el.style.display = 'none');
    const hint = document.getElementById('premiumSoundHint');
    if (hint) hint.style.display = 'none';
    const bgHint = document.getElementById('premiumBgHint');
    if (bgHint) bgHint.style.display = 'none';
}

function selectPremiumSound(soundId, element) {
    if (isPremium) {
        selectSound(soundId, element);
    } else {
        showPremModal();
    }
}

function previewSound(soundId) {
    try { soundEngine[soundId](); } catch (e) { }
}

// ── Affirmation Category Picker ──────────────────────────
const categoryDefs = [
    {
        id: 'general', label: 'General', emoji: '✨',
        color: '#ff6b9d', glow: 'rgba(255,107,157,0.25)',
        gradient: 'linear-gradient(135deg,#ff6b9d,#c084fc)',
        premium: false, themeGroup: 'default',
        affirmations: freeAffirmations
    },
    {
        id: 'anxiety', label: 'Calm', emoji: '💙',
        color: '#60a5fa', glow: 'rgba(96,165,250,0.25)',
        gradient: 'linear-gradient(135deg,#3b82f6,#67e8f9)',
        premium: true, themeGroup: 'anxiety',
        affirmations: [
            "Breathe. You are safe right now.",
            "I see how hard you're trying.",
            "You don't have to figure it all out today.",
            "Anxiety is lying to you. You are okay.",
            "One moment at a time. That's all."
        ]
    },
    {
        id: 'celebrate', label: 'Celebrate', emoji: '🎉',
        color: '#fb923c', glow: 'rgba(251,146,60,0.25)',
        gradient: 'linear-gradient(135deg,#f97316,#eab308)',
        premium: true, themeGroup: 'birthday',
        affirmations: [
            "Another year of you making the world better.",
            "All your hard work is paying off!",
            "You are absolutely crushing it.",
            "You deserve every good thing coming your way.",
            "Celebrating the person you are today."
        ]
    },
    {
        id: 'love', label: 'Love', emoji: '💖',
        color: '#f472b6', glow: 'rgba(244,114,182,0.25)',
        gradient: 'linear-gradient(135deg,#ec4899,#f43f5e)',
        premium: true, themeGroup: 'love',
        affirmations: [
            "You are deeply, profoundly loved.",
            "I'm so glad we exist at the same time.",
            "You are entirely enough as you are.",
            "You deserve the love you so freely give.",
            "Just a reminder: you're awesome."
        ]
    },
    {
        id: 'healing', label: 'Healing', emoji: '🕊️',
        color: '#818cf8', glow: 'rgba(129,140,248,0.25)',
        gradient: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
        premium: true, themeGroup: 'grief',
        affirmations: [
            "There is no timeline for healing.",
            "Grief is love with nowhere to go. That's okay.",
            "You are allowed to be a work in progress.",
            "Healing isn't linear. You're doing it.",
            "You carry them with you, always."
        ]
    }
];

let activeCategory = categoryDefs[0];
const tabsEl = document.getElementById('categoryTabs');
const pickerEl = document.getElementById('affirmationPicker');
const lockBannerEl = document.getElementById('categoryLockBanner');

function renderCategoryTabs() {
    tabsEl.innerHTML = '';
    categoryDefs.forEach(cat => {
        const tab = document.createElement('button');
        tab.type = 'button';
        tab.className = 'vibe-tab' + (cat.id === activeCategory.id ? ' active' : '');
        tab.style.setProperty('--tab-color', cat.color);
        tab.style.setProperty('--tab-glow', cat.glow);
        tab.style.setProperty('--tab-gradient', cat.gradient);
        tab.innerHTML = `<span>${cat.emoji} ${cat.label}</span>${(cat.premium && !isPremium) ? '<span class="tab-lock">🔒</span>' : ''}`;
        tab.onclick = () => selectCategory(cat);
        tabsEl.appendChild(tab);
    });
}

function renderAffirmationGrid(category, locked, skipAnimation) {
    pickerEl.innerHTML = '';
    lockBannerEl.style.display = locked ? 'flex' : 'none';
    category.affirmations.forEach((aff, i) => {
        const card = document.createElement('div');
        card.className = 'aff-card' + (locked ? ' aff-locked' : '');
        card.style.setProperty('--active-color', category.color);
        card.style.setProperty('--active-glow', category.glow);
        if (skipAnimation) {
            card.style.animation = 'none';
        } else {
            card.style.animationDelay = `${i * 60}ms`;
        }
        card.textContent = `"${aff}"`;
        if (!locked) {
            card.onclick = () => selectAffirmation(aff, card, category.themeGroup);
        }
        pickerEl.appendChild(card);
    });

    // "Write your own" card — always appended last
    const writeCard = document.createElement('div');
    writeCard.className = 'write-own-card';
    writeCard.id = 'writeOwnCard';
    if (skipAnimation) { writeCard.style.animation = 'none'; }
    writeCard.innerHTML = `<span>✍️</span><span>Write my own...</span>${isPremium ? '' : '<span class="write-own-badge">Premium</span>'}`;
    writeCard.onclick = () => isPremium ? openWriteOwn() : showPremModal();
    pickerEl.appendChild(writeCard);

    // Textarea (hidden until writeCard clicked, for premium users)
    const expanded = document.createElement('div');
    expanded.className = 'write-own-expanded';
    expanded.id = 'writeOwnExpanded';
    expanded.innerHTML = `
        <textarea class="write-own-textarea" id="writeOwnText" maxlength="200" placeholder="Write something from the heart... (max 200 characters)"></textarea>
        <button class="write-own-back" type="button" onclick="closeWriteOwn()">← Choose from the library instead</button>`;
    pickerEl.appendChild(expanded);

    // Live update preview as user types their own affirmation
    setTimeout(() => {
        const ta = document.getElementById('writeOwnText');
        if (ta) {
            ta.addEventListener('input', () => {
                selectedAffirmation = ta.value.trim();
                document.getElementById('previewAffirmation').textContent =
                    selectedAffirmation ? `"${selectedAffirmation}"` : '"Your affirmation will appear here"';
                triggerFoilSweep();
            });
        }
    }, 50);
}

function openWriteOwn() {
    const card = document.getElementById('writeOwnCard');
    const expanded = document.getElementById('writeOwnExpanded');
    if (card) card.style.display = 'none';
    if (expanded) expanded.classList.add('visible');
    const ta = document.getElementById('writeOwnText');
    if (ta) { ta.focus(); selectedAffirmation = ta.value.trim() || ''; }
}

function closeWriteOwn() {
    const card = document.getElementById('writeOwnCard');
    const expanded = document.getElementById('writeOwnExpanded');
    if (card) card.style.display = '';
    if (expanded) expanded.classList.remove('visible');
    // Revert to previously selected library affirmation if any
    const selected = pickerEl.querySelector('.aff-card.selected');
    if (selected) {
        selectedAffirmation = selected.textContent.replace(/^"|"$/g, '');
    } else {
        selectedAffirmation = '';
        document.getElementById('previewAffirmation').textContent = '"Your affirmation will appear here"';
    }
}

function showPremModal() {
    document.getElementById('premOverlay').classList.add('open');
    document.body.style.overflow = 'hidden';
}

function hidePremModal(e) {
    if (e && e.target !== document.getElementById('premOverlay')) return;
    document.getElementById('premOverlay').classList.remove('open');
    document.body.style.overflow = '';
}

function selectCategory(cat) {
    activeCategory = cat;
    const locked = cat.premium && !isPremium;
    if (locked) { selectedAffirmation = ''; }
    renderCategoryTabs();
    pickerEl.style.opacity = '0';
    pickerEl.style.transform = 'translateY(8px)';
    setTimeout(() => {
        renderAffirmationGrid(cat, locked);
        requestAnimationFrame(() => {
            pickerEl.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
            pickerEl.style.opacity = '1';
            pickerEl.style.transform = 'translateY(0)';
        });
    }, 160);
}

// Init — skip animation on first render so cards are immediately visible
renderCategoryTabs();
renderAffirmationGrid(categoryDefs[0], false, true);
requestAnimationFrame(() => {
    const firstCard = pickerEl.querySelector('.aff-card');
    if (firstCard) firstCard.click();
});

// Background picker
const backgroundDefs = [
    { id: 'sunset', label: 'Sunset', image: 'assets/backgrounds/bg_free_sunset_1772750341964.webp', premium: false },
    { id: 'dawn', label: 'Dawn', image: 'assets/backgrounds/bg_free_dawn_1772750358328.webp', premium: false },
    { id: 'aurora', label: 'Aurora', image: 'assets/backgrounds/bg_free_aurora_1772750371136.webp', premium: false },
    { id: 'rose', label: 'Rose Garden', image: 'assets/backgrounds/bg_free_rose_1772750381958.webp', premium: false },
    { id: 'nebula', label: 'Nebula', image: 'assets/backgrounds/bg_prem_nebula_1772750433414.webp', premium: true },
    { id: 'gold', label: 'Liquid Gold', image: 'assets/backgrounds/bg_prem_gold_1772750445716.webp', premium: true },
    { id: 'emerald', label: 'Emerald', image: 'assets/backgrounds/bg_prem_emerald_1772750461402.webp', premium: true },
    { id: 'electric', label: 'Electric', image: 'assets/backgrounds/bg_prem_electric_1772750473780.webp', premium: true },
    { id: 'velvet', label: 'Velvet Night', image: 'assets/backgrounds/bg_prem_velvet_1772750498877.webp', premium: true },
    { id: 'cherry', label: 'Cherry', image: 'assets/backgrounds/bg_prem_cherry_1772750510659.webp', premium: true },
    { id: 'ocean', label: 'Ocean', image: 'assets/backgrounds/bg_prem_ocean_1772750521461.webp', premium: true },
    { id: 'crystal', label: 'Crystal', image: 'assets/backgrounds/bg_prem_crystal_1772750533689.webp', premium: true },
    { id: 'ethereal_anim', label: 'Ethereal Silk', image: 'assets/backgrounds/animated_ethereal.mp4', premium: true, isVideo: true },
    { id: 'vibrant_anim', label: 'Golden Glow', image: 'assets/backgrounds/animated_vibrant.mp4', premium: true, isVideo: true },
    { id: 'modern_anim', label: 'Glass Crystals', image: 'assets/backgrounds/animated_modern.mp4', premium: true, isVideo: true },
    { id: 'prism_anim', label: 'Prism Flow', image: 'assets/backgrounds/Iridescent_Liquid_Glass_Video_Generation.mp4', premium: true, isVideo: true },
    { id: 'biolume_anim', label: 'Biolume Bloom', image: 'assets/backgrounds/Futuristic_Flower_Video_Generation.mp4', premium: true, isVideo: true },
    { id: 'plasma_anim', label: 'Sunstone Plasma', image: 'assets/backgrounds/Solar_Plasma_and_Flares_Visualization.mp4', premium: true, isVideo: true },
];

const bgPickerEl = document.getElementById('bgPicker');
backgroundDefs.forEach((bg, index) => {
    const el = document.createElement('div');
    const isLocked = bg.premium && !isPremium;
    el.className = 'bg-option' + (isLocked ? ' bg-locked' : '') + (index === 0 ? ' selected' : '');
    el.dataset.bgId = bg.id;

    if (bg.isVideo) {
        el.innerHTML = `
            <div class="bg-thumb" style="background: #000; position: relative; overflow: hidden;">
                <video src="${bg.image}" autoplay loop muted playsinline
                    style="position:absolute; inset:0; width:100%; height:100%; object-fit:cover; opacity: 0.8;"></video>
                <div style="position:absolute; inset:0; display:flex; align-items:center; justify-content:center; color:white; font-size:10px; font-weight:bold; background:rgba(0,0,0,0.2); z-index:2;">LIVE</div>
            </div>
            <span class="bg-label">${bg.label}</span>
            ${bg.premium && !isPremium ? '<span class="bg-premium-badge">Premium</span>' : ''}
        `;
    } else {
        const thumbStyle = `background-image:url('${bg.image}'); background-size: cover; background-position: center;`;
        el.innerHTML = `
            <div class="bg-thumb" style="${thumbStyle}"></div>
            <span class="bg-label">${bg.label}</span>
            ${bg.premium && !isPremium ? '<span class="bg-premium-badge">Premium</span>' : ''}
        `;
    }

    if (isLocked) {
        el.onclick = () => showPremModal();
    } else {
        el.onclick = () => selectBackground(bg.image, el, bg.isVideo);
    }
    bgPickerEl.appendChild(el);
});

// Initialize preview with first free background
selectedBackground = backgroundDefs[0].image;
const previewInitEl = document.querySelector('.card-preview');
previewInitEl.style.backgroundImage = `url('${selectedBackground}')`;
previewInitEl.style.backgroundSize = 'cover';
previewInitEl.style.backgroundPosition = 'center';
previewInitEl.style.borderColor = 'transparent';

function triggerFoilSweep() {
    const preview = document.querySelector('.card-preview');
    if (preview) {
        preview.classList.remove('play-foil');
        // Force a browser reflow to restart the animation
        void preview.offsetWidth;
        preview.classList.add('play-foil');
    }
}

function selectBackground(imagePath, element, isVideo = false) {
    selectedBackground = imagePath;
    document.querySelectorAll('.bg-option').forEach(el => el.classList.remove('selected'));
    element.classList.add('selected');

    const preview = document.getElementById('cardPreview');
    const videoEl = document.getElementById('previewVideo');

    if (isVideo) {
        preview.style.backgroundImage = 'none';
        videoEl.src = imagePath;
        videoEl.style.display = 'block';
        videoEl.play().catch(e => console.log("Video play blocked:", e));
    } else {
        videoEl.style.display = 'none';
        videoEl.pause();
        preview.style.backgroundImage = `url('${imagePath}')`;
        preview.style.backgroundSize = 'cover';
        preview.style.backgroundPosition = 'center';
    }

    triggerFoilSweep();
}

function selectAffirmation(affirmation, element, themeGroup = 'default') {
    selectedAffirmation = affirmation;
    selectedThemeGroup = themeGroup;

    // Remove selected class from all
    document.querySelectorAll('.aff-card').forEach(el => {
        el.classList.remove('selected');
    });

    // Add to clicked element
    element.classList.add('selected');

    // Update preview
    document.getElementById('previewAffirmation').textContent = `"${affirmation}"`;
    updatePreview();
    triggerFoilSweep();
}

// Read message prefill even without premium redirect
const initialMsg = urlParams.get('message');
if (initialMsg) {
    const textarea = document.getElementById('personalMessage');
    if (textarea) textarea.value = decodeURIComponent(initialMsg);
}

function updatePreview() {
    const senderName = document.getElementById('senderName').value || 'Someone special';
    const personalMessage = document.getElementById('personalMessage').value;
    const recipientName = document.getElementById('recipientName').value.trim();

    document.getElementById('previewSender').textContent = senderName;

    // Recipient chip
    const chip = document.getElementById('previewRecipientChip');
    const chipName = document.getElementById('previewRecipientName');
    if (chip && chipName) {
        if (recipientName) {
            chipName.textContent = recipientName;
            chip.classList.remove('hidden');
        } else {
            chip.classList.add('hidden');
        }
    }

    if (personalMessage) {
        document.getElementById('previewMessage').innerHTML =
            `<strong>${senderName}</strong> says:<br><br>${personalMessage}`;
    } else {
        document.getElementById('previewMessage').innerHTML =
            `<strong>${senderName}</strong> wanted to send you some good vibes ✨`;
    }
}

// Update preview as user types — multiple events for mobile keyboard compatibility
const senderInput = document.getElementById('senderName');
const messageInput = document.getElementById('personalMessage');
['input', 'keyup', 'change', 'blur', 'compositionend'].forEach(evt => {
    if (senderInput) senderInput.addEventListener(evt, updatePreview);
    if (messageInput) messageInput.addEventListener(evt, updatePreview);
});
// Polling fallback for mobile predictive text that skips all events
setInterval(updatePreview, 500);

// Handle form submission
document.getElementById('cardForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    if (!selectedAffirmation) {
        showToast('Pick an affirmation first — they need to hear something good!', '💌');
        goToStep(1);
        const grid = document.querySelector('.affirmation-grid');
        if (grid) { grid.classList.remove('grid-shake'); void grid.offsetWidth; grid.classList.add('grid-shake'); setTimeout(() => grid.classList.remove('grid-shake'), 500); }
        return;
    }

    const recipientName = document.getElementById('recipientName').value;
    if (!recipientName.trim()) {
        showToast("Add their name so they know it's for them 💖", '👤');
        const field = document.getElementById('recipientName');
        if (field) { field.classList.remove('field-shake'); void field.offsetWidth; field.classList.add('field-shake'); setTimeout(() => field.classList.remove('field-shake'), 500); field.focus(); }
        return;
    }
    const senderName = document.getElementById('senderName').value;
    const personalMessage = document.getElementById('personalMessage').value;
    const recipientEmail = document.getElementById('recipientEmail').value;

    // Disable button while processing
    const sendBtn = document.getElementById('sendButton');
    sendBtn.textContent = recipientEmail ? 'Sending... ✨' : 'Creating... ✨';
    sendBtn.disabled = true;

    // Create card data
    const cardData = {
        affirmation: selectedAffirmation,
        recipientName: recipientName,
        senderName: senderName,
        personalMessage: personalMessage,
        sound: selectedSound,
        themeGroup: selectedThemeGroup,
        background: selectedBackground,
        createdAt: new Date().toISOString()
    };

    // Encode card data in the URL so the link works on any device (no backend needed)
    const encoded = btoa(encodeURIComponent(JSON.stringify(cardData)));
    const base = window.location.href.replace(/send-card\.html.*$/, '');
    const cardUrl = `${base}view-card.html?data=${encoded}`;

    // Increment live counter
    fetch('https://api.counterapi.dev/v1/thevibecheckproject/cards-sent/up').catch(() => { });

    // If recipient email provided, send via EmailJS
    if (recipientEmail) {
        try {
            await emailjs.send('service_cn9gjbv', 'template_bpj8rue', {
                to_email: recipientEmail,
                to_name: recipientName || 'Friend',
                from_name: 'Someone',
                message: 'Someone sent you a Vibe Check from The Vibe Check Project! Open the card to reveal your message. ✨',
                card_link: cardUrl,
            });
            console.log('Email sent successfully!');
        } catch (err) {
            console.error('EmailJS error:', err);
            // Still show success — they can share the link manually
        }
    }

    // Show success
    document.getElementById('cardForm').style.display = 'none';
    document.getElementById('stepIndicator').style.display = 'none';
    document.getElementById('successMessage').classList.add('show');
    document.getElementById('cardLink').value = cardUrl;
    launchConfetti();

    // Update title and show email badge if email was sent
    if (recipientEmail) {
        document.getElementById('successTitle').textContent = 'Card Sent! 💚';
        document.getElementById('successSubtext').textContent = `Your Vibe Check is on its way.`;
        document.getElementById('emailSentBadge').style.display = 'inline-flex';
        document.getElementById('emailSentTo').textContent = recipientName || recipientEmail;
    }

    // Set up quick share links
    const shareText = encodeURIComponent('I sent you a Vibe Check! ✨ Open your card here:');
    const shareUrl = encodeURIComponent(cardUrl);
    document.getElementById('whatsappShare').href = `https://wa.me/?text=${shareText}%20${shareUrl}`;
    document.getElementById('twitterShare').href = `https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`;
    document.getElementById('textShare').dataset.url = cardUrl;
});

function copyLink(e) {
    const input = document.getElementById('cardLink');
    const button = e ? e.currentTarget || e.target : document.querySelector('.success-copy-btn');
    const originalText = button ? button.textContent : 'Copy';
    const url = input ? input.value : '';
    if (navigator.clipboard && url) {
        navigator.clipboard.writeText(url).then(() => {
            if (button) { button.textContent = 'Copied! ✓'; setTimeout(() => { button.textContent = originalText; }, 2000); }
        }).catch(() => {
            if (input) { input.select(); document.execCommand('copy'); }
            if (button) { button.textContent = 'Copied! ✓'; setTimeout(() => { button.textContent = originalText; }, 2000); }
        });
    } else if (input) {
        input.select();
        document.execCommand('copy');
        if (button) { button.textContent = 'Copied! ✓'; setTimeout(() => { button.textContent = originalText; }, 2000); }
    }
}

// ── Confetti burst ────────────────────────────────────────
function launchConfetti() {
    const canvas = document.createElement('canvas');
    canvas.id = 'confetti-canvas';
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ['#ff6b9d', '#c084fc', '#60a5fa', '#fbbf24', '#34d399', '#f472b6', '#a78bfa'];
    const pieces = Array.from({ length: 120 }, () => ({
        x: Math.random() * canvas.width,
        y: -20 - Math.random() * 200,
        w: 6 + Math.random() * 8,
        h: 10 + Math.random() * 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        vx: (Math.random() - 0.5) * 4,
        vy: 2 + Math.random() * 4,
        rot: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 0.2,
        opacity: 1,
    }));

    let frame = 0;
    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let alive = false;
        pieces.forEach(p => {
            p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.vy += 0.05;
            if (frame > 80) p.opacity -= 0.012;
            if (p.opacity > 0 && p.y < canvas.height + 40) alive = true;
            ctx.save();
            ctx.globalAlpha = Math.max(0, p.opacity);
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rot);
            ctx.fillStyle = p.color;
            ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
            ctx.restore();
        });
        frame++;
        if (alive && frame < 220) requestAnimationFrame(draw);
        else canvas.remove();
    }
    requestAnimationFrame(draw);
}

async function textFriend(e) {
    const btn = e.currentTarget;
    const url = btn.dataset.url;
    const text = 'I sent you a Vibe Check! ✨ Open your card here:';

    // Try native Web Share API
    if (navigator.share) {
        try {
            await navigator.share({
                title: 'The Vibe Check Project',
                text: text,
                url: url
            });
            return;
        } catch (err) {
            // Don't fall back if they cancelled
            if (err && err.name === 'AbortError') return;
        }
    }

    // Fallback for desktops / unsupported browsers
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const encodedText = encodeURIComponent(text + " " + url);

    if (isIOS) {
        // iOS requires '&' before body
        window.location.href = `sms:&body=${encodedText}`;
    } else {
        // Android/others use '?'
        window.location.href = `sms:?body=${encodedText}`;
    }
}

async function handleSenderSignup(e) {
    e.preventDefault();
    const email = e.target.querySelector('input[type="email"]').value;
    const btn = e.target.querySelector('button');
    btn.textContent = 'Joining...';
    btn.disabled = true;

    try {
        // Subscribe via secure Cloudflare Worker proxy
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
                fields: { signup_source: 'send-card-success' }
            })
        });
        if (response.ok) {
            e.target.innerHTML = '<p style="color:#FF6B9D;font-weight:600;font-size:15px;">✨ You\'re in! Check your inbox to confirm.</p>';
        } else {
            btn.textContent = 'Get Daily Vibes';
            btn.disabled = false;
        }
    } catch (err) {
        btn.textContent = 'Get Daily Vibes';
        btn.disabled = false;
    }
}

// Stepper Logic
let currentStep = 1;
const totalSteps = 3;

function goToStep(step) {
    // Validation before proceeding forward
    if (step > currentStep) {
        if (currentStep === 1) {
            if (!selectedAffirmation) {
                showToast('Choose an affirmation to continue ✨', '💌');
                const grid = document.querySelector('.affirmation-grid');
                if (grid) { grid.classList.remove('grid-shake'); void grid.offsetWidth; grid.classList.add('grid-shake'); setTimeout(() => grid.classList.remove('grid-shake'), 500); }
                return;
            }
        }
        // Step 2 → 3: background & sound are optional
    }

    // Update state
    currentStep = step;

    // Update step opacity
    document.querySelectorAll('.form-step').forEach((el, index) => {
        if (index + 1 === currentStep) {
            el.classList.add('active');
        } else {
            el.classList.remove('active');
        }
    });

    // Update numbered step indicator
    [1, 2, 3].forEach(n => {
        const wrap = document.getElementById('sn' + n);
        if (!wrap) return;
        wrap.classList.remove('sn-active', 'sn-done');
        if (n < currentStep) wrap.classList.add('sn-done');
        else if (n === currentStep) wrap.classList.add('sn-active');
    });
    [1, 2].forEach(n => {
        const conn = document.getElementById('sc' + n);
        if (!conn) return;
        conn.classList.toggle('done', n < currentStep);
    });

    // Scroll to the "Live Preview" slightly so they see inputs clearly on mobile jumps
    const previewContainer = document.querySelector('.sticky-preview');
    if (previewContainer) {
        const rect = previewContainer.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        if (rect.top < 0 || rect.top > 100) {
            window.scrollTo({
                top: Math.max(0, rect.top + scrollTop - 20),
                behavior: 'smooth'
            });
        }
    }
}

// EmailJS init (SDK loaded via deferred script tag)
document.addEventListener('DOMContentLoaded', function () {
    if (window.emailjs && typeof window.emailjs.init === 'function') {
        window.emailjs.init('kR9IPQkDu9CqMfnYy');
    }
});

