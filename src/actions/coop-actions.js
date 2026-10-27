// Co-op Boss actions. Index `i` is always the player doing the action:
// 0 = Player 1 (bottom of the screen), 1 = Player 2 (top, rotated).
const COOP_TOAST_MS = 6000;
const COOP_SIGNAL_MS = 5000;
const COOP_CONFIRM_MS = 3000;
const COOP_MAX_INPUT = 6;

const COOP_SIGNALS = {
  attack: { icon: '⚔️', text: "I'll attack" },
  defend: { icon: '🛡️', text: "I'll defend" },
  help: { icon: '🆘', text: 'I need help' },
  hold: { icon: '✋', text: 'Hold!' }
};

// Transient UI state (not saved).
const coopUi = {
  panel: [null, null],
  input: ['', ''],
  blockPos: 'atk',
  toast: [null, null],
  signal: [null, null],
  confirmQuit: false,
  confirmCatch: [false, false],
  freshUid: null,
  scene: null,
  timers: {}
};

function coopLater(key, fn, ms) {
  clearTimeout(coopUi.timers[key]);
  coopUi.timers[key] = setTimeout(fn, ms);
}

const coopRerender = () => {
  if (state.screen === SCREENS.COOP) render();
};

// --- Navigation and setup ---------------------------------------------------------

function goToCoop() {
  resetPeek();
  setState({ screen: SCREENS.COOP });
}

function leaveCoop() {
  coopUi.panel = [null, null];
  setState({ screen: SCREENS.START });
}

function setCoopDifficulty(difficulty) {
  if (!COOP_DIFFICULTIES[difficulty]) return;
  coop.difficulty = difficulty;
  commitCoop();
}

function startCoopBattle() {
  Object.assign(coopUi, { panel: [null, null], input: ['', ''], toast: [null, null], signal: [null, null], confirmQuit: false, scene: null });
  createCoopBattle(coop.difficulty || 'duelist');
  // The intro cutscene has its own soundtrack ('pg-scene-intro').
  if (prefersReducedMotion()) playSound({ name: 'co-start' });
  commitCoop();
}

function dismissCoopCutscene() {
  coop.cutscene = null;
  coopUi.scene = null;
  commitCoop();
}

// Two taps: "✕" -> "Give up?".
function quitCoopClick() {
  if (!coopUi.confirmQuit) {
    coopUi.confirmQuit = true;
    coopLater('quit', () => { coopUi.confirmQuit = false; coopRerender(); }, COOP_CONFIRM_MS);
    render();
    return;
  }
  coopUi.confirmQuit = false;
  coop = newCoop(coop.difficulty);
  commitCoop();
}

function coopPlayAgain() {
  startCoopBattle();
}

function coopBackToSetup() {
  coop = newCoop(coop.difficulty);
  commitCoop();
}

// --- Reset progress (Settings) ----------------------------------------------------
// First tap arms the button, a second tap within a few seconds wipes the
// trophies (wins per difficulty) and any boss fight still in progress.
const COOP_RESET_CONFIRM_MS = 3000;
let coopResetTimer = null;

const coopWinTotal = () => Object.values(getCoopWins()).reduce((sum, n) => sum + (Number(n) || 0), 0);
const hasCoopProgress = () => coopWinTotal() > 0 || coop.phase !== 'setup';

