"use strict";
// « Le Cinéma en plein air » : une clairière de la forêt, à gauche de la Clairière des Lucioles.
// - La toile est tendue entre deux arbres ; leurs racines grimpent le long des bords de l'écran.
// - Le cinéma projette un vrai fichier vidéo : par défaut public/films/film.mp4 (voir public/films/LISEZ-MOI.txt),
//   ou un fichier choisi sur ton ordinateur depuis la cabine de projection (le projecteur, sur sa souche).
// - Lancer / mettre en pause / avancer est synchronisé avec les autres joueurs (s'ils ont le même fichier).
// - Sous-titres .srt ou .vtt : public/films/film.srt (ou .vtt), ou choisis depuis la cabine.
// - On s'assoit sur le grand tronc couché (2e rang) ou sur les plaids dans l'herbe (1er rang).
// - L'écran est un « trou » dans le canvas du jeu : la vidéo est derrière, les personnages peuvent passer devant.
// - Le panneau d'affiches (à gauche) montre les prochaines sorties : voir affiches.js et config/affiches.json.

const FILM_FILE = 'films/film.mp4';
const SUBS_FILES = ['films/film.vtt', 'films/film.srt'];   // sous-titres chargés automatiquement s'ils existent
const SCREEN = { x: 112, y: 30, w: 160, h: 90 };

