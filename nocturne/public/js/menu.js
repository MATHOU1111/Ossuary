"use strict";
// Le site autour du jeu, façon Blablaland :
// - barre du haut : Boutique · JOUER (au centre) · Profil, et le compte à droite ;
// - colonne de gauche : mon personnage (aperçu animé, niveau, or) + raccourcis du compte ;
// - colonne de droite : joueurs en ligne, commandes, astuce ;
// - au centre, une « page » à la fois : Accueil, Boutique, Profil (garde-robe, carnet, compte) ou le lecteur du jeu.
// En arrivant, le jeu n'est pas lancé : il faut cliquer sur JOUER → le lecteur apparaît avec un écran de chargement, puis ça part.
// Pendant une partie, on peut aller dans la Boutique ou le Profil : le personnage reste dans le monde, JOUER y ramène.

const $m = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const accueilEl = $m('accueil'), chargeEl = $m('charge');
const PAGES = { accueil: $m('pgAccueil'), boutique: $m('pgBoutique'), profil: $m('pgProfil'), admin: $m('pgAdmin'), jeu: $m('pgJeu') };
const estAdmin = () => !!COMPTE.user && COMPTE.user.role === 'admin';   // (le serveur vérifie de son côté à chaque appel)
const attendre = ms => new Promise(r => setTimeout(r, ms));

/* ---------------- logos ---------------- */
function logoPetit(cv) { const t = txt('OSSUARY', '#e8c860', '#05060a'), c = cv.getContext('2d');
  cv.width = t.width + 11; cv.height = 11; c.fillStyle = '#05060a'; disc(c, 5, 5, 5); c.fillStyle = '#f2e8d0'; disc(c, 5, 5, 4);
  c.globalCompositeOperation = 'destination-out'; disc(c, 8, 4, 4); c.globalCompositeOperation = 'source-over'; c.fillStyle = '#e8c860'; c.fillRect(8, 8, 1, 1); c.drawImage(t, 10, 2); }
for (const id of ['logo', 'logo3']) logoPetit($m(id));
function grandLogo(cv) { // lettres 3×5 grossies ×2, ombre portée, lune et chauves-souris
  const c = cv.getContext('2d'), s = 'OSSUARY', LW = textW(s) * 2 + 6; cv.width = LW + 26; cv.height = 26;
  const glyphs = (col, ox, oy) => { c.fillStyle = col; for (let i = 0; i < s.length; i++) { const g = GL[s[i]]; for (let p = 0; p < 15; p++) if (g[p] === '1') c.fillRect(22 + ox + i * 8 + (p % 3) * 2, 8 + oy + (p / 3 | 0) * 2, 2, 2); } };
  for (const [a, b] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, 1], [1, -1], [-1, 1], [2, 2], [1, 2], [2, 1]]) glyphs('#05060a', a, b);
  glyphs('#9a7428', 0, 1); glyphs('#e8c860', 0, 0);
  c.fillStyle = '#fff4c8'; for (let i = 0; i < s.length; i++) { const g = GL[s[i]]; for (let p = 0; p < 3; p++) if (g[p] === '1') c.fillRect(22 + i * 8 + p * 2, 8, 2, 1); }
  c.fillStyle = '#05060a'; disc(c, 10, 12, 9); c.fillStyle = '#f2e8d0'; disc(c, 10, 12, 8); c.fillStyle = '#d8ccb4'; c.fillRect(6, 13, 2, 2); c.fillRect(11, 8, 2, 1);
  c.globalCompositeOperation = 'destination-out'; disc(c, 14, 10, 7); c.globalCompositeOperation = 'source-over';
  c.fillStyle = '#05060a'; for (const [bx, by] of [[cv.width - 8, 3], [cv.width - 15, 1]]) { c.fillRect(bx - 2, by, 2, 1); c.fillRect(bx + 1, by, 2, 1); c.fillRect(bx, by + 1, 1, 1); }
}
grandLogo($m('hLogo')); grandLogo($m('chLogo'));

/* ================= pages ================= */
let pageCour = 'accueil', prTab = 'garde', bqTab = 'acc', veutJouer = false, veutPage = null;
const modaleOuverte = () => ['helpM', 'cineM', 'affM', 'bienvM', 'mapM', 'socM', 'rayonM', 'caisseM'].some(id => { const el = $m(id); return el && el.style.display === 'flex'; });
function page(id, tab) {
  if ((id === 'boutique' || id === 'profil') && !COMPTE.user) { veutPage = [id, tab]; ouvrirConnexion('connexion', 'Connecte-toi pour ouvrir ' + (id === 'boutique' ? 'la boutique.' : 'ton profil.')); return; }
  if (id === 'jeu' && !player && !CHARGE.actif) id = 'accueil';
  if (id === 'admin' && !estAdmin()) id = 'accueil';
  if (tab) prTab = tab;
  pageCour = id;
  for (const [k, el] of Object.entries(PAGES)) el.classList.toggle('on', k === id);
  document.querySelectorAll('[data-page]').forEach(b => b.classList.toggle('on', b.dataset.page === id && (!b.dataset.tab || b.dataset.tab === prTab)));
  $m('topJouer').classList.toggle('on', id === 'jeu'); document.body.classList.toggle('enJeu', id === 'jeu');
  tipEl.style.display = 'none';
  if (id === 'jeu') menuOpen = CHARGE.actif || modaleOuverte();
  else { menuOpen = true; keys.clear(); if (typing()) document.activeElement.blur(); }
  renderPages(); if (typeof resize === 'function') resize();   // resize() vient de main.js, chargé après
}
document.querySelectorAll('[data-page]').forEach(b => b.onclick = () => { sfx.click(); page(b.dataset.page, b.dataset.tab); });
document.querySelectorAll('[data-acc]').forEach(b => b.onclick = () => { sfx.click(); ouvrirConnexion(b.dataset.acc); });
$m('topJouer').onclick = $m('hJouer').onclick = () => { sfx.click(); jouer(); };

