const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://saladify.framer.website';

const urls = [
  '/',
  '/faq',
  '/about-us',
  '/contact-us',
  '/404',
  '/blog',
  '/menu',
  '/blog-category/vegan-recipes',
  '/blog-category/healthy-eating',
  '/blog-category/quick-easy',
  '/menu/grilled-chicken-salad',
  '/menu/rainbow-crunch',
  '/menu/spicy-southwest',
  '/menu/grilled-chicken-avocado-salad',
  '/menu/berry-spinach-delight',
  '/menu/classic-caesar-salad',
  '/menu/buffalo-chicken-wrap',
  '/menu/mediterranean-quinoa-salad',
  '/menu/spicy-chickpea-fiesta-bowl',
  '/menu/minestrone',
  '/menu/creamy-mushroom-soup',
  '/menu/spicy-lentil-soup',
  '/menu/lemon-vegetable-soup',
  '/menu/tropical-mango-powercup',
  '/menu/chocolate-peanut-butter-powercup',
  '/menu/cacao-matcha-powercup',
  '/menu/acai-energy-powercup',
  '/privacy-policy',
  '/terms-and-conditions',
  '/blog/secret-to-a-perfect-salad-freshness-in-every-bite',
  '/blog/refreshing-summer-salads-you-need-to-try-right-now',
  '/blog/5-fresh-ingredients-to-boost-your-salad-game',
  '/blog/simple-vegan-bowls-for-busy-modern-everyday-days',
  '/blog/vibrant-salad-bowl-ideas-for-colorful-healthy-eating',
  '/blog/refreshing-summer-salads-to-beat-the-heat',
  '/blog/grilled-chicken-salad-with-fresh-zesty-dressing',
  '/blog/spicy-southwest-salad-with-black-beans-corn-and-chipotle',
  '/blog/the-secret-of-a-perfect-salad-fresh-in-every-bite',
  '/blog/simple-ways-to-keep-salads-fresh-and-crisp-longer',
  '/blog/quick-chopping-tips-to-prep-salads-faster-every-day'
];

function sanitizeHtml(html, pagePath) {
  let cleaned = html;

  // 1. Remove Framer comments & generator
  cleaned = cleaned.replace(/<!--\s*Made in Framer[\s\S]*?-->/gi, '');
  cleaned = cleaned.replace(/<meta\s+name=["']generator["']\s+content=["'][^"']*Framer[^"']*["']\s*\/?>/gi, '');

  // 2. Clean Title & Meta descriptions
  cleaned = cleaned.replace(/<title>(.*?)<\/title>/gi, (match, title) => {
    let newTitle = title.replace(/\s*-\s*Food &amp; Restaurant Service Framer Template/gi, ' - Food & Restaurant Service');
    newTitle = newTitle.replace(/\s*Framer Template/gi, '');
    newTitle = newTitle.replace(/\s*Template/gi, '');
    return `<title>${newTitle.trim()}</title>`;
  });

  cleaned = cleaned.replace(/(content=["'][^"']*?)Designed in Framer with CMS menus, refined motion, and responsive layouts, it helps cafes, salad bars, and meal services showcase their dishes effortlessly\.([^"']*?["'])/gi, 
    '$1Fresh ingredients, balanced nutrition, refined motion, and responsive layouts to showcase dishes effortlessly.$2');

  cleaned = cleaned.replace(/(content=["'][^"']*?)Framer Template([^"']*?["'])/gi, '$1$2');

  // 3. Remove Framer editor bar loader script
  cleaned = cleaned.replace(/<script>try\{if\(localStorage\.get\("__framer_force_showing_editorbar_since"\)[\s\S]*?<\/script>/gi, '');

  // 4. Remove Framer events analytics script
  cleaned = cleaned.replace(/<script\s+async\s+src=["']https:\/\/events\.framer\.com\/script\?v=2["'][^>]*><\/script>/gi, '');

  // 5. Remove __framer-badge-container element
  cleaned = cleaned.replace(/<div\s+id=["']__framer-badge-container["']>[\s\S]*?<\/div>\s*(?=<\/body>|<script|$)/gi, '');
  cleaned = cleaned.replace(/<div\s+id=["']template-overlay["']><\/div>/gi, '');

  // 6. Clean external redirect links (theuimile, framer.com, etc.)
  cleaned = cleaned.replace(/href=["']https?:\/\/(?:www\.)?framer\.com[^"']*["']/gi, 'href="#"');
  cleaned = cleaned.replace(/href=["']https?:\/\/(?:www\.)?(?:facebook|x|twitter|linkedin|instagram)\.com\/theuimile[^"']*["']/gi, 'href="#"');

  // 7. Clean internal links pointing to saladify.framer.website
  cleaned = cleaned.replace(/href=["']https:\/\/saladify\.framer\.website(\/[^"']*)?["']/gi, (match, p) => {
    return `href="${p || '/'}"`;
  });

  // 8. Inject styling & suppression script to eliminate any runtime badge/template injection
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
    position: absolute !important;
    left: -9999px !important;
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

  cleaned = cleaned.replace('</head>', `${injection}\n</head>`);

  return cleaned;
}

async function fetchWithRetry(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch (e) {
      if (i === retries - 1) throw e;
      await new Promise(r => setTimeout(r, 1000));
    }
  }
}

async function main() {
  console.log(`Starting crawl of ${urls.length} pages...`);

  for (let i = 0; i < urls.length; i++) {
    const pagePath = urls[i];
    const fullUrl = BASE_URL + pagePath;
    console.log(`[${i + 1}/${urls.length}] Fetching: ${fullUrl}`);

    try {
      const html = await fetchWithRetry(fullUrl);
      const cleaned = sanitizeHtml(html, pagePath);

      // Determine local destination paths
      let targetFile;
      if (pagePath === '/') {
        targetFile = path.join(__dirname, 'index.html');
      } else {
        // e.g. /faq -> /faq/index.html AND /faq.html
        const cleanPath = pagePath.startsWith('/') ? pagePath.slice(1) : pagePath;
        const dirPath = path.join(__dirname, cleanPath);
        if (!fs.existsSync(dirPath)) {
          fs.mkdirSync(dirPath, { recursive: true });
        }
        targetFile = path.join(dirPath, 'index.html');

        // Also write cleanPath + '.html' for flat routing support
        const flatFile = path.join(__dirname, cleanPath + '.html');
        const flatDir = path.dirname(flatFile);
        if (!fs.existsSync(flatDir)) {
          fs.mkdirSync(flatDir, { recursive: true });
        }
        fs.writeFileSync(flatFile, cleaned, 'utf8');
      }

      fs.writeFileSync(targetFile, cleaned, 'utf8');
      console.log(`  Saved -> ${targetFile} (${cleaned.length} bytes)`);
    } catch (err) {
      console.error(`  Failed ${fullUrl}:`, err.message);
    }
  }

  console.log('All pages successfully downloaded and cleaned!');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
