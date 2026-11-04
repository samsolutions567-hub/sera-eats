/*
 * Softer typography: replaces the chunky display font and the extra-heavy weights
 * with the regular body font at a semi-bold weight.
 */
(function () {
  'use strict';
  var FAMILY = '"Bricolage Grotesque", system-ui, sans-serif';
  var WEIGHT = 600;

  var style = document.createElement('style');
  style.textContent =
    'h1,h2,h3,h4,h5,h6,.sf-soft{font-family:' + FAMILY + '!important;font-weight:' + WEIGHT + '!important;letter-spacing:-0.01em!important;--framer-font-family:' + FAMILY + '!important;--framer-font-weight:' + WEIGHT + '!important}' +
    '.sf-medium{font-weight:' + WEIGHT + '!important}';
  document.head.appendChild(style);

  function mark(root) {
    var els = root.querySelectorAll('*');
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      if (el.__sf || (el.closest('svg') && !/^(text|tspan|textPath)$/.test(el.tagName)) || el.closest('#wa-order-host')) continue;
      var hasText = false;
      for (var n = el.firstChild; n; n = n.nextSibling) {
        if (n.nodeType === 3 && n.nodeValue.trim()) { hasText = true; break; }
      }
      if (!hasText) continue;
      var cs = getComputedStyle(el);
      el.__sf = true;
      if (/^["']?Passion One/.test(cs.fontFamily)) el.classList.add('sf-soft');
      else if (parseInt(cs.fontWeight, 10) >= 700) el.classList.add('sf-medium');
    }
  }

  var timer = null;
  function schedule() {
    if (timer) return;
    timer = setTimeout(function () {
      timer = null;
      mark(document.body);
    }, 250);
  }

  function start() {
    mark(document.body);
    // class changes are not observed, so marking cannot retrigger itself
    new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
  window.addEventListener('load', schedule);
})();
