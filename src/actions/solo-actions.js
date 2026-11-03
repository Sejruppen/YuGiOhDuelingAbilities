// Solo mode actions ("Duelist's Road"), called from the solo view.
const SOLO_TOAST_MS = 6000;
const SOLO_TURN_BANNER_MS = 1900;
const SOLO_TURN_BANNER_NOTE_MS = 450;
const SOLO_CONFIRM_MS = 3000;
const SOLO_MAX_INPUT = 6;
const SOLO_UNDO_MAX = 20;
const SOLO_NAME_MAX = 24;

// Transient UI state (not saved).
const soloUi = {
  // 'menu' | 'how' (rules + Set sail) | 'history' | null (the run itself).
  view: 'menu',
  confirmNew: false,
  runName: '',
  // The difficulty picked for the next run (see SOLO_DIFFICULTIES).
  difficulty: SOLO_DEFAULT_DIFFICULTY,
  openHistoryId: null,
  preview: null,
  legend: false,
  panel: null,
  input: '',
  // The input already has the +30% field bonus added (used as-is, no implied "00").
  inputBoosted: false,
  blockPos: 'atk',
  toast: null,
  confirmAbandon: false,
  // Snapshots of `solo` taken before each fight action, for Undo.
  undo: [],
  mapFocus: null,
  // The map's last scroll position, so the parallax mist doesn't jump on a re-render.
  mapScroll: 0,
  shownStep: null,
  relicInfo: null,
  // The enemy card whose detail sheet is open (a monster uid, 'trap', 'book' or 'eq:<equip uid>').
  cardInfo: null,
  // Which zone each enemy monster sits in, so cards don't slide over (see soloFieldLayout).
  field: null,
  // The next field render skips the summon/destroy animations (after Undo).
  fieldQuiet: false,
  // The campfire's "Polish a relic" list is open.
  polishing: false,
  // A read-only look at the map from a node or reward screen, and the node tapped in it.
  peek: false,
  peekNode: null,
  // Which peek sheet slides up on this render ('map' | 'node'), so re-renders don't replay it.
  peekSlide: null,
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
  Object.assign(soloUi, { preview: null, legend: false, panel: null, input: '', relicInfo: null, cardInfo: null, polishing: false, peek: false, peekNode: null });
}

// --- Navigation and the run -------------------------------------------------------

function goToSolo() {
  resetPeek();
  soloUi.mapFocus = null;
  soloUi.view = 'menu';
  setState({ screen: SCREENS.SOLO });
}

function leaveSolo() {
  closeSoloPanels();
  soloUi.view = 'menu';
  setState({ screen: SCREENS.START });
}

// --- Menu ---------------------------------------------------------------------------

function showSoloMenu() {
  closeSoloPanels();
  soloUi.view = 'menu';
  render();
}

function continueSoloRun() {
  if (!isSoloRunActive()) return;
  soloUi.view = null;
  soloUi.mapFocus = null;
  render();
}

// Two taps when it would throw away a run in progress.
function newSoloRunClick() {
  if (isSoloRunActive() && !soloUi.confirmNew) {
    soloUi.confirmNew = true;
    soloLater('new', () => {
      soloUi.confirmNew = false;
      soloRerender();
    }, SOLO_CONFIRM_MS);
    return render();
  }
  clearTimeout(soloUi.timers.new);
  soloUi.confirmNew = false;
  if (isSoloRunActive()) {
    soloArchiveRun('abandoned');
    solo = newSolo();
    soloUi.undo = [];
    saveSolo();
  }
  soloUi.view = 'how';
  render();
}

function openSoloHistory() {
  soloUi.view = 'history';
  soloUi.openHistoryId = null;
  render();
}

function toggleSoloHistoryEntry(id) {
  soloUi.openHistoryId = soloUi.openHistoryId === id ? null : id;
  render();
}

// Settings: first tap arms the button, a second tap within a few seconds wipes the history.
let soloHistoryResetTimer = null;

