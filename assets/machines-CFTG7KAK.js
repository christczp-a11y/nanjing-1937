// Machines of the sim cast (wave 6b, WP4 MACHINES): the vehicles that people\models.js does not have. Block-built at real size,
// vertex colours (linear light, like models.js's solid()), no uv, origin on the ground, nose along +z, no animation, no
// per-instance tint (so the side variants are separate kinds). Loaded by mods\people.js through an optional import; it imports
// nothing (the mod hands in THREE and `merge`), so the still daemon's /remod and node can read it.
//
// Labels: 核实 = a file under research\ supports it (named); 推测 = inferred (basis given); 未核实 = said somewhere, not supported.
// Sources used here:
//   research\raw\japanese_army.verify.json id ja-tankette-type94 (3.08 m en wiki / 3.36 m ja wiki x 1.62 x 1.62-1.63 m): 核实
//   research\refs\photo_refs.md Z7 (12-12 12:10, a column of at least 5 Type 94 on the road before 中华门, flags on the aerials): 核实
//   research\raw\gap_street_furniture_vehicles.verify.json (zh wiki 南京公交: the Jiangnan Bus Co. cars were painted 淡湖蓝): 核实
//   research\NANJING1937_SPEC.md l.835 and l.669 (the Red Swastika Society buried the dead from 12-22; the Japanese requisitioned
//   its trucks, coffins and bearers): 核实 that coffins and trucks were used; the cart as the carrier: 未核实 (sim_spec_factcheck.md
//   #11); every size and colour: 推测
// No writing, no numbers, no emblem other than the Hinomaru disc of the tankette flag.

const lin = (c) => c.map((v) => Math.pow(v / 255, 2.2));

function solid(THREE, g, rgb) {
  g = g.index ? g.toNonIndexed() : g;
  const n = g.attributes.position.count, c = new Float32Array(n * 3), l = lin(rgb);
  for (let i = 0; i < n; i++) c.set(l, i * 3);
  g.setAttribute('color', new THREE.BufferAttribute(c, 3));
  if (g.attributes.uv) g.deleteAttribute('uv');
  return g;
}
const boxAt = (THREE, w, h, d, x, y, z, rgb, ry = 0, rx = 0, rz = 0) => {
  const g = new THREE.BoxGeometry(w, h, d);
  if (rz) g.rotateZ(rz);
  if (rx) g.rotateX(rx);
  if (ry) g.rotateY(ry);
  return solid(THREE, g.translate(x, y, z), rgb);
};
const cyl = (THREE, r0, r1, len, x, y, z, rgb, axis = 'x', seg = 10) => {
  const g = new THREE.CylinderGeometry(r1, r0, len, seg);
  if (axis === 'x') g.rotateZ(Math.PI / 2); else if (axis === 'z') g.rotateX(Math.PI / 2);
  return solid(THREE, g.translate(x, y, z), rgb);
};
// a flat disc facing +x (face = 1) or -x (face = -1): the hub on a wheel's outer face
const disc = (THREE, r, seg, x, y, z, rgb, face) => {
  const g = new THREE.CircleGeometry(r, seg);
  g.rotateY(face * Math.PI / 2);
  return solid(THREE, g.translate(x, y, z), rgb);
};
// a tyre standing on the ground at (x, z): an open tube (its inner end is always against the chassis), a cap on the outer end and a
// lighter hub disc a little proud of it (12 + 24 + 8 = 44 triangles instead of the 56 of a closed tyre with a hub). With seg = 12
// the cap's corners are the tube's corners (both start on a multiple of 30 degrees).
const wheel = (THREE, r, x, z, w, tyreRgb, hubRgb, seg = 12) => {
  const s = x < 0 ? -1 : 1, tube = new THREE.CylinderGeometry(r, r, w, seg, 1, true);
  tube.rotateZ(Math.PI / 2);
  return [solid(THREE, tube.translate(x, r, z), tyreRgb), disc(THREE, r, seg, x + s * (w / 2), r, z, tyreRgb, s), disc(THREE, r * 0.46, 8, x + s * (w / 2 + 0.012), r, z, hubRgb, s)];
};
// a road wheel standing against a track run: an open tube and a cap on the outer end only (the inner end is inside the track)
const roller = (THREE, r, x, y, z, w, rgb, seg = 8) => {
  const s = x < 0 ? -1 : 1, tube = new THREE.CylinderGeometry(r, r, w, seg, 1, true);
  tube.rotateZ(Math.PI / 2);
  return [solid(THREE, tube.translate(x, y, z), rgb), disc(THREE, r, seg, x + s * (w / 2), y, z, rgb, s)];
};
// a wooden cart wheel: a dark disc, a lighter hub and two crossed spokes standing a little proud of the disc (4 spokes seen)
const woodWheel = (THREE, r, x, y, z, rgb, w, spokeRgb, seg = 12, hub = true) => {
  const out = [cyl(THREE, r, r, w, x, y, z, rgb, 'x', seg)];
  if (hub) out.push(cyl(THREE, r * 0.2, r * 0.2, w * 1.6, x, y, z, spokeRgb, 'x', 6));
  for (let k = 0; k < 2; k++) {
    const g = new THREE.BoxGeometry(w * 1.25, r * 1.84, 0.035);
    g.rotateX((k * Math.PI) / 2 + Math.PI / 4);
    out.push(solid(THREE, g.translate(x, y, z), spokeRgb));
  }
  return out;
};

