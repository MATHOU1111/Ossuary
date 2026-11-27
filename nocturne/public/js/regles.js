"use strict";
// Règles partagées entre le navigateur et le serveur (ce fichier est aussi chargé par server/comptes.js).
// - le catalogue de la boutique et les couleurs de base ;
// - la création d'un compte, l'achat, le choix de l'apparence et l'enregistrement de la progression.
// Le serveur applique ces règles lui-même : un joueur ne peut pas s'offrir un objet en trichant dans son navigateur.

const REGLES = (() => {
  const COULEURS_BASE = ['#2b48c8', '#c23a44', '#23998f', '#7b45c2', '#d6892a', '#4a5064', '#e0b53a'];
  const BOUTIQUE = [
    { id: 'scarf', type: 'acc', name: 'Écharpe', price: 20, lvl: 1, desc: 'Rouge et chaude. Elle vole au vent.' },
    { id: 'flower', type: 'acc', name: 'Fleur de lune', price: 35, lvl: 2, desc: 'Cueillie sur les remparts, à minuit.' },
    { id: 'ears', type: 'acc', name: 'Oreilles de chat', price: 55, lvl: 3, desc: 'Une capuche très… féline.' },
    { id: 'lantern', type: 'acc', name: 'Lanterne', price: 80, lvl: 4, desc: 'Éclaire ton chemin dans la nuit.' },
    { id: 'crown', type: 'acc', name: 'Petite couronne', price: 140, lvl: 6, desc: 'Pour les âmes de haut rang.' },
    { id: 'c_rose', type: 'color', name: 'Rose bruyère', color: '#d65a9a', price: 25, lvl: 2, desc: 'Une capuche toute douce.' },
    { id: 'c_sapin', type: 'color', name: 'Vert sapin', color: '#2f6a46', price: 30, lvl: 2, desc: 'Comme la forêt sous la neige.' },
    { id: 'c_lune', type: 'color', name: 'Blanc lunaire', color: '#c9d4e4', price: 40, lvl: 3, desc: 'Pâle comme un rayon de lune.' },
    { id: 'c_or', type: 'color', name: 'Or ancien', color: '#d0a03a', price: 65, lvl: 4, desc: 'Le trésor du château.' },
    { id: 'c_encre', type: 'color', name: "Noir d'encre", color: '#2c2c3a', price: 90, lvl: 5, desc: 'On ne voit plus que tes yeux.' },
  ];
  const SKINS = [{ id: 'capuche', name: 'Capuche' }, { id: 'scaphandre', name: 'Prospecteur' }, { id: 'ancien_px', name: 'Ancien (dessiné)' }, { id: 'necro', name: 'Nécromancien' }, { id: 'sorcier', name: 'Sorcier' }];   // tous disponibles dès le début
  const ROLES = ['joueur', 'admin'];   // seul un admin (ou « npm run admin » sur le serveur) peut changer un rôle
  const ECLATS_DEPART = 10;
  const PROG_MAX_SAUT = { lvl: 3, shards: 600 };   // anti-triche simple : progression maximale acceptée entre deux sauvegardes

  // Pseudo : 3 à 14 caractères, lettres (accents compris), chiffres, - et _
  const nomValide = n => typeof n === 'string' && /^[A-Za-zÀ-ÖØ-öø-ÿ0-9_-]{3,14}$/.test(n);
  const cle = n => n.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const mdpValide = p => typeof p === 'string' && p.length >= 4 && p.length <= 64;

  function nouveau(nom) {
    return { name: nom, role: 'joueur', created: Date.now(), look: { skin: 'capuche', color: COULEURS_BASE[0], acc: null }, options: { son: true },
      prog: { xp: 0, lvl: 1, shards: ECLATS_DEPART, owned: {}, rooms: {}, perches: {}, relics: {}, hunt: null } };
  }
  const couleursDispo = u => [...COULEURS_BASE, ...BOUTIQUE.filter(i => i.type === 'color' && u.prog.owned[i.id]).map(i => i.color)];

  function acheter(u, id) {
    const it = BOUTIQUE.find(i => i.id === id);
    if (!it) return 'Objet inconnu.';
    if (u.prog.owned[id]) return 'Tu possèdes déjà cet objet.';
    if (u.prog.lvl < it.lvl) return `Il faut être niveau ${it.lvl}.`;
    if (u.prog.shards < it.price) return "Pas assez de pièces d’or.";
    u.prog.shards -= it.price; u.prog.owned[id] = true;
    if (it.type === 'acc') u.look.acc = id; else u.look.color = it.color;
    return null;
  }
  function apparence(u, color, acc, skin) {
    if (skin !== undefined) { if (!SKINS.some(s => s.id === skin)) return 'Personnage inconnu.'; u.look.skin = skin; }
    if (color !== undefined) { if (!couleursDispo(u).includes(color)) return "Cette couleur n'est pas débloquée."; u.look.color = color; }
    if (acc !== undefined) { if (acc !== null && !(u.prog.owned[acc] && BOUTIQUE.some(i => i.id === acc && i.type === 'acc'))) return "Tu ne possèdes pas cet accessoire."; u.look.acc = acc; }
    return null;
  }
  const drapeaux = (o, max = 60) => { const r = {}; if (o && typeof o === 'object') for (const k of Object.keys(o).slice(0, max)) if (k.length <= 24 && o[k]) r[k] = 1; return r; };
  const borne = (v, a, b) => typeof v === 'number' && isFinite(v) ? Math.max(a, Math.min(b, Math.round(v))) : a;
  // Le jeu gagne de l'XP et des pièces d’or en local, puis envoie sa progression ; les dépenses, elles, ne passent que par acheter().
  function progression(u, p) {
    if (!p || typeof p !== 'object') return;
    const g = u.prog, lvl = borne(p.lvl, g.lvl, g.lvl + PROG_MAX_SAUT.lvl);
    g.xp = lvl > g.lvl || p.lvl === g.lvl ? borne(p.xp, 0, 100000) : g.xp; g.lvl = lvl;
    g.shards = borne(p.shards, g.shards, g.shards + PROG_MAX_SAUT.shards);
    g.rooms = { ...g.rooms, ...drapeaux(p.rooms) }; g.perches = { ...g.perches, ...drapeaux(p.perches) }; g.relics = { ...g.relics, ...drapeaux(p.relics, 10) };
    if (p.hunt && typeof p.hunt.day === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(p.hunt.day)) g.hunt = { day: p.hunt.day, got: drapeaux(p.hunt.got, 10) };
  }
  // Options du compte (réglages du joueur, gardés avec son compte)
  function options(u, o) {
    if (!o || typeof o !== 'object') return; const op = u.options || (u.options = {});
    if (typeof o.son === 'boolean') op.son = o.son;
  }
  // Ce qu'on renvoie au navigateur (jamais le mot de passe ni les sessions)
  const public_ = u => ({ name: u.name, role: u.role || 'joueur', created: u.created, look: u.look, options: u.options || {}, prog: u.prog });

  return { SKINS, ROLES, COULEURS_BASE, BOUTIQUE, options, nomValide, mdpValide, cle, nouveau, couleursDispo, acheter, apparence, progression, public: public_ };
})();
if (typeof module === 'object' && module.exports) module.exports = REGLES;
