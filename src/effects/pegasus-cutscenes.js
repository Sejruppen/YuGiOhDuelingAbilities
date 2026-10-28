// Co-op Boss cutscenes: before each phase's rule card (intro, stage2, stage3)
// and over the victory screen (victory) a short animated scene plays with a detailed SVG Pegasus who talks to and
// points at both duelists. The phone lies between the players, so Pegasus
// stands in the middle and every line is shown twice: upright for Player 1
// (bottom) and rotated for Player 2 (top). Tap anywhere to skip.
// Poses are CSS classes on the overlay (pose transitions in effects.css,
// "PEGASUS CUTSCENES"); sounds are 'pg-scene-*' in sounds.js.
const PG_FADE_MS = 600;
const PG_SKIP_AFTER_MS = 600;

const PEGASUS_SVG = `
  <svg class="pg-svg" viewBox="0 0 200 260" aria-hidden="true">
    <defs>
      <linearGradient id="pg-hair" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#f8fafc"/><stop offset="1" stop-color="#cbd5e1"/>
      </linearGradient>
      <linearGradient id="pg-suit" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#dc2626"/><stop offset="1" stop-color="#7f1d1d"/>
      </linearGradient>
      <radialGradient id="pg-gold" cx=".4" cy=".35" r=".7">
        <stop offset="0" stop-color="#fef3c7"/><stop offset=".5" stop-color="#fbbf24"/><stop offset="1" stop-color="#92400e"/>
      </radialGradient>
    </defs>
    <path d="M58 70 C52 120 46 180 38 232 L162 232 C154 180 148 120 142 70 C140 40 120 28 100 28 C80 28 60 40 58 70 Z" fill="url(#pg-hair)"/>
    <path d="M28 260 C28 200 50 174 78 164 L100 172 L122 164 C150 174 172 200 172 260 Z" fill="url(#pg-suit)"/>
    <path d="M78 164 L100 202 L92 260 L70 260 C72 222 74 190 78 164 Z M122 164 L100 202 L108 260 L130 260 C128 222 126 190 122 164 Z" fill="#7f1d1d"/>
    <path d="M122 164 L100 202 L104 214" stroke="#fca5a5" stroke-width=".8" fill="none" opacity=".5"/>
    <path d="M88 124 L112 124 L113 168 L87 168 Z" fill="#f1c7a8"/>
    <path d="M88 132 Q100 142 112 132 L112 140 Q100 148 88 140 Z" fill="#d9a184" opacity=".6"/>
    <path d="M86 165 L100 202 L114 165 Z" fill="#fff"/>
    <g fill="#fff" stroke="#e2e8f0" stroke-width="1">
      <ellipse cx="100" cy="172" rx="10" ry="5"/>
      <ellipse cx="100" cy="182" rx="13" ry="6"/>
      <ellipse cx="100" cy="193" rx="15" ry="7"/>
      <ellipse cx="100" cy="205" rx="12" ry="6"/>
    </g>
    <circle cx="100" cy="186" r="2.4" fill="url(#pg-gold)"/>
    <path d="M70 92 C70 62 84 52 100 52 C116 52 130 62 130 92 C130 118 116 136 100 138 C84 136 70 118 70 92 Z" fill="#f6d5bd"/>
    <path d="M74 112 C80 128 90 136 100 138 C92 132 82 124 76 108 Z" fill="#e8b996" opacity=".6"/>
    <g class="pg-meye">
      <circle cx="113" cy="94" r="7.5" fill="url(#pg-gold)" stroke="#78350f" stroke-width=".8"/>
      <path d="M106.5 94 Q113 89.5 119.5 94 Q113 98.5 106.5 94 Z" fill="#451a03"/>
      <circle cx="113" cy="94" r="2.2" fill="#fde047"/>
      <path d="M113 98.5 L112 104 M110 97.5 L108.5 101.5" stroke="#78350f" stroke-width=".9"/>
    </g>
    <g class="pg-eye">
      <path d="M78 94 Q87 88 96 94 Q87 98.5 78 94 Z" fill="#fff"/>
      <circle cx="88" cy="94" r="2.9" fill="#a16207"/>
      <circle cx="88" cy="94" r="1.3" fill="#111"/>
      <circle cx="88.9" cy="93" r=".6" fill="#fff"/>
      <path d="M77 93.5 Q87 86 97 93" stroke="#3f2a1d" stroke-width="1.5" fill="none" stroke-linecap="round"/>
    </g>
    <path class="pg-brow" d="M76 86 Q86 80.5 97 84.5" stroke="#cbd5e1" stroke-width="2.2" fill="none" stroke-linecap="round"/>
    <path d="M100 96 L97 110 Q100 112.5 103 110" stroke="#c99a7c" stroke-width="1.2" fill="none" stroke-linecap="round"/>
    <path class="pg-mouth" d="M91 120 Q100 125 109 118" stroke="#9f4a3a" stroke-width="1.7" fill="none" stroke-linecap="round"/>
    <path class="pg-mouth-open" d="M90 118 Q100 134 111 116 Q100 122 90 118 Z" fill="#5b1a1a" stroke="#9f4a3a" stroke-width="1"/>
    <path d="M66 102 C62 62 78 40 100 40 C124 40 140 58 136 104 C134 82 128 68 118 61 C108 70 92 67 83 60 C75 68 70 84 66 102 Z" fill="url(#pg-hair)"/>
    <path d="M70 70 C63 100 63 140 56 184 L65 186 C69 150 71 112 76 84 Z M131 74 C138 104 138 140 144 184 L135 186 C131 150 129 112 125 86 Z" fill="url(#pg-hair)"/>
    <path d="M84 48 C78 56 74 66 72 80 M96 44 C88 52 84 58 83 62 M116 46 C122 54 126 62 128 76" stroke="#94a3b8" stroke-width=".9" fill="none" opacity=".7"/>
    <path class="pg-lock" d="M107 56 C122 62 129 80 127 100 C126 118 129 140 135 170 L124 168 C118 140 116 118 112 104 C108 90 103 72 107 56 Z" fill="url(#pg-hair)" stroke="#94a3b8" stroke-width=".7"/>
    <g class="pg-arm-point">
      <path d="M138 188 C152 194 166 202 176 212 L169 223 C159 215 147 210 134 206 Z" fill="url(#pg-suit)"/>
      <g fill="#fff" stroke="#e2e8f0" stroke-width=".8">
        <ellipse cx="174" cy="218" rx="4.5" ry="8" transform="rotate(-40 174 218)"/>
        <ellipse cx="178" cy="219" rx="3.5" ry="6.5" transform="rotate(-40 178 219)"/>
      </g>
      <path d="M180 213 C187 213 194 215 199 217 C200 218 200 220 199 220.5 C194 221 189 221 186 222 C186 225 182 227 179 224 C176 221 177 215 180 213 Z" fill="#f6d5bd" stroke="#d9a184" stroke-width=".6"/>
    </g>
    <g class="pg-arm-glass">
      <path d="M26 260 L38 204 C41 190 49 178 57 169 L70 178 C62 190 56 204 54 260 Z" fill="url(#pg-suit)"/>
      <g fill="#fff" stroke="#e2e8f0" stroke-width=".8">
        <ellipse cx="62" cy="171" rx="10" ry="5" transform="rotate(35 62 171)"/>
        <ellipse cx="63" cy="167" rx="8" ry="4" transform="rotate(35 63 167)"/>
      </g>
      <g class="pg-glass">
        <path d="M52 128 Q52 144 62 146 Q72 144 72 128 Z" fill="rgb(255 255 255 / 0.22)" stroke="#e2e8f0" stroke-width="1"/>
        <path class="pg-wine" d="M53.4 134 Q54 144 62 145 Q70 144 70.6 134 Z" fill="#9f1239"/>
        <path d="M55 130 Q55 138 58 141" stroke="#fff" stroke-width="1" fill="none" opacity=".7"/>
        <path d="M62 146 L62 157" stroke="#e2e8f0" stroke-width="1.6"/>
        <ellipse cx="62" cy="157.5" rx="6" ry="1.6" fill="#e2e8f0"/>
      </g>
      <ellipse cx="63" cy="157" rx="6.5" ry="5.5" fill="#f6d5bd" stroke="#d9a184" stroke-width=".6"/>
    </g>
  </svg>`;

