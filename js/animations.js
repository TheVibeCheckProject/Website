/* ================================================
   ALIVE ANIMATIONS — making the site feel like it breathes
   ================================================ */

document.addEventListener('DOMContentLoaded', () => {

    const isMobile = window.innerWidth <= 768;

    // ==========================================
    // 1. HERO TITLE — Letters cascade into place (Desktop Only)
    // ==========================================
    const heroTitle = document.querySelector('.hero-title');
    if (heroTitle) {
        if (isMobile) {
            // Simple fade in for mobile
            heroTitle.style.opacity = '1';
        } else {
            const text = heroTitle.textContent;
            heroTitle.textContent = '';
            heroTitle.style.opacity = '1';

            const words = text.split(' ');
            words.forEach((word, wi) => {
                const wordSpan = document.createElement('span');
                wordSpan.style.display = 'inline-block';
                wordSpan.style.whiteSpace = 'nowrap';

                [...word].forEach((char, ci) => {
                    const span = document.createElement('span');
                    span.textContent = char;
                    span.classList.add('hero-letter');
                    span.style.display = 'inline-block';
                    span.style.opacity = '0';
                    span.style.transform = 'translateY(-40px) rotate(' + (Math.random() * 20 - 10) + 'deg)';
                    span.style.transition = `transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)`;
                    span.style.willChange = 'transform, opacity';
                    span.style.transitionDelay = `${(wi * 4 + ci) * 0.04 + 0.3}s`;
                    wordSpan.appendChild(span);
                });

                heroTitle.appendChild(wordSpan);

                if (wi < words.length - 1) {
                    const space = document.createElement('span');
                    space.innerHTML = '&nbsp;';
                    space.style.display = 'inline-block';
                    heroTitle.appendChild(space);
                }
            });

            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    document.querySelectorAll('.hero-letter').forEach(letter => {
                        letter.style.opacity = '1';
                        letter.style.transform = 'translateY(0) rotate(0deg)';
                    });
                });
            });
        }
    }

    // ==========================================
    // 2. HERO SUBTITLE & CTA — Optimized fade
    // ==========================================
    const heroSubtitle = document.querySelector('.hero-subtitle');
    if (heroSubtitle) {
        heroSubtitle.style.opacity = '0';
        heroSubtitle.style.transform = 'translateY(20px)';
        heroSubtitle.style.transition = 'transform 0.8s ease, opacity 0.8s ease';
        heroSubtitle.style.willChange = 'transform, opacity';
        heroSubtitle.style.transitionDelay = isMobile ? '0.3s' : '1.2s';
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                heroSubtitle.style.opacity = '1';
                heroSubtitle.style.transform = 'translateY(0)';
            });
        });
    }

    const heroCTA = document.querySelector('.hero-cta');
    if (heroCTA) {
        heroCTA.style.opacity = '0';
        heroCTA.style.transform = isMobile ? 'translateY(10px)' : 'scale(0.8)';
        heroCTA.style.transition = 'transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)';
        heroCTA.style.willChange = 'transform, opacity';
        heroCTA.style.transitionDelay = isMobile ? '0.5s' : '1.6s';
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                heroCTA.style.opacity = '1';
                heroCTA.style.transform = isMobile ? 'translateY(0)' : 'scale(1)';
            });
        });
    }

    // ==========================================
    // 3. SCROLL REVEALS — Directional (Optimized)
    // ==========================================
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                revealObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    const revealItems = document.querySelectorAll('.why-card, .step, .feature-card, .affirmation-card, .blog-showcase-card, .use-case, .support-card, .stat-card, .flow-card');
    const directions = ['left', 'right', 'bottom', 'rotate-in'];

    revealItems.forEach((card, i) => {
        const dir = card.getAttribute('data-reveal-dir') || directions[i % directions.length];
        card.setAttribute('data-reveal-dir', dir);
        card.classList.add('reveal-directional');
        revealObserver.observe(card);
    });

    // ==========================================
    // 4. FLOATING SMOKE WORDS — Affirmations drifting (Desktop Only)
    // ==========================================
    if (!isMobile) {
        setTimeout(initSmokeWords, 4000);
    }

    function initSmokeWords() {
        const particleContainer = document.createElement('div');
        particleContainer.classList.add('floating-particles');
        particleContainer.setAttribute('aria-hidden', 'true');
        document.body.appendChild(particleContainer);

        const smokeWords = [
            'breathe', 'enough', 'worthy', 'loved', 'capable', 'strong', 'peace', 'calm',
            'valid', 'brave', 'seen', 'safe', 'grow', 'rest', 'heal', 'light',
            'hope', 'kind', 'true', 'bold', 'free', 'gentle', 'steady', 'warm'
        ];

        const cols = 4;
        const rows = 3;
        const cellWidth = 100 / cols;
        const cellHeight = 100 / rows;
        const cells = [];
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                cells.push({ col: c, row: r });
            }
        }
        const shuffledCells = cells.sort(() => 0.5 - Math.random());
        const shuffledWords = [...smokeWords].sort(() => 0.5 - Math.random());

        for (let i = 0; i < Math.min(12, shuffledWords.length); i++) {
            const wordEl = document.createElement('span');
            wordEl.textContent = shuffledWords[i];
            wordEl.classList.add('smoke-word');

            const cell = shuffledCells[i];
            const randomXOffset = Math.random() * (cellWidth * 0.6);
            const randomYOffset = Math.random() * (cellHeight * 0.6);

            wordEl.style.left = `${(cell.col * cellWidth) + randomXOffset}vw`;
            wordEl.style.top = `${(cell.row * cellHeight) + randomYOffset}%`;

            const sizeRem = 3 + Math.random() * 6;
            wordEl.style.fontSize = `${sizeRem}rem`;
            wordEl.style.animationDuration = `${18 + Math.random() * 15}s`;
            wordEl.style.animationDelay = `${Math.random() * -30}s`;

            const startRot = Math.random() * 40 - 20;
            const endRot = startRot + (Math.random() * 60 - 30);
            const scatterX = Math.random() * 300 - 150;

            wordEl.style.setProperty('--start-rot', `${startRot}deg`);
            wordEl.style.setProperty('--end-rot', `${endRot}deg`);
            wordEl.style.setProperty('--scatter-x', `${scatterX}px`);
            wordEl.style.willChange = 'transform, opacity';

            particleContainer.appendChild(wordEl);
        }
    }

    // ==========================================
    // 5. MAGNETIC HOVER (Desktop Only)
    // ==========================================
    if (!isMobile) {
        document.querySelectorAll('.btn-primary, .massive-btn').forEach(btn => {
            btn.addEventListener('mousemove', (e) => {
                const rect = btn.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;
                btn.style.transform = `translate(${x * 0.15}px, ${y * 0.15}px)`;
            });
            btn.addEventListener('mouseleave', () => {
                btn.style.transform = '';
            });
        });
    }

});
