"use strict";
// Interface en jeu, tout en pixel art gothique (même pierre, même or, même zoom que le jeu) :
//  · la barre du bas : le chat sur une ardoise à gauche, un petit menu Objets / Actions au milieu, niveau / XP / or à droite ;
//  · le rouage des options en haut à droite.
// Le texte (chat, chiffres, boutons) et les zones cliquables sont des éléments HTML posés par-dessus les canvas.

const HUD_H = 72;
const hudCv = document.getElementById('hud'), hx = hudCv.getContext('2d');
hudCv.width = W; hudCv.height = HUD_H; hx.imageSmoothingEnabled = false;
const HUD = { hover: null, press: {}, bump: -9, bump2: -9 };
const panelEl = document.getElementById('panel');

/* ---------------- disposition de la barre (pixels de jeu) ---------------- */
const SLATE = { x: 5, y: 4, w: 185, h: 65 };            // ardoise du chat
const TRAY = { x: 197, y: 4, w: 119, h: 65 };           // petit menu Objets / Actions
const SLOT = { x: 200, y: 22, size: 20, pitch: 23, cols: 5, rows: 2 };
const STATS = { x: 321, y: 4, w: 59, h: 65 };           // niveau, XP, or
const slotPos = i => ({ x: SLOT.x + (i % SLOT.cols) * SLOT.pitch, y: SLOT.y + (i / SLOT.cols | 0) * SLOT.pitch });
let invTab = 'actions';
const invItems = () => REGLES.BOUTIQUE.filter(i => i.type === 'acc' && PROG.owned[i.id]);   // les objets que l'on possède : pour l'instant, les accessoires
const PHOENIX_SLOT = 8;                                   // dernière case des actions : le phénix noir (touche F)

// icônes des objets (11×11, même palette que les actions)
const ITEM_ART = {
  scarf: ['...........', '..XXXXXXX..', '.XRRRRRRRX.', '.XRRPRRRRX.', '..XXXXRRX..', '.....XRRX..', '.....XRRX..', '....XRRRX..', '....XRRX...', '....XXXX...', '...........'],
  flower: ['...........', '....XXX....', '..XXPPPXX..', '.XPPPYPPPX.', '.XPPYYYPPX.', '.XPPPYPPPX.', '..XXPPPXX..', '....XNX....', '....XNX....', '....XXX....', '...........'],
  ears: ['...........', '.XX.....XX.', 'XMMX...XMMX', 'XMPMX.XMPMX', 'XMPPMXMPPMX', 'XMMMMMMMMMX', '.XXXXXXXXX.', '...........', '...........', '...........', '...........'],
  lantern: ['....XXX....', '...X...X...', '..XXXXXXX..', '..XYYWYYX..', '..XYWWWYX..', '..XYYWYYX..', '..XYYYYYX..', '..XXXXXXX..', '...XXXXX...', '...........', '...........'],
  crown: ['...........', '...........', '.X...X...X.', '.XY.XYX.YX.', '.XYXXYXXYX.', '.XYYYYYYYX.', '.XYRYYYRYX.', '.XYYYYYYYX.', '.XXXXXXXXX.', '...........', '...........'],
};
const GEAR_ART = ['.....YYY.....', '..Y..YYY..Y..', '..YYYYYYYYY..', '...YYYYYYY...', '.YYYYY.YYYYY.', 'YYYYY...YYYYY', 'YYYY.....YYYY', 'YYYYY...YYYYY', '.YYYYY.YYYYY.', '...YYYYYYY...', '..YYYYYYYYY..', '..Y..YYY..Y..', '.....YYY.....'];
const itemCache = {};
function itemIcon(id) { if (itemCache[id]) return itemCache[id]; const [c, x] = mk(11, 11);
  (ITEM_ART[id] || ITEM_ART.scarf).forEach((r, j) => { for (let i = 0; i < 11; i++) { const ch = r[i]; if (ch && ch !== '.') { x.fillStyle = ICON_PAL[ch]; x.fillRect(i, j, 1, 1); } } }); return itemCache[id] = c; }

