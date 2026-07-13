/* PayPal checkout UI (static site) — Smart Buttons via Live Client ID */
(function () {
  'use strict';

  function cfg() {
    return window.FMP_PAYPAL || {};
  }

  function hasLinks(c) {
    const L = c.links || {};
    return !!(L.buy || L.rent1m || L.rent3m);
  }

  function hasSdk(c) {
    return !!(c.enabled && c.clientId && String(c.clientId).trim());
  }

  function mountStrip() {
    const c = cfg();
    if (!c.enabled || (!hasLinks(c) && !hasSdk(c))) return;

    const pricing = document.getElementById('pricing');
    if (!pricing || document.getElementById('fmp-paypal')) return;
    const note = pricing.querySelector('.pricing-note');
    const wrap = document.createElement('div');
    wrap.className = 'paypal-alt reveal visible';
    wrap.id = 'fmp-paypal';

    let buttons = '';
    const L = c.links || {};
    if (L.buy) {
      buttons += `<a class="paypal-btn" href="${L.buy}" target="_blank" rel="noopener">PayPal — Buy $149</a>`;
    }
    if (L.rent1m) {
      buttons += `<a class="paypal-btn" href="${L.rent1m}" target="_blank" rel="noopener">PayPal — Rent $30</a>`;
    }
    if (L.rent3m) {
      buttons += `<a class="paypal-btn" href="${L.rent3m}" target="_blank" rel="noopener">PayPal — Rent $75</a>`;
    }

    const sdkHost = !buttons
      ? `<div class="paypal-sdk-grid" id="paypal-sdk-buttons">
          <div class="paypal-sdk-plan"><span>Full Purchase — $149</span><div data-plan="buy" class="paypal-sdk-slot"></div></div>
          <div class="paypal-sdk-plan"><span>1 Month Rent — $30</span><div data-plan="rent1m" class="paypal-sdk-slot"></div></div>
          <div class="paypal-sdk-plan"><span>3 Month Rent — $75</span><div data-plan="rent3m" class="paypal-sdk-slot"></div></div>
        </div>`
      : `<div class="paypal-btns">${buttons}</div>`;

    wrap.innerHTML = `
      <div class="paypal-alt-inner">
        <h3>Pay with PayPal</h3>
        <p>Use PayPal below as an alternate checkout. MQL5 is still fastest for instant MT5 license delivery. After paying here, send your receipt + MT5 account number on Telegram.</p>
        ${sdkHost}
        <p class="paypal-hint">${c.supportNote || ''}</p>
        <p class="paypal-hint" id="paypal-status" hidden></p>
      </div>`;

    if (note && note.parentNode) {
      note.parentNode.insertBefore(wrap, note);
    } else {
      pricing.querySelector('.container')?.appendChild(wrap);
    }

    if (!buttons && hasSdk(c)) loadSdk(c);
  }

  function setStatus(msg, isError) {
    const el = document.getElementById('paypal-status');
    if (!el) return;
    el.hidden = !msg;
    el.textContent = msg || '';
    el.style.color = isError ? '#f87171' : '';
  }

  function loadSdk(c) {
    if (window.paypal && typeof window.paypal.Buttons === 'function') {
      renderSdkButtons(c);
      return;
    }
    // Avoid clobber: never use id="paypal" (browsers expose it as window.paypal)
    const existing = document.querySelector('script[data-fmp-paypal-sdk]');
    if (existing) {
      existing.addEventListener('load', () => renderSdkButtons(c));
      return;
    }
    const s = document.createElement('script');
    s.src =
      'https://www.paypal.com/sdk/js?client-id=' +
      encodeURIComponent(c.clientId) +
      '&currency=' +
      encodeURIComponent(c.currency || 'USD') +
      '&intent=capture&components=buttons';
    s.async = true;
    s.dataset.fmpPaypalSdk = '1';
    s.onload = () => renderSdkButtons(c);
    s.onerror = () => setStatus('PayPal could not load. Please refresh or buy via MQL5.', true);
    document.head.appendChild(s);
  }

  function renderSdkButtons(c) {
    const host = document.getElementById('paypal-sdk-buttons');
    if (!host || !window.paypal || typeof window.paypal.Buttons !== 'function') {
      setStatus('PayPal SDK unavailable. Please use MQL5 checkout.', true);
      return;
    }

    const plans = [
      { key: 'buy', label: 'Full Purchase $149' },
      { key: 'rent1m', label: '1 Month Rent $30' },
      { key: 'rent3m', label: '3 Month Rent $75' }
    ];

    plans.forEach(p => {
      const box = host.querySelector('[data-plan="' + p.key + '"]') || (() => {
        const d = document.createElement('div');
        d.className = 'paypal-sdk-slot';
        host.appendChild(d);
        return d;
      })();

      window.paypal
        .Buttons({
          style: { layout: 'vertical', color: 'gold', shape: 'rect', label: 'paypal', height: 42 },
          createOrder: (_, actions) =>
            actions.order.create({
              purchase_units: [
                {
                  description: 'Forex Master Pro EA — ' + p.label,
                  custom_id: 'fmp-' + p.key,
                  amount: {
                    currency_code: c.currency || 'USD',
                    value: (c.amounts && c.amounts[p.key]) || '149.00'
                  }
                }
              ],
              application_context: {
                shipping_preference: 'NO_SHIPPING',
                user_action: 'PAY_NOW',
                brand_name: 'Forex Master Pro'
              }
            }),
          onApprove: async (_, actions) => {
            try {
              const details = await actions.order.capture();
              const id = details.id || details.purchase_units?.[0]?.payments?.captures?.[0]?.id || 'OK';
              setStatus('Payment received: ' + id + '. Message Telegram @ForexMasterProEA with this ID + your MT5 account number.', false);
              alert(
                'PayPal payment received (' +
                  id +
                  ').\n\nNext step: message Telegram @ForexMasterProEA with this receipt ID and your MT5 account number for license delivery.'
              );
            } catch (err) {
              setStatus('Payment capture failed. Check PayPal activity or contact support.', true);
            }
          },
          onError: () => setStatus('PayPal error. Try again or buy on MQL5.', true),
          onCancel: () => setStatus('Payment cancelled.', false)
        })
        .render(box)
        .catch(() => setStatus('Could not render PayPal buttons. Account may need Live eligibility review.', true));
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountStrip);
  } else {
    mountStrip();
  }
})();
