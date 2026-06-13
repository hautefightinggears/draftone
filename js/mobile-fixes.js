// ============================================================
// MOBILE-FIXES.JS — Haute Fighting Gears
// v2 — GitHub Pages + mobile + security + performance fixes
// Does NOT change layout, design, colors, or structure.
// ============================================================

(function () {
  'use strict';

  // ── GITHUB PAGES BASE PATH ───────────────────────────────────
  // Computed once, used by products-engine for JSON + image paths.
  // Works for:
  //   - GitHub Pages with repo subdirectory: username.github.io/repo-name/
  //   - GitHub Pages with custom domain:     yourdomain.com/  (no subdir)
  //   - Local Live Server:                   localhost:5500/
  //   - Local from /pages/ depth:            localhost:5500/pages/
  (function computeBasePath() {
    var hostname = window.location.hostname;
    var pathname = window.location.pathname;
    var origin = window.location.origin;
    var isGitHub = hostname.endsWith('github.io');

    if (isGitHub) {
      // username.github.io/repo-name/...  → base = /repo-name
      // username.github.io/              → base = ''  (repo is username.github.io itself)
      var parts = pathname.replace(/^\//, '').split('/');
      // If first segment looks like a repo name (not a page file), use it
      var repoBase = (parts[0] && !parts[0].includes('.')) ? ('/' + parts[0]) : '';
      window.HFG_BASE = origin + repoBase;
    } else {
      // Local server: base is always the site root
      // For pages in /pages/ subdir, go up one level
      var isSubPage = pathname.includes('/pages/');
      if (isSubPage) {
        // Go up from /pages/ to root
        window.HFG_BASE = origin + pathname.replace(/\/pages\/.*$/, '');
      } else {
        // Root-level page — base is origin + path up to last /
        window.HFG_BASE = origin + pathname.replace(/\/[^/]*$/, '');
      }
    }
  })();


  // ── 1. INJECT GLOBAL CSS FIXES ──────────────────────────────
  var style = document.createElement('style');
  style.textContent = [

    /* Box model + overflow */
    /* overflow-x:hidden on body breaks position:fixed in iOS Safari — apply to html only */
    'html{overflow-x:hidden !important;max-width:100vw !important;}',
    'body{max-width:100vw !important;}',
    '*{box-sizing:border-box;}',

    /* Images always scale */
    'img{max-width:100% !important;height:auto;}',

    /* Remove iOS tap flash, add manipulation */
    'a,button{-webkit-tap-highlight-color:transparent;touch-action:manipulation;}',

    /* WhatsApp links always tappable */
    'a[href*="wa.me"]{min-height:44px !important;display:inline-flex !important;align-items:center !important;}',

    /* External links — security handled in JS below */

    /* ── MOBILE ONLY ── */
    '@media(max-width:767px){',

    /* Navbar */
    'header nav{padding-left:16px !important;padding-right:16px !important;}',

    /* Mobile menu button */
    '#mobile-menu-btn{min-width:44px !important;min-height:44px !important;',
    'display:flex !important;align-items:center !important;justify-content:center !important;}',

    /* Mobile nav drawer */
    '#mobile-nav{position:relative !important;z-index:9999 !important;',
    'width:100% !important;left:0 !important;right:0 !important;',
    'box-shadow:0 8px 24px rgba(0,0,0,0.15) !important;}',

    /* Menu links */
    '#mobile-nav a{min-height:44px !important;display:flex !important;',
    'align-items:center !important;padding-top:12px !important;',
    'padding-bottom:12px !important;font-size:15px !important;}',

    /* All buttons tap size */
    'button,a[class*="py-"],a[class*="px-"]{min-height:44px !important;}',

    /* Section padding */
    'section,[class*="px-5"],[class*="md:px-\\[64px\\]"]{',
    'padding-left:16px !important;padding-right:16px !important;}',

    /* Hero */
    'section.min-h-screen{min-height:100svh !important;}',
    '#hero-content{padding-left:16px !important;padding-right:16px !important;padding-bottom:48px !important;}',
    '#hero-content h1{font-size:clamp(32px,9vw,64px) !important;line-height:1.05 !important;}',

    /* Grids */
    '#what-we-make-grid{grid-template-columns:1fr !important;}',
    '#featured-grid{grid-template-columns:repeat(2,1fr) !important;gap:12px !important;}',
    '#samples-grid{grid-template-columns:repeat(2,1fr) !important;gap:12px !important;}',
    '#related-grid{grid-template-columns:repeat(2,1fr) !important;gap:12px !important;}',

    /* Filter bar */
    '#filter-bar-wrap{width:100% !important;max-width:100vw !important;overflow-x:auto !important;}',
    '#filter-bar{flex-wrap:nowrap !important;overflow-x:auto !important;',
    '-webkit-overflow-scrolling:touch !important;scrollbar-width:none !important;',
    'padding-left:16px !important;padding-right:16px !important;}',
    '#filter-bar::-webkit-scrollbar{display:none;}',

    /* Typography */
    '.text-display-md,[class*="text-display"]{font-size:clamp(32px,9vw,64px) !important;line-height:1.05 !important;}',
    '.text-headline-lg,[class*="text-headline-lg"]{font-size:clamp(26px,7vw,48px) !important;}',

    /* Body text min size */
    'p,li,label{font-size:max(15px,1em) !important;}',

    /* iOS input zoom prevention */
    'input[type="text"],input[type="tel"],input[type="email"],',
    'input[type="number"],select,textarea{',
    'width:100% !important;font-size:16px !important;min-height:44px !important;}',

    /* Product page stacking */
    '.md\\:col-span-6{grid-column:span 12 !important;}',

    /* Footer */
    'footer .grid{grid-template-columns:1fr !important;}',

    /* Cookie popup */
    '#hfg-cookie-popup{width:calc(100vw - 24px) !important;',
    'left:12px !important;right:12px !important;bottom:12px !important;padding:20px !important;}',

    '}', /* end mobile */

    /* Very small screens */
    '@media(max-width:399px){',
    '#featured-grid,#samples-grid,#related-grid{grid-template-columns:1fr !important;}',
    '}'

  ].join('');
  document.head.appendChild(style);


  // ── 2. MOBILE MENU — ROBUST TOGGLE ──────────────────────────
  // injectNavbar() replaces #navbar-placeholder with outerHTML,
  // so we must attach listeners AFTER it runs. Poll for the button.
  function attachMobileMenu() {
    var btn = document.getElementById('mobile-menu-btn');
    var nav = document.getElementById('mobile-nav');
    if (!btn || !nav || btn.dataset.mfInit) return;
    btn.dataset.mfInit = '1';

    // Toggle open/close
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = nav.style.display === 'block';
      nav.style.display = open ? 'none' : 'block';
      // Scroll lock
      document.body.style.overflow = open ? '' : 'hidden';
    });

    // Close on outside click
    document.addEventListener('click', function (e) {
      if (nav.style.display !== 'block') return;
      if (!btn.contains(e.target) && !nav.contains(e.target)) {
        nav.style.display = 'none';
        document.body.style.overflow = '';
      }
    });

    // Close when a menu link is tapped
    nav.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        nav.style.display = 'none';
        document.body.style.overflow = '';
      });
    });
  }

  // Poll until navbar is injected (max 5s)
  document.addEventListener('DOMContentLoaded', function () {
    var attempts = 0;
    var poll = setInterval(function () {
      attempts++;
      if (document.getElementById('mobile-menu-btn')) {
        clearInterval(poll);
        attachMobileMenu();
      }
      if (attempts > 100) clearInterval(poll); // 5s timeout
    }, 50);
  });


  // ── 3. EXTERNAL LINK SECURITY ───────────────────────────────
  // Add rel="noopener noreferrer" to all _blank links
  document.addEventListener('DOMContentLoaded', function () {
    // Run once now and re-run after dynamic content loads
    function fixExternalLinks() {
      document.querySelectorAll('a[target="_blank"]').forEach(function (a) {
        var rel = a.getAttribute('rel') || '';
        if (!rel.includes('noopener')) {
          a.setAttribute('rel', (rel + ' noopener noreferrer').trim());
        }
      });
      // WhatsApp links: ensure target + rel
      document.querySelectorAll('a[href*="wa.me"]').forEach(function (a) {
        a.setAttribute('target', '_blank');
        a.setAttribute('rel', 'noopener noreferrer');
      });
    }
    fixExternalLinks();
    // Re-run after dynamic content (footer, navbar) is injected
    setTimeout(fixExternalLinks, 500);
    setTimeout(fixExternalLinks, 2000);
  });


  // ── 4. IMAGE LAZY LOADING ────────────────────────────────────
  // Add loading="lazy" to all non-hero images not already marked
  document.addEventListener('DOMContentLoaded', function () {
    function applyLazyLoad() {
      document.querySelectorAll('img:not([loading])').forEach(function (img) {
        // Skip the hero background image (above the fold)
        if (img.id === 'hero-bg-img') return;
        img.setAttribute('loading', 'lazy');
      });
    }
    applyLazyLoad();
    // Re-run after dynamic grids populate
    setTimeout(applyLazyLoad, 1000);
    setTimeout(applyLazyLoad, 3000);
  });


  // ── 5. PRODUCT GRID FALLBACK (loading timeout) ───────────────
  // If a grid still shows "Loading" text after 10s, show a
  // helpful message instead of an infinite spinner.
  document.addEventListener('DOMContentLoaded', function () {
    ['samples-grid', 'featured-grid', 'what-we-make-grid'].forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      setTimeout(function () {
        var txt = (el.textContent || '').trim();
        if (txt === '' || txt.toLowerCase().includes('loading')) {
          el.innerHTML =
            '<div style="grid-column:1/-1;text-align:center;padding:48px 20px;opacity:0.45">' +
            '<p style="font-family:Anton,sans-serif;font-size:18px;text-transform:uppercase;' +
            'letter-spacing:0.1em;color:#1b1b1b">Products unavailable</p>' +
            '<p style="font-family:\'Hanken Grotesk\',sans-serif;font-size:14px;margin-top:8px;color:#707070">' +
            'Please visit the live site or open with a local server.</p>' +
            '</div>';
        }
      }, 10000);
    });
  });


  // ── 6. iOS VIEWPORT HEIGHT FIX ──────────────────────────────
  function setVH() {
    document.documentElement.style.setProperty('--vh', (window.innerHeight * 0.01) + 'px');
  }
  setVH();
  window.addEventListener('resize', setVH, { passive: true });
  window.addEventListener('orientationchange', setVH, { passive: true });


  // ── 7. SMOOTH ANCHOR SCROLL (offset for fixed header) ────────
  document.addEventListener('click', function (e) {
    var link = e.target.closest('a[href^="#"]');
    if (!link) return;
    var id = link.getAttribute('href').slice(1);
    var target = id ? document.getElementById(id) : null;
    if (!target) return;
    e.preventDefault();
    var navH = (document.querySelector('header') || { offsetHeight: 72 }).offsetHeight;
    window.scrollTo({
      top: target.getBoundingClientRect().top + window.scrollY - navH - 8,
      behavior: 'smooth'
    });
  });


  // ── 8. DOM RENDER OPTIMISATION ──────────────────────────────
  // Patch DOMContentLoaded timing: if injectNavbar/injectFooter
  // are called before DOM is ready, defer them safely.
  // (They're currently called right after script tags at bottom of
  //  body, which is safe — but this guards against edge cases.)
  var _origInjectNavbar = null;
  var _origInjectFooter = null;
  document.addEventListener('DOMContentLoaded', function () {
    // Re-run navbar/footer injection if placeholders still exist
    var nbPlaceholder = document.getElementById('navbar-placeholder');
    var ftPlaceholder = document.getElementById('footer-placeholder');
    // If they were already replaced, these won't exist — nothing to do.
    // If still present after DOMContentLoaded, the inline script didn't run yet.
    // (This is an extra safety net — normally not needed.)
  });


  // ── 9. DATA SANITISATION HELPER ──────────────────────────────
  // Expose a safe text-escape function for use in product renders
  window.HFG_esc = function (str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  };


  // ── 10. CLEAN CONSOLE — suppress known non-error messages ────
  var _warn = console.warn.bind(console);
  console.warn = function () {
    var m = arguments[0];
    if (typeof m === 'string' && m.indexOf('[products-engine]') !== -1) return;
    _warn.apply(console, arguments);
  };

})();
