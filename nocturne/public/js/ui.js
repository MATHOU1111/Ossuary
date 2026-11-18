"use strict";
// Interface : XP, niveaux, actions, pièces d’or, boutique, chat, panneau.

/* ================= UI · PROGRESSION · ACTIONS ================= */
const ICON_PAL = { O: '#ff7a2a', X: '#0b0a12', W: '#f4f0e0', R: '#e0445a', P: '#ffd0d8', Y: '#e8c860', y: '#a07a28', B: '#9fc8ff', C: '#7fe0ff', c: '#e8fbff', S: '#f0d8b8', N: '#a87a4a', M: '#8a5a30', G: '#9aa4b4', D: '#2b48c8' };
// la pièce d'or : bord clair, rebord foncé, disque gravé d'une barre — générée pour être parfaitement ronde
function coinRows() { const rows = [];
  for (let j = 0; j < 11; j++) { let r = ''; for (let i = 0; i < 11; i++) { const dx = i - 5, dy = j - 5, d = Math.hypot(dx, dy);
    r += d > 5.4 ? '.' : d > 4.5 ? 'X' : d > 3.5 ? (dx + dy < -1 ? 'W' : dx + dy > 3 ? 'y' : 'Y') : d > 2.5 ? 'y' : (dx === 0 && Math.abs(dy) <= 1) || (dy === 0 && Math.abs(dx) <= 1) ? 'y' : 'Y'; } rows.push(r); }
  return rows; }
