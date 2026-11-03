// Solo unlock scenes (rewards, not easter eggs). They play over the victory screen:
//   nightmare:  after the first Hard win, Shadi rises from the sand, his Millennium
//               Key glows and a stone door grinds open on the Nightmare road.
//   millennium: after the first Nightmare win, the Eye of Wdjat opens and grants
//               the Millennium theme.
// Every line is shown twice (upright for Player 1, rotated for Player 2). Tap to skip.
// Under reduced motion only the sound plays; the end screen still shows the unlock.
// CSS: "SOLO UNLOCK SCENES" in effects.css (su-*); sounds 'su-shadi' / 'su-millennium'.
const SU_FADE_MS = 600;
const SU_SKIP_AFTER_MS = 600;

const SHADI_SVG = `
  <svg class="su-shadi-svg" viewBox="0 0 120 200" aria-hidden="true">
    <path d="M18 200 C22 142 38 112 60 106 C82 112 98 142 102 200 Z" fill="#f5f0e6"/>
    <path d="M30 200 C34 160 44 132 56 120 M90 200 C86 160 76 132 64 120" stroke="#d6cfc0" stroke-width="1.5" fill="none"/>
    <path d="M44 112 L60 146 L76 112" fill="none" stroke="#c9a35a" stroke-width="2.5"/>
    <path d="M48 70 Q60 64 72 70 L72 96 Q60 108 48 96 Z" fill="#a8714a"/>
    <path d="M44 66 Q37 90 42 110 M76 66 Q83 90 78 110" stroke="#fbf8f1" stroke-width="5" fill="none" stroke-linecap="round"/>
    <path d="M39 64 Q60 26 81 64 Q80 74 60 72 Q40 74 39 64 Z" fill="#fbf8f1" stroke="#d6cfc0" stroke-width="1.5"/>
    <path d="M42 60 Q60 50 78 60 M46 52 Q60 44 74 52" stroke="#d6cfc0" fill="none" stroke-width="1.2"/>
    <path class="su-shadi-eyes" d="M51 81 L57 80 M63 80 L69 81" stroke="#1c1917" stroke-width="2.2" stroke-linecap="round"/>
    <path d="M56 95 Q60 96.5 64 95" stroke="#6b3f22" fill="none" stroke-width="1.2" stroke-linecap="round"/>
  </svg>`;

const SU_SCENES = {
  nightmare: {
    sound: 'su-shadi',
    steps: [
      [500, s => { s.pose('shadi-in'); }],
      [900, s => s.say('You have passed Pegasus\' test on the hard road…')],
      [2900, s => s.say('But a darker road lies beyond. Few who walk it ever return.')],
      [4700, s => { s.pose('open'); s.say('<span class="ce-emoji">💀</span> Nightmare unlocked', true); }],
      [7600, s => s.end()]
    ]
  },
  millennium: {
    sound: 'su-millennium',
    steps: [
      [300, s => s.pose('eye-open')],
      [900, s => s.say('Pegasus has fallen on the Nightmare road.')],
      [2900, s => s.say('The Millennium Items have chosen you.')],
      [4700, s => { s.pose('crown'); s.say('<span class="ce-emoji">👁️</span> Millennium theme unlocked', true); }],
      [7600, s => s.end()]
    ]
  }
};

function playSoloUnlockScene(key) {
  const scene = SU_SCENES[key];
  if (!scene) return;
  playSound({ name: scene.sound });
  const overlay = spawnFx(`fx-cegg fx-su fx-su--${key}`, 60 * 1000, {
    html: `
      <div class="su-bg"></div>
      <div class="su-rays"></div>
      <div class="su-door"><span class="su-door-glow"></span><span class="su-door-l"></span><span class="su-door-r"></span></div>
      <div class="su-eye"><svg viewBox="90 50 180 220" aria-hidden="true">${SEV_EYE}</svg></div>
      <div class="su-shadi">
        ${SHADI_SVG}
        <span class="su-item su-item--key ce-emoji">🗝️</span>
        <span class="su-item su-item--scale ce-emoji">⚖️</span>
      </div>
      <div class="su-dust">${ceRange(fxCount(24), () => `<i style="--x: ${ceRand(0, 100).toFixed(1)}%; --d: ${ceRand(3, 7).toFixed(1)}s; --delay: ${(-ceRand(0, 7)).toFixed(1)}s; --s: ${ceRand(2, 5).toFixed(1)}px;"></i>`)}</div>
      <div class="su-say su-say--1"></div>
      <div class="su-say su-say--2"></div>
      <p class="su-skip su-skip--1">Tap to skip</p>
      <p class="su-skip su-skip--2">Tap to skip</p>`
  });
  if (!overlay) return;

  const timers = [];
  const bubbles = [...overlay.querySelectorAll('.su-say')];
  const started = Date.now();
  let done = false;
  const s = {
    pose: cls => overlay.classList.add(cls),
    say: (html, title = false) => bubbles.forEach(b => {
      b.innerHTML = html;
      b.classList.toggle('is-title', title);
      restartClass(b, 'is-on', 60 * 1000);
    }),
    end: () => {
      if (done) return;
      done = true;
      timers.forEach(clearTimeout);
      overlay.classList.add('is-out');
      setTimeout(() => overlay.remove(), SU_FADE_MS);
    }
  };
  scene.steps.forEach(([ms, fn]) => timers.push(setTimeout(() => fn(s), ms)));
  overlay.addEventListener('click', () => {
    if (Date.now() - started > SU_SKIP_AFTER_MS) s.end();
  });
}
