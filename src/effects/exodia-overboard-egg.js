// Duelist's Road easter egg: hold "New run" for START_EGG_PRESS_MS.
// "Exodia Overboard". Night on the ship to Duelist Kingdom. Weevil fans out
// the five pieces of Exodia, giggles and flings them into the sea one by one.
// Joey charges across the deck and dives in after them with a huge splash,
// then surfaces bawling with only two. Weevil: "Two out of five is still no Exodia!"
// Timeline: the EXODIA OVERBOARD section of effects.css.
const EXODIA_OVERBOARD_EGG_MS = 10000;
const EO_THROW_MS = 4000;
const EO_THROW_GAP_MS = 170;
const EO_FLIGHT_MS = 900;
const EO_DIVE_SPLASH_MS = 6900;
// The fan sits in Weevil's raised hand (--hx/--hy in effects.css; he stands
// at left 36%, deck at 62%); the sea starts at the 71% line.
const EO_FAN_X = 36;
const EO_DECK_Y = 62;
const EO_SEA_Y = 71;

// Weevil Underwood (viewBox 100×160): teal bowl cut with a cowlick, yellow
// glasses with a horned bridge, toothy grin, green high-collar jacket with a
// black beetle, dark shorts, hands on hips. The right arm is its own SVG
// layer (EO_WEEVIL_ARM_SVG, shoulder at 69,66) on top of the card fan, so his
// hand grips the cards as he lifts them and flicks them away.
const EO_WEEVIL_ARM_SVG = `
  <svg class="eo-wv-arm-layer" viewBox="0 0 100 160" aria-hidden="true">
    <g class="eo-wv-arm">
      <g fill="none" stroke-linecap="round" stroke-linejoin="round">
        <path d="M69 66 L83 88 L72 104" stroke="#2f5a22" stroke-width="12"/>
        <path d="M69 66 L83 88 L72 104" stroke="#6fb058" stroke-width="9"/>
      </g>
      <circle cx="71" cy="104" r="4.6" fill="#e2a878" stroke="#7a4a26" stroke-width="1"/>
    </g>
  </svg>`;
