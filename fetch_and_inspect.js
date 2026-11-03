import fs from 'fs';

async function main() {
  const res = await fetch('https://saladify.framer.website/');
  const html = await res.text();
  fs.writeFileSync('temp_home.html', html, 'utf-8');
  console.log('Saved temp_home.html, length:', html.length);

  // Let's search for "template", "designed by", "framer" in text
  const regex = />([^<]*(?:designed by|template|framer)[^<]*)</gi;
  let m;
  const matches = [];
  while ((m = regex.exec(html)) !== null) {
    if (m[1].trim()) matches.push(m[1].trim());
  }
  console.log('Visible text matches:');
  console.log(matches);

  // Also check title and meta tags
  const title = html.match(/<title>([^<]*)<\/title>/i);
  console.log('Title:', title ? title[1] : 'none');
}

main().catch(console.error);
