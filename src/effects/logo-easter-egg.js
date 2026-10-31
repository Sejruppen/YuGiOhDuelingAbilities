// Start-screen easter egg. Each tap on the logo boings it with a note that
// climbs a semitone, and the logo glows brighter and brighter. Every
// LOGO_TAPS_PER_PIECE taps in a row lights one of five orbs around the logo
// (the pieces of Exodia). Light all five without pausing too long and Exodia
// is summoned, traced after the anime's "Exodia, Obliterate!": the screen
// goes dark and the logo shrinks into a spark at his chest, his silhouette
// looms out of orange smoke and fire, the smoke parts, his eyes flash, his
// fists unfold into open claws, the spark swells into an energy ball that
// drowns his chest in light, and it fires and whites out the screen before
// it fades back to the start screen.
const LOGO_TAPS_PER_PIECE = 4;
const EXODIA_PIECE_COUNT = 5;
const LOGO_TAPS_TO_SUMMON = LOGO_TAPS_PER_PIECE * EXODIA_PIECE_COUNT;
const LOGO_COMBO_TIMEOUT_MS = 1800;
// Keep in sync with the `exo-*` timings in effects.css and 'logo-obliterate'.
const EXODIA_WHITEOUT_MS = 6800;
const EXODIA_TOTAL_MS = 10000;
// The energy ball sits this far down the screen (and at 1010/1600 of the art).
const EXODIA_ORB_Y = 0.6;

const logoEgg = { taps: 0, timer: null, busy: false };

// Pre-rendered WebP copies of the SVG layers in EXODIA_SVG (re-export them
// with tools/export-exodia-art.js after changing the drawing). Phones decode
// an image far faster than they rasterize the detailed SVG. The images are
// decoded ahead of time (on the first logo tap or Exodia card), and the SVG
// is the fallback until they're ready.
const EXODIA_ART = [['sil', 'body'], ['lit', 'body'], ['fists', 'hands'], ['open', 'hands']]
  .map(([name, box]) => ({ name, box, src: `./img/exodia-${name}.webp` }));
const exodiaArt = { images: null, ready: false };

function warmExodiaArt() {
  if (exodiaArt.images) return;
  exodiaArt.images = EXODIA_ART.map(({ src }) => {
    const img = new Image();
    img.src = src;
    return img;
  });
  Promise.all(exodiaArt.images.map(img => img.decode()))
    .then(() => { exodiaArt.ready = true; })
    .catch(() => { exodiaArt.images = null; });
}

const exodiaArtHtml = () => exodiaArt.ready
  ? EXODIA_ART.map(({ name, box, src }) => `<img class="exo-layer exo-${name} exo-img--${box}" src="${src}" alt="" />`).join('')
  : EXODIA_SVG;

const getLogoCharge = () => Math.min(1, logoEgg.taps / LOGO_TAPS_TO_SUMMON);
const getLogoPieces = () => Math.floor(logoEgg.taps / LOGO_TAPS_PER_PIECE);

function renderLogoEgg() {
  const pieces = getLogoPieces();
  const orbs = Array.from({ length: EXODIA_PIECE_COUNT }, (_, i) =>
    `<span class="logo-piece${i < pieces ? ' is-lit' : ''}" style="--i: ${i}"></span>`
  ).join('');

  return `
    <button type="button" onclick="tapLogo(this)" class="logo-egg mb-6" data-pieces="${pieces}" style="--logo-charge: ${getLogoCharge()}">
      <span class="logo-halo"></span>
      <span class="logo-egg-core">
        <img src="./logo.jpg" alt="Yu-Gi-Oh! Companion Icon" class="w-32 h-32 rounded-full border-2 border-amber-500/40 shadow-xl shadow-emerald-500/10 object-cover" />
      </span>
      ${orbs}
    </button>
  `;
}

function paintLogoEgg(logo = document.querySelector('.logo-egg')) {
  if (!logo) return;
  const pieces = getLogoPieces();
  logo.dataset.pieces = pieces;
  logo.style.setProperty('--logo-charge', getLogoCharge());
  logo.querySelectorAll('.logo-piece').forEach((el, i) => el.classList.toggle('is-lit', i < pieces));
}

function tapLogo(logo) {
  if (logoEgg.busy) return;

  clearTimeout(logoEgg.timer);
  warmExodiaArt();
  logoEgg.taps++;
  paintLogoEgg(logo);
  const pieces = getLogoPieces();
  logo.style.setProperty('--tilt', `${(logoEgg.taps % 2 ? -1 : 1) * (6 + getLogoCharge() * 18)}deg`);
  restartClass(logo, 'fx-logo-tap', 450);
  spawnParticles(logo, { type: 'quest', mode: 'burst', count: 6 + pieces * 3 });

  if (logoEgg.taps >= LOGO_TAPS_TO_SUMMON) {
    restartClass(logo.querySelectorAll('.logo-piece')[pieces - 1], 'fx-piece-pop', 500);
    summonExodia(logo);
    return;
  }

  if (logoEgg.taps % LOGO_TAPS_PER_PIECE === 0) {
    restartClass(logo.querySelectorAll('.logo-piece')[pieces - 1], 'fx-piece-pop', 500);
    playSound({ name: 'logo-piece', piece: pieces });
  } else {
    playSound({ name: 'logo-tap', combo: logoEgg.taps });
  }
  logoEgg.timer = setTimeout(scatterLogoPieces, LOGO_COMBO_TIMEOUT_MS);
}

function scatterLogoPieces() {
  if (getLogoPieces() > 0) playSound({ name: 'logo-scatter' });
  resetLogoEgg();
}

function resetLogoEgg() {
  logoEgg.taps = 0;
  paintLogoEgg();
}

function summonExodia(logo) {
  markEggFound('exodia');
  logoEgg.busy = true;
  playSound({ name: 'logo-obliterate' });

  // A copy of the logo glows above the darkness, then shrinks into a spark
  // that waits at Exodia's chest and ignites into the energy ball.
  // The Duel Disk game passes the Exodia card instead of the logo.
  const r = (logo.querySelector('img') || logo).getBoundingClientRect();
  // The flames and smoke are gradients on a few shared layers, and the embers
  // ride on one tall layer, instead of a separate animated layer per blob.
  const flameGradient = (i, n, front) => {
    const h = front ? ceRand(16, 30) : ceRand(45, 90);
    const b = front ? ceRand(-10, -2) : ceRand(-5, 30);
    return `radial-gradient(${(ceRand(24, 40) / 2).toFixed(0)}vw ${(h / 2).toFixed(0)}vh at ${((i + 0.5) * 100 / n + ceRand(-5, 5)).toFixed(1)}% calc(${(100 - b).toFixed(0)}% - ${(h / 2).toFixed(0)}vh), rgb(255 238 170 / 0.75), rgb(255 176 60 / 0.4) 55%, rgb(255 140 30 / 0))`;
  };
  const flameWall = (n, front, cls) => {
    const layers = [[], []];
    for (let i = 0; i < n; i++) layers[front ? 0 : i % 2].push(flameGradient(i, n, front));
    return layers.filter(l => l.length).map((l, j) => `<div class="exo-flames ${cls}${j}" style="background-image: ${l.join(', ')}"></div>`).join('');
  };
  const hazeColors = ['rgb(251 146 60 / 0.9)', 'rgb(234 108 24 / 0.85)', 'rgb(253 186 80 / 0.8)', 'rgb(250 160 60 / 0.9)', 'rgb(70 22 4 / 0.7)'];
  const haze = ceRange(fxCount(5), i => {
    const x = ceRand(5, 95);
    return `<span class="exo-haze" style="--x: ${x.toFixed(0)}%; --y: ${ceRand(20, 85).toFixed(0)}%; --s: ${ceRand(55, 80).toFixed(0)}vw; --c: ${hazeColors[i % hazeColors.length]}; --dx: ${((x < 50 ? -1 : 1) * ceRand(35, 60)).toFixed(0)}vw; --dy: ${ceRand(-18, 4).toFixed(0)}vh"></span>`;
  });
  const smokeCount = fxCount(4);
  const smoke = Array.from({ length: smokeCount }, (_, i) => {
    const s = ceRand(55, 85);
    return `radial-gradient(${(s / 2).toFixed(0)}vw ${(s / 2.8).toFixed(0)}vw at ${((i + 0.5) * 100 / smokeCount + ceRand(-6, 6)).toFixed(0)}% ${ceRand(-14, 6).toFixed(0)}%, rgb(46 14 3 / 0.9), rgb(70 22 4 / 0.55) 45%, rgb(70 22 4 / 0))`;
  }).join(', ');
  // Each ember appears in both halves of the 200%-tall layer so it loops.
  const embers = ceRange(fxCount(14), () => {
    const style = `left: ${ceRand(0, 100).toFixed(0)}%; --s: ${ceRand(2, 5).toFixed(1)}px`;
    const y = ceRand(0, 50);
    return `<span class="exo-ember" style="${style}; top: ${y.toFixed(1)}%"></span><span class="exo-ember" style="${style}; top: ${(y + 50).toFixed(1)}%"></span>`;
  });
  // Each ray of the burst is its own thin layer, which is far cheaper than
  // one huge masked layer that the phone has to rasterize as the ball fires.
  const rayCount = fxCount(24);
  const rays = ceRange(rayCount, i => `<span class="exo-ray" style="--a: ${(i * 360 / rayCount + ceRand(-3, 3)).toFixed(0)}deg"></span>`);

  const overlay = spawnFx('fx-exodia', EXODIA_TOTAL_MS + 100, {
    vars: {
      '--lx': `${r.left}px`,
      '--ly': `${r.top}px`,
      '--ls': `${r.width}px`,
      '--tx': `${window.innerWidth / 2 - (r.left + r.width / 2)}px`,
      '--ty': `${window.innerHeight * EXODIA_ORB_Y - (r.top + r.height / 2)}px`
    },
    html: `
      <div class="exo-scene">
        <div class="exo-black"></div>
        <div class="exo-bg"></div>
        ${flameWall(fxCount(6), false, 'exo-flames--back')}
        <div class="exo-smoke" style="background-image: ${smoke}"></div>
        <div class="exo-figure-wrap"><div class="exo-body">
          ${exodiaArtHtml()}
          <span class="exo-hem"></span>
          <span class="exo-eye" style="--x: 46.865%"></span>
          <span class="exo-eye" style="--x: 53.135%"></span>
          <span class="exo-glint"></span>
          <span class="exo-orb">${EXO_ORB_RAYS_SVG}</span>
        </div></div>
        <div class="exo-floor"></div>
        ${flameWall(fxCount(4), true, 'exo-flames--front')}
        <div class="exo-veil"></div>
        <div class="exo-fill">${haze}</div>
        <div class="exo-fill"><div class="exo-embers">${embers}</div></div>
        <div class="exo-wash"></div>
        <div class="exo-blast"></div>
        <div class="exo-burst">${rays}</div>
        <div class="exo-logo"><span class="exo-logo-glow"></span><img src="./logo.jpg" alt="" /><span class="exo-logo-flash"></span></div>
      </div>
      <div class="exo-white"></div>
    `
  });

  setTimeout(() => {
    // The hidden scene keeps its infinite animations running, which starves
    // the white fade of frames so it pops instead of fading. Drop it once
    // the screen is fully white.
    overlay?.querySelector('.exo-scene')?.remove();
    resetLogoEgg();
  }, EXODIA_WHITEOUT_MS);
  setTimeout(() => { logoEgg.busy = false; }, EXODIA_TOTAL_MS);
}

