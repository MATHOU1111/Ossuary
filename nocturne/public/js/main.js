"use strict";
// Mise à l'échelle du lecteur et boucle principale (le site autour du jeu est dans menu.js).

/* ---------------- sizing & loop ---------------- */
// Le jeu n'est plus en plein écran : il tient dans la colonne du centre, sous la barre du haut.
const stage = document.getElementById('stage');
const view = document.getElementById('view');
const centreEl = document.getElementById('centre'), topEl = document.getElementById('top');
const CADRE = 12, MARGES = 32;   // cadre du lecteur (de chaque côté) et marges verticales de la page, en pixels
let SC = 2, DPR = 1;   // échelle courante (pixels écran par pixel de jeu) et densité de l'écran
const hiCv = document.getElementById('hi'), hiX = hiCv.getContext('2d');
function resize() {
  const aw = centreEl.clientWidth - CADRE * 2, ah = innerHeight - topEl.offsetHeight - MARGES - CADRE * 2;
  // échelle libre (pas seulement ×2, ×3…) : le lecteur prend toute la hauteur disponible
  let s = Math.max(1, Math.floor(Math.min(aw / W, ah / (H + HUD_H)) * 100) / 100); SC = s; DPR = window.devicePixelRatio || 1;
  stage.style.width = W * s + 'px'; stage.style.height = (H + HUD_H) * s + 'px'; view.style.width = W * s + 'px'; view.style.height = H * s + 'px';
  panelEl.style.width = W * s + 'px'; panelEl.style.height = HUD_H * s + 'px'; stage.style.setProperty('--s', s);
  hiCv.width = Math.round(W * s * DPR); hiCv.height = Math.round(H * s * DPR);
  stage.style.fontSize = Math.max(12, s * 4.3) + 'px'; stage.style.setProperty('--k', Math.max(3, Math.round(s * 1.5))); }
addEventListener('resize', resize);
if (window.ResizeObserver) new ResizeObserver(resize).observe(centreEl);
resize();
let lastT = performance.now(), errShown = false;
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(.05, (now - lastT) / 1000); lastT = now; time += dt;
  try { update(dt); render(); menuTick(dt); drawHud(); }
  catch (err) { if (!errShown) { errShown = true; console.error(err); } ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; }
}
requestAnimationFrame(frame);
