const initialDuelProgress = {
  skillRevealed: false,
  comebackRevealed: false,
  skillUses: 0,
  comebackUses: 0,
  questCompleted: false
};

const defaultState = {
  screen: SCREENS.START,
  characterId: null,
  selectedSkill: null,
  selectedComeback: null,
  selectedQuest: null,
  ...initialDuelProgress,
  lp: STARTING_LP,
  lpSide: LP_SIDES.LEFT
};

function loadState() {
  try {
    return { ...defaultState, ...(JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}) };
  } catch {
    return { ...defaultState };
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// Persistent state across reloads
let state = loadState();

// Transient UI state (resets if the browser reloads)
const ui = {
  peek: { skill: false, comeback: false, quest: false },
  lpModalOpen: false,
  resetModalOpen: false
};

function setState(patch) {
  state = { ...state, ...patch };
  saveState();
  render();
}

function setUi(patch) {
  Object.assign(ui, patch);
  render();
}

function resetPeek() {
  ui.peek = { skill: false, comeback: false, quest: false };
}

function getSelectedCharacter() {
  return CHARACTERS.find(c => c.id === state.characterId);
}

function getCurrentLp() {
  return state.lp ?? STARTING_LP;
}

function isLpOnLeft() {
  return state.lpSide !== LP_SIDES.RIGHT;
}
