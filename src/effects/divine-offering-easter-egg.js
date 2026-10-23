// Character-select easter egg. Hold Trizze's card (Legends Assembled) for
// DIVINE_PRESS_MS (it rumbles with a red/blue/gold aura) and the three
// Egyptian Gods rise behind it one by one: Obelisk, Slifer and Ra. They argue
// over who gets summoned, then all three dive into Trizze's card at once and
// get stuck in the doorway. They pop back out, the card boings back into
// place, and: "3 Tributes required. You have 0." The click that follows the
// hold is swallowed so the character isn't selected. The whole show is one
// CSS timeline keyed to the card's rect (--cx/--cy...); the sound is
// 'divine-offering' in sounds.js.
const DIVINE_CHARACTER_ID = 'trizze';
const DIVINE_PRESS_MS = 2000;
const DIVINE_TOTAL_MS = 5500;

const divineEgg = { timer: null, busy: false, swallowClick: false };

function startDivinePress(el) {
  divineEgg.swallowClick = false;
  if (divineEgg.busy) return;
  clearTimeout(divineEgg.timer);
  el.classList.add('divine-charging');
  divineEgg.timer = setTimeout(() => {
    el.classList.remove('divine-charging');
    summonDivineBeasts(el);
  }, DIVINE_PRESS_MS);
}

function cancelDivinePress(el) {
  clearTimeout(divineEgg.timer);
  el.classList.remove('divine-charging');
}

// Trizze's onclick asks this first: false right after a hold.
function divineAllowsClick() {
  if (!divineEgg.swallowClick) return true;
  divineEgg.swallowClick = false;
  return false;
}

const OBELISK_SVG = `
  <svg viewBox="0 0 120 150" aria-hidden="true">
    <path d="M30 70 Q2 40 4 96 Q14 80 26 92 Z M90 70 Q118 40 116 96 Q106 80 94 92 Z" fill="#1e293b" stroke="#0f172a" stroke-width="2"/>
    <path d="M28 150 L20 74 Q60 54 100 74 L92 150 Z" fill="#2563eb" stroke="#1e3a8a" stroke-width="2.5"/>
    <path d="M60 72 L60 140 M44 92 Q60 98 76 92 M46 110 Q60 116 74 110 M48 128 Q60 132 72 128" stroke="#1e3a8a" stroke-width="2" fill="none"/>
    <circle cx="24" cy="78" r="13" fill="#3b82f6" stroke="#1e3a8a" stroke-width="2.5"/>
    <circle cx="96" cy="78" r="13" fill="#3b82f6" stroke="#1e3a8a" stroke-width="2.5"/>
    <path d="M14 88 L10 132" stroke="#2563eb" stroke-width="13" stroke-linecap="round"/>
    <path d="M106 88 L110 132" stroke="#2563eb" stroke-width="13" stroke-linecap="round"/>
    <circle cx="10" cy="136" r="9" fill="#3b82f6" stroke="#1e3a8a" stroke-width="2"/>
    <circle cx="110" cy="136" r="9" fill="#3b82f6" stroke="#1e3a8a" stroke-width="2"/>
    <path d="M42 62 Q42 34 60 30 Q78 34 78 62 Q60 70 42 62 Z" fill="#3b82f6" stroke="#1e3a8a" stroke-width="2.5"/>
    <path d="M60 30 L60 6 M50 34 L42 14 M70 34 L78 14" stroke="#1d4ed8" stroke-width="5" stroke-linecap="round"/>
    <path d="M48 48 l9 3 M72 48 l-9 3" stroke="#ef4444" stroke-width="3.5" stroke-linecap="round"/>
    <path d="M52 60 L68 60" stroke="#1e3a8a" stroke-width="2.5" stroke-linecap="round"/>
  </svg>`;

const SLIFER_SVG = `
  <svg viewBox="0 0 120 150" aria-hidden="true">
    <path d="M44 70 Q10 38 6 84 Q20 72 34 86 Z M58 84 Q96 66 100 108 Q86 96 70 104 Z" fill="#7f1d1d" stroke="#450a0a" stroke-width="2"/>
    <path d="M34 150 Q6 120 34 96 Q62 72 46 50 Q36 34 56 26" fill="none" stroke="#450a0a" stroke-width="22" stroke-linecap="round"/>
    <path d="M34 150 Q6 120 34 96 Q62 72 46 50 Q36 34 56 26" fill="none" stroke="#dc2626" stroke-width="18" stroke-linecap="round"/>
    <path d="M30 140 Q16 120 34 104 M44 86 Q54 74 50 60" fill="none" stroke="#fca5a5" stroke-width="3" stroke-dasharray="3 5"/>
    <path d="M48 14 Q70 6 92 18 L112 22 L94 30 Q72 34 52 34 Z" fill="#dc2626" stroke="#450a0a" stroke-width="2"/>
    <path d="M54 36 Q76 40 104 46 L90 52 Q70 52 52 44 Z" fill="#b91c1c" stroke="#450a0a" stroke-width="2"/>
    <path d="M94 30 L98 34 L102 30 M84 32 L87 36 L90 33 M90 46 L93 42 L96 46" stroke="#fef3c7" stroke-width="1.5" fill="none"/>
    <ellipse cx="66" cy="14" rx="6" ry="3.5" fill="#450a0a"/>
    <path d="M62 14 L70 14" stroke="#fef3c7" stroke-width="1.2" stroke-dasharray="1.5 1.5"/>
    <circle cx="74" cy="22" r="3.5" fill="#fde047"/>
    <circle cx="75" cy="22" r="1.4" fill="#111"/>
    <path d="M48 16 L36 4 M54 12 L46 0" stroke="#fbbf24" stroke-width="3" stroke-linecap="round"/>
  </svg>`;

