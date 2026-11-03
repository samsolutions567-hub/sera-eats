const fs = require('fs');
const path = require('path');

function getAllFiles(dir, exts = ['.html']) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
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

const htmlFiles = getAllFiles(__dirname);
console.log(`Auditing ${htmlFiles.length} HTML files...`);

let issuesFound = 0;

htmlFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');

  // Check 1: Framer badge element
  if (content.includes('id="__framer-badge-container"') || content.includes('__framer-badge')) {
    // Check if it's not inside our custom-clean-overrides style or script
    const withoutOverrides = content.replace(/<style id="custom-clean-overrides">[\s\S]*?<\/style>/, '')
                                    .replace(/<script id="custom-badge-cleaner">[\s\S]*?<\/script>/, '');
    if (withoutOverrides.includes('id="__framer-badge-container"')) {
      console.log(`[Issue - Framer Badge markup] in ${path.relative(__dirname, file)}`);
      issuesFound++;
    }
  }

  // Check 2: "Framer Template" in visible text or title
  const titleMatch = content.match(/<title>([^<]*)<\/title>/i);
  if (titleMatch && /framer|template/i.test(titleMatch[1])) {
    console.log(`[Issue - Title Branding] in ${path.relative(__dirname, file)}: ${titleMatch[1]}`);
    issuesFound++;
  }

  // Check 3: External redirect links (framer.com, theuimile)
  const hrefs = content.match(/href=["'][^"']*framer\.com[^"']*["']/gi);
  if (hrefs) {
    console.log(`[Issue - Framer href] in ${path.relative(__dirname, file)}: ${hrefs.join(', ')}`);
    issuesFound++;
  }

  const socialHrefs = content.match(/href=["'][^"']*theuimile[^"']*["']/gi);
  if (socialHrefs) {
    console.log(`[Issue - Author href] in ${path.relative(__dirname, file)}: ${socialHrefs.join(', ')}`);
    issuesFound++;
  }
});

console.log(`Audit complete. Issues found: ${issuesFound}`);
