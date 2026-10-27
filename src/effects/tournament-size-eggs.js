// Tournament setup: tapping the participant stepper past its limits.
//  - "+" at the max, 5 taps: MULTIPLY! The spell card flips up and Kuribohs
//    double, again and again, until the screen is full of them (the counter
//    tries to keep up). Then a giant Kuriboh rises and they all go poof.
//  - "-" at 2, 5 taps: "A duel... with nobody?" Two tiny duelists pop out of
//    the "2", shrug, and settle it with rock-paper-scissors instead.
const TN_LIMIT_TAPS = 5;
const TN_LIMIT_GAP_MS = 900;
const KURIBOH_EGG_MS = 6200;
const RPS_EGG_MS = 5500;

const tnLimitEgg = { dir: 0, taps: 0, last: 0, busy: false };

// Called by changeTournamentSize() each time a tap bumps into the limit.
function countTournamentLimitTap(delta) {
  const now = performance.now();
  if (delta !== tnLimitEgg.dir || now - tnLimitEgg.last > TN_LIMIT_GAP_MS) tnLimitEgg.taps = 0;
  tnLimitEgg.dir = delta;
  tnLimitEgg.last = now;
  tnLimitEgg.taps += 1;
  if (tnLimitEgg.taps < TN_LIMIT_TAPS || tnLimitEgg.busy) return;
  tnLimitEgg.taps = 0;
  if (delta > 0) playKuribohMultiply();
  else if (tournament.size === TOURNAMENT_MIN_SIZE) playRockPaperScissors();
}

function spawnTournamentEgg(kind, lifetime, vars, html) {
  const overlay = spawnFx(`fx-cegg fx-tne fx-tne--${kind}`, lifetime + 100, { vars, html });
  if (!overlay) return null;
  tnLimitEgg.busy = true;
  setTimeout(() => { tnLimitEgg.busy = false; }, lifetime);
  return overlay;
}

// Sets the stepper's number for the gag; null puts the real size back.
function setTournamentSizeText(text) {
  const el = document.querySelector('.tn-size-value');
  if (el) el.textContent = text ?? String(tournament.size);
}

// --- Kuriboh: Multiply ------------------------------------------------------------

// Defined once per overlay and drawn with <use>, so 127 Kuribohs stay cheap.
const KURIBOH_SYMBOL = `
  <svg aria-hidden="true" style="position: absolute; width: 0; height: 0;">
    <defs>
      <symbol id="tnKuriboh" viewBox="0 0 120 112">
        <ellipse cx="16" cy="64" rx="10" ry="6" fill="#4d7c0f" transform="rotate(-25 16 64)"/>
        <ellipse cx="104" cy="64" rx="10" ry="6" fill="#4d7c0f" transform="rotate(25 104 64)"/>
        <ellipse cx="44" cy="100" rx="11" ry="7" fill="#4d7c0f"/>
        <ellipse cx="76" cy="100" rx="11" ry="7" fill="#4d7c0f"/>
        <circle cx="60" cy="54" r="42" fill="#7c4a1e" stroke="#5b3413" stroke-width="9" stroke-dasharray="2 5" stroke-linecap="round"/>
        <circle cx="60" cy="54" r="36" fill="#8b5a2b"/>
        <circle cx="43" cy="50" r="12" fill="#fff" stroke="#1c0f05" stroke-width="2"/>
        <circle cx="77" cy="50" r="12" fill="#fff" stroke="#1c0f05" stroke-width="2"/>
        <circle cx="45" cy="52" r="6" fill="#1c0f05"/>
        <circle cx="79" cy="52" r="6" fill="#1c0f05"/>
        <circle cx="47" cy="49" r="2" fill="#fff"/>
        <circle cx="81" cy="49" r="2" fill="#fff"/>
        <path d="M54 72 q6 5 12 0" fill="none" stroke="#1c0f05" stroke-width="3" stroke-linecap="round"/>
      </symbol>
    </defs>
  </svg>`;

const kuribohSvg = () => '<svg viewBox="0 0 120 112" aria-hidden="true"><use href="#tnKuriboh"/></svg>';

