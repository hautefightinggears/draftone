// ============================================================
// FORMS.JS — Haute Fighting Gears
// Newsletter + Contact Message — isolated from cart/orders
// ============================================================

var HFG_FORMS_URL = 'https://script.google.com/macros/s/AKfycbwuLTiUxHt90U6jqGxI4YBexC0B-qrB2gSsZlhZPtcvrNvI9f5dbEnF-vvtZJWz_zf9/exec';

// ── Newsletter ────────────────────────────────────────────────
function subscribeNewsletter() {
    var el = document.getElementById('newsletterEmail') ||
        document.getElementById('newsletter-email');
    var email = el ? el.value.trim() : '';

    if (!email) {
        alert('Please enter your email address.');
        if (el) el.focus();
        return;
    }

    fetch(HFG_FORMS_URL, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify({ type: 'newsletter', email: email })
    });

    alert('Subscribed');
    if (el) el.value = '';
}

// ── Contact message ───────────────────────────────────────────
function sendMessage() {
    var nameEl = document.getElementById('name') ||
        document.getElementById('ct-name');
    var contactEl = document.getElementById('contact') ||
        document.getElementById('ct-contact');
    var msgEl = document.getElementById('message') ||
        document.getElementById('ct-msg');

    var name = nameEl ? nameEl.value.trim() : '';
    var contact = contactEl ? contactEl.value.trim() : '';
    var message = msgEl ? msgEl.value.trim() : '';

    if (!name) { alert('Please enter your name.'); if (nameEl) nameEl.focus(); return; }
    if (!contact) { alert('Please enter your contact info.'); if (contactEl) contactEl.focus(); return; }
    if (!message) { alert('Please enter your message.'); if (msgEl) msgEl.focus(); return; }

    fetch(HFG_FORMS_URL, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify({ type: 'message', name: name, contact: contact, message: message })
    });

    alert('Message sent');

    if (nameEl) nameEl.value = '';
    if (contactEl) contactEl.value = '';
    if (msgEl) msgEl.value = '';
}
