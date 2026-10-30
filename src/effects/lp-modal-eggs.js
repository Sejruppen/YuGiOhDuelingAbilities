// LP modal easter eggs.
//
//   ❤️ -> Change of Heart. Hold the ❤️ next to "Life Points" for
//         LP_EGG_PRESS_MS (it glows and trembles): the heart spins out of the
//         modal and turns into the Spell card. Its art is a split heart, an
//         angel half and a devil half. The angel and the devil argue, the
//         heart tips back and forth, cracks down the middle... and snaps back
//         together. "Your heart stays loyal." Nothing changes, your LP included.
//         Sound: 'change-of-heart' (HEART_SOUNDS).
//   ⌫  -> Noah's DELETE. Tap ⌫ ND_TAPS times in a row on an empty input: a
//         Kaiba Corp virtual-world glitch. A terminal complains there's
//         nothing to delete, so it starts deleting the duelist instead; the
//         modal is erased top-down into flying pixels... stuck at 99%, then
//         ACCESS DENIED, "Administrator: S. KAIBA", and the modal snaps back.
//         Sound: 'noah-delete' (HEADER_EGG_SOUNDS).
//   ÷2 -> Kaiba's Rip. Hold ÷2 Halve for LP_EGG_PRESS_MS: Kaiba grabs a
//         Blue-Eyes White Dragon, pauses dramatically ("If I can't have it…")
//         and RIIIPs it in half (just like Grandpa's). The halves flutter
//         away and Grandpa shakes his fist. The click after the hold is
//         swallowed, so nothing is halved. Sound: 'kaiba-rip' (HEADER_EGG_SOUNDS).
//
// Timelines: COH_MS / ND_MS / KT_MS, "LP MODAL EGGS" in effects.css.
const LP_EGG_PRESS_MS = 2000;
const COH_MS = 5000;
const KT_MS = 5000;
const ND_MS = 6000;
const ND_TAPS = 8;
const ND_TAP_GAP_MS = 700;
// Keep in sync with the `nd-*` keyframes (1% = 60ms): the bar fills 20-58%.
const ND_FILL_FROM_MS = 1200;
const ND_FILL_TO_MS = 3480;
const ND_PIXELS = 36;

const lpEgg = { timer: null, busy: false, swallowClick: false, backTaps: 0, lastBackAt: 0 };

function startLpEggPress(el, kind) {
  lpEgg.swallowClick = false;
  if (lpEgg.busy) return;
  clearTimeout(lpEgg.timer);
  el.classList.add('cegg-charging');
  lpEgg.timer = setTimeout(() => {
    el.classList.remove('cegg-charging');
    if (kind === 'heart') playChangeOfHeartEgg(el);
    else if (kind === 'halve') playKaibaRipEgg();
  }, LP_EGG_PRESS_MS);
}

function cancelLpEggPress(el) {
  clearTimeout(lpEgg.timer);
  el.classList.remove('cegg-charging');
}

// Halve's onclick asks this first: false right after a hold.
function lpEggAllowsClick() {
  if (!lpEgg.swallowClick) return true;
  lpEgg.swallowClick = false;
  return false;
}

// The heart art: one heart, clipped into an angel half and a devil half that
// tip around the heart's bottom tip (viewBox 0 0 100 100, tip at 50 86).
const COH_HEART_PATH = 'M50 86 C22 66 6 50 6 31 C6 17 16 8 28 8 C38 8 46 14 50 23 C54 14 62 8 72 8 C84 8 94 17 94 31 C94 50 78 66 50 86 Z';
const COH_HEART_SVG = `
  <svg class="coh-heart" viewBox="0 0 100 100" aria-hidden="true">
    <defs>
      <clipPath id="coh-clip-l"><rect x="-10" y="-10" width="60" height="120" /></clipPath>
      <clipPath id="coh-clip-r"><rect x="50" y="-10" width="60" height="120" /></clipPath>
      <linearGradient id="coh-grad-angel" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#fff7ed" />
        <stop offset="1" stop-color="#fda4af" />
      </linearGradient>
      <linearGradient id="coh-grad-devil" x1="1" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#7f1d1d" />
        <stop offset="1" stop-color="#3b0764" />
      </linearGradient>
    </defs>
    <g class="coh-half coh-half--angel">
      <path class="coh-wing" d="M10 34 C-6 26 -12 40 -6 48 C-14 50 -10 60 -2 58 C-6 66 4 68 10 60 Z" />
      <ellipse class="coh-halo" cx="28" cy="2" rx="13" ry="3.5" />
      <path d="${COH_HEART_PATH}" fill="url(#coh-grad-angel)" clip-path="url(#coh-clip-l)" />
      <path class="coh-face" d="M22 38 Q27 34 32 38 M26 50 Q32 56 40 50" />
    </g>
    <g class="coh-half coh-half--devil">
      <path class="coh-horn" d="M62 12 L60 -4 L72 9 Z M86 15 L96 1 L94 20 Z" />
      <path class="coh-tail" d="M90 52 C104 58 104 72 96 76 L102 82 L92 82 L94 74 C100 70 98 62 88 58 Z" />
      <path d="${COH_HEART_PATH}" fill="url(#coh-grad-devil)" clip-path="url(#coh-clip-r)" />
      <path class="coh-face coh-face--devil" d="M64 34 L76 40 M60 50 Q68 58 78 48 M64 52 L66 55 M72 53 L73 56" />
    </g>
    <path class="coh-crack" pathLength="100" d="M50 22 L46 34 L54 44 L46 56 L53 68 L50 86" />
  </svg>
`;