function renderCoopProgress() {
  const wins = getCoopWins();
  const rows = COOP_ENCOUNTERS.filter(e => !e.locked).map(e => {
    const cells = Object.entries(COOP_DIFFICULTIES).map(([id, diff]) => {
      const n = Number(wins[`${e.id}:${id}`]) || 0;
      return `
        <span class="flex-1 rounded-lg py-1.5 ${n ? 'bg-amber-950/40 border border-amber-500/40' : 'bg-slate-950/60 border border-slate-800'}">
          <span class="block"><span class="ce-emoji">${diff.icon}</span> <span class="font-semibold ${n ? 'text-amber-300' : 'text-slate-300'}">${diff.label}</span></span>
          <span class="block mt-0.5 ${n ? 'text-amber-300 font-bold' : 'text-slate-500'}">${n ? `<span class="ce-emoji">🏆</span> ${n} win${n === 1 ? '' : 's'}` : 'Not beaten'}</span>
        </span>`;
    }).join('');
    return `
      <div class="text-left">
        <p class="font-bold text-slate-200"><span class="ce-emoji">${e.icon}</span> ${e.name} <span class="font-normal text-slate-500">· ${e.title}</span></p>
        <div class="flex gap-1.5 mt-1.5 text-center">${cells}</div>
      </div>`;
  }).join('');

  const encounter = COOP_ENCOUNTERS.find(e => e.id === coop.encounter);
  const diff = COOP_DIFFICULTIES[coop.difficulty];
  const status = { battle: 'Battle in progress', victory: 'Just won (not dismissed)', defeat: 'Just lost (not dismissed)' }[coop.phase];
  const current = status && encounter && diff
    ? `<p class="text-left text-slate-400"><span class="ce-emoji">⚔️</span> ${status}: <b class="text-slate-200">${encounter.name}</b> on <b class="text-slate-200">${diff.label}</b></p>`
    : '';

  return `
    <div class="w-full max-w-xs mt-2 flex flex-col gap-2.5 px-3 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
      ${rows}
      ${current}
    </div>
  `;
}

function renderCoopResetButton() {
  if (!hasCoopProgress()) return renderCoopProgress();
  const armed = !!coopResetTimer;
  return `
    ${renderCoopProgress()}
    <button type="button" onclick="resetCoopProgress()" class="w-full max-w-xs mt-2 py-2 px-4 rounded-xl text-xs font-bold transition border ${armed
      ? 'bg-rose-600 border-rose-500 text-white'
      : 'bg-slate-900/80 border-slate-800 text-rose-400 hover:bg-slate-800'}">
      ${armed ? 'Tap again to reset co-op progress' : '<span class="ce-emoji">🗑️</span> Reset co-op progress'}
    </button>
  `;
}

function resetCoopProgress() {
  if (!coopResetTimer) {
    coopResetTimer = setTimeout(() => {
      coopResetTimer = null;
      render();
    }, COOP_RESET_CONFIRM_MS);
    render();
    return;
  }
  clearTimeout(coopResetTimer);
  coopResetTimer = null;
  try {
    localStorage.removeItem(COOP_WINS_KEY);
  } catch {}
  coop = newCoop(coop.difficulty);
  saveCoop();
  render();
  showEggPill('<span class="ce-emoji">👁️</span> Co-op progress reset');
  playSound({ name: 'theme-locked' });
}

// --- Toasts and signals -----------------------------------------------------------

function showCoopToast(i, result) {
  if (!result) return;
  coopUi.toast[i] = result;
  coopLater(`toast${i}`, () => { coopUi.toast[i] = null; coopRerender(); }, COOP_TOAST_MS);
}

function sendCoopSignal(i, id) {
  if (!COOP_SIGNALS[id]) return;
  coopUi.signal[i] = id;
  playSound({ name: 'co-signal' });
  coopLater(`signal${i}`, () => { coopUi.signal[i] = null; coopRerender(); }, COOP_SIGNAL_MS);
  render();
}

// Player `i` caught their partner talking about their hand.
function catchCoopPartner(i) {
  const partner = 1 - i;
  if (isCoopDown(coop.players[partner])) return;
  if (!coopUi.confirmCatch[i]) {
    coopUi.confirmCatch[i] = true;
    coopLater(`catch${i}`, () => { coopUi.confirmCatch[i] = false; coopRerender(); }, COOP_CONFIRM_MS);
    render();
    return;
  }
  coopUi.confirmCatch[i] = false;
  playSound({ name: 'co-caught' });
  hurtCoopPlayer(partner, COOP_CATCH_PENALTY);
  showCoopToast(partner, { tone: 'bad', text: `🙊 Caught talking! The Millennium Eye takes ${COOP_CATCH_PENALTY} LP.` });
  commitCoop();
}

