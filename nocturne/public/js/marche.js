"use strict";
// « Le Marché » (à gauche du cinéma) et « Le Supermarché » (on y entre par la porte vitrée).
// - Dehors : une petite supérette en bois à l'orée de la forêt, vitrines allumées, caddies alignés.
// - Dedans : le magasin en VRAIE 3D (même principe que les catacombes, mais éclairé aux néons) : allées, rayons, caisses.
//   Devant un rayon, E ouvre la liste des produits ; à la caisse, E récapitule le caddie et l'envoie au drive (voir courses.js).
// - Le plan du magasin est la grille MAP ci-dessous : une lettre par case (légende dans CODE).
// - Les produits, leurs prix indicatifs et le nom du drive sont dans config/supermarche.json.

/* ================= DEHORS : LE MARCHÉ ================= */
{ const DX1 = 178, DX2 = 206, MX = 330, MY = 34, BX1 = 108, BX2 = 276, TOP = 96;
  const r = ROOMS.marche = { id: 'marche', name: 'LE MARCHE', right: 'cinema', fires: [], grass: [], climbs: [], fogFar: null, fogNear: [178, 4, .12], far: null };
  const [sk, s] = mk(W, H); r.sky = sk; r.stars = makeStars(MX, MY);
  s.drawImage(NOC_PAINT.paintSky(W, H, 0, MX, MY, 140), 0, 0); NOC_PAINT.paintLand(s, 30);

  /* ---------- la façade : toit d'ardoise, planches, enseigne, auvent rayé, vitrines allumées ---------- */
  const [wl, w] = mk(W, H); r.wall = wl;
  { for (const [x, y, rr, n] of [[20, 44, 30, 16], [56, 14, 22, 10], [364, 40, 30, 16], [336, 10, 22, 10]]) NOC_PAINT.feuillage(w, x, y, rr, n);
    for (const [x0, wd] of [[14, 11], [360, 11]]) for (let i = 0; i < wd; i++) for (let y = 50; y < GROUND; y++) { w.fillStyle = i < 2 ? '#6a4a30' : i >= wd - 2 ? '#140d08' : (i * 7 + (y >> 2)) % 9 === 0 ? '#2a1c12' : '#3a2818'; w.fillRect(x0 + i, y, 1, 1); }
    // toit
    const ax = (BX1 + BX2) >> 1, ay = TOP - 34, hw0 = (BX2 - BX1) / 2 + 12;
    for (let y = ay; y <= TOP; y++) { const hw = Math.round((y - ay) / (TOP - ay) * hw0); w.fillStyle = (y - ay) % 4 === 3 ? '#1a1420' : '#2c2434'; w.fillRect(ax - hw, y, hw * 2 + 1, 1);
      w.fillStyle = '#4a3e52'; w.fillRect(ax - hw, y, 1, 1); w.fillStyle = '#120e16'; w.fillRect(ax + hw, y, 1, 1); }
    w.fillStyle = '#4a3e52'; w.fillRect(ax - hw0, TOP, hw0 * 2 + 1, 2); w.fillStyle = '#120e16'; w.fillRect(ax - hw0, TOP + 2, hw0 * 2 + 1, 1);
    w.fillStyle = '#3a2818'; w.fillRect(ax + 30, ay + 6, 8, 16); w.fillStyle = '#5a4030'; w.fillRect(ax + 29, ay + 5, 10, 2);   // cheminée
    // planches
    for (let x = BX1; x < BX2; x++) for (let y = TOP + 3; y < GROUND; y++) { const k = (x - BX1) % 6; w.fillStyle = k === 0 ? '#3a2416' : k === 1 ? '#8a5a36' : ((x * 13 + (y >> 3) * 7) % 11 === 0 ? '#5a3a22' : '#6e4628'); w.fillRect(x, y, 1, 1); }
    // enseigne
    w.fillStyle = '#05030a'; w.fillRect(140, TOP + 5, 105, 20); w.fillStyle = '#c9a24a'; w.fillRect(141, TOP + 6, 103, 18); w.fillStyle = '#1e4a32'; w.fillRect(143, TOP + 8, 99, 14);
    { const t = txt('SUPERMARCHE', '#f6ecc8', '#0c2418'); w.drawImage(t, 0, 0, t.width, t.height, 192 - t.width, TOP + 8, t.width * 2, t.height * 2); }
    // auvent rayé (festonné)
    for (let x = BX1 + 4; x < BX2 - 4; x++) { const band = ((x - BX1 - 4) / 7 | 0) % 2, h = 9 + ((x - BX1 - 4) % 7 === 3 ? 1 : 0) - (((x - BX1 - 4) % 7 === 0) ? 1 : 0);
      w.fillStyle = band ? '#e8dcc0' : '#2e7a4a'; w.fillRect(x, TOP + 28, 1, h); w.fillStyle = band ? '#c8bc9e' : '#1e5a34'; w.fillRect(x, TOP + 28 + h - 1, 1, 1); }
    w.fillStyle = '#05030a'; w.fillRect(BX1 + 4, TOP + 27, BX2 - BX1 - 8, 1);
    // vitrines : rayonnages et produits vus de dehors
    for (const [x1, x2] of [[118, 170], [214, 266]]) { const y1 = TOP + 42, y2 = GROUND - 14;
      w.fillStyle = '#2a1a10'; w.fillRect(x1 - 2, y1 - 2, x2 - x1 + 4, y2 - y1 + 4);
      for (let y = y1; y < y2; y++) { w.fillStyle = y < y1 + 3 ? '#fff4c8' : '#f2d690'; w.fillRect(x1, y, x2 - x1, 1); }
      for (const sy of [y1 + 12, y1 + 22, y1 + 32]) { w.fillStyle = '#b89858'; w.fillRect(x1 + 2, sy, x2 - x1 - 4, 1);
        for (let x = x1 + 3; x < x2 - 4; x += 3 + (R() * 2 | 0)) { const h = 3 + (R() * 5 | 0); w.fillStyle = ['#c0303a', '#3a7ac8', '#e8a030', '#4a9a4a', '#8a4aa8', '#e8e4d8'][R() * 6 | 0]; w.fillRect(x, sy - h, 2, h); } }
      w.fillStyle = 'rgba(255,255,255,.35)'; for (let k = 0; k < 10; k++) w.fillRect(x1 + 4 + k, y1 + 2 + k, 1, 1);   // reflet
      w.fillStyle = '#2a1a10'; w.fillRect((x1 + x2) >> 1, y1, 1, y2 - y1);
      w.fillStyle = '#4e3220'; w.fillRect(x1 - 4, y2 + 2, x2 - x1 + 8, 3); w.fillStyle = '#8a5a36'; w.fillRect(x1 - 4, y2 + 2, x2 - x1 + 8, 1); }
    { const t = txt('OUVERT', '#7af0a0', '#05030a'); w.drawImage(t, 124, TOP + 45); }
    // encadrement de la porte vitrée
    w.fillStyle = '#05030a'; w.fillRect(DX1 - 4, TOP + 36, DX2 - DX1 + 8, GROUND - TOP - 36); w.fillStyle = '#8a9098'; w.fillRect(DX1 - 3, TOP + 37, DX2 - DX1 + 6, GROUND - TOP - 37);
    w.fillStyle = '#c8ccd4'; w.fillRect(DX1 - 3, TOP + 37, DX2 - DX1 + 6, 1); w.fillRect(DX1 - 3, TOP + 37, 1, GROUND - TOP - 37);
  }

  /* ---------- devant : herbe, parvis en dalles, caddies alignés, lampadaire, ardoise ---------- */
  const [pl, p] = mk(W, H); r.play = pl;
  const CARTS = [62, 72, 82];
  { p.fillStyle = '#122016'; p.fillRect(0, GROUND, W, H - GROUND);
    for (let k = 0; k < 480; k++) { p.fillStyle = ['#18301c', '#0c160f', '#1e3622'][k % 3]; p.fillRect(R() * W | 0, GROUND + 2 + (R() * 30 | 0), 2 + (R() * 3 | 0), 1); }
    for (let y = GROUND + 2; y < H; y += 5) { const row = (y - GROUND) / 5 | 0; for (let x = 100 + (row % 2) * 6; x < 286; x += 12) { p.fillStyle = ['#4a4a52', '#55555e', '#3e3e46'][(x + y) % 3]; p.fillRect(x, y, 11, 4); p.fillStyle = '#6a6a74'; p.fillRect(x, y, 11, 1); } }
    p.fillStyle = '#3a6a3c'; p.fillRect(0, GROUND, 100, 1); p.fillRect(286, GROUND, W - 286, 1); p.fillStyle = '#6a6a74'; p.fillRect(100, GROUND, 186, 1); p.fillStyle = '#0a140c'; p.fillRect(0, GROUND + 1, W, 1);
    for (let x = 0; x < W; x += 2) { const h = R() * 3 | 0; if (h && (x < 98 || x > 288)) { p.fillStyle = R() < .5 ? '#2e5a32' : '#4a8a4a'; p.fillRect(x, GROUND - h, 1, h); } }
    // jardinières sous les vitrines
    for (const [x1, x2] of [[114, 174], [210, 270]]) { p.fillStyle = '#05030a'; p.fillRect(x1, GROUND - 7, x2 - x1, 7); p.fillStyle = '#5a3a22'; p.fillRect(x1 + 1, GROUND - 6, x2 - x1 - 2, 6); p.fillStyle = '#8a5a36'; p.fillRect(x1 + 1, GROUND - 6, x2 - x1 - 2, 1);
      for (let x = x1 + 3; x < x2 - 2; x += 4) { p.fillStyle = '#2e5a32'; p.fillRect(x, GROUND - 10, 1, 4); p.fillStyle = ['#f08aa8', '#f0d060', '#e8e4d0', '#9ab8f0'][(x >> 2) % 4]; p.fillRect(x - 1, GROUND - 11, 3, 1); p.fillRect(x, GROUND - 12, 1, 3); } }
    // les caddies, emboîtés les uns dans les autres
    for (const cx of CARTS) { const y = GROUND - 15;
      p.fillStyle = '#05030a'; p.fillRect(cx - 1, y - 1, 16, 10); p.fillStyle = '#9aa0a8'; for (let i = 0; i < 14; i += 2) p.fillRect(cx + i, y, 1, 8); for (let j = 0; j < 8; j += 2) p.fillRect(cx, y + j, 14, 1);
      p.fillStyle = '#c8ccd4'; p.fillRect(cx, y, 14, 1); p.fillStyle = '#c0303a'; p.fillRect(cx + 13, y - 3, 4, 2); p.fillStyle = '#6a6e76'; p.fillRect(cx + 14, y - 1, 1, 2);
      p.fillStyle = '#6a6e76'; p.fillRect(cx + 2, y + 8, 1, 5); p.fillRect(cx + 11, y + 8, 1, 5); p.fillRect(cx + 1, y + 12, 12, 1);
      p.fillStyle = '#05030a'; p.fillRect(cx + 1, GROUND - 2, 3, 2); p.fillRect(cx + 10, GROUND - 2, 3, 2); }
    // lampadaire
    p.fillStyle = '#05030a'; p.fillRect(305, 118, 4, GROUND - 118); p.fillStyle = '#2a2e36'; p.fillRect(306, 118, 2, GROUND - 118); p.fillRect(302, GROUND - 4, 10, 4);
    p.fillStyle = '#05030a'; p.fillRect(299, 108, 16, 11); p.fillStyle = '#ffe8a8'; p.fillRect(301, 110, 12, 7); p.fillStyle = '#2a2e36'; p.fillRect(298, 106, 18, 3); p.fillRect(306, 102, 2, 4);
    // l'ardoise
    p.fillStyle = '#05030a'; p.fillRect(326, 150, 22, 30); p.fillStyle = '#5a3a22'; p.fillRect(327, 151, 20, 28); p.fillStyle = '#1e2a24'; p.fillRect(329, 153, 16, 16);
    p.fillStyle = '#e8e4d8'; for (const [a, b, c2] of [[331, 156, 9], [331, 159, 12], [331, 162, 7], [331, 165, 10]]) p.fillRect(a, b, c2, 1);
    p.fillStyle = '#5a3a22'; p.fillRect(328, 179, 2, 5); p.fillRect(344, 179, 2, 5);
  }
  const door = { x1: DX1, x2: DX2, spring: TOP + 40, bottom: GROUND, rr: 2, floor: GROUND, label: 'Entrer dans le supermarché', to: 'supermarche', toX: 192, open: 0, near: 0, col: '255,236,170', col2: '255,252,230' };
  r.portals = [door]; r.plats = []; r.seats = [];
  r.critters = [makeMoths('marche', [[307, 112]])];
  r.update = () => { };
  const BULBS = []; { const ax = (BX1 + BX2) >> 1, ay = TOP - 34, hw0 = (BX2 - BX1) / 2 + 12; for (let i = 0; i <= 16; i++) { const t = i / 16, side = t < .5 ? -1 : 1, k = side < 0 ? t * 2 : (1 - t) * 2; BULBS.push([Math.round(ax + side * hw0 * (1 - k)), Math.round(ay + (TOP - ay) * (1 - k)) + 2]); } }
  r.dyn = c => { drawPortal(c, door);
    BULBS.forEach(([x, y], i) => { const on = Math.sin(time * 2.2 + i * 1.3) > -.6; c.fillStyle = on ? ['#ffd890', '#f08aa8', '#9af0c0', '#9ab8f0'][i % 4] : '#4a3e30'; c.fillRect(x, y, 2, 2); }); };
  r.lights = () => { portalGlow(door);
    glow(144, GROUND - 34, 52, '255,220,150', .16); glow(240, GROUND - 34, 52, '255,220,150', .16); glow(192, TOP + 15, 56, '120,230,170', .08);
    glow(307, 114, 46, '255,220,150', .2 + .02 * Math.sin(time * 7)); glow(307, 114, 8, '255,240,200', .4);
    BULBS.forEach(([x, y], i) => { if (Math.sin(time * 2.2 + i * 1.3) > -.6) glow(x + 1, y + 1, 7, '255,220,160', .22); }); };
  r.interacts = [
    { x: 76, x1: 58, x2: 98, y: GROUND, py: GROUND - 34, label: 'Prendre un caddie', run: () => { sfx.click(); toast('Caddie récupéré ! Il te suit dans les rayons : <b>E</b> devant un rayon pour choisir tes produits.'); } },
    { x: 337, x1: 324, x2: 350, y: GROUND, py: 136, label: "Lire l'ardoise", run: () => toast(`« Fais tes courses ici, passe en caisse… et ton panier part au drive <b>${esc(COURSES.magasin)}</b>. »`) },
  ];
  ROOMS.cinema.left = 'marche';
}

