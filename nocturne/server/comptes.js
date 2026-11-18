'use strict';
/*
 * Comptes joueurs : inscription, connexion, progression, boutique, apparence, options, rôles (joueur / admin).
 * Les données sont rangées par server/stockage.js : MongoDB si MONGODB_URI est défini (.env), sinon data/comptes.json.
 * Les mots de passe ne sont jamais stockés en clair (scrypt + sel), les jetons de session non plus (sha256).
 * Le rôle n'est modifiable que par un admin (page Administration) ou par ADMINS=… dans .env, jamais par le navigateur.
 *
 * Routes (JSON) :
 *   POST /api/inscription  { name, pass }      → { token, user }
 *   POST /api/connexion    { name, pass }      → { token, user }
 *   GET  /api/moi                              → { user }            (en-tête Authorization: Bearer <jeton>)
 *   POST /api/deconnexion                      → { ok }
 *   POST /api/progression  { xp, lvl, … }      → { user }
 *   POST /api/acheter      { id }              → { user }
 *   POST /api/apparence    { color?, acc?, skin? } → { user }
 *   POST /api/options      { son? }            → { user }
 *   POST /api/motdepasse   { ancien, nouveau } → { ok, user }      (ferme les autres sessions du compte)
 *   Réservé aux admins :
 *   GET  /api/admin/joueurs                    → { joueurs: [{ name, role, lvl, xp, shards, created, vu, enLigne }] }
 *   POST /api/admin/role   { name, role }      → { ok }            (role : 'joueur' ou 'admin')
 */
const crypto = require('crypto');
const config = require('./config');
const stockage = require('./stockage');
const REGLES = require('../public/js/regles.js');

const SESSION_JOURS = 30, SESSIONS_MAX = 5;

/* ---------------- stockage ---------------- */
let db = { users: {}, clans: {} }, store = null;
const sessions = new Map();   // sha256(jeton) → clé du compte
async function init() {
  store = await stockage.ouvrir(); db = store.db;
  for (const [k, u] of Object.entries(db.users)) { if (!u.role) u.role = 'joueur'; for (const s of u.sessions || []) if (s.exp > Date.now()) sessions.set(s.h, k); }
  for (const n of config.ADMINS) { const u = db.users[REGLES.cle(n)];   // ADMINS=… dans .env : ces comptes sont admin
    if (u) { if (u.role !== 'admin') { u.role = 'admin'; console.log(`[comptes] ${u.name} est admin (ADMINS dans .env)`); } }
    else console.warn(`[comptes] ADMINS : le compte « ${n} » n'existe pas encore (il sera admin dès sa création)`); }
  sauver();
  let fini = false;
  for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, async () => { if (fini) return; fini = true;
    try { await store.sauver(true); await store.fermer(); } catch (e) { } process.exit(0); });
  return store.mode;
}
const sauver = now => store && store.sauver(now);

const hashMdp = (pass, sel) => crypto.scryptSync(pass, sel, 32).toString('hex');
const hashJeton = t => crypto.createHash('sha256').update(t).digest('hex');
const mdpOk = (u, pass) => typeof pass === 'string' && !!u.hash && crypto.timingSafeEqual(Buffer.from(hashMdp(pass, u.salt), 'hex'), Buffer.from(u.hash, 'hex'));
function ouvrirSession(cle) {
  const u = db.users[cle], t = crypto.randomBytes(24).toString('hex'), h = hashJeton(t);
  u.sessions = (u.sessions || []).filter(s => s.exp > Date.now()).slice(-(SESSIONS_MAX - 1));
  u.sessions.push({ h, exp: Date.now() + SESSION_JOURS * 864e5 }); u.vu = Date.now(); sessions.set(h, cle); sauver();
  return t;
}
function compteDuJeton(t) { if (typeof t !== 'string' || t.length > 100) return null; const cle = sessions.get(hashJeton(t)); return cle && db.users[cle] ? db.users[cle] : null; }
const estAdmin = u => !!u && u.role === 'admin';

/* ---------------- limite d'essais de connexion (par adresse IP) ---------------- */
const essais = new Map();
function tropDEssais(ip) { const now = Date.now(), e = essais.get(ip) || { n: 0, t: now }; if (now - e.t > 60000) { e.n = 0; e.t = now; } e.n++; essais.set(ip, e); return e.n > 12; }
setInterval(() => { const now = Date.now(); for (const [ip, e] of essais) if (now - e.t > 60000) essais.delete(ip); }, 300000).unref();
// derrière nginx (TRUST_PROXY=1), la vraie adresse du joueur est dans X-Forwarded-For
const ipDe = req => (config.TRUST_PROXY && String(req.headers['x-forwarded-for'] || '').split(',')[0].trim()) || req.socket.remoteAddress || '?';

/* ---------------- HTTP ---------------- */
function lireCorps(req) {
  return new Promise(res => { let s = ''; req.on('data', d => { s += d; if (s.length > 16384) { req.destroy(); res(null); } });
    req.on('end', () => { try { res(s ? JSON.parse(s) : {}); } catch { res(null); } }); req.on('error', () => res(null)); });
}
const envoyer = (res, code, obj) => res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }).end(JSON.stringify(obj));
const jetonDe = req => (/^Bearer\s+(\S+)$/.exec(req.headers.authorization || '') || [])[1];
let enLigne = () => false;   // fourni par server/index.js (le compte a-t-il une connexion de jeu ouverte ?)

