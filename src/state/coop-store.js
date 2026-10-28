// Co-op Boss engine. `coop` is saved to localStorage, so a boss fight survives
// a reload. Shape (battle):
//   phase      'setup' | 'battle' | 'victory' | 'defeat'
//   turn       0 | 1 (a player's turn) | 'boss'
//   players    [{ lp, fallen, sealed }]  (fallen can be revived, sealed can't)
//   boss       { lp, max, stage }        stage 1 Toon World, 2 Millennium Eye, 3 Final Read
//   guardians  [{ uid, kind: 'toon'|'bunny', toon, atk, hits: [player], squashed }]
//   restrict   { atk, locked: player|null } | null
//   omen       what Pegasus will do on his next turn (shown to the players)
//   steps      Pegasus' turn, resolved one step at a time
const COOP_STORAGE_KEY = 'ygo_coop';
const COOP_WINS_KEY = 'ygo_coop_wins';

const newCoop = (difficulty = 'duelist') => ({ phase: 'setup', difficulty });

function loadCoop() {
  try {
    const saved = JSON.parse(localStorage.getItem(COOP_STORAGE_KEY));
    return saved && saved.phase ? saved : newCoop();
  } catch {
    return newCoop();
  }
}

let coop = loadCoop();

function saveCoop() {
  try {
    localStorage.setItem(COOP_STORAGE_KEY, JSON.stringify(coop));
  } catch {}
}

// Visual effects need the new DOM, so they run right after the render.
const coopFxQueue = [];
const queueCoopFx = fn => coopFxQueue.push(fn);

function commitCoop() {
  if (coop.phase === 'battle') {
    if (coop.players.every(isCoopDown)) coopDefeat();
    else normalizeCoopTurn();
  }
  saveCoop();
  render();
  coopUi.freshUid = null;
  coopFxQueue.splice(0).forEach(fn => {
    try { fn(); } catch {}
  });
}

function getCoopWins() {
  try {
    return JSON.parse(localStorage.getItem(COOP_WINS_KEY)) || {};
  } catch {
    return {};
  }
}

function recordCoopWin() {
  const wins = getCoopWins();
  const key = `${coop.encounter}:${coop.difficulty}`;
  wins[key] = (wins[key] || 0) + 1;
  try {
    localStorage.setItem(COOP_WINS_KEY, JSON.stringify(wins));
  } catch {}
}

// --- Small helpers ----------------------------------------------------------------

const isCoopDown = p => p.fallen || p.sealed;
const coopAlive = () => [0, 1].filter(i => !isCoopDown(coop.players[i]));
const coopDiff = () => COOP_DIFFICULTIES[coop.difficulty] || COOP_DIFFICULTIES.duelist;
const coopName = i => `Player ${i + 1}`;
const coopToons = () => coop.guardians.filter(g => g.kind === 'toon');
const coopBunny = () => coop.guardians.find(g => g.kind === 'bunny');
const coopGuardianDef = g => (g.kind === 'bunny' ? PEGASUS_BUNNY : PEGASUS_TOONS[g.toon]);
const coopBossMult = () => (coop.players.some(isCoopDown) ? COOP_FALLEN_MULT : 1);
// null | 'hands' | 'total' for the current stage (see COOP_SILENCE_TEXT).
const coopSilence = (stage = coop.boss.stage) => coopDiff().silence?.[stage - 1] || null;
const isCoopSilent = () => !!coopSilence();
const coopPick = list => list[Math.floor(Math.random() * list.length)];
const coopStep = () => coop.steps[coop.stepIndex];

function coopLpTarget(mode) {
  const alive = coopAlive();
  if (!alive.length) return null;
  if (mode === 'random') return coopPick(alive);
  const lps = alive.map(i => coop.players[i].lp);
  const best = mode === 'lowest' ? Math.min(...lps) : Math.max(...lps);
  return coopPick(alive.filter(i => coop.players[i].lp === best));
}

function makeCoopGuardian(kind, toon) {
  const def = kind === 'bunny' ? PEGASUS_BUNNY : PEGASUS_TOONS[toon];
  const uid = coop.nextUid++;
  coopUi.freshUid = uid;
  return { uid, kind, toon: toon || null, atk: def.atk, hits: [], squashed: false };
}

