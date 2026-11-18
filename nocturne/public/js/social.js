"use strict";
// Social : amis, messages privés, clan. Le serveur (server/social.js) fait foi ; ce fichier affiche et envoie les demandes.
// Dans le jeu : touche O (ou le bouton à côté de la carte), /c message (clan), /mp pseudo message, /r message (répondre).

const SOC = { amis: [], demandes: [], clan: null, invit: [], convs: {}, unread: {}, clanUnread: 0, clanLog: [], tab: 'amis', cur: null, last: null };
const socM = document.getElementById('socM'), socBtn = document.getElementById('socBtn'), socCv = document.getElementById('socCv'), sx = socCv.getContext('2d');
socCv.width = 22; socCv.height = 22; sx.imageSmoothingEnabled = false;
const $s = id => document.getElementById(id);
const socOpen = () => socM.style.display === 'flex';
const lc = s => String(s).toLowerCase();
const sEsc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const hhmm = t => { const d = new Date(t || Date.now()); return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); };
const roomLabel = id => (typeof ROOMNAMES !== 'undefined' && ROOMNAMES[id]) || id || '';
const socOnline = () => !COMPTE.local && NET.mode === 'ws';
function socSend(o) { if (!bc || !player || NET.mode !== 'ws') return false; bc.postMessage({ type: 'soc', id: player.id, ...o }); return true; }

/* ---------------- bouton : médaillon + deux silhouettes, pastille rouge s'il y a du nouveau ---------------- */
const SOC_ART = ['.............', '..WWW...GGG..', '.WWWWW.GGGGG.', '.WWWWW.GGGGG.', '..WWW...GGG..', '.WWWWW.GGGGG.', 'WWWWWWWGGGGGG', 'WWWWWWWGGGGGG'];
const socBadgeN = () => SOC.demandes.length + SOC.invit.length + Object.values(SOC.unread).reduce((a, b) => a + b, 0) + SOC.clanUnread;
let socKey = '';
function drawSocBtn() {
  const open = socOpen(), hov = HUD.hover === 'soc', n = socBadgeN(), key = '' + open + hov + (n > 0); if (key === socKey) return; socKey = key;
  sx.clearRect(0, 0, 22, 22); sx.fillStyle = '#05070c'; disc(sx, 11, 11, 11); sx.fillStyle = open ? '#e0b85a' : hov ? '#c9a24a' : '#5a6272'; disc(sx, 11, 11, 10); sx.fillStyle = open ? '#3a1a0c' : '#1a212b'; disc(sx, 11, 11, 8);
  SOC_ART.forEach((r, j) => { for (let i = 0; i < 13; i++) { const ch = r[i]; if (ch === '.') continue; sx.fillStyle = ch === 'W' ? (open ? '#f0dc9c' : hov ? '#eadcae' : '#cdbd90') : (open ? '#b08a3c' : '#7a8aa0'); sx.fillRect(4 + i, 7 + j, 1, 1); } });
  if (n > 0) { sx.fillStyle = '#05070c'; disc(sx, 17, 5, 4); sx.fillStyle = '#d03038'; disc(sx, 17, 5, 3); sx.fillStyle = '#ffd8d8'; sx.fillRect(17, 3, 1, 3); sx.fillRect(17, 7, 1, 1); }
}
socBtn.addEventListener('mouseenter', () => HUD.hover = 'soc'); socBtn.addEventListener('mouseleave', () => { if (HUD.hover === 'soc') HUD.hover = null; });
tipOn(socBtn, '<b>Social</b> · amis, messages, clan · touche O');

/* ---------------- ouverture / fermeture ---------------- */
function socShow() { if (socOpen()) return; if (menuOpen && !player) return; sfx.click(); openModal('socM'); socM.classList.toggle('off', !socOnline()); socTab(SOC.tab); socSend({ a: 'etat' }); socKey = ''; }
function socHide() { if (!socOpen()) return; closeModal('socM'); socKey = ''; }
socBtn.addEventListener('click', () => { socBtn.blur(); socOpen() ? socHide() : socShow(); });
$s('socX').addEventListener('click', () => { sfx.click(); socHide(); });
socM.addEventListener('mousedown', ev => { if (!ev.target.closest('.socP')) socHide(); });
addEventListener('keydown', ev => {
  if (ev.key === 'Escape' && !typing()) { socHide(); return; }
  if (typing() || !player || ev.ctrlKey || ev.metaKey || ev.altKey) return;
  if (ev.code === 'KeyO') { if (socOpen()) socHide(); else if (!menuOpen) socShow(); }
});
function socHardClose() { socM.style.display = 'none'; socKey = ''; }