// tout ce qui dépend du compte : barre du haut, colonne de gauche, page courante
function renderPages() {
  const u = COMPTE.user;
  $m('hCompte').innerHTML = u ? `<span>Bonsoir, <b>${esc(u.name)}</b>${estAdmin() ? ' <i class="badgeAdmin">admin</i>' : ''}</span><button type="button" class="lien" id="hDeco">Se déconnecter</button>`
    : '<button type="button" class="btn" id="hCo">Se connecter</button><button type="button" class="btn gold" id="hIns">Créer un compte</button>';
  if (u) $m('hDeco').onclick = () => { sfx.click(); seDeconnecter(); };
  else { $m('hCo').onclick = () => { sfx.click(); ouvrirConnexion('connexion'); }; $m('hIns').onclick = () => { sfx.click(); ouvrirConnexion('inscription'); }; }
  $m('sgNav').style.display = u ? '' : 'none'; $m('sgInvite').style.display = u ? 'none' : ''; $m('sgBourse').style.display = $m('sgXp').style.display = u ? '' : 'none';
  $m('sgAdmin').style.display = estAdmin() ? '' : 'none';
  if (pageCour === 'admin' && !estAdmin()) { page('accueil'); return; }
  majCarte(true);
  updatePanel();
  if (pageCour === 'admin') renderAdmin($m('adContenu'));
  if (pageCour === 'boutique' && u) { const box = $m('bqContenu'); box.innerHTML = ''; renderBoutique(box); }
  if (pageCour === 'profil' && u) {
    document.querySelectorAll('#prTabs button').forEach(b => b.classList.toggle('on', b.dataset.t === prTab));
    const box = $m('prContenu'); box.innerHTML = ''; box.className = 'mnBox mn-' + prTab;
    if (prTab === 'garde') renderGarde(box); else if (prTab === 'carnet') renderCarnet(box); else renderCompte(box);
  }
}
document.querySelectorAll('#prTabs button').forEach(b => b.onclick = () => { sfx.click(); page('profil', b.dataset.t); });

/* colonne de gauche : aperçu du personnage, niveau, XP (mis à jour pendant la partie) */
let carteCle = '';
function majCarte(force) {
  const u = COMPTE.user, cle = u ? [u.name, PROG.lvl, PROG.xp, u.look.skin, u.look.color, u.look.acc].join('|') : '-';
  if (!force && cle === carteCle) return; carteCle = cle;
  if (!u) { $m('mnNom').textContent = 'Visiteur'; setSkin(mnEnt, 'capuche', REGLES.COULEURS_BASE[0]); mnEnt.acc = null; return; }
  $m('mnNom').textContent = u.name; $m('mnNiv').textContent = 'Niv. ' + PROG.lvl;
  $m('mnXpBar').style.width = Math.round(100 * PROG.xp / need(PROG.lvl)) + '%'; $m('mnXpT').textContent = `${PROG.xp} / ${need(PROG.lvl)} XP avant le niveau ${PROG.lvl + 1}`;
  if (mnEnt.skin !== u.look.skin || mnEnt.color !== u.look.color) setSkin(mnEnt, u.look.skin, u.look.color);
  mnEnt.acc = u.look.acc;
}

/* « En ce moment » et astuce */
function majStatut() {
  if (COMPTE.local) { $m('hStat').textContent = 'Mode hors-ligne : les comptes sont gardés dans ce navigateur.'; return; }
  fetch('api/statut', { cache: 'no-store' }).then(r => r.json()).then(d => { $m('hStat').innerHTML = `<i></i><b>${d.enLigne}</b> joueur${d.enLigne > 1 ? 's' : ''} en ligne<br><span>${d.comptes} inscrit${d.comptes > 1 ? 's' : ''}</span>`; })
    .catch(() => { $m('hStat').textContent = 'Serveur injoignable.'; });
}
setInterval(majStatut, 20000);
const ASTUCES = ['Chaque niveau rapporte des pièces d’or à dépenser dans la Boutique.', 'Derrière le portrait de la salle du trône se cache un passage…',
  'Cinq reliques sont cachées chaque jour dans les catacombes. Attention au Gardien !', 'Assieds-toi près du feu de Lysandre, sur le Sommet : l’XP y vient plus vite.',
  'Touche F : le phénix noir t’emmène où tu veux.', 'Écris /mp pseudo message pour parler en privé à un ami.', 'Au cinéma, tous les spectateurs voient le film en même temps.',
  'Touche N : la carte du royaume et les salles déjà découvertes.'];
