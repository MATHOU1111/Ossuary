'use strict';
/*
 * Où sont rangés les comptes et les clans.
 * - MONGODB_URI défini (fichier .env) : dans MongoDB, collections « joueurs » et « clans » (un document par joueur / par clan).
 * - sinon : dans data/comptes.json, comme avant (pratique pour développer sur son PC).
 *
 * Le jeu travaille sur une copie en mémoire ({ users, clans }) chargée au démarrage : les règles restent simples et rapides.
 * sauver() écrit ensuite les changements. Avec MongoDB, seuls les documents modifiés depuis la dernière écriture
 * sont envoyés (et les clans supprimés sont effacés).
 *
 * Document « joueurs » : { _id: clé du pseudo (minuscules, sans accents), name, role: 'joueur' | 'admin',
 *   salt, hash (mot de passe scrypt), sessions: [{ h: sha256(jeton), exp }], created, vu (dernière visite),
 *   look: { skin, color, acc }, options: { son }, prog: { xp, lvl, shards, owned, rooms, perches, relics, hunt }, social: {…} }
 */
const fs = require('fs');
const path = require('path');
const config = require('./config');

const FICHIER = path.join(__dirname, '..', 'data', 'comptes.json');
const COLS = { users: 'joueurs', clans: 'clans' };

function lireFichier() {
  try { const d = JSON.parse(fs.readFileSync(FICHIER, 'utf8')); return { users: d.users || {}, clans: d.clans || {} }; }
  catch (e) { if (e.code !== 'ENOENT') console.warn('[stockage] data/comptes.json illisible :', e.message); return null; }
}

/* ---------------- fichier JSON ---------------- */
function fichierJSON() {
  const db = lireFichier() || { users: {}, clans: {} };
  const ecrire = () => { fs.mkdirSync(path.dirname(FICHIER), { recursive: true }); fs.writeFileSync(FICHIER + '.tmp', JSON.stringify(db)); fs.renameSync(FICHIER + '.tmp', FICHIER); };
  return { mode: 'fichier data/comptes.json', db, ecrire: async () => ecrire(), fermer: async () => { } };
}

/* ---------------- MongoDB ---------------- */
async function mongo() {
  const { MongoClient } = require('mongodb');
  const client = new MongoClient(config.MONGODB_URI, { serverSelectionTimeoutMS: 8000 });
  await client.connect();
  const base = client.db(config.MONGODB_DB), col = k => base.collection(COLS[k]);
  await col('users').createIndex({ role: 1 });

  // premier démarrage sur une base vide : on reprend data/comptes.json s'il existe
  if (await col('users').estimatedDocumentCount() === 0) {
    const ancien = lireFichier();
    if (ancien && Object.keys(ancien.users).length) {
      for (const k of Object.keys(COLS)) { const docs = Object.entries(ancien[k]).map(([id, v]) => ({ ...v, _id: id })); if (docs.length) await col(k).insertMany(docs); }
      console.log(`[stockage] ${Object.keys(ancien.users).length} compte·s repris depuis data/comptes.json`);
    }
  }

  const db = { users: {}, clans: {} }, ecrits = { users: new Map(), clans: new Map() };   // ecrits : id → JSON tel qu'il est dans Mongo
  for (const k of Object.keys(COLS)) for (const doc of await col(k).find().toArray()) {
    const { _id, ...v } = doc; db[k][_id] = v; ecrits[k].set(_id, JSON.stringify(v)); }

  async function ecrire() {
    for (const k of Object.keys(COLS)) {
      const ops = [], faits = [];
      for (const [id, v] of Object.entries(db[k])) { const j = JSON.stringify(v);
        if (ecrits[k].get(id) !== j) { ops.push({ replaceOne: { filter: { _id: id }, replacement: JSON.parse(j), upsert: true } }); faits.push([id, j]); } }
      for (const id of ecrits[k].keys()) if (!(id in db[k])) { ops.push({ deleteOne: { filter: { _id: id } } }); faits.push([id, null]); }
      if (!ops.length) continue;
      await col(k).bulkWrite(ops, { ordered: false });
      for (const [id, j] of faits) j === null ? ecrits[k].delete(id) : ecrits[k].set(id, j);   // seulement une fois écrit pour de vrai
    }
  }
  return { mode: `MongoDB (base « ${config.MONGODB_DB} »)`, db, ecrire, fermer: () => client.close() };
}

/* ---------------- ouverture + écritures regroupées ---------------- */
async function ouvrir() {
  const s = config.MONGODB_URI ? await mongo() : fichierJSON();
  let chaine = Promise.resolve(), minuteur = null;
  const lancer = () => (chaine = chaine.then(s.ecrire).catch(e => console.error('[stockage] sauvegarde impossible (nouvel essai à la prochaine) :', e.message)));
  return {
    mode: s.mode, db: s.db, fermer: s.fermer,
    // sauver() : regroupe les écritures (800 ms) ; sauver(true) : tout de suite. Les écritures passent une par une.
    sauver(maintenant) { clearTimeout(minuteur); if (maintenant) return lancer(); minuteur = setTimeout(lancer, 800); return chaine; },
  };
}

module.exports = { ouvrir };
