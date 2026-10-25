// Start-screen easter egg. Switch themes DIZZY_SWITCHES times in quick
// succession and the app gets dizzy: the whole screen wobbles like it's had
// one too many, cartoon stars circle over the logo, and a toast begs
// "Please make up your mind 😵". The sound is 'dizzy' in sounds.js.
const DIZZY_SWITCHES = 6;
const DIZZY_COMBO_TIMEOUT_MS = 1500;
// Keep in sync with the `dizzy-*` timings in effects.css.
const DIZZY_TOTAL_MS = 3200;
const DIZZY_STAR_COUNT = 5;

const dizzyEgg = { switches: 0, timer: null, busy: false };

// Called by setAppTheme() every time the theme actually changes.
function countThemeSwitch() {
  if (dizzyEgg.busy) return;

  clearTimeout(dizzyEgg.timer);
  dizzyEgg.switches++;
  if (dizzyEgg.switches >= DIZZY_SWITCHES) {
    dizzyEgg.switches = 0;
    triggerDizzy();
    return;
  }
  dizzyEgg.timer = setTimeout(() => { dizzyEgg.switches = 0; }, DIZZY_COMBO_TIMEOUT_MS);
}

function triggerDizzy() {
  markEggFound('dizzy');
  if (prefersReducedMotion()) return;
  dizzyEgg.busy = true;
  playSound({ name: 'dizzy' });

  const app = document.getElementById('app');
  restartClass(app, 'fx-dizzy', DIZZY_TOTAL_MS);

  // The stars live inside the logo so they wobble along with it.
  const logo = document.querySelector('.logo-egg');
  if (logo) {
    const stars = document.createElement('span');
    stars.className = 'dizzy-stars';
    stars.setAttribute('aria-hidden', 'true');
    stars.innerHTML = Array.from({ length: DIZZY_STAR_COUNT }, (_, i) =>
      `<span class="dizzy-star" style="--i: ${i}">★</span>`
    ).join('');
    logo.appendChild(stars);
    setTimeout(() => stars.remove(), DIZZY_TOTAL_MS);
  }

  spawnFx('fx-dizzy-toast', DIZZY_TOTAL_MS + 100, {
    html: '<span>Please make up your mind 😵</span>'
  });
  setTimeout(() => { dizzyEgg.busy = false; }, DIZZY_TOTAL_MS);
}
