// Data, Premium state and sending for send-card.html. The card-making UI (carousel,
// portal, words, note panel, Send flight) lives in js/card-flow.js and writes the
// selected* variables below; the submit handler at the bottom builds and sends the card.

// ── Safe storage (Safari private mode / blocked storage throws on access) ──
function storageGet(key) {
    try { return window.localStorage.getItem(key); } catch (e) { return null; }
}
function storageSet(key, val) {
    try { window.localStorage.setItem(key, val); } catch (e) { }
}

// ── Global State ──
// let, not const: an older tab unlocks in place when a purchase finishes in another tab
let isPremium = storageGet('premium_unlocked') === '1';

// Payload limits (also enforced by view-card.html; see docs/README.md "Card links")
const LIMITS = { name: 50, affirmation: 280, note: 500 };
const WRITE_OWN_MAX = 200;
const CHECKIN_GROUP_ID = '199536380251997858'; // MailerLite group "30-Day Check-ins"

let selectedAffirmation = '';
let selectedSound = 'chime';
let selectedThemeGroup = 'default';
let selectedBackground = '';

// Reduced motion: the visitor's system setting, or the Motion toggle saved by the classic form
const isReducedMotion = (function () {
    const stored = storageGet('vibe_reduced_motion');
    if (stored !== null) return stored === '1';
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
})();

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

// ?preset= aliases
const OCCASION_ALIASES = {
    hard_day: 'tough_day', bad_day: 'tough_day', breakup: 'tough_day',
    hype: 'proud', celebrate: 'proud',
    thank_you: 'gratitude', love: 'gratitude',
    anxiety: 'calm', panic: 'calm', burnout: 'calm',
    grief: 'healing', loss: 'healing', illness: 'healing', sympathy: 'healing'
};

function findOccasionTemplate(templateId) {
    let resolvedId = (templateId || '').toLowerCase().replace(/-/g, '_');
    resolvedId = OCCASION_ALIASES[resolvedId] || resolvedId;
    return occasionTemplates.find(t => t.id === resolvedId) || null;
}

// A preset picks the card, the words and the sound; the portal flow shows them
function applyOccasionTemplate(templateId, isAutoFromUrl = false) {
    const template = findOccasionTemplate(templateId);
    if (!template) return;
    const personalMsg = document.getElementById('personalMessage');
    if (personalMsg && !personalMsg.value.trim() && template.notePlaceholder) {
        personalMsg.placeholder = template.notePlaceholder;
    }
    if (window.CardFlow) window.CardFlow.applyPreset(template, isAutoFromUrl);
    if (window.VibeTelemetry) {
        window.VibeTelemetry.track('occasion_template_applied', {
            template: templateId,
            isAutoFromUrl: isAutoFromUrl
        });
    }
}

// Stripe premium return is handled centrally in core-utils.js (runs before this script).

