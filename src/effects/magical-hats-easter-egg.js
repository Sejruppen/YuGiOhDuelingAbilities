// Magical Hats mini-game (hold Yugi Muto (Duelist Kingdom) on the character
// screen for 2s; see character-eggs-heroes.js). Four hats are lifted to show
// Dark Magician under one, they drop, shuffle (more swaps, faster, each level)
// and you tap the hat you think he's under. A win raises the level and the
// streak; a miss resets both. The best streak is saved on the device.
// Styles: effects.css ("MAGICAL HATS"); sounds: 'hats-*' in sounds.js.
const HATS_COUNT = 4;
const HATS_BEST_KEY = 'ygo_hats_best';

const HAT_SVG = `
  <svg viewBox="0 0 100 120" aria-hidden="true">
    <path d="M50 4 Q57 42 90 102 L10 102 Q43 42 50 4 Z" fill="#6d28d9" stroke="#fbbf24" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M50 8 Q46 50 22 100 L36 100 Q48 52 50 8 Z" fill="#8b5cf6" opacity="0.55"/>
    <path d="M22 86 Q50 95 78 86" fill="none" stroke="#fbbf24" stroke-width="6" stroke-linecap="round"/>
    <text x="50" y="74" text-anchor="middle" font-family="Georgia, serif" font-size="30" font-weight="900" fill="#fde68a">?</text>
    <text x="38" y="44" text-anchor="middle" font-size="11" fill="#fde68a">✦</text>
    <text x="62" y="54" text-anchor="middle" font-size="8" fill="#fde68a">✦</text>
    <ellipse cx="50" cy="105" rx="47" ry="11" fill="#4c1d95" stroke="#fbbf24" stroke-width="2.5"/>
  </svg>`;

const HATS_WIN_LINES = [
  'Found him! Dark Magician tips his hat. 🎩',
  'The Heart of the Cards guides you!',
  'Your move, Kaiba.',
  'Magical Hats: 0 · You: 1'
];
const HATS_LOSE_LINES = [
  'Wrong hat! He was over there the whole time.',
  'Kaiba would\'ve just used Mystical Space Typhoon.',
  'Only hot air under that one. 💨',
  'Even the Pharaoh needs a second try.'
];

const hats = { el: null, level: 1, streak: 0, best: 0, slotOf: [], prizeHat: 0, phase: 'idle', timers: [], onKey: null };

function openMagicalHats() {
  if (hats.el) return;
  hats.best = Number(localStorage.getItem(HATS_BEST_KEY)) || 0;
  hats.level = 1;
  hats.streak = 0;

  const el = document.createElement('div');
  el.className = 'hats-game';
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-modal', 'true');
  el.setAttribute('aria-label', 'Magical Hats');
  el.innerHTML = `
    <div class="hats-panel">
      <button type="button" class="hats-close" aria-label="Close">✕</button>
      <h2 class="hats-title">Magical Hats</h2>
      <p class="hats-status" aria-live="polite"></p>
      <div class="hats-stage">
        ${Array.from({ length: HATS_COUNT }, (_, i) => `
          <button type="button" class="hats-hat" data-hat="${i}" aria-label="Hat ${i + 1}" style="--slot: ${i};">
            <span class="hats-prize"></span>
            <span class="hats-top">${HAT_SVG}</span>
          </button>`).join('')}
      </div>
      <div class="hats-score"></div>
      <div class="hats-actions is-hidden">
        <button type="button" class="hats-btn hats-again">Next round</button>
        <button type="button" class="hats-btn hats-btn--ghost hats-quit">Close</button>
      </div>
    </div>`;
  el.addEventListener('click', onHatsClick);
  getFxLayer().appendChild(el);
  hats.el = el;

  hats.onKey = e => { if (e.key === 'Escape') closeMagicalHats(); };
  document.addEventListener('keydown', hats.onKey);
  charEgg.busy = true;

  updateHatsScore();
  playSound({ name: 'hats-open' });
  requestAnimationFrame(() => el.classList.add('is-open'));
  hatsLater(450, startHatsRound);
}

function closeMagicalHats() {
  const el = hats.el;
  if (!el) return;
  clearHatsTimers();
  document.removeEventListener('keydown', hats.onKey);
  hats.el = null;
  hats.phase = 'idle';
  el.classList.remove('is-open');
  setTimeout(() => el.remove(), 260);
  charEgg.busy = false;
  // The hold that opened the game never produced a click on the card.
  charEgg.swallowClick = false;
}

function onHatsClick(e) {
  if (e.target.closest('.hats-close, .hats-quit')) return closeMagicalHats();
  if (e.target.closest('.hats-again')) return startHatsRound();
  const hat = e.target.closest('[data-hat]');
  if (hat) pickHat(Number(hat.dataset.hat));
}

function hatsLater(ms, fn) {
  hats.timers.push(setTimeout(fn, ms));
}

function clearHatsTimers() {
  hats.timers.forEach(clearTimeout);
  hats.timers = [];
}

