// Start-screen easter egg. Each tap on the logo boings it with a note that
// climbs a semitone, and the logo glows brighter and brighter. Every
// LOGO_TAPS_PER_PIECE taps in a row lights one of five orbs around the logo
// (the pieces of Exodia). Light all five without pausing too long and Exodia
// is summoned: everything but the logo fades to black, Exodia rises from the
// flames, the logo flies into his hands as the energy ball, and he blasts the
// screen white before it fades back to the start screen.
const LOGO_TAPS_PER_PIECE = 4;
const EXODIA_PIECE_COUNT = 5;
const LOGO_TAPS_TO_SUMMON = LOGO_TAPS_PER_PIECE * EXODIA_PIECE_COUNT;
const LOGO_COMBO_TIMEOUT_MS = 1800;
// Keep in sync with the `exo-*` timings in effects.css.
const EXODIA_WHITEOUT_MS = 4600;
const EXODIA_TOTAL_MS = 9000;
const EXODIA_ORB_Y = 0.55;

const logoEgg = { taps: 0, timer: null, busy: false };

const getLogoCharge = () => Math.min(1, logoEgg.taps / LOGO_TAPS_TO_SUMMON);
const getLogoPieces = () => Math.floor(logoEgg.taps / LOGO_TAPS_PER_PIECE);

function renderLogoEgg() {
  const pieces = getLogoPieces();
  const orbs = Array.from({ length: EXODIA_PIECE_COUNT }, (_, i) =>
    `<span class="logo-piece${i < pieces ? ' is-lit' : ''}" style="--i: ${i}"></span>`
  ).join('');

  return `
    <button type="button" onclick="tapLogo(this)" class="logo-egg mb-6" data-pieces="${pieces}" style="--logo-charge: ${getLogoCharge()}">
      <span class="logo-halo"></span>
      <span class="logo-egg-core">
        <img src="./logo.jpg" alt="Yu-Gi-Oh! Companion Icon" class="w-32 h-32 rounded-full border-2 border-amber-500/40 shadow-xl shadow-emerald-500/10 object-cover" />
      </span>
      ${orbs}
    </button>
  `;
}

function paintLogoEgg(logo = document.querySelector('.logo-egg')) {
  if (!logo) return;
  const pieces = getLogoPieces();
  logo.dataset.pieces = pieces;
  logo.style.setProperty('--logo-charge', getLogoCharge());
  logo.querySelectorAll('.logo-piece').forEach((el, i) => el.classList.toggle('is-lit', i < pieces));
}

function tapLogo(logo) {
  if (logoEgg.busy) return;

  clearTimeout(logoEgg.timer);
  logoEgg.taps++;
  paintLogoEgg(logo);
  const pieces = getLogoPieces();
  logo.style.setProperty('--tilt', `${(logoEgg.taps % 2 ? -1 : 1) * (6 + getLogoCharge() * 18)}deg`);
  restartClass(logo, 'fx-logo-tap', 450);
  spawnParticles(logo, { type: 'quest', mode: 'burst', count: 6 + pieces * 3 });

  if (logoEgg.taps >= LOGO_TAPS_TO_SUMMON) {
    restartClass(logo.querySelectorAll('.logo-piece')[pieces - 1], 'fx-piece-pop', 500);
    summonExodia(logo);
    return;
  }

  if (logoEgg.taps % LOGO_TAPS_PER_PIECE === 0) {
    restartClass(logo.querySelectorAll('.logo-piece')[pieces - 1], 'fx-piece-pop', 500);
    playSound({ name: 'logo-piece', piece: pieces });
  } else {
    playSound({ name: 'logo-tap', combo: logoEgg.taps });
  }
  logoEgg.timer = setTimeout(scatterLogoPieces, LOGO_COMBO_TIMEOUT_MS);
}

function scatterLogoPieces() {
  if (getLogoPieces() > 0) playSound({ name: 'logo-scatter' });
  resetLogoEgg();
}

function resetLogoEgg() {
  logoEgg.taps = 0;
  paintLogoEgg();
}