// --- Read message, recipient, and occasion from URL and pre-fill ---
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
        const reminderName = document.getElementById('reminderRecipientName');
        if (reminderName) reminderName.textContent = cleanRec || 'them';

        const banner = document.getElementById('viralReplyBanner');
        const bannerName = document.getElementById('viralReplyName');
        // "Replying with love" only for replies to a received card; the 30-day check-in
        // email also passes ?to= but that isn't a reply
        if (banner && bannerName && isViralReply) {
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
        if (pInput) pInput.value = cleanNote;
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

// More free sets (from the homepage's affirmations, read for honesty and for how they land on
// someone having a hard time; near-duplicates of other sets left out)
const FREE_WORD_SETS = [
    {
        id: 'grounding', name: 'Grounding',
        items: [
            "Breathe. You're exactly where you need to be.",
            "It's okay to not have it all figured out.",
            "You're not behind. You're on your own timeline.",
            "Progress isn't always visible, but it's always happening.",
            "Let today be today. You can carry tomorrow when it arrives.",
            "You don't have to control everything; just breathe through this moment.",
            "You are worthy of quiet moments that ask nothing of you.",
            "Not every thought deserves your full energy today.",
            "It's brave to ask for help.",
            "It's okay to outgrow things that once fit you."
        ]
    },
    {
        id: 'worth', name: 'Worth',
        items: [
            "You are allowed to take up space.",
            "You don't have to earn the right to be loved.",
            "Your story isn't over. Keep going.",
            "You are more resilient than you realize.",
            "You bring something to this world that no one else can.",
            "Your best is always enough.",
            "The people who love you aren't keeping score.",
            "Someone needs exactly the energy you bring.",
            "You are worthy of good things happening to you.",
            "You are capable of navigating hard things with grace."
        ]
    }
];

// Free "situations" (written for the portal flow): what's going on for the person you're writing to
const SITUATIONS = [
    { id: 'went-quiet', name: 'Went Quiet' },
    { id: 'strong-friend', name: 'Strong Friend' },
    { id: 'anxious', name: 'Anxious' },
    { id: 'giving-up', name: 'Hopeless' },
    { id: 'big-risk', name: 'Big Leap' }
];
const situationAffirmations = [
    { text: "You don't have to carry the whole world today. Rest is productive.", vibe: "Permission to pause", sit: "strong-friend" },
    { text: "This feeling is heavy, but it is temporary. Breathe through the next hour.", vibe: "Reassurance", sit: "anxious" },
    { text: "It takes so much strength to show up anyway. I see all the effort you put in.", vibe: "Quiet validation", sit: "strong-friend" },
    { text: "Small steps still move you forward. Give yourself credit for trying.", vibe: "Gentle progress", sit: "anxious" },
    { text: "You are allowed to fall apart right now. I'll help pick up the pieces later.", vibe: "Safe harbor", sit: "giving-up" },
    { text: "Walk in there like you already belong, because you do.", vibe: "Unapologetic hype", sit: "big-risk" },
    { text: "Your presence makes a difference, even when you don't see it.", vibe: "Quiet impact", sit: "went-quiet" },
    { text: "Breathe. You only have to handle this one single moment.", vibe: "Grounding", sit: "anxious" },
    { text: "Healing isn't linear, and every quiet day still counts as healing.", vibe: "Patience", sit: "went-quiet" },
    { text: "You are enough, exactly as you are right now in this exact second.", vibe: "Pure acceptance", sit: "went-quiet" },
    { text: "Allow yourself to be proud of how far you've come in silence.", vibe: "Quiet strength", sit: "strong-friend" },
    { text: "Even the darkest nights eventually give way to a gentle sunrise.", vibe: "Hope", sit: "giving-up" },
    { text: "Your worth is not measured by your productivity or how much you get done.", vibe: "Zero guilt", sit: "strong-friend" },
    { text: "Be gentle with yourself. You are doing the best you can with what you have.", vibe: "Self-compassion", sit: "went-quiet" },
    { text: "It is okay to put down burdens that were never yours to carry in the first place.", vibe: "Release", sit: "strong-friend" },
    { text: "A single heavy day does not erase all the light you carry inside.", vibe: "Steady warmth", sit: "giving-up" },
    { text: "Trust the timing of your life. You are exactly where you need to be.", vibe: "Trust", sit: "big-risk" },
    { text: "Your resilience is quiet, but it has brought you through every hard day so far.", vibe: "Resilience", sit: "giving-up" },
    { text: "Take a deep breath and let your shoulders drop. You are safe here.", vibe: "Safe space", sit: "anxious" },
    { text: "Someone is deeply grateful that you exist in this world.", vibe: "True gratitude", sit: "went-quiet" }
];

// ── Sounds (played on view-card when the card opens) ──
const SOUND_DEFS = [
    { id: 'chime', label: 'Chime', icon: '🔔', premium: false },
    { id: 'bell', label: 'Soft Bell', icon: '🛎️', premium: false },
    { id: 'sparkle', label: 'Sparkle', icon: '✨', premium: false },
    { id: 'musicbox', label: 'Music Box', icon: '🎵', premium: true },
    { id: 'harp', label: 'Harp', icon: '🎶', premium: true },
    { id: 'piano', label: 'Warm Piano', icon: '🎹', premium: true },
    { id: 'celebration', label: 'Celebration', icon: '🎉', premium: true },
    { id: 'ocean', label: 'Ocean', icon: '🌊', premium: true }
];

function selectSound(soundId) {
    const def = SOUND_DEFS.find(s => s.id === soundId);
    if (!def) return false;
    if (def.premium && !isPremium) {
        if (window.VibeTelemetry) window.VibeTelemetry.track('premium_sound_attempt', { sound: soundId });
        showPremModal('sound_' + soundId, `The ${def.label} sound`);
        return false;
    }
    selectedSound = soundId;
    if (window.VibeTelemetry) window.VibeTelemetry.track('sound_selected', { sound: soundId });
    return true;
}

function previewSound(soundId) {
    soundEngine.play(soundId);
    if (window.VibeTelemetry) {
        window.VibeTelemetry.track('sound_previewed', { sound: soundId });
    }
}

// ── Affirmation collections (General free; the rest Premium) ──
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

// Words a free user may send: the free sets, the presets and a ?message= from our own pages.
// The Premium collections and anything typed are Premium.
const cleanWords = (a) => (a || '').replace(/^["']|["']$/g, '').trim();
function isFreeWords(text) {
    const clean = cleanWords(text);
    return [
        ...freeAffirmations,
        ...FREE_WORD_SETS.flatMap(s => s.items),
        ...situationAffirmations.map(a => a.text),
        ...occasionTemplates.map(t => t.affirmation),
        ...(window._externalMessage ? [window._externalMessage] : [])
    ].some(a => cleanWords(a) === clean);
}
function isCollectionWords(text) {
    const clean = cleanWords(text);
    return categoryDefs.some(c => c.premium && c.affirmations.some(a => cleanWords(a) === clean));
}

// ── Premium sheet (#premOverlay) ──
let _prevFocusedBeforePrem = null;
let _premOpenedAt = 0;

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
        } else if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
        }
    }
}