const hatEls = () => [...hats.el.querySelectorAll('.hats-hat')];

function setHatsStatus(text) {
  hats.el.querySelector('.hats-status').textContent = text;
}

function updateHatsScore() {
  hats.el.querySelector('.hats-score').innerHTML =
    `Level <b>${hats.level}</b> · Streak <b>${hats.streak}</b> · Best <b>${hats.best}</b>`;
}

function showHatsActions(label) {
  const actions = hats.el.querySelector('.hats-actions');
  actions.querySelector('.hats-again').textContent = label;
  actions.classList.remove('is-hidden');
}

function startHatsRound() {
  clearHatsTimers();
  const stage = hats.el.querySelector('.hats-stage');
  hats.el.querySelector('.hats-actions').classList.add('is-hidden');
  hats.el.querySelector('.hats-panel').classList.remove('is-win');
  stage.classList.remove('is-guessing');

  hats.phase = 'show';
  hats.slotOf = Array.from({ length: HATS_COUNT }, (_, i) => i);
  hats.prizeHat = Math.floor(Math.random() * HATS_COUNT);
  hatEls().forEach((hat, i) => {
    hat.classList.remove('is-right', 'is-wrong', 'is-arc-up', 'is-arc-down');
    hat.style.setProperty('--slot', i);
    hat.querySelector('.hats-prize').innerHTML = i === hats.prizeHat ? '<span class="ce-emoji hats-dm">🧙‍♂️</span>' : '';
    hat.classList.add('is-lifted');
  });
  setHatsStatus('Keep your eye on Dark Magician!');
  playSound({ name: 'hats-show' });

  hatsLater(1400, () => {
    hatEls().forEach(hat => hat.classList.remove('is-lifted'));
    playSound({ name: 'hats-cover' });
  });
  hatsLater(2000, shuffleHats);
}

function shuffleHats() {
  hats.phase = 'shuffle';
  const swaps = Math.min(4 + hats.level * 2, 18);
  const ms = Math.max(190, 520 - (hats.level - 1) * 45);
  hats.el.querySelector('.hats-stage').style.setProperty('--swap-ms', `${ms}ms`);
  setHatsStatus('Shuffling…');

  let done = 0;
  const step = () => {
    if (done++ >= swaps) {
      hatsLater(ms * 0.5, startHatsGuess);
      return;
    }
    const a = Math.floor(Math.random() * HATS_COUNT);
    const b = (a + 1 + Math.floor(Math.random() * (HATS_COUNT - 1))) % HATS_COUNT;
    const hatA = hats.slotOf.indexOf(a);
    const hatB = hats.slotOf.indexOf(b);
    hats.slotOf[hatA] = b;
    hats.slotOf[hatB] = a;

    const els = hatEls();
    [[els[hatA], b, 'is-arc-up'], [els[hatB], a, 'is-arc-down']].forEach(([hat, slot, arc]) => {
      hat.classList.remove('is-arc-up', 'is-arc-down');
      void hat.offsetWidth; // restart the arc animation
      hat.classList.add(arc);
      hat.style.setProperty('--slot', slot);
    });
    playSound({ name: 'hats-swap' });
    hatsLater(ms + 30, step);
  };
  step();
}

function startHatsGuess() {
  hats.phase = 'guess';
  hatEls().forEach(hat => hat.classList.remove('is-arc-up', 'is-arc-down'));
  hats.el.querySelector('.hats-stage').classList.add('is-guessing');
  setHatsStatus('Which hat is he under?');
  playSound({ name: 'hats-guess' });
}

function pickHat(index) {
  if (hats.phase !== 'guess') return;
  hats.phase = 'reveal';
  hats.el.querySelector('.hats-stage').classList.remove('is-guessing');

  const els = hatEls();
  const picked = els[index];
  const won = index === hats.prizeHat;
  const pick = list => list[Math.floor(Math.random() * list.length)];

  if (won) {
    hats.streak++;
    hats.level++;
    if (hats.streak > hats.best) {
      hats.best = hats.streak;
      localStorage.setItem(HATS_BEST_KEY, String(hats.best));
    }
    picked.classList.add('is-lifted', 'is-right');
    hats.el.querySelector('.hats-panel').classList.add('is-win');
    setHatsStatus(pick(HATS_WIN_LINES));
    playSound({ name: 'hats-win' });
    hatsLater(700, () => showHatsActions('Next round →'));
  } else {
    hats.streak = 0;
    hats.level = 1;
    picked.querySelector('.hats-prize').innerHTML = '<span class="ce-emoji">💨</span>';
    picked.classList.add('is-lifted', 'is-wrong');
    setHatsStatus(pick(HATS_LOSE_LINES));
    playSound({ name: 'hats-lose' });
    hatsLater(750, () => els[hats.prizeHat].classList.add('is-lifted', 'is-right'));
    hatsLater(1300, () => showHatsActions('Try again'));
  }
  updateHatsScore();
}
