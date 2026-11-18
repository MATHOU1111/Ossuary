"use strict";
// « Le Château » : l'entrée du château du seigneur des cendres, à droite de la Clairière.
// Même ciel de nuit que la Clairière, mais ici tout est gothique : donjon, tours à toits pointus, gargouilles, chauves-souris.
// La grande porte (touche E) mène à la salle du trône ; une chaîne permet de grimper au balcon des gargouilles.

{ const GATE = { x1: 236, x2: 272 }, EXc = 246, EYc = 50;
  const r = ROOMS.chateau = { id: 'chateau', name: 'LE CHATEAU', left: 'remparts', fires: [], grass: [], climbs: [], fogFar: null, fogNear: [178, 4, .14] };
  const B4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  const cone = (c, cx, baseY, halfW, apexY, col, hi) => { for (let y = apexY; y <= baseY; y++) { const hw = Math.round((y - apexY) / (baseY - apexY) * halfW); c.fillStyle = col; c.fillRect(cx - hw, y, hw * 2 + 1, 1); c.fillStyle = hi; c.fillRect(cx - hw, y, 1, 1); } };
  const brick = (c, x1, x2, top, bot, base, line, hi) => { c.fillStyle = base; c.fillRect(x1, top, x2 - x1, bot - top); c.fillStyle = hi; c.fillRect(x1, top, 2, bot - top);
    for (let y = top + 6, row = 0; y < bot; y += 7, row++) { c.fillStyle = line; c.fillRect(x1, y, x2 - x1, 1); for (let x = x1 + (row % 2) * 6; x < x2; x += 12) c.fillRect(x, y, 1, 7); } };
  const slit = (c, x, y, col = '#e8a040') => { c.fillStyle = '#05020a'; archRows(x - 3, x + 3, y + 3, y + 15, 3, (yy, a, b) => c.fillRect(a, yy, b - a, 1)); c.fillStyle = col; archRows(x - 2, x + 2, y + 4, y + 14, 2, (yy, a, b) => c.fillRect(a, yy, b - a, 1)); c.fillStyle = '#05020a'; c.fillRect(x, y + 4, 1, 10); c.fillRect(x - 2, y + 9, 5, 1); };

  /* ---------- ciel de nuit, lune (en partie cachée derrière le donjon) : même pinceau que la Clairière ---------- */
  { const [sk, s] = mk(W, H); r.sky = sk; s.drawImage(NOC_PAINT.paintSky(W, H, 0, EXc, EYc, 150), 0, 0); r.stars = makeStars(EXc, EYc); }

  /* ---------- lointain : montagnes et le donjon, noir sur le ciel ---------- */
  { const [fa, f] = mk(W, H); r.far = fa;
    const ridge = (base, a1, a2, st1, st2, col, rim, rimP) => { const n1 = makeNoise(st1, a1), n2 = makeNoise(st2, a2);
      for (let x = 0; x < W; x++) { const t = Math.round(base - n1(x) - n2(x)); f.fillStyle = col; f.fillRect(x, t, 1, H - t); if (R() < rimP) { f.fillStyle = rim; f.fillRect(x, t, 1, 1); } } };
    ridge(140, 38, 7, 46, 9, '#14243a', '#2e4a66', .5); ridge(150, 26, 5, 34, 7, '#0c1622', '#1e3448', .4);
    // le donjon : corps, flèche centrale devant la lune, tourelles
    f.fillStyle = '#080306'; f.fillRect(224, 58, 46, 100); cone(f, 247, 58, 11, 4, '#080306', '#080306'); f.fillRect(247, 0, 1, 6);
    for (const [x, top, apex] of [[212, 76, 48], [270, 70, 40], [286, 90, 66]]) { f.fillRect(x, top, 12, 90); cone(f, x + 6, top, 9, apex, '#080306', '#080306'); }
    for (const [x, y] of [[235, 74], [247, 90], [259, 74], [247, 112], [217, 96], [275, 92]]) { f.fillStyle = '#e8a040'; f.fillRect(x, y, 1, 3); f.fillStyle = '#a02818'; f.fillRect(x, y + 3, 1, 1); }
    f.fillStyle = '#0a1418'; f.fillRect(0, 150, W, H - 150); }

  /* ---------- fond : la façade (porte-donjon, tours, remparts), arbres morts ---------- */
  const [wl, w] = mk(W, H); r.wall = wl;
  { const BA = '#1a1418', LI = '#0f0a0d', HI = '#3a2a2c';
    // arbres morts à gauche
    w.fillStyle = '#0a0508'; tree(w, 24, GROUND, 26, -Math.PI / 2 - .1, 4, 3); tree(w, 62, GROUND, 20, -Math.PI / 2 + .15, 4, 3);
    // mur d'enceinte gauche et droit
    brick(w, 108, 166, 112, GROUND, BA, LI, HI); for (let x = 108; x < 166; x += 8) { w.fillStyle = BA; w.fillRect(x, 105, 5, 8); w.fillStyle = HI; w.fillRect(x, 105, 1, 8); }
    brick(w, 344, W, 88, GROUND, BA, LI, HI); for (let x = 344; x < W; x += 8) { w.fillStyle = BA; w.fillRect(x, 81, 5, 8); w.fillStyle = HI; w.fillRect(x, 81, 1, 8); }
    // tours à toit pointu
    brick(w, 166, 204, 62, GROUND, BA, LI, HI); w.fillStyle = '#2c2024'; w.fillRect(164, 58, 42, 5); w.fillStyle = HI; w.fillRect(164, 58, 42, 1); cone(w, 185, 58, 24, 18, '#12090d', '#4a2a2c'); w.fillStyle = '#12090d'; w.fillRect(185, 10, 1, 9);
    brick(w, 304, 344, 48, GROUND, BA, LI, HI); w.fillStyle = '#2c2024'; w.fillRect(302, 44, 44, 5); w.fillStyle = HI; w.fillRect(302, 44, 44, 1); cone(w, 324, 44, 26, 2, '#12090d', '#4a2a2c');
    slit(w, 185, 74); slit(w, 185, 110, '#a02818'); slit(w, 324, 62); slit(w, 324, 100, '#a02818'); slit(w, 324, 134);
    // le porte-donjon
    brick(w, 204, 304, 78, GROUND, BA, LI, HI); for (let x = 204; x < 304; x += 9) { w.fillStyle = BA; w.fillRect(x, 70, 6, 9); w.fillStyle = HI; w.fillRect(x, 70, 1, 9); }
    w.fillStyle = '#2c2024'; w.fillRect(204, 78, 100, 3); w.fillStyle = HI; w.fillRect(204, 78, 100, 1);
    slit(w, 216, 86); slit(w, 292, 86); slit(w, 254, 84, '#c03020');
    // grande porte gothique (l'embrasure s'anime en dyn)
    w.fillStyle = '#2c2024'; archRows(GATE.x1 - 6, GATE.x2 + 6, 128, GROUND, 24, (y, a, b) => w.fillRect(a, y, b - a, 1));
    w.fillStyle = HI; archRows(GATE.x1 - 6, GATE.x2 + 6, 128, GROUND, 24, (y, a, b) => { w.fillRect(a, y, 1, 1); });
    w.fillStyle = '#05020a'; archRows(GATE.x1 - 1, GATE.x2 + 1, 128, GROUND, 19, (y, a, b) => w.fillRect(a, y, b - a, 1));
    // tête de gargouille/crâne à cornes en clé de voûte
    w.fillStyle = '#5a4a48'; w.fillRect(250, 100, 9, 7); w.fillRect(251, 107, 7, 2); w.fillStyle = '#05020a'; w.fillRect(251, 102, 2, 2); w.fillRect(256, 102, 2, 2); w.fillRect(254, 105, 1, 2); w.fillStyle = '#5a4a48'; w.fillRect(248, 98, 2, 3); w.fillRect(259, 98, 2, 3); w.fillRect(247, 96, 1, 3); w.fillRect(261, 96, 1, 3);
    // bannières rouges sur la façade
    for (const bx of [210, 290]) { w.fillStyle = '#05020a'; w.fillRect(bx - 1, 115, 11, 2); w.fillStyle = '#5c1018'; w.fillRect(bx, 117, 9, 36); for (let i = 0; i < 4; i++) w.fillRect(bx + 1 + i, 153 + i, 7 - i * 2, 1);
      w.fillStyle = '#3e0a10'; w.fillRect(bx, 117, 1, 36); w.fillStyle = '#c9a24a'; w.fillRect(bx + 4, 124, 1, 9); w.fillRect(bx + 2, 126, 5, 1); w.fillRect(bx + 3, 133, 3, 1); w.fillRect(bx + 4, 134, 1, 2); }
    // balcon à gargouilles (on y grimpe par la chaîne)
    w.fillStyle = '#2c2024'; w.fillRect(204, 96, 28, 4); w.fillStyle = HI; w.fillRect(204, 96, 28, 1); w.fillStyle = '#12090d'; w.fillRect(206, 100, 4, 3); w.fillRect(226, 100, 4, 3);
    for (const gx of [210, 300]) { w.fillStyle = '#12090d'; w.fillRect(gx, 62, 7, 8); w.fillRect(gx - 3, 63, 4, 3); w.fillRect(gx + 6, 63, 4, 3); w.fillRect(gx, 59, 2, 3); w.fillRect(gx + 5, 59, 2, 3); w.fillStyle = '#c03020'; w.fillRect(gx + 1, 64, 1, 1); w.fillRect(gx + 5, 64, 1, 1); }
    // la chaîne
    for (let y = 100; y < GROUND; y += 3) { w.fillStyle = '#6a6a76'; w.fillRect(224 + (y / 3 % 2), y, 2, 2); w.fillStyle = '#2a2a34'; w.fillRect(224 + (y / 3 % 2), y + 1, 2, 1); }
  }

  /* ---------- premier plan : terre, route pavée, grille de fer, braseros, piques ---------- */
  const [pl, p] = mk(W, H); r.play = pl;
  const sign = (x, y, text) => { const tx = txt(text, '#e9e2cc', null), wd = tx.width + 8, x0 = x - (wd >> 1); p.fillStyle = '#05060a'; p.fillRect(x0 - 1, y - 1, wd + 2, 11); p.fillStyle = '#4a2c1a'; p.fillRect(x0, y, wd, 9); p.fillStyle = '#6a4228'; p.fillRect(x0, y, wd, 1); p.drawImage(tx, x0 + 4, y + 1); };
  { p.fillStyle = '#150a0d'; p.fillRect(0, GROUND, W, H - GROUND);
    for (let k = 0; k < 480; k++) { p.fillStyle = ['#1c0f12', '#100609', '#241619'][k % 3]; p.fillRect(R() * W | 0, GROUND + 2 + (R() * 30 | 0), 2 + (R() * 3 | 0), 1); }
    for (let y = GROUND + 2; y < H; y += 4) { const row = (y - GROUND) / 4 | 0, x0 = 104 + row * 0, x1 = 330;   // route qui mène à la porte
      for (let x = x0 + (row % 2) * 4; x < x1; x += 8) { if (R() < .2) continue; p.fillStyle = ['#2a2226', '#32282c', '#241c20'][(x * 3 + y) % 3]; p.fillRect(x, y, 7, 3); p.fillStyle = '#3a2e32'; if (R() < .3) p.fillRect(x, y, 7, 1); } }
    p.fillStyle = '#3a2428'; p.fillRect(0, GROUND, W, 1); p.fillStyle = '#0a0407'; p.fillRect(0, GROUND + 1, W, 1);
    for (const [x, y] of [[30, 199], [180, 207], [322, 201]]) { p.fillStyle = '#8a7a68'; p.fillRect(x, y, 5, 1); p.fillRect(x - 1, y - 1, 1, 1); p.fillRect(x + 5, y + 1, 1, 1); }
    // seuil de la grande porte
    p.fillStyle = '#0a0407'; p.fillRect(GATE.x1 - 6, GROUND - 2, GATE.x2 - GATE.x1 + 12, 4); p.fillStyle = '#3a2e30'; p.fillRect(GATE.x1 - 5, GROUND - 1, GATE.x2 - GATE.x1 + 10, 2);
    // grille de fer à gauche, avec ses piliers à boule
    for (let x = 2; x < 100; x += 4) { p.fillStyle = '#0c080e'; p.fillRect(x, 150, 1, GROUND - 150); p.fillRect(x - 1, 148, 3, 2); p.fillRect(x, 146, 1, 2); p.fillStyle = '#2a2430'; p.fillRect(x, 152, 1, GROUND - 152); }
    for (const y of [158, 176]) { p.fillStyle = '#0c080e'; p.fillRect(0, y, 100, 2); p.fillStyle = '#2a2430'; p.fillRect(0, y, 100, 1); }
    for (const px of [0, 94]) { p.fillStyle = '#0a0508'; p.fillRect(px - 1, 128, 12, GROUND - 128); p.fillStyle = '#2c2024'; p.fillRect(px, 129, 10, GROUND - 129); p.fillStyle = '#4a3a3c'; p.fillRect(px, 129, 1, GROUND - 129); p.fillStyle = '#0a0508'; disc(p, px + 5, 124, 5); p.fillStyle = '#3a2e30'; disc(p, px + 5, 124, 4); }
    // braseros de fer
    for (const bx of [198, 310]) { p.fillStyle = '#100a0e'; p.fillRect(bx - 1, 152, 3, GROUND - 152); p.fillRect(bx - 4, GROUND - 5, 9, 5); p.fillStyle = '#3a2e32'; p.fillRect(bx - 1, 152, 1, GROUND - 152);
      p.fillStyle = '#100a0e'; p.fillRect(bx - 6, 146, 13, 2); p.fillRect(bx - 5, 148, 2, 4); p.fillRect(bx + 4, 148, 2, 4); p.fillRect(bx - 5, 151, 11, 2); r.fires.push(fire(bx, 148, 1)); }
    // piques avec crânes, et l'écriteau
    for (const x of [126, 336]) { p.fillStyle = '#1a1214'; p.fillRect(x, 142, 2, GROUND - 142); p.fillStyle = '#9a8a78'; p.fillRect(x - 3, 134, 8, 7); p.fillRect(x - 2, 141, 6, 2); p.fillStyle = '#150a0d'; p.fillRect(x - 2, 136, 2, 2); p.fillRect(x + 2, 136, 2, 2); p.fillRect(x, 139, 1, 2); }
    p.fillStyle = '#2a1a10'; p.fillRect(148, 148, 2, 36); sign(149, 142, 'DANGER'); p.fillStyle = '#5c1018'; p.fillRect(146, 154, 6, 1);
  }
  r.plats = [{ x1: 206, x2: 230, y: 96 }, { x1: 94, x2: 104, y: 124 }];
  r.climbs = [{ x1: 221, x2: 229, y1: 96, y2: GROUND, kind: 'chaîne' }];
  r.seats = [];
  r.portals = [{ x1: GATE.x1, x2: GATE.x2, spring: 128, bottom: GROUND, rr: 18, floor: GROUND, label: 'Entrer dans le château', to: 'trone', toX: 22, bars: true, open: 0, near: 0, col: '255,110,60', col2: '255,210,150' }];
  const door = r.portals[0];
  r.pennons = [[185, 10], [324, 2]];
  r.update = dt => { };
  const BATS = Array.from({ length: 6 }, (_, i) => ({ cx: 180 + i * 28, cy: 40 + (i % 3) * 22, rx: 26 + i * 4, ry: 10 + (i % 2) * 8, sp: .7 + i * .13, ph: i * 1.9 }));
  r.dyn = c => {
    drawPortal(c, door);
    // pennons rouges au sommet des tours
    for (const [x, y] of r.pennons) for (let i = 0; i < 12; i++) { c.fillStyle = i < 3 ? '#8c1a24' : '#5c1018'; c.fillRect(x + 1 + i, Math.round(y + Math.sin(time * 4 + i * .6) * 1.5) + (i > 6 ? 1 : 0), 1, 4 - (i > 7 ? 2 : i > 4 ? 1 : 0)); }
    // chauves-souris
    for (const b of BATS) { const t = time * b.sp + b.ph, x = b.cx + Math.cos(t) * b.rx, y = b.cy + Math.sin(t * 1.7) * b.ry, fl = Math.sin(time * 14 + b.ph) > 0;
      c.fillStyle = '#05020a'; c.fillRect(Math.round(x), Math.round(y), 2, 2); if (fl) { c.fillRect(Math.round(x) - 3, Math.round(y) - 1, 3, 1); c.fillRect(Math.round(x) + 2, Math.round(y) - 1, 3, 1); } else { c.fillRect(Math.round(x) - 3, Math.round(y) + 1, 3, 1); c.fillRect(Math.round(x) + 2, Math.round(y) + 1, 3, 1); } }
    // cendres
    for (let i = 0; i < 40; i++) { const x = ((i * 53.7 + time * (3 + i % 4) + Math.sin(time * .7 + i) * 7) % W + W) % W, y = ((i * 37.3 + time * (7 + i % 5 * 3)) % 230) - 10;
      c.fillStyle = i % 9 === 0 ? 'rgba(255,150,80,.75)' : 'rgba(200,170,170,.4)'; c.fillRect(Math.round(x), Math.round(y), 1, 1); }
  };
  r.lights = () => {
    portalGlow(door); glow(EXc, EYc, 70, '190,215,255', .09 + .02 * Math.sin(time * 1.3));
    for (const [x, y] of [[185, 82], [185, 118], [324, 70], [324, 108], [324, 142], [216, 94], [292, 94], [254, 92]]) glow(x, y, 14, '255,150,70', .12 + .03 * Math.sin(time * 5 + x));
    glow(149, 150, 20, '255,200,150', .05);
  };
  r.interacts = [
    { x: 149, x1: 138, x2: 160, y: GROUND, py: 120, label: 'Lire l’écriteau', run: () => toast('« Ici vit le Seigneur des Cendres. Les visiteurs sont attendus… mais rarement renvoyés. »') },
  ];
  // la salle du trône ouvre désormais sur le château : on ressort devant la grande porte
  ROOMS.trone.left = 'chateau'; ROOMS.trone.leftX = 254;
}
