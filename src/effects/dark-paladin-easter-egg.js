// Character-select easter egg. Hold Theotaur's card (Dark Paladin's Legion)
// for PALADIN_PRESS_MS (it crackles with a dark magic aura) and Dark Magician
// and Buster Blader fly in from either side, spiral into a Polymerization
// vortex and fuse into Dark Paladin. The Polymerization card that summoned him
// floats up beside him... and he slices it in half: "Spell negated." (that's
// his effect, after all). The click that follows the hold is swallowed so the
// character isn't selected. The whole show is one CSS timeline keyed to the
// card's centre (--cx/--cy); the sound is 'paladin-fusion' in sounds.js.
const PALADIN_CHARACTER_ID = 'theotaur';
const PALADIN_PRESS_MS = 2000;
const PALADIN_TOTAL_MS = 5000;

const paladinEgg = { timer: null, busy: false, swallowClick: false };

function startPaladinPress(el) {
  paladinEgg.swallowClick = false;
  if (paladinEgg.busy) return;
  clearTimeout(paladinEgg.timer);
  el.classList.add('paladin-charging');
  paladinEgg.timer = setTimeout(() => {
    el.classList.remove('paladin-charging');
    summonDarkPaladin(el);
  }, PALADIN_PRESS_MS);
}

function cancelPaladinPress(el) {
  clearTimeout(paladinEgg.timer);
  el.classList.remove('paladin-charging');
}

// Theotaur's onclick asks this first: false right after a hold.
function paladinAllowsClick() {
  if (!paladinEgg.swallowClick) return true;
  paladinEgg.swallowClick = false;
  return false;
}

const PALADIN_DM_SVG = `
  <svg viewBox="0 0 100 120" aria-hidden="true">
    <line x1="80" y1="22" x2="72" y2="116" stroke="#4c1d95" stroke-width="4" stroke-linecap="round"/>
    <path d="M74 24 Q80 8 86 24" fill="none" stroke="#a78bfa" stroke-width="2.5"/>
    <circle cx="80" cy="20" r="6" fill="#4ade80" stroke="#14532d" stroke-width="1.5"/>
    <path d="M28 116 L37 58 Q50 50 63 58 L72 116 Z" fill="#6d28d9" stroke="#2e1065" stroke-width="2"/>
    <path d="M30 108 L70 108" stroke="#c4b5fd" stroke-width="3"/>
    <path d="M50 58 L50 108" stroke="#a78bfa" stroke-width="1.5"/>
    <ellipse cx="36" cy="60" rx="9" ry="6" fill="#7c3aed" stroke="#fbbf24" stroke-width="1.5"/>
    <ellipse cx="64" cy="60" rx="9" ry="6" fill="#7c3aed" stroke="#fbbf24" stroke-width="1.5"/>
    <path d="M64 64 Q72 70 76 64" fill="none" stroke="#6d28d9" stroke-width="6" stroke-linecap="round"/>
    <circle cx="50" cy="46" r="9" fill="#f5d0b9" stroke="#7c2d12" stroke-width="1"/>
    <path d="M45 45 l3 0 M52 45 l3 0" stroke="#1e1b4b" stroke-width="2" stroke-linecap="round"/>
    <path d="M36 46 Q38 20 70 6 Q58 22 64 46 Q56 38 50 38 Q42 38 36 46 Z" fill="#6d28d9" stroke="#fbbf24" stroke-width="1.5"/>
    <path d="M40 40 Q50 32 60 40" fill="none" stroke="#fbbf24" stroke-width="2"/>
  </svg>`;

const PALADIN_BB_SVG = `
  <svg viewBox="0 0 100 120" aria-hidden="true">
    <polygon points="73,4 85,4 86,88 72,88" fill="#cbd5e1" stroke="#475569" stroke-width="2"/>
    <path d="M79 10 L79 84" stroke="#f8fafc" stroke-width="2"/>
    <rect x="64" y="86" width="30" height="6" rx="2" fill="#fbbf24" stroke="#78350f" stroke-width="1"/>
    <rect x="76" y="92" width="6" height="18" rx="2" fill="#78350f"/>
    <path d="M30 116 L35 62 Q50 52 65 62 L70 116 Z" fill="#3b0764" stroke="#1e1b4b" stroke-width="2"/>
    <path d="M38 70 L62 70 M40 84 L60 84 M42 98 L58 98" stroke="#fbbf24" stroke-width="2"/>
    <path d="M24 66 Q34 52 44 62 Z M76 66 Q66 52 56 62 Z" fill="#581c87" stroke="#fbbf24" stroke-width="1.5"/>
    <path d="M62 68 Q72 80 78 96" fill="none" stroke="#3b0764" stroke-width="7" stroke-linecap="round"/>
    <circle cx="50" cy="44" r="12" fill="#4c1d95" stroke="#1e1b4b" stroke-width="2"/>
    <path d="M39 38 Q28 30 30 16 Q36 30 44 34 Z M61 38 Q72 30 70 16 Q64 30 56 34 Z" fill="#fbbf24" stroke="#78350f" stroke-width="1"/>
    <rect x="41" y="42" width="18" height="5" rx="2" fill="#0f0a1e"/>
    <path d="M44 44.5 l3 0 M53 44.5 l3 0" stroke="#fde047" stroke-width="2" stroke-linecap="round"/>
  </svg>`;

