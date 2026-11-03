const fs = require('fs');
const path = require('path');

function getAllFiles(dir, exts = ['.html']) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    if (file === 'temp_home.html' || file.startsWith('badge_')) return;
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getAllFiles(fullPath, exts));
    } else {
      if (exts.includes(path.extname(file))) {
        results.push(fullPath);
      }
    }
  });
  return results;
}

const badgeHtml = fs.readFileSync(path.join(__dirname, 'badge_full.html'), 'utf8').trim();

const cleanerScript = `
<style id="custom-clean-overrides">
  #__framer-badge-container,
  .__framer-badge,
  #template-overlay,
  [data-framer-name="Made in Framer"],
  a[href*="framer.com"] {
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
  function cleanText(t) {
    if (!t) return t;
    return t.replace(/\\s*-\\s*Food &amp; Restaurant Service Framer Template/gi, ' - Food & Restaurant Service')
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
        set(val) { origSet.call(this, cleanText(val)); },
        configurable: true
      });
    }
  } catch (e) {}

  document.addEventListener('click', function(e) {
    const a = e.target.closest('a');
    if (a && a.href && a.href.includes('framer.com')) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, true);

  function purge() {
    if (document.title) {
      const c = cleanText(document.title);
      if (document.title !== c) document.title = c;
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', purge);
  } else {
    purge();
  }
  const obs = new MutationObserver(purge);
  obs.observe(document.documentElement, { childList: true, subtree: true });
})();
</script>
`;

const htmlFiles = getAllFiles(__dirname);
console.log(`Updating ${htmlFiles.length} HTML files...`);

htmlFiles.forEach(file => {
  let html = fs.readFileSync(file, 'utf8');

  // Replace old custom-clean-overrides / custom-badge-cleaner if present
  html = html.replace(/<style id="custom-clean-overrides">[\s\S]*?<\/script>/gi, '');

  // Add the comprehensive cleaner script into head
  html = html.replace('</head>', `${cleanerScript}\n</head>`);

  // Ensure title in HTML is clean
  html = html.replace(/<title>(.*?)<\/title>/gi, (match, title) => {
    let clean = title.replace(/\s*-\s*Food &amp; Restaurant Service Framer Template/gi, ' - Food & Restaurant Service');
    clean = clean.replace(/\s*Framer Template/gi, '');
    clean = clean.replace(/\s*Template/gi, '');
    clean = clean.replace(/Framer/gi, '');
    return `<title>${clean.trim()}</title>`;
  });

  // Replace any existing __framer-badge-container with the full SSR badge element
  html = html.replace(/<div\s+id=["']__framer-badge-container["']>[\s\S]*?<\/div>/gi, '');
  
  // Insert badgeHtml right before the main script tag
  const scriptTagIdx = html.indexOf('<script type="module" async data-framer-bundle="main"');
  if (scriptTagIdx !== -1) {
    html = html.slice(0, scriptTagIdx) + badgeHtml + '\n\t' + html.slice(scriptTagIdx);
  } else {
    html = html.replace('</body>', `${badgeHtml}\n</body>`);
  }

  fs.writeFileSync(file, html, 'utf8');
});

console.log('Successfully updated all HTML files.');