/* ================= ROOM : LE CINÉMA EN PLEIN AIR ================= */
{ const r = ROOMS.cinema = { id: 'cinema', name: 'LE CINEMA EN PLEIN AIR', right: 'remparts', fires: [], grass: [], climbs: [], fogFar: null, fogNear: [176, 4, .1], far: null, hole: SCREEN };
  const S = SCREEN, SX2 = S.x + S.w, SY2 = S.y + S.h, MX = 40, MY = 26;
  const POSTERS = [25, 57], PT = 110, POP = 316, FLEURS = ['#f08aa8', '#f0d060', '#e8e4d0', '#9ab8f0'];
  // le ciel et la forêt au loin (dans le même calque que le ciel, pour que le trou de l'écran reste net)
  const [sk, s] = mk(W, H); r.sky = sk; r.stars = makeStars(MX, MY);
  s.drawImage(NOC_PAINT.paintSky(W, H, 0, MX, MY, 140), 0, 0); NOC_PAINT.paintLand(s, 30);

  /* ---------- les deux arbres, la toile tendue entre eux ---------- */
  const [wl, w] = mk(W, H); r.wall = wl;
  { for (const [x, y, rr, n] of [[93, -2, 30, 18], [291, -2, 30, 18], [150, -12, 32, 16], [234, -12, 32, 16], [192, -18, 30, 12], [60, 20, 22, 10], [326, 22, 22, 10]]) NOC_PAINT.feuillage(w, x, y, rr, n);
    const tronc = (x, wd) => { for (let i = 0; i < wd; i++) for (let y = 0; y < GROUND; y++) { w.fillStyle = i < 2 ? '#6a4a30' : i >= wd - 2 ? '#140d08' : (i * 7 + (y >> 2)) % 9 === 0 || R() < .08 ? '#2a1c12' : '#3a2818'; w.fillRect(x + i, y, 1, 1); }
      w.fillStyle = '#2c2016'; w.fillRect(x - 4, GROUND - 5, wd + 8, 5); w.fillStyle = '#4e3a2a'; w.fillRect(x - 4, GROUND - 5, 3, 1); };
    tronc(86, 14); tronc(284, 14);
    // la toile : un drap crème, un peu froissé, attaché aux troncs par des cordes
    const cl = { x: S.x - 6, y: S.y - 5, w: S.w + 12, h: S.h + 10 };
    for (const [ax, ay, bx, by] of [[99, 22, cl.x, cl.y + 1], [99, 128, cl.x, cl.y + cl.h - 2], [285, 22, cl.x + cl.w - 1, cl.y + 1], [285, 128, cl.x + cl.w - 1, cl.y + cl.h - 2]]) {
      w.fillStyle = '#8a7050'; const n = 30; for (let t = 0; t <= n; t++) w.fillRect(Math.round(ax + (bx - ax) * t / n), Math.round(ay + (by - ay) * t / n + Math.sin(t / n * Math.PI) * 2), 1, 1); }
    w.fillStyle = '#05030a'; w.fillRect(cl.x - 1, cl.y - 1, cl.w + 2, cl.h + 2);
    for (let x = 0; x < cl.w; x++) for (let y = 0; y < cl.h; y++) { const edge = x < 2 || x > cl.w - 3 || y < 2 || y > cl.h - 3; w.fillStyle = edge ? '#a89a7a' : (x % 11 < 2 ? '#d4c8ac' : '#e2d8bc'); w.fillRect(cl.x + x, cl.y + y, 1, 1); }
    w.fillStyle = '#05030a'; w.fillRect(S.x - 1, S.y - 1, S.w + 2, S.h + 2);
    w.clearRect(S.x, S.y, S.w, S.h);                       // le trou : la vidéo est derrière le canvas
  }

  /* ---------- les racines qui grimpent sur les bords de l'écran (devant la vidéo, derrière les personnages) ---------- */
  const [rcv, rc] = mk(W, H);
  { const racine = (pts, wd, seed) => { for (let k = 0; k < pts.length - 1; k++) { const [x1, y1] = pts[k], [x2, y2] = pts[k + 1], n = Math.ceil(Math.hypot(x2 - x1, y2 - y1));
        for (let i = 0; i <= n; i++) { const t = i / n, x = x1 + (x2 - x1) * t + Math.sin((k + t) * 2.3 + seed) * 1.2, y = y1 + (y2 - y1) * t, ww = Math.max(1, Math.round(wd * (1 - (k + t) / pts.length * .7)));
          rc.fillStyle = '#140d08'; rc.fillRect(Math.round(x) - 1, Math.round(y), ww + 2, 1); rc.fillStyle = '#3a2818'; rc.fillRect(Math.round(x), Math.round(y), ww, 1); rc.fillStyle = '#6a4a30'; rc.fillRect(Math.round(x), Math.round(y), 1, 1); } } };
    const feuilles = (x, y) => { rc.fillStyle = '#21452a'; rc.fillRect(x, y, 2, 1); rc.fillRect(x + 1, y - 1, 1, 1); rc.fillStyle = '#3a6a48'; rc.fillRect(x, y, 1, 1); };
    const G = [[100, GROUND], [104, 160], [107, 132], [109, 104], [108, 76], [110, 50], [114, 30], [126, 25], [142, 24]];
    const D = G.map(([x, y]) => [384 - x, y]);
    racine(G, 7, 0); racine(D, 7, 1.7);
    racine([[96, 160], [102, 132], [106, 112], [114, 98], [117, 82], [114, 70]], 3, 3); racine([[288, 160], [282, 132], [278, 112], [270, 98], [267, 82], [270, 70]], 3, 4);   // vrilles qui s'enroulent sur l'image
    racine([[102, 130], [112, 123], [124, 121], [138, 124]], 3, 5); racine([[282, 130], [272, 123], [260, 121], [246, 124]], 3, 6);                 // le long du bas de l'écran
    racine([[110, 44], [116, 40], [120, 33]], 1, 7); racine([[274, 44], [268, 40], [264, 33]], 1, 8); racine([[150, 25], [160, 27], [168, 26]], 1, 9); racine([[234, 25], [224, 27], [216, 26]], 1, 10);
    for (const [x, y] of [[105, 150], [108, 118], [110, 92], [108, 64], [118, 30], [134, 24], [278, 150], [275, 118], [273, 92], [275, 64], [265, 30], [250, 24], [116, 85], [268, 85], [126, 122], [258, 122]]) feuilles(x, y);
    // champignons bleus luminescents sur les racines
    for (const [x, y] of [[104, 140], [110, 70], [279, 140], [273, 70], [130, 121]]) { rc.fillStyle = '#c8d8e0'; rc.fillRect(x, y, 1, 2); rc.fillStyle = '#5ac8e8'; rc.fillRect(x - 1, y - 1, 3, 1); rc.fillStyle = '#bff0ff'; rc.fillRect(x, y - 1, 1, 1); }
  }

  /* ---------- le sol, le gradin (un grand tronc couché), le panneau d'affiches, le chaudron à popcorn ---------- */
  const [pl, px] = mk(W, H); r.play = pl;
  r.plats = [{ x1: 116, x2: 300, y: 166 }];
  { px.fillStyle = '#122016'; px.fillRect(0, GROUND, W, H - GROUND);
    for (let k = 0; k < 520; k++) { px.fillStyle = ['#18301c', '#0c160f', '#1e3622'][k % 3]; px.fillRect(R() * W | 0, GROUND + 2 + (R() * 30 | 0), 2 + (R() * 3 | 0), 1); }
    for (let k = 0; k < 160; k++) { const x = 110 + (R() * 200 | 0), y = GROUND + 2 + (R() * 28 | 0); px.fillStyle = k % 2 ? '#2a2016' : '#1e1810'; px.fillRect(x, y, 2, 1); }   // terre tassée devant l'écran
    px.fillStyle = '#3a6a3c'; px.fillRect(0, GROUND, W, 1); px.fillStyle = '#0a140c'; px.fillRect(0, GROUND + 1, W, 1);
    for (let x = 0; x < W; x += 2) { const h = R() * 3 | 0; if (h && (x < 110 || x > 300)) { px.fillStyle = R() < .5 ? '#2e5a32' : '#4a8a4a'; px.fillRect(x, GROUND - h, 1, h); } }
    for (let k = 0; k < 14; k++) { const x = 4 + (R() * (W - 8) | 0); if (x > 104 && x < 304) continue; const y = GROUND + 4 + (R() * 24 | 0), col = FLEURS[k % FLEURS.length];
      px.fillStyle = '#2e5a32'; px.fillRect(x, y + 1, 1, 2); px.fillStyle = col; px.fillRect(x - 1, y, 3, 1); px.fillRect(x, y - 1, 1, 3); px.fillStyle = '#fff4b0'; px.fillRect(x, y, 1, 1); }
    // le gradin : un grand tronc couché, écorce et cernes aux deux bouts
    px.fillStyle = '#140d08'; px.fillRect(114, 165, 188, GROUND - 165);
    for (let y = 166; y < GROUND; y++) { const t = (y - 166) / (GROUND - 166); px.fillStyle = t < .15 ? '#6a4a30' : t > .8 ? '#24180f' : '#3a2818'; px.fillRect(116, y, 184, 1); }
    for (let x = 118; x < 298; x += 6 + (R() * 5 | 0)) { px.fillStyle = '#24180f'; px.fillRect(x, 169 + (R() * 3 | 0), 1, 8 + (R() * 6 | 0)); }
    for (let k = 0; k < 30; k++) { px.fillStyle = R() < .5 ? '#2e5a3c' : '#3a6a48'; px.fillRect(118 + (R() * 180 | 0), 166, 2 + (R() * 3 | 0), 1); }   // mousse sur le dessus
    for (const cx of [116, 300]) { px.fillStyle = '#140d08'; disc(px, cx, 175, 9); px.fillStyle = '#8a6a44'; disc(px, cx, 175, 8); px.fillStyle = '#6a4a30'; disc(px, cx, 175, 6); px.fillStyle = '#8a6a44'; disc(px, cx, 175, 4); px.fillStyle = '#5a3c26'; disc(px, cx, 175, 2); }
    // premier rang : des plaids et des coussins posés dans l'herbe
    for (let i = 0; i < 7; i++) { const x = 124 + i * 24, col = ['#a83a3a', '#3a6aa8', '#c89a3a', '#5a8a4a', '#8a4aa8', '#3a9a90', '#c8603a'][i];
      px.fillStyle = '#0a0806'; px.fillRect(x - 9, GROUND, 19, 5); px.fillStyle = col; px.fillRect(x - 8, GROUND + 1, 17, 3);
      px.fillStyle = shade(col, 1.35); for (let k = 0; k < 17; k += 4) px.fillRect(x - 8 + k, GROUND + 1, 2, 1); px.fillStyle = shade(col, .65); px.fillRect(x - 8, GROUND + 3, 17, 1); }
    // le panneau d'affiches, sur deux poteaux
    px.fillStyle = '#2a1a10'; px.fillRect(10, 96, 3, GROUND - 96); px.fillRect(69, 96, 3, GROUND - 96);
    px.fillStyle = '#05060a'; px.fillRect(6, 104, 70, 56); px.fillStyle = '#4a2c1a'; px.fillRect(7, 105, 68, 54); px.fillStyle = '#6a4228'; px.fillRect(7, 105, 68, 1);
    for (let y = 111; y < 159; y += 8) { px.fillStyle = '#3a2214'; px.fillRect(7, y, 68, 1); }
    px.fillStyle = '#05060a'; px.fillRect(4, 93, 74, 11); px.fillStyle = '#5a3a22'; px.fillRect(5, 94, 72, 9); px.fillStyle = '#7a5232'; px.fillRect(5, 94, 72, 1);
    const pr = txt('PROCHAINEMENT', '#e8c860', null); px.drawImage(pr, 41 - (pr.width >> 1), 96);
    for (const cx of POSTERS) { px.fillStyle = '#05030a'; px.fillRect(cx - 15, PT - 1, 30, 44); }
    // le chaudron à popcorn sur son trépied
    px.fillStyle = '#16161c'; for (const [a, b] of [[POP - 11, POP - 5], [POP + 11, POP + 5]]) for (let i = 0; i < 20; i++) px.fillRect(Math.round(a + (b - a) * i / 20), 164 + i, 1, 1);
    px.fillStyle = '#16161c'; px.fillRect(POP - 9, 178, 18, 6); disc(px, POP, 156, 11); px.fillStyle = '#2a2a32'; disc(px, POP, 155, 9); px.fillStyle = '#3a3a44'; px.fillRect(POP - 8, 148, 16, 1); px.fillStyle = '#16161c'; px.fillRect(POP - 12, 146, 24, 3);
    px.fillStyle = '#ffe08a'; for (let k = 0; k < 30; k++) px.fillRect(POP - 9 + (R() * 18 | 0), 143 + (R() * 5 | 0), 2, 1); px.fillStyle = '#fff2c0'; for (let k = 0; k < 8; k++) px.fillRect(POP - 9 + (R() * 18 | 0), 143 + (R() * 4 | 0), 1, 1);
    const pop = txt('POP', '#e8c860', null); px.drawImage(pop, POP - (pop.width >> 1), 153);
    r.fires.push(fire(POP, 183, 0));
  }
  for (let x = 3; x < W; x += 6 + (R() * 6 | 0)) { if (x > 104 && x < 306) continue; r.grass.push({ x, y: GROUND, h: 2 + (R() * 3 | 0), ph: R() * 6.28 }); }
  r.seats = [];
  for (let i = 0; i < 7; i++) r.seats.push({ x: 136 + i * 24, y: 166 });
  for (let i = 0; i < 7; i++) r.seats.push({ x: 124 + i * 24, y: GROUND });
  r.desk = { x: 352, y: GROUND };
  r.interacts = [
    ...POSTERS.map((cx, i) => ({ x: cx + 1, x1: cx - 13, x2: cx + 14, y: GROUND, py: PT - 22, get label() { return AFF.data.affiches[i] ? "Voir l'affiche" : 'Affiche vide'; }, run: () => { if (AFF.data.affiches[i]) openAffiche(i); } })),
    { x: 41, x1: 30, x2: 52, y: GROUND, py: 80, label: 'Programme', run: () => openAffiche(-1) },
    { x: POP, x1: POP - 11, x2: POP + 11, y: GROUND, py: 120, label: 'Popcorn', run: () => { puff(POP, 140, 10, '#ffe08a', .8); if (SND.ctx) for (let i = 0; i < 6; i++) noise(.02, { f: 2400, q: 3, v: .05, when: i * .07 + Math.random() * .04 }); toast('Un cornet de popcorn tout chaud. <i>Miam.</i>'); } },
  ];
  r.critters = [makeMoths('cinema', [[20, 66], [372, 70], [POP, 146]]), makeCat('cinema', '#2a2832', [{ x: 150, y: 166 }, { x: 262, y: 166 }, { x: 60, y: 184 }])];
  // guirlandes d'ampoules (façon guinguette), d'un arbre à l'autre
  const GUIRL = [[0, 66, 88, 52, 8], [298, 52, 384, 70, 8], [76, 94, 88, 80, 3]];
  const ampoules = c => { for (const [x1, y1, x2, y2, sag] of GUIRL) { const pt = u => [x1 + (x2 - x1) * u, y1 + (y2 - y1) * u + 4 * u * (1 - u) * sag], len = Math.hypot(x2 - x1, y2 - y1);
      c.fillStyle = '#2a2018'; for (let k = 0; k <= len; k++) { const [x, y] = pt(k / len); c.fillRect(Math.round(x), Math.round(y), 1, 1); }
      for (let i = 1; i < Math.floor(len / 9); i++) { const [x, y] = pt(i / Math.floor(len / 9)); c.fillStyle = '#2a2018'; c.fillRect(Math.round(x), Math.round(y) + 1, 1, 1);
        c.fillStyle = Math.sin(time * 2 + i * 1.3) > .92 ? '#c09040' : '#ffd890'; c.fillRect(Math.round(x) - 1, Math.round(y) + 2, 2, 2); } } };
  const bulbes = () => { const out = []; for (const [x1, y1, x2, y2, sag] of GUIRL) { const len = Math.hypot(x2 - x1, y2 - y1), n = Math.floor(len / 9); for (let i = 1; i < n; i++) { const u = i / n; out.push([x1 + (x2 - x1) * u, y1 + (y2 - y1) * u + 4 * u * (1 - u) * sag + 3]); } } return out; };
  const BULBES = bulbes();
  // ce qui est devant la vidéo : l'écran « en attente » quand aucun film ne passe, puis les racines par-dessus
  r.rays = c => {
    if (!FILM.visible) { c.fillStyle = '#e2d8bc'; c.fillRect(S.x, S.y, S.w, S.h); c.fillStyle = '#d4c8ac'; for (let y = S.y; y < SY2; y += 3) c.fillRect(S.x, y, S.w, 1);
      const m1 = txt(FILM.ok ? 'PROJECTION PRETE' : 'AUCUN FILM', '#2a2a1a', null), m2 = txt(FILM.ok ? 'VA AU PROJECTEUR (E)' : 'DEPOSE PUBLIC/FILMS/FILM.MP4', '#5a5a4a', null);
      c.drawImage(m1, S.x + (S.w - m1.width >> 1), S.y + 36); c.drawImage(m2, S.x + (S.w - m2.width >> 1), S.y + 45); }
    c.drawImage(rcv, 0, 0);
  };
  r.dyn = c => {
    // l'enseigne suspendue sous les branches
    { const name = norm(AFF.data.cinema), t = txt(name, '#ffd890', null), wd = t.width + 10, x0 = 192 - (wd >> 1);
      c.fillStyle = '#8a7050'; c.fillRect(x0 + 6, 2, 1, 9); c.fillRect(x0 + wd - 7, 2, 1, 9);
      c.fillStyle = '#05030a'; c.fillRect(x0 - 1, 10, wd + 2, 12); c.fillStyle = '#4a2c1a'; c.fillRect(x0, 11, wd, 10); c.fillStyle = '#6a4228'; c.fillRect(x0, 11, wd, 1);
      c.drawImage(t, x0 + 5, 13); }
    // les affiches du panneau
    POSTERS.forEach((cx, i) => { const a = AFF.data.affiches[i], art = AFF.art[i];
      if (art) c.drawImage(art.mini, cx - 14, PT); else { c.fillStyle = '#1a1622'; c.fillRect(cx - 14, PT, 28, 42); }
      c.fillStyle = 'rgba(255,255,255,.07)'; c.fillRect(cx - 14, PT, 3, 42);
      if (a) { const d = txt(shortDate(a.sortie), '#e8c860', null); c.drawImage(d, cx - (d.width >> 1), PT + 44); } });
    // la souche du projecteur et le projecteur de cuivre
    const d = r.desk;
    c.fillStyle = '#140d08'; c.fillRect(d.x - 11, d.y - 17, 22, 17); c.fillStyle = '#3a2818'; c.fillRect(d.x - 10, d.y - 16, 20, 16); c.fillStyle = '#6a4a30'; c.fillRect(d.x - 10, d.y - 16, 2, 16);
    c.fillStyle = '#8a6a44'; c.fillRect(d.x - 10, d.y - 17, 20, 2); c.fillStyle = '#5a3c26'; c.fillRect(d.x - 5, d.y - 17, 10, 1); c.fillStyle = '#24180f'; c.fillRect(d.x + 3, d.y - 13, 1, 9);
    c.fillStyle = '#05030a'; c.fillRect(d.x - 9, d.y - 25, 14, 9); c.fillStyle = '#8a5a2a'; c.fillRect(d.x - 8, d.y - 24, 12, 7); c.fillStyle = '#c98a3a'; c.fillRect(d.x - 8, d.y - 24, 12, 2);
    c.fillStyle = '#05030a'; disc(c, d.x - 5, d.y - 29, 3); disc(c, d.x + 3, d.y - 29, 3); c.fillStyle = '#8a5a2a'; disc(c, d.x - 5, d.y - 29, 2); disc(c, d.x + 3, d.y - 29, 2);   // les bobines
    c.fillStyle = '#05030a'; c.fillRect(d.x - 13, d.y - 23, 5, 5); c.fillStyle = FILM.playing ? '#ffe9b0' : '#7a6a58'; c.fillRect(d.x - 12, d.y - 22, 3, 3);
    c.fillStyle = FILM.playing ? '#60ff90' : '#ff5050'; c.fillRect(d.x + 1, d.y - 21, 2, 2);
    // où on en est : barre sous la toile
    if (FILM.ok && filmEl.duration) { const p = clamp(filmEl.currentTime / filmEl.duration, 0, 1), y = SY2 + 12;
      const t = txt(`${fmtTime(filmEl.currentTime)} / ${fmtTime(filmEl.duration)}`, '#e8c860', '#05030a'), bw = S.w - t.width - 6;
      c.fillStyle = '#05030a'; c.fillRect(S.x - 1, y - 1, bw + 2, 4); c.fillStyle = '#3a2a10'; c.fillRect(S.x, y, bw, 2);
      c.fillStyle = '#c9a24a'; c.fillRect(S.x, y, Math.round(bw * p), 2); c.fillStyle = '#ffe8a0'; c.fillRect(S.x + Math.round(bw * p) - 1, y - 1, 2, 4);
      c.drawImage(t, SX2 - t.width, y - 3); }
    // popcorn qui saute, ampoules, lucioles
    for (let i = 0; i < 5; i++) { const ph = (time * 1.7 + i * .37) % 1, x = POP - 8 + ((i * 47) % 16), y = 143 - Math.round(Math.sin(ph * Math.PI) * 12); c.fillStyle = '#fff2c0'; c.fillRect(x, y, 2, 1); c.fillRect(x, y + 1, 1, 1); }
    ampoules(c);
    for (let i = 0; i < 14; i++) { const l = NOC_LUCIOLE(i + 50); if (l.a < .05 || (l.x > S.x - 2 && l.x < SX2 + 2 && l.y > S.y - 2 && l.y < SY2 + 2)) continue; c.fillStyle = `rgba(220,255,140,${l.a})`; c.fillRect(Math.round(l.x), Math.round(l.y), 1, 1); }
  };
  r.front = c => {
    const col = FILM.playing ? FILM.avg : [200, 205, 220], a = FILM.playing ? .07 + .02 * Math.sin(time * 25) : .025, bx = r.desk.x - 13, by = r.desk.y - 21;
    c.globalCompositeOperation = 'lighter'; c.fillStyle = `rgba(${col[0]},${col[1]},${col[2]},${a})`;
    c.beginPath(); c.moveTo(bx, by); c.lineTo(bx, by + 3); c.lineTo(SX2, SY2); c.lineTo(SX2, S.y); c.fill();
    for (let i = 0; i < 16; i++) { const t = ((time * .05 + i * .137) % 1), x = bx - t * (bx - SX2), y = by + (Math.sin(i * 7.3 + time * .5) * .5) * t * 70 - t * 45;
      c.fillStyle = `rgba(255,250,230,${.25 * (FILM.playing ? 1.5 : .6)})`; c.fillRect(Math.round(x), Math.round(y), 1, 1); }
    c.globalCompositeOperation = 'source-over'; };
  r.lights = () => { const dim = FILM.playing ? .35 : 1;
    glow(MX, MY, 60, '190,215,255', .08 * dim);
    for (const [x, y] of BULBES) glow(x, y, 12, '255,200,120', .14 * dim);
    for (const cx of POSTERS) glow(cx, PT + 20, 26, '255,210,160', .1 * dim);
    glow(POP, 160, 30, '255,150,60', .2 * dim);
    for (const [x, y] of [[104, 140], [110, 70], [279, 140], [273, 70], [130, 121]]) glow(x, y - 1, 7, '90,200,240', .22);
    for (let i = 0; i < 14; i++) { const l = NOC_LUCIOLE(i + 50); if (l.a > .5) glow(l.x, l.y, 6, '200,255,120', .22 * l.a); }
    if (FILM.playing) glow(192, 75, 150, FILM.avg.join(','), .12); };
  r.update = dt => { updateFilm(dt); r.pollT = (r.pollT || 0) - dt; if (r.pollT <= 0) { r.pollT = 60; loadAffiches(); } };
}
const fmtTime = t => { t = Math.max(0, t | 0); const h = t / 3600 | 0, m = (t % 3600) / 60 | 0, s2 = t % 60; return (h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(s2).padStart(2, '0'); };

/* ================= le film ================= */
const FILM = { ok: false, visible: false, local: false, name: 'film.mp4', avg: [200, 205, 220], sampleT: 0, remote: null,
  subs: [], subsOn: true, subsName: '', offset: 0 };
const filmEl = document.createElement('video');
filmEl.id = 'film'; filmEl.playsInline = true; filmEl.preload = 'metadata';
const subsEl = document.createElement('div'); subsEl.id = 'subs';
const wrapEl = document.createElement('div'); wrapEl.id = 'cineWrap'; wrapEl.append(filmEl);
document.getElementById('view').append(wrapEl, subsEl);
filmEl.addEventListener('loadedmetadata', () => { FILM.ok = true; renderCine(); seanceApply(true); });
filmEl.addEventListener('error', () => { FILM.ok = false; renderCine(); });
// l'état « en lecture » est toujours lu sur la vidéo elle-même (jamais deviné) : le bouton ne peut plus mentir
Object.defineProperty(FILM, 'playing', { get: () => !filmEl.paused && !filmEl.ended });
Object.defineProperty(FILM, 'loading', { get: () => !filmEl.paused && !filmEl.ended && filmEl.readyState < 3 });
for (const ev of ['play', 'playing', 'pause', 'waiting', 'ended', 'seeked']) filmEl.addEventListener(ev, () => renderCine());
filmEl.src = FILM_FILE;
const pos = (el, x, y, w, h) => { for (const [k, v] of Object.entries({ left: x, top: y, width: w, height: h })) if (v !== null) el.style[k] = `calc(var(--s) * ${v}px)`; };
pos(wrapEl, SCREEN.x, SCREEN.y, SCREEN.w, SCREEN.h);
pos(subsEl, SCREEN.x + 4, null, SCREEN.w - 8, null); subsEl.style.bottom = `calc(var(--s) * ${H - SCREEN.y - SCREEN.h + 5}px)`;
const [avgC, avgX] = mk(8, 5);
function updateFilm(dt) {
  const here = curRoom.id === 'cinema';
  FILM.visible = here && FILM.ok && (FILM.playing || filmEl.currentTime > 0);
  filmEl.style.display = FILM.visible ? 'block' : 'none';
  // sous-titres (en fenêtre : rendus par nous ; en plein écran : piste native du navigateur)
  const now = filmEl.currentTime - FILM.offset, cue = FILM.visible && FILM.subsOn ? FILM.subs.find(c => now >= c.a && now <= c.b) : null;
  const html = cue ? cue.html : ''; if (subsEl.dataset.h !== html) { subsEl.dataset.h = html; subsEl.innerHTML = html ? `<span>${html}</span>` : ''; }
  if (filmEl.textTracks[0]) filmEl.textTracks[0].mode = 'hidden';
  updateSeatCtl(dt);
  FILM.sampleT -= dt;
  if (FILM.playing && FILM.sampleT <= 0) { FILM.sampleT = .25;
    try { avgX.drawImage(filmEl, 0, 0, 8, 5); const d = avgX.getImageData(0, 0, 8, 5).data; let r = 0, g = 0, b = 0; for (let i = 0; i < d.length; i += 4) { r += d[i]; g += d[i + 1]; b += d[i + 2]; }
      const n = d.length / 4; FILM.avg = [r / n | 0, g / n | 0, b / n | 0]; } catch (e) { } }
  if (AMBIANCE && FILM.playing && here && SND.ctx && Math.random() < dt * 14) noise(.015, { f: 3200, q: 2, v: .012 });
  FILM.syncT = (FILM.syncT || 0) - dt; if (here && FILM.syncT <= 0) { FILM.syncT = 3; seanceApply(false); }
  if (document.getElementById('cineM').style.display === 'flex') renderCineTime();
}
function filmLeave() { if (!filmEl.paused) filmEl.pause(); }

/* ---------------- la séance commune : le serveur garde l'horloge, tout le monde voit le même moment ---------------- */
// Le serveur retient { en lecture ?, position, boucle, durée } (server/index.js) et l'envoie à la connexion et à chaque changement.
// Seuls les admins la pilotent (lancer, pause, avancer, boucle). Un film choisi sur son ordinateur reste privé.
// Hors-ligne (fichier ouvert directement), chaque onglet peut piloter.
const SEANCE = { known: false, playing: false, pos: 0, recv: 0, loop: false, dur: 0 };
const peutPiloter = () => typeof COMPTE !== 'undefined' && (COMPTE.local || !!(COMPTE.user && COMPTE.user.role === 'admin'));   // (compte.js est chargé après ce fichier)
const libre = () => FILM.local || peutPiloter();   // peut-on toucher aux boutons de lecture ?
function seancePos() { let p = SEANCE.pos + (SEANCE.playing ? (performance.now() - SEANCE.recv) / 1000 : 0); const d = SEANCE.dur || filmEl.duration || 0;
  if (d) p = SEANCE.loop ? p % d : Math.min(p, d); return p; }
function seanceFinie() { const d = SEANCE.dur || filmEl.duration || 0; return !SEANCE.loop && d > 0 && seancePos() >= d - .05; }
function filmSend() {   // admin : annonce l'état de la séance à tout le monde (le serveur le garde)
  FILM.lastCmd = performance.now();
  if (FILM.local || !peutPiloter()) return;
  const m = { type: 'film', id: player ? player.id : 'moi', act: FILM.playing ? 'play' : 'pause', t: filmEl.currentTime, loop: filmEl.loop, dur: filmEl.duration || 0 };
  Object.assign(SEANCE, { known: true, playing: m.act === 'play', pos: m.t, recv: performance.now(), loop: m.loop, dur: m.dur });
  if (bc && player) bc.postMessage(m);
  renderCine();
}
function playSafe(onBlocked) { // play() peut échouer (navigateur qui bloque, fichier illisible, pause demandée entre-temps)
  return filmEl.play().then(() => true, err => { renderCine();
    if (err && err.name === 'AbortError') return false;
    if (err && err.name === 'NotAllowedError') onBlocked(); else toast('Impossible de lire ce film (format non pris en charge ?).');
    return false; });
}
function filmPlay() {
  if (!FILM.ok) { toast(`Aucun film trouvé. Dépose un fichier dans <b>public/${FILM_FILE}</b> ou choisis-en un depuis la cabine.`); return; }
  if (!libre()) { seanceApply(true, true); return; }   // joueur : « Rejoindre la séance »
  FILM.lastCmd = performance.now();
  playSafe(() => toast('Le navigateur a bloqué la lecture : clique à nouveau sur <b>Lancer</b>.')).then(ok => { if (ok) filmSend(); });
}
function filmPause() { if (!libre()) return; filmEl.pause(); filmSend(); }
function filmToggle() { if (filmEl.paused || filmEl.ended) filmPlay(); else filmPause(); renderCine(); }
function filmSeek(t) { if (!libre()) return; filmEl.currentTime = clamp(t, 0, filmEl.duration || 0); filmSend(); }
function filmLoop(on) { if (!libre()) return; filmEl.loop = on; filmSend(); renderCine(); }
function filmRemote(m) {   // l'état de la séance, envoyé par le serveur (à la connexion) ou après la commande d'un admin
  const was = SEANCE.playing;
  Object.assign(SEANCE, { known: true, playing: m.act === 'play', pos: +m.t || 0, recv: performance.now(), loop: !!m.loop, dur: +m.dur || 0 });
  if (!FILM.local) filmEl.loop = SEANCE.loop;
  if (curRoom.id === 'cinema' && m.id !== 'srv' && was !== SEANCE.playing) addSys(SEANCE.playing ? 'La séance commence.' : 'La séance est en pause.', 'gold');
  seanceApply(true); renderCine();
}
function seanceApply(force, geste) {   // aligne la vidéo sur la séance commune (en entrant au cinéma, puis toutes les 3 s)
  if (FILM.local || !FILM.ok || !SEANCE.known || !player || curRoom.id !== 'cinema') return;
  if (!force && performance.now() - (FILM.lastCmd || 0) < 2500) return;   // on vient de piloter : on laisse le temps au serveur
  const want = seancePos();
  if (force || Math.abs(filmEl.currentTime - want) > 1.5) { try { filmEl.currentTime = want; } catch (e) { } }
  if (SEANCE.playing && !seanceFinie()) { if (filmEl.paused) playSafe(() => { if (!geste) addSys('Une séance est en cours : va au projecteur et clique sur « Rejoindre la séance ».', 'gold'); }); }
  else if (!filmEl.paused) filmEl.pause();
}

/* ---------------- sous-titres .srt / .vtt ---------------- */
function parseSubs(text) {
  const out = [], ts = s => { const m = s.trim().replace(',', '.').match(/(?:(\d+):)?(\d+):(\d+(?:\.\d+)?)/); return m ? (+(m[1] || 0)) * 3600 + (+m[2]) * 60 + (+m[3]) : NaN; };
  for (const block of text.replace(/\r/g, '').split(/\n\s*\n/)) {
    const lines = block.split('\n'), i = lines.findIndex(l => l.includes('-->')); if (i < 0) continue;
    const [a, b] = lines[i].split('-->'), A = ts(a), B = ts(b); if (isNaN(A) || isNaN(B)) continue;
    const raw = lines.slice(i + 1).join('\n').trim(); if (!raw) continue;
    const esc = raw.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/&lt;(\/?)(i|b|u)&gt;/gi, '<$1$2>').replace(/&lt;[^&]*&gt;|\{[^}]*\}/g, '');
    out.push({ a: A, b: B, html: esc.replace(/\n/g, '<br>'), text: raw.replace(/<[^>]*>|\{[^}]*\}/g, '') });
  }
  return out;
}
function decodeSubs(buf) { let t = new TextDecoder('utf-8').decode(buf); if (t.includes(String.fromCharCode(0xFFFD))) t = new TextDecoder('windows-1252').decode(buf); return t; }
function setSubs(text, name) {
  FILM.subs = parseSubs(text); FILM.subsName = name;
  for (const tr of filmEl.querySelectorAll('track')) tr.remove();
  rebuildTrack(); renderCine(); if (typeof renderSeatCtl === 'function') renderSeatCtl();
  if (FILM.subs.length) toast(`Sous-titres chargés : <b>${name}</b> (${FILM.subs.length} répliques)`); else toast('Ce fichier de sous-titres est vide ou illisible.');
}
function rebuildTrack() { // piste native, utilisée en plein écran
  let tr = filmEl.textTracks[0] || filmEl.addTextTrack('subtitles', 'Sous-titres', 'fr');
  if (tr.cues) for (const c of [...tr.cues]) tr.removeCue(c);
  if (typeof VTTCue !== 'undefined') for (const c of FILM.subs) tr.addCue(new VTTCue(c.a + FILM.offset, c.b + FILM.offset, c.text));
}
(async () => { for (const f of SUBS_FILES) { try { const r = await fetch(f); if (!r.ok) continue; setSubs(decodeSubs(await r.arrayBuffer()), f.split('/').pop()); return; } catch (e) { } } })();

