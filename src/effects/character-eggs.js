// Character-select easter eggs (shared engine). Hold a character's card for
// CHAR_EGG_PRESS_MS (it glows and trembles) and a 5-second scene plays over
// it, ending in a punchline toast. The click that follows the hold is
// swallowed so the character isn't selected.
//
// Each character registers a recipe (see character-eggs-heroes.js and
// character-eggs-villains.js):
//   scene(ctx)    -> HTML for the fx overlay (positioned with the card's
//                    --cx/--cy centre and --cl/--ct/--cw/--ch rect vars)
//   cardHtml(ctx) -> optional HTML injected into the card itself, for things
//                    that must move with it (eyes, holes, make-up...)
//   onStart(ctx)  -> optional; may return a cleanup function
//   toast, toastSmall -> optional punchline
//   run(ctx)      -> instead of all the above: an interactive egg that opens
//                    its own overlay (Yugi DK's Magical Hats mini-game)
// Every scene is one CSS timeline of CHAR_EGG_MS (effects.css, "CHARACTER
// EGGS"); the card gets .cegg-card--<id> for its own part. The sound is
// 'cegg-<id>' in sounds.js (CHAR_EGG_SOUNDS).
//
// Theotaur (Dark Paladin) and Trizze (Divine Offering) have their own files.
const CHAR_EGG_PRESS_MS = 2000;
const CHAR_EGG_MS = 5000;

const CHARACTER_EGGS = {};
const charEgg = { timer: null, busy: false, swallowClick: false };

function registerCharacterEgg(id, recipe) {
  CHARACTER_EGGS[id] = recipe;
}

function hasCharacterEgg(id) {
  return Boolean(CHARACTER_EGGS[id]);
}

function startCharEggPress(el, id) {
  charEgg.swallowClick = false;
  if (charEgg.busy) return;
  clearTimeout(charEgg.timer);
  el.classList.add('cegg-charging');
  charEgg.timer = setTimeout(() => {
    el.classList.remove('cegg-charging');
    runCharacterEgg(el, id);
  }, CHAR_EGG_PRESS_MS);
}

function cancelCharEggPress(el) {
  clearTimeout(charEgg.timer);
  el.classList.remove('cegg-charging');
}

// The card's onclick asks this first: false right after a hold.
function charEggAllowsClick() {
  if (!charEgg.swallowClick) return true;
  charEgg.swallowClick = false;
  return false;
}

// Small helpers for the scene files.
const ceRange = (n, fn) => Array.from({ length: n }, (_, i) => fn(i)).join('');
const ceRand = (min, max) => min + Math.random() * (max - min);
const cePick = list => list[Math.floor(Math.random() * list.length)];

function runCharacterEgg(card, id) {
  const recipe = CHARACTER_EGGS[id];
  if (!recipe) return;
  markEggFound(`char-${id}`);
  // Interactive eggs (Magical Hats) open their own screen instead of a scene;
  // they reset charEgg.busy / swallowClick when they close.
  if (recipe.run) {
    charEgg.swallowClick = true;
    recipe.run({ id, card });
    return;
  }
  const r = card.getBoundingClientRect();
  const ctx = {
    id,
    card,
    cx: r.left + r.width / 2,
    cy: r.top + r.height / 2,
    left: r.left,
    top: r.top,
    width: r.width,
    height: r.height,
    vw: window.innerWidth,
    vh: window.innerHeight
  };

  const toast = recipe.toast
    ? `<div class="cegg-toast">${recipe.toast}${recipe.toastSmall ? `<small>${recipe.toastSmall}</small>` : ''}</div>`
    : '';
  const overlay = spawnFx(`fx-cegg fx-cegg--${id}`, CHAR_EGG_MS + 100, {
    vars: {
      '--cx': `${ctx.cx.toFixed(0)}px`,
      '--cy': `${ctx.cy.toFixed(0)}px`,
      '--cl': `${r.left.toFixed(0)}px`,
      '--ct': `${r.top.toFixed(0)}px`,
      '--cw': `${r.width.toFixed(0)}px`,
      '--ch': `${r.height.toFixed(0)}px`
    },
    html: recipe.scene(ctx) + toast
  });
  if (!overlay) return;

  charEgg.busy = true;
  charEgg.swallowClick = true;
  playSound({ name: `cegg-${id}` });

  const cardClass = `cegg-card--${id}`;
  card.classList.add('cegg-active', cardClass);
  let injected = null;
  if (recipe.cardHtml) {
    injected = document.createElement('span');
    injected.className = 'cegg-inject';
    injected.setAttribute('aria-hidden', 'true');
    injected.innerHTML = recipe.cardHtml(ctx);
    card.appendChild(injected);
  }
  const cleanup = recipe.onStart ? recipe.onStart(ctx, overlay) : null;

  setTimeout(() => {
    card.classList.remove('cegg-active', cardClass);
    injected?.remove();
    if (typeof cleanup === 'function') cleanup();
    charEgg.busy = false;
  }, CHAR_EGG_MS);
}
