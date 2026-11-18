"use strict";
// « La Clairière des Cendres » (identifiant interne : remparts) : la place d'accueil, où chacun arrive en jouant.
// - Un ciel rouge sang, des ruines, et au centre la fontaine à la statue de lune, seule source de lumière claire.
// - À gauche : la rue du cinéma. À droite : la porte brisée qui mène à la salle du trône.
// - Le grand arbre mort (à droite) se grimpe : tout en haut, on change de salle et on arrive au Sommet (sommet.js).
// - Le tableau d'accueil (touche E) explique où aller ; on peut faire un vœu à la fontaine et s'asseoir sur les bancs.

{ const FX = 192, EX = 150, EY = -100, TX = 300, TO = 240, SY = 200;
  const r = ROOMS.remparts = { id: 'remparts', name: 'LA CLAIRIERE DES CENDRES', left: 'devanture', right: 'chateau', fires: [], grass: [], climbs: [],
    fogFar: null, fogNear: [178, 4, .16] };
  const B4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

  /* ---------- le ciel et le lointain, peints par deux fonctions : une fois pour la clairière, une fois pour la vision du sommet ---------- */
  // paintSky : dégradé rouge sang + éclipse (ex, ey) + rayon qui tombe jusqu'à l'horizon hz. y0 = ordonnée du monde du haut du canvas.
  const paintSky = (cw, ch, y0, ex, ey, hz) => { const [cv, s] = mk(cw, ch);
    const D = [-324, -234, -124, -44, 0, 92], C = [[20, 2, 6], [48, 4, 9], [98, 10, 14], [146, 24, 18], [206, 60, 28], [60, 10, 14]];
    const skyCol = wy => { const dl = wy - hz; let i = 0; while (i < D.length - 2 && dl > D[i + 1]) i++; const t = clamp((dl - D[i]) / (D[i + 1] - D[i]), 0, 1); return C[i].map((v, k) => v + (C[i + 1][k] - v) * t); };
    const img = s.createImageData(cw, ch), d = img.data, Q = 14;
    for (let y = 0; y < ch; y++) { const c = skyCol(y + y0);
      for (let x = 0; x < cw; x++) { const i = (y * cw + x) * 4, th = B4[(y & 3) * 4 + (x & 3)] / 16;
        for (let k = 0; k < 3; k++) d[i + k] = Math.min(255, Math.floor((c[k] + th * Q) / Q) * Q); d[i + 3] = 255; } }
    const cy0 = ey - y0, mix = (i, col, a) => { for (let k = 0; k < 3; k++) d[i + k] = d[i + k] * (1 - a) + col[k] * a; };
    for (let y = cy0 - 50; y <= cy0 + 50; y++) for (let x = ex - 50; x <= ex + 50; x++) { if (x < 0 || x >= cw || y < 0 || y >= ch) continue; const dd = Math.hypot(x - ex, y - cy0), i = (y * cw + x) * 4;
      if (dd <= 19.6) { d[i] = 4; d[i + 1] = 1; d[i + 2] = 2; }
      else if (dd < 48) { const a = dd < 22.5 ? 1 : Math.pow(1 - (dd - 22.5) / 25.5, 2.4), lv = Math.floor(a * 5 + B4[(y & 3) * 4 + (x & 3)] / 16) / 5;
        if (lv > 0) mix(i, dd < 22.5 ? [255, 200, 96] : dd < 25.5 ? [255, 142, 52] : [232, 88, 34], Math.min(1, lv)); } }
    for (let y = Math.max(0, cy0 + 22); y < Math.min(ch, hz - y0); y++) { const i = (y * cw + ex) * 4, t = (y - cy0) / (hz - y0 - cy0);
      mix(i, [255, 214, 120], .9); mix(i - 4, [255, 120, 40], (y & 1) ? .45 : .2); mix(i + 4, [255, 120, 40], (y & 1) ? .2 : .45); if (t > .7) { mix(i - 8, [255, 110, 40], .15); mix(i + 8, [255, 110, 40], .15); } }
    s.putImageData(img, 0, 0); return cv; };
  // paintLand : montagnes, vallée, rivière de braise, la silhouette qui attend. dy décale tout vers le bas.
  const paintLand = (f, dy) => { f.save(); f.translate(0, dy);
    const ridge = (base, a1, a2, st1, st2, col, rim, rimP) => { const n1 = makeNoise(st1, a1), n2 = makeNoise(st2, a2);
      for (let x = 0; x < W; x++) { const t = Math.round(base - n1(x) - n2(x)); f.fillStyle = col; f.fillRect(x, t, 1, H - t); if (R() < rimP) { f.fillStyle = rim; f.fillRect(x, t, 1, 1); } } };
    ridge(124, 36, 7, 44, 9, '#3e0a12', '#d0482a', .75);
    ridge(132, 26, 5, 34, 7, '#240710', '#8a2a1c', .5);
    for (const [x, w, h] of [[236, 9, 40], [262, 6, 24]]) { f.fillStyle = '#1a0509'; for (let i = 0; i < w; i++) { const t = 128 - h + Math.round(R() * 7 + (i > w / 2 ? 3 : 0)); f.fillRect(x + i, t, 1, 128 - t); } f.fillStyle = '#c8442a'; f.fillRect(x + 3, 128 - h + 14, 1, 2); }
    { const nf = makeNoise(60, 5); for (let x = 0; x < W; x++) { const t = Math.round(127 - nf(x)); f.fillStyle = '#1c060b'; f.fillRect(x, t, 1, H - t); f.fillStyle = '#4a1214'; f.fillRect(x, t, 1, 1); } }
    for (let k = 0; k < 320; k++) { f.fillStyle = k % 3 ? '#2a0a10' : '#0e0306'; f.fillRect(R() * W | 0, 130 + (R() * 56 | 0), 1 + (R() < .3), 1); }
    f.fillStyle = 'rgba(226,80,34,.22)'; f.fillRect(0, 121, W, 6);
    for (let y = 127; y < 190; y++) { const k = y - 127, cx = Math.round(EX - k * .35 + Math.sin(k * .12) * (4 + k * .2)), hw = 1 + Math.round(k * .12);
      f.fillStyle = '#2a0306'; f.fillRect(cx - hw - 1, y, hw * 2 + 3, 1); f.fillStyle = '#6e0a10'; f.fillRect(cx - hw, y, hw * 2 + 1, 1); f.fillStyle = '#a81420'; f.fillRect(cx - (hw >> 1), y, hw + 1, 1); if (k % 5 === 0) { f.fillStyle = '#e84a4a'; f.fillRect(cx, y, 1, 1); } }
    { const nl = makeNoise(14, 7);
      for (let x = 0; x < 140; x++) { const t = Math.round(96 + x * .46 + nl(x) - 3); f.fillStyle = '#0b0307'; f.fillRect(x, t, 1, H - t); f.fillStyle = R() < .6 ? '#6a2018' : '#2a0c10'; f.fillRect(x, t, 1, 1); }
      for (let x = 250; x < W; x++) { const t = Math.round(96 + (W - x) * .46 + nl(x) - 3); f.fillStyle = '#0b0307'; f.fillRect(x, t, 1, H - t); f.fillStyle = R() < .6 ? '#6a2018' : '#2a0c10'; f.fillRect(x, t, 1, 1); }
      for (let k = 0; k < 260; k++) { const x = R() * W | 0; if (x > 140 && x < 250) continue; f.fillStyle = '#1e0b10'; f.fillRect(x, 130 + (R() * 54 | 0), 2, 1); } }
    f.fillStyle = '#030102'; [1, 3, 3, 4, 4, 5, 5, 6].forEach((w, j) => f.fillRect(157 - (w >> 1), 134 + j, w, 1)); f.fillRect(156, 131, 2, 2);
    f.fillStyle = '#9a9aa8'; f.fillRect(163, 134, 1, 8); f.fillStyle = '#4a4a56'; f.fillRect(161, 136, 5, 1); f.restore(); };

  r.stars = [];
  r.sky = paintSky(W, H, 0, EX, EY, 124);
  globalThis.NOC_PAINT = { paintSky, paintLand };   // réutilisés par la cime (sommet.js)
  { const [fa, f] = mk(W, H); r.far = fa; paintLand(f, 0); }

  /* ---------- fond : ruines (colonnes, pans de mur) et la porte brisée à droite ---------- */
  const [wl, w] = mk(W, H); r.wall = wl;
  { const wallSeg = (x1, x2, top, bot, amp, step) => { const n = makeNoise(step, amp);
      for (let x = x1; x <= x2; x++) { const t = top + Math.round(n(x)); w.fillStyle = '#2a2023'; w.fillRect(x, t, 1, bot - t); w.fillStyle = '#54413f'; w.fillRect(x, t, 1, 1); w.fillStyle = '#382c2e'; w.fillRect(x, t + 1, 1, 1);
        for (let y = top + 7, row = 0; y < bot; y += 7, row++) { if (y > t + 1) { w.fillStyle = '#140c0f'; w.fillRect(x, y, 1, 1); if ((x + row * 5) % 10 === 0) w.fillRect(x, y, 1, 7); } } } };
    const column = (x, wd, top, bot, broken) => { for (let i = 0; i < wd; i++) { const t = top + (broken ? Math.round(R() * 7 - (i > wd / 2 ? 3 : 0)) : 0); w.fillStyle = i < 2 ? '#4a3a3c' : i >= wd - 2 ? '#171013' : '#2c2225'; w.fillRect(x + i, t, 1, bot - t); }
      w.fillStyle = '#1a1215'; for (let i = 3; i < wd - 2; i += 3) w.fillRect(x + i, top + 12, 1, bot - top - 12);
      w.fillStyle = '#3a2e30'; w.fillRect(x - 2, bot - 6, wd + 4, 6); w.fillStyle = '#524244'; w.fillRect(x - 2, bot - 6, wd + 4, 1);
      if (!broken) { w.fillStyle = '#3a2e30'; w.fillRect(x - 2, top - 4, wd + 4, 4); w.fillStyle = '#524244'; w.fillRect(x - 2, top - 4, wd + 4, 1); } };
    column(12, 9, 74, GROUND, true); column(34, 8, 112, GROUND, true);
    w.fillStyle = '#2c2225'; w.fillRect(8, 66, 22, 6); w.fillStyle = '#54413f'; w.fillRect(8, 66, 22, 1); w.fillStyle = '#171013'; w.fillRect(26, 66, 4, 6);
    // un tronçon de colonne tombé
    w.fillStyle = '#2c2225'; w.fillRect(46, 174, 18, 10); w.fillStyle = '#4a3a3c'; w.fillRect(46, 174, 18, 1); w.fillStyle = '#171013'; w.fillRect(46, 183, 18, 1); w.fillRect(54, 174, 1, 10);
    // bannière en lambeaux accrochée à la colonne
    for (const [dx, len, c] of [[0, 30, '#5c1018'], [3, 40, '#3e0a10'], [6, 24, '#5c1018']]) { w.fillStyle = c; w.fillRect(14 + dx, 76, 2, len); w.fillStyle = '#12040a'; w.fillRect(14 + dx, 76 + len - 2, 2, 1); }
    wallSeg(80, 128, 150, GROUND, 7, 9); wallSeg(256, 284, 154, GROUND, 6, 7);
    // la porte brisée (sortie à droite, vers le château)
    column(340, 14, 60, GROUND, true);
    w.fillStyle = '#2c2225'; w.fillRect(354, 62, 14, 9); w.fillStyle = '#54413f'; w.fillRect(354, 62, 14, 1); w.fillStyle = '#12090c'; w.fillRect(362, 62, 6, 9);
    w.fillStyle = '#05020a'; w.fillRect(354, 71, 30, GROUND - 71);
    for (let y = 71; y < GROUND; y += 2) { w.fillStyle = `rgba(110,24,20,${.28 * (1 - (y - 71) / 113)})`; w.fillRect(354, y, 30, 2); }
    w.fillStyle = '#2c2225'; w.fillRect(378, 30, 6, GROUND - 30); w.fillStyle = '#54413f'; w.fillRect(378, 30, 1, GROUND - 30);
    for (const sx of [347, 381]) { w.fillStyle = '#05020a'; w.fillRect(sx - 3, 122, 7, 2); w.fillRect(sx - 1, 124, 3, 5); w.fillStyle = '#4a4a56'; w.fillRect(sx - 3, 121, 7, 1); }
  }

  /* ---------- le grand arbre mort (tout en hauteur) : dessiné dans r.back, derrière les personnages ---------- */
  const [tcv, t] = mk(W, H + TO);
  { const Y = y => y + TO; const limb = (xa, xb, y, w2 = 4) => { t.fillStyle = '#120a0c'; pline(t, xa, Y(y + 1), xb, Y(y + 1), w2); t.fillStyle = '#050203'; pline(t, xa, Y(y + 3), xb, Y(y + 3), 1); t.fillStyle = '#5a1c16'; pline(t, xa, Y(y), xb, Y(y), 1); };
    // branches praticables
    for (const [x1, x2, y] of [[268, 296, 130], [304, 342, 62]]) { limb(x1, x2, y); const left = x2 < TX + 2; t.fillStyle = '#120a0c'; const tipx = left ? x1 : x2;
      tree(t, tipx, Y(y + 2), 9, left ? Math.PI * .85 : Math.PI * .15, 2, 2); if (y < -100) tree(t, tipx + (left ? 6 : -6), Y(y + 1), 14, left ? -Math.PI * .65 : -Math.PI * .35, 3, 2); }
    // tronc
    for (let y = 196; y > -150; y--) { const hw = Math.round(5 + 7 * (y + 150) / 346), cx = TX + Math.round(Math.sin(y * .04) * 2);
      for (let x = cx - hw; x <= cx + hw; x++) { const i = x - (cx - hw); t.fillStyle = i < 2 ? (y < 60 ? '#7a2a1a' : '#5a1c16') : x > cx + hw - 2 ? '#030102' : R() < .13 ? '#1e1013' : '#120a0c'; t.fillRect(x, Y(y), 1, 1); } }
    t.fillStyle = '#05020a'; for (const [x, y] of [[298, 150], [302, 96], [299, 20]]) { t.fillRect(x, Y(y), 3, 5); t.fillRect(x + 1, Y(y) - 1, 1, 7); }
    // lanternes rouges accrochées aux branches : elles guident la montée
    for (const [x, y] of [[338, 62], [272, 130]]) { t.fillStyle = '#05020a'; t.fillRect(x, Y(y + 4), 1, 5); t.fillRect(x - 2, Y(y + 9), 5, 7); t.fillStyle = '#e0502a'; t.fillRect(x - 1, Y(y + 10), 3, 5); t.fillStyle = '#ffc070'; t.fillRect(x, Y(y + 11), 1, 2); }
    // corbeaux
    for (const [x, y] of [[316, 62]]) { t.fillStyle = '#030102'; t.fillRect(x, Y(y - 4), 4, 3); t.fillRect(x + 4, Y(y - 5), 2, 2); t.fillRect(x - 3, Y(y - 3), 3, 1); t.fillStyle = '#7a5a3a'; t.fillRect(x + 6, Y(y - 4), 1, 1); t.fillStyle = '#030102'; t.fillRect(x + 1, Y(y - 1), 1, 1); t.fillRect(x + 3, Y(y - 1), 1, 1); }
  }
  r.back = c => c.drawImage(tcv, 0, -TO);

  /* ---------- premier plan : terre cendrée, pavés brisés, fontaine, bancs, braseros, tableau, panneaux ---------- */
  const [pl, p] = mk(W, H); r.play = pl;
  const sign = (x, y, text, dir) => { const tx = txt(text, '#e9e2cc', null), wd = tx.width + 8;
    const x0 = dir < 0 ? x - wd + 4 : x - 4; p.fillStyle = '#05060a'; p.fillRect(x0 - 1, y - 1, wd + 2, 11); p.fillStyle = '#4a2c1a'; p.fillRect(x0, y, wd, 9); p.fillStyle = '#6a4228'; p.fillRect(x0, y, wd, 1);
    p.drawImage(tx, x0 + (dir < 0 ? 5 : 2), y + 1); p.fillStyle = '#4a2c1a';
    if (dir < 0) { for (let i = 0; i < 5; i++) p.fillRect(x0 - 1 - i, y + i, 1, 9 - i * 2); } else if (dir > 0) for (let i = 0; i < 5; i++) p.fillRect(x0 + wd + i, y + i, 1, 9 - i * 2); };
  { // terre cendrée + pavés qui n'ont pas tous survécu
    p.fillStyle = '#150a0d'; p.fillRect(0, GROUND, W, H - GROUND);
    for (let k = 0; k < 520; k++) { p.fillStyle = ['#1c0f12', '#100609', '#241619'][k % 3]; p.fillRect(R() * W | 0, GROUND + 2 + (R() * 30 | 0), 2 + (R() * 3 | 0), 1); }
    for (let y = GROUND + 2; y < H; y += 4) { const row = (y - GROUND) / 4 | 0;
      for (let x = (row % 2) * 4; x < W; x += 8) { const d = Math.abs(x - FX); if (d > 130 || R() < .28) continue; p.fillStyle = ['#2a2226', '#32282c', '#241c20'][(x * 3 + y) % 3]; p.fillRect(x, y, 7, 3); p.fillStyle = '#3a2e32'; if (R() < .3) p.fillRect(x, y, 7, 1); } }
    for (let k = 0; k < 14; k++) { let cx = R() * W | 0, cy = GROUND + 4 + (R() * 22 | 0); p.fillStyle = '#080306'; for (let i = 0; i < 7; i++) { p.fillRect(cx, cy, 1, 1); cx += (R() * 3 | 0) - 1 + 1; cy += (R() * 2 | 0); } }
    p.fillStyle = '#3a2428'; p.fillRect(0, GROUND, W, 1); p.fillStyle = '#0a0407'; p.fillRect(0, GROUND + 1, W, 1);
    // des os et un crâne, ici et là
    for (const [x, y] of [[22, 197], [96, 205], [140, 200], [250, 203], [352, 199]]) { p.fillStyle = '#8a7a68'; p.fillRect(x, y, 5, 1); p.fillRect(x - 1, y - 1, 1, 1); p.fillRect(x + 5, y + 1, 1, 1); }
    p.fillStyle = '#9a8a78'; p.fillRect(176, 205, 5, 4); p.fillRect(177, 209, 3, 1); p.fillStyle = '#150a0d'; p.fillRect(177, 206, 1, 2); p.fillRect(179, 206, 1, 2);
    // fontaine : bassin, colonne, vasque, statue de lune (fissurée)
    p.fillStyle = '#0b0608'; p.fillRect(150, 171, 84, 13); p.fillStyle = '#5a4c50'; p.fillRect(151, 172, 82, 4); p.fillStyle = '#8a7a7e'; p.fillRect(151, 172, 82, 1);
    p.fillStyle = '#382c30'; p.fillRect(152, 176, 80, 8); for (let x = 156; x < 230; x += 9) { p.fillStyle = '#1e1418'; p.fillRect(x, 177, 1, 7); }
    p.fillStyle = '#0b0608'; for (const [x, y] of [[170, 173], [171, 174], [208, 172], [209, 173], [210, 174]]) p.fillRect(x, y, 1, 3);
    p.fillStyle = '#3e3236'; p.fillRect(FX - 4, 148, 9, 24); p.fillStyle = '#5a4c50'; p.fillRect(FX - 4, 148, 2, 24); p.fillStyle = '#1e1418'; p.fillRect(FX + 3, 148, 2, 24); p.fillRect(FX, 156, 1, 6); p.fillRect(FX + 1, 162, 1, 5);
    p.fillStyle = '#0b0608'; p.fillRect(176, 145, 33, 5); p.fillStyle = '#5a4c50'; p.fillRect(177, 145, 31, 3); p.fillStyle = '#8a7a7e'; p.fillRect(177, 145, 31, 1);
    for (let i = 0; i < 4; i++) { p.fillStyle = '#3e3236'; p.fillRect(180 + i, 148 + i, 25 - i * 2, 1); }
    p.globalCompositeOperation = 'destination-out'; p.fillRect(205, 145, 4, 2); p.globalCompositeOperation = 'source-over';
    p.fillStyle = '#5a4c50'; p.fillRect(FX - 2, 126, 5, 19); p.fillStyle = '#8a7a7e'; p.fillRect(FX - 2, 126, 1, 19);
    p.fillStyle = '#0b0608'; disc(p, FX, 118, 8); p.fillStyle = '#c8d4dc'; disc(p, FX, 118, 7); p.fillStyle = '#9aaab8'; disc(p, FX - 1, 119, 5);
    p.globalCompositeOperation = 'destination-out'; disc(p, FX + 3, 116, 6); p.globalCompositeOperation = 'source-over';
    p.fillStyle = '#4a5a68'; pline(p, FX - 4, 114, FX - 1, 121, 1);
    // bancs brisés
    for (const bx of [112, 272]) { p.fillStyle = '#0b0608'; p.fillRect(bx - 13, 170, 27, 4); p.fillStyle = '#4a3020'; p.fillRect(bx - 12, 171, 25, 2); p.fillStyle = '#6a4630'; p.fillRect(bx - 12, 171, 25, 1);
      p.fillStyle = '#0b0608'; p.fillRect(bx - 13, 160, 27, 3); p.fillStyle = '#3e281a'; p.fillRect(bx - 12, 161, 25, 1);
      p.globalCompositeOperation = 'destination-out'; p.fillRect(bx + (bx < FX ? 2 : -6), 160, 4, 3); p.globalCompositeOperation = 'source-over';
      p.fillStyle = '#1a1418'; for (const lx of [bx - 11, bx + 10]) { p.fillRect(lx, 160, 2, 24); } }
    // braseros
    for (const lx of [134, 250]) { p.fillStyle = '#100a0e'; p.fillRect(lx - 1, 110, 3, GROUND - 110); p.fillRect(lx - 3, GROUND - 6, 7, 6); p.fillStyle = '#3a2e32'; p.fillRect(lx - 1, 110, 1, GROUND - 110);
      p.fillStyle = '#100a0e'; p.fillRect(lx - 5, 98, 11, 2); p.fillRect(lx - 4, 100, 1, 9); p.fillRect(lx + 4, 100, 1, 9); p.fillRect(lx - 4, 108, 9, 2); p.fillRect(lx - 2, 95, 5, 3); p.fillRect(lx, 92, 1, 3);
      p.fillStyle = 'rgba(255,150,70,.5)'; p.fillRect(lx - 3, 100, 7, 8); r.fires.push(fire(lx, 105, 0)); }
    // tableau d'accueil
    { const bx = 66; p.fillStyle = '#2a1a10'; p.fillRect(bx - 21, 138, 3, 46); p.fillRect(bx + 19, 138, 3, 46);
      p.fillStyle = '#05060a'; p.fillRect(bx - 22, 128, 45, 34); p.fillStyle = '#4a2c1a'; p.fillRect(bx - 21, 129, 43, 32); p.fillStyle = '#6a4228'; p.fillRect(bx - 21, 129, 43, 1);
      p.fillStyle = '#2a180e'; p.fillRect(bx - 18, 136, 37, 22);
      for (const [x0, y0, ww, hh, c] of [[-16, 138, 12, 14, '#d8ceb4'], [-2, 137, 10, 9, '#c8b890'], [10, 139, 7, 12, '#d8ceb4'], [-1, 148, 9, 8, '#b8c0c0']]) {
        p.fillStyle = c; p.fillRect(bx + x0, y0, ww, hh); p.fillStyle = '#7a6a54'; for (let yy = y0 + 2; yy < y0 + hh - 1; yy += 2) p.fillRect(bx + x0 + 1, yy, ww - 3, 1); p.fillStyle = '#c9203a'; p.fillRect(bx + x0 + (ww >> 1), y0, 1, 1); }
      p.fillStyle = '#4a2c1a'; p.fillRect(bx - 23, 124, 47, 5); p.fillStyle = '#6a4228'; p.fillRect(bx - 23, 124, 47, 1);
      const tt = txt('BIENVENUE', '#e8c860', null); p.drawImage(tt, bx - (tt.width >> 1), 130); }
    // panneaux de direction (cinéma à gauche, trône à droite) et plaquette « SOMMET » clouée au tronc
    { p.fillStyle = '#2a1a10'; p.fillRect(23, 132, 2, 52); sign(24, 134, 'CINEMA', -1);
      p.fillStyle = '#2a1a10'; p.fillRect(331, 140, 2, 44); sign(332, 142, 'CHATEAU', 1);
      const wd = txt('SOMMET', '#fff', null).width + 8; sign(TX - (wd >> 1) + 4, 150, 'SOMMET', 0); p.fillStyle = '#e0502a'; p.fillRect(TX - 1, 144, 3, 1); p.fillRect(TX, 143, 1, 1); }
    // racines de l'arbre, épée plantée, pierres
    p.fillStyle = '#120a0c'; for (const [x1, y1, x2, y2] of [[292, 180, 272, 187], [308, 180, 330, 187], [296, 183, 284, 190], [304, 183, 316, 190]]) pline(p, x1, y1, x2, y2, 3);
    { const sx = 344; p.fillStyle = '#0a0508'; p.fillRect(sx - 6, 180, 14, 5); p.fillStyle = '#2a2226'; p.fillRect(sx - 5, 180, 12, 4); p.fillStyle = '#4a3a3c'; p.fillRect(sx - 5, 180, 12, 1);
      p.fillStyle = '#c8d0d8'; pline(p, sx, 182, sx + 2, 146, 1); p.fillStyle = '#7a828e'; pline(p, sx + 1, 182, sx + 3, 146, 1);
      p.fillStyle = '#2a2a34'; pline(p, sx - 5, 157, sx + 9, 159, 2); p.fillStyle = '#5a1620'; p.fillRect(sx + 3, 160, 2, 10); p.fillRect(sx + 6, 160, 1, 7); p.fillStyle = '#12040a'; p.fillRect(sx + 3, 169, 2, 1); }
    // caisses pour grimper à gauche
    for (const [x, y, s] of [[43, 172, 12], [52, 160, 10]]) { p.fillStyle = '#0b0a0e'; p.fillRect(x - 1, y - 1, s + 2, s + 2); p.fillStyle = '#4a2e1a'; p.fillRect(x, y, s, s); p.fillStyle = '#2e1c10'; p.fillRect(x, y, s, 1); p.fillRect(x, y, 1, s); pline(p, x, y, x + s - 1, y + s - 1, 1); }
  }
  r.plats = [{ x1: 150, x2: 234, y: 172 }, { x1: 176, x2: 209, y: 145 }, { x1: FX - 6, x2: FX + 6, y: 111 },
    { x1: 99, x2: 126, y: 160 }, { x1: 259, x2: 286, y: 160 }, { x1: 100, x2: 125, y: 171 }, { x1: 260, x2: 285, y: 171 }, { x1: 128, x2: 140, y: 98 }, { x1: 244, x2: 256, y: 98 },
    { x1: 43, x2: 55, y: 172 }, { x1: 52, x2: 62, y: 160 }, { x1: 44, x2: 89, y: 124 },
    { x1: 268, x2: 296, y: 130 }, { x1: 304, x2: 342, y: 62 }];
  r.climbs = [{ x1: TX - 5, x2: TX + 5, y1: -6, y2: GROUND, kind: 'tour' }];
  r.seats = [106, 118, 266, 278].map(x => ({ x, y: GROUND, sitY: 171, front: true }));   // on s'assoit depuis le sol, sur la planche du banc
  r.fires.push(fire(347, 118, 1, true), fire(381, 118, 1, true));

  /* ---------- animations : eau, cendres, étincelles du rayon ---------- */
  r.drops = [];
  r.update = dt => {
    for (const s of [178, 206]) if (Math.random() < dt * 30) r.drops.push({ x: s + (Math.random() - .5) * 2, y: 148, vx: (s < FX ? -1 : 1) * (6 + Math.random() * 6), vy: 4 });
    if (Math.random() < dt * 14) r.drops.push({ x: FX + (Math.random() - .5) * 2, y: 124, vx: (Math.random() - .5) * 18, vy: -30 - Math.random() * 15 });
    for (const d of r.drops) { d.vy += 180 * dt; d.x += d.vx * dt; d.y += d.vy * dt; }
    r.drops = r.drops.filter(d => d.y < 174);
    if (r.coin) { const c = r.coin; c.t += dt; c.x += c.vx * dt; c.y += c.vy * dt; c.vy += 260 * dt; if (c.y > 174) { r.coin = null; puff(c.x, 173, 8, '#9ad8ff', .6); if (SND.ctx) { noise(.25, { f: 1400, sweep: .4, q: 2, v: .1 }); tone(1800, .3, { type: 'sine', v: .05, slide: .6, wet: .8 }); } } }
  };
  r.dyn = c => {
    // eau du bassin
    for (let x = 153; x < 231; x++) { const s = Math.sin(x * .45 + time * 3) + Math.sin(x * .17 - time * 1.7); c.fillStyle = s > 1.1 ? '#bfe8ff' : s > .2 ? '#5aa0c8' : '#3a7aa8'; c.fillRect(x, 173, 1, 1); }
    for (let x = 179; x < 207; x++) { c.fillStyle = Math.sin(x * .6 + time * 4) > .5 ? '#bfe8ff' : '#5aa0c8'; c.fillRect(x, 146, 1, 1); }
    for (const d of r.drops) { c.fillStyle = 'rgba(190,232,255,.85)'; c.fillRect(Math.round(d.x), Math.round(d.y), 1, 2); }
    if (r.coin) { c.fillStyle = Math.floor(r.coin.t * 12) % 2 ? '#ffe48a' : '#c9a24a'; c.fillRect(Math.round(r.coin.x), Math.round(r.coin.y), 2, 2); }
    // étincelles qui descendent le long du rayon de l'éclipse
    for (let k = 0; k < 6; k++) { const y = ((time * 38 + k * 38) % 124); c.fillStyle = k % 2 ? '#ffe0a0' : '#ff9a48'; c.fillRect(EX, Math.round(y), 1, 2); }
    // cendres qui tombent, sur toute la hauteur
    for (let i = 0; i < 50; i++) { const x = ((i * 53.7 + time * (3 + i % 4) + Math.sin(time * .7 + i) * 7) % W + W) % W, y = ((i * 37.3 + time * (7 + i % 5 * 3)) % 230) - 10;
      c.fillStyle = i % 9 === 0 ? 'rgba(255,150,80,.75)' : 'rgba(200,170,170,.45)'; c.fillRect(Math.round(x), Math.round(y), 1 + (i % 4 === 0), 1); }
  };
  r.lights = () => {
    glow(FX, 160, 70, '120,200,255', .1 + .02 * Math.sin(time * 2)); glow(FX, 118, 22, '210,230,255', .2);
    glow(EX, 124, 70, '255,90,36', .1);
    for (const lx of [134, 250]) glow(lx, 104, 40, '255,170,90', .24 + .03 * Math.sin(time * 9 + lx));
    for (const [x, y] of [[338, 71], [272, 139]]) glow(x, y, 22, '255,90,40', .22 + .04 * Math.sin(time * 3 + x));
    glow(66, 145, 26, '255,200,150', .08);
  };
  curRoom = r;   // on arrive toujours ici
  r.interacts = [
    { x: 66, x1: 50, x2: 82, y: GROUND, py: 112, label: 'Lire le tableau', run: () => openModal('bienvM') },
    { x: FX, x1: 156, x2: 228, y: GROUND, py: 100, get label() { return r.coin ? '…' : 'Faire un vœu'; }, run: () => {
      if (r.coin) return; r.coin = { x: player.x, y: player.y - 18, vx: (FX - player.x) * 1.4, vy: -150, t: 0 };
      if (SND.ctx) tone(2400, .08, { type: 'square', v: .03, lp: 3000 });
      const V = ['Ton vœu flotte un instant à la surface… puis disparaît.', 'La lune de pierre semble te sourire.', 'Une étoile filante passe. Coïncidence ?', 'Les poissons de la fontaine gardent le secret.', 'Plouf. Les vœux faits à minuit comptent double.'];
      setTimeout(() => toast(V[Math.random() * V.length | 0]), 900); } },
  ];
}

