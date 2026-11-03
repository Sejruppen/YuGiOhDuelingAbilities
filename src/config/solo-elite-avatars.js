// Solo elites: anime-style bust portraits (head and shoulders), shown instead of their
// emoji in the duel intro and on the enemy board. Flat fills only (no ids), so the same
// portrait can appear twice on one screen. viewBox 0 0 100 100.

const SEA_INK = '#1a1426';
const SEA_SKIN = '#f6d3b3';
const SEA_SHOULDERS = 'M12 100 C13 82 28 72 50 72 C72 72 87 82 88 100 Z';
const SEA_NECK = 'M44 54 L44 74 L56 74 L56 54 Z';

const seaSvg = body => `<svg viewBox="0 0 100 100" aria-hidden="true" overflow="visible"><g stroke="${SEA_INK}" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round">${body}</g></svg>`;
const seaHead = (skin = SEA_SKIN) => `
  <ellipse cx="34.5" cy="45" rx="3" ry="4.5" fill="${skin}"/>
  <ellipse cx="65.5" cy="45" rx="3" ry="4.5" fill="${skin}"/>
  <ellipse cx="50" cy="42" rx="16" ry="19" fill="${skin}"/>`;

// The two brothers share one drawing; only the colour and forehead kanji differ.
const seaParadoxBrother = (x, coat, kanji) => `
  <g transform="translate(${x} 26) scale(0.74)">
    <path d="${SEA_SHOULDERS}" fill="${coat}"/>
    <path d="M38 75 L35 100 M62 75 L65 100" stroke="#f8fafc" stroke-width="3.5" fill="none"/>
    <path d="${SEA_NECK}" fill="${SEA_SKIN}"/>
    <path d="M41 64 L59 64 L60 76 L40 76 Z" fill="#111827"/>
    ${seaHead()}
    <path d="M40 26 Q46 23 52 24" stroke="#ffffff" stroke-width="2" fill="none" opacity="0.7"/>
    <text x="50" y="37" font-size="10" font-weight="900" text-anchor="middle" fill="${SEA_INK}" stroke="none">${kanji}</text>
    <path d="M38 41 L47 42.5 M62 41 L53 42.5" stroke-width="3.4" fill="none"/>
    <circle cx="43.5" cy="46" r="1.8" fill="${SEA_INK}"/>
    <circle cx="56.5" cy="46" r="1.8" fill="${SEA_INK}"/>
    <path d="M49 48 L48 51 L51 51" fill="none"/>
    <path d="M44 55 Q50 52.5 56 55" fill="none"/>
  </g>`;