function renderSoloHistoryResetButton() {
  const n = soloHistory.length;
  if (!n) return '<p class="w-full max-w-xs mt-2 text-xs text-slate-500">No finished runs yet.</p>';
  const armed = !!soloHistoryResetTimer;
  return `
    <p class="w-full max-w-xs mt-2 text-xs text-slate-400"><span class="ce-emoji">📜</span> ${n} run${n === 1 ? '' : 's'} in the history</p>
    <button type="button" onclick="resetSoloHistory()" class="w-full max-w-xs mt-2 py-2 px-4 rounded-xl text-xs font-bold transition border ${armed
      ? 'bg-rose-600 border-rose-500 text-white'
      : 'bg-slate-900/80 border-slate-800 text-rose-400 hover:bg-slate-800'}">
      ${armed ? 'Tap again to reset Solo history' : '<span class="ce-emoji">🗑️</span> Reset Solo history'}
    </button>
  `;
}

function resetSoloHistory() {
  if (!soloHistoryResetTimer) {
    soloHistoryResetTimer = setTimeout(() => {
      soloHistoryResetTimer = null;
      render();
    }, SOLO_CONFIRM_MS);
    render();
    return;
  }
  clearTimeout(soloHistoryResetTimer);
  soloHistoryResetTimer = null;
  clearSoloHistory();
  soloUi.openHistoryId = null;
  render();
  showEggPill('<span class="ce-emoji">📜</span> Solo history reset');
  playSound({ name: 'theme-locked' });
}

// --- The run ------------------------------------------------------------------------

function startSoloRun() {
  createSoloRun();
  soloUi.runName = '';
  closeSoloPanels();
  Object.assign(soloUi, { view: null, undo: [], toast: null, mapFocus: null, confirmAbandon: false, field: null });
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
  soloArchiveRun('abandoned');
  solo = newSolo();
  soloUi.view = 'menu';
  commitSolo();
}

// From the end screen: the run is already in the history.
function soloBackToMenu() {
  solo = newSolo();
  soloUi.undo = [];
  saveSolo();
  showSoloMenu();
}

// --- Map ----------------------------------------------------------------------------

function tapSoloNode(id) {
  soloUi.preview = soloUi.preview === id ? null : id;
  soloUi.legend = false;
  render();
}

// Peek at the map from a Shadow Game, treasure, campfire or relic reward. Read-only: you can't travel from it.
const soloCanPeek = () => !!solo.map && ['node', 'reward'].includes(solo.phase);

function openSoloPeek() {
  if (!soloCanPeek()) return;
  Object.assign(soloUi, { peek: true, peekNode: null, relicInfo: null, peekSlide: 'map' });
  render();
  soloUi.peekSlide = null;
  const box = document.querySelector('[data-solo-peek-scroll]');
  const here = box?.querySelector('[data-solo-peek-focus]');
  if (here) box.scrollTop += here.getBoundingClientRect().top - box.getBoundingClientRect().top - box.clientHeight / 2;
}

function closeSoloPeek() {
  soloUi.peek = false;
  soloUi.peekNode = null;
  render();
}

function tapSoloPeekNode(id) {
  if (!soloUi.peekNode) soloUi.peekSlide = 'node';
  soloUi.peekNode = soloUi.peekNode === id ? null : id;
  render();
  soloUi.peekSlide = null;
}

function closeSoloPeekNode() {
  soloUi.peekNode = null;
  render();
}

// Parallax: the mist over the map moves at 0.6x the scroll speed.
const SOLO_MIST_LAG = 0.4;
const soloMistOffset = () => (FX_LITE || prefersReducedMotion() ? 0 : soloUi.mapScroll * SOLO_MIST_LAG);

function soloMapParallax(el) {
  soloUi.mapScroll = el.scrollTop;
  const mist = el.querySelector('.solo-mist');
  if (mist) mist.style.setProperty('--sm-par', `${soloMistOffset()}px`);
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
    ? `<span class="ce-emoji">🔥</span> You rest by the fire and recover ${healed} LP.`
    : '<span class="ce-emoji">🔥</span> You rest by the fire. Your LP is already full.';
  commitSolo();
}

