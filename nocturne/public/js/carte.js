"use strict";
// Carte du royaume : bouton rond à côté du rouage + parchemin qui se déroule, avec le nombre de joueurs par salle.

const mapBtn = document.getElementById('mapBtn'), mapCv = document.getElementById('mapCv'), mpx = mapCv.getContext('2d'), mapM = document.getElementById('mapM');
const scrollEl = document.getElementById('scroll'), mapArea = document.getElementById('mapArea'), mapSvg = document.getElementById('mapSvg');
mapCv.width = 22; mapCv.height = 22; mpx.imageSmoothingEnabled = false;

/* ---- bouton : médaillon + petit rouleau de parchemin ---- */
const MAP_ART = [
  '.............', '..YYYYYYYYY..', '.YWWWWWWWWWY.', '.YW.......WY.', '.YW.X...X.WY.', '.YW..X.X..WY.', '.YW...X...WY.', '.YW..X.X..WY.', '.YW.X...X.WY.', '.YW.......WY.', '.YWWWWWWWWWY.', '..YYYYYYYYY..', '.............'];
let mapKey = '';
function drawMapBtn() {
  const open = mapM.style.display === 'flex', hov = HUD.hover === 'map', key = '' + open + hov; if (key === mapKey) return; mapKey = key;
  mpx.clearRect(0, 0, 22, 22); mpx.fillStyle = '#05070c'; disc(mpx, 11, 11, 11); mpx.fillStyle = open ? '#e0b85a' : hov ? '#c9a24a' : '#5a6272'; disc(mpx, 11, 11, 10); mpx.fillStyle = open ? '#3a1a0c' : '#1a212b'; disc(mpx, 11, 11, 9);
  MAP_ART.forEach((r, j) => { for (let i = 0; i < 13; i++) { const ch = r[i]; if (ch === '.') continue;
    mpx.fillStyle = ch === 'Y' ? (open ? '#9a7428' : '#6a5a3c') : ch === 'W' ? (open ? '#f0dc9c' : hov ? '#eadcae' : '#cdbd90') : '#9a2e24'; mpx.fillRect(5 + i - 1, 5 + j - 1, 1, 1); } });
}
mapBtn.addEventListener('mouseenter', () => HUD.hover = 'map'); mapBtn.addEventListener('mouseleave', () => { if (HUD.hover === 'map') HUD.hover = null; });
tipOn(mapBtn, '<b>Carte du monde</b> · touche N');

/* ---- les salles et leurs liaisons ---- */
const MAP_NODES = [
  { id: 'sommet', x: 104, y: 23 }, { id: 'devanture', x: 32, y: 68 }, { id: 'remparts', x: 104, y: 68 }, { id: 'chateau', x: 176, y: 68 }, { id: 'trone', x: 248, y: 68 },
  { id: 'cinema', x: 32, y: 113 }, { id: 'catacombes', x: 176, y: 113 }, { id: 'caveau', x: 248, y: 113 }];
const MAP_LINKS = [['sommet', 'remparts'], ['devanture', 'remparts'], ['remparts', 'chateau'], ['chateau', 'trone'], ['devanture', 'cinema'], ['trone', 'caveau'], ['caveau', 'catacombes']];

