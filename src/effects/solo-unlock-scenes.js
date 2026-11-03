// Solo unlock scenes (rewards, not easter eggs). They play over the victory screen
// when a Millennium Item lights up on the Solo shelf, and replay when you hold it:
//   puzzle:     (Easy ×1) Yami Yugi in his Soul Room. The Eye of Wdjat flares, he
//               speaks, lifts the Puzzle off its chain, it breaks into seven
//               pieces and clicks back together in front of you. ~10.4s.
//   necklace:   (Easy ×2, opens Hard) Ishizu in a torch-lit tomb. Her Necklace
//               shows a vision of the harder road (Pegasus' castle, a crimson
//               road, crossed blades), then she gives it to you. ~11.4s.
//   scale:      (Hard ×1) Shadi on a desert night. The Scale weighs your heart
//               against the feather of Ma'at, wavers and balances. ~12.6s.
//   key:        (Hard ×2, opens Nightmare) Shadi before the sealed door to your
//               soul. His Key turns in the ankh keyhole, the door swings open on
//               the Nightmare road and the Key flies out to you. ~13.8s.
//   ring:       (Nightmare ×1) Yami Bakura among drifting trapped souls. The
//               Ring's five pointers swing, then all lock onto you. ~12.4s.
//   rod:        (Nightmare ×2) Marik Ishtar over Battle City at night. The Rod
//               tries to control your mind; your will shatters it. ~12.4s.
//   eye:        (Nightmare ×3, the Millennium theme) the finale. Pegasus loses
//               his last Life Points, fails to read your mind, breaks down (his
//               Toons burn, he mourns Cyndia), surrenders and gives you his Eye
//               while the other six Items circle it. Fade to black and a
//               thank-you card (s.outro) that stays until you tap. ~28.4s.
// Solo is one player, so every line is shown once, upright. Tap to skip; in the
// eye scene the first tap skips to the thank-you card (fading the score out).
// Under reduced motion a pill shows (and the eye scene's card, still).
// CSS: "SOLO UNLOCK SCENES" in effects.css (su-*, yp-*, ...); sounds 'su-<scene>'.
const SU_FADE_MS = 600;
const SU_SKIP_AFTER_MS = 600;
const SU_OUTRO_CLOSE_MS = 1500;

// Yami Yugi, facing you, in anime cel style (black outlines, flat shading): the
// star of black hair with a magenta rim, gold lightning bangs, sharp magenta eyes,
// the Eye of Wdjat on his forehead (yp-brow-eye), his choker, the school jacket
// worn as a cape and the Millennium Puzzle on its chain (yp-worn).
const YAMI_SVG = `
  <svg class="yp-yami-svg" viewBox="0 0 200 260" aria-hidden="true">
    <g stroke="#0b0b12" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round">
      <g transform="translate(0 8)">
        <polygon points="100,0 116,52 166,18 142,66 198,72 152,96 190,134 142,130 160,180 124,158 76,158 40,180 58,130 10,134 48,96 2,72 58,66 34,18 84,52" fill="#e0245e"/>
        <polygon points="100,0 116,52 166,18 142,66 198,72 152,96 190,134 142,130 160,180 124,158 76,158 40,180 58,130 10,134 48,96 2,72 58,66 34,18 84,52" fill="#0b0b12" stroke="none" transform="translate(100 96) scale(0.76) translate(-100 -96)"/>
      </g>

      <path d="M86 190 L68 164 L62 196 L78 206 Z M114 190 L132 164 L138 196 L122 206 Z" fill="#1e3a8a"/>
      <path d="M86 190 L71 171 L68 194 L78 201 Z M114 190 L129 171 L132 194 L122 201 Z" fill="#e2e8f0" stroke-width="1.2"/>
      <path d="M60 260 Q62 216 82 200 L92 194 Q100 200 108 194 L118 200 Q138 216 140 260 Z" fill="#18181b"/>
      <path d="M84 198 Q46 202 28 236 L20 260 L72 260 Q66 226 86 204 Z M116 198 Q154 202 172 236 L180 260 L128 260 Q134 226 114 204 Z" fill="#1e3a8a"/>
      <path d="M84 201 Q56 212 48 240 L46 260 L72 260 Q66 226 86 204 Z M116 201 Q144 212 152 240 L154 260 L128 260 Q134 226 114 204 Z" fill="#f1f5f9" stroke-width="1.4"/>
      <path d="M58 228 Q56 244 56 258 M142 228 Q144 244 144 258" fill="none" stroke="#cbd5e1" stroke-width="1.6"/>

      <path d="M91 160 L91 194 Q100 200 109 194 L109 160 Z" fill="#f5d0b0" stroke-width="1.8"/>
      <path d="M91.9 168 L100 182 L108.1 168 L108.1 178 Q100 188 91.9 178 Z" fill="#d9a07c" stroke="none"/>
      <rect x="87" y="183" width="26" height="8" rx="2" fill="#1c1917" stroke-width="1.6"/>
      <rect x="96" y="181.5" width="8" height="11" rx="1" fill="none" stroke="#d4d4d8" stroke-width="1.6"/>
    </g>
    <path d="M95 192 L98 214 M105 192 L102 214" fill="none" stroke="#d4d4d8" stroke-width="2.2" stroke-dasharray="2.4 1.2"/>
    <g class="yp-worn" stroke-linejoin="round">
      <polygon points="80,214 120,214 100,250" fill="#fbbf24" stroke="#0b0b12" stroke-width="2"/>
      <polygon points="100,250 120,214 113,214 98,244" fill="#d97706"/>
      <path d="M89 222 Q100 216 111 222 Q100 228 89 222 Z" fill="#78350f"/><circle cx="100" cy="222" r="2.4" fill="#fde68a"/>
      <path d="M98 226 L96.5 231" stroke="#78350f" stroke-width="1.4" stroke-linecap="round"/>
    </g>

    <path d="M68 110 L68 138 Q71 154 84 166 L100 178 L116 166 Q129 154 132 138 L132 110 Z" fill="#f5d0b0" stroke="#0b0b12" stroke-width="2" stroke-linejoin="round"/>
    <path d="M69 112 L131 112 L131 121 Q112 116 100 122 Q88 116 69 125 Z" fill="#e3b08c"/>
    <path d="M69 140 Q73 156 86 165 L90 162 Q77 151 74 138 Z" fill="#e3b08c"/>
    <path d="M100.5 141 L96.5 151.5 L101.5 150.8 Z" fill="#c98d6c"/>
    <path d="M95 161.5 L105.5 160.5" stroke="#0b0b12" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M97 164.5 L103 164" stroke="#c98d6c" stroke-width="1.1" stroke-linecap="round"/>

    <g class="yp-brow-eye">
      <path d="M94 117 Q100 112.5 106 117 Q100 121.5 94 117 Z" fill="none" stroke="#fde047" stroke-width="1.4"/>
      <circle cx="100" cy="117" r="1.7" fill="#fde047"/>
      <path d="M98.6 120.3 L97.4 123.5" stroke="#fde047" stroke-width="1.1" stroke-linecap="round"/>
    </g>
    <g id="yp-eye-l" transform="translate(-2.5 0)">
      <path d="M77 124 L96 127.5 L95.5 130 L79 127.5 Z" fill="#0b0b12" stroke="#0b0b12" stroke-width="1" stroke-linejoin="round"/>
      <path d="M80 132 Q88 128 96 131 L95 138 Q87 141 81.5 136.5 Z" fill="#fff"/>
      <ellipse cx="89" cy="134.4" rx="3.7" ry="4.5" fill="#c0267a"/>
      <ellipse cx="89" cy="136.4" rx="2.6" ry="2.2" fill="#f472b6"/>
      <ellipse cx="89" cy="134" rx="1.8" ry="2.6" fill="#4a0430"/>
      <circle cx="90.6" cy="132.2" r="1.25" fill="#fff"/><circle cx="87.6" cy="136.6" r="0.6" fill="#fff"/>
      <path d="M76.5 130 L80 132 Q88 127.5 97 130.8" fill="none" stroke="#0b0b12" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M82.5 138.2 Q88 140.8 94.5 138.6" fill="none" stroke="#0b0b12" stroke-width="1" stroke-linecap="round"/>
    </g>
    <use href="#yp-eye-l" transform="translate(200 0) scale(-1 1)"/>

    <g fill="#fcd34d" stroke="#0b0b12" stroke-width="1.6" stroke-linejoin="round">
      <path d="M92 111 L48 82 L72 90 L56 58 L82 84 L82 62 L97 104 Z"/>
      <path d="M108 111 L152 82 L128 90 L144 58 L118 84 L118 62 L103 104 Z"/>
      <path d="M95.5 110 L91 90 L97.5 96 L100 40 L102.5 96 L109 90 L104.5 110 L100 112.5 Z"/>
      <path d="M84 106 L70 110 Q63 128 61 150 L56 180 L66 160 L65 174 L74 146 Q74 126 88 113 Z"/>
      <path d="M116 106 L130 110 Q137 128 139 146 L142 168 L133 152 L133 162 L126 142 Q126 126 112 113 Z"/>
    </g>
    <g fill="none" stroke="#d4a017" stroke-width="1.2" stroke-linecap="round">
      <path d="M90 104 L64 74 M110 104 L136 74 M100 100 L100 56 M74 116 Q68 132 66 158 M126 116 Q132 132 134 150"/>
    </g>
  </svg>`;

// The Puzzle in seven pieces (40 x 40, the shelf icon's triangle). Each starts
// scattered at (--fx, --fy) with a spin and clicks home in order.
const YP_PIECES = [
  ['4,7 14.67,7 16.44,17 9.33,17', -60, -40, -200],
  ['14.67,7 25.33,7 23.56,17 16.44,17', 0, -55, 160],
  ['25.33,7 36,7 30.67,17 23.56,17', 60, -40, -140],
  ['9.33,17 20,17 20,27 14.67,27', -70, 15, 220],
  ['20,17 30.67,17 25.33,27 20,27', 70, 15, -180],
  ['14.67,27 20,27 20,37', -40, 60, 140],
  ['20,27 25.33,27 20,37', 40, 60, -220]
];

// Shared by the item scenes: a visual-novel dialogue box with a name plate and
// the "<item> obtained!" title (with an optional line for what it opens).
function suBox(who) {
  return `
    <div class="yp-box yp-box--1">
      <span class="yp-name">${who}</span>
      <p class="yp-line" data-say></p>
    </div>`;
}
function suTitle(item, from, extra = '') {
  return `
    <div class="yp-title yp-title--1">
      <b>${item} obtained!</b>
      <span>from ${from}</span>
      ${extra ? `<em>${extra}</em>` : ''}
    </div>`;
}

