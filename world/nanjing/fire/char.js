var e=class{constructor(e,t,n){this.THREE=e;let r=[];for(let e=0;e<t.n;e++)t.rings[e]&&t.rings[e].length>=6&&!t.forest[e]&&r.push(e);let i=this.n=r.length;this.t0s=new Float64Array(i);let a=new Float32Array(i*4),o=new Float32Array(i*4);r.forEach((e,r)=>{let[i,s,c,l,u,d]=n(t.rings[e],t.x[e],t.z[e]);a[r*4]=i,a[r*4+1]=t.y[e],a[r*4+2]=s,a[r*4+3]=t.t0[e],o[r*4]=c,o[r*4+1]=l,o[r*4+2]=u,o[r*4+3]=d,this.t0s[r]=t.t0[e]}),this.A=a,this.B=o,this.grid=null;let s=this.geometry=new e.InstancedBufferGeometry;s.setAttribute(`position`,new e.BufferAttribute(new Float32Array([-1,-1,0,1,-1,0,1,1,0,-1,1,0]),3)),s.setIndex([0,1,2,0,2,3]),s.setAttribute(`iA`,new e.InstancedBufferAttribute(a,4)),s.setAttribute(`iB`,new e.InstancedBufferAttribute(o,4)),s.instanceCount=0,this.material=new e.ShaderMaterial({glslVersion:e.GLSL3,vertexShader:`
in vec4 iA; // centre x, ground y, centre z, ignition time (story hours)
in vec4 iB; // long axis x, z (unit), half length, half width (m)
uniform float uT;
uniform float uLift;
out vec3 vW; out float vAge;
void main() {
  vec2 ux = iB.xy, uz = vec2(-ux.y, ux.x);
  vec2 off = ux * (position.x * (iB.z + 2.4)) + uz * (position.y * (iB.w + 2.4));
  vec3 w = vec3(iA.x + off.x, iA.y + uLift, iA.z + off.y);
  vW = w; vAge = uT - iA.w;
  gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.0);
}`,fragmentShader:`
precision highp float;
uniform float uK;
uniform vec3 uSunE, uSkyL, uSunDir; // the scene's own light (fire.js sets them each frame): the soot is dark paint, not a light
in vec3 vW; in float vAge;
out vec4 fragColor;
float h12(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
void main() {
  float ramp = smoothstep(0.7, 3.2, vAge);
  if (ramp <= 0.001) discard;
  float d = length(vW - cameraPosition);
  // (mottled: the char is thicker in places; blocks of about 1.5 m)
  float n = h12(floor(vW.xz * 0.65));
  float a = ramp * (0.6 + 0.22 * n) * uK * (1.0 - 0.4 * smoothstep(1200.0, 6000.0, d));
  // (albedo 0.05-0.04 times what falls on a flat surface: the sun's share by its height, and the sky; at night both are the moon's and the sky's, so it stays black)
  vec3 J = uSunE * max(uSunDir.y, 0.0) * 0.32 + uSkyL * 0.9;
  fragColor = vec4(vec3(0.05, 0.044, 0.038) * J * a, a);
}`,uniforms:{uT:{value:0},uLift:{value:1},uK:{value:1},uSunE:{value:new e.Vector3},uSkyL:{value:new e.Vector3},uSunDir:{value:new e.Vector3(0,1,0)}},transparent:!0,depthWrite:!1,depthTest:!0,side:e.DoubleSide,blending:e.CustomBlending,blendEquation:e.AddEquation,blendSrc:e.OneFactor,blendDst:e.OneMinusSrcAlphaFactor,fog:!1,toneMapped:!1}),this.mesh=new e.Mesh(s,this.material),this.mesh.frustumCulled=!1,this.mesh.castShadow=this.mesh.receiveShadow=!1,this.mesh.renderOrder=5,this.mesh.name=`fire-char`}set(e){let t=0,n=this.n,r=e-.7;for(;t<n;){let e=t+n>>1;this.t0s[e]<=r?t=e+1:n=e}return this.geometry.instanceCount=t,this.material.uniforms.uT.value=e,t}burntAt(e,t,n){if(!this.grid){let e=new Map,t=this.A,n=this.B;for(let r=0;r<this.n;r++){let i=Math.hypot(n[r*4+2],n[r*4+3])+2.4,a=t[r*4],o=t[r*4+2];for(let t=Math.floor((a-i)/40);t<=Math.floor((a+i)/40);t++)for(let n=Math.floor((o-i)/40);n<=Math.floor((o+i)/40);n++){let i=t*100003+n,a=e.get(i);a||e.set(i,a=[]),a.push(r)}}this.grid={C:40,grid:e}}let{C:r,grid:i}=this.grid,a=i.get(Math.floor(e/r)*100003+Math.floor(t/r));if(!a)return!1;let o=this.A,s=this.B,c=n-.7;for(let n=0;n<a.length;n++){let r=a[n];if(this.t0s[r]>c)continue;let i=e-o[r*4],l=t-o[r*4+2],u=s[r*4],d=s[r*4+1];if(Math.abs(i*u+l*d)<=s[r*4+2]+2.4&&Math.abs(-i*d+l*u)<=s[r*4+3]+2.4)return!0}return!1}dispose(){this.geometry.dispose(),this.material.dispose()}};export{e as Char};