function summonExodia(logo) {
  logoEgg.busy = true;
  playSound({ name: 'logo-obliterate' });

  // A copy of the logo sits above the darkness, then flies to Exodia's hands.
  const r = logo.querySelector('img').getBoundingClientRect();
  spawnFx('fx-exodia', EXODIA_TOTAL_MS + 100, {
    vars: {
      '--lx': `${r.left}px`,
      '--ly': `${r.top}px`,
      '--ls': `${r.width}px`,
      '--tx': `${window.innerWidth / 2 - (r.left + r.width / 2)}px`,
      '--ty': `${window.innerHeight * EXODIA_ORB_Y - (r.top + r.height / 2)}px`
    },
    html: `
      <div class="exo-scene">
        <div class="exo-black"></div>
        <div class="exo-fire"></div>
        <div class="exo-figure-wrap">${EXODIA_SVG}</div>
        <div class="exo-logo"><img src="./logo.jpg" alt="" /></div>
        <div class="exo-orb"></div>
      </div>
      <div class="exo-white"></div>
    `
  });

  setTimeout(() => {
    resetLogoEgg();
    restartClass(document.getElementById('app'), 'fx-exodia-wake', EXODIA_TOTAL_MS - EXODIA_WHITEOUT_MS);
  }, EXODIA_WHITEOUT_MS);
  setTimeout(() => { logoEgg.busy = false; }, EXODIA_TOTAL_MS);
}

