// Sound effects, synthesised live with the Web Audio API (no audio files, so
// nothing extra to download or cache). Each theme has its own "kit":
// - Dark:           synth zaps, glitches and neon sweeps.
// - Light:          soft marimba notes, bubbly pops and chimes.
// - Power of Chaos: card flips, golden bells, harp, brass fanfares and booms.
// The logo / Exodia easter egg shares one sinister set across all themes, the
// 30000 LP "Full Heal!" easter egg one joyful fanfare, the rare Shadow Realm
// defeat one ghostly howl, the 25 LP "Unstoppable" easter egg one pounding
// heartbeat, "Believe in the heart of the cards!" one heavenly draw,
// "Screw the rules" one cash-register fanfare, "Mind Crush" one eerie wink,
// the theme roulette one dizzy slide whistle, Pharaoh's Nap one snore, the
// Millennium Puzzle one ancient golden hum, the broken speaker one sad
// trombone, Pot of Greed one deadpan "bonk-bonk", Trap Hole one cartoon
// fall and boing, Gaia the Fierce Knight one gallop and whinny, Dark Paladin
// one fusion and a spell-slicing "shing", the Egyptian Gods one divine traffic
// jam, every other character's hold-the-card egg its own little skit
// (CHAR_EGG_SOUNDS), and the secret
// Duel Disk mini-game a whole board's worth (DISK_SOUNDS).
// effects.js calls playSound(event) for the same events that drive the
// animations. Sound is on by default and can be muted (saved on the device).
const SOUND_STORAGE_KEY = 'ygo_sound';
const SOUND_MASTER_VOLUME = 1;

let sfxCtx = null;
let sfxOut = null;
let sfxNoiseBuffer = null;

function isSoundOn() {
  try {
    return localStorage.getItem(SOUND_STORAGE_KEY) !== 'off';
  } catch {
    return true;
  }
}

function toggleSound() {
  // The speaker is in the Graveyard (speaker-easter-egg.js) — no touching.
  if (speakerEgg.dead) return;
  const on = !isSoundOn();
  try {
    localStorage.setItem(SOUND_STORAGE_KEY, on ? 'on' : 'off');
  } catch {}
  if (on) {
    unlockAudio();
    playSound({ name: 'sound-on' });
  }
  if (countSoundSpam()) return;
  render();
}

// ---------------------------------------------------------------------------
// Audio context (browsers only allow it to start from a user gesture)
// ---------------------------------------------------------------------------

function getAudio() {
  if (sfxCtx) return sfxCtx;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;

  // "ambient" = respect the phone's silent switch and mix with other audio.
  try {
    if (navigator.audioSession) navigator.audioSession.type = 'ambient';
  } catch {}

  sfxCtx = new AudioCtx();
  const compressor = sfxCtx.createDynamicsCompressor();
  compressor.threshold.value = -16;
  compressor.ratio.value = 4;
  sfxOut = sfxCtx.createGain();
  sfxOut.gain.value = SOUND_MASTER_VOLUME;
  sfxOut.connect(compressor).connect(sfxCtx.destination);
  return sfxCtx;
}

function unlockAudio() {
  if (!isSoundOn()) return;
  const ctx = getAudio();
  if (ctx && ctx.state !== 'running') ctx.resume().catch(() => {});
}

// Capture phase so the context exists before the tapped button's handler runs.
['pointerdown', 'touchend', 'click', 'keydown'].forEach(name => {
  document.addEventListener(name, unlockAudio, { capture: true, passive: true });
});

document.addEventListener('pointerdown', event => {
  if (event.target.closest?.('button, [onclick]')) playSound({ name: 'tap' });
}, { passive: true });

function playSound(event) {
  if (!isSoundOn() || !sfxCtx || sfxCtx.state === 'closed') return;

  const kit = SOUND_KITS[document.documentElement.dataset.theme] || SOUND_KITS.dark;
  const sound = normaliseSoundEvent(event);
  if (!sound) return;

  const t = sfxCtx.currentTime + 0.01;
  try {
    kit[sound.name]?.(t, sound);
    // The "USED" stamp lands late when a single-use ability is activated.
    if (sound.name === 'activate' && sound.exhausted) kit.stamp?.(t + 1.1, sound);
  } catch {}
}

function normaliseSoundEvent(event) {
  if (event.name === 'lp-change') {
    if (event.silent) return null;
    const amount = Math.abs(event.to - event.from);
    if (event.to === 0 && event.from > 0) return { name: event.shadowRealm ? 'shadow-realm' : 'defeat', amount };
    if (isHealOverflow(event.from, event.to)) return { name: 'heal-overflow', amount };
    if (isLastStand(event.from, event.to)) return { name: 'last-stand', amount };
    if (isTinyViolin(event.from, event.to)) return { name: 'tiny-violin', amount };
    return { name: event.to < event.from ? 'damage' : 'heal', amount };
  }
  if (event.name === 'use' && event.delta < 0) return { ...event, name: 'use-undo' };
  return event;
}

// ---------------------------------------------------------------------------
// Synth building blocks
// ---------------------------------------------------------------------------

const midi = n => 440 * Math.pow(2, (n - 69) / 12);
const rnd = (min, max) => min + Math.random() * (max - min);

function envelope(param, t, peak, attack, dur) {
  param.setValueAtTime(0.0001, t);
  param.exponentialRampToValueAtTime(Math.max(peak, 0.0002), t + attack);
  param.exponentialRampToValueAtTime(0.0001, t + Math.max(dur, attack + 0.01));
}

function makeFilter(t, type, freq, to, dur, q = 1) {
  const filter = sfxCtx.createBiquadFilter();
  filter.type = type;
  filter.frequency.setValueAtTime(freq, t);
  if (to) filter.frequency.exponentialRampToValueAtTime(to, t + dur);
  filter.Q.value = q;
  return filter;
}

// filter: cutoff in Hz, or [from, to] for a lowpass sweep. out: node to play
// into (defaults to the master output).
function tone({ t, freq, to, slide, dur = 0.2, type = 'sine', gain = 0.2, attack = 0.005, filter, q = 1, detune = 0, out = sfxOut }) {
  const osc = sfxCtx.createOscillator();
  const amp = sfxCtx.createGain();
  osc.type = type;
  osc.detune.value = detune;
  osc.frequency.setValueAtTime(freq, t);
  if (to) osc.frequency.exponentialRampToValueAtTime(to, t + (slide ?? dur));
  envelope(amp.gain, t, gain, attack, dur);

  let node = osc;
  if (filter) {
    const [from, end] = Array.isArray(filter) ? filter : [filter, null];
    node = node.connect(makeFilter(t, 'lowpass', from, end, dur, q));
  }
  node.connect(amp).connect(out);
  osc.start(t);
  osc.stop(t + dur + 0.05);
}

function getNoiseBuffer() {
  if (sfxNoiseBuffer) return sfxNoiseBuffer;
  const length = sfxCtx.sampleRate * 2;
  sfxNoiseBuffer = sfxCtx.createBuffer(1, length, sfxCtx.sampleRate);
  const data = sfxNoiseBuffer.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
  return sfxNoiseBuffer;
}

function noise({ t, dur = 0.2, gain = 0.2, type = 'bandpass', freq = 1000, to, q = 1, attack = 0.005, out = sfxOut }) {
  const src = sfxCtx.createBufferSource();
  const amp = sfxCtx.createGain();
  src.buffer = getNoiseBuffer();
  src.loop = true;
  envelope(amp.gain, t, gain, attack, dur);
  src.connect(makeFilter(t, type, freq, to, dur, q)).connect(amp).connect(out);
  src.start(t, Math.random());
  src.stop(t + dur + 0.05);
}

function chord({ t, notes, dur = 1, gain = 0.06, type = 'sawtooth', attack = 0.04, filter = 1800 }) {
  notes.forEach(n => {
    tone({ t, freq: midi(n), dur, type, gain, attack, filter, detune: -6 });
    tone({ t, freq: midi(n), dur, type, gain: gain * 0.7, attack, filter, detune: 7 });
  });
}

// Struck-metal bell: slightly inharmonic partials with longer low tails.
function bell({ t, freq, dur = 1.4, gain = 0.1, out }) {
  [[1, 1], [2.01, 0.5], [3.02, 0.28], [4.17, 0.16], [5.43, 0.1]].forEach(([ratio, level], i) => {
    tone({ t, freq: freq * ratio, dur: dur / (1 + i * 0.7), gain: gain * level, attack: 0.002, out });
  });
}

function marimba({ t, note, gain = 0.16, dur = 0.45 }) {
  tone({ t, freq: midi(note), dur, gain, attack: 0.003 });
  tone({ t, freq: midi(note) * 4, dur: 0.05, gain: gain * 0.25, attack: 0.001 });
}

function pluck({ t, note, gain = 0.1, dur = 0.7 }) {
  tone({ t, freq: midi(note), dur, type: 'triangle', gain, attack: 0.002 });
  tone({ t, freq: midi(note) * 2, dur: dur * 0.4, gain: gain * 0.3, attack: 0.002 });
}

function bubble({ t, from = 300, to = 900, gain = 0.12, dur = 0.09 }) {
  tone({ t, freq: from, to, dur, gain, attack: 0.004 });
}

function arpeggio(t, notes, step, play) {
  notes.forEach((note, i) => play(t + i * step, note));
}

// Power of Chaos helpers
function cardFlip(t, gain = 0.14, freq = 2600) {
  noise({ t, dur: 0.06, gain, freq, to: freq * 0.45, q: 0.9 });
  noise({ t: t + 0.04, dur: 0.05, gain: gain * 0.7, freq: freq * 0.8, to: freq * 0.35, q: 0.9 });
}

function boom(t, strength = 1, out) {
  tone({ t, freq: 95, to: 32, dur: 0.9, gain: 0.4 * strength, attack: 0.003, out });
  noise({ t, dur: 0.6, gain: 0.22 * strength, type: 'lowpass', freq: 600, to: 70, attack: 0.002, out });
}

function brass({ t, notes, dur = 0.5, gain = 0.07 }) {
  notes.forEach(n => {
    tone({ t, freq: midi(n), dur, type: 'sawtooth', gain, attack: 0.03, filter: [500, 2600], q: 2 });
    tone({ t, freq: midi(n), dur, type: 'sawtooth', gain: gain * 0.6, attack: 0.04, filter: [500, 2600], detune: 9 });
  });
}

function coinClink(t, gain = 0.05) {
  bell({ t, freq: rnd(2300, 3800), dur: 0.35, gain });
}

const POC_HARP_UP = [62, 65, 67, 69, 72, 74, 77, 79, 81, 84];

// Logo easter egg: each tap in a row climbs a semitone to build tension.
const logoNote = (base, combo) => base + Math.min(combo - 1, 24);

// ---------------------------------------------------------------------------
// Exodia easter egg (shared by all themes): sinister, cavernous and long.
// ---------------------------------------------------------------------------

let sfxDarkSpace = null;
// The Shadow Realm's bus, so an escape can cut its remaining howl short.
let sfxShadowCave = null;

// A long cavernous reverb plus a dark echo that repeats and fades out over
// ~5s, both mixed into the master output.
function getDarkSpace() {
  if (sfxDarkSpace) return sfxDarkSpace;
  const rate = sfxCtx.sampleRate;
  const length = rate * 5;
  const impulse = sfxCtx.createBuffer(2, length, rate);
  for (let ch = 0; ch < 2; ch++) {
    const data = impulse.getChannelData(ch);
    for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 3);
  }
  const reverb = sfxCtx.createGain();
  const convolver = sfxCtx.createConvolver();
  convolver.buffer = impulse;
  reverb.connect(convolver).connect(sfxOut);

  const echo = sfxCtx.createGain();
  const delay = sfxCtx.createDelay(2);
  delay.delayTime.value = 0.42;
  const feedback = sfxCtx.createGain();
  feedback.gain.value = 0.58;
  const damp = sfxCtx.createBiquadFilter();
  damp.type = 'lowpass';
  damp.frequency.value = 1400;
  echo.connect(delay).connect(damp).connect(feedback).connect(delay);
  damp.connect(sfxOut);
  damp.connect(reverb);

  sfxDarkSpace = { reverb, echo };
  return sfxDarkSpace;
}

// An output that plays dry plus the given amounts of reverb and echo.
function darkBus({ reverb = 0.5, echo = 0 } = {}) {
  const space = getDarkSpace();
  const bus = sfxCtx.createGain();
  bus.connect(sfxOut);
  [[reverb, space.reverb], [echo, space.echo]].forEach(([amount, dest]) => {
    if (!amount) return;
    const send = sfxCtx.createGain();
    send.gain.value = amount;
    bus.connect(send).connect(dest);
  });
  return bus;
}

// A laser beam charging: detuned sawtooths sweeping up through an opening
// resonant filter, with a wobble that speeds up, swelling until it's cut off
// at t + dur.
function laserCharge({ t, dur, from = 70, to = 2600, gain = 0.08, out = sfxOut }) {
  const end = t + dur;
  const amp = sfxCtx.createGain();
  amp.gain.setValueAtTime(0.0001, t);
  amp.gain.exponentialRampToValueAtTime(gain, end);
  amp.gain.linearRampToValueAtTime(0, end + 0.04);

  const wobble = sfxCtx.createGain();
  const lfo = sfxCtx.createOscillator();
  const depth = sfxCtx.createGain();
  depth.gain.value = 0.5;
  lfo.frequency.setValueAtTime(3, t);
  lfo.frequency.exponentialRampToValueAtTime(48, end);
  lfo.connect(depth).connect(wobble.gain);

  const filter = makeFilter(t, 'lowpass', 250, 9000, dur, 5);
  [0, 14, -11].forEach(detune => {
    const osc = sfxCtx.createOscillator();
    osc.type = 'sawtooth';
    osc.detune.value = detune;
    osc.frequency.setValueAtTime(from, t);
    osc.frequency.exponentialRampToValueAtTime(to, end);
    osc.connect(filter);
    osc.start(t);
    osc.stop(end + 0.1);
  });
  filter.connect(wobble).connect(amp).connect(out);
  lfo.start(t);
  lfo.stop(end + 0.1);
}

// Dissonant low notes (tritones and minor seconds) through the dark space.
function darkCluster({ t, notes, dur, gain, attack = 0.3, filter = [300, 1200], out }) {
  notes.forEach((n, i) => {
    tone({ t, freq: midi(n), dur, type: 'sawtooth', gain, attack, filter, detune: -7 + i * 5, out });
    tone({ t, freq: midi(n), dur, type: 'sawtooth', gain: gain * 0.6, attack, filter, detune: 9 - i * 4, out });
  });
}

const heartbeat = (t, gain = 0.3) => {
  tone({ t, freq: 62, to: 36, dur: 0.22, gain, attack: 0.004 });
  tone({ t: t + 0.16, freq: 55, to: 32, dur: 0.2, gain: gain * 0.6, attack: 0.004 });
};

const EXODIA_SOUNDS = {
  // A heartbeat and a low tritone that creeps up a semitone per tap.
  'logo-tap': (t, e) => {
    const n = logoNote(36, e.combo);
    const out = darkBus({ reverb: 0.4 });
    heartbeat(t, 0.22);
    tone({ t, freq: midi(n), dur: 0.6, type: 'sawtooth', gain: 0.045, filter: [900, 180], out });
    tone({ t, freq: midi(n + 6), dur: 0.6, type: 'sawtooth', gain: 0.025, filter: [700, 180], detune: 8, out });
  },
  // A piece of Exodia: a deep gong, a dissonant swell and a whisper.
  'logo-piece': (t, e) => {
    const root = 38 + e.piece * 2;
    const out = darkBus({ reverb: 0.8 });
    bell({ t, freq: midi(root - 12), dur: 2.8, gain: 0.2, out });
    darkCluster({ t: t + 0.05, notes: [root + 12, root + 13, root + 18], dur: 1.8, gain: 0.025, attack: 0.25, filter: [300, 1500], out });
    noise({ t, dur: 1.3, gain: 0.05, freq: 900, to: 300, q: 5, attack: 0.3, out });
  },
  // The pieces scatter: a detuned groan sinking into the dark.
  'logo-scatter': t => {
    const out = darkBus({ reverb: 0.6 });
    tone({ t, freq: 220, to: 35, dur: 1.1, type: 'sawtooth', gain: 0.06, filter: [1500, 150], out });
    tone({ t, freq: 233, to: 37, dur: 1.1, type: 'sawtooth', gain: 0.04, filter: [1500, 150], detune: 12, out });
  },
  // Timeline matches effects.css: darkness 0s, he rises 0.9s, the laser
  // charges from 1.6s (heart pounding faster), the blast hits at 3.8s and its
  // echo rolls on through the whiteout until the world returns (~9s).
  'logo-obliterate': t => {
    const cave = darkBus({ reverb: 0.7 });
    const blastBus = darkBus({ reverb: 0.9, echo: 0.8 });

    darkCluster({ t, notes: [28, 29], dur: 4, gain: 0.06, attack: 1.4, filter: [120, 400], out: cave });
    noise({ t, dur: 1.1, gain: 0.1, type: 'lowpass', freq: 200, to: 1400, attack: 0.9, out: cave });

    const rise = t + 0.9;
    boom(rise, 0.9, cave);
    bell({ t: rise, freq: 41, dur: 4, gain: 0.25, out: cave });
    darkCluster({ t: rise, notes: [40, 46, 47], dur: 3, gain: 0.03, attack: 1, filter: [150, 900], out: cave });

    const charge = t + 1.6;
    const chargeDur = 2.2;
    laserCharge({ t: charge, dur: chargeDur, gain: 0.09, out: darkBus({ reverb: 0.3 }) });
    tone({ t: charge, freq: 500, to: 7000, dur: chargeDur, gain: 0.025, attack: chargeDur - 0.05 });
    noise({ t: charge, dur: chargeDur, gain: 0.12, freq: 300, to: 9000, q: 6, attack: chargeDur - 0.1 });
    [0, 0.6, 1.05, 1.4, 1.65, 1.85, 2.0].forEach(at => heartbeat(charge + at, 0.32));

    const blast = t + 3.8;
    boom(blast, 1.6, blastBus);
    tone({ t: blast, freq: 120, to: 22, slide: 3, dur: 4, gain: 0.45, attack: 0.003 });
    noise({ t: blast, dur: 0.3, gain: 0.3, type: 'highpass', freq: 2500, to: 800, attack: 0.001, out: blastBus });
    noise({ t: blast, dur: 3.5, gain: 0.35, type: 'lowpass', freq: 8000, to: 120, attack: 0.01, out: blastBus });
    tone({ t: blast, freq: 1800, to: 160, slide: 2.5, dur: 2.6, type: 'sawtooth', gain: 0.06, filter: [7000, 400], out: blastBus });
    darkCluster({ t: blast + 1.2, notes: [28, 34, 35], dur: 4, gain: 0.035, attack: 1.2, filter: [400, 150], out: cave });
    bell({ t: t + 6.6, freq: 36.7, dur: 4, gain: 0.22, out: cave });
  }
};

// ---------------------------------------------------------------------------
// "Full Heal!" easter egg (shared by all themes): long, bright and happy.
// ---------------------------------------------------------------------------

// A warm choir-like pad: soft detuned sine/triangle pairs with a slow swell.
function healPad({ t, notes, dur, gain = 0.035, attack = 0.4, out }) {
  notes.forEach((n, i) => {
    tone({ t, freq: midi(n), dur, type: 'triangle', gain, attack, filter: 3200, detune: -5 + i * 2, out });
    tone({ t, freq: midi(n), dur, gain: gain * 0.8, attack: attack * 1.2, detune: 6 - i * 2, out });
  });
}

// Twinkling high bells, scattered at random through the given window.
function healSparkles(t, span, count, out) {
  const notes = [84, 88, 91, 96, 100, 103];
  for (let i = 0; i < count; i++) {
    bell({ t: t + rnd(0, span), freq: midi(notes[Math.floor(rnd(0, notes.length))]), dur: 0.9, gain: 0.022, out });
  }
}

const HEAL_SOUNDS = {
  // Timeline matches effects.css: a harp glissando sweeps up while the
  // shockwave grows (0-0.9s), a radiant major chord bursts as the screen goes
  // green, then a plagal "Amen" cadence (IV -> I) rings out over the fade.
  'heal-overflow': t => {
    const hall = darkBus({ reverb: 0.6, echo: 0.15 });

    arpeggio(t, [60, 64, 67, 72, 76, 79, 84, 88, 91, 96], 0.075, (at, n) => pluck({ t: at, note: n, gain: 0.06 }));
    noise({ t, dur: 0.9, gain: 0.06, freq: 600, to: 9000, q: 1.5, attack: 0.8, out: hall });
    tone({ t, freq: 300, to: 2400, dur: 0.9, gain: 0.025, attack: 0.85, out: hall });

    const burst = t + 0.9;
    tone({ t: burst, freq: 180, to: 60, dur: 0.6, gain: 0.25, attack: 0.004 });
    noise({ t: burst, dur: 1.4, gain: 0.12, type: 'highpass', freq: 5000, to: 2000, attack: 0.01, out: hall });
    bell({ t: burst, freq: midi(72), dur: 3, gain: 0.12, out: hall });
    healPad({ t: burst, notes: [48, 55, 60, 64, 67, 72, 76], dur: 1.9, gain: 0.03, attack: 0.08, out: hall });
    arpeggio(burst + 0.05, [84, 88, 91, 96, 100], 0.06, (at, n) => bell({ t: at, freq: midi(n), dur: 1, gain: 0.03, out: hall }));

    const amen = t + 2.7;
    healPad({ t: amen, notes: [53, 60, 65, 69, 72, 77], dur: 1.4, gain: 0.028, out: hall });
    healPad({ t: amen + 1.3, notes: [48, 55, 60, 64, 67, 72, 79], dur: 3.2, gain: 0.03, attack: 0.5, out: hall });
    bell({ t: amen + 1.3, freq: midi(84), dur: 3, gain: 0.07, out: hall });
    healSparkles(burst + 0.4, 4.2, 18, hall);
  }
};

// ---------------------------------------------------------------------------
// Shadow Realm easter egg (shared by all themes): howling, swirling, ghostly.
// ---------------------------------------------------------------------------

// Howling wind: resonant noise whose pitch wanders up and down.
function shadowWind({ t, dur, gain, freqs, out }) {
  const step = dur / (freqs.length - 1);
  freqs.slice(1).forEach((to, i) => {
    noise({ t: t + i * step, dur: step * 1.4, gain, freq: freqs[i], to, q: 9, attack: step * 0.6, out });
  });
}

// Ghostly whispers: short breathy bursts at random pitches.
function shadowWhispers(t, span, count, out) {
  for (let i = 0; i < count; i++) {
    const at = t + rnd(0, span);
    const freq = rnd(1200, 3200);
    noise({ t: at, dur: rnd(0.25, 0.5), gain: 0.05, freq, to: freq * rnd(0.6, 1.4), q: 14, attack: 0.08, out });
  }
}

const SHADOW_SOUNDS = {
  // Timeline matches effects.css: fog and howling wind creep in (0-1.2s), the
  // vortex sucks the duel in with a falling swirl (1.2-3.2s), it slams shut
  // (3.2s), a ghostly choir hangs over the Millennium Eye, and the wind dies
  // away as the duel drifts back (~7.5s).
  'shadow-realm': t => {
    const cave = darkBus({ reverb: 0.8, echo: 0.3 });
    sfxShadowCave = cave;

    darkCluster({ t, notes: [33, 34, 39], dur: 3.6, gain: 0.04, attack: 1, filter: [150, 700], out: cave });
    shadowWind({ t, dur: 3.4, gain: 0.07, freqs: [300, 700, 450, 1100, 600, 1500], out: cave });
    tone({ t, freq: midi(81), to: midi(75), slide: 1.2, dur: 1.4, type: 'triangle', gain: 0.02, attack: 0.5, out: cave });

    const swirl = t + 1.2;
    tone({ t: swirl, freq: 900, to: 45, dur: 2, type: 'sawtooth', gain: 0.05, attack: 0.3, filter: [3000, 150], out: cave });
    tone({ t: swirl, freq: 940, to: 47, dur: 2, type: 'sawtooth', gain: 0.035, attack: 0.3, filter: [3000, 150], detune: 15, out: cave });
    noise({ t: swirl, dur: 2, gain: 0.12, freq: 4000, to: 120, q: 4, attack: 1.6, out: cave });
    shadowWhispers(swirl, 2, 10, cave);
    [0, 0.5, 0.9, 1.2, 1.45, 1.65, 1.82].forEach(at => heartbeat(swirl + at, 0.26));

    const slam = t + 3.2;
    boom(slam, 1.3, cave);
    tone({ t: slam, freq: 70, to: 25, dur: 2.5, gain: 0.35, attack: 0.003 });
    bell({ t: slam + 0.2, freq: midi(38), dur: 4, gain: 0.22, out: cave });
    darkCluster({ t: slam + 0.3, notes: [57, 60, 63, 64], dur: 2.6, gain: 0.018, attack: 0.8, filter: [600, 2200], out: cave });
    [69, 68, 66, 63].forEach((n, i) => {
      tone({ t: slam + 0.4 + i * 0.5, freq: midi(n), dur: 0.9, type: 'triangle', gain: 0.03, attack: 0.25, out: cave });
    });

    shadowWind({ t: t + 5, dur: 2.5, gain: 0.05, freqs: [900, 500, 300], out: cave });
    shadowWhispers(t + 5, 1.5, 4, cave);
  },
  // Escaping early: silence the rest of the Shadow Realm, shatter the dark
  // like glass, and slam out a rebellious rock power chord (E5).
  'shadow-escape': t => {
    sfxShadowCave?.gain.setTargetAtTime(0, t, 0.04);
    sfxShadowCave = null;
    const room = darkBus({ reverb: 0.4 });

    noise({ t, dur: 0.5, gain: 0.25, type: 'highpass', freq: 3500, to: 1500, attack: 0.002, out: room });
    for (let i = 0; i < 8; i++) bell({ t: t + rnd(0, 0.35), freq: rnd(2500, 5000), dur: 0.4, gain: 0.03, out: room });
    boom(t, 1.2, room);

    const riff = [[0.05, 0.12], [0.2, 0.12], [0.38, 1.6]];
    riff.forEach(([at, dur]) => {
      [40, 47, 52, 59].forEach((n, i) => {
        tone({ t: t + at, freq: midi(n), dur, type: 'sawtooth', gain: 0.06, attack: 0.004, filter: [3500, 1200], q: 3, detune: -8 + i * 4, out: room });
        tone({ t: t + at, freq: midi(n), dur, type: 'square', gain: 0.03, attack: 0.004, filter: 2200, detune: 9, out: room });
      });
      noise({ t: t + at, dur: 0.06, gain: 0.12, type: 'lowpass', freq: 900, attack: 0.002 });
    });
    noise({ t: t + 0.38, dur: 1.8, gain: 0.08, type: 'highpass', freq: 6000, to: 3500, attack: 0.005, out: room });
  }
};

