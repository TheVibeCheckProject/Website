/**
 * Card flow for send-card.html: choose a card -> fly into it (the portal) -> choose or
 * write the words -> names and a note -> Send (the saved paper-plane button).
 *
 * Built from the approved prototype (assets/testassetcode/concept-1-portal.html).
 * Data, Premium state and sending live in js/send-card-logic.js; this file sets its
 * selected* variables and calls back through window.CardFlow (playSend, showSuccess).
 */
(function () {
    'use strict';

    // Transition pace: 1 = the approved speed. 1.4 = slower and heavier, 0.7 = quicker.
    const PACE = 1;
    const T_PREP = 480 * PACE;      // labels clear, other cards step back
    const T_PUSH = 2300 * PACE;     // the fly-through
    const T_WORDS = 1300 * PACE;    // each phrase arriving from the depth
    const OVERSHOOT = 60;           // the window ends this far past each screen edge
    const SENT_HOLD_MS = 3500;      // after the plane lands: time to read "Thanks for sending a vibe!"
    const DRAFT_KEY = 'vc_flow_draft';
    const DRAFT_MAX_AGE = 24 * 60 * 60 * 1000;

    const reduced = isReducedMotion;

    // Quiet prompts while the "your own words" field is empty (fixed lines, no AI)
    const WRITE_PROMPTS = [
        'What do you admire about them?',
        'What do you want them to remember today?',
        'Something only you would say to them…',
        'What would make them smile right now?'
    ];

    // ── Word sets: the free General set and situations, then the Premium collections ──
    const WORD_SETS = [
        { id: 'general', name: 'General', themeGroup: 'default', items: freeAffirmations.map(text => ({ text, vibe: 'General' })) },
        ...SITUATIONS.map(s => ({
            id: s.id, name: s.name, themeGroup: 'default',
            items: situationAffirmations.filter(a => a.sit === s.id).map(a => ({ text: a.text, vibe: a.vibe }))
        })),
        ...categoryDefs.filter(c => c.premium).map(c => ({
            id: c.id, name: c.label, premium: true, themeGroup: c.themeGroup,
            items: c.affirmations.map(text => ({ text, vibe: c.label }))
        }))
    ];

    let currentCardIdx = 0;
    let isPortalMode = false;
    let isBusy = false;
    let phraseIntroStart = 0;
    let activeSet = WORD_SETS[0];
    let extraSet = null;            // a preset or a ?message= set, shown first when present
    let wheelItems = [];
    let customText = '';

    const wheel = { currentIndex: 0, scrollY: 0, targetScrollY: 0, isDragging: false, startY: 0, dragMoved: false, dragDist: 0 };

    const $ = (id) => document.getElementById(id);
    let cameraRig, portalTrack, portalViewport, portalSpace, spaceArt, spaceDim, spaceRim, spaceCanvas,
        composerInput, composerPrompt, mainCta, drawer, sendStage, sendSvg, sendSlot;

    const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    // The visible page without the scrollbar. (viewW() includes a desktop scrollbar, which
    // made the portal window 15px narrower than its gold frame: a dark strip down the right side.)
    const viewW = () => document.documentElement.clientWidth;
    const viewH = () => document.documentElement.clientHeight;
    const nextFrame = () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const lerp = (a, b, t) => a + (b - a) * t;
    const clamp01 = (t) => Math.min(1, Math.max(0, t));
    const smoothstep = (a, b, t) => { const x = clamp01((t - a) / (b - a)); return x * x * (3 - 2 * x); };
    // Slow to start, committed through the middle, long soft landing
    const easePush = (t) => t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;
    const escapeHtml = (s) => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const track = (name, data) => { if (window.VibeTelemetry) window.VibeTelemetry.track(name, data); };

    /* Soft chimes for moves inside the flow (Web Audio, very quiet) */
    let audioCtx = null;
    function playChime(freq = 560, duration = 0.08) {
        try {
            if (!audioCtx) {
                const AudioClass = window.AudioContext || window.webkitAudioContext;
                if (!AudioClass) return;
                audioCtx = new AudioClass();
            }
            if (audioCtx.state === 'suspended') audioCtx.resume();
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(freq * 1.35, audioCtx.currentTime + duration * 0.7);
            gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start();
            osc.stop(audioCtx.currentTime + duration);
        } catch (e) { }
    }

    /* ========== 1. Card ring ========== */
    const isCardLocked = (idx) => !!backgroundDefs[idx].premium && !isPremium;

    function initCardRing() {
        cameraRig.innerHTML = '';
        backgroundDefs.forEach((bg, idx) => {
            const cardEl = document.createElement('div');
            cardEl.className = 'portal-card';
            cardEl.dataset.index = idx;
            cardEl.setAttribute('role', 'button');
            if (!bg.isVideo) cardEl.style.backgroundImage = `url('${bg.image}')`;
            cardEl.innerHTML = `
                ${bg.isVideo ? `<video class="portal-card-video" data-src="${bg.image}" muted loop playsinline preload="none" aria-hidden="true"></video>` : ''}
                <div class="portal-card-gradient"></div>
                ${bg.premium ? '<div class="vc-veil"></div><div class="vc-lock" aria-hidden="true">🔒 PREMIUM</div>' : ''}
                <span class="portal-card-tag">${escapeHtml(bg.label)}${bg.isVideo ? ' · ANIMATED' : ''}</span>
                <span class="ring-card-choose-btn" aria-hidden="true"></span>
            `;
            // One tap: a side card comes to the front; the front card enters the portal.
            // Free users: a premium card offers Premium instead of coming to the front.
            const activate = () => {
                if (isPortalMode || isBusy) return;
                if (isCardLocked(idx)) {
                    track('premium_bg_attempt', { bg: bg.id, isVideo: !!bg.isVideo });
                    offerPremium('bg_' + bg.id, bg.label, { then: 'enter-card', background: bg.id });
                    return;
                }
                if (idx !== currentCardIdx) { goToCardIndex(idx); playChime(500); }
                else enterPortalMode(idx);
            };
            cardEl.addEventListener('click', activate);
            cardEl.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(); }
            });
            cameraRig.appendChild(cardEl);
        });
        updateRingTransforms();
    }

    function ringOffset(idx) {
        const total = backgroundDefs.length;
        let offset = idx - currentCardIdx;
        if (offset > total / 2) offset -= total;
        if (offset < -total / 2) offset += total;
        return offset;
    }

    function updateRingTransforms() {
        cameraRig.querySelectorAll('.portal-card').forEach((card, idx) => {
            const bg = backgroundDefs[idx];
            const locked = isCardLocked(idx);
            card.classList.toggle('is-locked', locked);
            card.querySelector('.ring-card-choose-btn').innerHTML = locked
                ? '🔒 Unlock with Premium'
                : 'Enter Portal <span aria-hidden="true">→</span>';

            const offset = ringOffset(idx);
            const absOffset = Math.abs(offset);
            const video = card.querySelector('video');
            if (absOffset <= 3) {
                card.style.display = 'flex';
                const translateX = offset * 215;
                const translateZ = -absOffset * 140;
                const rotateY = -offset * 22;
                const scale = Math.max(0.72, 1 - absOffset * 0.12);
                const opacity = absOffset === 0 ? 1 : Math.max(0.35, 1 - absOffset * 0.3);
                card.style.transform = `translateX(${translateX}px) translateZ(${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`;
                card.style.opacity = opacity;
                card.style.zIndex = 50 - absOffset * 10;
                card.classList.toggle('is-active', absOffset === 0);
                card.tabIndex = absOffset === 0 || absOffset === 1 ? 0 : -1;
                card.setAttribute('aria-label', locked
                    ? `${bg.label}, Premium card. Opens what Premium includes.`
                    : absOffset === 0 ? `${bg.label}: enter this card` : `${bg.label}: bring to the front`);
            } else {
                card.style.display = 'none';
                card.classList.remove('is-active');
                card.tabIndex = -1;
            }
            // Animated cards: only the front card and its neighbours load and play
            if (video) {
                const near = absOffset <= 1;
                if (near && !video.src) video.src = video.dataset.src;
                if (near && !reduced) video.play().catch(() => { });
                else if (video.src && !video.closest('.space-art')) video.pause();
            }
        });
        const bg = backgroundDefs[currentCardIdx];
        $('cardNameTitle').textContent = bg.label;
        $('cardNameTag').textContent = bg.premium ? (bg.isVideo ? 'PREMIUM · ANIMATED' : 'PREMIUM') : '';
        $('ringProgress').textContent = `${String(currentCardIdx + 1).padStart(2, '0')} / ${String(backgroundDefs.length).padStart(2, '0')}`;
    }

    // Arrows and swipes skip the cards a free user can't bring to the front
    function stepRing(dir) {
        if (isPortalMode || isBusy) return;
        let idx = currentCardIdx;
        for (let guard = backgroundDefs.length; guard > 0; guard--) {
            idx = (idx + dir + backgroundDefs.length) % backgroundDefs.length;
            if (!isCardLocked(idx)) break;
        }
        goToCardIndex(idx);
        playChime(500);
    }

    function goToCardIndex(idx) {
        const total = backgroundDefs.length;
        currentCardIdx = (idx % total + total) % total;
        updateRingTransforms();
    }

    const activeCardEl = () => cameraRig.querySelector('.portal-card.is-active');

    /* ========== 2. The portal ========== */
    const portal = { from: null, e: 0, mediaW: 1, mediaH: 1, video: null };

    // Put the card's artwork into the portal. An image is loaded at its natural size;
    // an animated card hands over its own playing video, so the motion never jumps.
    async function mountSpaceMedia(bg, cardEl) {
        spaceArt.innerHTML = '';
        portal.video = null;
        if (bg.isVideo) {
            const v = cardEl.querySelector('video');
            if (!v.src) v.src = v.dataset.src;
            if (!v.videoWidth) {
                await Promise.race([new Promise(r => v.addEventListener('loadedmetadata', r, { once: true })), wait(2500)]);
            }
            portal.video = v;
            portal.mediaW = v.videoWidth || 1280;
            portal.mediaH = v.videoHeight || 720;
            spaceArt.appendChild(v);
            if (!reduced) v.play().catch(() => { });
        } else {
            const img = new Image();
            img.alt = '';
            img.src = bg.image;
            try { await img.decode(); } catch (e) { }
            portal.mediaW = img.naturalWidth || 640;
            portal.mediaH = img.naturalHeight || 640;
            spaceArt.appendChild(img);
        }
        spaceArt.style.width = `${portal.mediaW}px`;
        spaceArt.style.height = `${portal.mediaH}px`;
    }

    function returnSpaceMedia(cardEl) {
        if (!portal.video) return;
        cardEl.insertBefore(portal.video, cardEl.firstChild);
        if (!reduced) portal.video.play().catch(() => { });
        portal.video = null;
    }

    // One frame of the fly-through. e = 0: the window is exactly the card. e = 1: you're inside.
    function applyPortalFrame(e) {
        portal.e = e;
        const vw = viewW(), vh = viewH();
        const r0 = portal.from;
        const w1 = vw + OVERSHOOT * 2, h1 = vh + OVERSHOOT * 2;

        // Geometric growth = constant sense of speed, like a real camera move
        const w = r0.width * Math.pow(w1 / r0.width, e);
        const h = r0.height * Math.pow(h1 / r0.height, e);
        const cx = lerp(r0.left + r0.width / 2, vw / 2, e);
        const cy = lerp(r0.top + r0.height / 2, vh / 2, e);
        const left = cx - w / 2, top = cy - h / 2;
        const radius = Math.min(26 * (w / r0.width), 160);

        portalSpace.style.clipPath = e >= 1
            ? 'none'
            : `inset(${top}px ${vw - left - w}px ${vh - top - h}px ${left}px round ${radius}px)`;

        // The artwork always fills the window the way it filled the card (cover)
        const s = Math.max(w / portal.mediaW, h / portal.mediaH);
        spaceArt.style.transform = `translate3d(${cx - portal.mediaW * s / 2}px, ${cy - portal.mediaH * s / 2}px, 0) scale(${s})`;

        spaceRim.style.transform = `translate3d(${left}px, ${top}px, 0)`;
        spaceRim.style.width = `${w}px`;
        spaceRim.style.height = `${h}px`;
        spaceRim.style.borderRadius = `${radius}px`;
        spaceRim.style.opacity = 1 - smoothstep(0.72, 0.96, e);

        spaceDim.style.opacity = smoothstep(0.12, 0.95, e);
        spaceCanvas.style.opacity = reduced ? 0 : smoothstep(0.03, 0.3, e);

        // Light rushes past fastest in the middle of the move, then settles to a drift
        starfield.cx = cx;
        starfield.cy = cy;
        starfield.speed = starfield.baseSpeed + 1.9 * Math.pow(Math.sin(Math.PI * e), 2);
    }

    function runPortal(from, to, duration) {
        return new Promise(resolve => {
            const t0 = performance.now();
            const step = (now) => {
                const k = clamp01((now - t0) / duration);
                applyPortalFrame(lerp(from, to, easePush(k)));
                if (k < 1) requestAnimationFrame(step);
                else resolve();
            };
            requestAnimationFrame(step);
        });
    }

    // Reduced motion: the same places, reached by a short crossfade instead of a flight
    async function fadePortal(show) {
        portalSpace.style.transition = 'opacity 0.3s ease';
        if (show) {
            portalSpace.style.opacity = '0';
            applyPortalFrame(1);
            portalSpace.classList.add('is-open');
            await nextFrame();
            portalSpace.style.opacity = '1';
        } else {
            portalSpace.style.opacity = '0';
        }
        await wait(320);
    }

    async function enterPortalMode(cardIdx, options = {}) {
        if (isPortalMode || isBusy) return;
        if (isCardLocked(cardIdx)) return;
        isBusy = true;
        if (cardIdx !== currentCardIdx) {
            goToCardIndex(cardIdx);
            await wait(reduced ? 50 : 750);
        }
        isPortalMode = true;
        const bg = backgroundDefs[currentCardIdx];
        selectedBackground = bg.image;
        $('portalPlaceName').textContent = `Inside ${bg.label}`;
        phraseIntroStart = reduced ? 0 : Infinity;   // words wait until we're through
        if (!options.keepWheel) { wheel.currentIndex = 0; wheel.scrollY = 0; wheel.targetScrollY = 0; }
        renderWheel();
        track('portal_entered', { bg: bg.id });

        // Labels clear off the card, the other cards step back. An image is put into the
        // (still hidden) portal meanwhile, so the handoff frame has nothing heavy to do.
        playChime(520, 0.25);
        document.body.classList.add('is-leaving');
        const cardEl = activeCardEl();
        const mounting = bg.isVideo ? null : mountSpaceMedia(bg, cardEl);
        await wait(reduced ? 0 : T_PREP);

        // Hand over from the card to the portal window, in the exact same spot
        portal.from = cardEl.getBoundingClientRect();
        await (mounting || mountSpaceMedia(bg, cardEl));
        starfield.setColors(bg.light || ['#ffffff']);
        starfield.reset();
        if (reduced) {
            cardEl.classList.add('is-handed-off');
            await fadePortal(true);
        } else {
            applyPortalFrame(0);
            portalSpace.style.opacity = '';
            portalSpace.classList.add('is-open');
            spaceRim.classList.add('is-open');
            cardEl.classList.add('is-handed-off');
            starfield.start();

            // Fly through
            playChime(660, 0.5);
            await runPortal(0, 1, T_PUSH);
            spaceRim.classList.remove('is-open');
        }

        // Inside: the words arrive
        document.body.classList.add('is-inside');
        if (!reduced) phraseIntroStart = performance.now() + 250 * PACE;
        setTimeout(() => portalViewport.focus({ preventScroll: true }), reduced ? 50 : 900);
        await wait(reduced ? 100 : 250 * PACE + T_WORDS);
        isBusy = false;
    }

    async function exitPortalMode() {
        if (!isPortalMode || isBusy) return;
        isBusy = true;
        playChime(480, 0.25);
        if (document.body.classList.contains('is-writing')) closeComposer();

        // The words fade while the pull-back is already easing in (no still pause between)
        document.body.classList.remove('is-inside');
        await wait(reduced ? 0 : 150 * PACE);

        const cardEl = activeCardEl();
        if (reduced) {
            await fadePortal(false);
        } else {
            // Fly back out through the same window, landing exactly on the card
            portal.from = cardEl.getBoundingClientRect();
            spaceRim.classList.add('is-open');
            await runPortal(1, 0, T_PUSH * 0.85);
        }

        // Hand back to the card in the same frame, fully visible at once. (With its
        // transition on, it picked up the carousel's 0.75s opacity fade and left an
        // empty hole where the card should be for most of a second.)
        returnSpaceMedia(cardEl);
        cardEl.style.setProperty('transition', 'none', 'important');   // beats the reduced-motion rule too
        cardEl.classList.remove('is-handed-off');
        void cardEl.offsetWidth;
        cardEl.style.removeProperty('transition');
        // Close the portal on the next frame, once the card is on screen under it
        await nextFrame();
        portalSpace.classList.remove('is-open');
        portalSpace.style.opacity = '';
        spaceRim.classList.remove('is-open');
        starfield.stop();
        document.body.classList.remove('is-leaving');
        await wait(reduced ? 50 : T_PREP + 300);
        isPortalMode = false;
        isBusy = false;
        if (isCardLocked(currentCardIdx)) goToCardIndex(0);
        cardEl.focus({ preventScroll: true });
    }

    /* Light field inside the portal: sharp points of light coming toward you.
       Drawn at device resolution so it stays crisp. */
    const starfield = {
        ctx: null,
        stars: [],
        colors: ['#ffffff'],
        speed: 0.04,
        baseSpeed: 0.04,
        cx: 0, cy: 0,
        w: 0, h: 0, dpr: 1,
        running: false,
        last: 0,

        resize(vw, vh) {
            this.dpr = Math.min(window.devicePixelRatio || 1, 2);
            this.w = vw; this.h = vh;
            spaceCanvas.width = Math.round(vw * this.dpr);
            spaceCanvas.height = Math.round(vh * this.dpr);
        },
        setColors(hexes) { this.colors = hexes; },
        spawn(z) {
            return {
                x: Math.random() * 2 - 1,
                y: Math.random() * 2 - 1,
                z,
                color: this.colors[Math.floor(Math.random() * this.colors.length)],
                twinkle: Math.random() * Math.PI * 2
            };
        },
        reset() {
            const count = this.w < 700 ? 150 : 220;
            this.stars = Array.from({ length: count }, () => this.spawn(0.08 + Math.random() * 0.92));
        },
        start() {
            if (this.running || reduced) return;
            this.running = true;
            this.last = performance.now();
            requestAnimationFrame((t) => this.frame(t));
        },
        stop() {
            this.running = false;
            if (this.ctx) this.ctx.clearRect(0, 0, spaceCanvas.width, spaceCanvas.height);
        },
        frame(now) {
            if (!this.running) return;
            const dt = Math.min(0.05, (now - this.last) / 1000);
            this.last = now;
            const ctx = this.ctx, dpr = this.dpr;
            const focal = Math.max(this.w, this.h) * 0.42;
            // Scrolling the words nudges the light, so the space feels connected to them
            const scrollDrift = (wheel.targetScrollY - wheel.scrollY) * -60;
            const cx = this.cx, cy = this.cy + scrollDrift;

            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            ctx.clearRect(0, 0, this.w, this.h);
            ctx.globalCompositeOperation = 'lighter';
            ctx.lineCap = 'round';

            for (let i = 0; i < this.stars.length; i++) {
                const s = this.stars[i];
                const prevZ = s.z;
                s.z -= this.speed * dt;
                if (s.z <= 0.03) { this.stars[i] = this.spawn(1); continue; }

                const sx = cx + (s.x / s.z) * focal;
                const sy = cy + (s.y / s.z) * focal;
                if (sx < -60 || sx > this.w + 60 || sy < -60 || sy > this.h + 60) {
                    this.stars[i] = this.spawn(1);
                    continue;
                }
                const near = 1 - s.z;
                const size = 0.4 + near * near * 2.2;
                const glow = 0.8 + 0.2 * Math.sin(now * 0.0015 + s.twinkle);
                ctx.globalAlpha = Math.min(1, near * 1.25) * glow;

                // At speed, a star draws the path it just travelled (a clean streak)
                const tailZ = Math.min(1, prevZ + this.speed * 0.05);
                const tx = cx + (s.x / tailZ) * focal;
                const ty = cy + (s.y / tailZ) * focal;
                if (Math.hypot(sx - tx, sy - ty) > size * 1.5) {
                    ctx.strokeStyle = s.color;
                    ctx.lineWidth = size;
                    ctx.beginPath();
                    ctx.moveTo(tx, ty);
                    ctx.lineTo(sx, sy);
                    ctx.stroke();
                } else {
                    ctx.fillStyle = s.color;
                    ctx.beginPath();
                    ctx.arc(sx, sy, size * 0.6, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
            ctx.globalAlpha = 1;
            ctx.globalCompositeOperation = 'source-over';
            requestAnimationFrame((t) => this.frame(t));
        }
    };

    /* ========== 3. Floating words ========== */
    const isSetLocked = (set) => !!set.premium && !isPremium;
    const currentItem = () => wheelItems[wheel.currentIndex];

    // Every set ends with one more stop: your own words.
    function renderWheel() {
        wheelItems = [...activeSet.items.map(it => ({ ...it, set: activeSet })), { write: true }];
        portalTrack.innerHTML = '';
        wheelItems.forEach((item, index) => {
            const phraseEl = document.createElement('div');
            phraseEl.className = 'portal-phrase' + (item.write ? ' is-write' : '');
            if (item.write) {
                const text = customText
                    ? `<span class="portal-quote-text">“${escapeHtml(customText)}”</span>`
                    : '<span class="portal-quote-text is-invite">Write your own words</span>';
                phraseEl.innerHTML = `
                    <div class="portal-phrase-inner">
                        <span class="portal-vibe-tag">✍️ Your own words <span class="premium-pill">🔒 PREMIUM</span></span>
                        ${text}
                        <span class="write-hint">${isPremium ? (customText ? 'Tap to edit' : 'Tap to start writing') : 'Tap to see what Premium includes'}</span>
                    </div>`;
            } else {
                phraseEl.innerHTML = `
                    <div class="portal-phrase-inner">
                        <span class="portal-vibe-tag">✦ ${escapeHtml(item.vibe)}${item.set.premium ? ' <span class="premium-pill">🔒 PREMIUM</span>' : ''}</span>
                        <span class="portal-quote-text">“${escapeHtml(item.text)}”</span>
                    </div>`;
            }
            phraseEl.addEventListener('click', () => {
                if (wheel.dragMoved) return;
                if (item.write && index === wheel.currentIndex) { onWriteStop(); return; }
                scrollToIndex(index);
            });
            portalTrack.appendChild(phraseEl);
        });
        if (wheel.currentIndex >= wheelItems.length) {
            wheel.currentIndex = 0; wheel.scrollY = 0; wheel.targetScrollY = 0;
        }
        updateTransforms();
        syncSelection();
    }

    // 0 → 1 (eased) as a phrase arrives from the depth; 1 when no intro is running
    function phraseIntroProgress(delay) {
        if (!phraseIntroStart) return 1;
        const p = clamp01((performance.now() - phraseIntroStart - delay) / T_WORDS);
        return 1 - Math.pow(1 - p, 3);
    }

    function updateTransforms() {
        const items = portalTrack.children;
        const total = wheelItems.length;
        if (!total) return;
        const spread = Math.min(portalViewport.clientHeight || 480, 500) * 0.37;

        for (let index = 0; index < items.length; index++) {
            const item = items[index];
            let offset = index - wheel.scrollY;
            while (offset < -total / 2) offset += total;
            while (offset > total / 2) offset -= total;
            const distance = Math.abs(offset);

            if (distance > 1.4) {
                item.style.display = 'none';
                continue;
            }
            item.style.display = 'block';

            const angle = offset * 0.44;
            const z = (Math.cos(angle) - 1) * 160;
            const y = Math.sin(angle) / Math.sin(0.44) * spread;
            const rotX = -angle * (180 / Math.PI) * 0.6;
            const scale = distance < 0.45 ? 1.04 : Math.max(0.8, 1 - distance * 0.16);
            const opacity = distance < 0.45 ? 1 : Math.max(0, 1 - distance * 0.6);
            item.classList.toggle('is-active', distance < 0.45);

            // Arriving from the depth: centre phrase first, neighbours a beat later
            const e = phraseIntroProgress(distance < 0.5 ? 0 : 320 * PACE);
            item.style.transform = `translate3d(0, ${y}px, ${z - 900 * (1 - e)}px) rotateX(${rotX}deg) scale(${scale})`;
            item.style.opacity = opacity * e;
            item.style.zIndex = Math.round(100 - distance * 10);
        }

        let activeIdx = Math.round(wheel.scrollY) % total;
        if (activeIdx < 0) activeIdx += total;
        if (activeIdx !== wheel.currentIndex) {
            wheel.currentIndex = activeIdx;
            syncSelection();
        }
        const onWrite = wheelItems[activeIdx] && wheelItems[activeIdx].write;
        $('portalCounter').textContent = onWrite
            ? '✍️'
            : `${String(activeIdx + 1).padStart(2, '0')} / ${String(total - 1).padStart(2, '0')}`;
    }

    // The words in the middle are the card's words (send-card-logic reads these)
    let lastAnnounced = '';
    function syncSelection() {
        const item = currentItem();
        if (!item) return;
        if (item.write) {
            selectedAffirmation = customText;
            selectedThemeGroup = 'default';
        } else {
            selectedAffirmation = item.text;
            selectedThemeGroup = item.set.themeGroup || 'default';
        }
        refreshCta();
        const say = item.write ? 'Your own words' : item.text;
        if (say !== lastAnnounced && document.body.classList.contains('is-inside')) {
            lastAnnounced = say;
            $('wordAnnounce').textContent = say;
        }
    }

    // The main button always says what will happen with the words in front of you
    let ctaAction = () => openDrawer(true);
    function refreshCta() {
        const item = currentItem();
        if (!item || !mainCta) return;
        let label = 'Next →', unlock = false;
        if (isWriting()) {
            ctaAction = () => { closeComposer(); if (customText) openDrawer(true); };
        } else if (item.write && !isPremium) {
            label = 'Unlock Premium — $4.99'; unlock = true;
            ctaAction = () => offerPremium('write_own', 'Writing your own words', { then: 'write-own' });
        } else if (item.write && !customText) {
            label = 'Start Writing →';
            ctaAction = openComposer;
        } else if (!item.write && isSetLocked(item.set)) {
            label = 'Unlock Premium — $4.99'; unlock = true;
            ctaAction = () => offerPremium('category_' + item.set.id, `The ${item.set.name} collection`, { then: 'use-collection' });
        } else {
            ctaAction = () => openDrawer(true);
        }
        mainCta.textContent = label;
        mainCta.classList.toggle('is-unlock', unlock);
    }

    function onWriteStop() {
        if (isPremium) openComposer();
        else offerPremium('write_own', 'Writing your own words', { then: 'write-own' });
    }

    function scrollToIndex(index, silent) {
        const total = wheelItems.length;
        const current = wheel.targetScrollY;
        let diff = (index - current) % total;
        if (diff > total / 2) diff -= total;
        if (diff < -total / 2) diff += total;
        wheel.targetScrollY = current + diff;
        if (reduced) wheel.scrollY = wheel.targetScrollY;
        if (!silent) playChime(620);
    }

    function stepPortalWheel(dir) {
        wheel.targetScrollY = Math.round(wheel.targetScrollY) + dir;
        if (reduced) wheel.scrollY = wheel.targetScrollY;
        playChime(dir > 0 ? 580 : 520);
    }

    function randomizePortal() {
        // Shuffle picks from the words, not the empty "your own" stop
        scrollToIndex(Math.floor(Math.random() * (wheelItems.length - 1)));
        playChime(740, 0.12);
    }

    function selectSet(set, focusText) {
        if (isWriting()) closeComposer();
        activeSet = set;
        wheel.currentIndex = 0;
        wheel.scrollY = 0;
        wheel.targetScrollY = 0;
        renderWheel();
        if (focusText) {
            const i = wheelItems.findIndex(it => !it.write && it.text === focusText);
            if (i > 0) { wheel.scrollY = wheel.targetScrollY = i; updateTransforms(); syncSelection(); }
        }
        phraseIntroStart = reduced || !document.body.classList.contains('is-inside') ? phraseIntroStart : performance.now();
        document.querySelectorAll('#portalTopicsDock .flow-chip[data-set]').forEach(b => {
            const on = b.dataset.set === set.id;
            b.classList.toggle('is-active', on);
            b.setAttribute('aria-pressed', String(on));
        });
        if (set.premium) track('premium_category_viewed', { category: set.id });
    }

    /* ========== 4. Your own words (Premium) ========== */
    const isWriting = () => document.body.classList.contains('is-writing');
    let promptTimer = 0, promptIdx = 0;

    function openComposer() {
        if (!isPremium) return;
        const writeIdx = wheelItems.findIndex(it => it.write);
        if (wheel.currentIndex !== writeIdx) scrollToIndex(writeIdx, true);
        document.body.classList.add('is-writing');
        composerInput.value = customText;
        syncComposer();
        setTimeout(() => composerInput.focus(), reduced ? 0 : 350 * PACE);
        clearInterval(promptTimer);
        promptTimer = setInterval(() => {
            if (composerInput.value) return;
            composerPrompt.classList.add('is-hidden');
            setTimeout(() => {
                promptIdx = (promptIdx + 1) % WRITE_PROMPTS.length;
                composerPrompt.textContent = WRITE_PROMPTS[promptIdx];
                composerPrompt.classList.remove('is-hidden');
            }, 600);
        }, 4000);
        playChime(600, 0.15);
        track('write_own_opened');
    }

    function closeComposer() {
        customText = composerInput.value.trim().replace(/\s+/g, ' ').substring(0, WRITE_OWN_MAX);
        document.body.classList.remove('is-writing');
        clearInterval(promptTimer);
        composerInput.blur();
        renderWheel();
        portalViewport.focus({ preventScroll: true });
    }

    // Grow with the text, keep the count, hide the prompt once they start
    function syncComposer() {
        composerInput.style.height = 'auto';
        composerInput.style.height = `${composerInput.scrollHeight}px`;
        const n = composerInput.value.length;
        const count = $('composerCount');
        count.textContent = `${n} / ${WRITE_OWN_MAX}`;
        count.classList.toggle('is-near', n >= WRITE_OWN_MAX - 20);
        composerPrompt.style.display = n ? 'none' : '';
        refreshCta();
    }

    /* Topics: free sets | premium collections | your own words */
    function initTopics() {
        const dock = $('portalTopicsDock');
        dock.innerHTML = '';
        let i = 0;
        const addChip = (html, onClick, extraClass = '', setId = '') => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'flow-chip' + extraClass;
            btn.style.setProperty('--i', i++);
            btn.innerHTML = html;
            if (setId) {
                btn.dataset.set = setId;
                btn.setAttribute('aria-pressed', String(activeSet.id === setId));
                btn.classList.toggle('is-active', activeSet.id === setId);
            }
            btn.addEventListener('click', () => onClick(btn));
            dock.appendChild(btn);
            return btn;
        };
        const addSep = () => { const s = document.createElement('span'); s.className = 'chip-sep'; s.setAttribute('aria-hidden', 'true'); dock.appendChild(s); };

        const sets = extraSet ? [extraSet, ...WORD_SETS] : WORD_SETS;
        sets.forEach((set, idx) => {
            if (set.premium && idx > 0 && !sets[idx - 1].premium) addSep();
            const lock = isSetLocked(set) ? '<span class="chip-lock" aria-hidden="true">🔒</span>' : '<span class="chip-dot"></span>';
            addChip(`${lock}<span>${escapeHtml(set.name)}</span>${isSetLocked(set) ? '<span class="flow-sr"> (Premium)</span>' : ''}`, () => {
                playChime(640);
                selectSet(set);
            }, set.premium ? ' is-premium-set' : '', set.id);
        });
        addSep();
        addChip(`<span aria-hidden="true">✍️</span><span>Your own</span>${isPremium ? '' : '<span class="chip-lock" aria-hidden="true">🔒</span><span class="flow-sr"> (Premium)</span>'}`, () => {
            scrollToIndex(wheelItems.findIndex(it => it.write));
            setTimeout(onWriteStop, reduced ? 0 : 500);
        }, ' is-premium-set');
    }

    /* ========== 5. Note panel (#cardForm) ========== */
    let drawerOpener = null;

    function renderSounds() {
        const row = $('soundRow');
        row.innerHTML = '';
        SOUND_DEFS.forEach(s => {
            const b = document.createElement('button');
            b.type = 'button';
            b.className = 'sound-chip';
            b.dataset.sound = s.id;
            b.setAttribute('aria-pressed', String(selectedSound === s.id));
            const locked = s.premium && !isPremium;
            b.innerHTML = `<span aria-hidden="true">${s.icon}</span><span>${escapeHtml(s.label)}</span>${locked ? '<span class="chip-lock" aria-hidden="true">🔒</span><span class="flow-sr"> (Premium)</span>' : ''}`;
            b.addEventListener('click', () => {
                if (locked) {
                    saveDraft({ then: 'use-sound', sound: s.id });
                    selectSound(s.id);        // opens the Premium sheet
                    return;
                }
                if (selectSound(s.id)) {
                    previewSound(s.id);
                    row.querySelectorAll('.sound-chip').forEach(c => c.setAttribute('aria-pressed', String(c.dataset.sound === s.id)));
                }
            });
            row.appendChild(b);
        });
    }

    function openDrawer(open) {
        if (open) {
            if (!selectedAffirmation) { showToast('Pick the words first ✨', '💌'); return; }
            const item = currentItem();
            $('drawerCardName').textContent = `${backgroundDefs[currentCardIdx].label} · ${item && item.write ? 'Your own words' : (item ? item.vibe : '')}`;
            $('drawerQuoteText').textContent = `“${selectedAffirmation}”`;
            renderSounds();
            drawerOpener = document.activeElement;
            drawer.classList.add('is-open');
            drawer.setAttribute('aria-hidden', 'false');
            armSendButton();
            setTimeout(() => { const f = $('recipientName'); if (f && !f.value) f.focus({ preventScroll: true }); }, 350);
            document.addEventListener('keydown', drawerKeydown);
            track('note_panel_opened');
        } else {
            drawer.classList.remove('is-open');
            drawer.setAttribute('aria-hidden', 'true');
            sendStage.classList.remove('is-armed');
            document.removeEventListener('keydown', drawerKeydown);
            if (drawerOpener && drawerOpener.focus) drawerOpener.focus({ preventScroll: true });
        }
        playChime(open ? 600 : 440);
    }

    // Keep focus inside the note panel; Escape closes it
    function drawerKeydown(e) {
        if (document.getElementById('premOverlay').classList.contains('open')) return;
        if (e.key === 'Escape' && !isSending) { openDrawer(false); return; }
        if (e.key !== 'Tab') return;
        const focusables = [...drawer.querySelectorAll('button:not([disabled]), input:not([disabled]), textarea, a[href]')]
            .filter(el => el.offsetWidth > 0 || el.offsetHeight > 0);
        if (!focusables.length) return;
        const first = focusables[0], last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }

    /* ========== 6. Send: the saved button from send-demo.html ==========
       js/send-plane.js (the prototype's send-wide.js) draws the flight and exposes
       window.SendPlane. We line its SVG up exactly on the send slot and press it. */
    const SVG_BTN = { x: 418.117, y: 460.55, w: 563.765 };   // the button inside the SVG
    const planeReady = () => !reduced && !!window.SendPlane;

    function placeSendSvg(left, top, scale) {
        sendSvg.style.transform = `translate(${left}px, ${top}px) scale(${scale})`;
    }
    function alignToSlot() {
        const r = sendSlot.getBoundingClientRect();
        const s = r.width / SVG_BTN.w;
        placeSendSvg(r.left - SVG_BTN.x * s, r.top - SVG_BTN.y * s, s);
    }
    // Keep the SVG glued to the slot while the panel slides in
    function armSendButton() {
        const ready = planeReady();
        sendSlot.classList.toggle('is-plain', !ready);
        sendSlot.textContent = ready ? '' : 'Send ✨';
        if (!ready) return;
        window.SendPlane.reset();
        sendStage.classList.add('is-armed');
        const until = performance.now() + 600;
        const follow = () => {
            if (isSending) return;
            alignToSlot();
            if (performance.now() < until) requestAnimationFrame(follow);
        };
        follow();
    }
    // Called by send-card-logic once the card passes its checks; resolves after "Sent!"
    async function playSend() {
        clearDraft();
        if (!planeReady()) {
            $('sendAnnounce').textContent = 'Sending your card';
            return;
        }
        window.SendPlane.press();                      // the saved button's press
        drawer.classList.add('is-sending');            // the panel steps aside
        sendStage.classList.add('is-flying');
        // ...and the button glides to centre stage, at the size the demo plays at
        const vw = viewW(), vh = viewH();
        const s = Math.min(vw / 1400, vh / 1080);
        placeSendSvg((vw - 1400 * s) / 2, (vh - 1080 * s) / 2, s);
        await wait(750 * PACE);
        sendStage.classList.remove('is-flying');
        window.SendPlane.release();                    // the plane flies, writes, lands: Sent!
        // Hold on "Thanks for sending a vibe!" long enough to read it before the success screen
        await wait((window.SendPlane.FLIGHT + 0.6) * 1000 + SENT_HOLD_MS);
        $('sendAnnounce').textContent = 'Sent';
    }

    function showSuccess() {
        drawer.classList.remove('is-open', 'is-sending');
        drawer.setAttribute('aria-hidden', 'true');
        sendStage.classList.remove('is-armed');
        document.removeEventListener('keydown', drawerKeydown);
        // The card they just made, as it will look: their card's art, their words
        const bg = backgroundDefs[currentCardIdx];
        const doneCard = $('doneCard');
        doneCard.querySelectorAll('video').forEach(v => v.remove());
        if (bg.isVideo) {
            const v = document.createElement('video');
            Object.assign(v, { src: bg.image, muted: true, loop: true, playsInline: true, autoplay: !reduced });
            v.className = 'done-card-video';
            doneCard.prepend(v);
            doneCard.style.backgroundImage = '';
        } else {
            doneCard.style.backgroundImage = `url('${bg.image}')`;
        }
        $('doneCardWords').textContent = `“${selectedAffirmation}”`;
        const to = (($('recipientName') || {}).value || '').trim();
        $('doneCardTo').textContent = to ? `For ${to}` : 'For them';

        // Only the success screen scrolls (the page behind it stops)
        document.documentElement.classList.add('flow-lock');
        const success = $('flowSuccess');
        success.classList.add('is-open');
        success.setAttribute('aria-hidden', 'false');
        setTimeout(() => { const h = $('successTitle'); if (h) { h.tabIndex = -1; h.focus({ preventScroll: true }); } }, 100);
    }

    /* ========== 7. Premium: the sheet, and coming back from Stripe ========== */
    // Remember the card, words and fields before leaving for Stripe, so the buyer lands back
    // exactly where they were (the payment link returns to send-card.html?premium=1).
    let pendingThen = null;
    function draftState(extra = {}) {
        const item = currentItem();
        return {
            background: backgroundDefs[currentCardIdx].id,
            inside: isPortalMode,
            setId: activeSet.id,
            phrase: item && !item.write ? item.text : '',
            onWrite: !!(item && item.write),
            ownWords: isWriting() ? composerInput.value : customText,
            to: ($('recipientName') || {}).value || '',
            from: ($('senderName') || {}).value || '',
            note: ($('personalMessage') || {}).value || '',
            sound: selectedSound,
            savedAt: Date.now(),
            ...extra
        };
    }
    function saveDraft(extra) {
        try { localStorage.setItem(DRAFT_KEY, JSON.stringify(draftState(extra))); } catch (e) { }
    }
    function clearDraft() {
        try { localStorage.removeItem(DRAFT_KEY); } catch (e) { }
    }
    function readDraft() {
        try {
            const d = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null');
            if (!d || Date.now() - d.savedAt > DRAFT_MAX_AGE) { clearDraft(); return null; }
            return d;
        } catch (e) { return null; }
    }

    function offerPremium(context, what, then) {
        pendingThen = then || null;
        showPremModal(context, what);
    }

    // Back from Stripe with Premium: fly straight into their card and carry on
    async function restoreDraft() {
        const d = readDraft();
        if (!d || !isPremium) return false;
        clearDraft();
        const idx = backgroundDefs.findIndex(b => b.id === d.background);
        if (idx < 0) return false;
        ['recipientName', 'senderName', 'personalMessage'].forEach((id, k) => {
            const v = [d.to, d.from, d.note][k];
            if (v && $(id)) $(id).value = v;
        });
        if (d.sound) selectedSound = d.sound;
        if (d.ownWords) customText = d.ownWords.trim().substring(0, WRITE_OWN_MAX);
        const set = WORD_SETS.find(s => s.id === d.setId);
        if (set) activeSet = set;
        initTopics();
        goToCardIndex(idx);
        await wait(reduced ? 50 : 700);
        await enterPortalMode(idx, { keepWheel: true });
        if (d.onWrite || d.then === 'write-own') {
            scrollToIndex(wheelItems.findIndex(it => it.write), true);
            if (d.then === 'write-own') openComposer();
        } else if (d.phrase) {
            const i = wheelItems.findIndex(it => it.text === d.phrase);
            if (i >= 0) scrollToIndex(i, true);
        }
        if (d.then === 'use-sound') openDrawer(true);
        track('premium_draft_restored', { then: d.then || '' });
        return true;
    }

    // A purchase finished in another tab: unlock this one in place
    function unlockInPlace() {
        if (isPremium) return;
        isPremium = true;
        document.body.classList.add('is-premium');
        updateRingTransforms();
        initTopics();
        renderWheel();
        if (drawer.classList.contains('is-open')) renderSounds();
        showToast('Premium unlocked. Thank you for supporting the project!', '✨');
    }

    /* ========== Presets and ?message= ========== */
    function applyPreset(t, auto) {
        const targetBg = (isPremium && t.premBgId) ? t.premBgId : t.bgId;
        const idx = Math.max(0, backgroundDefs.findIndex(b => b.id === targetBg));
        selectedSound = (isPremium && t.premSound) ? t.premSound : t.sound;
        extraSet = {
            id: 'preset-' + t.id, name: `${t.emoji} ${t.title}`, themeGroup: t.themeGroup || 'default',
            items: [{ text: t.affirmation, vibe: t.title }, ...WORD_SETS[0].items]
        };
        activeSet = extraSet;
        initTopics();
        document.querySelectorAll('#occasionRow .flow-chip').forEach(c => c.setAttribute('aria-pressed', String(c.dataset.preset === t.id)));
        if (isPortalMode) { selectSet(extraSet); return; }
        goToCardIndex(isCardLocked(idx) ? 0 : idx);
        wheel.currentIndex = 0; wheel.scrollY = 0; wheel.targetScrollY = 0;
        renderWheel();
        // A preset link opens on its card; a tap on a preset chip goes straight in
        if (!auto) setTimeout(() => enterPortalMode(currentCardIdx, { keepWheel: true }), reduced ? 0 : 750);
    }

    function renderOccasionRow() {
        const row = $('occasionRow');
        row.innerHTML = '';
        occasionTemplates.forEach(t => {
            const b = document.createElement('button');
            b.type = 'button';
            b.className = 'flow-chip';
            b.dataset.preset = t.id;
            b.setAttribute('aria-pressed', 'false');
            b.innerHTML = `<span aria-hidden="true">${t.emoji}</span><span>${escapeHtml(t.title)}</span>`;
            b.addEventListener('click', () => { if (!isPortalMode && !isBusy) applyOccasionTemplate(t.id); });
            row.appendChild(b);
        });
    }

    /* ========== Gestures and keys ========== */
    function setupGestures() {
        // Wheel / trackpad: collect scroll until it's worth one step
        let wheelAcc = 0, wheelLockUntil = 0;
        portalViewport.addEventListener('wheel', (e) => {
            if (isWriting()) return;
            e.preventDefault();
            const now = performance.now();
            if (now < wheelLockUntil) return;
            wheelAcc += e.deltaY;
            if (Math.abs(wheelAcc) >= 40) {
                stepPortalWheel(Math.sign(wheelAcc));
                wheelAcc = 0;
                wheelLockUntil = now + 320;
            }
        }, { passive: false });

        portalViewport.addEventListener('keydown', (e) => {
            if (isWriting()) return;
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                e.preventDefault();
                stepPortalWheel(e.key === 'ArrowDown' ? 1 : -1);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                const item = currentItem();
                if (item && item.write) onWriteStop(); else ctaAction();
            }
        });

        // Drag the words (mouse + touch). A real drag doesn't count as a tap.
        const dragStart = (y) => {
            if (isWriting()) return;
            wheel.isDragging = true;
            wheel.startY = y;
            wheel.dragDist = 0;
            wheel.dragMoved = false;
        };
        const dragMove = (y) => {
            if (!wheel.isDragging) return;
            const dy = y - wheel.startY;
            wheel.startY = y;
            wheel.dragDist += Math.abs(dy);
            if (wheel.dragDist > 8) wheel.dragMoved = true;
            wheel.targetScrollY -= dy / 150;
        };
        const dragEnd = () => {
            if (!wheel.isDragging) return;
            wheel.isDragging = false;
            wheel.targetScrollY = Math.round(wheel.targetScrollY);
            setTimeout(() => { wheel.dragMoved = false; }, 0);
        };
        portalViewport.addEventListener('mousedown', (e) => dragStart(e.clientY));
        window.addEventListener('mousemove', (e) => dragMove(e.clientY));
        window.addEventListener('mouseup', dragEnd);
        portalViewport.addEventListener('touchstart', (e) => dragStart(e.touches[0].clientY), { passive: true });
        window.addEventListener('touchmove', (e) => dragMove(e.touches[0].clientY), { passive: true });
        window.addEventListener('touchend', dragEnd);

        // Swipe the card ring in step 1
        let ringStartX = 0, ringDistX = 0, isRingDragging = false;
        cameraRig.addEventListener('touchstart', (e) => {
            if (isPortalMode) return;
            ringStartX = e.touches[0].clientX;
            ringDistX = 0;
            isRingDragging = true;
        }, { passive: true });
        cameraRig.addEventListener('touchmove', (e) => {
            if (!isRingDragging) return;
            ringDistX = e.touches[0].clientX - ringStartX;
        }, { passive: true });
        cameraRig.addEventListener('touchend', () => {
            if (!isRingDragging) return;
            isRingDragging = false;
            if (ringDistX < -40) stepRing(1);
            else if (ringDistX > 40) stepRing(-1);
        });

        // Arrow keys move the carousel while it's on screen
        document.addEventListener('keydown', (e) => {
            if (isPortalMode || isBusy || e.target.closest('input, textarea, [role="dialog"]')) return;
            if (e.key === 'ArrowRight') stepRing(1);
            else if (e.key === 'ArrowLeft') stepRing(-1);
        });

        const onResize = () => {
            starfield.resize(viewW(), viewH());
            if (isPortalMode && !isBusy) applyPortalFrame(1);
            if (!isSending && sendStage.classList.contains('is-armed')) alignToSlot();
        };
        window.addEventListener('resize', onResize);
        if (window.visualViewport) window.visualViewport.addEventListener('resize', onResize);
        drawer.querySelector('.drawer-scroll').addEventListener('scroll', () => {
            if (!isSending && sendStage.classList.contains('is-armed')) alignToSlot();
        }, { passive: true });

        window.addEventListener('storage', (e) => {
            if (e.key === 'premium_unlocked' && e.newValue === '1') unlockInPlace();
        });
    }

    function animate() {
        if (isPortalMode) {
            wheel.scrollY += (wheel.targetScrollY - wheel.scrollY) * (wheel.isDragging ? 0.35 : 0.09);
            updateTransforms();
        }
        requestAnimationFrame(animate);
    }

    /* ========== Start ========== */
    function init() {
        cameraRig = $('cameraRig');
        portalTrack = $('portalTrack');
        portalViewport = $('portalViewport');
        portalSpace = $('portalSpace');
        spaceArt = $('spaceArt');
        spaceDim = $('spaceDim');
        spaceRim = $('spaceRim');
        spaceCanvas = $('spaceCanvas');
        composerInput = $('composerInput');
        composerPrompt = $('composerPrompt');
        mainCta = $('mainCta');
        drawer = $('cardForm');
        sendStage = $('sendStage');
        sendSvg = sendStage.querySelector('svg');
        sendSlot = $('sendButton');
        starfield.ctx = spaceCanvas.getContext('2d');

        document.documentElement.style.setProperty('--pace', PACE);
        document.body.classList.toggle('is-premium', isPremium);
        document.body.classList.toggle('reduced-motion', reduced);

        initCardRing();
        renderOccasionRow();
        starfield.resize(viewW(), viewH());

        // A ?message= from our own pages opens with those words first
        if (window._externalMessage) {
            extraSet = {
                id: 'message', name: 'Your message', themeGroup: 'default',
                items: [{ text: window._externalMessage, vibe: 'Chosen for them' }, ...WORD_SETS[0].items]
            };
            activeSet = extraSet;
        }
        initTopics();
        renderWheel();
        if (window._appliedOccasion) applyOccasionTemplate(window._appliedOccasion, true);

        $('mainCta').addEventListener('click', () => ctaAction());
        $('btnBackToRing').addEventListener('click', exitPortalMode);
        $('ringPrev').addEventListener('click', () => stepRing(-1));
        $('ringNext').addEventListener('click', () => stepRing(1));
        $('portalUp').addEventListener('click', () => stepPortalWheel(-1));
        $('portalDown').addEventListener('click', () => stepPortalWheel(1));
        $('portalShuffle').addEventListener('click', randomizePortal);
        $('composerDone').addEventListener('click', closeComposer);
        $('drawerClose').addEventListener('click', () => { if (!isSending) openDrawer(false); });
        composerInput.addEventListener('input', syncComposer);
        composerInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' || (e.key === 'Enter' && !e.shiftKey)) {
                e.preventDefault();
                closeComposer();
            }
        });
        // Unlock: remember where they are, then go to Stripe in this same tab
        $('premCtaBtn').addEventListener('click', () => {
            saveDraft(pendingThen || {});
            track('premium_checkout_started', { then: (pendingThen && pendingThen.then) || '' });
        });
        $('premLater').addEventListener('click', () => hidePremModal());

        setupGestures();
        animate();
        restoreDraft();
    }

    window.CardFlow = {
        applyPreset, playSend, showSuccess, backToWords: () => openDrawer(false),
        get busy() { return isBusy; },       // a transition is playing
        get inside() { return isPortalMode; }  // the portal is open
    };
    document.addEventListener('DOMContentLoaded', init);
})();
