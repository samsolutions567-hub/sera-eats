const fs = require('fs');

async function main() {
  const res = await fetch('https://saladify.framer.website/');
  const html = await res.text();
  fs.writeFileSync('temp_home.html', html, 'utf8');
  console.log('Successfully wrote temp_home.html, length:', html.length);
}

main().catch(err => {
  console.error('Error in script:', err);
  process.exit(1);
});