// --- Panels (attack / effect / LP / bond) ----------------------------------------

function openCoopPanel(i, type) {
  if (coop.turn === 'boss') return;
  coopUi.panel[i] = { type };
  coopUi.input[i] = '';
  coopUi.toast[i] = null;
  render();
}

function closeCoopPanel(i) {
  coopUi.panel[i] = null;
  coopUi.input[i] = '';
  render();
}

function setCoopPanel(i, patch) {
  coopUi.panel[i] = { ...coopUi.panel[i], ...patch };
  coopUi.input[i] = '';
  render();
}

function coopKey(i, key) {
  let value = coopUi.input[i];
  if (key === 'back') value = value.slice(0, -1);
  else if (key === 'clear') value = '';
  else value = (value + key).replace(/^0+/, '').slice(0, COOP_MAX_INPUT);
  coopUi.input[i] = value;
  playSound({ name: 'tap' });
  render();
}

const coopInputValue = i => parseInt(coopUi.input[i], 10) || 0;

function finishCoopPanel(i, result) {
  coopUi.panel[i] = null;
  coopUi.input[i] = '';
  showCoopToast(i, result);
  commitCoop();
}

// Targets for an attack, with the reason when they can't be attacked.
function getCoopAttackTargets() {
  const targets = coop.guardians.map(g => {
    const def = coopGuardianDef(g);
    return { key: `g:${g.uid}`, icon: def.icon, label: def.name, sub: `ATK ${g.atk}${g.squashed ? ' · 💫 squashed' : ''}` };
  });
  if (coop.boss.stage === 1) {
    targets.push({ key: 'book', icon: '📖', label: 'Toon World', sub: `${coop.pages} pages · needs ${PEGASUS.pageMinAtk}+ ATK` });
  }
  if (coop.restrict) {
    targets.push({
      key: 'restrict',
      icon: '🔒',
      label: 'Thousand-Eyes Restrict',
      sub: `ATK ${coop.restrict.atk}`,
      disabled: !coop.eye.open,
      reason: 'Its eye is closed. Activate a Trap to open it.'
    });
  }
  const blocked = coop.boss.stage === 1 ? 'Toon World protects him' : coop.restrict ? 'Restrict guards him' : coop.guardians.length ? 'Clear his monsters first' : '';
  targets.push({ key: 'boss', icon: '👁️', label: 'Pegasus (direct attack)', sub: `${coop.boss.lp} LP`, disabled: !!blocked, reason: blocked });
  return targets;
}

function chooseCoopAttackTarget(i, key) {
  const target = getCoopAttackTargets().find(t => t.key === key);
  if (!target || target.disabled) return;
  setCoopPanel(i, { target: key });
}

function confirmCoopAttack(i) {
  const panel = coopUi.panel[i];
  const atk = coopInputValue(i);
  if (!panel?.target || coop.turn !== i || coop.restrict?.locked === i) return;
  coop.contrib[i] = true;
  finishCoopPanel(i, resolveCoopAttack(i, panel.target, atk));
}

