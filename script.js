document.addEventListener('DOMContentLoaded', () => {
  // --- Calculator Logic ---
  const capitalInput = document.getElementById('capital-input');
  const durationSlider = document.getElementById('duration-slider');
  const durationVal = document.getElementById('duration-val');
  const monthlyRateInput = document.getElementById('monthly-rate');
  const monthlyRateVal = document.getElementById('rate-val');
  
  const projectionVal = document.getElementById('projection-val');
  const totalReturnVal = document.getElementById('total-return');
  const percentageGrowthVal = document.getElementById('percentage-growth');
  
  const profileBtns = document.querySelectorAll('.profile-btn');

  // Predefined profiles (conservative, moderate, aggressive)
  const profiles = {
    conservative: 4.2,  // 4.2% monthly average (approx 64% annual compounded)
    moderate: 8.5,      // 8.5% monthly average (approx 166% annual compounded)
    aggressive: 14.5    // 14.5% monthly average (approx 407% annual compounded)
  };

  function formatCurrency(value) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(value);
  }

  function calculateProjections() {
    let principal = parseFloat(capitalInput.value);
    if (isNaN(principal) || principal <= 0) {
      principal = 1000; // Fallback
    }

    const months = parseInt(durationSlider.value);
    const monthlyRate = parseFloat(monthlyRateInput.value) / 100;

    // Compound Interest Formula: A = P(1 + r)^t
    const finalBalance = principal * Math.pow(1 + monthlyRate, months);
    const totalProfit = finalBalance - principal;
    const percentageGrowth = ((finalBalance - principal) / principal) * 100;

    // Animate/Update values
    projectionVal.textContent = formatCurrency(finalBalance);
    totalReturnVal.textContent = formatCurrency(totalProfit);
    percentageGrowthVal.textContent = percentageGrowth.toFixed(0) + '%';
  }

  // Event Listeners for inputs
  capitalInput.addEventListener('input', () => {
    // Sanitize input
    if (capitalInput.value < 0) capitalInput.value = 0;
    calculateProjections();
  });

  durationSlider.addEventListener('input', () => {
    durationVal.textContent = durationSlider.value;
    calculateProjections();
  });

  monthlyRateInput.addEventListener('input', () => {
    monthlyRateVal.textContent = monthlyRateInput.value + '%';
    
    // Deactivate profiles if user manually overrides the rate
    profileBtns.forEach(btn => btn.classList.remove('active'));
    
    calculateProjections();
  });

  // Profile Button selection
  profileBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // Remove active class from all
      profileBtns.forEach(b => b.classList.remove('active'));
      
      // Add active to current
      btn.classList.add('active');
      
      const profileType = btn.dataset.profile;
      const targetRate = profiles[profileType];
      
      // Set monthly rate slider and text
      monthlyRateInput.value = targetRate;
      monthlyRateVal.textContent = targetRate + '%';
      
      calculateProjections();
    });
  });

  // --- FAQ Accordion Logic ---
  const faqItems = document.querySelectorAll('.faq-item');
  
  faqItems.forEach(item => {
    item.addEventListener('click', () => {
      const isActive = item.classList.contains('active');
      
      // Close all first
      faqItems.forEach(i => i.classList.remove('active'));
      
      // Toggle current
      if (!isActive) {
        item.classList.add('active');
      }
    });
  });

  // --- Initialize calculator default state ---
  calculateProjections();
});

  // --- STORE & CART FUNCTIONALITY ---
  let cart = JSON.parse(localStorage.getItem('fmp_cart')) || [];
  
  const cartFloat = document.getElementById('cart-float');
  const cartDrawer = document.getElementById('cart-drawer');
  const cartOverlay = document.getElementById('cart-overlay');
  const closeCartBtn = document.getElementById('close-cart-btn');
  const cartBadgeCount = document.getElementById('cart-badge-count');
  const cartItemsContainer = document.getElementById('cart-items-container');
  const cartTotalPrice = document.getElementById('cart-total-price');
  const drawerCheckoutBtn = document.getElementById('drawer-checkout-btn');
  
  const checkoutModal = document.getElementById('checkout-modal');
  const modalOverlay = document.getElementById('modal-overlay');
  const closeCheckoutBtn = document.getElementById('close-checkout-btn');
  const cancelCheckoutBtn = document.getElementById('cancel-checkout-btn');
  const checkoutForm = document.getElementById('checkout-form');
  
  const confirmationModal = document.getElementById('confirmation-modal');
  const confirmLicenseKey = document.getElementById('confirm-license-key');
  const confirmMT5Account = document.getElementById('confirm-mt5-account');
  const confirmCloseBtn = document.getElementById('confirm-close-btn');

  // Load cart state on startup
  updateCartUI();

  // Floating Cart Click -> Toggle Drawer
  cartFloat.addEventListener('click', toggleCartDrawer);
  closeCartBtn.addEventListener('click', toggleCartDrawer);
  cartOverlay.addEventListener('click', toggleCartDrawer);
  
  function toggleCartDrawer() {
    cartDrawer.classList.toggle('open');
    cartOverlay.classList.toggle('open');
  }

  // Add to Cart Button Click
  const addToCartBtns = document.querySelectorAll('.add-to-cart-btn');
  addToCartBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const name = btn.dataset.name;
      const price = parseFloat(btn.dataset.price);
      
      // Check if product is already in cart
      const existingProduct = cart.find(item => item.id === id);
      if (!existingProduct) {
        cart.push({ id, name, price });
        localStorage.setItem('fmp_cart', JSON.stringify(cart));
        updateCartUI();
        
        // Open the drawer automatically to show added item
        cartDrawer.classList.add('open');
        cartOverlay.classList.add('open');
      } else {
        alert("This license is already in your cart!");
      }
    });
  });

  // Remove Item from Cart
  cartItemsContainer.addEventListener('click', (e) => {
    if (e.target.classList.contains('remove-item-btn') || e.target.parentElement.classList.contains('remove-item-btn')) {
      const btn = e.target.classList.contains('remove-item-btn') ? e.target : e.target.parentElement;
      const id = btn.dataset.id;
      
      cart = cart.filter(item => item.id !== id);
      localStorage.setItem('fmp_cart', JSON.stringify(cart));
      updateCartUI();
    }
  });

  function updateCartUI() {
    // Update Badge
    cartBadgeCount.textContent = cart.length;
    
    // Clear items container
    cartItemsContainer.innerHTML = '';
    
    if (cart.length === 0) {
      cartItemsContainer.innerHTML = '<div class="empty-cart-msg">Your cart is empty.</div>';
      cartTotalPrice.textContent = '$0.00';
      drawerCheckoutBtn.disabled = true;
    } else {
      let total = 0;
      cart.forEach(item => {
        total += item.price;
        const itemHtml = `
          <div class="cart-item">
            <div class="cart-item-details">
              <h4>${item.name}</h4>
              <p>$${item.price.toFixed(2)}</p>
            </div>
            <button class="remove-item-btn" data-id="${item.id}">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        `;
        cartItemsContainer.insertAdjacentHTML('beforeend', itemHtml);
      });
      
      cartTotalPrice.textContent = '$' + total.toFixed(2);
      drawerCheckoutBtn.disabled = false;
    }
  }

  // Drawer Checkout Button Click -> Open Modal
  drawerCheckoutBtn.addEventListener('click', () => {
    // Close Drawer
    toggleCartDrawer();
    
    // Open Modal
    checkoutModal.classList.add('open');
    modalOverlay.classList.add('open');
  });

  // Modal Closures
  closeCheckoutBtn.addEventListener('click', closeCheckout);
  cancelCheckoutBtn.addEventListener('click', closeCheckout);
  modalOverlay.addEventListener('click', closeCheckout);
  
  function closeCheckout() {
    checkoutModal.classList.remove('open');
    modalOverlay.classList.remove('open');
  }

  // Form Submit -> Generate License Key & Show Confirmation
  checkoutForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const custName = document.getElementById('cust-name').value;
    const custEmail = document.getElementById('cust-email').value;
    const mt5Account = document.getElementById('cust-mt5-account').value;
    
    // Simple hash licensing generator based on account number
    const generatedKey = generateLicenseHash(mt5Account);
    
    // Close checkout
    closeCheckout();
    
    // Clear Cart
    cart = [];
    localStorage.removeItem('fmp_cart');
    updateCartUI();
    
    // Open Confirmation Modal
    confirmLicenseKey.textContent = generatedKey;
    confirmMT5Account.textContent = mt5Account;
    
    confirmationModal.classList.add('open');
    modalOverlay.classList.add('open');
  });

  confirmCloseBtn.addEventListener('click', () => {
    confirmationModal.classList.remove('open');
    modalOverlay.classList.remove('open');
  });

  function generateLicenseHash(accountNumber) {
    // Dynamic mock key generation formula
    const baseVal = parseInt(accountNumber) * 31;
    const p1 = (baseVal % 10000).toString().padStart(4, '7');
    const p2 = (Math.floor(baseVal / 3) % 10000).toString().padStart(4, '3');
    const p3 = (Math.floor(baseVal / 7) % 10000).toString().padStart(4, '9');
    
    return `FMP-${p1}-${p2}-${p3}`;
  }
