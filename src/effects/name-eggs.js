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

const NAME_EGGS = {
  // Theotaur (Dark Paladin's Legion): Ultimate Magical Fusion with a bull.
  THEODOR: {
    id: 'name-theodor',
    ms: 12000,
    title: 'The Master\'s Apprentice approaches.',
    msg: 'Ah… the Theotaur. Half boy, half bull, all Dark Paladin.',
    html: () => `
      <div class="tg-part tg-part--hat ce-at"><span class="ce-emoji">🧙</span><small>Dark Magician</small></div>
      <div class="tg-part tg-part--sword ce-at"><span class="ce-emoji">🗡️</span><small>Buster Blader</small></div>
      <div class="tg-part tg-part--bull ce-at"><span class="ce-emoji">🐂</span><small>…a bull?!</small></div>
      <div class="tg-banner ce-at">Ultimate Magical Fusion!</div>
      <div class="tg-swirl ce-at"></div>
      <div class="tg-flash"></div>
      <div class="ng-card tg-card ce-at">
        <div class="ng-card-name">Dark Moo-ladin</div>
        <div class="ng-card-stars">★★★★★★★★</div>
        <div class="ng-card-art"><span class="ce-emoji">🐂</span><span class="tg-hat"></span><span class="ce-emoji tg-blade">🗡️</span></div>
        <div class="ng-card-text"><b>[Beast-Warrior / Fusion]</b><br>"Dark Magician" + "Buster Blader" + 1 bull. Negates 1 Spell card. Then eats grass.</div>
        <div class="ng-card-stats">ATK/2900 DEF/MOO</div>
      </div>
      <div class="tg-moo ce-at">MOOO.</div>
      ${ngToast(5200, 'Theotaur\'s Ultimate Magical Fusion!', 'Dark Moo-ladin: 2900 ATK of pure Theodor.')}`
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
