// Sound-button easter egg. Spam the sound toggle and the speaker starts to
// strain: from SPEAKER_STRAIN_FROM taps on it shakes harder and cracks with
// every tap. On tap SPEAKER_BREAK_TAPS it bursts in a puff of smoke, tips over
// and is "sent to the Graveyard 🪦"... until a Monster Reborn ankh floats
// down and revives it — with the sound switched on. The sound is
// 'speaker-rip' in sounds.js ('speaker-creak' for each straining tap).
const SPEAKER_BREAK_TAPS = 10;
const SPEAKER_STRAIN_FROM = 3;
const SPEAKER_TAP_GAP_MS = 700;
// Keep in sync with the `speaker-*` timings in effects.css.
const SPEAKER_REBORN_MS = 3400;
const SPEAKER_TOTAL_MS = 5200;

const speakerEgg = { taps: 0, timer: null, dead: false };

// 0 = calm, up to SPEAKER_BREAK_TAPS - SPEAKER_STRAIN_FROM = about to blow.
function getSpeakerStrain() {
  return Math.max(0, speakerEgg.taps - SPEAKER_STRAIN_FROM + 1);
}

function getSpeakerClass() {
  if (speakerEgg.dead) return 'speaker-dead';
  return getSpeakerStrain() ? 'speaker-strain' : '';
}

function getSpeakerStyle() {
  const strain = getSpeakerStrain();
  return strain && !speakerEgg.dead ? `--strain: ${strain}` : '';
}

// Called by toggleSound(). Returns true when the speaker broke (the egg then
// takes over rendering).
function countSoundSpam() {
  clearTimeout(speakerEgg.timer);
  speakerEgg.taps++;

  if (speakerEgg.taps >= SPEAKER_BREAK_TAPS && breakSpeaker()) return true;
  if (getSpeakerStrain()) playSound({ name: 'speaker-creak', strain: getSpeakerStrain() });

  speakerEgg.timer = setTimeout(() => {
    const wasStraining = getSpeakerStrain() > 0;
    speakerEgg.taps = 0;
    if (wasStraining) render();
  }, SPEAKER_TAP_GAP_MS);
  return false;
}

function breakSpeaker() {
  const btn = document.querySelector('[data-sound-btn]');
  const c = getCenter(btn);
  const smoke = Array.from({ length: 7 }, (_, i) => {
    const vars = `--dx: ${rand(-40, 40).toFixed(0)}px; --dy: ${rand(-90, -50).toFixed(0)}px; --s: ${rand(0.8, 1.6).toFixed(2)}; --d: ${(i * 0.06).toFixed(2)}s`;
    return `<span class="speaker-smoke" style="${vars}"></span>`;
  }).join('');

  const overlay = spawnFx('fx-speaker-rip', SPEAKER_TOTAL_MS + 100, {
    vars: {
      '--bx': `${c.x.toFixed(0)}px`,
      '--by': `${c.y.toFixed(0)}px`,
      // The ankh floats down from above, or up from below if there's no room.
      '--ankh-dir': c.y > 200 ? '-1' : '1'
    },
    html: `
      <div class="speaker-burst">💥</div>
      ${smoke}
      <div class="speaker-ankh">${MONSTER_REBORN_SVG}</div>
      <div class="speaker-reborn-flash"></div>
      <div class="speaker-toast">
        <span class="speaker-toast-rip">Your speaker has been sent to the Graveyard 🪦</span>
        <span class="speaker-toast-reborn">Monster Reborn! Your speaker lives again 🔊</span>
      </div>
    `
  });
  if (!overlay) return false;

  speakerEgg.taps = 0;
  speakerEgg.dead = true;
  // Monster Reborn brings it back switched on, so force the sound on now and
  // let the whole story be heard.
  try { localStorage.setItem(SOUND_STORAGE_KEY, 'on'); } catch {}
  unlockAudio();
  markEggFound('speaker');
  playSound({ name: 'speaker-rip' });
  render();

  setTimeout(() => {
    speakerEgg.dead = false;
    render();
    restartClass(document.querySelector('[data-sound-btn]'), 'speaker-reborn', 1000);
  }, SPEAKER_REBORN_MS);
  return true;
}

const MONSTER_REBORN_SVG = `
  <svg viewBox="0 0 24 32" aria-hidden="true">
    <defs>
      <linearGradient id="reborn-gold" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#fef9c3"/>
        <stop offset="0.5" stop-color="#facc15"/>
        <stop offset="1" stop-color="#a16207"/>
      </linearGradient>
    </defs>
    <g fill="none" stroke="url(#reborn-gold)" stroke-width="3.2" stroke-linecap="round">
      <ellipse cx="12" cy="7" rx="4.5" ry="5.5"/>
      <path d="M12 12.5 V30 M3 15 H21"/>
    </g>
  </svg>
`;
