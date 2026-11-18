"use strict";
// « Les Catacombes » : un labyrinthe en VRAIE 3D (vue à la première personne), sous le Caveau.
// - Rendu par lancer de rayons (raycasting) dans le même canvas 384×216 : murs, sol et plafond texturés,
//   éclairage des torches, lumière tramée façon pixel art. Aucune bibliothèque.
// - But : retrouver les 5 reliques du jour (elles changent de place chaque jour, pareil pour tout le monde).
//   Chaque relique trouvée une première fois est exposée pour toujours sur son socle, dans le Caveau.
// - Le Gardien (un spectre) fait sa ronde : s'il te touche, retour à l'entrée.
// - Les autres joueurs présents dans les catacombes sont visibles en 3D.
// Réglages rapides : CAT_SEED (forme du labyrinthe), FP_SPEED, GHOST_SPEED, RELIC_XP, RELIC_SHARDS.

const CAT_SEED = 90210, FP_SPEED = 2.3, FP_TURN = 2.5, GHOST_SPEED = 1.5, RELIC_XP = 20, RELIC_SHARDS = 10;
const CG = 25, CN = 12, FP_S = 256, FP_PL = .75;      // grille 25×25, 12×12 cellules ; échelle de projection ; demi-champ de vision
const START = { x: 13.5, y: 23.5, a: -Math.PI / 2 };
const RELICS = [
  { name: 'le Calice', art: ['.ggggggg.', '.grrrrrg.', '.grrrrrg.', '..ggggg..', '...ggg...', '....g....', '....g....', '...GgG...', '..ggggg..'], glow: '255,200,110' },
  { name: 'le Crâne', art: ['..wwwww..', '.wwwwwww.', '.wkkwkkw.', '.wkkwkkw.', '.wwwkwww.', '..wwwww..', '..wkwkw..', '..WWWWW..', '.........'], glow: '230,225,200' },
  { name: 'la Clef', art: ['..ggg....', '.g...g...', '.g...g...', '..ggg....', '...g.....', '...g.....', '...gg....', '...g.....', '...gg....'], glow: '255,210,120' },
  { name: 'le Sablier', art: ['.GGGGGGG.', '..wwwww..', '..wgggw..', '...wgw...', '....w....', '...wgw...', '..wg.gw..', '..wgggw..', '.GGGGGGG.'], glow: '255,220,150' },
  { name: 'le Croissant', art: ['...ccc...', '..ccc....', '.ccC.....', '.ccC.....', '.ccC.....', '.cccC....', '..cccc.c.', '...cccc..', '.........'], glow: '130,225,255' },
];
const RPAL = { g: '#e8c860', G: '#8a6a2a', w: '#f2e8d0', W: '#a09880', r: '#c9203a', c: '#9fe8ff', C: '#3a90b0', k: '#14101c' };
for (const rl of RELICS) { const [c, x] = mk(9, 9), [d, y] = mk(9, 9); rl.spr = c; rl.dark = d;
  rl.art.forEach((row, j) => [...row].forEach((ch, i) => { if (ch === '.') return; x.fillStyle = RPAL[ch]; x.fillRect(i, j, 1, 1); y.fillStyle = '#2a2632'; y.fillRect(i, j, 1, 1); })); }

/* ---------------- le labyrinthe (identique pour tous les joueurs) ---------------- */
const cmap = new Uint8Array(CG * CG).fill(1), ci = (x, y) => y * CG + x;
{ const cr = rng(CAT_SEED), seen = new Uint8Array(CN * CN), st = [[6, 11]]; seen[11 * CN + 6] = 1; cmap[ci(13, 23)] = 0;
  while (st.length) { const [cx, cy] = st[st.length - 1];
    const nb = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dy]) => { const nx = cx + dx, ny = cy + dy; return nx >= 0 && ny >= 0 && nx < CN && ny < CN && !seen[ny * CN + nx]; });
    if (!nb.length) { st.pop(); continue; }
    const [dx, dy] = nb[cr() * nb.length | 0]; cmap[ci(cx * 2 + 1 + dx, cy * 2 + 1 + dy)] = 0; cmap[ci((cx + dx) * 2 + 1, (cy + dy) * 2 + 1)] = 0; seen[(cy + dy) * CN + cx + dx] = 1; st.push([cx + dx, cy + dy]); }
  for (let y = 1; y < CG - 1; y++) for (let x = 1; x < CG - 1; x++) if ((x + y) % 2 === 1 && cmap[ci(x, y)] && cr() < .12) cmap[ci(x, y)] = 0;   // quelques boucles
  for (let y = 10; y <= 14; y++) for (let x = 10; x <= 14; x++) cmap[ci(x, y)] = 0;                                                      // la crypte centrale
  for (let i = 0; i < CG * CG; i++) if (cmap[i]) { const x = i % CG, y = i / CG | 0, k = cr();
    cmap[i] = (x >= 9 && x <= 15 && y >= 9 && y <= 15) ? 5 : k < .1 ? 3 : k < .3 ? 4 : 1; }
  cmap[ci(13, 24)] = 2; }                                                                                                                 // la porte de sortie
const copen = (x, y) => x >= 0 && y >= 0 && x < CG && y < CG && !cmap[ci(x, y)];
{ const d = [[0, -1], [1, 0], [-1, 0]].find(([dx, dy]) => copen(13 + dx, 23 + dy)); START.a = Math.atan2(d[1], d[0]); }   // on regarde vers le premier couloir
const cdist = new Int16Array(CG * CG).fill(-1);
{ const q = [[13, 23]]; cdist[ci(13, 23)] = 0;
  for (let h = 0; h < q.length; h++) { const [x, y] = q[h]; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (copen(x + dx, y + dy) && cdist[ci(x + dx, y + dy)] < 0) { cdist[ci(x + dx, y + dy)] = cdist[ci(x, y)] + 1; q.push([x + dx, y + dy]); } } }

