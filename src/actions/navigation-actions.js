function goToCharacters() {
  resetPeek();
  setState({
    screen: SCREENS.CHARACTER,
    characterId: null,
    selectedSkill: null,
    selectedComeback: null,
    selectedQuest: null,
    ...initialDuelProgress
  });
}

function selectCharacter(id) {
  resetPeek();
  ui.abilitySearch = '';
  setState({
    screen: SCREENS.ABILITIES,
    characterId: id,
    selectedSkill: 0,
    selectedComeback: 0,
    selectedQuest: 0,
    ...initialDuelProgress
  });
}

function pickAbility(type, index) {
  const abilityType = ABILITY_TYPES[type];
  if (!abilityType) return;
  setState({ [abilityType.selectionKey]: index });
}

// Custom's ability search: filters the lists in place (no re-render).
function setAbilitySearch(value) {
  ui.abilitySearch = value;
  applyAbilitySearch();
  const list = document.getElementById(ABILITIES_SCROLL_CONTAINER_ID);
  if (list) list.scrollTop = 0;
}

function clearAbilitySearch() {
  const input = document.getElementById(ABILITY_SEARCH_INPUT_ID);
  if (input) {
    input.value = '';
    input.focus();
  }
  setAbilitySearch('');
}

function startDuel() {
  resetHeartOverload();
  setState({
    screen: SCREENS.DUEL,
    lp: STARTING_LP,
    lpLog: []
  });
}

function resetApp() {
  const currentSide = state.lpSide || LP_SIDES.LEFT;
  resetPeek();
  ui.lpModalOpen = false;
  ui.resetModalOpen = false;
  setState({ ...defaultState, lpSide: currentSide });
}
