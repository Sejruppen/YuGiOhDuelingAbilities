// Hold-for-2s button eggs (start screen, tournament, co-op setup). They reuse
// the character eggs' gold "charging" glow (.cegg-press) and fx overlay base
// (.fx-cegg).
//  - Tournament: a Duelist Kingdom invitation flies in. The Millennium Eye seal
//    cracks, Pegasus's video message plays, then star chips rain down.
//  - Co-op Boss: the Friendship Sign. Four hands stack up, a marker draws Téa's
//    smiley across all of them, and it glows.
//  - Settings: Limiter Removal. The gear revs up while held, then a squad of
//    robots marches in, doubles its ATK, overheats and blows up.
//  - Co-op "Face Pegasus": Relinquished rises, absorbs the button into the
//    Millennium Eye on its chest, gets the hiccups and spits it back out.
//  - Tournament menu "Continue": "Next time on Yu-Gi-Oh!", an anime episode
//    preview titled after the next real match.
//  - Tournament menu "New tournament": Mind Slave. Cloaked Marik hypnotises
//    the player with the Millennium Rod, then hypnotises himself.
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
    else if (kind === 'limiter-removal') playLimiterRemovalEgg(el);
    else if (kind === 'relinquished') playRelinquishedEgg(el);
    else if (kind === 'next-time') playNextTimeEgg();
    else if (kind === 'mind-slave') playMindSlaveEgg();
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

// --- Settings: Limiter Removal ---------------------------------------------------
// Holding the button revs the ⚙️ faster and faster (.cegg-charging, CSS). Then
// "LIMITER REMOVAL!" slams in, five little robots march on and flex (ATK ×2),
// glow red-hot, shake, steam and blow up one by one into smoking scrap, while
// a copy of the gear over the button overheats with them and slowly cools
// down. Timings are in the LIMITER REMOVAL section of effects.css.
const LIMITER_EGG_MS = 6000;
const LIMITER_ROBOT_X = [12, 31, 50, 69, 88];

const LR_ROBOT_SVG = `
  <svg viewBox="0 0 60 80" aria-hidden="true">
    <path d="M30 14 V6" stroke="#64748b" stroke-width="2.5" stroke-linecap="round"/>
    <circle class="lr-bulb" cx="30" cy="5" r="3.5"/>
    <rect class="lr-shell" x="2" y="42" width="8" height="18" rx="3"/>
    <rect class="lr-shell" x="50" y="42" width="8" height="18" rx="3"/>
    <rect x="16" y="64" width="10" height="14" rx="2" fill="#475569"/>
    <rect x="34" y="64" width="10" height="14" rx="2" fill="#475569"/>
    <rect x="26" y="35" width="8" height="6" fill="#475569"/>
    <rect class="lr-shell" x="10" y="40" width="40" height="26" rx="4" stroke="#334155" stroke-width="1.5"/>
    <rect x="18" y="45" width="24" height="15" rx="2" fill="#1e293b"/>
    <rect class="lr-meter" x="21" y="48" width="18" height="9" rx="1.5"/>
    <rect class="lr-shell" x="13" y="13" width="34" height="23" rx="5" stroke="#334155" stroke-width="1.5"/>
    <circle class="lr-eye" cx="23" cy="24" r="3.6"/>
    <circle class="lr-eye" cx="37" cy="24" r="3.6"/>
    <path d="M22 31 H38" stroke="#334155" stroke-width="2" stroke-dasharray="2 2"/>
  </svg>`;

function playLimiterRemovalEgg(button) {
  markEggFound('limiter-removal');
  const gearEl = button?.querySelector('.settings-gear');
  const gear = getCenter(gearEl);
  const gearSize = gearEl ? parseFloat(getComputedStyle(gearEl).fontSize) : 16;
  const robots = LIMITER_ROBOT_X.map((x, i) => `
    <div class="ce-at lr-robot" style="left: ${x}%; --i: ${i}; --from: ${x < 50 ? -70 : 70}vw;">
      <div class="lr-body"><div class="lr-shake">${LR_ROBOT_SVG}</div></div>
      ${ceRange(3, k => `<span class="lr-steam" style="--k: ${k}; --sx: ${ceRand(-14, 14).toFixed(0)}px;"></span>`)}
      <span class="lr-pop ce-emoji">💥</span>
    </div>`).join('');
  const overlay = spawnStartEgg('limiter', LIMITER_EGG_MS, `
    <div class="sbe-dim sbe-dim--limiter"></div>
    <div class="ce-at lr-title">LIMITER REMOVAL!</div>
    <div class="ce-at lr-atk">ATK ×2</div>
    <div class="ce-at lr-warn">⚠ OVERHEATING ⚠</div>
    ${robots}
    <div class="lr-flash"></div>
    <div class="ce-at lr-gear" style="left: ${gear.x.toFixed(0)}px; top: ${gear.y.toFixed(0)}px; font-size: ${gearSize}px;">
      <span class="ce-emoji lr-gear-icon">⚙️</span>
      ${ceRange(3, k => `<span class="lr-steam lr-steam--gear" style="--k: ${k}; --sx: ${ceRand(-10, 10).toFixed(0)}px;"></span>`)}
    </div>
    <div class="cegg-toast">Limiter Removal: ATK doubled!<small>…and every Machine is destroyed in the End Phase. Read the card text.</small></div>`);
  if (overlay) playSound({ name: 'egg-limiter-removal' });
}

