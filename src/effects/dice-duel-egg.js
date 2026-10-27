// Hold "Draw the Tournament" for 2s: a Penalty Game, straight out of the manga.
// The screen goes dark and a hulking brute looms out of the shadows (only his
// silhouette and glowing eyes). "We roll. The one who rolls lower... dies."
// He laughs, rolls a 6, and then it's your turn: tap to roll. It lands on a 1
// ("Pathetic..."), then the die cracks and splits in two, showing the Eye and
// six pips: 7! His eyes go wide, "PENALTY GAME!", and a vortex drags him off
// to the Shadow Realm. Sounds: 'tn-dice-intro' and 'tn-dice-roll'.
const DICE_DUEL_INTRO_MS = 6850; // keep in sync with the dd-* delays in effects.css
const DICE_DUEL_AUTO_ROLL_MS = 12000;
const DICE_DUEL_SAFETY_MS = 60000;
// Steps after the player rolls: [ms, overlay class].
const DICE_DUEL_STEPS = [
  [1000, 'is-landed'],
  [1300, 'is-pathetic'],
  [2900, 'is-crack'],
  [3700, 'is-split'],
  [5300, 'is-wha'],
  [6300, 'is-penalty'],
  [7200, 'is-banish'],
  [9300, 'is-banished'],
  [11800, 'is-out']
];
const DICE_DUEL_END_MS = 12600;

const DD_PIPS = {
  tl: [28, 28], tr: [72, 28], ml: [28, 50], c: [50, 50], mr: [72, 50], bl: [28, 72], br: [72, 72]
};
const DD_FACES = {
  2: ['tl', 'br'],
  3: ['tl', 'c', 'br'],
  4: ['tl', 'tr', 'bl', 'br'],
  5: ['tl', 'tr', 'c', 'bl', 'br'],
  6: ['tl', 'tr', 'ml', 'mr', 'bl', 'br']
};

// A white manga die. The "1" is the Millennium Eye, like Yugi's die.
function ddDieFace(n) {
  const body = '<rect x="3" y="3" width="94" height="94" rx="16" fill="#f8fafc" stroke="#0f172a" stroke-width="4"/>';
  if (n === 1) {
    return `<svg viewBox="0 0 100 100">${body}
      <g fill="none" stroke="#0f172a" stroke-width="5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 50 Q50 24 80 50 Q50 76 20 50 Z"/>
        <path d="M24 36 Q50 18 76 34"/>
        <path d="M44 66 L40 84"/>
        <path d="M58 64 Q68 80 80 72"/>
      </g>
      <circle cx="50" cy="50" r="10" fill="#0f172a"/></svg>`;
  }
  return `<svg viewBox="0 0 100 100">${body}${DD_FACES[n].map(p => `<circle cx="${DD_PIPS[p][0]}" cy="${DD_PIPS[p][1]}" r="8.5" fill="#0f172a"/>`).join('')}</svg>`;
}

const DD_BRUTE_SVG = `
  <svg viewBox="0 0 200 220" aria-hidden="true">
    <defs>
      <filter id="ddEyeGlow" x="-100%" y="-300%" width="300%" height="700%">
        <feGaussianBlur stdDeviation="2.4" result="b"/>
        <feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>
    <g fill="#030104" stroke="rgb(185 28 28 / 0.55)" stroke-width="1.5" stroke-linejoin="round">
      <path d="M0 220 L4 176 Q8 138 38 127 Q60 118 75 112 L78 97 Q69 90 69 72 Q70 46 100 44 Q130 46 131 72 Q131 90 122 97 L125 112 Q140 118 162 127 Q192 138 196 176 L200 220 Z"/>
      <path d="M66 60 Q67 30 100 28 Q133 30 134 60 Z"/>
      <path d="M60 60 Q100 52 154 63 Q126 69 60 64 Z"/>
      <path d="M40 160 Q60 150 72 172 M160 160 Q140 150 128 172" fill="none"/>
    </g>
    <g class="dd-eyes" filter="url(#ddEyeGlow)">
      <g class="dd-eyes-slit" fill="#f87171">
        <path d="M78 66 L96 71 L82 73 Z"/>
        <path d="M122 66 L104 71 L118 73 Z"/>
      </g>
      <g class="dd-eyes-wide">
        <circle cx="88" cy="71" r="6.5" fill="#fee2e2"/>
        <circle cx="112" cy="71" r="6.5" fill="#fee2e2"/>
        <circle cx="88" cy="71" r="1.6" fill="#7f1d1d"/>
        <circle cx="112" cy="71" r="1.6" fill="#7f1d1d"/>
      </g>
    </g>
    <path class="dd-grin" d="M84 84 Q100 94 116 84 Q100 89 84 84 Z" fill="#e5e7eb"/>
  </svg>`;