// Ishizu Ishtar, facing you, in the same cel style as Yami: long black hair
// under a gold headpiece, Egyptian eyeliner, blue eyes, gold earrings and a
// white robe. Her Necklace is an overlay (iz-worn), drawn from the shelf art.
const ISHIZU_SVG = `
  <svg class="iz-ishizu-svg" viewBox="0 0 200 260" aria-hidden="true">
    <g stroke="#0b0b12" stroke-width="2" stroke-linejoin="round" stroke-linecap="round">
      <path d="M56 104 Q50 60 100 52 Q150 60 144 104 L152 200 L158 260 L42 260 L48 200 Z" fill="#141826"/>
      <path d="M30 260 Q34 212 76 198 L90 192 L110 192 L124 198 Q166 212 170 260 Z" fill="#f8fafc"/>
      <path d="M62 222 Q58 240 58 258 M138 222 Q142 240 142 258 M84 214 Q82 238 84 258 M116 214 Q118 238 116 258" fill="none" stroke="#cbd5e1" stroke-width="1.5"/>
      <path d="M90 158 L90 194 Q100 202 110 194 L110 158 Z" fill="#c98b5a" stroke-width="1.8"/>
      <path d="M90.9 164 L100 176 L109.1 164 L109.1 175 Q100 185 90.9 175 Z" fill="#a86f42" stroke="none"/>
      <path d="M76 198 Q100 214 124 198" fill="none" stroke="#fbbf24" stroke-width="3.2"/>
    </g>
    <path d="M68 104 L68 134 Q72 154 86 166 L100 173 L114 166 Q128 154 132 134 L132 104 Z" fill="#c98b5a" stroke="#0b0b12" stroke-width="2" stroke-linejoin="round"/>
    <path d="M69 106 L131 106 L131 122 Q100 114 69 122 Z" fill="#b07445"/>
    <path d="M69 138 Q74 154 86 164 L89 161 Q78 151 75 137 Z" fill="#b07445"/>
    <path d="M100.5 139 L97.5 148 L101.5 147.6 Z" fill="#9a5f36"/>
    <path d="M94.5 156.5 Q100 158.2 105.5 156.5" fill="none" stroke="#5c1d0c" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M96.5 159.5 Q100 161.2 103.5 159.5" fill="none" stroke="#8a3a22" stroke-width="1.2" stroke-linecap="round"/>
    <g id="iz-eye-l" transform="translate(-2.5 0)">
      <path d="M79 123 Q87 118.5 95.5 121.5" fill="none" stroke="#0b0b12" stroke-width="1.6" stroke-linecap="round"/>
      <path d="M80 131.5 Q88 126.5 96 130.5 Q88 136 80 131.5 Z" fill="#fff"/>
      <circle cx="88.5" cy="131.4" r="3.3" fill="#1e40af"/>
      <ellipse cx="88.5" cy="133" rx="2.3" ry="1.5" fill="#60a5fa"/>
      <circle cx="88.5" cy="131.2" r="1.4" fill="#0b0b12"/>
      <circle cx="89.9" cy="129.9" r="1" fill="#fff"/>
      <path d="M80 129.5 Q88 125 96 129 L96 130.6 Q88 126.6 80 131.4 Z" fill="#c98b5a"/>
      <path d="M77.5 131 Q88 125.5 97 130" fill="none" stroke="#0b0b12" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M77.5 131 L72.5 132.5" stroke="#0b0b12" stroke-width="2" stroke-linecap="round"/>
      <path d="M80.5 132.8 Q88 137 95.5 131.6" fill="none" stroke="#0b0b12" stroke-width="1.1" stroke-linecap="round"/>
    </g>
    <use href="#iz-eye-l" transform="translate(200 0) scale(-1 1)"/>
    <g stroke="#0b0b12" stroke-width="1.8" stroke-linejoin="round">
      <path d="M62 96 Q100 80 138 96 L140 112 L132 108 L126 122 L118 106 L109 114 L104 102 L100 110 L96 102 L91 114 L82 106 L74 122 L68 108 L60 112 Z" fill="#141826"/>
      <path d="M64 102 Q56 140 54 176 L62 196 L68 168 Q64 134 68 108 Z M136 102 Q144 140 146 176 L138 196 L132 168 Q136 134 132 108 Z" fill="#141826"/>
      <path d="M60 94 Q100 74 140 94 L141 101 Q100 82 59 101 Z" fill="#fbbf24"/>
      <path d="M61 97.5 Q100 79 139 97.5" fill="none" stroke="#1d4ed8" stroke-width="1.6"/>
      <path d="M100 85 L96.5 93 Q100 98 103.5 93 Z" fill="#fbbf24"/>
      <circle cx="61" cy="158" r="5.5" fill="#fbbf24"/><circle cx="139" cy="158" r="5.5" fill="#fbbf24"/>
      <circle cx="61" cy="158" r="2.2" fill="#1d4ed8" stroke-width="1"/><circle cx="139" cy="158" r="2.2" fill="#1d4ed8" stroke-width="1"/>
    </g>
  </svg>`;

// Hieroglyphs for the tomb's pillars (20 x 20 cells).
const IZ_GLYPHS = [
  'M10 9 Q6 6 10 2 Q14 6 10 9 Z M5 9.5 L15 9.5 M10 9.5 L10 18',
  'M3 10 Q10 5 17 10 Q10 15 3 10 Z M8.5 10 a1.5 1.5 0 1 0 3 0 a1.5 1.5 0 1 0 -3 0 M8 13 L6.5 17',
  'M3 8 L5 6 L7 8 L9 6 L11 8 L13 6 L15 8 L17 6 M3 13 L5 11 L7 13 L9 11 L11 13 L13 11 L15 13 L17 11',
  'M4 10 a6 6 0 1 0 12 0 a6 6 0 1 0 -12 0 M9 10 a1 1 0 1 0 2 0 a1 1 0 1 0 -2 0',
  'M10 18 L10 4 Q14 6 12 10 M7 18 L13 18',
  'M4 15 Q8 8 13 9 L17 6 L15 10 Q12 15 6 16 Z M8 16 L8 19 M11 15 L11 19',
  'M3 16 Q6 12 9 16 Q12 20 15 14 L17 12'
];

function izStage() {
  const column = side => `
    <svg class="iz-pillar iz-pillar--${side}" viewBox="0 0 24 400" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <path d="M1 0 L1 400 M23 0 L23 400" stroke="#a16207" stroke-width="0.8"/>
      <g fill="none" stroke="#e8b866" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
        ${Array.from({ length: 20 }, (_, i) => `<path transform="translate(2 ${i * 20})" d="${IZ_GLYPHS[(i * 3 + (side === 'l' ? 0 : 2)) % IZ_GLYPHS.length]}"/>`).join('')}
      </g>
    </svg>`;
  const torch = side => `<div class="iz-torch iz-torch--${side}"><span class="iz-torch-glow"></span><i></i></div>`;
  return `
    <div class="iz-bg"></div>
    ${column('l')}${column('r')}
    ${torch('l')}${torch('r')}
    <div class="iz-ishizu">
      ${ISHIZU_SVG}
      <span class="iz-worn">${soloShelfIcon('necklace')}</span>
    </div>
    <div class="iz-vision">
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <defs><radialGradient id="iz-mist" cx="50%" cy="45%" r="60%">
          <stop offset="0" stop-color="#155e63"/><stop offset="0.7" stop-color="#0b2a33"/><stop offset="1" stop-color="#03141a"/>
        </radialGradient></defs>
        <rect width="100" height="100" fill="url(#iz-mist)"/>
        <g fill="#0f2f3a" opacity="0.8"><ellipse cx="22" cy="14" rx="20" ry="6"/><ellipse cx="76" cy="10" rx="24" ry="6"/></g>
        <path class="iz-bolt" d="M74 4 L68 16 L73 16 L66 28" fill="none" stroke="#a5f3fc" stroke-width="1.2" stroke-linejoin="round"/>
        <path d="M18 46 Q50 34 82 46 L82 52 L18 52 Z" fill="#06202a"/>
        <path d="M30 44 L30 32 L33 32 L33 28 L36 28 L36 32 L42 32 L42 22 L45 18 L48 22 L48 32 L52 32 L52 16 L55 10 L58 16 L58 32 L64 32 L64 26 L67 23 L70 26 L70 44 Z" fill="#071a22" stroke="#5eead4" stroke-width="0.7" stroke-linejoin="round"/>
        <g fill="#f43f5e"><rect x="44" y="25" width="2" height="3"/><rect x="54" y="20" width="2" height="3"/><rect x="66" y="30" width="2" height="2.5"/></g>
        <path class="iz-road" d="M50 100 Q28 86 46 74 Q64 63 44 55 Q36 50 50 45" fill="none" stroke="#f43f5e" stroke-width="3" stroke-linecap="round"/>
        <g class="iz-swords" stroke="#fecaca" stroke-linecap="round">
          <path d="M36 90 L64 62 M64 90 L36 62" stroke-width="2.2"/>
          <path d="M37.5 83.5 L42.5 88.5 M57.5 88.5 L62.5 83.5" stroke-width="2.4"/>
        </g>
      </svg>
    </div>
    <div class="iz-necklace">${soloShelfIcon('necklace')}</div>
    <div class="yp-flash"></div>
    <div class="su-dust">${ceRange(fxCount(18), () => `<i style="--x: ${ceRand(0, 100).toFixed(1)}%; --d: ${ceRand(5, 9).toFixed(1)}s; --delay: ${(-ceRand(0, 9)).toFixed(1)}s; --s: ${ceRand(2, 4).toFixed(1)}px;"></i>`)}</div>
    ${suTitle('Millennium Necklace', 'Ishizu Ishtar', '<span class="ce-emoji">⚔️</span> Hard unlocked')}
    ${suBox('Ishizu Ishtar')}
    <p class="su-skip su-skip--1">Tap to skip</p>`;
}

