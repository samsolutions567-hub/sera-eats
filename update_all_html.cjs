const fs = require('fs');
const path = require('path');

function getAllHtml(dir) {
  let list = [];
  fs.readdirSync(dir).forEach(f => {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) {
      if (f !== 'sites' && f !== 'node_modules' && f !== '.git') {
        list = list.concat(getAllHtml(full));
      }
    } else if (f.endsWith('.html')) {
      list.push(full);
    }
  });
  return list;
}

const comprehensiveCleaner = `
<style id="custom-clean-overrides">
  #__framer-badge-container,
  .__framer-badge,
  #template-overlay,
  [data-framer-name="Made in Framer"],
  a[href*="framer.com"],
  [data-framer-name="Email"],
  a[href^="mailto:"] {
    display: none !important;
    opacity: 0 !important;
    pointer-events: none !important;
    visibility: hidden !important;
    width: 0 !important;
    height: 0 !important;
    position: absolute !important;
    left: -9999px !important;
    overflow: hidden !important;
  }
</style>
<script id="custom-badge-cleaner">
(function() {
  function cleanTitle(t) {
    if (!t) return t;
    return t.replace(/Saladify/gi, 'DEMO.SAM')
            .replace(/\\s*-\\s*Food &amp; Restaurant Service Framer Template/gi, ' - Food & Restaurant Service')
            .replace(/\\s*-\\s*Food & Restaurant Service Framer Template/gi, ' - Food & Restaurant Service')
            .replace(/\\s*Framer Template/gi, '')
            .replace(/\\s*Template/gi, '')
            .replace(/\\s*Framer/gi, '');
  }

  try {
    const desc = Object.getOwnPropertyDescriptor(Document.prototype, 'title') ||
                 Object.getOwnPropertyDescriptor(HTMLDocument.prototype, 'title');
    if (desc && desc.set) {
      const origSet = desc.set;
      Object.defineProperty(document, 'title', {
        get() { return desc.get.call(this); },
        set(val) { origSet.call(this, cleanTitle(val)); },
        configurable: true
      });
    }
  } catch (e) {}

  function cleanNode(node) {
    if (!node) return;
    if (node.nodeType === Node.TEXT_NODE) {
      if (node.nodeValue) {
        if (/Saladify/i.test(node.nodeValue)) {
          node.nodeValue = node.nodeValue.replace(/Saladify/g, 'DEMO.SAM').replace(/saladify/g, 'demosam');
        }
        if (/hello@(?:saladify|demosam)\\.com/i.test(node.nodeValue)) {
          node.nodeValue = '';
        }
        if (/\\+456\\s*567\\s*3423/.test(node.nodeValue)) {
          node.nodeValue = node.nodeValue.replace(/\\+456\\s*567\\s*3423/g, '+91xxxxxxxxxx');
        }
        if (/Greenway Street/i.test(node.nodeValue)) {
          node.nodeValue = node.nodeValue.replace(/123 Greenway Street, New York, United States\\.?/gi, 'Hyderabad, India.')
                                         .replace(/Greenway Street, New York\\s*/gi, 'Hyderabad, India');
        }
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      if (node.tagName === 'A' && node.href && node.href.startsWith('mailto:')) {
        node.style.display = 'none';
        node.remove();
        return;
      }
      if (node.getAttribute && node.getAttribute('data-framer-name') === 'Email') {
        node.style.display = 'none';
        node.remove();
        return;
      }
      if (node.tagName === 'A' && node.href && /saladify/i.test(node.href)) {
        node.href = node.href.replace(/saladify/gi, 'demosam');
      }
      for (let i = 0; i < node.childNodes.length; i++) {
        cleanNode(node.childNodes[i]);
      }
    }
  }

  function purge() {
    if (document.title) {
      const c = cleanTitle(document.title);
      if (document.title !== c) document.title = c;
    }
    cleanNode(document.body);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', purge);
  } else {
    purge();
  }
  window.addEventListener('load', purge);
  [100, 300, 600, 1000, 2000].forEach(t => setTimeout(purge, t));

  let purging = false;
  const obs = new MutationObserver(() => {
    if (purging) return;
    purging = true;
    try { purge(); } finally { obs.takeRecords(); purging = false; }
  });
  obs.observe(document.documentElement, { childList: true, subtree: true, characterData: true });
})();
</script>
`.trim();

const files = getAllHtml(__dirname);
console.log(`Processing ${files.length} HTML files...`);

let updatedCount = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // 1. Replace Framer CDN main script URL with local URL
  content = content.replace(
    /src="https:\/\/framerusercontent\.com\/sites\/7ohS0GUyXmAoqYD1PDdliT\/script_main\.CZQJPkLO\.mjs"/g,
    'src="/sites/7ohS0GUyXmAoqYD1PDdliT/script_main.CZQJPkLO.mjs"'
  );

  // 2. Remove old overrides and insert updated comprehensiveCleaner
  content = content.replace(/<style id="custom-clean-overrides">[\s\S]*?<\/script>/gi, '');
  content = content.replace('</head>', `${comprehensiveCleaner}\n</head>`);

  // 3. Ensure title in static HTML has DEMO.SAM
  content = content.replace(/<title>(.*?)<\/title>/gi, (match, title) => {
    let clean = title.replace(/Saladify/gi, 'DEMO.SAM');
    clean = clean.replace(/\s*-\s*Food &amp; Restaurant Service Framer Template/gi, ' - Food & Restaurant Service');
    clean = clean.replace(/\s*-\s*Food & Restaurant Service Framer Template/gi, ' - Food & Restaurant Service');
    clean = clean.replace(/\s*Framer Template/gi, '');
    clean = clean.replace(/\s*Template/gi, '');
    clean = clean.replace(/Framer/gi, '');
    return `<title>${clean.trim()}</title>`;
  });

  // 4. In case any Saladify or saladify remains anywhere in static HTML
  content = content.replace(/Saladify/g, 'DEMO.SAM');
  content = content.replace(/saladify\.com/g, 'demosam.com');

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    updatedCount++;
  }
});

console.log(`Successfully updated ${updatedCount} files.`);
