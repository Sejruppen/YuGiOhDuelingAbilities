// Millennium theme (Solo reward, src/config/app-themes.js): the duel screen's
// Millennium Items. Hidden abilities are stone tablets etched with an Item
// (Skill: Puzzle, Comeback: Ring, Quest: Scale) and a peek is a Necklace
// vision; activating summons the card's Item over it (the Puzzle's pieces
// snap together, the Ring's pointers whirl and settle, the Scale tips and
// balances). Losing LP pours sand out of the LP cartouche, healing raises the
// glowing Rod, and the Millennium Eye over the duel (#mil-eye) opens wider as
// your LP drops. Under 1000 LP the duel becomes a Shadow Game: purple mist
// (#mil-shadow) creeps in and the Eye burns red. The carved LP digits crumble
// on damage (stone chips fly) and are re-carved. Around the whole theme:
// torchlight at the screen edges (#season-fx) and stone doors that grind open
// on every screen change. Styles: styles.css and effects.css (MILLENNIUM THEME – DUEL).

const MIL_CARD_ITEMS = { skill: 'puzzle', comeback: 'ring', quest: 'scale' };
const MIL_SHADOW_LP = 1000;

// SOLO_SHELF_ART's Scale, with the beam and each pan grouped so they can tip.
const MIL_SCALE_ART = `<rect x="18.6" y="8" width="2.8" height="26" fill="GOLD" stroke="#78350f" stroke-width="0.8"/>
  <polygon points="15,33 25,33 29,37.5 11,37.5" fill="GOLD" stroke="#78350f" stroke-width="1" stroke-linejoin="round"/>
  <g class="mil-beam">
    <path d="M5 11.5 Q20 7.5 35 11.5" fill="none" stroke="GOLD" stroke-width="2.8" stroke-linecap="round"/>
    <g class="mil-pan mil-pan--l"><path d="M6 12 L2.5 23 M6 12 L9.5 23" stroke="#b45309" stroke-width="0.9"/><path d="M1.5 23 Q6 29 10.5 23 Z" fill="GOLD" stroke="#78350f" stroke-width="1"/></g>
    <g class="mil-pan mil-pan--r"><path d="M34 12 L30.5 23 M34 12 L37.5 23" stroke="#b45309" stroke-width="0.9"/><path d="M29.5 23 Q34 29 38.5 23 Z" fill="GOLD" stroke="#78350f" stroke-width="1"/></g>
  </g>
  <circle cx="20" cy="6.5" r="3.4" fill="GOLD" stroke="#78350f" stroke-width="1"/>
  <path d="M18 6.5 Q20 5 22 6.5 Q20 8 18 6.5 Z" fill="#78350f"/>`;

// The Millennium Eye watching over the duel (the shape of --mil-eye-img in styles.css);
// its glow and iris open with data-open (0-3).
const MIL_EYE_SVG = `<svg viewBox="0 0 100 62" fill="none" stroke="#fbbf24" stroke-width="8" stroke-linecap="round" aria-hidden="true">
  <path d="M7 26H26A26 26 0 0 1 74 26H93M7 36H26A26 26 0 0 0 74 36H93" stroke-linejoin="round"/>
  <g class="mil-eye-lid" stroke="none"><path d="M26 26A26 26 0 0 1 74 26V36A26 26 0 0 1 26 36Z" fill="rgba(251, 191, 36, 0.14)"/></g>
  <g class="mil-eye-iris" stroke="none"><circle cx="50" cy="31" r="14.5" fill="#fbbf24"/><circle cx="50" cy="31" r="6" fill="#000"/></g>
</svg>`;

const isMillenniumTheme = () => document.documentElement.dataset.theme === 'millennium';

