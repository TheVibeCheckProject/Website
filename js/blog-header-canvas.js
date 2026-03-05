/* ============================================================
   Blog Header — Particle Canvas Animation
   Black particles form readable text. Neon green shimmer at rest.
   Smoke wisps curl from edges. Mouse = antigravity repulsion.
   ============================================================ */
(function () {
    const TEXT = "The Vibe Check Blog's";
    const NEON_R = 57, NEON_G = 255, NEON_B = 20; // #39FF14

    function getTextData(text, fontSize, cw, ch) {
        const off = document.createElement('canvas');
        off.width = cw; off.height = ch;
        const o = off.getContext('2d');
        o.fillStyle = '#fff';
        o.font = `700 ${fontSize}px Fredoka, sans-serif`;
        o.textAlign = 'center';
        o.textBaseline = 'middle';
        o.fillText(text, cw / 2, ch / 2);
        return o.getImageData(0, 0, cw, ch);
    }

    function init() {
        const canvas = document.getElementById('blogHeaderCanvas');
        if (!canvas) return;

        const wrap = canvas.parentElement;
        const dpr = window.devicePixelRatio || 1;
        const w = wrap.clientWidth;
        const h = wrap.clientHeight || 220;

        canvas.width = w * dpr;
        canvas.height = h * dpr;
        canvas.style.width = w + 'px';
        canvas.style.height = h + 'px';
        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);

        const fs = Math.min(w * 0.085, 68);
        const textCenterY = h * 0.45;

        // Build text image and extract positions + edges
        const off = document.createElement('canvas');
        off.width = w; off.height = h;
        const octx = off.getContext('2d');
        octx.fillStyle = '#fff';
        octx.font = `700 ${fs}px Fredoka, sans-serif`;
        octx.textAlign = 'center';
        octx.textBaseline = 'middle';
        octx.fillText(TEXT, w / 2, textCenterY);
        const imgData = octx.getImageData(0, 0, w, h);

        const pts = [];
        const edges = [];
        const gap = 2;
        for (let y = 0; y < h; y += gap) {
            for (let x = 0; x < w; x += gap) {
                const a = imgData.data[(y * w + x) * 4 + 3];
                if (a > 128) {
                    pts.push({ x, y });
                    if (y > 1 && x > 1 && y < h - 2 && x < w - 2) {
                        const neighbors = [
                            imgData.data[((y - 2) * w + x) * 4 + 3],
                            imgData.data[((y + 2) * w + x) * 4 + 3],
                            imgData.data[(y * w + x - 2) * 4 + 3],
                            imgData.data[(y * w + x + 2) * 4 + 3],
                        ];
                        if (neighbors.some(n => n < 128)) edges.push({ x, y });
                    }
                }
            }
        }

        const mouse = { x: -9999, y: -9999, r: 80 };

        const particles = pts.map(p => ({
            x: p.x, y: p.y, bx: p.x, by: p.y,
            vx: 0, vy: 0,
            size: 1.8 + Math.random() * 0.8,
            shimmerPhase: Math.random() * Math.PI * 2,
        }));

        // Smoke system
        const smokeParticles = [];
        function spawnSmoke() {
            if (edges.length === 0) return;
            const src = edges[Math.floor(Math.random() * edges.length)];
            const angle = Math.random() * Math.PI * 2;
            smokeParticles.push({
                x: src.x + (Math.random() - 0.5) * 4,
                y: src.y + (Math.random() - 0.5) * 4,
                vx: Math.cos(angle) * (0.3 + Math.random() * 0.6),
                vy: -(0.4 + Math.random() * 0.8),
                size: 8 + Math.random() * 20,
                alpha: 0.06 + Math.random() * 0.08,
                life: 1.0,
                decay: 0.003 + Math.random() * 0.004,
                wobblePhase: Math.random() * Math.PI * 2,
                wobbleSpeed: 0.02 + Math.random() * 0.03,
                wobbleAmp: 0.3 + Math.random() * 0.8,
            });
        }

        canvas.addEventListener('mousemove', e => {
            const r = canvas.getBoundingClientRect();
            mouse.x = (e.clientX - r.left) * (w / r.width);
            mouse.y = (e.clientY - r.top) * (h / r.height);
        });
        canvas.addEventListener('mouseleave', () => {
            mouse.x = -9999; mouse.y = -9999;
        });

        let time = 0;
        function draw() {
            time += 0.015;
            ctx.clearRect(0, 0, w, h);

            // Ambient glow
            const bgGlow = ctx.createRadialGradient(w / 2, textCenterY, 0, w / 2, textCenterY, w * 0.35);
            bgGlow.addColorStop(0, `rgba(${NEON_R},${NEON_G},${NEON_B},0.03)`);
            bgGlow.addColorStop(1, `rgba(${NEON_R},${NEON_G},${NEON_B},0)`);
            ctx.fillStyle = bgGlow;
            ctx.fillRect(0, 0, w, h);

            // ---- SMOKE (behind text) ----
            if (Math.random() < 0.4 && smokeParticles.length < 80) spawnSmoke();
            if (Math.random() < 0.2 && smokeParticles.length < 80) spawnSmoke();

            for (let i = smokeParticles.length - 1; i >= 0; i--) {
                const s = smokeParticles[i];
                s.wobblePhase += s.wobbleSpeed;
                s.x += s.vx + Math.sin(s.wobblePhase) * s.wobbleAmp;
                s.y += s.vy;
                s.vy *= 0.998;
                s.size += 0.15;
                s.life -= s.decay;

                if (s.life <= 0) { smokeParticles.splice(i, 1); continue; }

                const smokeAlpha = s.alpha * s.life;
                const grad = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.size);
                grad.addColorStop(0, `rgba(${NEON_R},${NEON_G},${NEON_B},${smokeAlpha})`);
                grad.addColorStop(0.4, `rgba(${NEON_R},${NEON_G},${NEON_B},${smokeAlpha * 0.5})`);
                grad.addColorStop(1, `rgba(${NEON_R},${NEON_G},${NEON_B},0)`);
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
                ctx.fill();
            }

            // ---- TEXT PARTICLES ----
            const shimmerX = w * 0.5 + Math.sin(time * 0.8) * w * 0.5;
            const shimmerY = textCenterY + Math.cos(time * 0.6) * 30;

            for (const p of particles) {
                const dx = p.x - mouse.x, dy = p.y - mouse.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < mouse.r && dist > 0) {
                    const force = (mouse.r - dist) / mouse.r;
                    p.vx += (dx / dist) * force * force * 8;
                    p.vy += (dy / dist) * force * force * 8;
                }

                p.vx += (p.bx - p.x) * 0.045;
                p.vy += (p.by - p.y) * 0.045;
                p.vx *= 0.88;
                p.vy *= 0.88;
                p.x += p.vx;
                p.y += p.vy;

                const distFromHome = Math.sqrt((p.x - p.bx) ** 2 + (p.y - p.by) ** 2);
                const disturb = Math.min(distFromHome / 35, 1);

                const sdx = p.bx - shimmerX, sdy = p.by - shimmerY;
                const shimmerDist = Math.sqrt(sdx * sdx + sdy * sdy);
                const shimmerFactor = Math.max(0, 1 - shimmerDist / 60) * 0.35;

                const glow = Math.min(1, disturb + shimmerFactor);
                const r = Math.floor(10 + glow * (NEON_R - 10));
                const g = Math.floor(10 + glow * (NEON_G - 10));
                const b = Math.floor(10 + glow * (NEON_B - 10));

                ctx.fillStyle = `rgb(${r},${g},${b})`;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();

                if (glow > 0.15) {
                    ctx.fillStyle = `rgba(${NEON_R},${NEON_G},${NEON_B},${glow * 0.08})`;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
                    ctx.fill();
                }
            }

            // Antigravity ring
            if (mouse.x > 0 && mouse.y > 0) {
                ctx.strokeStyle = `rgba(${NEON_R},${NEON_G},${NEON_B},0.2)`;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.arc(mouse.x, mouse.y, mouse.r, 0, Math.PI * 2);
                ctx.stroke();

                const cg = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, mouse.r * 0.3);
                cg.addColorStop(0, `rgba(${NEON_R},${NEON_G},${NEON_B},0.1)`);
                cg.addColorStop(1, `rgba(${NEON_R},${NEON_G},${NEON_B},0)`);
                ctx.fillStyle = cg;
                ctx.beginPath();
                ctx.arc(mouse.x, mouse.y, mouse.r * 0.3, 0, Math.PI * 2);
                ctx.fill();
            }

            requestAnimationFrame(draw);
        }
        draw();
    }

    // Wait for font then init
    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(init);
    } else {
        window.addEventListener('load', init);
    }

    // Reinitialize on resize (debounced)
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(init, 300);
    });
})();