function gainCoopBond(amount) {
  const before = Math.floor(coop.bond);
  coop.bond = Math.min(COOP_BOND_MAX, coop.bond + amount * coopDiff().bondRate);
  if (Math.floor(coop.bond) > before) {
    playSound({ name: 'co-bond' });
    queueCoopFx(fxCoopBond);
  }
}

function spendCoopBond(cost) {
  if (coop.bond < cost) return false;
  coop.bond -= cost;
  return true;
}

// --- Setup ------------------------------------------------------------------------

function createCoopBattle(difficulty) {
  const d = COOP_DIFFICULTIES[difficulty] || COOP_DIFFICULTIES.duelist;
  coop = {
    phase: 'battle',
    encounter: 'pegasus',
    difficulty,
    round: 1,
    turn: 0,
    players: [0, 1].map(() => ({ lp: COOP_PLAYER_LP, fallen: false, sealed: false })),
    bond: d.bond,
    boss: { lp: d.bossLp, max: d.bossLp, stage: 1 },
    pages: PEGASUS.pages,
    guardians: [],
    nextUid: 1,
    restrict: null,
    restrictCooldown: 0,
    eye: { open: false, until: 0 },
    negateUsed: false,
    contrib: [false, false],
    cheat: false,
    shuffle: false,
    extraToon: false,
    bossTurnAfterScene: false,
    countdown: null,
    foresight: false,
    fate: null,
    nextFate: null,
    steps: [],
    stepIndex: 0,
    cutscene: 'intro',
    stats: { damage: 0 }
  };
  coop.guardians.push(makeCoopGuardian('toon', 'mermaid'));
  coop.nextFate = drawCoopFate();
  coop.omen = buildCoopOmen();
}

// --- Damage -----------------------------------------------------------------------

function hurtCoopPlayer(i, amount) {
  const p = coop.players[i];
  if (!p || isCoopDown(p) || amount <= 0) return;
  p.lp = Math.max(0, p.lp - amount);
  playSound({ name: 'co-hurt' });
  queueCoopFx(() => fxCoopPlayerHit(i, amount));
  if (p.lp === 0) {
    p.fallen = true;
    queueCoopFx(() => fxCoopFallen(i));
  }
}

function healCoopPlayer(i, amount) {
  const p = coop.players[i];
  if (!p || isCoopDown(p) || amount <= 0) return;
  p.lp += amount;
  playSound({ name: 'co-heal' });
  queueCoopFx(() => fxCoopPlayerHeal(i, amount));
}

// Returns the damage dealt (0 while Funny Bunny protects Pegasus).
function damageCoopBoss(amount) {
  if (amount <= 0 || coopBunny() || coop.boss.stage === 1) return 0;
  const dealt = Math.min(coop.boss.lp, Math.round(amount));
  coop.boss.lp -= dealt;
  coop.stats.damage += dealt;
  playSound({ name: 'co-hit' });
  queueCoopFx(() => fxCoopBossHit(dealt));
  if (coop.boss.lp <= 0) coopVictory();
  else if (coop.boss.stage === 2 && coop.boss.lp <= coop.boss.max * PEGASUS.finalReadAt) enterCoopStage(3);
  return dealt;
}

function coopVictory() {
  coop.phase = 'victory';
  coop.turn = null;
  recordCoopWin();
  // Pegasus' victory cutscene plays the fanfare when it ends.
  if (prefersReducedMotion()) playSound({ name: 'co-victory' });
  else queueCoopFx(() => playPegasusScene('victory'));
}

function coopDefeat() {
  coop.phase = 'defeat';
  coop.turn = null;
  playSound({ name: 'co-defeat' });
}

// --- Stages -----------------------------------------------------------------------

function enterCoopStage(stage) {
  coop.boss.stage = stage;
  coop.cutscene = `stage${stage}`;
  if (stage === 2) {
    coop.pages = 0;
    coop.guardians = coop.guardians.filter(g => g.kind !== 'toon');
    coop.restrictCooldown = 0;
  }
  if (stage === 3) {
    if (coop.restrict) releaseCoopRestrict();
    coop.countdown = coopDiff().sealRounds;
    // Pegasus strikes first: the players' turns are over and his turn starts
    // when the cutscene is dismissed.
    if (typeof coop.turn === 'number') coop.bossTurnAfterScene = true;
  }
  // During Pegasus' turn the omen is rebuilt when his turn ends.
  if (coop.turn !== 'boss') coop.omen = buildCoopOmen();
  // The stage cutscene has its own soundtrack ('pg-scene-stage*').
  if (prefersReducedMotion()) playSound({ name: 'co-stage' });
  queueCoopFx(() => fxCoopStage(stage));
}

