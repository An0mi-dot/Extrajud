// Simple static file server for serving `paginas_html` on localhost:8080
// Usage: node scripts/serve_pages.js

const http = require('http');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..', 'public');
const port = process.env.PORT || 8080;

const mime = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
  '.woff2': 'font/woff2'
};

const server = http.createServer((req, res) => {
  try {
    const safePath = path.normalize(decodeURIComponent(req.url)).replace(/^\/+/, '');
    let filePath = path.join(root, safePath);

    if (req.url === '/' || req.url === '') {
      // default to index of paginas_html if exists
      filePath = path.join(root, 'index.html');
    }

    // If path is a directory, try index.html inside it
    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      const idx = path.join(filePath, 'index.html');
      if (fs.existsSync(idx)) filePath = idx;
    }

    if (!fs.existsSync(filePath)) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const type = mime[ext] || 'application/octet-stream';
    const stream = fs.createReadStream(filePath);
    res.writeHead(200, { 'Content-Type': type });
    stream.pipe(res);
  } catch (e) {
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Server error');
    console.error(e);
  }
});

server.listen(port, () => console.log(`Serving paginas_html at http://localhost:${port}`));

module.exports = server;