// ---------------------------------------------------------------------------
// "Unstoppable" easter egg (shared by all themes): a near-death heartbeat
// that builds into a defiant power chord.
// ---------------------------------------------------------------------------

// A heavy, booming lub-dub.
function bigHeartbeat(t, gain, out) {
  tone({ t, freq: 70, to: 34, dur: 0.3, gain, attack: 0.004, out });
  noise({ t, dur: 0.12, gain: gain * 0.25, type: 'lowpass', freq: 300, attack: 0.004, out });
  tone({ t: t + 0.2, freq: 60, to: 30, dur: 0.28, gain: gain * 0.7, attack: 0.004, out });
}

const LAST_STAND_SOUNDS = {
  // Timeline matches effects.css: the hit lands with a ringing in the ears,
  // three slow heartbeats pound under a rising drone (0.35-1.75s), and the
  // "UNSTOPPABLE!" banner slams in at 2.2s with a boom and a power chord.
  'last-stand': t => {
    const room = darkBus({ reverb: 0.5 });

    boom(t, 1.1, room);
    tone({ t: t + 0.05, freq: 3600, dur: 2, gain: 0.025, attack: 0.02 });

    [0.35, 1.05, 1.75].forEach(at => bigHeartbeat(t + at, 0.45, room));
    darkCluster({ t: t + 0.3, notes: [38, 39, 45], dur: 1.95, gain: 0.03, attack: 1.6, filter: [200, 2500], out: room });
    tone({ t: t + 0.3, freq: 150, to: 600, dur: 1.9, type: 'sawtooth', gain: 0.03, attack: 1.7, filter: [400, 3000], out: room });
    noise({ t: t + 1.2, dur: 1, gain: 0.08, freq: 400, to: 6000, q: 2, attack: 0.95, out: room });

    const slam = t + 2.2;
    boom(slam, 1.4, room);
    brass({ t: slam, notes: [38, 45, 50, 57, 62], dur: 1.8, gain: 0.05 });
    noise({ t: slam, dur: 1.8, gain: 0.12, type: 'highpass', freq: 5000, to: 3000, attack: 0.005, out: room });
    arpeggio(slam + 0.1, [62, 66, 69, 74], 0.07, (at, n) => tone({ t: at, freq: midi(n), dur: 0.9, type: 'square', gain: 0.025, filter: 3000, out: room }));
  }
};

// ---------------------------------------------------------------------------
// Tiny violin easter egg (shared by all themes): a sad, wobbly violin tune
// cut short by a snapping string.
// ---------------------------------------------------------------------------

// A bowed note: sawtooth through a lowpass with a slow, sobbing vibrato.
function violinNote({ t, note, dur, gain = 0.05, out = sfxOut }) {
  const osc = sfxCtx.createOscillator();
  const amp = sfxCtx.createGain();
  const lfo = sfxCtx.createOscillator();
  const depth = sfxCtx.createGain();
  const freq = midi(note);

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(freq, t);
  lfo.frequency.value = 5.5;
  depth.gain.setValueAtTime(0, t);
  depth.gain.linearRampToValueAtTime(freq * 0.02, t + Math.min(0.25, dur));
  lfo.connect(depth).connect(osc.frequency);
  envelope(amp.gain, t, gain, 0.08, dur);
  osc.connect(makeFilter(t, 'lowpass', 2400, null, dur, 1.5)).connect(amp).connect(out);
  osc.start(t);
  lfo.start(t);
  osc.stop(t + dur + 0.05);
  lfo.stop(t + dur + 0.05);
}

const TINY_VIOLIN_SOUNDS = {
  // Timeline matches effects.css: the violin pops up (0s), plays a drooping
  // minor tune (0.4-3.2s), the string snaps with a *twang* at 3.2s, and the
  // violin flops over with a little thud at 3.5s.
  'tiny-violin': t => {
    const room = darkBus({ reverb: 0.35 });
    tone({ t, freq: 600, to: 1400, dur: 0.15, type: 'triangle', gain: 0.05, attack: 0.005, out: room });

    [[0.4, 0.4, 76], [0.8, 0.4, 74], [1.2, 0.4, 72], [1.6, 0.8, 71], [2.4, 0.85, 69]]
      .forEach(([at, dur, note]) => violinNote({ t: t + at, note, dur, out: room }));

    const snap = t + 3.2;
    tone({ t: snap, freq: 1800, to: 220, dur: 0.45, type: 'triangle', gain: 0.1, attack: 0.002, out: room });
    tone({ t: snap, freq: 2400, to: 300, dur: 0.3, type: 'sawtooth', gain: 0.03, attack: 0.002, filter: 4000, out: room });
    noise({ t: snap, dur: 0.05, gain: 0.08, type: 'highpass', freq: 4000, attack: 0.001, out: room });

    tone({ t: t + 3.5, freq: 160, to: 70, dur: 0.15, gain: 0.12, attack: 0.003, out: room });
    noise({ t: t + 3.5, dur: 0.08, gain: 0.05, type: 'lowpass', freq: 800, attack: 0.002, out: room });
  }
};

// ---------------------------------------------------------------------------
// "Heart of the cards" easter egg (shared by all themes): heavenly build-up,
// a drumroll, and a triumphant "ta-da!" for a deeply unimpressive card.
// ---------------------------------------------------------------------------

const HEART_SOUNDS = {
  // Timeline matches effects.css: a choir swells (0s), a chime per quote word
  // (0.3s + 0.28s each), the card whooshes up (1s), a drumroll builds
  // (1.9-2.6s), and the card flips with a "ta-da!" at 2.6s.
  'heart-of-the-cards': t => {
    const hall = darkBus({ reverb: 0.6 });

    healPad({ t, notes: [55, 62, 67, 71, 74], dur: 2.6, gain: 0.025, attack: 0.8, out: hall });
    [67, 69, 71, 72, 74, 76, 79].forEach((n, i) => bell({ t: t + 0.3 + i * 0.28, freq: midi(n + 12), dur: 0.8, gain: 0.04, out: hall }));

    noise({ t: t + 1, dur: 0.7, gain: 0.07, freq: 400, to: 5000, q: 1.5, attack: 0.5, out: hall });
    tone({ t: t + 1, freq: 200, to: 800, dur: 0.7, type: 'triangle', gain: 0.03, attack: 0.5, out: hall });

    for (let i = 0; i < 22; i++) {
      const at = t + 1.9 + i * 0.032;
      noise({ t: at, dur: 0.04, gain: 0.03 + i * 0.004, type: 'bandpass', freq: 1800, q: 1.2, attack: 0.002 });
    }

    const flip = t + 2.6;
    cardFlip(flip, 0.2);
    noise({ t: flip, dur: 1.6, gain: 0.1, type: 'highpass', freq: 6000, to: 3500, attack: 0.005, out: hall });
    brass({ t: flip + 0.05, notes: [60, 64, 67, 72], dur: 0.18, gain: 0.05 });
    brass({ t: flip + 0.3, notes: [65, 69, 72, 77], dur: 1.1, gain: 0.05 });
    healSparkles(flip + 0.2, 1.4, 8, hall);
  },
  // The fifth draw in a duel: the usual fanfare, then a tiny Exodia blast
  // (charge 3.3s, "pew" at 3.8s) — a toy-sized echo of 'logo-obliterate'.
  'heart-overload': t => {
    HEART_SOUNDS['heart-of-the-cards'](t);

    const charge = t + 3.3;
    const room = darkBus({ reverb: 0.4, echo: 0.3 });
    laserCharge({ t: charge, dur: 0.5, from: 300, to: 4000, gain: 0.04, out: room });
    [0, 0.22, 0.38].forEach(at => heartbeat(charge + at, 0.12));

    const blast = t + 3.8;
    boom(blast, 0.3, room);
    tone({ t: blast, freq: 2200, to: 260, dur: 0.22, type: 'square', gain: 0.05, filter: 3500, attack: 0.002, out: room });
    noise({ t: blast, dur: 0.25, gain: 0.08, type: 'highpass', freq: 3000, to: 1200, attack: 0.002, out: room });
    tone({ t: blast + 0.45, freq: 520, to: 260, dur: 0.5, type: 'triangle', gain: 0.04, attack: 0.01 });
  }
};

// ---------------------------------------------------------------------------
// "Screw the rules" easter egg (shared by all themes): a denied buzzer, then
// Kaiba's stamp, a cash register, raining coins and a hefty kick.
// ---------------------------------------------------------------------------

const SCREW_SOUNDS = {
  // Tapping a used-up card: a short "nope" buzzer that climbs with each tap.
  'used-deny': (t, e) => {
    const f = 110 * Math.pow(2, (e.combo - 1) / 6);
    tone({ t, freq: f, dur: 0.16, type: 'square', gain: 0.05, filter: 1400 });
    tone({ t, freq: f * 1.06, dur: 0.16, type: 'square', gain: 0.035, filter: 1400 });
  },
  // Timeline matches effects.css: the stamp slams down (0s) with a cash
  // register "ka-ching", coins clink down (0.1-2.4s), the USED stamp is
  // kicked off (0.9s) and whistles away, and a smug brass fanfare plays.
  'screw-the-rules': t => {
    const room = darkBus({ reverb: 0.35 });

    boom(t, 1.1, room);
    noise({ t, dur: 0.15, gain: 0.2, type: 'lowpass', freq: 1800, attack: 0.002 });
    bell({ t: t + 0.12, freq: 2637, dur: 0.6, gain: 0.08 });
    bell({ t: t + 0.22, freq: 3520, dur: 0.9, gain: 0.08 });
    noise({ t: t + 0.1, dur: 0.12, gain: 0.08, type: 'highpass', freq: 4000, attack: 0.002 });

    for (let i = 0; i < 22; i++) coinClink(t + 0.1 + rnd(0, 2.3), 0.045);

    const kick = t + 0.9;
    tone({ t: kick, freq: 160, to: 60, dur: 0.18, gain: 0.3, attack: 0.002 });
    noise({ t: kick, dur: 0.1, gain: 0.2, type: 'lowpass', freq: 2500, to: 400, attack: 0.001 });
    tone({ t: kick + 0.05, freq: 1800, to: 500, dur: 0.9, gain: 0.04, attack: 0.02, out: room });

    brass({ t: t + 1.3, notes: [62, 66, 69], dur: 0.16, gain: 0.05 });
    brass({ t: t + 1.5, notes: [62, 66, 69], dur: 0.16, gain: 0.05 });
    brass({ t: t + 1.7, notes: [67, 71, 74, 79], dur: 1, gain: 0.055 });
  }
};

// ---------------------------------------------------------------------------
// "Mind Crush" easter egg (shared by all themes): Pegasus sees all.
// ---------------------------------------------------------------------------

const MIND_CRUSH_SOUNDS = {
  // Timeline matches effects.css: a swelling shimmer as the eye opens (0s),
  // an eerie low hum and whispers while he speaks (0.4-2.2s), then a cheeky
  // "ting!" as he winks (2.35s).
  'mind-crush': t => {
    const cave = darkBus({ reverb: 0.7 });

    noise({ t, dur: 0.6, gain: 0.06, freq: 1200, to: 6000, q: 6, attack: 0.5, out: cave });
    tone({ t, freq: midi(83), to: midi(95), slide: 0.5, dur: 0.6, gain: 0.03, attack: 0.45, out: cave });
    darkCluster({ t: t + 0.3, notes: [45, 46, 51], dur: 2.2, gain: 0.025, attack: 0.6, filter: [300, 900], out: cave });
    bell({ t: t + 0.4, freq: midi(57), dur: 2.4, gain: 0.12, out: cave });
    shadowWhispers(t + 0.5, 1.6, 5, cave);

    const wink = t + 2.35;
    bell({ t: wink, freq: midi(100), dur: 0.7, gain: 0.08, out: cave });
    bell({ t: wink + 0.07, freq: midi(107), dur: 0.6, gain: 0.05, out: cave });
  }
};

// ---------------------------------------------------------------------------
// Theme roulette easter egg (shared by all themes): cartoon dizziness.
// ---------------------------------------------------------------------------

// A slide whistle with a seasick wobble, gliding through the given pitches.
function slideWhistle({ t, freqs, dur, gain = 0.06, wobble = 7, out = sfxOut }) {
  const osc = sfxCtx.createOscillator();
  const amp = sfxCtx.createGain();
  const lfo = sfxCtx.createOscillator();
  const depth = sfxCtx.createGain();
  const step = dur / (freqs.length - 1);

  osc.frequency.setValueAtTime(freqs[0], t);
  freqs.slice(1).forEach((f, i) => osc.frequency.exponentialRampToValueAtTime(f, t + (i + 1) * step));
  lfo.frequency.value = wobble;
  depth.gain.value = freqs[0] * 0.04;
  lfo.connect(depth).connect(osc.frequency);
  envelope(amp.gain, t, gain, 0.05, dur);
  osc.connect(amp).connect(out);
  osc.start(t);
  lfo.start(t);
  osc.stop(t + dur + 0.05);
  lfo.stop(t + dur + 0.05);
}

// "Tweet-tweet": two quick rising chirps.
function tweet(t, gain = 0.03, out) {
  tone({ t, freq: 2600, to: 3600, dur: 0.06, gain, attack: 0.004, out });
  tone({ t: t + 0.09, freq: 2700, to: 3800, dur: 0.06, gain, attack: 0.004, out });
}

const DIZZY_SOUNDS = {
  // Timeline matches effects.css: a seasick slide whistle swoops around while
  // the screen wobbles (0-1.6s), a "boing" as the toast pops up (0.25s), and
  // little birds tweet as the stars circle the logo (0.5-2.9s).
  dizzy: t => {
    const room = darkBus({ reverb: 0.3 });
    slideWhistle({ t, freqs: [500, 1300, 420, 1100, 360, 900, 300], dur: 1.6, gain: 0.05, out: room });
    tone({ t: t + 0.25, freq: 180, to: 420, dur: 0.35, type: 'triangle', gain: 0.08, attack: 0.005, out: room });
    [0.5, 0.95, 1.4, 1.85, 2.3, 2.75].forEach((at, i) => tweet(t + at, 0.03 - i * 0.003, room));
  }
};

// ---------------------------------------------------------------------------
// Pharaoh's Nap easter egg (shared by all themes): a soft, looping snore.
// ---------------------------------------------------------------------------

const NAP_SOUNDS = {
  // One breath, repeated every NAP_SNORE_EVERY_MS: a rattly inhale (0-1.3s)
  // and a whistly "pshhh" exhale (1.6-2.7s), synced with the snot bubble.
  'nap-snore': t => {
    const room = darkBus({ reverb: 0.25 });
    noise({ t, dur: 1.3, gain: 0.05, freq: 350, to: 700, q: 2, attack: 1, out: room });
    tone({ t, freq: 52, to: 62, dur: 1.3, type: 'sawtooth', gain: 0.03, filter: 320, attack: 1, out: room });
    tone({ t, freq: 104, to: 124, dur: 1.3, type: 'square', gain: 0.008, filter: 400, attack: 1, out: room });

    const exhale = t + 1.6;
    noise({ t: exhale, dur: 1.1, gain: 0.025, freq: 2200, to: 1100, q: 1.5, attack: 0.2, out: room });
    tone({ t: exhale, freq: 950, to: 720, dur: 1, gain: 0.01, attack: 0.3, out: room });
  },
  // Startled awake: the bubble pops, a quick "huh?!", and a "!" sting as he
  // looks shocked, then a nervous little shiver (timed with effects.css).
  'nap-wake': t => {
    bubble({ t, from: 500, to: 1400, gain: 0.08, dur: 0.07 });
    tone({ t: t + 0.04, freq: 260, to: 700, dur: 0.14, type: 'triangle', gain: 0.07, attack: 0.005 });
    tone({ t: t + 0.18, freq: 420, to: 1100, dur: 0.16, type: 'triangle', gain: 0.07, attack: 0.005 });
    bell({ t: t + 0.1, freq: 1760, dur: 0.5, gain: 0.05 });
    bell({ t: t + 0.1, freq: 2637, dur: 0.4, gain: 0.03 });
    tone({ t: t + 0.55, freq: 330, dur: 0.45, type: 'triangle', gain: 0.025, attack: 0.02, detune: 30 });
  }
};

// ---------------------------------------------------------------------------
// Millennium Puzzle easter egg (shared by all themes): ancient and golden.
// ---------------------------------------------------------------------------

// A deep, slightly beating drone with a fifth and an octave on top.
function puzzleHum(t, dur, gain, out) {
  [[45, 0], [45, 7], [52, -5], [57, 4]].forEach(([n, detune], i) => {
    tone({ t, freq: midi(n), dur, type: i ? 'sine' : 'triangle', gain: i ? gain * 0.6 : gain, attack: 0.35, filter: 900, detune, out });
  });
}

const PUZZLE_SOUNDS = {
  // Each correct lock: a golden chime that climbs (A, C#, E).
  'puzzle-tap': (t, e) => {
    const n = [69, 73, 76][e.step - 1] ?? 69;
    const out = darkBus({ reverb: 0.5 });
    bell({ t, freq: midi(n + 12), dur: 1.2, gain: 0.07, out });
    bell({ t, freq: midi(n), dur: 1, gain: 0.04, out });
  },
  // Timeline matches effects.css: the locks whoosh in (0-0.9s) with a click
  // each, the puzzle slams together at 0.9s with a gong, then hums in pulses
  // (every 1.2s) under a mystic shimmer while it glows.
  'puzzle-assemble': t => {
    const hall = darkBus({ reverb: 0.8, echo: 0.2 });
    noise({ t, dur: 0.9, gain: 0.08, freq: 300, to: 4000, q: 2, attack: 0.8, out: hall });
    [0.6, 0.72, 0.84].forEach(at => noise({ t: t + at, dur: 0.05, gain: 0.12, type: 'bandpass', freq: 2500, q: 3, attack: 0.002 }));

    const lock = t + 0.9;
    boom(lock, 0.7, hall);
    bell({ t: lock, freq: midi(45), dur: 3.5, gain: 0.2, out: hall });
    bell({ t: lock, freq: midi(69), dur: 2.5, gain: 0.08, out: hall });
    [0, 1.2, 2.4].forEach((at, i) => puzzleHum(lock + at, 1.6, 0.06 - i * 0.012, hall));
    healPad({ t: lock + 0.2, notes: [57, 64, 69, 76], dur: 3.4, gain: 0.018, attack: 0.9, out: hall });
    healSparkles(lock + 0.3, 3, 8, hall);
  }
};

// ---------------------------------------------------------------------------
// Speaker easter egg (shared by all themes): strain, BANG, sad trombone,
// and a heavenly Monster Reborn.
// ---------------------------------------------------------------------------

const SPEAKER_SOUNDS = {
  // Each straining tap (only heard on the "on" taps): a rattly buzz that gets
  // higher and nastier as the speaker gives up.
  'speaker-creak': (t, e) => {
    const f = 90 * Math.pow(2, e.strain / 5);
    tone({ t, freq: f, to: f * 1.4, dur: 0.12, type: 'sawtooth', gain: 0.02 + e.strain * 0.005, filter: 1200 + e.strain * 300, attack: 0.004 });
    noise({ t, dur: 0.08, gain: 0.02 + e.strain * 0.006, type: 'bandpass', freq: 2500, q: 4, attack: 0.002 });
  },
  // Timeline matches effects.css: the speaker blows (0s) with a crackle and
  // fizzle, a sad trombone "wah wah wah wahhh" (0.5-2.4s), the Monster Reborn
  // ankh floats down with a choir (2.2s), and the speaker revives (3.4s).
  'speaker-rip': t => {
    const room = darkBus({ reverb: 0.4 });
    boom(t, 0.6, room);
    noise({ t, dur: 0.12, gain: 0.25, type: 'highpass', freq: 1500, attack: 0.001 });
    for (let i = 0; i < 10; i++) noise({ t: t + 0.05 + rnd(0, 0.5), dur: 0.03, gain: 0.06, type: 'bandpass', freq: rnd(2000, 6000), q: 3, attack: 0.001 });
    noise({ t: t + 0.1, dur: 0.9, gain: 0.04, type: 'highpass', freq: 5000, to: 2000, attack: 0.05 });

    const trombone = (at, from, to, dur) => {
      tone({ t: t + at, freq: from, to, dur, type: 'sawtooth', gain: 0.06, attack: 0.03, filter: [1400, 600], out: room });
      tone({ t: t + at, freq: from, to, dur, type: 'square', gain: 0.025, attack: 0.03, filter: 900, detune: 8, out: room });
    };
    trombone(0.5, midi(55), midi(55), 0.32);
    trombone(0.85, midi(54), midi(54), 0.32);
    trombone(1.2, midi(53), midi(53), 0.32);
    trombone(1.55, midi(52), midi(49), 0.9);

    const hall = darkBus({ reverb: 0.7 });
    healPad({ t: t + 2.2, notes: [64, 68, 71, 76], dur: 1.6, gain: 0.02, attack: 0.8, out: hall });
    const reborn = t + 3.4;
    bell({ t: reborn, freq: midi(88), dur: 1.4, gain: 0.08, out: hall });
    arpeggio(reborn, [64, 68, 71, 76, 80], 0.06, (at, n) => bell({ t: at, freq: midi(n + 12), dur: 0.9, gain: 0.05, out: hall }));
    healSparkles(reborn + 0.1, 1.2, 6, hall);
  }
};

// ---------------------------------------------------------------------------
// Pot of Greed easter egg (shared by all themes): greedy and deadpan.
// ---------------------------------------------------------------------------

// A dull, deadpan "bonk-bonk" (two low notes going down).
function deadpanBonk(t, out) {
  tone({ t, freq: midi(50), dur: 0.18, type: 'triangle', gain: 0.09, attack: 0.004, filter: 900, out });
  tone({ t: t + 0.2, freq: midi(43), dur: 0.35, type: 'triangle', gain: 0.09, attack: 0.004, filter: 700, out });
}

// A ceramic clink: a short, bright, slightly detuned pair of bells.
function ceramicClink(t, gain = 0.06, out) {
  bell({ t, freq: 2100, dur: 0.25, gain, out });
  bell({ t, freq: 2930, dur: 0.18, gain: gain * 0.6, out });
  noise({ t, dur: 0.03, gain: gain * 1.5, type: 'highpass', freq: 4000, attack: 0.001, out });
}

const POT_SOUNDS = {
  // Timeline matches effects.css: the pot pops up (0s) with a clink, a greedy
  // "heh-heh" chime (0.35s), line one (0.5s) + bonk (1.9s), line two (2.4s)
  // + bonk (3.4s), then it sinks back with a ceramic clunk (3.9s).
  'pot-of-greed': t => {
    const room = darkBus({ reverb: 0.3 });
    tone({ t, freq: 220, to: 660, dur: 0.18, type: 'triangle', gain: 0.07, attack: 0.004, out: room });
    ceramicClink(t + 0.15, 0.06, room);

    [0, 0.13].forEach(at => {
      tone({ t: t + 0.35 + at, freq: midi(79), to: midi(76), dur: 0.1, type: 'square', gain: 0.025, filter: 3000, attack: 0.004, out: room });
      bell({ t: t + 0.35 + at, freq: midi(91), dur: 0.3, gain: 0.03, out: room });
    });

    deadpanBonk(t + 1.9, room);
    deadpanBonk(t + 3.4, room);

    const sink = t + 3.9;
    tone({ t: sink, freq: 600, to: 150, dur: 0.35, type: 'triangle', gain: 0.06, attack: 0.004, out: room });
    noise({ t: sink + 0.3, dur: 0.12, gain: 0.15, type: 'lowpass', freq: 900, attack: 0.002, out: room });
    ceramicClink(sink + 0.3, 0.04, room);
  }
};

// ---------------------------------------------------------------------------
// Trap Hole easter egg (shared by all themes): cartoon slapstick.
// ---------------------------------------------------------------------------

// A springy "boing": a rising tone with a fast wobble.
function boing(t, { from = 150, to = 520, dur = 0.45, gain = 0.08, out } = {}) {
  slideWhistle({ t, freqs: [from, to, to * 0.85], dur, gain, wobble: 18, out });
  tone({ t, freq: from * 0.5, to: to * 0.5, dur: dur * 0.6, type: 'triangle', gain: gain * 0.6, attack: 0.004, out });
}

