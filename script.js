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
 
  const profiles = {
    conservative: 4.2,
    moderate: 8.5,
    aggressive: 14.5
  };

  function formatCurrency(value) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(value);
  }

  function calculateProjections() {
    if(!capitalInput || !durationSlider || !monthlyRateInput || !projectionVal) return;
    let principal = parseFloat(capitalInput.value);
    if (isNaN(principal) || principal <= 0) {
      principal = 1000;
    }

    const months = parseInt(durationSlider.value);
    const monthlyRate = parseFloat(monthlyRateInput.value) / 100;

    const finalBalance = principal * Math.pow(1 + monthlyRate, months);
    const totalProfit = finalBalance - principal;
    const percentageGrowth = ((finalBalance - principal) / principal) * 100;

    projectionVal.textContent = formatCurrency(finalBalance);
    totalReturnVal.textContent = formatCurrency(totalProfit);
    percentageGrowthVal.textContent = percentageGrowth.toFixed(0) + '%';
  }

  if (capitalInput) {
    capitalInput.addEventListener('input', () => {
      if (capitalInput.value < 0) capitalInput.value = 0;
      calculateProjections();
    });
  }

  if (durationSlider) {
    durationSlider.addEventListener('input', () => {
      durationVal.textContent = durationSlider.value;
      calculateProjections();
    });
  }

  if (monthlyRateInput) {
    monthlyRateInput.addEventListener('input', () => {
      monthlyRateVal.textContent = monthlyRateInput.value + '%';
      profileBtns.forEach(btn => btn.classList.remove('active'));
      calculateProjections();
    });
  }

  profileBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      profileBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const profileType = btn.dataset.profile;
      const targetRate = profiles[profileType];
      
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
      faqItems.forEach(i => i.classList.remove('active'));
      if (!isActive) {
        item.classList.add('active');
      }
    });
  });

  // Initialize
  calculateProjections();
});

// --- MOBILE MENU ---
function toggleMobileMenu() {
  const navMenu = document.getElementById('nav-menu');
  const btn = document.getElementById('mobile-menu-btn');
  if(navMenu && btn) {
    navMenu.classList.toggle('open');
    const icon = btn.querySelector('i');
    if(navMenu.classList.contains('open')) {
      icon.classList.replace('fa-bars', 'fa-xmark');
    } else {
      icon.classList.replace('fa-xmark', 'fa-bars');
    }
  }
}

// --- TOPIC MODALS ---
function openTopicModal(modalId) {
  closeAllTopicModals();
  const modal = document.getElementById(modalId);
  const overlay = document.getElementById('topic-overlay');
  
  if (modal && overlay) {
    // Clone FAQ accordion items into FAQ modal if empty
    if (modalId === 'modal-faq') {
      const faqContainer = document.getElementById('modal-faq-accordion-container');
      if (faqContainer && faqContainer.children.length === 0) {
        const originalFaqs = document.querySelectorAll('#faq .faq-item');
        originalFaqs.forEach(item => {
          const clone = item.cloneNode(true);
          clone.addEventListener('click', () => {
            clone.classList.toggle('active');
          });
          faqContainer.appendChild(clone);
        });
      }
    }
    
    // Clone Pricing cards into Pricing modal if empty
    if (modalId === 'modal-pricing') {
      const pricingContainer = document.getElementById('modal-pricing-grid-container');
      if (pricingContainer && pricingContainer.children.length === 0) {
        const originalPricing = document.querySelector('#pricing .pricing-grid');
        if (originalPricing) {
          const cloneGrid = originalPricing.cloneNode(true);
          pricingContainer.appendChild(cloneGrid);
        }
      }
    }
    
    modal.classList.add('open');
    overlay.classList.add('open');
  }
}

function closeAllTopicModals() {
  document.querySelectorAll('.topic-modal').forEach(m => m.classList.remove('open'));
  const overlay = document.getElementById('topic-overlay');
  if(overlay) overlay.classList.remove('open');
}

// --- INLINE ORDER SUMMARY & CHECKOUT SYSTEM ---
const planDetails = {
  starter: {
    name: "Starter License (1 Month)",
    price: 49.00,
    features: [
      "1 Active MT5 Live Account",
      "Unlimited Demo Accounts",
      "Full EA Technical Features",
      "Standard Discord Support"
    ]
  },
  pro: {
    name: "Pro License (1 Year)",
    price: 149.00,
    features: [
      "3 Active MT5 Live Accounts",
      "Unlimited Demo Accounts",
      "Full EA Technical Features",
      "Priority Developer Support",
      "1 Year Free Upgrades"
    ]
  },
  lifetime: {
    name: "Lifetime License (Unlimited)",
    price: 299.00,
    features: [
      "Unlimited Live MT5 Accounts",
      "Unlimited Demo Accounts",
      "Full EA Technical Features",
      "1-on-1 Setup Assistance",
      "Lifetime Free Upgrades"
    ]
  }
};

