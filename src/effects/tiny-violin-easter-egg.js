// LP easter egg. Drop to exactly TINY_VIOLIN_LP and the world's smallest
// violin pops up to play you a sad little tune... until its string snaps
// with a *twang* and the violin flops over. The music is 'tiny-violin' in
// sounds.js. It doesn't block the screen, so play goes on.
const TINY_VIOLIN_LP = 1;
// Keep in sync with the `violin-*` timings in effects.css.
const TINY_VIOLIN_TOTAL_MS = 4800;
const TINY_VIOLIN_NOTES = ['♪', '♫', '♩', '♬', '♪', '♫'];

const violinEgg = { busy: false };

function isTinyViolin(from, to) {
  return !violinEgg.busy && to === TINY_VIOLIN_LP && from > TINY_VIOLIN_LP;
}

function triggerTinyViolin() {
  const notes = TINY_VIOLIN_NOTES.map((note, i) =>
    `<span class="violin-note" style="--i: ${i}; --nx: ${rand(-50, 50).toFixed(0)}px">${note}</span>`
  ).join('');

  const overlay = spawnFx('fx-tiny-violin', TINY_VIOLIN_TOTAL_MS + 100, {
    html: `
      <div class="violin-stage">
        <div class="violin-notes">${notes}</div>
        <div class="violin-fiddle"><span class="violin-emoji">🎻</span></div>
        <div class="violin-twang">*twang*</div>
        <div class="violin-caption">The world's smallest violin<br>plays for your ${TINY_VIOLIN_LP} LP</div>
      </div>
    `
  });
  if (!overlay) return;

  violinEgg.busy = true;
  setTimeout(() => { violinEgg.busy = false; }, TINY_VIOLIN_TOTAL_MS);
}