const TRAP_SOUNDS = {
  // Timeline matches effects.css: the ground cracks open (0s), the button
  // teeters (0.35s) and falls with a slide whistle (0.5-1.3s), a distant
  // thud (1.5s), the sign springs up (1.0s) and ducks away (2.6s), the button
  // is catapulted out (3.0s) and bounces back into place (3.55s, 3.75s).
  'trap-hole': t => {
    const room = darkBus({ reverb: 0.35 });
    noise({ t, dur: 0.25, gain: 0.18, type: 'lowpass', freq: 2500, to: 300, attack: 0.002, out: room });
    for (let i = 0; i < 6; i++) noise({ t: t + rnd(0, 0.25), dur: 0.03, gain: 0.08, type: 'bandpass', freq: rnd(800, 2500), q: 3, attack: 0.001 });
    tone({ t: t + 0.35, freq: 300, to: 340, dur: 0.15, type: 'sawtooth', gain: 0.02, filter: 1200, attack: 0.01 });

    slideWhistle({ t: t + 0.5, freqs: [1500, 900, 260], dur: 0.8, gain: 0.06, wobble: 6, out: room });
    const pit = darkBus({ reverb: 0.8, echo: 0.4 });
    boom(t + 1.5, 0.35, pit);
    noise({ t: t + 1.5, dur: 0.2, gain: 0.1, type: 'lowpass', freq: 500, attack: 0.003, out: pit });

    boing(t + 1.0, { from: 200, to: 600, dur: 0.4, gain: 0.06, out: room });
    slideWhistle({ t: t + 2.6, freqs: [700, 300], dur: 0.3, gain: 0.04, out: room });

    boing(t + 3.0, { from: 110, to: 700, dur: 0.55, gain: 0.09, out: room });
    noise({ t: t + 3.0, dur: 0.35, gain: 0.07, freq: 400, to: 4000, q: 2, attack: 0.05, out: room });
    tone({ t: t + 3.55, freq: 160, to: 90, dur: 0.12, type: 'triangle', gain: 0.1, attack: 0.003, out: room });
    tone({ t: t + 3.75, freq: 180, to: 110, dur: 0.08, type: 'triangle', gain: 0.06, attack: 0.003, out: room });
  }
};

// --- Gaia the Fierce Knight: "Gallop in, gallop out" ------------------------

// One gallop stride: three quick hoof clops ("ta-da-dum"), each a dull thud
// plus a coconut-shell knock.
function gallopStride(t, gain, out) {
  [0, 0.075, 0.15].forEach((o, i) => {
    const g = gain * (i === 2 ? 1 : 0.75);
    tone({ t: t + o, freq: 140, to: 60, dur: 0.07, type: 'triangle', gain: g, attack: 0.002, out });
    noise({ t: t + o, dur: 0.04, gain: g * 0.8, type: 'bandpass', freq: rnd(900, 1300), q: 5, attack: 0.001, out });
  });
}

// A synthesised horse whinny: a buzzy glide up then a shaky slide down.
function neigh(t, { gain = 0.05, out = sfxOut } = {}) {
  const osc = sfxCtx.createOscillator();
  const lfo = sfxCtx.createOscillator();
  const depth = sfxCtx.createGain();
  const lp = sfxCtx.createBiquadFilter();
  const amp = sfxCtx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(480, t);
  osc.frequency.exponentialRampToValueAtTime(950, t + 0.18);
  osc.frequency.exponentialRampToValueAtTime(820, t + 0.45);
  osc.frequency.exponentialRampToValueAtTime(420, t + 0.9);
  lfo.frequency.setValueAtTime(14, t);
  lfo.frequency.linearRampToValueAtTime(26, t + 0.9);
  depth.gain.value = 45;
  lp.type = 'lowpass';
  lp.frequency.value = 2200;
  lp.Q.value = 3;
  lfo.connect(depth).connect(osc.frequency);
  envelope(amp.gain, t, gain, 0.04, 0.95);
  osc.connect(lp).connect(amp).connect(out);
  osc.start(t);
  lfo.start(t);
  osc.stop(t + 1.05);
  lfo.stop(t + 1.05);
}

const GAIA_SOUNDS = {
  // gaia-easter-egg.js passes the moments (seconds) the lance skewers the
  // button (`hit`) and the button is dropped back (`drop`); the passes run
  // 0.4-1.5s and 2.1-3.2s.
  'gaia-gallop': (t, { hit = 0.9, drop = 2.7 } = {}) => {
    const field = darkBus({ reverb: 0.25 });
    for (let s = 0; s < 1.6; s += 0.3) {
      gallopStride(t + s, 0.03 + 0.11 * Math.max(0, 1 - Math.abs(s - hit) / 0.8), field);
    }
    noise({ t: t + hit - 0.15, dur: 0.4, gain: 0.08, freq: 600, to: 3000, q: 1.5, attack: 0.08, out: field });
    noise({ t: t + hit, dur: 0.06, gain: 0.1, type: 'highpass', freq: 2500, attack: 0.001, out: field });
    tone({ t: t + hit, freq: 900, to: 1400, dur: 0.08, type: 'square', gain: 0.025, filter: 2500, attack: 0.002, out: field });
    slideWhistle({ t: t + 1.6, freqs: [950, 1500, 1100], dur: 0.45, gain: 0.035, wobble: 14, out: field });

    for (let s = 2.0; s < 3.3; s += 0.3) {
      gallopStride(t + s, 0.03 + 0.11 * Math.max(0, 1 - Math.abs(s - drop) / 0.8), field);
    }
    noise({ t: t + drop - 0.15, dur: 0.4, gain: 0.07, freq: 3000, to: 600, q: 1.5, attack: 0.08, out: field });
    boing(t + drop + 0.12, { from: 140, to: 520, dur: 0.4, gain: 0.08, out: field });
    brass({ t: t + drop + 0.4, notes: [60, 64, 67], dur: 0.14, gain: 0.05 });
    brass({ t: t + drop + 0.58, notes: [65, 69, 72], dur: 0.6, gain: 0.05 });
    neigh(t + 3.35, { gain: 0.045, out: field });
  }
};

// --- Dark Paladin: "Polymerization... negated" -------------------------------

const PALADIN_SOUNDS = {
  // Timeline (s): heroes fly in 0-0.7, vortex 0.3-1.65, fusion flash 1.65,
  // Polymerization floats in 2.3, the slash 3.0. See dark-paladin-easter-egg.js.
  'paladin-fusion': t => {
    const hall = darkBus({ reverb: 0.55, echo: 0.15 });
    noise({ t, dur: 0.7, gain: 0.07, freq: 300, to: 2500, q: 1.5, attack: 0.3, out: hall });
    noise({ t: t + 0.05, dur: 0.7, gain: 0.06, freq: 2600, to: 400, q: 1.5, attack: 0.3, out: hall });

    tone({ t: t + 0.3, freq: 110, to: 880, dur: 1.35, type: 'sawtooth', gain: 0.04, filter: [300, 3000], q: 6, attack: 0.4, out: hall });
    tone({ t: t + 0.3, freq: 165, to: 1320, dur: 1.35, type: 'sawtooth', gain: 0.03, filter: [300, 3000], q: 6, attack: 0.4, detune: 10, out: hall });
    noise({ t: t + 0.3, dur: 1.35, gain: 0.05, freq: 500, to: 6000, q: 4, attack: 0.5, out: hall });

    boom(t + 1.65, 0.7, hall);
    noise({ t: t + 1.65, dur: 0.9, gain: 0.08, type: 'highpass', freq: 3000, to: 8000, attack: 0.003, out: hall });
    arpeggio(t + 1.7, [86, 90, 93, 98], 0.05, (tt, n) => bell({ t: tt, freq: midi(n), dur: 1.2, gain: 0.03, out: hall }));
    brass({ t: t + 1.8, notes: [50, 57, 62, 65], dur: 1.1, gain: 0.045 });
    tone({ t: t + 1.8, freq: midi(38), dur: 1.4, type: 'sawtooth', gain: 0.05, filter: [200, 900], attack: 0.1, out: hall });

    arpeggio(t + 2.3, [76, 81, 85], 0.05, (tt, n) => bell({ t: tt, freq: midi(n), dur: 0.6, gain: 0.025, out: hall }));

    noise({ t: t + 2.75, dur: 0.2, gain: 0.04, freq: 800, to: 300, q: 2, attack: 0.1, out: hall });
    noise({ t: t + 2.98, dur: 0.18, gain: 0.14, type: 'highpass', freq: 2500, to: 9000, attack: 0.004, out: hall });
    tone({ t: t + 3.0, freq: 3400, to: 2800, dur: 0.9, gain: 0.03, attack: 0.002, out: hall });
    tone({ t: t + 3.0, freq: 5100, to: 4400, dur: 0.6, gain: 0.015, attack: 0.002, out: hall });
    noise({ t: t + 3.03, dur: 0.12, gain: 0.08, freq: 1800, q: 3, attack: 0.002, out: hall });

    brass({ t: t + 3.25, notes: [55, 58], dur: 0.18, gain: 0.04 });
    brass({ t: t + 3.45, notes: [50, 53], dur: 0.5, gain: 0.04 });
  }
};

// --- Divine Offering: three gods, one doorway --------------------------------

// Cartoon "argument" gibberish: quick formant-ish blips around a pitch.
function godBabble(t, base, count, out) {
  for (let i = 0; i < count; i++) {
    const f = base * rnd(0.85, 1.35);
    tone({ t: t + i * 0.075, freq: f, to: f * rnd(0.8, 1.2), dur: 0.06, type: 'square', gain: 0.022, filter: base * 4, q: 3, attack: 0.004, out });
  }
}

// Rubbery squeak of something huge stuck in a too-small door.
function rubberSqueak(t, freq, gain = 0.035, out = sfxOut) {
  tone({ t, freq, to: freq * 1.5, dur: 0.12, gain, attack: 0.01, out });
  tone({ t: t + 0.06, freq: freq * 1.4, to: freq * 0.9, dur: 0.1, type: 'triangle', gain: gain * 0.7, attack: 0.01, out });
}

const DIVINE_SOUNDS = {
  // Timeline (s): Obelisk 0.33, Slifer 0.9, Ra 1.43, argument 2-3.1, dive
  // 3.1, stuck 3.5-4.2, pop 4.2, sad trombone 4.45. See divine-offering-easter-egg.js.
  'divine-offering': t => {
    const temple = darkBus({ reverb: 0.6, echo: 0.1 });
    noise({ t, dur: 2.0, gain: 0.08, type: 'lowpass', freq: 120, to: 220, attack: 0.4, out: temple });
    tone({ t, freq: 38, to: 46, dur: 2.0, gain: 0.12, attack: 0.4, out: temple });

    boom(t + 0.33, 0.6, temple);
    monsterRoar(t + 0.38, 0.07, temple);
    brass({ t: t + 0.4, notes: [38, 45], dur: 0.6, gain: 0.04 });

    boom(t + 0.9, 0.4, temple);
    tone({ t: t + 0.92, freq: 500, to: 1100, dur: 0.25, type: 'sawtooth', gain: 0.035, filter: [1500, 3500], q: 4, attack: 0.02, out: temple });
    tone({ t: t + 1.15, freq: 1100, to: 380, dur: 0.45, type: 'sawtooth', gain: 0.035, filter: [3500, 1200], q: 4, attack: 0.01, out: temple });
    noise({ t: t + 0.92, dur: 0.6, gain: 0.04, freq: 1800, to: 700, q: 2, attack: 0.05, out: temple });

    boom(t + 1.43, 0.4, temple);
    noise({ t: t + 1.43, dur: 0.8, gain: 0.07, type: 'bandpass', freq: 600, to: 2400, q: 0.7, attack: 0.15, out: temple });
    tone({ t: t + 1.5, freq: 1700, to: 2600, dur: 0.18, gain: 0.03, attack: 0.01, out: temple });
    tone({ t: t + 1.68, freq: 2600, to: 1500, dur: 0.4, gain: 0.03, attack: 0.01, out: temple });
    arpeggio(t + 1.5, [79, 83, 86, 91], 0.05, (tt, n) => bell({ t: tt, freq: midi(n), dur: 0.8, gain: 0.02, out: temple }));

    godBabble(t + 2.0, 140, 7, temple);
    godBabble(t + 2.3, 420, 7, temple);
    godBabble(t + 2.6, 260, 7, temple);
    godBabble(t + 2.85, 150, 3, temple);
    godBabble(t + 2.9, 450, 3, temple);

    noise({ t: t + 3.08, dur: 0.4, gain: 0.09, freq: 400, to: 3500, q: 1.5, attack: 0.25, out: temple });
    boom(t + 3.48, 0.35, temple);
    noise({ t: t + 3.48, dur: 0.15, gain: 0.08, type: 'lowpass', freq: 900, attack: 0.002 });
    [3.55, 3.7, 3.82, 3.95, 4.05, 4.12].forEach((o, i) => rubberSqueak(t + o, 500 + (i % 3) * 180));

    boing(t + 4.18, { from: 120, to: 480, dur: 0.35, gain: 0.07, out: temple });
    boing(t + 4.24, { from: 180, to: 700, dur: 0.3, gain: 0.05, out: temple });
    boing(t + 4.3, { from: 240, to: 900, dur: 0.3, gain: 0.04, out: temple });

    const trombone = (at, from, to, dur) => {
      tone({ t: t + at, freq: from, to, dur, type: 'sawtooth', gain: 0.05, attack: 0.03, filter: [1400, 600] });
      tone({ t: t + at, freq: from, to, dur, type: 'square', gain: 0.02, attack: 0.03, filter: 900, detune: 8 });
    };
    trombone(4.45, midi(55), midi(55), 0.25);
    trombone(4.73, midi(54), midi(54), 0.25);
    trombone(5.01, midi(53), midi(50), 0.6);
  }
};

// --- Character eggs (src/effects/character-eggs*.js) --------------------------
// One 'cegg-<id>' sound per character, timed to the 5s scenes in effects.css
// ("CHARACTER EGGS"); the punchline toast lands at 3.3s.

function ceSadTrombone(t, gain = 0.045) {
  [[0, 55, 55, 0.25], [0.28, 54, 54, 0.25], [0.56, 53, 50, 0.6]].forEach(([at, from, to, dur]) => {
    tone({ t: t + at, freq: midi(from), to: midi(to), dur, type: 'sawtooth', gain, attack: 0.03, filter: [1400, 600] });
    tone({ t: t + at, freq: midi(from), to: midi(to), dur, type: 'square', gain: gain * 0.4, attack: 0.03, filter: 900, detune: 8 });
  });
}

// "Hee-hee-hee": quick falling blips around a pitch.
function ceGiggle(t, base, count = 4, out = sfxOut, type = 'triangle') {
  for (let i = 0; i < count; i++) {
    const f = base * (1 - i * 0.05) * rnd(0.97, 1.03);
    tone({ t: t + i * 0.11, freq: f * 1.15, to: f, dur: 0.08, type, gain: 0.03, filter: base * 5, attack: 0.005, out });
  }
}

function ceSplat(t, gain = 0.1, out = sfxOut) {
  noise({ t, dur: 0.25, gain, type: 'lowpass', freq: 1500, to: 200, attack: 0.002, out });
  tone({ t, freq: 220, to: 60, dur: 0.22, type: 'triangle', gain: gain * 0.6, attack: 0.002, out });
}

function ceWhoosh(t, dur = 0.4, gain = 0.06, from = 400, to = 2500, out = sfxOut) {
  noise({ t, dur, gain, freq: from, to, q: 1.2, attack: dur * 0.5, out });
}

function ceClang(t, gain = 0.05, out) {
  bell({ t, freq: rnd(330, 420), dur: 0.9, gain, out });
  noise({ t, dur: 0.08, gain: gain * 1.4, type: 'highpass', freq: 2500, attack: 0.002, out });
}

