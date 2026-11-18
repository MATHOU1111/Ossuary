"use strict";
// Les salles : décors pré-dessinés, plateformes, zones d'escalade, feux et particules.

/* ---------------- calques communs ---------------- */
function archRows(x1, x2, spring, bottom, rr, cb) {
  for (let y = spring; y < bottom; y++) cb(y, x1, x2);
  for (let dy = 1; dy <= rr; dy++) { const s = Math.sqrt(rr * rr - dy * dy), xl = Math.round(x1 + rr - s), xr = Math.round(x2 - rr + s); if (xl >= xr) break; cb(spring - dy, xl, xr); }
}
let px = null, grass = [];   // calque de jeu en cours de dessin (voir onCanvas) et touffes d'herbe
function bricks(x0, x1, y0, y1) {
  for (let y = y0; y < y1; y += 6) { px.fillStyle = '#10161e'; px.fillRect(x0, y, x1 - x0, 1);
    let x = x0 - (R() * 8 | 0);
    while (x < x1) { const w = 9 + R() * 9 | 0, a = Math.max(x, x0), b = Math.min(x + w, x1);
      if (b > a) { px.fillStyle = ['#232d39', '#26313e', '#1f2833', '#29343f'][R() * 4 | 0]; px.fillRect(a, y + 1, b - a - 1, Math.min(5, y1 - y - 1));
        px.fillStyle = '#313d4b'; px.fillRect(a, y + 1, b - a - 1, 1); px.fillStyle = '#10161e'; px.fillRect(b - 1, y + 1, 1, Math.min(5, y1 - y - 1)); }
      x += w; } }
}
function mossTop(x0, x1, y) { for (let x = x0; x < x1; x++) { if (R() < .22) { px.fillStyle = R() < .5 ? '#355c3e' : '#4c7a4c'; px.fillRect(x, y - 1, 1 + (R() * 3 | 0), 1); }
  if (R() < .09) grass.push({ x, y, h: 2 + R() * 3 | 0, ph: R() * 6 }); } }
// Fog texture & vignette
const [fog, fgx] = mk(W, 40);
for (let i = 0; i < 46; i++) { const x = R() * W, y = 12 + R() * 16, r = 8 + R() * 20;
  for (const ox of [-W, 0, W]) { const g = fgx.createRadialGradient(x + ox, y, 0, x + ox, y, r); g.addColorStop(0, 'rgba(150,182,200,.13)'); g.addColorStop(1, 'rgba(150,182,200,0)'); fgx.fillStyle = g; fgx.fillRect(x + ox - r, y - r, r * 2, r * 2); } }
const [vig, vx] = mk(W, H);
{ const g = vx.createRadialGradient(W / 2, H / 2, 70, W / 2, H / 2, 240); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(2,3,8,.62)'); vx.fillStyle = g; vx.fillRect(0, 0, W, H); }

/* ---------------- shared drawing helpers ---------------- */
function pline(c, x0, y0, x1, y1, w = 1) { const n = Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0))) + 1;
  for (let i = 0; i <= n; i++) c.fillRect(Math.round(x0 + (x1 - x0) * i / n - w / 2 + .5), Math.round(y0 + (y1 - y0) * i / n - w / 2 + .5), w, w); }
function tree(c, x, y, len, ang, depth, w) { const x1 = x + Math.cos(ang) * len, y1 = y + Math.sin(ang) * len; pline(c, x, y, x1, y1, w);
  if (depth > 0) { tree(c, x1, y1, len * (.62 + R() * .2), ang - .3 - R() * .45, depth - 1, Math.max(1, w - 1)); tree(c, x1, y1, len * (.62 + R() * .2), ang + .25 + R() * .45, depth - 1, Math.max(1, w - 1)); } }
