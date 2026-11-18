'use strict';
// Génère dist/ossuary.html : tout le jeu dans un seul fichier, jouable hors ligne (sans serveur).
// Usage : npm run build:single
const fs = require('fs'), path = require('path');
const pub = path.join(__dirname, '..', 'public');
let html = fs.readFileSync(path.join(pub, 'index.html'), 'utf8');
html = html.replace(/<link rel="icon"[^>]*>\n?/, '');
html = html.replace(/<link rel="stylesheet" href="css\/style.css">/, () => `<style>\n${fs.readFileSync(path.join(pub, 'css/style.css'), 'utf8')}</style>`);
// les feuilles de sprites (public/skins/**.png) sont embarquées en base64 : le jeu hors ligne n'a pas de dossier à côté de lui
const sprites = {};
(function walk(dir, rel) { for (const f of fs.readdirSync(dir, { withFileTypes: true })) { const p = path.join(dir, f.name), r = rel + '/' + f.name;
  if (f.isDirectory()) walk(p, r); else if (/\.png$/i.test(f.name)) sprites[r] = 'data:image/png;base64,' + fs.readFileSync(p).toString('base64'); } })(path.join(pub, 'skins'), 'skins');
let first = true;
html = html.replace(/<script src="(js\/[^"]+)"><\/script>/g, (_, src) => {
  const code = fs.readFileSync(path.join(pub, src), 'utf8').replace(/<\/script/gi, '<\\/script');
  const pre = first ? '<script>window.NOCTURNE_OFFLINE = true; window.SPRITE_INLINE = ' + JSON.stringify(sprites) + ';</script>\n' : ''; first = false;
  return `${pre}<script>\n/* ${src} */\n${code}</script>`;
});
fs.mkdirSync(path.join(__dirname, '..', 'dist'), { recursive: true });
fs.writeFileSync(path.join(__dirname, '..', 'dist', 'ossuary.html'), html);
console.log('dist/ossuary.html généré (' + Math.round(html.length / 1024) + ' Ko)');
