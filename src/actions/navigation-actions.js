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

function editLoadout() {
  setState({ screen: SCREENS.ABILITIES });
}

function startDuel() {
  resetHeartOverload();
  setState({
    screen: SCREENS.DUEL,
    lp: STARTING_LP,
    lastStand: false
  });
}

function resetApp() {
  const currentSide = state.lpSide || LP_SIDES.LEFT;
  resetPeek();
  ui.lpModalOpen = false;
  ui.resetModalOpen = false;
  setState({ ...defaultState, lpSide: currentSide });
}
