/* Forex Master Pro — FAQ Chatbot (client-side, ~1000 Q&As, lazy-loaded) */
(function () {
  'use strict';

  const KB_URL = 'chatbot-kb.json';
  const STOP = new Set([
    'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'been', 'do', 'does',
    'did', 'to', 'of', 'in', 'on', 'for', 'with', 'and', 'or', 'what', 'how', 'can',
    'i', 'you', 'my', 'me', 'it', 'this', 'that', 'about', 'please', 'tell', 'help'
  ]);

  const SUGGESTIONS = [
    'How much does it cost?',
    'Free demo?',
    'How do I install?',
    'Does it trade gold?',
    'Buy vs rent?',
    'PayPal?'
  ];

  let kb = null;
  let index = null;
  let loading = null;
  let open = false;

  function tokenize(text) {
    return String(text || '')
      .toLowerCase()
      .replace(/[^a-z0-9$%/.\s-]/g, ' ')
      .split(/[\s/_-]+/)
      .filter(t => t.length > 1 && !STOP.has(t));
  }

  function buildIndex(items) {
    const inv = Object.create(null);
    for (let i = 0; i < items.length; i++) {
      const toks = new Set(tokenize(items[i].q + ' ' + (items[i].t || '')));
      toks.forEach(t => {
        if (!inv[t]) inv[t] = [];
        inv[t].push(i);
      });
    }
    return inv;
  }

  function scoreItem(item, tokens, query) {
    const qLow = item.q.toLowerCase();
    const ql = query.toLowerCase();
    let score = 0;
    if (qLow === ql) return 1000;
    if (qLow.includes(ql) && ql.length > 3) score += 80;
    for (const t of tokens) {
      if (qLow.includes(t)) score += 12;
      if ((item.t || '').includes(t)) score += 6;
    }
    // Prefer shorter, more direct questions when scores tie-ish
    score += Math.max(0, 20 - item.q.length / 10);
    return score;
  }

  function search(query, limit) {
    if (!kb || !index) return [];
    const q = query.trim();
    if (!q) return [];
    const tokens = tokenize(q);
    const cand = new Set();
    if (!tokens.length) {
      // fallback: scan first 200 for substring
      for (let i = 0; i < Math.min(200, kb.items.length); i++) {
        if (kb.items[i].q.toLowerCase().includes(q.toLowerCase())) cand.add(i);
      }
    } else {
      tokens.forEach(t => {
        const list = index[t];
        if (list) list.forEach(i => cand.add(i));
      });
    }
    const scored = [];
    cand.forEach(i => {
      const item = kb.items[i];
      const s = scoreItem(item, tokens, q);
      if (s > 0) scored.push({ item, s });
    });
    scored.sort((a, b) => b.s - a.s || a.item.q.length - b.item.q.length);
    // Dedupe by answer topic
    const seenT = new Set();
    const out = [];
    for (const row of scored) {
      const t = row.item.t || row.item.a.slice(0, 40);
      if (seenT.has(t) && out.length >= 1) continue;
      seenT.add(t);
      out.push(row.item);
      if (out.length >= (limit || 3)) break;
    }
    return out;
  }

  async function ensureKb() {
    if (kb) return kb;
    if (loading) return loading;
    loading = fetch(KB_URL, { cache: 'force-cache' })
      .then(r => {
        if (!r.ok) throw new Error('KB load failed');
        return r.json();
      })
      .then(data => {
        kb = data;
        index = buildIndex(data.items || []);
        return kb;
      })
      .catch(err => {
        loading = null;
        throw err;
      });
    return loading;
  }

  function el(tag, cls, html) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  function linkify(text) {
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');
  }

  function mount() {
    const root = el('div', 'fmp-chat');
    root.innerHTML = `
      <button type="button" class="fmp-chat-launcher" aria-label="Open help chat" aria-expanded="false">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true">
          <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"/>
        </svg>
        <span class="fmp-chat-launcher-label">Help</span>
        <span class="fmp-chat-pulse" aria-hidden="true"></span>
      </button>
      <div class="fmp-chat-panel" hidden role="dialog" aria-label="Forex Master Pro help chat">
        <header class="fmp-chat-head">
          <div>
            <strong>Forex Master Pro Help</strong>
            <span>Instant answers from 1,000 FAQs</span>
          </div>
          <button type="button" class="fmp-chat-close" aria-label="Close chat">&times;</button>
        </header>
        <div class="fmp-chat-msgs" id="fmp-chat-msgs"></div>
        <div class="fmp-chat-chips" id="fmp-chat-chips"></div>
        <form class="fmp-chat-form" id="fmp-chat-form" autocomplete="off">
          <input type="search" id="fmp-chat-input" placeholder="Ask about price, setup, gold, VPS…" maxlength="200" enterkeyhint="send" aria-label="Ask a question">
          <button type="submit" aria-label="Send">Ask</button>
        </form>
      </div>`;
    document.body.appendChild(root);

    const launcher = root.querySelector('.fmp-chat-launcher');
    const panel = root.querySelector('.fmp-chat-panel');
    const closeBtn = root.querySelector('.fmp-chat-close');
    const msgs = root.querySelector('#fmp-chat-msgs');
    const chips = root.querySelector('#fmp-chat-chips');
    const form = root.querySelector('#fmp-chat-form');
    const input = root.querySelector('#fmp-chat-input');

    SUGGESTIONS.forEach(s => {
      const b = el('button', 'fmp-chip');
      b.type = 'button';
      b.textContent = s;
      b.addEventListener('click', () => {
        input.value = s;
        ask(s);
      });
      chips.appendChild(b);
    });

    function addMsg(role, html) {
      const m = el('div', 'fmp-msg fmp-msg-' + role, html);
      msgs.appendChild(m);
      msgs.scrollTop = msgs.scrollHeight;
      return m;
    }

    function setOpen(v) {
      open = v;
      panel.hidden = !v;
      launcher.setAttribute('aria-expanded', String(v));
      root.classList.toggle('is-open', v);
      if (v) {
        ensureKb().catch(() => {});
        input.focus();
        if (!msgs.childElementCount) {
          addMsg(
            'bot',
            'Hi — ask anything about Forex Master Pro EA (pricing, install, pairs, Gold mode, VPS, MQL5, PayPal). Tap a suggestion or type your question.'
          );
        }
      }
    }

    async function ask(raw) {
      const q = (raw || '').trim();
      if (!q) return;
      addMsg('user', linkify(q));
      const thinking = addMsg('bot', '<em>Searching FAQs…</em>');
      try {
        await ensureKb();
        const hits = search(q, 3);
        if (!hits.length) {
          thinking.innerHTML =
            'I could not find a close match. Try: pricing, install, gold, VPS, demo, or activations. Or open the <a href="#faq">FAQ</a>, <a href="setup-guide.html">Setup Guide</a>, or Telegram <a href="https://t.me/ForexMasterProEA" target="_blank" rel="noopener">@ForexMasterProEA</a>.';
          return;
        }
        const best = hits[0];
        let html = '<p>' + linkify(best.a) + '</p>';
        if (hits.length > 1) {
          html += '<div class="fmp-related"><span>Related:</span>';
          hits.slice(1).forEach(h => {
            html +=
              '<button type="button" class="fmp-related-q" data-q="' +
              h.q.replace(/"/g, '&quot;') +
              '">' +
              linkify(h.q) +
              '</button>';
          });
          html += '</div>';
        }
        thinking.innerHTML = html;
        thinking.querySelectorAll('.fmp-related-q').forEach(btn => {
          btn.addEventListener('click', () => ask(btn.getAttribute('data-q')));
        });
      } catch {
        thinking.innerHTML =
          'Help data could not load. Check your connection, or browse the <a href="#faq">FAQ</a> and <a href="setup-guide.html">Setup Guide</a>.';
      }
      input.value = '';
    }

    launcher.addEventListener('click', () => setOpen(!open));
    closeBtn.addEventListener('click', () => setOpen(false));
    form.addEventListener('submit', e => {
      e.preventDefault();
      ask(input.value);
    });

    // Prefetch KB idle after first interaction with page
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        ensureKb().catch(() => {});
      }, { timeout: 4000 });
    } else {
      setTimeout(() => ensureKb().catch(() => {}), 3500);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})();
