"use strict";
// « La Clairière des Lucioles » (identifiant interne : remparts) : la place d'accueil, où chacun arrive en jouant.
// - Une clairière au cœur de la forêt, sous un ciel de nuit étoilé et une grande lune. Au centre, la fontaine à la statue de lune.
// - Des guirlandes de fanions, des lanternes, des bancs, des fleurs, des lucioles : on doit s'y sentir bien accueilli.
// - À gauche : la rue du cinéma. À droite : l'arche de pierre qui mène au château.
// - Le grand chêne (à droite) se grimpe : tout en haut, on change de salle et on arrive au Sommet (sommet.js).
// - Le tableau d'accueil (touche E) explique où aller ; on peut faire un vœu à la fontaine et s'asseoir sur les bancs.

{ const FX = 192, EX = 150, MX = 84, MY = 44, TX = 300, TO = 240;
  const r = ROOMS.remparts = { id: 'remparts', name: 'LA CLAIRIERE DES LUCIOLES', left: 'devanture', right: 'chateau', fires: [], grass: [], climbs: [],
    fogFar: null, fogNear: [178, 4, .14] };
  const B4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  const FLEURS = ['#f08aa8', '#f0d060', '#e8e4d0', '#9ab8f0', '#c88af0'];

  /* ---------- le ciel et le lointain, peints par deux fonctions partagées (Clairière, Sommet, Devanture, Cinéma, Château) ---------- */
  // paintSky : nuit claire, du bleu nuit au bleu-vert de l'horizon hz, lune pleine en (mx, my) avec son halo. y0 = ordonnée du monde du haut du canvas.
  const paintSky = (cw, ch, y0, mx, my, hz) => { const [cv, s] = mk(cw, ch);
    const D = [-324, -200, -96, -30, 0, 92], C = [[5, 8, 22], [10, 20, 44], [20, 40, 72], [34, 66, 96], [62, 100, 120], [16, 30, 38]];
    const skyCol = wy => { const dl = wy - hz; let i = 0; while (i < D.length - 2 && dl > D[i + 1]) i++; const t = clamp((dl - D[i]) / (D[i + 1] - D[i]), 0, 1); return C[i].map((v, k) => v + (C[i + 1][k] - v) * t); };
    const img = s.createImageData(cw, ch), d = img.data, Q = 10;
    for (let y = 0; y < ch; y++) { const c = skyCol(y + y0);
      for (let x = 0; x < cw; x++) { const i = (y * cw + x) * 4, th = B4[(y & 3) * 4 + (x & 3)] / 16;
        for (let k = 0; k < 3; k++) d[i + k] = Math.min(255, Math.floor((c[k] + th * Q) / Q) * Q); d[i + 3] = 255; } }
    const cy = my - y0, mix = (i, col, a) => { for (let k = 0; k < 3; k++) d[i + k] = d[i + k] * (1 - a) + col[k] * a; };
    for (let y = cy - 64; y <= cy + 64; y++) for (let x = mx - 64; x <= mx + 64; x++) { if (x < 0 || x >= cw || y < 0 || y >= ch) continue;
      const dx = x - mx, dy = y - cy, dd = Math.hypot(dx, dy), i = (y * cw + x) * 4;
      if (dd <= 11.5) {   // la lune : disque pâle, quelques cratères, bord ombré
        const cr = (dx + 3) ** 2 + (dy + 2) ** 2 < 8 || (dx - 4) ** 2 + (dy - 3) ** 2 < 5 || (dx + 1) ** 2 + (dy - 6) ** 2 < 3 || (dx - 5) ** 2 + (dy + 5) ** 2 < 2;
        const col = cr ? [206, 212, 200] : dd > 10.3 || dx + dy > 13 ? [212, 216, 204] : [240, 242, 228]; for (let k = 0; k < 3; k++) d[i + k] = col[k]; }
      else if (dd < 62) { const a = Math.pow(1 - (dd - 11.5) / 50.5, 2.2) * .5, lv = Math.floor(a * 6 + B4[(y & 3) * 4 + (x & 3)] / 16) / 6; if (lv > 0) mix(i, [180, 208, 228], Math.min(1, lv)); } }
    s.putImageData(img, 0, 0); return cv; };
  // un sapin en silhouette (pointe en haut), éclairé côté lune (à gauche)
  const pine = (f, cx, base, h, col, rim) => { for (let i = 0; i < h; i++) { const hw = Math.round((1 - i / h) * h * .3) + (i % 4 === 1 ? 1 : 0);
    f.fillStyle = col; f.fillRect(cx - hw, base - i, hw * 2 + 1, 1); if (rim && R() < .45) { f.fillStyle = rim; f.fillRect(cx - hw, base - i, 1, 1); } } };
  // paintLand : collines bleutées, rangées de sapins, brume, prairie, forêt dense sur les côtés. dy décale tout vers le bas.
  // riviere : la rivière d'argent qui serpente dans la vallée (seulement vue d'en haut, depuis le Sommet).
  const paintLand = (f, dy, riviere = false) => { f.save(); f.translate(0, dy);
    const ridge = (base, a1, a2, st1, st2, col, rim, rimP) => { const n1 = makeNoise(st1, a1), n2 = makeNoise(st2, a2);
      for (let x = 0; x < W; x++) { const t = Math.round(base - n1(x) - n2(x)); f.fillStyle = col; f.fillRect(x, t, 1, H - t); if (R() < rimP) { f.fillStyle = rim; f.fillRect(x, t, 1, 1); } } };
    ridge(122, 30, 6, 52, 9, '#132438', '#2c4a66', .4);
    f.fillStyle = 'rgba(170,200,220,.10)'; f.fillRect(0, 108, W, 16);
    for (let x = -4; x < W + 6; x += 3 + (R() * 4 | 0)) pine(f, x, 128 + (R() * 3 | 0), 8 + R() * 11, '#0f1c2a', '#22384c');
    f.fillStyle = 'rgba(170,200,220,.08)'; f.fillRect(0, 120, W, 10);
    for (let x = -6; x < W + 8; x += 5 + (R() * 6 | 0)) pine(f, x, 134 + (R() * 3 | 0), 14 + R() * 16, '#0a141e', '#1c3040');
    { const nf = makeNoise(60, 4); for (let x = 0; x < W; x++) { const t = Math.round(133 - nf(x)); f.fillStyle = '#0b1a1c'; f.fillRect(x, t, 1, H - t); f.fillStyle = '#1e3a34'; f.fillRect(x, t, 1, 1); } }
    for (let k = 0; k < 260; k++) { f.fillStyle = k % 3 ? '#12262a' : '#081214'; f.fillRect(R() * W | 0, 136 + (R() * 50 | 0), 1 + (R() < .3), 1); }
    // la rivière d'argent qui descend vers la clairière
    if (riviere) for (let y = 133; y < 190; y++) { const k = y - 133, cx = Math.round(EX - k * .35 + Math.sin(k * .12) * (4 + k * .2)), hw = 1 + Math.round(k * .12);
      f.fillStyle = '#0e2230'; f.fillRect(cx - hw - 1, y, hw * 2 + 3, 1); f.fillStyle = '#2a5470'; f.fillRect(cx - hw, y, hw * 2 + 1, 1); f.fillStyle = '#5a90ae'; f.fillRect(cx - (hw >> 1), y, hw + 1, 1);
      if (k % 6 === 0) { f.fillStyle = '#cfe8f4'; f.fillRect(cx, y, 1, 1); } }
    // forêt dense sur les deux versants
    { const nl = makeNoise(14, 6), nb = makeNoise(5, 3);
      const versant = (x, t) => { const top = t - Math.round(Math.abs(Math.sin(x * .33)) * 5 + nb(x));
        f.fillStyle = '#07100f'; f.fillRect(x, top, 1, H - top); f.fillStyle = R() < .55 ? '#1d3328' : '#0f1f19'; f.fillRect(x, top, 1, 1); if (R() < .25) { f.fillStyle = '#2a4a38'; f.fillRect(x, top + 1, 1, 1); } };
      for (let x = 0; x < 140; x++) versant(x, Math.round(96 + x * .46 + nl(x) - 3));
      for (let x = 250; x < W; x++) versant(x, Math.round(96 + (W - x) * .46 + nl(x) - 3)); }
    f.restore(); };
  // feuillage : grappes de disques verts, avec des reflets de lune
  const feuillage = (c, cx, cy, rad, n) => { for (let k = 0; k < n; k++) { const a = R() * 6.283, d = R() * rad, x = cx + Math.cos(a) * d | 0, y = cy + Math.sin(a) * d * .7 | 0, rr = 4 + R() * 7 | 0;
      c.fillStyle = '#0a160f'; disc(c, x, y + 1, rr); c.fillStyle = '#15301d'; disc(c, x, y, rr - 1); if (R() < .6) { c.fillStyle = '#21452a'; disc(c, x - 1, y - 1, Math.max(1, rr - 3)); } }
    for (let k = 0; k < n * 3; k++) { const a = R() * 6.283, d = R() * rad, x = cx + Math.cos(a) * d | 0, y = cy + Math.sin(a) * d * .7 | 0; c.fillStyle = R() < .5 ? '#3a6a48' : '#2e5a3c'; c.fillRect(x, y, 1, 1); } };

  r.stars = makeStars(MX, MY);
  r.sky = paintSky(W, H, 0, MX, MY, 124);
  globalThis.NOC_PAINT = { paintSky, paintLand, pine, feuillage };   // réutilisés par le Sommet, la Devanture, le Cinéma et le Château
  { const [fa, f] = mk(W, H); r.far = fa; paintLand(f, 0); }

  /* ---------- fond : grands arbres à gauche, buissons fleuris, arche de pierre vers le château ---------- */
  const [wl, w] = mk(W, H); r.wall = wl;
  { const trunk = (x, wd, top, bot) => { for (let i = 0; i < wd; i++) { w.fillStyle = i < 2 ? '#4e3a2a' : i >= wd - 2 ? '#120c08' : R() < .15 ? '#24180f' : '#2c2016'; w.fillRect(x + i, top, 1, bot - top); }
      w.fillStyle = '#2c2016'; w.fillRect(x - 3, bot - 4, wd + 6, 4); w.fillStyle = '#4e3a2a'; w.fillRect(x - 3, bot - 4, 2, 1); };
    const buisson = (x1, x2, top) => { for (let x = x1; x <= x2; x += 5) { const rr = 5 + (R() * 4 | 0), y = top + 6 + (R() * 4 | 0); w.fillStyle = '#0a160f'; disc(w, x, y + 1, rr); w.fillStyle = '#17331f'; disc(w, x, y, rr - 1); w.fillStyle = '#24472c'; disc(w, x - 1, y - 2, Math.max(1, rr - 3)); }
      w.fillStyle = '#17331f'; w.fillRect(x1 - 4, top + 8, x2 - x1 + 8, GROUND - top - 8);
      for (let k = 0; k < (x2 - x1) / 3; k++) { w.fillStyle = FLEURS[k % FLEURS.length]; w.fillRect(x1 - 2 + (R() * (x2 - x1 + 4) | 0), top + 3 + (R() * (GROUND - top - 6) | 0), 1, 1); } };
    trunk(10, 9, 40, GROUND); trunk(32, 6, 90, GROUND);
    feuillage(w, 22, 34, 34, 26); feuillage(w, 44, 78, 18, 10);
    buisson(84, 126, 152); buisson(258, 284, 156);
    // l'arche de pierre couverte de lierre (sortie à droite, vers le château)
    const pilier = (x, wd, top) => { for (let i = 0; i < wd; i++) { w.fillStyle = i < 2 ? '#6a7080' : i >= wd - 2 ? '#1c1f26' : '#3e434e'; w.fillRect(x + i, top, 1, GROUND - top); }
      w.fillStyle = '#2a2e38'; for (let y = top + 8; y < GROUND; y += 8) w.fillRect(x, y, wd, 1); w.fillStyle = '#4a505c'; w.fillRect(x - 2, GROUND - 6, wd + 4, 6); w.fillStyle = '#6a7080'; w.fillRect(x - 2, GROUND - 6, wd + 4, 1); };
    w.fillStyle = '#060c0c'; w.fillRect(354, 66, 26, GROUND - 66);   // le chemin qui s'enfonce dans la forêt
    for (let y = 66; y < GROUND; y += 2) { w.fillStyle = `rgba(120,170,190,${.16 * (y - 66) / (GROUND - 66)})`; w.fillRect(354, y, 26, 2); }
    pilier(340, 14, 64); pilier(378, 6, 64);
    for (let x = 338; x <= W; x++) { const t = Math.round(64 - Math.sqrt(Math.max(0, 1 - ((x - 362) / 24) ** 2)) * 12); w.fillStyle = '#3e434e'; w.fillRect(x, t, 1, 9); w.fillStyle = '#6a7080'; w.fillRect(x, t, 1, 1); w.fillStyle = '#1c1f26'; w.fillRect(x, t + 8, 1, 1); }
    for (let k = 0; k < 70; k++) { const x = 336 + (R() * 48 | 0), y = 52 + (R() * 70 | 0); if (x > 355 && x < 377 && y > 70) continue; w.fillStyle = R() < .5 ? '#24472c' : '#3a6a48'; w.fillRect(x, y, 1 + (R() < .4), 1); }
    for (const x of [343, 350, 381]) for (let y = 60; y < 74 + (R() * 22 | 0); y++) { w.fillStyle = y % 3 ? '#24472c' : '#3a6a48'; w.fillRect(x + (Math.sin(y * .5) > .6 ? 1 : 0), y, 1, 1); }
    for (const sx of [347, 381]) { w.fillStyle = '#1a1a20'; w.fillRect(sx - 3, 122, 7, 2); w.fillRect(sx - 1, 124, 3, 5); w.fillStyle = '#4a4a56'; w.fillRect(sx - 3, 121, 7, 1); }
  }

  /* ---------- le grand chêne (tout en hauteur) : dessiné dans r.back, derrière les personnages ---------- */
  const [tcv, t] = mk(W, H + TO);
  { const Y = y => y + TO; const limb = (xa, xb, y, w2 = 4) => { t.fillStyle = '#3a2818'; pline(t, xa, Y(y + 1), xb, Y(y + 1), w2); t.fillStyle = '#1a1009'; pline(t, xa, Y(y + 3), xb, Y(y + 3), 1); t.fillStyle = '#6a4a30'; pline(t, xa, Y(y), xb, Y(y), 1); };
    // le feuillage, derrière le tronc et les branches
    for (const [x, y, rr, n] of [[300, -140, 54, 46], [252, -96, 32, 20], [348, -76, 34, 22], [262, -20, 26, 14], [342, 8, 30, 16], [356, 44, 18, 9], [250, 96, 18, 9], [318, -40, 24, 12]]) feuillage(t, x, Y(y), rr, n);
    // branches praticables
    for (const [x1, x2, y] of [[268, 296, 130], [304, 342, 62]]) { limb(x1, x2, y); const left = x2 < TX + 2; t.fillStyle = '#3a2818'; const tipx = left ? x1 : x2; tree(t, tipx, Y(y + 2), 9, left ? Math.PI * .85 : Math.PI * .15, 2, 2); }
    // tronc
    for (let y = 196; y > -150; y--) { const hw = Math.round(6 + 8 * (y + 150) / 346), cx = TX + Math.round(Math.sin(y * .04) * 2);
      for (let x = cx - hw; x <= cx + hw; x++) { const i = x - (cx - hw); t.fillStyle = i < 2 ? '#6a4a30' : x > cx + hw - 2 ? '#140d08' : (x * 7 + (y >> 2)) % 9 === 0 || R() < .1 ? '#2a1c12' : '#3a2818'; t.fillRect(x, Y(y), 1, 1); } }
    t.fillStyle = '#140d08'; for (const [x, y] of [[298, 150], [303, 20]]) { t.fillRect(x, Y(y), 3, 5); t.fillRect(x + 1, Y(y) - 1, 1, 7); }
    t.fillStyle = '#0c0805'; disc(t, 299, Y(96), 3); t.fillStyle = '#2a1c12'; t.fillRect(296, Y(99), 7, 1);   // un creux dans le tronc
    // lanternes chaudes accrochées aux branches : elles guident la montée
    for (const [x, y] of [[338, 62], [272, 130]]) { t.fillStyle = '#1a120c'; t.fillRect(x, Y(y + 4), 1, 5); t.fillRect(x - 2, Y(y + 9), 5, 7); t.fillStyle = '#f0b048'; t.fillRect(x - 1, Y(y + 10), 3, 5); t.fillStyle = '#fff0b0'; t.fillRect(x, Y(y + 11), 1, 2); }
    // une chouette sur la haute branche
    { const ox = 316, oy = Y(62); t.fillStyle = '#2a1c12'; t.fillRect(ox - 3, oy - 9, 7, 9); t.fillStyle = '#7a5a3a'; t.fillRect(ox - 2, oy - 9, 5, 8); t.fillStyle = '#c8a878'; t.fillRect(ox - 2, oy - 8, 5, 3);
      t.fillStyle = '#2a1c12'; t.fillRect(ox - 3, oy - 11, 1, 2); t.fillRect(ox + 3, oy - 11, 1, 2); t.fillStyle = '#ffd860'; t.fillRect(ox - 1, oy - 7, 1, 1); t.fillRect(ox + 1, oy - 7, 1, 1);
      t.fillStyle = '#e0a040'; t.fillRect(ox, oy - 6, 1, 1); t.fillStyle = '#5a4028'; t.fillRect(ox - 1, oy - 3, 3, 1); }
  }
  r.back = c => c.drawImage(tcv, 0, -TO);

  /* ---------- premier plan : herbe, chemin pavé, fontaine, bancs, lanternes, tableau, panneaux, fleurs ---------- */
  const [pl, p] = mk(W, H); r.play = pl;
  const sign = (x, y, text, dir) => { const tx = txt(text, '#e9e2cc', null), wd = tx.width + 8;
    const x0 = dir < 0 ? x - wd + 4 : x - 4; p.fillStyle = '#05060a'; p.fillRect(x0 - 1, y - 1, wd + 2, 11); p.fillStyle = '#4a2c1a'; p.fillRect(x0, y, wd, 9); p.fillStyle = '#6a4228'; p.fillRect(x0, y, wd, 1);
    p.drawImage(tx, x0 + (dir < 0 ? 5 : 2), y + 1); p.fillStyle = '#4a2c1a';
    if (dir < 0) { for (let i = 0; i < 5; i++) p.fillRect(x0 - 1 - i, y + i, 1, 9 - i * 2); } else if (dir > 0) for (let i = 0; i < 5; i++) p.fillRect(x0 + wd + i, y + i, 1, 9 - i * 2); };
  const fleur = (x, y, col) => { p.fillStyle = '#2e5a32'; p.fillRect(x, y + 1, 1, 2); p.fillStyle = col; p.fillRect(x - 1, y, 3, 1); p.fillRect(x, y - 1, 1, 3); p.fillStyle = '#fff4b0'; p.fillRect(x, y, 1, 1); };
  { // herbe + chemin pavé autour de la fontaine
    p.fillStyle = '#122016'; p.fillRect(0, GROUND, W, H - GROUND);
    for (let k = 0; k < 520; k++) { p.fillStyle = ['#18301c', '#0c160f', '#1e3622'][k % 3]; p.fillRect(R() * W | 0, GROUND + 2 + (R() * 30 | 0), 2 + (R() * 3 | 0), 1); }
    for (let y = GROUND + 2; y < H; y += 4) { const row = (y - GROUND) / 4 | 0;
      for (let x = (row % 2) * 4; x < W; x += 8) { const d = Math.abs(x - FX); if (d > 120 - row * 6 || R() < .15) continue; p.fillStyle = ['#4a4c54', '#55585f', '#3e4048'][(x * 3 + y) % 3]; p.fillRect(x, y, 7, 3); p.fillStyle = '#6a6e76'; if (R() < .35) p.fillRect(x, y, 7, 1); } }
    p.fillStyle = '#3a6a3c'; p.fillRect(0, GROUND, W, 1); p.fillStyle = '#0a140c'; p.fillRect(0, GROUND + 1, W, 1);
    for (let x = 0; x < W; x += 2) { const h = R() * 3 | 0; if (h) { p.fillStyle = R() < .5 ? '#2e5a32' : '#4a8a4a'; p.fillRect(x, GROUND - h, 1, h); } }
    for (let k = 0; k < 26; k++) { const x = 4 + (R() * (W - 8) | 0); if (x > 146 && x < 238) continue; fleur(x, GROUND + 4 + (R() * 24 | 0), FLEURS[k % FLEURS.length]); }
    // fontaine : bassin, colonne, vasque, statue de lune
    p.fillStyle = '#0b0c10'; p.fillRect(150, 171, 84, 13); p.fillStyle = '#5a6070'; p.fillRect(151, 172, 82, 4); p.fillStyle = '#8a92a0'; p.fillRect(151, 172, 82, 1);
    p.fillStyle = '#3a3e4a'; p.fillRect(152, 176, 80, 8); for (let x = 156; x < 230; x += 9) { p.fillStyle = '#22252e'; p.fillRect(x, 177, 1, 7); }
    for (let x = 153; x < 232; x += 7) { p.fillStyle = R() < .5 ? '#2e5a3c' : '#3a6a48'; p.fillRect(x, 182 + (R() * 2 | 0), 2, 1); }   // un peu de mousse
    p.fillStyle = '#3e434e'; p.fillRect(FX - 4, 148, 9, 24); p.fillStyle = '#5a6070'; p.fillRect(FX - 4, 148, 2, 24); p.fillStyle = '#22252e'; p.fillRect(FX + 3, 148, 2, 24);
    p.fillStyle = '#0b0c10'; p.fillRect(176, 145, 33, 5); p.fillStyle = '#5a6070'; p.fillRect(177, 145, 31, 3); p.fillStyle = '#8a92a0'; p.fillRect(177, 145, 31, 1);
    for (let i = 0; i < 4; i++) { p.fillStyle = '#3e434e'; p.fillRect(180 + i, 148 + i, 25 - i * 2, 1); }
    p.fillStyle = '#5a6070'; p.fillRect(FX - 2, 126, 5, 19); p.fillStyle = '#8a92a0'; p.fillRect(FX - 2, 126, 1, 19);
    p.fillStyle = '#0b0c10'; disc(p, FX, 118, 8); p.fillStyle = '#d8e2ea'; disc(p, FX, 118, 7); p.fillStyle = '#aab8c6'; disc(p, FX - 1, 119, 5);
    p.globalCompositeOperation = 'destination-out'; disc(p, FX + 3, 116, 6); p.globalCompositeOperation = 'source-over';
    // bancs
    for (const bx of [112, 272]) { p.fillStyle = '#0b0608'; p.fillRect(bx - 13, 170, 27, 4); p.fillStyle = '#6a4630'; p.fillRect(bx - 12, 171, 25, 2); p.fillStyle = '#8a6040'; p.fillRect(bx - 12, 171, 25, 1);
      p.fillStyle = '#0b0608'; p.fillRect(bx - 13, 160, 27, 3); p.fillStyle = '#5a3c26'; p.fillRect(bx - 12, 161, 25, 1);
      p.fillStyle = '#2a1c12'; for (const lx of [bx - 11, bx + 10]) { p.fillRect(lx, 160, 2, 24); } }
    // lanternes sur pied (leur chapeau est une plateforme)
    for (const lx of [134, 250]) { p.fillStyle = '#16161c'; p.fillRect(lx - 1, 110, 3, GROUND - 110); p.fillRect(lx - 3, GROUND - 6, 7, 6); p.fillStyle = '#3a3a44'; p.fillRect(lx - 1, 110, 1, GROUND - 110);
      p.fillStyle = '#16161c'; p.fillRect(lx - 5, 98, 11, 2); p.fillRect(lx - 4, 100, 1, 9); p.fillRect(lx + 4, 100, 1, 9); p.fillRect(lx - 4, 108, 9, 2); p.fillRect(lx - 2, 95, 5, 3); p.fillRect(lx, 92, 1, 3);
      p.fillStyle = 'rgba(255,200,110,.55)'; p.fillRect(lx - 3, 100, 7, 8); r.fires.push(fire(lx, 105, 0));
      for (const [dx, col] of [[-3, FLEURS[0]], [3, FLEURS[1]]]) fleur(lx + dx, GROUND - 3, col); }
    // tableau d'accueil, avec une jardinière fleurie
    { const bx = 66; p.fillStyle = '#2a1a10'; p.fillRect(bx - 21, 138, 3, 46); p.fillRect(bx + 19, 138, 3, 46);
      p.fillStyle = '#05060a'; p.fillRect(bx - 22, 128, 45, 34); p.fillStyle = '#4a2c1a'; p.fillRect(bx - 21, 129, 43, 32); p.fillStyle = '#6a4228'; p.fillRect(bx - 21, 129, 43, 1);
      p.fillStyle = '#2a180e'; p.fillRect(bx - 18, 136, 37, 22);
      for (const [x0, y0, ww, hh, c] of [[-16, 138, 12, 14, '#d8ceb4'], [-2, 137, 10, 9, '#c8b890'], [10, 139, 7, 12, '#d8ceb4'], [-1, 148, 9, 8, '#b8c0c0']]) {
        p.fillStyle = c; p.fillRect(bx + x0, y0, ww, hh); p.fillStyle = '#7a6a54'; for (let yy = y0 + 2; yy < y0 + hh - 1; yy += 2) p.fillRect(bx + x0 + 1, yy, ww - 3, 1); p.fillStyle = '#c9203a'; p.fillRect(bx + x0 + (ww >> 1), y0, 1, 1); }
      p.fillStyle = '#4a2c1a'; p.fillRect(bx - 23, 124, 47, 5); p.fillStyle = '#6a4228'; p.fillRect(bx - 23, 124, 47, 1);
      const tt = txt('BIENVENUE', '#e8c860', null); p.drawImage(tt, bx - (tt.width >> 1), 130);
      p.fillStyle = '#05060a'; p.fillRect(bx - 17, 177, 35, 7); p.fillStyle = '#6a4228'; p.fillRect(bx - 16, 178, 33, 6); p.fillStyle = '#8a5a34'; p.fillRect(bx - 16, 178, 33, 1);
      for (let x = bx - 14; x < bx + 16; x += 3) fleur(x, 174 + (x % 2), FLEURS[(x >> 1) % FLEURS.length]); }
    // panneaux de direction (cinéma à gauche, château à droite) et plaquette « SOMMET » clouée au tronc
    { p.fillStyle = '#2a1a10'; p.fillRect(23, 132, 2, 52); sign(24, 134, 'CINEMA', -1);
      p.fillStyle = '#2a1a10'; p.fillRect(331, 140, 2, 44); sign(332, 142, 'CHATEAU', 1);
      const wd = txt('SOMMET', '#fff', null).width + 8; sign(TX - (wd >> 1) + 4, 150, 'SOMMET', 0); p.fillStyle = '#e8c860'; p.fillRect(TX - 1, 144, 3, 1); p.fillRect(TX, 143, 1, 1); }
    // racines du chêne, champignons et pierre moussue
    p.fillStyle = '#2c2016'; for (const [x1, y1, x2, y2] of [[292, 180, 272, 187], [308, 180, 330, 187], [296, 183, 284, 190], [304, 183, 316, 190]]) pline(p, x1, y1, x2, y2, 3);
    { p.fillStyle = '#0a0c0e'; p.fillRect(338, 179, 16, 6); p.fillStyle = '#4a505c'; p.fillRect(339, 179, 14, 5); p.fillStyle = '#3a6a48'; p.fillRect(339, 179, 14, 1); p.fillRect(341, 180, 5, 1);
      for (const [mx, my, s] of [[328, 184, 3], [334, 184, 2], [359, 184, 3]]) { p.fillStyle = '#e8e0d0'; p.fillRect(mx, my - s - 1, 1, s + 1); p.fillStyle = '#c83a3a'; p.fillRect(mx - s, my - s - 2, s * 2 + 1, 2); p.fillRect(mx - s + 1, my - s - 3, s * 2 - 1, 1); p.fillStyle = '#f4ecdc'; p.fillRect(mx - 1, my - s - 2, 1, 1); p.fillRect(mx + 1, my - s - 3, 1, 1); } }
    // caisses pour grimper à gauche
    for (const [x, y, s] of [[43, 172, 12], [52, 160, 10]]) { p.fillStyle = '#0b0a0e'; p.fillRect(x - 1, y - 1, s + 2, s + 2); p.fillStyle = '#5a3a22'; p.fillRect(x, y, s, s); p.fillStyle = '#3a2414'; p.fillRect(x, y, s, 1); p.fillRect(x, y, 1, s); pline(p, x, y, x + s - 1, y + s - 1, 1); }
  }
  // touffes d'herbe qui bougent au vent et s'écartent quand on passe
  for (let x = 3; x < W; x += 5 + (R() * 6 | 0)) { if (x > 148 && x < 236) continue; r.grass.push({ x, y: GROUND, h: 2 + (R() * 3 | 0), ph: R() * 6.28 }); }
  r.plats = [{ x1: 150, x2: 234, y: 172 }, { x1: 176, x2: 209, y: 145 }, { x1: FX - 6, x2: FX + 6, y: 111 },
    { x1: 99, x2: 126, y: 160 }, { x1: 259, x2: 286, y: 160 }, { x1: 100, x2: 125, y: 171 }, { x1: 260, x2: 285, y: 171 }, { x1: 128, x2: 140, y: 98 }, { x1: 244, x2: 256, y: 98 },
    { x1: 43, x2: 55, y: 172 }, { x1: 52, x2: 62, y: 160 }, { x1: 44, x2: 89, y: 124 },
    { x1: 268, x2: 296, y: 130 }, { x1: 304, x2: 342, y: 62 }];
  r.climbs = [{ x1: TX - 5, x2: TX + 5, y1: -6, y2: GROUND, kind: 'tour' }];
  r.seats = [106, 118, 266, 278].map(x => ({ x, y: GROUND, sitY: 171, front: true }));   // on s'assoit depuis le sol, sur la planche du banc
  r.fires.push(fire(347, 118, 1, true), fire(381, 118, 1, true));

  /* ---------- animations : eau, fanions, lucioles, feuilles ---------- */
  const FANIONS = ['#d8443c', '#f0c040', '#3aa8a0', '#8a5ac8', '#f0e6d0', '#e87aa0'];
  const GUIRLANDES = [[134, 92, 250, 92, 12, 0], [20, 70, 134, 92, 10, 2], [250, 92, 294, 82, 6, 4], [306, 70, 350, 58, 7, 1]];
  const guirlande = (c, [x1, y1, x2, y2, sag, seed]) => {
    const pt = u => { const s = 4 * u * (1 - u); return [x1 + (x2 - x1) * u, y1 + (y2 - y1) * u + s * (sag + Math.sin(time * 1.3 + seed) * .8)]; };
    const len = Math.hypot(x2 - x1, y2 - y1); c.fillStyle = '#3a2c20';
    for (let k = 0; k <= len; k++) { const [x, y] = pt(k / len); c.fillRect(Math.round(x), Math.round(y), 1, 1); }
    const n = Math.max(2, Math.floor(len / 8));
    for (let i = 1; i < n; i++) { const [x, y] = pt(i / n), sw = Math.sin(time * 2.4 + i * .9 + seed) * 1.3; c.fillStyle = FANIONS[(i + seed) % FANIONS.length];
      for (let row = 0; row < 6; row++) { const hw = Math.round((5 - row) / 2); c.fillRect(Math.round(x - hw + sw * row / 5), Math.round(y) + 1 + row, hw * 2 + 1, 1); } } };
  const luciole = i => { const bx = (i * 67.3) % W, by = 64 + (i * 41.7) % 112;
    return { x: bx + Math.sin(time * .4 * (1 + i % 3) + i) * 14, y: by + Math.sin(time * .55 + i * 1.7) * 8, a: Math.max(0, Math.sin(time * (1.1 + i % 4 * .3) + i * 2.1)) }; };
  globalThis.NOC_LUCIOLE = luciole;
  r.drops = [];
  r.update = dt => {
    for (const s of [178, 206]) if (Math.random() < dt * 30) r.drops.push({ x: s + (Math.random() - .5) * 2, y: 148, vx: (s < FX ? -1 : 1) * (6 + Math.random() * 6), vy: 4 });
    if (Math.random() < dt * 14) r.drops.push({ x: FX + (Math.random() - .5) * 2, y: 124, vx: (Math.random() - .5) * 18, vy: -30 - Math.random() * 15 });
    for (const d of r.drops) { d.vy += 180 * dt; d.x += d.vx * dt; d.y += d.vy * dt; }
    r.drops = r.drops.filter(d => d.y < 174);
    if (r.coin) { const c = r.coin; c.t += dt; c.x += c.vx * dt; c.y += c.vy * dt; c.vy += 260 * dt; if (c.y > 174) { r.coin = null; puff(c.x, 173, 8, '#9ad8ff', .6); if (SND.ctx) { noise(.25, { f: 1400, sweep: .4, q: 2, v: .1 }); tone(1800, .3, { type: 'sine', v: .05, slide: .6, wet: .8 }); } } }
  };
  r.dyn = c => {
    // eau du bassin, nénuphars
    for (let x = 153; x < 231; x++) { const s = Math.sin(x * .45 + time * 3) + Math.sin(x * .17 - time * 1.7); c.fillStyle = s > 1.1 ? '#bfe8ff' : s > .2 ? '#5aa0c8' : '#3a7aa8'; c.fillRect(x, 173, 1, 1); }
    for (let x = 179; x < 207; x++) { c.fillStyle = Math.sin(x * .6 + time * 4) > .5 ? '#bfe8ff' : '#5aa0c8'; c.fillRect(x, 146, 1, 1); }
    for (const x of [160, 221]) { c.fillStyle = '#3a7a40'; c.fillRect(x, 173, 4, 1); c.fillStyle = '#f08aa8'; c.fillRect(x + 1, 172, 1, 1); }
    for (const d of r.drops) { c.fillStyle = 'rgba(190,232,255,.85)'; c.fillRect(Math.round(d.x), Math.round(d.y), 1, 2); }
    if (r.coin) { c.fillStyle = Math.floor(r.coin.t * 12) % 2 ? '#ffe48a' : '#c9a24a'; c.fillRect(Math.round(r.coin.x), Math.round(r.coin.y), 2, 2); }
    // guirlandes de fanions
    for (const g of GUIRLANDES) guirlande(c, g);
    // feuilles qui tombent du chêne et des arbres de gauche
    for (let i = 0; i < 8; i++) { const sp = 9 + i % 3 * 3, y = ((time * sp + i * 43) % 210) - 20, x = (i < 3 ? 14 + i * 16 : 250 + (i - 3) * 22) + Math.sin(time * 1.2 + i) * 6 + y * .12;
      c.fillStyle = ['#3a6a48', '#6a8a3a', '#b08a3a', '#2e5a3c'][i % 4]; if (Math.sin(time * 3 + i) > 0) c.fillRect(Math.round(x), Math.round(y), 2, 1); else c.fillRect(Math.round(x), Math.round(y), 1, 2); }
    // lucioles
    for (let i = 0; i < 22; i++) { const l = luciole(i); if (l.a < .05) continue; c.fillStyle = `rgba(220,255,140,${l.a})`; c.fillRect(Math.round(l.x), Math.round(l.y), 1, 1); }
  };
  r.lights = () => {
    glow(FX, 160, 70, '120,200,255', .1 + .02 * Math.sin(time * 2)); glow(FX, 118, 22, '210,230,255', .2);
    glow(MX, MY, 64, '190,215,255', .1);
    for (const lx of [134, 250]) glow(lx, 104, 46, '255,190,110', .26 + .03 * Math.sin(time * 9 + lx));
    for (const [x, y] of [[338, 71], [272, 139]]) glow(x, y, 24, '255,190,90', .24 + .04 * Math.sin(time * 3 + x));
    glow(66, 145, 26, '255,210,160', .08);
    for (let i = 0; i < 22; i++) { const l = luciole(i); if (l.a > .5) glow(l.x, l.y, 6, '200,255,120', .25 * l.a); }
  };
  curRoom = r;   // on arrive toujours ici
  r.interacts = [
    { x: 66, x1: 50, x2: 82, y: GROUND, py: 112, label: 'Lire le tableau', run: () => openModal('bienvM') },
    { x: FX, x1: 156, x2: 228, y: GROUND, py: 100, get label() { return r.coin ? '…' : 'Faire un vœu'; }, run: () => {
      if (r.coin) return; r.coin = { x: player.x, y: player.y - 18, vx: (FX - player.x) * 1.4, vy: -150, t: 0 };
      if (SND.ctx) tone(2400, .08, { type: 'square', v: .03, lp: 3000 });
      const V = ['Ton vœu flotte un instant à la surface… puis disparaît.', 'La lune de pierre semble te sourire.', 'Une étoile filante passe. Coïncidence ?', 'Les poissons de la fontaine gardent le secret.', 'Plouf. Les vœux faits à minuit comptent double.', 'Une luciole se pose sur le bord du bassin, comme pour approuver.'];
      setTimeout(() => toast(V[Math.random() * V.length | 0]), 900); } },
  ];
}