function soloTrainClick() {
  if (solo.nodeResult) return;
  soloTrain();
  solo.nodeResult = `<span class="ce-emoji">💪</span> Joey drills you with push-ups until sunrise. “Now dat's what I call a duelist!” +${SOLO_CAMPFIRE_TRAIN} max LP.`;
  commitSolo();
}

function openSoloPolish() {
  if (solo.nodeResult || !soloPolishable().length) return;
  soloUi.polishing = true;
  render();
}

function closeSoloPolish() {
  soloUi.polishing = false;
  render();
}

function soloPolishClick(id) {
  if (solo.nodeResult || !polishSoloRelic(id)) return;
  soloUi.polishing = false;
  const r = SOLO_RELICS[id];
  solo.nodeResult = `<span class="ce-emoji">✨</span> You polish the ${r.name} by the fire until it gleams. ${r.polish.text}`;
  commitSolo();
}

function leaveSoloNode() {
  soloBackToMap();
  commitSolo();
}

function pickSoloEventChoice(i) {
  if (chooseSoloEvent(i)) commitSolo();
}

function soloEventRollClick(face) {
  if (soloEventRoll(face)) commitSolo();
}

function soloEventNumberClick(n) {
  if (pickSoloRollNumber(n)) commitSolo();
}

function lockSoloRollClick() {
  if (lockSoloRollNumbers()) commitSolo();
}

function cancelSoloRollClick() {
  if (cancelSoloRoll()) commitSolo();
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
  soloUi.cardInfo = null;
  soloUi.preview = null;
  soloUi.legend = false;
  render();
}

function closeSoloRelic() {
  soloUi.relicInfo = null;
  render();
}

// Tapping an enemy card. While you can attack, it aims the attack keypad at it
// (monsters and Toon World); otherwise it opens the card's detail sheet.
function tapSoloCard(id) {
  const panel = soloUi.panel;
  const target = typeof id === 'number' || id === 'book' ? String(id) : null;
  if (target && soloCanAttackNow() && (!panel || panel.type === 'attack')) {
    soloUi.cardInfo = null;
    soloUi.relicInfo = null;
    if (panel?.target === target) return render();
    soloUi.panel = { type: 'attack', target, axe: !!panel?.axe };
    soloUi.input = '';
    playSound({ name: 'peek' });
    return render();
  }
  soloUi.cardInfo = soloUi.cardInfo === id ? null : id;
  soloUi.relicInfo = null;
  render();
}

function tapSoloDirect() {
  const f = solo.fight;
  if (!soloCanAttackNow() || f.monsters.length || soloToonWorldUp(f)) return;
  soloUi.panel = { type: 'attack', target: 'direct', axe: !!soloUi.panel?.axe };
  soloUi.input = '';
  soloUi.cardInfo = null;
  render();
}

