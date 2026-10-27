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

// --- Custom: the Frankenstein Duelist -------------------------------------------
// A lab, two Tesla coils and a green head. Parts of other duelists fly in and
// get stitched on, lightning strikes, it wakes up and yells everyone's
// catchphrase at once. Uses KAIBA_COAT_SVG (below) and MILLENNIUM_EYE_SVG
// (character-eggs-villains.js); both are only read when the scene runs.
const FRANKEN_HAIR_SVG = `
  <svg viewBox="0 0 130 80" aria-hidden="true">
    <g fill="#1c1917" stroke="#0c0a09" stroke-width="2" stroke-linejoin="round">
      <polygon points="10,70 4,20 40,60"/>
      <polygon points="30,66 34,2 62,58"/>
      <polygon points="56,60 72,0 86,60"/>
      <polygon points="80,62 104,6 100,68"/>
      <polygon points="96,70 128,24 112,74"/>
      <ellipse cx="65" cy="66" rx="58" ry="14"/>
    </g>
    <g fill="#be185d">
      <polygon points="4,20 8,40 14,36"/>
      <polygon points="34,2 36,22 42,20"/>
      <polygon points="72,0 70,20 76,20"/>
      <polygon points="104,6 98,24 102,26"/>
      <polygon points="128,24 118,38 122,40"/>
    </g>
    <g fill="#facc15" stroke="#a16207" stroke-width="1.2" stroke-linejoin="round">
      <polygon points="44,62 36,80 52,68 50,80 62,64"/>
      <polygon points="86,62 94,80 78,68 80,80 68,64"/>
    </g>
  </svg>`;

const FRANKEN_ARC_SVG = `
  <svg viewBox="0 0 270 40" preserveAspectRatio="none" aria-hidden="true">
    <polyline points="0,20 30,5 55,32 85,8 110,30 135,12 160,34 185,6 215,30 240,10 270,20" fill="none" stroke="#a5f3fc" stroke-width="3" stroke-linejoin="round"/>
    <polyline points="0,20 30,5 55,32 85,8 110,30 135,12 160,34 185,6 215,30 240,10 270,20" fill="none" stroke="#fff" stroke-width="1.2" stroke-linejoin="round"/>
  </svg>`;

// x/y: where it ends up on the monster; sx/sy: where it flies in from;
// at: arrival delay (ms); tx/ty: where its "+ part" label pops up.
const FRANKEN_PARTS = [
  { cls: 'coat', svg: () => KAIBA_COAT_SVG, x: 0, y: 112, sx: '0px', sy: '70vh', at: 850, r: 0, tag: 'Kaiba\'s coat', tx: 0, ty: 150 },
  { cls: 'hair', svg: () => FRANKEN_HAIR_SVG, x: 0, y: -74, sx: '0px', sy: '-70vh', at: 500, r: 0, tag: 'Yugi\'s hair', tx: 0, ty: -118 },
  { cls: 'bandana', svg: () => '<b>★</b>', x: 0, y: -38, sx: '-80vw', sy: '0px', at: 1200, r: -4, tag: 'Keith\'s bandana', tx: -100, ty: -40 },
  { cls: 'meye', svg: () => MILLENNIUM_EYE_SVG, x: -20, y: -6, sx: '-60vw', sy: '-40vh', at: 1550, r: 0, tag: 'Pegasus\'s eye', tx: -100, ty: 0 },
  { cls: 'glasses', svg: () => '<span class="ce-emoji">👓</span>', x: 0, y: -4, sx: '80vw', sy: '-20vh', at: 1900, r: 0, tag: 'Weevil\'s glasses', tx: 100, ty: -20 },
  { cls: 'fish', svg: () => '<span class="ce-emoji">🐟</span>', x: 66, y: 34, sx: '70vw', sy: '30vh', at: 2200, r: -30, tag: 'Mako\'s fish', tx: 100, ty: 40 }
];