/* ---------- fenêtre « Bienvenue » du tableau ---------- */
document.getElementById('view').insertAdjacentHTML('beforeend', `
  <div id="bienvM" class="modal"><div class="panel bienvP">
    <div class="shopHead"><h2>Bienvenue à Ossuary</h2><button class="x" id="bienvX">✕</button></div>
    <div class="bienv">
      <p>Tu es dans la <b>Clairière des Lucioles</b>, au cœur de la forêt. Installe-toi, discute, fais un vœu à la fontaine… Tout part d'ici :</p>
      <ul>
        <li><b>← À gauche</b> : la rue du <b>cinéma</b>. Les affiches annoncent les prochaines sorties ; derrière les portes, la salle de projection.</li>
        <li><b>→ À droite</b> : la route du <b>château</b>. Franchis sa grande porte pour atteindre la salle du trône : on dit qu'un portrait y cache un passage…</li>
        <li><b>↑ Le grand chêne</b> : grimpe tout en haut pour atteindre la <b>cime</b> et voir la forêt sous la lune.</li>
        <li><b>Plus bas</b> : les catacombes, en 3D. Cinq reliques y sont cachées chaque jour.</li>
      </ul>
      <p class="bienvT"><kbd>←</kbd><kbd>→</kbd> marcher · <kbd>Maj</kbd> courir · <kbd>Espace</kbd> sauter · <kbd>X</kbd> attaquer · <kbd>C</kbd> tomber · <kbd>↑</kbd> grimper · <kbd>E</kbd> interagir · <kbd>N</kbd> carte · <kbd>Entrée</kbd> parler</p>
      <p class="bienvT">Ta tenue et la boutique sont en haut de la page : <b>Profil</b> et <b>Boutique</b>.</p>
    </div>
  </div></div>`);
document.getElementById('bienvX').onclick = () => closeModal('bienvM');
document.getElementById('bienvM').addEventListener('mousedown', e => { if (e.target.id === 'bienvM') closeModal('bienvM'); });
