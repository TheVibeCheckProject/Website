(function () {
    const words = ["Advice", "Guides", "Blogs"];
    const fonts = ["'Pacifico', cursive", "'Caveat', cursive", "'Permanent Marker', cursive"];
    const colors = ["#FEC84A", "#67E8F9", "#FF6B9D"];
    const shadows = [
        "0 0 5px rgba(254,200,74,0.5), 0 0 15px rgba(254,200,74,0.3)",
        "0 0 5px rgba(103,232,249,0.5), 0 0 15px rgba(103,232,249,0.3)",
        "0 0 5px rgba(255,107,157,0.5), 0 0 15px rgba(255,107,157,0.3)"
    ];

    const isBlog = window.location.pathname.includes('/blog/');
    const baseTitle = isBlog ? "The Vibe Check Blog" : "The Vibe Check Project";

    let idx = 0;

    function rotate() {
        const next = (idx + 1) % words.length;

        // Target all possible rotating spans
        const allSpans = [
            ...document.querySelectorAll('.rotating-word'), // Blog header
            ...document.querySelectorAll('.rotating-logo-word') // Navbar logo
        ];

        allSpans.forEach(span => {
            span.classList.remove('in');
            span.classList.add('out');

            setTimeout(() => {
                span.textContent = words[next];
                span.style.fontFamily = fonts[next];

                // Header-specific scaling
                if (span.classList.contains('rotating-word')) {
                    span.style.fontSize = next === 1 ? '130%' : '100%';
                }

                span.style.color = colors[next];
                if (span.style.webkitTextFillColor !== undefined) {
                    span.style.webkitTextFillColor = colors[next];
                }
                span.style.background = 'none';
                span.style.textShadow = shadows[next];

                // Sync tab title
                document.title = `${baseTitle} | ${words[next]}`;

                span.classList.remove('out');
                span.classList.add('waiting');
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        span.classList.remove('waiting');
                        span.classList.add('in');
                    });
                });
            }, 500);
        });

        idx = next;
    }

    // Set initial state
    document.addEventListener('DOMContentLoaded', () => {
        const initialSpans = [
            ...document.querySelectorAll('.rotating-word'),
            ...document.querySelectorAll('.rotating-logo-word')
        ];
        initialSpans.forEach(span => {
            span.style.fontFamily = fonts[0];
            span.style.color = colors[0];
            span.style.textShadow = shadows[0];
        });
        document.title = `${baseTitle} | ${words[0]}`;

        // Start rotation
        setInterval(rotate, 3000);
    });
})();
