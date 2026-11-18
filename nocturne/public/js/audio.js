"use strict";
// Le son, entièrement généré par le navigateur (Web Audio) : aucun fichier audio.
// - ambiances par salle (vent, pluie, feu, grillons, bourdon…)
// - musique générative par salle (harpe, clavecin, boîte à musique, luth du barde)
// - bruitages (pas, saut, atterrissage, chat, niveau, phénix, porte, créatures…)
// Touche M ou médaillon « son » pour couper / remettre le son.

// Ambiances (vent, rafales, pluie, bourdon, crépitements, gouttes, projecteur) : coupées pour l'instant.
// On garde la musique et les bruitages (pas, saut, actions…). Mettre true pour les réentendre.
const AMBIANCE = false;

const SND = { ctx: null, on: true, room: null, step: 0, next: 0, chord: 0, vive: 0, lastXp: 0 };
try { SND.on = localStorage.getItem('nocturne-sound') !== '0'; } catch (e) { }
const mtof = m => 440 * Math.pow(2, (m - 69) / 12);

function audioInit() {
  if (SND.ctx) { if (SND.ctx.state === 'suspended') SND.ctx.resume(); return; }
  const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
  const c = SND.ctx = new AC();
  SND.master = c.createGain(); SND.master.gain.value = SND.on ? .85 : 0; SND.master.connect(c.destination);
  const len = c.sampleRate * 2.6, ir = c.createBuffer(2, len, c.sampleRate);
  for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.4); }
  SND.verb = c.createConvolver(); SND.verb.buffer = ir; const vg = c.createGain(); vg.gain.value = .45; SND.verb.connect(vg); vg.connect(SND.master);
  const bus = v => { const g = c.createGain(); g.gain.value = v; g.connect(SND.master); return g; };
  SND.music = bus(.3); SND.amb = bus(.55); SND.fx = bus(.55);
  const nb = c.createBuffer(1, c.sampleRate * 2, c.sampleRate), nd = nb.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1; SND.noise = nb;
  // couches d'ambiance permanentes, réglées en volume selon la salle
  const loop = (filters) => { const s = c.createBufferSource(); s.buffer = nb; s.loop = true; let n = s; for (const f of filters) { n.connect(f); n = f; } const g = c.createGain(); g.gain.value = 0; n.connect(g); g.connect(SND.amb); s.start(); return g; };
  const bp = (f, q) => { const x = c.createBiquadFilter(); x.type = 'bandpass'; x.frequency.value = f; x.Q.value = q; return x; };
  const lp = f => { const x = c.createBiquadFilter(); x.type = 'lowpass'; x.frequency.value = f; return x; };
  const hp = f => { const x = c.createBiquadFilter(); x.type = 'highpass'; x.frequency.value = f; return x; };
  const wf = bp(450, .6); SND.wind = loop([wf]);
  const lfo = c.createOscillator(), lg = c.createGain(); lfo.frequency.value = .07; lg.gain.value = 260; lfo.connect(lg); lg.connect(wf.frequency); lfo.start();
  const gf = bp(900, .9); SND.gust = loop([gf]);
  const lfo2 = c.createOscillator(), lg2 = c.createGain(); lfo2.frequency.value = .21; lg2.gain.value = 600; lfo2.connect(lg2); lg2.connect(gf.frequency); lfo2.start();
  SND.rain = loop([hp(900), lp(6500)]);
  SND.drone = c.createGain(); SND.drone.gain.value = 0; SND.drone.connect(SND.amb);
  const dl = lp(170); dl.connect(SND.drone); for (const f of [41, 41.7, 61.5]) { const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; o.connect(dl); o.start(); }
  SND.hum = c.createGain(); SND.hum.gain.value = 0; SND.hum.connect(SND.amb); { const o = c.createOscillator(); o.frequency.value = 55; o.connect(SND.hum); o.start(); }
  audioRoom(curRoom.id, true);
}
// depuisCompte : réglage venu du compte (on ne le renvoie pas au serveur) ; sinon il est enregistré dans le compte du joueur
function setSound(on, depuisCompte) { SND.on = on; try { localStorage.setItem('nocturne-sound', on ? '1' : '0'); } catch (e) { }
  if (!depuisCompte && COMPTE.token) api('options', { son: on });
  if (SND.ctx) SND.master.gain.setTargetAtTime(on ? .85 : 0, SND.ctx.currentTime, .1); }
const AMB = { // vent, rafales, pluie, bourdon, résonance de salle
  remparts: [.35, .05, 0, 0, 0], devanture: [.22, 0, 0, 0, 0], trone: [.05, 0, 0, 0, .05], chateau: [.4, .3, 0, .1, 0], caveau: [0, 0, 0, .55, .1], catacombes: [.06, 0, 0, .8, .2], sommet: [.45, .5, 0, 0, 0], cinema: [0, 0, 0, 0, .04] };