function resolveCoopAttack(i, key, atk) {
  if (key === 'book') {
    if (coop.boss.stage !== 1) return null;
    if (coopBunny()) return { tone: 'bad', text: '🐰 Funny Bunny hugs the book. No damage!' };
    if (atk < PEGASUS.pageMinAtk) {
      playSound({ name: 'co-bounce' });
      return { tone: 'meh', text: `📖 BOING! The book bounces your monster. You need ${PEGASUS.pageMinAtk}+ ATK.` };
    }
    return ripCoopPage();
  }

  if (key === 'restrict') {
    const r = coop.restrict;
    if (!r || !coop.eye.open) return null;
    if (atk < r.atk) {
      playSound({ name: 'co-bounce' });
      hurtCoopPlayer(i, r.atk - atk);
      return { tone: 'bad', text: `Restrict crushes your monster. You take ${r.atk - atk}.` };
    }
    const text = destroyCoopRestrict();
    if (atk === r.atk) return { tone: 'good', text: `Both monsters are destroyed. ${text}` };
    const dealt = damageCoopBoss(atk - r.atk);
    return { tone: 'good', text: `${text} Pegasus takes ${dealt}.` };
  }

  if (key === 'boss') {
    if (coop.boss.stage === 1 || coop.restrict || coop.guardians.length) return null;
    const dealt = damageCoopBoss(atk);
    return { tone: 'good', text: dealt ? `⚔️ Direct hit! Pegasus takes ${dealt}.` : 'Pegasus shrugs it off.' };
  }

  const g = coop.guardians.find(x => `g:${x.uid}` === key);
  if (!g) return null;
  if (atk < g.atk) {
    playSound({ name: 'co-bounce' });
    hurtCoopPlayer(i, g.atk - atk);
    return { tone: 'bad', text: `${coopGuardianDef(g).short} wins the battle. Your monster is destroyed and you take ${g.atk - atk}.` };
  }
  const result = hitCoopGuardian(i, g);
  if (atk === g.atk) result.text += ' (Equal ATK: your monster is destroyed too.)';
  return result;
}

// Effects can be used on anyone's turn.
function chooseCoopEffect(i, kind) {
  if (kind === 'destroy-spell') {
    if (coop.boss.stage !== 1) return finishCoopPanel(i, { tone: 'meh', text: "There are no Spells or Traps on Pegasus' field." });
    if (coopBunny()) return finishCoopPanel(i, { tone: 'bad', text: '🐰 Funny Bunny hugs the book. No damage!' });
    coop.contrib[i] = true;
    return finishCoopPanel(i, ripCoopPage());
  }
  if (kind === 'trap') {
    if (!coop.restrict) return finishCoopPanel(i, { tone: 'meh', text: "🪤 Your Trap springs! (When Restrict is on the field, a Trap opens its eye.)" });
    coop.eye.open = true;
    coop.eye.until = coop.round;
    playSound({ name: 'co-eye-open' });
    return finishCoopPanel(i, { tone: 'good', text: '👁️ Restrict\'s eye snaps open! It can be attacked for the rest of this round.' });
  }
  setCoopPanel(i, { kind });
}

function getCoopEffectTargets() {
  const targets = coop.guardians.map(g => {
    const def = coopGuardianDef(g);
    return { key: `g:${g.uid}`, icon: def.icon, label: def.name, sub: g.kind === 'toon' ? 'Toon logic: counts as one hit' : 'Destroyed' };
  });
  if (coop.restrict) {
    targets.push({ key: 'restrict', icon: '🔒', label: 'Thousand-Eyes Restrict', sub: 'Destroyed', disabled: !coop.eye.open, reason: 'Its eye is closed. Activate a Trap first.' });
  }
  return targets;
}

function confirmCoopDestroy(i, key) {
  const target = getCoopEffectTargets().find(t => t.key === key);
  if (!target || target.disabled) return;
  coop.contrib[i] = true;
  if (key === 'restrict') return finishCoopPanel(i, { tone: 'good', text: destroyCoopRestrict() });
  const g = coop.guardians.find(x => `g:${x.uid}` === key);
  finishCoopPanel(i, g ? hitCoopGuardian(i, g) : null);
}

function confirmCoopBurn(i) {
  const amount = coopInputValue(i);
  if (!amount) return;
  if (coop.boss.stage === 1) return finishCoopPanel(i, { tone: 'meh', text: '📖 Toon World soaks up the blast. Tear out its pages first!' });
  if (coopBunny()) return finishCoopPanel(i, { tone: 'bad', text: '🐰 Funny Bunny giggles. Pegasus takes no damage!' });
  coop.contrib[i] = true;
  const dealt = damageCoopBoss(Math.floor(amount / 2));
  finishCoopPanel(i, { tone: 'good', text: `🔥 Burn! Pegasus takes ${dealt} (burn deals half).` });
}

