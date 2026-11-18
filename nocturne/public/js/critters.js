"use strict";
// Les petites créatures : chats, chauves-souris, rats, papillons de nuit autour des lumières.
// Chaque salle a une liste room.critters ; seules celles de la salle affichée sont animées.

const nearestEnt = (room, x, y) => { let best = null, d = 1e9; for (const e of allEnts()) if (e.room === room) { const dd = Math.hypot(e.x - x, (e.y - y) * .6); if (dd < d) { d = dd; best = e; } } return { e: best, d }; };
const heard = room => room === curRoom.id && SND.ctx;

/* ---------------- chat ---------------- */
const CAT = {
  sleep: ['......D.D.', '.BBBBBBBBB', 'BBBBBBBDBB', 'BBBBBBBBBB', 'TTDDDDDDD.'],
  sit: ['....B..B', '....BBBB', '....BEBE', '....BBPB', '...BBBB.', '..BBBBB.', '.BBBBBB.', 'TBBBBBB.', 'TT.D.D..'],
  sit2: ['....B..B', '....BBBB', '....BEBE', '....BBPB', '...BBBB.', '..BBBBB.', '.BBBBBB.', '.BBBBBB.', 'TT.D.D..'],
  purr: ['....B..B', '....BBBB', '....BDBD', '....BBPB', '...BBBB.', '..BBBBB.', '.BBBBBB.', 'TBBBBBB.', 'TT.D.D..'],
  hop: ['........BB', '.......BBB', '.BBBBBBBEB', 'TBBBBBBBB.', 'D.D....D.D'],
};
function makeCat(room, col, spots) {
  const s = spots[0];
  return { kind: 'cat', room, col, dk: shade(col, .55), spots, i: 0, x: s.x, y: s.y, st: 'sleep', t: 0, face: 1, calm: 0,
    update(dt) { this.t += dt; const n = nearestEnt(this.room, this.x, this.y);
      if (this.st === 'hop') { const u = Math.min(1, this.t / .55); this.x = this.x0 + (this.tx - this.x0) * u; this.y = this.y0 + (this.ty - this.y0) * u - Math.sin(u * Math.PI) * (18 + Math.abs(this.ty - this.y0) * .4);
        if (u >= 1) { this.st = 'sit'; this.t = 0; } return; }
      if (this.st === 'purr') { if (this.t > 3) { this.st = 'sit'; this.t = 0; } if (Math.random() < dt * 3 && this.room === curRoom.id) fxs.push({ k: 'heart', x: this.x, y: this.y - 12, vx: (Math.random() - .5) * 8, vy: -16, t: 0, max: 1 }); return; }
      if (this.st === 'sleep') { if (n.d < 34) { this.st = 'sit'; this.t = 0; this.face = n.e.x > this.x ? 1 : -1; if (heard(this.room) && Math.random() < .5) sfx.meow(); }
        else if (Math.random() < dt * .4 && this.room === curRoom.id) fxs.push({ k: 'z', x: this.x + 3, y: this.y - 7, vx: 3, vy: -6, t: 0, max: 1.6 }); return; }
      if (n.e) this.face = n.e.x > this.x ? 1 : -1;
      if (n.d < 12 && this.t > .6 && !(n.e && n.e.act && n.e.act.id === 'sit')) { // trop près : il saute ailleurs
        let j = (this.i + 1 + (Math.random() * (this.spots.length - 1) | 0)) % this.spots.length; const s2 = this.spots[j];
        Object.assign(this, { i: j, st: 'hop', t: 0, x0: this.x, y0: this.y, tx: s2.x, ty: s2.y, face: s2.x > this.x ? 1 : -1 }); if (heard(this.room)) sfx.meow(); return; }
      this.calm = n.d > 50 ? this.calm + dt : 0; if (this.calm > 5) { this.st = 'sleep'; this.t = 0; }
    },
    pet() { this.st = 'purr'; this.t = 0; this.face = player.x > this.x ? 1 : -1; if (heard(this.room)) sfx.purr(); },
    draw(c) { const spr = this.st === 'sleep' ? CAT.sleep : this.st === 'hop' ? CAT.hop : this.st === 'purr' ? CAT.purr : (Math.floor(time * 1.5) % 3 === 0 ? CAT.sit2 : CAT.sit);
      const h = spr.length, w = spr[0].length, x0 = Math.round(this.x) - (w >> 1), y0 = Math.round(this.y) - h;
      for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const ch = spr[j][this.face === 1 ? i : w - 1 - i]; if (ch === '.') continue;
        c.fillStyle = ch === 'E' ? (((time + this.x) % 4) < .12 ? this.dk : '#ffe060') : ch === 'P' ? '#e8a0a8' : ch === 'D' || ch === 'T' ? this.dk : this.col; c.fillRect(x0 + i, y0 + j, 1, 1); }
      c.fillStyle = 'rgba(0,0,0,.35)'; if (this.st !== 'hop') c.fillRect(x0, Math.round(this.y), w, 1); } };
}

