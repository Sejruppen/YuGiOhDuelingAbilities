// Visual effects engine. After every render it compares the previous and new
// state to detect what happened (screen change, peek, activation, LP change...)
// and plays it. This file is theme-agnostic: it only adds `fx-*` classes and
// spawns short-lived overlay elements; styles.css decides how each theme
// animates them. Overlays live in #fx-layer (outside #app) so re-renders
// don't cut them off.
const SCREEN_ORDER = [SCREENS.START, SCREENS.SETTINGS, SCREENS.TOURNAMENT, SCREENS.COOP, SCREENS.CHARACTER, SCREENS.ABILITIES, SCREENS.DUEL, SCREENS.DISK];
const LP_COUNT_DURATION_MS = 600;

const BANNER_TEXT = {
  skill: 'Skill Activated!',
  comeback: 'Comeback!',
  quest: 'Quest Complete!',
  defeat: 'Defeat...'
};

const fxQueue = [];
let fxLastSnapshot = null;
let fxLpDisplay = null;
let fxLpFrame = null;

function prefersReducedMotion() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

// For effects that can't be derived from a state diff (e.g. a duel reset).
function queueEffect(name, detail = {}) {
  fxQueue.push({ name, ...detail });
}

function captureFxSnapshot() {
  const char = getSelectedCharacter();
  const abilities = {};

  for (const abilityType of ABILITY_TYPE_ORDER) {
    const { type, hasUses, listKey, selectionKey } = abilityType;
    const ability = char?.[listKey]?.[state[selectionKey] ?? 0];
    const uses = state[`${type}Uses`] || 0;
    const active = hasUses ? !!state[`${type}Revealed`] : !!state.questCompleted;
    const maxUses = getMaxUses(abilityType, ability);

    abilities[type] = {
      active,
      uses,
      peek: !!ui.peek[type],
      selection: state[selectionKey],
      exhausted: hasUses && active && typeof maxUses === 'number' && uses >= maxUses
    };
  }

  return {
    screen: state.screen,
    lp: getCurrentLp(),
    lpSide: state.lpSide,
    lpModalOpen: ui.lpModalOpen,
    resetModalOpen: ui.resetModalOpen,
    abilities
  };
}

function detectEffects(prev, next) {
  if (!prev) return [{ name: 'screen-enter', direction: 'forward' }];

  if (prev.screen !== next.screen) {
    const forward = SCREEN_ORDER.indexOf(next.screen) >= SCREEN_ORDER.indexOf(prev.screen);
    return [{ name: 'screen-enter', direction: forward ? 'forward' : 'back' }];
  }

  const events = [];

  if ((!prev.lpModalOpen && next.lpModalOpen) || (!prev.resetModalOpen && next.resetModalOpen)) {
    events.push({ name: 'modal-open' });
  }

  if (next.screen === SCREENS.ABILITIES) {
    for (const { type } of ABILITY_TYPE_ORDER) {
      const selection = next.abilities[type].selection;
      if (prev.abilities[type].selection !== selection) events.push({ name: 'pick', type, index: selection });
    }
  }

  if (next.screen !== SCREENS.DUEL) return events;

  if (prev.lpSide !== next.lpSide) events.push({ name: 'lp-swap' });
  if (prev.lp !== next.lp) events.push({ name: 'lp-change', from: prev.lp, to: next.lp });

  for (const { type } of ABILITY_TYPE_ORDER) {
    const before = prev.abilities[type];
    const after = next.abilities[type];

    if (!before.active && after.active) {
      events.push({ name: type === 'quest' ? 'quest-complete' : 'activate', type, exhausted: after.exhausted });
    } else if (before.active && !after.active) {
      events.push({ name: 'deactivate', type });
    } else if (after.active && after.uses !== before.uses) {
      events.push({ name: 'use', type, delta: Math.sign(after.uses - before.uses) });
      if (!before.exhausted && after.exhausted) events.push({ name: 'exhaust', type });
      if (before.exhausted && !after.exhausted) events.push({ name: 'restore', type });
    }

    if (!before.peek && after.peek && !after.active) events.push({ name: 'peek', type });
    if (before.peek && !after.peek && !after.active) events.push({ name: 'unpeek', type });
  }

  return events;
}

