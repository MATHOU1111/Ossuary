"use strict";
// Portes : passages entre salles (arche lumineuse, lucioles, grille optionnelle).

/* ---------------- portes ---------------- */
// d = { x1, x2, spring, bottom, rr, floor, label, to, toX, bars, open, near }
function portalRows(d) {
  if (!d.rows) { d.rows = []; archRows(d.x1, d.x2, d.spring, d.bottom, d.rr, (y, a, b) => d.rows.push([y, a, b])); d.top = Math.min(...d.rows.map(r => r[0])); }
  return d.rows;
}
function drawPortal(c, d) {
  const rows = portalRows(d), k = d.open, n = d.near, h = d.bottom - d.top, pulse = .5 + .5 * Math.sin(time * 2.2);
  for (const [y, a, b] of rows) {
    const t = (y - d.top) / h;
    c.fillStyle = '#03050a'; c.fillRect(a, y, b - a, 1);
    const g = (.08 + .1 * pulse + .35 * n + .75 * k) * Math.pow(t, 1.6 - k);
    c.fillStyle = `rgba(${d.col || '60,225,150'},${Math.min(.95, g)})`; c.fillRect(a, y, b - a, 1);
    if (k > .3) { c.fillStyle = `rgba(${d.col2 || '190,255,225'},${(k - .3) * .5 * Math.pow(1 - Math.abs(t - .6), 3)})`; c.fillRect(a + 2, y, b - a - 4, 1); }
  }
  // tourbillon de lucioles dans l'embrasure quand on est proche
  const motes = 3 + Math.round(n * 6 + k * 10);
  for (let i = 0; i < motes; i++) { const ph = time * (.6 + i * .07) + i * 1.7, x = (d.x1 + d.x2) / 2 + Math.sin(ph * 1.3) * (d.x2 - d.x1) * .35, y = d.bottom - ((ph * 9) % h);
    c.fillStyle = `rgba(${d.col2 || '170,255,210'},${.25 + .5 * n + .25 * k})`; c.fillRect(Math.round(x), Math.round(y), 1, 1); }
  if (d.bars) { const lift = Math.round(k * (h + 4)), rattle = n > .5 && k < .05 ? Math.round(Math.sin(time * 30) * .6) : 0;
    c.fillStyle = '#16231d';
    for (const [y, a, b] of rows) for (let x = d.x1 + 2; x < d.x2 - 1; x += 4) { const yy = y - lift; if (yy < d.top) continue; const r = rows.find(q => q[0] === yy); if (r && x >= r[1] && x < r[2]) c.fillRect(x + rattle, yy, 1, 1); }
    c.fillStyle = '#2a3a32'; const yb = d.top + 8 - lift; if (yb > d.top) { const r = rows.find(q => q[0] === yb); if (r) c.fillRect(r[1], yb, r[2] - r[1], 1); } }
}
function portalGlow(d) { const cx = (d.x1 + d.x2) / 2; glow(cx, d.bottom - 6, 26 + 20 * d.near + 40 * d.open, d.col || '60,220,150', .12 + .04 * Math.sin(time * 2) + .14 * d.near + .3 * d.open); }

