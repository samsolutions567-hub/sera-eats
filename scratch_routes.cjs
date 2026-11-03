const fs = require('fs');

const js = fs.readFileSync('script_main.CZQJPkLO.mjs', 'utf8');

// Look for route definitions, e.g. augiA20Il (the home page id from earlier: href:{webPageId:`augiA20Il`})
const augiMatches = [...js.matchAll(/.{0,50}augiA20Il.{0,50}/g)];
console.log('augiA20Il matches:', augiMatches.length);
augiMatches.forEach(m => console.log(m[0]));

// Search for any imports of other .mjs files in script_main or dynamic import(...)
const dynamicImports = [...js.matchAll(/import\s*\(\s*["']([^"']+)["']\s*\)/g)];
console.log('Dynamic imports:', dynamicImports.length);
dynamicImports.forEach(m => console.log(m[1]));