// ---------------------------------------------------------------------------
// Render hooks (called from app.js)
// ---------------------------------------------------------------------------

function beforeRenderEffects(app) {
  // Lets infinite "ambient" animations keep their phase across re-renders
  // (see `animation-delay: calc(var(--fx-t) * -1ms)` in styles.css).
  document.documentElement.style.setProperty('--fx-t', Math.round(performance.now()));
  return { modal: app.querySelector('.modal-backdrop') };
}

function afterRenderEffects(app, before) {
  const prev = fxLastSnapshot;
  const next = captureFxSnapshot();
  fxLastSnapshot = next;

  let events = [...fxQueue.splice(0), ...detectEffects(prev, next)];

  // A duel reset has its own effect; skip the individual "undo" effects it causes.
  if (events.some(e => e.name === 'duel-reset')) {
    events = events
      .filter(e => e.name !== 'deactivate')
      .map(e => (e.name === 'lp-change' ? { ...e, silent: true } : e));
  }

  if (before.modal && !app.querySelector('.modal-backdrop')) playModalExit(before.modal);

  const lpChange = events.find(e => e.name === 'lp-change');
  if (lpChange) animateLpCount(lpChange.from, lpChange.to);
  else if (fxLpFrame !== null) paintLp(fxLpDisplay);

  events.forEach(event => playEffect(app, event));
}

// ---------------------------------------------------------------------------
// Effect playback
// ---------------------------------------------------------------------------

function playEffect(app, event) {
  const card = event.type ? app.querySelector(`[data-fx-card="${event.type}"]`) : null;
  const lpBar = app.querySelector('.lp-bar');

  // Roll once so the sound and the visuals agree on the outcome.
  if (event.name === 'lp-change' && !event.silent && event.to === 0 && event.from > 0) {
    event.shadowRealm = rollShadowRealm();
  }

  playSound(event);

  switch (event.name) {
    case 'screen-enter':
      restartClass(app, `fx-screen-${event.direction}`, 900);
      break;

    case 'modal-open':
      addFx(app.querySelector('.modal-backdrop'), 'fx-modal-in');
      break;

    case 'pick': {
      const option = app.querySelector(`[data-fx-pick="${event.type}-${event.index}"]`);
      addFx(option, 'fx-pick');
      spawnParticles(option, { type: event.type, mode: 'spark', count: 10 });
      break;
    }

    case 'lp-swap':
      addFx(lpBar, 'fx-lp-swap');
      addFx(app.querySelector('.duel-cards'), 'fx-cards-swap');
      break;

    case 'lp-change':
      playLpChange(app, lpBar, event);
      break;

    case 'activate':
      addFx(card, 'fx-activate');
      if (event.exhausted) addFx(card?.querySelector('.used-watermark'), 'fx-stamp-late');
      spawnOverlay('activate', event.type, 1500);
      spawnBanner(BANNER_TEXT[event.type], event.type);
      spawnParticles(card, { type: event.type, mode: 'burst', count: 26 });
      break;

    case 'quest-complete':
      addFx(card, 'fx-activate');
      spawnOverlay('quest', event.type, 1800);
      spawnBanner(BANNER_TEXT.quest, event.type);
      spawnParticles(card, { type: event.type, mode: 'burst', count: 20 });
      spawnParticles(null, { type: event.type, mode: 'rain', count: 70 });
      break;

    case 'deactivate':
      addFx(card, 'fx-undo');
      break;

    case 'use':
      addFx(card?.querySelector('.uses-count'), 'fx-bump');
      if (event.delta > 0) {
        addFx(card, 'fx-use');
        spawnBurst(card, '+1', 'Activate!', event.type);
        spawnParticles(card, { type: event.type, mode: 'burst', count: 10 });
      }
      break;

    case 'exhaust':
      addFx(card, 'fx-exhaust');
      addFx(card?.querySelector('.used-watermark'), 'fx-stamp');
      break;

    case 'restore':
      addFx(card, 'fx-restore');
      break;

    case 'peek':
      addFx(card, 'fx-peek');
      break;

    case 'unpeek':
      addFx(card, 'fx-unpeek');
      break;

    case 'duel-reset':
      spawnOverlay('reset', null, 1500);
      addFx(app.querySelector('.duel-cards'), 'fx-deal');
      addFx(lpBar, 'fx-lp-reset');
      break;
  }
}