/* ---------------- chauves-souris suspendues ---------------- */
function makeBats(room, spots) {
  return { kind: 'bats', room, bats: spots.map((s, i) => ({ hx: s[0], hy: s[1], x: s[0], y: s[1], st: 'hang', ph: i * 1.3 })), t: 0,
    update(dt) { const p = player && player.room === this.room ? player : null; this.t -= dt;
      const trig = p && this.bats.some(b => b.st === 'hang' && Math.abs(p.x - b.hx) < 45 && (Math.abs(p.vx) > 30 || !p.ground));
      if (trig && this.t <= 0) { this.t = 7 + Math.random() * 3; this.bats.forEach(b => { b.st = 'fly'; b.ft = 0; }); if (heard(this.room)) sfx.bats(); }
      for (const b of this.bats) {
        if (b.st === 'fly') { b.ft += dt; const cx = ROOMS.trone.cx || 192, a = b.ft * 2.2 + b.ph;
          const tx = cx + Math.cos(a) * (60 + Math.sin(b.ft + b.ph) * 30), ty = 60 + Math.sin(a * 1.7) * 26;
          b.x += (tx - b.x) * Math.min(1, dt * 2.5); b.y += (ty - b.y) * Math.min(1, dt * 2.5); b.vx = tx - b.x;
          if (this.t <= 0) b.st = 'back'; }
        else if (b.st === 'back') { b.x += (b.hx - b.x) * Math.min(1, dt * 2); b.y += (b.hy - b.y) * Math.min(1, dt * 2); b.vx = b.hx - b.x; if (Math.hypot(b.x - b.hx, b.y - b.hy) < 1) b.st = 'hang'; } } },
    draw(c) { for (const b of this.bats) { if (b.st === 'hang') { const x = Math.round(b.hx), y = Math.round(b.hy), sw = Math.sin(time * 1.5 + b.ph) > .9 ? 1 : 0;
        c.fillStyle = '#0d0710'; c.fillRect(x, y, 1, 1); c.fillRect(x - 1, y + 1, 3, 3); c.fillRect(x - 1 + sw, y + 4, 1, 1); c.fillRect(x + 1 - sw, y + 4, 1, 1); c.fillStyle = '#ff3040'; c.fillRect(x - 1, y + 3, 1, 1); c.fillRect(x + 1, y + 3, 1, 1); }
      else drawBat(b.x, b.y, Math.floor(time * 16 + b.ph) % 2, 1, b.vx < 0); } } };
}

/* ---------------- rats ---------------- */
const RAT = ['..XXXX.', 'XXXXXXP', 'T..X.X.'];
function makeRats(room) {
  return { kind: 'rat', room, r: null, wait: 4 + Math.random() * 8,
    update(dt) { if (!this.r) { this.wait -= dt; if (this.wait <= 0) { const left = Math.random() < .5; this.r = { x: left ? -6 : W + 6, d: left ? 1 : -1, v: 70, pause: 0 }; } return; }
      const r = this.r, p = player && player.room === this.room ? player : null;
      if (p && Math.abs(p.x - r.x) < 30 && Math.sign(p.x - r.x) === r.d && p.y > GROUND - 20) { r.d *= -1; r.v = 120; if (heard(this.room)) sfx.squeak(); }
      if (r.pause > 0) r.pause -= dt; else { r.x += r.d * r.v * dt; if (Math.random() < dt * .5) r.pause = .4 + Math.random() * .8; }
      if (r.x < -10 || r.x > W + 10) { this.r = null; this.wait = 10 + Math.random() * 18; } },
    draw(c) { const r = this.r; if (!r) return; const x0 = Math.round(r.x) - 3, y0 = GROUND - 3, sn = r.pause > 0 && Math.sin(time * 30) > 0;
      RAT.forEach((row, j) => { for (let i = 0; i < 7; i++) { const ch = row[r.d === 1 ? i : 6 - i]; if (ch === '.') continue; c.fillStyle = ch === 'P' ? '#e8a0a8' : ch === 'T' ? '#3a3a44' : '#5a5a66'; c.fillRect(x0 + i + (ch === 'P' && sn ? r.d : 0), y0 + j, 1, 1); } });
      if (r.pause <= 0 && Math.floor(time * 12) % 2) { c.fillStyle = '#3a3a44'; c.fillRect(x0 + (r.d === 1 ? 0 : 6), y0 + 2, 1, 1); } } };
}

/* ---------------- papillons de nuit autour des lumières ---------------- */
function makeMoths(room, lights) {
  return { kind: 'moth', room, m: lights.flatMap((L, i) => [0, 1, 2].map(k => ({ L, ph: k * 2.1 + i, r: 4 + k * 2.5 }))),
    update() {}, draw(c) { for (const o of this.m) { const L = typeof o.L === 'function' ? o.L() : o.L; if (!L) continue; const a = time * (2 + o.r * .2) + o.ph;
      const x = Math.round(L[0] + Math.cos(a) * o.r + Math.sin(time * 9 + o.ph) * 1.2), y = Math.round(L[1] + Math.sin(a * 1.3) * o.r * .6);
      c.fillStyle = '#e8e0c8'; c.fillRect(x, y, 1, 1); if (Math.sin(time * 30 + o.ph) > 0) { c.fillStyle = 'rgba(232,224,200,.6)'; c.fillRect(x - 1, y, 1, 1); c.fillRect(x + 1, y, 1, 1); } } } };
}

/* ---------------- placement ---------------- */
ROOMS.remparts.critters = [makeCat('remparts', '#c8783a', [{ x: 160, y: 172 }, { x: 66, y: 124 }, { x: 320, y: 62 }, { x: 228, y: 172 }]), makeMoths('remparts', [[134, 104], [250, 104], [300, 40]])];
ROOMS.caveau.critters = [makeRats('caveau')];
ROOMS.trone.critters = [makeBats('trone', [[150, 20], [162, 23], [222, 23], [234, 20], [246, 25]]), makeMoths('trone', [[124, 146], [260, 146]])];
function updateCritters(dt) { for (const k of curRoom.critters || []) k.update(dt); }
function drawCritters() { for (const k of curRoom.critters || []) k.draw(ctx); }