// what = the thing they tapped, e.g. "Nebula" or "Writing your own words"
function showPremModal(context = 'general', what = '') {
    const overlay = document.getElementById('premOverlay');
    if (!overlay) return;
    const text = document.getElementById('premSheetText');
    if (text) text.textContent = what
        ? `${what} is part of Premium, along with everything below.`
        : 'One small purchase unlocks everything below.';
    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');
    _premOpenedAt = performance.now();
    _prevFocusedBeforePrem = document.activeElement;
    document.addEventListener('keydown', handlePremModalKeydown);
    const cta = document.getElementById('premCtaBtn');
    if (cta) setTimeout(() => cta.focus(), 50);
    if (window.VibeTelemetry) {
        window.VibeTelemetry.track('premium_modal_opened', { trigger: context });
        window.VibeTelemetry.setTag('last_premium_trigger', context);
    }
}

function hidePremModal() {
    const overlay = document.getElementById('premOverlay');
    if (overlay) {
        overlay.classList.remove('open');
        overlay.setAttribute('aria-hidden', 'true');
    }
    document.removeEventListener('keydown', handlePremModalKeydown);
    if (_prevFocusedBeforePrem && typeof _prevFocusedBeforePrem.focus === 'function') {
        _prevFocusedBeforePrem.focus();
        _prevFocusedBeforePrem = null;
    }
    if (window.VibeTelemetry) {
        window.VibeTelemetry.track('premium_modal_dismissed');
    }
}

