// Solo mode engine ("Duelist's Road"). `solo` is saved to localStorage, so a
// run survives a reload. Shape:
//   phase   'intro' | 'map' | 'node' | 'fight' | 'reward' | 'victory' | 'defeat'
//   lp, maxLp, chips
//   map     { nodes: { id: node }, edges: [[fromId, toId]] }
//   at      the node you stand on (null before floor 1); path = visited ids
//   node    the campfire/treasure/event being shown
//   fight   the current duel (see createSoloFight)
//   reward  { name, chips } after a won duel
//   relics  relic ids you own; offer = { source, ids } when you may pick one
//   millennium  the Millennium Item taken this run (max one); puzzleUsed
//   event   the Shadow Game being shown (see solo-events.js); seenEvents
//   mods    Shadow Game effects waiting for the next duel; shortcut = skip a floor
//   video   the Toon Pegasus opens with, seen on his tape (a Shadow Game)
//   runId   ties the run to its entry in soloHistory
const newSolo = () => ({ phase: 'intro' });

function loadSolo() {
  try {
    const saved = JSON.parse(localStorage.getItem(SOLO_STORAGE_KEY));
    if (!saved || !saved.phase) return newSolo();
    if (!saved.relics) saved.relics = [];
    if (!saved.seenEvents) saved.seenEvents = [];
    if (!saved.mods) saved.mods = {};
    if (saved.map && !saved.runId) saved.runId = `${Date.now()}`;
    return saved;
  } catch {
    return newSolo();
  }
}

let solo = loadSolo();

function saveSolo() {
  try {
    localStorage.setItem(SOLO_STORAGE_KEY, JSON.stringify(solo));
  } catch {}
}

