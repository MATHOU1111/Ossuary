"use strict";
// Physique : marche, saut, plateformes, escalade.

/* ---------------- physics ---------------- */
function climbZone(e) { return (ROOMS[e.room].climbs || []).find(z => e.x >= z.x1 - 1 && e.x <= z.x2 + 1 && e.y > z.y1 - 1.5 && e.y <= z.y2 + .5); }
function step(e, inp, dt) {
  if (e.mount) { stepMount(e, inp, dt); return; }
  const plats = ROOMS[e.room].plats, zone = climbZone(e);
  if (!e.climbing && zone) {
    if (inp.upPressed && e.y > zone.y1 + .5) { e.climbing = zone; e.vx = 0; e.jbuf = 0; inp = { ...inp, jumpPressed: false }; }
    else if (inp.downPressed && e.ground && e.y <= zone.y1 + 1 && zone.y2 > e.y + 4) { e.climbing = zone; e.y += 2; e.drop = .25; inp = { ...inp, downPressed: false }; }
  }
  if (e.climbing) { const z = e.climbing;
    if (inp.spacePressed) { e.climbing = null; e.vy = -240; e.vx = ((inp.r ? 1 : 0) - (inp.l ? 1 : 0)) * 70; e.ground = false; e.coyote = 0; e.jbuf = 0; return; }
    const h = (inp.r ? 1 : 0) - (inp.l ? 1 : 0), v = (inp.down ? 1 : 0) - (inp.up ? 1 : 0);
    if (h) e.face = h; e.vx = h * 32; e.vy = v * 58; e.ground = false; e.coyote = 0; e.plat = null;
    e.x = clamp(e.x + e.vx * dt, 6, W - 6); e.y += e.vy * dt;
    if (e.y <= z.y1) { e.y = z.y1; const p = plats.find(p => e.x > p.x1 - 2 && e.x < p.x2 + 2 && Math.abs(p.y - z.y1) < 1);
      if (p && v < 0) { e.climbing = null; e.ground = true; e.vy = 0; e.plat = p; e.idleT = 0; } }
    const bottom = Math.min(z.y2, GROUND);
    if (e.y >= bottom) { e.y = bottom; if (bottom >= GROUND) { e.climbing = null; e.ground = true; e.vy = 0; } else if (v > 0) { e.climbing = null; e.vy = 30; } }
    if (e.climbing && (e.x < z.x1 - 2.5 || e.x > z.x2 + 2.5)) { e.climbing = null; e.vy = 0; }
    return; }
  // glissade : ↓ pendant une course
  if (inp.downPressed && e.ground && Math.abs(e.vx) > 100 && !(e.slideT > 0)) { e.slideT = .55; e.vx = Math.sign(e.vx) * 175; inp = { ...inp, downPressed: false, down: false };
    if (e.room === curRoom.id) puff(e.x, e.y, 8, LAND, 1.2); if (e === player) noise(.45, { f: 900, sweep: .4, q: .8, v: .12 }); }
  if (e.slideT > 0 && !e.ground) e.slideT = 0;
  const acc = e.ground ? 900 : 600, max = inp.run ? 150 : 110, target = ((inp.r ? 1 : 0) - (inp.l ? 1 : 0)) * max;
  if (e.slideT > 0) { e.vx -= Math.sign(e.vx) * Math.min(Math.abs(e.vx), 230 * dt); if (Math.abs(e.vx) < 25) e.slideT = 0;
    if (e.room === curRoom.id && Math.random() < dt * 30) puff(e.x - e.face * 3, e.y - 1, 1, LAND, .5); }
  else e.vx += clamp(target - e.vx, -acc * dt, acc * dt);
  if (!(e.slideT > 0)) { if (inp.l && !inp.r) e.face = -1; if (inp.r && !inp.l) e.face = 1; }
  e.coyote = e.ground ? .09 : e.coyote - dt;
  e.jbuf = inp.jumpPressed ? .12 : e.jbuf - dt;
  e.drop -= dt;
  if (inp.down && e.ground && e.y < GROUND - 1 && inp.downPressed && !(e.plat && e.plat.solid)) { e.y += 2; e.ground = false; e.drop = .22; e.coyote = 0; }
  if (e.jbuf > 0 && e.coyote > 0) { e.slideT = 0; e.vy = -285; e.ground = false; e.coyote = 0; e.jbuf = 0; if (e.room === curRoom.id) puff(e.x, e.y, 5, LAND); if (e === player) sfx.jump(); }
  const g = (e.vy < 0 && !inp.jump) ? 1900 : 950; e.vy = Math.min(e.vy + g * dt, 420);
  const py = e.y; e.x = clamp(e.x + e.vx * dt, 6, W - 6); e.y += e.vy * dt;
  const was = e.ground, vyLand = e.vy; e.ground = false; e.plat = null;
  if (ROOMS[e.room].ground !== null && e.y >= GROUND) { e.y = GROUND; e.vy = 0; e.ground = true; }
  else if (e.vy >= 0 && e.drop <= 0) for (const p of plats) if (e.x > p.x1 - 2 && e.x < p.x2 + 2 && py <= p.y + .01 && e.y >= p.y) { e.y = p.y; e.vy = 0; e.ground = true; e.plat = p; }
  if (e.vy >= 0 && e.drop <= 0) for (const p of plats) if (p.step && e.x > p.x1 && e.x < p.x2 && e.y > p.y && e.y - p.y <= 8.5) { e.y = p.y; e.vy = 0; e.ground = true; }
  if (e.ground && !was && vyLand > 160 && e.room === curRoom.id) puff(e.x, e.y, 6 + (vyLand > 300 ? 5 : 0), LAND);
  if (e.ground && !was) e.prevVy = vyLand;
}
