"use strict";
// Réseau.
// - Servi par le serveur Node (http://…) : WebSocket sur /ws, vrai multijoueur.
// - Fichier ouvert directement (file://) : BroadcastChannel, les onglets du même navigateur se voient.
// Le reste du jeu n'appelle que bc.postMessage(msg) : le transport est transparent.

/* ---------------- messages reçus ---------------- */
function handleNet(m) {
  if (m && m.type === 'soc') { socNet(m); return; }   // amis, MP, clan (voir social.js)
  if (!m || !m.id || (player && m.id === player.id)) return;
  if (m.type === 'state') { let r = remotes.get(m.id); const sk = SKINS[m.skin] ? m.skin : 'capuche';
    if (!r) { r = makeEnt(m.name, m.color, m.x, 'remote', sk); r.id = m.id; r.y = m.y; r.room = m.room || 'remparts'; remotes.set(m.id, r); setSkin(r, sk, m.color); }
    if (sk !== r.skin || m.color !== r.color) setSkin(r, sk, m.color);
    const rm = m.room || 'remparts'; if (rm !== r.room) { r.room = rm; r.x = r.tx = m.x; r.y = r.ty = m.y; r.lx = undefined; setSkin(r, r.skin, r.color); }
    Object.assign(r, { tx: m.x, ty: m.y, vx: m.vx, vy: m.vy || 0, face: m.face, ground: m.ground, last: time, name: m.name, climbing: m.cl ? {} : null, acc: m.acc || null, lvl: m.lvl || 1, armed: !!m.ar }); if (m.sl) r.slideT = .2;
    if (m.mt && !r.mount) { r.mount = true; r.phx = makePhx(r); phxBurst(r.x, r.y - 12, 16); }
    else if (!m.mt && r.mount) { r.mount = false; flyaways.push({ x: r.x, y: r.y, face: r.face, t: 0, phx: r.phx, room: r.room }); r.phx = null; } }
  else if (m.type === 'chat') { const r = remotes.get(m.id); if (r) say(r, m.msg); }
  else if (m.type === 'emote') { const r = remotes.get(m.id); if (r) startAct(r, 'wave', true); }
  else if (m.type === 'film') filmRemote(m);
  else if (m.type === 'act') { const r = remotes.get(m.id); if (r) startAct(r, m.a, true); }
  else if (m.type === 'leave') { const r = remotes.get(m.id); if (r) remotes.delete(m.id); }
}

/* ---------------- transport ---------------- */
// netStart() est appelé en cliquant sur « Jouer », netStop() en revenant au menu.
const NET = { mode: 'off', online: false };
let bc = null, sendT = 0, netGen = 0;
function netStart() {
  netStop(); const gen = ++netGen;
  if (!COMPTE.local) {
    const url = (location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host + '/ws?t=' + encodeURIComponent(COMPTE.token);
    let ws = null, retry = 1000, warned = false;
    const open = () => {
      if (gen !== netGen) return;
      ws = new WebSocket(url); NET.mode = 'ws';
      ws.onopen = () => { retry = 1000; NET.online = true; sendT = 0; if (warned) addSys('Reconnecté au serveur.', 'cyan'); warned = false; };
      ws.onmessage = ev => { let m; try { m = JSON.parse(ev.data); } catch (e) { return; } if (m.type === 'batch') m.list.forEach(handleNet); else handleNet(m); };
      ws.onclose = ev => { NET.online = false; if (gen !== netGen) return;
        if (ev.code === 4001) { quitterPartie("Ton compte vient de se connecter depuis un autre onglet ou un autre appareil."); return; }
        if (ev.code === 4003) { quitterPartie('Ta session a expiré, reconnecte-toi.', true); return; }
        if (!warned) { warned = true; addSys('Connexion au serveur perdue, nouvelle tentative…'); }
        setTimeout(open, retry); retry = Math.min(10000, retry * 2); };
    };
    bc = { postMessage(m) { if (ws && ws.readyState === 1) ws.send(JSON.stringify(m)); }, close() { if (ws) { ws.onclose = null; ws.close(); } } };
    open();
  } else {
    try { const ch = new BroadcastChannel('nocturne-proto'); ch.onmessage = ({ data }) => handleNet(data); bc = ch; NET.mode = 'local'; NET.online = true; } catch (e) { }
  }
}
function netStop() {
  netGen++; if (bc) { if (player) bc.postMessage({ type: 'leave', id: player.id }); try { bc.close(); } catch (e) { } }
  bc = null; NET.online = false; NET.mode = 'off'; remotes.clear(); if (typeof socReset === 'function') socReset();
}
addEventListener('beforeunload', () => { if (bc && player) bc.postMessage({ type: 'leave', id: player.id }); });
