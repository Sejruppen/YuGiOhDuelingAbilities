// THE GRAND FINALE: "The Ceremonial Battle". Plays once when the last of the
// 40 easter eggs is found (egg-tracker.js), and can be replayed from the
// start screen's counter afterwards.
//
//   0.6s   Darkness. "40 / 40", "Every secret uncovered.", heartbeat drums.
//   3.2s   Torches ignite and the Pharaoh's tomb lights up: stone walls, a
//          crimson aisle and the Door of Memories with the Eye of Wdjat.
//   4.0s   Every duelist rises from the floor as an honour guard of cards
//          lining the aisle, far to near.
//   8.5s   The seven Millennium Items fly in one by one and lock into the
//          door (Puzzle, Eye, Ring, Rod, Necklace, Scales, Key).
//  14.1s   The carvings light up in gold, the Eye blazes, the tomb trembles.
//  15.6s   Yami Yugi walks the aisle; the guard bows as he passes.
//  19.6s   The door swings open, golden light floods out, the items rise.
//  21.0s   He walks into the light...
//  22.4s   ...everything goes white,
//  25.0s   "You found every secret." / "The Pharaoh can finally rest."
//  28.6s   The "Duelist of All Secrets" trophy card flips in.
//
// Timeline: "PHARAOH FINALE" in effects.css. Score: 'pharaoh-finale' in
// sounds.js (FINALE_SOUNDS). Skip / Close / Escape any time.
const FINALE_SKIP_GRACE_MS = 800;
// After this the trophy and buttons are up; Escape then closes.
const FINALE_END_MS = 31000;

const finale = { overlay: null, openedAt: 0, skipped: false, endTimer: null };

const MILLENNIUM_ITEMS = [
  {
    name: 'Millennium Puzzle',
    svg: `<polygon points="4,6 36,6 20,36" fill="url(#fin-gold)" stroke="#78350f" stroke-width="1.5" stroke-linejoin="round"/>
      <path d="M11 14 Q20 8 29 14 Q20 20 11 14 Z" fill="#78350f"/><circle cx="20" cy="14" r="2.6" fill="#fde68a"/>
      <path d="M20 2 L20 6" stroke="#78350f" stroke-width="2"/>`
  },
  {
    name: 'Millennium Eye',
    svg: `<circle cx="20" cy="20" r="16" fill="url(#fin-gold)" stroke="#78350f" stroke-width="1.5"/>
      <path d="M8 20 Q20 10 32 20 Q20 30 8 20 Z" fill="#fffbeb" stroke="#78350f" stroke-width="1.5"/>
      <circle cx="20" cy="20" r="5" fill="#78350f"/><path d="M17 26 L15 34" stroke="#78350f" stroke-width="1.5"/>`
  },
  {
    name: 'Millennium Ring',
    svg: `<circle cx="20" cy="16" r="13" fill="none" stroke="url(#fin-gold)" stroke-width="4"/>
      <polygon points="20,6 29,22 11,22" fill="url(#fin-gold)" stroke="#78350f" stroke-width="1"/>
      <circle cx="20" cy="16" r="2.5" fill="#78350f"/>
      <g stroke="url(#fin-gold)" stroke-width="2.4" stroke-linecap="round"><path d="M8 26 L6 36"/><path d="M14 29 L13 38"/><path d="M20 30 L20 39"/><path d="M26 29 L27 38"/><path d="M32 26 L34 36"/></g>`
  },
  {
    name: 'Millennium Rod',
    svg: `<rect x="18" y="14" width="4" height="25" rx="1.5" fill="url(#fin-gold)" stroke="#78350f" stroke-width="1"/>
      <circle cx="20" cy="11" r="6" fill="url(#fin-gold)" stroke="#78350f" stroke-width="1.2"/>
      <path d="M14 11 Q6 6 4 14 Q10 12 14 14 Z M26 11 Q34 6 36 14 Q30 12 26 14 Z" fill="url(#fin-gold)" stroke="#78350f" stroke-width="1"/>
      <path d="M17 11 Q20 8 23 11 Q20 14 17 11 Z" fill="#78350f"/>`
  },
  {
    name: 'Millennium Necklace',
    svg: `<path d="M6 6 Q20 22 34 6" fill="none" stroke="url(#fin-gold)" stroke-width="2.4"/>
      <path d="M8 18 Q20 40 32 18 Q20 24 8 18 Z" fill="url(#fin-gold)" stroke="#78350f" stroke-width="1.2"/>
      <path d="M13 24 Q20 19 27 24 Q20 29 13 24 Z" fill="#fffbeb" stroke="#78350f" stroke-width="1"/><circle cx="20" cy="24" r="2.4" fill="#78350f"/>`
  },
  {
    name: 'Millennium Scales',
    svg: `<rect x="18.5" y="6" width="3" height="30" fill="url(#fin-gold)" stroke="#78350f" stroke-width="0.8"/>
      <rect x="12" y="35" width="16" height="3" rx="1" fill="url(#fin-gold)" stroke="#78350f" stroke-width="0.8"/>
      <path d="M4 10 L36 10" stroke="url(#fin-gold)" stroke-width="2.6" stroke-linecap="round"/>
      <path d="M6 10 L2 22 M6 10 L10 22 M34 10 L30 22 M34 10 L38 22" stroke="#b45309" stroke-width="1"/>
      <path d="M1 22 Q6 28 11 22 Z M29 22 Q34 28 39 22 Z" fill="url(#fin-gold)" stroke="#78350f" stroke-width="1"/>
      <circle cx="20" cy="6" r="3" fill="url(#fin-gold)" stroke="#78350f" stroke-width="1"/>`
  },
  {
    name: 'Millennium Key',
    svg: `<ellipse cx="20" cy="11" rx="7" ry="9" fill="none" stroke="url(#fin-gold)" stroke-width="4"/>
      <path d="M6 21 L34 21" stroke="url(#fin-gold)" stroke-width="4.5" stroke-linecap="round"/>
      <path d="M20 20 L20 39" stroke="url(#fin-gold)" stroke-width="5" stroke-linecap="round"/>
      <path d="M15 11 Q20 7 25 11 Q20 15 15 11 Z" fill="#78350f"/>`
  }
];