/* ---------------- la cabine de projection (fenêtre) ---------------- */
document.getElementById('view').insertAdjacentHTML('beforeend', `
  <div id="cineM" class="modal"><div class="panel cineP">
    <div class="shopHead"><h2>Cabine de projection</h2><button class="x" id="cineX">✕</button></div>
    <div class="cineName" id="cineName"></div>
    <div class="cineSeance" id="cineSeance"></div>
    <div class="cineSeek"><span id="cineCur">0:00</span><input type="range" id="cineBar" min="0" max="1000" value="0"><span id="cineDur">0:00</span></div>
    <div class="cineRow"><button class="btn gold" id="cinePlay"></button><button class="btn" id="cineB10">⟲ 10 s</button><button class="btn" id="cineF10">10 s ⟳</button><button class="btn" id="cineFull">⛶ Plein écran</button><button class="btn" id="cineLoop"></button></div>
    <div class="cineRow"><label class="btn" for="cineFile">Choisir un film…</label><input type="file" id="cineFile" accept="video/*" hidden><button class="btn" id="cineBack">↩ Revenir à la séance commune</button>
      <label class="btn" for="cineSubFile">Choisir des sous-titres (.srt / .vtt)…</label><input type="file" id="cineSubFile" accept=".srt,.vtt,text/vtt" hidden></div>
    <div class="cineRow cineSubs"><button class="btn" id="cineSubOn"></button><button class="btn" id="cineSubM">−0,5 s</button><span id="cineOff">décalage 0 s</span><button class="btn" id="cineSubP">+0,5 s</button></div>
    <div class="cineHelp">La <b>séance commune</b> projette <b>public/${FILM_FILE}</b> (sous-titres : <b>public/films/film.srt</b> ou .vtt) : tout le monde voit le même moment, même en arrivant en cours de film.
      Seuls les admins la lancent, la mettent en pause ou l'avancent. Un film choisi sur ton ordinateur n'est visible que par toi.</div>
  </div></div>`);
