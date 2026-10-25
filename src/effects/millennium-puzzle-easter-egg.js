// Duel-screen easter egg. Tap the lock icons of the three hidden cards in
// order — Skill, Comeback, Quest — and each lights up gold with a rising
// chime ('puzzle-tap'). On the third, the locks fly off their cards and
// slam together into the Millennium Puzzle, which glows and hums with
// ancient power ('puzzle-assemble' in sounds.js).
const PUZZLE_ORDER = ['skill', 'comeback', 'quest'];
const PUZZLE_TAP_TIMEOUT_MS = 3000;
// Keep in sync with the `puzzle-*` timings in effects.css.
const PUZZLE_TOTAL_MS = 5200;

const puzzleEgg = { step: 0, timer: null, busy: false };

const PUZZLE_SVG = `
  <svg class="puzzle-svg" viewBox="0 0 120 124" aria-hidden="true">
    <defs>
      <linearGradient id="puzzle-gold" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#fef3c7"/>
        <stop offset="0.35" stop-color="#fbbf24"/>
        <stop offset="0.7" stop-color="#d97706"/>
        <stop offset="1" stop-color="#92400e"/>
      </linearGradient>
    </defs>
    <circle cx="60" cy="9" r="6" fill="none" stroke="url(#puzzle-gold)" stroke-width="3.5"/>
    <polygon points="8,18 112,18 60,118" fill="url(#puzzle-gold)" stroke="#78350f" stroke-width="2.5" stroke-linejoin="round"/>
    <g fill="none" stroke="#92400e" stroke-width="1.2" opacity="0.75">
      <path d="M21 43 H99 M34 68 H86 M47 93 H73"/>
      <path d="M34 18 L41 43 M60 18 V43 M86 18 L79 43 M47 43 L52 68 M73 43 L68 68 M60 68 V93"/>
    </g>
    <g class="puzzle-eye">
      <path d="M36 36 Q60 18 84 36 Q60 52 36 36 Z" fill="#451a03" stroke="#fef3c7" stroke-width="2"/>
      <circle cx="60" cy="36" r="7" fill="#fef3c7"/>
      <circle cx="60" cy="36" r="3.5" fill="#451a03"/>
      <path d="M55 46 L52 60 M64 46 Q74 58 70 62" fill="none" stroke="#451a03" stroke-width="3" stroke-linecap="round"/>
      <path d="M34 30 Q60 12 86 30" fill="none" stroke="#451a03" stroke-width="3" stroke-linecap="round"/>
    </g>
  </svg>
`;

// Called from the lock icon on a hidden card.
function tapLockMedallion(type, el) {
  if (puzzleEgg.busy) return;

  clearTimeout(puzzleEgg.timer);
  if (type === PUZZLE_ORDER[puzzleEgg.step]) {
    puzzleEgg.step++;
  } else {
    // A wrong lock breaks the sequence (unless it starts it over).
    puzzleEgg.step = type === PUZZLE_ORDER[0] ? 1 : 0;
    if (!puzzleEgg.step) return;
  }

  playSound({ name: 'puzzle-tap', step: puzzleEgg.step });
  restartClass(el, 'puzzle-lit', 1200);

  if (puzzleEgg.step === PUZZLE_ORDER.length) {
    puzzleEgg.step = 0;
    assembleMillenniumPuzzle();
    return;
  }
  puzzleEgg.timer = setTimeout(() => { puzzleEgg.step = 0; }, PUZZLE_TAP_TIMEOUT_MS);
}

function assembleMillenniumPuzzle() {
  const cx = window.innerWidth / 2;
  const cy = window.innerHeight * 0.42;
  const locks = PUZZLE_ORDER
    .map(type => document.querySelector(`[data-fx-card="${type}"] .lock-medallion`))
    .filter(Boolean);

  // Each lock flies from where it sits on its card to the middle.
  const flyers = locks.map((lock, i) => {
    const r = lock.getBoundingClientRect();
    const x = r.left + r.width / 2;
    const y = r.top + r.height / 2;
    const vars = `--x: ${x.toFixed(0)}px; --y: ${y.toFixed(0)}px; --dx: ${(cx - x).toFixed(0)}px; --dy: ${(cy - y).toFixed(0)}px; --i: ${i}`;
    return `<div class="puzzle-flyer" style="${vars}">${LOCK_ICON}</div>`;
  }).join('');

  const overlay = spawnFx('fx-puzzle', PUZZLE_TOTAL_MS + 100, {
    vars: { '--cx': `${cx.toFixed(0)}px`, '--cy': `${cy.toFixed(0)}px` },
    html: `
      <div class="puzzle-dim"></div>
      <div class="puzzle-rays"></div>
      ${flyers}
      <div class="puzzle-flash"></div>
      <div class="puzzle-item"><div class="puzzle-glow">${PUZZLE_SVG}</div></div>
      <div class="puzzle-text">The Millennium Puzzle<br>is complete!</div>
    `
  });
  if (!overlay) return;

  puzzleEgg.busy = true;
  markEggFound('millennium-puzzle');
  playSound({ name: 'puzzle-assemble' });
  locks.forEach(lock => restartClass(lock, 'puzzle-taken', PUZZLE_TOTAL_MS));
  setTimeout(() => { puzzleEgg.busy = false; }, PUZZLE_TOTAL_MS);
}