// The Door of Memories' carvings (200 x 300; each door half shows one side).
// The seven slots sit on a circle around the Eye of Wdjat.
const FINALE_SLOT_CENTER = { x: 100, y: 128, r: 70 };
const finaleSlot = i => {
  const a = -Math.PI / 2 + (i * 2 * Math.PI) / MILLENNIUM_ITEMS.length;
  return {
    x: FINALE_SLOT_CENTER.x + FINALE_SLOT_CENTER.r * Math.cos(a),
    y: FINALE_SLOT_CENTER.y + FINALE_SLOT_CENTER.r * Math.sin(a)
  };
};

const FINALE_EYE_PATHS = `
  <path d="M58 100 Q100 82 144 98" stroke-width="7" stroke-linecap="round"/>
  <path d="M62 128 Q100 100 140 126 Q100 148 62 128 Z" stroke-width="4"/>
  <circle cx="100" cy="124" r="11" stroke-width="4"/>
  <path d="M86 140 L80 176" stroke-width="5" stroke-linecap="round"/>
  <path d="M104 143 Q110 170 130 172 Q144 170 141 158 Q137 150 128 156" stroke-width="4" stroke-linecap="round"/>`;

function finaleCarvings(lit) {
  const slots = MILLENNIUM_ITEMS.map((_, i) => {
    const { x, y } = finaleSlot(i);
    return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="13" stroke-width="2.5"/>`;
  }).join('');
  const glyphs = `
    <path d="M30 222 L30 270 M22 236 L38 236 M30 222 Q20 210 30 202 Q40 210 30 222" stroke-width="3"/>
    <path d="M170 222 L170 270 M162 236 L178 236 M170 222 Q160 210 170 202 Q180 210 170 222" stroke-width="3"/>
    <path d="M56 246 Q66 236 76 246 Q86 256 96 246 Q106 236 116 246 Q126 256 136 246 Q146 236 152 244" stroke-width="3"/>
    <path d="M56 262 Q66 252 76 262 Q86 272 96 262 Q106 252 116 262 Q126 272 136 262 Q146 252 152 260" stroke-width="3"/>
    <ellipse cx="100" cy="222" rx="16" ry="10" stroke-width="3"/>
    <path d="M84 222 L72 214 M84 222 L72 230 M116 222 L128 214 M116 222 L128 230" stroke-width="2.5"/>`;
  const frame = `
    <rect x="10" y="10" width="180" height="280" rx="4" stroke-width="3"/>
    <rect x="18" y="18" width="164" height="264" rx="2" stroke-width="1.5"/>
    <path d="M18 200 L182 200" stroke-width="2"/>`;
  return `
    <svg viewBox="0 0 200 300" preserveAspectRatio="none" aria-hidden="true">
      <g fill="none" stroke="${lit ? '#fde68a' : '#a16207'}" ${lit ? 'class="fin-carve-lines"' : 'opacity="0.75"'}>
        ${[frame, glyphs, FINALE_EYE_PATHS, slots].join('').replace(/<(path|rect|circle|ellipse) /g, lit ? '<$1 pathLength="1" ' : '<$1 ')}
      </g>
      ${lit ? '' : `<g fill="rgb(0 0 0 / 0.55)">${MILLENNIUM_ITEMS.map((_, i) => {
        const { x, y } = finaleSlot(i);
        return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="11"/>`;
      }).join('')}</g>`}
    </svg>`;
}

