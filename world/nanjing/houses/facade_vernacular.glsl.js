var e=`
    float njId = floor(seed * 4096.0 + 0.5);
    vec2 bid = vec2(mod(njId, 61.0) * 17.0 + 3.0, mod(njId, 53.0) * 13.0 + 7.0);
    vec3 col = diffuseColor.rgb;
    float charN = min(vBurn, 1.0), burnAge = max(vBurn - 1.0, 0.0);
    bool inside = !gl_FrontFacing;
    gRough = 0.88; gMetal = 0.0; gEmissive = vec3(0.0); gNm = vec3(0.0, 0.0, 1.0);
    // (the only derivatives: every pattern below scales these, so the shader has three of them, not thirty: the D3D compiler
    // chokes on gradients inside branches)
    vec2 px = max(vec2(fwidth(u), fwidth(v)), vec2(1e-4));
    float dS = max(fwidth(floorH), 1e-4);
    float dUdx = dFdx(u), dSdx = dFdx(floorH);   // (integrator 11-10) which way u and s run on the screen: the characters of a sign are turned back where they would be mirrored
    if (kind < 11.5) {
      // ---- walls (10), timber shop fronts (11) and what stands out of them (kind 11, role 3-7)
      // (cellW is a whole number carried as a float and interpolated: 319.9999 would read as role 7, length 39; round it first)
      float cwI = floor(cellW + 0.5);
      float role = mod(cwI, 8.0), wlen = floor(cwI / 8.0) / 4.0;
      float pxm = max(px.x, px.y);
      float farW = smoothstep(0.12, 0.35, pxm);
      vec3 c3 = col;
      float inOpen = 0.0, lit = 0.0;
      bool part = kind > 10.5 && role > 2.5;
      if (part) {
        // u runs along the long side of the board, floorH (s) across it
        float sA = floorH, wd = dS;
        if (role < 4.5) {
          // plain timber (4: edges, posts, slabs) or a railing (3): balusters between a top and a base rail
          vec3 wood = col * (0.85 + 0.3 * hash12(floor(vec2(u * 1.5, sA * 9.0)) + bid));
          if (role < 3.5) {
            float bp = u / 0.12, bwid = px.x / 0.12;
            float bar = mix(box(fract(bp), 0.3, 0.7, bwid), 0.55, smoothstep(0.25, 0.7, bwid));
            float rail = max(step(0.84, sA), 1.0 - step(0.12, sA));
            wood = mix(col * 0.16, col * 1.15, clamp(max(bar, rail), 0.0, 1.0));
          }
          c3 = wood; gRough = 0.8;
        } else if (role < 6.5) {
          // a signboard (5, 62 cm high) or a hanging sign (6, 36 cm wide): a rim, and a band of characters drawn as blocks
          float bW = role < 5.5 ? 0.62 : 0.36;
          float lum = dot(col, vec3(0.3, 0.59, 0.11));
          vec3 ink = lum < 0.1 ? vec3(0.5, 0.38, 0.12) : (lum < 0.3 ? vec3(0.6, 0.52, 0.34) : vec3(0.05, 0.04, 0.03)); // (re-run 3: the pale characters on a gold board 0.74 -> 0.6: in the low sun they bloomed)
          float rim = 1.0 - box(sA, 0.035, bW - 0.035, wd) * box(u, 0.035, wlen - 0.035, px.x);
          // (integrator 11-10) real characters: the shop's name in traditional script from the atlas uSign (houses/signs.js; the names are invented,
          // 推测). A signboard is read right to left, a hanging sign from its top (u runs down it); two to five characters, by how many fit.
          bool hang = role > 5.5;
          float cellG = hang ? 0.3 : 0.5;
          float nmH = hash12(bid * 1.31 + vec2(floor(wlen * 4.0), hang ? 9.0 : 2.0));
          float nc = clamp(floor((wlen - (hang ? 0.3 : 0.4)) / cellG), 2.0, 5.0);
          float gIdx, gCu, gCv;
          float uC = (!hang && dUdx < 0.0) ? wlen - u : u, sC = (hang && dSdx < 0.0) ? bW - sA : sA;
          float cA = (uC - 0.5 * (wlen - nc * cellG)) / cellG, cB = (sC - 0.5 * (bW - cellG)) / cellG;
          if (hang) { gIdx = floor(cA); gCu = cB; gCv = 1.0 - fract(cA); }
          else { gIdx = nc - 1.0 - floor(cA); gCu = fract(cA); gCv = cB; }
          float gOn = step(0.0, cA) * step(cA, nc) * step(0.0, cB) * step(cB, 1.0);
          float gRow = (nc - 2.0) * 10.0 + floor(nmH * 10.0);
          float pxG = max(px.x, dS);
          float lodG = clamp(log2(max(pxG / cellG * 96.0, 1.0)), 0.0, 4.0);
          float gcov = textureLod(uSign, vec2((clamp(gIdx, 0.0, 5.0) + mix(0.05, 0.95, clamp(gCu, 0.0, 1.0))) / 6.0, (gRow + 1.0 - mix(0.05, 0.95, clamp(gCv, 0.0, 1.0))) / 40.0), lodG).r * gOn;
          float fineG = 1.0 - smoothstep(0.06, 0.16, pxG);
          c3 = mix(col, ink, mix(0.3 * gOn, gcov, fineG));
          c3 = mix(c3, ink * 0.85, rim * 0.85 * (1.0 - farW));
          c3 *= 0.95 + 0.1 * hash12(floor(vec2(u * 3.0, sA * 5.0)) + bid);
          gRough = 0.55;
        } else {
          // a cloth awning, striped, its valance (s >= 10) plain
          float stp = u / 0.42, sw = px.x / 0.42;
          float stripe = mix(box(fract(stp), 0.0, 0.5, sw), 0.5, smoothstep(0.25, 0.6, sw));
          // (vernacular re-run 3, 11-10: stripes of the cloth's own colour against a pale or a dark one, so that the awnings read as striped from
          // the street: a pale cloth gets dark red or navy stripes, a dark one pale ones; 推测, canvas awnings of the photographs of 太平路)
          float aL = dot(col, vec3(0.3, 0.59, 0.11));
          // (colour wave 11-10, the lead: awnings no longer orange, red or yellow: the dark stripe of a pale cloth is a dull dark red (0.34, 0.07, 0.05 -> 0.15, 0.05, 0.045) or a faded navy
          // (0.05, 0.08, 0.17 -> 0.05, 0.07, 0.12), the pale stripe of a dark cloth a little greyer (0.62, 0.58, 0.5 -> 0.56, 0.55, 0.52); the warm sun turns every red albedo orange)
          vec3 altC = aL > 0.3 ? (hash12(bid + 3.0) < 0.5 ? vec3(0.15, 0.05, 0.045) : vec3(0.05, 0.07, 0.12)) : vec3(0.56, 0.55, 0.52);
          vec3 cloth = mix(altC, col, stripe);
          if (sA > 5.0) cloth = col * 0.85;
          c3 = cloth * (0.92 + 0.16 * hash12(floor(vec2(u * 3.0, sA * 2.0)) + bid));
          gRough = 0.95;
        }
      } else {
        float fh = max(floorH, 2.4);
        float storeysN = max(1.0, floor(height / fh + 0.5));
        float floorI = min(floor(max(v, 0.0) / fh), storeysN - 1.0), fy = v - floorI * fh;
        if (kind < 10.5) {
          vec2 st = vec2(u, v);
          bool brickW = layer > 2.5, earthW = layer < 0.5;
          // weathering shared by all: patchy tone, rain streaks from the eaves, damp and moss at the foot
          float wn = vnoise(st * vec2(1.1, 0.8) + seed * 37.0), wn2 = vnoise(st * 4.3 + 3.0);
          // grey brick (青砖): courses 6.5 cm high, bricks 25 cm long, running bond, a thin pale lime joint (推测)
          float cy = v / 0.065, ry = floor(cy), fyb = fract(cy);
          float cx = u / 0.25 + 0.5 * mod(ry, 2.0), rx = floor(cx), fxb = fract(cx);
          float wy = px.y / 0.065, wx = px.x / 0.25;
          float brFine = 1.0 - smoothstep(0.2, 0.5, max(wx, wy));
          float bt = hash12(vec2(rx, ry) + bid);
          float joint = max(1.0 - box(fyb, 0.1, 0.92, wy), 1.0 - box(fxb, 0.03, 0.97, wx));
          vec3 brickBase = brickW ? col : vec3(0.1, 0.105, 0.11);
          vec3 brk = brickBase * (0.76 + 0.46 * bt) * (0.92 + 0.16 * wn2);
          brk = mix(brk, vec3(0.3, 0.29, 0.26), joint * 0.8);
          vec3 brickOut = mix(brickBase * 1.05, brk, brFine);
          float damp = 1.0 - smoothstep(0.15, 0.9 + 0.9 * wn, v);
          float streak = vnoise(vec2(u * 2.6, v * 0.16 + seed * 40.0));
          float topF = smoothstep(0.35, 1.0, v / max(height, 1.0));
          float runoff = smoothstep(0.45, 0.85, streak) * (0.3 + 0.7 * topF);
          vec3 wallC;
          if (brickW) {
            wallC = brickOut * (0.88 + 0.24 * wn);
            wallC = mix(wallC, wallC * vec3(0.62, 0.62, 0.6), runoff * 0.5);
            wallC = mix(wallC, wallC * vec3(0.7, 0.8, 0.62), damp * 0.5);
          } else if (earthW) {
            // rammed earth (版筑): layers of ~55 cm, straw flecks, cracks (推测)
            vec3 earthC = col * (0.86 + 0.28 * wn) * (0.94 + 0.12 * wn2);
            // (re-run 3: the layer lines read as planks of wood: fewer, softer, broken by noise; and a little less saturated)
            float lay = 1.0 - box(fract(v / 0.55 + seed * 3.0 + 0.12 * wn2), 0.03, 0.97, px.y / 0.55);
            earthC *= 1.0 - 0.08 * lay * (1.0 - farW) * (0.4 + 0.6 * smoothstep(0.35, 0.65, wn));
            earthC = mix(vec3(dot(earthC, vec3(0.3, 0.59, 0.11))), earthC, 0.82);
            earthC *= 1.0 - 0.1 * hash12(floor(vec2(u * 12.0, v * 45.0)) + bid) * (1.0 - farW);
            earthC = mix(earthC, earthC * vec3(0.6, 0.64, 0.55), damp * 0.6);
            wallC = mix(earthC, earthC * vec3(0.7, 0.7, 0.68), runoff * 0.5);
          } else {
            // lime wash (白灰墙): grey rain streaks, damp and moss at the foot, patches fallen away showing the brick beneath
            vec3 lime = col * (0.9 + 0.16 * wn + 0.05 * wn2);
            lime = mix(lime, lime * vec3(0.6, 0.6, 0.58), runoff * 0.6);
            lime = mix(lime, lime * vec3(0.55, 0.62, 0.5), damp * 0.7);
            float pn = 0.75 * wn + 0.5 * wn2 - 0.12;
            float bare = smoothstep(0.84, 0.92, pn + 0.14 * (1.0 - smoothstep(0.0, 1.4, v)));
            wallC = mix(lime, brickOut * 1.6 + vec3(0.04, 0.032, 0.026), bare * 0.7);
          }
          // the plinth (勒脚): stone slabs 1.1 m long, 30 cm courses, up to ~60 cm
          float pH = brickW ? 0.5 : 0.62;
          float onPl = 1.0 - smoothstep(pH - 0.03, pH + 0.03, v + 0.06 * (wn2 - 0.5));
          float sy = v / 0.3, sr = floor(sy), sx = u / 1.1 + 0.37 * sr;
          float sj = max(1.0 - box(fract(sy), 0.04, 1.0, px.y / 0.3), 1.0 - box(fract(sx), 0.01, 0.99, px.x / 1.1));
          vec3 stoneC = vec3(0.14, 0.14, 0.135) * (0.8 + 0.4 * hash12(vec2(floor(sx), sr) + bid));
          stoneC = mix(stoneC, stoneC * 0.5, sj * (1.0 - farW));
          stoneC = mix(stoneC, stoneC * vec3(0.55, 0.62, 0.5), damp * 0.5);
          wallC = mix(wallC, stoneC, onPl);
          // under the eaves of the front and back walls: the shadow of the overhang, soot
          wallC *= 1.0 - 0.18 * smoothstep(height - 0.55, height - 0.05, v) * (step(role, 1.5) + step(5.5, role) * step(role, 6.5));
          // ---- openings: an odd number of bays (~3.6 m, 推测), the door in the middle one and lattice windows in the others;
          // a few small high windows in the back wall; none in the gables. The door's bay: chinese.js uses the same formula.
          // (re-run 3) role 6 = the front of a hut (草棚): the door at a third of the front and one small window beside it
          bool hutF = role > 5.5 && role < 6.5;
          bool isFront = role < 0.5 || (role > 4.5 && role < 5.5) || hutF, isGate = role > 4.5 && role < 5.5;
          float hw = 0.0, y0 = 0.0, y1 = 0.0, door = 0.0, isVent = 0.0;
          float nb = max(1.0, 2.0 * floor((wlen / 3.6 - 1.0) * 0.5 + 0.5) + 1.0);
          float bw = wlen / nb, bi = clamp(floor(u / bw), 0.0, nb - 1.0);
          float bx = u - (bi + 0.5) * bw, midB = floor(nb * 0.5);
          float doorTop = clamp(height - 0.95, 1.7, isGate ? 2.8 : 2.3);
          if (isFront) {
            if (floorI < 0.5) {
              if (hutF) {
                float dcx = wlen * 0.36, wcx = wlen * 0.74;
                if (u < 0.5 * (dcx + wcx)) { bx = u - dcx; hw = 0.5; y0 = 0.0; y1 = min(doorTop, 1.85); door = 1.0; }
                else { bx = u - wcx; hw = 0.22; y0 = 1.05; y1 = 1.55; }
              } else if (abs(bi - midB) < 0.5) { hw = isGate ? (height < 3.05 ? 0.68 : 0.85) : 0.62; y0 = 0.0; y1 = doorTop; door = 1.0; } // (re-run 3: a gate in a low house's wall is not a garage door)
              else { hw = min(0.66, bw * 0.19); y0 = 0.95; y1 = min(fh - 0.55, 2.35); }
            } else { hw = min(0.58, bw * 0.17); y0 = 0.8; y1 = min(fh - 0.5, 2.1); }
          } else if (role > 0.5 && role < 1.5) {
            if (mod(bi, 2.0) > 0.5 || nb < 1.5) { hw = 0.27; y0 = floorI < 0.5 ? 1.9 : 1.2; y1 = y0 + 0.5; }
          } else if (role > 1.5 && role < 2.5 && wlen > 5.0) {
            // (re-run 3, 11-10) a small square vent (气窗) high in the middle of some gables, so that the big white faces are not blank (推测)
            if (hash12(bid + 23.0) < 0.35) { bx = u - wlen * 0.5; hw = 0.17; y0 = height + 0.45 - floorI * fh; y1 = y0 + 0.34; isVent = 1.0; }
          }
          float valid = step(0.01, hw) * max(step(v, height - 0.2), isVent);
          inOpen = valid * box(bx, -hw, hw, px.x) * box(fy, y0, y1, px.y);
          // the surround: a stone frame round a door, a painted border (lime wall) or a pale stone one (brick wall) round a window
          float bwid = door > 0.5 ? (isGate ? 0.22 : 0.17) : 0.09;
          float inSur = valid * box(bx, -hw - bwid, hw + bwid, px.x) * box(fy, door > 0.5 ? -1.0 : y0 - bwid, y1 + bwid, px.y) * (1.0 - inOpen);
          vec3 surC = door > 0.5 ? vec3(0.24, 0.24, 0.23) : (brickW ? vec3(0.2, 0.195, 0.185) : vec3(0.09, 0.09, 0.09));
          wallC = mix(wallC, surC, inSur * (1.0 - 0.4 * farW));
          vec2 o = vec2(bx + hw, fy - y0);
          vec3 openC = vec3(0.0);
          if (door > 0.5) {
            // a plank door of two leaves (planks 20 cm), the gap between them, its threshold; a few stand ajar on a dark room
            float planks = fract(o.x / 0.2), pw = px.x / 0.2;
            float seam = 1.0 - box(planks, 0.05, 0.95, pw);
            vec3 dw = isGate ? vec3(0.045, 0.028, 0.022) : mix(vec3(0.07, 0.045, 0.03), vec3(0.115, 0.078, 0.05), hash12(bid + 11.0));
            openC = dw * (1.0 - 0.45 * seam * (1.0 - farW));
            openC *= 1.0 - 0.8 * box(abs(o.x - hw), -0.01, 0.012, px.x) * (1.0 - farW);
            float ajar = step(0.86, hash12(bid + 19.0)) * step(hw, o.x);
            openC = mix(openC, vec3(0.012, 0.011, 0.01), ajar);
            openC = mix(openC, vec3(0.2), 1.0 - smoothstep(0.05, 0.09, o.y));
          } else {
            // a lattice window (花窗): dark wood bars on paper gone grey, or an open lattice on a dark room (推测)
            float oid = hash12(bid + vec2(floor((u - bx) * 3.0), floorI * 7.0));
            float g = 0.14;
            vec2 lq = fract(o / g), lw = max(px / g, vec2(1e-4));
            float bars = max(1.0 - box(lq.x, 0.16, 0.84, lw.x), 1.0 - box(lq.y, 0.16, 0.84, lw.y));
            vec3 behind = oid < 0.4 ? vec3(0.16, 0.145, 0.12) : vec3(0.025, 0.023, 0.02);
            vec3 wood = vec3(0.045, 0.032, 0.022);
            // (w3, 11-10: the bars faded only at 0.3-0.8 of a cell and aliased into scribbles from 100-200 m; now they go to
            // their average before they are thinner than a pixel)
            openC = mix(mix(behind, wood, bars), mix(behind, wood, 0.55), smoothstep(0.08, 0.3, max(lw.x, lw.y)));
            float frameW = 1.0 - box(o.x, 0.08, 2.0 * hw - 0.08, px.x) * box(o.y, 0.08, y1 - y0 - 0.08, px.y);
            openC = mix(openC, wood, frameW * (1.0 - smoothstep(0.025, 0.07, pxm)));
          }
          // a lamp in a few windows at night: some before the city fell (13 Dec), hardly any after (推测); none once burnt
          float rate = uStoryDay < 12.5 ? 0.07 : 0.012;
          lit = step(1.0 - rate, hash12(bid + vec2(floor(u - bx), floorI) * 1.7 + 41.0)) * (1.0 - door) * (1.0 - isVent) * (1.0 - step(0.01, charN));
          c3 = mix(wallC, openC, inOpen);
        } else {
          // ---- the timber front of a shop: shutter boards (排门板) between posts below, a beam, lattice windows above (推测)
          float bd = u / 0.3, bdi = floor(bd), bw1 = px.x / 0.3;
          float farB = smoothstep(0.25, 0.7, bw1);
          float gap = (1.0 - box(fract(bd), 0.05, 0.95, bw1)) * (1.0 - farB);
          vec3 boards = col * (0.8 + 0.4 * hash12(vec2(bdi, njId)));
          boards = mix(boards, col * 0.4, gap);
          vec3 wallC;
          float openShop = step(0.72, hash12(bid + 5.3)); // boards gone (looted, Dec 1937): open on a dark room (推测)
          float nbS = max(1.0, floor(wlen / 3.6 + 0.5)), bwS = wlen / nbS;
          float post = 1.0 - smoothstep(0.08, 0.1 + px.x, abs(u - bwS * floor(u / bwS + 0.5)));
          if (floorI < 0.5) {
            float sill = 1.0 - smoothstep(0.34, 0.38, fy);
            float beam = step(fh - 0.45, fy);
            wallC = boards;
            wallC = mix(wallC, mix(vec3(0.008, 0.007, 0.006) + vec3(0.03, 0.022, 0.016) * smoothstep(2.2, 0.0, fy), vec3(0.06, 0.047, 0.034), farB), openShop * (1.0 - sill) * (1.0 - beam) * (1.0 - post) * box(u, 0.5, wlen - 0.5, px.x)); // (re-run 3: a looted bay read as a flat grey board; now a dark room, lighter at the floor)
            wallC = mix(wallC, col * 0.55, sill);
            wallC = mix(wallC, col * 0.5, beam);
            wallC = mix(wallC, col * 0.62, post * (1.0 - beam));
          } else {
            float panel = 1.0 - smoothstep(0.85, 0.9, fy);
            float g = 0.14;
            vec2 lq = fract(vec2(u, fy) / g), lw = max(px / g, vec2(1e-4));
            float bars = max(1.0 - box(lq.x, 0.14, 0.86, lw.x), 1.0 - box(lq.y, 0.14, 0.86, lw.y));
            vec3 paper = vec3(0.22, 0.2, 0.16);
            vec3 lattice = mix(mix(paper, col * 0.7, bars), mix(paper, col * 0.7, 0.5), smoothstep(0.08, 0.3, max(lw.x, lw.y)));
            wallC = mix(lattice, boards, max(panel, post * (1.0 - farB)));
            wallC = mix(wallC, col * 0.5, step(fh - 0.3, fy));
            inOpen = (1.0 - panel) * (1.0 - post);
            lit = step(1.0 - (uStoryDay < 12.5 ? 0.08 : 0.012), hash12(bid + 77.0)) * (1.0 - step(0.01, charN));
          }
          gRough = 0.8;
          c3 = wallC;
        }
      }
      // burnt: soot over the wall, blacker up high and round the openings, which are empty and black; what stands out of a
      // shop front is gone (it falls with the front: see NJ_BURN_VERT) and what is left is soot
      if (charN > 0.0) {
        float soot = clamp(0.45 + 0.55 * v / max(height, 1.0) + 0.3 * vnoise(vec2(u * 0.7, v * 0.25) + bid), 0.0, 1.0);
        c3 = mix(c3, vec3(0.032, 0.03, 0.028), charN * max(soot, inOpen));
      }
      if (inside && !part) c3 = mix(col * 0.32, vec3(0.03, 0.028, 0.026), max(charN, 0.5));
      diffuseColor.rgb = c3;
      gEmissive = inOpen * lit * uNight * vec3(1.0, 0.62, 0.3) * 0.5;
    } else {
      // ---- roofs: tiles (12), thatch (13), glazed tiles (14), the ridge (15), flat (16), wall copings (17), the waist eave (18)
      float rlen = floor(floor(cellW + 0.5) / 64.0) / 4.0, s = floorH;
      float rowsUp = 0.0; // (the cover tiles' crests, where a thin snow leaves them dark)
      vec3 c3 = col;
      bool falls = (kind > 11.5 && kind < 15.5) || kind > 17.5; // these are timber-borne: they fall in when burnt
      if (kind > 15.5 && kind < 16.5) {
        // a flat roof: cement, stained
        vec2 q = vec2(u, s);
        c3 = col * (0.88 + 0.24 * vnoise(q * 0.3 + seed * 7.0)) * (1.0 - 0.12 * smoothstep(0.6, 0.9, vnoise(q * 0.08 + 3.0)));
        gRough = 0.93;
      } else if (kind > 12.5 && kind < 13.5) {
        // thatch: straw laid down the slope, darker and thinner at the eaves (推测)
        vec2 q = vec2(u * 3.2, s * 0.32);
        float fib = 0.6 * vnoise(q + seed * 9.0) + 0.4 * vnoise(q * 3.1 + 5.0);
        c3 = col * (0.78 + 0.44 * fib) * (1.0 - 0.22 * (1.0 - smoothstep(0.0, 0.7, s)));
        // (re-run 3, 11-10: it read as a clean orange board in the sun. Old straw in winter is grey-brown: a little less saturated, tied
        // courses every ~45 cm, dark patches where it has rotted or grown moss, a paler band where the rain has washed it; 推测)
        float tlum = dot(c3, vec3(0.3, 0.59, 0.11));
        c3 = mix(vec3(tlum), c3, 0.66);   // (integrator 11-10: 0.8 -> 0.66, with the albedo of chinese.js THATCH a little greyer)
        c3 *= 1.0 - 0.1 * smoothstep(0.86, 1.0, fract(s / 0.45 + seed * 5.0));
        float wpT = vnoise(vec2(u, s) * 0.55 + seed * 17.0);
        c3 = mix(c3, c3 * vec3(0.6, 0.62, 0.55), smoothstep(0.55, 0.85, wpT) * 0.75);
        c3 = mix(c3, c3 * 1.18, smoothstep(0.7, 0.9, vnoise(vec2(u * 0.4, s * 0.15) + seed * 9.0)) * 0.5);
        // straw fibres, long down the slope (from near: a roof of straw and not a board; gone from ~40 m, where a pixel is wider than the fibres)
        float tfn = vnoise(vec2(u * 28.0, s * 3.0) + seed * 5.0), farT = smoothstep(0.015, 0.06, px.x);
        c3 *= 1.0 + (tfn - 0.5) * 0.4 * (1.0 - farT);
        gNm = normalize(vec3((fib - 0.5) * 0.5 + (tfn - 0.5) * 0.7 * (1.0 - farT), 0.0, 1.0));
        gRough = 0.96;
      } else if (kind > 14.5 && kind < 15.5) {
        // the ridge: tiles set on edge (seen close up), a pale line of mortar along its top
        float r = u / 0.07, rw = px.x / 0.07;
        c3 = col * mix(1.0, 0.8 + 0.35 * step(0.5, fract(r)), 1.0 - smoothstep(0.12, 0.3, rw));
        c3 = mix(c3, col * 1.5, smoothstep(0.8, 1.0, s) * 0.5);
        gRough = 0.85;
      } else {
        // small grey tiles (小青瓦): rows (瓦垄) every ~22 cm down the slope (推测), cover tiles raised between
        // channel tiles; the drip row along the eave and the edge rows at the gables darker; moss, soot, the odd new
        // tile. Glazed tiles: wider rows with a gloss.
        bool glz = kind > 13.5 && kind < 14.5;
        // (rows laid by hand: not ruled straight, each a shade of its own; tiles overlapping in courses of ~12 cm,
        // staggered row to row, each tile a shade of its own: from close by a roof of tiles, not a corrugated sheet)
        float r = u / (glz ? 0.3 : 0.22) + 0.18 * (vnoise(vec2(u * 0.35, s * 0.5) + seed * 13.0) - 0.5);
        // (wave 2 re-run, 11-10: the rows now fade out by the time a row is a quarter of a pixel; faded from 0.3-0.8 they
        // aliased into coarse bands from 100-200 m and the roofs read as corrugated iron)
        float rw = px.x / (glz ? 0.3 : 0.22), fine = 1.0 - smoothstep(0.12, 0.3, rw);
        float ri = floor(r), ph = fract(r);
        float cover = smoothstep(0.18, 0.38, ph) * (1.0 - smoothstep(0.62, 0.82, ph));   // the cover tiles (覆瓦)
        float cs = s / 0.12 + 0.5 * mod(ri, 2.0), cw = dS / 0.12, fineC = 1.0 - smoothstep(0.12, 0.3, cw);
        float tileR = hash12(vec2(ri, floor(cs)) + bid);
        float lap = 1.0 - box(fract(cs), 0.0, 0.8, cw);                                   // the lower edge of each tile
        c3 = col * mix(1.0, (0.84 + 0.2 * cover) * (0.93 + 0.14 * hash12(vec2(ri, njId))), fine); // (re-run 3: rows softened from 0.8 + 0.26: from 30-60 m they read as corrugated iron)
        c3 *= mix(1.0, (0.92 + 0.16 * tileR) * (1.0 - 0.16 * lap * cover), fine * fineC);
        if (kind < 16.5 || kind > 17.5) {
          // the drip tiles along the eave and the edge rows over the gable walls (硬山 copings), darker
          float eaveB = 1.0 - smoothstep(0.0, 0.32, s);
          float gableB = 1.0 - smoothstep(0.15, 0.45, min(u, rlen - u));
          c3 *= 1.0 - 0.3 * eaveB - 0.3 * gableB;
        }
        float patchN = vnoise(vec2(u, s) * 0.32 + seed * 31.0);
        c3 *= 0.86 + 0.28 * patchN;
        float newer = step(0.988, tileR) * fine;
        c3 = mix(c3, col * 1.35, newer * 0.5);
        float nAmp = (kind > 16.5 && kind < 17.5) ? 0.5 : 1.0; // (the coping's tiles lie across a narrow top: half the relief)
        gNm = normalize(vec3(-0.25 * nAmp * sin(6.2832 * ph) * fine, 0.2 * nAmp * lap * cover * fine * fineC, 1.0));
        gRough = glz ? 0.32 : 0.86;
        if (glz) gMetal = 0.05;
        rowsUp = cover * fine;
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
        c3 = mix(c3, vec3(0.035), charN * 0.85); // copings and concrete roofs stand, sooted
      }
      if (uSnow > 0.001 && gN.y > 0.5) {
        // snow on the roofs as on the ground (the ground area's uSnow): on what is not too steep, in patches while it
        // comes and goes; a thin cover lies in the channels between the tile rows first and leaves their crests dark;
        // a burning roof melts it; the ruins take it again once they are cold (a day or so after, 推测)
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
`;export{e as NJ_VERNACULAR_GLSL};