/* torches + carte de lumière */
const torches = [], LG = new Float32Array(CG * CG);
{ const tr = rng(CAT_SEED + 7);
  const add = (x, y) => { const d = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dy]) => !copen(x + dx, y + dy)); if (!d.length) return; const [dx, dy] = d[tr() * d.length | 0];
    torches.push({ x: x + .5 + dx * .42, y: y + .5 + dy * .42, ph: tr() * 9 });
    const q = [[x, y, 0]], seen = new Set([ci(x, y)]);
    for (let h = 0; h < q.length; h++) { const [a, b, n] = q[h]; LG[ci(a, b)] = Math.max(LG[ci(a, b)], 1 - n / 4.6); if (n >= 4) continue;
      for (const [ex, ey] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (copen(a + ex, b + ey) && !seen.has(ci(a + ex, b + ey))) { seen.add(ci(a + ex, b + ey)); q.push([a + ex, b + ey, n + 1]); } } };
  add(13, 23); for (const [x, y] of [[10, 10], [14, 10], [10, 14], [14, 14]]) add(x, y);
  for (let y = 1; y < CG; y += 2) for (let x = 1; x < CG; x += 2) if (copen(x, y) && tr() < .15 && cdist[ci(x, y)] > 3) add(x, y);
  const src = LG.slice(); for (let i = 0; i < CG * CG; i++) if (cmap[i]) { const x = i % CG, y = i / CG | 0; let m = 0;        // les murs prennent la lumière de leurs voisins (pour l'interpolation)
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (copen(x + dx, y + dy)) m = Math.max(m, src[ci(x + dx, y + dy)]); LG[i] = m; } }
function lightAt(x, y) { x -= .5; y -= .5; const x0 = Math.floor(x), y0 = Math.floor(y); if (x0 < 0 || y0 < 0 || x0 >= CG - 1 || y0 >= CG - 1) return 0;
  const fx = x - x0, fy = y - y0, i = y0 * CG + x0; return (LG[i] * (1 - fx) + LG[i + 1] * fx) * (1 - fy) + (LG[i + CG] * (1 - fx) + LG[i + CG + 1] * fx) * fy; }

/* la ronde du Gardien : un grand tour du labyrinthe, calé sur l'horloge (donc le même pour tout le monde) */
const ghostPath = [];
{ const seen = new Set(), go = (cx, cy) => { seen.add(cy * CN + cx); ghostPath.push([cx * 2 + 1.5, cy * 2 + 1.5]);
    for (const [dx, dy] of [[1, 0], [0, 1], [-1, 0], [0, -1]]) { const nx = cx + dx, ny = cy + dy; if (nx < 0 || ny < 0 || nx >= CN || ny >= CN || seen.has(ny * CN + nx) || !copen(cx * 2 + 1 + dx, cy * 2 + 1 + dy)) continue;
      go(nx, ny); ghostPath.push([cx * 2 + 1.5, cy * 2 + 1.5]); } };
  go(5, 5); }
function ghostPos() { const t = Date.now() / 1000 * GHOST_SPEED / 2, n = ghostPath.length, i = Math.floor(t) % n, f = t - Math.floor(t), a = ghostPath[i], b = ghostPath[(i + 1) % n];
  return { x: a[0] + (b[0] - a[0]) * f, y: a[1] + (b[1] - a[1]) * f }; }

/* les reliques du jour */
const HUNT = { day: '', list: [] };
function huntSetup() {
  const day = new Date().toISOString().slice(0, 10); if (HUNT.day === day) return;
  HUNT.day = day; let h = CAT_SEED; for (const ch of day) h = Math.imul(h, 31) + ch.charCodeAt(0) | 0; const hr = rng(h);
  const ends = []; for (let y = 1; y < CG; y += 2) for (let x = 1; x < CG; x += 2) { if (!copen(x, y) || cdist[ci(x, y)] < 10 || (x >= 9 && x <= 15 && y >= 9 && y <= 15)) continue;
    const n = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dy]) => copen(x + dx, y + dy)).length; ends.push({ x, y, k: hr() + (n === 1 ? 1 : 0) }); }
  ends.sort((a, b) => b.k - a.k); const pick = [];
  for (const e of ends) { if (pick.length >= 4) break; if (pick.every(p => Math.abs(p.x - e.x) + Math.abs(p.y - e.y) >= 8)) pick.push(e); }
  HUNT.list = pick.map((p, i) => ({ kind: i, x: p.x + .5, y: p.y + .5 })); HUNT.list.push({ kind: 4, x: 12.5, y: 12.5 });
  if (!PROG.hunt || PROG.hunt.day !== day) { PROG.hunt = { day, got: {} }; saveProg(); }
}
if (!PROG.relics) PROG.relics = {};
const huntCount = () => PROG.hunt ? Object.keys(PROG.hunt.got).length : 0;