const FRANKEN_SHOUTS = [
  ['Heart of the Cards!', -80, -178],
  ['Screw the rules!', 85, -152],
  ['Nyeh!', -105, -118],
  ['Hehehe!', 100, -98],
  ['In America!', -95, -58],
  ['Yugi-boy~ ♪', 95, -40],
  ['The sea!!', -95, 10],
  ['Hm. Pathetic.', 92, 28]
];

registerCharacterEgg('custom', {
  toast: 'IT\'S ALIVE! …and it has no idea what deck it\'s playing.',
  scene: () => {
    const part = p => `<span class="ce-fk-part ce-fk-${p.cls}" style="--x: ${p.x}px; --y: ${p.y}px; --sx: ${p.sx}; --sy: ${p.sy}; --at: ${p.at}ms; --r: ${p.r}deg;">${p.svg()}</span>`;
    const tags = FRANKEN_PARTS.map(p =>
      `<span class="ce-fk-tag" style="--x: ${p.tx}px; --y: ${p.ty}px; --at: ${p.at}ms;">+ ${p.tag}</span>`).join('');
    const [coat, ...parts] = FRANKEN_PARTS;
    return `
      <div class="ce-dim ce-dim--lab"></div>
      <div class="ce-flash ce-flash--lab"></div>
      <div class="ce-fk-rig">
        <span class="ce-fk-coil ce-fk-coil--l"></span>
        <span class="ce-fk-coil ce-fk-coil--r"></span>
        <span class="ce-fk-arc">${FRANKEN_ARC_SVG}</span>
        <div class="ce-fk-body">
          ${part(coat)}
          <span class="ce-fk-head">
            <i class="ce-fk-stitch"></i>
            <i class="ce-fk-eye ce-fk-eye--l"></i>
            <i class="ce-fk-eye ce-fk-eye--r"></i>
            <i class="ce-fk-mouth"></i>
            <i class="ce-fk-neckbolt ce-fk-neckbolt--l"></i>
            <i class="ce-fk-neckbolt ce-fk-neckbolt--r"></i>
          </span>
          ${parts.map(part).join('')}
          ${tags}
        </div>
        <span class="ce-fk-zap ce-fk-zap--l ce-emoji">⚡</span>
        <span class="ce-fk-zap ce-fk-zap--r ce-emoji">⚡</span>
        <span class="ce-fk-alive">IT'S ALIVE!</span>
        ${FRANKEN_SHOUTS.map(([text, x, y], i) =>
          `<span class="ce-bubble ce-fk-say" style="--i: ${i}; --x: ${x}px; --y: ${y}px;">${text}</span>`).join('')}
      </div>`;
  }
});

// --- Yugi (Duelist Kingdom): Magical Hats mini-game ----------------------------
// See magical-hats-easter-egg.js.
registerCharacterEgg('yugi-dk', {
  run: () => openMagicalHats()
});

// --- Yugi (Battle City): the Magnet Warriors assemble (badly) --------------------
// α, β and γ fly in, slam together with the same poles and get flung off
// screen, Beta flips around, they finally stack into Valkyrion... who then
// attracts every bit of metal junk in the area and sags under it.
const MAGNET_WARRIORS = [['a', 'α', 'Alpha'], ['b', 'β', 'Beta'], ['g', 'γ', 'Gamma']];
const MAGNET_JUNK = ['🔑', '🥄', '📎', '🍴', '🥫', '🔧', '✂️', '🔔', '🔩', '🧷', '📌', '⚙️', '🍳', '🪙', '🧲'];

