// Hold-for-2s button eggs (start screen, tournament, co-op setup). They reuse
// the character eggs' gold "charging" glow (.cegg-press) and fx overlay base
// (.fx-cegg).
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
    else if (kind === 'star-chips') playStarChipsEgg();
    else if (kind === 'penalty-dice') playDiceDuelEgg();
    else if (kind === 'true-name') playTrueNameEgg();
    else if (kind === 'time-to-duel') playTimeToDuelEgg();
    else if (kind === 'duel-school') playDuelSchoolEgg();
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

// --- Co-op Duelist difficulty: "IT'S TIME TO DUEL!!!" ------------------------------
// Speed lines, a blue-vs-red split, the words slam in one by one, a fan of
// cards flies up and an original anime-rock riff kicks in ('egg-time-to-duel').
const TIME_TO_DUEL_MS = 5000;
const TIME_TO_DUEL_HIT_MS = 1300;

function playTimeToDuelEgg() {
  markEggFound('time-to-duel');
  setCoopDifficulty('duelist');
  const words = [["IT'S", 300], ['TIME', 600], ['TO', 900], ['DUEL!!!', TIME_TO_DUEL_HIT_MS]];
  const overlay = spawnStartEgg('duel', TIME_TO_DUEL_MS, `
    <div class="ttd-bg"><div class="ce-at ttd-lines"></div></div>
    ${ceRange(5, i => `<div class="ce-at ttd-card" style="--a: ${(i - 2) * 16}deg; --i: ${i};"></div>`)}
    <div class="ce-at ttd-words">
      ${words.map(([w, d]) => `<span class="ttd-w${w.startsWith('DUEL') ? ' ttd-w--duel' : ''}" style="--d: ${d}ms;">${w}</span>`).join('')}
    </div>
    <div class="ttd-flash"></div>
    <div class="cegg-toast">Let's duel!<small>Duelist difficulty: game on.</small></div>`);
  if (!overlay) return;
  playSound({ name: 'egg-time-to-duel' });
  setTimeout(() => restartClass(document.getElementById('app'), 'fx-atn-quake', 1200), TIME_TO_DUEL_HIT_MS);
}

// --- Co-op Rookie difficulty: Grandpa's Duel School ---------------------------------
// A chalkboard drops, Grandpa Muto walks in with a pointer: "Lesson 1:
// Monsters go here." (taps the field), "Lesson 2: Believe in the heart of
// the c—" CRACK! His back gives out, and Yugi wheels him away in a wheelchair.
// Timings are ms delays in the GRANDPA'S DUEL SCHOOL section of effects.css.
const DUEL_SCHOOL_MS = 6500;

const GS_GRANDPA_SVG = `
  <svg viewBox="0 0 100 160" aria-hidden="true">
    <g class="gs-body">
      <rect x="37" y="118" width="11" height="34" rx="3" fill="#475569"/>
      <rect x="53" y="118" width="11" height="34" rx="3" fill="#475569"/>
      <ellipse cx="41" cy="153" rx="9" ry="4" fill="#292524"/>
      <ellipse cx="60" cy="153" rx="9" ry="4" fill="#292524"/>
      <rect x="30" y="70" width="41" height="54" rx="10" fill="#f1f5f9"/>
      <path d="M33 92 H68 V124 Q50 130 33 124 Z" fill="#64748b"/>
      <path d="M36 92 L40 72 M65 92 L61 72" stroke="#64748b" stroke-width="4"/>
      <rect x="62" y="80" width="9" height="30" rx="4" fill="#f1f5f9"/>
      <g class="gs-arm">
        <rect x="14" y="76" width="24" height="9" rx="4" fill="#f1f5f9"/>
        <circle cx="14" cy="80" r="5" fill="#fcd9b6"/>
        <path d="M14 80 L-34 -20" stroke="#92400e" stroke-width="3" stroke-linecap="round"/>
      </g>
      <path d="M28 42 L22 28 L34 34 L36 20 L44 30 L50 16 L56 30 L64 20 L66 34 L78 28 L72 42 Z" fill="#9ca3af"/>
      <circle cx="50" cy="48" r="19" fill="#fcd9b6"/>
      <rect x="30" y="33" width="40" height="8" rx="3" fill="#1f2937"/>
      <path d="M70 37 L80 32 L78 42 Z" fill="#1f2937"/>
      <g class="gs-eyes" stroke="#1f2937" stroke-width="2" stroke-linecap="round" fill="none">
        <path d="M41 48 Q44 46 47 48"/>
        <path d="M53 48 Q56 46 59 48"/>
      </g>
      <path d="M40 56 Q50 52 60 56 Q50 59 40 56 Z" fill="#d1d5db"/>
      <path d="M44 60 L50 72 L56 60 Z" fill="#d1d5db"/>
    </g>
  </svg>`;

