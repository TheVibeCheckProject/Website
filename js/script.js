/**
 * The Vibe Check Project - Main JavaScript
 * Spreading good vibes, one message at a time
 */

// State management
let splashCompleted = false;

// Daily affirmations database
const affirmations = [
    { text: "You're trying, and that's what counts.", category: "Motivation" },
    { text: "Your feelings are valid, and you deserve to be heard.", category: "Self-Compassion" },
    { text: "Every new day is a fresh chance to try again.", category: "Hope" },
    { text: "You're doing better than you think you are.", category: "Encouragement" },
    { text: "Your presence makes a difference, even when you don't see it.", category: "Worth" },
    { text: "Rest is not weakness. It's essential.", category: "Self-Care" },
    { text: "It's okay to not be okay right now.", category: "Acceptance" },
    { text: "You don't have to be perfect to be worthy of love.", category: "Self-Love" },
    { text: "Small steps are still progress.", category: "Growth" },
    { text: "You're allowed to take up space.", category: "Worth" },
    { text: "Your story isn't over yet.", category: "Hope" },
    { text: "You're stronger than you know.", category: "Strength" },
    { text: "It's okay to ask for help.", category: "Connection" },
    { text: "You deserve kindness, especially from yourself.", category: "Self-Compassion" },
    { text: "Your pace is perfect for you.", category: "Acceptance" }
];

// ====================
// Daily Affirmation System
// ====================
function getTodaysAffirmation() {
    // Use date as seed for consistent daily affirmation
    const today = new Date();
    const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
    const index = dayOfYear % affirmations.length;
    return affirmations[index];
}

function displayTodaysAffirmation() {
    const affirmation = getTodaysAffirmation();
    const affirmationText = document.querySelector('.hero-affirmation .affirmation-text');
    if (affirmationText) {
        affirmationText.textContent = `"${affirmation.text}"`;
    }
}

