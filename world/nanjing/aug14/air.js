import{BoxGeometry as e,InstancedBufferAttribute as t,InstancedBufferGeometry as n,Mesh as r,ShaderMaterial as i,Uniform as a,Vector2 as o,Vector3 as s,Vector4 as c}from"../../../node_modules/three/build/three.core.js";var l=`
uniform float uBand;      // extinction per metre at the layer's thick middle where the noise is 1
uniform vec2 uBandH;      // bottom, top (m over the ground)
uniform float uBandBase;  // the share of uBand everywhere (the thin veil)
uniform vec4 uBandPatch;  // x, z, radius (m), extra multiple of uBand at its centre
uniform vec3 uBandAmb;    // the sky's mean radiance (scene units)
uniform float uBandMs;    // a share of the sun's light that the thick layer sends on in all directions (multiple scattering, 推测)
float bh2(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float bvn(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(bh2(i), bh2(i + vec2(1, 0)), f.x), mix(bh2(i + vec2(0, 1)), bh2(i + vec2(1, 1)), f.x), f.y); }
float bandSigma(vec3 q) {
  float hq = q.y - uGround;
  float prof = smoothstep(uBandH.x, uBandH.x + 30.0, hq) * (1.0 - smoothstep(uBandH.y - 45.0, uBandH.y, hq));
  if (prof <= 0.0) return 0.0;
  float n = 0.65 * bvn(q.xz / 420.0 + 3.1) + 0.35 * bvn(q.xz / 130.0 + 7.7);
  float patchy = smoothstep(0.42, 0.78, n);
  vec2 d = (q.xz - uBandPatch.xy) / max(uBandPatch.z, 1.0);
  float local = uBandPatch.w * exp(-dot(d, d));
  return uBand * prof * (uBandBase + (1.0 - uBandBase) * patchy + local);
}
`,u=`
  if (uBand > 0.0) {
    float bDist = sky ? 60000.0 : length(view);
    float y0 = ro.y - uGround, tA = 0.0, tB = -1.0;
    if (abs(dir.y) < 1e-4) { if (y0 > uBandH.x && y0 < uBandH.y) { tA = 0.0; tB = min(bDist, 20000.0); } }
    else { float ta = (uBandH.x - y0) / dir.y, tb = (uBandH.y - y0) / dir.y; tA = max(min(ta, tb), 0.0); tB = min(max(ta, tb), bDist); }
    if (tB > tA) {
      const int NB = 16;
      float ds = (tB - tA) / float(NB), tauB = 0.0, jb = ign(gl_FragCoord.xy + 17.0);
      vec3 inB = vec3(0.0);
      float cosB = dot(dir, uLightDir), phB = mix(hg(cosB, 0.6), 0.25 / AIR_PI, 0.45);
      float syB = max(uLightDir.y, 0.05);
      for (int i = 0; i < NB; i++) {
        float t = tA + (float(i) + jb) * ds;
        vec3 q = ro + dir * t;
        float sg = bandSigma(q), dT = sg * ds;
        if (dT <= 0.0) continue;
        float Tv = exp(-(tauB + 0.5 * dT));
        float vis = 1.0;
        if (uShadowOn > 0.5) {
          vec4 sc = uShadowMat * vec4(q, 1.0); vec3 s3 = sc.xyz / sc.w;
          float edge = min(min(s3.x, 1.0 - s3.x), min(s3.y, 1.0 - s3.y));
          float fd = (s3.z < 1.0 && s3.z > 0.0) ? smoothstep(0.0, 0.3, edge) : 0.0;
          if (fd > 0.0) vis = mix(1.0, step(s3.z - uShadowBias, texture(uShadow, s3.xy).r), fd);
        }
        // the sun's light reaching q through the layer: the density sampled at two points on the way to the sun out of the layer
        float upV = max(uBandH.y - (q.y - uGround), 0.0), above = upV / syB;
        float tauS = (bandSigma(q + uLightDir * above * 0.25) + bandSigma(q + uLightDir * above * 0.7)) * 0.5 * above;
        float tsun = exp(-tauS);
        // in a thick layer most of the light is the sun's, scattered many times: a diffuse share that falls off slowly with the depth under the top
        float diffuse = uBandMs * syB * exp(-0.35 * sg * upV) / AIR_PI;
        inB += Tv * dT * (uLightRad * (vis * tsun * phB + diffuse) + uBandAmb);
        tauB += dT;
      }
      float TB = exp(-tauB);
      base = base * TB; add = add * TB + inB;
    }
  }
`;function d(e){let t=e.airEffect;if(t.userData?.aug14)return!0;let n=t.getFragmentShader(),r=`uniform mat3 uStarRot;`,i=`  if (sky && uStars > 0.0) {`;if(!n.includes(r)||!n.includes(i)||!n.includes(`if (uShaft > 0.0 || uGlowN > 0) {`))return console.warn(`aug14: the air shader has changed; no inversion layer`),!1;t.userData={...t.userData??{},aug14:{src:n,wasEnabled:null}};let d={uBand:0,uBandH:new o(80,200),uBandBase:.25,uBandPatch:new c(0,0,180,6),uBandAmb:new s,uBandMs:.6};for(let[e,n]of Object.entries(d))t.uniforms.set(e,new a(n));return t.setFragmentShader(n.replace(r,r+`
`+l).replace(i,u+i)),!0}function f(e){let t=e.airEffect,n=t.userData?.aug14;if(n){t.setFragmentShader(n.src);for(let e of[`uBand`,`uBandH`,`uBandBase`,`uBandPatch`,`uBandAmb`,`uBandMs`])t.uniforms.delete(e);delete t.userData.aug14}}function p(e,t,n,r={}){let i=e.airEffect.uniforms;if(!i.has(`uBand`))return;i.get(`uBand`).value=r.sigma??.003,i.get(`uBandBase`).value=r.base??.15,i.get(`uBandPatch`).value.set(n.x,n.z,r.patchR??110,r.patchK??12),i.get(`uBandH`).value.set(80,200),i.get(`uBandMs`).value=.6;let a=t.skyLight.sh.coefficients[0],o=.282095*t.skyLight.intensity*.75;i.get(`uBandAmb`).value.set(a.x*o,a.y*o,a.z*o),e.airPass.enabled=!0}var m=`
attribute vec4 cA;   // x, base y, z, height to the layer's base
attribute vec4 cB;   // strength, seed, base radius, spread radius under the layer
varying vec3 vW; varying vec4 vA; varying vec4 vB;
void main() {
  float R = cB.w + 4.0;
  vec3 w = vec3(cA.x + position.x * R, cA.y + (position.y + 0.5) * (cA.w + 30.0), cA.z + position.z * R);
  vW = w; vA = cA; vB = cB;
  gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.0);
}`,h=`
precision highp float;
uniform vec3 uSunDir, uSunRad, uSky; uniform float uTime;
varying vec3 vW; varying vec4 vA; varying vec4 vB;
float h3(vec3 p) { p = fract(p * 0.1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y) * p.z); }
float vn(vec3 p) { vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(h3(i), h3(i + vec3(1,0,0)), f.x), mix(h3(i + vec3(0,1,0)), h3(i + vec3(1,1,0)), f.x), f.y), mix(mix(h3(i + vec3(0,0,1)), h3(i + vec3(1,0,1)), f.x), mix(h3(i + vec3(0,1,1)), h3(i + vec3(1,1,1)), f.x), f.y), f.z); }
// density at p: a plume that widens with height (r = r0 + 0.12 h), wavers, and under the layer's base spreads into a thin flat sheet
float dens(vec3 p) {
  float h = p.y - vA.y, H = vA.w;
  if (h < 0.0) return 0.0;
  vec2 c = vA.xz + vec2(sin(h * 0.09 + vB.y * 6.0 + uTime * 0.2) + 0.5 * sin(h * 0.23 + vB.y * 3.0 - uTime * 0.5), cos(h * 0.07 + vB.y * 9.0 - uTime * 0.17) + 0.5 * cos(h * 0.19 + vB.y * 5.0 + uTime * 0.4)) * min(h * 0.08, 4.0);
  float r = vB.z + 0.13 * min(h, H);
  float spread = smoothstep(H - 12.0, H + 4.0, h);
  r = mix(r, vB.w, spread);
  float d = length(p.xz - c) / r;
  float sheet = 1.0 - smoothstep(H - 6.0, H + 14.0, h) * 0.0 - smoothstep(H + 6.0, H + 22.0, h);
  float n = vn(p * 0.35 + vec3(0.0, -uTime * 0.6, vB.y * 40.0)) * 0.6 + vn(p * 1.1 - vec3(0.0, uTime * 1.2, 0.0)) * 0.4;
  float core = exp(-d * d * 2.6) * smoothstep(0.25, 0.85, n + 0.35 * (1.0 - d) - 0.12 * min(h / max(H, 1.0), 1.0));
  // thinner as it rises and mixes (the plume dilutes); the sheet is thin but wide
  float dil = 1.0 / (1.0 + h * 0.11) * (1.0 - spread * 0.75);
  return vB.x * core * dil * max(sheet, 0.0) * smoothstep(0.0, 0.6, h);
}
void main() {
  vec3 ro = cameraPosition, rd = normalize(vW - ro);
  // the box: |x - cx| < R, |z - cz| < R, base .. base + H + 30
  float R = vB.w + 4.0; vec3 bmin = vec3(vA.x - R, vA.y, vA.z - R), bmax = vec3(vA.x + R, vA.y + vA.w + 30.0, vA.z + R);
  vec3 t0 = (bmin - ro) / rd, t1 = (bmax - ro) / rd, tmin = min(t0, t1), tmax = max(t0, t1);
  float tn = max(max(max(tmin.x, tmin.y), tmin.z), 0.0), tf = min(min(tmax.x, tmax.y), tmax.z);
  float tsurf = length(vW - ro); // (front faces only: the box's near face; the march starts where the ray enters)
  if (tf <= tn) discard;
  const int N = 40;
  float ds = (tf - tn) / float(N), T = 1.0; vec3 L = vec3(0.0);
  float j = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715))));
  float cosA = dot(rd, uSunDir), ph = mix((1.0 - 0.49) / (4.0 * 3.14159 * pow(1.0 + 0.49 - 1.4 * cosA, 1.5)), 1.0 / (4.0 * 3.14159), 0.5);
  for (int i = 0; i < N; i++) {
    vec3 p = ro + rd * (tn + (float(i) + j) * ds);
    float d = dens(p);
    if (d < 1e-4) continue;
    float sig = d * 0.05;
    // light towards the sun: two taps of the plume itself (self-shadow)
    float ls = dens(p + uSunDir * 1.5) + dens(p + uSunDir * 4.0);
    float sunT = exp(-ls * 0.16 * 2.5);
    vec3 S = uSunRad * sunT * ph + uSky * 1.0;
    float a = exp(-sig * ds);
    L += T * (1.0 - a) * S; T *= a;
    if (T < 0.02) break;
  }
  if (T > 0.999) discard;
  gl_FragColor = vec4(L * 0.92, 1.0 - T); // (premultiplied: a grey-white kitchen smoke, a little warm from wood and coal)
}`;function g(a,o){let c=new e(2,1,2),l=new n;l.index=c.index,l.attributes.position=c.attributes.position,l.instanceCount=0,l.setAttribute(`cA`,new t(new Float32Array(Math.max(1,a)*4),4)),l.setAttribute(`cB`,new t(new Float32Array(Math.max(1,a)*4),4));let u=new i({vertexShader:m,fragmentShader:h,transparent:!0,depthWrite:!1,depthTest:!o,side:+!!o,blending:5,blendSrc:201,blendDst:205,uniforms:{uSunDir:{value:new s(0,1,0)},uSunRad:{value:new s},uSky:{value:new s},uTime:{value:0}}}),d=new r(l,u);return d.frustumCulled=!1,d.name=o?`aug14-smoke-in`:`aug14-smoke`,d.renderOrder=5,d}function _(e){return{pts:e,outside:g(e.length,!1),inside:g(e.length,!0)}}function v(e,t,n,r){for(let r of[e.outside,e.inside]){let e=r.material.uniforms;e.uSunDir.value.copy(t.sunDir),e.uSunRad.value.set(t.sun.color.r,t.sun.color.g,t.sun.color.b).multiplyScalar(t.sun.intensity);let i=t.skyLight.sh.coefficients[0],a=.282095*t.skyLight.intensity*.8;e.uSky.value.set(i.x*a,i.y*a,i.z*a),e.uTime.value=n}let i=[0,0];for(let t of e.pts){let n=t.spread+4,a=Math.abs(r.x-t.x)<n&&Math.abs(r.z-t.z)<n&&r.y>t.y-.5&&r.y<t.y+t.H+30,o=a?e.inside:e.outside,s=i[+!!a]++,c=o.geometry;c.attributes.cA.array.set([t.x,t.y,t.z,t.H],s*4),c.attributes.cB.array.set([t.k,t.seed,t.r0,t.spread],s*4)}for(let[t,n]of[e.outside,e.inside].entries()){let e=n.geometry;e.instanceCount=i[t],e.attributes.cA.needsUpdate=!0,e.attributes.cB.needsUpdate=!0,n.visible=i[t]>0}}export{p as airFrame,_ as buildSmoke,d as patchAir,v as smokeFrame,f as unpatchAir};