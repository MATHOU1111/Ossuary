"use strict";
// Moteur de base : canvas, utilitaires, couleurs et police pixel 3x5.

const W = 384, H = 216, GROUND = 184;
const cv = document.getElementById('game'), ctx = cv.getContext('2d');
cv.width = W; cv.height = H; ctx.imageSmoothingEnabled = false;

function mk(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); x.imageSmoothingEnabled = false; return [c, x]; }
function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const R = rng(1337);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
function makeNoise(step, amp) { const pts = []; for (let i = 0; i <= W / step + 2; i++) pts.push(R()); return x => { const i = Math.floor(x / step), t = x / step - i, s = t * t * (3 - 2 * t); return (pts[i] * (1 - s) + pts[i + 1] * s) * amp; }; }
function disc(c, cx, cy, r) { for (let y = -r; y <= r; y++) { const hw = Math.round(Math.sqrt(r * r - y * y)); c.fillRect(cx - hw, cy + y, hw * 2 + 1, 1); } }
function shade(hex, f) { const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = n >> 8 & 255, b = n & 255;
  if (f > 1) { r += (255 - r) * (f - 1); g += (255 - g) * (f - 1); b += (255 - b) * (f - 1); } else { r *= f; g *= f; b *= f; }
  return `rgb(${r | 0},${g | 0},${b | 0})`; }

/* ---------------- bitmap font 3x5 ---------------- */
const GL = {A:'010101111101101',B:'110101110101110',C:'011100100100011',D:'110101101101110',E:'111100110100111',F:'111100110100100',
G:'011100101101011',H:'101101111101101',I:'111010010010111',J:'001001001101010',K:'101101110101101',L:'100100100100111',M:'101111111101101',
N:'110101101101101',O:'010101101101010',P:'110101110100100',Q:'010101101110011',R:'110101110101101',S:'011100010001110',T:'111010010010010',
U:'101101101101111',V:'101101101101010',W:'101101111111101',X:'101101010101101',Y:'101101010010010',Z:'111001010100111',
'0':'111101101101111','1':'010110010010111','2':'110001010100111','3':'110001010001110','4':'101101111001001','5':'111100110001110',
'6':'011100111101111','7':'111001010010010','8':'111101111101111','9':'111101111001110','.':'000000000000010',',':'000000000010100',
'!':'010010010000010','?':'110001010000010',"'":'010010000000000','-':'000000111000000',':':'000010000010000','_':'000000000000111',
'(':'001010010010001',')':'100010010010100','/':'001001010100100','+':'000010111010000','=':'000111000111000','<':'001010100010001',
'>':'100010001010100','*':'000101010101000','#':'101111101111101','@':'111101111100011','%':'101001010100101','&':'010101010101011',
'"':'101101000000000',' ':'000000000000000'};
function norm(s) { return s.replace(/…/g, '...').replace(/[’‘]/g, "'").replace(/[«»“”]/g, '"').replace(/œ/gi, 'oe')
  .normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase(); }
const textW = s => s.length * 4 - 1;
const tcache = new Map();
function txt(s, col, ol) {
  const k = s + '|' + col + '|' + ol; if (tcache.has(k)) return tcache.get(k);
  const [c, x] = mk(textW(s) + 2, 7);
  const draw = (cl, ox, oy) => { x.fillStyle = cl; for (let i = 0; i < s.length; i++) { const g = GL[s[i]] || GL['?'];
    for (let p = 0; p < 15; p++) if (g[p] === '1') x.fillRect(1 + i * 4 + p % 3 + ox, 1 + (p / 3 | 0) + oy, 1, 1); } };
  if (ol) for (const [a, b] of [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[1,1],[-1,1],[1,-1]]) draw(ol, a, b);
  draw(col, 0, 0);
  if (tcache.size > 400) tcache.clear(); tcache.set(k, c); return c;
}