/* ---------------- fond : mur de pierre pré-dessiné ---------------- */
const [hudBg, hb] = mk(W, HUD_H);
{ const rr = rng(77), arch = [];
  hb.fillStyle = '#121821'; hb.fillRect(0, 0, W, HUD_H);
  for (let y = 4, row = 0; y < HUD_H; y += 6, row++) { hb.fillStyle = '#0b1016'; hb.fillRect(0, y, W, 1);
    for (let x = -(row % 2) * 8; x < W; x += 16 + (rr() * 6 | 0)) { hb.fillStyle = ['#161d27', '#19212c', '#141a23'][rr() * 3 | 0]; hb.fillRect(x + 1, y + 1, 15, 5); hb.fillStyle = '#1f2834'; hb.fillRect(x + 1, y + 1, 15, 1); hb.fillStyle = '#0b1016'; hb.fillRect(x, y + 1, 1, 5); } }
  hb.fillStyle = '#3d4d5c'; hb.fillRect(0, 0, W, 3); hb.fillStyle = '#5c7283'; hb.fillRect(0, 0, W, 1); hb.fillStyle = '#05070c'; hb.fillRect(0, 3, W, 1);
  for (let x = 0; x < W; x++) if (rr() < .22) { hb.fillStyle = rr() < .5 ? '#355c3e' : '#4c7a4c'; hb.fillRect(x, 0, 1 + (rr() * 2 | 0), 1); }
  for (const x0 of [193, 318, 378]) { const l = 4 + (rr() * 9 | 0); for (let i = 0; i < l; i++) { hb.fillStyle = rr() < .4 ? '#2c5236' : '#1c3526'; hb.fillRect(x0 + Math.round(Math.sin(i * .7)), 4 + i, 1, 1); } }
  // ardoise du chat, creusée dans la pierre
  const S = SLATE, sx = S.x, sy = S.y, sw = S.w, sh = S.h;
  hb.fillStyle = '#05070c'; hb.fillRect(sx - 1, sy - 1, sw + 2, sh + 2); hb.fillStyle = '#0a0e15'; hb.fillRect(sx, sy, sw, sh);
  hb.fillStyle = '#05070c'; hb.fillRect(sx, sy, sw, 2); hb.fillRect(sx, sy, 2, sh);
  hb.fillStyle = '#3d4d5c'; hb.fillRect(sx, sy + sh - 1, sw, 1); hb.fillRect(sx + sw - 1, sy, 1, sh);
  hb.fillStyle = '#161d27'; hb.fillRect(sx + 3, sy + 50, sw - 6, 1);                       // filet au-dessus de la saisie
  hb.fillStyle = '#06090e'; hb.fillRect(sx + 3, sy + 52, sw - 6, 10); hb.fillStyle = '#1a222d'; hb.fillRect(sx + 3, sy + 62, sw - 6, 1); hb.fillStyle = '#020305'; hb.fillRect(sx + 3, sy + 52, sw - 6, 1);
  // plume (champ de saisie)
  for (const [x, y, c] of [[14, 58, '#e9e2cc'], [13, 59, '#e9e2cc'], [12, 60, '#cfc6b0'], [11, 61, '#cfc6b0'], [10, 62, '#a8a08c'], [9, 63, '#5a3d24'], [8, 64, '#5a3d24'], [13, 58, '#cfc6b0'], [12, 59, '#a8a08c']]) { hb.fillStyle = c; hb.fillRect(x, y, 1, 1); }
  // plateau du petit menu, creusé lui aussi
  const T = TRAY;
  hb.fillStyle = '#05070c'; hb.fillRect(T.x - 1, T.y - 1, T.w + 2, T.h + 2); hb.fillStyle = '#0a0e15'; hb.fillRect(T.x, T.y, T.w, T.h);
  hb.fillStyle = '#05070c'; hb.fillRect(T.x, T.y, T.w, 2); hb.fillRect(T.x, T.y, 2, T.h); hb.fillStyle = '#3d4d5c'; hb.fillRect(T.x, T.y + T.h - 1, T.w, 1); hb.fillRect(T.x + T.w - 1, T.y, 1, T.h);
  hb.fillStyle = '#161d27'; hb.fillRect(T.x + 3, T.y + 17, T.w - 6, 1);
  // plateau du niveau / XP / or, creusé dans la pierre comme les autres
  const V = STATS;
  hb.fillStyle = '#05070c'; hb.fillRect(V.x - 1, V.y - 1, V.w + 2, V.h + 2); hb.fillStyle = '#0a0e15'; hb.fillRect(V.x, V.y, V.w, V.h);
  hb.fillStyle = '#05070c'; hb.fillRect(V.x, V.y, V.w, 2); hb.fillRect(V.x, V.y, 2, V.h); hb.fillStyle = '#3d4d5c'; hb.fillRect(V.x, V.y + V.h - 1, V.w, 1); hb.fillRect(V.x + V.w - 1, V.y, 1, V.h);
  hb.fillStyle = '#161d27'; hb.fillRect(V.x + 3, V.y + 48, V.w - 6, 1);
}

