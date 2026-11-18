"use strict";
// Le petit encapuchonné : animations, rendu pixel par pixel, accessoires.

/* ================= CHARACTERS : petit encapuchonné ================= */
// Chaque personnage : son nom, sa palette (pal) et sa fonction de dessin (draw). Les autres sont dans scaphandre.js et sprites.js…
const SKINS = { capuche: { label: 'Capuche', swatch: 'Couleur de capuche', nameY: 38, colors: REGLES.COULEURS_BASE, pal: c => makePal(c), draw: e => drawCapuche(e) } };
const LAND = '#8394a2';
function rgbArr(s) { if (s[0] === '#') { const n = parseInt(s.slice(1), 16); return [n >> 16, n >> 8 & 255, n & 255]; } return s.match(/\d+/g).slice(0, 3).map(Number); }
// palette indices : 1 outline · 2 deep · 3 dark · 4 base · 5 light · 6 face · 7 eyes · 8 strings · 9 boots · 10 rim
function makePal(c) { return [null, shade(c, .2), shade(c, .4), shade(c, .64), c, shade(c, 1.38), '#06060d', '#ffffff', '#eceae2', shade(c, .5), shade(c, 1.75), '#d0414a', '#7a1e2a', '#e8c860', '#9a7428', '#f0a0b8', '#ffe48a', '#f4f0fa'].map(v => v && rgbArr(v)); }
let idc = 0;
function setSkin(e, skin, color) { e.skin = SKINS[skin] ? skin : 'capuche'; e.color = color; e.pal = SKINS[e.skin].pal(color); }
function makeEnt(name, color, x, kind, skin) {
  const e = { id: kind + (idc++) + '_' + Math.random().toString(36).slice(2, 7), name, x, y: GROUND, vx: 0, vy: 0, face: 1, ground: true,
    walk: 0, cph: 0, coyote: 0, jbuf: 0, drop: 0, bubble: null, seed: Math.random() * 10, kind, tx: x, ty: GROUND, last: 0,
    idleT: 0, landT: 0, waveT: 0, spd: 0, hy: 0, hv: 0, tipX: 0, tv: 0, A: null, room: 'remparts', climbing: null, acc: null, lvl: 1, act: null, emo: null, mount: false, phx: null };
  setSkin(e, skin, color); e.A = anim(e, 0, 0); return e;
}
function anim(e, sw, s) {
  const A = { bob: 0, sqH: 0, sqW: 0, ff: [2, 0], bf: [-2, 0], sf: [0, 0], sb: [0, 0], flB: 0, flF: 0, look: 0, lean: 0, tip: 0, hood: 0, eyes: 'open', back: false };
  const tw = Math.PI * 2;
  if (e.climbing) { const c = Math.sin(e.cph * tw);
    Object.assign(A, { back: true, sf: [-1, -7 + Math.round(2 * c)], sb: [1, -7 - Math.round(2 * c)], ff: [1, -Math.max(0, Math.round(2.4 * c))], bf: [-1, -Math.max(0, Math.round(-2.4 * c))] });
    return A; }
  if (e.mount) { Object.assign(A, { bob: 3, ff: [3, 0], bf: [1, 0], sf: [2, -1], sb: [-1, 0], look: 1, lean: 1, tip: -3, flB: 1, eyes: e.vy < -50 ? 'happy' : 'open' });
    if (A.eyes === 'open' && ((time + e.seed * 3) % 4.3) < .12) A.eyes = 'blink'; return A; }
  if (!e.ground) {
    if (e.vy < -30) Object.assign(A, { sqH: -1, sqW: -1, ff: [1, -1], bf: [-1, -2], sf: [1, -3], sb: [-1, -2], hood: 1, tip: 2, lean: 1, look: 1 });
    else Object.assign(A, { flB: 2, flF: 2, ff: [1, 0], bf: [-2, -1], sf: [3, -4], sb: [-3, -4], hood: -1, tip: -2, eyes: 'wide', look: 1 });
  } else if (sw > .02) {
    const p = e.walk, c = Math.sin(tw * p), cs = Math.cos(tw * p), a = sw;
    A.ff = [Math.round(.5 + 2.7 * c * a), cs > .3 && a > .25 ? -1 : 0];
    A.bf = [Math.round(-.5 - 2.7 * c * a), cs < -.3 && a > .25 ? -1 : 0];
    A.bob = Math.abs(cs) > .55 && a > .3 ? -1 : 0;
    A.sqW = Math.abs(c) > .9 && a > .5 ? 1 : 0;
    A.sf = [-Math.round(1.7 * c * a), Math.abs(c) > .7 && a > .5 ? -1 : 0]; A.sb = [Math.round(1.7 * c * a), 0];
    A.flB = Math.round(1.4 * a); A.lean = a > .3 ? 1 : 0; A.look = a > .15 ? 1 : 0; A.tip = -Math.round(2.5 * a);
  } else {
    const b = Math.sin(time * 2.4 + e.seed); A.sqH = b > .55 ? 1 : 0;
    if (e.idleT > 3) { const ph = (e.idleT + e.seed * 2) % 7; if (ph < 1.3) A.look = 1; else if (ph > 3.5 && ph < 4.7) A.look = -1; else if (ph > 5.6 && ph < 6.2) A.sqH = 1; }
  }
  if (e.slideT > 0 && e.ground) Object.assign(A, { sqH: 3, sqW: 2, ff: [5, 0], bf: [3, 0], sf: [-3, 1], sb: [-4, 0], lean: -1, look: 1, tip: -4, eyes: 'wide', flB: 2 });
  if (e.landT > 0 && e.ground) { const l = clamp(e.landT / .16, 0, 1); A.sqH = Math.round(2.4 * l); A.sqW = Math.round(2 * l); A.ff = [3, 0]; A.bf = [-3, 0]; A.sf = [1, 1]; A.sb = [-1, 1]; A.bob = 0; }
  if (e.waveT > 0) { A.sf = [5 + Math.round(Math.sin(time * 16)), -8]; A.eyes = 'happy'; A.look = 0; }
  if (e.act && e.ground && !e.climbing) { const a = e.act, t = a.t;
    if (a.id === 'sit' || a.id === 'sleep') { Object.assign(A, { bob: Math.round(3 * Math.min(1, t * 7)), ff: [3, 0], bf: [1, 0], sf: [0, 1], sb: [0, 1], look: 0, flB: 1, flF: 1, sqW: 1, lean: 0, tip: 0 });
      if (a.cine) A.back = true;
      if (e.acc === 'lute') { A.sf = [1, Math.floor(time * (SND.vive > time ? 10 : 6)) % 2]; if (SND.vive > time) A.eyes = 'happy'; }
      if (a.id === 'sleep') { A.eyes = 'shut'; A.hood = Math.sin(time * 1.6) > 0 ? 1 : 0; } }
    if (a.id === 'dance') { const bt = Math.floor(t * 4); Object.assign(A, { bob: bt % 2 ? -1 : 0, sf: [bt % 4 < 2 ? 1 : 2, bt % 2 ? -7 : -3], sb: [-1, bt % 2 ? -3 : -7], ff: [2, bt % 2 ? -1 : 0], bf: [-2, bt % 2 ? 0 : -1], eyes: 'happy', look: 0, tip: bt % 2 ? 2 : -2 }); }
    if (a.id === 'laugh') Object.assign(A, { lean: Math.floor(t * 10) % 2, sqH: Math.floor(t * 8) % 2, eyes: 'happy', sf: [0, -1] });
    if (a.id === 'heart') Object.assign(A, { eyes: 'happy', sf: [-2, -2], sb: [2, -2], look: 0 });
    if (a.id === 'surprise') Object.assign(A, { eyes: 'wide', sf: [2, -5], sb: [-2, -5] });
    if (a.id === 'angry') { const st = Math.floor(t * 5) % 2; Object.assign(A, { eyes: 'angry', sqH: st, sqW: st, sf: [1, 0], sb: [-1, 0], look: 0 }); } }
  if (e.act && e.act.id === 'attack') { const t = e.act.t / e.act.dur; Object.assign(A, t < .35 ? { sf: [-2, -5], lean: -1, sqH: 1 } : { sf: [6, -2], lean: 1, eyes: 'angry', sqW: 1 }); }
  if (e.transit && e.transit.t > .2) { A.back = true; A.look = 0; }
  if (A.eyes === 'open' && ((time + e.seed * 3) % 4.3) < .12) A.eyes = 'blink';
  return A;
}
function updateAnim(e, dt) {
  tickAct(e, dt);
  const mdx = e.lx === undefined ? 0 : e.x - e.lx, mdy = e.ly === undefined ? 0 : e.y - e.ly; e.lx = e.x; e.ly = e.y;
  const jump = Math.abs(mdx) > 24 || Math.abs(mdy) > 24, idt = 1 / Math.max(dt, 1e-3);
  e.spd += ((e.fakeSpd ?? (jump ? 0 : Math.abs(mdx) * idt)) - e.spd) * Math.min(1, dt * 12);
  const grounded = e.ground && !e.climbing;
  if (grounded && e.wasGround === false && e.prevVy > 110) { e.landT = .16; e.hv += 70; if (e === player) sfx.land(clamp(e.prevVy / 320, .3, 1)); }
  e.prevVy = e.climbing ? 0 : (e.kind === 'remote' ? mdy * idt : e.vy); e.wasGround = grounded;
  e.landT -= dt; e.waveT -= dt;
  e.idleT = grounded && e.spd < 5 ? e.idleT + dt : 0;
  const s = Math.min(1.5, e.spd / 80), sw = clamp((e.spd - 3) / 22, 0, 1);
  if (grounded && sw > 0) { const prev = e.walk; e.walk += dt * (1.5 + 1.6 * s) * (.4 + .6 * sw);
    if (s > .4 && Math.floor(prev * 2) !== Math.floor(e.walk * 2) && e.room === curRoom.id && !e.fakeSpd) puff(e.x - e.face * 2, e.y - 1, 2, LAND, .4);
    if (e === player && Math.floor(prev * 2) !== Math.floor(e.walk * 2)) sfx.step(); }
  if (e.climbing) { const pc = e.cph; e.cph += dt * (jump ? 0 : Math.hypot(mdx, mdy) * idt) / 16; if (e === player && Math.floor(pc * 2) !== Math.floor(e.cph * 2)) sfx.climb(); }
  e.A = anim(e, grounded ? sw : 0, s);
  const tgt = e.A.bob + e.A.sqH + e.A.hood;
  e.hv += ((tgt - e.hy) * 320 - e.hv * 14) * dt; e.hy += e.hv * dt; e.hy = clamp(e.hy, -4, 5);
  const wind = ROOMS[e.room] ? ROOMS[e.room].wind || 0 : 0;
  const tt = e.A.tip - (e.ground ? 0 : e.vy / 160) - wind * e.face * (2.4 + Math.sin(time * 9 + e.seed) * .9);
  e.tv += ((tt - e.tipX) * 200 - e.tv * 11) * dt; e.tipX += e.tv * dt; e.tipX = clamp(e.tipX, -4, 4);
  if (e.slideT > 0) e.slideT -= dt;
  if (SKINS[e.skin].upd) SKINS[e.skin].upd(e, dt);
  if (e.phx) updatePhx(e, dt);
}