// The card art: an evil yellow Kuriboh-burst with its shadow copies behind.
const MULTIPLY_ART_SVG = `
  <svg viewBox="0 0 100 80" aria-hidden="true">
    <rect width="100" height="80" fill="#1e3a8a"/>
    <path d="M0 10 H100 M0 24 H100 M0 38 H100 M0 52 H100 M0 66 H100" stroke="#3b82f6" stroke-width="5" opacity="0.4"/>
    <g fill="#78350f" opacity="0.7">
      <path d="M22 40 L8 22 L26 28 L32 10 L40 26 L50 18 L48 34 L38 56 Z"/>
      <path d="M78 40 L92 22 L74 28 L68 10 L60 26 L50 18 L52 34 L62 56 Z"/>
    </g>
    <path d="M50 12 L57 28 L76 18 L68 36 L90 42 L68 48 L74 66 L56 56 L50 74 L44 56 L26 66 L32 48 L10 42 L32 36 L24 18 L43 28 Z" fill="#facc15" stroke="#a16207" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M38 36 L46 40 L38 42 Z M62 36 L54 40 L62 42 Z" fill="#dc2626"/>
    <path d="M38 50 Q50 60 62 50 Q50 54 38 50 Z" fill="#7f1d1d"/>
    <path d="M42 51 L44 54 L46 52 L48 55 L50 53 L52 55 L54 52 L56 54 L58 51" fill="none" stroke="#fff" stroke-width="1"/>
  </svg>`;

// Each wave doubles: 1, 2, 4 ... 64 (127 Kuribohs), arriving faster and faster.
const KURIBOH_WAVES_MS = [900, 1500, 1950, 2300, 2600, 2850, 3050];
// The stepper tries to count them: size + 1, + 3, + 7 ... then gives up.
const kuribohCounter = size => [
  ...KURIBOH_WAVES_MS.map((at, wave) => [String(size + 2 ** (wave + 1) - 1), at]),
  ['999', 3350], ['∞', 3650], ['NO', 3950]
];
const KURIBOH_LINES = ['Kuri!', 'Kuri~', 'Kuri?!', 'Kurikuri!', 'Am I in?', 'Is there cake?', 'Don\'t push!', 'Kuri kuri kuri'];

function renderKuriboh(wave, index) {
  const first = wave === 0;
  const left = first ? 50 : ceRand(4, 96);
  const top = first ? 48 : ceRand(6, 94);
  const size = first ? 110 : ceRand(46, 92) * (1 - wave * 0.05);
  const delay = KURIBOH_WAVES_MS[wave] + (first ? 0 : ceRand(0, 180));
  const roll = Math.random();
  const extra = roll < 0.08 ? '<span class="tn-kb-acc tn-kb-shades ce-emoji">🕶️</span>'
    : roll < 0.14 ? '<span class="tn-kb-acc tn-kb-hat ce-emoji">🎩</span>'
    : roll < 0.18 ? '<span class="tn-kb-acc tn-kb-hat ce-emoji">🥳</span>'
    : '';
  const line = (first || (wave >= 2 && index % 9 === 0)) ? `<span class="ce-bubble tn-kb-say">${first ? 'Kuri!' : cePick(KURIBOH_LINES)}</span>` : '';
  return `
    <span class="tn-kb" style="left: ${left.toFixed(1)}%; top: ${top.toFixed(1)}%; --sz: ${size.toFixed(0)}px; --d: ${delay.toFixed(0)}ms; --o: ${ceRand(0, 320).toFixed(0)}ms; --w: ${ceRand(380, 620).toFixed(0)}ms; z-index: ${wave * 10 + index % 10};">
      <span class="tn-kb-inner">${kuribohSvg()}${extra}</span>${line}
    </span>`;
}

function playKuribohMultiply() {
  markEggFound('kuriboh-multiply');
  const kuribohs = KURIBOH_WAVES_MS.map((_, wave) => ceRange(2 ** wave, i => renderKuriboh(wave, i))).join('');
  const overlay = spawnTournamentEgg('multiply', KURIBOH_EGG_MS, {}, `
    ${KURIBOH_SYMBOL}
    <div class="ce-flash tn-mult-flash"></div>
    <div class="ce-at tn-mult-card">
      <span class="tn-mult-name">MULTIPLY</span>
      <span class="tn-mult-icon">魔</span>
      <span class="tn-mult-art">${MULTIPLY_ART_SVG}</span>
      <span class="tn-mult-text">[SPELL CARD]</span>
    </div>
    ${kuribohs}
    <div class="tn-kb-giant">
      <span class="tn-kb-giant-body">${kuribohSvg()}</span>
      <span class="ce-bubble tn-kb-giant-say">KURIIIII!!</span>
    </div>
    <div class="cegg-toast">Multiply! The bracket is full.<small>Max ${tournament.size} duelists. Kuribohs don't count.</small></div>`);
  if (!overlay) return;
  playSound({ name: 'tn-kuriboh-multiply' });
  kuribohCounter(tournament.size).forEach(([text, at]) => setTimeout(() => setTournamentSizeText(text), at));
  setTimeout(() => setTournamentSizeText(null), 4900);
}

// --- Rock-paper-scissors at 2 -----------------------------------------------------

