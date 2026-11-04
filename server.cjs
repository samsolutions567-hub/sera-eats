const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 5173;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf'
};

function patchJs(code) {
  return code
    .replace(/Saladify/g, 'DEMO.SAM')
    .replace(/saladify\.com/g, 'demosam.com')
    .replace(/saladify\.framer\.website/g, 'demosam.framer.website')
    .replace(/saladify/g, 'demosam')
    .replace(/\+456 567 3423/g, '+91xxxxxxxxxx')
    .replace(/\+4565673423/g, '+91xxxxxxxxxx')
    .replace(/123 Greenway Street, New York, United States\./g, 'Hyderabad, India.')
    .replace(/123 Greenway Street, New York, United States/g, 'Hyderabad, India')
    .replace(/Greenway Street, New York\s*/g, 'Hyderabad, India')
    .replace(/mailto:hello@(?:saladify|demosam)\.com/g, 'javascript:void(0)')
    .replace(/hello@(?:saladify|demosam)\.com/g, '');
}

function fetchAndCacheProxy(relativePath, res) {
  const remoteUrl = `https://framerusercontent.com/${relativePath}`;
  https.get(remoteUrl, (remoteRes) => {
    if (remoteRes.statusCode !== 200) {
      res.writeHead(remoteRes.statusCode);
      res.end();
      return;
    }

    let chunks = [];
    remoteRes.on('data', chunk => chunks.push(chunk));
    remoteRes.on('end', () => {
      const buffer = Buffer.concat(chunks);
      let finalContent = buffer;
      const ext = path.extname(relativePath).toLowerCase();

      if (ext === '.mjs' || ext === '.js') {
        finalContent = Buffer.from(patchJs(buffer.toString('utf8')), 'utf8');
      }

      // Save locally to cache
      const localFilePath = path.join(__dirname, relativePath);
      fs.mkdirSync(path.dirname(localFilePath), { recursive: true });
      fs.writeFileSync(localFilePath, finalContent);

      const contentType = MIME_TYPES[ext] || remoteRes.headers['content-type'] || 'application/octet-stream';
      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': 'no-cache'
      });
      res.end(finalContent);
    });
  }).on('error', (err) => {
    console.error('Proxy error:', err);
    res.writeHead(502);
    res.end('Bad Gateway');
  });
}

const server = http.createServer((req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  let parsedUrl = req.url.split('?')[0].split('#')[0];
  try {
    parsedUrl = decodeURIComponent(parsedUrl);
  } catch (e) {
    // ignore decode error
  }

  // Normalize path
  let relativePath = parsedUrl.replace(/^\/+/, '');
  if (!relativePath) relativePath = 'index.html';

  let resolvedPath = path.join(__dirname, relativePath);
  if (!resolvedPath.startsWith(__dirname + path.sep) && resolvedPath !== __dirname) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  // If request is for /sites/... but does not exist locally, proxy and cache
  if (relativePath.startsWith('sites/') && !fs.existsSync(resolvedPath)) {
    return fetchAndCacheProxy(relativePath, res);
  }

  // Resolution order for pages:
  // 1. Exact file
  // 2. dir/index.html
  // 3. file + '.html'
  if (!fs.existsSync(resolvedPath) || fs.statSync(resolvedPath).isDirectory()) {
    const asDirIndex = path.join(resolvedPath, 'index.html');
    const asHtml = resolvedPath + '.html';
    if (fs.existsSync(asDirIndex) && fs.statSync(asDirIndex).isFile()) {
      resolvedPath = asDirIndex;
    } else if (fs.existsSync(asHtml) && fs.statSync(asHtml).isFile()) {
      resolvedPath = asHtml;
    }
  }

  if (fs.existsSync(resolvedPath) && fs.statSync(resolvedPath).isFile()) {
    const ext = path.extname(resolvedPath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache'
    });
    fs.createReadStream(resolvedPath).pipe(res);
  } else {
    // 404 fallback
    const notFoundPage = path.join(__dirname, '404.html');
    if (fs.existsSync(notFoundPage)) {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      fs.createReadStream(notFoundPage).pipe(res);
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
    }
  }
});

function openBrowser(url) {
  if (process.env.NO_OPEN) return;
  const { exec } = require('child_process');
  const cmd = process.platform === 'win32' ? `start "" "${url}"`
    : process.platform === 'darwin' ? `open "${url}"`
    : `xdg-open "${url}"`;
  exec(cmd, (err) => {
    if (err) console.error('Could not open browser automatically. Open this URL manually:', url);
  });
}

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Stop the other process or run with PORT=<other>.`);
  } else {
    console.error('Server error:', err);
  }
  process.exit(1);
});

server.listen(PORT, '0.0.0.0', () => {
  const url = `http://localhost:${PORT}`;
  console.log(`DEMO_SAM_SERVER_STARTED: ${url}`);
  openBrowser(url);
});
