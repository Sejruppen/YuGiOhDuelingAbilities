// Solo mode actions ("Duelist's Road"), called from the solo view.
const SOLO_TOAST_MS = 6000;
const SOLO_CONFIRM_MS = 3000;
const SOLO_MAX_INPUT = 6;
const SOLO_UNDO_MAX = 20;

// Transient UI state (not saved).
const soloUi = {
  preview: null,
  legend: false,
  panel: null,
  input: '',
  blockPos: 'atk',
  toast: null,
  confirmAbandon: false,
  // Snapshots of `solo` taken before each fight action, for Undo.
  undo: [],
  mapFocus: null,
  shownStep: null,
  relicInfo: null,
  timers: {}
};

function soloLater(key, fn, ms) {
  clearTimeout(soloUi.timers[key]);
  soloUi.timers[key] = setTimeout(fn, ms);
}

const soloRerender = () => {
  if (state.screen === SCREENS.SOLO) render();
};

function closeSoloPanels() {
  Object.assign(soloUi, { preview: null, legend: false, panel: null, input: '', relicInfo: null });
}

// --- Navigation and the run -------------------------------------------------------

function goToSolo() {
  resetPeek();
  soloUi.mapFocus = null;
  setState({ screen: SCREENS.SOLO });
}

function leaveSolo() {
  closeSoloPanels();
  setState({ screen: SCREENS.START });
}

function startSoloRun() {
  createSoloRun();
  closeSoloPanels();
  Object.assign(soloUi, { undo: [], toast: null, mapFocus: null, confirmAbandon: false });
  playSound({ name: 'co-start' });
  commitSolo();
}

// Abandoning a run needs a second tap.
function abandonSoloClick() {
  if (!soloUi.confirmAbandon) {
    soloUi.confirmAbandon = true;
    soloLater('abandon', () => {
      soloUi.confirmAbandon = false;
      soloRerender();
    }, SOLO_CONFIRM_MS);
    return render();
  }
  clearTimeout(soloUi.timers.abandon);
  soloUi.confirmAbandon = false;
  closeSoloPanels();
  soloUi.undo = [];
  solo = newSolo();
  commitSolo();
}

function soloBackToStartScreen() {
  solo = newSolo();
  soloUi.undo = [];
  saveSolo();
  leaveSolo();
}

// --- Map ----------------------------------------------------------------------------

function tapSoloNode(id) {
  soloUi.preview = soloUi.preview === id ? null : id;
  soloUi.legend = false;
  render();
}

function goSoloNode() {
  const id = soloUi.preview;
  closeSoloPanels();
  soloUi.undo = [];
  soloUi.toast = null;
  if (enterSoloNode(id)) commitSolo();
  else render();
}

function closeSoloPreview() {
  soloUi.preview = null;
  render();
}

function toggleSoloLegend() {
  soloUi.legend = !soloUi.legend;
  soloUi.preview = null;
  render();
}

// --- Campfire, treasure and events --------------------------------------------------

function soloRestClick() {
  if (solo.nodeResult) return;
  const healed = soloRest();
  solo.nodeResult = healed
    ? `🔥 You rest by the fire and recover ${healed} LP.`
    : '🔥 You rest by the fire. Your LP is already full.';
  commitSolo();
}

function leaveSoloNode() {
  soloBackToMap();
  commitSolo();
}

function pickSoloEventChoice(i) {
  if (chooseSoloEvent(i)) commitSolo();
}

function soloAmbushClick() {
  closeSoloPanels();
  soloUi.undo = [];
  soloUi.toast = null;
  if (startSoloAmbush()) commitSolo();
}

function soloContinueReward() {
  soloUi.undo = [];
  soloBackToMap();
  commitSolo();
}

// --- Relics -------------------------------------------------------------------------

function pickSoloRelic(id) {
  if (!takeSoloRelic(id)) return;
  const r = SOLO_RELICS[id];
  if (solo.phase === 'node') solo.nodeResult = `<span class="ce-emoji">${r.icon}</span> You take the ${r.name}!`;
  if (solo.phase === 'reward') solo.reward.relic = id;
  commitSolo();
}

function showSoloRelic(id) {
  soloUi.relicInfo = soloUi.relicInfo === id ? null : id;
  soloUi.preview = null;
  soloUi.legend = false;
  render();
}