/* ---------------- textures 32×32 (générées) ---------------- */
function mkTex(fn) { const [c, x] = mk(32, 32); fn(x, rng(CAT_SEED + (mkTex.n = (mkTex.n || 0) + 1))); return x.getImageData(0, 0, 32, 32).data; }
const g3 = (v, r, a = 14) => { const k = v + (r() - .5) * a | 0; return `rgb(${k},${k - 6},${k + 16})`; };
function catBricks(x, r, base = 112) { x.fillStyle = 'rgb(40,36,52)'; x.fillRect(0, 0, 32, 32);
  for (let row = 0; row < 4; row++) for (let i = -1; i < 2; i++) { const bx = i * 16 + (row % 2) * 8, by = row * 8; x.fillStyle = g3(base, r, 26); x.fillRect(bx + 1, by + 1, 15, 7);
    x.fillStyle = 'rgba(255,255,255,.1)'; x.fillRect(bx + 1, by + 1, 15, 1); x.fillStyle = 'rgba(0,0,0,.16)'; x.fillRect(bx + 1, by + 7, 15, 1);
    for (let k = 0; k < 3; k++) { x.fillStyle = 'rgba(0,0,0,.14)'; x.fillRect(bx + 2 + (r() * 12 | 0), by + 2 + (r() * 4 | 0), 1 + (r() * 2 | 0), 1); } } }
const TEX = [null,
  mkTex(catBricks),
  mkTex((x, r) => { x.fillStyle = 'rgb(70,66,84)'; x.fillRect(0, 0, 32, 32); x.fillStyle = 'rgb(118,112,134)'; x.fillRect(0, 0, 5, 32); x.fillRect(27, 0, 5, 32); x.fillRect(0, 0, 32, 4);
    for (let i = 0; i < 4; i++) { x.fillStyle = `rgb(${96 + i % 2 * 14},${62 + i % 2 * 8},${38})`; x.fillRect(6 + i * 5, 5, 5, 27); x.fillStyle = 'rgba(0,0,0,.3)'; x.fillRect(6 + i * 5, 5, 1, 27); }
    x.fillStyle = 'rgb(52,52,62)'; x.fillRect(5, 9, 22, 3); x.fillRect(5, 24, 22, 3); x.fillStyle = 'rgb(150,150,165)'; for (let i = 0; i < 5; i++) { x.fillRect(7 + i * 4, 10, 1, 1); x.fillRect(7 + i * 4, 25, 1, 1); }
    x.fillStyle = 'rgb(210,170,80)'; x.fillRect(21, 16, 3, 1); x.fillRect(21, 19, 3, 1); x.fillRect(21, 17, 1, 2); x.fillRect(23, 17, 1, 2); }),
  mkTex((x, r) => { catBricks(x, r); x.fillStyle = 'rgb(14,12,20)'; x.fillRect(8, 9, 16, 15); x.fillRect(10, 7, 12, 2); x.fillStyle = 'rgb(60,56,72)'; x.fillRect(8, 24, 16, 1);
    x.fillStyle = 'rgb(214,206,180)'; x.fillRect(12, 12, 8, 6); x.fillRect(13, 11, 6, 1); x.fillRect(13, 18, 6, 3); x.fillStyle = 'rgb(14,12,20)'; x.fillRect(13, 14, 2, 2); x.fillRect(17, 14, 2, 2); x.fillRect(15, 17, 2, 1);
    x.fillRect(14, 20, 1, 1); x.fillRect(16, 20, 1, 1); x.fillRect(18, 20, 1, 1); x.fillStyle = 'rgb(150,144,124)'; x.fillRect(10, 22, 12, 1); x.fillRect(11, 23, 3, 1); x.fillRect(18, 23, 3, 1); }),
  mkTex((x, r) => { catBricks(x, r, 100); for (let i = 0; i < 32; i++) { const h = 3 + (r() * r() * 22 | 0); for (let y = 0; y < h; y++) if (r() < .8 - y / h * .5) { x.fillStyle = r() < .5 ? 'rgb(58,104,70)' : 'rgb(40,78,58)'; x.fillRect(i, y, 1, 1); } } }),
  mkTex((x, r) => { x.fillStyle = 'rgb(44,40,58)'; x.fillRect(0, 0, 32, 32); x.fillStyle = g3(124, r, 6); x.fillRect(1, 1, 30, 12); x.fillRect(1, 19, 30, 12);
    x.fillStyle = 'rgb(150,116,48)'; x.fillRect(0, 14, 32, 4); x.fillStyle = 'rgb(226,190,96)'; x.fillRect(0, 14, 32, 1); for (let i = 2; i < 32; i += 6) x.fillRect(i, 16, 2, 1);
    x.fillStyle = 'rgb(84,78,100)'; for (let k = 0; k < 5; k++) { x.fillRect(16 - k, 3 + k, 1 + k * 2, 1); x.fillRect(16 - k, 11 - k, 1 + k * 2, 1); }
    x.fillStyle = 'rgb(84,78,100)'; x.fillRect(4, 21, 24, 1); x.fillRect(4, 28, 24, 1); x.fillRect(4, 21, 1, 8); x.fillRect(27, 21, 1, 8); }),
];
const TEX_FLOOR = mkTex((x, r) => { x.fillStyle = 'rgb(34,32,44)'; x.fillRect(0, 0, 32, 32);
  for (let j = 0; j < 2; j++) for (let i = -1; i < 2; i++) { const bx = i * 16 + j * 8, by = j * 16; x.fillStyle = g3(88, r, 20); x.fillRect(bx + 1, by + 1, 15, 15); x.fillStyle = 'rgba(255,255,255,.07)'; x.fillRect(bx + 1, by + 1, 15, 1);
    for (let k = 0; k < 6; k++) { x.fillStyle = 'rgba(0,0,0,.16)'; x.fillRect(bx + 2 + (r() * 12 | 0), by + 2 + (r() * 12 | 0), 1 + (r() * 3 | 0), 1); } } });