let seeking = false;
function renderCineTime() {
  const d = filmEl.duration || 0; document.getElementById('cineCur').textContent = fmtTime(filmEl.currentTime); document.getElementById('cineDur').textContent = fmtTime(d);
  if (!seeking) document.getElementById('cineBar').value = d ? Math.round(1000 * filmEl.currentTime / d) : 0;
  const p = document.getElementById('cinePlay');
  let lab = !FILM.playing ? '▶ Lancer' : FILM.loading ? '… Chargement' : '❚❚ Pause';
  if (!libre()) { lab = FILM.playing ? '● Séance en cours' : SEANCE.playing && !seanceFinie() ? '▶ Rejoindre la séance' : 'En attente d’une séance'; p.disabled = !FILM.ok || FILM.playing || !SEANCE.playing || seanceFinie(); }
  if (p.textContent !== lab) p.textContent = lab;
}
function renderCine() {
  if (!document.getElementById('cineName')) return;
  document.getElementById('cineName').innerHTML = (FILM.ok ? `🎞 <b>${FILM.name}</b>${filmEl.duration ? ' · ' + fmtTime(filmEl.duration) : ''}${FILM.local ? ' · <i>fichier local</i>' : ''}` : 'Aucun film chargé')
    + `<br><small>Sous-titres : ${FILM.subs.length ? '<b>' + FILM.subsName + '</b>' : 'aucun'}</small>`;
  for (const id of ['cinePlay', 'cineB10', 'cineF10', 'cineFull', 'cineBar', 'cineLoop']) document.getElementById(id).disabled = !FILM.ok;
  if (!libre()) for (const id of ['cineB10', 'cineF10', 'cineBar', 'cineLoop']) document.getElementById(id).disabled = true;
  document.getElementById('cineLoop').textContent = filmEl.loop ? '🔁 En boucle' : '🔁 Une fois';
  document.getElementById('cineBack').style.display = FILM.local ? '' : 'none';
  document.getElementById('cineSeance').innerHTML = FILM.local ? 'Tu regardes un film <b>à toi seul</b> : la séance commune continue sans toi.'
    : `Séance commune : <b>${!SEANCE.known ? 'pas encore de nouvelles du serveur' : seanceFinie() ? 'terminée' : SEANCE.playing ? 'en cours' : 'en pause'}</b>${SEANCE.loop ? ' · en boucle' : ''}`
      + (peutPiloter() ? ' · <i>tu la pilotes pour tout le monde</i>' : ' · <i>pilotée par les admins</i>');
  document.getElementById('cineSubOn').textContent = FILM.subsOn ? 'Sous-titres ✓' : 'Sous-titres ✗';
  for (const id of ['cineSubOn', 'cineSubM', 'cineSubP']) document.getElementById(id).disabled = !FILM.subs.length;
  document.getElementById('cineOff').textContent = `décalage ${FILM.offset > 0 ? '+' : ''}${FILM.offset.toFixed(1).replace('.', ',')} s`;
  renderCineTime();
}
const $c = id => document.getElementById(id);
$c('cinePlay').onclick = () => filmToggle();
$c('cineB10').onclick = () => filmSeek(filmEl.currentTime - 10);
$c('cineF10').onclick = () => filmSeek(filmEl.currentTime + 10);
$c('cineBar').oninput = () => { seeking = true; const d = filmEl.duration || 0; $c('cineCur').textContent = fmtTime(d * $c('cineBar').value / 1000); };
$c('cineBar').onchange = () => { seeking = false; filmSeek((filmEl.duration || 0) * $c('cineBar').value / 1000); };
$c('cineFull').onclick = () => { closeModal('cineM'); if (!FILM.playing) filmPlay(); cineFull(true); };
$c('cineSubOn').onclick = () => { FILM.subsOn = !FILM.subsOn; renderCine(); renderSeatCtl(); };
$c('cineSubM').onclick = () => { FILM.offset -= .5; rebuildTrack(); renderCine(); };
$c('cineSubP').onclick = () => { FILM.offset += .5; rebuildTrack(); renderCine(); };
$c('cineLoop').onclick = () => filmLoop(!filmEl.loop);
$c('cineBack').onclick = () => { FILM.local = false; FILM.ok = false; FILM.name = FILM_FILE.split('/').pop(); filmEl.src = FILM_FILE; filmEl.load(); renderCine(); };
$c('cineX').onclick = () => closeModal('cineM');
$c('cineM').addEventListener('mousedown', ev => { if (ev.target.id === 'cineM') closeModal('cineM'); });
$c('cineFile').onchange = ev => { const f = ev.target.files[0]; if (!f) return;
  if (!filmEl.paused) filmEl.pause(); FILM.local = true; FILM.ok = false; filmEl.loop = false; FILM.name = f.name; filmEl.src = URL.createObjectURL(f); filmEl.load(); renderCine(); toast(`Film chargé : <b>${f.name}</b>`); };