function confirmCoopLp(i, sign) {
  const amount = coopInputValue(i);
  if (!amount) return;
  if (sign < 0) hurtCoopPlayer(i, amount);
  else healCoopPlayer(i, amount);
  finishCoopPanel(i, null);
}

function useCoopForesight(i) {
  if (coop.foresight || !spendCoopBond(COOP_BOND_COSTS.foresight)) return;
  coop.foresight = true;
  playSound({ name: 'co-bond' });
  const fate = PEGASUS_FATES.find(f => f.id === coop.nextFate);
  finishCoopPanel(i, { tone: 'good', text: `🔮 Next Fate: ${fate.icon} ${fate.name}. ${fate.text}` });
}

function useCoopRevive(i, target) {
  const p = coop.players[target];
  if (!p?.fallen || p.sealed || !spendCoopBond(COOP_BOND_COSTS.revive)) return;
  p.fallen = false;
  p.lp = COOP_REVIVE_LP;
  playSound({ name: 'co-revive' });
  queueCoopFx(() => fxCoopPlayerHeal(target, COOP_REVIVE_LP));
  finishCoopPanel(i, { tone: 'good', text: `✨ ${coopName(target)} returns from the Shadow Realm with ${COOP_REVIVE_LP} LP!` });
}

function endCoopTurn(i) {
  if (coop.turn !== i) return;
  coopUi.panel = [null, null];
  if (i === 0 && !isCoopDown(coop.players[1])) coop.turn = 1;
  else startCoopBossTurn();
  playSound({ name: coop.turn === 'boss' ? 'co-boss-turn' : 'co-turn' });
  commitCoop();
}

// --- Pegasus' turn ----------------------------------------------------------------

function advanceCoopStep() {
  if (coop.turn !== 'boss') return;
  coop.stepIndex++;
  coopUi.input = ['', ''];
  coopUi.blockPos = 'atk';
  prepareCoopStep();
  commitCoop();
}

function finishCoopStep(result) {
  const step = coopStep();
  if (!step) return;
  step.sub = 'done';
  step.result = result;
  commitCoop();
}

function takeCoopHit() {
  const step = coopStep();
  if (step?.kind !== 'attack') return;
  step.targets.forEach(t => hurtCoopPlayer(t, step.dmg));
  if (step.stealBond) coop.bond = Math.max(0, coop.bond - step.stealBond);
  advanceCoopStep();
}

function negateCoopStep() {
  const step = coopStep();
  if (coop.negateUsed || !step || (step.kind === 'attack' && !step.negatable)) return;
  coop.negateUsed = true;
  playSound({ name: 'co-negate' });
  if (step.kind === 'battle' && coop.restrict) {
    coop.eye.open = true;
    coop.eye.until = coop.round + 1;
    return finishCoopStep({ tone: 'good', text: "🪤 Attack negated! Your Trap forces Restrict's eye open. It can be attacked next round." });
  }
  advanceCoopStep();
}

// Partner `i` jumps in front of the attack.
function shieldCoopStep(i) {
  const step = coopStep();
  if (!step || isCoopDown(coop.players[i]) || !spendCoopBond(COOP_BOND_COSTS.shield)) return;
  const dmg = step.kind === 'battle' ? step.atk : step.dmg;
  playSound({ name: 'co-shield' });
  hurtCoopPlayer(i, dmg);
  if (step.stealBond) coop.bond = Math.max(0, coop.bond - step.stealBond);
  finishCoopStep({ tone: 'good', text: `🛡️ ${coopName(i)} takes the hit for their partner!` });
}

function coopNoMonsters() {
  const step = coopStep();
  if (step?.kind !== 'battle') return;
  hurtCoopPlayer(step.target, step.atk);
  advanceCoopStep();
}