const EO_WEEVIL_SVG = `
  <svg viewBox="0 0 100 160" aria-hidden="true">
    <g fill="#e2a878" stroke="#7a4a26" stroke-width="1">
      <rect x="38" y="126" width="8" height="26" rx="2"/>
      <rect x="54" y="126" width="8" height="26" rx="2"/>
    </g>
    <ellipse cx="41" cy="154" rx="7" ry="3.5" fill="#4a2c17"/>
    <ellipse cx="59" cy="154" rx="7" ry="3.5" fill="#4a2c17"/>
    <path d="M28 110 H72 L74 132 H53 L50 122 L47 132 H26 Z" fill="#3a3d44" stroke="#17181c" stroke-width="1.2"/>
    <g fill="none" stroke-linecap="round" stroke-linejoin="round">
      <path d="M31 66 L17 88 L28 104" stroke="#2f5a22" stroke-width="12"/>
      <path d="M31 66 L17 88 L28 104" stroke="#6fb058" stroke-width="9"/>
    </g>
    <circle cx="29" cy="104" r="4.6" fill="#e2a878" stroke="#7a4a26" stroke-width="1"/>
    <path d="M30 62 Q50 55 70 62 L74 114 Q50 119 26 114 Z" fill="#6fb058" stroke="#2f5a22" stroke-width="1.4"/>
    <path d="M50 62 V115" stroke="#2f5a22" stroke-width="1"/>
    <g fill="#1c1c1c">
      <ellipse cx="50" cy="93" rx="9" ry="11"/>
      <ellipse cx="50" cy="79.5" rx="5" ry="3.5"/>
    </g>
    <path d="M50 83 V104" stroke="#6fb058" stroke-width="0.9"/>
    <g fill="none" stroke="#1c1c1c" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M42 86 L34 80 L34 73"/><path d="M58 86 L66 80 L66 73"/>
      <path d="M41 93 L31 95"/><path d="M59 93 L69 95"/>
      <path d="M43 100 L36 108"/><path d="M57 100 L64 108"/>
      <path d="M47 77 Q44 71 39 69"/><path d="M53 77 Q56 71 61 69"/>
    </g>
    <rect x="46" y="49" width="8" height="8" fill="#e2a878"/>
    <rect x="41" y="54" width="18" height="8" rx="2" fill="#6fb058" stroke="#2f5a22" stroke-width="1.2"/>
    <circle cx="50" cy="59.5" r="1.5" fill="#d9f99d" stroke="#2f5a22" stroke-width="0.6"/>
    <circle cx="35" cy="38" r="3" fill="#e2a878" stroke="#7a4a26" stroke-width="0.8"/>
    <circle cx="65" cy="38" r="3" fill="#e2a878" stroke="#7a4a26" stroke-width="0.8"/>
    <ellipse cx="50" cy="36" rx="15" ry="16" fill="#e2a878" stroke="#7a4a26" stroke-width="1"/>
    <path d="M27 41 Q25 12 50 10 Q75 12 73 41 L68 41 L65 35 L61 38 L58 32 L54 36 L50 31 L46 36 L42 32 L39 38 L35 35 L32 41 Z" fill="#8ccac2" stroke="#3f7f78" stroke-width="1.1" stroke-linejoin="round"/>
    <g fill="none" stroke="#4f9790" stroke-width="0.8" stroke-linecap="round">
      <path d="M50 12 Q44 22 42 31"/><path d="M50 12 Q56 22 58 31"/>
      <path d="M50 12 Q37 18 33 37"/><path d="M50 12 Q63 18 67 37"/><path d="M50 12 V30"/>
    </g>
    <path d="M48 12 Q46 5 41 4 Q49 4 51 10 Q54 4 60 5 Q54 8 53 12 Z" fill="#8ccac2" stroke="#3f7f78" stroke-width="1"/>
    <path d="M37 35.5 L46 37.5 M63 35.5 L54 37.5" stroke="#2c1a10" stroke-width="1.5" stroke-linecap="round"/>
    <g stroke="#1f2937" stroke-linecap="round">
      <path d="M39.5 40.5 Q43 38.6 46.5 40.5" fill="none" stroke-width="1.3"/>
      <path d="M53.5 40.5 Q57 38.6 60.5 40.5" fill="none" stroke-width="1.3"/>
    </g>
    <circle cx="43.5" cy="41" r="1.2" fill="#1e3a8a"/>
    <circle cx="56.5" cy="41" r="1.2" fill="#1e3a8a"/>
    <g fill="rgb(254 249 195 / 0.25)" stroke="#e8c53a" stroke-width="1.7">
      <ellipse cx="43" cy="40.5" rx="6" ry="5"/>
      <ellipse cx="57" cy="40.5" rx="6" ry="5"/>
    </g>
    <path d="M40 38 Q41.5 36.6 43.5 36.6 M54 38 Q55.5 36.6 57.5 36.6" fill="none" stroke="#fff" stroke-width="0.8" stroke-linecap="round"/>
    <path d="M49 41 L47.5 35.5 Q50 31.5 52.5 35.5 L51 41 Z" fill="#e8c53a" stroke="#a1841b" stroke-width="0.6"/>
    <path d="M48.3 36.5 H51.7" stroke="#a1841b" stroke-width="0.6"/>
    <path d="M41 47 Q50 54.5 59 47 Q50 50.5 41 47 Z" fill="#fff" stroke="#3a1d0e" stroke-width="1" stroke-linejoin="round"/>
    <path d="M45 48.8 V51 M50 49.6 V52.3 M55 48.8 V51" stroke="#9ca3af" stroke-width="0.5"/>
  </svg>`;

