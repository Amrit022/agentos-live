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
  document.body.classList.toggle('menu-open', open);
}

menuBtn.addEventListener('click', () => {
  setMenu(!navMenu.classList.contains('open'));
});

navMenu.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => setMenu(false));
});

window.addEventListener('resize', () => {
  if (window.innerWidth > 960 && navMenu.classList.contains('open')) {
    setMenu(false);
  }
}, { passive: true });

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

/* ---------- Live forex ticker ---------- */
(function initLiveTicker() {
  const track = document.getElementById('ticker-track');
  if (!track) return;

  const STATIC_ITEMS = [
    'Version 3.1 Live',
    '5 Activations Included',
    'Min. Balance $100'
  ];

  function formatPrice(symbol, price) {
    if (price == null || Number.isNaN(price)) return '—';
    return symbol === 'XAUUSD' ? price.toFixed(2) : price.toFixed(5);
  }

  function formatChange(pct) {
    if (pct == null || Number.isNaN(pct)) return { text: '—', cls: 'flat' };
    const sign = pct > 0 ? '+' : '';
    const cls = pct > 0 ? 'up' : pct < 0 ? 'down' : 'flat';
    return { text: `${sign}${pct.toFixed(2)}%`, cls };
  }

  function buildQuoteSpan(q) {
    const span = document.createElement('span');
    if (!q.price) {
      span.textContent = `${q.symbol} — unavailable`;
      return span;
    }
    const ch = formatChange(q.change_pct);
    span.innerHTML =
      `${q.symbol}<span class="ticker-price">${formatPrice(q.symbol, q.price)}</span>` +
      `<em class="${ch.cls}">${ch.text}</em>`;
    return span;
  }

  function buildStaticSpan(text) {
    const span = document.createElement('span');
    span.textContent = text;
    return span;
  }

  function renderTicker(quotes) {
    const items = [];
    quotes.forEach(q => items.push(buildQuoteSpan(q)));
    STATIC_ITEMS.forEach(t => items.push(buildStaticSpan(t)));

    track.innerHTML = '';
    const doubled = [...items, ...items];
    doubled.forEach(node => track.appendChild(node.cloneNode(true)));
  }

  async function loadQuotes() {
    try {
      const res = await fetch('/api/quotes');
      if (!res.ok) throw new Error('quotes unavailable');
      const data = await res.json();
      if (!data.quotes?.length) throw new Error('empty quotes');
      renderTicker(data.quotes);
    } catch {
      track.innerHTML = '<span class="ticker-status">Live prices temporarily unavailable</span>';
    }
  }

  loadQuotes();
  setInterval(loadQuotes, 60000);
})();

/* ---------- Live news panel ---------- */
(function initLiveNews() {
  const toggleBtn = document.getElementById('news-toggle');
  const closeBtn = document.getElementById('news-close');
  const navLink = document.getElementById('nav-news-link');
  const panel = document.getElementById('news-panel');
  const list = document.getElementById('news-list');
  if (!toggleBtn || !panel || !list) return;

  let loaded = false;

  function setOpen(open) {
    panel.hidden = !open;
    toggleBtn.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('news-open', open);
    if (open && !loaded) loadNews();
  }

  async function loadNews() {
    try {
      const res = await fetch('/api/news');
      if (!res.ok) throw new Error('news unavailable');
      const data = await res.json();
      const items = data.items || [];
      if (!items.length) {
        list.innerHTML = '<li class="news-empty">No headlines available right now.</li>';
        return;
      }
      list.innerHTML = items.map(item => {
        const title = item.url
          ? `<a href="${item.url}" target="_blank" rel="noopener noreferrer">${item.title}</a>`
          : item.title;
        const time = item.published
          ? `<span class="news-time">${item.published}</span>`
          : '';
        return `<li>${title}${time}</li>`;
      }).join('');
      loaded = true;
    } catch {
      list.innerHTML = '<li class="news-empty">Could not load news. Try again in a moment.</li>';
    }
  }

  toggleBtn.addEventListener('click', () => setOpen(panel.hidden));
  closeBtn?.addEventListener('click', () => setOpen(false));
  navLink?.addEventListener('click', e => {
    e.preventDefault();
    setMenu(false);
    setOpen(true);
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !panel.hidden) setOpen(false);
  });

  setInterval(() => {
    if (loaded) {
      loaded = false;
      if (!panel.hidden) loadNews();
    }
  }, 300000);
})();
