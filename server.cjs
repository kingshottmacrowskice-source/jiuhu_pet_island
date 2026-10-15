const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const root = path.join(__dirname, 'dist');
const url = 'http://127.0.0.1:4173/index.html';
function openIsland() {
  if (process.argv.includes('--open')) spawn('rundll32.exe', ['url.dll,FileProtocolHandler', url], { detached: true, stdio: 'ignore', windowsHide: true }).unref();
}
const server = http.createServer((req, res) => {
  let pathname;
  try { pathname = decodeURIComponent(req.url.split('?')[0]); }
  catch { res.writeHead(400).end(); return; }
  const file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
  if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
  fs.readFile(file, (error, data) => {
    if (error) { res.writeHead(404).end(); return; }
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Content-Type', ({'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.png':'image/png'})[path.extname(file)] || 'application/octet-stream');
    res.end(data);
  });
});
server.on('error', async error => {
  if (error.code === 'EADDRINUSE') {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(3000) });
      if (response.ok && (await response.text()).includes('云上小日子')) {
        console.log('Island is already running: ' + url);
        openIsland();
        return;
      }
    } catch {}
    console.error('Port 4173 is occupied by another server. Close it and launch again.');
  } else console.error(error);
  process.exitCode = 1;
});
server.listen(4173, '127.0.0.1', () => {
  console.log('Local: ' + url);
  openIsland();
});
