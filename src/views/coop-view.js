// Co-op Boss screen. During a battle the screen is split in three:
// Player 2's half (rotated 180°), Pegasus' board in the middle, Player 1's half.
const COOP_STAGE_LABELS = { 1: 'Toon World', 2: 'Millennium Eye', 3: 'Final Read' };

// Start screen entry, below the Tournament button.
function renderCoopButton() {
  const running = coop.phase === 'battle';
  return `
    <button onclick="if (startEggAllowsClick()) goToCoop()" onpointerdown="startStartEggPress(this, 'friendship')" onpointerup="cancelStartEggPress(this)" onpointerleave="cancelStartEggPress(this)" onpointercancel="cancelStartEggPress(this)" oncontextmenu="return false" class="coop-start-btn cegg-press w-full py-2.5 px-2 rounded-xl border border-indigo-500/50 bg-slate-900/80 hover:bg-slate-800 text-indigo-300 font-bold text-sm leading-tight transition flex flex-col items-center gap-0.5">
      <span class="text-xl leading-none">👁️</span>
      <span>Co-op Boss</span>
      ${running ? '<span class="text-[0.65rem] font-semibold opacity-80">▶ Continue</span>' : ''}
    </button>
  `;
}

function renderCoopView() {
  if (coop.phase === 'battle') return renderCoopBattle();
  if (coop.phase === 'victory' || coop.phase === 'defeat') return renderCoopEnd();
  return renderCoopSetup();
}

function coopBtn(label, onclick, style = '', disabled = false) {
  const styles = {
    primary: 'bg-amber-500 hover:bg-amber-400 text-slate-950',
    danger: 'bg-rose-600 hover:bg-rose-500 text-white',
    '': 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
  };
  return `<button onclick="${onclick}" ${disabled ? 'disabled' : ''} class="flex-1 min-w-[7rem] py-2.5 px-3 rounded-xl font-bold text-sm transition disabled:opacity-40 ${styles[style] ?? styles['']}">${label}</button>`;
}

function coopOption({ icon, label, sub, disabled, reason }, onclick) {
  return `
    <button onclick="${onclick}" ${disabled ? 'disabled' : ''} class="w-full text-left rounded-xl border border-slate-700 bg-slate-900/90 px-3 py-2 flex items-center gap-3 hover:border-amber-500/60 transition disabled:opacity-40">
      <span class="text-2xl leading-none">${icon}</span>
      <span class="flex-1 min-w-0">
        <span class="block font-bold text-white text-sm leading-tight">${label}</span>
        <span class="block text-xs text-slate-400 mt-0.5">${disabled && reason ? reason : sub}</span>
      </span>
    </button>
  `;
}

function renderCoopKeypad(i, label, actionsHtml) {
  const value = coopUi.input[i];
  const keys = ['1', '2', '3', 'back', '4', '5', '6', '00', '7', '8', '9', '0'];
  return `
    <div class="flex items-baseline justify-between gap-2 px-1">
      <p class="text-xs text-slate-400">${label}</p>
      <p class="text-3xl font-black text-white tabular-nums">${value || '<span class="text-slate-600">0</span>'}</p>
    </div>
    <div class="grid grid-cols-4 gap-1.5">
      ${keys.map(k => `<button onclick="coopKey(${i}, '${k}')" class="py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-lg font-bold text-white">${k === 'back' ? '⌫' : k}</button>`).join('')}
    </div>
    <div class="flex flex-wrap gap-2">${actionsHtml}</div>
  `;
}

// --- Setup ------------------------------------------------------------------------

