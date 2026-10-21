// Duel-screen easter egg. Tap a used-up ability card SCREW_TAPS times in a
// row: the first taps are denied (the card shakes to a "nope" buzzer that
// climbs in pitch), then Kaiba takes over. "SCREW THE RULES, I HAVE MONEY!"
// slams onto the screen, gold coins rain down, and the USED stamp gets kicked
// clean off the card — which really does give the ability 1 use back.
// The sounds are 'used-deny' and 'screw-the-rules' in sounds.js.
const SCREW_TAPS = 5;
const SCREW_COMBO_TIMEOUT_MS = 1500;
// Keep in sync with the `screw-*` timings in effects.css.
const SCREW_KICK_MS = 900;
const SCREW_TOTAL_MS = 3600;
const SCREW_COIN_COUNT = 34;

const screwEgg = { type: null, taps: 0, timer: null, busy: false };

function tapUsedCard(type, event) {
  if (screwEgg.busy || event?.target.closest?.('button')) return;

  clearTimeout(screwEgg.timer);
  screwEgg.taps = screwEgg.type === type ? screwEgg.taps + 1 : 1;
  screwEgg.type = type;

  const card = document.querySelector(`[data-fx-card="${type}"]`);
  if (screwEgg.taps >= SCREW_TAPS) {
    screwEgg.taps = 0;
    screwTheRules(type, card);
    return;
  }

  restartClass(card, 'fx-used-deny', 400);
  restartClass(card?.querySelector('.used-watermark'), 'fx-used-nudge', 400);
  playSound({ name: 'used-deny', combo: screwEgg.taps });
  screwEgg.timer = setTimeout(() => { screwEgg.taps = 0; }, SCREW_COMBO_TIMEOUT_MS);
}

function renderScrewCoins() {
  return Array.from({ length: SCREW_COIN_COUNT }, () => {
    const vars = [
      `--cx: ${rand(0, 100).toFixed(1)}vw`,
      `--cs: ${rand(18, 34).toFixed(0)}px`,
      `--cdx: ${rand(-40, 40).toFixed(0)}px`,
      `--cd: ${rand(1.2, 2.1).toFixed(2)}s`,
      `--cdelay: ${rand(0.1, 1.2).toFixed(2)}s`,
      `--cflip: ${rand(0.25, 0.5).toFixed(2)}s`
    ].join('; ');
    return `<span class="screw-coin" style="${vars}"><span>$</span></span>`;
  }).join('');
}

function screwTheRules(type, card) {
  screwEgg.busy = true;
  playSound({ name: 'screw-the-rules' });
  restartClass(card, 'fx-used-deny', 400);

  spawnFx('fx-screw', SCREW_TOTAL_MS + 100, {
    html: `
      <div class="screw-coins">${renderScrewCoins()}</div>
      <div class="screw-stamp"><span>Screw the rules,<br>I have money!</span></div>
    `
  });

  setTimeout(() => {
    // Kick a copy of the USED stamp off the card, then give the use back
    // (the re-render drops the real watermark and plays the restore effect).
    const mark = document.querySelector(`[data-fx-card="${type}"] .used-watermark`);
    if (mark) {
      const r = mark.getBoundingClientRect();
      spawnFx('fx-used-kick', 1400, {
        vars: { '--kx': `${r.left + r.width / 2}px`, '--ky': `${r.top + r.height / 2}px` },
        html: '<span class="text-6xl font-black tracking-widest uppercase">USED</span>'
      });
    }
    changeUses(type, -1);
  }, SCREW_KICK_MS);
  setTimeout(() => { screwEgg.busy = false; }, SCREW_TOTAL_MS);
}
