// Hold the 👑 Pharaoh difficulty for 2s: the tomb rumbles and an Egyptian
// cartouche asks for "his true name". Type it on the carved stone keyboard
// (the device keyboard is never used). One try only: a wrong name crumbles to
// sand and the tomb closes; "ATEM" (or "ATEMU") floods the tomb with gold.
// Secret within the secret: spelling the creator's name (ATN_ARCHITECT) makes
// the Millennium Eye wink and unroll the architect's scroll; family names
// have their own scenes (name-eggs.js).
// Sounds: 'atn-*' in sounds.js.
const ATN_NAMES = ['ATEM', 'ATEMU'];
const ATN_ARCHITECT = 'MATHIAS';
const ATN_MAX_LETTERS = 9;
const ATN_WRONG_CLOSE_MS = 4200;
const ATN_NAMED_MS = 7000;
const ATN_SCROLL_DELAY_MS = 1900;
const ATN_ARCHITECT_MS = 16000;
const ATN_FADE_MS = 700;
const ATN_KEY_ROWS = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'];

const atnEgg = { overlay: null, name: '', locked: false, timer: null };

function atnKeyboardHtml() {
  const key = (k, label = k, cls = '') => `<button type="button" class="atn-key${cls}" data-key="${k}">${label}</button>`;
  const rows = ATN_KEY_ROWS.map(row => `<div class="atn-row">${[...row].map(k => key(k)).join('')}</div>`);
  rows.push(`<div class="atn-row">${key('BACK', '⌫', ' atn-key--wide')}${key('SPEAK', '☥ Speak', ' atn-key--speak')}</div>`);
  return rows.join('');
}

function playTrueNameEgg() {
  const overlay = spawnFx('fx-cegg fx-atn', 30 * 60 * 1000, {
    html: `
      <div class="atn-dark"></div>
      <div class="atn-rays"></div>
      <div class="atn-panel" role="dialog" aria-label="Speak his true name">
        <div class="atn-band"></div>
        <div class="atn-eye">${SHADOW_EYE_SVG}</div>
        <p class="atn-title">Speak his true name</p>
        <p class="atn-sub">The Pharaoh has forgotten. Do you remember?</p>
        <div class="atn-cartouche"><span class="atn-name"></span><span class="atn-caret"></span></div>
        <p class="atn-msg" aria-live="polite"></p>
        <div class="atn-keys">${atnKeyboardHtml()}</div>
        <div class="atn-band"></div>
      </div>
      <div class="atn-sparks">${ceRange(26, () => `<span style="left: ${ceRand(4, 96).toFixed(0)}%; --d: ${ceRand(0, 1600).toFixed(0)}ms; --s: ${ceRand(0.8, 1.8).toFixed(2)};">${cePick(['☥', '✦', '☥', '✧'])}</span>`)}</div>
      <div class="atn-scroll" aria-live="polite"></div>
      <div class="atn-guest"></div>
      <div class="cegg-toast">Atem.<small>The name that saved the world.</small></div>`
  });
  if (!overlay) return;

  Object.assign(atnEgg, { overlay, name: '', locked: false, timer: null });
  startEgg.busy = true;
  setCoopDifficulty('pharaoh');
  restartClass(document.getElementById('app'), 'fx-atn-quake', 1200);
  playSound({ name: 'atn-open' });
  overlay.addEventListener('click', event => {
    if (overlay.classList.contains('is-closable')) return closeTrueNameEgg();
    const key = event.target.closest('[data-key]')?.dataset.key;
    if (key) pressTrueNameKey(key);
  });
}

function pressTrueNameKey(key) {
  const { overlay } = atnEgg;
  if (atnEgg.locked) return;
  if (key === 'SPEAK') return speakTrueName();
  if (key === 'BACK') atnEgg.name = atnEgg.name.slice(0, -1);
  else if (atnEgg.name.length < ATN_MAX_LETTERS) atnEgg.name += key;
  else return restartClass(overlay.querySelector('.atn-cartouche'), 'atn-nudge', 300);
  playSound({ name: 'atn-key' });
  overlay.querySelector('.atn-name').textContent = atnEgg.name;
  overlay.querySelector('.atn-msg').innerHTML = '';
  if (atnEgg.name === ATN_ARCHITECT) revealArchitect();
  else if (NAME_EGGS[atnEgg.name]) revealNameEgg(atnEgg.name);
}