function closeSoloCard() {
  soloUi.cardInfo = null;
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

function toggleSoloNegate() {
  if (!soloUi.panel) return;
  soloUi.panel.negate = !soloUi.panel.negate;
  render();
}

function soloNegateSpellClick() {
  soloSnapshot();
  soloNegateSpell();
  commitSolo();
}

function soloRelicDefendClick(id) {
  soloSnapshot();
  soloRelicDefend(id);
  commitSolo();
}

function soloTrapDefendClick(kind) {
  soloSnapshot();
  soloTrapDefend(kind);
  commitSolo();
}

function soloTrapSummonClick() {
  soloSnapshot();
  soloTrapSummon();
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
  if (isSoloRunActive()) soloUnarchiveRun();
  closeSoloPanels();
  soloUi.toast = null;
  soloUi.fieldQuiet = true;
  playSound({ name: 'co-bounce' });
  commitSolo();
}

function startSoloRpsClick() {
  if (!solo.fight) return;
  startSoloRps();
  commitSolo();
}

function soloRpsClick(choice) {
  if (!solo.fight) return;
  soloRpsThrow(choice);
  commitSolo();
}

// After a tie, throw again.
function soloRpsAgainClick() {
  if (!solo.fight?.intro) return;
  solo.fight.rps = { result: null };
  commitSolo();
}

function startSoloDuel(first) {
  if (!solo.fight) return;
  beginSoloDuel(first);
  commitSolo();
}

function soloKey(k) {
  // Like the LP editor's exact values, a boosted amount is replaced rather than edited.
  const v = soloUi.inputBoosted ? '' : soloUi.input;
  soloUi.inputBoosted = false;
  if (k === 'back') soloUi.input = v.slice(0, -1);
  else if (v === '0') soloUi.input = k === '00' ? '0' : k;
  else if (k === '00' && !v) soloUi.input = '0';
  else if (v.length < SOLO_MAX_INPUT) soloUi.input = (v + k).slice(0, SOLO_MAX_INPUT);
  render();
}

// Same implied "00" as the LP editor ("14" means 1400), but a lone "0" stays 0.
const soloInputHasSuffix = () => !!soloUi.input && !soloUi.inputBoosted && soloUi.input !== '0'
  && soloUi.input.length <= LP_SUFFIX_MAX_DIGITS && !LP_SHORT_INPUTS.includes(soloUi.input);

const soloInputValue = () => (parseInt(soloUi.input, 10) || 0) * (soloInputHasSuffix() ? 100 : 1);

function clearSoloInput() {
  Object.assign(soloUi, { input: '', inputBoosted: false });
  render();
}

// Adds the region's field bonus to the typed ATK, rounded like the enemy's.
function boostSoloInput() {
  if (!soloUi.input || soloUi.inputBoosted) return;
  soloUi.input = String(Math.round(soloInputValue() * (1 + SOLO_FIELD_BONUS)));
  soloUi.inputBoosted = true;
  render();
}

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
  soloUi.cardInfo = null;
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
  const swordAtk = soloRelicValue('legendary-sword');
  const bonus = (axe ? SOLO_RELICS.axe.value : 0) + (sword ? swordAtk : 0) + pep - lunch;
  const total = Math.max(0, atk + bonus);
  soloAct(() => {
    const result = soloPlayerAttack(target === 'direct' ? null : target === 'book' ? 'book' : Number(target), total, !!soloUi.panel?.negate && !!f.trap);
    // A negated attack keeps the relics for the next try.
    if (!result || result.negated) return result;
    if (axe) useSoloRelic('axe');
    if (sword) {
      f.swordRound = f.round;
      flashSoloRelic('legendary-sword');
    }
    if (lunch) f.lunch = false;
    const tags = [axe && `🪓 +${SOLO_RELICS.axe.value}`, sword && `🗡️ +${swordAtk}`, pep && `💪 +${pep}`, lunch && `🍙 −${lunch}`].filter(Boolean);
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
    return { tone: 'good', text: `🌪️ The face-down card is destroyed. It was ${soloCards(solo.fight).trap.name}!` };
  });
}

function confirmSoloDestroyBook() {
  if (!soloToonWorldUp(solo.fight)) return;
  soloAct(() => {
    const result = soloRipPage();
    result.text = `🌪️ Toon World is hit! ${result.text}`;
    return result;
  });
}

