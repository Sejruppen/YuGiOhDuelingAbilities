// Sound effects, synthesised live with the Web Audio API (no audio files, so
// nothing extra to download or cache). Each theme has its own "kit":
// - Dark:           synth zaps, glitches and neon sweeps.
// - Light:          soft marimba notes, bubbly pops and chimes.
// - Power of Chaos: card flips, golden bells, harp, brass fanfares and booms.
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
  const on = !isSoundOn();
  try {
    localStorage.setItem(SOUND_STORAGE_KEY, on ? 'on' : 'off');
  } catch {}
  if (on) {
    unlockAudio();
    playSound({ name: 'sound-on' });
  }
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
    if (event.to === 0 && event.from > 0) return { name: 'defeat', amount };
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

// filter: cutoff in Hz, or [from, to] for a lowpass sweep.
function tone({ t, freq, to, slide, dur = 0.2, type = 'sine', gain = 0.2, attack = 0.005, filter, q = 1, detune = 0 }) {
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
  node.connect(amp).connect(sfxOut);
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

function noise({ t, dur = 0.2, gain = 0.2, type = 'bandpass', freq = 1000, to, q = 1, attack = 0.005 }) {
  const src = sfxCtx.createBufferSource();
  const amp = sfxCtx.createGain();
  src.buffer = getNoiseBuffer();
  src.loop = true;
  envelope(amp.gain, t, gain, attack, dur);
  src.connect(makeFilter(t, type, freq, to, dur, q)).connect(amp).connect(sfxOut);
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
function bell({ t, freq, dur = 1.4, gain = 0.1 }) {
  [[1, 1], [2.01, 0.5], [3.02, 0.28], [4.17, 0.16], [5.43, 0.1]].forEach(([ratio, level], i) => {
    tone({ t, freq: freq * ratio, dur: dur / (1 + i * 0.7), gain: gain * level, attack: 0.002 });
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

function boom(t, strength = 1) {
  tone({ t, freq: 95, to: 32, dur: 0.9, gain: 0.4 * strength, attack: 0.003 });
  noise({ t, dur: 0.6, gain: 0.22 * strength, type: 'lowpass', freq: 600, to: 70, attack: 0.002 });
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
    'logo-tap': (t, e) => {
      const f = midi(logoNote(60, e.combo));
      tone({ t, freq: f, dur: 0.12, type: 'square', gain: 0.04, filter: 4000 });
      tone({ t, freq: f * 2, to: f * 1.5, dur: 0.08, type: 'sawtooth', gain: 0.02, filter: 5000 });
    },
    'logo-piece': (t, e) => {
      const root = 60 + e.piece * 2;
      arpeggio(t, [root, root + 4, root + 7, root + 12], 0.05, (at, n) => tone({ t: at, freq: midi(n), dur: 0.16, type: 'square', gain: 0.035, filter: 4000 }));
      chord({ t: t + 0.2, notes: [root, root + 7, root + 12], dur: 0.6, gain: 0.04, filter: [3000, 800] });
    },
    'logo-scatter': t => tone({ t, freq: 800, to: 120, dur: 0.4, type: 'sawtooth', gain: 0.05, filter: [3000, 300] }),
    // Exodia (timeline matches effects.css): darkness 0s, he rises 0.9s,
    // charges 2.3s, blasts 3.8s, the world returns 6.6s.
    'logo-obliterate': t => {
      tone({ t, freq: 220, to: 55, dur: 1, type: 'sawtooth', gain: 0.06, filter: [2000, 200] });
      noise({ t, dur: 0.9, gain: 0.08, type: 'lowpass', freq: 3000, to: 150 });
      const rise = t + 0.9;
      boom(rise, 0.7);
      chord({ t: rise, notes: [33, 40, 45, 48], dur: 3, gain: 0.05, attack: 0.8, filter: [200, 1800] });
      const charge = t + 2.3;
      tone({ t: charge, freq: 90, to: 1800, slide: 1.5, dur: 1.55, type: 'sawtooth', gain: 0.07, filter: [400, 6000] });
      noise({ t: charge, dur: 1.5, gain: 0.1, freq: 300, to: 8000, q: 2, attack: 1.2 });
      const blast = t + 3.8;
      boom(blast, 1.4);
      noise({ t: blast, dur: 2.8, gain: 0.3, type: 'lowpass', freq: 6000, to: 200, attack: 0.02 });
      tone({ t: blast, freq: 2400, to: 60, dur: 2, type: 'sawtooth', gain: 0.07, filter: [6000, 200] });
      chord({ t: blast, notes: [57, 64, 69, 73, 76], dur: 2.8, gain: 0.04, filter: [5000, 600] });
      arpeggio(t + 6.6, [69, 73, 76, 81], 0.09, (at, n) => tone({ t: at, freq: midi(n), dur: 0.5, gain: 0.04 }));
    }
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
    'logo-tap': (t, e) => {
      marimba({ t, note: logoNote(67, e.combo), gain: 0.13, dur: 0.35 });
      bubble({ t, from: 500, to: 1100, dur: 0.05, gain: 0.05 });
    },
    'logo-piece': (t, e) => {
      const root = 72 + e.piece * 2;
      arpeggio(t, [root, root + 4, root + 7, root + 12], 0.06, (at, n) => marimba({ t: at, note: n, gain: 0.12 }));
      bell({ t: t + 0.25, freq: midi(root + 24), dur: 0.8, gain: 0.03 });
    },
    'logo-scatter': t => arpeggio(t, [79, 74, 70, 67], 0.06, (at, n) => marimba({ t: at, note: n, gain: 0.08 })),
    'logo-obliterate': t => {
      arpeggio(t, [72, 67, 63, 60, 55], 0.16, (at, n) => marimba({ t: at, note: n, gain: 0.1, dur: 0.6 }));
      const rise = t + 0.9;
      marimba({ t: rise, note: 36, gain: 0.35, dur: 1.4 });
      [48, 55, 60, 63].forEach((n, i) => bell({ t: rise + i * 0.25, freq: midi(n), dur: 2, gain: 0.06 }));
      const charge = t + 2.3;
      for (let i = 0; i < 24; i++) bubble({ t: charge + i * 0.0625, from: 250 + i * 50, to: 600 + i * 110, dur: 0.06, gain: 0.07 });
      const blast = t + 3.8;
      boom(blast, 0.9);
      noise({ t: blast, dur: 2.6, gain: 0.12, type: 'highpass', freq: 1500, to: 8000, attack: 0.05 });
      arpeggio(blast, [72, 76, 79, 84, 88, 91, 96, 100], 0.045, (at, n) => marimba({ t: at, note: n, gain: 0.12 }));
      [84, 88, 91, 96].forEach(n => bell({ t: blast + 0.4, freq: midi(n), dur: 2.4, gain: 0.04 }));
      arpeggio(t + 6.6, [79, 84, 88], 0.08, (at, n) => marimba({ t: at, note: n, gain: 0.08 }));
    }
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
    'logo-tap': (t, e) => {
      pluck({ t, note: logoNote(62, e.combo), gain: 0.09 });
      cardFlip(t, 0.05, 3200);
    },
    'logo-piece': (t, e) => {
      cardFlip(t);
      bell({ t, freq: midi(74 + e.piece * 2), dur: 1.2, gain: 0.06 });
      brass({ t: t + 0.08, notes: [50 + e.piece * 2, 57 + e.piece * 2], dur: 0.45, gain: 0.03 });
    },
    'logo-scatter': t => {
      for (let i = 0; i < 4; i++) cardFlip(t + i * 0.07, 0.07, 2200 - i * 250);
    },
    // Gong and rumble as Exodia rises, harp charge, double impact and fanfare.
    'logo-obliterate': t => {
      noise({ t, dur: 1, gain: 0.12, freq: 2000, to: 200, q: 0.8 });
      tone({ t, freq: 150, to: 45, dur: 1, gain: 0.15 });
      const rise = t + 0.9;
      boom(rise, 0.8);
      bell({ t: rise, freq: 65, dur: 3, gain: 0.25 });
      noise({ t: rise, dur: 2.9, gain: 0.25, type: 'lowpass', freq: 160, to: 320, attack: 1 });
      brass({ t: rise + 0.3, notes: [38, 45, 50], dur: 1.6, gain: 0.04 });
      const charge = t + 2.3;
      noise({ t: charge, dur: 1.5, gain: 0.14, freq: 400, to: 4000, q: 3, attack: 1.2 });
      arpeggio(charge, POC_HARP_UP, 0.13, (at, n) => pluck({ t: at, note: n, gain: 0.06 }));
      const blast = t + 3.8;
      boom(blast, 1.4);
      boom(blast + 0.3, 0.8);
      noise({ t: blast, dur: 2.8, gain: 0.28, type: 'lowpass', freq: 5000, to: 200 });
      brass({ t: blast + 0.1, notes: [50, 57, 62, 66, 69], dur: 2.2, gain: 0.045 });
      bell({ t: blast, freq: 110, dur: 3, gain: 0.2 });
      arpeggio(t + 6.6, POC_HARP_UP.slice(4), 0.05, (at, n) => pluck({ t: at, note: n, gain: 0.06 }));
    }
  }
};
