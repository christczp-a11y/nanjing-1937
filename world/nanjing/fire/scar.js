var e=class{constructor(e,t){this.THREE=e;let n=[];for(let e=0;e<t.n;e++)t.rings[e]&&t.rings[e].length>=6&&!t.forest[e]&&n.push(e);let r=this.n=n.length;this.t0s=new Float64Array(r);let i=new Float32Array(r*4),a=new Float32Array(r*4);n.forEach((e,n)=>{i[n*4]=t.x[e],i[n*4+1]=t.y[e],i[n*4+2]=t.z[e],i[n*4+3]=t.t0[e],a[n*4]=15+.5*Math.sqrt(t.area[e]),a[n*4+1]=(t.seed[e]??0)*7,this.t0s[n]=t.t0[e]});let o=this.geometry=new e.InstancedBufferGeometry;o.setAttribute(`position`,new e.BufferAttribute(new Float32Array([-1,-1,0,1,-1,0,1,1,0,-1,1,0]),3)),o.setIndex([0,1,2,0,2,3]),o.setAttribute(`iA`,new e.InstancedBufferAttribute(i,4)),o.setAttribute(`iB`,new e.InstancedBufferAttribute(a,4)),o.instanceCount=0,this.material=new e.ShaderMaterial({glslVersion:e.GLSL3,vertexShader:`
in vec4 iA; // centre x, ground y, centre z, ignition time (story hours)
in vec4 iB; // radius (m), seed, 0, 0
uniform float uT;
uniform float uLift;
out vec2 vP; out float vAge; out float vSeed; out vec3 vW;
void main() {
  vec3 w = vec3(iA.x + position.x * iB.x, iA.y + uLift, iA.z + position.y * iB.x);
  vP = position.xy; vAge = uT - iA.w; vSeed = iB.y; vW = w;
  gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.0);
}`,fragmentShader:`
precision highp float;
uniform float uK;
uniform vec3 uSunE, uSkyL, uSunDir; // the scene's own light (fire.js sets them each frame): the soot is dark paint, not a light
in vec2 vP; in float vAge; in float vSeed; in vec3 vW;
out vec4 fragColor;
float h12(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vn2(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h12(i), h12(i + vec2(1, 0)), f.x), mix(h12(i + vec2(0, 1)), h12(i + vec2(1, 1)), f.x), f.y); }
void main() {
  float ramp = smoothstep(0.9, 3.5, vAge);
  float d2 = dot(vP, vP);
  if (ramp <= 0.001 || d2 >= 1.0) discard;
  float edge = pow(1.0 - d2, 1.6);
  float d = length(vW - cameraPosition);
  // (mottled: the char lies thicker in places, in patches of 10-30 m)
  float m = 0.5 + 0.5 * (0.65 * vn2(vW.xz * 0.11 + vSeed * 13.0) + 0.35 * vn2(vW.xz * 0.42));
  float a = ramp * edge * m * uK * 0.2 * (1.0 - 0.4 * smoothstep(3000.0, 9000.0, d));
  vec3 J = uSunE * max(uSunDir.y, 0.0) * 0.32 + uSkyL * 0.9;
  fragColor = vec4(vec3(0.07, 0.06, 0.05) * J * a, a);
}`,uniforms:{uT:{value:0},uLift:{value:.6},uK:{value:1},uSunE:{value:new e.Vector3},uSkyL:{value:new e.Vector3},uSunDir:{value:new e.Vector3(0,1,0)}},transparent:!0,depthWrite:!1,depthTest:!0,side:e.DoubleSide,blending:e.CustomBlending,blendEquation:e.AddEquation,blendSrc:e.OneFactor,blendDst:e.OneMinusSrcAlphaFactor,fog:!1,toneMapped:!1}),this.mesh=new e.Mesh(o,this.material),this.mesh.frustumCulled=!1,this.mesh.castShadow=this.mesh.receiveShadow=!1,this.mesh.renderOrder=4,this.mesh.name=`fire-scar`}set(e){let t=0,n=this.n,r=e-.9;for(;t<n;){let e=t+n>>1;this.t0s[e]<=r?t=e+1:n=e}return this.geometry.instanceCount=t,this.material.uniforms.uT.value=e,t}dispose(){this.geometry.dispose(),this.material.dispose()}};export{e as Scar};