const ICONS = {
  wave: ['.....X.X.X.', '....XSXSXSX', '....XSXSXSX', '.X..XSSSSSX', 'XSX.XSSSSSX', 'XSSXXSSSSSX', '.XSSSSSSSX.', '..XSSSSSSX.', '...XSSSSX..', '....XXXX...', '...........'],
  sit: ['...........', '...........', '..XXXXXXX..', '.XNNNNNNNX.', '.XNNNNNNNX.', '..XXXXXXX..', '..XMX.XMX..', '..XMX.XMX..', '..XMX.XMX..', '..XXX.XXX..', '...........'],
  heart: ['...........', '.XXX...XXX.', 'XRRRX.XRRRX', 'XRPRRXRRRRX', 'XRRRRRRRRRX', 'XRRRRRRRRRX', '.XRRRRRRRX.', '..XRRRRRX..', '...XRRRX...', '....XRX....', '.....X.....'],
  laugh: ['...XXXXX...', '..XYYYYYX..', '.XYYYYYYYX.', 'XYYXYYYXYYX', 'XYXYXYXYXYX', 'XYYYYYYYYYX', 'XYXXXXXXXYX', 'XYYXRRRXYYX', '.XYYXXXYYX.', '..XYYYYYX..', '...XXXXX...'],
  surprise: ['....XXX....', '...XWWWX...', '...XWWWX...', '...XWWWX...', '...XWWWX...', '....XWX....', '....XWX....', '.....X.....', '....XXX....', '....XWX....', '....XXX....'],
  dance: ['...XXXXXXX.', '...XYYYYYX.', '...XYXXXYX.', '...XY...XY.', '...XY...XY.', '...XY...XY.', '.XXXY.XXXY.', 'XYYYY.XYYYX', 'XYYYX.XYYYX', '.XXX...XXX.', '...........'],
  sleep: ['XXXXXX.....', 'XBBBBX.....', 'XXXBX......', '..XBX......', '.XBX..XXXX.', 'XBX...XBBX.', 'XBBBBXXXBX.', 'XXXXXX.XBX.', '......XBXX.', '......XBBX.', '......XXXX.'],
  angry: ['..XX...XX..', '.XRRX.XRRX.', 'XRRXX.XXRRX', 'XRX.....XRX', '.X.......X.', '...........', '.X.......X.', 'XRX.....XRX', 'XRRXX.XXRRX', '.XRRX.XRRX.', '..XX...XX..'],
  menu: ['...XXXXX...', '..XNNNNNX..', '.XNMMNMMNX.', '.XNMMNMMNX.', '.XNMMNMMNX.', '.XNMMNMYNX.', '.XNMMNMMNX.', '.XNMMNMMNX.', '.XNNNNNNNX.', 'XXXXXXXXXXX', '...........'],
  shop: ['...XXXXX...', '..X.....X..', '..X.....X..', '.XXXXXXXXX.', 'XMMMMMMMMMX', 'XMMMYYYMMMX', 'XMMYYXYYMMX', 'XMMYYYYYMMX', 'XMMMYYYMMMX', 'XMMMMMMMMMX', '.XXXXXXXXX.'],
  help: ['...XXXXX...', '..XWWWWWX..', '.XWWXXXWWX.', '.XXX..XWWX.', '.....XWWX..', '....XWWX...', '....XWX....', '.....X.....', '....XXX....', '....XWX....', '....XXX....'],
  shard: coinRows(),
  phoenix: ['X.........X', 'XX.......XX', 'XOX.....XOX', '.XOX.X.XOX.', '.XOOXYXOOX.', '..XOXXXOX..', '...XXXXX...', '....XOX....', '...XOYOX...', '..XO.Y.OX..', '..X..X..X..'],
  sound: ['...........', '....X...X..', '...XX....X.', 'XXXGX..X..X', 'XGGGX...X.X', 'XGGGX...X.X', 'XGGGX...X.X', 'XXXGX..X..X', '...XX....X.', '....X...X..', '...........'],
  mute: ['...........', '....X......', '...XX......', 'XXXGX.R...R', 'XGGGX..R.R.', 'XGGGX...R..', 'XGGGX..R.R.', 'XXXGX.R...R', '...XX......', '....X......', '...........'],
  lock: ['...XXXXX...', '..XGGGGGX..', '..XGX.XGX..', '..XGX.XGX..', '.XXXXXXXXX.', '.XYYYYYYYX.', '.XYYYXYYYX.', '.XYYYXYYYX.', '.XYYYYYYYX.', '.XXXXXXXXX.', '...........'],
};
const iconCache = {};
function iconCanvas(name) { if (iconCache[name]) return iconCache[name]; const [c, x] = mk(11, 11);
  ICONS[name].forEach((r, j) => { for (let i = 0; i < 11; i++) { const ch = r[i]; if (ch && ch !== '.') { x.fillStyle = ICON_PAL[ch]; x.fillRect(i, j, 1, 1); } } }); return iconCache[name] = c; }
function paintIcon(el, name) { el.width = 11; el.height = 11; el.getContext('2d').drawImage(iconCanvas(name), 0, 0); }
const MINI = { heart: { c: '#e0445a', r: ['.X.X.', 'XXXXX', 'XXXXX', '.XXX.', '..X..'] }, note: { c: '#e8c860', r: ['..XXX', '..X.X', '..X..', 'XXX..', 'XX...'] },
  z: { c: '#9fc8ff', r: ['XXXX', '..X.', '.X..', 'XXXX'] }, spark: { c: '#fff2b0', r: ['..X..', '.XXX.', 'XXXXX', '.XXX.', '..X..'] }, star: { c: '#7fe0ff', r: ['.X.', 'XXX', '.X.'] }, mote: { c: '#9affcf', r: ['X'] }, feather: { c: '#3a2a34', r: ['XX.', '.XX'] } };

/* ---------- progression state ---------- */
const PROG = { xp: 0, lvl: 1, shards: 10, owned: {}, acc: null, perches: {}, rooms: {} };
const saveProg = () => compteSauver();   // la progression est enregistrée sur le compte (compte.js)
const need = l => 30 + 25 * (l - 1);
const floaters = [], fxs = [];
let lvlBanner = null, walkAcc = 0, climbAcc = 0, lastChatXP = -99, lastActXP = -99, xpClock = 0;
function floater(text, col, x, y) { floaters.push({ text, col, x, y, t: 0 }); }
function gainXP(n, quiet) {
  if (!player) return; PROG.xp += n;
  xpPop(n);
  while (PROG.xp >= need(PROG.lvl)) { PROG.xp -= need(PROG.lvl); PROG.lvl++; levelUp(); }
  saveProg(); updatePanel();
}
function gainShards(n, why) { PROG.shards += n; saveProg(); updatePanel(); HUD.bump2 = time;
 }