$m('astuce').textContent = ASTUCES[Math.random() * ASTUCES.length | 0];

/* ================= accueil (vignettes animées) ================= */
const homeBg = $m('homeBg'), homeBx = homeBg.getContext('2d'); homeBg.width = W; homeBg.height = H;
const hnEnt = makeEnt('', REGLES.COULEURS_BASE[3], 18, 'preview', 'capuche'); hnEnt.room = 'preview'; hnEnt.y = 41;
const hnEnt2 = makeEnt('', '#e0b53a', 18, 'preview', 'scaphandre'); hnEnt2.room = 'preview'; hnEnt2.y = 41;
function homeTick(dt) {
  homeBx.drawImage(cv, 0, 0);   // le monde vit derrière le titre
  const c1 = $m('hn1').getContext('2d'), c2 = $m('hn2').getContext('2d'), c3 = $m('hn3').getContext('2d');
  c1.fillStyle = '#121a2a'; c1.fillRect(0, 0, 64, 40); c1.fillStyle = '#1e2a40'; c1.fillRect(0, 34, 64, 6);
  for (let i = 0; i < 6; i++) { const x = (i * 23 - time * 140) % 80 + 72; c1.fillStyle = '#2c3a54'; c1.fillRect(Math.round(x % 80) - 8, 35, 3, 1); }
  const ph = time % 4; hnEnt.fakeSpd = ph < 2.9 ? 140 : 0; hnEnt.ground = true; hnEnt.face = 1; hnEnt.x = 18; hnEnt.y = 41;
  if (ph > 2.9 && hnEnt._sl !== Math.floor(time / 4)) { hnEnt._sl = Math.floor(time / 4); hnEnt.slideT = .55; }
  const tour = Math.floor(time / 8) % 2, he = tour ? hnEnt2 : hnEnt;   // la Capuche, puis le Prospecteur
  if (tour) { const p2 = time % 8 - 4; he.fakeSpd = p2 < 2 ? 62 : 0; if (p2 > 2) { he.idleT = 6 + p2; } }
  updateAnim(he, dt); if (tour && he.fakeSpd === 0) he.idleT = Math.max(he.idleT, 5); drawPetit(he); c1.drawImage(sc, 32 - BOX, 35 - BOY);
  c2.fillStyle = '#16141e'; c2.fillRect(0, 0, 64, 40); c2.fillStyle = '#221e2c'; for (let y = 0; y < 40; y += 5) for (let x = (y / 5 % 2) * 6; x < 64; x += 12) c2.fillRect(x, y, 11, 4);
  const gl = c2.createRadialGradient(32, 20, 0, 32, 20, 22); gl.addColorStop(0, `rgba(255,200,110,${.45 + .1 * Math.sin(time * 3)})`); gl.addColorStop(1, 'rgba(255,200,110,0)'); c2.fillStyle = gl; c2.fillRect(0, 0, 64, 40);
  c2.drawImage(RELICS[((Math.floor(time / 1.5) % 5) + 5) % 5].spr, 0, 0, 9, 9, 23, 11 + Math.round(Math.sin(time * 2.5)), 18, 18);
  c3.fillStyle = '#2a1018'; c3.fillRect(0, 0, 64, 40); c3.fillStyle = '#c9a24a'; c3.fillRect(0, 0, 64, 2); c3.fillRect(0, 38, 64, 2);
  AFF.art.slice(0, 3).forEach((a, i) => { c3.fillStyle = '#05030a'; c3.fillRect(5 + i * 19, 6, 16, 26); c3.drawImage(a.mini, 6 + i * 19, 7, 14, 21);
    c3.fillStyle = (Math.floor(time * 5) + i) % 3 ? '#fff2b0' : '#5a4a2a'; c3.fillRect(12 + i * 19, 34, 2, 1); });
}

/* ================= connexion ================= */
let accMode = 'connexion';
function modeAccueil(m) { accMode = m; document.querySelectorAll('.accTabs button').forEach(b => b.classList.toggle('on', b.dataset.m === m));
  $m('accMdp2L').style.display = m === 'inscription' ? '' : 'none'; $m('accGo').textContent = m === 'inscription' ? 'Créer mon compte' : 'Se connecter';
  $m('accMdp').autocomplete = m === 'inscription' ? 'new-password' : 'current-password'; $m('accErr').textContent = ''; }
document.querySelectorAll('.accTabs button').forEach(b => b.onclick = () => { sfx.click(); modeAccueil(b.dataset.m); $m('accNom').focus(); });
function ouvrirConnexion(mode, msg) { accueilEl.style.display = 'flex'; modeAccueil(mode || accMode);
  $m('accMsg').textContent = msg || ''; $m('accMdp').value = ''; $m('accMdp2').value = '';
  setTimeout(() => ($m('accNom').value ? $m('accMdp') : $m('accNom')).focus(), 60); }
