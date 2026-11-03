const fs = require('fs');

const html = fs.readFileSync('temp_home.html', 'utf8');

console.log('--- Head Meta / Title ---');
const titleMatch = html.match(/<title>[\s\S]*?<\/title>/i);
console.log('Title:', titleMatch ? titleMatch[0] : 'None');

console.log('--- Template Occurrences ---');
let pos = 0;
while (true) {
  pos = html.toLowerCase().indexOf('template', pos);
  if (pos === -1) break;
  console.log('Template at ' + pos + ':', html.substring(Math.max(0, pos - 40), Math.min(html.length, pos + 80)).replace(/\n/g, ' '));
  pos += 8;
}

console.log('--- Designed By Occurrences ---');
pos = 0;
while (true) {
  pos = html.toLowerCase().indexOf('designed', pos);
  if (pos === -1) break;
  console.log('Designed at ' + pos + ':', html.substring(Math.max(0, pos - 40), Math.min(html.length, pos + 80)).replace(/\n/g, ' '));
  pos += 8;
}

console.log('--- Framer Badge Occurrences ---');
pos = 0;
while (true) {
  pos = html.toLowerCase().indexOf('framer-badge', pos);
  if (pos === -1) break;
  console.log('Badge at ' + pos + ':', html.substring(Math.max(0, pos - 40), Math.min(html.length, pos + 80)).replace(/\n/g, ' '));
  pos += 12;
}

console.log('--- External Links ---');
const hrefs = [];
const hrefRegex = /href=[\"']([^\"']+)[\"']/gi;
let m;
while ((m = hrefRegex.exec(html)) !== null) {
  if (m[1].startsWith('http') || m[1].startsWith('//') || m[1].includes('framer')) {
    hrefs.push(m[1]);
  }
}
console.log('External / Framer hrefs count:', hrefs.length);
console.log('Sample hrefs:', [...new Set(hrefs)].slice(0, 30));
