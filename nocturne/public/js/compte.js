"use strict";
// Le compte du joueur, côté navigateur.
// - Avec le serveur Node : appels à /api/… (server/comptes.js), jeton de session gardé dans ce navigateur.
// - Sans serveur (fichier ouvert directement, version « un seul fichier ») : les comptes sont gardés dans ce navigateur,
//   avec exactement les mêmes règles (public/js/regles.js).

const COMPTE = { token: null, user: null, local: !!window.NOCTURNE_OFFLINE || !/^https?:$/.test(location.protocol) };
const LS = { get: k => { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: (k, v) => { try { v === null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch (e) { } } };

/* ---------------- comptes gardés dans le navigateur (mode hors-ligne) ---------------- */
const LOCAL_KEY = 'nocturne-comptes-local';
const localDb = () => { try { const d = JSON.parse(LS.get(LOCAL_KEY) || '{}'); d.users = d.users || {}; d.sessions = d.sessions || {}; return d; } catch (e) { return { users: {}, sessions: {} }; } };
const hex = buf => [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
async function sha(s) {
  if (window.crypto && crypto.subtle) return hex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)));
  let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return (h >>> 0).toString(16);
}
const aleatoire = n => { const a = new Uint8Array(n); crypto.getRandomValues(a); return hex(a); };
async function apiLocal(route, b, token) {
  const db = localDb(), done = (code, obj) => { LS.set(LOCAL_KEY, JSON.stringify(db)); return { code, ...obj }; };
  if (route === 'inscription' || route === 'connexion') {
    const name = (b.name || '').trim(); if (!REGLES.nomValide(name)) return { code: 400, error: 'Pseudo : 3 à 14 lettres, chiffres, - ou _.' };
    if (!REGLES.mdpValide(b.pass)) return { code: 400, error: 'Mot de passe : 4 caractères minimum.' };
    const cle = REGLES.cle(name);
    if (route === 'inscription') { if (db.users[cle]) return { code: 409, error: 'Ce pseudo est déjà pris.' };
      const u = REGLES.nouveau(name); u.salt = aleatoire(8); u.hash = await sha(u.salt + b.pass); db.users[cle] = u; }
    else { const u = db.users[cle]; if (!u || u.hash !== await sha(u.salt + b.pass)) return { code: 401, error: 'Pseudo ou mot de passe incorrect.' }; }
    const t = aleatoire(16); db.sessions[await sha(t)] = cle; return done(200, { token: t, user: REGLES.public(db.users[cle]) });
  }
  const cle = token && db.sessions[await sha(token)], u = cle && db.users[cle]; if (!u) return { code: 401, error: 'Session expirée, reconnecte-toi.' };
  if (route === 'moi') return { code: 200, user: REGLES.public(u) };
  if (route === 'deconnexion') { delete db.sessions[await sha(token)]; return done(200, { ok: true }); }
  if (route === 'motdepasse') {
    if (typeof b.ancien !== 'string' || u.hash !== await sha(u.salt + b.ancien)) return { code: 401, error: 'Mot de passe actuel incorrect.' };
    if (!REGLES.mdpValide(b.nouveau)) return { code: 400, error: 'Nouveau mot de passe : 4 caractères minimum.' };
    u.salt = aleatoire(8); u.hash = await sha(u.salt + b.nouveau);
    const h = await sha(token); for (const k of Object.keys(db.sessions)) if (db.sessions[k] === cle && k !== h) delete db.sessions[k];   // les autres sessions sont fermées
    return done(200, { ok: true, user: REGLES.public(u) });
  }
  let err = null;
  if (route === 'progression') REGLES.progression(u, b); else if (route === 'acheter') err = REGLES.acheter(u, b.id); else if (route === 'apparence') err = REGLES.apparence(u, b.color, b.acc, b.skin); else if (route === 'options') REGLES.options(u, b);
  else if (route.startsWith('admin/')) return { code: 403, error: "L'administration a besoin du serveur." };
  return done(err ? 400 : 200, { error: err || undefined, user: REGLES.public(u) });
}

