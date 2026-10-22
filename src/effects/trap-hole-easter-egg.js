// Duel-screen easter egg. Hold the Comeback's Activate button for
// TRAP_PRESS_MS (it wobbles while a dark shadow spreads beneath it) and you
// spring a Trap Hole: a pit opens under the button, it teeters and drops in
// with a falling slide whistle and a distant thud, a "TRAP HOLE — Beware of
// falling Comebacks" sign springs up out of the pit, and then the button is
// catapulted back out with a big boing and bounces into place. The click
// that follows the hold is swallowed so the Comeback isn't activated.
// The sound is 'trap-hole' in sounds.js.
const TRAP_PRESS_MS = 2000;
// Keep in sync with the `trap-*` timings in effects.css.
const TRAP_TOTAL_MS = 4200;
const TRAP_HEADROOM = 150;
const TRAP_SIGN_WIDTH = 230;

const trapEgg = { timer: null, busy: false, swallowClick: false };

function startTrapPress(el) {
  trapEgg.swallowClick = false;
  if (trapEgg.busy) return;
  clearTimeout(trapEgg.timer);
  el.classList.add('trap-charging');
  trapEgg.timer = setTimeout(() => {
    el.classList.remove('trap-charging');
    springTrapHole(el);
  }, TRAP_PRESS_MS);
}

function cancelTrapPress(el) {
  clearTimeout(trapEgg.timer);
  el.classList.remove('trap-charging');
}

// The Activate button's onclick asks this first: false right after a hold.
function trapAllowsClick() {
  if (!trapEgg.swallowClick) return true;
  trapEgg.swallowClick = false;
  return false;
}

function springTrapHole(button) {
  const r = button.getBoundingClientRect();
  const cx = r.left + r.width / 2;
  // Everything that "goes into" the pit lives in a box whose bottom edge is
  // the pit's centre line, so it vanishes as it crosses it.
  const clipW = Math.max(r.width + 40, TRAP_SIGN_WIDTH + 20);
  const clipLeft = cx - clipW / 2;
  const clipTop = r.top - TRAP_HEADROOM;

  const clone = button.cloneNode(true);
  ['onclick', 'onpointerdown', 'onpointerup', 'onpointerleave', 'onpointercancel', 'oncontextmenu'].forEach(a => clone.removeAttribute(a));
  clone.classList.add('trap-clone');
  clone.style.cssText = `left: ${(r.left - clipLeft).toFixed(0)}px; top: ${TRAP_HEADROOM}px; width: ${r.width.toFixed(0)}px; height: ${r.height.toFixed(0)}px;`;

  const overlay = spawnFx('fx-trap-hole', TRAP_TOTAL_MS + 100, {
    vars: {
      '--hole-x': `${cx.toFixed(0)}px`,
      '--hole-y': `${r.bottom.toFixed(0)}px`,
      '--hole-w': `${(r.width + 34).toFixed(0)}px`,
      '--clip-left': `${clipLeft.toFixed(0)}px`,
      '--clip-top': `${clipTop.toFixed(0)}px`,
      '--clip-w': `${clipW.toFixed(0)}px`,
      '--clip-h': `${(r.bottom - clipTop).toFixed(0)}px`,
      '--sign-w': `${TRAP_SIGN_WIDTH}px`
    },
    html: `
      <div class="trap-pit"></div>
      <div class="trap-clip">
        <div class="trap-sign">
          <div class="trap-sign-board"><strong>TRAP HOLE</strong><span>Beware of falling Comebacks</span></div>
          <div class="trap-sign-post"></div>
        </div>
      </div>
    `
  });
  if (!overlay) return;
  overlay.querySelector('.trap-clip').appendChild(clone);

  trapEgg.busy = true;
  trapEgg.swallowClick = true;
  playSound({ name: 'trap-hole' });
  button.classList.add('trap-hidden');
  setTimeout(() => {
    button.classList.remove('trap-hidden');
    trapEgg.busy = false;
  }, TRAP_TOTAL_MS);
}
