/* ================================================
   ALIVE ANIMATIONS — making the site feel like it breathes
   ================================================ */

document.addEventListener('DOMContentLoaded', () => {

    // ==========================================
    // 1. HERO TITLE — Letters cascade into place
    // ==========================================
    const heroTitle = document.querySelector('.hero-title');
    if (heroTitle) {
        const text = heroTitle.textContent;
        heroTitle.textContent = '';
        heroTitle.style.opacity = '1';

        // Split into words, then letters
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
                span.style.transition = `all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)`;
                span.style.transitionDelay = `${(wi * 4 + ci) * 0.04 + 0.3}s`;
                wordSpan.appendChild(span);
            });

            heroTitle.appendChild(wordSpan);

            // Add space between words
            if (wi < words.length - 1) {
                const space = document.createElement('span');
                space.innerHTML = '&nbsp;';
                space.style.display = 'inline-block';
                heroTitle.appendChild(space);
            }
        });

        // Trigger the animation
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                document.querySelectorAll('.hero-letter').forEach(letter => {
                    letter.style.opacity = '1';
                    letter.style.transform = 'translateY(0) rotate(0deg)';
                });
            });
        });
    }

    // ==========================================
    // 2. HERO SUBTITLE — Fade up with stagger
    // ==========================================
    const heroSubtitle = document.querySelector('.hero-subtitle');
    if (heroSubtitle) {
        heroSubtitle.style.opacity = '0';
        heroSubtitle.style.transform = 'translateY(20px)';
        heroSubtitle.style.transition = 'all 0.8s ease';
        heroSubtitle.style.transitionDelay = '1.2s';
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                heroSubtitle.style.opacity = '1';
                heroSubtitle.style.transform = 'translateY(0)';
            });
        });
    }

    // ==========================================
    // 3. HERO CTA — Pop in with bounce
    // ==========================================
    const heroCTA = document.querySelector('.hero-cta');
    if (heroCTA) {
        heroCTA.style.opacity = '0';
        heroCTA.style.transform = 'scale(0.8)';
        heroCTA.style.transition = 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)';
        heroCTA.style.transitionDelay = '1.6s';
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                heroCTA.style.opacity = '1';
                heroCTA.style.transform = 'scale(1)';
            });
        });
    }

    // ==========================================
    // 4. SCROLL REVEALS — Directional entrances
    // ==========================================
    const directions = ['left', 'right', 'bottom', 'rotate-in'];

    // Tag cards with random entry directions
    document.querySelectorAll('.why-card, .step, .feature-card, .affirmation-card, .blog-showcase-card, .use-case, .support-card, .stat-card').forEach((card, i) => {
        const dir = directions[i % directions.length];
        card.setAttribute('data-reveal-dir', dir);
        card.classList.add('reveal-directional');
    });

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                revealObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });

    document.querySelectorAll('.reveal-directional').forEach(el => revealObserver.observe(el));

    // ==========================================
    // 5. SECTION TITLES — Slide up with underline draw
    // ==========================================
    const titleObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('title-visible');
                titleObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.3 });

    document.querySelectorAll('.section-title').forEach(title => {
        title.classList.add('title-animate');
        titleObserver.observe(title);
    });

    // ==========================================
    // 6. FLOATING SMOKE WORDS — Affirmations drifting
    // ==========================================
    const particleContainer = document.createElement('div');
    particleContainer.classList.add('floating-particles');
    particleContainer.setAttribute('aria-hidden', 'true');
    document.body.appendChild(particleContainer);

    // Expanded dictionary of affirmation words
    const smokeWords = [
        'breathe', 'enough', 'worthy', 'loved', 'capable', 'strong', 'peace', 'calm',
        'valid', 'brave', 'seen', 'safe', 'grow', 'rest', 'heal', 'light',
        'hope', 'kind', 'true', 'bold', 'free', 'gentle', 'steady', 'warm',
        'here', 'now', 'okay', 'alive', 'glow', 'rise', 'soar', 'bloom',
        'trust', 'grace', 'power', 'magic', 'still', 'fluid', 'whole', 'soft',
        'open', 'clear', 'rooted', 'vast', 'deep', 'real', 'wild', 'held'
    ];

    // Shuffle array to ensure unique words are picked without repetition
    const shuffledWords = [...smokeWords].sort(() => 0.5 - Math.random());

    // Create subtle drifting emotion words, constructed from large "smoke"
    // Use a grid system to ensure words don't overlap when spawning
    const cols = 4;
    const rows = 3;
    const cellWidth = 100 / cols;
    const cellHeight = 100 / rows;

    // Create an array of grid cells [x, y]
    const cells = [];
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            cells.push({ col: c, row: r });
        }
    }
    // Shuffle the cells to randomize which region gets which word
    const shuffledCells = cells.sort(() => 0.5 - Math.random());

    for (let i = 0; i < 12; i++) {
        const wordEl = document.createElement('span');
        wordEl.textContent = shuffledWords[i]; // Guaranteed unique
        wordEl.classList.add('smoke-word');

        // Assign to a specific grid cell, with some padding inside the cell
        const cell = shuffledCells[i];
        const randomXOffset = Math.random() * (cellWidth * 0.6); // 60% of cell width
        const randomYOffset = Math.random() * (cellHeight * 0.6);

        wordEl.style.left = `${(cell.col * cellWidth) + randomXOffset}vw`;
        wordEl.style.top = `${(cell.row * cellHeight) + randomYOffset}%`;

        // Vastly increase size so it looks like a cloud of text
        const sizeRem = 3 + Math.random() * 6; // 3rem to 9rem
        wordEl.style.fontSize = `${sizeRem}rem`;

        // Faster drift so it doesn't look static
        wordEl.style.animationDuration = `${18 + Math.random() * 15}s`;
        wordEl.style.animationDelay = `${Math.random() * -30}s`;

        // Random rotation and horizontal scatter for dynamic drift
        const startRot = Math.random() * 40 - 20;
        const endRot = startRot + (Math.random() * 60 - 30);
        const scatterX = Math.random() * 300 - 150; // Drift left or right by up to 150px

        wordEl.style.setProperty('--start-rot', `${startRot}deg`);
        wordEl.style.setProperty('--end-rot', `${endRot}deg`);
        wordEl.style.setProperty('--scatter-x', `${scatterX}px`);

        particleContainer.appendChild(wordEl);
    }

    // ==========================================
    // 7. TYPEWRITER for hero affirmation
    // ==========================================
    const vibeText = document.getElementById('vibeText');
    if (vibeText) {
        const originalText = vibeText.textContent;
        vibeText.textContent = '';
        vibeText.style.borderRight = '2px solid var(--color-primary)';

        let charIndex = 0;
        const typeDelay = 2000; // Wait for hero animation to finish

        setTimeout(() => {
            const typeInterval = setInterval(() => {
                vibeText.textContent += originalText[charIndex];
                charIndex++;
                if (charIndex >= originalText.length) {
                    clearInterval(typeInterval);
                    // Remove cursor after done
                    setTimeout(() => {
                        vibeText.style.borderRight = 'none';
                    }, 1000);
                }
            }, 35);
        }, typeDelay);
    }

    // ==========================================
    // 8. COUNTER ANIMATION — Count up on scroll
    // ==========================================
    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const el = entry.target;
                const final = parseInt(el.getAttribute('data-count') || el.textContent);
                if (isNaN(final)) return;

                let current = 0;
                const step = Math.max(1, Math.floor(final / 60));
                const timer = setInterval(() => {
                    current += step;
                    if (current >= final) {
                        current = final;
                        clearInterval(timer);
                    }
                    el.textContent = current.toLocaleString();
                }, 20);

                counterObserver.unobserve(el);
            }
        });
    }, { threshold: 0.5 });

    document.querySelectorAll('.stat-number').forEach(el => {
        if (!isNaN(parseInt(el.textContent))) {
            el.setAttribute('data-count', el.textContent);
            el.textContent = '0';
            counterObserver.observe(el);
        }
    });

    // ==========================================
    // 9. MAGNETIC HOVER on CTA buttons
    // ==========================================
    document.querySelectorAll('.btn-primary').forEach(btn => {
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

});