// `uid` is the equip card's own uid; its monster loses that card's ATK.
function confirmSoloDestroyEquip(uid) {
  const m = solo.fight?.monsters.find(x => x.equips?.some(e => e.uid === uid));
  if (!m) return;
  soloAct(() => {
    const e = m.equips.find(x => x.uid === uid);
    m.equips = m.equips.filter(x => x.uid !== uid);
    playSound({ name: 'co-destroy' });
    return { tone: 'good', text: `🌪️ ${e.name} is destroyed. ${m.name} loses ${e.atk} ATK.` };
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
  // DEF gets no field bonus, so a boosted ATK doesn't carry over.
  if (soloUi.inputBoosted) Object.assign(soloUi, { input: '', inputBoosted: false });
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

// --- Fight: Pegasus -----------------------------------------------------------------

function dismissSoloCutscene() {
  if (!solo.fight?.cutscene) return;
  solo.fight.cutscene = null;
  commitSolo();
}

function soloCrushClick(had) {
  soloSnapshot();
  soloMindCrush(had);
  commitSolo();
}

function soloAbsorbClick(none) {
  if (!none && !soloUi.input) return;
  soloSnapshot();
  soloAbsorb(none ? 0 : soloInputValue());
  soloUi.input = '';
  commitSolo();
}

// --- Back button --------------------------------------------------------------------

function backInSolo() {
  if (soloUi.view === 'menu') return leaveSolo();
  if (soloUi.view) return showSoloMenu();
  if (soloUi.peek) return soloUi.peekNode ? closeSoloPeekNode() : closeSoloPeek();
  if (soloUi.relicInfo) return closeSoloRelic();
  if (soloCardDetail()) return closeSoloCard();
  soloUi.cardInfo = null;
  if (soloUi.polishing && solo.phase === 'node') return closeSoloPolish();
  if (soloUi.preview || soloUi.legend) {
    closeSoloPanels();
    return render();
  }
  if (solo.phase === 'node' && solo.event?.rolling && !solo.event.result) return cancelSoloRollClick();
  if (solo.phase === 'fight' && solo.fight) {
    if (solo.fight.cutscene) return dismissSoloCutscene();
    if (soloUi.panel) {
      const p = soloUi.panel;
      soloUi.panel = p.type !== 'attack' && p.kind ? { ...p, kind: null } : null;
      soloUi.input = '';
      return render();
    }
    if (soloStep()?.sub === 'block') return cancelSoloBlock();
  }
  showSoloMenu();
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

// A banner sweeps across at the start of every turn. Whoever opens the duel skips the Draw Phase and can't attack.
function fxSoloTurn(who) {
  const f = solo.fight;
  if (!f || solo.phase !== 'fight' || f.intro || f.turn !== who) return;
  const you = who === 'player';
  const opening = you ? f.first === 'player' && f.round === 1 : f.round === 0;
  const draws = opening ? 0 : you ? soloDrawCount() : 1;
  const emoji = e => `<span class="ce-emoji">${e}</span>`;
  const notes = [];
  if (you && draws > 1) notes.push(`${emoji(SOLO_RELICS.sanctity.icon)} Card of Sanctity: +${draws - 1} extra draw`);
  if (you && !opening && soloHas('legendary-sword')) notes.push(`${emoji(SOLO_RELICS['legendary-sword'].icon)} Legendary Sword: first attack +${soloRelicValue('legendary-sword')}`);
  if (you && !opening && f.pep) notes.push(`${emoji('💪')} Pep talk: attacks +${f.pep}`);
  const name = f.plural ? `${f.name}'` : `${f.name}'s`;
  const line = opening
    ? `${emoji('🚫')} No draw · No attack`
    : `${emoji('🃏')} Draw Phase: ${you ? 'draw' : 'they draw'} <b>${draws}</b> card${draws === 1 ? '' : 's'}`;
  if (you && draws > 1) flashSoloRelic('sanctity');
  if (you && draws) playSound({ name: 'solo-draw', draws });
  const ms = SOLO_TURN_BANNER_MS + notes.length * SOLO_TURN_BANNER_NOTE_MS;
  spawnFx('fx-solo-turn', ms, {
    vars: { '--solo-turn-ms': `${ms}ms` },
    html: `<div class="solo-turn-band solo-turn-band--${who}">
      <p class="solo-turn-title">${emoji(you ? '⚔️' : f.icon)} ${you ? 'Your turn' : `${name} turn`}</p>
      <p class="solo-turn-line">${line}</p>
      ${notes.map(n => `<p class="solo-turn-note">${n}</p>`).join('')}
    </div>`
  });
}
