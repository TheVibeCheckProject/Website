/**
 * THE VIBE CHECK PROJECT — today's affirmation, the streak and the kept collection (window.VibeDaily)
 *
 * Everything lives in this browser (localStorage "vc_daily"); nothing is sent anywhere.
 *   opened: { "2026-11-10": { text, hour, mood? } }   one entry per day the visitor opened the card
 *   kept:   ["2026-11-10", …]                          days they chose to keep (shown in My Vibes)
 *
 * Today's words are the same ones the daily email carries (newsletter-content/batch.json, which
 * is published with the site). If today isn't in the batch, a fixed list is used, picked by date
 * so every visitor still sees the same words on the same day.
 */
(function () {
    'use strict';

    const KEY = 'vc_daily';
    const MAX_DAYS = 400;

    // Used only when the newsletter batch has no entry for the date
    const FALLBACK = [
        "You're trying, and that's what counts.",
        "Your feelings are valid, and you deserve to be heard.",
        "Every new day is a fresh chance to try again.",
        "You're doing better than you think you are.",
        "Your presence makes a difference, even when you don't see it.",
        "Rest is not weakness. It's essential.",
        "You are allowed to take up space.",
        "It's okay to not have it all figured out.",
        "You don't have to earn the right to be loved.",
        "Your story isn't over. Keep going.",
        "You are more resilient than you realize.",
        "You are enough, exactly as you are right now.",
        "It's brave to ask for help.",
        "Healing isn't linear, and that's okay.",
        "Small steps on solid ground still move you forward.",
        "Let today be today. You can carry tomorrow when it arrives.",
        "You are worthy of quiet moments that ask nothing of you.",
        "Not every thought deserves your full energy today.",
        "You deserve the same gentleness you give to others.",
        "Your worth is not measured by your productivity.",
    ];

    // Words for the vibe check, by how the visitor says they feel
    const MOODS = {
        heavy: {
            label: 'Heavy', sky: 'The sky pulled a blanket over.',
            words: [
                "You don't have to carry all of it today. Just the next small piece.",
                "Heavy days still end. This one will too.",
                "You are allowed to move slowly through this.",
                "Being here, still trying, is enough for today.",
            ],
            guide: { href: 'blog/self-care-ideas-for-bad-mental-health-days.html', text: 'Self-care ideas for bad days' },
        },
        restless: {
            label: 'Restless', sky: 'The wind picked up.',
            words: [
                "Breathe. You only have to do this one moment at a time.",
                "Not every thought deserves your full energy today.",
                "You don't have to solve everything tonight.",
                "Your mind is loud right now. You are still safe.",
            ],
            guide: { href: 'blog/daily-affirmations-for-anxiety.html', text: 'Affirmations for anxious moments' },
        },
        tired: {
            label: 'Worn out', sky: 'The light went soft.',
            words: [
                "Rest is not weakness. It's essential.",
                "You've done enough for today. You can stop.",
                "Your worth is not measured by your productivity.",
                "It's okay to put it down and pick it up tomorrow.",
            ],
            guide: { href: 'blog/mindfulness-exercises-for-beginners.html', text: 'Gentle mindfulness for beginners' },
        },
        steady: {
            label: 'Steady', sky: 'A few clouds, nothing to worry about.',
            words: [
                "Small steps on solid ground still move you forward.",
                "You're doing better than you think you are.",
                "Let today be today.",
                "Quiet progress is still progress.",
            ],
            guide: { href: 'blog/why-you-should-send-affirmations-for-no-reason.html', text: 'Why a kind word for no reason matters' },
        },
        bright: {
            label: 'Bright', sky: 'The sky cleared right up.',
            words: [
                "Let yourself enjoy this. You don't have to earn a good day.",
                "Your joy takes nothing away from anyone.",
                "Notice this feeling. It belongs to you.",
                "Good days are worth passing on.",
            ],
            guide: { href: 'blog/how-to-celebrate-a-friends-success.html', text: "How to celebrate someone else's good news" },
        },
    };

    const pad = (n) => String(n).padStart(2, '0');
    const dateKey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const fromKey = (key) => { const [y, m, d] = key.split('-').map(Number); return new Date(y, m - 1, d); };
    const dayNumber = (key) => Math.round(fromKey(key).getTime() / 86400000);

    function load() {
        try {
            const s = JSON.parse(localStorage.getItem(KEY) || '{}');
            return { opened: s.opened && typeof s.opened === 'object' ? s.opened : {}, kept: Array.isArray(s.kept) ? s.kept : [] };
        } catch (e) { return { opened: {}, kept: [] }; }
    }
    function save(state) {
        const days = Object.keys(state.opened).sort();
        const kept = new Set(state.kept);
        // Old days that weren't kept are dropped first
        for (const d of days.slice(0, Math.max(0, days.length - MAX_DAYS))) if (!kept.has(d)) delete state.opened[d];
        try { localStorage.setItem(KEY, JSON.stringify(state)); return true; } catch (e) { return false; }
    }

    function fallbackFor(key) {
        const n = dayNumber(key);
        return { date: key, text: FALLBACK[((n % FALLBACK.length) + FALLBACK.length) % FALLBACK.length], reflection: '' };
    }

    let batchPromise = null;
    /** Today's (or any date's) words. Resolves quickly: the fetch gets 2.5 s, then the fixed list. */
    function wordsFor(key = dateKey(), root = '') {
        const stored = load().opened[key];
        if (stored && stored.text) return Promise.resolve({ date: key, text: stored.text, reflection: stored.reflection || '' });
        if (!batchPromise) {
            const controller = typeof AbortController === 'function' ? new AbortController() : null;
            const timer = setTimeout(() => controller && controller.abort(), 2500);
            batchPromise = fetch(root + 'newsletter-content/batch.json', controller ? { signal: controller.signal } : undefined)
                .then(r => (r.ok ? r.json() : null))
                .catch(() => null)
                .finally(() => clearTimeout(timer));
        }
        return batchPromise.then(batch => {
            const entry = batch && Array.isArray(batch.emails) ? batch.emails.find(e => e && e.date === key) : null;
            const text = entry && typeof entry.affirmation === 'string' ? entry.affirmation.trim() : '';
            if (!text || text.length > 280) return fallbackFor(key);
            const reflection = typeof entry.reflection === 'string' ? entry.reflection.trim().slice(0, 300) : '';
            return { date: key, text, reflection };
        });
    }

    /** Record that today's card was opened (first open of the day wins). */
    function markOpened(key, text, hour, reflection) {
        const state = load();
        const first = !state.opened[key];
        if (first) state.opened[key] = { text, hour: Math.round(hour * 100) / 100, reflection: reflection || '' };
        save(state);
        return first;
    }
    function setMood(key, mood) {
        const state = load();
        if (!state.opened[key]) state.opened[key] = { text: '', hour: new Date().getHours() };
        state.opened[key].mood = mood;
        save(state);
    }

    /** One day's record, or null: { text, hour, reflection, mood } */
    function entry(key) { return load().opened[key] || null; }

    function isKept(key) { return load().kept.includes(key); }
    function toggleKept(key) {
        const state = load();
        const i = state.kept.indexOf(key);
        if (i >= 0) state.kept.splice(i, 1); else if (state.opened[key] && state.opened[key].text) state.kept.push(key);
        save(state);
        return state.kept.includes(key);
    }

    /** Days in a row ending today (or yesterday, so the count shows before today's card is opened). */
    function streak(today = dateKey()) {
        const opened = load().opened;
        const has = (k) => !!(opened[k] && opened[k].text);
        const d = fromKey(today);
        if (!has(today)) d.setDate(d.getDate() - 1);
        let n = 0;
        while (has(dateKey(d))) { n++; d.setDate(d.getDate() - 1); }
        return n;
    }

    /** The last `count` days, oldest first: [{ key, date, opened, mood, today }] */
    function week(count = 7, today = dateKey()) {
        const opened = load().opened;
        const out = [];
        const d = fromKey(today);
        d.setDate(d.getDate() - (count - 1));
        for (let i = 0; i < count; i++) {
            const key = dateKey(d);
            const e = opened[key];
            out.push({ key, date: new Date(d), opened: !!(e && e.text), mood: e ? e.mood || '' : '', today: key === today });
            d.setDate(d.getDate() + 1);
        }
        return out;
    }

    /** Kept days, newest first: [{ key, date, text, hour, mood }] */
    function kept() {
        const state = load();
        return state.kept.filter(k => state.opened[k] && state.opened[k].text).sort().reverse()
            .map(k => ({ key: k, date: fromKey(k), ...state.opened[k] }));
    }

    function longDate(d) {
        return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    }

    /** Save an affirmation image, or hand it to the phone's share sheet. */
    function downloadImage(canvas, filename) {
        return new Promise((resolve) => {
            canvas.toBlob((blob) => {
                if (!blob) return resolve(false);
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url; a.download = filename;
                document.body.appendChild(a); a.click(); a.remove();
                setTimeout(() => URL.revokeObjectURL(url), 4000);
                resolve(true);
            }, 'image/png');
        });
    }

    window.VibeDaily = { dateKey, fromKey, longDate, wordsFor, entry, markOpened, setMood, isKept, toggleKept, streak, week, kept, downloadImage, MOODS };
})();
