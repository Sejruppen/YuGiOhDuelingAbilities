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

const LP_LOG_MAX = 50;

// Every LP change is logged (newest first) with the LP it left you on.
function setLp(lp, { reset = false } = {}) {
  const delta = lp - getCurrentLp();
  if (!delta) return;
  const lpLog = [{ delta, lp, ...(reset ? { reset } : {}) }, ...(state.lpLog || [])].slice(0, LP_LOG_MAX);
  setState({ lp, lpLog });
}

function adjustLpQuick(delta) {
  setLp(Math.max(0, getCurrentLp() + delta));
}

// Puts an amount in the display. Round hundreds use the normal "digits + 00"
// form so they can still be edited; anything else is shown exactly.
function setLpInputAmount(amount) {
  if (!amount) return setUi({ lpInput: '', lpInputExact: false });
  const asDigits = String(amount / 100);
  if (amount % 100 === 0 && asDigits.length <= LP_MAX_INPUT && !LP_SHORT_INPUTS.includes(asDigits)) {
    setUi({ lpInput: asDigits, lpInputExact: false });
  } else {
    setUi({ lpInput: String(amount), lpInputExact: true });
  }
}

// Fills in the damage that halves your LP (rounding the LP left up), ready for − Damage.
function halveLpQuick() {
  setLpInputAmount(Math.floor(getCurrentLp() / 2));
}

function useLpLogEntry(index) {
  const entry = (state.lpLog || [])[index];
  if (entry) setLpInputAmount(Math.abs(entry.delta));
}

function resetLp() {
  resetHeartOverload();
  setLp(STARTING_LP, { reset: true });
}