/* ---------------- pixel buffer renderer ---------------- */
// Chaque personnage est dessiné dans un petit tampon (BW×BH) dont les pieds sont au point (BOX, BOY).
// La plupart font 37×44 ; un personnage peut demander un tampon plus grand (SKINS[...].size), comme le Rōnin géant.
const SIZE_STD = { w: 37, h: 44, ox: 18, oy: 41 }, BUFS = {};
let BW, BH, BOX, BOY, buf, tmp, img, sc, scx;
function useBuf(s) { const k = s.w + 'x' + s.h; let b = BUFS[k];
  if (!b) { const [c, x] = mk(s.w, s.h); b = BUFS[k] = { buf: new Uint8Array(s.w * s.h), tmp: new Uint8Array(s.w * s.h), img: new ImageData(s.w, s.h), sc: c, scx: x }; }
  ({ buf, tmp, img, sc, scx } = b); BW = s.w; BH = s.h; BOX = s.ox; BOY = s.oy; }
useBuf(SIZE_STD);
function put(x, y, c) { x = Math.round(x); y = Math.round(y); if (x < 0 || y < 0 || x >= BW || y >= BH) return; buf[y * BW + x] = c; }
const vol = (nx, ny) => { const d = nx * .55 - ny * .85; return d > .5 ? 5 : d < -.55 ? 3 : 4; };
function ell(cx, cy, rx, ry, fn) { for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
  const nx = (x - cx) / rx, ny = (y - cy) / ry; if (nx * nx + ny * ny <= 1.02) { const c = fn(nx, ny, x, y); if (c) put(x, y, c); } } }