const TEX_CEIL = mkTex((x, r) => { for (let y = 0; y < 32; y++) for (let i = 0; i < 32; i++) { x.fillStyle = g3(60, r, 16); x.fillRect(i, y, 1, 1); }
  x.fillStyle = 'rgb(30,28,40)'; x.fillRect(0, 0, 32, 1); x.fillRect(0, 16, 32, 1); x.fillRect(0, 0, 1, 32); });

/* sprites : torche (3 images), spectre, lanterne tenue en main */
const TORCH = [0, 1, 2].map(f => { const [c, x] = mk(7, 12); x.fillStyle = '#3a2a1a'; x.fillRect(3, 6, 1, 6); x.fillStyle = '#5a5a68'; x.fillRect(1, 6, 5, 1); x.fillRect(2, 7, 3, 1);
  x.fillStyle = '#ff7a20'; x.fillRect(2, 2 + (f === 1), 3, 4 - (f === 1)); x.fillRect(3 - (f === 2), 1, 1, 1); x.fillStyle = '#ffd060'; x.fillRect(3, 3, 1, 3); x.fillRect(2 + f % 2, 4, 2, 2); x.fillStyle = '#fff4c8'; x.fillRect(3, 5, 1, 1); return c; });
const GHOST = (() => { const [c, x] = mk(20, 28);
  for (let y = 0; y < 28; y++) { const hw = y < 9 ? Math.round(Math.sqrt(81 - (9 - y) * (9 - y)) * .9) : Math.min(9, 8 + (y - 9) / 9 | 0);
    for (let i = 10 - hw; i < 10 + hw; i++) { if (y > 22 && (i * 3 + y) % 4 < y - 22) continue; const e = i === 10 - hw || i === 10 + hw - 1; x.fillStyle = e ? '#5a9aa0' : y > 18 ? '#9ad0cc' : '#c8f0e8'; x.fillRect(i, y, 1, 1); } }
  x.fillStyle = '#0a1418'; for (let y = 5; y < 13; y++) { const hw = Math.round(Math.sqrt(Math.max(0, 16 - (y - 9) * (y - 9))) * 1.3); x.fillRect(10 - hw, y, hw * 2, 1); }
  x.fillStyle = '#ffffff'; x.fillRect(7, 8, 2, 2); x.fillRect(11, 8, 2, 2); x.fillStyle = '#7fe0ff'; x.fillRect(7, 10, 2, 1); x.fillRect(11, 10, 2, 1); return c; })();
const [handC, handX] = mk(64, 60);
function drawHand(col) { const x = handX; x.clearRect(0, 0, 64, 60);
  // manche : du poing jusqu'au coin de l'écran
  for (const [c, r] of [['#05030a', 8], [shade(col, .72), 7]]) { x.fillStyle = c; for (let i = 0; i <= 50; i++) { const t = i / 50, w = r + t * 5; x.fillRect(Math.round(20 + t * 44 - w / 2), Math.round(10 + t * 50 - w / 2), Math.round(w), Math.round(w)); } }
  x.fillStyle = shade(col, 1.05); for (let i = 0; i <= 50; i++) { const t = i / 50; x.fillRect(Math.round(20 + t * 44 + 1), Math.round(10 + t * 50 - 5 - t * 2), 3, 2); }
  x.fillStyle = shade(col, 1.3); x.fillRect(17, 12, 8, 2);
  // poing
  x.fillStyle = '#05030a'; x.fillRect(10, 3, 11, 10); x.fillStyle = '#e6c8a8'; x.fillRect(11, 4, 9, 8); x.fillStyle = '#c8a888'; x.fillRect(11, 10, 9, 2); x.fillRect(13, 4, 1, 6); x.fillRect(16, 4, 1, 6);
  // anneau, chaîne, lanterne
  x.fillStyle = '#8a6a2a'; x.fillRect(14, 13, 3, 1); x.fillRect(15, 14, 1, 4);
  x.fillStyle = '#05030a'; x.fillRect(7, 17, 17, 23); x.fillRect(10, 15, 11, 2); x.fillStyle = '#c9a24a'; x.fillRect(11, 16, 9, 2); x.fillRect(8, 18, 15, 2); x.fillRect(8, 36, 15, 3); x.fillStyle = '#e8c860'; x.fillRect(8, 18, 15, 1);
  x.fillStyle = '#ffb040'; x.fillRect(9, 20, 13, 16); x.fillStyle = '#ffe08a'; x.fillRect(11, 23, 9, 11); x.fillStyle = '#fff8d8'; x.fillRect(14, 25, 3, 8);
  x.fillStyle = '#c9a24a'; x.fillRect(8, 20, 1, 16); x.fillRect(22, 20, 1, 16); x.fillStyle = '#8a6a2a'; x.fillRect(15, 20, 1, 4); x.fillRect(15, 33, 1, 3); }

/* ---------------- la salle ---------------- */
const FP = { x: START.x, y: START.y, a: START.a, v: 0, va: 0, bob: 0, stepD: 0, safe: 0, flash: 0, beat: 0, seen: new Uint8Array(CG * CG), hint: false, gd: 99 };
ROOMS.catacombes = { id: 'catacombes', name: 'LES CATACOMBES', fp: true, indoor: true, fires: [], stars: [], grass: [], portals: [], plats: [], climbs: [], critters: [],
  onEnter() { huntSetup(); Object.assign(FP, { x: START.x, y: START.y, a: START.a, v: 0, va: 0, safe: 4, flash: 0 }); drawHand(player.color);
    if (!FP.hint) { FP.hint = true; toast('<b>Flèches</b> ou <b>ZQSD</b> : avancer et tourner. Retrouve les 5 reliques… et évite le Gardien.'); } } };