/* ---------------- appel générique : renvoie { code, error?, user?, token? } ---------------- */
async function api(route, body, opts = {}) {
  if (COMPTE.local) return apiLocal(route, body || {}, COMPTE.token);
  try {
    const get = route === 'moi' || route === 'admin/joueurs';
    const r = await fetch('api/' + route, { method: get ? 'GET' : 'POST', keepalive: !!opts.keepalive,
      headers: { 'Content-Type': 'application/json', ...(COMPTE.token ? { Authorization: 'Bearer ' + COMPTE.token } : {}) },
      body: get ? undefined : JSON.stringify(body || {}) });
    const d = await r.json().catch(() => ({})); return { code: r.status, ...d };
  } catch (e) { return { code: 0, error: 'Serveur injoignable. Il est bien lancé (npm start) ?' }; }
}

/* ---------------- état local ↔ compte ---------------- */
function appliquerCompte(user, full = true) {
  COMPTE.user = user; const p = user.prog;
  if (full) { for (const k of ['xp', 'lvl', 'shards', 'rooms', 'perches', 'relics', 'hunt']) PROG[k] = p[k] ?? PROG[k]; }
  else PROG.shards = p.shards;   // après un achat : le serveur fait foi pour les pièces d’or
  PROG.rooms = PROG.rooms || {}; PROG.perches = PROG.perches || {}; PROG.relics = PROG.relics || {};
  PROG.owned = { ...p.owned }; PROG.acc = user.look.acc;
  if (!user.look.skin) user.look.skin = 'capuche';
  const op = user.options || {}; if (typeof op.son === 'boolean' && op.son !== SND.on) setSound(op.son, true);   // le son suit le compte
  if (player) { player.acc = user.look.acc; if (player.color !== user.look.color || player.skin !== user.look.skin) setSkin(player, user.look.skin, user.look.color); }
  updatePanel();
}
const progPayload = () => ({ xp: PROG.xp, lvl: PROG.lvl, shards: PROG.shards, rooms: PROG.rooms, perches: PROG.perches, relics: PROG.relics, hunt: PROG.hunt });
let saveT = null;
function compteSauver(now) { // appelé par saveProg() : on regroupe les sauvegardes
  if (!COMPTE.token) return; clearTimeout(saveT);
  const go = () => api('progression', progPayload(), { keepalive: true }).then(r => { if (r.user) COMPTE.user = r.user; });
  if (now) return go(); saveT = setTimeout(go, 2500);
}
async function compteOuvrir(token, user) {
  COMPTE.token = token; LS.set(COMPTE.local ? 'nocturne-jeton-local' : 'nocturne-jeton', token);
  appliquerCompte(user);
  // reprise de la progression du prototype (avant les comptes) : une seule fois, objets remboursés en pièces d’or
  const old = LS.get('nocturne-prog');
  if (old) { LS.set('nocturne-prog', null); LS.set('nocturne-prog-reprise', old);
    try { const o = JSON.parse(old), rb = REGLES.BOUTIQUE.filter(i => o.owned && o.owned[i.id]).reduce((s, i) => s + i.price, 0);
      const r = await api('progression', { ...progPayload(), xp: o.xp || 0, lvl: Math.max(PROG.lvl, o.lvl || 1), shards: PROG.shards + (o.shards || 0) + rb, rooms: o.rooms, perches: o.perches, relics: o.relics });
      if (r.user) { appliquerCompte(r.user); toast(`Ta progression du prototype est reprise : <b>niveau ${r.user.prog.lvl}</b>${rb ? ', objets remboursés en pièces d’or' : ''}.`); } } catch (e) { } }
}
async function compteReprendre() { // session déjà ouverte dans ce navigateur ?
  const t = LS.get(COMPTE.local ? 'nocturne-jeton-local' : 'nocturne-jeton'); if (!t) return false;
  COMPTE.token = t; const r = await api('moi');
  if (r.user) { await compteOuvrir(t, r.user); return true; }
  if (r.code === 401) LS.set(COMPTE.local ? 'nocturne-jeton-local' : 'nocturne-jeton', null);
  COMPTE.token = null; return r.code === 0 ? r.error : false;
}
async function compteFermer() { await compteSauver(true); await api('deconnexion'); LS.set(COMPTE.local ? 'nocturne-jeton-local' : 'nocturne-jeton', null); COMPTE.token = null; COMPTE.user = null; }
addEventListener('beforeunload', () => { if (player && COMPTE.token) compteSauver(true); });