// --- The drawing ---------------------------------------------------------------
// Exodia is traced after the anime's Obliterate scene in a 1000×1600 space,
// with shaded cel colours and dark ink outlines: the pointed horns,
// tall gold crest above the folded pink-and-cream nemes, the small crown
// between them, the grinning gold-and-blue face with the
// cobra on its forehead and the long beard, the round golden body with the
// raised spiral tubes on its chest, the huge rolled shoulder pads, the ribbed
// red belly, the belt medallion and the fanned skirt, and the red shackles
// with broken chain stubs on both wrists. The hands are separate layers so they can swap
// from clenched fists to cupped claws. The body halves share <use> copies;
// each hand has its own perspective. The ball is at (500, 1010), eyes at y 715.25.
const EXO_INK = '#2b1406';
const EXO_CREAM = '#f3e2b3';
const EXO_SHINE = '#fff0bb';
const EXO_SHACKLE = '#8e3b1b';

const svgNum = n => Math.round(n * 10) / 10;

// The rays spinning around the energy ball: thin wedges whose fade is baked
// into a gradient (a CSS mask would add a second texture the size of the ball).
const EXO_ORB_RAYS_SVG = `<svg class="exo-orb-rays" viewBox="-100 -100 200 200" aria-hidden="true">
  <defs><radialGradient id="exo-ray-fade" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="100">
    <stop offset="0.25" stop-color="#fffad2" stop-opacity="0" />
    <stop offset="0.4" stop-color="#fffad2" stop-opacity="0.8" />
    <stop offset="1" stop-color="#fffad2" stop-opacity="0" />
  </radialGradient></defs>
  <g fill="url(#exo-ray-fade)">${Array.from({ length: 15 }, (_, i) => {
    const a = (i * 24 + 11) * Math.PI / 180;
    const h = 2 * Math.PI / 180;
    return `<polygon points="0,0 ${svgNum(100 * Math.cos(a - h))},${svgNum(100 * Math.sin(a - h))} ${svgNum(100 * Math.cos(a + h))},${svgNum(100 * Math.sin(a + h))}" />`;
  }).join('')}</g>
</svg>`;

const exoMirror = (id, body, centreX = 500) => `<g id="${id}">${body}</g><use href="#${id}" transform="matrix(-1 0 0 1 ${centreX * 2} 0)"/>`;

// An outlined cream tube for the raised chest spirals.
const exoBand = (d, w = 7) => `
  <path d="${d}" fill="none" stroke="${EXO_INK}" stroke-width="${w + 7}"/>
  <path d="${d}" fill="none" stroke="${EXO_CREAM}" stroke-width="${w}"/>`;

const exoRivet = (x, y) => `
  <circle cx="${x}" cy="${y}" r="9" fill="#d99550" stroke-width="3"/>
  <circle cx="${x - 2.5}" cy="${y - 2.5}" r="3" fill="#ffe0b0" stroke="none"/>`;

// A chain hanging from (x0, y0) to (x1, y1): face-on rings, then the
// edge-on links on top of them.
function exoChain(x0, y0, x1, y1, n) {
  const step = Math.hypot(x1 - x0, y1 - y0) / n;
  const angle = Math.atan2(y1 - y0, x1 - x0) * 180 / Math.PI - 90;
  const link = i => {
    const f = (i + 0.5) / n;
    return `translate(${svgNum(x0 + (x1 - x0) * f)} ${svgNum(y0 + (y1 - y0) * f)}) rotate(${svgNum(angle)})`;
  };
  const ry = svgNum(step * 0.72);
  const rings = Array.from({ length: n }, (_, i) => i).filter(i => i % 2 === 0).map(i => `
    <g transform="${link(i)}">
      <ellipse rx="15" ry="${ry}" fill="none" stroke="${EXO_INK}" stroke-width="13"/>
      <ellipse rx="15" ry="${ry}" fill="none" stroke="#b8975c" stroke-width="6"/>
      <path d="M-11 ${-ry * 0.5} Q-14 0 -11 ${ry * 0.5}" fill="none" stroke="#f1dca8" stroke-width="2.5"/>
    </g>`).join('');
  const bars = Array.from({ length: n }, (_, i) => i).filter(i => i % 2 === 1).map(i => `
    <g transform="${link(i)}">
      <rect x="-7" y="${svgNum(-step * 0.78)}" width="14" height="${svgNum(step * 1.56)}" rx="7" fill="#c9a96a" stroke-width="4"/>
      <path d="M-2 ${svgNum(-step * 0.55)} V${svgNum(step * 0.55)}" stroke="#f1dca8" stroke-width="2.5"/>
    </g>`).join('');
  return rings + bars;
}

// Filled contours preserve the foreshortened pads and curved joint collars;
// straight, round-capped segments made the old hands look like upright rods.
function exoFinger({ outline, shadow, light, bands = [] }) {
  return `<g>
    <path d="${outline}"/>
    <path d="${shadow}" fill="#62401c" stroke="none" opacity="0.48" filter="url(#exo-hand-soft)"/>
    <path d="${light}" fill="#fff0ad" stroke="none" opacity="0.65" filter="url(#exo-hand-soft)"/>
    ${bands.map(d => `<path d="${d}" fill="url(#exo-g-hand-ring)" stroke="#604924" stroke-width="1.3"/>`).join('')}
  </g>`;
}

// Head paths use the reference frame's coordinates, with its centre at x 282.
// This uniform mapping preserves its proportions within the existing body.
const EXO_HEAD_TRANSFORM = 'translate(34.7 179) scale(1.65)';

