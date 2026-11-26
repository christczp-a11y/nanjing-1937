// Nanjing 1937 two-colour map engine. Canvas 2D, 1080x1920, deterministic: draw(t) renders frame at t seconds.
// World frame = sandbox frame: metres, origin 118.78E 32.05N, +x east, +z south (same as sandbox README_坐标.md).
export let W = 1080, H = 1920; let CYF = 0.44;
export const LAY = { hudX: 140, hudY: 246, capY: 1470, capSize: 72, safeTop: 330, safeBottom: 1390, cardBottom: 1520, titleY: 1430, stampY: 760, topGrad: 380 };
export function setSize(w, h) { W = w; H = h; if (w > h) { CYF = 0.5; Object.assign(LAY, { hudX: 64, hudY: 56, capY: 975, capSize: 50, safeTop: 140, safeBottom: 900, cardBottom: 930, titleY: 540, stampY: 470, topGrad: 220 }); } }
export const COL = {
  cn: '#2f6fd6', jp: '#d8452b', cnRGB: [70, 120, 215], jpRGB: [215, 78, 55], cnLite: '#8bb8ff', jpLite: '#ff8f74', front: '#fff1c4',
  ink: '#1b1f24', paper: '#f4efe4', water: '#3a4a54', grey: '#8a8f94', white: '#ffffff', char: '#2a2320'
};
const FONT = '"Inter Display", "Inter", "DejaVu Sans", sans-serif';
const COND = '"Bebas", "Oswald", sans-serif'; // condensed caps for tags, dates, numbers
const SUBF = '"Mont", "Inter Display", sans-serif'; // captions / wide-tracked place names

// ---------- time helpers
const EPOCH = Date.UTC(1937, 10, 1); // minutes since 1937-11-01 00:00 local
export function T(s) { // 'MM-DD HH:MM' or 'MM-DD'
  const [md, hm = '00:00'] = s.split(' '); const [m, d] = md.split('-').map(Number); const [h, mi] = hm.split(':').map(Number);
  return (Date.UTC(m < 6 ? 1938 : 1937, m - 1, d, h, mi) - EPOCH) / 60000;
}
export function isoT(iso) { return T(iso.slice(5, 10) + ' ' + iso.slice(11, 16)); }
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
function fmtDate(min, withTime) {
  const d = new Date(EPOCH + min * 60000);
  let s = `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
  if (withTime) s += `  ${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
  return s;
}
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a, b, u) => a + (b - a) * u;
const smooth = u => { u = clamp(u); return u * u * u * (u * (u * 6 - 15) + 10); };
const easeOut = u => 1 - Math.pow(1 - clamp(u), 3);
const easeIO = u => { u = clamp(u); return u < .5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2; };
function env(t, t0, t1, fin = 0.35, fout = 0.35) { // 0..1 visibility
  if (t < t0 || t > t1) return 0; return Math.min(clamp((t - t0) / fin), clamp((t1 - t) / fout));
}
const fmtN = n => Math.round(n).toLocaleString('en-US');

// ---------- assets
const assets = {};
function loadImg(src) { return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; }); }
async function loadJSON(src) { return (await fetch(src)).json(); }
export async function loadAssets(base = 'assets/') {
  const [big, city, fb, fc, bigM, cityM, fcM, world, fbM] = await Promise.all([
    loadImg(base + 'big.jpg'), loadImg(base + 'city.jpg'), loadImg(base + 'field_big.png'), loadImg(base + 'field_city.png'),
    loadJSON(base + 'big.json'), loadJSON(base + 'city.json'), loadJSON(base + 'field_city.json'), loadJSON(base + 'world.json'), loadJSON(base + 'field_big.json')]);
  Object.assign(assets, { big, city: feather(city, 220), bigM, cityM, world });
  assets.fieldBig = makeField(fb, fbM.X0, fbM.Z0, fbM.R, 0);
  assets.fieldCity = makeField(fc, fcM.X0, fcM.Z0, fcM.R, 40); assets.fieldCity.fill = true;
  const [cl, bl] = await Promise.all([loadImg(base + 'city_land.png'), loadImg(base + 'big_land.png')]);
  if (cl && bl) { assets.cityLand = alphaFrom(cl, false); assets.cityWater = alphaFrom(cl, true, 80); assets.bigLand = alphaFrom(bl, false); } // fine shorelines for the tint (basemap resolution, anti-aliased)
  await Promise.all([`400 40px ${COND}`, `800 40px ${SUBF}`, `700 40px ${SUBF}`, `900 40px ${SUBF}`, `700 40px "Oswald"`].map(f => document.fonts.load(f)));
  await document.fonts.load(`700 40px ${FONT}`); await document.fonts.load(`900 40px ${FONT}`); await document.fonts.load(`500 40px ${FONT}`);
  return assets;
}
function alphaFrom(img, invert, featherPx = 0) { // grey mask image -> canvas whose alpha is the mask (optionally inverted, edge-feathered)
  const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const g = c.getContext('2d'); g.drawImage(img, 0, 0);
  const im = g.getImageData(0, 0, c.width, c.height), d = im.data;
  for (let y = 0, k = 0; y < c.height; y++) for (let x = 0; x < c.width; x++, k += 4) { let a = invert ? 255 - d[k] : d[k]; if (featherPx) a *= smooth(Math.min(x, y, c.width - 1 - x, c.height - 1 - y) / featherPx); d[k] = d[k + 1] = d[k + 2] = 0; d[k + 3] = a; }
  g.putImageData(im, 0, 0); return c;
}
function feather(img, px) { // soft alpha edge so the fine city map melts into the coarse one
  const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const g = c.getContext('2d'); g.drawImage(img, 0, 0);
  g.globalCompositeOperation = 'destination-out';
  for (const [x0, y0, x1, y1, rx, ry, rw, rh] of [[0, 0, px, 0, 0, 0, px, c.height], [c.width, 0, c.width - px, 0, c.width - px, 0, px, c.height], [0, 0, 0, px, 0, 0, c.width, px], [0, c.height, 0, c.height - px, 0, c.height - px, c.width, px]]) {
    const gr = g.createLinearGradient(x0, y0, x1, y1); gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(rx, ry, rw, rh); }
  return c;
}
function makeField(img, X0, Z0, R, feather) {
  const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
  const g = c.getContext('2d'); g.drawImage(img, 0, 0);
  const d = g.getImageData(0, 0, c.width, c.height).data; const n = c.width * c.height;
  const tm = new Float32Array(n), water = new Uint8Array(n);
  for (let i = 0; i < n; i++) { const v = d[i * 4] * 256 + d[i * 4 + 1]; tm[i] = v >= 65535 ? 1e9 : v * 2; water[i] = d[i * 4 + 2] > 127; }
  const tmF = new Float32Array(tm); { let fr = []; const seen = new Uint8Array(n); for (let i = 0; i < n; i++) if (!water[i]) { seen[i] = 1; fr.push(i); }
    while (fr.length) { const nx = []; for (const i of fr) { const x = i % c.width, y = (i / c.width) | 0; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const X = x + dx, Y = y + dy; if (X < 0 || Y < 0 || X >= c.width || Y >= c.height) continue; const q = Y * c.width + X; if (seen[q]) continue; seen[q] = 1; tmF[q] = tm[i]; nx.push(q); } } fr = nx; } }
  const edge = new Float32Array(n); for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) { const d = Math.min(x, y, c.width - 1 - x, c.height - 1 - y); edge[y * c.width + x] = feather ? smooth(d / feather) : 1; }
  // water knock-out mask (opaque where water, feathered with edge) used to cut coarser tint under fine water
  const wm = document.createElement('canvas'); wm.width = c.width; wm.height = c.height; const wg = wm.getContext('2d'); const wi = wg.createImageData(c.width, c.height);
  for (let i = 0; i < n; i++) { wi.data[i * 4 + 3] = water[i] ? 255 * edge[i] : 0; } wg.putImageData(wi, 0, 0);
  const out = document.createElement('canvas'); out.width = c.width; out.height = c.height;
  return { X0, Z0, R, w: c.width, h: c.height, tm, tmF, water, edge, wmask: wm, canvas: out, ctx: out.getContext('2d'), img: out.getContext('2d').createImageData(c.width, c.height), last: -1 };
}
function paintField(f, now, alpha) {
  if (Math.abs(f.last - now) < 1 && f.lastA === alpha) return f.canvas;
  const px = f.img.data, n = f.w * f.h, soft = 360; // minutes of soft edge
  const [r1, g1, b1] = COL.jpRGB, [r0, g0, b0] = COL.cnRGB;
  for (let i = 0; i < n; i++) {
    const o = i * 4;
    if (f.water[i] && !(f.fill && assets.cityLand)) { px[o + 3] = 0; continue; } // only the city field is filled + cut by the fine shoreline
    const age = now - f.tmF[i]; const u = clamp(age / soft + 0.5);
    let r = lerp(r0, r1, u), gg = lerp(g0, g1, u), b = lerp(b0, b1, u);
    if (age > -soft && age < 2880) { const h = (1 - clamp(age / 2880)) * clamp(age / soft + .5) * .55; r = lerp(r, 255, h); gg = lerp(gg, 150, h); b = lerp(b, 95, h); } // freshly taken ground glows
    px[o] = r; px[o + 1] = gg; px[o + 2] = b; px[o + 3] = 255 * alpha * f.edge[i];
  }
  f.ctx.putImageData(f.img, 0, 0); f.last = now; f.lastA = alpha; return f.canvas;
}

// ---------- camera: {x,z,w,rot}. w = view width in metres; rot = compass bearing that points to screen-up (0 = north up)
export function zoomInterp(a, b, u) { // van Wijk & Nuij smooth zoom-pan (as d3.interpolateZoom), rho = 1.4
  const rho = 1.4, rho2 = rho * rho, rho4 = rho2 * rho2;
  const ux0 = a.x, uy0 = a.z, w0 = a.w, ux1 = b.x, uy1 = b.z, w1 = b.w;
  const dx = ux1 - ux0, dy = uy1 - uy0, d2 = dx * dx + dy * dy;
  let x, z, w, S;
  if (d2 < 1e-6) { S = Math.log(w1 / w0) / rho; const s = u * S; x = ux0 + u * dx; z = uy0 + u * dy; w = w0 * Math.exp(rho * s); }
  else {
    const d1 = Math.sqrt(d2), b0 = (w1 * w1 - w0 * w0 + rho4 * d2) / (2 * w0 * rho2 * d1), b1 = (w1 * w1 - w0 * w0 - rho4 * d2) / (2 * w1 * rho2 * d1);
    const r0 = Math.log(Math.sqrt(b0 * b0 + 1) - b0), r1 = Math.log(Math.sqrt(b1 * b1 + 1) - b1); S = (r1 - r0) / rho;
    const s = u * S, coshr0 = Math.cosh(r0), uu = w0 / (rho2 * d1) * (coshr0 * Math.tanh(rho * s + r0) - Math.sinh(r0));
    x = ux0 + uu * dx; z = uy0 + uu * dy; w = w0 * coshr0 / Math.cosh(rho * s + r0);
  }
  let dr = ((b.rot - a.rot + 540) % 360) - 180;
  return { x, z, w, rot: a.rot + dr * u };
}
export function camAt(keys, t) {
  if (t <= keys[0].t) return { ...keys[0], rot: keys[0].rot || 0 };
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i], b = keys[i + 1];
    if (t <= b.t) {
      const A = { ...a, rot: a.rot || 0 }, B = { ...b, rot: b.rot || 0 };
      if (b.hold) return A;
      const ez = b.ease === 'in' ? (u => Math.pow(clamp(u), 2.6)) : b.ease === 'out' ? (u => 1 - Math.pow(1 - clamp(u), 2.6)) : (typeof b.ease === 'function' ? b.ease : smooth);
      const u = ez((t - a.t) / (b.t - a.t));
      return zoomInterp(A, B, u);
    }
  }
  const l = keys[keys.length - 1]; return { ...l, rot: l.rot || 0 };
}
class View {
  constructor(cam) {
    this.cam = cam; this.s = W / cam.w; const r = -(cam.rot || 0) * Math.PI / 180; this.cos = Math.cos(r); this.sin = Math.sin(r);
    this.cx = W / 2; this.cy = H * CYF;
  }
  p(x, z) { const dx = (x - this.cam.x) * this.s, dz = (z - this.cam.z) * this.s; const X = this.cx + dx * this.cos - dz * this.sin, Y = this.cy + dx * this.sin + dz * this.cos;
    const w = this.warp; if (!w) return [X, Y]; const xx = X - w.srcCx - w.shx, yy = Y - w.srcCy - w.shy, d = w.f - yy * w.sn; return [w.cx + w.f * xx / d, w.cy + w.f * yy * w.cs / d]; }
  apply(g) { g.setTransform(1, 0, 0, 1, 0, 0); g.translate(this.cx, this.cy); g.rotate(-(this.cam.rot || 0) * Math.PI / 180); g.scale(this.s, this.s); g.translate(-this.cam.x, -this.cam.z); }
  px(m) { return m * this.s; } // metres -> px
}

