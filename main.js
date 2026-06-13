/**
 * OmniSky — main.js (Light Mode Edition)
 * ─────────────────────────────────────────────────────────
 * 1.  Lenis Smooth Scroll
 * 2.  Light-mode Canvas: pulsing lavender dots + slow geometric outlines
 * 3.  GSAP ScrollTrigger: staggered fade-in for all .reveal-fade elements
 * 4.  GSAP ScrollTrigger: service cards enter with scale(0.8) + rotateZ(5deg) → 1/0
 * 5.  3D Tilt (mouseenter/move/leave) with card-spotlight tracking
 * 6.  Magnetic buttons (cursor attraction + elastic return)
 * 7.  Button click ripple + pulse glow animation
 * 8.  Nav: scrolled class, active link highlight, mobile drawer toggle
 * 9.  Nav link magnetic micro-pull (subtle cursor follow on each link)
 * 10. Process timeline progress via ScrollTrigger scrub
 * 11. Contact form success overlay
 */

document.addEventListener('DOMContentLoaded', () => {
    gsap.registerPlugin(ScrollTrigger);

    initSmoothScroll();
    initCanvasBackground();
    initNavigation();
    initGsapReveal();
    initCardScrollEntry();
    init3DTiltCards();
    initMagneticButtons();
    initProcessTimeline();
    initContactForm();
});

/* ══════════════════════════════════════════════════════════
   1. LENIS SMOOTH SCROLL
   ══════════════════════════════════════════════════════════ */
function initSmoothScroll() {
    const lenis = new Lenis({
        duration: 1.3,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: 'vertical',
        smoothWheel: true,
        wheelMultiplier: 0.9,
        touchMultiplier: 1.6,
    });

    // RAF loop
    function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);

    // Keep GSAP ScrollTrigger in sync
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);

    // Smooth anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', e => {
            e.preventDefault();
            const id = anchor.getAttribute('href');
            if (id === '#') return;
            const target = document.querySelector(id);
            if (!target) return;

            // Close mobile drawer if open
            closeMobileDrawer();

            lenis.scrollTo(target, { offset: -90, duration: 1.4 });
        });
    });
}

/* ══════════════════════════════════════════════════════════
   2. CANVAS — LIGHT-MODE LAVENDER PARTICLES
   ══════════════════════════════════════════════════════════ */
function initCanvasBackground() {
    const canvas = document.getElementById('ambient-particles');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let W = canvas.width  = window.innerWidth;
    let H = canvas.height = window.innerHeight;

    window.addEventListener('resize', () => {
        W = canvas.width  = window.innerWidth;
        H = canvas.height = window.innerHeight;
        initDots();
        initRings();
    });

    /* ── Pulsing dots ────────────────────────────────────── */
    const DOT_COLOR = 'rgba(184, 190, 255, '; // #B8BEFF base
    let dots = [];

    function initDots() {
        dots = [];
        const count = Math.min(55, Math.floor((W * H) / 18000));
        for (let i = 0; i < count; i++) dots.push(createDot());
    }

    function createDot() {
        return {
            x: Math.random() * W,
            y: Math.random() * H,
            r: Math.random() * 2.5 + 0.8,
            alpha: Math.random() * 0.5 + 0.1,
            alphaDir: Math.random() < 0.5 ? 1 : -1,
            alphaSpeed: Math.random() * 0.006 + 0.002,
            vx: (Math.random() - 0.5) * 0.18,
            vy: (Math.random() - 0.5) * 0.18,
        };
    }

    function updateDot(d) {
        d.x += d.vx;
        d.y += d.vy;
        d.alpha += d.alphaSpeed * d.alphaDir;
        if (d.alpha > 0.65 || d.alpha < 0.05) d.alphaDir *= -1;
        if (d.x < 0) d.x = W;
        if (d.x > W) d.x = 0;
        if (d.y < 0) d.y = H;
        if (d.y > H) d.y = 0;
    }

    /* ── Slowly rotating geometric ring outlines ─────────── */
    let rings = [];

    function initRings() {
        rings = [];
        const rCount = 4;
        for (let i = 0; i < rCount; i++) {
            rings.push({
                x:     Math.random() * W,
                y:     Math.random() * H,
                r:     Math.random() * 120 + 60,
                angle: Math.random() * Math.PI * 2,
                speed: (Math.random() - 0.5) * 0.003,
                sides: Math.floor(Math.random() * 3) + 3, // triangle, square, pentagon
                alpha: Math.random() * 0.09 + 0.03,
            });
        }
    }

    function drawPolygon(x, y, r, sides, angle) {
        ctx.beginPath();
        for (let i = 0; i < sides; i++) {
            const a = angle + (i * Math.PI * 2) / sides;
            if (i === 0) ctx.moveTo(x + r * Math.cos(a), y + r * Math.sin(a));
            else         ctx.lineTo(x + r * Math.cos(a), y + r * Math.sin(a));
        }
        ctx.closePath();
    }

    initDots();
    initRings();

    function render() {
        /* Clear with white, fully opaque → clean light mode */
        ctx.fillStyle = 'rgba(255,255,255,1)';
        ctx.fillRect(0, 0, W, H);

        /* Draw rings */
        rings.forEach(ring => {
            ring.angle += ring.speed;
            ctx.strokeStyle = `rgba(184, 190, 255, ${ring.alpha})`;
            ctx.lineWidth = 1.5;
            drawPolygon(ring.x, ring.y, ring.r, ring.sides, ring.angle);
            ctx.stroke();
        });

        /* Draw dots */
        dots.forEach(d => {
            updateDot(d);
            ctx.beginPath();
            ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
            ctx.fillStyle = DOT_COLOR + d.alpha + ')';
            ctx.fill();
        });

        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);
}

