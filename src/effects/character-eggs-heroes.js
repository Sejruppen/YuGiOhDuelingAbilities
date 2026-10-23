// Character-select easter eggs: the heroes (and Neutral). The engine and the
// recipe format are in character-eggs.js; the timelines are in effects.css
// ("CHARACTER EGGS"); every scene runs CHAR_EGG_MS (5s).

// --- Neutral (Custom Deck): the Generic Monster ------------------------------
registerCharacterEgg('neutral', {
  toast: 'Freestyle. Also known as "I\'ll figure it out."',
  scene: () => {
    const types = [['🐉', 'Dragon'], ['🧙', 'Spellcaster'], ['🤖', 'Machine'], ['🐛', 'Insect'], ['🐟', 'Fish'], ['🃏', 'Toon']];
    const pulls = types.map(([emoji, label], i) => {
      const dx = (i % 2 ? 1 : -1) * (60 + Math.floor(i / 2) * 40);
      return `<div class="ce-at ce-pull" style="--i: ${i}; --dx: ${dx}px;"><div class="ce-mini"><span class="ce-emoji">${emoji}</span><b>${label}</b></div><span class="ce-nope ce-emoji">❌</span></div>`;
    }).join('');
    return `
      <div class="ce-dim"></div>
      ${pulls}
      <div class="ce-at ce-generic">
        <div class="ce-generic-card"><b>Generic Monster</b><span>?</span><i>ATK ? / DEF ?</i></div>
        <div class="ce-bubble ce-shrug">¯\\_(ツ)_/¯</div>
      </div>`;
  }
});

// --- Yugi (Duelist Kingdom): the hair takes over -----------------------------
const YAMI_HAIR_SVG = `
  <svg viewBox="0 0 220 200" aria-hidden="true">
    <g stroke="#0c0a09" stroke-width="2" stroke-linejoin="round">
      <polygon points="30,170 8,60 60,140" fill="#1c1917"/>
      <polygon points="55,165 40,20 90,140" fill="#1c1917"/>
      <polygon points="85,160 95,0 125,140" fill="#1c1917"/>
      <polygon points="120,150 165,15 150,160" fill="#1c1917"/>
      <polygon points="150,160 212,55 175,170" fill="#1c1917"/>
      <ellipse cx="110" cy="160" rx="78" ry="30" fill="#1c1917"/>
    </g>
    <g fill="#be185d">
      <polygon points="8,60 13.5,87.5 21,80"/>
      <polygon points="40,20 43.75,56.25 52.5,50"/>
      <polygon points="95,0 92.5,40 102.5,35"/>
      <polygon points="165,15 153.75,48.75 161.25,51.25"/>
      <polygon points="212,55 196.5,81.25 202.75,83.75"/>
    </g>
    <g fill="#facc15" stroke="#a16207" stroke-width="1.5" stroke-linejoin="round">
      <polygon points="70,140 52,196 80,160 74,200 100,150"/>
      <polygon points="150,140 168,196 140,160 146,200 120,150"/>
      <polygon points="100,145 104,190 110,160 116,190 120,145"/>
    </g>
  </svg>`;

registerCharacterEgg('yugi-dk', {
  toast: "It's time to… wait, which one of us is driving?",
  scene: () => `
    <div class="ce-dim"></div>
    <div class="ce-hair">${YAMI_HAIR_SVG}</div>
    <div class="ce-flash ce-flash--gold"></div>
    <div class="ce-at ce-puzzle">${PUZZLE_SVG}</div>`
});

// --- Yugi (Battle City): Kuribon! ---------------------------------------------
registerCharacterEgg('yugi-bc', {
  toast: 'Dark Magician Girl: 1 · Dark Magician\'s dignity: 0',
  scene: () => {
    const hearts = ceRange(22, i =>
      `<span class="ce-heart ce-emoji" style="left: ${ceRand(2, 95).toFixed(0)}%; --i: ${i}; --s: ${ceRand(0.7, 1.6).toFixed(2)}; --sway: ${ceRand(-30, 30).toFixed(0)}px;">${cePick(['💖', '💕', '💗', '❤️'])}</span>`);
    return `
      <div class="ce-dim ce-dim--pink"></div>
      ${hearts}
      <div class="ce-at ce-dm"><span class="ce-emoji ce-dm-stand">🧙‍♂️</span><span class="ce-emoji ce-dm-palm">🤦‍♂️</span></div>
      <div class="ce-at ce-dmg"><span class="ce-emoji">🧙‍♀️</span><span class="ce-emoji ce-wink">😉</span></div>
      <div class="ce-at ce-bubble ce-kuribon">Kuribon! ♡</div>`;
  }
});

// --- Kaiba (Duelist Kingdom): money, dragons, coat -----------------------------
const KAIBA_COAT_SVG = `
  <svg viewBox="0 0 160 200" aria-hidden="true">
    <path d="M44 14 L8 70 L22 76 L50 36 Z M116 14 L152 70 L138 76 L110 36 Z" fill="#e2e8f0" stroke="#475569" stroke-width="2"/>
    <g class="ce-coat-tails">
      <path d="M48 14 L112 14 L120 46 L156 194 Q128 180 106 198 L80 70 L54 198 Q32 180 4 194 L40 46 Z" fill="#f8fafc" stroke="#475569" stroke-width="2.5" stroke-linejoin="round"/>
    </g>
    <path d="M60 14 L80 44 L100 14" fill="none" stroke="#475569" stroke-width="2"/>
    <path d="M48 14 L40 2 L64 12 Z M112 14 L120 2 L96 12 Z" fill="#f8fafc" stroke="#475569" stroke-width="2"/>
    <rect x="64" y="56" width="32" height="10" rx="2" fill="#1e293b"/>
    <text x="80" y="64.5" text-anchor="middle" font-size="8" font-weight="900" fill="#fbbf24">KC</text>
  </svg>`;

