"use strict";
// La monture : un phénix noir aux plumes de braise.
// Touche F (ou bouton « Monture ») pour l'appeler ou le renvoyer. Une fois dessus, on vole librement avec les flèches.

const PXC = { body: '#1c151b', bodyHi: '#33242d', belly: '#0c090d', dk: '#120d12', mid: '#251b24', hi: '#43303b',
  rim: '#8a2c1a', crim: '#b8301c', ember: '#ff7a2a', ember2: '#ffb347', ember3: '#ffe08a', beak: '#d8902e', beak2: '#ffd070', eye: '#ffe27a', leg: '#3a2a22' };
const flyaways = [];
const easeIO = t => t * t * (3 - 2 * t);

function makePhx(e) {
  const tail = [0, 1, 2].map(() => Array.from({ length: 14 }, (_, i) => ({ x: e.x - e.face * (12 + i * 3), y: e.y - 12, px: e.x - e.face * (12 + i * 3), py: e.y - 12 })));
  return { ph: Math.random(), tail, appear: 0, bob: 0, glide: 0, landed: false };
}
function toggleMount(e, remote) {
  if (!e || e.climbing || e.transit) return;
  if (!e.mount) {
    e.mount = true; e.phx = makePhx(e); e.act = null; e.ground = false; e.vy = -70;
    phxBurst(e.x, e.y - 12, 28); if (e.room === curRoom.id) sfx.summon();
    if (e === player && !remote) toast('Phénix noir invoqué ! <i>Les flèches pour voler, F pour descendre</i>');
  } else {
    e.mount = false; flyaways.push({ x: e.x, y: e.y, face: e.face, t: 0, phx: e.phx, room: e.room, vy: -40, ground: false, spd: 90 });
    e.phx = null; e.vy = -170; e.ground = false; phxBurst(e.x, e.y - 12, 12); if (e.room === curRoom.id) sfx.dismiss();
  }
}
function phxBurst(x, y, n) {
  for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2, v = 20 + Math.random() * 70;
    embers.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 25, life: 0, max: .5 + Math.random() * .9, ph: Math.random() * 6 }); }
  for (let i = 0; i < n / 2; i++) fxs.push({ k: 'feather', x: x + (Math.random() - .5) * 22, y: y + (Math.random() - .5) * 10, vx: (Math.random() - .5) * 40, vy: -10 - Math.random() * 25, t: 0, max: 1 + Math.random(), g: 22 });
}

/* ---------------- vol ---------------- */
function stepMount(e, inp, dt) {
  const R = ROOMS[e.room], plats = R.plats;
  const h = (inp.r ? 1 : 0) - (inp.l ? 1 : 0), v = (inp.down ? 1 : 0) - (inp.up || inp.jump ? 1 : 0);
  e.vx += (h * 96 - e.vx) * Math.min(1, dt * 3.2);
  e.vy += (v * 86 - e.vy) * Math.min(1, dt * (v ? 3.4 : 2.4));
  if (h) e.face = h;
  if (e.ground && (h || v < 0)) e.vy = Math.min(e.vy, -45);           // décollage
  const py = e.y; e.x = clamp(e.x + e.vx * dt, 6, W - 6); e.y += e.vy * dt;
  const top = R.up ? -99 : 46;                                            // pas de sortie par le haut s'il n'y a rien au-dessus
  if (e.y < top) { e.y = top; e.vy = Math.max(0, e.vy); }
  e.ground = false; e.plat = null;
  if (R.ground !== null && e.y >= GROUND) { e.y = GROUND; e.vy = 0; e.ground = true; }
  else if (e.vy >= 0) for (const p of plats) if (!inp.down || p.solid) if (e.x > p.x1 - 2 && e.x < p.x2 + 2 && py <= p.y + .01 && e.y >= p.y) { e.y = p.y; e.vy = 0; e.ground = true; e.plat = p; }
  e.coyote = 0; e.jbuf = 0;
}
function wingState(P, lag = 0) {
  if (P.landed) return { d: .66, k: .52 };
  const s = (P.ph - lag + 1) % 1;
  let d = s < .42 ? easeIO(s / .42) : 1 - easeIO((s - .42) / .58);       // 0 = ailes hautes, 1 = ailes basses
  let k = s < .42 ? 1 : .7 + .3 * Math.abs(Math.cos(Math.PI * (s - .42) / .58)); // repli à la remontée
  d = d * (1 - P.glide) + .5 * P.glide; k = k * (1 - P.glide) + P.glide;
  return { d, k };
}
function updatePhx(e, dt) {
  const P = e.phx; if (!P) return;
  P.appear = Math.min(1, P.appear + dt * 3);
  const climb = Math.max(0, -e.vy / 86), dive = Math.max(0, e.vy / 86), sp = Math.min(1, Math.abs(e.vx) / 96);
  P.landed = e.ground;
  const ph0 = P.ph; P.ph = (P.ph + dt * (P.landed ? .5 : Math.max(.5, 1.5 + 2 * climb + .6 * sp - .9 * dive))) % 1;
  if (P.ph < ph0 && !P.landed && P.glide < .5 && e.room === curRoom.id && !e.t) sfx.flap(e === player ? 1 : .35);
  P.glide += ((P.landed ? 0 : clamp(dive * 1.1 + (sp > .7 && climb < .05 ? .3 : 0), 0, .85)) - P.glide) * Math.min(1, dt * 4);
  const ws = wingState(P); P.bob = P.landed ? 0 : ws.d > .72 ? -1 : ws.d < .25 ? 1 : 0;
  const f = e.face, bx = e.x - f * 12, by = e.y - 12 + P.bob, k = Math.min(1, dt * 60), wind = ROOMS[e.room].wind || 0;
  P.tail.forEach((pts, s) => {
    pts[0].x = bx; pts[0].y = by + (s - 1) * 1.5;
    for (let i = 1; i < pts.length; i++) { const q = pts[i], vx = (q.x - q.px) * .9, vy = (q.y - q.py) * .9; q.px = q.x; q.py = q.y;
      q.x += vx + (-f * .24 - wind * .1 + Math.sin(time * 5 + i * .6 + s * 2) * .04) * k; q.y += vy + (.012 + (s - 1) * .03 + Math.cos(time * 4.5 - i * .55 + s) * .06) * k; }
    for (let it = 0; it < 3; it++) for (let i = 1; i < pts.length; i++) { const a = pts[i - 1], b = pts[i], dx = b.x - a.x, dy = b.y - a.y, dd = Math.hypot(dx, dy) || .001, r = (dd - 3) / dd; b.x -= dx * r; b.y -= dy * r; }
    if (e.room === curRoom.id && Math.random() < dt * 6) { const t = pts[pts.length - 1]; embers.push({ x: t.x, y: t.y, vx: (Math.random() - .5) * 10, vy: -8 - Math.random() * 10, life: 0, max: .4 + Math.random() * .6, ph: Math.random() * 6 }); }
  });
  if (e.room === curRoom.id && !P.landed && Math.random() < dt * 1.2) fxs.push({ k: 'feather', x: e.x - f * 6, y: e.y - 8, vx: -f * 10, vy: 6, t: 0, max: 1.4, g: 10 });
}

