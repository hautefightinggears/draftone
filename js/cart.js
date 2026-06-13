// ============================================================
// CART.JS — Haute Fighting Gears
// localStorage cart + Google Sheets order submission
// ============================================================

// ── Real contact details ──────────────────────────────────────
const HFG_EMAIL = 'haute.fighting.gears@gmail.com';
const HFG_PHONE = '03148968805';
const HFG_PHONE_WA = '923148968805'; // WhatsApp format (no leading 0, country code)
const HFG_INSTAGRAM = 'https://www.instagram.com/hautefightinggear1/';

// ── Google Apps Script endpoint ───────────────────────────────
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbybzt5JiIqCjR4KdF88MCrNYGsvn1rmi6DJ9xKe3NDbBsE78p9FNeQ0l6_YcrgBzCY/exec';

// ── Send order to Google Sheets ──────────────────────────────
// Payload: { type, rows }
// Apps Script routes based on type:
//   "sample"  → SAMPLE_ORDERS
//   "custom"  → CUSTOM_ORDERS
//   "bulk"    → BULK_ORDERS
// Uses no-cors — Apps Script web app does not return CORS headers.
function sendOrderToSheet(orderDataArray, orderType) {
    try {
        // Sanitise — replace any undefined/null with empty string
        const cleanRows = (orderDataArray || []).map(function (row) {
            var clean = {};
            Object.keys(row).forEach(function (k) {
                var v = row[k];
                clean[k] = (v === undefined || v === null) ? '' : String(v);
            });
            return clean;
        });

        var payload = {
            type: orderType || 'sample',
            rows: cleanRows
        };

        console.log('[HFG] ORDER PAYLOAD:', JSON.stringify(payload, null, 2));

        // Save locally first — order is never lost even if network fails
        _saveOrderLocally(payload);

        fetch(SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            body: JSON.stringify(payload)
        });

        alert('Order sent successfully. We will contact you within 24 hours.');

    } catch (err) {
        console.error('[HFG] sendOrderToSheet error:', err);
        alert('Order saved. We will contact you within 24 hours.');
    }
}

// ── Save order to localStorage (always, as backup) ────────────
function _saveOrderLocally(orderData) {
    try {
        var stored = JSON.parse(localStorage.getItem('hfg_orders_pending') || '[]');
        stored.push(Object.assign({}, orderData, { savedAt: new Date().toISOString() }));
        // Keep last 20 orders only
        if (stored.length > 20) stored = stored.slice(-20);
        localStorage.setItem('hfg_orders_pending', JSON.stringify(stored));
    } catch (e) {
        console.error('[HFG] Could not save order locally:', e);
    }
}

// ── Generate order ID ─────────────────────────────────────────
function generateOrderId() {
    return 'HFG-' + Date.now().toString(36).toUpperCase();
}

// ── Location helpers ──────────────────────────────────────────
// Save shipping location for auto-fill next time
function saveUserLocation(country, city, address, postal) {
    try {
        if (!country) return;
        localStorage.setItem('userLocation', JSON.stringify({
            country: country || '',
            city: city || '',
            address: address || '',
            postalCode: postal || ''
        }));
    } catch (e) { console.error('[HFG] saveUserLocation:', e); }
}

// Auto-fill location fields from localStorage
function fillUserLocation() {
    try {
        var loc = JSON.parse(localStorage.getItem('userLocation') || 'null');
        if (!loc) return;
        var fields = {
            'checkout-country': loc.country,
            'checkout-city': loc.city,
            'checkout-address': loc.address,
            'checkout-postal': loc.postalCode,
            'b-country': loc.country,
            'cs-country': loc.country
        };
        Object.keys(fields).forEach(function (id) {
            var el = document.getElementById(id);
            if (el && !el.value && fields[id]) el.value = fields[id];
        });
    } catch (e) { console.error('[HFG] fillUserLocation:', e); }
}

// ── Product view tracking ─────────────────────────────────────
// Stores up to 8 recently viewed products. No UI — backend only.
function trackProductView(productName) {
    try {
        if (!productName) return;
        var activity = JSON.parse(localStorage.getItem('userActivity') || '{"viewed":[]}');
        if (!activity.viewed) activity.viewed = [];
        // Remove duplicate, add to front, keep max 8
        activity.viewed = [productName]
            .concat(activity.viewed.filter(function (n) { return n !== productName; }))
            .slice(0, 8);
        localStorage.setItem('userActivity', JSON.stringify(activity));
    } catch (e) { /* silent */ }
}

// ── Send to WhatsApp ──────────────────────────────────────────
function sendToWhatsApp(message) {
    var url = 'https://wa.me/' + HFG_PHONE_WA + '?text=' + encodeURIComponent(message);
    window.open(url, '_blank');
}

// ── Cart module ───────────────────────────────────────────────
const Cart = (function () {
    var KEY = 'hfg_cart_v3';

    function getAll() {
        try { return JSON.parse(localStorage.getItem(KEY)) || []; }
        catch (e) { console.error('[HFG] Cart.getAll:', e); return []; }
    }

    function save(items) {
        try {
            localStorage.setItem(KEY, JSON.stringify(items));
            document.dispatchEvent(new CustomEvent('cartUpdated', { detail: { items: items } }));
        } catch (e) { console.error('[HFG] Cart.save:', e); }
    }

    // addItem(productObject, variantLabel, qty)
    // productObject: { id, name, price, image }
    // variantLabel:  combined string e.g. "Cowhide Leather · 14oz | Color: Red"
    function addItem(product, variantLabel, qty) {
        qty = parseInt(qty) || 1;

        // Safe extraction — never store undefined
        var id = (product && product.id) ? String(product.id) : 'unknown';
        var name = (product && product.name) ? String(product.name) : 'Product';
        var price = parseFloat((product && product.price) ? product.price : 0) || 0;
        var image = (product && product.image) ? String(product.image) : '';
        var label = variantLabel ? String(variantLabel) : 'Standard';

        var items = getAll();
        var key = id + '__' + label;
        var existing = items.find(function (i) { return i.key === key; });

        if (existing) {
            existing.qty += qty;
            existing.productPrice = price; // update price for new qty tier
        } else {
            items.push({
                key: key,
                productId: id,
                productName: name,
                productPrice: price,
                productImage: image,
                size: label,
                qty: qty
            });
        }
        save(items);
    }

    function removeItem(key) {
        save(getAll().filter(function (i) { return i.key !== key; }));
    }

    function updateQty(key, qty) {
        qty = parseInt(qty) || 0;
        if (qty <= 0) { removeItem(key); return; }
        var items = getAll();
        var item = items.find(function (i) { return i.key === key; });
        if (item) { item.qty = qty; save(items); }
    }

    function clear() { save([]); }

    function getCount() {
        return getAll().reduce(function (sum, i) {
            return sum + (parseInt(i.qty) || 0);
        }, 0);
    }

    function getTotal() {
        return getAll().reduce(function (sum, i) {
            return sum + (parseFloat(i.productPrice) || 0) * (parseInt(i.qty) || 0);
        }, 0);
    }

    return {
        getAll: getAll,
        addItem: addItem,
        removeItem: removeItem,
        updateQty: updateQty,
        clear: clear,
        getCount: getCount,
        getTotal: getTotal
    };
})();