$c('cineSubFile').onchange = async ev => { const f = ev.target.files[0]; if (!f) return; setSubs(decodeSubs(await f.arrayBuffer()), f.name); ev.target.value = ''; };
filmEl.addEventListener('loadeddata', () => renderCine());
FILM.name = FILM_FILE.split('/').pop();
renderCine();

/* ---------------- petite barre de contrôle quand on est assis ---------------- */
// Icônes en pixel art (9×9) : plein écran, sortie de plein écran, haut-parleur, muet, sous-titres.
const CINE_ICONS = {
  full: ['xxx...xxx', 'x.......x', 'x.......x', '.........', '.........', '.........', 'x.......x', 'x.......x', 'xxx...xxx'],
  exit: ['..x...x..', '..x...x..', 'xxx...xxx', '.........', '.........', '.........', 'xxx...xxx', '..x...x..', '..x...x..'],
  snd: ['....x....', '...xx..x.', 'xxxxx...x', 'xxxxx.x.x', 'xxxxx.x.x', 'xxxxx.x.x', 'xxxxx...x', '...xx..x.', '....x....'],
  mute: ['....x....', '...xx....', 'xxxxx....', 'xxxxx.x.x', 'xxxxx..x.', 'xxxxx.x.x', 'xxxxx....', '...xx....', '....x....'],
  cc: ['xxxxxxxxx', 'x.......x', 'x.xx.xx.x', 'x.x..x..x', 'x.x..x..x', 'x.xx.xx.x', 'x.......x', 'xxxxxxxxx', '.........'],
};
const iconURL = {}; for (const [k, rows] of Object.entries(CINE_ICONS)) for (const col of ['#e8c860', '#7a6a4a']) {
  const [cv, c] = mk(11, 11); c.fillStyle = '#05030a'; for (let y = 0; y < 9; y++) for (let x = 0; x < 9; x++) if (rows[y][x] === 'x') c.fillRect(x + 1, y + 2, 1, 1);
  c.fillStyle = col; for (let y = 0; y < 9; y++) for (let x = 0; x < 9; x++) if (rows[y][x] === 'x') c.fillRect(x + 1, y + 1, 1, 1);
  iconURL[k + (col === '#e8c860' ? '' : 'Off')] = cv.toDataURL(); }