// An Item in polished gold (each SVG gets its own gradient id, like soloShelfIcon).
let milArtSeq = 0;
function milItemSvg(id) {
  const gid = `mil-gold-${++milArtSeq}`;
  const art = id === 'scale' ? MIL_SCALE_ART : SOLO_SHELF_ART[id];
  return `<svg viewBox="0 0 40 40" aria-hidden="true">
    <defs><linearGradient id="${gid}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#fef3c7"/><stop offset="0.35" stop-color="#fbbf24"/><stop offset="0.7" stop-color="#d97706"/><stop offset="1" stop-color="#92400e"/>
    </linearGradient></defs>
    ${art.replace(/GOLD/g, `url(#${gid})`)}
  </svg>`;
}

// The Item carved into a hidden card's tablet (or the Necklace behind a peek).
function millenniumEtch(itemId) {
  return isMillenniumTheme() && itemId ? `<div class="mil-etch" aria-hidden="true">${milItemSvg(itemId)}</div>` : '';
}

// Activating a card (effects.js): its Item appears over it. Timings in effects.css.
function spawnMillenniumItem(card, type) {
  const item = MIL_CARD_ITEMS[type];
  if (!isMillenniumTheme() || !card || !item) return;
  const { x, y, h } = getCenter(card);
  const size = Math.min(h * 0.9, window.innerWidth * 0.45, 230);
  const art = item === 'puzzle'
    ? [1, 2, 3].map(i => `<div class="mil-piece mil-piece--${i}">${milItemSvg('puzzle')}</div>`).join('')
    : milItemSvg(item);
  spawnFx(`fx-mil-item fx-mil-item--${item}`, item === 'puzzle' ? 2000 : 2400, {
    vars: { '--x': `${x.toFixed(0)}px`, '--y': `${y.toFixed(0)}px`, '--size': `${size.toFixed(0)}px` },
    html: `<div class="mil-item-glow"></div><div class="mil-item-art">${art}</div>`
  });
}

const milSandLevel = lp => Math.max(0, Math.min(1, lp / STARTING_LP)).toFixed(3);

// An LP change (effects.js): the cartouche's sand level slides from the old LP,
// grains fall inside it on damage, and the Rod rises over it on a heal.
function spawnMillenniumLp(lpBar, from, to) {
  if (!isMillenniumTheme() || !lpBar) return;
  if (from >= MIL_SHADOW_LP && to < MIL_SHADOW_LP && to > 0) {
    playSound({ name: 'mil-shadow-game' });
    spawnFx('fx-mil-shadow-in', 1800);
  }
  if (prefersReducedMotion()) return;
  lpBar.style.setProperty('--lp-sand-from', milSandLevel(from));
  lpBar.classList.add('mil-sand-shift');
  // While the LP editor is open the bar is hidden behind it.
  if (ui.lpModalOpen) return;

  const r = lpBar.getBoundingClientRect();
  if (to < from) {
    const surface = r.top + r.height * (1 - milSandLevel(from));
    const grains = Array.from({ length: fxCount(24) }, () => {
      const y = rand(surface, surface + 18);
      const vars = `--gx:${rand(r.left + 12, r.right - 12).toFixed(0)}px;--gy:${y.toFixed(0)}px;` +
        `--fall:${Math.max(16, r.bottom - 16 - y).toFixed(0)}px;--gd:${rand(0, 0.55).toFixed(2)}s;--gs:${rand(2, 4).toFixed(1)}px`;
      return `<i style="${vars}"></i>`;
    }).join('');
    spawnFx('fx-mil-sand', 1800, { html: grains });

    // Stone chips break off the carved digits.
    const digits = lpBar.querySelector('.lp-value')?.getBoundingClientRect();
    if (digits) {
      const chips = Array.from({ length: fxCount(12) }, () => {
        const vars = `--cx:${rand(digits.left, digits.right).toFixed(0)}px;--cy:${rand(digits.top, digits.bottom).toFixed(0)}px;` +
          `--dx:${rand(-45, 45).toFixed(0)}px;--dy:${rand(25, 90).toFixed(0)}px;--rot:${rand(-260, 260).toFixed(0)}deg;` +
          `--cs:${rand(3, 6).toFixed(1)}px;--cd:${rand(0, 0.15).toFixed(2)}s`;
        return `<i style="${vars}"></i>`;
      }).join('');
      spawnFx('fx-mil-chips', 1300, { html: chips });
    }
  } else {
    spawnFx('fx-mil-rod', 1500, {
      vars: { '--x': `${(r.left + r.width / 2).toFixed(0)}px`, '--y': `${(r.top + r.height / 2).toFixed(0)}px` },
      html: milItemSvg('rod')
    });
  }
}

// After every render (effects.js): show the Eye on the duel screen, opened by how
// low your LP is, and the Shadow Game's mist (and a red Eye) under 1000 LP.
function syncMillenniumEye() {
  const wanted = isMillenniumTheme() && state.screen === SCREENS.DUEL && document.body;
  let eye = document.getElementById('mil-eye');
  let mist = document.getElementById('mil-shadow');
  if (!wanted) {
    if (eye) eye.remove();
    if (mist) mist.remove();
    return;
  }

  const lp = getCurrentLp();
  const open = String(lp > 6000 ? 0 : lp > 4000 ? 1 : lp > 2000 ? 2 : 3);
  const shadow = lp < MIL_SHADOW_LP;
  if (!eye) {
    eye = document.createElement('div');
    eye.id = 'mil-eye';
    eye.setAttribute('aria-hidden', 'true');
    eye.dataset.open = open;
    eye.innerHTML = MIL_EYE_SVG;
    document.body.appendChild(eye);
  }
  if (eye.dataset.open !== open) eye.dataset.open = open;
  if (eye.hasAttribute('data-shadow') !== shadow) eye.toggleAttribute('data-shadow', shadow);

  if (!mist) {
    mist = document.createElement('div');
    mist.id = 'mil-shadow';
    mist.setAttribute('aria-hidden', 'true');
    mist.innerHTML = '<div class="mil-mist"></div><div class="mil-mist mil-mist--2"></div>';
    document.body.appendChild(mist);
    void mist.offsetWidth;
  }
  if (mist.classList.contains('mil-shadow--on') !== shadow) mist.classList.toggle('mil-shadow--on', shadow);
}

// The theme's #season-fx layer (effects.js), under its gold dust: torchlight
// flickering at both edges (left high, right low, so it suits either player)
// with embers rising from it.
function millenniumSeasonHtml() {
  const embers = () => Array.from({ length: fxCount(6) }, () => {
    const vars = `--ex:${rand(0, 30).toFixed(0)}px;--ed:${rand(3.5, 7).toFixed(1)}s;` +
      `--edelay:${(-rand(0, 7)).toFixed(1)}s;--ew:${rand(10, 60).toFixed(0)}px`;
    return `<b class="mil-ember" style="${vars}"></b>`;
  }).join('');
  return ['l', 'r'].map(side => `<span class="mil-torch mil-torch--${side}"><span class="mil-torch-light"></span>${embers()}</span>`).join('');
}

// The screen being left, copied just before a screen change renders (effects.js
// beforeRenderEffects), so the doors can close over it before opening on the new one.
let milDoorGhost = null;

function captureMillenniumGhost(app) {
  milDoorGhost = null;
  if (!isMillenniumTheme() || !fxLastSnapshot || fxLastSnapshot.screen === state.screen || prefersReducedMotion()) return;

  const r = app.getBoundingClientRect();
  const el = document.createElement('div');
  el.className = 'mil-door-ghost';
  el.style.cssText = `left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px`;
  el.append(...[...app.childNodes].map(node => node.cloneNode(true)));

  const scrolls = [];
  app.querySelectorAll('*').forEach((node, i) => {
    if (node.scrollTop || node.scrollLeft) scrolls.push([i, node.scrollTop, node.scrollLeft]);
  });
  el.querySelectorAll('[id]').forEach(node => node.removeAttribute('id'));
  el.querySelectorAll('[class*="fx-"]').forEach(node => {
    node.classList.remove(...[...node.classList].filter(c => c.startsWith('fx-')));
  });
  milDoorGhost = { el, scrolls };
}

// A screen change (effects.js): the tomb's stone doors grind shut over the old
// screen, the Eye seal flashes and they open onto the new one (on the first
// screen there's nothing to close over, so they only open).
function spawnMillenniumDoors() {
  if (!isMillenniumTheme()) return;
  const ghost = milDoorGhost;
  milDoorGhost = null;
  playSound({ name: 'mil-doors', close: !!ghost });
  document.querySelectorAll('.fx-mil-doors').forEach(doors => doors.remove());
  const doors = spawnFx(`fx-mil-doors${ghost ? ' fx-mil-doors--close' : ''}`, ghost ? 1400 : 1100, {
    html: '<div class="mil-door mil-door--l"></div><div class="mil-door mil-door--r"></div><div class="mil-door-seal"></div>'
  });
  if (!doors || !ghost) return;

  doors.prepend(ghost.el);
  const nodes = ghost.el.querySelectorAll('*');
  ghost.scrolls.forEach(([i, top, left]) => {
    if (!nodes[i]) return;
    nodes[i].scrollTop = top;
    nodes[i].scrollLeft = left;
  });
  // The new screen is revealed by the doors, so it skips its rise-in.
  restartClass(document.documentElement, 'mil-doors-closing', 1400);
}