registerCharacterEgg('yugi-bc', {
  toast: 'Valkyrion the Magna Warrior. Also a world-class fridge magnet. 🧲',
  toastSmall: 'Some assembly required.',
  scene: ctx => {
    const far = Math.max(ctx.vw, ctx.vh);
    const junk = [...[...MAGNET_JUNK].sort(() => Math.random() - 0.5), '🛒'].map((item, i, list) => {
      const angle = ceRand(0, Math.PI * 2);
      const last = i === list.length - 1;
      return `<span class="ce-junk ce-emoji${last ? ' ce-junk--big' : ''}" style="--i: ${i}; --sx: ${(Math.cos(angle) * far).toFixed(0)}px; --sy: ${(Math.sin(angle) * far).toFixed(0)}px; --ex: ${(last ? 0 : ceRand(-52, 52)).toFixed(0)}px; --ey: ${(last ? 8 : ceRand(-70, 70)).toFixed(0)}px; --r: ${ceRand(-60, 60).toFixed(0)}deg;">${item}</span>`;
    }).join('');
    return `
      <div class="ce-dim ce-dim--magnet"></div>
      <div class="ce-flash ce-flash--magnet"></div>
      <div class="ce-mw-rig">
        <span class="ce-mw-field"></span>
        ${MAGNET_WARRIORS.map(([key, letter, name]) => `
          <div class="ce-mw ce-mw--${key}"><div class="ce-mw-body"><b>${letter}</b><i>${name}</i></div></div>`).join('')}
        <span class="ce-mw-arm ce-mw-arm--sword ce-emoji">🗡️</span>
        <span class="ce-mw-arm ce-mw-arm--shield ce-emoji">🛡️</span>
        ${junk}
        <span class="ce-mw-label ce-mw-boink">BOINK!<small>N ⇄ N</small></span>
        <span class="ce-mw-label ce-mw-flip">🔄 flip!</span>
        <span class="ce-mw-label ce-mw-title">MAGNA WARRIOR VALKYRION!</span>
      </div>`;
  }
});

// --- Kaiba (Duelist Kingdom): Blue-Eyes Ultimate Dragon, three heads, no plan --
// Three Blue-Eyes fly in from different sides and fuse on the card. The new
// three-headed dragon roars... then the heads disagree about which way to go,
// spin around each other and tie their necks in a knot.
// KAIBA_COAT_SVG stays: the Custom egg's Frankenstein wears it.
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

// [side, flies in from x, y, speech bubble, neck joint x, y in the 260×200 rig]
const ULTIMATE_HEADS = [
  ['l', '-70vw', '-10vh', 'This way!', 58, 72],
  ['m', '0px', '-70vh', 'No — UP!', 130, 34],
  ['r', '70vw', '10vh', 'THAT way!', 202, 72]
];

// One Blue-Eyes head in profile, facing left. The neck joins at (88, 44),
// which is where the CSS transform-origin sits (88% 63%). The jaw hinges open.
const BUD_HEAD_SVG = `
  <svg viewBox="0 0 100 70" aria-hidden="true">
    <g stroke="#1e3a8a" stroke-width="1.6" stroke-linejoin="round">
      <path d="M66 24 L99 3 L76 31 Z" fill="#bfdbfe"/>
      <path d="M72 33 L100 24 L78 40 Z" fill="#93c5fd"/>
      <g class="ce-bu-jaw">
        <path d="M86 50 C72 58 48 58 26 53 L8 47 L24 45 L56 47 Z" fill="#dbeafe"/>
        <path d="M14 47 l3 -4 l3 4 M26 48 l3 -4 l3 4 M38 49 l3 -4 l3 4" fill="#fff" stroke-width="0.8"/>
      </g>
      <path d="M90 46 C90 28 78 18 62 20 L40 24 L20 29 Q6 32 3 39 Q4 44 10 45 L30 45 L56 46 Q74 48 90 46 Z" fill="#f8fafc"/>
      <path d="M12 45 l3 4 l3 -4 M24 45 l3 4 l3 -4 M36 45 l3 4 l3 -4 M48 46 l3 4 l3 -4" fill="#fff" stroke-width="0.8"/>
      <path d="M22 29 L26 21 L30 27 Z M34 26 L39 17 L43 24 Z M47 23 L53 13 L57 21 Z" fill="#bfdbfe"/>
      <path d="M46 30 L64 25 L71 30 L56 33 Z" fill="#cbd5e1"/>
    </g>
    <path d="M58 40 Q72 37 86 42" fill="none" stroke="#60a5fa" stroke-width="3" stroke-linecap="round"/>
    <path d="M14 38 Q30 36 44 38" fill="none" stroke="#93c5fd" stroke-width="2" stroke-linecap="round"/>
    <ellipse class="ce-bu-eye" cx="60" cy="34" rx="5.5" ry="2.6" fill="#38bdf8"/>
    <ellipse cx="61.5" cy="33.4" rx="1.6" ry="1.1" fill="#fff"/>
    <circle cx="9" cy="37" r="1.3" fill="#1e3a8a"/>
  </svg>`;

