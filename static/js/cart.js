/* ============================================================
   NEXORA — Cart Manager
   Cart CRUD · toast notifications · badge updates
   ============================================================ */

const CartManager = (function () {
  'use strict';

  let cartItems = [];
  let cartTotal = 0;

  /* ──────────────── Price Formatter ──────────────── */

  function formatPrice(num) {
    if (num == null || isNaN(num)) return '$0.00';
    const n = Number(num);
    return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  /* ──────────────── Toast Notifications ──────────────── */

  function showToast(message, type = 'success') {
    // Create container if missing
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.style.cssText = `
        position: fixed; top: 20px; right: 20px; z-index: 10000;
        display: flex; flex-direction: column; gap: 10px;
        pointer-events: none;
      `;
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    const bgColor =
      type === 'success'
        ? 'linear-gradient(135deg, #00f0ff22, #0a0a2e)'
        : 'linear-gradient(135deg, #ff4d4f22, #0a0a2e)';
    const borderColor = type === 'success' ? '#00f0ff' : '#ff4d4f';
    const icon = type === 'success' ? '✓' : '✕';

    toast.style.cssText = `
      background: ${bgColor};
      border: 1px solid ${borderColor};
      color: #e0e0e0;
      padding: 14px 22px;
      border-radius: 10px;
      font-size: 0.9rem;
      font-family: inherit;
      pointer-events: auto;
      transform: translateX(120%);
      transition: transform 0.4s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.3s;
      backdrop-filter: blur(12px);
      box-shadow: 0 4px 24px rgba(0,0,0,0.4);
      display: flex; align-items: center; gap: 10px;
      max-width: 340px;
    `;

    toast.innerHTML = `
      <span style="font-size:1.1rem; color:${borderColor}">${icon}</span>
      <span>${message}</span>
    `;

    container.appendChild(toast);

    // Slide in
    requestAnimationFrame(() => {
      toast.style.transform = 'translateX(0)';
    });

    // Auto-dismiss after 3s
    setTimeout(() => {
      toast.style.transform = 'translateX(120%)';
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 400);
    }, 3000);
  }

  /* ──────────────── Badge Update ──────────────── */

  function updateBadge() {
    const badge = document.getElementById('cart-badge');
    if (!badge) return;
    const count = cartItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
    badge.textContent = count;
    badge.style.display = count > 0 ? 'flex' : 'none';
  }

  /* ──────────────── API Methods ──────────────── */

  async function loadCart() {
    try {
      const res = await fetch('/api/cart');
      if (!res.ok) throw new Error('Failed to load cart');
      const data = await res.json();
      cartItems = data.items || data || [];
      cartTotal = data.total || cartItems.reduce((s, i) => s + (i.total || i.price * i.quantity), 0);
      updateBadge();
      return cartItems;
    } catch (err) {
      console.error('CartManager.loadCart:', err);
      cartItems = [];
      updateBadge();
      return [];
    }
  }

  async function addToCart(productId, quantity = 1) {
    try {
      const res = await fetch('/api/cart/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: productId, quantity }),
      });
      if (!res.ok) throw new Error('Failed to add to cart');
      const data = await res.json();
      showToast('Added to cart!', 'success');
      await loadCart();
      return data;
    } catch (err) {
      console.error('CartManager.addToCart:', err);
      showToast('Could not add item to cart', 'error');
      return null;
    }
  }

  async function updateQuantity(itemId, quantity) {
    try {
      if (quantity < 1) {
        return removeItem(itemId);
      }
      const res = await fetch('/api/cart/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item_id: itemId, quantity }),
      });
      if (!res.ok) throw new Error('Failed to update quantity');
      await loadCart();
      // Re-render if on cart page
      if (document.getElementById('cart-items-container')) {
        renderCartPage();
        renderCartSummary();
      }
      return true;
    } catch (err) {
      console.error('CartManager.updateQuantity:', err);
      showToast('Could not update quantity', 'error');
      return false;
    }
  }

  async function removeItem(itemId) {
    try {
      const res = await fetch(`/api/cart/remove/${itemId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to remove item');
      showToast('Item removed from cart', 'success');
      await loadCart();
      // Re-render if on cart page
      if (document.getElementById('cart-items-container')) {
        renderCartPage();
        renderCartSummary();
      }
      return true;
    } catch (err) {
      console.error('CartManager.removeItem:', err);
      showToast('Could not remove item', 'error');
      return false;
    }
  }

  function getCartCount() {
    return cartItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
  }

  /* ──────────────── Render Cart Page ──────────────── */

  function renderCartPage() {
    const container = document.getElementById('cart-items-container');
    const emptyState = document.getElementById('cart-empty-state');
    if (!container) return;

    if (cartItems.length === 0) {
      container.innerHTML = '';
      if (emptyState) emptyState.style.display = 'flex';
      return;
    }

    if (emptyState) emptyState.style.display = 'none';

    container.innerHTML = cartItems
      .map(
        (item) => `
      <div class="cart-item reveal-on-scroll" data-item-id="${item.id}">
        <div class="cart-item-image">
          <img src="${item.image_url}" alt="${item.name}" loading="lazy" />
        </div>
        <div class="cart-item-details">
          <h3 class="cart-item-name">${item.name}</h3>
          <p class="cart-item-price">${formatPrice(item.price)}</p>
        </div>
        <div class="cart-item-quantity">
          <button class="qty-btn qty-minus" onclick="updateQuantity(${item.id}, ${item.quantity - 1})" aria-label="Decrease quantity">−</button>
          <span class="qty-value">${item.quantity}</span>
          <button class="qty-btn qty-plus" onclick="updateQuantity(${item.id}, ${item.quantity + 1})" aria-label="Increase quantity">+</button>
        </div>
        <div class="cart-item-total">
          <span>${formatPrice(item.total || item.price * item.quantity)}</span>
        </div>
        <button class="cart-item-remove" onclick="removeFromCart(${item.id})" aria-label="Remove item">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>
    `
      )
      .join('');

    // Re-init scroll reveal for new elements
    if (window.ProductViewer) ProductViewer.reinit();
  }

  function renderCartSummary() {
    const summary = document.getElementById('cart-summary');
    if (!summary) return;

    const subtotal = cartItems.reduce(
      (s, i) => s + (i.total || i.price * i.quantity),
      0
    );
    const shipping = subtotal > 0 ? (subtotal >= 50 ? 0 : 5.99) : 0;
    const total = subtotal + shipping;

    summary.innerHTML = `
      <div class="summary-row">
        <span>Subtotal (${getCartCount()} items)</span>
        <span>${formatPrice(subtotal)}</span>
      </div>
      <div class="summary-row">
        <span>Shipping</span>
        <span>${shipping === 0 ? '<span class="free-shipping">FREE</span>' : formatPrice(shipping)}</span>
      </div>
      <div class="summary-divider"></div>
      <div class="summary-row summary-total">
        <span>Total</span>
        <span>${formatPrice(total)}</span>
      </div>
      <a href="/checkout" class="btn btn-primary btn-checkout ${cartItems.length === 0 ? 'btn-disabled' : ''}">
        Proceed to Checkout
      </a>
      <a href="/" class="btn btn-ghost btn-continue">Continue Shopping</a>
    `;
  }

  /* ──────────────── Init ──────────────── */

  function init() {
    loadCart().then(() => {
      if (document.getElementById('cart-items-container')) {
        renderCartPage();
        renderCartSummary();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return {
    loadCart,
    addToCart,
    updateQuantity,
    removeItem,
    getCartCount,
    renderCartPage,
    renderCartSummary,
    formatPrice,
    showToast,
  };
})();

/* ──────────────── Global Bindings ──────────────── */
window.CartManager = CartManager;

function addToCart(productId, qty) {
  return CartManager.addToCart(productId, qty || 1);
}

function removeFromCart(itemId) {
  return CartManager.removeItem(itemId);
}

function updateQuantity(itemId, qty) {
  return CartManager.updateQuantity(itemId, qty);
}

window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.updateQuantity = updateQuantity;