// ── Backgrounds (the carousel's cards). `light` = colours of the portal's particles ──
const backgroundDefs = [
    { id: 'sunset', label: 'Sunset', image: 'assets/backgrounds/bg_free_sunset_1772750341964.webp', premium: false, light: ['#FFB36B', '#FF6B9D', '#FFE9C7'] },
    { id: 'dawn', label: 'Dawn', image: 'assets/backgrounds/bg_free_dawn_1772750358328.webp', premium: false, light: ['#FFD59E', '#F6A5C0', '#FFF6DC'] },
    { id: 'aurora', label: 'Aurora', image: 'assets/backgrounds/bg_free_aurora_1772750371136.webp', premium: false, light: ['#7CF2C8', '#A78BFA', '#E8FFF7'] },
    { id: 'rose', label: 'Rose Garden', image: 'assets/backgrounds/bg_free_rose_1772750381958.webp', premium: false, light: ['#FF8FB1', '#FFC2D4', '#FFF1F6'] },
    { id: 'sage', label: 'Sage', image: 'assets/backgrounds/bg_free_sage.webp', premium: false, light: ['#C8D8C0', '#9AAE9F', '#FFF4DE'] },
    { id: 'sand', label: 'Sand', image: 'assets/backgrounds/bg_free_sand.webp', premium: false, light: ['#E8D5B5', '#CDBBA0', '#FFF6E4'] },
    { id: 'slate', label: 'Slate', image: 'assets/backgrounds/bg_free_slate.webp', premium: false, light: ['#B8C4D6', '#8FA3BF', '#F1F4FA'] },
    { id: 'nebula', label: 'Nebula', image: 'assets/backgrounds/bg_prem_nebula_1772750433414.webp', premium: true, light: ['#8B5CF6', '#60A5FA', '#F0ABFC'] },
    { id: 'gold', label: 'Liquid Gold', image: 'assets/backgrounds/bg_prem_gold_1772750445716.webp', premium: true, light: ['#FEC84A', '#FFE9A8', '#FFF6DC'] },
    { id: 'emerald', label: 'Emerald', image: 'assets/backgrounds/bg_prem_emerald_1772750461402.webp', premium: true, light: ['#34D399', '#A7F3D0', '#ECFDF5'] },
    { id: 'electric', label: 'Electric', image: 'assets/backgrounds/bg_prem_electric_1772750473780.webp', premium: true, light: ['#60A5FA', '#22D3EE', '#E0F2FE'] },
    { id: 'velvet', label: 'Velvet Night', image: 'assets/backgrounds/bg_prem_velvet_1772750498877.webp', premium: true, light: ['#C084FC', '#FF6B9D', '#F6E6FF'] },
    { id: 'cherry', label: 'Cherry', image: 'assets/backgrounds/bg_prem_cherry_1772750510659.webp', premium: true, light: ['#FB7185', '#FDA4AF', '#FFF1F2'] },
    { id: 'ocean', label: 'Ocean', image: 'assets/backgrounds/bg_prem_ocean_1772750521461.webp', premium: true, light: ['#38BDF8', '#67E8F9', '#E0F7FF'] },
    { id: 'crystal', label: 'Crystal', image: 'assets/backgrounds/bg_prem_crystal_1772750533689.webp', premium: true, light: ['#C4B5FD', '#A5F3FC', '#FFFFFF'] },
    { id: 'ethereal_anim', label: 'Ethereal Silk', image: 'assets/backgrounds/animated_ethereal.mp4', premium: true, isVideo: true, light: ['#E9D5FF', '#FBCFE8', '#FFFFFF'] },
    { id: 'vibrant_anim', label: 'Golden Glow', image: 'assets/backgrounds/animated_vibrant.mp4', premium: true, isVideo: true, light: ['#FEC84A', '#FB923C', '#FFF6DC'] },
    { id: 'modern_anim', label: 'Glass Crystals', image: 'assets/backgrounds/animated_modern.mp4', premium: true, isVideo: true, light: ['#A5F3FC', '#C4B5FD', '#FFFFFF'] },
    { id: 'prism_anim', label: 'Prism Flow', image: 'assets/backgrounds/Iridescent_Liquid_Glass_Video_Generation.mp4', premium: true, isVideo: true, light: ['#F0ABFC', '#67E8F9', '#FFFFFF'] },
    { id: 'biolume_anim', label: 'Biolume Bloom', image: 'assets/backgrounds/Futuristic_Flower_Video_Generation.mp4', premium: true, isVideo: true, light: ['#34D399', '#F0ABFC', '#ECFDF5'] },
    { id: 'plasma_anim', label: 'Sunstone Plasma', image: 'assets/backgrounds/Solar_Plasma_and_Flares_Visualization.mp4', premium: true, isVideo: true, light: ['#FB923C', '#FACC15', '#FFE4C7'] },
];
selectedBackground = backgroundDefs[0].image;

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


// ── Wiring ──
let isSending = false;