async function route(req, res, url) {
  if (!url.startsWith('/api/') || ['/api/affiches'].includes(url)) return false;
  const ip = ipDe(req);
  if (req.method === 'GET' && url === '/api/moi') { const u = compteDuJeton(jetonDe(req)); if (u) { u.vu = Date.now(); sauver(); } u ? envoyer(res, 200, { user: REGLES.public(u) }) : envoyer(res, 401, { error: 'Session expirée, reconnecte-toi.' }); return true; }
  if (req.method === 'GET' && url === '/api/admin/joueurs') {
    const u = compteDuJeton(jetonDe(req)); if (!estAdmin(u)) { envoyer(res, 403, { error: 'Réservé aux admins.' }); return true; }
    const joueurs = Object.entries(db.users).map(([k, x]) => ({ name: x.name, role: x.role || 'joueur', lvl: x.prog.lvl, xp: x.prog.xp, shards: x.prog.shards, skin: x.look.skin, created: x.created, vu: x.vu || null, enLigne: enLigne(k) }));
    envoyer(res, 200, { joueurs }); return true;
  }
  if (req.method !== 'POST') { envoyer(res, 405, { error: 'Méthode non autorisée' }); return true; }
  const b = await lireCorps(req); if (!b) { envoyer(res, 400, { error: 'Requête invalide' }); return true; }

  if (url === '/api/inscription' || url === '/api/connexion') {
    if (tropDEssais(ip)) { envoyer(res, 429, { error: 'Trop de tentatives, réessaie dans une minute.' }); return true; }
    const name = typeof b.name === 'string' ? b.name.trim() : '', pass = b.pass;
    if (!REGLES.nomValide(name)) { envoyer(res, 400, { error: 'Pseudo : 3 à 14 lettres, chiffres, - ou _.' }); return true; }
    if (!REGLES.mdpValide(pass)) { envoyer(res, 400, { error: 'Mot de passe : 4 caractères minimum.' }); return true; }
    const cle = REGLES.cle(name);
    if (url === '/api/inscription') {
      if (db.users[cle]) { envoyer(res, 409, { error: 'Ce pseudo est déjà pris.' }); return true; }
      const sel = crypto.randomBytes(16).toString('hex'), u = REGLES.nouveau(name); u.salt = sel; u.hash = hashMdp(pass, sel); db.users[cle] = u;
      if (config.ADMINS.some(n => REGLES.cle(n) === cle)) u.role = 'admin';
      console.log(`[comptes] nouveau compte : ${name}`);
    } else if (!db.users[cle] || !mdpOk(db.users[cle], pass)) { envoyer(res, 401, { error: 'Pseudo ou mot de passe incorrect.' }); return true; }
    envoyer(res, 200, { token: ouvrirSession(cle), user: REGLES.public(db.users[cle]) }); return true;
  }
  const t = jetonDe(req), u = compteDuJeton(t);
  if (!u) { envoyer(res, 401, { error: 'Session expirée, reconnecte-toi.' }); return true; }
  if (url === '/api/deconnexion') { const h = hashJeton(t); sessions.delete(h); u.sessions = (u.sessions || []).filter(s => s.h !== h); sauver(); envoyer(res, 200, { ok: true }); return true; }
  if (url === '/api/motdepasse') {   // { ancien, nouveau } : les autres sessions du compte sont fermées
    if (tropDEssais(ip)) { envoyer(res, 429, { error: 'Trop de tentatives, réessaie dans une minute.' }); return true; }
    if (!mdpOk(u, b.ancien)) { envoyer(res, 401, { error: 'Mot de passe actuel incorrect.' }); return true; }
    if (!REGLES.mdpValide(b.nouveau)) { envoyer(res, 400, { error: 'Nouveau mot de passe : 4 caractères minimum.' }); return true; }
    u.salt = crypto.randomBytes(16).toString('hex'); u.hash = hashMdp(b.nouveau, u.salt);
    const h = hashJeton(t); for (const s of u.sessions || []) if (s.h !== h) sessions.delete(s.h);
    u.sessions = (u.sessions || []).filter(s => s.h === h); sauver();
    console.log(`[comptes] mot de passe changé : ${u.name}`);
    envoyer(res, 200, { ok: true, user: REGLES.public(u) }); return true;
  }
  if (url === '/api/admin/role') {
    if (!estAdmin(u)) { envoyer(res, 403, { error: 'Réservé aux admins.' }); return true; }
    const cible = typeof b.name === 'string' && db.users[REGLES.cle(b.name.trim())];
    if (!cible) { envoyer(res, 404, { error: 'Joueur introuvable.' }); return true; }
    if (!REGLES.ROLES.includes(b.role)) { envoyer(res, 400, { error: 'Rôle inconnu.' }); return true; }
    if (cible === u && b.role !== 'admin') { envoyer(res, 400, { error: 'Tu ne peux pas te retirer toi-même le rôle admin.' }); return true; }
    cible.role = b.role; sauver(true);
    console.log(`[admin] ${u.name} → ${cible.name} est maintenant ${b.role}`);
    envoyer(res, 200, { ok: true }); return true;
  }
  let err = null;
  if (url === '/api/progression') REGLES.progression(u, b);
  else if (url === '/api/acheter') err = REGLES.acheter(u, b.id);
  else if (url === '/api/apparence') err = REGLES.apparence(u, b.color, b.acc, b.skin);
  else if (url === '/api/options') REGLES.options(u, b);
  else { envoyer(res, 404, { error: 'Route inconnue' }); return true; }
  if (err) { envoyer(res, 400, { error: err, user: REGLES.public(u) }); return true; }
  sauver(); envoyer(res, 200, { user: REGLES.public(u) }); return true;
}

module.exports = { init, route, compteDuJeton, estAdmin, nbComptes: () => Object.keys(db.users).length, db: () => db, sauver, surEnLigne: f => { enLigne = f; } };