function ripCoopPage() {
  coop.pages = Math.max(0, coop.pages - 1);
  playSound({ name: 'co-page' });
  queueCoopFx(fxCoopPage);
  if (coop.pages === 0) {
    playSound({ name: 'co-book' });
    enterCoopStage(2);
    return { tone: 'good', text: '📖 The last page is torn out! Toon World collapses: every Toon vanishes, and each player keeps only 1 monster.' };
  }
  return { tone: 'good', text: `📖 RIIIP! ${coop.pages} page${coop.pages === 1 ? '' : 's'} left.` };
}

function releaseCoopRestrict() {
  const locked = coop.restrict?.locked;
  coop.restrict = null;
  coop.restrictCooldown = PEGASUS.restrictCooldown;
  coop.eye.open = false;
  return locked;
}

// Restrict is destroyed by the players: the absorbed monster comes back.
function destroyCoopRestrict() {
  const locked = releaseCoopRestrict();
  playSound({ name: 'co-destroy' });
  queueCoopFx(() => fxCoopBurst('[data-coop-field]', 'quest'));
  if (locked === null || locked === undefined) return 'Thousand-Eyes Restrict is destroyed!';
  gainCoopBond(2);
  return `Thousand-Eyes Restrict is destroyed! ${coopName(locked)}'s monster returns to their field. +2 Bond`;
}

// One hit squashes a Toon; it's destroyed only when both players hit it in
// the same round (or when the partner is down).
function hitCoopGuardian(i, g) {
  const def = coopGuardianDef(g);
  const remove = () => { coop.guardians = coop.guardians.filter(x => x.uid !== g.uid); };
  if (g.kind === 'bunny') {
    remove();
    playSound({ name: 'co-destroy' });
    queueCoopFx(() => fxCoopBurst('[data-coop-field]', 'heal'));
    return { tone: 'good', text: '🐰 Funny Bunny is destroyed! Pegasus can be hurt again.' };
  }
  const already = g.hits.includes(i);
  if (!already) g.hits.push(i);
  const partnerDown = isCoopDown(coop.players[1 - i]);
  if (g.hits.length >= 2 || partnerDown) {
    remove();
    playSound({ name: 'co-destroy' });
    queueCoopFx(() => fxCoopBurst('[data-coop-field]', 'quest'));
    if (g.hits.length >= 2) {
      gainCoopBond(1);
      return { tone: 'good', text: `💥 ${def.name} is destroyed! Teamwork! +1 Bond` };
    }
    return { tone: 'good', text: `💥 ${def.name} is destroyed!` };
  }
  g.squashed = true;
  playSound({ name: 'co-squash' });
  queueCoopFx(() => fxCoopSquash(g.uid));
  if (already) return { tone: 'meh', text: `💫 ${def.short} is already squashed. ${coopName(1 - i)} must hit it this round!` };
  return { tone: 'meh', text: `💫 SQUASH! ${def.short} is flattened, but it pops back up unless ${coopName(1 - i)} hits it this round too!` };
}

// --- Omens (Pegasus' next move, visible to the players) ---------------------------

function buildCoopOmen() {
  const stage = coop.boss.stage;
  if (stage === 1) {
    const free = Object.keys(PEGASUS_TOONS).filter(id => !coopToons().some(g => g.toon === id));
    const room = PEGASUS.maxToons - coopToons().length;
    const count = Math.max(0, Math.min(room, free.length, coop.extraToon ? 2 : 1));
    coop.extraToon = false;
    return {
      stage,
      summons: shuffled(free).slice(0, count),
      rewrite: coop.pages < PEGASUS.pages && Math.random() < 0.25
    };
  }
  const mindRead = !coop.shuffle;
  coop.shuffle = false;
  if (stage === 2) {
    const action = coop.restrict ? 'restrict-attack' : coop.restrictCooldown <= 0 ? 'restrict-summon' : 'glare';
    return { stage, action, mindRead };
  }
  const bluffs = shuffled(Object.keys(PEGASUS_BLUFFS)).slice(0, 2);
  return { stage, bluffs, real: coopPick(bluffs), mindRead };
}

