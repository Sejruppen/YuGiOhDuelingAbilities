// Defeat easter egg. When a player's LP hits 0 there's a small chance
// (SHADOW_REALM_CHANCE) that they lose a Shadow Game instead: purple fog
// creeps in from the edges, a vortex tears open in the middle of the screen
// and swallows the whole duel, the Millennium Eye glares out of the darkness
// with "Banished to the Shadow Realm...", and then the fog lifts and the duel
// drifts back. A sinister howl plays along (see 'shadow-realm' in sounds.js).
const SHADOW_REALM_CHANCE = 0.1;
// Keep in sync with the `shadow-*` timings in effects.css.
const SHADOW_VORTEX_GONE_MS = 3700;
const SHADOW_TOTAL_MS = 7500;
const SHADOW_MOTE_COUNT = 28;

const shadowEgg = { busy: false };

function rollShadowRealm() {
  return !shadowEgg.busy && !prefersReducedMotion() && Math.random() < SHADOW_REALM_CHANCE;
}

// Wisps of shadow pulled in from all around the screen towards the vortex.
function renderShadowMotes() {
  const reach = Math.hypot(window.innerWidth, window.innerHeight) * 0.6;
  return Array.from({ length: SHADOW_MOTE_COUNT }, () => {
    const angle = rand(0, Math.PI * 2);
    const distance = rand(0.55, 1) * reach;
    const vars = [
      `--mx: ${(Math.cos(angle) * distance).toFixed(0)}px`,
      `--my: ${(Math.sin(angle) * distance).toFixed(0)}px`,
      `--ms: ${rand(6, 16).toFixed(1)}px`,
      `--mr: ${rand(-540, 540).toFixed(0)}deg`,
      `--md: ${rand(0.6, 2).toFixed(2)}s`
    ].join('; ');
    return `<span class="shadow-mote" style="${vars}"></span>`;
  }).join('');
}

function triggerShadowRealm(app) {
  const overlay = spawnFx('fx-shadow-realm', SHADOW_TOTAL_MS + 100, {
    html: `
      <div class="shadow-fog"></div>
      <div class="shadow-vortex"><div class="shadow-vortex-spin"></div></div>
      <div class="shadow-motes">${renderShadowMotes()}</div>
      <div class="shadow-flash"></div>
      <div class="shadow-banish">
        ${SHADOW_EYE_SVG}
        <div class="shadow-text">Banished to the<br>Shadow Realm...</div>
      </div>
    `
  });
  if (!overlay) return;

  shadowEgg.busy = true;
  restartClass(app, 'fx-shadow-absorb', SHADOW_TOTAL_MS);
  setTimeout(() => {
    // The duel is gone: stop the infinite spin so the fade-back stays smooth.
    overlay.querySelectorAll('.shadow-vortex, .shadow-motes').forEach(el => el.remove());
  }, SHADOW_VORTEX_GONE_MS);
  setTimeout(() => { shadowEgg.busy = false; }, SHADOW_TOTAL_MS);
}

// The Millennium Eye: a gold Eye of Horus with a glowing pupil.
const SHADOW_EYE_SVG = `
  <svg class="shadow-eye" viewBox="0 0 200 120" aria-hidden="true">
    <defs>
      <filter id="shadow-eye-glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4"/></filter>
    </defs>
    <g fill="none" stroke="#fbbf24" stroke-width="7" stroke-linecap="round" stroke-linejoin="round">
      <path d="M20 55 Q100 -5 180 55 Q100 105 20 55 Z"/>
      <path d="M30 28 Q100 -10 170 25"/>
      <path d="M85 92 L80 116"/>
      <path d="M118 92 Q140 112 160 98 Q170 90 162 82"/>
    </g>
    <circle cx="100" cy="55" r="24" fill="#fbbf24"/>
    <circle class="shadow-eye-pupil" cx="100" cy="55" r="11" fill="#c084fc" filter="url(#shadow-eye-glow)"/>
    <circle cx="100" cy="55" r="9" fill="#2e1065"/>
  </svg>
`;
