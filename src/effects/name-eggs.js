// Family names on the Pharaoh's stone keyboard (true-name-egg.js). Spelling
// one of these in the cartouche skips "Speak" and plays that person's scene
// over the tomb. Tap anywhere to close once it has had time to land.
// Sounds: 'name-*' in sounds.js; styles: "Family names" in effects.css.
const NAME_EGG_CLOSABLE_MS = 2500;

const FRIDA_SVG = `
  <svg viewBox="0 0 120 200" aria-hidden="true">
    <g class="fr-cackle">
      <path d="M34 92 L22 48 L50 80 Z M86 92 L98 48 L70 80 Z" fill="#1f0a2e" stroke="#6d28d9" stroke-width="1.5"/>
      <path d="M60 84 C40 90 34 110 30 140 L18 198 L102 198 L90 140 C86 110 80 90 60 84 Z" fill="#14051f"/>
      <path d="M60 92 L44 198 L76 198 Z" fill="#3b0764" opacity=".7"/>
      <path d="M38 110 C30 130 28 140 36 146 L44 122 Z" fill="#14051f"/>
      <path d="M82 108 C92 100 98 96 102 92 L104 100 C98 108 92 116 84 124 Z" fill="#14051f"/>
      <ellipse cx="60" cy="70" rx="15" ry="17" fill="#e8f5dc"/>
      <path d="M44 66 C44 48 76 48 76 66 C72 58 48 58 44 66 Z" fill="#0b0310"/>
      <path d="M46 58 C36 50 34 34 42 22 C44 34 48 44 54 52 Z" fill="#0b0310"/>
      <path d="M74 58 C84 50 86 34 78 22 C76 34 72 44 66 52 Z" fill="#0b0310"/>
      <path d="M44 62 C42 74 44 84 50 88 L46 70 Z M76 62 C78 74 76 84 70 88 L74 70 Z" fill="#0b0310"/>
      <path d="M50 64 L58 67 M70 64 L62 67" stroke="#111" stroke-width="1.8" stroke-linecap="round"/>
      <ellipse cx="54.5" cy="70" rx="3" ry="1.6" fill="#bef264"/>
      <ellipse cx="65.5" cy="70" rx="3" ry="1.6" fill="#bef264"/>
      <path d="M54 78 Q60 83 66 78 Q60 80.5 54 78 Z" fill="#dc2626"/>
      <ellipse cx="28" cy="88" rx="7" ry="5" fill="#000"/>
      <circle cx="23" cy="82" r="3.6" fill="#000"/>
      <path d="M20 81 L14.5 82.5 L20 83.5 Z M34 90 L41 94 L33 92.5 Z" fill="#000"/>
      <circle cx="22.4" cy="81.4" r=".9" fill="#fde047"/>
    </g>
    <g class="fr-staff">
      <path d="M104 92 L110 198" stroke="#1c1917" stroke-width="4" stroke-linecap="round"/>
      <path d="M104 94 C96 88 97 76 102 71 M104 94 C112 88 111 76 106 71" stroke="#1c1917" stroke-width="3" fill="none"/>
      <circle class="fr-orb" cx="104" cy="80" r="12" fill="#4ade80" opacity=".35"/>
      <circle class="fr-orb" cx="104" cy="80" r="7" fill="#bbf7d0"/>
    </g>
  </svg>`;

const ngToast = (delayMs, title, small) =>
  `<div class="cegg-toast atn-gtoast" style="--td: ${delayMs}ms">${title}<small>${small}</small></div>`;

