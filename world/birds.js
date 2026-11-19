import{DataTexture as e,Float32BufferAttribute as t,FloatType as n,InstancedBufferAttribute as r,InstancedBufferGeometry as i,MathUtils as a,Mesh as o,NearestFilter as s,RGBAFormat as c,ShaderMaterial as l,Vector3 as u}from"../node_modules/three/build/three.core.js";import{shared as d}from"./materials.js";var f=2e3,p=14,m=Math.ceil(f/p),h=3.2,g=13,_=9,v=28;function y(){let e=[],n=[],a=(t,r,i)=>{for(let[a,o,s,c]of[t,r,i])e.push(a,o,s),n.push(c)},o=h/2;a([0,0,.42,0],[.09,0,-.1,0],[-.09,0,-.1,0]),a([.09,0,-.1,0],[0,0,-.5,0],[-.09,0,-.1,0]);for(let e of[-1,1])a([e*.06,0,.2,0],[e*o*.5,0,.16,.5],[e*.06,0,-.16,0]),a([e*o*.5,0,.16,.5],[e*o*.5,0,-.1,.5],[e*.06,0,-.16,0]),a([e*o*.5,0,.16,.5],[e*o,0,-.02,1],[e*o*.5,0,-.1,.5]);let s=new i;s.setAttribute(`position`,new t(e,3)),s.setAttribute(`aWing`,new t(n,1));let c=new Float32Array(f*4);for(let e=0;e<f;e++)c.set([Math.floor(e/p),Math.random(),Math.random(),Math.random()],e*4);return s.setAttribute(`aSeed`,new r(c,4)),s}function b(){let t=new Float32Array(m*2*4),r=new e(t,m,2,c,n);r.minFilter=r.magFilter=s;let i=new l({side:2,uniforms:{uTime:d.uTime,uDark:d.uDark,uFlocks:{value:r}},vertexShader:`
      #define PIGEONS 1.0 // share of the flocks that are white pigeons (the rest would be black crows)
      attribute float aWing;
      attribute vec4 aSeed;
      uniform float uTime;
      uniform sampler2D uFlocks;
      varying float vShade;
      varying float vCrow;
      float hash(float n) { return fract(sin(n * 127.1) * 43758.5453); }
      // how much of the bird is still in the air (1), with the flock settled by 'perch': one bird after another
      float aloft(float perch) {
        float b = clamp(perch * 1.4 - 0.4 * aSeed.w, 0.0, 1.0);
        return 1.0 - b * b * (3.0 - 2.0 * b);
      }
      // where the bird is at time t
      vec3 place(float t, vec4 flock, float perch) {
        float f = aSeed.x, air = aloft(perch);
        // the flock: a slow, never-repeating loop above its tree, at a height of its own
        vec2 reach = 45.0 + 170.0 * vec2(hash(f + 1.0), hash(f + 5.0));
        vec3 c = vec3(
          reach.x * sin(t * (0.05 + 0.06 * hash(f + 8.0)) + 6.28 * hash(f + 2.0)),
          22.0 + 230.0 * pow(hash(f + 3.0), 2.0) + 14.0 * sin(t * 0.05 + 6.28 * hash(f + 4.0)),
          reach.y * sin(t * (0.05 + 0.06 * hash(f + 10.0)) + 6.28 * hash(f + 6.0)));
        // the bird: round the flock on its own circle, rising and falling a little
        float radius = 8.0 + 55.0 * aSeed.y, turn = (0.5 + aSeed.z) * 4.5 / radius * (hash(f + 7.0) < 0.5 ? -1.0 : 1.0);
        float a = t * turn + 6.28 * aSeed.w;
        vec3 own = vec3(cos(a) * radius, 9.0 * sin(t * 0.21 + 6.28 * aSeed.z) + 50.0 * (aSeed.w - 0.5), sin(a) * radius * 0.8);
        own.y = max(own.y, 4.0 - c.y);
        // settled, it sits somewhere in the crown
        vec3 twig = (vec3(aSeed.y, aSeed.z, aSeed.w) - 0.5) * vec3(3.0, 2.0, 3.0);
        return flock.xyz + mix(twig, c + own, air);
      }
      void main() {
        float u = (aSeed.x + 0.5) / ${m}.0;
        vec4 flock = texture2D(uFlocks, vec2(u, 0.25));
        float rate = texture2D(uFlocks, vec2(u, 0.75)).x;
        vec3 p = place(uTime, flock, flock.w), ahead = place(uTime + 0.25, flock, clamp(flock.w + rate * 0.25, 0.0, 1.0));
        vec3 fwd = normalize(ahead - p + vec3(0.0, 0.0, 1e-4)), right = normalize(cross(vec3(0.0, 1.0, 0.0), fwd)), up = cross(fwd, right);
        // wings: beat for a while, then glide with the wings held a little up
        float beat = smoothstep(-0.2, 0.3, sin(uTime * 0.35 + 6.28 * aSeed.y));
        // a flock is of one kind: pigeons (the larger share: white, smaller, quick wings) or crows (black, slow wings)
        float crow = step(PIGEONS, hash(aSeed.x + 9.0));
        float lift = mix(0.18, sin(uTime * mix(8.0, 4.5, crow) * (0.85 + 0.3 * aSeed.z) + 6.28 * aSeed.w), beat) * 0.55;
        // (a bird in the tree is not seen: it shrinks away among the leaves as it arrives)
        vec3 local = position * mix(0.7, 1.0, crow) * smoothstep(0.0, 0.05, aloft(flock.w));
        vCrow = crow;
        local.y += abs(local.x) * lift * aWing;
        local.x *= 1.0 - 0.22 * abs(lift) * aWing;
        vec3 world = p + right * local.x + up * local.y + fwd * local.z;
        vShade = 0.75 + 0.25 * aWing;
        gl_Position = projectionMatrix * viewMatrix * vec4(world, 1.0);
      }`,fragmentShader:`
      uniform float uDark;
      varying float vShade;
      varying float vCrow;
      void main() { gl_FragColor = vec4(mix(vec3(0.82, 0.82, 0.84), vec3(0.03, 0.03, 0.035), vCrow) * vShade * mix(1.0, 0.5, uDark), 1.0); } // (still white against the night sky)`}),f=new o(y(),i);f.frustumCulled=!1,f.name=`birds`,f.castShadow=!0,f.customDepthMaterial=new l({side:2,uniforms:i.uniforms,vertexShader:i.vertexShader,fragmentShader:`void main() { gl_FragColor = vec4(1.0); }`}),f.geometry.instanceCount=100;let h=Array.from({length:m},()=>({state:`new`,timer:0,perch:0,rate:0,anchor:new u,target:null})),b=(e,t)=>e+Math.random()*(t-e);return f.userData.flocks=h,f.userData.update=(e,n,i,o)=>{let s=a.clamp(i.position.distanceTo(n)*.7,120,650),c=[...o.tiles.values()].filter(e=>e.trees?.roosts.length),l=()=>{for(let e=0;e<12&&c.length;e++){let e=c[Math.floor(Math.random()*c.length)].trees.roosts,t=Math.floor(Math.random()*(e.length/3))*3;if(Math.hypot(e[t]-n.x,e[t+2]-n.z)<s)return new u(e[t],e[t+1],e[t+2])}return null},d=e=>Math.hypot(e.x-n.x,e.z-n.z)>s*1.5,y=Math.ceil(f.geometry.instanceCount/p);for(let r=0;r<y;r++){let i=h[r];if(i.rate=0,i.state===`new`)i.target=l(),i.anchor.copy(i.target??new u(n.x+b(-s,s)*.6,o.ground(n.x,n.z)+12,n.z+b(-s,s)*.6)),i.target&&Math.random()<.3?(i.state=`perched`,i.perch=1,i.timer=b(2,25)):(i.state=`fly`,i.perch=0,i.timer=b(8,70));else if(i.state===`fly`){if(i.timer-=e,(!i.target||d(i.target))&&(i.target=l()??i.target),i.target){let t=i.anchor.distanceTo(i.target);t>.01?i.anchor.lerp(i.target,Math.min(1,v*e/t)):i.timer<=0&&(i.state=`land`)}}else if(i.state===`land`)i.rate=1/g,i.perch+=e/g,i.perch>=1&&(i.perch=1,i.state=`perched`,i.timer=b(6,26));else if(i.state===`perched`){if(i.timer-=e,d(i.anchor)){let e=l();e&&(i.target=e,i.anchor.copy(e))}i.timer<=0&&(i.state=`takeoff`)}else i.rate=-1/_,i.perch-=e/_,i.perch<=0&&(i.perch=0,i.state=`fly`,i.timer=b(30,85));t.set([i.anchor.x,i.anchor.y,i.anchor.z,i.perch],r*4),t[(m+r)*4]=i.rate}r.needsUpdate=!0},f}export{f as MAX_BIRDS,b as createBirds};