'use strict';
/*
 * Réglages du serveur, lus dans les variables d'environnement ou dans le fichier .env à la racine du projet
 * (voir .env.example). Une variable déjà définie dans l'environnement est prioritaire sur le .env.
 */
const fs = require('fs');
const path = require('path');

try {
  const txt = fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8');
  for (const ligne of txt.split(/\r?\n/)) {
    const m = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/.exec(ligne);
    if (!m || ligne.trim().startsWith('#')) continue;
    let v = m[2]; if (/^(["']).*\1$/.test(v)) v = v.slice(1, -1);   // valeur entre guillemets
    if (process.env[m[1]] === undefined) process.env[m[1]] = v;
  }
} catch (e) { if (e.code !== 'ENOENT') console.warn('[config] .env illisible :', e.message); }

module.exports = {
  PORT: Number(process.env.PORT) || 3000,
  HOST: process.env.HOST || '0.0.0.0',
  MONGODB_URI: process.env.MONGODB_URI || '',           // vide = comptes dans data/comptes.json
  MONGODB_DB: process.env.MONGODB_DB || 'ossuary',
  ADMINS: (process.env.ADMINS || '').split(',').map(s => s.trim()).filter(Boolean),   // pseudos toujours admin (appliqué au démarrage)
  TRUST_PROXY: /^(1|true|oui)$/i.test(process.env.TRUST_PROXY || ''),   // derrière nginx : lire l'IP du joueur dans X-Forwarded-For
};