/* petites vignettes dessinées à l'encre (58×24) */
function mapThumb(id, c) {
  const x = c.getContext('2d'), R = (col, a, b, w, h) => { x.fillStyle = col; x.fillRect(a, b, w, h); }, D = (col, cx, cy, r) => { x.fillStyle = col; for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) if (i * i + j * j <= r * r + r * .5) x.fillRect(cx + i, cy + j, 1, 1); };
  const W = 58, H = 24;
  if (id === 'remparts') { R('#5a0c12', 0, 0, W, H); R('#8a1a16', 0, 10, W, 8); R('#c0401e', 0, 16, W, 4); D('#040102', 20, 6, 4); x.fillStyle = '#ffa040'; for (let a = 0; a < 6.3; a += .35) x.fillRect(20 + Math.round(Math.cos(a) * 5.5), 6 + Math.round(Math.sin(a) * 5.5), 1, 1);
    R('#ffc870', 20, 11, 1, 8); R('#1c0509', 0, 18, W, 6); R('#0c0307', 0, 14, 12, 10); R('#0c0307', 46, 14, 12, 10); R('#050203', 38, 4, 2, 17); R('#050203', 33, 9, 12, 1); R('#050203', 41, 6, 6, 1); R('#9ad8ff', 27, 20, 8, 2); R('#c8d4dc', 30, 17, 2, 3); }
  else if (id === 'devanture') { R('#5a0c12', 0, 0, W, H); R('#8a1a16', 0, 9, W, 7); R('#c0401e', 0, 14, W, 4); R('#ffc870', 28, 0, 1, 9);
    for (let i = 0; i < 52; i++) { const t = Math.round(8 + 16 * (1 - Math.sqrt(Math.max(0, 1 - Math.pow((i - 26) / 28, 2))))); R('#2a0c10', 3 + i, t, 1, H - t); R('#8a2a1c', 3 + i, t, 1, 1); }
    R('#05030a', 17, 11, 24, 5); R('#6a4428', 17, 11, 24, 1); R('#e8c860', 21, 12, 16, 2); R('#0a0407', 26, 17, 6, 7); R('#ff7a30', 27, 18, 4, 6); R('#05030a', 28, 18, 2, 6);
    R('#4a2a1a', 11, 15, 4, 6); R('#d8a060', 12, 16, 2, 3); R('#4a2a1a', 43, 15, 4, 6); R('#d8a060', 44, 16, 2, 3); R('#0c0307', 0, 21, W, 3); }
  else if (id === 'cinema') { R('#1a0709', 0, 0, W, H); for (let i = 0; i < 40; i++) R(i % 2 ? '#2a0c10' : '#12060a', (i * 17) % W, (i * 7) % 20, 2, 1);
    R('#080204', 0, 0, W, 3); for (const sx of [8, 20, 40, 50]) R('#080204', sx, 3, 3, 3 + (sx % 4)); R('#080204', 24, 3, 2, 8);
    R('#c8bc9e', 17, 4, 28, 12); R('#a89a78', 17, 4, 28, 1); R('#e8dcc0', 19, 6, 24, 8); R('#4a2a1a', 14, 3, 1, 3); R('#4a2a1a', 47, 3, 1, 3);
    R('#5a0c12', 0, 6, 11, 18); R('#c0401e', 0, 10, 8, 10); R('#ffa040', 0, 13, 5, 7); R('#0c0307', 0, 21, W, 3);
    for (let i = 0; i < 6; i++) R('#701c24', 13 + i * 7, 18, 5, 3); }
  else if (id === 'chateau') { R('#5a0c12', 0, 0, W, H); R('#a02818', 0, 14, W, 6); D('#040102', 34, 8, 6); x.fillStyle = '#ff8a30'; for (let a = 0; a < 6.3; a += .3) x.fillRect(34 + Math.round(Math.cos(a) * 8), 8 + Math.round(Math.sin(a) * 8), 1, 1);
    R('#0a0407', 24, 8, 20, 16); for (let i = 0; i < 10; i++) R('#0a0407', 33 + (i >> 1) - (i >> 1) , 0, 1, 1); R('#0a0407', 33, 0, 3, 8); R('#0a0407', 12, 12, 10, 12); R('#0a0407', 46, 10, 10, 14); R('#0a0407', 14, 8, 6, 4); R('#0a0407', 48, 6, 6, 4); R('#e8a040', 32, 11, 1, 3); R('#e8a040', 37, 14, 1, 3); R('#e8a040', 16, 16, 1, 3); R('#e8a040', 51, 15, 1, 3); R('#c03020', 30, 17, 8, 7); R('#05020a', 31, 19, 6, 5); }
  else if (id === 'trone') { R('#2a1418', 0, 0, W, H); R('#3a1c20', 0, 14, W, 10); R('#701c24', 20, 14, 18, 10); R('#16080c', 24, 3, 10, 14); R('#c9a24a', 24, 3, 10, 1); R('#c9a24a', 23, 3, 1, 14); R('#c9a24a', 34, 3, 1, 14); R('#701c24', 26, 6, 6, 8); R('#c9a24a', 22, 15, 14, 2);
    R('#e0a040', 6, 6, 2, 4); R('#e0a040', 50, 6, 2, 4); R('#f4d070', 6, 5, 2, 1); R('#f4d070', 50, 5, 2, 1); }
  else if (id === 'caveau') { R('#100c12', 0, 0, W, H); R('#2a2030', 17, 2, 24, 22); R('#0a070c', 20, 5, 18, 19); R('#3c3044', 17, 2, 24, 2); R('#c9a24a', 27, 12, 4, 4);
    D('#5a3a1a', 7, 18, 4); R('#2a1a0a', 3, 18, 9, 1); D('#5a3a1a', 50, 18, 4); R('#2a1a0a', 46, 18, 9, 1); R('#4a3a5a', 0, 22, W, 2); }
  else if (id === 'catacombes') { R('#0a0a0e', 0, 0, W, H); x.fillStyle = '#5a5648';
    [[2, 2, 54, 1], [2, 2, 1, 20], [2, 21, 54, 1], [55, 2, 1, 20], [8, 2, 1, 13], [8, 8, 14, 1], [14, 14, 1, 8], [14, 14, 20, 1], [22, 8, 1, 7], [28, 2, 1, 7], [28, 8, 14, 1], [34, 14, 1, 8], [41, 8, 1, 7], [41, 14, 8, 1], [48, 4, 1, 11]].forEach(([a, b, w, h]) => x.fillRect(a, b, w, h));
    R('#e0a040', 5, 17, 2, 2); R('#f4d070', 5, 16, 2, 1); }
  else if (id === 'sommet') { R('#3a060c', 0, 0, W, H); R('#7a1214', 0, 12, W, 12); D('#040102', 29, 8, 7); x.fillStyle = '#ff8a30'; for (let a = 0; a < 6.3; a += .25) x.fillRect(29 + Math.round(Math.cos(a) * 9), 8 + Math.round(Math.sin(a) * 9), 1, 1);
    R('#ffc870', 29, 16, 1, 8); R('#120408', 0, 20, W, 4); R('#050203', 0, 15, 14, 9); R('#050203', 46, 14, 12, 10); R('#050203', 6, 4, 18, 1); R('#050203', 14, 4, 1, 20); R('#050203', 16, 8, 8, 1); R('#050203', 8, 11, 6, 1); }
  else { R('#1c0c10', 0, 0, W, H); R('#e8dcae', 10, 2, 38, 12); R('#c8b888', 10, 2, 38, 1); R('#8a7a50', 10, 13, 38, 1);
    for (let j = 0; j < 3; j++) for (let i = 0; i < 6; i++) R('#701c24', 5 + i * 9 + j * 2, 16 + j * 3, 7, 3); }
}