/* ---------------- dessin ---------------- */
function phxDraw(c, e, layer) {
  const P = e.phx, f = e.face, ox = Math.round(e.x), oy = Math.round(e.y), b = P.bob;
  const px = (x, y, w, h, col) => { c.fillStyle = col; const X = Math.round(x), Y = Math.round(y); c.fillRect(f === 1 ? ox + X : ox - X - w, oy + Y, w, h); };
  const line = (x0, y0, x1, y1, w, colFn) => { const n = Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0))) + 1, o = (w - 1) / 2;
    for (let i = 0; i <= n; i++) { const t = i / n; px(x0 + (x1 - x0) * t - o, y0 + (y1 - y0) * t - o, w, w, colFn(t)); } };
  const wing = (far) => {
    const ws = wingState(P, far ? .06 : 0), d = ws.d, k = ws.k * (far ? .86 : 1);
    const phi = (-100 - 145 * d) * Math.PI / 180, sgn = Math.sign(-Math.PI - phi) || 1;
    const S = { x: far ? 1 : -1, y: -16 + b - (far ? 1 : 0) }, arm = 11 * (.8 + .2 * k), Wr = { x: S.x + Math.cos(phi) * arm, y: S.y + Math.sin(phi) * arm };
    const L = [27, 26, 24, 22, 19, 16, 13, 10];
    for (let i = 7; i >= 0; i--) { const base = i <= 2 ? Wr : { x: Wr.x + (S.x - Wr.x) * (i - 2) / 6, y: Wr.y + (S.y - Wr.y) * (i - 2) / 6 };
      const a = phi + sgn * i * (.1 + .05 * k), len = L[i] * k;
      line(base.x, base.y, base.x + Math.cos(a) * len, base.y + Math.sin(a) * len, i < 3 ? 3 : 2, t => far
        ? (t < .72 ? PXC.dk : t < .88 ? '#5a1c14' : PXC.crim)
        : (t < .62 ? (i % 2 ? PXC.mid : PXC.dk) : t < .78 ? PXC.crim : t < .9 ? PXC.ember : PXC.ember2)); }
    line(S.x, S.y, Wr.x, Wr.y, 4, () => far ? PXC.dk : PXC.body);
    if (!far) line(S.x, S.y - 1, Wr.x, Wr.y - 1, 1, () => PXC.hi);
  };
  c.globalAlpha = P.appear * (e.alpha ?? 1);
  if (layer === 'back') {
    wing(true);
    P.tail.forEach((pts, s) => { for (let i = 0; i < pts.length - 1; i++) { const a = pts[i], q = pts[i + 1], w = i < 4 ? 3 : i < 9 ? 2 : 1;
      const col = i < 5 ? (s === 1 ? PXC.mid : PXC.dk) : i < 8 ? PXC.crim : i < 11 ? PXC.ember : (Math.sin(time * 14 + s + i) > 0 ? PXC.ember3 : PXC.ember2);
      c.fillStyle = col; const n = 3; for (let j = 0; j <= n; j++) c.fillRect(Math.round(a.x + (q.x - a.x) * j / n) - (w >> 1), Math.round(a.y + (q.y - a.y) * j / n) - (w >> 1), w, w); } });
    // corps
    for (let y = -6; y <= 6; y++) for (let x = -13; x <= 12; x++) { const nx = x / 12.5, ny = y / 5.8; if (nx * nx + ny * ny > 1) continue;
      px(x, -12 + b + y, 1, 1, ny < -.5 ? PXC.bodyHi : ny > .4 ? PXC.belly : (x < -8 && (x + y) % 3 === 0) ? PXC.mid : PXC.body); }
    for (let x = -10; x <= 6; x++) if ((x + Math.floor(time * 8)) % 3 === 0) px(x, -18 + b + (Math.abs(x) > 7 ? 1 : 0), 1, 1, PXC.rim);
    // pattes
    if (P.landed) { for (const lx of [-2, 3]) { px(lx, -7, 2, 7, PXC.leg); px(lx - 1, -1, 4, 1, PXC.leg); px(lx + 3, -1, 1, 1, PXC.ember2); } }
    else { px(-5, -7 + b, 4, 1, PXC.leg); px(-6, -6 + b, 2, 1, PXC.leg); px(-7, -6 + b, 1, 1, PXC.ember2); }
    // cou, tête, bec, œil, crête de flammes
    line(9, -14 + b, 15, -22 + b, 4, () => PXC.body); line(10, -16 + b, 15, -23 + b, 1, () => PXC.hi); line(11, -13 + b, 16, -19 + b, 1, () => PXC.rim);
    for (let y = -4; y <= 4; y++) for (let x = -4; x <= 4; x++) if (x * x + y * y <= 13) px(16 + x, -24 + b + y, 1, 1, y < -1 ? PXC.bodyHi : PXC.body);
    px(20, -25 + b, 2, 1, PXC.beak); px(20, -24 + b, 3, 1, PXC.beak2); px(22, -23 + b, 1, 1, PXC.beak); px(20, -23 + b, 1, 1, PXC.beak);
    px(17, -26 + b, 2, 1, PXC.eye); px(18, -25 + b, 1, 1, PXC.ember);
    for (let cI = 0; cI < 4; cI++) { const len = 6 + cI * 1.5 + Math.round(Math.sin(time * 12 + cI * 2) * 1.2);
      for (let i = 0; i < len; i++) { const t = i / len; px(14 - cI - i * .9, -27 + b - i * (.7 - cI * .14) + cI, i < 2 ? 2 : 1, 1, t < .3 ? PXC.ember3 : t < .6 ? PXC.ember : PXC.crim); } }
  } else wing(false);
  c.globalAlpha = 1;
}
function drawMounted(e, target) {
  phxDraw(target, e, 'back');
  const P = e.phx; drawPetit(e);
  target.globalAlpha = Math.min(1, e.alpha ?? 1);
  target.drawImage(sc, Math.round(e.x - e.face * 3) - BOX, Math.round(e.y - 14 + P.bob) - BOY);
  target.globalAlpha = 1;
  phxDraw(target, e, 'front');
}
function phxShadow(e) {
  const plats = ROOMS[e.room].plats; let sy = ROOMS[e.room].ground === null ? null : GROUND;
  for (const p of plats) if (e.x > p.x1 && e.x < p.x2 && p.y >= e.y - .5 && (sy === null || p.y < sy)) sy = p.y;
  if (sy === null) return; const h = sy - e.y, w = Math.round(26 * Math.max(.3, 1 - h / 140)); if (w < 4) return;
  ctx.fillStyle = `rgba(0,0,0,${.35 * Math.max(.2, 1 - h / 140)})`; ctx.fillRect(Math.round(e.x) - (w >> 1), Math.round(sy), w, 1); ctx.fillRect(Math.round(e.x) - (w >> 1) + 2, Math.round(sy) + 1, w - 4, 1);
}
function updateFlyaways(dt) {
  for (const a of flyaways) { a.t += dt; a.x += a.face * 75 * dt; a.y -= 55 * dt; a.vy = -60; a.vx = a.face * 75; a.ground = false;
    updatePhx(a, dt); a.phx.appear = Math.max(0, 1 - a.t / 1.3); }
  for (let i = flyaways.length - 1; i >= 0; i--) if (flyaways[i].t > 1.3) flyaways.splice(i, 1);
}
function drawFlyaways() { for (const a of flyaways) if (a.room === curRoom.id) { phxDraw(ctx, a, 'back'); phxDraw(ctx, a, 'front'); } }
function phxLights(ents) {
  for (const e of ents) if (e.phx) { const f = e.face;
    glow(e.x + f * 17.5, e.y - 25.5 + e.phx.bob, 4, '255,220,120', .4);
    glow(e.x, e.y - 12, 32, '255,90,30', .08 + .03 * Math.sin(time * 5));
    for (const pts of e.phx.tail) { const t = pts[pts.length - 1]; glow(t.x, t.y, 9, '255,130,40', .16); } }
}