const PALADIN_SVG = `
  <svg viewBox="0 0 120 140" aria-hidden="true">
    <path d="M40 62 Q22 100 26 136 L94 136 Q98 100 80 62 Z" fill="#1e3a8a" stroke="#0f172a" stroke-width="2"/>
    <path d="M34 134 L39 70 Q60 58 81 70 L86 134 Z" fill="#1d4ed8" stroke="#0f172a" stroke-width="2"/>
    <path d="M60 72 L60 132" stroke="#22d3ee" stroke-width="2"/>
    <path d="M44 80 L76 80 M42 96 L78 96 M40 112 L80 112" stroke="#fbbf24" stroke-width="2"/>
    <path d="M26 74 L40 60 L48 70 L36 82 Z M94 74 L80 60 L72 70 L84 82 Z" fill="#fbbf24" stroke="#78350f" stroke-width="1.5"/>
    <path d="M22 68 L30 64 M98 68 L90 64" stroke="#fbbf24" stroke-width="3" stroke-linecap="round"/>
    <circle cx="60" cy="50" r="10" fill="#f5d0b9" stroke="#7c2d12" stroke-width="1"/>
    <path d="M54 50 l4 -1 M62 49 l4 1" stroke="#0e7490" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M48 46 Q50 30 60 28 Q70 30 72 46 Q66 40 60 40 Q54 40 48 46 Z" fill="#1d4ed8" stroke="#fbbf24" stroke-width="1.5"/>
    <path d="M50 38 Q36 30 36 12 Q44 28 54 32 Z M70 38 Q84 30 84 12 Q76 28 66 32 Z" fill="#fbbf24" stroke="#78350f" stroke-width="1"/>
    <circle cx="60" cy="35" r="2.6" fill="#22d3ee"/>
    <g class="paladin-blade">
      <path d="M78 72 Q90 70 96 66" fill="none" stroke="#1d4ed8" stroke-width="7" stroke-linecap="round"/>
      <line x1="98" y1="22" x2="98" y2="118" stroke="#fbbf24" stroke-width="3.5" stroke-linecap="round"/>
      <path d="M98 0 Q110 12 104 24 L98 28 L92 24 Q90 12 98 0 Z" fill="#e2e8f0" stroke="#64748b" stroke-width="1.2"/>
      <path d="M98 140 Q86 128 92 116 L98 112 L104 116 Q106 128 98 140 Z" fill="#e2e8f0" stroke="#64748b" stroke-width="1.2"/>
      <circle cx="98" cy="68" r="4" fill="#22d3ee" stroke="#fbbf24" stroke-width="1.5"/>
    </g>
  </svg>`;

function summonDarkPaladin(card) {
  const r = card.getBoundingClientRect();
  const cx = r.left + r.width / 2;
  const cy = r.top + r.height / 2;
  const poly = '<div class="paladin-poly-face"><span class="paladin-poly-name">Polymerization</span><span class="paladin-poly-art">🌀</span><span class="paladin-poly-type">SPELL</span></div>';

  const overlay = spawnFx('fx-paladin', PALADIN_TOTAL_MS + 100, {
    vars: { '--cx': `${cx.toFixed(0)}px`, '--cy': `${cy.toFixed(0)}px` },
    html: `
      <div class="paladin-vortex"></div>
      <div class="paladin-hero paladin-dm">${PALADIN_DM_SVG}</div>
      <div class="paladin-hero paladin-bb">${PALADIN_BB_SVG}</div>
      <div class="paladin-flash"></div>
      <div class="paladin-ring"></div>
      <div class="paladin-knight"><div class="paladin-bob">${PALADIN_SVG}</div></div>
      <div class="paladin-poly">
        <div class="paladin-poly-half is-a">${poly}</div>
        <div class="paladin-poly-half is-b">${poly}</div>
        <span class="paladin-slash"></span>
      </div>
      <div class="paladin-say">Spell negated.</div>
      <div class="paladin-toast">Dark Paladin joins Theotaur's Legion. ⚔️<small>Polymerization did not survive.</small></div>
    `
  });
  if (!overlay) return;

  paladinEgg.busy = true;
  paladinEgg.swallowClick = true;
  playSound({ name: 'paladin-fusion' });
  card.classList.add('paladin-empowered');

  setTimeout(() => {
    card.classList.remove('paladin-empowered');
    paladinEgg.busy = false;
  }, PALADIN_TOTAL_MS);
}