/* ══════════════════════════════════════════════════════════
   3. GSAP STAGGERED FADE-IN (ALL .reveal-fade)
   ══════════════════════════════════════════════════════════ */
function initGsapReveal() {
    /* Hero elements fire immediately on load */
    const heroEls = document.querySelectorAll('.hero-glass-card .reveal-fade');
    gsap.from(heroEls, {
        opacity: 0,
        y: 35,
        duration: 1,
        stagger: 0.18,
        ease: 'power3.out',
        delay: 0.25,
    });

    /* Other sections fire on scroll */
    const scrollEls = document.querySelectorAll('.section-wrapper .reveal-fade');
    scrollEls.forEach(el => {
        gsap.fromTo(el,
            { opacity: 0, y: 32 },
            {
                opacity: 1,
                y: 0,
                duration: 0.8,
                ease: 'power3.out',
                scrollTrigger: {
                    trigger: el,
                    start: 'top 88%',
                    toggleActions: 'play none none none',
                },
            }
        );
    });

    /* Hero card badge & scroll indicator */
    gsap.from('.card-badge', { opacity: 0, y: -14, duration: 0.7, delay: 0.1, ease: 'power3.out' });
    gsap.from('.hero-actions', { opacity: 0, y: 24, duration: 1, delay: 0.75, ease: 'power3.out' });
    gsap.from('.scroll-indicator', { opacity: 0, duration: 1, delay: 1.5 });
}

/* ══════════════════════════════════════════════════════════
   4. CARD SCROLL ENTRY: scale(0.8) + rotateZ(5deg) → 1 / 0
   ══════════════════════════════════════════════════════════ */
function initCardScrollEntry() {
    const cards = document.querySelectorAll('.service-card.gsap-init');

    cards.forEach((card, i) => {
        gsap.fromTo(card,
            { opacity: 0, scale: 0.8, rotateZ: 5 },
            {
                opacity: 1,
                scale: 1,
                rotateZ: 0,
                duration: 0.75,
                ease: 'back.out(1.4)',
                delay: i * 0.12,
                scrollTrigger: {
                    trigger: card,
                    start: 'top 85%',
                    toggleActions: 'play none none none',
                },
            }
        );
    });

    /* Industry cards cascade in */
    const indCards = document.querySelectorAll('.industry-card');
    gsap.from(indCards, {
        opacity: 0,
        y: 40,
        scale: 0.88,
        duration: 0.6,
        stagger: 0.08,
        ease: 'back.out(1.2)',
        scrollTrigger: {
            trigger: '.industries-grid',
            start: 'top 82%',
            toggleActions: 'play none none none',
        },
    });
}