/* ---------------- dessin, à chaque image ---------------- */
function drawSlot(x, y, st) {
  const { empty, locked, active, hov, press } = st, z = SLOT.size;
  hx.fillStyle = '#05070c'; hx.fillRect(x - 1, y - 1, z + 2, z + 2);
  hx.fillStyle = empty ? '#0f151e' : locked ? '#151b24' : active ? '#4a3a1e' : '#273140'; hx.fillRect(x, y, z, z);
  if (empty) { hx.fillStyle = '#080c12'; hx.fillRect(x, y, z, 1); hx.fillRect(x, y, 1, z); hx.fillStyle = '#1a232f'; hx.fillRect(x, y + z - 1, z, 1); hx.fillRect(x + z - 1, y, 1, z); return; }
  hx.fillStyle = locked ? '#1f2732' : hov ? '#c9a24a' : '#46566c'; hx.fillRect(x, y + press, z, 1); hx.fillRect(x, y, 1, z);
  hx.fillStyle = '#10151c'; hx.fillRect(x, y + z - 1, z, 1); hx.fillRect(x + z - 1, y, 1, z);
  if (hov && !locked) { hx.fillStyle = '#c9a24a'; hx.fillRect(x + z - 1, y, 1, z); hx.fillRect(x, y + z - 1, z, 1); }
  if (active) { hx.fillStyle = '#e8c860'; hx.fillRect(x, y, z, 1); hx.fillRect(x, y + z - 1, z, 1); hx.fillRect(x, y, 1, z); hx.fillRect(x + z - 1, y, 1, z); }
}
const lockMark = (x, y) => { hx.fillStyle = '#9aa4b4'; hx.fillRect(x + 15, y + 13, 3, 1); hx.fillRect(x + 14, y + 14, 1, 2); hx.fillRect(x + 18, y + 14, 1, 2); hx.fillStyle = '#c9a24a'; hx.fillRect(x + 14, y + 16, 5, 3); hx.fillStyle = '#5a4214'; hx.fillRect(x + 16, y + 17, 1, 1); };
function drawHud() {
  hx.drawImage(hudBg, 0, 0);
  // petit menu : actions (touches 1 à 8, F) ou objets
  const items = invItems();
  for (let i = 0; i < SLOT.cols * SLOT.rows; i++) { const { x, y } = slotPos(i), hov = HUD.hover === 's' + i, press = time - (HUD.press[i] || -9) < .14 ? 1 : 0;
    if (invTab === 'actions') {
      if (i === PHOENIX_SLOT) { const on = player && player.mount; drawSlot(x, y, { active: on, hov, press }); hx.drawImage(iconCanvas('phoenix'), x + 5, y + 5 + press); hx.drawImage(txt('F', '#7f93a6', null), x + 1, y + 1); continue; }
      const a = ACTIONS[i]; if (!a) { drawSlot(x, y, { empty: true }); continue; }
      const lk = PROG.lvl < a.lvl, active = player && ((player.act && player.act.id === a.id) || (a.id === 'wave' && player.waveT > 0));
      drawSlot(x, y, { locked: lk, active, hov, press });
      hx.globalAlpha = lk ? .28 : 1; hx.drawImage(iconCanvas(a.icon), x + 5, y + 5 + press); hx.globalAlpha = 1;
      hx.drawImage(txt(String(i + 1), lk ? '#3a4656' : '#7f93a6', null), x + 1, y + 1);
      if (lk) lockMark(x, y);
    } else {
      const it = items[i]; if (!it) { drawSlot(x, y, { empty: true }); continue; }
      const eq = PROG.acc === it.id; drawSlot(x, y, { active: eq, hov, press });
      hx.drawImage(itemIcon(it.id), x + 5, y + 5 + press);
      if (eq) { hx.fillStyle = '#e8c860'; hx.fillRect(x + SLOT.size - 6, y + 3, 3, 3); hx.fillStyle = '#14101c'; hx.fillRect(x + SLOT.size - 5, y + 4, 1, 1); }
    } }
  invEmptyEl.style.display = invTab === 'items' && !items.length ? 'flex' : 'none';
  // sceau « envoyer »
  { const hov = HUD.hover === 'send', cx = 181, cy = 62; hx.fillStyle = '#05070c'; disc(hx, cx, cy, 4); hx.fillStyle = hov ? '#e8c860' : '#c9a24a'; disc(hx, cx, cy, 3); hx.fillStyle = '#7a1e2a'; hx.fillRect(cx - 2, cy, 4, 1); hx.fillRect(cx, cy - 1, 1, 1); hx.fillRect(cx, cy + 1, 1, 1); hx.fillRect(cx + 1, cy, 1, 1); }
  drawStats(); drawGear(); drawMapBtn(); drawSocBtn();
}

