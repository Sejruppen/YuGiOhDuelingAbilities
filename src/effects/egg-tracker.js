// Easter-egg tracker. Every egg calls markEggFound('<id>') when it fires; the
// ids found so far live in localStorage. Finding a new one pops a small
// "Secret found! N/40" pill, and the start screen shows a counter (Size
// picker area). Finding the LAST one schedules the grand finale, "The
// Ceremonial Battle" (pharaoh-finale.js), which waits until the screen is
// calm (no egg still playing, not in the Duel Disk game) before it starts.
// Once complete, the counter becomes a "Replay the Ceremony" button.
const EGG_STORAGE_KEY = 'ygo_eggs_found';
const EGG_FINALE_SEEN_KEY = 'ygo_eggs_finale_seen';
const EGG_FOUND_PILL_MS = 3200;
const EGG_FINALE_POLL_MS = 500;
const EGG_FINALE_CALM_TICKS = 3;

const CHARACTER_EGG_IDS = [
  'neutral', 'custom', 'yugi-dk', 'yugi-bc', 'kaiba-dk', 'kaiba-bc', 'joey-dk', 'joey-bc', 'mai', 'mako',
  'bakura', 'pegasus', 'odion', 'ishizu', 'marik-1', 'marik-2', 'weevil', 'keith'
];

const EGG_IDS = [
  // Start screen
  'exodia', 'duel-disk', 'dizzy', 'speaker', 'shrink-ray', 'obelisk-headroom',
  // Abilities screen
  'dark-paladin', 'divine-offering',
  // Duel screen
  'full-heal', 'shadow-realm', 'last-stand', 'tiny-violin', 'screw-the-rules', 'trap-hole',
  'pot-of-greed', 'gaia', 'mind-crush', 'millennium-puzzle', 'pharaoh-nap', 'heart-of-the-cards',
  'time-wizard', 'end-credits',
  // Character select (hold a character for 2s)
  ...CHARACTER_EGG_IDS.map(id => `char-${id}`)
];

const EGG_TOTAL = EGG_IDS.length;

const eggTracker = { found: loadFoundEggs(), finaleTimer: null };

function loadFoundEggs() {
  try {
    const saved = JSON.parse(localStorage.getItem(EGG_STORAGE_KEY) || '[]');
    return new Set(Array.isArray(saved) ? saved.filter(id => EGG_IDS.includes(id)) : []);
  } catch {
    return new Set();
  }
}

function saveFoundEggs() {
  try {
    localStorage.setItem(EGG_STORAGE_KEY, JSON.stringify([...eggTracker.found]));
  } catch {}
}

const getFoundEggCount = () => eggTracker.found.size;
const allEggsFound = () => getFoundEggCount() >= EGG_TOTAL;

function hasSeenFinale() {
  try {
    return localStorage.getItem(EGG_FINALE_SEEN_KEY) === '1';
  } catch {
    return false;
  }
}

function markFinaleSeen() {
  try {
    localStorage.setItem(EGG_FINALE_SEEN_KEY, '1');
  } catch {}
}

function markEggFound(id) {
  if (!EGG_IDS.includes(id) || eggTracker.found.has(id)) return;
  eggTracker.found.add(id);
  saveFoundEggs();
  if (allEggsFound()) unlockTreasureTheme();
  paintEggCounters();
  showEggFoundPill();
  if (allEggsFound() && !hasSeenFinale()) scheduleFinale();
}

function unlockTreasureTheme() {
  try {
    localStorage.setItem(TREASURE_UNLOCK_KEY, '1');
  } catch {}
}

// --- "Secret found!" pill --------------------------------------------------------

function showEggPill(html, extraClass = '') {
  const pill = document.createElement('div');
  pill.className = `egg-found${extraClass ? ` ${extraClass}` : ''}`;
  pill.setAttribute('role', 'status');
  pill.innerHTML = html;
  getFxLayer().appendChild(pill);
  setTimeout(() => pill.remove(), EGG_FOUND_PILL_MS);
}

