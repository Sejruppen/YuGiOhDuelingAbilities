// Character-select easter eggs: the rivals and villains. The engine and the
// recipe format are in character-eggs.js; the timelines are in effects.css
// ("CHARACTER EGGS"); every scene runs CHAR_EGG_MS (5s).

// --- Bakura: the Millennium Ring and the TRPG board ------------------------------
const MILLENNIUM_RING_SVG = `
  <svg viewBox="0 0 120 135" aria-hidden="true">
    <circle cx="60" cy="8" r="6" fill="none" stroke="#fbbf24" stroke-width="3.5"/>
    <circle cx="60" cy="55" r="42" fill="none" stroke="#b45309" stroke-width="9"/>
    <circle cx="60" cy="55" r="42" fill="none" stroke="#fbbf24" stroke-width="6"/>
    <polygon points="60,22 89,74 31,74" fill="#fbbf24" stroke="#92400e" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M46 56 Q60 44 74 56 Q60 66 46 56 Z" fill="#451a03"/>
    <circle cx="60" cy="56" r="4" fill="#fef3c7"/>
    ${[[30, 84, -22], [42, 93, -11], [60, 97, 0], [78, 93, 11], [90, 84, 22]].map(([x, y, a], i) => `
      <g transform="translate(${x} ${y})"><g class="ce-pointer" style="--a: ${a}deg; --i: ${i};">
        <line x1="0" y1="0" x2="0" y2="20" stroke="#b45309" stroke-width="2"/>
        <polygon points="-4,18 4,18 0,32" fill="#fbbf24" stroke="#92400e" stroke-width="1"/>
      </g></g>`).join('')}
  </svg>`;

registerCharacterEgg('bakura', {
  toast: 'Your soul makes a lovely miniature. 🎲',
  scene: () => `
    <div class="ce-dim ce-dim--shadow"></div>
    <div class="ce-at ce-board">
      <div class="ce-board-grid"></div>
      <div class="ce-figurine"><span class="ce-emoji">🧍</span><span class="ce-fig-base"></span><span class="ce-fig-help">help!</span></div>
    </div>
    <div class="ce-at ce-ring">${MILLENNIUM_RING_SVG}</div>`
});

// --- Pegasus: Toon World ----------------------------------------------------------
const MILLENNIUM_EYE_SVG = `
  <svg viewBox="0 0 120 100" aria-hidden="true">
    <path d="M8 40 Q60 -4 112 40 Q60 84 8 40 Z" fill="#fef3c7" stroke="#b45309" stroke-width="5"/>
    <circle cx="60" cy="40" r="17" fill="#f59e0b" stroke="#92400e" stroke-width="2"/>
    <circle cx="60" cy="40" r="7" fill="#1c1917"/>
    <circle cx="64" cy="35" r="3" fill="#fff"/>
    <path class="ce-lid" d="M8 40 Q60 -4 112 40 Q60 84 8 40 Z" fill="#d97706" stroke="#b45309" stroke-width="5"/>
    <path d="M44 66 L38 96 M64 74 Q74 96 92 88" fill="none" stroke="#b45309" stroke-width="5" stroke-linecap="round"/>
  </svg>`;

registerCharacterEgg('pegasus', {
  scene: () => `
    <div class="ce-dim ce-dim--toon"></div>
    ${ceRange(4, i => `<div class="ce-giggle" style="--i: ${i}; left: calc(var(--cl) + var(--cw) * ${(0.2 + i * 0.2).toFixed(1)}); top: var(--ct);">${cePick(['hee hee~', 'tee hee!', 'hoho~', '♪'])}</div>`)}
    <div class="ce-at ce-meye">${MILLENNIUM_EYE_SVG}</div>
    <div class="ce-at ce-bubble ce-pega-say">I already know which card you'll pick, Yugi-boy! ✨</div>`,
  cardHtml: () => `
    <span class="ce-toon-eyes">
      <span class="ce-toon-eye"><span></span></span>
      <span class="ce-toon-eye"><span></span></span>
    </span>`
});

// --- Odion: Temple of Traps ----------------------------------------------------------
const ODION_TRAPS = [
  { name: 'Trap Hole', cls: 'hole' },
  { name: 'Mirror Force', cls: 'mirror' },
  { name: 'Cage', cls: 'cage' }
];

