import{__exportAll as e}from"../../../_virtual/_rolldown/runtime.js";import{waterU as t}from"../../water_look.js";var n=e({dispose:()=>c,install:()=>a,update:()=>o}),r=0,i=null;function a(e){r=0,i=u(e)}function o(e,n){e.cut&&(r=0),r=(r+n)%4e3,t.uWaterT&&(t.uWaterT.value=r),!i&&e.shared?.bridgePiers?.length&&(i=u(e)),i&&(i.u.uT.value=r,e.shared?.bridgePiers&&e.shared.bridgePiers!==i.src&&(s(e),i=u(e)))}function s(e){i&&=(e?.scene?.remove(i.mesh),i.mesh.geometry.dispose(),i.mesh.material.dispose(),null)}function c(e){t.uWaterT&&(t.uWaterT.value=0),s(e)}var l=[.4,-.92];function u(e){let{THREE:n}=e,i=e.shared?.bridgePiers;if(!i||!i.length)return null;let a=i.filter(e=>e.water<3.2);if(!a.length)return null;let o=a.length,s=new Float32Array(o*4),c=new Float32Array(o*4);a.forEach((e,t)=>{s.set([e.x,e.water+.12,e.z,t],t*4),c.set([e.rx,e.rz,e.len,e.wid],t*4)});let u=new n.InstancedBufferGeometry;u.setAttribute(`position`,new n.Float32BufferAttribute([-1,0,-1,1,0,-1,1,0,1,-1,0,1],3)),u.setIndex([0,2,1,0,3,2]),u.setAttribute(`aP`,new n.InstancedBufferAttribute(s,4)),u.setAttribute(`aR`,new n.InstancedBufferAttribute(c,4)),u.instanceCount=o;let d={uT:{value:r},uFlow:{value:new n.Vector2(l[0],l[1])},uDark:e.shared.uDark,uWaterMap:t.uWaterMap,uWaterRect:t.uWaterRect,uWaterSize:t.uWaterSize},f=new n.ShaderMaterial({uniforms:d,transparent:!0,depthWrite:!1,depthTest:!0,side:n.DoubleSide,polygonOffset:!0,polygonOffsetFactor:-4,polygonOffsetUnits:-4,vertexShader:`
      attribute vec4 aP; attribute vec4 aR;
      uniform vec4 uWaterRect; uniform vec2 uWaterSize; uniform sampler2D uWaterMap;
      varying vec2 vLoc; varying vec4 vR; varying float vOn; varying float vDist;
      void main() {
        vec2 loc = position.xz * 18.0;
        vLoc = loc; vR = aR;
        vec3 wp = vec3(aP.x + loc.x, aP.y, aP.z + loc.y);
        // only a pier that stands in the Yangtze (water map class 1, a current of 0.6 m/s) or in the outer 秦淮 (class 2, 0.1 m/s, tidal: 推测) has foam
        vOn = 0.0;
        if (uWaterRect.w > 0.5) {
          ivec2 g = ivec2(floor((aP.xz - uWaterRect.xy) / uWaterRect.z + 0.5));
          if (g.x >= 0 && g.y >= 0 && g.x < int(uWaterSize.x) && g.y < int(uWaterSize.y)) {
            float cl = texelFetch(uWaterMap, g, 0).g * 255.0;
            vOn = abs(cl - 1.0) < 0.5 ? 1.0 : (abs(cl - 2.0) < 0.5 ? 0.5 : 0.0);   // (Yangtze: the full bow and wake; the outer 秦淮: a ring only, its tide 推测)
          }
        }
        vDist = distance(cameraPosition, wp);
        gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.0);
      }`,fragmentShader:`
      uniform float uT; uniform vec2 uFlow; uniform float uDark;
      varying vec2 vLoc; varying vec4 vR; varying float vOn; varying float vDist;
      float h21(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float vn(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
        return mix(mix(h21(i), h21(i + vec2(1, 0)), f.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), f.x), f.y); }
      void main() {
        if (vOn < 0.25) discard;
        float full = step(0.75, vOn);
        vec2 F = uFlow, Fp = vec2(-F.y, F.x);
        vec2 r = vR.xy, n = vec2(-r.y, r.x);
        float hl = 0.5 * vR.z + 0.25, hw = 0.5 * vR.w;                  // (the pier's half sizes along and across the road; a quarter metre of cutwater)
        vec2 pl = vec2(dot(vLoc, r), dot(vLoc, n)) + 0.55 * (vec2(vn(vLoc * 1.3 + uT * 0.2), vn(vLoc * 1.3 + 17.0 - uT * 0.2)) - 0.5);   // (the water shakes the outline)
        float rr = min(1.2, 0.9 * min(hl, hw));
        vec2 q = abs(pl) - (vec2(hl, hw) - rr);
        float sd = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - rr;   // metres from the pier's outline (a rounded one: the water rounds it)
        float f = dot(vLoc, F), c = dot(vLoc, Fp);
        float extF = abs(dot(r, F)) * hl + abs(dot(n, F)) * hw;         // the pier's half extent along and across the current
        float extC = abs(dot(r, Fp)) * hl + abs(dot(n, Fp)) * hw;
        // the bow: a ring of white water hugging the pier, strongest on the nose that faces the current, broken by noise
        float ring = (1.0 - smoothstep(0.0, 1.4, sd)) * smoothstep(-0.5, -0.1, sd);
        float nose = 0.35 + 0.65 * smoothstep(0.5 * extF, -0.7 * extF, f);
        float bn = vn(vLoc * 2.1 + vec2(uT * 0.5, 3.0));
        float bow = ring * nose * smoothstep(0.15, 0.5, bn + 0.3);
        // the wake: streaks running down-current in a V that opens by 0.2 per metre and dies out over about 14 m
        float x = f - extF;
        float wv = extC + 0.2 * max(x, 0.0);
        float across = abs(c) / max(wv, 0.5);
        float stream = vn(vec2(x * 0.42 - uT * 0.45, c * 1.5 + 7.0)) * 0.6 + vn(vec2(x * 1.3 - uT * 0.6, c * 3.7)) * 0.4;
        float wake = step(0.0, x) * exp(-max(x, 0.0) / 9.0) * (1.0 - smoothstep(0.45, 1.0, across)) * smoothstep(0.32, 0.6, stream);
        float a = clamp(0.85 * bow * (0.45 + 0.55 * full) + 0.75 * wake * full, 0.0, 0.85);
        a *= 1.0 - smoothstep(350.0, 900.0, vDist);                      // (a speck beyond that: and no foam is drawn for a viewer who cannot see it)
        a *= 1.0 - smoothstep(14.0, 18.0, length(vLoc));
        if (a < 0.01) discard;
        vec3 col = vec3(1.55, 1.57, 1.52) * (0.12 + 0.88 * (1.0 - uDark));        // (foam is off-white; this is the water's own light, tone mapped later with everything else)
        gl_FragColor = vec4(col, a);
      }`}),p=new n.Mesh(u,f);return p.name=`pier foam`,p.frustumCulled=!1,p.renderOrder=5,e.scene.add(p),{mesh:p,u:d,src:i,n:o}}export{c as dispose,a as install,o as update,n as water_clock_exports};