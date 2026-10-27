// App entry point: picks the view for the current screen and boots the PWA.
function renderCurrentView(app) {
  if (state.screen === SCREENS.START) {
    app.innerHTML = renderStartView();
    return;
  }

  if (state.screen === SCREENS.SETTINGS) {
    app.innerHTML = renderSettingsView();
    return;
  }

  if (state.screen === SCREENS.DISK) {
    app.innerHTML = renderDuelDiskView();
    return;
  }

  if (state.screen === SCREENS.CHARACTER) {
    app.innerHTML = renderCharacterView();
    return;
  }

  if (state.screen === SCREENS.TOURNAMENT) {
    app.innerHTML = renderTournamentView();
    return;
  }

  if (state.screen === SCREENS.COOP) {
    app.innerHTML = renderCoopView();
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

// Every render replaces #app's markup, which would snap all scrollable areas
// back to the top. Scrollable elements are matched by document order so their
// positions survive re-renders within the same screen.
function getScrollableElements(app) {
  return Array.from(app.querySelectorAll('*')).filter(el => {
    const style = getComputedStyle(el);
    return /(auto|scroll)/.test(`${style.overflowY} ${style.overflowX}`);
  });
}

function captureScroll(app) {
  return {
    screen: state.screen,
    window: { x: window.scrollX, y: window.scrollY },
    elements: getScrollableElements(app).map(el => ({ top: el.scrollTop, left: el.scrollLeft })),
  };
}

function restoreScroll(app, saved) {
  if (saved.screen !== state.screen) return;
  getScrollableElements(app).forEach((el, i) => {
    const pos = saved.elements[i];
    if (!pos) return;
    el.scrollTop = pos.top;
    el.scrollLeft = pos.left;
  });
  if (window.scrollX !== saved.window.x || window.scrollY !== saved.window.y) {
    window.scrollTo(saved.window.x, saved.window.y);
  }
}

function render() {
  const app = document.getElementById('app');

  const savedScroll = captureScroll(app);
  const beforeFx = beforeRenderEffects(app);

  renderCurrentView(app);
  restoreScroll(app, savedScroll);

  afterRenderEffects(app, beforeFx);
}

registerServiceWorker();
render();
