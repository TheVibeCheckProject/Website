// ── Safe storage (Safari private mode / blocked storage throws on access) ──
function storageGet(key) {
    try { return window.localStorage.getItem(key); } catch (e) { return null; }
}
function storageSet(key, val) {
    try { window.localStorage.setItem(key, val); } catch (e) { }
}

// ── Global State ──
const isPremium = storageGet('premium_unlocked') === '1';

// Payload limits (also enforced by view-card.html; see docs/README.md "Card links")
const LIMITS = { name: 50, affirmation: 280, note: 500 };

let selectedAffirmation = '';
let selectedSound = 'chime';
let selectedThemeGroup = 'default';
let selectedBackground = '';

// ── Motion Accessibility State (Reduced Motion) ──
let isReducedMotion = (function () {
    const stored = storageGet('vibe_reduced_motion');
    if (stored !== null) return stored === '1';
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
})();

function applyMotionPreference(reduced, persist = true) {
    isReducedMotion = reduced;
    if (persist) {
        storageSet('vibe_reduced_motion', reduced ? '1' : '0');
    }
    document.documentElement.classList.toggle('reduce-motion', reduced);

    const icon = document.getElementById('motionToggleIcon');
    const text = document.getElementById('motionToggleText');
    const btn = document.getElementById('motionToggleBtn');

    if (icon) icon.textContent = reduced ? '⏸' : '✨';
    if (text) text.textContent = reduced ? 'Motion Off' : 'Motion On';
    if (btn) {
        btn.classList.toggle('motion-reduced', reduced);
        btn.setAttribute('aria-pressed', reduced ? 'true' : 'false');
        btn.title = reduced ? 'Reduced motion enabled (click for full animations)' : 'Full motion enabled (click to reduce motion)';
    }

    const videoEl = document.getElementById('previewVideo');
    if (videoEl) {
        if (reduced) videoEl.pause();
        else if (videoEl.style.display !== 'none') videoEl.play().catch(() => { });
    }

    if (window.VibeTelemetry && persist) {
        window.VibeTelemetry.track('motion_preference_toggled', { reduced_motion: reduced });
    }
}

function initMotionControl() {
    const btn = document.getElementById('motionToggleBtn');
    if (btn) {
        btn.addEventListener('click', () => {
            applyMotionPreference(!isReducedMotion, true);
        });
    }

    try {
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        mediaQuery.addEventListener('change', (e) => {
            if (storageGet('vibe_reduced_motion') === null) {
                applyMotionPreference(e.matches, false);
            }
        });
    } catch (e) { }

    applyMotionPreference(isReducedMotion, false);
}

// ── Occasion Templates / Presets (1-Click Vibe, Look & Sound) ──
const occasionTemplates = [
    {
        id: 'birthday',
        emoji: '🎂',
        title: 'Birthday',
        affirmation: "Another year of you making the world brighter ✨",
        bgId: 'sunset',
        premBgId: 'gold',
        sound: 'sparkle',
        premSound: 'piano',
        themeGroup: 'birthday',
        notePlaceholder: "Wishing you the happiest birthday and the most incredible year ahead! 🥳"
    },
    {
        id: 'tough_day',
        emoji: '🩹',
        title: 'Tough Day',
        affirmation: "Take a breath. You don't have to carry it all today.",
        bgId: 'dawn',
        premBgId: 'velvet',
        sound: 'bell',
        premSound: 'musicbox',
        themeGroup: 'anxiety',
        notePlaceholder: "Thinking of you today. No need to reply, just sending lots of love. 💙"
    },
    {
        id: 'proud',
        emoji: '🌟',
        title: 'Proud of You',
        affirmation: "Look how far you've come. I'm so proud of you!",
        bgId: 'aurora',
        premBgId: 'emerald',
        sound: 'sparkle',
        premSound: 'celebration',
        themeGroup: 'celebrate',
        notePlaceholder: "You put in the work and crushed it! Celebrating you big time today 🎉"
    },
    {
        id: 'gratitude',
        emoji: '💌',
        title: 'Gratitude',
        affirmation: "Just wanted to remind you how much you mean to me.",
        bgId: 'rose',
        premBgId: 'cherry',
        sound: 'chime',
        premSound: 'harp',
        themeGroup: 'love',
        notePlaceholder: "So grateful to have you in my life. Thank you for always being you! ✨"
    },
    {
        id: 'calm',
        emoji: '🌿',
        title: 'Calm & Safe',
        affirmation: "Breathe in calm, exhale worry. You are safe right now.",
        bgId: 'dawn',
        premBgId: 'ocean',
        sound: 'bell',
        premSound: 'ocean',
        themeGroup: 'anxiety',
        notePlaceholder: "Taking a gentle pause with you today. One moment at a time. 🕊️"
    },
    {
        id: 'healing',
        emoji: '🕊️',
        title: 'Gentle Healing',
        affirmation: "Sending you gentle love and holding space for you today.",
        bgId: 'rose',
        premBgId: 'crystal',
        sound: 'chime',
        premSound: 'harp',
        themeGroup: 'healing',
        notePlaceholder: "Holding space for you today. Take all the time and gentleness you need."
    }
];