// ---------- the engine
export class MapFilm {
  constructor(canvas, ep) {
    this.c = canvas; canvas.width = W; canvas.height = H; this.g = canvas.getContext('2d'); this.ep = ep;
    this.places = assets.world.places; this.gates = Object.fromEntries(assets.world.gates.map(g => [g.id, g]));
    this.photos = {};
    if (ep.splash !== false && !ep._splashed) { ep._splashed = true; for (const ph of ep.phases || []) if (ph.splash !== false) ep.items.push({ type: 'chapter', t0: ph.t0, t1: ph.t0 + (ph.sdur || 1.8), text: ph.text, num: ph.num, y: ph.sy }); }
  }
  async preload() {
    const names = new Set(); for (const it of this.ep.items) { if (it.img) names.add(it.img); if (it.portrait) names.add(it.portrait); for (const sd of [it.left, it.right]) if (sd && sd.img) names.add(sd.img); }
    await Promise.all([...names].map(async n => { this.photos[n] = await loadImg('photos/' + n); }));
    this.frames = new Map(); // footage frames, loaded on demand (ensure) and evicted LRU
  }
  pt(a) { // resolve a world point: [x,z] | 'place-id' | 'gate:id' | {ll:[lon,lat]}
    if (Array.isArray(a)) return a;
    if (typeof a === 'string') {
      if (a.startsWith('gate:')) { const g = this.gates[a.slice(5)]; return [g.x, g.z]; }
      const p = this.places[a]; if (p) return [p.x, p.z];
      throw new Error('unknown place ' + a);
    }
    if (a && a.ll) return ll(a.ll[0], a.ll[1]);
    throw new Error('bad point ' + JSON.stringify(a));
  }
  storyTime(t) { return interpKeys(this.ep.story, t, 'd'); }
  draw(t) {
    let g = this.g; const ep = this.ep; const cam = camAt(ep.cam, t);
    if (ep.drift !== false) cam.w *= 1 - 0.012 * Math.sin(t * 0.35) - 0.006 * Math.sin(t * 0.9 + 1); // never fully still
    const v = new View(cam); this.v = v; this.t = t;
    const sh = (ep.shake || []).reduce((m, [a, b, amp]) => t >= a && t <= b ? Math.max(m, amp * Math.min(1, (t - a) / .15, (b - t) / .4)) : m, 0) + this.shakeKick(t);
    if (sh > 0) { v.cx += sh * (Math.sin(t * 61) + Math.sin(t * 37.3)) * .5; v.cy += sh * (Math.sin(t * 53.1 + 2) + Math.sin(t * 29.7)) * .5; }
    const now = this.storyTime(t); this.now = now;
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; g.setLineDash([]); g.filter = 'none'; g.shadowColor = 'transparent';
    if (ep.overlay) { // transparent HUD layer for the sandbox segments
      g.clearRect(0, 0, W, H);
      for (const it of ep.items) { if (!isHud(it)) continue; const fn = this['i_' + it.type]; if (!fn) continue; if (t < it.t0 - 0.01 || t > (it.t1 ?? 1e9) + 0.01) continue; g.save(); fn.call(this, it, t); g.restore(); }
      this.hud(t, now); this.captions(t); return; }
    const tilt = ep.tilt && !ep.overlay ? interpKeys(ep.tilt, t, 'v') : 0; const TW = tilt > .05 ? this.tiltBegin(tilt, v) : null; if (TW) g = this.g;
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    g.fillStyle = COL.water; g.fillRect(0, 0, W, H);
    // basemaps
    v.apply(g); g.imageSmoothingQuality = 'high';
    const B = assets.bigM; g.drawImage(assets.big, B.X0, B.Z0, B.X1 - B.X0, B.Z1 - B.Z0);
    const tintA = ep.tint ?? 0.92;
    const cityA = clamp((90000 - cam.w) / 50000); // city layer fades in below 90 km view width
    if (cityA > 0) { const C = assets.cityM; g.globalAlpha = cityA; g.drawImage(assets.city, C.X0, C.Z0, C.X1 - C.X0, C.Z1 - C.Z0); g.globalAlpha = 1; }
    // two-colour tint: composite big + city fields offscreen at full strength, then lay over the map once
    const tc = sizedCanvas('tint'), tg = tc.getContext('2d'); tg.setTransform(1, 0, 0, 1, 0, 0); tg.clearRect(0, 0, W, H); v.apply(tg); tg.imageSmoothingEnabled = true;
    const fb = assets.fieldBig; tg.drawImage(paintField(fb, now, 1), fb.X0, fb.Z0, fb.w * fb.R, fb.h * fb.R);
    const C = assets.cityM, BM = assets.bigM;
    if (assets.bigLand) { tg.globalCompositeOperation = 'destination-in'; tg.drawImage(assets.bigLand, BM.X0, BM.Z0, BM.X1 - BM.X0, BM.Z1 - BM.Z0); tg.globalCompositeOperation = 'source-over'; }
    if (cityA > 0) { const fc = assets.fieldCity; tg.globalAlpha = cityA; tg.globalCompositeOperation = 'destination-out';
      if (assets.cityWater) tg.drawImage(assets.cityWater, C.X0, C.Z0, C.X1 - C.X0, C.Z1 - C.Z0); else tg.drawImage(fc.wmask, fc.X0, fc.Z0, fc.w * fc.R, fc.h * fc.R);
      tg.globalCompositeOperation = 'source-over';
      if (assets.cityLand) { const t2 = sizedCanvas('tint2'), g2 = t2.getContext('2d'); g2.setTransform(1, 0, 0, 1, 0, 0); g2.globalCompositeOperation = 'source-over'; g2.clearRect(0, 0, W, H); v.apply(g2); g2.imageSmoothingEnabled = true;
        g2.drawImage(paintField(fc, now, 1), fc.X0, fc.Z0, fc.w * fc.R, fc.h * fc.R); g2.globalCompositeOperation = 'destination-in'; g2.drawImage(assets.cityLand, C.X0, C.Z0, C.X1 - C.X0, C.Z1 - C.Z0); g2.globalCompositeOperation = 'source-over';
        tg.setTransform(1, 0, 0, 1, 0, 0); tg.drawImage(t2, 0, 0); v.apply(tg); }
      else tg.drawImage(paintField(fc, now, 1), fc.X0, fc.Z0, fc.w * fc.R, fc.h * fc.R); tg.globalAlpha = 1; }
    tg.setTransform(1, 0, 0, 1, 0, 0); tg.globalAlpha = 1; tg.globalCompositeOperation = 'source-atop'; tg.globalAlpha = ep.hatchA ?? 1; tg.fillStyle = hatchPattern(tg); tg.fillRect(0, 0, W, H); tg.globalAlpha = 1; tg.globalCompositeOperation = 'source-over';
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = tintA; g.globalCompositeOperation = ep.tintMode || 'multiply'; g.drawImage(tc, 0, 0); g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
    // night / dusk wash
    const dark = ep.dark ? interpKeys(ep.dark, t, 'v') : 0;
    g.setTransform(1, 0, 0, 1, 0, 0);
    if (ep.front !== false && cam.w < 700000) this.drawFront(v, now, cityA, dark);
    if (dark > 0) { g.fillStyle = `rgba(10,18,40,${dark * 0.55})`; g.fillRect(0, 0, W, H); }
    // wall (always, when zoomed enough)
    const wallA = clamp((60000 - cam.w) / 30000);
    if (wallA > 0 && ep.wall !== false) this.drawWall(wallA);
    // zoom blur when the camera dives/climbs fast (sandbox exits)
    const c2 = camAt(ep.cam, t + 1 / 30); const rate = Math.abs(Math.log(c2.w / cam.w)) * 30; // log-zoom per second
    const zb = clamp((rate - 0.6) / 1.6);
    if (zb > 0.02 && ep.zoomBlur !== false) { const tmp = sizedCanvas('blur');
      const tg = tmp.getContext('2d'); tg.setTransform(1, 0, 0, 1, 0, 0); tg.globalAlpha = 1; tg.drawImage(g.canvas, 0, 0); g.setTransform(1, 0, 0, 1, 0, 0);
      const cyF = H * CYF; for (let k = 1; k <= 6; k++) { const s = 1 + zb * 0.035 * k; g.globalAlpha = 0.22; g.drawImage(tmp, W / 2 - W * s / 2, cyF - cyF * s, W * s, H * s); } g.globalAlpha = 1; }
    // items in order
    // map-anchored items first, then post (vignette/grain), then screen-space HUD items on top
    const inHand = ep.items.some(it => it.type === 'handoff' && it.sandbox && t >= it.t0 && t <= it.t1);
    const CLEAN = new Set(['arrow', 'units', 'breach', 'riverGlow', 'wallGlow', 'blasts', 'ring', 'scatter', 'icon', 'line']);
    const mapPass = (flat) => { for (const it of ep.items) { if (isHud(it) || (ep.clean && !CLEAN.has(it.type))) continue; if (TW && FLAT.has(it.type) !== flat) continue; const fn = this['i_' + it.type]; if (!fn) continue; if (t < it.t0 - 0.01 || t > (it.t1 ?? 1e9) + 0.01) continue; g.save(); fn.call(this, it, t); g.restore(); } };
    mapPass(true);
    if (TW) { this.tiltEnd(TW); g = this.g; mapPass(false); } // upright labels / markers / cards ride on the tilted ground at their projected anchors
    this.post(t); // keep the grade on through sandbox stand-ins too (no brightness jump at the handoff)
    if (ep.clean) return;
    for (const it of ep.items) { if (!isHud(it)) continue; const fn = this['i_' + it.type]; if (!fn) continue; if (t < it.t0 - 0.01 || t > (it.t1 ?? 1e9) + 0.01) continue; g.save(); fn.call(this, it, t); g.restore(); }
    this.hud(t, now); this.captions(t);
    if (ep.debug) this.debugOverlay(t, cam);
  }
  // ---------------- restrained 3D: the ground plane pitches back (top = far). Map renders flat into a larger source, then a row-wise perspective warp.
  tiltBegin(tilt, v) {
    const ep = this.ep, W0 = W, H0 = H, cyS = H0 * CYF, f = ep.focal || H0 * 1.3; const mt = (ep.maxTilt || 30) * Math.PI / 180, sM = Math.sin(mt), cM = Math.cos(mt);
    const yTop = -cyS * f / (f * cM - cyS * sM), sTop = f / (f - yTop * sM), yBot = (H0 - cyS) * f / (f * cM + (H0 - cyS) * sM);
    const SW = Math.ceil(W0 / sTop / 2) * 2 + 24, srcCy = Math.ceil(-yTop) + 12, SH = srcCy + Math.ceil(yBot) + 12;
    const TW = { g: this.g, W0, H0, cyS, f, th: tilt * Math.PI / 180, srcCx: SW / 2, srcCy, shx: v.cx - W0 / 2, shy: v.cy - cyS };
    W = SW; H = SH; const c = sizedCanvas('tiltsrc'); this.g = c.getContext('2d');
    v.cx = TW.srcCx + TW.shx; v.cy = srcCy + TW.shy; return TW;
  }
  tiltEnd(TW) {
    const src = this.g.canvas; W = TW.W0; H = TW.H0; this.g = TW.g; const g = this.g; const { f, th, srcCx, srcCy, cyS } = TW, sn = Math.sin(th), cs = Math.cos(th);
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; g.fillStyle = '#26313a'; g.fillRect(0, 0, W, H); g.imageSmoothingQuality = 'high';
    const yOf = Y => { const vv = Y - cyS; return vv * f / (f * cs + vv * sn); };
    for (let Y = 0; Y < H; Y++) { const y0 = yOf(Y), y1 = yOf(Y + 1), sc = f / (f - (y0 + y1) / 2 * sn), sw = W / sc; g.drawImage(src, srcCx - sw / 2, srcCy + y0, sw, Math.max(.5, y1 - y0), 0, Y, W, 1); }
    // atmospheric depth: far ground hazes toward a cool grey
    const k = clamp(th / (30 * Math.PI / 180)); const hz = g.createLinearGradient(0, 0, 0, H * .42); hz.addColorStop(0, `rgba(38,48,58,${.55 * k})`); hz.addColorStop(1, 'rgba(38,48,58,0)'); g.fillStyle = hz; g.fillRect(0, 0, W, H * .42);
    const v = this.v; v.warp = { f, sn, cs, srcCx, srcCy, cx: W / 2 + TW.shx, cy: cyS + TW.shy, shx: TW.shx, shy: TW.shy };
  }
  // ---------------- base layers
  drawWall(a, glowU = 0) {
    const g = this.g, v = this.v; const ring = assets.world.ring;
    g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = a; g.lineJoin = 'round';
    g.beginPath(); ring.forEach(([x, z], i) => { const [X, Y] = v.p(x, z); i ? g.lineTo(X, Y) : g.moveTo(X, Y); }); g.closePath();
    g.strokeStyle = 'rgba(20,20,20,0.55)'; g.lineWidth = Math.max(3, v.px(30)) + 3; g.stroke();
    g.strokeStyle = '#efe6d2'; g.lineWidth = Math.max(2, v.px(30)); g.stroke();
    g.restore();
  }
  // ---------------- items
  i_wallGlow(it, t) { // draw-on highlight of the whole wall
    const g = this.g, v = this.v, ring = assets.world.ring; const u = easeIO((t - it.t0) / (it.dur || 3)); const a = env(t, it.t0, it.t1, .2, .6);
    const n = Math.floor(ring.length * u); if (n < 2) return;
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = a; g.lineCap = 'round'; g.lineJoin = 'round';
    g.beginPath(); for (let i = 0; i < n; i++) { const [X, Y] = v.p(...ring[i]); i ? g.lineTo(X, Y) : g.moveTo(X, Y); }
    g.shadowColor = '#fff6c8'; g.shadowBlur = 24; g.strokeStyle = '#fff4c2'; g.lineWidth = 7; g.stroke();
    g.shadowBlur = 0; g.strokeStyle = '#ffffff'; g.lineWidth = 3; g.stroke();
  }
  i_riverGlow(it, t) { // pulse the Yangtze (largest water body of the city field): tinted fill + glowing banks
    const g = this.g, v = this.v, fc = assets.fieldCity; const a = env(t, it.t0, it.t1, .35, .5); if (a <= 0) return;
    const R = riverMask(fc); const pulse = .55 + .45 * Math.sin((t - it.t0) * 4);
    v.apply(g); g.globalAlpha = a * (.35 + .25 * pulse); g.drawImage(R.tint, fc.X0, fc.Z0, fc.w * fc.R, fc.h * fc.R);
    g.setTransform(1, 0, 0, 1, 0, 0); g.lineJoin = 'round'; g.globalAlpha = a; g.shadowColor = '#9fe6ff'; g.shadowBlur = this.ep.fine ? 12 : 22; g.strokeStyle = '#c9f2ff'; g.lineWidth = this.ep.fine ? 2.2 + pulse : 4 + 2 * pulse;
    for (const l of R.lines) { const P = projLine(v, l); if (!P || pathLen(P) < 80) continue; poly(g, P); g.stroke(); } g.shadowBlur = 0;
  }
  i_measure(it, t) { // width bar across water from a point along a direction (finds both banks in the city field)
    const g = this.g, v = this.v, fc = assets.fieldCity; const a = env(t, it.t0, it.t1, .2, .4); if (a <= 0) return;
    if (!it._ab) { const [x0, z0] = this.pt(it.at), [dx, dz] = it.dir; const wet = (x, z) => { const i = Math.floor((x - fc.X0) / fc.R), j = Math.floor((z - fc.Z0) / fc.R); return i >= 0 && j >= 0 && i < fc.w && j < fc.h && fc.water[j * fc.w + i]; };
      let s = 0, e = 0; for (let guard = 0; guard < 20; guard++) { while (s < 8000 && !wet(x0 + dx * s, z0 + dz * s)) s += 10; e = s; while (e < 12000 && wet(x0 + dx * e, z0 + dz * e)) e += 10; if (e - s > (it.minRun || 400) || s >= 8000) break; s = e; } it._ab = [[x0 + dx * s, z0 + dz * s], [x0 + dx * e, z0 + dz * e]]; }
    const [A, B] = it._ab.map(q => v.p(...q)); const u = easeOut((t - it.t0) / .7); const M = [lerp(A[0], B[0], .5), lerp(A[1], B[1], .5)];
    const P = [lerp(M[0], A[0], u), lerp(M[1], A[1], u)], Q = [lerp(M[0], B[0], u), lerp(M[1], B[1], u)];
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = a; g.lineCap = 'round'; const ang = Math.atan2(B[1] - A[1], B[0] - A[0]), nx = -Math.sin(ang) * 16, ny = Math.cos(ang) * 16;
    for (const [w, c] of [[9, 'rgba(0,0,0,.6)'], [4, '#ffffff']]) { g.lineWidth = w; g.strokeStyle = c; g.beginPath(); g.moveTo(P[0], P[1]); g.lineTo(Q[0], Q[1]); g.moveTo(P[0] + nx, P[1] + ny); g.lineTo(P[0] - nx, P[1] - ny); g.moveTo(Q[0] + nx, Q[1] + ny); g.lineTo(Q[0] - nx, Q[1] - ny); g.stroke(); }
    if (it.text && u > .6) ctag(g, it.text, M[0], M[1] - 40, { size: it.size || 40, bg: '#101215', scale: easeBack((t - it.t0 - .45) / .4) });
  }
  i_gateSeq(it, t) { // all listed gates light up, then X one by one in batches; 'keep' stays lit
    const g = this.g, v = this.v; const a = env(t, it.t0, it.t1, .25, .4); if (a <= 0) return; g.setTransform(1, 0, 0, 1, 0, 0);
    const xs = {}; (it.batches || []).forEach(([tb, ids]) => ids.forEach((id, k) => { xs[id] = tb + k * (it.step || .1); }));
    for (const id of it.gates) { const [X, Y] = v.p(...this.pt('gate:' + id)); const tx = xs[id]; const pop = easeBack((t - it.t0 - it.gates.indexOf(id) * .03) / .4); if (pop <= 0) continue;
      const shut = tx != null && t >= tx; const pulse = .5 + .5 * Math.sin((t - it.t0) * 6 + id.length);
      g.globalAlpha = a; if (!shut) { g.save(); g.shadowColor = '#ffe27a'; g.shadowBlur = 18; g.beginPath(); g.arc(X, Y, (11 + 4 * pulse) * pop, 0, 7); g.fillStyle = it.keep && it.keep.includes(id) && t > (it.batches?.[it.batches.length - 1]?.[0] ?? 1e9) ? '#ffd34d' : '#fff3b0'; g.fill(); g.restore(); g.lineWidth = 3; g.strokeStyle = '#14161a'; g.stroke(); }
      else { const u = easeOut((t - tx) / .25); const s = 15 * (1.7 - .7 * u); g.globalAlpha = a * u; g.lineCap = 'round'; for (const [w, c] of [[11, 'rgba(0,0,0,.7)'], [6, COL.jp]]) { g.lineWidth = w; g.strokeStyle = c; g.beginPath(); g.moveTo(X - s, Y - s); g.lineTo(X + s, Y + s); g.moveTo(X + s, Y - s); g.lineTo(X - s, Y + s); g.stroke(); } } }
    if (it.keepLabel && it.keep) { const lt = it.batches[it.batches.length - 1][0] + .4; if (t > lt) { const [X, Y] = v.p(...this.pt('gate:' + it.keep[0])); g.globalAlpha = a; ctag(g, it.keepLabel, X, Y + 56, { size: 36, bg: '#d8a417', fg: '#14161a', scale: easeBack((t - lt) / .4) }); } }
  }
  i_stamp(it, t) { // big slammed word (e.g. TRAPPED)
    const g = this.g; const a = env(t, it.t0, it.t1, .05, .4); if (a <= 0) return; g.setTransform(1, 0, 0, 1, 0, 0);
    const u = clamp((t - it.t0) / .22); const sc = 1 + 1.6 * Math.pow(1 - u, 3); const [X, Y] = it.screen || [W / 2, LAY.stampY];
    g.globalAlpha = a * clamp(u * 2); g.translate(X, Y); g.rotate(-.06); g.scale(sc, sc);
    g.font = `400 ${it.size || 170}px ${COND}`; g.letterSpacing = '8px'; const w = g.measureText(it.text).width + 60, h = (it.size || 170) * 1.05;
    g.lineWidth = 12; g.strokeStyle = COL.jp; g.strokeRect(-w / 2, -h * .62, w, h); g.letterSpacing = '0px';
    txt(g, it.text, 0, h * .3, { size: it.size || 170, weight: 400, font: COND, fill: '#ff5a3c', glow: '#d8312a', sw: 10, track: 8 });
  }
  i_label(it, t) { // condensed box tag pinned to a world point (red / blue / black)
    const a = env(t, it.t0, it.t1, .25, .3); if (a <= 0) return; const [X, Y] = it.screen || this.v.p(...this.pt(it.at)); const g = this.g; if (it.screen) { it.dy = it.dy ?? 0; }
    const pop = easeBack((t - it.t0) / .45); const style = it.style || 'jp';
    const bg = style === 'jp' ? '#d8312a' : style === 'cn' ? '#2457c5' : style === 'dark' ? '#101215' : '#f7f4ee'; const fg = style === 'light' ? '#14161a' : '#fff';
    const tx = X + (it.dx ?? 0), ty = Y + (it.dy ?? -70); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = a;
    if (it.pin !== false && Math.hypot(tx - X, ty - Y) > 30) { g.save(); g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = 6; g.strokeStyle = '#fff'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(X, Y); g.lineTo(tx, ty); g.stroke(); g.restore(); g.beginPath(); g.arc(X, Y, 8, 0, 7); g.fillStyle = '#fff'; g.fill(); }
    ctag(g, it.text, tx, ty, { bg, fg, size: it.size || 40, scale: pop, edge: style === 'cn' || style === 'jp' });
    if (it.sub) txt(g, it.sub, tx, ty + (it.size || 40) * 1.05, { size: Math.max(24, (it.size || 40) * .6), weight: 700 });
  }
  i_place(it, t) { // quiet place name
    const a = env(t, it.t0, it.t1, .4, .4); const [X, Y] = this.v.p(...this.pt(it.at)); const g = this.g;
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = a;
    if (it.dot !== false) { const pr = ((t - it.t0) * .8) % 1; g.globalAlpha = a * (1 - pr) * .7; g.beginPath(); g.arc(X, Y, (it.r || 9) * (1 + pr * 2.4), 0, 7); g.lineWidth = 2.5; g.strokeStyle = '#fff'; g.stroke(); g.globalAlpha = a;
      g.save(); g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = 10; g.beginPath(); g.arc(X, Y, it.r || 9, 0, 7); g.fillStyle = '#fff'; g.fill(); g.restore(); g.lineWidth = 3; g.strokeStyle = COL.ink; g.stroke(); }
    let tx = X + (it.dx ?? 20), ty = Y + (it.dy ?? 0), al = it.align || 'left'; const pop = easeOut((t - it.t0) / .6);
    g.font = `800 ${it.size || 30}px ${SUBF}`; g.letterSpacing = '5px'; const tw = g.measureText(it.text).width; g.letterSpacing = '0px';
    if (al === 'right' || (al === 'left' && !it.noFlip && tx + tw > W - 24)) { al = 'right'; tx = X - (it.dx ?? 20); } // left of the dot (set align:'right' to avoid a mid-shot flip)
    txt(g, it.text, tx, ty, { size: it.size || 30, weight: 800, align: al, base: 'middle', track: (1 - pop) * 16 + 5, sw: 0.1, stroke: false, shadow: 'rgba(0,0,0,.9)' });
  }
  i_counter(it, t) { // big number that counts, pinned to world point or screen
    const a = env(t, it.t0, it.t1, .2, .35); if (a <= 0) return; const g = this.g;
    let X, Y; if (it.screen) [X, Y] = it.screen; else { [X, Y] = this.v.p(...this.pt(it.at)); X += it.dx ?? 0; Y += it.dy ?? -90; }
    const u = easeOut((t - it.t0 - (it.delay || 0)) / (it.dur || 1.6));
    let txt_, changed = it.t0; if (it.steps) { txt_ = it.steps[0][1]; for (const [ts, s] of it.steps) if (t >= it.t0 + ts) { txt_ = s; changed = it.t0 + ts; } }
    else txt_ = (it.prefix || '') + fmtN(lerp(it.from ?? 0, it.to, u)) + (it.suffix || '');
    const fT = it.t0 + (it.dur || 1.6) + (it.finalDelay ?? .4); if (it.final && u >= 1 && t > fT) { txt_ = it.final; changed = fT; }
    if (!it.steps && !it.final && u >= 1) changed = it.t0 + (it.delay || 0) + (it.dur || 1.6);
    const col = it.color === 'cn' ? COL.cn : it.color === 'jp' ? COL.jp : '#fff';
    const grad = it.color === 'cn' ? ['#9cc2ff', '#3f7fe8'] : it.color === 'jp' ? ['#ff9b7f', '#d8452b'] : ['#ffffff', '#e6e9ee'];
    const pop = easeBack((t - it.t0) / .5), bump = 1 + .14 * Math.exp(-Math.max(0, t - changed) * 7) * (t >= changed ? 1 : 0);
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = a; g.translate(X, Y); g.scale(pop * bump, pop * bump);
    let size = it.size || 92; g.font = `900 ${size}px ${FONT}`; const mw = g.measureText(txt_).width; if (mw > W - 100) size *= (W - 100) / mw;
    const flash = clamp(1 - (t - changed) / .35); if (flash > 0 && t >= changed) { g.save(); g.globalCompositeOperation = 'lighter'; const rg = g.createRadialGradient(0, -size * .35, 0, 0, -size * .35, size * 2.2); rg.addColorStop(0, `rgba(255,240,210,${.45 * flash})`); rg.addColorStop(1, 'rgba(255,240,210,0)'); g.fillStyle = rg; g.fillRect(-size * 2.5, -size * 2.6, size * 5, size * 4.6); g.restore(); }
    if (it.caption) { g.font = `400 ${Math.round(size * .3)}px ${COND}`; g.letterSpacing = '2px'; const cw = g.measureText(it.caption).width + 30, chh = size * .36; const ux = clamp((t - it.t0 - .1) / .35);
      g.save(); g.shadowColor = 'rgba(0,0,0,.5)'; g.shadowBlur = 12; g.fillStyle = it.color === 'cn' ? '#2457c5' : '#d8312a'; g.fillRect(-cw / 2 * ux, -size * 1.02 - chh, cw * ux, chh); g.restore();
      if (ux > .5) { g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(it.caption, 0, -size * 1.02 - chh / 2 + 2); } g.letterSpacing = '0px'; }
    txt(g, txt_, 0, 0, { size: size * 1.12, weight: 400, font: COND, grad: it.color ? grad : null, fill: '#fff', glow: it.color ? shade(col, .1) : null, sw: size * .08, track: 2 });
    let y = size * .2;
    if (false) { g.font = `800 ${Math.round(size * .32)}px ${FONT}`; const cw = g.measureText(it.caption).width + 34, chh = size * .46; const ux = clamp((t - it.t0 - .15) / .4);
      g.save(); g.shadowColor = 'rgba(0,0,0,.5)'; g.shadowBlur = 14; g.fillStyle = it.color ? col : 'rgba(14,17,22,.9)'; rr(g, -cw / 2 * ux, y, cw * ux, chh, 6); g.fill(); g.restore();
      if (ux > .6) { g.globalAlpha = a * clamp((ux - .6) / .4); g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(it.caption, 0, y + chh / 2 + 1); g.globalAlpha = a; }
      y += chh + 10; }
    if (it.note) { txt(g, it.note, 0, y + Math.max(26, size * .28), { size: Math.max(26, Math.round(size * .27)), weight: 600, fill: '#e9ecf0' }); }
  }
  i_arrow(it, t) { // thick tapered arrow drawn on along a smoothed world path
    const a = env(t, it.t0, it.t1, .2, .5); if (a <= 0) return; const g = this.g, v = this.v;
    const pts = catmull(it.path.map(p => this.pt(p)), 16).map(p => v.p(...p));
    let u = easeIO((t - it.t0) / (it.grow || 2)); if (it.shrinkFrom != null) u = u; // grow
    const sub = partial(pts, u); if (sub.length < 2) return;
    if (pathLen(sub) < 30) return;
    const wpx = it.wpx || (it.wm ? v.px(it.wm) : 34); const col = it.side === 'cn' ? COL.cn : COL.jp;
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = a * (it.alpha ?? 0.95);
    const thin = it.thin ? lerp(1, it.thin, clamp((t - it.t0 - (it.thinAt || 0)) / (it.thinDur || 3))) : 1;
    g.globalAlpha = a; const G = drawArrow2(g, sub, wpx * thin, col, t, { speed: it.speed });
    if (it.pawns && G) { const n = it.pawns; for (let k = 0; k < n; k++) { const off = (k - (n - 1) / 2) * 30; const ang = G.ang + Math.PI / 2; pawn(g, G.tip[0] - Math.cos(G.ang) * 50 + Math.cos(ang) * off, G.tip[1] - Math.sin(G.ang) * 50 + Math.sin(ang) * off, { side: it.side || 'jp', s: .95 }); } }
    if (it.unit && G) nato(g, G.tip[0] + (it.udx || 0), G.tip[1] + (it.udy ?? -46), { side: it.side || 'jp', ech: it.unit.ech || 'XX', name: it.unit.name, kind: it.unit.kind, s: it.unit.s || 1.15 });
    if (it.text && u > .6) {
      const mid = sub[Math.floor(sub.length * .45)]; const ta = clamp((u - .6) / .3) * a;
      g.globalAlpha = ta; ctag(g, it.text, mid[0] + (it.tdx || 0), mid[1] + (it.tdy || 0), { bg: it.side === 'cn' ? '#2457c5' : '#d8312a', size: it.tsize || 38, scale: easeBack(clamp((u - .6) / .3)), edge: true });
    }
  }
  i_line(it, t) { // dashed / plain world line, draws on (e.g. government leaves, execution routes)
    const a = env(t, it.t0, it.t1, .3, .5); if (a <= 0) return; const g = this.g, v = this.v;
    const pts = catmull(it.path.map(p => this.pt(p)), 10).map(p => v.p(...p)); const sub = partial(pts, easeIO((t - it.t0) / (it.grow || 2)));
    if (sub.length < 2) return; g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = a; g.lineCap = 'round'; g.lineJoin = 'round';
    if (it.dash) g.setLineDash(it.dash); g.strokeStyle = 'rgba(10,10,10,.6)'; g.lineWidth = (it.width || 6) + 4; poly(g, sub); g.stroke();
    g.strokeStyle = it.color || '#fff'; g.lineWidth = it.width || 6; poly(g, sub); g.stroke(); g.setLineDash([]);
    if (it.head) { const p1 = sub[sub.length - 1], p0 = sub[Math.max(0, sub.length - 4)]; head(g, p0, p1, (it.width || 6) * 3.5, it.color || '#fff'); }
  }
  i_units(it, t) { // team dots; each {at|from,to, t0?,t1?, out?: time it goes dark}
    const g = this.g, v = this.v; const a = env(t, it.t0, it.t1, .4, .5); if (a <= 0) return; const col = it.side === 'cn' ? COL.cn : it.side === 'jp' ? COL.jp : '#fff';
    g.setTransform(1, 0, 0, 1, 0, 0);
    const r = it.r || 9;
    it.dots.forEach((d, k) => {
      let p; if (!Array.isArray(d) && d.to) { const u = easeIO((t - (d.m0 ?? it.t0)) / ((d.m1 ?? it.t1) - (d.m0 ?? it.t0))); const A = this.pt(d.from), B = this.pt(d.to); p = [lerp(A[0], B[0], u), lerp(A[1], B[1], u)]; } else p = this.pt(Array.isArray(d) ? d : (d.at || d));
      let da = a; if (!Array.isArray(d) && d.out != null) da *= 1 - clamp((t - d.out) / .4);
      if (da <= 0) return; const [X, Y] = v.p(...p);
      g.globalAlpha = da;
      if (it.style === 'dot' || it.side === 'civ') { g.beginPath(); g.arc(X, Y, r, 0, 7); g.fillStyle = col; g.fill(); g.lineWidth = it.side === 'civ' ? 0 : 2.5; g.strokeStyle = '#fff'; if (it.side !== 'civ') g.stroke(); return; }
      if (!Array.isArray(d) && d.to) { const A = v.p(...this.pt(d.from)); g.save(); g.globalAlpha = da * .35; g.strokeStyle = col; g.lineWidth = 3; g.setLineDash([6, 8]); g.beginPath(); g.moveTo(A[0], A[1]); g.lineTo(X, Y); g.stroke(); g.restore(); }
      const pop = easeBack((t - (d.t0 ?? it.t0) - k * .04) / .45); if (pop <= 0) return; const dead = (!Array.isArray(d) && d.out != null) ? clamp((t - d.out + .4) / .3) : 0;
      if (it.style === 'nato') nato(g, X, Y, { side: it.side, s: (it.s || r / 13) * pop, ech: d.ech ?? it.ech, name: d.name, kind: d.kind || it.kind, dead });
      else { pawn(g, X, Y, { side: it.side, s: (it.s || r / 12) * pop, dead }); if (d.name) ctag(g, d.name, X, Y + 30 * (it.s || r / 12), { size: 24, bg: it.side === 'jp' ? '#d8312a' : '#2457c5', edge: true }); }
    });
  }
  i_scatter(it, t) { // many small dots inside an area (civilians etc); can migrate toward a target polygon
    const g = this.g, v = this.v; const a = env(t, it.t0, it.t1, .5, .6); if (a <= 0) return;
    if (!it._pts) { const rnd = mulberry(it.seed || 7); const named = a => a === 'WALL' ? assets.world.ring : a === 'ZONE' ? assets.world.zone : a; const src = named(it.area) || ringPts(it.center, it.radius); const dst = named(it.toArea); it._pts = [];
      const bb = bbox(src); let guard = 0;
      while (it._pts.length < it.n && guard++ < it.n * 50) { const p = [lerp(bb[0], bb[2], rnd()), lerp(bb[1], bb[3], rnd())]; if (!inPoly(p, src)) continue;
        let q = null; if (dst) { const b2 = bbox(dst); for (let k = 0; k < 60; k++) { const c = [lerp(b2[0], b2[2], rnd()), lerp(b2[1], b2[3], rnd())]; if (inPoly(c, dst)) { q = c; break; } } }
        it._pts.push([p, q, rnd()]); } }
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = a; g.fillStyle = it.color || '#ffffff';
    const share = it.share ?? 1; const m0 = it.m0 ?? it.t0, m1 = it.m1 ?? (it.t0 + 4);
    for (const [p, q, rr] of it._pts) {
      let P = p; if (q && rr < share) { const u = easeIO((t - m0 - rr * 1.2) / (m1 - m0)); P = [lerp(p[0], q[0], u), lerp(p[1], q[1], u)]; }
      const [X, Y] = v.p(...P); g.beginPath(); g.arc(X, Y, it.r || 3.2, 0, 7); g.fill();
    }
  }
  i_ring(it, t) { // pulsing halo
    const g = this.g; const a = env(t, it.t0, it.t1, .3, .4); if (a <= 0) return; const [X, Y] = this.v.p(...this.pt(it.at));
    g.setTransform(1, 0, 0, 1, 0, 0); const R = it.rpx || (it.rm ? this.v.px(it.rm) : 90);
    for (let k = 0; k < 2; k++) { const ph = ((t - it.t0) * .7 + k * .5) % 1; g.globalAlpha = a * (1 - ph) * .9; g.beginPath(); g.arc(X, Y, R * (.6 + ph * .8), 0, 7); g.lineWidth = 6; g.strokeStyle = it.color || '#fff3b0'; g.stroke(); }
    g.globalAlpha = a; g.beginPath(); g.arc(X, Y, R * .6, 0, 7); g.lineWidth = 4; g.strokeStyle = it.color || '#fff3b0'; g.stroke();
  }
  i_gateX(it, t) { // X over gates one after another
    const g = this.g; const a = env(t, it.t0, it.t1, .2, .4); g.setTransform(1, 0, 0, 1, 0, 0);
    it.gates.forEach((id, k) => { const ts = it.t0 + k * (it.step || .45); if (t < ts) return; const u = easeOut((t - ts) / .3);
      const [X, Y] = this.v.p(...this.pt('gate:' + id)); const s = (it.size || 22) * (1.6 - .6 * u);
      g.globalAlpha = a * u; g.lineCap = 'round'; for (const [w, c] of [[13, 'rgba(0,0,0,.7)'], [8, it.color || COL.jp]]) { g.lineWidth = w; g.strokeStyle = c; g.beginPath(); g.moveTo(X - s, Y - s); g.lineTo(X + s, Y + s); g.moveTo(X + s, Y - s); g.lineTo(X - s, Y + s); g.stroke(); } });
    if (it.keep) it.keep.forEach(id => { const [X, Y] = this.v.p(...this.pt('gate:' + id)); const pulse = .5 + .5 * Math.sin((t - it.t0) * 5); g.globalAlpha = a; g.beginPath(); g.arc(X, Y, 16 + pulse * 5, 0, 7); g.fillStyle = '#ffd34d'; g.fill(); g.lineWidth = 4; g.strokeStyle = '#000'; g.stroke(); });
  }
  i_breach(it, t) { // red flash on the wall at a point: the wall "breaks"
    const g = this.g; const a = env(t, it.t0, it.t1, .1, .5); const [X, Y] = this.v.p(...this.pt(it.at)); const u = easeOut((t - it.t0) / .5);
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = a; g.beginPath(); g.arc(X, Y, (it.rpx || 28) * (0.5 + u * .5), 0, 7); g.fillStyle = COL.jp; g.fill();
    g.lineWidth = 5; g.strokeStyle = '#fff'; g.stroke(); const fl = 1 - clamp((t - it.t0) / .6); if (fl > 0) { g.globalAlpha = fl; g.beginPath(); g.arc(X, Y, 90 * u, 0, 7); g.fillStyle = 'rgba(255,230,150,.8)'; g.fill(); }
  }
  i_icon(it, t) { // moving plane / ship / steamer marker along a path; optional sink
    const g = this.g, v = this.v; const a = env(t, it.t0, it.t1, .25, .4); if (a <= 0) return;
    const pts = it.path.map(p => this.pt(p)); const u = easeIO((t - (it.m0 ?? it.t0)) / ((it.m1 ?? it.t1) - (it.m0 ?? it.t0)));
    const sp = partial(pts.map(p => v.p(...p)), Math.max(u, .001)); const P = sp[sp.length - 1], Q = sp[Math.max(0, sp.length - 2)];
    let ang = Math.atan2(P[1] - Q[1], P[0] - Q[0]); if (sp.length < 2) { const b = v.p(...pts[1]), c = v.p(...pts[0]); ang = Math.atan2(b[1] - c[1], b[0] - c[0]); }
    let sa = a; if (it.sinkAt != null && t > it.sinkAt) { sa *= 1 - clamp((t - it.sinkAt) / 1.2); }
    const s = it.size || 1; g.setTransform(1, 0, 0, 1, 0, 0);
    if (sp.length > 2) { const tail = sp.slice(Math.max(0, sp.length - 40)); g.globalAlpha = sa * .7; g.lineCap = 'round';
      if (it.kind === 'plane') { for (const off of [-14, 14]) { g.beginPath(); tail.forEach((q, i) => { const nx = -Math.sin(ang) * off * s, ny = Math.cos(ang) * off * s; i ? g.lineTo(q[0] + nx, q[1] + ny) : g.moveTo(q[0] + nx, q[1] + ny); }); const lg = g.createLinearGradient(tail[0][0], tail[0][1], P[0], P[1]); lg.addColorStop(0, 'rgba(255,255,255,0)'); lg.addColorStop(1, 'rgba(255,255,255,.75)'); g.strokeStyle = lg; g.lineWidth = 4 * s; g.stroke(); } }
      else { const back = [P[0] - Math.cos(ang) * 28 * s, P[1] - Math.sin(ang) * 28 * s]; for (const sd of [-1, 1]) { g.beginPath(); g.moveTo(back[0], back[1]); g.lineTo(back[0] - Math.cos(ang + sd * .35) * 90 * s, back[1] - Math.sin(ang + sd * .35) * 90 * s); const lg = g.createLinearGradient(back[0], back[1], back[0] - Math.cos(ang) * 90 * s, back[1] - Math.sin(ang) * 90 * s); lg.addColorStop(0, 'rgba(255,255,255,.8)'); lg.addColorStop(1, 'rgba(255,255,255,0)'); g.strokeStyle = lg; g.lineWidth = 3 * s; g.stroke(); } } }
    if (it.kind === 'plane') { g.setTransform(1, 0, 0, 1, P[0] + 26 * s, P[1] + 44 * s); g.rotate(ang); g.globalAlpha = sa * .28; g.fillStyle = '#000'; g.beginPath(); g.moveTo(26 * s, 0); g.lineTo(-18 * s, -6 * s); g.lineTo(-10 * s, -26 * s); g.lineTo(-18 * s, -26 * s); g.lineTo(-30 * s, -5 * s); g.lineTo(-38 * s, -5 * s); g.lineTo(-38 * s, 5 * s); g.lineTo(-30 * s, 5 * s); g.lineTo(-18 * s, 26 * s); g.lineTo(-10 * s, 26 * s); g.lineTo(-18 * s, 6 * s); g.closePath(); g.fill(); }
    g.setTransform(1, 0, 0, 1, P[0], P[1]); g.rotate(ang); g.globalAlpha = sa; g.shadowColor = 'rgba(0,0,0,.5)'; g.shadowBlur = 10;
    g.fillStyle = it.side === 'cn' ? COL.cn : it.side === 'jp' ? COL.jp : '#f2f2f2'; g.strokeStyle = '#111'; g.lineWidth = 3;
    g.beginPath();
    if (it.kind === 'plane') { g.moveTo(26 * s, 0); g.lineTo(-18 * s, -6 * s); g.lineTo(-10 * s, -26 * s); g.lineTo(-18 * s, -26 * s); g.lineTo(-30 * s, -5 * s); g.lineTo(-38 * s, -5 * s); g.lineTo(-38 * s, 5 * s); g.lineTo(-30 * s, 5 * s); g.lineTo(-18 * s, 26 * s); g.lineTo(-10 * s, 26 * s); g.lineTo(-18 * s, 6 * s); g.closePath(); }
    else { g.moveTo(30 * s, 0); g.lineTo(14 * s, -10 * s); g.lineTo(-26 * s, -10 * s); g.lineTo(-26 * s, 10 * s); g.lineTo(14 * s, 10 * s); g.closePath(); }
    g.fill(); g.shadowColor = 'transparent'; g.strokeStyle = '#fff'; g.lineWidth = 2.5; g.stroke();
    if (it.sinkAt != null && t > it.sinkAt) { const f = clamp((t - it.sinkAt) / .8); g.globalAlpha = a * (1 - f); g.beginPath(); g.arc(0, 0, 20 + 70 * f, 0, 7); g.strokeStyle = '#fff'; g.lineWidth = 4; g.stroke(); }
  }
  filmIndex(it, t) { return Math.max(0, Math.floor((t - it.t0) * 30 * (it.speed || 1)) + (it.skip || 0)); }
  async ensure(t) { // load the footage frames the next draw needs
    const need = []; for (const it of this.ep.items) if (it.type === 'film' && it.clip && t >= it.t0 - .6 && t <= it.t1 + .1) { const k = this.filmIndex(it, t); for (let j = 0; j < 12; j++) need.push(`footage/${it.clip}/${String(k + 1 + j).padStart(4, '0')}.jpg`); }
    await Promise.all(need.filter(u => !this.frames.has(u)).map(async u => { this.frames.set(u, await loadImg(u)); }));
    if (this.frames.size > 160) for (const k of [...this.frames.keys()].slice(0, this.frames.size - 160)) if (!need.includes(k)) this.frames.delete(k);
  }
  i_film(it, t) { // archive cut-in: footage (frame sequence) or a still with a slow push. mode 'full' = documentary cut over the map; else a framed card
    const g = this.g; const fi = it.fade ?? .45; const a = env(t, it.t0, it.t1, fi, fi); if (a <= 0) return; g.setTransform(1, 0, 0, 1, 0, 0);
    let img; if (it.clip) { const k = Math.min((it.frames || 1e9) - 1, this.filmIndex(it, t)); img = this.frames.get(`footage/${it.clip}/${String(k + 1).padStart(4, '0')}.jpg`); } else img = this.photos[it.img];
    const u = clamp((t - it.t0) / Math.max(.1, it.t1 - it.t0)); const zoom = (it.z0 ?? 1.04) + ((it.z1 ?? 1.12) - (it.z0 ?? 1.04)) * u; // Ken Burns
    const [px0, py0] = it.pan0 || [0, 0], [px1, py1] = it.pan1 || [0, 0]; const pxn = lerp(px0, px1, u), pyn = lerp(py0, py1, u);
    const full = it.mode === 'full'; const bw = full ? W : (it.w || 900), bh = full ? H : (it.h || 560); const [cx, cy] = full ? [W / 2, H / 2] : (it.screen || [W / 2, H / 2]);
    g.globalAlpha = a;
    if (full) { g.fillStyle = '#0b0c0e'; g.fillRect(0, 0, W, H); } else { g.save(); g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = 40; g.fillStyle = '#0b0c0e'; g.fillRect(cx - bw / 2 - 10, cy - bh / 2 - 10, bw + 20, bh + 20); g.restore(); }
    g.save(); g.beginPath(); g.rect(cx - bw / 2, cy - bh / 2, bw, bh); g.clip();
    if (img) { const fit = it.contain ? Math.min(bw / img.width, bh / img.height) : Math.max(bw / img.width, bh / img.height); const sc = fit * zoom; const iw = img.width * sc, ih = img.height * sc;
      g.filter = it.color ? 'none' : `grayscale(1) contrast(1.08) brightness(${it.bright ?? 1})`; g.drawImage(img, cx - iw / 2 + pxn * bw, cy - ih / 2 + pyn * bh, iw, ih); g.filter = 'none'; }
    else { g.fillStyle = '#3a3d41'; g.fillRect(cx - bw / 2, cy - bh / 2, bw, bh); g.fillStyle = '#ddd'; g.font = `700 34px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('ARCHIVE · ' + (it.placeholder || it.clip || it.img), cx, cy); }
    // archive look: soft vignette + faint flicker
    const vg = g.createRadialGradient(cx, cy, Math.min(bw, bh) * .35, cx, cy, Math.max(bw, bh) * .75); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.55)'); g.fillStyle = vg; g.fillRect(cx - bw / 2, cy - bh / 2, bw, bh);
    if (it.clip) { g.globalAlpha = a * .05 * (1 + Math.sin(t * 47.3)); g.fillStyle = '#fff'; g.fillRect(cx - bw / 2, cy - bh / 2, bw, bh); g.globalAlpha = a; }
    g.restore();
    // caption: place · date (top-left), credit (bottom-right) — small, quiet
    const capA = a * clamp((t - it.t0 - .5) / .4); g.globalAlpha = capA; g.textBaseline = 'alphabetic';
    if (it.caption) { const x = full ? 64 : cx - bw / 2 + 24, y = full ? H - 170 : cy + bh / 2 - 28; g.font = `400 40px ${COND}`; g.letterSpacing = '3px'; const tw = g.measureText(it.caption).width;
      g.fillStyle = 'rgba(8,10,14,.7)'; g.fillRect(x - 14, y - 38, tw + 28, 52); g.fillStyle = '#f4f1ea'; g.textAlign = 'left'; g.fillText(it.caption, x, y); g.letterSpacing = '0px'; }
    if (it.credit) { g.font = `500 20px ${FONT}`; g.fillStyle = 'rgba(240,240,240,.75)'; g.textAlign = 'right'; g.fillText(it.credit, full ? W - 40 : cx + bw / 2 - 16, full ? 40 : cy - bh / 2 + 30); }
    g.globalAlpha = 1;
  }
  i_card(it, t) { // photo card pinned to a world point. Missing photo -> labelled placeholder.
    const g = this.g; const a = env(t, it.t0, it.t1, .3, .3); if (a <= 0) return; const pop = easeOut((t - it.t0) / .45);
    const [X, Y] = it.at ? this.v.p(...this.pt(it.at)) : [W / 2, H * .4];
    const cw = it.w || 560, ch = it.h || 400, cx = it.screen ? it.screen[0] : X + (it.dx ?? 0), cy0 = it.screen ? it.screen[1] : Y + (it.dy ?? -330);
    const cy = Math.min(Math.max(cy0, LAY.safeTop + ch / 2), LAY.cardBottom - ch / 2 - 80); const cxc = Math.min(Math.max(cx, cw / 2 + 40), W - cw / 2 - 40);
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = a;
    if (it.at) { g.strokeStyle = '#fff'; g.lineWidth = 4; g.beginPath(); g.moveTo(X, Y); g.lineTo(cxc, cy + ch / 2 * pop); g.stroke(); g.beginPath(); g.arc(X, Y, 10, 0, 7); g.fillStyle = '#fff'; g.fill(); g.strokeStyle = '#000'; g.lineWidth = 3; g.stroke(); }
    g.translate(cxc, cy); g.scale(.5 + .5 * pop, .5 + .5 * pop); g.rotate((it.tilt ?? -1.5) * Math.PI / 180);
    const pad = 12, capH = it.caption ? 74 : 0; g.shadowColor = 'rgba(0,0,0,.5)'; g.shadowBlur = 30; g.fillStyle = '#f7f3ea';
    rr(g, -cw / 2 - pad, -ch / 2 - pad, cw + pad * 2, ch + pad * 2 + capH, 6); g.fill(); g.shadowBlur = 0;
    const img = this.photos[it.img];
    if (img) { const sc = Math.max(cw / img.width, ch / img.height); const iw = img.width * sc, ih = img.height * sc; g.save(); g.beginPath(); g.rect(-cw / 2, -ch / 2, cw, ch); g.clip(); g.filter = it.color ? 'none' : 'grayscale(1) contrast(1.05)'; g.drawImage(img, -iw / 2 + (it.ox || 0) * iw, -ih / 2 + (it.oy || 0) * ih, iw, ih); g.restore(); g.filter = 'none'; }
    else { g.fillStyle = '#6c6f73'; g.fillRect(-cw / 2, -ch / 2, cw, ch); g.fillStyle = '#e6e6e6'; g.font = `700 30px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle'; wrap(g, 'PHOTO · ' + (it.placeholder || it.img || 'to find'), 0, 0, cw - 60, 38); }
    if (it.caption) { g.fillStyle = '#222'; g.font = `700 28px ${FONT}`; g.textAlign = 'left'; g.textBaseline = 'top'; g.fillText(it.caption, -cw / 2, ch / 2 + 16); if (it.credit) { g.font = `500 21px ${FONT}`; g.fillStyle = '#555'; g.fillText(it.credit, -cw / 2, ch / 2 + 50); } }
  }
  i_portrait(it, t) { // round head-shot with name
    const g = this.g; const a = env(t, it.t0, it.t1, .3, .3); if (a <= 0) return; const pop = easeOut((t - it.t0) / .4);
    let [X, Y] = it.screen || this.v.p(...this.pt(it.at)); if (!it.screen) { X += it.dx ?? 0; Y += it.dy ?? -200; }
    const R = (it.r || 105) * (.6 + .4 * pop); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = a;
    g.save(); g.beginPath(); g.arc(X, Y, R, 0, 7); g.fillStyle = '#5d6166'; g.fill(); g.clip(); const img = this.photos[it.img];
    if (img) { const sc = 2 * R / Math.min(img.width, img.height) * (it.zoom || 1); g.filter = 'grayscale(1)'; g.drawImage(img, X - img.width * sc / 2 + (it.ox || 0) * R, Y - img.height * sc / 2 + (it.oy || 0) * R, img.width * sc, img.height * sc); g.filter = 'none'; }
    else { g.fillStyle = '#ddd'; g.font = `700 22px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('PORTRAIT', X, Y); }
    g.restore(); g.beginPath(); g.arc(X, Y, R, 0, 7); g.lineWidth = 8; g.strokeStyle = it.side === 'jp' ? COL.jp : it.side === 'cn' ? COL.cn : '#fff'; g.stroke();
    tag(g, it.name, X, Y + R + 34, { bg: 'rgba(15,18,22,.9)', fg: '#fff', size: 30, a, scale: 1 });
    if (it.sub) tag(g, it.sub, X, Y + R + 86, { bg: it.side === 'jp' ? COL.jp : it.side === 'cn' ? COL.cn : '#444', fg: '#fff', size: 26, a, scale: 1 });
  }
  i_area(it, t) { // outline + fill of a polygon (safety zone etc.), draw-on outline
    const g = this.g, v = this.v; const a = env(t, it.t0, it.t1, .4, .5); if (a <= 0) return;
    const pts = (it.poly === 'zone' ? assets.world.zone : it.poly).map(p => v.p(...this.pt(p)));
    const u = easeIO((t - it.t0) / (it.grow || 1.8)); g.setTransform(1, 0, 0, 1, 0, 0);
    g.globalAlpha = a * u * (it.fillA ?? .28); g.fillStyle = it.fill || '#ffffff'; poly(g, pts); g.closePath(); g.fill();
    g.globalAlpha = a; g.setLineDash(it.dash || []); g.lineJoin = 'round'; const sub = partial([...pts, pts[0]], u);
    g.lineWidth = (it.width || 6) + 5; g.strokeStyle = 'rgba(0,0,0,.6)'; poly(g, sub); g.stroke(); g.lineWidth = it.width || 6; g.strokeStyle = it.stroke || '#fff'; poly(g, sub); g.stroke(); g.setLineDash([]);
  }
  i_fires(it, t) { // timeline fires: flicker while burning (story time), then charred
    const g = this.g, v = this.v; const a = env(t, it.t0, it.t1, .4, .4); if (a <= 0) return; const now = this.now;
    g.setTransform(1, 0, 0, 1, 0, 0);
    for (const f of assets.world.fires) {
      if (it.kinds && !it.kinds.includes(f.kind)) continue; const ig = isoT(f.ignite), out = f.out ? isoT(f.out) : ig + 4320; if (now < ig) continue;
      const pts = f.coords.map(p => v.p(...p)); const burnU = clamp((now - ig) / Math.max(60, out - ig));
      g.globalAlpha = a * clamp(burnU * 2) * (it.charA ?? .72) * clamp(f.i * 1.6, .14, 1); g.fillStyle = COL.char; poly(g, pts); g.closePath(); g.fill();
      if (now < out) { const fl = .55 + .45 * Math.sin(t * 13 + ig) * Math.sin(t * 7.3 + ig * .5); const rnd = mulberry((ig | 0) + 3); const bb = bbox(pts);
        for (let k = 0; k < Math.round(4 + 14 * f.i); k++) { const p = [lerp(bb[0], bb[2], rnd()), lerp(bb[1], bb[3], rnd())]; if (!inPoly(p, pts)) continue; const rr = (10 + 16 * rnd()) * (.7 + .5 * fl);
          const grd = g.createRadialGradient(p[0], p[1], 0, p[0], p[1], rr * 2.2); grd.addColorStop(0, 'rgba(255,220,120,.95)'); grd.addColorStop(.4, 'rgba(255,120,30,.7)'); grd.addColorStop(1, 'rgba(200,40,10,0)');
          g.globalAlpha = a * clamp(.35 + f.i, 0, 1); g.fillStyle = grd; g.beginPath(); g.arc(p[0], p[1], rr * 2.2, 0, 7); g.fill(); } }
    }
  }
  i_panel(it, t) { // screen-space full-width statement (split numbers etc.)
    const g = this.g; const a = env(t, it.t0, it.t1, .35, .4); if (a <= 0) return; g.setTransform(1, 0, 0, 1, 0, 0);
    g.globalAlpha = a * (it.dim ?? .55); g.fillStyle = '#0d1114'; g.fillRect(0, 0, W, H); g.globalAlpha = a;
    const rows = it.rows; rows.forEach((r, k) => { const ts = it.t0 + (r.delay ?? k * .9); if (t < ts) return; const u = easeOut((t - ts) / .4);
      const y = (it.y || 560) + k * (it.gap || 300); g.globalAlpha = a * u; g.textAlign = 'center';
      g.save(); g.translate(W / 2, y); const sc = easeBack((t - ts) / .5); g.scale(sc, sc);
      txt(g, r.big, 0, 0, { size: r.size || 120, weight: 900, grad: r.color === 'jp' ? ['#ff9b7f', '#d8452b'] : r.color === 'cn' ? ['#a9c9ff', '#4d86ec'] : ['#ffffff', '#dfe3e8'] }); g.restore();
      if (r.small) txt(g, r.small, W / 2, y + 62, { size: r.ssize || 40, weight: 800 });
      if (r.note) txt(g, r.note, W / 2, y + 108, { size: 28, weight: 600, fill: '#c3c8cf', sw: 5 }); });
  }
  i_handoff(it, t) { // sandbox segment. Preview: the map stands in, with a badge. ?handoff=1 -> black placeholder.
    if (!it.sandbox) { if (it.photo) { this.i_ring({ at: it.photo.at, t0: it.t0, t1: it.t1, rpx: 60 }, t); this.i_card({ ...it.photo, t0: it.t0 + .4, t1: it.t1 - .2, type: 'card' }, t); } return; }
    const g = this.g; g.setTransform(1, 0, 0, 1, 0, 0);
    if (this.ep.showHandoff) { g.globalAlpha = .92; g.fillStyle = '#111'; g.fillRect(0, 0, W, H); g.globalAlpha = 1; }
    if (!this.ep.final) g.globalAlpha = .85, ctag(g, 'SANDBOX ' + (it.shot || it.id), W - 40, 120, { size: 30, bg: '#ffd24d', fg: '#111', align: 'left', scale: 1 }); g.globalAlpha = 1;
  }
  i_versus(it, t) { // "THE TRAP"-style VS card: two sides, portraits, flags, numbers, stake line
    const g = this.g; const a = env(t, it.t0, it.t1, .3, .35); if (a <= 0) return; g.setTransform(1, 0, 0, 1, 0, 0);
    const cw = it.w || 880, ch = 560; const [X, Y] = it.screen || [W / 2, 1150]; const u = easeOut((t - it.t0) / .5), ub = easeBack((t - it.t0) / .55);
    const K = it.k || 1.12; g.globalAlpha = a; g.translate(X, Y); g.scale(K * (.85 + .15 * ub), K * (.85 + .15 * ub)); const x0 = -cw / 2, y0 = -ch / 2;
    g.save(); g.shadowColor = 'rgba(0,0,0,.65)'; g.shadowBlur = 40; g.shadowOffsetY = 14; g.fillStyle = '#0f1115'; g.fillRect(x0, y0, cw, ch); g.restore();
    g.fillStyle = '#d8312a'; g.fillRect(x0 + 34, y0 + 36, 10, 10); g.font = `400 26px ${COND}`; g.letterSpacing = '3px'; g.fillStyle = '#e8e3da'; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(it.kicker || '', x0 + 54, y0 + 43);
    g.font = `400 96px ${COND}`; g.letterSpacing = '2px'; g.fillStyle = '#fff'; g.textBaseline = 'alphabetic'; g.fillText(it.title, x0 + 32, y0 + 146); g.letterSpacing = '0px';
    const py = y0 + 170, ph_ = 280, half = (cw - 64) / 2;
    [['L', it.left], ['R', it.right]].forEach(([sd, S], k) => { const px = x0 + 32 + k * half; const col = S.side === 'jp' ? '#c7372b' : '#2453b8'; const du = easeOut((t - it.t0 - .2 - k * .15) / .45);
      g.save(); g.beginPath(); g.rect(px, py, half, ph_); g.clip(); g.fillStyle = col; g.fillRect(px + (k ? 1 : -1) * (1 - du) * half, py, half, ph_);
      const img = this.photos[S.img]; const pw = 170, pyy = py + 22, pxx = k ? px + half - pw - 22 : px + 22;
      g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(pxx, pyy, pw, 200); if (img) { const sc = Math.max(pw / img.width, 200 / img.height); g.save(); g.beginPath(); g.rect(pxx, pyy, pw, 200); g.clip(); g.filter = 'grayscale(1) contrast(1.1)'; g.drawImage(img, pxx + pw / 2 - img.width * sc / 2, pyy + 100 - img.height * sc / 2, img.width * sc, img.height * sc); g.restore(); g.filter = 'none'; } else { g.fillStyle = 'rgba(255,255,255,.6)'; g.font = `400 22px ${COND}`; g.textAlign = 'center'; g.fillText('PORTRAIT', pxx + pw / 2, pyy + 106); }
      g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = 3; g.strokeRect(pxx, pyy, pw, 200);
      const fx = k ? px + 22 : px + half - 22 - 66, fy = pyy; flag(g, S.side, fx, fy, 66, 44);
      g.textAlign = k ? 'right' : 'left'; const tx = k ? px + half - 22 : px + 22; g.fillStyle = '#fff'; g.font = `400 44px ${COND}`; g.letterSpacing = '2px'; g.textBaseline = 'alphabetic';
      const tx2 = k ? px + half - pw - 36 : px + pw + 36, mw = half - pw - 36 - 48; g.textAlign = k ? 'right' : 'left'; g.fillText(S.name, tx2, pyy + 128, mw); g.font = `700 19px ${SUBF}`; g.letterSpacing = '0px'; g.fillStyle = 'rgba(255,255,255,.85)'; g.fillText(S.who || '', tx2, pyy + 156, mw); g.fillText(S.role || '', tx2, pyy + 180, mw);
      g.font = `400 40px ${COND}`; g.letterSpacing = '1px'; g.fillStyle = '#fff'; g.textAlign = k ? 'right' : 'left'; g.fillText(S.num || '', k ? px + half - 22 : px + 22, py + ph_ - 22, half - 60); g.letterSpacing = '0px';
      g.restore(); });
    const vs = easeBack((t - it.t0 - .45) / .4); if (vs > 0) { g.save(); g.translate(x0 + cw / 2, py + 120); g.scale(vs, vs); g.fillStyle = '#0f1115'; g.beginPath(); g.arc(0, 0, 34, 0, 7); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 3; g.stroke(); g.fillStyle = '#fff'; g.font = `400 34px ${COND}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('VS', 0, 2); g.restore(); }
    if (it.stake) { g.font = `400 22px ${COND}`; g.letterSpacing = '3px'; g.fillStyle = '#d8312a'; g.textAlign = 'left'; g.textBaseline = 'alphabetic'; g.fillText('AT STAKE', x0 + 32, y0 + ch - 50); g.font = `400 36px ${COND}`; g.fillStyle = '#fff'; g.fillText(it.stake, x0 + 32, y0 + ch - 16); g.letterSpacing = '0px'; }
  }
  i_title(it, t) { // screen-space big line (end card etc.)
    const g = this.g; const a = env(t, it.t0, it.t1, .3, .3); if (a <= 0) return; g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = a;
    const y = it.y || LAY.titleY; const pop = easeBack((t - it.t0) / .5); g.translate(W / 2, y); g.scale(pop, pop);
    txt(g, it.text, 0, 0, { size: it.size || 60, weight: 900 });
    if (it.sub) { const u = easeOut((t - it.t0 - .35) / .4); g.font = `900 ${(it.size || 60) * .62}px ${FONT}`; const sw = g.measureText(it.sub).width + 60, sh_ = (it.size || 60) * .95;
      g.save(); g.shadowColor = 'rgba(0,0,0,.5)'; g.shadowBlur = 20; g.shadowOffsetY = 6; g.fillStyle = '#e62117'; rr(g, -sw / 2 * u, 34, sw * u, sh_, sh_ / 2); g.fill(); g.restore();
      if (u > .5) { g.globalAlpha = a * clamp((u - .5) * 2); g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(it.sub, 0, 34 + sh_ / 2 + 2); } }
  }
  i_info(it, t) { // detailed info card: header band, photo/portrait, rows of facts. Slides in, rows stagger.
    const g = this.g; const a = env(t, it.t0, it.t1, .3, .35); if (a <= 0) return; g.setTransform(1, 0, 0, 1, 0, 0);
    const cw = it.w || 640, rowH = 54, ph = it.img || it.portrait ? 150 : 0; const rows = it.rows || [];
    const ch = 118 + Math.max(ph, rows.length * rowH + 10) + (it.foot ? 44 : 0) + 18;
    let X, Y; if (it.screen) [X, Y] = it.screen; else { const P = this.v.p(...this.pt(it.at)); X = P[0] + (it.dx ?? 0); Y = P[1] + (it.dy ?? -260); }
    const K = it.k || 1.32; X = clamp(X, cw * K / 2 + 30, W - cw * K / 2 - 30); Y = clamp(Y, LAY.safeTop + ch * K / 2, LAY.safeBottom - ch * K / 2);
    const from = it.from || (X < W / 2 ? 'left' : 'right'); const u = easeOut((t - it.t0) / .55), ub = easeBack((t - it.t0) / .6);
    const sx = (1 - u) * (from === 'left' ? -1 : 1) * 260; const col = it.side === 'jp' ? COL.jp : it.side === 'cn' ? COL.cn : '#3a3f46';
    if (it.at) { const P = this.v.p(...this.pt(it.at)); g.globalAlpha = a * u; g.save(); g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = 8; g.strokeStyle = '#fff'; g.lineWidth = 3; g.beginPath(); g.moveTo(P[0], P[1]); g.lineTo(X + sx, Y + ch / 2 - 4); g.stroke(); g.restore(); g.beginPath(); g.arc(P[0], P[1], 10, 0, 7); g.fillStyle = col; g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 3; g.stroke(); }
    g.globalAlpha = a; g.translate(X + sx, Y); g.scale(K, K); const x0 = -cw / 2, y0 = -ch / 2;
    // glass body (blurred map behind)
    g.save(); rr(g, x0, y0, cw, ch, 14); g.clip(); if (!this.ep.overlay) { try { g.filter = 'blur(14px)'; g.drawImage(this.c, X + sx + (x0 - 20) * K, Y + (y0 - 20) * K, (cw + 40) * K, (ch + 40) * K, x0 - 20, y0 - 20, cw + 40, ch + 40); } catch (e) {} g.filter = 'none'; }
    g.fillStyle = 'rgba(12,15,20,.80)'; g.fillRect(x0, y0, cw, ch); g.restore();
    g.save(); g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = 34; g.shadowOffsetY = 12; g.strokeStyle = 'rgba(255,255,255,.18)'; g.lineWidth = 2; rr(g, x0, y0, cw, ch, 14); g.stroke(); g.restore();
    // header band
    const hb = 104; g.save(); rr(g, x0, y0, cw, ch, 14); g.clip(); const hg = g.createLinearGradient(x0, 0, x0 + cw, 0); hg.addColorStop(0, col); hg.addColorStop(1, shade(col, -.45)); g.fillStyle = hg; g.fillRect(x0, y0, cw * clamp(u * 1.3), hb);
    g.globalAlpha = a * .25; g.strokeStyle = '#fff'; g.lineWidth = 2; for (let k = -6; k < 30; k++) { g.beginPath(); g.moveTo(x0 + k * 26, y0 + hb); g.lineTo(x0 + k * 26 + hb, y0); g.stroke(); } g.globalAlpha = a; g.restore();
    let bw = 0; if (it.badge) { g.font = `900 22px ${FONT}`; bw = g.measureText(it.badge).width + 24; g.fillStyle = 'rgba(0,0,0,.35)'; rr(g, x0 + cw - bw - 18, y0 + 16, bw, 34, 6); g.fill(); g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(it.badge, x0 + cw - 18 - bw / 2, y0 + 34); }
    g.textAlign = 'left'; g.textBaseline = 'alphabetic'; let tx = x0 + 28;
    if (it.unit) { nato(g, x0 + 58, y0 + hb / 2 + 6, { side: it.side, s: 1.25, ech: it.unit.ech, kind: it.unit.kind }); tx = x0 + 108; }
    let ts = it.tsize || 56; g.font = `400 ${ts}px ${COND}`; g.letterSpacing = '2px'; const tw = g.measureText(it.title).width; g.letterSpacing = '0px'; const room = x0 + cw - (bw ? bw + 30 : 24) - tx; if (tw > room) ts *= room / tw;
    txt(g, it.title, tx, y0 + 62, { size: ts, weight: 400, font: COND, align: 'left', sw: 5, track: 2 });
    if (it.sub) { g.globalAlpha = a * .92; g.font = `700 21px ${SUBF}`; g.fillStyle = 'rgba(255,255,255,.92)'; g.fillText(it.sub.toUpperCase(), tx, y0 + 90); g.globalAlpha = a; }
    // portrait / photo
    let rx = x0 + 28; const ry = y0 + hb + 24;
    if (ph) { const img = this.photos[it.img || it.portrait]; const pw = it.portrait ? ph : ph * 1.35; g.save(); rr(g, rx, ry, pw, ph, it.portrait ? ph / 2 : 8); g.clip(); g.fillStyle = '#4b5057'; g.fillRect(rx, ry, pw, ph);
      if (img) { const sc = Math.max(pw / img.width, ph / img.height) * (it.zoom || 1); g.filter = 'grayscale(1) contrast(1.1)'; g.drawImage(img, rx + pw / 2 - img.width * sc / 2 + (it.ox || 0) * pw, ry + ph / 2 - img.height * sc / 2 + (it.oy || 0) * ph, img.width * sc, img.height * sc); g.filter = 'none'; }
      else { g.fillStyle = '#c9cdd2'; g.font = `800 18px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(it.portrait ? 'PORTRAIT' : 'PHOTO', rx + pw / 2, ry + ph / 2); }
      g.restore(); g.lineWidth = 4; g.strokeStyle = col; rr(g, rx, ry, pw, ph, it.portrait ? ph / 2 : 8); g.stroke(); rx += pw + 26; }
    // rows
    rows.forEach(([k, v_, hl], i) => { const ts = it.rowT?.[i] ?? it.t0 + .35 + i * .18; const ru = easeOut((t - ts) / .35); if (ru <= 0) return; const yy = ry + 8 + i * rowH; g.globalAlpha = a * ru; const dx = (1 - ru) * 30;
      g.textAlign = 'left'; g.textBaseline = 'top'; g.font = `400 22px ${COND}`; g.letterSpacing = '2px'; g.fillStyle = it.side === 'jp' ? '#ff9b82' : it.side === 'cn' ? '#8fb6ff' : '#b9bec6'; g.fillText(k.toUpperCase(), rx + dx, yy);
      g.letterSpacing = '0px'; g.font = `${hl ? 800 : 700} ${hl ? 29 : 25}px ${SUBF}`; g.fillStyle = '#fff'; g.fillText(v_, rx + dx, yy + 22); });
    g.globalAlpha = a; if (it.foot) { g.fillStyle = 'rgba(255,255,255,.55)'; g.font = `600 20px ${FONT}`; g.textAlign = 'left'; g.textBaseline = 'bottom'; g.fillText(it.foot, x0 + 28, y0 + ch - 16); }
  }
  i_blasts(it, t) { // artillery: flash, shock ring, smoke puffs, sparks. Deterministic.
    const g = this.g, v = this.v; const a = env(t, it.t0, it.t1, .2, .6); if (a <= 0) return; g.setTransform(1, 0, 0, 1, 0, 0);
    if (!it._ev) { const r = mulberry(it.seed || 11); it._ev = []; const area = it.area === 'WALL' ? assets.world.ring : it.area; const path = it.path ? catmull(it.path.map(p => this.pt(p)), 12) : null;
      for (let k = 0; k < (it.n || 30); k++) { let p; if (path) { const q = pointAt(path, r() * pathLen(path)); p = [q[0] + (r() - .5) * (it.spread || 600), q[1] + (r() - .5) * (it.spread || 600)]; }
        else if (area) { const bb = bbox(area); for (let j = 0; j < 50; j++) { const c = [lerp(bb[0], bb[2], r()), lerp(bb[1], bb[3], r())]; if (it.onEdge) { const e = area[Math.floor(r() * area.length)]; p = [e[0] + (r() - .5) * 400, e[1] + (r() - .5) * 400]; break; } if (inPoly(c, area)) { p = c; break; } } }
        else { const c = this.pt(it.at); const ang = r() * 6.283, d = Math.sqrt(r()) * (it.radius || 2000); p = [c[0] + Math.cos(ang) * d, c[1] + Math.sin(ang) * d]; }
        if (p) it._ev.push({ p, t: it.t0 + r() * (it.t1 - it.t0 - .5), s: .7 + r() * .6, seed: r() * 1000 }); } }
    const sc = it.scale || 1;
    for (const e of it._ev) { const dt = t - e.t; if (dt < 0 || dt > 2.2) continue; const [X, Y] = v.p(...e.p); const S = 34 * e.s * sc;
      for (let k = 0; k < 3; k++) { const pu = clamp((dt - k * .08) / 2.1); if (pu <= 0) continue; const R = S * (.5 + pu * 1.6); const ox = Math.sin(e.seed + k * 2) * S * .5 + pu * S * .6, oy = Math.cos(e.seed + k * 3) * S * .35 - pu * S * .5;
        const sg = g.createRadialGradient(X + ox, Y + oy, 0, X + ox, Y + oy, R); sg.addColorStop(0, `rgba(70,66,62,${.55 * (1 - pu) * a})`); sg.addColorStop(1, 'rgba(70,66,62,0)'); g.fillStyle = sg; g.beginPath(); g.arc(X + ox, Y + oy, R, 0, 7); g.fill(); }
      const fl = clamp(1 - dt / .22); if (fl > 0) { g.save(); g.globalCompositeOperation = 'lighter'; const fg = g.createRadialGradient(X, Y, 0, X, Y, S * 1.6); fg.addColorStop(0, `rgba(255,250,220,${a * fl})`); fg.addColorStop(.35, `rgba(255,190,90,${.8 * a * fl})`); fg.addColorStop(1, 'rgba(255,90,20,0)'); g.fillStyle = fg; g.beginPath(); g.arc(X, Y, S * 1.6, 0, 7); g.fill(); g.restore(); }
      const ru = clamp(dt / .5); if (ru < 1) { g.globalAlpha = a * (1 - ru) * .8; g.strokeStyle = '#ffe2b8'; g.lineWidth = 3; g.beginPath(); g.arc(X, Y, S * (.3 + ru * 1.8), 0, 7); g.stroke(); g.globalAlpha = 1; }
      if (dt < .5) { g.strokeStyle = `rgba(255,210,140,${a * (1 - dt / .5)})`; g.lineWidth = 2; for (let k = 0; k < 6; k++) { const an = e.seed + k * 1.05, d0 = S * .3 + dt * S * 3, d1 = d0 + S * .35; g.beginPath(); g.moveTo(X + Math.cos(an) * d0, Y + Math.sin(an) * d0); g.lineTo(X + Math.cos(an) * d1, Y + Math.sin(an) * d1); g.stroke(); } } }
  }
  i_barrage(it, t) { // artillery fire on the pitched map: batteries (from) lob glowing shells on arcs onto a target area; impact flash, then smoke columns that rise and drift
    const g = this.g, v = this.v; const a = env(t, it.t0, it.t1 + 4, .3, 1.2); if (a <= 0) return; g.setTransform(1, 0, 0, 1, 0, 0);
    if (!it._sh) { const r = mulberry(it.seed || 5); const src = it.from.map(p => this.pt(p)); const c = this.pt(it.at); it._sh = [];
      const n = Math.round((it.t1 - it.t0) * (it.rate || 3)); for (let k = 0; k < n; k++) { const s0 = src[Math.floor(r() * src.length)]; const ang = r() * 6.283, d = Math.sqrt(r()) * (it.radius || 400);
        const fl = (it.flight || 1.3) * (.8 + r() * .4); it._sh.push({ s: [s0[0] + (r() - .5) * 300, s0[1] + (r() - .5) * 300], e: [c[0] + Math.cos(ang) * d, c[1] + Math.sin(ang) * d], t: it.t0 + (k + r() * .8) / (it.rate || 3), fl, h: (it.arc || 160) * (.8 + r() * .4), seed: r() * 100 }); } }
    const pxs = v.px(1);
    // smoke first (under the shells), rising upright regardless of the ground pitch
    for (const sh of it._sh) { const dt = t - sh.t - sh.fl; if (dt < 0 || dt > 5) continue; const [X, Y] = v.p(...sh.e); const S = Math.max(10, Math.min(60, (it.size || 90) * pxs * 14));
      for (let k = 0; k < 3; k++) { const u = clamp((dt - k * .25) / 4.6); if (u <= 0) continue; const R = S * (.6 + u * 1.9); const ox = Math.sin(sh.seed + k) * S * .3 + u * S * (it.wind ?? .9), oy = -u * S * (1.6 + k * .5);
        const sg = g.createRadialGradient(X + ox, Y + oy, 0, X + ox, Y + oy, R); const al = .42 * (1 - u) * a; sg.addColorStop(0, `rgba(58,56,54,${al})`); sg.addColorStop(1, 'rgba(58,56,54,0)'); g.fillStyle = sg; g.beginPath(); g.arc(X + ox, Y + oy, R, 0, 7); g.fill(); } }
    g.save(); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round';
    for (const sh of it._sh) { const dt = t - sh.t; if (dt < -0.01 || dt > sh.fl + .5) continue; const P = v.p(...sh.s), Q = v.p(...sh.e); const at = u => { const k = clamp(u); return [lerp(P[0], Q[0], k), lerp(P[1], Q[1], k) - Math.sin(Math.PI * k) * sh.h]; };
      if (dt < .12) { const fg = g.createRadialGradient(P[0], P[1], 0, P[0], P[1], 26); fg.addColorStop(0, `rgba(255,230,170,${a * (1 - dt / .12)})`); fg.addColorStop(1, 'rgba(255,160,60,0)'); g.fillStyle = fg; g.beginPath(); g.arc(P[0], P[1], 26, 0, 7); g.fill(); } // muzzle flash
      const u = dt / sh.fl; if (u < 1) { const tail = 7; g.beginPath(); for (let j = 0; j <= tail; j++) { const q = at(u - j * .022); j ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]); }
        g.strokeStyle = `rgba(255,190,110,${.55 * a})`; g.lineWidth = 5; g.stroke(); g.strokeStyle = `rgba(255,245,215,${.95 * a})`; g.lineWidth = 2; g.stroke(); }
      else { const d = dt - sh.fl; const fl = clamp(1 - d / .28); if (fl > 0) { const R = 46 * (1 + d * 2); const fg = g.createRadialGradient(Q[0], Q[1], 0, Q[0], Q[1], R); fg.addColorStop(0, `rgba(255,248,215,${a * fl})`); fg.addColorStop(.35, `rgba(255,170,80,${.75 * a * fl})`); fg.addColorStop(1, 'rgba(255,120,40,0)'); g.fillStyle = fg; g.beginPath(); g.arc(Q[0], Q[1], R, 0, 7); g.fill(); }
        const ru = clamp(d / .45); if (ru < 1) { g.globalAlpha = (1 - ru) * .6 * a; g.strokeStyle = '#ffd9a8'; g.lineWidth = 2; g.beginPath(); g.ellipse(Q[0], Q[1], 10 + ru * 60, (10 + ru * 60) * .55, 0, 0, 7); g.stroke(); g.globalAlpha = 1; } } }
    g.restore();
  }
  i_tracers(it, t) { // small-arms / machine-gun fire between two lines: short fast streaks, flickering (battle only)
    const g = this.g, v = this.v; const a = env(t, it.t0, it.t1, .2, .5); if (a <= 0) return; g.setTransform(1, 0, 0, 1, 0, 0);
    const A = it.from.map(p => this.pt(p)), B = it.to.map(p => this.pt(p)); const r = mulberry(it.seed || 9); const n = it.n || 26, per = it.period || .55;
    g.save(); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round';
    for (let k = 0; k < n; k++) { const ph = r() * per, ia = r(), ib = r(), col = r() < .5 ? (it.c1 || '255,214,120') : (it.c2 || '255,140,90'); const lane = r();
      const pA = pointAt(A, ia * pathLen(A)), pB = pointAt(B, ib * pathLen(B)); const P = v.p(...pA), Q = v.p(...pB);
      const cyc = ((t - it.t0 + ph) % per) / per; if (lane > (it.density ?? .8)) continue; const u0 = cyc, u1 = Math.min(1, cyc + .16);
      g.strokeStyle = `rgba(${col},${.9 * a})`; g.lineWidth = 2.2; g.beginPath(); g.moveTo(lerp(P[0], Q[0], u0), lerp(P[1], Q[1], u0)); g.lineTo(lerp(P[0], Q[0], u1), lerp(P[1], Q[1], u1)); g.stroke(); }
    g.restore();
  }
  i_chapter(it, t) { // big chapter splash under the HUD
    const g = this.g; const a = env(t, it.t0, it.t1, .15, .4); if (a <= 0) return; g.setTransform(1, 0, 0, 1, 0, 0);
    const u = easeOut((t - it.t0) / .5); const y = it.y || 560; g.globalAlpha = a;
    if (it.num) { txt(g, it.num, W / 2, y - Math.max(92, (it.size || 128) * .82), { size: 34, weight: 800, fill: '#ffb39f', track: 10 }); }
    g.save(); g.beginPath(); g.rect(0, y - Math.max(130, (it.size || 128) * .95), W, Math.max(160, (it.size || 128) * 1.2)); g.clip(); g.translate(0, (1 - u) * 110); txt(g, it.text, W / 2, y, { size: it.size || 128, weight: 400, font: COND, track: 6, sw: 8 }); g.restore();
    const lw = 360 * easeOut((t - it.t0 - .15) / .5); g.fillStyle = COL.jp; g.fillRect(W / 2 - lw / 2, y + 24, lw, 8);
  }
  hud(t, now) { // date pill (white, red square) + numbered chapter tag
    const g = this.g, ep = this.ep; g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1;
    const fullK = ep.items.reduce((m, it) => it.type === 'film' && it.mode === 'full' ? Math.max(m, env(t, it.t0, it.t1, it.fade ?? .45, it.fade ?? .45)) : m, 0); if (fullK >= .99) return; // archive cut-ins carry their own caption
    const hd = ep.hideDate ? (Array.isArray(ep.hideDate[0]) ? ep.hideDate : [ep.hideDate]) : []; const hidden = hd.some(([a, b]) => t >= a && t <= b);
    let a0 = hidden ? 0 : 1; for (const [a, b] of hd) { if (t > b) a0 = Math.min(a0, clamp((t - b) / .35)); if (t < a) a0 = Math.min(a0, clamp((a - t) / .35)); } a0 *= 1 - fullK; g.globalAlpha = a0; // hideDate hides only the date pill; the chapter tag stays
    const withTime = ep.clock && ep.clock.some(([a, b]) => t >= a && t <= b);
    const d = new Date(Date.UTC(1937, 10, 1) + now * 60000); let ds = `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`; if (ep.datePrefix) ds = ep.datePrefix + ' ' + ds;
    const x0 = LAY.hudX, y0 = LAY.hudY; g.font = `400 44px ${COND}`; g.letterSpacing = '3px'; const w = g.measureText(ds).width; const bw = w + 74, bh = 56;
    g.save(); g.shadowColor = 'rgba(0,0,0,.5)'; g.shadowBlur = 16; g.shadowOffsetY = 5; g.fillStyle = '#f7f4ee'; rr(g, x0, y0, bw, bh, 5); g.fill(); g.restore();
    g.fillStyle = '#d8312a'; g.fillRect(x0 + 18, y0 + bh / 2 - 6, 12, 12); g.fillStyle = '#14161a'; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(ds, x0 + 44, y0 + bh / 2 + 3); g.letterSpacing = '0px';
    if (withTime) { // flip clock
      const hh = String(d.getUTCHours()).padStart(2, '0'), mm = String(d.getUTCMinutes()).padStart(2, '0'); const cx = x0, cy = y0 + bh + 14; g.font = `400 54px ${COND}`;
      [...hh, ':', ...mm].forEach((ch, k) => { const X = cx + k * 44; if (ch === ':') { g.fillStyle = '#fff'; g.textAlign = 'center'; g.fillText(':', X + 18, cy + 34); return; } g.save(); g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = 10; g.fillStyle = '#14161a'; rr(g, X, cy, 38, 62, 5); g.fill(); g.restore(); g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(X, cy + 30, 38, 2); g.fillStyle = '#fff'; g.textAlign = 'center'; g.fillText(ch, X + 19, cy + 34); }); }
    if (ep.legend) for (const [l0, l1] of ep.legend) { const la = env(t, l0, l1, .4, .4); if (la <= 0) continue; g.globalAlpha = la; let lx = LAY.hudX; const ly = LAY.hudY + 4;
      for (const [col, name] of [[COL.jp, 'JAPANESE-HELD'], [COL.cn, 'CHINESE-HELD']]) { g.save(); g.shadowColor = 'rgba(0,0,0,.5)'; g.shadowBlur = 10; g.fillStyle = col; g.fillRect(lx, ly, 34, 34); g.restore(); g.strokeStyle = '#fff'; g.lineWidth = 2.5; g.strokeRect(lx, ly, 34, 34); lx += 48; lx += txt(g, name, lx, ly + 28, { size: 34, weight: 400, font: COND, align: 'left', sw: 5, track: 2 }) + 34; } g.globalAlpha = 1; }
    const phs = ep.phases || []; const ph = phs.filter(p => t >= p.t0 && t <= p.t1).pop();
    if (ph) { const idx = ph.num || String(phs.indexOf(ph) + 1).padStart(2, '0'); const a = env(t, ph.t0, ph.t1, .3, .3) * (1 - fullK); const u = easeOut((t - ph.t0) / .45); g.globalAlpha = a;
      const yy = y0 + bh + (withTime ? 92 : 0) + 84; g.font = `400 40px ${COND}`; g.letterSpacing = '3px'; const w2 = g.measureText(ph.text).width + 40;
      g.save(); g.shadowColor = 'rgba(0,0,0,.5)'; g.shadowBlur = 14; g.fillStyle = '#d8312a'; g.fillRect(x0, yy, 46, 50); g.fillStyle = '#121418'; g.fillRect(x0 + 50, yy, w2 * u, 50); g.restore();
      g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(idx, x0 + 23, yy + 27); if (u > .4) { g.textAlign = 'left'; g.globalAlpha = a * clamp((u - .4) / .4); g.fillText(ph.text, x0 + 70, yy + 27); } g.letterSpacing = '0px'; }
    g.globalAlpha = 1;
  }
  filmCaptions(t) { // long-form subtitles: one quiet line (<= ~56 chars), cut at punctuation / pauses, no word pop
    const ep = this.ep, g = this.g;
    if (!this.lines) { const L = []; let cur = [];
      const flush = () => { if (cur.length) L.push(cur); cur = []; };
      ep.words.forEach((w, i) => { const nx = ep.words[i + 1]; const txt_ = [...cur, w].map(x => x.word).join(' ');
        if (cur.length && txt_.length > 56) flush(); cur.push(w); const gap = nx ? nx.start - w.end : 9;
        if (/[.!?]$/.test(w.word) || gap > .6 || (/[,;:]$/.test(w.word) && cur.map(x => x.word).join(' ').length > 30) || !nx) flush(); });
      this.lines = L.map((c, k) => ({ s: c.map(x => x.word).join(' '), t0: c[0].start - .05, t1: Math.min(L[k + 1] ? L[k + 1][0].start - .05 : 1e9, c[c.length - 1].end + .7) })); }
    const c = this.lines.find(c => t >= c.t0 && t < c.t1); if (!c) return;
    const a = Math.min(clamp((t - c.t0) / .12), clamp((c.t1 - t) / .15));
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = a; const size = LAY.capSize * .84; g.font = `600 ${size}px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    const tw = g.measureText(c.s).width; const Y = ep.capY || LAY.capY;
    g.fillStyle = 'rgba(8,10,14,.62)'; rr(g, W / 2 - tw / 2 - 22, Y - size * .78, tw + 44, size * 1.56, 8); g.fill();
    g.fillStyle = '#f4f1ea'; g.fillText(c.s, W / 2, Y + 2); g.globalAlpha = 1;
  }
  captions(t) { // word-by-word captions from the VO timestamps: 1-3 word chunks, current word yellow, pop-in
    const ep = this.ep; if (!ep.words || ep.noCaptions) return; const g = this.g;
    if (ep.capStyle === 'film') return this.filmCaptions(t);
    if (!this.chunks) { const ch = []; let cur = [];
      ep.words.forEach((w, i) => { const nx = ep.words[i + 1]; if (cur.length && [...cur, w].map(x => x.word).join(' ').length > 17) { ch.push(cur); cur = []; } cur.push(w); const punct = /[.,;:!?]$/.test(w.word); const gap = nx ? nx.start - w.end : 9;
        if (punct || gap > .35 || cur.length >= 3 || !nx) { ch.push(cur); cur = []; } });
      this.chunks = ch.map((c, k) => ({ w: c, t0: c[0].start, t1: Math.min(ch[k + 1] ? ch[k + 1][0].start : 1e9, c[c.length - 1].end + .45) })); }
    const c = this.chunks.find(c => t >= c.t0 - .02 && t < c.t1); if (!c) return;
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; const Y = ep.capY || LAY.capY, size = LAY.capSize;
    const words = c.w.map(w => w.word.replace(/[,;:]$/, '').toUpperCase()); g.font = `900 ${size}px ${SUBF}`; const sp = size * .28;
    let ws = words.map(s => g.measureText(s).width); let tot = ws.reduce((a, b) => a + b, 0) + sp * (words.length - 1); const sc = Math.min(1, (W - 120) / tot);
    const pop = easeBack((t - c.t0) / .22); g.translate(W / 2, Y); g.scale(sc * (.82 + .18 * pop), sc * (.82 + .18 * pop));
    let x = -tot / 2; c.w.forEach((w, i) => { const on = t >= w.start - .03; const k = clamp((t - w.start + .03) / .12); const cx = x + ws[i] / 2;
      g.save(); g.translate(cx, 0); if (on && t < w.end + .05) { const b = 1 + .1 * (1 - k); g.scale(b, b); }
      txt(g, words[i], 0, 0, { size, weight: 900, font: SUBF, fill: on ? (t < w.end + .08 ? '#ffd84a' : '#fff') : 'rgba(255,255,255,.55)', sw: 14, shadow: 'rgba(0,0,0,.8)' }); g.restore(); x += ws[i] + sp; });
  }
  shakeKick(t) { // short shakes triggered by blasts / breaches
    let m = 0; for (const it of this.ep.items) { if (it.type === 'breach' && t >= it.t0 && t < it.t0 + .6) m = Math.max(m, 14 * (1 - (t - it.t0) / .6));
      if (it.type === 'blasts' && it.kick && t >= it.t0 && t <= it.t1) m = Math.max(m, it.kick * (.5 + .5 * Math.sin(t * 3.1))); } return m; }
  sampleOcc(nx, ny, step, now, cityA) { // occupation 0..1 on a screen grid (NaN = water)
    const v = this.v, fb = assets.fieldBig, fc = assets.fieldCity, soft = 360; const grid = new Float32Array(nx * ny);
    const cos = Math.cos((this.v.cam.rot || 0) * Math.PI / 180), sin = Math.sin((this.v.cam.rot || 0) * Math.PI / 180);
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
      const sx = (i * step - v.cx) / v.s, sy = (j * step - v.cy) / v.s; const x = v.cam.x + sx * cos - sy * sin, z = v.cam.z + sx * sin + sy * cos;
      let val = NaN, w = 0;
      if (cityA > 0) { const ci = Math.floor((x - fc.X0) / fc.R), cj = Math.floor((z - fc.Z0) / fc.R); if (ci >= 0 && cj >= 0 && ci < fc.w && cj < fc.h) { const k = cj * fc.w + ci; w = cityA * fc.edge[k]; if (fc.water[k] && w > .5) { grid[j * nx + i] = NaN; continue; } val = clamp((now - fc.tm[k]) / soft + .5); } }
      if (w < 1) { const bi = Math.floor((x - fb.X0) / fb.R), bj = Math.floor((z - fb.Z0) / fb.R); if (bi >= 0 && bj >= 0 && bi < fb.w && bj < fb.h) { const k = bj * fb.w + bi; if (fb.water[k] && w < .5) { grid[j * nx + i] = NaN; continue; } const bv = clamp((now - fb.tm[k]) / soft + .5); val = val === val ? lerp(bv, val, w) : bv; } }
      grid[j * nx + i] = val;
    }
    return grid;
  }
  drawFront(v, now, cityA, dark) { // cream glowing front line + thin white coastlines, contoured on the world-fixed field rasters (stable while the camera moves)
    const g = this.g, fb = assets.fieldBig, fc = assets.fieldCity, ep = this.ep;
    g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.lineJoin = 'round'; g.lineCap = 'round';
    const cityPoly = [[fc.X0, fc.Z0], [fc.X0 + fc.w * fc.R, fc.Z0], [fc.X0 + fc.w * fc.R, fc.Z0 + fc.h * fc.R], [fc.X0, fc.Z0 + fc.h * fc.R]].map(q => v.p(...q));
    const clipCity = inside => { g.beginPath(); if (!inside) g.rect(-50, -50, W + 100, H + 100); cityPoly.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); g.clip('evenodd'); };
    const layers = []; // [field, alpha, clip]
    if (cityA < 1) { if (cityA > 0) { layers.push([fb, 1, false]); layers.push([fb, 1 - cityA, true]); } else layers.push([fb, 1, null]); }
    if (cityA > 0) layers.push([fc, cityA, true]);
    for (const [f, al, clip] of layers) {
      g.save(); if (clip !== null) clipCity(clip);
      if (ep.coast !== false && f === fb) { const cl = coastLines(f); g.strokeStyle = '#ffffff'; g.lineWidth = ep.coastW ?? 2; // city basemap draws its own crisp shoreline; a second (coarser) one reads as a double outline
        for (const l of cl) { const P = projLine(v, l); if (!P) continue; const L = pathLen(P); const la = clamp((L - 60) / 100); if (la <= 0) continue; g.globalAlpha = .75 * (ep.coastA ?? 1) * al * la * (ep.fine ? clamp((v.cam.w - 90000) / 150000) : 1); poly(g, P); g.stroke(); } }
      let wl = frontLines(f, v, now); if (ep.fine) wl = wl.flatMap(splitNearWall); // the wall already marks a front that runs along it: no second line beside it
      const lines = wl.map(l => projLine(v, l, true)).filter(Boolean);
      const base = (ep.frontA ?? 1) * al; const LA = lines.map(l => clamp((pathLen(l) - 30) / 60));
      const pass = (fn) => lines.forEach((l, i) => { if (LA[i] <= 0) return; g.globalAlpha = base * LA[i]; poly(g, l); fn(); });
      if (ep.fine) { // long-form: one crisp line with a dark under-stroke and a tight glow (no fat halo)
        g.strokeStyle = 'rgba(10,12,16,.45)'; g.lineWidth = 5; pass(() => g.stroke());
        g.shadowColor = 'rgba(255,225,150,.8)'; g.shadowBlur = 9; g.strokeStyle = COL.front; g.lineWidth = 2.6; pass(() => g.stroke()); g.shadowColor = 'transparent';
      } else {
      g.shadowColor = 'rgba(255,225,150,.95)'; g.shadowBlur = 26; g.strokeStyle = 'rgba(255,230,170,.7)'; g.lineWidth = 7; pass(() => g.stroke());
      g.shadowBlur = 10; g.strokeStyle = COL.front; g.lineWidth = 4.5; pass(() => g.stroke()); g.shadowColor = 'transparent';
      g.strokeStyle = '#fffdf2'; g.lineWidth = 1.6; pass(() => g.stroke()); }
      g.restore();
    }
    g.restore();
  }
  post(t) { // vignette, top/bottom grade, film grain
    const g = this.g; g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
    const vg = g.createRadialGradient(W / 2, H * .45, H * .28, W / 2, H * .45, H * .78); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.42)'); g.fillStyle = vg; g.fillRect(0, 0, W, H);
    const tg = g.createLinearGradient(0, 0, 0, LAY.topGrad); tg.addColorStop(0, 'rgba(6,8,12,.55)'); tg.addColorStop(1, 'rgba(6,8,12,0)'); g.fillStyle = tg; g.fillRect(0, 0, W, LAY.topGrad);
    const gc = grainCanvas(); const f = Math.floor(t * 30); g.globalAlpha = .07; g.globalCompositeOperation = 'overlay'; const ox = (f * 73) % 256, oy = (f * 151) % 256;
    for (let y = -oy; y < H; y += 256) for (let x = -ox; x < W; x += 256) g.drawImage(gc, x, y);
    g.restore();
  }
  debugOverlay(t, cam) { const g = this.g; g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.fillStyle = 'rgba(0,0,0,.6)'; g.fillRect(0, H - 120, W, 120); g.fillStyle = '#0f0'; g.font = '26px monospace'; g.textAlign = 'left'; g.fillText(`t=${t.toFixed(2)} x=${cam.x.toFixed(0)} z=${cam.z.toFixed(0)} w=${cam.w.toFixed(0)} rot=${(cam.rot || 0).toFixed(1)}`, 20, H - 70); g.strokeStyle = 'rgba(255,0,0,.6)'; g.beginPath(); g.moveTo(0, 1561); g.lineTo(W, 1561); g.stroke(); }
  handoffs() { // camera state at each handoff (for the sandbox thread)
    return this.ep.items.filter(i => i.type === 'handoff').map(i => { const c = camAt(this.ep.cam, i.t0 - 1 / 60); const c2 = camAt(this.ep.cam, i.t1 + 1 / 60);
      const r = -(c.rot || 0) * Math.PI / 180; const ox = 0, oz = (H / 2 - H * 0.44) / (W / c.w); // screen centre offset from cam centre (cam centre sits at 44% height)
      return { id: i.id, out_at_s: i.t0, back_at_s: i.t1, note: i.note, out: { centre_x: c.x, centre_z: c.z, view_width_m: c.w, view_height_m: c.w * H / W, bearing_up_deg: c.rot || 0, centre_sits_at_screen_y: 0.44 }, back: { centre_x: c2.x, centre_z: c2.z, view_width_m: c2.w, bearing_up_deg: c2.rot || 0 } }; });
  }
}
// ---------- geometry/drawing helpers
const PHI = 32.05 * Math.PI / 180; const M_LAT = 111132.954 - 559.822 * Math.cos(2 * PHI) + 1.175 * Math.cos(4 * PHI); const M_LON = 111412.84 * Math.cos(PHI) - 93.5 * Math.cos(3 * PHI);
export function ll(lon, lat) { return [(lon - 118.78) * M_LON, -(lat - 32.05) * M_LAT]; }
function interpKeys(keys, t, f) { if (!keys || !keys.length) return 0; const val = k => typeof k[f] === 'string' ? T(k[f]) : k[f];
  if (t <= keys[0].t) return val(keys[0]); for (let i = 0; i < keys.length - 1; i++) { const a = keys[i], b = keys[i + 1]; if (t <= b.t) { if (b.step) return val(a); const u = (b.ease === 'linear' ? clamp : easeIO)((t - a.t) / (b.t - a.t)); return lerp(val(a), val(b), u); } } return val(keys[keys.length - 1]); }
