"use strict";
// « Le Cinéma » : une petite grotte rouge, derrière les portes de la Devanture (devanture.js), avec une toile tendue pour la projection.
// - Le cinéma projette un vrai fichier vidéo : par défaut public/films/film.mp4 (voir public/films/LISEZ-MOI.txt),
//   ou un fichier choisi sur ton ordinateur depuis la cabine de projection.
// - Lancer / mettre en pause / avancer est synchronisé avec les autres joueurs (s'ils ont le même fichier).
// - Sous-titres .srt ou .vtt : public/films/film.srt (ou .vtt), ou choisis depuis la cabine.
// - L'écran est un « trou » dans le canvas du jeu : la vidéo est derrière, les personnages peuvent passer devant.

const FILM_FILE = 'films/film.mp4';
const SUBS_FILES = ['films/film.vtt', 'films/film.srt'];   // sous-titres chargés automatiquement s'ils existent
const SCREEN = { x: 124, y: 42, w: 160, h: 90 };

/* ================= ROOM : LE CINÉMA — une petite grotte, à l'entrée de laquelle on projette sur une toile ================= */
// Même ciel de nuit que la Clairière, vu depuis l'intérieur : la bouche de la grotte est à gauche, la braise du dehors éclaire la roche.
{ const r = ROOMS.cinema = { id: 'cinema', name: 'LE CINEMA', fires: [], indoor: true, stars: [], grass: [], climbs: [], fogFar: null, fogNear: [160, 20, .08], far: null, hole: SCREEN };
  const S = SCREEN, SX2 = S.x + S.w, SY2 = S.y + S.h, MX1 = -10, MX2 = 64, MSP = 120, MRR = 37;   // la bouche de la grotte
  const px8 = (v) => v < 0 ? 0 : v > 255 ? 255 : v | 0;
  // dehors, par la bouche : ciel de nuit, lune, crête boisée
  const [sk, s] = mk(W, H); r.sky = sk;
  s.drawImage(NOC_PAINT.paintSky(W, H, 0, 26, 92, 152), 0, 0);
  { const nf = makeNoise(26, 12); for (let x = 0; x < 120; x++) { const t = Math.round(150 - nf(x) - (x > 40 ? (x - 40) * .22 : 0)); s.fillStyle = '#0a141a'; s.fillRect(x, t, 1, H - t); if (R() < .6) { s.fillStyle = '#1e3a34'; s.fillRect(x, t, 1, 1); } }
    s.fillStyle = 'rgba(170,200,220,.14)'; s.fillRect(0, 146, 120, 6); s.fillStyle = '#060c0e'; s.fillRect(0, 164, 120, H - 164); }
  // la paroi : roche rouge sombre, strates, réchauffée près de la bouche
  const [wl, w] = mk(W, H); r.wall = wl;
  { const img = w.createImageData(W, H), d = img.data;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = (y * W + x) * 4, n = R(), band = Math.sin(y * .55 + Math.sin(x * .05) * 3 + (x >> 4) * .7) * .5 + .5, warm = Math.max(0, 1 - x / 170) * Math.max(0, 1 - Math.abs(y - 130) / 110);
      const k = 1 + (n - .5) * .35 + band * .22 - (y < 40 ? (40 - y) / 70 : 0) - Math.max(0, x - 290) / 260;
      d[i] = px8((34 + warm * 120) * k); d[i + 1] = px8((11 + warm * 34) * k); d[i + 2] = px8((16 + warm * 14) * k); d[i + 3] = 255; }
    w.putImageData(img, 0, 0);
    // fissures et filets de sang qui suintent
    for (let k = 0; k < 14; k++) { let x = 70 + R() * 300, y = 20 + R() * 120; w.fillStyle = '#0a0305'; for (let j = 0; j < 8 + R() * 14; j++) { w.fillRect(x | 0, y | 0, 1, 1); x += R() * 2 - 1; y += R() * 1.6 + .2; } }
    for (const x of [96, 150, 214, 258, 330, 356]) { const top = 16 + (R() * 20 | 0), len = 30 + (R() * 60 | 0); for (let y = top; y < top + len; y++) { w.fillStyle = y > top + len - 4 ? '#c0282a' : '#5a0a12'; w.fillRect(x, y, 1, 1); if (y % 7 === 0) w.fillRect(x + 1, y, 1, 1); } }
    // des os pris dans la roche
    for (const [x, y] of [[84, 100], [336, 104], [362, 72]]) { w.fillStyle = '#9a8a78'; w.fillRect(x, y, 7, 6); w.fillRect(x + 1, y + 6, 5, 2); w.fillStyle = '#12060a'; w.fillRect(x + 1, y + 2, 2, 2); w.fillRect(x + 4, y + 2, 2, 2); w.fillRect(x + 3, y + 5, 1, 2); }
    // plafond irrégulier + stalactites
    const nc = makeNoise(22, 18), nc2 = makeNoise(7, 6), ceil = x => Math.round(14 + nc(x) + nc2(x));
    for (let x = 0; x < W; x++) { const c = ceil(x); w.fillStyle = '#080204'; w.fillRect(x, 0, 1, c); w.fillStyle = R() < .5 ? '#4a1818' : '#2a0c10'; w.fillRect(x, c, 1, 1); }
    for (const [x, len, wd] of [[18, 26, 9], [74, 18, 7], [110, 32, 11], [172, 20, 8], [226, 36, 12], [262, 17, 7], [304, 29, 10], [352, 22, 9], [140, 12, 5], [338, 15, 6]]) for (let i = 0; i < wd; i++) { const h = Math.round(len * (1 - Math.abs(2 * i / (wd - 1) - 1))), c = ceil(x + i); w.fillStyle = '#080204'; w.fillRect(x + i, c, 1, h); if (h > 2) { w.fillStyle = '#3a1214'; w.fillRect(x + i, c + h - 1, 1, 1); } }
    // la toile : tendue par quatre cordes accrochées au plafond
    const cl = { x: S.x - 6, y: S.y - 5, w: S.w + 12, h: S.h + 11 };
    for (const [ax, ay, bx, by] of [[S.x - 20, ceil(S.x - 20) + 8, cl.x + 1, cl.y + 1], [SX2 + 20, ceil(SX2 + 20) + 8, cl.x + cl.w - 2, cl.y + 1]]) { w.fillStyle = '#6a5236'; const n = 60; for (let t = 0; t <= n; t++) w.fillRect(Math.round(ax + (bx - ax) * t / n), Math.round(ay + (by - ay) * t / n), 1, 1); w.fillStyle = '#2a1a10'; w.fillRect(ax - 1, ay - 1, 3, 3); }
    w.fillStyle = '#05030a'; w.fillRect(cl.x - 1, cl.y - 1, cl.w + 2, cl.h + 1);
    for (let x = 0; x < cl.w; x++) for (let y = 0; y < cl.h - Math.round(1.5 + 1.5 * Math.sin(x * .7) + (x % 9 === 0 ? 2 : 0)); y++) { const edge = x < 2 || x > cl.w - 3 || y < 2; w.fillStyle = edge ? '#8a7a62' : (x % 11 < 2 ? '#c4b69a' : '#d2c6aa'); w.fillRect(cl.x + x, cl.y + y, 1, 1); }
    for (let k = 0; k < 40; k++) { w.fillStyle = 'rgba(80,50,30,.35)'; w.fillRect(cl.x + (R() * cl.w | 0), cl.y + (R() * cl.h | 0), 1 + (R() * 3 | 0), 1); }
    w.fillStyle = '#05030a'; w.fillRect(S.x - 1, S.y - 1, S.w + 2, S.h + 2);
    w.clearRect(S.x, S.y, S.w, S.h);                       // le trou : la vidéo est derrière le canvas
    // la bouche de la grotte : on découpe la roche, la nuit apparaît ; liseré de lune sur le bord
    const jag = makeNoise(9, 5);
    archRows(MX1, MX2, MSP, GROUND, MRR, (y, a, b) => { const j = Math.round(jag(y)); w.clearRect(a, y, b - a - j, 1); w.fillStyle = 'rgba(150,190,220,.6)'; w.fillRect(b - j - 1, y, 1, 1); w.fillStyle = 'rgba(190,215,240,.25)'; w.fillRect(b - j, y, 1, 1); });
  }
  // sol de cendre et de roche, banc de pierre en gradins
  const [pl, px] = mk(W, H); r.play = pl;
  r.plats = [{ x1: 112, x2: 360, y: 166 }];
  { px.fillStyle = '#1c0a0e'; px.fillRect(0, GROUND, W, H - GROUND);
    for (let k = 0; k < 520; k++) { px.fillStyle = k % 3 ? '#2c1216' : '#0e0407'; px.fillRect(R() * W | 0, GROUND + 2 + (R() * (H - GROUND - 2) | 0), 1 + (R() < .35), 1); }
    for (let x = 0; x < W; x++) { px.fillStyle = x < 90 ? '#7a2a1c' : '#3a1418'; px.fillRect(x, GROUND, 1, 1); if (x < 90 && R() < .5) { px.fillStyle = '#c0452a'; px.fillRect(x, GROUND, 1, 1); } }
    for (let x = 0; x < 130; x++) { px.fillStyle = `rgba(255,110,50,${.22 * (1 - x / 130)})`; px.fillRect(x, GROUND + 1, 1, 4); }
    // le gradin
    px.fillStyle = '#12060a'; px.fillRect(112, 166, 248, GROUND - 166);
    for (let y = 168; y < GROUND; y += 5) { px.fillStyle = '#26101a'; px.fillRect(112, y, 248, 1); }
    for (let k = 0; k < 160; k++) { px.fillStyle = k % 2 ? '#34161c' : '#0a0407'; px.fillRect(112 + (R() * 248 | 0), 168 + (R() * 16 | 0), 2, 1); }
    px.fillStyle = '#5a2a26'; px.fillRect(112, 166, 248, 1); px.fillStyle = '#3a1a1c'; px.fillRect(112, 167, 248, 1);
    for (let x = 112; x < 360; x += 9 + (R() * 7 | 0)) { px.fillStyle = '#0a0407'; px.fillRect(x, 168, 1, GROUND - 168); }
    for (let i = 0; i < 6; i++) { px.fillStyle = '#12060a'; px.fillRect(104 + i, 166 + i * 3, 8 - i, 3); px.fillStyle = '#3a1a1c'; px.fillRect(104 + i, 166 + i * 3, 8 - i, 1); }
    // gravats, un crâne, des braseros de fer
    for (const [x, y, ww] of [[70, 0, 6], [92, 0, 4], [340, 0, 7], [372, 0, 5]]) { px.fillStyle = '#0e0407'; px.fillRect(x, GROUND - 3 - y, ww, 3 + y); px.fillStyle = '#4a1c1e'; px.fillRect(x, GROUND - 3 - y, ww - 1, 1); }
    px.fillStyle = '#9a8a78'; px.fillRect(80, GROUND - 4, 6, 4); px.fillStyle = '#12060a'; px.fillRect(81, GROUND - 3, 1, 1); px.fillRect(84, GROUND - 3, 1, 1);
    for (const bx of [104, 312]) { const by = bx === 104 ? GROUND : 166;
      px.fillStyle = '#100a0e'; px.fillRect(bx - 1, by - 32, 3, 32); px.fillRect(bx - 4, by - 4, 9, 4); px.fillStyle = '#3a2e32'; px.fillRect(bx - 1, by - 32, 1, 32);
      px.fillStyle = '#100a0e'; px.fillRect(bx - 6, by - 38, 13, 2); px.fillRect(bx - 5, by - 36, 2, 4); px.fillRect(bx + 4, by - 36, 2, 4); px.fillRect(bx - 5, by - 33, 11, 2); r.fires.push(fire(bx, by - 36, 1)); }
  }
  r.portals = [{ x1: 6, x2: 52, spring: 120, bottom: GROUND, rr: 23, floor: GROUND, label: 'Sortir', to: 'devanture', toX: 192, bars: false, open: 0, near: 0, col: '255,110,60', col2: '255,200,150' }];
  r.seats = [];
  for (let i = 0; i < 8; i++) r.seats.push({ x: 132 + i * 28, y: 166 });
  for (let i = 0; i < 8; i++) r.seats.push({ x: 120 + i * 28, y: GROUND });
  r.desk = { x: 352, y: GROUND };
  const stool = (c, x, y) => { c.fillStyle = '#05030a'; c.fillRect(x - 7, y - 9, 14, 9); c.fillStyle = '#4a2226'; c.fillRect(x - 6, y - 8, 12, 7); c.fillStyle = '#6a3234'; c.fillRect(x - 6, y - 8, 12, 2); c.fillStyle = '#2a1014'; c.fillRect(x - 6, y - 3, 12, 2);
    c.fillStyle = '#1a0a0e'; c.fillRect(x - 2, y - 6, 1, 4); c.fillRect(x + 3, y - 7, 1, 3); };
  r.dyn = c => {
    const d = r.desk;   // pupitre de pierre et projecteur de cuivre
    c.fillStyle = '#05030a'; c.fillRect(d.x - 10, d.y - 17, 20, 17); c.fillStyle = '#3a1a1c'; c.fillRect(d.x - 9, d.y - 16, 18, 16); c.fillStyle = '#5a2a2c'; c.fillRect(d.x - 9, d.y - 16, 18, 2); c.fillStyle = '#1a0a0e'; c.fillRect(d.x - 9, d.y - 8, 18, 1);
    c.fillStyle = '#05030a'; c.fillRect(d.x - 9, d.y - 25, 14, 9); c.fillStyle = '#8a5a2a'; c.fillRect(d.x - 8, d.y - 24, 12, 7); c.fillStyle = '#c98a3a'; c.fillRect(d.x - 8, d.y - 24, 12, 2);
    c.fillStyle = '#05030a'; c.fillRect(d.x - 13, d.y - 23, 5, 5); c.fillStyle = FILM.playing ? '#ffe9b0' : '#7a6a58'; c.fillRect(d.x - 12, d.y - 22, 3, 3);
    c.fillStyle = FILM.playing ? '#60ff90' : '#ff5050'; c.fillRect(d.x + 1, d.y - 21, 2, 2);
    if (!FILM.visible) { c.fillStyle = '#d2c6aa'; c.fillRect(S.x, S.y, S.w, S.h); c.fillStyle = '#c0b296'; for (let y = S.y; y < SY2; y += 3) c.fillRect(S.x, y, S.w, 1);
      const m1 = txt(FILM.ok ? 'PROJECTION PRETE' : 'AUCUN FILM', '#2a1a1a', null), m2 = txt(FILM.ok ? 'VA AU PUPITRE (E)' : 'DEPOSE PUBLIC/FILMS/FILM.MP4', '#5a4a4a', null);
      c.drawImage(m1, S.x + (S.w - m1.width >> 1), S.y + 36); c.drawImage(m2, S.x + (S.w - m2.width >> 1), S.y + 45); }
    // où on en est : barre sous la toile
    if (FILM.ok && filmEl.duration) { const p = clamp(filmEl.currentTime / filmEl.duration, 0, 1), y = SY2 + 9;
      const t = txt(`${fmtTime(filmEl.currentTime)} / ${fmtTime(filmEl.duration)}`, '#e8c860', '#05030a'), bw = S.w - t.width - 6;
      c.fillStyle = '#05030a'; c.fillRect(S.x - 1, y - 1, bw + 2, 4); c.fillStyle = '#3a1a10'; c.fillRect(S.x, y, bw, 2);
      c.fillStyle = '#c9a24a'; c.fillRect(S.x, y, Math.round(bw * p), 2); c.fillStyle = '#ffe8a0'; c.fillRect(S.x + Math.round(bw * p) - 1, y - 1, 2, 4);
      c.drawImage(t, SX2 - t.width, y - 3); }
    // cendres qui entrent par la bouche de la grotte
    for (let i = 0; i < 16; i++) { const t = (time * (.05 + (i % 5) * .012) + i * .173) % 1, x = 4 + t * 300, y = 70 + (i * 37 % 100) + Math.sin(time * .8 + i * 2.1) * 6 + t * 18;
      c.fillStyle = i % 3 ? 'rgba(235,120,70,.55)' : 'rgba(250,230,210,.35)'; c.fillRect(Math.round(x), Math.round(y), 1, 1); } };
  r.front = c => {
    for (const s2 of r.seats) stool(c, s2.x, s2.y);
    const col = FILM.playing ? FILM.avg : [200, 205, 220], a = FILM.playing ? .07 + .02 * Math.sin(time * 25) : .025, bx = r.desk.x - 13, by = r.desk.y - 21;
    c.globalCompositeOperation = 'lighter'; c.fillStyle = `rgba(${col[0]},${col[1]},${col[2]},${a})`;
    c.beginPath(); c.moveTo(bx, by); c.lineTo(bx, by + 3); c.lineTo(SX2, SY2); c.lineTo(SX2, S.y); c.fill();
    for (let i = 0; i < 16; i++) { const t = ((time * .05 + i * .137) % 1), x = bx - t * (bx - SX2), y = by + (Math.sin(i * 7.3 + time * .5) * .5) * t * 70 - t * 45;
      c.fillStyle = `rgba(255,250,230,${.25 * (FILM.playing ? 1.5 : .6)})`; c.fillRect(Math.round(x), Math.round(y), 1, 1); }
    c.globalCompositeOperation = 'source-over'; };
  r.lights = () => { const dim = FILM.playing ? .3 : 1;
    glow(26, 118, 78, '255,110,50', .22); portalGlow(r.portals[0]);
    glow(104, 148, 46, '255,150,60', .2 * dim); glow(312, 130, 46, '255,150,60', .2 * dim);
    if (FILM.playing) glow(204, 90, 140, FILM.avg.join(','), .12); };
  r.update = dt => updateFilm(dt);
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
filmEl.addEventListener('loadedmetadata', () => { FILM.ok = true; renderCine(); });
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
  if (document.getElementById('cineM').style.display === 'flex') renderCineTime();
}
function filmLeave() { if (!filmEl.paused) filmEl.pause(); }
function filmSend(act) { if (!FILM.local && bc && player) bc.postMessage({ type: 'film', id: player.id, act, t: filmEl.currentTime }); }
function playSafe(onBlocked) { // play() peut échouer (navigateur qui bloque, fichier illisible, pause demandée entre-temps)
  return filmEl.play().then(() => true, err => { renderCine();
    if (err && err.name === 'AbortError') return false;
    if (err && err.name === 'NotAllowedError') onBlocked(); else toast('Impossible de lire ce film (format non pris en charge ?).');
    return false; });
}
function filmPlay(broadcast = true) {
  if (!FILM.ok) { toast(`Aucun film trouvé. Dépose un fichier dans <b>public/${FILM_FILE}</b> ou choisis-en un depuis la cabine.`); return; }
  playSafe(() => toast('Le navigateur a bloqué la lecture : clique à nouveau sur <b>Lancer</b>.')).then(ok => { if (ok && broadcast) filmSend('play'); });
}
function filmPause(broadcast = true) { filmEl.pause(); if (broadcast) filmSend('pause'); }
function filmToggle() { if (filmEl.paused || filmEl.ended) filmPlay(); else filmPause(); renderCine(); }
function filmSeek(t) { filmEl.currentTime = clamp(t, 0, filmEl.duration || 0); filmSend(FILM.playing ? 'play' : 'pause'); }
function filmRemote(m) {
  if (FILM.local || !FILM.ok) return;
  if (Math.abs(filmEl.currentTime - m.t) > .8) filmEl.currentTime = m.t;
  if (curRoom.id !== 'cinema') { FILM.remote = m; return; }
  const was = FILM.playing;
  if (m.act === 'play') playSafe(() => addSys('La projection a commencé : va au pupitre et clique sur Lancer pour la rejoindre.', 'gold')); else filmEl.pause();
  if (was !== (m.act === 'play')) addSys(m.act === 'play' ? 'La projection commence.' : 'La projection est en pause.', 'gold');
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
    <div class="cineSeek"><span id="cineCur">0:00</span><input type="range" id="cineBar" min="0" max="1000" value="0"><span id="cineDur">0:00</span></div>
    <div class="cineRow"><button class="btn gold" id="cinePlay"></button><button class="btn" id="cineB10">⟲ 10 s</button><button class="btn" id="cineF10">10 s ⟳</button><button class="btn" id="cineFull">⛶ Plein écran</button></div>
    <div class="cineRow"><label class="btn" for="cineFile">Choisir un film…</label><input type="file" id="cineFile" accept="video/*" hidden>
      <label class="btn" for="cineSubFile">Choisir des sous-titres (.srt / .vtt)…</label><input type="file" id="cineSubFile" accept=".srt,.vtt,text/vtt" hidden></div>
    <div class="cineRow cineSubs"><button class="btn" id="cineSubOn"></button><button class="btn" id="cineSubM">−0,5 s</button><span id="cineOff">décalage 0 s</span><button class="btn" id="cineSubP">+0,5 s</button></div>
    <div class="cineHelp">Par défaut, le cinéma projette <b>public/${FILM_FILE}</b> et charge les sous-titres <b>public/films/film.srt</b> (ou .vtt) s'ils existent.
      Lancer, mettre en pause et avancer est partagé avec les autres joueurs qui ont le même fichier. Un film choisi sur ton ordinateur n'est visible que par toi.</div>
  </div></div>`);
let seeking = false;
function renderCineTime() {
  const d = filmEl.duration || 0; document.getElementById('cineCur').textContent = fmtTime(filmEl.currentTime); document.getElementById('cineDur').textContent = fmtTime(d);
  if (!seeking) document.getElementById('cineBar').value = d ? Math.round(1000 * filmEl.currentTime / d) : 0;
  const p = document.getElementById('cinePlay'), lab = !FILM.playing ? '▶ Lancer' : FILM.loading ? '… Chargement' : '❚❚ Pause'; if (p.textContent !== lab) p.textContent = lab;
}
function renderCine() {
  if (!document.getElementById('cineName')) return;
  document.getElementById('cineName').innerHTML = (FILM.ok ? `🎞 <b>${FILM.name}</b>${filmEl.duration ? ' · ' + fmtTime(filmEl.duration) : ''}${FILM.local ? ' · <i>fichier local</i>' : ''}` : 'Aucun film chargé')
    + `<br><small>Sous-titres : ${FILM.subs.length ? '<b>' + FILM.subsName + '</b>' : 'aucun'}</small>`;
  for (const id of ['cinePlay', 'cineB10', 'cineF10', 'cineFull', 'cineBar']) document.getElementById(id).disabled = !FILM.ok;
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
$c('cineX').onclick = () => closeModal('cineM');
$c('cineM').addEventListener('mousedown', ev => { if (ev.target.id === 'cineM') closeModal('cineM'); });
$c('cineFile').onchange = ev => { const f = ev.target.files[0]; if (!f) return;
  filmPause(false); FILM.local = true; FILM.ok = false; FILM.name = f.name; filmEl.src = URL.createObjectURL(f); filmEl.load(); renderCine(); toast(`Film chargé : <b>${f.name}</b>`); };
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