function renderCoopSetup() {
  const wins = getCoopWins();
  const selected = coop.difficulty || 'duelist';
  const d = COOP_DIFFICULTIES[selected];

  const encounters = COOP_ENCOUNTERS.map(e => `
    <div class="rounded-2xl border ${e.locked ? 'border-slate-800 bg-slate-900/50 opacity-50' : 'border-fuchsia-500/60 bg-fuchsia-950/20 coop-encounter--active'} p-3 flex items-center gap-3">
      <span class="text-3xl">${e.locked ? '🔒' : e.icon}</span>
      <span class="flex-1 min-w-0">
        <span class="block font-black text-white leading-tight">${e.name}</span>
        <span class="block text-xs ${e.locked ? 'text-slate-500' : 'text-fuchsia-300'}">${e.title}</span>
        <span class="block text-xs text-slate-400 mt-0.5">${e.blurb}</span>
      </span>
    </div>
  `).join('');

  const difficulties = Object.entries(COOP_DIFFICULTIES).map(([id, diff]) => {
    const active = id === selected;
    const won = wins[`pegasus:${id}`];
    return `
      <button onclick="setCoopDifficulty('${id}')" aria-pressed="${active}" class="relative rounded-xl border px-2 py-3 text-center transition ${active ? 'border-amber-500 bg-amber-950/40' : 'border-slate-700 bg-slate-900/90 hover:border-amber-500/50'}">
        <span class="block text-2xl">${diff.icon}</span>
        <span class="block text-sm font-bold ${active ? 'text-amber-400' : 'text-white'}">${diff.label}</span>
        ${won ? `<span class="absolute top-1 right-1.5 text-[0.65rem] text-amber-300">🏆${won}</span>` : ''}
      </button>
    `;
  }).join('');

  return `
    <header class="px-4 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-900/80 backdrop-blur">
      <button onclick="leaveCoop()" class="text-slate-300 text-base font-medium px-2 py-1 w-16 text-left">← Back</button>
      <h2 class="text-lg font-bold text-white">👁️ Co-op Boss</h2>
      <div class="w-16"></div>
    </header>
    <div class="flex-1 min-h-0 overflow-y-auto p-4 no-scrollbar">
      <p class="text-sm text-slate-300 leading-relaxed mb-5">
        Two duelists, one boss. Lay the phone between your fields: <b class="text-white">Player 1</b> sits at the bottom, <b class="text-white">Player 2</b> at the top.
        Play your own decks, but instead of attacking each other, you attack the phone. Pegasus is <b class="text-amber-400">tough</b>: you will only win together.
      </p>
      <p class="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">Encounter</p>
      <div class="space-y-2 mb-5">${encounters}</div>
      <p class="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">Difficulty</p>
      <div class="grid grid-cols-3 gap-2">${difficulties}</div>
      <p class="text-xs text-slate-400 mt-2 mb-5">${d.desc}</p>
      <p class="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">How it works</p>
      <ul class="text-xs text-slate-300 space-y-1.5 leading-relaxed">
        <li>🔁 A round: Player 1's turn, Player 2's turn, then Pegasus' turn and a random Fate card.</li>
        <li>👁️ Pegasus always shows his next move. Plan around it together!</li>
        <li>⚔️ Attack on the phone: pick a target and enter your monster's ATK. The phone handles the battle.</li>
        <li>✨ Card effects (destroy, burn, Traps) can be used on the phone at any time.</li>
        <li>💀 At 0 LP you fall. Your partner can revive you with Bond, but Pegasus hits 20% harder meanwhile.</li>
      </ul>
    </div>
    <footer class="p-4 border-t border-slate-800 bg-slate-900/80">
      <button onclick="startCoopBattle()" class="w-full py-4 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-98 text-slate-950 font-bold text-lg shadow-lg shadow-amber-500/20 transition">👁️ Face Pegasus</button>
    </footer>
  `;
}

// --- Battle -----------------------------------------------------------------------

function renderCoopBattle() {
  // The step card animates in only when a new step comes up.
  const stepKey = coop.turn === 'boss' ? `${coop.round}:${coop.stepIndex}:${coopStep()?.sub || ''}` : null;
  const freshStep = stepKey !== null && stepKey !== coopUi.shownStep;
  coopUi.shownStep = stepKey;

  return `
    <div class="coop-screen flex-1 min-h-0 flex flex-col">
      <section class="coop-half coop-half--top flex-1 min-h-0 flex flex-col">${renderCoopHalf(1, freshStep)}</section>
      ${renderCoopBoard()}
      <section class="coop-half flex-1 min-h-0 flex flex-col">${renderCoopHalf(0, freshStep)}</section>
    </div>
    ${coop.cutscene ? renderCoopCutscene() : ''}
  `;
}

function renderCoopHalf(i, freshStep) {
  if (coop.turn === 'boss') return renderCoopStepHalf(i, freshStep);
  const panel = coopUi.panel[i];
  return panel ? renderCoopPanel(i, panel) : renderCoopPlayer(i);
}