/* ---------- fenêtre « Bienvenue » du tableau ---------- */
document.getElementById('view').insertAdjacentHTML('beforeend', `
  <div id="bienvM" class="modal"><div class="panel bienvP">
    <div class="shopHead"><h2>Bienvenue à Ossuary</h2><button class="x" id="bienvX">✕</button></div>
    <div class="bienv">
      <p>Tu es dans la <b>Clairière des Cendres</b>, sous un ciel rouge qui ne s'éteint jamais. Tout part d'ici :</p>
      <ul>
        <li><b>← À gauche</b> : la rue du <b>cinéma</b>. Les affiches annoncent les prochaines sorties ; derrière les portes, la salle de projection.</li>
        <li><b>→ À droite</b> : la route du <b>château</b>. Franchis sa grande porte pour atteindre la salle du trône : on dit qu'un portrait y cache un passage…</li>
        <li><b>↑ Le grand arbre mort</b> : grimpe tout en haut pour atteindre la <b>cime</b> et voir ce que le ciel cache.</li>
        <li><b>Plus bas</b> : les catacombes, en 3D. Cinq reliques y sont cachées chaque jour.</li>
      </ul>
      <p class="bienvT"><kbd>←</kbd><kbd>→</kbd> marcher · <kbd>Maj</kbd> courir · <kbd>Espace</kbd> sauter · <kbd>X</kbd> attaquer · <kbd>C</kbd> tomber · <kbd>↑</kbd> grimper · <kbd>E</kbd> interagir · <kbd>N</kbd> carte · <kbd>Entrée</kbd> parler</p>
      <p class="bienvT">Ta tenue et la boutique sont dans le <b>Menu</b> (la petite porte, en bas à droite).</p>
    </div>
  </div></div>`);
document.getElementById('bienvX').onclick = () => closeModal('bienvM');
document.getElementById('bienvM').addEventListener('mousedown', e => { if (e.target.id === 'bienvM') closeModal('bienvM'); });
