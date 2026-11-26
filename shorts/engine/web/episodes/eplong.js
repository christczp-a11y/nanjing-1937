// Long film (16:9): the three Shorts re-timed onto one VO (tools/build_long.py -> vo/long.mp3 + long_map.json),
// laid out for landscape, with a pitched ground plane, chapter breaks that pull back, and archive cut-ins.
import ep1 from './ep1.js'; import ep2 from './ep2.js'; import ep3 from './ep3.js';
import { ll } from '../engine.js';
const MAP = await (await fetch('episodes/long_map.json?v=' + Date.now())).json();
const M = MAP.meta; const [C1, C2, C3] = M.chStart; const END = M.duration;
const CITY = { x: -400, z: 600 };

function mapper(k) { // old Short time -> long time (piecewise linear on word anchors, slope 1 outside)
  const P = MAP['ep' + k].pairs;
  return t => { if (t <= P[0][0]) return P[0][1] + (t - P[0][0]); const L = P[P.length - 1]; if (t >= L[0]) return L[1] + (t - L[0]);
    let lo = 0, hi = P.length - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (P[m][0] <= t) lo = m; else hi = m; }
    const [a, A] = P[lo], [b, B] = P[hi]; return A + (B - A) * (t - a) / (b - a); };
}
const DROP = new Set(['title', 'handoff']);
const DROPTXT = new Set(['THE TRAP', 'VICTORY PARADE · 17 DEC', 'USS PANAY SUNK · 12 DEC']);
const DROPIMG = new Set(['shanghai_zhabei_fire_1026.jpg', 'hangzhou_bay_landing_nov.jpg', 'ep3_panay.jpg', 'ep2_artillery_dec10.jpg']); // replaced by moving footage / moved
const SHIFT = { 'FALLEN': 99.5, 'NANJING · 13 DECEMBER 1937': 99.8 }; // make room for the gate footage (old ep2 seconds) // replaced by the long film's own title card
const FULL = { // photos that become full-frame documentary cut-ins instead of small cards
  'shanghai_zhabei_fire_1026.jpg': { caption: 'SHANGHAI · ZHABEI BURNING · OCT 1937', pan1: [-.03, 0] },
  'ep2_artillery_dec10.jpg': { caption: 'PURPLE MOUNTAIN · 10 DEC 1937', z1: 1.16 },
  'ep2_zhonghua_blast_dec12.jpg': { caption: 'ZHONGHUA GATE · 12 DEC 1937' },
  'ep3_panay.jpg': { caption: 'USS PANAY · 12 DEC 1937', pan1: [.03, 0] },
  'ep3_parade.jpg': { caption: 'THE VICTORY PARADE · 17 DEC 1937' },
  'ep3_wall_today.jpg': { caption: 'ZHONGHUA GATE · TODAY', z0: 1.0, z1: 1.08 },
};
function units(it) { // the long VO uses miles
  if (it.steps) { const m = { '35 KM': ['22 MILES', 'OF CITY WALL'], '1 KM': ['½ MILE+', 'OF RIVER'] }; const h = m[it.steps[0][1]]; if (h) return { ...it, steps: [[0, h[0]]], caption: h[1] }; }
  if (it.note) return { ...it, note: it.note.replace('35 km', '22 miles') }; return it; }
