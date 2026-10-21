// Duel-screen easter egg. Spam Peek on and off (MIND_CRUSH_TOGGLES toggles of
// the same card in quick succession) and Pegasus notices: the screen dims,
// his Millennium Eye fades in, he purrs "I can see your Skill... how
// predictable," then winks and vanishes. Short and sinister. It doesn't
// block taps. The sound is 'mind-crush' in sounds.js.
const MIND_CRUSH_TOGGLES = 8;
const MIND_CRUSH_COMBO_TIMEOUT_MS = 800;
// Keep in sync with the `crush-*` timings in effects.css.
const MIND_CRUSH_TOTAL_MS = 3400;

const crushEgg = { type: null, toggles: 0, timer: null, busy: false };

// Called by togglePeek() for every Peek / Close tap.
function countPeekSpam(type) {
  if (crushEgg.busy) return;

  clearTimeout(crushEgg.timer);
  crushEgg.toggles = crushEgg.type === type ? crushEgg.toggles + 1 : 1;
  crushEgg.type = type;

  if (crushEgg.toggles >= MIND_CRUSH_TOGGLES) {
    crushEgg.toggles = 0;
    triggerMindCrush(type);
    return;
  }
  crushEgg.timer = setTimeout(() => { crushEgg.toggles = 0; }, MIND_CRUSH_COMBO_TIMEOUT_MS);
}

function triggerMindCrush(type) {
  const label = ABILITY_TYPES[type]?.label || 'cards';
  const overlay = spawnFx('fx-mind-crush', MIND_CRUSH_TOTAL_MS + 100, {
    html: `
      <div class="crush-dim"></div>
      <div class="crush-stage">
        ${MIND_CRUSH_EYE_SVG}
        <span class="crush-sparkle">✦</span>
        <div class="crush-text">"I can see your ${label}...<br>how predictable."</div>
      </div>
    `
  });
  if (!overlay) return;

  crushEgg.busy = true;
  playSound({ name: 'mind-crush' });
  setTimeout(() => { crushEgg.busy = false; }, MIND_CRUSH_TOTAL_MS);
}

// Pegasus's Millennium Eye: a gold Eye of Horus with an eyelid that winks.
const MIND_CRUSH_EYE_SVG = `
  <svg class="crush-eye" viewBox="0 0 200 130" aria-hidden="true">
    <defs>
      <clipPath id="crush-eye-shape"><path d="M22 58 Q100 0 178 58 Q100 108 22 58 Z"/></clipPath>
      <radialGradient id="crush-eye-iris">
        <stop offset="0" stop-color="#fff7d6"/>
        <stop offset="0.45" stop-color="#fbbf24"/>
        <stop offset="1" stop-color="#92400e"/>
      </radialGradient>
    </defs>
    <path d="M22 58 Q100 0 178 58 Q100 108 22 58 Z" fill="#fefce8"/>
    <g clip-path="url(#crush-eye-shape)">
      <circle class="crush-iris" cx="100" cy="58" r="27" fill="url(#crush-eye-iris)"/>
      <circle class="crush-iris" cx="100" cy="58" r="11" fill="#1c0a03"/>
      <rect class="crush-lid" x="0" y="0" width="200" height="110" fill="#d97706"/>
    </g>
    <g fill="none" stroke="#f59e0b" stroke-width="7" stroke-linecap="round" stroke-linejoin="round">
      <path d="M22 58 Q100 0 178 58 Q100 108 22 58 Z"/>
      <path d="M32 30 Q100 -8 168 28"/>
      <path d="M86 98 L80 124"/>
      <path d="M120 97 Q142 118 162 103 Q172 95 164 87"/>
    </g>
  </svg>
`;
