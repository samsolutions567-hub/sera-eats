const fs = require('fs');
const path = require('path');
const https = require('https');

const BASE_URL = 'https://framerusercontent.com/sites/7ohS0GUyXmAoqYD1PDdliT';
const LOCAL_DIR = path.join(__dirname, 'sites', '7ohS0GUyXmAoqYD1PDdliT');

if (!fs.existsSync(LOCAL_DIR)) {
  fs.mkdirSync(LOCAL_DIR, { recursive: true });
}

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchUrl(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`Failed to fetch ${url}: status ${res.statusCode}`));
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function patchContent(code) {
  let patched = code;

  // 1. Replace brand names
  // Notice: Some internal identifier tokens or variable names shouldn't be broken, but "Saladify" is the brand string
  patched = patched.replace(/Saladify/g, 'DEMO.SAM');
  patched = patched.replace(/saladify\.com/g, 'demosam.com');
  patched = patched.replace(/saladify\.framer\.website/g, 'demosam.framer.website');
  // Be careful with general "saladify" in case of URLs
  patched = patched.replace(/saladify/g, 'demosam');

  // 2. Replace phone number
  patched = patched.replace(/\+456 567 3423/g, '+91xxxxxxxxxx');
  patched = patched.replace(/\+4565673423/g, '+91xxxxxxxxxx');

  // 3. Replace address
  patched = patched.replace(/123 Greenway Street, New York, United States\./g, 'Hyderabad, India.');
  patched = patched.replace(/123 Greenway Street, New York, United States/g, 'Hyderabad, India');

  // 4. Remove / hide email
  // Replace mailto:hello@... or mailto:... with javascript:void(0) or empty
  patched = patched.replace(/mailto:hello@(?:saladify|demosam)\.com/g, 'javascript:void(0)');
  patched = patched.replace(/hello@(?:saladify|demosam)\.com/g, '');

  return patched;
}

const downloaded = new Set();
const queue = ['script_main.CZQJPkLO.mjs'];

async function crawl() {
  console.log('Starting chunk crawler and patcher...');

  while (queue.length > 0) {
    const filename = queue.shift();
    if (downloaded.has(filename)) continue;
    downloaded.add(filename);

    const localPath = path.join(LOCAL_DIR, filename);
    const remoteUrl = `${BASE_URL}/${filename}`;

    console.log(`Downloading [${downloaded.size}]: ${filename}`);
    let content;
    try {
      content = await fetchUrl(remoteUrl);
    } catch (err) {
      console.error(`Error fetching ${remoteUrl}:`, err.message);
      continue;
    }

    // Find all imported chunks inside this file
    const importRegex = /(?:from|import)\s*\(?\s*[`'"]\.\/([^`'"]+\.mjs)[`'"]\s*\)?/g;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      const dep = match[1];
      if (!downloaded.has(dep) && !queue.includes(dep)) {
        queue.push(dep);
      }
    }

    // Patch the content
    const patchedContent = patchContent(content);

    // Save locally
    fs.writeFileSync(localPath, patchedContent, 'utf8');
  }

  console.log(`\nCompleted! Downloaded and patched ${downloaded.size} files in ${LOCAL_DIR}`);
}

crawl().catch(console.error);