const CHAR_EGG_SOUNDS = {
  // Pop up 0.3s, shrug 0.7s, six pulls from 1.5s (each "nope" ~0.58s in).
  'cegg-neutral': t => {
    boing(t + 0.1, { from: 180, to: 520, dur: 0.3, gain: 0.06 });
    marimba({ t: t + 0.7, note: 67, gain: 0.08 });
    marimba({ t: t + 0.85, note: 64, gain: 0.08 });
    marimba({ t: t + 1.0, note: 67, gain: 0.08 });
    for (let i = 0; i < 6; i++) {
      const at = t + 1.5 + i * 0.38;
      ceWhoosh(at, 0.25, 0.04, 800, 2600);
      tone({ t: at + 0.6, freq: 150, dur: 0.18, type: 'square', gain: 0.03, filter: 900, attack: 0.005 });
      tone({ t: at + 0.6, freq: 157, dur: 0.18, type: 'square', gain: 0.02, filter: 900, attack: 0.005 });
    }
    marimba({ t: t + 4.1, note: 60, gain: 0.08 });
    marimba({ t: t + 4.25, note: 55, gain: 0.08 });
  },

  // Frankenstein Duelist (Custom): lab hum 0-2.4s, a part stitched on at
  // 0.5/0.85/1.2/1.55/1.9/2.2s (+0.4s landing), coils charge 2.3s, LIGHTNING
  // 2.5s, "IT'S ALIVE!" 2.9s, everyone's catchphrase at once 3.0-3.6s, "huh?" 4.2s.
  'cegg-custom': t => {
    const lab = darkBus({ reverb: 0.5, echo: 0.15 });
    tone({ t, freq: 60, dur: 2.5, type: 'sawtooth', gain: 0.025, filter: 400, attack: 0.3, out: lab });
    tone({ t, freq: 120, dur: 2.5, type: 'square', gain: 0.01, filter: 500, attack: 0.3, detune: 6, out: lab });
    tone({ t: t + 0.2, freq: 300, to: 600, dur: 0.15, type: 'triangle', gain: 0.05, attack: 0.005 });
    [0.5, 0.85, 1.2, 1.55, 1.9, 2.2].forEach(at => {
      ceWhoosh(t + at, 0.35, 0.04, 500, 2400);
      for (let i = 0; i < 5; i++) {
        tone({ t: t + at + 0.4 + i * 0.035, freq: rnd(1800, 2600), dur: 0.015, type: 'square', gain: 0.02, filter: 4000, attack: 0.001 });
      }
      tone({ t: t + at + 0.4, freq: 180, to: 90, dur: 0.08, type: 'triangle', gain: 0.05, attack: 0.002 });
    });
    laserCharge({ t: t + 1.4, dur: 1.05, from: 80, to: 900, gain: 0.04, out: lab });
    [2.45, 2.6].forEach((at, i) => {
      boom(t + at, 0.7 - i * 0.2, lab);
      for (let j = 0; j < 10; j++) {
        noise({ t: t + at + rnd(0, 0.25), dur: 0.04, gain: 0.06, type: 'highpass', freq: rnd(2500, 5000), attack: 0.001 });
      }
    });
    brass({ t: t + 2.9, notes: [48, 51, 55, 60], dur: 0.2, gain: 0.045 });
    brass({ t: t + 3.1, notes: [50, 53, 56, 62], dur: 0.7, gain: 0.05 });
    [140, 190, 240, 300, 360].forEach((base, i) => godBabble(t + 3.0 + i * 0.07, base, 6, lab));
    tone({ t: t + 4.2, freq: 220, to: 420, dur: 0.35, type: 'sawtooth', gain: 0.03, filter: 1200, attack: 0.02 });
    tone({ t: t + 4.2, freq: 223, to: 424, dur: 0.35, type: 'triangle', gain: 0.03, attack: 0.02 });
  },

  // Magical Hats mini-game (Yugi DK; magical-hats-easter-egg.js).
  'hats-open': t => {
    const hall = darkBus({ reverb: 0.5, echo: 0.1 });
    puzzleHum(t, 1.0, 0.04, hall);
    arpeggio(t + 0.05, [69, 76, 81, 88, 93], 0.05, (tt, n) => bell({ t: tt, freq: midi(n), dur: 1, gain: 0.03, out: hall }));
  },
  'hats-show': t => {
    healSparkles(t, 0.4, 4);
    tone({ t, freq: 600, to: 1300, dur: 0.18, type: 'triangle', gain: 0.04, attack: 0.01 });
  },
  'hats-cover': t => {
    ceWhoosh(t, 0.25, 0.05, 2400, 500);
    tone({ t: t + 0.2, freq: 140, to: 80, dur: 0.12, type: 'triangle', gain: 0.07, attack: 0.003 });
  },
  'hats-swap': t => {
    noise({ t, dur: 0.14, gain: 0.04, freq: rnd(1200, 2200), to: rnd(500, 900), q: 1.5, attack: 0.05 });
  },
  'hats-guess': t => {
    marimba({ t, note: 72, gain: 0.07 });
    marimba({ t: t + 0.1, note: 76, gain: 0.07 });
  },
  'hats-win': t => {
    const hall = darkBus({ reverb: 0.4 });
    boing(t, { from: 200, to: 700, dur: 0.25, gain: 0.05 });
    brass({ t: t + 0.08, notes: [60, 64, 67], dur: 0.18, gain: 0.04 });
    brass({ t: t + 0.3, notes: [64, 67, 72], dur: 0.6, gain: 0.045 });
    arpeggio(t + 0.3, [84, 88, 91, 96], 0.05, (tt, n) => bell({ t: tt, freq: midi(n), dur: 0.8, gain: 0.03, out: hall }));
  },
  'hats-lose': t => {
    noise({ t, dur: 0.35, gain: 0.07, freq: 900, to: 300, q: 0.8, attack: 0.02 });
    ceSadTrombone(t + 0.3, 0.035);
  },

  // Magnet Warriors: fly in 0-0.6s, magnetic hum 0.7-1.3s, BOINK 1.3s and
  // flung off, Beta flips 2.0-2.35s, clunk-clunk-clunk 2.5s, VALKYRION 2.7s,
  // junk clanks on 3.25-4.2s, then he groans and sags (4.3s).
  'cegg-yugi-bc': t => {
    const hall = darkBus({ reverb: 0.45, echo: 0.1 });
    [0, 0.12, 0.24].forEach(o => ceWhoosh(t + o, 0.45, 0.05, 600, 2600));
    [0.55, 0.62, 0.7].forEach(o => ceClang(t + o, 0.03, hall));
    laserCharge({ t: t + 0.7, dur: 0.6, from: 60, to: 600, gain: 0.04, out: hall });
    boing(t + 1.3, { from: 90, to: 700, dur: 0.5, gain: 0.1 });
    ceClang(t + 1.3, 0.06, hall);
    slideWhistle({ t: t + 1.35, freqs: [1400, 2200, 500], dur: 0.45, gain: 0.03, wobble: 14 });
    [1.72, 1.8, 1.88].forEach(o => noise({ t: t + o, dur: 0.15, gain: 0.07, type: 'lowpass', freq: 1200, to: 300, attack: 0.002 }));
    ceWhoosh(t + 1.75, 0.45, 0.04, 2400, 700);
    for (let i = 0; i < 6; i++) tone({ t: t + 2.0 + i * 0.05, freq: 1800, dur: 0.02, type: 'square', gain: 0.02, filter: 3000, attack: 0.001 });
    tone({ t: t + 2.3, freq: 900, to: 1500, dur: 0.1, gain: 0.03, attack: 0.005 });
    [2.5, 2.56, 2.62].forEach((o, i) => {
      tone({ t: t + o, freq: 150 - i * 20, to: 70, dur: 0.12, type: 'triangle', gain: 0.09, attack: 0.002 });
      ceClang(t + o, 0.03, hall);
    });
    boom(t + 2.7, 0.5, hall);
    brass({ t: t + 2.72, notes: [50, 57, 62, 66], dur: 0.25, gain: 0.04 });
    brass({ t: t + 2.98, notes: [52, 59, 64, 68], dur: 0.6, gain: 0.045 });
    arpeggio(t + 2.75, [81, 86, 90, 93], 0.05, (tt, n) => bell({ t: tt, freq: midi(n), dur: 0.9, gain: 0.03, out: hall }));
    for (let i = 0; i < 16; i++) {
      const at = t + 3.25 + i * 0.065;
      if (i === 15) ceClang(at, 0.06, hall);
      else if (i % 3) coinClink(at, 0.03);
      else tone({ t: at, freq: rnd(700, 1100), dur: 0.05, type: 'square', gain: 0.025, filter: 2500, attack: 0.001 });
    }
    tone({ t: t + 4.3, freq: 160, to: 90, dur: 0.7, type: 'sawtooth', gain: 0.035, filter: 600, attack: 0.08 });
    noise({ t: t + 4.3, dur: 0.6, gain: 0.03, freq: 400, to: 250, q: 8, attack: 0.1 });
    tone({ t: t + 4.75, freq: 110, to: 60, dur: 0.25, type: 'triangle', gain: 0.08, attack: 0.003 });
  },

  // Three Blue-Eyes swoop in 0-1.6s, fusion flash 1.6s + triple roar, the heads
  // squabble 2.25/2.55/2.85s, spin 3.4-4.0s, the knot pulls tight at 4.0s.
  'cegg-kaiba-dk': t => {
    const hall = darkBus({ reverb: 0.55, echo: 0.1 });
    [0, 0.15, 0.3].forEach((o, i) => {
      ceWhoosh(t + o + 0.3, 0.9, 0.05, 300 + i * 150, 2200, hall);
      monsterRoar(t + o + 0.4, 0.04, hall);
    });
    laserCharge({ t: t + 0.9, dur: 0.7, from: 120, to: 2400, gain: 0.04, out: hall });
    boom(t + 1.6, 0.9, hall);
    noise({ t: t + 1.6, dur: 0.3, gain: 0.1, type: 'highpass', freq: 2500, to: 700, attack: 0.002, out: hall });
    [0, 0.04, 0.08].forEach((o, i) => monsterRoar(t + 1.75 + o, 0.06 + i * 0.01, hall));
    brass({ t: t + 1.75, notes: [50, 57, 62, 69], dur: 0.9, gain: 0.04 });
    [[2.25, 330, 520], [2.55, 420, 660], [2.85, 280, 460]].forEach(([o, from, to]) => {
      tone({ t: t + o, freq: from, to, dur: 0.12, type: 'sawtooth', gain: 0.04, filter: 1800, attack: 0.005 });
      tone({ t: t + o + 0.13, freq: to, to: from, dur: 0.16, type: 'sawtooth', gain: 0.04, filter: 1800, attack: 0.005 });
    });
    slideWhistle({ t: t + 3.4, freqs: [500, 1400, 600, 1600, 700], dur: 0.6, gain: 0.04, wobble: 14 });
    noise({ t: t + 3.4, dur: 0.6, gain: 0.05, type: 'bandpass', freq: 600, to: 2400, q: 2, attack: 0.05 });
    noise({ t: t + 4.0, dur: 0.25, gain: 0.08, type: 'bandpass', freq: 900, to: 300, q: 6, attack: 0.01 });
    boing(t + 4.02, { from: 260, to: 120, dur: 0.35, gain: 0.07 });
    [[4.3, 311], [4.55, 294], [4.8, 277]].forEach(([o, f], i) =>
      tone({ t: t + o, freq: f, to: i === 2 ? f * 0.85 : f, dur: i === 2 ? 0.45 : 0.22, type: 'sawtooth', gain: 0.035, filter: 900, attack: 0.02 }));
  },

  // Rumble while the shadow grows 0-1.3s, SLAM at 1.3s, flag flutters 2.2s,
  // the card boings back up 3.2s, dizzy tweets from 3.9s.
  'cegg-kaiba-bc': t => {
    const hall = darkBus({ reverb: 0.45, echo: 0.15 });
    noise({ t, dur: 1.3, gain: 0.08, type: 'lowpass', freq: 120, to: 300, attack: 0.9, out: hall });
    tone({ t, freq: 45, to: 60, dur: 1.3, type: 'sawtooth', gain: 0.04, filter: 200, attack: 0.9, out: hall });
    ceWhoosh(t + 0.8, 0.5, 0.07, 2400, 300, hall);
    boom(t + 1.3, 1.2, hall);
    noise({ t: t + 1.3, dur: 0.18, gain: 0.16, type: 'highpass', freq: 1500, attack: 0.002 });
    tone({ t: t + 1.3, freq: 900, to: 150, dur: 0.2, type: 'square', gain: 0.03, filter: 2000, attack: 0.002 });
    noise({ t: t + 1.35, dur: 0.6, gain: 0.05, type: 'bandpass', freq: 700, to: 300, q: 0.8, attack: 0.02 });
    for (let i = 0; i < 5; i++) noise({ t: t + 2.2 + i * 0.12, dur: 0.08, gain: 0.03, freq: rnd(1200, 1800), q: 2, attack: 0.01 });
    boing(t + 3.2, { from: 100, to: 520, dur: 0.5, gain: 0.09 });
    [0, 0.25, 0.5, 0.75].forEach(o => {
      tone({ t: t + 3.9 + o, freq: 2400, to: 3000, dur: 0.07, type: 'sine', gain: 0.025, attack: 0.005 });
      tone({ t: t + 3.98 + o, freq: 3000, to: 2400, dur: 0.07, type: 'sine', gain: 0.025, attack: 0.005 });
    });
  },

  // Roulette spins 0.5-2.4s onto the skull, wobbly swordsman 2.8s.
  'cegg-joey-dk': t => {
    let at = 0.5;
    let gap = 0.03;
    while (at < 2.35) {
      tone({ t: t + at, freq: 2200, dur: 0.02, type: 'square', gain: 0.02, filter: 3000, attack: 0.001 });
      at += gap;
      gap *= 1.09;
    }
    tone({ t: t + 2.45, freq: 110, dur: 0.5, type: 'square', gain: 0.03, filter: 700, attack: 0.005 });
    tone({ t: t + 2.45, freq: 116, dur: 0.5, type: 'square', gain: 0.025, filter: 700, attack: 0.005 });
    boing(t + 2.8, { from: 150, to: 600, dur: 0.35, gain: 0.07 });
    slideWhistle({ t: t + 3.0, freqs: [420, 300, 460, 280, 440, 260], dur: 1.4, gain: 0.035, wobble: 10 });
    ceSadTrombone(t + 4.2, 0.03);
  },

  // Die lands 0.9 (6), 1.9 (6), 2.9 (1); Red-Eyes 3.2, sigh 3.7, leaves 4.3s.
  'cegg-joey-bc': t => {
    const hall = darkBus({ reverb: 0.35 });
    [0.9, 1.9, 2.9].forEach((o, i) => {
      noise({ t: t + o, dur: 0.12, gain: 0.12, type: 'lowpass', freq: 900, to: 200, attack: 0.002 });
      tone({ t: t + o, freq: 900, dur: 0.04, type: 'square', gain: 0.03, filter: 2000, attack: 0.001 });
      if (i < 2) arpeggio(t + o + 0.05, [72 + i * 4, 79 + i * 4], 0.06, (tt, n) => bell({ t: tt, freq: midi(n), dur: 0.5, gain: 0.04, out: hall }));
    });
    tone({ t: t + 2.95, freq: midi(60), to: midi(48), dur: 0.6, type: 'triangle', gain: 0.05, attack: 0.01 });
    monsterRoar(t + 3.2, 0.05, hall);
    noise({ t: t + 3.7, dur: 0.7, gain: 0.05, freq: 900, to: 300, q: 1.5, attack: 0.2 });
    ceWhoosh(t + 4.3, 0.5, 0.06, 500, 3000);
  },

  // Harpies swoop 0-3.2s, blush 1.1s, sparkles 1.4s, perfume 1.8s, kiss 2.3s.
  'cegg-mai': t => {
    const room = darkBus({ reverb: 0.35 });
    [0, 0.38, 0.76].forEach(o => {
      ceWhoosh(t + o + 0.3, 0.5, 0.045, 600, 2800);
      tone({ t: t + o + 0.85, freq: 1800, to: 2600, dur: 0.12, type: 'sawtooth', gain: 0.012, filter: 3500, attack: 0.01 });
    });
    healSparkles(t + 1.4, 1.3, 9, room);
    for (let i = 0; i < 5; i++) noise({ t: t + 1.8 + i * 0.18, dur: 0.12, gain: 0.05, type: 'highpass', freq: 5000, attack: 0.005 });
    tone({ t: t + 2.3, freq: 500, to: 1200, dur: 0.12, gain: 0.04, attack: 0.01 });
    noise({ t: t + 2.38, dur: 0.06, gain: 0.05, freq: 2000, q: 2, attack: 0.002 });
    [[3.3, [62, 65, 69, 72]], [3.7, [60, 64, 67, 71]]].forEach(([o, notes]) =>
      notes.forEach((n, i) => pluck({ t: t + o + i * 0.04, note: n + 12, gain: 0.04, dur: 1 })));
  },

  // Big wave 0.25-1.3s, flood, whale slap 2.6s, splash, drain 3.8-4.6s.
  'cegg-mako': t => {
    noise({ t: t + 0.1, dur: 1.4, gain: 0.12, type: 'lowpass', freq: 400, to: 2200, attack: 0.6 });
    noise({ t: t + 0.6, dur: 1.0, gain: 0.06, type: 'highpass', freq: 3000, to: 1200, attack: 0.3 });
    for (let i = 0; i < 14; i++) bubble({ t: t + 1.2 + rnd(0, 2.4), from: rnd(200, 400), to: rnd(600, 1000), gain: 0.03, dur: 0.08 });
    tone({ t: t + 2.0, freq: 70, to: 140, dur: 0.5, gain: 0.08, attack: 0.1 });
    noise({ t: t + 2.6, dur: 0.12, gain: 0.18, type: 'highpass', freq: 1200, attack: 0.001 });
    boom(t + 2.6, 0.35);
    for (let i = 0; i < 10; i++) noise({ t: t + 2.7 + rnd(0, 0.9), dur: 0.06, gain: 0.04, type: 'highpass', freq: rnd(3000, 6000), attack: 0.002 });
    noise({ t: t + 3.8, dur: 0.9, gain: 0.07, type: 'lowpass', freq: 1800, to: 200, attack: 0.1 });
    for (let i = 0; i < 6; i++) bubble({ t: t + 3.9 + i * 0.1, from: 500 - i * 40, to: 200, gain: 0.04, dur: 0.07 });
  },

  // Ring jingles 0.5-1.5s, the card is sucked in 2-2.7s, figurine 2.65s.
  'cegg-bakura': t => {
    const crypt = darkBus({ reverb: 0.6, echo: 0.2 });
    tone({ t, freq: midi(38), dur: 4.6, type: 'sawtooth', gain: 0.03, filter: 400, attack: 0.6, out: crypt });
    tone({ t, freq: midi(39), dur: 4.6, type: 'sawtooth', gain: 0.02, filter: 400, attack: 0.6, out: crypt });
    [0.55, 0.62, 0.7, 0.78, 0.85, 1.0, 1.25].forEach(o => bell({ t: t + o, freq: rnd(1800, 2600), dur: 0.5, gain: 0.025, out: crypt }));
    noise({ t: t + 1.9, dur: 0.8, gain: 0.09, freq: 3000, to: 200, q: 3, attack: 0.5, out: crypt });
    tone({ t: t + 1.9, freq: 900, to: 90, dur: 0.8, type: 'sawtooth', gain: 0.03, filter: 1500, attack: 0.3, out: crypt });
    tone({ t: t + 2.7, freq: 1600, dur: 0.05, gain: 0.04, attack: 0.002 });
    tone({ t: t + 3.0, freq: 1800, to: 2600, dur: 0.08, gain: 0.03, attack: 0.005 });
    tone({ t: t + 3.1, freq: 2400, to: 1700, dur: 0.12, gain: 0.03, attack: 0.005 });
    ceGiggle(t + 3.4, 180, 5, crypt, 'sawtooth');
    ceWhoosh(t + 4.3, 0.4, 0.05, 300, 2000);
  },

  // Toon bounces land 0.5/1.1/1.7/2.3/2.9s, giggles, the Eye at 2.5s, wink 3.3s.
  'cegg-pegasus': t => {
    [0.5, 1.1, 1.7, 2.3, 2.9].forEach((o, i) => boing(t + o, { from: 140 + i * 20, to: 500 + i * 40, dur: 0.3, gain: 0.05 }));
    [0.7, 1.15, 1.6, 2.05].forEach(o => ceGiggle(t + o, 900, 4));
    arpeggio(t + 2.5, [76, 81, 85, 88], 0.05, (tt, n) => bell({ t: tt, freq: midi(n), dur: 0.8, gain: 0.03 }));
    tone({ t: t + 3.3, freq: 2400, to: 3600, dur: 0.12, gain: 0.04, attack: 0.003 });
    bell({ t: t + 3.42, freq: 4200, dur: 0.8, gain: 0.04 });
    ceGiggle(t + 3.7, 520, 6, sfxOut, 'sawtooth');
  },

  // "TRAP CARD!" at 0.3s, a trap per visible card every 0.23s, the bow 2.9s.
  'cegg-odion': t => {
    const hall = darkBus({ reverb: 0.4 });
    brass({ t: t + 0.25, notes: [57, 60, 63], dur: 0.35, gain: 0.04 });
    for (let i = 0; i < 9; i++) {
      const at = t + 0.3 + i * 0.23;
      if (i % 3 === 0) slideWhistle({ t: at, freqs: [1400, 300], dur: 0.45, gain: 0.025, wobble: 0, out: hall });
      if (i % 3 === 1) arpeggio(at, [84, 88, 91], 0.03, (tt, n) => bell({ t: tt, freq: midi(n), dur: 0.5, gain: 0.02, out: hall }));
      if (i % 3 === 2) ceClang(at + 0.04, 0.04, hall);
    }
    arpeggio(t + 3.0, [67, 72, 76], 0.12, (tt, n) => marimba({ t: tt, note: n, gain: 0.07 }));
  },

  // Necklace 0-0.6s, the vision 0.7-2.9s with a ghost tap at 2.05s, "…or not." 3.1s.
  'cegg-ishizu': t => {
    const temple = darkBus({ reverb: 0.6, echo: 0.25 });
    bell({ t: t + 0.4, freq: midi(81), dur: 1.5, gain: 0.05, out: temple });
    noise({ t: t + 0.6, dur: 2.3, gain: 0.04, freq: 1500, to: 4000, q: 6, attack: 0.6, out: temple });
    [57, 64, 69, 71].forEach(n => tone({ t: t + 0.7, freq: midi(n), dur: 2.2, gain: 0.015, attack: 0.5, out: temple }));
    tone({ t: t + 2.05, freq: 1300, dur: 0.04, gain: 0.04, attack: 0.002, out: temple });
    bell({ t: t + 2.08, freq: midi(88), dur: 1.2, gain: 0.03, out: temple });
    marimba({ t: t + 3.1, note: 64, gain: 0.08 });
    marimba({ t: t + 3.3, note: 60, gain: 0.08 });
    arpeggio(t + 3.6, [81, 84, 88], 0.08, (tt, n) => bell({ t: tt, freq: midi(n), dur: 1, gain: 0.03, out: temple }));
  },

  // Melt 0.3-2.4s, drips, Revival Jam splats 1.55s & 3.05s and re-forms.
  'cegg-marik-1': t => {
    const cave = darkBus({ reverb: 0.4 });
    tone({ t: t + 0.3, freq: 220, to: 70, dur: 2.0, type: 'triangle', gain: 0.05, attack: 0.2, out: cave });
    for (let i = 0; i < 9; i++) bubble({ t: t + 0.6 + rnd(0, 1.8), from: rnd(900, 1300), to: rnd(300, 450), gain: 0.03, dur: 0.08 });
    slideWhistle({ t: t + 1.25, freqs: [1200, 400], dur: 0.3, gain: 0.03, wobble: 0 });
    ceSplat(t + 1.55, 0.12, cave);
    slideWhistle({ t: t + 2.1, freqs: [150, 400, 260], dur: 0.45, gain: 0.03, wobble: 14 });
    boing(t + 2.75, { from: 120, to: 420, dur: 0.3, gain: 0.05 });
    ceSplat(t + 3.05, 0.12, cave);
    slideWhistle({ t: t + 3.45, freqs: [150, 420, 280], dur: 0.45, gain: 0.03, wobble: 14 });
    ceGiggle(t + 3.9, 200, 5, cave, 'sawtooth');
  },

  // Sphere hums, scroll unrolls 0.7s, ??? 1.1-1.6s, ERROR 2-2.8s, phoenix 2.9s.
  'cegg-marik-2': t => {
    const temple = darkBus({ reverb: 0.55, echo: 0.15 });
    puzzleHum(t, 2.9, 0.05, temple);
    noise({ t: t + 0.65, dur: 0.4, gain: 0.05, freq: 3000, to: 1500, q: 1, attack: 0.05 });
    [1.1, 1.35, 1.6].forEach((o, i) => tone({ t: t + o, freq: 400 + i * 60, to: 650 + i * 80, dur: 0.15, gain: 0.04, attack: 0.01 }));
    [2.0, 2.15, 2.45].forEach(o => {
      tone({ t: t + o, freq: 220, dur: 0.11, type: 'square', gain: 0.035, filter: 1500, attack: 0.002 });
      tone({ t: t + o, freq: 233, dur: 0.11, type: 'square', gain: 0.03, filter: 1500, attack: 0.002 });
    });
    noise({ t: t + 2.5, dur: 0.4, gain: 0.06, type: 'lowpass', freq: 300, attack: 0.05, out: temple });
    boom(t + 2.9, 0.7, temple);
    brass({ t: t + 2.95, notes: [50, 57, 62, 66], dur: 1.0, gain: 0.04 });
    slideWhistle({ t: t + 3.0, freqs: [1400, 2600, 1900], dur: 0.7, gain: 0.03, wobble: 18, out: temple });
    noise({ t: t + 3.0, dur: 1.5, gain: 0.05, type: 'highpass', freq: 2000, to: 5000, attack: 0.2, out: temple });
  },

  // Bugs skitter in 0-2s, nibble 1.5-2.6s, Exodia 2.7s, flick 3.3s.
  'cegg-weevil': t => {
    for (let i = 0; i < 40; i++) tone({ t: t + rnd(0, 2.2), freq: rnd(3500, 6000), dur: 0.012, type: 'square', gain: 0.012, attack: 0.001 });
    for (let i = 0; i < 12; i++) noise({ t: t + 1.5 + rnd(0, 1.1), dur: 0.05, gain: 0.05, freq: rnd(1500, 3000), q: 2, attack: 0.002 });
    const hall = darkBus({ reverb: 0.5 });
    brass({ t: t + 2.7, notes: [48, 55, 60, 64], dur: 0.5, gain: 0.035 });
    bell({ t: t + 2.7, freq: midi(84), dur: 1, gain: 0.04, out: hall });
    tone({ t: t + 3.3, freq: 600, to: 2000, dur: 0.08, gain: 0.05, attack: 0.003 });
    slideWhistle({ t: t + 3.35, freqs: [1500, 900, 500], dur: 0.8, gain: 0.03, wobble: 9, out: hall });
    ceGiggle(t + 3.35, 1100, 6, sfxOut, 'square');
  },

  // "One…" 0.1s, "two…" 0.55s, flurry 1.3s, slot 1.7s (stops 2.8/3.15/3.5s), flag 3.6s.
  'cegg-keith': t => {
    cardFlip(t + 0.1, 0.12);
    cardFlip(t + 0.55, 0.12);
    for (let i = 0; i < 16; i++) cardFlip(t + 1.3 + i * 0.06, 0.07, rnd(2000, 3200));
    bell({ t: t + 1.75, freq: 1800, dur: 0.4, gain: 0.04 });
    for (let at = 1.9; at < 3.5; at += 0.05) {
      tone({ t: t + at, freq: 1400, dur: 0.015, type: 'square', gain: 0.012, filter: 3000, attack: 0.001 });
    }
    bell({ t: t + 2.8, freq: midi(84), dur: 0.5, gain: 0.05 });
    bell({ t: t + 3.15, freq: midi(88), dur: 0.5, gain: 0.05 });
    tone({ t: t + 3.5, freq: 150, dur: 0.35, type: 'square', gain: 0.035, filter: 800, attack: 0.005 });
    brass({ t: t + 3.65, notes: [60, 64, 67], dur: 0.25, gain: 0.035 });
    brass({ t: t + 3.92, notes: [64, 67, 72], dur: 0.8, gain: 0.04 });
    slideWhistle({ t: t + 4.0, freqs: [2200, 2900, 2000], dur: 0.5, gain: 0.02, wobble: 20 });
  }
};

// --- Egg counter + THE GRAND FINALE (egg-tracker.js, pharaoh-finale.js) -----

// The finale score's bus, so Skip / Close can fade the rest of it out.
let sfxFinaleBus = null;

// A breathy ney flute: triangle with delayed vibrato plus a breath of noise.
function ney(t, note, dur, gain = 0.03, out = sfxOut) {
  const freq = midi(note);
  const osc = sfxCtx.createOscillator();
  const lfo = sfxCtx.createOscillator();
  const depth = sfxCtx.createGain();
  const lp = sfxCtx.createBiquadFilter();
  const amp = sfxCtx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(freq * 0.985, t);
  osc.frequency.exponentialRampToValueAtTime(freq, t + 0.07);
  lfo.frequency.value = 5.3;
  depth.gain.setValueAtTime(0, t);
  depth.gain.linearRampToValueAtTime(freq * 0.012, t + Math.min(dur * 0.6, 0.5));
  lp.type = 'lowpass';
  lp.frequency.value = 2400;
  amp.gain.setValueAtTime(0.0001, t);
  amp.gain.exponentialRampToValueAtTime(gain, t + 0.06);
  amp.gain.setValueAtTime(gain, t + dur * 0.75);
  amp.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.08);
  lfo.connect(depth).connect(osc.frequency);
  osc.connect(lp).connect(amp).connect(out);
  osc.start(t);
  lfo.start(t);
  osc.stop(t + dur + 0.12);
  lfo.stop(t + dur + 0.12);
  noise({ t, dur: dur * 0.9, gain: gain * 0.22, freq: freq * 2, q: 6, attack: 0.05, out });
}

// A wordless "aah" choir: detuned saw pads plus a breathy formant.
function choir({ t, notes, dur, gain = 0.012, attack = 1, out }) {
  notes.forEach(n => {
    [-9, 0, 8].forEach(detune => {
      tone({ t, freq: midi(n), dur, type: 'sawtooth', gain, attack, filter: 1500, detune, out });
    });
  });
  noise({ t, dur, gain: gain * 2.5, freq: 900, q: 2, attack, out });
  noise({ t, dur, gain: gain * 1.5, freq: 1300, q: 3, attack, out });
}

function frameDrum(t, doum, out) {
  if (doum) {
    tone({ t, freq: 95, to: 52, dur: 0.22, type: 'triangle', gain: 0.12, attack: 0.002, out });
    noise({ t, dur: 0.08, gain: 0.05, type: 'lowpass', freq: 400, attack: 0.002, out });
  } else {
    noise({ t, dur: 0.05, gain: 0.04, freq: 3200, q: 2, attack: 0.001, out });
  }
}