function makeSky(mx, my) {
  const [c, x] = mk(W, H); const g = x.createLinearGradient(0, 0, 0, 190); g.addColorStop(0, '#060a14'); g.addColorStop(.5, '#0f1d33'); g.addColorStop(1, '#27445c');
  x.fillStyle = g; x.fillRect(0, 0, W, H);
  const hg = x.createRadialGradient(mx, my, 12, mx, my, 95); hg.addColorStop(0, 'rgba(190,225,215,.32)'); hg.addColorStop(1, 'rgba(190,225,215,0)'); x.fillStyle = hg; x.fillRect(0, 0, W, H);
  for (let y = -17; y <= 17; y++) for (let i = -17; i <= 17; i++) { if (i * i + y * y > 17 * 17 + 6) continue;
    const d = (i - 4) ** 2 + (y + 3) ** 2; x.fillStyle = d < 225 ? '#e4ecd4' : d < 300 ? '#c3cfb5' : '#9aaa96'; x.fillRect(mx + i, my + y, 1, 1); }
  for (const [x0, y0, r] of [[-4, 3, 3], [3, -6, 2], [6, 6, 2], [-8, -5, 1], [0, 10, 1], [9, -1, 1]])
    for (let y = -r; y <= r; y++) for (let i = -r; i <= r; i++) if (i * i + y * y <= r * r) { x.fillStyle = (i < 0 && y < 0) ? '#b4c1a8' : '#ccd6c0'; x.fillRect(mx + x0 + i, my + y0 + y, 1, 1); }
  return c;
}
function makeStars(mx, my) { const s = []; while (s.length < 75) { const x = R() * W | 0, y = R() * 120 | 0; if (Math.hypot(x - mx, y - my) < 28) continue; s.push({ x, y, b: .3 + R() * .7, s: 1 + R() * 3, big: R() < .08 }); } return s; }
function moonRays(mx, dir) { return c => { c.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 4; i++) { const a = .022 + .012 * Math.sin(time * .35 + i * 1.7); c.fillStyle = `rgba(140,190,205,${a})`; const o = dir * i * 26, b = dir * i * 62;
    c.beginPath(); c.moveTo(mx - 6 + o, 0); c.lineTo(mx + 8 + o, 0); c.lineTo(mx + dir * 150 + 20 + b, H); c.lineTo(mx + dir * 150 - 18 + b, H); c.fill(); }
  c.globalCompositeOperation = 'source-over'; }; }
function ledge(p, cap = '#3d4d5c', capHi = '#5c7283') { const w = p.x2 - p.x1;
  for (let cx = p.x1 + 8; cx < p.x2 - 4; cx += 18) { px.fillStyle = '#1a222d'; px.fillRect(cx - 3, p.y + 9, 6, 2); px.fillRect(cx - 2, p.y + 11, 4, 2); px.fillRect(cx - 1, p.y + 13, 2, 1);
    px.fillStyle = '#2b3644'; px.fillRect(cx - 3, p.y + 9, 6, 1); }
  bricks(p.x1, p.x2, p.y + 3, p.y + 9);
  px.fillStyle = cap; px.fillRect(p.x1, p.y, w, 3); px.fillStyle = capHi; px.fillRect(p.x1, p.y, w, 1);
  px.fillStyle = '#2b3644'; px.fillRect(p.x1, p.y, 1, 9); px.fillStyle = '#0b1016'; px.fillRect(p.x1, p.y + 9, w, 1); px.fillRect(p.x2 - 1, p.y + 1, 1, 8); }
const fire = (x, y, size, back = false) => ({ x, y, size, back, p: [] });