function playLpChange(app, lpBar, { from, to, silent, shadowRealm }) {
  if (silent) return;

  const isDamage = to < from;
  const delta = to - from;
  const anchor = ui.lpModalOpen ? app.querySelector('.modal-panel .lp-value') : lpBar;

  addFx(lpBar, isDamage ? 'fx-lp-damage' : 'fx-lp-heal');
  spawnFloatText(anchor, `${delta > 0 ? '+' : ''}${delta}`, isDamage ? 'damage' : 'heal');

  if (isDamage) {
    spawnOverlay('damage', 'damage', 700);
    // These easter eggs move #app themselves, so don't fight them with a shake.
    if (!shadowRealm && !isLastStand(from, to)) restartClass(app, 'fx-shake', 600);
  } else {
    spawnParticles(lpBar, { type: 'heal', mode: 'rise', count: 16 });
  }

  if (isHealOverflow(from, to)) triggerHealOverflow(anchor);
  if (isLastStand(from, to)) triggerLastStand(app);
  if (isTinyViolin(from, to)) triggerTinyViolin();

  if (shadowRealm) {
    triggerShadowRealm(app);
  } else if (to === 0 && from > 0) {
    spawnOverlay('defeat', 'defeat', 2200);
    spawnBanner(BANNER_TEXT.defeat, 'defeat');
  }
}

// The closing modal is already gone from the DOM, so re-attach its old node
// as a non-interactive "ghost" just long enough to animate it out.
function playModalExit(modalNode) {
  playSound({ name: 'modal-close' });
  if (prefersReducedMotion()) return;
  modalNode.classList.remove('fx-modal-in');
  modalNode.classList.add('fx-modal-out');
  modalNode.setAttribute('aria-hidden', 'true');
  document.body.appendChild(modalNode);
  setTimeout(() => modalNode.remove(), 500);
}

// ---------------------------------------------------------------------------
// LP counter
// ---------------------------------------------------------------------------

function paintLp(value) {
  document.querySelectorAll('#app .lp-value').forEach(el => { el.textContent = value; });
}

function animateLpCount(from, to) {
  // Continue from the on-screen number if a count is already running.
  const start = fxLpFrame !== null ? fxLpDisplay : from;
  if (fxLpFrame !== null) cancelAnimationFrame(fxLpFrame);
  fxLpFrame = null;
  fxLpDisplay = to;
  if (prefersReducedMotion() || start === to) return;

  paintLp(start);
  const startedAt = performance.now();
  const step = now => {
    const progress = Math.min(1, (now - startedAt) / LP_COUNT_DURATION_MS);
    const eased = 1 - Math.pow(1 - progress, 3);
    fxLpDisplay = Math.round(start + (to - start) * eased);
    paintLp(fxLpDisplay);
    fxLpFrame = progress < 1 ? requestAnimationFrame(step) : null;
  };
  fxLpFrame = requestAnimationFrame(step);
}

// ---------------------------------------------------------------------------
// DOM helpers
// ---------------------------------------------------------------------------

function addFx(el, className) {
  if (el) el.classList.add(className);
}

// For elements that survive re-renders (#app): restart the animation and
// remove the class afterwards so later renders don't replay it.
function restartClass(el, className, durationMs) {
  if (!el) return;
  el.classList.remove(className);
  void el.offsetWidth;
  el.classList.add(className);
  clearTimeout(el[`_fx_${className}`]);
  el[`_fx_${className}`] = setTimeout(() => el.classList.remove(className), durationMs);
}