// Joey Wheeler, Duelist Kingdom (viewBox 100×170): spiky blond hair, brown
// eyes, teal coat with a popped collar over a white tee with a purple stripe,
// brown belt, blue jeans. `head` crops to just his head (resurfacing).
function eoJoeySvg(head = false) {
  const face = `
    <rect x="46" y="48" width="8" height="10" fill="#f0c49a"/>
    <ellipse cx="50" cy="36" rx="13" ry="15" fill="#f0c49a" stroke="#8a5a32" stroke-width="1"/>
    <path d="M35 44 L29 37 L33 35 L26 27 L34 26 L29 15 L39 20 L39 7 L47 16 L53 2 L57 15 L66 7 L65 19 L74 16 L68 26 L75 29 L67 32 L71 41 L64 37 L64 29 Q50 22 36 29 L36 37 Z" fill="#d6b04a" stroke="#7a5c14" stroke-width="1" stroke-linejoin="round"/>
    <path d="M37 30 L40 40 L43 30 L46 38 L49 28 L52 37 L55 29 L58 39 L61 30 Q50 21 37 30 Z" fill="#d6b04a" stroke="#7a5c14" stroke-width="0.9" stroke-linejoin="round"/>
    <g fill="none" stroke="#b08a2a" stroke-width="0.8" stroke-linecap="round">
      <path d="M46 17 L44 27"/><path d="M57 16 L56 26"/><path d="M38 21 L40 29"/><path d="M65 20 L62 28"/>
    </g>
    <path d="M49.5 41 L50.5 43.5 L49 43.6" fill="none" stroke="#b07a4a" stroke-width="0.7"/>`;
  // Determined on deck; bawling when he resurfaces with only two pieces:
  // squeezed-shut eyes, upturned brows, a wailing mouth and tear streams.
  const determined = `
    <path d="M40 34 L47.5 36 M60 34 L52.5 36" stroke="#7a5c14" stroke-width="1.4" stroke-linecap="round"/>
    <path d="M41 38 Q44.5 35.5 48 38 Q44.5 40 41 38 Z M52 38 Q55.5 35.5 59 38 Q55.5 40 52 38 Z" fill="#fff"/>
    <circle cx="45" cy="38" r="1.7" fill="#8a5220"/><circle cx="55" cy="38" r="1.7" fill="#8a5220"/>
    <circle cx="45" cy="38" r="0.7" fill="#1c1917"/><circle cx="55" cy="38" r="0.7" fill="#1c1917"/>
    <path d="M41 38 Q44.5 35.5 48 38 M52 38 Q55.5 35.5 59 38" fill="none" stroke="#3b2414" stroke-width="1"/>
    <path d="M45.5 46 Q50 48.5 54.5 46" fill="none" stroke="#6b3a1e" stroke-width="1.1" stroke-linecap="round"/>`;
  const crying = `
    <path d="M40 35.5 L47.5 33 M60 35.5 L52.5 33" stroke="#7a5c14" stroke-width="1.4" stroke-linecap="round"/>
    <path d="M41 37 L46.5 38.6 L41.5 40.2 M59 37 L53.5 38.6 L58.5 40.2" fill="none" stroke="#3b2414" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
    <ellipse cx="40.5" cy="42.5" rx="2.2" ry="1.2" fill="#f4a3a3" opacity="0.7"/>
    <ellipse cx="59.5" cy="42.5" rx="2.2" ry="1.2" fill="#f4a3a3" opacity="0.7"/>
    <path d="M45 48.5 Q46 44 50 44 Q54 44 55 48.5 Q50 47 45 48.5 Z" fill="#7f1d1d" stroke="#4a1a0a" stroke-width="0.9" stroke-linejoin="round"/>
    <path d="M47 47.6 Q50 46.4 53 47.6" fill="none" stroke="#f87171" stroke-width="0.8"/>
    <g class="eo-tears" fill="none" stroke="#7dd3fc" stroke-width="2" stroke-linecap="round">
      <path class="eo-tear" d="M42 40 Q40 47 41.5 56"/><path class="eo-tear" d="M58 40 Q60 47 58.5 56"/>
    </g>
    <g class="eo-tear-drops" fill="#bae6fd">
      <circle class="eo-tear-drop" cx="38" cy="40" r="1.4" style="--s: -1;"/><circle class="eo-tear-drop" cx="62" cy="40" r="1.4" style="--d: 1; --s: 1;"/>
    </g>`;
  if (head) return `<svg viewBox="22 0 56 56" aria-hidden="true" style="overflow: hidden;">${face}${crying}</svg>`;
  return `
  <svg viewBox="0 0 100 170" aria-hidden="true">
    <path d="M34 118 H49 L47 160 H35 Z M51 118 H66 L65 160 H53 Z" fill="#3b6fb6" stroke="#22457a" stroke-width="1.1" stroke-linejoin="round"/>
    <path d="M41 124 V156 M59 124 V156" stroke="#5b8fd6" stroke-width="0.8"/>
    <ellipse cx="40" cy="162" rx="8" ry="3.6" fill="#2a2420"/>
    <ellipse cx="60" cy="162" rx="8" ry="3.6" fill="#2a2420"/>
    <path d="M37 60 H63 L66 116 H34 Z" fill="#f1f5f9" stroke="#94a3b8" stroke-width="1"/>
    <rect x="35.5" y="82" width="29" height="9" fill="#8b80dc"/>
    <path d="M35.5 82 H64.5 M35.5 91 H64.5" stroke="#4c3fa8" stroke-width="1.2"/>
    <rect x="33" y="112" width="34" height="6" fill="#6b4423" stroke="#3b2414" stroke-width="0.8"/>
    <rect x="45.5" y="112.5" width="9" height="5" rx="0.8" fill="none" stroke="#cbd5e1" stroke-width="1.5"/>
    <path d="M25 64 L17 112 L25 114 L33 72 Z" fill="#1f8f73" stroke="#0d4f3f" stroke-width="1.1" stroke-linejoin="round"/>
    <path d="M75 64 L83 112 L75 114 L67 72 Z" fill="#1f8f73" stroke="#0d4f3f" stroke-width="1.1" stroke-linejoin="round"/>
    <circle cx="21" cy="116" r="4" fill="#f0c49a" stroke="#8a5a32" stroke-width="0.9"/>
    <circle cx="79" cy="116" r="4" fill="#f0c49a" stroke="#8a5a32" stroke-width="0.9"/>
    <path d="M24 64 Q30 58 40 57 L43 72 L38 140 L23 140 Z" fill="#1f8f73" stroke="#0d4f3f" stroke-width="1.2" stroke-linejoin="round"/>
    <path d="M76 64 Q70 58 60 57 L57 72 L62 140 L77 140 Z" fill="#1f8f73" stroke="#0d4f3f" stroke-width="1.2" stroke-linejoin="round"/>
    <path d="M40 57 L31 43 L45 51 L43 72 Z M60 57 L69 43 L55 51 L57 72 Z" fill="#23a383" stroke="#0d4f3f" stroke-width="1.1" stroke-linejoin="round"/>
    <path d="M30 80 L33 136 M70 80 L67 136" stroke="#167560" stroke-width="0.8"/>
    ${face}${determined}
  </svg>`;
}