// The other character cards currently on screen.
function visibleOtherCards(card) {
  const vh = window.innerHeight;
  return [...(card.parentElement?.children || [])].filter(el => {
    if (el === card) return false;
    const r = el.getBoundingClientRect();
    return r.bottom > 0 && r.top < vh;
  }).slice(0, 9);
}

registerCharacterEgg('odion', {
  toast: 'Servitude has its perks.',
  toastSmall: 'Please mind the traps on your way out.',
  scene: ctx => {
    const traps = visibleOtherCards(ctx.card).map((el, i) => {
      const r = el.getBoundingClientRect();
      const trap = ODION_TRAPS[i % ODION_TRAPS.length];
      const effect = trap.cls === 'cage'
        ? `<span class="ce-cage">${ceRange(7, b => `<i style="--b: ${b};"></i>`)}</span>`
        : `<span class="ce-trap-fx ce-trap-fx--${trap.cls}"></span>`;
      return `
        <div class="ce-trap" style="--i: ${i}; left: ${r.left.toFixed(0)}px; top: ${r.top.toFixed(0)}px; width: ${r.width.toFixed(0)}px; height: ${r.height.toFixed(0)}px;">
          ${effect}
          <span class="ce-trap-tag">TRAP CARD! <b>${trap.name}</b></span>
        </div>`;
    }).join('');
    return `
      <div class="ce-dim ce-dim--trap"></div>
      ${traps}
      <div class="ce-at ce-odion"><span class="ce-emoji">🙇‍♂️</span></div>`;
  },
  onStart: ctx => {
    const others = visibleOtherCards(ctx.card);
    others.forEach((el, i) => {
      el.style.setProperty('--i', i);
      el.classList.add('cegg-trapped');
    });
    return () => others.forEach(el => {
      el.classList.remove('cegg-trapped');
      el.style.removeProperty('--i');
    });
  }
});

// --- Ishizu: the vision -----------------------------------------------------------------
registerCharacterEgg('ishizu', {
  toast: 'I foresaw this exact moment. 🔮',
  scene: () => `
    <div class="ce-dim ce-dim--vision"></div>
    <div class="ce-vision"></div>
    <div class="ce-at ce-necklace"><span class="ce-ankh">☥</span><span class="ce-emoji ce-neck-eye">👁️</span></div>
    <div class="ce-at ce-vision-label">✧ VISION ✧</div>
    <div class="ce-at ce-ghost-ripple"></div>
    <div class="ce-at ce-ghost-finger"><span class="ce-emoji">👇</span></div>
    <div class="ce-at ce-bubble ce-ornot">…or not.</div>`
});

// --- Marik (Slimes): Revival Jam ----------------------------------------------------------
registerCharacterEgg('marik-1', {
  toast: 'It always comes back. Like Marik.',
  scene: () => `
    <div class="ce-dim ce-dim--slime"></div>
    ${ceRange(9, i => `<span class="ce-drip" style="left: calc(var(--cl) + var(--cw) * ${(0.06 + i * 0.11).toFixed(2)}); --w: ${ceRand(10, 22).toFixed(0)}px; --at: ${ceRand(500, 1700).toFixed(0)}ms; --i: ${i};"></span>`)}
    <div class="ce-at ce-jam"><span class="ce-jam-eye"></span><span class="ce-jam-eye"></span><span class="ce-jam-mouth"></span></div>`,
  cardHtml: () => '<span class="ce-slime-coat"></span>'
});

// --- Marik (Sun God): unreadable Ra -------------------------------------------------------
registerCharacterEgg('marik-2', {
  toast: "Should've read the manual. 📜",
  scene: () => `
    <div class="ce-dim ce-dim--gold"></div>
    <div class="ce-at ce-scroll"><span>𓀀𓁐𓂀𓃾𓅓𓆣𓇳𓉐𓊹𓋹𓌳𓍯</span></div>
    ${ceRange(3, i => `<div class="ce-at ce-qmark" style="--i: ${i};">???</div>`)}
    <div class="ce-at ce-sphere"></div>
    <div class="ce-at ce-error">ERROR: UNREADABLE</div>
    <div class="ce-flash ce-flash--sun"></div>
    <div class="ce-at ce-phoenix"><span class="ce-emoji ce-phoenix-flames">🔥</span><span class="ce-emoji ce-phoenix-bird">🦅</span></div>`
});