const pgHand = () => ceRange(4, i => `
  <span class="pg-card" style="--i: ${i - 1.5};">
    <span class="pg-card-back"></span>
    <span class="pg-card-face ce-emoji">${['🐉', '🧙', '🪤', '⚔️'][i]}</span>
  </span>`);

const pgPlayer = n => `
  <div class="pg-player pg-player--${n}">
    <div class="pg-hand">${pgHand()}</div>
    <div class="pg-soul"><span class="ce-emoji">👤</span></div>
    <span class="pg-player-name">Player ${n}</span>
  </div>`;

const PG_SCENES = {
  intro: {
    sound: 'pg-scene-intro',
    start: 'is-entering',
    steps: [
      [300, s => s.pose('-is-entering')],
      [1100, s => s.pose('sip')],
      [1800, s => { s.pose('-sip'); s.pose('book-open'); s.say('Welcome to my Toon World!'); }],
      [3500, s => { s.pose('point-p1'); s.say('Player 1… what a charming little deck.'); }],
      [5000, s => { s.pose('-point-p1'); s.pose('point-p2'); s.say('And Player 2! Such determined eyes.'); }],
      [6500, s => { s.pose('-point-p2'); s.pose('laugh'); s.say('Two duelists against little old me? How delightful!'); }],
      [8800, s => s.end()]
    ]
  },
  stage2: {
    sound: 'pg-scene-stage2',
    start: 'book-open book-still',
    steps: [
      [300, s => s.pose('book-burn')],
      [1200, s => { s.pose('scowl'); s.say('My Toon World…! You will pay for that.'); }],
      [2700, s => s.pose('toss')],
      [3300, s => { s.pose('-scowl'); s.pose('reveal'); s.say('Enough playtime. Behold… the Millennium Eye!'); }],
      [5000, s => { s.pose('scan-p1'); s.pose('read-p1'); s.say('Player 1… I see every card in your hand.'); }],
      [6400, s => { s.pose('-scan-p1'); s.pose('scan-p2'); s.pose('read-p2'); s.say('Player 2… your mind is an open book!'); }],
      [7800, s => { s.pose('-scan-p2'); s.pose('laugh'); s.say('No more secrets, my friends.'); }],
      [9600, s => s.end()]
    ]
  },
  stage3: {
    sound: 'pg-scene-stage3',
    start: 'reveal no-glass',
    steps: [
      [200, s => s.pose('blood')],
      [700, s => { s.pose('scowl'); s.pose('cards'); s.say('You have pushed me to my final card…'); }],
      [2400, s => { s.pose('-scowl'); s.pose('point-p1'); s.pose('soul-p1'); s.say('Player 1… your soul…'); }],
      [3800, s => { s.pose('-point-p1'); s.pose('point-p2'); s.pose('soul-p2'); s.say('…and yours, Player 2…'); }],
      [5200, s => { s.pose('-point-p2'); s.pose('-cards'); s.pose('laugh'); s.pose('flash'); s.say('…will make a lovely addition to my collection!'); }],
      [7800, s => s.end()]
    ]
  },
  // Plays over the victory screen. The fanfare and confetti come when it ends.
  victory: {
    sound: 'pg-scene-victory',
    start: 'reveal no-glass',
    onEnd: () => {
      playSound({ name: 'co-victory' });
      fxCoopVictory();
    },
    steps: [
      [200, s => { s.pose('hit'); s.pose('scowl'); s.say('Impossible…!'); }],
      [1400, s => { s.pose('-hit'); s.pose('eye-fail'); s.say("My Millennium Eye… it can't see your cards anymore!"); }],
      [3200, s => { s.pose('-scowl'); s.pose('gasp'); s.pose('bond'); s.pose('read-p1'); s.pose('read-p2'); s.say('This light… the power of friendship?!'); }],
      [5000, s => { s.pose('-gasp'); s.pose('-bond'); s.pose('-reveal'); s.say('Bah! Very well… you win, my friends.'); }],
      [6600, s => { s.pose('-no-glass'); s.pose('bow'); s.pose('stars'); s.say('Congratulations! Do visit my castle again sometime~'); }],
      [7500, s => { s.pose('-bow'); s.pose('sip'); }],
      [8400, s => { s.pose('-sip'); s.pose('is-leaving'); }],
      [9300, s => s.end()]
    ]
  }
};

