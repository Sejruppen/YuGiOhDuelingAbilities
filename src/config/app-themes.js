// Visual themes for the whole app. Loaded in <head> so the saved theme is
// applied before the first paint. Stored separately from the duel state so
// resetting/ending a duel keeps the chosen theme.
const THEME_STORAGE_KEY = 'ygo_theme';
// Set by src/effects/egg-tracker.js once every easter egg has been found.
const TREASURE_UNLOCK_KEY = 'ygo_theme_treasure_unlocked';
// Solo-mode wins per difficulty ({ easy, hard, nightmare }), written by src/state/solo-store.js.
const SOLO_CLEARS_KEY = 'ygo_solo_clears';

// Seasonal themes are only available (and shown) during their month (0 = January).
// `unlock: '<difficulty>'` themes are earned by beating Pegasus `unlockClears` times on that difficulty in Solo
// (the Millennium Eye on the Solo shelf, SOLO_SHELF).
const APP_THEMES = [
  { id: 'dark', label: 'Dark', metaColor: '#090d16' },
  { id: 'light', label: 'Light', metaColor: '#f1f5f9' },
  { id: 'poc', label: 'Power of Chaos', metaColor: '#c99a52' },
  { id: 'gold', label: 'Treasure', metaColor: '#0d0a08', secret: true },
  { id: 'millennium', label: 'Millennium', metaColor: '#0a1030', unlock: 'nightmare', unlockClears: 3 },
  { id: 'halloween', label: 'Halloween', metaColor: '#120a1a', season: { month: 9, emoji: '🎃', monthName: 'October' } },
  { id: 'xmas', label: 'Christmas', metaColor: '#081410', season: { month: 11, emoji: '🎄', monthName: 'December' } }
];

const isSeasonActive = theme => !!theme.season && new Date().getMonth() === theme.season.month;
const getActiveSeasonTheme = () => APP_THEMES.find(isSeasonActive) || null;

function isTreasureThemeUnlocked() {
  try {
    return localStorage.getItem(TREASURE_UNLOCK_KEY) === '1';
  } catch {
    return false;
  }
}

function readSoloClears(difficulty) {
  try {
    return Number(JSON.parse(localStorage.getItem(SOLO_CLEARS_KEY))?.[difficulty]) || 0;
  } catch {
    return 0;
  }
}

const isThemeAvailable = theme =>
  (!theme.secret || isTreasureThemeUnlocked()) &&
  (!theme.season || isSeasonActive(theme)) &&
  (!theme.unlock || readSoloClears(theme.unlock) >= (theme.unlockClears || 1));

function getAppTheme() {
  let savedId = null;
  try {
    savedId = localStorage.getItem(THEME_STORAGE_KEY);
  } catch {}
  const theme = APP_THEMES.find(t => t.id === savedId);
  return theme && isThemeAvailable(theme) ? theme : APP_THEMES[0];
}

function applyAppTheme(theme) {
  document.documentElement.dataset.theme = theme.id;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', theme.metaColor);
  if (typeof syncSeasonFx === 'function') syncSeasonFx();
}

function setAppTheme(id) {
  const theme = APP_THEMES.find(t => t.id === id);
  if (!theme || !isThemeAvailable(theme)) return;
  const changed = theme.id !== document.documentElement.dataset.theme;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme.id);
  } catch {}

  const apply = () => {
    applyAppTheme(theme);
    render();
    if (typeof playSound === 'function') playSound({ name: 'theme' });
    if (changed && typeof countThemeSwitch === 'function') countThemeSwitch();
  };

  // Each theme defines its own entrance via ::view-transition-new(root) in styles.css.
  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (document.startViewTransition && !reduceMotion) {
    document.startViewTransition(apply);
  } else {
    apply();
  }
}

applyAppTheme(getAppTheme());
