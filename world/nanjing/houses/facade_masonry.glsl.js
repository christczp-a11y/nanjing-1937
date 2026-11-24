var e=`
    float njId = floor(seed * 4096.0 + 0.5);
    vec2 bid = vec2(mod(njId, 61.0) * 17.0 + 3.0, mod(njId, 53.0) * 13.0 + 7.0);
    vec3 col = diffuseColor.rgb;
    float charN = min(vBurn, 1.0), burnAge = max(vBurn - 1.0, 0.0);
    bool inside = !gl_FrontFacing;
    gRough = 0.88; gMetal = 0.0; gEmissive = vec3(0.0); gNm = vec3(0.0, 0.0, 1.0);
    // the style code (masonry.js): design, material, type group, bay width
    // (the integers packed in the attributes come back from the interpolation a hair off: round them before taking them apart)
    float cwI = floor(cellW + 0.5);
    float lay = floor(layer + 0.5);
    float des = mod(lay, 8.0), matc = mod(floor(lay / 8.0), 4.0), tgr = mod(floor(lay / 32.0), 8.0), bwI = floor(lay / 256.0) * 0.1;
    // the footprint of a pixel on the surface (derivatives are taken here, in uniform control flow)
    vec2 px = max(vec2(fwidth(u), fwidth(v)), vec2(1e-4));
    float dUdx = dFdx(u);   // (integrator 11-10) which way u runs on the screen: the characters of a sign are mirrored where it runs leftwards, and are turned back below
    float pxm = max(px.x, px.y), psl = max(fwidth(floorH), 1e-4);
    float fadeB = 1.0 - smoothstep(0.015, 0.045, pxm);   // brick courses and mortar
    float farW = smoothstep(0.1, 0.4, pxm);              // mullions, frames
    vec3 skyTint = vec3(0.34, 0.42, 0.55);
    if (kind > 10.5 && kind < 11.5) {
      // ---- a sign board (推测): lacquered board with a border; strokes that read as writing from afar (no real characters)
      float wlen = floor(cwI / 8.0) / 4.0, hgt = 0.64;
      bool vert = wlen < 1.2;
      float v0 = vert ? floorH + 0.5 : floorH - 0.98, cell = 0.46;
      float gy = vert ? (v - v0) / cell : (v - v0) / hgt;
      float lumB = dot(col, vec3(0.3, 0.59, 0.11));
      vec3 ink = lumB > 0.35 ? vec3(0.03, 0.025, 0.02) : (col.r > col.g * 1.8 ? vec3(0.78, 0.66, 0.32) : vec3(0.74, 0.62, 0.3));
      if (lumB < 0.06) ink = vec3(0.7, 0.58, 0.26);
      // (integrator 11-10) real characters: the shop's name in traditional script from the atlas uSign (houses/signs.js; the names are
      // invented, 推测). A horizontal board is read right to left (as most were in 1937), a vertical one from the top. Two to five characters,
      // by how many fit; the group of names of that length is chosen by the building's seed.
      float nmH = hash12(bid * 1.31 + vec2(floor(wlen * 4.0), vert ? 9.0 : 2.0));
      float nc = vert ? (nmH > 0.5 ? 5.0 : 4.0) : clamp(floor((wlen - 0.3) / cell), 2.0, 5.0);
      float gIdx, gCu, gCv, gOn;
      if (vert) {
        float tTop = 0.3 + (6.4 - nc) * 0.5 + nc - gy;       // cells down from the top of the characters
        gIdx = floor(tTop); gCu = u / max(wlen, 0.3); if (dUdx < 0.0) gCu = 1.0 - gCu; gCv = 1.0 - fract(tTop);
        gOn = step(0.0, tTop) * step(tTop, nc);
      } else {
        float cx = ((dUdx < 0.0 ? wlen - u : u) - 0.5 * (wlen - nc * cell)) / cell;
        gIdx = nc - 1.0 - floor(cx); gCu = fract(cx);
        float cy = (v - (v0 + 0.5 * (hgt - cell))) / cell;
        gCv = cy; gOn = step(0.0, cx) * step(cx, nc) * step(0.0, cy) * step(cy, 1.0);
      }
      float gRow = (nc - 2.0) * 10.0 + floor(nmH * 10.0);
      float lodG = clamp(log2(max(max(px.x, px.y) / cell * 96.0, 1.0)), 0.0, 4.0);
      float gly = textureLod(uSign, vec2((clamp(gIdx, 0.0, 5.0) + mix(0.05, 0.95, clamp(gCu, 0.0, 1.0))) / 6.0, (gRow + 1.0 - mix(0.05, 0.95, clamp(gCv, 0.0, 1.0))) / 40.0), lodG).r * gOn;
      float margin = vert ? box(u, 0.07, max(wlen - 0.07, 0.1), px.x) : box(u, 0.12, max(wlen - 0.12, 0.2), px.x);
      float inner = margin * (vert ? step(0.3, gy) * step(gy, 6.7) : box(gy, 0.1, 0.9, max(px.y / hgt, 1e-3)));
      float fadeG = 1.0 - smoothstep(0.06, 0.16, pxm);   // (integrator: the characters are mipmapped now, so they hold on to a larger pixel)
      vec3 c3 = col * (0.9 + 0.2 * vnoise(vec2(u, v) * 3.0 + bid));
      c3 = mix(c3, ink, gly * inner * fadeG * 0.92);
      c3 = mix(c3, ink * 1.1, (1.0 - box(u, 0.05, max(wlen - 0.05, 0.1), px.x)) * 0.5 * fadeG);
      gRough = 0.5;
      if (charN > 0.0) c3 = mix(c3, vec3(0.03), charN * 0.8);
      if (inside) c3 *= 0.5;
      diffuseColor.rgb = c3;
    } else if (kind < 10.5 || (kind > 18.5 && kind < 19.5) || (kind > 21.5 && kind < 22.5)) {
      // ---- walls (10), plain masonry (19: mouldings, piers, chimneys), corrugated iron walls (22)
      float role = mod(cwI, 8.0), wlen = floor(cwI / 8.0) / 4.0;
      bool plain = kind > 18.5 && kind < 19.5, ironW = kind > 21.5;
      float fh = max(floorH, 2.4);
      float storeysN = max(1.0, floor(height / fh + 0.5));
      float aboveE = step(height - 0.02, v);
      float floorI = min(floor(max(v, 0.0) / fh), storeysN - 1.0), fy = v - floorI * fh;
      vec2 sq = vec2(u, v);
      float coarse = vnoise(sq * 0.17 + bid), mid2 = vnoise(sq * 1.3 + bid * 0.7);
      vec3 mortC = mix(col, vec3(0.68, 0.66, 0.62), 0.6);
      vec3 trimC = matc < 1.5 ? (matc < 0.5 ? vec3(0.64, 0.62, 0.57) : vec3(0.72, 0.69, 0.62)) : col * 1.06;
      vec3 wallC = col;
      if (ironW) {
        // corrugated iron cladding: ribs every 7.6 cm, sheets 69 cm wide, rust at the foot and the laps
        float rib = u / 0.076, fadeR = 1.0 - smoothstep(0.1, 0.35, px.x / 0.076);
        float rust = smoothstep(0.5, 0.85, vnoise(vec2(u * 0.6, v * 0.35) + bid)) * 0.6 + 0.4 * (1.0 - smoothstep(0.0, 1.2, v));
        wallC = col * (0.92 + 0.1 * sin(6.2832 * rib) * fadeR) * (0.92 + 0.14 * coarse);
        wallC = mix(wallC, vec3(0.36, 0.2, 0.12), rust * 0.6);
        gNm = normalize(vec3(0.4 * cos(6.2832 * rib) * fadeR, 0.0, 1.0));
        gRough = 0.6; gMetal = 0.25 * (1.0 - rust);
      } else if (matc < 1.5) {
        // brick, running bond: grey 24 x 6.2 cm, red 23 x 7 cm, joints 1 cm
        float chh = matc < 0.5 ? 0.062 : 0.07, bl = matc < 0.5 ? 0.25 : 0.24;
        float cI = floor(v / chh), cf = fract(v / chh);
        float uu = u / bl + 0.5 * mod(cI, 2.0), bI = floor(uu), bf = fract(uu);
        float wC = px.y / chh, wU = px.x / bl;
        float jm = max(1.0 - box(cf, 0.14, 1.0, wC), 1.0 - box(bf, 0.04, 1.0, wU));
        float bh = hash12(vec2(bI, cI) + bid * 0.13);
        vec3 bc = col * (0.84 + 0.3 * bh);
        bc *= 1.0 - 0.2 * step(0.95, hash12(vec2(bI, cI) + bid * 0.31 + 5.0));
        vec3 brickW = mix(bc, mortC * (0.9 + 0.15 * bh), jm * 0.85);
        wallC = mix(mix(col, mortC, 0.1), brickW, fadeB) * (0.9 + 0.2 * coarse);
        gNm = normalize(vec3((hash12(vec2(bI, cI) + 17.0) - 0.5) * 0.14 * fadeB, (0.5 - cf) * 0.28 * jm * fadeB, 1.0));
      } else {
        // render and cement: a rough grain, patchy stains; a rendered base is scored like ashlar (推测)
        float grain = vnoise(sq * 26.0 + bid);
        wallC = col * (0.93 + 0.14 * mid2) * mix(1.0, 0.95 + 0.1 * grain, fadeB) * (0.92 + 0.16 * coarse);
        if (tgr < 0.5 && des > 1.5 && des < 2.5 && floorI < 0.5) {
          float jh = 1.0 - box(fract(v / 0.55), 0.045, 1.0, px.y / 0.55);
          float jv = 1.0 - box(fract(u / 1.1 + 0.5 * mod(floor(v / 0.55), 2.0)), 0.02, 1.0, px.x / 1.1);
          wallC *= 1.0 - 0.22 * max(jh, jv) * (1.0 - farW);
        }
        gNm = normalize(vec3((grain - 0.5) * 0.12 * fadeB, (vnoise(sq * 26.0 + 9.0 + bid) - 0.5) * 0.12 * fadeB, 1.0));
      }
      // weathering: a damp dark plinth, rain streaks, grime under the cornice, run-off under the sills (below)
      float streak = vnoise(vec2(u * 2.2 + seed * 7.0, v * 0.12 + seed * 40.0));
      wallC *= 1.0 - 0.16 * (1.0 - smoothstep(0.0, 0.9, v)) - 0.1 * smoothstep(0.55, 0.95, streak) - 0.12 * streak * smoothstep(height - 1.2, height, v) * (1.0 - aboveE);
      wallC *= 0.94 + 0.1 * vnoise(sq * 0.5 + bid * 1.7);
      // a stone or cement plinth (勒脚) 55 cm high under a brick or render wall, with a pale cap (推测)
      float plin = (1.0 - smoothstep(0.52, 0.56, v)) * step(0.0, v) * (tgr > 2.5 && tgr < 3.5 ? 0.0 : 1.0);
      wallC = mix(wallC, vec3(0.42, 0.41, 0.39) * (0.8 + 0.3 * mid2) * (0.8 + 0.3 * vnoise(vec2(u * 0.4, v * 3.0) + bid)), plin * 0.85 * (plain ? 0.0 : 1.0));
      wallC = mix(wallC, vec3(0.66, 0.64, 0.6), box(v, 0.55, 0.6, px.y) * 0.8 * (plain ? 0.0 : 1.0) * step(0.1, wlen));
      float inOpen = 0.0, isGlass = 0.0, isDoor = 0.0, isShop = 0.0, lit = 0.0, shutM = 0.0, archM = 0.0, sillM = 0.0, sillSh = 0.0, pilM = 0.0, bandM = 0.0;
      vec3 openC = vec3(0.0);
      if (!plain && !ironW) {
        // ---- the bays: window width, sill, piers by style (推测)
        float winW = 1.1, winH = 1.8, sillH = 0.95, pierW = 0.0, headT = 0.0, shut = 0.0, strings = 1.0, spand = 0.0, doorW = 1.3, doorH = 2.4, paneX = 2.0, paneY = 3.0;
        if (tgr < 0.5) {
          if (des < 0.5)      { winW = 1.15; winH = 1.9; sillH = 0.95; headT = 1.0; pierW = 0.19; shut = 1.0; }
          else if (des < 1.5) { winW = 1.0; winH = 1.7; sillH = 1.0; }
          else if (des < 2.5) { winW = 1.5; winH = 2.5; sillH = 0.8; headT = 2.0; pierW = 0.35; strings = 0.0; paneX = 3.0; paneY = 5.0; }
          else if (des < 3.5) { winW = 1.2; winH = 1.9; sillH = 0.95; headT = 2.0; pierW = 0.2; shut = 1.0; }
          else if (des < 4.5) { winW = 1.0; winH = 1.5; sillH = 1.0; }
          else if (des < 5.5) { winW = 2.4; winH = 1.8; sillH = 0.9; pierW = 0.28; spand = 1.0; strings = 0.0; paneX = 6.0; paneY = 5.0; }
          else if (des < 6.5) { winW = 1.0; winH = 1.7; sillH = 1.0; headT = 1.0; shut = 1.0; }
          else                { winW = 1.2; winH = 2.0; sillH = 0.9; pierW = 0.18; }
        } else if (tgr < 1.5) {
          winW = 1.5; winH = 2.2; sillH = 0.9; pierW = 0.22; headT = des > 2.5 ? 0.0 : 1.0; doorW = 2.2; doorH = 3.0; strings = 1.0; paneX = 3.0; paneY = 4.0;
        } else if (tgr < 2.5) {
          winW = 1.0; winH = 1.5; sillH = 0.9; shut = 1.0; doorW = 1.2; doorH = 2.3;
        } else if (tgr < 3.5) {
          winW = 0.9; winH = 0.6; sillH = 3.0; doorW = 3.4; doorH = 3.7; strings = 0.0; paneX = 4.0; paneY = 3.0;
        } else {
          winW = 2.0; winH = 3.3; sillH = 1.0; pierW = 0.3; headT = 1.0; strings = 0.0; paneX = 7.0; paneY = 11.0;
        }
        float bw = bwI > 0.05 ? bwI : 3.4;
        float nb = max(1.0, floor(wlen / bw + 0.5));
        float off = max(wlen - nb * bw, 0.0) * 0.5;
        float ub = u - off;
        float bi = clamp(floor(ub / bw), 0.0, nb - 1.0);
        float bx = ub - (bi + 0.5) * bw;
        float bd = (0.5 - abs(bx / bw)) * bw;   // distance from the bay's edge: the pier lies in 0..pierW
        float inGrid = step(0.0, ub) * step(ub, nb * bw);
        float midB = floor(nb * 0.5);
        bool shopFace = role < 0.5 && tgr < 0.5 && floorI < 0.5;
        winW = min(winW, max(bw - 2.0 * pierW - (shut > 0.5 ? 1.1 : 0.3), 0.5));
        float ow = winW, oy0 = sillH, oy1 = sillH + winH, doorHere = 0.0, closed = 0.0;
        float hb = hash12(vec2(bi, njId) + 31.0);
        if ((role > 0.5 && role < 1.5) || (role > 2.5 && role < 3.5 && tgr < 0.5)) { ow = winW * 0.85; oy0 = floorI < 0.5 ? max(sillH, 1.3) : sillH; oy1 = oy0 + winH * 0.8; headT = 0.0; shut = 0.0; }
        if (tgr > 0.5 && tgr < 3.5 && role < 0.5 && floorI < 0.5 && abs(bi - midB) < 0.5) { doorHere = 1.0; ow = doorW; oy0 = 0.0; oy1 = doorH; headT = tgr < 1.5 ? 2.0 : 0.0; }
        if (shopFace) {
          closed = step(0.7, hb);
          ow = bw - 2.0 * pierW - 0.4; oy0 = 0.55; oy1 = fh - 1.08; headT = 0.0; shut = 0.0;
          if (des > 1.5 && des < 2.5) { ow = 1.7; oy0 = 0.95; oy1 = fh - 0.5; headT = 2.0; }
          if (abs(bi - midB) < 0.5 || (nb > 3.5 && abs(bi - midB + 1.0) < 0.5 && hb > 0.4)) { doorHere = 1.0; ow = des > 1.5 && des < 2.5 ? 2.4 : min(1.5, ow); oy0 = 0.0; oy1 = des > 1.5 && des < 2.5 ? fh - 0.3 : 2.5; headT = des > 1.5 && des < 2.5 ? 2.0 : 0.0; closed = 0.0; }
        }
        if (tgr > 2.5 && tgr < 3.5) {
          // a warehouse: sliding doors in some bays, small high windows in the others; gables carry a vent
          if (role < 2.5) { if (hb < 0.5) { doorHere = 1.0; ow = min(doorW, bw - 0.5); oy0 = 0.0; oy1 = doorH; } }
        }
        float hwid = ow * 0.5;
        float ySpr = oy1;
        float yTop = oy1;
        if (headT > 0.5 && headT < 1.5) yTop = oy1 - 0.2 * pow(abs(bx) / max(hwid, 0.1), 2.0);
        else if (headT > 1.5) yTop = min(oy1, oy1 - hwid + sqrt(max(hwid * hwid - bx * bx, 0.0)));
        float winOn = (role < 1.5) ? 1.0 : (role < 3.5 && (tgr > 0.5 && tgr < 2.5 || tgr > 3.5) ? 1.0 : 0.0);
        if (tgr > 2.5 && tgr < 3.5 && role > 1.5) winOn = 0.0;
        // a free side wall of a shop or office block (not a party wall: nothing here knows the neighbours, 推测): a few small windows on the upper floors only, the ground floor stays blank
        if (tgr < 0.5 && role > 2.5 && role < 3.5) winOn = step(0.45, hb) * step(0.5, floorI);
        float valid = inGrid * winOn * (1.0 - aboveE) * step(v, height - 0.15) * step(0.0, v + 0.001);
        // the first bay of a bank or the sides of a corner shop: nothing else to say
        inOpen = valid * box(bx, -hwid, hwid, px.x) * box(fy, oy0, yTop, px.y);
        float dOut = max(abs(bx) - hwid, max(fy - yTop, oy0 - fy));
        float exists = valid * step(0.0, ow - 0.01) * step(abs(bx), hwid + 0.7) * step(oy0 - 0.4, fy) * step(fy, yTop + 0.5);
        // piers (pilasters): rendered, between the bays; giant ones on a bank
        float pierOn = step(0.01, pierW) * inGrid * (1.0 - aboveE) * step(bd, pierW) * step(0.0, v);
        pilM = pierOn;
        wallC = mix(wallC, trimC, pierOn * 0.8);
        // architrave round the opening, sill below it with its shadow, run-off streak under the sill
        float arch = exists * step(0.0, dOut) * (1.0 - smoothstep(0.1, 0.13, dOut)) * (shopFace || doorHere > 0.5 ? 0.0 : 1.0);
        archM = arch * (tgr < 0.5 && (des < 0.5 || (des > 0.5 && des < 1.5) || des > 6.5) || tgr > 0.5 && tgr < 2.5 ? 1.0 : 0.35);
        wallC = mix(wallC, trimC, archM * (1.0 - farW * 0.5));
        sillM = exists * (shopFace ? 0.0 : 1.0) * box(fy, oy0 - 0.1, oy0 + 0.0, px.y) * box(bx, -hwid - 0.09, hwid + 0.09, px.x);
        sillSh = exists * (shopFace ? 0.0 : 1.0) * box(fy, oy0 - 0.45, oy0 - 0.1, px.y) * box(bx, -hwid - 0.02, hwid + 0.02, px.x);
        wallC = mix(wallC, trimC * 1.05, sillM);
        wallC *= 1.0 - 0.1 * sillSh - 0.05 * exists * (shopFace ? 0.0 : 1.0) * (1.0 - smoothstep(0.0, 1.4, oy0 - fy)) * step(fy, oy0) * box(bx, -hwid * 0.8, hwid * 0.8, px.x);
        // shutters (louvred, folded back beside the window), on some buildings
        float shutOn = shut * step(0.35, hash12(bid + 4.1)) * exists * (1.0 - doorHere) * (shopFace ? 0.0 : 1.0);
        float sx = abs(bx) - hwid - 0.02;
        shutM = shutOn * step(0.0, sx) * step(sx, 0.5) * step(oy0, fy) * step(fy, oy1);
        vec3 shutC = hash12(bid + 8.8) < 0.5 ? vec3(0.07, 0.16, 0.09) : vec3(0.2, 0.11, 0.07);
        float slat = 0.8 + 0.25 * step(0.5, fract(fy / 0.045));
        wallC = mix(wallC, shutC * slat, shutM * (1.0 - farW * 0.4));
        // string courses at the floors and a lime-wash band on a red brick front (推测)
        bandM = step(0.5, floorI) * box(fy, -0.02, 0.14, px.y) * strings * (1.0 - aboveE);
        wallC = mix(wallC, trimC, bandM * 0.8);
        wallC *= 1.0 - 0.1 * step(0.5, floorI) * box(fy, -0.2, -0.02, px.y) * strings;
        if (matc > 0.5 && matc < 1.5 && tgr < 0.5 && des > 2.5 && des < 3.5) {
          float wb = max(box(fy, oy0 - 0.12, oy0, px.y), box(fy, oy1 + 0.02, oy1 + 0.2, px.y)) * (1.0 - aboveE) * inGrid;
          wallC = mix(wallC, trimC, wb * 0.85);
        }
        // spandrels of a modern front: dark panels between the windows of the storeys
        wallC = mix(wallC, wallC * 0.62, spand * (1.0 - aboveE) * inGrid * box(fy, oy1, fh - 0.1, px.y) * (1.0 - pierOn));
        // the parapet: recessed panels (a balustrade on a bank), the piece on it (推测)
        if (aboveE > 0.5) {
          float ph = v - height, pu = mod(u, 1.9);
          float pnl = box(pu, 0.16, 1.74, px.x) * box(ph, 0.2, 0.7, px.y) * step(0.8, 0.5 + ph);
          wallC *= 1.0 - 0.18 * (1.0 - pnl) * 0.0 - 0.14 * pnl * (1.0 - farW);
          if (des > 1.5 && des < 2.5 && tgr < 0.5) {
            float bal = 1.0 - box(fract(u / 0.3), 0.22, 0.78, px.x / 0.3);
            wallC *= 1.0 - 0.45 * bal * box(ph, 0.1, 0.95, px.y) * (1.0 - farW);
          }
        }
        // ---- what fills an opening
        vec2 o = vec2(bx + hwid, fy - oy0);
        float oh = max(yTop - oy0, 0.1);
        float lampRate = uStoryDay < 12.5 ? 0.09 : 0.012;
        if (doorHere > 0.5 && tgr < 3.5) {
          // a door of two leaves in panels, a fanlight above it on the better buildings; a shop door stands open on a dark room
          float plank = fract(o.x / max(ow * 0.5, 0.3)), seam = 1.0 - box(plank, 0.03, 0.97, max(fwidth(o.x / max(ow * 0.5, 0.3)), 1e-4));
          vec3 wood = mix(vec3(0.07, 0.045, 0.03), vec3(0.14, 0.09, 0.06), hash12(bid + 11.0));
          float pnlD = box(fract(o.x / max(ow * 0.5, 0.3)), 0.14, 0.86, max(fwidth(o.x / max(ow * 0.5, 0.3)), 1e-4)) * (box(o.y, 0.25, 1.2, px.y) + box(o.y, 1.35, oh - 0.55, px.y));
          openC = wood * (0.8 + 0.5 * pnlD) * (1.0 - 0.5 * seam * (1.0 - farW));
          if (shopFace && hb > 0.45) openC = mix(vec3(0.03, 0.025, 0.02), vec3(0.1, 0.07, 0.05), smoothstep(0.0, 2.5, o.y));
          float fan = step(oh - 0.5, o.y) * step(headT, 1.99);
          openC = mix(openC, vec3(0.05, 0.06, 0.07) + 0.04 * skyTint, fan * (tgr > 0.5 ? 1.0 : 0.0));
          isDoor = 1.0;
          lit = step(1.0 - lampRate * 2.0, hash12(bid + bi * 3.7)) * (1.0 - step(0.01, charN));
        } else if (shopFace) {
          if (closed > 0.5) {
            // shut with boards (排门板), 20 cm wide, each a shade of its own
            float bd2 = fract(u / 0.2), bwf = max(px.x / 0.2, 1e-4);
            float gap = (1.0 - box(bd2, 0.04, 0.96, bwf)) * (1.0 - smoothstep(0.2, 0.6, bwf));
            vec3 boards = vec3(0.2, 0.13, 0.08) * (0.75 + 0.5 * hash12(vec2(floor(u / 0.2), njId)));
            openC = mix(boards, boards * 0.4, gap);
            isDoor = 1.0;
          } else {
            // a glazed shop window (推测): dark-stained timber frame, mullions about every metre and a transom, a dark room with shelves of goods; the glass mirrors the sky
            float mul = 1.0 - box(fract(o.x / 1.05), 0.018, 0.982, max(px.x / 1.05, 1e-4));
            float trn = box(o.y, oh * 0.8 - 0.035, oh * 0.8 + 0.035, px.y);
            float frm = 1.0 - box(o.x, 0.07, ow - 0.07, px.x) * box(o.y, 0.07, oh - 0.07, px.y);
            float nearB = 1.0 - smoothstep(0.1, 0.3, px.x);
            float bars = clamp(max(max(mul, trn), frm), 0.0, 1.0) * nearB;
            float shelfRow = floor(o.y / 0.42), cellX = floor(o.x / 0.33);
            float goodsOn = step(0.4, hash12(vec2(shelfRow, cellX) + bid)) * step(fract(o.y / 0.42), 0.58) * step(0.3, o.y) * step(o.y, oh * 0.7) * nearB;
            vec3 goodsC = vec3(0.34, 0.2, 0.11) * (0.5 + hash12(vec2(cellX, shelfRow) + bid + 3.0)) * mix(vec3(1.0), vec3(0.6, 0.8, 1.0), step(0.75, hash12(vec2(cellX, shelfRow) + bid + 7.0)));
            vec3 room = vec3(0.03, 0.024, 0.02) * (0.6 + 0.8 * vnoise(o * 3.0 + bid)) * (0.45 + 0.8 * smoothstep(0.0, 1.8, o.y));
            room = mix(room, goodsC * 0.35 * (0.5 + 0.5 * smoothstep(0.0, 1.5, o.y)), goodsOn);
            openC = mix(room + skyTint * 0.04 * (1.0 - o.y / oh), vec3(0.07, 0.045, 0.03), bars);
            openC = mix(openC, vec3(0.1, 0.075, 0.05), (1.0 - box(o.y, 0.05, oh - 0.05, px.y)) * 0.8);
            isGlass = (1.0 - closed) * (1.0 - bars);
            lit = step(1.0 - lampRate * 5.0, hash12(bid + bi * 3.7 + 9.0)) * (1.0 - step(0.01, charN));
          }
        } else if (tgr > 2.5 && tgr < 3.5 && doorHere > 0.5) {
          // sliding doors of a warehouse: boarded leaves, a track above, the door of a bay shut or standing part open
          float bd2 = fract(o.x / 0.18);
          vec3 lc = hash12(bid + 6.1) < 0.4 ? vec3(0.09, 0.14, 0.11) : hash12(bid + 6.1) < 0.7 ? vec3(0.2, 0.1, 0.07) : vec3(0.17, 0.12, 0.08);
          openC = lc * (0.75 + 0.5 * hash12(vec2(floor(o.x / 0.18), bi + njId))) * (1.0 - 0.4 * (1.0 - box(bd2, 0.04, 0.96, max(px.x / 0.18, 1e-4))) * (1.0 - farW));
          float ajar = step(0.75, hash12(bid + bi * 2.3 + 77.0));
          openC = mix(openC, vec3(0.02, 0.018, 0.016), ajar * step(0.0, bx) * step(abs(bx), hwid) * step(0.3, o.x / ow) * 0.0 + ajar * step(o.x, ow * 0.45) * 0.9);
          isDoor = 1.0;
        } else {
          // a window: sash or casement with panes, painted white or dark brown, glass that mirrors the sky; curtains in some
          vec2 pq = vec2(o.x / max(ow, 0.1) * paneX, o.y / oh * paneY);
          vec2 pf = fract(pq), pw2 = max(fwidth(pq), vec2(1e-4));
          float mull = max(1.0 - box(pf.x, 0.07, 0.93, pw2.x), 1.0 - box(pf.y, 0.06, 0.94, pw2.y));
          float frm = 1.0 - box(o.x, 0.06, ow - 0.06, px.x) * box(o.y, 0.06, oh - 0.06, px.y);
          vec3 frameC = hash12(bid + 23.0) < 0.5 ? vec3(0.62, 0.6, 0.55) : vec3(0.13, 0.1, 0.08);
          if (tgr > 3.5 || (tgr < 0.5 && des > 4.5 && des < 5.5)) frameC = vec3(0.1, 0.11, 0.12);
          vec3 glassC = vec3(0.04, 0.047, 0.055) + skyTint * 0.06 * (0.4 + o.y / oh);
          float curt = step(0.72, hash12(bid + vec2(bi, floorI) * 3.1)) * step(0.55, 0.3 + 0.5 * hash12(bid + vec2(floorI, bi) * 1.3));
          glassC = mix(glassC, vec3(0.5, 0.46, 0.38) * 0.55, curt * 0.75 * step(o.y / oh, 0.8));
          float mAmp = 1.0 - smoothstep(0.1, 0.32, max(pw2.x, pw2.y)), fAmp = 1.0 - smoothstep(0.04, 0.12, pxm);
          float bars = clamp(max(mull * mAmp + 0.12 * (1.0 - mAmp), frm * fAmp + 0.06 * (1.0 - fAmp)), 0.0, 1.0);
          glassC *= 1.0 - 0.35 * (1.0 - smoothstep(0.0, 0.16, yTop - fy));
          openC = mix(glassC, frameC, bars);
          isGlass = 1.0 - bars;
          lit = step(1.0 - lampRate, hash12(bid + vec2(bi, floorI) * 1.7 + 41.0)) * (1.0 - step(0.01, charN));
        }
      }
      // ---- warehouse gable ends: a round louvred vent high in the gable (推测)
      if (tgr > 2.5 && tgr < 3.5 && role > 1.5 && role < 2.5) {
        vec2 vc = vec2(u - wlen * 0.5, v - (height + 1.4));
        float rr = length(vc), vent = 1.0 - smoothstep(0.46, 0.5, rr);
        float slats = step(0.5, fract(vc.y / 0.07));
        wallC = mix(wallC, mix(vec3(0.03), vec3(0.2), slats) * 0.9, vent * (1.0 - farW * 0.3));
        wallC = mix(wallC, trimC, (1.0 - smoothstep(0.5, 0.54, rr)) * (1.0 - vent) * 0.8);
      }
      vec3 c3 = mix(wallC, openC, inOpen);
      // soot: over the wall, blacker up high and round the openings, which are empty and black (a burnt-out shell)
      if (charN > 0.0) {
        float soot = clamp(0.5 + 0.5 * v / max(height, 1.0) + 0.3 * vnoise(vec2(u * 0.7, v * 0.25) + bid), 0.0, 1.0);
        c3 = mix(c3, vec3(0.03, 0.028, 0.026), charN * max(soot, inOpen));
        c3 = mix(c3, vec3(0.0), charN * inOpen * 0.9);
        isGlass *= 1.0 - charN;
        lit *= 1.0 - step(0.01, charN);
      }
      if (inside) c3 = mix(col * 0.34, vec3(0.03, 0.028, 0.026), max(charN, 0.5));
      diffuseColor.rgb = c3;
      // the glass mirrors the sky a little; the sun in a pane; a lamp in some windows at night
      float pane = inOpen * isGlass;
      gPane = pane * (1.0 - 0.7 * farW) * (1.0 - 0.85 * uNight * lit);
      gRough = mix(gRough, 0.12, pane);
      gMetal = mix(gMetal, 0.5, pane);
      gNm = mix(gNm, vec3(0.0, 0.0, 1.0), inOpen);
      vec3 Vv = normalize(vWPos - cameraPosition);
      float sgl = max(dot(reflect(Vv, gN), uSunDir), 0.0);
      gGlint = pane * uGlintOn * uSunGlint * (pow(sgl, 1400.0) * 14.0 + pow(sgl, 90.0) * 0.35 + pow(sgl, 7.0) * 0.1) * step(0.0, dot(gN, uSunDir));
      gEmissive += pane * uGlass * (1.0 - uNight) * vec3(0.45, 0.6, 0.82) * (0.012 + 0.2 * pow(1.0 - max(dot(-Vv, gN), 0.0), 3.0));
      gEmissive += inOpen * lit * uNight * vec3(1.0, 0.64, 0.32) * 0.6 * (0.7 + 0.6 * hash12(bid + 2.2));
    } else if (kind > 22.5 && kind < 23.5) {
      // ---- a flag (推测), 3 : 2: the Republic's flag (a red field, a blue canton with a white sun of twelve rays) until the city fell on 13 December;
      // then on some of the buildings the Japanese flag (white with a red disc), on the rest none. Cloth: no light through it, a fold or two.
      float fl = max(floor(cwI / 8.0) / 4.0, 1.0), fh = fl / 1.5;
      float jpFlag = step(hash12(bid + 5.5), 0.55);
      float gone = uStoryDay > 12.45 && (uStoryDay < 13.2 || jpFlag < 0.5) ? 1.0 : 0.0;
      if (gone > 0.5 || charN > 0.2) discard;
      float fu = u / fl, fs = clamp(floorH / fh, 0.0, 1.0);
      float aaF = max(px.x / fl, 1e-3) * 1.5;
      vec3 c3;
      if (uStoryDay < 12.45) {
        vec2 cp = vec2(u - 0.25 * fl, floorH - 0.75 * fh);
        float th = atan(cp.y, cp.x) * (12.0 / 6.2832), tri = abs(fract(th) - 0.5) * 2.0;
        float sunR = 0.085 * fh + 0.13 * fh * (1.0 - tri);
        float sun = 1.0 - smoothstep(sunR - aaF * fh, sunR + aaF * fh, length(cp));
        float canton = step(fu, 0.5) * step(0.5, fs);
        c3 = mix(vec3(0.6, 0.012, 0.02), vec3(0.006, 0.03, 0.3), canton);
        c3 = mix(c3, vec3(0.8, 0.8, 0.78), sun * canton);
      } else {
        float disc = 1.0 - smoothstep(0.3 * fh - aaF * fh, 0.3 * fh + aaF * fh, length(vec2(u - 0.5 * fl, floorH - 0.5 * fh)));
        c3 = mix(vec3(0.72, 0.72, 0.7), vec3(0.55, 0.01, 0.02), disc);
      }
      c3 *= 0.88 + 0.12 * sin(u * 7.0 + 1.3 * floorH) + 0.06 * (vnoise(vec2(u, floorH) * 5.0 + bid) - 0.5);
      gRough = 0.95;
      diffuseColor.rgb = c3;
    } else if (kind > 24.5) {
      // ---- painted ironwork; role 6 is a balcony railing: top and bottom rails and square bars every 11 cm, the rest cut away (the quad has its floor storey's height as floorH, the rail starts 6 cm over it)
      if (mod(cwI, 8.0) > 5.5 && mod(cwI, 8.0) < 6.5) {
        float hh = v - floorH - 0.06, aaR = max(px.x, 1e-3);
        float bar = box(fract(u / 0.11), 0.12, 0.88, aaR / 0.11), rail = max(box(hh, -0.02, 0.07, px.y), box(hh, 0.88, 0.98, px.y));
        if (max(bar * step(0.0, hh) * step(hh, 0.98), rail) < 0.5) discard;
      }
      diffuseColor.rgb = col * (0.9 + 0.2 * vnoise(vec2(u, v) * 4.0));
      gRough = 0.55; gMetal = 0.5;
      if (charN > 0.0) diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.03), charN * 0.8);
    } else {
      // ---- roofs: machine tiles (12), flat roofs (13 timber-borne, 16 concrete), glazed tiles (14), the ridge (15), coping (17),
      // awnings (18), corrugated iron (20), glass (21)
      float rlen = floor(cwI / 64.0) / 4.0, s = floorH;
      float rowsUp = 0.0;
      vec3 c3 = col;
      bool falls = (kind > 10.5 && kind < 15.5) || (kind > 17.5 && kind < 18.5);
      if (kind > 15.5 && kind < 16.5 || kind > 12.5 && kind < 13.5) {
        // a flat roof: cement screed with expansion joints and stains, or tarred felt in strips (推测)
        vec2 q = vec2(u, s);
        float lumR = dot(col, vec3(0.3, 0.59, 0.11)), fadeJ = 1.0 - smoothstep(0.08, 0.3, pxm);
        if (lumR < 0.145) {
          float roll = fract(u / 0.92), lapl = 1.0 - box(roll, 0.015, 1.0, max(fwidth(u) / 0.92, 1e-4));
          c3 = col * (0.86 + 0.28 * vnoise(q * 0.8 + seed * 9.0)) * (1.0 - 0.3 * lapl * fadeJ);
          c3 = mix(c3, col * 1.5, step(0.85, vnoise(q * 0.45 + 11.0)) * 0.35);
          gRough = 0.78;
        } else {
          c3 = col * (0.88 + 0.24 * vnoise(q * 0.3 + seed * 7.0)) * (1.0 - 0.14 * smoothstep(0.6, 0.9, vnoise(q * 0.08 + 3.0)));
          float jl = max(1.0 - box(fract(u / 3.0), 0.01, 1.0, max(fwidth(u) / 3.0, 1e-4)), 1.0 - box(fract(s / 3.0), 0.01, 1.0, psl / 3.0));
          c3 *= 1.0 - 0.18 * jl * fadeJ;
          c3 = mix(c3, c3 * vec3(0.82, 0.9, 0.78), smoothstep(0.72, 0.95, vnoise(q * 0.9 + bid)) * 0.55);
          gRough = 0.92;
        }
        gRough = 0.9;
      } else if ((kind > 19.5 && kind < 20.5) || (kind > 11.5 && kind < 12.5 && tgr > 2.5 && des > 3.5)) {
        // corrugated iron (a shed's roof is kind 12 with a design of 4 or more, so that it falls in when it burns): ribs across the slope every 7.6 cm, sheets 69 cm wide and 1.8 m long to the lap, rust at the laps and the eaves (推测)
        float rib = u / 0.076, fadeR = 1.0 - smoothstep(0.1, 0.35, max(fwidth(u) / 0.076, 1e-4));
        float lapS = 1.0 - box(fract(s / 1.8), 0.0, 0.96, psl / 1.8), seamS = 1.0 - box(fract(u / 0.69), 0.012, 1.0, max(fwidth(u) / 0.69, 1e-4));
        // every sheet (69 cm wide, 1.8 m long to the lap) has weathered to a tone of its own; rust runs down the slope in streaks, collects at the laps and the eaves (推测)
        float sheetT = hash12(vec2(floor(u / 0.69), floor(s / 1.8)) + bid * 0.37);
        float streakN = vnoise(vec2(u * 2.6 + seed * 13.0, s * 0.11));
        float rust = smoothstep(0.62, 0.92, streakN) * 0.5 + 0.45 * (1.0 - smoothstep(0.0, 1.2, s)) * vnoise(vec2(u * 3.0, 1.0) + bid) + 0.3 * lapS * step(0.5, sheetT);
        c3 = col * (0.84 + 0.22 * sheetT) * (0.94 + 0.08 * sin(6.2832 * rib) * fadeR) * (1.0 - 0.15 * (lapS + seamS) * (1.0 - farW));
        c3 = mix(c3, vec3(0.3, 0.18, 0.12), clamp(rust, 0.0, 1.0) * 0.5);
        gNm = normalize(vec3(0.5 * cos(6.2832 * rib) * fadeR, 0.0, 1.0));
        gRough = 0.55; gMetal = 0.3 * (1.0 - clamp(rust, 0.0, 1.0));
        rowsUp = 0.0;
      } else if ((kind > 20.5 && kind < 21.5) || (kind > 13.5 && kind < 14.5 && tgr > 3.5)) {
        // glass (a factory's saw-tooth glazing is kind 14 with the factory's type group): skylights and saw-tooth glazing, bars every 60 cm
        float bars = max(1.0 - box(fract(u / 0.6), 0.03, 0.97, max(fwidth(u) / 0.6, 1e-4)), 1.0 - box(fract(s / 1.2), 0.02, 0.98, psl / 1.2));
        c3 = mix(vec3(0.05, 0.06, 0.07) + skyTint * 0.05, vec3(0.1, 0.1, 0.1), bars * (1.0 - farW));
        gRough = 0.1; gMetal = 0.5; gPane = (1.0 - bars) * (1.0 - 0.5 * farW);
        gEmissive += (1.0 - bars) * uGlass * (1.0 - uNight) * vec3(0.4, 0.55, 0.8) * 0.05;
      } else if (kind > 17.5 && kind < 18.5) {
        // an awning of canvas: stripes 18 cm wide, a valance; sagging a little
        float stp = step(0.5, fract(u / 0.18)), strp = step(0.45, hash12(bid + 2.0));
        c3 = col * (0.9 + 0.2 * vnoise(vec2(u, s) * 6.0 + bid));
        c3 = mix(c3, mix(c3, vec3(0.85, 0.83, 0.76), 0.85), stp * strp);
        gNm = normalize(vec3(0.0, 0.1 * sin(u * 9.0), 1.0));
        gRough = 0.95;
      } else if (kind > 14.5 && kind < 15.5) {
        // a ridge or hip roll: tiles set on edge, a pale line of mortar on top
        float r = u / 0.07, rw = max(fwidth(r), 1e-4);
        c3 = col * mix(1.0, 0.8 + 0.35 * step(0.5, fract(r)), 1.0 - smoothstep(0.12, 0.3, rw));
        c3 = mix(c3, col * 1.4, smoothstep(0.8, 1.0, s) * 0.5);
        gRough = 0.85;
      } else if (kind > 16.5 && kind < 17.5) {
        // coping: cast cement or stone, a little pale, grained
        c3 = col * (0.94 + 0.12 * vnoise(vec2(u, s) * 9.0 + bid));
        gRough = 0.9;
      } else {
        // machine tiles (12): flat interlocking tiles 26 cm wide, 17 cm showing, laid in courses broken at the half; glazed tiles (14): wider, glossy
        bool glz = kind > 13.5 && kind < 14.5;
        float tw = glz ? 0.22 : 0.26, th = glz ? 0.3 : 0.17;   // glazed: half-round cover tiles every 22 cm down the slope, 30 cm to a course (推测)
        float cs = s / th, ci = floor(cs), cf = fract(cs);
        float us = u / tw + (glz ? 0.0 : 0.5 * mod(ci, 2.0)), ti = floor(us), tf = fract(us);
        float wfx = max(fwidth(u) / tw, 1e-4), wfy = psl / th;
        float fineT = 1.0 - smoothstep(0.15, 0.4, max(wfx, wfy));
        float lapE = 1.0 - box(cf, 0.0, 0.8, wfy), seamV = 1.0 - box(tf, 0.035, 1.0, wfx);
        float tsh = 0.88 + 0.2 * hash12(vec2(ti, ci) + bid);
        c3 = col * mix(1.0, tsh * (1.0 - 0.2 * lapE) * (1.0 - 0.1 * seamV), fineT);
        if (glz) c3 = col * mix(1.0, (0.7 + 0.44 * sin(3.14159 * tf)) * (0.92 + 0.16 * hash12(vec2(ti, ci) + bid)) * (1.0 - 0.28 * (1.0 - box(cf, 0.07, 1.0, wfy))), fineT);
        float eaveB = 1.0 - smoothstep(0.0, 0.32, s), gableB = 1.0 - smoothstep(0.15, 0.45, min(u, rlen - u));
        c3 *= 1.0 - 0.25 * eaveB - 0.2 * gableB;
        c3 *= 0.86 + 0.28 * vnoise(vec2(u, s) * 0.32 + seed * 31.0);
        float newer = step(0.985, hash12(vec2(ti, ci) + bid * 1.9)) * fineT;
        c3 = mix(c3, col * 1.3, newer * 0.5);
        gNm = normalize(vec3(glz ? 0.5 * cos(3.14159 * tf) * fineT : 0.0, -0.3 * lapE * fineT, 1.0));
        gRough = glz ? 0.42 : 0.82;
        if (glz) gMetal = 0.05;
        rowsUp = 0.3 * fineT;
      }
      if (charN > 0.0 && falls) {
        // what is left of a roof that fell in: a heap of broken tiles, ash and charred timber
        float k2 = vnoise(vec2(u, s) * 1.9 + bid) * 0.7 + 0.3 * vnoise(vec2(u, s) * 6.0);
        // (integrator 11-10: the heap was near-black with grey speckle, which the sky's blue turned into camouflage from 60-80 m. Burnt rubble is
        // charcoal and grey ash with broken red tile in it: warm, and lighter, so that it reads as a heap and not a hole)
        vec3 rubble = mix(vec3(0.055, 0.047, 0.04), vec3(0.2, 0.186, 0.166), smoothstep(0.3, 0.75, k2));
        rubble = mix(rubble, vec3(0.24, 0.125, 0.09), 0.28 * smoothstep(0.6, 0.85, vnoise(vec2(u, s) * 3.7 + bid * 1.3)));
        c3 = mix(c3, rubble, smoothstep(0.2, 0.8, charN));
        gNm = normalize(mix(gNm, vec3((k2 - 0.5) * 0.8, 0.3 - k2 * 0.6, 1.0), charN));
        gRough = mix(gRough, 0.95, charN);
      } else if (charN > 0.0) {
        c3 = mix(c3, vec3(0.035), charN * 0.85);
      }
      if (uSnow > 0.001 && gN.y > 0.5) {
        // snow on the roofs as on the ground: where it is not too steep, in patches while it comes and goes; melted by a fire, back on the ruins once cold
        float sn = 0.6 * vnoise(vWPos.xz * 0.08 + 7.0) + 0.4 * vnoise(vWPos.xz * 0.7 + 3.0);
        float snowC = smoothstep(0.0, 0.25, uSnow * 1.3 - (1.0 - sn) * 0.6) * smoothstep(0.55, 0.8, gN.y);
        snowC *= 1.0 - 0.55 * rowsUp * (1.0 - smoothstep(0.55, 1.0, uSnow));
        snowC *= mix(1.0, smoothstep(0.6, 1.5, burnAge), step(0.001, charN));
        c3 = mix(c3, vec3(0.74, 0.76, 0.8), snowC);
        gNm = normalize(mix(gNm, vec3(0.0, 0.0, 1.0), snowC));
        gRough = mix(gRough, 0.85, snowC);
      }
      if (inside) c3 *= 0.4;
      diffuseColor.rgb = c3;
    }
`;export{e as NJ_MASONRY_GLSL};