/* ================= DEDANS : LE SUPERMARCHÉ EN 3D ================= */
{ // Le plan, vu de dessus (y = 0 au fond du magasin). Une lettre par case :
  //   . sol   # mur carrelé   D porte de sortie   K caisse   X étal (palette d'eau, puis étal de fruits)
  //   F fruits & légumes   R crèmerie (frigos)   V viandes & poissons (frigos)   P pain
  //   e épicerie salée   s épicerie sucrée   b boissons   m hygiène & maison   g surgelés
  const MAP = [
    '#RRRRRRRRRVVVVVVVV#',
    'F.................P',
    'F.................P',
    'F..e..s..b..m..g..P',
    'F..e..s..b..m..g..P',
    'F..e..s..b..m..g..P',
    'F..e..s..b..m..g..P',
    'F..e..s..b..m..g..P',
    'F..e..s..b..m..g..P',
    'F..e..s..b..m..g..P',
    'F..e..s..b..m..g..P',
    'F..e..s..b..m..g..P',
    'F.................P',
    'F.................P',
    '#.K..K.....K..K...#',
    '#.................#',
    '#...X.......X.....#',
    '########D##########'];
  const CODE = { '.': 0, '#': 1, D: 2, F: 3, R: 4, V: 5, P: 6, e: 7, s: 8, b: 9, m: 10, g: 11, K: 20, X: 21 };
  const RAYON = { 3: 'fruits', 4: 'frais', 5: 'viandes', 6: 'pain', 7: 'epicerie', 8: 'sucre', 9: 'boissons', 10: 'maison', 11: 'surgeles' };
  const LBL = { 3: 'FRUITS', 4: 'FRAIS', 5: 'VIANDES', 6: 'PAIN', 7: 'EPICERIE', 8: 'DOUCEURS', 9: 'BOISSONS', 10: 'MAISON', 11: 'SURGELES' };
  const COL = { 3: '#3a9a4a', 4: '#3a7ac8', 5: '#c0303a', 6: '#c88a2a', 7: '#d0602a', 8: '#c84a8a', 9: '#2a9ab0', 10: '#7a4ac0', 11: '#5ab0e0' };
  const SW = MAP[0].length, SH = MAP.length, SPEED = 2.6, TURN = 2.4, FS = 256, PL = .75;
  const smap = new Uint8Array(SW * SH); MAP.forEach((row, y) => [...row].forEach((ch, x) => { smap[y * SW + x] = CODE[ch] ?? 1; }));
  const cell = (x, y) => x < 0 || y < 0 || x >= SW || y >= SH ? 1 : smap[y * SW + x];
  const solid = (x, y) => cell(Math.floor(x), Math.floor(y)) !== 0;
  const CAISSES = []; for (let i = 0; i < SW * SH; i++) if (smap[i] === 20) CAISSES.push({ x: i % SW + .5, y: (i / SW | 0) + .5, n: CAISSES.length + 1 });
  // les étals (cases X), dans l'ordre de lecture du plan : chacun ouvre son rayon
  const ETALS = []; { const kinds = [['eau', 'boissons'], ['fruits', 'fruits']]; for (let i = 0; i < SW * SH; i++) if (smap[i] === 21) { const [kind, rayon] = kinds[ETALS.length % kinds.length]; ETALS.push({ x: i % SW + .5, y: (i / SW | 0) + .5, kind, rayon }); } }
  const DOOR = { x: MAP[SH - 1].indexOf('D') + .5, y: SH - 1 };
  const START = { x: DOOR.x, y: SH - 1.7, a: -Math.PI / 2 };
  const S = { x: START.x, y: START.y, a: START.a, v: 0, va: 0, bob: 0, stepD: 0, hint: false, cible: null };

  /* ---------- textures 32×32 (générées) ---------- */
  let seed = 4242; const T = fn => { const [c, x] = mk(32, 32); fn(x, rng(seed++)); return x.getImageData(0, 0, 32, 32).data; };
  const pick = (r, a) => a[r() * a.length | 0];
  const PAL = { 3: ['#c0303a', '#e8a030', '#f0d040', '#4a9a3a', '#8ac04a', '#e86a2a'], 4: ['#f2f0ea', '#e8e4d0', '#3a7ac8', '#f0d040', '#c8e0f0'], 5: ['#c0404a', '#e07a7a', '#a02a34', '#f0a090', '#e8e4d0'],
    6: ['#d8a050', '#c88a3a', '#e8c070', '#a06a2a'], 7: ['#d0602a', '#e8c040', '#c0303a', '#3a7a3a', '#e8e4d8', '#6a4a2a'], 8: ['#c84a8a', '#f0d040', '#e8e4d8', '#6a3a1a', '#3a7ac8', '#e06a2a'],
    9: ['#3a9ad0', '#c0303a', '#e8a030', '#4aa04a', '#e8e4d8', '#6a2a3a'], 10: ['#7a4ac0', '#3a9ad0', '#f2f0ea', '#4ab0a0', '#e85a8a', '#f0d040'], 11: ['#5ab0e0', '#e8e4d8', '#c0303a', '#3a7ac8', '#f0d040'] };
  const bandeau = (x, t, label) => { x.fillStyle = COL[t]; x.fillRect(0, 0, 32, 6); x.fillStyle = 'rgba(255,255,255,.3)'; x.fillRect(0, 0, 32, 1); x.fillStyle = 'rgba(0,0,0,.25)'; x.fillRect(0, 5, 32, 1);
    if (label) { const s2 = txt(LBL[t], '#ffffff', null), wd = s2.width - 2; x.drawImage(s2, Math.round((32 - wd) / 2) - 1, 0); } };
  function rayonTex(t, label) { return T((x, r) => {
    const frigo = t === 4 || t === 5 || t === 11;
    x.fillStyle = frigo ? '#c8dcea' : '#4a505c'; x.fillRect(0, 6, 32, 26); bandeau(x, t, label);
    for (const [y0, y1] of [[7, 13], [14, 20], [21, 27], [28, 31]]) {
      if (t === 3) { x.fillStyle = '#7a5230'; x.fillRect(0, y1 - 2, 32, 2); x.fillStyle = '#9a6a40'; x.fillRect(0, y1 - 2, 32, 1);   // cagettes de fruits
        for (let k = 0; k < 18; k++) { const fx = r() * 31 | 0, fy = y0 + (r() * (y1 - y0 - 3) | 0); x.fillStyle = pick(r, PAL[t]); x.fillRect(fx, fy + 1, 2, 2); x.fillStyle = 'rgba(255,255,255,.4)'; x.fillRect(fx, fy + 1, 1, 1); } }
      else for (let px0 = 1; px0 < 31;) { const bottle = t === 9 && r() < .7, wd = bottle ? 2 : 2 + (r() * 3 | 0), h = Math.min(y1 - y0, bottle ? 5 + (r() * 2 | 0) : 3 + (r() * (y1 - y0 - 2) | 0));
        const col = pick(r, PAL[t]); x.fillStyle = col; x.fillRect(px0, y1 - h, Math.min(wd, 31 - px0), h);
        x.fillStyle = 'rgba(255,255,255,.35)'; x.fillRect(px0, y1 - h, 1, h); if (bottle) { x.fillStyle = shade(col, .55); x.fillRect(px0, y1 - h - 1, 1, 1); }
        else if (h > 3) { x.fillStyle = 'rgba(255,255,255,.7)'; x.fillRect(px0 + 1, y1 - h + 2, 1, 1); }
        px0 += wd + (r() < .2 ? 1 : 0); }
      x.fillStyle = '#d8dce2'; x.fillRect(0, y1, 32, 1); }
    // étiquettes de prix sous les tablettes
    x.fillStyle = '#f6f0a0'; for (const y of [13, 20, 27]) for (let k = 2; k < 30; k += 9) x.fillRect(k, y, 3, 1);
    if (frigo) { x.fillStyle = 'rgba(170,215,255,.28)'; x.fillRect(0, 6, 32, 26); x.fillStyle = '#aab4c0'; x.fillRect(0, 6, 1, 26); x.fillRect(31, 6, 1, 26); x.fillRect(15, 6, 1, 26);
      x.fillStyle = '#e8eef4'; x.fillRect(13, 14, 1, 8); x.fillRect(17, 14, 1, 8); x.fillStyle = 'rgba(255,255,255,.5)'; for (let k = 0; k < 6; k++) { x.fillRect(3 + k, 8 + k * 2, 1, 2); x.fillRect(19 + k, 8 + k * 2, 1, 2); } }
    else { x.fillStyle = '#2e333c'; x.fillRect(0, 6, 1, 26); x.fillRect(31, 6, 1, 26); } }); }
  function boutTex(t) { return T((x, r) => {   // tête de gondole : grande affiche PROMO + produits en pile
    x.fillStyle = '#4a505c'; x.fillRect(0, 6, 32, 26); bandeau(x, t, true);
    x.fillStyle = '#ffd23a'; x.fillRect(3, 8, 26, 10); x.fillStyle = '#e8a020'; x.fillRect(3, 17, 26, 1);
    const p2 = txt('PROMO', '#c0202a', null); x.drawImage(p2, 6, 8); const p3 = txt('-30%', '#14101c', null); x.drawImage(p3, 9, 12);
    for (let k = 0; k < 4; k++) for (let i = 0; i < 6; i++) { const col = pick(r, PAL[t]); x.fillStyle = col; x.fillRect(2 + i * 5, 20 + k * 3, 4, 2); x.fillStyle = 'rgba(255,255,255,.35)'; x.fillRect(2 + i * 5, 20 + k * 3, 4, 1); }
    x.fillStyle = '#2e333c'; x.fillRect(0, 6, 1, 26); x.fillRect(31, 6, 1, 26); }); }
  const TWALL = T((x, r) => { for (let y = 0; y < 32; y++) for (let i = 0; i < 32; i++) { x.fillStyle = (i % 8 === 0 || y % 8 === 0) ? '#b8b4aa' : `rgb(${226 + (r() * 8 | 0)},${222 + (r() * 8 | 0)},${212 + (r() * 6 | 0)})`; x.fillRect(i, y, 1, 1); }
    x.fillStyle = '#2e8a4a'; x.fillRect(0, 18, 32, 4); x.fillStyle = '#5ac07a'; x.fillRect(0, 18, 32, 1); });
  const TDOOR = T(x => { x.fillStyle = '#8a9098'; x.fillRect(0, 0, 32, 32); x.fillStyle = '#2e8a4a'; x.fillRect(0, 0, 32, 6); const s2 = txt('SORTIE', '#ffffff', null); x.drawImage(s2, 4, 0);
    for (let y = 7; y < 31; y++) { const k = (y - 7) / 24; x.fillStyle = `rgb(${150 + k * 40 | 0},${200 + k * 30 | 0},${226 + k * 20 | 0})`; x.fillRect(2, y, 13, 1); x.fillRect(17, y, 13, 1); }
    x.fillStyle = '#5a6068'; x.fillRect(15, 6, 2, 26); x.fillStyle = 'rgba(255,255,255,.55)'; for (let k = 0; k < 8; k++) { x.fillRect(4 + k, 10 + k, 1, 1); x.fillRect(19 + k, 10 + k, 1, 1); } });
  const SHELF = {}, SHELF_L = {}, END = {};
  for (let t = 3; t <= 11; t++) { SHELF[t] = rayonTex(t, false); SHELF_L[t] = rayonTex(t, true); if (t >= 7) END[t] = boutTex(t); }
  const TFLOOR = T((x, r) => { for (let y = 0; y < 32; y++) for (let i = 0; i < 32; i++) { const c = ((i >> 4) + (y >> 4)) % 2, v = (c ? 214 : 200) + (r() * 6 | 0); x.fillStyle = (i % 16 === 0 || y % 16 === 0) ? '#a8a296' : `rgb(${v},${v - 4},${v - 12})`; x.fillRect(i, y, 1, 1); } });
  const TCEIL = T(x => { x.fillStyle = '#dcdcd8'; x.fillRect(0, 0, 32, 32); x.fillStyle = '#bcbcb8'; x.fillRect(0, 0, 32, 1); x.fillRect(0, 0, 1, 32); x.fillRect(16, 0, 1, 32); x.fillRect(0, 16, 32, 1);
    x.fillStyle = '#ffffff'; x.fillRect(4, 6, 24, 3); x.fillStyle = '#f0f0f0'; x.fillRect(4, 5, 24, 1); x.fillRect(4, 9, 24, 1); });
  const texFor = (t, side, mx, my) => t >= 7 && t <= 11 ? (side ? END[t] : (my % 3 === 0 ? SHELF_L[t] : SHELF[t])) : t >= 3 && t <= 6 ? ((mx + my) % 3 === 0 ? SHELF_L[t] : SHELF[t]) : t === 2 ? TDOOR : TWALL;

  /* ---------- sprites : caisses (avec leur numéro lumineux), panneaux PROMO suspendus ---------- */
  const CAISSE_SPR = [1, 2, 3, 4, 5, 6].map(n => { const [c, x] = mk(28, 26);
    x.fillStyle = '#5a5f68'; x.fillRect(4, 6, 1, 6); x.fillStyle = '#05030a'; x.fillRect(0, 0, 9, 7); x.fillStyle = '#2e8a4a'; x.fillRect(1, 1, 7, 5); x.drawImage(txt(String(n), '#ffffff', null), 2, 0);
    x.fillStyle = '#05030a'; x.fillRect(0, 11, 28, 15); x.fillStyle = '#e8e6e0'; x.fillRect(1, 12, 26, 13); x.fillStyle = '#2e8a4a'; x.fillRect(1, 18, 26, 2); x.fillStyle = '#b8b6b0'; x.fillRect(1, 23, 26, 2);
    x.fillStyle = '#1a1a1e'; x.fillRect(1, 12, 17, 2); x.fillStyle = '#3a3a40'; for (let i = 2; i < 18; i += 3) x.fillRect(i, 12, 1, 2);
    x.fillStyle = '#05030a'; x.fillRect(19, 4, 9, 8); x.fillStyle = '#3a3f4a'; x.fillRect(20, 5, 7, 6); x.fillStyle = '#7fe0a0'; x.fillRect(21, 6, 5, 3); x.fillStyle = '#c0303a'; x.fillRect(21, 10, 2, 1);
    return c; });
  const PROMO_SPR = (() => { const t = txt('PROMO', '#c0202a', null), [c, x] = mk(t.width + 4, 11); x.fillStyle = '#5a5f68'; x.fillRect(4, 0, 1, 2); x.fillRect(c.width - 5, 0, 1, 2);
    x.fillStyle = '#05030a'; x.fillRect(0, 2, c.width, 9); x.fillStyle = '#ffd23a'; x.fillRect(1, 3, c.width - 2, 7); x.drawImage(t, 2, 3); return c; })();
  const PROMOS = [[5, 2.2], [11, 2.2], [8, 12.7], [14, 12.7], [2, 7.5], [17, 7.5]];
  const ETAL_SPR = {};
  { // palette de packs d'eau
    const [c, x] = mk(48, 38); ETAL_SPR.eau = c;
    const a = icone('pack', '#a8d8f0'), b = icone('pack', '#9ae0c0');
    for (let i = 0; i < 2; i++) x.drawImage(i ? b : a, 7 + i * 14, 0);
    for (let i = 0; i < 3; i++) x.drawImage(i % 2 ? b : a, i * 14, 12);
    x.fillStyle = '#05030a'; x.fillRect(1, 31, 46, 7); x.fillStyle = '#b88a58'; x.fillRect(2, 32, 44, 2); x.fillRect(2, 35, 44, 2); x.fillStyle = '#7a5430'; for (const px of [3, 22, 41]) x.fillRect(px, 34, 4, 1);
    const t = txt('-20%', '#c0202a', null); x.fillStyle = '#05030a'; x.fillRect(29, 0, t.width + 2, 9); x.fillStyle = '#ffd23a'; x.fillRect(30, 1, t.width, 7); x.drawImage(t, 30, 1); }
  { // étal de fruits : deux cagettes en gradins
    const [c, x] = mk(48, 38); ETAL_SPR.fruits = c;
    const cagette = (x0, y0, w, h) => { x.fillStyle = '#05030a'; x.fillRect(x0 - 1, y0 - 1, w + 2, h + 2); x.fillStyle = '#a87a48'; x.fillRect(x0, y0, w, h); x.fillStyle = '#7a5230'; for (let y = y0 + 3; y < y0 + h; y += 4) x.fillRect(x0, y, w, 1); x.fillStyle = '#c89a68'; x.fillRect(x0, y0, w, 1); };
    cagette(8, 12, 32, 9); for (const [f, px] of [['banane', 6], ['tomate', 22]]) x.drawImage(icone(f), px, -3);
    for (const [f, px] of [['pomme', -1], ['orange', 14], ['citron', 29]]) x.drawImage(icone(f), px, 8);
    cagette(1, 24, 46, 11); x.fillStyle = '#7a5230'; x.fillRect(3, 35, 3, 3); x.fillRect(42, 35, 3, 3); }
  const PANIER_COL = ['#c0303a', '#3a7ac8', '#e8a030', '#4a9a4a', '#f2f0ea', '#8a4aa8', '#f0d040', '#2a9ab0'];

  /* ---------- déplacements et interactions ---------- */
  function sortir() { sfx.door(); enterRoom('marche', 192); player.y = GROUND; player.vy = 0; player.ground = true; player.face = 1; }
  function cible() {
    const dx = Math.cos(S.a), dy = Math.sin(S.a);
    for (const k of CAISSES) { const ex = k.x - S.x, ey = k.y - S.y, d = Math.hypot(ex, ey); if (d < 1.5 && (ex * dx + ey * dy) / d > .5) return { label: 'PASSER EN CAISSE', run: () => ouvrirCaisse(k.n) }; }
    for (const e of ETALS) { const ex = e.x - S.x, ey = e.y - S.y, d = Math.hypot(ex, ey); if (d < 1.8 && (ex * dx + ey * dy) / d > .5) { const t = +Object.keys(RAYON).find(k => RAYON[k] === e.rayon); return { label: 'RAYON ' + LBL[t], run: () => ouvrirRayon(e.rayon) }; } }
    if (Math.hypot(DOOR.x - S.x, DOOR.y - S.y) < 1.2 && dy > .3) return { label: 'SORTIR', run: sortir };
    for (let d = .1; d < 2; d += .05) { const t = cell(Math.floor(S.x + dx * d), Math.floor(S.y + dy * d)); if (!t) continue;
      if (RAYON[t]) { const id = RAYON[t]; return { label: 'RAYON ' + LBL[t], run: () => ouvrirRayon(id) }; } break; }
    return null;
  }
  function update(dt, t) {
    const turn = t ? 0 : (any(keys, 'ArrowRight', 'KeyD') ? 1 : 0) - (any(keys, 'ArrowLeft', 'KeyA', 'KeyQ') ? 1 : 0), mv = t ? 0 : (any(keys, 'ArrowUp', 'KeyW', 'KeyZ') ? 1 : 0) - (any(keys, 'ArrowDown', 'KeyS') ? .6 : 0);
    S.va += (turn * TURN - S.va) * Math.min(1, dt * 12); S.a += S.va * dt;
    S.v += (mv * SPEED - S.v) * Math.min(1, dt * 10);
    const dx = Math.cos(S.a) * S.v * dt, dy = Math.sin(S.a) * S.v * dt, rad = .22;
    const nx = S.x + dx; if (!solid(nx + Math.sign(dx) * rad, S.y - rad) && !solid(nx + Math.sign(dx) * rad, S.y + rad)) S.x = nx; else S.v *= .6;
    const ny = S.y + dy; if (!solid(S.x - rad, ny + Math.sign(dy) * rad) && !solid(S.x + rad, ny + Math.sign(dy) * rad)) S.y = ny; else S.v *= .6;
    S.stepD += Math.abs(S.v) * dt; S.bob = Math.sin(S.stepD * 4.2) * Math.min(1, Math.abs(S.v));
    if (S.stepD > (S.nextStep || 0)) { S.nextStep = S.stepD + .75; if (Math.abs(S.v) > .5) sfx.step(); }
    S.cible = cible();
    if (!t && pressed.has('KeyM')) { audioInit(); setSound(!SND.on); toast(SND.on ? 'Son activé' : 'Son coupé'); }
    if (!t && pressed.has('KeyE') && S.cible) { const c = S.cible; S.cible = null; c.run(); if (curRoom.id !== 'supermarche') return; }
    Object.assign(player, { x: S.x * 15, y: S.y * 8, vx: S.v * 30, vy: 0, ground: true, climbing: null });
  }

  /* ---------- rendu ---------- */
  const img = ctx.createImageData(W, H), p32 = new Uint32Array(img.data.buffer), zb = new Float32Array(W);
  const BAY = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(v => v / 16);
  const [litC, litX] = mk(48, 48);
  const lit = (src, sw, sh, l) => { if (litC.width < sw || litC.height < sh) { litC.width = Math.max(litC.width, sw); litC.height = Math.max(litC.height, sh); }
    litX.globalCompositeOperation = 'source-over'; litX.clearRect(0, 0, litC.width, litC.height); litX.drawImage(src, 0, 0, sw, sh, 0, 0, sw, sh);
    litX.globalCompositeOperation = 'source-atop'; litX.fillStyle = `rgba(20,20,30,${clamp(1 - l, 0, .8)})`; litX.fillRect(0, 0, sw, sh); return litC; };
  const lum = d => .3 + .8 / (1 + d * d * .016);
  function boite(label, y, col) { const t = txt(label, '#e9e2cc', null), wd = t.width + 15, x = (W - wd) >> 1; ctx.fillStyle = '#05060a'; ctx.fillRect(x - 1, y - 1, wd + 2, 11); ctx.fillStyle = col || '#1a2333'; ctx.fillRect(x, y, wd, 9);
    ctx.fillStyle = '#c9a24a'; ctx.fillRect(x + 1, y + 1, 9, 7); ctx.drawImage(txt('E', '#14101c', null), x + 3, y + 1); ctx.drawImage(t, x + 12, y + 1); }
  function render() {
    const dirX = Math.cos(S.a), dirY = Math.sin(S.a), plX = -dirY * PL, plY = dirX * PL, hz = (H >> 1) + Math.round(S.bob * 2), px = S.x, py = S.y;
    const pix = (t, o, sh, b) => { let r = t[o], g = t[o + 1], bl = t[o + 2];
      if (!(r > 245 && g > 245 && bl > 245)) { const q = ((sh * 14 + b) | 0) / 14; r *= q; g *= q; bl *= q * 1.03; }
      return 0xff000000 | ((bl > 255 ? 255 : bl) << 16) | ((g > 255 ? 255 : g) << 8) | (r > 255 ? 255 : r); };
    // sol et plafond
    const lx = dirX - plX, ly = dirY - plY, sxs = plX * 2 / W, sys = plY * 2 / W;
    for (let y = 0; y < H; y++) { const dy = y - hz, o = y * W; if (dy === 0) { p32.fill(0xff8a8a84, o, o + W); continue; }
      const rd = (FS / 2) / Math.abs(dy), tex = dy > 0 ? TFLOOR : TCEIL, sh = lum(rd) * (dy > 0 ? 1 : .92);
      let fx = px + rd * lx, fy = py + rd * ly; const stx = rd * sxs, sty = rd * sys;
      for (let x = 0; x < W; x++, fx += stx, fy += sty) { const tx = (fx - Math.floor(fx)) * 32 | 0, ty = (fy - Math.floor(fy)) * 32 | 0; p32[o + x] = pix(tex, (ty * 32 + tx) << 2, sh, BAY[(y & 3) << 2 | x & 3]); } }
    // murs et rayons
    for (let x = 0; x < W; x++) { const cam = 2 * x / W - 1, rx = dirX + plX * cam, ry = dirY + plY * cam; let mx = Math.floor(px), my = Math.floor(py);
      const ddx = Math.abs(1 / rx), ddy = Math.abs(1 / ry), stx = rx < 0 ? -1 : 1, sty = ry < 0 ? -1 : 1; let sdx = rx < 0 ? (px - mx) * ddx : (mx + 1 - px) * ddx, sdy = ry < 0 ? (py - my) * ddy : (my + 1 - py) * ddy, side = 0, type = 0;
      for (let n = 0; n < 80; n++) { if (sdx < sdy) { sdx += ddx; mx += stx; side = 0; } else { sdy += ddy; my += sty; side = 1; } type = cell(mx, my); if (type && type < 20) break; type = 0; }
      if (!type) type = 1;
      const d = Math.max(.05, side ? sdy - ddy : sdx - ddx); zb[x] = d;
      const lh = FS / d, y0 = hz - lh / 2, tex = texFor(type, side, mx, my); let wx = side ? px + d * rx : py + d * ry; wx -= Math.floor(wx); let tx = wx * 32 | 0; if ((!side && rx < 0) || (side && ry > 0)) tx = 31 - tx;
      const sh = lum(d) * (side ? .86 : 1), ya = Math.max(0, Math.ceil(y0)), yb = Math.min(H - 1, Math.floor(y0 + lh));
      for (let y = ya; y <= yb; y++) { const ty = Math.min(31, (y - y0) / lh * 32 | 0); p32[y * W + x] = pix(tex, (ty * 32 + tx) << 2, sh, BAY[(y & 3) << 2 | x & 3]); } }
    ctx.putImageData(img, 0, 0);
    // sprites, du plus loin au plus proche
    const inv = 1 / (plX * dirY - dirX * plY), list = [];
    const proj = (wx, wy) => { const rx = wx - px, ry = wy - py, tX = inv * (dirY * rx - dirX * ry), tY = inv * (-plY * rx + plX * ry); return tY > .15 ? { tX, tY, sx: (W / 2) * (1 + tX / tY) } : null; };
    const bb = (p, src, sw, sh, hW, elev) => { const hpx = Math.max(1, Math.round(FS * hW / p.tY)), wpx = Math.max(1, Math.round(hpx * sw / sh)), bottom = Math.round(hz + (FS / 2 - elev * FS) / p.tY), top = bottom - hpx, x0 = Math.round(p.sx - wpx / 2);
      for (let x = Math.max(0, x0); x < Math.min(W, x0 + wpx); x++) if (p.tY < zb[x]) ctx.drawImage(src, Math.min(sw - 1, (x - x0) / wpx * sw | 0), 0, 1, sh, x, top, 1, hpx);
      const cx = Math.round(p.sx); return { top, hpx, vis: cx >= 0 && cx < W && p.tY < zb[cx] }; };
    for (const k of CAISSES) { const p = proj(k.x, k.y); if (p) list.push({ p, k: 0, n: k.n }); }
    for (const [x, y] of PROMOS) { const p = proj(x, y); if (p) list.push({ p, k: 1 }); }
    for (const e of ETALS) { const p = proj(e.x, e.y); if (p) list.push({ p, k: 3, e }); }
    for (const e of roomEnts()) if (e !== player) { const p = proj(e.x / 15, e.y / 8); if (p) list.push({ p, k: 2, e }); }
    list.sort((a, b) => b.p.tY - a.p.tY);
    const tags = [];
    for (const s2 of list) { const p = s2.p;
      if (s2.k === 0) bb(p, lit(CAISSE_SPR[(s2.n - 1) % 6], 28, 26, lum(p.tY)), 28, 26, .72, 0);
      else if (s2.k === 1) bb(p, PROMO_SPR, PROMO_SPR.width, 11, .2, .82);
      else if (s2.k === 3) bb(p, lit(ETAL_SPR[s2.e.kind], 48, 38, lum(p.tY)), 48, 38, .74, 0);
      else { drawPetit(s2.e); const r2 = bb(p, lit(sc, BW, BH, lum(p.tY)), BW, BH, .66 * BH / 44, 0); if (r2.vis && p.tY < 8) tags.push([s2.e, p.sx, r2.top]); } }
    for (const [e, x, y] of tags) { const t = txt(norm(e.name), '#e6e1d3', '#05060a'); ctx.drawImage(t, Math.round(x - t.width / 2), Math.max(1, y - 9)); }
    // le panier tenu à la main (il se remplit avec le caddie)
    const n = caddieNb(), sw = Math.round(Math.sin(S.stepD * 2.1) * 3 * Math.min(1, Math.abs(S.v))), bx = W - 62 + sw, by = H - 28 + Math.round(Math.abs(S.bob) * 3);
    for (let i = 0; i < Math.min(n, 9); i++) { const c = PANIER_COL[i % PANIER_COL.length], h = 6 + (i * 7) % 5; ctx.fillStyle = '#05030a'; ctx.fillRect(bx + 3 + i * 4, by - h + 2, 5, h); ctx.fillStyle = c; ctx.fillRect(bx + 4 + i * 4, by - h + 3, 3, h); }
    ctx.fillStyle = '#05030a'; ctx.fillRect(bx - 1, by - 1, 46, 30); ctx.fillStyle = '#c0303a'; ctx.fillRect(bx, by, 44, 30);
    ctx.fillStyle = '#86202a'; for (let j = 5; j < 28; j += 5) for (let i = 3; i < 42; i += 5) ctx.fillRect(bx + i, by + j, 3, 2);
    ctx.fillStyle = '#e8606a'; ctx.fillRect(bx, by, 44, 2); ctx.fillStyle = '#2a2a30'; ctx.fillRect(bx + 8, by - 8, 2, 9); ctx.fillRect(bx + 34, by - 8, 2, 9); ctx.fillRect(bx + 8, by - 9, 28, 2);
    // caddie (en haut à gauche) et plan du magasin (en haut à droite)
    const lab = txt(`CADDIE  ${n} ARTICLE${n > 1 ? 'S' : ''}  ${caddieTotal().toFixed(2).replace('.', ',')} EUR`, '#f3d777', '#05060a'); ctx.drawImage(lab, 4, 4);
    const MX = 5, MY = 14; ctx.fillStyle = 'rgba(5,3,10,.6)'; ctx.fillRect(MX - 2, MY - 2, SW * 2 + 4, SH * 2 + 4);
    for (let i = 0; i < SW * SH; i++) { const t = smap[i]; if (!t) continue; ctx.fillStyle = t === 21 ? '#c89a5a' : t === 20 ? '#e8e6e0' : t === 2 ? '#9ec8e0' : COL[t] || '#8a8680'; ctx.fillRect(MX + (i % SW) * 2, MY + (i / SW | 0) * 2, 2, 2); }
    for (const e of roomEnts()) if (e !== player) { ctx.fillStyle = '#e6e1d3'; ctx.fillRect(MX + (e.x / 15 | 0) * 2, MY + (e.y / 8 | 0) * 2, 2, 2); }
    ctx.fillStyle = '#ffd27a'; ctx.fillRect(MX + (px | 0) * 2, MY + (py | 0) * 2, 2, 2); ctx.fillStyle = '#fff4c8'; ctx.fillRect(Math.round(MX + px * 2 - .5 + dirX * 2.4), Math.round(MY + py * 2 - .5 + dirY * 2.4), 1, 1);
    if (S.cible) boite(S.cible.label, H - 44);
    ctx.drawImage(vig, 0, 0);
  }

  ROOMS.supermarche = { id: 'supermarche', name: 'LE SUPERMARCHE', fp: true, indoor: true, fires: [], stars: [], grass: [], portals: [], plats: [], climbs: [], critters: [],
    fpUpdate: update, fpRender: render, etat: S,
    onEnter() { Object.assign(S, { x: START.x, y: START.y, a: START.a, v: 0, va: 0, cible: null }); chargerCourses();
      if (!S.hint) { S.hint = true; toast('<b>Flèches</b> ou <b>ZQSD</b> pour circuler. <b>E</b> devant un rayon pour choisir, puis passe en <b>caisse</b>.'); } } };
}
