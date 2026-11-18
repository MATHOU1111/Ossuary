"use strict";
// Boucle de jeu : mise à jour et rendu de chaque image.

/* ---------------- update ---------------- */
let shoot = null, fade = 0, roomBanner = -10, CAMY = 0;   // CAMY : décalage vertical de la caméra (arbre de la Clairière)
function enterRoom(id, x) {
  const r = ROOMS[id]; if (!r) return;
  if (curRoom.id === 'cinema' && id !== 'cinema') filmLeave();
  curRoom = r; CAMY = 0; player.room = id; player.x = x; player.lx = undefined; player.ly = undefined; player.vx *= .5; setSkin(player, player.skin, player.color);
  if (player.phx) { player.phx = makePhx(player); player.phx.appear = 1; }
  puffs.length = 0; embers.length = 0; fxs.length = 0; for (const f of r.fires) f.p.length = 0;
  if (r.update) r.update(0);
  if (r.onEnter) r.onEnter();
  fade = 1; roomBanner = time; sendT = 0; player.act = null; audioRoom(id);
  if (id === 'cinema') seanceApply(true);   // on arrive au bon moment de la séance commune
  if (!PROG.rooms[id]) { PROG.rooms[id] = 1; toast('Nouvelle salle découverte !'); }
}
function update(dt) {
  if (curRoom.update) curRoom.update(dt);
  if (player && curRoom.camMax) CAMY += (clamp(curRoom.camStart - player.y, 0, curRoom.camMax) - CAMY) * Math.min(1, dt * 5); else CAMY = 0;
  tickPortals(dt);
  if (player && curRoom.fp) fpUpdate(dt, typing() || menuOpen);
  else if (player) { const t = typing() || menuOpen;
    const inp = { run: !t && any(keys, 'ShiftLeft', 'ShiftRight'), l: !t && any(keys, 'ArrowLeft', 'KeyA', 'KeyQ'), r: !t && any(keys, 'ArrowRight', 'KeyD'), jump: !t && any(keys, 'ArrowUp', 'KeyW', 'KeyZ', 'Space'),
      up: !t && any(keys, 'ArrowUp', 'KeyW', 'KeyZ'), upPressed: !t && any(pressed, 'ArrowUp', 'KeyW', 'KeyZ'), spacePressed: !t && pressed.has('Space'),
      jumpPressed: !t && any(pressed, 'ArrowUp', 'KeyW', 'KeyZ', 'Space'), down: !t && any(keys, 'ArrowDown', 'KeyS'), downPressed: !t && any(pressed, 'ArrowDown', 'KeyS') };
    if (player.transit) for (const k in inp) inp[k] = false;
    step(player, inp, dt); tickTransit(dt);
    if (curRoom.up && player.y < -2 && (player.climbing || player.mount)) {
      const ladder = !!player.climbing, up = ROOMS[curRoom.up]; enterRoom(curRoom.up, player.x);
      if (ladder && up.hatch) { player.climbing = null; player.x = up.hatch.x; player.y = up.hatch.y; player.ground = true; player.vy = 0; }
      else { const fl = up.plats.find(p => p.solid && player.x > p.x1 - 12 && player.x < p.x2 + 12); player.y = fl ? fl.y - 2 : H + 4; }
    } else if (curRoom.down && player.y > H + 8) { enterRoom(curRoom.down, player.x); player.y = -6; player.climbing = null; }
    if (!t && !player.transit && pressed.has('KeyF')) toggleMount(player);
    if (!t && pressed.has('KeyM')) { audioInit(); setSound(!SND.on); toast(SND.on ? 'Son activé' : 'Son coupé'); }
    if (!t && !player.transit && pressed.has('KeyE')) { const it = nearInteract(); if (it) it.run(); else if (player.waveT <= -.2) emote(player); }
    if (player.x <= 6.01 && inp.l && curRoom.left) enterRoom(curRoom.left, curRoom.leftX ?? W - 9);
    else if (player.x >= W - 6.01 && inp.r && curRoom.right) enterRoom(curRoom.right, curRoom.rightX ?? 9); }
  pressed.clear();
  if (player) tickProgress(dt);
  for (const b of bots) updateBot(b, dt);
  for (const [id, r] of remotes) { if (time - r.last > 4) { remotes.delete(id); continue; }
    r.x += (r.tx - r.x) * Math.min(1, dt * 14); r.y += (r.ty - r.y) * Math.min(1, dt * 14); }
  for (const e of allEnts()) updateAnim(e, dt);
  updateFires(dt); updateFx(dt); updateFlyaways(dt); updateCritters(dt); audioTick(dt);
  fade = Math.max(0, fade - dt * 2.8);
  if (!shoot && !curRoom.indoor && Math.random() < dt / 9) shoot = { x: 60 + Math.random() * 220, y: 6 + Math.random() * 30, life: 0 };
  if (shoot) { shoot.life += dt; if (shoot.life > .7) shoot = null; }
  if (player && bc) { sendT -= dt; if (sendT <= 0) { sendT = .07;
    bc.postMessage({ type: 'state', id: player.id, name: player.name, color: player.color, skin: player.skin, room: player.room, x: player.x, y: player.y, vx: player.vx, vy: player.vy, face: player.face, ground: player.ground, sl: player.slideT > 0 ? 1 : 0, ar: player.armed ? 1 : 0, cl: !!player.climbing, mt: !!player.mount, acc: player.acc, lvl: PROG.lvl }); } }
}
function allEnts() { const a = [...bots, ...remotes.values()]; if (player) a.push(player); return a; }
function roomEnts() { return allEnts().filter(e => e.room === curRoom.id); }