const ctlEl = document.createElement('div'); ctlEl.id = 'seatCtl';
ctlEl.innerHTML = `<button id="scFull" title="Plein écran"></button><span class="scVol"><button id="scSnd" title="Son du film"></button><input id="scVolR" type="range" min="0" max="100" title="Volume du film"></span>
  <button id="scCC" title="Sous-titres"></button><span id="scTime"></span>`;
document.getElementById('view').append(ctlEl);
pos(ctlEl, null, SCREEN.y + 3, null, null); ctlEl.style.right = `calc(var(--s) * ${W - SCREEN.x - SCREEN.w + 3}px)`;
try { const v = localStorage.getItem('nocturne-film-vol'); if (v !== null) filmEl.volume = clamp(+v, 0, 1); } catch (e) { }
let ctlIdle = 0;
const isFull = () => document.fullscreenElement === wrapEl;
function cineFull(on) {
  if (on && !isFull()) (wrapEl.requestFullscreen ? wrapEl.requestFullscreen() : Promise.reject()).catch(() => toast('Plein écran indisponible ici.'));
  else if (!on && isFull()) document.exitFullscreen();
}
document.addEventListener('fullscreenchange', () => { // en plein écran, la barre et les sous-titres suivent la vidéo
  if (isFull()) { wrapEl.append(subsEl, ctlEl); ctlIdle = 0; } else document.getElementById('view').append(subsEl, ctlEl);
  renderSeatCtl(); });