// --- Weevil: bugs and a flicked Exodia -----------------------------------------------------
registerCharacterEgg('weevil', {
  toast: 'Exodia has left the chat. (Again.)',
  scene: ctx => {
    const bugs = ceRange(16, i => {
      const angle = ceRand(0, Math.PI * 2);
      const far = Math.max(ctx.vw, ctx.vh);
      return `<span class="ce-at ce-bug ce-emoji" style="--sx: ${(Math.cos(angle) * far).toFixed(0)}px; --sy: ${(Math.sin(angle) * far).toFixed(0)}px; --ex: ${(ctx.width * ceRand(-0.45, 0.45)).toFixed(0)}px; --ey: ${(ctx.height * ceRand(-0.4, 0.4)).toFixed(0)}px; --at: ${ceRand(0, 500).toFixed(0)}ms;">${cePick(['🐜', '🐛', '🪲', '🦗', '🕷️', '🐞'])}</span>`;
    });
    return `
      <div class="ce-dim"></div>
      ${bugs}
      <div class="ce-at ce-exodia-card"><b>Exodia the Forbidden One</b><span class="ce-emoji">🗿</span><i>∞ / ∞</i></div>
      <div class="ce-at ce-weevil"><span class="ce-emoji">🤓</span><span class="ce-emoji ce-flick">👉</span></div>
      <div class="ce-at ce-bubble ce-gotcha">Hehehe! Gotcha!</div>`;
  },
  cardHtml: () => ceRange(7, i =>
    `<span class="ce-hole" style="--i: ${i}; left: ${ceRand(4, 88).toFixed(0)}%; top: ${ceRand(5, 70).toFixed(0)}%; --s: ${ceRand(14, 26).toFixed(0)}px;"></span>`)
});

// --- Bandit Keith: cards up the sleeve -------------------------------------------------------
const KEITH_FLAG_SVG = `
  <svg viewBox="0 0 76 40" aria-hidden="true">
    <rect x="0" y="0" width="76" height="40" fill="#fff"/>
    ${ceRange(7, i => `<rect x="0" y="${(i * 40 / 6.5).toFixed(2)}" width="76" height="${(40 / 13).toFixed(2)}" fill="#b91c1c"/>`)}
    <rect x="0" y="0" width="76" height="40" fill="none" stroke="#7f1d1d" stroke-width="1"/>
    <rect x="0" y="0" width="32" height="21.5" fill="#1e3a8a"/>
    ${ceRange(12, i => `<circle cx="${(4 + (i % 4) * 8).toFixed(0)}" cy="${(4 + Math.floor(i / 4) * 6.5).toFixed(1)}" r="1.2" fill="#fff"/>`)}
  </svg>`;

function keithReel(i, final) {
  const symbols = ['🍒', '🔔', '⭐', '🍋', '7', '💎', '🍒', '7', '🔔', '⭐', '🍋', '💎'];
  const strip = [...symbols.slice(i * 2), ...symbols.slice(0, i * 2), final];
  return `<div class="ce-reel" style="--i: ${i}; --n: ${strip.length - 1};"><div class="ce-strip">${strip.map(s => `<span class="${s === '7' ? 'is-seven' : 'ce-emoji'}">${s}</span>`).join('')}</div></div>`;
}

registerCharacterEgg('keith', {
  toast: 'In America! 🦅',
  toastSmall: '(Card count may vary.)',
  scene: () => `
    <div class="ce-dim ce-dim--usa"></div>
    ${[['one…', 0], ['two…', 1]].map(([label, i]) => `<div class="ce-sleeve-card" style="--i: ${i};"><span class="ce-back"></span><b>${label}</b></div>`).join('')}
    ${ceRange(16, i => `<span class="ce-flurry ce-back" style="--i: ${i}; --dx: ${ceRand(-30, 230).toFixed(0)}px; --dy: ${ceRand(-180, -40).toFixed(0)}px; --r: ${ceRand(-540, 540).toFixed(0)}deg;"></span>`)}
    <div class="ce-at ce-slot">
      <div class="ce-slot-title">JACKPOT?</div>
      <div class="ce-slot-body">${keithReel(0, '7')}${keithReel(1, '7')}${keithReel(2, '🍋')}</div>
    </div>
    <div class="ce-at ce-flag">${KEITH_FLAG_SVG}</div>`
});