// Left wing; the right one is the same group mirrored. Flaps from the shoulder.
const BUD_WING = `
  <g class="ce-bu-wing">
    <path d="M112 120 L64 62 L22 24 Q26 52 6 68 Q30 76 18 100 Q42 102 46 124 Q80 112 112 120 Z" fill="#bfdbfe" fill-opacity="0.8" stroke="#1e3a8a" stroke-width="2" stroke-linejoin="round"/>
    <path d="M112 120 L64 62 L22 24 M64 62 L6 68 M64 62 L18 100 M64 62 L46 124" fill="none" stroke="#f8fafc" stroke-width="3.5" stroke-linecap="round"/>
    <path d="M22 24 L16 12 L28 20 Z" fill="#f8fafc" stroke="#1e3a8a" stroke-width="1.2" stroke-linejoin="round"/>
  </g>`;

const BUD_BODY_SVG = `
  <svg viewBox="0 0 260 200" aria-hidden="true">
    <g fill="none" stroke-linecap="round">
      <path d="M152 182 Q206 200 228 172 Q244 150 224 142" stroke="#1e3a8a" stroke-width="13"/>
      <path d="M152 182 Q206 200 228 172 Q244 150 224 142" stroke="#f8fafc" stroke-width="8.5"/>
    </g>
    <path d="M224 142 L212 130 L230 136 Z" fill="#bfdbfe" stroke="#1e3a8a" stroke-width="1.5" stroke-linejoin="round"/>
    ${BUD_WING}
    <g transform="translate(260 0) scale(-1 1)">${BUD_WING}</g>
    <g stroke="#1e3a8a" stroke-width="2.2" stroke-linejoin="round">
      <path d="M94 176 Q80 190 86 198 L106 198 Q106 186 102 178 Z" fill="#e0f2fe"/>
      <path d="M166 176 Q180 190 174 198 L154 198 Q154 186 158 178 Z" fill="#e0f2fe"/>
      <path d="M92 170 Q88 128 130 122 Q172 128 168 170 Q160 194 130 194 Q100 194 92 170 Z" fill="#f8fafc"/>
    </g>
    <path d="M112 140 Q130 146 148 140 M108 154 Q130 161 152 154 M108 168 Q130 175 152 168 M114 181 Q130 187 146 181" fill="none" stroke="#93c5fd" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M86 198 l-3 -5 M92 198 l-1 -6 M174 198 l3 -5 M168 198 l1 -6" stroke="#1e3a8a" stroke-width="2" stroke-linecap="round"/>
  </svg>`;

// Three thick, segmented necks. The "knot" version ties them together.
const ultimateNecks = paths => `
  <svg viewBox="0 0 260 200" aria-hidden="true">
    <g fill="none" stroke-linecap="round">
      ${paths.map(d => `<path d="${d}" stroke="#1e3a8a" stroke-width="20"/>`).join('')}
      ${paths.map(d => `<path d="${d}" stroke="#f8fafc" stroke-width="15.5"/>`).join('')}
      ${paths.map(d => `<path d="${d}" stroke="#bfdbfe" stroke-width="6" stroke-dasharray="5 4"/>`).join('')}
    </g>
  </svg>`;