function fermerConnexion() { accueilEl.style.display = 'none'; veutJouer = false; veutPage = null; }
$m('accX').onclick = () => { sfx.click(); fermerConnexion(); };
accueilEl.addEventListener('mousedown', e => { if (e.target === accueilEl) fermerConnexion(); });
addEventListener('keydown', e => { if (e.key === 'Escape' && accueilEl.style.display === 'flex') fermerConnexion(); });
$m('accNote').textContent = COMPTE.local ? 'Mode hors-ligne : ton compte est gardé dans ce navigateur. Lance le serveur pour jouer à plusieurs.' : '';
$m('accForm').addEventListener('submit', async ev => { ev.preventDefault(); audioInit();
  const name = $m('accNom').value.trim(), pass = $m('accMdp').value, err = $m('accErr');
  if (!REGLES.nomValide(name)) { err.textContent = 'Pseudo : 3 à 14 lettres, chiffres, - ou _ (sans espace).'; return; }
  if (!REGLES.mdpValide(pass)) { err.textContent = 'Mot de passe : 4 caractères minimum.'; return; }
  if (accMode === 'inscription' && pass !== $m('accMdp2').value) { err.textContent = 'Les deux mots de passe ne sont pas identiques.'; return; }
  $m('accGo').disabled = true; err.textContent = '';
  const r = await api(accMode, { name, pass }); $m('accGo').disabled = false;
  if (!r.token) { err.textContent = r.error || 'Erreur inconnue.'; sfx.click(); return; }
  LS.set('nocturne-nom', r.user.name);
  await compteOuvrir(r.token, r.user); majStatut();
  const jouerApres = veutJouer, pageApres = veutPage; fermerConnexion();
  if (accMode === 'inscription') { page('profil', 'garde'); toast(`Bienvenue à Ossuary, <b>${esc(r.user.name)}</b> ! Choisis ton personnage, puis clique sur <b>Jouer</b>.`); }
  else if (jouerApres) jouer();
  else if (pageApres) page(pageApres[0], pageApres[1]);
  else renderPages();
});
async function seDeconnecter() { if (player || CHARGE.actif) quitterPartie(); await compteFermer(); page('accueil'); }

/* ================= profil et boutique ================= */
const mnEnt = makeEnt('', REGLES.COULEURS_BASE[0], 18, 'preview'); mnEnt.room = 'preview'; mnEnt.y = 41;
const mnCtx = $m('mnPerso').getContext('2d'); mnCtx.imageSmoothingEnabled = false;
let mnT = 0;
const mini = (color, acc, skin) => { const cv = document.createElement('canvas'); cv.className = 'px'; cardPreview(cv, color, acc, skin || COMPTE.user.look.skin); return cv; };
async function changer(body) {
  const r = await api('apparence', body); if (r.user) appliquerCompte(r.user, false);
  if (r.error) toast(r.error);
  mnEnt.waveT = 1.6; renderPages();
}

/* garde-robe : ce que l'on possède */
function renderGarde(box) {
  const u = COMPTE.user, dispo = REGLES.couleursDispo(u);
  box.insertAdjacentHTML('beforeend', '<h3>Personnage</h3>');
  const pk = document.createElement('div'); pk.className = 'grAcc grSkins';
  for (const sk of REGLES.SKINS) { const b = document.createElement('button'); b.type = 'button'; b.className = 'grTile' + (u.look.skin === sk.id ? ' on' : '');
    b.appendChild(mini(u.look.color, u.look.acc, sk.id)); b.insertAdjacentHTML('beforeend', `<span>${esc(sk.name)}</span>`);
    b.onclick = () => { sfx.click(); if (u.look.skin !== sk.id) changer({ skin: sk.id }); }; pk.appendChild(b); }
  box.appendChild(pk);
  box.insertAdjacentHTML('beforeend', `<h3>${(SKINS[u.look.skin] || SKINS.capuche).swatch}</h3>`);
  const sw = document.createElement('div'); sw.className = 'grSw';
  for (const c of [...REGLES.COULEURS_BASE, ...SHOP.filter(i => i.type === 'color').map(i => i.color)]) {
    const it = SHOP.find(i => i.color === c), own = dispo.includes(c), b = document.createElement('button'); b.type = 'button';
    b.style.background = c; b.className = (c === u.look.color ? 'on' : '') + (own ? '' : ' lock');
    tipOn(b, own ? (it ? `<b>${it.name}</b>` : '<b>Couleur de base</b>') : `<b>${it.name}</b> · en boutique, ${it.price} pièces d’or`);
    b.onclick = () => { sfx.click(); if (own) { if (c !== u.look.color) changer({ color: c }); } else { bqTab = 'color'; page('boutique'); } };
    sw.appendChild(b); }
  box.appendChild(sw);
  box.insertAdjacentHTML('beforeend', '<h3>Accessoire</h3>');
  const g = document.createElement('div'); g.className = 'grAcc';
  for (const it of [{ id: null, name: 'Aucun' }, ...SHOP.filter(i => i.type === 'acc')]) {
    const own = it.id === null || PROG.owned[it.id], b = document.createElement('button'); b.type = 'button';
    b.className = 'grTile' + (u.look.acc === it.id ? ' on' : '') + (own ? '' : ' lock');
    b.appendChild(mini(u.look.color, it.id)); b.insertAdjacentHTML('beforeend', `<span>${esc(it.name)}</span>`);
    if (!own) tipOn(b, `En boutique · <b>${it.price}</b> pièces d’or` + (PROG.lvl < it.lvl ? ` · niveau ${it.lvl}` : ''));
    b.onclick = () => { sfx.click(); if (own) { if (u.look.acc !== it.id) changer({ acc: it.id }); } else { bqTab = 'acc'; page('boutique'); } };
    g.appendChild(b); }
  box.appendChild(g);
  box.insertAdjacentHTML('beforeend', '<p class="grAstuce">Les couleurs et accessoires avec un cadenas s\'achètent dans la <b>Boutique</b>, avec les pièces d’or gagnées en jouant (chaque niveau, les reliques des catacombes…).</p>');
}