const fpWall = (x, y) => !copen(Math.floor(x), Math.floor(y));
function fpUpdate(dt, t) {
  huntSetup();
  const turn = t ? 0 : (any(keys, 'ArrowRight', 'KeyD') ? 1 : 0) - (any(keys, 'ArrowLeft', 'KeyA', 'KeyQ') ? 1 : 0), mv = t ? 0 : (any(keys, 'ArrowUp', 'KeyW', 'KeyZ') ? 1 : 0) - (any(keys, 'ArrowDown', 'KeyS') ? .6 : 0);
  FP.va += (turn * FP_TURN - FP.va) * Math.min(1, dt * 12); FP.a += FP.va * dt;
  FP.v += (mv * FP_SPEED - FP.v) * Math.min(1, dt * 10);
  const dx = Math.cos(FP.a) * FP.v * dt, dy = Math.sin(FP.a) * FP.v * dt, rad = .24;
  const nx = FP.x + dx; if (!fpWall(nx + Math.sign(dx) * rad, FP.y - rad) && !fpWall(nx + Math.sign(dx) * rad, FP.y + rad)) FP.x = nx; else FP.v *= .6;
  const ny = FP.y + dy; if (!fpWall(FP.x - rad, ny + Math.sign(dy) * rad) && !fpWall(FP.x + rad, ny + Math.sign(dy) * rad)) FP.y = ny; else FP.v *= .6;
  FP.stepD += Math.abs(FP.v) * dt; FP.bob = Math.sin(FP.stepD * 4.2) * Math.min(1, Math.abs(FP.v));
  if (FP.stepD > (FP.nextStep || 0)) { FP.nextStep = FP.stepD + .75; if (Math.abs(FP.v) > .5) sfx.step(); }
  const cx = Math.floor(FP.x), cy = Math.floor(FP.y); for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) if (cx + i >= 0 && cy + j >= 0 && cx + i < CG && cy + j < CG) FP.seen[ci(cx + i, cy + j)] = 1;
  // reliques
  for (const rl of HUNT.list) if (!PROG.hunt.got[rl.kind] && Math.hypot(rl.x - FP.x, rl.y - FP.y) < .55) { PROG.hunt.got[rl.kind] = 1; const first = !PROG.relics[rl.kind]; PROG.relics[rl.kind] = 1; saveProg();
    gainShards(RELIC_SHARDS); FP.flash = -.6; [76, 81, 88].forEach((m, i) => tone(mtof(m), .7, { type: 'sine', v: .1, when: i * .09, wet: .8 }));
    toast(`Tu as trouvé <b>${RELICS[rl.kind].name}</b> ! (${huntCount()}/5)` + (first ? '<br><i>Il rejoint son socle dans le Caveau.</i>' : ''));
    if (huntCount() === 5) setTimeout(() => { gainShards(60); sfx.level(); toast('Les <b>5 reliques</b> du jour sont réunies ! <i>+60 pièces d’or</i><br>Elles seront cachées ailleurs demain.'); }, 1200); }
  // le Gardien
  const g = ghostPos(), gd = FP.gd = Math.hypot(g.x - FP.x, g.y - FP.y); FP.safe -= dt;
  if (gd < 5.5) { FP.beat -= dt; if (FP.beat <= 0) { FP.beat = .3 + gd * .16; const v = .3 * (1 - gd / 5.5); tone(58, .14, { type: 'sine', v, slide: .7 }); tone(52, .16, { type: 'sine', v: v * .7, slide: .7, when: .13 }); }
    if (Math.random() < dt * 1.5) noise(.5, { f: 900 + Math.random() * 900, q: 6, v: .03 * (1 - gd / 5.5), at: .2, wet: .8 }); }
  if (gd < .6 && FP.safe <= 0 && Math.hypot(START.x - FP.x, START.y - FP.y) > 2.2) { Object.assign(FP, { x: START.x, y: START.y, a: START.a, v: 0, safe: 3, flash: 1 });
    noise(.9, { f: 500, sweep: 6, q: 1, v: .25, wet: .6 }); tone(220, 1.1, { type: 'sawtooth', v: .08, slide: .3, wet: .8, lp: 900 }); toast("Le <b>Gardien</b> t'a touché… tu te réveilles à l'entrée."); }
  if (FP.flash > 0) FP.flash = Math.max(0, FP.flash - dt * 1.2); else if (FP.flash < 0) FP.flash = Math.min(0, FP.flash + dt * 1.5);
  if (AMBIANCE && Math.random() < dt * .3) tone(1400 + Math.random() * 800, .07, { type: 'sine', v: .03, slide: .5, wet: 1 });
  if (!t && pressed.has('KeyM')) { audioInit(); setSound(!SND.on); toast(SND.on ? 'Son activé' : 'Son coupé'); }
  if (!t && pressed.has('KeyE') && fpNearExit()) { sfx.door(); enterRoom('caveau', 52); player.y = GROUND; player.vy = 0; player.ground = true; return; }
  Object.assign(player, { x: FP.x * 15, y: FP.y * 8, vx: FP.v * 30, vy: 0, ground: true, climbing: null });
}
const fpNearExit = () => Math.hypot(START.x - FP.x, START.y + .4 - FP.y) < 1;