function renderCoopChips() {
  const chips = [];
  if (coop.boss.stage === 1) {
    const pages = Array.from({ length: PEGASUS.pages }, (_, k) => (k < coop.pages ? '▮' : '▯')).join('');
    chips.push(`<div data-coop-book class="coop-chip rounded-lg border border-amber-500/50 bg-amber-950/40 px-2 py-1 text-xs flex items-center gap-1"><span class="text-base leading-none">📖</span><span class="font-bold text-white">Toon World</span><span class="tracking-widest text-amber-300">${pages}</span></div>`);
  }
  coop.guardians.forEach(g => {
    const def = coopGuardianDef(g);
    const hits = g.hits.length ? `<span class="text-[0.6rem] text-emerald-300">hit: ${g.hits.map(h => `P${h + 1}`).join('+')}</span>` : '';
    chips.push(`
      <div data-coop-g="${g.uid}" class="coop-chip ${g.squashed ? 'coop-chip--squashed' : ''} ${g.uid === coopUi.freshUid ? 'coop-chip--fresh' : ''} rounded-lg border border-fuchsia-500/40 bg-slate-900 px-2 py-1 text-xs flex items-center gap-1">
        <span class="text-base leading-none">${def.icon}</span>
        <span class="font-bold text-white">${def.short}</span>
        <span class="text-amber-300 tabular-nums">${g.atk}</span>
        ${g.squashed ? '<span>💫</span>' : ''}${hits}
      </div>
    `);
  });
  if (coop.restrict) {
    const r = coop.restrict;
    chips.push(`
      <div data-coop-restrict class="coop-chip ${coop.eye.open ? 'coop-chip--eye' : ''} rounded-lg border border-violet-500/60 bg-violet-950/40 px-2 py-1 text-xs flex items-center gap-1">
        <span class="text-base leading-none">🔒</span><span class="font-bold text-white">Restrict</span>
        <span class="text-amber-300 tabular-nums">${r.atk}</span>
        <span>${coop.eye.open ? '👁️ open' : '😑 closed'}</span>
        ${r.locked !== null ? `<span class="text-[0.6rem] text-violet-300">holds P${r.locked + 1}</span>` : ''}
      </div>
    `);
  }
  if (coop.boss.stage === 3) {
    chips.push(`<div class="coop-chip coop-chip--seal rounded-lg border border-rose-500/60 bg-rose-950/40 px-2 py-1 text-xs font-bold text-rose-200">⏳ Soul Seal in ${coop.countdown}</div>`);
  }
  if (!chips.length) chips.push('<span class="text-xs text-slate-400 italic">Pegasus stands alone. Attack him directly!</span>');
  return chips.join('');
}

function renderCoopBoard() {
  const { boss } = coop;
  const pct = Math.max(0, (boss.lp / boss.max) * 100);
  const bond = Math.floor(coop.bond);
  const diamonds = Array.from({ length: COOP_BOND_MAX }, (_, k) => `<span class="${k < bond ? 'text-sky-400' : 'text-slate-700'}">◆</span>`).join('');
  const turnLabel = coop.turn === 'boss' ? "👁️ Pegasus' turn" : typeof coop.turn === 'number' ? `${coopName(coop.turn)}'s turn` : '';
  const fate = coop.foresight && PEGASUS_FATES.find(f => f.id === coop.nextFate);

  return `
    <section class="coop-board coop-board--stage${boss.stage} shrink-0 px-3 py-2 border-y border-fuchsia-500/40 bg-slate-950/90">
      <div class="flex items-center gap-2">
        <button onclick="quitCoopClick()" class="text-xs font-semibold px-2 py-1 rounded-lg ${coopUi.confirmQuit ? 'bg-rose-600 text-white' : 'text-slate-400 bg-slate-800/70'}">${coopUi.confirmQuit ? 'Give up?' : '✕'}</button>
        <div class="flex-1 min-w-0 text-center truncate">
          <span class="coop-boss-eye inline-block">👁️</span>
          <span class="font-black text-white">Pegasus</span>
          <span class="text-[0.65rem] uppercase tracking-widest text-fuchsia-300 ml-1">${COOP_STAGE_LABELS[boss.stage]}</span>
        </div>
        <span class="text-[0.65rem] font-bold text-slate-400">Round ${coop.round}</span>
      </div>
      <div data-coop-boss class="relative mt-1.5 h-5 rounded-full bg-slate-800 overflow-hidden">
        <div class="h-full bg-gradient-to-r from-fuchsia-600 to-amber-500 transition-all duration-500" style="width: ${pct}%"></div>
        ${boss.stage === 2 ? `<div class="absolute top-0 bottom-0 w-0.5 bg-white/70" style="left: ${PEGASUS.finalReadAt * 100}%"></div>` : ''}
        <span class="absolute inset-0 flex items-center justify-center text-xs font-black text-white drop-shadow">${boss.lp} / ${boss.max} LP${boss.stage === 1 ? ' · shielded by Toon World' : ''}${coopBunny() ? ' · 🐰' : ''}</span>
      </div>
      <div data-coop-field class="mt-2 flex flex-wrap justify-center gap-1.5">${renderCoopChips()}</div>
      <div class="mt-1.5 flex items-center justify-between gap-2 text-[0.65rem]">
        <span data-coop-bond class="truncate">${diamonds}<b class="text-sky-300 ml-1">${bond} Bond</b></span>
        <span class="text-slate-400 shrink-0">${turnLabel}</span>
      </div>
      ${fate ? `<p class="text-[0.65rem] text-violet-300 text-center mt-1">🔮 Next Fate: ${fate.icon} ${fate.name}</p>` : ''}
    </section>
  `;
}

