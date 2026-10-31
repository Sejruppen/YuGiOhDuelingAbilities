// Tournament screen actions. Results are marked by hand: tap the winner of a
// duel in the bracket (nothing is inferred from Life Points).
// The screen opens on a menu (Continue / New / History). `view` is transient:
// 'menu' | 'play' (setup, draw or bracket, by tournament.phase) | 'history'.
const TOURNAMENT_CONFIRM_MS = 3000;

const tournamentUi = { view: 'menu', confirmNew: false, confirmTimer: null, dealBracket: false, openHistoryId: null };

function goToTournament() {
  resetPeek();
  tournamentUi.view = 'menu';
  setState({ screen: SCREENS.TOURNAMENT });
}

function leaveTournament() {
  cancelTournamentDraw();
  tournamentUi.view = 'menu';
  setState({ screen: SCREENS.START });
}

// --- Menu -----------------------------------------------------------------------

const hasUnfinishedTournament = () => tournament.phase === 'bracket' && !getTournamentChampion();

function showTournamentMenu() {
  cancelTournamentDraw();
  tournamentUi.view = 'menu';
  render();
}

function continueTournament() {
  if (tournament.phase !== 'bracket') return;
  tournamentUi.view = 'play';
  render();
}

// Starts setup, keeping the last picks so a rematch is one tap away. Two taps
// when it would throw away an unfinished bracket.
function newTournamentClick() {
  if (hasUnfinishedTournament() && !tournamentUi.confirmNew) {
    tournamentUi.confirmNew = true;
    clearTimeout(tournamentUi.confirmTimer);
    tournamentUi.confirmTimer = setTimeout(() => {
      tournamentUi.confirmNew = false;
      if (state.screen === SCREENS.TOURNAMENT) render();
    }, TOURNAMENT_CONFIRM_MS);
    render();
    return;
  }
  clearTimeout(tournamentUi.confirmTimer);
  tournamentUi.confirmNew = false;
  tournamentUi.view = 'play';
  cancelTournamentDraw();
  setTournament({ ...newTournament(), size: tournament.size, picks: tournament.picks });
}

// --- History --------------------------------------------------------------------

function openTournamentHistory() {
  tournamentUi.view = 'history';
  tournamentUi.openHistoryId = null;
  render();
}

function toggleTournamentHistoryEntry(id) {
  tournamentUi.openHistoryId = tournamentUi.openHistoryId === id ? null : id;
  render();
}

// Settings: first tap arms the button, a second tap within a few seconds
// wipes the history (Hall of Fame included).
let tournamentHistoryResetTimer = null;

function renderTournamentHistoryResetButton() {
  const n = tournamentHistory.length;
  if (!n) return '<p class="w-full max-w-xs mt-2 text-xs text-slate-500">No finished tournaments yet.</p>';
  const armed = !!tournamentHistoryResetTimer;
  return `
    <p class="w-full max-w-xs mt-2 text-xs text-slate-400"><span class="ce-emoji">📜</span> ${n} tournament${n === 1 ? '' : 's'} in the history</p>
    <button type="button" onclick="resetTournamentHistory()" class="w-full max-w-xs mt-2 py-2 px-4 rounded-xl text-xs font-bold transition border ${armed
      ? 'bg-rose-600 border-rose-500 text-white'
      : 'bg-slate-900/80 border-slate-800 text-rose-400 hover:bg-slate-800'}">
      ${armed ? 'Tap again to reset tournament history' : '<span class="ce-emoji">🗑️</span> Reset tournament history'}
    </button>
  `;
}

function resetTournamentHistory() {
  if (!tournamentHistoryResetTimer) {
    tournamentHistoryResetTimer = setTimeout(() => {
      tournamentHistoryResetTimer = null;
      render();
    }, TOURNAMENT_CONFIRM_MS);
    render();
    return;
  }
  clearTimeout(tournamentHistoryResetTimer);
  tournamentHistoryResetTimer = null;
  clearTournamentHistory();
  render();
  showEggPill('<span class="ce-emoji">📜</span> Tournament history reset');
  playSound({ name: 'theme-locked' });
}

// --- Setup ----------------------------------------------------------------------

function changeTournamentSize(delta) {
  const size = clampTournamentSize(tournament.size + delta);
  if (size === tournament.size) {
    restartClass(document.querySelector('.tn-size-value'), 'tn-nope', 400);
    countTournamentLimitTap(delta);
    return;
  }
  setTournament({ size });
}

function toggleTournamentPick(id) {
  let picks = [...tournament.picks];
  if (picks.includes(id)) {
    picks = picks.filter(pick => pick !== id);
  } else {
    // Another deck of the same duelist is swapped out (no duplicates).
    const key = getDuelistKeyById(id);
    const sibling = picks.find(pick => getDuelistKeyById(pick) === key);
    if (sibling) picks[picks.indexOf(sibling)] = id;
    else picks.push(id);
  }
  // Choosing more duelists than there are spots makes room for them.
  const size = clampTournamentSize(Math.max(tournament.size, picks.length), picks);
  setTournament({ picks, size });
}

function clearTournamentPicks() {
  setTournament({ picks: [], size: clampTournamentSize(tournament.size, []) });
}

// Fills the empty spots with random duelists (one deck each), seeds everyone
// at random and plays the draw animation if anyone was drawn.
function drawTournament() {
  const size = clampTournamentSize(tournament.size);
  const missing = size - tournament.picks.length;
  const randomIds = shuffled(getRandomDuelists())
    .slice(0, missing)
    .map(duelist => duelist.ids[Math.floor(Math.random() * duelist.ids.length)]);
  const entrants = shuffled([...tournament.picks, ...randomIds]);

  tournament = {
    ...tournament,
    id: String(Date.now()),
    size,
    phase: 'bracket',
    entrants,
    randomIds,
    slots: buildSlots(entrants),
    results: {}
  };
  saveTournament();

  if (randomIds.length) startTournamentDraw();
  else playSound({ name: 'tn-start' });
  render();
}

// --- Bracket --------------------------------------------------------------------

function markTournamentWinner(round, index, side) {
  const rounds = getTournamentRounds();
  const match = rounds[round]?.[index];
  if (!match?.ready) return;

  tournament = { ...tournament, results: { ...tournament.results, [`${round}:${index}`]: side } };
  saveTournament();
  syncTournamentHistory();
  const champion = getTournamentChampion();
  render();

  const row = document.querySelector(`[data-tn-match="${round}:${index}"] [data-tn-side="${side}"]`);
  if (champion) {
    celebrateTournamentChampion(champion);
  } else {
    playSound({ name: 'tn-win' });
    if (row) spawnParticles(row, { type: 'quest', mode: 'spark', count: 14 });
  }
}

function undoTournamentResult(round, index) {
  const rounds = getTournamentRounds();
  const match = rounds[round]?.[index];
  if (!match || !canChangeResult(rounds, match)) return;
  const results = { ...tournament.results };
  delete results[`${round}:${index}`];
  playSound({ name: 'tn-undo' });
  tournament = { ...tournament, results };
  saveTournament();
  syncTournamentHistory();
  render();
}
