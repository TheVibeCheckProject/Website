/**
 * THE VIBE CHECK PROJECT — the sky painter (window.VibeSky)
 *
 * Paints a sky for a moment in time: gradient by hour, the sun or the moon in its real phase,
 * stars, soft cloud bands and seeded hills. One painter, three uses:
 *   - the live backdrop on the homepage (it follows the visitor's own clock)
 *   - the art behind each day's affirmation, in the hero and in My Vibes
 *   - downloadable images (phone wallpaper, square), crisp at any size because nothing is a bitmap
 *
 * No dependencies. Everything is deterministic for a given { seed, hour, date, mood }.
 */
(function () {
    'use strict';

    const INK = [20, 17, 31]; // page background #14111F

    // ── Small helpers ──
    const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
    const lerp = (a, b, t) => a + (b - a) * t;
    const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
    const mix = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
    const rgb = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;

    /** Seeded PRNG (mulberry32) from any string. */
    function rng(seed) {
        let h = 1779033703 ^ String(seed).length;
        for (let i = 0; i < String(seed).length; i++) {
            h = Math.imul(h ^ String(seed).charCodeAt(i), 3432918353);
            h = (h << 13) | (h >>> 19);
        }
        let a = h >>> 0;
        return function () {
            a |= 0; a = (a + 0x6D2B79F5) | 0;
            let t = Math.imul(a ^ (a >>> 15), 1 | a);
            t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }

    // ── The sky through a day: [hour, top, middle, horizon, star strength] ──
    const KEYS = [
        [0, '#0A0920', '#17143A', '#33265A', 1],
        [4.6, '#0D0C26', '#211B4A', '#4A3470', 1],
        [6.1, '#241F55', '#8A5788', '#F2A27C', 0.2],
        [7.6, '#3F6298', '#8FA3CF', '#F3CFAE', 0],
        [12, '#2F5F9C', '#6C97C8', '#B9D0E4', 0],
        [16.4, '#3A6096', '#8E9FCB', '#EFCFAB', 0],
        [18.4, '#33306B', '#BE5F7A', '#FBAE6A', 0.12],
        [19.9, '#191640', '#49306C', '#AE5878', 0.55],
        [21.4, '#0E0C25', '#1E1946', '#402D63', 1],
        [24, '#0A0920', '#17143A', '#33265A', 1],
    ].map(k => [k[0], hex(k[1]), hex(k[2]), hex(k[3]), k[4]]);

    /** Colours for an hour of the day (0–24, fractional). */
    function palette(hour) {
        const h = ((hour % 24) + 24) % 24;
        let i = 0;
        while (i < KEYS.length - 2 && h >= KEYS[i + 1][0]) i++;
        const a = KEYS[i], b = KEYS[i + 1];
        const t = clamp((h - a[0]) / (b[0] - a[0]));
        const e = t * t * (3 - 2 * t);
        return { top: mix(a[1], b[1], e), mid: mix(a[2], b[2], e), low: mix(a[3], b[3], e), stars: lerp(a[4], b[4], e) };
    }

    const SUNRISE = 6.1, SUNSET = 18.6;
    const isDay = (hour) => hour >= SUNRISE && hour < SUNSET;

    /** Moon phase for a date: 0 new, 0.25 first quarter, 0.5 full, 0.75 last quarter. */
    function moonPhase(date) {
        const synodic = 29.530588853;
        const knownNew = Date.UTC(2000, 0, 6, 18, 14) / 86400000;
        const days = date.getTime() / 86400000 - knownNew;
        return (((days / synodic) % 1) + 1) % 1;
    }
    function moonName(phase) {
        const names = ['New moon', 'Waxing crescent', 'First quarter', 'Waxing gibbous', 'Full moon', 'Waning gibbous', 'Last quarter', 'Waning crescent'];
        return names[Math.floor(((phase + 0.0625) % 1) * 8)];
    }

    /** What a time of day is called, for copy ("this evening's sky"). */
    function partOfDay(hour) {
        if (hour < 5) return 'night';
        if (hour < 12) return 'morning';
        if (hour < 17) return 'afternoon';
        if (hour < 21) return 'evening';
        return 'night';
    }

    // Weather for a mood: cloud cover 0–1, drift speed, dimming, tint
    const MOODS = {
        heavy: { cloud: 1, drift: 0.5, dim: 0.34, tint: [70, 78, 104] },
        restless: { cloud: 0.6, drift: 3.2, dim: 0.12, tint: [96, 84, 130] },
        tired: { cloud: 0.45, drift: 0.3, dim: 0.26, tint: [84, 76, 110] },
        steady: { cloud: 0.2, drift: 0.8, dim: 0, tint: null },
        bright: { cloud: 0.05, drift: 1, dim: -0.06, tint: null },
    };
    const DEFAULT_WEATHER = { cloud: 0.28, drift: 1, dim: 0, tint: null };

    // ── Layers ──
    function drawGradient(ctx, w, h, pal, weather) {
        let { top, mid, low } = pal;
        if (weather.tint) {
            const k = 0.35 * weather.cloud + 0.1;
            top = mix(top, weather.tint, k * 0.6); mid = mix(mid, weather.tint, k); low = mix(low, weather.tint, k);
        }
        if (weather.dim > 0) { top = mix(top, INK, weather.dim); mid = mix(mid, INK, weather.dim); low = mix(low, INK, weather.dim * 0.8); }
        if (weather.dim < 0) { low = mix(low, [255, 236, 200], -weather.dim * 2); }
        const g = ctx.createLinearGradient(0, 0, 0, h);
        g.addColorStop(0, rgb(top));
        g.addColorStop(0.48, rgb(mid));
        g.addColorStop(0.8, rgb(low));
        g.addColorStop(1, rgb(mix(low, INK, 0.25)));
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
        return { top, mid, low };
    }

    function makeStars(seed, count) {
        const r = rng(seed + ':stars');
        const stars = [];
        for (let i = 0; i < count; i++) {
            stars.push({ x: r(), y: Math.pow(r(), 1.5) * 0.78, s: 0.4 + Math.pow(r(), 4) * 1.2, p: r() * 6.283, f: 0.4 + r() * 1.3, warm: r() > 0.82 });
        }
        return stars;
    }

    function drawStars(ctx, w, h, stars, strength, t, unit) {
        if (strength <= 0.01) return;
        for (const s of stars) {
            const tw = 0.62 + 0.38 * Math.sin(s.p + t * s.f);
            ctx.globalAlpha = clamp(strength * tw * (0.35 + s.s * 0.5));
            ctx.fillStyle = s.warm ? '#FFE3B8' : '#FFFFFF';
            ctx.beginPath();
            ctx.arc(s.x * w, s.y * h, s.s * unit, 0, 6.283);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }

    /** Where the sun or moon sits: an arc from the left horizon to the right. */
    function bodyPosition(hour, w, h, horizonY) {
        let t;
        if (isDay(hour)) t = (hour - SUNRISE) / (SUNSET - SUNRISE);
        else t = (((hour - SUNSET) + 24) % 24) / (24 - (SUNSET - SUNRISE));
        const x = lerp(0.14, 0.86, t) * w;
        const lift = Math.sin(t * Math.PI);
        const y = lerp(horizonY - h * 0.02, h * 0.16, Math.pow(lift, 0.8));
        return { x, y, t };
    }

    function drawSun(ctx, x, y, r, pal) {
        const glow = ctx.createRadialGradient(x, y, r * 0.6, x, y, r * 7);
        glow.addColorStop(0, 'rgba(255,236,196,0.55)');
        glow.addColorStop(0.35, 'rgba(255,214,160,0.16)');
        glow.addColorStop(1, 'rgba(255,214,160,0)');
        ctx.fillStyle = glow;
        ctx.fillRect(x - r * 7, y - r * 7, r * 14, r * 14);
        ctx.fillStyle = rgb(mix([255, 246, 224], pal.low, 0.18));
        ctx.beginPath(); ctx.arc(x, y, r, 0, 6.283); ctx.fill();
    }

    function drawMoon(ctx, x, y, r, phase, sky) {
        const lit = (1 - Math.cos(phase * 6.283)) / 2; // 0 new → 1 full
        const glow = ctx.createRadialGradient(x, y, r * 0.8, x, y, r * 5.5);
        glow.addColorStop(0, `rgba(255,244,222,${0.08 + 0.26 * lit})`);
        glow.addColorStop(1, 'rgba(255,244,222,0)');
        ctx.fillStyle = glow;
        ctx.fillRect(x - r * 6, y - r * 6, r * 12, r * 12);

        // The dark side, faintly lighter than the sky (earthshine)
        ctx.fillStyle = rgb(mix(sky, [170, 164, 210], 0.07 + 0.1 * lit));
        ctx.beginPath(); ctx.arc(x, y, r, 0, 6.283); ctx.fill();

        // The lit side: a half disc plus/minus the terminator ellipse
        if (lit > 0.01) {
            const waxing = phase < 0.5;
            const k = Math.cos(phase * 6.283); // 1 new … -1 full
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(-0.38);
            if (!waxing) ctx.scale(-1, 1);
            ctx.fillStyle = '#FFF4DE';
            ctx.beginPath();
            ctx.arc(0, 0, r, -Math.PI / 2, Math.PI / 2, false);            // right limb
            ctx.ellipse(0, 0, Math.abs(k) * r, r, 0, Math.PI / 2, -Math.PI / 2, k > 0); // terminator
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }
    }

    function makeClouds(seed) {
        const r = rng(seed + ':clouds');
        const clouds = [];
        for (let i = 0; i < 9; i++) {
            clouds.push({ x: r(), y: 0.12 + r() * 0.5, w: 0.3 + r() * 0.45, h: 0.018 + r() * 0.03, a: 0.35 + r() * 0.5, v: 0.4 + r() * 0.9, rank: r() });
        }
        return clouds;
    }

    function drawClouds(ctx, w, h, clouds, weather, colours, t) {
        const cover = weather.cloud;
        if (cover <= 0.01) return;
        const tone = mix(colours.low, [255, 255, 255], 0.35);
        for (const c of clouds) {
            if (c.rank > cover * 1.25 + 0.12) continue;
            const span = 1 + c.w;
            const x = ((((c.x + t * 0.0016 * c.v * weather.drift) % span) + span) % span - c.w / 2) * w;
            const y = c.y * h;
            const rw = c.w * w * 0.5, rh = Math.max(c.h * h * (1 + cover), 6);
            ctx.save();
            ctx.translate(x, y);
            ctx.scale(1, rh / rw);
            const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rw);
            const alpha = c.a * (0.1 + cover * 0.22);
            g.addColorStop(0, rgb(tone, alpha));
            g.addColorStop(0.55, rgb(tone, alpha * 0.45));
            g.addColorStop(1, rgb(tone, 0));
            ctx.fillStyle = g;
            ctx.beginPath(); ctx.arc(0, 0, rw, 0, 6.283); ctx.fill();
            ctx.restore();
        }
    }

    /** Ridgelines: a few layers of summed sines, seeded, nearer ones darker. */
    function makeHills(seed) {
        const r = rng(seed + ':hills');
        const layers = [];
        for (let i = 0; i < 4; i++) {
            const waves = [];
            for (let j = 0; j < 5; j++) waves.push({ f: (0.6 + r() * 1.2) * (j + 1) * 0.9, a: (0.5 + r() * 0.5) / (j + 1.4), p: r() * 6.283 });
            layers.push({ waves, base: r() });
        }
        return layers;
    }

    function drawHills(ctx, w, h, hills, colours, horizonY, fadeToInk) {
        const n = hills.length;
        for (let i = 0; i < n; i++) {
            const depth = i / (n - 1); // 0 far … 1 near
            const layer = hills[i];
            const yBase = horizonY + (h - horizonY) * (0.04 + depth * 0.5);
            const amp = (h - horizonY) * lerp(0.2, 0.3, depth) * (0.75 + layer.base * 0.5);
            const colour = mix(mix(colours.low, colours.mid, 0.55), INK, lerp(0.42, 0.93, Math.pow(depth, 0.8)));
            ctx.fillStyle = rgb(colour);
            ctx.beginPath();
            ctx.moveTo(0, h);
            const steps = Math.max(48, Math.round(w / 14));
            for (let s = 0; s <= steps; s++) {
                const u = s / steps;
                let y = 0;
                for (const wv of layer.waves) y += Math.sin(u * 6.283 * wv.f + wv.p) * wv.a;
                ctx.lineTo(u * w, yBase - (y * 0.5 + 0.35) * amp);
            }
            ctx.lineTo(w, h);
            ctx.closePath();
            ctx.fill();
        }
        if (fadeToInk) {
            const g = ctx.createLinearGradient(0, h * 0.84, 0, h);
            g.addColorStop(0, rgb(INK, 0));
            g.addColorStop(1, rgb(INK, 1));
            ctx.fillStyle = g;
            ctx.fillRect(0, h * 0.84, w, h * 0.16 + 1);
        }
    }

    /**
     * Paint one frame.
     * @param {CanvasRenderingContext2D} ctx
     * @param {number} w,h   size in canvas pixels
     * @param {object} o     { hour, date, seed, mood, t, fadeToInk, horizon, model }
     *                       model: the result of VibeSky.model(seed) (cached shapes); optional.
     */
    function paint(ctx, w, h, o = {}) {
        const date = o.date || new Date();
        const hour = typeof o.hour === 'number' ? o.hour : date.getHours() + date.getMinutes() / 60;
        const m = o.model || model(o.seed || 'vibe');
        const weather = blendWeather(o.mood, o.moodMix);
        const t = o.t || 0;
        const unit = Math.sqrt(w * h) / 860;
        const horizonY = h * (o.horizon || 0.7);

        const pal = palette(hour);
        const colours = drawGradient(ctx, w, h, pal, weather);
        drawStars(ctx, w, horizonY / 0.78, m.stars, pal.stars * (1 - weather.cloud * 0.75), t, unit);

        const body = bodyPosition(hour, w, h, horizonY);
        const veil = 1 - weather.cloud * 0.55;
        ctx.globalAlpha = veil;
        if (isDay(hour)) drawSun(ctx, body.x, body.y, unit * 20, colours);
        else {
            const f = clamp(body.y / h);
            const local = f < 0.48 ? mix(colours.top, colours.mid, f / 0.48) : mix(colours.mid, colours.low, clamp((f - 0.48) / 0.32));
            drawMoon(ctx, body.x, body.y, unit * 22, moonPhase(date), local);
        }
        ctx.globalAlpha = 1;

        drawClouds(ctx, w, horizonY, m.clouds, weather, colours, t);
        drawHills(ctx, w, h, m.hills, colours, horizonY, o.fadeToInk);
        return { hour, body, colours };
    }

    function blendWeather(mood, moodMix) {
        const target = MOODS[mood] || DEFAULT_WEATHER;
        if (!moodMix || moodMix.k >= 1) return target;
        const from = MOODS[moodMix.from] || DEFAULT_WEATHER;
        const k = moodMix.k;
        const tint = target.tint || from.tint;
        return {
            cloud: lerp(from.cloud, target.cloud, k), drift: lerp(from.drift, target.drift, k), dim: lerp(from.dim, target.dim, k),
            tint: tint ? tint : null,
        };
    }

    /** The seeded shapes for a sky (stars, clouds, hills). Cache this between frames. */
    function model(seed) {
        return { stars: makeStars(seed, 170), clouds: makeClouds(seed), hills: makeHills(seed) };
    }

    /** Paint a still sky into a canvas element, sized for its box (for cards and thumbnails). */
    function paintInto(canvas, o = {}) {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const w = Math.max(1, Math.round((o.width || canvas.clientWidth || 300) * dpr));
        const h = Math.max(1, Math.round((o.height || canvas.clientHeight || 400) * dpr));
        if (canvas.width !== w) canvas.width = w;
        if (canvas.height !== h) canvas.height = h;
        return paint(canvas.getContext('2d'), w, h, o);
    }

    // ── Words on a sky (the downloadable image) ──
    function wrapLines(ctx, text, maxWidth) {
        const words = String(text).split(/\s+/);
        const lines = [];
        let line = '';
        for (const word of words) {
            const next = line ? line + ' ' + word : word;
            if (ctx.measureText(next).width > maxWidth && line) { lines.push(line); line = word; } else line = next;
        }
        if (line) lines.push(line);
        return lines;
    }

    /**
     * Render an affirmation over its sky. Returns a canvas.
     * @param {object} o { text, width, height, hour, date, seed, mood, label, layout: 'wallpaper' | 'square' }
     */
    function renderImage(o) {
        const canvas = document.createElement('canvas');
        const w = canvas.width = o.width, h = canvas.height = o.height;
        const ctx = canvas.getContext('2d');
        paint(ctx, w, h, { hour: o.hour, date: o.date, seed: o.seed, mood: o.mood, horizon: o.layout === 'wallpaper' ? 0.76 : 0.72 });

        // A soft shade behind the words so they read on any sky
        const cy = h * (o.layout === 'wallpaper' ? 0.55 : 0.46);
        const shade = ctx.createRadialGradient(w / 2, cy, 0, w / 2, cy, w * 0.75);
        shade.addColorStop(0, 'rgba(14,12,30,0.42)');
        shade.addColorStop(1, 'rgba(14,12,30,0)');
        ctx.fillStyle = shade;
        ctx.fillRect(0, 0, w, h);

        const serif = '"Cormorant Garamond", "Iowan Old Style", Georgia, serif';
        const sans = 'Outfit, -apple-system, "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#FFF6E4';

        let size = w * (o.text.length > 110 ? 0.064 : o.text.length > 70 ? 0.074 : 0.086);
        let lines;
        for (let i = 0; i < 8; i++) {
            ctx.font = `500 ${size}px ${serif}`;
            lines = wrapLines(ctx, o.text, w * 0.78);
            if (lines.length * size * 1.22 < h * 0.36) break;
            size *= 0.92;
        }
        const lh = size * 1.22;
        ctx.shadowColor = 'rgba(10,8,24,0.55)';
        ctx.shadowBlur = size * 0.5;
        lines.forEach((ln, i) => ctx.fillText(ln, w / 2, cy - ((lines.length - 1) / 2 - i) * lh));
        ctx.shadowBlur = 0;

        const small = Math.max(13, w * 0.021);
        if (o.label) {
            ctx.font = `600 ${small}px ${sans}`;
            ctx.fillStyle = 'rgba(255,246,228,0.78)';
            spacedText(ctx, String(o.label).toUpperCase(), w / 2, cy - (lines.length / 2) * lh - small * 2.6, small * 0.22);
        }
        ctx.font = `500 ${small}px ${sans}`;
        ctx.fillStyle = 'rgba(255,246,228,0.6)';
        spacedText(ctx, 'THEVIBECHECKPROJECT.COM', w / 2, h - small * (o.layout === 'wallpaper' ? 6.5 : 2.6), small * 0.2);
        return canvas;
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

    window.VibeSky = { paint, paintInto, model, palette, moonPhase, moonName, partOfDay, isDay, renderImage, MOODS: Object.keys(MOODS) };
})();