// The left halves of the mirrored parts.
const EXO_HORN = `
  <g transform="${EXO_HEAD_TRANSFORM}" stroke-width="2.2">
    <path d="M61 43 C96 47 128 61 153 80 L167 130 L143 160 C129 116 96 75 61 43 Z" fill="url(#exo-g-horn)"/>
    <path d="M66 46 C102 66 128 88 143 122 L144 151 C121 106 94 72 66 46 Z" fill="#3c2816" stroke="none"/>
    <path d="M72 47 C104 54 127 66 146 82" fill="none" stroke="#d8a24e" stroke-width="1.8"/>
    <path d="M143 69 Q147 63 154 72 L169 89 L156 151 L143 156 C133 129 131 103 143 69 Z" fill="url(#exo-g-horn)"/>
    <path d="M160 65 Q164 56 170 65 L183 82 L165 151 L152 158 C141 131 145 99 160 65 Z" fill="url(#exo-g-horn)"/>
    <path d="M177 61 Q182 55 187 62 L197 84 L177 145 L161 157 C151 129 158 90 177 61 Z" fill="url(#exo-g-horn)"/>
    <path d="M145 83 Q134 122 145 149 M162 80 Q147 125 156 149 M178 76 Q163 122 167 144" fill="none" stroke="#21180e" stroke-width="3"/>
  </g>`;

const EXO_SHOULDER = `
  <path d="M-90 650 C30 660 150 662 230 650 C280 660 298 708 282 752 C264 796 212 814 150 810 L-90 810 Z" fill="url(#exo-g-gold)"/>
  <path d="M-60 700 C40 708 160 708 250 696" fill="none" stroke="${EXO_SHINE}" stroke-width="7" stroke-opacity="0.7"/>
  <path d="M-90 778 C40 790 170 790 262 770" fill="none" stroke="#8f5516" stroke-width="10" stroke-opacity="0.5"/>
  <path d="M-90 395 C-30 352 50 352 120 368 C205 390 268 448 282 530 C292 595 268 640 215 656 C130 672 30 664 -90 655 Z" fill="url(#exo-g-pad)"/>
  <path d="M-40 384 C30 366 100 372 160 396 C206 416 240 452 258 500" fill="none" stroke="#fff3c4" stroke-width="9" stroke-opacity="0.75"/>
  <path d="M-80 618 C40 630 170 628 262 600 C250 630 232 648 212 655 C130 670 30 664 -80 656 Z" fill="#8f5516" stroke="none" opacity="0.55"/>`;

// The lower cloth folds independently of the gold crest. Each filled stripe
// turns over the upper flare and into the hanging pleat beside the cheek.
const EXO_WING = 'M64 286 C91 262 122 239 151 234 C191 225 226 242 254 278 L253 305 C246 326 244 344 247 359 C226 346 211 335 195 340 C180 345 165 365 157 382 C140 357 126 326 117 298 C98 292 81 289 64 286 Z';
const EXO_WING_STRIPES = `
  <path d="M71 280 L84 270 C103 275 120 282 130 292 C138 319 150 348 165 369 L157 383 C141 358 126 327 118 299 C104 289 88 285 71 280 Z"/>
  <path d="M97 259 L109 251 C127 258 141 269 150 283 C156 309 166 331 177 348 L168 362 C154 341 145 315 140 291 C130 276 116 267 97 259 Z"/>
  <path d="M123 243 L136 237 C151 246 163 261 168 279 L181 321 L189 336 L180 346 C166 327 162 300 158 283 C151 265 139 252 123 243 Z"/>
  <path d="M151 234 Q159 231 167 232 C182 247 190 267 191 290 C192 302 197 307 204 310 L199 326 C187 321 182 308 181 294 C178 268 169 247 151 234 Z"/>
  <path d="M181 234 L197 239 C209 253 215 272 213 296 L202 300 C203 273 195 249 181 234 Z"/>
  <path d="M212 246 L225 253 C236 267 239 286 235 301 L224 298 C228 279 222 260 212 246 Z"/>
  <path d="M239 263 L254 277 L255 300 L245 305 C248 286 245 273 239 263 Z"/>
  <path d="M184 309 C203 295 224 299 251 310 L248 319 C222 307 204 304 187 317 Z"/>
  <path d="M188 324 C206 312 226 317 247 327 L246 335 C224 325 208 321 192 332 Z"/>
  <path d="M195 338 C211 330 228 336 246 344 L247 354 C225 343 211 338 201 345 Z"/>`;
const EXO_HEAD_HALF = `
  <g transform="${EXO_HEAD_TRANSFORM}" stroke-width="2.2">
    <path d="M151 153 C151 119 165 83 182 61 Q186 53 192 61 C225 95 255 173 267 267 L254 284 C230 232 194 182 151 153 Z" fill="url(#exo-g-crest)"/>
    <path d="M184 62 C215 102 244 186 260 264 L267 267 C255 173 225 95 192 61 Q187 55 184 62 Z" fill="#863e2d" stroke="none"/>
    <path d="M181 78 C167 109 164 133 170 159 L190 176 L183 145 L195 153 L201 175 L212 183 L203 151 L210 156 C200 124 188 104 181 78 Z" fill="#f3cf5e" stroke="none" opacity="0.55" filter="url(#exo-soft-gold)"/>
    <path d="M177 83 C164 108 161 128 165 147 L176 158 L172 138 L179 129 L177 112 L185 103 Z M195 142 L203 150 L207 173 L217 184 L217 196 L206 182 L201 166 Z" fill="#6b511e" stroke="none" opacity="0.38" filter="url(#exo-soft-gold)"/>
    <path d="M160 139 L170 153 L169 166 M183 149 L194 166 L194 180 M204 180 L215 197 L213 211 M231 218 L238 239 M177 124 L185 136" fill="none" stroke="#a27c31" stroke-width="1.2" stroke-opacity="0.7"/>
    <path d="M151 153 C118 167 80 222 64 286 C112 253 165 225 204 239 C226 247 244 265 254 284 C241 226 214 180 171 155 Q160 149 151 153 Z" fill="url(#exo-g-crest-side)"/>
    <path d="M151 155 C117 181 89 228 72 277 L64 286 C80 222 118 167 151 153 Q160 149 171 155 L180 162 Q161 155 151 155 Z" fill="#ae602c" stroke="none"/>
    <path d="M158 165 C133 182 114 207 104 229 C134 211 159 203 181 207 L195 218 L187 195 L178 185 L170 184 Z" fill="#e7bc52" stroke="none" opacity="0.38" filter="url(#exo-soft-gold)"/>
    <path d="M178 187 L190 196 L193 214 L207 226 L205 239 L196 225 L185 215 Z M127 207 L118 226 L126 222 L133 208 Z" fill="#795724" stroke="none" opacity="0.28" filter="url(#exo-soft-gold)"/>
    <path d="M171 158 C211 182 240 233 253 277" fill="none" stroke="#392616" stroke-width="2.5"/>
    <path d="M180 178 L188 189 L188 199 M200 200 L207 209 L205 218 M219 226 L227 237 L226 245 M114 219 L111 228 M135 193 L130 202" fill="none" stroke="#77501d" stroke-width="1.1" stroke-opacity="0.7"/>
    <path d="${EXO_WING}" fill="url(#exo-g-cloth)"/>
    <g clip-path="url(#exo-clip-wing)">
      <g fill="#ac367b" stroke="#623047" stroke-width="0.65">${EXO_WING_STRIPES}</g>
      <path d="M65 287 C106 260 143 249 174 267 C191 277 199 290 203 304 C217 298 232 303 254 313 L256 284 C224 258 203 247 180 246 C138 237 100 258 65 287 Z" fill="url(#exo-g-cloth-shadow)" stroke="none"/>
      <path d="M118 298 C132 324 142 359 157 382 L165 365 C149 337 145 312 143 289 Z" fill="#fff6bf" opacity="0.15" stroke="none"/>
      <path d="M192 302 C210 291 231 297 252 306 M195 339 C213 332 229 342 247 359" fill="none" stroke="#46262d" stroke-width="2.5" stroke-opacity="0.65"/>
      <path d="M190 307 C208 298 226 302 249 312 M193 321 C210 313 228 319 246 327 M198 335 C213 329 228 335 246 343" fill="none" stroke="#fff1b5" stroke-width="1.4" stroke-opacity="0.75"/>
    </g>
    <path d="${EXO_WING}" fill="none"/>
    <path d="M65 286 Q94 288 117 298 C128 330 140 359 157 382 C170 359 182 346 195 340" fill="none" stroke="#f8e9a1" stroke-width="1.4"/>
  </g>`;

