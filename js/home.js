/**
 * THE VIBE CHECK PROJECT — homepage (index.html)
 *
 *   1. The sky behind the page follows the visitor's clock (js/sky.js) and changes its weather
 *      when they answer the vibe check.
 *   2. Today's card: sealed until tapped, the same words for everyone on a given day
 *      (js/daily.js). Then: send it, save it as an image, keep it, copy it, breathe with it.
 *   3. The vibe check: five answers, each with its own words, weather and guide.
 *
 * Loaded after core-utils.js (showToast, soundEngine, VibeCounter, VibeTelemetry), sky.js, daily.js.
 * `?sky=21.5` previews the sky at a given hour.
 */
(function () {
    'use strict';

    const Sky = window.VibeSky, Daily = window.VibeDaily;
    if (!Sky || !Daily) return;

    const $ = (id) => document.getElementById(id);
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const track = (name, meta) => { if (window.VibeTelemetry) window.VibeTelemetry.track(name, meta); };
    const toast = (msg) => { if (window.showToast) window.showToast(msg, ''); };

    const todayKey = Daily.dateKey();
    const today = Daily.fromKey(todayKey);

    let hourOverride = null;
    try {
        const v = parseFloat(new URLSearchParams(location.search).get('sky'));
        if (!isNaN(v)) hourOverride = ((v % 24) + 24) % 24;
    } catch (e) { }
    const currentHour = () => {
        if (hourOverride !== null) return hourOverride;
        const d = new Date();
        return d.getHours() + d.getMinutes() / 60;
    };

    // ══ 1. The sky ══
    const sky = (function () {
        const canvas = $('sky');
        const ctx = canvas.getContext('2d');
        const model = Sky.model(todayKey);
        let w = 0, h = 0, mood = '', moodFrom = '', moodAt = 0, meteor = null, nextMeteor = 0, lastPaint = 0, running = false;
        const MOOD_MS = 900;
        const INTRO_MS = 1300;      // on arrival the sky runs through the last few hours to now
        const introAt = reducedMotion || hourOverride !== null ? 0 : performance.now();
        let px = 0, py = 0, tx = 0, ty = 0; // pointer parallax (eased)

        function resize() {
            // documentElement sizes exclude a desktop scrollbar (innerWidth doesn't)
            const cw = document.documentElement.clientWidth, ch = window.innerHeight;
            // Soft gradients don't need retina pixels: 1x keeps this light on any laptop
            const scale = cw * ch > 1600 * 1000 ? 0.75 : 1;
            w = canvas.width = Math.round(cw * scale);
            h = canvas.height = Math.round(ch * scale);
            draw(performance.now());
        }

        function draw(now) {
            const k = moodAt ? Math.min(1, (now - moodAt) / MOOD_MS) : 1;
            const eased = k * k * (3 - 2 * k);
            let hour = currentHour();
            if (introAt && now - introAt < INTRO_MS) {
                const p = 1 - Math.pow(1 - (now - introAt) / INTRO_MS, 3);
                hour = (hour - 5 * (1 - p) + 24) % 24;
            }
            px += (tx - px) * 0.12; py += (ty - py) * 0.12;
            const frame = Sky.paint(ctx, w, h, {
                hour, date: new Date(), model, mood, px, py, moodMix: { from: moodFrom, k: reducedMotion ? 1 : eased },
                t: reducedMotion ? 0 : now / 1000, fadeToInk: true, horizon: 0.78,
            });
            if (meteor) drawMeteor(now);
            lastPaint = now;
            return frame;
        }

        // A shooting star now and then, on clear nights only
        function scheduleMeteor(now) { nextMeteor = now + 22000 + Math.random() * 50000; }
        function drawMeteor(now) {
            const p = (now - meteor.at) / 900;
            if (p >= 1) { meteor = null; scheduleMeteor(now); return; }
            const x = meteor.x + meteor.dx * p, y = meteor.y + meteor.dy * p;
            const tail = 0.16 * Math.sin(p * Math.PI);
            const g = ctx.createLinearGradient(x, y, x - meteor.dx * tail, y - meteor.dy * tail);
            g.addColorStop(0, `rgba(255,246,228,${0.9 * Math.sin(p * Math.PI)})`);
            g.addColorStop(1, 'rgba(255,246,228,0)');
            ctx.strokeStyle = g;
            ctx.lineWidth = Math.max(1, w / 900);
            ctx.lineCap = 'round';
            ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - meteor.dx * tail, y - meteor.dy * tail); ctx.stroke();
        }

        function loop(now) {
            if (!running) return;
            const moodMoving = moodAt && now - moodAt < MOOD_MS;
            if (!meteor && now > nextMeteor && Sky.palette(currentHour()).stars > 0.6 && mood !== 'heavy' && window.scrollY < h * 0.5) {
                meteor = { at: now, x: w * (0.15 + Math.random() * 0.6), y: h * (0.06 + Math.random() * 0.22), dx: w * (0.18 + Math.random() * 0.14) * (Math.random() > 0.5 ? 1 : -1), dy: h * (0.1 + Math.random() * 0.08) };
            }
            // 30 frames a second for cloud and twinkle; full rate while something moves fast
            const fast = meteor || moodMoving || (introAt && now - introAt < INTRO_MS) || Math.abs(tx - px) + Math.abs(ty - py) > 0.004;
            if (fast || now - lastPaint > 32) draw(now);
            requestAnimationFrame(loop);
        }

        function setRunning(on) {
            if (reducedMotion) return;
            if (on && !running) { running = true; requestAnimationFrame(loop); }
            else if (!on) running = false;
        }

        function setMood(next, instant) {
            if (next === mood) return;
            moodFrom = mood; mood = next;
            moodAt = instant || reducedMotion ? 0 : performance.now();
            if (reducedMotion || !running) draw(performance.now());
        }

        // The veil: the sky is clearest at the top of the page and dims as the page scrolls
        const veil = $('skyVeil');
        let visible = true;
        function onScroll() {
            const p = Math.min(1, window.scrollY / (window.innerHeight * 0.85));
            veil.style.setProperty('--veil', (p * 0.6).toFixed(3));
        }
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', resize);
        document.addEventListener('visibilitychange', () => setRunning(!document.hidden && visible));
        // Stop painting once the footer covers the view
        const footer = document.querySelector('.footer');
        if (footer && 'IntersectionObserver' in window) {
            new IntersectionObserver(([e]) => { visible = e.intersectionRatio < 0.9; setRunning(visible && !document.hidden); }, { threshold: [0, 0.9] }).observe(footer);
        }
        if (reducedMotion) setInterval(() => draw(performance.now()), 60000);

        // The sky leans a little with the pointer
        if (!reducedMotion && window.matchMedia('(pointer: fine)').matches) {
            window.addEventListener('pointermove', (e) => {
                tx = (e.clientX / window.innerWidth) * 2 - 1;
                ty = (e.clientY / window.innerHeight) * 2 - 1;
            }, { passive: true });
        }

        // Tap the night sky (not a button or the card) and a shooting star crosses from there
        function wish(clientX, clientY) {
            if (reducedMotion || meteor || Sky.palette(currentHour()).stars < 0.4) return false;
            const sx = canvas.width / canvas.clientWidth, sy = canvas.height / canvas.clientHeight;
            const dir = clientX > window.innerWidth / 2 ? -1 : 1;
            meteor = { at: performance.now(), x: clientX * sx, y: clientY * sy, dx: w * 0.22 * dir, dy: h * 0.12 };
            return true;
        }

        scheduleMeteor(performance.now() - 14000);
        resize();
        onScroll();
        setRunning(true);
        return { setMood, wish };
    })();

    // ── The line under the headline: what this sky is ──
    function writeSkyNote() {
        const hour = currentHour();
        const weekday = today.toLocaleDateString('en-US', { weekday: 'long' });
        const moon = Sky.moonName(Sky.moonPhase(new Date())).toLowerCase();
        const part = Sky.partOfDay(hour);
        $('skyNote').textContent = Sky.isDay(hour)
            ? `That's your sky right now: ${weekday} ${part}. Tonight, a ${moon}.`
            : `That's your sky right now: ${weekday} ${part}, ${moon}.`;
    }
    writeSkyNote();
    setInterval(writeSkyNote, 60000);

    // ══ 2. Today's card ══
    const card = $('dayCard');
    const openBtn = $('dayCardOpen');
    let words = null;      // { text, reflection }
    let openedHour = currentHour();
    let isOpen = false;

    $('todayEyebrow').textContent = Daily.longDate(today);
    $('dayCardFor').innerHTML = '<small>For</small><b></b><i></i>';
    $('dayCardFor').querySelector('b').textContent = today.toLocaleDateString('en-US', { weekday: 'long' });
    $('dayCardFor').querySelector('i').textContent = today.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
    $('dayCardDate').textContent = Daily.longDate(today);

    const wordsReady = Daily.wordsFor(todayKey).then(w => { words = w; return w; });

    function renderStreak(earned) {
        const days = Daily.week(7, todayKey);
        const list = $('streakDays');
        list.replaceChildren(...days.map((d, i) => {
            const li = document.createElement('li');
            li.style.setProperty('--i', i);
            if (d.opened) li.classList.add('is-opened');
            if (d.today) li.classList.add('is-today');
            // A day just earned pops in; the days already in the row ripple towards it
            if (earned && d.today) li.classList.add('is-earned');
            else if (earned && d.opened) li.classList.add('is-in-row');
            return li;
        }));
        const n = Daily.streak(todayKey);
        const openedToday = days[days.length - 1].opened;
        let label = '';
        if (n >= 2 && openedToday) label = `${n} days in a row.`;
        else if (n >= 2) label = `${n} days in a row. Today's is waiting.`;
        else if (openedToday) label = 'Day one. A new one arrives tomorrow.';
        else if (n === 1) label = "You opened yesterday's. Today's is waiting.";
        $('streakLabel').textContent = label;
        $('streakLabel').classList.toggle('is-new', !!earned);
        $('streak').hidden = !label;
        const kept = Daily.kept().length;
        $('streakKept').hidden = !kept;
        $('streakKept').textContent = kept === 1 ? '1 kept day →' : `${kept} kept days →`;
    }

    // Someone who has been here before is greeted as such
    const returning = Daily.week(30, todayKey).some(d => d.opened && !d.today);
    if (returning) $('todayEyebrow').textContent = `Welcome back · ${Daily.longDate(today)}`;

    // Once today's is open: when the next one arrives
    function writeNext() {
        const now = new Date();
        const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        const mins = Math.max(1, Math.round((midnight - now) / 60000));
        const h = Math.floor(mins / 60), m = mins % 60;
        $('dayNext').textContent = `Tomorrow's card arrives in ${h ? `${h} h ` : ''}${m} min.`;
        $('dayNext').hidden = false;
    }

    function fillBack() {
        const el = $('dayWords');
        el.replaceChildren();
        words.text.split(/\s+/).forEach((word, i) => {
            const span = document.createElement('span');
            span.className = 'w';
            span.style.setProperty('--n', i);
            span.textContent = word;
            el.append(span, ' ');
        });
        el.classList.toggle('is-long', words.text.length > 90);
        Sky.paintInto($('dayCardSky'), { seed: todayKey, hour: openedHour, date: today, horizon: 0.74 });
        if (words.reflection) $('dayReflection').textContent = words.reflection;
    }

    function showOpen(instant) {
        isOpen = true;
        fillBack();
        card.classList.toggle('is-instant', !!instant || reducedMotion);
        card.classList.add('is-open');
        openBtn.tabIndex = -1;
        $('dayReflection').hidden = !words.reflection;
        $('dayActions').hidden = false;
        $('dayKeepBtn').setAttribute('aria-pressed', String(Daily.isKept(todayKey)));
        $('dayKeepBtn').querySelector('span').textContent = Daily.isKept(todayKey) ? 'Kept' : 'Keep';
        renderStreak(!instant);
        writeNext();
        setInterval(writeNext, 60000);
        $('heroOpen').hidden = true;
    }

    // How many times today's card has been opened (a real number from our counter, or nothing)
    const counterUrl = (typeof VIBE_COUNTER_URL === 'string' && VIBE_COUNTER_URL) || '';
    const counterName = 'daily-' + todayKey;
    function showCount(n) {
        if (typeof n !== 'number' || n < 2) return;
        const el = $('dayCount');
        el.textContent = `Today's card has been opened ${n.toLocaleString()} times.`;
        el.hidden = false;
    }
    function countOpen(first) {
        if (!counterUrl || hourOverride !== null) return;
        const req = first
            ? fetch(`${counterUrl}/hit/${counterName}`, { method: 'POST', mode: 'cors' }).then(r => r.json()).then(d => d && d.count)
            : fetch(`${counterUrl}/get?names=${counterName}`, { cache: 'no-store' }).then(r => r.json()).then(d => d && d.counts && d.counts[counterName]);
        req.then(showCount).catch(() => { });
    }

    const wait = (ms) => new Promise(r => setTimeout(r, reducedMotion ? 0 : ms));
    async function openToday() {
        if (isOpen || card.classList.contains('is-cracking')) return;
        resetTilt();
        // 1. the crack runs down the wax  2. the halves fall away  3. the card turns over
        card.classList.add('is-cracking');
        openedHour = currentHour();
        const hint = $('dayCardHint');
        const slow = setTimeout(() => { hint.textContent = 'Opening'; hint.classList.add('is-waiting'); }, 400);
        await Promise.all([wordsReady, wait(150)]);
        clearTimeout(slow);
        card.classList.add('is-opening');
        await wait(250);
        let muted = false;
        try { muted = localStorage.getItem('vibe_sound_muted') === 'true'; } catch (e) { }
        if (!muted && window.soundEngine) setTimeout(() => window.soundEngine.play('chime'), reducedMotion ? 0 : 200);
        const first = Daily.markOpened(todayKey, words.text, openedHour, words.reflection);
        showOpen(false);
        countOpen(first);
        track('daily_opened', { streak: Daily.streak(todayKey) });
    }
    openBtn.addEventListener('click', openToday);
    $('heroOpen').addEventListener('click', openToday);

    // The card leans towards the pointer, with a highlight that follows it
    function resetTilt() {
        card.classList.remove('is-tilting');
        card.style.removeProperty('--rx'); card.style.removeProperty('--ry');
    }
    if (!reducedMotion && window.matchMedia('(pointer: fine)').matches) {
        card.addEventListener('pointermove', (e) => {
            if (card.classList.contains('is-cracking') && !isOpen) return;
            const r = card.getBoundingClientRect();
            const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
            card.classList.add('is-tilting');
            card.style.setProperty('--ry', `${((x - 0.5) * 14).toFixed(2)}deg`);
            card.style.setProperty('--rx', `${((0.5 - y) * 10 * (isOpen ? -1 : 1)).toFixed(2)}deg`);
            card.style.setProperty('--gx', `${(x * 100).toFixed(1)}%`);
            card.style.setProperty('--gy', `${(y * 100).toFixed(1)}%`);
        });
        card.addEventListener('pointerleave', resetTilt);
    }

    // A tap on the open sky at night
    $('today').addEventListener('click', (e) => {
        if (e.target.closest('a, button, input, .daycard, .day-actions, .streak')) return;
        if (sky.wish(e.clientX, e.clientY)) track('sky_wish');
    });

    // Already opened today: show it open, under the sky it was opened in
    wordsReady.then(() => {
        const entry = Daily.entry(todayKey);
        if (!entry || !entry.text) { renderStreak(); return; }
        if (typeof entry.hour === 'number') openedHour = entry.hour;
        showOpen(true);
        countOpen(false);
    });

    // ── Send it to someone ──
    $('daySend').addEventListener('submit', (e) => {
        e.preventDefault();
        if (!words) return;
        const name = $('daySendName').value.trim().slice(0, 50);
        track('daily_send', { named: !!name });
        location.href = `send-card.html?message=${encodeURIComponent(words.text)}${name ? `&recipient=${encodeURIComponent(name)}` : ''}`;
    });

    // ── Save as an image ──
    const saveBtn = $('daySaveBtn'), saveMenu = $('daySaveMenu');
    const closeMenu = () => { saveMenu.hidden = true; saveBtn.setAttribute('aria-expanded', 'false'); };
    saveBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const open = saveMenu.hidden;
        saveMenu.hidden = !open;
        saveBtn.setAttribute('aria-expanded', String(open));
    });
    document.addEventListener('click', (e) => { if (!saveMenu.hidden && !saveMenu.contains(e.target)) closeMenu(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !saveMenu.hidden) { closeMenu(); saveBtn.focus(); } });

    saveMenu.addEventListener('click', async (e) => {
        const kind = e.target.closest('[data-save]')?.dataset.save;
        if (!kind || !words) return;
        closeMenu();
        saveBtn.classList.add('is-busy');
        try { if (document.fonts && document.fonts.load) await Promise.all([document.fonts.load('500 40px "Cormorant Garamond"'), document.fonts.load('600 14px Outfit')]); } catch (err) { }
        const size = kind === 'wallpaper' ? { width: 1179, height: 2556 } : { width: 1080, height: 1080 };
        const image = Sky.renderImage({ ...size, layout: kind, text: words.text, hour: openedHour, date: today, seed: todayKey, label: Daily.longDate(today) });
        const filename = `vibe-check-${todayKey}-${kind}.png`;
        track('daily_saved', { kind });

        // Phones: the share sheet has "Save Image", which is how wallpapers get to the camera roll
        const touch = window.matchMedia('(pointer: coarse)').matches;
        if (touch && navigator.canShare) {
            const blob = await new Promise(r => image.toBlob(r, 'image/png'));
            const file = blob && new File([blob], filename, { type: 'image/png' });
            if (file && navigator.canShare({ files: [file] })) {
                try { await navigator.share({ files: [file] }); saveBtn.classList.remove('is-busy'); return; } catch (err) { if (err && err.name === 'AbortError') { saveBtn.classList.remove('is-busy'); return; } }
            }
        }
        const ok = await Daily.downloadImage(image, filename);
        saveBtn.classList.remove('is-busy');
        pulse(saveBtn);
        toast(ok ? 'Saved to your downloads.' : "That didn't save. Try again?");
    });

    const pulse = (btn) => { btn.classList.remove('is-done'); void btn.offsetWidth; btn.classList.add('is-done'); };

    // ── Keep / copy ──
    $('dayKeepBtn').addEventListener('click', () => {
        const kept = Daily.toggleKept(todayKey);
        $('dayKeepBtn').setAttribute('aria-pressed', String(kept));
        $('dayKeepBtn').querySelector('span').textContent = kept ? 'Kept' : 'Keep';
        pulse($('dayKeepBtn'));
        renderStreak(false);
        toast(kept ? 'Kept. You’ll find it in My Vibes.' : 'Removed from your kept days.');
        track('daily_kept', { kept });
    });

    $('dayCopyBtn').addEventListener('click', async () => {
        if (!words) return;
        try { await navigator.clipboard.writeText(words.text); pulse($('dayCopyBtn')); toast('Copied.'); }
        catch (e) { toast('Copy didn’t work here. Press and hold the words to copy them.'); }
    });

    // ── Breathe with it: three slow breaths, the card rising and settling ──
    let breathTimer = null;
    function stopBreath() {
        clearTimeout(breathTimer); breathTimer = null;
        card.classList.remove('is-breathing', 'is-inhale', 'is-exhale');
        $('dayBreatheBtn').querySelector('span').textContent = 'Breathe';
    }
    $('dayBreatheBtn').addEventListener('click', () => {
        if (breathTimer) return stopBreath();
        const label = $('dayBreath');
        let round = 0;
        card.classList.add('is-breathing');
        $('dayBreatheBtn').querySelector('span').textContent = 'Stop';
        track('daily_breathe');
        const inhale = () => {
            if (round === 3) {
                label.textContent = 'There.';
                breathTimer = setTimeout(stopBreath, 2200);
                return;
            }
            round++;
            label.textContent = 'Breathe in';
            card.classList.remove('is-exhale'); card.classList.add('is-inhale');
            breathTimer = setTimeout(() => {
                label.textContent = 'and out';
                card.classList.remove('is-inhale'); card.classList.add('is-exhale');
                breathTimer = setTimeout(inhale, 6000);
            }, 4000);
        };
        inhale();
    });

    // ══ 3. The vibe check ══
    const answer = $('checkAnswer');
    const moodButtons = [...document.querySelectorAll('#moods .mood')];
    let moodId = '', moodIndex = 0;

    function showMoodWords(swap) {
        const mood = Daily.MOODS[moodId];
        const text = mood.words[moodIndex % mood.words.length];
        const el = $('checkWords');
        const apply = () => {
            el.textContent = text;
            $('checkSend').href = `send-card.html?message=${encodeURIComponent(text)}`;
            el.classList.remove('is-swapping');
        };
        if (swap && !reducedMotion) { el.classList.add('is-swapping'); setTimeout(apply, 140); } else apply();
    }

    function chooseMood(id, quiet) {
        const mood = Daily.MOODS[id];
        if (!mood) return;
        moodId = id;
        // A different phrase each day for the same answer
        moodIndex = Math.abs(today.getDate() + id.length);
        moodButtons.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.mood === id)));
        $('checkSky').textContent = mood.sky;
        $('checkGuide').textContent = `${mood.guide.text} →`;
        $('checkGuide').href = mood.guide.href;
        const wasHidden = answer.hidden;
        answer.hidden = false;
        showMoodWords(!wasHidden);
        sky.setMood(id, quiet);
        if (!quiet) {
            Daily.setMood(todayKey, id);
            track('vibe_check', { mood: id });
        }
    }

    moodButtons.forEach(b => b.addEventListener('click', () => chooseMood(b.dataset.mood, false)));
    $('checkAnother').addEventListener('click', () => { moodIndex++; showMoodWords(true); });

    // An answer given earlier today is still there on return
    const savedMood = Daily.week(1, todayKey)[0].mood;
    if (savedMood) chooseMood(savedMood, true);

    // ── The fan of cards deals itself out when it comes into view ──
    const fan = $('fan');
    if ('IntersectionObserver' in window && !reducedMotion) {
        const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { fan.classList.add('is-seen'); io.disconnect(); } }, { threshold: 0.35 });
        io.observe(fan);
    } else {
        fan.classList.add('is-seen');
    }
})();
