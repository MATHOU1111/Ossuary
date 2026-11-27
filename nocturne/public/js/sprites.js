"use strict";
// Personnages dessinés à la main : feuilles de sprites PNG (une bande horizontale par animation).
// Pour en ajouter un : déposer les PNG dans public/skins/<id>/ puis appeler defineSpriteSkin (voir en bas, et public/skins/LISEZMOI.md).
// Contrairement aux personnages « dessinés par le code », ici chaque image vient de l'artiste : rien n'est calculé, on choisit juste l'image.

const SPR_URL = p => (window.SPRITE_INLINE && window.SPRITE_INLINE[p]) || p;   // le build hors ligne embarque les PNG dans la page
const SPR = {};   // id -> { cfg, imgs, tinted, ready }
const sprLum = (r, g, b) => .3 * r + .59 * g + .11 * b;

// table « couleur d'origine -> couleur teintée » : on garde la luminosité du dessin et on prend la teinte choisie par le joueur
function sprTintMap(list, color) {
  const [cr, cg, cb] = rgbArr(color), lc = Math.max(24, sprLum(cr, cg, cb)), m = new Map();
  for (const s of list) { const [r, g, b] = rgbArr(s), f = sprLum(r, g, b) / lc, mix = (o, c) => Math.round(o + (Math.min(255, c * f) - o) * .75);
    m.set((r << 16) | (g << 8) | b, [mix(r, cr), mix(g, cg), mix(b, cb)]); }
  return m;
}
function sprRecolor(img, list, color) {
  const [cv, x] = mk(img.width, img.height); x.drawImage(img, 0, 0);
  try { const d = x.getImageData(0, 0, cv.width, cv.height), p = d.data, m = sprTintMap(list, color);
    for (let i = 0; i < p.length; i += 4) { if (!p[i + 3]) continue; const t = m.get((p[i] << 16) | (p[i + 1] << 8) | p[i + 2]); if (t) { p[i] = t[0]; p[i + 1] = t[1]; p[i + 2] = t[2]; } }
    x.putImageData(d, 0, 0); return cv;
  } catch (err) { return img; }   // image « contaminée » (ouverte depuis un fichier) : on garde les couleurs d'origine
}
function sprSheet(S, name, color) {
  if (!S.cfg.tint || !color) return S.imgs[name];
  const t = S.tinted[color] || (S.tinted[color] = {});
  return t[name] || (t[name] = sprRecolor(S.imgs[name], S.cfg.tint, color));
}

// quelle image montrer maintenant ? -> { a: animation, i: numéro d'image }
function sprFrame(e, S) {
  const cfg = S.cfg, A = cfg.anims, act = e.act, id = act && act.id, n = k => A[k].n;
  if (id === 'die' && A.hurt) return { a: 'hurt', i: Math.min(n('hurt') - 1, Math.floor(act.t * (A.hurt.fps || 10))) };
  if (id === 'attack' && A.attack) { const t = A.attack.t, i = t ? t.reduce((k, v, j) => act.t >= v ? j : k, 0) : Math.min(n('attack') - 1, Math.floor(act.t / act.dur * n('attack'))); return { a: 'attack', i }; }
  const crouch = cfg.crouch;                                         // image « accroupie » (sabre prêt) : utile pour s'asseoir, glisser, se réceptionner
  if (crouch && (id === 'sit' || id === 'sleep' || e.slideT > 0 || e.landT > 0)) return { a: crouch[0], i: crouch[1] };
  if (!e.climbing && !e.ground && cfg.air && A[cfg.air[0][0]]) { const vy = e.kind === 'remote' ? (e.prevVy || 0) : e.vy, p = vy < -30 ? cfg.air[0] : cfg.air[1]; return { a: p[0], i: p[1] }; }
  if (!e.climbing && e.ground && e.spd > 8 && A.run) return { a: 'run', i: Math.floor(e.spPh || 0) % n('run') };
  return { a: 'idle', i: Math.floor((time + (e.seed || 0)) * (A.idle.fps || 8)) % n('idle') };
}
function drawSprite(e) {
  const S = SPR[e.skin], cfg = S.cfg, C = cfg.cell;
  scx.clearRect(0, 0, BW, BH); e.lanternW = null;
  if (!S.ready) return;
  const f = sprFrame(e, S), sh = sprSheet(S, f.a, e.color);
  scx.save(); if (e.face !== 1) scx.setTransform(-1, 0, 0, 1, 2 * BOX, 0);   // les dessins regardent à droite : on retourne autour des pieds
  scx.drawImage(sh, f.i * C, cfg.y0, C, BH, 0, 0, C, BH);
  scx.restore();
}

