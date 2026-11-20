"use strict";
// Clavier et saisie du chat.

/* ---------------- input ---------------- */
const keys = new Set(), pressed = new Set();
let menuOpen = true;
const typing = () => document.activeElement && document.activeElement.tagName === 'INPUT';
const chatForm = document.getElementById('chat'), chatIn = document.getElementById('chatIn');
addEventListener('keydown', e => {
  if (typing()) { if (e.key === 'Escape') document.activeElement.blur(); return; }
  if (e.key === 'Escape') for (const id of ['helpM', 'cineM', 'affM', 'bienvM', 'rayonM', 'caisseM']) if (document.getElementById(id).style.display === 'flex') closeModal(id);
  if (menuOpen) return;
  if (player && /^Digit[1-8]$/.test(e.code)) { tryAct(+e.code[5] - 1); return; }
  if (player && !curRoom.fp && e.code === 'KeyR' && SKINS[player.skin].sheath && !(player.act && player.act.id === 'attack')) { player.armed = !player.armed; return; }   // dégainer / rengainer
  if (player && !curRoom.fp && !player.mount && !player.climbing && (e.code === 'KeyX' || e.code === 'KeyC')) { startAct(player, e.code === 'KeyX' ? 'attack' : 'die'); return; }
  if (player && e.key === 'Enter') { e.preventDefault(); chatIn.focus(); return; }
  if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'].includes(e.code)) e.preventDefault();
  if (!keys.has(e.code)) pressed.add(e.code); keys.add(e.code);
});
addEventListener('keyup', e => keys.delete(e.code));
addEventListener('mousedown', e => { if (document.activeElement === chatIn && !e.target.closest('#chat, #log')) chatIn.blur(); });   // un clic dans le jeu rend le clavier au personnage
addEventListener('blur', () => keys.clear());
const any = (set, ...c) => c.some(k => set.has(k));
chatForm.addEventListener('submit', e => { e.preventDefault(); const msg = chatIn.value.trim().slice(0, 80); chatIn.value = ''; chatIn.blur();
  if (!msg || !player) return; if (socCommande(msg)) return; say(player, msg); if (bc) bc.postMessage({ type: 'chat', id: player.id, msg });
  if (/\b(salut|bonjour|bonsoir|coucou|hello|yo|hey|slt|cc)\b/i.test(msg)) { const hb = bots.filter(x => x.room === player.room && !x.ai.static), b = hb[Math.random() * hb.length | 0];
    const greet = b && b.name === 'Bertrand' ? ['Bienvenue au château, ' + player.name + '. Veuillez essuyer vos pieds.', 'Bonsoir. Le maître est absent, ' + player.name + '.', 'Ah, un visiteur. Bonsoir.']
      : ['Bonsoir ' + player.name + ' !', 'Salut ' + player.name + ', bienvenue.', 'Tiens, une nouvelle âme… salut !'];
    if (b) setTimeout(() => { say(b, greet[Math.random() * 3 | 0]); b.waveT = 1.6; b.face = player.x > b.x ? 1 : -1; }, 900); }
});
