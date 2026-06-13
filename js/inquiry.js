// ============================================================
// INQUIRY.JS — Haute Fighting Gears
// Handles product inquiry forms and WhatsApp integration
// ============================================================

const WHATSAPP_NUMBER = '923148968805'; // +923148968805 format for wa.me
const HFG_EMAIL = 'haute.fighting.gears@gmail.com';

// ── Create and show inquiry modal ──────────────────────────────
function showInquiryModal(productName = '') {
    // Remove existing modal if any
    const existing = document.getElementById('inquiry-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'inquiry-modal';
    modal.innerHTML = `
<div style="
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    padding: 16px;
    font-family: 'Hanken Grotesk', sans-serif;
" id="inquiry-backdrop">
    <div style="
        background: white;
        border: 2px solid #000;
        max-width: 500px;
        width: 100%;
        padding: 32px;
        max-height: 90vh;
        overflow-y: auto;
    ">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px;">
            <h2 style="margin: 0; font-size: 28px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.03em; font-family: 'Anton', sans-serif;">
                REQUEST QUOTE
            </h2>
            <button onclick="document.getElementById('inquiry-modal').remove()" style="
                background: none;
                border: none;
                font-size: 24px;
                cursor: pointer;
                color: #1b1b1b;
                padding: 0;
                width: 32px;
                height: 32px;
                display: flex;
                align-items: center;
                justify-content: center;
            ">
                <span class="material-symbols-outlined">close</span>
            </button>
        </div>

        <form id="inquiry-form" style="display: flex; flex-direction: column; gap: 16px;">
            <!-- Full Name -->
            <div>
                <label style="display: block; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 6px; color: #1b1b1b;">
                    Full Name *
                </label>
                <input type="text" id="inquiry-name" placeholder="Your name" required style="
                    width: 100%;
                    padding: 12px;
                    border: 1px solid #ccc;
                    font-size: 14px;
                    font-family: 'Hanken Grotesk', sans-serif;
                    box-sizing: border-box;
                " />
            </div>

            <!-- Email -->
            <div>
                <label style="display: block; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 6px; color: #1b1b1b;">
                    Email Address *
                </label>
                <input type="email" id="inquiry-email" placeholder="your@email.com" required style="
                    width: 100%;
                    padding: 12px;
                    border: 1px solid #ccc;
                    font-size: 14px;
                    font-family: 'Hanken Grotesk', sans-serif;
                    box-sizing: border-box;
                " />
            </div>

            <!-- Phone / WhatsApp -->
            <div>
                <label style="display: block; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 6px; color: #1b1b1b;">
                    Phone / WhatsApp Number *
                </label>
                <input type="tel" id="inquiry-phone" placeholder="+92 3xx xxxx xxx" required style="
                    width: 100%;
                    padding: 12px;
                    border: 1px solid #ccc;
                    font-size: 14px;
                    font-family: 'Hanken Grotesk', sans-serif;
                    box-sizing: border-box;
                " />
            </div>

            <!-- Product Name -->
            <div>
                <label style="display: block; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 6px; color: #1b1b1b;">
                    Product Name *
                </label>
                <input type="text" id="inquiry-product" placeholder="e.g., Boxing Gloves" required value="${productName}" style="
                    width: 100%;
                    padding: 12px;
                    border: 1px solid #ccc;
                    font-size: 14px;
                    font-family: 'Hanken Grotesk', sans-serif;
                    box-sizing: border-box;
                " />
            </div>

            <!-- Quantity -->
            <div>
                <label style="display: block; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 6px; color: #1b1b1b;">
                    Quantity / Amount *
                </label>
                <input type="number" id="inquiry-quantity" placeholder="e.g., 100" min="1" required value="1" style="
                    width: 100%;
                    padding: 12px;
                    border: 1px solid #ccc;
                    font-size: 14px;
                    font-family: 'Hanken Grotesk', sans-serif;
                    box-sizing: border-box;
                " />
            </div>

            <!-- Custom Description -->
            <div>
                <label style="display: block; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 6px; color: #1b1b1b;">
                    Custom Description / Requirements (Optional)
                </label>
                <textarea id="inquiry-description" placeholder="Tell us about your custom requirements, design preferences, etc." style="
                    width: 100%;
                    padding: 12px;
                    border: 1px solid #ccc;
                    font-size: 14px;
                    font-family: 'Hanken Grotesk', sans-serif;
                    box-sizing: border-box;
                    min-height: 100px;
                    resize: vertical;
                "></textarea>
            </div>

            <!-- Submit Button -->
            <button type="submit" style="
                width: 100%;
                background: #E10600;
                color: white;
                border: none;
                padding: 16px;
                font-size: 13px;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.1em;
                cursor: pointer;
                font-family: 'Hanken Grotesk', sans-serif;
                transition: background 0.3s ease;
                margin-top: 8px;
            " onmouseover="this.style.background='#000'" onmouseout="this.style.background='#E10600'">
                Send via WhatsApp
            </button>

            <!-- Alternative email option -->
            <button type="button" onclick="submitInquiryAsEmail()" style="
                width: 100%;
                background: transparent;
                color: #1b1b1b;
                border: 2px solid #1b1b1b;
                padding: 14px;
                font-size: 13px;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.1em;
                cursor: pointer;
                font-family: 'Hanken Grotesk', sans-serif;
                transition: all 0.3s ease;
            " onmouseover="this.style.background='#1b1b1b';this.style.color='white'" onmouseout="this.style.background='transparent';this.style.color='#1b1b1b'">
                Send via Email
            </button>
        </form>

        <p style="
            font-size: 12px;
            color: #707070;
            text-align: center;
            margin-top: 20px;
            margin-bottom: 0;
        ">
            We'll respond within 24 hours via WhatsApp or Email.
        </p>
    </div>
</div>
`;

    document.body.appendChild(modal);

    // Close modal on backdrop click
    document.getElementById('inquiry-backdrop').addEventListener('click', function(e) {
        if (e.target === this) {
            modal.remove();
        }
    });

    // Handle form submission
    document.getElementById('inquiry-form').addEventListener('submit', function(e) {
        e.preventDefault();
        submitInquiryAsWhatsApp();
    });

    // Focus on first field
    document.getElementById('inquiry-name').focus();
}

// ── Submit inquiry via WhatsApp ────────────────────────────────
function submitInquiryAsWhatsApp() {
    const name = document.getElementById('inquiry-name').value.trim();
    const email = document.getElementById('inquiry-email').value.trim();
    const phone = document.getElementById('inquiry-phone').value.trim();
    const product = document.getElementById('inquiry-product').value.trim();
    const quantity = document.getElementById('inquiry-quantity').value.trim();
    const description = document.getElementById('inquiry-description').value.trim();

    // Validate required fields
    if (!name || !email || !phone || !product || !quantity) {
        alert('Please fill in all required fields.');
        return;
    }

    // Build WhatsApp message
    const message = `Hello! I want to inquire about:

Product: ${product}
Quantity: ${quantity}

Customer Details:
Name: ${name}
Email: ${email}
Phone: ${phone}

${description ? `Custom Requirements:\n${description}` : ''}

Please provide a quote.`;

    // Open WhatsApp
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');

    // Close modal
    document.getElementById('inquiry-modal').remove();
}

// ── Submit inquiry via Email ───────────────────────────────────
function submitInquiryAsEmail() {
    const name = document.getElementById('inquiry-name').value.trim();
    const email = document.getElementById('inquiry-email').value.trim();
    const phone = document.getElementById('inquiry-phone').value.trim();
    const product = document.getElementById('inquiry-product').value.trim();
    const quantity = document.getElementById('inquiry-quantity').value.trim();
    const description = document.getElementById('inquiry-description').value.trim();

    // Validate required fields
    if (!name || !email || !phone || !product || !quantity) {
        alert('Please fill in all required fields.');
        return;
    }

    // Build email content
    const subject = `Product Inquiry: ${product}`;
    const body = `Hello Haute Fighting Gears,

I want to inquire about the following product:

Product: ${product}
Quantity: ${quantity}

My Details:
Name: ${name}
Email: ${email}
Phone: ${phone}

${description ? `Custom Requirements:\n${description}` : ''}

Please provide a quote.`;

    // Open email client
    const mailtoLink = `mailto:${HFG_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoLink;

    // Close modal
    document.getElementById('inquiry-modal').remove();
}

// ── Global function to trigger inquiry for specific product ────
function requestQuote(productName = '') {
    showInquiryModal(productName);
}

// ── Explicitly attach functions to window for global access ────
window.showInquiryModal = showInquiryModal;
window.requestQuote = requestQuote;
window.submitInquiryAsWhatsApp = submitInquiryAsWhatsApp;
window.submitInquiryAsEmail = submitInquiryAsEmail;