function closeSoloRelic() {
  soloUi.relicInfo = null;
  render();
}

function useSoloRedMedicine() {
  soloUi.relicInfo = null;
  if (solo.phase === 'fight') return soloAct(soloRedMedicine);
  soloRedMedicine();
  commitSolo();
}

function confirmSoloRaigeki() {
  soloAct(soloRaigeki);
}

function toggleSoloAxe() {
  if (!soloUi.panel) return;
  soloUi.panel.axe = !soloUi.panel.axe;
  render();
}

function soloRelicDefendClick(id) {
  soloSnapshot();
  soloRelicDefend(id);
  commitSolo();
}

// --- Fight: undo, keypad and panels -------------------------------------------------

function soloSnapshot() {
  soloUi.undo.push(JSON.stringify(solo));
  if (soloUi.undo.length > SOLO_UNDO_MAX) soloUi.undo.shift();
}

function undoSolo() {
  const snap = soloUi.undo.pop();
  if (!snap) return;
  solo = JSON.parse(snap);
  closeSoloPanels();
  soloUi.toast = null;
  playSound({ name: 'co-bounce' });
  commitSolo();
}

function startSoloDuel() {
  if (!solo.fight) return;
  beginSoloDuel();
  commitSolo();
}

function soloKey(k) {
  const v = soloUi.input;
  if (k === 'back') soloUi.input = v.slice(0, -1);
  else if (v === '0') soloUi.input = k === '00' ? '0' : k;
  else if (k === '00' && !v) soloUi.input = '0';
  else if (v.length < SOLO_MAX_INPUT) soloUi.input = (v + k).slice(0, SOLO_MAX_INPUT);
  render();
}

const soloInputValue = () => parseInt(soloUi.input, 10) || 0;

function openSoloPanel(type) {
  soloUi.panel = { type };
  soloUi.input = '';
  render();
}

function setSoloPanel(patch) {
  soloUi.panel = soloUi.panel ? { ...soloUi.panel, ...patch } : null;
  soloUi.input = '';
  render();
}

function closeSoloPanel() {
  soloUi.panel = null;
  soloUi.input = '';
  render();
}

function showSoloToast(result) {
  if (!result) return;
  soloUi.toast = result;
  soloLater('toast', () => {
    soloUi.toast = null;
    soloRerender();
  }, SOLO_TOAST_MS);
}

// Every fight action: snapshot for Undo, act, close the panel, show the result.
function soloAct(fn) {
  soloSnapshot();
  const result = fn();
  soloUi.panel = null;
  soloUi.input = '';
  showSoloToast(result);
  commitSolo();
}

// --- Fight: your turn ---------------------------------------------------------------

function confirmSoloAttack() {
  const f = solo.fight;
  const target = soloUi.panel?.target;
  if (!target || !soloUi.input || f?.battleOver) return;
  const atk = soloInputValue();
  // Axe of Despair (switched on) and Legendary Sword (first attack each turn).
  // Shadow Games: Joey's pep talk (+500 every attack), a full stomach (−500 once).
  const axe = !!soloUi.panel.axe && soloRelicReady('axe');
  const sword = soloHas('legendary-sword') && f.swordRound !== f.round;
  const pep = f.pep || 0;
  const lunch = f.lunch ? SOLO_EVENT_MODS.lunch.value : 0;
  const bonus = (axe ? SOLO_RELICS.axe.value : 0) + (sword ? SOLO_RELICS['legendary-sword'].value : 0) + pep - lunch;
  const total = Math.max(0, atk + bonus);
  soloAct(() => {
    const result = soloPlayerAttack(target === 'direct' ? null : Number(target), total);
    // A negated attack keeps the relics for the next try.
    if (!result || result.negated) return result;
    if (axe) useSoloRelic('axe');
    if (sword) {
      f.swordRound = f.round;
      flashSoloRelic('legendary-sword');
    }
    if (lunch) f.lunch = false;
    const tags = [axe && `🪓 +${SOLO_RELICS.axe.value}`, sword && `🗡️ +${SOLO_RELICS['legendary-sword'].value}`, pep && `💪 +${pep}`, lunch && `🍙 −${lunch}`].filter(Boolean);
    if (tags.length) result.text = `${tags.join(' ')} → ${total} ATK. ${result.text}`;
    return result;
  });
}

