import{BoxGeometry as e,Color as t,HalfFloatType as n,InstancedMesh as r,MathUtils as i,Matrix4 as a,Mesh as o,OrthographicCamera as s,PlaneGeometry as c,Scene as l,ShaderMaterial as u,Vector3 as d,Vector4 as f,WebGLRenderTarget as p}from"../node_modules/three/build/three.core.js";import{shared as m}from"./materials.js";var h=`
varying vec3 vW;
varying vec3 vN;
varying vec3 vC;
void main() {
  vec4 wp = vec4(position, 1.0);
  vec3 nn = normal;
  #ifdef USE_INSTANCING
    wp = instanceMatrix * wp;
    nn = mat3(instanceMatrix) * nn;
  #endif
  wp = modelMatrix * wp;
  vW = wp.xyz;
  vN = mat3(modelMatrix) * nn;
  vC = vec3(0.0);
  #if defined(USE_COLOR_ALPHA)
    vC = color.rgb;
  #elif defined(USE_COLOR)
    vC = color;
  #endif
  #ifdef USE_INSTANCING_COLOR
    vC = (vC.r + vC.g + vC.b) > 0.003 ? vC * instanceColor : instanceColor;
  #endif
  gl_Position = projectionMatrix * viewMatrix * wp;
}`,g=`
uniform sampler2D uOrtho, uNear, uFar;
uniform vec4 uOrthoRect, uNearRect, uFarRect;
uniform float uOrthoOn, uNearOn, uFarOn, uFog;
uniform vec3 uSunDir, uSun, uSky, uHaze;
varying vec3 vW;
varying vec3 vN;
varying vec3 vC;
bool inside(vec2 u) { return u.x > 0.0 && u.x < 1.0 && u.y > 0.0 && u.y < 1.0; }
void main() {
  vec3 n = dot(vN, vN) > 1e-6 ? normalize(vN) : vec3(0.0, 1.0, 0.0);
  if (!gl_FrontFacing) n = -n;
  vec3 alb = (vC.r + vC.g + vC.b) > 0.003 ? vC : vec3(0.40, 0.39, 0.37);
  if (n.y > 0.55) {
    vec2 ou = (vW.xz - uOrthoRect.xy) / uOrthoRect.zw, nu = (vW.xz - uNearRect.xy) / uNearRect.zw, fu = (vW.xz - uFarRect.xy) / uFarRect.zw;
    if (uOrthoOn > 0.5 && inside(ou)) alb = texture2D(uOrtho, vec2(ou.x, 1.0 - ou.y)).rgb;
    else if (uNearOn > 0.5 && inside(nu)) alb = texture2D(uNear, vec2(nu.x, 1.0 - nu.y)).rgb;
    else if (uFarOn > 0.5 && inside(fu)) alb = texture2D(uFar, vec2(fu.x, 1.0 - fu.y)).rgb;
  }
  vec3 col = alb * (uSun * max(dot(n, uSunDir), 0.0) + uSky * (0.55 + 0.45 * n.y));
  col = mix(col, uHaze, 1.0 - exp(-length(vW - cameraPosition) * uFog));
  gl_FragColor = vec4(col, 1.0);
}`,_=`
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,v=`
uniform sampler2D tPrev;
uniform float uAlpha;
uniform vec3 uHaze, uZenith;
uniform mat4 uInvProj, uCamWorld;
varying vec2 vUv;
vec3 filmic(vec3 x) { return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }
void main() {
  vec4 c = texture2D(tPrev, vUv);
  vec3 col = c.rgb;
  if (c.a < 0.5) {
    vec4 v = uInvProj * vec4(vUv * 2.0 - 1.0, 1.0, 1.0);
    vec3 dir = normalize(mat3(uCamWorld) * (v.xyz / v.w));
    col = mix(uHaze, uZenith, smoothstep(0.0, 0.45, dir.y));
  }
  gl_FragColor = vec4(filmic(col), uAlpha);
  #include <colorspace_fragment>
}`,y=class{constructor(e){this.renderer=e,this.backdrop=null,this.uniforms={uOrtho:m.uOrtho,uOrthoRect:m.uOrthoRect,uOrthoOn:m.uOrthoOn,uNear:{value:null},uNearRect:{value:new f(0,0,1,1)},uNearOn:{value:0},uFar:{value:null},uFarRect:{value:new f(0,0,1,1)},uFarOn:{value:0},uSunDir:{value:new d(0,1,0)},uSun:{value:new t},uSky:{value:new t},uHaze:{value:new t},uFog:{value:1/16e3}},this.material=new u({name:`preview`,vertexShader:h,fragmentShader:g,uniforms:this.uniforms,vertexColors:!0,side:2,toneMapped:!1}),this.target=new p(4,4,{type:n,samples:4}),this.quadMaterial=new u({name:`preview-quad`,vertexShader:_,fragmentShader:v,transparent:!0,depthTest:!1,depthWrite:!1,toneMapped:!1,uniforms:{tPrev:{value:this.target.texture},uAlpha:{value:1},uHaze:this.uniforms.uHaze,uZenith:{value:new t},uInvProj:{value:new a},uCamWorld:{value:new a}}}),this.quad=new o(new c(2,2),this.quadMaterial),this.quad.frustumCulled=!1,this.quadScene=new l().add(this.quad),this.quadCamera=new s(-1,1,1,-1,0,1),this.hidden=[],this._c=new t}compile(n,i){let a=new e(1,1,1),s=new l,c=[],u=new o(a,this.material),d=new r(a,this.material,1),f=new r(a,this.material,1);f.setColorAt(0,new t(1,1,1));for(let e of[u,d,f])c.push(n(e,i,s));return c.push(n(this.quad,this.quadCamera,this.quadScene,!0)),Promise.all(c)}setSize(e,t){(this.target.width!==e||this.target.height!==t)&&this.target.setSize(e,t)}light(e){let t=this.uniforms,n=e.elevation??30,r=i.smoothstep(n,-6,12),a=1-i.smoothstep(n,4,30);t.uSunDir.value.copy(e.sunDir),t.uSun.value.setRGB(1,.93-.15*a,.84-.3*a).multiplyScalar(1.55*r),t.uSky.value.setRGB(.012,.016,.03).lerp(this._c.setRGB(.2,.22,.27),r),t.uHaze.value.setRGB(.02,.025,.04).lerp(this._c.setRGB(.66,.58,.47),r),this.quadMaterial.uniforms.uZenith.value.setRGB(.01,.015,.03).lerp(this._c.setRGB(.4,.52,.72),r);let o=this.backdrop?.userData.previewMaps;o&&(t.uNear.value=o.uNear.value,t.uNearRect.value.copy(o.uNearRect.value),t.uNearOn.value=o.uNearOn.value,t.uFar.value=o.uFar.value,t.uFarRect.value.copy(o.uFarRect.value),t.uFarOn.value=o.uFarOn.value)}draw(e,t,n){let r=this.renderer,i=this.hidden;this.light(n),i.length=0,e.traverseVisible(t=>{if(t===e)return;let n=Array.isArray(t.material)?t.material[0]:t.material;(t.isLight||t.isPoints||t.isLine||t.isSprite||n&&(n.transparent||n.isShaderMaterial))&&i.push(t)});for(let e of i)e.visible=!1;let a=r.shadowMap.autoUpdate,o=e.background,s=e.overrideMaterial,c=r.getRenderTarget(),l=r.getClearColor(this._c),u=r.getClearAlpha();r.shadowMap.autoUpdate=!1,e.background=null,e.overrideMaterial=this.material,r.setRenderTarget(this.target),r.setClearColor(0,0),r.clear(!0,!0,!0),r.render(e,t),r.setClearColor(l,u),e.overrideMaterial=s,e.background=o,r.shadowMap.autoUpdate=a,r.setRenderTarget(c);for(let e of i)e.visible=!0}show(e,t=1){let n=this.renderer,r=this.quadMaterial.uniforms,i=n.autoClear;r.uAlpha.value=t,r.uInvProj.value.copy(e.projectionMatrixInverse),r.uCamWorld.value.copy(e.matrixWorld),n.setRenderTarget(null),n.autoClear=t>=1,n.render(this.quadScene,this.quadCamera),n.autoClear=i}};export{y as Preview};