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

/* ---------- Live forex ticker (static-site friendly) ---------- */
(function initLiveTicker() {
  const track = document.getElementById('ticker-track');
  if (!track) return;

  const PAIRS = [
    { symbol: 'EURUSD', base: 'eur', quote: 'usd' },
    { symbol: 'GBPUSD', base: 'gbp', quote: 'usd' },
    { symbol: 'USDJPY', base: 'usd', quote: 'jpy' },
    { symbol: 'AUDUSD', base: 'aud', quote: 'usd' },
    { symbol: 'USDCAD', base: 'usd', quote: 'cad' },
    { symbol: 'USDCHF', base: 'usd', quote: 'chf' },
    { symbol: 'NZDUSD', base: 'nzd', quote: 'usd' },
    { symbol: 'EURGBP', base: 'eur', quote: 'gbp' },
    { symbol: 'EURJPY', base: 'eur', quote: 'jpy' },
    { symbol: 'GBPJPY', base: 'gbp', quote: 'jpy' },
    { symbol: 'XAUUSD', base: 'xau', quote: 'usd', metal: true }
  ];

  const RATE_URLS = [
    'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json',
    'https://latest.currency-api.pages.dev/v1/currencies/usd.json'
  ];

  function ymd(d) {
    return d.toISOString().slice(0, 10);
  }

  function formatPrice(symbol, price) {
    if (price == null || Number.isNaN(price)) return '—';
    if (symbol === 'XAUUSD') return price.toFixed(2);
    if (symbol.endsWith('JPY')) return price.toFixed(3);
    return price.toFixed(5);
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
      span.textContent = `${q.symbol} —`;
      return span;
    }
    const ch = formatChange(q.change_pct);
    span.innerHTML =
      `${q.symbol}<span class="ticker-price">${formatPrice(q.symbol, q.price)}</span>` +
      `<em class="${ch.cls}">${ch.text}</em>`;
    return span;
  }

  function renderTicker(quotes) {
    const items = quotes.map(q => buildQuoteSpan(q));
    track.innerHTML = '';
    const doubled = [...items, ...items];
    doubled.forEach(node => track.appendChild(node.cloneNode(true)));
  }

  async function fetchJson(url, ms) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), ms || 10000);
    try {
      const res = await fetch(url, { signal: ctrl.signal, cache: 'no-store' });
      if (!res.ok) throw new Error('bad status');
      return await res.json();
    } finally {
      clearTimeout(t);
    }
  }

  async function loadUsdRates() {
    let lastErr;
    for (const url of RATE_URLS) {
      try {
        const data = await fetchJson(url, 9000);
        if (data && data.usd) return data.usd;
      } catch (e) {
        lastErr = e;
      }
    }
    throw lastErr || new Error('rates unavailable');
  }

  async function loadPrevUsdRates() {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - 1);
    const day = ymd(d);
    const urls = [
      `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@${day}/v1/currencies/usd.json`,
      `https://${day}.currency-api.pages.dev/v1/currencies/usd.json`
    ];
    for (const url of urls) {
      try {
        const data = await fetchJson(url, 7000);
        if (data && data.usd) return data.usd;
      } catch (_) { /* try next */ }
    }
    return null;
  }

  function pairPrice(usdMap, pair) {
    if (!usdMap) return null;
    if (pair.metal) {
      const xau = Number(usdMap.xau);
      return xau > 0 ? 1 / xau : null;
    }
    if (pair.base === 'usd') {
      const q = Number(usdMap[pair.quote]);
      return q > 0 ? q : null;
    }
    if (pair.quote === 'usd') {
      const b = Number(usdMap[pair.base]);
      return b > 0 ? 1 / b : null;
    }
    const b = Number(usdMap[pair.base]);
    const q = Number(usdMap[pair.quote]);
    if (b > 0 && q > 0) return q / b;
    return null;
  }

  async function loadQuotes() {
    try {
      const [usd, prev] = await Promise.all([loadUsdRates(), loadPrevUsdRates()]);
      const quotes = PAIRS.map(pair => {
        const price = pairPrice(usd, pair);
        const prevPrice = pairPrice(prev, pair);
        let change_pct = null;
        if (price != null && prevPrice != null && prevPrice !== 0) {
          change_pct = ((price - prevPrice) / prevPrice) * 100;
        }
        return { symbol: pair.symbol, price, change_pct };
      });
      if (!quotes.some(q => q.price != null)) throw new Error('empty');
      renderTicker(quotes);
    } catch {
      track.innerHTML = '<span class="ticker-status">Live prices temporarily unavailable</span>';
    }
  }

  loadQuotes();
  setInterval(loadQuotes, 120000);
})();