// Yami Yugi from behind: the hair, the jacket worn like a cape, the boots.
const FINALE_YAMI_SVG = `
  <svg viewBox="0 0 120 240" aria-hidden="true">
    <g fill="#07070c">
      <rect x="43" y="168" width="12" height="70" rx="3"/>
      <rect x="65" y="168" width="12" height="70" rx="3"/>
      <path d="M40 88 Q60 78 80 88 L84 176 L36 176 Z"/>
      <g class="fin-yami-cape">
        <path d="M30 84 Q60 70 90 84 L112 204 L98 196 L90 214 L78 200 L60 220 L42 200 L30 214 L22 196 L8 204 Z"/>
      </g>
      <circle cx="60" cy="64" r="14"/>
      <polygon class="fin-yami-hair" points="26,62 12,30 36,44 30,6 50,32 60,-4 70,32 90,6 84,44 108,30 94,62 60,74"/>
    </g>
    <g fill="none" stroke="#fbbf24" stroke-width="1.6" stroke-linejoin="round" opacity="0.85">
      <polyline points="26,62 12,30 36,44 30,6 50,32 60,-4 70,32 90,6 84,44 108,30 94,62"/>
      <path d="M30 84 Q60 70 90 84"/>
    </g>
    <g fill="#be123c" opacity="0.9">
      <polygon points="12,30 20,40 24,38"/><polygon points="30,6 34,22 38,20"/><polygon points="60,-4 58,14 62,14"/>
      <polygon points="90,6 82,20 86,22"/><polygon points="108,30 96,38 100,40"/>
    </g>
  </svg>`;

function finaleGuardHtml() {
  const duelists = CHARACTERS.map(c => {
    const [main, sub] = c.name.split(' (');
    return { main, sub: sub ? sub.replace(/\)$/, '') : '', initial: main.trim()[0] || '?' };
  });
  const perSide = Math.max(1, Math.ceil(duelists.length / 2));
  return duelists.map((d, i) => {
    const side = i % 2 ? 1 : -1;
    const row = Math.floor(i / 2);
    // Row 0 is the far end by the door; they rise far -> near.
    const depth = perSide > 1 ? 1 - row / (perSide - 1) : 0.5;
    const rise = 4.0 + row * (3.6 / perSide) + (side > 0 ? 0.12 : 0);
    const bow = 15.9 + 3.4 * depth;
    const hue = Math.round((i * 360) / duelists.length + 20) % 360;
    return `
      <div class="fin-guard" style="--s: ${side}; --d: ${depth.toFixed(3)}; --rise: ${rise.toFixed(2)}s; --bow: ${bow.toFixed(2)}s; --hue: ${hue}; z-index: ${Math.round(100 - depth * 60)};">
        <div class="fin-guard-card">
          <span class="fin-guard-initial">${hdrEsc(d.initial)}</span>
          <span class="fin-guard-name">${hdrEsc(d.main)}${d.sub ? `<small>${hdrEsc(d.sub)}</small>` : ''}</span>
        </div>
      </div>`;
  }).join('');
}

