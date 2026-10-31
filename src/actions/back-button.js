// Android back button / back gesture. The app has no URLs, so one extra
// history entry (the "trap") sits on top of the page. Back pops it, and the
// popstate handler takes one step back inside the app: close the open popup
// first, otherwise leave the screen like its "← Back" button. Then the trap is
// put back. On the start screen the first back shows "Press back again to
// exit" and leaves the trap off, so a second back closes the app.
// Chrome may skip history entries added without a tap, so the trap is also
// (re)armed on the next pointerdown.
const BACK_EXIT_MS = 2000;

const isBackTrap = s => !!(s && s.ygoBackTrap);

function armBackTrap() {
  if (isBackTrap(history.state)) return;
  history.pushState({ ygoBackTrap: true }, '');
}

function initBackButton() {
  // After a reload the page sits on the old trap entry: make it the base.
  if (isBackTrap(history.state)) history.replaceState(null, '');
  document.addEventListener('pointerdown', armBackTrap, true);
  window.addEventListener('popstate', event => {
    if (isBackTrap(event.state)) return;
    if (handleAppBack()) armBackTrap();
    else showBackExitToast();
  });
}

// One step back. Returns false on the start screen (nothing left to close).
function handleAppBack() {
  if (finale.overlay) {
    if (finale.skipped) closePharaohFinale();
    else skipPharaohFinale();
    return true;
  }

  switch (state.screen) {
    case SCREENS.CHARACTER:
      resetApp();
      return true;
    case SCREENS.ABILITIES:
      if (ui.abilitySearch) {
        const input = document.getElementById(ABILITY_SEARCH_INPUT_ID);
        if (input) input.value = '';
        setAbilitySearch('');
      } else {
        goToCharacters();
      }
      return true;
    case SCREENS.DUEL:
      if (ui.lpModalOpen) closeLpEditor();
      else if (ui.resetModalOpen) closeResetConfirm();
      else if (anyPeekOpen()) { resetPeek(); render(); }
      // Never leave a duel by accident: ask to reset instead.
      else openResetConfirm();
      return true;
    case SCREENS.TOURNAMENT:
      if (tournamentUi.view !== 'menu') showTournamentMenu();
      else leaveTournament();
      return true;
    case SCREENS.COOP:
      backInCoop();
      return true;
    case SCREENS.SETTINGS:
      leaveSettings();
      return true;
    case SCREENS.DISK:
      if (disk?.showGrave) closeDiskGrave();
      else if (disk && disk.selected !== null && !disk.busy) { disk.selected = null; paintDisk(); }
      else closeDuelDisk();
      return true;
    default:
      return false;
  }
}

const anyPeekOpen = () => Object.values(ui.peek).some(Boolean);

// Mid-battle there is no screen to leave: back closes cutscenes and panels,
// then toggles the "Give up?" button (giving up still needs a tap).
function backInCoop() {
  if (coop.phase !== 'battle') return leaveCoop();
  if (coop.cutscene) return dismissCoopCutscene();

  if (coopUi.panel.some(Boolean)) {
    coopUi.panel = coopUi.panel.map(stepBackCoopPanel);
    coopUi.input = ['', ''];
    return render();
  }

  if (coop.steps && coopStep()?.sub === 'block') return cancelCoopBlock();

  if (coopUi.confirmQuit) {
    clearTimeout(coopUi.timers.quit);
    coopUi.confirmQuit = false;
    return render();
  }
  quitCoopClick();
}

// A panel with a chosen target or effect goes back to its menu, otherwise it closes.
function stepBackCoopPanel(panel) {
  if (!panel) return null;
  if (panel.target) return { ...panel, target: null };
  if (panel.kind) return { ...panel, kind: null };
  return null;
}

function showBackExitToast() {
  document.getElementById('back-toast')?.remove();
  const toast = document.createElement('div');
  toast.id = 'back-toast';
  toast.className = 'back-toast';
  toast.setAttribute('role', 'status');
  toast.textContent = 'Press back again to exit';
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), BACK_EXIT_MS);
}
