// ============================================================
// PERSONALIZATION.JS — Haute Fighting Gears
// Silent localStorage-based personalization system.
// No tracking messages. No invasive UI. Just smarter UX.
// ============================================================

const HFG_P = (function () {
  'use strict';

  const KEY = 'userData';
  const MAX = 8; // max items per list

  // ── Read / Write ──────────────────────────────────────────
  function _read() {
    try {
      return JSON.parse(localStorage.getItem(KEY)) || {
        location: {},
        activity: { viewed: [], clicked: [], cart: [] }
      };
    } catch { return { location: {}, activity: { viewed: [], clicked: [], cart: [] } }; }
  }

  function _write(data) {
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch { /* silent */ }
  }

  // ── Dedupe + limit helper ─────────────────────────────────
  function _push(arr, item, max) {
    const deduped = [item, ...arr.filter(i => i !== item)];
    return deduped.slice(0, max);
  }

  // ── 1. LOCATION ───────────────────────────────────────────
  // Call when user fills checkout. Stores silently.
  function saveLocation(country, city, postalCode) {
    if (!country) return;
    const d = _read();
    d.location = {
      country:    country    || d.location.country    || '',
      city:       city       || d.location.city       || '',
      postalCode: postalCode || d.location.postalCode || ''
    };
    _write(d);
  }

  // Auto-fill any location fields present on current page
  function fillLocation() {
    const loc = _read().location;
    if (!loc.country) return;
    const map = {
      'checkout-country': loc.country,
      'checkout-city':    loc.city,
      'checkout-postal':  loc.postalCode,
      'b-country':        loc.country,
      'cs-country':       loc.country
    };
    Object.entries(map).forEach(([id, val]) => {
      const el = document.getElementById(id);
      if (el && !el.value && val) el.value = val;
    });
  }

  // ── 2. PRODUCT TRACKING ───────────────────────────────────
  // action: 'viewed' | 'clicked' | 'cart'
  function trackProduct(action, productName, categoryId) {
    if (!productName) return;
    const d = _read();
    if (!d.activity[action]) d.activity[action] = [];
    d.activity[action] = _push(d.activity[action], productName, MAX);

    // Track category frequency silently
    if (categoryId) {
      if (!d.categoryFreq) d.categoryFreq = {};
      d.categoryFreq[categoryId] = (d.categoryFreq[categoryId] || 0) + 1;
    }
    _write(d);
  }

  // ── 3. RECENTLY VIEWED ────────────────────────────────────
  // Returns array of product names viewed (most recent first)
  function getRecentlyViewed() {
    return _read().activity.viewed || [];
  }

  // ── 4. SMART RECOMMENDATIONS ─────────────────────────────
  // Returns up to `limit` products scored by user history.
  // Weights: cart > clicked > viewed. Silent, no labels needed.
  function getRecommendations(allProducts, limit) {
    limit = limit || 4;
    if (!allProducts || !allProducts.length) return null;
    const d      = _read();
    const viewed = d.activity.viewed  || [];
    const clicked= d.activity.clicked || [];
    const carted = d.activity.cart    || [];

    if (!viewed.length && !clicked.length && !carted.length) return null;

    const scored = allProducts.map(p => {
      const name = (p.name || '').toLowerCase();
      let score  = 0;
      carted .forEach(h => { if (_tokenMatch(name, h)) score += 3; });
      clicked.forEach(h => { if (_tokenMatch(name, h)) score += 2; });
      viewed .forEach(h => { if (_tokenMatch(name, h)) score += 1; });
      return { product: p, score };
    });

    const recs = scored
      .filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(x => x.product);

    return recs.length >= 2 ? recs : null;
  }

  function _tokenMatch(name, history) {
    const tokens = history.toLowerCase().split(/\s+/);
    return tokens.some(t => t.length > 2 && name.includes(t));
  }

  // ── 5. UPSELL SUGGESTIONS ────────────────────────────────
  // Returns related product ids based on what's in cart.
  // Used to show "Complete your setup" section.
  const _upsellMap = {
    'boxing':     ['inner-gloves', 'boxing-head-guard'],
    'mma':        ['inner-gloves', 'mma-grappling-gloves'],
    'gym-fitness':['boxing-gloves', 'boxing-head-guard'],
    'boxing-gloves':     ['inner-gloves', 'boxing-head-guard'],
    'boxing-head-guard': ['boxing-gloves', 'inner-gloves'],
    'mma-grappling-gloves': ['inner-gloves', 'boxing-gloves'],
    'inner-gloves':      ['boxing-gloves', 'mma-grappling-gloves']
  };

  function getUpsells(cartProductIds, allProducts) {
    if (!cartProductIds || !cartProductIds.length) return null;
    const suggestions = new Set();
    cartProductIds.forEach(id => {
      const related = _upsellMap[id] || [];
      related.forEach(r => { if (!cartProductIds.includes(r)) suggestions.add(r); });
    });
    if (!suggestions.size) return null;
    const result = [...suggestions]
      .map(id => allProducts.find(p => p.id === id))
      .filter(Boolean)
      .slice(0, 3);
    return result.length ? result : null;
  }

  // ── 6. TOP CATEGORY ──────────────────────────────────────
  // Returns the category the user has viewed most
  function getTopCategory() {
    const freq = _read().categoryFreq || {};
    const cats = Object.entries(freq);
    if (!cats.length) return null;
    return cats.sort((a, b) => b[1] - a[1])[0][0];
  }

  // ── 7. CART PERSISTENCE ───────────────────────────────────
  // Cart is already persisted via Cart module in cart.js.
  // This just exposes a check for UI use.
  function hasCartItems() {
    try {
      const cart = JSON.parse(localStorage.getItem('hfg_cart_v3') || '[]');
      return cart.reduce((sum, i) => sum + (i.qty || 0), 0) > 0;
    } catch { return false; }
  }

  // ── 8. RENDER RECENTLY VIEWED ─────────────────────────────
  // Injects a "Recently Viewed" section into a container element.
  // Soft label — no tracking message.
  function renderRecentlyViewed(containerEl, allProducts, pagePrefix) {
    const viewed = getRecentlyViewed();
    if (!viewed.length) return;
    pagePrefix = pagePrefix || (window.location.pathname.includes('/product/') ? './' : './product/');

    const products = viewed
      .map(name => allProducts.find(p => p.name === name))
      .filter(Boolean)
      .slice(0, 4);

    if (!products.length) return;

    const html = `
      <section style="padding:48px 0 0">
        <p style="font-family:Anton,sans-serif;font-size:12px;text-transform:uppercase;letter-spacing:0.14em;color:#707070;margin-bottom:16px">Recently Viewed</p>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:16px">
          ${products.map(p => {
            const img = (typeof _resolveImage === 'function') ? _resolveImage(p, 0) : (p.image || '');
            return `<a href="${pagePrefix}product.html?id=${encodeURIComponent(p.id)}"
              style="display:block;border:1px solid #e5e5e5;overflow:hidden;text-decoration:none;color:inherit">
              <div style="aspect-ratio:1/1;background:#f4f4f4;overflow:hidden">
                <img src="${img}" alt="${p.name}"
                  style="width:100%;height:100%;object-fit:contain;padding:8px"
                  onerror="this.style.display='none'"/>
              </div>
              <div style="padding:10px 12px">
                <p style="font-family:Anton,sans-serif;font-size:13px;text-transform:uppercase;margin:0 0 2px;letter-spacing:0.04em">${p.name}</p>
                <p style="font-family:'Hanken Grotesk',sans-serif;font-size:11px;color:#707070;margin:0">${p.categoryName || ''}</p>
              </div>
            </a>`;
          }).join('')}
        </div>
      </section>`;

    containerEl.insertAdjacentHTML('beforeend', html);
  }

  // ── 9. RENDER RECOMMENDATIONS ─────────────────────────────
  // Injects a "Recommended" section. Soft label.
  function renderRecommendations(containerEl, allProducts, pagePrefix) {
    const recs = getRecommendations(allProducts, 4);
    if (!recs) return;
    pagePrefix = pagePrefix || (window.location.pathname.includes('/product/') ? './' : './product/');

    const html = `
      <section style="padding:40px 0 0">
        <p style="font-family:Anton,sans-serif;font-size:12px;text-transform:uppercase;letter-spacing:0.14em;color:#707070;margin-bottom:16px">Recommended</p>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:16px">
          ${recs.map(p => {
            const img = (typeof _resolveImage === 'function') ? _resolveImage(p, 0) : (p.image || '');
            return `<a href="${pagePrefix}product.html?id=${encodeURIComponent(p.id)}"
              style="display:block;border:1px solid #e5e5e5;overflow:hidden;text-decoration:none;color:inherit">
              <div style="aspect-ratio:1/1;background:#f4f4f4;overflow:hidden">
                <img src="${img}" alt="${p.name}"
                  style="width:100%;height:100%;object-fit:contain;padding:8px"
                  onerror="this.style.display='none'"/>
              </div>
              <div style="padding:10px 12px">
                <p style="font-family:Anton,sans-serif;font-size:13px;text-transform:uppercase;margin:0 0 2px;letter-spacing:0.04em">${p.name}</p>
                <p style="font-family:'Hanken Grotesk',sans-serif;font-size:11px;color:#707070;margin:0">${p.categoryName || ''}</p>
              </div>
            </a>`;
          }).join('')}
        </div>
      </section>`;

    containerEl.insertAdjacentHTML('beforeend', html);
  }

  // ── 10. RENDER UPSELL (cart page) ─────────────────────────
  // "Complete your setup" — shown in cart after add.
  function renderUpsell(containerEl, allProducts, pagePrefix) {
    try {
      const cartItems = JSON.parse(localStorage.getItem('hfg_cart_v3') || '[]');
      const cartIds   = cartItems.map(i => i.productId || i.key.split('__')[0]);
      const upsells   = getUpsells(cartIds, allProducts);
      if (!upsells || !upsells.length) return;
      pagePrefix = pagePrefix || (window.location.pathname.includes('/product/') ? './' : './product/');

      const html = `
        <section style="margin-top:40px;padding:28px;border:1.5px solid #e5e5e5;background:#fbf9f9">
          <p style="font-family:Anton,sans-serif;font-size:13px;text-transform:uppercase;letter-spacing:0.1em;color:#000;margin:0 0 16px">Complete your setup</p>
          <div style="display:flex;gap:16px;flex-wrap:wrap">
            ${upsells.map(p => {
              const img = (typeof _resolveImage === 'function') ? _resolveImage(p, 0) : (p.image || '');
              return `<a href="${pagePrefix}product.html?id=${encodeURIComponent(p.id)}"
                style="display:flex;align-items:center;gap:12px;border:1px solid #e5e5e5;padding:10px 14px;text-decoration:none;color:inherit;background:#fff;min-width:200px;flex:1">
                <div style="width:48px;height:48px;flex-shrink:0;overflow:hidden;background:#f4f4f4">
                  <img src="${img}" alt="${p.name}"
                    style="width:100%;height:100%;object-fit:contain"
                    onerror="this.style.display='none'"/>
                </div>
                <div>
                  <p style="font-family:Anton,sans-serif;font-size:12px;text-transform:uppercase;margin:0 0 2px;letter-spacing:0.04em">${p.name}</p>
                  <p style="font-family:'Hanken Grotesk',sans-serif;font-size:11px;color:#bb0400;margin:0">+ Add →</p>
                </div>
              </a>`;
            }).join('')}
          </div>
        </section>`;

      containerEl.insertAdjacentHTML('beforeend', html);
    } catch { /* silent */ }
  }

  // ── Public API ────────────────────────────────────────────
  return {
    saveLocation,
    fillLocation,
    trackProduct,
    getRecentlyViewed,
    getRecommendations,
    getUpsells,
    getTopCategory,
    hasCartItems,
    renderRecentlyViewed,
    renderRecommendations,
    renderUpsell
  };

})();

// Auto-fill location fields when any checkout page loads
document.addEventListener('DOMContentLoaded', function () {
  HFG_P.fillLocation();
});