/* ---------------- onglets ---------------- */
function socTab(t) {
  SOC.tab = t;
  for (const b of $s('socTabs').children) b.classList.toggle('on', b.dataset.t === t);
  for (const s of socM.querySelectorAll('#socBody section')) s.classList.toggle('on', s.dataset.p === t);
  if (t === 'mp') { if (SOC.cur) SOC.unread[lc(SOC.cur)] = 0; renderMp(); }
  if (t === 'clan') { SOC.clanUnread = 0; renderClan(); }
  renderBadges();
}
for (const b of $s('socTabs').children) b.addEventListener('click', () => { sfx.click(); socTab(b.dataset.t); });
function renderBadges() {
  const set = (i, n) => { const e = $s('socTabs').children[i].querySelector('.bdg'); e.textContent = n; e.classList.toggle('on', n > 0); };
  set(0, SOC.demandes.length); set(1, Object.values(SOC.unread).reduce((a, b) => a + b, 0)); set(2, SOC.invit.length + SOC.clanUnread); socKey = '';
}

/* ---------------- petits éléments d'interface ---------------- */
function sRow(inner, cls = '') { const d = document.createElement('div'); d.className = 'socRow ' + cls; d.innerHTML = inner; return d; }
function sBtn(txt, fn, cls = '') { const b = document.createElement('button'); b.type = 'button'; b.className = 'btn sm ' + cls; b.textContent = txt; b.addEventListener('click', () => { sfx.click(); fn(); }); return b; }
function sEmpty(el, txt) { el.innerHTML = ''; const d = document.createElement('div'); d.className = 'socEmpty'; d.textContent = txt; el.appendChild(d); }
const dotRow = p => `<i class="dot ${p.on ? 'on' : ''}"></i><span class="nm">${sEsc(p.n)}</span><span class="where">${p.on ? sEsc(roomLabel(p.room)) : 'hors ligne'}</span>`;

/* ---------------- amis ---------------- */
function renderAmis() {
  const rq = $s('socReq'); $s('socReqH').style.display = rq.style.display = SOC.demandes.length ? '' : 'none'; rq.innerHTML = '';
  for (const n of SOC.demandes) { const r = sRow(`<span class="nm">${sEsc(n)}</span>`); r.append(sBtn('Accepter', () => socSend({ a: 'ami_ok', n }), 'gold'), sBtn('Refuser', () => socSend({ a: 'ami_no', n }))); rq.appendChild(r); }
  const el = $s('socAmis'); $s('socAmisN').textContent = SOC.amis.length ? `· ${SOC.amis.filter(a => a.on).length}/${SOC.amis.length} en ligne` : '';
  if (!SOC.amis.length) { sEmpty(el, "Personne pour l'instant. Ajoute un joueur grâce à son pseudo."); return; }
  el.innerHTML = '';
  for (const a of [...SOC.amis].sort((x, y) => (y.on - x.on) || x.n.localeCompare(y.n))) {
    const r = sRow(dotRow(a)); r.append(sBtn('✉', () => { openConv(a.n); socTab('mp'); }), sBtn('Retirer', () => { if (confirm(`Retirer ${a.n} de tes amis ?`)) socSend({ a: 'ami-', n: a.n }); })); el.appendChild(r); }
}

/* ---------------- messages privés ---------------- */
const sConv = n => SOC.convs[lc(n)] || (SOC.convs[lc(n)] = { name: n, msgs: [] });
function openConv(n) { sConv(n); SOC.cur = sConv(n).name; SOC.unread[lc(n)] = 0; renderMp(); renderBadges(); }
function lineEl(cls, name, msg, t) { const d = document.createElement('div'); d.className = 'l ' + cls; const sm = document.createElement('small'); sm.textContent = hhmm(t); d.appendChild(sm);
  if (name) { const b = document.createElement('b'); b.textContent = name; d.append(b, ' : '); } d.append(msg); return d; }