const EXO_ARM_HALF = `
  <path d="M-90 1160 C40 1150 160 1160 252 1180 L205 1600 L-90 1600 Z" fill="#9a4f1c"/>
  <path d="M-60 1232 C40 1224 130 1230 222 1242" fill="none" stroke="#c97b3a" stroke-width="6"/>
  <path d="M-90 800 C20 790 140 800 200 830 L215 1020 C190 1100 140 1160 60 1180 L-90 1180 Z" fill="#b37a2b"/>
  <path d="M-90 880 C-30 870 30 875 92 890 L106 1150 C40 1160 -30 1160 -90 1165 Z" fill="${EXO_SHACKLE}"/>
  <path d="M-90 925 C-20 916 40 920 96 932 M-90 1112 C-20 1106 40 1108 104 1116" fill="none" stroke="#5a1f0b" stroke-width="5"/>
  <path d="M-80 900 C-20 892 30 895 80 905" fill="none" stroke="#c4683a" stroke-width="5"/>
  ${exoRivet(62, 962)}${exoRivet(68, 1030)}${exoRivet(74, 1090)}
  <path d="M58 1098 C140 1092 212 1108 254 1134 L244 1184 C192 1162 122 1152 54 1156 Z" fill="${EXO_SHACKLE}"/>
  <path d="M66 1108 C140 1104 200 1116 244 1140" fill="none" stroke="#c4683a" stroke-width="4"/>
  ${exoRivet(100, 1130)}${exoRivet(158, 1136)}${exoRivet(214, 1152)}
  ${exoChain(156, 1176, 170, 1300, 4)}
  <g transform="translate(173 1324) rotate(-8)" fill="none">
    <path d="M-9 17.6 A15 22 0 1 1 13 11" stroke="${EXO_INK}" stroke-width="13"/>
    <path d="M-9 17.6 A15 22 0 1 1 13 11" stroke="#b8975c" stroke-width="6"/>
  </g>`;

// Reference-sized contours are fitted uniformly to the existing wrist anchors.
// The open pose cups (500, 1010), so the spark and blast keep their old timing.
// Final horizontal offsets in EXODIA_SVG keep the outer knuckles in the phone crop.
const EXO_FIST_TRANSFORM = 'translate(27.5 46) scale(1.35)';
const EXO_OPEN_HAND_TRANSFORM = 'translate(26.15 11) scale(1.35)';

// The folded fingers descend diagonally into one solid knuckle mass. The thumb
// is tucked against the outside, rather than sitting beside four stacked tubes.
const EXO_FIST = `
  <g transform="${EXO_FIST_TRANSFORM}" stroke-width="2.3" fill="url(#exo-g-finger)">
    <path d="M37 687 C27 662 39 641 62 635 L193 648 C230 660 253 697 266 733 C276 764 250 791 210 804 L167 815 C120 825 79 801 55 763 Z" fill="url(#exo-g-knuckle)"/>
    ${exoFinger({
      outline: 'M41 614 Q45 604 55 613 L82 635 C92 647 81 674 69 693 L49 713 C35 698 30 682 34 661 Z',
      shadow: 'M42 633 L48 657 L44 681 L51 697 L43 701 Q32 678 42 633 Z',
      light: 'M46 616 Q53 618 66 634 L69 645 L52 634 Z',
      bands: ['M40 616 Q44 607 51 611 L77 635 L72 642 Q54 622 40 622 Z']
    })}
    ${[
      {
        outline: 'M79 668 L99 615 C105 596 122 595 137 604 Q148 611 144 625 L132 687 Q103 692 79 676 Z',
        shadow: 'M100 619 L93 665 L85 674 L81 668 Z M137 619 L128 677 L119 680 L129 637 Z',
        light: 'M108 614 Q118 603 132 612 L122 650 L109 662 L102 657 Z',
        bands: ['M99 613 C104 598 123 593 137 604 Q145 609 147 616 L145 621 C134 609 116 605 103 620 Z', 'M79 663 Q106 674 135 677 L133 687 Q101 683 76 672 Z']
      },
      {
        outline: 'M134 686 L150 619 C156 608 174 609 184 618 C194 636 192 669 194 704 Q166 707 134 695 Z',
        shadow: 'M151 627 L146 680 L139 689 L137 685 Z M182 633 L185 691 L174 695 L177 656 Z',
        light: 'M158 623 Q168 617 177 626 L174 670 L161 681 L153 673 Z',
        bands: ['M149 620 C156 608 174 609 184 618 Q188 623 189 630 C176 620 161 617 150 628 Z', 'M135 683 Q162 689 194 698 L193 707 Q163 700 133 692 Z']
      },
      {
        outline: 'M194 704 L191 638 Q192 628 204 632 C221 637 230 665 235 689 L242 724 Q215 727 194 714 Z',
        shadow: 'M197 640 L202 696 L198 708 L194 702 Z M220 658 L236 718 L226 719 L216 685 Z',
        light: 'M201 642 Q210 645 217 660 L224 700 L213 703 L205 685 Z',
        bands: ['M193 634 Q208 632 219 650 L216 655 Q204 641 194 642 Z', 'M192 701 Q216 705 239 716 L242 726 Q216 716 193 711 Z']
      },
      {
        outline: 'M240 721 L229 664 Q235 655 242 665 C251 676 260 702 266 726 L266 747 L244 754 Z',
        shadow: 'M237 669 L253 725 L248 737 L243 721 Z',
        light: 'M241 674 Q252 689 257 709 L254 721 L249 704 Z',
        bands: ['M231 663 Q237 658 245 672 L244 678 L234 670 Z', 'M240 719 L265 726 L267 737 L242 730 Z']
      }
    ].map(exoFinger).join('')}
    <path d="M77 681 C94 685 110 689 131 697 Q161 699 191 713 Q219 717 241 733 L264 738 C271 765 244 789 208 800 L164 811 C122 820 84 796 62 762 L42 719 Q54 694 77 681 Z" fill="url(#exo-g-knuckle)" stroke="none"/>
    <path d="M77 686 Q76 702 65 709 Q70 725 81 725 Q96 725 101 701 C105 720 101 733 95 744 Q94 765 108 785 Q95 786 89 774 C76 751 63 739 54 721 Q57 700 77 686 Z M132 710 Q133 731 144 735 Q156 739 160 718 Q170 741 155 755 C148 768 154 784 157 796 Q143 793 140 781 L136 760 Q121 750 124 734 Z M197 723 Q188 742 202 748 Q213 749 216 734 Q224 753 207 768 Q195 783 193 797 L180 794 Q183 778 188 768 Q179 754 183 742 Z M242 741 Q245 763 232 775 L220 796 Q237 791 247 774 Q258 757 255 747 Z" fill="#8b4b1b" stroke="none" opacity="0.8" filter="url(#exo-hand-soft)"/>
    <path d="M82 690 Q92 690 98 695 Q98 709 88 717 Q77 720 72 708 Q74 697 82 690 Z M143 704 Q153 703 157 710 L155 725 Q149 735 140 728 Q134 718 143 704 Z M201 718 Q211 717 214 725 L211 737 Q204 748 197 738 Q191 731 201 718 Z M243 736 Q252 736 253 744 Q253 756 242 760 Q236 748 243 736 Z" fill="#ffe384" stroke="none" filter="url(#exo-hand-soft)"/>
    <path d="M101 730 L98 748 L111 779 M160 743 L153 760 L158 786 M215 754 L204 774" fill="none" stroke="#ad481d" stroke-width="5" stroke-opacity="0.65" filter="url(#exo-hand-soft)"/>
    <path d="M43 719 C53 761 94 810 142 814 Q187 820 237 790" fill="none" stroke="#4b3219" stroke-width="2.3"/>
    <path d="M51 722 Q67 764 95 783" fill="none" stroke="#f6ce69" stroke-width="2" stroke-opacity="0.7"/>
  </g>`;