registerCharacterEgg('kaiba-dk', {
  toast: 'Screw the rules, I have MONEY! 💰',
  scene: () => {
    const dragons = ceRange(3, i => `<div class="ce-bewd" style="--i: ${i}; top: calc(var(--cy) - 130px + ${i * 60}px);"><span class="ce-emoji">🐉</span></div>`);
    const coins = ceRange(34, i =>
      `<span class="ce-coin ce-emoji" style="left: ${ceRand(0, 96).toFixed(0)}%; --i: ${i}; --d: ${ceRand(1100, 1800).toFixed(0)}ms; --s: ${ceRand(0.8, 1.5).toFixed(2)};">🪙</span>`);
    return `
      <div class="ce-dim ce-dim--blue"></div>
      ${dragons}
      <div class="ce-coat">${KAIBA_COAT_SVG}</div>
      ${coins}`;
  }
});

// --- Kaiba (Battle City): KaibaLand, punched -----------------------------------
registerCharacterEgg('kaiba-bc', {
  scene: () => `
    <div class="ce-dim ce-dim--sky"></div>
    <div class="ce-at ce-banner">KAIBALAND OPENING SOON</div>
    <div class="ce-at ce-jet"><span class="ce-emoji">✈️</span></div>
    <div class="ce-at ce-fist"><span class="ce-emoji">👊</span></div>
    <div class="ce-at ce-pow">POW!</div>
    ${ceRange(3, i => `<div class="ce-at ce-laugh" style="--i: ${i};">HAHAHAHA!</div>`)}`
});

// --- Joey (Duelist Kingdom): Time Wizard roulette -------------------------------
registerCharacterEgg('joey-dk', {
  toast: "Nyeh! Luck'll come back. Probably.",
  scene: () => {
    const slots = ['💀', '⏳', '💀', '⏳', '💀', '⏳'];
    return `
      <div class="ce-dim"></div>
      <div class="ce-at ce-roulette">
        <div class="ce-wheel">${slots.map((s, i) => `<span class="ce-emoji" style="--i: ${i};">${s}</span>`).join('')}</div>
        <span class="ce-wheel-pin"></span>
        <span class="ce-wheel-hub ce-emoji">🧙</span>
      </div>
      <div class="ce-at ce-swordsman"><span class="ce-emoji">🤺</span><span class="ce-emoji ce-dizzy">💫</span></div>`;
  }
});

// --- Joey (Battle City): 6… 6… 1 -------------------------------------------------
registerCharacterEgg('joey-bc', {
  toast: 'Red-Eyes Gamble: house wins. 🎲',
  scene: () => `
    <div class="ce-dim ce-dim--red"></div>
    <div class="ce-at ce-die-track"><div class="ce-die"><span class="ce-die-six">⚅</span><span class="ce-die-one">⚀</span></div></div>
    ${[['6!', 900], ['6!!', 1900], ['1…', 2900]].map(([label, at]) => `<div class="ce-at ce-roll" style="--at: ${at}ms;">${label}</div>`).join('')}
    <div class="ce-at ce-redeyes"><span class="ce-emoji">🐉</span></div>
    <div class="ce-at ce-bubble ce-sigh">…sigh.</div>`
});

// --- Mai Valentine: Harpie makeover ----------------------------------------------
registerCharacterEgg('mai', {
  toast: 'Fashionably late, devastatingly on time. 💅',
  scene: () => `
    <div class="ce-dim ce-dim--rose"></div>
    ${[-1, 0, 1].map((sx, i) => `<div class="ce-at ce-harpy" style="--i: ${i}; --sx: ${sx};"><span class="ce-emoji">🧚‍♀️</span></div>`).join('')}
    ${ceRange(5, i => `<span class="ce-perfume" style="--i: ${i}; left: calc(var(--cl) + var(--cw) * ${ceRand(0.1, 0.9).toFixed(2)}); top: calc(var(--ct) + ${ceRand(-20, 60).toFixed(0)}px);"></span>`)}`,
  cardHtml: () => `
    <span class="ce-blush ce-blush--l"></span>
    <span class="ce-blush ce-blush--r"></span>
    ${ceRange(6, i => `<span class="ce-sparkle ce-emoji" style="--i: ${i}; left: ${ceRand(5, 90).toFixed(0)}%; top: ${ceRand(0, 75).toFixed(0)}%;">✨</span>`)}
    <span class="ce-kiss ce-emoji">💋</span>`
});

// --- Mako Tsunami: the sea comes to you -------------------------------------------
registerCharacterEgg('mako', {
  toast: 'The sea is my deck, the deck is my sea. 🌊',
  scene: () => `
    <div class="ce-water"><span class="ce-water-crest"></span></div>
    <div class="ce-bigwave ce-emoji">🌊</div>
    <div class="ce-at ce-tail"><span class="ce-emoji">🐋</span></div>
    ${ceRange(10, i => {
      const angle = -Math.PI / 2 + ceRand(-1.2, 1.2);
      const dist = ceRand(60, 140);
      return `<span class="ce-at ce-drop ce-emoji" style="--dx: ${(Math.cos(angle) * dist).toFixed(0)}px; --dy: ${(Math.sin(angle) * dist).toFixed(0)}px;">💧</span>`;
    })}
    ${ceRange(9, i => `<span class="ce-spatter" style="left: ${ceRand(5, 90).toFixed(0)}%; top: ${ceRand(5, 80).toFixed(0)}%; --s: ${ceRand(0.6, 1.6).toFixed(2)}; --i: ${i};"></span>`)}`
});
