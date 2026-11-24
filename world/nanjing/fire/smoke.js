import{Pass as e}from"../../../node_modules/postprocessing/build/index.js";var t=12,n=48,r=32,i=224,a=224,o=48,s=112,c=112,l=24,u=1.7,d=1700,f=[0,.005,.015,.035,.07,.13,.22,.36,.6,.95,1.5,2.3],p=1.7,m=[[0,4],[4,8],[8,11]],h=48,g=24+2*m.length,_=`void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }`,v=`
uniform vec4 uDomain;   // x0, z0, size (m), top (m)
uniform vec3 uRes;      // NX, NZ, NY
uniform float uGamma;
vec3 toUvw(vec3 p) { return vec3((p.x - uDomain.x) / uDomain.z, (p.z - uDomain.y) / uDomain.z, pow(clamp(p.y / uDomain.w, 0.0, 1.0), 1.0 / uGamma)); }
bool inDomain(vec3 u) { return all(greaterThanEqual(u, vec3(0.0))) && all(lessThanEqual(u, vec3(1.0))); }
vec3 voxel(float layer) {
  vec2 uv = gl_FragCoord.xy / uRes.xy;
  return vec3(uDomain.x + uv.x * uDomain.z, uDomain.w * pow((layer + 0.5) / uRes.z, uGamma), uDomain.y + uv.y * uDomain.z);
}`,y=`
precision highp float;
precision highp sampler2D;
${v}
uniform sampler2D uPlumes; // per plume (row): K points (x, y, z, sigma h), K more (sigma v, line density, 0, 0), then per stretch bbox min, bbox max
uniform int uCount;        // stretches whose box reaches this layer: uIdx = plume * ${m.length} + stretch, by plume (bake())
uniform int uIdx[${48*m.length}];
uniform vec3 uBMin[${48*m.length}]; // every stretch's box (the same numbers as in uPlumes, read faster)
uniform vec3 uBMax[${48*m.length}];
uniform float uLayer;
uniform float uMinSigma;
// wave F v2, the contact pall (fire/pall.js): a ground-hugging layer of dust and powder smoke from the rounds of a baked battle, a 2D field (R: optical depth of the
// column, G: optical depth x its vertical sigma, B: the ground's height) in its own domain; it goes into the density's second channel (the plumes keep the first)
uniform sampler2D uPall;
uniform vec4 uPallDom;   // x0, z0, size (m), texels per side (0 = no pall)
uniform float uPallOn;   // 1 on the layers the pall reaches
out vec4 fragColor;
const int K = 12;
float pallDens(vec3 p) {
  if (uPallOn < 0.5 || uPallDom.w < 1.0) return 0.0;
  float n = uPallDom.w;
  vec2 f = (p.xz - uPallDom.xy) / uPallDom.z * n - 0.5;
  vec2 i0 = floor(f), w = f - i0;
  float tau = 0.0, st = 0.0, gr = 0.0, wsum = 0.0;
  for (int k = 0; k < 4; k++) {
    vec2 o = vec2(float(k & 1), float(k >> 1));
    vec2 c = i0 + o;
    if (c.x < 0.0 || c.y < 0.0 || c.x >= n || c.y >= n) continue;
    vec3 v = texelFetch(uPall, ivec2(c), 0).rgb;
    float wk = (o.x > 0.5 ? w.x : 1.0 - w.x) * (o.y > 0.5 ? w.y : 1.0 - w.y);
    tau += wk * v.x; st += wk * v.y; gr += wk * v.z; wsum += wk;
  }
  if (tau < 1e-5 || wsum < 1e-3) return 0.0;
  float sg = max(st / tau, 1.5), g = gr / wsum;
  float dy = p.y - g - 0.5 * sg;
  if (p.y < g - 0.5) return 0.0;
  float e = min(f.x + 0.5, n - f.x - 0.5), e2 = min(f.y + 0.5, n - f.y - 0.5);
  float edge = clamp(min(e, e2) / (0.06 * n), 0.0, 1.0);
  return tau / (1.733 * sg) * exp(-0.5 * dy * dy / (sg * sg)) * edge;
}
void main() {
  vec3 p = voxel(uLayer);
  float dens = 0.0, best = 0.0;
  int cur = -1;
  for (int j = 0; j < ${48*m.length}; j++) {
    if (j >= uCount) break;
    int e = uIdx[j], i = e / ${m.length}, s = e - i * ${m.length};
    // (a plume is the most of its stretches at a point; the plumes add up)
    if (i != cur) { dens += best; best = 0.0; cur = i; }
    if (any(lessThan(p, uBMin[e])) || any(greaterThan(p, uBMax[e]))) continue;
    int k0 = s == 0 ? ${m[0][0]} : s == 1 ? ${m[1][0]} : ${m[2][0]};
    int k1 = s == 0 ? ${m[0][1]} : s == 1 ? ${m[1][1]} : ${m[2][1]};
    vec4 A = texelFetch(uPlumes, ivec2(k0, i), 0), Aa = texelFetch(uPlumes, ivec2(K + k0, i), 0);
    for (int k = k0 + 1; k <= k1; k++) {
      vec4 B = texelFetch(uPlumes, ivec2(k, i), 0), Ba = texelFetch(uPlumes, ivec2(K + k, i), 0);
      vec3 ab = B.xyz - A.xyz;
      float t = clamp(dot(p - A.xyz, ab) / max(dot(ab, ab), 1e-3), 0.0, 1.0);
      vec3 d = p - (A.xyz + ab * t);
      float sh = max(mix(A.w, B.w, t), uMinSigma), sv = max(mix(Aa.x, Ba.x, t), uMinSigma * 0.6);
      float lam = mix(Aa.y, Ba.y, t);
      float dh2 = max(dot(d, d) - d.y * d.y, 0.0);
      best = max(best, lam / (6.2832 * sh * sv) * exp(-0.5 * (dh2 / (sh * sh) + d.y * d.y / (sv * sv))));
      A = B; Aa = Ba;
    }
  }
  dens += best;
  // thin out towards the sides of the volume (no hard edge where it ends)
  vec2 e = min(gl_FragCoord.xy, uRes.xy - gl_FragCoord.xy) / (0.06 * uRes.xy);
  dens *= clamp(min(e.x, e.y), 0.0, 1.0);
  float pall = pallDens(p) * clamp(min(e.x, e.y), 0.0, 1.0);
  fragColor = vec4(dens, pall, 0.0, 1.0);
}`,b=`
precision highp float;
precision highp sampler3D;
${v}
uniform sampler3D uDensity;
uniform float uLayer;
uniform vec3 uSunDir;
uniform float uExt;
uniform vec4 uLights[32];
uniform int uLightCount;
out vec4 fragColor;
float densAt(vec3 p) { vec3 u = toUvw(p); if (!inDomain(u)) return 0.0; vec2 d2 = texture(uDensity, u).rg; return d2.r + d2.g; }
void main() {
  vec3 p = voxel(uLayer);
  // towards the sun (or the moon)
  float tau = 0.0, s = 0.0, ds = 10.0;
  for (int j = 0; j < 15; j++) { s += ds; tau += densAt(p + uSunDir * s) * ds; ds *= 1.38; }
  float sun = exp(-uExt * tau);
  // straight up: how much of the sky it sees
  tau = 0.0; s = 0.0; ds = 12.0;
  for (int j = 0; j < 9; j++) { s += ds; tau += densAt(p + vec3(0.0, s, 0.0)) * ds; ds *= 1.5; }
  float sky = exp(-uExt * tau);
  // the fires below: inverse square, through the smoke between (two samples on the way)
  float fire = 0.0;
  for (int i = 0; i < 32; i++) {
    if (i >= uLightCount) break;
    vec4 L = uLights[i];
    vec3 d = L.xyz - p;
    float r2 = dot(d, d), r = sqrt(r2);
    float od = (densAt(p + d * 0.33) + densAt(p + d * 0.67)) * 0.5 * r;
    fire += L.w * exp(-uExt * od) / (12.566 * (r2 + 2500.0));
  }
  fragColor = vec4(fire, sun, sky, 1.0);
}`,x=`out vec2 vUv; void main() { vUv = position.xy * 0.5 + 0.5; gl_Position = vec4(position.xy, 0.0, 1.0); }`,S=`
uniform highp sampler2D tDepth;
uniform mat4 uInvProj;
uniform mat4 uCamWorld;
vec3 viewAt(vec2 uv, float depth) { vec4 p = uInvProj * vec4(uv * 2.0 - 1.0, depth * 2.0 - 1.0, 1.0); return p.xyz / p.w; }
`,C=`
precision highp float;
precision highp sampler3D;
in vec2 vUv;
out vec4 fragColor;
${S}
uniform sampler3D uDensity;
uniform sampler3D uLight;
uniform sampler3D uNoise;
uniform vec4 uDomain;
uniform float uGamma;
uniform vec3 uSunDir;
uniform vec3 uSunE;
uniform vec3 uSkyL;
uniform vec3 uGroundL;
uniform vec3 uFireCol;
uniform float uExt;
uniform vec3 uAlbedo;
uniform vec3 uAlbedoDust; // the pall's albedo (dust and powder smoke), against uAlbedo, the fire smoke's
uniform float uPallMarch; // 1 when the density volume holds a pall (no second read of the density when it does not)
uniform float uPallFar;   // a display compensation, stated in FX_DONE: the pall seen from 2.2 km and more is this many times denser than the field says (a layer 20 m thick must still read from a kilometre and a half)
uniform vec3 uNoiseOff;
uniform float uNoiseScale;
uniform float uWarp;
uniform vec3 uBoxMin;   // the box that holds all the smoke there is (the plumes' boxes, grown by the warp's reach)
uniform vec3 uBoxMax;
uniform sampler2D uCol;  // per column of the volume (CG x CG): the highest any smoke there can reach (0: none), warp included
vec3 toUvw(vec3 p) { return vec3((p.x - uDomain.x) / uDomain.z, (p.z - uDomain.y) / uDomain.z, pow(clamp(p.y / uDomain.w, 0.0, 1.0), 1.0 / uGamma)); }
float hg(float mu, float g) { float g2 = g * g; return (1.0 - g2) / (12.566 * pow(max(1.0 + g2 - 2.0 * g * mu, 1e-4), 1.5)); }
float h12(vec2 p) { vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
void main() {
  float depth = texture(tDepth, vUv).r;
  vec3 view = viewAt(vUv, depth);
  vec3 ro = uCamWorld[3].xyz, rd = normalize(mat3(uCamWorld) * view);
  float dist = depth >= 0.99999 ? 1e7 : length(view);
  // (the ray is marched only where there is smoke: through the smoke's own box, not the whole volume)
  vec3 bmin = uBoxMin, bmax = uBoxMax;
  vec3 inv = 1.0 / rd, t0 = (bmin - ro) * inv, t1 = (bmax - ro) * inv, a = min(t0, t1), b = max(t0, t1);
  float tn = max(max(max(a.x, a.y), a.z), 0.0), tf = min(min(min(b.x, b.y), b.z), dist);
  if (tf <= tn) { fragColor = vec4(0.0, 0.0, 0.0, 1.0); return; }
  float len = tf - tn;
  int n = int(clamp(len / 22.0, 16.0, 96.0));
  float ds = len / float(n);
  // mip level of the base noise for this step length (64 texels over 1 / uNoiseScale metres)
  float lod0 = log2(max(ds * uNoiseScale * 64.0, 1e-3));
  float j = h12(gl_FragCoord.xy);
  float mu = dot(rd, uSunDir);
  float ph = 0.78 * hg(mu, 0.62) + 0.22 * hg(mu, -0.2), ph2 = 0.5 * hg(mu, 0.3) + 0.5 / 12.566;
  vec3 L = vec3(0.0); float T = 1.0;
  for (int k = 0; k < 96; k++) {
    if (k >= n) break;
    vec3 p = ro + rd * (tn + (float(k) + j) * ds);
    // (above all the smoke in this column: nothing to read)
    if (p.y > texture(uCol, (p.xz - uDomain.xy) / uDomain.z).r) continue;
    // the edges of the smoke billow: the density is read a little off where the sample is (a warp by a smooth noise
    // that drifts with the wind), then thinned by a finer noise
    vec3 np = p * uNoiseScale + uNoiseOff;
    // (each noise is read at the detail one step can hold: finer than the step it would only alias into grain)
    vec3 w = (textureLod(uNoise, np, lod0).rgb - 0.5) + 2.2 * (textureLod(uNoise, p * uNoiseScale * 0.27 + uNoiseOff * 0.5 + vec3(0.5, 0.2, 0.9), lod0 + log2(0.27)).gba - 0.5);
    vec3 u = toUvw(p + w * uWarp);
    float dF = texture(uDensity, u).r;
    // (the pall is a thin layer: its density is read with the vertical part of the warp nearly taken out, so the billows move it about on the ground and do not lift it into the air;
    // and it fades out within 240 m of the eye (a display rule, stated in FX_DONE: at 100 m it is a fifth of what the field says), so that a camera standing in or near it sees a haze and is never blinded)
    vec3 u2 = u;
    float dP = 0.0;
    if (uPallMarch > 0.5) {
      u2 = toUvw(p + vec3(w.x, w.y * 0.08, w.z) * (uWarp * 0.55));
      dP = texture(uDensity, u2).g * smoothstep(40.0, 240.0, length(p - ro)) * (1.0 + uPallFar * smoothstep(500.0, 2200.0, length(p - ro)));
    }
    float d = dF + dP;
    if (d < 1e-7) continue;
    vec3 alb = dP > 0.0 ? mix(uAlbedo, uAlbedoDust, dP / d) : uAlbedo;
    float fine = textureLod(uNoise, np * 3.1 + vec3(0.37, 0.11, 0.73), lod0 + log2(3.1)).r;
    // (and lumps and gaps a kilometre across in a big plume or the pall)
    float big = textureLod(uNoise, p * uNoiseScale * 0.22 + uNoiseOff * 0.4 + vec3(0.71, 0.29, 0.13), lod0 + log2(0.22)).r;
    float nd = d / (d + 0.004);
    d *= mix(0.25 + 1.5 * fine, 1.0, 0.35 * nd) * (0.3 + 1.4 * smoothstep(0.25, 0.8, big));
    vec4 l = texture(uLight, dP > dF ? u2 : u);
    float st = uExt * d;
    vec3 J = uSunE * (l.y * ph + 0.6 * sqrt(l.y) * ph2 + 0.4 * sqrt(sqrt(l.y)) / 12.566) + uSkyL * (0.5 * l.z + 0.15) + uGroundL * 0.35 + uFireCol * l.x;
    float tr = exp(-st * ds);
    L += T * alb * J * (1.0 - tr);
    T *= tr;
    if (T < 0.004) break;
  }
  fragColor = vec4(L, T);
}`,w=`
precision highp float;
precision highp sampler3D;
in vec2 vUv;
out vec4 fragColor;
${S}
uniform sampler2D inputBuffer;
uniform sampler2D tSmoke;
uniform vec2 uLow;         // size of the half-resolution target
uniform sampler3D uLight;
uniform vec4 uDomain;
uniform float uGamma;
uniform float uSunShare;
uniform float uSkyShare;
vec3 toUvw(vec3 p) { return vec3((p.x - uDomain.x) / uDomain.z, (p.z - uDomain.y) / uDomain.z, pow(clamp(p.y / uDomain.w, 0.0, 1.0), 1.0 / uGamma)); }
void main() {
  vec4 src = texture(inputBuffer, vUv);
  vec3 col = min(src.rgb, vec3(6e4));
  float depth = texture(tDepth, vUv).r;
  vec3 view = viewAt(vUv, depth);
  float dist = depth >= 0.99999 ? 1e7 : length(view);
  // the smoke's shadow: the sunlight (and some of the sky) the volume holds back above this point
  if (depth < 0.99999) {
    vec3 p = uCamWorld[3].xyz + mat3(uCamWorld) * view;
    vec3 u = toUvw(p + vec3(0.0, 3.0, 0.0));
    if (all(greaterThanEqual(u, vec3(0.0))) && all(lessThanEqual(u, vec3(1.0)))) {
      vec4 l = texture(uLight, u);
      // (direct sunlight is cut by the smoke's full optical depth, but much of it is scattered forward and still lands:
      // the light under the smoke goes as the square root of the direct transmittance, 推测 for forward-scattering smoke)
      col *= mix(1.0, sqrt(l.y), uSunShare) * mix(1.0, sqrt(l.z), uSkyShare);
    }
  }
  // depth-aware upsampling of the smoke: the 4 x 4 low-resolution texels round this pixel, each weighted by how near
  // it is (a tent) and by how alike the depth it marched to is to this pixel's
  vec2 lp = vUv * uLow - 0.5, base = floor(lp);
  vec4 acc = vec4(0.0); float wsum = 0.0;
  float ld = min(dist, 6e4);
  for (int y = -1; y <= 2; y++) for (int x = -1; x <= 2; x++) {
    vec2 c = base + vec2(float(x), float(y));
    vec2 uv = (c + 0.5) / uLow;
    if (any(lessThan(uv, vec2(0.0))) || any(greaterThan(uv, vec2(1.0)))) continue;
    float dd = texture(tDepth, uv).r;
    float od = dd >= 0.99999 ? 6e4 : min(length(viewAt(uv, dd)), 6e4);
    vec2 e = abs(c + 0.5 - vUv * uLow);
    float wb = max(0.0, 1.0 - e.x / 1.6) * max(0.0, 1.0 - e.y / 1.6);
    float wd = 1.0 / (0.02 + abs(od - ld) / max(ld, 1.0));
    float w = wb * wd;
    acc += texture(tSmoke, uv) * w; wsum += w;
  }
  vec4 s = wsum > 0.0 ? acc / wsum : vec4(0.0, 0.0, 0.0, 1.0);
  fragColor = vec4(col * s.a + s.rgb, src.a);
}`,T=class extends e{constructor(e,t,n){super(`FireSmokePass`),this.needsDepthTexture=!0,this.needsSwap=!0,this.low=new e.WebGLRenderTarget(2,2,{type:e.HalfFloatType,depthBuffer:!1,minFilter:e.LinearFilter,magFilter:e.LinearFilter}),this.low.texture.generateMipmaps=!1,this.march=new e.ShaderMaterial({glslVersion:e.GLSL3,vertexShader:x,fragmentShader:C,uniforms:t,depthTest:!1,depthWrite:!1}),this.composite=new e.ShaderMaterial({glslVersion:e.GLSL3,vertexShader:x,fragmentShader:w,uniforms:n,depthTest:!1,depthWrite:!1}),n.tSmoke.value=this.low.texture,this.fullscreenMaterial=this.march,this.marchU=t,this.compositeU=n,this.on=!0}setDepthTexture(e){this.marchU.tDepth.value=e,this.compositeU.tDepth.value=e}getDepthTexture(){return this.marchU.tDepth.value}setSize(e,t){let n=Math.max(1,Math.ceil(e/2)),r=Math.max(1,Math.ceil(t/2));this.low.setSize(n,r),this.compositeU.uLow.value.set(n,r)}render(e,t,n){this.screen.material=this.march,e.setRenderTarget(this.low),e.render(this.scene,this.camera),this.screen.material=this.composite,this.compositeU.inputBuffer.value=t.texture,e.setRenderTarget(this.renderToScreen?null:n),e.render(this.scene,this.camera)}dispose(){this.low.dispose(),this.march.dispose(),this.composite.dispose()}};function E(e,t=64){let n=new Uint8Array(t*t*t),r=(e,t,n,r)=>{let i=Math.imul(e*374761393+t*668265263+n*2147483647+r*1274126177,1103515245)>>>0;return i^=i>>>13,i=Math.imul(i,1274126177)>>>0,(i^i>>>16)/4294967296},i=[];for(let e=0;e<6;e++)for(let t=0;t<6;t++)for(let n=0;n<6;n++)i.push([n+r(n,t,e,1),t+r(n,t,e,2),e+r(n,t,e,3)]);let a=(e,t,n)=>{let i=Math.floor(e),a=Math.floor(t),o=Math.floor(n),s=e-i,c=t-a,l=n-o,u=e=>e*e*(3-2*e),d=e=>(e%8+8)%8,f=0;for(let e=0;e<8;e++){let t=e&1,n=e>>1&1,p=e>>2;f+=r(d(i+t),d(a+n),d(o+p),9)*(t?u(s):1-u(s))*(n?u(c):1-u(c))*(p?u(l):1-u(l))}return f};for(let e=0;e<t;e++)for(let r=0;r<t;r++)for(let o=0;o<t;o++){let s=o/t*6,c=r/t*6,l=e/t*6,u=9,d=Math.floor(s),f=Math.floor(c),p=Math.floor(l);for(let e=-1;e<=1;e++)for(let t=-1;t<=1;t++)for(let n=-1;n<=1;n++){let r=d+n,a=f+t,o=p+e,m=(r%6+6)%6,h=(a%6+6)%6,g=(o%6+6)%6,_=i[(g*6+h)*6+m],v=_[0]+(r-m)-s,y=_[1]+(a-h)-c,b=_[2]+(o-g)-l;u=Math.min(u,v*v+y*y+b*b)}let m=1-Math.min(1,Math.sqrt(u)*1.1),h=.5*a(o/t*8,r/t*8,e/t*8)+.25*a(o/t*8*2,r/t*8*2,e/t*8*2)*1;n[(e*t+r)*t+o]=Math.round(255*Math.min(1,Math.max(0,.62*m+.55*h)))}let o=new Uint8Array(t*t*t*4),s=(e,r,i)=>n[(i%t*t+r%t)*t+e%t];for(let e=0;e<t;e++)for(let n=0;n<t;n++)for(let r=0;r<t;r++){let i=((e*t+n)*t+r)*4;o[i]=s(r,n,e),o[i+1]=s(r+21,n+37,e+11),o[i+2]=s(r+43,n+7,e+29),o[i+3]=s(r+13,n+51,e+45)}let c=new e.Data3DTexture(o,t,t,t);return c.format=e.RGBAFormat,c.type=e.UnsignedByteType,c.magFilter=e.LinearFilter,c.minFilter=e.LinearMipmapLinearFilter,c.generateMipmaps=!0,c.wrapS=c.wrapT=c.wrapR=e.RepeatWrapping,c.unpackAlignment=1,c.needsUpdate=!0,c}var D=class{constructor(e,t,n,r,f=1){this.THREE=e,this.renderer=t,this.atmosphere=n,this.camera=r;let p=(t,n=i,r=a,s=o)=>{let c=new e.WebGL3DRenderTarget(n,r,s,{type:e.HalfFloatType,format:t,depthBuffer:!1,stencilBuffer:!1,generateMipmaps:!1,minFilter:e.LinearFilter,magFilter:e.LinearFilter});return c.texture.minFilter=c.texture.magFilter=e.LinearFilter,c.texture.wrapS=c.texture.wrapT=c.texture.wrapR=e.ClampToEdgeWrapping,c};this.density=p(e.RGFormat),this.pallTex=null,this.light=p(e.RGBAFormat,s,c,l),this.colData=new Float32Array(h*h),this.col=new e.DataTexture(this.colData,h,h,e.RedFormat,e.FloatType),this.col.minFilter=this.col.magFilter=e.NearestFilter,this.col.needsUpdate=!0,this.plumeData=new Float32Array(g*48*4),this.plumes=new e.DataTexture(this.plumeData,g,48,e.RGBAFormat,e.FloatType),this.plumes.minFilter=this.plumes.magFilter=e.NearestFilter,this.plumes.needsUpdate=!0,this.noise=E(e),this.lightsU=[...Array(32)].map(()=>new e.Vector4);let v={uDomain:{value:new e.Vector4(-6e3,-6e3,12e3,d)},uRes:{value:new e.Vector3(i,a,o)},uGamma:{value:u}};this.domain=v.uDomain.value,this.bakeDensity=new e.ShaderMaterial({glslVersion:e.GLSL3,vertexShader:_,fragmentShader:y,depthTest:!1,depthWrite:!1,uniforms:{...v,uPlumes:{value:this.plumes},uCount:{value:0},uIdx:{value:new Int32Array(48*m.length)},uBMin:{value:[...Array(48*m.length)].map(()=>new e.Vector3)},uBMax:{value:[...Array(48*m.length)].map(()=>new e.Vector3)},uLayer:{value:0},uMinSigma:{value:20},uPall:{value:null},uPallDom:{value:new e.Vector4(0,0,1,0)},uPallOn:{value:0}}}),this.bakeLight=new e.ShaderMaterial({glslVersion:e.GLSL3,vertexShader:_,fragmentShader:b,depthTest:!1,depthWrite:!1,uniforms:{...v,uRes:{value:new e.Vector3(s,c,l)},uDensity:{value:this.density.texture},uLayer:{value:0},uSunDir:{value:new e.Vector3(0,1,0)},uExt:{value:4},uLights:{value:this.lightsU},uLightCount:{value:0}}}),this.quad=new e.Mesh(new e.BufferGeometry,this.bakeDensity),this.quad.geometry.setAttribute(`position`,new e.BufferAttribute(new Float32Array([-1,-1,0,3,-1,0,-1,3,0]),3)),this.quad.frustumCulled=!1,this.bakeScene=new e.Scene,this.bakeScene.add(this.quad),this.bakeCam=new e.OrthographicCamera(-1,1,1,-1,0,1);let x=e=>({value:e}),S={tDepth:x(null),uInvProj:x(r.projectionMatrixInverse),uCamWorld:x(r.matrixWorld),uDomain:x(this.domain),uGamma:x(u)};this.u={...S,uDensity:x(this.density.texture),uLight:x(this.light.texture),uNoise:x(this.noise),uSunDir:x(new e.Vector3(0,1,0)),uSunE:x(new e.Vector3),uSkyL:x(new e.Vector3),uGroundL:x(new e.Vector3),uFireCol:x(new e.Vector3(1,.42,.13)),uExt:x(4),uAlbedo:x(new e.Vector3(.3,.27,.24)),uAlbedoDust:x(new e.Vector3(.7,.66,.6)),uPallFar:x(3.5),uPallMarch:x(0),uNoiseOff:x(new e.Vector3),uNoiseScale:x(1/300),uWarp:x(110),uBoxMin:x(new e.Vector3),uBoxMax:x(new e.Vector3),uCol:x(null)},this.c={...S,inputBuffer:x(null),tSmoke:x(null),uLow:x(new e.Vector2(1,1)),uLight:this.u.uLight,uSunShare:x(0),uSkyShare:x(0)},this.pass=new T(e,this.u,this.c);let C=n.composer,w=C.passes.indexOf(n.flarePass);C.addPass(this.pass,w>=0?w:Math.max(0,C.passes.length-2)),this.count=0,this.lightCount=0,this.ext=f}get ext(){return this.u.uExt.value}set ext(e){this.u.uExt.value=e,this.bakeLight.uniforms.uExt.value=e}place(e,t,n){(n||!this.size)&&(this.size=t<800?4e3:t<2600?12e3:18e3);let r=this.size,a=r/i,o=Math.round(e.x/a)*a,s=Math.round(e.z/a)*a;return this.domain.set(o-r/2,s-r/2,r,d),this.bakeDensity.uniforms.uMinSigma.value=.75*a,`${r}:${o}:${s}`}writePlume(e,t){let n=this.plumeData,r=e*g*4;for(let e=0;e<12;e++){let i=t[e],a=r+e*4,o=r+(12+e)*4;n[a]=i.x,n[a+1]=i.y,n[a+2]=i.z,n[a+3]=i.sh,n[o]=i.sv,n[o+1]=i.lam,n[o+2]=0,n[o+3]=0}let i=!1;return m.forEach(([e,a],o)=>{let s=1e9,c=1e9,l=1e9,u=-1e9,d=-1e9,f=-1e9;for(let n=e+1;n<=a;n++)if(t[n-1].lam>0||t[n].lam>0)for(let e of[t[n-1],t[n]])s=Math.min(s,e.x-3*e.sh),c=Math.min(c,e.y-3*e.sv),l=Math.min(l,e.z-3*e.sh),u=Math.max(u,e.x+3*e.sh),d=Math.max(d,e.y+3*e.sv),f=Math.max(f,e.z+3*e.sh);let p=r+(24+2*o)*4;u>=s&&(i=!0,c=Math.max(0,c)),n[p]=s,n[p+1]=c,n[p+2]=l,n[p+3]=0,n[p+4]=u,n[p+5]=d,n[p+6]=f,n[p+7]=0}),i}setPlumes(e){this.count=e,this.plumes.needsUpdate=!0,this.bakeDensity.uniforms.uCount.value=e}setLights(e){this.lightCount=Math.min(32,e.length);for(let t=0;t<this.lightCount;t++)this.lightsU[t].set(e[t].x,e[t].y,e[t].z,e[t].power);this.bakeLight.uniforms.uLightCount.value=this.lightCount}setPall(e){let t=this.bakeDensity.uniforms;this.pall=e&&e.n>0?e:null,this.pall?(t.uPall.value=e.tex,t.uPallDom.value.set(e.x0,e.z0,e.size,e.n)):t.uPallDom.value.set(0,0,1,0)}bake(){let e=this.renderer,t=e.getRenderTarget(),n=e.getActiveCubeFace(),r=e.getActiveMipmapLevel(),s=e.autoClear,c=e.shadowMap.autoUpdate,d=e.getClearColor(new this.THREE.Color),f=e.getClearAlpha();e.autoClear=!1,e.shadowMap.autoUpdate=!1;let _=this.domain,v=this.count,y=this.plumeData,b=m.length,x=this.bakeDensity.uniforms,S=x.uIdx.value,C=x.uBMin.value,w=x.uBMax.value,T=this.density,E=[1/0,1/0,1/0,-1/0,-1/0,-1/0],D=[];for(let e=0;e<v;e++)for(let t=0;t<b;t++){let n=e*g*4+(24+2*t)*4,r=e*b+t;if(C[r].set(y[n],y[n+1],y[n+2]),w[r].set(y[n+4],y[n+5],y[n+6]),!(y[n+4]<y[n]||y[n+4]<_.x||y[n]>_.x+_.z||y[n+6]<_.y||y[n+2]>_.y+_.z||y[n+1]>_.w)){D.push(r);for(let e=0;e<3;e++)E[e]=Math.min(E[e],y[n+e]),E[3+e]=Math.max(E[3+e],y[n+4+e])}}let O=this.pall&&this.pall.rect[2]>=_.x&&this.pall.rect[0]<=_.x+_.z&&this.pall.rect[3]>=_.y&&this.pall.rect[1]<=_.y+_.z?this.pall:null;O&&(E[0]=Math.min(E[0],O.rect[0]),E[2]=Math.min(E[2],O.rect[1]),E[1]=Math.min(E[1],0),E[3]=Math.max(E[3],O.rect[2]),E[5]=Math.max(E[5],O.rect[3]),E[4]=Math.max(E[4],O.ymax)),this.u.uPallMarch.value=+!!O;let k=this.u.uWarp.value*p;this.u.uBoxMin.value.set(Math.max(_.x,E[0]-k),0,Math.max(_.y,E[2]-k)),this.u.uBoxMax.value.set(Math.min(_.x+_.z,E[3]+k),Math.min(_.w,E[4]+k),Math.min(_.y+_.z,E[5]+k));let A=this.colData,j=_.z/h;A.fill(0);for(let e of D){let t=C[e],n=w[e],r=n.y+k,i=Math.max(0,Math.floor((t.x-k-_.x)/j)),a=Math.min(h-1,Math.floor((n.x+k-_.x)/j)),o=Math.max(0,Math.floor((t.z-k-_.y)/j)),s=Math.min(h-1,Math.floor((n.z+k-_.y)/j));for(let e=o;e<=s;e++)for(let t=i;t<=a;t++)A[e*h+t]<r&&(A[e*h+t]=r)}if(O){let e=O.ymax+k,t=Math.max(0,Math.floor((O.rect[0]-k-_.x)/j)),n=Math.min(h-1,Math.floor((O.rect[2]+k-_.x)/j)),r=Math.max(0,Math.floor((O.rect[1]-k-_.y)/j)),i=Math.min(h-1,Math.floor((O.rect[3]+k-_.y)/j));for(let a=r;a<=i;a++)for(let r=t;r<=n;r++)A[a*h+r]<e&&(A[a*h+r]=e)}this.col.needsUpdate=!0,this.u.uCol.value=this.col;let M=(e,t)=>_.w*((e+.5)/t)**+u;this.quad.material=this.bakeDensity,e.setClearColor(0,0);for(let t=0;t<o;t++){let n=M(t,o),r=0,s=1/0,c=1/0,l=-1/0,u=-1/0;for(let e of D){let t=C[e],i=w[e];n<t.y||n>i.y||(S[r++]=e,s=Math.min(s,t.x),c=Math.min(c,t.z),l=Math.max(l,i.x),u=Math.max(u,i.z))}let d=O&&n<=O.ymax;if(d&&(s=Math.min(s,O.rect[0]),c=Math.min(c,O.rect[1]),l=Math.max(l,O.rect[2]),u=Math.max(u,O.rect[3])),x.uPallOn.value=+!!d,T.scissorTest=!1,e.setRenderTarget(T,t),e.clear(!0,!1,!1),!r&&!d)continue;let f=Math.max(0,Math.floor((s-_.x)/_.z*i)-1),p=Math.min(i,Math.ceil((l-_.x)/_.z*i)+1),m=Math.max(0,Math.floor((c-_.y)/_.z*a)-1),h=Math.min(a,Math.ceil((u-_.y)/_.z*a)+1);p<=f||h<=m||(x.uCount.value=r,x.uLayer.value=t,T.scissor.set(f,m,p-f,h-m),T.scissorTest=!0,e.setRenderTarget(T,t),e.render(this.bakeScene,this.bakeCam))}T.scissorTest=!1;let N=E[4],P=this.bakeLight.uniforms;this.quad.material=this.bakeLight;for(let t=0;t<l;t++){if(e.setRenderTarget(this.light,t),t>0&&M(t-1,l)>N){e.setClearColor(65535,1),e.clear(!0,!1,!1);continue}P.uLayer.value=t,e.render(this.bakeScene,this.bakeCam)}e.setClearColor(d,f),e.setRenderTarget(t,n,r),e.autoClear=s,e.shadowMap.autoUpdate=c}dispose(){this.atmosphere.composer.removePass(this.pass),this.pass.dispose(),this.density.dispose(),this.light.dispose(),this.col.dispose(),this.plumes.dispose(),this.noise.dispose(),this.bakeDensity.dispose(),this.bakeLight.dispose(),this.quad.geometry.dispose()}};export{f as AGES,t as K,r as MAX_LIGHTS,n as MAX_PLUMES,D as Smoke};