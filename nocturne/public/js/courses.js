"use strict";
// Les courses du supermarché : catalogue, caddie, fenêtre d'un rayon, caisse.
// - Le catalogue vient de config/supermarche.json (servi par /api/supermarche) : rayons, produits, prix INDICATIFS, nom du drive.
// - Le caddie est gardé dans ce navigateur (localStorage) : on peut sortir du magasin et revenir le finir plus tard.
// - À la caisse, « Envoyer au drive avec Claude » ouvre Claude avec la liste toute prête : c'est le connecteur Carrefour
//   officiel de Claude qui remplit le vrai panier drive (le serveur Carrefour n'accepte que Claude, pas d'autre application).
//   On valide ensuite le créneau et on paie sur carrefour.fr. Sans Claude : « Copier la liste » et les liens de recherche carrefour.fr.

const COURSES = { magasin: 'Carrefour Market Lille Gambetta', rayons: {}, produits: [], ok: false, enCours: null };
const escC = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const eur = v => v.toFixed(2).replace('.', ',') + ' €';
const pid = p => p.nom + ' · ' + p.format;
let CADDIE = {};   // identifiant du produit -> quantité
try { CADDIE = JSON.parse(localStorage.getItem('ossuary-caddie') || '{}') || {}; } catch (e) { CADDIE = {}; }
const caddieSauver = () => { try { localStorage.setItem('ossuary-caddie', JSON.stringify(CADDIE)); } catch (e) { } };
const produitDe = id => COURSES.produits.find(p => pid(p) === id);
const lignesCaddie = () => Object.entries(CADDIE).map(([id, q]) => ({ p: produitDe(id), q })).filter(l => l.p && l.q > 0);
function caddieNb() { let n = 0; for (const l of lignesCaddie()) n += l.q; return n; }
function caddieTotal() { let t = 0; for (const l of lignesCaddie()) t += l.q * l.p.prix; return Math.round(t * 100) / 100; }
function caddieMettre(id, d) { const q = clamp((CADDIE[id] || 0) + d, 0, 99); if (q) CADDIE[id] = q; else delete CADDIE[id]; caddieSauver(); }

function chargerCourses() {
  if (COURSES.enCours) return COURSES.enCours;
  return COURSES.enCours = fetch('/api/supermarche', { cache: 'no-store' }).then(r => r.ok ? r.json() : Promise.reject(r.status)).then(d => {
    COURSES.magasin = d.magasin || COURSES.magasin; COURSES.rayons = d.rayons || {};
    COURSES.produits = (d.produits || []).filter(p => p && p.nom && isFinite(+p.prix)).map(p => ({ nom: String(p.nom), format: String(p.format || ''), prix: +p.prix, rayon: String(p.rayon || '') }));
    COURSES.ok = true;
    for (const id of Object.keys(CADDIE)) if (!produitDe(id)) delete CADDIE[id];   // produits retirés du catalogue
    caddieSauver();
  }).catch(() => { COURSES.enCours = null; toast('Le catalogue du supermarché est indisponible pour le moment.'); });
}

/* ---------------- les fenêtres ---------------- */
document.getElementById('view').insertAdjacentHTML('beforeend', `
  <div id="rayonM" class="modal"><div class="panel coursesP">
    <div class="shopHead"><h2 id="rayonT">Rayon</h2><span class="crTot" id="rayonTot"></span><button class="x" id="rayonX">✕</button></div>
    <input type="search" id="rayonQ" placeholder="Chercher dans tout le magasin…" autocomplete="off" spellcheck="false">
    <div class="crListe" id="rayonL"></div>
    <div class="crNote">Prix indicatifs : le drive affiche les prix et la disponibilité du jour au moment de commander.</div>
  </div></div>
  <div id="caisseM" class="modal"><div class="panel coursesP">
    <div class="shopHead"><h2 id="caisseT">Caisse</h2><button class="x" id="caisseX">✕</button></div>
    <div class="crListe" id="caisseL"></div>
    <div class="crTotal" id="caisseTot"></div>
    <div class="cineRow"><button class="btn gold" id="caisseDrive">🛒 Envoyer au drive avec Claude</button></div>
    <div class="cineRow"><button class="btn" id="caisseCopier">📋 Copier la liste</button><button class="btn" id="caisseSite">↗ Ouvrir carrefour.fr</button><button class="btn" id="caisseVider">Vider le caddie</button></div>
    <div class="crNote" id="caisseAide"></div>
  </div></div>`);
const $k = id => document.getElementById(id);
let rayonCour = null;
const normC = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const ligneHTML = (p, lien) => { const id = pid(p), q = CADDIE[id] || 0;
  return `<div class="crLig${q ? ' pris' : ''}"><span class="crNom">${escC(p.nom)}<small>${escC(p.format)}</small></span><span class="crPrix">${eur(p.prix)}</span>`
    + (lien ? `<a href="https://www.carrefour.fr/s?q=${encodeURIComponent(p.nom)}" target="_blank" rel="noopener" title="Chercher sur carrefour.fr">↗</a>` : '')
    + `<span class="crQte"><button data-d="-1" data-id="${escC(id)}" aria-label="Retirer">−</button><b>${q}</b><button data-d="1" data-id="${escC(id)}" aria-label="Ajouter">+</button></span></div>`; };