/* ---------------- rendu ---------------- */
const fpImg = ctx.createImageData(W, H), fp32 = new Uint32Array(fpImg.data.buffer), zbuf = new Float32Array(W);
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(v => v / 16);
const [litC, litX] = mk(48, 48);
function fpRender() {
  const dirX = Math.cos(FP.a), dirY = Math.sin(FP.a), plX = -dirY * FP_PL, plY = dirX * FP_PL, hz = (H >> 1) + Math.round(FP.bob * 2.5), px = FP.x, py = FP.y;
  const flick = .86 + .09 * Math.sin(time * 11) + .05 * Math.sin(time * 23.7);
  const pix = (tex, o, c, w, b) => { const cq = ((c * 12 + b) | 0) / 12, wq = ((w * 9 + b) | 0) / 9; let r = tex[o] * (cq * .5 + wq), g = tex[o + 1] * (cq * .58 + wq * .62), bl = tex[o + 2] * (cq * .96 + wq * .3);
    return 0xff000000 | ((bl > 255 ? 255 : bl) << 16) | ((g > 255 ? 255 : g) << 8) | (r > 255 ? 255 : r); };
  // sol et plafond
  const lx = dirX - plX, ly = dirY - plY, sxs = plX * 2 / W, sys = plY * 2 / W;
  for (let y = 0; y < H; y++) { const dy = y - hz, o = y * W; if (dy === 0) { fp32.fill(0xff000000, o, o + W); continue; }
    const rd = (FP_S / 2) / Math.abs(dy), tex = dy > 0 ? TEX_FLOOR : TEX_CEIL; if (rd > 13) { fp32.fill(0xff000000, o, o + W); continue; }
    const cold = .04 + .95 / (1 + rd * rd * .22), k = dy > 0 ? 1 : .8; let fx = px + rd * lx, fy = py + rd * ly; const stx = rd * sxs, sty = rd * sys;
    for (let x = 0; x < W; x++, fx += stx, fy += sty) { const tx = (fx - Math.floor(fx)) * 32 | 0, ty = (fy - Math.floor(fy)) * 32 | 0;
      fp32[o + x] = pix(tex, (ty * 32 + tx) << 2, cold * k, lightAt(fx, fy) * flick * k, BAYER[(y & 3) << 2 | x & 3]); } }
  // murs
  for (let x = 0; x < W; x++) { const cam = 2 * x / W - 1, rx = dirX + plX * cam, ry = dirY + plY * cam; let mx = Math.floor(px), my = Math.floor(py);
    const ddx = Math.abs(1 / rx), ddy = Math.abs(1 / ry), stx = rx < 0 ? -1 : 1, sty = ry < 0 ? -1 : 1; let sdx = rx < 0 ? (px - mx) * ddx : (mx + 1 - px) * ddx, sdy = ry < 0 ? (py - my) * ddy : (my + 1 - py) * ddy, side = 0, type = 0;
    for (let n = 0; n < 64 && !type; n++) { if (sdx < sdy) { sdx += ddx; mx += stx; side = 0; } else { sdy += ddy; my += sty; side = 1; } if (mx < 0 || my < 0 || mx >= CG || my >= CG) { type = 1; break; } type = cmap[ci(mx, my)]; }
    const d = Math.max(.05, side ? sdy - ddy : sdx - ddx); zbuf[x] = d;
    const lh = FP_S / d, y0 = hz - lh / 2, tex = TEX[type] || TEX[1]; let wx = side ? px + d * rx : py + d * ry; wx -= Math.floor(wx); let tx = wx * 32 | 0; if ((!side && rx < 0) || (side && ry > 0)) tx = 31 - tx;
    const cold = (.04 + .95 / (1 + d * d * .22)) * (side ? .78 : 1), warm = lightAt(side ? px + d * rx : mx - stx + .5, side ? my - sty + .5 : py + d * ry) * flick * (side ? .85 : 1) + (type === 2 ? .12 : 0);
    const ya = Math.max(0, Math.ceil(y0)), yb = Math.min(H - 1, Math.floor(y0 + lh));
    for (let y = ya; y <= yb; y++) { const ty = Math.min(31, (y - y0) / lh * 32 | 0); fp32[y * W + x] = pix(tex, (ty * 32 + tx) << 2, cold, warm, BAYER[(y & 3) << 2 | x & 3]); } }
  ctx.putImageData(fpImg, 0, 0);
  // sprites (du plus loin au plus près)
  const inv = 1 / (plX * dirY - dirX * plY), list = [];
  const proj = (wx, wy) => { const rx = wx - px, ry = wy - py, tX = inv * (dirY * rx - dirX * ry), tY = inv * (-plY * rx + plX * ry); return tY > .15 ? { tX, tY, sx: (W / 2) * (1 + tX / tY) } : null; };
  const bb = (p, src, sw, sh, hW, elev, wMul = 1) => { const hpx = Math.max(1, Math.round(FP_S * hW / p.tY)), wpx = Math.max(1, Math.round(hpx * sw / sh * wMul)), bottom = Math.round(hz + (FP_S / 2 - elev * FP_S) / p.tY), top = bottom - hpx, x0 = Math.round(p.sx - wpx / 2);
    for (let x = Math.max(0, x0); x < Math.min(W, x0 + wpx); x++) if (p.tY < zbuf[x]) ctx.drawImage(src, Math.min(sw - 1, (x - x0) / wpx * sw | 0), 0, 1, sh, x, top, 1, hpx);
    const cx = Math.round(p.sx); return { top, hpx, vis: cx >= 0 && cx < W && p.tY < zbuf[cx] }; };
  const lit = (src, sw, sh, l) => { if (litC.width < sw || litC.height < sh) { litC.width = Math.max(litC.width, sw); litC.height = Math.max(litC.height, sh); } litX.globalCompositeOperation = 'source-over'; litX.clearRect(0, 0, litC.width, litC.height); litX.drawImage(src, 0, 0, sw, sh, 0, 0, sw, sh);
    litX.globalCompositeOperation = 'source-atop'; litX.fillStyle = `rgba(4,4,10,${clamp(1 - l, 0, .95)})`; litX.fillRect(0, 0, sw, sh); return litC; };
  for (const t of torches) { const p = proj(t.x, t.y); if (p && p.tY < 12) list.push({ p, k: 0, t }); }
  for (const rl of HUNT.list) if (!PROG.hunt.got[rl.kind]) { const p = proj(rl.x, rl.y); if (p && p.tY < 12) list.push({ p, k: 1, rl }); }
  const g = ghostPos(), gp = proj(g.x, g.y); if (gp && gp.tY < 12) list.push({ p: gp, k: 2 });
  for (const e of roomEnts()) if (e !== player) { const p = proj(e.x / 15, e.y / 8); if (p && p.tY < 12) list.push({ p, k: 3, e }); }
  list.sort((a, b) => b.p.tY - a.p.tY);
  const glows = [], tags = [];
  for (const s of list) { const p = s.p;
    if (s.k === 0) { const r = bb(p, TORCH[(time * 9 + s.t.ph) % 3 | 0], 7, 12, .34, .42); if (r.vis) glows.push([p.sx, r.top + r.hpx * .3, 110 / p.tY, '255,140,50', .3 * flick]); }
    else if (s.k === 1) { const sp = Math.cos(time * 2.2 + s.rl.kind), r = bb(p, RELICS[s.rl.kind].spr, 9, 9, .26, .3 + .05 * Math.sin(time * 2.5 + s.rl.kind), Math.max(.18, Math.abs(sp)));
      if (r.vis) { glows.push([p.sx, r.top + r.hpx / 2, 150 / p.tY, RELICS[s.rl.kind].glow, .42]);
        for (let i = 0; i < 4; i++) { const ph = (time * .7 + i * .25) % 1; ctx.fillStyle = `rgba(${RELICS[s.rl.kind].glow},${1 - ph})`; ctx.fillRect(Math.round(p.sx + Math.sin(i * 2.4 + time) * r.hpx * .7), Math.round(r.top + r.hpx - ph * r.hpx * 2.2), 1, 1); } } }
    else if (s.k === 2) { ctx.globalAlpha = .78 + .12 * Math.sin(time * 5); const r = bb({ ...p, sx: p.sx + Math.sin(time * 1.7) * 6 / p.tY }, GHOST, 20, 28, .8, .1 + .05 * Math.sin(time * 2.1)); ctx.globalAlpha = 1;
      if (r.vis) glows.push([p.sx, r.top + r.hpx * .4, 170 / p.tY, '130,230,220', .3]); }
    else { drawPetit(s.e); const l = .05 + 1 / (1 + p.tY * p.tY * .2) + lightAt(s.e.x / 15, s.e.y / 8) * .8, r = bb(p, lit(sc, BW, BH, l), BW, BH, .66 * BH / 44, 0);
      if (r.vis && p.tY < 7) tags.push([s.e, p.sx, r.top]); } }
  ctx.globalCompositeOperation = 'lighter';
  for (const [x, y, r, col, a] of glows) glow(x, y, clamp(r, 4, 140), col, a);
  if (FP.gd < 5.5) { ctx.fillStyle = `rgba(110,210,200,${.1 * (1 - FP.gd / 5.5) * (.6 + .4 * Math.sin(time * 9))})`; ctx.fillRect(0, 0, W, H); }
  glow(W - 47 + FP.bob * 2, H - 26, 90, '255,170,70', .16 * flick);
  ctx.globalCompositeOperation = 'source-over';
  for (const [e, x, y] of tags) { const t = txt(norm(e.name), '#e6e1d3', '#05060a'); ctx.drawImage(t, Math.round(x - t.width / 2), Math.max(1, y - 9)); }
  ctx.drawImage(vig, 0, 0);
  ctx.drawImage(handC, W - 62 + Math.round(Math.sin(FP.stepD * 2.1) * 3 * Math.min(1, Math.abs(FP.v))), H - 54 + Math.round(Math.abs(FP.bob) * 3));
  // reliques du jour + carte
  const n = huntCount(), lab = txt(`RELIQUES ${n}/5`, '#e8c860', '#05060a'); ctx.drawImage(lab, 5, 4);
  RELICS.forEach((rl, i) => { const got = PROG.hunt.got[i]; ctx.fillStyle = '#05030a'; ctx.fillRect(5 + i * 13, 13, 11, 11); ctx.fillStyle = got ? '#3a3046' : '#16121c'; ctx.fillRect(6 + i * 13, 14, 9, 9); ctx.drawImage(got ? rl.spr : rl.dark, 6 + i * 13, 14); });
  const MX = W - 56, MY = 5; ctx.fillStyle = 'rgba(5,3,10,.7)'; ctx.fillRect(MX - 2, MY - 2, 54, 54); ctx.fillStyle = '#8a6a2a'; ctx.fillRect(MX - 2, MY - 2, 54, 1); ctx.fillRect(MX - 2, MY + 51, 54, 1); ctx.fillRect(MX - 2, MY - 2, 1, 54); ctx.fillRect(MX + 51, MY - 2, 1, 54);
  for (let i = 0; i < CG * CG; i++) if (FP.seen[i]) { ctx.fillStyle = cmap[i] === 2 ? '#c9a24a' : cmap[i] ? '#5a5468' : '#1c1924'; ctx.fillRect(MX + (i % CG) * 2, MY + (i / CG | 0) * 2, 2, 2); }
  for (const rl of HUNT.list) if (!PROG.hunt.got[rl.kind] && FP.seen[ci(rl.x | 0, rl.y | 0)] && Math.sin(time * 6) > -.3) { ctx.fillStyle = '#7fe0ff'; ctx.fillRect(MX + (rl.x | 0) * 2, MY + (rl.y | 0) * 2, 2, 2); }
  if (FP.gd < 6) { ctx.fillStyle = '#c8fff4'; ctx.fillRect(MX + (g.x | 0) * 2, MY + (g.y | 0) * 2, 2, 2); }
  for (const e of roomEnts()) if (e !== player) { ctx.fillStyle = '#e6e1d3'; ctx.fillRect(MX + (e.x / 15 | 0) * 2, MY + (e.y / 8 | 0) * 2, 2, 2); }
  ctx.fillStyle = '#ffd27a'; ctx.fillRect(MX + (px | 0) * 2, MY + (py | 0) * 2, 2, 2); ctx.fillStyle = '#fff4c8'; ctx.fillRect(Math.round(MX + px * 2 - .5 + dirX * 2.4), Math.round(MY + py * 2 - .5 + dirY * 2.4), 1, 1);
  if (fpNearExit()) { const t = txt('REMONTER', '#e9e2cc', null), w = t.width + 15, x = (W - w) >> 1, y = H - 40; ctx.fillStyle = '#05060a'; ctx.fillRect(x - 1, y - 1, w + 2, 11); ctx.fillStyle = '#1a2333'; ctx.fillRect(x, y, w, 9);
    ctx.fillStyle = '#c9a24a'; ctx.fillRect(x + 1, y + 1, 9, 7); ctx.drawImage(txt('E', '#14101c', null), x + 3, y + 1); ctx.drawImage(t, x + 12, y + 1); }
  if (FP.flash) { ctx.fillStyle = FP.flash > 0 ? `rgba(200,255,245,${FP.flash})` : `rgba(255,230,160,${-FP.flash * .5})`; ctx.fillRect(0, 0, W, H); }
}

