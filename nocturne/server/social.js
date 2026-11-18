'use strict';
/*
 * Social : messages privés, liste d'amis, clans (avec leur chat).
 * Tout passe par le WebSocket du jeu (messages { type: 'soc', a: '…' }) et est vérifié ici.
 * Les données sont rangées dans les comptes (data/comptes.json) :
 *   utilisateur.social = { amis: [clé…], demandes: [clé…] (reçues), clan: id | null, invit: [id…], boite: [{ de, msg, t }…] }
 *   db.clans[id]       = { id, nom, tag, chef: clé, membres: [clé…] }
 */
const comptes = require('./comptes');
const REGLES = require('../public/js/regles.js');

const MAX_AMIS = 50, MAX_DEMANDES = 30, MAX_MEMBRES = 20, MAX_INVIT = 10, MAX_BOITE = 25, MSG_MAX = 120, COOLDOWN = 500;
const db = () => comptes.db();
const S = u => u.social || (u.social = { amis: [], demandes: [], clan: null, invit: [], boite: [] });
const cleDe = u => REGLES.cle(u.name);
let clients = null;
const enLigne = cle => { for (const [ws, c] of clients) if (c.user && cleDe(c.user) === cle && ws.readyState === 1) return { ws, c }; return null; };
const send = (ws, o) => { if (ws.readyState === 1) ws.send(JSON.stringify({ type: 'soc', id: 'srv', ...o })); };
const nomDe = cle => (db().users[cle] || {}).name || cle;
const propre = (v, max) => typeof v === 'string' ? v.replace(/[\u0000-\u001f\u007f<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, max) : '';
const retirer = (a, v) => { const i = a.indexOf(v); if (i >= 0) a.splice(i, 1); };

function presence(cle) { const o = enLigne(cle); return { n: nomDe(cle), on: !!o, room: o && o.c.state ? o.c.state.room : null }; }
function clanDe(u) { const id = S(u).clan, cl = id && db().clans[id]; return cl || null; }

/* ce que le joueur voit : amis, demandes, clan, invitations */
function etat(u) {
  const s = S(u), cl = clanDe(u);
  return { k: 'etat', amis: s.amis.map(presence), demandes: s.demandes.map(nomDe),
    clan: cl ? { nom: cl.nom, tag: cl.tag, chef: nomDe(cl.chef), moi: nomDe(cleDe(u)), membres: cl.membres.map(presence) } : null,
    invit: s.invit.filter(id => db().clans[id]).map(id => ({ id, nom: db().clans[id].nom, tag: db().clans[id].tag })) };
}
function pousser(cle) { const o = enLigne(cle); if (o) send(o.ws, etat(o.c.user)); }
function proches(u) { const s = S(u), cl = clanDe(u), set = new Set(s.amis); if (cl) cl.membres.forEach(m => set.add(m)); set.delete(cleDe(u)); return set; }
const prevenir = u => { for (const k of proches(u)) pousser(k); };   // (dés)connexion : mes amis et mon clan voient mon changement de statut

function infoA(cle, msg, cls) { const o = enLigne(cle); if (o) send(o.ws, { k: 'info', msg, cls }); }

function connecte(ws, c) {
  const u = c.user, s = S(u); send(ws, etat(u));
  if (s.boite.length) { for (const m of s.boite) send(ws, { k: 'mp', de: m.de, msg: m.msg, t: m.t, vieux: 1 }); s.boite = []; comptes.sauver(); }
  prevenir(u);
}
const deconnecte = c => { if (c.user) prevenir(c.user); };

function trouver(n) { n = propre(n, 20); if (!REGLES.nomValide(n)) return null; const cle = REGLES.cle(n); return db().users[cle] ? cle : null; }

function agir(ws, c, m) {
  const u = c.user, s = S(u), moi = cleDe(u), err = t => send(ws, { k: 'err', msg: t }), ok = t => send(ws, { k: 'info', msg: t });
  const now = Date.now(); const msgActions = ['mp', 'clan_msg'];
  if (msgActions.includes(m.a)) { if (now - (c.lastSoc || 0) < COOLDOWN) return; c.lastSoc = now; }
  let cible = null;
  if (['ami+', 'ami_ok', 'ami_no', 'ami-', 'mp', 'clan_inv', 'clan_kick'].includes(m.a)) { cible = trouver(m.n); if (!cible) return err('Joueur introuvable.'); if (cible === moi) return err("C'est toi !"); }
  const T = cible ? S(db().users[cible]) : null;
  switch (m.a) {
    case 'etat': return send(ws, etat(u));
    case 'ami+': {
      if (s.amis.includes(cible)) return err('Vous êtes déjà amis.');
      if (s.demandes.includes(cible)) { retirer(s.demandes, cible); s.amis.push(cible); T.amis.push(moi); comptes.sauver(); pousser(moi); pousser(cible); infoA(cible, `${u.name} a accepté ton amitié.`, 'cyan'); return ok(`Tu es maintenant ami avec ${nomDe(cible)}.`); }
      if (T.demandes.includes(moi)) return err('Demande déjà envoyée.');
      if (s.amis.length >= MAX_AMIS) return err(`Liste d'amis pleine (${MAX_AMIS}).`);
      if (T.amis.length >= MAX_AMIS || T.demandes.length >= MAX_DEMANDES) return err('Ce joueur ne peut plus recevoir de demandes.');
      T.demandes.push(moi); comptes.sauver(); pousser(cible); infoA(cible, `${u.name} veut devenir ton ami (touche O).`, 'gold'); return ok(`Demande envoyée à ${nomDe(cible)}.`); }
    case 'ami_ok': {
      if (!s.demandes.includes(cible)) return err('Aucune demande de ce joueur.');
      if (s.amis.length >= MAX_AMIS) return err(`Liste d'amis pleine (${MAX_AMIS}).`);
      retirer(s.demandes, cible); if (!s.amis.includes(cible)) s.amis.push(cible); if (!T.amis.includes(moi)) T.amis.push(moi);
      comptes.sauver(); pousser(moi); pousser(cible); infoA(cible, `${u.name} a accepté ton amitié.`, 'cyan'); return ok(`Tu es maintenant ami avec ${nomDe(cible)}.`); }
    case 'ami_no': retirer(s.demandes, cible); comptes.sauver(); return pousser(moi);
    case 'ami-': retirer(s.amis, cible); retirer(T.amis, moi); comptes.sauver(); pousser(moi); pousser(cible); return;
    case 'mp': {
      const msg = propre(m.msg, MSG_MAX); if (!msg) return;
      const o = enLigne(cible);
      if (o) send(o.ws, { k: 'mp', de: u.name, msg, t: now });
      else { if (T.boite.length >= MAX_BOITE) return err(`${nomDe(cible)} a trop de messages en attente.`); T.boite.push({ de: u.name, msg, t: now }); comptes.sauver(); }
      console.log(`[mp] ${u.name} → ${nomDe(cible)}`);
      return send(ws, { k: 'mp', a: nomDe(cible), msg, t: now, hors: o ? 0 : 1 }); }
    case 'clan+': {
      if (clanDe(u)) return err('Tu es déjà dans un clan.');
      const nom = propre(m.nom, 16), tag = propre(m.tag, 4).toUpperCase();
      if (!/^[A-Za-zÀ-ÖØ-öø-ÿ0-9 _-]{3,16}$/.test(nom)) return err('Nom du clan : 3 à 16 lettres ou chiffres.');
      if (!/^[A-Z0-9]{2,4}$/.test(tag)) return err('Étiquette : 2 à 4 lettres ou chiffres.');
      if (Object.values(db().clans).some(k => REGLES.cle(k.nom) === REGLES.cle(nom) || k.tag === tag)) return err('Ce nom ou cette étiquette existe déjà.');
      const id = 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); db().clans[id] = { id, nom, tag, chef: moi, membres: [moi], created: now };
      s.clan = id; s.invit = []; comptes.sauver(); pousser(moi); return ok(`Clan « ${nom} » [${tag}] créé !`); }
    case 'clan_inv': {
      const cl = clanDe(u); if (!cl) return err("Tu n'as pas de clan."); if (cl.chef !== moi) return err('Seul le chef peut inviter.');
      if (cl.membres.length >= MAX_MEMBRES) return err(`Clan complet (${MAX_MEMBRES}).`);
      if (T.clan) return err('Ce joueur est déjà dans un clan.'); if (T.invit.includes(cl.id)) return err('Déjà invité.');
      T.invit.push(cl.id); T.invit = T.invit.slice(-MAX_INVIT); comptes.sauver(); pousser(cible); infoA(cible, `${u.name} t'invite dans le clan ${cl.nom} (touche O).`, 'gold'); return ok(`Invitation envoyée à ${nomDe(cible)}.`); }
    case 'clan_ok': {
      if (s.clan) return err('Quitte ton clan avant d\'en rejoindre un autre.');
      const cl = db().clans[m.cid]; if (!cl || !s.invit.includes(cl.id)) return err("Cette invitation n'est plus valable.");
      if (cl.membres.length >= MAX_MEMBRES) return err('Ce clan est complet.');
      cl.membres.push(moi); s.clan = cl.id; s.invit = []; comptes.sauver();
      for (const k of cl.membres) { pousser(k); if (k !== moi) infoA(k, `${u.name} a rejoint le clan.`, 'cyan'); } return ok(`Bienvenue dans le clan ${cl.nom} !`); }
    case 'clan_no': retirer(s.invit, m.cid); comptes.sauver(); return pousser(moi);
    case 'clan-': {
      const cl = clanDe(u); if (!cl) return; retirer(cl.membres, moi); s.clan = null;
      if (!cl.membres.length) { delete db().clans[cl.id]; for (const x of Object.values(db().users)) if (x.social) retirer(x.social.invit, cl.id); }
      else if (cl.chef === moi) { cl.chef = cl.membres[0]; infoA(cl.chef, 'Tu es le nouveau chef du clan.', 'gold'); }
      comptes.sauver(); pousser(moi); for (const k of cl.membres) { pousser(k); infoA(k, `${u.name} a quitté le clan.`); } return; }
    case 'clan_kick': {
      const cl = clanDe(u); if (!cl || cl.chef !== moi) return err('Seul le chef peut exclure.');
      if (!cl.membres.includes(cible)) return err("Ce joueur n'est pas dans ton clan.");
      retirer(cl.membres, cible); T.clan = null; comptes.sauver(); pousser(cible); infoA(cible, `Tu as été exclu du clan ${cl.nom}.`, 'gold'); for (const k of cl.membres) pousser(k); return; }
    case 'clan_msg': {
      const cl = clanDe(u), msg = propre(m.msg, MSG_MAX); if (!cl || !msg) return;
      for (const k of cl.membres) { const o = enLigne(k); if (o) send(o.ws, { k: 'clan', de: u.name, tag: cl.tag, msg, t: now }); }
      console.log(`[clan ${cl.tag}] ${u.name} : ${msg}`); return; }
  }
}

module.exports = { attach: c => { clients = c; }, connecte, deconnecte, agir };