// Shadi, facing you, in the same cel style as Yami and Ishizu: a white turban
// whose cloth falls to his shoulders, stern grey eyes under heavy brows, a
// white robe and the Millennium Key (an ankh) on a cord.
const SHADI_CEL_SVG = `
  <svg class="sd-shadi-svg" viewBox="0 0 200 260" aria-hidden="true">
    <g stroke="#0b0b12" stroke-width="2" stroke-linejoin="round" stroke-linecap="round">
      <path d="M56 110 Q52 58 100 48 Q148 58 144 110 L152 204 L48 204 Z" fill="#f4efe4"/>
      <path d="M28 260 Q32 212 74 198 L90 192 L110 192 L126 198 Q168 212 172 260 Z" fill="#fbf8f1"/>
      <path d="M60 222 Q56 240 56 258 M140 222 Q144 240 144 258 M86 214 Q84 238 86 258 M114 214 Q116 238 114 258" fill="none" stroke="#d6cfc0" stroke-width="1.5"/>
      <path d="M90 158 L90 194 Q100 202 110 194 L110 158 Z" fill="#a8714a" stroke-width="1.8"/>
      <path d="M90.9 164 L100 176 L109.1 164 L109.1 175 Q100 185 90.9 175 Z" fill="#8a5a38" stroke="none"/>
      <path d="M92 194 L98 208 M108 194 L102 208" fill="none" stroke="#78350f" stroke-width="1.4"/>
    </g>
    <g class="sd-key" fill="#fbbf24" stroke="#0b0b12" stroke-width="1.8" stroke-linejoin="round">
      <path d="M100 222 C88 214 92 202 100 202 C108 202 112 214 100 222 Z M100 217 C96 213 97 207 100 207 C103 207 104 213 100 217 Z" fill-rule="evenodd"/>
      <path d="M86 221 L114 221 L114 227 L103.5 227 L106 252 L94 252 L96.5 227 L86 227 Z"/>
    </g>
    <path d="M68 104 L68 134 Q72 154 86 166 L100 173 L114 166 Q128 154 132 134 L132 104 Z" fill="#a8714a" stroke="#0b0b12" stroke-width="2" stroke-linejoin="round"/>
    <path d="M69 106 L131 106 L131 120 Q100 112 69 120 Z" fill="#8a5a38"/>
    <path d="M69 138 Q74 154 86 164 L89 161 Q78 151 75 137 Z" fill="#8a5a38"/>
    <path d="M100.5 132 L97 148.5 L102 148 Z" fill="#7a4a2c"/>
    <path d="M94 158.5 L106 158.5" stroke="#2b1408" stroke-width="1.7" stroke-linecap="round"/>
    <path d="M96 163.5 Q100 165 104 163.5" fill="none" stroke="#7a4a2c" stroke-width="1.2" stroke-linecap="round"/>
    <g id="sd-eye-l" transform="translate(-2.5 0)">
      <path d="M77 120.5 L96.5 124 L96 126.8 L78 124.2 Z" fill="#0b0b12" stroke="#0b0b12" stroke-width="1" stroke-linejoin="round"/>
      <path d="M80 131 Q88 127.5 96 130.5 Q88 134.6 80 131 Z" fill="#fff"/>
      <circle cx="88.6" cy="130.8" r="2.8" fill="#4b5563"/>
      <ellipse cx="88.6" cy="132.1" rx="1.9" ry="1.2" fill="#9ca3af"/>
      <circle cx="88.6" cy="130.7" r="1.1" fill="#0b0b12"/>
      <circle cx="89.7" cy="129.7" r="0.8" fill="#fff"/>
      <path d="M78 130.6 Q88 126.2 97 129.8" fill="none" stroke="#0b0b12" stroke-width="2.6" stroke-linecap="round"/>
      <path d="M81 132.3 Q88 135.4 95 132" fill="none" stroke="#0b0b12" stroke-width="1" stroke-linecap="round"/>
    </g>
    <use href="#sd-eye-l" transform="translate(200 0) scale(-1 1)"/>
    <g stroke="#0b0b12" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round">
      <path d="M62 104 Q56 140 58 200 L72 200 Q70 150 69 106 Z M138 104 Q144 140 142 200 L128 200 Q130 150 131 106 Z" fill="#fbf8f1"/>
      <path d="M60 108 Q54 58 100 46 Q146 58 140 108 Q100 92 60 108 Z" fill="#fbf8f1"/>
      <path d="M64 96 Q100 78 136 96 M68 82 Q100 62 132 82 M76 68 Q100 54 124 68" fill="none" stroke="#d6cfc0" stroke-width="1.4"/>
      <path d="M64 150 Q66 176 64 198 M136 150 Q134 176 136 198" fill="none" stroke="#d6cfc0" stroke-width="1.2"/>
    </g>
  </svg>`;

// The Millennium Scale, big enough to weigh a heart. The beam (sd-beam) tips
// around the post; each pan (sd-pan) counter-rotates so it hangs straight.
const SD_SCALE_SVG = `
  <svg class="sd-scale-svg" viewBox="0 0 200 200" aria-hidden="true">
    <defs><linearGradient id="sd-gold" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#fef3c7"/><stop offset="0.35" stop-color="#fbbf24"/><stop offset="0.7" stop-color="#d97706"/><stop offset="1" stop-color="#92400e"/>
    </linearGradient></defs>
    <g stroke="#0b0b12" stroke-width="2" stroke-linejoin="round" stroke-linecap="round">
      <path d="M68 186 L132 186 L122 172 L78 172 Z" fill="url(#sd-gold)"/>
      <rect x="96" y="44" width="8" height="130" rx="2" fill="url(#sd-gold)"/>
      <g class="sd-beam">
        <rect x="26" y="48" width="148" height="7" rx="3.5" fill="url(#sd-gold)"/>
        <g class="sd-pan" style="transform-origin: 32px 51.5px;">
          <path d="M32 51.5 L14 104 M32 51.5 L50 104" fill="none" stroke="#a16207" stroke-width="1.2"/>
          <path class="sd-heart" d="M32 103 C19 95 21 84 28 86 C30 86.5 31.5 88 32 89.5 C32.5 88 34 86.5 36 86 C43 84 45 95 32 103 Z" fill="#ef4444"/>
          <path d="M10 104 Q32 122 54 104 Z" fill="url(#sd-gold)"/>
        </g>
        <g class="sd-pan" style="transform-origin: 168px 51.5px;">
          <path d="M168 51.5 L150 104 M168 51.5 L186 104" fill="none" stroke="#a16207" stroke-width="1.2"/>
          <g class="sd-feather">
            <path d="M168 104 Q158 88 165 68 Q178 84 168 104 Z" fill="#f8fafc"/>
            <path d="M168 104 L166 72 M166.5 92 L161 86 M166.5 84 L172 79 M167 96 L172 91" fill="none" stroke="#94a3b8" stroke-width="1"/>
          </g>
          <path d="M146 104 Q168 122 190 104 Z" fill="url(#sd-gold)"/>
        </g>
        <circle cx="32" cy="51.5" r="4" fill="url(#sd-gold)"/><circle cx="168" cy="51.5" r="4" fill="url(#sd-gold)"/>
      </g>
      <circle cx="100" cy="34" r="13" fill="url(#sd-gold)"/>
      <path d="M92 34 Q100 28 108 34 Q100 40 92 34 Z" fill="#78350f" stroke="none"/>
      <circle cx="100" cy="34" r="2" fill="#fde68a" stroke="none"/>
    </g>
  </svg>`;

function sdStage() {
  const stars = ceRange(fxCount(36), () => `<circle cx="${ceRand(0, 100).toFixed(1)}" cy="${ceRand(0, 60).toFixed(1)}" r="${ceRand(0.15, 0.45).toFixed(2)}" style="--d: ${ceRand(1.5, 4).toFixed(1)}s; --delay: ${(-ceRand(0, 4)).toFixed(1)}s;"/>`);
  return `
    <div class="sd-sky"></div>
    <svg class="sd-stars" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><g fill="#fef9c3">${stars}</g></svg>
    <div class="sd-moon"></div>
    <svg class="sd-dunes" viewBox="0 0 100 40" preserveAspectRatio="none" aria-hidden="true">
      <path d="M0 22 Q20 8 42 18 Q64 28 82 14 Q92 8 100 12 L100 40 L0 40 Z" fill="#3b2a4a"/>
      <path d="M0 30 Q26 18 50 28 Q74 38 100 24 L100 40 L0 40 Z" fill="#251a33"/>
    </svg>
    <div class="yp-rays"></div>
    <div class="sd-shadi">${SHADI_CEL_SVG}</div>
    <div class="sd-scale">${SD_SCALE_SVG}</div>
    <div class="yp-flash"></div>
    <div class="su-dust">${ceRange(fxCount(22), () => `<i style="--x: ${ceRand(0, 100).toFixed(1)}%; --d: ${ceRand(3, 7).toFixed(1)}s; --delay: ${(-ceRand(0, 7)).toFixed(1)}s; --s: ${ceRand(2, 4).toFixed(1)}px;"></i>`)}</div>
    ${suTitle('Millennium Scale', 'Shadi')}
    ${suBox('Shadi')}
    <p class="su-skip su-skip--1">Tap to skip</p>`;
}