/* ---------------- niveau, fiole d'XP et pièces d’or (en bas à droite) ---------------- */
const thLvl = document.getElementById('thLvl'), thXpT = document.getElementById('thXpT');
const invEmptyEl = document.getElementById('invEmpty');
let thCache = '';
function drawStats() {
  const cx = STATS.x + 29, cy = 19;
  // médaillon de niveau : acier et bleu nuit, pour ne pas le confondre avec la pièce d'or
  hx.fillStyle = '#05070c'; disc(hx, cx, 21, 10); hx.fillStyle = '#5c7283'; disc(hx, cx, 21, 9); hx.fillStyle = '#8aa0b2'; disc(hx, cx - 1, 20, 8); hx.fillStyle = '#5c7283'; disc(hx, cx, 21, 8); hx.fillStyle = '#1a2a42'; disc(hx, cx, 21, 7); hx.fillStyle = '#243a5a'; disc(hx, cx, 22, 5);
  // fiole d'XP (fine, sans texte dessus : le chiffre est écrit en dessous, bien lisible)
  { const n = need(PROG.lvl), x = STATS.x + 3, y = 33, w = 53, p = Math.min(1, PROG.xp / n), fl = Math.round((w - 6) * p), glowT = time - HUD.bump;
    hx.fillStyle = '#05070c'; hx.fillRect(x, y, w, 9); hx.fillStyle = '#9a7428'; hx.fillRect(x, y + 1, 3, 7); hx.fillRect(x + w - 3, y + 1, 3, 7); hx.fillStyle = '#e0b85a'; hx.fillRect(x, y + 1, 3, 1); hx.fillRect(x + w - 3, y + 1, 3, 1);
    hx.fillStyle = '#0d1622'; hx.fillRect(x + 3, y + 1, w - 6, 7);
    if (fl > 0) { hx.fillStyle = '#2a7aa8'; hx.fillRect(x + 3, y + 2, fl, 5); hx.fillStyle = '#4fb8e0'; hx.fillRect(x + 3, y + 2, fl, 3); hx.fillStyle = '#a8f0ff'; hx.fillRect(x + 3, y + 2, fl, 1);
      for (let i = 0; i < 3; i++) { const bx = x + 4 + ((time * (6 + i * 3) + i * 13) % Math.max(1, fl - 1)), by = y + 3 + ((time * 2 + i) % 3 | 0); hx.fillStyle = '#d8faff'; hx.fillRect(Math.round(bx), by, 1, 1); } }
    hx.fillStyle = 'rgba(255,255,255,.16)'; hx.fillRect(x + 3, y + 1, w - 6, 1);
    if (glowT < .5) { hx.fillStyle = `rgba(168,240,255,${.5 - glowT})`; hx.fillRect(x - 1, y - 1, w + 2, 11); }
    const key = PROG.lvl + '|' + PROG.xp + '|' + n; if (key !== thCache) { thCache = key; thLvl.textContent = PROG.lvl; thXpT.textContent = `${PROG.xp} / ${n} XP`; } }
  // filet de séparation puis pièce d'or
  hx.fillStyle = '#05070c'; hx.fillRect(STATS.x + 4, 54, STATS.w - 8, 1); hx.fillStyle = '#26354a'; hx.fillRect(STATS.x + 4, 55, STATS.w - 8, 1);
  // pièce d'or
  hx.drawImage(iconCanvas('shard'), STATS.x + 5, 57 + (time - HUD.bump2 < .3 ? -1 : 0));
}
// « +N XP » qui monte à côté de la carte ; les gains rapprochés s'additionnent
let popEl = null, popN = 0, popT = -9;
function hudPop(n) {
  if (popEl && popEl.isConnected && time - popT < .5) { popN += n; popEl.textContent = `+${popN} XP`; popEl.style.animation = 'none'; void popEl.offsetWidth; popEl.style.animation = ''; }
  else { popN = n; popEl = document.createElement('div'); popEl.className = 'xpPop'; popEl.textContent = `+${n} XP`; panelEl.appendChild(popEl); const me = popEl; setTimeout(() => me.remove(), 1400); }
  popT = time;
}