/* boutique : ce que l'on peut acheter */
function renderBoutique(box) {
  const u = COMPTE.user;
  const tabs = document.createElement('div'); tabs.className = 'shopTabs';
  for (const [t, l] of [['acc', 'Accessoires'], ['color', 'Couleurs']]) { const b = document.createElement('button'); b.type = 'button'; b.textContent = l; b.className = bqTab === t ? 'on' : ''; b.onclick = () => { sfx.click(); bqTab = t; renderPages(); }; tabs.appendChild(b); }
  box.appendChild(tabs);
  const grid = document.createElement('div'); grid.id = 'items';
  for (const it of SHOP.filter(s => s.type === bqTab)) {
    const own = !!PROG.owned[it.id], locked = PROG.lvl < it.lvl, worn = it.type === 'acc' ? u.look.acc === it.id : u.look.color === it.color;
    const card = document.createElement('div'); card.className = 'card' + (worn ? ' eq' : '');
    card.appendChild(mini(it.type === 'color' ? it.color : u.look.color, it.type === 'acc' ? it.id : u.look.acc));
    card.insertAdjacentHTML('beforeend', `<div class="nm">${esc(it.name)}</div><div class="ds">${esc(it.desc)}</div>`);
    const pr = document.createElement('div'); pr.className = 'pr'; const ic = document.createElement('canvas'); ic.className = 'px'; paintIcon(ic, 'shard'); pr.appendChild(ic); pr.append(own ? 'Possédé' : String(it.price)); card.appendChild(pr);
    const b = document.createElement('button'); b.type = 'button'; b.className = 'btn' + (!own && !locked && PROG.shards >= it.price ? ' gold' : '');
    if (own) { b.textContent = worn ? 'Porté' : 'Porter'; b.disabled = worn; b.onclick = () => changer(it.type === 'acc' ? { acc: it.id } : { color: it.color }); }
    else if (locked) { b.textContent = `Niveau ${it.lvl}`; b.disabled = true; }
    else { b.textContent = PROG.shards >= it.price ? 'Acheter' : `Il manque ${it.price - PROG.shards}`; b.disabled = PROG.shards < it.price; b.onclick = () => acheter(it, b); }
    card.appendChild(b); grid.appendChild(card); }
  box.appendChild(grid);
}
async function acheter(it, b) {
  b.disabled = true; await compteSauver(true);
  const r = await api('acheter', { id: it.id }); if (r.user) appliquerCompte(r.user, false);
  if (r.error) { toast(r.error); renderPages(); return; }
  [76, 81, 88, 93].forEach((m, i) => tone(mtof(m), .5, { type: 'sine', v: .08, when: i * .07, wet: .6 }));
  toast(`Acheté : <b>${esc(it.name)}</b>, déjà sur toi !`);
  mnEnt.waveT = 1.6; mnSparks = 1; renderPages();
}

/* carnet : où on en est */
function renderCarnet(box) {
  const u = COMPTE.user, salles = Object.keys(ROOMNAMES), vues = salles.filter(k => PROG.rooms[k]).length, rel = Object.keys(PROG.relics || {}).length;
  const d = new Date(u.created).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  box.insertAdjacentHTML('beforeend', `<dl class="crStats">
    <dt>Niveau</dt><dd>${PROG.lvl}</dd><dt>Pièces d’or</dt><dd>${PROG.shards}</dd>
    <dt>Objets</dt><dd>${Object.keys(PROG.owned).length} / ${SHOP.length}</dd><dt>Membre depuis le</dt><dd>${d}</dd></dl>
    <h3>Salles découvertes · ${vues} / ${salles.length}</h3>
    <div class="crSalles">${salles.map(k => `<span class="${PROG.rooms[k] ? 'ok' : ''}">${PROG.rooms[k] ? esc(ROOMNAMES[k]) : '???'}</span>`).join('')}</div>
    <h3>Reliques des catacombes · ${rel} / 5</h3><div class="crRel" id="crRel"></div>`);
  const rr = $m('crRel'); RELICS.forEach((r, i) => { const cv = document.createElement('canvas'); cv.width = 9; cv.height = 9; cv.className = 'px' + (PROG.relics[i] ? '' : ' lock');
    cv.getContext('2d').drawImage(PROG.relics[i] ? r.spr : r.dark, 0, 0); tipOn(cv, PROG.relics[i] ? `<b>${r.name}</b>` : '???'); rr.appendChild(cv); });
}