function defineSpriteSkin(id, cfg) {
  cfg = { cell: 96, y0: 40, h: 48, ox: 46, oy: 42, stride: 80, ...cfg };   // y0 : première ligne gardée de chaque cellule ; ox/oy : point au sol dans la zone gardée
  const S = SPR[id] = { cfg, imgs: {}, tinted: {}, ready: false }; let left = 0;
  for (const [name, a] of Object.entries(cfg.anims)) { left++; const im = new Image();
    im.onload = () => { if (--left === 0) { S.ready = true; window.dispatchEvent(new Event('sprites-ready')); } };
    im.onerror = () => console.warn('[sprites] image introuvable :', a.src);
    im.src = SPR_URL('skins/' + (cfg.dir || id) + '/' + a.src); S.imgs[name] = im; }
  SKINS[id] = { label: cfg.label, swatch: cfg.swatch, nameY: cfg.nameY, size: { w: cfg.cell, h: cfg.h, ox: cfg.ox, oy: cfg.oy }, prev: cfg.prev,
    attackDur: cfg.attackDur, hitT: cfg.hitT, slash: cfg.slash, dust: cfg.dust,
    mort: cfg.mort,   // true : l'animation de mort (hurt) finit déjà couchée, le jeu ne fait pas basculer le personnage
    pal: c => c, draw: e => drawSprite(e),
    upd: (e, dt) => {   // la course avance avec la vitesse au sol : les pieds ne glissent pas
      if (e.ground && !e.climbing && e.spd > 8) e.spPh = (e.spPh || 0) + dt * clamp(e.spd * (cfg.anims.run ? cfg.anims.run.n : 16) / cfg.stride, 6, 28); else e.spPh = 0; } };
}

/* ---------- L'Ancien (dessiné) : idle 10 images, course 16, attaque 7, dégât 4 ---------- */
defineSpriteSkin('ancien_px', {
  dir: 'ancien',                               // dossier public/skins/ancien/
  label: 'Ancien (dessiné)', swatch: 'Couleur du hakama', nameY: 41,
  anims: { idle: { src: 'idle.png', n: 10, fps: 8 }, run: { src: 'run.png', n: 16 }, attack: { src: 'attack.png', n: 7, t: [0, .05, .10, .15, .20, .27, .34] }, hurt: { src: 'hurt.png', n: 4, fps: 10 } },
  crouch: ['attack', 1],                       // sabre prêt, genoux fléchis : assis / glissade / réception
  air: [['run', 4], ['run', 5]],               // montée, descente
  tint: ['#1a1932', '#2a2f4e', '#424c6e'],     // les trois bleus du hakama prennent la couleur choisie
  prev: { x: 28, y: 1, w: 37, h: 44 },         // cadrage dans les menus (rapport 37:44 comme les autres)
  attackDur: .46, hitT: .2, slash: { none: true, r: 0, col: '#eef2f6', dy: -17 }, dust: '#b8c0d0',
});
/* ---------- Le Nécromancien (dessiné) : cellules de 128 px, idle 25 images, marche 10, saut 12, attaque 19, dégât 9 ---------- */
defineSpriteSkin('necro', {
  dir: 'necro', cell: 128, y0: 16, h: 66, ox: 68, oy: 64, stride: 60,
  label: 'Nécromancien', swatch: 'Ce personnage garde ses couleurs', nameY: 54,
  anims: { idle: { src: 'idle.png', n: 25, fps: 5 }, run: { src: 'run.png', n: 10 }, jump: { src: 'jump.png', n: 12 }, attack: { src: 'attack.png', n: 19 }, hurt: { src: 'hurt.png', n: 9, fps: 14 } },
  crouch: ['jump', 7],                         // genoux fléchis : assis / glissade / réception
  air: [['jump', 3], ['jump', 6]],             // montée, descente
  prev: { x: 46, y: 12, w: 44, h: 52 },
  attackDur: .8, hitT: .3, slash: { none: true, r: 0, col: '#e8d0d8', dy: -17 }, dust: '#7a1c2c',
});
/* ---------- Le Sorcier (pack « Evil Wizard 2 », CC0) : cellules de 250 px, pieds à la ligne 166, idle 8, saut 2, chute 2, attaque 8, mort 7 ----------
   Pas de planche de course : il glisse en restant sur son idle. attack2.png (sort lancé accroupi) ne sert que pour la pose accroupie. */
defineSpriteSkin('sorcier', {
  dir: 'sorcier', cell: 250, y0: 22, h: 160, ox: 120, oy: 144,
  label: 'Sorcier', swatch: 'Ce personnage garde ses couleurs', nameY: 108,
  anims: { idle: { src: 'idle.png', n: 8, fps: 8 }, jump: { src: 'jump.png', n: 2 }, fall: { src: 'fall.png', n: 2 },
    attack: { src: 'attack.png', n: 8 }, cast: { src: 'attack2.png', n: 8 }, hurt: { src: 'death.png', n: 7, fps: 10 } },
  crouch: ['cast', 0],                         // accroupi : assis / glissade / réception
  air: [['jump', 1], ['fall', 0]],             // montée, descente
  mort: true,                                  // death.png finit couché au sol
  prev: { x: 92, y: 38, w: 88, h: 105 },
  attackDur: .8, hitT: .4, slash: { none: true, r: 0, col: '#d8c0f0', dy: -17 }, dust: '#4a1c5e',
});
window.addEventListener('sprites-ready', () => { try { renderPages(); } catch (err) { /* site pas encore prêt */ } });
