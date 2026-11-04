/*
 * Navigation extras
 *  - "Order From ..." buttons take the visitor to the products (menu) page.
 *  - An admin dashboard icon is added to the top nav bar, next to the Order Now button.
 */
(function () {
  'use strict';

  var MENU_URL = '/menu';
  var ADMIN_URL = '/admin';
  var ORDER_FROM_RE = /^order from\b/i;
  var LINK_CLASS = 'demo-admin-link';

  function clean(t) {
    return (t || '').replace(/\s+/g, ' ').trim();
  }

  /* ---------- "Order From ..." goes to the products page ---------- */

  function findOrderFrom(target) {
    var el = target && target.closest ? target.closest('a,button,[role="button"]') : null;
    return el && ORDER_FROM_RE.test(clean(el.textContent)) ? el : null;
  }

  function stop(e) {
    e.preventDefault();
    e.stopImmediatePropagation();
  }

  // On iPhones the site runs link actions when the finger lifts (a "tap"), before any click
  // event, so we act on pointerup and then swallow the click that follows.
  var lastTap = 0;
  var OPTS = { capture: true, passive: false };

  document.addEventListener('pointerup', function (e) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if (!findOrderFrom(e.target)) return;
    stop(e);
    lastTap = Date.now();
    window.location.href = MENU_URL;
  }, OPTS);

  document.addEventListener('touchend', function (e) {
    if (findOrderFrom(e.target)) e.preventDefault();
  }, OPTS);

  ['mousedown', 'mouseup', 'click'].forEach(function (type) {
    document.addEventListener(type, function (e) {
      if (Date.now() - lastTap < 800) { stop(e); return; }
      if (type !== 'click' || !findOrderFrom(e.target)) return;
      stop(e);
      window.location.href = MENU_URL;
    }, OPTS);
  });

  /* ---------- admin dashboard icon in the nav ---------- */

  var style = document.createElement('style');
  style.textContent =
    '.' + LINK_CLASS + '{display:flex;align-items:center;justify-content:center;flex:none;width:36px;height:36px;margin:0 2px;border-radius:50%;color:#123a14;text-decoration:none;transition:background .15s}' +
    '.' + LINK_CLASS + ':hover{background:rgba(18,58,20,.12)}' +
    '.' + LINK_CLASS + ' svg{width:22px;height:22px;display:block}';
  document.head.appendChild(style);

  function makeLink() {
    var a = document.createElement('a');
    a.className = LINK_CLASS;
    a.href = ADMIN_URL;
    a.title = 'Admin dashboard';
    a.setAttribute('aria-label', 'Admin dashboard');
    a.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<rect x="3.5" y="3.5" width="7" height="8" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="5" rx="1.5"/>' +
      '<rect x="13.5" y="11.5" width="7" height="9" rx="1.5"/><rect x="3.5" y="14.5" width="7" height="6" rx="1.5"/></svg>';
    return a;
  }

  function injectAdminLink() {
    var buttons = document.querySelectorAll('nav a');
    for (var i = 0; i < buttons.length; i++) {
      var btn = buttons[i];
      if (!/^order now$/i.test(clean(btn.textContent))) continue;
      var holder = btn.parentElement;         // the filled button container
      var row = holder && holder.parentElement; // the icon + button row
      if (!row || row.querySelector('.' + LINK_CLASS)) continue;
      row.insertBefore(makeLink(), holder);
    }

    // Phone layout has no Order Now button in the bar, only a menu icon: put the icon beside it.
    var burgers = document.querySelectorAll('[data-framer-name="Phone Menu Icon Wrap"]');
    for (var j = 0; j < burgers.length; j++) {
      var burger = burgers[j];
      var bar = burger.parentElement;
      if (!bar || bar.querySelector('.' + LINK_CLASS)) continue;
      var link = makeLink();
      link.style.marginLeft = 'auto';
      link.style.marginRight = '10px';
      bar.insertBefore(link, burger);
    }
  }

  var timer = null;
  function schedule() {
    if (timer) return;
    timer = setTimeout(function () {
      timer = null;
      injectAdminLink();
    }, 200);
  }

  function start() {
    injectAdminLink();
    // The page re-renders the nav on route changes; put the icon back if it disappears.
    new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
