
document.addEventListener('DOMContentLoaded', () => {
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
    
    modal.style.display = 'block';
    overlay.style.display = 'block';
    setTimeout(() => {
      modal.classList.add('open');
      overlay.classList.add('open');
    }, 10);
  }
}

function closeAllTopicModals() {
  document.querySelectorAll('.topic-modal').forEach(m => {
    m.classList.remove('open');
    m.style.display = 'none';
  });
  const overlay = document.getElementById('topic-overlay');
  if(overlay) {
    overlay.classList.remove('open');
    overlay.style.display = 'none';
  }
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
  const form = document.getElementById('inline-payment-form');
  if(!form) return;
  
  if(!form.checkValidity()) {
    form.reportValidity();
    return;
  }
  
  const btn = document.getElementById('inline-paypal-button');
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Initializing...';
  
  setTimeout(() => {
    btn.innerHTML = '<i class="fa-brands fa-paypal"></i> Pay with PayPal';
    
    // Set total in PayPal modal
    const total = document.getElementById('inline-total-display').textContent;
    const ppTotal = document.getElementById('pp-modal-total');
    if(ppTotal) ppTotal.textContent = total;
    
    // Show PayPal Modal
    closeAllTopicModals();
    const ppModal = document.getElementById('modal-paypal-gateway');
    const overlay = document.getElementById('topic-overlay');
    if(ppModal && overlay) {
      document.getElementById('paypal-login-screen').style.display = 'block';
      document.getElementById('paypal-pay-screen').style.display = 'none';
      
      // Clear inputs
      document.getElementById('pp-email').value = '';
      document.getElementById('pp-password').value = '';
      
      ppModal.style.display = 'block';
      overlay.style.display = 'block';
      setTimeout(() => {
        ppModal.classList.add('open');
        overlay.classList.add('open');
      }, 10);
    }
  }, 1000);
}

function closePayPalGateway() {
  const ppModal = document.getElementById('modal-paypal-gateway');
  const overlay = document.getElementById('topic-overlay');
  if(ppModal && overlay) {
    ppModal.classList.remove('open');
    ppModal.style.display = 'none';
    overlay.classList.remove('open');
    overlay.style.display = 'none';
  }
}

function submitPayPalLogin() {
  const email = document.getElementById('pp-email').value;
  const pwd = document.getElementById('pp-password').value;
  
  if(!email || !pwd) {
    alert("Please enter your PayPal credentials.");
    return;
  }
  
  const loginBtn = document.querySelector('#paypal-login-screen button');
  loginBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Logging in...';
  loginBtn.disabled = true;
  
  setTimeout(() => {
    loginBtn.innerHTML = 'Log In';
    loginBtn.disabled = false;
    // Transition to pay screen
    document.getElementById('paypal-login-screen').style.display = 'none';
    document.getElementById('paypal-pay-screen').style.display = 'block';
  }, 1500);
}

function completePayPalPayment() {
  const payBtn = document.querySelector('#paypal-pay-screen button');
  payBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing payment...';
  payBtn.disabled = true;
  
  setTimeout(() => {
    payBtn.innerHTML = 'Complete Purchase';
    payBtn.disabled = false;
    closePayPalGateway();
    
    // Submit checkout form and generate license key
    const mockEvent = { preventDefault: () => {} };
    submitInlineCheckout(mockEvent);
  }, 2000);
}

// --- MODAL CALCULATOR LOGIC ---
const mCapitalInput = document.getElementById('modal-capital-input');
const mDurationSlider = document.getElementById('modal-duration-slider');
const mDurationVal = document.getElementById('modal-duration-val');
const mProjectionVal = document.getElementById('modal-projection-val');
const mTotalProfit = document.getElementById('modal-total-profit');
const mTotalGrowth = document.getElementById('modal-total-growth');

const mProfCons = document.getElementById('m-prof-cons');
const mProfMod = document.getElementById('m-prof-mod');
const mProfAgg = document.getElementById('m-prof-agg');

let modalMonthlyRate = 4.2;

function updateModalCalc() {
  if (!mCapitalInput || !mDurationSlider || !mProjectionVal) return;
  
  const capital = parseFloat(mCapitalInput.value) || 0;
  const duration = parseInt(mDurationSlider.value);
  if (mDurationVal) mDurationVal.textContent = duration;
  
  const rateDec = modalMonthlyRate / 100;
  const projected = capital * Math.pow(1 + rateDec, duration);
  const profit = projected - capital;
  const growthPct = capital > 0 ? (profit / capital) * 100 : 0;
  
  mProjectionVal.textContent = '$' + projected.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (mTotalProfit) mTotalProfit.textContent = '+$' + profit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (mTotalGrowth) mTotalGrowth.textContent = '+' + growthPct.toFixed(1) + '%';
}

if (mCapitalInput) {
  mCapitalInput.addEventListener('input', updateModalCalc);
  mCapitalInput.addEventListener('keyup', updateModalCalc);
  mCapitalInput.addEventListener('change', updateModalCalc);
}
if (mDurationSlider) {
  mDurationSlider.addEventListener('input', updateModalCalc);
}

if (mProfCons) {
  mProfCons.addEventListener('click', () => {
    setModalProfile(mProfCons, 4.2);
  });
}
if (mProfMod) {
  mProfMod.addEventListener('click', () => {
    setModalProfile(mProfMod, 8.5);
  });
}
if (mProfAgg) {
  mProfAgg.addEventListener('click', () => {
    setModalProfile(mProfAgg, 14.5);
  });
}

function setModalProfile(btn, rate) {
  if (mProfCons) mProfCons.classList.remove('active');
  if (mProfMod) mProfMod.classList.remove('active');
  if (mProfAgg) mProfAgg.classList.remove('active');
  btn.classList.add('active');
  modalMonthlyRate = rate;
  updateModalCalc();
}

// Initial calculation run
updateModalCalc();

// --- DYNAMIC LAUNCH DISCOUNT TIMER ---
function updateLaunchTimer() {
  const now = new Date();
  
  // Set target to end of today (midnight)
  const target = new Date();
  target.setHours(23, 59, 59, 999);
  
  const diff = target - now;
  if (diff <= 0) {
    document.getElementById('timer-hours').textContent = "00";
    document.getElementById('timer-mins').textContent = "00";
    document.getElementById('timer-secs').textContent = "00";
    return;
  }
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const secs = Math.floor((diff % (1000 * 60)) / 1000);
  
  const hEl = document.getElementById('timer-hours');
  const mEl = document.getElementById('timer-mins');
  const sEl = document.getElementById('timer-secs');
  
  if (hEl && mEl && sEl) {
    hEl.textContent = hours.toString().padStart(2, '0');
    mEl.textContent = mins.toString().padStart(2, '0');
    sEl.textContent = secs.toString().padStart(2, '0');
  }
}

setInterval(updateLaunchTimer, 1000);
updateLaunchTimer();
  
