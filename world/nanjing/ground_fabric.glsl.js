var e=`
float fabHash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
float fabNoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(fabHash(i), fabHash(i + vec2(1.0, 0.0)), f.x), mix(fabHash(i + vec2(0.0, 1.0)), fabHash(i + vec2(1.0, 1.0)), f.x), f.y);
}
float fabAA(float period, float px) { return 1.0 - smoothstep(0.2 * period, 0.45 * period, px); }

// Courses of slabs or bricks, size.x long along d and size.y wide, each course started at its own place. joint: 1 on a
// joint; tone: the piece's own number (0..1); tilt: how this piece sits (a normal offset in the world frame).
void fabSlabs(vec2 w, vec2 d, vec2 size, float px, out float joint, out float tone, out vec2 tilt) {
  vec2 s = vec2(-d.y, d.x);
  float u = dot(w, d), v = dot(w, s);
  float rv = v / size.y;
  float row = floor(rv);
  // (pass 2) every course starts at its own place and is cut into slabs of two lengths (the cut moves from unit to unit)
  float ru = (u + fabHash(vec2(row, 3.7)) * size.x * 2.0) / (size.x * 2.0);
  float unit = floor(ru);
  float split = 0.30 + 0.40 * fabHash(vec2(unit * 1.7 + 9.0, row * 0.9 + 2.0));
  float fu = fract(ru);
  float second = step(split, fu);
  float lo = second * split, hi = mix(split, 1.0, second);
  float col = unit * 2.0 + second;
  float eu = min(fu - lo, hi - fu) * 2.0 * size.x;
  float fv = fract(rv);
  float ev = min(fv, 1.0 - fv) * size.y;
  float e = min(eu, ev);
  float fine = fabAA(size.y, px);
  float jw = 0.007 + 0.006 * fabHash(vec2(col * 0.37 + 3.0, row * 2.3));
  // (the joint keeps its real width: seen from far it fades, it is not widened into a dark line)
  joint = (1.0 - smoothstep(jw, 2.0 * jw + 0.9 * px, e)) * fine * (0.014 / (0.014 + 0.45 * px));
  tone = fabHash(vec2(col * 1.13 + 17.0, row));
  vec2 t2 = (vec2(fabHash(vec2(col + 5.0, row * 1.7)), fabHash(vec2(col * 0.7, row + 11.0))) - 0.5) * 0.12 * fine;
  // the edge of a slab is worn round: the surface leans away from the middle of the slab there
  vec2 inw = eu < ev ? d * ((fu - lo < hi - fu) ? 1.0 : -1.0) : s * (fv < 0.5 ? 1.0 : -1.0);
  float bevel = (1.0 - smoothstep(0.0, 0.05, e)) * fabAA(0.2, px);
  tilt = t2.x * d + t2.y * s + inw * 0.3 * bevel;
}

// Two cart ruts 1.24 m apart (a Chinese cart's track), one way every 4.6 m across, wandering a little, deeper in places.
float fabRut(vec2 w, vec2 d, float px) {
  vec2 s = vec2(-d.y, d.x);
  float al = dot(w, d), ac = dot(w, s) + 1.8 * (fabNoise(vec2(al * 0.03, 9.0)) - 0.5);
  float c = (fract(ac / 4.6 + 0.5) - 0.5) * 4.6;
  float rd = (abs(c) - 0.62) / 0.13;
  float r = exp(-rd * rd);
  r *= 0.45 + 0.55 * smoothstep(0.25, 0.7, fabNoise(vec2(al * 0.10, ac * 0.4 + 3.0)));
  return r * fabAA(0.3, px);
}

// A fleck of something loose (a bit of brick, lime, a leaf) in a cell of the given size: 1 inside it.
float fabFleck(vec2 w, float cell, float lo, float px) {
  // (landcover2: every fleck was the same round dot on a jittered grid, 'stamps'; now the grid is bent, each fleck has its own size and is not round)
  vec2 wq = w + 0.35 * cell * (vec2(fabNoise(w * (1.7 / cell) + 3.0), fabNoise(w * (1.7 / cell) + 11.0)) - 0.5);
  vec2 ci = floor(wq / cell);
  float h = fabHash(ci + 41.0);
  float rs = 0.6 + 0.9 * fabHash(ci + 23.0);
  vec2 fp = fract(wq / cell) - 0.5 - (vec2(fabHash(ci + 5.1), fabHash(ci + 9.7)) - 0.5) * 0.5;
  fp.x *= 0.65 + 0.7 * fabHash(ci + 31.0);
  return step(lo, h) * (1.0 - smoothstep(0.16 * rs, 0.30 * rs, length(fp))) * fabAA(cell, px);
}

// The cracks of dried mud: the edges of a Voronoi tiling with cells of the given size (1 on a crack).
float fabCracks(vec2 w, float cell, float px) {
  vec2 p = w / cell, i = floor(p), f = fract(p);
  float d1 = 8.0, d2 = 8.0;
  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      vec2 g = vec2(float(x), float(y));
      vec2 o = vec2(fabHash(i + g + 1.7), fabHash(i + g + 9.1));
      float d = length(g + o - f);
      if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) { d2 = d; }
    }
  }
  return (1.0 - smoothstep(0.02, 0.09, d2 - d1)) * fabAA(cell * 0.4, px);
}

// The open ground outside the town, seen from a few metres: grit and clods on all of it, and by class 1 paddy, 2 dry field,
// 6 wood floor, 7 dead grass (tussocks), 8 dried mud (cracks), 9 reeds (litter).
void fabGround(float cls, vec2 w, float px, float pn, inout float k, inout vec3 hueTo, inout vec2 nrel, inout float rough) {
  k *= 1.0 + 0.22 * (fabNoise(w * 9.0) - 0.5) * fabAA(0.11, px) + 0.18 * (fabNoise(w * 37.0) - 0.5) * fabAA(0.027, px);
  vec2 e = vec2(0.03, 0.0);
  if (cls > 6.5 && cls < 7.5) {
    // (landcover2: the tussocks were one noise at one scale, thresholded: identical pale ovals in rows across a whole lawn. Now the point is warped, the density follows a slow field of its own
    // (bare earth in places, thick grass in others) and the colour is a dull straw, not a pale green)
    vec2 wq = w + 0.45 * vec2(fabNoise(w * 1.3 + 3.0), fabNoise(w * 1.3 + 17.0)) - 0.22;
    float q = fabNoise(wq * 3.1 + 11.0);
    float dens = 0.30 + 0.70 * smoothstep(0.25, 0.75, fabNoise(w * 0.13 + 5.0));
    float tuft = smoothstep(0.5, 0.85, q) * fabAA(0.32, px) * dens;
    k *= 1.0 - 0.22 * tuft + 0.14 * (1.0 - tuft) * (fabNoise(w * 1.1) - 0.5) + 0.12 * (fabNoise(w * 0.23 + 29.0) - 0.5) * fabAA(4.0, px);
    hueTo = mix(hueTo, vec3(0.98, 1.0, 0.88), tuft * 0.6);
    nrel += 1.0 * dens * vec2(fabNoise(wq * 3.1 + 11.0 + e.xy) - fabNoise(wq * 3.1 + 11.0 - e.xy), fabNoise(wq * 3.1 + 11.0 + e.yx) - fabNoise(wq * 3.1 + 11.0 - e.yx)) * fabAA(0.32, px);
  } else if (cls > 7.5 && cls < 8.5) {
    float cr = fabCracks(w, 0.28, px);
    k *= 1.0 - 0.38 * cr;
    k *= 1.0 + 0.3 * (fabNoise(w * 0.45 + 5.0) - 0.5) * fabAA(2.2, px);
  } else if (cls < 2.5) {
    k *= 1.0 + 0.22 * fabFleck(w, 0.25, 0.9, px);
    nrel += 0.5 * vec2(fabNoise(w * 6.7 + e.xy) - fabNoise(w * 6.7 - e.xy), fabNoise(w * 6.7 + e.yx) - fabNoise(w * 6.7 - e.yx)) * fabAA(0.15, px);
  } else if (cls > 5.5 && cls < 6.5) {
    k *= 1.0 - 0.3 * fabFleck(w, 0.13, 0.8, px);
  } else if (cls > 8.5 && cls < 9.5) {
    k *= 1.0 - 0.25 * fabFleck(w, 0.2, 0.8, px);
  }
}

// The open ground of the town, by class (ground.py): 4 packed earth, 5 street (ruts), 13 stone slabs, 14 brick paving,
// 15 waste ground (rubble, dead weeds), 16 cinders. dir: the way the slabs and ruts run; pn: the patch's own number 0..1.
void fabTerrain(float cls, vec2 w, vec2 dir, float px, float pn, inout float k, inout vec3 hueTo, inout vec2 nrel, inout float rough) {
  float j, t; vec2 tl;
  if (cls > 12.5 && cls < 13.5) {
    fabSlabs(w, dir, vec2(1.1, 0.5), px, j, t, tl);
    k *= (1.0 - 0.55 * j) * mix(1.0, 0.80 + 0.40 * t, fabAA(0.5, px));
    k *= 1.0 + 0.12 * (fabNoise(w * 0.8 + 3.0) - 0.5) * fabAA(1.2, px);
    hueTo = mix(vec3(1.0), mix(vec3(0.95, 1.0, 1.04), vec3(1.03, 1.0, 0.94), fabNoise(w * 0.35 + 9.0)), fabAA(2.0, px));
    nrel += tl;
    rough = mix(rough, 0.78, fabAA(1.0, px));
  } else if (cls > 13.5 && cls < 14.5) {
    fabSlabs(w, dir, vec2(0.24, 0.115), px, j, t, tl);
    k *= (1.0 - 0.5 * j) * mix(1.0, 0.76 + 0.48 * t, fabAA(0.115, px));
    hueTo = mix(vec3(1.0), mix(vec3(1.05, 0.96, 0.92), vec3(0.97, 1.0, 1.03), step(0.7, t)), fabAA(0.115, px));
    nrel += tl * 0.5;
  } else if (cls > 14.5 && cls < 15.5) {
    vec2 wpp = w + 1.6 * vec2(fabNoise(w * 0.37 + 5.0), fabNoise(w * 0.37 + 21.0)) - 0.8;   // (landcover2: the patches were one noise on a lattice: green ovals 2 m wide every 5 m across a whole yard; now bent, two scales, straw not green)
    float pat = smoothstep(0.40, 0.70, 0.6 * fabNoise(wpp * 0.20 + 17.0) + 0.4 * fabNoise(wpp * 0.57 + 3.0));
    hueTo = mix(vec3(1.0), vec3(0.98, 1.0, 0.92), pat * fabAA(9.0, px));
    k *= 1.0 + 0.26 * (fabNoise(w * 1.6) - 0.5) * fabAA(0.62, px) + 0.14 * (fabNoise(w * 5.3) - 0.5) * fabAA(0.19, px);
    float fl = fabFleck(w, 0.30, 0.90, px);
    float brick = step(0.95, fabHash(floor(w / 0.30) + 41.0));
    k *= 1.0 + fl * (brick > 0.5 ? 0.65 : -0.30);
    hueTo *= mix(vec3(1.0), vec3(1.12, 0.88, 0.80), fl * brick);
  } else if (cls > 15.5 && cls < 16.5) {
    k *= 1.0 + 0.30 * (fabNoise(w * 4.0) - 0.5) * fabAA(0.25, px) + 0.14 * (fabNoise(w * 0.5 + 8.0) - 0.5) * fabAA(2.0, px);
    k *= 1.0 + 0.5 * fabFleck(w, 0.14, 0.93, px);
  } else if (cls > 3.5 && cls < 4.5) {
    float damp = smoothstep(0.56, 0.74, fabNoise(w * 0.085 + 13.0)) * fabAA(12.0, px);
    k *= 1.0 - 0.24 * damp;
    rough = mix(rough, 0.6, damp * 0.7);   // (pass 2: 0.42 mirrored the low sun as white blobs from 80 m)
    k *= 1.0 + 0.20 * (fabNoise(w * 2.3 + 2.0) - 0.5) * fabAA(0.43, px);
    k *= 1.0 - 0.18 * fabFleck(w, 0.22, 0.88, px);
    // (pass 3) trodden earth has structure at every size, dust and damp from a few metres down to a hand's breadth, so that from
    // 30-250 m it is not one flat colour; a slow drift of hue (weedy one way, dusty ochre the other); scraps of straw, brick, ash
    k *= 1.0 + 0.14 * (fabNoise(w * 0.62 + 21.0) - 0.5) * fabAA(1.6, px) + 0.16 * (fabNoise(w * 0.19 + 3.0) - 0.5) * fabAA(5.3, px) + 0.14 * (fabNoise(w * 0.065 + 8.0) - 0.5) * fabAA(15.0, px);
    hueTo = mix(vec3(1.0), mix(vec3(0.95, 1.03, 0.94), vec3(1.05, 1.0, 0.93), fabNoise(w * 0.045 + 5.0)), 0.6 * fabAA(22.0, px));
    float scrap = fabFleck(w, 0.42, 0.9, px);
    k *= 1.0 + 0.35 * scrap * (fabHash(floor(w / 0.42) + 7.0) > 0.5 ? 1.0 : -0.6);
  } else if (cls > 4.5 && cls < 5.5) {
    float r = fabRut(w, dir, px);
    k *= 1.0 - 0.38 * r;
    rough = mix(rough, 0.5, r * 0.5);
  }
}

// Road surfaces. kind: 0 asphalt, 1 water-bound macadam, 2 sand-gravel, 3 lane of stone slabs, 4 earth verge. dir: the way the
// road runs there (from the class map), px: metres a pixel covers.
void fabRoad(int kind, vec2 w, vec2 dir, float px, inout float k, inout vec3 hueTo, inout vec2 nrel, inout float rough) {
  vec2 side = vec2(-dir.y, dir.x);
  float al = dot(w, dir), ac = dot(w, side);
  float j, t; vec2 tl;
  if (kind <= 1) {
    float mac = float(kind);
    // asphalt of 1937 is dark, but paler where it is worn and dusty, darker where it was patched
    k *= 0.88 + 0.24 * smoothstep(0.30, 0.70, fabNoise(w * 0.12 + 7.0));
    k *= 1.0 + 0.10 * (fabNoise(w * 1.3) - 0.5) * fabAA(0.8, px);
    // repairs: rectangles laid along the road (a hole cut out and filled): new asphalt is dark, a gravel patch pale
    vec2 pc = vec2(al / 9.0, ac / 3.2);
    vec2 pi = floor(pc), pf = fract(pc);
    float ph = fabHash(pi + 13.0);
    float inPatch = step(0.90, ph) * step(0.12, pf.x) * step(pf.x, 0.88) * step(0.15, pf.y) * step(pf.y, 0.85);
    k *= 1.0 + inPatch * (ph > 0.95 ? -0.22 : 0.16) * fabAA(3.0, px);
    // tyres polish two tracks in every lane of traffic
    float lane = (fract(ac / 3.4 + 0.5) - 0.5) * 3.4;
    float td = (abs(lane) - 0.80) / 0.28;
    float trk = exp(-td * td);
    k *= 1.0 - 0.13 * trk * fabAA(1.0, px) * (0.5 + 0.5 * fabNoise(vec2(al * 0.05, ac * 0.2)));
    // the grit of the surface
    k *= 1.0 + (0.08 + 0.06 * mac) * (fabHash(floor(w / (0.03 + 0.03 * mac))) - 0.5) * (1.0 - smoothstep(0.004, 0.012, px));   // (pass 3: it glittered like frost in the low sun from 10-30 m)
    hueTo = mix(vec3(1.0), vec3(1.04, 1.0, 0.94), 0.5 * mac);
    rough = 0.9;
    if (kind == 1) {
      // potholes of a macadam road, a few to a hundred metres, half full of water
      vec2 hc = floor(w / 11.0);
      float hh = fabHash(hc + 71.0);
      vec2 hp = (hc + vec2(fabHash(hc + 3.0), fabHash(hc + 8.0)) * 0.7 + 0.15) * 11.0;
      float rad = 0.45 + 0.5 * fabHash(hc + 5.0);
      float dd = length(w - hp);
      float pot = step(0.84, hh) * (1.0 - smoothstep(0.7, 1.0, dd / rad));
      k *= 1.0 - 0.45 * pot;
      rough = mix(rough, 0.3, pot);
      nrel += (w - hp) / max(dd, 0.02) * pot * 0.35;
    }
  } else if (kind == 2) {
    float r = fabRut(w, dir, px);
    k *= (1.0 - 0.30 * r) * (1.0 + 0.12 * (fabHash(floor(w / 0.045)) - 0.5) * (1.0 - smoothstep(0.004, 0.012, px)));
    k *= 1.0 + 0.12 * (fabNoise(w * 0.5 + 2.0) - 0.5) * fabAA(2.0, px);
    k *= 1.0 + 0.45 * fabFleck(w, 0.17, 0.92, px);
    rough = 0.94;
  } else if (kind == 3) {
    fabSlabs(w, dir, vec2(1.0, 0.5), px, j, t, tl);
    k *= (1.0 - 0.55 * j) * mix(1.0, 0.78 + 0.44 * t, fabAA(0.5, px));
    k *= 1.0 + 0.14 * (fabNoise(w * 0.9 + 5.0) - 0.5) * fabAA(1.1, px);
    hueTo = mix(vec3(1.0), mix(vec3(0.95, 1.0, 1.05), vec3(1.04, 1.0, 0.93), fabNoise(w * 0.3)), fabAA(2.0, px));
    nrel += tl;
    rough = 0.8;
  } else {
    float r = fabRut(w, dir, px);
    k *= (1.0 - 0.28 * r) * (1.0 + 0.2 * (fabNoise(w * 2.1) - 0.5) * fabAA(0.48, px));
    k *= 1.0 - 0.2 * fabFleck(w, 0.2, 0.9, px);
  }
}

// ---- (landcover2, 11-10) the lines of the plots and the structure of a field seen from 20-200 m (everything 推测 but the way the land lay: Jiangnan farmland
// in winter is raised beds with furrows, bunds between the plots, ditches in the low land, footpaths along the long sides, standing water in some paddies).
// A periodic pattern is held while its period is wider than ~13 pixels and is gone by ~33 (the rule of the integrator's rows: no beat against the pixel grid).
float fabRow(float period, float px) { return 1.0 - smoothstep(0.03 * period, 0.075 * period, px); }
float fabBankH(float a, float w0) { return 0.25 * (1.0 - smoothstep(0.25 * w0, w0, a)); }

// Classes 17 bund, 18 ditch, 19 footpath: the texel carries its own line (landcover.py: g the angle of the line's normal, b where it passes, 50 steps a metre,
// from the texel's centre c); n: the normal, s: that offset in metres. The rest of the 4 m texel is the plot's margin of dead grass and clods.
void fabBund(float cls, vec2 w, vec2 c, vec2 n, float s, float px, inout float k, inout vec3 hueTo, inout vec2 nrel, inout float rough) {
  vec2 t = vec2(-n.y, n.x);
  float al = dot(w, t);
  float d = dot(w - c, n) - s + 0.18 * (fabNoise(vec2(al * 0.35, 4.0)) - 0.5);
  float a = abs(d);
  float soft = max(px, 0.04);
  float tuft = smoothstep(0.55, 0.85, fabNoise(w * 2.6 + 5.0)) * fabAA(0.4, px);
  k *= 1.0 + 0.2 * (fabNoise(w * 0.8 + 9.0) - 0.5) * fabAA(1.4, px) - 0.18 * tuft;
  hueTo = mix(hueTo, vec3(1.04, 1.01, 0.9), tuft * 0.6);
  if (cls < 17.5) {
    float wd = 0.55 + 0.35 * fabNoise(vec2(al * 0.06, 8.0));
    float b = (1.0 - smoothstep(wd * 0.55, wd + soft, a)) * (1.0 - smoothstep(0.6, 2.2, px / wd));
    k *= 1.0 + 0.07 * b;
    hueTo = mix(hueTo, vec3(1.05, 1.03, 0.93), b * 0.6);
    nrel += n * (fabBankH(abs(d + 0.12), wd) - fabBankH(abs(d - 0.12), wd)) / 0.48 * fabAA(2.0, px);
  } else if (cls < 18.5) {
    float wd = 0.55 + 0.15 * fabNoise(vec2(al * 0.1, 2.0));
    float wat = (1.0 - smoothstep(wd * 0.8, wd + soft, a)) * (1.0 - smoothstep(0.6, 2.2, px / wd));
    // (r3 gd, 11-17) the bank is as wide as it is (wd .. 2.4 wd), not as wide as a pixel: with "+ soft" it grew to 3-4 m at 2 m a pixel and drew
    // the ditch as a dark band across the fields from 150-400 m; it fades like the water line, the colour map carries the line from there on
    float bank = (1.0 - smoothstep(wd, wd * 2.4 + min(soft, 0.3), a)) * (1.0 - wat) * (1.0 - smoothstep(0.6, 2.2, px / (wd * 2.4)));
    k *= mix(1.0, 0.40, wat) * (1.0 - 0.12 * bank);
    hueTo = mix(hueTo, vec3(0.78, 0.94, 1.12), wat);
    rough = mix(rough, 0.05, wat);
    nrel += n * (fabBankH(abs(d + 0.12), wd * 2.4) - fabBankH(abs(d - 0.12), wd * 2.4)) / 0.24 * (1.0 - wat) * fabAA(2.0, px);
  } else {
    float wd = 0.42 + 0.1 * fabNoise(vec2(al * 0.2, 6.0));
    float p = (1.0 - smoothstep(wd * 0.6, wd + soft, a)) * (1.0 - smoothstep(0.6, 2.2, px / wd));
    k *= 1.0 + 0.14 * p;
    hueTo = mix(hueTo, vec3(1.06, 1.0, 0.9), p);
  }
}

// Fields seen from 20-200 m, by the plot's own direction dir and number pn: 1 paddy (plough furrows, wet hollows, straw), 2 dry field (raised beds 1.5-2.5 m with a
// furrow between them, thin drill rows of winter wheat or rape on the beds of some plots), 3 vegetable plot (cabbage heads).
void fabField(float cls, vec2 w, vec2 dir, float pn, float px, inout float k, inout vec3 hueTo, inout vec2 nrel, inout float rough) {
  vec2 s = vec2(-dir.y, dir.x);
  float al = dot(w, dir);
  float ac = dot(w, s) + 1.3 * (fabNoise(vec2(al * 0.04, pn * 20.0)) - 0.5);
  if (cls < 1.5) {
    float P = 0.7 + 0.3 * fract(pn * 9.1);
    float f = 0.5 + 0.5 * cos(6.2832 * ac / P);
    // (r3 gd, 11-17) every class term is zero-mean: the plot's mean tone is the colour map's (landcover.py, anti-aliased plot edges); a term
    // with a mean shift repainted the plot's tone with the 4 m stair of the class texel (the stair-stepped field outlines from 60-400 m)
    k *= 1.0 - 0.16 * (f - 0.5) * fabRow(P, px);
    // wet hollows of a drained December paddy: soil lying a few cm low, damp, a little darker and greyer, soft-edged, a few per cent of the
    // ground, no open water (so no sky in it: roughness of damp soil, not a mirror). (r3 gd: was a hard 0.60-0.68 threshold on 28 % of every
    // paddy, -38 %, blue, roughness 0.12: the blue-grey camouflage blotches.) Beyond ~1.3 m a pixel they are below a pixel: their mean (0.045).
    float pudN = smoothstep(0.70, 0.90, fabNoise(w * 0.31 + pn * 50.0));
    float pudA = fabAA(3.0, px);
    float pud = mix(0.045, pudN, pudA);
    k *= 1.0 - 0.14 * (pud - 0.045);
    hueTo = mix(hueTo, vec3(0.97, 0.98, 1.0), (pud - 0.045) * pudA);
    rough = mix(rough, 0.6, pudN * pudA * 0.5);
    float straw = smoothstep(0.62, 0.8, fabNoise(vec2(al * 0.15, ac * 1.7) + pn * 30.0)) * fabRow(0.6, px) * (1.0 - pud);
    k *= 1.0 + 0.14 * straw;
    hueTo = mix(hueTo, vec3(1.1, 1.05, 0.88), straw * 0.7);
  } else if (cls < 2.5) {
    float bw = 1.5 + 1.0 * fract(pn * 7.3);
    float u = ac / bw;
    float fu = fract(u);
    float furrow = 1.0 - smoothstep(0.10, 0.22 + px, min(fu, 1.0 - fu) * bw);
    float vis = fabRow(bw, px);
    k *= 1.0 - 0.22 * (furrow - (0.32 + px) / bw) * vis;   // (r3 gd: zero-mean, the furrows' share of the bed taken out; 0.30 -> 0.22: the furrow is the same soil a hand lower, its shade is the relief's below)
    nrel += s * 0.05 * sin(6.2832 * u) * vis;
    float crop = step(0.42, fract(pn * 3.3));
    float rr = 0.5 + 0.5 * cos(6.2832 * ac / 0.22);
    float line = rr * rr * rr * rr * (1.0 - furrow) * crop * fabRow(0.22, px);
    hueTo = mix(hueTo, vec3(0.9, 1.14, 0.8), line * 0.75);
    k *= 1.0 - 0.06 * line;
  } else {
    float hd = fabFleck(w, 0.5, 0.55, px) * (0.4 + 0.6 * smoothstep(0.3, 0.7, fabNoise(w * 0.21 + 9.0)));   // (heads of cabbage: small, in patches, dull: bright round ones read as stamps)
    hueTo = mix(hueTo, vec3(0.93, 1.0, 0.92), hd * 0.5);
    k *= 1.0 - 0.06 * hd;
  }
}

// Class 20: a paddy plot under standing water in December: a dark sheet that mirrors the sky, tufts of stubble standing out of it.
// (r3 gd, 11-17) the sheet's dark tone is the colour map's (landcover.py paints the flooded plot with a smooth straight edge); here only the
// zero-mean structure: the stubble tufts standing out of it. The darkening, the blue and the mirror roughness here stopped at the 4 m class
// texel and drew the flooded plots as stair-edged sky-grey patches (e08). A mirror needs the plot's true edge, which a 4 m class texel has not.
void fabFlood(vec2 w, float pn, float px, inout float k, inout vec3 hueTo, inout vec2 nrel, inout float rough) {
  k *= 1.0 + 0.1 * (fabNoise(w * 0.6 + pn * 40.0) - 0.5) * fabAA(1.7, px);
  float st = fabFleck(w, 0.55, 0.7, px);
  k *= 1.0 + 0.6 * st;
  hueTo = mix(hueTo, vec3(1.1, 1.04, 0.86), st);
}
`;export{e as FABRIC_GLSL};