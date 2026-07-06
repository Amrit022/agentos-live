/* ============================================================
   Forex Master Pro EA — site scripts (v3.0)
   ============================================================ */

/* ------------------------------------------------------------
   CHECKOUT — all Buy buttons send customers to the official
   MQL5 product page where the purchase is handled securely.
   Update MQL5_URL if your product listing ever changes.
   ------------------------------------------------------------ */
const MQL5_URL = 'https://www.mql5.com/en/market/product/122176';

document.querySelectorAll('.buy-btn').forEach(btn => {
  btn.href = MQL5_URL;
  btn.target = '_blank';
  btn.rel = 'noopener';
});

/* ---------- Sticky header ---------- */
const header = document.getElementById('site-header');

function onScroll() {
  header.classList.toggle('scrolled', window.scrollY > 24);
}
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

/* ---------- Mobile menu ---------- */
const menuBtn = document.getElementById('mobile-menu-btn');
const navMenu = document.getElementById('nav-menu');
const iconOpen = document.getElementById('menu-icon-open');
const iconClose = document.getElementById('menu-icon-close');

function setMenu(open) {
  navMenu.classList.toggle('open', open);
  menuBtn.setAttribute('aria-expanded', String(open));
  iconOpen.style.display = open ? 'none' : '';
  iconClose.style.display = open ? '' : 'none';
  document.body.style.overflow = open ? 'hidden' : '';
}

menuBtn.addEventListener('click', () => {
  setMenu(!navMenu.classList.contains('open'));
});

navMenu.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => setMenu(false));
});

/* ---------- Scroll reveal ---------- */
const revealEls = document.querySelectorAll('.reveal');

if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  revealEls.forEach(el => observer.observe(el));
} else {
  revealEls.forEach(el => el.classList.add('visible'));
}

/* ---------- Animated stat counters ---------- */
function animateCounter(el) {
  const target = parseFloat(el.dataset.target);
  const decimals = parseInt(el.dataset.decimals || '0', 10);
  const suffix = el.dataset.suffix || '';
  const duration = 1400;
  const start = performance.now();

  function frame(now) {
    const t = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - t, 3);
    el.textContent = (target * eased).toFixed(decimals) + suffix;
    if (t < 1) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

const counters = document.querySelectorAll('.counter');
if ('IntersectionObserver' in window) {
  const counterObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        counterObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });
  counters.forEach(el => counterObserver.observe(el));
} else {
  counters.forEach(el => {
    el.textContent = el.dataset.target + (el.dataset.suffix || '');
  });
}

/* ---------- Growth calculator ---------- */
const capitalInput = document.getElementById('capital-input');
const durationSlider = document.getElementById('duration-slider');
const durationVal = document.getElementById('duration-val');
const projectionVal = document.getElementById('projection-val');
const totalProfit = document.getElementById('total-profit');
const totalGrowth = document.getElementById('total-growth');
const profileBtns = document.querySelectorAll('.profile-btn');

let monthlyRate = 4.2;

function fmt(n) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function updateCalc() {
  const capital = parseFloat(capitalInput.value) || 0;
  const months = parseInt(durationSlider.value, 10);
  durationVal.textContent = months;

  const projected = capital * Math.pow(1 + monthlyRate / 100, months);
  const profit = projected - capital;
  const growthPct = capital > 0 ? (profit / capital) * 100 : 0;

  projectionVal.textContent = '$' + fmt(projected);
  totalProfit.textContent = '+$' + fmt(profit);
  totalGrowth.textContent = '+' + growthPct.toFixed(1) + '%';
}

capitalInput.addEventListener('input', updateCalc);
durationSlider.addEventListener('input', updateCalc);

profileBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    profileBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    monthlyRate = parseFloat(btn.dataset.rate);
    updateCalc();
  });
});

updateCalc();