function playPegasusScene(key) {
  const scene = PG_SCENES[key];
  if (!scene) return;
  const overlay = spawnFx(`fx-cegg fx-pg fx-pg--${key} ${scene.start}`, 60 * 1000, {
    html: `
      <div class="pg-bg"></div>
      <div class="pg-spot"></div>
      ${pgPlayer(2)}
      ${pgPlayer(1)}
      <div class="pg-stage">
        <div class="pg-man">${PEGASUS_SVG}</div>
        <div class="pg-book">
          <div class="pg-book-pages">${ceRange(6, i => `<span style="--i: ${i};"></span>`)}</div>
          <div class="pg-book-cover"><b>TOON</b><b>WORLD</b></div>
          ${['🧜‍♀️', '🐰', '💀', '🧙‍♀️'].map((t, i) => `<span class="pg-toon ce-emoji" style="--i: ${i};">${t}</span>`).join('')}
        </div>
        <div class="pg-fan">${ceRange(3, i => `<span style="--i: ${i - 1};"></span>`)}</div>
      </div>
      <div class="pg-beam pg-beam--1"></div>
      <div class="pg-beam pg-beam--2"></div>
      <div class="pg-say pg-say--1"></div>
      <div class="pg-say pg-say--2"></div>
      <div class="pg-redflash"></div>
      <div class="pg-whiteflash"></div>
      <div class="pg-stars">${ceRange(24, () => `<span class="ce-emoji" style="--x: ${ceRand(0, 96).toFixed(1)}%; --d: ${Math.round(ceRand(0, 1600))}ms; --s: ${ceRand(0.7, 1.3).toFixed(2)};">${cePick(['✨', '⭐', '💫', '🌟'])}</span>`)}</div>
      <p class="pg-skip pg-skip--1">Tap to skip</p>
      <p class="pg-skip pg-skip--2">Tap to skip</p>`
  });
  if (!overlay) return;

  const timers = [];
  const bubbles = [...overlay.querySelectorAll('.pg-say')];
  const started = Date.now();
  let done = false;
  const s = {
    pose: cls => (cls.startsWith('-') ? overlay.classList.remove(cls.slice(1)) : overlay.classList.add(cls)),
    say: text => bubbles.forEach(b => {
      b.textContent = text;
      restartClass(b, 'is-on', 60 * 1000);
    }),
    end: () => {
      if (done) return;
      done = true;
      timers.forEach(clearTimeout);
      overlay.classList.add('is-out');
      scene.onEnd?.();
      setTimeout(() => overlay.remove(), PG_FADE_MS);
    }
  };
  scene.steps.forEach(([ms, fn]) => timers.push(setTimeout(() => fn(s), ms)));
  overlay.addEventListener('click', () => {
    if (Date.now() - started > PG_SKIP_AFTER_MS) s.end();
  });
  playSound({ name: scene.sound });
}
