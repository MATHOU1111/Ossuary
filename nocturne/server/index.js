'use strict';
/*
 * Ossuary — serveur de jeu
 * 1. Sert les fichiers du dossier public/ (le jeu) en HTTP.
 * 2. Gère les comptes joueurs (server/comptes.js) : inscription, connexion, progression, boutique.
 * 3. Relaie en temps réel, via WebSocket sur /ws, les positions, le chat et les actions entre joueurs connectés.
 *
 * Le serveur ne fait confiance à rien : chaque message est vérifié et « nettoyé » avant d'être retransmis.
 * Lancer : npm start   (ou npm run dev pour redémarrer automatiquement à chaque modification du serveur)
 */
const config = require('./config');   // lit le fichier .env (MongoDB, port…)
const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { WebSocketServer } = require('ws');
const comptes = require('./comptes');
const social = require('./social');
const REGLES = require('../public/js/regles.js');

const PORT = config.PORT;
const HOST = config.HOST;           // 0.0.0.0 = accessible depuis les autres machines du réseau
const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const AFFICHES_FILE = path.join(__dirname, '..', 'config', 'affiches.json');   // affiches du cinéma en plein air (modifiées plus tard par l'admin)

// Valeurs autorisées (à garder synchronisées avec le client)
const ROOMS = ['remparts', 'trone', 'chateau', 'caveau', 'catacombes', 'sommet', 'cinema'];
const ACTIONS = ['wave', 'sit', 'heart', 'laugh', 'surprise', 'dance', 'sleep', 'angry', 'attack', 'die'];
const MAX_MSG_PER_SEC = 40;   // anti-flood (le client envoie ~14 positions/s)
const CHAT_COOLDOWN_MS = 600;

/* ------------------------------------------------------------------ la séance de cinéma commune */
// Le serveur garde l'horloge du film (en lecture ?, position, boucle, durée) : tout le monde voit le même moment,
// même en arrivant en cours de séance. Seuls les admins la pilotent. Gardée dans data/seance.json (survit à un redémarrage).
const SEANCE_FILE = path.join(__dirname, '..', 'data', 'seance.json');
let seance = { playing: false, pos: 0, at: Date.now(), loop: true, dur: 0 };
try { const s = JSON.parse(fs.readFileSync(SEANCE_FILE, 'utf8')); seance = { ...seance, ...s }; } catch { }
function seancePos() {
  let p = seance.pos + (seance.playing ? (Date.now() - seance.at) / 1000 : 0);
  if (seance.dur > 0) p = seance.loop ? p % seance.dur : Math.min(p, seance.dur);
  return p;
}
const seanceMsg = id => ({ type: 'film', id: id || 'srv', act: seance.playing ? 'play' : 'pause', t: seancePos(), loop: seance.loop, dur: seance.dur });
function seanceSauver() { fs.mkdir(path.dirname(SEANCE_FILE), { recursive: true }, () => fs.writeFile(SEANCE_FILE, JSON.stringify(seance), () => { })); }

