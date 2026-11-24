import{Box3 as e,BufferAttribute as t,Color as n,IcosahedronGeometry as r,InstancedBufferAttribute as i,InstancedMesh as a,Matrix4 as o,MeshStandardMaterial as s,SRGBColorSpace as c,Sphere as l,Vector3 as u}from"../../../node_modules/three/build/three.core.js";import{mergeGeometries as d}from"../../../node_modules/three/examples/jsm/utils/BufferGeometryUtils.js";import{AIR_LIGHT as f}from"../../atmosphere.js";var p=`varying vec3 vNjClipW;
`,m=`{ vec4 njw = vec4(transformed, 1.0);
#ifdef USE_BATCHING
  njw = batchingMatrix * njw;
#endif
#ifdef USE_INSTANCING
  njw = instanceMatrix * njw;
#endif
  vNjClipW = (modelMatrix * njw).xyz; }
`,h=`varying vec3 vNjClipW;
uniform mat4 uNjClip;
uniform vec3 uNjClipHalf;
`,g=`{ vec3 njq = (uNjClip * vec4(vNjClipW, 1.0)).xyz; if (abs(njq.x) < uNjClipHalf.x && abs(njq.z) < uNjClipHalf.z && njq.y < uNjClipHalf.y) discard; }
`,_=`
  {
    vec2 sOuv = (vWPos.xz - uOrthoRect.xy) / uOrthoRect.zw;
    if (uSummer > 0.0 && uFixedLayer >= 0.0 && uGroundClassOn > 0.0 && sOuv.x > 0.0 && sOuv.x < 1.0 && sOuv.y > 0.0 && sOuv.y < 1.0) {
      float sc = floor(texture2D(uGroundClass, vec2(sOuv.x, 1.0 - sOuv.y)).r * 255.0 + 0.5);
      vec3 g = vec3(0.0); float w = 0.0;
      if (sc > 0.5 && sc < 1.5 || (sc > 19.5 && sc < 20.5)) { g = vec3(0.075, 0.150, 0.032); w = 1.0; }      // rice in August: tall, a fresh deep green
      else if (sc > 1.5 && sc < 2.5) { g = vec3(0.085, 0.135, 0.040); w = 0.95; }                           // dry field: beans, sweet potato, sesame
      else if (sc > 2.5 && sc < 3.5) { g = vec3(0.070, 0.125, 0.038); w = 0.9; }                            // vegetable beds
      else if (sc > 5.5 && sc < 6.5) { g = vec3(0.032, 0.068, 0.022); w = 1.0; }                            // wood
      else if (sc > 6.5 && sc < 7.5) { g = vec3(0.085, 0.130, 0.045); w = 0.9; }                            // grass, fallow
      else if (sc > 8.5 && sc < 9.5) { g = vec3(0.090, 0.140, 0.050); w = 0.9; }                            // reeds, green in summer
      else if (sc > 16.5 && sc < 17.5) { g = vec3(0.090, 0.130, 0.050); w = 0.7; }                          // bunds: grass on them
      if (w > 0.0) {
        // keep the photo's own light and dark (the plots, the texture), its hue taken to the summer green
        float l = dot(diffuseColor.rgb, vec3(0.2126, 0.7152, 0.0722)), lg = dot(g, vec3(0.2126, 0.7152, 0.0722));
        vec3 s = g * clamp(l / 0.11, 0.55, 1.5);
        diffuseColor.rgb = mix(diffuseColor.rgb, s, w * uSummer);
      }
    }
  }
`,v=`#include <project_vertex>
{ vec4 lw = vec4(transformed, 1.0);
#ifdef USE_INSTANCING
  lw = instanceMatrix * lw;
#endif
  vLeafW = (modelMatrix * lw).xyz; }
`,y=`#include <common>
varying vec3 vLeafW;
`,b=`#include <common>
varying vec3 vLeafW;
float lh(vec3 p) { p = fract(p * 0.1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y) * p.z); }
`,x=`#include <normal_fragment_maps>
{ vec3 q = floor(vLeafW * 7.0); vec3 j = vec3(lh(q), lh(q + 17.1), lh(q + 41.3)) - 0.5; normal = normalize(normal + j * 1.1); diffuseColor.rgb *= 0.78 + 0.44 * lh(q + 5.7); }
`;function S(S,C){let{scene:w,materials:T,shared:E}=S,D={uNjClip:{value:new o},uNjClipHalf:{value:new u(30.4,25,11.2)}},O=new Map,k=new Set;C.group.traverse(e=>k.add(e));function A(e){if(O.has(e)||e.isShaderMaterial||e.isRawShaderMaterial)return;let t=e.onBeforeCompile,n=e.customProgramCacheKey;e.onBeforeCompile=function(e,n){t?.call(this,e,n),e.vertexShader.includes(`#include <project_vertex>`)&&/void\s+main\s*\(\s*\)\s*\{/.test(e.fragmentShader)&&(e.uniforms.uNjClip=D.uNjClip,e.uniforms.uNjClipHalf=D.uNjClipHalf,e.vertexShader=p+e.vertexShader.replace(`#include <project_vertex>`,m+`#include <project_vertex>`),e.fragmentShader=h+e.fragmentShader.replace(/void\s+main\s*\(\s*\)\s*\{/,e=>e+`
`+g))},e.customProgramCacheKey=function(){return(n?n.call(this):``)+`|aug14clip`},e.needsUpdate=!0,O.set(e,{obc:t,key:n})}new e,new l;function j(){C.group.updateMatrixWorld(!0),D.uNjClip.value.copy(C.group.matrixWorld).invert(),C.group.position;for(let e of w.children)/^tile /.test(e.name)&&e.traverse(e=>{if(!(!e.isMesh||e.userData.ground||k.has(e)))for(let t of Array.isArray(e.material)?e.material:[e.material])A(t)})}j();let M={value:1},N=T.terrain,P=N.onBeforeCompile,F=N.customProgramCacheKey;N.onBeforeCompile=function(e,t){P?.call(this,e,t),e.uniforms.uSummer=M,e.fragmentShader.includes(`#include <roughnessmap_fragment>`)&&(e.fragmentShader=e.fragmentShader.replace(`#include <common>`,`#include <common>
uniform float uSummer;`).replace(`#include <roughnessmap_fragment>`,_+`#include <roughnessmap_fragment>`))},N.customProgramCacheKey=function(){return(F?F.call(this):``)+`|aug14summer`},N.needsUpdate=!0;let I=[],L=/^(warprops|bsim|battle|tracer|nj-battle|fire-|dust-|people-standin|marks_flags|sandbag|troop)/i;function R(){for(let e of w.children)if(L.test(e.name)&&!I.some(t=>t.o===e)){let t=[];e.traverse(e=>{t.push([e,e.layers.mask]),e.layers.set(30)}),I.push({o:e,kept:t})}}R();let z=S.people,B=z?z.enabled:void 0;z&&`enabled`in z&&(z.enabled=!1);let V=S.props,H=V.trees??[],U=new Map;H.forEach((e,t)=>{e.def?.bare&&e.branchMat&&U.set(e.branchMat,e)});let W=new s({roughness:.85,metalness:0,vertexColors:!0});W.onBeforeCompile=e=>{e.vertexShader=e.vertexShader.replace(`#include <common>`,y).replace(`#include <project_vertex>`,v),e.fragmentShader=e.fragmentShader.replace(`#include <common>`,b).replace(`#include <normal_fragment_maps>`,x)},W.customProgramCacheKey=()=>`aug14-crown`;let G=(()=>{let e=[];for(let[t,n,i,a]of[[0,.72,0,.3],[.17,.62,.08,.22],[-.16,.6,-.06,.22],[.05,.6,-.18,.21],[-.06,.63,.18,.21],[.02,.88,.03,.2],[0,.48,0,.2]]){let o=new r(a,1);o.translate(t,n,i),e.push(o)}let n=d(e.map(e=>e.toNonIndexed())),i=n.attributes.position,a=new Float32Array(i.count*3);for(let e=0;e<i.count;e++){let t=i.getY(e),n=Math.hypot(i.getX(e),i.getZ(e)),r=.55+.45*Math.min(1,(t-.35)/.6)*(.6+.4*Math.min(1,n/.35));a[e*3]=r,a[e*3+1]=r,a[e*3+2]=r}return n.setAttribute(`color`,new t(a,3)),n.computeVertexNormals(),n})(),K=e=>new n().setRGB(.16+.05*e,.27+.06*e,.09+.03*e,c),q=[],J=[],Y=new WeakSet;function X(){for(let e of w.children)/^tile /.test(e.name)&&!Y.has(e)&&(Y.add(e),e.traverse(e=>{if(!e.isInstancedMesh)return;let t=U.get(e.material);if(t){let n=G.clone(),r=(t.radius??1.5)*1.75*(t.def.crown??.85)*1.15;n.scale(r,t.height??t.def.height??8,r);let o=new a(n,W,e.count);o.instanceMatrix.array.set(e.instanceMatrix.array.subarray(0,e.count*16));let s=new Float32Array(e.count*3);for(let t=0;t<e.count;t++)K(t*.6180339%1).toArray(s,t*3);o.instanceColor=new i(s,3),o.castShadow=!0,o.receiveShadow=!0,o.name=`aug14-crown`,o.computeBoundingSphere(),e.parent.add(o),q.push(o)}else if(e.geometry===V.far?.bareFar){J.push({o:e,geo:e.geometry,mat:e.material,col:e.instanceColor}),e.geometry=V.far.round,e.material=V.mats.far;let t=new Float32Array(e.count*3);for(let n=0;n<e.count;n++)K(n*.6180339%1).toArray(t,n*3);e.instanceColor=new i(t,3)}}))}X();let Z=f.extra;f.extra=Z*.45;let Q=0;return{reclip:j,frame(){++Q%30==0&&(j(),R(),X())},disable(){for(let[e,{obc:t,key:n}]of O)e.onBeforeCompile=t,n?e.customProgramCacheKey=n:delete e.customProgramCacheKey,e.needsUpdate=!0;O.clear(),N.onBeforeCompile=P,F?N.customProgramCacheKey=F:delete N.customProgramCacheKey,N.needsUpdate=!0;for(let{kept:e}of I)for(let[t,n]of e)t.layers.mask=n;I.length=0,z&&B!==void 0&&(z.enabled=B);for(let e of q)e.parent?.remove(e),e.geometry.dispose(),e.dispose?.();for(let e of J)e.o.geometry=e.geo,e.o.material=e.mat,e.o.instanceColor=e.col;W.dispose(),G.dispose(),f.extra=Z}}}export{S as enableSummer};