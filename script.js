/* ============================================================
   Forex Master Pro EA — site scripts (v4.0)
   ============================================================ */

const MQL5_BASE = 'https://www.mql5.com/en/market/product/184184';

function mql5Url(plan) {
  const params = new URLSearchParams({
    utm_source: 'agentosacademy',
    utm_medium: 'website',
    utm_campaign: 'forex_master_pro_launch',
    utm_content: plan || 'general'
  });
  return `${MQL5_BASE}?${params}`;
}

document.querySelectorAll('.buy-btn').forEach(btn => {
  const plan = btn.dataset.plan || 'general';
  btn.href = mql5Url(plan);
  btn.target = '_blank';
  btn.rel = 'noopener';
});

document.querySelectorAll('.price').forEach(price => {
  price.classList.add('price-link');
  price.setAttribute('role', 'link');
  price.setAttribute('title', 'Buy on MQL5');
  price.addEventListener('click', () => {
    window.open(mql5Url('price-click'), '_blank', 'noopener');
  });
});

/* ---------- Floating particle background ---------- */
(function initParticles() {
  const canvas = document.getElementById('particle-canvas');
  if (!canvas) return;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return;

  const ctx = canvas.getContext('2d');
  let particles = [];
  let animId;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function createParticles() {
    const count = Math.min(Math.floor(window.innerWidth / 18), 80);
    particles = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.8 + 0.4,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      alpha: Math.random() * 0.5 + 0.1,
      gold: Math.random() > 0.6
    }));
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0) p.x = canvas.width;
      if (p.x > canvas.width) p.x = 0;
      if (p.y < 0) p.y = canvas.height;
      if (p.y > canvas.height) p.y = 0;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.gold
        ? `rgba(212, 168, 67, ${p.alpha})`
        : `rgba(16, 185, 129, ${p.alpha * 0.7})`;
      ctx.fill();
    });

    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(212, 168, 67, ${0.06 * (1 - dist / 120)})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }

    animId = requestAnimationFrame(draw);
  }

  resize();
  createParticles();
  draw();

  window.addEventListener('resize', () => {
    resize();
    createParticles();
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancelAnimationFrame(animId);
    } else {
      draw();
    }
  });
})();

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
