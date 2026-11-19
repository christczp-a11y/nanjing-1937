var e=12e3,t=class{constructor(t){this.THREE=t;let n=new t.BoxGeometry(2,1,2).translate(0,.5,0),r=this.geometry=new t.InstancedBufferGeometry;r.index=n.index,r.setAttribute(`position`,n.getAttribute(`position`)),this.a=new Float32Array(e*4),this.b=new Float32Array(e*4),this.c=new Float32Array(e*4),this.d=new Float32Array(e*4),this.attrs=[];for(let[e,n]of[[`iA`,this.a],[`iB`,this.b],[`iC`,this.c],[`iD`,this.d]]){let i=new t.InstancedBufferAttribute(n,4);i.setUsage(t.DynamicDrawUsage),r.setAttribute(e,i),this.attrs.push(i)}r.instanceCount=0,this.material=new t.ShaderMaterial({glslVersion:t.GLSL3,vertexShader:`
in vec4 iA; // x, y of the ground, z, radius (m)
in vec4 iB; // height of the box (m), strength, seed, mode (0 flame, 1 embers, 2 burst, 3 jet)
in vec4 iC; // world y below which nothing is drawn (the roof, until it falls in), phase (bursts), flash (bursts, 0..1, set in screen time by fire.js), 0
in vec4 iD; // bodies and ember beds: long axis x, z (unit), half width across it (m); jets: lean direction x, z, lean amount (box radii)
out vec3 vWorld;
out vec4 vA; out vec4 vB; out vec4 vC; out vec4 vD;
void main() {
  bool body = iB.w < 1.5;
  vec2 ux = body && length(iD.xy) > 0.5 ? normalize(iD.xy) : vec2(1.0, 0.0);
  float hb = body && iD.z > 0.0 ? iD.z : iA.w;
  vec2 off = ux * (position.x * iA.w) + vec2(-ux.y, ux.x) * (position.z * hb);
  vec3 w = vec3(iA.x + off.x, iA.y + position.y * iB.x, iA.z + off.y);
  vWorld = w; vA = iA; vB = iB; vC = iC; vD = iD;
  gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.0);
}`,fragmentShader:`
precision highp float;
uniform float uTime;
uniform float uGain;
uniform vec3 uSunE;   // the scene's sunlight (or moonlight) and sky, for the dust of a shell burst
uniform vec3 uSkyL;
uniform vec3 uSunDir; // towards the sun (or the moon), for the burst's self-shadow
uniform vec3 uDust;
uniform vec2 uWind;   // the wind's lean, in box radii per box height (a unit vector times the strength)
in vec3 vWorld;
in vec4 vA; in vec4 vB; in vec4 vC; in vec4 vD;
out vec4 fragColor;
float hh(float n) { return fract(sin(n) * 43758.5453123); }
// (an integer hash of the pixel: the sin() hashes repeat along a row and showed as scan lines in a flame seen from the side)
uint pcg(uint v) { uint st = v * 747796405u + 2891336453u; uint w = ((st >> ((st >> 28u) + 4u)) ^ st) * 277803737u; return (w >> 22u) ^ w; }
float pixelNoise(vec2 fc, float seed) { uvec2 p = uvec2(fc); return float(pcg(p.x + pcg(p.y + uint(seed * 1000.0)))) * (1.0 / 4294967295.0); }
// (a 3D integer hash: the usual fract() hash13 of small integer lattice points is correlated along axes, which stretched the noise into streaks
// when a flame was seen from a few metres; the lattice points here are whole numbers, so the argument is rounded)
float h13(vec3 p) { uvec3 v = uvec3(ivec3(floor(p + 0.5)) + 32768); v = v * 1664525u + 1013904223u; v.x += v.y * v.z; v.y += v.z * v.x; v.z += v.x * v.y; v ^= v >> 16u; v.x += v.y * v.z; v.y += v.z * v.x; v.z += v.x * v.y; return float(v.x) * (1.0 / 4294967295.0); }
float vn(vec3 p) {
  vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(h13(i), h13(i + vec3(1, 0, 0)), f.x), mix(h13(i + vec3(0, 1, 0)), h13(i + vec3(1, 1, 0)), f.x), f.y),
             mix(mix(h13(i + vec3(0, 0, 1)), h13(i + vec3(1, 0, 1)), f.x), mix(h13(i + vec3(0, 1, 1)), h13(i + vec3(1, 1, 1)), f.x), f.y), f.z);
}
// emitted colour of a flame at temperature t (0 cool, dull red .. 1 hottest, yellow-white): a blackbody-like ramp,
// radiance in the scene's units (a sunlit white wall is about 3)
vec3 fireColour(float t) {
  vec3 c = mix(vec3(0.5, 0.045, 0.01), vec3(1.0, 0.3, 0.035), smoothstep(0.0, 0.4, t));
  c = mix(c, vec3(1.0, 0.58, 0.14), smoothstep(0.35, 0.7, t));
  c = mix(c, vec3(1.0, 0.86, 0.5), smoothstep(0.7, 1.0, t));
  return c * (0.25 + 3.2 * t * t * t);
}
// The tongues of one body. q: the point in the box (x, z in box radii -1..1, y in box heights 0..1). Returns the density
// (0..1) and the temperature (0..1) there. lean: where the tops are blown to (box radii per box height squared), root:
// where the tongues' roots are centred; spread: how far the roots spread over the footprint (x, z). q's x, z are in units of the
// box's mean half width.
const int NT = 6;
vec2 tongues(vec3 q, float seed, float t, vec2 lean, vec2 root, vec2 spread, int count, bool cheap) {
  float dens = 0.0, temp = 0.0;
  for (int k = 0; k < NT; k++) {
    if (k >= count) break;
    float fk = float(k);
    float s1 = hh(seed * 91.7 + fk * 13.13), s2 = hh(seed * 37.1 + fk * 7.7), s3 = hh(seed * 53.3 + fk * 3.1), s4 = hh(seed * 11.9 + fk * 5.3);
    vec2 b = root + (vec2(s1, s2) - 0.5) * spread;
    // the height of this tongue (a fraction of the box), flickering at its own rate
    float hk = mix(0.4, 1.0, s3) * (0.8 + 0.2 * sin(t * (3.0 + 3.0 * s4) + fk * 2.1 + seed * 40.0));
    float y = q.y / hk;
    if (y >= 1.0) continue;
    float wk = mix(0.3, 0.58, s4);
    // (a cheap reject: the sway never takes a tongue further from its root than this)
    // (the same centre as the tongue's own, lean * y * y: with q.y * q.y here a leaning tongue was cut off in rows, as scan lines)
    if (length(q.xz - b - lean * (y * y)) > wk * 1.6 + 1.15 * y + 0.4) continue;
    float w1 = vn(vec3(fk * 3.1 + seed * 5.0, q.y * 2.4 - t * 1.4, 4.0)) - 0.5, w2 = vn(vec3(fk * 5.7 + 11.0, q.y * 2.4 - t * 1.2, 9.0 + seed * 3.0)) - 0.5;
    vec2 c = b + vec2(w1, w2) * (0.45 + 1.5 * y) + lean * (y * y);
    // tapers to the tip, thickened at the root where the fuel burns
    float rad = wk * pow(max(1.0 - y, 0.0), 0.7) * (1.0 + 0.6 * w1) * (1.0 + 0.5 * (1.0 - smoothstep(0.0, 0.18, q.y)));
    // the ragged edge: turbulence rising with the flame eats into it, more towards the tip
    float rag = cheap ? 0.5 + w1 * 0.8 : vn(vec3(q.xz * 2.0 + fk * 3.0, q.y * 2.6 - t * 3.0)); // (from far away the ragged edge borrows the sway's noise)
    float e = 1.0 - length(q.xz - c) / max(rad * (0.78 + 0.5 * rag), 0.02);
    if (e <= 0.0) continue;
    float de = smoothstep(0.0, 0.45, e);
    // hot at the root and along the core, cooler and sooty towards the tip and edge
    float tm = clamp((1.0 - y) * 0.75 + e * 0.35 - 0.2 + (rag - 0.5) * 0.35, 0.0, 0.9);
    dens = max(dens, de);
    temp = max(temp, tm * de);
  }
  return vec2(dens, temp);
}
// wave 6h: the shape of a shell or bomb burst on earth, in several parts with their own timing (l: the point in the burst's own frame, in units of 1/24 of the box's half width, about
// a metre for a round at the base size; ph: 0..1 of the burst's shown life, the same at any time-lapse speed). Returns the densities of
//   x: the fountain of earth (dark, ragged, thrown up and outward in the first 14 % of the life, falling back in streaks from 12 to 42 %),
//   y: the low roll of dust (spreads along the ground from the foot, billows, thins to the end),
//   z: the thinner column of dust and smoke (leans with the wind, pale, thins),
//   w: the shock ring on the ground (the first quarter of the life; a bomb's is strong).
// nz: low-frequency noise, noise stretched along y (streaks), high-frequency noise.
vec4 burstDens(vec3 l, float ph, vec4 P1, vec4 P2, vec4 P3, vec2 wind, vec3 nz, float ang) {
  float rho = length(l.xz);
  float up = step(0.0, l.y);
  // the fountain: a tulip, narrow at the foot and flaring to a ragged crown, its top falling as the fragments come down
  float yF = l.y / max(P1.x, 0.5);
  float rF = (1.6 + (P1.y - 1.6) * pow(clamp(yF, 0.0, 1.0), 0.65)) * (0.7 + 0.6 * nz.z);
  float dF = (1.0 - smoothstep(0.5, 1.0, rho / max(rF, 0.5))) * up * (1.0 - smoothstep(0.82, 1.0, yF)) * (0.3 + 0.7 * nz.y);
  // the roll of dust along the ground: a disc growing outward with a fatter, rolling head at its rim
  float hR = P1.w * (0.55 + 0.9 * nz.x);
  float head = 1.0 + 1.1 * smoothstep(P1.z - 8.0, P1.z - 1.5, rho);
  float ringW = mix(0.28, 1.0, smoothstep(P1.z * 0.3, P1.z * 0.95, rho));
  float dR = (1.0 - smoothstep(P1.z * 0.72, P1.z, rho * (0.85 + 0.3 * nz.x))) * (1.0 - smoothstep(0.0, 1.0, l.y / max(hR, 0.5))) * up * head * ringW * (0.3 + 0.7 * nz.x);
  // the column: a leaning tube of thin dust and smoke
  float yC = l.y / max(P2.x, 1.0);
  vec2 cc = wind * (yC * yC * (ph * 0.5 + 0.1) * 30.0);
  float rC = 4.6 + 8.5 * clamp(yC, 0.0, 1.0) + 3.0 * (nz.x - 0.5);
  float dC = (1.0 - smoothstep(0.45, 1.0, length(l.xz - cc) / max(rC, 0.5) * (1.0 + 1.5 * (0.5 - nz.x)))) * up * (1.0 - smoothstep(0.8, 1.0, yC)) * step(yC, 1.0) * (0.3 + 0.7 * nz.x);
  // the shock ring
  float dS = (1.0 - smoothstep(0.0, 2.4, abs(rho - P2.y))) * (1.0 - smoothstep(0.0, 1.6 + 1.6 * nz.x, l.y)) * up;
  return vec4(dF, dR * P3.x, dC * P3.y, dS * P3.z);
}
void main() {
  vec3 ro = cameraPosition, rd = normalize(vWorld - ro);
  float r = vA.w, H = vB.x, strength = vB.y, seed = vB.z, mode = vB.w;
  // the box in its own frame: x along the footprint's long axis, z across it (a flame body or an ember bed), else a square
  bool body = mode < 1.5;
  vec2 ux = body && length(vD.xy) > 0.5 ? normalize(vD.xy) : vec2(1.0, 0.0), uz = vec2(-ux.y, ux.x);
  float hw = body && vD.z > 0.0 ? vD.z : r, rm = 0.5 * (r + hw);
  vec3 d0 = ro - vA.xyz;
  vec3 rol = vec3(dot(d0.xz, ux), d0.y, dot(d0.xz, uz)), rdl = vec3(dot(rd.xz, ux), rd.y, dot(rd.xz, uz));
  vec3 bmin = vec3(-r, 0.0, -hw), bmax = vec3(r, H, hw);
  vec3 inv = 1.0 / rdl, t0 = (bmin - rol) * inv, t1 = (bmax - rol) * inv, tn3 = min(t0, t1), tf3 = max(t0, t1);
  float tn = max(max(max(tn3.x, tn3.y), tn3.z), 0.0), tf = min(min(tf3.x, tf3.y), tf3.z);
  if (tf <= tn) discard;
  // emission and absorption along the ray (luminous flames are partly opaque with soot): what is in front hides what
  // is behind, so overlapping flames never add up beyond the radiance of the flame itself
  vec3 col = vec3(0.0);
  float T = 1.0;
  float t = uTime + seed * 37.0;
  // (white noise, not a regular dither: a regular pattern showed as scan lines and vertical curtains across a flame seen from the side)
  float jit = pixelNoise(gl_FragCoord.xy, seed);
  if (mode < 0.5 || (mode > 2.5 && mode < 3.5)) {
    bool jet = mode > 2.5;
    // (about 0.45 m between samples, 12 to 36 of them: a thin sheet of flame seen edge on showed as lines when the steps were 0.9 m)
    const int N = 48;
    // (level of detail: from far away a body covers a few pixels, so its samples are coarser and its tongues fewer)
    float camD = length(vA.xyz - ro);
    int n = int(clamp((tf - tn) / max(camD < 60.0 ? 0.25 : 0.45, camD * 0.0045), 6.0, float(N)));
    float dt = (tf - tn) / float(n);
    float kappa = (jet ? 3.4 : 3.0) / max(rm, 0.5);
    // the wind leans a free flame; a jet leans out of its opening first (and then up, with the wind)
    vec2 lw = jet ? vD.xy * vD.z + uWind * 0.4 : uWind;
    vec2 lean = vec2(dot(lw, ux), dot(lw, uz));
    vec2 root = jet ? -vD.xy * 0.35 : vec2(0.0);
    vec2 spread = jet ? vec2(0.25) : 1.15 * vec2(r, hw) / rm;
    int count = jet ? 3 : (camD < 200.0 ? 6 : camD < 600.0 ? 4 : 2);
    for (int k = 0; k < N; k++) {
      if (k >= n) break;
      float tt = tn + (float(k) + jit) * dt;
      vec3 p = ro + rd * tt, pl = rol + rdl * tt;
      if (p.y < vC.x) continue;
      // (the flame comes up out of the roof: it fades in over 1.8 m above the clip height, so where it stands past the
      // roof's edge no flat cut shows in the air)
      float rise = jet ? 1.0 : smoothstep(vC.x, vC.x + 1.8, p.y);
      vec3 q = vec3(pl.x / rm, pl.y / H, pl.z / rm);
      vec2 f = tongues(q, seed, t, lean, root, spread, count, camD > 600.0);
      float d = f.x * rise;
      if (d <= 0.0) continue;
      float a = 1.0 - exp(-kappa * d * max(strength, 0.05) * dt);
      // (soot at the cool tips hides the fire behind it)
      vec3 emit = fireColour(f.y) * smoothstep(0.0, 0.3, strength + 0.15);
      col += T * a * emit;
      T *= 1.0 - a * (0.55 + 0.4 * (1.0 - f.y));
    }
  } else if (mode > 1.5 && mode < 2.5) {
    // a shell or bomb burst (phase in vC.y, 0..1), rebuilt in wave 6h from the real thing (burstDens above): the flash at the ground; a dark fountain of earth thrown up and outward in a
    // ragged crown that falls back in streaks; a roll of dust spreading along the ground from the foot; a thinner column of dust and smoke that leans with the wind; and, for a bomb, a
    // shock ring of dust on the ground in the first frames. On masonry (vD.x > 0: the wall and the gates) the fountain and the dust are grey-white stone and lime. Lit by the scene's sun
    // (or moon) and sky, a tap of self-shadow towards it, and from inside by its own flash. The box's half width is 24 units, its height 42 (fire.js).
    const int N = 16;
    vec3 col3 = vec3(0.0);
    float ph = vC.y, flash = vC.z, S = max(r / 24.0, 0.05), masonry = vD.x, bomb = vD.y;
    float dtm = (tf - tn) / float(N) / S;                            // a step, in units
    float j = pixelNoise(gl_FragCoord.xy, seed + 0.37);
    float a1 = clamp(ph / 0.14, 0.0, 1.0);
    float rise = 1.0 - pow(1.0 - a1, 2.2);
    float fall = smoothstep(0.14, 0.5, ph);
    float hF = 24.0 * (0.65 + 0.35 * hh(seed * 3.7 + 1.0)) * (1.0 + 0.25 * bomb);
    vec4 P1 = vec4(max(0.5, hF * rise * (1.0 - 0.92 * fall)), (6.2 + 3.2 * smoothstep(0.0, 0.4, ph)) * (0.8 + 0.4 * hh(seed * 5.1 + 2.0)) * (1.0 + 0.3 * bomb),
      3.0 + 19.0 * (1.0 - pow(1.0 - clamp(ph / 0.85, 0.0, 1.0), 1.7)), 4.0 + 8.0 * smoothstep(0.0, 0.5, ph));
    vec4 P2 = vec4(32.0 * (1.0 - pow(1.0 - clamp(ph * 2.2, 0.0, 1.0), 2.0)), 2.0 + 18.0 * pow(clamp(ph / 0.24, 0.0, 1.0), 0.55), 0.0, 0.0);
    vec4 P3 = vec4(1.0 - smoothstep(0.5, 1.0, ph), 1.0 - smoothstep(0.4, 1.0, ph), (1.0 - smoothstep(0.08, 0.28, ph)) * (0.25 + 0.75 * bomb), 0.0);
    // the falling fragments: the pattern of the fountain's streaks slides down
    float slide = ph * 7.0;
    vec3 sunS = vec3(uSunDir.x, uSunDir.y, uSunDir.z) * 5.0;           // one tap towards the light, in units
    for (int k = 0; k < N; k++) {
      vec3 p = ro + rd * (tn + (float(k) + j) * dtm * S);
      vec3 l = (p - vA.xyz) / S;
      if (l.y < 0.0) continue;
      float ang = atan(l.z, l.x);
      vec3 nz = vec3(vn(l * vec3(0.12, 0.16, 0.12) + vec3(seed * 17.0, -ph * 1.2, seed * 5.0)) * 0.65 + vn(l * 0.4 + seed * 5.0) * 0.35,
                     vn(vec3(l.x * 0.9, l.y * 0.07 + slide, l.z * 0.9) + seed * 11.0),
                     vn(vec3(ang * 2.2 + seed * 9.0, l.y * 0.11 - ph * 0.6, 1.7)));
      vec4 d = burstDens(l, ph, P1, P2, P3, uWind, nz, ang);
      float tot = d.x + d.y + d.z + d.w;
      float hotr = flash * (1.0 - smoothstep(0.0, 0.42, length(vec3(l.x, l.y * 1.6, l.z)) / 10.5));
      if (tot < 0.004 && hotr < 0.004) continue;
      // (the self-shadow: the same shape, without the noise, one tap towards the sun or the moon)
      vec4 ds = burstDens(l + sunS, ph, P1, P2, P3, uWind, vec3(0.5), ang);
      float shF = exp(-0.55 * ds.x * 5.0), shD = exp(-(0.16 * ds.y + 0.14 * ds.z) * 5.0);
      // albedos: fresh earth is dark; the explosive's soot darkens the first moments; the roll is tan dust, the column paler and greyer as it ages; stone dust on masonry
      vec3 aF = mix(vec3(0.075, 0.058, 0.042), vec3(0.20, 0.155, 0.11), smoothstep(0.15, 0.6, ph) * (0.4 + 0.6 * nz.x));
      vec3 aR = mix(vec3(0.27, 0.22, 0.165), vec3(0.45, 0.42, 0.38), smoothstep(0.2, 0.95, ph));
      vec3 aC = mix(vec3(0.20, 0.175, 0.15), vec3(0.42, 0.40, 0.37), smoothstep(0.1, 0.8, ph));
      vec3 aS = vec3(0.56, 0.50, 0.42);
      vec3 stone = vec3(0.56, 0.54, 0.51);
      aF = mix(aF, stone * 0.55, masonry * 0.85); aR = mix(aR, stone, masonry * 0.85); aC = mix(aC, stone * 0.9, masonry * 0.85);
      float inner = 7.0 * (1.0 - smoothstep(0.0, 1.3, length(vec3(l.x, l.y * 0.9, l.z)) / 14.0));
      vec3 sunPart = uSunE * 0.22;
      vec3 flashL = vec3(1.0, 0.62, 0.3) * flash * inner;
      vec3 skyPart = uSkyL * 0.55;
      vec3 lF = aF * (sunPart * (0.35 + 0.65 * shF) + skyPart + flashL);
      vec3 lR = aR * (sunPart * (0.55 + 0.45 * shD) * (0.75 + 0.25 * clamp(l.y / 6.0, 0.0, 1.0)) + skyPart + flashL);
      vec3 lC = aC * (sunPart * (0.55 + 0.45 * shD) + skyPart + flashL);
      vec3 lS = aS * (sunPart + skyPart + flashL);
      // (the parts over one another in the order of their density: composited as one medium with each one's share of the extinction)
      float ext = 0.8 * d.x + 0.15 * d.y + 0.085 * d.z + 0.28 * d.w;
      float aT = 1.0 - exp(-ext * dtm);
      vec3 lm = ext > 1e-4 ? (lF * 0.8 * d.x + lR * 0.15 * d.y + lC * 0.085 * d.z + lS * 0.28 * d.w) / ext : vec3(0.0);
      col3 += T * (aT * lm + hotr * vec3(1.0, 0.72, 0.38) * 4.0 * dtm);
      T *= 1.0 - aT;
    }
    col = col3;
  } else {
    // the floor of a gutted shell: char with a network of glowing cracks and heaps of embers, slowly breathing. The
    // ray meets the floor plane inside the box (a surface, not a volume: crisp, and cheap)
    float yf = vA.y + 0.35;
    if (rd.y < -1e-3) {
      float tp = (yf - ro.y) / rd.y;
      if (tp > tn - 1.0 && tp < tf + 1.0) {
        vec3 p = ro + rd * tp;
        vec2 dd = p.xz - vA.xz, ql = vec2(dot(dd, ux), dot(dd, uz));
        vec2 q = ql / rm;
        float edge = 1.0 - smoothstep(0.55, 1.0, max(abs(ql.x) / r, abs(ql.y) / hw));
        float n1 = vn(vec3(q * 5.0 + seed * 11.0, 0.0)), n2 = vn(vec3(q * 11.0 + 3.7, seed * 3.0));
        // cracks glow where the noise crosses its middle; heaps glow where it is high
        float crack = 1.0 - smoothstep(0.0, 0.11, abs(n1 - 0.5));
        float heap = smoothstep(0.62, 0.9, n2);
        float breathe = 0.65 + 0.35 * vn(vec3(q * 3.0 + 7.0, t * 0.35 + seed));
        float g = clamp(max(crack * 0.8, heap) * breathe, 0.0, 1.0) * edge * strength;
        col = fireColour(0.12 + 0.5 * g) * g * 0.9;
        T = 1.0 - clamp(g * 0.9, 0.0, 1.0);
      }
    }
  }
  col *= uGain;
  float alpha = 1.0 - T;
  if (alpha < 1e-3) discard;
  // (capped: the frame's lens-flare pass draws streaks across anything brighter than a few units, which showed as scan lines in a flame)
  fragColor = vec4(min(col, vec3(6.0)), alpha);
}`,uniforms:{uTime:{value:0},uGain:{value:1},uSunE:{value:new t.Vector3},uSkyL:{value:new t.Vector3},uSunDir:{value:new t.Vector3(0,1,0)},uDust:{value:new t.Vector3(.14,.125,.11)},uWind:{value:new t.Vector2(.1,0)}},transparent:!0,depthWrite:!1,depthTest:!0,blending:t.CustomBlending,blendEquation:t.AddEquation,blendSrc:t.OneFactor,blendDst:t.OneMinusSrcAlphaFactor,blendSrcAlpha:t.ZeroFactor,blendDstAlpha:t.OneFactor,side:t.FrontSide,fog:!1,toneMapped:!1}),this.mesh=new t.Mesh(r,this.material),this.mesh.frustumCulled=!1,this.mesh.castShadow=this.mesh.receiveShadow=!1,this.mesh.renderOrder=6,this.mesh.name=`fire-flames`;let i=this.sparkGeometry=new t.InstancedBufferGeometry;i.setAttribute(`position`,new t.BufferAttribute(new Float32Array(30),3)),i.setAttribute(`aK`,new t.BufferAttribute(Float32Array.from({length:10},(e,t)=>t),1));for(let[e,t]of[[`iA`,this.attrs[0]],[`iB`,this.attrs[1]],[`iC`,this.attrs[2]],[`iD`,this.attrs[3]]])i.setAttribute(e,t);i.instanceCount=0,this.sparkMaterial=new t.ShaderMaterial({glslVersion:t.GLSL3,vertexShader:`
in float aK;
in vec4 iA; in vec4 iB; in vec4 iC; in vec4 iD;
uniform float uTime;
uniform vec2 uWindV;      // the wind (m/s, x and z)
uniform float uPx;        // pixels per radian of view (screen height / (2 tan(fov/2)))
uniform float uNear;      // beyond this distance (m) no sparks are drawn
out float vFade; out float vHeat;
float hh(float n) { return fract(sin(n) * 43758.5453123); }
void main() {
  float mode = iB.w, str = iB.y, seed = iB.z;
  vFade = 0.0; vHeat = 0.0;
  gl_PointSize = 0.0;
  gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
  if (mode > 0.5 || str < 0.25) return;
  float k = aK;
  if (hh(k * 11.3 + seed * 71.0) > 0.5) return; // (about five of ten sparks per body, and one in five of those a flying brand (below): sparse, not a curtain)
  // (wave 6f: a flying brand: a burning shingle or a scrap of thatch lifted by the fire's draught, it rises two or three times as high and lasts twice as long)
  float brand = step(0.8, hh(k * 9.1 + seed * 5.7));
  float life = (1.4 + 1.6 * hh(k * 7.1 + seed * 13.0)) * (1.0 + 0.9 * brand);  // seconds of screen time
  float ph = fract(uTime / life + hh(k * 3.7 + seed * 29.0));
  float tt = ph * life;
  float rr = iD.z > 0.0 ? min(iA.w, iD.z) : iA.w;
  vec2 o = (vec2(hh(k * 1.3 + seed * 5.0), hh(k * 2.9 + seed * 9.0)) - 0.5) * 1.6 * rr;
  vec2 fan = (vec2(hh(k * 4.1 + seed * 7.0), hh(k * 6.7 + seed * 2.0)) - 0.5) * 6.0;
  float y0 = max(iC.x, iA.y + 2.0);
  float up = (7.0 + 10.0 * hh(k * 5.3 + seed * 3.0)) * (0.5 + 0.6 * str) * (1.0 + 1.5 * brand);
  // rises fast, slows (drag), and is carried by the wind; a little flutter
  float yy = y0 + up * life * (1.0 - exp(-tt / (0.6 * life))) * 0.55;
  vec2 drift = (uWindV * (0.8 + 0.5 * brand) + fan * (1.0 - 0.5 * brand)) * tt + vec2(sin(tt * 5.0 + k * 3.0), cos(tt * 4.3 + k * 1.7)) * 0.5 * (0.3 + ph);
  vec3 w = vec3(iA.x + o.x + drift.x, yy, iA.z + o.y + drift.y);
  vec4 mv = viewMatrix * vec4(w, 1.0);
  float dist = max(1.0, -mv.z);
  if (dist > uNear) return;
  vFade = (1.0 - ph) * smoothstep(0.0, 0.06, ph) * str * (1.0 - smoothstep(0.6 * uNear, uNear, dist)) * (0.75 + 0.25 * sin(tt * 37.0 + k * 5.0));
  vHeat = 1.0 - ph * 0.8;
  gl_PointSize = clamp(uPx * 0.07 * (1.0 - 0.7 * ph) / dist, 1.5, 6.0);
  gl_Position = projectionMatrix * mv;
}`,fragmentShader:`
precision highp float;
in float vFade; in float vHeat;
out vec4 fragColor;
void main() {
  vec2 c = gl_PointCoord * 2.0 - 1.0;
  float d = dot(c, c);
  if (d > 1.0 || vFade <= 0.002) discard;
  float core = 1.0 - d;
  vec3 hot = mix(vec3(1.0, 0.25, 0.04), vec3(1.0, 0.8, 0.4), vHeat);
  fragColor = vec4(hot * (1.5 + 9.0 * vHeat) * core * core * vFade, 0.0);
}`,uniforms:{uTime:this.material.uniforms.uTime,uWindV:{value:new t.Vector2},uPx:{value:900},uNear:{value:1100}},transparent:!0,depthWrite:!1,depthTest:!0,blending:t.AdditiveBlending,fog:!1,toneMapped:!1}),this.sparks=new t.Points(i,this.sparkMaterial),this.sparks.frustumCulled=!1,this.sparks.renderOrder=7,this.sparks.name=`fire-sparks`;let a=this.glowGeometry=new t.InstancedBufferGeometry;a.setAttribute(`position`,new t.BufferAttribute(new Float32Array(3),3));for(let[e,t]of[[`iA`,this.attrs[0]],[`iB`,this.attrs[1]],[`iC`,this.attrs[2]],[`iD`,this.attrs[3]]])a.setAttribute(e,t);a.instanceCount=0,this.glowMaterial=new t.ShaderMaterial({glslVersion:t.GLSL3,vertexShader:`
in vec4 iA; in vec4 iB; in vec4 iC; in vec4 iD;
uniform float uPx;
uniform float uDay; // (wave 6h) 1 in full daylight: the glow of a fire is lost in the sun's light, and what is left is the flame body
out float vI;
void main() {
  float mode = iB.w;
  vI = 0.0; gl_PointSize = 0.0; gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
  if (mode > 0.5 || iB.y < 0.05) return;
  vec3 w = vec3(iA.x, iA.y + 0.3 * iB.x, iA.z);
  vec4 mv = viewMatrix * vec4(w, 1.0);
  float dist = max(1.0, -mv.z);
  float k = smoothstep(450.0, 1500.0, dist) * (1.0 - 0.9 * uDay); // (wave 6h: was 250..900 m and the same by day: orange discs with no source at 300-600 m)
  if (k <= 0.0) return;
  float sz = uPx * (5.5 * iA.w + 0.8 * iB.x) / dist;
  gl_PointSize = clamp(sz, 3.0, 64.0);
  // (a point smaller than its floor of pixels carries only the light of the fire it stands for)
  vI = k * iB.y * min(1.0, (sz * sz) / 12.0 + 0.3);
  gl_Position = projectionMatrix * mv;
}`,fragmentShader:`
precision highp float;
in float vI;
out vec4 fragColor;
void main() {
  vec2 c = gl_PointCoord * 2.0 - 1.0;
  float d = dot(c, c);
  if (d > 1.0 || vI <= 0.002) discard;
  float g = exp(-3.0 * d) * (1.0 - d);
  fragColor = vec4(vec3(1.0, 0.36, 0.07) * 4.0 * g * vI, 0.0);
}`,uniforms:{uPx:this.sparkMaterial.uniforms.uPx,uDay:{value:0}},transparent:!0,depthWrite:!1,depthTest:!0,blending:t.AdditiveBlending,fog:!1,toneMapped:!1}),this.glow=new t.Points(a,this.glowMaterial),this.glow.frustumCulled=!1,this.glow.renderOrder=7,this.glow.name=`fire-glow-far`,this.n=0}begin(){this.n=0}add(e,t,n,r,i,a,o,s,c,l=0,u=0,d=0,f=0,p=0){if(this.n>=12e3)return;let m=this.n++*4;this.a[m]=e,this.a[m+1]=t,this.a[m+2]=n,this.a[m+3]=r,this.b[m]=i,this.b[m+1]=a,this.b[m+2]=o,this.b[m+3]=s,this.c[m]=c,this.c[m+1]=l,this.c[m+2]=p,this.d[m]=u,this.d[m+1]=d,this.d[m+2]=f}end(){let e=this.geometry;e.instanceCount=this.sparkGeometry.instanceCount=this.glowGeometry.instanceCount=this.n;for(let e of this.attrs)e.clearUpdateRanges(),e.addUpdateRange(0,Math.max(4,this.n*4)),e.needsUpdate=!0}dispose(){this.geometry.dispose(),this.sparkGeometry.dispose(),this.glowGeometry.dispose(),this.material.dispose(),this.sparkMaterial.dispose(),this.glowMaterial.dispose()}};export{t as Flames,e as MAX_FLAMES};