function audioRoom(id, now) {
  SND.room = id; if (!SND.ctx) return; const t = SND.ctx.currentTime, k = now ? .05 : .8, a = (AMBIANCE && AMB[id]) || [0, 0, 0, 0, 0];
  [SND.wind, SND.gust, SND.rain, SND.drone, SND.hum].forEach((g, i) => g.gain.setTargetAtTime(a[i] * (i === 3 ? .35 : i === 4 ? .5 : 1), t, k));
}

/* ---------------- briques sonores ---------------- */
function tone(f, d, { type = 'triangle', v = .2, at = .005, bus = SND.fx, wet = 0, when = 0, slide = 0, lp = 0 } = {}) {
  if (!SND.ctx) return; const c = SND.ctx, t = c.currentTime + when, o = c.createOscillator(), g = c.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t); if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, f * slide), t + d);
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + at); g.gain.exponentialRampToValueAtTime(.0005, t + d);
  let n = o; if (lp) { const f2 = c.createBiquadFilter(); f2.type = 'lowpass'; f2.frequency.value = lp; o.connect(f2); n = f2; }
  n.connect(g); g.connect(bus); if (wet) { const w = c.createGain(); w.gain.value = wet; g.connect(w); w.connect(SND.verb); }
  o.start(t); o.stop(t + d + .05);
}
function noise(d, { f = 1000, q = 1, type = 'bandpass', v = .2, when = 0, sweep = 0, bus = SND.fx, wet = 0, at = .003 } = {}) {
  if (!SND.ctx) return; const c = SND.ctx, t = c.currentTime + when, s = c.createBufferSource(), fl = c.createBiquadFilter(), g = c.createGain();
  s.buffer = SND.noise; fl.type = type; fl.frequency.setValueAtTime(f, t); fl.Q.value = q; if (sweep) fl.frequency.exponentialRampToValueAtTime(f * sweep, t + d);
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + at); g.gain.exponentialRampToValueAtTime(.0005, t + d);
  s.connect(fl); fl.connect(g); g.connect(bus); if (wet) { const w = c.createGain(); w.gain.value = wet; g.connect(w); w.connect(SND.verb); }
  s.start(t, Math.random() * 1.5); s.stop(t + d + .05);
}

/* ---------------- bruitages ---------------- */
const SURF = { remparts: [1700, .07], sommet: [1700, .07], trone: [1300, .06], devanture: [1500, .07], caveau: [800, .08], catacombes: [700, .1] };
const sfx = {
  step() { const s = SURF[curRoom.id] || SURF.remparts; noise(.045, { f: s[0] * (.85 + Math.random() * .3), q: 1.4, v: s[1] }); },
  jump() { noise(.14, { f: 500, sweep: 3, q: .8, v: .07 }); },
  land(p = 1) { tone(95, .14, { type: 'sine', v: .22 * p, slide: .55 }); noise(.07, { type: 'lowpass', f: 700, v: .1 * p }); },
  climb() { noise(.05, { f: 2600, q: .7, v: .05 }); },
  chat(mine) { const a = mine ? [660, 880] : [520, 415]; tone(a[0], .07, { type: 'sine', v: .09 }); tone(a[1], .09, { type: 'sine', v: .09, when: .06 }); },
  click() { tone(1900, .03, { type: 'square', v: .03, lp: 3000 }); },
  xp() { if (time - SND.lastXp < .3) return; SND.lastXp = time; tone(1568, .25, { type: 'sine', v: .05, wet: .5 }); tone(2093, .3, { type: 'sine', v: .035, when: .06, wet: .5 }); },
  level() { [62, 65, 69, 74, 77].forEach((m, i) => tone(mtof(m + 12), .9, { v: .12, when: i * .09, wet: .7 })); },
  door() { noise(1.3, { type: 'lowpass', f: 160, v: .3, at: .3 }); for (let i = 0; i < 6; i++) tone(1200 + Math.random() * 1800, .7, { type: 'sine', v: .03, when: .2 + i * .12, wet: .9 }); },
  summon() { noise(.9, { f: 300, sweep: 7, q: .7, v: .22, at: .25, wet: .4 }); tone(70, .9, { type: 'sine', v: .2, slide: 2.2, at: .2 }); for (let i = 0; i < 8; i++) noise(.03, { f: 3000, v: .05, when: .3 + Math.random() * .6 }); },
  dismiss() { noise(.6, { f: 1800, sweep: .2, q: .8, v: .15, wet: .3 }); },
  flap(v = 1) { noise(.11, { type: 'lowpass', f: 520, v: .16 * v }); },
  heart() { [84, 88, 91].forEach((m, i) => tone(mtof(m), .4, { type: 'sine', v: .05, when: i * .07, wet: .6 })); },
  laugh() { for (let i = 0; i < 4; i++) tone(560 - i * 30, .07, { type: 'triangle', v: .06, when: i * .1 }); },
  surprise() { tone(300, .25, { type: 'sine', v: .12, slide: 2.6 }); },
  wave() { tone(1046, .2, { type: 'sine', v: .05, wet: .4 }); tone(1318, .25, { type: 'sine', v: .045, when: .08, wet: .4 }); },
  meow() { tone(560, .38, { type: 'triangle', v: .07, slide: .75, lp: 1800, at: .05 }); tone(840, .2, { type: 'sine', v: .03, slide: .7, at: .04 }); },
  purr() { for (let i = 0; i < 26; i++) noise(.035, { type: 'lowpass', f: 260, v: .08, when: i * .045 }); },
  bats() { for (let i = 0; i < 16; i++) noise(.025, { f: 2600 + Math.random() * 1200, q: 2, v: .05, when: i * .035 }); },
  squeak() { tone(3100, .07, { type: 'sine', v: .03, slide: 1.2 }); },
  caw() { for (const w of [0, .3]) tone(620, .22, { type: 'sawtooth', v: .05, slide: .8, lp: 1400, when: w }); },
};