const FINALE_SOUNDS = {
  // Tapping the locked secret theme tile: a padlock rattle.
  'theme-locked': t => {
    [0, 0.07, 0.14].forEach((o, i) => {
      noise({ t: t + o, dur: 0.035, gain: 0.07, freq: 2400 - i * 200, q: 4, attack: 0.001 });
      tone({ t: t + o, freq: 900 - i * 60, dur: 0.05, type: 'square', gain: 0.012, filter: 2500 });
    });
  },
  'egg-found': t => {
    marimba({ t, note: 79, gain: 0.08 });
    marimba({ t: t + 0.09, note: 84, gain: 0.08 });
    bell({ t: t + 0.18, freq: midi(96), dur: 0.8, gain: 0.025 });
  },
  'egg-found-all': t => {
    brass({ t, notes: [64, 68, 71], dur: 0.18, gain: 0.04 });
    brass({ t: t + 0.2, notes: [64, 68, 71, 76], dur: 0.8, gain: 0.045 });
    arpeggio(t + 0.2, [88, 92, 95, 100], 0.06, (tt, n) => bell({ t: tt, freq: midi(n), dur: 1, gain: 0.025 }));
  },

  // The full score, timed to the finale's CSS timeline (see pharaoh-finale.js).
  'pharaoh-finale': t => {
    sfxFinaleBus?.gain.setTargetAtTime(0, t, 0.05);
    const bus = darkBus({ reverb: 0.55, echo: 0.12 });
    sfxFinaleBus = bus;

    // Intro: a low drone, heartbeats, a shimmer for "40 / 40".
    tone({ t, freq: 41.2, dur: 3.6, type: 'sawtooth', gain: 0.05, filter: 220, attack: 1, out: bus });
    [0.6, 1.6, 2.6].forEach((at, i) => {
      const g = 0.25 + i * 0.08;
      tone({ t: t + at, freq: 62, to: 40, dur: 0.25, gain: g, attack: 0.003, out: bus });
      tone({ t: t + at + 0.28, freq: 58, to: 38, dur: 0.22, gain: g * 0.7, attack: 0.003, out: bus });
    });
    arpeggio(t + 0.6, [88, 95, 100, 107], 0.12, (tt, n) => bell({ t: tt, freq: midi(n), dur: 1.6, gain: 0.015, out: bus }));

    // Torches ignite (3.2s) and crackle.
    [3.2, 3.32].forEach(at => noise({ t: t + at, dur: 0.6, gain: 0.08, freq: 300, to: 2400, q: 1, attack: 0.1, out: bus }));
    for (let i = 0; i < 24; i++) {
      noise({ t: t + 3.6 + rnd(0, 11), dur: 0.03, gain: 0.025, type: 'highpass', freq: rnd(2500, 5000), attack: 0.001, out: bus });
    }

    // The tomb: an Egyptian drone and a frame-drum groove (doum-tek-tek-doum-tek).
    [40, 47, 52].forEach(n => tone({ t: t + 3.2, freq: midi(n), dur: 12.6, type: 'sawtooth', gain: 0.012, filter: 600, attack: 2, out: bus }));
    for (let bar = 0; bar < 10; bar++) {
      const b = t + 4.0 + bar * 1.2;
      [[0, true], [0.3, false], [0.45, false], [0.6, true], [0.9, false]].forEach(([o, doum]) => frameDrum(b + o, doum, bus));
    }
    // The honour guard rises: stone thuds, far to near.
    for (let i = 0; i < 10; i++) {
      const at = t + 4.0 + i * 0.36;
      noise({ t: at, dur: 0.25, gain: 0.07, type: 'lowpass', freq: 500, to: 150, attack: 0.01, out: bus });
      tone({ t: at, freq: 80, to: 50, dur: 0.2, type: 'triangle', gain: 0.06, attack: 0.005, out: bus });
    }
    // Ney melody in E double harmonic (E F G# A B C D#).
    let at = t + 4.4;
    [[64, 0.4], [65, 0.4], [68, 0.8], [69, 0.4], [68, 0.4], [65, 0.8], [64, 1.2]].forEach(([n, d]) => {
      ney(at, n, d, 0.035, bus);
      at += d;
    });
    at = t + 9.0;
    [[71, 0.4], [72, 0.4], [71, 0.4], [69, 0.4], [68, 0.8], [69, 0.4], [71, 0.4], [72, 0.8], [75, 0.4], [76, 1.6]].forEach(([n, d]) => {
      ney(at, n, d, 0.035, bus);
      at += d;
    });

    // The seven Millennium Items: whoosh in, lock with a chime (8.5s + k*0.8s).
    [76, 79, 81, 83, 86, 88, 91].forEach((n, k) => {
      const fly = t + 8.5 + k * 0.8;
      ceWhoosh(fly, 0.6, 0.04, 500, 3000, bus);
      bell({ t: fly + 0.7, freq: midi(n), dur: 1.8, gain: 0.04, out: bus });
      ceClang(fly + 0.7, 0.025, bus);
    });
    // Strings swell under the items.
    choir({ t: t + 8.5, notes: [52, 59, 64, 67], dur: 6, gain: 0.006, attack: 4.5, out: bus });

    // The carvings light up (14.1s).
    boom(t + 14.1, 0.6, bus);
    noise({ t: t + 14.1, dur: 1.6, gain: 0.07, type: 'lowpass', freq: 160, attack: 0.1, out: bus });
    noise({ t: t + 14.1, dur: 1.4, gain: 0.04, type: 'highpass', freq: 2000, to: 8000, attack: 0.3, out: bus });
    brass({ t: t + 14.15, notes: [40, 47, 52, 55], dur: 1.3, gain: 0.04 });
    arpeggio(t + 14.2, [76, 80, 83, 88, 92], 0.08, (tt, n) => bell({ t: tt, freq: midi(n), dur: 1.4, gain: 0.025, out: bus }));

    // Yami's walk (15.6-19.6s): taiko steps and a rising brass fanfare.
    for (let i = 0; i < 8; i++) {
      const step = t + 15.6 + i * 0.5;
      tone({ t: step, freq: 110, to: 45, dur: 0.4, gain: 0.16 + i * 0.015, attack: 0.003, out: bus });
      noise({ t: step, dur: 0.15, gain: 0.05, type: 'lowpass', freq: 600, attack: 0.002, out: bus });
    }
    [[15.8, [52, 59, 64], 0.3], [16.2, [52, 59, 64], 0.3], [16.6, [55, 62, 67], 0.7], [17.4, [57, 64, 69], 0.4],
      [17.8, [59, 66, 71], 0.4], [18.2, [60, 67, 72], 1.0], [19.2, [59, 63, 66, 71], 0.6]].forEach(([o, notes, dur]) => {
      brass({ t: t + o, notes, dur, gain: 0.04 });
    });

    // The door grinds open (19.6s)...
    boom(t + 19.6, 0.9, bus);
    noise({ t: t + 19.6, dur: 2.2, gain: 0.12, type: 'lowpass', freq: 320, to: 120, attack: 0.15, out: bus });
    tone({ t: t + 19.6, freq: 48, to: 40, dur: 2.2, type: 'sawtooth', gain: 0.04, filter: 220, attack: 0.2, out: bus });
    // ...and the light: a choir in E major, a cascade of bells, sparkles.
    choir({ t: t + 20.0, notes: [40, 52, 56, 59, 64, 68, 71, 76], dur: 4.6, gain: 0.008, attack: 1.2, out: bus });
    arpeggio(t + 20.0, [76, 80, 83, 88, 92, 95, 100], 0.09, (tt, n) => bell({ t: tt, freq: midi(n), dur: 2, gain: 0.03, out: bus }));
    healSparkles(t + 20.2, 3.5, 30, bus);
    laserCharge({ t: t + 21.0, dur: 1.4, from: 120, to: 2400, gain: 0.025, out: bus });

    // White-out (22.4s).
    boom(t + 22.4, 1.0, bus);
    noise({ t: t + 22.4, dur: 2.5, gain: 0.08, type: 'highpass', freq: 3000, to: 1200, attack: 0.01, out: bus });

    // The ending: a warm E major pad, chimes for each line, the trophy fanfare.
    choir({ t: t + 23.6, notes: [52, 56, 59, 64, 68], dur: 8.5, gain: 0.006, attack: 1.5, out: bus });
    tone({ t: t + 23.6, freq: midi(28), dur: 8.5, type: 'triangle', gain: 0.05, attack: 1.5, out: bus });
    bell({ t: t + 25.0, freq: midi(76), dur: 2.5, gain: 0.04, out: bus });
    bell({ t: t + 26.8, freq: midi(71), dur: 2.5, gain: 0.035, out: bus });
    bell({ t: t + 27.0, freq: midi(76), dur: 2.5, gain: 0.035, out: bus });
    ceWhoosh(t + 28.6, 0.9, 0.05, 300, 3500, bus);
    for (let i = 0; i < 6; i++) cardFlip(t + 28.7 + i * 0.12, 0.05);
    brass({ t: t + 29.4, notes: [64, 68, 71], dur: 0.22, gain: 0.045 });
    brass({ t: t + 29.65, notes: [64, 68, 71, 76], dur: 1.6, gain: 0.05 });
    arpeggio(t + 29.65, [88, 92, 95, 100, 104], 0.07, (tt, n) => bell({ t: tt, freq: midi(n), dur: 1.5, gain: 0.025, out: bus }));
    for (let i = 0; i < 10; i++) coinClink(t + 29.7 + rnd(0, 1.2), 0.02);
  },
  'pharaoh-finale-skip': t => {
    sfxFinaleBus?.gain.setTargetAtTime(0, t, 0.08);
    const bus = darkBus({ reverb: 0.5, echo: 0.1 });
    sfxFinaleBus = bus;
    choir({ t, notes: [52, 56, 59, 64, 68], dur: 5, gain: 0.006, attack: 0.8, out: bus });
    bell({ t: t + 0.2, freq: midi(76), dur: 2.5, gain: 0.04, out: bus });
    brass({ t: t + 1.2, notes: [64, 68, 71], dur: 0.22, gain: 0.04 });
    brass({ t: t + 1.45, notes: [64, 68, 71, 76], dur: 1.4, gain: 0.045 });
    arpeggio(t + 1.45, [88, 92, 95, 100], 0.07, (tt, n) => bell({ t: tt, freq: midi(n), dur: 1.4, gain: 0.025, out: bus }));
  },
  'pharaoh-finale-stop': t => {
    sfxFinaleBus?.gain.setTargetAtTime(0, t, 0.15);
    sfxFinaleBus = null;
  }
};

// --- Size picker eggs (src/effects/size-eggs.js) ----------------------------

const SIZE_EGG_SOUNDS = {
  // Card flies in 0s, charge 0.55-1.05s, ZAP 1.05s, shrink 1.05-1.4s,
  // chipmunk squeaks + pitter-patter 1.4-3.15s, boing back 3.15s.
  'shrink-ray': t => {
    const room = darkBus({ reverb: 0.3 });
    ceWhoosh(t, 0.45, 0.05, 500, 2400);
    cardFlip(t + 0.4, 0.1);
    arpeggio(t + 0.55, [72, 79, 84], 0.06, (tt, n) => bell({ t: tt, freq: midi(n), dur: 0.6, gain: 0.025, out: room }));
    laserCharge({ t: t + 0.55, dur: 0.5, from: 200, to: 2400, gain: 0.04, out: room });
    tone({ t: t + 1.05, freq: 3200, to: 300, dur: 0.25, type: 'sawtooth', gain: 0.05, filter: 5000, attack: 0.002, out: room });
    noise({ t: t + 1.05, dur: 0.2, gain: 0.08, type: 'highpass', freq: 2000, attack: 0.002, out: room });
    slideWhistle({ t: t + 1.1, freqs: [500, 2600], dur: 0.3, gain: 0.04, wobble: 10, out: room });

    tone({ t: t + 1.45, freq: 2200, to: 3400, dur: 0.18, type: 'triangle', gain: 0.04, attack: 0.005 });
    [1.6, 2.05, 2.6].forEach((at, i) => ceGiggle(t + at, 1500 + i * 150, 6, room, 'square'));
    for (let i = 0; i < 26; i++) {
      tone({ t: t + 1.4 + i * 0.067, freq: rnd(2600, 3600), dur: 0.012, type: 'triangle', gain: 0.02, attack: 0.001 });
    }

    slideWhistle({ t: t + 3.15, freqs: [2600, 300], dur: 0.25, gain: 0.04, out: room });
    boing(t + 3.35, { from: 120, to: 480, dur: 0.45, gain: 0.08, out: room });
    tone({ t: t + 3.85, freq: 160, to: 90, dur: 0.1, type: 'triangle', gain: 0.07, attack: 0.002, out: room });
  },

  // Stomps at 0.42/1.02/1.68s, "WHO BUILT THIS CEILING?!" 1.98s, creaky
  // crouch 2.76-3.12s, tiny "…hi." 3.36s, BONK 4.56s, sinks 5.16s.
  'obelisk-headroom': t => {
    const hall = darkBus({ reverb: 0.6, echo: 0.2 });
    noise({ t, dur: 2, gain: 0.08, type: 'lowpass', freq: 160, attack: 0.4, out: hall });
    tone({ t, freq: 38, dur: 2, type: 'sawtooth', gain: 0.03, filter: 140, attack: 0.4, out: hall });
    [0.42, 1.02, 1.68].forEach((at, i) => boom(t + at, 0.6 + i * 0.2, hall));
    brass({ t: t + 1.7, notes: [36, 43, 48, 55], dur: 0.9, gain: 0.04 });

    godBabble(t + 1.98, 85, 9, hall);
    godBabble(t + 1.99, 128, 9, hall);

    tone({ t: t + 2.76, freq: 150, to: 105, dur: 0.36, type: 'sawtooth', gain: 0.035, filter: 700, q: 6, attack: 0.02, out: hall });
    [2.85, 3.05].forEach(at => noise({ t: t + at, dur: 0.05, gain: 0.08, type: 'bandpass', freq: rnd(1200, 2000), q: 4, attack: 0.001 }));
    tone({ t: t + 3.36, freq: 330, to: 290, dur: 0.18, type: 'square', gain: 0.02, filter: 900, attack: 0.02, out: hall });
    tone({ t: t + 3.58, freq: 300, to: 260, dur: 0.2, type: 'square', gain: 0.018, filter: 900, attack: 0.02, out: hall });

    ceWhoosh(t + 4.32, 0.25, 0.05, 400, 1600, hall);
    ceClang(t + 4.56, 0.08, hall);
    boom(t + 4.56, 0.5, hall);
    tone({ t: t + 4.56, freq: 600, to: 180, dur: 0.25, type: 'triangle', gain: 0.08, attack: 0.002 });
    arpeggio(t + 4.7, [91, 96, 93, 98], 0.08, (tt, n) => bell({ t: tt, freq: midi(n), dur: 0.5, gain: 0.02, out: hall }));
    tone({ t: t + 4.8, freq: 140, to: 95, dur: 0.6, type: 'sawtooth', gain: 0.03, filter: 500, attack: 0.05, out: hall });
    slideWhistle({ t: t + 5.16, freqs: [420, 90], dur: 0.8, gain: 0.04, out: hall });
    noise({ t: t + 5.16, dur: 0.8, gain: 0.05, type: 'lowpass', freq: 200, attack: 0.2, out: hall });
  }
};

// --- Duel header eggs (src/effects/duel-header-eggs.js) ---------------------

// The credits song's bus, so a skip can fade the rest of it out.
let sfxCreditsBus = null;

const HEADER_EGG_SOUNDS = {
  // Wizard poof 0.1s, roulette ticks 0.5-1.4s (lands on 💀: "uh-oh"), the
  // nudge 1.5s, TIME MAGIC! 1.6s, tape rewind 1.9-3.3s, ka-chunk + PLAY 3.3s,
  // sad trombone 3.55s.
  'time-wizard': t => {
    const hall = darkBus({ reverb: 0.4, echo: 0.1 });
    noise({ t: t + 0.1, dur: 0.3, gain: 0.06, freq: 600, to: 3000, q: 1, attack: 0.02 });
    arpeggio(t + 0.15, [76, 81, 85, 88], 0.05, (tt, n) => bell({ t: tt, freq: midi(n), dur: 0.7, gain: 0.025, out: hall }));

    let at = 0.5;
    let gap = 0.025;
    while (at < 1.4) {
      tone({ t: t + at, freq: 2200, dur: 0.012, type: 'square', gain: 0.03, filter: 4000, attack: 0.001 });
      at += gap;
      gap *= 1.11;
    }
    tone({ t: t + 1.42, freq: 180, dur: 0.25, type: 'sawtooth', gain: 0.03, filter: 700, attack: 0.01 });
    tone({ t: t + 1.42, freq: 190, dur: 0.25, type: 'sawtooth', gain: 0.025, filter: 700, attack: 0.01 });
    tone({ t: t + 1.5, freq: 1800, to: 2400, dur: 0.05, type: 'triangle', gain: 0.05, attack: 0.002 });
    tone({ t: t + 1.58, freq: 2200, dur: 0.012, type: 'square', gain: 0.03, filter: 4000, attack: 0.001 });
    brass({ t: t + 1.62, notes: [60, 64, 67, 72], dur: 0.35, gain: 0.035 });
    arpeggio(t + 1.62, [84, 88, 91, 96], 0.04, (tt, n) => bell({ t: tt, freq: midi(n), dur: 0.8, gain: 0.025, out: hall }));

    const rew = t + 1.9;
    noise({ t: rew, dur: 1.4, gain: 0.04, type: 'highpass', freq: 3000, attack: 0.05 });
    tone({ t: rew, freq: 500, to: 1900, dur: 1.4, type: 'square', gain: 0.012, filter: 2500, attack: 0.05 });
    for (let i = 0; i < 22; i++) {
      const f = rnd(900, 2400);
      tone({ t: rew + i * 0.062, freq: f, to: f * rnd(1.2, 1.6), dur: 0.045, type: 'triangle', gain: 0.025, attack: 0.003 });
    }

    const clunk = t + 3.3;
    noise({ t: clunk, dur: 0.08, gain: 0.12, type: 'lowpass', freq: 1200, attack: 0.002 });
    tone({ t: clunk, freq: 220, to: 80, dur: 0.1, type: 'triangle', gain: 0.1, attack: 0.002 });
    tone({ t: clunk + 0.08, freq: 160, to: 70, dur: 0.08, type: 'triangle', gain: 0.07, attack: 0.002 });
    tone({ t: clunk + 0.1, freq: 1900, to: 300, dur: 0.18, type: 'square', gain: 0.01, filter: 2000, attack: 0.005 });
    ceSadTrombone(clunk + 0.25, 0.03);
  },

  // A cheesy anime outro: C-G-Am-F twice (2s per bar), then a held C (16.3s).
  'end-credits': t => {
    sfxCreditsBus?.gain.setTargetAtTime(0, t, 0.05);
    const bus = darkBus({ reverb: 0.35, echo: 0.08 });
    sfxCreditsBus = bus;
    const start = t + 0.3;
    const bar = 2;
    const beat = bar / 4;
    const chords = [[48, [60, 64, 67]], [43, [59, 62, 67]], [45, [60, 64, 69]], [41, [60, 65, 69]]];
    const leads = [
      [67, 72, 74, 76], [74, 71, 67, 71], [72, 76, 74, 72], [69, 72, 77, 76],
      [79, 76, 74, 76], [74, 79, 77, 74], [76, 72, 74, 76], [77, 76, 74, 74]
    ];

    leads.forEach((lead, b) => {
      const [root, pad] = chords[b % 4];
      const at = start + b * bar;
      pad.forEach(n => {
        tone({ t: at, freq: midi(n), dur: bar + 0.1, type: 'sawtooth', gain: 0.01, filter: 1100, attack: 0.25, detune: -6, out: bus });
        tone({ t: at, freq: midi(n), dur: bar + 0.1, type: 'sawtooth', gain: 0.008, filter: 1100, attack: 0.25, detune: 7, out: bus });
      });
      for (let i = 0; i < 4; i++) {
        const bt = at + i * beat;
        tone({ t: bt, freq: midi(root - 12 + (i % 2 ? 7 : 0)), dur: beat * 0.9, type: 'triangle', gain: 0.05, attack: 0.01, out: bus });
        if (i % 2) noise({ t: bt, dur: 0.12, gain: 0.03, type: 'highpass', freq: 1800, attack: 0.002, out: bus });
        else tone({ t: bt, freq: 120, to: 50, dur: 0.15, type: 'sine', gain: 0.08, attack: 0.002, out: bus });
        tone({ t: bt, freq: midi(lead[i]), dur: beat * 0.9, type: 'square', gain: 0.018, filter: 2400, attack: 0.02, out: bus });
        if (b >= 4) tone({ t: bt, freq: midi(lead[i] + 12), dur: beat * 0.6, type: 'triangle', gain: 0.012, attack: 0.01, out: bus });
      }
    });

    const end = start + leads.length * bar;
    [48, 60, 64, 67, 72].forEach(n => {
      tone({ t: end, freq: midi(n), dur: 3, type: n === 48 ? 'triangle' : 'sawtooth', gain: n === 48 ? 0.05 : 0.01, filter: 1400, attack: 0.05, out: bus });
    });
    tone({ t: end, freq: midi(72), dur: 2.5, type: 'square', gain: 0.018, filter: 2400, attack: 0.02, out: bus });
    arpeggio(end, [72, 76, 79, 84, 88], 0.08, (tt, n) => bell({ t: tt, freq: midi(n), dur: 1.6, gain: 0.03, out: bus }));
    // "…?" (17.2s): a questioning little blip.
    tone({ t: t + 17.2, freq: 500, to: 900, dur: 0.25, type: 'triangle', gain: 0.05, attack: 0.01, out: bus });
  },
  'end-credits-stop': t => {
    sfxCreditsBus?.gain.setTargetAtTime(0, t, 0.08);
    sfxCreditsBus = null;
    ceWhoosh(t, 0.3, 0.04, 2400, 500);
  }
};

// --- Secret Duel Disk mini-game (src/actions/duel-disk-actions.js) ----------

// Kuriboh's "kuri!": a squeaky up-down chirp.
function kuriChirp(t, gain = 0.05, out = sfxOut) {
  const f = rnd(1000, 1300);
  tone({ t, freq: f, to: f * 1.4, dur: 0.07, type: 'triangle', gain, attack: 0.004, out });
  tone({ t: t + 0.08, freq: f * 1.25, to: f * 0.8, dur: 0.1, type: 'triangle', gain, attack: 0.004, out });
}

// A big monster roar: filtered noise breath over two growling saws.
function monsterRoar(t, gain = 0.1, out = sfxOut) {
  noise({ t, dur: 1.1, gain: gain * 1.6, type: 'lowpass', freq: 1400, to: 250, attack: 0.08, out });
  tone({ t, freq: 120, to: 70, dur: 1.1, type: 'sawtooth', gain, filter: [900, 300], q: 3, attack: 0.08, out });
  tone({ t, freq: 178, to: 96, dur: 1.0, type: 'sawtooth', gain: gain * 0.7, filter: [1200, 350], q: 3, attack: 0.1, detune: 12, out });
}

// Hologram projection: a rising shimmer plus a sparkle arpeggio.
function holoRise(t, gain, out) {
  tone({ t, freq: 220, to: 1320, dur: 0.6, type: 'sawtooth', gain: gain * 0.4, filter: [400, 3200], q: 4, attack: 0.05, out });
  tone({ t, freq: 440, to: 2640, dur: 0.55, gain: gain * 0.5, attack: 0.05, out });
  arpeggio(t + 0.25, [79, 83, 86, 91], 0.05, (tt, n) => tone({ t: tt, freq: midi(n), dur: 0.25, type: 'triangle', gain: gain * 0.35, attack: 0.003, out }));
}

const DISK_SOUNDS = {
  // The disk unfolds: a servo whirr, clacking panels, then a power-on chime.
  'disk-boot': t => {
    const room = darkBus({ reverb: 0.2 });
    tone({ t, freq: 90, to: 420, dur: 0.75, type: 'sawtooth', gain: 0.04, filter: [300, 1800], q: 5, attack: 0.05, out: room });
    noise({ t, dur: 0.75, gain: 0.03, freq: 800, to: 2400, q: 3, attack: 0.1, out: room });
    for (let i = 0; i < 6; i++) {
      const at = t + 0.55 + i * 0.07;
      noise({ t: at, dur: 0.025, gain: 0.09, type: 'bandpass', freq: rnd(1800, 3200), q: 6, attack: 0.001, out: room });
      tone({ t: at, freq: 180, to: 90, dur: 0.04, type: 'square', gain: 0.03, filter: 900, attack: 0.001, out: room });
    }
    arpeggio(t + 1.05, [72, 79, 84], 0.08, (tt, n) => tone({ t: tt, freq: midi(n), dur: 0.35, type: 'square', gain: 0.03, filter: 2600, attack: 0.004, out: room }));
  },
  'disk-draw': t => {
    cardFlip(t, 0.12, 3000);
    noise({ t, dur: 0.12, gain: 0.04, type: 'highpass', freq: 2500, to: 5000, attack: 0.01 });
  },
  'disk-shuffle': t => {
    for (let i = 0; i < 16; i++) cardFlip(t + i * 0.035 + rnd(0, 0.01), 0.06, rnd(2200, 3600));
    noise({ t: t + 0.6, dur: 0.08, gain: 0.08, type: 'lowpass', freq: 900, attack: 0.002 });
  },
  // `level` scales the boom; `voice` adds a monster's signature sound.
  'disk-summon': (t, { level = 4, voice } = {}) => {
    const hall = darkBus({ reverb: 0.4 });
    noise({ t, dur: 0.06, gain: 0.08, type: 'lowpass', freq: 1200, attack: 0.002, out: hall });
    holoRise(t + 0.05, 0.06 + level * 0.006, hall);
    if (level >= 5) boom(t + 0.55, 0.15 + (level - 4) * 0.06, hall);
    if (voice === 'kuri') [0.5, 0.75].forEach(o => kuriChirp(t + o, 0.05, hall));
    if (voice === 'roar') monsterRoar(t + 0.55, 0.06 + (level - 6) * 0.02, hall);
    if (voice === 'neigh') neigh(t + 0.5, { gain: 0.05, out: hall });
    if (voice === 'magic') {
      arpeggio(t + 0.55, [64, 67, 70, 73, 76, 79], 0.04, (tt, n) => tone({ t: tt, freq: midi(n), dur: 0.5, type: 'triangle', gain: 0.03, attack: 0.004, out: hall }));
      tone({ t: t + 0.55, freq: 110, dur: 0.9, type: 'sawtooth', gain: 0.04, filter: [300, 1200], attack: 0.1, out: hall });
    }
  },
  'disk-tribute': t => {
    const hall = darkBus({ reverb: 0.5 });
    arpeggio(t, [84, 79, 76, 72], 0.07, (tt, n) => bell({ t: tt, freq: midi(n), dur: 0.6, gain: 0.03, out: hall }));
    noise({ t, dur: 0.5, gain: 0.03, freq: 3000, to: 600, q: 1, attack: 0.05, out: hall });
  },
  'disk-set': t => {
    cardFlip(t, 0.08, 2400);
    tone({ t: t + 0.05, freq: 170, to: 80, dur: 0.1, type: 'triangle', gain: 0.12, attack: 0.002 });
    noise({ t: t + 0.05, dur: 0.05, gain: 0.06, type: 'lowpass', freq: 700, attack: 0.001 });
  },
  'disk-spell': t => {
    const hall = darkBus({ reverb: 0.4 });
    noise({ t, dur: 0.35, gain: 0.04, freq: 800, to: 5000, q: 1.2, attack: 0.05, out: hall });
    arpeggio(t + 0.05, [76, 81, 85, 88, 93], 0.05, (tt, n) => bell({ t: tt, freq: midi(n), dur: 0.7, gain: 0.025, out: hall }));
  },
  // "TRAP CARD!": a sharp orchestral stab.
  'disk-trap': t => {
    const hall = darkBus({ reverb: 0.45 });
    brass({ t, notes: [57, 60, 63, 66], dur: 0.45, gain: 0.05 });
    noise({ t, dur: 0.2, gain: 0.12, type: 'lowpass', freq: 3000, to: 400, attack: 0.002, out: hall });
    boom(t, 0.25, hall);
    cardFlip(t + 0.02, 0.12, 2800);
  },
  'disk-attack': (t, { level = 4 } = {}) => {
    noise({ t, dur: 0.3, gain: 0.08, freq: 400, to: 4000, q: 1.5, attack: 0.04 });
    tone({ t: t + 0.05, freq: 300, to: 1200 + level * 100, dur: 0.25, type: 'sawtooth', gain: 0.03, filter: [800, 4000], q: 3, attack: 0.02 });
  },
  'disk-hit': (t, { amount = 1000 } = {}) => {
    const strength = Math.min(1, 0.3 + amount / 4000);
    boom(t, strength * 0.6);
    noise({ t, dur: 0.15, gain: 0.12 * strength, type: 'bandpass', freq: 900, q: 1.5, attack: 0.001 });
    tone({ t, freq: 520, to: 180, dur: 0.12, type: 'square', gain: 0.03, filter: 2000, attack: 0.001 });
  },
  // The dummy's wooden flail: a creaky wind-up, a whoosh and a thwack.
  'disk-dummy-attack': t => {
    tone({ t, freq: 140, to: 210, dur: 0.25, type: 'sawtooth', gain: 0.025, filter: 700, q: 6, attack: 0.02 });
    noise({ t: t + 0.25, dur: 0.25, gain: 0.08, freq: 3000, to: 500, q: 1.5, attack: 0.05 });
    tone({ t: t + 0.5, freq: 260, to: 120, dur: 0.08, type: 'triangle', gain: 0.12, attack: 0.001 });
    noise({ t: t + 0.5, dur: 0.06, gain: 0.1, type: 'bandpass', freq: 1500, q: 4, attack: 0.001 });
  },
  'disk-hurt': t => {
    boom(t, 0.4);
    tone({ t, freq: 330, to: 110, dur: 0.35, type: 'sawtooth', gain: 0.04, filter: 1200, attack: 0.005 });
  },
  'disk-heal': t => {
    arpeggio(t, [72, 76, 79, 84], 0.06, (tt, n) => tone({ t: tt, freq: midi(n), dur: 0.4, type: 'triangle', gain: 0.05, attack: 0.004 }));
  },
  'disk-graveyard': t => {
    const crypt = darkBus({ reverb: 0.6 });
    tone({ t, freq: 700, to: 140, dur: 0.6, gain: 0.05, attack: 0.02, out: crypt });
    noise({ t, dur: 0.5, gain: 0.03, freq: 2000, to: 300, q: 2, attack: 0.05, out: crypt });
  },
  'disk-error': t => {
    tone({ t, freq: 140, dur: 0.09, type: 'square', gain: 0.04, filter: 900 });
    tone({ t: t + 0.12, freq: 120, dur: 0.12, type: 'square', gain: 0.04, filter: 900 });
  },
  'disk-turn': t => {
    tone({ t, freq: midi(76), dur: 0.08, type: 'square', gain: 0.03, filter: 3000 });
    tone({ t: t + 0.09, freq: midi(83), dur: 0.14, type: 'square', gain: 0.03, filter: 3000 });
  },
  'disk-kuriboh': t => {
    const room = darkBus({ reverb: 0.25 });
    for (let i = 0; i < 12; i++) kuriChirp(t + i * 0.09 + rnd(0, 0.03), 0.035, room);
    boing(t + 1.1, { from: 200, to: 500, dur: 0.3, gain: 0.05, out: room });
  },
  // Time Wizard: a roulette ticking down, then a ding or a buzz (decided in
  // the game, so this just ticks; the hit/miss follows as disk-hit/hurt).
  'disk-roulette': t => {
    let at = t;
    for (let i = 0; i < 14; i++) {
      tone({ t: at, freq: i % 2 ? 1800 : 1500, dur: 0.025, type: 'square', gain: 0.025, filter: 4000, attack: 0.001 });
      at += 0.04 + i * 0.009;
    }
  },
  'disk-negate': t => {
    bell({ t, freq: 880, dur: 0.8, gain: 0.05 });
    noise({ t, dur: 0.25, gain: 0.05, freq: 2500, to: 800, q: 3, attack: 0.002 });
  },
  'disk-fall': t => {
    const pit = darkBus({ reverb: 0.7, echo: 0.3 });
    slideWhistle({ t, freqs: [1400, 800, 250], dur: 0.7, gain: 0.05, wobble: 6, out: pit });
    boom(t + 0.75, 0.3, pit);
  },
  'disk-climb': t => {
    for (let i = 0; i < 4; i++) tone({ t: t + i * 0.18, freq: 200 + i * 40, to: 240 + i * 40, dur: 0.1, type: 'triangle', gain: 0.05, attack: 0.005 });
    slideWhistle({ t: t + 0.8, freqs: [300, 160], dur: 0.35, gain: 0.03 });
  },
  'disk-win': t => {
    brass({ t, notes: [60, 64, 67], dur: 0.16, gain: 0.05 });
    brass({ t: t + 0.18, notes: [60, 64, 67], dur: 0.16, gain: 0.05 });
    brass({ t: t + 0.36, notes: [65, 69, 72], dur: 0.16, gain: 0.05 });
    brass({ t: t + 0.56, notes: [67, 72, 76, 79], dur: 1.1, gain: 0.05 });
    arpeggio(t + 0.56, [84, 88, 91, 96], 0.06, (tt, n) => bell({ t: tt, freq: midi(n), dur: 1, gain: 0.025 }));
  },
  'disk-lose': t => {
    const room = darkBus({ reverb: 0.5 });
    [[62, 0], [61, 0.35], [60, 0.7]].forEach(([n, o]) => tone({ t: t + o, freq: midi(n), dur: 0.32, type: 'sawtooth', gain: 0.04, filter: 1400, attack: 0.02, out: room }));
    slideWhistle({ t: t + 1.05, freqs: [midi(59), midi(52)], dur: 1, gain: 0.05, wobble: 5, out: room });
  }
};