const DD_CRACK_SVG = `
  <svg class="dd-crack" viewBox="0 0 100 100" aria-hidden="true">
    <path d="M54 -2 L47 20 L57 38 L44 58 L55 78 L48 102" pathLength="100" fill="none" stroke="#0f172a" stroke-width="4" stroke-linejoin="round"/>
  </svg>`;

// Flicker random faces for `dur` ms, then settle on `final`.
function ddTumbleFace(el, delay, dur, final) {
  setTimeout(() => {
    if (!el.isConnected) return;
    const flicker = setInterval(() => { el.innerHTML = ddDieFace(2 + Math.floor(Math.random() * 5)); }, 85);
    setTimeout(() => { clearInterval(flicker); el.innerHTML = ddDieFace(final); }, dur);
  }, delay);
}

function playDiceDuelEgg() {
  markEggFound('penalty-dice');
  const overlay = spawnFx('fx-cegg fx-dd', DICE_DUEL_SAFETY_MS, {
    html: `
      <div class="dd-dark"></div>
      <div class="ce-at dd-vortex"><div class="dd-vortex-spin"></div></div>
      <div class="ce-at dd-brute"><div class="dd-brute-body">${DD_BRUTE_SVG}</div></div>
      <div class="ce-at dd-laugh">HAHAHAHA!</div>
      <div class="ce-at ce-bubble dd-say dd-say--intro">We roll.<span class="dd-say-late">The one who rolls lower… dies.</span></div>
      <div class="ce-at ce-bubble dd-say dd-say--six">A six! Beat that… if you can.</div>
      <div class="ce-at ce-bubble dd-say dd-say--pathetic">Pathetic…</div>
      <div class="ce-at ce-bubble dd-say dd-say--wha">WHA…?!</div>
      <div class="dd-table">
        <div class="ce-at dd-die dd-die--him"><div class="dd-die-spin"><div class="dd-die-face">${ddDieFace(6)}</div></div></div>
        <div class="ce-at dd-tag dd-tag--him">Him: 6</div>
        <div class="ce-at dd-die dd-die--you"><div class="dd-die-spin"><div class="dd-die-face">${ddDieFace(1)}</div>${DD_CRACK_SVG}</div></div>
        <div class="ce-at dd-piece dd-piece--a">${ddDieFace(1)}</div>
        <div class="ce-at dd-piece dd-piece--b">${ddDieFace(6)}</div>
        <div class="ce-at dd-tag dd-tag--you">You</div>
        <div class="ce-at dd-bang">!!</div>
        <div class="ce-at dd-cap">The… the die broke…<b class="dd-seven">1 + 6 = 7</b></div>
      </div>
      <div class="ce-at dd-meye">${SHADOW_EYE_SVG}</div>
      <div class="ce-at dd-penalty">Penalty Game!</div>
      <div class="dd-flash"></div>
      <div class="ce-at dd-banish shadow-text">Banished to the<br>Shadow Realm...</div>
      <div class="ce-at dd-prompt">🎲 Tap to roll your die!</div>
      <div class="cegg-toast">Seven beats six.<small>Never gamble against the King of Games.</small></div>`
  });
  if (!overlay) return;

  startEgg.busy = true;
  playSound({ name: 'tn-dice-intro' });
  ddTumbleFace(overlay.querySelector('.dd-die--him .dd-die-face'), 5000, 800, 6);

  let rolled = false;
  const roll = () => {
    if (rolled || !overlay.isConnected) return;
    rolled = true;
    overlay.classList.remove('is-waiting');
    rollDiceDuel(overlay);
  };
  setTimeout(() => {
    if (!overlay.isConnected) return;
    overlay.classList.add('is-waiting');
    overlay.addEventListener('pointerdown', roll);
    setTimeout(roll, DICE_DUEL_AUTO_ROLL_MS);
  }, DICE_DUEL_INTRO_MS);
}

function rollDiceDuel(overlay) {
  overlay.classList.add('is-rolling');
  playSound({ name: 'tn-dice-roll' });
  ddTumbleFace(overlay.querySelector('.dd-die--you .dd-die-face'), 0, 1000, 1);
  const tag = overlay.querySelector('.dd-tag--you');
  DICE_DUEL_STEPS.forEach(([at, cls]) => setTimeout(() => {
    overlay.classList.add(cls);
    if (cls === 'is-landed') tag.textContent = 'You: 1';
    if (cls === 'is-split') tag.textContent = 'You: 7';
  }, at));
  setTimeout(() => {
    overlay.remove();
    startEgg.busy = false;
    // The overlay blocks the page, so the hold's release may never have
    // reached the button to use up its swallowed click.
    startEgg.swallowClick = false;
  }, DICE_DUEL_END_MS);
}
