"use strict";
// Les produits du supermarché dessinés en pixel art (20×20), avec un contour sombre automatique.
// icone(forme, couleur1, couleur2) → un canvas (mis en cache). Les formes sont listées dans DESS ;
// chaque produit de config/supermarche.json choisit la sienne avec "icone" (et "couleur", "couleur2" pour la teinte).

const ICO = 20;
const DESS = {
  /* ---- fruits et légumes ---- */
  banane: ({ R }) => { for (let k = 0; k < 3; k++) for (let i = 0; i < 12; i++) { const y = 5 + k * 2 + Math.round((i - 6) ** 2 / 9); R(3 + i, y, 1, 3, '#f0d040'); R(3 + i, y, 1, 1, '#fff08a'); R(3 + i, y + 2, 1, 1, '#c8a020'); }
    R(14, 4, 2, 3, '#6a8a2a'); R(3, 9, 1, 2, '#5a3a1a'); },
  pomme: ({ D, R, c1, lo, hi }) => { c1 = c1 || '#c0303a'; D(13, 11, 4, lo(c1)); D(7, 12, 4, c1); R(5, 10, 2, 2, hi(c1)); R(7, 6, 1, 3, '#5a3a1a'); R(8, 6, 2, 1, '#4a9a3a'); R(13, 5, 1, 3, '#5a3a1a'); },
  orange: ({ D, R }) => { D(13, 10, 4, '#d8701a'); D(7, 12, 4, '#f09020'); R(5, 10, 2, 1, '#ffc060'); R(13, 6, 1, 1, '#4a9a3a'); R(7, 8, 2, 1, '#4a9a3a'); for (const [a, b] of [[8, 13], [10, 11], [6, 14]]) R(a, b, 1, 1, '#d8701a'); },
  citron: ({ R }) => { for (const [x, y, c] of [[12, 8, '#e8c830'], [8, 13, '#f0d840']]) { R(x - 4, y - 1, 9, 3, c); R(x - 3, y - 2, 7, 5, c); R(x - 5, y, 1, 1, c); R(x + 5, y, 1, 1, c); R(x - 2, y - 2, 3, 1, '#fff08a'); } },
  tomate: ({ D, R }) => { D(13, 11, 3, '#b82020'); D(7, 12, 4, '#d83028'); R(5, 10, 2, 1, '#ff8a70'); R(6, 8, 3, 1, '#3a8a2a'); R(7, 7, 1, 3, '#3a8a2a'); R(12, 8, 3, 1, '#3a8a2a'); },
  carotte: ({ R }) => { for (let k = 0; k < 3; k++) { const cx = 5 + k * 5; for (let i = 0; i < 10; i++) { const w = Math.max(1, 3 - (i / 4 | 0)); R(cx - (w >> 1), 7 + i, w, 1, i % 3 ? '#e8701a' : '#c85a10'); }
    R(cx - 1, 4, 1, 3, '#4a9a3a'); R(cx + 1, 4, 1, 3, '#3a8a2a'); R(cx, 3, 1, 4, '#5ab04a'); } },
  patate: ({ D, R }) => { D(10, 8, 3, '#d0a868'); D(13, 13, 3, '#b8884a'); D(7, 13, 4, '#c89a5a'); for (const [a, b] of [[6, 12], [9, 14], [13, 12], [10, 7]]) R(a, b, 1, 1, '#7a5a2a'); R(5, 11, 2, 1, '#e8c890'); },
  oignon: ({ D, R }) => { D(10, 12, 5, '#d8a040'); R(10, 5, 1, 3, '#a87020'); R(9, 6, 3, 1, '#c88a30'); for (let y = 9; y < 16; y += 2) R(8, y, 1, 1, '#a87020'); R(7, 10, 2, 2, '#f0d090'); },
  salade: ({ D, R }) => { D(10, 12, 6, '#4a9a3a'); D(10, 12, 4, '#7ac05a'); D(10, 11, 2, '#c8f0a0'); R(10, 13, 1, 4, '#c8f0a0'); R(7, 12, 3, 1, '#c8f0a0'); R(11, 12, 3, 1, '#c8f0a0'); },
  courgette: ({ R }) => { for (const [o, c] of [[0, '#3a7a2a'], [4, '#2e6a22']]) for (let i = 0; i < 12; i++) { const x = 3 + i, y = 13 - (i * .6 | 0) + o - 2; R(x, y, 1, 3, c); R(x, y, 1, 1, '#7ab05a'); } R(14, 4, 2, 2, '#6a8a2a'); },
  avocat: ({ D, R }) => { D(13, 9, 2, '#4a6a28'); D(13, 12, 4, '#4a6a28'); D(7, 10, 2, '#3a5a20'); D(7, 13, 4, '#3a5a20'); R(5, 12, 1, 2, '#6a8a3a'); R(11, 10, 1, 2, '#7a9a48'); },
  /* ---- crèmerie et frais ---- */
  brique: ({ R, c1, lo }) => { c1 = c1 || '#3a7ac8'; R(5, 6, 8, 12, '#f2f0ea'); R(13, 6, 2, 12, '#c8c4b8'); R(6, 4, 7, 2, '#e8e4d8'); R(13, 5, 2, 1, '#b8b4aa'); R(8, 3, 3, 1, '#d8d4c8');
    R(5, 10, 8, 5, c1); R(13, 10, 2, 5, lo(c1)); R(6, 5, 2, 1, '#3a7ac8'); R(6, 11, 3, 1, '#f2f0ea'); },
  oeufs: ({ D, R }) => { for (const x of [5, 10, 15]) { D(x, 10, 2, '#f2e2c4'); R(x - 1, 8, 1, 1, '#fff8e8'); } R(2, 11, 16, 6, '#c8b088'); R(2, 11, 16, 1, '#e0c8a0'); for (const x of [5, 10, 15]) R(x - 1, 13, 3, 2, '#a89068'); },
  beurre: ({ R }) => { R(3, 8, 14, 8, '#e8d070'); R(3, 8, 14, 1, '#f8e8a0'); R(3, 15, 14, 1, '#b8a040'); R(6, 10, 8, 4, '#fbf6e0'); R(7, 11, 6, 1, '#3a7ac8'); R(7, 12, 4, 1, '#c0303a'); },
  yaourt: ({ R }) => { for (let k = 0; k < 3; k++) { const x0 = 3 + k * 5; R(x0, 9, 4, 8, '#f2f0ea'); R(x0, 8, 4, 1, '#3a7ac8'); R(x0, 12, 4, 2, '#9ab8f0'); R(x0, 9, 1, 8, '#ffffff'); } },
  sachet: ({ R, c1, hi, lo }) => { c1 = c1 || '#f0d040'; R(5, 5, 10, 13, c1); R(5, 4, 10, 1, lo(c1)); for (let x = 5; x < 15; x += 2) R(x, 3, 1, 1, lo(c1)); R(7, 9, 6, 5, hi(c1)); R(6, 6, 1, 10, hi(c1)); R(14, 5, 1, 13, lo(c1)); R(8, 15, 4, 1, '#f2f0ea'); },
  camembert: ({ D, R }) => { D(10, 12, 6, '#c8b07a'); D(10, 11, 6, '#f2ead0'); D(10, 11, 4, '#e8dcb8'); R(6, 10, 8, 2, '#c0303a'); R(7, 13, 6, 1, '#3a7ac8'); },
  pot: ({ R, c1 }) => { c1 = c1 || '#3a7ac8'; R(5, 9, 10, 8, '#f2f0ea'); R(6, 17, 8, 1, '#c8c4b8'); R(4, 7, 12, 2, c1); R(5, 12, 10, 3, c1); R(5, 9, 1, 8, '#ffffff'); },
  barquette: ({ D, R, c1, hi }) => { c1 = c1 || '#c04040'; R(2, 12, 16, 5, '#2a2a30'); R(2, 12, 16, 1, '#4a4a52'); D(7, 11, 3, c1); D(13, 11, 3, c1); R(5, 9, 2, 1, hi(c1)); R(11, 9, 2, 1, hi(c1));
    R(3, 8, 1, 1, '#ffffff'); R(4, 9, 1, 1, '#ffffff'); R(15, 9, 1, 1, '#ffffff'); },
  cylindre: ({ R, c1, lo }) => { c1 = c1 || '#3a7ac8'; R(3, 8, 14, 7, c1); R(2, 9, 1, 5, lo(c1)); R(17, 9, 1, 5, lo(c1)); R(3, 8, 14, 1, '#9ab8f0'); R(7, 10, 6, 3, '#f2f0ea'); },
  maroilles: ({ R }) => { R(5, 7, 10, 10, '#e8901a'); R(5, 7, 10, 1, '#f8b050'); R(5, 16, 10, 1, '#b86a10'); for (let i = 6; i < 15; i += 3) { R(i, 8, 1, 8, '#d8801a'); R(6, i + 2, 8, 1, '#d8801a'); } },
  saucisses: ({ R }) => { R(2, 14, 16, 3, '#2a2a30'); for (let k = 0; k < 3; k++) { R(4, 7 + k * 3, 12, 2, '#c0604a'); R(3, 8 + k * 3, 1, 1, '#c0604a'); R(16, 8 + k * 3, 1, 1, '#c0604a'); R(5, 7 + k * 3, 9, 1, '#e08a70'); } },
  saumon: ({ R }) => { R(2, 12, 16, 5, '#2a2a30'); R(4, 8, 6, 5, '#f0806a'); R(11, 8, 6, 5, '#f0906a'); for (const x of [5, 7, 12, 14]) R(x, 9, 1, 3, '#ffd0c0'); },
  /* ---- épicerie ---- */
  pates: ({ R, c1 }) => { c1 = c1 || '#3a7ac8'; R(7, 2, 6, 16, c1); R(13, 3, 1, 15, '#1e4a80'); R(8, 6, 4, 8, '#f0d070'); for (let x = 8; x < 12; x++) R(x, 6, 1, 8, x % 2 ? '#e8c050' : '#f8e090'); R(8, 15, 4, 1, '#f2f0ea'); },
  paquet: ({ R, c1, c2, hi, lo }) => { c1 = c1 || '#c0303a'; R(5, 4, 9, 14, c1); R(14, 5, 2, 13, lo(c1)); R(6, 3, 9, 1, hi(c1)); R(6, 8, 7, 5, c2 || '#f2f0ea'); R(5, 4, 1, 14, hi(c1)); R(7, 15, 5, 1, hi(c1)); },
  bocal: ({ R, c1, c2, hi }) => { c1 = c1 || '#c0303a'; R(6, 8, 8, 10, c1); R(5, 9, 10, 8, c1); R(6, 5, 8, 3, c2 || '#c9a24a'); R(6, 5, 8, 1, '#f0d070'); R(6, 11, 8, 4, '#f2f0ea'); R(6, 9, 1, 2, hi(c1)); R(6, 16, 1, 1, hi(c1)); },
  bouteille: ({ R, c1, c2, hi }) => { c1 = c1 || '#a8d8f0'; c2 = c2 || '#3a7ac8'; R(7, 7, 6, 11, c1); R(8, 5, 4, 2, c1); R(9, 3, 2, 2, c1); R(9, 2, 2, 1, c2); R(7, 10, 6, 4, c2); R(8, 7, 1, 10, hi(c1)); R(7, 17, 6, 1, hi(c1)); },
  conserve: ({ R, c1 }) => { c1 = c1 || '#3a7ac8'; for (const [x, y] of [[3, 10], [10, 6]]) { R(x, y, 7, 7, '#b8bcc4'); R(x, y, 7, 1, '#e0e4ea'); R(x, y + 2, 7, 3, c1); R(x, y + 6, 7, 1, '#8a8e96'); } },
  sel: ({ R, c1 }) => { c1 = c1 || '#3a7ac8'; R(6, 4, 8, 14, c1); R(6, 3, 8, 1, '#f2f0ea'); R(12, 2, 2, 1, '#c0c0c8'); R(6, 9, 8, 4, '#f2f0ea'); R(6, 4, 1, 14, '#6a9ae0'); },
  sac: ({ R, c1 }) => { R(5, 6, 10, 12, '#e8e4d8'); R(4, 7, 1, 10, '#c8c4b8'); R(15, 7, 1, 10, '#c8c4b8'); R(6, 4, 8, 2, '#d8d4c8'); R(7, 9, 6, 5, c1 || '#3a7ac8'); R(6, 7, 1, 9, '#ffffff'); },
  tablette: ({ R }) => { R(3, 6, 14, 9, '#5a2a1a'); for (let x = 3; x < 17; x += 3) R(x, 6, 1, 9, '#3a1a0a'); R(3, 10, 14, 1, '#3a1a0a'); R(10, 6, 7, 9, '#c9a24a'); R(10, 6, 7, 1, '#f0d070'); R(11, 9, 5, 3, '#8a2020'); },
  biscuits: ({ D, R }) => { R(3, 9, 14, 8, '#3a7ac8'); R(3, 9, 14, 1, '#6a9ae0'); for (const [x, y] of [[6, 7], [10, 6], [14, 7]]) { D(x, y, 2, '#d8a050'); R(x - 1, y - 1, 1, 1, '#f0c070'); } R(5, 12, 10, 3, '#f2f0ea'); },
  gourde: ({ R }) => { for (let k = 0; k < 3; k++) { const x0 = 3 + k * 5; R(x0, 8, 4, 9, ['#e8c040', '#e86a3a', '#8ac04a'][k]); R(x0 + 1, 6, 2, 2, '#f2f0ea'); R(x0, 8, 1, 9, '#ffffff'); } },
  /* ---- boissons ---- */
  pack: ({ R, c1 }) => { c1 = c1 || '#a8d8f0'; for (let k = 0; k < 3; k++) { R(3 + k * 5, 5, 4, 13, c1); R(4 + k * 5, 4, 2, 1, '#3a7ac8'); R(3 + k * 5, 5, 1, 13, '#e8f6ff'); } R(2, 10, 16, 4, '#3a7ac8'); R(2, 10, 16, 1, '#6a9ae0'); R(7, 2, 6, 1, '#f2f0ea'); R(7, 2, 1, 3, '#f2f0ea'); R(12, 2, 1, 3, '#f2f0ea'); },
  canettes: ({ R, c1, hi }) => { c1 = c1 || '#e8c040'; for (let k = 0; k < 3; k++) { R(3 + k * 5, 7, 4, 10, c1); R(3 + k * 5, 6, 4, 1, '#c8ccd4'); R(3 + k * 5, 10, 4, 3, '#f2f0ea'); R(3 + k * 5, 7, 1, 10, hi(c1)); } },
  /* ---- surgelés ---- */
  pizza: ({ D, R }) => { D(10, 11, 7, '#e8b050'); D(10, 11, 6, '#d04020'); for (const [x, y] of [[8, 8], [12, 9], [7, 13], [13, 14], [10, 11]]) { D(x, y, 1, '#902020'); } for (const [x, y] of [[10, 8], [9, 14], [14, 11], [6, 10]]) R(x, y, 2, 1, '#f0d060'); },
  poisson: ({ R }) => { R(4, 4, 12, 14, '#3a7ac8'); R(4, 4, 12, 1, '#6a9ae0'); R(6, 9, 6, 3, '#f2f0ea'); R(12, 8, 2, 1, '#f2f0ea'); R(12, 12, 2, 1, '#f2f0ea'); R(13, 9, 1, 3, '#f2f0ea'); R(7, 10, 1, 1, '#14101c'); R(6, 14, 8, 2, '#e8a030'); },
  /* ---- hygiène et maison ---- */
  rouleaux: ({ D, R, c1 }) => { c1 = c1 || '#f2f0ea'; for (const [x, y] of [[7, 7], [13, 7], [7, 13], [13, 13]]) { D(x, y, 3, c1); D(x, y, 1, '#c8c4b8'); } R(3, 9, 14, 2, '#3a7ac8'); },
  flacon: ({ R, c1, hi }) => { c1 = c1 || '#4ac04a'; R(6, 6, 8, 12, c1); R(7, 4, 4, 2, '#f2f0ea'); R(8, 2, 2, 2, '#f2f0ea'); R(7, 10, 6, 4, '#f2f0ea'); R(6, 6, 1, 12, hi(c1)); },
  bidon: ({ R, C, c1, lo }) => { c1 = c1 || '#3a7ac8'; R(4, 6, 12, 12, c1); R(11, 3, 4, 4, lo(c1)); C(12.5, 4.5, 1); R(5, 4, 4, 2, '#f2f0ea'); R(6, 9, 6, 6, '#f2f0ea'); R(7, 11, 4, 2, '#f0d040'); },
  tube: ({ R }) => { R(2, 8, 14, 5, '#f2f0ea'); R(2, 8, 14, 2, '#c0303a'); R(16, 9, 2, 3, '#3a7ac8'); R(2, 12, 14, 1, '#c8c4b8'); R(4, 10, 6, 1, '#3a7ac8'); },
  sacs: ({ D, R }) => { R(5, 7, 10, 9, '#2a2a30'); D(5, 11, 4, '#3a3a42'); D(5, 11, 1, '#14101c'); R(8, 9, 6, 4, '#e8c040'); R(5, 7, 10, 1, '#4a4a52'); },
  eponge: ({ R }) => { R(4, 10, 12, 6, '#f0d040'); R(4, 10, 12, 1, '#fff08a'); R(4, 7, 12, 3, '#3a9a4a'); for (let x = 5; x < 16; x += 2) R(x, 7, 1, 1, '#5ac06a'); R(5, 12, 1, 1, '#c8a020'); R(10, 14, 1, 1, '#c8a020'); },
  /* ---- pain ---- */
  baguette: ({ R }) => { for (let i = 0; i < 14; i++) R(3 + i, 15 - i, 3, 2, '#d8a050'); for (let i = 2; i < 13; i += 3) R(4 + i, 14 - i, 2, 1, '#f0d090'); },
  pain: ({ R, c1, hi, lo }) => { c1 = c1 || '#d8a050'; R(4, 8, 12, 9, c1); R(5, 6, 10, 2, hi(c1)); R(4, 16, 12, 1, lo(c1)); R(3, 7, 14, 11, 'rgba(255,255,255,.18)'); R(7, 11, 6, 3, '#f2f0ea'); },
  croissant: ({ D, R, C }) => { D(10, 10, 7, '#d89040'); D(10, 9, 6, '#e8a050'); C(10, 16, 5); for (const a of [6, 10, 14]) R(a, 5, 1, 6, '#b8702a'); R(5, 8, 2, 1, '#f8c870'); R(3, 11, 2, 2, '#d89040'); R(15, 11, 2, 2, '#d89040'); },
  painchoc: ({ R }) => { for (const y of [6, 12]) { R(4, y, 12, 5, '#d89040'); R(4, y, 12, 1, '#f0b860'); R(3, y + 2, 1, 2, '#3a1a0a'); R(16, y + 2, 1, 2, '#3a1a0a'); R(8, y + 1, 1, 3, '#b8702a'); R(12, y + 1, 1, 3, '#b8702a'); } },
  tortilla: ({ D, R }) => { D(10, 12, 6, '#f0d8a0'); D(10, 11, 6, '#f8e8c0'); for (const [x, y] of [[8, 9], [12, 12], [9, 14], [13, 8]]) R(x, y, 1, 1, '#c89a5a'); R(4, 13, 13, 4, 'rgba(255,255,255,.2)'); },
};
const icoCache = new Map();
function icone(forme, c1, c2) {
  const k = forme + '|' + (c1 || '') + '|' + (c2 || ''); if (icoCache.has(k)) return icoCache.get(k);
  const [cv, x] = mk(ICO, ICO);
  const R = (a, b, w, h, col) => { x.fillStyle = col; x.fillRect(a, b, w, h); }, D = (cx, cy, r, col) => { x.fillStyle = col; disc(x, cx, cy, r); };
  const C = (cx, cy, r) => { for (let j = 0; j < ICO; j++) for (let i = 0; i < ICO; i++) if ((i + .5 - cx) ** 2 + (j + .5 - cy) ** 2 <= r * r) x.clearRect(i, j, 1, 1); };   // gomme un disque
  const hex = c => /^#[0-9a-f]{6}$/i.test(c || '') ? c : null;
  (DESS[forme] || DESS.paquet)({ R, D, C, x, c1: hex(c1), c2: hex(c2), hi: c => shade(c, 1.35), lo: c => shade(c, .7) });
  // contour sombre autour de tout ce qui est dessiné (lisible sur fond clair comme sombre)
  const im = x.getImageData(0, 0, ICO, ICO), d = im.data, op = i => d[i * 4 + 3] > 40, add = [];
  for (let i = 0; i < ICO * ICO; i++) { if (op(i)) continue; const px = i % ICO, py = i / ICO | 0;
    if ((px > 0 && op(i - 1)) || (px < ICO - 1 && op(i + 1)) || (py > 0 && op(i - ICO)) || (py < ICO - 1 && op(i + ICO))) add.push(i); }
  for (const i of add) { d[i * 4] = 20; d[i * 4 + 1] = 16; d[i * 4 + 2] = 28; d[i * 4 + 3] = 255; }
  x.putImageData(im, 0, 0);
  icoCache.set(k, cv); return cv;
}
const icoURL = new Map();
function iconeURL(forme, c1, c2) { const k = forme + '|' + c1 + '|' + c2; if (!icoURL.has(k)) icoURL.set(k, icone(forme, c1, c2).toDataURL()); return icoURL.get(k); }