function xpPop(n) { sfx.xp(); HUD.bump = time; hudPop(n); }
function levelUp() {
  const L = PROG.lvl, reward = 10 + 5 * L; PROG.shards += reward; player.lvl = L;
  lvlBanner = { t: 0, lvl: L }; sfx.level();
  for (let i = 0; i < 26; i++) { const a = Math.random() * Math.PI * 2, v = 30 + Math.random() * 60; fxs.push({ k: Math.random() < .5 ? 'spark' : 'star', x: player.x, y: player.y - 14, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 30, t: 0, max: .9 + Math.random() * .6, g: 60 }); }
  toast(`<b>Niveau ${L} !</b> &nbsp;<i>+${reward} pièces d’or</i>`);
  addSys(`★ Niveau ${L} atteint ! +${reward} pièces d’or.`, 'gold');
  const unl = [...ACTIONS.filter(a => a.lvl === L).map(a => a.name), ...SHOP.filter(s => s.lvl === L).map(s => s.name)];
  if (unl.length) { toast(`Débloqué : <b>${unl.join(', ')}</b>`); addSys(`Débloqué : ${unl.join(', ')}.`, 'gold'); }
}
function toast(html) { const d = document.createElement('div'); d.className = 'toast'; d.innerHTML = html; const T = document.getElementById(document.getElementById('pgJeu').classList.contains('on') ? 'toasts' : 'toastsSite');   // dans le lecteur, ou en haut de la page T.appendChild(d);
  while (T.children.length > 3) T.firstChild.remove(); setTimeout(() => d.remove(), 3100); }

/* ---------- actions ---------- */
const ACTIONS = [
  { id: 'wave', name: 'Saluer', icon: 'wave', lvl: 1 },
  { id: 'sit', name: "S'asseoir", icon: 'sit', lvl: 1, loop: true },
  { id: 'heart', name: 'Cœur', icon: 'heart', lvl: 1, dur: 2.6, bubble: 'heart' },
  { id: 'laugh', name: 'Rire', icon: 'laugh', lvl: 2, dur: 2.2, bubble: 'laugh' },
  { id: 'surprise', name: 'Surprise', icon: 'surprise', lvl: 2, dur: 1.4, bubble: 'surprise' },
  { id: 'dance', name: 'Danser', icon: 'dance', lvl: 3, dur: 4.8, bubble: 'dance' },
  { id: 'sleep', name: 'Dormir', icon: 'sleep', lvl: 4, loop: true },
  { id: 'angry', name: 'Colère', icon: 'angry', lvl: 5, dur: 2.4, bubble: 'angry' },
];
// gestes hors barre d'actions : X = attaquer, C = tomber (on se relève en bougeant)
const GESTES = [{ id: 'attack', name: 'Attaquer', dur: .5 }, { id: 'die', name: 'Tomber', loop: true }];
function startAct(e, id, remote) {
  const a = ACTIONS.find(x => x.id === id) || GESTES.find(x => x.id === id); if (!a) return;
  if (e.act && e.act.id === 'attack' && id === 'attack' && e.act.t < .3) return;
  if (id === 'attack') { const sk = SKINS[e.skin]; a.dur = sk.attackDur || .5; }
  if (id === 'wave') { e.waveT = 1.6; e.act = null; } else e.act = { id, t: 0, dur: a.dur || 1e9, loop: !!a.loop, pt: 0 };
  if (a.bubble) e.emo = { icon: a.bubble, t: 0 };
  if (e.room === curRoom.id && sfx[id]) sfx[id]();
  if (id === 'surprise' && e.ground && e.kind !== 'remote') { e.vy = -150; e.ground = false; }
  if (!remote && e === player) { if (bc) bc.postMessage({ type: 'act', id: e.id, a: id }); }
}
function tryAct(i) { const a = ACTIONS[i]; if (!a || !player) return;
  if (PROG.lvl < a.lvl) { toast(`<b>${a.name}</b> se débloque au niveau ${a.lvl}`); return; }
  startAct(player, a.id); HUD.press[i] = time; }