/* compte : options */
function renderCompte(box) {
  const u = COMPTE.user, d = new Date(u.created).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  box.insertAdjacentHTML('beforeend', `<h3>Mon compte</h3>
    <dl class="crStats"><dt>Pseudo</dt><dd>${esc(u.name)}</dd><dt>Membre depuis le</dt><dd>${d}</dd>
      <dt>Enregistré</dt><dd>${COMPTE.local ? 'dans ce navigateur (hors-ligne)' : 'sur le serveur'}</dd></dl>
    <h3>Son</h3>
    <div class="cpLigne"><button type="button" class="btn" id="cpSon"></button><span class="cpAide">Touche <kbd>M</kbd> en jeu.</span></div>
    <h3>Changer le mot de passe</h3>
    <form class="cpForm" id="cpMdp" autocomplete="on">
      <input type="text" name="username" autocomplete="username" value="${esc(u.name)}" hidden>
      <label>Mot de passe actuel<input type="password" id="cpAncien" maxlength="64" autocomplete="current-password"></label>
      <label>Nouveau mot de passe<input type="password" id="cpNouveau" maxlength="64" autocomplete="new-password"></label>
      <label>Confirme le nouveau<input type="password" id="cpNouveau2" maxlength="64" autocomplete="new-password"></label>
      <div class="cpMsg" id="cpMsg"></div>
      <button type="submit" class="btn gold">Enregistrer</button>
    </form>
    <h3>Session</h3>
    <div class="cpLigne"><button type="button" class="btn" id="cpDeco">Se déconnecter</button><span class="cpAide">Les autres appareils restent connectés.</span></div>`);
  const son = $m('cpSon'), majSon = () => { son.textContent = SND.on ? 'Son : activé' : 'Son : coupé'; son.classList.toggle('gold', SND.on); };
  majSon(); son.onclick = () => { audioInit(); setSound(!SND.on); sfx.click(); majSon(); };
  $m('cpDeco').onclick = () => { sfx.click(); seDeconnecter(); };
  $m('cpMdp').addEventListener('submit', async ev => { ev.preventDefault();
    const ancien = $m('cpAncien').value, nouveau = $m('cpNouveau').value, msg = $m('cpMsg'); msg.className = 'cpMsg';
    if (!REGLES.mdpValide(nouveau)) { msg.textContent = 'Nouveau mot de passe : 4 caractères minimum.'; return; }
    if (nouveau !== $m('cpNouveau2').value) { msg.textContent = 'Les deux nouveaux mots de passe ne sont pas identiques.'; return; }
    const r = await api('motdepasse', { ancien, nouveau });
    if (r.error) { msg.textContent = r.error; return; }
    for (const id of ['cpAncien', 'cpNouveau', 'cpNouveau2']) $m(id).value = '';
    msg.className = 'cpMsg ok'; msg.textContent = 'Mot de passe changé. Les autres appareils ont été déconnectés.';
  });
}