function coopRestrictTarget() {
  const alive = coopAlive();
  const free = alive.filter(i => i !== coop.restrict?.locked);
  return free.length ? coopPick(free) : alive[0] ?? null;
}

// Lines shown in each player's "Pegasus' next move" box.
function describeCoopOmen() {
  const o = coop.omen;
  const lines = [];
  if (!o) return lines;
  if (o.stage === 1) {
    coopToons().forEach(g => {
      const def = coopGuardianDef(g);
      lines.push(g.squashed
        ? { icon: '💫', text: `${def.short} is squashed and skips its attack` }
        : { icon: def.icon, text: `${def.short} attacks directly (${g.atk}): ${def.rule}` });
    });
    o.summons.forEach(id => lines.push({ icon: '✨', text: `Summons ${PEGASUS_TOONS[id].name}` }));
    if (o.rewrite) lines.push({ icon: '📖', text: 'Restores a Toon World page' });
  } else if (o.stage === 2) {
    if (o.action === 'restrict-summon') lines.push({ icon: '🔒', text: 'Thousand-Eyes Restrict absorbs the strongest monster of whoever has the most monsters' });
    if (o.action === 'restrict-attack') lines.push({ icon: '🔒', text: coop.restrict ? `Restrict (${coop.restrict.atk}) attacks the strongest monster of ${coop.restrict.locked === null ? 'a random player' : coopName(1 - coop.restrict.locked)}` : 'Restrict is gone… Pegasus sulks' });
    if (o.action === 'glare') lines.push({ icon: '👁️', text: `Millennium Glare: ${PEGASUS.glare} to the highest LP` });
  } else {
    lines.push({ icon: '🎭', text: 'One of these is a bluff:' });
    o.bluffs.forEach(id => lines.push({ icon: PEGASUS_BLUFFS[id].icon, text: PEGASUS_BLUFFS[id].text }));
    lines.push({ icon: '⏳', text: `Soul Seal in ${coop.countdown} turn${coop.countdown === 1 ? '' : 's'}` });
  }
  if (o.stage >= 2) lines.push(o.mindRead ? { icon: '🧠', text: 'Mind Read on a random player' } : { icon: '🔀', text: 'Mind Read will fail (Mind Shuffle)' });
  if (coop.cheat) lines.push({ icon: '🃏', text: `Cheating: his next attack gets +${PEGASUS.cheatBonus}` });
  if (!lines.length) lines.push({ icon: '🎩', text: 'Pegasus is plotting something…' });
  return lines;
}

// --- Turns ------------------------------------------------------------------------

// Skips the turn of a player who is down.
function normalizeCoopTurn() {
  if (typeof coop.turn !== 'number' || !isCoopDown(coop.players[coop.turn])) return;
  if (coop.turn === 0 && !isCoopDown(coop.players[1])) coop.turn = 1;
  else startCoopBossTurn();
}

function startCoopBossTurn() {
  coop.turn = 'boss';
  coop.steps = buildCoopSteps();
  coop.stepIndex = 0;
  prepareCoopStep();
}

function buildCoopSteps() {
  const o = coop.omen || {};
  const steps = [];
  const stage = coop.boss.stage;
  if (stage === 1) {
    // Toons summoned this turn attack from the next turn on.
    coopToons().forEach(g => steps.push({ type: 'toon', uid: g.uid }));
    (o.summons || []).forEach(toon => steps.push({ type: 'summon', toon }));
    if (o.rewrite) steps.push({ type: 'rewrite' });
  } else if (stage === 2) {
    steps.push({ type: o.action || 'glare' });
    if (o.mindRead !== false) steps.push({ type: 'mind-read' });
  } else {
    steps.push({ type: 'bluff', bluff: o.real || 'glare' });
    if (o.mindRead !== false) steps.push({ type: 'mind-read' });
    steps.push({ type: 'seal' });
  }
  steps.push({ type: 'fate' });
  return steps;
}

function coopAttackDamage(base) {
  let dmg = base;
  if (coop.cheat && dmg > 0) {
    dmg += PEGASUS.cheatBonus;
    coop.cheat = false;
  }
  return Math.round(dmg * coopBossMult());
}

