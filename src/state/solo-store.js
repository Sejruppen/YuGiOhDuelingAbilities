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
const newSolo = () => ({ phase: 'intro' });

function loadSolo() {
  try {
    const saved = JSON.parse(localStorage.getItem(SOLO_STORAGE_KEY));
    if (!saved || !saved.phase) return newSolo();
    if (!saved.relics) saved.relics = [];
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
  if (floor === 1) return 'beach';
  if (floor <= 3) return col < 2 ? 'forest' : 'meadow';
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
  const eliteRegions = new Set();
  for (let floor = 1; floor <= SOLO_BRANCH_FLOORS; floor++) {
    Object.values(nodes).filter(n => n.floor === floor).forEach(n => {
      if (floor === 1) n.type = 'duelist';
      else if (floor === SOLO_TREASURE_FLOOR) n.type = 'treasure';
      else {
        const afterElite = edges.some(([a, b]) => b === n.id && nodes[a].type === 'elite');
        let type = soloWeighted(SOLO_MIXED_ODDS);
        if (type === 'elite' && (afterElite || eliteRegions.has(n.region))) type = soloWeighted({ ...SOLO_MIXED_ODDS, elite: 0 });
        if (type === 'elite') eliteRegions.add(n.region);
        n.type = type;
      }
    });
  }
  return { nodes, edges };
}

// Where you can go next. After the campfire the Star Chips pick the way.
function soloReachable() {
  if (!solo.map) return [];
  if (!solo.at) return Object.values(solo.map.nodes).filter(n => n.floor === 1).map(n => n.id);
  if (solo.at === 'campfire') return [solo.chips >= SOLO_GATE_CHIPS ? 'castle' : 'labyrinth'];
  return solo.map.edges.filter(([a]) => a === solo.at).map(([, b]) => b);
}

// --- Run ----------------------------------------------------------------------------

function createSoloRun() {
  solo = {
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
    stats: { duels: 0, damage: 0 }
  };
}

function enterSoloNode(id) {
  if (!soloReachable().includes(id)) return false;
  const node = solo.map.nodes[id];
  solo.at = id;
  solo.path.push(id);
  if (['duelist', 'elite', 'labyrinth', 'castle'].includes(node.type)) {
    solo.fight = createSoloFight(node);
    solo.phase = 'fight';
    playSound({ name: 'co-start' });
  } else {
    solo.node = id;
    solo.phase = 'node';
    if (node.type === 'treasure') solo.offer = { source: 'treasure', ids: rollSoloRelics('common', SOLO_TREASURE_CHOICES) };
  }
  return true;
}

function soloRest() {
  const heal = Math.round((solo.maxLp * SOLO_CAMPFIRE_HEAL) / 100) * 100;
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
}

// --- Relics -------------------------------------------------------------------------

const soloHas = id => (solo.relics || []).includes(id);
const soloRelicReady = id => soloHas(id) && !solo.fight?.relicUsed?.[id];
const flashSoloRelic = id => queueSoloFx(() => fxSoloRelic(id));

function rollSoloRelics(rarity, count) {
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

function takeSoloRelic(id) {
  if (!solo.offer?.ids.includes(id)) return false;
  const r = SOLO_RELICS[id];
  solo.relics.push(id);
  solo.offer = null;
  if (id === 'duelist-glove') solo.chips++;
  if (id === 'elf') {
    solo.maxLp += r.value;
    healSoloPlayer(r.value);
  }
  playSound({ name: 'co-bond' });
  flashSoloRelic(id);
  return true;
}

function soloRaigeki() {
  const f = solo.fight;
  if (!soloHas('raigeki') || !f?.monsters.length) return null;
  const count = f.monsters.length;
  f.monsters = [];
  useSoloRelic('raigeki');
  playSound({ name: 'co-destroy' });
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

// Kuriboh, Waboku, Magic Cylinder and Mirror Force answer an enemy attack.
function soloRelicDefend(id) {
  const step = soloStep();
  const f = solo.fight;
  if (!step || step.kind !== 'attack' || step.sub || !soloRelicReady(id)) return;
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
  } else {
    const count = f.monsters.filter(m => m.pos === 'atk').length;
    f.monsters = f.monsters.filter(m => m.pos !== 'atk');
    playSound({ name: 'co-destroy' });
    result = { tone: 'good', text: `🪞 Mirror Force! ${count === 1 ? 'The attacker is' : `${count} monsters are`} destroyed.` };
  }
  if (solo.phase === 'fight') finishSoloStep(result);
}

// --- Fights -------------------------------------------------------------------------

const soloRegion = (key = solo.fight?.region) => SOLO_REGIONS[key] || SOLO_REGIONS.castle;
const soloName = region => `${soloPick(SOLO_REGIONS[region].titles)} ${soloPick(SOLO_FIRST_NAMES)}`;

function soloPool(fight) {
  const all = SOLO_MONSTERS[fight.region] || Object.values(SOLO_MONSTERS).flat();
  const pool = all.filter(m => m.atk <= fight.maxAtk);
  return pool.length ? pool : all;
}

function createSoloFight(node) {
  const tier = SOLO_TIERS.find(t => node.floor <= t.maxFloor);
  let spec;
  if (node.type === 'duelist') {
    spec = { kind: 'duelist', name: soloName(node.region), icon: '👤', lp: tier.lp, maxAtk: tier.maxAtk, actions: 1, chips: 1 };
  } else if (node.type === 'elite') {
    spec = { kind: 'elite', name: `Veteran ${soloName(node.region)}`, icon: '👹', ...SOLO_ELITE };
  } else if (node.type === 'labyrinth') {
    spec = { kind: 'gate', name: soloName('labyrinth'), icon: '🧱', ...SOLO_ELITE, chips: Math.max(0, SOLO_GATE_CHIPS - solo.chips) };
  } else {
    spec = { kind: 'boss', ...SOLO_CASTLE_GUARD, chips: 0 };
  }
  const fight = {
    ...spec,
    region: node.region,
    floor: node.floor,
    personality: soloPick(Object.keys(SOLO_PERSONALITIES)),
    maxLp: spec.lp,
    monsters: [],
    trap: false,
    used: { removal: false, heal: false },
    turn: 'player',
    round: 1,
    battleOver: false,
    intents: [],
    steps: [],
    stepIndex: 0,
    nextUid: 1,
    intro: true
  };
  fight.intents = buildSoloIntents(fight);
  return fight;
}

const soloBoosted = (fight, m) => soloRegion(fight.region).types.includes(m.type);

function soloStats(m, fight = solo.fight) {
  const atk = soloBoosted(fight, m) ? Math.round(m.atk * (1 + SOLO_FIELD_BONUS)) : m.atk;
  return { atk: atk + (m.equip || 0), def: m.def };
}

const soloMonster = uid => solo.fight?.monsters.find(m => m.uid === uid);

function removeSoloMonster(uid) {
  solo.fight.monsters = solo.fight.monsters.filter(m => m.uid !== uid);
  playSound({ name: 'co-destroy' });
}

// The enemy's next turn, shown to the player as categories only.
function buildSoloIntents(f) {
  const p = SOLO_PERSONALITIES[f.personality];
  let monsters = f.monsters.length;
  let trap = f.trap;
  let removal = f.used.removal || f.floor < SOLO_REMOVAL_FROM_FLOOR;
  let heal = f.used.heal || f.lp >= f.maxLp;
  const intents = [];
  for (let k = 0; k < f.actions; k++) {
    let action;
    if (k === 0 && (f.round === 1 || monsters === 0) && monsters < SOLO_MAX_MONSTERS) action = 'summon';
    else {
      action = soloWeighted({
        ...p.weights,
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
  const dealt = Math.min(f.lp, Math.round(amount));
  f.lp -= dealt;
  solo.stats.damage += dealt;
  playSound({ name: 'co-hit' });
  queueSoloFx(() => fxSoloHit('[data-solo-enemy]', -dealt));
  if (f.lp <= 0) soloWin();
  return dealt;
}

function soloWin() {
  const f = solo.fight;
  solo.stats.duels++;
  if (f.kind === 'boss') {
    solo.phase = 'victory';
    playSound({ name: 'co-victory' });
    return;
  }
  solo.chips += f.chips;
  solo.reward = { name: f.name, icon: f.icon, kind: f.kind, chips: f.chips };
  solo.phase = 'reward';
  if (f.kind === 'elite') solo.offer = { source: 'elite', ids: rollSoloRelics('rare', SOLO_ELITE_CHOICES) };
  playSound({ name: 'co-victory' });
  if (soloHas('dian-keto')) {
    solo.reward.healed = healSoloPlayer(SOLO_RELICS['dian-keto'].value);
    flashSoloRelic('dian-keto');
  }
}

function soloDefeat() {
  solo.phase = 'defeat';
  playSound({ name: 'co-defeat' });
}

// --- Your turn ----------------------------------------------------------------------

// Battle on the phone with normal Yu-Gi-Oh! rules. uid null = direct attack.
function soloPlayerAttack(uid, atk) {
  const f = solo.fight;
  if (f.trap) {
    f.trap = false;
    f.battleOver = true;
    playSound({ name: 'co-negate' });
    return { tone: 'bad', text: `🪤 ${SOLO_TRAP.name}! ${SOLO_TRAP.text}`, negated: true };
  }
  if (uid === null) {
    const dealt = damageSoloEnemy(atk);
    return { tone: 'good', text: `⚔️ Direct attack! ${f.name} takes ${dealt}.` };
  }
  const m = soloMonster(uid);
  if (!m) return null;
  const st = soloStats(m);
  if (m.pos === 'atk') {
    if (atk > st.atk) {
      removeSoloMonster(uid);
      const dealt = damageSoloEnemy(atk - st.atk);
      return { tone: 'good', text: `💥 ${m.name} is destroyed! ${f.name} takes ${dealt}.` };
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
  f.turn = 'enemy';
  f.steps = [...f.intents.map(type => ({ type })), { type: 'attacks' }];
  f.stepIndex = 0;
  playSound({ name: 'co-boss-turn' });
  prepareSoloStep();
}

function endSoloEnemyTurn() {
  const f = solo.fight;
  f.turn = 'player';
  f.round++;
  f.battleOver = false;
  f.steps = [];
  f.stepIndex = 0;
  f.intents = buildSoloIntents(f);
  playSound({ name: 'co-turn' });
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
      // Monsters summoned this turn attack too: this is Yu-Gi-Oh!
      const attackers = f.monsters.filter(m => m.pos === 'atk' && !m.bound);
      if (attackers.length && f.round === 1 && soloHas('swords')) {
        step.type = 'swords';
      } else {
        f.steps.splice(f.stepIndex, 1, ...attackers.map(m => ({ type: 'attack', uid: m.uid })));
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

function prepareSoloStepType(step, f) {
  const info = (icon, title, text, note = '') => Object.assign(step, { kind: 'info', icon, title, text, note });

  if (step.type === 'summon' && f.monsters.length >= SOLO_MAX_MONSTERS) step.type = 'equip';
  if (step.type === 'equip' && !f.monsters.length) step.type = 'summon';

  switch (step.type) {
    case 'summon': {
      const card = soloPick(soloPool(f));
      const pos = card.atk <= 500 || Math.random() >= SOLO_PERSONALITIES[f.personality].atkChance ? 'def' : 'atk';
      const m = { ...card, uid: f.nextUid++, pos, equip: 0 };
      f.monsters.push(m);
      playSound({ name: 'co-summon' });
      const st = soloStats(m, f);
      const notes = [];
      if (soloBoosted(f, m)) notes.push(`${soloRegion(f.region).icon} ${soloRegion(f.region).name} field bonus: ATK ${m.atk} → ${st.atk}`);
      if (soloRelicReady('spellbinding')) {
        m.bound = true;
        useSoloRelic('spellbinding');
        notes.push("🔯 Spellbinding Circle! It can't attack.");
      }
      return info('🃏', `Summons ${m.name}!`, `${m.icon} ${st.atk} ATK / ${st.def} DEF in <b>${pos === 'atk' ? 'Attack' : 'Defense'} Position</b>.`, notes.join('<br>'));
    }
    case 'equip': {
      const targets = f.monsters.filter(m => m.pos === 'atk');
      const target = (targets.length ? targets : f.monsters).reduce((a, b) => (soloStats(b, f).atk > soloStats(a, f).atk ? b : a));
      const eq = soloPick(SOLO_EQUIPS);
      target.equip = (target.equip || 0) + eq.atk;
      playSound({ name: 'co-shield' });
      return info('⚔️', `${eq.name}!`, `${target.icon} ${target.name} gains ${eq.atk} ATK (now ${soloStats(target, f).atk}).`);
    }
    case 'trap':
      if (f.trap) return false;
      f.trap = true;
      playSound({ name: 'co-negate' });
      return info('🪤', 'Sets a card face-down…', 'It will spring on your first attack next turn.');
    case 'removal':
      if (f.used.removal) return false;
      f.used.removal = true;
      playSound({ name: 'co-destroy' });
      return info('💥', `${SOLO_REMOVAL.name}!`, SOLO_REMOVAL.text, 'Send it to the Graveyard on the table. No monsters? Nothing happens.');
    case 'heal': {
      if (f.used.heal || f.lp >= f.maxLp) return false;
      f.used.heal = true;
      const healed = Math.min(SOLO_HEAL.lp, f.maxLp - f.lp);
      f.lp += healed;
      playSound({ name: 'co-heal' });
      queueSoloFx(() => fxSoloHit('[data-solo-enemy]', healed));
      return info('💚', `${SOLO_HEAL.name}!`, `${f.name} gains ${healed} LP.`);
    }
    case 'attack': {
      const m = soloMonster(step.uid);
      if (!m || m.pos !== 'atk' || m.bound) return false;
      Object.assign(step, { kind: 'attack', icon: m.icon, title: `${m.name} attacks directly!`, atk: soloStats(m, f).atk, sub: null });
      return true;
    }
    case 'swords':
      playSound({ name: 'co-shield' });
      flashSoloRelic('swords');
      return info('🌟', 'Swords of Revealing Light!', "The enemy's monsters can't attack this turn.");
    default:
      return false;
  }
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
  finishSoloStep(dealt ? { tone: 'bad', text: `💔 You take ${dealt}.` } : { tone: 'good', text: '🛐 Waboku protects you. You take 0.' });
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