function renderCoopPlayer(i) {
  const p = coop.players[i];
  const down = isCoopDown(p);
  const myTurn = coop.turn === i;
  const locked = coop.restrict?.locked === i;
  const silent = isCoopSilent();
  const status = p.sealed ? '🃏 Sealed in a card' : p.fallen ? '💀 In the Shadow Realm' : myTurn ? '⚔️ Your turn' : `⏳ ${coopName(1 - i)}'s turn`;
  const toast = coopUi.toast[i];
  const signal = coopUi.signal[1 - i] && COOP_SIGNALS[coopUi.signal[1 - i]];

  const notices = [];
  if (locked) notices.push("🔒 Restrict holds your strongest monster. You can't attack.");
  if (coop.faceUp === i) notices.push('🙈 Pegasus sees all: play this turn with your hand face-up!');
  if (silent && !down) notices.push('🤫 No talking about your hands. Use the signals.');
  if (p.fallen && !p.sealed) notices.push(`Your partner can revive you for ${COOP_BOND_COSTS.revive} Bond.`);

  const action = (icon, label, onclick, disabled) => `
    <button onclick="${onclick}" ${disabled ? 'disabled' : ''} class="rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 py-2 text-white transition disabled:opacity-35">
      <span class="block text-lg leading-none">${icon}</span><span class="block text-[0.7rem] font-bold mt-0.5">${label}</span>
    </button>
  `;
  const endTurn = myTurn
    ? `<button onclick="endCoopTurn(${i})" class="coop-end-turn rounded-xl bg-amber-500 hover:bg-amber-400 py-2 text-slate-950 transition"><span class="block text-lg leading-none">➜</span><span class="block text-[0.7rem] font-black mt-0.5">End turn</span></button>`
    : action('⏳', 'Waiting', '', true);

  const signals = silent && !down ? `
    <div class="flex gap-1.5">
      ${Object.entries(COOP_SIGNALS).map(([id, s]) => `<button onclick="sendCoopSignal(${i}, '${id}')" aria-label="${s.text}" class="flex-1 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-lg leading-none">${s.icon}</button>`).join('')}
      ${isCoopDown(coop.players[1 - i]) ? '' : `<button onclick="catchCoopPartner(${i})" class="px-2 rounded-lg text-[0.7rem] font-bold ${coopUi.confirmCatch[i] ? 'bg-rose-600 text-white' : 'bg-slate-800 border border-slate-700 text-rose-300'}">${coopUi.confirmCatch[i] ? `-${COOP_CATCH_PENALTY}?` : '🙊 Caught!'}</button>`}
    </div>
  ` : '';

  return `
    <div class="coop-panel ${myTurn ? 'coop-panel--active' : ''} flex-1 min-h-0 overflow-y-auto no-scrollbar p-3 flex flex-col gap-2">
      <div class="flex items-center justify-between gap-2">
        <div class="min-w-0">
          <p class="text-xs font-bold uppercase tracking-widest ${myTurn ? 'text-amber-400' : 'text-slate-400'}">${coopName(i)}</p>
          <p class="text-sm font-semibold text-slate-200 truncate">${status}</p>
        </div>
        <button data-coop-lp="${i}" onclick="openCoopPanel(${i}, 'lp')" ${p.sealed ? 'disabled' : ''} class="text-3xl font-black tabular-nums px-2 ${down ? 'text-slate-600 line-through' : 'text-white'}">${p.lp}</button>
      </div>
      ${toast ? `<div class="coop-toast coop-toast--${toast.tone} rounded-lg px-3 py-2 text-sm leading-snug">${toast.text}</div>` : ''}
      ${signal ? `<div class="coop-signal rounded-lg px-3 py-2 text-sm bg-sky-950/60 border border-sky-500/50 text-sky-100"><span class="text-2xl align-middle mr-1">${signal.icon}</span><b>${coopName(1 - i)}:</b> ${signal.text}</div>` : ''}
      ${notices.map(n => `<p class="text-xs text-amber-200/90 leading-snug">${n}</p>`).join('')}
      <div class="rounded-xl border border-fuchsia-500/30 bg-fuchsia-950/20 px-3 py-2">
        <p class="text-[0.65rem] font-bold uppercase tracking-widest text-fuchsia-300 mb-1">👁️ Pegasus' next move</p>
        ${describeCoopOmen().map(l => `<p class="text-xs text-slate-200 leading-snug"><span class="mr-1">${l.icon}</span>${l.text}</p>`).join('')}
      </div>
      <div class="grid grid-cols-4 gap-1.5 mt-auto">
        ${action('⚔️', 'Attack', `openCoopPanel(${i}, 'attack')`, !myTurn || down || locked)}
        ${action('✨', 'Effect', `openCoopPanel(${i}, 'effect')`, down)}
        ${action('◆', 'Bond', `openCoopPanel(${i}, 'bond')`, p.sealed)}
        ${endTurn}
      </div>
      ${signals}
    </div>
  `;
}

