var e=48,t=class{constructor(e){this.THREE=e;let t=new e.BoxGeometry(2,1,2).translate(0,.5,0),n=this.geometry=new e.InstancedBufferGeometry;n.index=t.index,n.setAttribute(`position`,t.getAttribute(`position`)),this.a=new Float32Array(192),this.b=new Float32Array(192),this.c=new Float32Array(192),this.attrs=[];for(let[t,r]of[[`sA`,this.a],[`sB`,this.b],[`sC`,this.c]]){let i=new e.InstancedBufferAttribute(r,4);i.setUsage(e.DynamicDrawUsage),n.setAttribute(t,i),this.attrs.push(i)}n.instanceCount=0,this.material=new e.ShaderMaterial({glslVersion:e.GLSL3,vertexShader:`
in vec4 sA; // centre x, base y, centre z, radius of the box (m)
in vec4 sB; // height (m), strength, seed, radius at the base (m)
in vec4 sC; // lean at the top (m) x, z; fire light below (0..1); 1 for a far column (fades in from 400 to 1500 m)
out vec3 vWorld; out vec4 vA; out vec4 vB; out vec4 vC;
void main() {
  vec3 w = vec3(sA.x + position.x * sA.w, sA.y + position.y * sB.x, sA.z + position.z * sA.w);
  vWorld = w; vA = sA; vB = sB; vC = sC;
  gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.0);
}`,fragmentShader:`
precision highp float;
uniform float uTime;
uniform vec3 uSunE, uSkyL, uSunDir, uFireCol;
uniform vec4 uFade;   // fade out from x to y metres from the camera
in vec3 vWorld; in vec4 vA; in vec4 vB; in vec4 vC;
out vec4 fragColor;
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
float H, R0, RT, seed;
vec3 base; vec2 leanTop;
// density of the column at a world point: 0 outside, ~1 in the dense black foot
float dens(vec3 p, float t) {
  float q = (p.y - base.y) / H;
  if (q < 0.0 || q > 1.0) return 0.0;
  // (fix round 2: the axis is bent as well as leaned: a smoke column in a real wind meanders, its crown carried off the line of its foot by eddies of a few hundred metres' scale; a slow
  // meander in screen time, growing with the height squared, a tenth to a fifth of the local width on the first third and up to half a width at the crown)
  vec2 mea = vec2(sin(q * 4.1 + seed * 20.0 - uTime * 0.11), cos(q * 3.3 + seed * 11.0 - uTime * 0.09)) * (R0 + (RT - R0) * pow(q, 0.62)) * 0.5 * q * q;
  vec2 c = base.xz + leanTop * pow(q, 1.35) + mea;
  float w = R0 + (RT - R0) * pow(q, 0.62);
  vec2 u = (p.xz - c) / w;
  // billows that rise and turn over: the noise is carried up with the smoke and sheared round a horizontal axis
  vec3 pw = vec3(u * 1.5 + 0.7 * vec2(sin(q * 6.0 - t * 0.9 + seed * 20.0), cos(q * 5.0 - t * 0.7)), q * min(H * 0.05, 7.5) - t * 0.55 + seed * 9.0);
  float n = vn(pw) * 0.5 + vn(pw * 2.1 + 3.3) * 0.3 + vn(pw * 4.3 + 7.7) * 0.2;
  float body = 1.0 - smoothstep(0.3, 1.0, length(u) * (1.0 + 0.9 * (0.5 - n)));
  // thinning as it widens (the smoke let go is the same, the volume grows with the square of the width)
  float thin = (R0 / w) * (R0 / w);
  return body * (0.25 + 0.75 * n) * thin * smoothstep(0.0, 0.05, q) * (1.0 - smoothstep(0.78, 1.0, q)) * 1.6;
}
void main() {
  vec3 ro = cameraPosition, rd = normalize(vWorld - ro);
  float r = vA.w;
  H = vB.x; R0 = vB.w; seed = vB.z; leanTop = vC.xy;
  float strength = vB.y;
  RT = 0.3 * H;
  base = vec3(vA.x - leanTop.x * 0.5, vA.y, vA.z - leanTop.y * 0.5);
  float cd = length(vA.xyz - ro);
  float fade = vC.w > 0.5 ? smoothstep(400.0, 1500.0, cd) : 1.0 - smoothstep(uFade.x, uFade.y, cd);
  if (fade <= 0.0) discard;
  vec3 bmin = vec3(vA.x - r, vA.y, vA.z - r), bmax = vec3(vA.x + r, vA.y + H, vA.z + r);
  vec3 inv = 1.0 / rd, t0 = (bmin - ro) * inv, t1 = (bmax - ro) * inv, tn3 = min(t0, t1), tf3 = max(t0, t1);
  float tn = max(max(max(tn3.x, tn3.y), tn3.z), 0.0), tf = min(min(tf3.x, tf3.y), tf3.z);
  if (tf <= tn) discard;
  float t = uTime;
  const int N = 28;
  int n = int(clamp((tf - tn) / 12.0, 14.0, float(N)));
  float ds = (tf - tn) / float(n), jit = pixelNoise(gl_FragCoord.xy, seed);
  vec3 L = vec3(0.0); float T = 1.0;
  float ext = 0.16 * strength * fade;
  for (int k = 0; k < N; k++) {
    if (k >= n) break;
    vec3 p = ro + rd * (tn + (float(k) + jit) * ds);
    float d = dens(p, t);
    if (d <= 0.001) continue;
    float q = (p.y - base.y) / H;
    // sun side: one tap towards the light (self shadow), then the sky from above, and the fire from below
    float dl = dens(p + uSunDir * (0.22 * RT + 3.0), t);
    float lit = exp(-3.0 * dl);
    vec3 alb = mix(vec3(0.05, 0.043, 0.038), vec3(0.2, 0.185, 0.17), smoothstep(0.0, 0.8, q));
    // (wave 6f: the smoke is not one colour. Patches of sootier and paler smoke (what burns differs: timber, thatch, oil, goods; and the older smoke has taken in air), carried up with the column,
    // and the pale patches warmer in the lower half (brown, not grey): the albedo varies by a factor of 0.6 to 1.4 over ~20 m)
    float pn = vn(p * 0.05 + vec3(seed * 13.0, -t * 0.14, seed * 7.0));
    alb *= (0.6 + 0.8 * pn) * mix(vec3(1.12, 1.0, 0.86), vec3(1.0), smoothstep(0.2, 0.7, q));
    vec3 J = uSunE * (0.35 * lit) + uSkyL * (0.55 + 0.25 * q);
    // the fire below lights the foot of the column from underneath (orange, falling off with height and into the smoke)
    // (wave 6b: a far column's underlight falls off faster with height and is weaker: the 12-12 night's columns over Pukou and Xiaguan, seen from 1-3 km, were lit orange
    // right up their length, wedge-shaped spotlights against the sky; the fire's light on the underside of a column is strong at its foot and gone within its first third)
    float farK = vC.w > 0.5 ? 0.5 : 1.0;
    vec3 glow = uFireCol * vC.z * exp(-q * H / ((vC.w > 0.5 ? 0.09 : 0.22) * H + 5.0)) * (0.5 + 0.5 * lit) * 1.8 * farK;
    float a = 1.0 - exp(-ext * d * ds);
    L += T * a * (alb * J + glow * 0.25 * (0.4 + 0.6 * (1.0 - q)));
    T *= 1.0 - a;
    if (T < 0.02) break;
  }
  float alpha = 1.0 - T;
  if (alpha < 1e-3) discard;
  fragColor = vec4(L, alpha);
}`,uniforms:{uTime:{value:0},uSunE:{value:new e.Vector3},uSkyL:{value:new e.Vector3},uSunDir:{value:new e.Vector3(0,1,0)},uFireCol:{value:new e.Vector3(1,.42,.13)},uFade:{value:new e.Vector4(500,1100,0,0)}},transparent:!0,depthWrite:!1,depthTest:!0,blending:e.CustomBlending,blendEquation:e.AddEquation,blendSrc:e.OneFactor,blendDst:e.OneMinusSrcAlphaFactor,blendSrcAlpha:e.ZeroFactor,blendDstAlpha:e.OneFactor,side:e.FrontSide,fog:!1,toneMapped:!1}),this.mesh=new e.Mesh(n,this.material),this.mesh.frustumCulled=!1,this.mesh.castShadow=this.mesh.receiveShadow=!1,this.mesh.renderOrder=5,this.mesh.name=`fire-nearsmoke`,this.n=0}begin(){this.n=0}add(e,t,n,r,i,a,o,s,c,l,u=0){if(this.n>=48)return;let d=this.n++*4,f=.3*r+.5*Math.hypot(s,c)+4;this.a[d]=e+s*.5,this.a[d+1]=t,this.a[d+2]=n+c*.5,this.a[d+3]=f,this.b[d]=r,this.b[d+1]=i,this.b[d+2]=a,this.b[d+3]=o,this.c[d]=s,this.c[d+1]=c,this.c[d+2]=l,this.c[d+3]=u}end(){this.geometry.instanceCount=this.n;for(let e of this.attrs)e.clearUpdateRanges(),e.addUpdateRange(0,Math.max(4,this.n*4)),e.needsUpdate=!0}dispose(){this.geometry.dispose(),this.material.dispose()}};export{e as MAX_COLUMNS,t as NearSmoke};