// The sealed door to your soul: a stone frame with the Eye of Wdjat on its
// lintel, two carved leaves that swing inwards (ky-leaf) and an ankh keyhole
// (ky-hole). Behind it (ky-beyond) waits the Nightmare road under a red Eye.
function kyStage() {
  const glyphs = [0, 1, 4, 6].map((g, i) => `<path transform="translate(15 ${[14, 36, 82, 104][i]})" d="${IZ_GLYPHS[g]}"/>`).join('');
  const leaf = side => `
    <div class="ky-leaf ky-leaf--${side}">
      <svg viewBox="0 0 50 135" preserveAspectRatio="none" aria-hidden="true"${side === 'r' ? ' style="transform: scaleX(-1);"' : ''}>
        <rect x="0.75" y="0.75" width="48.5" height="133.5" fill="#2e2a44" stroke="#0b0b12" stroke-width="1.5"/>
        <rect x="6" y="7" width="38" height="121" rx="1" fill="#252139" stroke="#4c4470" stroke-width="1"/>
        <path d="M6 61 L50 61 M6 74 L50 74" stroke="#a16207" stroke-width="1.6"/>
        <g fill="none" stroke="#d4a856" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" opacity="0.75">${glyphs}</g>
        <g fill="#a16207"><circle cx="44" cy="20" r="1.4"/><circle cx="44" cy="40" r="1.4"/><circle cx="44" cy="95" r="1.4"/><circle cx="44" cy="115" r="1.4"/></g>
      </svg>
    </div>`;
  const bats = ceRange(5, i => `<path transform="translate(${[22, 70, 36, 82, 58][i]} ${[58, 52, 72, 66, 44][i]})" d="M-4 0 Q-2 -2 0 0.6 Q2 -2 4 0 Q2 -0.6 0 1.6 Q-2 -0.6 -4 0 Z"/>`);
  return `
    <div class="ky-bg"></div>
    <div class="ky-floor"></div>
    <div class="ky-light"></div>
    <div class="ky-door">
      <div class="ky-beyond">
        <svg viewBox="0 0 100 135" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <defs><linearGradient id="ky-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#1a0306"/><stop offset="0.5" stop-color="#7f1d1d"/><stop offset="0.68" stop-color="#f43f5e"/><stop offset="1" stop-color="#1a0306"/>
          </linearGradient></defs>
          <rect width="100" height="135" fill="url(#ky-sky)"/>
          <g class="ky-glare" stroke="#0b0b12" stroke-linecap="round" stroke-linejoin="round">
            <path d="M24 28 Q50 10 76 28" fill="none" stroke-width="2.4"/>
            <path d="M26 36 Q50 18 74 36 Q50 52 26 36 Z" fill="#fff1f2" stroke-width="1.8"/>
            <circle cx="50" cy="35" r="7.5" fill="#be123c" stroke-width="1.2"/>
            <circle cx="50" cy="35" r="3" fill="#0b0b12" stroke="none"/>
            <path d="M45 44 L41 56" fill="none" stroke-width="2"/>
          </g>
          <g fill="#0b0207">${bats}</g>
          <path d="M0 94 L12 78 L20 86 L32 68 L44 88 L56 72 L68 90 L80 74 L100 92 L100 135 L0 135 Z" fill="#0b0207"/>
          <path d="M44 88 L44 80 L47 80 L47 76 L50 72 L53 76 L53 80 L56 80 L56 88 Z" fill="#0b0207" stroke="#f43f5e" stroke-width="0.6"/>
          <path class="ky-road" d="M50 135 Q26 120 50 110 Q70 101 50 92" fill="none" stroke="#f43f5e" stroke-width="4" stroke-linecap="round"/>
        </svg>
      </div>
      ${leaf('l')}${leaf('r')}
      <svg class="ky-frame" viewBox="-14 -24 128 163" aria-hidden="true">
        <g stroke="#0b0b12" stroke-width="1.6" stroke-linejoin="round">
          <rect x="-12" y="-4" width="12" height="143" fill="#3f3a5c"/>
          <rect x="100" y="-4" width="12" height="143" fill="#3f3a5c"/>
          <rect x="-14" y="135" width="128" height="4" fill="#4a4468"/>
          <rect x="-14" y="-22" width="128" height="20" fill="#4a4468"/>
        </g>
        <path d="M-9 4 L-9 132 M105 4 L105 132" stroke="#2a2640" stroke-width="1"/>
        <g class="ky-eye" stroke="#0b0b12" stroke-linecap="round" stroke-linejoin="round">
          <path d="M36 -16 Q50 -22 64 -16" fill="none" stroke="#fbbf24" stroke-width="2"/>
          <path d="M37 -11 Q50 -18 63 -11 Q50 -4 37 -11 Z" fill="#fbbf24" stroke-width="1.2"/>
          <circle cx="50" cy="-11" r="3" fill="#0b0b12" stroke="none"/>
          <path d="M47 -6.5 L45 -3" fill="none" stroke="#fbbf24" stroke-width="1.4"/>
        </g>
      </svg>
      <div class="ky-hole">
        <svg viewBox="0 0 20 30" aria-hidden="true">
          <path d="M10 13 C3 9 4 1.5 10 1.5 C16 1.5 17 9 10 13 Z M2 13 L18 13 L18 17 L12 17 L13.5 28.5 L6.5 28.5 L8 17 L2 17 Z" fill="#050308" stroke="#fbbf24" stroke-width="1.2" stroke-linejoin="round"/>
        </svg>
      </div>
    </div>
    <div class="yp-rays"></div>
    <div class="ky-shadi">${SHADI_CEL_SVG}</div>
    <div class="ky-key">${soloShelfIcon('key')}</div>
    <div class="yp-flash"></div>
    <div class="su-dust">${ceRange(fxCount(18), () => `<i style="--x: ${ceRand(0, 100).toFixed(1)}%; --d: ${ceRand(4, 8).toFixed(1)}s; --delay: ${(-ceRand(0, 8)).toFixed(1)}s; --s: ${ceRand(2, 4).toFixed(1)}px;"></i>`)}</div>
    ${suTitle('Millennium Key', 'Shadi', '<span class="ce-emoji">💀</span> Nightmare unlocked')}
    ${suBox('Shadi')}
    <p class="su-skip su-skip--1">Tap to skip</p>`;
}

// Yami Bakura, facing you, in the same cel style: a wild mane of silver-white
// hair, narrow red-brown eyes under scowling brows, a sinister grin, the
// blue-and-white striped shirt under an open navy jacket and the Millennium
// Ring on its cord (br-worn).
const BAKURA_SVG = `
  <svg class="br-bakura-svg" viewBox="0 0 200 260" aria-hidden="true">
    <g stroke="#0b0b12" stroke-width="2" stroke-linejoin="round" stroke-linecap="round">
      <path d="M100 40 Q60 42 52 80 L34 70 L44 100 L22 104 L42 124 L20 140 L44 150 L28 176 L52 176 L42 206 L66 196 L68 222 L84 200 L100 206 L116 200 L132 222 L134 196 L158 206 L148 176 L172 176 L156 150 L180 140 L158 124 L178 104 L156 100 L166 70 L148 80 Q140 42 100 40 Z" fill="#ece8f6"/>
      <path d="M58 92 L48 128 M142 92 L152 128 M64 150 L54 186 M136 150 L146 186 M74 182 L72 210 M126 182 L128 210" fill="none" stroke="#b9b1d3" stroke-width="1.4"/>
      <path d="M28 260 Q32 212 74 198 L90 192 L110 192 L126 198 Q168 212 172 260 Z" fill="#1e2a4a"/>
      <path d="M78 200 L90 192 L110 192 L122 200 L118 260 L82 260 Z" fill="#f8fafc"/>
      <path d="M80 211 L120 211 M80.5 223 L119.5 223 M81 235 L119 235 M81.5 247 L118.5 247" fill="none" stroke="#3b82f6" stroke-width="4" stroke-linecap="butt"/>
      <path d="M78 200 L90 232 L84 260 M122 200 L110 232 L116 260" fill="none" stroke-width="1.8"/>
      <path d="M44 226 Q48 244 46 260 M156 226 Q152 244 154 260" fill="none" stroke="#33416b" stroke-width="1.5"/>
      <path d="M90 158 L90 194 Q100 202 110 194 L110 158 Z" fill="#f3d9c6" stroke-width="1.8"/>
      <path d="M90.9 164 L100 176 L109.1 164 L109.1 175 Q100 185 90.9 175 Z" fill="#dcb9a2" stroke="none"/>
    </g>
    <g class="br-worn" stroke="#0b0b12" stroke-linejoin="round" stroke-linecap="round">
      <path d="M90 194 L94 214 M110 194 L106 214" fill="none" stroke="#78350f" stroke-width="1.4"/>
      <circle cx="100" cy="226" r="12" fill="none" stroke-width="6"/>
      <circle cx="100" cy="226" r="12" fill="none" stroke="#fbbf24" stroke-width="3.6"/>
      <polygon points="100,216 108.7,231 91.3,231" fill="#fbbf24" stroke-width="1.1"/>
      <path d="M96 225.5 Q100 223 104 225.5 Q100 228 96 225.5 Z" fill="#78350f" stroke="none"/>
      <g fill="#fbbf24" stroke-width="1">
        <polygon points="89,236 92,236 89,250"/><polygon points="94,239 97,239 95,254"/><polygon points="98.5,240 101.5,240 100,256"/>
        <polygon points="103,239 106,239 105,254"/><polygon points="108,236 111,236 111,250"/>
      </g>
    </g>
    <path d="M68 104 L68 134 Q72 154 86 166 L100 173 L114 166 Q128 154 132 134 L132 104 Z" fill="#f3d9c6" stroke="#0b0b12" stroke-width="2" stroke-linejoin="round"/>
    <path d="M69 106 L131 106 L131 122 Q100 114 69 122 Z" fill="#dcb9a2"/>
    <path d="M69 138 Q74 154 86 164 L89 161 Q78 151 75 137 Z" fill="#dcb9a2"/>
    <path d="M100.5 139 L97.5 148 L101.5 147.6 Z" fill="#c99f88"/>
    <path d="M89 155 Q100 162.5 113 152.5 Q101 158 89 155 Z" fill="#fff" stroke="#3b0a0a" stroke-width="1.3" stroke-linejoin="round"/>
    <path d="M94 157.3 L94.6 159.4 M99 158.6 L99.4 160.6 M104 158 L104.3 160 M108.5 156 L108.9 157.8" stroke="#3b0a0a" stroke-width="0.7"/>
    <path d="M113 152.5 L116 150.5 M87.5 154 L89 155" fill="none" stroke="#3b0a0a" stroke-width="1.3" stroke-linecap="round"/>
    <g id="br-eye-l" transform="translate(-2.5 0)">
      <path d="M76 117.5 L97 125 L96.2 128 L77 121.5 Z" fill="#0b0b12" stroke="#0b0b12" stroke-width="1" stroke-linejoin="round"/>
      <path d="M80 131 Q88 127.4 96.5 132 Q88 134.6 80 131 Z" fill="#fff"/>
      <circle cx="89.5" cy="131.2" r="2.6" fill="#7f1d1d"/>
      <ellipse cx="89.5" cy="132.3" rx="1.7" ry="1.1" fill="#dc2626"/>
      <circle cx="89.5" cy="131.1" r="0.9" fill="#0b0b12"/>
      <circle cx="90.5" cy="130.2" r="0.7" fill="#fff"/>
      <path d="M77.5 130.2 Q88 126 97.5 132" fill="none" stroke="#0b0b12" stroke-width="2.6" stroke-linecap="round"/>
      <path d="M81 132.4 Q88 135.2 95.5 133" fill="none" stroke="#0b0b12" stroke-width="1" stroke-linecap="round"/>
      <path d="M82.5 136.5 Q88.5 138.6 94.5 136" fill="none" stroke="#b08a74" stroke-width="0.9" stroke-linecap="round"/>
    </g>
    <use href="#br-eye-l" transform="translate(200 0) scale(-1 1)"/>
    <g stroke="#0b0b12" stroke-width="1.8" stroke-linejoin="round">
      <path d="M62 104 Q54 140 58 182 L66 170 L68 190 L74 162 Q68 134 70 110 Z M138 104 Q146 140 142 182 L134 170 L132 190 L126 162 Q132 134 130 110 Z" fill="#ece8f6"/>
      <path d="M60 106 Q58 72 100 64 Q142 72 140 106 L138 118 L130 108 L124 116 L116 104 L108 114 L104 106 L100 133 L96 106 L92 114 L84 104 L76 116 L70 108 L62 118 Z" fill="#ece8f6"/>
      <path d="M86 78 L80 100 M114 78 L120 100 M100 72 L100 92 M70 86 L66 104 M130 86 L134 104" fill="none" stroke="#b9b1d3" stroke-width="1.3"/>
    </g>
  </svg>`;