/* ---------------- rouage des options (haut à droite) ---------------- */
const gearBtn = document.getElementById('gear'), gearCv = document.getElementById('gearCv'), gx = gearCv.getContext('2d'), optMenu = document.getElementById('optMenu');
gearCv.width = 22; gearCv.height = 22; gx.imageSmoothingEnabled = false;
let gearKey = '';
function drawGear() {
  const open = optMenu.classList.contains('on'), hov = HUD.hover === 'gear', key = '' + open + hov; if (key === gearKey) return; gearKey = key;
  gx.clearRect(0, 0, 22, 22); gx.fillStyle = '#05070c'; disc(gx, 11, 11, 11); gx.fillStyle = open ? '#e0b85a' : hov ? '#c9a24a' : '#5a6272'; disc(gx, 11, 11, 10); gx.fillStyle = open ? '#3a1a0c' : '#1a212b'; disc(gx, 11, 11, 9);
  GEAR_ART.forEach((r, j) => { for (let i = 0; i < 13; i++) { if (r[i] !== 'Y') continue; gx.fillStyle = open ? '#e8c860' : hov ? '#e6e0cc' : '#a9b6c4'; gx.fillRect(5 + i, 5 + j, 1, 1); if (j < 12 && r[i] === 'Y' && GEAR_ART[j + 1][i] !== 'Y') { gx.fillStyle = open ? '#9a7428' : '#5f6d7c'; gx.fillRect(5 + i, 5 + j, 1, 1); } } });
}
const soundBtn = optMenu.querySelector('[data-o="sound"]');
const refreshOpt = () => { soundBtn.textContent = SND.on ? 'Son : activé' : 'Son : coupé'; };
function toggleOpt(on) { optMenu.classList.toggle('on', on ?? !optMenu.classList.contains('on')); refreshOpt(); gearKey = ''; }
gearBtn.addEventListener('click', () => { gearBtn.blur(); sfx.click(); toggleOpt(); });
gearBtn.addEventListener('mouseenter', () => HUD.hover = 'gear'); gearBtn.addEventListener('mouseleave', () => { if (HUD.hover === 'gear') HUD.hover = null; });
optMenu.addEventListener('click', ev => { const b = ev.target.closest('button'); if (!b) return; b.blur(); sfx.click();
  if (b.dataset.o === 'sound') { audioInit(); setSound(!SND.on); refreshOpt(); return; }
  toggleOpt(false); if (b.dataset.o === 'help') openModal('helpM'); else if (player) quitterPartie(); });
document.addEventListener('mousedown', ev => { if (optMenu.classList.contains('on') && !ev.target.closest('#optMenu, #gear')) toggleOpt(false); });
document.addEventListener('keydown', ev => { if (ev.key === 'Escape' && optMenu.classList.contains('on')) toggleOpt(false); });
tipOn(gearBtn, '<b>Options</b> · son, aide, menu principal');