function getFxLayer() {
  let layer = document.getElementById('fx-layer');
  if (!layer) {
    layer = document.createElement('div');
    layer.id = 'fx-layer';
    layer.setAttribute('aria-hidden', 'true');
    document.body.appendChild(layer);
  }
  return layer;
}

function spawnFx(className, lifetimeMs, { vars = {}, html = '' } = {}) {
  if (prefersReducedMotion()) return null;
  const el = document.createElement('div');
  el.className = className;
  for (const [key, value] of Object.entries(vars)) el.style.setProperty(key, value);
  el.innerHTML = html;
  getFxLayer().appendChild(el);
  setTimeout(() => el.remove(), lifetimeMs);
  return el;
}

function getCenter(el) {
  if (!el) return { x: window.innerWidth / 2, y: window.innerHeight / 2, w: 0, h: 0 };
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height };
}

const rand = (min, max) => min + Math.random() * (max - min);

function spawnParticles(anchor, { type, mode, count }) {
  const origin = getCenter(anchor);

  for (let i = 0; i < count; i++) {
    let x = origin.x, y = origin.y, dx, dy, delay = rand(0, 80), duration = rand(650, 1100);

    if (mode === 'burst' || mode === 'spark') {
      const angle = rand(0, Math.PI * 2);
      const distance = mode === 'burst' ? rand(60, 170) : rand(25, 70);
      dx = Math.cos(angle) * distance;
      dy = Math.sin(angle) * distance;
    } else if (mode === 'rise') {
      x = origin.x + rand(-origin.w / 2, origin.w / 2);
      y = origin.y + rand(-origin.h / 3, origin.h / 2);
      dx = rand(-15, 15);
      dy = -rand(60, 160);
      delay = rand(0, 300);
    } else {
      x = rand(0, window.innerWidth);
      y = -20;
      dx = rand(-60, 60);
      dy = window.innerHeight + 40;
      delay = rand(0, 700);
      duration = rand(1600, 2600);
    }

    spawnFx(`fx-particle fx-particle--${mode} fx-c-${type}`, delay + duration + 50, {
      vars: {
        '--x': `${x}px`,
        '--y': `${y}px`,
        '--dx': `${dx}px`,
        '--dy': `${dy}px`,
        '--s': `${rand(4, 10).toFixed(1)}px`,
        '--rot': `${rand(-540, 540).toFixed(0)}deg`,
        '--hue': rand(0, 360).toFixed(0),
        '--d': `${duration.toFixed(0)}ms`,
        '--delay': `${delay.toFixed(0)}ms`
      }
    });
  }
}

function spawnBanner(text, type) {
  spawnFx(`fx-banner fx-c-${type}`, 2300, { html: `<span class="fx-banner-text">${text}</span>` });
}

function spawnOverlay(kind, type, lifetimeMs) {
  spawnFx(`fx-overlay fx-overlay--${kind}${type ? ` fx-c-${type}` : ''}`, lifetimeMs);
}

// `text` is the generic label; `altText` is used by themes with a bigger
// "comic burst" style (Power of Chaos).
function spawnBurst(anchor, text, altText, type) {
  const { x, y, w, h } = getCenter(anchor);
  spawnFx(`fx-burst fx-c-${type}`, 1200, {
    vars: { '--x': `${x + w * 0.22}px`, '--y': `${y - h * 0.18}px` },
    html: `<span class="fx-burst-text" data-alt="${altText}">${text}</span>`
  });
}

function spawnFloatText(anchor, text, kind) {
  const { x, y } = getCenter(anchor);
  spawnFx(`fx-float fx-float--${kind}`, 1300, {
    vars: { '--x': `${x}px`, '--y': `${y}px` },
    html: `<span>${text}</span>`
  });
}

// Tap feedback, drawn in the fx layer so it survives the re-render a tap causes.
document.addEventListener('pointerdown', event => {
  if (!event.target.closest?.('button, [onclick]')) return;
  spawnFx('fx-tap', 650, { vars: { '--x': `${event.clientX}px`, '--y': `${event.clientY}px` } });
}, { passive: true });
