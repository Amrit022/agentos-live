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