const SOLO_ELITE_AVATARS = {
  // Teal bowl cut, magnifying yellow glasses joined by an insect horn, green raised-collar jacket, red bow tie.
  weevil: seaSvg(`
    <path d="${SEA_SHOULDERS}" fill="#2f8f4e"/>
    <path d="M42 72 L50 90 L58 72 Z" fill="#f8fafc"/>
    <path d="${SEA_NECK}" fill="${SEA_SKIN}"/>
    <path d="M40 76 L33 56 L45 68 Z M60 76 L67 56 L55 68 Z" fill="#22713c"/>
    <path d="M43 73 L50 76.5 L43 80 Z M57 73 L50 76.5 L57 80 Z" fill="#dc2626"/>
    <circle cx="50" cy="76.5" r="1.8" fill="#b91c1c"/>
    ${seaHead()}
    <path d="M32 48 C29 26 39 18 50 18 C61 18 71 26 68 48 L64.5 48 L64 37 L59 39 L55 36 L50 39 L45 36 L41 39 L36 37 L35.5 48 Z" fill="#2dd4bf"/>
    <path d="M40 25 Q47 21 55 22" stroke="#99f6e4" stroke-width="2" fill="none"/>
    <circle cx="42.5" cy="46" r="7" fill="#fde047" fill-opacity="0.6" stroke="#a16207" stroke-width="2"/>
    <circle cx="57.5" cy="46" r="7" fill="#fde047" fill-opacity="0.6" stroke="#a16207" stroke-width="2"/>
    <circle cx="42.5" cy="46" r="3" fill="#2563eb" stroke="none"/>
    <circle cx="57.5" cy="46" r="3" fill="#2563eb" stroke="none"/>
    <circle cx="41.5" cy="45" r="1" fill="#ffffff" stroke="none"/>
    <circle cx="56.5" cy="45" r="1" fill="#ffffff" stroke="none"/>
    <path d="M49.5 45.5 L50.5 45.5 M50 45.5 L50 40 Q51 37 54 36" stroke="#a16207" stroke-width="1.8" fill="none"/>
    <path d="M42 54 Q50 61 58 53 Q50 57 42 54 Z" fill="#7f1d1d"/>
  `),
  // Long wavy blonde hair, violet eyes and lipstick, purple vest over a white top.
  mai: seaSvg(`
    <path d="${SEA_SHOULDERS}" fill="#7e22ce"/>
    <path d="M41 72 L50 96 L59 72 Z" fill="#f8fafc"/>
    <path d="M31 40 C26 20 40 14 51 15 C65 16 76 26 71 42 C75 54 72 66 80 80 C72 84 66 78 63 70 L37 70 C34 78 28 84 20 80 C28 66 25 54 31 40 Z" fill="#facc15"/>
    <path d="${SEA_NECK}" fill="${SEA_SKIN}"/>
    ${seaHead()}
    <path d="M33 44 C31 25 45 18 56 20 C67 22 70 32 68 44 C64 34 58 30 52 29 C46 34 40 38 33 44 Z" fill="#facc15"/>
    <path d="M44 24 Q52 20 60 24" stroke="#fef08a" stroke-width="2" fill="none"/>
    <path d="M38.5 42.5 Q43 39.5 47.5 42.5 M61.5 42.5 Q57 39.5 52.5 42.5" stroke-width="2" fill="none"/>
    <ellipse cx="43" cy="45.5" rx="2.6" ry="2.2" fill="#7c3aed"/>
    <ellipse cx="57" cy="45.5" rx="2.6" ry="2.2" fill="#7c3aed"/>
    <circle cx="42.2" cy="44.8" r="0.8" fill="#ffffff" stroke="none"/>
    <circle cx="56.2" cy="44.8" r="0.8" fill="#ffffff" stroke="none"/>
    <path d="M45 54 Q50 57.5 55 54 Q50 55.5 45 54 Z" fill="#be185d"/>
    <circle cx="34.5" cy="51.5" r="1.8" fill="#f59e0b"/>
    <circle cx="65.5" cy="51.5" r="1.8" fill="#f59e0b"/>
  `),
  // Red beanie over long brown hair with a purple lock, green jacket under a beige one, toothy grin.
  rex: seaSvg(`
    <path d="${SEA_SHOULDERS}" fill="#d6c08f"/>
    <path d="M39 72 L50 94 L61 72 Z" fill="#15803d"/>
    <path d="M32 38 L27 64 L35 58 L33 68 L42 58 L58 58 L67 68 L65 58 L73 64 L68 38 Z" fill="#7c2d12"/>
    <path d="${SEA_NECK}" fill="${SEA_SKIN}"/>
    ${seaHead()}
    <path d="M32 37 C32 19 42 15 50 15 C58 15 68 19 68 37 Z" fill="#dc2626"/>
    <path d="M31 33 L69 33 L69 39 L31 39 Z" fill="#b91c1c"/>
    <path d="M40 18 Q46 16 52 17" stroke="#fca5a5" stroke-width="2" fill="none"/>
    <path d="M47 39 C45 45 47 49 42 52 C49 50 51 45 51 39 Z" fill="#7c3aed"/>
    <path d="M37 41 L47 44 M63 41 L53 44" stroke-width="2.4" fill="none"/>
    <ellipse cx="43" cy="46.5" rx="2.2" ry="2" fill="#4338ca"/>
    <ellipse cx="57" cy="46.5" rx="2.2" ry="2" fill="#4338ca"/>
    <path d="M41 53 L59 53 Q50 61 41 53 Z" fill="#ffffff"/>
    <path d="M44 53 L45.5 56 L47 53" fill="#ffffff"/>
  `),
  // Deathly pale boy with short spiky purple hair, tired eyes and a hoodie.
  bonz: seaSvg(`
    <path d="M28 72 C23 42 34 22 50 22 C66 22 77 42 72 72 Z" fill="#3b3550"/>
    <path d="${SEA_SHOULDERS}" fill="#4b4560"/>
    <path d="M45 74 L44 88 M55 74 L56 88" stroke="#d1d5db" stroke-width="1.4" fill="none"/>
    <path d="${SEA_NECK}" fill="#dfe7dc"/>
    ${seaHead('#dfe7dc')}
    <path d="M33 41 L29 31 L37 33 L35 23 L43 28 L48 17 L53 27 L60 20 L61 29 L70 27 L67 41 C60 34 40 34 33 41 Z" fill="#7e57c2"/>
    <ellipse cx="43" cy="48.5" rx="4.5" ry="3" fill="#9ca3c4" opacity="0.6" stroke="none"/>
    <ellipse cx="57" cy="48.5" rx="4.5" ry="3" fill="#9ca3c4" opacity="0.6" stroke="none"/>
    <circle cx="43" cy="45" r="3.3" fill="#ffffff"/>
    <circle cx="57" cy="45" r="3.3" fill="#ffffff"/>
    <circle cx="43" cy="45" r="1.3" fill="${SEA_INK}" stroke="none"/>
    <circle cx="57" cy="45" r="1.3" fill="${SEA_INK}" stroke="none"/>
    <path d="M44 55 Q46.5 53 49 55 Q51.5 57 54 55 Q55 54 56 55" fill="none"/>
  `),
  // Big blond American: flag bandana, dark shades, stubble, black vest over a white tank top.
  keith: seaSvg(`
    <path d="M6 100 C8 80 26 70 50 70 C74 70 92 80 94 100 Z" fill="#1f2937"/>
    <path d="M38 71 L40 100 L60 100 L62 71 Z" fill="#f1f5f9"/>
    <path d="M42 54 L41 74 L59 74 L58 54 Z" fill="#eec29b"/>
    ${seaHead('#eec29b')}
    <path d="M36 50 Q38 62 50 63 Q62 62 64 50 Q58 58 50 58 Q42 58 36 50 Z" fill="#a16207" opacity="0.35" stroke="none"/>
    <path d="M33 44 C29 30 36 19 50 18 C64 19 71 30 67 44 L65 52 L62 40 L38 40 L35 52 Z" fill="#fbbf24"/>
    <path d="M32 29 C40 24 60 24 68 29 L68 36 C60 31 40 31 32 36 Z" fill="#1d4ed8"/>
    <circle cx="39" cy="30" r="0.9" fill="#ffffff" stroke="none"/>
    <circle cx="45" cy="28.5" r="0.9" fill="#ffffff" stroke="none"/>
    <circle cx="51" cy="28.2" r="0.9" fill="#ffffff" stroke="none"/>
    <circle cx="57" cy="28.5" r="0.9" fill="#ffffff" stroke="none"/>
    <circle cx="63" cy="30" r="0.9" fill="#ffffff" stroke="none"/>
    <path d="M67 31 L78 27 L76 35 Z" fill="#dc2626"/>
    <path d="M68 33 L77 30 M68 34.5 L76.5 32.5" stroke="#ffffff" stroke-width="1" fill="none"/>
    <path d="M36 42 L48 42 L48 46 Q42 50 36 46 Z M52 42 L64 42 L64 46 Q58 50 52 46 Z" fill="#0f172a"/>
    <path d="M48 43 L52 43" fill="none"/>
    <path d="M39 44 L42 43 M55 44 L58 43" stroke="#ffffff" stroke-width="1" fill="none" opacity="0.8"/>
    <path d="M44 54 Q50 56 57 52" fill="none"/>
  `),
  // The bald twins side by side: Dox (green, 宮) behind, Para (orange, 迷) in front.
  paradox: seaSvg(`
    ${seaParadoxBrother(31, '#16a34a', '宮')}
    ${seaParadoxBrother(-5, '#f97316', '迷')}
  `)
};