// colours, sRGB 0..255
const TYRE = [22, 21, 20], HUB = [92, 94, 96], STEEL = [112, 114, 116], GLASS = [30, 34, 38], LAMP = [214, 202, 160];
const WOOD = [92, 70, 48], WOOD_DARK = [58, 44, 32], FRAME = [30, 28, 26];
// Japanese army colours (the same as models.js: the tankette must match the existing one)
const IJA = [104, 94, 62], IJA_DARK = [70, 64, 44];

export function buildMachines(THREE, merge) {
  const m = (parts) => merge(parts);
  const V = {};

  // ---- truckCN: the Chinese army's truck (3-ton, 4x2 class). TYPE 未核实: no source names a make; the research (timeline notes of
  // ev-1212-retreat-main, Durdin via en wiki) says "trucks, guns, buses, carts, command cars mixed in" the stream (核实), nothing
  // more. Size 5.2 x 1.95 x 2.45 m and the shape of a 1930s long-bonnet truck: 推测 (general knowledge). Colour olive-grey
  // [89,100,84]: 推测 (a green-grey against the Japanese khaki-brown of `truck`; no source for the Chinese army's truck paint;
  // measured in the frame at 14:30 the sunlit body is hue 66, saturation 0.36 against the Japanese truck's hue 39, saturation 0.62).
  // The bed matches the Japanese `truck`'s (floor top 1.11 m, z -2.55 .. 0.45) so that the passengers behave.js seats on a bed,
  // the `load` crates and the canvas cover fit it too.
  {
    const OLIVE = [89, 100, 84], OLIVE_DARK = [64, 72, 60], parts = [
      boxAt(THREE, 1.3, 0.5, 5.0, 0, 0.6, -0.05, FRAME),                    // chassis with the axles (down to 0.35 m: hides the wheels' inner ends)
      boxAt(THREE, 1.8, 0.21, 3.0, 0, 0.905, -1.05, WOOD_DARK),             // bed subframe
      boxAt(THREE, 1.9, 0.1, 3.0, 0, 1.06, -1.05, WOOD),                    // bed floor
      boxAt(THREE, 0.06, 0.5, 3.0, 0.92, 1.36, -1.05, OLIVE), boxAt(THREE, 0.06, 0.5, 3.0, -0.92, 1.36, -1.05, OLIVE), // side boards
      boxAt(THREE, 1.9, 0.5, 0.06, 0, 1.36, 0.42, OLIVE), boxAt(THREE, 1.9, 0.5, 0.06, 0, 1.36, -2.52, OLIVE),       // head board, tailgate
      boxAt(THREE, 1.75, 1.4, 1.1, 0, 1.7, 1.05, OLIVE),                    // cab
      boxAt(THREE, 1.8, 0.07, 1.2, 0, 2.415, 1.05, OLIVE_DARK),             // cab roof (top at 2.45 m)
      boxAt(THREE, 1.5, 0.5, 0.04, 0, 2.05, 1.62, GLASS),                   // windscreen
      boxAt(THREE, 1.77, 0.5, 0.7, 0, 2.05, 1.05, GLASS),                   // side windows (one box through the cab)
      boxAt(THREE, 1.05, 0.62, 0.9, 0, 1.2, 2.05, OLIVE),                   // bonnet
      boxAt(THREE, 0.8, 0.55, 0.05, 0, 1.18, 2.51, [36, 34, 30]),           // radiator grille
      boxAt(THREE, 1.9, 0.08, 1.0, 0, 1.0, 2.0, OLIVE_DARK),                // mudguards over the front wheels
      boxAt(THREE, 1.7, 0.1, 0.14, 0, 0.74, 2.57, STEEL),                   // bumper
      boxAt(THREE, 0.16, 0.16, 0.1, 0.68, 1.22, 2.52, LAMP), boxAt(THREE, 0.16, 0.16, 0.1, -0.68, 1.22, 2.52, LAMP), // headlamps
      ...wheel(THREE, 0.5, 0.825, 1.9, 0.3, TYRE, HUB), ...wheel(THREE, 0.5, -0.825, 1.9, 0.3, TYRE, HUB),       // front axle
      ...wheel(THREE, 0.5, 0.805, -1.4, 0.34, TYRE, HUB), ...wheel(THREE, 0.5, -0.805, -1.4, 0.34, TYRE, HUB),   // rear axle (wide tyres)
    ];
    V.truckCN = m(parts);
    // the canvas over the bed (推测: bows and canvas, the top as high as the cab roof; grey-green canvas, see the note on colour)
    V.truckCNCover = m([
      boxAt(THREE, 1.9, 0.85, 3.0, 0, 2.025, -1.05, [118, 130, 114]),
      boxAt(THREE, 1.5, 0.25, 3.0, 0, 2.55, -1.05, [112, 124, 106]),
      boxAt(THREE, 1.9, 0.1, 0.08, 0, 1.75, -2.56, [84, 90, 78]),
    ]);
  }

  // ---- cartBier and cartMats: the hand cart (板车) of models.js (bed 2.1 m, wheels 0.84 m high) with a load of the dead's carriers.
  // The cart as the carrier of the Red Swastika Society's dead: 未核实 (sim_spec_factcheck.md #11: the cited line, research\
  // NANJING1937_SPEC.md l.835, names the Society's TRUCKS, coffins and bearers, not carts; the only cart evidence is cart wheels in
  // the rubble in the 12-19 Zhongshan Rd photo). The puller stands 1.75 m ahead of the origin (behave.js), the shafts end there.
  // Two loads so that the lead can choose (board 16:20Z, ruling 5): `cartBier` = plain wooden coffin boxes (coffins 核实, l.835),
  // `cartMats` = plain pale straw-mat bundles (mats for the dead: 未核实, no source in research\ names them; they appear there only
  // as shelter material, civilians.json). Sizes and colours of both loads: 推测. Nothing else is on either cart.
  const cartFrame = () => [
    ...woodWheel(THREE, 0.42, 0.6, 0.42, -0.2, WOOD_DARK, 0.08, WOOD), ...woodWheel(THREE, 0.42, -0.6, 0.42, -0.2, WOOD_DARK, 0.08, WOOD),
    boxAt(THREE, 1.1, 0.07, 2.1, 0, 0.72, -0.2, WOOD),
    boxAt(THREE, 0.05, 0.14, 2.1, 0.55, 0.82, -0.2, WOOD_DARK), boxAt(THREE, 0.05, 0.14, 2.1, -0.55, 0.82, -0.2, WOOD_DARK),
    boxAt(THREE, 0.06, 0.06, 1.6, 0.3, 0.62, 1.5, WOOD, 0, 0.18), boxAt(THREE, 0.06, 0.06, 1.6, -0.3, 0.62, 1.5, WOOD, 0, 0.18),
  ];
  // cartMats: three long bundles wrapped in straw mat (8-sided, 0.4 m across, 1.8 m long): two on the bed, one on top, two ties
  {
    const MAT = [172, 154, 112], ROPE = [120, 100, 70], parts = cartFrame();
    for (const x of [0.21, -0.21]) parts.push(cyl(THREE, 0.2, 0.2, 1.8, x, 0.755 + 0.2, -0.2, MAT, 'z', 8));
    parts.push(cyl(THREE, 0.2, 0.2, 1.8, 0, 1.3, -0.26, MAT, 'z', 8));
    parts.push(boxAt(THREE, 0.36, 0.04, 0.05, 0, 1.51, -0.85, ROPE), boxAt(THREE, 0.36, 0.04, 0.05, 0, 1.51, 0.35, ROPE));
    V.cartMats = m(parts);
  }
  // cartBier: three plain wooden coffin boxes 0.5 x 0.42 x 1.85 m, two side by side, one on top, tied with a rope
  {
    const COF = [64, 48, 36], LID = [78, 60, 44], ROPE = [150, 128, 86], parts = cartFrame();
    // two coffins on the bed (body 0.38 + lid 0.04 = 0.42 high), x +-0.26, z centre -0.2 (1.85 long)
    for (const x of [0.26, -0.26]) parts.push(boxAt(THREE, 0.48, 0.38, 1.85, x, 0.755 + 0.19, -0.2, COF), boxAt(THREE, 0.5, 0.04, 1.89, x, 0.755 + 0.4, -0.2, LID));
    // the third on top, straddling the two (a little back from the middle, as loaded by hand)
    parts.push(boxAt(THREE, 0.48, 0.38, 1.85, 0, 1.175 + 0.19, -0.26, COF), boxAt(THREE, 0.5, 0.04, 1.89, 0, 1.175 + 0.4, -0.26, LID));
    // the rope: two straps over the top coffin
    parts.push(boxAt(THREE, 0.54, 0.04, 0.05, 0, 1.617, -0.85, ROPE), boxAt(THREE, 0.54, 0.04, 0.05, 0, 1.617, 0.35, ROPE));
    V.cartBier = m(parts);
  }

  // ---- busLake: a city bus of the Jiangnan Bus Co. COLOUR 核实: 淡湖蓝 (light lake blue), research\raw\gap_street_furniture_vehicles
  // .verify.json (zh wiki 南京公交: from 1934 locally built, bodies painted 淡湖蓝). The shade [140,178,206] is 推测 (a reading of
  // the name, kept pale: saturation 0.32 in the albedo, bluer than a grey so that the warm low sun does not turn it mint; measured in
  // the frame, in the sun, see the board line of wp4-machines: well under 0.35). Size 7.5 x 2.2 x 3.0 m and the bonnet-and-box shape: 推测 (like models.js's `bus`).
  {
    const LAKE = [140, 178, 206], BAND = [46, 60, 70], ROOF = [92, 112, 122], parts = [
      boxAt(THREE, 1.6, 0.5, 6.8, 0, 0.45, 0.2, FRAME),                     // chassis (down to 0.2 m: hides the wheels' inner ends)
      boxAt(THREE, 2.2, 1.8, 6.0, 0, 1.55, -0.7, LAKE),                     // body
      boxAt(THREE, 2.14, 0.1, 5.9, 0, 2.5, -0.7, ROOF),                     // roof
      boxAt(THREE, 1.6, 1.0, 1.5, 0, 1.1, 3.0, LAKE),                       // bonnet
      boxAt(THREE, 1.9, 0.7, 0.04, 0, 1.95, 2.32, BAND),                    // windscreen
      boxAt(THREE, 1.5, 0.5, 0.04, 0, 1.95, -3.72, BAND),                   // rear window
      boxAt(THREE, 1.0, 0.55, 0.05, 0, 1.1, 3.77, [50, 52, 50]),            // radiator grille
      boxAt(THREE, 2.1, 0.1, 0.14, 0, 0.7, 3.82, STEEL),                    // bumper
      boxAt(THREE, 0.16, 0.16, 0.12, 0.55, 1.05, 3.8, LAMP), boxAt(THREE, 0.16, 0.16, 0.12, -0.55, 1.05, 3.8, LAMP),
      boxAt(THREE, 0.04, 0.3, 3.8, 0.93, 2.7, -0.9, WOOD_DARK), boxAt(THREE, 0.04, 0.3, 3.8, -0.93, 2.7, -0.9, WOOD_DARK), // roof rack: two rails
    ];
    // the window rows: four panes a side, 1.0 m long with 0.3 m posts between
    for (const sx of [1, -1]) for (let k = 0; k < 4; k++) parts.push(boxAt(THREE, 0.04, 0.62, 1.0, sx * 1.11, 1.95, -3.0 + k * 1.3, BAND));
    for (const sx of [1, -1]) for (const z of [2.6, -2.4]) parts.push(...wheel(THREE, 0.5, sx * 0.95, z, 0.3, TYRE, HUB));
    V.busLake = m(parts);
  }

  // ---- tanketteFlag: the Type 94 tankette of models.js (wave I: the same new shape, 3.08 x 1.62 x 1.62 m, 核实 en wiki Type_94_tankette and ja-tankette-type94; engine in front, the commander's small turret at the REAR) with a thin aerial 2.6 m
  // above the ground, on the rear deck's right side, and a small flag at its top: 核实 that the tankettes before 中华门 on 12-12 had flags on their aerials
  // (research\refs\photo_refs.md Z7: a column of at least 5, noses to the gate); the flag's design is 推测 (a small white cloth with a
  // red disc, the Hinomaru; no writing). The paint is the tankette's of models.js (khaki with a brown band, 未核实, a modelling reference).
  {
    const TRK = [46, 44, 36], BRN = [62, 51, 34], KH = [86, 77, 50], GUNM = [48, 48, 44], parts = [];
    for (const s of [1, -1]) {
      parts.push(
        boxAt(THREE, 0.28, 0.55, 2.4, s * 0.6, 0.275, -0.25, TRK), boxAt(THREE, 0.28, 0.5, 0.6, s * 0.6, 0.4, 1.1, TRK, 0, -0.5),
        boxAt(THREE, 0.36, 0.05, 2.8, s * 0.62, 0.62, -0.1, IJA_DARK), boxAt(THREE, 0.08, 0.12, 1.5, s * 0.8, 0.5, 0.15, [38, 36, 30]),
      );
      for (const z of [-1.0, -0.6, 0.05, 0.45]) parts.push(...roller(THREE, 0.2, s * 0.77, 0.22, z, 0.09, [58, 56, 46]));
      parts.push(...roller(THREE, 0.27, s * 0.77, 0.32, 1.1, 0.09, [58, 56, 46]), ...roller(THREE, 0.22, s * 0.77, 0.24, -1.3, 0.09, [58, 56, 46]));
    }
    parts.push(
      boxAt(THREE, 0.92, 0.5, 1.2, 0, 0.82, -0.9, KH), boxAt(THREE, 0.92, 0.5, 1.2, 0, 0.82, 0.3, BRN), boxAt(THREE, 0.92, 0.5, 0.5, 0, 0.82, 1.15, KH),
      boxAt(THREE, 0.9, 0.3, 0.4, 0, 0.98, 1.4, KH, 0, 0.6), boxAt(THREE, 0.5, 0.26, 1.2, -0.2, 1.17, 0.8, KH), boxAt(THREE, 0.38, 0.3, 0.55, 0.28, 1.2, 0.95, BRN),
      boxAt(THREE, 0.92, 0.22, 1.2, 0, 1.18, -0.85, KH), cyl(THREE, 0.4, 0.36, 0.4, 0, 1.42, -0.8, BRN, 'y', 8), cyl(THREE, 0.03, 0.03, 0.7, 0, 1.5, -0.3, GUNM, 'z', 5),
      boxAt(THREE, 0.5, 0.4, 0.06, 0, 0.95, -1.5, IJA_DARK),
      // the aerial on the rear deck (right side), from the deck to 2.6 m, the flag streaming astern from its top
      boxAt(THREE, 0.03, 1.3, 0.03, 0.38, 1.95, -1.35, IJA_DARK),
      boxAt(THREE, 0.012, 0.27, 0.4, 0.38, 2.465, -1.57, [214, 210, 198]),
      cyl(THREE, 0.08, 0.08, 0.03, 0.38, 2.465, -1.57, [170, 40, 36], 'x', 8),
    );
    V.tanketteFlag = m(parts);
  }

  // ---- tankCN: the light tank at 挹江门 on the night of 12-12 (about 21:00): ONE tank that charged the 36th Division's barrier
  // troops at the gate until a grenade stopped it (核实: research\raw\gap_gate_status_1937.json gate_yijiang and ca25; the en wiki
  // line says "the crowd", sim_spec_factcheck.md #13 corrects it to the barrier line). TYPE 未核实: no source names the gate tank.
  // The Panzer I Ausf. A was the German tank the Chinese used at Nanjing (核实: research\raw\chinese_army.verify.json ca14, ~10 of
  // the 3rd Armoured Battalion; research\data\uniforms.json cn_tanks; en wiki Panzer_I, read 11-23: "around ten ... sold to the Republic of China" in 1937), but that the gate tank was one of them is 未核实. So this is a
  // NEUTRAL STAND-IN of that class (wave I: redrawn to the Panzer I Ausf. A's published size, 4.02 x 2.06 x 1.72 m, en wiki Panzer_I infobox; two men, two 7.92 mm MG 13): a low hull with a sloped nose, a narrow superstructure, a small
  // turret offset to the right with twin machine guns, four road wheels a side, front sprocket, rear idler, an engine deck astern: layout 推测 from general knowledge (the page gives no wheel count). The paint is 未核实: a cool mid grey [110,114,116] (the spec says grey-green [96,102,96];
  // at night in the crush at the gate, among the olive trucks of the same stream, that read as one more dark green box, so it is greyer and a little
  // lighter). No marking, no number.
  {
    const G = [110, 114, 116], G_DARK = [76, 80, 82], TRK = [50, 54, 56], GUNM = [38, 40, 38], WH = [44, 46, 44], parts = [];
    for (const s of [1, -1]) {
      parts.push(
        boxAt(THREE, 0.3, 0.5, 3.3, s * 0.87, 0.28, -0.1, TRK),                         // track run
        boxAt(THREE, 0.3, 0.45, 0.6, s * 0.87, 0.42, 1.65, TRK, 0, -0.5),               // its front, rising to the sprocket
        boxAt(THREE, 0.34, 0.05, 3.7, s * 0.88, 0.7, -0.1, G_DARK),                     // mudguard
      );
      for (const z of [-1.1, -0.45, 0.2, 0.85]) parts.push(...roller(THREE, 0.24, s * 1.0, 0.26, z, 0.08, WH));
      parts.push(...roller(THREE, 0.28, s * 1.0, 0.34, 1.55, 0.08, WH), ...roller(THREE, 0.22, s * 1.0, 0.24, -1.6, 0.08, WH));
    }
    parts.push(
      boxAt(THREE, 1.44, 0.45, 3.7, 0, 0.72, 0, G),                                    // hull
      boxAt(THREE, 1.4, 0.3, 0.55, 0, 0.9, 1.75, G, 0, 0.7),                           // sloped nose
      boxAt(THREE, 1.26, 0.4, 1.9, 0, 1.15, 0.2, G),                                   // narrow superstructure
      boxAt(THREE, 1.2, 0.12, 1.1, 0, 1.0, -1.35, G_DARK),                             // engine deck
      boxAt(THREE, 0.5, 0.02, 0.06, 0, 1.07, -1.1, GUNM), boxAt(THREE, 0.5, 0.02, 0.06, 0, 1.07, -1.35, GUNM), boxAt(THREE, 0.5, 0.02, 0.06, 0, 1.07, -1.6, GUNM), // engine louvres
      cyl(THREE, 0.42, 0.38, 0.3, 0.25, 1.5, -0.1, G, 'y', 8),                         // turret, offset to the right
      boxAt(THREE, 0.4, 0.2, 0.14, 0.25, 1.52, 0.38, G_DARK),                          // the guns' mantlet
      cyl(THREE, 0.022, 0.022, 0.7, 0.14, 1.54, 0.7, GUNM, 'z', 5), cyl(THREE, 0.022, 0.022, 0.7, 0.36, 1.54, 0.7, GUNM, 'z', 5), // twin machine guns
      boxAt(THREE, 0.26, 0.07, 0.26, 0.2, 1.685, -0.2, G_DARK),                        // the hatch (top at 1.72 m)
      boxAt(THREE, 0.02, 0.5, 0.02, -0.5, 1.2, -1.5, STEEL),                           // aerial
    );
    V.tankCN = m(parts);
  }

  // ---- wagon: a four-wheeled horse-drawn transport wagon with a canvas tilt, for the Japanese marches' trains (P3). That the marches
  // had horse transport: 推测 (general knowledge of 1937 divisions; no source in research\ for a wagon, a type or a count). Body
  // 3.0 m, 1.7 m wide, 2.35 m high with the tilt, the draught pole to 4.2 m overall: all 推测. The horses are the horse model, put
  // by the behaviour at the end of the pole. Colours 推测: the army's dark wood and canvas.
  {
    const DARK = [70, 64, 44], CAN = [128, 120, 92], CAN_TOP = [120, 112, 86], parts = [
      ...woodWheel(THREE, 0.55, 0.8, 0.523, -0.9, WOOD_DARK, 0.08, WOOD, 10, false), ...woodWheel(THREE, 0.55, -0.8, 0.523, -0.9, WOOD_DARK, 0.08, WOOD, 10, false),
      ...woodWheel(THREE, 0.45, 0.8, 0.428, 0.8, WOOD_DARK, 0.08, WOOD, 10, false), ...woodWheel(THREE, 0.45, -0.8, 0.428, 0.8, WOOD_DARK, 0.08, WOOD, 10, false),
      boxAt(THREE, 1.5, 0.1, 3.0, 0, 1.2, -0.4, WOOD),                                                    // bed
      boxAt(THREE, 0.06, 0.45, 3.0, 0.78, 1.5, -0.4, DARK), boxAt(THREE, 0.06, 0.45, 3.0, -0.78, 1.5, -0.4, DARK), // side boards
      boxAt(THREE, 1.5, 0.45, 0.06, 0, 1.5, 1.07, DARK), boxAt(THREE, 1.5, 0.45, 0.06, 0, 1.5, -1.87, DARK),   // head and tail boards
      boxAt(THREE, 1.5, 0.5, 2.8, 0, 1.95, -0.4, CAN), boxAt(THREE, 1.1, 0.15, 2.8, 0, 2.275, -0.4, CAN_TOP),   // canvas tilt
      boxAt(THREE, 0.1, 0.1, 1.4, 0, 0.9, 1.6, WOOD_DARK),                                                  // draught pole
    ];
    V.wagon = m(parts);
  }

  // ---- puff: a ball of gun smoke, a low-poly sphere of radius 1 m (80 triangles), pale warm grey, asked for by WP6's artillery
  // (board 15:55Z). Its origin is at the BOTTOM of the ball (the loader wants every kind's lowest point on the ground), so the
  // ball's centre is at 1 m x the instance's vertical scale above the point it is put at. The colour is 推测 (smoke drawn pale so
  // that it reads against the dark ground). Not a machine: the smoke of the guns.
  {
    const g = new THREE.SphereGeometry(1, 8, 6);
    V.puff = m([solid(THREE, g.translate(0, 1, 0), [176, 168, 154])]);
  }

  return V;
}

// how many of each can be drawn at once (the mod's THING_CAP takes these)
export const MACHINE_CAP = { truckCN: 400, truckCNCover: 400, tankCN: 20, busLake: 40, cartBier: 120, cartMats: 120, tanketteFlag: 40, wagon: 60, puff: 120 };
// contact darkening under each: [width, length, strength] like mods\people.js's FOOT
export const MACHINE_FOOT = { truckCN: [2.4, 6.0, 0.5], busLake: [2.8, 8.0, 0.5], cartBier: [1.6, 3.0, 0.35], cartMats: [1.6, 3.0, 0.35], tanketteFlag: [2.2, 3.8, 0.5], tankCN: [2.4, 4.4, 0.5], wagon: [2.2, 5.0, 0.4], puff: [0, 0, 0] };
export const KIND_NAMES = Object.keys(MACHINE_CAP);
