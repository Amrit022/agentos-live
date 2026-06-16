/* ============================================================
   NEXORA — Product Viewer
   3D tilt cards · floating images · scroll reveal
   ============================================================ */

const ProductViewer = (function () {
  'use strict';

  /* ──────────────── Card Tilt Effect ──────────────── */

  function initTiltCards() {
    const cards = document.querySelectorAll('.tilt-card');
    cards.forEach((card) => {
      // Skip already-initialised cards
      if (card.dataset.tiltInit) return;
      card.dataset.tiltInit = 'true';

      card.addEventListener('mousemove', handleTiltMove);
      card.addEventListener('mouseleave', handleTiltLeave);
      card.addEventListener('mouseenter', handleTiltEnter);
    });
  }

  function handleTiltEnter(e) {
    const card = e.currentTarget;
    card.style.transition = 'transform 0.1s ease-out';
  }

  function handleTiltMove(e) {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const mouseX = e.clientX - centerX;
    const mouseY = e.clientY - centerY;

    // Max tilt of ±12 degrees
    const rotateY = (mouseX / (rect.width / 2)) * 12;
    const rotateX = -(mouseY / (rect.height / 2)) * 12;

    card.style.transform =
      `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;

    // Inner elements get depth push
    const inners = card.querySelectorAll('.tilt-inner');
    inners.forEach((inner) => {
      inner.style.transform = 'translateZ(30px)';
    });
  }

  function handleTiltLeave(e) {
    const card = e.currentTarget;
    card.style.transition = 'transform 0.5s ease-out';
    card.style.transform =
      'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';

    const inners = card.querySelectorAll('.tilt-inner');
    inners.forEach((inner) => {
      inner.style.transition = 'transform 0.5s ease-out';
      inner.style.transform = 'translateZ(0px)';
    });
  }

  /* ──────────────── Float Image Animation ──────────────── */

  let floatRafId = null;
  const floatElements = [];

  function initFloatImages() {
    const images = document.querySelectorAll('.float-image');
    images.forEach((img) => {
      if (img.dataset.floatInit) return;
      img.dataset.floatInit = 'true';

      floatElements.push({
        el: img,
        phase: Math.random() * Math.PI * 2,
        amplitude: 6 + Math.random() * 6, // 6-12 px
        speed: 0.8 + Math.random() * 0.6,
      });

      // Hover rotation
      img.addEventListener('mouseenter', () => {
        img.style.transition = 'transform 0.3s ease-out';
        img.style.transform += ' rotate(3deg) scale(1.05)';
      });
      img.addEventListener('mouseleave', () => {
        img.style.transition = 'transform 0.3s ease-out';
      });
    });

    // Start animation loop if not running
    if (floatElements.length > 0 && !floatRafId) {
      animateFloats();
    }
  }

  function animateFloats() {
    const time = Date.now() / 1000;
    floatElements.forEach((item) => {
      const y = Math.sin(time * item.speed + item.phase) * item.amplitude;
      item.el.style.transform = `translateY(${y}px)`;
    });
    floatRafId = requestAnimationFrame(animateFloats);
  }

  /* ──────────────── Scroll Reveal ──────────────── */

  let observer = null;

  function initScrollReveal() {
    if (observer) observer.disconnect();

    const elements = document.querySelectorAll('.reveal-on-scroll');
    if (elements.length === 0) return;

    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );

    elements.forEach((el) => {
      if (!el.classList.contains('revealed')) {
        observer.observe(el);
      }
    });
  }

  /* ──────────────── Public API ──────────────── */

  function init() {
    initTiltCards();
    initFloatImages();
    initScrollReveal();
  }

  function reinit() {
    // Re-scan DOM for new dynamic elements
    initTiltCards();
    initFloatImages();
    initScrollReveal();
  }

  // Auto-init on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return { init, reinit };
})();

// Expose globally
window.ProductViewer = ProductViewer;
