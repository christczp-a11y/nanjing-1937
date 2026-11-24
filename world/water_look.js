import{NearestFilter as e,TextureLoader as t,Vector2 as n,Vector4 as r}from"../node_modules/three/build/three.core.js";var i=`wl15`,a={uWaterMap:{value:null},uWaterRect:{value:new r(0,0,5,0)},uWaterSize:{value:new n(1,1)},uWindWater:{value:new n(.8,.6)},uWaterT:{value:0},uWaterCap:{value:3},uWaterOff:{value:0}};function o(n){o.started||(o.started=!0,fetch(`ortho/${n}/water_map.json`).then(e=>e.ok?e.json():null).then(r=>{r&&new t().load(`ortho/${n}/water_map.png`,t=>{t.colorSpace=``,t.magFilter=t.minFilter=e,t.generateMipmaps=!1,t.flipY=!1,t.needsUpdate=!0,a.uWaterMap.value=t,a.uWaterSize.value.set(r.w,r.h),a.uWaterRect.value.set(r.x0,r.z0,r.step,1),a.uWaterOff.value=r.dist_offset_m||0},void 0,()=>{})}).catch(()=>{}))}var s=`
uniform sampler2D uWaterMap;
uniform vec4 uWaterRect;
uniform vec2 uWaterSize;
uniform vec2 uWindWater;
uniform float uWaterT;
uniform float uWaterOff;
uniform float uWaterCap;
uniform float uStoryDay;
// per body class 0..10 (0 = not in the map): the colour of deep water and of shallow water (linear; spec A1: from
// Britannica's "muddy yellow" Yangtze, the dark green turbid Qinhuai of the scouts' sources, the grey-green lakes: 推测),
// and (ripple strength, roughness, deepest metres, how much of the city it mirrors)
const vec3 NJW_DEEP[11] = vec3[11](
  vec3(0.0738, 0.0695, 0.0428), vec3(0.0738, 0.0695, 0.0428), vec3(0.0463, 0.0589, 0.0370), vec3(0.0338, 0.0436, 0.0361), vec3(0.0355, 0.0492, 0.0347), vec3(0.0509, 0.0694, 0.0599),
  vec3(0.0469, 0.0659, 0.0520), vec3(0.0493, 0.0576, 0.0329), vec3(0.0785, 0.0723, 0.0528), vec3(0.0463, 0.0589, 0.0370), vec3(0.0509, 0.0694, 0.0599));
const vec3 NJW_SHAL[11] = vec3[11](
  vec3(0.1044, 0.0887, 0.0512), vec3(0.1044, 0.0887, 0.0512), vec3(0.0709, 0.0718, 0.0395), vec3(0.0534, 0.0566, 0.0398), vec3(0.0529, 0.0590, 0.0383), vec3(0.0743, 0.0885, 0.0599),
  vec3(0.0710, 0.0862, 0.0555), vec3(0.0717, 0.0709, 0.0388), vec3(0.0785, 0.0723, 0.0528), vec3(0.0709, 0.0718, 0.0395), vec3(0.0743, 0.0885, 0.0599));
const vec4 NJW_PAR[11] = vec4[11](
  vec4(1.0, 0.06, 10.0, 0.8), vec4(1.0, 0.06, 10.0, 0.8), vec4(0.4, 0.05, 3.0, 0.8), vec4(0.12, 0.04, 1.2, 1.0), vec4(0.12, 0.04, 1.0, 1.0), vec4(0.6, 0.06, 2.3, 0.7),
  vec4(0.6, 0.06, 2.0, 0.7), vec4(0.22, 0.04, 1.2, 0.9), vec4(0.15, 0.05, 0.5, 0.6), vec4(0.4, 0.05, 3.0, 0.8), vec4(0.5, 0.06, 2.0, 0.7));
float gWCls = 1.0;                 // the body (nearest node)
float gWDist = 20.0;               // metres to the bank (the waterline is 0)
vec3 gWDeep = vec3(0.1), gWShal = vec3(0.2);
vec4 gWPar = vec4(1.0, 0.06, 10.0, 0.5);
float gWEdge = 1.0;                // 0 at the bank .. 1 from 2.2 m out: what mirror and glitter keep near the edge
float gWMir = 1.0;                 // how much of the city this water mirrors here
float gWRough = 0.06;              // roughness the sun's glint is lit with
float gWMud = 0.0, gWDepth = 1.0;
float gWAO = 0.0;                  // the share of the sky the banks shut out here (0..1; water_map.py B)
vec2 gWSlopeLo = vec2(0.0);        // the slope of the trains over 0.95 m long: what the mirror's picture is shifted by (the fine ripples only made it zigzag)
// The map's four nodes round a point, blended: the body's colours and numbers, and the distance to the bank.
void njWaterAt(vec3 wp) {
  float fb = wp.y < 3.2 ? 1.0 : (wp.y > 7.8 && wp.y < 9.4 ? 5.0 : 10.0); // (without the map: by level)
  gWCls = fb; gWDeep = NJW_DEEP[int(fb)]; gWShal = NJW_SHAL[int(fb)]; gWPar = NJW_PAR[int(fb)]; gWDist = 25.0;
  if (uWaterRect.w < 0.5) return;
  vec2 g = (wp.xz - uWaterRect.xy) / uWaterRect.z;
  if (g.x < 0.0 || g.y < 0.0 || g.x > uWaterSize.x - 1.0 || g.y > uWaterSize.y - 1.0) return;
  vec2 i0 = floor(g), fr = g - i0;
  ivec2 ii = ivec2(i0), lim = ivec2(uWaterSize) - 1;
  vec3 deep = vec3(0.0), shal = vec3(0.0); vec4 par = vec4(0.0);
  float ws = 0.0, db = 0.0, ao = 0.0;
  for (int k = 0; k < 4; k++) {
    ivec2 o = ivec2(k & 1, k >> 1);
    vec2 w2 = mix(1.0 - fr, fr, vec2(o));
    float w = w2.x * w2.y;
    vec4 t = texelFetch(uWaterMap, clamp(ii + o, ivec2(0), lim), 0);
    int bb = int(t.b * 255.0 + 0.5);                 // (B: high nibble = the nearest water's class on a land node by the shore, low nibble = sky occlusion)
    db += w * t.r * 127.5;
    ao += w * float(bb & 15);
    int c = int(t.g * 255.0 + 0.5);
    if (c == 0) c = bb >> 4;
    if (c > 0 && c < 11) { deep += w * NJW_DEEP[c]; shal += w * NJW_SHAL[c]; par += w * NJW_PAR[c]; ws += w; }
  }
  if (ws < 0.02) return;
  gWDeep = deep / ws; gWShal = shal / ws; gWPar = par / ws;
  vec4 tn = texelFetch(uWaterMap, clamp(ivec2(floor(g + 0.5)), ivec2(0), lim), 0);
  int cn = int(tn.g * 255.0 + 0.5);
  if (cn == 0) cn = int(tn.b * 255.0 + 0.5) >> 4;
  if (cn > 0 && cn < 11) gWCls = float(cn);
  gWAO = ao * (0.6 / 15.0);
  // (wave 5 map: a signed distance to the outline polygon itself, offset 8 m, so the 0 contour of the blend is the shoreline; the old map
  // measured from raster cells and ran half a node beyond the last water node: 1.25 m there, not 0)
  gWDist = uWaterOff > 0.5 ? max(db - uWaterOff, 0.0) : (db >= 2.5 ? db : max(db - 1.25, 0.0) * 2.0);
}
// Ripples: the slope (dz/dx, dz/dz) of the surface at a point as a sum of 18 wave trains, from 24 m to 16 cm long. Wave 5 (11-10):
// the old ten trains (22 m x 0.5 steps, directions 0.5 rad apart) lined up into corduroy and a plaid lattice from 50-250 m. Now the
// wavelengths step by 0.745 (no two are a ratio of whole numbers), the directions are a golden-ratio scatter over +-41 to +-100 degrees
// of the wind (the long waves short-crested across the wind, the fine ripples almost all round), every phase is its own constant, the whole field is bent twice by noise (6 m over 33 m,
// 1 m over 6 m) so no crest runs straight for more than a wavelength or two, and three noise fields (60, 22, 8 m) make the long, the
// middle and the fine trains come in gusts and calm patches (the long ones also in streaks along the wind). A train that a pixel
// (px metres) can no longer resolve is faded out and its variance goes into 'lost', which the caller makes roughness of: far off the
// water is a calm mirror with a broad glint, near it glitters. Phase speeds are 0.275 sqrt(wavelength) m/s, at most 0.6: slower than
// real, so a time-lapse shot (the film's time runs on screen seconds here, see FILM_CONTRACT) shows no churning (the spec: <= 0.6 m of
// pattern per screen second). Same on every run: constants and noise of the position only.
vec2 njWaves(vec2 p, float t, float amp, float ampR, float px, vec2 wd, out float lost) {
  const float LAM[18] = float[18](24.000, 17.880, 13.321, 9.924, 7.393, 5.508, 4.103, 3.057, 2.278, 1.697, 1.264, 0.942, 0.702, 0.523, 0.389, 0.290, 0.216, 0.161);
  const float COF[18] = float[18](0.983, 0.731, 0.985, 0.887, 0.808, 0.997, 0.652, 0.913, 0.915, 0.531, 0.992, 0.666, 0.728, 0.966, 0.213, 0.916, 0.742, 0.379);
  const float SOF[18] = float[18](-0.186, 0.683, 0.173, -0.462, 0.589, -0.077, -0.758, 0.408, -0.404, 0.848, 0.123, -0.746, 0.686, -0.259, -0.977, 0.401, -0.670, 0.926);
  const float PHI[18] = float[18](3.714, 6.084, 2.624, 4.331, 0.649, 6.031, 2.960, 1.540, 4.468, 3.900, 0.460, 2.727, 2.679, 1.989, 1.071, 3.002, 5.491, 2.922);
  const float SWT[18] = float[18](0.45, 0.52, 0.58, 0.63, 0.66, 0.68, 0.68, 0.66, 0.62, 0.58, 0.54, 0.50, 0.46, 0.42, 0.39, 0.36, 0.33, 0.30);
  p += 6.0 * (vec2(vnoise(p * 0.030 + vec2(0.7, t * 0.010)), vnoise(p * 0.030 + vec2(9.1, -t * 0.010))) - 0.5)
     + 1.0 * (vec2(vnoise(p * 0.17 + 3.3), vnoise(p * 0.17 + 41.7)) - 0.5);
  float al = dot(p, wd), ac = dot(p, vec2(-wd.y, wd.x));
  float gA = 0.35 + 1.3 * smoothstep(0.2, 0.8, mix(vnoise(p * 0.016 + 3.7), vnoise(vec2(al * 0.010, ac * 0.11) + 7.7), 0.5));
  float gB = 0.35 + 1.3 * smoothstep(0.2, 0.8, vnoise(p * 0.045 + 11.3));
  float gC = 0.35 + 1.3 * smoothstep(0.2, 0.8, vnoise(p * 0.13 + 29.1));
  vec2 slope = vec2(0.0);
  gWSlopeLo = vec2(0.0);
  lost = 0.0;
  for (int i = 0; i < 18; i++) {
    float L = LAM[i];
    float sw = 0.050 * SWT[i];
    // a train is resolved while a wavelength spans more than 6-16 pixels (wave 5: 5-10 left a fine woven grid of aliased ripples); what is not goes into 'lost' (sR: the body's own strength, the
    // seams and gusts leave the roughness alone: a roughness that varied with them drew bright blotches in the glint)
    float vis = 1.0 - smoothstep(L / 16.0, L / 6.0, px);
    lost += 0.5 * (sw * ampR) * (sw * ampR) * (1.0 - vis);
    if (vis < 0.01) continue;
    vec2 d = vec2(wd.x * COF[i] - wd.y * SOF[i], wd.y * COF[i] + wd.x * SOF[i]);
    float ph = 6.2832 / L * (dot(p, d) - min(0.6, 0.275 * sqrt(L)) * t) + PHI[i];
    vec2 sl = d * (sw * amp * (i < 6 ? gA : (i < 12 ? gB : gC)) * vis * cos(ph));
    slope += sl;
    if (i < 12) gWSlopeLo += sl;   // (the trains over 0.9 m: what the mirror's picture is shifted by; the fine ripples only made it zigzag)
  }
  return slope;
}
`,c=`
  if (water) {
    // Water is level across: a triangle of it sloping more than 15 % is bank, not water: the ground under it shows
    // (creeks falling along their line stay: 15 % is a torrent's fall; 推测 threshold)
    {
      vec3 wn = normalize(cross(dFdx(vWPos), dFdy(vWPos)));
      if (abs(wn.y) < 0.989) discard;
    }
    njWaterAt(vWPos);
    vec2 wp = vWPos.xz;
    float wt = uWaterT;
    float px = max(length(dFdx(wp)), length(dFdy(wp)));
    // the current (the Yangtze only: the moats and canals move 0.1 m/s, which no eye sees): toward NNE, 0.45 m/s of
    // pattern (the river's own 0.6 m/s +- tide, 核实 geography, 推测 speed, kept under the spec's 0.6 per screen second)
    float flowK = gWCls < 1.5 ? 1.0 : 0.0;
    vec2 flow = vec2(0.40, -0.92) * 0.45 * flowK;
    vec2 pf = wp - flow * wt;
    vec2 fd = flowK > 0.5 ? vec2(0.40, -0.92) : normalize(uWindWater);
    float along = dot(pf, fd), across = dot(pf, vec2(-fd.y, fd.x));
    float seam = vnoise(vec2(along * 0.011, across * 0.085));                 // seams of the current: streaks along the flow
    float silt = 0.45 * vnoise(pf * 0.0035 + 3.0) + 0.35 * seam + 0.2 * vnoise(vec2(along * 0.004, across * 0.05) + 17.0);   // silt in streaks along the flow
    float amp = gWPar.x;
    if (flowK > 0.5) amp *= 0.55 + 0.9 * seam;
    else if (gWPar.x > 0.45 && gWPar.x < 0.7) amp *= 0.3 + 1.0 * smoothstep(0.3, 0.75, vnoise(wp * 0.010 + vec2(wt * 0.012, -wt * 0.008)));   // a lake: cat's-paws, no dominant direction
    float lost;
    vec2 slope = njWaves(pf, wt, amp, gWPar.x, px, normalize(uWindWater), lost);
    gWaveN = normalize(vec3(-slope.x, 1.0, -slope.y));
    gNm = vec3(gWaveN.x, gWaveN.z, gWaveN.y);
    float a2 = gWPar.y * gWPar.y;
    gWRough = clamp(pow(a2 * a2 + 2.0 * lost, 0.25), 0.10, 0.6);   // (the floor 0.06 -> 0.10 in wave 5: a calm pond's glint was a tiny very bright dot that the bloom blew into a round pasted patch)
    gRough = gWRough;
    // depth and the colour of the water: shallow at the bank, deep in the middle (the depth is proxied by the distance)
    float d = gWDist;
    gWDepth = clamp(0.12 * d, 0.15, gWPar.z);
    float k = smoothstep(0.0, 1.5, gWDepth);
    if (gWPar.z > 1.9) k *= mix(0.8, 1.0, smoothstep(6.0, 90.0, d));            // the wide waters shoal slowly
    vec3 col = mix(gWShal, gWDeep, k);
    if (flowK > 0.5) col *= 0.76 + 0.48 * silt;                                  // (the current's seams read at 700 m as streaks of lighter and darker silt)
    // the Yangtze's mud foreshore (class M: the first 25 m): the colour of wet silt, hardly any mirror
    gWMud = flowK * (1.0 - smoothstep(3.0, 25.0, d)) * 0.55;
    col = mix(col, vec3(0.120, 0.101, 0.056), gWMud);
    col *= 1.0 - 0.25 * (1.0 - smoothstep(0.0, 1.2, d));                        // the wet line at the bank
    diffuseColor.rgb = col;   // (the table's colours are how the water looks in the sun: three's warm light brings the albedo up about 2 times, and warmer)
    gWEdge = smoothstep(0.0, 2.2, d);
    gWMir = gWPar.w * smoothstep(0.15, 0.45, gWDepth) * (1.0 - 0.85 * gWMud);
    gMetal = 0.0;
    gWater = 1.0;
  }
`,l=`
        if (gWater > 0.5) {
          vec3 wV = normalize(cameraPosition - vWPos);
          float wc = clamp(dot(wV, gWaveN), 0.0, 1.0);
          float wF = 0.02 + 0.98 * pow(1.0 - wc, 7.0);                            // Fresnel: F0 of water is 0.02 (spec A2, 核实 physics); the power 7 instead of Schlick's 5 is a choice (推测): the page's sky is several times brighter than the dark water, so at 25 degrees (4 % with power 7, 8 % with 5) it still turned ponds and canals blue; now from above the water's own colour carries and the sky takes over towards grazing (18 % at 12 degrees, 60 % at 4)
          vec3 wr = reflect(-wV, gWaveN);
          // the sky: the environment map (the page's own sky), a little blurred by the ripples it cannot resolve
          vec3 sky = mix(vec3(0.8, 0.86, 0.92), vec3(0.3, 0.48, 0.74), pow(clamp(abs(wr.y), 0.0, 1.0), 0.5)) * (0.03 + 0.97 * (1.0 - uDark)) * 0.9;
          #ifdef USE_ENVMAP
          sky = getIBLRadiance(geometryViewDir, normal, clamp(gWRough, 0.0, 0.5));
          #endif
          float cloud = cloudAbove(vWPos, vec3(wr.x, abs(wr.y), wr.z));
          sky = mix(sky, vec3(0.96, 0.97, 0.98) * (0.05 + 0.95 * (1.0 - uDark)), 0.9 * cloud);
          vec3 refl = sky;
          float thing = 0.0;
          if (uMirrorOn > 0.5) {
            // the city in the mirror picture (mirror.js), shifted by the ripples and drawn out along the view
            vec4 mc = uMirrorMatrix * vec4(vWPos, 1.0);
            float near = clamp(70.0 / distance(cameraPosition, vWPos), 0.12, 1.0);
            vec2 muv = mc.xy / mc.w * 0.5 + 0.5 - gWSlopeLo * vec2(0.3, 0.8) * near;   // (sideways far less than up and down: reflections in water wobble across and smear along the view)
            float stretch = (0.004 + 0.012 * gWRough) * near;
            vec4 mirrored = vec4(0.0);
            for (int i = -3; i <= 3; i++) mirrored += texture2D(uMirror, clamp(muv + vec2(0.0, float(i) * stretch), 0.001, 0.999));
            mirrored /= 7.0;
            thing = smoothstep(0.0, 0.3, mirrored.a + dot(mirrored.rgb, vec3(1.0)));
            // only water at the mirror's level takes its picture; the rest mirrors the sky alone
            thing *= (1.0 - smoothstep(0.4, 1.5, abs(vWPos.y - uMirrorLevel))) * gWMir * gWEdge;
            refl = mix(sky, mirrored.rgb * vec3(0.88, 0.93, 0.95), thing);
          }
          // the city's picture and the clouds: a clear mirror towards grazing, faint from above (wave 5: they were 0.42 / 0.3 at every angle)
          float wGraze = clamp(0.1 + 2.6 * wF, 0.0, 1.0);
          float wMix = max(wF * (0.4 + 0.6 * gWEdge), max(0.42 * wGraze * thing, 0.3 * wGraze * cloud * (1.0 - thing) * gWEdge));
          // the water's own colour: lit by the page's light (sun warm, sky blue, 1.5-3 times as much blue as red on a flat surface), which
          // made every dark water read blue-grey; the cast is pulled 55 % towards grey so the table's colours (spec A1: how the water looks)
          // carry, whatever the light does to the sky (推测, an art choice)
          float wAO = clamp(gWAO * 2.2, 0.0, 0.85);   // (high banks shut out the sky: the water under them is darker and mirrors less sky)
          vec3 body = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse * (1.0 - wAO);
          {
            vec3 dcol = max(diffuseColor.rgb, vec3(0.004));
            vec3 Eb = body / dcol;
            Eb = mix(Eb, vec3(dot(Eb, vec3(0.2126, 0.7152, 0.0722))), 0.55);
            body = dcol * Eb;
          }
          // the sky seen in water is a hazier, paler one than the page's deep blue dome (December air over a river, 推测): 30 % towards its grey
          refl = mix(refl, vec3(dot(refl, vec3(0.2126, 0.7152, 0.0722))), 0.5 * (1.0 - thing));
          // the sky's own aureole round the sun is very bright and rimmed pink and lilac where it meets the blue: mirrored whole it drew a
          // round coloured patch on small ponds and a pink fringe along the glint column. Its radiance is kept under a ceiling with its hue
          // (a smooth knee at 3: nothing below changes much), the glint itself comes from the sun's GGX lobe below
          refl *= 1.0 / pow(1.0 + pow(max(max(refl.r, refl.g), refl.b) / 3.0, 4.0), 0.25);
          refl = mix(refl, refl * (1.0 - 0.8 * wAO), 1.0 - thing);
          // the sun's glint, kept below a ceiling with its hue: the lens flare of the picture (atmosphere.js, takram's LensFlareEffect)
          // takes what is brighter than a threshold for a light and draws ghosts and a halo with colour fringes round it
          vec3 wSpec = reflectedLight.directSpecular * gWEdge;
          wSpec *= uWaterCap / (uWaterCap + max(max(wSpec.r, wSpec.g), wSpec.b));
          outgoingLight = body * (1.0 - wMix) + refl * wMix + wSpec + totalEmissiveRadiance;
          // morning mist over still water, 11-22 Dec, 06:30-08:30 (the scouts' sources: occasional morning mist; over water 推测; never on the Yangtze)
          float mhr = fract(uStoryDay) * 24.0, mdy = floor(uStoryDay);
          float mist = smoothstep(6.0, 6.6, mhr) * (1.0 - smoothstep(8.0, 8.8, mhr)) * step(10.0, mdy) * (1.0 - step(22.0, mdy)) * step(1.5, gWCls);
          mist *= 0.25 + 0.75 * smoothstep(0.25, 0.75, vnoise(vWPos.xz * 0.012 + vec2(uWaterT * 0.01, 3.0)));
          // (FIX round 5, wave_b DIAG_leftovers section 2) the mist is lit: a pale layer (albedo 0.62) under the same light as the water's own surface
          // (direct + sky light, the banks' shade; the grey-pulled light of the body above), not a constant x (1 - uDark): at dawn that glowed far
          // brighter than the lit banks and turned the river into a flat pale board (lookers, 13 Dec 06:30)
          vec3 mistE = body / max(diffuseColor.rgb, vec3(0.004));
          outgoingLight = mix(outgoingLight, vec3(0.62, 0.64, 0.62) * dot(mistE, vec3(0.2126, 0.7152, 0.0722)), 0.4 * mist);
          // ice from 24 Dec ("cold at night" in Vautrin's diary; the ice itself 未核实 and the spec's rule: 06:00-09:30 only, a 2-6 m pale
          // rim on the still edges: ponds 6 m, lake shallows 4 m, canals and moats 2.5 m; none on the rivers)
          float ihr = fract(uStoryDay) * 24.0;
          float iceT = step(23.0, floor(uStoryDay)) * smoothstep(5.5, 6.5, ihr) * (1.0 - smoothstep(9.0, 10.0, ihr));
          float iceW = gWCls < 1.5 ? 0.0 : (gWCls > 6.5 && gWCls < 7.5 ? 6.0 : (gWCls > 4.5 && gWCls < 6.5 ? 4.0 : 2.5));
          float iceK = iceT * (1.0 - smoothstep(iceW * 0.6, iceW, gWDist + 1.5 * (vnoise(vWPos.xz * 0.4) - 0.5)));
          // (FIX round 5, the same class as the mist) the ice is lit by the same light, not a constant
          outgoingLight = mix(outgoingLight, vec3(0.66, 0.69, 0.70) * dot(mistE, vec3(0.2126, 0.7152, 0.0722)), 0.85 * iceK);
        }
`;export{l as WATER_FINAL,i as WATER_KEY,c as WATER_MAIN,s as WATER_PARS,o as loadWaterMap,a as waterU};