// --- Panels -----------------------------------------------------------------------

function renderCoopPanelShell(i, title, body) {
  return `
    <div class="coop-panel flex-1 min-h-0 overflow-y-auto no-scrollbar p-3 flex flex-col gap-2">
      <div class="flex items-center justify-between gap-2">
        <p class="font-bold text-white">${title}</p>
        <button onclick="closeCoopPanel(${i})" class="text-sm text-slate-400 hover:text-white px-2 py-1">✕ Cancel</button>
      </div>
      ${body}
    </div>
  `;
}

function renderCoopPanel(i, panel) {
  if (panel.type === 'attack') {
    if (!panel.target) {
      return renderCoopPanelShell(i, '⚔️ Attack: choose a target', getCoopAttackTargets().map(t => coopOption(t, `chooseCoopAttackTarget(${i}, '${t.key}')`)).join(''));
    }
    const target = getCoopAttackTargets().find(t => t.key === panel.target);
    return renderCoopPanelShell(i, `⚔️ ${target ? `${target.icon} ${target.label}` : 'Attack'}`, renderCoopKeypad(i, "Your attacking monster's ATK",
      coopBtn('← Back', `setCoopPanel(${i}, { target: null })`) + coopBtn('⚔️ Attack!', `confirmCoopAttack(${i})`, 'primary', !coopUi.input[i])));
  }

  if (panel.type === 'effect') {
    if (!panel.kind) {
      const options = [
        { key: 'destroy-monster', icon: '💥', label: 'Destroy a monster', sub: 'Raigeki, Fissure, Dark Hole…', disabled: !getCoopEffectTargets().length, reason: 'Pegasus has no monsters' },
        { key: 'destroy-spell', icon: '📖', label: 'Destroy a Spell/Trap', sub: coop.boss.stage === 1 ? 'Tears a page out of Toon World' : 'Pegasus has none left', disabled: coop.boss.stage !== 1 },
        { key: 'burn', icon: '🔥', label: 'Burn damage', sub: 'Pegasus takes half' },
        { key: 'trap', icon: '🪤', label: 'Activate a Trap', sub: coop.restrict ? "Opens Restrict's eye" : 'Tap whenever you activate a Trap' }
      ];
      return renderCoopPanelShell(i, '✨ Card effect', options.map(o => coopOption(o, `chooseCoopEffect(${i}, '${o.key}')`)).join(''));
    }
    if (panel.kind === 'destroy-monster') {
      return renderCoopPanelShell(i, '💥 Destroy which monster?', getCoopEffectTargets().map(t => coopOption(t, `confirmCoopDestroy(${i}, '${t.key}')`)).join('') +
        `<div class="flex">${coopBtn('← Back', `setCoopPanel(${i}, { kind: null })`)}</div>`);
    }
    if (panel.kind === 'burn') {
      return renderCoopPanelShell(i, '🔥 Burn damage', renderCoopKeypad(i, 'Damage on the card',
        coopBtn('← Back', `setCoopPanel(${i}, { kind: null })`) + coopBtn('🔥 Burn!', `confirmCoopBurn(${i})`, 'primary', !coopUi.input[i])));
    }
  }

  if (panel.type === 'lp') {
    return renderCoopPanelShell(i, `❤️ ${coopName(i)}'s LP: ${coop.players[i].lp}`, renderCoopKeypad(i, 'Costs, self-damage or healing',
      coopBtn('− Damage', `confirmCoopLp(${i}, -1)`, 'danger', !coopUi.input[i]) + coopBtn('+ Heal', `confirmCoopLp(${i}, 1)`, 'primary', !coopUi.input[i])));
  }

  if (panel.type === 'bond') {
    const bond = Math.floor(coop.bond);
    const options = [
      coopOption({ icon: '🔮', label: `Foresight · ${COOP_BOND_COSTS.foresight} ◆`, sub: 'Reveal the next Fate card', disabled: bond < COOP_BOND_COSTS.foresight || coop.foresight, reason: coop.foresight ? 'Already revealed' : 'Not enough Bond' }, `useCoopForesight(${i})`)
    ];
    coop.players.forEach((p, t) => {
      if (p.fallen && !p.sealed) {
        options.push(coopOption({ icon: '✨', label: `Revive ${coopName(t)} · ${COOP_BOND_COSTS.revive} ◆`, sub: `Back with ${COOP_REVIVE_LP} LP`, disabled: bond < COOP_BOND_COSTS.revive, reason: 'Not enough Bond' }, `useCoopRevive(${i}, ${t})`));
      }
    });
    return renderCoopPanelShell(i, `◆ Bond: ${bond}/${COOP_BOND_MAX}`, `
      ${options.join('')}
      <p class="text-xs text-slate-400 leading-snug">🛡️ <b>Shield</b> (${COOP_BOND_COSTS.shield} ◆) and 🧠 <b>Protect</b> (${COOP_BOND_COSTS.protect} ◆) are offered during Pegasus' turn.</p>
      <p class="text-xs text-slate-400 leading-snug">Earn Bond: finish a Toon your partner hit (+1), free a monster from Restrict (+2), or both hit Pegasus' side in the same round (+1).</p>
    `);
  }

  return renderCoopPlayer(i);
}