/* ---- construction (une fois) ---- */
const MAP_EL = {};
(function buildMap() {
  const ns = 'http://www.w3.org/2000/svg';
  // boussole
  const cmp = document.createElementNS(ns, 'g'); cmp.setAttribute('transform', 'translate(262 17)'); cmp.setAttribute('opacity', '.8');
  cmp.innerHTML = '<circle r="11" fill="none" stroke="#6b4420" stroke-width=".8"/><circle r="8.5" fill="none" stroke="#6b4420" stroke-width=".4" stroke-dasharray="1 1"/><path d="M0-12L2.2 0 0 12-2.2 0Z" fill="#8c2a22"/><path d="M-12 0L0 2.2 12 0 0-2.2Z" fill="#6b4420"/><text y="-13" text-anchor="middle" font-size="5" font-weight="700" fill="#3a2410" font-family="Pixelify Sans,Verdana,sans-serif">N</text>';
  mapSvg.appendChild(cmp);
  MAP_LINKS.forEach(([a, b], k) => {
    const A = MAP_NODES.find(n => n.id === a), B = MAP_NODES.find(n => n.id === b), d = `M${A.x} ${A.y}L${B.x} ${B.y}`, mid = 'mk' + k;
    const m = document.createElementNS(ns, 'mask'); m.id = mid; m.setAttribute('maskUnits', 'userSpaceOnUse'); m.setAttribute('x', 0); m.setAttribute('y', 0); m.setAttribute('width', 280); m.setAttribute('height', 136);
    m.innerHTML = `<path d="${d}" stroke="#fff" stroke-width="6" fill="none" pathLength="1" class="dr" style="animation-delay:${.75 + k * .1}s"/>`; mapSvg.appendChild(m);
    const p = document.createElementNS(ns, 'path'); p.setAttribute('d', d); p.setAttribute('class', 'tr'); p.setAttribute('mask', `url(#${mid})`); mapSvg.appendChild(p); });
  MAP_NODES.forEach((n, i) => {
    const el = document.createElement('div'); el.className = 'mn'; el.style.left = `calc(var(--s)*${n.x}px)`; el.style.top = `calc(var(--s)*${n.y}px)`; el.style.setProperty('--i', i);
    const cv = document.createElement('canvas'); cv.width = 58; cv.height = 24; cv.className = 'px'; mapThumb(n.id, cv);
    const nm = document.createElement('span'); nm.className = 'mname'; nm.textContent = n.id === 'remparts' ? 'La Clairière' : ROOMNAMES[n.id];
    const seal = document.createElement('b'); seal.className = 'mseal zero'; seal.textContent = '0';
    el.append(cv, nm, seal); mapArea.appendChild(el); MAP_EL[n.id] = { el, seal, n: 0 }; });
})();

