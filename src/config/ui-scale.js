// UI scale (text and layout size). Loaded in <head> so the saved scale is
// applied before the first paint. Every Tailwind size is in rem, so scaling
// the root font-size (see styles.css) scales the whole UI.
const UI_SCALE_STORAGE_KEY = 'ygo_ui_scale';

const UI_SCALES = [
  { id: 'small', label: 'Small', value: 0.8 },
  { id: 'normal', label: 'Normal', value: 0.9 },
  { id: 'large', label: 'Large', value: 1 },
  { id: 'xlarge', label: 'X-Large', value: 1.1 }
];

const DEFAULT_UI_SCALE_ID = 'normal';

function getUiScale() {
  let savedId = null;
  try {
    savedId = localStorage.getItem(UI_SCALE_STORAGE_KEY);
  } catch {}
  return UI_SCALES.find(s => s.id === savedId)
    || UI_SCALES.find(s => s.id === DEFAULT_UI_SCALE_ID);
}

function applyUiScale(scale) {
  document.documentElement.style.setProperty('--ui-scale', String(scale.value));
}

function setUiScale(id) {
  const scale = UI_SCALES.find(s => s.id === id);
  if (!scale) return;
  try {
    localStorage.setItem(UI_SCALE_STORAGE_KEY, scale.id);
  } catch {}
  applyUiScale(scale);
  render();
}

applyUiScale(getUiScale());