/* administration (admins seulement) : liste des comptes, rôles */
let adFiltre = '', adListe = null, adTri = 'vu';
async function renderAdmin(box, recharger = true) {
  if (recharger || !adListe) { box.innerHTML = '<p class="cpAide">Chargement…</p>';
    const r = await api('admin/joueurs'); if (pageCour !== 'admin') return;
    if (r.error) { box.innerHTML = `<p class="cpMsg">${esc(r.error)}</p>`; return; }
    adListe = r.joueurs; }
  const date = t => t ? new Date(t).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
  const f = adFiltre.toLowerCase(), tri = { vu: (a, b) => (b.vu || 0) - (a.vu || 0), lvl: (a, b) => b.lvl - a.lvl || b.xp - a.xp, name: (a, b) => a.name.localeCompare(b.name) }[adTri];
  const liste = adListe.filter(j => !f || j.name.toLowerCase().includes(f)).sort(tri);
  const nAdm = adListe.filter(j => j.role === 'admin').length, nOn = adListe.filter(j => j.enLigne).length;
  box.innerHTML = `<div class="adBarre"><input id="adCherche" placeholder="Chercher un pseudo…" value="${esc(adFiltre)}" autocomplete="off">
      <select id="adTri"><option value="vu">Dernière visite</option><option value="lvl">Niveau</option><option value="name">Pseudo</option></select>
      <button type="button" class="btn" id="adMaj">Actualiser</button>
      <span class="cpAide">${adListe.length} compte${adListe.length > 1 ? 's' : ''} · ${nOn} en jeu · ${nAdm} admin${nAdm > 1 ? 's' : ''}</span></div>
    <div class="adTable"><table><thead><tr><th>Pseudo</th><th>Rôle</th><th>Niveau</th><th>Or</th><th>Inscrit le</th><th>Dernière visite</th><th></th></tr></thead><tbody>
    ${liste.map(j => `<tr><td><i class="dot ${j.enLigne ? 'on' : ''}"></i>${esc(j.name)}</td><td>${j.role === 'admin' ? '<i class="badgeAdmin">admin</i>' : 'joueur'}</td>
      <td>${j.lvl} <small>(${j.xp} XP)</small></td><td>${j.shards}</td><td>${date(j.created)}</td><td>${j.enLigne ? 'en jeu' : date(j.vu)}</td>
      <td>${j.name === COMPTE.user.name ? '<small>toi</small>' : `<button type="button" class="btn" data-role="${j.role === 'admin' ? 'joueur' : 'admin'}" data-n="${esc(j.name)}">${j.role === 'admin' ? 'Retirer admin' : 'Nommer admin'}</button>`}</td></tr>`).join('')}
    </tbody></table>${liste.length ? '' : '<p class="cpAide">Aucun compte ne correspond.</p>'}</div>`;
  const ch = $m('adCherche'); ch.oninput = () => { adFiltre = ch.value; const pos = ch.selectionStart; renderAdmin(box, false).then(() => { const c = $m('adCherche'); c.focus(); c.setSelectionRange(pos, pos); }); };
  $m('adTri').value = adTri; $m('adTri').onchange = e => { adTri = e.target.value; renderAdmin(box, false); };
  $m('adMaj').onclick = () => { sfx.click(); renderAdmin(box); };
  box.querySelectorAll('[data-role]').forEach(b => b.onclick = async () => {
    if (!confirm(b.dataset.role === 'admin' ? `Nommer ${b.dataset.n} admin ? Il pourra gérer les comptes.` : `Retirer le rôle admin à ${b.dataset.n} ?`)) return;
    const r = await api('admin/role', { name: b.dataset.n, role: b.dataset.role }); if (r.error) toast(esc(r.error)); renderAdmin(box); });
}

/* aperçu animé du personnage (colonne de gauche) */
let mnSparks = 0, carteT = 0; const mnFx = [];
function menuTick(dt) {
  if (pageCour === 'accueil') homeTick(dt);
  if ((carteT += dt) > .5) { carteT = 0; majCarte(); }
  mnT += dt; const ph = mnT % 12;   // repos → marche → course → glissade → salut
  mnEnt.fakeSpd = ph > 3 && ph < 5.5 ? 62 : ph > 5.5 && ph < 8 ? 140 : 0; mnEnt.ground = true; mnEnt.x = 18; mnEnt.y = 41; mnEnt.face = 1;
  const cyc = Math.floor(mnT / 12); mnEnt.armed = (ph > 1.5 && ph < 4.3) || (ph > 5.5 && ph < 9.5);
  if (ph > 8 && mnEnt._sl !== cyc) { mnEnt._sl = cyc; mnEnt.slideT = .55; }
  if (ph > 10 && mnEnt._wv !== cyc) { mnEnt._wv = cyc; mnEnt.waveT = 1.6; }
  updateAnim(mnEnt, dt);
  drawPetit(mnEnt); const R = previewRect(mnEnt.skin), cvP = $m('mnPerso'); if (cvP.width !== R.w || cvP.height !== R.h) { cvP.width = R.w; cvP.height = R.h; mnCtx.imageSmoothingEnabled = false; }
  cvP.classList.toggle('geant', R.h > 44);   // le Rōnin géant s'affiche plus grand
  mnCtx.clearRect(0, 0, R.w, R.h); mnCtx.fillStyle = 'rgba(0,0,0,.35)'; mnCtx.fillRect(BOX - R.x - 6 * R.w / 37, BOY - R.y, 13 * R.w / 37, R.h / 44); mnCtx.drawImage(sc, R.x, R.y, R.w, R.h, 0, 0, R.w, R.h);
  if (mnSparks > 0) { mnSparks = 0; for (let i = 0; i < 18; i++) { const a = Math.random() * 6.28, v = 8 + Math.random() * 14; mnFx.push({ x: 18, y: 26, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 8, t: 0 }); } }
  for (const p of mnFx) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 20 * dt; mnCtx.fillStyle = `rgba(232,200,96,${1 - p.t})`; mnCtx.fillRect(Math.round(p.x * R.w / 37), Math.round(p.y * R.h / 44), R.w / 37, R.h / 44); }
  for (let i = mnFx.length - 1; i >= 0; i--) if (mnFx[i].t > 1) mnFx.splice(i, 1);
}

/* ================= JOUER : lecteur + chargement, puis la partie ================= */
const CHARGE = { actif: false, gen: 0 };
const CH_ASTUCES = ['Touche E devant une porte pour la traverser.', 'Entrée pour parler, Échap pour rendre le clavier au personnage.', 'Touche N : la carte du royaume.',
  'Touche O : tes amis, tes messages et ton clan.', 'Le grand chêne de la Clairière se grimpe jusqu’au Sommet.', 'Touches 1 à 8 : saluer, s’asseoir, danser…'];
