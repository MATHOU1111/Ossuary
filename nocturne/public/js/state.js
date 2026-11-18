"use strict";
// État du monde : joueur, PNJ (bots), bulles de dialogue.

/* ---------------- world state ---------------- */
let time = 0, player = null;
const remotes = new Map();
const LINES = ["Belle nuit pour une balade, non ?", "Tu as vu toutes ces lucioles ?", "Les lanternes ne s'éteignent jamais, ici.",
  "Ne grimpe pas trop haut, voyageur.", "J'ai cru entendre une chouette au loin.", "On dit que la fontaine exauce les vœux faits à minuit.", "Tu viens d'où, voyageur ?",
  "Attention au chat, il vole les bouts de pain.", "Les fanions ont été cousus par tout le village.", "Quelqu'un a une lanterne en trop ?"];
const LINES_BY = { remparts: LINES,
  cinema: ["Tu as vu les nouvelles affiches ?", "Je garde une place sur le tronc, au premier rang.", "Le popcorn sort à peine du chaudron.", "Prochaine séance à minuit pile.",
    "Pas de spoilers, s'il te plaît !", "On dit que le projectionniste ne dort jamais.", "Les racines poussent un peu plus sur l'écran à chaque séance…"],
  trone: ["Le maître des lieux reçoit rarement, vous savez.", "Je vous prie de ne pas vous asseoir sur le trône.", "Ce lustre a coûté une fortune.", "Les vitraux sont d'origine.",
    "Le dîner sera servi à minuit.", "Les livres de la bibliothèque ne se prêtent pas.", "Avez-vous vu le portrait ? Il vous suit du regard."] };
// Plus de PNJ qui se promènent.
const bots = [];

function wrapText(s, max = 24) { const out = []; let cur = '';
  for (let w of s.split(/\s+/)) { while (w.length > max) { if (cur) { out.push(cur); cur = ''; } out.push(w.slice(0, max)); w = w.slice(max); }
    if (!w) continue; if ((cur ? cur + ' ' + w : w).length > max) { out.push(cur); cur = w; } else cur = cur ? cur + ' ' + w : w; }
  if (cur) out.push(cur); return out.slice(0, 6); }
function say(e, msg) { e.bubble = { t: time, text: String(msg).slice(0, 160) }; if (e.room === curRoom.id) { addLog(e.name, msg, e.kind, e); sfx.chat(e === player); } }
function updateBot(b, dt) {
  const a = b.ai, inp = { l: 0, r: 0, jump: 0, jumpPressed: 0, down: 0, downPressed: 0 };
  if (a.static) { if (player && player.room === b.room && Math.abs(player.x - b.x) < 60 && time - (b.lastTalk || -9) > 3 && !b.act) b.face = player.x > b.x ? 1 : -1; step(b, inp, dt); return; }
  // voyage vers une salle voisine
  a.roomT -= dt;
  if (a.roam && !a.exit && a.roomT <= 0 && b.ground) { const R = ROOMS[b.room], opts = [['left', R.left], ['right', R.right]].filter(o => o[1] && a.roam.includes(o[1]));
    if (opts.length) { const o = opts[Math.random() * opts.length | 0]; a.exit = { dir: o[0] === 'left' ? -1 : 1, to: o[1] }; a.tx = a.exit.dir < 0 ? 4 : W - 4; a.wait = 0; b.act = null; } else a.roomT = 30; }
  if (a.exit && ((a.exit.dir < 0 && b.x <= 6.5) || (a.exit.dir > 0 && b.x >= W - 6.5))) {
    b.room = a.exit.to; b.x = a.exit.dir < 0 ? W - 9 : 9; b.lx = undefined; b.bubble = null; b.vy = 0;
    a.exit = null; a.roomT = 40 + Math.random() * 50; a.tx = 40 + Math.random() * (W - 80); a.wait = 1; }
  a.chat -= dt; if (a.chat < 0) { const L = LINES_BY[b.room]; say(b, L[Math.random() * L.length | 0]); if (Math.random() < .45) { const id = ['wave', 'heart', 'laugh', 'dance', 'sit', 'surprise'][Math.random() * 6 | 0]; startAct(b, id, true); if (id === 'sit') a.wait = 5 + Math.random() * 4; } a.chat = 12 + Math.random() * 16; }
  if (a.wait > 0) a.wait -= dt;
  else { const dx = a.tx - b.x;
    if (Math.abs(dx) < 3 && !a.exit) { a.wait = 1.5 + Math.random() * 4; a.tx = 14 + Math.random() * (W - 28); }
    inp.l = dx < -3; inp.r = dx > 3;
    if (b.ground && Math.random() < dt * .6 * a.jumpy) { inp.jumpPressed = 1; a.jhold = .35; } }
  if (b.ground && b.y < GROUND && Math.random() < dt * .12) { inp.down = 1; inp.downPressed = 1; }
  a.jhold -= dt; inp.jump = a.jhold > 0;
  step(b, inp, dt);
}
