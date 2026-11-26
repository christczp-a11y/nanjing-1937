// node render.mjs <ep> [fps] [t0] [t1] [--stills=1,5,9]  -> out/ep<ep>.mp4 (or stills png)
import { createRequire } from 'module'; const { chromium } = createRequire(import.meta.url)('/opt/node-tools/node_modules/playwright/index.js');
import { spawn } from 'child_process'; import http from 'http'; import fs from 'fs'; import path from 'path';
const args = process.argv.slice(2); const ep = args[0] || '1'; const fps = +(args[1] || 30);
const stills = (args.find(a => a.startsWith('--stills=')) || '').slice(9); const opts = args.filter(a => !a.startsWith('--'));
const OV = !!process.env.OVERLAY; const TAG = process.env.TAG || ''; const ROOT = path.resolve('web'); const OUT = path.resolve('out'); fs.mkdirSync(OUT, { recursive: true });
const types = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.otf': 'font/otf', '.woff2': 'font/woff2' };
const srv = http.createServer((q, r) => { const p = path.join(ROOT, decodeURIComponent(q.url.split('?')[0])); fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'content-type': types[path.extname(p)] || 'application/octet-stream' }); r.end(d); }); }).listen(0);
const port = srv.address().port;
const browser = await chromium.launch({ args: ['--disable-gpu-vsync'] }); const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
page.on('console', m => console.log('[page]', m.text())); page.on('pageerror', e => console.log('[err]', e.message));
await page.goto(`http://localhost:${port}/index.html?ep=${ep}&render=1${process.env.HANDOFF ? '&handoff=1' : ''}${process.env.DEBUG ? '&debug=1' : ''}${OV ? '&overlay=1' : ''}${process.env.NOCAP ? '&nocap=1' : ''}${process.env.CLEAN ? '&clean=1' : ''}`);
await page.waitForFunction(() => window.ready === true, null, { timeout: 120000 });
const dur = await page.evaluate(() => window.duration);
fs.writeFileSync(`${OUT}/ep${ep}_handoff.json`, JSON.stringify(await page.evaluate(() => window.handoffs()), null, 1));
const grab = async t => { const b64 = await page.evaluate(async ([t, OV]) => { await window.draw(t); const c = document.getElementById('c'); return OV ? c.toDataURL('image/png').slice(22) : c.toDataURL('image/jpeg', 0.93).slice(23); }, [t, OV]); return Buffer.from(b64, 'base64'); };
if (stills) { for (const s of stills.split(',')) { fs.writeFileSync(`${OUT}/ep${ep}${TAG}_${s}s.${OV ? 'png' : 'jpg'}`, await grab(+s)); console.log('still', s); } }
else {
  const t0 = +(opts[2] ?? 0), t1 = +(opts[3] ?? dur); const n = Math.round((t1 - t0) * fps);
  const name = `${OUT}/ep${ep}${TAG}${opts[2] != null ? `_${t0}-${t1}` : ''}.${OV ? 'mov' : 'mp4'}`;
  const vo = path.resolve(`web/vo/ep${ep}.mp3`); const withA = !OV && !process.env.NOAUDIO && fs.existsSync(vo);
  const inp = ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-c:v', OV ? 'png' : 'mjpeg', '-r', String(fps), '-i', '-'];
  const aud = withA ? ['-ss', String(t0), '-i', vo, '-map', '0:v', '-map', '1:a', '-c:a', 'aac', '-b:a', '192k'] : [];
  const enc = OV ? ['-c:v', 'prores_ks', '-profile:v', '4444', '-pix_fmt', 'yuva444p10le', '-vendor', 'apl0', '-qscale:v', '9'] : ['-c:v', 'libx264', '-preset', 'slow', '-crf', '20', '-maxrate', '10M', '-bufsize', '20M', '-pix_fmt', 'yuv420p', '-movflags', '+faststart'];
  const ff = spawn('ffmpeg', [...inp, ...aud, ...enc, name], { stdio: ['pipe', 'inherit', 'inherit'] });
  const st = Date.now();
  for (let i = 0; i < n; i++) { const buf = await grab(t0 + i / fps); if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r)); if (i % 150 === 0) console.log(`frame ${i}/${n} ${((Date.now() - st) / 1000).toFixed(0)}s`); }
  ff.stdin.end(); await new Promise(r => ff.on('close', r)); console.log('wrote', name);
}
await browser.close(); srv.close();
