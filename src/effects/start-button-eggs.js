// Start-screen button eggs (hold for 2s). Both reuse the character eggs' gold
// "charging" glow (.cegg-press) and fx overlay base (.fx-cegg).
//  - Tournament: a Duelist Kingdom invitation flies in. The Millennium Eye seal
//    cracks, Pegasus's video message plays, then star chips rain down.
//  - Co-op Boss: the Friendship Sign. Four hands stack up, a marker draws Téa's
//    smiley across all of them, and it glows.
const START_EGG_PRESS_MS = 2000;
const INVITE_EGG_MS = 6000;
const FRIENDSHIP_EGG_MS = 5500;

const startEgg = { timer: null, swallowClick: false, busy: false };

function startStartEggPress(el, kind) {
  startEgg.swallowClick = false;
  if (startEgg.busy) return;
  clearTimeout(startEgg.timer);
  el.classList.add('cegg-charging');
  startEgg.timer = setTimeout(() => {
    el.classList.remove('cegg-charging');
    startEgg.swallowClick = true;
    if (kind === 'friendship') playFriendshipEgg();
    else playInvitationEgg();
  }, START_EGG_PRESS_MS);
}

function cancelStartEggPress(el) {
  clearTimeout(startEgg.timer);
  el.classList.remove('cegg-charging');
}

// The buttons' onclick asks this first: false right after a hold.
function startEggAllowsClick() {
  if (!startEgg.swallowClick) return true;
  startEgg.swallowClick = false;
  return false;
}

function spawnStartEgg(kind, lifetime, html) {
  const overlay = spawnFx(`fx-cegg fx-sbe fx-sbe--${kind}`, lifetime + 100, {
    vars: { '--cx': `${(window.innerWidth / 2).toFixed(0)}px`, '--cy': `${(window.innerHeight / 2).toFixed(0)}px` },
    html
  });
  if (!overlay) return null;
  startEgg.busy = true;
  setTimeout(() => { startEgg.busy = false; }, lifetime);
  return overlay;
}

// --- Tournament: the Duelist Kingdom invitation ------------------------------------

// Pegasus, VHS edition: silver hair over his left eye, the Millennium Eye
// glinting underneath, red suit and a smug little smile.
const PEGASUS_PORTRAIT_SVG = `
  <svg viewBox="0 0 120 120" aria-hidden="true">
    <path d="M28 42 Q28 8 60 8 Q92 8 92 42 L98 100 Q84 94 80 72 L40 72 Q36 94 22 100 Z" fill="#e5e7eb" stroke="#9ca3af" stroke-width="1.5"/>
    <path d="M10 120 Q18 88 60 84 Q102 88 110 120 Z" fill="#b91c1c" stroke="#7f1d1d" stroke-width="1.5"/>
    <path d="M47 85 L60 112 L73 85 Z" fill="#f8fafc"/>
    <path d="M54 86 Q60 96 66 86 Q62 100 60 104 Q58 100 54 86 Z" fill="#fecaca"/>
    <rect x="53" y="68" width="14" height="18" fill="#fcd9bd"/>
    <ellipse cx="60" cy="48" rx="22" ry="26" fill="#fde7d0" stroke="#d6a77a" stroke-width="1.2"/>
    <path d="M44 41 Q51 37 57 41" fill="none" stroke="#6b7280" stroke-width="1.8" stroke-linecap="round"/>
    <path d="M45 47 Q51 43 57 47 Q51 50 45 47 Z" fill="#fff" stroke="#374151" stroke-width="1"/>
    <circle cx="51" cy="47" r="1.9" fill="#4b5563"/>
    <circle class="sbe-portrait-meye" cx="70" cy="49" r="3.4" fill="#fbbf24" stroke="#b45309" stroke-width="1"/>
    <path d="M37 32 Q60 10 86 30 Q87 52 79 68 Q74 52 70 42 Q60 32 37 36 Z" fill="#f3f4f6" stroke="#9ca3af" stroke-width="1.2"/>
    <path d="M52 63 Q60 68 69 61" fill="none" stroke="#9a3412" stroke-width="1.8" stroke-linecap="round"/>
  </svg>`;

const INVITE_LINES = [
  'Greetings, Yugi-boy~ ♪',
  'Your grandfather\'s soul…',
  '…I mean — you\'re INVITED! ✨'
];