// --- Pegasus' turn ----------------------------------------------------------------

function renderCoopStepHalf(i, fresh) {
  const step = coopStep();
  const p = coop.players[i];
  if (!step) return '';
  return `
    <div class="coop-panel coop-panel--boss flex-1 min-h-0 overflow-y-auto no-scrollbar p-3 flex flex-col gap-2">
      <div class="flex items-center justify-between text-xs">
        <span class="font-bold uppercase tracking-widest text-fuchsia-300">👁️ Pegasus' turn · ${coop.stepIndex + 1}/${coop.steps.length}</span>
        <span data-coop-lp="${i}" class="font-bold tabular-nums ${isCoopDown(p) ? 'text-slate-500 line-through' : 'text-white'}">${coopName(i)} · ${p.lp} LP</span>
      </div>
      <div class="flex-1 flex flex-col justify-center gap-2">${renderCoopStepBody(step, i, fresh)}</div>
    </div>
  `;
}

function renderCoopStepBody(step, i, fresh) {
  const down = isCoopDown(coop.players[i]);
  const row = buttons => `<div class="flex flex-wrap gap-2 justify-center">${buttons.join('')}</div>`;
  const text = (t, cls = 'text-slate-200') => (t ? `<p class="text-sm text-center leading-snug ${cls}">${t}</p>` : '');
  const waiting = who => text(`Waiting for ${coopName(who)}…`, 'text-slate-400 italic');
  const title = `
    <div class="text-center ${fresh ? 'coop-step-in' : ''} ${step.fate ? 'coop-fate-card' : ''}">
      ${step.fate ? '<p class="text-[0.65rem] font-bold uppercase tracking-widest text-violet-300">🎴 Fate card</p>' : ''}
      <div class="coop-step-icon text-5xl leading-none">${step.icon}</div>
      <p class="mt-1 text-lg font-black text-white leading-tight">${step.title}</p>
    </div>
  `;
  const cont = coopBtn('Continue ➜', 'advanceCoopStep()', 'primary');

  if (step.sub === 'done') {
    return title + `<div class="coop-toast coop-toast--${step.result?.tone || 'meh'} rounded-lg px-3 py-2 text-sm text-center leading-snug">${step.result?.text || ''}</div>` + row([cont]);
  }

  if (step.kind === 'info') return title + text(step.text) + text(step.note, 'text-xs text-fuchsia-300') + row([cont]);

  if (step.kind === 'attack') {
    const isTarget = step.targets.includes(i);
    const flips = step.flips ? `<p class="text-3xl text-center tracking-widest">${step.flips.map(f => (f ? '💥' : '💨')).join(' ')}</p>` : '';
    if (!step.dmg) return title + flips + text('Every barrel misses! Pegasus pouts.') + row([coopBtn('Phew! Continue ➜', 'takeCoopHit()', 'primary')]);
    const buttons = [];
    if (isTarget) buttons.push(coopBtn(`💔 Take ${step.dmg}`, 'takeCoopHit()', 'danger'));
    if (step.negatable && !coop.negateUsed && !down) buttons.push(coopBtn('🪤 Negate (Trap)', 'negateCoopStep()'));
    if (!isTarget && !down && step.targets.length === 1) {
      buttons.push(coopBtn(`🛡️ Shield · ${COOP_BOND_COSTS.shield} ◆`, `shieldCoopStep(${i})`, '', coop.bond < COOP_BOND_COSTS.shield));
    }
    const who = step.targets.map(t => `${coopName(t)} takes <b class="text-rose-300">${step.dmg}</b>`).join(' · ');
    const notes = [
      step.stealBond ? `It also steals ${step.stealBond} Bond.` : '',
      step.negatable && coop.negateUsed ? 'Your team already negated an attack this round.' : '',
      step.note || ''
    ].filter(Boolean).join(' ');
    return title + flips + text(who) + text(notes, 'text-xs text-fuchsia-300') + (buttons.length ? row(buttons) : waiting(step.targets[0]));
  }

  if (step.kind === 'battle') {
    const isTarget = i === step.target;
    if (step.sub === 'block') {
      if (!isTarget) return title + waiting(step.target);
      const pos = coopUi.blockPos;
      const toggle = ['atk', 'def'].map(p => `<button onclick="setCoopBlockPos('${p}')" class="flex-1 py-1.5 rounded-lg text-xs font-bold ${pos === p ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300'}">${p === 'atk' ? 'Attack position' : 'Defense position'}</button>`).join('');
      return `<p class="text-sm font-bold text-white text-center">🔒 Restrict (${step.atk}) attacks!</p><div class="flex gap-2">${toggle}</div>` +
        renderCoopKeypad(i, `Your monster's ${pos.toUpperCase()}`, coopBtn('← Back', 'cancelCoopBlock()') + coopBtn('🛡️ Block', 'confirmCoopBlock()', 'primary', !coopUi.input[i]));
    }
    const buttons = [];
    if (isTarget) {
      buttons.push(coopBtn('🛡️ Block with a monster', 'startCoopBlock()', 'primary'));
      buttons.push(coopBtn(`💔 No monsters: take ${step.atk}`, 'coopNoMonsters()', 'danger'));
    }
    if (!coop.negateUsed && !down) buttons.push(coopBtn('🪤 Negate (opens the eye)', 'negateCoopStep()'));
    if (!isTarget && !down) buttons.push(coopBtn(`🛡️ Shield · ${COOP_BOND_COSTS.shield} ◆`, `shieldCoopStep(${i})`, '', coop.bond < COOP_BOND_COSTS.shield));
    return title + text(`ATK <b class="text-rose-300">${step.atk}</b>. ${step.text}`) + (buttons.length ? row(buttons) : waiting(step.target));
  }

  if (step.kind === 'restrict') {
    if (step.sub === 'atk') {
      if (i !== step.player) return title + text(`Restrict's eyes lock onto ${coopName(step.player)}'s strongest monster…`, 'text-slate-400 italic');
      return text('Enter the ATK of your strongest monster. It will be absorbed!', 'text-sm text-white font-bold') +
        renderCoopKeypad(i, 'ATK', coopBtn('Nothing to absorb', 'absorbCoopRestrict(null, 0)') + coopBtn('🔒 Absorb', 'confirmCoopAbsorb()', 'primary', !coopUi.input[i]));
    }
    const buttons = [];
    if (!down) buttons.push(coopBtn('🙋 I have the most monsters', `chooseCoopRestrictOwner(${i})`, 'primary'));
    buttons.push(coopBtn('Nobody has monsters', 'chooseCoopRestrictOwner(null)'));
    return title + text(step.text) + text('If it\'s a tie, pick whoever has the strongest monster.', 'text-xs text-slate-400') + row(buttons);
  }

  if (step.kind === 'mind-read') {
    const partner = 1 - step.target;
    if (step.sub === 'protect') {
      if (i === step.target) return title + text(`Pegasus stares into your mind… ${coopName(partner)} decides whether to protect you.`, 'text-slate-300 italic');
      return title + text(`Pegasus is reading ${coopName(step.target)}'s mind! Protect them?`) +
        row([coopBtn(`🛡️ Protect · ${COOP_BOND_COSTS.protect} ◆`, 'protectCoopMind(true)', 'primary', coop.bond < COOP_BOND_COSTS.protect), coopBtn('Let it be', 'protectCoopMind(false)')]);
    }
    if (i !== step.target) return title + text(`"I see… a ${step.cardType} card in ${coopName(step.target)}'s hand!"`, 'text-fuchsia-200 italic') + waiting(step.target);
    return title + text(`"I see… a <b>${step.cardType}</b> card in your hand!" Do you have one?`, 'text-fuchsia-100') +
      row([coopBtn('😱 Yes, I do', 'answerCoopMind(true)', 'danger'), coopBtn('😏 No!', 'answerCoopMind(false)', 'primary')]);
  }

  return title + row([cont]);
}