let activeOccasionTemplate = null;

function renderOccasionChips() {
    const wrap = document.getElementById('occasionChips');
    if (!wrap) return;
    wrap.innerHTML = '';

    occasionTemplates.forEach(t => {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'occasion-chip' + (activeOccasionTemplate === t.id ? ' active' : '');
        chip.setAttribute('aria-pressed', activeOccasionTemplate === t.id ? 'true' : 'false');
        chip.dataset.occasionId = t.id;
        chip.innerHTML = `<span class="occasion-chip-emoji">${t.emoji}</span> <span class="occasion-chip-title">${t.title}</span>`;
        chip.onclick = () => applyOccasionTemplate(t.id);
        wrap.appendChild(chip);
    });
}

// ?preset= aliases
const OCCASION_ALIASES = {
    hard_day: 'tough_day', bad_day: 'tough_day', breakup: 'tough_day',
    hype: 'proud', celebrate: 'proud',
    thank_you: 'gratitude', love: 'gratitude',
    anxiety: 'calm', panic: 'calm', burnout: 'calm',
    grief: 'healing', loss: 'healing', illness: 'healing', sympathy: 'healing'
};

function applyOccasionTemplate(templateId, isAutoFromUrl = false) {
    let resolvedId = (templateId || '').toLowerCase().replace(/-/g, '_');
    resolvedId = OCCASION_ALIASES[resolvedId] || resolvedId;

    const template = occasionTemplates.find(t => t.id === resolvedId);
    if (!template) return;

    activeOccasionTemplate = resolvedId;
    renderOccasionChips();

    // 1. Set Affirmation
    selectedAffirmation = template.affirmation;
    selectedThemeGroup = template.themeGroup || 'default';
    const previewAff = document.getElementById('previewAffirmation');
    if (previewAff) previewAff.textContent = `"${template.affirmation}"`;

    const writeCard = document.getElementById('writeOwnCard');
    const writeExpanded = document.getElementById('writeOwnExpanded');
    if (writeCard) writeCard.style.display = '';
    if (writeExpanded) writeExpanded.classList.remove('visible');

    if (pickerEl) {
        pickerEl.querySelectorAll('.aff-card').forEach(c => {
            const clean = c.textContent.replace(/^"|"$/g, '').trim();
            c.classList.toggle('selected', clean === template.affirmation);
        });
    }

    // 2. Set Background
    const targetBgId = (isPremium && template.premBgId) ? template.premBgId : template.bgId;
    const matchedBgDef = backgroundDefs.find(b => b.id === targetBgId) || backgroundDefs.find(b => b.id === template.bgId);
    if (matchedBgDef) {
        const bgOptionEl = document.querySelector(`.bg-option[data-bg-id="${matchedBgDef.id}"]`);
        selectBackground(matchedBgDef.image, bgOptionEl, !!matchedBgDef.isVideo);
    }

    // 3. Set Sound
    const targetSound = (isPremium && template.premSound) ? template.premSound : template.sound;
    const soundOptionEl = document.querySelector(`.sound-option[data-sound="${targetSound}"]`);
    if (soundOptionEl) {
        selectSound(targetSound, soundOptionEl);
    }

    // 4. Set suggested note placeholder if empty
    const personalMsg = document.getElementById('personalMessage');
    if (personalMsg && !personalMsg.value.trim() && template.notePlaceholder) {
        personalMsg.placeholder = template.notePlaceholder;
    }

    triggerFoilSweep();

    if (window.VibeTelemetry) {
        window.VibeTelemetry.track('occasion_template_applied', { 
            template: templateId, 
            isAutoFromUrl: isAutoFromUrl 
        });
    }
}

// Stripe premium return is handled centrally in core-utils.js (runs before this script).

