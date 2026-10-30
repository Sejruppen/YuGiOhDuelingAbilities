function toggleLpSide(event) {
  if (event) event.stopPropagation();
  setState({ lpSide: isLpOnLeft() ? LP_SIDES.RIGHT : LP_SIDES.LEFT });
}

// Like the Neuron app, typed digits get two implied 0s ("14" means 1400), except
// "50" which is common on its own. lpInputExact marks a value used as-is (Halve).
const LP_MAX_INPUT = 4;
const LP_SHORT_INPUTS = ['50'];

function openLpEditor() {
  setUi({ lpModalOpen: true, lpInput: '', lpInputExact: false });
}

function closeLpEditor() {
  setUi({ lpModalOpen: false, lpInput: '', lpInputExact: false });
}

function hasLpInputSuffix() {
  return !!ui.lpInput && !ui.lpInputExact && !LP_SHORT_INPUTS.includes(ui.lpInput);
}

function getLpInputAmount() {
  const value = parseInt(ui.lpInput, 10) || 0;
  return hasLpInputSuffix() ? value * 100 : value;
}

function lpKey(key) {
  // An exact (Halve) value is replaced rather than edited.
  const current = ui.lpInputExact ? '' : ui.lpInput;
  const value = key === 'back'
    ? current.slice(0, -1)
    : (current + key).replace(/^0+/, '').slice(0, LP_MAX_INPUT);
  setUi({ lpInput: value, lpInputExact: false });
}

// Closes first (like the co-op panel) so the LP change plays on the LP bar.
function confirmLpInput(sign) {
  const amount = getLpInputAmount();
  if (!amount) return;
  Object.assign(ui, { lpModalOpen: false, lpInput: '', lpInputExact: false });
  adjustLpQuick(sign * amount);
}

function setLp(lp) {
  setState({ lp });
}

function adjustLpQuick(delta) {
  setLp(Math.max(0, getCurrentLp() + delta));
}

// Fills in the damage that halves your LP (rounding the LP left up), ready for − Damage.
// Round hundreds use the normal "digits + 00" form so they can still be edited.
function halveLpQuick() {
  const half = Math.floor(getCurrentLp() / 2);
  if (!half) return setUi({ lpInput: '', lpInputExact: false });
  const asDigits = String(half / 100);
  if (half % 100 === 0 && !LP_SHORT_INPUTS.includes(asDigits)) {
    setUi({ lpInput: asDigits, lpInputExact: false });
  } else {
    setUi({ lpInput: String(half), lpInputExact: true });
  }
}

function resetLp() {
  resetHeartOverload();
  setState({ lp: STARTING_LP });
}
