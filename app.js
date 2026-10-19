// App entry point: picks the view for the current screen and boots the PWA.
function renderCurrentView(app) {
  if (state.screen === SCREENS.START) {
    app.innerHTML = renderStartView();
    return;
  }

  if (state.screen === SCREENS.CHARACTER) {
    app.innerHTML = renderCharacterView();
    return;
  }

  const char = getSelectedCharacter();
  if (!char) {
    resetApp();
    return;
  }

  if (state.screen === SCREENS.ABILITIES) {
    app.innerHTML = renderAbilitiesView(char);
    return;
  }

  if (state.screen === SCREENS.DUEL) {
    app.innerHTML = renderDuelView(char);
  }
}

function render() {
  const app = document.getElementById('app');

  // Keep the abilities list scroll position when re-rendering after a selection.
  const scrollTop = document.getElementById(ABILITIES_SCROLL_CONTAINER_ID)?.scrollTop ?? 0;

  renderCurrentView(app);

  const scrollContainer = document.getElementById(ABILITIES_SCROLL_CONTAINER_ID);
  if (scrollContainer) {
    scrollContainer.scrollTop = scrollTop;
  }
}

registerServiceWorker();
render();
