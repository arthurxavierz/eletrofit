/* Dependency-free local preview for both independently deployed sites. */
const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const root = __dirname;
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' };
let port = Number(process.argv[2] || 8766);
if (!Number.isInteger(port) || port < 1024 || port > 65525) throw new Error('Use a port between 1024 and 65525.');
let attempts = 0;
const server = http.createServer(async (req, res) => {
  try {
    if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405).end(); return; }
    let pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (pathname === '/') { res.writeHead(302, { Location: '/site/' }).end(); return; }
    if (pathname === '/site' || pathname === '/painel') { res.writeHead(302, { Location: pathname + '/' }).end(); return; }
    if (!/^\/(site|painel)\//.test(pathname)) { res.writeHead(404).end('Not found'); return; }
    if (pathname.endsWith('/')) pathname += 'index.html';
    const file = path.resolve(root, '.' + pathname);
    const relative = path.relative(root, file);
    const type = types[path.extname(file).toLowerCase()];
    if (relative.startsWith('..') || path.isAbsolute(relative) || !type) { res.writeHead(404).end('Not found'); return; }
    const bytes = await fs.readFile(file);
    res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
    res.end(req.method === 'HEAD' ? undefined : bytes);
  } catch (error) {
    res.writeHead(error.code === 'ENOENT' ? 404 : 400).end('Not found');
  }
});
server.on('error', error => {
  if (error.code === 'EADDRINUSE' && attempts++ < 10) server.listen(++port, '127.0.0.1');
  else { console.error(error.message); process.exitCode = 1; }
});
server.on('listening', () => {
  console.log('Site:   http://127.0.0.1:' + port + '/site/');
  console.log('Painel: http://127.0.0.1:' + port + '/painel/');
});
server.listen(port, '127.0.0.1');