// --- Co-op "Face Pegasus": Relinquished -------------------------------------------
// A purple pool opens and Relinquished rises out of it. It's traced after the
// anime artwork in its own 1280×1760 space: two bone-framed lattice wings
// on teal stalks, teal armour wrapped in bone ribs, the Millennium symbol on
// its head, the Millennium Eye on its right shoulder, two clawed arms with
// green orbs, the bone mouth-ring on its belly with drills on both sides,
// and the cap and striped drill underneath. Its eye opens, a copy of the
// button wriggles and gets sucked into the mouth-ring (the real one is hidden
// meanwhile), it gulps: "Your button now belongs to me~ ♪", gets the hiccups,
// spits the button back where it was (a bit gooey) and sinks away. Timings
// are in the RELINQUISHED section of effects.css. The monster is centred at
// RELINQUISHED_TOP of the screen height and --rq-w wide; the mouth sits at
// RELINQUISHED_MOUTH (fractions of the artwork).
const RELINQUISHED_EGG_MS = 6000;
const RELINQUISHED_TOP = 0.42;
const RELINQUISHED_MOUTH = { x: 600 / 1280, y: 1135 / 1760 };
const RELINQUISHED_ASPECT = 1760 / 1280;

const RQ_INK = '#0d1416';
const RQ_BONE = '#c6c9b3';
const RQ_TEAL = '#2c5559';
const RQ_TEAL_DARK = '#1b3639';
const RQ_SHINE = '#8fb9bb';

// A bone rib with an ink outline.
const rqBone = (d, w = 20) => `
  <path d="${d}" fill="none" stroke="${RQ_INK}" stroke-width="${w + 9}"/>
  <path d="${d}" fill="none" stroke="${RQ_BONE}" stroke-width="${w}"/>`;

// "Lightning" sheen marks on the shiny teal armour.
const rqShine = d => `<path d="${d}" fill="none" stroke="${RQ_SHINE}" stroke-width="4"/>`;

// A green orb in a bone setting, on the forearms.
const rqOrb = (x, y) => `
  <circle cx="${x}" cy="${y}" r="31" fill="${RQ_BONE}"/>
  <circle cx="${x}" cy="${y}" r="21" fill="#3c7a2b"/>
  <circle cx="${x - 7}" cy="${y - 7}" r="7" fill="#9ccc65" stroke="none"/>`;

// One dark, curved claw blade with a pale edge highlight.
const rqClaw = (d, edge) => `
  <path d="${d}" fill="#22312f"/>
  <path d="${edge}" fill="none" stroke="#8ea4a7" stroke-width="4"/>`;

// Short lines radiating from (cx, cy) between radius r1 and r2.
const rqRays = (cx, cy, n, r1, r2) => Array.from({ length: n }, (_, i) => {
  const a = (i / n) * Math.PI * 2;
  const c = Math.cos(a), s = Math.sin(a);
  return `M${(cx + c * r1).toFixed(1)} ${(cy + s * r1).toFixed(1)} L${(cx + c * r2).toFixed(1)} ${(cy + s * r2).toFixed(1)}`;
}).join(' ');

const RQ_WING_L_OUT = 'M335 605 C290 590 255 545 245 480 C232 400 214 330 208 250 C203 180 222 110 262 70 C295 42 345 40 385 62 C425 88 445 140 470 195 C505 270 545 350 575 430 C596 490 600 545 570 585 C535 615 470 625 420 620 C390 617 360 612 335 605 Z';
const RQ_WING_L_IN = 'M345 575 C300 560 280 520 272 470 C260 395 244 325 240 255 C236 190 252 130 285 100 C315 76 352 78 380 98 C410 122 428 170 450 220 C482 290 520 365 545 435 C562 485 562 525 540 552 C510 578 455 588 410 585 C385 583 365 580 345 575 Z';
const RQ_WING_R_OUT = 'M745 625 C705 600 690 545 705 480 C722 415 770 365 830 325 C900 280 975 245 1050 205 C1120 168 1180 135 1225 130 C1255 130 1262 165 1245 200 C1220 250 1170 290 1120 340 C1065 395 1010 455 950 515 C895 568 845 610 800 625 C780 632 760 632 745 625 Z';
const RQ_WING_R_IN = 'M760 590 C730 570 722 530 735 485 C752 430 795 390 850 355 C915 315 985 280 1055 242 C1120 208 1175 180 1210 172 C1228 172 1228 195 1212 218 C1185 255 1140 295 1095 340 C1045 392 990 450 935 505 C885 553 840 585 805 595 C788 600 772 598 760 590 Z';