// The other fist is more steeply tilted in the reference, not a reflected copy.
const EXO_FIST_RIGHT = `
  <g transform="${EXO_FIST_TRANSFORM}" stroke-width="2.3" fill="url(#exo-g-finger-right)">
    <path d="M493 707 C505 671 544 634 586 612 L660 616 C686 626 703 649 701 677 C698 726 670 773 627 793 L581 807 C541 812 507 796 493 772 Q479 744 493 707 Z" fill="url(#exo-g-knuckle)"/>
    ${exoFinger({
      outline: 'M638 608 L650 585 Q659 568 666 580 L692 625 Q702 642 696 663 L677 667 L647 644 Z',
      shadow: 'M666 592 L681 628 L690 647 L688 656 L678 648 L662 620 Z',
      light: 'M654 590 L661 584 L670 607 L669 625 L657 615 Z',
      bands: ['M649 589 Q659 570 666 578 L669 585 Q659 580 653 599 Z']
    })}
    ${[
      {
        outline: 'M568 610 C572 591 590 585 603 598 L650 642 L659 660 L605 693 C595 670 578 637 568 610 Z',
        shadow: 'M584 606 L612 645 L640 667 L629 675 L601 650 L577 619 Z',
        light: 'M590 602 Q600 606 613 621 L635 644 L629 654 L610 640 Z',
        bands: ['M568 607 Q578 586 597 596 L608 605 L604 611 Q585 596 574 614 Z', 'M602 681 Q624 660 650 642 L656 650 Q627 675 606 692 Z']
      },
      {
        outline: 'M531 635 C532 618 552 609 563 624 C581 643 595 666 606 688 L560 723 Q543 692 531 657 Z',
        shadow: 'M540 639 L557 683 L573 709 L562 716 L549 696 L535 657 Z',
        light: 'M550 632 Q564 642 578 666 L587 683 L577 694 L558 674 Z',
        bands: ['M532 634 Q539 612 557 620 L568 632 L563 639 Q548 624 536 642 Z', 'M553 709 Q574 691 600 680 L606 689 Q580 704 559 721 Z']
      },
      {
        outline: 'M506 671 C509 649 522 644 534 654 C545 670 556 696 560 716 L530 751 L512 730 Z',
        shadow: 'M512 674 L522 715 L536 735 L528 744 L516 732 L508 699 Z',
        light: 'M523 662 Q534 679 543 707 L535 723 L525 706 Z',
        bands: ['M508 668 Q514 648 529 653 L536 663 L532 669 Q522 658 511 676 Z', 'M516 735 Q529 719 555 711 L560 720 Q535 734 522 745 Z']
      },
      {
        outline: 'M490 712 Q493 689 504 686 L513 702 L523 743 L513 771 L494 767 Q484 749 490 712 Z',
        shadow: 'M494 705 L497 741 L505 758 L497 763 Q489 747 494 705 Z',
        light: 'M502 705 L511 735 L507 748 L501 737 Z',
        bands: ['M488 742 Q501 740 519 748 L518 758 Q502 748 489 752 Z']
      }
    ].map(exoFinger).join('')}
    <path d="M496 757 Q511 747 530 740 Q540 726 559 722 Q574 705 600 696 Q625 678 652 661 Q667 651 698 668 C696 718 668 768 626 789 L583 804 C546 810 511 796 496 777 Z" fill="url(#exo-g-knuckle)" stroke="none"/>
    <path d="M514 758 Q513 773 527 778 Q539 780 542 793 Q519 792 509 778 Z M546 739 Q549 756 559 756 Q574 756 566 734 Q585 743 578 759 C577 772 589 780 598 790 Q581 790 573 780 L564 771 Q543 772 536 755 Z M591 713 Q595 733 607 730 Q622 725 614 703 Q638 713 628 735 Q625 749 637 766 L623 779 Q621 757 613 751 Q590 746 582 732 Z M652 681 Q665 702 673 691 Q678 686 671 675 Q692 675 687 699 Q681 719 670 731 Q669 711 659 705 Q648 702 644 693 Z" fill="#8b4b1b" stroke="none" opacity="0.8" filter="url(#exo-hand-soft)"/>
    <path d="M517 752 Q527 743 533 751 Q541 758 534 770 Q524 772 519 764 Z M548 732 Q557 722 563 733 Q572 745 562 751 Q552 752 548 743 Z M592 708 Q600 697 607 706 Q618 716 610 726 Q600 734 595 722 Z M649 669 Q659 661 667 672 Q677 681 668 689 Q658 688 652 681 Z" fill="#ffe384" stroke="none" filter="url(#exo-hand-soft)"/>
    <path d="M572 765 L589 788 M626 742 L631 763 M675 707 L668 728" fill="none" stroke="#ad481d" stroke-width="5" stroke-opacity="0.65" filter="url(#exo-hand-soft)"/>
    <path d="M496 765 Q506 796 552 804 C610 816 676 766 692 710" fill="none" stroke="#4b3219" stroke-width="2.3"/>
  </g>`;

// The palm is oblique to the viewer. Four fingers curl sideways around the
// ball, exposing their broad pads; the thumb hooks over its upper edge.
const EXO_OPEN_FINGERS = [
  {
    outline: 'M45 618 C55 606 78 602 91 616 L119 644 C142 648 164 667 174 686 Q183 702 165 707 C145 708 124 698 105 696 C83 690 59 677 46 659 Q31 637 45 618 Z',
    shadow: 'M43 632 Q43 650 65 665 L90 678 L121 688 L158 698 Q131 701 104 692 C75 687 51 672 43 656 Z',
    light: 'M53 620 Q73 609 86 623 L103 641 L94 648 L76 635 L57 633 Z M113 649 Q140 656 157 676 L145 679 L121 666 L107 665 Z',
    bands: ['M42 619 C51 601 78 598 91 614 L99 624 L95 631 C78 612 58 608 43 627 Z', 'M88 645 Q97 632 111 636 L121 644 L115 651 Q100 643 91 658 L85 673 L78 669 Q79 655 88 645 Z']
  },
  {
    outline: 'M23 710 C35 694 54 695 70 709 L102 737 C128 735 154 744 167 757 C180 775 167 787 149 790 L107 790 C79 784 48 773 31 756 C15 742 10 725 23 710 Z',
    shadow: 'M22 727 Q28 746 52 756 L86 774 L111 780 L155 780 Q128 790 106 785 C68 778 38 766 24 746 Z',
    light: 'M28 715 Q42 705 55 715 L81 741 L72 746 L43 729 L27 725 Z M105 746 Q131 743 151 759 L150 771 L130 767 L105 763 Z',
    bands: ['M21 714 C32 692 54 688 70 706 L77 715 L72 722 Q48 698 27 721 Z', 'M87 739 Q94 734 104 737 L109 743 Q94 753 93 773 L98 787 L90 790 Q77 763 87 739 Z']
  },
  {
    outline: 'M57 772 C70 765 88 771 108 787 C133 781 162 784 178 798 C192 811 190 823 172 828 L130 832 C105 835 79 824 65 808 Q51 793 57 772 Z',
    shadow: 'M61 783 Q72 803 95 812 L126 822 L175 819 Q157 830 130 828 C98 831 68 813 61 800 Z',
    light: 'M67 777 L89 786 L102 800 L94 805 L75 794 Z M126 791 Q152 787 169 803 L163 810 L142 803 L122 805 Z',
    bands: ['M107 787 Q114 782 122 787 L125 793 Q111 810 120 829 L111 833 Q99 817 107 787 Z']
  },
  {
    outline: 'M127 814 C145 809 166 815 184 817 C199 797 217 787 231 792 C246 799 249 816 234 828 L202 846 C184 853 162 842 147 838 Q129 831 127 814 Z',
    shadow: 'M139 824 L170 835 L191 840 L225 825 Q209 844 195 844 L169 838 Z',
    light: 'M199 805 Q218 791 229 800 L235 812 L219 819 L201 819 Z',
    bands: ['M177 815 L184 817 Q179 833 191 844 L183 848 Q171 839 177 815 Z']
  }
];
const EXO_OPEN_THUMB = {
  outline: 'M101 609 C132 608 163 595 191 584 C204 573 222 575 230 588 L237 614 L251 639 Q261 657 242 663 C226 670 204 656 195 649 C179 650 163 642 150 637 L119 637 Z',
  shadow: 'M117 617 L147 617 L171 608 L191 604 L187 627 L203 647 Q181 646 164 636 L143 630 Z M207 589 L211 622 L225 649 L213 646 L200 628 L195 607 Z',
  light: 'M199 585 Q211 579 221 590 L226 614 L238 640 L226 645 L213 620 L206 597 Z',
  bands: ['M130 603 L137 602 Q146 624 168 634 L179 638 L175 645 Q148 637 136 621 Z', 'M190 586 Q197 578 204 579 C184 599 187 630 209 650 L201 655 C178 639 177 608 190 586 Z']
};
const EXO_OPEN_HAND = `
  <g transform="${EXO_OPEN_HAND_TRANSFORM}" stroke-width="2.3" fill="url(#exo-g-finger)">
    <path d="M47 638 C90 624 140 622 179 637 C196 650 210 673 225 689 L264 725 C274 743 263 771 242 785 L210 812 L164 843 C129 855 83 836 53 813 C30 784 21 745 27 701 Z" fill="url(#exo-g-palm)"/>
    <path d="M171 641 C196 665 201 689 224 705 L253 729 L229 748 L199 718 L175 696 L154 684 Z M183 741 L209 754 L222 778 L198 805 L168 827 L140 829 L162 804 L175 779 Z" fill="#91431f" stroke="none" opacity="0.8"/>
    <path d="M178 660 L187 682 L207 699 L215 716 L198 710 L178 691 L162 686 M158 733 L175 750 L172 774 L155 792 M212 771 L195 791 L178 795" fill="none" stroke="#60381d" stroke-width="3"/>
    <path d="M177 670 L179 684 L197 703 L205 723 L196 725 L180 708 L164 701 L155 682 Z M172 754 L181 764 L173 786 L162 790 L161 779 Z M223 726 L252 741 L236 760 L219 753 Z" fill="#ffdb6c" stroke="none" opacity="0.6" filter="url(#exo-hand-soft)"/>
    <path d="M46 677 Q78 671 109 686 L139 704 L142 748 L119 758 L92 729 L53 715 Z" fill="#e1b34f" stroke-width="1.5"/>
    <path d="M52 684 Q81 680 107 695 L126 713 L124 736 L107 726 L91 704 L62 701 Z" fill="#f3d37e" stroke="none" opacity="0.7"/>
    <path d="M48 688 L68 703 L82 724 M112 702 L117 723 L132 738" fill="none" stroke="#9e792d" stroke-width="1.5"/>
    ${EXO_OPEN_FINGERS.map(exoFinger).join('')}
    ${exoFinger(EXO_OPEN_THUMB)}
  </g>`;