const COH_FEATHERS = 6;
const COH_EMBERS = 7;
const COH_HEARTS = 10;

function playChangeOfHeartEgg(source) {
  markEggFound('change-of-heart');
  playSound({ name: 'change-of-heart' });

  const r = source.getBoundingClientRect();
  const overlay = spawnFx('fx-cegg fx-coh', COH_MS + 100, {
    vars: {
      '--cx': `${(r.left + r.width / 2).toFixed(0)}px`,
      '--cy': `${(r.top + r.height / 2).toFixed(0)}px`
    },
    html: `
      <div class="coh-dim"></div>
      <span class="coh-src ce-emoji">❤️</span>
      <div class="coh-flash"></div>
      <div class="coh-stage">
        <div class="coh-glow coh-glow--angel"></div>
        <div class="coh-glow coh-glow--devil"></div>
        <div class="coh-card">
          <div class="coh-card-head">
            <span class="coh-card-name">Change of Heart</span>
            <span class="coh-card-icon">✦</span>
          </div>
          <div class="coh-card-type">[Spell Card]</div>
          <div class="coh-card-art">
            ${ceRange(COH_FEATHERS, i => `<span class="coh-feather" style="--x: ${ceRand(4, 44).toFixed(0)}%; --d: ${(i * 260 + ceRand(0, 180)).toFixed(0)}ms; --r: ${ceRand(-40, 40).toFixed(0)}deg;"></span>`)}
            ${ceRange(COH_EMBERS, i => `<span class="coh-ember" style="--x: ${ceRand(56, 96).toFixed(0)}%; --d: ${(i * 220 + ceRand(0, 160)).toFixed(0)}ms;"></span>`)}
            ${COH_HEART_SVG}
          </div>
          <div class="coh-card-text">Take control of 1 monster your opponent controls until the End Phase.</div>
        </div>
        <div class="coh-who coh-who--angel"><span class="ce-emoji">😇</span><span class="ce-bubble">Be nice!</span></div>
        <div class="coh-who coh-who--devil"><span class="ce-emoji">😈</span><span class="ce-bubble">Hehehe… take control!</span></div>
        ${ceRange(COH_HEARTS, i => `<span class="coh-love ce-emoji" style="--x: ${ceRand(-120, 120).toFixed(0)}px; --d: ${(i * 50).toFixed(0)}ms; --s: ${ceRand(0.7, 1.3).toFixed(2)};">💖</span>`)}
      </div>
      <div class="cegg-toast">Change of Heart! …but yours stays loyal.<small>Your Life Points are still under your control. For now.</small></div>
    `
  });
  if (!overlay) return; // reduced motion: the sound has already played

  lpEgg.busy = true;
  setTimeout(() => { lpEgg.busy = false; }, COH_MS);
}

// lpKey calls this for every ⌫ (empty: the input was already empty).
function noteLpBackspace(empty) {
  const now = performance.now();
  if (!empty || lpEgg.busy) {
    lpEgg.backTaps = 0;
    return;
  }
  lpEgg.backTaps = now - lpEgg.lastBackAt <= ND_TAP_GAP_MS ? lpEgg.backTaps + 1 : 1;
  lpEgg.lastBackAt = now;
  if (lpEgg.backTaps < ND_TAPS) return;
  lpEgg.backTaps = 0;
  playNoahDeleteEgg();
}

