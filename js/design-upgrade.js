/**
 * THE VIBE CHECK PROJECT - DESIGN CONCEPT CONTROLLER
 * Enables seamless live toggling between:
 * Concept 1: Warm Modern Editorial & Glassmorphism (Default)
 * Concept 2: Playful Kinetic & Vibrant Cyber-Soul
 */

(function () {
    const THEMES = {
        editorial: {
            titleMain: "Words that lift.",
            titleGradient: "Moments that matter.",
            tagBadge: "✨ Anonymous Affirmations & Vibe Checks"
        },
        kinetic: {
            titleMain: "Drop Good Vibes.",
            titleGradient: "Zero Awkwardness.",
            tagBadge: "⚡ 100% Free · Anonymous · No Sign-Up"
        }
    };

    function initDesignUpgrade() {
        const savedTheme = localStorage.getItem('vibe_design_concept') || 'editorial';
        applyTheme(savedTheme, false);

        // Setup Switcher Buttons
        const btnEditorial = document.getElementById('btnThemeEditorial');
        const btnKinetic = document.getElementById('btnThemeKinetic');

        if (btnEditorial) {
            btnEditorial.addEventListener('click', () => applyTheme('editorial', true));
        }
        if (btnKinetic) {
            btnKinetic.addEventListener('click', () => applyTheme('kinetic', true));
        }

        // Setup 3D Cursor Tilt for Daily Spark Card
        initCard3DTilt();

        // Ensure Card Demo Wrapper is visible
        const cardDemo = document.querySelector('.card-demo-wrapper');
        if (cardDemo) {
            cardDemo.classList.add('active');
        }
    }

    function applyTheme(themeName, animate) {
        if (!THEMES[themeName]) themeName = 'editorial';

        document.body.setAttribute('data-design-concept', themeName);
        localStorage.setItem('vibe_design_concept', themeName);

        // Update Switcher Button States
        const btnEditorial = document.getElementById('btnThemeEditorial');
        const btnKinetic = document.getElementById('btnThemeKinetic');

        if (btnEditorial && btnKinetic) {
            if (themeName === 'editorial') {
                btnEditorial.classList.add('active');
                btnKinetic.classList.remove('active');
            } else {
                btnKinetic.classList.add('active');
                btnEditorial.classList.remove('active');
            }
        }

        // Update Headline and Badge Texts
        const titleMain = document.querySelector('.hero-title-main');
        const titleGradient = document.querySelector('.hero-title-gradient');
        const tagBadge = document.querySelector('.hero-tag-badge');

        const themeData = THEMES[themeName];

        if (titleMain && titleGradient) {
            if (animate) {
                titleMain.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
                titleGradient.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
                titleMain.style.opacity = '0';
                titleGradient.style.opacity = '0';

                setTimeout(() => {
                    titleMain.textContent = themeData.titleMain;
                    titleGradient.textContent = themeData.titleGradient;
                    titleMain.style.opacity = '1';
                    titleGradient.style.opacity = '1';
                }, 200);
            } else {
                titleMain.textContent = themeData.titleMain;
                titleGradient.textContent = themeData.titleGradient;
            }
        }

        if (tagBadge) {
            tagBadge.textContent = themeData.tagBadge;
        }
    }

    function initCard3DTilt() {
        const card = document.querySelector('.hero-affirmation-dock');
        if (!card) return;

        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;

            const rotateX = (-y / rect.height) * 12; // tilt degrees
            const rotateY = (x / rect.width) * 12;

            card.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-4px)`;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)';
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initDesignUpgrade);
    } else {
        initDesignUpgrade();
    }
})();
