function toggleLpSide(event) {
  if (event) event.stopPropagation();
  setState({ lpSide: isLpOnLeft() ? LP_SIDES.RIGHT : LP_SIDES.LEFT });
}

const LP_MAX_INPUT = 6;

function openLpEditor() {
  setUi({ lpModalOpen: true, lpInput: '' });
}

function closeLpEditor() {
  setUi({ lpModalOpen: false, lpInput: '' });
}

function lpKey(key) {
  const value = key === 'back'
    ? ui.lpInput.slice(0, -1)
    : (ui.lpInput + key).replace(/^0+/, '').slice(0, LP_MAX_INPUT);
  setUi({ lpInput: value });
}

// Closes first (like the co-op panel) so the LP change plays on the LP bar.
function confirmLpInput(sign) {
  const amount = parseInt(ui.lpInput, 10) || 0;
  if (!amount) return;
  Object.assign(ui, { lpModalOpen: false, lpInput: '' });
  adjustLpQuick(sign * amount);
}

function setLp(lp) {
  setState({ lp });
}

function adjustLpQuick(delta) {
  setLp(Math.max(0, getCurrentLp() + delta));
}

// Fills in the damage that halves your LP (rounding the LP left up), ready for − Damage.
function halveLpQuick() {
  const half = Math.floor(getCurrentLp() / 2);
  setUi({ lpInput: half ? String(half) : '' });
}

function resetLp() {
  resetHeartOverload();
  setState({ lp: STARTING_LP });
}