/* ══════════════════════════════════════════════════════════
   5. 3D TILT CARDS (mouseenter / mousemove / mouseleave)
   ══════════════════════════════════════════════════════════ */
function init3DTiltCards() {
    document.querySelectorAll('.tilt-card').forEach(card => {
        const spotlight = card.querySelector('.card-spotlight');

        card.addEventListener('mousemove', e => {
            const rect     = card.getBoundingClientRect();
            const x        = e.clientX - rect.left;
            const y        = e.clientY - rect.top;
            const cx       = rect.width  / 2;
            const cy       = rect.height / 2;
            const rotateX  = ((y - cy) / cy) * -9;
            const rotateY  = ((x - cx) / cx) * 9;

            if (spotlight) {
                card.style.setProperty('--x', `${x}px`);
                card.style.setProperty('--y', `${y}px`);
            }

            gsap.to(card, {
                rotateX,
                rotateY,
                duration: 0.3,
                ease: 'power2.out',
                overwrite: 'auto',
            });
        });

        card.addEventListener('mouseleave', () => {
            gsap.to(card, {
                rotateX: 0,
                rotateY: 0,
                duration: 0.6,
                ease: 'power2.out',
                overwrite: 'auto',
            });
        });

        /* Accessibility */
        card.addEventListener('focus', () => gsap.to(card, { scale: 1.02, duration: 0.3 }));
        card.addEventListener('blur',  () => gsap.to(card, { scale: 1,    duration: 0.4 }));
    });
}

/* ══════════════════════════════════════════════════════════
   6. MAGNETIC BUTTONS (GSAP lerp attraction)
   ══════════════════════════════════════════════════════════ */
function initMagneticButtons() {
    document.querySelectorAll('.magnet-btn, .magnet-btn-large').forEach(btn => {
        const wrap      = btn.closest('.magnetic-wrap') || btn;
        const isLarge   = btn.classList.contains('magnet-btn-large');
        const intensity = isLarge ? 0.38 : 0.22;

        wrap.addEventListener('mousemove', e => {
            const rect = wrap.getBoundingClientRect();
            const x    = e.clientX - rect.left - rect.width  / 2;
            const y    = e.clientY - rect.top  - rect.height / 2;

            gsap.to(btn, {
                x: x * intensity,
                y: y * intensity,
                duration: 0.3,
                ease: 'power2.out',
                overwrite: 'auto',
            });

            if (isLarge) {
                gsap.to(btn, {
                    boxShadow: `0 0 0 10px rgba(0,21,255,0.15)`,
                    duration: 0.25,
                    overwrite: 'auto',
                });
            }
        });

        wrap.addEventListener('mouseleave', () => {
            gsap.to(btn, {
                x: 0,
                y: 0,
                boxShadow: isLarge ? '0 4px 18px rgba(0,21,255,0.28)' : 'none',
                duration: 0.7,
                ease: 'elastic.out(1, 0.35)',
                overwrite: 'auto',
            });
        });

        /* Click ripple + pulse */
        btn.addEventListener('mousedown', function (e) {
            gsap.to(btn, { scale: 0.95, duration: 0.1, ease: 'power2.out' });
            addRipple(this, e);
        });

        btn.addEventListener('mouseup', function () {
            gsap.to(btn, { scale: 1, duration: 0.35, ease: 'power2.out' });
            this.classList.remove('btn-pulse');
            void this.offsetWidth; // reflow
            this.classList.add('btn-pulse');
        });
    });
}

function addRipple(el, e) {
    const old = el.querySelector('.ripple');
    if (old) old.remove();
    const ripple = document.createElement('span');
    const d = Math.max(el.clientWidth, el.clientHeight);
    const rect = el.getBoundingClientRect();
    ripple.style.width = ripple.style.height = `${d}px`;
    ripple.style.left  = `${e.clientX - rect.left  - d / 2}px`;
    ripple.style.top   = `${e.clientY - rect.top   - d / 2}px`;
    ripple.classList.add('ripple');
    el.appendChild(ripple);
}