/* ------------------------------------------------------------------ HTTP (fichiers statiques) */
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
  '.woff2': 'font/woff2', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.wav': 'audio/wav',
  '.vtt': 'text/vtt; charset=utf-8', '.srt': 'text/plain; charset=utf-8',
  '.mp4': 'video/mp4', '.m4v': 'video/mp4', '.webm': 'video/webm', '.mov': 'video/quicktime', '.txt': 'text/plain; charset=utf-8',
};
const server = http.createServer((req, res) => {
  let urlPath;
  try { urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname); } catch { res.writeHead(400).end(); return; }
  if (urlPath === '/api/affiches') { // lu à chaque requête : une modification du fichier est visible sans redémarrer
    fs.readFile(AFFICHES_FILE, 'utf8', (err, txt) => {
      let data = { affiches: [] };
      if (!err) try { data = JSON.parse(txt); } catch (e) { console.warn('[affiches] config/affiches.json invalide :', e.message); }
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }).end(JSON.stringify(data)); });
    return; }
  if (urlPath === '/api/statut') { res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' })
      .end(JSON.stringify({ enLigne: [...clients.values()].filter(c => c.state).length, comptes: comptes.nbComptes() })); return; }
  if (urlPath.startsWith('/api/')) { comptes.route(req, res, urlPath).catch(e => { console.error(e); if (!res.headersSent) res.writeHead(500).end(); }); return; }
  if (urlPath === '/') urlPath = '/index.html';
  const file = path.normalize(path.join(PUBLIC_DIR, urlPath));
  if (!file.startsWith(PUBLIC_DIR + path.sep)) { res.writeHead(403).end(); return; }  // empêche ../
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Introuvable'); return; }
    const type = MIME[path.extname(file).toLowerCase()] || 'application/octet-stream';
    // Les vidéos sont envoyées par morceaux (en-tête Range) : indispensable pour avancer dans un film
    const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || '');
    if (range) {
      let start = range[1] === '' ? st.size - Number(range[2]) : Number(range[1]);
      let end = range[1] !== '' && range[2] !== '' ? Number(range[2]) : st.size - 1;
      if (isNaN(start) || start < 0) start = 0; end = Math.min(end, st.size - 1);
      if (start > end) { res.writeHead(416, { 'Content-Range': `bytes */${st.size}` }).end(); return; }
      res.writeHead(206, { 'Content-Type': type, 'Content-Range': `bytes ${start}-${end}/${st.size}`, 'Accept-Ranges': 'bytes', 'Content-Length': end - start + 1, 'Cache-Control': 'no-cache' });
      fs.createReadStream(file, { start, end }).pipe(res);
    } else {
      res.writeHead(200, { 'Content-Type': type, 'Content-Length': st.size, 'Accept-Ranges': 'bytes', 'Cache-Control': 'no-cache' });
      fs.createReadStream(file).pipe(res);
    }
  });
});

/* ------------------------------------------------------------------ WebSocket (temps réel) */
const wss = new WebSocketServer({ server, path: '/ws', maxPayload: 4 * 1024 });
const clients = new Map(); // ws -> { id, name, state, alive, count, windowStart, lastChat }
social.attach(clients);
comptes.surEnLigne(cle => [...clients.values()].some(c => c.user && REGLES.cle(c.user.name) === cle));

const num = (v, min, max) => (typeof v === 'number' && isFinite(v) ? Math.max(min, Math.min(max, v)) : 0);
const str = (v, max) => (typeof v === 'string' ? v.replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, max) : '');

function clean(m, c) {
  switch (m.type) {
    case 'state': {
      const u = c.user;   // pseudo, couleur, accessoire et niveau viennent du compte, pas du navigateur
      return {
        type: 'state', id: c.id, name: u.name,
        color: u.look.color,
        skin: REGLES.SKINS.some(s => s.id === u.look.skin) ? u.look.skin : 'capuche', room: ROOMS.includes(m.room) ? m.room : 'remparts',
        x: num(m.x, 0, 384), y: num(m.y, -300, 240), vx: num(m.vx, -200, 200), vy: num(m.vy, -500, 500),
        face: m.face === -1 ? -1 : 1, ground: !!m.ground, sl: m.sl ? 1 : 0, ar: m.ar ? 1 : 0, cl: !!m.cl, mt: !!m.mt,
        acc: u.look.acc, lvl: u.prog.lvl,
      };
    }
    case 'chat': {
      const msg = str(m.msg, 80); const now = Date.now();
      if (!msg || now - c.lastChat < CHAT_COOLDOWN_MS) return null;
      c.lastChat = now;
      console.log(`[chat] ${c.state ? c.state.name : '?'} (${c.state ? c.state.room : '?'}) : ${msg}`);
      return { type: 'chat', id: c.id, msg };
    }
    case 'act': return ACTIONS.includes(m.a) ? { type: 'act', id: c.id, a: m.a } : null;
    case 'emote': return { type: 'emote', id: c.id };
    case 'film': {   // seuls les admins pilotent la séance commune
      if (!['play', 'pause'].includes(m.act) || c.user.role !== 'admin') return null;
      seance = { playing: m.act === 'play', pos: num(m.t, 0, 1e7), at: Date.now(), loop: !!m.loop, dur: num(m.dur, 0, 1e7) }; seanceSauver();
      console.log(`[cinéma] ${c.user.name} : ${seance.playing ? 'lecture' : 'pause'} à ${Math.round(seance.pos)} s${seance.loop ? ' (en boucle)' : ''}`);
      return seanceMsg(c.id);
    }
    case 'leave': return null; // géré à la déconnexion
    default: return null;
  }
}
function broadcast(msg, except) {
  const data = JSON.stringify(msg);
  for (const ws of clients.keys()) if (ws !== except && ws.readyState === 1) ws.send(data);
}

