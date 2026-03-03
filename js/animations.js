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

    const smokeWords = ['breathe', 'enough', 'worthy', 'loved', 'capable', 'strong', 'peace', 'calm', 'valid', 'brave', 'seen', 'safe', 'grow', 'rest', 'heal', 'light'];

    // Create subtle drifting emotion words
    for (let i = 0; i < 12; i++) {
        const wordEl = document.createElement('span');
        wordEl.textContent = smokeWords[Math.floor(Math.random() * smokeWords.length)];
        wordEl.classList.add('smoke-word');
        wordEl.style.left = `${Math.random() * 90 + 5}vw`;
        wordEl.style.top = `${Math.random() * 90 + 5}%`;

        // Randomize the animation settings for each word to make them unique
        wordEl.style.animationDuration = `${25 + Math.random() * 25}s`;
        wordEl.style.animationDelay = `${Math.random() * -30}s`;

        // Use custom properties to define random start/end rotation in CSS
        const startRot = Math.random() * 40 - 20;
        const endRot = startRot + (Math.random() * 40 - 20);
        wordEl.style.setProperty('--start-rot', `${startRot}deg`);
        wordEl.style.setProperty('--end-rot', `${endRot}deg`);

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