const RELINQUISHED_SVG = `
  <svg viewBox="0 0 1280 1760" aria-hidden="true">
    <defs>
      <radialGradient id="rq-portal-grad">
        <stop offset="0" stop-color="#f0abfc" stop-opacity="0.95"/>
        <stop offset="0.5" stop-color="#a21caf" stop-opacity="0.6"/>
        <stop offset="1" stop-color="#4c1d95" stop-opacity="0"/>
      </radialGradient>
      <clipPath id="rq-clip-wl"><path d="${RQ_WING_L_IN}"/></clipPath>
      <clipPath id="rq-clip-wr"><path d="${RQ_WING_R_IN}"/></clipPath>
      <clipPath id="rq-clip-dl"><path d="M447 1096 L372 1140 L447 1154 Z"/></clipPath>
      <clipPath id="rq-clip-dr"><path d="M795 1120 L940 1158 L795 1180 Z"/></clipPath>
      <clipPath id="rq-clip-dd"><path d="M548 1345 L655 1345 L602 1655 Z"/></clipPath>
    </defs>
    <g stroke="${RQ_INK}" stroke-width="5" stroke-linejoin="round" stroke-linecap="round">

      <g class="rq-wing rq-wing--l">
        <path d="M428 598 C422 640 440 670 470 670 C492 662 494 630 484 603 Z" fill="${RQ_TEAL}"/>
        <ellipse cx="456" cy="632" rx="11" ry="17" fill="${RQ_TEAL_DARK}"/>
        <path d="${RQ_WING_L_OUT}" fill="${RQ_BONE}"/>
        <path d="${RQ_WING_L_IN}" fill="#2f373b"/>
        <g clip-path="url(#rq-clip-wl)">
          ${rqBone('M440 590 C415 470 380 330 330 92', 22)}
          ${rqBone('M248 175 Q330 186 408 160')}
          ${rqBone('M250 270 Q340 266 448 236')}
          ${rqBone('M260 376 Q350 360 494 330')}
          ${rqBone('M272 470 Q370 456 545 432')}
          ${rqBone('M300 548 Q380 532 455 548')}
          ${rqBone('M300 270 L292 330', 14)}
          ${rqBone('M470 340 L500 420', 14)}
          ${rqBone('M310 470 L330 540', 14)}
        </g>
      </g>
      <g class="rq-wing rq-wing--r">
        <path d="M768 606 C756 650 770 682 800 682 C822 672 820 640 806 610 Z" fill="${RQ_TEAL}"/>
        <ellipse cx="790" cy="640" rx="11" ry="17" fill="${RQ_TEAL_DARK}"/>
        <path d="${RQ_WING_R_OUT}" fill="${RQ_BONE}"/>
        <path d="${RQ_WING_R_IN}" fill="#2f373b"/>
        <g clip-path="url(#rq-clip-wr)">
          ${rqBone('M768 598 C870 470 1000 340 1218 184', 22)}
          ${rqBone('M770 466 L866 574')}
          ${rqBone('M852 386 L948 494')}
          ${rqBone('M932 316 L1028 424')}
          ${rqBone('M1012 246 L1108 354')}
          ${rqBone('M1098 188 L1172 272')}
          ${rqBone('M900 520 L960 470', 14)}
          ${rqBone('M1050 300 L1110 260', 14)}
        </g>
      </g>

      <path d="M88 668 C130 640 190 632 250 640 C330 650 410 680 455 720 C490 760 480 820 440 860 C380 900 300 905 230 885 C165 865 125 815 110 760 C102 725 95 695 88 668 Z" fill="${RQ_TEAL}"/>
      ${rqBone('M95 670 C170 650 250 650 330 680 C380 700 420 720 450 735', 18)}
      ${rqBone('M235 650 C255 720 255 800 240 880', 18)}
      ${rqBone('M330 682 C350 750 345 820 320 895', 18)}
      ${rqBone('M115 770 C180 790 260 795 350 790', 18)}
      ${rqShine('M150 712 l24 -8 l-8 14 l24 -10')}
      ${rqShine('M280 740 l22 -6 l-6 12 l22 -8')}

      <path d="M835 720 C900 690 990 690 1060 710 C1095 720 1110 735 1110 748 C1080 752 1060 775 1050 810 C1040 860 990 890 930 890 C880 885 845 850 835 800 Z" fill="${RQ_TEAL}"/>
      ${rqBone('M850 712 C930 700 1010 705 1092 736', 18)}
      ${rqBone('M985 702 C1000 760 995 830 975 890', 18)}
      ${rqBone('M845 800 C900 810 980 810 1048 800', 18)}
      ${rqShine('M1020 730 l20 -6 l-6 12 l20 -8')}

      <path d="M78 885 C150 905 230 930 290 980 C350 1040 375 1150 390 1260 C400 1330 405 1380 400 1410 L240 1415 C215 1350 190 1270 165 1180 C135 1070 105 975 78 885 Z" fill="${RQ_TEAL}"/>
      ${rqBone('M80 888 C104 905 118 928 126 960', 16)}
      ${rqBone('M110 990 C170 985 240 990 320 1012', 16)}
      ${rqBone('M150 1140 C210 1135 290 1140 362 1150', 16)}
      ${rqBone('M190 1290 C260 1290 330 1290 394 1300', 16)}
      ${rqBone('M232 1402 L400 1398', 16)}
      ${rqBone('M250 990 C262 1100 272 1220 290 1400', 16)}
      ${rqOrb(262, 1120)}
      ${rqOrb(285, 1255)}
      ${rqShine('M180 1050 l20 -6 l-6 12 l20 -8')}
      ${rqClaw('M245 1405 C235 1460 255 1500 300 1530 C285 1490 280 1450 290 1412 Z', 'M262 1430 C262 1470 275 1495 295 1515')}
      ${rqClaw('M290 1410 C290 1465 315 1505 360 1530 C340 1490 335 1450 335 1410 Z', 'M306 1428 C308 1470 325 1500 352 1520')}
      ${rqClaw('M335 1408 C345 1460 375 1495 420 1515 C395 1480 385 1445 382 1405 Z', 'M350 1424 C358 1462 380 1490 410 1506')}
      ${rqClaw('M375 1330 C430 1330 465 1370 475 1430 C450 1395 420 1380 385 1378 Z', 'M395 1342 C430 1348 455 1375 466 1412')}

      <path d="M1125 880 C1160 1000 1165 1130 1145 1250 C1130 1330 1110 1390 1095 1425 L940 1420 C960 1330 975 1230 975 1130 C975 1040 955 970 925 915 C990 890 1060 878 1125 880 Z" fill="${RQ_TEAL}"/>
      ${rqBone('M1124 882 C1110 902 1100 922 1098 948', 16)}
      ${rqBone('M945 980 C1010 970 1080 965 1150 975', 16)}
      ${rqBone('M970 1150 C1030 1140 1100 1135 1160 1140', 16)}
      ${rqBone('M970 1300 C1030 1295 1100 1295 1140 1300', 16)}
      ${rqBone('M1060 900 C1062 1050 1065 1200 1060 1420', 16)}
      ${rqOrb(1060, 1105)}
      ${rqOrb(1065, 1305)}
      ${rqShine('M1110 1020 l18 -6 l-6 12 l18 -8')}
      ${rqClaw('M995 1335 C940 1340 910 1380 905 1440 C925 1400 955 1385 995 1380 Z', 'M985 1348 C950 1355 925 1385 915 1420')}
      ${rqClaw('M995 1420 C985 1480 1000 1525 1030 1555 C1025 1505 1030 1465 1040 1422 Z', 'M1010 1436 C1004 1480 1012 1515 1028 1540')}
      ${rqClaw('M1040 1422 C1040 1480 1055 1525 1085 1560 C1080 1505 1080 1465 1085 1420 Z', 'M1056 1436 C1056 1480 1066 1515 1080 1545')}
      ${rqClaw('M1085 1418 C1095 1470 1110 1505 1135 1530 C1125 1485 1125 1450 1125 1415 Z', 'M1100 1432 C1106 1470 1116 1495 1130 1516')}

      <ellipse cx="420" cy="1062" rx="46" ry="30" fill="${RQ_TEAL}"/>
      <ellipse cx="790" cy="1062" rx="42" ry="28" fill="${RQ_TEAL}"/>

      <path d="M440 700 C510 650 600 640 680 648 C760 655 830 690 850 750 C870 820 830 880 770 905 C690 935 590 930 520 900 C460 870 430 800 440 700 Z" fill="${RQ_TEAL}"/>
      <ellipse cx="700" cy="705" rx="85" ry="60" fill="${RQ_TEAL}"/>
      ${rqBone('M620 702 C660 662 740 657 785 692', 14)}
      ${rqBone('M640 742 C680 727 740 730 775 747', 14)}
      ${rqShine('M610 690 l18 -6 l-6 12 l18 -8')}
      <path d="M700 622 C722 635 732 660 728 685 C722 705 710 712 700 712 C690 712 678 705 672 685 C668 660 678 635 700 622 Z" fill="${RQ_BONE}"/>
      <path d="M700 634 C714 643 720 662 717 683 C712 698 706 702 700 702 C694 702 688 698 683 683 C680 662 686 643 700 634 Z" fill="#1d2a2c" stroke="none"/>
      <g fill="${RQ_BONE}" stroke="${RQ_BONE}" stroke-width="3">
        <circle cx="700" cy="650" r="6"/>
        <path d="M688 668 Q700 659 712 668 Q700 676 688 668 Z" stroke="none"/>
        <path d="M700 675 L700 698 M694 682 L689 698 M706 682 L711 698" fill="none"/>
      </g>

      ${rqBone('M470 672 C500 702 520 732 545 762 C565 792 565 822 548 852', 38)}
      <path d="M525 790 C590 755 680 760 735 800 C775 835 760 900 720 945 C680 990 610 1000 560 970 C515 940 495 870 525 790 Z" fill="${RQ_BONE}"/>
      <ellipse cx="548" cy="865" rx="20" ry="38" fill="${RQ_TEAL_DARK}"/>
      <ellipse cx="700" cy="872" rx="24" ry="32" fill="${RQ_TEAL_DARK}"/>
      <ellipse cx="622" cy="945" rx="38" ry="20" fill="${RQ_TEAL_DARK}"/>
      <ellipse cx="610" cy="815" rx="16" ry="14" fill="${RQ_TEAL_DARK}"/>
      <path d="M685 812 L762 820 L762 854 L685 850 Z" fill="${RQ_BONE}"/>
      <circle cx="660" cy="830" r="34" fill="${RQ_BONE}"/>
      <rect x="645" y="815" width="30" height="30" rx="7" fill="${RQ_TEAL_DARK}"/>
      <path d="M660 815 V845" stroke="${RQ_BONE}" stroke-width="5"/>

      <circle cx="805" cy="845" r="72" fill="${RQ_TEAL}"/>
      ${rqShine('M760 798 C780 783 810 778 836 786')}
      <g class="rq-eye">
        <path d="M740 845 C770 803 832 798 870 832 C842 872 784 882 740 845 Z" fill="#c8d991" stroke-width="4"/>
        <path d="M748 830 C782 796 836 794 872 820" fill="none" stroke="#9fb860" stroke-width="6"/>
        <path d="M752 860 C790 880 835 872 862 846" fill="none" stroke="#9fb860" stroke-width="5"/>
        <circle cx="805" cy="840" r="26" fill="#b7cd6c" stroke-width="4"/>
        <circle cx="805" cy="840" r="15" fill="#c8d991" stroke-width="6"/>
        <circle cx="805" cy="840" r="6" fill="#aac25a" stroke="none"/>
      </g>

      <path d="M565 958 L642 958 L652 1042 L555 1042 Z" fill="${RQ_BONE}"/>
      <path d="M447 1096 L372 1140 L447 1154 Z" fill="#8c7c56"/>
      <path d="M432 1090 V1160 M412 1100 V1160 M392 1110 V1160" stroke="#3a3326" stroke-width="10" clip-path="url(#rq-clip-dl)"/>
      <path d="M795 1120 L940 1158 L795 1180 Z" fill="#8c7c56"/>
      <path d="M822 1110 V1190 M852 1110 V1190 M882 1110 V1190 M912 1110 V1190" stroke="#3a3326" stroke-width="12" clip-path="url(#rq-clip-dr)"/>
      <path d="M440 1080 C470 1060 510 1070 520 1100 C525 1140 510 1170 480 1175 C450 1172 430 1150 430 1120 Z" fill="${RQ_BONE}"/>
      <path d="M476 1066 C470 1100 470 1140 476 1174" fill="none" stroke-width="3"/>
      <path d="M700 1085 C730 1070 780 1080 795 1110 C800 1145 785 1170 750 1175 C715 1172 700 1150 700 1120 Z" fill="${RQ_BONE}"/>
      <path d="M750 1076 C746 1110 746 1140 752 1175" fill="none" stroke-width="3"/>

      <circle cx="600" cy="1135" r="108" fill="${RQ_BONE}"/>
      <path d="${rqRays(600, 1135, 22, 80, 108)}" fill="none" stroke-width="3"/>
      <circle cx="600" cy="1135" r="80" fill="#d4d6c4" stroke-width="4"/>
      <path d="${rqRays(600, 1135, 72, 20, 78)}" fill="none" stroke="#3b4446" stroke-width="1.6"/>
      <circle cx="600" cy="1135" r="17" fill="#050505"/>
      <circle class="rq-portal" cx="600" cy="1135" r="100" fill="url(#rq-portal-grad)" stroke="none"/>

      <path d="M548 1345 L655 1345 L602 1655 Z" fill="#8c7c56"/>
      <path d="M530 1380 Q600 1396 670 1380 M530 1440 Q600 1456 670 1440 M530 1500 Q600 1516 670 1500 M530 1560 Q600 1576 670 1560 M530 1620 Q600 1636 670 1620" fill="none" stroke="#3a3326" stroke-width="26" clip-path="url(#rq-clip-dd)"/>
      <path d="M548 1345 L655 1345 L602 1655 Z" fill="none"/>
      <path d="M455 1328 C530 1305 570 1270 590 1232 C596 1222 606 1222 612 1232 C632 1270 672 1305 748 1328 C700 1350 650 1356 600 1356 C550 1356 500 1350 455 1328 Z" fill="${RQ_BONE}"/>
      <path d="M560 1300 L575 1312 M640 1300 L625 1312 M600 1262 V1290" fill="none" stroke-width="2.5"/>
    </g>
  </svg>`;