const GS_CHAIR_SVG = `
  <svg viewBox="0 0 200 160" aria-hidden="true">
    <g class="gs-yugi">
      <rect x="44" y="124" width="10" height="30" rx="3" fill="#1e293b"/>
      <rect x="58" y="124" width="10" height="30" rx="3" fill="#1e293b"/>
      <rect x="40" y="78" width="32" height="50" rx="8" fill="#1e3a8a"/>
      <path d="M66 90 L102 78" stroke="#1e3a8a" stroke-width="8" stroke-linecap="round"/>
      <path d="M30 40 L36 10 L44 32 L54 4 L60 30 L72 8 L72 34 L86 22 L78 46 Z" fill="#111827" stroke="#be185d" stroke-width="3" stroke-linejoin="round"/>
      <circle cx="58" cy="56" r="17" fill="#fcd9b6"/>
      <path d="M48 42 L42 62 L52 48 L56 66 L60 46 L68 60 L64 42 Z" fill="#facc15"/>
      <circle cx="64" cy="56" r="2.4" fill="#4c1d95"/>
      <path d="M60 70 L58 78 M56 76 L62 76" stroke="#b45309" stroke-width="2.5"/>
    </g>
    <g fill="none" stroke="#94a3b8" stroke-width="4" stroke-linecap="round">
      <path d="M100 72 L106 76 L118 112 H170"/>
      <path d="M118 112 L130 82 H168"/>
    </g>
    <g class="gs-seated">
      <rect x="128" y="86" width="34" height="28" rx="8" fill="#64748b"/>
      <path d="M130 66 L126 56 L136 60 L140 50 L146 58 L152 50 L156 60 L164 56 L160 68 Z" fill="#9ca3af"/>
      <circle cx="145" cy="72" r="14" fill="#fcd9b6"/>
      <rect x="131" y="62" width="28" height="6" rx="2" fill="#1f2937"/>
      <path d="M139 72 L143 76 M143 72 L139 76 M148 72 L152 76 M152 72 L148 76" stroke="#1f2937" stroke-width="2" stroke-linecap="round"/>
      <path d="M140 82 L145 90 L150 82 Z" fill="#d1d5db"/>
      <path d="M160 112 L178 124" stroke="#475569" stroke-width="7" stroke-linecap="round"/>
    </g>
    <g class="gs-wheel" style="transform-origin: 148px 128px;">
      <circle cx="148" cy="128" r="26" fill="none" stroke="#cbd5e1" stroke-width="4"/>
      <path d="M148 102 V154 M122 128 H174 M130 110 L166 146 M166 110 L130 146" stroke="#94a3b8" stroke-width="2"/>
    </g>
    <circle cx="182" cy="146" r="8" fill="none" stroke="#cbd5e1" stroke-width="3"/>
  </svg>`;

function playDuelSchoolEgg() {
  markEggFound('duel-school');
  setCoopDifficulty('rookie');
  const slots = ceRange(5, i => `<span class="gs-slot" style="--i: ${i};"></span>`);
  const overlay = spawnStartEgg('school', DUEL_SCHOOL_MS, `
    <div class="gs-scene">
      <div class="ce-dim"></div>
      <div class="ce-at gs-board">
        <p class="gs-chalk gs-title">Grandpa's Duel School</p>
        <p class="gs-chalk gs-l1">Lesson 1: Monsters go here.</p>
        <div class="gs-field">${slots}</div>
        <p class="gs-chalk gs-l2">Lesson 2: Believe in the heart of the c—</p>
      </div>
      <div class="ce-at gs-grandpa">${GS_GRANDPA_SVG}</div>
      <div class="ce-at gs-crack">*CRACK*</div>
      <div class="ce-at ce-bubble gs-say gs-say--ow">Ohh… my back!</div>
      <div class="ce-at gs-chair">${GS_CHAIR_SVG}</div>
      <div class="ce-at ce-bubble gs-say gs-say--yugi">Not again, Grandpa…</div>
    </div>
    <div class="cegg-toast">Class dismissed.<small>Lesson 3 is postponed indefinitely.</small></div>`);
  if (overlay) playSound({ name: 'egg-duel-school' });
}