const ROOMS = {};   // la Grand-Place (remparts) est dans place.js
/* ================= ROOM : LA SALLE DU TRÔNE (droite) ================= */
{ const r = ROOMS.trone = { id: 'trone', name: 'LA SALLE DU TRONE', left: 'remparts', fires: [], fogFar: null, fogNear: [170, 5, .22], indoor: true };
  r.sky = makeSky(250, 46); r.stars = makeStars(250, 46); r.far = null;
  const [wl, wx] = mk(W, H); r.wall = wl;
  const ST = '#1d1a26', STM = '#15121c', STH = '#2a2535';
  wx.fillStyle = ST; wx.fillRect(0, 0, W, GROUND);
  for (let y = 0, row = 0; y < GROUND; y += 10, row++) { wx.fillStyle = STM; wx.fillRect(0, y, W, 1);
    for (let x = row % 2 ? 0 : -12; x < W; x += 24) { wx.fillStyle = STM; wx.fillRect(x, y, 1, 10); if (R() < .3) { wx.fillStyle = STH; wx.fillRect(x + 1, y + 1, 23, 9); } } }
  // ceiling vault shadow
  for (let y = 0; y < 26; y++) { wx.fillStyle = `rgba(6,4,10,${.7 * (1 - y / 26)})`; wx.fillRect(0, y, W, 1); }
  // window helper : carve an opening and fill with stained glass
  const GLASS = ['#8a1a2a', '#1d3a8a', '#c99a2a', '#5a1f7a', '#1f6a5a', '#a8323e'];
  const lancet = (x1, x2, spring, bottom) => {
    wx.fillStyle = '#2f2a3a'; archRows(x1 - 3, x2 + 3, spring, bottom + 3, (x2 - x1) * .8 + 3, (y, a, b) => wx.fillRect(a, y, b - a, 1));
    wx.globalCompositeOperation = 'destination-out'; archRows(x1, x2, spring, bottom, (x2 - x1) * .8, (y, a, b) => wx.fillRect(a, y, b - a, 1)); wx.globalCompositeOperation = 'source-over';
    const [g, gx] = mk(W, H); archRows(x1, x2, spring, bottom, (x2 - x1) * .8, (y, a, b) => { for (let x = a; x < b; x++) { const pane = ((x - x1) / 6 | 0) + ((y / 8 | 0) * 3);
      const lead = (x - x1) % 6 === 0 || y % 8 === 0; gx.fillStyle = lead ? 'rgba(10,8,14,.95)' : GLASS[(pane * 7 + (y / 8 | 0)) % GLASS.length]; gx.globalAlpha = lead ? 1 : .55 + R() * .25; gx.fillRect(x, y, 1, 1); } });
    gx.globalAlpha = 1; gx.fillStyle = '#0a080e'; const mid = (x1 + x2) >> 1; gx.fillRect(mid, spring - 40, 1, bottom - spring + 40);
    wx.drawImage(g, 0, 0); wx.fillStyle = '#4a4258'; wx.fillRect(x1 - 4, bottom + 2, x2 - x1 + 8, 2); };
  lancet(34, 74, 64, 112); lancet(310, 350, 64, 112);
  // rose window
  const RX = 192, RY = 52, RR = 26;
  wx.fillStyle = '#2f2a3a'; disc(wx, RX, RY, RR + 4); wx.fillStyle = '#4a4258'; for (let a = 0; a < 120; a++) { const t = a / 120 * Math.PI * 2; wx.fillRect(Math.round(RX + Math.cos(t) * (RR + 4)), Math.round(RY + Math.sin(t) * (RR + 4)), 1, 1); }
  for (let y = -RR; y <= RR; y++) for (let x = -RR; x <= RR; x++) { const d = Math.hypot(x, y); if (d > RR + .3) continue;
    const ang = (Math.atan2(y, x) + Math.PI * 2) % (Math.PI * 2), seg = ang / (Math.PI * 2 / 12), ring = d < 7 ? 0 : d < 16 ? 1 : 2;
    const lead = (ring > 0 && Math.abs(seg - Math.round(seg)) * (d * Math.PI * 2 / 12) < .7) || Math.abs(d - 7) < .6 || Math.abs(d - 16) < .6 || d > RR - .8;
    wx.fillStyle = lead ? '#0a080e' : ring === 0 ? (d < 3 ? '#ffe6a0' : '#d9a434') : GLASS[((seg | 0) + ring * 3) % GLASS.length];
    wx.fillRect(RX + x, RY + y, 1, 1); }
  // pillars between bays
  for (const c of [0, 112, 272, 384]) { wx.fillStyle = '#26222f'; wx.fillRect(c - 7, 0, 14, GROUND); wx.fillStyle = '#3a3446'; wx.fillRect(c + 5, 0, 1, GROUND); wx.fillStyle = '#121019'; wx.fillRect(c - 7, 0, 1, GROUND);
    wx.fillStyle = '#3a3446'; wx.fillRect(c - 9, 98, 18, 3); wx.fillRect(c - 9, 176, 18, 8); wx.fillStyle = '#4a4258'; wx.fillRect(c - 9, 98, 18, 1); wx.fillRect(c - 9, 176, 18, 1); }
  // vault ribs
  wx.fillStyle = '#2a2535'; for (const [a, b] of [[0, 112], [112, 272], [272, 384]]) { const m = (a + b) / 2, hw = (b - a) / 2;
    for (let x = a; x <= b; x++) { const t = (x - m) / hw, y = Math.round(22 - 18 * (1 - Math.abs(t)) ** 1.6); wx.fillRect(x, y, 1, 2); } }
  // tapestries
  for (const c of [112, 272]) { wx.fillStyle = '#4a0e1a'; wx.fillRect(c - 8, 104, 16, 34); wx.fillStyle = '#6a1424'; wx.fillRect(c - 7, 104, 14, 33); wx.fillStyle = '#c9a24a'; wx.fillRect(c - 7, 104, 14, 1); wx.fillRect(c - 7, 106, 1, 30); wx.fillRect(c + 6, 106, 1, 30);
    for (let i = 0; i < 7; i++) wx.fillRect(c - 7 + i * 2, 138, 1, 2 + (i % 2));
    // bat emblem
    wx.fillStyle = '#e0b85a'; wx.fillRect(c - 1, 116, 2, 5); wx.fillRect(c - 5, 115, 3, 1); wx.fillRect(c + 2, 115, 3, 1); wx.fillRect(c - 6, 116, 2, 2); wx.fillRect(c + 4, 116, 2, 2); wx.fillRect(c - 4, 117, 1, 2); wx.fillRect(c + 3, 117, 1, 2); wx.fillRect(c - 1, 113, 1, 1); wx.fillRect(c + 1, 113, 1, 1);
    wx.fillStyle = '#2a2a32'; wx.fillRect(c - 9, 103, 18, 1);
    wx.fillStyle = '#4a3a2c'; wx.fillRect(c - 1, 150, 2, 6); wx.fillStyle = '#2a2a32'; wx.fillRect(c - 2, 155, 4, 2); wx.fillRect(c - 1, 157, 2, 3); wx.fillStyle = '#5a5a68'; wx.fillRect(c - 2, 149, 4, 2);
    r.fires.push(fire(c, 147, 1, true)); }
  // play layer
  let tp; [tp, px] = mk(W, H); grass = []; r.play = tp; r.grass = grass;
  r.plats = [{ x1: 16, x2: 100, y: 124 }, { x1: 284, x2: 368, y: 124 }, { x1: 138, x2: 246, y: 177, step: 1 }, { x1: 152, x2: 232, y: 170, step: 1 }, { x1: 183, x2: 201, y: 157 }];
  { // marble floor
    for (let y = GROUND, row = 0; y < H; y += 8, row++) for (let x = (row % 2) * -8, k = 0; x < W; x += 16, k++) {
      px.fillStyle = (k + row) % 2 ? '#2a1a24' : '#15111a'; px.fillRect(x, y, 16, 8); px.fillStyle = (k + row) % 2 ? '#3a2632' : '#201a26'; px.fillRect(x, y, 16, 1); }
    px.fillStyle = '#4a3a46'; px.fillRect(0, GROUND, W, 1);
    // bookshelf under left balcony
    px.fillStyle = '#2a1810'; px.fillRect(20, 136, 76, 48); px.fillStyle = '#3d2618'; px.fillRect(20, 136, 76, 2); px.fillRect(20, 136, 2, 48); px.fillRect(94, 136, 2, 48);
    for (let y = 140; y < 182; y += 11) { px.fillStyle = '#4a2e1c'; px.fillRect(22, y + 9, 72, 2);
      for (let x = 23; x < 93;) { const w = 1 + (R() * 3 | 0), h = 6 + (R() * 3 | 0); if (R() < .12) { x += 3; continue; }
        px.fillStyle = ['#5a1622', '#1e3a5a', '#3a4a22', '#5a3a12', '#3a1f4a', '#6a5a3a'][R() * 6 | 0]; px.fillRect(x, y + 9 - h, w, h);
        px.fillStyle = 'rgba(255,220,150,.25)'; px.fillRect(x, y + 9 - h + 2, w, 1); x += w; } }
    // portrait under right balcony
    px.fillStyle = '#7a5a22'; px.fillRect(300, 138, 52, 40); px.fillStyle = '#e0b85a'; px.fillRect(300, 138, 52, 1); px.fillRect(300, 138, 1, 40);
    px.fillStyle = '#9a7430'; px.fillRect(302, 140, 48, 36); px.fillStyle = '#120c14'; px.fillRect(304, 142, 44, 32);
    const pg = px.createRadialGradient(326, 156, 2, 326, 156, 22); pg.addColorStop(0, '#2a1a2a'); pg.addColorStop(1, '#0c080e'); px.fillStyle = pg; px.fillRect(304, 142, 44, 32);
    px.fillStyle = '#5a1622'; px.fillRect(312, 164, 28, 10); px.fillRect(316, 160, 20, 4); px.fillStyle = '#0a070c'; px.fillRect(318, 162, 16, 12);
    px.fillStyle = '#c8ccd6'; px.fillRect(322, 149, 8, 10); px.fillRect(323, 159, 6, 2); px.fillStyle = '#0a070c'; px.fillRect(321, 146, 10, 4); px.fillRect(325, 150, 2, 1);
    px.fillStyle = '#c2303f'; px.fillRect(323, 152, 1, 1); px.fillRect(328, 152, 1, 1); px.fillStyle = '#ece6da'; px.fillRect(324, 161, 4, 2);
    // balconies with balustrades
    for (const p of [r.plats[0], r.plats[1]]) { ledge(p, '#3a3446', '#5a5068');
      px.fillStyle = '#2f2a3a'; px.fillRect(p.x1, p.y - 9, p.x2 - p.x1, 2); px.fillStyle = '#4a4258'; px.fillRect(p.x1, p.y - 9, p.x2 - p.x1, 1);
      for (let x = p.x1 + 3; x < p.x2 - 2; x += 5) { px.fillStyle = '#2f2a3a'; px.fillRect(x, p.y - 7, 2, 7); px.fillStyle = '#3a3446'; px.fillRect(x, p.y - 5, 3, 2); } }
    // dais steps with carpet
    const stepD = (p, h) => { px.fillStyle = '#2e2836'; px.fillRect(p.x1, p.y, p.x2 - p.x1, h); px.fillStyle = '#4a4258'; px.fillRect(p.x1, p.y, p.x2 - p.x1, 1); px.fillStyle = '#16121c'; px.fillRect(p.x1, p.y + h - 1, p.x2 - p.x1, 1);
      px.fillStyle = '#6a1020'; px.fillRect(p.x1 + 14, p.y, p.x2 - p.x1 - 28, 2); px.fillStyle = '#c9a24a'; px.fillRect(p.x1 + 14, p.y + 2, p.x2 - p.x1 - 28, 1); };
    stepD(r.plats[2], 7); stepD(r.plats[3], 7);
    px.fillStyle = '#6a1020'; px.fillRect(160, GROUND, 64, 2); px.fillStyle = '#c9a24a'; px.fillRect(160, GROUND + 2, 64, 1);
    // throne (calque séparé : il peut se soulever, voir cinema.js)
    const pxRoom = px; let thr; [thr, px] = mk(W, H); r.throne = thr;
    const T = 192;
    px.fillStyle = '#120c12'; px.fillRect(T - 11, 104, 22, 66);
    for (const [x, h] of [[-11, 14], [-5, 20], [0, 26], [5, 20], [10, 14]]) for (let i = 0; i < h; i++) { const w = Math.max(1, Math.round(2.5 * (1 - i / h))); px.fillStyle = '#120c12'; px.fillRect(T + x - w + 1, 104 - i, w * 2 - (x === 0 ? 1 : 0), 1); }
    px.fillStyle = '#c9a24a'; px.fillRect(T, 76, 1, 3); px.fillRect(T - 1, 77, 3, 1);
    px.fillStyle = '#6e1426'; px.fillRect(T - 7, 108, 14, 48); px.fillStyle = '#8a1a30'; px.fillRect(T - 6, 109, 3, 46); px.fillStyle = '#4a0c18'; px.fillRect(T + 4, 109, 2, 46);
    px.fillStyle = '#c9a24a'; px.fillRect(T - 8, 107, 16, 1); px.fillRect(T - 8, 107, 1, 50); px.fillRect(T + 7, 107, 1, 50);
    for (let i = 0; i < 6; i++) px.fillRect(T - 3 + i % 2 * 5, 118 + i * 6, 1, 1);
    px.fillStyle = '#e0b85a'; px.fillRect(T - 1, 114, 3, 3); px.fillStyle = '#ff2a3a'; px.fillRect(T, 115, 1, 1);
    px.fillStyle = '#120c12'; px.fillRect(T - 14, 152, 28, 5); px.fillRect(T - 14, 157, 4, 13); px.fillRect(T + 10, 157, 4, 13);
    px.fillStyle = '#6e1426'; px.fillRect(T - 9, 155, 18, 2); px.fillStyle = '#c9a24a'; px.fillRect(T - 14, 152, 28, 1);
    for (const s of [-1, 1]) { const x = T + s * 15 - 1; px.fillStyle = '#d8d0bc'; px.fillRect(x - 1, 149, 3, 3); px.fillStyle = '#120c12'; px.fillRect(x - 1, 150, 1, 1); px.fillRect(x + 1, 150, 1, 1); px.fillStyle = '#a8a08c'; px.fillRect(x, 152, 1, 1); }
    px = pxRoom;
    // candelabras
    for (const c of [124, 260]) { px.fillStyle = '#16141c'; px.fillRect(c, 152, 2, 32); px.fillRect(c - 3, 182, 8, 2); px.fillRect(c - 6, 154, 14, 1); px.fillRect(c - 6, 150, 1, 4); px.fillRect(c + 7, 150, 1, 4); px.fillRect(c, 148, 2, 4);
      px.fillStyle = '#4a4258'; px.fillRect(c + 1, 152, 1, 30);
      for (const dx of [-6, 0.5, 7]) { const x = Math.round(c + dx); px.fillStyle = '#e8e0c8'; px.fillRect(x, dx === .5 ? 144 : 146, 1, 4); r.fires.push(fire(x, dx === .5 ? 143 : 145, 0)); } }
  }
  // chandelier (dynamic) : 5 candles swinging
  r.cx = 192; r.cy = 86; r.chand = []; for (let i = 0; i < 5; i++) { const f = fire(0, 0, 0); r.chand.push(f); r.fires.push(f); }
  r.update = dt => { const a = Math.sin(time * .8) * .04; r.cx = 192 + Math.sin(a) * 86; r.cy = Math.cos(a) * 86;
    r.chand.forEach((f, i) => { f.x = Math.round(r.cx - 14 + i * 7); f.y = Math.round(r.cy - 6); }); };
  r.dyn = c => { const cx = r.cx, cy = r.cy;
    c.fillStyle = '#16141c'; pline(c, 192, 0, cx, cy - 8, 1);
    const X = Math.round(cx), Y = Math.round(cy); c.fillStyle = '#16141c'; c.fillRect(X - 16, Y, 33, 2); c.fillRect(X - 12, Y + 2, 25, 1); c.fillRect(X - 1, Y - 8, 3, 8);
    c.fillRect(X - 6, Y + 3, 13, 1); c.fillRect(X - 1, Y + 4, 3, 3); c.fillStyle = '#c9a24a'; c.fillRect(X - 16, Y, 33, 1); c.fillRect(X, Y + 6, 1, 2);
    for (let i = 0; i < 5; i++) { const x = X - 14 + i * 7; c.fillStyle = '#16141c'; c.fillRect(x - 1, Y - 1, 3, 1); c.fillStyle = '#e8e0c8'; c.fillRect(x, Y - 5, 1, 4); }
    c.fillStyle = 'rgba(232,224,200,.7)'; c.fillRect(X - 9, Y + 2, 1, 2); c.fillRect(X + 9, Y + 2, 1, 3); };
  r.rays = c => { c.globalCompositeOperation = 'lighter';
    const cols = ['200,40,60', '50,90,220', '230,170,60', '140,50,200'];
    for (let i = 0; i < 4; i++) { const a = .035 + .015 * Math.sin(time * .5 + i * 1.3); c.fillStyle = `rgba(${cols[i]},${a})`;
      c.beginPath(); c.moveTo(178 + i * 7, 60); c.lineTo(186 + i * 7, 60); c.lineTo(150 + i * 22, GROUND); c.lineTo(130 + i * 22, GROUND); c.fill(); }
    for (const [x, d] of [[54, 1], [330, -1]]) { c.fillStyle = `rgba(120,110,200,${.03 + .01 * Math.sin(time * .4 + x)})`;
      c.beginPath(); c.moveTo(x - 18, 70); c.lineTo(x + 18, 70); c.lineTo(x + 18 + d * 50, GROUND); c.lineTo(x - 18 + d * 50, GROUND); c.fill(); }
    c.globalCompositeOperation = 'source-over'; };
  r.lights = () => { glow(r.cx, r.cy - 4, 80, '255,160,70', .2 + .02 * Math.sin(time * 7)); glow(192, 52, 46, '200,80,120', .1); glow(192, 52, 14, '255,220,140', .18);
    glow(54, 90, 34, '110,90,220', .08); glow(330, 90, 34, '110,90,220', .08); };
}
let curRoom = null;   // fixée par place.js
/* ---------------- verticality : extra perches & climbables ---------------- */
function onCanvas(c, fn) { const old = px; px = c.getContext('2d'); fn(); px = old; }
function ivy(c, x, y1, y2, w = 6) { for (let y = y1; y < y2; y++) { const sx = Math.round(Math.sin(y * .22) * 1.2);
  c.fillStyle = '#152a1c'; c.fillRect(x + 1 + sx, y, w - 2, 1);
  for (let i = -1; i <= w; i++) if (R() < .5) { c.fillStyle = ['#1c3526', '#2c5236', '#3d6b44', '#4c7a4c'][R() * 4 | 0]; c.fillRect(x + i + sx, y, 1, 1); } } }
