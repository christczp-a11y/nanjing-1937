import{Uniform as e}from"../../../node_modules/three/build/three.core.js";import{Effect as t,EffectAttribute as n,EffectPass as r}from"../../../node_modules/postprocessing/build/index.js";var i=`
uniform float uF;       // focal length (m)
uniform float uA;       // aperture diameter (m)
uniform float uS;       // focus distance (m, along the axis)
uniform float uK;       // image height (px) / sensor height (m)
uniform float uMax;     // largest circle drawn (px, radius)
uniform mat4 uInvProj;  // the camera's inverse projection (its near and far change per frame: the pass's own cameraNear/Far are not kept up)
float axial(vec2 uv, float z) { vec4 p = uInvProj * vec4(uv * 2.0 - 1.0, z * 2.0 - 1.0, 1.0); return max(-p.z / p.w, 1e-4); }
void mainImage(const in vec4 inputColor, const in vec2 uv, const in float depth, out vec4 outputColor) {
  float d0 = axial(uv, depth);
  float c0 = min(uA * uF * abs(d0 - uS) / (d0 * max(uS - uF, 1e-4)) * uK * 0.5, uMax);
  float wc = 1.0 / max(c0 * c0, 1.0);
  vec3 acc = inputColor.rgb * wc; float wsum = wc;
  const int N = 64;
  float phi = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715)))) * 6.2831853;
  for (int i = 0; i < N; i++) {
    float r = sqrt((float(i) + 0.5) / float(N)) * uMax;
    float a = float(i) * 2.399963 + phi;
    vec2 q = uv + vec2(cos(a), sin(a)) * r * texelSize;
    float dq = axial(q, readDepth(q));
    float cq = min(uA * uF * abs(dq - uS) / (dq * max(uS - uF, 1e-4)) * uK * 0.5, uMax);
    // a tap behind the centre may not spread over it further than the centre's own circle
    float ce = dq < d0 ? cq : min(cq, c0);
    float w = clamp(ce - r + 1.0, 0.0, 1.0) / max(ce * ce, 1.0);
    acc += texture2D(inputBuffer, q).rgb * w; wsum += w;
  }
  outputColor = vec4(acc / wsum, inputColor.a);
}`,a=class extends t{constructor(t){super(`LensDof`,i,{attributes:n.CONVOLUTION|n.DEPTH,uniforms:new Map([[`uF`,new e(.035)],[`uA`,new e(.0175)],[`uS`,new e(1)],[`uK`,new e(1)],[`uMax`,new e(0)],[`uInvProj`,new e(null)]])}),this.uniforms.get(`uInvProj`).value=t.projectionMatrixInverse}set(e,t,n,r,i=28){let a=this.uniforms,o=e/1e3;a.get(`uF`).value=o,a.get(`uA`).value=o/t,a.get(`uS`).value=Math.max(n,o*1.5),a.get(`uK`).value=r/.02025,a.get(`uMax`).value=i}},o=(e,t)=>new r(e,t);export{a as LensDof,o as makeDofPass};