const RA_SVG = `
  <svg viewBox="0 0 120 150" aria-hidden="true">
    <path d="M50 76 Q20 50 2 60 Q14 66 10 72 Q22 74 18 82 Q32 82 30 90 Q44 88 50 94 Z" fill="#fbbf24" stroke="#92400e" stroke-width="2"/>
    <path d="M70 76 Q100 50 118 60 Q106 66 110 72 Q98 74 102 82 Q88 82 90 90 Q76 88 70 94 Z" fill="#fbbf24" stroke="#92400e" stroke-width="2"/>
    <path d="M44 150 L52 136 L60 150 L68 136 L76 150" fill="#f59e0b" stroke="#92400e" stroke-width="2"/>
    <path d="M40 138 Q34 90 60 70 Q86 90 80 138 Z" fill="#f59e0b" stroke="#92400e" stroke-width="2.5"/>
    <path d="M48 104 Q60 112 72 104 M50 120 Q60 126 70 120" stroke="#b45309" stroke-width="2" fill="none"/>
    <circle cx="60" cy="92" r="6" fill="#dc2626" stroke="#fde68a" stroke-width="1.5"/>
    <path d="M60 70 Q50 60 52 46 Q56 32 70 34 Q80 38 78 50 Q76 62 60 70 Z" fill="#fbbf24" stroke="#92400e" stroke-width="2.5"/>
    <path d="M76 44 L96 50 L76 54 Z" fill="#fde68a" stroke="#92400e" stroke-width="2"/>
    <path d="M56 36 Q44 20 52 6 Q58 22 64 34 Z M64 34 Q66 18 78 12 Q72 26 70 36 Z" fill="#f59e0b" stroke="#92400e" stroke-width="1.5"/>
    <circle cx="67" cy="45" r="3" fill="#7c2d12"/>
    <path d="M62 40 l9 2" stroke="#7c2d12" stroke-width="2" stroke-linecap="round"/>
  </svg>`;

function summonDivineBeasts(card) {
  const r = card.getBoundingClientRect();
  const cx = r.left + r.width / 2;
  const cy = r.top + r.height / 2;
  // Slifer and Ra stand either side of Obelisk; keep them on narrow screens.
  const spread = Math.min(115, Math.max(70, r.width / 2 - 40));
  const god = (name, svg, gx, rise, bubble, bubbleAt) => `
    <div class="divine-god divine-god--${name}" style="--gx: ${gx}px; --rise: ${rise}ms;">
      <div class="divine-act"><div class="divine-float">${svg}</div></div>
      <div class="divine-bubble" style="--at: ${bubbleAt}ms;">${bubble}</div>
    </div>`;

  const overlay = spawnFx('fx-divine', DIVINE_TOTAL_MS + 100, {
    vars: {
      '--cx': `${cx.toFixed(0)}px`,
      '--cy': `${cy.toFixed(0)}px`,
      '--cl': `${r.left.toFixed(0)}px`,
      '--ct': `${r.top.toFixed(0)}px`,
      '--cw': `${r.width.toFixed(0)}px`,
      '--ch': `${r.height.toFixed(0)}px`
    },
    html: `
      <div class="divine-door"></div>
      ${god('obelisk', OBELISK_SVG, 0, 330, 'Summon <b>ME</b>.', 2000)}
      ${god('slifer', SLIFER_SVG, -spread, 900, 'I was here first!', 2300)}
      ${god('ra', RA_SVG, spread, 1430, '🔥 Ra rules 🔥', 2600)}
      <div class="divine-toast">3 Tributes required. You have 0. 🙃<small>The gods will be back. Probably.</small></div>
    `
  });
  if (!overlay) return;

  divineEgg.busy = true;
  divineEgg.swallowClick = true;
  playSound({ name: 'divine-offering' });
  card.classList.add('divine-jammed');

  setTimeout(() => {
    card.classList.remove('divine-jammed');
    divineEgg.busy = false;
  }, DIVINE_TOTAL_MS);
}