// Exodia, the Forbidden One, cupping the energy ball at (200, 400) — which
// lines up with EXODIA_ORB_Y on screen (see .exo-figure-wrap).
const EXODIA_SVG = `
<svg class="exo-figure" viewBox="0 0 400 600" aria-hidden="true">
  <defs>
    <linearGradient id="exoGold" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fde68a"/>
      <stop offset="0.5" stop-color="#e0a52a"/>
      <stop offset="1" stop-color="#7a4a0e"/>
    </linearGradient>
    <radialGradient id="exoGoldR" cx="0.45" cy="0.35" r="0.7">
      <stop offset="0" stop-color="#fff3b0"/>
      <stop offset="0.5" stop-color="#e8b04a"/>
      <stop offset="1" stop-color="#7a4a0e"/>
    </radialGradient>
    <radialGradient id="exoGlow">
      <stop offset="0" stop-color="#fff" stop-opacity="0.95"/>
      <stop offset="0.3" stop-color="#fde047" stop-opacity="0.65"/>
      <stop offset="1" stop-color="#f59e0b" stop-opacity="0"/>
    </radialGradient>
    <pattern id="exoStripesL" width="18" height="18" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
      <rect width="18" height="18" fill="#7e22ce"/>
      <rect width="9" height="18" fill="#f9c6e3"/>
    </pattern>
    <pattern id="exoStripesR" width="18" height="18" patternUnits="userSpaceOnUse" patternTransform="rotate(-35)">
      <rect width="18" height="18" fill="#7e22ce"/>
      <rect width="9" height="18" fill="#f9c6e3"/>
    </pattern>
    <g id="exoHand">
      <path d="M10 300 Q15 420 95 445 L140 405 Q92 365 92 290 Z" fill="url(#exoGold)"/>
      <g fill="none" stroke-width="5" stroke="#57534e">
        <ellipse cx="88" cy="478" rx="9" ry="14"/>
        <ellipse cx="80" cy="503" rx="6" ry="14" stroke="#78716c"/>
        <ellipse cx="72" cy="528" rx="9" ry="14"/>
        <ellipse cx="64" cy="553" rx="6" ry="14" stroke="#78716c"/>
        <ellipse cx="56" cy="578" rx="9" ry="14"/>
      </g>
      <ellipse cx="118" cy="418" rx="40" ry="48" fill="url(#exoGoldR)"/>
      <rect x="128" y="352" width="62" height="22" rx="11" fill="url(#exoGoldR)" transform="rotate(25 128 363)"/>
      <rect x="132" y="381" width="66" height="22" rx="11" fill="url(#exoGoldR)" transform="rotate(8 132 392)"/>
      <rect x="132" y="410" width="66" height="22" rx="11" fill="url(#exoGoldR)" transform="rotate(-8 132 421)"/>
      <rect x="128" y="438" width="60" height="22" rx="11" fill="url(#exoGoldR)" transform="rotate(-25 128 449)"/>
      <rect x="96" y="448" width="54" height="24" rx="12" fill="url(#exoGoldR)" transform="rotate(-40 96 460)"/>
    </g>
  </defs>
  <g stroke="#3b1d04" stroke-width="3" stroke-linejoin="round">
    <path d="M165 170 Q120 110 95 30 Q150 85 188 150 Z" fill="url(#exoGold)"/>
    <path d="M235 170 Q280 110 305 30 Q250 85 212 150 Z" fill="url(#exoGold)"/>
    <path d="M118 195 Q60 160 30 100 Q90 135 138 172 Z" fill="url(#exoGold)"/>
    <path d="M282 195 Q340 160 370 100 Q310 135 262 172 Z" fill="url(#exoGold)"/>
    <ellipse cx="68" cy="268" rx="95" ry="85" fill="url(#exoGoldR)"/>
    <ellipse cx="332" cy="268" rx="95" ry="85" fill="url(#exoGoldR)"/>
    <path d="M120 230 L280 230 Q300 330 285 610 L115 610 Q100 330 120 230 Z" fill="url(#exoGold)"/>
    <path d="M200 300 L200 610 M150 470 Q200 488 250 470 M145 520 Q200 540 255 520 M140 570 Q200 592 260 570" fill="none"/>
    <g fill="none" stroke-width="4">
      <path d="M140 330 m0 -4 a4 4 0 1 1 -4 4 a8 8 0 0 1 8 -8 a12 12 0 0 1 12 12 a16 16 0 0 1 -16 16 a20 20 0 0 1 -20 -20"/>
      <path d="M260 330 m0 -4 a4 4 0 1 0 4 4 a8 8 0 0 0 -8 -8 a12 12 0 0 0 -12 12 a16 16 0 0 0 16 16 a20 20 0 0 0 20 -20"/>
    </g>
    <path d="M160 255 Q200 305 240 255 L236 292 Q200 322 164 292 Z" fill="url(#exoGold)"/>
    <path d="M200 150 Q150 155 130 200 Q108 245 88 272 L150 282 Q160 242 175 215 L200 205 Z" fill="url(#exoStripesL)"/>
    <path d="M200 150 Q250 155 270 200 Q292 245 312 272 L250 282 Q240 242 225 215 L200 205 Z" fill="url(#exoStripesR)"/>
    <path d="M150 182 Q200 135 250 182 Q200 165 150 182 Z" fill="url(#exoGold)"/>
    <path d="M175 210 Q200 200 225 210 L228 260 Q215 292 200 294 Q185 292 172 260 Z" fill="#5b1a3a"/>
    <path d="M175 228 L198 237 M225 228 L202 237" stroke="#1a0510" stroke-width="4"/>
    <path d="M200 182 Q190 195 195 212 L205 212 Q210 195 200 182 Z" fill="url(#exoGold)"/>
  </g>
  <circle cx="200" cy="196" r="3.5" fill="#dc2626"/>
  <path class="exo-eye" d="M178 233 L197 240 L181 245 Z"/>
  <path class="exo-eye" d="M222 233 L203 240 L219 245 Z"/>
  <path d="M183 266 Q200 282 217 266 Q200 274 183 266 Z" fill="#1a0510"/>
  <path d="M187 268 L190 274 L193 270 L196 276 L200 271 L204 276 L207 270 L210 274 L213 268 Z" fill="#fff"/>
  <g stroke="#3b1d04" stroke-width="3" stroke-linejoin="round">
    <use href="#exoHand"/>
    <use href="#exoHand" transform="translate(400 0) scale(-1 1)"/>
  </g>
  <circle class="exo-glow" cx="200" cy="400" r="200" fill="url(#exoGlow)"/>
</svg>`;