function rope(c, x, y1, y2) { for (let y = y1; y < y2; y++) { c.fillStyle = (y >> 1) % 2 ? '#7a5634' : '#4e3420'; c.fillRect(x, y, 2, 1); }
  c.fillStyle = '#4e3420'; c.fillRect(x - 1, y2 - 3, 4, 3); c.fillRect(x - 1, y2, 1, 2); c.fillRect(x + 2, y2, 1, 2); c.fillStyle = '#2a2a32'; c.fillRect(x - 1, y1, 4, 2); }
function ladder(c, x, y1, y2) { c.fillStyle = '#3a2416'; c.fillRect(x, y1, 1, y2 - y1); c.fillRect(x + 6, y1, 1, y2 - y1);
  c.fillStyle = '#6a4428'; for (let y = y1 + 3; y < y2; y += 5) c.fillRect(x + 1, y, 5, 1); c.fillStyle = '#7a5434'; c.fillRect(x + 6, y1, 1, y2 - y1); c.fillRect(x, y1 - 2, 1, 2); c.fillRect(x + 6, y1 - 2, 1, 2); }
function balustrade(p) { px.fillStyle = '#2f2a3a'; px.fillRect(p.x1, p.y - 9, p.x2 - p.x1, 2); px.fillStyle = '#4a4258'; px.fillRect(p.x1, p.y - 9, p.x2 - p.x1, 1);
  for (let x = p.x1 + 3; x < p.x2 - 2; x += 5) { px.fillStyle = '#2f2a3a'; px.fillRect(x, p.y - 7, 2, 7); px.fillStyle = '#3a3446'; px.fillRect(x, p.y - 5, 3, 2); } }

