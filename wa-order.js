/*
 * WhatsApp ordering
 * Intercepts every "Order Now" / "Buy Now" button, builds an order message from the
 * product the customer is looking at, and opens WhatsApp with that message pre-filled.
 */
(function () {
  'use strict';

  var CONFIG = {
    phone: '919912310963',
    currency: '$',
    maxQty: 20,
    // Size options shown in the review step. "extra" is added to the unit price.
    sizes: [
      { label: 'Regular', extra: 0 },
      { label: 'Large', extra: 2 }
    ]
  };

  var BUTTON_RE = /\b(order now|buy now)\b/i;
  var NAME_KEY = 'orderCustomerName';

  function store(get, key, val) {
    try {
      if (get) return window.localStorage.getItem(key) || '';
      window.localStorage.setItem(key, val);
    } catch (e) {}
    return '';
  }

  function clean(t) {
    return (t || '').replace(/\s+/g, ' ').trim();
  }

  function money(n) {
    return CONFIG.currency + n.toFixed(2);
  }

  function parsePrice(text) {
    var m = /\$\s*(\d+(?:[.,]\d{1,2})?)/.exec(text || '');
    return m ? parseFloat(m[1].replace(',', '.')) : null;
  }

  function slugFromHref(href) {
    var m = /\/menu\/([^/?#]+)/.exec(href || '');
    return m ? m[1] : null;
  }

  function titleFromSlug(slug) {
    return slug.split('-').map(function (w) {
      return w.charAt(0).toUpperCase() + w.slice(1);
    }).join(' ');
  }

  // First element whose own text is just a price, e.g. "$11.95 USD".
  function findPrice(root) {
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    var node;
    while ((node = walker.nextNode())) {
      var t = clean(node.nodeValue);
      if (/^\$\s*\d+(?:[.,]\d{1,2})?(\s*USD)?$/i.test(t)) return parsePrice(t);
    }
    return null;
  }

  function productFromPage() {
    if (!slugFromHref(location.pathname)) return null;
    var main = document.getElementById('main') || document.body;
    var h1 = main.querySelector('h1');
    var name = h1 ? clean(h1.textContent) : titleFromSlug(slugFromHref(location.pathname));
    var price = findPrice(main);
    if (!name || price === null) return null;
    return { name: name, price: price };
  }

  // A button inside a product card (home / menu listings).
  function productFromCard(btn) {
    var el = btn.parentElement;
    for (var i = 0; el && i < 10; i++, el = el.parentElement) {
      var links = el.querySelectorAll('a[href*="menu/"]');
      var slug = null;
      for (var j = 0; j < links.length; j++) {
        var s = slugFromHref(links[j].getAttribute('href'));
        if (s) { slug = s; break; }
      }
      if (!slug) continue;
      var price = findPrice(el);
      if (price === null) continue;
      var heading = el.querySelector('h1,h2,h3,h4,h5');
      var name = heading ? clean(heading.textContent) : titleFromSlug(slug);
      return { name: name, price: price };
    }
    return null;
  }

  function buildMessage(order) {
    var lines = [
      'Hello! I would like to place an order.',
      '',
      '*Order details*',
      '• Product: ' + order.name,
      '• Price: ' + money(order.unitPrice) + ' each',
      '• Quantity: ' + order.qty
    ];
    if (order.size) lines.push('• Size: ' + order.size);
    if (order.notes) lines.push('• Special instructions: ' + order.notes);
    lines.push('• *Total: ' + money(order.unitPrice * order.qty) + '*');
    if (order.customer) {
      lines.push('', '*Customer name:* ' + order.customer);
    }
    lines.push('', 'Please confirm my order. Thank you!');
    return lines.join('\n');
  }

  function openWhatsApp(text) {
    var url = 'https://wa.me/' + CONFIG.phone + '?text=' + encodeURIComponent(text);
    var w = window.open(url, '_blank', 'noopener');
    if (!w) window.location.href = url;
  }

  /* ---------- review dialog ---------- */

  var CSS = [
    ':host{all:initial}',
    '*{box-sizing:border-box;font-family:"Bricolage Grotesque",system-ui,sans-serif}',
    '.ov{position:fixed;inset:0;background:rgba(18,58,20,.55);display:flex;align-items:center;justify-content:center;padding:16px;z-index:2147483647}',
    '.box{background:#dff782;color:#123a14;border:1.5px solid #123a14;border-radius:20px;width:100%;max-width:440px;max-height:calc(100vh - 32px);overflow:auto;padding:24px;box-shadow:0 20px 60px rgba(0,0,0,.25)}',
    '.hd{display:flex;justify-content:space-between;align-items:flex-start;gap:12px}',
    'h2{margin:0;font-size:26px;line-height:1.1;font-weight:700}',
    '.x{background:none;border:1.5px solid #123a14;border-radius:50%;width:34px;height:34px;font-size:18px;line-height:1;cursor:pointer;color:#123a14;flex:none}',
    '.sub{margin:6px 0 18px;font-size:14px;opacity:.8}',
    '.card{background:#f6ffc9;border:1.5px solid #123a14;border-radius:14px;padding:14px 16px;margin-bottom:14px}',
    '.pn{font-size:18px;font-weight:600}',
    '.pp{font-size:14px;opacity:.8;margin-top:2px}',
    'label{display:block;font-size:13px;font-weight:600;margin:14px 0 6px}',
    '.row{display:flex;gap:8px;flex-wrap:wrap}',
    '.chip{border:1.5px solid #123a14;background:transparent;color:#123a14;border-radius:999px;padding:8px 16px;font-size:14px;cursor:pointer}',
    '.chip[aria-pressed=true]{background:#123a14;color:#dff782}',
    '.qty{display:inline-flex;align-items:center;border:1.5px solid #123a14;border-radius:999px;overflow:hidden}',
    '.qty button{background:none;border:0;width:40px;height:38px;font-size:20px;cursor:pointer;color:#123a14}',
    '.qty span{min-width:36px;text-align:center;font-weight:600}',
    'input,textarea{width:100%;border:1.5px solid #123a14;border-radius:12px;background:#f6ffc9;color:#123a14;padding:10px 12px;font-size:15px;outline:none}',
    'textarea{resize:vertical;min-height:60px}',
    '.tot{display:flex;justify-content:space-between;align-items:center;margin:18px 0 14px;font-size:16px}',
    '.tot b{font-size:26px}',
    '.go{width:100%;border:0;border-radius:12px;background:#ff6a2c;color:#fff;font-size:17px;font-weight:700;padding:14px;cursor:pointer}',
    '.go:hover{filter:brightness(1.05)}',
    '.fine{font-size:12px;opacity:.7;margin:10px 0 0;text-align:center}'
  ].join('');

  function openDialog(product) {
    var existing = document.getElementById('wa-order-host');
    if (existing) existing.remove();

    var host = document.createElement('div');
    host.id = 'wa-order-host';
    var root = host.attachShadow({ mode: 'open' });
    var state = { qty: 1, size: CONFIG.sizes[0], notes: '', customer: store(true, NAME_KEY) };

    root.innerHTML =
      '<style>' + CSS + '</style>' +
      '<div class="ov" role="dialog" aria-modal="true" aria-label="Review your order">' +
        '<div class="box">' +
          '<div class="hd"><h2>Review your order</h2><button class="x" type="button" aria-label="Close">×</button></div>' +
          '<p class="sub">Check the details, then continue to WhatsApp. Your message is filled in, you only need to press send.</p>' +
          '<div class="card"><div class="pn"></div><div class="pp"></div></div>' +
          '<label>Size</label><div class="row sizes"></div>' +
          '<label>Quantity</label>' +
          '<div class="qty"><button type="button" data-d="-1" aria-label="Decrease quantity">−</button><span class="q">1</span><button type="button" data-d="1" aria-label="Increase quantity">+</button></div>' +
          '<label for="cn">Your name</label><input id="cn" type="text" placeholder="Optional" autocomplete="name">' +
          '<label for="nt">Special instructions</label><textarea id="nt" placeholder="Optional, e.g. no croutons"></textarea>' +
          '<div class="tot"><span>Total</span><b></b></div>' +
          '<button class="go" type="button">Order on WhatsApp</button>' +
          '<p class="fine">You will be redirected to WhatsApp to send this order.</p>' +
        '</div>' +
      '</div>';

    var q = function (s) { return root.querySelector(s); };
    q('.pn').textContent = product.name;
    q('#cn').value = state.customer;

    function unit() { return product.price + state.size.extra; }

    function render() {
      q('.pp').textContent = money(unit()) + ' each';
      q('.q').textContent = state.qty;
      q('.tot b').textContent = money(unit() * state.qty);
      q('.sizes').querySelectorAll('.chip').forEach(function (c, i) {
        c.setAttribute('aria-pressed', CONFIG.sizes[i] === state.size ? 'true' : 'false');
      });
    }

    CONFIG.sizes.forEach(function (s) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'chip';
      b.textContent = s.label + (s.extra ? ' (+' + money(s.extra) + ')' : '');
      b.addEventListener('click', function () { state.size = s; render(); });
      q('.sizes').appendChild(b);
    });

    root.querySelectorAll('.qty button').forEach(function (b) {
      b.addEventListener('click', function () {
        var n = state.qty + parseInt(b.getAttribute('data-d'), 10);
        state.qty = Math.min(CONFIG.maxQty, Math.max(1, n));
        render();
      });
    });

    function close() {
      document.removeEventListener('keydown', onKey, true);
      host.remove();
    }
    function onKey(e) { if (e.key === 'Escape') close(); }
    document.addEventListener('keydown', onKey, true);

    q('.x').addEventListener('click', close);
    q('.ov').addEventListener('mousedown', function (e) { if (e.target === q('.ov')) close(); });

    q('.go').addEventListener('click', function () {
      var customer = clean(q('#cn').value);
      store(false, NAME_KEY, customer);
      openWhatsApp(buildMessage({
        name: product.name,
        unitPrice: unit(),
        qty: state.qty,
        size: CONFIG.sizes.length > 1 ? state.size.label : '',
        notes: clean(q('#nt').value),
        customer: customer
      }));
      close();
    });

    render();
    document.body.appendChild(host);
    q('.go').focus();
  }

  /* ---------- click interception ---------- */

  function findButton(target) {
    var el = target && target.closest ? target.closest('a,button,[role="button"]') : null;
    if (!el) return null;
    var text = clean(el.textContent);
    return text.length <= 30 && BUTTON_RE.test(text) ? el : null;
  }

  document.addEventListener('click', function (e) {
    var btn = findButton(e.target);
    if (!btn) return;
    e.preventDefault();
    e.stopImmediatePropagation();

    var product = productFromPage() || productFromCard(btn);
    if (product) {
      openDialog(product);
    } else {
      openWhatsApp('Hello! I would like to place an order. Could you please share today\'s menu and availability?');
    }
  }, true);
})();
