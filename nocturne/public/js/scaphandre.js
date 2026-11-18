"use strict";
// Skin « Prospecteur » : un petit explorateur en combinaison étanche, capuche en cône, hublot sombre aux yeux verts
// lumineux, réservoir sur le dos relié à la capuche par un tuyau, et une carte roulée à la main.
// Même gabarit et mêmes animations que la Capuche (anim() de character.js) ; la combinaison prend la couleur choisie.
// Au repos prolongé, il déroule sa carte pour la lire.

SKINS.scaphandre = { label: 'Prospecteur', swatch: 'Couleur de la combinaison', nameY: 44, pal: c => makePalScaph(c), draw: e => drawScaph(e) };
// palette : 1 contour · 2-5 combinaison · 6 hublot · 7-8 yeux · 9-10 gants/bottes · 11 sangles · 12 boucle · 13-15 réservoir · 16-18 carte · 21+ accessoires
function makePalScaph(c) {
  return [null, '#15100a', shade(c, .38), shade(c, .66), c, shade(c, 1.32), '#0c1013', '#9dff6a', '#eaffd8', '#26262c', '#4a4a56',
    '#1a1a20', '#9a9aa6', '#363c48', '#586070', '#d0703a', '#ece4cc', '#b8ac90', '#6a5a48', '#2a4a22', '#5a8a3a',
    '#d0414a', '#7a1e2a', '#e8c860', '#9a7428', '#f0a0b8', '#ffe48a', '#f4f0fa'].map(v => v && rgbArr(v));
}
function drawScaph(e) {
  buf.fill(0); const A = e.A, X = BOX, G = BOY, b = A.bob, hy = Math.round(e.hy);
  const top = G - 16 + b + A.sqH, hem = G - 5 + b;
  const read = !A.back && e.ground && !e.climbing && e.spd < 5 && !e.act && e.idleT > 4 && ((e.idleT + e.seed * 3) % 9) < 5.5;
  // réservoir sur le dos + tuyau vers la capuche
  const hcx = X + A.lean, hcy = G - 21 + b + hy;
  for (let y = top + 1; y <= top + 9; y++) for (let x = X - 10; x <= X - 5; x++) put(x, y, x === X - 10 ? 13 : y === top + 1 ? 14 : x > X - 7 && y > top + 5 && y < top + 9 ? 15 : 13);
  put(X - 9, top + 3, 14); put(X - 9, top + 4, 14);
  for (const [px, py] of [[-9, 0], [-10, -2], [-11, -4], [-11, -6], [-10, -8], [-9, -9], [-8, -10]]) { put(X + px, top + py, 11); put(X + px + 1, top + py, 11); }
  // pieds (arrière d'abord)
  const foot = (fx, fy, back) => { const x0 = X + fx;
    for (let y = hem + 1; y <= G - 3 + fy; y++) put(x0, y, back ? 2 : 3);
    for (let i = -1; i <= 2; i++) { put(x0 + i, G - 2 + fy, back ? 9 : 10); put(x0 + i, G - 1 + fy, 9); } };
  foot(A.bf[0], A.bf[1], true); foot(A.ff[0], A.ff[1], false);
  // bras arrière
  const arm = (sx, sy, back) => { const x0 = X + sx, y0 = top + 2 + sy;
    for (let j = 0; j < 4; j++) for (let i = -1; i <= 1; i++) put(x0 + i, y0 + j, back ? 3 : i === 1 ? 5 : 4);
    for (let i = -1; i <= 1; i++) { put(x0 + i, y0 + 4, back ? 9 : 10); put(x0 + i, y0 + 5, 9); } };
  if (!read) arm(-5 + A.sb[0], A.sb[1], true);
  // combinaison : ronde, en poire
  for (let y = top; y <= hem; y++) { const t = (y - top) / Math.max(1, hem - top), wdt = 4.6 + 2.8 * Math.sin(Math.min(1, t * 1.25) * Math.PI * .62) + A.sqW;
    const L = Math.round(X - wdt - A.flB * t * t), R = Math.round(X + wdt + A.flF * t * t);
    for (let x = L; x <= R; x++) { const nx = ((x - X) / Math.max(1, R - L)) * 2; let c = vol(nx, t * 2 - 1); if (y === hem) c = 2; else if (nx < -.6) c = Math.min(c, 3); put(x, y, c); } }
  // sangles du harnais + ceinture + boucle
  if (!A.back) { for (let k = 0; k <= 8; k++) put(X - 3 + k * .75 + A.look * .5, top + 1 + k, 11);
    for (let x = X - 6; x <= X + 6; x++) put(x, hem - 2, 11); put(X + 1, hem - 2, 12); put(X + 2, hem - 2, 12);
    put(X - 4, top + 2, 11); put(X + 4, top + 2, 11); }
  else { for (let y = top + 1; y < hem - 2; y++) { put(X - 3, y, 11); put(X + 3, y, 11); } for (let x = X - 6; x <= X + 6; x++) put(x, hem - 2, 11); }
  // capuche en cône (la pointe suit le ressort tipX)
  for (let k = 0; k <= 10; k++) { const yy = hcy - 4 - k, hw = Math.max(0, 5.2 - k * .52), o = Math.round(e.tipX * (k / 10) * 1.3);
    for (let x = Math.round(hcx - hw + o); x <= Math.round(hcx + hw + o); x++) put(x, yy, x <= hcx - hw + o + .6 ? 3 : x >= hcx + hw + o - 1 ? 5 : 4); }
  const tipX = Math.round(hcx + e.tipX * 1.3), tipY = hcy - 15;
  ell(hcx, hcy, 7, 6.3, (nx, ny) => vol(nx, ny));
  ell(hcx, hcy + 5.4, 6.4, 1.6, (nx, ny, x, y) => y > hcy + 4 ? 3 : 0);
  // hublot sombre + yeux verts
  e.glowW = null;
  if (!A.back) { const fcx = hcx + 1.5 + A.look, fcy = hcy + 1 + (read ? 1 : 0);
    ell(fcx, fcy, 4.4, 4.2, (nx, ny) => ny < -.55 ? 3 : 0); ell(fcx, fcy + .3, 3.8, 3.6, () => 6);
    put(Math.round(fcx) - 2, Math.round(fcy) - 2, 10);
    const ey = Math.round(fcy), L = Math.round(fcx) - 2, Rr = Math.round(fcx) + 1, eyes = read ? 'shut' : A.eyes;
    [L, Rr].forEach(ex => {
      if (eyes === 'open' || eyes === 'wide') { put(ex, ey, 7); put(ex + 1, ey, 7); put(ex, ey + 1, 7); put(ex + 1, ey + 1, 8); if (eyes === 'wide') { put(ex, ey - 1, 7); put(ex + 1, ey - 1, 7); } }
      else if (eyes === 'happy') { put(ex - 1, ey + 1, 7); put(ex, ey, 7); put(ex + 1, ey, 7); put(ex + 2, ey + 1, 7); }
      else if (eyes === 'angry') { put(ex, ey + 1, 7); put(ex + 1, ey + 1, 7); put(ex === L ? ex : ex + 1, ey, 7); }
      else { put(ex, ey + 1, 7); put(ex + 1, ey + 1, 7); } });
    e.glowW = { x: e.x + e.face * (fcx - BOX), y: e.y + (fcy - BOY), a: eyes === 'shut' || eyes === 'blink' ? .5 : 1 };
  } else ell(hcx, hcy + 1, 4, 3.5, (nx, ny) => ny > .4 ? 3 : 0);
  // tuyau qui rejoint l'arrière de la capuche
  for (const [px, py] of [[-7, -11], [-6, -12]]) { put(X + px, top + py, 11); put(X + px + 1, top + py, 11); }
  // accessoires sur la capuche
  if (e.acc === 'crown') { const cy0 = tipY + 2; for (let i = -3; i <= 3; i++) put(tipX + i, cy0 + 1, 1); for (let i = -2; i <= 2; i++) put(tipX + i, cy0, i === -2 ? 24 : 23); for (const i of [-2, 0, 2]) put(tipX + i, cy0 - 1, 23); put(tipX, cy0, 21); }
  if (e.acc === 'flower' && !A.back) { const fx = hcx + 4, fy = hcy - 6; for (const [i, j] of [[0, -1], [-1, 0], [1, 0], [0, 1]]) put(fx + i, fy + j, 27); put(fx, fy, 23); }
  if (e.acc === 'ears') for (const s2 of [-1, 1]) { const ex = hcx + s2 * 5; for (let j = 0; j < 3; j++) for (let i = 0; i <= 2 - j; i++) put(s2 < 0 ? ex - 1 + i : ex + 1 - i, hcy - 5 - j, i === 1 && j === 0 ? 25 : 4); }
  if (e.acc === 'scarf') { const y0 = Math.round(hcy + 6), sw2 = Math.round(e.tipX * .8);
    for (let x = X - 6; x <= X + 6; x++) { put(x, y0, 21); put(x, y0 + 1, x < X - 4 || x > X + 5 ? 22 : 21); }
    put(X - 7, y0 + 1, 21); put(X - 7 + Math.round(sw2 * .5), y0 + 2, 21); put(X - 8 + sw2, y0 + 3, 22); }
  // bras avant + carte (roulée, ou dépliée pour la lire)
  e.lanternW = null;
  if (read) { const mx = X + 2 + A.lean, my = top + 3;
    for (let j = 0; j < 7; j++) for (let i = 0; i < 9; i++) put(mx + i - 1, my + j, (i === 0 || i === 8) ? 17 : (j === 2 && i > 1 && i < 6) || (j === 4 && i > 2 && i < 8) ? 18 : (i + j) % 7 === 0 ? 19 : 16);
    put(mx + 5, my + 3, 15); put(mx - 2, my + 2, 9); put(mx - 2, my + 3, 9); put(mx + 8, my + 3, 9); put(mx + 8, my + 4, 9); }
  else {
    arm(4 + A.sf[0], A.sf[1], false);
    if (!A.back && e.acc !== 'lantern') { const rx = X + 4 + A.sf[0], ry = top + 7 + A.sf[1];
      for (let i = 0; i < 7; i++) { put(rx - 2 + i, ry, i === 6 ? 17 : 16); put(rx - 2 + i, ry + 1, i === 6 ? 18 : 17); } put(rx + 5, ry - 1, 17); }
    if (e.acc === 'lantern' && !A.back) { const lx = X + 5 + A.sf[0] + Math.round(e.tipX * .3), ly = top + 7 + A.sf[1];
      put(lx, ly, 11); for (let j = 1; j <= 3; j++) { put(lx - 1, ly + j, 24); put(lx, ly + j, j === 2 ? 26 : 23); put(lx + 1, ly + j, 24); }
      e.lanternW = { x: e.x + e.face * (lx - BOX), y: e.y + (ly + 2 - BOY) }; } }
  finishBuf(e);
}