let currentOrder = {
  planId: 'pro',
  qty: 1,
  paymentMethod: 'card'
};

function addToOrder(planId) {
  currentOrder.planId = planId;
  currentOrder.qty = 1;
  
  // Show checkout section
  const checkoutSection = document.getElementById('inline-checkout-section');
  if(checkoutSection) {
    checkoutSection.style.display = 'block';
  }
  
  updateOrderUI();
  
  // Scroll smoothly to order form
  document.getElementById('inline-checkout-section').scrollIntoView({ behavior: 'smooth' });
}

function adjustQty(amount) {
  currentOrder.qty += amount;
  if(currentOrder.qty < 1) currentOrder.qty = 1;
  updateOrderUI();
}

function removeOrder() {
  const checkoutSection = document.getElementById('inline-checkout-section');
  if(checkoutSection) {
    checkoutSection.style.display = 'none';
  }
}

function toggleDetails() {
  const details = document.getElementById('summary-details-content');
  if(details) {
    if(details.style.display === 'none') {
      details.style.display = 'block';
    } else {
      details.style.display = 'none';
    }
  }
}

function updateOrderUI() {
  const plan = planDetails[currentOrder.planId];
  
  document.getElementById('summary-item-name').textContent = plan.name;
  document.getElementById('summary-item-qty').textContent = currentOrder.qty;
  
  const unitPrice = plan.price * currentOrder.qty;
  document.getElementById('summary-unit-price').textContent = '$' + unitPrice.toFixed(2);
  document.getElementById('inline-total-display').textContent = '$' + unitPrice.toFixed(2);
  
  // Render features list
  const listContainer = document.getElementById('summary-detail-list');
  if(listContainer) {
    listContainer.innerHTML = '';
    plan.features.forEach(feat => {
      const li = document.createElement('li');
      li.innerHTML = `<i class="fa-solid fa-circle-check" style="color: var(--accent-color); margin-right: 0.5rem;"></i> ` + feat;
      listContainer.appendChild(li);
    });
  }
}

function setInlinePayment(method) {
  currentOrder.paymentMethod = method;
  
  const btnCard = document.getElementById('btn-tab-card');
  const btnPaypal = document.getElementById('btn-tab-paypal');
  const cardBox = document.getElementById('inline-card-fields-box');
  const paypalBox = document.getElementById('inline-paypal-fields-box');
  
  const cardNum = document.getElementById('inline-card-number');
  const cardExp = document.getElementById('inline-card-expiry');
  const cardCvc = document.getElementById('inline-card-cvc');
  
  if(method === 'card') {
    btnCard.classList.add('active');
    btnPaypal.classList.remove('active');
    cardBox.style.display = 'block';
    paypalBox.style.display = 'none';
    
    if(cardNum) cardNum.required = true;
    if(cardExp) cardExp.required = true;
    if(cardCvc) cardCvc.required = true;
  } else {
    btnPaypal.classList.add('active');
    btnCard.classList.remove('active');
    cardBox.style.display = 'none';
    paypalBox.style.display = 'block';
    
    if(cardNum) cardNum.required = false;
    if(cardExp) cardExp.required = false;
    if(cardCvc) cardCvc.required = false;
  }
}

function submitInlineCheckout(e) {
  e.preventDefault();
  
  const mt5Account = document.getElementById('inline-cust-mt5').value;
  if(!mt5Account) return;
  
  const baseVal = parseInt(mt5Account) * 31;
  const p1 = (baseVal % 10000).toString().padStart(4, '7');
  const p2 = (Math.floor(baseVal / 3) % 10000).toString().padStart(4, '3');
  const p3 = (Math.floor(baseVal / 7) % 10000).toString().padStart(4, '9');
  const licenseKey = `FMP-${p1}-${p2}-${p3}`;
  
  // Hide form, show success
  document.getElementById('inline-payment-form').style.display = 'none';
  document.getElementById('inline-success-box').style.display = 'block';
  
  document.getElementById('inline-lic-key').textContent = licenseKey;
  document.getElementById('inline-lic-account').textContent = mt5Account;
}

function submitInlinePayPal() {
  const name = document.getElementById('inline-cust-name');
  const email = document.getElementById('inline-cust-email');
  const mt5 = document.getElementById('inline-cust-mt5');
  
  if(!name.checkValidity() || !email.checkValidity() || !mt5.checkValidity()) {
    document.getElementById('inline-payment-form').reportValidity();
    return;
  }
  
  const btn = document.getElementById('inline-paypal-button');
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Authorizing...';
  
  setTimeout(() => {
    // Submit form
    document.getElementById('inline-payment-form').dispatchEvent(new Event('submit'));
    btn.innerHTML = '<i class="fa-brands fa-paypal"></i> Pay with PayPal';
  }, 1500);
}