function playRelinquishedEgg(button) {
  markEggFound('relinquished');
  if (!button) return;
  const r = button.getBoundingClientRect();
  const width = Math.min(320, window.innerWidth * 0.86, (window.innerHeight * 0.56) / RELINQUISHED_ASPECT);
  const mouthX = window.innerWidth / 2 + (RELINQUISHED_MOUTH.x - 0.5) * width;
  const mouthY = window.innerHeight * RELINQUISHED_TOP + (RELINQUISHED_MOUTH.y - 0.5) * width * RELINQUISHED_ASPECT;
  const dx = mouthX - (r.left + r.width / 2);
  const dy = mouthY - (r.top + r.height / 2);
  const goo = ceRange(5, i => `<span class="rq-goo" style="left: ${(10 + i * 19 + ceRand(-4, 4)).toFixed(0)}%; --i: ${i}; --h: ${ceRand(8, 18).toFixed(0)}px;"></span>`);
  const overlay = spawnStartEgg('relinquished', RELINQUISHED_EGG_MS, `
    <div class="sbe-dim sbe-dim--relinquished"></div>
    <div class="ce-at rq-pool"></div>
    <div class="ce-at rq-monster">${RELINQUISHED_SVG}</div>
    <div class="ce-at rq-swirl"></div>
    <div class="ce-at ce-bubble rq-say rq-say--own">Your button now belongs to me~ ♪</div>
    <div class="ce-at rq-hic">*hic*</div>
    <div class="ce-at rq-ptoo">PTOO!</div>
    <div class="rq-btn ${button.className.replace(/\b(cegg-press|cegg-charging)\b/g, '')}" style="left: ${r.left.toFixed(0)}px; top: ${r.top.toFixed(0)}px; width: ${r.width.toFixed(0)}px; height: ${r.height.toFixed(0)}px; --dx: ${dx.toFixed(0)}px; --dy: ${dy.toFixed(0)}px;">
      <span>${button.innerHTML}</span>${goo}
    </div>
    <div class="cegg-toast">Relinquished spat it out.<small>Turns out buttons aren't monsters. "Face Pegasus" returns to the field.</small></div>`);
  if (!overlay) return;
  overlay.style.setProperty('--rq-w', `${width.toFixed(0)}px`);
  restartClass(button, 'rq-taken', RELINQUISHED_EGG_MS - 100);
  playSound({ name: 'egg-relinquished' });
}