function tickAct(e, dt) {
  if (e.emo) { e.emo.t += dt; if (e.emo.t > 2.4) e.emo = null; }
  const a = e.act; if (!a) return; a.t += dt; a.pt -= dt;
  if (!a.loop && a.t > a.dur) { e.act = null; return; }
  if ((a.id === 'sit' || a.id === 'sleep' || a.id === 'dance') && a.t > .3 && (e.spd > 12 || !e.ground || e.climbing)) { e.act = null; return; }
  if (a.id === 'die' && a.t > .9 && (e.spd > 12 || !e.ground || e.climbing)) { e.act = null; e.landT = .16; return; }
  if (a.id === 'attack' && !a.hit && a.t > (SKINS[e.skin].hitT || .2)) { a.hit = true; attackFx(e); }
  if (a.id === 'die' && e.room === curRoom.id && a.t > .45 && Math.random() < dt * 9) { const c = SKINS[e.skin].dust || '#8a8a96';
    fxs.push({ k: 'px', c, x: e.x + (Math.random() - .5) * 10, y: e.y - 2 - Math.random() * 3, vx: (Math.random() - .5) * 4, vy: -8 - Math.random() * 10, t: 0, max: 1.2 + Math.random() }); }
  if (a.id === 'dance') e.face = Math.floor(a.t * 2) % 2 ? -1 : 1;
  const here = e.room === curRoom.id;
  if (here && a.pt <= 0) {
    if (a.id === 'dance') { a.pt = .45; fxs.push({ k: 'note', x: e.x + (Math.random() - .5) * 14, y: e.y - 26, vx: (Math.random() - .5) * 10, vy: -22, t: 0, max: 1.3 }); }
    if (a.id === 'heart') { a.pt = .32; fxs.push({ k: 'heart', x: e.x + (Math.random() - .5) * 12, y: e.y - 20, vx: (Math.random() - .5) * 14, vy: -26, t: 0, max: 1.2 }); }
    if (a.id === 'sleep' && a.t > .8) { a.pt = 1.1; fxs.push({ k: 'z', x: e.x + e.face * 5, y: e.y - 22, vx: e.face * 6, vy: -12, t: 0, max: 1.8 }); }
  }
}

/* ---------- shop ---------- */
const SHOP = REGLES.BOUTIQUE;   // le catalogue est dans regles.js (partagé avec le serveur)
const allColors = () => [...REGLES.COULEURS_BASE, ...SHOP.filter(s => s.type === 'color' && PROG.owned[s.id]).map(s => s.color)];
const shopEnt = makeEnt('', '#2b48c8', BOX, 'preview'); shopEnt.room = 'preview'; shopEnt.y = BOY;
function cardPreview(cv, color, acc, skin) { setSkin(shopEnt, skin, color); shopEnt.slideT = 0; shopEnt.spd = 0; shopEnt.ground = true; shopEnt.capeA = .16; shopEnt.capeL = 15; shopEnt.acc = acc; shopEnt.A = anim(shopEnt, 0, 0); shopEnt.A.eyes = 'open'; shopEnt.hy = 0; shopEnt.tipX = 0;
  drawPetit(shopEnt); const R = previewRect(shopEnt.skin); cv.width = R.w; cv.height = R.h; cv.getContext('2d').drawImage(sc, R.x, R.y, R.w, R.h, 0, 0, R.w, R.h); }