/* ---------------- dans le Caveau : la grille des catacombes + les socles des reliques ---------------- */
{ const r = ROOMS.caveau, w = r.wall.getContext('2d'), PED = [92, 156, 228, 292, 340];
  const gate = { x1: 40, x2: 64, spring: 158, bottom: GROUND, rr: 12, floor: GROUND, label: 'Catacombes', to: 'catacombes', toX: 190, bars: true, open: 0, near: 0, col: '110,200,190', col2: '200,255,240' };
  w.fillStyle = '#2f2a3a'; archRows(36, 68, 156, GROUND, 16, (y, a, b) => w.fillRect(a, y, b - a, 1)); w.fillStyle = '#3a3646'; archRows(36, 68, 156, GROUND, 16, (y, a, b) => { w.fillRect(a, y, 1, 1); w.fillRect(b - 1, y, 1, 1); });
  r.portals.push(gate);
  for (const x of PED) { w.fillStyle = '#0e0d12'; w.fillRect(x - 6, GROUND - 17, 13, 17); w.fillStyle = '#2e2a38'; w.fillRect(x - 4, GROUND - 14, 9, 14); w.fillStyle = '#3a3646'; w.fillRect(x - 5, GROUND - 16, 11, 2); w.fillRect(x - 5, GROUND - 2, 11, 2);
    w.fillStyle = '#4a4658'; w.fillRect(x - 5, GROUND - 16, 11, 1); w.fillStyle = '#8a6a2a'; w.fillRect(x - 2, GROUND - 10, 5, 1); }
  const dyn = r.dyn, lights = r.lights;
  r.dyn = c => { dyn(c); drawPortal(c, gate);
    PED.forEach((x, i) => { const rl = RELICS[i], y = GROUND - 30 + Math.round(Math.sin(time * 2 + i) * 1.5);
      if (!PROG.relics[i]) { c.globalAlpha = .5; c.drawImage(rl.dark, x - 4, GROUND - 28); c.globalAlpha = 1; return; }
      const wd = Math.max(1, Math.round(Math.abs(Math.cos(time * 1.6 + i)) * 9)); c.drawImage(rl.spr, x - (wd >> 1), y, wd, 9);                       // tourne sur elle-même
      const ph = (time * .6 + i * .3) % 1; c.fillStyle = `rgba(${rl.glow},${1 - ph})`; c.fillRect(x + Math.round(Math.sin(i * 3 + time * 1.3) * 5), Math.round(y + 9 - ph * 16), 1, 1); }); };
  r.lights = () => { lights(); portalGlow(gate); PED.forEach((x, i) => { if (PROG.relics[i]) glow(x, GROUND - 26, 22, RELICS[i].glow, .28 + .05 * Math.sin(time * 3 + i)); }); };
  r.interacts = (r.interacts || []).concat(PED.map((x, i) => ({ x, x1: x - 8, x2: x + 8, y: GROUND, py: GROUND - 42, label: 'Socle', run: () => toast(PROG.relics[i] ? `<b>${RELICS[i].name}</b>, retrouvé dans les catacombes.` : 'Un socle vide. Il manque une relique… cherche dans les <b>catacombes</b>.') })));
}
