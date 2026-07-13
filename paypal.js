/* PayPal alternate checkout UI (static site) — loads only when configured */
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
    return !!(c.clientId && String(c.clientId).trim());
  }

  function mountStrip() {
    const c = cfg();
    if (!c.enabled || (!hasLinks(c) && !hasSdk(c))) return;

    const pricing = document.getElementById('pricing');
    if (!pricing) return;
    const note = pricing.querySelector('.pricing-note');
    const wrap = document.createElement('div');
    wrap.className = 'paypal-alt reveal';
    wrap.id = 'paypal';

    let buttons = '';
    const L = c.links || {};
    if (L.buy) {
      buttons += `<a class="paypal-btn" href="${L.buy}" target="_blank" rel="noopener" data-plan="paypal-buy">PayPal — Buy $149</a>`;
    }
    if (L.rent1m) {
      buttons += `<a class="paypal-btn" href="${L.rent1m}" target="_blank" rel="noopener" data-plan="paypal-rent1m">PayPal — Rent $30</a>`;
    }
    if (L.rent3m) {
      buttons += `<a class="paypal-btn" href="${L.rent3m}" target="_blank" rel="noopener" data-plan="paypal-rent3m">PayPal — Rent $75</a>`;
    }

    wrap.innerHTML = `
      <div class="paypal-alt-inner">
        <h3>Prefer PayPal?</h3>
        <p>MQL5 remains the fastest path (instant license). PayPal is an alternate checkout — fulfillment is manual after payment.</p>
        <div class="paypal-btns">${buttons || '<div id="paypal-sdk-buttons"></div>'}</div>
        <p class="paypal-hint">${c.supportNote || ''}</p>
      </div>`;

    if (note && note.parentNode) {
      note.parentNode.insertBefore(wrap, note);
    } else {
      pricing.querySelector('.container')?.appendChild(wrap);
    }

    if (!buttons && hasSdk(c)) {
      loadSdk(c);
    }
  }

  function loadSdk(c) {
    const s = document.createElement('script');
    s.src =
      'https://www.paypal.com/sdk/js?client-id=' +
      encodeURIComponent(c.clientId) +
      '&currency=' +
      encodeURIComponent(c.currency || 'USD') +
      '&components=buttons';
    s.async = true;
    s.onload = () => renderSdkButtons(c);
    document.head.appendChild(s);
  }

  function renderSdkButtons(c) {
    const host = document.getElementById('paypal-sdk-buttons');
    if (!host || !window.paypal) return;
    const plans = [
      { key: 'buy', label: 'Buy $149' },
      { key: 'rent1m', label: 'Rent $30' },
      { key: 'rent3m', label: 'Rent $75' }
    ];
    plans.forEach(p => {
      const box = document.createElement('div');
      box.className = 'paypal-sdk-slot';
      host.appendChild(box);
      window.paypal
        .Buttons({
          style: { layout: 'vertical', color: 'gold', shape: 'rect', label: 'paypal' },
          createOrder: (_, actions) =>
            actions.order.create({
              purchase_units: [
                {
                  description: 'Forex Master Pro EA — ' + p.label,
                  amount: {
                    currency_code: c.currency || 'USD',
                    value: (c.amounts && c.amounts[p.key]) || '149.00'
                  }
                }
              ]
            }),
          onApprove: async (_, actions) => {
            const details = await actions.order.capture();
            alert(
              'Payment received (' +
                (details.id || 'OK') +
                '). Please message Telegram @ForexMasterProEA with this receipt ID and your MT5 account number for license delivery.'
            );
          }
        })
        .render(box);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountStrip);
  } else {
    mountStrip();
  }
})();