function openModal(id) { menuOpen = true; keys.clear(); document.getElementById(id).style.display = 'flex'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; if (player) menuOpen = false; }

/* ---------- chat log ---------- */
const logEl = document.getElementById('log');
const ROOMNAMES = { remparts: 'La Clairière des Lucioles', devanture: 'La Devanture', chateau: 'Le Château', trone: 'La Salle du Trône', caveau: 'Le Caveau', catacombes: 'Les Catacombes', sommet: 'Le Sommet', cinema: 'Le Cinéma' };
function pushLine(el) { const stick = logEl.scrollHeight - logEl.scrollTop - logEl.clientHeight < 40; logEl.appendChild(el); while (logEl.children.length > 150) logEl.firstChild.remove(); if (stick) logEl.scrollTop = logEl.scrollHeight; }
function addSys(text, cls = '') { const d = document.createElement('div'); d.className = 'm sys ' + cls; d.textContent = text; pushLine(d); }
function addLog(name, msg, kind, ent) {
  if (!name) { addSys(msg); return; }
  const d = document.createElement('div'); d.className = 'm';
  const n = document.createElement('b'); n.textContent = name; n.style.color = ent ? shade(ent.color, 1.55) : '#e8c860'; d.appendChild(n);
  d.append(' : ' + msg); pushLine(d); }

/* ---------- panel ---------- */
// Le bandeau du bas est dessiné dans hud.js ; ici on ne met à jour que la boutique.
document.querySelectorAll('.ico-shard').forEach(c => paintIcon(c, 'shard'));
function updatePanel() { document.querySelectorAll('.shardCount').forEach(el => el.textContent = PROG.shards); }