// The Millennium Ring, big: an eye in a triangle inside the ring, and five
// pointers (br-ptr) that swing on their hinges and then all aim at you (--aim).
const BR_POINTERS = [[31.7, 85.7, -21], [45, 93.3, -13], [60, 96, 0], [75, 93.3, 13], [88.3, 85.7, 21]];
const BR_RING_SVG = `
  <svg class="br-ring-svg" viewBox="0 0 120 140" aria-hidden="true">
    <defs><linearGradient id="br-gold" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#fef3c7"/><stop offset="0.35" stop-color="#fbbf24"/><stop offset="0.7" stop-color="#d97706"/><stop offset="1" stop-color="#92400e"/>
    </linearGradient></defs>
    <g stroke="#0b0b12" stroke-linejoin="round" stroke-linecap="round">
      ${BR_POINTERS.map(([x, y, aim], i) => `
        <g class="br-ptr" style="--i: ${i}; --aim: ${aim}deg; transform-origin: ${x}px ${y}px;">
          <polygon class="br-tip" points="${x - 3.4},${y + 2} ${x + 3.4},${y + 2} ${x},${y + 30}" fill="url(#br-gold)" stroke-width="1.4"/>
          <circle cx="${x}" cy="${y}" r="2.8" fill="url(#br-gold)" stroke-width="1.2"/>
        </g>`).join('')}
      <circle cx="60" cy="52" r="40" fill="none" stroke-width="12"/>
      <circle cx="60" cy="52" r="40" fill="none" stroke="url(#br-gold)" stroke-width="9"/>
      <polygon points="60,19 88.6,68.5 31.4,68.5" fill="url(#br-gold)" stroke-width="1.8"/>
      <path d="M44 45 Q60 37 76 45" fill="none" stroke="#78350f" stroke-width="2.2"/>
      <path d="M44 52 Q60 42 76 52 Q60 62 44 52 Z" fill="#78350f" stroke="none"/>
      <circle class="br-iris" cx="60" cy="52" r="4" fill="#fde68a" stroke="none"/>
      <path d="M55 58 L52.5 65" fill="none" stroke="#78350f" stroke-width="1.8"/>
    </g>
  </svg>`;

function brStage() {
  return `
    <div class="br-bg"></div>
    <div class="br-mist"></div>
    <div class="br-sigil">
      <svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="40"/><polygon points="50,15 80.3,67.5 19.7,67.5"/><path d="M38 47 Q50 39 62 47 Q50 55 38 47 Z"/></svg>
    </div>
    <div class="yp-rays"></div>
    <div class="br-souls">${ceRange(fxCount(12), () => `<i style="--x: ${ceRand(4, 96).toFixed(1)}%; --d: ${ceRand(6, 11).toFixed(1)}s; --delay: ${(-ceRand(0, 11)).toFixed(1)}s; --s: ${ceRand(6, 12).toFixed(1)}px; --sway: ${ceRand(-30, 30).toFixed(0)}px;"></i>`)}</div>
    <div class="br-bakura">${BAKURA_SVG}</div>
    <div class="br-ring">${BR_RING_SVG}</div>
    <div class="yp-flash"></div>
    ${suTitle('Millennium Ring', 'Yami Bakura')}
    ${suBox('Yami Bakura')}
    <p class="su-skip su-skip--1">Tap to skip</p>`;
}

// Marik Ishtar, facing you, in the same cel style: spiky sandy-blond hair, tan
// skin, violet eyes with Egyptian eyeliner, gold hoop earrings and collar, a
// black top under his lavender cloak, and the Millennium Rod in his fist (rd-held).
const RD_MARIK_SVG = `
  <svg class="rd-marik-svg" viewBox="0 0 200 260" aria-hidden="true">
    <g stroke="#0b0b12" stroke-width="2" stroke-linejoin="round" stroke-linecap="round">
      <path d="M100 36 L88 52 L68 38 L70 60 L46 52 L56 76 L32 80 L50 98 L28 110 L52 120 L36 140 L60 138 L52 164 L70 150 L74 174 L86 160 L100 170 L114 160 L126 174 L130 150 L148 164 L140 138 L164 140 L148 120 L172 110 L150 98 L168 80 L144 76 L154 52 L130 60 L132 38 L112 52 Z" fill="#f5d76e"/>
      <path d="M58 86 L48 112 M142 86 L152 112 M62 128 L54 150 M138 128 L146 150 M80 50 L84 64 M120 50 L116 64" fill="none" stroke="#c9a43f" stroke-width="1.4"/>
      <path d="M24 260 Q28 210 70 196 L90 190 L110 190 L130 196 Q172 210 176 260 Z" fill="#7c5cc4"/>
      <path d="M74 198 L90 190 L110 190 L126 198 L120 260 L80 260 Z" fill="#18181b"/>
      <path d="M48 222 Q54 242 50 260 M74 198 L82 260 M126 198 L118 260" fill="none" stroke="#5b3fa0" stroke-width="1.6"/>
      <path d="M90 158 L90 194 Q100 202 110 194 L110 158 Z" fill="#b77b4f" stroke-width="1.8"/>
      <path d="M90.9 164 L100 176 L109.1 164 L109.1 175 Q100 185 90.9 175 Z" fill="#9a6238" stroke="none"/>
      <path d="M84 190 Q100 204 116 190 L119 198 Q100 214 81 198 Z" fill="#fbbf24" stroke-width="1.6"/>
      <path d="M88 195 L87 201 M94 198 L93.5 205 M100 199 L100 206 M106 198 L106.5 205 M112 195 L113 201" fill="none" stroke="#92400e" stroke-width="1"/>
    </g>
    <path d="M68 104 L68 134 Q72 154 86 166 L100 173 L114 166 Q128 154 132 134 L132 104 Z" fill="#b77b4f" stroke="#0b0b12" stroke-width="2" stroke-linejoin="round"/>
    <path d="M69 106 L131 106 L131 122 Q100 114 69 122 Z" fill="#9a6238"/>
    <path d="M69 138 Q74 154 86 164 L89 161 Q78 151 75 137 Z" fill="#9a6238"/>
    <path d="M100.5 139 L97.5 148 L101.5 147.6 Z" fill="#8a5530"/>
    <path d="M93 157 Q101 159.6 108 155" fill="none" stroke="#5c1d0c" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M108 155 L110.2 153.3" fill="none" stroke="#5c1d0c" stroke-width="1.3" stroke-linecap="round"/>
    <g id="rd-eye-l" transform="translate(-2.5 0)">
      <path d="M77.5 122 Q87 117.5 96.5 121.5" fill="none" stroke="#a16207" stroke-width="2.2" stroke-linecap="round"/>
      <path d="M80 131.5 Q88 126.5 96 130.5 Q88 136 80 131.5 Z" fill="#fff"/>
      <circle cx="88.5" cy="131.4" r="3.3" fill="#6d28d9"/>
      <ellipse cx="88.5" cy="133" rx="2.3" ry="1.5" fill="#c4b5fd"/>
      <circle cx="88.5" cy="131.2" r="1.4" fill="#0b0b12"/>
      <circle cx="89.9" cy="129.9" r="1" fill="#fff"/>
      <path d="M80 129.5 Q88 125 96 129 L96 130.6 Q88 126.6 80 131.4 Z" fill="#b77b4f"/>
      <path d="M77.5 131 Q88 125.5 97 130" fill="none" stroke="#0b0b12" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M77.5 131 L72.5 132.5" stroke="#0b0b12" stroke-width="2" stroke-linecap="round"/>
      <path d="M80.5 132.8 Q88 137 95.5 131.6" fill="none" stroke="#0b0b12" stroke-width="1.1" stroke-linecap="round"/>
    </g>
    <use href="#rd-eye-l" transform="translate(200 0) scale(-1 1)"/>
    <g stroke="#0b0b12" stroke-width="1.8" stroke-linejoin="round">
      <path d="M62 102 Q54 130 60 162 L66 148 L70 160 L72 130 Q68 116 70 108 Z M138 102 Q146 130 140 162 L134 148 L130 160 L128 130 Q132 116 130 108 Z" fill="#f5d76e"/>
      <path d="M60 106 Q56 70 100 62 Q144 70 140 106 L136 116 L128 106 L120 117 L112 104 L104 114 L100 102 L96 114 L88 104 L80 117 L72 106 L64 116 Z" fill="#f5d76e"/>
      <path d="M84 76 L80 96 M116 76 L120 96 M100 68 L100 88 M70 84 L66 100 M130 84 L134 100" fill="none" stroke="#c9a43f" stroke-width="1.3"/>
      <path d="M64 160 L64 165 M136 160 L136 165" fill="none" stroke="#fbbf24" stroke-width="1.6"/>
      <circle cx="64" cy="170" r="5" fill="none" stroke-width="4.4"/><circle cx="136" cy="170" r="5" fill="none" stroke-width="4.4"/>
      <circle cx="64" cy="170" r="5" fill="none" stroke="#fbbf24" stroke-width="2.4"/><circle cx="136" cy="170" r="5" fill="none" stroke="#fbbf24" stroke-width="2.4"/>
    </g>
    <g stroke="#0b0b12" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round">
      <path d="M132 260 L144 238 L164 238 L180 260 Z" fill="#7c5cc4"/>
      <g class="rd-held">
        <rect x="151" y="198" width="6" height="52" rx="2" fill="#fbbf24"/>
        <path d="M147 194 Q135 185 129 196 Q138 193 147 200 Z M161 194 Q173 185 179 196 Q170 193 161 200 Z" fill="#fbbf24"/>
        <circle cx="154" cy="194" r="8" fill="#fbbf24"/>
        <path d="M149 194 Q154 190.5 159 194 Q154 197.5 149 194 Z" fill="#78350f" stroke="none"/>
      </g>
      <rect x="145" y="222" width="18" height="17" rx="5" fill="#b77b4f"/>
      <path d="M149 226.5 L159 226.5 M149 231 L159 231 M149 235.5 L159 235.5" fill="none" stroke="#7a4a2c" stroke-width="1"/>
    </g>
  </svg>`;