function catmull(P, n) { if (P.length < 3) { const o = []; for (let i = 0; i <= n; i++) o.push([lerp(P[0][0], P[P.length - 1][0], i / n), lerp(P[0][1], P[P.length - 1][1], i / n)]); return o; }
  const o = []; for (let i = 0; i < P.length - 1; i++) { const p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(P.length - 1, i + 2)];
    for (let k = 0; k < n; k++) { const u = k / n, u2 = u * u, u3 = u2 * u; o.push([0, 1].map(j => .5 * ((2 * p1[j]) + (-p0[j] + p2[j]) * u + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * u2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * u3))); } }
  o.push(P[P.length - 1]); return o; }
function partial(pts, u) { if (u >= 1) return pts; if (u <= 0) return [pts[0]]; let L = 0; const seg = []; for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(d); L += d; }
  let target = L * u, out = [pts[0]]; for (let i = 1; i < pts.length; i++) { if (target > seg[i - 1]) { out.push(pts[i]); target -= seg[i - 1]; } else { const f = target / seg[i - 1]; out.push([lerp(pts[i - 1][0], pts[i][0], f), lerp(pts[i - 1][1], pts[i][1], f)]); break; } } return out; }
function poly(g, pts) { g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); }
function head(g, p0, p1, s, col) { const a = Math.atan2(p1[1] - p0[1], p1[0] - p0[0]); g.beginPath(); g.moveTo(p1[0] + Math.cos(a) * s, p1[1] + Math.sin(a) * s); g.lineTo(p1[0] + Math.cos(a + 2.4) * s, p1[1] + Math.sin(a + 2.4) * s); g.lineTo(p1[0] + Math.cos(a - 2.4) * s, p1[1] + Math.sin(a - 2.4) * s); g.closePath(); g.fillStyle = col; g.fill(); g.lineWidth = 3; g.strokeStyle = '#fff'; g.stroke(); }
function drawArrow(g, pts, w, col) { // tapered body + head, white outline
  const n = pts.length; if (n < 2) return; const L = [], R = []; const headLen = Math.min(w * 1.6, 0.4 * pathLen(pts));
  let acc = 0; const total = pathLen(pts); const bodyEnd = total - headLen; let cut = pts.length - 1; const body = [];
  for (let i = 0; i < n; i++) { if (i) acc += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); if (acc > bodyEnd) { cut = i; break; } body.push([pts[i], acc / Math.max(1, bodyEnd)]); }
  if (body.length < 2) body.push([pts[Math.min(1, n - 1)], 1]);
  for (let i = 0; i < body.length; i++) { const [p, u] = body[i]; const q = body[Math.min(i + 1, body.length - 1)][0], o = body[Math.max(i - 1, 0)][0]; const a = Math.atan2(q[1] - o[1], q[0] - o[0]); const hw = w * (0.32 + 0.18 * u);
    L.push([p[0] + Math.cos(a - Math.PI / 2) * hw, p[1] + Math.sin(a - Math.PI / 2) * hw]); R.push([p[0] + Math.cos(a + Math.PI / 2) * hw, p[1] + Math.sin(a + Math.PI / 2) * hw]); }
  const tip = pts[n - 1], base = body[body.length - 1][0]; const a = Math.atan2(tip[1] - base[1], tip[0] - base[0]); const hw = w * 0.95;
  g.beginPath(); L.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.lineTo(base[0] + Math.cos(a - Math.PI / 2) * hw, base[1] + Math.sin(a - Math.PI / 2) * hw); g.lineTo(tip[0], tip[1]);
  g.lineTo(base[0] + Math.cos(a + Math.PI / 2) * hw, base[1] + Math.sin(a + Math.PI / 2) * hw); for (let i = R.length - 1; i >= 0; i--) g.lineTo(R[i][0], R[i][1]); g.closePath();
  g.lineJoin = 'round'; g.lineWidth = 9; g.strokeStyle = 'rgba(0,0,0,.35)'; g.stroke(); g.fillStyle = col; g.fill(); g.lineWidth = 4; g.strokeStyle = '#fff'; g.stroke(); }