/* ---------- Live news panel (static-site friendly) ---------- */
(function initLiveNews() {
  const toggleBtn = document.getElementById('news-toggle');
  const closeBtn = document.getElementById('news-close');
  const navLink = document.getElementById('nav-news-link');
  const panel = document.getElementById('news-panel');
  const list = document.getElementById('news-list');
  if (!toggleBtn || !panel || !list) return;

  let loaded = false;

  const FEEDS = [
    'https://www.forexlive.com/feed/news',
    'https://feeds.finance.yahoo.com/rss/2.0/headline?s=EURUSD=X&region=US&lang=en-US',
    'https://www.fxstreet.com/rss/news'
  ];

  function setOpen(open) {
    panel.hidden = !open;
    toggleBtn.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('news-open', open);
    if (open && !loaded) loadNews();
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  async function fetchFeed(rssUrl) {
    const endpoint =
      'https://api.rss2json.com/v1/api.json?rss_url=' + encodeURIComponent(rssUrl);
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 10000);
    try {
      const res = await fetch(endpoint, { signal: ctrl.signal, cache: 'no-store' });
      if (!res.ok) throw new Error('feed fail');
      const data = await res.json();
      if (data.status !== 'ok' || !Array.isArray(data.items)) return [];
      return data.items.map(item => ({
        title: item.title,
        url: item.link || item.url || '',
        published: item.pubDate || ''
      }));
    } finally {
      clearTimeout(t);
    }
  }

  async function loadNews() {
    list.innerHTML = '<li class="news-loading">Loading headlines…</li>';
    try {
      const seen = new Set();
      const items = [];
      // Sequential fetch — rss2json rate-limits parallel requests
      for (const feed of FEEDS) {
        const batch = await fetchFeed(feed).catch(() => []);
        for (const item of batch) {
          const key = (item.title || '').trim().toLowerCase();
          if (!key || seen.has(key)) continue;
          seen.add(key);
          items.push(item);
        }
        if (items.length >= 12) break;
      }
      if (!items.length) {
        list.innerHTML = '<li class="news-empty">No headlines available right now. Please try again in a minute.</li>';
        return;
      }
      list.innerHTML = items.slice(0, 18).map(item => {
        const title = item.url
          ? `<a href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(item.title)}</a>`
          : escapeHtml(item.title);
        const time = item.published
          ? `<span class="news-time">${escapeHtml(item.published)}</span>`
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
    if (typeof setMenu === 'function') setMenu(false);
    setOpen(true);
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !panel.hidden) setOpen(false);
  });

  // Prefetch headlines so the panel opens with content ready
  setTimeout(() => {
    if (!loaded) loadNews();
  }, 1500);

  setInterval(() => {
    loaded = false;
    if (!panel.hidden) loadNews();
    else loadNews();
  }, 300000);
})();

/* ============================================================
   REVIEWS CAROUSEL NAVIGATION
   ============================================================ */
(function() {
  const carousel = document.getElementById('reviews-carousel');
  const prevBtn = document.getElementById('reviews-prev');
  const nextBtn = document.getElementById('reviews-next');
  if (!carousel || !prevBtn || !nextBtn) return;

  const scrollAmount = 370 * 3; // 3 cards at a time

  nextBtn.addEventListener('click', () => {
    carousel.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  });

  prevBtn.addEventListener('click', () => {
    carousel.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
  });

  // Auto-scroll every 5 seconds
  let autoScroll = setInterval(() => {
    if (carousel.scrollLeft + carousel.clientWidth >= carousel.scrollWidth - 50) {
      carousel.scrollTo({ left: 0, behavior: 'smooth' });
    } else {
      carousel.scrollBy({ left: 370, behavior: 'smooth' });
    }
  }, 5000);

  // Pause auto-scroll on hover
  carousel.addEventListener('mouseenter', () => clearInterval(autoScroll));
  carousel.addEventListener('mouseleave', () => {
    autoScroll = setInterval(() => {
      if (carousel.scrollLeft + carousel.clientWidth >= carousel.scrollWidth - 50) {
        carousel.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        carousel.scrollBy({ left: 370, behavior: 'smooth' });
      }
    }, 5000);
  });
})();
