// Duel-screen easter egg. Hold the Quest's Complete button for GAIA_PRESS_MS
// (it stamps like an impatient hoof) and Gaia the Fierce Knight gallops in
// from the left, skewers the button on his lance and carries it off-screen
// ("heeelp!"). A beat later he gallops back from the right and drops it
// neatly back into place with a boing and a fanfare: "Quest delivered.
// Express shipping." The click that follows the hold is swallowed so the
// Quest isn't completed. The sound is 'gaia-gallop' in sounds.js.
//
// The knight and the carried button are animated with the Web Animations API
// because their keyframes depend on the button's position on screen.
const GAIA_PRESS_MS = 2000;
const GAIA_TOTAL_MS = 4600;
// The two passes across the screen (seconds).
const GAIA_PASS1 = [0.4, 1.5];
const GAIA_PASS2 = [2.1, 3.2];
// The rider's box and where its lance tip sits inside it (facing right).
const GAIA_W = 180;
const GAIA_H = 150;
const GAIA_LANCE_Y = 60;
// How far past the button's centre the lance tip pokes through it.
const GAIA_SKEWER = 30;

const gaiaEgg = { timer: null, busy: false, swallowClick: false };

function startGaiaPress(el) {
  gaiaEgg.swallowClick = false;
  if (gaiaEgg.busy) return;
  clearTimeout(gaiaEgg.timer);
  el.classList.add('gaia-charging');
  gaiaEgg.timer = setTimeout(() => {
    el.classList.remove('gaia-charging');
    summonGaia(el);
  }, GAIA_PRESS_MS);
}

function cancelGaiaPress(el) {
  clearTimeout(gaiaEgg.timer);
  el.classList.remove('gaia-charging');
}

// The Complete button's onclick asks this first: false right after a hold.
function gaiaAllowsClick() {
  if (!gaiaEgg.swallowClick) return true;
  gaiaEgg.swallowClick = false;
  return false;
}

const GAIA_SVG = `
  <svg viewBox="0 0 ${GAIA_W} ${GAIA_H}" width="${GAIA_W}" height="${GAIA_H}" aria-hidden="true">
    <path d="M47 98 Q24 98 20 122 Q34 110 50 104 Z" fill="#e11d48"/>
    <g class="gaia-legs-a" stroke="#2e1065" stroke-width="7" stroke-linecap="round">
      <line x1="64" y1="108" x2="58" y2="138"/>
      <line x1="112" y1="108" x2="120" y2="138"/>
    </g>
    <g class="gaia-legs-b" stroke="#3b0764" stroke-width="7" stroke-linecap="round">
      <line x1="74" y1="108" x2="80" y2="138"/>
      <line x1="104" y1="108" x2="98" y2="138"/>
    </g>
    <ellipse cx="86" cy="98" rx="42" ry="19" fill="#4c1d95" stroke="#1e1b4b" stroke-width="2"/>
    <path d="M114 92 L134 62 Q140 54 151 58 L161 67 Q163 74 155 75 L143 73 L128 99 Z" fill="#4c1d95" stroke="#1e1b4b" stroke-width="2"/>
    <path d="M116 86 L131 59 L125 56 L109 84 Z" fill="#e11d48"/>
    <circle cx="148" cy="63" r="2" fill="#fde047"/>
    <path d="M70 48 Q50 70 42 96 L78 86 Z" fill="#b91c1c"/>
    <path d="M77 84 L75 54 Q86 42 98 51 L99 84 Z" fill="#1d4ed8" stroke="#fbbf24" stroke-width="2"/>
    <polygon points="112,66 166,74 114,81" fill="#db2777" stroke="#831843" stroke-width="1.5"/>
    <polygon points="118,53 178,${GAIA_LANCE_Y} 118,68" fill="#f472b6" stroke="#9d174d" stroke-width="1.5"/>
    <path d="M132 56 L134 66 M146 57 L147 64 M160 58 L160 62" stroke="#9d174d" stroke-width="1.5"/>
    <rect x="96" y="56" width="24" height="7" rx="3" fill="#fbbf24"/>
    <circle cx="100" cy="64" r="5" fill="#1e3a8a" stroke="#fbbf24" stroke-width="1.5"/>
    <circle cx="87" cy="40" r="10" fill="#1e3a8a" stroke="#fbbf24" stroke-width="2"/>
    <path d="M80 34 L72 22 L84 31 Z M94 34 L102 22 L90 31 Z" fill="#fbbf24"/>
    <line x1="83" y1="41" x2="96" y2="41" stroke="#fde047" stroke-width="2"/>
  </svg>`;

