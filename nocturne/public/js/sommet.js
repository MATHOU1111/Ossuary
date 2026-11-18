"use strict";
// « Le Sommet » : la cime du grand chêne de la Clairière. La vue : la lune, la forêt de sapins à perte de vue, la rivière d'argent.
// On y arrive en grimpant tout en haut de l'arbre (place.js) ; on redescend avec E (« Descendre ») ou en sautant dans le vide.

ROOMS.remparts.up = 'sommet';

{ const EX = 150, MY = 52, TX = 300, LY = 122;
  const r = ROOMS.sommet = { id: 'sommet', name: 'LE SOMMET', down: 'remparts', ground: null, fires: [], climbs: [], grass: [], fogFar: null, fogNear: null };
  r.stars = makeStars(EX, MY); r.hatch = { x: TX, y: LY };
  // la vue : ciel de nuit + forêt (mêmes pinceaux que la Clairière)
  { const [sk, s] = mk(W, H); s.drawImage(NOC_PAINT.paintSky(W, H, 0, EX, MY, 150), 0, 0); NOC_PAINT.paintLand(s, 24, true); r.sky = sk; }
  // l'arbre : le feuillage autour, le tronc qui monte du bas de l'écran jusqu'à la branche où l'on se tient
  const [wl, t] = mk(W, H); r.wall = wl; r.play = mk(W, H)[0];
  { for (const [x, y, rr, n] of [[372, 70, 36, 22], [244, 160, 26, 14], [360, 176, 30, 16], [300, 60, 20, 10]]) NOC_PAINT.feuillage(t, x, y, rr, n);
    t.fillStyle = '#3a2818'; pline(t, 258, LY + 1, 340, LY + 1, 4); t.fillStyle = '#1a1009'; pline(t, 258, LY + 3, 340, LY + 3, 1); t.fillStyle = '#6a4a30'; pline(t, 258, LY, 340, LY, 1);
    t.fillStyle = '#3a2818'; tree(t, 258, LY + 2, 10, Math.PI * .85, 2, 2); tree(t, 340, LY + 2, 10, Math.PI * .15, 2, 2);
    t.fillStyle = '#2e2014'; for (let k = 0; k < 5; k++) tree(t, TX + (k - 2) * 12, LY - 1, 22 + R() * 8, -Math.PI / 2 + (k - 2) * .38, 4, 3);
    for (const [x, y] of [[276, 94], [322, 90], [300, 84], [262, 104], [338, 102]]) NOC_PAINT.feuillage(t, x, y, 8, 3);   // jeunes pousses au bout des rameaux
    for (let y = H; y >= LY - 2; y--) { const hw = Math.round(6 + 4 * (y - LY) / (H - LY)), cx = TX + Math.round(Math.sin(y * .04) * 2);
      for (let x = cx - hw; x <= cx + hw; x++) { const i = x - (cx - hw); t.fillStyle = i < 2 ? '#6a4a30' : x > cx + hw - 2 ? '#140d08' : (x * 7 + (y >> 2)) % 9 === 0 || R() < .1 ? '#2a1c12' : '#3a2818'; t.fillRect(x, y, 1, 1); } }
    t.fillStyle = '#140d08'; t.fillRect(TX - 2, 168, 3, 5); t.fillRect(TX - 1, 167, 1, 7);
    // lanterne et chouette
    t.fillStyle = '#1a120c'; t.fillRect(336, LY + 4, 1, 5); t.fillRect(334, LY + 9, 5, 7); t.fillStyle = '#f0b048'; t.fillRect(335, LY + 10, 3, 5); t.fillStyle = '#fff0b0'; t.fillRect(336, LY + 11, 1, 2);
    { const ox = 272, oy = LY; t.fillStyle = '#2a1c12'; t.fillRect(ox - 3, oy - 9, 7, 9); t.fillStyle = '#7a5a3a'; t.fillRect(ox - 2, oy - 9, 5, 8); t.fillStyle = '#c8a878'; t.fillRect(ox - 2, oy - 8, 5, 3);
      t.fillStyle = '#2a1c12'; t.fillRect(ox - 3, oy - 11, 1, 2); t.fillRect(ox + 3, oy - 11, 1, 2); t.fillStyle = '#ffd860'; t.fillRect(ox - 1, oy - 7, 1, 1); t.fillRect(ox + 1, oy - 7, 1, 1);
      t.fillStyle = '#e0a040'; t.fillRect(ox, oy - 6, 1, 1); t.fillStyle = '#5a4028'; t.fillRect(ox - 1, oy - 3, 3, 1); } }
  r.plats = [{ x1: 262, x2: 338, y: LY, solid: true }];
  r.dyn = c => {
    // lucioles qui montent jusqu'ici, et quelques feuilles portées par le vent
    for (let i = 0; i < 12; i++) { const l = NOC_LUCIOLE(i + 30); if (l.a < .05) continue; c.fillStyle = `rgba(220,255,140,${l.a})`; c.fillRect(Math.round(l.x), Math.round(l.y), 1, 1); }
    for (let i = 0; i < 5; i++) { const x = ((time * (16 + i * 4) + i * 90) % (W + 40)) - 20, y = 60 + i * 24 + Math.sin(time * 1.5 + i) * 8;
      c.fillStyle = ['#3a6a48', '#6a8a3a', '#b08a3a'][i % 3]; c.fillRect(Math.round(x), Math.round(y), 2, 1); }
  };
  r.lights = () => { glow(EX, MY, 90, '190,215,255', .12 + .02 * Math.sin(time * 1.3)); glow(336, LY + 13, 22, '255,190,90', .24 + .04 * Math.sin(time * 3)); };
  r.interacts = [
    { x: 328, x1: 312, x2: 338, y: LY, py: LY - 40, label: 'Contempler', run: () => {
      const V = ['La lune éclaire la forêt jusqu’à la rivière d’argent.', 'Au loin, les sapins ondulent comme une mer sombre.', 'Une chouette hulule quelque part sous tes pieds.',
        'D’ici, on voit les lanternes de la clairière briller entre les feuilles.', 'Le vent sent la mousse et la résine. Tout est calme.'];
      toast(V[Math.random() * V.length | 0]); } },
  ];
}