// --- Tournament menu "Continue": "Next time on Yu-Gi-Oh!" ---------------------------
// The screen freezes on a white flash like an episode's last frame, then the
// preview card plays: NEXT TIME ON / YU-GI-OH! slams in, the episode number
// (duels played + 1) and a dramatic title built from the next real match
// (or the champion once the final is decided), stamped "Don't miss it!".
// Only the player holding Continue sees it, so it is shown once, upright.
const NEXT_TIME_EGG_MS = 6500;

const NEXT_TIME_TITLES = [
  (a, b) => `${a} vs. ${b}:<br>Duel of Destiny!`,
  (a, b) => `${a}'s<br>Last Stand!`,
  (a, b) => `The Heart of the Cards:<br>${a} vs. ${b}!`,
  (a, b) => `${b} Faces<br>the Shadow Realm!`,
  (a, b) => `Who Will Survive?<br>${a} vs. ${b}!`,
  (a, b) => `${a} vs. ${b}:<br>The Final Draw!`
];

function nextTimeEpisode() {
  const rounds = getTournamentRounds();
  const ep = rounds.flat().filter(m => !m.bye && m.winnerId).length + 1;
  const name = id => tnEsc((getTournamentChar(id)?.name || '???').replace(/\s*\(.*\)\s*$/, '').trim());
  const champion = getTournamentChampion(rounds);
  if (champion) return { ep, round: 'Special', title: `${name(champion)}:<br>King of Games!` };
  const match = rounds.flat().find(m => m.ready);
  if (!match) return { ep, round: '', title: 'The Duel Continues!' };
  const [a, b] = Math.random() < 0.5 ? [match.a, match.b] : [match.b, match.a];
  const round = getRoundName(match.round, rounds.length);
  const title = round === 'Final'
    ? `The Final Showdown:<br>${name(a)} vs. ${name(b)}!`
    : cePick(NEXT_TIME_TITLES)(name(a), name(b));
  return { ep, round, title };
}

