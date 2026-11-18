"use strict";
// « La Devanture » : la façade du cinéma — une petite grotte au flanc d'une colline moussue, à gauche de la Clairière.
// - Les portes vitrées mènent à la salle de projection (cinema.js).
// - Les 4 affiches lumineuses et le panneau « PROCHAINEMENT » sont lus depuis le serveur : GET /api/affiches
//   (fichier config/affiches.json, que l'interface d'admin modifiera plus tard). Sans serveur : AFFICHES_DEFAUT.
// - Chaque affiche : { titre, sortie, genre, resume, image, couleur, motif }.
//   image = chemin dans public/ (ex. "affiches/bal-des-ombres.png") ; sans image, une affiche pixel art est dessinée
//   avec la couleur et le motif (lune, corbeau, masque, lanterne, chateau).

const AFFICHES_DEFAUT = {
  cinema: 'CINE OSSUARY',
  bandeau: 'SEANCES TOUS LES SOIRS A MINUIT',
  affiches: [
    { titre: 'Le Bal des Ombres', sortie: '12 décembre', genre: 'Fantastique', resume: "Chaque hiver, les ombres du château dansent sans leurs propriétaires. Cette année, l'une d'elles refuse de rentrer.", couleur: '#7a1a2a', motif: 'masque' },
    { titre: 'Minuit à Valachie', sortie: '19 décembre', genre: 'Romance gothique', resume: "Un cartographe égaré, une comtesse qui ne sort qu'à la nuit tombée, et une carte qui change à chaque lune.", couleur: '#2a3a6a', motif: 'lune' },
    { titre: 'Les Corbeaux de Sel', sortie: '9 janvier', genre: 'Aventure', resume: "Sur une côte battue par la pluie, un passeur entend des corbeaux parler. Ils annoncent tous la même date.", couleur: '#1f4a44', motif: 'corbeau' },
    { titre: 'La Dernière Lanterne', sortie: '23 janvier', genre: 'Conte', resume: "Quand toutes les lanternes de la ville s'éteignent, une seule continue de brûler. Il faut la porter jusqu'au sommet.", couleur: '#6a4a14', motif: 'lanterne' },
  ],
};
const AFF = { data: AFFICHES_DEFAUT, art: [], board: null, boardKey: '', ver: 0 };