// --- NEW: Read message, recipient, and occasion from URL and pre-fill ---
function handleExternalMessage() {
    const urlParams = new URLSearchParams(window.location.search);
    const messageParam = urlParams.get('message') || urlParams.get('msg');
    const noteParam = urlParams.get('note') || urlParams.get('personal_note');
    const recipientParam = urlParams.get('recipient') || urlParams.get('to');
    const occasionParam = urlParams.get('occasion') || urlParams.get('template') || urlParams.get('preset');
    const isViralReply = urlParams.get('viralReply') === '1' || urlParams.get('reply') === '1';
    
    if (recipientParam) {
        let cleanRec = recipientParam;
        try { cleanRec = decodeURIComponent(recipientParam); } catch (e) { }
        cleanRec = cleanRec.trim().substring(0, LIMITS.name);
        const recInput = document.getElementById('recipientName');
        if (recInput) recInput.value = cleanRec;

        const chip = document.getElementById('previewRecipientChip');
        const chipName = document.getElementById('previewRecipientName');
        if (chip && chipName) {
            chipName.textContent = cleanRec;
            chip.classList.remove('hidden');
        }

        const banner = document.getElementById('viralReplyBanner');
        const bannerName = document.getElementById('viralReplyName');
        if (banner && bannerName) {
            bannerName.textContent = cleanRec;
            banner.style.display = 'flex';
        }

        if (window.VibeTelemetry) {
            window.VibeTelemetry.setTag('is_viral_reply', 'true');
            window.VibeTelemetry.track('viral_reply_flow_initiated', { recipient: cleanRec });
        }
    }

    // Handle Personal Note pre-fill (from viral reply or explicit note parameter)
    const personalNoteText = noteParam || (isViralReply ? messageParam : null);
    if (personalNoteText) {
        let cleanNote = personalNoteText;
        try {
            if (cleanNote.includes('%')) cleanNote = decodeURIComponent(personalNoteText);
        } catch (e) { }
        cleanNote = cleanNote.substring(0, LIMITS.note);
        const pInput = document.getElementById('personalMessage');
        if (pInput) {
            pInput.value = cleanNote;
        }
        const backNote = document.getElementById('previewBackNote');
        if (backNote) {
            backNote.textContent = `"${cleanNote.trim()}"`;
        }
    }

    // Handle Affirmation pre-fill (from blog posts or external message links)
    if (messageParam && !isViralReply) {
        let decodedMsg = messageParam;
        try {
            if (decodedMsg.includes('%')) {
                decodedMsg = decodeURIComponent(messageParam);
            }
        } catch (e) {
            console.warn("⚠️ Failed to decode message param, using raw:", e);
        }
        // Blog/homepage "Send as Card" buttons pass their text here. It is our own
        // content, so it is allowed on the card front for free users too.
        decodedMsg = decodedMsg.replace(/^["“”']+|["“”']+$/g, '').trim().substring(0, LIMITS.affirmation);

        window._externalMessage = decodedMsg;
        selectedAffirmation = decodedMsg;
        const previewAff = document.getElementById('previewAffirmation');
        if (previewAff) previewAff.textContent = `"${decodedMsg}"`;
        if (typeof updatePreview === 'function') updatePreview();
        if (window.VibeTelemetry) {
            window.VibeTelemetry.track('external_message_applied', { message_length: decodedMsg.length });
        }
    } else if (occasionParam) {
        window._appliedOccasion = occasionParam.toLowerCase();
    }
}

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

function selectSound(soundId, element) {
    selectedSound = soundId;
    document.querySelectorAll('.sound-option').forEach(el => el.classList.remove('selected'));
    element.classList.add('selected');
    if (window.VibeTelemetry) {
        window.VibeTelemetry.track('sound_selected', { sound: soundId });
    }
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
        if (window.VibeTelemetry) {
            window.VibeTelemetry.track('premium_sound_attempt', { sound: soundId });
        }
        showPremModal('sound_' + soundId, 'Premium Soundscape: ' + soundId);
    }
}

function previewSound(soundId) {
    soundEngine.play(soundId);
    if (window.VibeTelemetry) {
        window.VibeTelemetry.track('sound_previewed', { sound: soundId });
    }
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
        premium: true, themeGroup: 'healing',
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
    if (!tabsEl) return;
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
    if (!pickerEl) return;
    pickerEl.innerHTML = '';
    if (lockBannerEl) lockBannerEl.style.display = locked ? 'flex' : 'none';
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
            card.tabIndex = 0;
            card.setAttribute('role', 'button');
            card.onkeydown = (ev) => {
                if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); selectAffirmation(aff, card, category.themeGroup); }
            };
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
    writeCard.tabIndex = 0;
    writeCard.setAttribute('role', 'button');
    writeCard.onkeydown = (ev) => {
        if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); writeCard.click(); }
    };
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
    if (!isPremium) {
        showPremModal('write_own', 'Custom Affirmation Composer');
        return;
    }
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

let _prevFocusedBeforePrem = null;

