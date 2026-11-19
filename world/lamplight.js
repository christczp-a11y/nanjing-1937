import{Color as e,DataTexture as t,HalfFloatType as n,LinearFilter as r,Material as i,MathUtils as a,MeshBasicMaterial as o,NearestFilter as s,OrthographicCamera as c,Scene as l,WebGLRenderTarget as u}from"../node_modules/three/build/three.core.js";import{ShaderChunk as d}from"../node_modules/three/build/three.module.js";import{shared as f}from"./materials.js";var p=new l;p.matrixWorldAutoUpdate=!1;var m=2048,h=200,g=1e3,_={value:0},v={value:null};function y(e,t={}){let n=new o({map:e,side:2,depthTest:!1,depthWrite:!1,transparent:!0,forceSinglePass:!0,blending:5,blendEquation:104,blendSrc:201,blendDst:201,...t});return n.onBeforeCompile=e=>{e.uniforms.uLampPass=_,e.uniforms.uLampHeights=v,e.vertexShader=e.vertexShader.replace(`#include <common>`,`#include <common>
varying float vLampY;`).replace(`#include <project_vertex>`,`#include <project_vertex>
        vec4 lampWorld = vec4(transformed, 1.0);
        #ifdef USE_INSTANCING
        lampWorld = instanceMatrix * lampWorld;
        #endif
        vLampY = (modelMatrix * lampWorld).y;`),e.fragmentShader=e.fragmentShader.replace(`#include <common>`,`#include <common>
varying float vLampY;
uniform float uLampPass;
uniform sampler2D uLampHeights;`).replace(`#include <opaque_fragment>`,`#include <opaque_fragment>
        float lampHeight = (vLampY + ${h}.0) / ${g}.0, lampLit = step(0.004, dot(gl_FragColor.rgb, vec3(1.0)));
        if (uLampPass < 0.5) gl_FragColor = vec4(lampHeight, 1.0 - lampHeight, 0.0, 0.0) * lampLit;
        else {
          // (only the lights of this half's level: within three metres of the highest, or of the lowest)
          vec2 known = texture2D(uLampHeights, (gl_FragCoord.xy - vec2(uLampPass > 1.5 ? ${m}.0 : 0.0, 0.0)) / ${m}.0).rg;
          float level = uLampPass > 1.5 ? 1.0 - known.g : known.r;
          float mine = lampLit * step(abs(lampHeight - level), 3.0 / ${g}.0);
          gl_FragColor = vec4(gl_FragColor.rgb * mine, lampHeight * mine);
        }`)},n.customProgramCacheKey=()=>`lamp-quad-v3`,n}function b(){d.lights_pars_begin+=`
uniform float uLampOn;
uniform sampler2D uLampMap;
uniform vec4 uLampRect; // centre x, centre z, half size, 0
`,d.lights_fragment_end+=`
if (uLampOn > 0.5) {
  mat3 lampToWorld = transpose(mat3(viewMatrix));
  vec3 lampAt = cameraPosition + lampToWorld * geometryPosition;
  vec2 lampUv = vec2(lampAt.x - uLampRect.x, uLampRect.y - lampAt.z) / (2.0 * uLampRect.z) + 0.5;
  vec2 lampEdge = smoothstep(vec2(0.0), vec2(0.04), lampUv) * (1.0 - smoothstep(vec2(0.96), vec2(1.0), lampUv));
  float lampUp = smoothstep(0.25, 0.7, (lampToWorld * geometryNormal).y);
  // only light lying at this height: from the map of the highest lights, or from that of the lowest
  vec4 lampHigh = texture2D(uLampMap, vec2(lampUv.x * 0.5, lampUv.y)), lampLow = texture2D(uLampMap, vec2(lampUv.x * 0.5 + 0.5, lampUv.y));
  float lampLevelHigh = 1.0 - smoothstep(2.5, 5.0, abs(lampAt.y - (lampHigh.a * ${g}.0 - ${h}.0)));
  float lampLevelLow = 1.0 - smoothstep(2.5, 5.0, abs(lampAt.y - (lampLow.a * ${g}.0 - ${h}.0)));
  vec3 lampLight = max(lampHigh.rgb * lampLevelHigh, lampLow.rgb * lampLevelLow);
  reflectedLight.directDiffuse += lampLight * lampEdge.x * lampEdge.y * lampUp * material.diffuseColor;
}
`,i.prototype.onBeforeCompile=function(e){x(e)}}function x(e){e.uniforms.uLampOn=f.uLampOn,e.uniforms.uLampMap=f.uLampMap,e.uniforms.uLampRect=f.uLampRect}var S=class{constructor(i){this.renderer=i,this.target=new u(2*m,m,{type:n,depthBuffer:!1,minFilter:r,magFilter:r}),this.camera=new c(-1,1,1,-1,1,4e3),this.camera.up.set(0,0,-1),this.camera.layers.set(2),this.half=0,this.black=new e(0,0,0),this.heights=new u(m,m,{type:n,depthBuffer:!1,minFilter:s,magFilter:s}),this.none=new t(new Uint8Array(4),1,1),this.none.needsUpdate=!0,v.value=this.none,f.uLampMap.value=this.target.texture}update(t,n,r){let i=p;if(f.uLampOn.value=+(r>.02),r<=.02)return;let o=a.clamp(n.distanceTo(t)*1.6,350,2400),s=350*1.35**Math.ceil(Math.log(o/350)/Math.log(1.35)),c=this.camera;s!==this.half&&(this.half=s,c.left=c.bottom=-s,c.right=c.top=s,c.updateProjectionMatrix());let l=2*s/m,u=Math.round(t.x/l)*l,d=Math.round(t.z/l)*l;c.position.set(u,t.y+2e3,d),c.lookAt(u,t.y,d),f.uLampRect.value.set(u,d,s,0);let h=this.renderer,g=h.shadowMap.autoUpdate,y=i.background,b=h.getRenderTarget(),x=h.getClearColor(new e),S=h.getClearAlpha();h.shadowMap.autoUpdate=!1,i.background=null,h.setClearColor(this.black,0),_.value=0,v.value=this.none,h.setRenderTarget(this.heights),h.clear(),h.render(i,c),v.value=this.heights.texture,this.target.viewport.set(0,0,2*m,m),h.setRenderTarget(this.target),h.clear();let C=h.autoClear;h.autoClear=!1;for(let e of[1,2])_.value=e,this.target.viewport.set((e-1)*m,0,m,m),h.setRenderTarget(this.target),h.render(i,c);this.target.viewport.set(0,0,2*m,m),h.autoClear=C,h.setRenderTarget(b),h.setClearColor(x,S),h.shadowMap.autoUpdate=g,i.background=y}};export{S as LampLight,b as installLampLight,y as lampMaterial,p as lampScene,x as lampUniforms};