// Fills in the current step when it comes up. Steps that no longer apply are
// skipped; when all are done Pegasus' turn ends.
function prepareCoopStep() {
  while (coop.phase === 'battle') {
    const step = coopStep();
    if (!step) {
      endCoopBossTurn();
      return;
    }
    if (step.ready) return;
    if (prepareCoopStepType(step) === false) {
      coop.stepIndex++;
      continue;
    }
    step.ready = true;
    return;
  }
}

function prepareCoopStepType(step) {
  const stage = coop.boss.stage;
  switch (step.type) {
    case 'toon': {
      const g = coop.guardians.find(x => x.uid === step.uid);
      if (!g || g.squashed || stage !== 1) return false;
      const def = coopGuardianDef(g);
      let targets;
      let dmg;
      if (def.target === 'both') {
        targets = coopAlive();
        dmg = coopAttackDamage(def.each);
      } else {
        const target = coopLpTarget(def.target);
        if (target === null) return false;
        targets = [target];
        if (def.barrels) {
          step.flips = Array.from({ length: def.barrels }, () => Math.random() < 0.5);
          dmg = coopAttackDamage(step.flips.filter(Boolean).length * 1000);
        } else {
          dmg = coopAttackDamage(g.atk);
        }
      }
      Object.assign(step, { kind: 'attack', icon: def.icon, title: `${def.name} attacks!`, targets, dmg, negatable: true, stealBond: def.stealBond || 0 });
      playSound({ name: def.barrels ? 'co-barrel' : 'co-toon' });
      return true;
    }
    case 'summon': {
      if (stage !== 1 || coopToons().length >= PEGASUS.maxToons || coopToons().some(g => g.toon === step.toon)) return false;
      const def = PEGASUS_TOONS[step.toon];
      coop.guardians.push(makeCoopGuardian('toon', step.toon));
      Object.assign(step, { kind: 'info', icon: def.icon, title: `Pegasus summons ${def.name}!`, text: `ATK ${def.atk}. Attacks directly: ${def.rule}.` });
      playSound({ name: 'co-summon' });
      return true;
    }
    case 'rewrite': {
      if (stage !== 1 || coop.pages >= PEGASUS.pages) return false;
      coop.pages++;
      Object.assign(step, { kind: 'info', icon: '📖', title: 'Toon World rewrites itself!', text: `A torn page grows back. ${coop.pages}/${PEGASUS.pages} pages.` });
      playSound({ name: 'co-laugh' });
      return true;
    }
    case 'restrict-summon': {
      if (stage !== 2 || coop.restrict) return false;
      Object.assign(step, { kind: 'restrict', sub: 'who', icon: '🔒', title: 'Thousand-Eyes Restrict appears!', text: 'It absorbs the strongest monster of the player with the most monsters.' });
      playSound({ name: 'co-restrict' });
      return true;
    }
    case 'restrict-attack': {
      if (stage !== 2 || !coop.restrict) return false;
      const target = coopRestrictTarget();
      if (target === null) return false;
      Object.assign(step, { kind: 'battle', icon: '🔒', title: 'Thousand-Eyes Restrict attacks!', target, atk: coopAttackDamage(coop.restrict.atk), text: `It attacks ${coopName(target)}'s strongest monster.` });
      playSound({ name: 'co-restrict' });
      return true;
    }
    case 'glare': {
      const target = coopLpTarget('highest');
      if (target === null) return false;
      Object.assign(step, { kind: 'attack', icon: '👁️', title: 'Millennium Glare!', targets: [target], dmg: coopAttackDamage(PEGASUS.glare), negatable: false, note: "It's not an attack, so it can't be negated." });
      playSound({ name: 'co-eye' });
      return true;
    }
    case 'bluff': {
      const fake = (coop.omen?.bluffs || []).find(id => id !== step.bluff);
      const note = fake ? `"${PEGASUS_BLUFFS[fake].text.split(':')[0]}" was a bluff!` : '';
      if (step.bluff === 'crush') {
        const target = coopLpTarget('random');
        if (target === null) return false;
        Object.assign(step, { kind: 'info', icon: '🧠', title: 'Mind Crush!', text: `${coopName(target)}: discard 2 random cards from your hand.`, note });
        playSound({ name: 'co-eye' });
        return true;
      }
      const both = step.bluff === 'barrage';
      const targets = both ? coopAlive() : [coopLpTarget('highest')];
      if (!targets.length || targets[0] === null) return false;
      Object.assign(step, {
        kind: 'attack',
        icon: PEGASUS_BLUFFS[step.bluff].icon,
        title: both ? 'Illusion Barrage!' : 'Millennium Glare!',
        targets,
        dmg: coopAttackDamage(both ? PEGASUS.barrage : PEGASUS.finalGlare),
        negatable: false,
        note
      });
      playSound({ name: 'co-eye' });
      return true;
    }
    case 'mind-read': {
      const target = coopLpTarget('random');
      if (target === null) return false;
      const partner = 1 - target;
      const canProtect = !isCoopDown(coop.players[partner]) && coop.bond >= COOP_BOND_COSTS.protect;
      Object.assign(step, { kind: 'mind-read', target, cardType: coopPick(['MONSTER', 'SPELL', 'TRAP']), sub: canProtect ? 'protect' : 'answer', icon: '🧠', title: 'Mind Read!' });
      playSound({ name: 'co-eye' });
      return true;
    }
    case 'seal': {
      coop.countdown = Math.max(0, (coop.countdown ?? coopDiff().sealRounds) - 1);
      if (coop.countdown > 0) {
        Object.assign(step, { kind: 'info', icon: '⏳', title: 'The Soul Seal ticks…', text: `In ${coop.countdown} turn${coop.countdown === 1 ? '' : 's'}, the player with the lower LP is sealed in a card.` });
        playSound({ name: 'co-tick' });
        return true;
      }
      const victim = coopLpTarget('lowest');
      if (victim === null) return false;
      coop.players[victim].sealed = true;
      coop.countdown = coopDiff().sealRounds;
      Object.assign(step, { kind: 'info', icon: '🃏', title: `${coopName(victim)}'s soul is sealed!`, text: 'Pegasus slips the card into his pocket. Sealed players cannot be revived. The countdown starts again…' });
      playSound({ name: 'co-seal' });
      queueCoopFx(() => fxCoopFallen(victim));
      return true;
    }
    case 'fate': {
      const fate = PEGASUS_FATES.find(f => f.id === coop.nextFate) || PEGASUS_FATES[PEGASUS_FATES.length - 1];
      coop.fate = fate.id;
      applyCoopFate(fate.id);
      coop.nextFate = drawCoopFate();
      coop.foresight = false;
      Object.assign(step, { kind: 'info', fate: true, icon: fate.icon, title: fate.name, text: fate.text });
      playSound({ name: 'co-fate' });
      return true;
    }
  }
  return false;
}