function handlePremModalKeydown(e) {
    if (e.key === 'Escape') {
        hidePremModal();
        return;
    }
    if (e.key === 'Tab') {
        const overlay = document.getElementById('premOverlay');
        if (!overlay) return;
        const focusables = Array.from(overlay.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), [tabindex="0"]'))
            .filter(el => el.offsetWidth > 0 || el.offsetHeight > 0);
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
}

function showPremModal(context = 'general', badgeText = '') {
    const overlay = document.getElementById('premOverlay');
    if (overlay) {
        overlay.classList.add('open');
        overlay.setAttribute('aria-hidden', 'false');
    }
    document.body.style.overflow = 'hidden';

    _prevFocusedBeforePrem = document.activeElement;
    document.addEventListener('keydown', handlePremModalKeydown);

    const badge = document.getElementById('premContextBadge');
    if (badge) {
        if (badgeText) {
            badge.textContent = badgeText;
            badge.style.display = 'inline-block';
        } else {
            badge.style.display = 'none';
        }
    }

    const cta = document.getElementById('premCtaBtn') || (overlay && overlay.querySelector('.prem-modal a, .prem-modal button'));
    if (cta) setTimeout(() => cta.focus(), 50);

    if (window.VibeTelemetry) {
        window.VibeTelemetry.track('premium_modal_opened', { trigger: context });
        window.VibeTelemetry.setTag('last_premium_trigger', context);
    }
}

function hidePremModal(e) {
    const overlay = document.getElementById('premOverlay');
    if (e && e.target) {
        const modal = overlay && overlay.querySelector('.prem-modal');
        const isDismissBtn = e.target.closest('.prem-dismiss');
        // Allow closing from: overlay backdrop click, dismiss button, or direct call
        if (modal && modal.contains(e.target) && !isDismissBtn) return;
    }
    if (overlay) {
        overlay.classList.remove('open');
        overlay.setAttribute('aria-hidden', 'true');
    }
    document.body.style.overflow = '';
    document.removeEventListener('keydown', handlePremModalKeydown);

    if (_prevFocusedBeforePrem && typeof _prevFocusedBeforePrem.focus === 'function') {
        _prevFocusedBeforePrem.focus();
        _prevFocusedBeforePrem = null;
    }

    if (window.VibeTelemetry) {
        window.VibeTelemetry.track('premium_modal_dismissed');
    }
}

function selectCategory(cat) {
    activeCategory = cat;
    const locked = cat.premium && !isPremium;
    if (locked) {
        selectedAffirmation = '';
        if (window.VibeTelemetry) {
            window.VibeTelemetry.track('premium_category_attempt', { category: cat.id });
        }
        showPremModal('category_' + cat.id, `${cat.emoji} ${cat.label} Vault`);
    } else {
        if (window.VibeTelemetry) {
            window.VibeTelemetry.track('category_selected', { category: cat.id });
        }
    }
    renderCategoryTabs();
    if (pickerEl) {
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
}

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

// The six animated backgrounds weigh ~10 MB together and sit on step 2, which most visitors
// never open. Fetch each thumbnail only while it is on screen, and pause it when it leaves.
// Inactive steps are hidden with visibility/opacity, which IntersectionObserver ignores, so
// "on screen" also requires the thumbnail's step to be the active one.
const _onScreenThumbs = new Set();
function refreshVideoThumbs() {
    document.querySelectorAll('#bgPicker video[data-src]').forEach(v => {
        const step = v.closest('.form-step');
        const visible = _onScreenThumbs.has(v) && (!step || step.classList.contains('active'));
        if (visible) {
            if (!v.src) v.src = v.dataset.src;
            if (!isReducedMotion) v.play().catch(() => { });
        } else if (v.src) {
            v.pause();
        }
    });
}

function lazyVideoThumbs(container) {
    const videos = container.querySelectorAll('video[data-src]');
    if (!('IntersectionObserver' in window)) {
        videos.forEach(v => _onScreenThumbs.add(v));
        refreshVideoThumbs();
        return;
    }
    const io = new IntersectionObserver((entries) => {
        entries.forEach(({ target, isIntersecting }) => {
            if (isIntersecting) _onScreenThumbs.add(target); else _onScreenThumbs.delete(target);
        });
        refreshVideoThumbs();
    }, { rootMargin: '100px' });
    videos.forEach(v => io.observe(v));
}

function triggerFoilSweep() {
    if (isReducedMotion) return;
    const preview = document.querySelector('.card-preview');
    if (preview) {
        preview.classList.remove('play-foil');
        void preview.offsetWidth; // Force a browser reflow
        preview.classList.add('play-foil');
    }
}

function selectBackground(imagePath, element, isVideo = false) {
    selectedBackground = imagePath;
    document.querySelectorAll('.bg-option').forEach(el => el.classList.remove('selected'));
    if (element) element.classList.add('selected');

    if (window.VibeTelemetry) {
        window.VibeTelemetry.track('background_selected', { isVideo: isVideo, path: imagePath.split('/').pop() });
    }

    const preview = document.getElementById('cardPreview');
    const videoEl = document.getElementById('previewVideo');

    if (preview && videoEl) {
        if (isVideo) {
            preview.style.backgroundImage = 'none';
            videoEl.src = imagePath;
            videoEl.style.display = 'block';
            if (!isReducedMotion) {
                videoEl.play().catch(e => console.log("Video play blocked:", e));
            }
        } else {
            videoEl.style.display = 'none';
            videoEl.pause();
            preview.style.backgroundImage = `url('${imagePath}')`;
            preview.style.backgroundSize = 'cover';
            preview.style.backgroundPosition = 'center';
        }
    }

    triggerFoilSweep();
}

function selectAffirmation(affirmation, element, themeGroup = 'default') {
    selectedAffirmation = affirmation;
    selectedThemeGroup = themeGroup;

    if (activeOccasionTemplate) {
        const matched = occasionTemplates.find(t => t.id === activeOccasionTemplate);
        if (!matched || matched.affirmation !== affirmation) {
            activeOccasionTemplate = null;
            renderOccasionChips();
        }
    }

    document.querySelectorAll('.aff-card').forEach(el => el.classList.remove('selected'));
    if (element) element.classList.add('selected');

    if (window.VibeTelemetry) {
        window.VibeTelemetry.track('affirmation_selected', { themeGroup: themeGroup, length: affirmation.length });
    }

    const previewAff = document.getElementById('previewAffirmation');
    if (previewAff) previewAff.textContent = `"${affirmation}"`;
    updatePreview();
    triggerFoilSweep();
}

function updatePreview() {
    const senderInput = document.getElementById('senderName');
    const messageInput = document.getElementById('personalMessage');
    const recipientInput = document.getElementById('recipientName');
    
    if (!senderInput || !messageInput || !recipientInput) return;

    const senderName = senderInput.value || 'Someone special';
    const personalMessage = messageInput.value;
    const recipientName = recipientInput.value.trim();

    const previewSender = document.getElementById('previewSender');
    if (previewSender) previewSender.textContent = senderName;

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

    const previewMsg = document.getElementById('previewMessage');
    if (previewMsg) {
        previewMsg.textContent = '';
        if (personalMessage && personalMessage.trim()) {
            const strong = document.createElement('strong');
            strong.textContent = senderName;
            previewMsg.appendChild(strong);
            previewMsg.append(' added a personal note:');

            const noteDiv = document.createElement('div');
            noteDiv.className = 'preview-note-quote';
            noteDiv.textContent = `"${personalMessage.trim()}"`;
            previewMsg.appendChild(noteDiv);
        } else {
            const strong = document.createElement('strong');
            strong.textContent = senderName;
            previewMsg.appendChild(strong);
            previewMsg.append(' wanted to send you some good vibes ✨');
        }
    }
}

/**
 * Unified Card Preview (3D flip removed in favor of single-face responsive preview)
 */
function toggleCardPreviewFlip() {
    // 3D flip removed: personal note renders directly in card preview
}
window.toggleCardPreviewFlip = toggleCardPreviewFlip;

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
    if (window.VibeTelemetry) {
        window.VibeTelemetry.track('card_link_copied');
        window.VibeTelemetry.setTag('share_action', 'copy_link');
    }
}

async function textFriend(e) {
    const btn = e.currentTarget;
    const url = btn.dataset.url;
    const text = 'I sent you a Vibe Check! ✨ Open your card here:';

    if (window.VibeTelemetry) {
        window.VibeTelemetry.track('card_text_friend_clicked');
        window.VibeTelemetry.setTag('share_action', 'text_friend');
    }

    if (navigator.share) {
        try {
            await navigator.share({ title: 'The Vibe Check Project', text: text, url: url });
            return;
        } catch (err) {
            if (err.name === 'AbortError') return;
        }
    }

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const encodedText = encodeURIComponent(text + " " + url);
    window.location.href = isIOS ? `sms:&body=${encodedText}` : `sms:?body=${encodedText}`;
}

async function handleSenderSignup(e) {
    e.preventDefault();
    const emailInput = e.target.querySelector('input[type="email"]');
    const email = emailInput ? emailInput.value : '';
    const btn = e.target.querySelector('button');
    if (!btn) return;
    btn.textContent = 'Joining...';
    btn.disabled = true;

    if (window.VibeTelemetry) {
        window.VibeTelemetry.track('sender_newsletter_signup_started');
    }

    try {
        const PROXY_URL = 'https://vibe-check-proxy.caseagent72401.workers.dev/';
        const response = await fetch(PROXY_URL, {
            method: 'POST',
            mode: 'cors',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({ email: email, groups: ['180628908682512348'], fields: { signup_source: 'send-card-success' } })
        });
        if (response.ok) {
            e.target.innerHTML = '<p style="color:#FF6B9D;font-weight:600;font-size:15px;">✨ You\'re in! Check your inbox to confirm.</p>';
            if (window.VibeTelemetry) {
                window.VibeTelemetry.track('sender_newsletter_signup_success');
                window.VibeTelemetry.setTag('newsletter_subscriber', 'true');
            }
        } else {
            showSenderSignupError("Hmm, that didn't go through — please try again.");
            btn.textContent = 'Get Daily Vibes'; btn.disabled = false;
            if (window.VibeTelemetry) {
                window.VibeTelemetry.track('sender_newsletter_signup_error');
            }
        }
    } catch (err) {
        showSenderSignupError("Couldn't connect — check your connection and try again.");
        btn.textContent = 'Get Daily Vibes'; btn.disabled = false;
    }
}

function showSenderSignupError(msg) {
    const err = document.getElementById('senderSignupError');
    if (!err) return;
    err.textContent = msg;
    err.hidden = false;
}

// Stepper Logic
let currentStep = 1;
const totalSteps = 3;

function goToStep(step) {
    if (step > currentStep) {
        if (currentStep === 1 && !selectedAffirmation) {
            showToast('Choose an affirmation to continue ✨', '💌');
            const grid = document.querySelector('.affirmation-grid');
            if (grid) { grid.classList.remove('grid-shake'); void grid.offsetWidth; grid.classList.add('grid-shake'); setTimeout(() => grid.classList.remove('grid-shake'), 500); }
            return;
        }
    }

    const prevStep = currentStep;
    currentStep = step;

    if (window.VibeTelemetry) {
        window.VibeTelemetry.track('step_progressed', { from: prevStep, to: step });
        window.VibeTelemetry.setTag('send_flow_step', `step_${step}`);
    }

    document.querySelectorAll('.form-step').forEach((el, index) => {
        el.classList.toggle('active', index + 1 === currentStep);
    });
    refreshVideoThumbs();

    [1, 2, 3].forEach(n => {
        const wrap = document.getElementById('sn' + n);
        if (!wrap) return;
        wrap.classList.remove('sn-active', 'sn-done');
        if (n < currentStep) wrap.classList.add('sn-done');
        else if (n === currentStep) wrap.classList.add('sn-active');
    });
    [1, 2].forEach(n => {
        const conn = document.getElementById('sc' + n);
        if (conn) conn.classList.toggle('done', n < currentStep);
    });
}

// Main Initialization
document.addEventListener('DOMContentLoaded', () => {
    // 1. Initial UI setup
    renderCategoryTabs();
    renderAffirmationGrid(categoryDefs[0], false, true);

    const bgPickerEl = document.getElementById('bgPicker');
    if (bgPickerEl) {
        backgroundDefs.forEach((bg, index) => {
            const el = document.createElement('div');
            const isLocked = bg.premium && !isPremium;
            el.className = 'bg-option' + (isLocked ? ' bg-locked' : '') + (index === 0 ? ' selected' : '');
            el.dataset.bgId = bg.id;

            if (bg.isVideo) {
                // data-src: loaded only when the thumbnail scrolls into view (see lazyVideoThumbs)
                el.innerHTML = `
                    <div class="bg-thumb" style="background: #000; position: relative; overflow: hidden;">
                        <video data-src="${bg.image}" loop muted playsinline preload="none"
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
                el.onclick = () => {
                    if (window.VibeTelemetry) {
                        window.VibeTelemetry.track('premium_bg_attempt', { bg: bg.id, isVideo: bg.isVideo });
                    }
                    showPremModal('bg_' + bg.id, bg.isVideo ? '🎥 Live Animated Canvas' : `🎨 ${bg.label} Canvas`);
                };
            } else {
                el.onclick = () => selectBackground(bg.image, el, bg.isVideo);
            }
            bgPickerEl.appendChild(el);
        });
        lazyVideoThumbs(bgPickerEl);
    }

    // Initialize Occasion Presets & Motion Accessibility
    renderOccasionChips();
    initMotionControl();

    // Initialize preview background
    selectedBackground = backgroundDefs[0].image;
    const preview = document.getElementById('cardPreview');
    if (preview) {
        preview.style.backgroundImage = `url('${selectedBackground}')`;
        preview.style.backgroundSize = 'cover';
        preview.style.backgroundPosition = 'center';
        preview.style.borderColor = 'transparent';
    }

    // 2. Handle External Messages (CRITICAL: Runs after grid matches are built)
    handleExternalMessage();

    // 3. Handle applied occasion preset or premium custom affirmations
    if (window._appliedOccasion) {
        applyOccasionTemplate(window._appliedOccasion, true);
    } else if (window._externalMessage) {
        if (isPremium) {
            openWriteOwn();
            const ta = document.getElementById('writeOwnText');
            if (ta) ta.value = window._externalMessage;
        }
        updatePreview();
    }

    // 4. Default selection (Only if NO external message and NO occasion preset)
    const firstCard = pickerEl ? pickerEl.querySelector('.aff-card') : null;
    if (firstCard && !window._externalMessage && !window._appliedOccasion) {
        firstCard.click();
    } else if (window._externalMessage && pickerEl) {
        const cleanExt = window._externalMessage.replace(/^["']|["']$/g, '').trim();
        const matchingCard = [...pickerEl.querySelectorAll('.aff-card')].find(card => 
            card.textContent.replace(/^["']|["']$/g, '').trim() === cleanExt
        );
        if (matchingCard) {
            matchingCard.classList.add('selected');
        }
    }

    // A/B Test for Send Button CTA
    const sendBtn = document.getElementById('sendButton');
    if (sendBtn && window.VibeAB) {
        const ctaVariant = window.VibeAB.getVariant('send_btn_cta', ['Create Card ✨', 'Generate Free Vibe Check 💌']);
        sendBtn.textContent = ctaVariant;
    }

    // Event listeners
    const senderInput = document.getElementById('senderName');
    const messageInput = document.getElementById('personalMessage');
    const recipientInput = document.getElementById('recipientName');
    
    // Mirror recipient name to check-in reminder label
    if (recipientInput) {
        recipientInput.addEventListener('input', (e) => {
            const label = document.getElementById('reminderRecipientName');
            if (label) label.textContent = e.target.value.trim() || 'them';
        });
    }

    // Toggle reminder email input drawer
    const reminderToggle = document.getElementById('senderReminderToggle');
    const reminderDrawer = document.getElementById('reminderEmailSlide');
    if (reminderToggle && reminderDrawer) {
        reminderToggle.addEventListener('change', () => {
            reminderDrawer.style.display = reminderToggle.checked ? 'block' : 'none';
            if (reminderToggle.checked) {
                const emailInput = document.getElementById('senderReminderEmail');
                if (emailInput) emailInput.focus();
            }
        });
    }

    const updateEvents = ['input', 'change', 'compositionend'];
    [senderInput, messageInput, recipientInput].forEach(input => {
        if (input) {
            updateEvents.forEach(evt => input.addEventListener(evt, updatePreview));
        }
    });

    const cardForm = document.getElementById('cardForm');
    if (cardForm) {
        cardForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            if (!selectedAffirmation) {
                showToast('Pick an affirmation first — they need to hear something good!', '💌');
                goToStep(1);
                return;
            }

            // Paywall check: typing your own front affirmation is Premium. Curated
            // affirmations and messages handed over by our own pages (?message=) are free.
            if (!isPremium) {
                const cleanAff = (selectedAffirmation || '').replace(/^["']|["']$/g, '').trim();
                const allCurated = [
                    ...freeAffirmations,
                    ...categoryDefs.flatMap(c => c.affirmations || []),
                    ...occasionTemplates.map(t => t.affirmation),
                    ...(window._externalMessage ? [window._externalMessage] : [])
                ].map(a => a.replace(/^["']|["']$/g, '').trim());

                if (!allCurated.includes(cleanAff)) {
                    showToast('Writing your own custom affirmation is a Premium feature ✨', '🔒');
                    showPremModal('write_own', 'Custom Affirmation Composer');
                    const sendBtn = document.getElementById('sendButton');
                    if (sendBtn) {
                        sendBtn.disabled = false;
                        sendBtn.textContent = 'Create Card ✨';
                    }
                    goToStep(1);
                    return;
                }
            }

            const recipientName = document.getElementById('recipientName').value.trim().substring(0, LIMITS.name);
            if (!recipientName) {
                showToast("Add their name so they know it's for them 💖", '👤');
                const field = document.getElementById('recipientName');
                if (field) { field.classList.add('field-shake'); setTimeout(() => field.classList.remove('field-shake'), 500); field.focus(); }
                return;
            }
            
            const senderName = document.getElementById('senderName').value.trim().substring(0, LIMITS.name);
            const personalMessage = document.getElementById('personalMessage').value.trim().substring(0, LIMITS.note);
            const recipientEmail = document.getElementById('recipientEmail').value.trim();
            const wantsReminder = document.getElementById('senderReminderToggle')?.checked;
            const senderReminderEmail = document.getElementById('senderReminderEmail')?.value?.trim();

            if (wantsReminder && (!senderReminderEmail || !senderReminderEmail.includes('@'))) {
                showToast("Please enter your email for the 30-day reminder 📬", '✉️');
                const remEmail = document.getElementById('senderReminderEmail');
                if (remEmail) {
                    remEmail.classList.add('field-shake');
                    setTimeout(() => remEmail.classList.remove('field-shake'), 500);
                    remEmail.focus();
                }
                return;
            }

            if (sendBtn) {
                sendBtn.textContent = recipientEmail ? 'Sending... ✨' : 'Creating... ✨';
                sendBtn.disabled = true;
            }

            const cardId = (window.VibeHistory && typeof window.VibeHistory.generateId === 'function')
                ? window.VibeHistory.generateId()
                : ('vibe_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 8));

            const cardData = {
                id: cardId,
                affirmation: selectedAffirmation,
                recipientName: recipientName,
                senderName: senderName,
                personalMessage: personalMessage,
                sound: selectedSound,
                themeGroup: selectedThemeGroup,
                background: selectedBackground,
                createdAt: new Date().toISOString()
            };

            const encoded = btoa(encodeURIComponent(JSON.stringify(cardData)))
                .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); // base64url: URL-safe share links
            
            // Canonical share URL: External recipients (Email, SMS, WhatsApp) must ALWAYS receive the live public HTTPS URL
            const publicCardUrl = `https://thevibecheckproject.com/view-card.html?data=${encoded}`;
            const cardUrl = publicCardUrl;

            // Persist to Client-Side Sender History ("My Vibes")
            if (window.VibeHistory && typeof window.VibeHistory.save === 'function') {
                try {
                    window.VibeHistory.save({
                        id: cardId,
                        recipient: recipientName,
                        sender: senderName,
                        affirmation: selectedAffirmation,
                        theme: selectedThemeGroup,
                        sound: selectedSound,
                        message: personalMessage,
                        shareUrl: cardUrl,
                        createdAt: cardData.createdAt,
                        opened: false
                    });
                } catch (e) {
                    console.warn('VibeHistory save failed:', e);
                }
            }

            if (window.VibeCounter) window.VibeCounter.hit('cards-sent');

            // Telemetry: Card Created Milestone
            if (window.VibeTelemetry) {
                window.VibeTelemetry.track('card_created', {
                    hasPersonalMessage: !!personalMessage,
                    hasRecipientEmail: !!recipientEmail,
                    hasCheckinReminder: !!(wantsReminder && senderReminderEmail),
                    themeGroup: selectedThemeGroup,
                    sound: selectedSound,
                    isPremium: isPremium
                });
                window.VibeTelemetry.setTag('cards_created', '1+');
            }

            // Lead Capture Dispatch: If user checked 30-Day Check-in Reminder
            if (wantsReminder && senderReminderEmail) {
                fetch('https://vibe-check-proxy.caseagent72401.workers.dev/', {
                    method: 'POST',
                    mode: 'cors',
                    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                    body: JSON.stringify({
                        email: senderReminderEmail,
                        groups: ['180628908682512348'],
                        fields: {
                            name: senderName || '',
                            signup_source: 'send-card-checkin-30d',
                            recipient_checked: recipientName || 'Friend'
                        }
                    })
                }).then(() => {
                    if (window.VibeTelemetry) {
                        window.VibeTelemetry.track('checkin_reminder_registered', { recipient: recipientName });
                        window.VibeTelemetry.setTag('reminder_subscriber', 'true');
                    }
                    const postSendForm = document.getElementById('senderSignupForm');
                    if (postSendForm) {
                        const done = document.createElement('p');
                        done.style.cssText = 'color:#a3e635;font-weight:600;font-size:14px;padding:8px 0;';
                        done.textContent = `✓ 30-Day Reminder set for ${recipientName || 'your friend'}! Check your inbox for confirmation & free wallpapers.`;
                        postSendForm.replaceChildren(done);
                    }
                }).catch(err => console.error('Reminder registration error:', err));
            }

            let emailSentOK = false;
            if (recipientEmail && typeof emailjs !== 'undefined') {
                try {
                    // Personal note rendered inside the email template's quote block
                    const noteForEmail = (personalMessage && personalMessage.trim())
                        ? personalMessage.trim()
                        : (selectedAffirmation || 'Wanted to send some good vibes your way today ✨');

                    await emailjs.send('service_cn9gjbv', 'template_bpj8rue', {
                        to_email: recipientEmail,
                        to_name: recipientName || 'Friend',
                        from_name: senderName || 'Someone special',
                        sender_name: senderName || 'Someone special',
                        message: noteForEmail,
                        personal_message: noteForEmail,
                        affirmation: selectedAffirmation || '',
                        card_link: cardUrl,
                        card_url: cardUrl,
                        cardUrl: cardUrl,
                        cardLink: cardUrl,
                        link: cardUrl,
                        url: cardUrl,
                        action_url: cardUrl,
                        view_card_url: cardUrl,
                        card_link_url: cardUrl,
                        card: cardUrl,
                        card_data: encoded,
                        href: cardUrl
                    });
                    emailSentOK = true;
                    if (window.VibeTelemetry) window.VibeTelemetry.track('card_email_sent_success');
                } catch (err) {
                    console.error('EmailJS error:', err);
                    if (window.VibeTelemetry) window.VibeTelemetry.track('card_email_sent_failed');
                }
            }

            if (cardForm) cardForm.style.display = 'none';
            const stepInd = document.getElementById('stepIndicator');
            if (stepInd) stepInd.style.display = 'none';
            const successMsg = document.getElementById('successMessage');
            if (successMsg) successMsg.classList.add('show');
            const historyNotice = document.getElementById('historySavedNotice');
            if (historyNotice) {
                historyNotice.style.display = 'flex';
                const countBadge = document.getElementById('historyCountBadge');
                if (countBadge && window.VibeHistory) {
                    const total = window.VibeHistory.getAll().length;
                    countBadge.textContent = total > 1 ? `${total} vibes saved` : '1 vibe saved';
                }
            }
            const cardLinkInput = document.getElementById('cardLink');
            if (cardLinkInput) cardLinkInput.value = cardUrl;
            launchConfetti();

            if (emailSentOK) {
                const sTitle = document.getElementById('successTitle');
                if (sTitle) sTitle.textContent = 'Card Sent! 💚';
                const sSub = document.getElementById('successSubtext');
                if (sSub) sSub.textContent = `Your Vibe Check is on its way.`;
                const eBadge = document.getElementById('emailSentBadge');
                if (eBadge) eBadge.style.display = 'inline-flex';
                const eTo = document.getElementById('emailSentTo');
                if (eTo) eTo.textContent = recipientName || recipientEmail;
            } else if (recipientEmail) {
                const sSub = document.getElementById('successSubtext');
                if (sSub) sSub.textContent = `Hmm — the email didn't go through, but your card is ready below. Copy the link to send it instead.`;
            }

            const shareText = encodeURIComponent('I sent you a Vibe Check! ✨ Open your card here:');
            const shareUrl = encodeURIComponent(cardUrl);
            const waShare = document.getElementById('whatsappShare');
            if (waShare) {
                waShare.href = `https://wa.me/?text=${shareText}%20${shareUrl}`;
                waShare.onclick = () => { if (window.VibeTelemetry) window.VibeTelemetry.track('card_shared_whatsapp'); };
            }
            const twShare = document.getElementById('twitterShare');
            if (twShare) {
                twShare.href = `https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`;
                twShare.onclick = () => { if (window.VibeTelemetry) window.VibeTelemetry.track('card_shared_twitter'); };
            }
            const tShare = document.getElementById('textShare');
            if (tShare) tShare.dataset.url = cardUrl;
        });
    }

    // Keyboard accessibility for sound options
    document.querySelectorAll('.sound-option').forEach(opt => {
        if (!opt.hasAttribute('tabindex')) opt.setAttribute('tabindex', '0');
        if (!opt.hasAttribute('role')) opt.setAttribute('role', 'button');
        opt.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                opt.click();
            }
        });
    });

    // Premium modal backdrop listener (accessible delegation)
    const premOverlay = document.getElementById('premOverlay');
    if (premOverlay) {
        premOverlay.addEventListener('click', (e) => {
            if (e.target === premOverlay) hidePremModal();
        });
    }
});