// --- THEODOR: the Dark Paladin ---------------------------------------------------
// Dark teal armour with gold trim and green gems, a tall horned helmet, a
// pale face with long grey hair, huge spiked pauldrons and the crescent-bladed
// staff in his left hand. .dp-staff turns around the hand (60, 170).
const DARK_PALADIN_SVG = `
  <svg class="dp-svg" viewBox="0 0 200 300" aria-hidden="true">
    <defs>
      <linearGradient id="dp-g-armor" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#2f5b80" /><stop offset="0.5" stop-color="#16304d" /><stop offset="1" stop-color="#0a1828" />
      </linearGradient>
      <linearGradient id="dp-g-gold" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#fde68a" /><stop offset="0.5" stop-color="#e8a33d" /><stop offset="1" stop-color="#9a5b12" />
      </linearGradient>
      <linearGradient id="dp-g-blade" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#334155" /><stop offset="0.45" stop-color="#f8fafc" /><stop offset="1" stop-color="#64748b" />
      </linearGradient>
      <radialGradient id="dp-g-gem" cx="0.35" cy="0.35" r="0.7">
        <stop offset="0" stop-color="#ccfbf1" /><stop offset="0.45" stop-color="#14b8a6" /><stop offset="1" stop-color="#064e3b" />
      </radialGradient>
    </defs>
    <g class="dp-body" stroke-linejoin="round">
      <path d="M84 168 L74 296 L103 296 L106 214 L109 296 L140 296 L128 168 Z" fill="url(#dp-g-armor)" />
      <path d="M84 168 L74 296 M128 168 L140 296 M92 172 L106 252 L120 172" fill="none" stroke="url(#dp-g-gold)" stroke-width="2.6" />
      <path d="M128 112 Q148 140 145 200 L132 202 Q132 152 121 124 Z" fill="url(#dp-g-armor)" />
      <path d="M131 176 L147 174 L149 190 L130 192 Z" fill="url(#dp-g-gold)" />
      <path d="M147 182 L180 148 L151 194 Z" fill="url(#dp-g-gold)" />
      <circle cx="139" cy="207" r="7" fill="#0a1828" stroke="url(#dp-g-gold)" stroke-width="1.5" />
      <path d="M80 108 Q106 99 132 108 L128 170 L84 170 Z" fill="url(#dp-g-armor)" />
      <path d="M84 120 Q106 140 128 120 M90 128 L106 152 L122 128" fill="none" stroke="url(#dp-g-gold)" stroke-width="3" />
      <rect x="83" y="163" width="46" height="8" rx="2" fill="url(#dp-g-gold)" />
      <circle cx="106" cy="150" r="5" fill="url(#dp-g-gem)" stroke="url(#dp-g-gold)" stroke-width="1.5" />
      <circle cx="106" cy="167" r="4.5" fill="url(#dp-g-gem)" />
      <path d="M86 110 Q64 130 57 166 L70 170 Q74 142 95 124 Z" fill="url(#dp-g-armor)" />
      <path d="M55 150 L72 152 L70 164 L53 162 Z" fill="url(#dp-g-gold)" />
      <path d="M86 104 L38 90 L58 104 L28 112 L62 118 L48 132 L90 124 Z" fill="url(#dp-g-armor)" stroke="url(#dp-g-gold)" stroke-width="2.5" />
      <path d="M124 104 L188 80 L160 102 L194 104 L156 116 L172 132 L122 126 Z" fill="url(#dp-g-armor)" stroke="url(#dp-g-gold)" stroke-width="2.5" />
      <circle cx="64" cy="113" r="4" fill="url(#dp-g-gem)" />
      <circle cx="157" cy="109" r="4" fill="url(#dp-g-gem)" />
      <path d="M94 80 L89 114 L97 101 L100 116 L104 99 L109 116 L112 101 L119 114 L116 80 Z" fill="#cbd5e1" />
      <path d="M95 76 Q105 72 115 76 L114 96 Q105 104 96 96 Z" fill="#8fbcc4" />
      <path class="dp-eyes" d="M98 86 L103 87.5 M107 87.5 L112 86" stroke="#ccfbf1" stroke-width="1.8" stroke-linecap="round" />
      <path d="M102 97 L108 97" stroke="#4b6b72" stroke-width="1.2" stroke-linecap="round" />
      <path d="M88 84 Q85 50 104 18 Q100 44 112 60 Q118 40 134 28 Q122 56 124 84 Q106 70 88 84 Z" fill="url(#dp-g-armor)" stroke="url(#dp-g-gold)" stroke-width="2.5" />
      <path d="M90 72 L98 65 L104 72 L110 63 L118 70 L122 65" fill="none" stroke="url(#dp-g-gold)" stroke-width="2.5" />
      <path d="M88 84 L85 105 L94 98 Z M124 84 L127 105 L118 98 Z" fill="url(#dp-g-armor)" stroke="url(#dp-g-gold)" stroke-width="2" />
      <circle cx="89" cy="84" r="3.5" fill="url(#dp-g-gem)" />
      <circle cx="123" cy="84" r="3.5" fill="url(#dp-g-gem)" />
      <circle cx="113" cy="47" r="3.5" fill="url(#dp-g-gem)" />
    </g>
    <g class="dp-staff" stroke-linejoin="round">
      <path d="M66 252 L51 50" stroke="#0f172a" stroke-width="6" stroke-linecap="round" />
      <path d="M66 252 L51 50" stroke="#475569" stroke-width="2" stroke-linecap="round" />
      <path class="dp-blade" d="M51 62 C28 30 32 -2 48 -34 C45 -2 58 24 78 40 C66 44 58 52 51 62 Z" fill="url(#dp-g-blade)" stroke="#0f172a" stroke-width="1.5" />
      <path d="M41 6 Q49 18 61 26 M40 28 Q48 38 60 44" fill="none" stroke="#334155" stroke-width="3" />
      <path d="M28 72 L52 62 L82 52 L73 64 L54 73 L33 82 Z" fill="url(#dp-g-gold)" />
      <path d="M36 100 L56 92 L78 85 L71 96 L56 102 Z" fill="url(#dp-g-gold)" />
      <circle cx="53" cy="67" r="5" fill="url(#dp-g-gem)" />
      <circle cx="57" cy="95" r="4" fill="url(#dp-g-gem)" />
      <path d="M66 250 Q74 262 62 270 Q67 258 60 255 Z" fill="url(#dp-g-gold)" />
      <circle cx="60" cy="170" r="8" fill="#0a1828" stroke="url(#dp-g-gold)" stroke-width="1.5" />
      <path class="dp-glint dp-glint--a" d="M48 -58 L53 -39 L72 -34 L53 -29 L48 -10 L43 -29 L24 -34 L43 -39 Z" fill="#fef9c3" />
      <path class="dp-glint dp-glint--b" d="M48 -58 L53 -39 L72 -34 L53 -29 L48 -10 L43 -29 L24 -34 L43 -39 Z" fill="#fef9c3" />
    </g>
  </svg>`;

