/**
 * The Vibe Check Project - Main JavaScript
 * Premium interactions and animations
 */

// State management
let splashCompleted = false;

// ====================
// Splash Screen
// ====================
function completeSplashScreen() {
    if (splashCompleted) return;
    splashCompleted = true;

    const splashScreen = document.getElementById('splash-screen');
    const mainContent = document.getElementById('main-content');

    splashScreen.classList.add('hidden');
    document.body.style.overflow = 'auto';

    setTimeout(() => {
        mainContent.classList.add('show');
        splashScreen.style.display = 'none';
        
        // Initialize all features
        initParallax();
        initScrollReveal();
        initCounters();
        initLucideIcons();
    }, 600);

    // Trigger Tally popup after delay
    setTimeout(() => {
        triggerTallyPopup();
    }, 1000);
}

// Tally popup trigger
function triggerTallyPopup() {
    if (window.Tally) {
        window.Tally.openPopup('mR7JRj');
    } else {
        setTimeout(triggerTallyPopup, 100);
    }
}

// ====================
// Parallax Effects
// ====================
function initParallax() {
    const heroBg = document.getElementById('hero-bg');
    let ticking = false;
    
    window.addEventListener('scroll', function() {
        if (!ticking) {
            window.requestAnimationFrame(function() {
                const scrolled = window.pageYOffset;
                
                // Hero parallax
                if (heroBg && scrolled < window.innerHeight) {
                    const parallaxSpeed = 0.5;
                    heroBg.style.transform = `translateY(${scrolled * parallaxSpeed}px)`;
                }
                
                ticking = false;
            });
            
            ticking = true;
        }
    }, { passive: true });
}

// ====================
// Scroll Progress Bar
// ====================
function updateScrollProgress() {
    const scrollProgress = document.getElementById('scroll-progress');
    const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrolled = (window.pageYOffset / windowHeight) * 100;
    scrollProgress.style.width = Math.min(scrolled, 100) + '%';
}

// ====================
// Animated Counters
// ====================
function initCounters() {
    const counters = document.querySelectorAll('.stat[data-target]');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !entry.target.classList.contains('counted')) {
                const target = parseInt(entry.target.getAttribute('data-target'));
                const suffix = entry.target.textContent.match(/[K\+M%]+/)[0];
                animateCounter(entry.target, target, suffix);
                entry.target.classList.add('counted');
            }
        });
    }, { threshold: 0.5 });

    counters.forEach(counter => observer.observe(counter));
}

function animateCounter(element, target, suffix) {
    let current = 0;
    const increment = target / 50;
    const duration = 1500; // 1.5 seconds
    const stepTime = duration / 50;
    
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            element.textContent = target + suffix;
            clearInterval(timer);
        } else {
            element.textContent = Math.ceil(current) + suffix;
        }
    }, stepTime);
}

// ====================
// Scroll Reveal Animations
// ====================
function initScrollReveal() {
    const reveals = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');
    
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    }, { 
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    reveals.forEach(reveal => {
        revealObserver.observe(reveal);
    });
}

// ====================
// Navigation Scroll Effect
// ====================
function initNavigation() {
    const nav = document.getElementById('nav');
    let lastScroll = 0;
    
    window.addEventListener('scroll', function() {
        const currentScroll = window.pageYOffset;
        
        if (currentScroll > 50) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }
        
        lastScroll = currentScroll;
    }, { passive: true });
}

// ====================
// Lucide Icons Initialization
// ====================
function initLucideIcons() {
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    } else {
        // Retry after a short delay if lucide not loaded yet
        setTimeout(initLucideIcons, 100);
    }
}

// ====================
// Smooth Scroll for Anchor Links
// ====================
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href === '#') return;
            
            e.preventDefault();
            const target = document.querySelector(href);
            
            if (target) {
                const offsetTop = target.offsetTop - 80; // Account for nav height
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// ====================
// Button Ripple Effect
// ====================
function initButtonRipples() {
    document.querySelectorAll('.btn').forEach(button => {
        button.addEventListener('click', function(e) {
            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const ripple = document.createElement('span');
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            ripple.className = 'ripple';
            
            this.appendChild(ripple);
            
            setTimeout(() => ripple.remove(), 600);
        });
    });
}

// ====================
// Lazy Loading Images
// ====================
function initLazyLoading() {
    const images = document.querySelectorAll('img[data-src]');
    
    const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
                imageObserver.unobserve(img);
            }
        });
    });
    
    images.forEach(img => imageObserver.observe(img));
}

// ====================
// Event Listeners
// ====================

// Splash screen events
document.addEventListener('keydown', function(event) {
    if (event.key === 'Enter' && !splashCompleted) {
        event.preventDefault();
        completeSplashScreen();
    }
});

document.getElementById('enter-prompt')?.addEventListener('click', function() {
    if (!splashCompleted) {
        completeSplashScreen();
    }
});

// CTA button events
document.getElementById('hero-cta')?.addEventListener('click', function(e) {
    e.preventDefault();
    triggerTallyPopup();
});

document.getElementById('cta-button')?.addEventListener('click', function(e) {
    e.preventDefault();
    triggerTallyPopup();
});

// Scroll events
window.addEventListener('scroll', function() {
    updateScrollProgress();
}, { passive: true });

// Splash video autoplay
window.addEventListener('load', function() {
    const splashVideo = document.getElementById('splash-video');
    if (splashVideo) {
        splashVideo.play().catch(e => console.log('Video autoplay prevented:', e));
    }
});

// ====================
// Initialize on DOM Ready
// ====================
document.addEventListener('DOMContentLoaded', function() {
    initNavigation();
    initSmoothScroll();
    initButtonRipples();
    initLazyLoading();
});

// ====================
// Performance Monitoring (Optional)
// ====================
if ('PerformanceObserver' in window) {
    const perfObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
            // Log long tasks for debugging
            if (entry.duration > 50) {
                console.warn('Long task detected:', entry.duration + 'ms');
            }
        }
    });
    
    try {
        perfObserver.observe({ entryTypes: ['longtask'] });
    } catch (e) {
        // LongTask API not supported
    }
}