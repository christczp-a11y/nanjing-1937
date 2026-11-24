var e=2400,t=class{constructor(t,n){this.THREE=t;let r=new t.BufferGeometry;r.setAttribute(`position`,new t.BufferAttribute(new Float32Array([-1,0,0,1,0,0,1,1,0,-1,1,0]),3)),r.setIndex([0,1,2,0,2,3]);let i=this.geometry=new t.InstancedBufferGeometry;i.index=r.index,i.setAttribute(`position`,r.getAttribute(`position`)),this.a=new Float32Array(e*4),this.b=new Float32Array(e*4),this.c=new Float32Array(e*4),this.attrs=[];for(let[e,n]of[[`iA`,this.a],[`iB`,this.b],[`iC`,this.c]]){let r=new t.InstancedBufferAttribute(n,4);r.setUsage(t.DynamicDrawUsage),i.setAttribute(e,r),this.attrs.push(r)}i.instanceCount=0,this.material=new t.ShaderMaterial({glslVersion:t.GLSL3,vertexShader:`
in vec4 iA;   // x, y (the ground), z (already drifted with the wind), size (m)
in vec4 iB;   // u (age / life), seed, kind, strength
in vec4 iC;   // the fires' light at it (a grey value), flash (0..1), ground class (fix round 2: 0 soil, 1 burnt ground), 0
uniform float uPx;      // pixels per radian
uniform float uMinPx;
out vec2 vS; out float vU; out float vSeed; out float vKind; out float vStr; out float vLight; out float vFlash; out float vAlphaK; out vec3 vRight; out float vCls;
// per kind: height (m per unit size), foot width, crown width growth, the share of the life it takes to get up
vec4 P(float k) {
  if (k < 0.5) return vec4(1.7, 0.30, 0.9, 0.12);       // earth
  if (k < 1.5) return vec4(1.1, 0.55, 1.5, 0.22);       // ruin
  if (k < 2.5) return vec4(0.7, 0.30, 0.7, 0.18);       // chip
  if (k < 3.5) return vec4(2.6, 0.22, 0.8, 0.14);       // water
  if (k < 4.5) return vec4(0.9, 0.45, 1.3, 0.35);       // powder
  return vec4(2.8, 0.55, 1.6, 0.10);                     // blast
}
void main() {
  float u = iB.x, kind = iB.z;
  vec4 p = P(kind);
  float rise = 1.0 - pow(1.0 - clamp(u / p.w, 0.0, 1.0), 2.0);
  float sink = 1.0 - (kind < 3.5 ? 0.45 : 0.25) * smoothstep(0.35, 1.0, u);
  float h = iA.w * p.x * rise * sink * (kind > 3.5 && kind < 4.5 ? (0.7 + 0.5 * smoothstep(0.0, 1.0, u)) : 1.0);
  float w = iA.w * (p.y + p.z * pow(u, 0.6));
  vec3 base = iA.xyz;
  vec3 toCam = cameraPosition - base;
  float d = max(length(toCam), 0.5);
  float mpp = d / uPx;                    // metres per pixel here
  float w2 = max(w, uMinPx * mpp), h2 = max(h, uMinPx * 1.6 * mpp);
  vAlphaK = clamp(sqrt((w * max(h, 1e-3)) / (w2 * h2)) * 2.6, 0.3, 1.0);
  vec3 r = cross(vec3(0.0, 1.0, 0.0), toCam);
  float rl = length(r);
  r = rl > 1e-3 ? r / rl : vec3(1.0, 0.0, 0.0);
  vec3 world = base + r * (position.x * w2) + vec3(0.0, 1.0, 0.0) * (position.y * h2);
  vS = position.xy; vU = u; vSeed = iB.y; vKind = kind; vStr = iB.w; vLight = iC.x; vFlash = iC.y; vRight = r; vCls = iC.z;
  gl_Position = projectionMatrix * viewMatrix * vec4(world, 1.0);
}`,fragmentShader:`
precision highp float;
uniform vec3 uSunE;
uniform vec3 uSkyL;
uniform vec3 uSunDir;
in vec2 vS; in float vU; in float vSeed; in float vKind; in float vStr; in float vLight; in float vFlash; in float vAlphaK; in vec3 vRight; in float vCls;
out vec4 fragColor;
float h13(vec3 p) { uvec3 v = uvec3(ivec3(floor(p + 0.5)) + 32768); v = v * 1664525u + 1013904223u; v.x += v.y * v.z; v.y += v.z * v.x; v.z += v.x * v.y; v ^= v >> 16u; v.x += v.y * v.z; v.y += v.z * v.x; v.z += v.x * v.y; return float(v.x) * (1.0 / 4294967295.0); }
float vn(vec3 p) {
  vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(h13(i), h13(i + vec3(1, 0, 0)), f.x), mix(h13(i + vec3(0, 1, 0)), h13(i + vec3(1, 1, 0)), f.x), f.y),
             mix(mix(h13(i + vec3(0, 0, 1)), h13(i + vec3(1, 0, 1)), f.x), mix(h13(i + vec3(0, 1, 1)), h13(i + vec3(1, 1, 1)), f.x), f.y), f.z);
}
float tulip(float v, float foot) {
  float wv = foot + (1.0 - foot) * smoothstep(0.0, 0.6, v);
  float cap = v > 0.6 ? sqrt(max(1.0 - pow((v - 0.6) / 0.4, 2.0), 0.0)) : 1.0;
  return wv * cap;
}
void main() {
  float s = vS.x, v = clamp(vS.y, 0.0, 1.0), u = vU, k = vKind, sd = vSeed * 41.0;
  bool puffK = k > 3.5 && k < 4.5;
  // the profile: narrow at the foot, flaring to a rounded, ragged crown (a powder puff: a lump); u makes it spread
  float wid = puffK ? 0.3 + 0.7 * sin(3.14159 * v) : tulip(v, k < 3.5 && k > 2.5 ? 0.45 : 0.28);
  float across = abs(s) / max(wid, 0.04);
  float prof = (1.0 - smoothstep(0.15, 1.0, across)) * step(0.0, wid - 0.02);
  if (prof <= 0.0) discard;
  // the noise rises with the spurt and tears at its edge (it eats the thin parts first)
  float n1 = vn(vec3(s * 2.6 + sd, v * 3.2 - u * 2.4, sd * 0.37 + u * 1.7)), n2 = vn(vec3(s * 6.3 - sd, v * 7.3 - u * 3.0, sd * 0.9));
  float n = n1 * 0.62 + n2 * 0.38;
  float d = clamp(prof * (0.35 + 1.0 * n) - 0.42, 0.0, 1.0);
  if (d <= 0.01) discard;
  // albedo by kind and by age: earth is dark and then brown-grey; ruin dust buff; chips pale; water white; powder smoke light grey; a blast dark then dust
  float ag = smoothstep(0.1, 0.8, u);
  vec3 alb;
  // (fix round 2: on burnt ground, ash and char instead of soil or brick dust: vCls 1)
  if (k < 0.5) alb = mix(mix(vec3(0.045, 0.038, 0.032), vec3(0.04, 0.038, 0.035), vCls), mix(vec3(0.26, 0.23, 0.19), vec3(0.11, 0.105, 0.098), vCls), ag);
  else if (k < 1.5) alb = mix(mix(vec3(0.26, 0.22, 0.17), vec3(0.14, 0.13, 0.12), vCls), mix(vec3(0.42, 0.38, 0.32), vec3(0.17, 0.16, 0.15), vCls), ag);
  else if (k < 2.5) alb = mix(vec3(0.56, 0.52, 0.45), vec3(0.44, 0.41, 0.36), ag);
  else if (k < 3.5) alb = mix(vec3(0.80, 0.83, 0.85), vec3(0.62, 0.65, 0.67), ag);
  else if (k < 4.5) alb = vec3(0.40, 0.39, 0.37);
  else alb = mix(vec3(0.05, 0.042, 0.035), vec3(0.30, 0.27, 0.23), smoothstep(0.1, 0.7, u));
  // light: the sun and the sky of the scene, a little side-lighting across the billboard (the lit side the sun is on), the lumps lit and shaded by their own noise, the foot darker,
  // the fires' and flashes' light
  float side = 0.5 + 0.5 * clamp(uSunDir.y * 0.5 + s * dot(uSunDir, vRight) * 0.9 + 0.1, -1.0, 1.0);
  float lump = mix(0.55, 1.15, n1) * mix(0.75, 1.0, smoothstep(0.0, 0.5, v));
  vec3 sunPart = uSunE * 0.22 * side * lump, skyPart = uSkyL * 0.55 * mix(0.8, 1.0, lump) + vec3(1.0, 0.47, 0.15) / 0.54 * (vLight * 0.25);
  vec3 col = alb * (sunPart + skyPart) + vec3(1.0, 0.62, 0.3) * vFlash * 2.5 * (puffK ? 1.0 : 0.0);
  float life = 1.0 - smoothstep(0.45, 1.0, u);
  float a = (1.0 - exp(-3.0 * d)) * vStr * life * vAlphaK * (k < 0.5 ? 1.15 : 1.0);
  if (a < 0.004) discard;
  fragColor = vec4(min(col, vec3(6.0)) * a, a);
}`,uniforms:{uPx:{value:900},uMinPx:{value:1.6},uSunE:n.uSunE,uSkyL:n.uSkyL,uSunDir:n.uSunDir},transparent:!0,depthWrite:!1,depthTest:!0,blending:t.CustomBlending,blendEquation:t.AddEquation,blendSrc:t.OneFactor,blendDst:t.OneMinusSrcAlphaFactor,blendSrcAlpha:t.ZeroFactor,blendDstAlpha:t.OneFactor,side:t.DoubleSide,fog:!1,toneMapped:!1}),this.mesh=new t.Mesh(i,this.material),this.mesh.frustumCulled=!1,this.mesh.renderOrder=6,this.mesh.name=`fire-spurts`,this.n=0}begin(){this.n=0}add(e,t,n,r,i,a,o,s,c=0,l=0,u=0){if(this.n>=2400)return!1;let d=this.n++*4;return this.a[d]=e,this.a[d+1]=t,this.a[d+2]=n,this.a[d+3]=r,this.b[d]=a,this.b[d+1]=o,this.b[d+2]=i,this.b[d+3]=s,this.c[d]=c,this.c[d+1]=l,this.c[d+2]=u,this.c[d+3]=0,!0}end(e){this.geometry.instanceCount=this.n,this.material.uniforms.uPx.value=e;for(let e of this.attrs)e.clearUpdateRanges(),e.addUpdateRange(0,Math.max(4,this.n*4)),e.needsUpdate=!0}dispose(){this.geometry.dispose(),this.material.dispose()}},n={rifle:.55,lmg:.75,hmg:1,gd:1.8,vehicle:.9};function r(e,t,r){let i=e.imp;i||=e.impact===`wall`||t&&t.d<14?`wall`:`earth`;let a=n[e.w]??.6;if(e.w===`gd`)return{imp:i,kind:i===`water`?3:5,size:a*(i===`water`?1.1:1),str:.9,life:3.6,y:0};switch(i){case`water`:return{imp:i,kind:3,size:a*.9,str:.8,life:1.2,y:0};case`ruin`:return{imp:i,kind:1,size:a,str:.8,life:2.4,y:.4};case`masonry`:return{imp:i,kind:2,size:a*.9,str:.85,life:1.5,y:.8};case`wall`:return{imp:i,kind:2,size:a,str:.85,life:1.6,y:0};default:return{imp:i,kind:0,size:a,str:.85,life:1.5,y:0}}}export{e as MAX_SPURTS,t as Spurts,n as WEAPON_SIZE,r as strikeOf};