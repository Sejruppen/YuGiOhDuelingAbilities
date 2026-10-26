// Visual themes for the whole app. Loaded in <head> so the saved theme is
// applied before the first paint. Stored separately from the duel state so
// resetting/ending a duel keeps the chosen theme.
const THEME_STORAGE_KEY = 'ygo_theme';
// Set by src/effects/egg-tracker.js once every easter egg has been found.
const TREASURE_UNLOCK_KEY = 'ygo_theme_treasure_unlocked';

const APP_THEMES = [
  { id: 'dark', label: 'Dark', metaColor: '#090d16' },
  { id: 'light', label: 'Light', metaColor: '#f1f5f9' },
  { id: 'poc', label: 'Power of Chaos', metaColor: '#c99a52' },
  { id: 'gold', label: 'Treasure', metaColor: '#0d0a08', secret: true }
];

function isTreasureThemeUnlocked() {
  try {
    return localStorage.getItem(TREASURE_UNLOCK_KEY) === '1';
  } catch {
    return false;
  }
}

const isThemeAvailable = theme => !theme.secret || isTreasureThemeUnlocked();

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
