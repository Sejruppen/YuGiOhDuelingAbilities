// LP easter egg. Survive a hit on exactly LAST_STAND_LP (see constants.js)
// and the duel turns into a last stand: the screen shakes hard, the edges
// pulse red in time with three pounding heartbeats, and "UNSTOPPABLE!" slams
// in. The sound is 'last-stand' in sounds.js. From then on the LP bar keeps
// pulsing red for the rest of the duel (state.lastStand, see lp-bar.js).
// It doesn't block taps, so play goes on.
// Keep in sync with the `stand-*` timings in effects.css.
const LAST_STAND_SHAKE_MS = 1200;
const LAST_STAND_TOTAL_MS = 4200;

function isLastStand(from, to) {
  return to === LAST_STAND_LP && from > LAST_STAND_LP;
}

function triggerLastStand(app) {
  restartClass(app, 'fx-last-stand-shake', LAST_STAND_SHAKE_MS);
  spawnFx('fx-last-stand', LAST_STAND_TOTAL_MS + 100, {
    html: `
      <div class="stand-vignette"></div>
      <div class="stand-banner"><span class="stand-text">Unstoppable!</span></div>
    `
  });
}