function summonGaia(button) {
  const r = button.getBoundingClientRect();
  const vw = window.innerWidth;
  const bx = r.left + r.width / 2;
  const by = r.top + r.height / 2;
  const T = GAIA_TOTAL_MS / 1000;
  const at = s => Math.min(1, Math.max(0, s / T));

  // Pass 1 (left → right): rider's left edge runs -W → vw, lance tip = left + W.
  const [p1s, p1e] = GAIA_PASS1;
  const v1 = (vw + GAIA_W) / (p1e - p1s);
  const hit = p1s + (bx + GAIA_SKEWER) / v1;
  const carryOut = vw + GAIA_W - GAIA_SKEWER - bx;
  // Pass 2 (right → left, mirrored): left edge runs start2 → -W, lance tip = left.
  const [p2s, p2e] = GAIA_PASS2;
  const start2 = vw + r.width;
  const v2 = (start2 + GAIA_W) / (p2e - p2s);
  const drop = p2s + (start2 - (bx - GAIA_SKEWER)) / v2;
  const carryIn = start2 + GAIA_SKEWER - bx;

  const clone = button.cloneNode(true);
  ['onclick', 'onpointerdown', 'onpointerup', 'onpointerleave', 'onpointercancel', 'oncontextmenu'].forEach(a => clone.removeAttribute(a));
  clone.classList.add('gaia-clone');
  clone.style.cssText = `left: ${r.left.toFixed(0)}px; top: ${r.top.toFixed(0)}px; width: ${r.width.toFixed(0)}px; height: ${r.height.toFixed(0)}px;`;

  const overlay = spawnFx('fx-gaia', GAIA_TOTAL_MS + 100, {
    vars: {
      '--gaia-top': `${(by - GAIA_LANCE_Y).toFixed(0)}px`,
      '--gaia-help-y': `${(r.top - 34).toFixed(0)}px`
    },
    html: `
      <div class="gaia-rider"><div class="gaia-bob">${GAIA_SVG}<span class="gaia-dust"></span></div></div>
      <div class="gaia-help">heeelp!</div>
      <div class="gaia-toast">Quest delivered. Express shipping. 📦</div>
    `
  });
  if (!overlay) return;
  overlay.appendChild(clone);

  gaiaEgg.busy = true;
  gaiaEgg.swallowClick = true;
  markEggFound('gaia');
  playSound({ name: 'gaia-gallop', hit, drop });
  button.classList.add('gaia-hidden');

  const opts = { duration: GAIA_TOTAL_MS, fill: 'both', easing: 'linear' };
  const ride = (x, flip) => `translateX(${x.toFixed(0)}px) scaleX(${flip ? -1 : 1})`;
  overlay.querySelector('.gaia-rider').animate([
    { offset: 0, transform: ride(-GAIA_W, false) },
    { offset: at(p1s), transform: ride(-GAIA_W, false) },
    { offset: at(p1e), transform: ride(vw, false) },
    { offset: at(p2s), transform: ride(start2, true) },
    { offset: at(p2e), transform: ride(-GAIA_W, true) },
    { offset: 1, transform: ride(-GAIA_W, true) }
  ], opts);

  const carry = (x, y, deg, sx = 1, sy = 1) => `translate(${x.toFixed(0)}px, ${y}px) rotate(${deg}deg) scale(${sx}, ${sy})`;
  const lifted = Math.min(hit + 0.08, p1e);
  clone.animate([
    { offset: 0, transform: carry(0, 0, 0) },
    { offset: at(hit), transform: carry(0, 0, 0) },
    { offset: at(lifted), transform: carry((lifted - hit) * v1, -10, -7) },
    { offset: at(p1e), transform: carry(carryOut, -10, -7) },
    { offset: at(p2s), transform: carry(carryIn, -10, 7) },
    { offset: at(drop), transform: carry(0, -10, 7) },
    { offset: at(drop + 0.14), transform: carry(0, 0, 0, 1.12, 0.84) },
    { offset: at(drop + 0.26), transform: carry(0, -12, 0, 0.95, 1.08) },
    { offset: at(drop + 0.38), transform: carry(0, 0, 0) },
    { offset: 1, transform: carry(0, 0, 0) }
  ], opts);

  overlay.querySelector('.gaia-help').animate([
    { offset: 0, opacity: 0, transform: 'scale(0.6)' },
    { offset: at(p1e + 0.05), opacity: 0, transform: 'scale(0.6)' },
    { offset: at(p1e + 0.15), opacity: 1, transform: 'scale(1.1)' },
    { offset: at(p2s - 0.15), opacity: 1, transform: 'scale(1) rotate(-4deg)' },
    { offset: at(p2s - 0.05), opacity: 0, transform: 'scale(0.8)' },
    { offset: 1, opacity: 0, transform: 'scale(0.8)' }
  ], opts);

  overlay.querySelector('.gaia-toast').animate([
    { offset: 0, opacity: 0, transform: 'translate(-50%, 12px)' },
    { offset: at(drop + 0.35), opacity: 0, transform: 'translate(-50%, 12px)' },
    { offset: at(drop + 0.55), opacity: 1, transform: 'translate(-50%, 0)' },
    { offset: at(T - 0.35), opacity: 1, transform: 'translate(-50%, 0)' },
    { offset: 1, opacity: 0, transform: 'translate(-50%, -8px)' }
  ], opts);

  setTimeout(() => {
    button.classList.remove('gaia-hidden');
    gaiaEgg.busy = false;
  }, GAIA_TOTAL_MS);
}
