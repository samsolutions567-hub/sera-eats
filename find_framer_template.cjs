const fs = require('fs');
const s = fs.readFileSync('index.html', 'utf8');
let p = 0;
while ((p = s.indexOf('Framer Template', p)) !== -1) {
  console.log('Found at pos', p, 'context:', s.substring(Math.max(0, p - 60), Math.min(s.length, p + 80)).replace(/\n/g, ' '));
  p += 15;
}
