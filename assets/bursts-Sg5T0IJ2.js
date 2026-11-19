// Shell and bomb bursts for the timeline's `artillery`, `bombing` and `battle` events (FILM_CONTRACT: "the people and
// fire mods draw these"; the people area draws the guns, the bursts are drawn here). Rewritten in wave 6b.
//
// ROUNDS. Each event fires at a rate (推测: a field gun in a sustained bombardment about 40 rounds an hour, mortars and grenades in a
// battle 20 an hour per thousand men, a bomber about 6 bombs an hour over its target) that rises to the event's peak and falls after
// it. The k-th round lands at the moment the cumulative count of rounds reaches k + a seeded jitter, so the rhythm is irregular (rounds
// bunch and pause, 3 in 10 follow their predecessor within a second or two: salvos), and the count over any stretch of time is exactly
// the integral of the rate (the wave-4 version spaced them by the rate at the moment of looking, so a burst's moment moved as the
// rate changed).
// WHERE. Not spread evenly over the disc: shells fall on the positions under attack (推测 from the events' own geometry; no source gives
// an aiming point). A target at a city gate or the wall is hit ON the wall: along it, within the event radius of the gate, spread
// about 12 m across it (the wall top, the gate towers and the foot of the wall); a target on open ground (the Yuhuatai crest) is hit
// round three or four strongpoints inside the disc; a front (a battle's path) is hit round four strongpoints along it and
// otherwise along its whole length; bombers drop sticks of five along a seeded heading, 35 m apart. The craters the warprops
// area places (public/nanjing/warprops.json) are rounds too: at the moment a crater appears a burst lands on it (opts.craters).
// WHEN SHOWN. A burst is shown for about half a second of screen time whatever the time-lapse speed (a real one lasts seconds: in a
// time-lapse of hours a second it would never be seen), so at high speed only a share of them is drawn (at most MAX_PER_EVENT at once),
// chosen by their number: the same moment always shows the same bursts.
// Used by: mods/fire.js (drawing, and the smoke the rounds leave), people/behave2.js (the guns' flashes, a flight time earlier):
// the names burstSources / eachBurst, the callback (x, z, phase, size, seed[, src]), showSec = max(9, 0.5 * speed), the source's id
// and its use through eachBurst only are the contract.
const MAX_PER_EVENT = 56;
const hash = (a, b, c) => { let h = Math.imul((a | 0) ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul((b | 0) + c * 0x27d4eb2f, 0xc2b2ae35); h ^= h >>> 15; h = Math.imul(h, 0x2c1b3c6d); h ^= h >>> 12; h = Math.imul(h, 0x297a2d39); h ^= h >>> 15; return (h >>> 0) / 4294967296; };
const gauss = (a, b) => { const r = Math.sqrt(-2 * Math.log(Math.max(1e-6, a))), th = 6.2832 * b; return [r * Math.cos(th), r * Math.sin(th)]; };

// the nearest point of a polyline to (x, z): { x, z, dx, dz (unit tangent), d }
function nearestOn(poly, x, z) {
  let best = null;
  for (let i = 0; i + 1 < poly.length; i++) {
    const [ax, az] = poly[i], [bx, bz] = poly[i + 1], dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz || 1;
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / l2)), px = ax + t * dx, pz = az + t * dz, d = Math.hypot(x - px, z - pz);
    if (!best || d < best.d) { const l = Math.sqrt(l2); best = { x: px, z: pz, dx: dx / l, dz: dz / l, d }; }
  }
  return best;
}

