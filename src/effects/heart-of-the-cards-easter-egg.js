// Duel-screen easter egg. Long-press the character name in the header and
// you believe in the heart of the cards: the screen dims, golden rays spin
// up, Yugi's quote pops in word by word, a glowing card rises, trembles to a
// drumroll... and flips over to reveal the "perfect draw" — a random, mostly
// useless card. The sound is 'heart-of-the-cards' in sounds.js.
const HEART_PRESS_MS = 900;
// Keep in sync with the `heart-*` timings in effects.css.
const HEART_TOTAL_MS = 6000;
const HEART_QUOTE = ['Believe', 'in', 'the', 'heart', 'of', 'the', 'cards!'];

const HEART_DRAWS = [
  { name: 'Pot of Greed', art: '🏺', text: 'Draw 2 cards. That\'s it. That\'s the whole card.' },
  { name: 'Kuriboh', art: '🐹', text: 'ATK 300. Believes in you. Not much else.' },
  { name: 'Left Leg of the Forbidden One', art: '🦵', text: 'Only 4 more pieces to go!' },
  { name: 'Time Wizard', art: '⏱️', text: 'Flip a coin. Pray. TIME MAGIC!' },
  { name: 'Blue-Eyes White Dragon', art: '🐉', text: 'Sorry, Kaiba already owns all three.' },
  { name: 'Celtic Guardian', art: '🗡️', text: 'The heart of the cards is buffering...' },
  { name: 'Swords of Revealing Light', art: '⚔️', text: 'Hold on for 3 turns. Wait... that\'s actually good?' }
];

const heartEgg = { timer: null, busy: false, lastDraw: -1 };

function startHeartPress(el) {
  if (heartEgg.busy) return;
  clearTimeout(heartEgg.timer);
  el.classList.add('heart-charging');
  heartEgg.timer = setTimeout(() => {
    el.classList.remove('heart-charging');
    triggerHeartOfTheCards();
  }, HEART_PRESS_MS);
}

function cancelHeartPress(el) {
  clearTimeout(heartEgg.timer);
  el.classList.remove('heart-charging');
}

function pickHeartDraw() {
  let index = Math.floor(Math.random() * HEART_DRAWS.length);
  if (index === heartEgg.lastDraw) index = (index + 1) % HEART_DRAWS.length;
  heartEgg.lastDraw = index;
  return HEART_DRAWS[index];
}

function triggerHeartOfTheCards() {
  const draw = pickHeartDraw();
  const words = HEART_QUOTE.map((word, i) => `<span class="heart-word" style="--i: ${i}">${word}</span>`).join(' ');

  const overlay = spawnFx('fx-heart', HEART_TOTAL_MS + 100, {
    html: `
      <div class="heart-dim"></div>
      <div class="heart-rays"></div>
      <div class="heart-quote">${words}</div>
      <div class="heart-card-wrap">
        <div class="heart-card">
          <div class="heart-card-back"><span></span></div>
          <div class="heart-card-front">
            <div class="heart-card-name">${draw.name}</div>
            <div class="heart-card-art">${draw.art}</div>
            <div class="heart-card-text">${draw.text}</div>
          </div>
        </div>
      </div>
      <div class="heart-flash"></div>
    `
  });
  if (!overlay) return;

  heartEgg.busy = true;
  playSound({ name: 'heart-of-the-cards' });
  setTimeout(() => { heartEgg.busy = false; }, HEART_TOTAL_MS);
}