function confirmSoloDestroy(uid) {
  const m = soloMonster(uid);
  if (!m) return;
  soloAct(() => {
    removeSoloMonster(uid);
    return { tone: 'good', text: `💥 ${m.name} is destroyed.` };
  });
}

function confirmSoloDestroyTrap() {
  if (!solo.fight?.trap) return;
  soloAct(() => {
    solo.fight.trap = false;
    playSound({ name: 'co-destroy' });
    return { tone: 'good', text: `🌪️ The face-down card is destroyed. It was ${SOLO_TRAP.name}!` };
  });
}

function confirmSoloBurn() {
  if (!soloUi.input) return;
  const amount = soloInputValue();
  soloAct(() => ({ tone: 'good', text: `🔥 ${solo.fight.name} takes ${damageSoloEnemy(amount)}.` }));
}

function confirmSoloLp(sign) {
  if (!soloUi.input) return;
  const amount = soloInputValue();
  soloAct(() => {
    if (sign < 0) {
      hurtSoloPlayer(amount);
      return { tone: 'bad', text: `💔 You pay ${amount} LP.` };
    }
    const healed = healSoloPlayer(amount);
    return { tone: 'good', text: healed ? `💚 You gain ${healed} LP.` : '💚 Your LP is already full.' };
  });
}

function endSoloTurnClick() {
  if (solo.fight?.turn !== 'player') return;
  soloSnapshot();
  closeSoloPanels();
  soloUi.toast = null;
  startSoloEnemyTurn();
  commitSolo();
}

// --- Fight: the enemy's turn --------------------------------------------------------

function soloContinueStep() {
  soloSnapshot();
  advanceSoloStep();
  commitSolo();
}

function soloTakeHitClick() {
  soloSnapshot();
  soloTakeHit();
  commitSolo();
}

function soloRexAgainClick(empty) {
  soloSnapshot();
  soloRexAgain(empty);
  commitSolo();
}

function startSoloBlock() {
  const step = soloStep();
  if (!step) return;
  step.sub = 'block';
  soloUi.input = '';
  soloUi.blockPos = 'atk';
  commitSolo();
}

function cancelSoloBlock() {
  const step = soloStep();
  if (step) step.sub = null;
  soloUi.input = '';
  commitSolo();
}

function setSoloBlockPos(pos) {
  soloUi.blockPos = pos;
  render();
}

function confirmSoloBlock() {
  if (!soloUi.input) return;
  const value = soloInputValue();
  soloSnapshot();
  soloBlock(value, soloUi.blockPos);
  soloUi.input = '';
  commitSolo();
}

// --- Back button --------------------------------------------------------------------

function backInSolo() {
  if (soloUi.relicInfo) return closeSoloRelic();
  if (soloUi.preview || soloUi.legend) {
    closeSoloPanels();
    return render();
  }
  if (solo.phase === 'fight' && solo.fight) {
    if (soloUi.panel) {
      const p = soloUi.panel;
      soloUi.panel = p.target ? { ...p, target: null } : p.kind ? { ...p, kind: null } : null;
      soloUi.input = '';
      return render();
    }
    if (soloStep()?.sub === 'block') return cancelSoloBlock();
  }
  leaveSolo();
}

// --- Effects (run right after the render, see commitSolo) ---------------------------

function fxSoloHit(selector, delta) {
  const el = document.querySelector(selector);
  if (!el) return;
  if (delta < 0) {
    restartClass(el, 'coop-shake', 500);
    spawnFloatText(el, `${delta}`, 'damage');
    spawnParticles(el, { type: 'comeback', mode: 'spark', count: 10 });
  } else {
    spawnFloatText(el, `+${delta}`, 'heal');
    spawnParticles(el, { type: 'heal', mode: 'rise', count: 12 });
  }
}

function fxSoloRelic(id) {
  const el = document.querySelector(`[data-solo-relic="${id}"]`);
  if (!el) return;
  restartClass(el, 'solo-relic--flash', 900);
  spawnParticles(el, { type: 'skill', mode: 'spark', count: 8 });
}