// Battle City at night: a skyline with lit windows, the KaibaCorp blimp, then
// the Rod's mind control (rd-hypno rings, violet vignette) and its shards.
function rdStage() {
  let x = 0, towers = '', windows = '';
  while (x < 100) {
    const w = ceRand(5, 11), h = ceRand(10, 34);
    towers += `<rect x="${x.toFixed(1)}" y="${(40 - h).toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}"/>`;
    for (let k = 0; k < 3; k++) {
      if (Math.random() < 0.6) windows += `<rect x="${(x + ceRand(1, w - 2)).toFixed(1)}" y="${(40 - ceRand(2, h - 2)).toFixed(1)}" width="0.8" height="1"/>`;
    }
    x += w + ceRand(0, 1.5);
  }
  return `
    <div class="rd-sky"></div>
    <div class="rd-blimp">
      <svg viewBox="0 0 60 22" aria-hidden="true">
        <path d="M6 9 L0 3 L0 15 Z M6 9 L1 9" fill="#1c1630"/>
        <ellipse cx="30" cy="9" rx="24" ry="8" fill="#1c1630" stroke="#3b2f5c" stroke-width="0.6"/>
        <rect x="24" y="16" width="12" height="4" rx="1.5" fill="#1c1630"/>
        <text x="30" y="11.5" text-anchor="middle" font-family="Georgia, serif" font-weight="900" font-size="7" fill="#7dd3fc" opacity="0.8">KC</text>
        <circle cx="27" cy="18" r="0.6" fill="#fde68a"/><circle cx="30" cy="18" r="0.6" fill="#fde68a"/><circle cx="33" cy="18" r="0.6" fill="#fde68a"/>
      </svg>
    </div>
    <svg class="rd-city" viewBox="0 0 100 40" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <g fill="#120c22">${towers}</g><g fill="#fde68a" opacity="0.75">${windows}</g>
    </svg>
    <div class="yp-rays"></div>
    <div class="rd-eye"><svg viewBox="90 50 180 220" aria-hidden="true">${SEV_EYE}</svg></div>
    <div class="rd-hypno">${ceRange(6, i => `<i style="--i: ${i};"></i>`)}</div>
    <div class="rd-marik">${RD_MARIK_SVG}</div>
    <div class="rd-rod">${soloShelfIcon('rod')}</div>
    <div class="rd-tint"></div>
    <div class="rd-shards">${ceRange(fxCount(14), i => `<i style="--a: ${(i * 360 / 14 + ceRand(-10, 10)).toFixed(0)}deg; --dist: ${ceRand(28, 48).toFixed(0)}vmin; --spin: ${ceRand(-300, 300).toFixed(0)}deg; --s: ${ceRand(10, 22).toFixed(0)}px;"></i>`)}</div>
    <div class="yp-flash"></div>
    ${suTitle('Millennium Rod', 'Marik Ishtar')}
    ${suBox('Marik Ishtar')}
    <p class="su-skip su-skip--1">Tap to skip</p>`;
}

// Maximillion Pegasus, facing you, in the same cel style: long straight silver
// hair with the lock over his left eye (ey-lock, lifts aside to show the
// Millennium Eye, ey-meye), his red suit and white jabot, and a glass of wine
// (ey-glass, falls and shatters: ey-shard). His expression is picked by the
// overlay's data-face (ey-x--*), and his hand (ey-hand) covers the empty eye.
const EY_SHARDS = [[-14, -10, 140], [-6, -16, -90], [4, -14, 200], [12, -8, -160], [16, 2, 110], [-12, 3, -220], [0, -20, 70]];
const EY_PEGASUS_SVG = `
  <svg class="ey-peg-svg" viewBox="0 0 200 260" aria-hidden="true">
    <g stroke="#0b0b12" stroke-width="2" stroke-linejoin="round" stroke-linecap="round">
      <path d="M100 42 Q54 44 50 98 Q48 160 40 238 L58 232 L64 244 L76 200 L124 200 L136 244 L142 232 L160 238 Q152 160 150 98 Q146 44 100 42 Z" fill="#e8eaf0"/>
      <path d="M58 120 Q54 180 50 226 M142 120 Q146 180 150 226" fill="none" stroke="#b8bfcc" stroke-width="1.4"/>
      <path d="M24 260 Q28 212 70 198 L90 190 L110 190 L130 198 Q172 212 176 260 Z" fill="#c81e1e"/>
      <path d="M80 198 L90 190 L110 190 L120 198 L114 260 L86 260 Z" fill="#f8fafc"/>
      <path d="M80 198 Q70 226 72 260 L88 260 L92 236 Z M120 198 Q130 226 128 260 L112 260 L108 236 Z" fill="#8f1515"/>
      <path d="M44 224 Q48 244 46 260 M156 224 Q152 244 154 260" fill="none" stroke="#7f1d1d" stroke-width="1.5"/>
      <path d="M90 158 L90 194 Q100 202 110 194 L110 158 Z" fill="#f6dcc8" stroke-width="1.8"/>
      <path d="M90.9 164 L100 176 L109.1 164 L109.1 175 Q100 185 90.9 175 Z" fill="#e2bba3" stroke="none"/>
      <path d="M88 190 Q100 198 112 190 Q117 197 110 202 Q117 208 108 213 Q114 219 105 224 Q107 231 100 234 Q93 231 95 224 Q86 219 92 213 Q83 208 90 202 Q83 197 88 190 Z" fill="#fff" stroke-width="1.6"/>
      <path d="M92 202 Q100 206 108 202 M93 213 Q100 217 107 213 M96 224 Q100 227 104 224" fill="none" stroke="#cbd5e1" stroke-width="1.1"/>
    </g>

    <path d="M68 104 L68 134 Q72 154 86 166 L100 173 L114 166 Q128 154 132 134 L132 104 Z" fill="#f6dcc8" stroke="#0b0b12" stroke-width="2" stroke-linejoin="round"/>
    <path d="M69 106 L131 106 L131 122 Q100 114 69 122 Z" fill="#e2bba3"/>
    <path d="M69 138 Q74 154 86 164 L89 161 Q78 151 75 137 Z" fill="#e2bba3"/>
    <path d="M100.5 139 L97.5 148 L101.5 147.6 Z" fill="#d1a68c"/>

    <g class="ey-meye">
      <path d="M105 130.5 Q114.5 124 124 129.5 Q115 137 105 130.5 Z" fill="#fbbf24" stroke="#0b0b12" stroke-width="1.4" stroke-linejoin="round"/>
      <circle cx="114.5" cy="130.4" r="3" fill="#78350f"/>
      <circle cx="114.5" cy="130.4" r="1.2" fill="#fde68a"/>
      <path d="M106 125.5 Q114.5 120 123.5 124.5 M110 135 L108.5 139" fill="none" stroke="#92400e" stroke-width="1.3" stroke-linecap="round"/>
    </g>

    <g class="ey-x ey-x--calm">
      <path d="M77.5 120.5 Q87 116 97 119.5" fill="none" stroke="#9ca3af" stroke-width="2" stroke-linecap="round"/>
      <path d="M80 131 Q88 127.5 96 130.5 Q88 135 80 131 Z" fill="#fff"/>
      <circle cx="88.5" cy="131.4" r="3.2" fill="#7c4a1e"/>
      <ellipse cx="88.5" cy="133" rx="2.2" ry="1.3" fill="#d6a058"/>
      <circle cx="88.5" cy="131.2" r="1.3" fill="#0b0b12"/>
      <circle cx="89.9" cy="130" r="0.9" fill="#fff"/>
      <path d="M79.5 130.6 Q88 126.4 96.5 130 L96.5 131.2 Q88 128.8 79.5 132 Z" fill="#f6dcc8"/>
      <path d="M77.5 131 Q88 126 97.5 130.4" fill="none" stroke="#0b0b12" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M81 133.2 Q88 136.4 95.5 132.6" fill="none" stroke="#0b0b12" stroke-width="1" stroke-linecap="round"/>
    </g>
    <g class="ey-x ey-x--shock">
      <path d="M77 115.5 Q87 110.5 97 114.5" fill="none" stroke="#9ca3af" stroke-width="2" stroke-linecap="round"/>
      <path d="M79.5 130 Q87.5 123.5 96 128.5 Q88.5 136.5 79.5 130 Z" fill="#fff"/>
      <circle cx="88" cy="130.2" r="1.9" fill="#7c4a1e"/>
      <circle cx="88" cy="130.2" r="0.9" fill="#0b0b12"/>
      <path d="M77.5 129.5 Q87.5 122 97.5 128" fill="none" stroke="#0b0b12" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M80.5 132.5 Q88 137.6 95.5 131.4" fill="none" stroke="#0b0b12" stroke-width="1" stroke-linecap="round"/>
    </g>
    <g class="ey-x ey-x--sad">
      <path d="M77.5 121 Q87 120 97 115.5" fill="none" stroke="#9ca3af" stroke-width="2" stroke-linecap="round"/>
      <path d="M80 131.5 Q88 129 96 130.5 Q88 135.5 80 131.5 Z" fill="#fff"/>
      <circle cx="88" cy="132.6" r="2.9" fill="#7c4a1e"/>
      <circle cx="88" cy="132.6" r="1.2" fill="#0b0b12"/>
      <circle cx="89.2" cy="132.4" r="0.8" fill="#fff"/>
      <path d="M79.5 131.4 Q88 128.6 96.5 130.2 L96.5 131.2 Q88 130 79.5 132.6 Z" fill="#f6dcc8"/>
      <path d="M77.5 131.2 Q88 127.4 97.5 129.8" fill="none" stroke="#0b0b12" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M81 133.6 Q88 136.4 95.5 133" fill="none" stroke="#0b0b12" stroke-width="1" stroke-linecap="round"/>
    </g>
    <g class="ey-x ey-x--closed">
      <path d="M77.5 121 Q87 120 97 115.5" fill="none" stroke="#9ca3af" stroke-width="2" stroke-linecap="round"/>
      <path d="M78.5 131 Q88 135.5 97 130.5 M80 131.8 L77.5 133.6" fill="none" stroke="#0b0b12" stroke-width="2.2" stroke-linecap="round"/>
    </g>
    <path class="ey-x ey-x--tear" d="M84 136.5 Q81.6 141 84 142.6 Q86.4 141 84 136.5 Z" fill="#bae6fd" stroke="#0b0b12" stroke-width="0.8"/>

    <path class="ey-x ey-x--smirk" d="M92 156.5 Q99 158.6 105.5 154.4" fill="none" stroke="#7a2e1a" stroke-width="1.5" stroke-linecap="round"/>
    <path class="ey-x ey-x--open" d="M95 155.5 Q100 153 105 155.5 Q105 162.5 100 163 Q95 162.5 95 155.5 Z" fill="#5c1d0c" stroke="#0b0b12" stroke-width="1.2" stroke-linejoin="round"/>
    <path class="ey-x ey-x--frown" d="M94 158.6 Q99.5 155.6 105 158.4" fill="none" stroke="#7a2e1a" stroke-width="1.5" stroke-linecap="round"/>
    <path class="ey-x ey-x--smile" d="M94 156 Q99.5 159.4 105 156" fill="none" stroke="#7a2e1a" stroke-width="1.5" stroke-linecap="round"/>

    <g stroke="#0b0b12" stroke-width="1.8" stroke-linejoin="round">
      <path d="M66 104 Q58 150 60 216 L68 206 L72 220 L76 170 Q72 134 72 108 Z M134 104 Q142 150 140 216 L132 206 L128 220 L124 170 Q128 134 128 108 Z" fill="#e8eaf0"/>
      <path d="M60 112 Q56 64 100 60 Q144 64 140 112 L132 100 L100 72 L94 98 Q84 100 77 110 L71 104 L65 116 Z" fill="#e8eaf0"/>
      <path d="M90 66 Q74 74 68 100 M84 80 Q78 90 76 104" fill="none" stroke="#b8bfcc" stroke-width="1.3"/>
      <g class="ey-lock">
        <path d="M96 62 Q132 66 139 102 Q142 142 128 186 L122 170 L114 180 Q104 150 102 128 Q100 108 94 96 Z" fill="#e8eaf0"/>
        <path d="M104 74 Q126 92 128 140 M110 98 Q118 124 118 162" fill="none" stroke="#b8bfcc" stroke-width="1.3"/>
      </g>
    </g>
    <path class="ey-x ey-x--sweat" d="M140 108 Q135.5 117 140 119.6 Q144.5 117 140 108 Z" fill="#bae6fd" stroke="#0b0b12" stroke-width="1"/>

    <g stroke="#0b0b12" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round">
      <g class="ey-glass">
        <path d="M44 178 Q43 196 56 199 Q69 196 68 178 Z" fill="#e0f2fe" fill-opacity="0.55"/>
        <path d="M44.8 187 Q47 196.4 56 198 Q65 196.4 67.2 187 Z" fill="#9f1239" stroke="none"/>
        <path d="M56 199 L56 216 M49 217 Q56 213.5 63 217" fill="none"/>
        <path d="M47.5 182 Q47 190 50 194" fill="none" stroke="#fff" stroke-width="1.2"/>
      </g>
      <g class="ey-shatter">${EY_SHARDS.map(([dx, dy, r]) => `<polygon points="54,250 58,248 56,254" fill="#e0f2fe" stroke-width="0.6" style="--dx: ${dx}px; --dy: ${dy}px; --r: ${r}deg;"/>`).join('')}</g>
      <path d="M28 262 Q34 236 48 224 L62 234 Q50 246 48 262 Z" fill="#c81e1e"/>
      <path d="M45 226 Q51 216 62 219 Q64 230 58 234 Q52 228 45 226 Z" fill="#fff"/>
      <rect x="50" y="203" width="13" height="16" rx="5" fill="#f6dcc8"/>
      <path d="M51 208 L62 208 M51 213 L62 213" fill="none" stroke="#d1a68c" stroke-width="1"/>
    </g>

    <g class="ey-hand" stroke="#0b0b12" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round">
      <path d="M146 262 Q146 214 128 172 L142 164 Q166 208 174 262 Z" fill="#c81e1e"/>
      <path d="M126 174 Q132 164 144 162 Q148 172 140 178 Q134 174 126 174 Z" fill="#fff"/>
      <path d="M106 122 Q118 112 132 120 L138 152 Q136 170 122 170 Q108 166 106 150 Q102 136 106 122 Z" fill="#f6dcc8"/>
      <path d="M112 122 L111 150 M119 118 L119 152 M126 119 L127 150" fill="none" stroke="#d1a68c" stroke-width="1.2"/>
    </g>
  </svg>`;