function playInvitationEgg() {
  markEggFound('dk-invitation');
  const chips = ceRange(26, i =>
    `<span class="sbe-chip" style="left: ${ceRand(2, 94).toFixed(0)}%; --i: ${i}; --d: ${ceRand(800, 1100).toFixed(0)}ms; --s: ${ceRand(0.75, 1.3).toFixed(2)}; --r: ${ceRand(-540, 540).toFixed(0)}deg;">★</span>`);
  const overlay = spawnStartEgg('invite', INVITE_EGG_MS, `
    <div class="sbe-dim sbe-dim--invite"></div>
    <div class="ce-at sbe-envelope">
      <span class="sbe-env-back"></span>
      <span class="sbe-letter"><b>DUELIST KINGDOM</b><i>Official invitation</i></span>
      <span class="sbe-env-front"></span>
      <span class="sbe-env-flap"></span>
      <span class="sbe-seal">${MILLENNIUM_EYE_SVG}</span>
    </div>
    <div class="ce-at sbe-screen">
      <span class="sbe-screen-bg"></span>
      <span class="sbe-portrait">${PEGASUS_PORTRAIT_SVG}</span>
      <span class="sbe-wine ce-emoji">🍷</span>
      <span class="sbe-play">▶ PLAY</span>
      ${INVITE_LINES.map((line, i) => `<span class="sbe-line sbe-line--${i + 1}">${line}</span>`).join('')}
      <span class="sbe-scanlines"></span>
    </div>
    ${chips}
    <div class="cegg-toast">Duelist Kingdom: 10 star chips to enter.<small>Grandpa not included.</small></div>`);
  if (overlay) playSound({ name: 'egg-invitation' });
}

// --- Co-op Boss: the Friendship Sign -------------------------------------------------

// Back of a right hand, fingers pointing right, sleeve on the left. Hands from
// the right side are mirrored in CSS.
const friendHandSvg = sleeve => `
  <svg viewBox="0 0 160 60" aria-hidden="true">
    <rect x="0" y="5" width="36" height="50" rx="5" fill="${sleeve}" stroke="rgb(0 0 0 / 0.35)" stroke-width="1.5"/>
    <rect x="28" y="5" width="8" height="50" fill="rgb(255 255 255 / 0.18)"/>
    <rect x="92" y="9" width="52" height="11" rx="5.5" fill="#fcd9bd" stroke="#c08a5c" stroke-width="1.2"/>
    <rect x="92" y="19" width="60" height="11" rx="5.5" fill="#fcd9bd" stroke="#c08a5c" stroke-width="1.2"/>
    <rect x="92" y="29" width="57" height="11" rx="5.5" fill="#fcd9bd" stroke="#c08a5c" stroke-width="1.2"/>
    <rect x="92" y="39" width="47" height="11" rx="5.5" fill="#fcd9bd" stroke="#c08a5c" stroke-width="1.2"/>
    <path d="M34 12 Q64 6 98 9 L98 51 Q64 56 34 49 Z" fill="#fde2c8" stroke="#c08a5c" stroke-width="1.2"/>
    <path d="M90 13 Q93 14 92 17 M91 23 Q94 24 93 27 M91 33 Q94 34 93 37 M90 42 Q93 43 92 46" fill="none" stroke="#c08a5c" stroke-width="1.2" stroke-linecap="round"/>
  </svg>`;

// Yugi, Joey, Téa and Tristan: one hand from each corner, fingertips to the
// centre, like the "Symbol of Friendship" card. Right-side hands are flipped
// so they aren't upside down.
const FRIEND_HANDS = [
  { sleeve: '#1e3a8a', angle: 45 },
  { sleeve: '#15803d', angle: 135, flip: true },
  { sleeve: '#db2777', angle: -135, flip: true },
  { sleeve: '#374151', angle: -45 }
];

// One path: the circle, both eyes, then the smile. The pen follows the same
// path (offset-path) while the stroke draws, so they stay in sync.
const FRIEND_SMILEY_PATH = 'M80 16 A64 64 0 1 1 79.9 16 M60 58 L60 72 M100 58 L100 72 M48 94 Q80 128 112 94';

function playFriendshipEgg() {
  markEggFound('friendship-sign');
  const hearts = ceRange(12, i =>
    `<span class="sbe-heart" style="left: ${ceRand(8, 92).toFixed(0)}%; --i: ${i}; --s: ${ceRand(0.7, 1.3).toFixed(2)}; --x: ${ceRand(-30, 30).toFixed(0)}px;">♥</span>`);
  const overlay = spawnStartEgg('friendship', FRIENDSHIP_EGG_MS, `
    <div class="sbe-dim sbe-dim--friendship"></div>
    <div class="sbe-friend-glow"></div>
    ${FRIEND_HANDS.map((hand, i) => `
      <div class="sbe-hand${hand.flip ? ' sbe-hand--flip' : ''}" style="--i: ${i}; --a: ${hand.angle}deg;">
        <span class="sbe-hand-inner">${friendHandSvg(hand.sleeve)}</span>
      </div>`).join('')}
    <div class="ce-at sbe-smiley">
      <svg viewBox="0 0 160 160" aria-hidden="true">
        <path class="sbe-smiley-glow" d="${FRIEND_SMILEY_PATH}" pathLength="100"/>
        <path class="sbe-smiley-ink" d="${FRIEND_SMILEY_PATH}" pathLength="100"/>
      </svg>
      <span class="sbe-marker" style="offset-path: path('${FRIEND_SMILEY_PATH}');"><span class="ce-emoji">🖊️</span></span>
    </div>
    ${hearts}
    <div class="cegg-toast">"No matter where we are, we're always together."<small>Yugi · Joey · Téa · Tristan</small></div>`);
  if (overlay) playSound({ name: 'egg-friendship' });
}