/* ---------------- musique générative ---------------- */
const SONGS = {
  remparts: { bpm: 70, chords: [[50, 53, 57], [46, 50, 53], [53, 57, 60], [48, 52, 55]], scale: [62, 65, 67, 69, 72, 74, 77], p: .32, inst: 'harp' },
  devanture: { bpm: 84, chords: [[48, 52, 55], [45, 48, 52], [41, 45, 48], [43, 47, 50]], scale: [72, 74, 76, 79, 81, 84], p: .3, inst: 'box' },
  trone: { bpm: 66, chords: [[50, 53, 57], [43, 46, 50], [45, 49, 52], [50, 53, 57]], scale: null, p: 1, inst: 'harpsi' },
};
function pad(notes, dur) { for (const m of notes) for (const det of [-4, 4]) { if (!SND.ctx) return; const c = SND.ctx, t = c.currentTime, o = c.createOscillator(), g = c.createGain(), f = c.createBiquadFilter();
  o.type = 'triangle'; o.frequency.value = mtof(m); o.detune.value = det; f.type = 'lowpass'; f.frequency.value = 800;
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.035, t + 1.4); g.gain.setTargetAtTime(0, t + dur - .6, .5);
  o.connect(f); f.connect(g); g.connect(SND.music); const w = c.createGain(); w.gain.value = .5; g.connect(w); w.connect(SND.verb); o.start(t); o.stop(t + dur + 2); } }
function pluck(m, inst, when = 0) {
  const f = mtof(m);
  if (inst === 'harp') tone(f, 1.6, { v: .11, bus: SND.music, wet: .7, when });
  else if (inst === 'box') tone(f, 1.2, { type: 'sine', v: .07, bus: SND.music, wet: .9, when });
  else if (inst === 'harpsi') tone(f, .45, { type: 'square', v: .045, bus: SND.music, wet: .5, lp: 2400, when });
  else { tone(f, .7, { type: 'sawtooth', v: .05, bus: SND.music, wet: .4, lp: 1800, when }); tone(f * 2, .3, { type: 'triangle', v: .025, bus: SND.music, when }); }
}
function audioTick(dt) {
  if (!SND.ctx || !SND.on) return;
  const c = SND.ctx, song = SONGS[SND.room];
  SND.music.gain.setTargetAtTime(song ? .3 : 0, c.currentTime, .5);
  if (!song) return;
  const bpm = song.bpm, eighth = 30 / bpm;
  if (SND.next < c.currentTime) SND.next = c.currentTime + .05;
  while (SND.next < c.currentTime + .15) {
    const when = SND.next - c.currentTime, st = SND.step % 16, ch = song.chords[Math.floor(SND.step / 16) % song.chords.length];
    if (st === 0) pad(ch, eighth * 16);
    if (song.inst === 'harpsi') { const arp = [0, 1, 2, 1]; pluck(ch[arp[st % 4]] + 24, 'harpsi', when); }
    else if (song.inst === 'lute') { const arp = [0, 2, 1, 2]; pluck(ch[arp[st % 4]] + 12, 'lute', when); if (Math.random() < song.p * (SND.vive > time ? 1.4 : 1)) pluck(song.scale[Math.random() * song.scale.length | 0] + 12, 'lute', when + eighth / 2); }
    else if (Math.random() < song.p) pluck(song.scale[Math.random() * song.scale.length | 0], song.inst, when);
    SND.step++; SND.next += eighth;
  }
  // détails d'ambiance aléatoires
  if (!AMBIANCE) return;
  const R0 = SND.room, near = (x) => player ? clamp(1 - Math.abs(player.x - x) / 160, .1, 1) : .3;
  if (R0 === 'remparts' && Math.random() < dt * 7) noise(.02 + Math.random() * .03, { f: 2500 + Math.random() * 1500, q: 1.5, v: .035 });
  if (R0 === 'sommet' && Math.random() < dt * 1.5) noise(.06, { f: 700, q: .8, v: .05 });
  if (R0 === 'trone' && Math.random() < dt * .25) tone(1800 + Math.random() * 700, .3, { type: 'sine', v: .03, wet: 1 });
  if (R0 === 'caveau' && Math.random() < dt * .35) tone(1500 + Math.random() * 700, .06, { type: 'sine', v: .04, slide: .5, wet: 1 });
}
// le navigateur n'autorise le son qu'après une action du joueur
addEventListener('pointerdown', () => { if (player) audioInit(); }); addEventListener('keydown', () => { if (player) audioInit(); });