function renderMp() {
  const list = $s('socConvs'); list.innerHTML = ''; const cs = Object.values(SOC.convs);
  if (!cs.length) sEmpty(list, 'Aucune conversation.');
  for (const c of cs) { const u = SOC.unread[lc(c.name)] || 0, r = sRow(`<span class="nm">${sEsc(c.name)}</span>${u ? `<span class="n">${u}</span>` : ''}`, lc(c.name) === lc(SOC.cur || '') ? 'sel' : '');
    r.style.cursor = 'pointer'; r.addEventListener('click', () => { sfx.click(); openConv(c.name); }); list.appendChild(r); }
  const th = $s('socThread'); th.innerHTML = ''; $s('socThH').textContent = SOC.cur ? 'Avec ' + SOC.cur : 'Choisis une conversation';
  if (SOC.cur) { const c = sConv(SOC.cur); if (!c.msgs.length) th.appendChild(lineEl('sys', '', 'Écris le premier message…', Date.now()));
    for (const m of c.msgs) th.appendChild(m.sys ? lineEl('sys', '', m.msg, m.t) : lineEl(m.me ? 'me' : '', m.me ? 'Moi' : c.name, m.msg, m.t)); th.scrollTop = th.scrollHeight; }
}
function pmIn(m) {   // message reçu
  const c = sConv(m.de); c.name = m.de; c.msgs.push({ me: false, msg: m.msg, t: m.t }); SOC.last = m.de;
  const viewing = socOpen() && SOC.tab === 'mp' && lc(SOC.cur || '') === lc(m.de);
  if (!viewing) SOC.unread[lc(m.de)] = (SOC.unread[lc(m.de)] || 0) + 1;
  if (socOpen() && SOC.tab === 'mp') renderMp(); renderBadges();
  if (!m.vieux) { sfx.chat(false); if (!viewing) toast(`<b>✉ ${sEsc(m.de)}</b> : ${sEsc(m.msg.slice(0, 40))}`); }
  socLog('pm', '✉ ' + m.de, m.msg);
}
function pmOut(m) {   // écho de mon message
  const c = sConv(m.a); c.msgs.push({ me: true, msg: m.msg, t: m.t }); if (m.hors) c.msgs.push({ sys: true, msg: `${c.name} est hors ligne : il le lira à sa prochaine connexion.`, t: m.t });
  SOC.last = c.name; if (socOpen() && SOC.tab === 'mp') renderMp(); socLog('pm', '✉ → ' + m.a, m.msg);
}

/* ---------------- clan ---------------- */
function renderClan() {
  const cl = SOC.clan; $s('socNoClan').classList.toggle('on', !cl); $s('socClan').classList.toggle('on', !!cl);
  if (!cl) { const el = $s('socInv'); $s('socInvH').style.display = el.style.display = SOC.invit.length ? '' : 'none'; el.innerHTML = '';
    for (const i of SOC.invit) { const r = sRow(`<span class="clanTag">${sEsc(i.tag)}</span><span class="nm">${sEsc(i.nom)}</span>`); r.append(sBtn('Rejoindre', () => socSend({ a: 'clan_ok', cid: i.id }), 'gold'), sBtn('Refuser', () => socSend({ a: 'clan_no', cid: i.id }))); el.appendChild(r); } return; }
  const chef = lc(cl.chef) === lc(cl.moi);
  $s('clanTag').textContent = cl.tag; $s('clanNom').textContent = cl.nom; $s('clanN').textContent = `· ${cl.membres.length}/20`; $s('clanInvF').style.display = chef ? '' : 'none';
  const el = $s('clanMem'); el.innerHTML = '';
  for (const p of [...cl.membres].sort((x, y) => (lc(y.n) === lc(cl.chef)) - (lc(x.n) === lc(cl.chef)) || (y.on - x.on))) {
    const r = sRow(`<i class="dot ${p.on ? 'on' : ''}"></i><span class="nm">${lc(p.n) === lc(cl.chef) ? '♛ ' : ''}${sEsc(p.n)}</span>`);
    if (chef && lc(p.n) !== lc(cl.moi)) r.append(sBtn('✕', () => { if (confirm(`Exclure ${p.n} du clan ?`)) socSend({ a: 'clan_kick', n: p.n }); }));
    el.appendChild(r); }
  const lg = $s('clanLog'); lg.innerHTML = ''; if (!SOC.clanLog.length) lg.appendChild(lineEl('sys', '', 'Le chat du clan. Tu peux aussi écrire /c message dans le chat du jeu.', Date.now()));
  for (const m of SOC.clanLog) lg.appendChild(m.sys ? lineEl('sys', '', m.msg, m.t) : lineEl(lc(m.de) === lc(cl.moi) ? 'me' : '', m.de, m.msg, m.t)); lg.scrollTop = lg.scrollHeight;
}
$s('clanQuit').addEventListener('click', () => { sfx.click(); if (confirm('Quitter le clan ?')) socSend({ a: 'clan-' }); });
function clanIn(m) {
  SOC.clanLog.push({ de: m.de, msg: m.msg, t: m.t }); if (SOC.clanLog.length > 120) SOC.clanLog.shift();
  const viewing = socOpen() && SOC.tab === 'clan'; if (!viewing) SOC.clanUnread++;
  if (viewing) renderClan(); renderBadges(); if (lc(m.de) !== lc(COMPTE.user.name)) sfx.chat(false);
  socLog('cl', `[${m.tag}] ${m.de}`, m.msg);
}