function etapeCharge(texte, part) { $m('chTexte').textContent = texte; $m('chPlein').style.width = Math.round(part * 100) + '%'; }
const spritesPrets = () => new Promise(res => { const ok = () => Object.values(SPR).every(S => S.ready);
  if (ok()) return res(); const f = () => { if (ok()) { removeEventListener('sprites-ready', f); res(); } }; addEventListener('sprites-ready', f); });
async function attendreQue(test, ms) { const fin = performance.now() + ms; while (!test() && performance.now() < fin) await attendre(80); return test(); }

function jouer() {
  audioInit();
  if (!COMPTE.user) { veutJouer = true; ouvrirConnexion('connexion', 'Connecte-toi ou crée un compte pour jouer.'); return; }
  if (player || CHARGE.actif) { page('jeu'); return; }   // une partie est déjà en cours : on y retourne
  demarrer();
}
async function demarrer() {
  const gen = ++CHARGE.gen, t0 = performance.now(), encore = () => gen === CHARGE.gen;
  CHARGE.actif = true; chargeEl.classList.remove('fin'); chargeEl.classList.add('on');
  $m('chAstuce').textContent = 'Astuce : ' + CH_ASTUCES[Math.random() * CH_ASTUCES.length | 0];
  etapeCharge('Allumage des chandelles…', .05); page('jeu');
  await attendre(250); if (!encore()) return;
  etapeCharge('Chargement des personnages…', .25);
  await Promise.race([Promise.all([document.fonts ? document.fonts.ready : null, spritesPrets()]), attendre(5000)]); if (!encore()) return;
  etapeCharge('Ouverture des grilles du château…', .5);
  await compteSauver(true); await attendre(300); if (!encore()) return;
  etapeCharge(COMPTE.local ? 'Préparation du monde…' : 'Connexion au serveur…', .7);
  lancerPartie();
  const enLigne = await attendreQue(() => NET.online, 6000); if (!encore()) return;
  etapeCharge(enLigne ? 'Entrée dans le monde…' : 'Serveur muet : on réessaiera pendant la partie…', 1);
  await attendre(Math.max(350, 1900 - (performance.now() - t0))); if (!encore()) return;
  CHARGE.actif = false; chargeEl.classList.add('fin'); setTimeout(() => { if (encore()) chargeEl.classList.remove('on', 'fin'); }, 450);
  roomBanner = time; fade = 1; majStatut();
  if (pageCour === 'jeu') menuOpen = modaleOuverte();
  if (!LS.get('nocturne-seen-help')) { LS.set('nocturne-seen-help', 1); setTimeout(() => toast('Touches <b>1</b> à <b>8</b> : actions · <b>Entrée</b> : parler'), 1500); }
}
function lancerPartie() {   // le monde démarre derrière l'écran de chargement
  const u = COMPTE.user; if (!u || player) return;
  keys.clear(); logEl.innerHTML = '';
  curRoom = ROOMS.remparts;
  player = makeEnt(u.name, u.look.color, 146, 'me', u.look.skin); player.y = GROUND - 40; player.ground = false;
  player.acc = u.look.acc; player.lvl = PROG.lvl; player.room = 'remparts';
  netStart(); audioRoom('remparts');
  PROG.rooms.remparts = 1; saveProg(); updatePanel();
  puff(146, GROUND - 14, 24, LAND, 2.2);
}
function quitterPartie(msg, reconnecter) {
  CHARGE.gen++; CHARGE.actif = false; chargeEl.classList.remove('on', 'fin');
  if (player) { if (curRoom.id === 'cinema') filmLeave(); compteSauver(true); netStop(); player = null; }
  for (const id of ['helpM', 'cineM', 'affM', 'bienvM', 'rayonM', 'caisseM']) $m(id).style.display = 'none';
  mapHardClose(); socHardClose(); toggleOpt(false);
  if (document.fullscreenElement) document.exitFullscreen().catch(() => { });
  curRoom = ROOMS.remparts; audioRoom('remparts'); keys.clear();
  if (reconnecter) { LS.set(COMPTE.local ? 'nocturne-jeton-local' : 'nocturne-jeton', null); COMPTE.token = null; COMPTE.user = null; page('accueil'); ouvrirConnexion('connexion', msg); }
  else { page('accueil'); if (msg) toast(esc(msg)); }
}
addEventListener('keydown', e => { if (e.key === 'Enter' && pageCour === 'accueil' && accueilEl.style.display !== 'flex' && !typing()) { e.preventDefault(); jouer(); } });

/* ---------------- démarrage : l'accueil, le jeu n'est pas lancé ---------------- */
menuOpen = true; $m('accNom').value = LS.get('nocturne-nom') || LS.get('nocturne-name') || '';
page('accueil'); majStatut();
compteReprendre().then(ok => { renderPages(); if (typeof ok === 'string') $m('hStat').textContent = ok; });