// --- Salle du trône : chandeliers, corbeaux de pierre, chapiteaux, galeries, haut du trône, lustre mobile, échelle, rideau
{ const r = ROOMS.trone;
  const corb = [{ x1: 128, x2: 152, y: 126 }, { x1: 232, x2: 256, y: 126 }], gal = [{ x1: 84, x2: 140, y: 66 }, { x1: 244, x2: 300, y: 66 }];
  r.plats.push({ x1: 118, x2: 132, y: 148 }, { x1: 254, x2: 268, y: 148 }, ...corb, { x1: 103, x2: 121, y: 98 }, { x1: 263, x2: 281, y: 98 }, { x1: 186, x2: 198, y: 103 }, ...gal);
  r.chandPlat = { x1: 176, x2: 209, y: 86, moving: 1 }; r.plats.push(r.chandPlat);
  onCanvas(r.play, () => {
    for (const p of corb) ledge(p, '#3a3446', '#5a5068');
    for (const p of gal) { ledge(p, '#3a3446', '#5a5068'); balustrade(p); }
    ladder(px, 93, 120, 184);
    for (let x = 287; x < 298; x++) { px.fillStyle = (x - 287) % 3 === 0 ? '#3e0a14' : (x - 287) % 3 === 1 ? '#6e1426' : '#8a1a30'; px.fillRect(x, 133, 1, 51 + ((x * 7) % 3)); }
    px.fillStyle = '#2a2a32'; px.fillRect(285, 132, 14, 1); px.fillStyle = '#c9a24a'; px.fillRect(287, 160, 11, 2); px.fillRect(291, 162, 2, 4); px.fillRect(290, 166, 4, 1);
  });
  r.climbs = [{ x1: 92, x2: 101, y1: 124, y2: 184, kind: 'échelle' }, { x1: 286, x2: 298, y1: 124, y2: 184, kind: 'rideau' }];
  const upd = r.update;
  r.update = dt => { upd(dt); const p = r.chandPlat, nx = r.cx - 16, dx = nx - p.x1, ny = r.cy;
    p.x1 = nx; p.x2 = r.cx + 17; p.y = ny;
    for (const e of allEnts()) if (e.room === 'trone' && e.ground && e.plat === p) { e.x += dx; e.y = ny; } };
}