/* ══════════════════════════════════════════════════════════
   7. NAV: scrolled class, active link pill, mobile drawer,
          + subtle link magnetic micro-pull
   ══════════════════════════════════════════════════════════ */
function initNavigation() {
    const navbar = document.getElementById('navbar');

    /* Scrolled state */
    window.addEventListener('scroll', () => {
        navbar.classList.toggle('scrolled', window.scrollY > 40);
    });

    /* Mobile drawer */
    const toggle = document.querySelector('.mobile-toggle');
    const drawer = document.getElementById('mobile-drawer');
    if (toggle && drawer) {
        toggle.addEventListener('click', () => {
            const open = drawer.classList.contains('active');
            open ? closeMobileDrawer() : openMobileDrawer();
        });
    }

    /* Nav link micro-magnetic pull (subtle, CSS-only via JS) */
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('mousemove', e => {
            const rect = link.getBoundingClientRect();
            const x = (e.clientX - rect.left - rect.width  / 2) * 0.25;
            const y = (e.clientY - rect.top  - rect.height / 2) * 0.25;
            gsap.to(link, { x, y, duration: 0.2, ease: 'power2.out', overwrite: 'auto' });
        });
        link.addEventListener('mouseleave', () => {
            gsap.to(link, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1,0.4)', overwrite: 'auto' });
        });
    });

    /* Highlight active section in nav */
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');

    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                navLinks.forEach(l => {
                    l.classList.toggle('active', l.getAttribute('href') === '#' + entry.target.id);
                });
            }
        });
    }, { threshold: 0.45 });

    sections.forEach(s => observer.observe(s));
}

function openMobileDrawer() {
    const toggle = document.querySelector('.mobile-toggle');
    const drawer = document.getElementById('mobile-drawer');
    if (!drawer || !toggle) return;
    drawer.classList.add('active');
    toggle.classList.add('active');
    toggle.setAttribute('aria-expanded', 'true');
}

function closeMobileDrawer() {
    const toggle = document.querySelector('.mobile-toggle');
    const drawer = document.getElementById('mobile-drawer');
    if (!drawer || !toggle) return;
    drawer.classList.remove('active');
    toggle.classList.remove('active');
    toggle.setAttribute('aria-expanded', 'false');
}

/* ══════════════════════════════════════════════════════════
   8. PROCESS TIMELINE SCRUB
   ══════════════════════════════════════════════════════════ */
function initProcessTimeline() {
    const container = document.querySelector('.process-scroll-container');
    if (!container) return;

    gsap.to('.process-timeline-progress', {
        height: '100%',
        ease: 'none',
        scrollTrigger: {
            trigger: container,
            start: 'top center',
            end: 'bottom center',
            scrub: 0.6,
        },
    });

    document.querySelectorAll('.process-step-card').forEach(card => {
        ScrollTrigger.create({
            trigger: card,
            start: 'top 75%',
            end: 'bottom 25%',
            onEnter:      () => card.classList.add('active'),
            onEnterBack:  () => card.classList.add('active'),
            onLeave:      () => card.classList.remove('active'),
            onLeaveBack:  () => card.classList.remove('active'),
        });
    });
}

/* ══════════════════════════════════════════════════════════
   9. CONTACT FORM
   ══════════════════════════════════════════════════════════ */
function initContactForm() {
    const form     = document.getElementById('project-form');
    const overlay  = document.getElementById('form-success');
    const resetBtn = document.getElementById('reset-form-btn');

    if (form && overlay) {
        form.addEventListener('submit', e => {
            e.preventDefault();
            if (!form.checkValidity()) return;

            const submitBtn = form.querySelector('.submit-btn');
            gsap.to(submitBtn, {
                scale: 0.9,
                duration: 0.1,
                yoyo: true,
                repeat: 1,
                onComplete: () => overlay.classList.add('show'),
            });
        });
    }

    if (resetBtn && form && overlay) {
        resetBtn.addEventListener('click', () => {
            form.reset();
            overlay.classList.remove('show');
        });
    }
}
