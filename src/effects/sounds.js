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
// Millennium Puzzle one ancient golden hum, and the broken speaker one sad
// trombone.
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
    ...SPEAKER_SOUNDS
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
    ...SPEAKER_SOUNDS
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
    ...SPEAKER_SOUNDS
  }
};