wss.on('connection', (ws, req) => {
  // Il faut être connecté à un compte : le jeton est passé dans l'adresse (/ws?t=…)
  let user = null; try { user = comptes.compteDuJeton(new URL(req.url, 'http://x').searchParams.get('t')); } catch { }
  if (!user) { ws.close(4003, 'session'); return; }
  for (const [o, oc] of clients) if (oc.user === user) o.close(4001, 'ailleurs');   // un compte = une seule connexion à la fois
  const c = { id: null, user, state: null, alive: true, count: 0, windowStart: Date.now(), lastChat: 0 };
  clients.set(ws, c);
  social.connecte(ws, c);
  // Le nouveau venu reçoit tout de suite l'état des joueurs déjà présents
  const list = [...clients.values()].filter(o => o !== c && o.state).map(o => o.state);
  if (list.length) ws.send(JSON.stringify({ type: 'batch', list }));
  ws.send(JSON.stringify(seanceMsg()));   // où en est la séance de cinéma

  ws.on('pong', () => { c.alive = true; });
  ws.on('message', raw => {
    const now = Date.now();
    if (now - c.windowStart > 1000) { c.windowStart = now; c.count = 0; }
    if (++c.count > MAX_MSG_PER_SEC) return;
    let m; try { m = JSON.parse(raw); } catch { return; }
    if (!m || typeof m.type !== 'string' || typeof m.id !== 'string' || m.id.length > 48) return;
    if (!c.id) { c.id = m.id; }
    else if (m.id !== c.id) return;               // un client ne peut parler qu'en son nom
    if (m.type === 'soc') { try { social.agir(ws, c, m); } catch (e) { console.error('[social]', e); } return; }   // MP, amis, clans : voir server/social.js
    const out = clean(m, c); if (!out) return;
    if (out.type === 'state') {
      if (!c.state) console.log(`[+] ${out.name} est arrivé (${clients.size} connecté·s)`);
      c.state = out;
    }
    broadcast(out, ws);
  });
  ws.on('close', () => {
    clients.delete(ws); social.deconnecte(c);
    if (c.id) { broadcast({ type: 'leave', id: c.id }); console.log(`[-] ${c.state ? c.state.name : c.id} est parti (${clients.size} connecté·s)`); }
  });
  ws.on('error', () => {});
});

// Détecte les connexions mortes (onglet fermé brutalement, réseau coupé…)
setInterval(() => {
  for (const [ws, c] of clients) {
    if (!c.alive) { ws.terminate(); continue; }
    c.alive = false; ws.ping();
  }
}, 30000);

// on ouvre d'abord la base (MongoDB ou data/comptes.json), puis on accepte les joueurs
comptes.init().then(mode => server.listen(PORT, HOST, () => {
  console.log(`\n  🌙  Ossuary est lancé !  (${comptes.nbComptes()} compte·s, ${mode})\n`);
  console.log(`  Sur ce PC      : http://localhost:${PORT}`);
  for (const list of Object.values(os.networkInterfaces()))
    for (const a of list || []) if (a.family === 'IPv4' && !a.internal) console.log(`  Sur le réseau  : http://${a.address}:${PORT}`);
  console.log('\n  Ctrl+C pour arrêter.\n');
})).catch(e => {
  console.error("\n  ✖ Impossible d'ouvrir la base de données :", e.message);
  console.error('    Vérifie MONGODB_URI dans le fichier .env (voir .env.example), ou retire-la pour utiliser data/comptes.json.\n');
  process.exit(1);
});