// Tournament: draw drumroll, slot-machine ticks, landing slams, winner
// stings and the champion fanfare.
const TOURNAMENT_SOUNDS = {
  'tn-draw': t => {
    const room = darkBus({ reverb: 0.3 });
    for (let i = 0; i < 18; i++) {
      noise({ t: t + i * 0.045, dur: 0.05, gain: 0.02 + i * 0.003, type: 'bandpass', freq: 1800, q: 1.2, attack: 0.002, out: room });
    }
    tone({ t: t + 0.8, freq: 110, to: 60, dur: 0.3, gain: 0.12, attack: 0.003, out: room });
    cardFlip(t + 0.15, 0.08);
    cardFlip(t + 0.4, 0.08, 2200);
  },
  // progress 0..1: the ticks drop in pitch as the wheel slows down.
  'tn-tick': (t, { progress = 0 }) => {
    tone({ t, freq: 2400 - progress * 1100, dur: 0.02, type: 'square', gain: 0.018, filter: 4000, attack: 0.001 });
  },
  'tn-land': t => {
    const room = darkBus({ reverb: 0.25 });
    tone({ t, freq: 140, to: 55, dur: 0.25, gain: 0.16, attack: 0.002, out: room });
    noise({ t, dur: 0.12, gain: 0.08, type: 'lowpass', freq: 1800, to: 300, attack: 0.002, out: room });
    arpeggio(t + 0.05, [76, 83], 0.07, (tt, n) => bell({ t: tt, freq: midi(n), dur: 0.7, gain: 0.03, out: room }));
  },
  'tn-draw-done': t => {
    const room = darkBus({ reverb: 0.4 });
    arpeggio(t, [67, 72, 76, 79], 0.08, (tt, n) => bell({ t: tt, freq: midi(n), dur: 0.9, gain: 0.03, out: room }));
  },
  'tn-start': t => {
    const room = darkBus({ reverb: 0.4 });
    brass({ t, notes: [60, 67], dur: 0.22, gain: 0.05 });
    brass({ t: t + 0.24, notes: [60, 67], dur: 0.12, gain: 0.05 });
    brass({ t: t + 0.38, notes: [65, 72], dur: 0.6, gain: 0.06 });
    boom(t + 0.38, 0.5, room);
  },
  'tn-win': t => {
    const room = darkBus({ reverb: 0.35 });
    tone({ t, freq: 900, to: 1800, dur: 0.12, type: 'triangle', gain: 0.05, attack: 0.003 });
    arpeggio(t + 0.08, [72, 76, 79, 84], 0.06, (tt, n) => bell({ t: tt, freq: midi(n), dur: 0.8, gain: 0.03, out: room }));
    [0.2, 0.3, 0.4].forEach(o => coinClink(t + o, 0.025));
  },
  'tn-undo': t => {
    tone({ t, freq: 900, to: 400, dur: 0.16, type: 'triangle', gain: 0.05, attack: 0.003 });
    cardFlip(t + 0.05, 0.06, 1800);
  },
  // Drumroll -> "da-da-da DAAA" fanfare -> bells and coins.
  'tn-champion': t => {
    const room = darkBus({ reverb: 0.55 });
    for (let i = 0; i < 16; i++) {
      noise({ t: t + i * 0.04, dur: 0.045, gain: 0.025 + i * 0.003, type: 'bandpass', freq: 1500, q: 1.1, attack: 0.002, out: room });
    }
    const f = t + 0.7;
    brass({ t: f, notes: [60, 64, 67], dur: 0.16, gain: 0.05 });
    brass({ t: f + 0.18, notes: [60, 64, 67], dur: 0.16, gain: 0.05 });
    brass({ t: f + 0.36, notes: [60, 64, 67], dur: 0.16, gain: 0.05 });
    brass({ t: f + 0.56, notes: [65, 69, 72], dur: 0.4, gain: 0.055 });
    brass({ t: f + 1.0, notes: [67, 71, 74], dur: 0.3, gain: 0.055 });
    brass({ t: f + 1.32, notes: [72, 76, 79, 84], dur: 1.6, gain: 0.06 });
    boom(f + 1.32, 0.7, room);
    arpeggio(f + 1.4, [84, 88, 91, 96, 91, 96], 0.1, (tt, n) => bell({ t: tt, freq: midi(n), dur: 1.2, gain: 0.025, out: room }));
    for (let i = 0; i < 12; i++) coinClink(f + 1.5 + rnd(0, 1.4), 0.02);
  },
  // Kuriboh Multiply (6.2s): spell card, doubling "kuri!" chirps, the giant
  // Kuriboh's roar, then everyone pops.
  'tn-kuriboh-multiply': t => {
    const room = darkBus({ reverb: 0.35 });
    cardFlip(t, 0.12, 2200);
    ceWhoosh(t, 0.4, 0.05, 400, 2400, room);
    arpeggio(t + 0.35, [72, 76, 79, 84], 0.08, (tt, n) => bell({ t: tt, freq: midi(n), dur: 0.8, gain: 0.03, out: room }));
    [0.9, 1.5, 1.95, 2.3, 2.6, 2.85, 3.05].forEach((w, k) => {
      const count = Math.min(2 ** k, 9);
      for (let i = 0; i < count; i++) kuriChirp(t + w + (k ? rnd(0, 0.22) : 0), 0.045 - k * 0.003, room);
    });
    for (let i = 0; i < 18; i++) kuriChirp(t + 3.2 + rnd(0, 0.9), 0.025, room);
    tone({ t: t + 4.3, freq: 140, to: 260, dur: 0.35, type: 'sawtooth', gain: 0.08, filter: 1100, attack: 0.02, out: room });
    tone({ t: t + 4.65, freq: 260, to: 120, dur: 0.6, type: 'sawtooth', gain: 0.08, filter: 1100, attack: 0.02, out: room });
    boom(t + 4.35, 0.5, room);
    for (let i = 0; i < 14; i++) {
      noise({ t: t + 4.85 + rnd(0, 0.35), dur: 0.05, gain: 0.06, type: 'highpass', freq: 1800, attack: 0.002, out: room });
    }
    kuriChirp(t + 5.5, 0.05, room);
  },
  // Rock-paper-scissors at 2: pop-out, "?", shrug, three pumps, reveal.
  'tn-rps-win': t => {
    const room = rpsIntroSound(t);
    arpeggio(t + 3.35, [72, 76, 79, 84], 0.09, (tt, n) => bell({ t: tt, freq: midi(n), dur: 0.8, gain: 0.035, out: room }));
    brass({ t: t + 3.75, notes: [72, 76, 79], dur: 0.5, gain: 0.04 });
    slideWhistle({ t: t + 3.5, freqs: [900, 300], dur: 0.45, gain: 0.03 });
  },
  'tn-rps-tie': t => {
    const room = rpsIntroSound(t);
    [58, 57, 56, 55].forEach((n, i) => tone({ t: t + 3.35 + i * 0.3, freq: midi(n), to: i === 3 ? midi(53) : undefined, dur: i === 3 ? 0.7 : 0.26, type: 'sawtooth', gain: 0.04, filter: 900, attack: 0.02, out: room }));
  },
  // Ten star chips (6s): whoosh + clink, rising a note each, then the full
  // glove sparkles and the castle gates creak open.
  'tn-star-chips': t => {
    const room = darkBus({ reverb: 0.5 });
    const scale = [72, 74, 76, 77, 79, 81, 83, 84, 86, 88];
    scale.forEach((n, i) => {
      const land = t + 0.4 + i * 0.33 + 0.38;
      ceWhoosh(land - 0.3, 0.28, 0.025, 700, 2600, room);
      coinClink(land, 0.05);
      bell({ t: land, freq: midi(n), dur: 0.6, gain: 0.03, out: room });
    });
    healSparkles(t + 3.8, 0.5, 8, room);
    tone({ t: t + 3.95, freq: 70, to: 52, dur: 0.75, type: 'sawtooth', gain: 0.05, filter: 500, q: 4, attack: 0.05, out: room });
    noise({ t: t + 3.95, dur: 0.75, gain: 0.05, type: 'bandpass', freq: 350, to: 220, q: 3, attack: 0.05, out: room });
    boom(t + 4.6, 0.5, room);
    chord({ t: t + 4.5, notes: [60, 64, 67, 72], dur: 1.4, gain: 0.025, type: 'triangle', attack: 0.25, filter: 2400 });
  },
  // Penalty Game, part 1 (dice-duel-egg.js): a rumbling dark drone, glowing
  // eyes, growled threats, a booming laugh, and his die clattering to a 6.
  'tn-dice-intro': t => {
    const cave = darkBus({ reverb: 0.7, echo: 0.2 });
    darkCluster({ t, notes: [31, 32, 38], dur: 7, gain: 0.035, attack: 1.2, filter: [150, 600], out: cave });
    boom(t + 0.3, 0.6, cave);
    [76, 77].forEach(n => tone({ t: t + 1.5, freq: midi(n), to: midi(n - 3), dur: 0.9, type: 'triangle', gain: 0.02, attack: 0.01, out: cave }));
    [1.9, 2.7].forEach(at => tone({ t: t + at, freq: 75, to: 58, dur: 0.6, type: 'sawtooth', gain: 0.05, filter: 420, q: 3, attack: 0.05, out: cave }));
    bell({ t: t + 3.1, freq: midi(38), dur: 2.5, gain: 0.12, out: cave });
    bruteLaugh(t + 3.7, 6, 0.07, cave);
    diceRattle(t + 5.0, 0.8, 0.05, cave);
    diceThud(t + 5.45, 0.08, cave);
    diceThud(t + 5.8, 0.12, cave);
    brass({ t: t + 5.9, notes: [38, 45, 50], dur: 0.7, gain: 0.05 });
    tone({ t: t + 6.0, freq: 80, to: 62, dur: 0.5, type: 'sawtooth', gain: 0.05, filter: 420, q: 3, attack: 0.04, out: cave });
    bruteLaugh(t + 6.6, 3, 0.045, cave);
    [6.9, 7.7, 8.5, 9.3, 10.1].forEach(at => heartbeat(t + at, 0.18));
  },
  // Part 2, from the player's tap: the roll lands on 1, a mocking chuckle,
  // tension, CRACK, a heroic hit for the 7, "wha...", the Penalty Game bell,
  // and a Shadow Realm vortex that slams shut on him.
  'tn-dice-roll': t => {
    const cave = darkBus({ reverb: 0.7, echo: 0.2 });
    diceRattle(t, 1.0, 0.05, cave);
    diceThud(t + 0.55, 0.08, cave);
    diceThud(t + 1.0, 0.12, cave);
    tone({ t: t + 1.05, freq: midi(50), to: midi(45), dur: 0.8, type: 'triangle', gain: 0.04, attack: 0.01, out: cave });
    bruteLaugh(t + 1.4, 3, 0.05, cave);
    for (let i = 0; i < 17; i++) {
      tone({ t: t + 2.0 + i * 0.1, freq: midi(i % 2 ? 63 : 62), dur: 0.09, type: 'sawtooth', gain: 0.01 + i * 0.002, filter: 1400, attack: 0.01, out: cave });
    }
    dieCrack(t + 2.95, 0.5);
    dieCrack(t + 3.3, 0.8);
    const split = t + 3.7;
    dieCrack(split, 1.4);
    boom(split, 1, cave);
    chord({ t: split + 0.02, notes: [62, 66, 69, 74], dur: 1.6, gain: 0.03, type: 'sawtooth', attack: 0.01, filter: 3000 });
    bell({ t: split + 0.05, freq: midi(86), dur: 1.5, gain: 0.05, out: cave });
    tone({ t: t + 5.3, freq: 240, to: 140, dur: 0.6, type: 'sawtooth', gain: 0.05, filter: [1400, 500], q: 4, attack: 0.02, out: cave });
    bell({ t: t + 6.3, freq: midi(45), dur: 3, gain: 0.12, out: cave });
    eyeHum(t + 6.3, 1.5, 0.05, cave);
    const swirl = t + 7.2;
    tone({ t: swirl, freq: 900, to: 45, dur: 2, type: 'sawtooth', gain: 0.045, attack: 0.3, filter: [3000, 150], out: cave });
    noise({ t: swirl, dur: 2, gain: 0.1, freq: 4000, to: 120, q: 4, attack: 1.4, out: cave });
    tone({ t: swirl + 0.3, freq: 520, to: 90, dur: 1.6, type: 'sawtooth', gain: 0.03, filter: 1500, attack: 0.05, out: cave });
    shadowWhispers(swirl, 2, 8, cave);
    const slam = t + 9.2;
    boom(slam, 1.2, cave);
    tone({ t: slam, freq: 70, to: 25, dur: 2.5, gain: 0.3, attack: 0.003 });
    bell({ t: slam + 0.2, freq: midi(38), dur: 3.5, gain: 0.18, out: cave });
    darkCluster({ t: slam + 0.3, notes: [57, 60, 63, 64], dur: 2.4, gain: 0.016, attack: 0.8, filter: [600, 2200], out: cave });
  }
};

// A deep, booming "HA HA HA" for the Penalty Game brute.
function bruteLaugh(t, count, gain, out) {
  for (let i = 0; i < count; i++) {
    const at = t + i * 0.24;
    const f = 105 - i * 3;
    tone({ t: at, freq: f * 1.15, to: f * 0.85, dur: 0.2, type: 'sawtooth', gain, filter: [900, 500], q: 3, attack: 0.015, out });
    tone({ t: at, freq: f * 0.58, to: f * 0.5, dur: 0.2, type: 'square', gain: gain * 0.4, filter: 400, attack: 0.015, out });
    noise({ t: at, dur: 0.12, gain: gain * 0.5, freq: 650, to: 450, q: 4, attack: 0.01, out });
  }
}

function diceRattle(t, dur, gain, out) {
  const count = Math.round(dur / 0.06);
  for (let i = 0; i < count; i++) {
    const at = t + (i * dur) / count + rnd(0, 0.02);
    noise({ t: at, dur: 0.03, gain: gain * rnd(0.5, 1), freq: rnd(2500, 4500), q: 6, attack: 0.002, out });
    tone({ t: at, freq: rnd(900, 1500), dur: 0.03, type: 'triangle', gain: gain * 0.4, attack: 0.002, out });
  }
}

function diceThud(t, gain, out) {
  tone({ t, freq: 160, to: 70, dur: 0.15, gain, attack: 0.003, out });
  noise({ t, dur: 0.06, gain: gain * 0.6, type: 'lowpass', freq: 900, attack: 0.002, out });
}

function dieCrack(t, strength) {
  noise({ t, dur: 0.05 + strength * 0.12, gain: 0.12 * strength, type: 'highpass', freq: 3000, to: 1500, attack: 0.001 });
  tone({ t, freq: 2400, to: 500, dur: 0.05, type: 'square', gain: 0.03 * strength, attack: 0.001 });
}

function rpsIntroSound(t) {
  const room = darkBus({ reverb: 0.3 });
  tone({ t: t + 0.05, freq: 400, to: 900, dur: 0.08, type: 'triangle', gain: 0.06, attack: 0.003 });
  tone({ t: t + 0.15, freq: 450, to: 1000, dur: 0.08, type: 'triangle', gain: 0.06, attack: 0.003 });
  boing(t + 0.6, { from: 200, to: 500, dur: 0.3, gain: 0.05, out: room });
  slideWhistle({ t: t + 1.1, freqs: [500, 800, 500], dur: 0.5, gain: 0.03, out: room });
  [2.09, 2.475, 2.86].forEach(o => {
    tone({ t: t + o, freq: 170, to: 80, dur: 0.1, gain: 0.08, attack: 0.002, out: room });
    noise({ t: t + o, dur: 0.06, gain: 0.05, type: 'lowpass', freq: 1200, attack: 0.002, out: room });
  });
  bell({ t: t + 3.19, freq: midi(88), dur: 0.8, gain: 0.04, out: room });
  return room;
}

// Co-op Boss (Pegasus): cartoon Toons, an eerie Millennium Eye and his
// trademark giggle.
function pegasusLaugh(t, out) {
  ceGiggle(t, 520, 5, out, 'triangle');
  ceGiggle(t + 0.6, 600, 4, out, 'triangle');
}

function eyeHum(t, dur, gain, out) {
  [0, 7, 13].forEach((d, i) => tone({ t, freq: midi(50 + d), dur, type: 'sine', gain: gain / (i + 1), attack: dur * 0.3, detune: rnd(-12, 12), out }));
}