/* ---------------- éléments HTML posés sur le canvas ---------------- */
function place(el, x, y, w, h) { el.style.left = `calc(var(--s) * ${x}px)`; el.style.top = `calc(var(--s) * ${y}px)`; el.style.width = `calc(var(--s) * ${w}px)`; el.style.height = `calc(var(--s) * ${h}px)`; }
const tipEl = document.getElementById('tip');
function tipOn(el, html) {
  const show = () => { const h = typeof html === 'function' ? html() : html; if (!h) { tipEl.style.display = 'none'; return false; } tipEl.innerHTML = h; tipEl.style.display = 'block'; return true; };
  el.addEventListener('mouseenter', show);
  el.addEventListener('mousemove', ev => { if (!show()) return; tipEl.style.left = Math.min(innerWidth - tipEl.offsetWidth - 8, ev.clientX + 12) + 'px'; tipEl.style.top = (ev.clientY - tipEl.offsetHeight - 10) + 'px'; });
  el.addEventListener('mouseleave', () => tipEl.style.display = 'none'); }
function hit(id, x, y, w, h, onClick, tip) { const b = document.createElement('button'); b.type = 'button'; b.className = 'hit'; place(b, x, y, w, h); panelEl.appendChild(b);
  b.addEventListener('mouseenter', () => HUD.hover = id); b.addEventListener('mouseleave', () => { if (HUD.hover === id) HUD.hover = null; });
  b.addEventListener('click', () => { b.blur(); sfx.click(); onClick(); }); if (tip) tipOn(b, tip); return b; }

// chat : le journal et la saisie sont des éléments HTML posés sur l'ardoise
place(document.getElementById('log'), 8, 6, 179, 47);
place(document.getElementById('chatIn'), 17, 57, 154, 10);
hit('send', 176, 57, 10, 10, () => document.getElementById('chat').requestSubmit(), '<b>Envoyer</b> · Entrée');
// onglets du petit menu
const tabsEl = document.getElementById('invTabs'); place(tabsEl, TRAY.x + 3, TRAY.y + 3, TRAY.w - 6, 12);
function setInvTab(t) { invTab = t; for (const b of tabsEl.children) b.classList.toggle('on', b.dataset.t === t); }
for (const b of tabsEl.children) b.addEventListener('click', () => { b.blur(); sfx.click(); setInvTab(b.dataset.t); });
setInvTab('actions');
place(invEmptyEl, SLOT.x - 1, SLOT.y - 1, SLOT.cols * SLOT.pitch - 1, SLOT.rows * SLOT.pitch - 1);

// équiper / retirer un accessoire depuis le sac
async function equiper(id) {
  const r = await api('apparence', { acc: PROG.acc === id ? null : id }); if (r.error) { toast(r.error); return; }
  if (r.user) appliquerCompte(r.user, false);
}
for (let i = 0; i < SLOT.cols * SLOT.rows; i++) { const { x, y } = slotPos(i);
  hit('s' + i, x, y, SLOT.size, SLOT.size, () => {
    if (invTab === 'actions') { if (i === PHOENIX_SLOT) { toggleMount(player); return; } if (ACTIONS[i]) { HUD.press[i] = time; tryAct(i); } return; }
    const it = invItems()[i]; if (it) equiper(it.id);
  }, () => {
    if (invTab === 'actions') { if (i === PHOENIX_SLOT) return player && player.mount ? '<b>Renvoyer le phénix</b> · touche F' : '<b>Phénix noir</b> · touche F';
      const a = ACTIONS[i]; return !a ? '' : PROG.lvl < a.lvl ? `<b>${a.name}</b> · niveau ${a.lvl} requis` : `<b>${a.name}</b> · touche ${i + 1}`; }
    const it = invItems()[i]; return it ? `<b>${it.name}</b> · ${PROG.acc === it.id ? 'équipé : clique pour retirer' : 'clique pour équiper'}` : '';
  }); }
hit('stats', STATS.x, STATS.y, STATS.w, STATS.h, () => {}, () => `Niveau <b>${PROG.lvl}</b> · encore <b>${need(PROG.lvl) - PROG.xp} XP</b> avant le niveau ${PROG.lvl + 1}<br><b>${PROG.shards}</b> pièces d’or · à dépenser dans la boutique du menu`);