// zone du tampon montrée dans les menus (par défaut tout le tampon ; un personnage en sprites donne un cadrage plus serré)
const previewRect = k => SKINS[k].prev || { x: 0, y: 0, w: BW, h: BH };
function drawPetit(e) { e.glowW = null; useBuf(SKINS[e.skin].size || SIZE_STD); SKINS[e.skin].draw(e); }
function drawCapuche(e) {
  buf.fill(0); const A = e.A, X = BOX, G = BOY, b = A.bob, hy = Math.round(e.hy);
  const top = G - 16 + b + A.sqH, hem = G - 5 + b;
  // feet & little legs (back first)
  const foot = (fx, fy, back) => { const x0 = X + fx, c = back ? 2 : 9;
    for (let y = hem + 1; y <= G - 3 + fy; y++) put(x0, y, c);
    for (let i = -1; i <= 1; i++) { put(x0 + i, G - 2 + fy, c); put(x0 + i, G - 1 + fy, c); } put(x0 + 2, G - 1 + fy, c);
    if (!back) { put(x0 - 1, G - 2 + fy, 3); put(x0, G - 2 + fy, 3); } };
  foot(A.bf[0], A.bf[1], true); foot(A.ff[0], A.ff[1], false);
  // back sleeve
  const sleeve = (sx, sy, back) => { const x0 = X + sx, y0 = top + 2 + sy;
    for (let j = 0; j < 5; j++) for (let i = 0; i < 3; i++) { if ((j === 0 || j === 4) && i !== 1 && j === 0) continue; put(x0 + i - 1, y0 + j, back ? 3 : j === 0 ? 5 : j === 4 ? 2 : (i === 2 ? 5 : 4)); } };
  sleeve(-5 + A.sb[0], A.sb[1], true);
  // coat
  for (let y = top; y <= hem; y++) { const t = (y - top) / Math.max(1, hem - top);
    const L = Math.round(X - (3.6 + 2.6 * t + A.sqW + A.flB * t * t)), R = Math.round(X + (3.6 + 2.6 * t + A.sqW + A.flF * t * t));
    for (let x = L; x <= R; x++) { const nx = ((x - X) / Math.max(1, R - L)) * 2; let c = vol(nx, t * 2 - 1);
      if (y === hem) c = x === R ? 3 : 2; else if (nx < -.55) c = Math.min(c, 3); put(x, y, c); } }
  if (!A.back) { const zx = X + 1 + A.look; for (let y = top + 2; y < hem; y++) put(zx, y, 3);
    for (let y = top + 1; y <= top + 4; y++) { put(zx - 1, y, 8); put(zx + 2, y, 8); } put(zx - 1, top + 5, 5); put(zx + 2, top + 5, 5); }
  else { for (let y = top + 1; y < hem; y++) put(X, y, 3); }
  // hood
  const hcx = X + A.lean, hcy = G - 21 + b + hy;
  if (e.acc !== 'ears') for (const [dy, x0, x1, k] of [[-6, -5, 0, 0], [-7, -5, -1, 1], [-8, -6, -3, 2], [-9, -7, -5, 3]]) { const o = Math.round(e.tipX * k / 3);
    for (let x = x0; x <= x1; x++) put(hcx + x + o, hcy + dy, x === x0 ? 3 : (k > 0 && x === x1) || k === 3 ? 5 : 4); }
  if (e.acc === 'ears') for (const s2 of [-1, 1]) { const ex = hcx + s2 * 4; for (let j = 0; j < 4; j++) for (let i = 0; i <= 3 - j; i++) { const x = s2 < 0 ? ex - 1 + i : ex + 1 - i; put(x, hcy - 5 - j, j === 3 || i === 0 ? 4 : (i === 1 && j < 2 ? 15 : 5)); } }
  ell(hcx, hcy, 7.2, 6.6, (nx, ny) => vol(nx, ny));
  ell(hcx, hcy + 5.6, 6.2, 1.6, (nx, ny, x, y) => y > hcy + 4 ? 3 : 0);
  if (!A.back) {
    const fcx = hcx + 1 + A.look, fcy = hcy + 1;
    ell(fcx - .2, fcy - .4, 5.4, 4.8, (nx, ny) => ny < .2 && nx > -.6 ? 10 : 0);
    ell(fcx, fcy, 4.6, 4, () => 6);
    const ey = Math.round(fcy) - 1, L = Math.round(fcx) - 3, Rr = Math.round(fcx) + 1;
    [L, Rr].forEach((ex, k) => {
      if (A.eyes === 'open') { put(ex, ey, 7); put(ex + 1, ey, 7); put(ex, ey + 1, 7); put(ex + 1, ey + 1, 7); }
      else if (A.eyes === 'wide') { for (let j = -1; j <= 1; j++) { put(ex, ey + j, 7); put(ex + 1, ey + j, 7); } }
      else if (A.eyes === 'blink' || A.eyes === 'shut') { put(ex, ey + 1, 7); put(ex + 1, ey + 1, 7); }
      else if (A.eyes === 'angry') { put(ex, ey + 1, 7); put(ex + 1, ey + 1, 7); put(k ? ex + 1 : ex, ey, 7); }
      else { put(ex - 1, ey + 1, 7); put(ex, ey, 7); put(ex + 1, ey, 7); put(ex + 2, ey + 1, 7); } });
  } else { ell(hcx, hcy + 1, 4, 3.5, (nx, ny) => ny > .4 ? 3 : 0); }
  if (e.acc === 'scarf') { const y0 = Math.round(hcy + 6), sw2 = Math.round(e.tipX * .8);
    for (let x = X - 5; x <= X + 5; x++) { put(x, y0, x > X + 3 ? 12 : 11); put(x, y0 + 1, x < X - 3 || x > X + 4 ? 12 : 11); }
    put(X - 6, y0 + 1, 11); put(X - 6 + Math.round(sw2 * .4), y0 + 2, 11); put(X - 7 + Math.round(sw2 * .6), y0 + 3, 11); put(X - 7 + sw2, y0 + 4, 12); put(X - 6 + sw2, y0 + 4, 11); put(X - 8 + sw2, y0 + 5, 12); put(X + 2, y0 + 1, 12); }
  if (e.acc === 'flower' && !A.back) { const fx_ = hcx + 5, fy = hcy - 4; for (const [i, j] of [[0, -1], [-1, 0], [1, 0], [0, 1]]) put(fx_ + i, fy + j, 17); put(fx_, fy, 13); put(fx_ - 1, fy + 2, 4); }
  if (e.acc === 'crown') { const cx0 = hcx + 1, cy0 = hcy - 7; for (let i = -2; i <= 2; i++) put(cx0 + i, cy0, i === -2 ? 14 : 13); for (const i of [-2, 0, 2]) put(cx0 + i, cy0 - 1, 13); put(cx0, cy0, 11); }
  // front sleeve (over the hood when raised)
  if (e.acc === 'lute' && !A.back) { const lx = X + 3, ly = top + 9;
    for (let j = 0; j < 5; j++) for (let i = 0; i < 5; i++) { const dx = i - 2, dy = j - 2; if (dx * dx + dy * dy > 5) continue; put(lx + dx, ly + dy, dx === 0 && dy === 0 ? 2 : (dy < 0 ? 14 : 3)); }
    for (let k = 1; k <= 6; k++) put(lx + 2 + k, ly - 1 - k * .8, k === 6 ? 2 : 12); put(lx + 1, ly + 1, 13); }
  sleeve(4 + A.sf[0], A.sf[1], false);
  e.lanternW = null;
  if (e.acc === 'lantern' && !A.back) { const lx = X + 5 + A.sf[0] + Math.round(e.tipX * .3), ly = top + 7 + A.sf[1];
    put(lx, ly, 2); put(lx - 1, ly + 1, 14); put(lx, ly + 1, 14); put(lx + 1, ly + 1, 14);
    for (let j = 2; j <= 3; j++) { put(lx - 1, ly + j, 2); put(lx, ly + j, 16); put(lx + 1, ly + j, 2); } put(lx - 1, ly + 4, 14); put(lx, ly + 4, 14); put(lx + 1, ly + 4, 14);
    e.lanternW = { x: e.x + e.face * (lx - BOX), y: e.y + (ly + 2.5 - BOY) }; }
  finishBuf(e);
}
// contour sombre autour du personnage, puis copie dans le petit canvas (en miroir s'il regarde à gauche)
function finishBuf(e) {
  tmp.set(buf);
  for (let y = 0; y < BH; y++) for (let x = 0; x < BW; x++) { const i = y * BW + x; if (tmp[i]) continue;
    if ((x > 0 && tmp[i - 1]) || (x < BW - 1 && tmp[i + 1]) || (y > 0 && tmp[i - BW]) || (y < BH - 1 && tmp[i + BW])) buf[i] = 1; }
  // blit (mirrored when facing left)
  const d = img.data, pal = e.pal, f = e.face;
  for (let y = 0; y < BH; y++) for (let x = 0; x < BW; x++) { const c = buf[y * BW + x], o = (y * BW + (f === 1 ? x : BW - 1 - x)) * 4;
    if (!c) { d[o + 3] = 0; continue; } const p = pal[c]; d[o] = p[0]; d[o + 1] = p[1]; d[o + 2] = p[2]; d[o + 3] = 255; }
  scx.putImageData(img, 0, 0);
}
function drawChar(e, target) { if (!e.A) e.A = anim(e, 0, 0); const a = e.alpha ?? 1; if (a <= .01) return; if (e.mount && e.phx) { drawMounted(e, target); return; } drawPetit(e);
  target.globalAlpha = Math.min(1, a);
  if (e.act && e.act.id === 'die' && !SKINS[e.skin].mort) { // chute générique : le personnage bascule en arrière et reste couché
    const k = Math.min(1, e.act.t / .35), ang = -e.face * (Math.PI / 2) * (k * k);
    target.save(); target.translate(Math.round(e.x) - e.face * 3, Math.round(e.y)); target.rotate(ang); target.drawImage(sc, -BOX + e.face * 3, -BOY + 1); target.restore(); }
  else target.drawImage(sc, Math.round(e.x) - BOX, Math.round(e.y) - BOY);
  target.globalAlpha = 1; }

/* ---------------- bats / crows sprite ---------------- */
const BAT = [['X.....X', 'XX.R.XX', '.XXXXX.', '...X...'], ['.......', '..XRX..', 'XXXXXXX', 'X.....X']];
function drawBat(x, y, fr, a, flip, crow) { ctx.globalAlpha = a; const s = BAT[fr];
  for (let j = 0; j < 4; j++) for (let i = 0; i < 7; i++) { const ch = s[j][flip ? 6 - i : i]; if (ch === '.') continue;
    ctx.fillStyle = ch === 'R' ? (crow ? '#3a3a44' : '#ff3040') : crow ? '#07070b' : '#0d0710'; ctx.fillRect(Math.round(x) - 3 + i, Math.round(y) - 2 + j, 1, 1); }
  ctx.globalAlpha = 1; }
function emote(e, remote) { startAct(e, 'wave', remote); }