document.addEventListener('DOMContentLoaded', () => {
    handleExternalMessage();

    // Mirror recipient name to check-in reminder label
    const recipientInput = document.getElementById('recipientName');
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

    const shake = (field) => {
        if (!field) return;
        field.classList.add('field-shake');
        setTimeout(() => field.classList.remove('field-shake'), 500);
        field.focus();
    };

    const cardForm = document.getElementById('cardForm');
    const sendBtn = document.getElementById('sendButton');
    if (cardForm) {
        cardForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            if (isSending) return;

            if (!selectedAffirmation) {
                showToast('Pick an affirmation first — they need to hear something good!', '💌');
                if (window.CardFlow) window.CardFlow.backToWords();
                return;
            }

            // Paywall: free users send the free sets, presets and ?message= text from our own
            // pages. The Premium collections and words they typed themselves are Premium.
            if (!isPremium && !isFreeWords(selectedAffirmation)) {
                const collection = isCollectionWords(selectedAffirmation);
                showToast(collection ? 'That collection is part of Premium ✨' : 'Writing your own words is a Premium feature ✨', '🔒');
                showPremModal(collection ? 'collection_at_send' : 'write_own', collection ? 'This collection' : 'Writing your own words');
                return;
            }
            // The same for a Premium card or sound, however it was reached
            const bgDef = backgroundDefs.find(b => b.image === selectedBackground);
            const soundDef = SOUND_DEFS.find(s => s.id === selectedSound);
            if (!isPremium && bgDef && bgDef.premium) {
                showToast(`${bgDef.label} is a Premium card ✨`, '🔒');
                showPremModal('bg_at_send', bgDef.label);
                return;
            }
            if (!isPremium && soundDef && soundDef.premium) {
                showToast(`The ${soundDef.label} sound is part of Premium ✨`, '🔒');
                showPremModal('sound_at_send', `The ${soundDef.label} sound`);
                return;
            }

            const recipientCheck = document.getElementById('recipientName').value.trim();
            if (!recipientCheck) {
                showToast("Add their name so they know it's for them 💖", '👤');
                shake(document.getElementById('recipientName'));
                return;
            }
            const wantsReminderCheck = document.getElementById('senderReminderToggle')?.checked;
            const reminderEmailCheck = document.getElementById('senderReminderEmail')?.value?.trim();
            if (wantsReminderCheck && (!reminderEmailCheck || !reminderEmailCheck.includes('@'))) {
                showToast("Please enter your email for the 30-day reminder 📬", '✉️');
                shake(document.getElementById('senderReminderEmail'));
                return;
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

            if (sendBtn) sendBtn.disabled = true;
            isSending = true;
            // The paper plane flies while the card is built, saved and emailed
            const flight = window.CardFlow ? window.CardFlow.playSend() : Promise.resolve();

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
                        // "30-Day Check-ins" group only: a MailerLite automation sends one email
                        // after 30 days (docs/email/checkin-30-day.html). Not the daily-email group,
                        // since they asked for a reminder, not a newsletter.
                        groups: [CHECKIN_GROUP_ID],
                        fields: {
                            name: senderName || '',
                            signup_source: 'send-card-checkin-30d',
                            recipient_checked: recipientName || ''
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
                        done.textContent = `✓ We'll email you in 30 days to check in on ${recipientName || 'them'}.`;
                        postSendForm.replaceChildren(done);
                    }
                }).catch(err => console.error('Reminder registration error:', err));
            }

            let emailSentOK = false;
            if (recipientEmail && typeof emailjs !== 'undefined') {
                try {
                    // The email never gives away what's inside: no affirmation, no note. They're a
                    // surprise for when the card is opened. (The EmailJS template shows {{message}}.)
                    const noteForEmail = "It's waiting for you inside. Open it when you have a quiet moment.";

                    await emailjs.send('service_cn9gjbv', 'template_bpj8rue', {
                        to_email: recipientEmail,
                        to_name: recipientName || 'there', // "Hi there," in docs/email/emailjs-card-email.html
                        from_name: senderName || 'Someone special',
                        sender_name: senderName || 'Someone special',
                        message: noteForEmail,
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
                        href: cardUrl
                    });
                    emailSentOK = true;
                    if (window.VibeTelemetry) window.VibeTelemetry.track('card_email_sent_success');
                } catch (err) {
                    console.error('EmailJS error:', err);
                    if (window.VibeTelemetry) window.VibeTelemetry.track('card_email_sent_failed');
                }
            }

            await flight;
            if (window.CardFlow) window.CardFlow.showSuccess();
            const successMsg = document.getElementById('successMessage');
            if (successMsg) successMsg.classList.add('show');
            const historyNotice = document.getElementById('historySavedNotice');
            if (historyNotice) {
                historyNotice.style.display = 'block';
                const countBadge = document.getElementById('historyCountBadge');
                if (countBadge && window.VibeHistory) {
                    const total = window.VibeHistory.getAll().length;
                    countBadge.textContent = total > 1 ? `${total} vibes saved` : '1 vibe saved';
                }
            }
            const cardLinkInput = document.getElementById('cardLink');
            if (cardLinkInput) cardLinkInput.value = cardUrl;
            const readyTitle = document.getElementById('successTitle');
            if (readyTitle) readyTitle.textContent = `Your card for ${recipientName} is ready`;

            if (emailSentOK) {
                const sTitle = document.getElementById('successTitle');
                if (sTitle) sTitle.textContent = `On its way to ${recipientName}`;
                const sSub = document.getElementById('successSubtext');
                if (sSub) sSub.textContent = 'We emailed them the card. You can share the link too.';
                const eBadge = document.getElementById('emailSentBadge');
                if (eBadge) eBadge.style.display = 'block';
                const eTo = document.getElementById('emailSentTo');
                if (eTo) eTo.textContent = recipientName || recipientEmail;
            } else if (recipientEmail) {
                const sSub = document.getElementById('successSubtext');
                if (sSub) sSub.textContent = "The email didn't go through, but your card is ready. Copy the link to send it yourself.";
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

    // Premium sheet: backdrop closes it (not in the same moment it opened)
    const premOverlay = document.getElementById('premOverlay');
    if (premOverlay) {
        premOverlay.addEventListener('click', (e) => {
            if (e.target === premOverlay && performance.now() - _premOpenedAt > 400) hidePremModal();
        });
    }
});