const COOP_SOUNDS = {
  'co-start': t => {
    const room = darkBus({ reverb: 0.6 });
    eyeHum(t, 1.6, 0.06, room);
    boom(t + 0.2, 0.5, room);
    arpeggio(t + 0.5, [62, 65, 69, 74], 0.12, (tt, n) => bell({ t: tt, freq: midi(n), dur: 1, gain: 0.03, out: room }));
    pegasusLaugh(t + 1.2, room);
  },
  'co-turn': t => {
    tone({ t, freq: 880, to: 1320, dur: 0.12, type: 'triangle', gain: 0.04, attack: 0.004 });
  },
  'co-boss-turn': t => {
    const room = darkBus({ reverb: 0.5 });
    eyeHum(t, 0.9, 0.05, room);
    tone({ t, freq: midi(50), to: midi(46), dur: 0.7, type: 'sawtooth', gain: 0.04, filter: 900, attack: 0.05, out: room });
  },
  'co-toon': t => {
    slideWhistle({ t, freqs: [700, 1500, 500], dur: 0.35, gain: 0.04 });
    boing(t + 0.3, { from: 160, to: 420, dur: 0.3, gain: 0.07 });
    noise({ t: t + 0.45, dur: 0.12, gain: 0.08, type: 'lowpass', freq: 1500, to: 200, attack: 0.002 });
  },
  'co-barrel': t => {
    const room = darkBus({ reverb: 0.3 });
    [0, 0.28, 0.56].forEach(o => {
      noise({ t: t + o, dur: 0.15, gain: 0.12, type: 'lowpass', freq: 2500, to: 150, attack: 0.002, out: room });
      tone({ t: t + o, freq: 160, to: 50, dur: 0.18, gain: 0.1, attack: 0.002, out: room });
    });
  },
  'co-summon': t => {
    slideWhistle({ t, freqs: [400, 1600], dur: 0.3, gain: 0.04 });
    tone({ t: t + 0.32, freq: 1200, to: 300, dur: 0.06, type: 'square', gain: 0.03, filter: 3000, attack: 0.001 });
    ceGiggle(t + 0.45, 700, 4);
  },
  'co-laugh': t => pegasusLaugh(t, darkBus({ reverb: 0.4 })),
  'co-hit': t => {
    const room = darkBus({ reverb: 0.25 });
    ceWhoosh(t, 0.18, 0.05, 600, 3000, room);
    boom(t + 0.15, 0.45, room);
    noise({ t: t + 0.15, dur: 0.1, gain: 0.08, type: 'highpass', freq: 2500, attack: 0.002, out: room });
  },
  'co-squash': t => {
    tone({ t, freq: 600, to: 120, dur: 0.18, type: 'triangle', gain: 0.08, attack: 0.002 });
    noise({ t, dur: 0.15, gain: 0.08, type: 'lowpass', freq: 1200, to: 150, attack: 0.002 });
    boing(t + 0.2, { from: 120, to: 300, dur: 0.35, gain: 0.06 });
    ceGiggle(t + 0.5, 1100, 3);
  },
  'co-destroy': t => {
    const room = darkBus({ reverb: 0.35 });
    boom(t, 0.6, room);
    for (let i = 0; i < 6; i++) bell({ t: t + 0.05 + i * 0.04, freq: rnd(1800, 4200), dur: 0.3, gain: 0.02, out: room });
    noise({ t, dur: 0.4, gain: 0.08, type: 'highpass', freq: 3000, to: 800, attack: 0.002, out: room });
  },
  'co-bounce': t => {
    boing(t, { from: 220, to: 90, dur: 0.4, gain: 0.08 });
    tone({ t: t + 0.05, freq: 300, to: 200, dur: 0.15, type: 'square', gain: 0.025, filter: 1200, attack: 0.002 });
  },
  'co-page': t => {
    noise({ t, dur: 0.28, gain: 0.12, type: 'bandpass', freq: 1800, to: 5000, q: 0.8, attack: 0.01 });
    noise({ t: t + 0.05, dur: 0.2, gain: 0.06, type: 'highpass', freq: 3000, attack: 0.005 });
  },
  'co-book': t => {
    const room = darkBus({ reverb: 0.5 });
    noise({ t, dur: 0.12, gain: 0.15, type: 'lowpass', freq: 1500, to: 100, attack: 0.002, out: room });
    boom(t, 0.8, room);
    arpeggio(t + 0.3, [74, 70, 67, 62], 0.1, (tt, n) => tone({ t: tt, freq: midi(n), dur: 0.25, type: 'triangle', gain: 0.04, attack: 0.005, out: room }));
  },
  'co-hurt': t => {
    tone({ t, freq: 220, to: 70, dur: 0.3, type: 'sawtooth', gain: 0.06, filter: 900, attack: 0.002 });
    noise({ t, dur: 0.12, gain: 0.07, type: 'lowpass', freq: 900, attack: 0.002 });
  },
  'co-heal': t => {
    arpeggio(t, [72, 76, 79, 84], 0.05, (tt, n) => bell({ t: tt, freq: midi(n), dur: 0.6, gain: 0.03 }));
  },
  'co-negate': t => {
    const room = darkBus({ reverb: 0.4 });
    tone({ t, freq: 300, to: 1200, dur: 0.25, type: 'sawtooth', gain: 0.04, filter: [600, 4000], attack: 0.01, out: room });
    bell({ t: t + 0.2, freq: midi(88), dur: 0.8, gain: 0.04, out: room });
    noise({ t: t + 0.2, dur: 0.3, gain: 0.05, type: 'highpass', freq: 4000, attack: 0.005, out: room });
  },
  'co-shield': t => {
    const room = darkBus({ reverb: 0.4 });
    chord({ t, notes: [67, 71, 74], dur: 0.6, gain: 0.025, attack: 0.02, filter: 2400 });
    bell({ t: t + 0.05, freq: midi(83), dur: 0.9, gain: 0.03, out: room });
  },
  'co-bond': t => {
    const room = darkBus({ reverb: 0.4 });
    arpeggio(t, [79, 86, 91], 0.07, (tt, n) => bell({ t: tt, freq: midi(n), dur: 0.9, gain: 0.03, out: room }));
  },
  'co-revive': t => {
    const room = darkBus({ reverb: 0.6 });
    healSparkles(t, 0.8, 10, room);
    chord({ t, notes: [60, 64, 67, 72], dur: 1.2, gain: 0.02, attack: 0.2, filter: 2600 });
  },
  'co-eye': t => {
    const room = darkBus({ reverb: 0.7, echo: 0.2 });
    eyeHum(t, 1.1, 0.06, room);
    tone({ t: t + 0.1, freq: midi(86), to: midi(85), dur: 0.9, type: 'sine', gain: 0.02, attack: 0.2, out: room });
  },
  'co-eye-open': t => {
    const room = darkBus({ reverb: 0.5 });
    tone({ t, freq: 200, to: 1600, dur: 0.3, type: 'triangle', gain: 0.05, attack: 0.01, out: room });
    bell({ t: t + 0.28, freq: midi(91), dur: 0.8, gain: 0.04, out: room });
  },
  'co-restrict': t => {
    const room = darkBus({ reverb: 0.5 });
    eyeHum(t, 1, 0.05, room);
    for (let i = 0; i < 5; i++) tone({ t: t + i * 0.09, freq: midi(74 - i * 3), dur: 0.12, type: 'square', gain: 0.02, filter: 2000, attack: 0.004, out: room });
    boom(t + 0.45, 0.35, room);
  },
  'co-tick': t => {
    const room = darkBus({ reverb: 0.4 });
    [0, 0.5].forEach(o => tone({ t: t + o, freq: o ? 1000 : 1400, dur: 0.05, type: 'square', gain: 0.03, filter: 3000, attack: 0.001, out: room }));
    bell({ t: t + 0.9, freq: midi(57), dur: 1.4, gain: 0.05, out: room });
  },
  'co-seal': t => {
    const room = darkBus({ reverb: 0.6 });
    ceWhoosh(t, 0.6, 0.06, 3000, 300, room);
    cardFlip(t + 0.55, 0.12);
    bell({ t: t + 0.6, freq: midi(45), dur: 2, gain: 0.08, out: room });
    pegasusLaugh(t + 1, room);
  },
  'co-fate': t => {
    cardFlip(t, 0.1);
    cardFlip(t + 0.12, 0.08, 2200);
    bell({ t: t + 0.25, freq: midi(81), dur: 0.9, gain: 0.035, out: darkBus({ reverb: 0.4 }) });
  },
  'co-signal': t => {
    tone({ t, freq: 1320, dur: 0.07, type: 'sine', gain: 0.05, attack: 0.003 });
    tone({ t: t + 0.09, freq: 1760, dur: 0.1, type: 'sine', gain: 0.05, attack: 0.003 });
  },
  'co-caught': t => {
    tone({ t, freq: 140, dur: 0.45, type: 'sawtooth', gain: 0.07, filter: 1200, attack: 0.005 });
    tone({ t, freq: 147, dur: 0.45, type: 'square', gain: 0.04, filter: 1000, attack: 0.005 });
  },
  'co-stage': t => {
    const room = darkBus({ reverb: 0.7 });
    laserCharge({ t, dur: 0.8, from: 80, to: 1800, gain: 0.04, out: room });
    boom(t + 0.8, 0.9, room);
    brass({ t: t + 0.8, notes: [50, 57, 62], dur: 1.1, gain: 0.05 });
    pegasusLaugh(t + 1.3, room);
  },
  'co-victory': t => {
    const room = darkBus({ reverb: 0.55 });
    noise({ t, dur: 0.5, gain: 0.1, type: 'highpass', freq: 2500, to: 600, attack: 0.002, out: room });
    boom(t, 0.8, room);
    const f = t + 0.5;
    brass({ t: f, notes: [60, 64, 67], dur: 0.18, gain: 0.05 });
    brass({ t: f + 0.2, notes: [60, 64, 67], dur: 0.18, gain: 0.05 });
    brass({ t: f + 0.4, notes: [65, 69, 72], dur: 0.3, gain: 0.055 });
    brass({ t: f + 0.75, notes: [72, 76, 79, 84], dur: 1.6, gain: 0.06 });
    healSparkles(f + 0.8, 1.4, 14, room);
  },
  'co-defeat': t => {
    const room = darkBus({ reverb: 0.7 });
    [64, 61, 58, 52].forEach((n, i) => tone({ t: t + i * 0.4, freq: midi(n), dur: 0.6, type: 'sawtooth', gain: 0.04, filter: 1200, attack: 0.03, out: room }));
    bell({ t: t + 1.7, freq: midi(40), dur: 2.5, gain: 0.08, out: room });
    pegasusLaugh(t + 2, room);
  },
  // Start-screen eggs. Invitation (6s): envelope whoosh, seal crack, paper,
  // VHS click, music box, Pegasus giggle, star chips, CRT off.
  'egg-invitation': t => {
    const room = darkBus({ reverb: 0.45 });
    ceWhoosh(t, 0.6, 0.06, 300, 2200, room);
    noise({ t: t + 0.65, dur: 0.12, gain: 0.08, type: 'lowpass', freq: 900, to: 200, attack: 0.002, out: room });
    eyeHum(t + 0.7, 0.6, 0.04, room);
    noise({ t: t + 1.2, dur: 0.06, gain: 0.12, type: 'highpass', freq: 2500, attack: 0.001, out: room });
    tone({ t: t + 1.2, freq: 700, to: 200, dur: 0.08, type: 'square', gain: 0.03, filter: 2000, attack: 0.001, out: room });
    cardFlip(t + 1.35, 0.1, 1600);
    cardFlip(t + 1.7, 0.08, 2200);
    tone({ t: t + 2.1, freq: 1200, dur: 0.03, type: 'square', gain: 0.04, attack: 0.001 });
    noise({ t: t + 2.15, dur: 0.5, gain: 0.03, type: 'bandpass', freq: 3000, q: 0.7, attack: 0.05 });
    arpeggio(t + 2.4, [79, 83, 86, 91, 86, 83, 88, 91], 0.16, (tt, n) => bell({ t: tt, freq: midi(n), dur: 0.7, gain: 0.025, out: room }));
    pegasusLaugh(t + 3.4, room);
    for (let i = 0; i < 14; i++) coinClink(t + 4.4 + rnd(0, 1.1), 0.025);
    tone({ t: t + 5.4, freq: 2400, to: 80, dur: 0.3, type: 'sine', gain: 0.05, attack: 0.002 });
  },
  // Friendship Sign (5.5s): four hand pats, a squeaky marker, then a warm
  // swell with bells.
  'egg-friendship': t => {
    const room = darkBus({ reverb: 0.5 });
    [0.25, 0.55, 0.85, 1.15].forEach((o, i) => {
      ceWhoosh(t + o - 0.15, 0.18, 0.03, 500, 1600, room);
      noise({ t: t + o, dur: 0.07, gain: 0.09, type: 'bandpass', freq: 900 + i * 120, q: 1.2, attack: 0.002, out: room });
      tone({ t: t + o, freq: 180 + i * 20, to: 90, dur: 0.08, gain: 0.05, attack: 0.002, out: room });
    });
    for (let i = 0; i < 14; i++) {
      const s = t + 1.65 + i * 0.09 + rnd(0, 0.03);
      tone({ t: s, freq: rnd(1700, 2300), to: rnd(1500, 2600), dur: 0.07, type: 'sawtooth', gain: 0.012, filter: 3500, attack: 0.005 });
      noise({ t: s, dur: 0.07, gain: 0.015, type: 'highpass', freq: 4000, attack: 0.005 });
    }
    const f = t + 3.1;
    chord({ t: f, notes: [60, 64, 67, 72], dur: 2.2, gain: 0.025, type: 'triangle', attack: 0.3, filter: 2500 });
    arpeggio(f, [72, 76, 79, 84, 79, 84, 88], 0.13, (tt, n) => bell({ t: tt, freq: midi(n), dur: 1.2, gain: 0.03, out: room }));
    healSparkles(f + 0.6, 1.4, 10, room);
  },
  // Pharaoh hold: "His true name" (true-name-egg.js). Hijaz scale on D.
  'atn-open': t => {
    const tomb = darkBus({ reverb: 0.8, echo: 0.2 });
    noise({ t, dur: 1.6, gain: 0.14, type: 'lowpass', freq: 300, to: 120, attack: 0.05, out: tomb });
    boom(t, 0.9, tomb);
    [0, 0.45, 0.7, 1.15].forEach((o, i) => frameDrum(t + 0.3 + o, i % 2 === 0, tomb));
    [62, 63, 66, 67, 69].forEach((n, i) => ney(t + 0.7 + i * 0.32, n, i === 4 ? 1.3 : 0.38, 0.03, tomb));
    bell({ t: t + 2.1, freq: midi(50), dur: 2.5, gain: 0.08, out: tomb });
  },
  'atn-key': t => {
    const f = rnd(1500, 2100);
    noise({ t, dur: 0.04, gain: 0.07, freq: f, q: 3, attack: 0.001 });
    tone({ t, freq: rnd(520, 640), to: 260, dur: 0.06, type: 'triangle', gain: 0.05, attack: 0.002 });
  },
  'atn-wrong': t => {
    const tomb = darkBus({ reverb: 0.7 });
    noise({ t, dur: 0.9, gain: 0.08, type: 'highpass', freq: 5000, to: 1200, attack: 0.01, out: tomb });
    tone({ t, freq: 140, to: 70, dur: 0.5, type: 'sawtooth', gain: 0.04, filter: 500, attack: 0.01, out: tomb });
    [69, 67, 66, 63, 62].forEach((n, i) => ney(t + 0.35 + i * 0.3, n, i === 4 ? 1.1 : 0.34, 0.025, tomb));
    bell({ t: t + 1.6, freq: midi(38), dur: 2, gain: 0.07, out: tomb });
  },
  'atn-named': t => {
    const hall = darkBus({ reverb: 0.8, echo: 0.25 });
    boom(t, 1, hall);
    noise({ t, dur: 1.2, gain: 0.08, type: 'highpass', freq: 2500, to: 8000, attack: 0.3, out: hall });
    choir({ t: t + 0.2, notes: [50, 62, 66, 69], dur: 4.2, gain: 0.011, attack: 0.8, out: hall });
    [0, 0.3, 0.45, 0.75, 1.05, 1.2, 1.5, 1.8, 1.95, 2.25].forEach((o, i) => frameDrum(t + 0.4 + o, i % 3 === 0, hall));
    [[74, 0.4], [75, 0.2], [78, 0.2], [79, 0.4], [81, 0.3], [79, 0.2], [78, 0.2], [75, 0.2], [74, 1.2]]
      .reduce((at, [n, d]) => { ney(t + at, n, d, 0.03, hall); return at + d; }, 0.6);
    arpeggio(t + 3.6, [74, 78, 81, 86, 90], 0.09, (tt, n) => bell({ t: tt, freq: midi(n), dur: 1.4, gain: 0.035, out: hall }));
    chord({ t: t + 3.6, notes: [62, 66, 69, 74], dur: 2.4, gain: 0.025, type: 'triangle', attack: 0.2, filter: 2600 });
    healSparkles(t + 3.6, 1.8, 14, hall);
  },
  // Spelling MATHIAS on the stone keyboard: the Eye winks, then the
  // architect's scroll unrolls (true-name-egg.js).
  'atn-architect': t => {
    const hall = darkBus({ reverb: 0.75, echo: 0.2 });
    eyeHum(t, 1.6, 0.05, hall);
    tone({ t: t + 0.35, freq: 1800, to: 2600, dur: 0.12, type: 'sine', gain: 0.04, out: hall });
    bell({ t: t + 0.45, freq: midi(86), dur: 1.4, gain: 0.04, out: hall });
    [62, 66, 69, 74].forEach((n, i) => ney(t + 0.7 + i * 0.28, n, i === 3 ? 1 : 0.3, 0.025, hall));
    noise({ t: t + 1.9, dur: 0.9, gain: 0.06, freq: 2200, to: 900, q: 0.8, attack: 0.05, out: hall });
    chord({ t: t + 2.1, notes: [62, 66, 69, 74], dur: 2.6, gain: 0.02, type: 'triangle', attack: 0.4, filter: 2200 });
    arpeggio(t + 2.1, [74, 78, 81, 86], 0.11, (tt, n) => bell({ t: tt, freq: midi(n), dur: 1.2, gain: 0.03, out: hall }));
  },
  // Family names on the stone keyboard (name-eggs.js), timed to effects.css.
  'name-theodor': t => {
    const hall = darkBus({ reverb: 0.6 });
    eyeHum(t, 1, 0.04, hall);
    [1.1, 1.3, 1.5].forEach(o => ceWhoosh(t + o, 0.35, 0.05, 500, 2200, hall));
    brass({ t: t + 2.2, notes: [55, 62, 67], dur: 0.7, gain: 0.05 });
    laserCharge({ t: t + 2.5, dur: 1.1, from: 90, to: 2200, gain: 0.05, out: hall });
    boom(t + 3.6, 0.9, hall);
    chord({ t: t + 3.7, notes: [55, 59, 62, 67], dur: 1.6, gain: 0.03, type: 'triangle', attack: 0.05, filter: 2400 });
    arpeggio(t + 3.7, [79, 83, 86, 91], 0.08, (tt, n) => bell({ t: tt, freq: midi(n), dur: 1, gain: 0.03, out: hall }));
    cowMoo(t + 4.7, hall);
  },
  'name-tristan': t => {
    const hall = darkBus({ reverb: 0.55 });
    eyeHum(t, 1, 0.04, hall);
    [0.9, 1, 1.1].forEach(o => tone({ t: t + o + 0.5, freq: 160, to: 70, dur: 0.12, type: 'triangle', gain: 0.08, attack: 0.002, out: hall }));
    [1.7, 1.95, 2.2, 2.45, 2.7, 2.95].forEach(o => ceWhoosh(t + o, 0.2, 0.035, 600, 1800, hall));
    ceWhoosh(t + 3.3, 0.4, 0.05, 800, 3000, hall);
    holoRise(t + 3.35, 0.05, hall);
    kuriChirp(t + 3.6, 0.04, hall);
    tone({ t: t + 4.3, freq: 2400, to: 700, dur: 0.22, type: 'square', gain: 0.025, filter: 3000, attack: 0.003 });
    cardFlip(t + 4.85);
    ceClang(t + 5.35, 0.05, hall);
    laserCharge({ t: t + 5.4, dur: 0.85, from: 60, to: 1400, gain: 0.06, out: hall });
    boom(t + 6.15, 1.1, hall);
    monsterRoar(t + 6.2, 0.13, hall);
    brass({ t: t + 6.9, notes: [62, 66, 69, 74], dur: 1.2, gain: 0.05 });
  },
  'name-otto': t => {
    const plain = darkBus({ reverb: 0.3 });
    noise({ t: t + 0.2, dur: 2.6, gain: 0.16, type: 'lowpass', freq: 160, to: 90, attack: 1.4, out: plain });
    for (let i = 0; i < 10; i++) {
      const at = 0.5 + i * 0.22;
      gallopStride(t + at, 0.05 + 0.09 * Math.max(0, 1 - Math.abs(at - 1.95) / 1.5), plain);
    }
    noise({ t: t + 1.3, dur: 0.18, gain: 0.08, freq: 700, q: 2, attack: 0.01, out: plain });
    noise({ t: t + 1.52, dur: 0.18, gain: 0.08, freq: 650, q: 2, attack: 0.01, out: plain });
    monsterRoar(t + 1.55, 0.08, plain);
    boom(t + 1.95, 1.3, plain);
    ceClang(t + 1.97, 0.07, plain);
    noise({ t: t + 1.95, dur: 0.6, gain: 0.12, type: 'highpass', freq: 2500, to: 900, attack: 0.002, out: plain });
    ceWhoosh(t + 2, 0.8, 0.08, 2200, 300, plain);
    for (let i = 0; i < 7; i++) gallopStride(t + 5.2 + i * 0.3, 0.025, plain);
  },
  'name-frida': t => {
    const lair = darkBus({ reverb: 0.8, echo: 0.2 });
    darkCluster({ t, notes: [45, 52, 56], dur: 4, gain: 0.02, out: lair });
    noise({ t: t + 0.9, dur: 1.2, gain: 0.1, type: 'lowpass', freq: 400, to: 1800, attack: 0.1, out: lair });
    for (let i = 0; i < 14; i++) noise({ t: t + 1 + i * rnd(0.12, 0.22), dur: 0.03, gain: 0.04, freq: rnd(1500, 4000), q: 4, attack: 0.001, out: lair });
    tone({ t: t + 1.3, freq: 110, to: 330, dur: 1.2, type: 'sawtooth', gain: 0.03, filter: [300, 1500], attack: 0.3, out: lair });
    noise({ t: t + 4.2, dur: 0.5, gain: 0.14, type: 'highpass', freq: 3000, to: 800, attack: 0.002, out: lair });
    noise({ t: t + 4.35, dur: 0.3, gain: 0.1, type: 'highpass', freq: 2500, attack: 0.002, out: lair });
    boom(t + 4.25, 0.6, lair);
    [4.4, 4.6, 4.9].forEach(o => tone({ t: t + o, freq: rnd(60, 80), to: rnd(40, 55), dur: 0.5, type: 'sawtooth', gain: 0.03, filter: 400, attack: 0.05, out: lair }));
    witchCackle(t + 4.8, lair);
    tone({ t: t + 6.6, freq: midi(62), dur: 0.3, type: 'triangle', gain: 0.03, out: lair });
    [0, 0.3].forEach(o => {
      tone({ t: t + 7.4 + o, freq: 760, to: 520, dur: 0.2, type: 'sawtooth', gain: 0.03, filter: 1600, q: 3, attack: 0.01, out: lair });
      noise({ t: t + 7.4 + o, dur: 0.18, gain: 0.03, freq: 1300, q: 3, attack: 0.01, out: lair });
    });
  },
  'name-marie': t => {
    const room = darkBus({ reverb: 0.7, echo: 0.25 });
    bigHeartbeat(t + 0.2, 0.25, room);
    bigHeartbeat(t + 1.0, 0.22, room);
    healPad({ t: t + 0.3, notes: [60, 64, 67, 71], dur: 6, gain: 0.03, attack: 1, out: room });
    cardFlip(t + 1.5);
    holoRise(t + 1.5, 0.04, room);
    [[76, 0.4], [79, 0.4], [84, 0.8], [83, 0.4], [79, 0.4], [81, 1.2], [77, 0.4], [81, 0.4], [86, 0.8], [84, 0.4], [83, 0.4], [84, 1.6]]
      .reduce((at, [n, d]) => { bell({ t: t + at, freq: midi(n), dur: 1.6, gain: 0.04, out: room }); return at + d; }, 1.8);
    healPad({ t: t + 6.5, notes: [57, 60, 64, 69], dur: 5, gain: 0.025, attack: 1, out: room });
    healSparkles(t + 1.6, 3, 14, room);
  },
  // "IT'S TIME TO DUEL!!!" (original riff, 150 bpm): four stabs for the
  // words, a crash on DUEL, then a driving E-minor power-chord riff.
  'egg-time-to-duel': t => {
    const amp = darkBus({ reverb: 0.35 });
    ceWhoosh(t, 0.3, 0.05, 300, 3000, amp);
    [0.3, 0.6, 0.9].forEach((o, i) => {
      powerChord(t + o, 40 + i * 2, 0.18, 0.05, amp);
      rockDrum(t + o, 'kick', amp);
    });
    const hit = t + 1.3;
    boom(hit, 1.1, amp);
    noise({ t: hit, dur: 1.4, gain: 0.1, type: 'highpass', freq: 6000, to: 3500, attack: 0.003, out: amp });
    powerChord(hit, 40, 0.75, 0.06, amp);
    const riff = [40, 40, 43, 40, 45, 40, 47, 45];
    for (let i = 0; i < 12; i++) {
      const at = hit + 0.8 + i * 0.2;
      powerChord(at, riff[i % 8], 0.16, 0.045, amp);
      if (i % 2 === 0) rockDrum(at, i % 4 === 2 ? 'snare' : 'kick', amp);
      rockDrum(at + 0.1, 'hat', amp);
    }
    powerChord(hit + 3.2, 40, 1.2, 0.055, amp);
    noise({ t: hit + 3.2, dur: 1.2, gain: 0.07, type: 'highpass', freq: 6000, to: 3500, attack: 0.003, out: amp });
  },
  // Grandpa's Duel School (6.5s): board drops, footsteps, chalk scribbles,
  // pointer taps, then CRACK, a groan, a sad trombone and squeaky wheels.
  'egg-duel-school': t => {
    const room = darkBus({ reverb: 0.3 });
    ceWhoosh(t, 0.5, 0.04, 1800, 400, room);
    tone({ t: t + 0.55, freq: 150, to: 90, dur: 0.12, type: 'triangle', gain: 0.1, attack: 0.002, out: room });
    [0.35, 0.55, 0.75, 0.95].forEach(o => tone({ t: t + o, freq: 220, to: 140, dur: 0.05, type: 'triangle', gain: 0.04, attack: 0.002, out: room }));
    chalkScribble(t + 0.7, 0.6, room);
    chalkScribble(t + 1.4, 0.7, room);
    [0, 1, 2, 3, 4].forEach(i => tone({ t: t + 1.8 + i * 0.12, freq: 900 + i * 60, dur: 0.04, type: 'triangle', gain: 0.025, attack: 0.002, out: room }));
    [2.1, 2.32, 2.54, 2.76].forEach(o => tone({ t: t + o, freq: 520, to: 300, dur: 0.05, type: 'square', gain: 0.03, filter: 1600, attack: 0.002, out: room }));
    chalkScribble(t + 2.7, 1.0, room);
    dieCrack(t + 3.8, 1.3);
    tone({ t: t + 3.95, freq: 260, to: 150, dur: 0.9, type: 'sawtooth', gain: 0.035, filter: [1400, 600], q: 4, attack: 0.05, out: room });
    ceSadTrombone(t + 4.2, 0.035);
    for (let o = 4.4; o < 6.1; o += 0.28) rubberSqueak(t + o, 1300 + rnd(-150, 150), 0.02, room);
    ceWhoosh(t + 5.3, 0.6, 0.04, 400, 1800, room);
  }
};

// Chalk on a blackboard: short, squeaky, resonant scratches.
// A cartoon cow: a short rising "mm" into a long buzzy falling "ooo".
function cowMoo(t, out) {
  tone({ t, freq: 125, to: 150, dur: 0.3, type: 'sawtooth', gain: 0.07, filter: [300, 900], q: 4, attack: 0.08, out });
  tone({ t: t + 0.25, freq: 150, to: 105, dur: 1.1, type: 'sawtooth', gain: 0.07, filter: [900, 350], q: 4, attack: 0.03, out });
}

// A small villain's "Mwa-ha-ha-ha-ha!": one low "mwa", then rising and falling "ha"s.
function witchCackle(t, out) {
  tone({ t, freq: 480, to: 640, dur: 0.28, type: 'square', gain: 0.03, filter: 2200, attack: 0.02, out });
  [1, 1.08, 1.16, 1.22, 1.16, 1.08, 1, 0.92].forEach((k, i) => {
    const f = 700 * k;
    const at = t + 0.34 + i * 0.15;
    tone({ t: at, freq: f * 1.12, to: f, dur: 0.11, type: 'square', gain: 0.03, filter: 2400, attack: 0.004, out });
    noise({ t: at, dur: 0.05, gain: 0.02, freq: 2600, q: 2, attack: 0.002, out });
  });
}

function chalkScribble(t, dur, out) {
  for (let at = 0; at < dur; at += 0.09) {
    noise({ t: t + at + rnd(0, 0.02), dur: 0.07, gain: 0.025, freq: rnd(2500, 4200), to: rnd(2500, 4200), q: 10, attack: 0.005, out });
  }
}

// Distorted guitar power chord: root, fifth and octave.
function powerChord(t, root, dur, gain, out) {
  [root, root + 7, root + 12].forEach((n, i) => {
    tone({ t, freq: midi(n), dur, type: 'sawtooth', gain, attack: 0.004, filter: [3500, 1400], q: 3, detune: -8 + i * 4, out });
    tone({ t, freq: midi(n), dur, type: 'square', gain: gain * 0.5, attack: 0.004, filter: 2200, detune: 9, out });
  });
}

function rockDrum(t, kind, out) {
  if (kind === 'kick') {
    tone({ t, freq: 130, to: 45, dur: 0.16, gain: 0.16, attack: 0.002, out });
  } else if (kind === 'snare') {
    noise({ t, dur: 0.14, gain: 0.1, freq: 1800, q: 0.8, attack: 0.002, out });
    tone({ t, freq: 220, to: 160, dur: 0.08, type: 'triangle', gain: 0.06, attack: 0.002, out });
  } else {
    noise({ t, dur: 0.03, gain: 0.03, type: 'highpass', freq: 8000, attack: 0.001, out });
  }
}

