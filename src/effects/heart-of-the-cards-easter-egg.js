// Duel-screen easter egg. Long-press the character name in the header and
// you believe in the heart of the cards: the screen dims, golden rays spin
// up, Yugi's quote pops in word by word, a glowing card rises, trembles to a
// drumroll... and flips over to reveal the "perfect draw" — a random, mostly
// useless card. The sound is 'heart-of-the-cards' in sounds.js.
//
// Overload: the HEART_OVERLOAD_AT-th time in one duel, the heart of the cards
// gives up being subtle. The draw is always "Exodia Obliterate!!! (Just
// Kidding)", and the card fires a tiny, toy-sized Exodia blast ('heart-overload').
const HEART_PRESS_MS = 900;
// Keep in sync with the `heart-*` timings in effects.css.
const HEART_TOTAL_MS = 6000;
const HEART_OVERLOAD_AT = 5;
const HEART_QUOTE = ['Believe', 'in', 'the', 'heart', 'of', 'the', 'cards!'];

const HEART_OVERLOAD_DRAW = {
  name: 'Exodia Obliterate!!! (Just Kidding)',
  art: '👹',
  text: 'Deals 1 damage. Exodia is on his lunch break.'
};

const HEART_DRAWS = [
  { name: 'Pot of Greed', art: '🏺', text: 'Draw 2 cards. That\'s it. That\'s the whole card.' },
  { name: 'Kuriboh', art: '🐹', text: 'ATK 300. Believes in you. Not much else.' },
  { name: 'Left Leg of the Forbidden One', art: '🦵', text: 'Only 4 more pieces to go!' },
  { name: 'Time Wizard', art: '⏱️', text: 'Flip a coin. Pray. TIME MAGIC!' },
  { name: 'Blue-Eyes White Dragon', art: '🐉', text: 'Sorry, Kaiba already owns all three.' },
  { name: 'Celtic Guardian', art: '🗡️', text: 'The heart of the cards is buffering...' },
  { name: 'Swords of Revealing Light', art: '⚔️', text: 'Hold on for 3 turns. Wait... that\'s actually good?' }
];

const heartEgg = { timer: null, busy: false, lastDraw: -1, count: 0 };

// Called when a new duel starts, so the overload counts per duel.
function resetHeartOverload() {
  heartEgg.count = 0;
}

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
  const overload = heartEgg.count + 1 === HEART_OVERLOAD_AT;
  const draw = overload ? HEART_OVERLOAD_DRAW : pickHeartDraw();
  const words = HEART_QUOTE.map((word, i) => `<span class="heart-word" style="--i: ${i}">${word}</span>`).join(' ');
  const miniBlast = overload
    ? `
      <div class="heart-mini-blast">
        <div class="mini-charge"></div>
        <div class="mini-beam"></div>
        <div class="mini-whiteout"></div>
        <div class="mini-pew">pew.</div>
      </div>
    `
    : '';

  const overlay = spawnFx(overload ? 'fx-heart heart-overload' : 'fx-heart', HEART_TOTAL_MS + 100, {
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
      ${miniBlast}
    `
  });
  if (!overlay) return;

  heartEgg.busy = true;
  heartEgg.count++;
  markEggFound('heart-of-the-cards');
  playSound({ name: overload ? 'heart-overload' : 'heart-of-the-cards' });
  setTimeout(() => { heartEgg.busy = false; }, HEART_TOTAL_MS);
}