function landscape(it) { // portrait (1080x1920) screen layout -> landscape (1920x1080)
  const o = units({ ...it });
  if (o.type === 'card' && FULL[o.img]) { const f = FULL[o.img]; return { type: 'film', mode: 'full', t0: o.t0 - .2, t1: o.t1 + .3, img: o.img, credit: o.credit, ...f }; }
  if (o.type === 'panel') { o.y = 250; o.gap = 255; return o; }
  if (!o.screen) { if (o.type === 'card') { o.w = (o.w || 560) * .85; o.h = (o.h || 400) * .85; } return o; }
  const [x, y] = o.screen;
  switch (o.type) {
    case 'counter': o.screen = [1460, y < 900 ? 250 : 640]; break;
    case 'info': o.screen = [1430, 560]; o.k = .95; break;
    case 'card': o.screen = [1440, 520]; o.w = (o.w || 560) * .9; o.h = (o.h || 400) * .9; break;
    case 'panel': o.y = 250; o.gap = 255; break;
    case 'versus': o.screen = [960, 520]; o.k = .95; break;
    case 'stamp': o.screen = [960, y > 800 ? 520 : 440]; o.size = (o.size || 180) * .8; break;
    case 'label': o.screen = y >= 1000 ? [960, 760] : [400, Math.round(330 + (y - 400) * .95)]; break;
    default: o.screen = [960 + (x - 540), Math.round(y * .56)];
  }
  return o;
}
// Part I city section (was the sandbox in the Short): its own camera, in old ep1 seconds and portrait widths (x1.5 below).
// Context = pull back; a single fact or place = push in; slow orbits (rot) keep holds alive.
const CAM1 = [
  { t: 39.4, x: 0, z: 400, w: 17000, rot: 0 },
  { t: 47.9, x: -200, z: 300, w: 15000, rot: -8 },          // capital, census: slow orbit
  { t: 56.0, x: 300, z: 800, w: 12500, rot: -12 },          // who is still inside: push in
  { t: 57.6, x: 0, z: 600, w: 16500, rot: -4 },             // the wall: whole ring in frame
  { t: 60.2, x: 0, z: 500, w: 16500, rot: 0 },
  { t: 62.0, x: -4300, z: -4000, w: 11000, rot: 22 },       // the river behind it
  { t: 65.4, x: -4600, z: -4300, w: 10200, rot: 26 },
  { t: 68.4, x: 1500, z: 3000, w: 46000, rot: 0 },          // the generals, Chiang: the wider country
  { t: 74.5, x: 1500, z: 3000, w: 43000, rot: 0 },
  { t: 77.0, x: 0, z: 500, w: 15500, rot: 0 },              // the one general: back to his city
  { t: 88.8, x: 100, z: 500, w: 14500, rot: 14 },           // his men: slow orbit
  { t: 90.6, x: -300, z: 300, w: 15000, rot: 0 },           // the gates
  { t: 92.9, x: -400, z: 200, w: 14500, rot: 0 },
  { t: 94.4, x: -4200, z: -4300, w: 9500, rot: 18 },        // the ferries leave Xiaguan
  { t: 96.0, x: -3000, z: -2000, w: 14000, rot: 8 },
  { t: 98.6, x: 2500, z: 4000, w: 50000, rot: 0 },          // 8 Dec: the outer line breaks, wide
  { t: 101.0, x: 1500, z: 2500, w: 40000, rot: 0 },
  { t: 106.2, x: 800, z: 1500, w: 26000, rot: -10 },        // three sides, closing
  { t: 108.4, x: -2500, z: -2500, w: 22000, rot: 18 },      // the fourth side: the river
  { t: 114, x: -2600, z: -2600, w: 21000, rot: 22 },
];
function retime(ep, k, phaseBase) {
  const f = mapper(k); const R = ([a, b, ...r]) => [f(a), f(b), ...r];
  const items = ep.items.filter(it => !DROP.has(it.type) && !DROPTXT.has(it.text) && !DROPIMG.has(it.img)).map(it => SHIFT[it.text] && k === 2 ? { ...it, t0: Math.max(it.t0, SHIFT[it.text]) } : it).map(it => {
    const o = landscape(it); const d0 = o.t0, d1 = o.t1 ?? d0; o.t0 = f(d0); o.t1 = f(d1);
    for (const key of ['rowT']) if (o[key]) o[key] = o[key].map(f);
    if (o.batches) o.batches = o.batches.map(([tb, ids]) => [f(tb), ids]);
    if (o.dots) o.dots = o.dots.map(d => Array.isArray(d) ? d : ({ ...d, ...(d.m0 != null ? { m0: f(d.m0), m1: f(d.m1) } : {}), ...(d.t0 != null ? { t0: f(d.t0) } : {}), ...(d.t1 != null ? { t1: f(d.t1) } : {}), ...(d.out != null ? { out: f(d.out) } : {}) }));
    return o; });
  return {
    items,
    cam: (k === 1 ? [...ep.cam.filter(c => c.t < 39.4), ...CAM1] : ep.cam).map(c => ({ ...c, t: f(c.t), w: c.w * 1.5 })),
    story: ep.story.map(s => ({ ...s, t: f(s.t) })),
    dark: (ep.dark || []).map(d => ({ ...d, t: f(d.t) })),
    hideDate: (ep.hideDate || []).map(R), clock: (ep.clock || []).map(R), legend: (ep.legend || []).map(R), shake: (ep.shake || []).map(R),
    phases: (ep.phases || []).map((p, i) => ({ ...p, t0: f(p.t0), t1: f(p.t1), num: String(phaseBase + i).padStart(2, '0'), splash: false })),
  };
}
// battle effects (ep2 old seconds -> long via the ep2 time map). Fighting only; nothing over the civilian chapters.
const GH = [2902, 2949], ZS = [3986, 985], ZH = [-319, 3996], PM = [6328, -2218], YH = [-434, 5655];
const f2 = mapper(2); const B = (t0, t1, o) => ({ type: 'barrage', t0: f2(t0), t1: f2(t1), ...o });
const FX = [
  B(11.0, 16.8, { from: [[10500, 600], [9800, 8200]], at: [3000, 1800], radius: 1800, rate: 3.5, arc: 150, seed: 31 }),
  B(11.2, 16.8, { from: [[-900, 10200], [600, 9800]], at: ZH, radius: 900, rate: 2.5, arc: 150, seed: 32 }),
  B(17.6, 26.5, { from: [[5600, 5400], [6400, 4400]], at: GH, radius: 260, rate: 2.6, arc: 170, seed: 33, size: 80 }),
  { type: 'tracers', t0: f2(19.4), t1: f2(26.8), from: [[2450, 2600], [2950, 2830], [3350, 2700]], to: [[3200, 3300], [3700, 3600], [4100, 3500]], n: 30, seed: 34 },
  B(29.0, 37.5, { from: [[11200, -3600], [10400, -1300]], at: PM, radius: 1100, rate: 2.2, arc: 190, seed: 35 }),
  B(37.8, 41.6, { from: [[6500, -2300], [7200, -1700]], at: ZS, radius: 420, rate: 3, arc: 170, seed: 36 }),
  B(43.2, 49.4, { from: [[-1600, 9200], [-500, 9900], [700, 9500]], at: YH, radius: 800, rate: 4.5, arc: 160, seed: 37 }),
  { type: 'tracers', t0: f2(44.0), t1: f2(49.4), from: [[-1300, 5900], [-400, 6100], [500, 5900]], to: [[-1200, 7300], [-400, 7600], [500, 7300]], n: 34, seed: 38 },
  B(50.4, 52.9, { from: [[-800, 6000], [200, 6100]], at: ZH, radius: 220, rate: 6, arc: 130, seed: 39, size: 70 }),
];
const f1 = mapper(1), f3 = mapper(3);
const BOC = 'The Battle of China (US Army, 1944) · public domain', UNI = 'Universal Newsreel, Norman Alley, 1937 · public domain';
const clip = (f, t0, t1, name, skip, caption, credit, o = {}) => ({ type: 'film', mode: 'full', contain: true, t0: f(t0), t1: f(t1), clip: name, skip, caption, credit, z0: 1.0, z1: 1.05, fade: .35, ...o });
FX.push(
  clip(f1, 19.9, 22.4, '1937-08_shanghai_naval_shelling_battle_of_china', 30, 'SHANGHAI · 1937', BOC),
  clip(f1, 22.4, 25.0, '1937_shanghai_city_burning_battle_of_china', 150, 'SHANGHAI BURNING · 1937', BOC),
  clip(f1, 27.2, 30.0, '1937-11_hangzhou_bay_landing_advance_battle_of_china', 0, 'JAPANESE LANDING · NOV 1937', BOC),
  clip(f1, 96.4, 98.7, '1937-12_japanese_guns_approach_nanking_battle_of_china', 150, 'ADVANCING ON NANJING · DEC 1937', BOC),
  clip(f2, 11.0, 14.2, '1937-12_nanking_wall_assault_battle_of_china', 60, 'THE ASSAULT ON THE WALL · DEC 1937', BOC),
  { type: 'film', mode: 'full', t0: f2(38.7), t1: f2(41.6), img: 'ep2_artillery_dec10.jpg', caption: 'PURPLE MOUNTAIN GUNS · 10 DEC 1937', credit: 'Public domain', z1: 1.16 },
  clip(f2, 97.2, 99.5, '1937-12-13_japanese_troops_at_nanking_gate_battle_of_china', 150, 'JAPANESE TROOPS ENTER NANJING · DEC 1937', BOC),
  clip(f3, 13.9, 16.6, '1937-12-12_panay_under_air_attack_universal', 0, 'USS PANAY UNDER ATTACK · 12 DEC 1937', UNI),
  clip(f3, 16.6, 19.4, '1937-12-12_panay_last_moments_universal', 60, 'THE PANAY GOES DOWN', UNI),
);
FX.push({ type: 'arrow', t0: f1(73.4), t1: f1(77.2), path: [[-2500, -500], [-14000, -2500], [-26000, -1500]], side: 'cn', grow: 1.6, wpx: 26, text: 'GOVERNMENT MOVES INLAND', tsize: 26, tdy: -50 });
const S1 = retime(ep1, 1, 1), S2 = retime(ep2, 2, 1 + S1.phases.length), S3 = retime(ep3, 3, 1 + S1.phases.length + S2.phases.length);
const S = [S1, S2, S3];
// chapter breaks: pull back to the whole city in the gap, then the next chapter's own first move takes over
const WIDE = (t) => ({ t, x: CITY.x, z: CITY.z - 1500, w: 52000 });
const g1 = S1.cam[S1.cam.length - 1].t, g2 = S2.cam[S2.cam.length - 1].t;
const cam = [...S1.cam.filter(c => c.t < C2 - 1), WIDE((g1 + C2) / 2 + .6), ...S2.cam.filter(c => c.t > C2 - .5 && c.t < C3 - 1), WIDE((g2 + C3) / 2 + .6), ...S3.cam.filter(c => c.t > C3 - .5)]
  .sort((a, b) => a.t - b.t).filter((c, i, A) => i === 0 || c.t > A[i - 1].t + .05);
