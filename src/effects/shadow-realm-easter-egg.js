// Defeat easter egg. When a player's LP hits 0 there's a small chance
// (SHADOW_REALM_CHANCE) that they lose a Shadow Game instead: purple fog
// creeps in from the edges, a vortex tears open in the middle of the screen
// and swallows the whole duel, the Millennium Eye glares out of the darkness
// with "Banished to the Shadow Realm...", and then the fog lifts and the duel
// drifts back. A sinister howl plays along (see 'shadow-realm' in sounds.js).
//
// Escape: tap the screen SHADOW_ESCAPE_TAPS times in a row (each within
// SHADOW_ESCAPE_GAP_MS of the last) any time during the Shadow Realm and your
// soul refuses to stay banished — the darkness shatters, the duel snaps back
// early and a rebellious power chord plays ('shadow-escape').
const SHADOW_REALM_CHANCE = 0.1;
// Keep in sync with the `shadow-*` timings in effects.css.
const SHADOW_VORTEX_GONE_MS = 3700;
const SHADOW_ESCAPE_FROM_MS = 0; // e.g. 1200 = vortex opens, 3300 = banish text shows
const SHADOW_TOTAL_MS = 7500;
const SHADOW_MOTE_COUNT = 28;
const SHADOW_ESCAPE_TAPS = 10;
const SHADOW_ESCAPE_GAP_MS = 700;
const SHADOW_ESCAPE_TOTAL_MS = 2600;

const shadowEgg = { busy: false, startedAt: 0, taps: [] };

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
  markEggFound('shadow-realm');
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
  shadowEgg.startedAt = performance.now();
  shadowEgg.taps = [];
  overlay.addEventListener('pointerdown', () => tapShadowRealm(app, overlay));
  restartClass(app, 'fx-shadow-absorb', SHADOW_TOTAL_MS);
  setTimeout(() => {
    // The duel is gone: stop the infinite spin so the fade-back stays smooth.
    overlay.querySelectorAll('.shadow-vortex, .shadow-motes').forEach(el => el.remove());
  }, SHADOW_VORTEX_GONE_MS);
  setTimeout(() => { shadowEgg.busy = false; }, SHADOW_TOTAL_MS);
}

// Taps count from SHADOW_ESCAPE_FROM_MS on, and they have to keep coming.
function tapShadowRealm(app, overlay) {
  const now = performance.now();
  if (now - shadowEgg.startedAt < SHADOW_ESCAPE_FROM_MS) return;

  const last = shadowEgg.taps[shadowEgg.taps.length - 1];
  shadowEgg.taps = last !== undefined && now - last <= SHADOW_ESCAPE_GAP_MS ? [...shadowEgg.taps, now] : [now];
  if (shadowEgg.taps.length >= SHADOW_ESCAPE_TAPS) escapeShadowRealm(app, overlay);
}

function escapeShadowRealm(app, overlay) {
  shadowEgg.taps = [];
  overlay.remove();
  app.classList.remove('fx-shadow-absorb');
  restartClass(app, 'fx-shadow-snap', 700);
  playSound({ name: 'shadow-escape' });
  spawnFx('fx-shadow-escape', SHADOW_ESCAPE_TOTAL_MS + 100, {
    html: `
      <div class="escape-flash"></div>
      <div class="escape-shards">${renderEscapeShards()}</div>
      <div class="escape-text"><span>Your soul refuses<br>to stay banished!</span></div>
    `
  });
}

// Shards of the shattered darkness flying outwards from the middle.
function renderEscapeShards() {
  return Array.from({ length: 16 }, (_, i) => {
    const angle = (i / 16) * Math.PI * 2 + rand(-0.15, 0.15);
    const distance = rand(0.45, 0.75) * Math.hypot(window.innerWidth, window.innerHeight);
    const vars = [
      `--sx: ${(Math.cos(angle) * distance).toFixed(0)}px`,
      `--sy: ${(Math.sin(angle) * distance).toFixed(0)}px`,
      `--sr: ${rand(-360, 360).toFixed(0)}deg`,
      `--ss: ${rand(30, 70).toFixed(0)}px`
    ].join('; ');
    return `<span class="escape-shard" style="${vars}"></span>`;
  }).join('');
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
