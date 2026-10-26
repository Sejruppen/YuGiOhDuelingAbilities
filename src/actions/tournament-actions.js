// Tournament screen actions. Results are marked by hand: tap the winner of a
// duel in the bracket (nothing is inferred from Life Points).
const TOURNAMENT_CONFIRM_MS = 3000;

const tournamentUi = { confirmNew: false, confirmTimer: null, dealBracket: false };

function goToTournament() {
  resetPeek();
  setState({ screen: SCREENS.TOURNAMENT });
}

function leaveTournament() {
  cancelTournamentDraw();
  setState({ screen: SCREENS.START });
}

// --- Setup ----------------------------------------------------------------------

function changeTournamentSize(delta) {
  const size = clampTournamentSize(tournament.size + delta);
  if (size === tournament.size) {
    restartClass(document.querySelector('.tn-size-value'), 'tn-nope', 400);
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
  setTournament({ results });
}

// Two taps: "New tournament" -> "Tap again to confirm".
function newTournamentClick() {
  if (!tournamentUi.confirmNew) {
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
  cancelTournamentDraw();
  // Keep the last setup, so a rematch tournament is one tap away.
  setTournament({ ...newTournament(), size: tournament.size, picks: tournament.picks });
}