function showEggFoundPill() {
  const count = getFoundEggCount();
  const done = count >= EGG_TOTAL;
  showEggPill(done
    ? `<span class="ce-emoji">👑</span> Every secret found! <b>💎 Treasure theme unlocked</b>`
    : `<span class="ce-emoji">🥚</span> Secret found! <b>${count} / ${EGG_TOTAL}</b>`, done ? 'egg-found--done' : '');
  playSound({ name: done ? 'egg-found-all' : 'egg-found' });
}

// The locked theme tile on the start screen.
function teaseTreasureTheme(button) {
  restartClass(button, 'theme-locked-shake', 450);
  playSound({ name: 'theme-locked' });
  if (document.querySelector('#fx-layer .egg-found')) return;
  showEggPill(`<span class="ce-emoji">🔒</span> Find all secrets to unlock <b>${getFoundEggCount()} / ${EGG_TOTAL}</b>`);
}

// --- Start-screen counter --------------------------------------------------------

function renderEggCounter() {
  const count = getFoundEggCount();
  const pct = Math.round((count / EGG_TOTAL) * 100);
  const box = 'egg-counter w-full max-w-xs mt-4 flex flex-col gap-1.5 px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-400 text-center';
  if (allEggsFound()) {
    return `
      <button type="button" onclick="playPharaohFinale()" class="${box} egg-counter--done">
        <span class="egg-counter-label"><span class="ce-emoji">👑</span> <b class="egg-counter-num">${count} / ${EGG_TOTAL}</b> secrets found</span>
        <span class="egg-counter-replay">▶ Replay the Ceremony</span>
      </button>
    `;
  }
  return `
    <div class="${box}" title="Secrets are hidden all over the app...">
      <span class="egg-counter-label"><span class="ce-emoji">🥚</span> <b class="egg-counter-num">${count} / ${EGG_TOTAL}</b> secrets found</span>
      <span class="egg-counter-bar"><span class="egg-counter-fill" style="width: ${pct}%"></span></span>
    </div>
  `;
}

// Repaint in place (re-rendering the whole view mid-egg could disturb it).
function paintEggCounters() {
  const count = getFoundEggCount();
  if (allEggsFound()) {
    const treasure = APP_THEMES.find(t => t.secret);
    document.querySelectorAll('.theme-btn-locked').forEach(el => {
      el.outerHTML = renderThemeButton(treasure).replace('theme-btn-treasure', 'theme-btn-treasure theme-btn-unlocking');
    });
  }
  document.querySelectorAll('.egg-counter').forEach(el => {
    if (allEggsFound() && !el.classList.contains('egg-counter--done')) {
      el.outerHTML = renderEggCounter().trim();
      return;
    }
    const num = el.querySelector('.egg-counter-num');
    if (num) num.textContent = `${count} / ${EGG_TOTAL}`;
    const fill = el.querySelector('.egg-counter-fill');
    if (fill) fill.style.width = `${Math.round((count / EGG_TOTAL) * 100)}%`;
  });
}

// --- Finale scheduling -----------------------------------------------------------

function isScreenCalm() {
  if (document.hidden || state.screen === SCREENS.DISK) return false;
  const busy = [...getFxLayer().children].some(el => !el.classList.contains('egg-found'));
  return !busy && !document.querySelector('.modal-backdrop');
}

function scheduleFinale() {
  clearInterval(eggTracker.finaleTimer);
  let calm = 0;
  eggTracker.finaleTimer = setInterval(() => {
    calm = isScreenCalm() ? calm + 1 : 0;
    if (calm < EGG_FINALE_CALM_TICKS) return;
    clearInterval(eggTracker.finaleTimer);
    eggTracker.finaleTimer = null;
    playPharaohFinale();
  }, EGG_FINALE_POLL_MS);
}

// All found on an earlier visit but the finale never played (e.g. reloaded).
if (allEggsFound()) unlockTreasureTheme();
if (allEggsFound() && !hasSeenFinale()) scheduleFinale();