const EO_PIECES = [
  { name: 'Exodia', icon: '🗿', head: true, land: 74 },
  { name: 'R. Arm', icon: '💪', land: 88 },
  { name: 'L. Arm', icon: '💪', flip: true, land: 68 },
  { name: 'R. Leg', icon: '🦵', land: 94 },
  { name: 'L. Leg', icon: '🦵', flip: true, land: 81 }
];

function eoSplash(x, at, big = false) {
  const drops = ceRange(fxCount(big ? 14 : 6), () => {
    const dx = ceRand(-1, 1) * (big ? 70 : 24);
    const dy = -ceRand(big ? 50 : 14, big ? 130 : 36);
    return `<span class="eo-drop" style="--dx: ${dx.toFixed(0)}px; --dy: ${dy.toFixed(0)}px;"></span>`;
  });
  return `<div class="eo-splash${big ? ' eo-splash--big' : ''}" style="left: ${x}%; --at: ${at}ms;"><span class="eo-ring"></span>${drops}</div>`;
}

function eoCard(p, extra = '') {
  return `<span class="eo-card${p.head ? ' eo-card--head' : ''}"${extra}><b>${p.name}</b><span class="ce-emoji"${p.flip ? ' style="transform: scaleX(-1);"' : ''}>${p.icon}</span></span>`;
}