/* ---------------- render ---------------- */
function glow(x, y, r, col, a) { if (!isFinite(x) || !isFinite(y) || !(r > 0)) return; const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(${col},${a})`); g.addColorStop(.35, `rgba(${col},${a * .4})`); g.addColorStop(1, `rgba(${col},0)`);
  ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); }
function drawFog(y, speed, alpha) { const o = ((time * speed) % W + W) % W; ctx.globalAlpha = alpha; ctx.drawImage(fog, Math.round(-o), y); ctx.drawImage(fog, Math.round(W - o), y); ctx.globalAlpha = 1; }
const placed = [];
function headTop(e) { return Math.max(1 - CAMY, Math.round(e.y) - (SKINS[e.skin] || SKINS.capuche).nameY + Math.round(e.hy) + (e.A ? e.A.bob : 0) - (e.mount ? 15 : 0)); }
// Les bulles sont dessinées sur un calque en haute résolution (#hi) : cadre pixel art (même crème et même contour que le reste du jeu),
// mais texte net, en police lisible, avec accents et minuscules.
const BUBBLE_FONT = "'Pixelify Sans',Verdana,'DejaVu Sans',sans-serif";
function bubbleLines(text, maxW) {   // retour à la ligne selon la largeur mesurée
  const out = []; let cur = '';
  for (let w of text.split(/\s+/)) { if (!w) continue;
    while (hiX.measureText(w).width > maxW) { let k = w.length - 1; while (k > 1 && hiX.measureText(w.slice(0, k)).width > maxW) k--; if (cur) { out.push(cur); cur = ''; } out.push(w.slice(0, k)); w = w.slice(k); }
    const t = cur ? cur + ' ' + w : w; if (cur && hiX.measureText(t).width > maxW) { out.push(cur); cur = w; } else cur = t; }
  if (cur) out.push(cur); return out.slice(0, 6); }
function drawBubble(e) {
  if (!e.bubble) return; const life = 6.5 + Math.min(4, e.bubble.text.length / 40), age = time - e.bubble.t; if (age > life) { e.bubble = null; return; }
  const u = Math.max(1, Math.round(SC)), fs = Math.max(14, Math.round(u * 5.6)), pad = u * 2, lh = Math.round(fs * 1.22), maxW = Math.round(clamp(W * u * .3, 150, 280)), snap = v => Math.round(v / u) * u;
  hiX.font = `500 ${fs}px ${BUBBLE_FONT}`;
  const L = bubbleLines(e.bubble.text, maxW); if (!L.length) return;
  const bw = snap(Math.ceil(Math.max(...L.map(l => hiX.measureText(l).width))) + pad * 2 + u), bh = snap(L.length * lh + pad * 2);
  const ax = e.x * u, bx = snap(clamp(ax - bw / 2, u * 2, W * u - bw - u * 2));
  let by = snap(((e.tagY ?? headTop(e)) + CAMY) * u - u * 4 - bh + (age < .12 ? u : 0)); if (by < u) by = Math.min(H * u - bh - u * 2, snap((e.y + CAMY) * u + u * 6));
  for (let moved = true, n = 0; moved && n < 8; n++) { moved = false;
    for (const q of placed) if (bx < q.x + q.w + u && bx + bw + u > q.x && by < q.y + q.h + u * 3 && by + bh + u * 3 > q.y) { by = q.y - bh - u * 3; moved = true; } }
  placed.push({ x: bx, y: by, w: bw, h: bh });
  hiX.globalAlpha = age > life - .5 ? clamp((life - age) * 2, 0, 1) : 1;
  const tx = snap(clamp(ax, bx + u * 3, bx + bw - u * 4));
  hiX.fillStyle = '#14101c'; hiX.fillRect(bx + u, by, bw - u * 2, bh); hiX.fillRect(bx, by + u, bw, bh - u * 2);
  hiX.fillStyle = '#e9e2cc'; hiX.fillRect(bx + u, by + u, bw - u * 2, bh - u * 2); hiX.fillStyle = '#c9bfa3'; hiX.fillRect(bx + u, by + bh - u * 2, bw - u * 2, u);
  hiX.fillStyle = '#c9bfa3'; hiX.fillRect(tx - u, by + bh - u, u * 3, u); hiX.fillStyle = '#14101c'; hiX.fillRect(tx - u * 2, by + bh - u, u, u); hiX.fillRect(tx + u * 2, by + bh - u, u, u);
  hiX.fillRect(tx - u, by + bh, u, u); hiX.fillRect(tx + u, by + bh, u, u); hiX.fillStyle = '#c9bfa3'; hiX.fillRect(tx, by + bh, u, u); hiX.fillStyle = '#14101c'; hiX.fillRect(tx, by + bh + u, u, u);
  hiX.fillStyle = '#1d1626'; hiX.textBaseline = 'top'; L.forEach((l, i) => hiX.fillText(l, bx + pad + u, by + pad - Math.round(fs * .08) + i * lh));
  hiX.globalAlpha = 1;
}
function render() {
  const RM = curRoom;
  hiX.setTransform(1, 0, 0, 1, 0, 0); hiX.clearRect(0, 0, hiCv.width, hiCv.height); hiX.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  if (RM.fp) { fpRender(); renderOverlay(RM); return; }   // salle en vue 3D (catacombes)
  const va = RM.visionA ? RM.visionA() : 0; if (va > 0) ctx.drawImage(RM.vision, 0, 0);   // la vision du sommet, derrière tout
  ctx.save(); ctx.translate(0, Math.round(CAMY)); ctx.globalAlpha = 1 - va;
  ctx.drawImage(RM.sky, 0, RM.skyY || 0);
  if (RM.hole) ctx.clearRect(RM.hole.x, RM.hole.y, RM.hole.w, RM.hole.h);
  for (const s of RM.stars) { const a = s.b * (.55 + .45 * Math.sin(time * s.s + s.x)); ctx.fillStyle = `rgba(214,232,240,${a})`; ctx.fillRect(s.x, s.y, 1, 1);
    if (s.big) { ctx.fillStyle = `rgba(214,232,240,${a * .45})`; ctx.fillRect(s.x - 1, s.y, 3, 1); ctx.fillRect(s.x, s.y - 1, 1, 3); } }
  if (shoot) { const t = shoot.life / .7; for (let i = 0; i < 14; i++) { ctx.fillStyle = `rgba(230,240,255,${(1 - i / 14) * (1 - t)})`; ctx.fillRect(Math.round(shoot.x - t * 120 + i * 2), Math.round(shoot.y + t * 40 - i * .66), 1, 1); } }
  if (RM.far) ctx.drawImage(RM.far, 0, 0);
  ctx.globalAlpha = 1;
  if (RM.fogFar) drawFog(...RM.fogFar);
  ctx.drawImage(RM.wall, 0, 0);
  if (RM.rays) RM.rays(ctx);
  if (RM.back) RM.back(ctx);
  drawFlames(true);
  ctx.drawImage(RM.play, 0, 0);
  if (RM.dyn) RM.dyn(ctx);
  drawFlames(false);
  drawCritters();
  const ents = roomEnts();
  for (const e of ents) if (e.mount && e.phx) phxShadow(e); else if (e.ground && !e.climbing) { ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.fillRect(Math.round(e.x) - 6, Math.round(e.y), 13, 1); ctx.fillRect(Math.round(e.x) - 4, Math.round(e.y) + 1, 9, 1); }
  for (const e of ents) if (e !== player) drawChar(e, ctx);
  if (player && player.room === RM.id) drawChar(player, ctx);
  drawFlyaways();
  drawFx();
  for (const p of puffs) { ctx.globalAlpha = (1 - p.life / p.max) * .7; ctx.fillStyle = p.c; ctx.fillRect(Math.round(p.x), Math.round(p.y), 1, 1); } ctx.globalAlpha = 1;
  for (const g of RM.grass) { let push = 0; for (const e of ents) if (Math.abs(e.y - g.y) < 3 && Math.abs(e.x - g.x) < 7) push += Math.sign(g.x - e.x || 1) * 1.4;
    for (let k = -1; k <= 1; k++) { const h = g.h - (k ? 1 : 0); if (h <= 0) continue; const sw = Math.round(Math.sin(time * 2 + g.x * .3 + g.ph) * .7 + push);
      for (let i = 0; i < h; i++) { ctx.fillStyle = i === h - 1 ? '#5f9258' : '#2e5236'; ctx.fillRect(g.x + k + (i >= h - 2 ? sw : 0), g.y - 1 - i, 1, 1); } } }
  if (RM.front) RM.front(ctx);
  if (RM.fogNear) drawFog(...RM.fogNear);
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < RM.fires.length; i++) { const f = RM.fires[i], fl = .82 + .12 * Math.sin(time * 11 + i * 3) + .06 * Math.sin(time * 23 + i);
    if (f.size === 2) { glow(f.x, f.y - 2, 78 * (.95 + fl * .05), '255,130,45', .26 * fl); glow(f.x, f.y - 2, 14, '255,210,120', .35 * fl); }
    else if (f.size === 1) { glow(f.x, f.y - 2, 42, '255,130,45', .2 * fl); glow(f.x, f.y - 2, 7, '255,210,120', .35 * fl); }
    else glow(f.x, f.y - 1, 16, '255,150,60', .14 * fl); }
  if (RM.lights) RM.lights();
  phxLights(ents);
  for (const e of ents) if (e.glowW) { glow(e.glowW.x, e.glowW.y, e.glowW.col ? 16 : 9, e.glowW.col || '150,255,110', .22 * e.glowW.a); }
  for (const e of ents) if (e.lanternW) { glow(e.lanternW.x, e.lanternW.y, 30, '255,190,90', .22 + .03 * Math.sin(time * 9 + e.seed)); glow(e.lanternW.x, e.lanternW.y, 5, '255,230,150', .4); }
  for (const e of embers) { const t = e.life / e.max; ctx.fillStyle = `rgba(255,${150 + 80 * (1 - t) | 0},70,${(1 - t) * (.6 + .4 * Math.sin(time * 20 + e.ph))})`; ctx.fillRect(Math.round(e.x), Math.round(e.y), 1, 1); }
  for (const m of motes) { ctx.fillStyle = `rgba(190,215,210,${.12 + .12 * Math.sin(time * 1.5 + m.ph)})`; ctx.fillRect(Math.round(m.x), Math.round(m.y), 1, 1); }
  ctx.globalCompositeOperation = 'source-over';
  ctx.restore();
  ctx.drawImage(vig, 0, 0);
  const pa = .45 + .35 * Math.sin(time * 3);
  ctx.globalAlpha = pa;
  if (RM.left) ctx.drawImage(txt('<', '#e0b85a', '#05060a'), 1 + Math.round(Math.sin(time * 3) * -1), 170);
  if (RM.right) ctx.drawImage(txt('>', '#e0b85a', '#05060a'), W - 6 + Math.round(Math.sin(time * 3)), 170);
  ctx.globalAlpha = 1;
  const tags = []; ctx.save(); ctx.translate(0, Math.round(CAMY));
  for (const e of [...ents].sort((p, q) => (q === player) - (p === player))) { const t = txt(norm(e.name), e === player ? '#ffd27a' : e.kind === 'bot' ? '#9fd0c8' : '#e6e1d3', '#05060a');
    const x = Math.round(e.x - t.width / 2); let y = headTop(e);
    for (let n = 0; n < 4; n++) { const hit = tags.find(q => x < q.x + q.w + 2 && x + t.width + 2 > q.x && y < q.y + 8 && y + 8 > q.y); if (!hit) break; y = hit.y - 8; }
    tags.push({ x, y, w: t.width }); e.tagY = y; ctx.drawImage(t, x, y); }
  for (const e of ents) drawEmo(e);
  drawPrompt(); ctx.restore();
  placed.length = 0;
  for (const e of [...ents].sort((a, b) => (a.bubble ? a.bubble.t : 0) - (b.bubble ? b.bubble.t : 0))) drawBubble(e);
  renderOverlay(RM);
}
function renderOverlay(RM) {
  const age = time - roomBanner;
  if (age < 3.2) { const a = Math.max(0, Math.min(1, (age - .15) * 4, (3.2 - age) * 1.4)), t = txt(RM.name, '#e9e2cc', '#05060a'), w = t.width * 2;
    ctx.globalAlpha = a; ctx.drawImage(t, Math.round(W / 2 - w / 2), 28, w, t.height * 2);
    ctx.fillStyle = '#c9a24a'; ctx.fillRect(Math.round(W / 2 - w / 2) + 4, 44, w - 8, 1); ctx.fillRect(Math.round(W / 2) - 1, 46, 3, 1);
    ctx.globalAlpha = 1; }
  drawFloaters(); drawLvlBanner();
  if (fade > 0) { ctx.fillStyle = `rgba(4,6,11,${fade})`; ctx.fillRect(0, 0, W, H); }
}