function playNoahDeleteEgg() {
  markEggFound('noah-delete');
  playSound({ name: 'noah-delete' });

  const panel = document.querySelector('.modal-panel');
  const r = panel ? panel.getBoundingClientRect() : { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight };
  const name = hdrEsc(getSelectedCharacter()?.name || 'Duelist');
  const pixels = ceRange(ND_PIXELS, i => {
    const y = (i + ceRand(0, 1)) / ND_PIXELS;
    const delay = ND_FILL_FROM_MS + y * (ND_FILL_TO_MS - ND_FILL_FROM_MS);
    return `<span class="nd-px" style="--px: ${ceRand(0, 1).toFixed(2)}; --py: ${y.toFixed(2)}; --d: ${delay.toFixed(0)}ms; --dx: ${ceRand(-60, 60).toFixed(0)}px; --dy: ${ceRand(-160, -60).toFixed(0)}px; --s: ${ceRand(0.5, 1.4).toFixed(2)};"></span>`;
  });

  const overlay = spawnFx('fx-cegg fx-nd', ND_MS + 100, {
    vars: {
      '--cl': `${r.left.toFixed(0)}px`,
      '--ct': `${r.top.toFixed(0)}px`,
      '--cw': `${r.width.toFixed(0)}px`,
      '--ch': `${r.height.toFixed(0)}px`
    },
    html: `
      <div class="nd-tint"></div>
      <div class="nd-scan"></div>
      <div class="nd-glitch"></div>
      ${pixels}
      <div class="nd-term">
        <div class="nd-term-head"><span>KAIBA CORP // VIRTUAL SYSTEM</span><span>v1.0</span></div>
        <p class="nd-line nd-line--1">&gt; backspace() <b>ERROR: nothing to delete</b></p>
        <p class="nd-line nd-line--2">&gt; backspace() ×${ND_TAPS} <b>ERROR: STILL nothing</b></p>
        <p class="nd-line nd-line--3 nd-warn">⚠ Excessive deleting detected. Deleting something else…</p>
        <p class="nd-line nd-line--4">&gt; delete("${name}")</p>
        <div class="nd-bar"><span class="nd-fill"></span><b class="nd-pct">0%</b></div>
        <p class="nd-line nd-line--5">Administrator: <b>S. KAIBA</b> — request rejected.</p>
        <p class="nd-line nd-line--6">NOAH: …I'll delete you next time.</p>
        <div class="nd-denied">ACCESS DENIED</div>
      </div>
      <div class="cegg-toast">ACCESS DENIED. Kaiba has admin rights.<small>You were 99% deleted. The other 1% is doing fine.</small></div>
    `
  });
  if (!overlay) return; // reduced motion: the sound has already played

  lpEgg.busy = true;
  const root = document.documentElement;
  root.classList.add('nd-deleting');

  const pct = overlay.querySelector('.nd-pct');
  const span = ND_FILL_TO_MS - ND_FILL_FROM_MS;
  let frame = null;
  setTimeout(() => {
    const startedAt = performance.now();
    const step = now => {
      const p = Math.min(1, (now - startedAt) / span);
      pct.textContent = `${Math.floor(99 * (1 - Math.pow(1 - p, 1.6)))}%`;
      frame = p < 1 ? requestAnimationFrame(step) : null;
    };
    frame = requestAnimationFrame(step);
  }, ND_FILL_FROM_MS);

  setTimeout(() => {
    if (frame) cancelAnimationFrame(frame);
    root.classList.remove('nd-deleting');
    lpEgg.busy = false;
  }, ND_MS);
}

// --- ÷2 hold: Kaiba's Rip ------------------------------------------------------------

const KT_BITS = 14;

// One Blue-Eyes card face; the left and right halves each show a full copy,
// clipped along the same jagged tear (effects.css), so together they look whole.
const KT_CARD_FACE = `
  <div class="kt-face">
    <div class="kt-name">Blue-Eyes White Dragon</div>
    <div class="kt-stars">${'★'.repeat(8)}</div>
    <div class="kt-art"><span class="ce-emoji">🐉</span></div>
    <div class="kt-text">
      <b>[Dragon]</b>
      This legendary dragon is a powerful engine of destruction.
      <span class="kt-stats">ATK/3000 DEF/2500</span>
    </div>
  </div>
`;