const last = cam[cam.length - 1]; cam.push({ ...last, t: END - 3, w: last.w * 1.25 }, { ...last, t: END, w: last.w * 1.32 });
// ground pitch: more at city scale, flatter for the wide country view
const tiltOf = w => w <= 40000 ? 26 : w >= 300000 ? 10 : 26 - 16 * Math.log(w / 40000) / Math.log(300000 / 40000);
const chapter = (t, num, text, dur = 3.0) => ({ type: 'chapter', t0: t, t1: t + dur, num, text, y: 520, size: 150 });
const ch2t = C2 - 1.9, ch3t = C3 - M.gap + .6;

export default {
  size: [1920, 1080], duration: END, final: true, fine: true, capStyle: 'film', hatchA: .45, maxTilt: 30, vo: 'long', zoomBlur: false,
  cam,
  tilt: cam.map(c => ({ t: c.t, v: tiltOf(c.w) })),
  story: [...S1.story, ...S2.story, ...S3.story].sort((a, b) => a.t - b.t),
  dark: [...S2.dark, ...S3.dark],
  hideDate: [[0, M.coldEnd + M.coldGap], ...S.flatMap(s => s.hideDate), [END - 8, END + 1]],
  clock: S2.clock, legend: S1.legend.length ? S1.legend.map(([a, b]) => [Math.max(a, M.coldEnd + M.coldGap), b + 2]) : [],
  shake: S.flatMap(s => s.shake),
  phases: S.flatMap(s => s.phases).filter(p => p.t0 > M.coldEnd),
  items: [
    ...S1.items.map(it => it.text === 'TRAPPED' ? { ...it, t1: Math.min(it.t1, ch2t - .15) } : it), ...S2.items, ...FX, ...S3.items,
    { type: 'chapter', t0: M.coldEnd + .3, t1: M.coldEnd + M.coldGap - .1, num: 'THE FALL OF A CAPITAL', text: 'NANJING 1937', y: 520, size: 170 },
    chapter(M.coldEnd + M.coldGap + .1, 'PART I', 'THE TRAP', 2.6),
    chapter(ch2t, 'PART II', 'THE WALL'),
    chapter(ch3t, 'PART III', 'SIX WEEKS'),
    { type: 'panel', t0: END - 3.2, t1: END + 1, dim: 1, rows: [] },
  ],
};
