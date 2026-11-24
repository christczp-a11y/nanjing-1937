import{__exportAll as e}from"../../../_virtual/_rolldown/runtime.js";import{__vitePreload as t}from"../../../_virtual/_vite/preload-helper.js";import{WEAPONS as n,bsim_events_exports as r,prepareBake as i}from"../people/bsim_events.js";var a=e({dispose:()=>L,install:()=>O,update:()=>N}),o=null,s=2e3,c=7,l=14,u=1600,d=.05,f=1.2,p=.2,m=4,h=.25,g=4e3,_=9.81,v=`
in vec4 iT;   // tail x, y, z, energy share (0..1)
in vec4 iH;   // head x, y, z, head glow (0..1)
uniform float uPx;   // pixels per radian
uniform float uW;    // physical width (m)
uniform float uMinPx;
uniform float uJ;    // scene candela per metre
out float vAlong; out float vSide; out float vL; out float vHead;
void main() {
  vec3 a = iT.xyz, b = iH.xyz;
  vec3 dir = b - a; float L = length(dir);
  dir = L > 1e-4 ? dir / L : vec3(0.0, 1.0, 0.0);
  vec3 p = mix(a, b, position.x);
  vec3 toCam = cameraPosition - p; float d = max(length(toCam), 0.1);
  vec3 side = cross(dir, toCam / d); float sl = length(side);
  side = sl > 1e-3 ? side / sl : normalize(cross(vec3(0.0, 1.0, 0.0), toCam / d) + vec3(1e-4, 0.0, 0.0));
  float w = max(uW, uMinPx * d / uPx);
  // the quad is three widths wide (the profile across falls to nothing inside it) and reaches a width past each end (the round point of the head)
  p += dir * (position.x * 2.0 - 1.0) * w;
  p += side * position.y * 1.5 * w;
  vAlong = position.x * (L + 2.0 * w) / max(L, 1e-3) - w / max(L, 1e-3); // 0 at the tail, 1 at the head, beyond at the caps
  vSide = position.y * 1.5;
  // radiance of the core: the line's intensity per metre over the drawn width (widening dims it by the same factor: energy kept)
  vL = min(uJ * iT.w / w, uJ * 5.5);   // (a tracer seen from a few tens of metres is not a white laser: its radiance is capped, so that it stays an orange-red dash and the page's exposure does the rest)
  vHead = iH.w * L / max(w, 1e-3); // the head point's share, in lengths of the streak
  gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
}`,y=`
precision highp float;
in float vAlong; in float vSide; in float vL; in float vHead;
out vec4 fragColor;
void main() {
  float u = clamp(vAlong, 0.0, 1.0);
  float across = exp(-3.14159 * vSide * vSide);
  // the tail fades towards the muzzle side (the eye's and the camera's persistence of the moving point)
  float tail = (vAlong < 0.0 || vAlong > 1.0) ? 0.0 : (0.15 + 2.55 * u * u);
  // the burning point itself at the head, as wide as the streak
  float hd = (vAlong - 1.0) * vHead;
  float head = exp(-3.14159 * (hd * hd + vSide * vSide)) * 2.5;
  float e = vL * (tail * across + head);
  vec3 c = mix(vec3(1.0, 0.24, 0.07), vec3(1.0, 0.58, 0.28), clamp(u * u * u + head * 0.3, 0.0, 1.0));
  fragColor = vec4(c * e, 0.0);
}`,b=`
in float aE; in float aS; in float aW;   // intensity (scene cd, shown), size (m), warmth 0..1
uniform float uPx; uniform float uMinPx; uniform float uCap; uniform float uBias; uniform float uMaxPx;
out float vE; out float vW;
void main() {
  vec4 mv = viewMatrix * vec4(position, 1.0);
  // (a flash is a glowing cloud of gas 0.4-4 m across, not a point at the muzzle: it is drawn a size and a half, and 0.8 m, towards the eye, so that the parapet or the roof it stands behind
  // does not cut it whole by its centre's depth; a stated display choice)
  mv.z += aS * 1.5 + uBias;
  float dist = max(1.0, -mv.z);
  // the source spreads over its own size or over uMinPx pixels, whichever is larger: radiance = I / projected area (fire/photo.js radiance()), then the display's shoulder
  float dOwn = max(aS, uMinPx * dist / uPx);
  // a source brighter than the display's shoulder BLOOMS: its disc grows until its radiance falls to four times the shoulder (the energy kept, as the tracers' widening keeps it; the core stays at the shoulder), up to uMaxPx pixels
  float dSat = sqrt(aE / (0.7854 * uCap * 4.0));
  float d = clamp(max(dOwn, dSat), dOwn, max(dOwn, uMaxPx * dist / uPx));
  float L = aE / (0.7854 * d * d);
  L = uCap * (1.0 - exp(-L / uCap));
  gl_PointSize = clamp(d * uPx / dist, uMinPx, 64.0);
  // (the true-size ball of the people mod takes over inside ~90 m: this fades in from 90 to 200 m)
  vE = L * smoothstep(90.0, 200.0, dist);
  vW = aW;
  gl_Position = projectionMatrix * mv;
}`,x=`
precision highp float;
in float vE; in float vW;
out vec4 fragColor;
void main() {
  vec2 c = gl_PointCoord * 2.0 - 1.0;
  float d = dot(c, c);
  if (d > 1.0 || vE <= 0.002) discard;
  float g = exp(-2.6 * d) * (1.0 - d);
  // the hot gas: orange at the edge, white-yellow where the radiance is high
  vec3 hot = mix(vec3(1.0, 0.55, 0.22), vec3(1.0, 0.9, 0.7), clamp(g * vE / 14.0, 0.0, 1.0));
  fragColor = vec4(hot * g * vE, 0.0);
}`,S=null,C=0,w=new Set;function T(e){let t=performance.now();if(t-C>500){C=t;try{w=new Set((localStorage.getItem(`njFxOff`)||``).split(`,`).map(e=>e.trim()).filter(Boolean))}catch{w=new Set}}return w.has(e)||w.has(`all`)}function E(e,t,n){let r=Math.imul((e|0)^2654435769,2246822507)^Math.imul((t|0)+Math.imul(n|0,668265263)|0,3266489909);return r^=r>>>15,r=Math.imul(r,739982445),r^=r>>>12,r=Math.imul(r,695872825),r^=r>>>15,(r>>>0)/4294967296}function D(e){let t=2166136261;for(let n=0;n<e.length;n++)t^=e.charCodeAt(n),t=Math.imul(t,16777619);return t>>>0}async function O(e){if(new URLSearchParams(location.search).get(`tracers`)===`0`)return;let n=import.meta.url.replace(/\/mods\/[^/]*$/,`/fire/`);o=await t(()=>import(`${n}photo.js?t=${Date.now()}`),[],import.meta.url);let r=e.THREE,i=new r.BufferGeometry;i.setAttribute(`position`,new r.BufferAttribute(new Float32Array([0,-1,0,1,-1,0,1,1,0,0,1,0]),3)),i.setIndex([0,1,2,0,2,3]);let a=new r.InstancedBufferGeometry;a.index=i.index,a.setAttribute(`position`,i.getAttribute(`position`));let c=new Float32Array(s*4),l=new Float32Array(s*4),p=new r.InstancedBufferAttribute(c,4),m=new r.InstancedBufferAttribute(l,4);p.setUsage(r.DynamicDrawUsage),m.setUsage(r.DynamicDrawUsage),a.setAttribute(`iT`,p),a.setAttribute(`iH`,m),a.instanceCount=0;let h=new r.ShaderMaterial({glslVersion:r.GLSL3,vertexShader:v,fragmentShader:y,uniforms:{uPx:{value:900},uW:{value:d},uMinPx:{value:f},uJ:{value:o.TRACER_J}},transparent:!0,depthWrite:!1,depthTest:!0,blending:r.CustomBlending,blendEquation:r.AddEquation,blendSrc:r.OneFactor,blendDst:r.OneFactor,blendSrcAlpha:r.ZeroFactor,blendDstAlpha:r.OneFactor,side:r.DoubleSide,fog:!1,toneMapped:!1}),g=new r.Mesh(a,h);g.frustumCulled=!1,g.renderOrder=7,g.name=`tracers`,e.scene.add(g);let _=new Float32Array(u*3),C=new Float32Array(u),w=new Float32Array(u),T=new Float32Array(u),E=new r.BufferGeometry,D=new r.BufferAttribute(_,3),O=new r.BufferAttribute(C,1),k=new r.BufferAttribute(w,1),A=new r.BufferAttribute(T,1);for(let e of[D,O,k,A])e.setUsage(r.DynamicDrawUsage);E.setAttribute(`position`,D),E.setAttribute(`aE`,O),E.setAttribute(`aS`,k),E.setAttribute(`aW`,A),E.setDrawRange(0,0);let j=new r.ShaderMaterial({glslVersion:r.GLSL3,vertexShader:b,fragmentShader:x,uniforms:{uPx:{value:900},uMinPx:{value:o.MIN_PX},uCap:{value:o.LCAP},uBias:{value:.8},uMaxPx:{value:o.MAX_PX}},transparent:!0,depthWrite:!1,depthTest:!0,blending:r.CustomBlending,blendEquation:r.AddEquation,blendSrc:r.OneFactor,blendDst:r.OneFactor,blendSrcAlpha:r.ZeroFactor,blendDstAlpha:r.OneFactor,fog:!1,toneMapped:!1}),M=new r.Points(E,j);M.frustumCulled=!1,M.renderOrder=7,M.name=`tracer-glints`,e.scene.add(M),S={THREE:r,quad:i,g:a,T:c,H:l,aT:p,aH:m,material:h,mesh:g,gg:E,gpos:D,ge:O,gs:k,gw:A,GP:_,GE:C,GS:w,GW:T,gmat:j,gmesh:M,gcand:[],v2:new r.Vector2,cand:[],fake:null,specs:new Map,stats:{n:0,cand:0,ms:0,avg:0,glints:0}},window.__tracers=()=>S}function k(){let e=(e,t,n,r,i)=>({k:`hold`,a:0,b:68400,post:Array.from({length:e},(r,i)=>[t+(i-(e-1)/2)*2.2,n+i%2*1.2]),face:r,st:`kneel`,cov:`wall`,fire:i}),t={version:1,id:`fx-fake`,title_en:`FX test (fake)`,t0:`1937-12-12T08:00:00+08:00`,t1:`1937-12-13T03:00:00+08:00`,seed:1,bounds:[-700,3900,0,5600],replaces:[],units:[],squads:[{id:`cn-fx-hmg`,unit:`cn`,side:`cn_army`,n:4,w:`hmg`,legs:[e(4,-340,4300,[0,1],[[0,68400,-330,4750,260,`jp-fx-lmg`]])],out:[]},{id:`cn-fx-hmg2`,unit:`cn`,side:`cn_army`,n:4,w:`hmg`,legs:[e(4,-260,4310,[0,1],[[0,68400,-300,4755,260,`jp-fx-lmg2`]])],out:[]},{id:`jp-fx-lmg`,unit:`jp`,side:`jp_army`,n:10,w:`lmg`,legs:[e(10,-330,4750,[0,-1],[[0,68400,-340,4300,150,`cn-fx-hmg`]])],out:[]},{id:`jp-fx-lmg2`,unit:`jp`,side:`jp_army`,n:10,w:`lmg`,legs:[e(10,-300,4755,[0,-1],[[0,68400,-260,4310,150,`cn-fx-hmg2`]])],out:[]},{id:`jp-fx-lmg3`,unit:`jp`,side:`jp_army`,n:10,w:`lmg`,legs:[e(10,-380,4745,[0,-1],[[0,68400,-372,3990,150,`wall`]])],out:[]},{id:`cn-fx-rifle`,unit:`cn`,side:`cn_army`,n:10,w:`rifle`,legs:[e(10,-300,4305,[0,1],[[0,68400,-320,4750,5,`jp-fx-lmg`]])],out:[]}],guns:[{id:`jp-fx-g1`,unit:`jp`,side:`jp_army`,kind:`gun`,x:-420,z:5400,face:[0,-1],crew:6,a:0,b:68400,missions:[[0,68400,-340,4300,35,10,3.6]]},{id:`jp-fx-g2`,unit:`jp`,side:`jp_army`,kind:`gun`,x:-380,z:5300,face:[0,-1],crew:6,a:0,b:68400,missions:[[0,68400,-372,3984,14,10,3.6]]}],vehicles:[],marks:[],check:{}};return i(t)}function A(e,t){let n=j()===`real`;if(S.fake&&S.fake._real!==n&&(S.fake=null),!S.fake&&(S.fake={on:!0,_fake:!0,_real:n,bakes:n?[]:[k()],events:r,rate:0,seconds:t=>(e.date.getTime()-t._.t0ms)/1e3},n)){let e=S.fake;fetch(`nanjing/bsim/bs-1212-zhonghua.json`,{cache:`no-store`}).then(e=>e.ok?e.json():null).then(t=>{t&&S?.fake===e&&(t.id=`fx-fake`,e.bakes=[i(t)])}).catch(e=>console.warn(`tracers: real bake for the fake not loaded`,e))}return S.fake.rate=t>0?Math.abs(e.simDt||0)/t:0,S.fake}function j(){try{return localStorage.njFxFake}catch{return null}}function M(){let e=j();return e===`1`||e===`real`}function N(e,t){if(!S)return;let n=performance.now(),r=e.bsim?.on&&e.bsim.bakes?.length?e.bsim:null;if(M()){let n=A(e,t);e.bsimFx=n.bakes.length?r?{on:!0,_fake:!0,events:r.events,rate:r.rate??n.rate,bakes:[...r.bakes,...n.bakes],seconds:e=>e.id===`fx-fake`?n.seconds(e):r.seconds(e)}:n:r??void 0}else e.bsimFx=void 0,S.fake=null;let i=e.bsimFx??r,a=0;i&&i.on&&i.bakes?.length&&(a=I(e,i)),S.g.instanceCount=a,S.aT.clearUpdateRanges(),S.aT.addUpdateRange(0,Math.max(4,a*4)),S.aT.needsUpdate=!0,S.aH.clearUpdateRanges(),S.aH.addUpdateRange(0,Math.max(4,a*4)),S.aH.needsUpdate=!0,e.renderer.getDrawingBufferSize(S.v2);let s=S.v2.y/(2*Math.tan(S.THREE.MathUtils.degToRad(e.camera.fov)/2));S.material.uniforms.uPx.value=s;let c=Math.max(0,Math.min(1,e.env?.daylight??0));S.material.uniforms.uJ.value=o.TRACER_J*o.dayGain(c);let l=S.gcand,d=Math.min(l.length,u);l.length>u&&l.sort((e,t)=>e.d-t.d);for(let e=0;e<d;e++){let t=l[e];S.GP[e*3]=t.x,S.GP[e*3+1]=t.y,S.GP[e*3+2]=t.z,S.GE[e]=t.e,S.GS[e]=t.s,S.GW[e]=t.w}S.gg.setDrawRange(0,d);for(let e of[S.gpos,S.ge,S.gs,S.gw])e.clearUpdateRanges(),e.addUpdateRange(0,Math.max(3,d*e.itemSize)),e.needsUpdate=!0;S.gmat.uniforms.uPx.value=s,S.gmat.uniforms.uCap.value=o.LCAP,S.stats.glints=d;let f=performance.now()-n,p=S.stats;p.n=a,p.ms=+f.toFixed(3),p.avg=+(p.avg+(f-p.avg)/30).toFixed(3)}function P(e,t,n,r,i){let a=(t,n)=>e.streamer.ground(t,n),o=window.__fire?.()?.wallAt,s=o?o(t.x,t.z):null,u=o?o(t.tx,t.tz):null,d=t.x,f=t.z,m=t.y??a(d,f)+(s&&s.d<5?s.h:0)+(t.h??1.2),h=t.tx,g=t.tz,v=t.ty??a(h,g)+(u&&u.d<5?u.h+.8:u&&u.d<14?.35*u.h:t.impact===`wall`?2:.3),y=h-d,b=v-m,x=g-f,S=Math.hypot(y,b,x),C=t.tof>0?t.tof:S/740,w=S/C,T=Math.min(l,Math.max(c,w/60));if(n<0)return!1;let D=e=>{let t=e*C;return[d+y*e,m+b*e+.5*_*t*(C-t),f+x*e]};if(n<=C){let e=n/C,t=Math.max(0,e-T/S),r=D(e),a=D(t);return i.hx=r[0],i.hy=r[1],i.hz=r[2],i.tx=a[0],i.ty=a[1],i.tz=a[2],i.e=1,i.head=1,i.mid=(e+t)*.5*S,!0}if(t.impact===`none`||t.imp===`water`||E(r,1,7)>=p*(t.imp===`masonry`||t.imp===`wall`?1.6:1))return!1;let O=w*(.3+.15*E(r,2,7)),k=(30+90*E(r,3,7))/O,A=n-C;if(A>k)return!1;let j=Math.hypot(y,x)||1,M=(E(r,4,7)-.5)*1.2,N=(8+27*E(r,5,7))*Math.PI/180,P=Math.cos(M),F=Math.sin(M),I=y/j*P-x/j*F,L=y/j*F+x/j*P,R=Math.cos(N),z=Math.sin(N),B=e=>[h+I*R*O*e,v+z*O*e-.5*_*e*e,g+L*R*O*e],V=Math.min(T*.4,O/30),H=B(A),U=B(Math.max(0,A-V/O));return i.hx=H[0],i.hy=H[1],i.hz=H[2],i.tx=U[0],i.ty=U[1],i.tz=U[2],i.e=.55*(1-A/k),i.head=.6,i.mid=S,!0}function F(e,t){let n=e.id+`|`+t.src,r=S.specs.get(n);if(!r){let i=t.w===`gun`?e._.byId?.get(t.src):null;r=o.flashSpec(t.w,i?.type),S.specs.set(n,r)}return r}function I(e,t){let r=e.camera.position,i=Math.abs(t.rate||0),a=i>m?i/m:1,c=1/a,l=S.cand;l.length=0;let u=S.gcand;u.length=0;let d=Math.max(0,Math.min(1,e.env?.daylight??0)),f=T(`tracers`),p=T(`glints`)||i>m,_=(t,n)=>e.streamer.ground(t,n),v=window.__fire?.()?.wallAt,y={};for(let i of t.bakes){if(!i?._)continue;let s=t.seconds(i);if(!(s>=0&&s<=i._.span+5))continue;let m=((n?.hmg?.range??1e3)/(n?.hmg?.v??740)+.6)*a,b=D(i.id||`b`),x=t=>{if(!p&&s-t.t>=0){let e=F(i,t);if(s-t.t<e.show){let n=Math.hypot(t.x-r.x,t.z-r.z);if(n>200&&n<3e3){let r=v?v(t.x,t.z):null,i=Number.isFinite(t.y)?t.y:_(t.x,t.z)+(r&&r.d<5?r.h:0)+(t.h??1.2);u.push({x:t.x,y:i,z:t.z,e:o.flashIntensity(e,s-t.t,d),s:e.size,w:0,d:n})}}}if(!t.tracer||f)return;let n=Math.hypot(t.x-r.x,t.z-r.z),c=Math.hypot(t.tx-r.x,t.tz-r.z);if(n>g&&c>g)return;let m=D(t.src)^Math.imul(t.k+1,40503)^Math.floor(t.t*1e3)|0;if(!P(e,t,(s-t.t)/a,m,y))return;let h=(y.hx+y.tx)*.5,b=(y.hy+y.ty)*.5,x=(y.hz+y.tz)*.5;l.push({d:Math.hypot(h-r.x,b-r.y,x-r.z),hx:y.hx,hy:y.hy,hz:y.hz,tx:y.tx,ty:y.ty,tz:y.tz,e:y.e,head:y.head})};if(a===1)t.events.shotsBetween(i,s-m,s+1e-6,x);else{let e=Math.floor((s-m)/h),n=Math.floor(s/h);for(let r=e;r<=n;r++)E(r,b,3)<c&&t.events.shotsBetween(i,r*h,(r+1)*h,x)}}S.stats.cand=l.length,l.length>s&&(l.sort((e,t)=>e.d-t.d),l.length=s);let b=S.T,x=S.H;for(let e=0;e<l.length;e++){let t=l[e],n=e*4;b[n]=t.tx,b[n+1]=t.ty,b[n+2]=t.tz,b[n+3]=t.e,x[n]=t.hx,x[n+1]=t.hy,x[n+2]=t.hz,x[n+3]=t.head}return l.length}function L(e){S&&=(e.bsimFx=void 0,e.scene.remove(S.mesh),e.scene.remove(S.gmesh),S.gg.dispose(),S.gmat.dispose(),S.g.dispose(),S.quad.dispose(),S.material.dispose(),null)}export{L as dispose,O as install,a as tracers_exports,N as update};