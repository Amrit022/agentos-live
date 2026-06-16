/* ============================================================
   NEXORA — Main Application Controller
   Products · Filters · Checkout · Tracking · Navigation
   ============================================================ */

(function () {
  'use strict';

  /* ──────────────── Helpers ──────────────── */

  function formatPrice(num) {
    if (num == null || isNaN(num)) return '$0.00';
    const n = Number(num);
    return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  window.formatPrice = formatPrice;

  function starRating(rating) {
    const full = Math.floor(rating);
    const half = rating % 1 >= 0.5 ? 1 : 0;
    const empty = 5 - full - half;
    let html = '';
    for (let i = 0; i < full; i++) html += '<span class="star full">★</span>';
    if (half) html += '<span class="star half">★</span>';
    for (let i = 0; i < empty; i++) html += '<span class="star empty">☆</span>';
    html += `<span class="rating-num">(${rating})</span>`;
    return html;
  }

  function showSpinner(container) {
    if (!container) return;
    container.innerHTML = `
      <div class="loading-spinner">
        <div class="spinner"></div>
        <p>Loading...</p>
      </div>
    `;
  }

  function parseFeatures(features) {
    if (!features) return [];
    if (Array.isArray(features)) return features;
    try {
      return JSON.parse(features);
    } catch {
      return [];
    }
  }

  /* ──────────────── Product Card Renderer ──────────────── */

  function renderProductCard(product) {
    const deliveryText =
      product.delivery_days === 1
        ? 'Tomorrow'
        : `${product.delivery_days} days`;

    return `
      <div class="product-card tilt-card reveal-on-scroll" data-product-id="${product.id}" data-price="${product.price}" data-rating="${product.rating}">
        <a href="/product/${product.id}" class="product-card-link">
          <div class="product-card-image tilt-inner">
            <img src="${product.image_url}" alt="${product.name}" loading="lazy" />
            <span class="product-card-badge">${product.category_display || product.category}</span>
          </div>
          <div class="product-card-body tilt-inner">
            <h3 class="product-card-name">${product.name}</h3>
            <div class="product-card-rating">${starRating(product.rating)}</div>
            <div class="product-card-footer">
              <div class="product-price">${formatPrice(product.price)}</div>
              <button class="btn btn-primary btn-add-to-cart" onclick="event.preventDefault(); event.stopPropagation(); addToCart(${product.id})" aria-label="Add to cart">
                <i class="fa-solid fa-cart-plus"></i>
              </button>
            </div>
            <p class="product-delivery" style="font-size: 0.72rem; color: var(--text-dim); margin-top: 8px;">🚀 Delivery: ${deliveryText}</p>
          </div>
        </a>
      </div>
    `;
  }
  window.renderProductCard = renderProductCard;

  /* ──────────────── Product Loading ──────────────── */

  let allProducts = [];

  async function loadFeaturedProducts() {
    const container = document.getElementById('featured-products');
    if (!container) return;

    showSpinner(container);

    try {
      const res = await fetch('/api/products');
      if (!res.ok) throw new Error('Failed to fetch products');
      const data = await res.json();
      const products = data.products || data || [];

      // Top 8 by rating
      const featured = [...products]
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 8);

      container.innerHTML = featured.map(renderProductCard).join('');

      if (window.ProductViewer) ProductViewer.reinit();
    } catch (err) {
      console.error('loadFeaturedProducts:', err);
      container.innerHTML = `
        <div class="error-state">
          <p>Unable to load products. Please try again later.</p>
        </div>
      `;
    }
  }

  async function loadCategoryProducts(categorySlug) {
    const container = document.getElementById('product-grid');
    if (!container) return;

    showSpinner(container);

    try {
      const res = await fetch(`/api/products/${categorySlug}`);
      if (!res.ok) throw new Error('Failed to fetch category products');
      const data = await res.json();
      allProducts = data.products || data || [];

      renderProducts(allProducts);
    } catch (err) {
      console.error('loadCategoryProducts:', err);
      container.innerHTML = `
        <div class="error-state">
          <p>Unable to load products. Please try again later.</p>
        </div>
      `;
    }
  }

  async function loadAllProducts() {
    const container = document.getElementById('product-grid');
    if (!container) return;

    showSpinner(container);

    try {
      const res = await fetch('/api/products');
      if (!res.ok) throw new Error('Failed to fetch products');
      const data = await res.json();
      allProducts = data.products || data || [];

      renderProducts(allProducts);
    } catch (err) {
      console.error('loadAllProducts:', err);
      container.innerHTML = `
        <div class="error-state">
          <p>Unable to load products. Please try again later.</p>
        </div>
      `;
    }
  }

  function renderProducts(products) {
    const container = document.getElementById('product-grid');
    if (!container) return;

    if (products.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <p>No products found matching your criteria.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = products.map(renderProductCard).join('');
    if (window.ProductViewer) ProductViewer.reinit();
  }

  /* ──────────────── Search & Filter ──────────────── */

  function sortProducts(sortBy) {
    let sorted = [...allProducts];
    switch (sortBy) {
      case 'price-asc':
        sorted.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        sorted.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        sorted.sort((a, b) => b.rating - a.rating);
        break;
      case 'name':
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        break;
    }
    renderProducts(sorted);
  }
  window.sortProducts = sortProducts;

  function filterByPrice(min, max) {
    const filtered = allProducts.filter(
      (p) => p.price >= (min || 0) && p.price <= (max || Infinity)
    );
    renderProducts(filtered);
  }
  window.filterByPrice = filterByPrice;

  function applyFilters() {
    const sortSelect = document.getElementById('sort-select');
    const minPrice = document.getElementById('min-price');
    const maxPrice = document.getElementById('max-price');

    let filtered = [...allProducts];

    // Price filter
    const min = minPrice ? parseFloat(minPrice.value) || 0 : 0;
    const max = maxPrice ? parseFloat(maxPrice.value) || Infinity : Infinity;
    filtered = filtered.filter((p) => p.price >= min && p.price <= max);

    // Sort
    if (sortSelect) {
      const sortBy = sortSelect.value;
      switch (sortBy) {
        case 'price-asc':
          filtered.sort((a, b) => a.price - b.price);
          break;
        case 'price-desc':
          filtered.sort((a, b) => b.price - a.price);
          break;
        case 'rating':
          filtered.sort((a, b) => b.rating - a.rating);
          break;
        case 'name':
          filtered.sort((a, b) => a.name.localeCompare(b.name));
          break;
      }
    }

    renderProducts(filtered);
  }
  window.applyFilters = applyFilters;

  /* ──────────────── Product Detail Page ──────────────── */

  async function loadProductDetail(productId) {
    const detailContainer = document.getElementById('product-detail');
    if (!detailContainer) return;

    showSpinner(detailContainer);

    try {
      const res = await fetch(`/api/product/${productId}`);
      if (!res.ok) throw new Error('Product not found');
      const product = await res.json();
      const features = parseFeatures(product.features);

      detailContainer.innerHTML = `
        <div class="product-detail-grid">
          <div class="product-detail-image float-image">
            <img src="${product.image_url}" alt="${product.name}" />
          </div>
          <div class="product-detail-info">
            <span class="category-badge">${product.category_display || product.category}</span>
            <h1 class="product-detail-name">${product.name}</h1>
            <div class="product-rating">${starRating(product.rating)}</div>
            <div class="product-detail-price">${formatPrice(product.price)}</div>
            <p class="product-detail-desc">${product.description}</p>
            ${
              features.length > 0
                ? `<ul class="product-features">
                    ${features.map((f) => `<li>${f}</li>`).join('')}
                   </ul>`
                : ''
            }
            <p class="product-stock ${product.stock > 0 ? 'in-stock' : 'out-of-stock'}">
              ${product.stock > 0 ? `✓ In Stock (${product.stock} available)` : '✕ Out of Stock'}
            </p>
            <p class="product-delivery-info">🚀 Delivery in ${product.delivery_days} day${product.delivery_days !== 1 ? 's' : ''}</p>
            <div class="product-actions">
              <div class="quantity-selector">
                <button class="qty-btn" onclick="adjustDetailQty(-1)">−</button>
                <input type="number" id="detail-qty" value="1" min="1" max="${product.stock}" />
                <button class="qty-btn" onclick="adjustDetailQty(1)">+</button>
              </div>
              <button class="btn btn-primary btn-lg" onclick="addToCartFromDetail(${product.id})" ${product.stock <= 0 ? 'disabled' : ''}>
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      `;

      if (window.ProductViewer) ProductViewer.reinit();

      // Load related products
      loadRelatedProducts(product.category, product.id);
    } catch (err) {
      console.error('loadProductDetail:', err);
      detailContainer.innerHTML = `
        <div class="error-state">
          <p>Product not found. <a href="/">Go back to home</a></p>
        </div>
      `;
    }
  }

  async function loadRelatedProducts(category, excludeId) {
    const container = document.getElementById('related-products');
    if (!container) return;

    try {
      const res = await fetch(`/api/products/${category}`);
      if (!res.ok) return;
      const data = await res.json();
      const products = (data.products || data || [])
        .filter((p) => p.id !== excludeId)
        .slice(0, 4);

      if (products.length === 0) {
        container.style.display = 'none';
        return;
      }

      container.innerHTML = `
        <h2 class="section-title">You May Also Like</h2>
        <div class="product-grid">
          ${products.map(renderProductCard).join('')}
        </div>
      `;

      if (window.ProductViewer) ProductViewer.reinit();
    } catch (err) {
      console.error('loadRelatedProducts:', err);
    }
  }

  function adjustDetailQty(delta) {
    const input = document.getElementById('detail-qty');
    if (!input) return;
    let val = parseInt(input.value, 10) || 1;
    val = Math.max(1, val + delta);
    input.value = val;
  }
  window.adjustDetailQty = adjustDetailQty;

  function addToCartFromDetail(productId) {
    const input = document.getElementById('detail-qty');
    const qty = input ? parseInt(input.value, 10) || 1 : 1;
    addToCart(productId, qty);
  }
  window.addToCartFromDetail = addToCartFromDetail;

  /* ──────────────── Checkout Flow ──────────────── */

  async function submitCheckout(e) {
    if (e) e.preventDefault();
    const form = document.getElementById('checkout-form');
    if (!form) return;

    // Validate required fields
    const fields = ['name', 'email', 'phone', 'address', 'city', 'state', 'pincode'];
    let valid = true;

    fields.forEach((field) => {
      const input = form.querySelector(`[name="${field}"]`);
      if (!input) return;
      const errEl = input.parentElement.querySelector('.field-error');

      if (!input.value.trim()) {
        valid = false;
        input.classList.add('input-error');
        if (errEl) errEl.textContent = 'This field is required';
      } else {
        input.classList.remove('input-error');
        if (errEl) errEl.textContent = '';
      }
    });

    // Phone validation
    const phone = form.querySelector('[name="phone"]');
    if (phone && phone.value.trim() && !/^\d{10}$/.test(phone.value.trim())) {
      valid = false;
      phone.classList.add('input-error');
      const errEl = phone.parentElement.querySelector('.field-error');
      if (errEl) errEl.textContent = 'Enter a valid 10-digit phone number';
    }

    // Pincode validation
    const pincode = form.querySelector('[name="pincode"]');
    if (pincode && pincode.value.trim() && !/^\d{6}$/.test(pincode.value.trim())) {
      valid = false;
      pincode.classList.add('input-error');
      const errEl = pincode.parentElement.querySelector('.field-error');
      if (errEl) errEl.textContent = 'Enter a valid 6-digit pincode';
    }

    // Email validation
    const email = form.querySelector('[name="email"]');
    if (email && email.value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
      valid = false;
      email.classList.add('input-error');
      const errEl = email.parentElement.querySelector('.field-error');
      if (errEl) errEl.textContent = 'Enter a valid email address';
    }

    if (!valid) {
      if (window.CartManager) CartManager.showToast('Please fix the errors in the form', 'error');
      return;
    }

    // Build payload
    const payload = {};
    fields.forEach((field) => {
      const input = form.querySelector(`[name="${field}"]`);
      if (input) payload[field] = input.value.trim();
    });
    // Optional address2
    const address2 = form.querySelector('[name="address2"]');
    if (address2) payload.address2 = address2.value.trim();

    // Submit
    const submitBtn = form.querySelector('[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spinner-sm"></span> Placing Order...';
    }

    try {
      const res = await fetch('/api/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Order failed');
      const data = await res.json();

      // Show success modal
      const modal = document.getElementById('order-success-modal');
      const orderIdEl = document.getElementById('order-id-display');

      if (orderIdEl) orderIdEl.textContent = data.order_id;
      if (modal) {
        modal.classList.add('active');
        launchConfetti();
      }

      // Reload cart (should be empty now)
      if (window.CartManager) CartManager.loadCart();
    } catch (err) {
      console.error('submitCheckout:', err);
      if (window.CartManager) CartManager.showToast('Order could not be placed. Please try again.', 'error');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Place Order';
      }
    }
  }
  window.submitCheckout = submitCheckout;

  /* ──────────────── Confetti Effect ──────────────── */

  function launchConfetti() {
    const container = document.createElement('div');
    container.className = 'confetti-container';
    container.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      pointer-events: none; z-index: 10001; overflow: hidden;
    `;
    document.body.appendChild(container);

    const colors = ['#00f0ff', '#a855f7', '#f472b6', '#34d399', '#fbbf24', '#f87171'];
    const particleCount = 80;

    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      const color = colors[Math.floor(Math.random() * colors.length)];
      const size = 6 + Math.random() * 8;
      const left = Math.random() * 100;
      const delay = Math.random() * 0.5;
      const duration = 2 + Math.random() * 2;
      const rotation = Math.random() * 360;
      const shape = Math.random() > 0.5 ? '50%' : '0';

      particle.style.cssText = `
        position: absolute;
        top: -10px;
        left: ${left}%;
        width: ${size}px;
        height: ${size}px;
        background: ${color};
        border-radius: ${shape};
        opacity: 0.9;
        transform: rotate(${rotation}deg);
        animation: confettiFall ${duration}s ease-in ${delay}s forwards;
      `;
      container.appendChild(particle);
    }

    // Inject keyframes if not already present
    if (!document.getElementById('confetti-style')) {
      const style = document.createElement('style');
      style.id = 'confetti-style';
      style.textContent = `
        @keyframes confettiFall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }

    // Clean up after animation
    setTimeout(() => container.remove(), 5000);
  }

  /* ──────────────── Order Tracking ──────────────── */

  async function searchOrder(e) {
    if (e) e.preventDefault();
    const form = document.getElementById('tracking-form');
    const resultContainer = document.getElementById('tracking-result');
    if (!form || !resultContainer) return;

    const input = form.querySelector('input[name="order_id"]') || form.querySelector('input');
    if (!input || !input.value.trim()) {
      if (window.CartManager) CartManager.showToast('Please enter an order ID', 'error');
      return;
    }

    const orderId = input.value.trim();
    showSpinner(resultContainer);

    try {
      const res = await fetch(`/api/order/${orderId}`);
      if (!res.ok) throw new Error('Order not found');
      const order = await res.json();

      renderOrderTracking(order, resultContainer);
    } catch (err) {
      console.error('searchOrder:', err);
      resultContainer.innerHTML = `
        <div class="error-state">
          <h3>Order Not Found</h3>
          <p>We couldn't find order <strong>${orderId}</strong>. Please check the ID and try again.</p>
        </div>
      `;
    }
  }
  window.searchOrder = searchOrder;

  function renderOrderTracking(order, container) {
    const statuses = ['placed', 'processing', 'shipped', 'delivered'];
    const currentIdx = statuses.indexOf(order.status);
    const statusLabels = {
      placed: 'Order Placed',
      processing: 'Processing',
      shipped: 'Shipped',
      delivered: 'Delivered',
    };

    const timeline = statuses
      .map((status, idx) => {
        let stateClass = '';
        if (idx < currentIdx) stateClass = 'completed';
        else if (idx === currentIdx) stateClass = 'active';
        else stateClass = 'pending';

        return `
          <div class="timeline-step ${stateClass}">
            <div class="timeline-dot"></div>
            <div class="timeline-label">${statusLabels[status]}</div>
          </div>
        `;
      })
      .join('');

    const items = (order.items || [])
      .map(
        (item) => `
        <div class="tracking-item">
          <img src="${item.image_url}" alt="${item.name}" />
          <div>
            <p class="tracking-item-name">${item.name}</p>
            <p class="tracking-item-qty">Qty: ${item.quantity} × ${formatPrice(item.price)}</p>
          </div>
        </div>
      `
      )
      .join('');

    const createdDate = order.created_at
      ? new Date(order.created_at).toLocaleDateString('en-US', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      : 'N/A';
    const deliveryDate = order.estimated_delivery
      ? new Date(order.estimated_delivery).toLocaleDateString('en-US', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      : 'N/A';

    container.innerHTML = `
      <div class="tracking-card reveal-on-scroll">
        <div class="tracking-header">
          <h2>Order ${order.order_id}</h2>
          <span class="status-badge status-${order.status}">${statusLabels[order.status] || order.status}</span>
        </div>
        <div class="tracking-timeline">
          <div class="timeline-track"></div>
          ${timeline}
        </div>
        <div class="tracking-dates">
          <div><strong>Ordered:</strong> ${createdDate}</div>
          <div><strong>Estimated Delivery:</strong> ${deliveryDate}</div>
        </div>
        <div class="tracking-items">
          <h3>Items</h3>
          ${items}
        </div>
        <div class="tracking-total">
          <strong>Total:</strong> ${formatPrice(order.total)}
        </div>
      </div>
    `;

    if (window.ProductViewer) ProductViewer.reinit();
  }

  /* ──────────────── Mobile Menu ──────────────── */

  function initMobileMenu() {
    const toggle = document.getElementById('mobile-menu-toggle');
    const menu = document.getElementById('mobile-menu');
    if (!toggle || !menu) return;

    toggle.addEventListener('click', () => {
      const isOpen = menu.classList.toggle('open');
      toggle.classList.toggle('active', isOpen);
      toggle.setAttribute('aria-expanded', isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    // Close on link click
    menu.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        menu.classList.remove('open');
        toggle.classList.remove('active');
        toggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (
        menu.classList.contains('open') &&
        !menu.contains(e.target) &&
        !toggle.contains(e.target)
      ) {
        menu.classList.remove('open');
        toggle.classList.remove('active');
        toggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      }
    });
  }

  /* ──────────────── Smooth Scroll ──────────────── */

  function initSmoothScroll() {
    document.addEventListener('click', (e) => {
      const anchor = e.target.closest('a[href^="#"]');
      if (!anchor) return;

      const targetId = anchor.getAttribute('href');
      if (targetId === '#') return;

      const target = document.querySelector(targetId);
      if (!target) return;

      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  /* ──────────────── Filter UI Event Listeners ──────────────── */

  function initFilters() {
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
      sortSelect.addEventListener('change', applyFilters);
    }

    const filterBtn = document.getElementById('apply-filters');
    if (filterBtn) {
      filterBtn.addEventListener('click', applyFilters);
    }

    // Price range inputs
    const minPrice = document.getElementById('min-price');
    const maxPrice = document.getElementById('max-price');
    if (minPrice) minPrice.addEventListener('change', applyFilters);
    if (maxPrice) maxPrice.addEventListener('change', applyFilters);
  }

  /* ──────────────── Checkout Form Binding ──────────────── */

  function initCheckoutForm() {
    const form = document.getElementById('checkout-form');
    if (!form) return;

    form.addEventListener('submit', submitCheckout);

    // Clear error on input
    form.querySelectorAll('input, textarea').forEach((input) => {
      input.addEventListener('input', () => {
        input.classList.remove('input-error');
        const errEl = input.parentElement.querySelector('.field-error');
        if (errEl) errEl.textContent = '';
      });
    });
  }

  /* ──────────────── Tracking Form Binding ──────────────── */

  function initTrackingForm() {
    const form = document.getElementById('tracking-form');
    if (!form) return;
    form.addEventListener('submit', searchOrder);
  }

  /* ──────────────── Page Router / Auto-loader ──────────────── */

  function detectAndLoad() {
    const path = window.location.pathname;

    // Landing page — featured products
    if (path === '/' || path === '/index' || path === '/home') {
      loadFeaturedProducts();
    }

    // Category page: /category/<slug>
    const categoryMatch = path.match(/^\/category\/([a-z0-9_-]+)/i);
    if (categoryMatch) {
      loadCategoryProducts(categoryMatch[1]);
    }

    // All products page
    if (path === '/products' || path === '/shop') {
      loadAllProducts();
    }

    // Product detail: /product/<id>
    const productMatch = path.match(/^\/product\/(\d+)/);
    if (productMatch) {
      loadProductDetail(parseInt(productMatch[1], 10));
    }

    // Also check for data attributes that tell us what to load
    const productGrid = document.getElementById('product-grid');
    if (productGrid && productGrid.dataset.category) {
      loadCategoryProducts(productGrid.dataset.category);
    } else if (productGrid && !categoryMatch && path !== '/products' && path !== '/shop') {
      // Product grid exists but no category — load all
      loadAllProducts();
    }

    const productDetail = document.getElementById('product-detail');
    if (productDetail && productDetail.dataset.productId) {
      loadProductDetail(parseInt(productDetail.dataset.productId, 10));
    }
  }

  /* ──────────────── Close Success Modal ──────────────── */

  function closeOrderModal() {
    const modal = document.getElementById('order-success-modal');
    if (modal) modal.classList.remove('active');
  }
  window.closeOrderModal = closeOrderModal;

  /* ──────────────── Init Everything ──────────────── */

  function init() {
    initMobileMenu();
    initSmoothScroll();
    initFilters();
    initCheckoutForm();
    initTrackingForm();
    detectAndLoad();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* ──────────────── Expose for external use ──────────────── */
  window.NexoraApp = {
    loadFeaturedProducts,
    loadCategoryProducts,
    loadAllProducts,
    loadProductDetail,
    sortProducts,
    filterByPrice,
    applyFilters,
    renderProductCard,
    formatPrice,
  };
})();
