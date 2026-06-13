// ============================================================
// PRODUCTS-ENGINE.JS — Haute Fighting Gears
// Loads from products/products.json
// Works from ANY page depth (root, /pages/, etc.)
// Requires a local server (Live Server / localhost) — NOT file://
// ============================================================

// ── Warn if running on file:// protocol ──────────────────────
if (window.location.protocol === 'file:') {
    console.warn(
        '[products-engine] ⚠️  You are opening this file directly (file://).\n' +
        'Products will NOT load due to browser CORS restrictions.\n' +
        'Please use VS Code Live Server or run: npx serve .'
    );
}

// ── Category display name map — clean ecommerce labels ───────
// Defined early so loadProducts() can reference it
const _categoryDisplayNames = {
    'street-fashion': 'Streetwear',
    'gym-fitness': 'Gym Wear',
    'mma': 'MMA',
    'boxing': 'Boxing',
    'sports': 'Sports Gear'
};

function _getCategoryLabel(cat) {
    return _categoryDisplayNames[cat.id] || cat.name;
}

// ── Resolve relative path prefix from current page to site root ──
function _getRelativeRootPrefix() {
    const path = window.location.pathname;
    const cleaned = path.replace(/^\//, '').replace(/\/$/, '');
    const parts = cleaned.split('/').filter(Boolean);
    const depth = parts.length > 0 && parts[parts.length - 1].includes('.') ? parts.length - 1 : parts.length;
    return depth === 0 ? './' : '../'.repeat(depth);
}

// ── Resolve correct path to products.json from any page ──────
function _getJsonPath() {
    if (window.HFG_BASE) {
        return window.HFG_BASE + '/products/products.json';
    }

    const prefix = _getRelativeRootPrefix();
    return prefix + 'products/products.json';
}

// ── Resolve correct path prefix for product page links ───────
function _getPagePrefix() {
    const path = window.location.pathname;
    if (path.includes('/product/')) return './';
    return _getRelativeRootPrefix() + 'product/';
}

// ── Resolve correct path prefix for root-level links ─────────
function _getRootPrefix() {
    return _getRelativeRootPrefix();
}

// Cache so we only fetch once per page load
let _productsCache = null;
let _categoriesCache = null;
let _rawDataCache = null;

// ── Core fetch — shared by loadProducts and loadCategories ───
async function _fetchProductData() {
    if (_rawDataCache) return _rawDataCache;
    const url = _getJsonPath();
    console.log('[products-engine] Fetching:', url);
    let res;
    try {
        res = await fetch(url);
    } catch (networkErr) {
        throw new Error('Network error fetching products.json: ' + networkErr.message);
    }
    if (!res.ok) throw new Error('HTTP ' + res.status + ' fetching ' + url);
    const data = await res.json().catch(e => { throw new Error('Invalid JSON in products.json: ' + e.message); });
    _rawDataCache = data;
    return _rawDataCache;
}

// ── Load all products (flattened array) ───────────────────────
async function loadProducts() {
    if (_productsCache) return _productsCache;
    try {
        const data = await _fetchProductData();
        _productsCache = [];
        data.categories.forEach(cat => {
            cat.products.forEach(p => {
                _productsCache.push({
                    ...p,
                    categoryId: cat.id,
                    categoryName: _categoryDisplayNames[cat.id] || cat.name
                });
            });
        });
        return _productsCache;
    } catch (e) {
        console.error('[products-engine] Failed to load products:', e.message);
        if (window.location.protocol === 'file:') {
            console.error('[products-engine] ❌ Open this site with Live Server, not by double-clicking the file.');
        }
        return [];
    }
}

// ── Load ONLY the 4 real sample products (have local images + specs) ──
// Used by Samples page and Featured sections — NOT by Bulk/Custom dropdowns
const _REAL_PRODUCT_IDS = ['boxing-gloves', 'boxing-head-guard', 'inner-gloves', 'mma-grappling-gloves'];

async function loadSampleProducts() {
    const all = await loadProducts();
    return all.filter(p => _REAL_PRODUCT_IDS.includes(p.id));
}

// ── Get tiered price for a product based on variant + quantity ─
// variant: variant object from product.variants[], or null for legacy pricing
// qty: number
function getPrice(product, qty, variant) {
    qty = parseInt(qty) || 1;
    // Use variant pricing if provided
    const pricing = (variant && variant.pricing) ? variant.pricing
        : (product && product.pricing) ? product.pricing
            : null;
    if (!pricing) return null;
    if (qty >= 50) return pricing['50'];
    if (qty >= 25) return pricing['25'];
    return pricing['1'];
}

function getStartingPrice(product) {
    if (!product) return null;
    // Use first variant's pricing if variants exist
    if (product.variants && product.variants.length > 0) {
        return product.variants[0].pricing['1'];
    }
    if (product.pricing) return product.pricing['1'];
    return null;
}

function formatPrice(price) {
    if (price == null) return '';
    return '$' + parseFloat(price).toFixed(2);
}

// ── Load categories ───────────────────────────────────────────
async function loadCategories() {
    if (_categoriesCache) return _categoriesCache;
    try {
        const data = await _fetchProductData();
        _categoriesCache = data.categories;
        return _categoriesCache;
    } catch (e) {
        console.error('[products-engine] Failed to load categories:', e.message);
        return [];
    }
}

// ── Get single product by id ──────────────────────────────────
async function getProductById(id) {
    const products = await loadProducts();
    return products.find(p => p.id === id) || null;
}

// ── Resolve image URL — always returns a valid image ─────────
function _resolveImage(p, index) {
    index = index || 0;

    // If product has a local images array, use it
    if (p.images && p.images.length > index) {
        return _toAbsoluteProductPath(p.images[index]);
    }

    // If product has a single local image path (starts with ../ or ./)
    if (p.image && (p.image.startsWith('../') || p.image.startsWith('./'))) {
        return _toAbsoluteProductPath(p.image);
    }

    // Use the product's own image if it's a real external URL
    if (
        p.image &&
        p.image.startsWith('http') &&
        !p.image.includes('via.placeholder.com') &&
        !p.image.includes('data:image/svg')
    ) {
        return p.image;
    }

    // Category-level fallback images (Unsplash)
    const categoryImages = {
        'street-fashion': 'https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=400&h=400&fit=crop&auto=format',
        'gym-fitness': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop&auto=format',
        'mma': 'https://images.unsplash.com/photo-1555597673-b21d5c935865?w=400&h=400&fit=crop&auto=format',
        'boxing': 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=400&h=400&fit=crop&auto=format',
        'sports': 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400&h=400&fit=crop&auto=format'
    };

    return categoryImages[p.categoryId] ||
        'data:image/svg+xml,%3Csvg xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22 width%3D%22400%22 height%3D%22400%22%3E%3Crect width%3D%22400%22 height%3D%22400%22 fill%3D%22%231b1b1b%22%2F%3E%3C%2Fsvg%3E';
}

// Convert a relative product image path (../Product/...) to correct URL
function _toAbsoluteProductPath(relativePath) {
    // Strip leading ../ or ./
    const clean = relativePath.replace(/^(\.\.\/|\.\/)+/, '');

    // Use HFG_BASE if available (set by mobile-fixes.js)
    if (window.HFG_BASE) {
        return window.HFG_BASE + '/' + clean;
    }

    // Fallback: build from current page location
    const isSubPage = window.location.pathname.includes('/pages/');
    if (window.location.hostname.includes('github.io')) {
        const parts = window.location.pathname.split('/').filter(Boolean);
        const repoBase = (parts[0] && !parts[0].includes('.')) ? ('/' + parts[0]) : '';
        return window.location.origin + repoBase + '/' + clean;
    }
    return isSubPage ? ('../' + clean) : ('./' + clean);
}

// ── Build product dropdown options HTML ───────────────────────
async function buildProductOptions(selectedId) {
    const categories = await loadCategories();
    if (!categories || categories.length === 0) {
        return '<option value="">— No products found —</option>';
    }
    let html = '<option value="">— Select a product —</option>';
    categories.forEach(cat => {
        html += `<optgroup label="${cat.name}">`;
        cat.products.forEach(p => {
            if (!p.id || !p.name) return; // skip malformed entries
            const sel = p.id === selectedId ? ' selected' : '';
            html += `<option value="${p.id}"${sel}>${p.name}</option>`;
        });
        html += '</optgroup>';
    });
    return html;
}

// ── Render product grid ───────────────────────────────────────
// filter: category id string, or 'all'
async function renderProductGrid(container, filter) {
    filter = filter || 'all';
    const products = await loadProducts();
    const list = filter === 'all' ? products : products.filter(p => p.categoryId === filter);

    if (list.length === 0) {
        container.innerHTML = '<div class="col-span-4 text-center py-20 font-label-bold uppercase opacity-40">No products found</div>';
        return;
    }

    const pagePrefix = _getPagePrefix();
    const rootPrefix = _getRootPrefix();

    container.innerHTML = list.map(p => {
        const img = _resolveImage(p, 0);

        const target = `${pagePrefix}product.html?id=${encodeURIComponent(p.id)}`;
        return `
        <a href="${target}" class="group border border-outline-variant bg-surface-container-lowest overflow-hidden flex flex-col" data-reveal style="text-decoration:none;color:inherit;display:flex">
            <div style="width:100%;background:#fff;display:flex;align-items:center;justify-content:center;overflow:hidden;flex-shrink:0;aspect-ratio:1/1;border-bottom:1px solid #eee">
                <img
                    src="${img}"
                    alt="${p.name}"
                    loading="lazy"
                    class="transition-transform duration-500 group-hover:scale-105"
                    style="display:block;width:100%;height:auto;object-fit:contain;padding:8px"
                    onerror="this.onerror=null;this.src='data:image/svg+xml,%3Csvg xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22 width%3D%22400%22 height%3D%22400%22%3E%3Crect width%3D%22400%22 height%3D%22400%22 fill%3D%22%23eeeeee%22%2F%3E%3C%2Fsvg%3E'"
                />
            </div>
            <div class="p-5 flex flex-col flex-grow">
                <h3 class="font-headline-md text-headline-md uppercase mb-1 leading-tight" style="font-size:17px">${p.name}</h3>
                <p class="font-body-md text-neutral-gray mb-4" style="font-size:12px;font-weight:400;letter-spacing:0.04em">${p.categoryName || p.category || ''}</p>
                <div class="mt-auto">
                    <span class="w-full bg-accent-red text-on-primary py-3 font-label-bold uppercase flex items-center justify-center gap-2 text-center text-sm" style="pointer-events:none">
                        <span class="material-symbols-outlined text-[16px]">send</span> Send Inquiry
                    </span>
                </div>
            </div>
        </a>`;
    }).join('');

    if (typeof initScrollReveal === 'function') initScrollReveal();
}

// ── Build category filter buttons ─────────────────────────────
async function buildCategoryFilters(container, activeId, onFilter) {
    const categories = await loadCategories();
    const allActive = (!activeId || activeId === 'all') ? 'bg-primary text-on-primary' : '';
    let html = `<button data-filter="all" class="filter-btn ${allActive} px-5 py-2 font-label-bold uppercase border-2 border-primary hover:bg-primary hover:text-on-primary transition-all">All Products</button>`;
    categories.forEach(cat => {
        const active = cat.id === activeId ? 'bg-primary text-on-primary' : '';
        html += `<button data-filter="${cat.id}" class="filter-btn ${active} px-5 py-2 font-label-bold uppercase border-2 border-primary hover:bg-primary hover:text-on-primary transition-all">${_getCategoryLabel(cat)}</button>`;
    });
    container.innerHTML = html;
    container.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            container.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('bg-primary', 'text-on-primary'));
            btn.classList.add('bg-primary', 'text-on-primary');
            if (typeof onFilter === 'function') onFilter(btn.dataset.filter);
        });
    });
}