function startCoopBlock() {
  const step = coopStep();
  if (step?.kind !== 'battle') return;
  step.sub = 'block';
  coopUi.input[step.target] = '';
  coopUi.blockPos = 'atk';
  commitCoop();
}

function setCoopBlockPos(pos) {
  coopUi.blockPos = pos;
  render();
}

function cancelCoopBlock() {
  const step = coopStep();
  if (step?.kind !== 'battle') return;
  step.sub = null;
  commitCoop();
}

function confirmCoopBlock() {
  const step = coopStep();
  if (step?.kind !== 'battle' || !coop.restrict) return;
  const value = coopInputValue(step.target);
  const r = step.atk;
  const who = step.target;
  let result;
  if (coopUi.blockPos === 'atk') {
    if (value < r) {
      hurtCoopPlayer(who, r - value);
      result = { tone: 'bad', text: `Your monster is destroyed and you take ${r - value}.` };
    } else if (value === r) {
      result = { tone: 'good', text: `Both monsters are destroyed! ${destroyCoopRestrict()}` };
    } else {
      const text = destroyCoopRestrict();
      const dealt = damageCoopBoss(value - r);
      result = { tone: 'good', text: `What a block! ${text} Pegasus takes ${dealt}.` };
    }
  } else if (value < r) {
    playSound({ name: 'co-destroy' });
    result = { tone: 'meh', text: 'Your defending monster is destroyed, but you take no damage.' };
  } else if (value === r) {
    result = { tone: 'good', text: 'Your monster holds the line. Nothing is destroyed.' };
  } else {
    const dealt = damageCoopBoss(value - r);
    result = { tone: 'good', text: `Restrict bounces off your wall! Pegasus takes ${dealt}.` };
  }
  finishCoopStep(result);
}

function chooseCoopRestrictOwner(i) {
  const step = coopStep();
  if (step?.kind !== 'restrict') return;
  if (i === null) return absorbCoopRestrict(null, 0);
  step.sub = 'atk';
  step.player = i;
  coopUi.input[i] = '';
  commitCoop();
}

function absorbCoopRestrict(i, atk) {
  const step = coopStep();
  if (step?.kind !== 'restrict') return;
  const locked = i === null || !atk ? null : i;
  coop.restrict = { atk: Math.max(PEGASUS.restrictMin, (locked === null ? 0 : atk) + PEGASUS.restrictBonus), locked };
  coop.eye.open = false;
  playSound({ name: 'co-restrict' });
  finishCoopStep(locked === null
    ? { tone: 'meh', text: `Nothing to absorb… Restrict appears anyway with ${coop.restrict.atk} ATK.` }
    : { tone: 'bad', text: `${coopName(locked)}: put your strongest monster beside your field. Restrict has ${coop.restrict.atk} ATK and you can't attack until it's destroyed!` });
}

function confirmCoopAbsorb() {
  const step = coopStep();
  if (step?.kind !== 'restrict' || step.player === undefined) return;
  absorbCoopRestrict(step.player, coopInputValue(step.player));
}

function protectCoopMind(yes) {
  const step = coopStep();
  if (step?.kind !== 'mind-read') return;
  if (yes && spendCoopBond(COOP_BOND_COSTS.protect)) {
    playSound({ name: 'co-shield' });
    return finishCoopStep({ tone: 'good', text: `🛡️ ${coopName(1 - step.target)} shields their partner's mind. Pegasus sees only fog!` });
  }
  step.sub = 'answer';
  commitCoop();
}

function answerCoopMind(has) {
  const step = coopStep();
  if (step?.kind !== 'mind-read') return;
  const type = step.cardType.toLowerCase();
  playSound({ name: has ? 'co-laugh' : 'co-bounce' });
  finishCoopStep(has
    ? { tone: 'bad', text: `"I knew it!" ${coopName(step.target)}: discard a ${type} card from your hand.` }
    : { tone: 'good', text: `"Hmm… no ${type}s?" Pegasus' read was wrong. Nothing happens.` });
}
