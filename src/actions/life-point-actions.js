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

function adjustLpQuick(delta) {
  setState({ lp: Math.max(0, getCurrentLp() + delta) });
}

function halveLpQuick() {
  setState({ lp: Math.ceil(getCurrentLp() / 2) });
}

function resetLp() {
  setState({ lp: STARTING_LP });
}