// ---------------------------------------------------------------------------
// Theme kits
// ---------------------------------------------------------------------------

const DARK_CHORDS = { skill: [57, 61, 64, 69], comeback: [57, 60, 64, 69], quest: [60, 64, 67, 72] };
const LIGHT_ARPS = { skill: [72, 76, 79], comeback: [69, 72, 76], quest: [72, 76, 79, 84] };
const POC_CHORDS = { skill: [62, 66, 69, 74], comeback: [57, 60, 64, 69], quest: [60, 64, 67, 72] };

const SOUND_KITS = {
  dark: {
    tap: t => tone({ t, freq: 1900, dur: 0.025, gain: 0.025 }),
    'sound-on': t => {
      tone({ t, freq: 660, dur: 0.07, type: 'square', gain: 0.04, filter: 3000 });
      tone({ t: t + 0.08, freq: 1320, dur: 0.1, type: 'square', gain: 0.04, filter: 3000 });
    },
    theme: t => {
      tone({ t, freq: 240, to: 1400, dur: 0.5, type: 'sawtooth', gain: 0.04, filter: [600, 5000] });
      noise({ t, dur: 0.5, gain: 0.05, freq: 500, to: 6000, q: 2 });
    },
    'screen-enter': t => {
      noise({ t, dur: 0.28, gain: 0.07, freq: 400, to: 4500, q: 2 });
      tone({ t, freq: 220, to: 880, dur: 0.24, type: 'sawtooth', gain: 0.025, filter: 1800 });
    },
    'modal-open': t => tone({ t, freq: 420, to: 980, dur: 0.14, gain: 0.09 }),
    'modal-close': t => tone({ t, freq: 900, to: 380, dur: 0.12, gain: 0.07 }),
    pick: t => {
      tone({ t, freq: 880, dur: 0.06, type: 'square', gain: 0.035, filter: 3000 });
      tone({ t: t + 0.06, freq: 1320, dur: 0.09, type: 'square', gain: 0.035, filter: 3000 });
    },
    peek: t => {
      for (let i = 0; i < 6; i++) {
        tone({ t: t + i * 0.035, freq: rnd(700, 2300), dur: 0.03, type: 'square', gain: 0.025, filter: 4000 });
      }
      noise({ t, dur: 0.25, gain: 0.035, type: 'highpass', freq: 3000 });
    },
    unpeek: t => tone({ t, freq: 1200, to: 500, dur: 0.1, type: 'square', gain: 0.03, filter: 2500 }),
    activate: (t, e) => {
      tone({ t, freq: 150, to: 1500, slide: 0.35, dur: 0.45, type: 'sawtooth', gain: 0.12, filter: [400, 6000] });
      noise({ t, dur: 0.5, gain: 0.06, freq: 600, to: 6000, q: 1.5 });
      chord({ t: t + 0.3, notes: DARK_CHORDS[e.type] || DARK_CHORDS.skill, dur: 1.2, gain: 0.06, filter: [3000, 600] });
      for (let i = 0; i < 5; i++) tone({ t: t + 0.35 + i * 0.06, freq: rnd(2500, 4500), dur: 0.12, gain: 0.02 });
    },
    'quest-complete': t => {
      arpeggio(t, [72, 76, 79, 84, 88], 0.07, (at, n) => tone({ t: at, freq: midi(n), dur: 0.18, type: 'square', gain: 0.035, filter: 4000 }));
      chord({ t: t + 0.35, notes: DARK_CHORDS.quest, dur: 1.6, gain: 0.06, filter: [3500, 700] });
      noise({ t: t + 0.35, dur: 1.4, gain: 0.03, type: 'highpass', freq: 6000, attack: 0.2 });
    },
    deactivate: t => tone({ t, freq: 700, to: 180, dur: 0.25, type: 'sawtooth', gain: 0.04, filter: 2000 }),
    use: t => {
      tone({ t, freq: 1500, to: 280, dur: 0.14, type: 'square', gain: 0.045, filter: 5000 });
      noise({ t, dur: 0.08, gain: 0.04, type: 'highpass', freq: 4000 });
    },
    'use-undo': t => tone({ t, freq: 900, to: 500, dur: 0.08, type: 'square', gain: 0.03, filter: 3000 }),
    exhaust: t => {
      for (let i = 0; i < 7; i++) {
        tone({ t: t + i * 0.04, freq: rnd(120, 1800), dur: 0.035, type: i % 2 ? 'square' : 'sawtooth', gain: 0.04, filter: 5000 });
      }
      SOUND_KITS.dark.stamp(t + 0.3);
    },
    stamp: t => {
      tone({ t, freq: 110, to: 40, dur: 0.3, gain: 0.25 });
      noise({ t, dur: 0.12, gain: 0.08, type: 'lowpass', freq: 1200 });
    },
    restore: t => arpeggio(t, [64, 68, 71, 76], 0.05, (at, n) => tone({ t: at, freq: midi(n), dur: 0.12, type: 'square', gain: 0.03, filter: 3500 })),
    'lp-swap': t => noise({ t, dur: 0.22, gain: 0.06, freq: 2500, to: 600, q: 2 }),
    damage: (t, e) => {
      const k = Math.min(1, 0.45 + e.amount / 4000);
      tone({ t, freq: 130, to: 38, dur: 0.45, gain: 0.35 * k });
      noise({ t, dur: 0.25, gain: 0.12 * k, type: 'lowpass', freq: 2500, to: 200 });
      tone({ t, freq: 600, to: 150, dur: 0.18, type: 'sawtooth', gain: 0.04 * k, filter: 2500 });
    },
    heal: t => {
      arpeggio(t, [72, 76, 79, 84], 0.06, (at, n) => tone({ t: at, freq: midi(n), dur: 0.35, gain: 0.06 }));
      noise({ t, dur: 0.5, gain: 0.025, type: 'highpass', freq: 5000, attack: 0.1 });
    },
    'duel-reset': t => {
      tone({ t, freq: 900, to: 70, dur: 0.45, type: 'sawtooth', gain: 0.12, filter: [4000, 200] });
      arpeggio(t + 0.55, [60, 67, 72], 0.08, (at, n) => tone({ t: at, freq: midi(n), dur: 0.12, type: 'square', gain: 0.035, filter: 3000 }));
    },
    defeat: t => {
      tone({ t, freq: 440, to: 50, dur: 1.5, type: 'sawtooth', gain: 0.08, filter: [3000, 150] });
      chord({ t: t + 0.2, notes: [45, 48, 52], dur: 2, gain: 0.04, filter: [1200, 200] });
    },
    ...TINY_VIOLIN_SOUNDS,
    ...EXODIA_SOUNDS,
    ...HEAL_SOUNDS,
    ...SHADOW_SOUNDS,
    ...LAST_STAND_SOUNDS,
    ...HEART_SOUNDS,
    ...SCREW_SOUNDS,
    ...MIND_CRUSH_SOUNDS,
    ...DIZZY_SOUNDS,
    ...NAP_SOUNDS,
    ...PUZZLE_SOUNDS,
    ...SPEAKER_SOUNDS,
    ...POT_SOUNDS,
    ...TRAP_SOUNDS,
    ...GAIA_SOUNDS,
    ...DISK_SOUNDS,
    ...PALADIN_SOUNDS,
    ...DIVINE_SOUNDS,
    ...CHAR_EGG_SOUNDS,
    ...HEADER_EGG_SOUNDS,
    ...SIZE_EGG_SOUNDS,
    ...FINALE_SOUNDS,
    ...TOURNAMENT_SOUNDS,
    ...COOP_SOUNDS
  },
  light: {
    tap: t => tone({ t, freq: 700, dur: 0.02, type: 'triangle', gain: 0.03 }),
    'sound-on': t => arpeggio(t, [72, 79], 0.08, (at, n) => marimba({ t: at, note: n, gain: 0.12 })),
    theme: t => {
      noise({ t, dur: 0.35, gain: 0.04, type: 'highpass', freq: 2500, to: 6000 });
      arpeggio(t + 0.1, [79, 84, 88], 0.06, (at, n) => marimba({ t: at, note: n, gain: 0.08 }));
    },
    'screen-enter': t => noise({ t, dur: 0.22, gain: 0.035, type: 'highpass', freq: 2000, to: 5000, attack: 0.05 }),
    'modal-open': t => bubble({ t, from: 350, to: 950 }),
    'modal-close': t => bubble({ t, from: 800, to: 320, gain: 0.08 }),
    pick: t => marimba({ t, note: 76, gain: 0.12 }),
    peek: t => arpeggio(t, [72, 79], 0.07, (at, n) => marimba({ t: at, note: n, gain: 0.1 })),
    unpeek: t => arpeggio(t, [79, 72], 0.07, (at, n) => marimba({ t: at, note: n, gain: 0.08 })),
    activate: (t, e) => {
      bubble({ t, from: 300, to: 1100, dur: 0.12 });
      arpeggio(t + 0.08, LIGHT_ARPS[e.type] || LIGHT_ARPS.skill, 0.08, (at, n) => marimba({ t: at, note: n }));
      bell({ t: t + 0.35, freq: midi(96), dur: 0.8, gain: 0.03 });
    },
    'quest-complete': t => {
      arpeggio(t, [72, 76, 79, 84, 88, 91], 0.07, (at, n) => marimba({ t: at, note: n, gain: 0.14 }));
      for (let i = 0; i < 8; i++) tone({ t: t + 0.45 + i * 0.07, freq: rnd(2000, 4000), dur: 0.15, gain: 0.025 });
    },
    deactivate: t => arpeggio(t, [76, 69], 0.08, (at, n) => marimba({ t: at, note: n, gain: 0.09 })),
    use: t => {
      bubble({ t, from: 400, to: 1200, dur: 0.07, gain: 0.14 });
      marimba({ t: t + 0.04, note: 84, gain: 0.07, dur: 0.25 });
    },
    'use-undo': t => bubble({ t, from: 900, to: 400, dur: 0.07, gain: 0.08 }),
    exhaust: t => {
      arpeggio(t, [67, 60], 0.12, (at, n) => marimba({ t: at, note: n, gain: 0.12 }));
      SOUND_KITS.light.stamp(t + 0.3);
    },
    stamp: t => tone({ t, freq: 220, to: 120, dur: 0.12, type: 'triangle', gain: 0.12 }),
    restore: t => arpeggio(t, [67, 72, 76], 0.06, (at, n) => marimba({ t: at, note: n, gain: 0.1 })),
    'lp-swap': t => noise({ t, dur: 0.18, gain: 0.03, type: 'highpass', freq: 3000, to: 1500 }),
    damage: (t, e) => {
      const k = Math.min(1, 0.5 + e.amount / 4000);
      marimba({ t, note: 48, gain: 0.25 * k, dur: 0.5 });
      marimba({ t: t + 0.02, note: 49, gain: 0.12 * k, dur: 0.4 });
    },
    heal: t => arpeggio(t, [79, 84, 88, 91], 0.05, (at, n) => bell({ t: at, freq: midi(n), dur: 0.5, gain: 0.035 })),
    'duel-reset': t => {
      noise({ t, dur: 0.4, gain: 0.05, type: 'highpass', freq: 1500, to: 6000, attack: 0.1 });
      arpeggio(t + 0.3, [84, 79, 76, 72], 0.06, (at, n) => marimba({ t: at, note: n, gain: 0.09 }));
    },
    defeat: t => arpeggio(t, [67, 66, 65, 64], 0.32, (at, n) => tone({ t: at, freq: midi(n), dur: 0.4, type: 'triangle', gain: 0.1, attack: 0.03 })),
        ...TINY_VIOLIN_SOUNDS,
        ...EXODIA_SOUNDS,
    ...HEAL_SOUNDS,
    ...SHADOW_SOUNDS,
    ...LAST_STAND_SOUNDS,
    ...HEART_SOUNDS,
    ...SCREW_SOUNDS,
    ...MIND_CRUSH_SOUNDS,
    ...DIZZY_SOUNDS,
    ...NAP_SOUNDS,
    ...PUZZLE_SOUNDS,
    ...SPEAKER_SOUNDS,
    ...POT_SOUNDS,
    ...TRAP_SOUNDS,
    ...GAIA_SOUNDS,
    ...DISK_SOUNDS,
    ...PALADIN_SOUNDS,
    ...DIVINE_SOUNDS,
    ...CHAR_EGG_SOUNDS,
    ...HEADER_EGG_SOUNDS,
    ...SIZE_EGG_SOUNDS,
    ...FINALE_SOUNDS,
    ...TOURNAMENT_SOUNDS,
    ...COOP_SOUNDS
  },

  poc: {
    tap: t => noise({ t, dur: 0.02, gain: 0.06, freq: 3500, q: 1.5 }),
    'sound-on': t => {
      bell({ t, freq: midi(81), dur: 1, gain: 0.06 });
      bell({ t: t + 0.12, freq: midi(86), dur: 1.2, gain: 0.06 });
    },
    theme: t => {
      noise({ t, dur: 0.6, gain: 0.05, freq: 700, to: 2600, q: 0.7, attack: 0.1 });
      arpeggio(t + 0.1, POC_HARP_UP, 0.04, (at, n) => pluck({ t: at, note: n, gain: 0.06 }));
    },
    // Papyrus unrolling: a rough, rising rustle.
    'screen-enter': t => {
      noise({ t, dur: 0.45, gain: 0.07, freq: 900, to: 2800, q: 0.6, attack: 0.08 });
      cardFlip(t + 0.15, 0.06);
    },
    'modal-open': t => {
      cardFlip(t);
      bell({ t: t + 0.05, freq: midi(74), dur: 0.9, gain: 0.04 });
    },
    'modal-close': t => cardFlip(t, 0.1, 2000),
    pick: t => {
      bell({ t, freq: midi(86), dur: 0.7, gain: 0.05 });
      cardFlip(t, 0.05, 3200);
    },
    peek: t => cardFlip(t),
    unpeek: t => cardFlip(t, 0.12, 2000),
    // "Summon": flip, impact, harp sweep and a golden chord.
    activate: (t, e) => {
      cardFlip(t);
      boom(t + 0.05, 0.6);
      arpeggio(t + 0.1, POC_HARP_UP, 0.035, (at, n) => pluck({ t: at, note: n, gain: 0.07 }));
      brass({ t: t + 0.45, notes: POC_CHORDS[e.type] || POC_CHORDS.skill, dur: 0.9, gain: 0.035 });
      bell({ t: t + 0.45, freq: midi(86), dur: 1.6, gain: 0.05 });
    },
    // Fanfare plus a shower of gold coins.
    'quest-complete': t => {
      cardFlip(t);
      brass({ t, notes: [60, 64, 67], dur: 0.22, gain: 0.04 });
      brass({ t: t + 0.22, notes: [60, 64, 67], dur: 0.12, gain: 0.04 });
      brass({ t: t + 0.36, notes: [65, 69, 72], dur: 0.22, gain: 0.04 });
      brass({ t: t + 0.6, notes: [67, 72, 76], dur: 1.1, gain: 0.045 });
      boom(t + 0.6, 0.5);
      for (let i = 0; i < 18; i++) coinClink(t + 0.5 + rnd(0, 1.6), rnd(0.02, 0.045));
    },
    deactivate: t => {
      cardFlip(t, 0.12, 1800);
      tone({ t, freq: midi(62), to: midi(50), dur: 0.4, type: 'triangle', gain: 0.07 });
    },
    // "Attack!": a sword clash.
    use: t => {
      noise({ t, dur: 0.12, gain: 0.12, type: 'highpass', freq: 3500 });
      bell({ t, freq: 1750, dur: 0.6, gain: 0.06 });
      bell({ t, freq: 2390, dur: 0.5, gain: 0.04 });
      boom(t, 0.3);
    },
    'use-undo': t => cardFlip(t, 0.08, 1800),
    // Turning to stone: crumbling rubble, then the ink stamp thuds down.
    exhaust: t => {
      for (let i = 0; i < 10; i++) {
        noise({ t: t + rnd(0, 0.4), dur: rnd(0.03, 0.08), gain: rnd(0.05, 0.1), type: 'lowpass', freq: rnd(400, 1600) });
      }
      tone({ t, freq: 70, to: 40, dur: 0.6, gain: 0.15 });
      SOUND_KITS.poc.stamp(t + 0.45);
    },
    stamp: t => {
      tone({ t, freq: 150, to: 55, dur: 0.22, gain: 0.3 });
      noise({ t, dur: 0.09, gain: 0.12, type: 'lowpass', freq: 1500 });
    },
    restore: t => {
      arpeggio(t, POC_HARP_UP.slice(0, 6), 0.04, (at, n) => pluck({ t: at, note: n, gain: 0.07 }));
      bell({ t: t + 0.25, freq: midi(81), dur: 1, gain: 0.04 });
    },
    'lp-swap': t => {
      noise({ t, dur: 0.4, gain: 0.06, freq: 600, to: 2400, q: 0.8, attack: 0.08 });
      cardFlip(t + 0.3, 0.08);
    },
    damage: (t, e) => {
      const k = Math.min(1, 0.5 + e.amount / 3000);
      boom(t, k);
      noise({ t: t + 0.05, dur: 0.7, gain: 0.08 * k, type: 'lowpass', freq: 180, attack: 0.05 });
    },
    heal: t => {
      arpeggio(t, POC_HARP_UP.slice(3), 0.04, (at, n) => pluck({ t: at, note: n, gain: 0.07 }));
      bell({ t: t + 0.1, freq: midi(86), dur: 1.4, gain: 0.04 });
      bell({ t: t + 0.25, freq: midi(93), dur: 1.2, gain: 0.03 });
    },
    // Chaos vortex: a deep rumble and swirling wind, then the cards are dealt.
    'duel-reset': t => {
      noise({ t, dur: 1.3, gain: 0.4, type: 'lowpass', freq: 220, attack: 0.25 });
      noise({ t, dur: 1.2, gain: 0.2, freq: 2500, to: 300, q: 4, attack: 0.2 });
      tone({ t, freq: 300, to: 45, dur: 1.2, type: 'sawtooth', gain: 0.05, filter: [1500, 150] });
      for (let i = 0; i < 3; i++) cardFlip(t + 1.05 + i * 0.09, 0.08);
    },
    // Low gong and a sombre minor chord.
    defeat: t => {
      bell({ t, freq: 73, dur: 3, gain: 0.3 });
      boom(t, 0.8);
      brass({ t: t + 0.4, notes: [50, 53, 57], dur: 1.8, gain: 0.03 });
    },
    ...TINY_VIOLIN_SOUNDS,
    ...EXODIA_SOUNDS,
    ...HEAL_SOUNDS,
    ...SHADOW_SOUNDS,
    ...LAST_STAND_SOUNDS,
    ...HEART_SOUNDS,
    ...SCREW_SOUNDS,
    ...MIND_CRUSH_SOUNDS,
    ...DIZZY_SOUNDS,
    ...NAP_SOUNDS,
    ...PUZZLE_SOUNDS,
    ...SPEAKER_SOUNDS,
    ...POT_SOUNDS,
    ...TRAP_SOUNDS,
    ...GAIA_SOUNDS,
    ...DISK_SOUNDS,
    ...PALADIN_SOUNDS,
    ...DIVINE_SOUNDS,
    ...CHAR_EGG_SOUNDS,
    ...HEADER_EGG_SOUNDS,
    ...SIZE_EGG_SOUNDS,
    ...FINALE_SOUNDS,
    ...TOURNAMENT_SOUNDS,
    ...COOP_SOUNDS
  }
};

// --- Treasure (secret theme): crystal chimes, gem clinks and gold coins. -----
// Starts from the Power of Chaos kit (all the easter-egg sounds, the defeat
// gong) and swaps the everyday UI sounds for jewellery.
const GOLD_CHORDS = { skill: [64, 68, 71, 76], comeback: [61, 64, 68, 73], quest: [64, 68, 71, 76, 80] };
const GOLD_SPARKLE = [88, 92, 95, 100, 104];

function gemClink(t, note = 96, gain = 0.035) {
  bell({ t, freq: midi(note), dur: 0.5, gain });
  bell({ t: t + 0.012, freq: midi(note + 7) * 1.003, dur: 0.35, gain: gain * 0.6 });
}

function crystalSweep(t, notes = GOLD_SPARKLE, step = 0.045, gain = 0.03) {
  arpeggio(t, notes, step, (at, n) => bell({ t: at, freq: midi(n), dur: 0.9, gain }));
}

SOUND_KITS.gold = {
  ...SOUND_KITS.poc,
  tap: t => bell({ t, freq: midi(103), dur: 0.12, gain: 0.012 }),
  'sound-on': t => {
    gemClink(t, 88);
    gemClink(t + 0.1, 95);
  },
  // A treasure chest bursting open: thud, coins, a glittering sweep.
  theme: t => {
    tone({ t, freq: 120, to: 60, dur: 0.25, gain: 0.12 });
    for (let i = 0; i < 12; i++) coinClink(t + 0.08 + rnd(0, 0.7), rnd(0.02, 0.04));
    crystalSweep(t + 0.15, [76, 80, 83, 88, 92, 95, 100, 104], 0.05, 0.03);
  },
  'screen-enter': t => {
    noise({ t, dur: 0.35, gain: 0.03, type: 'highpass', freq: 4000, to: 9000, attack: 0.1 });
    gemClink(t + 0.08, 100, 0.02);
  },
  'modal-open': t => {
    noise({ t, dur: 0.18, gain: 0.04, freq: 900, to: 2400, q: 1 });
    crystalSweep(t + 0.05, [83, 88, 92], 0.05, 0.025);
  },
  'modal-close': t => crystalSweep(t, [92, 88, 83], 0.04, 0.02),
  pick: t => gemClink(t, 93),
  peek: t => {
    noise({ t, dur: 0.12, gain: 0.04, type: 'highpass', freq: 5000 });
    gemClink(t + 0.03, 98, 0.025);
  },
  unpeek: t => gemClink(t, 90, 0.02),
  // The gem ignites: a shimmering chord in its colour, sparkles on top.
  activate: (t, e) => {
    boom(t, 0.4);
    laserCharge({ t, dur: 0.35, from: 400, to: 3000, gain: 0.03 });
    (GOLD_CHORDS[e.type] || GOLD_CHORDS.skill).forEach(n => bell({ t: t + 0.3, freq: midi(n), dur: 1.6, gain: 0.035 }));
    crystalSweep(t + 0.35);
  },
  // A royal fanfare and a waterfall of gold.
  'quest-complete': t => {
    brass({ t, notes: [64, 68, 71], dur: 0.2, gain: 0.04 });
    brass({ t: t + 0.22, notes: [64, 68, 71], dur: 0.12, gain: 0.04 });
    brass({ t: t + 0.36, notes: [66, 69, 73], dur: 0.2, gain: 0.04 });
    brass({ t: t + 0.6, notes: [64, 68, 71, 76], dur: 1.1, gain: 0.045 });
    crystalSweep(t + 0.6, [88, 92, 95, 100, 104, 107], 0.05, 0.03);
    for (let i = 0; i < 22; i++) coinClink(t + 0.55 + rnd(0, 1.8), rnd(0.02, 0.045));
  },
  deactivate: t => crystalSweep(t, [88, 83, 76], 0.07, 0.03),
  use: t => {
    gemClink(t, 91, 0.04);
    coinClink(t + 0.05, 0.035);
  },
  'use-undo': t => gemClink(t, 84, 0.025),
  // The stone cracks: glassy splinters, then the engraving.
  exhaust: t => {
    noise({ t, dur: 0.08, gain: 0.12, type: 'highpass', freq: 4500 });
    for (let i = 0; i < 9; i++) bell({ t: t + 0.02 + rnd(0, 0.35), freq: rnd(2500, 6000), dur: 0.2, gain: rnd(0.01, 0.025) });
    tone({ t, freq: 90, to: 50, dur: 0.4, gain: 0.1 });
    SOUND_KITS.gold.stamp(t + 0.45);
  },
  stamp: t => {
    tone({ t, freq: 180, to: 70, dur: 0.18, gain: 0.2 });
    bell({ t, freq: 520, dur: 0.6, gain: 0.04 });
  },
  restore: t => crystalSweep(t, [76, 80, 83, 88, 92], 0.05, 0.03),
  'lp-swap': t => {
    for (let i = 0; i < 4; i++) coinClink(t + i * 0.07, 0.035);
  },
  damage: (t, e) => {
    const k = Math.min(1, 0.5 + e.amount / 3000);
    boom(t, k);
    noise({ t, dur: 0.1, gain: 0.08 * k, type: 'highpass', freq: 3500 });
    bell({ t: t + 0.02, freq: 1180, dur: 0.5, gain: 0.03 * k });
  },
  heal: t => {
    healSparkles(t, 0.6, 8);
    bell({ t: t + 0.1, freq: midi(88), dur: 1.2, gain: 0.035 });
  },
  // The vault resets: coins pour back into the chest, the lid shuts.
  'duel-reset': t => {
    for (let i = 0; i < 26; i++) coinClink(t + rnd(0, 1), rnd(0.015, 0.04));
    noise({ t, dur: 1, gain: 0.05, freq: 3000, to: 1200, q: 1, attack: 0.2 });
    tone({ t: t + 1.05, freq: 110, to: 55, dur: 0.3, gain: 0.2 });
    noise({ t: t + 1.05, dur: 0.12, gain: 0.08, type: 'lowpass', freq: 900 });
  }
};