/* ---------- tick : discoveries, walking, climbing, fx ---------- */
function tickProgress(dt) {
  if (!player) return;
  const dx = Math.abs(player.x - (player._px ?? player.x)), dy = Math.abs(player.y - (player._py ?? player.y)); player._px = player.x; player._py = player.y;
  // l'XP ne vient que du temps passé en jeu : 2 XP toutes les 30 secondes
  xpClock += dt; if (xpClock >= 30) { xpClock -= 30; gainXP(2); }
}
function updateFx(dt) {
  for (const p of fxs) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; if (p.g) p.vy += p.g * dt; else p.vx *= .97; }
  for (let i = fxs.length - 1; i >= 0; i--) if (fxs[i].t > fxs[i].max) fxs.splice(i, 1);
  for (const f of floaters) f.t += dt; for (let i = floaters.length - 1; i >= 0; i--) if (floaters[i].t > 1.3) floaters.splice(i, 1);
  if (lvlBanner) { lvlBanner.t += dt; if (lvlBanner.t > 3) lvlBanner = null; }
}
// l'effet de coupe d'une attaque (arc lumineux devant le personnage) ; certains personnages en ont un plus fort
function attackFx(e) {
  const sk = SKINS[e.skin], st = sk.slash || { r: 12, col: '#f4f6f8', a0: -1.3, a1: .9, dy: -14 };
  if (e.room !== curRoom.id) return;
  if (!st.none) fxs.push({ k: 'slash', x: e.x + e.face * (st.dx ?? 6), y: e.y + st.dy, face: e.face, r: st.r, c: st.col, a0: st.a0, a1: st.a1, vx: 0, vy: 0, t: 0, max: .22 });
  if (st.impact) { puff(e.x + e.face * st.impact, e.y - 1, 12, st.dustCol || LAND, 1.4); for (let i = 0; i < 8; i++) fxs.push({ k: 'px', c: st.col, x: e.x + e.face * st.impact, y: e.y - 2, vx: (Math.random() - .5) * 70, vy: -30 - Math.random() * 50, g: 160, t: 0, max: .6 }); }
  if (SND.ctx) { noise(.16, { f: st.impact ? 400 : 3200, sweep: st.impact ? .5 : .3, q: 1.2, v: st.impact ? .2 : .1 }); if (st.impact) tone(70, .3, { type: 'sine', v: .25, slide: .5 }); }
}
function drawFx() {
  for (const p of fxs) {
    if (p.k === 'px') { ctx.globalAlpha = Math.min(1, (p.max - p.t) * 2); ctx.fillStyle = p.c; ctx.fillRect(Math.round(p.x), Math.round(p.y), 1, 1); continue; }
    if (p.k === 'slash') { const k = p.t / p.max; ctx.globalAlpha = 1 - k; ctx.fillStyle = p.c;
      for (let a = p.a0; a <= p.a1; a += .05) { const w = Math.sin((a - p.a0) / (p.a1 - p.a0) * Math.PI) * (2.5 - k * 2);
        for (let d = -w; d <= 0; d += .7) ctx.fillRect(Math.round(p.x + p.face * Math.cos(a) * (p.r + d + k * 3)), Math.round(p.y + Math.sin(a) * (p.r + d + k * 3)), 1, 1); }
      continue; }
    const M = MINI[p.k], a = Math.min(1, (p.max - p.t) * 3); ctx.globalAlpha = a; ctx.fillStyle = M.c; const w = M.r[0].length;
    M.r.forEach((r, j) => { for (let i = 0; i < w; i++) if (r[i] === 'X') ctx.fillRect(Math.round(p.x) - (w >> 1) + i, Math.round(p.y) + j, 1, 1); }); }
  ctx.globalAlpha = 1;
}
function drawEmo(e) { if (!e.emo) return; const t = e.emo.t, a = Math.min(1, t * 8, (2.4 - t) * 4), ic = iconCanvas(e.emo.icon), nm = txt(norm(e.name), '#fff', '#000');
  const x = Math.round(e.x + nm.width / 2 + 2), y = headTop(e) - 4 + Math.round(Math.sin(t * 6) * 1) - (t < .15 ? 2 : 0);
  ctx.globalAlpha = a; ctx.fillStyle = '#14101c'; ctx.fillRect(x, y + 1, 15, 13); ctx.fillRect(x + 1, y, 13, 15); ctx.fillStyle = '#e9e2cc'; ctx.fillRect(x + 1, y + 1, 13, 13); ctx.drawImage(ic, x + 2, y + 2); ctx.globalAlpha = 1; }
function drawFloaters() { for (const f of floaters) { const t = f.t / 1.3, im = txt(f.text, f.col, '#05060a'); ctx.globalAlpha = Math.min(1, (1 - t) * 3); ctx.drawImage(im, Math.round(f.x - im.width / 2), Math.round(f.y - t * 16)); } ctx.globalAlpha = 1; }
function drawLvlBanner() { if (!lvlBanner) return; const t = lvlBanner.t, a = Math.min(1, t * 5, (3 - t) * 2), im = txt('NIVEAU ' + lvlBanner.lvl, '#ffe28a', '#05060a'), s = 3, w = im.width * s, y = 52 - Math.round(Math.max(0, .2 - t) * 40);
  ctx.globalAlpha = a; ctx.fillStyle = 'rgba(5,6,10,.55)'; ctx.fillRect(Math.round(W / 2 - w / 2) - 10, y - 6, w + 20, im.height * s + 12);
  ctx.fillStyle = '#c9a24a'; ctx.fillRect(Math.round(W / 2 - w / 2) - 10, y - 6, w + 20, 1); ctx.fillRect(Math.round(W / 2 - w / 2) - 10, y + im.height * s + 5, w + 20, 1);
  ctx.drawImage(im, Math.round(W / 2 - w / 2), y, w, im.height * s);
  const st = txt('+' + (10 + 5 * lvlBanner.lvl) + ' PIECES D\'OR', '#7fe0ff', '#05060a'); ctx.drawImage(st, Math.round(W / 2 - st.width / 2), y + im.height * s + 9); ctx.globalAlpha = 1; }
