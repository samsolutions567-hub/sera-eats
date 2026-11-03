const fs = require('fs');
const path = require('path');

async function main() {
  const res = await fetch('https://saladify.framer.website/404');
  let html = await res.text();

  // Basic sanitization
  html = html.replace(/<!--\s*Made in Framer[\s\S]*?-->/gi, '');
  html = html.replace(/<meta\s+name=["']generator["']\s+content=["'][^"']*Framer[^"']*["']\s*\/?>/gi, '');
  html = html.replace(/<title>(.*?)<\/title>/gi, '<title>404 - Page Not Found | Saladify</title>');
  html = html.replace(/<div\s+id=["']__framer-badge-container["']>[\s\S]*?<\/div>\s*(?=<\/body>|<script|$)/gi, '');
  html = html.replace(/<div\s+id=["']template-overlay["']><\/div>/gi, '');
  html = html.replace(/href=["']https?:\/\/(?:www\.)?framer\.com[^"']*["']/gi, 'href="#"');
  html = html.replace(/href=["']https?:\/\/(?:www\.)?(?:facebook|x|twitter|linkedin|instagram)\.com\/theuimile[^"']*["']/gi, 'href="#"');
  html = html.replace(/href=["']https:\/\/saladify\.framer\.website(\/[^"']*)?["']/gi, 'href="$1"');

  const injection = `
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
  }
</style>
<script id="custom-badge-cleaner">
(function() {
  function purge() {
    const b = document.getElementById('__framer-badge-container');
    if (b) b.remove();
    const o = document.getElementById('template-overlay');
    if (o) o.remove();
    document.querySelectorAll('.__framer-badge, a[href*=\"framer.com\"]').forEach(el => el.remove());
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
  html = html.replace('</head>', `${injection}\n</head>`);

  fs.writeFileSync('404.html', html, 'utf8');
  if (!fs.existsSync('404')) fs.mkdirSync('404');
  fs.writeFileSync('404/index.html', html, 'utf8');
  console.log('Saved 404.html and 404/index.html, length:', html.length);
}

main().catch(console.error);
