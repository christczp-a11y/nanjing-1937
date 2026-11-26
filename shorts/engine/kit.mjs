import { createRequire } from 'module'; const { chromium } = createRequire(import.meta.url)('/opt/node-tools/node_modules/playwright/index.js');
import http from 'http'; import fs from 'fs'; import path from 'path';
const ROOT = path.resolve('web'); const OUT = path.resolve('out/kit'); fs.mkdirSync(OUT, { recursive: true });
const types = { '.html': 'text/html', '.js': 'text/javascript', '.woff2': 'font/woff2', '.otf': 'font/otf' };
const srv = http.createServer((q, r) => { const p = path.join(ROOT, decodeURIComponent(q.url.split('?')[0])); fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'content-type': types[path.extname(p)] || 'application/octet-stream' }); r.end(d); }); }).listen(0);
const b = await chromium.launch(); const pg = await b.newPage(); pg.on('pageerror', e => console.log('[err]', e.message));
await pg.goto(`http://localhost:${srv.address().port}/kit.html`); await pg.waitForFunction(() => window.ready, null, { timeout: 60000 });
const kit = await pg.evaluate(() => window.kit); for (const [k, v] of Object.entries(kit)) fs.writeFileSync(`${OUT}/${k}.png`, Buffer.from(v.slice(22), 'base64'));
console.log(Object.keys(kit).length, 'sprites'); await b.close(); srv.close();
