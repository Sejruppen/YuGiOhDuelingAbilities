// Duel-screen easter egg. Hold the Skill's Activate button for POT_PRESS_MS
// (it wobbles harder and glows greedier as it charges) and Pot of Greed
// pops out of it with a grin to explain itself: "It allows me to draw two
// cards." ... "...that's literally all." Then it sinks back into the button.
// The click that follows the hold is swallowed so the Skill isn't activated.
// The sound is 'pot-of-greed' in sounds.js.
const POT_PRESS_MS = 2000;
// Keep in sync with the `pot-*` timings in effects.css.
const POT_TOTAL_MS = 4600;

const potEgg = { timer: null, busy: false, swallowClick: false };

const POT_OF_GREED_SVG = `
  <svg class="pot-svg" viewBox="0 0 100 112" aria-hidden="true">
    <defs>
      <radialGradient id="pot-body" cx="0.38" cy="0.35" r="0.75">
        <stop offset="0" stop-color="#86efac"/>
        <stop offset="0.45" stop-color="#16a34a"/>
        <stop offset="1" stop-color="#14532d"/>
      </radialGradient>
      <linearGradient id="pot-rim" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#fde68a"/>
        <stop offset="1" stop-color="#b45309"/>
      </linearGradient>
    </defs>
    <ellipse cx="50" cy="108" rx="28" ry="4" fill="rgb(0 0 0 / 0.35)"/>
    <path d="M26 30 Q6 44 8 68 Q12 100 50 104 Q88 100 92 68 Q94 44 74 30 Z" fill="url(#pot-body)" stroke="#052e16" stroke-width="2.5"/>
    <rect x="24" y="20" width="52" height="12" rx="5" fill="url(#pot-rim)" stroke="#78350f" stroke-width="2"/>
    <ellipse cx="50" cy="12" rx="13" ry="7" fill="url(#pot-rim)" stroke="#78350f" stroke-width="2"/>
    <circle cx="50" cy="5" r="4" fill="url(#pot-rim)" stroke="#78350f" stroke-width="1.5"/>
    <g class="pot-brows" fill="none" stroke="#052e16" stroke-width="3.5" stroke-linecap="round">
      <path d="M24 46 L42 53"/>
      <path d="M76 46 L58 53"/>
    </g>
    <ellipse cx="36" cy="59" rx="6" ry="4.5" fill="#fef9c3" stroke="#052e16" stroke-width="2"/>
    <ellipse cx="64" cy="59" rx="6" ry="4.5" fill="#fef9c3" stroke="#052e16" stroke-width="2"/>
    <circle class="pot-pupil" cx="38" cy="60" r="2.4" fill="#052e16"/>
    <circle class="pot-pupil" cx="66" cy="60" r="2.4" fill="#052e16"/>
    <path d="M24 72 Q50 98 76 72 Q50 82 24 72 Z" fill="#450a0a" stroke="#052e16" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M28 74 Q50 84 72 74 L70 78 Q50 86 30 78 Z" fill="#f8fafc"/>
    <path d="M38 79 V83 M46 81 V85 M54 81 V85 M62 79 V83" stroke="#cbd5e1" stroke-width="1"/>
  </svg>
`;

function startPotPress(el) {
  potEgg.swallowClick = false;
  if (potEgg.busy) return;
  clearTimeout(potEgg.timer);
  el.classList.add('pot-charging');
  potEgg.timer = setTimeout(() => {
    el.classList.remove('pot-charging');
    summonPotOfGreed(el);
  }, POT_PRESS_MS);
}

function cancelPotPress(el) {
  clearTimeout(potEgg.timer);
  el.classList.remove('pot-charging');
}

// The Complete button's onclick asks this first: false right after a hold.
function potAllowsClick() {
  if (!potEgg.swallowClick) return true;
  potEgg.swallowClick = false;
  return false;
}

function summonPotOfGreed(button) {
  const r = button.getBoundingClientRect();
  const overlay = spawnFx('fx-pot', POT_TOTAL_MS + 100, {
    vars: {
      '--bx': `${(r.left + r.width / 2).toFixed(0)}px`,
      '--by': `${r.top.toFixed(0)}px`,
      // The speech bubble sits just above the pot (which is ~112px tall).
      '--bubble-bottom': `${(window.innerHeight - r.top + 124).toFixed(0)}px`
    },
    html: `
      <div class="pot-wrap"><div class="pot-bob">${POT_OF_GREED_SVG}</div></div>
      <div class="pot-bubble pot-bubble-1">It allows me to draw two cards.</div>
      <div class="pot-bubble pot-bubble-2">...that's literally all.</div>
    `
  });
  if (!overlay) return;

  potEgg.busy = true;
  potEgg.swallowClick = true;
  playSound({ name: 'pot-of-greed' });
  setTimeout(() => { potEgg.busy = false; }, POT_TOTAL_MS);
}