function renderRayon() {
  const q = normC($k('rayonQ').value.trim());
  const liste = q ? COURSES.produits.filter(p => normC(p.nom + ' ' + p.format).includes(q)) : COURSES.produits.filter(p => p.rayon === rayonCour);
  $k('rayonT').textContent = q ? 'Recherche' : 'Rayon · ' + (COURSES.rayons[rayonCour] || rayonCour);
  $k('rayonTot').textContent = `🛒 ${caddieNb()} · ${eur(caddieTotal())}`;
  $k('rayonL').innerHTML = !COURSES.ok ? '<div class="crVide">Chargement du catalogue…</div>' : liste.length ? liste.map(p => ligneHTML(p, false)).join('') : '<div class="crVide">Rien de ce nom dans le magasin.</div>';
}
function ouvrirRayon(id) { rayonCour = id; $k('rayonQ').value = ''; sfx.click(); openModal('rayonM');
  if (COURSES.ok) renderRayon(); else { renderRayon(); const pr = chargerCourses(); if (pr) pr.then(renderRayon); } }
function renderCaisse() {
  const L = lignesCaddie(), vide = !L.length;
  let html = ''; for (const id of Object.keys(COURSES.rayons)) { const ls = L.filter(l => l.p.rayon === id); if (!ls.length) continue; html += `<div class="crRayon">${escC(COURSES.rayons[id])}</div>` + ls.map(l => ligneHTML(l.p, true)).join(''); }
  const autres = L.filter(l => !COURSES.rayons[l.p.rayon]); if (autres.length) html += autres.map(l => ligneHTML(l.p, true)).join('');
  $k('caisseL').innerHTML = vide ? '<div class="crVide">Ton caddie est vide. Fais un tour dans les rayons !</div>' : html;
  $k('caisseTot').innerHTML = vide ? '' : `${caddieNb()} article${caddieNb() > 1 ? 's' : ''} · total indicatif <b>${eur(caddieTotal())}</b>`;
  for (const b of ['caisseDrive', 'caisseCopier', 'caisseVider']) $k(b).disabled = vide;
  $k('caisseAide').innerHTML = `<b>Envoyer au drive avec Claude</b> ouvre Claude avec ta liste : son connecteur Carrefour officiel remplit ton vrai panier drive du <b>${escC(COURSES.magasin)}</b>
    (à activer une fois dans Claude : <i>Paramètres → Connecteurs → Carrefour</i>). Tu choisis ensuite ton créneau et tu paies sur carrefour.fr.
    Sans Claude : copie la liste ou utilise les liens ↗ pour retrouver chaque produit sur carrefour.fr.`;
}
function ouvrirCaisse(n) { $k('caisseT').textContent = 'Caisse ' + (n || ''); renderCaisse(); openModal('caisseM');
  const k = Math.min(6, caddieNb()); for (let i = 0; i < k; i++) tone(1760, .06, { type: 'square', v: .03, lp: 3200, when: i * .16 });   // bip de la douchette
  if (!COURSES.ok) { const pr = chargerCourses(); if (pr) pr.then(renderCaisse); } }
function texteListe() { return lignesCaddie().map(l => `- ${l.q} × ${l.p.nom} (${l.p.format})`).join('\n'); }
function demandeClaude() {
  return `Avec le connecteur Carrefour : choisis le magasin « ${COURSES.magasin} » en mode drive, puis ajoute à mon panier :\n${texteListe()}\n\n`
    + `Si un produit n'existe pas, prends l'équivalent le plus proche (marque Carrefour de préférence) et dis-moi ce que tu as remplacé. Donne-moi ensuite le lien pour valider ma commande sur carrefour.fr.`;
}
function copierTexte(t) {
  const ok = () => toast('Liste copiée dans le presse-papiers.'), ko = () => { window.prompt('Copie ta liste :', t); };
  try { if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(t).then(ok, ko); else ko(); } catch (e) { ko(); }
}
for (const id of ['rayonL', 'caisseL']) $k(id).addEventListener('click', ev => { const b = ev.target.closest('button[data-id]'); if (!b) return;
  caddieMettre(b.dataset.id, +b.dataset.d); sfx.click(); if (+b.dataset.d > 0) tone(1320, .05, { type: 'sine', v: .05 });
  if (id === 'rayonL') renderRayon(); else renderCaisse(); });
$k('rayonQ').addEventListener('input', renderRayon);
$k('rayonX').onclick = () => closeModal('rayonM');
$k('caisseX').onclick = () => closeModal('caisseM');
$k('caisseDrive').onclick = () => { if (!caddieNb()) return; window.open('https://claude.ai/new?q=' + encodeURIComponent(demandeClaude()), '_blank', 'noopener'); toast('Claude s’ouvre dans un nouvel onglet avec ta liste.'); };
$k('caisseCopier').onclick = () => copierTexte(`Courses pour le drive ${COURSES.magasin} :\n${texteListe()}\nTotal indicatif : ${eur(caddieTotal())}`);
$k('caisseSite').onclick = () => window.open('https://www.carrefour.fr/', '_blank', 'noopener');
$k('caisseVider').onclick = () => { if (!confirm('Vider tout le caddie ?')) return; CADDIE = {}; caddieSauver(); renderCaisse(); };