// A tiny duelist: spiky Yugi hair or messy Joey hair. Arms are separate groups
// so they can shrug.
const rpsDuelistSvg = hair => `
  <svg viewBox="0 0 50 72" aria-hidden="true">
    <rect x="17" y="54" width="6" height="15" rx="2" fill="#1f2937"/>
    <rect x="27" y="54" width="6" height="15" rx="2" fill="#1f2937"/>
    <g class="tn-rps-arm tn-rps-arm--l"><rect x="6" y="36" width="8" height="17" rx="4" fill="${hair === 'yugi' ? '#1e3a8a' : '#15803d'}"/><circle cx="10" cy="53" r="3.5" fill="#fde2c8"/></g>
    <g class="tn-rps-arm tn-rps-arm--r"><rect x="36" y="36" width="8" height="17" rx="4" fill="${hair === 'yugi' ? '#1e3a8a' : '#15803d'}"/><circle cx="40" cy="53" r="3.5" fill="#fde2c8"/></g>
    <rect x="12" y="34" width="26" height="23" rx="6" fill="${hair === 'yugi' ? '#1e3a8a' : '#15803d'}"/>
    <circle cx="25" cy="23" r="12" fill="#fde2c8"/>
    <circle cx="21" cy="24" r="1.7" fill="#111"/>
    <circle cx="29" cy="24" r="1.7" fill="#111"/>
    <path d="M22 29 q3 2 6 0" fill="none" stroke="#7c2d12" stroke-width="1.3" stroke-linecap="round"/>
    ${hair === 'yugi'
      ? `<path d="M11 21 L4 5 L16 12 L18 0 L25 10 L32 0 L34 12 L46 5 L39 21 Q25 13 11 21 Z" fill="#111827" stroke="#be123c" stroke-width="2" stroke-linejoin="round"/>
         <path d="M19 13 L21 26 L25 16 L29 26 L31 13 Z" fill="#facc15"/>`
      : `<path d="M12 23 Q9 7 25 7 Q41 7 38 23 L35 15 L31 19 L28 12 L24 18 L20 12 L16 19 Z" fill="#fbbf24" stroke="#b45309" stroke-width="1.2" stroke-linejoin="round"/>`}
  </svg>`;

const RPS_THROWS = ['✊', '✋', '✌️'];
const RPS_BEATS = { '✊': '✌️', '✋': '✊', '✌️': '✋' };

function playRockPaperScissors() {
  markEggFound('rock-paper-scissors');
  const anchor = document.querySelector('.tn-size-value')?.getBoundingClientRect();
  const cx = anchor ? Math.min(Math.max(anchor.left + anchor.width / 2, 120), window.innerWidth - 120) : window.innerWidth / 2;
  const cy = anchor ? Math.max(anchor.top + anchor.height / 2, 110) : window.innerHeight / 3;
  const left = cePick(RPS_THROWS);
  const right = cePick(RPS_THROWS);
  const outcome = left === right ? 'tie' : RPS_BEATS[left] === right ? 'l-wins' : 'r-wins';
  const verdict = outcome === 'tie' ? 'Tie… ¯\\_(ツ)_/¯' : outcome === 'l-wins' ? 'Yugi wins the tournament!' : 'Joey wins the tournament!';
  const overlay = spawnTournamentEgg(`rps fx-tne--${outcome}`, RPS_EGG_MS, { '--cx': `${cx.toFixed(0)}px`, '--cy': `${cy.toFixed(0)}px` }, `
    <div class="tn-rps-dim"></div>
    <div class="ce-at tn-rps-duelist tn-rps-duelist--l">${rpsDuelistSvg('yugi')}</div>
    <div class="ce-at tn-rps-duelist tn-rps-duelist--r">${rpsDuelistSvg('joey')}</div>
    <span class="ce-at tn-rps-hand tn-rps-hand--l"><span class="tn-rps-fist ce-emoji">✊</span><span class="tn-rps-throw ce-emoji">${left}</span></span>
    <span class="ce-at tn-rps-hand tn-rps-hand--r"><span class="tn-rps-fist ce-emoji">✊</span><span class="tn-rps-throw ce-emoji">${right}</span></span>
    <span class="ce-at ce-bubble tn-rps-say tn-rps-say--1">A duel… with nobody?</span>
    <span class="ce-at ce-bubble tn-rps-say tn-rps-say--2">Rock, paper, scissors!</span>
    <span class="ce-at ce-bubble tn-rps-say tn-rps-say--3">${verdict}</span>
    <div class="cegg-toast">Minimum 2 duelists.<small>Rock-paper-scissors is not an official format.</small></div>`);
  if (!overlay) return;
  playSound({ name: outcome === 'tie' ? 'tn-rps-tie' : 'tn-rps-win' });
  document.querySelector('.tn-size-value')?.classList.add('tn-size-hidden');
  setTimeout(() => document.querySelector('.tn-size-value')?.classList.remove('tn-size-hidden'), RPS_EGG_MS - 300);
}