/* ---------------- chargement des affiches ---------------- */
function cleanAffiches(d) {
  const S = (v, n) => typeof v === 'string' ? v.slice(0, n) : '';
  const list = Array.isArray(d && d.affiches) ? d.affiches : [];
  return { cinema: S(d && d.cinema, 24) || AFFICHES_DEFAUT.cinema, bandeau: S(d && d.bandeau, 60),
    affiches: list.slice(0, 12).map(a => ({ titre: S(a.titre, 60) || 'Sans titre', sortie: S(a.sortie, 40), genre: S(a.genre, 40), resume: S(a.resume, 600),
      image: S(a.image, 200), couleur: /^#[0-9a-f]{6}$/i.test(a.couleur || '') ? a.couleur : '#5a1a2a', motif: S(a.motif, 20) })) };
}
function setAffiches(d) {
  AFF.data = cleanAffiches(d); AFF.ver++; AFF.board = null;
  const ver = AFF.ver;
  AFF.art = AFF.data.affiches.map((a, i) => { const art = { mini: posterArt(a), img: null };
    if (a.image) { const im = new Image(); im.onload = () => { if (AFF.ver !== ver) return; art.img = im; art.mini = posterFromImage(im); }; im.src = a.image; }
    return art; });
}
function loadAffiches() {
  if (window.NOCTURNE_OFFLINE) return;
  fetch('api/affiches', { cache: 'no-store' }).then(r => r.ok ? r.json() : null).then(d => { if (d && JSON.stringify(cleanAffiches(d)) !== JSON.stringify(AFF.data)) setAffiches(d); }).catch(() => { });
}
const shortDate = s => { const m = norm(s || '').match(/(\d{1,2})\s*(?:ER\s+)?([A-Z]{3})/); return m ? m[1] + ' ' + m[2] : norm(s || '').slice(0, 9); };

/* ---------------- affiches en pixel art (28×42) ---------------- */
const PW = 28, PH = 42;
function posterArt(a) {
  const [c, x] = mk(PW, PH), col = a.couleur;
  for (let y = 0; y < PH; y++) { x.fillStyle = shade(col, 1.25 - y / PH * .95); x.fillRect(0, y, PW, 1); }
  for (let i = 0; i < 14; i++) { x.fillStyle = 'rgba(255,240,210,.5)'; x.fillRect((i * 37) % PW, (i * 23) % 18, 1, 1); }
  const dark = '#08060c', pale = '#f2e8d0';
  const m = a.motif;
  if (m === 'lune' || !m) { x.fillStyle = pale; disc(x, 14, 13, 7); x.fillStyle = shade(col, 1.25); disc(x, 17, 11, 6);
    x.fillStyle = dark; for (const [bx, w, h] of [[2, 4, 10], [7, 3, 14], [11, 5, 8], [17, 3, 16], [21, 5, 11]]) { x.fillRect(bx, 32 - h, w, h); x.fillRect(bx + (w >> 1), 30 - h, 1, 2); } }
  else if (m === 'corbeau') { x.fillStyle = pale; disc(x, 14, 15, 9); x.fillStyle = dark;
    for (const [px2, py, w] of [[9, 14, 10], [7, 13, 3], [17, 13, 3], [5, 12, 2], [20, 12, 2], [12, 16, 4], [13, 18, 2]]) x.fillRect(px2, py, w, 1);
    x.fillRect(10, 15, 8, 2); x.fillRect(15, 12, 3, 2); x.fillStyle = '#c9a24a'; x.fillRect(18, 13, 2, 1); x.fillStyle = dark; x.fillRect(0, 28, PW, 4); }
  else if (m === 'masque') { x.fillStyle = pale; x.fillRect(7, 9, 14, 16); x.fillRect(8, 25, 12, 3); x.fillRect(10, 28, 8, 2);
    x.fillStyle = dark; x.fillRect(9, 14, 4, 2); x.fillRect(15, 14, 4, 2); x.fillRect(13, 22, 2, 1); x.fillStyle = '#c9203a'; x.fillRect(12, 26, 4, 1);
    x.fillStyle = '#c9a24a'; x.fillRect(6, 9, 16, 1); x.fillRect(5, 8, 2, 1); x.fillRect(21, 8, 2, 1); }
  else if (m === 'lanterne') { x.fillStyle = 'rgba(255,200,110,.35)'; disc(x, 14, 18, 10); x.fillStyle = dark; x.fillRect(13, 4, 2, 5); x.fillRect(9, 9, 10, 2); x.fillRect(9, 25, 10, 2);
    x.fillRect(9, 11, 1, 14); x.fillRect(18, 11, 1, 14); x.fillStyle = '#ffd88a'; x.fillRect(10, 11, 8, 14); x.fillStyle = '#fff4c8'; x.fillRect(13, 15, 2, 6); x.fillStyle = dark; x.fillRect(13, 11, 1, 14); }
  else { x.fillStyle = dark; x.fillRect(4, 18, 20, 14); x.fillRect(6, 12, 4, 6); x.fillRect(18, 12, 4, 6); x.fillRect(12, 8, 4, 10); x.fillRect(13, 5, 2, 3);
    x.fillStyle = '#ffd88a'; x.fillRect(8, 22, 1, 2); x.fillRect(19, 22, 1, 2); x.fillRect(13, 13, 2, 2); }
  // titre : quelques lignes claires (le vrai titre est sur la plaque et dans la fiche)
  x.fillStyle = 'rgba(0,0,0,.55)'; x.fillRect(0, 33, PW, 9);
  const ART = ['LE', 'LA', 'LES', "L'", 'UN', 'UNE', 'DES', 'DU', 'DE', 'A', 'AU', 'AUX', 'ET', 'THE'];
  const word = (norm(a.titre).replace(/^L'/, '').split(/\s+/).find(w => !ART.includes(w)) || norm(a.titre)).slice(0, 7);
  const t = txt(word, pale, null);
  x.drawImage(t, 0, 0, Math.min(t.width, PW + 2), 7, Math.max(-1, (PW - t.width) >> 1), 34, Math.min(t.width, PW + 2), 7);
  x.fillStyle = 'rgba(242,232,208,.5)'; x.fillRect(9, 40, 10, 1);
  return c;
}
function posterFromImage(im) { // réduction de l'image fournie (recadrage façon affiche), lissée puis ramenée à la grille de pixels
  const [c, x] = mk(PW, PH); x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high';
  const r = Math.max(PW / im.width, PH / im.height), w = im.width * r, h = im.height * r;
  x.drawImage(im, (PW - w) / 2, (PH - h) / 2, w, h); return c;
}
setAffiches(AFFICHES_DEFAUT);
loadAffiches();

/* ================= ROOM : LA DEVANTURE — la façade du cinéma : une petite grotte au flanc d'une colline moussue ================= */
// Même ciel que la Clairière (à sa droite). L'entrée de la grotte est éclairée par des lanternes ; les affiches sont clouées sur des planches.
{ const r = ROOMS.devanture = { id: 'devanture', name: 'LA DEVANTURE', right: 'remparts', fires: [], grass: [], stars: [], fogFar: null, fogNear: [178, 5, .16] };
  const POSTERS = [74, 116, 268, 310], PT = 120, LEDGE = 100, TOP = 46, DOOR = { x1: 172, x2: 212 }, SP = 150;
  const k8 = v => v < 0 ? 0 : v > 255 ? 255 : v | 0;
  const [sk, s0] = mk(W, H); r.sky = sk; s0.drawImage(NOC_PAINT.paintSky(W, H, 0, 34, 26, 124), 0, 0); r.stars = makeStars(34, 26);
  const [far, fx] = mk(W, H); r.far = far; NOC_PAINT.paintLand(fx, 0);
  const nt = makeNoise(14, 3), dome = (t, h) => Math.round(h * (1 - Math.sqrt(Math.max(0, 1 - t * t)))), hillTop = x => x < 70 ? TOP + dome((70 - x) / 78, 118) : x > 336 ? TOP + dome(Math.min(1, (x - 336) / 60), 118) : TOP - Math.round(nt(x) * .8);
  // la colline : roche rouge sombre, strates, réchauffée par les lanternes et l'entrée
  const [wl, w] = mk(W, H); r.wall = wl;
  { const img = w.createImageData(W, H), d = img.data;
    for (let x = 0; x < W; x++) { const t = hillTop(x); if (t >= GROUND) continue; for (let y = t; y < GROUND; y++) { const i = (y * W + x) * 4, n = R(), band = Math.sin(y * .6 + Math.sin(x * .06) * 3 + (x >> 4) * .8) * .5 + .5,
        warm = Math.max(0, 1 - Math.abs(x - 192) / 100) * Math.max(0, 1 - Math.abs(y - 150) / 80) + Math.max(0, 1 - Math.hypot(x - 18, y - 108) / 36) * .6 + Math.max(0, 1 - Math.hypot(x - 366, y - 108) / 36) * .6,
        k = 1 + (n - .5) * .35 + band * .22 - (y - t < 6 ? 0 : 0);
      d[i] = k8((24 + warm * 120) * k); d[i + 1] = k8((34 + warm * 50) * k); d[i + 2] = k8((32 + warm * 18) * k); d[i + 3] = 255; } }
    w.putImageData(img, 0, 0);
    for (let x = 0; x < W; x++) { const t = hillTop(x); if (t < GROUND && R() < .8) { w.fillStyle = R() < .5 ? '#3a6a3c' : '#2a4a2e'; w.fillRect(x, t, 1, 1); if (R() < .3) { w.fillStyle = '#4a8a4a'; w.fillRect(x, t - 1, 1, 1); } } }   // herbe sur la crête
    for (let k = 0; k < 16; k++) { let x = 40 + R() * 300, y = 60 + R() * 100; w.fillStyle = '#0a0305'; for (let j = 0; j < 8 + R() * 12; j++) { w.fillRect(x | 0, y | 0, 1, 1); x += R() * 2 - 1; y += R() * 1.6 + .2; } }
    for (let k = 0; k < 60; k++) { const x = R() * W | 0, y = 50 + (R() * 130 | 0); if (y > hillTop(x) + 2) { w.fillStyle = R() < .5 ? '#2e5a3c' : '#3a6a48'; w.fillRect(x, y, 2, 1); } }   // mousse
    // la corde pour monter sur la colline
    for (let y = TOP; y < GROUND; y++) { w.fillStyle = y % 3 ? '#6a5236' : '#4a3822'; w.fillRect(344, y, 1, 1); if (y % 14 === 0) { w.fillStyle = '#8a6a44'; w.fillRect(343, y, 3, 2); } }
    // l'entrée de la grotte : petite, noire, bordée de pierre, un crâne en clé de voûte
    const X1 = DOOR.x1, X2 = DOOR.x2, rr = (X2 - X1) / 2;
    archRows(X1 - 4, X2 + 4, SP, GROUND, rr + 4, (y, a, b) => { w.fillStyle = '#141a1c'; w.fillRect(a, y, b - a, 1); if (R() < .6) { w.fillStyle = '#3a4a48'; w.fillRect(a + (R() * 2 | 0), y, 2, 1); w.fillRect(b - 2 - (R() * 2 | 0), y, 2, 1); } });
    archRows(X1, X2, SP, GROUND, rr, (y, a, b) => { w.fillStyle = '#03050a'; w.fillRect(a, y, b - a, 1); });
    w.fillStyle = '#9a8a78'; w.fillRect(189, SP - rr - 7, 7, 6); w.fillRect(190, SP - rr - 1, 5, 2); w.fillStyle = '#12060a'; w.fillRect(190, SP - rr - 5, 2, 2); w.fillRect(193, SP - rr - 5, 2, 2); w.fillRect(192, SP - rr - 2, 1, 2);
    // l'enseigne : grande planche accrochée à la roche
    w.fillStyle = '#05030a'; w.fillRect(99, 51, 186, 44); w.fillStyle = '#2a160e'; w.fillRect(100, 52, 184, 42);
    for (let y = 52; y < 94; y += 7) { w.fillStyle = '#1a0e0a'; w.fillRect(100, y + 6, 184, 1); w.fillStyle = '#3a2416'; w.fillRect(100, y, 184, 1); }
    w.fillStyle = '#6a4428'; w.fillRect(100, 52, 184, 1); for (const nx of [104, 280]) for (const ny of [56, 90]) { w.fillStyle = '#05030a'; w.fillRect(nx, ny, 2, 2); w.fillStyle = '#8a8a96'; w.fillRect(nx, ny, 1, 1); }
    w.fillStyle = '#05030a'; w.fillRect(103, 72, 178, 12); w.fillStyle = '#cdbf9e'; w.fillRect(104, 73, 176, 10); w.fillStyle = '#a89a78'; w.fillRect(104, 82, 176, 1);
    for (const cx of [112, 272]) { w.fillStyle = '#3a3a48'; for (let y = 40; y < 52; y += 2) w.fillRect(cx, y, 1, 1); }
    // caissons des affiches : planches de bois clouées dans la roche
    for (const cx of POSTERS) { w.fillStyle = '#05030a'; w.fillRect(cx - 18, PT - 4, 36, 60); w.fillStyle = '#3a2416'; w.fillRect(cx - 17, PT - 3, 34, 50); w.fillStyle = '#6a4428'; w.fillRect(cx - 17, PT - 3, 34, 1);
      w.fillStyle = '#05030a'; w.fillRect(cx - 15, PT - 1, 30, 46); w.fillStyle = '#1a0e0a'; w.fillRect(cx - 17, PT + 48, 34, 8); w.fillStyle = '#8a6a2a'; w.fillRect(cx - 17, PT + 48, 34, 1);
      for (const [nx, ny] of [[-16, -2], [15, -2], [-16, 44], [15, 44]]) { w.fillStyle = '#8a8a96'; w.fillRect(cx + nx, PT + ny, 1, 1); } }
    // guichet : cabane de planches adossée à la roche
    w.fillStyle = '#05030a'; w.fillRect(137, 116, 36, 68); w.fillStyle = '#3a2416'; w.fillRect(138, 117, 34, 67);
    for (let x = 140; x < 172; x += 5) { w.fillStyle = '#1a0e0a'; w.fillRect(x, 118, 1, 66); } w.fillStyle = '#5a3a22'; w.fillRect(138, 117, 34, 1);
    w.fillStyle = '#05030a'; archRows(142, 168, 138, 158, 13, (y, a, b) => w.fillRect(a, y, b - a, 1));
    archRows(143, 167, 138, 158, 12, (y, a, b) => { w.fillStyle = y < 142 ? '#f0a050' : '#b86a30'; w.fillRect(a, y, b - a, 1); });
    w.fillStyle = '#5a3a22'; for (let x = 147; x < 166; x += 4) w.fillRect(x, 128, 1, 30); w.fillStyle = '#7a5a32'; w.fillRect(140, 158, 30, 3); w.fillStyle = '#c9a24a'; w.fillRect(140, 158, 30, 1);
    w.fillStyle = '#16121c'; w.fillRect(139, 118, 32, 8); const gu = txt('GUICHET', '#e8c860', null); w.drawImage(gu, 155 - (gu.width >> 1), 119);
  }
  // sol : herbe et terre, tapis rouge du cinéma, corniche moussue, piquets, réverbères de fer, chaudron à popcorn
  const [pl, p] = mk(W, H); r.play = pl;
  { p.fillStyle = '#122016'; p.fillRect(0, GROUND, W, H - GROUND);
    for (let k = 0; k < 560; k++) { p.fillStyle = k % 3 ? '#18301c' : '#0c160f'; p.fillRect(R() * W | 0, GROUND + 2 + (R() * (H - GROUND - 2) | 0), 1 + (R() < .35), 1); }
    for (let x = 0; x < W; x++) { p.fillStyle = '#3a6a3c'; p.fillRect(x, GROUND, 1, 1); if (R() < .35) { p.fillStyle = R() < .5 ? '#2e5a32' : '#4a8a4a'; p.fillRect(x, GROUND - 1 - (R() * 2 | 0), 1, 2); } }
    p.fillStyle = '#2a0c12'; p.fillRect(172, GROUND, 40, H - GROUND); for (let k = 0; k < 40; k++) { p.fillStyle = k % 2 ? '#5a0a12' : '#3a070c'; p.fillRect(172 + (R() * 40 | 0), GROUND + 1 + (R() * 30 | 0), 2, 1); }
    const post = x => { p.fillStyle = '#2a160e'; p.fillRect(x - 1, GROUND - 14, 3, 14); p.fillStyle = '#5a3a22'; p.fillRect(x - 1, GROUND - 14, 1, 14); p.fillStyle = '#9a8a78'; p.fillRect(x - 2, GROUND - 17, 5, 3); p.fillStyle = '#12060a'; p.fillRect(x - 1, GROUND - 16, 1, 1); p.fillRect(x + 1, GROUND - 16, 1, 1); };
    for (const [a, b] of [[148, 166], [218, 236]]) { if (a === 148) { post(a); post(b); } if (a === 148) { p.fillStyle = '#7a1a1c'; for (let x = a + 1; x < b; x++) { const t = (x - a) / (b - a); p.fillRect(x, GROUND - 12 + Math.round(Math.sin(t * Math.PI) * 4), 1, 2); } } }
    // corniche rocheuse (on peut y marcher) : dessous déchiqueté, stalactites
    { const nn = makeNoise(6, 4); for (let x = 46; x < 338; x++) { const e = (x < 62 ? (62 - x) * .4 : x > 322 ? (x - 322) * .4 : 0), h = 6 + Math.round(nn(x)) - Math.round(e); if (h < 1) continue; p.fillStyle = '#141c1a'; p.fillRect(x, LEDGE, 1, h); p.fillStyle = '#3a5a3e'; p.fillRect(x, LEDGE, 1, 1); } }
    for (const sx of [70, 124, 206, 262, 322]) for (let i = 0; i < 5; i++) { p.fillStyle = i % 2 ? '#24472c' : '#141c1a'; p.fillRect(sx + i, LEDGE + 6, 1, 5 - Math.abs(2 - i) * 2 + 1); }
    // réverbères de fer
    for (const lx of [18, 366]) { p.fillStyle = '#100a0e'; p.fillRect(lx - 1, 112, 3, GROUND - 112); p.fillRect(lx - 3, GROUND - 6, 7, 6); p.fillStyle = '#3a2e32'; p.fillRect(lx - 1, 112, 1, GROUND - 112);
      p.fillStyle = '#100a0e'; p.fillRect(lx - 5, 102, 11, 2); p.fillRect(lx - 4, 104, 1, 9); p.fillRect(lx + 4, 104, 1, 9); p.fillRect(lx - 4, 112, 9, 1); p.fillRect(lx - 2, 99, 5, 3);
      p.fillStyle = 'rgba(255,150,70,.55)'; p.fillRect(lx - 3, 104, 7, 8); r.fires.push(fire(lx, 109, 0)); }
    // chaudron à popcorn sur son trépied de fer, braise dessous
    p.fillStyle = '#100a0e'; for (const [a, b] of [[220, 226], [242, 236]]) for (let i = 0; i < 20; i++) p.fillRect(Math.round(a + (b - a) * i / 20), 164 + i, 1, 1);
    p.fillStyle = '#100a0e'; p.fillRect(222, 178, 18, 6); disc(p, 231, 156, 11); p.fillStyle = '#2a2428'; disc(p, 231, 155, 9); p.fillStyle = '#3a2e32'; p.fillRect(223, 148, 16, 1); p.fillStyle = '#100a0e'; p.fillRect(219, 146, 24, 3);
    p.fillStyle = '#ffe08a'; for (let k = 0; k < 30; k++) p.fillRect(222 + (R() * 18 | 0), 143 + (R() * 5 | 0), 2, 1); p.fillStyle = '#fff2c0'; for (let k = 0; k < 8; k++) p.fillRect(222 + (R() * 18 | 0), 143 + (R() * 4 | 0), 1, 1);
    const pop = txt('POP', '#e8c860', null); p.drawImage(pop, 231 - (pop.width >> 1), 153);
    r.fires.push(fire(231, 183, 0));
    // rochers
    for (const [x, ww, hh] of [[30, 9, 6], [52, 6, 4], [330, 8, 5], [356, 7, 4]]) { p.fillStyle = '#0e0407'; p.fillRect(x, GROUND - hh, ww, hh); p.fillStyle = '#4a1c1e'; p.fillRect(x, GROUND - hh, ww - 1, 1); }
  }
  r.plats = [{ x1: 46, x2: 338, y: LEDGE }, { x1: 70, x2: 346, y: TOP }, { x1: 12, x2: 25, y: 102 }, { x1: 360, x2: 373, y: 102 }];
  r.climbs = [{ x1: 340, x2: 348, y1: TOP, y2: 184, kind: 'corde' }, { x1: 15, x2: 22, y1: 102, y2: 184, kind: 'réverbère' }, { x1: 362, x2: 370, y1: 102, y2: 184, kind: 'réverbère' }];
  r.portals = [{ x1: DOOR.x1, x2: DOOR.x2, spring: SP, bottom: GROUND, rr: (DOOR.x2 - DOOR.x1) / 2, floor: GROUND, label: 'Entrer au cinéma', to: 'cinema', toX: 20, bars: false, open: 0, near: 0, col: '255,110,60', col2: '255,200,150' }];
  // interactions : affiches, guichet (programme), popcorn
  r.interacts = [
    ...POSTERS.map((cx, i) => ({ x: cx, x1: cx - 14, x2: cx + 14, y: GROUND, py: PT - 16, get label() { return AFF.data.affiches[i] ? "Voir l'affiche" : 'Affiche vide'; }, run: () => { if (AFF.data.affiches[i]) openAffiche(i); } })),
    { x: 155, x1: 142, x2: 168, y: GROUND, py: 104, label: 'Programme', run: () => openAffiche(-1) },
    { x: 231, x1: 220, x2: 242, y: GROUND, py: 120, label: 'Popcorn', run: () => { puff(231, 140, 10, '#ffe08a', .8); if (SND.ctx) for (let i = 0; i < 6; i++) noise(.02, { f: 2400, q: 3, v: .05, when: i * .07 + Math.random() * .04 }); toast('Un cornet de popcorn tout chaud. <i>Miam.</i>'); } },
  ];
  r.dyn = c => {
    // enseigne (une lettre grésille de temps en temps)
    const name = norm(AFF.data.cinema), t = txt(name, '#ffd890', null), sw = t.width * 2, sx = 192 - (sw >> 1);
    c.drawImage(t, sx, 56, sw, 14);
    if (Math.sin(time * 1.7) > .93 && Math.sin(time * 41) > 0) { const k = name.length - 2; c.drawImage(txt(name[k], '#5a3a18', null), 0, 0, 5, 7, sx + 8 * k, 56, 10, 14); }
    // bougies aux coins de l'enseigne
    for (const cx of [104, 280]) { const f = Math.sin(time * 13 + cx) > -.3 ? 3 : 2; c.fillStyle = '#e8dcae'; c.fillRect(cx, 48, 2, 3); c.fillStyle = '#ffb040'; c.fillRect(cx, 48 - f, 2, f); c.fillStyle = '#fff2b0'; c.fillRect(cx, 48 - f + 1, 1, 1); }
    // le panneau défile les prochaines sorties
    const key = AFF.ver + '';
    if (AFF.boardKey !== key || !AFF.board) { AFF.boardKey = key;
      const s = 'PROCHAINEMENT   *   ' + (AFF.data.affiches.map(a => norm(a.titre) + (a.sortie ? ' - ' + norm(a.sortie) : '')).join('   *   ') || 'BIENTOT DE NOUVEAUX FILMS');
      AFF.board = txt(s + '   *   ', '#14101c', null); }
    const bw = AFF.board.width, off = Math.floor(time * 16) % bw;
    c.save(); c.beginPath(); c.rect(105, 73, 174, 10); c.clip();
    for (let x = 105 - off; x < 279; x += bw) c.drawImage(AFF.board, x, 74);
    c.restore();
    const bd = txt(norm(AFF.data.bandeau || ''), '#e8c860', null); c.drawImage(bd, 192 - (bd.width >> 1), 86);
    // affiches
    POSTERS.forEach((cx, i) => { const a = AFF.data.affiches[i], art = AFF.art[i];
      if (art) c.drawImage(art.mini, cx - 14, PT); else { c.fillStyle = '#1a1622'; c.fillRect(cx - 14, PT, PW, PH); }
      c.fillStyle = 'rgba(255,255,255,.07)'; c.fillRect(cx - 14, PT, 3, PH);
      if (a) { const d = txt(shortDate(a.sortie), '#e8c860', null); c.drawImage(d, cx - (d.width >> 1), PT + 49); } });
    // popcorn qui saute
    for (let i = 0; i < 5; i++) { const ph = (time * 1.7 + i * .37) % 1, x = 223 + ((i * 47) % 16), y = 143 - Math.round(Math.sin(ph * Math.PI) * 12);
      c.fillStyle = '#fff2c0'; c.fillRect(x, y, 2, 1); c.fillRect(x, y + 1, 1, 1); }
    // braises qui s'échappent de l'entrée
    for (let i = 0; i < 6; i++) { const ph = (time * .5 + i * .31) % 1; c.fillStyle = `rgba(255,${120 + i * 15},60,${.7 * (1 - ph)})`; c.fillRect(Math.round(180 + i * 5 + Math.sin(time * 2 + i * 3) * 3), Math.round(GROUND - 6 - ph * 50), 1, 1); }
    drawPortal(c, r.portals[0]);
  };
  r.lights = () => {
    glow(192, 160, 70, '255,110,50', .22 + .03 * Math.sin(time * 5)); portalGlow(r.portals[0]);
    for (const cx of [104, 280]) glow(cx, 48, 26, '255,190,100', .16);
    for (const cx of POSTERS) glow(cx, PT + 20, 28, '255,200,150', .16);
    for (const lx of [18, 366]) glow(lx, 108, 34, '255,150,70', .26 + .03 * Math.sin(time * 9 + lx));
    glow(231, 160, 30, '255,150,60', .22); glow(155, 146, 22, '255,150,80', .16);
  };
  r.update = dt => { r.pollT = (r.pollT || 0) - dt; if (r.pollT <= 0) { r.pollT = 60; loadAffiches(); } };
}

/* ---------------- fenêtre : fiche d'une affiche / programme ---------------- */
document.getElementById('view').insertAdjacentHTML('beforeend', `
  <div id="affM" class="modal"><div class="panel affP">
    <div class="shopHead"><h2 id="affH">Prochaines sorties</h2><button class="x" id="affX">✕</button></div>
    <div id="affBody"></div>
  </div></div>`);
function openAffiche(i) {
  const list = AFF.data.affiches, b = document.getElementById('affBody'), esc = s => String(s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
  if (i < 0) { document.getElementById('affH').textContent = 'Prochaines sorties';
    b.innerHTML = list.length ? `<div class="affList">${list.map((a, k) => `<button class="affItem" data-k="${k}"><span class="affThumb"></span><span><b>${esc(a.titre)}</b><small>${esc(a.genre)}</small></span><em>${esc(a.sortie)}</em></button>`).join('')}</div>`
      : '<p class="affNone">Aucune sortie annoncée pour le moment.</p>';
    b.querySelectorAll('.affItem').forEach(el => { const k = +el.dataset.k, art = AFF.art[k];
      el.querySelector('.affThumb').append(art.img ? Object.assign(new Image(), { src: art.img.src }) : scaled(art.mini, 2)); el.onclick = () => openAffiche(k); });
  } else { const a = list[i], art = AFF.art[i]; document.getElementById('affH').textContent = 'À l\'affiche bientôt';
    b.innerHTML = `<div class="affOne"><div class="affBig"></div><div class="affTxt"><h3>${esc(a.titre)}</h3>
      <p class="affMeta">${a.genre ? esc(a.genre) + ' · ' : ''}${a.sortie ? 'Sortie le <b>' + esc(a.sortie) + '</b>' : 'Date à venir'}</p>
      <p>${esc(a.resume || '')}</p></div></div>
      <div class="affNav"><button class="btn" id="affPrev">◀</button><button class="btn" id="affAll">Tout le programme</button><button class="btn" id="affNext">▶</button></div>`;
    b.querySelector('.affBig').append(art.img ? Object.assign(new Image(), { src: art.img.src }) : scaled(art.mini, 6));
    const n = list.length; document.getElementById('affPrev').onclick = () => openAffiche((i + n - 1) % n);
    document.getElementById('affNext').onclick = () => openAffiche((i + 1) % n); document.getElementById('affAll').onclick = () => openAffiche(-1); }
  openModal('affM');
}
function scaled(src, k) { const [c, x] = mk(src.width * k, src.height * k); x.drawImage(src, 0, 0, c.width, c.height); return c; }
document.getElementById('affX').onclick = () => closeModal('affM');
document.getElementById('affM').addEventListener('mousedown', ev => { if (ev.target.id === 'affM') closeModal('affM'); });