// Cyndia, Pegasus' late love, in a small gold-framed portrait: long golden
// hair, a gentle closed-eye smile and a pale blue dress.
const EY_CYNDIA_SVG = `
  <svg viewBox="0 0 80 100" aria-hidden="true">
    <defs><radialGradient id="ey-cy-bg" cx="0.5" cy="0.4" r="0.7"><stop offset="0" stop-color="#fff7ed"/><stop offset="1" stop-color="#fbcfe8"/></radialGradient></defs>
    <rect width="80" height="100" fill="url(#ey-cy-bg)"/>
    <g stroke="#3f2a1d" stroke-width="1.2" stroke-linejoin="round" stroke-linecap="round">
      <path d="M40 16 Q18 17 16 44 Q14 72 10 100 L70 100 Q66 72 64 44 Q62 17 40 16 Z" fill="#fcd34d"/>
      <path d="M14 100 Q16 80 30 76 L40 80 L50 76 Q64 80 66 100 Z" fill="#93c5fd"/>
      <path d="M35 66 L35 78 Q40 82 45 78 L45 66 Z" fill="#fbe3d3"/>
      <path d="M25 40 L25 54 Q27 64 35 69 L40 71 L45 69 Q53 64 55 54 L55 40 Z" fill="#fbe3d3"/>
      <circle cx="30.5" cy="58" r="2.4" fill="#fda4af" stroke="none" opacity="0.6"/><circle cx="49.5" cy="58" r="2.4" fill="#fda4af" stroke="none" opacity="0.6"/>
      <path d="M30 52 Q33.5 54.6 37 52 M43 52 Q46.5 54.6 50 52" fill="none" stroke-width="1.3"/>
      <path d="M37 62 Q40 64.4 43 62" fill="none" stroke="#b45309" stroke-width="1"/>
      <path d="M23 50 Q21 25 40 22 Q59 25 57 50 L52 38 Q46 31 40 35 Q33 31 28 38 Z" fill="#fcd34d"/>
    </g>
  </svg>`;

// The thank-you card after the fade to black (also shown still under reduced
// motion). Lines appear one by one (--d), then the seven Items light up.
function eyThanks() {
  const theme = APP_THEMES.find(t => t.id === 'millennium');
  const canWear = isThemeAvailable(theme) && document.documentElement.dataset.theme !== 'millennium';
  return `
    <div class="ey-thanks">
      <p class="ey-t ey-t--title" style="--d: 0.6s;">Thank you for playing</p>
      <p class="ey-t" style="--d: 2.2s;">You conquered every road and gathered all seven Millennium Items.</p>
      <div class="ey-t ey-shelf" style="--d: 3.6s;">${SOLO_SHELF.map((item, i) => `<span style="--i: ${i};">${soloShelfIcon(item.id)}</span>`).join('')}</div>
      <p class="ey-t ey-t--unlock" style="--d: 6.2s;"><span class="ce-emoji">👁️</span> Millennium theme unlocked</p>
      ${canWear ? `<button type="button" class="ey-t ey-wear" style="--d: 7s;" onclick="suWearMillenniumTheme(this, event)">Put it on</button>` : ''}
      <p class="ey-t ey-sign" style="--d: 8.2s;">— Mathias</p>
      <p class="ey-t ey-close" style="--d: 9.6s;">Tap to close</p>
    </div>`;
}

function suWearMillenniumTheme(button, event) {
  event.stopPropagation();
  setAppTheme('millennium');
  button.disabled = true;
  button.textContent = '✓ Millennium theme on';
}

// Pegasus' castle duel hall at night: stained-glass windows, candles, a red
// carpet. Then his Life Points, the mind-reading cards, burning Toon World
// pages, Cyndia's portrait, the Eye with the six other Items circling it, and
// the fade to black with the thank-you card.
function eyStage() {
  const pages = ceRange(fxCount(14), () => `<i style="--x: ${ceRand(6, 94).toFixed(1)}%; --y: ${ceRand(48, 82).toFixed(1)}%; --d: ${ceRand(2.6, 3.8).toFixed(1)}s; --delay: ${ceRand(0, 2.2).toFixed(1)}s; --r: ${ceRand(-200, 200).toFixed(0)}deg; --sway: ${ceRand(-40, 40).toFixed(0)}px;"></i>`);
  const orbit = SOLO_SHELF.filter(item => item.id !== 'eye').map((item, i) =>
    `<span style="--a: ${i * 60}deg; --i: ${i};"><span class="ey-orb">${soloShelfIcon(item.id)}</span></span>`).join('');
  return `
    <div class="ey-hall">
      <span class="ey-window ey-window--l"></span><span class="ey-window ey-window--r"></span>
      <span class="ey-carpet"></span>
      ${ceRange(4, i => `<span class="ey-candle" style="--i: ${i};"></span>`)}
    </div>
    <div class="ey-shaft"></div>
    <div class="yp-rays"></div>
    <div class="ey-lp"><span>Pegasus</span><b data-lp>1200</b></div>
    <div class="ey-cyndia">${EY_CYNDIA_SVG}</div>
    <div class="ey-peg">${EY_PEGASUS_SVG}</div>
    <div class="ey-scan">${ceRange(3, i => `<i style="--i: ${i};"></i>`)}</div>
    <div class="ey-cards">${ceRange(5, i => `<i style="--i: ${i};"></i>`)}</div>
    <div class="ey-pages">${pages}</div>
    <div class="ey-orbit"><div class="ey-orbit-spin">${orbit}</div></div>
    <div class="ey-item">${soloShelfIcon('eye')}</div>
    <div class="yp-flash"></div>
    ${suTitle('Millennium Eye', 'Maximillion Pegasus')}
    ${suBox('Maximillion Pegasus')}
    <p class="su-skip su-skip--1">Tap to skip</p>
    <div class="ey-black"></div>
    ${eyThanks()}`;
}