// [name, emoji, colour filter]. A random handful swoops in each time.
const DP_DRAGONS = [
  ['Blue-Eyes White Dragon', '🐉', 'grayscale(1) brightness(1.9)'],
  ['Red-Eyes Black Dragon', '🐉', 'hue-rotate(240deg) saturate(2) brightness(0.7)'],
  ['Curse of Dragon', '🐲', 'hue-rotate(-60deg) saturate(1.4)'],
  ['Tri-Horned Dragon', '🐉', 'hue-rotate(160deg) saturate(1.3)'],
  ['Thousand Dragon', '🐲', 'sepia(1) saturate(0.7) brightness(1.1)'],
  ['Luster Dragon', '🐉', 'hue-rotate(60deg) saturate(1.6)'],
  ['Baby Dragon', '🐲', 'hue-rotate(-90deg) saturate(1.3)'],
  ['Harpie\'s Pet Dragon', '🐉', 'hue-rotate(-140deg) saturate(1.2)'],
  ['Twin-Headed Thunder Dragon', '🐉', 'hue-rotate(-50deg) saturate(2)'],
  ['Hyozanryu', '🐉', 'hue-rotate(80deg) saturate(0.4) brightness(1.5)'],
  ['Koumori Dragon', '🐲', 'hue-rotate(200deg) brightness(0.8)'],
  ['Crawling Dragon', '🐲', 'none']
];
// Where the dragons hover (x%, y%), around the knight rather than on him.
const DP_SLOTS = [[15, 17], [85, 15], [32, 7], [68, 8], [11, 40], [89, 38], [17, 64], [83, 62]];
const DP_DRAGON_AT = 3900;
const DP_DRAGON_GAP = 300;
const DP_BASE_ATK = 2900;
const DP_BOLTS = [
  '20,0 28,18 18,26 30,46 22,52 34,72',
  '78,0 70,16 82,28 68,44 76,50 64,70',
  '52,0 44,14 58,24 42,42 54,50 46,64'
].map((points, i) => `<svg class="dp-bolt" style="--t: ${900 + i * 1000}ms;" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><polyline points="${points}" /></svg>`);