const EXO_OPEN_HAND_RIGHT = `
  <g transform="${EXO_OPEN_HAND_TRANSFORM}" stroke-width="2.3" fill="url(#exo-g-finger-right)">
    <path d="M670 616 C633 597 579 610 542 632 C531 650 517 671 499 689 L466 726 C450 750 467 775 494 792 L536 818 L582 842 C620 850 667 822 687 788 C701 758 708 718 696 678 Z" fill="url(#exo-g-palm-right)"/>
    <path d="M538 640 C521 668 518 687 492 708 L469 733 L494 752 L522 718 L548 691 L565 676 Z M541 745 L516 764 L508 789 L539 813 L574 832 L599 827 L571 799 L556 772 Z" fill="#91431f" stroke="none" opacity="0.8"/>
    <path d="M537 655 L530 681 L511 699 L504 718 L523 705 L541 685 L554 679 M565 731 L549 752 L553 776 L570 792 M520 774 L537 792 L554 796" fill="none" stroke="#60381d" stroke-width="3"/>
    <path d="M539 667 L537 682 L519 703 L511 724 L522 724 L540 705 L558 695 L565 677 Z M552 754 L544 767 L554 786 L565 790 L562 775 Z M496 726 L470 742 L483 761 L501 753 Z" fill="#ffdb6c" stroke="none" opacity="0.6" filter="url(#exo-hand-soft)"/>
    <path d="M674 646 Q645 638 615 656 L578 682 L575 727 L605 746 L634 713 L682 690 Z" fill="#e1b34f" stroke-width="1.5"/>
    <path d="M664 653 Q642 650 617 666 L590 688 L592 717 L612 705 L626 680 L658 670 Z" fill="#f3d37e" stroke="none" opacity="0.7"/>
    <path d="M669 663 L643 681 L628 704 M610 679 L606 703 L592 718" fill="none" stroke="#9e792d" stroke-width="1.5"/>
    ${[
      {
        outline: 'M672 582 C658 568 640 570 627 584 L601 611 C580 625 566 646 558 669 C553 686 564 697 579 691 L614 671 C633 658 653 639 668 619 Q688 596 672 582 Z',
        shadow: 'M666 591 Q669 604 650 623 L625 649 L598 672 L574 684 Q602 678 620 663 C647 645 665 626 675 606 Z',
        light: 'M660 580 Q645 577 635 590 L617 611 L623 619 L641 602 L657 594 Z M602 621 Q580 643 572 661 L581 673 L594 652 L613 631 Z',
        bands: ['M675 584 C664 566 639 566 626 582 L618 593 L624 599 Q643 575 669 590 Z', 'M609 610 Q622 610 635 622 L640 635 L633 641 Q623 620 606 620 L599 619 Z']
      },
      {
        outline: 'M695 665 C682 651 663 657 651 670 L629 707 C613 708 595 720 587 734 C576 751 585 768 601 767 L641 758 C666 746 689 724 702 700 C709 683 707 674 695 665 Z',
        shadow: 'M698 681 Q693 701 673 718 L646 742 L615 757 L595 758 Q616 767 646 753 C674 739 696 717 703 698 Z',
        light: 'M687 666 Q673 665 664 679 L647 707 L656 715 L676 693 L692 684 Z M624 716 Q606 720 595 737 L601 748 L619 739 L633 737 Z',
        bands: ['M699 667 Q678 647 660 664 L650 677 L656 684 Q677 658 699 676 Z', 'M628 707 Q641 707 650 720 L654 736 L647 743 Q642 722 626 716 L622 713 Z']
      },
      {
        outline: 'M671 738 C654 736 638 753 626 767 C610 763 589 767 578 779 C566 794 574 809 589 810 L623 807 C647 800 667 782 678 763 Q688 745 671 738 Z',
        shadow: 'M670 747 Q664 768 645 781 L623 795 L585 802 Q601 812 627 802 C651 793 671 776 677 758 Z',
        light: 'M660 746 L646 760 L638 774 L647 778 L661 762 Z M616 774 Q598 771 585 787 L589 796 L608 789 L624 789 Z',
        bands: ['M628 768 Q637 777 637 791 L631 801 L622 805 Q631 786 619 775 Z']
      },
      {
        outline: 'M621 803 C603 800 586 809 570 812 C556 795 538 784 525 790 C514 797 511 810 521 820 L554 840 C573 848 591 837 605 829 Q620 822 621 803 Z',
        shadow: 'M611 812 L585 828 L565 835 L532 819 Q548 837 565 841 L591 832 Z',
        light: 'M553 807 Q535 791 524 802 L524 811 L541 821 L556 821 Z',
        bands: ['M576 808 L570 812 Q575 829 564 839 L572 843 Q585 833 576 808 Z']
      },
      {
        outline: 'M617 589 C589 594 558 594 534 584 C520 572 502 572 491 583 L484 611 L475 641 C469 659 480 667 495 662 C516 658 527 644 535 640 C553 639 568 628 582 625 L613 619 Z',
        shadow: 'M608 599 L580 606 L554 602 L535 603 L533 626 L516 643 Q542 638 562 626 L584 619 Z M514 585 L507 610 L494 648 L506 645 L520 623 L526 601 Z',
        light: 'M507 580 Q496 581 494 597 L491 620 L485 642 L496 649 L509 623 L516 598 Z',
        bands: ['M582 585 L576 586 Q568 610 549 625 L539 631 L544 637 Q570 625 577 609 Z', 'M531 585 Q523 576 516 577 C534 596 528 623 510 643 L519 647 C540 631 544 601 531 585 Z']
      }
    ].map(exoFinger).join('')}
  </g>`;

// The compact mask sits below the crest, not inside a tall striped forehead.
// Reference eye centres (263, 325) and (301, 325) map to the CSS eye glows.
const EXO_FACE_HALF = `
  <path d="M249 316 L279 319 L281 343 L274 350 L267 340 Q261 336 258 344 L250 339 L242 320 Z" fill="url(#exo-g-mask)" stroke-width="1.3"/>
  <path d="M243 312 Q259 320 276 321 Q271 332 260 331 Q249 328 243 312 Z" fill="#191b31" stroke-width="1.4"/>
  <path d="M247 317 Q260 322 273 323 Q268 330 260 328 Q253 326 247 317 Z" fill="url(#exo-g-eye)" stroke="none"/>
  <path d="M235 299 C248 307 264 314 278 318 L276 321 C262 320 247 310 235 299 Z" fill="#e5e3d4" stroke-width="1.3"/>
  <path d="M238 302 Q258 315 276 319" fill="none" stroke="#fff9df" stroke-width="0.8"/>
  <path d="M243 337 C249 354 262 370 277 379 L274 382 C258 371 246 358 239 345 L237 318 Z" fill="#c6a346" stroke-width="1.5"/>
  <path d="M249 343 Q255 347 258 354 L268 371 L274 377 C262 370 253 359 249 343 Z" fill="#7772b2" stroke="none"/>
  <path d="M249 332 Q261 338 271 333" fill="none" stroke="#f8e6a0" stroke-width="1.4"/>`;