function pathLen(p) { let L = 0; for (let i = 1; i < p.length; i++) L += Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]); return L; }
function rr(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
function tag(g, text, x, y, o) { g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = o.a ?? 1;
  if (o.pin) { g.save(); g.shadowColor = 'rgba(0,0,0,.5)'; g.shadowBlur = 8; g.strokeStyle = '#fff'; g.lineWidth = 3; g.beginPath(); g.moveTo(o.pin[0], o.pin[1]); g.lineTo(x, y); g.stroke(); g.restore();
    g.beginPath(); g.arc(o.pin[0], o.pin[1], 11, 0, 7); g.fillStyle = o.bg; g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 3.5; g.stroke(); }
  g.translate(x, y); g.scale(o.scale ?? 1, o.scale ?? 1); g.font = `900 ${o.size}px ${FONT}`; const w = g.measureText(text).width; const ph = o.size * .36, pw = o.size * .55; const ic = o.icon ? o.size * .9 : 0;
  const bw = w + pw * 2 + ic, bh = o.size + ph * 2; let bx = -bw / 2; bx = Math.max(bx, 30 - x); bx = Math.min(bx, W - 30 - x - bw);
  g.shadowColor = 'rgba(0,0,0,.55)'; g.shadowBlur = 24; g.shadowOffsetY = 8; g.fillStyle = o.bg; rr(g, bx, -bh / 2, bw, bh, 8); g.fill(); g.shadowColor = 'transparent';
  const gr = g.createLinearGradient(0, -bh / 2, 0, bh / 2); gr.addColorStop(0, 'rgba(255,255,255,.22)'); gr.addColorStop(.55, 'rgba(255,255,255,0)'); gr.addColorStop(1, 'rgba(0,0,0,.2)'); g.fillStyle = gr; rr(g, bx, -bh / 2, bw, bh, 8); g.fill();
  g.fillStyle = 'rgba(255,255,255,.9)'; g.fillRect(bx, -bh / 2 + 6, 5, bh - 12);
  g.lineWidth = 2; g.strokeStyle = 'rgba(255,255,255,.35)'; rr(g, bx, -bh / 2, bw, bh, 8); g.stroke();
  g.textBaseline = 'middle'; g.textAlign = 'center';
  if (o.icon) { g.font = `900 ${o.size * .62}px ${FONT}`; g.fillStyle = o.fg; g.fillText(o.icon, bx + pw * .7 + ic * .35, 2); g.font = `900 ${o.size}px ${FONT}`; }
  g.save(); g.shadowColor = 'rgba(0,0,0,.45)'; g.shadowBlur = 6; g.shadowOffsetY = 2; g.fillStyle = o.fg; g.fillText(text, bx + ic + pw + w / 2, 2); g.restore();
  if (o.sub) txt(g, o.sub, bx + bw / 2, bh / 2 + o.size * .95, { size: Math.max(26, o.size * .62), weight: 700 });
  g.restore(); }
function wrap(g, text, x, y, maxW, lh) { const words = text.split(' '); let line = '', yy = y; for (const w of words) { const tl = line ? line + ' ' + w : w; if (g.measureText(tl).width > maxW && line) { g.fillText(line, x, yy); line = w; yy += lh; } else line = tl; } g.fillText(line, x, yy); }
function mulberry(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function bbox(p) { let a = 1e18, b = 1e18, c = -1e18, d = -1e18; for (const [x, y] of p) { a = Math.min(a, x); b = Math.min(b, y); c = Math.max(c, x); d = Math.max(d, y); } return [a, b, c, d]; }
function inPoly(p, P) { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { if (((P[i][1] > p[1]) !== (P[j][1] > p[1])) && (p[0] < (P[j][0] - P[i][0]) * (p[1] - P[i][1]) / (P[j][1] - P[i][1]) + P[i][0])) c = !c; } return c; }
function ringPts(c, r) { const o = []; for (let i = 0; i < 24; i++) o.push([c[0] + Math.cos(i / 24 * 6.283) * r, c[1] + Math.sin(i / 24 * 6.283) * r]); return o; }


function riverMask(f) { // largest connected water body of a field (the Yangtze), as a tinted canvas + world outline
  if (f.river) return f.river; const { w, h } = f; const lab = new Int32Array(w * h).fill(-1); let best = -1, bestN = 0, id = 0; const st = [];
  for (let k = 0; k < w * h; k++) { if (!f.water[k] || lab[k] >= 0) continue; let n = 0; st.push(k); lab[k] = id;
    while (st.length) { const c = st.pop(); n++; const x = c % w, y = (c / w) | 0; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const X = x + dx, Y = y + dy; if (X < 0 || Y < 0 || X >= w || Y >= h) continue; const q = Y * w + X; if (f.water[q] && lab[q] < 0) { lab[q] = id; st.push(q); } } }
    if (n > bestN) { bestN = n; best = id; } id++; }
  // drop narrow channels/moats joined to the river: morphological opening (chamfer distance to land > r, dilated back by r)
  const r = 9, INF = 1e9; const dist = new Float32Array(w * h); for (let k = 0; k < w * h; k++) dist[k] = lab[k] === best ? INF : 0;
  const pass = (fw) => { const ys = fw ? [...Array(h).keys()] : [...Array(h).keys()].reverse(), xs = fw ? [...Array(w).keys()] : [...Array(w).keys()].reverse(); const d = fw ? -1 : 1;
    for (const y of ys) for (const x of xs) { const k = y * w + x; if (!dist[k]) continue; let v = dist[k]; const ny = y + d, nx = x + d; if (ny >= 0 && ny < h) v = Math.min(v, dist[ny * w + x] + 1); if (nx >= 0 && nx < w) v = Math.min(v, dist[y * w + nx] + 1); if (ny >= 0 && ny < h && nx >= 0 && nx < w) v = Math.min(v, dist[ny * w + nx] + 1.414); dist[k] = v; } };
  pass(true); pass(false);
  const core = new Float32Array(w * h).fill(INF); for (let k = 0; k < w * h; k++) if (dist[k] > r) core[k] = 0;
  const pass2 = (fw) => { const d = fw ? -1 : 1; for (let yy = 0; yy < h; yy++) { const y = fw ? yy : h - 1 - yy; for (let xx = 0; xx < w; xx++) { const x = fw ? xx : w - 1 - xx; const k = y * w + x; let v = core[k]; const ny = y + d, nx = x + d;
    if (ny >= 0 && ny < h) v = Math.min(v, core[ny * w + x] + 1); if (nx >= 0 && nx < w) v = Math.min(v, core[y * w + nx] + 1); if (ny >= 0 && ny < h && nx >= 0 && nx < w) v = Math.min(v, core[ny * w + nx] + 1.414); core[k] = v; } } };
  pass2(true); pass2(false);
  const m = new Float32Array(w * h); for (let k = 0; k < w * h; k++) m[k] = lab[k] === best && core[k] <= r + .5 ? 1 : 0;
  const c = document.createElement('canvas'); c.width = w; c.height = h; const cg = c.getContext('2d'); const im = cg.createImageData(w, h);
  for (let k = 0; k < w * h; k++) { im.data[k * 4] = 150; im.data[k * 4 + 1] = 225; im.data[k * 4 + 2] = 255; im.data[k * 4 + 3] = m[k] * 255 * f.edge[k]; } cg.putImageData(im, 0, 0);
  const lines = contour(m, w, h, 1, .5).map(l => chaikin(rdp(l, .9).map(([x, y]) => fieldWorld(f, x, y)), 4));
  f.river = { tint: c, lines }; return f.river;
}
// ---- world-fixed contours (no per-frame resampling -> no shimmer)
function fieldWorld(f, i, j) { return [f.X0 + (i + .5) * f.R, f.Z0 + (j + .5) * f.R]; }
function coastLines(f) { // white shorelines from the field's water mask, computed once in world metres
  if (f.coast) return f.coast; const { w, h } = f; let m = new Float32Array(w * h); for (let k = 0; k < w * h; k++) m[k] = f.water[k] ? 1 : 0;
  for (let pass = 0; pass < 2; pass++) { const o = new Float32Array(w * h); for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { let sum = 0, n = 0; for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) { const x = i + di, y = j + dj; if (x < 0 || y < 0 || x >= w || y >= h) continue; sum += m[y * w + x]; n++; } o[j * w + i] = sum / n; } m = o; }
  f.coast = contour(m, w, h, 1, .5).map(l => chaikin(rdp(l, .6).map(([x, y]) => fieldWorld(f, x, y)), 3)); return f.coast;
}
function viewRange(f, v) { // index window of a field covering the screen (+1 cell margin)
  const cos = Math.cos((v.cam.rot || 0) * Math.PI / 180), sin = Math.sin((v.cam.rot || 0) * Math.PI / 180); let i0 = 1e9, j0 = 1e9, i1 = -1e9, j1 = -1e9;
  for (const [X, Y] of [[0, 0], [W, 0], [0, H], [W, H]]) { const sx = (X - v.cx) / v.s, sy = (Y - v.cy) / v.s; const x = v.cam.x + sx * cos - sy * sin, z = v.cam.z + sx * sin + sy * cos;
    const i = (x - f.X0) / f.R, j = (z - f.Z0) / f.R; i0 = Math.min(i0, i); i1 = Math.max(i1, i); j0 = Math.min(j0, j); j1 = Math.max(j1, j); }
  return [Math.max(0, Math.floor(i0) - 2), Math.max(0, Math.floor(j0) - 2), Math.min(f.w - 1, Math.ceil(i1) + 2), Math.min(f.h - 1, Math.ceil(j1) + 2)];
}
function frontLines(f, v, now) { // iso-line occupied-time == story time on the field's own cells
  const [i0, j0, i1, j1] = viewRange(f, v); const nx = i1 - i0 + 1, ny = j1 - j0 + 1; if (nx < 2 || ny < 2) return [];
  const grid = new Float32Array(nx * ny); for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { const k = (j0 + j) * f.w + i0 + i; grid[j * nx + i] = f.water[k] ? NaN : Math.max(-1e5, Math.min(1e5, now - f.tm[k])); }
  return contour(grid, nx, ny, 1, 0).map(l => chaikin(rdp(l, .6).map(([x, y]) => fieldWorld(f, i0 + x, j0 + y)), 3));
}
let WALLD = null; function wallDist() { // distance (m) to the city wall on a 40 m grid
  if (WALLD) return WALLD; const ring = assets.world.ring, R = 40, X0 = -12000, Z0 = -18000, w = 600, h = 1000, d = new Float32Array(w * h).fill(1e9);
  for (let k = 0; k < ring.length; k++) { const [ax, az] = ring[k], [bx, bz] = ring[(k + 1) % ring.length]; const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) / 20));
    for (let s = 0; s <= n; s++) { const x = ax + (bx - ax) * s / n, z = az + (bz - az) * s / n; const ci = Math.round((x - X0) / R), cj = Math.round((z - Z0) / R);
      for (let dj = -8; dj <= 8; dj++) for (let di = -8; di <= 8; di++) { const i = ci + di, j = cj + dj; if (i < 0 || j < 0 || i >= w || j >= h) continue; const q = j * w + i; const dd = Math.hypot(X0 + i * R - x, Z0 + j * R - z); if (dd < d[q]) d[q] = dd; } } }
  WALLD = { d, R, X0, Z0, w, h }; return WALLD; }
