const fs = require('fs');

const html = fs.readFileSync('temp_home.html', 'utf8');

const scriptRegex = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
let m;
let count = 0;
while ((m = scriptRegex.exec(html)) !== null) {
  count++;
  const attrs = m[1];
  const content = m[2];
  console.log(`Script #${count} [attrs: ${attrs.trim()}]: ${content.slice(0, 120).replace(/\n/g, ' ')}... (len ${content.length})`);
}