// His Life Points tick down to 0 (the final blow).
function eyDrainLp(s) {
  const el = s.el.querySelector('[data-lp]');
  const from = 1200, ms = 1200, start = performance.now();
  const tick = now => {
    const k = Math.min(1, (now - start) / ms);
    el.textContent = Math.round(from * (1 - k));
    if (k < 1 && el.isConnected) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

function ypStage() {
  const pieces = YP_PIECES.map(([pts, fx, fy, rot], i) =>
    `<polygon class="yp-piece" style="--i: ${i}; --fx: ${fx}px; --fy: ${fy}px; --rot: ${rot}deg;" points="${pts}" fill="url(#yp-gold)" stroke="#78350f" stroke-width="0.9" stroke-linejoin="round"/>`).join('');
  // Soul Room: endless stairs and doors at odd angles.
  const stairs = (x, y, r, n) => `<g transform="translate(${x} ${y}) rotate(${r})"><polyline points="${Array.from({ length: n }, (_, k) => `${k * 6},${-k * 5} ${k * 6},${-(k + 1) * 5} ${(k + 1) * 6},${-(k + 1) * 5}`).join(' ')}"/></g>`;
  const door = (x, y, r, s = 1) => `<g transform="translate(${x} ${y}) rotate(${r}) scale(${s})"><path d="M0 0 L0 -14 Q5 -20 10 -14 L10 0 Z"/><circle cx="8" cy="-6" r="0.8"/></g>`;
  return `
    <div class="yp-bg"></div>
    <svg class="yp-room" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <g fill="none" stroke="#c4b5fd" stroke-width="0.5" stroke-linejoin="round">
        ${stairs(4, 96, -10, 7)}${stairs(58, 30, 160, 6)}${stairs(70, 98, -55, 5)}${stairs(10, 40, 35, 5)}${stairs(92, 62, 200, 6)}
        ${door(20, 22, 12)}${door(80, 18, -25, 0.8)}${door(12, 72, -30, 0.7)}${door(86, 86, 18, 0.9)}${door(46, 12, 180, 0.6)}
      </g>
    </svg>
    <div class="yp-flare"><svg viewBox="90 50 180 220" aria-hidden="true">${SEV_EYE}</svg></div>
    <div class="yp-rays"></div>
    <div class="yp-yami">${YAMI_SVG}</div>
    <div class="yp-puzzle">
      <svg viewBox="0 0 40 40" aria-hidden="true">
        <defs><linearGradient id="yp-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#fef3c7"/><stop offset="0.35" stop-color="#fbbf24"/><stop offset="0.7" stop-color="#d97706"/><stop offset="1" stop-color="#92400e"/>
        </linearGradient></defs>
        ${pieces}
        <g class="yp-puzzle-eye">
          <path d="M12 12 Q20 8 28 12" fill="none" stroke="#78350f" stroke-width="1.4" stroke-linecap="round"/>
          <path d="M12 16 Q20 11 28 16 Q20 21 12 16 Z" fill="#78350f"/><circle cx="20" cy="16" r="2.2" fill="#fde68a"/>
          <path d="M17 19.5 L15.5 24" stroke="#78350f" stroke-width="1.2" stroke-linecap="round"/>
        </g>
      </svg>
    </div>
    <div class="yp-flash"></div>
    <div class="su-dust">${ceRange(fxCount(20), () => `<i style="--x: ${ceRand(0, 100).toFixed(1)}%; --d: ${ceRand(4, 8).toFixed(1)}s; --delay: ${(-ceRand(0, 8)).toFixed(1)}s; --s: ${ceRand(2, 4).toFixed(1)}px;"></i>`)}</div>
    ${suTitle('Millennium Puzzle', 'Yami Yugi')}
    ${suBox('Yami Yugi')}
    <p class="su-skip su-skip--1">Tap to skip</p>`;
}

// Each scene: its stage, its sound, a timeline of [ms, step] and, under reduced
// motion, a pill instead of the overlay.
const SU_SCENES = {
  puzzle: {
    sound: 'su-puzzle',
    stage: ypStage,
    pill: '<span class="ce-emoji">🔺</span> Millennium Puzzle obtained!',
    steps: [
      [400, s => s.pose('flare')],
      [900, s => s.pose('yami')],
      [1700, s => s.say('You walked the whole road… and defeated Pegasus.')],
      [3700, s => s.say('I sensed the heart of the cards in you from your very first duel.')],
      [5500, s => { s.pose('lift'); s.say('This is yours now.'); }],
      [6100, s => s.pose('assemble')],
      [7300, s => s.pose('obtained')],
      [8100, s => s.say('Believe in the heart of the cards.')],
      [10400, s => s.end()]
    ]
  },
  necklace: {
    sound: 'su-necklace',
    stage: izStage,
    pill: '<span class="ce-emoji">👁️</span> Millennium Necklace obtained! <span class="ce-emoji">⚔️</span> Hard unlocked',
    steps: [
      [400, s => s.pose('ishizu')],
      [1300, s => s.say('I am Ishizu Ishtar, keeper of the Millennium Necklace.')],
      [3300, s => s.say('Twice you have defeated Pegasus. The Necklace foresaw it.')],
      [5200, s => { s.pose('vision'); s.say('And it shows me more: a harder road, where no duelist shows mercy.'); }],
      [7600, s => { s.pose('give'); s.say(''); }],
      [8100, s => s.pose('obtained')],
      [8900, s => s.say('Walk it. Your future is not yet written.')],
      [11400, s => s.end()]
    ]
  },
  scale: {
    sound: 'su-scale',
    stage: sdStage,
    pill: '<span class="ce-emoji">⚖️</span> Millennium Scale obtained!',
    steps: [
      [400, s => s.pose('shadi')],
      [1300, s => s.say('I am Shadi. I guard the Millennium Items and judge those who seek them.')],
      [3500, s => s.say('You have walked the hard road and defeated Pegasus. Now the Scale shall weigh your heart.')],
      [5600, s => { s.pose('weigh'); s.say('If your heart is heavier than the feather of Ma\'at, the Scale will take it.'); }],
      [8300, s => { s.pose('balanced'); s.say('…It balances. Your heart is true.'); }],
      [9600, s => s.pose('obtained')],
      [10200, s => s.say('The Scale is yours. Judge fairly, as it has judged you.')],
      [12600, s => s.end()]
    ]
  },
  key: {
    sound: 'su-key',
    stage: kyStage,
    pill: '<span class="ce-emoji">🗝️</span> Millennium Key obtained! <span class="ce-emoji">💀</span> Nightmare unlocked',
    steps: [
      [400, s => s.pose('shadi')],
      [1300, s => s.say('We meet again. Twice now you have conquered the hard road.')],
      [3500, s => s.say('The Millennium Key opens the door to any soul. Let us see what lies behind yours.')],
      [5700, s => { s.pose('unlock'); s.say('Your door is sealed… The Key will open it.'); }],
      [7200, s => s.pose('turn')],
      [8400, s => { s.pose('open'); s.say('Beyond it lies the Nightmare road. Few who walk it ever return.'); }],
      [10600, s => s.pose('obtained')],
      [11400, s => s.say('The Key is yours now. Open the door… if you dare.')],
      [13800, s => s.end()]
    ]
  },
  ring: {
    sound: 'su-ring',
    stage: brStage,
    pill: '<span class="ce-emoji">💍</span> Millennium Ring obtained!',
    steps: [
      [400, s => s.pose('bakura')],
      [1300, s => s.say('Heh heh heh… So you\'re the one who survived the Nightmare road.')],
      [3500, s => s.say('Pegasus fell to you. Pity… I wanted his Eye for my collection.')],
      [5600, s => { s.pose('point'); s.say('The Ring\'s pointers never lie. They seek out whoever is worthy of the Items…'); }],
      [7400, s => { s.pose('lock'); s.say('…and every one of them points to you.'); }],
      [9000, s => s.pose('obtained')],
      [9800, s => s.say('Take it… for now. The Ring always finds its way home. Heh heh heh…')],
      [12400, s => s.end()]
    ]
  },
  rod: {
    sound: 'su-rod',
    stage: rdStage,
    pill: '<span class="ce-emoji">🪄</span> Millennium Rod obtained!',
    steps: [
      [400, s => s.pose('marik')],
      [1300, s => s.say('I am Marik Ishtar. Twice now you have conquered the Nightmare road.')],
      [3500, s => s.say('No mind can resist the Millennium Rod. Let us see if yours bends to my will!')],
      [5500, s => { s.pose('control'); s.say('Kneel… Your mind belongs to me now…'); }],
      [7300, s => { s.pose('resist'); s.say('…What?! Your will is too strong for the Rod!'); }],
      [9000, s => s.pose('obtained')],
      [9800, s => s.say('Then the Rod is yours. Use it to guide minds… not to chain them.')],
      [12400, s => s.end()]
    ]
  },
  eye: {
    sound: 'su-eye',
    stage: eyStage,
    lifetimeMs: 10 * 60 * 1000,
    pill: '<span class="ce-emoji">👁️</span> Millennium Eye obtained! Millennium theme unlocked',
    still: eyThanks,
    steps: [
      [0, s => s.face('shock')],
      [300, s => s.pose('hall')],
      [700, s => { s.pose('drain'); eyDrainLp(s); }],
      [2000, s => s.pose('zero')],
      [3000, s => { s.pose('pegasus'); s.say('No… no, no, no. This cannot be.'); }],
      [5200, s => s.say('I am Maximillion Pegasus! I created this game! I saw every card you would ever play!')],
      [7600, s => { s.pose('read'); s.face('smug'); s.say('Let me look once more… Show me your hand, duelist.'); }],
      [9600, s => { s.pose('blind'); s.face('shock'); s.say('…Nothing? Only light! Your heart… is closed to me?!'); }],
      [11400, s => s.pose('drop')],
      [12200, s => { s.pose('kneel'); s.face('sad'); s.say('My Toons… my castle… everything I built, gone.'); }],
      [14600, s => { s.pose('cyndia'); s.face('cry'); s.say('Cyndia… forgive me, my love. I was so close.'); }],
      [17400, s => { s.pose('bow'); s.face('closed'); s.say('You have beaten me on every road. I have nothing left to wager.'); }],
      [19800, s => { s.pose('offer'); s.say('Take it. The Eye was never mine to keep.'); }],
      [21800, s => s.pose('items')],
      [22800, s => s.pose('obtained')],
      [23600, s => { s.face('soft'); s.say('Farewell, duelist. It was… a magnificent game.'); }],
      [26400, s => s.pose('fade')],
      [28400, s => s.outro()]
    ],
    // Skipping jumps straight here; the next tap closes it.
    outro: s => {
      s.pose('fade');
      s.pose('thanks');
      playSound({ name: 'su-eye-thanks' });
    }
  }
};

function playSoloUnlockScene(key) {
  const scene = SU_SCENES[key];
  if (!scene) return;
  playSound({ name: scene.sound });
  const overlay = spawnFx(`fx-cegg fx-su fx-su--${key}`, scene.lifetimeMs || 60 * 1000, { html: scene.stage() });
  if (!overlay) {
    if (scene.pill) showEggPill(scene.pill);
    if (scene.still) suStill(key, scene.still());
    return;
  }

  const timers = [];
  const bubbles = [...overlay.querySelectorAll('[data-say]')];
  const started = Date.now();
  let done = false;
  let outroAt = 0;
  const s = {
    el: overlay,
    pose: cls => overlay.classList.add(cls),
    face: name => { overlay.dataset.face = name; },
    say: (html, title = false) => bubbles.forEach(b => {
      b.innerHTML = html;
      b.classList.toggle('is-title', title);
      restartClass(b, 'is-on', 60 * 1000);
    }),
    outro: () => {
      if (outroAt || done) return;
      outroAt = Date.now();
      timers.forEach(clearTimeout);
      stopSoloSceneSound();
      scene.outro(s);
    },
    end: () => {
      if (done) return;
      done = true;
      timers.forEach(clearTimeout);
      stopSoloSceneSound();
      overlay.classList.add('is-out');
      setTimeout(() => overlay.remove(), SU_FADE_MS);
    }
  };
  scene.steps.forEach(([ms, fn]) => timers.push(setTimeout(() => fn(s), ms)));
  overlay.addEventListener('click', () => {
    if (Date.now() - started < SU_SKIP_AFTER_MS) return;
    if (scene.outro && !outroAt) s.outro();
    else if (!outroAt || Date.now() - outroAt > SU_OUTRO_CLOSE_MS) s.end();
  });
}

// Reduced motion: the outro card alone, without animation. A tap closes it.
function suStill(key, html) {
  const el = document.createElement('div');
  el.className = `fx-cegg fx-su fx-su--${key} fade thanks`;
  el.innerHTML = `<div class="ey-black"></div>${html}`;
  el.addEventListener('click', () => el.remove());
  getFxLayer().appendChild(el);
}
