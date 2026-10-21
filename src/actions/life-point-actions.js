function toggleLpSide(event) {
  if (event) event.stopPropagation();
  setState({ lpSide: isLpOnLeft() ? LP_SIDES.RIGHT : LP_SIDES.LEFT });
}

function openLpEditor() {
  setUi({ lpModalOpen: true });
}

function closeLpEditor() {
  setUi({ lpModalOpen: false });
}

function setLp(lp) {
  const isLastStand = lp === LAST_STAND_LP && getCurrentLp() > LAST_STAND_LP;
  setState({ lp, ...(isLastStand ? { lastStand: true } : {}) });
}

function adjustLpQuick(delta) {
  setLp(Math.max(0, getCurrentLp() + delta));
}

function halveLpQuick() {
  setLp(Math.ceil(getCurrentLp() / 2));
}

function resetLp() {
  resetHeartOverload();
  setState({ lp: STARTING_LP, lastStand: false });
}