// events: the timeline's; hoursOf: ms -> story hours. opts (all optional; people/behave2.js calls with none): wall (the city wall polyline
// [[x, z], ...]), craters ([{ t, x, z }] story hours, from warprops.json).
export function burstSources(events, hoursOf, opts = {}) {
  const out = [];
  let n = 0;
  for (const e of events ?? []) {
    if (!['artillery', 'bombing', 'battle'].includes(e.kind) || !e.geom?.coords?.length) continue;
    const t0 = hoursOf(Date.parse(e.start)), t1 = hoursOf(Date.parse(e.end));
    if (!(t1 > t0)) continue;
    const v = e.vehicles ?? {}, guns = v.guns ?? 0, planes = v.planes ?? 0, men = e.count ?? 0;
    let rate = 0, size = 1;
    // (wave 6b: 80 rounds an hour a gun, was 40: the fire before an assault is faster than a sustained bombardment, 推测; the gun numbers are the timeline's display numbers)
    if (e.kind === 'artillery') { rate = Math.max(2, guns) * 80; size = 1.25; }
    else if (e.kind === 'bombing') { rate = Math.max(1, planes) * 6; size = 2.4; }
    else { rate = guns * 30 + (men / 1000) * 20; size = 1.0; }
    if (rate <= 0) continue;
    const s = { id: e.id, kind: e.kind, t0, t1, peak: e.peak ? hoursOf(Date.parse(e.peak)) : null, rate, size,
      path: e.geom.type === 'path' ? e.geom.coords : null, point: e.geom.type !== 'path' ? e.geom.coords[0] : null,
      radius: e.geom.radius ?? (e.kind === 'battle' ? 60 : 150), salt: ++n * 7919, mode: 'disc', wall: null, aims: null, fixed: null };
    // where the rounds fall (see above)
    if (s.path) {
      s.mode = 'front';
      // strongpoints along the front: four seeded stretches (推测)
      const L = s.path.length - 1;
      s.aims = [0.12, 0.38, 0.62, 0.88].map((f, i) => { const u = Math.min(L - 1e-6, (f + (hash(0, s.salt, 20 + i) - 0.5) * 0.18) * L), j = Math.min(L - 1, Math.max(0, Math.floor(u))), w = u - j;
        const [x0, z0] = s.path[j], [x1, z1] = s.path[Math.min(L, j + 1)]; return [x0 + (x1 - x0) * w, z0 + (z1 - z0) * w]; });
    } else if (e.kind === 'bombing') {
      s.mode = 'sticks';
    } else if (opts.wall) {
      const w = nearestOn(opts.wall, s.point[0], s.point[1]);
      if (w && w.d < 260) { s.mode = 'wall'; s.wall = w; }
    }
    if (s.mode === 'disc' && e.kind === 'artillery') {
      s.mode = 'crest';
      s.aims = [0, 1, 2, 3].map((i) => { const [gx, gz] = gauss(hash(0, s.salt, 30 + i), hash(0, s.salt, 40 + i)); return [s.point[0] + gx * 0.4 * s.radius, s.point[1] + gz * 0.4 * s.radius]; });
    }
    if (opts.craters?.length) {
      // the craters that belong to this event: inside its disc (or within `radius` + 120 m of its path) and appearing inside its window
      const mine = opts.craters.filter((c) => c.t >= t0 && c.t <= t1 && (s.path ? nearestOn(s.path, c.x, c.z).d <= s.radius + 120 : Math.hypot(c.x - s.point[0], c.z - s.point[1]) <= s.radius * 1.15 + 60)).sort((a, b) => a.t - b.t);
      if (mine.length) s.fixed = mine;
    }
    out.push(s);
  }
  // (a crater belongs to the first event that claims it)
  const taken = new Set();
  for (const s of out) if (s.fixed) { s.fixed = s.fixed.filter((c) => { if (taken.has(c)) return false; taken.add(c); return true; }); if (!s.fixed.length) s.fixed = null; }
  return out;
}

// rounds an hour at story hour t (0 outside the event's window): rises to the peak, falls after it, or is even
export function roundRate(s, t) {
  if (t < s.t0 || t > s.t1) return 0;
  const ramp = s.peak != null ? (t < s.peak ? 0.35 + 0.65 * (t - s.t0) / Math.max(1e-3, s.peak - s.t0) : 0.35 + 0.65 * (s.t1 - t) / Math.max(1e-3, s.t1 - s.peak)) : 1;
  return s.rate * ramp;
}
// rounds fired between the event's start and story second `sec` after it (the integral of roundRate)
function cumulative(s, sec) {
  const T = (s.t1 - s.t0) * 3600, x = Math.max(0, Math.min(T, sec)), r0 = s.rate / 3600;
  if (s.peak == null) return r0 * x;
  const P = Math.max(1e-3, (s.peak - s.t0) * 3600), Q = Math.max(1e-3, (s.t1 - s.peak) * 3600);
  const up = Math.min(x, P);
  let c = r0 * (0.35 * up + 0.65 * up * up / (2 * P));
  if (x > P) { const d = x - P; c += r0 * (d - 0.65 * d * d / (2 * Q)); }
  return c;
}
// the story second (after the event's start) at which the cumulative count is c
function secOf(s, c) {
  let lo = 0, hi = (s.t1 - s.t0) * 3600;
  for (let i = 0; i < 28; i++) { const m = 0.5 * (lo + hi); if (cumulative(s, m) < c) lo = m; else hi = m; }
  return 0.5 * (lo + hi);
}
// when the k-th round falls (story seconds after the event's start). 3 in 10 follow the one before within 0.3-2 s (a salvo).
function roundAt(s, k) {
  if (k > 0 && hash(k, s.salt, 8) < 0.3) return secOf(s, k - 1 + hash(k - 1, s.salt, 1)) + 0.3 + 1.7 * hash(k, s.salt, 9);
  return secOf(s, k + hash(k, s.salt, 1));
}

