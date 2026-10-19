function togglePeek(type) {
  ui.peek[type] = !ui.peek[type];
  render();
}

function activateAbility(type) {
  ui.peek[type] = false;

  if (type === ABILITY_TYPES.quest.type) {
    setState({ questCompleted: true });
    return;
  }

  setState({
    [`${type}Revealed`]: true,
    [`${type}Uses`]: (state[`${type}Uses`] || 0) + 1
  });
}

function toggleQuestCompleted(completed) {
  ui.peek.quest = false;
  setState({ questCompleted: completed });
}

function changeUses(type, delta) {
  const current = state[`${type}Uses`] || 0;
  setState({ [`${type}Uses`]: Math.max(0, current + delta) });
}

function openResetConfirm() {
  setUi({ resetModalOpen: true });
}

function closeResetConfirm() {
  setUi({ resetModalOpen: false });
}

function resetDuel() {
  resetPeek();
  ui.lpModalOpen = false;
  ui.resetModalOpen = false;
  setState({
    lp: STARTING_LP,
    ...initialDuelProgress
  });
}
