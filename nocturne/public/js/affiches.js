"use strict";
// Les affiches du cinéma en plein air (cinema.js) : le panneau « PROCHAINEMENT », la fiche d'un film et le programme.
// - Lues depuis le serveur : GET /api/affiches (fichier config/affiches.json, relu sans redémarrer). Sans serveur : AFFICHES_DEFAUT.
// - Chaque affiche : { titre, sortie, genre, resume, image, couleur, motif }.
//   image = chemin dans public/ (ex. "affiches/bal-des-ombres.png") ; sans image, une affiche pixel art est dessinée
//   avec la couleur et le motif (lune, corbeau, masque, lanterne, chateau).
// - « cinema » est le nom écrit sur l'enseigne suspendue au-dessus de l'écran.

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
