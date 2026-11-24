import{Color as e,Matrix3 as t,Matrix4 as n,Uniform as r,Vector3 as i,Vector4 as a}from"../node_modules/three/build/three.core.js";import{Effect as o,EffectAttribute as s}from"../node_modules/postprocessing/build/index.js";var c=`
uniform mat4 uInverseProjection;
uniform mat4 uCamWorld;
uniform vec3 uColor;
uniform float uDensity;   // per metre, at the ground
uniform float uHeight;    // metres over which it thins to a third
uniform float uGround;    // the height of the ground (m)

void mainImage(const in vec4 inputColor, const in vec2 uv, const in float depth, out vec4 outputColor) {
  vec4 p = uInverseProjection * vec4(uv * 2.0 - 1.0, depth * 2.0 - 1.0, 1.0);
  vec3 view = p.xyz / p.w;
  vec3 dir = normalize(mat3(uCamWorld) * view);
  float dist = depth >= 1.0 ? 60000.0 : length(view);
  // the fog passed through on the way: its density falls off with height (an exponential, summed along the ray)
  float eye = (uCamWorld[3].y - uGround) / uHeight, k = dir.y * dist / uHeight;
  float through = uDensity * exp(-max(eye, 0.0)) * dist * (abs(k) > 1e-3 ? (1.0 - exp(-k)) / k : 1.0);
  float fog = 1.0 - exp(-through);
  outputColor = vec4(mix(inputColor.rgb, uColor, fog), inputColor.a);
}
`,l=class extends o{constructor(t){super(`Fog`,c,{attributes:s.DEPTH,uniforms:new Map([[`uInverseProjection`,new r(t.projectionMatrixInverse)],[`uCamWorld`,new r(t.matrixWorld)],[`uColor`,new r(new e(.7,.72,.75))],[`uDensity`,new r(0)],[`uHeight`,new r(160)],[`uGround`,new r(0)]])})}},u=`
precision highp sampler2D;
uniform mat4 uInverseProjection;
uniform mat4 uCamWorld;
uniform float uGround;
uniform float uHaze;      // extinction per metre at the ground
uniform float uHeight;    // metres over which it thins to a third
uniform float uReach;     // metres the march covers at most
uniform float uSkyReach;  // and for the sky (the shadows and the dust of the near valley only; farther the library's own sky is all there is)
uniform float uPx;        // angular size of a pixel (radians)
// shafts
uniform float uShaft;     // weight (0 off)
uniform float uSkyShaft;  // the share of it that the sky's own pixels take (the library's sky already has its in-scatter)
uniform float uVis0;      // the visibility the fog colour already stands for
uniform float uLow;       // (wave 6h) a low layer of the town's own smoke and dust under the winter inversion: extinction per metre at the ground
uniform float uLowH;      // and its scale height (m)
uniform float uMaxDark;   // (wave 6h) the most that shadow volumes in the haze can take from a pixel (its haze share only): a shadow darkens, it never blackens
uniform float uG;
uniform vec3 uLightDir;
uniform vec3 uLightRad;
uniform sampler2D uShadow;
uniform mat4 uShadowMat;
uniform float uShadowOn;
uniform float uShadowBias;
// fire glow
uniform int uGlowN;
uniform vec4 uGlow[24];
uniform vec3 uGlowColor;
uniform float uGlowK;
uniform float uGlowR0;
// stars
uniform float uStars;
uniform mat3 uStarRot;

const float AIR_PI = 3.14159265; // (not PI: three's common chunk defines that as a macro)
float ign(vec2 p) { return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715)))); }
float h31(vec3 p) { p = fract(p * 0.1031); p += dot(p, p.yzx + 33.33); return fract((p.x + p.y) * p.z); }
vec3 h33(vec3 p) { p = fract(p * vec3(0.1031, 0.1030, 0.0973)); p += dot(p, p.yxz + 33.33); return fract((p.xxy + p.yxx) * p.zyx); }
float hg(float c, float g) { float d = 1.0 + g * g - 2.0 * g * c; return (1.0 - g * g) / (4.0 * AIR_PI * d * sqrt(d)); }

// stars on a shell of cells (N cells to the radius): a star sits in a cell with a small chance, at a place in it, of a brightness (many faint, few bright) and
// a colour (blue-white to orange); drawn as a point of the pixel's size
vec3 starfield(vec3 d) {
  const float N = 130.0;
  vec3 c0 = floor(d * N), acc = vec3(0.0);
  float r = max(uPx, 3e-4) * 1.1;
  for (int i = -1; i <= 1; i++) for (int j = -1; j <= 1; j++) for (int k = -1; k <= 1; k++) {
    vec3 c = c0 + vec3(float(i), float(j), float(k));
    if (abs(length(c + 0.5) - N) > 0.9) continue;
    vec3 h = h33(c);
    if (h.x > 0.045) continue;
    vec3 sp = normalize(c + 0.5 + (h33(c + 7.13) - 0.5) * 0.8);
    float dd = length(sp - d);
    float mag = pow(h.y, 5.0) * 1.6 + 0.04;
    vec3 col = mix(vec3(0.72, 0.82, 1.0), vec3(1.0, 0.78, 0.55), h.z);
    acc += col * mag * exp(-(dd * dd) / (r * r));
  }
  return acc;
}

void mainImage(const in vec4 inputColor, const in vec2 uv, const in float depth, out vec4 outputColor) {
  vec4 p = uInverseProjection * vec4(uv * 2.0 - 1.0, depth * 2.0 - 1.0, 1.0);
  vec3 view = p.xyz / p.w;
  vec3 dir = normalize(mat3(uCamWorld) * view);
  bool sky = depth >= 1.0;
  float dist = sky ? min(uReach, uSkyReach) : min(length(view), uReach);
  vec3 ro = uCamWorld[3].xyz;
  vec3 add = vec3(0.0), base = inputColor.rgb;

  if (uShaft > 0.0 || uGlowN > 0) {
    float jit = ign(gl_FragCoord.xy);
    float cosL = dot(dir, uLightDir);
    float phase = mix(hg(cosL, uG), 0.25 / AIR_PI, 0.3);
    vec3 glowAcc = vec3(0.0);
    // (wave 6h) the haze's share that the fog colour already stands for (A, with uVis0) is only changed by the shadows: lit above the baseline adds a shaft, shaded below it takes
    // a bounded share of the pixel; the low layer (L) is air of its own: it dims what is behind it (tauL) and is lit or shaded by the sun's shadow map
    float tau = 0.0, tauA = 0.0, tauL = 0.0, litA = 0.0, darkA = 0.0, baseA = 0.0, litL = 0.0;
    const int N = 28;
    float sy = max(uLightDir.y, 0.08); // (the light's way up through the air: the vertical depth over the sine of its height)
    for (int i = 0; i < N; i++) {
      float u0 = float(i) / float(N), u1 = float(i + 1) / float(N);
      float t0 = dist * pow(u0, 1.7), t1 = dist * pow(u1, 1.7), ds = t1 - t0;
      float t = mix(t0, t1, jit);
      vec3 q = ro + dir * t;
      float hq = max(q.y - uGround, 0.0);
      float eA = exp(-hq / uHeight), eL = exp(-hq / max(uLowH, 1.0));
      float dA = uHaze * eA * ds, dL = uLow * eL * ds, dTau = dA + dL;
      float T = exp(-(tau + 0.5 * dTau));
      tau += dTau; tauA += dA; tauL += dL;
      if (uShaft > 0.0) {
        // vis: does the light reach this point of the air (the sun's own shadow map); fade: how far inside the map it is. At the map's edge and outside it the shadows fade to nothing
        // (not to "lit": a lit step against a shaded inside is a straight edge across the land)
        float vis = 1.0, fade = 1.0;
        if (uShadowOn > 0.5) {
          vec4 sc = uShadowMat * vec4(q, 1.0);
          vec3 s = sc.xyz / sc.w;
          float edge = min(min(s.x, 1.0 - s.x), min(s.y, 1.0 - s.y));
          fade = (s.z < 1.0 && s.z > 0.0) ? smoothstep(0.0, 0.3, edge) : 0.0;
          if (fade > 0.0) vis = step(s.z - uShadowBias, texture(uShadow, s.xy).r);
        }
        float tsun = exp(-(uHaze * uHeight * eA + uLow * max(uLowH, 1.0) * eL) / sy);
        float dv = mix(tsun, vis * tsun, fade) - uVis0;
        litA += T * dA * max(dv, 0.0);
        darkA += T * dA * max(-dv, 0.0);
        baseA += T * dA * uVis0;
        litL += T * dL * mix(tsun, vis * tsun, fade);
      }
      if (uGlowN > 0) {
        float g = 0.0;
        for (int j = 0; j < 24; j++) {
          if (j >= uGlowN) break;
          vec3 dv = q - uGlow[j].xyz;
          g += uGlow[j].w / (dot(dv, dv) + uGlowR0 * uGlowR0);
        }
        glowAcc += vec3(T * dTau * g);
      }
    }
    add += uLightRad * (uShaft * phase * (litA * (sky ? uSkyShaft : 1.0) + litL));
    add += uGlowColor * glowAcc * (uGlowK / (4.0 * AIR_PI));
    if (uShaft > 0.0) {
      float f = darkA / max(baseA, 1e-6);                  // the share of the baseline haze that is in shadow, 0..1
      float dark = uMaxDark * uShaft * min(f, 1.0) * (1.0 - exp(-2.5 * tauA));   // times how much haze there is on the way
      base *= exp(-tauL) * (1.0 - dark);
    }
  }

  if (sky && uStars > 0.0) {
    vec3 d = uStarRot * dir;
    float lum = dot(base, vec3(0.2126, 0.7152, 0.0722));
    float low = smoothstep(0.0, 0.22, dir.y);   // (stars are dimmed to nothing near the horizon: the long way through the air, and the haze)
    add += starfield(d) * uStars * low * exp(-lum * 14.0);
  }
  outputColor = vec4(max(base + add, 0.0), inputColor.a);
}
`,d=120,f=class extends o{constructor(e,o){super(`Air`,u,{attributes:s.DEPTH,uniforms:new Map([[`uInverseProjection`,new r(e.projectionMatrixInverse)],[`uCamWorld`,new r(e.matrixWorld)],[`uGround`,new r(0)],[`uHaze`,new r(12e-5)],[`uHeight`,new r(700)],[`uReach`,new r(9e3)],[`uSkyReach`,new r(3e3)],[`uSkyShaft`,new r(.35)],[`uPx`,new r(8e-4)],[`uShaft`,new r(0)],[`uVis0`,new r(.85)],[`uG`,new r(.7)],[`uLow`,new r(0)],[`uLowH`,new r(90)],[`uMaxDark`,new r(.3)],[`uLightDir`,new r(new i(0,1,0))],[`uLightRad`,new r(new i)],[`uShadow`,new r(null)],[`uShadowMat`,new r(new n)],[`uShadowOn`,new r(0)],[`uShadowBias`,new r(8e-4)],[`uGlowN`,new r(0)],[`uGlow`,new r(Array.from({length:24},()=>new a))],[`uGlowColor`,new r(new i(1,.46,.16))],[`uGlowK`,new r(0)],[`uGlowR0`,new r(70)],[`uStars`,new r(0)],[`uStarRot`,new r(new t)]])}),this.camera=e,this.lampScene=o,this.set={},this.stats={},this.cells=new Map}gather(){let e=this.lampScene?.getObjectByName(`fire-glow`),t=this.uniforms,n=this.camera.position,r=this.cells;if(r.clear(),this.stats.quads=0,this.stats.area=0,!e||!e.count||!e.instanceColor)return 0;let i=e.instanceMatrix.array,a=e.instanceColor.array,o=e.count,s=0;for(let e=0;e<o;e++){let t=e*16,n=i[t],o=i[t+12],c=i[t+13],l=i[t+14],u=(.2126*a[e*3]+.7152*a[e*3+1]+.0722*a[e*3+2])*n*n;if(!(u>0))continue;s+=n*n;let f=Math.floor(o/d)*65536+Math.floor(l/d),p=r.get(f);p||(p={x:0,y:0,z:0,w:0},r.set(f,p)),p.x+=o*u,p.y+=c*u,p.z+=l*u,p.w+=u}this.stats.quads=o,this.stats.area=s;let c=[];for(let e of r.values()){e.x/=e.w,e.y/=e.w,e.z/=e.w;let t=Math.hypot(e.x-n.x,e.z-n.z);e.score=e.w/(1+(t/2500)**2),c.push(e)}c.sort((e,t)=>t.score-e.score);let l=Math.min(24,c.length),u=t.get(`uGlow`).value;for(let e=0;e<l;e++)u[e].set(c[e].x,c[e].y+10,c[e].z,c[e].w);return t.get(`uGlowN`).value=l,this.stats.emitters=l,this.stats.strongest=l?c[0].w:0,l}update(e,t){let n=this.uniforms,r=this.set;n.get(`uShaft`).value=r.shaft??0,n.get(`uVis0`).value=r.vis0??.85,n.get(`uHaze`).value=r.haze??12e-5,n.get(`uLow`).value=r.low??0,n.get(`uLowH`).value=r.lowH??90,n.get(`uMaxDark`).value=r.maxDark??.3,n.get(`uHeight`).value=r.height??700,n.get(`uGround`).value=r.ground??0,n.get(`uReach`).value=r.reach??9e3,n.get(`uSkyReach`).value=r.skyReach??3e3,n.get(`uSkyShaft`).value=r.skyShaft??.35,n.get(`uStars`).value=r.stars??0,r.starRot&&n.get(`uStarRot`).value.copy(r.starRot),r.lightDir&&n.get(`uLightDir`).value.copy(r.lightDir),r.lightRad&&n.get(`uLightRad`).value.copy(r.lightRad);let i=r.light,a=i?.shadow?.map?.depthTexture;a&&(r.shaft??0)>0?(n.get(`uShadow`).value=a,n.get(`uShadowMat`).value.copy(i.shadow.matrix),n.get(`uShadowOn`).value=1):n.get(`uShadowOn`).value=0,n.get(`uShadowBias`).value=(r.shadowBias??3)/Math.max(1,(i?.shadow?.camera?.far??4e3)-(i?.shadow?.camera?.near??10)),n.get(`uGlowK`).value=r.glowK??0,(r.glowK??0)>0?this.gather():n.get(`uGlowN`).value=0;let o=t?.height||900,s=this.camera.projectionMatrixInverse.elements[5];n.get(`uPx`).value=2*s/o}};export{f as AirEffect,l as FogEffect};