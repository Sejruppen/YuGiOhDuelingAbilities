// LP easter egg. Heal your way up to HEAL_OVERFLOW_LP (e.g. by spamming the
// +1000 button) and the healing overflows: a green shockwave bursts out of the
// LP counter and floods the screen, "FULL HEAL!" shines in the glow, and the
// green slowly fades back to the duel as healing sparkles rain down. A long,
// happy healing fanfare plays along (see 'heal-overflow' in sounds.js).
const HEAL_OVERFLOW_LP = 30000;
// Keep in sync with the `heal-*` timings in effects.css.
const HEAL_GREENOUT_MS = 900;
const HEAL_FADE_START_MS = 2700;
const HEAL_TOTAL_MS = 6000;

const healEgg = { busy: false };

// Only when this change carries LP across the threshold, so it fires once per climb.
function isHealOverflow(from, to) {
  return !healEgg.busy && from < HEAL_OVERFLOW_LP && to >= HEAL_OVERFLOW_LP;
}

function triggerHealOverflow(anchor) {
  markEggFound('full-heal');
  const { x, y } = getCenter(anchor);
  const overlay = spawnFx('fx-heal-overflow', HEAL_TOTAL_MS + 100, {
    vars: { '--ox': `${x}px`, '--oy': `${y}px` },
    html: `
      <div class="heal-wave"></div>
      <div class="heal-wave heal-wave--late"></div>
      <div class="heal-orb"></div>
      <div class="heal-green"></div>
      <div class="heal-text">Full Heal!</div>
    `
  });
  if (!overlay) return;

  healEgg.busy = true;
  setTimeout(() => {
    // The screen is fully green: drop the giant scaled orb and waves so they
    // don't starve the long fade of frames, and let the app glow back in.
    overlay.querySelectorAll('.heal-orb, .heal-wave').forEach(el => el.remove());
    restartClass(document.getElementById('app'), 'fx-heal-wake', HEAL_TOTAL_MS - HEAL_GREENOUT_MS);
  }, HEAL_GREENOUT_MS);
  setTimeout(() => {
    spawnParticles(null, { type: 'heal', mode: 'rain', count: 60 });
  }, HEAL_FADE_START_MS);
  setTimeout(() => { healEgg.busy = false; }, HEAL_TOTAL_MS);
}