/* ---- joueurs par salle : les autres joueurs + moi (les PNJ ne comptent pas) ---- */
function mapCounts() {
  const c = {}; for (const id in ROOMNAMES) c[id] = 0;
  for (const r of remotes.values()) if (c[r.room] !== undefined) c[r.room]++;
  if (player && c[curRoom.id] !== undefined) c[curRoom.id]++;
  return c;
}
function refreshMap() {
  const c = mapCounts(); let tot = 0;
  for (const id in MAP_EL) { const m = MAP_EL[id], n = c[id] || 0; tot += n;
    m.el.classList.toggle('here', !!player && curRoom.id === id);
    if (n !== m.n) { m.n = n; m.seal.textContent = n; m.seal.classList.toggle('zero', n === 0); m.seal.classList.remove('bump'); void m.seal.offsetWidth; m.seal.classList.add('bump'); } }
  document.getElementById('mapTot').textContent = tot + (tot > 1 ? ' âmes en ligne' : ' âme en ligne');
}
function tornEdges() {
  const pts = ['0% 0%', '100% 0%']; for (let y = 0; y <= 100; y += 4) pts.push(`${100 - Math.random() * 1.1}% ${y}%`);
  pts.push('100% 100%', '0% 100%'); for (let y = 100; y >= 0; y -= 4) pts.push(`${Math.random() * 1.1}% ${y}%`);
  scrollEl.querySelector('.paper').style.clipPath = `polygon(${pts.join(',')})`;
}
function paperSfx() { try { audioInit(); noise(.45, { type: 'bandpass', f: 2200, q: .6, v: .05, sweep: -1.2 }); noise(.3, { type: 'lowpass', f: 400, v: .06, when: .05 }); } catch (e) { } }
let mapTimer = 0, mapCloseT = 0;
function openMap() {
  if (!player || mapM.style.display === 'flex' || menuOpen) return;
  clearTimeout(mapCloseT); tornEdges(); refreshMap(); openModal('mapM');
  scrollEl.className = ''; void scrollEl.offsetWidth; scrollEl.className = 'open'; paperSfx(); mapKey = '';
  clearInterval(mapTimer); mapTimer = setInterval(refreshMap, 700);
}
function closeMap() {
  if (mapM.style.display !== 'flex' || scrollEl.classList.contains('close')) return;
  clearInterval(mapTimer); scrollEl.className = 'close'; paperSfx();
  mapCloseT = setTimeout(() => { closeModal('mapM'); scrollEl.className = ''; mapKey = ''; }, 700);
}
function mapHardClose() { clearInterval(mapTimer); clearTimeout(mapCloseT); mapM.style.display = 'none'; scrollEl.className = ''; mapKey = ''; }
mapBtn.addEventListener('click', () => { mapBtn.blur(); sfx.click(); mapM.style.display === 'flex' ? closeMap() : openMap(); });
document.getElementById('mapX').addEventListener('click', () => { sfx.click(); closeMap(); });
mapM.addEventListener('mousedown', ev => { if (!ev.target.closest('#scroll')) closeMap(); });
addEventListener('keydown', ev => {
  if (typing()) return;
  if (ev.key === 'Escape') { closeMap(); return; }
  if (ev.code === 'KeyN' && player && !ev.ctrlKey && !ev.metaKey && !ev.altKey) { if (mapM.style.display === 'flex') closeMap(); else openMap(); }
});
