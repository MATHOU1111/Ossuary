"use strict";
// Le passage secret du trône + « Le Caveau ».
// - Dans la salle du trône, examiner le portrait (touche E) soulève le trône et révèle un escalier.
// - Il mène au Caveau, une salle voûtée encore vide (prête à accueillir quelque chose plus tard).

/* ================= le trône qui se soulève ================= */
{ const r = ROOMS.trone, LIFT = 44;
  r.lift = 0; r.liftTarget = 0;
  const seat = r.plats.find(p => p.x1 === 183 && p.y === 157), top = r.plats.find(p => p.x1 === 186 && p.y === 103);
  const base = [seat, top].map(p => ({ ...p }));
  const door = { x1: 181, x2: 203, spring: 148, bottom: 170, rr: 15, floor: 170, label: 'Descendre', to: 'caveau', toX: 192, bars: false, open: 0, near: 0,
    col: '255,170,90', col2: '255,225,170', hidden: () => r.lift < LIFT - 2 };
  r.portals = [door];
  const upd = r.update, dyn = r.dyn, lights = r.lights;
  r.update = dt => { upd(dt);
    const prev = r.lift; r.lift += clamp(r.liftTarget * LIFT - r.lift, -dt * 22, dt * 22);
    const moving = Math.abs(r.lift - prev) > .001;
    if (moving && curRoom.id === 'trone' && Math.random() < dt * 30) { const x = 180 + Math.random() * 24; fxs.push({ k: 'mote', x, y: 170 - r.lift, vx: (Math.random() - .5) * 10, vy: 10 + Math.random() * 20, t: 0, max: .8, g: 60 }); }
    if (moving && curRoom.id === 'trone' && Math.random() < dt * 8 && SND.ctx) noise(.12, { type: 'lowpass', f: 140, v: .18 });
    const off = r.lift > 1; [seat, top].forEach((p, i) => { p.x1 = off ? -99 : base[i].x1; p.x2 = off ? -98 : base[i].x2; }); };
  r.dyn = c => {
    const L = Math.round(r.lift);
    if (L > 0) { c.fillStyle = '#2f2a3a'; archRows(door.x1 - 3, door.x2 + 3, door.spring, door.bottom, door.rr + 3, (y, a, b) => c.fillRect(a, y, b - a, 1));
      c.fillStyle = '#4a4258'; archRows(door.x1 - 3, door.x2 + 3, door.spring, door.bottom, door.rr + 3, (y, a, b) => c.fillRect(a, y, 1, 1));
      drawPortal(c, door);
      c.fillStyle = '#2a2a32'; for (const x of [181, 203]) for (let y = 0; y < 104 - L; y += 2) { c.fillRect(x, y, 1, 1); c.fillStyle = y % 4 ? '#2a2a32' : '#4a4a58'; } }
    c.drawImage(r.throne, 0, -L);
    dyn(c); };
  r.lights = () => { lights(); if (r.lift > 1) portalGlow(door);
    const fl = time - (r.flash || -9); if (fl < 1.5) { const a = (1.5 - fl) / 1.5; glow(323, 152, 10, '255,40,60', .6 * a); glow(328, 152, 10, '255,40,60', .6 * a); } };
  r.portrait = { x: 326, run() {
    r.liftTarget = r.liftTarget ? 0 : 1; r.flash = time;
    if (SND.ctx) { noise(1.6, { type: 'lowpass', f: 120, v: .35, at: .2 }); tone(55, 1.8, { type: 'sawtooth', v: .08, lp: 200, at: .3 }); }
    if (r.liftTarget) { toast('Les yeux du portrait s\'allument… <b>le trône se soulève !</b>'); addSys('Un mécanisme se met en marche derrière le trône.');
      const bt = bots.find(b => b.name === 'Bertrand' && b.room === 'trone'); if (bt) setTimeout(() => say(bt, 'Monsieur… vous avez trouvé la salle privée du maître.'), 1400); }
    else toast('Le trône redescend lentement.'); } };
}