const EXO_COBRA_HOOD = 'M282 273 C275 265 265 266 260 275 C252 290 261 307 275 317 L282 322 L289 317 C303 307 312 290 304 275 C299 266 289 265 282 273 Z';
const EXO_NECK = 'M246 348 L282 372 L318 348 L305 373 L282 391 L259 373 Z';
const EXO_FACE = `
  <g transform="${EXO_HEAD_TRANSFORM}" stroke-width="1.8">
    <path d="${EXO_NECK}" fill="#29234d" stroke-width="5"/>
    <path d="M247 351 L260 371 L282 389 L304 371 L317 351" fill="none" stroke="#c9a34b" stroke-width="3"/>
    <path d="M255 356 L264 374 L275 382 M309 356 L300 374 L289 382" fill="none" stroke="#6c64a6" stroke-width="2.5"/>
    <path d="M254 275 C250 256 260 243 282 243 C304 243 314 256 310 275 L302 303 L262 303 Z" fill="url(#exo-g-dome)"/>
    <path d="M258 270 Q282 253 306 270" fill="none" stroke="#b39450" stroke-width="2"/>
    <path d="M242 315 L322 315 L316 347 L298 369 L282 380 L266 369 L248 347 Z" fill="#44416f"/>
    <path d="M263 356 Q282 366 301 356 L294 374 L282 382 L270 374 Z" fill="#686394" stroke="none"/>
    ${exoMirror('exo-h-face', EXO_FACE_HALF, 282)}
    <path d="${EXO_COBRA_HOOD}" fill="#c0a361"/>
    <g clip-path="url(#exo-clip-cobra)" fill="url(#exo-g-cobra)" stroke="#57272f" stroke-width="0.8">
      <path d="M257 275 Q269 269 278 281 L276 288 Q266 280 255 284 Z M307 275 Q295 269 286 281 L288 288 Q298 280 309 284 Z"/>
      <path d="M255 289 Q266 285 277 293 L277 299 Q264 293 256 296 Z M309 289 Q298 285 287 293 L287 299 Q300 293 308 296 Z"/>
      <path d="M260 302 Q269 298 278 304 L279 310 L265 309 Z M304 302 Q295 298 286 304 L285 310 L299 309 Z"/>
      <path d="M270 313 L282 310 L294 313 L282 324 Z"/>
    </g>
    <path d="${EXO_COBRA_HOOD}" fill="none"/>
    <path d="M264 274 C256 287 262 302 273 311 M300 274 C308 287 302 302 291 311" fill="none" stroke="#f0d48e" stroke-width="1.1"/>
    <path d="M272 268 L273 264 L279 267 L282 266 L285 267 L291 264 L292 268 L287 276 L277 276 Z" fill="url(#exo-g-mask)" stroke-width="1.3"/>
    <path d="M274 268 L279 269 L278 272 Z M290 268 L285 269 L286 272 Z" fill="#481b25" stroke="none"/>
    <path d="M277 274 Q282 277 287 274 L286 282 Q282 289 278 282 Z" fill="#211d1a" stroke="#b48b48" stroke-width="1.2"/>
    <path d="M278 284 Q282 287 286 284 L286 306 L288 318 L286 339 L282 347 L278 339 L276 318 L278 306 Z" fill="url(#exo-g-mask)" stroke-width="1.4"/>
    <path d="M280 288 L280 332 L282 340" fill="none" stroke="#f2d896" stroke-width="1.1"/>
    <path d="M279 289 H285 M279 294 H285 M279 299 H285 M279 304 H285 M278 309 H286 M278 314 H286 M278 319 H286 M279 324 H285 M279 329 H285 M280 334 H284" fill="none" stroke="#5d4029" stroke-width="1.2"/>
    <path d="M269 348 Q282 341 295 348 L297 357 L293 367 Q282 373 271 367 L267 357 Z" fill="#171724" stroke-width="2"/>
    <path d="M270 349 Q282 345 294 349 L294 357 Q282 360 270 357 Z" fill="#e8e6d7" stroke-width="0.9"/>
    <path d="M270 359 Q282 362 294 359 L292 366 Q282 371 272 366 Z" fill="#d4d7cc" stroke-width="0.9"/>
    <path d="M274 348 V358 M279 347 V359 M284 347 V359 M289 348 V358 M275 360 V368 M280 361 V369 M285 361 V369 M290 360 V367" fill="none" stroke="#353135" stroke-width="0.9"/>
    <path d="M269 371 L276 374 L282 377 L288 374 L295 371 L290 377 L282 382 L274 377 Z" fill="#6d6335" stroke-width="1.2"/>
    <path d="M274 382 Q282 375 290 382 L293 447 L271 447 Z" fill="url(#exo-g-mask)" stroke-width="2"/>
    <path d="M276 386 Q282 380 288 386 L289 428 L275 428 Z" fill="#b3a258" stroke-width="1"/>
    <path d="M277 390 H287 M277 394 H287 M277 398 H287 M277 402 H287 M276 406 H288 M276 410 H288 M276 414 H288 M276 418 H288 M276 422 H288" fill="none" stroke="#635526" stroke-width="1.2"/>
    <path d="M273 431 H291 L292 445 H272 Z" fill="#ead486" stroke-width="1.2"/>
    <path d="M274 386 L272 444 M290 386 L292 444" fill="none" stroke="#f5df92" stroke-width="1"/>
  </g>`;

const EXO_SKIRT_LINES = [240, 330, 415, 500, 585, 670, 760]
  .map(x => `M${500 + (x - 500) * 0.3} 1180 L${x} 1600`).join(' ');