const ULTIMATE_NECKS = ultimateNecks([
  'M114 134 Q78 120 58 72',
  'M130 128 Q122 80 130 34',
  'M146 134 Q182 120 202 72'
]);
const ULTIMATE_KNOT = ultimateNecks([
  'M114 134 C170 126 168 80 120 100 S88 112 108 88',
  'M130 128 C80 116 84 66 136 86 S142 72 130 64',
  'M146 134 C88 128 96 80 142 100 S170 104 152 88'
]);

registerCharacterEgg('kaiba-dk', {
  toast: 'Blue-Eyes Ultimate Dragon: three heads, zero teamwork. 🐉🐉🐉',
  toastSmall: '…Kaiba is not amused.',
  scene: () => `
    <div class="ce-dim ce-dim--blue"></div>
    <span class="ce-at ce-bu-vortex"></span>
    <div class="ce-flash ce-flash--ultimate"></div>
    ${ULTIMATE_HEADS.map(([side, sx, sy], i) => `
      <div class="ce-at ce-bu-in" style="--i: ${i}; --sx: ${sx}; --sy: ${sy};"><span class="ce-bu-in-head${side === 'r' ? ' ce-bu-flip' : ''}">${BUD_HEAD_SVG}</span></div>`).join('')}
    <div class="ce-at ce-bu-rig">
      <span class="ce-bu-layer">${BUD_BODY_SVG}</span>
      <span class="ce-bu-layer ce-bu-necks--straight">${ULTIMATE_NECKS}</span>
      <span class="ce-bu-layer ce-bu-necks--knot">${ULTIMATE_KNOT}</span>
      <div class="ce-bu-heads">
        ${ULTIMATE_HEADS.map(([side, , , , x, y]) => `
          <span class="ce-bu-head ce-bu-head--${side}" style="left: ${x}px; top: ${y}px;"><span class="ce-bu-face">${BUD_HEAD_SVG}</span></span>`).join('')}
      </div>
      ${ULTIMATE_HEADS.map(([side, , , say]) => `<span class="ce-bubble ce-bu-say ce-bu-say--${side}">${say}</span>`).join('')}
      <span class="ce-bu-dizzy ce-emoji">💫</span>
    </div>
    <div class="ce-at ce-bu-title">BLUE-EYES<br>ULTIMATE DRAGON!</div>`
});

// --- Kaiba (Battle City): Obelisk the Tormentor flattens the card -----------------
// A shadow grows over the card, Obelisk's giant fist slams down and squashes
// it pancake-flat. A tiny white flag waves, then the card boings back up, dazed.
registerCharacterEgg('kaiba-bc', {
  toast: 'Obelisk the Tormentor says hi. 👊',
  toastSmall: 'Respectfully: ow.',
  scene: () => `
    <div class="ce-dim ce-dim--obelisk"></div>
    <div class="ce-flash ce-flash--obelisk"></div>
    <span class="ce-at ce-ob-shadow"></span>
    <div class="ce-at ce-ob-fist"><span class="ce-emoji">👊</span></div>
    <div class="ce-at ce-ob-slam">SLAM!</div>
    ${[-1, 1].map(dir => ceRange(3, i => `<span class="ce-at ce-ob-dust ce-emoji" style="--dx: ${dir * (50 + i * 38)}px; --dy: ${-i * 14}px; --i: ${i}; --flip: ${dir};">💨</span>`)).join('')}
    <span class="ce-at ce-ob-flag ce-emoji">🏳️</span>
    <span class="ce-at ce-ob-stars ce-emoji">💫</span>
    <div class="ce-at ce-ob-title">OBELISK THE TORMENTOR</div>`
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