function renderSeatCtl() {
  const set = (id, k) => { const b = document.getElementById(id), u = `url(${iconURL[k]})`; if (b.style.backgroundImage !== u) b.style.backgroundImage = u; };
  set('scFull', isFull() ? 'exit' : 'full');
  set('scSnd', filmEl.muted || filmEl.volume === 0 ? 'mute' : 'snd');
  set('scCC', FILM.subsOn && FILM.subs.length ? 'cc' : 'ccOff');
  document.getElementById('scCC').disabled = !FILM.subs.length;
  document.getElementById('scCC').title = FILM.subs.length ? (FILM.subsOn ? 'Masquer les sous-titres' : 'Afficher les sous-titres') : 'Aucun sous-titre chargé';
  const r = document.getElementById('scVolR'); if (document.activeElement !== r) r.value = Math.round((filmEl.muted ? 0 : filmEl.volume) * 100);
}
function updateSeatCtl(dt) {
  const seated = curRoom.id === 'cinema' && player && player.act && player.act.cine && FILM.ok;
  const show = isFull() || seated;
  if (seated && !wasSeated) ctlIdle = 0; wasSeated = seated;
  ctlEl.style.display = show ? 'flex' : 'none';
  if (!show) return;
  ctlIdle += dt; const hide = ctlIdle > 2.5 && !ctlEl.matches(':hover') && document.activeElement !== $c('scVolR');
  ctlEl.classList.toggle('idle', hide); wrapEl.classList.toggle('idle', hide);
  const t = `${fmtTime(filmEl.currentTime)} / ${fmtTime(filmEl.duration || 0)}`, te = document.getElementById('scTime'); if (te.textContent !== t) te.textContent = t;
}
wrapEl.addEventListener('mousemove', () => ctlIdle = 0);
document.getElementById('game').addEventListener('mousemove', ev => { // survoler l'écran fait réapparaître la barre
  const rc = ev.currentTarget.getBoundingClientRect(), gx = (ev.clientX - rc.left) / rc.width * W, gy = (ev.clientY - rc.top) / rc.height * H;
  if (gx >= SCREEN.x && gx < SCREEN.x + SCREEN.w && gy >= SCREEN.y && gy < SCREEN.y + SCREEN.h) ctlIdle = 0; });
let wasSeated = false;
ctlEl.addEventListener('mousemove', () => ctlIdle = 0);
wrapEl.addEventListener('dblclick', () => cineFull(!isFull()));
const keep = b => { b.addEventListener('mousedown', ev => ev.preventDefault()); }; // ne pas voler le focus du jeu
for (const b of ctlEl.querySelectorAll('button')) keep(b);
$c('scFull').onclick = () => { sfx.click(); cineFull(!isFull()); };
$c('scSnd').onclick = () => { sfx.click(); if (filmEl.muted || filmEl.volume === 0) { filmEl.muted = false; if (filmEl.volume === 0) filmEl.volume = .6; } else filmEl.muted = true; saveVol(); renderSeatCtl(); };
$c('scVolR').oninput = () => { filmEl.volume = $c('scVolR').value / 100; filmEl.muted = false; saveVol(); renderSeatCtl(); };
$c('scVolR').onchange = () => $c('scVolR').blur();
$c('scCC').onclick = () => { sfx.click(); FILM.subsOn = !FILM.subsOn; renderSeatCtl(); renderCine(); };
function saveVol() { try { localStorage.setItem('nocturne-film-vol', filmEl.muted ? 0 : filmEl.volume); } catch (e) { } }
renderSeatCtl();
