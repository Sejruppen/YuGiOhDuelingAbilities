// Tournament (single elimination). Stored apart from the duel state, so
// resetting or ending a duel never touches the bracket.
//
// Shape:
//   phase     'setup' | 'bracket'
//   size      number of participants (setup)
//   picks     character ids chosen by hand (setup)
//   entrants  every participant, in seed order (bracket)
//   randomIds the entrants that were drawn at random (for the draw animation)
//   slots     round-1 positions (length = next power of 2), null = bye
//   results   { 'round:match': 'a' | 'b' } winners of played duels
//   id        set when the bracket is drawn, links it to its history entry
const TOURNAMENT_STORAGE_KEY = 'ygo_tournament';
const TOURNAMENT_MIN_SIZE = 2;
const TOURNAMENT_DEFAULT_SIZE = 8;
// Only ever in a tournament when picked by hand.
const TOURNAMENT_PICK_ONLY_IDS = [NEUTRAL_CHARACTER_ID, CUSTOM_CHARACTER_ID, 'theotaur', 'trizze'];

const newTournament = () => ({ id: null, phase: 'setup', size: TOURNAMENT_DEFAULT_SIZE, picks: [], entrants: [], randomIds: [], slots: [], results: {} });

function loadTournament() {
  try {
    const saved = JSON.parse(localStorage.getItem(TOURNAMENT_STORAGE_KEY));
    return saved && typeof saved === 'object' ? { ...newTournament(), ...saved } : newTournament();
  } catch {
    return newTournament();
  }
}

let tournament = loadTournament();

function saveTournament() {
  try {
    localStorage.setItem(TOURNAMENT_STORAGE_KEY, JSON.stringify(tournament));
  } catch {}
}

function setTournament(patch) {
  tournament = { ...tournament, ...patch };
  saveTournament();
  render();
}

// --- Characters ---------------------------------------------------------------

const getTournamentChar = id => CHARACTERS.find(c => c.id === id);

// "Yugi Muto (Duelist Kingdom)" and "Yugi Muto (Battle City)" are the same
// duelist; both Mariks share a name. Only one deck per duelist may enter.
const getDuelistKey = char => char.name.replace(/\s*\(.*\)\s*$/, '').trim().toLowerCase();

function getDuelistKeyById(id) {
  const char = getTournamentChar(id);
  return char ? getDuelistKey(char) : id;
}

// Duelists that can still be drawn at random, as { key, ids: [deck ids] }.
function getRandomDuelists(picks = tournament.picks) {
  const taken = new Set(picks.map(getDuelistKeyById));
  const byKey = new Map();
  for (const char of CHARACTERS) {
    if (TOURNAMENT_PICK_ONLY_IDS.includes(char.id)) continue;
    const key = getDuelistKey(char);
    if (taken.has(key)) continue;
    if (!byKey.has(key)) byKey.set(key, { key, ids: [] });
    byKey.get(key).ids.push(char.id);
  }
  return [...byKey.values()];
}

const getTournamentMaxSize = (picks = tournament.picks) => picks.length + getRandomDuelists(picks).length;
const getTournamentMinSize = (picks = tournament.picks) => Math.max(TOURNAMENT_MIN_SIZE, picks.length);

function clampTournamentSize(size, picks = tournament.picks) {
  return Math.min(getTournamentMaxSize(picks), Math.max(getTournamentMinSize(picks), size));
}