function splitNearWall(l) { const D = wallDist(); const near = ([x, z]) => { const i = Math.round((x - D.X0) / D.R), j = Math.round((z - D.Z0) / D.R); return i >= 0 && j >= 0 && i < D.w && j < D.h && D.d[j * D.w + i] < 170; };
  const out = []; let cur = []; for (const p of l) { if (near(p)) { if (cur.length > 1) out.push(cur); cur = []; } else cur.push(p); } if (cur.length > 1) out.push(cur); return out; }
function projLine(v, l, keepAll) { const P = l.map(q => v.p(q[0], q[1])); const [a, b, c, d] = bbox(P); if (c < -40 || a > W + 40 || d < -40 || b > H + 40) return null; return P; }
// ================= v2 "max motion" helpers =================
const FLAT = new Set(['arrow', 'units', 'breach', 'riverGlow', 'wallGlow', 'blasts', 'ring', 'scatter', 'line', 'area', 'fires', 'gateSeq', 'gateX', 'measure']);
const SIZED = {}; function sizedCanvas(name) { const k = name + W + 'x' + H; return SIZED[k] || (SIZED[k] = Object.assign(document.createElement('canvas'), { width: W, height: H })); }
const HUD_TYPES = new Set(['title', 'panel', 'chapter', 'versus', 'stamp', 'film']);
function isHud(it) { return it.layer === 'hud' || HUD_TYPES.has(it.type) || (it.screen && it.layer !== 'map') || (it.type === 'info' && !it.at); }
const easeBack = u => { u = clamp(u); const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(u - 1, 3) + c1 * Math.pow(u - 1, 2); };
const easeElastic = u => { u = clamp(u); if (u === 0 || u === 1) return u; return Math.pow(2, -10 * u) * Math.sin((u * 10 - .75) * (2 * Math.PI / 3)) + 1; };
function shade(hex, k) { const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = n >> 8 & 255, b = n & 255; const f = k < 0 ? 0 : 255, a = Math.abs(k); r = Math.round(r + (f - r) * a); g = Math.round(g + (f - g) * a); b = Math.round(b + (f - b) * a); return `rgb(${r},${g},${b})`; }
// bold text with drop shadow + dark outline (the "premium" caption look)
function txt(g, s, x, y, o = {}) { if (o.font === undefined && o.stroke === false) o.font = SUBF;
  const size = o.size || 40; g.font = `${o.weight || 900} ${size}px ${o.font || FONT}`; g.textAlign = o.align || 'center'; g.textBaseline = o.base || 'alphabetic'; g.lineJoin = 'round';
  if (o.track) g.letterSpacing = o.track + 'px';
  g.save(); g.shadowColor = o.shadow || 'rgba(0,0,0,.6)'; g.shadowBlur = size * .35; g.shadowOffsetY = size * .09;
  if (o.stroke !== false) { g.lineWidth = o.sw || Math.max(4, size * .14); g.strokeStyle = o.strokeCol || 'rgba(10,12,16,.92)'; g.strokeText(s, x, y); }
  g.restore();
  if (o.stroke !== false) { g.lineWidth = o.sw || Math.max(4, size * .14); g.strokeStyle = o.strokeCol || 'rgba(10,12,16,.92)'; g.strokeText(s, x, y); }
  if (o.glow) { g.save(); g.shadowColor = o.glow; g.shadowBlur = size * .5; g.fillStyle = o.fill || '#fff'; g.fillText(s, x, y); g.restore(); }
  if (o.grad) { const gr = g.createLinearGradient(0, y - size, 0, y); gr.addColorStop(0, o.grad[0]); gr.addColorStop(1, o.grad[1]); g.fillStyle = gr; } else g.fillStyle = o.fill || '#fff';
  g.fillText(s, x, y); if (o.track) g.letterSpacing = '0px';
  return g.measureText(s).width;
}
// arrow v2: gradient body, drop shadow, white rim, flowing chevrons, glowing tip
function arrowGeom(pts, w) {
  const n = pts.length; const L = [], R = []; const total = pathLen(pts); const headLen = Math.min(w * 1.7, 0.42 * total); const bodyEnd = total - headLen; let acc = 0; const body = [];
  for (let i = 0; i < n; i++) { if (i) acc += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); if (acc > bodyEnd) break; body.push([pts[i], acc / Math.max(1, bodyEnd), acc]); }
  if (body.length < 2) body.push([pts[Math.min(1, n - 1)], 1, bodyEnd]);
  for (let i = 0; i < body.length; i++) { const [p, u] = body[i]; const q = body[Math.min(i + 1, body.length - 1)][0], o = body[Math.max(i - 1, 0)][0]; const a = Math.atan2(q[1] - o[1], q[0] - o[0]); const hw = w * (0.26 + 0.22 * u);
    L.push([p[0] + Math.cos(a - Math.PI / 2) * hw, p[1] + Math.sin(a - Math.PI / 2) * hw]); R.push([p[0] + Math.cos(a + Math.PI / 2) * hw, p[1] + Math.sin(a + Math.PI / 2) * hw]); }
  const tip = pts[n - 1], base = body[body.length - 1][0]; const a = Math.atan2(tip[1] - base[1], tip[0] - base[0]); const hw = w * 0.98;
  const outline = [...L, [base[0] + Math.cos(a - Math.PI / 2) * hw, base[1] + Math.sin(a - Math.PI / 2) * hw], tip, [base[0] + Math.cos(a + Math.PI / 2) * hw, base[1] + Math.sin(a + Math.PI / 2) * hw], ...R.reverse()];
  return { outline, body, tip, base, ang: a, total, bodyEnd };
}
function drawArrow2(g, pts, w, col, t, o = {}) {
  if (pts.length < 2) return; const G = arrowGeom(pts, w); const first = pts[0];
  g.save(); g.lineJoin = 'round';
  // shadow
  g.shadowColor = 'rgba(0,0,0,.45)'; g.shadowBlur = 18; g.shadowOffsetY = 8; g.fillStyle = 'rgba(0,0,0,.18)'; poly(g, G.outline); g.closePath(); g.fill(); g.shadowColor = 'transparent';
  // gradient body: transparent-ish tail -> saturated -> bright tip
  const lite = col === COL.cn ? COL.cnLite : col === COL.jp ? COL.jpLite : col; const gr = g.createLinearGradient(first[0], first[1], G.tip[0], G.tip[1]); gr.addColorStop(0, hexA(lite, .05)); gr.addColorStop(.45, hexA(lite, .75)); gr.addColorStop(1, lite);
  g.fillStyle = gr; poly(g, G.outline); g.closePath(); g.fill();
  // flowing chevrons inside the body
  if (o.chev !== false) { g.save(); poly(g, G.outline); g.closePath(); g.clip(); g.strokeStyle = 'rgba(255,255,255,.3)'; g.lineWidth = Math.max(3, w * .11); g.lineCap = 'round';
  const gap = Math.max(26, w * 1.15), ph = ((t || 0) * (o.speed || 90)) % gap;
  for (let d = ph; d < G.bodyEnd - w * .3; d += gap) { const P = pointAt(pts, d), Q = pointAt(pts, d + 2); const a = Math.atan2(Q[1] - P[1], Q[0] - P[0]); const hw = w * (0.26 + 0.22 * d / Math.max(1, G.bodyEnd)) * .7, s = hw * .8;
    g.beginPath(); g.moveTo(P[0] - Math.cos(a) * s + Math.cos(a - Math.PI / 2) * hw, P[1] - Math.sin(a) * s + Math.sin(a - Math.PI / 2) * hw); g.lineTo(P[0], P[1]); g.lineTo(P[0] - Math.cos(a) * s + Math.cos(a + Math.PI / 2) * hw, P[1] - Math.sin(a) * s + Math.sin(a + Math.PI / 2) * hw); g.stroke(); }
  g.restore(); }
  // rim
  g.lineWidth = 1.5; g.strokeStyle = 'rgba(255,255,255,.55)'; poly(g, G.outline); g.closePath(); g.stroke();
  // tip glow
  const pulse = .6 + .4 * Math.sin((t || 0) * 6); const rg = g.createRadialGradient(G.tip[0], G.tip[1], 0, G.tip[0], G.tip[1], w * 1.6); rg.addColorStop(0, `rgba(255,236,200,${.55 * pulse})`); rg.addColorStop(1, 'rgba(255,200,150,0)');
  g.globalCompositeOperation = 'lighter'; g.fillStyle = rg; g.beginPath(); g.arc(G.tip[0], G.tip[1], w * 1.6, 0, 7); g.fill(); g.globalCompositeOperation = 'source-over';
  g.restore(); return G;
}
function pointAt(pts, d) { let acc = 0; for (let i = 1; i < pts.length; i++) { const s = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); if (acc + s >= d) { const f = (d - acc) / (s || 1); return [lerp(pts[i - 1][0], pts[i][0], f), lerp(pts[i - 1][1], pts[i][1], f)]; } acc += s; } return pts[pts.length - 1]; }
// NATO-style unit counter (infantry box, echelon marks above, name below)
function nato(g, X, Y, o) {
  const s = o.s || 1, bw = 46 * s, bh = 32 * s; const col = o.side === 'jp' ? COL.jp : COL.cn;
  g.save(); g.translate(X, Y); if (o.rot) g.rotate(o.rot);
  g.shadowColor = 'rgba(0,0,0,.55)'; g.shadowBlur = 12 * s; g.shadowOffsetY = 5 * s; g.fillStyle = col; g.fillRect(-bw / 2, -bh / 2, bw, bh); g.shadowColor = 'transparent';
  const gr = g.createLinearGradient(0, -bh / 2, 0, bh / 2); gr.addColorStop(0, 'rgba(255,255,255,.28)'); gr.addColorStop(.5, 'rgba(255,255,255,0)'); gr.addColorStop(1, 'rgba(0,0,0,.18)'); g.fillStyle = gr; g.fillRect(-bw / 2, -bh / 2, bw, bh);
  g.lineWidth = 2.6 * s; g.strokeStyle = '#fff'; g.strokeRect(-bw / 2, -bh / 2, bw, bh);
  const kind = o.kind || 'inf'; g.lineWidth = 2.4 * s; g.beginPath();
  if (kind === 'inf' || kind === 'mech') { g.moveTo(-bw / 2, -bh / 2); g.lineTo(bw / 2, bh / 2); g.moveTo(bw / 2, -bh / 2); g.lineTo(-bw / 2, bh / 2); }
  if (kind === 'armor' || kind === 'mech') { g.moveTo(-bw * .28, -bh * .2); g.lineTo(bw * .28, -bh * .2); g.arc(bw * .28, 0, bh * .2, -Math.PI / 2, Math.PI / 2); g.lineTo(-bw * .28, bh * .2); g.arc(-bw * .28, 0, bh * .2, Math.PI / 2, Math.PI * 1.5); }
  if (kind === 'art') { g.moveTo(5 * s, 0); g.arc(0, 0, 5 * s, 0, 7); }
  g.stroke(); if (kind === 'art') { g.fillStyle = '#fff'; g.fill(); }
  if (o.ech) { g.font = `900 ${13 * s}px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'bottom'; g.lineWidth = 3.5 * s; g.strokeStyle = 'rgba(0,0,0,.85)'; g.strokeText(o.ech, 0, -bh / 2 - 2 * s); g.fillStyle = '#fff'; g.fillText(o.ech, 0, -bh / 2 - 2 * s); }
  if (o.name) { g.font = `800 ${14 * s}px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'top'; g.lineWidth = 4 * s; g.strokeStyle = 'rgba(0,0,0,.85)'; g.strokeText(o.name, 0, bh / 2 + 3 * s); g.fillStyle = '#fff'; g.fillText(o.name, 0, bh / 2 + 3 * s); }
  if (o.dead != null && o.dead > 0) { g.globalAlpha *= 1; g.strokeStyle = '#ffdf6e'; g.lineWidth = 5 * s * o.dead; g.beginPath(); g.moveTo(-bw * .6, -bh * .7); g.lineTo(bw * .6, bh * .7); g.moveTo(bw * .6, -bh * .7); g.lineTo(-bw * .6, bh * .7); g.stroke(); }
  g.restore();
}
// marching squares on a screen-space grid -> polylines at iso 0.5 (NaN cells skipped)
function contour(grid, nx, ny, step, iso = .5) {
  const segs = []; const at = (i, j) => grid[j * nx + i];
  const ip = (x0, y0, v0, x1, y1, v1) => { const f = (iso - v0) / (v1 - v0); return [lerp(x0, x1, f), lerp(y0, y1, f)]; };
  for (let j = 0; j < ny - 1; j++) for (let i = 0; i < nx - 1; i++) {
    const a = at(i, j), b = at(i + 1, j), c = at(i + 1, j + 1), d = at(i, j + 1); if (a !== a || b !== b || c !== c || d !== d) continue;
    const k = (a > iso ? 8 : 0) | (b > iso ? 4 : 0) | (c > iso ? 2 : 0) | (d > iso ? 1 : 0); if (k === 0 || k === 15) continue;
    const x = i * step, y = j * step, X = x + step, Y = y + step;
    const T_ = () => ip(x, y, a, X, y, b), R_ = () => ip(X, y, b, X, Y, c), B_ = () => ip(x, Y, d, X, Y, c), L_ = () => ip(x, y, a, x, Y, d);
    switch (k) { case 1: case 14: segs.push([L_(), B_()]); break; case 2: case 13: segs.push([B_(), R_()]); break; case 3: case 12: segs.push([L_(), R_()]); break; case 4: case 11: segs.push([T_(), R_()]); break;
      case 5: segs.push([L_(), T_()]); segs.push([B_(), R_()]); break; case 6: case 9: segs.push([T_(), B_()]); break; case 7: case 8: segs.push([L_(), T_()]); break; case 10: segs.push([T_(), R_()]); segs.push([L_(), B_()]); break; }
  }
  // join segments into polylines
  const key = p => Math.round(p[0] * 4) + ',' + Math.round(p[1] * 4); const ends = new Map(); const used = new Uint8Array(segs.length);
  segs.forEach((s, k) => { for (const e of [0, 1]) { const kk = key(s[e]); if (!ends.has(kk)) ends.set(kk, []); ends.get(kk).push(k); } });
  const lines = [];
  for (let k = 0; k < segs.length; k++) { if (used[k]) continue; used[k] = 1; const line = [segs[k][0], segs[k][1]];
    for (const dir of [1, 0]) { let guard = 0; while (guard++ < 100000) { const p = dir ? line[line.length - 1] : line[0]; const cand = (ends.get(key(p)) || []).find(m => !used[m]); if (cand == null) break; used[cand] = 1; const s = segs[cand]; const q = key(s[0]) === key(p) ? s[1] : s[0]; if (dir) line.push(q); else line.unshift(q); } }
    lines.push(line); }
  return lines;
}
function rdp(p, eps) { if (p.length < 3) return p; const keep = new Uint8Array(p.length); keep[0] = keep[p.length - 1] = 1; const st = [[0, p.length - 1]];
  while (st.length) { const [a, b] = st.pop(); const [ax, ay] = p[a], [bx, by] = p[b]; const dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy) || 1e-9; let m = -1, md = 0;
    for (let i = a + 1; i < b; i++) { const d = Math.abs((p[i][0] - ax) * dy - (p[i][1] - ay) * dx) / L; if (d > md) { md = d; m = i; } } if (md > eps) { keep[m] = 1; st.push([a, m], [m, b]); } }
  return p.filter((_, i) => keep[i]); }
