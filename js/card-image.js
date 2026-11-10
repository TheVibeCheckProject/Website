/**
 * A card as a downloadable image: phone wallpaper (1179x2556) or square (1080x1080).
 * Used by the card maker (send-card.html) and the recipient page (view-card.html).
 *
 *   const canvas = await VibeCardImage.render({ background, light, themeGroup, affirmation,
 *                                               recipientName, senderName, layout, video });
 *   await VibeCardImage.save(canvas, 'my-card.png');      // share sheet on phones, download elsewhere
 *   VibeCardImage.mount(el, { card: () => ({...}), allow: () => true });   // the "Save image" control
 *
 * The picture is drawn here, not screenshotted: the card's own artwork (cover-fitted), a soft
 * shade, the words in Cormorant Garamond, "For <name>" above, "— <sender>" below and the small
 * site line. Same treatment as the homepage's image (renderImage in js/sky.js).
 */
(function () {
    'use strict';

    const SIZES = { wallpaper: [1179, 2556], square: [1080, 1080] };
    const SERIF = '"Cormorant Garamond", "Iowan Old Style", Georgia, serif';
    const SANS = 'Outfit, -apple-system, "Segoe UI", sans-serif';
    const INK = [20, 17, 31];
    const CREAM = '#FFF6E4';

    // Cards with no artwork (older links): the same gradients as css/view-card.css
    const THEME_GRADIENTS = {
        default: ['#3b2350', '#7a3b6b', '#c2607a'],
        birthday: ['#4a2a1a', '#b3662a', '#f0b04a'],
        celebrate: ['#4a2a1a', '#b3662a', '#f0b04a'],
        anxiety: ['#13233f', '#2d5b8f', '#5fb3d6'],
        love: ['#3d1430', '#a02f63', '#f07a9c'],
        healing: ['#1d1a44', '#4b3f9a', '#9a8ce0'],
        grief: ['#1d1a44', '#4b3f9a', '#9a8ce0']
    };

    const wait = (ms) => new Promise(r => setTimeout(r, ms));
    const clip = (v, n) => (typeof v === 'string' ? v : '').replace(/\s+/g, ' ').trim().slice(0, n);

    function hexRgb(hex) {
        const m = /^#?([0-9a-f]{6})$/i.exec(String(hex).trim());
        if (!m) return null;
        const n = parseInt(m[1], 16);
        return [n >> 16, (n >> 8) & 255, n & 255];
    }
    // A card's `light` colours are pale; mixed toward the site's night ink they make a calm ground
    function towardInk(hex, amount) {
        const c = hexRgb(hex) || [122, 59, 107];
        return `rgb(${c.map((v, i) => Math.round(v + (INK[i] - v) * amount)).join(',')})`;
    }

    function loadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = src;
        });
    }

    // One frame of an animated card: the page's own playing <video> when it has one, otherwise a
    // muted one loaded just for this. Resolves null if no frame arrives in time.
    async function videoFrame(src, existing) {
        if (existing && existing.readyState >= 2 && existing.videoWidth) return existing;
        const v = document.createElement('video');
        v.muted = true;
        v.playsInline = true;
        v.preload = 'auto';
        const ready = new Promise((resolve) => {
            v.addEventListener('loadeddata', () => resolve(true), { once: true });
            v.addEventListener('error', () => resolve(false), { once: true });
        });
        v.src = src;
        v.load();
        if (!(await Promise.race([ready, wait(5000).then(() => false)]))) return null;
        // A little way in, so it isn't a black first frame
        try {
            const seeked = new Promise((resolve) => v.addEventListener('seeked', resolve, { once: true }));
            v.currentTime = Math.min(0.6, (v.duration || 1) / 2);
            await Promise.race([seeked, wait(1500)]);
        } catch (e) { }
        return v.videoWidth ? v : null;
    }

    function drawCover(ctx, media, mw, mh, w, h) {
        const s = Math.max(w / mw, h / mh);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(media, (w - mw * s) / 2, (h - mh * s) / 2, mw * s, mh * s);
    }

    function drawGradient(ctx, w, h, stops) {
        // About 160deg, like the theme gradients on the card itself
        const g = ctx.createLinearGradient(w * 0.32, 0, w * 0.68, h);
        g.addColorStop(0, stops[0]);
        g.addColorStop(0.55, stops[1]);
        g.addColorStop(1, stops[2]);
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
    }

    // Break text into lines no wider than maxW; a single over-long word is split by characters
    function wrapLines(ctx, text, maxW) {
        const lines = [];
        let line = '';
        const push = (word) => {
            const test = line ? line + ' ' + word : word;
            if (ctx.measureText(test).width <= maxW) { line = test; return; }
            if (line) { lines.push(line); line = ''; }
            if (ctx.measureText(word).width <= maxW) { line = word; return; }
            let part = '';
            for (const ch of word) {
                if (part && ctx.measureText(part + ch).width > maxW) { lines.push(part); part = ch; }
                else part += ch;
            }
            line = part;
        };
        text.split(' ').filter(Boolean).forEach(push);
        if (line) lines.push(line);
        return lines;
    }

    function spacedText(ctx, text, x, y, spacing) {
        if ('letterSpacing' in ctx) {
            ctx.letterSpacing = spacing + 'px';
            ctx.fillText(text, x + spacing / 2, y);
            ctx.letterSpacing = '0px';
            return;
        }
        const total = [...text].reduce((s, ch) => s + ctx.measureText(ch).width + spacing, -spacing);
        let cx = x - total / 2;
        const align = ctx.textAlign;
        ctx.textAlign = 'left';
        for (const ch of text) { ctx.fillText(ch, cx, y); cx += ctx.measureText(ch).width + spacing; }
        ctx.textAlign = align;
    }

    // Shorten a one-line label until it fits
    function fitLine(ctx, text, maxW, spacing = 0) {
        const width = (t) => ctx.measureText(t).width + spacing * t.length;
        if (width(text) <= maxW) return text;
        let t = text;
        while (t.length > 1 && width(t + '…') > maxW) t = t.slice(0, -1);
        return t.trimEnd() + '…';
    }

    async function render(o) {
        const layout = o.layout === 'square' ? 'square' : 'wallpaper';
        const [w, h] = SIZES[layout];
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');

        const words = clip(o.affirmation, 280) || "You're doing better than you think you are.";
        const to = clip(o.recipientName, 50);
        const from = clip(o.senderName, 50);

        try {
            if (document.fonts && document.fonts.load) {
                await Promise.race([Promise.all([
                    document.fonts.load(`italic 600 40px "Cormorant Garamond"`, words),
                    document.fonts.load('600 14px Outfit'),
                    document.fonts.load('500 14px Outfit')
                ]), wait(3000)]);
            }
        } catch (e) { }

        // ── The card's own artwork ──
        const bg = typeof o.background === 'string' ? o.background : '';
        const fallback = () => {
            const light = Array.isArray(o.light) && o.light.length >= 3 ? o.light : null;
            if (light && bg) drawGradient(ctx, w, h, [towardInk(light[1], 0.72), towardInk(light[0], 0.45), towardInk(light[2], 0.3)]);
            else drawGradient(ctx, w, h, THEME_GRADIENTS[String(o.themeGroup || '').toLowerCase()] || THEME_GRADIENTS.default);
        };
        let drawn = false;
        try {
            if (/\.mp4$/i.test(bg)) {
                const v = await videoFrame(bg, o.video);
                if (v) { drawCover(ctx, v, v.videoWidth, v.videoHeight, w, h); drawn = true; }
            } else if (bg) {
                const img = await loadImage(bg);
                drawCover(ctx, img, img.naturalWidth, img.naturalHeight, w, h);
                drawn = true;
            }
            if (drawn) ctx.getImageData(0, 0, 1, 1);   // throws if the canvas can't be exported
        } catch (e) { drawn = false; }
        if (!drawn) {
            // A fresh canvas state in case a cross-origin frame tainted this one
            if (bg) { canvas.width = w; }
            fallback();
        }

        // ── Shade: a little everywhere, more behind the words and the site line ──
        const top = layout === 'wallpaper' ? h * 0.22 : h * 0.1;        // clock
        const bottom = layout === 'wallpaper' ? h * 0.855 : h * 0.87;    // lock-screen buttons / site line
        const cy = (top + bottom) / 2;
        ctx.fillStyle = 'rgba(14,12,30,0.16)';
        ctx.fillRect(0, 0, w, h);
        const shade = ctx.createRadialGradient(w / 2, cy, 0, w / 2, cy, Math.max(w, h * 0.5) * 0.82);
        shade.addColorStop(0, 'rgba(14,12,30,0.5)');
        shade.addColorStop(0.55, 'rgba(14,12,30,0.3)');
        shade.addColorStop(1, 'rgba(14,12,30,0)');
        ctx.fillStyle = shade;
        ctx.fillRect(0, 0, w, h);
        const foot = ctx.createLinearGradient(0, h * 0.7, 0, h);
        foot.addColorStop(0, 'rgba(14,12,30,0)');
        foot.addColorStop(1, 'rgba(14,12,30,0.42)');
        ctx.fillStyle = foot;
        ctx.fillRect(0, h * 0.7, w, h * 0.3);

        // ── Text ──
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const small = Math.max(13, w * 0.021);
        const labelH = to ? small * 3.4 : 0;
        const maxW = w * (layout === 'wallpaper' ? 0.8 : 0.78);

        // The words: as large as fits the space between the label and the sign-off
        const quote = `“${words}”`;
        let size = w * (words.length > 180 ? 0.058 : words.length > 110 ? 0.066 : words.length > 70 ? 0.076 : 0.088);
        let lines, signSize, signH, lh;
        for (let i = 0; i < 24; i++) {
            ctx.font = `italic 600 ${size}px ${SERIF}`;
            lines = wrapLines(ctx, quote, maxW);
            lh = size * 1.24;
            signSize = Math.max(w * 0.034, size * 0.52);
            signH = from ? signSize * 2.5 : 0;
            if (labelH + lines.length * lh + signH <= bottom - top) break;
            size *= 0.94;
        }
        const blockH = labelH + lines.length * lh + signH;
        let y = Math.max(top, cy - blockH / 2);

        if (to) {
            ctx.font = `600 ${small}px ${SANS}`;
            ctx.fillStyle = 'rgba(255,246,228,0.84)';
            ctx.shadowColor = 'rgba(10,8,24,0.5)';
            ctx.shadowBlur = small * 0.6;
            const spacing = small * 0.22;
            spacedText(ctx, fitLine(ctx, `FOR ${to.toUpperCase()}`, maxW, spacing), w / 2, y + small * 0.8, spacing);
            y += labelH;
        }

        ctx.font = `italic 600 ${size}px ${SERIF}`;
        ctx.fillStyle = CREAM;
        ctx.shadowColor = 'rgba(10,8,24,0.6)';
        ctx.shadowBlur = size * 0.5;
        lines.forEach((ln, i) => ctx.fillText(ln, w / 2, y + lh * (i + 0.5)));
        y += lines.length * lh;

        if (from) {
            ctx.font = `italic 500 ${signSize}px ${SERIF}`;
            ctx.fillStyle = 'rgba(255,246,228,0.9)';
            ctx.shadowBlur = signSize * 0.5;
            ctx.fillText(fitLine(ctx, `— ${from}`, maxW), w / 2, y + signH - signSize * 0.7);
        }

        // The small site line: above the lock-screen buttons on a wallpaper
        ctx.shadowBlur = small * 0.5;
        ctx.shadowColor = 'rgba(10,8,24,0.45)';
        ctx.font = `500 ${small}px ${SANS}`;
        ctx.fillStyle = 'rgba(255,246,228,0.62)';
        spacedText(ctx, 'THEVIBECHECKPROJECT.COM', w / 2, layout === 'wallpaper' ? h * 0.872 : h - small * 2.6, small * 0.2);
        ctx.shadowBlur = 0;
        return canvas;
    }

    // Phones: the share sheet has "Save Image" (how a wallpaper reaches the camera roll).
    // Everywhere else: a normal download. Resolves 'shared' | 'saved' | 'cancelled' | 'failed'.
    async function save(canvas, filename) {
        const blob = await new Promise(r => { try { canvas.toBlob(r, 'image/png'); } catch (e) { r(null); } });
        if (!blob) return 'failed';
        const touch = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
        if (touch && navigator.canShare) {
            try {
                const file = new File([blob], filename, { type: 'image/png' });
                if (navigator.canShare({ files: [file] })) {
                    try { await navigator.share({ files: [file] }); return 'shared'; }
                    catch (err) { if (err && err.name === 'AbortError') return 'cancelled'; }
                }
            } catch (e) { }
        }
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 4000);
        return 'saved';
    }

    const slug = (s) => clip(s, 30).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    const filenameFor = (card, layout) => `vibe-check-card${slug(card.recipientName) ? '-for-' + slug(card.recipientName) : ''}-${layout}.png`;

    /**
     * The "Save image" control: a small button that opens two choices.
     *   card()   -> the card to draw (fields as for render), read when a choice is made
     *   allow()  -> optional; return false to stop (e.g. after opening the Premium sheet)
     *   where    -> label for telemetry ('maker' | 'success' | 'recipient')
     */
    function mount(el, opts) {
        if (!el || el.dataset.mounted) return;
        el.dataset.mounted = '1';
        el.classList.add('save-image');
        // Paths only: js/send-plane.js turns every <rect>/<circle> on send-card.html into a <path>
        el.innerHTML = `
            <button type="button" class="save-image-btn" aria-haspopup="true" aria-expanded="false">
                <svg viewBox="0 0 20 20" width="15" height="15" aria-hidden="true"><path d="M10 3v9m0 0-3.5-3.5M10 12l3.5-3.5M4 15.5h12" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>
                <span>Save image</span>
            </button>
            <div class="save-image-menu" role="group" aria-label="Save the card as an image" hidden>
                <button type="button" data-save="wallpaper"><span>Phone wallpaper</span><small>1179 × 2556</small></button>
                <button type="button" data-save="square"><span>Square</span><small>1080 × 1080</small></button>
            </div>
            <span class="save-image-status" role="status"></span>`;
        const btn = el.querySelector('.save-image-btn');
        const menu = el.querySelector('.save-image-menu');
        const status = el.querySelector('.save-image-status');
        let statusTimer = 0, busy = false;

        const close = () => { menu.hidden = true; btn.setAttribute('aria-expanded', 'false'); el.classList.remove('is-open'); };
        const say = (text, ok) => {
            clearTimeout(statusTimer);
            status.textContent = text;
            status.classList.remove('is-shown', 'is-ok');
            void status.offsetWidth;                       // restart the pop
            status.classList.add('is-shown');
            status.classList.toggle('is-ok', !!ok);
            statusTimer = setTimeout(() => { status.classList.remove('is-shown'); status.textContent = ''; }, 2800);
        };

        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (busy) return;
            const open = menu.hidden;
            menu.hidden = !open;
            btn.setAttribute('aria-expanded', String(open));
            el.classList.toggle('is-open', open);
        });
        document.addEventListener('click', (e) => { if (!menu.hidden && !el.contains(e.target)) close(); });
        el.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !menu.hidden) { e.stopPropagation(); close(); btn.focus(); }
        });

        menu.addEventListener('click', async (e) => {
            const choice = e.target.closest('[data-save]');
            if (!choice || busy) return;
            const layout = choice.dataset.save;
            close();
            if (opts.allow && opts.allow() === false) return;
            const card = opts.card && opts.card();
            if (!card) return;
            busy = true;
            btn.classList.add('is-loading');
            let result = 'failed';
            try {
                const canvas = await render({ ...card, layout });
                result = await save(canvas, filenameFor(card, layout));
            } catch (err) { console.warn('Card image failed:', err); }
            btn.classList.remove('is-loading');
            busy = false;
            if (result === 'saved') say('Saved to your downloads', true);
            else if (result === 'failed') say("That didn't save. Try again?");
            if (window.VibeTelemetry) window.VibeTelemetry.track('card_image_saved', { layout, where: opts.where || '', result });
            if (opts.onSaved) opts.onSaved(layout, result);
        });
    }

    window.VibeCardImage = { render, save, mount, SIZES };
})();
