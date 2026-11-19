import{CanvasTexture as e,Color as t,DataTexture as n,LinearFilter as r,LinearMipmapLinearFilter as i,Matrix4 as a,MeshDepthMaterial as o,MeshStandardMaterial as s,NearestFilter as c,TextureLoader as l,Vector2 as u,Vector3 as d,Vector4 as f}from"../node_modules/three/build/three.core.js";import{NJ_VERNACULAR_GLSL as p}from"./nanjing/houses/facade_vernacular.glsl.js";import{NJ_MASONRY_GLSL as m}from"./nanjing/houses/facade_masonry.glsl.js";import{FABRIC_GLSL as h}from"./nanjing/ground_fabric.glsl.js";import{WATER_FINAL as g,WATER_KEY as _,WATER_MAIN as ee,WATER_PARS as v,loadWaterMap as y,waterU as b}from"./water_look.js";import{makeSignCanvas as x}from"./nanjing/houses/signs.js";var S=new n(new Uint8Array([0,0,0,255]),1,1);S.needsUpdate=!0;var C=(()=>{let t;try{let n=x();n&&(t=new e(n),t.flipY=!1,t.generateMipmaps=!0,t.minFilter=i,t.magFilter=r,t.anisotropy=4,t.needsUpdate=!0)}catch(e){console.warn(`sign atlas:`,e)}return t||(t=new n(new Uint8Array([0,0,0,255]),1,1),t.needsUpdate=!0),t})(),w={uNight:{value:0},uDark:{value:0},uTime:{value:0},uOrtho:{value:null},uOrthoRect:{value:new f(0,0,1,1)},uOrthoOn:{value:0},uGroundClass:{value:null},uGroundClassOn:{value:0},uSnow:{value:0},uWindowLife:{value:new u(.5,0)},uCityGlass:{value:0},uRoomLight:{value:1.75},uSoft:{value:1},uTreeGlow:{value:new t(0,0,0)},uSeason:{value:0},uContact:{value:0},uContactMap:{value:null},uContactRect:{value:new f(0,0,1,0)},uGlass:{value:2},uNightBlue:{value:.55},uLampOn:{value:0},uLampMap:{value:null},uLampRect:{value:new f(0,0,1,0)},uMirror:{value:null},uMirrorMatrix:{value:new a},uMirrorOn:{value:0},uMirrorLevel:{value:0},uCloudMap:{value:null},uCloudOffset:{value:new u},uCloudCover:{value:0},uCloudBase:{value:450},uCloudsOn:{value:0},uWorldToECEF:{value:new a},uCloudRect:{value:new f},uCloudFade:{value:500},uSunDir:{value:new d(0,1,0)},uSunGlint:{value:new t(0,0,0)},uGlintOn:{value:1},uPhotoRange:{value:new u(140,420)},uPhotoMix:{value:1},uBurn:{value:S},uBurnRect:{value:new f(0,0,1,1)},uStoryDay:{value:0},uSign:{value:C}},T={abstract:!1,landmarks:!1,windows:!0,contact:!1,relief:!1},E=new Set,D=()=>(T.abstract?`a`:``)+(T.abstract&&T.landmarks?`l`:``)+(T.windows?``:`w`)+(T.relief?`r`:``);function O(e){return E.add(e),e.addEventListener(`dispose`,()=>E.delete(e)),e}function te(e){Object.assign(T,e);for(let e of E)e.needsUpdate=!0}var k={shop:[.47,.42,.33],home:[.4,.405,.47],land:[.36,.36,.38],paving:[.4,.4,.43],water:[.2,.36,.6],night:{shop:[.06,.05,.045],home:[.034,.052,.08],land:[.012,.022,.031],tree:[.006,.06,.058]}},A=e=>`vec3(${e.join(`, `)})`,j=`
float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash12(i), hash12(i + vec2(1.0, 0.0)), f.x), mix(hash12(i + vec2(0.0, 1.0)), hash12(i + vec2(1.0, 1.0)), f.x), f.y);
}
// Anti-aliased box [a, b] in x with filter width w.
float box(float x, float a, float b, float w) {
  return smoothstep(a - w, a + w, x) - smoothstep(b - w, b + w, x);
}
vec3 hue(float h) { return clamp(abs(fract(h + vec3(0.0, 2.0 / 3.0, 1.0 / 3.0)) * 6.0 - 3.0) - 1.0, 0.0, 1.0); }
`,M=`varying vec3 vWPos;
varying vec3 vWNrm;`,N=`vWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;
vWNrm = normalize(mat3(modelMatrix) * normal);`,P=`
normal = normalize((viewMatrix * vec4(normalize(gT * gNm.x + gB * gNm.y + gN * gNm.z), 0.0)).xyz);
`,F=`
uniform float uNight;
uniform float uTime;
uniform vec2 uWindowLife;
uniform float uCityGlass;
uniform float uRoomLight;
uniform float uSoft;
uniform float uGlass;
uniform float uNightBlue;
uniform vec3 uSunDir;
uniform vec3 uSunGlint;
uniform float uGlintOn;
uniform sampler2DArray uWallAlb;
uniform sampler2DArray uWallNor;
uniform float uWallScale[6];
uniform float uWallDetail[6];
varying vec4 vFacade;
varying vec4 vBldg;
varying vec3 vWPos;
varying vec3 vWNrm;
varying float vBurn; // (Nanjing 1937) how far this building has burnt: 0 standing .. 1 a burnt-out shell
uniform float uStoryDay;
uniform float uSnow; // (Nanjing 1937, ground area's uniform) snow lying: 0 none .. 1 a full cover
uniform sampler2D uSign; // (integrator 11-10) the characters of the shop signs: 6 x 40 cells of 96 px, white on black (houses/signs.js)
float gRough, gMetal;
vec3 gGlint = vec3(0.0); // the sun mirrored in a pane (added to the specular light where the sun reaches it)
float gPane = 0.0; // how much of a mirror this fragment is: window glass (written to alpha for the reflection pass)
vec3 gEmissive, gT, gB, gN, gNm;
${j}
`,I=`
{
  gN = normalize(vWNrm) * (gl_FrontFacing ? 1.0 : -1.0); // (both sides are drawn: the inner side of a wall faces in)
  gT = abs(gN.y) > 0.95 ? vec3(1.0, 0.0, 0.0) : normalize(cross(vec3(0.0, 1.0, 0.0), gN));
  gB = cross(gN, gT);
  float seed = vFacade.w, height = vBldg.x, kind = vBldg.z, cellW = vBldg.w;
  float layer = floor(vBldg.y / 8.0 + 0.01), cat = vBldg.y - layer * 8.0;
  float u = vFacade.x, v = vFacade.y, floorH = vFacade.z;
${`
  if (cat > 6.5) {
${m}
  } else if (cat > 5.5) {
${p}
  } else {
`}

  // surface texture: detail (mean 1) over the vertex colour, plus a normal map
  vec2 st = vec2(dot(vWPos, gT), dot(vWPos, gB));
  vec3 tuv = vec3(st / uWallScale[int(layer)], layer);
  vec3 wall = diffuseColor.rgb * mix(vec3(1.0), texture(uWallAlb, tuv).rgb * 2.0, uWallDetail[int(layer)]);
  wall *= 0.9 + 0.2 * vnoise(st * 0.11 + seed * 50.0);          // breaks up tiling over large walls
  gNm = texture(uWallNor, tuv).xyz * 2.0 - 1.0;
  gNm = normalize(vec3(gNm.xy * 0.7, gNm.z));
  gRough = 0.82; gMetal = 0.0; gEmissive = vec3(0.0);
  if (layer > 3.5 && layer < 4.5) { gRough = 0.5; gMetal = 0.35; }  // metal siding and roofs

  // weathering on walls: rain streaks, a dirty base, run-off under the roofline
  if (kind < 0.5 || (kind > 1.5 && kind < 2.5)) {
    float streak = vnoise(vec2(st.x * 2.2, st.y * 0.13 + seed * 40.0));
    float grime = smoothstep(0.55, 0.95, streak) * 0.1
      + (1.0 - smoothstep(0.0, 1.6, v)) * 0.1
      + smoothstep(height - 2.5, height, v) * streak * 0.14;
    wall *= 1.0 - grime;
  }
  diffuseColor.rgb = wall;

  // steelwork of a lattice tower (src/world/tower.js): painted steel in the vertex colour, floodlit at night
  if (kind > 3.5) {
    // (a colour brighter than 1 is a lamp: dark glass by day, lit at night; the steel keeps its own paint
    // under the floodlights)
    float lampOn = step(1.5, max(vColor.r, max(vColor.g, vColor.b)));
    diffuseColor.rgb = mix(vColor.rgb * (0.94 + 0.12 * vnoise(st * 0.7)), vec3(0.12), lampOn);
    gRough = 0.5; gMetal = 0.25; gNm = vec3(0.0, 0.0, 1.0);
    // By night the steel keeps its own paint, dimly: it is the bulbs along its frame that light the tower. The
    // warning lights at the top flash for aircraft: on for half of every 1.6 seconds.
    float beat = fract(uTime / 1.6), flash = mix(1.0, 0.08 + 0.92 * smoothstep(0.0, 0.07, beat) * (1.0 - smoothstep(0.45, 0.58, beat)), lampOn * step(vColor.g, 0.037 * vColor.r));
    // (lit up, the painted steel shows a clear red — not the orange of its paint by day — and the white bands a warm gold)
    vec3 steel = vColor.r > 2.0 * vColor.g ? vec3(0.5, 0.03, 0.012) : vColor.rgb * vec3(0.62, 0.46, 0.22);
    gEmissive = mix(steel, vColor.rgb * 1.6 * flash, lampOn) * uNight;
  }

  if (kind < 0.5 && cellW > 0.5) {
    float fyAll = v / floorH, row = floor(fyAll), col = floor(u);
    // Per-room random numbers. The seed is interpolated, so it carries rounding noise: hash only
    // integers derived from it (meshing.js stores seeds as multiples of 1/4096).
    float sid = floor(seed * 4096.0 + 0.5);
    vec2 room = vec2(col + mod(sid, 61.0) * 17.0, row + mod(sid, 53.0) * 13.0);
    float fx = fract(u), fy = fract(fyAll);
    float wx = max(fwidth(u), 1e-4), wy = max(fwidth(fyAll), 1e-4);
    float far = smoothstep(0.2, 0.6, max(wx, wy));                   // the grid aliases far away

    // window rectangle within one bay: [x0, x1] x [y0, y1]
    vec4 r = vec4(0.14, 0.86, 0.3, 0.82);                            // apartments, offices
    if (cat < 0.5) r = vec4(0.26, 0.74, 0.36, 0.78);                 // houses
    else if (cat > 3.5 && cat < 4.5) r = vec4(0.16, 0.84, 0.3, 0.8); // public
    else if (cat > 4.5) r = vec4(0.0, 1.0, 0.26, 1.0);               // curtain wall: glass above a spandrel
    bool shop = row < 0.5 && cat > 1.5 && cat < 3.5;
    if (shop) r = vec4(0.05, 0.95, 0.03, 0.8);                       // ground-floor shopfront
    float valid = step(0.0, v) * step(v, height - 0.9);
    // houses and apartments: some bays are plain wall
    if (cat < 2.5 && !shop) valid *= step(0.2, hash12(room + 41.0));
    float inWin = box(fx, r.x, r.y, wx) * box(fy, r.z, r.w, wy) * valid;

    // frame and mullions, measured in metres from the window edge
    vec2 wmin = vec2(r.x * cellW, r.z * floorH), wmax = vec2(r.y * cellW, r.w * floorH);
    vec2 pm = vec2(fx * cellW, fy * floorH);
    float edge = min(min(pm.x - wmin.x, wmax.x - pm.x), min(pm.y - wmin.y, wmax.y - pm.y));
    float fw = cat > 4.5 ? 0.045 : 0.065, ew = max(fwidth(edge), 1e-4);
    float frame = 1.0 - smoothstep(fw - ew, fw + ew, edge);
    float panes = max(1.0, floor((wmax.x - wmin.x) / 1.25 + 0.5));
    float mx = fract((pm.x - wmin.x) / (wmax.x - wmin.x) * panes);
    float mw = 0.03 * panes / (wmax.x - wmin.x);
    frame = max(frame, panes > 1.5 ? 1.0 - box(mx, mw, 1.0 - mw, max(fwidth(mx), 1e-4)) : 0.0);
    frame *= 1.0 - far;
    float pane = inWin * (1.0 - frame);

    // interior mapping: intersect the view ray with a room box behind the glass
    vec3 V = normalize(vWPos - cameraPosition);
    vec3 rd = vec3(dot(V, gT) / cellW, dot(V, gB) / floorH, dot(V, gN) / 4.5) + vec3(1e-5, 1e-5, 0.0);
    vec3 ro = vec3(fx, fy, 0.0);
    vec2 tA = (step(0.0, rd.xy) - ro.xy) / rd.xy;
    float tz = -1.0 / min(rd.z, -1e-4);
    float tHit = min(min(tA.x, tA.y), tz);
    vec3 hp = ro + rd * tHit;
    float rh = hash12(room);
    vec3 interior = mix(vec3(0.74, 0.69, 0.6), vec3(0.6, 0.63, 0.68), rh);
    float shade = 0.62;                                              // side walls
    if (tHit == tz) shade = 0.5 + 0.28 * step(0.42, hp.y);          // back wall above a furniture band
    else if (tHit == tA.y) shade = rd.y > 0.0 ? 1.0 : 0.38;         // ceiling, floor
    interior *= shade * mix(1.0, 0.5, clamp(-hp.z, 0.0, 1.0));
    // blinds or curtains pulled part-way down some windows
    float blind = step(0.5, hash12(room + 7.7)) * hash12(room + 3.1);
    float wyLocal = (fy - r.z) / (r.w - r.z);
    if (!shop && wyLocal > 1.0 - blind * 0.85) interior = mix(vec3(0.8, 0.78, 0.72), vec3(0.68, 0.7, 0.74), rh) * 0.75;
    interior = mix(interior, vec3(0.42, 0.42, 0.4), far);            // far away: the average room

    // lit rooms at night: shops and offices more often than homes
    float onRate = shop ? 0.75 : cat > 2.5 ? 0.32 : 0.22;
    // No two buildings alike: one is asleep and the next is busy; many offices are lit by the floor (a whole
    // storey working late, the one above dark).
    float b1 = fract(seed * 11.7), b2 = fract(seed * 17.3), b3 = fract(seed * 23.9);
    onRate *= mix(0.35, 1.9, b1);
    if (!shop && cat > 2.5 && b2 > 0.4) onRate = mix(0.05, 0.9, step(0.5, hash12(vec2(row * 3.0 + mod(sid, 37.0), mod(sid, 53.0)))));
    // A tower at night is mostly dark glass: a few storeys lit as bands, the rest a mirror for the city.
    float tall = smoothstep(70.0, 110.0, height);
    if (!shop) onRate = mix(onRate, 0.02 + 0.8 * step(0.9, hash12(vec2(row * 5.0 + mod(sid, 41.0), mod(sid, 59.0)))), tall);
    onRate = clamp(onRate, 0.0, 0.95);
    // Some rooms stay as they are all night. The others (uWindowLife.x of them) are lived in: every so often,
    // each room on its own clock (90 to 330 s of the windows' clock uWindowLife.y), someone may come in or
    // leave, and the light goes on or off over a moment. Which rooms, and when, is by chance: each room draws
    // anew for every stretch of its own clock.
    float fickle = step(1.0 - uWindowLife.x, hash12(room + 31.0));
    float period = 90.0 + 240.0 * hash12(room + 37.0);
    float clock = uWindowLife.y / period + hash12(room + 41.0) * 64.0, slot = floor(clock);
    // (the draw for a stretch: small numbers only, so that the chance stays good however long the clock has run)
    vec2 was = vec2(mod(slot - 1.0, 61.0) * 7.13, mod(slot - 1.0, 47.0) * 3.71), now = vec2(mod(slot, 61.0) * 7.13, mod(slot, 47.0) * 3.71);
    float lit = mix(step(1.0 - onRate, hash12(room + 43.0 + was)), step(1.0 - onRate, hash12(room + 43.0 + now)), smoothstep(0.0, 4.0 / period, fract(clock)));
    float on = mix(step(1.0 - onRate, hash12(room + 23.0)), lit, fickle);
    // The colour of the light: homes mostly warm bulbs, some cool, the odd blue of a television; an office
    // building one kind of tube throughout, cool white more often than warm. Brightness varies room by room
    // and building by building.
    float tint = hash12(room + 61.0), office = step(2.5, cat);
    vec3 warm = mix(vec3(1.0, 0.6, 0.3), vec3(1.0, 0.82, 0.6), hash12(room + 67.0));
    // (uNightBlue leans the city towards blue: bluer cool lamps, more of them, more rooms in screen light)
    vec3 cool = mix(vec3(1.0, 0.95, 0.86), mix(vec3(0.78, 0.9, 1.0), vec3(0.42, 0.66, 1.0), uNightBlue), hash12(room + 71.0));
    float coolShare = mix(0.25, mix(0.12, 0.95, step(0.35, b2)), office) + 0.45 * uNightBlue;
    vec3 lamp = mix(warm, cool, step(1.0 - coolShare, mix(tint, 0.5 * b3 + 0.5 * tint, office)));
    lamp = mix(lamp, vec3(0.3, 0.55, 1.0), step(0.93 - 0.22 * uNightBlue, tint) * mix(1.0 - office, 1.0, uNightBlue));
    float glow = mix(0.3, 1.35, hash12(room + 1.3)) * mix(0.65, 1.25, b3);

    // glass: mostly a mirror of the sky; the room behind shows through as emitted light
    vec3 glassTint = cat > 4.5 ? mix(vec3(0.2, 0.3, 0.38), vec3(0.3, 0.33, 0.34), fract(seed * 5.7)) : vec3(0.1, 0.11, 0.12);
    vec3 frameCol = fract(seed * 3.3) < 0.5 ? vec3(0.16, 0.17, 0.18) : vec3(0.62, 0.63, 0.63);
    diffuseColor.rgb = mix(diffuseColor.rgb, frameCol, inWin * frame);
    diffuseColor.rgb = mix(diffuseColor.rgb, glassTint, pane);
    gRough = mix(gRough, 0.45, inWin * frame);
    gRough = mix(gRough, 0.05, pane);
    gMetal = mix(gMetal, 0.92, pane);
    // (the panes are flat but for a trace: the glass mirrors the world as it is)
    float tilt = 0.008;
    gNm = mix(gNm, normalize(vec3((hash12(room + 5.1) - 0.5) * tilt, (hash12(room + 9.4) - 0.5) * tilt, 1.0)), inWin);
    float daylight = (1.0 - uNight) * (shop ? 0.3 : cat > 4.5 ? 0.06 : 0.12);
    // A lit room is not an even bright panel (uSoft: 0 as it was .. 1). The light comes from a lamp somewhere in
    // it, brightest there and falling away towards the corners of the window; in many rooms a curtain or a blind
    // is drawn and the whole window glows evenly and more dimly, in the colour of the cloth; the colours are
    // nearer to one another, and some of the light spills on the frame and on the wall round the window.
    {
      vec2 inPane = vec2((fx - r.x) / (r.y - r.x), (fy - r.z) / (r.w - r.z));
      vec2 lampAt = vec2(0.25 + 0.5 * hash12(room + 12.1), 0.55 + 0.35 * hash12(room + 14.9));
      float fall = mix(1.0, 0.32 + 0.95 * exp(-3.2 * dot(inPane - lampAt, inPane - lampAt)), uSoft);
      float curtain = step(0.52, hash12(room + 16.3)) * uSoft * (shop ? 0.0 : 1.0);
      vec3 cloth = mix(vec3(0.95, 0.82, 0.62), vec3(0.85, 0.86, 0.84), hash12(room + 18.7)) * 0.42;
      vec3 soft = mix(lamp, mix(vec3(1.0, 0.8, 0.58), lamp, 0.45), uSoft);          // (less colour between rooms)
      vec3 room3 = mix(interior * fall, cloth * (0.75 + 0.35 * fall), curtain);
      float power = uNight * on * glow * mix(1.25, 0.78, uSoft) * uRoomLight;
      gEmissive = pane * (interior * daylight + room3 * soft * power);
      // the spill: on the frame and mullions, and a hand's breadth of wall round the opening
      float spill = uSoft * (1.0 - far) * valid * power * 0.16;
      gEmissive += soft * spill * (inWin * frame * 0.6 + (1.0 - inWin) * exp(min(edge, 0.0) * 4.5) * step(-0.9, edge));
    }
    // The sun in the glass. Each pane sits a little out of true and float glass is never quite flat, so the
    // mirrored sun is a hot core with a glare around it that wanders from pane to pane as the view moves. The
    // third, wide term is not physics: the true mirror image is only seen from below the sun's own height, and
    // this lets glass facing the sun catch some of its light from the air too.
    {
      vec3 wobble = vec3(vnoise(st * 0.8 + seed * 9.0) - 0.5, vnoise(st * 0.8 + 31.0 + seed * 9.0) - 0.5, 0.0) * 0.035;
      vec3 paneN = normalize(gT * (gNm.x + wobble.x) + gB * (gNm.y + wobble.y) + gN * gNm.z);
      float s = max(dot(reflect(normalize(vWPos - cameraPosition), paneN), uSunDir), 0.0);
      gGlint = pane * uGlintOn * uSunGlint * (pow(s, 1400.0) * 14.0 + pow(s, 90.0) * 0.35 + pow(s, 7.0) * 0.1) * step(0.0, dot(gN, uSunDir));
      // glass: a soft wash of the sun on panes that face it, pane by pane a little different, and the sheen of
      // the sky on glass seen at a glancing angle (by day)
      vec3 toEye = normalize(cameraPosition - vWPos);
      float graze = pow(1.0 - max(dot(toEye, gN), 0.0), 3.0);
      gGlint += pane * uGlass * uSunGlint * 0.035 * max(dot(paneN, uSunDir), 0.0) * (0.6 + 0.8 * hash12(room + 15.7));
      gEmissive += pane * uGlass * (1.0 - uNight) * vec3(0.45, 0.6, 0.82) * (0.015 + 0.22 * graze) * (0.7 + 0.6 * hash12(room + 19.3));
    }
    // Some towers (more of them as uNightBlue rises) are lit in one colour throughout: their lit rooms shine
    // blue or golden yellow — a few cyan or violet — instead of white. (Window light only: thin lines of light
    // along edges and floors shimmer at a distance.)
    {
      float pickA = fract(seed * 31.7), hue = fract(seed * 47.3);
      float accent = tall * step(0.7 - 0.45 * uNightBlue, pickA) * uNight;
      vec3 accentCol = hue < 0.42 ? vec3(0.12, 0.38, 1.0) : hue < 0.76 ? vec3(1.0, 0.72, 0.16) : hue < 0.89 ? vec3(0.1, 0.85, 1.0) : vec3(0.75, 0.3, 1.0);
      gEmissive = mix(gEmissive, accentCol * dot(gEmissive, vec3(0.9)), accent * 0.8);
    }
    // The city in the glass of a tower at night. The mirrored view ray is followed down to street level, where
    // the lights of the city lie as a field of points fixed to the ground (a lamp or a window every 26 m or
    // so, warm or cool), so the reflection slides over the glass as the view moves, as a real one does.
    if (tall > 0.0 && uNight > 0.01 && uCityGlass > 0.0) {
      vec3 paneN = normalize(gT * gNm.x + gB * gNm.y + gN * gNm.z), R = reflect(V, paneN);
      float fresnel = 0.1 + 0.9 * pow(1.0 - max(dot(-V, paneN), 0.0), 4.0);
      vec3 city = vec3(0.0);
      if (R.y < -0.015) {
        float reach = (vWPos.y - 12.0) / -R.y;                      // metres along the ray to street level
        vec2 g = (vWPos.xz + R.xz * reach) / 26.0, cell = floor(g);
        vec2 at = vec2(hash12(cell + 3.1), hash12(cell + 7.7));
        float d = length(fract(g) - at) * 26.0, kind = hash12(cell + 13.0);
        float spot = exp(-d * d / (3.0 + reach * 0.03)) * step(0.3, kind);
        vec3 tintC = kind > 0.8 - 0.3 * uNightBlue ? mix(vec3(0.8, 0.9, 1.0), vec3(0.4, 0.65, 1.0), uNightBlue) : kind > 0.42 && kind < 0.5 ? vec3(1.0, 0.25, 0.2) : vec3(1.0, 0.72, 0.42);
        city = tintC * spot * 5.0 / (1.0 + reach * reach / 4.0e5);
        city += vec3(1.0, 0.75, 0.5) * 0.035 * smoothstep(0.0, 900.0, reach);  // and their haze towards the horizon
      }
      gEmissive += city * fresnel * pane * tall * uNight * uCityGlass * (1.0 - on * 0.9);
    }
    gPane = pane * (1.0 - 0.7 * far) * (1.0 - 0.85 * uNight * on); // (a lit room shows itself, not a reflection)
    // the lintel shades the top of the opening
    diffuseColor.rgb *= 1.0 - 0.35 * inWin * (1.0 - smoothstep(0.0, 0.18, wmax.y - pm.y)) * (1.0 - far);

    // sign band over shopfronts
    if (shop) {
      float sign = box(fy, 0.84, 0.985, wy) * box(fx, 0.03, 0.97, wx) * valid * step(0.25, hash12(room + 57.0));
      vec3 sc = mix(hue(hash12(room + 71.0)), vec3(0.95), 0.35 * step(0.6, hash12(room + 83.0)));
      diffuseColor.rgb = mix(diffuseColor.rgb, sc * 0.75, sign);
      gEmissive += sign * sc * uNight * 1.6;
      gRough = mix(gRough, 0.4, sign);
    }
  }
  } // (the plain buildings: see NJ_FACADE_MAIN)
}
`,L=new n(new Uint8Array([128,128,128,255]),1,1);L.needsUpdate=!0;var R=`
uniform sampler2D uPhoto;
uniform float uPhotoOn;
uniform vec2 uPhotoRange;
uniform float uPhotoMix;
varying vec2 vPhoto;
varying float vMark; // 1 on a landmark (landmarks.js)
`,z=`
{
  vec3 photo = texture2D(uPhoto, vPhoto).rgb; // (sampled outside the branch: derivatives)
  // (a landmark is known by its own look: it keeps its photograph from close by as well)
  float k = uPhotoOn * uPhotoMix * step(0.0, vPhoto.x) * max(smoothstep(uPhotoRange.x, uPhotoRange.y, distance(cameraPosition, vWPos)), step(0.5, vMark));
  diffuseColor.rgb = mix(diffuseColor.rgb, photo * 1.12, k);
  gRough = mix(gRough, 0.85, k);
  gMetal *= 1.0 - k;
}
`,B=`
uniform float uDark;
float gPlain = 1.0; // how plain this fragment is (0: a landmark that keeps its look)
`,V=e=>`#include <lights_fragment_end>
{
  float shadeLum = dot(reflectedLight.indirectDiffuse, vec3(0.2126, 0.7152, 0.0722));
  reflectedLight.indirectDiffuse = mix(reflectedLight.indirectDiffuse, shadeLum * vec3(1.0, 0.985, 0.96), ${e});
}`,H=e=>`
{
  vec3 photo = texture2D(uPhoto, vPhoto).rgb; // (sampled outside any branch: derivatives)
${e?`  // a landmark keeps the photograph of its walls, at any distance (its roofs keep theirs: streamer.js)
  float shown = uPhotoOn * step(0.0, vPhoto.x) * step(0.5, vMark);
  diffuseColor.rgb = mix(diffuseColor.rgb, photo * 1.12, shown);
  gRough = mix(gRough, 0.85, shown);
  gMetal *= 1.0 - shown;`:``}
  float lattice = step(3.5, vBldg.z);
  float plain = ${e?`1.0 - max(step(0.5, vMark), lattice)`:`1.0`};
  float lum = dot(diffuseColor.rgb, vec3(0.3, 0.59, 0.11));
  float sort = mod(vBldg.y, 8.0), shop = step(1.5, sort) * (1.0 - step(3.5, sort) * step(sort, 4.5));
  float roof = step(0.5, abs(gN.y));
  vec3 pale = mix(${A(k.home)}, ${A(k.shop)}, shop) * mix(1.0, 1.14, roof) * mix(0.93, 1.0, smoothstep(0.03, 0.22, lum));
  pale *= mix(1.0, 0.22, uDark); // (by night the model is dark: it is seen by its own dim colour, below)
  gPlain = plain;
  diffuseColor.rgb = mix(diffuseColor.rgb, pale, plain);
  gRough = mix(gRough, 0.92, plain);
  gMetal *= 1.0 - plain;
  gNm = normalize(mix(gNm, vec3(0.0, 0.0, 1.0), plain));
  gPane *= 1.0 - plain;
  gGlint *= 1.0 - plain;
  vec3 dusk = mix(${A(k.night.home)}, ${A(k.night.shop)}, shop) * mix(0.6 + 0.34 * dot(gN, normalize(vec3(0.5, 0.0, 0.85))), 1.45, roof);
  gEmissive = mix(gEmissive, gEmissive * 0.55 * (1.0 - lattice) + dusk * uDark, plain); // (no floodlights on a plain tower)
}
`,U=`
float gJamb = 0.0, gJambShade = 1.0, gReveal = 0.0;
`,W=`
    {
      float deep = (shop ? 0.1 : cat > 4.5 ? 0.0 : 0.24) * (1.0 - far);
      vec3 toWall = normalize(vWPos - cameraPosition);
      vec2 slide = vec2(dot(toWall, gT), dot(toWall, gB)) / max(-dot(toWall, gN), 0.12) * deep;
      vec2 pg = pm + slide;                                   // where the ray meets the glass
      vec2 below = wmin - pg, above = pg - wmax;              // > 0: beyond the opening on that side
      float out2 = max(max(below.x, above.x), max(below.y, above.y));
      gJamb = inWin * step(0.0, out2) * step(1e-4, deep);
      // which side of the opening is seen: its sill, its head, or a side lit by how it faces the sun
      vec3 side = above.x > max(below.x, max(below.y, above.y)) ? -gT : below.x > max(below.y, above.y) ? gT : below.y > above.y ? gB : -gB;
      gJambShade = 0.5 + 0.75 * max(dot(side, uSunDir), 0.0) + 0.2 * side.y;
      // the shadow of the wall on the glass: the sun's ray to this point of the glass passes the face of the wall
      float sunN = dot(uSunDir, gN);
      vec2 through = pg + vec2(dot(uSunDir, gT), dot(uSunDir, gB)) / max(sunN, 0.08) * deep;
      vec2 edge2 = min(through - wmin, wmax - through);
      gReveal = step(0.0, sunN) * (1.0 - smoothstep(-0.02, 0.03, min(edge2.x, edge2.y))) * inWin * step(1e-4, deep);
      pm = pg;
    }
`,G=`
uniform sampler2D uBurn;
uniform vec4 uBurnRect;
uniform float uStoryDay;
`,K=`
float njBurn = 0.0;
float njH = aFacade.y; // (integrator 11-10) the height the fragment shader's pattern is read at: lowered with a wall that has fallen
{
  float njCat = aBldg.y - floor(aBldg.y / 8.0 + 0.01) * 8.0;
  vec2 buv = (aPhoto - uBurnRect.xy) / uBurnRect.zw;
  if (njCat > 5.5 && buv.x >= 0.0 && buv.y >= 0.0 && buv.x < 1.0 && buv.y < 1.0) {
    ivec2 bsz = textureSize(uBurn, 0);
    float day = texelFetch(uBurn, min(ivec2(buv * vec2(bsz)), bsz - 1), 0).r * 64.0;
    if (day > 0.0) {
      // (the houses of a burning street do not all go at once: up to an hour apart, by their seed)
      float lag = fract(floor(aFacade.w * 4096.0 + 0.5) * 0.6180339) * 0.04;
      float t = uStoryDay - day - lag; // days since this one caught fire
      // (above 1: days since it burnt out, for the snow on the ruins)
      njBurn = smoothstep(0.0, 0.1, t) + clamp(t - 0.1, 0.0, 30.0);
      float fall = smoothstep(0.03, 0.12, t);
      float k = aBldg.z;
      if (fall > 0.0 && ((k > 10.5 && k < 15.5) || (k > 17.5 && k < 18.5))) {
        float base = transformed.y - aFacade.y;
        float above = transformed.y - (base + aBldg.x); // height over the eaves (roofs); below 0 on a shop front
        vec3 heap = vec3(aPhoto.x + (transformed.x - aPhoto.x) * 0.8, base + 0.25 + 0.4 * clamp(above + 0.3, 0.0, 2.5), aPhoto.y + (transformed.z - aPhoto.y) * 0.8);
        if (k < 11.5) heap = vec3(transformed.x, base + 0.08 + max(aFacade.y, 0.0) * 0.03, transformed.z);
        transformed = mix(transformed, heap, fall);
      }
      // (integrator 11-10) a timber-framed house burnt out: after its roof has come down, its brick and lime walls (and the coping on them) follow
      // over the next ten hours, to a ragged stump half a metre to two and a half high (推测, by the photographs of the burnt streets: low wall
      // stumps and rubble, not standing shells; B2 of the photo findings). The Republican buildings (category 7) keep their shell.
      float wfall = smoothstep(0.12, 0.5, t) * (njCat < 6.5 ? 1.0 : 0.0);
      if (wfall > 0.0 && ((k > 9.5 && k < 10.5) || (k > 16.5 && k < 17.5))) {
        float sdN = floor(aFacade.w * 4096.0 + 0.5);
        float sx = fract(sin(dot(vec2(floor(aFacade.x * 0.8) + sdN * 0.37, sdN * 1.91), vec2(12.9898, 78.233))) * 43758.5453);
        float stump = 0.5 + 2.0 * fract(sdN * 0.6180339 + sx * 0.7);
        float top = mix(aFacade.y, min(aFacade.y, stump), wfall);
        transformed.y = (transformed.y - aFacade.y) + top - (k > 16.5 ? 0.04 * wfall : 0.0);
        njH = top;
      }
    }
  }
}
`,q=new o;q.onBeforeCompile=e=>{Object.assign(e.uniforms,{uBurn:w.uBurn,uBurnRect:w.uBurnRect,uStoryDay:w.uStoryDay}),e.vertexShader=e.vertexShader.replace(`#include <common>`,`#include <common>\nattribute vec4 aFacade;\nattribute vec4 aBldg;\nattribute vec2 aPhoto;\n${G}`).replace(`#include <begin_vertex>`,`#include <begin_vertex>\n${K}`)},q.customProgramCacheKey=()=>`nj-facade-depth-v1`;function J(e){let t=O(new s({vertexColors:!0,roughness:.85,metalness:0,side:2}));return t.userData.photo={value:L},t.userData.photoOn={value:0},t.onBeforeRender=(e,t,n,r,i)=>{i.customDepthMaterial===void 0&&(i.customDepthMaterial=q)},t.onBeforeCompile=n=>{Object.assign(n.uniforms,{uLampOn:{value:0},uLampMap:w.uLampMap,uPhoto:t.userData.photo,uPhotoOn:t.userData.photoOn,uPhotoRange:w.uPhotoRange,uPhotoMix:w.uPhotoMix,uNight:w.uNight,uTime:w.uTime,uWindowLife:w.uWindowLife,uCityGlass:w.uCityGlass,uRoomLight:w.uRoomLight,uSoft:w.uSoft,uGlass:w.uGlass,uNightBlue:w.uNightBlue,uSunDir:w.uSunDir,uSunGlint:w.uSunGlint,uGlintOn:w.uGlintOn,uWallAlb:{value:e.wall.albedo},uWallNor:{value:e.wall.normal},uWallScale:{value:e.wall.scales},uWallDetail:{value:e.wall.details},uBurn:w.uBurn,uBurnRect:w.uBurnRect,uStoryDay:w.uStoryDay,uSnow:w.uSnow??{value:0},uSign:w.uSign}),n.vertexShader=n.vertexShader.replace(`#include <common>`,`#include <common>\nattribute vec4 aFacade;\nattribute vec4 aBldg;\nattribute vec2 aPhoto;\nattribute float aMark;\nvarying float vMark;\nvarying vec4 vFacade;\nvarying vec4 vBldg;\nvarying vec2 vPhoto;\nvarying float vBurn;\n${G}${M}`).replace(`#include <begin_vertex>`,`#include <begin_vertex>\nvFacade = aFacade;\nvBldg = aBldg;\nvPhoto = aPhoto;\nvMark = aMark;\n${K}vBurn = njBurn;\nvFacade.y = njH;\n${N}`),n.fragmentShader=n.fragmentShader.replace(`#include <common>`,`#include <common>
`+F+R).replace(`#include <color_fragment>`,`#include <color_fragment>
`+I+z).replace(`#include <roughnessmap_fragment>`,`#include <roughnessmap_fragment>
roughnessFactor = gRough;`).replace(`#include <metalnessmap_fragment>`,`#include <metalnessmap_fragment>
metalnessFactor = gMetal;`).replace(`#include <normal_fragment_maps>`,`#include <normal_fragment_maps>
`+P).replace(`#include <emissivemap_fragment>`,`#include <emissivemap_fragment>
totalEmissiveRadiance += gEmissive;`).replace(`#include <lights_fragment_end>`,`#include <lights_fragment_end>
reflectedLight.directSpecular += gGlint * smoothstep(0.0, 0.002, dot(reflectedLight.directDiffuse, vec3(0.333)));`).replace(`#include <opaque_fragment>`,`#include <opaque_fragment>
gl_FragColor.a = 1.0 - 0.95 * gPane;`);let r=(e,t,n)=>(e.includes(t)||console.warn(`facade: the shader has changed; a variant is not applied`),e.replace(t,n));if(T.windows||(n.fragmentShader=r(n.fragmentShader,`cellW = vBldg.w;`,`cellW = 0.0;`)),T.relief){let e=n.fragmentShader;e=r(e,`float gPane = 0.0;`,`float gPane = 0.0;`+U),e=r(e,`    vec2 pm = vec2(fx * cellW, fy * floorH);
`,`    vec2 pm = vec2(fx * cellW, fy * floorH);
`+W),e=r(e,`    float pane = inWin * (1.0 - frame);`,`    float pane = inWin * (1.0 - frame) * (1.0 - gJamb);`),e=r(e,`    gRough = mix(gRough, 0.05, pane);`,`    gRough = mix(gRough, 0.05, pane);
    diffuseColor.rgb = mix(diffuseColor.rgb, wall * gJambShade, gJamb);
    diffuseColor.rgb *= 1.0 - 0.45 * gReveal * pane;
    gRough = mix(gRough, 0.85, gJamb);`),e=r(e,`float daylight = (1.0 - uNight) * (shop ? 0.3 : cat > 4.5 ? 0.06 : 0.12);`,`float daylight = (1.0 - uNight) * (shop ? 0.3 : cat > 4.5 ? 0.06 : 0.12) * (1.0 - 0.6 * gReveal);`),e=r(e,`* step(0.0, dot(gN, uSunDir));`,`* step(0.0, dot(gN, uSunDir)) * (1.0 - gReveal);`),n.fragmentShader=e}T.abstract&&(n.uniforms.uDark=w.uDark,n.fragmentShader=r(r(r(n.fragmentShader,R,R+B),z,H(T.landmarks)),`#include <lights_fragment_end>`,V(`0.92 * gPlain`)))},t.customProgramCacheKey=()=>`facade-v39nj`+D(),t}var Y=`
uniform sampler2DArray uGroundAlb;
uniform sampler2DArray uGroundNor;
uniform float uGroundScale[4];
uniform float uFixedLayer;
uniform sampler2D uOrtho;
uniform vec4 uOrthoRect;
uniform float uOrthoOn;
uniform sampler2D uGroundClass;
uniform float uGroundClassOn;
uniform float uSnow;
uniform float uTime;
uniform sampler2D uMirror;
uniform mat4 uMirrorMatrix;
uniform float uMirrorOn;
uniform float uMirrorLevel;
uniform float uDark;
uniform sampler2D uCloudMap;
uniform vec2 uCloudOffset;
uniform float uCloudCover, uCloudBase, uCloudsOn, uCloudFade;
uniform mat4 uWorldToECEF;
uniform vec4 uCloudRect;
varying float vLayer;
varying vec3 vWPos;
varying vec3 vWNrm;
vec3 gT, gB, gN, gNm;
float gRough;
float gMetal = 0.0;
float gWater = 0.0; // 1 on water: written to alpha for the reflection pass, which mirrors the world in it
vec3 gWaveN = vec3(0.0, 1.0, 0.0); // the water's surface normal with its ripples (world space)
${j}
${h}
// Where a point of the globe lies in the clouds' weather map (as the cloud pass maps it: three-clouds, clouds.glsl).
vec2 cloudMapUv(vec3 position) {
  vec3 n = normalize(position), f = abs(n), c = n / max(f.x, max(f.y, f.z));
  vec2 m;
  if (all(greaterThan(f.yy, f.xz))) m = c.y > 0.0 ? vec2(-n.x, n.z) : n.xz;
  else if (all(greaterThan(f.xx, f.yz))) m = c.x > 0.0 ? n.yz : vec2(-n.y, n.z);
  else m = c.z > 0.0 ? n.xy : vec2(n.x, -n.y);
  vec2 m2 = m * m;
  float q = dot(m2.xy, vec2(-2.0, 2.0)) - 3.0;
  vec2 uv;
  uv.x = sqrt(1.5 + m2.x - m2.y - 0.5 * sqrt(-24.0 * m2.x + q * q)) * (m.x > 0.0 ? 1.0 : -1.0);
  uv.y = sqrt(6.0 / (3.0 - uv.x * uv.x)) * m.y;
  return uv * 0.5 + 0.5;
}
// How much cloud a ray from p towards dir (upwards) meets: 0 clear sky .. 1 cloud. The same weather map and
// cover as the cloud pass, without its fine shapes: the clouds are where they are in the sky, a little softer.
float cloudAbove(vec3 p, vec3 dir) {
  if (uCloudsOn < 0.5 || dir.y < 0.03) return 0.0;
  vec3 at = p + dir * ((uCloudBase + 320.0 - p.y) / dir.y);
  vec2 weather = texture2D(uCloudMap, cloudMapUv((uWorldToECEF * vec4(at, 1.0)).xyz) * 100.0 + uCloudOffset).rg;
  vec2 beyond = max(uCloudRect.xy - at.xz, at.xz - uCloudRect.zw);
  weather *= 1.0 - smoothstep(0.0, uCloudFade, max(beyond.x, beyond.y));
  // (the cloud pass wears the weather map down with its shape noise: only the thicker parts are cloud)
  float edge = 1.0 - 1.25 * uCloudCover;
  return smoothstep(edge, edge + 0.22, max(weather.r, weather.g)) * smoothstep(0.03, 0.14, dir.y);
}
// (Nanjing 1937, wave 3d, watersurface 11-10) the water: its map, colours by body, the ripples (water_look.js)
${v}
`,X=`
{
  gN = normalize(vWNrm);
  gT = normalize(cross(gN, vec3(0.0, 0.0, 1.0)) + vec3(1e-4, 0.0, 0.0));
  gB = cross(gT, gN); // +z on flat ground, matching the texture's v axis
  vec3 tint = diffuseColor.rgb;
  float layer = uFixedLayer >= 0.0 ? uFixedLayer : floor(vLayer + 0.5);
  bool water = layer > 3.5;
  layer = min(layer, 3.0);
  float sc = uGroundScale[int(layer)];
  vec2 st = abs(gN.y) > 0.5 ? vWPos.xz : vec2(vWPos.x + vWPos.z, vWPos.y);
  vec3 a = texture(uGroundAlb, vec3(st / sc, layer)).rgb * 2.0;
  // a second, larger sample hides the repeat
  vec3 b = texture(uGroundAlb, vec3(st / (sc * 3.7) + 0.37, layer)).rgb * 2.0;
  float blotch = vnoise(st * 0.045);
  diffuseColor.rgb *= mix(a, b, 0.4) * (0.86 + 0.28 * blotch);
  // (grass: the green of its texture on the green of its tint is an emerald no lawn has — it is brought back to the
  // yellower, greyer green of real turf, lighter and darker in patches)
  if (layer > 1.5 && layer < 2.5 && !water) {
    float turf = dot(diffuseColor.rgb, vec3(0.3, 0.59, 0.11));
    diffuseColor.rgb = mix(vec3(turf), diffuseColor.rgb, 0.58) * vec3(1.12, 1.0, 0.8) * (0.9 + 0.2 * vnoise(st * 0.011 + 3.7));
  }
  gNm = texture(uGroundNor, vec3(st / sc, layer)).xyz * 2.0 - 1.0;
  gNm = normalize(vec3(gNm.xy * 0.8, gNm.z));
  gRough = layer < 0.5 ? 0.86 - 0.12 * blotch : 0.93;
  // Pavements: the pale concrete pavers of a Japanese footway — oblongs of 60 by 30 cm laid in running bond,
  // each a shade of its own, with dark joints between them (fading out where they are smaller than a pixel).
  if (layer > 0.5 && layer < 1.5 && !water) {
    vec2 q = st / vec2(0.6, 0.3);
    q.x += 0.5 * mod(floor(q.y), 2.0);
    vec2 slab = floor(q), f = fract(q), w = fwidth(st) / vec2(0.6, 0.3);
    float fine = 1.0 - smoothstep(0.3, 0.9, max(w.x, w.y));
    vec2 edge = min(f, 1.0 - f) * vec2(0.6, 0.3);                       // metres to the nearest joint
    float joint = 1.0 - smoothstep(0.004, 0.011 + 0.6 * fwidth(st.x), min(edge.x, edge.y));
    float grey = dot(tint, vec3(0.3, 0.59, 0.11));
    vec3 paver = mix(tint, vec3(grey) * vec3(0.99, 1.0, 1.02), 0.65) * 1.12;
    paver *= (0.92 + 0.16 * hash12(slab)) * (0.96 + 0.08 * vnoise(st * 14.0));
    paver = mix(paver, paver * 0.55, joint);
    diffuseColor.rgb = mix(diffuseColor.rgb, paver, fine);
    gNm = normalize(mix(gNm, vec3(0.0, 0.0, 1.0), 0.75 * fine));
    gRough = mix(gRough, 0.88, fine);
  }
  // (Nanjing 1937, ground area, fabric 11-10) road surfaces: worn and patched asphalt, dusty macadam with potholes, sand-gravel and
  // earth with ruts, lanes of stone slabs. The kind comes from the surface's layer and tint (meshing.js NJ_ROAD: layer 0 is
  // asphalt, paler = macadam; layer 3 is gravel, a lane of slabs or an earth verge); the way the road runs from the class map
  // (ground.py: the road mask's own orientation). Only the flat top of a road: kerbs and parapets keep their own look.
  if (uFixedLayer < 0.0 && !water && gN.y > 0.9) {
    int rk = -1;
    if (layer < 0.5) rk = tint.g > 0.12 ? 1 : 0;
    else if (layer > 2.5) rk = tint.r > 0.22 ? 2 : (tint.b > 0.115 ? 3 : 4);
    if (rk >= 0) {
      vec2 fuv = (vWPos.xz - uOrthoRect.xy) / uOrthoRect.zw;
      float fang = 0.0;
      // (load 11-17: uGroundClassOn fades 0 -> 1 over 0.8 s when the map arrives; at 1 everything is as before)
      if (uGroundClassOn > 0.0 && fuv.x > 0.0 && fuv.x < 1.0 && fuv.y > 0.0 && fuv.y < 1.0) fang = texture2D(uGroundClass, vec2(fuv.x, 1.0 - fuv.y)).g * 3.14159265;
      // (fabric 11-10 pass 3) a lane is narrower than a map texel: under its edge the texel is not a lane's and holds a field's angle, and a
      // slab lattice turned from one texel to the next broke into triangles of crossing joints. A lane takes the angle of the nearest
      // street / lane texel (class 5) of the 3 x 3 round it (ground.py carries one angle for the whole lane there).
      if (uGroundClassOn > 0.0 && rk == 3 && fuv.x > 0.0 && fuv.x < 1.0 && fuv.y > 0.0 && fuv.y < 1.0) {
        vec2 fts = vec2(textureSize(uGroundClass, 0));
        vec2 ftp = vec2(fuv.x, 1.0 - fuv.y) * fts, fi0 = floor(ftp);
        float fbest = 1e9;
        for (int fy = -1; fy <= 1; fy++) {
          for (int fx = -1; fx <= 1; fx++) {
            vec2 ftc = fi0 + vec2(float(fx), float(fy)) + 0.5;
            vec4 ftt = texture2D(uGroundClass, ftc / fts);
            float fcl = floor(ftt.r * 255.0 + 0.5);
            float fdd = length(ftc - ftp) + 0.5 * vnoise(vWPos.xz * 0.9 + vec2(float(fx) * 7.1, float(fy) * 3.3));   // (a wavy seam where two angles meet, not a ruled line)
            if (fcl > 4.5 && fcl < 5.5 && fdd < fbest) { fbest = fdd; fang = ftt.g * 3.14159265; }
          }
        }
      }
      fang *= uGroundClassOn; // (load 11-17: the slabs turn to their angle as the map fades in)
      float fk = rk == 0 ? 0.8 : (rk == 1 ? 0.88 : 1.0);   // (a sunlit asphalt came out cream-white: brought down to the dark grey it is)
      vec3 fh = vec3(1.0);
      vec2 fn = vec2(0.0);
      fabRoad(rk, vWPos.xz, vec2(cos(fang), sin(fang)), max(fwidth(vWPos.x), fwidth(vWPos.z)), fk, fh, fn, gRough);
      diffuseColor.rgb *= fk * fh;
      gNm = normalize(vec3(gNm.xy - fn, gNm.z));
    }
  }
  // the open ground (not roads, which have their own surface) shows the aerial photo: car parks, yards, gardens
  if (uFixedLayer >= 0.0 && uOrthoOn > 0.5) {
    vec2 ouv = (vWPos.xz - uOrthoRect.xy) / uOrthoRect.zw;
    if (ouv.x > 0.0 && ouv.x < 1.0 && ouv.y > 0.0 && ouv.y < 1.0) {
      vec3 photo = texture2D(uOrtho, vec2(ouv.x, 1.0 - ouv.y)).rgb;
      diffuseColor.rgb = photo * (0.9 + 0.2 * (mix(a, b, 0.4).g - 0.5));
      gNm = vec3(0.0, 0.0, 1.0);
      // (Nanjing 1937, ground area) the ground map is 4 m a pixel: from close by the land use under it (ground_class.png)
      // adds what a field, a garden or a wood shows at that scale. Furrows, beds and rows are relief lit by the sun (a
      // normal), not painted stripes; every pattern fades out before it is smaller than a pixel. Classes (ground.py):
      // 1 paddy, 2 dry field, 3 vegetable beds, 4 yard, 5 lane, 6 wood, 7 grass / fallow, 8 mud, 9 reeds, 11 rock.
      // (wave 2: the class map is 4 m a texel, so a plot's edge was a staircase and every plot's furrows stopped at a ruled
      // line: the lookup is jittered by a couple of metres where the pixels are small enough to show it)
      float jpx = max(fwidth(vWPos.x), fwidth(vWPos.z));
      vec2 cj = (vec2(vnoise(vWPos.xz * 0.31 + 5.0), vnoise(vWPos.xz * 0.31 + 41.0)) - 0.5) * (5.0 / uOrthoRect.zw) * (1.0 - smoothstep(0.5, 1.6, jpx));
      vec2 cuv = vec2(ouv.x + cj.x, 1.0 - (ouv.y + cj.y));
      vec4 lu = texture2D(uGroundClass, cuv);
      // (fabric 11-10 pass 2) ragged class edges: the map is 4 m a texel and a class changed along a ruled stair; across the
      // outer part of each texel the neighbour's class is taken in a share that grows to a half at the edge, by a fine noise,
      // so slab joints, beds and ruts run out into the next ground in scraps and not in a straight cut (one fetch more only there)
      float rag = 1.0 - smoothstep(0.4, 1.2, jpx);
      if (rag > 0.02) {
        vec2 ts = vec2(textureSize(uGroundClass, 0));
        vec2 pq = fract(cuv * ts) - 0.5;
        vec2 wq = clamp((abs(pq) - 0.18) / 0.32, 0.0, 1.0) * 0.5 * rag;
        vec2 nz = vec2(vnoise(vWPos.xz * 3.7 + 17.0), vnoise(vWPos.xz * 3.7 + 71.0));
        vec2 sq = vec2(pq.x < 0.0 ? -1.0 : 1.0, pq.y < 0.0 ? -1.0 : 1.0) / ts;
        vec4 ln = vec4(0.0);
        if (nz.x < wq.x) ln = texture2D(uGroundClass, cuv + vec2(sq.x, 0.0));
        else if (nz.y < wq.y) ln = texture2D(uGroundClass, cuv + vec2(0.0, sq.y));
        float nc = floor(ln.r * 255.0 + 0.5);
        if (nc > 0.5 && abs(nc - 10.0) > 0.5 && abs(nc - 12.0) > 0.5 && !(nc > 16.5 && nc < 19.5)) lu = ln;
      }
      // landcover2 begin
      // (landcover2 11-10) classes 17 bund, 18 ditch, 19 footpath carry a line at its sub-texel place: read from the texel under the point itself (no jitter, no ragged edge), so that the line is straight and joins its neighbours'
      vec2 cuv0 = vec2(ouv.x, 1.0 - ouv.y);
      vec4 l0 = texture2D(uGroundClass, cuv0);
      float c0 = floor(l0.r * 255.0 + 0.5);
      if (c0 > 16.5 && c0 < 19.5) { lu = l0; cuv = cuv0; }
      // landcover2 end
      if (uGroundClassOn > 0.0 && lu.r > 0.5 / 255.0) {
        float gRough0 = gRough; // (load 11-17: for the fade, see below)
        float cls = floor(lu.r * 255.0 + 0.5), ang = lu.g * 3.14159265;
        vec2 dir = vec2(cos(ang), sin(ang)), side = vec2(-dir.y, dir.x);
        vec2 w = vWPos.xz;
        // (the rows wander a little and are strong only in patches: ruled stripes in blocks read as a tiled floor)
        float across = dot(w, side) + lu.b * 11.0 + 1.8 * (vnoise(w * 0.055 + 7.0) - 0.5), along = dot(w, dir);
        float fam = 0.4 + 0.6 * smoothstep(0.3, 0.7, vnoise(w * 0.028 + 11.0));
        float px = max(max(fwidth(across), max(fwidth(w.x), fwidth(w.y))), 1e-4);   // metres a pixel here (the longer way)
        float k = 1.0, rel = 0.0;                              // colour factor; slope of the relief across the rows
        vec2 nrel = vec2(0.0);                                 // (fabric 11-10) slopes of the paving, in the world frame (ground_fabric.glsl.js)
        vec3 hueTo = vec3(1.0);
        // (every pattern of period P metres is faded out between P/5 and P/2.2 metres a pixel: past that it would only
        // alias into moire bands — 11-09 00:30 still, 中山路 view)
        // (fabric 11-10: 0.2 / 0.45 left the 0.5 m ridges of a dry field standing at 80 m, aliased into 4 m bands across the whole field: now 0.12 / 0.3)
        #define NJ_AA(P) (1.0 - smoothstep(0.12 * (P), 0.3 * (P), px))
        // (integrator 11-10) rows, ridges and beds are a regular pattern: where a period is under ~12 pixels it beats against the pixel grid and the
        // slanting view into bands several metres across (the "sand dunes" of the open fields at 80 m, in the critics' stills and Chris's eye). They
        // are gone before that, and the field is left with its parcel's own tone and the fine grain
        #define NJ_ROW(P) (1.0 - smoothstep(0.03 * (P), 0.075 * (P), px))
        if (cls < 1.5) {                                       // paddy: stubble rows 0.25 m apart, clods, wet hollows
          k *= 1.0 - 0.10 * fam * (0.5 + 0.5 * cos(6.2832 * across / (0.2 + 0.12 * fract(lu.b * 5.3)))) * NJ_ROW(0.25);   // (fabric pass 4: the row spacing is each parcel's own)
          k *= 1.0 + 0.16 * (vnoise(w * 1.6) - 0.5) * NJ_AA(0.62);
          k *= 0.96 + 0.08 * (smoothstep(0.35, 0.65, vnoise(w * 0.21)) - 0.5) * NJ_AA(4.8);
        } else if (cls < 2.5) {                                // dry field: ridges and furrows 0.5 m apart
          float rsp = 0.42 + 0.3 * fract(lu.b * 3.7);   // (fabric pass 4: the row spacing is each parcel's own, 0.42-0.72 m)
          rel = 0.04 * fam * sin(6.2832 * across / rsp) * NJ_ROW(0.5);   // (fabric 11-10 pass 2: was 0.07, stood out as corduroy from 80 m)
          k *= 1.0 - 0.05 * fam * (0.5 + 0.5 * cos(6.2832 * across / rsp)) * NJ_ROW(0.5);
          k *= 1.0 + 0.14 * (vnoise(w * 2.3) - 0.5) * NJ_AA(0.43);
        } else if (cls < 3.5) {                                // vegetable beds 1.4 m wide, paths between them
          // (fabric 11-10 pass 2: every bed its own width, tone and length; 1.4 m of one hump over a whole plot read as corduroy from 80 m)
          float bw = 1.15 + 0.7 * lu.b;
          float bpos = across / bw + 0.12 * sin(along * 0.5 + lu.b * 30.0);
          float bi = floor(bpos), bf = fract(bpos);
          float bed = smoothstep(0.10, 0.32, bf) * (1.0 - smoothstep(0.68, 0.90, bf)), fb = NJ_ROW(bw);
          float bt = hash12(vec2(bi, floor(lu.b * 255.0)));
          vec3 bedCol = bt < 0.35 ? vec3(0.93, 1.05, 0.90) : (bt < 0.7 ? vec3(1.05, 1.0, 0.92) : vec3(1.0, 1.03, 0.94));
          hueTo = mix(vec3(1.0), mix(vec3(1.08, 0.98, 0.92), bedCol, bed), fb);   // greens, turned earth, stubble; earthen paths
          k *= 1.0 - 0.12 * (1.0 - bed) * fb;
          k *= 1.0 + 0.3 * (vnoise(vec2(along * 0.33 + bi * 7.7, bi * 3.1)) - 0.5) * fb;
          rel = 0.035 * sin(6.2832 * bpos) * fb;   // (pass 3: 0.06 read as sand ripples from 80 m)
          k *= 1.0 + 0.16 * (vnoise(vec2(along * 0.9, across * 2.0)) - 0.5) * NJ_AA(0.5);
        } else if (cls < 5.5) {                                // yards and lanes: trodden earth, grit
          k *= 1.0 + 0.16 * (vnoise(w * 3.1) - 0.5) * NJ_AA(0.32);
          k *= 1.0 + 0.1 * (vnoise(w * 0.7 + 13.0) - 0.5) * NJ_AA(1.4);
          fabTerrain(cls, w, dir, px, lu.b, k, hueTo, nrel, gRough);   // (fabric 11-10) damp hollows, litter; ruts in the streets
        } else if (cls < 6.5) {                                // wood: needle litter and the young trees' shade
          k *= 1.0 + 0.36 * (vnoise(w * 0.45 + 7.0) - 0.5) * NJ_AA(2.2);
          k *= 1.0 + 0.16 * (vnoise(w * 2.2) - 0.5) * NJ_AA(0.45);
        } else if (cls < 7.5) {                                // dead winter grass in tussocks
          k *= 1.0 + 0.24 * (vnoise(w * 1.9) - 0.5) * NJ_AA(0.53);
          hueTo = mix(vec3(1.0), vec3(1.03, 1.0, 0.94), NJ_AA(8.0));   // (the class map is 4 m a texel, unfiltered: nothing
          // that depends on the class may stay on where a texel is under two pixels, or it sparkles)
        } else if (cls < 8.5) {                                // wet mud on the banks
          k *= 1.0 + 0.16 * (vnoise(w * 0.9) - 0.5) * NJ_AA(1.1);
          gRough = mix(gRough, 0.7, NJ_AA(8.0));
        } else if (cls < 9.5) {                                // reeds, dry and straw-coloured in winter: streaks
          k *= 1.0 + 0.3 * (vnoise(vec2(along * 0.6, across * 3.0)) - 0.5) * NJ_AA(0.33);
        } else if (cls > 10.5 && cls < 11.5) {                // bare rock on the ridges
          k *= 1.0 + 0.28 * (vnoise(w * 1.3) - 0.5) * NJ_AA(0.77);
        } else if (cls > 12.5 && cls < 16.5) {                // (fabric 11-10) the town's paving: 13 slabs, 14 brick, 15 waste ground, 16 cinders
          fabTerrain(cls, w, dir, px, lu.b, k, hueTo, nrel, gRough);
        }
        if (cls < 2.5 || (cls > 5.5 && cls < 9.5)) fabGround(cls, w, px, lu.b, k, hueTo, nrel, gRough);   // (fabric 11-10) grit, tussocks, mud cracks
        // landcover2 begin B
        // (landcover2 11-10) the structure of a field by its plot's own direction (beds and furrows, plough lines, cabbage heads), the lines of the plots (17 bund, 18 ditch, 19 footpath) and a flooded paddy (20)
        if (cls > 0.5 && cls < 3.5) fabField(cls, w, dir, lu.b, px, k, hueTo, nrel, gRough);
        if (cls > 16.5 && cls < 19.5) {
          vec2 tsl = vec2(textureSize(uGroundClass, 0));
          vec2 tcl = (floor(cuv * tsl) + 0.5) / tsl;
          vec2 cwl = uOrthoRect.xy + vec2(tcl.x, 1.0 - tcl.y) * uOrthoRect.zw;
          fabBund(cls, w, cwl, dir, (lu.b * 255.0 - 128.0) / 50.0, px, k, hueTo, nrel, gRough);
        }
        if (cls > 19.5 && cls < 20.5) fabFlood(w, lu.b, px, k, hueTo, nrel, gRough);
        // landcover2 end B
        #undef NJ_AA
        #undef NJ_ROW
        diffuseColor.rgb *= mix(vec3(1.0), k * hueTo, uGroundClassOn);
        // (colour wave 11-10, the lead: the bare ground of the old town read as sand, R - B about 55 in the sun. The map's grey-brown (85, 80, 70) is turned yellow by the warm low sun and the
        // warm grade, so the albedo of the trodden earth is cooled here, in linear light: yards and lanes (4, 5) and waste ground and cinders (15, 16); the fields, the wood, the grass, the paving
        // and the roads keep theirs. Factors: the first pass (0.75, 0.84, 1.24) measured at 15:15Z took the sunlit R - B from 57 to 37 (target 28), the second pass (0.64, 0.76, 1.24) measured 30 at 80 m (lit boxes, target 28), the third pass (0.61, 0.74, 1.24) aims at 26; 推测 until measured after the next reload.)
        // (light wave 6b, 11-10: the light was fixed instead of the ground, so the cooling is taken back: (0.61, 0.74, 1.24) -> (0.88, 0.94, 1.10) -> (0.76, 0.86, 1.18): the first of these measured in the frame at 80 m R - B +30 on the sunlit bare earth (target <= 28), cards say each such step is worth about -10; sunlit R - B target <= 28, shaded B - R <= 10.)
        if ((cls > 3.5 && cls < 5.5) || (cls > 14.5 && cls < 16.5)) diffuseColor.rgb *= mix(vec3(1.0), vec3(0.76, 0.86, 1.18), uGroundClassOn);
        vec3 gNmC = normalize(vec3(-rel * side.x - nrel.x, -rel * side.y - nrel.y, 1.0));
        gNm = uGroundClassOn >= 1.0 ? gNmC : normalize(mix(gNm, gNmC, uGroundClassOn));
        gRough = mix(gRough0, gRough, uGroundClassOn);
      }
      // (fabric 11-10 pass 4; mufushan's request of 10:47Z) steep ground is rock, not one smooth dark wall: strata and joints laid on the
      // face itself (world height and the way along the face, not x and z), thick bands that still read from 1-4 km, thinner ones nearer,
      // dark gullies down the face and scrub on the ledges. Nothing under ~35 degrees, all of it from ~52 (推测: the strata dip a little
      // along the face; no gullies are invented in the shape, only in the colour).
      float rfw = smoothstep(0.82, 0.62, gN.y);
      if (rfw > 0.01) {
        // (pass 7: the face's own frame from its interpolated normal turned the pattern into a saw of triangles, the grid's normals being
        // noisy on a steep face; every coordinate is now the world's: height, and two fixed horizontal axes, so the strata lie level and
        // are plateaus of pale and dark, not a soft noise)
        float rfs = vWPos.y + 0.08 * (vWPos.x * 0.6 + vWPos.z * 0.8);
        float rfp = max(max(fwidth(vWPos.y), 0.5 * (fwidth(vWPos.x) + fwidth(vWPos.z))), 1e-4);
        float rfb1 = fabNoise(vec2(rfs / 24.0, (vWPos.x + vWPos.z) / 160.0 + 3.0)), rfb2 = fabNoise(vec2(rfs / 7.0, (vWPos.x - vWPos.z) / 50.0 + 9.0)), rfb3 = fabNoise(vec2(rfs / 2.2, (vWPos.x * 0.8 + vWPos.z * 0.6) / 12.0 + 21.0));
        float rfk = 1.0 + 1.0 * (smoothstep(0.32, 0.68, rfb1) - 0.5) * fabAA(48.0, rfp) + 0.7 * (rfb2 - 0.5) * fabAA(14.0, rfp) + 0.4 * (rfb3 - 0.5) * fabAA(4.0, rfp);
        // (no gullies: down a face they need its own frame, and that is what saws; the strata and the ledges are level in any frame)
        rfk = clamp(rfk, 0.3, 2.2);
        float rfl = smoothstep(0.58, 0.8, fabNoise(vec2(rfs / 3.5 + 7.0, (vWPos.x + vWPos.z * 0.7) / 8.0 + 2.0))) * fabAA(7.0, rfp);
        vec3 rfc = mix(vec3(1.0), vec3(0.86, 1.0, 0.74), 0.7 * rfl);
        diffuseColor.rgb *= mix(vec3(1.0), rfc * rfk, rfw);
      }
    }
  }
  // (Nanjing 1937, ground area) snow: it lies on the flat and the gentle slopes, thinly and in patches as the cover grows
  // or melts, trodden to grey slush on roads and lanes; it slides off steep ground. Its pattern fades to its average
  // where it would be smaller than a pixel.
  if (uSnow > 0.001 && !water) {
    float spx = max(fwidth(vWPos.x), fwidth(vWPos.z));
    float sn = 0.6 * vnoise(vWPos.xz * 0.06 + 17.0) + 0.4 * mix(0.5, vnoise(vWPos.xz * 0.9), 1.0 - smoothstep(0.2, 0.5, spx));
    float cover = smoothstep(0.0, 0.25, uSnow * 1.25 - (1.0 - sn) * 0.6) * smoothstep(0.62, 0.86, gN.y);
    bool road = uFixedLayer < 0.0;
    vec3 snowCol = road ? vec3(0.42, 0.42, 0.43) : vec3(0.72, 0.74, 0.78);
    cover *= road ? 0.6 : 1.0;
    diffuseColor.rgb = mix(diffuseColor.rgb, snowCol, cover);
    gNm = normalize(mix(gNm, vec3(0.0, 0.0, 1.0), cover));
    gRough = mix(gRough, road ? 0.6 : 0.85, cover);
  }
  // (Nanjing 1937, wave 3d, watersurface 11-10) the water is draped on the carved ground (meshing.js); its outline runs
  // half a 5 m cell beyond the last water node. Its look (colour by body, depth proxy, ripples that fade with the pixel
  // size, the wet edge, a triangle sloping more than 15 % is bank and is discarded) is water_look.js WATER_MAIN:
${ee}
}
`,Z=`
  if (!water && (uFixedLayer >= 0.0 || layer > 0.5)) {
    float top = max(tint.r, max(tint.g, tint.b)), low = min(tint.r, min(tint.g, tint.b));
    float lum = dot(tint, vec3(0.3, 0.59, 0.11)), sat = (top - low) / max(top, 1e-3);
    vec3 flatC = mix(${A(k.paving)} * mix(1.0, 0.85, smoothstep(0.15, 0.5, lum)), mix(vec3(1.0), tint / max(top, 1e-3), 0.62) * 0.42, smoothstep(0.12, 0.4, sat));
    if (uFixedLayer >= 0.0) flatC = ${A(k.land)};
    diffuseColor.rgb = flatC;
    gNm = vec3(0.0, 0.0, 1.0);
    gRough = 0.95;
    flatC *= mix(1.0, 0.3, uDark);
    diffuseColor.rgb = flatC;
    gGlow = ${A(k.night.land)} * (flatC / 0.36) * uDark;
  }
`,ne=`
    diffuseColor.rgb = ${A(k.water)};
    gWaveN = vec3(0.0, 1.0, 0.0);
    gNm = vec3(0.0, 0.0, 1.0);
    gRough = 0.95;
    gWater = 0.0;
`;function Q(e,{fixedLayer:t=-1,...n}={}){let r=O(new s({roughness:.92,...n}));return r.onBeforeCompile=n=>{if(Object.assign(n.uniforms,{uGroundAlb:{value:e.ground.albedo},uGroundNor:{value:e.ground.normal},uGroundScale:{value:e.ground.scales},uFixedLayer:{value:t},uOrtho:w.uOrtho,uOrthoRect:w.uOrthoRect,uOrthoOn:w.uOrthoOn,uTime:w.uTime,uGroundClass:w.uGroundClass,uGroundClassOn:w.uGroundClassOn,uSnow:w.uSnow,uMirror:w.uMirror,uMirrorMatrix:w.uMirrorMatrix,uMirrorOn:w.uMirrorOn,uMirrorLevel:w.uMirrorLevel,uDark:w.uDark,uCloudMap:w.uCloudMap,uCloudOffset:w.uCloudOffset,uCloudCover:w.uCloudCover,uCloudBase:w.uCloudBase,uCloudsOn:w.uCloudsOn,uWorldToECEF:w.uWorldToECEF,uCloudRect:w.uCloudRect,uCloudFade:w.uCloudFade,uLampOn:w.uLampOn,uLampMap:w.uLampMap,uLampRect:w.uLampRect,uStoryDay:w.uStoryDay,...b}),n.vertexShader=n.vertexShader.replace(`#include <common>`,`#include <common>\nattribute float aLayer;\nvarying float vLayer;\n${M}`).replace(`#include <begin_vertex>`,`#include <begin_vertex>\nvLayer = aLayer;\n${N}`).replace(`#include <project_vertex>`,`#include <project_vertex>
if (aLayer > 3.5) gl_Position.z -= 0.0008;`),n.fragmentShader=n.fragmentShader.replace(`#include <common>`,`#include <common>
`+Y).replace(`#include <color_fragment>`,`#include <color_fragment>
`+X).replace(`#include <roughnessmap_fragment>`,`#include <roughnessmap_fragment>
roughnessFactor = gRough;`).replace(`#include <metalnessmap_fragment>`,`#include <metalnessmap_fragment>
metalnessFactor = gMetal;`).replace(`#include <normal_fragment_maps>`,`#include <normal_fragment_maps>
`+P).replace(`#include <opaque_fragment>`,`
${g}
        #include <opaque_fragment>
        gl_FragColor.a = 1.0 - gWater * (1.0 - uMirrorOn);`),T.contact&&(Object.assign(n.uniforms,{uContact:w.uContact,uContactMap:w.uContactMap,uContactRect:w.uContactRect}),n.fragmentShader=n.fragmentShader.replace(`uniform float uDark;`,`uniform float uDark;
uniform float uContact;
uniform sampler2D uContactMap;
uniform vec4 uContactRect;
float gContactLeft = 1.0; // what a contact shadow leaves of the light`).replace(`roughnessFactor = gRough;`,`roughnessFactor = gRough;
  {
    vec2 cuv = vec2(vWPos.x - uContactRect.x, uContactRect.y - vWPos.z) / (2.0 * uContactRect.z) + 0.5;
    vec2 cedge = smoothstep(vec2(0.0), vec2(0.05), cuv) * (1.0 - smoothstep(vec2(0.95), vec2(1.0), cuv));
    float contact = smoothstep(0.0, 0.75, texture2D(uContactMap, cuv).r) * cedge.x * cedge.y * (1.0 - gWater);
    gContactLeft = 1.0 - uContact * contact;
  }`).replace(`#include <lights_fragment_end>`,`reflectedLight.directDiffuse *= gContactLeft; reflectedLight.directSpecular *= gContactLeft;
  #if defined( RE_IndirectDiffuse )
    irradiance *= gContactLeft; iblIrradiance *= gContactLeft;
  #endif
  #include <lights_fragment_end>`)),T.abstract){let e=(e,t,n)=>(e.includes(t)||console.warn(`ground: the shader has changed; the abstract model is not applied`),e.replace(t,n));n.fragmentShader=e(e(e(e(n.fragmentShader,`float gWater = 0.0;`,`float gWater = 0.0;
vec3 gGlow = vec3(0.0); // the abstract model by night`),`  if (water) {`,Z+`  if (water) {`),`    gWater = 1.0;
`,`    gWater = 1.0;
`+ne),`#include <emissivemap_fragment>`,`#include <emissivemap_fragment>
totalEmissiveRadiance += gGlow;`),n.fragmentShader=e(n.fragmentShader,`#include <lights_fragment_end>`,V(`0.92`))}},r.customProgramCacheKey=()=>`ground-v19`+_+(T.abstract?`a`:``)+(T.contact?`c2`:``),r}function $(){if($.started)return;$.started=!0;let e=new URLSearchParams(location.search).get(`area`)||`nanjing1937`;new l().load(`ortho/${e}/ground_class.png`,e=>{if(e.colorSpace=``,e.magFilter=e.minFilter=c,e.generateMipmaps=!1,e.needsUpdate=!0,w.uGroundClass.value=e,new URLSearchParams(location.search).get(`eager`)===`1`){w.uGroundClassOn.value=1;return}let t=performance.now(),n=()=>{let e=Math.min(1,(performance.now()-t)/800);w.uGroundClassOn.value=e>=1?1:e*e*(3-2*e),e<1&&requestAnimationFrame(n)};n()},void 0,()=>{})}function re(e,{deferClass:n=!1}={}){return n||$(),y(new URLSearchParams(location.search).get(`area`)||`nanjing1937`),{facade:J(e),facadeFor:()=>J(e),terrain:Q(e,{fixedLayer:3,color:new t().setRGB(.2,.2,.185)}),road:Q(e,{vertexColors:!0,polygonOffset:!0,polygonOffsetFactor:-1,polygonOffsetUnits:-2}),paint:Q(e,{vertexColors:!0,polygonOffset:!0,polygonOffsetFactor:-3,polygonOffsetUnits:-8}),models:new s({vertexColors:!0,roughness:.85,metalness:.05,side:2})}}export{k as ABSTRACT,re as createMaterials,$ as groundClass,V as neutralShade,te as setVariant,w as shared,T as variant,D as variantKey,O as varies};