const NAME_EGGS = {
  // Theotaur (Dark Paladin's Legion): the Dark Paladin himself comes for Theodor.
  // Lightning reveals him (0.9/1.9/2.9s), random dragons swoop in and pump his
  // ATK (+500 each, 3.9-6s), he charges up on their power (6.2s), DRAGON SLAYER
  // BLADE cuts three times (7-7.3s), the sky detonates and splits (7.6s) and he
  // knights "Sir Theodor" (9.5-11s).
  THEODOR: {
    id: 'name-theodor',
    ms: 14500,
    title: 'A knight approaches the tomb.',
    msg: 'Ah… Theodor. The Dark Paladin has been waiting for you.',
    html: () => {
      const dragons = DP_DRAGONS.slice().sort(() => Math.random() - 0.5).slice(0, DP_SLOTS.length);
      const sky = `
        <div class="dp-sky"></div>
        <div class="dp-moon ce-at"></div>
        ${dragons.map(([name, emoji, filter], i) => {
          const [x, y] = DP_SLOTS[i];
          return `<div class="dp-dragon ce-at" style="left: ${x}%; top: ${y}%; --sx: ${x < 50 ? -60 : 60}vw; --t: ${DP_DRAGON_AT + i * DP_DRAGON_GAP}ms;"><span class="ce-emoji" style="filter: ${filter};">${emoji}</span><small>${name}</small></div>`;
        }).join('')}`;
      const atk = ceRange(dragons.length + 1, i => `<b style="--t: ${DP_DRAGON_AT - 200 + i * DP_DRAGON_GAP}ms;">${DP_BASE_ATK + i * 500}</b>`);
      // Dragon power sucked into the blade during the charge.
      const motes = ceRange(22, i => {
        const a = ceRand(0, Math.PI * 2);
        const d = ceRand(30, 60);
        return `<span class="dp-mote ce-at" style="--mx: ${(Math.cos(a) * d).toFixed(1)}vw; --my: ${(Math.sin(a) * d).toFixed(1)}vh; --t: ${6150 + i * 30}ms;"></span>`;
      });
      const shards = ceRange(16, i => {
        const a = (i / 16) * Math.PI * 2 + ceRand(-0.2, 0.2);
        const d = ceRand(45, 80);
        return `<span class="dp-shard ce-at" style="--dx: ${(Math.cos(a) * d).toFixed(1)}vw; --dy: ${(Math.sin(a) * d).toFixed(1)}vh; --r: ${Math.round(ceRand(-540, 540))}deg; --s: ${ceRand(0.6, 1.4).toFixed(2)};"></span>`;
      });
      const slash = (cls, t, [x1, y1, x2, y2], from) =>
        `<svg class="dp-slash ${cls}" style="--t: ${t}ms; --from: ${from};" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" /></svg>`;
      return `
        <div class="dp-light"></div>
        <div class="dp-split dp-split--a">${sky}</div>
        <div class="dp-split dp-split--b">${sky}</div>
        ${[900, 1900, 2900].map((t, i) => `<div class="dp-flash" style="--t: ${t}ms;"></div>${DP_BOLTS[i]}`).join('')}
        <div class="dp-dark"></div>
        <div class="dp-rays ce-at"></div>
        <div class="dp-aura ce-at"></div>
        ${motes}
        <div class="dp-knight ce-at">${DARK_PALADIN_SVG}</div>
        <div class="dp-title ce-at">DARK PALADIN<small>Dragon-Slaying Spellsword</small></div>
        <div class="dp-atk ce-at"><span>ATK</span><div class="dp-atk-num">${atk}</div><small>+500 for every Dragon</small></div>
        <div class="dp-banner ce-at">DRAGON SLAYER BLADE!!</div>
        <div class="dp-flash" style="--t: 7000ms;"></div>
        <svg class="dp-arc" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d="M-8 8 Q58 14 108 92 Q46 34 -8 8 Z" /></svg>
        ${slash('dp-slash--1', 7000, [-2, 13.6, 102, 86.4], 'inset(0 100% 100% 0)')}
        ${slash('dp-slash--2', 7150, [102, 22, -2, 74], 'inset(0 0 100% 100%)')}
        ${slash('dp-slash--3', 7300, [-2, 47, 102, 53], 'inset(0 100% 0 0)')}
        <div class="dp-flash dp-flash--big" style="--t: 7600ms;"></div>
        ${ceRange(3, i => `<div class="dp-ring ce-at" style="--t: ${7600 + i * 140}ms;"></div>`)}
        ${shards}
        <div class="dp-slain ce-at">${dragons.length} Dragons slain</div>
        <div class="dp-arise ce-at">Arise, Sir Theodor<small>Knight of the Dark Paladin</small></div>
        ${ngToast(11800, 'Arise, Sir Theodor!', 'Dragon Slayer. Spell Breaker. Knight of the Dark Paladin.')}`;
    }
  },
  // Trizze (Legends Assembled): a travel-size Blue-Eyes from the Magical Hats.
  TRISTAN: {
    id: 'name-tristan',
    ms: 12000,
    title: 'The Legends assemble.',
    msg: 'Ah… Trizze. The legend comes to life!',
    html: () => `
      <div class="tr-hat tr-hat--a ce-at"><div class="tr-cone"></div></div>
      <div class="tr-hat tr-hat--b ce-at"><div class="tr-cone"></div></div>
      <div class="tr-hat tr-hat--c ce-at"><div class="tr-cone"></div></div>
      <div class="tr-dragon ce-at"><span class="tr-dragon-in ce-emoji">🐉</span></div>
      <div class="tr-label ce-at">Blue-Eyes White Dragon<small>ATK 3000 (travel size)</small></div>
      <div class="tr-say ce-at">Burst Stream of Destruction!<small>…pew.</small></div>
      <div class="tr-beam"></div>
      <div class="tr-card ce-at"><b>United We Stand</b><span>Equip Spell</span></div>
      <div class="tr-glow"></div>
      <div class="tr-banner ce-at">United We Stand!<small>+800 ATK. And then some.</small></div>
      ${ngToast(7000, 'Trizze: Legends Assembled.', 'Blue-Eyes White Dragon. Some assembly required.')}`
  },
  // A giant rhino charges straight through the tomb.
  OTTO: {
    id: 'name-otto',
    ms: 9500,
    title: 'The ground is shaking…',
    msg: 'Ah… Otto. Brace yourselves.',
    html: () => {
      // The rhino crosses the screen from x = 140% to -40% between 1400 and 2500ms.
      const passAt = x => Math.round(1400 + ((140 - x) / 180) * 1100);
      return `
        <div class="ot-lines"></div>
        <div class="ot-dust">${ceRange(11, i => {
          const x = 100 - i * 10;
          return `<span style="left: ${x}%; --d: ${passAt(x)}ms; --dx: ${ceRand(-40, -10).toFixed(0)}px;"></span>`;
        })}</div>
        <div class="ot-prints">${ceRange(9, i => {
          const x = 92 - i * 10.5;
          return `<span style="left: ${x}%; top: ${i % 2 ? 82 : 86}%; --d: ${passAt(x) + 80}ms;">🐾</span>`;
        })}</div>
        <div class="ot-shout ce-at">OTTO!<small>CHARGE!!!</small></div>
        <div class="ot-rhino ce-at"><span class="ce-emoji">🦏</span></div>
        <div class="ot-rhino ot-rhino--back ce-at"><span class="ce-emoji">🦏</span></div>
        ${ngToast(3800, 'OTTO the Rhino.', 'ATK: yes. DEF: also yes. Brakes: not included.')}`;
    }
  },
  // A small Maleficent rises from green fire and curses the tomb.
  FRIDA: {
    id: 'name-frida',
    ms: 12500,
    title: 'The torches burn green…',
    msg: 'Ah… Frida. Oh no.',
    html: () => `
      <div class="fr-gloom"></div>
      <div class="fr-vines"><svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <path pathLength="1" d="M0 100 C10 80 2 64 12 52 S6 30 16 16"/>
        <path pathLength="1" d="M100 100 C88 82 98 66 88 52 S96 30 84 14"/>
        <path pathLength="1" d="M20 100 C28 90 20 82 30 74"/>
        <path pathLength="1" d="M80 100 C72 90 80 82 70 74"/>
        <path pathLength="1" d="M0 30 C8 26 6 18 14 10"/>
        <path pathLength="1" d="M100 34 C92 28 96 20 86 10"/>
      </svg></div>
      <div class="fr-fire ce-at">${ceRange(9, i => `<span style="--x: ${(8 + i * 10.5).toFixed(0)}%; --w: ${ceRand(18, 30).toFixed(0)}%; --h: ${ceRand(55, 100).toFixed(0)}%; --d: ${ceRand(0, 300).toFixed(0)}ms;"></span>`)}</div>
      <div class="fr-girl ce-at">${FRIDA_SVG}</div>
      <div class="fr-bolt ce-at"><svg viewBox="0 0 20 100" preserveAspectRatio="none" aria-hidden="true"><path d="M14 100 L4 72 L13 64 L3 36 L12 29 L7 0"/></svg></div>
      <div class="fr-flash"></div>
      <div class="fr-say fr-say--1 ce-at">Who dares spell my name… without inviting me?</div>
      <div class="fr-say fr-say--2 ce-at">Then I curse this tomb!</div>
      <div class="fr-laugh ce-at">MWAHAHAHA!</div>
      <div class="fr-say fr-say--3 ce-at">…and NO ONE gets dessert. EVER!</div>
      <div class="fr-caw ce-at">Caw.</div>
      ${ngToast(7800, 'Frida, Mistress of All Evil.', 'Height: small. Evil: enormous.')}`
  },
  // The card of my heart.
  MARIE: {
    id: 'name-marie',
    ms: 14000,
    title: 'The Eye sees only her.',
    msg: 'Ah… Marie. The heart of the tomb.',
    html: () => `
      <div class="mr-wash"></div>
      <div class="mr-petals">${ceRange(22, () => `<span style="--x: ${ceRand(0, 100).toFixed(0)}%; --s: ${ceRand(10, 20).toFixed(0)}px; --t: ${ceRand(4500, 7500).toFixed(0)}ms; --d: ${ceRand(500, 5000).toFixed(0)}ms; --dx: ${ceRand(-60, 60).toFixed(0)}px; --r: ${ceRand(-540, 540).toFixed(0)}deg;"></span>`)}</div>
      <div class="mr-hearts">${ceRange(16, () => `<span style="--x: ${ceRand(4, 96).toFixed(0)}%; --s: ${ceRand(1, 2.2).toFixed(2)}rem; --t: ${ceRand(3500, 6000).toFixed(0)}ms; --d: ${ceRand(800, 5000).toFixed(0)}ms; --dx: ${ceRand(-50, 50).toFixed(0)}px;">♥</span>`)}</div>
      <div class="ng-card mr-card ce-at">
        <div class="ng-card-name">Marie</div>
        <div class="ng-card-stars">♥♥♥♥♥♥♥♥♥♥♥♥</div>
        <div class="ng-card-art"><span class="ce-emoji">💖</span></div>
        <div class="ng-card-text"><b>[Queen / Effect]</b><br>Cannot be destroyed, banished or replaced. Once per lifetime: the duelist who holds this card wins, no matter his LP.</div>
        <div class="ng-card-stats">ATK/∞ DEF/∞</div>
      </div>
      <div class="mr-sign ce-at">Mathias ♥ Marie</div>
      ${ngToast(5600, 'The heart of the cards?', 'No: the card of my heart. ♥')}`
  }
};

function revealNameEgg(name) {
  const egg = NAME_EGGS[name];
  const { overlay } = atnEgg;
  atnEgg.locked = true;
  markEggFound(egg.id);
  overlay.classList.add('is-guest', `is-guest--${name.toLowerCase()}`);
  overlay.querySelector('.atn-title').textContent = egg.title;
  overlay.querySelector('.atn-msg').innerHTML = `<b>${egg.msg}</b>`;
  overlay.querySelector('.atn-guest').innerHTML = egg.html();
  playSound({ name: egg.id });
  atnEgg.timer = setTimeout(() => {
    overlay.classList.add('is-closable');
    atnEgg.timer = setTimeout(closeTrueNameEgg, egg.ms - NAME_EGG_CLOSABLE_MS);
  }, NAME_EGG_CLOSABLE_MS);
}
