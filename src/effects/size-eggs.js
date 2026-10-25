// Start-screen "Size" picker easter eggs. Tap Small or X-Large SIZE_EGG_TAPS
// times fast (each tap within SIZE_EGG_GAP_MS of the last) and:
//
//   Small   -> Shrink Ray mishap (SHRINK_MS): a "Shrink" Spell Card zaps the
//              screen, the whole app shrinks to a postage stamp that wanders
//              around squeaking in a chipmunk voice, then boings back.
//   X-Large -> Obelisk headroom (OBELISK_MS): Obelisk the Tormentor rises
//              behind the screen with his head cut off at the top, crouches
//              awkwardly to peek in, tries to stand up and bonks his head.
//
// The size still changes on every tap. Timelines: "SIZE EGGS" in effects.css.
// Sounds: 'shrink-ray' and 'obelisk-headroom' in sounds.js (SIZE_EGG_SOUNDS).
const SIZE_EGG_TAPS = 10;
const SIZE_EGG_GAP_MS = 700;
const SHRINK_MS = 5000;
const OBELISK_MS = 6000;

const sizeEgg = { id: null, taps: 0, last: 0, busy: false };

// The Size buttons' onclick.
function tapUiScale(id) {
  setUiScale(id);
  if (sizeEgg.busy) return;

  const now = performance.now();
  const inCombo = sizeEgg.id === id && now - sizeEgg.last < SIZE_EGG_GAP_MS;
  sizeEgg.taps = inCombo ? sizeEgg.taps + 1 : 1;
  sizeEgg.id = id;
  sizeEgg.last = now;
  if (sizeEgg.taps < SIZE_EGG_TAPS) return;

  sizeEgg.taps = 0;
  if (id === 'small') fireShrinkRay();
  else if (id === 'xlarge') summonObeliskHeadroom();
}

function lockSizeEgg(ms) {
  sizeEgg.busy = true;
  setTimeout(() => { sizeEgg.busy = false; }, ms);
}

// --- Small: Shrink Ray mishap ----------------------------------------------------

function fireShrinkRay() {
  markEggFound('shrink-ray');
  const overlay = spawnFx('fx-shrink', SHRINK_MS + 100, {
    html: `
      <div class="shr-beam"></div>
      <div class="shr-flash"></div>
      <div class="shr-card">
        <div class="shr-card-name">Shrink</div>
        <div class="shr-card-art"><span>⇲</span></div>
        <div class="shr-card-type">[Spell Card ✦]</div>
        <div class="shr-card-text">Halve the ATK of 1 monster. Side effects may include: everything.</div>
      </div>
      <div class="shr-follow">
        <span class="ce-bubble shr-say shr-say--1">Eeek!!</span>
        <span class="ce-bubble shr-say shr-say--2">Down here!!</span>
        <span class="ce-bubble shr-say shr-say--3">Who shrunk the duel?!</span>
      </div>
      <div class="cegg-toast">Shrink: ATK halved. Dignity also halved.</div>
    `
  });
  if (!overlay) return;

  lockSizeEgg(SHRINK_MS);
  playSound({ name: 'shrink-ray' });
  restartClass(document.getElementById('app'), 'fx-shrunk', SHRINK_MS);
  restartClass(document.body, 'fx-shrink-desk', SHRINK_MS);
}

// --- X-Large: Obelisk headroom ---------------------------------------------------

const OBELISK_HEADROOM_SVG = `
  <svg viewBox="0 0 200 300" aria-hidden="true">
    <defs>
      <linearGradient id="ob-skin" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#1e3a8a"/>
        <stop offset="0.5" stop-color="#2563eb"/>
        <stop offset="1" stop-color="#1e3a8a"/>
      </linearGradient>
    </defs>
    <g fill="#172554" stroke="#0f172a" stroke-width="1.5" stroke-linejoin="round">
      <path d="M48 96 L2 30 L14 70 L0 82 L16 110 L4 130 L30 150 Z"/>
      <path d="M152 96 L198 30 L186 70 L200 82 L184 110 L196 130 L170 150 Z"/>
    </g>
    <g fill="url(#ob-skin)" stroke="#0f172a" stroke-width="1.5" stroke-linejoin="round">
      <path d="M50 92 Q22 104 22 160 L18 300 L54 300 L60 170 Q64 120 62 100 Z"/>
      <path d="M150 92 Q178 104 178 160 L182 300 L146 300 L140 170 Q136 120 138 100 Z"/>
      <path d="M54 86 Q100 72 146 86 L152 140 Q142 220 132 300 L68 300 Q58 220 48 140 Z"/>
      <rect x="86" y="58" width="28" height="30"/>
      <path d="M70 30 Q70 4 100 4 Q130 4 130 30 L128 58 Q100 76 72 58 Z"/>
    </g>
    <g fill="#3b82f6" opacity="0.8">
      <ellipse cx="80" cy="118" rx="20" ry="13"/>
      <ellipse cx="120" cy="118" rx="20" ry="13"/>
      <rect x="86" y="146" width="12" height="12" rx="3"/>
      <rect x="102" y="146" width="12" height="12" rx="3"/>
      <rect x="86" y="164" width="12" height="12" rx="3"/>
      <rect x="102" y="164" width="12" height="12" rx="3"/>
    </g>
    <ellipse cx="100" cy="88" rx="38" ry="8" fill="#fbbf24" stroke="#92400e" stroke-width="1.5"/>
    <g fill="#1e40af" stroke="#0f172a" stroke-width="1.5" stroke-linejoin="round">
      <polygon points="72,24 48,0 76,12"/>
      <polygon points="128,24 152,0 124,12"/>
      <polygon points="92,6 100,-16 108,6"/>
    </g>
    <path d="M80 31 L95 36 M120 31 L105 36" stroke="#0f172a" stroke-width="3" stroke-linecap="round"/>
    <g class="ob-eyes" fill="#f97316">
      <ellipse cx="88" cy="41" rx="7" ry="3.5"/>
      <ellipse cx="112" cy="41" rx="7" ry="3.5"/>
    </g>
    <path class="ob-mouth" d="M88 56 Q100 60 112 56" fill="none" stroke="#0f172a" stroke-width="2.5" stroke-linecap="round"/>
  </svg>`;

function summonObeliskHeadroom() {
  markEggFound('obelisk-headroom');
  const overlay = spawnFx('fx-obelisk', OBELISK_MS + 100, {
    html: `
      <div class="ob-dim"></div>
      <div class="ob-god">${OBELISK_HEADROOM_SVG}</div>
      <span class="ce-bubble ob-say ob-say--1">WHO BUILT THIS CEILING?!</span>
      <span class="ce-bubble ob-say ob-say--2">…hi.</span>
      <span class="ob-sweat ce-emoji">💧</span>
      <span class="ob-bonk">BONK!</span>
      <span class="ob-stars ce-emoji">💫</span>
      <div class="cegg-toast">Not even X-Large can fit a God.</div>
    `
  });
  if (!overlay) return;

  lockSizeEgg(OBELISK_MS);
  playSound({ name: 'obelisk-headroom' });
  const app = document.getElementById('app');
  // Footsteps while he rises, then the bonk.
  setTimeout(() => restartClass(app, 'fx-ob-quake', 1600), 300);
  setTimeout(() => restartClass(app, 'fx-ob-bonk', 500), OBELISK_MS * 0.76);
}