// Finished runs, newest first: { id, finishedAt, result ('victory' | 'defeat' |
// 'abandoned'), hero, floor, lp, chips, duels, damage, relics, foe, map, path, at }.
function loadSoloHistory() {
  try {
    const saved = JSON.parse(localStorage.getItem(SOLO_HISTORY_KEY));
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

let soloHistory = loadSoloHistory();

function saveSoloHistory() {
  try {
    localStorage.setItem(SOLO_HISTORY_KEY, JSON.stringify(soloHistory));
  } catch {}
}

const soloHeroName = () => {
  const hero = getSelectedCharacter();
  return hero && hero.id !== 'neutral' ? hero.name : 'Duelist';
};

// Logs the run once, when it ends. Abandoned runs only count once you've set foot on the island.
function soloArchiveRun(result) {
  if (!solo.map || !solo.runId || soloHistory.some(e => e.id === solo.runId)) return;
  if (result === 'abandoned' && !solo.at) return;
  const at = solo.at && solo.map.nodes[solo.at];
  soloHistory = [{
    id: solo.runId,
    finishedAt: Date.now(),
    result,
    hero: soloHeroName(),
    floor: at ? at.floor : 0,
    lp: solo.lp,
    chips: solo.chips,
    duels: solo.stats?.duels ?? 0,
    damage: solo.stats?.damage ?? 0,
    relics: [...(solo.relics || [])],
    foe: result === 'defeat' ? solo.fight?.name || 'a Shadow Game' : null,
    map: solo.map,
    path: [...solo.path],
    at: solo.at
  }, ...soloHistory].slice(0, SOLO_HISTORY_MAX);
  saveSoloHistory();
}

// Undo after a defeat brings the run back, so it leaves the history again.
function soloUnarchiveRun() {
  const before = soloHistory.length;
  soloHistory = soloHistory.filter(e => e.id !== solo.runId);
  if (soloHistory.length !== before) saveSoloHistory();
}

function clearSoloHistory() {
  soloHistory = [];
  saveSoloHistory();
}

// Visual effects need the new DOM, so they run right after the render.
const soloFxQueue = [];
const queueSoloFx = fn => soloFxQueue.push(fn);

function commitSolo() {
  saveSolo();
  render();
  soloFxQueue.splice(0).forEach(fn => {
    try { fn(); } catch {}
  });
}

const isSoloRunActive = () => !['intro', 'victory', 'defeat'].includes(solo.phase);

// --- Small helpers ----------------------------------------------------------------

const soloPick = list => list[Math.floor(Math.random() * list.length)];
const soloRand = (min, max) => min + Math.floor(Math.random() * (max - min + 1));
const soloNodeId = (floor, col) => `${floor}-${col}`;

function soloWeighted(weights) {
  const entries = Object.entries(weights).filter(([, w]) => w > 0);
  let roll = Math.random() * entries.reduce((sum, [, w]) => sum + w, 0);
  for (const [key, w] of entries) {
    roll -= w;
    if (roll < 0) return key;
  }
  return entries[0]?.[0] ?? null;
}

function soloRegionAt(floor, col) {
  if (floor <= 2) return 'beach';
  if (floor <= 5) return col < 2 ? 'forest' : 'meadow';
  if (floor <= SOLO_BRANCH_FLOORS) return col < 2 ? 'mountain' : 'wasteland';
  if (floor === SOLO_FLOOR.CAMPFIRE) return 'campfire';
  return floor === SOLO_FLOOR.LABYRINTH ? 'labyrinth' : 'castle';
}

// --- Map generation (Slay the Spire style, scaled down) ----------------------------

function generateSoloMap() {
  const nodes = {};
  const edges = [];
  const hasEdge = (a, b) => edges.some(([x, y]) => x === a && y === b);
  const addEdge = (a, b) => { if (!hasEdge(a, b)) edges.push([a, b]); };
  const addNode = (id, floor, col) => {
    if (!nodes[id]) nodes[id] = { id, floor, col, region: soloRegionAt(floor, col), type: null, jx: soloRand(-14, 14), jy: soloRand(-10, 10) };
    return id;
  };

  // 3 different start columns; the 4th walk shares one of them.
  const starts = shuffled([0, 1, 2, 3]).slice(0, 3);
  starts.push(soloPick(starts));
  starts.forEach(start => {
    let col = start;
    let prev = addNode(soloNodeId(1, col), 1, col);
    for (let floor = 2; floor <= SOLO_BRANCH_FLOORS; floor++) {
      // Paths never cross: moving col→c is blocked by an existing c→col.
      const options = shuffled([col - 1, col, col + 1].filter(c => c >= 0 && c < SOLO_COLS));
      const next = options.find(c => c === col || !hasEdge(soloNodeId(floor - 1, c), soloNodeId(floor, col))) ?? col;
      const id = addNode(soloNodeId(floor, next), floor, next);
      addEdge(prev, id);
      prev = id;
      col = next;
    }
  });

  ['campfire', 'labyrinth', 'castle'].forEach((id, k) => {
    nodes[id] = { id, floor: SOLO_FLOOR.CAMPFIRE + k, col: null, region: id, type: id, jx: 0, jy: 0 };
  });
  Object.values(nodes).filter(n => n.floor === SOLO_BRANCH_FLOORS).forEach(n => addEdge(n.id, 'campfire'));
  addEdge('campfire', 'labyrinth');
  addEdge('campfire', 'castle');
  addEdge('labyrinth', 'castle');

  // Node types, floor by floor so an elite never follows an elite.
  // The beach has no elite of its own, so it stays a warm-up.
  const eliteRegions = new Set();
  for (let floor = 1; floor <= SOLO_BRANCH_FLOORS; floor++) {
    Object.values(nodes).filter(n => n.floor === floor).forEach(n => {
      if (floor === 1) n.type = 'duelist';
      else if (floor === SOLO_TREASURE_FLOOR) n.type = 'treasure';
      else {
        const afterElite = edges.some(([a, b]) => b === n.id && nodes[a].type === 'elite');
        let type = soloWeighted(SOLO_MIXED_ODDS);
        if (type === 'elite' && (afterElite || eliteRegions.has(n.region) || n.region === 'beach')) type = soloWeighted({ ...SOLO_MIXED_ODDS, elite: 0 });
        if (type === 'elite') eliteRegions.add(n.region);
        else if (Math.random() < SOLO_HIDDEN_CHANCE) n.hidden = true;
        n.type = type;
      }
    });
  }
  // Who waits at each elite node. Bandit Keith turns up at most once.
  let keithUsed = false;
  Object.values(nodes).filter(n => n.type === 'elite').forEach(n => {
    const keith = !keithUsed && Math.random() < SOLO_KEITH_CHANCE;
    if (keith) keithUsed = true;
    n.elite = keith ? 'keith' : soloEliteFor(n.region);
  });
  return { nodes, edges };
}

const soloEliteFor = region => Object.keys(SOLO_ELITES).find(id => SOLO_ELITES[id].region === region) || 'keith';

// What a node shows on the map: 'hidden' until you've been there (or the
// Fortune Teller foresaw its Shadow Game).
const soloNodeLook = (n, run = solo) => (n.hidden && !n.event && !run.path.includes(n.id) ? 'hidden' : n.type);

// Where you can go next. After the campfire the Star Chips pick the way.
// Tristan's Shortcut jumps one floor further along the paths.
function soloReachable() {
  if (!solo.map) return [];
  if (!solo.at) return Object.values(solo.map.nodes).filter(n => n.floor === 1).map(n => n.id);
  if (solo.at === 'campfire') return [solo.chips >= SOLO_GATE_CHIPS ? 'castle' : 'labyrinth'];
  const next = from => solo.map.edges.filter(([a]) => from.includes(a)).map(([, b]) => b);
  const ids = next([solo.at]);
  return solo.shortcut ? [...new Set(next(ids))] : ids;
}

// --- Run ----------------------------------------------------------------------------

function createSoloRun() {
  solo = {
    runId: `${Date.now()}`,
    phase: 'map',
    lp: SOLO_START_LP,
    maxLp: SOLO_MAX_LP,
    chips: SOLO_START_CHIPS,
    map: generateSoloMap(),
    at: null,
    path: [],
    node: null,
    fight: null,
    reward: null,
    relics: [],
    offer: null,
    millennium: null,
    puzzleUsed: false,
    event: null,
    seenEvents: [],
    mods: {},
    shortcut: false,
    stats: { duels: 0, damage: 0 }
  };
}

function enterSoloNode(id) {
  if (!soloReachable().includes(id)) return false;
  const node = solo.map.nodes[id];
  solo.at = id;
  solo.path.push(id);
  solo.shortcut = false;
  if (['duelist', 'elite', 'labyrinth', 'castle'].includes(node.type)) {
    solo.fight = createSoloFight(node);
    solo.phase = 'fight';
    playSound({ name: 'co-start' });
  } else {
    solo.node = id;
    solo.phase = 'node';
    if (node.type === 'treasure') solo.offer = { source: 'treasure', ids: rollSoloRelics('common', SOLO_TREASURE_CHOICES) };
    if (node.type === 'event') solo.event = buildSoloEvent(node);
  }
  return true;
}

// The Millennium Ring halves the campfire.
const soloCampfireHeal = () => SOLO_CAMPFIRE_HEAL * (soloHas('ring') ? 0.5 : 1);

function soloRest() {
  const heal = Math.round((solo.maxLp * soloCampfireHeal()) / 100) * 100;
  healSoloPlayer(heal);
  return heal;
}

function soloBackToMap() {
  solo.phase = 'map';
  solo.node = null;
  solo.nodeResult = null;
  solo.fight = null;
  solo.reward = null;
  solo.offer = null;
  solo.event = null;
}

// --- Relics -------------------------------------------------------------------------

const soloHas = id => (solo.relics || []).includes(id);
const soloRelicReady = id => soloHas(id) && !solo.fight?.relicUsed?.[id];
const flashSoloRelic = id => queueSoloFx(() => fxSoloRelic(id));
const soloDrawCount = () => 1 + (soloHas('sanctity') ? SOLO_RELICS.sanctity.value : 0);
const announceSoloTurn = who => queueSoloFx(() => fxSoloTurn(who));

function rollSoloRelics(rarity, count) {
  if (rarity === 'millennium' && solo.millennium) return [];
  const pool = Object.keys(SOLO_RELICS).filter(id => SOLO_RELICS[id].rarity === rarity && !soloHas(id));
  return shuffled(pool).slice(0, count);
}

// Marks a relic as used for this duel; consumables leave your collection.
function useSoloRelic(id) {
  const f = solo.fight;
  if (f) f.relicUsed = { ...f.relicUsed, [id]: true };
  if (SOLO_RELICS[id].consumable) solo.relics = solo.relics.filter(r => r !== id);
  flashSoloRelic(id);
}

function gainSoloRelic(id) {
  const r = SOLO_RELICS[id];
  solo.relics.push(id);
  if (r.rarity === 'millennium') solo.millennium = id;
  if (id === 'duelist-glove') solo.chips++;
  if (id === 'key') solo.chips = Math.max(0, solo.chips - 1);
  if (id === 'elf') {
    solo.maxLp += r.value;
    healSoloPlayer(r.value);
  }
  if (id === 'rod') {
    solo.maxLp -= r.value;
    solo.lp = Math.min(solo.lp, solo.maxLp);
  }
  playSound({ name: 'co-bond' });
  flashSoloRelic(id);
}

function takeSoloRelic(id) {
  if (!solo.offer?.ids.includes(id)) return false;
  solo.offer = null;
  gainSoloRelic(id);
  return true;
}

function soloRaigeki() {
  const f = solo.fight;
  if (!soloHas('raigeki') || !f?.monsters.length) return null;
  const count = destroySoloMonsters(() => true);
  useSoloRelic('raigeki');
  return { tone: 'good', text: `⚡ Raigeki! ${count === 1 ? 'The enemy monster is' : `All ${count} enemy monsters are`} destroyed.` };
}

function soloRedMedicine() {
  if (!soloHas('red-medicine') || solo.lp >= solo.maxLp) return null;
  useSoloRelic('red-medicine');
  const healed = healSoloPlayer(SOLO_RELICS['red-medicine'].value);
  return { tone: 'good', text: `🧪 Red Medicine! You gain ${healed} LP.` };
}

// Waboku: no battle damage for the rest of the enemy's turn.
const soloWabokuActive = () => solo.fight?.turn === 'enemy' && solo.fight.waboku === solo.fight.round;

function soloBattleDamage(amount) {
  if (soloWabokuActive()) return 0;
  hurtSoloPlayer(amount);
  return amount;
}

// Kuriboh, Waboku, Magic Cylinder, Mirror Force and the Millennium Rod answer
// an enemy attack. 'swarm' is the Kuriboh Swarm from a Shadow Game.
function soloRelicDefend(id) {
  const step = soloStep();
  const f = solo.fight;
  if (!step || step.kind !== 'attack' || step.sub) return;
  if (id === 'swarm') {
    if (!f.swarm) return;
    f.swarm = false;
    playSound({ name: 'co-shield' });
    return finishSoloStep({ tone: 'good', text: '🧸 The Kuriboh swarm piles on the attacker! You take 0.' });
  }
  if (!soloRelicReady(id)) return;
  useSoloRelic(id);
  let result;
  if (id === 'kuriboh') {
    playSound({ name: 'co-shield' });
    result = { tone: 'good', text: '🧸 Kuriboh jumps in front of the attack! You take 0.' };
  } else if (id === 'waboku') {
    f.waboku = f.round;
    playSound({ name: 'co-shield' });
    result = { tone: 'good', text: '🛐 Waboku! You take no battle damage for the rest of this turn.' };
  } else if (id === 'cylinder') {
    playSound({ name: 'co-negate' });
    const dealt = damageSoloEnemy(step.atk);
    result = { tone: 'good', text: `🌀 Magic Cylinder! The attack hits ${f.name} for ${dealt}.` };
  } else if (id === 'rod') {
    const m = soloMonster(step.uid);
    if (m) removeSoloMonster(m.uid);
    const dealt = damageSoloEnemy(step.atk);
    result = { tone: 'good', text: `🪄 Millennium Rod! ${m ? m.name : 'The attacker'} turns on its owner: ${f.name} ${f.plural ? 'take' : 'takes'} ${dealt}, and it's destroyed.` };
  } else {
    const count = destroySoloMonsters(m => m.pos === 'atk');
    result = { tone: 'good', text: `🪞 Mirror Force! ${count === 1 ? 'The attacker is' : `${count} monsters are`} destroyed.` };
  }
  if (solo.phase === 'fight') finishSoloStep(result);
}

// --- Fights -------------------------------------------------------------------------

const soloRegion = (key = solo.fight?.region) => SOLO_REGIONS[key] || SOLO_REGIONS.castle;
const soloName = region => `${soloPick(SOLO_REGIONS[region].titles)} ${soloPick(SOLO_FIRST_NAMES)}`;

function soloPool(fight, opts) {
  if (fight.pegasus) return soloPegasusPool(fight, opts);
  if (fight.elite) {
    const deck = SOLO_ELITES[fight.elite].monsters.filter(m => !m.special);
    const pool = deck.filter(m => (m.minRound || 1) <= fight.round && !(m.unique && fight.monsters.some(x => x.name === m.name)));
    return pool.length ? pool : deck.filter(m => !m.unique);
  }
  let all = SOLO_MONSTERS[fight.region] || Object.values(SOLO_MONSTERS).flat();
  if (fight.only) all = all.filter(m => m.type === fight.only);
  const pool = all.filter(m => m.atk <= fight.maxAtk);
  return pool.length ? pool : all;
}

// node.type 'ambush' comes from a Shadow Game; node.ambush holds its duelist.
function createSoloFight(node) {
  const tier = SOLO_TIERS.find(t => node.floor <= t.maxFloor);
  const elite = id => {
    const e = SOLO_ELITES[id];
    return { elite: id, name: e.name, icon: e.icon, personality: e.personality, plural: !!e.plural, ...SOLO_ELITE };
  };
  let spec;
  if (node.type === 'duelist') {
    spec = { kind: 'duelist', name: soloName(node.region), icon: '👤', lp: tier.lp, maxAtk: tier.maxAtk, actions: 1, chips: 1 };
  } else if (node.type === 'elite') {
    spec = { kind: 'elite', ...elite(node.elite || soloEliteFor(node.region)) };
  } else if (node.type === 'labyrinth') {
    spec = { kind: 'gate', ...elite('paradox'), chips: Math.max(0, SOLO_GATE_CHIPS - solo.chips) };
  } else if (node.type === 'ambush') {
    spec = { kind: 'ambush', maxAtk: tier.maxAtk, actions: 1, chips: 0, ...node.ambush };
  } else {
    spec = { kind: 'boss', boss: 'pegasus', name: SOLO_PEGASUS.name, title: SOLO_PEGASUS.title, icon: SOLO_PEGASUS.icon, lp: SOLO_PEGASUS.lp, personality: SOLO_PEGASUS.personality, actions: SOLO_PEGASUS.actions[1], chips: 0 };
  }
  const fight = {
    ...spec,
    region: node.region,
    floor: node.floor,
    personality: spec.personality || soloPick(Object.keys(SOLO_PERSONALITIES)),
    maxLp: spec.lp,
    monsters: [],
    trap: false,
    used: { removal: false, heal: false },
    gimmick: {},
    grave: [],
    turn: 'player',
    round: 1,
    battleOver: false,
    intents: [],
    steps: [],
    stepIndex: 0,
    nextUid: 1,
    intro: true
  };
  if (spec.boss === 'pegasus') fight.pegasus = newSoloPegasus();
  applySoloMods(fight);
  planSoloTurn(fight);
  if (fight.pegasus && solo.video) soloApplyVideo(fight);
  return fight;
}

// Shadow Game effects land on the next duel, then they're gone.
function applySoloMods(f) {
  const mods = Object.keys(solo.mods || {}).filter(k => SOLO_EVENT_MODS[k]);
  solo.mods = {};
  f.mods = mods;
  if (mods.includes('insect')) {
    const card = SOLO_MONSTERS.forest.find(m => m.name === 'Killer Needle');
    f.monsters.push({ ...card, uid: f.nextUid++, pos: 'atk', equip: 0 });
  }
  if (mods.includes('storm')) {
    f.lp += SOLO_EVENT_MODS.storm.value;
    f.maxLp += SOLO_EVENT_MODS.storm.value;
  }
  if (mods.includes('pep')) f.pep = SOLO_EVENT_MODS.pep.value;
  if (mods.includes('lunch')) f.lunch = true;
  if (mods.includes('swarm')) f.swarm = true;
}

// The Spell/Trap set of this fight's owner: an elite, Pegasus, or the generic set.
const soloCards = f => SOLO_OWNER_CARDS[f.elite || f.boss] || SOLO_GENERIC_CARDS;

const soloEquipFits = (e, f) => !e.only || f.monsters.some(m => e.only.includes(m.type));

// An equip the field can use now. Cards with `only` need a monster of that type.
function soloEquipRoll(f, prev) {
  if (prev && soloEquipFits(prev, f)) return prev;
  const { equips } = soloCards(f);
  const fits = equips.filter(e => soloEquipFits(e, f));
  return soloPick(fits.length ? fits : equips.filter(e => !e.only));
}

// Picks the enemy's next intents and rolls their exact cards up front, so the
// Millennium Eye can show them.
function planSoloTurn(f) {
  f.intents = f.pegasus ? buildPegasusIntents(f) : buildSoloIntents(f);
  const taken = f.monsters.map(m => m.name);
  let toonWorld = soloToonWorldUp(f);
  f.peek = f.intents.map(action => {
    if (action === 'toonworld') toonWorld = true;
    if (action === 'equip') return { equip: soloEquipRoll(f) };
    if (action === 'crush') return { cardType: soloPick(SOLO_PEGASUS.cardTypes) };
    if (action === 'bluff') return soloPegasusBluff();
    if (action !== 'summon') return {};
    const pool = soloPool(f, { toonWorld, taken });
    const free = pool.filter(c => !(c.unique && taken.includes(c.name)));
    const card = soloPick(free.length ? free : pool);
    taken.push(card.name);
    return { card, pos: soloSummonPos(f, card) };
  });
}

const soloSummonPos = (f, card) => card.pos || (card.atk <= 500 || Math.random() >= SOLO_PERSONALITIES[f.personality].atkChance ? 'def' : 'atk');

// Dismissing the duel intro starts the rock-paper-scissors. The winner picks who goes first.
function startSoloRps() {
  const f = solo.fight;
  if (f?.intro && !f.rps) f.rps = { result: null };
}

// The enemy leans towards its personality's favourite throw.
function soloRpsThrow(you) {
  const f = solo.fight;
  if (!f?.intro || !SOLO_RPS[you]) return;
  const personality = SOLO_PERSONALITIES[f.personality];
  const foe = Math.random() < SOLO_RPS_FAVOURITE ? personality.rps : soloPick(Object.keys(SOLO_RPS));
  const result = you === foe ? 'tie' : SOLO_RPS[you].beats === foe ? 'win' : 'lose';
  f.rps = { you, foe, result };
  // A loss means the enemy decides: Pegasus always opens.
  if (result === 'lose') f.rps.first = f.pegasus || Math.random() < personality.firstChance ? 'enemy' : 'player';
  playSound({ name: result === 'win' ? 'co-turn' : result === 'lose' ? 'co-boss-turn' : 'co-bounce' });
}

// Whoever goes first can't attack on their first turn. The enemy's turn is round 0, so the
// player's first turn is still turn 1 and "round 1" rules (Swords of Revealing Light) hit its second.
// The Millennium Eye takes its toll (never your last LP).
function beginSoloDuel(first) {
  const f = solo.fight;
  if (!f?.intro) return;
  f.intro = false;
  f.rps = null;
  f.first = first;
  if (soloHas('eye')) {
    const cost = Math.min(SOLO_RELICS.eye.value, solo.lp - 1);
    hurtSoloPlayer(cost);
    flashSoloRelic('eye');
  }
  if (first === 'enemy') {
    f.round = 0;
    startSoloEnemyTurn();
  } else {
    f.battleOver = true;
    playSound({ name: 'co-turn' });
    announceSoloTurn('player');
  }
}

const soloBoosted = (fight, m) => soloRegion(fight.region).types.includes(m.type);

function soloStats(m, fight = solo.fight) {
  const atk = soloBoosted(fight, m) ? Math.round(m.atk * (1 + SOLO_FIELD_BONUS)) : m.atk;
  return { atk: atk + (m.equip || 0), def: m.def };
}

const soloMonster = uid => solo.fight?.monsters.find(m => m.uid === uid);

// Bonz' Zombies wait in the Graveyard to rise once.
function soloBury(m) {
  const f = solo.fight;
  if (f.elite === 'bonz' && m.type === 'Zombie' && !m.risen) f.grave = [...(f.grave || []), m];
}

function removeSoloMonster(uid) {
  const m = soloMonster(uid);
  solo.fight.monsters = solo.fight.monsters.filter(x => x.uid !== uid);
  if (m) soloBury(m);
  playSound({ name: 'co-destroy' });
}

// Removes every enemy monster that matches, with a single sound.
function destroySoloMonsters(match) {
  const f = solo.fight;
  const hit = f.monsters.filter(match);
  f.monsters = f.monsters.filter(m => !match(m));
  hit.forEach(soloBury);
  if (hit.length) playSound({ name: 'co-destroy' });
  return hit.length;
}

// Elite special cards: can the gimmick be played right now?
function soloSpecialReady(f) {
  const g = f.gimmick || {};
  if (f.elite === 'weevil') return !g.cocoon && f.monsters.length < SOLO_MAX_MONSTERS;
  if (f.elite === 'mai') return !g.egotist && f.monsters.some(m => m.name === 'Harpie Lady');
  if (f.elite === 'paradox') return !g.fuse && SOLO_PARADOX_TRIO.every(name => f.monsters.some(m => m.name === name));
  return false;
}

// The enemy's next turn, shown to the player as categories only.
function buildSoloIntents(f) {
  const p = SOLO_PERSONALITIES[f.personality];
  let monsters = f.monsters.length;
  let trap = f.trap;
  let removal = f.used.removal || f.floor < SOLO_REMOVAL_FROM_FLOOR || !soloCards(f).removal;
  let heal = f.used.heal || f.lp >= f.maxLp || !soloCards(f).heal;
  let special = !soloSpecialReady(f);
  const intents = [];
  for (let k = 0; k < f.actions; k++) {
    let action;
    if (k === 0 && (f.round === 1 || monsters === 0) && monsters < SOLO_MAX_MONSTERS) action = 'summon';
    else {
      action = soloWeighted({
        ...p.weights,
        special: special ? 0 : SOLO_SPECIAL_WEIGHT,
        summon: monsters < SOLO_MAX_MONSTERS ? p.weights.summon : 0,
        equip: monsters ? p.weights.equip : 0,
        trap: trap ? 0 : p.weights.trap,
        removal: removal ? 0 : p.weights.removal,
        heal: heal ? 0 : p.weights.heal
      }) || 'equip';
    }
    if (action === 'summon') monsters++;
    if (action === 'trap') trap = true;
    if (action === 'removal') removal = true;
    if (action === 'heal') heal = true;
    if (action === 'special') special = true;
    intents.push(action);
  }
  return intents;
}

// --- Damage -------------------------------------------------------------------------

function hurtSoloPlayer(amount) {
  if (amount <= 0 || !isSoloRunActive()) return;
  solo.lp = Math.max(0, solo.lp - amount);
  playSound({ name: 'co-hurt' });
  queueSoloFx(() => fxSoloHit('[data-solo-me]', -amount));
  if (solo.lp === 0 && soloHas('puzzle') && !solo.puzzleUsed) {
    // The Millennium Puzzle: once per run, Yami steps in.
    solo.puzzleUsed = true;
    solo.lp = SOLO_RELICS.puzzle.value;
    playSound({ name: 'co-bond' });
    flashSoloRelic('puzzle');
    queueSoloFx(() => fxSoloHit('[data-solo-me]', SOLO_RELICS.puzzle.value));
  }
  if (solo.lp === 0) soloDefeat();
}

function healSoloPlayer(amount) {
  const healed = Math.min(amount, solo.maxLp - solo.lp);
  if (healed <= 0) return 0;
  solo.lp += healed;
  playSound({ name: 'co-heal' });
  queueSoloFx(() => fxSoloHit('[data-solo-me]', healed));
  return healed;
}

function damageSoloEnemy(amount) {
  const f = solo.fight;
  if (!f || amount <= 0) return 0;
  // Funny Bunny: Pegasus takes no damage while it hops around.
  if (f.monsters.some(m => m.bunny)) {
    playSound({ name: 'co-bounce' });
    return 0;
  }
  const dealt = Math.min(f.lp, Math.round(amount));
  f.lp -= dealt;
  solo.stats.damage += dealt;
  playSound({ name: 'co-hit' });
  queueSoloFx(() => fxSoloHit('[data-solo-enemy]', -dealt));
  if (f.lp <= 0) soloWin();
  else if (f.pegasus) soloPegasusStage(f);
  return dealt;
}

function soloWin() {
  const f = solo.fight;
  solo.stats.duels++;
  if (f.kind === 'boss') {
    solo.phase = 'victory';
    soloArchiveRun('victory');
    playSound({ name: 'co-victory' });
    return;
  }
  solo.chips += f.chips;
  solo.reward = { name: f.name, icon: f.icon, kind: f.kind, chips: f.chips, plural: !!f.plural };
  solo.phase = 'reward';
  if (f.kind === 'elite') {
    const ids = rollSoloRelics('rare', SOLO_ELITE_CHOICES);
    const item = Math.random() < SOLO_MILLENNIUM_CHANCE && rollSoloRelics('millennium', 1)[0];
    if (item) {
      if (ids.length >= SOLO_ELITE_CHOICES) ids.pop();
      ids.push(item);
    }
    solo.offer = { source: 'elite', ids };
  }
  playSound({ name: 'co-victory' });
  if (soloHas('dian-keto')) {
    solo.reward.healed = healSoloPlayer(SOLO_RELICS['dian-keto'].value);
    flashSoloRelic('dian-keto');
  }
}

function soloDefeat() {
  solo.phase = 'defeat';
  soloArchiveRun('defeat');
  playSound({ name: 'co-seal' });
}

// --- Your turn ----------------------------------------------------------------------

// Battle on the phone with normal Yu-Gi-Oh! rules. uid null = direct attack,
// 'book' = Pegasus' Toon World.
function soloPlayerAttack(uid, atk) {
  const f = solo.fight;
  let prefix = '';
  if (f.trap) {
    const trap = soloCards(f).trap;
    f.trap = false;
    playSound({ name: 'co-negate' });
    const head = `🪤 ${trap.name}!`;
    if (trap.kind === 'halve') {
      atk = Math.floor(atk / 2);
      prefix = `${head} Your attacker's ATK is halved to ${atk}. `;
    } else if (trap.kind === 'destroy') {
      if (atk >= 1000) {
        f.battleOver = true;
        return { tone: 'bad', text: `${head} ${trap.text.replace(/ if it has.*$/, '')}. Send it to the Graveyard.`, negated: true };
      }
      prefix = `${head} Your attacker has under 1000 ATK, so nothing happens. `;
    } else if (trap.kind === 'burn') {
      hurtSoloPlayer(300);
      prefix = `${head} You take 300. `;
    } else {
      f.battleOver = true;
      return { tone: 'bad', text: `${head} ${trap.text}`, negated: true };
    }
  }
  const result = soloResolveAttack(uid, atk);
  if (prefix && result) result.text = prefix + result.text;
  return result;
}

function soloResolveAttack(uid, atk) {
  const f = solo.fight;
  if (uid === 'book') return soloTearPage(atk);
  if (uid === null) {
    const dealt = damageSoloEnemy(atk);
    return { tone: 'good', text: `⚔️ Direct attack! ${f.name} takes ${dealt}.` };
  }
  const m = soloMonster(uid);
  if (!m) return null;
  const st = soloStats(m);
  // While Toon World stands, Toons can't be destroyed by battle and Pegasus
  // takes no battle damage from them.
  const toon = m.toon && soloToonWorldUp(f);
  if (m.pos === 'atk') {
    if (atk > st.atk && toon) {
      playSound({ name: 'co-squash' });
      return { tone: 'meh', text: `🤪 ${m.name} is squashed flat… and pops right back up! Toon World protects ${f.name}: no damage.` };
    }
    if (atk > st.atk) {
      removeSoloMonster(uid);
      const dealt = damageSoloEnemy(atk - st.atk);
      return { tone: 'good', text: `💥 ${m.name} is destroyed! ${f.name} takes ${dealt}.` };
    }
    if (atk === st.atk && toon) {
      playSound({ name: 'co-squash' });
      return { tone: 'meh', text: `🤪 Your monster is destroyed, but ${m.name} just bounces back. Send yours to the Graveyard.` };
    }
    if (atk === st.atk) {
      removeSoloMonster(uid);
      return { tone: 'meh', text: `💥 Both monsters are destroyed. Send yours to the Graveyard.` };
    }
    hurtSoloPlayer(st.atk - atk);
    return { tone: 'bad', text: `💔 ${m.name} is stronger! Your monster is destroyed and you take ${st.atk - atk}.` };
  }
  if (atk > st.def) {
    removeSoloMonster(uid);
    return { tone: 'good', text: `💥 ${m.name} is destroyed! It was in Defense Position, so no damage.` };
  }
  if (atk === st.def) return { tone: 'meh', text: `🛡️ ${m.name} holds. Nothing is destroyed.` };
  hurtSoloPlayer(st.def - atk);
  return { tone: 'bad', text: `🛡️ ${m.name}'s defense is too high! You take ${st.def - atk}.` };
}

// --- Enemy turn ---------------------------------------------------------------------

const soloStep = () => solo.fight?.steps[solo.fight.stepIndex];

function startSoloEnemyTurn() {
  const f = solo.fight;
  const g = f.gimmick || {};
  f.turn = 'enemy';
  const pre = [];
  if (f.grave?.length) pre.push({ type: 'rise' });
  f.monsters.filter(m => m.hatch).forEach(m => {
    m.hatch--;
    if (m.hatch <= 0) pre.push({ type: 'hatch', uid: m.uid });
  });
  const sleeve = f.elite === 'keith' && !g.sleeve && f.round >= SOLO_SLEEVE.fromRound &&
    (f.round >= SOLO_SLEEVE.byRound || Math.random() < SOLO_SLEEVE.chance);
  f.steps = [...pre, ...f.intents.map((type, i) => ({ type, peek: f.peek?.[i] })), ...(sleeve ? [{ type: 'sleeve' }] : []), { type: 'attacks' }];
  f.stepIndex = 0;
  playSound({ name: 'co-boss-turn' });
  announceSoloTurn('enemy');
  prepareSoloStep();
}

function endSoloEnemyTurn() {
  const f = solo.fight;
  f.turn = 'player';
  f.round++;
  f.battleOver = false;
  f.steps = [];
  f.stepIndex = 0;
  planSoloTurn(f);
  playSound({ name: 'co-turn' });
  announceSoloTurn('player');
}

// Fills in the current step. Steps that no longer apply are skipped; when all
// are done the enemy's turn ends.
function prepareSoloStep() {
  const f = solo.fight;
  while (solo.phase === 'fight' && f.turn === 'enemy') {
    const step = soloStep();
    if (!step) {
      endSoloEnemyTurn();
      return;
    }
    if (step.ready) return;
    if (step.type === 'attacks') {
      // The enemy can't attack on its first turn when it opens the duel.
      if (f.round === 0) {
        f.steps.splice(f.stepIndex, 1);
        continue;
      }
      // Monsters summoned this turn attack too: this is Yu-Gi-Oh!
      const attackers = f.monsters.filter(m => m.pos === 'atk' && !m.bound);
      if (attackers.length && f.round === 1 && soloHas('swords')) {
        step.type = 'swords';
      } else {
        f.steps.splice(f.stepIndex, 1, ...attackers.flatMap(soloAttackSteps));
        continue;
      }
    }
    if (prepareSoloStepType(step, f) === false) {
      f.stepIndex++;
      continue;
    }
    step.ready = true;
    return;
  }
}

// Toon Barrel Dragon fires its barrels instead; Toon Gemini Elf hits twice.
const soloAttackSteps = m => (m.barrels ? [{ type: 'barrel', uid: m.uid }]
  : m.hits ? Array.from({ length: m.hits }, (_, i) => ({ type: 'attack', uid: m.uid, hit: i + 1 }))
  : [{ type: 'attack', uid: m.uid }]);

function prepareSoloStepType(step, f) {
  const info = (icon, title, text, note = '') => Object.assign(step, { kind: 'info', icon, title, text, note: [note, step.bluffNote].filter(Boolean).join('<br>') });

  if (step.type === 'summon' && f.monsters.length >= SOLO_MAX_MONSTERS) step.type = 'equip';
  if (step.type === 'equip' && !f.monsters.length) step.type = 'summon';

  switch (step.type) {
    case 'summon': {
      // The card rolled with the intents, unless the field changed since.
      const pool = soloPool(f);
      const pk = step.peek?.card && pool.some(c => c.name === step.peek.card.name) ? step.peek : null;
      const card = pk ? pk.card : soloPick(pool);
      const pos = pk ? pk.pos : soloSummonPos(f, card);
      const m = { ...card, uid: f.nextUid++, pos, equip: 0 };
      f.monsters.push(m);
      playSound({ name: m.toon ? 'co-toon' : 'co-summon' });
      const st = soloStats(m, f);
      const notes = [];
      if (m.toon) notes.push("🤪 Toons attack you directly and can't be blocked.");
      if (soloBoosted(f, m)) notes.push(`${soloRegion(f.region).icon} ${soloRegion(f.region).name} field bonus: ATK ${m.atk} → ${st.atk}`);
      if (soloRelicReady('spellbinding')) {
        m.bound = true;
        useSoloRelic('spellbinding');
        notes.push("🔯 Spellbinding Circle! It can't attack.");
      }
      return info('🃏', `Summons ${m.name}!`, `${m.icon} ${st.atk} ATK / ${st.def} DEF in <b>${pos === 'atk' ? 'Attack' : 'Defense'} Position</b>.`, notes.join('<br>'));
    }
    case 'equip': {
      const eq = soloEquipRoll(f, step.peek?.equip);
      const fitting = f.monsters.filter(m => !eq.only || eq.only.includes(m.type));
      const attackers = fitting.filter(m => m.pos === 'atk');
      const targets = attackers.length ? attackers : fitting;
      const target = targets.reduce((a, b) => (soloStats(b, f).atk > soloStats(a, f).atk ? b : a));
      target.equip = (target.equip || 0) + eq.atk;
      playSound({ name: 'co-shield' });
      return info('⚔️', `${eq.name}!`, `${target.icon} ${target.name} gains ${eq.atk} ATK (now ${soloStats(target, f).atk}).`);
    }
    case 'trap': {
      if (f.trap) return false;
      const trap = soloCards(f).trap;
      if (soloRelicReady('ring')) {
        useSoloRelic('ring');
        playSound({ name: 'co-destroy' });
        return info('💍', 'Sets a card face-down…', `The Millennium Ring points at it: ${trap.name}! It is destroyed before it can spring.`);
      }
      f.trap = true;
      playSound({ name: 'co-negate' });
      return info('🪤', 'Sets a card face-down…', 'It will spring on your first attack next turn.');
    }
    case 'removal': {
      const removal = soloCards(f).removal;
      if (f.used.removal || !removal) return false;
      f.used.removal = true;
      playSound({ name: 'co-destroy' });
      return info('💥', `${removal.name}!`, removal.text, 'Send it to the Graveyard on the table. No monsters? Nothing happens.');
    }
    case 'heal': {
      const heal = soloCards(f).heal;
      if (!heal || f.used.heal || f.lp >= f.maxLp) return false;
      f.used.heal = true;
      const healed = Math.min(heal.lp, f.maxLp - f.lp);
      f.lp += healed;
      playSound({ name: 'co-heal' });
      queueSoloFx(() => fxSoloHit('[data-solo-enemy]', healed));
      return info('💚', `${heal.name}!`, `${f.name} gains ${healed} LP.`);
    }
    case 'attack': {
      const m = soloMonster(step.uid);
      if (!m || m.pos !== 'atk' || m.bound) return false;
      const atk = step.hit ? m.hitAtk + (m.equip || 0) : soloStats(m, f).atk;
      const title = `${m.name} attacks directly!${step.hit ? ` (${step.hit}/${m.hits})` : ''}`;
      Object.assign(step, { kind: 'attack', icon: m.icon, title, atk, sub: null, rex: f.elite === 'rex' && m.type === 'Dinosaur', toon: !!m.toon, note: m.seal ? soloToonSeal(f) : '' });
      return true;
    }
    case 'swords':
      playSound({ name: 'co-shield' });
      flashSoloRelic('swords');
      return info('🌟', 'Swords of Revealing Light!', "The enemy's monsters can't attack this turn.");
    case 'special':
      return soloSpecialStep(f, info);
    case 'hatch': {
      const m = soloMonster(step.uid);
      if (!m) return false;
      Object.assign(m, SOLO_GIMMICK_CARDS.moth, { pos: 'atk', hatch: 0 });
      playSound({ name: 'co-summon' });
      return info('🦋', 'The cocoon hatches!', `🦋 Great Moth spreads its wings: ${soloStats(m, f).atk} ATK in <b>Attack Position</b>.`, 'Swap the cocoon on the table for the moth.');
    }
    case 'rise': {
      const room = SOLO_MAX_MONSTERS - f.monsters.length;
      const risen = f.grave.slice(0, Math.max(0, room)).map(m => ({ ...m, uid: f.nextUid++, equip: 0, bound: false, risen: true }));
      f.grave = [];
      if (!risen.length) return false;
      f.monsters.push(...risen);
      playSound({ name: 'co-summon' });
      return info('🧟', risen.length === 1 ? `${risen[0].name} rises again!` : 'The dead rise again!', risen.map(m => `${m.icon} ${m.name} (${soloStats(m, f).atk} ATK) in <b>${m.pos === 'atk' ? 'Attack' : 'Defense'} Position</b>`).join('<br>'), 'Risen Zombies stay dead next time.');
    }
    case 'sleeve': {
      f.gimmick = { ...f.gimmick, sleeve: true };
      playSound({ name: 'co-negate' });
      const card = SOLO_ELITES.keith.monsters.find(m => m.special);
      if (f.monsters.length < SOLO_MAX_MONSTERS) {
        const m = { ...card, uid: f.nextUid++, pos: 'atk', equip: 0 };
        f.monsters.push(m);
        return info('🃏', 'A card up his sleeve!', `${m.icon} ${m.name} appears out of nowhere: ${soloStats(m, f).atk} ATK in <b>Attack Position</b>.`, '"Cheating? Prove it, punk."');
      }
      const target = f.monsters.reduce((a, b) => (soloStats(b, f).atk > soloStats(a, f).atk ? b : a));
      target.equip = (target.equip || 0) + SOLO_GIMMICK_CARDS.nuzzler.atk;
      return info('🃏', 'A card up his sleeve!', `${SOLO_GIMMICK_CARDS.nuzzler.name}: ${target.icon} ${target.name} gains ${SOLO_GIMMICK_CARDS.nuzzler.atk} ATK (now ${soloStats(target, f).atk}).`, '"Cheating? Prove it, punk."');
    }
    default:
      return f.pegasus ? soloPegasusStep(step, f, info) : false;
  }
}

// Elite special cards. If the moment has passed, the card fizzles.
function soloSpecialStep(f, info) {
  if (!soloSpecialReady(f)) {
    playSound({ name: 'co-bounce' });
    return info('💨', 'It fizzles!', `${f.name} ${f.plural ? 'try' : 'tries'} a special card, but the moment has passed.`);
  }
  playSound({ name: 'co-summon' });
  if (f.elite === 'weevil') {
    f.gimmick = { ...f.gimmick, cocoon: true };
    const m = { ...SOLO_GIMMICK_CARDS.cocoon, uid: f.nextUid++, pos: 'def', equip: 0, hatch: SOLO_COCOON_TURNS };
    f.monsters.push(m);
    return info('🥚', 'Cocoon of Evolution!', `${m.icon} ${m.name} (0 ATK / ${m.def} DEF) in <b>Defense Position</b>.`, `It hatches into Great Moth (2600 ATK) at the start of his turn in ${SOLO_COCOON_TURNS} turns. Destroy it first!`);
  }
  if (f.elite === 'mai') {
    f.gimmick = { ...f.gimmick, egotist: true };
    const m = f.monsters.find(x => x.name === 'Harpie Lady');
    Object.assign(m, SOLO_GIMMICK_CARDS.sisters);
    return info('🪞', 'Elegant Egotist!', `Harpie Lady becomes ${m.icon} ${m.name}: ${soloStats(m, f).atk} ATK / ${m.def} DEF.`, 'Swap the card on the table. It keeps its position and equips.');
  }
  f.gimmick = { ...f.gimmick, fuse: true };
  f.monsters = f.monsters.filter(m => !SOLO_PARADOX_TRIO.includes(m.name));
  const m = { ...SOLO_ELITES.paradox.monsters.find(x => x.special), uid: f.nextUid++, pos: 'atk', equip: 0 };
  f.monsters.push(m);
  return info('🗿', 'Polymerization: Gate Guardian!', `Sanga, Kazejin and Suijin fuse into ${m.icon} ${m.name}: ${soloStats(m, f).atk} ATK in <b>Attack Position</b>.`, 'Replace the three cards on the table with Gate Guardian.');
}

function finishSoloStep(result) {
  const step = soloStep();
  if (!step) return;
  step.sub = 'done';
  step.result = result;
}

function soloTakeHit() {
  const step = soloStep();
  const dealt = soloBattleDamage(step.atk);
  const result = dealt ? { tone: 'bad', text: `💔 You take ${dealt}.` } : { tone: 'good', text: '🛐 Waboku protects you. You take 0.' };
  if (step.rex && solo.phase === 'fight') {
    step.sub = 'rex';
    step.result = result;
    return;
  }
  finishSoloStep(result);
}

// Rex Raptor: a Dinosaur hits twice when your field is empty (honour system).
function soloRexAgain(empty) {
  const step = soloStep();
  if (!step || step.sub !== 'rex') return;
  if (!empty) return finishSoloStep(step.result);
  const dealt = soloBattleDamage(step.atk);
  if (solo.phase === 'fight') {
    finishSoloStep(dealt ? { tone: 'bad', text: `🦖 It attacks again! You take ${dealt} more.` } : { tone: 'good', text: '🛐 It attacks again, but Waboku protects you.' });
  }
}

// You block an enemy attack with one of your monsters (normal battle rules).
function soloBlock(value, pos) {
  const step = soloStep();
  const m = soloMonster(step.uid);
  const f = solo.fight;
  if (!m) return finishSoloStep({ tone: 'meh', text: 'The attacker is gone.' });
  const a = soloStats(m).atk;
  let result;
  if (pos === 'atk') {
    if (a > value) {
      const dealt = soloBattleDamage(a - value);
      result = { tone: 'bad', text: dealt ? `💔 Your monster is destroyed and you take ${dealt}.` : '🛐 Your monster is destroyed, but Waboku stops the damage.' };
    } else if (a === value) {
      removeSoloMonster(m.uid);
      result = { tone: 'meh', text: '💥 Both monsters are destroyed. Send yours to the Graveyard.' };
    } else {
      removeSoloMonster(m.uid);
      result = { tone: 'good', text: `💥 ${m.name} is destroyed! ${f.name} takes ${value - a}.` };
      damageSoloEnemy(value - a);
    }
  } else if (a > value) {
    playSound({ name: 'co-destroy' });
    result = { tone: 'meh', text: '🛡️ Your monster is destroyed, but you take no damage.' };
  } else if (a === value) {
    playSound({ name: 'co-shield' });
    result = { tone: 'good', text: '🛡️ Your monster holds! Nothing is destroyed.' };
  } else {
    result = { tone: 'good', text: `🛡️ ${m.name} bounces off! ${f.name} takes ${value - a}.` };
    damageSoloEnemy(value - a);
  }
  if (solo.phase === 'fight') finishSoloStep(result);
}

function advanceSoloStep() {
  if (!solo.fight || solo.fight.turn !== 'enemy') return;
  solo.fight.stepIndex++;
  prepareSoloStep();
}