function shuffled(list) {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// --- Bracket ------------------------------------------------------------------

const nextPowerOfTwo = n => 2 ** Math.ceil(Math.log2(Math.max(2, n)));

// Classic seeding order (1 v 8, 4 v 5, 2 v 7, 3 v 6 ...). Seeds past the
// number of entrants are byes, so a bye always meets a real duelist.
function seedOrder(size) {
  let order = [1, 2];
  while (order.length < size) {
    const sum = order.length * 2 + 1;
    order = order.flatMap(seed => [seed, sum - seed]);
  }
  return order;
}

function buildSlots(entrants) {
  return seedOrder(nextPowerOfTwo(entrants.length)).map(seed => entrants[seed - 1] ?? null);
}

// Every round with its matches: { round, index, a, b, winnerId, bye, ready }.
function getTournamentRounds(t = tournament) {
  const rounds = [];
  const firstRound = [];
  for (let i = 0; i < t.slots.length; i += 2) {
    firstRound.push({ a: t.slots[i], b: t.slots[i + 1] });
  }
  rounds.push(firstRound);
  while (rounds[rounds.length - 1].length > 1) {
    const prev = rounds[rounds.length - 1];
    rounds.push(Array.from({ length: prev.length / 2 }, () => ({})));
  }

  rounds.forEach((matches, round) => {
    matches.forEach((match, index) => {
      if (round > 0) {
        match.a = rounds[round - 1][index * 2].winnerId;
        match.b = rounds[round - 1][index * 2 + 1].winnerId;
      }
      match.round = round;
      match.index = index;
      match.bye = round === 0 && (!match.a || !match.b);
      const side = t.results[`${round}:${index}`];
      if (match.bye) match.winnerId = match.a || match.b || null;
      else match.winnerId = match.a && match.b && side ? match[side] : null;
      match.ready = !!(match.a && match.b && !match.winnerId);
    });
  });
  return rounds;
}

function getTournamentChampion(rounds = getTournamentRounds()) {
  return rounds[rounds.length - 1][0].winnerId || null;
}

// A result can be changed until the winner has played their next duel.
function canChangeResult(rounds, match) {
  if (!match.winnerId || match.bye) return false;
  const next = rounds[match.round + 1]?.[Math.floor(match.index / 2)];
  return !next || !next.winnerId;
}

// --- History ------------------------------------------------------------------
// Finished tournaments, newest first: { id, finishedAt, slots, results }.
// The bracket is rebuilt from slots + results with getTournamentRounds().
// An entry is added when the champion is decided and removed again if the
// final's result is changed.
const TOURNAMENT_HISTORY_KEY = 'ygo_tournament_history';
const TOURNAMENT_HISTORY_MAX = 100;

function loadTournamentHistory() {
  try {
    const saved = JSON.parse(localStorage.getItem(TOURNAMENT_HISTORY_KEY));
    return Array.isArray(saved) ? saved.filter(e => e && Array.isArray(e.slots) && e.results) : [];
  } catch {
    return [];
  }
}

let tournamentHistory = loadTournamentHistory();

function saveTournamentHistory() {
  try {
    localStorage.setItem(TOURNAMENT_HISTORY_KEY, JSON.stringify(tournamentHistory));
  } catch {}
}

function syncTournamentHistory() {
  if (tournament.phase !== 'bracket') return;
  if (!tournament.id) {
    tournament = { ...tournament, id: String(Date.now()) };
    saveTournament();
  }
  const others = tournamentHistory.filter(e => e.id !== tournament.id);
  tournamentHistory = getTournamentChampion()
    ? [{ id: tournament.id, finishedAt: Date.now(), slots: tournament.slots, results: tournament.results }, ...others].slice(0, TOURNAMENT_HISTORY_MAX)
    : others;
  saveTournamentHistory();
}

function clearTournamentHistory() {
  tournamentHistory = [];
  saveTournamentHistory();
}

// A tournament finished before history existed (no id yet) is added once.
if (tournament.phase === 'bracket' && !tournament.id && getTournamentChampion()) syncTournamentHistory();

// Titles per duelist (both Yugi decks count for Yugi), most first:
// [{ key, name, titles, runnerUps }].
function getTournamentLeaderboard() {
  const byKey = new Map();
  const bump = (id, field) => {
    const char = getTournamentChar(id);
    if (!char) return;
    const key = getDuelistKey(char);
    if (!byKey.has(key)) byKey.set(key, { key, name: char.name.replace(/\s*\(.*\)\s*$/, '').trim(), titles: 0, runnerUps: 0 });
    byKey.get(key)[field]++;
  };
  for (const entry of tournamentHistory) {
    const final = getTournamentRounds(entry).at(-1)[0];
    if (!final.winnerId) continue;
    bump(final.winnerId, 'titles');
    const runnerUp = final.winnerId === final.a ? final.b : final.a;
    if (runnerUp) bump(runnerUp, 'runnerUps');
  }
  return [...byKey.values()].sort((x, y) => y.titles - x.titles || y.runnerUps - x.runnerUps || x.name.localeCompare(y.name));
}

function getRoundName(round, totalRounds) {
  const fromEnd = totalRounds - round;
  if (fromEnd === 1) return 'Final';
  if (fromEnd === 2) return 'Semifinals';
  if (fromEnd === 3) return 'Quarterfinals';
  return `Round of ${2 ** fromEnd}`;
}
