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
  markEggFound('exodia');
  logoEgg.busy = true;
  playSound({ name: 'logo-obliterate' });

  // A copy of the logo sits above the darkness, then flies to Exodia's hands.
  // The Duel Disk game passes the Exodia card instead of the logo.
  const r = (logo.querySelector('img') || logo).getBoundingClientRect();
  const overlay = spawnFx('fx-exodia', EXODIA_TOTAL_MS + 100, {
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
        <div class="exo-figure-wrap"><div class="exo-body">${EXODIA_SVG}</div></div>
                <div class="exo-vignette"></div>        <div class="exo-logo"><img src="./logo.jpg" alt="" /></div>
        <div class="exo-orb"></div>
      </div>
      <div class="exo-white"></div>
    `
  });

  setTimeout(() => {
    // The hidden scene keeps its infinite animations (and the 40x blown-up
    // orb) running, which starves the white fade of frames so it pops
    // instead of fading. Drop it once the screen is fully white.
    overlay?.querySelector('.exo-scene')?.remove();
    resetLogoEgg();
    restartClass(document.getElementById('app'), 'fx-exodia-wake', EXODIA_TOTAL_MS - EXODIA_WHITEOUT_MS);
  }, EXODIA_WHITEOUT_MS);
  setTimeout(() => { logoEgg.busy = false; }, EXODIA_TOTAL_MS);
}

// Fingers of the left hand cupping the ball at (200, 400), drawn in order so
// each one overlaps the previous. Each finger is a chain of tapering segments
// (knuckle -> joints -> tip) fanning out from the back of the hand in front of
// it. The shorter, thicker two-segment thumb sits on top behind the others;
// below it the index, middle, ring and pinky stack downwards, each in front
// of the one above, curling around the ball.
const EXODIA_FINGERS = [
  { points: [[114, 382], [140, 350], [168, 352]], widths: [23, 18] },
  { points: [[120, 392], [148, 378], [171, 380], [185, 392]], widths: [21, 18, 14] },
  { points: [[124, 410], [152, 402], [174, 406], [185, 419]], widths: [21, 18, 14] },
  { points: [[123, 428], [149, 428], [169, 434], [178, 447]], widths: [20, 17, 13] },
  { points: [[118, 446], [140, 452], [158, 458], [166, 470]], widths: [17, 14, 11] }
];

const svgNum = n => Math.round(n * 10) / 10;

// One segmented finger: outline, gold, shading and highlight per phalanx,
// crease lines at the joints and a nail at the tip.
function renderExodiaFinger({ points, widths }) {
  const segments = points.slice(0, -1).map((a, i) => {
    const b = points[i + 1];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const d = [(b[0] - a[0]) / len, (b[1] - a[1]) / len];
    return { a, b, d, n: [-d[1], d[0]], w: widths[i] };
  });
  const line = (a, b, attrs) =>
    `<line x1="${svgNum(a[0])}" y1="${svgNum(a[1])}" x2="${svgNum(b[0])}" y2="${svgNum(b[1])}" stroke-linecap="round" ${attrs}/>`;
  const shift = (p, v, k) => [p[0] + v[0] * k, p[1] + v[1] * k];

  // The normal pointing up-left gets the highlight, the other side the shadow.
  const lit = ({ n }) => (n[0] + n[1] < 0 ? 1 : -1);

  const outline = segments.map(s => line(s.a, s.b, `stroke="#3b1d04" stroke-width="${s.w + 5}"`)).join('');
  const gold = segments.map(s => line(s.a, s.b, `stroke="#dba43c" stroke-width="${s.w}"`)).join('');
  const shade = segments.map(s => {
    const k = -lit(s) * s.w * 0.28;
    return line(shift(shift(s.a, s.n, k), s.d, 2), shift(shift(s.b, s.n, k), s.d, -2),
      `stroke="#9a6416" stroke-width="${svgNum(s.w * 0.3)}" stroke-opacity="0.55"`);
  }).join('');
  const shine = segments.map(s => {
    const k = lit(s) * s.w * 0.22;
    return line(shift(shift(s.a, s.n, k), s.d, 2.5), shift(shift(s.b, s.n, k), s.d, -2.5),
      `stroke="#fff1b8" stroke-width="${svgNum(s.w * 0.22)}" stroke-opacity="0.8"`);
  }).join('');

  // Knuckle creases: a short curved line across the finger at each joint.
  const creases = segments.slice(1).map(s => {
    const half = s.w / 2;
    const p1 = shift(s.a, s.n, half);
    const p2 = shift(s.a, s.n, -half);
    const c = shift(s.a, s.d, 3);
    return `<path d="M${svgNum(p1[0])} ${svgNum(p1[1])} Q${svgNum(c[0])} ${svgNum(c[1])} ${svgNum(p2[0])} ${svgNum(p2[1])}" fill="none" stroke="#3b1d04" stroke-width="1.6" stroke-linecap="round"/>`;
  }).join('');

  const tip = segments[segments.length - 1];
  const nailC = shift(tip.b, tip.d, tip.w * 0.08);
  const angle = Math.atan2(tip.d[1], tip.d[0]) * 180 / Math.PI;
  const nail = `<ellipse cx="${svgNum(nailC[0])}" cy="${svgNum(nailC[1])}" rx="${svgNum(tip.w * 0.42)}" ry="${svgNum(tip.w * 0.3)}" transform="rotate(${svgNum(angle)} ${svgNum(nailC[0])} ${svgNum(nailC[1])})" fill="#fff6d5" stroke="#3b1d04" stroke-width="1.2"/>`;

  return `<g>${outline}${gold}${shade}${shine}${creases}${nail}</g>`;
}

// Big rounded teeth in his grin, longest in the middle (upper lip at y ~257).
const EXODIA_TEETH = [-3, -2, -1, 0, 1, 2, 3].map(i => {
  const x0 = 200 + i * 4.8 - 2.3;
  const x1 = x0 + 4.6;
  const bottom = 278 - Math.abs(i) * 3;
  return `<path d="M${x0} 252 L${x0} ${bottom - 2} Q${x0 + 2.3} ${bottom + 1.5} ${x1} ${bottom - 2} L${x1} 252 Z" fill="#fff" stroke-width="1.2"/>`;
}).join('');

// Glowing eyes (a soft blurred copy under a crisp one).
function exodiaEyes(fill, filterId) {
  const eyes = `<path d="M177 228 Q186 227 195 236 Q187 239 179 235 Z"/><path d="M223 228 Q214 227 205 236 Q213 239 221 235 Z"/>`;
  return `<g fill="${fill}"><g filter="url(#${filterId})" opacity="0.9">${eyes}</g>${eyes}</g>`;
}

// Exodia, the Forbidden One, cupping the energy ball at (200, 400) — which
// lines up with EXODIA_ORB_Y on screen (see .exo-figure-wrap). The SVG itself
// is static so the phone's GPU only has to rasterize it once; the pulsing
// white-hot eyes and the ball's glow are separate layers that only animate
// opacity (cheap, compositor-only).
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
    <linearGradient id="exoFace" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#4338ca"/>
      <stop offset="1" stop-color="#1e1b4b"/>
    </linearGradient>
    <linearGradient id="exoBeard" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#7dd3e0"/>
      <stop offset="0.5" stop-color="#45a8bb"/>
      <stop offset="1" stop-color="#2b7f91"/>
    </linearGradient>
    <filter id="exoEyeGlow" x="-100%" y="-200%" width="300%" height="500%">
      <feGaussianBlur stdDeviation="2.5"/>
    </filter>
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
      ${EXODIA_FINGERS.map(renderExodiaFinger).join('')}
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
    <path d="M189 284 L211 284 L214 362 Q200 370 186 362 Z" fill="url(#exoBeard)"/>
    <path d="M191 296 L209 296 M191 305 L209 305 M191 314 L209 314 M190 323 L210 323 M190 332 L210 332 M190 341 L210 341 M189 350 L211 350" stroke="#1f5f6e" stroke-width="2"/>
    <path d="M192 290 L190 358" stroke="#cffafe" stroke-width="2" stroke-opacity="0.7"/>
    <path d="M170 236 L230 236 L226 262 L210 290 L200 300 L190 290 L174 262 Z" fill="url(#exoFace)"/>
    ${EXODIA_TEETH}
    <path d="M168 206 Q200 197 232 206 L233 250 Q229 272 214 290 L208 286 Q216 270 217 257 L200 262 L183 257 Q184 270 192 286 L186 290 Q171 272 167 250 Z" fill="url(#exoGold)"/>
    <path d="M174 226 Q186 224 197 236 Q187 242 177 236 Z M226 226 Q214 224 203 236 Q213 242 223 236 Z" fill="#1e1b4b" stroke-width="2"/>
    <g fill="none" stroke-width="1.5">
      <path d="M171 219 Q186 216 198 228 M229 219 Q214 216 202 228"/>
      <path d="M178 243 Q186 247 194 244 M222 243 Q214 247 206 244"/>
      <path d="M171 250 Q174 264 182 274 M229 250 Q226 264 218 274"/>
    </g>
    <path d="M196 212 L204 212 L203 250 L200 258 L197 250 Z" fill="url(#exoGold)" stroke-width="2"/>
    <path d="M200 166 Q184 170 185 188 Q186 204 196 214 L204 214 Q214 204 215 188 Q216 170 200 166 Z" fill="url(#exoGoldR)"/>
    <path d="M193 186 L207 186 M192 194 L208 194 M194 202 L206 202" stroke-width="2.5"/>
  </g>
  <circle cx="200" cy="177" r="4" fill="#ef4444" stroke="#3b1d04" stroke-width="1.5"/>
  <circle cx="198.7" cy="175.7" r="1.3" fill="#fecaca"/>
  ${exodiaEyes('#f59e0b', 'exoEyeGlow')}
  <g stroke="#3b1d04" stroke-width="3" stroke-linejoin="round">
    <use href="#exoHand"/>
    <use href="#exoHand" transform="translate(400 0) scale(-1 1)"/>
  </g>
</svg>
<svg class="exo-eyes-hot" viewBox="0 0 400 600" aria-hidden="true">
  <defs>
    <filter id="exoEyeGlowHot" x="-100%" y="-200%" width="300%" height="500%">
      <feGaussianBlur stdDeviation="2.5"/>
    </filter>
  </defs>
  ${exodiaEyes('#fffbe6', 'exoEyeGlowHot')}
</svg>
<div class="exo-glow"></div>`;