// --- Cutscenes and the end screen ---------------------------------------------------

function renderCoopCutscene() {
  const c = PEGASUS_CUTSCENES[coop.cutscene];
  if (!c) return '';
  const half = top => `
    <div class="${top ? 'coop-half--top' : ''} flex-1 min-h-0 overflow-y-auto no-scrollbar p-4 flex flex-col items-center justify-center text-center gap-2">
      <div class="coop-cut-icon text-6xl leading-none">${c.icon}</div>
      <p class="text-xl font-black text-white">${c.title}</p>
      <p class="text-sm italic text-fuchsia-200 max-w-sm">"${c.quote}"</p>
      <ul class="text-left text-xs text-slate-200 space-y-1 max-w-sm leading-snug">${c.rules.map(r => `<li>${r}</li>`).join('')}</ul>
      <button onclick="dismissCoopCutscene()" class="mt-1 px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold">Let's duel!</button>
    </div>
  `;
  return `
    <div class="coop-cutscene coop-cutscene--${coop.cutscene} fixed inset-0 z-50 flex flex-col bg-slate-950/95 backdrop-blur">
      ${half(true)}
      <div class="h-px bg-fuchsia-500/60"></div>
      ${half(false)}
    </div>
  `;
}

function renderCoopEnd() {
  const win = coop.phase === 'victory';
  const d = coopDiff();
  const stat = (label, value) => `<div class="rounded-xl bg-slate-900/90 border border-slate-800 px-3 py-2"><p class="text-[0.65rem] uppercase tracking-widest text-slate-400">${label}</p><p class="text-lg font-black text-white">${value}</p></div>`;
  return `
    <div class="coop-end ${win ? 'coop-end--win' : 'coop-end--lose'} flex-1 min-h-0 overflow-y-auto p-6 flex flex-col items-center justify-center text-center gap-3">
      <div class="coop-end-icon text-7xl leading-none">${win ? '🏆' : '🃏'}</div>
      <h2 class="text-3xl font-black text-white">${win ? 'Pegasus is defeated!' : 'Your souls are sealed…'}</h2>
      <p class="text-sm italic text-fuchsia-200 max-w-xs">${win ? '"Impossible! My Millennium Eye… it could not read the power of your friendship!"' : '"Don\'t worry, you will look lovely in my card collection!"'}</p>
      <div class="grid grid-cols-3 gap-2 w-full max-w-xs mt-2">
        ${stat('Difficulty', `${d.icon} ${d.label}`)}
        ${stat('Rounds', coop.round)}
        ${stat('Damage', coop.stats?.damage ?? 0)}
      </div>
      <div class="flex flex-col gap-2 w-full max-w-xs mt-3">
        <button onclick="coopPlayAgain()" class="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-lg transition">${win ? '🔁 Duel again' : '🔥 Rematch'}</button>
        <button onclick="coopBackToSetup()" class="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold transition">Change difficulty</button>
        <button onclick="leaveCoop()" class="w-full py-2 text-slate-400 hover:text-white text-sm">Back to start</button>
      </div>
    </div>
  `;
}