/* ---------------- fires & particles ---------------- */
const embers = [], puffs = [];
const motes = Array.from({ length: 36 }, () => ({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - .5) * 4, vy: -1 - Math.random() * 3, ph: Math.random() * 6 }));
const FLAME = ['#fff6c8', '#ffd25a', '#ff9a2e', '#e2512a', '#7a2a24'];
function updateFires(dt) {
  for (const f of curRoom.fires) { const big = f.size === 2, rate = big ? 70 : f.size ? 28 : 12; let n = rate * dt;
    while (n > 0) { if (Math.random() < n) { const s = big ? 2 + Math.random() * 3 : f.size ? 1 + Math.random() * 2 : 1;
      f.p.push({ x: f.x + (Math.random() - .5) * (big ? 9 : f.size ? 3 : 1), y: f.y, vx: (Math.random() - .5) * 6, vy: -(big ? 18 : 10) - Math.random() * (f.size ? 18 : 8), life: 0, max: (big ? .45 : f.size ? .35 : .22) + Math.random() * (f.size ? .35 : .15), s }); } n--; }
    if (big && Math.random() < dt * 4) embers.push({ x: f.x + (Math.random() - .5) * 6, y: f.y - 4, vx: (Math.random() - .5) * 12, vy: -25 - Math.random() * 30, life: 0, max: 1.4 + Math.random() * 1.8, ph: Math.random() * 6 });
    for (const q of f.p) { q.life += dt; q.vy -= 20 * dt; q.x += (q.vx + Math.sin(time * 9 + q.y) * 6) * dt; q.y += q.vy * dt; q.x += (f.x - q.x) * dt * (f.size ? 2.5 : 8); q.x -= (curRoom.wind || 0) * 34 * dt * (.3 + q.life / q.max); }
    f.p = f.p.filter(q => q.life < q.max); }
  for (const e of embers) { e.life += dt; e.x += (e.vx + Math.sin(time * 3 + e.ph) * 10) * dt; e.y += e.vy * dt; e.vy += 4 * dt; }
  for (let i = embers.length - 1; i >= 0; i--) if (embers[i].life > embers[i].max) embers.splice(i, 1);
  for (const p of puffs) { p.life += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= .92; p.vy *= .92; p.vy -= 6 * dt; }
  for (let i = puffs.length - 1; i >= 0; i--) if (puffs[i].life > puffs[i].max) puffs.splice(i, 1);
  for (const m of motes) { m.x += (m.vx + Math.sin(time * .7 + m.ph) * 3) * dt; m.y += m.vy * dt; if (m.y < 0) { m.y = H; m.x = Math.random() * W; } if (m.x < 0) m.x += W; if (m.x > W) m.x -= W; }
}
function drawFlames(back) { for (const f of curRoom.fires) { if (f.back !== back) continue;
  for (const q of f.p) { const t = q.life / q.max; const s = Math.max(1, Math.round(q.s * (1 - t * .8)));
    ctx.fillStyle = FLAME[Math.min(4, (t * 5) | 0)]; ctx.fillRect(Math.round(q.x - s / 2), Math.round(q.y - s / 2), s, s); }
  ctx.fillStyle = '#fff6c8'; ctx.fillRect(f.x - (f.size === 2 ? 2 : 0), f.y - (f.size ? 2 : 1), f.size === 2 ? 4 : 1, f.size ? 2 : 1); } }
function puff(x, y, n, col = '#8394a2', spread = 1) { for (let i = 0; i < n; i++) puffs.push({ x, y, vx: (Math.random() - .5) * 40 * spread, vy: -Math.random() * 14 * spread, life: 0, max: .3 + Math.random() * .35, c: col }); }