// ====================
// Email Signup Modal
// ====================
function createEmailModal() {
    const modalHTML = `
        <div id="email-modal" class="modal-overlay" style="display: none;">
            <div class="modal-content">
                <button class="modal-close" onclick="closeEmailModal()">&times;</button>
                <div class="modal-header">
                    <h2>✨ Get Your Daily Vibe Check</h2>
                    <p>Join thousands receiving daily affirmations. Free, always.</p>
                </div>
                <form id="email-signup-form" class="modal-form">
                    <div class="form-group">
                        <input 
                            type="email" 
                            id="signup-email" 
                            class="form-input" 
                            placeholder="your.email@example.com" 
                            required
                        />
                    </div>
                    <div class="form-group">
                        <input 
                            type="text" 
                            id="signup-name" 
                            class="form-input" 
                            placeholder="Your first name (optional)" 
                        />
                    </div>
                    <button type="submit" class="btn btn-primary btn-large btn-block">
                        Start Getting Good Vibes
                    </button>
                    <p class="form-note">No spam, ever. Unsubscribe anytime.</p>
                </form>
                <div id="signup-success" style="display: none;" class="success-message">
                    <div class="success-icon">✨</div>
                    <h3>Welcome to the community!</h3>
                    <p>Check your email for a confirmation link. Your first daily vibe check arrives tomorrow morning.</p>
                    <button class="btn btn-secondary" onclick="closeEmailModal()">Close</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Handle form submission
    const form = document.getElementById('email-signup-form');
    form.addEventListener('submit', handleEmailSignup);
}

function showEmailModal() {
    const modal = document.getElementById('email-modal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        // Focus on email input
        setTimeout(() => {
            document.getElementById('signup-email').focus();
        }, 100);
    }
}

function closeEmailModal() {
    const modal = document.getElementById('email-modal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        
        // Reset form
        const form = document.getElementById('email-signup-form');
        const success = document.getElementById('signup-success');
        if (form) form.style.display = 'block';
        if (success) success.style.display = 'none';
        if (form) form.reset();
    }
}

// Close modal when clicking outside
document.addEventListener('click', function(e) {
    const modal = document.getElementById('email-modal');
    if (e.target === modal) {
        closeEmailModal();
    }
});

async function handleEmailSignup(e) {
    e.preventDefault();
    
    const email = document.getElementById('signup-email').value;
    const name = document.getElementById('signup-name').value || 'Friend';
    
    // Show loading state
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Subscribing...';
    submitBtn.disabled = true;
    
    // Create form data for Buttondown's email-only endpoint
    const formData = new FormData();
    formData.append('email', email);
    formData.append('metadata', JSON.stringify({
        name: name,
        signup_date: new Date().toISOString(),
        source: 'website'
    }));
    
    try {
        // Use Buttondown's email-only endpoint (no API key needed!)
        const response = await fetch('https://buttondown.com/api/emails/embed-subscribe/griffin', {
            method: 'POST',
            body: formData
        });
        
        // Buttondown returns 200 for success
        if (response.ok || response.status === 200) {
            // Success! Show success message
            document.getElementById('email-signup-form').style.display = 'none';
            document.getElementById('signup-success').style.display = 'block';
            
            // Also save to localStorage as backup
            const subscriber = { email, name, signupDate: new Date().toISOString() };
            let subscribers = JSON.parse(localStorage.getItem('vibeCheckSubscribers') || '[]');
            subscribers.push(subscriber);
            localStorage.setItem('vibeCheckSubscribers', JSON.stringify(subscribers));
            
            console.log('✅ Subscriber added to Buttondown:', email);
        } else {
            // Try to get error message
            let errorMessage = 'Something went wrong. Please try again!';
            try {
                const errorData = await response.json();
                if (errorData.email) {
                    errorMessage = 'You\'re already subscribed! Check your email for daily vibes. ✨';
                }
            } catch (e) {
                // Couldn't parse error
            }
            
            alert(errorMessage);
            
            // Reset button
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    } catch (error) {
        console.error('Signup error:', error);
        alert('Connection error. Please check your internet and try again!');
        
        // Reset button
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

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
        displayTodaysAffirmation();
        createEmailModal();
    }, 600);
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
    const duration = 1500;
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
    
    window.addEventListener('scroll', function() {
        const currentScroll = window.pageYOffset;
        
        if (currentScroll > 50) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }
    }, { passive: true });
}

// ====================
// Lucide Icons
// ====================
function initLucideIcons() {
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    } else {
        setTimeout(initLucideIcons, 100);
    }
}

// ====================
// Smooth Scroll
// ====================
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href === '#') return;
            
            e.preventDefault();
            const target = document.querySelector(href);
            
            if (target) {
                const offsetTop = target.offsetTop - 80;
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
            ripple.style.cssText = `
                position: absolute;
                left: ${x}px;
                top: ${y}px;
                width: 0;
                height: 0;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.5);
                transform: translate(-50%, -50%);
                animation: ripple-animation 0.6s ease-out;
                pointer-events: none;
            `;
            
            this.appendChild(ripple);
            setTimeout(() => ripple.remove(), 600);
        });
    });
}

// ====================
// Event Listeners
// ====================

// Splash screen
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

// CTA buttons - Show email modal
document.getElementById('hero-cta')?.addEventListener('click', function(e) {
    e.preventDefault();
    showEmailModal();
});

document.getElementById('cta-button')?.addEventListener('click', function(e) {
    e.preventDefault();
    showEmailModal();
});

// Scroll progress
window.addEventListener('scroll', function() {
    updateScrollProgress();
}, { passive: true });

// ====================
// Initialize
// ====================
document.addEventListener('DOMContentLoaded', function() {
    initNavigation();
    initSmoothScroll();
    initButtonRipples();
});

// Add ripple animation to CSS dynamically
const style = document.createElement('style');
style.textContent = `
    @keyframes ripple-animation {
        to {
            width: 500px;
            height: 500px;
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