function playExodiaOverboardEgg() {
  markEggFound('exodia-overboard');
  playSound({ name: 'egg-exodia-overboard' });
  const say = (text, at, len, x, y) =>
    `<div class="ce-at ce-bubble eo-say" style="left: ${x}%; top: ${y}%; --at: ${at}ms; --len: ${len}ms;">${text}</div>`;
  const stars = ceRange(fxCount(16), () =>
    `<span class="eo-star" style="left: ${ceRand(2, 98).toFixed(0)}%; top: ${ceRand(3, 50).toFixed(0)}%; --tw: ${ceRand(0, 1500).toFixed(0)}ms;"></span>`);
  const mid = (EO_PIECES.length - 1) / 2;
  const cards = EO_PIECES.map((p, i) => {
    const at = EO_THROW_MS + i * EO_THROW_GAP_MS;
    return eoCard(p, ` style="--fan: ${((i - mid) * 14).toFixed(0)}deg; --at: ${at}ms; --dx: calc(${p.land - EO_FAN_X}vw - var(--hx)); --dy: calc(${EO_SEA_Y - EO_DECK_Y}vh + var(--hy));"`);
  }).join('');
  const plops = EO_PIECES.map((p, i) => eoSplash(p.land, EO_THROW_MS + i * EO_THROW_GAP_MS + EO_FLIGHT_MS - 40)).join('');
  spawnStartEgg('overboard', EXODIA_OVERBOARD_EGG_MS, `
    <div class="eo-scene">
      <div class="eo-sky">${stars}<span class="eo-moon ce-emoji">🌕</span></div>
      <div class="eo-sea"><span class="eo-wave eo-wave--back"></span><span class="eo-wave"></span></div>
      <div class="eo-ship">
        <span class="eo-hull"></span>
        <span class="eo-rail"></span>
        <span class="eo-mast"></span>
        <div class="ce-at eo-weevil"><div class="eo-weevil-body">${EO_WEEVIL_SVG}<div class="ce-at eo-fan">${cards}</div>${EO_WEEVIL_ARM_SVG}</div></div>
      </div>
      ${plops}
      <div class="ce-at eo-joey">${eoJoeySvg()}</div>
      ${eoSplash(80, EO_DIVE_SPLASH_MS, true)}
      <div class="eo-flash"></div>
      <div class="ce-at eo-surface">
        <span class="eo-held">${eoCard(EO_PIECES[2])}${eoCard(EO_PIECES[3])}</span>
        <span class="eo-joey-head">${eoJoeySvg(true)}</span>
      </div>
      <div class="eo-caption">Meanwhile, on the ship to Duelist Kingdom…</div>
      ${say('Hehehe… so THIS is the unstoppable Exodia?', 2000, 1500, EO_FAN_X + 8, 22)}
      ${say('Bye-bye, Exodia! Hehehe!', 3600, 1500, EO_FAN_X + 4, 22)}
      ${say('EXODIAAA! I\'ll get \'em, Yug!', 5500, 1200, 50, 22)}
      ${say('WAAAH! I only found two, Yug…!', 7600, 1500, 66, 54)}
      ${say('Hehehe… two out of five is still no Exodia!', 8100, 1500, 42, 22)}
    </div>
    <div class="cegg-toast">Exodia sleeps with the fishes.<small>Weevil threw it overboard. Your new run is safe… for now.</small></div>`);
}