function chaikin(p, it = 2) { for (let k = 0; k < it; k++) { if (p.length < 3) return p; const o = [p[0]]; for (let i = 0; i < p.length - 1; i++) { const a = p[i], b = p[i + 1]; o.push([lerp(a[0], b[0], .25), lerp(a[1], b[1], .25)], [lerp(a[0], b[0], .75), lerp(a[1], b[1], .75)]); } o.push(p[p.length - 1]); p = o; } return p; }
let GRAIN = null;
function grainCanvas() { if (GRAIN) return GRAIN; const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'); const im = g.createImageData(256, 256); const r = mulberry(99);
  for (let i = 0; i < 256 * 256; i++) { const v = 128 + (r() - .5) * 255; im.data[i * 4] = im.data[i * 4 + 1] = im.data[i * 4 + 2] = v; im.data[i * 4 + 3] = 255; } g.putImageData(im, 0, 0); GRAIN = c; return c; }
let HATCH = null;
function hatchPattern(g) { if (!HATCH) { const c = document.createElement('canvas'); c.width = c.height = 22; const h = c.getContext('2d'); h.strokeStyle = 'rgba(255,255,255,.30)'; h.lineWidth = 1.3;
  h.beginPath(); h.moveTo(0, 0); h.lineTo(22, 22); h.moveTo(22, 0); h.lineTo(0, 22); h.stroke(); HATCH = c; } return g.createPattern(HATCH, 'repeat'); }