function playNextTimeEgg() {
  markEggFound('next-time');
  const { ep, round, title } = nextTimeEpisode();
  const stars = ceRange(16, () =>
    `<span class="ntp-star" style="left: ${ceRand(3, 97).toFixed(0)}%; top: ${ceRand(3, 97).toFixed(0)}%; --d: ${ceRand(0, 1600).toFixed(0)}ms; --s: ${ceRand(0.6, 1.4).toFixed(2)};">✦</span>`);
  const overlay = spawnStartEgg('next-time', NEXT_TIME_EGG_MS, `
    <div class="ntp-bg"><div class="ce-at ntp-rays"></div>${stars}</div>
    <div class="ntp-card">
      <span class="ntp-next">Next time on</span>
      <span class="ntp-logo">Yu-Gi-Oh!</span>
      <span class="ntp-ep">Episode ${ep}${round ? ` · ${round}` : ''}</span>
      <span class="ntp-title">${title}</span>
      <span class="ntp-miss">Don't miss it!</span>
    </div>
    <div class="ntp-flash"></div>`);
  if (overlay) playSound({ name: 'egg-next-time' });
}

// --- Tournament menu "New tournament": Mind Slave ------------------------------------
// The screen blacks out and Marik appears in his hooded purple cloak: only
// the glowing Millennium Eye on his forehead and his evil eyes show under
// the hood. He swings the Millennium Rod like a metronome; a spiral spins,
// rings pulse from the Rod, and the player is branded with the Eye ("Yes…
// Master… Marik…", like Joey in Battle City). Then his own eyes start
// following the Rod, turn into spirals, and he hypnotises himself to sleep.
// Timeline: the MIND SLAVE section of effects.css.
const MIND_SLAVE_EGG_MS = 10500;