/* ================= ROOM : LE CAVEAU (sous le trône, vide pour l'instant) ================= */
{ const r = ROOMS.caveau = { id: 'caveau', name: 'LE CAVEAU', fires: [], indoor: true, stars: [], grass: [], climbs: [], fogFar: null, fogNear: [176, 6, .35], far: null };
  const [sk, s] = mk(W, H); r.sky = sk; s.fillStyle = '#07060a'; s.fillRect(0, 0, W, H);
  const [wl, w] = mk(W, H); r.wall = wl;
  { // voûtes en berceau, pierre humide
    w.fillStyle = '#1a1820'; w.fillRect(0, 0, W, GROUND);
    for (let y = 0, row = 0; y < GROUND; y += 7, row++) { w.fillStyle = '#131118'; w.fillRect(0, y, W, 1); for (let x = (row % 2) * 9; x < W; x += 18) w.fillRect(x, y, 1, 7); }
    for (let k = 0; k < 90; k++) { w.fillStyle = R() < .5 ? '#22202a' : '#15131a'; w.fillRect(R() * W | 0, R() * GROUND | 0, 2 + (R() * 4 | 0), 1); }
    for (const [a, b] of [[0, 120], [132, 252], [264, 384]]) { const cx = (a + b) / 2, rw = (b - a) / 2;
      for (let x = a; x < b; x++) { const t = (x - cx) / rw, top = Math.round(40 + 34 * (1 - Math.sqrt(Math.max(0, 1 - t * t)))); w.fillStyle = '#0e0d12'; w.fillRect(x, 0, 1, top); w.fillStyle = '#2a2632'; w.fillRect(x, top, 1, 2); } }
    for (const x of [120, 252]) { w.fillStyle = '#24212c'; w.fillRect(x, 30, 12, GROUND - 30); w.fillStyle = '#2e2a38'; w.fillRect(x, 30, 1, GROUND - 30); w.fillStyle = '#0e0d12'; w.fillRect(x + 11, 30, 1, GROUND - 30);
      w.fillStyle = '#2e2a38'; w.fillRect(x - 2, 30, 16, 3); w.fillRect(x - 2, GROUND - 4, 16, 4); }
    // soupirail : un mince filet de lumière
    w.fillStyle = '#05040a'; w.fillRect(300, 46, 22, 9); w.fillStyle = '#3a3a48'; for (let x = 302; x < 322; x += 4) w.fillRect(x, 46, 1, 9);
    // toiles d'araignée
    for (const [cx, cy, d] of [[2, 2, 1], [382, 2, -1], [133, 34, 1], [251, 34, -1]]) { w.fillStyle = 'rgba(200,200,210,.25)';
      for (let i = 0; i < 4; i++) pline(w, cx, cy, cx + d * (14 - i * 3), cy + i * 4, 1); for (let k = 1; k < 4; k++) pline(w, cx + d * k * 3, cy, cx, cy + k * 3, 1); }
    // escalier qui remonte vers le trône
    w.fillStyle = '#2f2a3a'; archRows(178, 206, 156, GROUND, 14, (y, a, b) => w.fillRect(a, y, b - a, 1));
  }
  const [pl, p] = mk(W, H); r.play = pl;
  { p.fillStyle = '#121016'; p.fillRect(0, GROUND, W, H - GROUND);
    for (let y = GROUND + 2; y < H; y += 6) for (let x = ((y / 6 | 0) % 2) * 10; x < W; x += 20) { p.fillStyle = '#1a1820'; p.fillRect(x, y, 19, 5); }
    p.fillStyle = '#2a2632'; p.fillRect(0, GROUND, W, 1);
    for (let k = 0; k < 6; k++) { p.fillStyle = '#0a0a10'; const x = 20 + R() * 340 | 0; p.fillRect(x, GROUND + 4 + (R() * 20 | 0), 6 + (R() * 10 | 0), 1); } }
  r.plats = [];
  r.portals = [{ x1: 182, x2: 202, spring: 160, bottom: GROUND, rr: 10, floor: GROUND, label: 'Remonter', to: 'trone', toX: 192, bars: false, open: 0, near: 0, col: '255,170,90', col2: '255,225,170' }];
  r.drips = [];
  r.update = dt => { if (Math.random() < dt * .8) r.drips.push({ x: 20 + Math.random() * 344, y: 74, vy: 0 });
    for (const d of r.drips) { d.vy += 300 * dt; d.y += d.vy * dt; } r.drips = r.drips.filter(d => d.y < GROUND); };
  r.dyn = c => { drawPortal(c, r.portals[0]); c.fillStyle = 'rgba(150,170,190,.6)'; for (const d of r.drips) c.fillRect(Math.round(d.x), Math.round(d.y), 1, 2); };
  r.front = c => { c.globalCompositeOperation = 'lighter'; c.fillStyle = 'rgba(150,170,200,.05)';
    c.beginPath(); c.moveTo(300, 55); c.lineTo(322, 55); c.lineTo(290, GROUND); c.lineTo(240, GROUND); c.fill();
    for (let i = 0; i < 10; i++) { const t = (time * .04 + i * .1) % 1; c.fillStyle = 'rgba(220,230,240,.25)'; c.fillRect(Math.round(305 - t * 45 + Math.sin(i * 3 + time) * 4), Math.round(58 + t * 120), 1, 1); }
    c.globalCompositeOperation = 'source-over'; };
  r.lights = () => { portalGlow(r.portals[0]); glow(270, 150, 60, '150,170,200', .06); };
}