// The static body is one layer; the silhouette that looms in the smoke is a
// darkened <use> copy of it. Everything here is rasterized once, so
// only transform/opacity animate (no re-rasterizing on phones).
const EXODIA_SVG = `
<svg class="exo-layer exo-sil" viewBox="0 0 1000 1600" aria-hidden="true"><use href="#exo-body"/><use href="#exo-fists-art"/></svg>
<svg class="exo-layer exo-lit" viewBox="0 0 1000 1600" aria-hidden="true">
  <defs>
    <filter id="exo-soft-gold" x="-25%" y="-15%" width="150%" height="130%">
      <feGaussianBlur stdDeviation="2.4"/>
    </filter>
    <filter id="exo-hand-soft" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="2.4"/>
    </filter>
    <radialGradient id="exo-g-sphere" cx="0.45" cy="0.36" r="0.66">
      <stop offset="0" stop-color="#fbe7a1"/>
      <stop offset="0.45" stop-color="#e2ac4a"/>
      <stop offset="0.85" stop-color="#a96a1d"/>
      <stop offset="1" stop-color="#7a4810"/>
    </radialGradient>
    <linearGradient id="exo-g-dome" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#423b23"/>
      <stop offset="1" stop-color="#1f2118"/>
    </linearGradient>
    <linearGradient id="exo-g-gold" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#f8dc8a"/>
      <stop offset="0.55" stop-color="#d99a37"/>
      <stop offset="1" stop-color="#8f5a16"/>
    </linearGradient>
    <radialGradient id="exo-g-pad" cx="0.35" cy="0.3" r="0.8">
      <stop offset="0" stop-color="#fbe3a0"/>
      <stop offset="0.5" stop-color="#d9a03e"/>
      <stop offset="1" stop-color="#7d4a12"/>
    </radialGradient>
    <linearGradient id="exo-g-hood" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#c78038"/>
      <stop offset="0.18" stop-color="#47271a"/>
      <stop offset="0.45" stop-color="#97752e"/>
      <stop offset="1" stop-color="#e6c05b"/>
    </linearGradient>
    <linearGradient id="exo-g-horn" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#bc7839"/>
      <stop offset="0.3" stop-color="#6b4225"/>
      <stop offset="0.6" stop-color="#322719"/>
      <stop offset="0.86" stop-color="#ad8c36"/>
      <stop offset="1" stop-color="#d7b75d"/>
    </linearGradient>
    <radialGradient id="exo-g-crest" cx="0.47" cy="0.53" r="0.62">
      <stop offset="0" stop-color="#f6d96b"/>
      <stop offset="0.3" stop-color="#e7c253"/>
      <stop offset="0.57" stop-color="#b18b2e"/>
      <stop offset="0.8" stop-color="#60451d"/>
      <stop offset="1" stop-color="#312419"/>
    </radialGradient>
    <radialGradient id="exo-g-crest-side" cx="0.66" cy="0.75" r="0.72">
      <stop offset="0" stop-color="#f2d578"/>
      <stop offset="0.35" stop-color="#d5b04a"/>
      <stop offset="0.65" stop-color="#967025"/>
      <stop offset="0.86" stop-color="#50351c"/>
      <stop offset="1" stop-color="#302219"/>
    </radialGradient>
    <linearGradient id="exo-g-cloth" x1="0" y1="0" x2="0.2" y2="1">
      <stop offset="0" stop-color="#fbf4be"/>
      <stop offset="0.28" stop-color="#eee9ac"/>
      <stop offset="0.46" stop-color="#bca265"/>
      <stop offset="0.59" stop-color="#f3e7ac"/>
      <stop offset="0.78" stop-color="#e5d58f"/>
      <stop offset="1" stop-color="#f7edb4"/>
    </linearGradient>
    <linearGradient id="exo-g-cloth-shadow" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#322027" stop-opacity="0"/>
      <stop offset="0.4" stop-color="#322027" stop-opacity="0.12"/>
      <stop offset="0.7" stop-color="#322027" stop-opacity="0.55"/>
      <stop offset="1" stop-color="#322027" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="exo-g-mask" x1="0" y1="0" x2="1" y2="0.2">
      <stop offset="0" stop-color="#8e6e32"/>
      <stop offset="0.28" stop-color="#d5ba68"/>
      <stop offset="0.5" stop-color="#f3df93"/>
      <stop offset="0.75" stop-color="#b19348"/>
      <stop offset="1" stop-color="#75542a"/>
    </linearGradient>
    <radialGradient id="exo-g-eye" cx="0.64" cy="0.55" r="0.55">
      <stop offset="0" stop-color="#fffdf5"/>
      <stop offset="0.2" stop-color="#eae4ff"/>
      <stop offset="0.5" stop-color="#9290c4"/>
      <stop offset="1" stop-color="#343148"/>
    </radialGradient>
    <linearGradient id="exo-g-cobra" gradientUnits="userSpaceOnUse" x1="0" y1="273" x2="0" y2="320">
      <stop offset="0" stop-color="#e562ae"/>
      <stop offset="0.45" stop-color="#c64697"/>
      <stop offset="1" stop-color="#641e4d"/>
    </linearGradient>
    <linearGradient id="exo-g-skirt" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#e7b45a"/>
      <stop offset="1" stop-color="#9a6420"/>
    </linearGradient>
    <radialGradient id="exo-g-finger" cx="0.6" cy="0.34" r="0.8">
      <stop offset="0" stop-color="#f4d676"/>
      <stop offset="0.3" stop-color="#e8bd4c"/>
      <stop offset="0.65" stop-color="#ad7620"/>
      <stop offset="0.88" stop-color="#66421e"/>
      <stop offset="1" stop-color="#352516"/>
    </radialGradient>
    <radialGradient id="exo-g-finger-right" href="#exo-g-finger" cx="0.4"/>
    <radialGradient id="exo-g-knuckle" cx="0.5" cy="0.15" r="0.95">
      <stop offset="0" stop-color="#f3d16b"/>
      <stop offset="0.38" stop-color="#dba62a"/>
      <stop offset="0.7" stop-color="#b2761d"/>
      <stop offset="1" stop-color="#65431c"/>
    </radialGradient>
    <radialGradient id="exo-g-palm" cx="0.82" cy="0.55" r="0.9">
      <stop offset="0" stop-color="#f7d96c"/>
      <stop offset="0.28" stop-color="#e3ac37"/>
      <stop offset="0.55" stop-color="#b77324"/>
      <stop offset="0.8" stop-color="#704021"/>
      <stop offset="1" stop-color="#342819"/>
    </radialGradient>
    <radialGradient id="exo-g-palm-right" href="#exo-g-palm" cx="0.18"/>
    <linearGradient id="exo-g-hand-ring" x1="0" y1="0" x2="0.4" y2="1">
      <stop offset="0" stop-color="#fff3c2"/>
      <stop offset="0.35" stop-color="#e8d591"/>
      <stop offset="0.6" stop-color="#b39956"/>
      <stop offset="0.85" stop-color="#f4df9b"/>
      <stop offset="1" stop-color="#6f552c"/>
    </linearGradient>
    <clipPath id="exo-clip-wing"><path d="${EXO_WING}"/></clipPath>
    <clipPath id="exo-clip-cobra"><path d="${EXO_COBRA_HOOD}"/></clipPath>
  </defs>
  <g id="exo-body" stroke="${EXO_INK}" stroke-width="5" stroke-linejoin="round" stroke-linecap="round">
    ${exoMirror('exo-h-horn', EXO_HORN)}

    <path d="M262 1080 L738 1080 L840 1600 L160 1600 Z" fill="url(#exo-g-skirt)"/>
    <path d="${EXO_SKIRT_LINES}" fill="none" stroke="#7a4a12" stroke-width="3"/>
    <path d="M380 1200 L330 1600 M620 1200 L670 1600" fill="none" stroke="${EXO_SHINE}" stroke-width="4" stroke-opacity="0.5"/>

    <ellipse cx="500" cy="735" rx="282" ry="372" fill="url(#exo-g-sphere)"/>
    <ellipse cx="500" cy="900" rx="150" ry="110" fill="#fff1c0" opacity="0.35" stroke="none"/>
    <path d="M300 960 Q500 1010 700 960 M330 880 Q500 915 670 880" fill="none" stroke="#a86c1e" stroke-width="3" stroke-opacity="0.45"/>
    ${exoBand('M500 1010 C420 1010 318 990 300 910 C292 868 294 830 298 795 a32 32 0 0 1 64 0 a28 28 0 0 1 -56 0 a22 22 0 0 1 44 0 a16 16 0 0 1 -32 0 a10 10 0 0 1 20 0', 11)}
    ${exoBand('M500 1010 C580 1010 682 990 700 910 C708 868 706 830 702 795 a32 32 0 0 0 -64 0 a28 28 0 0 0 56 0 a22 22 0 0 0 -44 0 a16 16 0 0 0 32 0 a10 10 0 0 0 -20 0', 11)}

    <path d="M338 1040 C420 1018 580 1018 662 1040 L652 1118 C580 1132 420 1132 348 1118 Z" fill="#9a3d1a"/>
    <path d="M420 1028 L418 1124 M500 1022 L500 1128 M580 1028 L582 1124 M342 1078 Q500 1068 658 1078" fill="none" stroke="#5a1e0a" stroke-width="3"/>
    <g fill="#d06a35" stroke="none" opacity="0.75">
      <ellipse cx="380" cy="1054" rx="22" ry="8"/><ellipse cx="460" cy="1046" rx="24" ry="8"/>
      <ellipse cx="540" cy="1046" rx="24" ry="8"/><ellipse cx="620" cy="1054" rx="22" ry="8"/>
      <ellipse cx="384" cy="1096" rx="20" ry="7"/><ellipse cx="460" cy="1092" rx="22" ry="7"/>
      <ellipse cx="540" cy="1092" rx="22" ry="7"/><ellipse cx="616" cy="1096" rx="20" ry="7"/>
    </g>
    <path d="M300 1112 C420 1138 580 1138 700 1112 L708 1158 C580 1186 420 1186 292 1158 Z" fill="url(#exo-g-gold)"/>
    <circle cx="500" cy="1160" r="32" fill="url(#exo-g-pad)"/>
    <circle cx="500" cy="1160" r="17" fill="#c58a2e"/>
    <circle cx="494" cy="1154" r="5" fill="${EXO_SHINE}" stroke="none"/>

    ${exoMirror('exo-h-shoulder', EXO_SHOULDER)}

    <g transform="${EXO_HEAD_TRANSFORM}" stroke-width="2.2">
      <path d="M234 121 Q282 109 330 121 L311 259 L253 259 Z" fill="url(#exo-g-hood)"/>
      <path d="M239 124 Q282 115 325 124" fill="none" stroke="#e4a34e" stroke-width="2"/>
      <path d="M248 175 Q282 163 316 175 M256 211 Q282 203 308 211" fill="none" stroke="#876026" stroke-width="1.5" stroke-opacity="0.65"/>
    </g>
    ${exoMirror('exo-h-head', EXO_HEAD_HALF)}
    ${EXO_FACE}

    ${exoMirror('exo-h-arm', EXO_ARM_HALF)}
  </g>
</svg>
<svg class="exo-layer exo-fists" viewBox="0 0 1000 1600" aria-hidden="true">
  <g id="exo-fists-art" stroke="${EXO_INK}" stroke-width="5" stroke-linejoin="round" stroke-linecap="round">
    ${EXO_FIST}
    <g transform="translate(-45 0)">${EXO_FIST_RIGHT}</g>
  </g>
</svg>
<svg class="exo-layer exo-open" viewBox="0 0 1000 1600" aria-hidden="true">
  <g stroke="${EXO_INK}" stroke-width="5" stroke-linejoin="round" stroke-linecap="round">
    <g transform="translate(20 0)">${EXO_OPEN_HAND}</g>
    <g transform="translate(-45 0)">${EXO_OPEN_HAND_RIGHT}</g>
  </g>
</svg>`;