// An Archimedean spiral path, `turns` turns out to radius `rMax`.
function mkSpiralPath(cx, cy, turns, rMax) {
  const perTurn = 24;
  const steps = turns * perTurn;
  return Array.from({ length: steps + 1 }, (_, i) => {
    const a = (i / perTurn) * Math.PI * 2;
    const r = (i / steps) * rMax;
    return `${i ? 'L' : 'M'}${(cx + Math.cos(a) * r).toFixed(1)} ${(cy + Math.sin(a) * r).toFixed(1)}`;
  }).join(' ');
}

// The Millennium Eye as a glowing line glyph, centred on 0,0 (~26 wide).
const MK_EYE_GLYPH = `
  <g fill="none" stroke="#fde047" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M-12 0 Q0 -9 12 0 Q0 9 -12 0 Z"/>
    <circle r="3.2" fill="#fde047" stroke="none"/>
    <path d="M-12 -6 Q0 -15 12 -6"/>
    <path d="M-4 7 L-6 16 M4 7 Q7 14 12 11"/>
  </g>`;

const MARIK_SVG = `
  <svg viewBox="0 0 200 260" aria-hidden="true">
    <defs>
      <linearGradient id="mk-cloak" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#6d5aa3"/><stop offset="0.45" stop-color="#4a3a80"/><stop offset="1" stop-color="#2a2050"/>
      </linearGradient>
      <linearGradient id="mk-gold" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#fef08a"/><stop offset="0.5" stop-color="#d4a017"/><stop offset="1" stop-color="#7c5a10"/>
      </linearGradient>
      <radialGradient id="mk-gold-ball" cx="0.35" cy="0.35" r="0.75">
        <stop offset="0" stop-color="#fffbeb"/><stop offset="0.35" stop-color="#facc15"/><stop offset="1" stop-color="#8a6510"/>
      </radialGradient>
      <radialGradient id="mk-halo">
        <stop offset="0" stop-color="#fef08a" stop-opacity="0.95"/><stop offset="1" stop-color="#a855f7" stop-opacity="0"/>
      </radialGradient>
      <filter id="mk-glow" x="-1" y="-1" width="3" height="3">
        <feGaussianBlur stdDeviation="2.2" result="b"/>
        <feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>
    <path d="M100 12 C72 12 54 34 50 66 C47 92 44 112 34 134 C22 160 12 210 6 260 L194 260 C188 210 178 160 166 134 C156 112 153 92 150 66 C146 34 128 12 100 12 Z" fill="url(#mk-cloak)" stroke="#140c28" stroke-width="1.5"/>
    <path d="M100 12 C86 22 78 38 76 52 Q100 40 124 52 C122 38 114 22 100 12 Z" fill="#8b7bc0" opacity="0.35"/>
    <path d="M88 132 Q100 142 112 132 L122 260 L78 260 Z" fill="#17122a"/>
    <path d="M56 116 Q100 152 144 116 Q136 138 100 150 Q64 138 56 116 Z" fill="#5b4a8a" stroke="#140c28" stroke-width="1"/>
    <g fill="none" stroke="#231a45" stroke-width="2" stroke-linecap="round">
      <path d="M58 160 Q50 210 42 256"/><path d="M76 156 Q70 206 66 256"/><path d="M142 160 Q150 210 158 256"/>
    </g>
    <ellipse cx="100" cy="80" rx="35" ry="41" fill="#2a2050"/>
    <ellipse cx="100" cy="83" rx="28" ry="34" fill="#050208"/>
    <g class="mk-hood-eye" filter="url(#mk-glow)"><g transform="translate(100 64) scale(0.75)">${MK_EYE_GLYPH}</g></g>
    <g class="mk-evil" filter="url(#mk-glow)">
      <path d="M79 90 L97 95 L95 99.5 L82 97 Z" fill="#ddd6fe"/>
      <path d="M121 90 L103 95 L105 99.5 L118 97 Z" fill="#ddd6fe"/>
      <circle cx="91" cy="96.3" r="1.7" fill="#4c1d95"/>
      <circle cx="109" cy="96.3" r="1.7" fill="#4c1d95"/>
    </g>
    <g class="mk-dazed" fill="none" stroke="#e9d5ff" stroke-width="1.4" stroke-linecap="round" filter="url(#mk-glow)">
      <path class="mk-dz" d="${mkSpiralPath(89, 95, 3, 6)}"/>
      <path class="mk-dz" d="${mkSpiralPath(111, 95, 3, 6)}"/>
    </g>
    <path d="M124 170 Q140 152 154 132" fill="none" stroke="#8b5a3c" stroke-width="13" stroke-linecap="round"/>
    <path d="M132 161 Q139 153 146 144" fill="none" stroke="url(#mk-gold)" stroke-width="15"/>
    <path d="M131 154 L140 164 M136 149 L145 158 M141 144 L149 152" fill="none" stroke="#7c5a10" stroke-width="1.2"/>
    <path d="M110 148 Q128 154 136 178 Q120 182 106 170 Z" fill="#3f3170" stroke="#140c28" stroke-width="1"/>
    <g class="mk-rod">
      <circle class="mk-rod-glow" cx="158.5" cy="100" r="26" fill="url(#mk-halo)"/>
      <g class="mk-rings" fill="none" stroke-width="1.5">
        ${ceRange(4, i => `<circle class="mk-ring" cx="158.5" cy="100" r="9" stroke="${i % 2 ? '#c084fc' : '#fde047'}" style="animation-delay: ${i * 300}ms;"/>`)}
      </g>
      <rect x="156.5" y="100" width="4" height="92" fill="url(#mk-gold)"/>
      <rect x="154.5" y="184" width="8" height="4" rx="1" fill="url(#mk-gold)"/>
      <path d="M155 192 L162 192 L158.5 205 Z" fill="url(#mk-gold)" stroke="#7c5a10" stroke-width="0.6"/>
      <path d="M150 100 Q138 97 133 85 Q143 91 152 94 Z M167 100 Q179 97 184 85 Q174 91 165 94 Z" fill="url(#mk-gold)" stroke="#7c5a10" stroke-width="0.8"/>
      <path d="M155.5 91.5 L158.5 85 L161.5 91.5 Z" fill="url(#mk-gold)"/>
      <circle cx="158.5" cy="100" r="9.5" fill="url(#mk-gold-ball)" stroke="#7c5a10" stroke-width="0.8"/>
      <path d="M152 100 Q158.5 95 165 100 Q158.5 105 152 100 Z" fill="#fef3c7" stroke="#7c5a10" stroke-width="0.8"/>
      <circle cx="158.5" cy="100" r="2" fill="#7c5a10"/>
    </g>
    <rect x="150" y="117" width="17" height="15" rx="6" fill="#8b5a3c" stroke="#4a2c1a" stroke-width="1.2"/>
    <path d="M153 121 H164 M153 125 H164 M153 129 H163" fill="none" stroke="#5c3a24" stroke-width="1"/>
  </svg>`;

