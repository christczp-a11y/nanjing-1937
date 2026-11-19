const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["../bridges/forms.js","../bridges/geo.js","../bridges/deck.js","../bridges/table.js"])))=>i.map(i=>d[i]);
import{__exportAll as e}from"../../../_virtual/_rolldown/runtime.js";import{lampMaterial as t,lampScene as n,lampUniforms as r}from"../../lamplight.js";import{Geo as i}from"../bridges/geo.js";import{__vitePreload as a}from"../../../_virtual/_vite/preload-helper.js";var o=e({dispose:()=>g,install:()=>p,stats:()=>_,update:()=>h}),s=360,c=2200,l=null;function u(e){let t=new e.MeshStandardMaterial({vertexColors:!0,roughness:.92,metalness:0,side:e.DoubleSide});return t.onBeforeCompile=e=>{r(e),e.vertexShader=e.vertexShader.replace(`#include <common>`,`#include <common>
attribute vec4 aInfo;
varying vec4 vInfo;
varying vec3 vBP;
varying vec3 vBN;`).replace(`#include <begin_vertex>`,`#include <begin_vertex>
vInfo = aInfo;
vBP = (modelMatrix * vec4(transformed, 1.0)).xyz;
vBN = normalize(mat3(modelMatrix) * objectNormal);`),e.fragmentShader=e.fragmentShader.replace(`#include <common>`,`#include <common>
        varying vec4 vInfo;
        varying vec3 vBP;
        varying vec3 vBN;
        float brHash(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }`).replace(`#include <color_fragment>`,`#include <color_fragment>
        {
          // info: (road axis x, z, material, water level). material 0 stone, 1 timber, 2 concrete, 3 plain, 4 steel.
          vec3 an = abs(vBN);
          float mat = vInfo.z, wy = vBP.y - vInfo.w;
          vec2 ax = vInfo.xy, pl = vec2(dot(vBP.xz, ax), dot(vBP.xz, vec2(-ax.y, ax.x)));
          // (derivatives outside any branch)
          vec2 stq = (an.y > 0.7 ? vBP.xz : (an.x > an.z ? vBP.zy : vBP.xy)) / vec2(0.9, 0.42);
          stq.x += 0.5 * mod(floor(stq.y), 2.0);
          vec2 stw = fwidth(stq);
          float plq = pl.x / 0.17, plw = fwidth(plq);
          float cq = vBP.y / 0.9, cw = fwidth(cq);
          float fineStone = 1.0 - smoothstep(0.25, 0.8, max(stw.x, stw.y));
          float finePlank = 1.0 - smoothstep(0.3, 0.9, plw);
          float fineConc = 1.0 - smoothstep(0.3, 0.9, cw);
          if (mat < 0.5) {
            // dressed stone in courses (0.42 m high, 0.9 m long, joints offset): seen up close only
            vec2 f = fract(stq);
            float jm = min(min(f.x, 1.0 - f.x) * 0.9, min(f.y, 1.0 - f.y) * 0.42);
            float joint = 1.0 - smoothstep(0.012, 0.03, jm);
            float block = 0.9 + 0.18 * brHash(floor(stq) + floor(vBN.xz * 3.0));
            diffuseColor.rgb *= mix(1.0, block * (1.0 - 0.32 * joint), fineStone);
          } else if (mat < 1.5) {
            if (an.y > 0.7) {
              // deck planks across the road (0.17 m boards, their own tone, a dark gap)
              float f = fract(plq);
              float gp = 1.0 - smoothstep(0.02, 0.07, min(f, 1.0 - f));
              float board = 0.84 + 0.26 * brHash(vec2(floor(plq), floor(pl.y / 2.4)));
              diffuseColor.rgb *= mix(1.0, board * (1.0 - 0.5 * gp), finePlank);
            } else {
              float g = brHash(vec2(floor(vBP.y * 7.0), floor((pl.x + pl.y) * 1.3)));
              diffuseColor.rgb *= 0.88 + 0.24 * g;
            }
          } else if (mat < 2.5) {
            // board-marked concrete: a horizontal form joint every 0.9 m, weather stains
            float f = fract(cq);
            float jt = 1.0 - smoothstep(0.015, 0.04, min(f, 1.0 - f));
            float st = 0.9 + 0.2 * brHash(floor(vBP.xz * 0.7) + floor(vBP.y * 0.5));
            diffuseColor.rgb *= mix(1.0, st * (1.0 - 0.18 * jt * step(an.y, 0.7)), fineConc);
          }
          // the waterline: a dark wet band, then moss up to a metre and a half (推测: winter, so only a hint)
          if (mat < 3.5) {
            float wet = 1.0 - smoothstep(0.0, 0.45, wy);
            float moss = (1.0 - smoothstep(0.2, 1.5, wy)) * step(-1.0, wy);
            diffuseColor.rgb *= mix(1.0, 0.55, wet);
            diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(0.8, 1.06, 0.68), moss * 0.45);
          }
        }`)},t.customProgramCacheKey=()=>`nj-bridge-v2`,t}function d(e,t,n,r){let i=new e.BufferGeometry;i.setAttribute(`position`,new e.Float32BufferAttribute(t.p,3)),i.setAttribute(`normal`,new e.Float32BufferAttribute(t.n,3)),i.setAttribute(`color`,new e.Float32BufferAttribute(t.c,3)),i.setAttribute(`aInfo`,new e.Float32BufferAttribute(t.i,4)),i.computeBoundingSphere();let a=new e.Mesh(i,n);return a.name=r,a.castShadow=a.receiveShadow=!0,a.matrixAutoUpdate=!1,a.visible=!1,a}async function f(){try{let e=`ortho/nanjing1937/`,t=await fetch(`${e}water_map.json`,{cache:`no-store`}).then(e=>e.ok?e.json():null);if(!t)return null;let n=await fetch(`${e}water_map.png`,{cache:`no-store`}).then(e=>e.ok?e.blob():null);if(!n)return null;let r=await createImageBitmap(n,{colorSpaceConversion:`none`,premultiplyAlpha:`none`}),i=(typeof OffscreenCanvas<`u`?new OffscreenCanvas(r.width,r.height):Object.assign(document.createElement(`canvas`),{width:r.width,height:r.height})).getContext(`2d`,{willReadFrequently:!0});i.drawImage(r,0,0);let a=i.getImageData(0,0,r.width,r.height).data,o=r.width,s=r.height,c=new Uint8Array(o*s);for(let e=0;e<o*s;e++)c[e]=a[e*4+1];return r.close?.(),{x0:t.x0,z0:t.z0,step:t.step,w:o,h:s,at:(e,n)=>{let r=Math.round((e-t.x0)/t.step),i=Math.round((n-t.z0)/t.step);return r<0||i<0||r>=o||i>=s?-1:c[i*o+r]}}}catch(e){return console.warn(`bridges: water map not read`,e),null}}async function p(e){if(new URLSearchParams(location.search).get(`bridges`)===`0`)return;let{THREE:r}=e,o=Date.now(),s=performance.now(),c,p;try{[c,p]=await Promise.all([a(()=>import(`/src/world/nanjing/bridges/forms.js?t=${o}`),[],import.meta.url),a(()=>import(`/src/world/nanjing/bridges/table.js?t=${o}`),[],import.meta.url)])}catch(e){console.warn(`bridges: helper re-import failed, using the bundled ones`,e),[c,p]=await Promise.all([a(()=>import(`../bridges/forms.js`),__vite__mapDeps([0,1,2]),import.meta.url),a(()=>import(`../bridges/table.js`),__vite__mapDeps([3,1,2]),import.meta.url)])}let m=e=>fetch(e,{cache:`no-store`}).then(e=>e.ok?e.json():null).catch(()=>null),[g,_]=await Promise.all([m(`/nanjing/bridges.json`),m(`/nanjing/bridges_forms.json`)]);if(!g?.bridges?.length){console.warn(`bridges: no /nanjing/bridges.json`);return}let v=(t,n)=>e.streamer.ground(t,n),y=p.resolveAll(g.bridges,_??{},v),b=y.warnings,x=y.list;for(let e of b)console.warn(`bridges:`,e);let S=performance.now(),C=await f(),w=[],T=performance.now()-S;if(C&&_?.dropDry!==!1){let e=x;x=x.filter(e=>{if(e.addition||e.form.keepDry||e.rec.fallback)return!0;let t=e.rec,n=-t.uz,r=t.ux,i=t.span??10,a=0,o=0,s=0;for(let e=-.4*i;e<=.4*i+1e-6;e+=Math.max(1,i/16)){let i=C.at(t.x+n*e,t.z+r*e);a++,i<0?s++:i>0&&o++}return s>0||o>=.5*a||(w.push({id:t.id,x:Math.round(t.x),z:Math.round(t.z),span:t.span,name:e.form.name_zh??null,wet:+(o/a).toFixed(2)}),!1)}),w.length>.12*e.length?(console.warn(`bridges: the water map disagrees with`,w.length,`of`,e.length,`records (stale map?): none dropped`),x=e,w.length=0):w.length&&console.warn(`bridges: no water under`,w.length,`records, not drawn:`,w.map(e=>e.id).join(` `))}e.shared.bridgesDry=w,e.shared.bridgeRecords=x.filter(e=>!e.addition).map(e=>({...e.rec,kind:e.form.klass??e.rec.kind,arches:e.form.arches??e.rec.arches,deck:e.form.exactDeck&&e.form.deck!=null?e.form.deck:Math.min(e.rec.deck??5,e.form.deck??e.rec.deck??5)}));let E=e.manifest.tileSize??256,D=(e,t)=>`${Math.floor(e/E)}_${Math.floor(t/E)}`,O=u(r),k=new Map,A=[],j=e=>`${e.from??``}|${e.until??``}`,M=p.clipsOf(x,v);x.forEach((e,t)=>{let n=p.seedAt(e.rec.x,e.rec.z),r=M[t];for(let t of e.states){let a=`${D(e.rec.x,e.rec.z)}#${j(t)}#${JSON.stringify(t.state)}`,o=k.get(a);o||k.set(a,o={key:a,items:[],tiles:new Set([D(e.rec.x,e.rec.z)]),from:t.from,until:t.until,lo:null,hi:null,useHi:!1,geoLo:new i,cx:0,cz:0,rad:0});try{let i=c.buildBridge(e.rec,e.form,v,o.geoLo,{lod:0,seed:n,state:t.state,clip:r});o.items.push({e,seed:n,state:t.state,r:i,clip:r});for(let t of[-i.sL,i.sR])o.tiles.add(D(e.rec.x-e.rec.uz*t,e.rec.z+e.rec.ux*t));A.push({...i,state:t.id,name:e.form.name_zh})}catch(t){console.warn(`bridges: skipped`,e.rec.id,t)}}});let N=0;for(let t of k.values()){if(!t.geoLo.p.length){k.delete(t.key);continue}let n=0,i=0;for(let e of t.items)n+=e.e.rec.x,i+=e.e.rec.z;t.cx=n/t.items.length,t.cz=i/t.items.length,t.rad=Math.max(...t.items.map(e=>Math.hypot(e.e.rec.x-t.cx,e.e.rec.z-t.cz)+(e.r.sL+e.r.sR)/2)),t.lo=d(r,t.geoLo,O,`bridges-lo`),N+=t.geoLo.tris,t.geoLo=null,t.tiles=[...t.tiles],e.scene.add(t.lo)}let P=[...k.values()].flatMap(e=>e.items.flatMap(e=>e.r.lamps??[])),F=null,I=[];if(P.length){let e=new Uint8Array(16384),i=2.6,a=(1+i**2)**-1.5;for(let t=0;t<64;t++)for(let n=0;n<64;n++){let r=Math.hypot(n+.5-32,t+.5-32)/32,o=r>=1?0:Math.max(0,((1+(i*r)**2)**-1.5-a)/(1-a));e.set([o*255,o*255,o*255,255],(t*64+n)*4)}let o=new r.DataTexture(e,64,64);o.magFilter=o.minFilter=r.LinearFilter,o.needsUpdate=!0;let s=new r.PlaneGeometry(1,1).rotateX(-Math.PI/2),c=t(o);F=new r.InstancedMesh(s,c,P.length),F.frustumCulled=!1,F.layers.set(2);let l=new r.Matrix4,u=new r.Quaternion,d=new r.Vector3,f=new r.Vector3(14,1,14),p=new r.Color(.85,.6,.3);P.forEach((e,t)=>{l.compose(d.set(e[0],e[1]-3.8,e[2]),u,f),F.setMatrixAt(t,l),F.setColorAt(t,p)}),F.instanceMatrix.needsUpdate=!0,F.instanceColor&&(F.instanceColor.needsUpdate=!0),n.add(F),I=[o,s,c]}{let t=new Map;for(let e of k.values())for(let n of e.items)for(let e of n.r.piers??[])t.set(`${n.e.rec.id}:${e.x}:${e.z}`,{id:n.e.rec.id,x:e.x,z:e.z,len:e.len,wid:2*n.r.halfWidth,rx:n.r.axis[0],rz:n.r.axis[1],water:n.r.water});e.shared.bridgePiers=[...t.values()]}l={THREE:r,ctx:e,F:c,ground:v,groups:[...k.values()],material:O,built:A,trisLo:N,trisHi:0,warnings:b,table:_,stats:null,lampMesh:F,lampDisp:I},l.stats=()=>({bridges:A.length,groups:l.groups.length,trisLo:N,trisHi:l.trisHi,shownHi:l.groups.filter(e=>e.hi?.visible).length,shown:l.groups.filter(e=>e.lo.visible||e.hi?.visible).length,warnings:l.warnings.length}),h(e),console.log(`bridges: installed`,JSON.stringify(l.stats()),`${(performance.now()-s).toFixed(0)} ms (water map ${T.toFixed(0)} ms)`)}function m(e){let t=new i;for(let n of e.items)try{l.F.buildBridge(n.e.rec,n.e.form,l.ground,t,{lod:1,seed:n.seed,state:n.state,clip:n.clip})}catch(e){console.warn(`bridges: hi skipped`,n.e.rec.id,e)}e.hi=t.p.length?d(l.THREE,t,l.material,`bridges-hi`):null,e.hi&&(l.ctx.scene.add(e.hi),l.trisHi+=t.tris),e.hiBuilt=!0}function h(e){if(!l)return;let t=e.streamer.tiles,n=e.date?.getTime?.()??0,r=e.camera.position;for(let i of l.groups){if(!((i.from==null||n>=i.from)&&(i.until==null||n<i.until)&&i.tiles.every(e=>t.get(e)?.state===`ready`))){i.lo.visible=!1,i.hi&&(i.hi.visible=!1);continue}let a=Math.hypot(r.x-i.cx,r.z-i.cz)-i.rad;i.useHi=a<s,i.hi&&!i.useHi&&a>c&&(e.scene.remove(i.hi),i.hi.geometry.dispose(),l.trisHi-=i.hi.geometry.attributes.position.count/3,i.hi=null,i.hiBuilt=!1),i.useHi&&!i.hiBuilt&&m(i);let o=i.useHi&&i.hi;i.lo.visible=!o,i.hi&&(i.hi.visible=!!o)}}function g(e){if(l){for(let t of l.groups)for(let n of[t.lo,t.hi])n&&(e.scene.remove(n),n.geometry.dispose());if(l.material.dispose(),delete e.shared.bridgeRecords,delete e.shared.bridgePiers,delete e.shared.bridgesDry,l.lampMesh){n.remove(l.lampMesh),l.lampMesh.dispose?.();for(let e of l.lampDisp)e.dispose?.()}l=null}}var _=()=>l&&{...l.stats(),built:l.built};export{o as bridges_exports,g as dispose,p as install,_ as stats,h as update};