// The Eye recognises the one who built the tomb.
function revealArchitect() {
  const { overlay } = atnEgg;
  atnEgg.locked = true;
  markEggFound('architect');
  overlay.classList.add('is-architect');
  overlay.querySelector('.atn-title').textContent = 'The Eye knows you.';
  overlay.querySelector('.atn-msg').innerHTML = '<b>Ah… the architect of this tomb.</b>';
  playSound({ name: 'atn-architect' });

  const left = EGG_TOTAL - getFoundEggCount();
  overlay.querySelector('.atn-scroll').innerHTML = `
    <span class="atn-rod"></span>
    <div class="atn-scroll-wrap"><div class="atn-scroll-body">
      <p class="atn-scroll-title">📜 Scroll of the Architect</p>
      <p class="atn-scroll-lead">This tomb was carved by <b>Mathias</b><br><small>a.k.a. Sejruppen</small></p>
      <ul class="atn-scroll-list">
        <li><span>☥</span>Built with vanilla JS, no build step, and far too much Yu-Gi-Oh!</li>
        <li><span>♪</span>Every sound synthesised by hand, note by note.</li>
        <li><span>✦</span>Bugs: banished to the Shadow Realm. Mostly.</li>
        <li><span>◈</span>${left > 0
          ? `<b>${left}</b> secret${left === 1 ? '' : 's'} still hide${left === 1 ? 's' : ''} in this tomb…`
          : 'Every secret found. You truly are a duelist.'}</li>
      </ul>
      <p class="atn-scroll-sign">— M.</p>
      <p class="atn-scroll-hint">Tap to seal the scroll</p>
    </div></div>
    <span class="atn-rod"></span>`;
  atnEgg.timer = setTimeout(() => {
    overlay.classList.add('is-scroll', 'is-closable');
    atnEgg.timer = setTimeout(closeTrueNameEgg, ATN_ARCHITECT_MS);
  }, ATN_SCROLL_DELAY_MS);
}

function speakTrueName() {
  const { overlay } = atnEgg;
  const cartouche = overlay.querySelector('.atn-cartouche');
  if (!atnEgg.name) return restartClass(cartouche, 'atn-nudge', 300);

  atnEgg.locked = true;
  if (ATN_NAMES.includes(atnEgg.name)) {
    markEggFound('true-name');
    overlay.classList.add('is-named');
    overlay.querySelector('.atn-title').textContent = 'The Pharaoh remembers his name.';
    overlay.querySelector('.atn-msg').innerHTML = '';
    playSound({ name: 'atn-named' });
    atnEgg.timer = setTimeout(closeTrueNameEgg, ATN_NAMED_MS);
    return;
  }

  overlay.classList.add('is-wrong');
  overlay.querySelector('.atn-msg').innerHTML =
    '<b>What a shame…</b><span>That is not his name. The Pharaoh will wait for the one who truly remembers.</span>';
  restartClass(cartouche, 'atn-crumble', 1100);
  playSound({ name: 'atn-wrong' });
  atnEgg.timer = setTimeout(closeTrueNameEgg, ATN_WRONG_CLOSE_MS);
}

function closeTrueNameEgg() {
  const { overlay } = atnEgg;
  if (!overlay || overlay.classList.contains('is-out')) return;
  clearTimeout(atnEgg.timer);
  atnEgg.locked = true;
  overlay.classList.add('is-out');
  setTimeout(() => {
    overlay.remove();
    atnEgg.overlay = null;
    startEgg.busy = false;
    // The overlay covers the page, so the hold's release may never have
    // reached the button to use up its swallowed click.
    startEgg.swallowClick = false;
  }, ATN_FADE_MS);
}