function playMindSlaveEgg() {
  markEggFound('mind-slave');
  const line = (text, at, len, y, mod = '') =>
    `<div class="mk-line" style="top: ${y}%;"><span class="mk-say${mod ? ` mk-say--${mod}` : ''}" style="--at: ${at}ms; --len: ${len}ms;">${text}</span></div>`;
  const overlay = spawnStartEgg('marik', MIND_SLAVE_EGG_MS, `
    <div class="mk-black"></div>
    <div class="ce-at mk-hypno">
      <svg viewBox="-100 -100 200 200" aria-hidden="true"><path d="${mkSpiralPath(0, 0, 9, 100)}" fill="none" stroke="#7e22ce" stroke-width="5"/></svg>
    </div>
    <div class="ce-at mk-figure">
      ${MARIK_SVG}
      ${ceRange(3, i => `<span class="mk-z" style="--i: ${i};">Z</span>`)}
    </div>
    <div class="mk-haze"></div>
    <div class="ce-at mk-mark"><svg viewBox="-20 -20 40 40" aria-hidden="true">${MK_EYE_GLYPH}</svg></div>
    ${line('Look into the Millennium Rod…', 2800, 1500, 8)}
    ${line('Your mind… is MINE!', 4400, 1300, 8)}
    ${line('Yes… Master… Marik…', 5800, 1400, 86, 'slave')}
    ${line('Now, mind slave… make ME the champion!', 7200, 1300, 8)}
    ${line('…yes… Master… Marik…', 9000, 1400, 8, 'dazed')}
    <div class="cegg-toast">Marik hypnotised himself.<small>Free will restored. Your tournament awaits!</small></div>`);
  if (overlay) playSound({ name: 'egg-mind-slave' });
}
