const fs = require('fs');

const jsContent = fs.readFileSync('script_main.CZQJPkLO.mjs', 'utf8');

const regex = /.{0,40}saladify.{0,40}/gi;
let m;
const matches = [];
while ((m = regex.exec(jsContent)) !== null) {
  matches.push(m[0]);
}

console.log('Total matches in script_main.CZQJPkLO.mjs:', matches.length);
matches.slice(0, 15).forEach((match, idx) => {
  console.log(`[${idx + 1}] ${match.trim()}`);
});

// Also check imports/external URLs
const importRegex = /(?:import|from|src=)["'](https:\/\/[^"']+)["']/g;
const urls = new Set();
while ((m = importRegex.exec(jsContent)) !== null) {
  urls.add(m[1]);
}
console.log('\nExternal URLs in script_main:');
Array.from(urls).slice(0, 10).forEach(u => console.log(u));