// A furious, sobbing Grandpa Muto (the 👴 emoji smiles too much): bald, grey
// tufts, bandana, angry brows, tears, a big moustache and a shouting mouth.
const KT_GRANDPA_SVG = `
  <svg class="kt-gramps-face" viewBox="0 0 64 64" aria-hidden="true">
    <ellipse cx="32" cy="36" rx="20" ry="22" fill="#f5c9a0" />
    <path d="M12 26 Q32 6 52 26 L52 22 Q32 2 12 22 Z" fill="#334155" />
    <path d="M12 30 C6 28 4 38 10 42 C8 36 11 33 13 34 Z M52 30 C58 28 60 38 54 42 C56 36 53 33 51 34 Z" fill="#e5e7eb" />
    <path d="M18 29 L28 34 M46 29 L36 34" stroke="#e5e7eb" stroke-width="4" stroke-linecap="round" />
    <circle cx="25" cy="37" r="2.2" fill="#1f2937" />
    <circle cx="39" cy="37" r="2.2" fill="#1f2937" />
    <ellipse cx="18" cy="44" rx="4" ry="2.5" fill="#f87171" opacity="0.7" />
    <ellipse cx="46" cy="44" rx="4" ry="2.5" fill="#f87171" opacity="0.7" />
    <ellipse cx="32" cy="53" rx="5" ry="4.5" fill="#7f1d1d" />
    <path d="M18 48 Q25 42 32 46 Q39 42 46 48 Q39 47 32 50 Q25 47 18 48 Z" fill="#e5e7eb" />
    <path class="kt-tear-stream" d="M24 39 Q22 44 23 50 M40 39 Q42 44 41 50" stroke="#7dd3fc" stroke-width="2.4" stroke-linecap="round" fill="none" />
    <path class="kt-tear kt-tear--l" d="M23 39 Q20 44 23 46 Q26 44 23 39 Z" fill="#7dd3fc" />
    <path class="kt-tear kt-tear--r" d="M41 39 Q38 44 41 46 Q44 44 41 39 Z" fill="#7dd3fc" />
    <path class="kt-tear kt-tear--l2" d="M23 39 Q20 44 23 46 Q26 44 23 39 Z" fill="#7dd3fc" />
    <path class="kt-tear kt-tear--r2" d="M41 39 Q38 44 41 46 Q44 44 41 39 Z" fill="#7dd3fc" />
  </svg>
`;

function playKaibaRipEgg() {
  lpEgg.swallowClick = true;
  markEggFound('kaiba-rip');
  playSound({ name: 'kaiba-rip' });

  const overlay = spawnFx('fx-cegg fx-kt', KT_MS + 100, {
    html: `
      <div class="kt-dim"></div>
      <div class="kt-stage">
        <div class="kt-half kt-half--l">${KT_CARD_FACE}</div>
        <div class="kt-half kt-half--r">${KT_CARD_FACE}</div>
        <span class="kt-hand kt-hand--l ce-emoji">✋</span>
        <span class="kt-hand kt-hand--r ce-emoji">✋</span>
        <div class="kt-rip"></div>
        ${ceRange(KT_BITS, () => `<span class="kt-bit" style="--y: ${ceRand(5, 95).toFixed(0)}%; --dx: ${ceRand(-110, 110).toFixed(0)}px; --dy: ${ceRand(-90, 60).toFixed(0)}px; --r: ${ceRand(-300, 300).toFixed(0)}deg;"></span>`)}
        <div class="kt-sfx">RIIIP!</div>
      </div>
      <div class="kt-kaiba kt-kaiba--1 ce-bubble">Kaiba: "If I can't have it…"</div>
      <div class="kt-kaiba kt-kaiba--2 ce-bubble">"…NOBODY CAN!"</div>
      <div class="kt-grandpa"><span class="ce-bubble">KAIBA!! My Blue-Eyes!</span><span class="kt-gramps">${KT_GRANDPA_SVG}<span class="kt-fist ce-emoji">✊</span><span class="kt-vein ce-emoji">💢</span></span></div>
      <div class="cegg-toast">Halved, Kaiba-style.<small>Your Life Points are untouched. Grandpa's card was not.</small></div>
    `
  });
  if (!overlay) return; // reduced motion: the sound has already played

  lpEgg.busy = true;
  setTimeout(() => { lpEgg.busy = false; }, KT_MS);
}
