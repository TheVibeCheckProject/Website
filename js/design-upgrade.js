/**
 * THE VIBE CHECK PROJECT - DESIGN CONCEPT CONTROLLER
 * Supports 3D Tilt and Card Demo activation; theme toggle logic is centralized in js/script.js.
 */

(function () {
    function initDesignUpgrade() {
        // Setup 3D Cursor Tilt for Daily Spark Card
        initCard3DTilt();

        // Ensure Card Demo Wrapper is visible
        const cardDemo = document.querySelector('.card-demo-wrapper');
        if (cardDemo) {
            cardDemo.classList.add('active');
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

    // Expose applyTheme backwards-compatibility hook
    window.applyTheme = function (themeName, animate) {
        if (window.applyThemeConcept) {
            window.applyThemeConcept(themeName, animate);
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initDesignUpgrade);
    } else {
        initDesignUpgrade();
    }
})();