/* ---------------- ligne dans le chat du jeu ---------------- */
function socLog(cls, name, msg) { const d = document.createElement('div'); d.className = 'm ' + cls; const b = document.createElement('b'); b.textContent = name; d.append(b, ' : ' + msg); pushLine(d); }

/* ---------------- formulaires ---------------- */
for (const f of socM.querySelectorAll('form[data-f]')) f.addEventListener('submit', ev => {
  ev.preventDefault(); const ins = f.querySelectorAll('input'), v = ins[0].value.trim(), w = ins[1] ? ins[1].value.trim() : ''; if (!v) return;
  if (!socOnline()) return;
  switch (f.dataset.f) {
    case 'ami': socSend({ a: 'ami+', n: v }); break;
    case 'conv': openConv(v); break;
    case 'mp': if (!SOC.cur) return; socSend({ a: 'mp', n: SOC.cur, msg: v }); break;
    case 'clan+': socSend({ a: 'clan+', nom: v, tag: w }); break;
    case 'clan_inv': socSend({ a: 'clan_inv', n: v }); break;
    case 'clan_msg': socSend({ a: 'clan_msg', msg: v }); break;
  }
  for (const i of ins) i.value = '';
});

/* ---------------- messages du serveur ---------------- */
function socNet(m) {
  if (m.k === 'etat') { SOC.amis = m.amis || []; SOC.demandes = m.demandes || []; SOC.clan = m.clan || null; SOC.invit = m.invit || [];
    if (!SOC.clan) SOC.clanLog.length = 0; if (socOpen()) { renderAmis(); renderClan(); } renderBadges(); }
  else if (m.k === 'mp') (m.de ? pmIn : pmOut)(m);
  else if (m.k === 'clan') clanIn(m);
  else if (m.k === 'info') { toast(sEsc(m.msg)); addSys(m.msg, m.cls || 'cyan'); if (m.cls === 'gold') sfx.chat(false); }
  else if (m.k === 'err') { toast(`<b>${sEsc(m.msg)}</b>`); addSys(m.msg, 'gold'); }
}
function socReset() { Object.assign(SOC, { amis: [], demandes: [], clan: null, invit: [], convs: {}, unread: {}, clanUnread: 0, clanLog: [], cur: null, last: null }); socHardClose(); renderBadges(); }

/* ---------------- commandes du chat : /c, /mp, /r ---------------- */
function socCommande(msg) {   // renvoie true si le texte était une commande
  const m = /^\/(c|clan|mp|w|r)\s*(.*)$/i.exec(msg); if (!m) return false;
  const cmd = m[1].toLowerCase(), rest = m[2].trim();
  if (!socOnline()) { addSys('Le social demande le serveur (npm start).'); return true; }
  if (cmd === 'c' || cmd === 'clan') { if (!SOC.clan) addSys("Tu n'as pas de clan (touche O pour en fonder un)."); else if (rest) socSend({ a: 'clan_msg', msg: rest }); else addSys('Écris : /c ton message'); }
  else if (cmd === 'r') { if (!SOC.last) addSys("Personne à qui répondre."); else if (rest) socSend({ a: 'mp', n: SOC.last, msg: rest }); else addSys('Écris : /r ton message'); }
  else { const mm = /^(\S+)\s+(.+)$/.exec(rest); if (mm) socSend({ a: 'mp', n: mm[1], msg: mm[2] }); else addSys('Écris : /mp pseudo ton message'); }
  return true;
}
