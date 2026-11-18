"use strict";
// Interactions (touche E) : portes vers d'autres salles et PNJ à qui parler.

function interactables() {
  const L = [], r = curRoom;
  for (const d of r.portals || []) { if (d.hidden && d.hidden()) continue; portalRows(d); L.push({ x: (d.x1 + d.x2) / 2, x1: d.x1 + 1, x2: d.x2 - 1, y: d.floor, py: d.top - 12, label: d.label, door: d, run: () => startTransit(d) }); }
  if (r.hatch) L.push({ x: r.hatch.x, x1: r.hatch.x - 9, x2: r.hatch.x + 9, y: r.hatch.y, py: r.hatch.y - 50, label: 'Descendre', run: () => {
    if (player.mount) toggleMount(player); const z = ROOMS[r.down].climbs.find(q => q.kind === 'tour');
    enterRoom(r.down, (z.x1 + z.x2) / 2); player.y = 0; player.climbing = z; player.ground = false; player.vy = 0; } });
  if (r.portrait) L.push({ x: r.portrait.x, x1: r.portrait.x - 22, x2: r.portrait.x + 22, y: GROUND, py: 124, label: r.liftTarget ? 'Toucher le portrait' : 'Examiner le portrait', run: () => r.portrait.run() });
  for (const it of r.interacts || []) L.push(it);
  if (r.desk) L.push({ x: r.desk.x, x1: r.desk.x - 10, x2: r.desk.x + 10, y: r.desk.y, py: r.desk.y - 34, label: 'Projecteur', run: () => { renderCine(); openModal('cineM'); } });
  for (const s of r.seats || []) { const taken = allEnts().some(e => e.room === r.id && e.act && e.act.id === 'sit' && Math.abs(e.x - s.x) < 4 && Math.abs(e.y - (s.sitY ?? s.y)) < 4);
    if (!taken) L.push({ x: s.x, x1: s.x - 8, x2: s.x + 8, y: s.y, py: s.y - 40, label: "S'asseoir", run: () => { player.x = s.x; player.y = s.sitY ?? s.y; player.vy = 0; player.ground = true; player.face = 1; startAct(player, 'sit'); if (!s.front) player.act.cine = true; } }); }
  for (const k of r.critters || []) if (k.kind === 'cat' && k.st !== 'hop') L.push({ x: k.x, x1: k.x - 14, x2: k.x + 14, y: k.y, py: k.y - 22, label: 'Caresser', run: () => k.pet() });
  for (const b of bots) if (b.room === r.id && b.talk) L.push({ x: b.x, x1: b.x - 15, x2: b.x + 15, y: b.y, py: (b.tagY ?? headTop(b)) - 13, label: 'Parler', npc: b, run: () => talkTo(b) });
  return L;
}
function nearInteract() {
  if (!player || player.transit || player.climbing || !player.ground || menuOpen) return null;
  let best = null;
  for (const it of interactables()) if (player.x >= it.x1 && player.x <= it.x2 && Math.abs(player.y - it.y) < 6 && (!best || Math.abs(player.x - it.x) < Math.abs(player.x - best.x))) best = it;
  return best;
}
function talkTo(b) {
  if (time - (b.lastTalk || -9) < 1.2) return; b.lastTalk = time;
  b.face = player.x > b.x ? 1 : -1; player.face = -b.face;
  say(b, b.talk[(b.talkI = ((b.talkI ?? -1) + 1) % b.talk.length)]); if (b.onTalk) b.onTalk();
}

/* ---------------- traversée d'une porte ---------------- */
function startTransit(d) { if (player.mount) toggleMount(player); player.vy = 0; player.transit = { t: 0, d }; sfx.door(); player.act = null; player.vx = 0; }
function tickTransit(dt) {
  const tr = player.transit;
  if (!tr) { if (player.appear > 0) { player.appear -= dt; player.alpha = 1 - Math.max(0, player.appear) / .7; } else player.alpha = 1; return; }
  tr.t += dt; const d = tr.d, cx = (d.x1 + d.x2) / 2;
  if (tr.t < .6) player.x += (cx - player.x) * Math.min(1, dt * 7);
  player.alpha = 1 - clamp((tr.t - .45) / .6, 0, 1);
  if (tr.t > .35 && tr.t < 1 && Math.random() < .7) fxs.push({ k: 'mote', x: cx + (Math.random() - .5) * 16, y: d.floor - 4 - Math.random() * 20, vx: (Math.random() - .5) * 8, vy: -18 - Math.random() * 20, t: 0, max: .9 });
  if (tr.t >= 1.15) { player.transit = null; d.open = 0; enterRoom(d.to, d.toX); player.alpha = 0; player.appear = .7;
    for (const p of curRoom.portals || []) p.open = 1; }
}
function tickPortals(dt) {
  const it = nearInteract();
  for (const d of curRoom.portals || []) {
    d.near += ((it && it.door === d ? 1 : 0) - d.near) * Math.min(1, dt * 6);
    const target = player && player.transit && player.transit.d === d ? 1 : 0;
    d.open += (target - d.open) * Math.min(1, dt * (target ? 3 : 1.4));
  }
}
function drawPrompt() {
  const it = nearInteract(); if (!it || (it.npc && it.npc.bubble)) return;
  const lab = txt(norm(it.label), '#e9e2cc', null), w = lab.width + 13, x = Math.round(it.x - w / 2), y = Math.round(it.py + Math.sin(time * 4) * 1);
  ctx.fillStyle = '#05060a'; ctx.fillRect(x - 1, y, w + 2, 11); ctx.fillRect(x, y - 1, w, 13);
  ctx.fillStyle = '#141b28'; ctx.fillRect(x, y, w, 11);
  ctx.fillStyle = '#c9a24a'; ctx.fillRect(x + 1, y + 1, 9, 9); ctx.fillStyle = '#e8c860'; ctx.fillRect(x + 1, y + 1, 9, 1); ctx.fillStyle = '#7a5a22'; ctx.fillRect(x + 1, y + 9, 9, 1);
  ctx.drawImage(txt('E', '#14101c', null), x + 3, y + 2);
  ctx.drawImage(lab, x + 11, y + 2);
  ctx.fillStyle = '#05060a'; ctx.fillRect(Math.round(it.x) - 1, y + 12, 3, 1); ctx.fillRect(Math.round(it.x), y + 13, 1, 1);
}