function finaleItemsHtml() {
  // Each item flies in from a different edge of the screen.
  const from = [['0vw', '-70vh'], ['-70vw', '-40vh'], ['70vw', '-40vh'], ['-80vw', '20vh'], ['80vw', '20vh'], ['-50vw', '70vh'], ['50vw', '70vh']];
  return MILLENNIUM_ITEMS.map((item, i) => {
    const { x, y } = finaleSlot(i);
    const [fx, fy] = from[i];
    const arrive = 8.5 + i * 0.8;
    return `
      <div class="fin-item" style="left: ${(x / 2).toFixed(2)}%; top: ${(y / 3).toFixed(2)}%; --fx: ${fx}; --fy: ${fy}; --at: ${arrive.toFixed(2)}s;">
        <div class="fin-item-glow"><svg viewBox="0 0 40 40" aria-hidden="true">${item.svg}</svg></div>
      </div>`;
  }).join('');
}

function finaleItemNamesHtml() {
  return MILLENNIUM_ITEMS.map((item, i) =>
    `<span class="fin-item-name" style="--at: ${(8.5 + i * 0.8 + 0.55).toFixed(2)}s;">${item.name}</span>`).join('');
}

function finaleHtml() {
  const motes = Array.from({ length: 26 }, () =>
    `<i style="--x: ${ceRand(-50, 50).toFixed(0)}%; --dx: ${ceRand(-30, 30).toFixed(0)}px; --t: ${ceRand(19.8, 23).toFixed(2)}s; --dur: ${ceRand(1.6, 2.8).toFixed(2)}s;"></i>`).join('');
  const dust = Array.from({ length: 18 }, () =>
    `<i style="--x: ${ceRand(0, 100).toFixed(0)}%; --y: ${ceRand(10, 90).toFixed(0)}%; --t: ${ceRand(3.5, 8).toFixed(2)}s; --dur: ${ceRand(5, 9).toFixed(2)}s;"></i>`).join('');
  return `
    <svg width="0" height="0" style="position: absolute;" aria-hidden="true">
      <defs>
        <linearGradient id="fin-gold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#fef3c7"/>
          <stop offset="0.45" stop-color="#fbbf24"/>
          <stop offset="1" stop-color="#b45309"/>
        </linearGradient>
      </defs>
    </svg>
    <div class="fin-scene">
      <div class="fin-shaker">
        <div class="fin-tomb"></div>
        <div class="fin-rays"></div>
        <div class="fin-floor"><div class="fin-aisle"></div><div class="fin-spill"></div></div>
        <div class="fin-torch fin-torch--l"><span class="fin-flame"></span></div>
        <div class="fin-torch fin-torch--r"><span class="fin-flame"></span></div>
        <div class="fin-door">
          <div class="fin-door-light"></div>
          <div class="fin-door-half fin-door-half--l">${finaleCarvings(false)}<div class="fin-lit">${finaleCarvings(true)}</div></div>
          <div class="fin-door-half fin-door-half--r">${finaleCarvings(false)}<div class="fin-lit">${finaleCarvings(true)}</div></div>
          <div class="fin-eye-blaze"></div>
          <div class="fin-seam"></div>
          <div class="fin-items">${finaleItemsHtml()}</div>
          <div class="fin-motes">${motes}</div>
        </div>
        <div class="fin-item-names">${finaleItemNamesHtml()}</div>
        ${finaleGuardHtml()}
        <div class="fin-yami"><div class="fin-yami-bob">${FINALE_YAMI_SVG}</div></div>
        <div class="fin-dust">${dust}</div>
      </div>
    </div>
    <div class="fin-intro">
      <strong>${EGG_TOTAL} / ${EGG_TOTAL}</strong>
      <span>Every secret uncovered.</span>
      <em>The Pharaoh remembers…</em>
    </div>
    <div class="fin-flood"></div>
    <div class="fin-end-bg"></div>
    <div class="fin-end">
      <p class="fin-end-l1">You found every secret.</p>
      <p class="fin-end-l2">The Pharaoh can finally rest.</p>
      <div class="fin-trophy">
        <div class="fin-trophy-card">
          <div class="fin-trophy-name">Duelist of All Secrets</div>
          <div class="fin-trophy-stars">${'★'.repeat(12)}</div>
          <div class="fin-trophy-art">
            <svg viewBox="40 70 120 120" aria-hidden="true"><g fill="none" stroke="#fde68a">${FINALE_EYE_PATHS}</g></svg>
          </div>
          <div class="fin-trophy-type">[Pharaoh / Legend]</div>
          <div class="fin-trophy-text">Found all ${EGG_TOTAL} secrets hidden in Dueling Abilities. Cannot be destroyed. Cannot be forgotten.</div>
          <div class="fin-trophy-stats">ATK/∞ &nbsp; DEF/∞</div>
          <span class="fin-trophy-shine"></span>
        </div>
      </div>
      <div class="fin-end-buttons">
        <button type="button" class="fin-btn fin-btn--ghost" onclick="replayPharaohFinale()">↺ Replay</button>
        <button type="button" class="fin-btn" onclick="closePharaohFinale()">Close</button>
      </div>
    </div>
    <button type="button" class="fin-skip" onclick="skipPharaohFinale()">Skip ⏭</button>
  `;
}