// where the k-th round falls
function landing(s, k) {
  const a = hash(k, s.salt, 2), b = hash(k, s.salt, 3), c = hash(k, s.salt, 4), d = hash(k, s.salt, 10);
  if (s.mode === 'wall') {
    // along the wall within the event's radius of the gate (more of them near the gate), across it about 12 m
    const along = (a + b - 1) * 1.15 * s.radius, [gx] = gauss(c, d), across = gx * 12;
    // (a round that lands within 7 m of the wall's line is on its top: the burst starts at the wall's height, about 16 m, 推测: the walls' height
    // is 14-21 m by the research/raw/gap_wall_profile_segments.json; a generic value here)
    const lift = Math.abs(across) < 7 ? 16 * (0.75 + 0.25 * hash(k, s.salt, 14)) : 0;
    return [s.wall.x + s.wall.dx * along - s.wall.dz * across, s.wall.z + s.wall.dz * along + s.wall.dx * across, lift];
  }
  if (s.mode === 'crest') {
    if (a < 0.75) { const A = s.aims[Math.floor(b * s.aims.length) % s.aims.length], [gx, gz] = gauss(c, d); return [A[0] + gx * 0.2 * s.radius, A[1] + gz * 0.2 * s.radius]; }
    const r = s.radius * Math.sqrt(b), th = 6.2832 * c; return [s.point[0] + r * Math.cos(th), s.point[1] + r * Math.sin(th)];
  }
  if (s.mode === 'front') {
    if (a < 0.5) { const A = s.aims[Math.floor(b * s.aims.length) % s.aims.length], [gx, gz] = gauss(c, d); return [A[0] + gx * 35, A[1] + gz * 35]; }
    // along the whole front, mostly on its left (the defenders' side as the people area reads a battle path), 20-110 m off
    const L = s.path.length - 1, f = b * L, i = Math.min(L - 1, Math.floor(f)), u = f - i;
    const [x0, z0] = s.path[i], [x1, z1] = s.path[i + 1];
    let dx = x1 - x0, dz = z1 - z0; const l = Math.hypot(dx, dz) || 1; dx /= l; dz /= l;
    const side = c < 0.75 ? 1 : -1, off = side * (20 + 90 * d);
    // (left of the direction of travel, with x east and z south: (dz, -dx))
    return [x0 + (x1 - x0) * u + dz * off, z0 + (z1 - z0) * u - dx * off];
  }
  if (s.mode === 'sticks') {
    // a stick of five bombs, 35 m apart along a seeded heading, from a seeded place in the disc
    const stick = Math.floor(k / 5), j = k % 5, r = s.radius * Math.sqrt(hash(stick, s.salt, 11)), th = 6.2832 * hash(stick, s.salt, 12), hd = 6.2832 * hash(stick, s.salt, 13);
    return [s.point[0] + r * Math.cos(th) + Math.cos(hd) * 35 * (j - 2), s.point[1] + r * Math.sin(th) + Math.sin(hd) * 35 * (j - 2)];
  }
  const r = s.radius * Math.sqrt(a), th = 6.2832 * b;
  return [s.point[0] + r * Math.cos(th), s.point[1] + r * Math.sin(th)];
}

// the bursts visible at story hour t; speed = story seconds per screen second (0 in a still). Calls add(x, z, phase, size, seed, src, lift) for each.
export function eachBurst(sources, t, speed, add) {
  const showSec = Math.max(9, 0.5 * speed); // story seconds a burst stays (phase 0..1)
  for (const s of sources) {
    if (t < s.t0 || t > s.t1 + showSec / 3600) continue;
    const tSec = (t - s.t0) * 3600, T = (s.t1 - s.t0) * 3600;
    const kHi = Math.floor(cumulative(s, tSec)) + 1, kLo = Math.max(0, Math.floor(cumulative(s, tSec - showSec)) - 3);
    const inWin = Math.max(1, kHi - kLo);
    const every = Math.max(1, Math.ceil(inWin / MAX_PER_EVENT)); // draw one round in `every`
    for (let k = kHi - (kHi % every); k >= kLo; k -= every) {
      const at = roundAt(s, k);
      if (at > T) continue;
      const phase = (tSec - at) / showSec;
      if (phase < 0 || phase > 1) continue;
      const [x, z, lift] = landing(s, k);
      add(x, z, phase, s.size * (0.8 + 0.4 * hash(k, s.salt, 5)), hash(k, s.salt, 6), s, lift || 0);
    }
    // the craters that appear in this stretch: a round lands on each at the moment it appears (always shown: there are few)
    if (s.fixed) {
      for (let i = 0; i < s.fixed.length; i++) {
        const c = s.fixed[i], ph = (t - c.t) * 3600 / showSec;
        if (ph < 0) break;
        if (ph > 1) continue;
        add(c.x, c.z, ph, s.size * (0.95 + 0.3 * hash(i, s.salt, 15)), hash(i, s.salt, 16), s);
      }
    }
  }
}