// soldier pawn (reference style): dark body, coloured helmet, drop shadow
function pawn(g, X, Y, o) {
  const s = o.s || 1, col = o.side === 'jp' ? '#e0452c' : o.side === 'cn' ? '#3d86ff' : '#ddd';
  g.save(); g.translate(X, Y); g.scale(s, s);
  g.shadowColor = 'rgba(0,0,0,.55)'; g.shadowBlur = 10; g.shadowOffsetY = 4;
  g.fillStyle = '#15171b'; g.beginPath(); g.moveTo(-17, 14); g.bezierCurveTo(-17, -2, -9, -6, 0, -6); g.bezierCurveTo(9, -6, 17, -2, 17, 14); g.closePath(); g.fill();
  g.beginPath(); g.arc(0, -13, 9, 0, 7); g.fill(); g.shadowColor = 'transparent';
  g.fillStyle = col; g.beginPath(); g.arc(0, -15, 10, Math.PI, 0); g.lineTo(12, -14); g.lineTo(-12, -14); g.closePath(); g.fill();
  const hg = g.createLinearGradient(0, -26, 0, -14); hg.addColorStop(0, 'rgba(255,255,255,.45)'); hg.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = hg; g.beginPath(); g.arc(0, -15, 10, Math.PI, 0); g.closePath(); g.fill();
  const bg = g.createLinearGradient(0, -6, 0, 14); bg.addColorStop(0, 'rgba(255,255,255,.18)'); bg.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = bg; g.beginPath(); g.moveTo(-17, 14); g.bezierCurveTo(-17, -2, -9, -6, 0, -6); g.bezierCurveTo(9, -6, 17, -2, 17, 14); g.closePath(); g.fill();
  if (o.dead > 0) { g.globalAlpha *= 1; g.strokeStyle = '#ffd24d'; g.lineWidth = 4; g.beginPath(); g.moveTo(-14, -24); g.lineTo(14, 12); g.moveTo(14, -24); g.lineTo(-14, 12); g.stroke(); }
  g.restore();
}
// condensed caps box tag (reference: "X CORPS", "6 MILES", "GAUNTLET OF FIRE")
function ctag(g, s, x, y, o = {}) {
  const size = o.size || 38; g.font = `400 ${size}px ${COND}`; g.letterSpacing = (o.track ?? 2) + 'px'; const w = g.measureText(s).width; const pw = size * .42, ph = size * .2;
  const bw = w + pw * 2, bh = size + ph * 2; let bx = o.align === 'left' ? 0 : -bw / 2;
  g.save(); g.translate(x, y); g.scale(o.scale ?? 1, o.scale ?? 1);
  bx = Math.max(bx, 26 - x); bx = Math.min(bx, W - 26 - x - bw);
  g.shadowColor = 'rgba(0,0,0,.55)'; g.shadowBlur = 16; g.shadowOffsetY = 5; g.fillStyle = o.bg || '#101215'; g.fillRect(bx, -bh / 2, bw, bh); g.shadowColor = 'transparent';
  if (o.edge) { g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 2; g.strokeRect(bx + 1, -bh / 2 + 1, bw - 2, bh - 2); }
  g.fillStyle = o.fg || '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(s, bx + bw / 2, size * .05);
  g.letterSpacing = '0px'; g.restore(); return bw;
}
function hexA(hex, a) { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${n >> 8 & 255},${n & 255},${a})`; }
function flag(g, side, x, y, w, h) { // simplified national flags (ROC / Japan)
  g.save(); g.shadowColor = 'rgba(0,0,0,.4)'; g.shadowBlur = 6;
  if (side === 'jp') { g.fillStyle = '#f6f4ef'; g.fillRect(x, y, w, h); g.shadowColor = 'transparent'; g.fillStyle = '#c8202a'; g.beginPath(); g.arc(x + w / 2, y + h / 2, h * .3, 0, 7); g.fill(); }
  else { g.fillStyle = '#d0262c'; g.fillRect(x, y, w, h); g.shadowColor = 'transparent'; g.fillStyle = '#1c3c9c'; g.fillRect(x, y, w / 2, h / 2); g.fillStyle = '#fff'; const cx = x + w / 4, cy = y + h / 4; g.beginPath(); for (let k = 0; k < 24; k++) { const r = k % 2 ? h * .09 : h * .19, an = k / 24 * 6.283; g.lineTo(cx + Math.cos(an) * r, cy + Math.sin(an) * r); } g.closePath(); g.fill(); g.fillStyle = '#1c3c9c'; g.beginPath(); g.arc(cx, cy, h * .07, 0, 7); g.fill(); }
  g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 1.5; g.strokeRect(x, y, w, h); g.restore(); }
export { pawn, nato, ctag, flag, drawArrow2, txt };
