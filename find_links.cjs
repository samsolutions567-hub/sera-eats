const fs = require('fs');

const html = fs.readFileSync('temp_home.html', 'utf8');

// Find all <a> tags and buttons
const aRegex = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi;
let m;
const links = [];
while ((m = aRegex.exec(html)) !== null) {
  const attrs = m[1];
  const inner = m[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const hrefMatch = attrs.match(/href=[\"']([^\"']*)[\"']/i);
  const href = hrefMatch ? hrefMatch[1] : '';
  if (inner || href) {
    links.push({ inner, href });
  }
}

console.log('Total links found:', links.length);
const suspicious = links.filter(l => 
  /template|framer|buy|purchase|uimile/i.test(l.inner) || 
  /template|framer|uimile/i.test(l.href)
);
console.log('Suspicious / Framer / Template links:');
console.log(JSON.stringify(suspicious, null, 2));
