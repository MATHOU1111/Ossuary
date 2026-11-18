"use strict";
// « Le Sommet » : la cime du grand arbre mort de la Clairière. Une vision : l'éclipse, son rayon, la vallée et la rivière de sang.
// On y arrive en grimpant tout en haut de l'arbre (place.js) ; on redescend avec E (« Descendre ») ou en sautant dans le vide.

ROOMS.remparts.up = 'sommet';

{ const EX = 150, TX = 300, LY = 122;
  const r = ROOMS.sommet = { id: 'sommet', name: 'LE SOMMET', down: 'remparts', ground: null, fires: [], climbs: [], grass: [], fogFar: null, fogNear: null };
  r.stars = []; r.hatch = { x: TX, y: LY };
  // la vision : ciel d'éclipse + vallée (mêmes pinceaux que la Clairière)
  { const [sk, s] = mk(W, H); s.drawImage(NOC_PAINT.paintSky(W, H, 0, EX, 52, 150), 0, 0); NOC_PAINT.paintLand(s, 24); r.sky = sk; }
  // l'arbre : le tronc monte du bas de l'écran jusqu'à la branche où l'on se tient
  const [wl, t] = mk(W, H); r.wall = wl; r.play = mk(W, H)[0];
  { t.fillStyle = '#120a0c'; pline(t, 258, LY + 1, 340, LY + 1, 4); t.fillStyle = '#050203'; pline(t, 258, LY + 3, 340, LY + 3, 1); t.fillStyle = '#5a1c16'; pline(t, 258, LY, 340, LY, 1);
    t.fillStyle = '#120a0c'; tree(t, 258, LY + 2, 10, Math.PI * .85, 2, 2); tree(t, 340, LY + 2, 10, Math.PI * .15, 2, 2);
    t.fillStyle = '#0e0709'; for (let k = 0; k < 5; k++) tree(t, TX + (k - 2) * 12, LY - 1, 22 + R() * 8, -Math.PI / 2 + (k - 2) * .38, 4, 3);
    for (let y = H; y >= LY - 2; y--) { const hw = Math.round(6 + 4 * (y - LY) / (H - LY)), cx = TX + Math.round(Math.sin(y * .04) * 2);
      for (let x = cx - hw; x <= cx + hw; x++) { const i = x - (cx - hw); t.fillStyle = i < 2 ? '#7a2a1a' : x > cx + hw - 2 ? '#030102' : R() < .13 ? '#1e1013' : '#120a0c'; t.fillRect(x, y, 1, 1); } }
    t.fillStyle = '#05020a'; t.fillRect(TX - 2, 168, 3, 5); t.fillRect(TX - 1, 167, 1, 7);
    // lanterne et corbeaux
    t.fillStyle = '#05020a'; t.fillRect(336, LY + 4, 1, 5); t.fillRect(334, LY + 9, 5, 7); t.fillStyle = '#e0502a'; t.fillRect(335, LY + 10, 3, 5); t.fillStyle = '#ffc070'; t.fillRect(336, LY + 11, 1, 2);
    for (const x of [270, 322]) { t.fillStyle = '#030102'; t.fillRect(x, LY - 4, 4, 3); t.fillRect(x + 4, LY - 5, 2, 2); t.fillRect(x - 3, LY - 3, 3, 1); t.fillStyle = '#7a5a3a'; t.fillRect(x + 6, LY - 4, 1, 1); t.fillStyle = '#030102'; t.fillRect(x + 1, LY - 1, 1, 1); t.fillRect(x + 3, LY - 1, 1, 1); } }
  r.plats = [{ x1: 262, x2: 338, y: LY, solid: true }];
  r.dyn = c => {
    for (let k = 0; k < 4; k++) { const y = 76 + ((time * 30 + k * 20) % 74); c.fillStyle = k % 2 ? '#ffe0a0' : '#ff9a48'; c.fillRect(EX, Math.round(y), 1, 2); }
    for (let i = 0; i < 50; i++) { const x = ((i * 53.7 + time * (3 + i % 4) + Math.sin(time * .7 + i) * 7) % W + W) % W, y = ((i * 37.3 + time * (7 + i % 5 * 3)) % 230) - 10;
      c.fillStyle = i % 9 === 0 ? 'rgba(255,150,80,.75)' : 'rgba(200,170,170,.4)'; c.fillRect(Math.round(x), Math.round(y), 1 + (i % 4 === 0), 1); }
  };
  r.lights = () => { glow(EX, 52, 90, '255,100,36', .13 + .03 * Math.sin(time * 1.3)); glow(EX, 150, 70, '255,90,36', .1); glow(336, LY + 13, 22, '255,90,40', .22 + .04 * Math.sin(time * 3)); };
  r.interacts = [
    { x: 328, x1: 312, x2: 338, y: LY, py: LY - 40, label: 'Contempler', run: () => {
      const V = ['Le soleil noir ne bouge plus. Le rayon, lui, ne cesse de tomber.', 'Là-bas, au bord de la rivière de sang, quelqu’un attend depuis toujours.', 'Le ciel est rouge depuis si longtemps que personne ne se souvient du bleu.', 'Quelque chose, dans cette lumière, te regarde en retour.'];
      toast(V[Math.random() * V.length | 0]); } },
  ];
}