function drawCoopFate() {
  const options = PEGASUS_FATES.filter(f => f.id !== coop.fate && (!f.when || f.when(coop)));
  return coopPick(options.length ? options : PEGASUS_FATES).id;
}

function applyCoopFate(id) {
  switch (id) {
    case 'bunny':
      if (!coopBunny()) coop.guardians.push(makeCoopGuardian('bunny'));
      break;
    case 'dark-rabbit':
      if (coop.players.every(p => !isCoopDown(p))) {
        const [a, b] = coop.players;
        [a.lp, b.lp] = [b.lp, a.lp];
      }
      break;
    case 'cheat':
      coop.cheat = true;
      break;
    case 'banquet':
      coop.boss.lp = Math.min(coop.boss.max, coop.boss.lp + PEGASUS.banquetHeal);
      break;
    case 'kaiba':
      gainCoopBond(2);
      break;
    case 'rewrite':
      if (coop.boss.stage === 1) coop.pages = Math.min(PEGASUS.pages, coop.pages + 1);
      break;
    case 'contents':
      coop.extraToon = true;
      break;
    case 'shuffle':
      coop.shuffle = true;
      break;
  }
}

function endCoopBossTurn() {
  if (coop.contrib.every(Boolean)) gainCoopBond(1);
  coop.guardians.forEach(g => {
    g.hits = [];
    g.squashed = false;
  });
  coop.negateUsed = false;
  coop.contrib = [false, false];
  if (coop.eye.open && coop.eye.until <= coop.round) coop.eye.open = false;
  if (!coop.restrict && coop.restrictCooldown > 0) coop.restrictCooldown--;
  coop.round++;
  coop.steps = [];
  coop.stepIndex = 0;
  coop.omen = buildCoopOmen();
  coop.turn = coopAlive()[0] ?? 0;
}
