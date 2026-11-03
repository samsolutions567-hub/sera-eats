const fs = require('fs');

const js = fs.readFileSync('script_main.CZQJPkLO.mjs', 'utf8');

const dynamicChunks = [...js.matchAll(/import\s*\(\s*[`'"](\.[^`'"]+)[`'"]\s*\)/g)].map(m => m[1]);
console.log('Dynamic route chunks:');
dynamicChunks.forEach(c => console.log('  ', c));

const staticImports = [...js.matchAll(/from\s*[`'"](\.[^`'"]+)[`'"]/g)].map(m => m[1]);
console.log('\nStatic imports:');
staticImports.forEach(c => console.log('  ', c));