function playPharaohFinale() {
  if (finale.overlay) return;
  markFinaleSeen();
  const overlay = document.createElement('div');
  overlay.className = 'fx-finale';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'The Ceremonial Battle: you found every secret.');
  overlay.innerHTML = finaleHtml();
  getFxLayer().appendChild(overlay);
  finale.overlay = overlay;
  finale.openedAt = performance.now();
  finale.skipped = false;
  clearTimeout(finale.endTimer);
  finale.endTimer = setTimeout(() => { finale.skipped = true; }, FINALE_END_MS);
  document.addEventListener('keydown', onFinaleKey);

  if (prefersReducedMotion()) {
    finale.skipped = true;
    overlay.classList.add('fin--skip');
    playSound({ name: 'pharaoh-finale-skip' });
  } else {
    playSound({ name: 'pharaoh-finale' });
  }
  overlay.querySelector('.fin-skip')?.focus({ preventScroll: true });
}

function skipPharaohFinale() {
  const overlay = finale.overlay;
  if (!overlay || finale.skipped || performance.now() - finale.openedAt < FINALE_SKIP_GRACE_MS) return;
  finale.skipped = true;
  overlay.classList.add('fin--skip');
  playSound({ name: 'pharaoh-finale-skip' });
  overlay.querySelector('.fin-end-buttons .fin-btn:last-child')?.focus({ preventScroll: true });
}

function closePharaohFinale() {
  const overlay = finale.overlay;
  if (!overlay) return;
  finale.overlay = null;
  clearTimeout(finale.endTimer);
  document.removeEventListener('keydown', onFinaleKey);
  playSound({ name: 'pharaoh-finale-stop' });
  overlay.classList.add('fin--closing');
  setTimeout(() => overlay.remove(), 600);
}

function replayPharaohFinale() {
  const overlay = finale.overlay;
  if (!overlay) return;
  finale.overlay = null;
  clearTimeout(finale.endTimer);
  document.removeEventListener('keydown', onFinaleKey);
  playSound({ name: 'pharaoh-finale-stop' });
  overlay.remove();
  playPharaohFinale();
}

function onFinaleKey(event) {
  if (event.key !== 'Escape') return;
  if (finale.skipped) closePharaohFinale();
  else skipPharaohFinale();
}
