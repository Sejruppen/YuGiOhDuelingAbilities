// Duel-screen easter egg. Leave the duel screen untouched for NAP_IDLE_MS and
// the Pharaoh dozes off: the screen slowly dims, a sleeping Kuriboh drifts
// by with "Zzz..." and a snot bubble, and a soft snore loops ('nap-snore' in
// sounds.js) until anyone taps or presses a key. Then Kuriboh jolts awake
// with a shocked face and a "!" before the duel fades back in. The waking tap
// is swallowed so it doesn't press whatever is underneath ('nap-wake').
const NAP_IDLE_MS = 2 * 60 * 1000;
const NAP_CHECK_MS = 1000;
// Keep in sync with the `nap-*` timings in effects.css.
const NAP_DIM_MS = 6000;
const NAP_SNORE_EVERY_MS = 4000;
const NAP_WAKE_MS = 1800;
const NAP_SWALLOW_TAP_MS = 500;

const napEgg = { lastActivity: performance.now(), overlay: null, snoreTimer: null };

const NAP_KURIBOH_SVG = `
  <svg class="nap-kuriboh-svg" viewBox="0 0 120 112" aria-hidden="true">
    <ellipse cx="16" cy="64" rx="10" ry="6" fill="#4d7c0f" transform="rotate(-25 16 64)"/>
    <ellipse cx="104" cy="64" rx="10" ry="6" fill="#4d7c0f" transform="rotate(25 104 64)"/>
    <ellipse cx="44" cy="100" rx="11" ry="7" fill="#4d7c0f"/>
    <ellipse cx="76" cy="100" rx="11" ry="7" fill="#4d7c0f"/>
    <circle cx="60" cy="54" r="42" fill="#7c4a1e" stroke="#5b3413" stroke-width="9" stroke-dasharray="2 5" stroke-linecap="round"/>
    <circle cx="60" cy="54" r="36" fill="#8b5a2b"/>
    <g class="nap-face-asleep">
      <path d="M34 50 q9 8 18 0" fill="none" stroke="#1c0f05" stroke-width="3.5" stroke-linecap="round"/>
      <path d="M68 50 q9 8 18 0" fill="none" stroke="#1c0f05" stroke-width="3.5" stroke-linecap="round"/>
      <ellipse cx="60" cy="72" rx="4" ry="3" fill="#3b1d08"/>
      <circle class="nap-bubble" cx="72" cy="66" r="9" fill="rgb(186 230 253 / 0.45)" stroke="rgb(224 242 254 / 0.9)" stroke-width="1.5"/>
    </g>
    <g class="nap-face-awake">
      <path d="M31 34 l14 5 M89 34 l-14 5" stroke="#1c0f05" stroke-width="3" stroke-linecap="round"/>
      <circle cx="43" cy="50" r="11" fill="#fff" stroke="#1c0f05" stroke-width="2"/>
      <circle cx="77" cy="50" r="11" fill="#fff" stroke="#1c0f05" stroke-width="2"/>
      <circle cx="43" cy="50" r="2.5" fill="#1c0f05"/>
      <circle cx="77" cy="50" r="2.5" fill="#1c0f05"/>
      <ellipse cx="60" cy="76" rx="6" ry="8" fill="#3b1d08"/>
      <path d="M94 30 q5 8 0 11 q-5 -3 0 -11 z" fill="#bae6fd" stroke="#e0f2fe" stroke-width="1"/>
    </g>
  </svg>
`;

function noteNapActivity() {
  napEgg.lastActivity = performance.now();
  if (napEgg.overlay) wakePharaoh();
}

['pointerdown', 'keydown', 'wheel'].forEach(name => {
  document.addEventListener(name, noteNapActivity, { capture: true, passive: true });
});
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) napEgg.lastActivity = performance.now();
});

setInterval(() => {
  if (napEgg.overlay || document.hidden || state.screen !== SCREENS.DUEL || prefersReducedMotion()) return;
  if (performance.now() - napEgg.lastActivity >= NAP_IDLE_MS) startPharaohNap();
}, NAP_CHECK_MS);

function startPharaohNap() {
  markEggFound('pharaoh-nap');
  const overlay = document.createElement('div');
  overlay.className = 'fx-nap';
  overlay.innerHTML = `
    <div class="nap-dim"></div>
    <div class="nap-kuriboh">
      <div class="nap-kuriboh-bob">
        <div class="nap-zzz"><span>Z</span><span>z</span><span>z</span></div>
        <div class="nap-shock">!</div>
        ${NAP_KURIBOH_SVG}
      </div>
    </div>
  `;
  getFxLayer().appendChild(overlay);
  napEgg.overlay = overlay;

  // The snoring starts once the screen is dark and Kuriboh drifts in.
  napEgg.snoreTimer = setTimeout(() => {
    playSound({ name: 'nap-snore' });
    napEgg.snoreTimer = setInterval(() => {
      if (!document.hidden) playSound({ name: 'nap-snore' });
    }, NAP_SNORE_EVERY_MS);
  }, NAP_DIM_MS);
}

function wakePharaoh() {
  const overlay = napEgg.overlay;
  napEgg.overlay = null;
  clearTimeout(napEgg.snoreTimer);
  clearInterval(napEgg.snoreTimer);
  playSound({ name: 'nap-wake' });

  freezeKuriboh(overlay.querySelector('.nap-kuriboh'));
  overlay.classList.add('nap-waking');
  // Swallow the rest of the waking tap, then let the duel be used again
  // while Kuriboh finishes being shocked.
  setTimeout(() => { overlay.style.pointerEvents = 'none'; }, NAP_SWALLOW_TAP_MS);
  setTimeout(() => overlay.remove(), NAP_WAKE_MS);
}

// Stop Kuriboh mid-drift so he's shocked right where he is — or pull him
// back into view if he happened to be off-screen between laps.
function freezeKuriboh(kuriboh) {
  const rect = kuriboh.getBoundingClientRect();
  const onScreen = rect.right > 40 && rect.left < window.innerWidth - 40;
  const x = onScreen ? rect.left : (window.innerWidth - rect.width) / 2;
  kuriboh.style.animation = 'none';
  kuriboh.style.transform = `translateX(${x.toFixed(0)}px)`;
}
