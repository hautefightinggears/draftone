// ============================================================
// HOME-ANIMATIONS.JS — Haute Fighting Gears
// Premium motion system for the homepage only
// Inspired by 23.html (About page) scroll style
// Pure CSS + Vanilla JS — zero dependencies
// ============================================================

(function () {
    'use strict';

    // ── 1. INJECT STYLES ───────────────────────────────────────
    const style = document.createElement('style');
    style.textContent = `

    /* ── Hero text fade-in on load ──────────────────────────── */
    #hero-content {
      transition: opacity 0.9s cubic-bezier(0.16, 1, 0.3, 1),
                  transform 0.9s cubic-bezier(0.16, 1, 0.3, 1);
    }
    #hero-content.hp-visible {
      opacity: 1 !important;
      transform: translateY(0) !important;
    }

    /* ── Hero image parallax + slow zoom ────────────────────── */
    #hero-bg-img {
      transition: transform 0.05s linear;
      will-change: transform;
    }

    /* ── Section scroll reveal ──────────────────────────────── */
    .hp-reveal {
      opacity: 0;
      transform: translateY(40px);
      transition: opacity 0.85s cubic-bezier(0.16, 1, 0.3, 1),
                  transform 0.85s cubic-bezier(0.16, 1, 0.3, 1);
      will-change: opacity, transform;
    }
    .hp-reveal.hp-visible {
      opacity: 1;
      transform: translateY(0);
    }

    /* ── Stagger delays for process cards ───────────────────── */
    .hp-stagger-1 { transition-delay: 0ms !important; }
    .hp-stagger-2 { transition-delay: 80ms !important; }
    .hp-stagger-3 { transition-delay: 160ms !important; }
    .hp-stagger-4 { transition-delay: 240ms !important; }

    /* ── What We Make image hover ───────────────────────────── */
    .hp-img-hover {
      overflow: hidden;
    }
    .hp-img-hover img {
      transition: transform 0.55s cubic-bezier(0.22, 1, 0.36, 1) !important;
    }
    .hp-img-hover:hover img {
      transform: scale(1.07) !important;
    }

    /* ── Marquee animation ──────────────────────────────────── */
    @keyframes hfg-marquee {
      from { transform: translateX(0); }
      to   { transform: translateX(-50%); }
    }
    .hfg-marquee-track {
      animation: hfg-marquee 28s linear infinite;
    }
    .hfg-marquee-wrap:hover .hfg-marquee-track {
      animation-play-state: paused;
    }

    /* ── Button scale on hover (homepage specific) ──────────── */
    .hp-btn {
      transition: transform 0.18s cubic-bezier(0.22, 1, 0.36, 1),
                  background-color 0.2s ease,
                  color 0.2s ease,
                  border-color 0.2s ease !important;
    }
    .hp-btn:hover  { transform: scale(1.04) !important; }
    .hp-btn:active { transform: scale(0.97) !important; }

    /* ── Trust card hover lift ──────────────────────────────── */
    .hp-trust-card {
      transition: transform 0.28s cubic-bezier(0.22, 1, 0.36, 1),
                  box-shadow 0.28s ease,
                  border-color 0.2s ease !important;
    }
    .hp-trust-card:hover {
      transform: translateY(-6px) !important;
      box-shadow: 0 12px 32px rgba(0,0,0,0.10) !important;
      border-color: #1b1b1b !important;
    }

  `;
    document.head.appendChild(style);


    // ── 2. HERO TEXT FADE-IN ON LOAD ───────────────────────────
    function initHeroEntrance() {
        const content = document.getElementById('hero-content');
        if (!content) return;
        // Small delay so the page paint completes first
        setTimeout(() => content.classList.add('hp-visible'), 120);
    }


    // ── 3. HERO PARALLAX + SLOW ZOOM ───────────────────────────
    function initHeroParallax() {
        const img = document.getElementById('hero-bg-img');
        if (!img) return;

        // Disable on mobile for performance
        const isMobile = () => window.innerWidth < 768;

        let ticking = false;
        window.addEventListener('scroll', () => {
            if (isMobile() || ticking) return;
            ticking = true;
            requestAnimationFrame(() => {
                const y = window.scrollY;
                if (y < window.innerHeight * 1.5) {
                    // Parallax: image moves at 25% of scroll speed
                    // Zoom: scale grows slightly as user scrolls in
                    const scale = 1 + Math.min(y / window.innerHeight * 0.08, 0.08);
                    img.style.transform = `translateY(${y * 0.25}px) scale(${scale})`;
                }
                ticking = false;
            });
        }, { passive: true });
    }


    // ── 4. SCROLL REVEAL WITH STAGGER ──────────────────────────
    function initScrollReveal() {
        const obs = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('hp-visible');
                obs.unobserve(entry.target);
            });
        }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

        // Mark all sections and their children for reveal
        // Process cards get stagger delays
        const processCards = document.querySelectorAll(
            '.bg-surface-container .grid > div[data-reveal], ' +
            '.bg-surface-container .grid > div.bg-surface-container-lowest'
        );
        processCards.forEach((card, i) => {
            card.classList.add('hp-reveal', `hp-stagger-${Math.min(i + 1, 4)}`);
            obs.observe(card);
        });

        // All other [data-reveal] elements
        document.querySelectorAll('[data-reveal]').forEach(el => {
            if (!el.classList.contains('hp-reveal')) {
                el.classList.add('hp-reveal');
                obs.observe(el);
            }
        });

        // Trust cards
        document.querySelectorAll('.hp-trust-card').forEach(el => {
            if (!el.classList.contains('hp-reveal')) {
                el.classList.add('hp-reveal');
                obs.observe(el);
            }
        });
    }


    // ── 5. WHAT WE MAKE — image hover enhancement ──────────────
    function initProductImageHover() {
        // The 3 category tiles in "What We Make"
        document.querySelectorAll('section a.group.relative.aspect-\\[3\\/4\\]').forEach(el => {
            el.classList.add('hp-img-hover');
        });
    }


    // ── 6. TRUST CARDS ─────────────────────────────────────────
    function initTrustCards() {
        document.querySelectorAll('.flex.items-start.gap-5.p-6.border').forEach(card => {
            card.classList.add('hp-trust-card');
        });
    }


    // ── 7. BUTTON ENHANCEMENTS ─────────────────────────────────
    function initButtons() {
        // Homepage hero buttons + CTA section buttons
        document.querySelectorAll(
            '#hero-content a, ' +
            '.bg-primary.border-y-4 a'
        ).forEach(btn => {
            if (!btn.dataset.hpBtn) {
                btn.dataset.hpBtn = '1';
                btn.classList.add('hp-btn');
            }
        });
    }


    // ── 8. FEATURED GRID — stagger on load ─────────────────────
    function initFeaturedGrid() {
        const grid = document.getElementById('featured-grid');
        if (!grid) return;

        const gridObs = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                // Stagger each card
                const cards = entry.target.querySelectorAll(':scope > div');
                cards.forEach((card, i) => {
                    card.style.opacity = '0';
                    card.style.transform = 'translateY(28px)';
                    card.style.transition = `opacity 0.55s cubic-bezier(0.16,1,0.3,1) ${i * 70}ms, transform 0.55s cubic-bezier(0.16,1,0.3,1) ${i * 70}ms`;
                    setTimeout(() => {
                        card.style.opacity = '1';
                        card.style.transform = 'translateY(0)';
                    }, 60 + i * 70);
                });
                gridObs.unobserve(entry.target);
            });
        }, { threshold: 0.05 });

        // Watch for when grid gets populated
        const mutObs = new MutationObserver(() => {
            if (grid.children.length > 0 && !grid.dataset.hpGridObs) {
                grid.dataset.hpGridObs = '1';
                gridObs.observe(grid);
            }
        });
        mutObs.observe(grid, { childList: true });

        // Also observe immediately if already populated
        if (grid.children.length > 0) {
            grid.dataset.hpGridObs = '1';
            gridObs.observe(grid);
        }
    }


    // ── BOOT ───────────────────────────────────────────────────
    function boot() {
        initHeroEntrance();
        initHeroParallax();
        initScrollReveal();
        initProductImageHover();
        initTrustCards();
        initButtons();
        initFeaturedGrid();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }

})();
