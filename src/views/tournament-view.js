// Tournament screen: setup (size + hand-picked duelists) -> draw animation ->
// single-elimination bracket where the winner of each duel is tapped by hand.
const tnEsc = text => String(text ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);

// Start screen entry, below "Start Duel Setup".
function renderTournamentButton() {
  const running = tournament.phase === 'bracket' && !getTournamentChampion();
  return `
    <button onclick="if (startEggAllowsClick()) goToTournament()" onpointerdown="startStartEggPress(this)" onpointerup="cancelStartEggPress(this)" onpointerleave="cancelStartEggPress(this)" onpointercancel="cancelStartEggPress(this)" oncontextmenu="return false" class="tn-start-btn cegg-press w-full py-2.5 px-2 rounded-xl border border-amber-500/50 bg-slate-900/80 hover:bg-slate-800 text-amber-400 font-bold text-sm leading-tight transition flex flex-col items-center gap-0.5">
      <span class="text-xl leading-none">🏆</span>
      <span>Tournament</span>
      ${running ? '<span class="text-[0.65rem] font-semibold opacity-80">▶ Continue</span>' : ''}
    </button>
  `;
}

function renderTournamentView() {
  if (tournamentUi.view === 'history') return renderTournamentHistory();
  if (tournamentUi.view !== 'play') return renderTournamentMenu();
  if (tournament.phase !== 'bracket') return renderTournamentSetup();
  if (tournamentDraw.active) return renderTournamentDraw();
  return renderTournamentBracket();
}

// Sub-views go back to the menu, the menu goes back to the start screen.
function renderTournamentHeader(title, rightHtml = '<div class="w-16"></div>', backAction = 'showTournamentMenu()') {
  // Holding the 🏆 for 2s collects ten star chips (tournament-size-eggs.js).
  const heading = title.startsWith('🏆')
    ? `<span class="tn-trophy cegg-press" onpointerdown="startStartEggPress(this, 'star-chips')" onpointerup="cancelStartEggPress(this)" onpointerleave="cancelStartEggPress(this)" onpointercancel="cancelStartEggPress(this)" oncontextmenu="return false">🏆</span>${title.slice('🏆'.length)}`
    : title;
  return `
    <header class="px-4 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-900/80 backdrop-blur">
      <button onclick="${backAction}" class="text-slate-300 text-base font-medium px-2 py-1 w-16 text-left">← Back</button>
      <h2 class="text-lg font-bold text-white">${heading}</h2>
      ${rightHtml}
    </header>
  `;
}

// --- Setup ----------------------------------------------------------------------

function renderTournamentPickRow(char) {
  const picks = tournament.picks;
  const picked = picks.includes(char.id);
  const key = getDuelistKey(char);
  const siblingPicked = !picked && picks.some(id => getDuelistKeyById(id) === key);
  const pickOnly = TOURNAMENT_PICK_ONLY_IDS.includes(char.id);

  const tag = picked
    ? '<span class="text-xs font-bold uppercase tracking-wider text-amber-400">In</span>'
    : siblingPicked
      ? '<span class="text-xs font-semibold text-slate-400">Swap deck</span>'
      : pickOnly ? '<span class="text-xs font-semibold text-indigo-300">Pick only</span>' : '';
  const rowClass = picked
    ? 'border-amber-500/60 bg-amber-950/30'
    : siblingPicked ? 'border-slate-800 bg-slate-900/50 opacity-60' : 'border-slate-800 bg-slate-900/90';

  return `
    <button onclick="toggleTournamentPick('${char.id}')" aria-pressed="${picked}" class="w-full text-left px-3 py-2.5 rounded-xl border ${rowClass} hover:border-amber-500/50 transition flex items-center gap-3">
      <span class="tn-check ${picked ? 'tn-check--on' : ''} shrink-0 w-6 h-6 rounded-full border-2 ${picked ? 'border-amber-400 bg-amber-500 text-slate-950' : 'border-slate-600'} flex items-center justify-center text-sm font-black">${picked ? '✓' : ''}</span>
      <span class="flex-1 min-w-0">
        <span class="block font-bold text-white leading-tight">${tnEsc(char.name)}</span>
        <span class="block text-xs text-amber-400/90 mt-0.5">${tnEsc(char.theme)}</span>
      </span>
      ${tag}
    </button>
  `;
}

function renderTournamentSetup() {
  const size = clampTournamentSize(tournament.size);
  const min = getTournamentMinSize();
  const max = getTournamentMaxSize();
  const chosen = tournament.picks.length;
  const random = size - chosen;
  const stepBtn = 'w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 text-xl font-black text-slate-200 hover:bg-slate-700 transition touch-manipulation';
  const summary = random > 0
    ? `${chosen} chosen · <b class="text-amber-400">${random} drawn at random</b>`
    : `${chosen} chosen · no random spots`;

  return `
    ${renderTournamentHeader('🏆 Tournament')}
    <div class="flex-1 min-h-0 overflow-y-auto p-4 no-scrollbar">
      <section class="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 mb-5">
        <div class="flex items-center justify-between gap-3">
          <div>
            <p class="text-xs font-semibold uppercase tracking-widest text-slate-400">Participants</p>
            <p class="text-xs text-slate-500 mt-1">Single elimination · ${min}–${max}</p>
          </div>
          <div class="flex items-center gap-2">
            <button onclick="changeTournamentSize(-1)" class="${stepBtn}${size <= min ? ' opacity-30' : ''}" ${size <= min ? 'aria-disabled="true"' : ''} aria-label="Fewer participants">−</button>
            <span class="tn-size-value w-10 text-center text-3xl font-black text-white tabular-nums">${size}</span>
            <button onclick="changeTournamentSize(1)" class="${stepBtn}${size >= max ? ' opacity-30' : ''}" ${size >= max ? 'aria-disabled="true"' : ''} aria-label="More participants">+</button>
          </div>
        </div>
        <p class="text-sm text-slate-300 mt-3">${summary}</p>
      </section>

      <div class="flex items-end justify-between mb-1">
        <p class="text-xs font-semibold uppercase tracking-widest text-slate-400">Choose duelists <span class="normal-case tracking-normal font-normal text-slate-500">(optional)</span></p>
        ${chosen ? '<button onclick="clearTournamentPicks()" class="text-xs font-semibold text-slate-400 hover:text-white px-2 py-1">Clear</button>' : ''}
      </div>
      <p class="text-xs text-slate-500 mb-3 leading-relaxed">Empty spots are drawn at random, one deck per duelist. Neutral, Custom, Theotaur and Trizze only join if you pick them.</p>
      <div class="space-y-2 pb-2">
        ${CHARACTERS.map(renderTournamentPickRow).join('')}
      </div>
    </div>
    <footer class="p-4 border-t border-slate-800 bg-slate-900/80">
      <button onclick="if (startEggAllowsClick()) drawTournament()" ${random > 0 ? `onpointerdown="startStartEggPress(this, 'penalty-dice')" onpointerup="cancelStartEggPress(this)" onpointerleave="cancelStartEggPress(this)" onpointercancel="cancelStartEggPress(this)" oncontextmenu="return false"` : ''} class="cegg-press w-full py-4 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-98 text-slate-950 font-bold text-lg shadow-lg shadow-amber-500/20 transition">
        ${random > 0 ? '🎲 Draw the Tournament' : '⚔️ Start the Tournament'}
      </button>
    </footer>
  `;
}

// --- Draw -----------------------------------------------------------------------

function renderTournamentDrawCard(id) {
  const isRandom = tournament.randomIds.includes(id);
  const faceUp = !isRandom || tournamentDraw.revealed.has(id);
  const char = getTournamentChar(id);
  const badge = !isRandom ? 'Chosen' : faceUp ? 'Drawn' : '?';
  return `
    <div data-tn-draw="${id}" class="tn-draw-card ${faceUp ? '' : 'tn-facedown'} relative rounded-xl border ${isRandom ? 'border-amber-500/40' : 'border-slate-700'} bg-slate-900/90 p-3 min-h-[5.5rem] flex flex-col justify-center overflow-hidden">
      <span class="tn-draw-badge absolute top-2 right-2 text-[0.65rem] font-bold uppercase tracking-wider ${isRandom ? 'text-amber-400' : 'text-slate-400'}">${badge}</span>
      <div class="tn-draw-name font-bold text-white leading-tight pr-10">${faceUp ? tnEsc(char?.name) : '???'}</div>
      <div class="tn-draw-theme text-xs text-amber-400/90 mt-1">${faceUp ? tnEsc(char?.theme) : 'Face-down'}</div>
    </div>
  `;
}

function renderTournamentDraw() {
  const order = [...tournament.picks.filter(id => tournament.entrants.includes(id)), ...tournament.randomIds];
  const classes = ['tn-draw', tournamentDraw.done ? 'tn-draw--done' : '', tournamentDraw.fresh ? 'tn-draw--intro' : ''].join(' ');
  tournamentDraw.fresh = false;
  const skip = `<button onclick="skipTournamentDraw()" class="tn-draw-skip text-slate-300 text-sm font-semibold px-2 py-1 w-16 text-right">Skip ⏭</button>`;

  return `
    ${renderTournamentHeader('🎲 The Draw', skip)}
    <div class="${classes} flex-1 min-h-0 flex flex-col">
      <div class="flex-1 min-h-0 overflow-y-auto p-4 no-scrollbar">
        <p class="text-center text-sm text-slate-300 mb-4">${tournament.entrants.length} duelists · ${tournament.randomIds.length} chosen by fate</p>
        <div class="grid grid-cols-2 gap-2">
          ${order.map((id, i) => renderTournamentDrawCard(id).replace('class="tn-draw-card', `style="--i: ${i}" class="tn-draw-card`)).join('')}
        </div>
      </div>
      <footer class="tn-draw-next p-4 border-t border-slate-800 bg-slate-900/80">
        <button onclick="finishTournamentDraw()" class="w-full py-4 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-98 text-slate-950 font-bold text-lg shadow-lg shadow-amber-500/20 transition">See the Bracket →</button>
      </footer>
    </div>
  `;
}

// --- Bracket --------------------------------------------------------------------

function renderTournamentSlot(rounds, match, side) {
  const id = match[side];
  const char = id && getTournamentChar(id);
  if (!id) {
    const label = match.round === 0 ? 'Bye' : 'TBD';
    return `<div class="px-3 py-2 text-sm italic text-slate-500">${label}</div>`;
  }
  const isWinner = match.winnerId === id;
  const isLoser = match.winnerId && !isWinner;
  const stateClass = isWinner ? 'tn-winner text-white' : isLoser ? 'tn-loser text-slate-500' : 'text-slate-100';
  const inner = `
    <span class="flex-1 min-w-0">
      <span class="block font-bold text-sm leading-tight truncate ${isLoser ? 'line-through' : ''}">${tnEsc(char?.name || '???')}</span>
      <span class="block text-[0.7rem] text-amber-400/80 truncate">${tnEsc(char?.theme || '')}</span>
    </span>
    ${isWinner ? '<span class="text-amber-400 text-sm">★</span>' : ''}
  `;
  if (match.ready) {
    return `<button data-tn-side="${side}" onclick="markTournamentWinner(${match.round}, ${match.index}, '${side}')" class="tn-pick w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-amber-500/10 transition ${stateClass}">${inner}</button>`;
  }
  return `<div data-tn-side="${side}" class="px-3 py-2 flex items-center gap-2 ${stateClass}">${inner}</div>`;
}

function renderTournamentMatch(rounds, match) {
  const changeable = canChangeResult(rounds, match);
  const border = match.ready ? 'tn-ready border-amber-500/60' : match.winnerId ? 'border-slate-700' : 'border-slate-800';
  let footer = '';
  if (match.ready) footer = '<div class="px-3 py-1 text-[0.65rem] font-bold uppercase tracking-wider text-amber-400 bg-amber-950/30">Tap the winner</div>';
  else if (match.bye) footer = '<div class="px-3 py-1 text-[0.65rem] uppercase tracking-wider text-slate-500">Advances on a bye</div>';
  else if (changeable) footer = `<button onclick="undoTournamentResult(${match.round}, ${match.index})" class="w-full text-left px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-wider text-slate-400 hover:text-white">↺ Change result</button>`;

  return `
    <div data-tn-match="${match.round}:${match.index}" class="tn-match rounded-xl border ${border} bg-slate-900/90 overflow-hidden shadow">
      ${renderTournamentSlot(rounds, match, 'a')}
      <div class="h-px bg-slate-800"></div>
      ${renderTournamentSlot(rounds, match, 'b')}
      ${footer}
    </div>
  `;
}

function renderTournamentStatus(rounds, champion) {
  if (champion) {
    const char = getTournamentChar(champion);
    return `
      <div class="tn-champion mx-4 mt-4 rounded-2xl border border-amber-500/60 bg-amber-950/30 px-4 py-3 flex items-center gap-3">
        <span class="text-3xl">🏆</span>
        <span class="min-w-0">
          <span class="block text-xs font-bold uppercase tracking-widest text-amber-400">Champion</span>
          <span class="block font-black text-white text-lg leading-tight truncate">${tnEsc(char?.name || '???')}</span>
          <span class="block text-xs text-amber-400/80 truncate">${tnEsc(char?.theme || '')}</span>
        </span>
      </div>
    `;
  }
  const left = rounds.flat().filter(m => !m.bye && !m.winnerId).length;
  const current = rounds.find(matches => matches.some(m => m.ready));
  const roundName = current ? getRoundName(current[0].round, rounds.length) : '';
  return `
    <p class="px-4 pt-4 text-sm text-slate-300">
      <b class="text-amber-400">${roundName}</b> · ${left} duel${left === 1 ? '' : 's'} left · tap the winner when a duel is done
    </p>
  `;
}

function renderTournamentBracket() {
  const rounds = getTournamentRounds();
  const champion = getTournamentChampion(rounds);
  const deal = tournamentUi.dealBracket;
  tournamentUi.dealBracket = false;

  return `
    ${renderTournamentHeader('🏆 Tournament')}
    ${renderTournamentStatus(rounds, champion)}
    <div class="tn-bracket flex-1 min-h-0 overflow-auto no-scrollbar">
      <div class="${deal ? 'tn-deal ' : ''}flex gap-4 p-4 min-h-full" style="width: max-content">
        ${rounds.map((matches, round) => `
          <div class="tn-round flex flex-col w-44 shrink-0" style="--i: ${round}">
            <p class="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 text-center">${getRoundName(round, rounds.length)}</p>
            <div class="flex-1 flex flex-col justify-around gap-3">
              ${matches.map(match => renderTournamentMatch(rounds, match)).join('')}
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// --- History --------------------------------------------------------------------

const tnCharName = id => tnEsc(getTournamentChar(id)?.name || '???');
const tnDate = ms => new Date(ms).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

// --- Menu -----------------------------------------------------------------------

function renderTournamentMenuButton({ icon, label, sub, onclick, primary = false, danger = false, disabled = false, egg = '' }) {
  const style = danger
    ? 'border-rose-500 bg-rose-600 text-white'
    : primary
      ? 'border-amber-400 bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20'
      : 'border-slate-700 bg-slate-900/90 hover:border-amber-500/50 text-white';
  const subStyle = danger ? 'text-rose-100' : primary ? 'text-slate-900/80' : 'text-slate-400';
  // `egg`: a start-button-eggs.js hold kind (hold 2s instead of tapping).
  const eggAttrs = egg
    ? `onpointerdown="startStartEggPress(this, '${egg}')" onpointerup="cancelStartEggPress(this)" onpointerleave="cancelStartEggPress(this)" onpointercancel="cancelStartEggPress(this)" oncontextmenu="return false"`
    : '';
  return `
    <button onclick="${egg ? 'if (startEggAllowsClick()) ' : ''}${onclick}" ${eggAttrs} ${disabled ? 'disabled' : ''} class="${egg ? 'cegg-press ' : ''}w-full text-left px-4 py-4 rounded-2xl border ${style} transition flex items-center gap-4 disabled:opacity-40">
      <span class="text-3xl leading-none"><span class="ce-emoji">${icon}</span></span>
      <span class="flex-1 min-w-0">
        <span class="block text-lg font-black leading-tight">${label}</span>
        <span class="block text-xs mt-0.5 truncate ${subStyle}">${sub}</span>
      </span>
    </button>
  `;
}

function renderTournamentMenu() {
  const inBracket = tournament.phase === 'bracket';
  const rounds = inBracket ? getTournamentRounds() : null;
  const champion = inBracket ? getTournamentChampion(rounds) : null;
  const unfinished = inBracket && !champion;

  let continueSub = 'No tournament in progress';
  if (champion) continueSub = `Finished · Champion: ${tnCharName(champion)}`;
  else if (unfinished) {
    const left = rounds.flat().filter(m => !m.bye && !m.winnerId).length;
    const current = rounds.find(matches => matches.some(m => m.ready));
    continueSub = `${current ? `${getRoundName(current[0].round, rounds.length)} · ` : ''}${left} duel${left === 1 ? '' : 's'} left`;
  }

  const n = tournamentHistory.length;
  const top = n ? getTournamentLeaderboard()[0] : null;
  const historySub = n
    ? `${n} played${top ? ` · Most titles: ${tnEsc(top.name)} (${top.titles})` : ''}`
    : 'No finished tournaments yet';

  const armed = tournamentUi.confirmNew;
  return `
    ${renderTournamentHeader('🏆 Tournament', undefined, 'leaveTournament()')}
    <div class="flex-1 min-h-0 overflow-y-auto p-4 no-scrollbar flex flex-col justify-center gap-3">
      ${renderTournamentMenuButton({ icon: '▶️', label: 'Continue', sub: continueSub, onclick: 'continueTournament()', primary: unfinished, disabled: !inBracket, egg: 'next-time' })}
      ${renderTournamentMenuButton({
        icon: '✨',
        label: armed ? 'Tap again for a new one' : 'New tournament',
        sub: armed ? 'The current tournament will be abandoned' : 'Pick duelists and draw a bracket',
        onclick: 'newTournamentClick()',
        egg: 'mind-slave',
        primary: !unfinished,
        danger: armed
      })}
      ${renderTournamentMenuButton({ icon: '📜', label: 'History', sub: historySub, onclick: 'openTournamentHistory()' })}
    </div>
  `;
}

function renderTournamentLeaderboard() {
  const medals = ['🥇', '🥈', '🥉'];
  const rows = getTournamentLeaderboard().slice(0, 8).map((d, i) => `
    <li class="flex items-center gap-3 px-3 py-2 ${i ? 'border-t border-slate-800' : ''}">
      <span class="w-6 text-center ${medals[i] ? 'text-lg' : 'text-sm font-bold text-slate-500'}">${medals[i] ? `<span class="ce-emoji">${medals[i]}</span>` : i + 1}</span>
      <span class="flex-1 min-w-0 font-bold text-white truncate">${tnEsc(d.name)}</span>
      <span class="text-sm tabular-nums ${d.titles ? 'text-amber-300 font-bold' : 'text-slate-500'}"><span class="ce-emoji">🏆</span> ${d.titles}</span>
      <span class="w-12 text-right text-xs tabular-nums text-slate-400">2nd ${d.runnerUps}</span>
    </li>
  `).join('');
  return `
    <p class="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">Hall of Fame</p>
    <ol class="rounded-2xl border border-slate-800 bg-slate-900/90 overflow-hidden mb-5">${rows}</ol>
  `;
}

// Every played duel, round by round ("Winner def. Loser"). Byes are skipped.
function renderTournamentHistoryRounds(rounds) {
  return rounds.map((matches, round) => {
    const duels = matches.filter(m => !m.bye && m.winnerId).map(m => {
      const loser = m.winnerId === m.a ? m.b : m.a;
      return `<li class="text-sm leading-snug"><b class="text-white">${tnCharName(m.winnerId)}</b> <span class="text-slate-500">def.</span> <span class="text-slate-400">${tnCharName(loser)}</span></li>`;
    }).join('');
    if (!duels) return '';
    return `
      <div>
        <p class="text-[0.65rem] font-bold uppercase tracking-widest text-amber-400/80 mb-1">${getRoundName(round, rounds.length)}</p>
        <ul class="space-y-0.5">${duels}</ul>
      </div>
    `;
  }).join('');
}

function renderTournamentHistoryEntry(entry) {
  const rounds = getTournamentRounds(entry);
  const final = rounds.at(-1)[0];
  const runnerUp = final.winnerId === final.a ? final.b : final.a;
  const champ = getTournamentChar(final.winnerId);
  const open = tournamentUi.openHistoryId === entry.id;
  const size = entry.slots.filter(Boolean).length;
  return `
    <div class="rounded-2xl border ${open ? 'border-amber-500/50' : 'border-slate-800'} bg-slate-900/90 overflow-hidden">
      <button onclick="toggleTournamentHistoryEntry('${tnEsc(entry.id)}')" aria-expanded="${open}" class="w-full text-left px-4 py-3 flex items-center gap-3">
        <span class="text-2xl leading-none"><span class="ce-emoji">🏆</span></span>
        <span class="flex-1 min-w-0">
          <span class="block text-[0.7rem] text-slate-400">${tnDate(entry.finishedAt)} · ${size} duelists</span>
          <span class="block font-black text-white leading-tight truncate">${tnEsc(champ?.name || '???')}</span>
          <span class="block text-xs text-amber-400/80 truncate">${tnEsc(champ?.theme || '')}</span>
          ${runnerUp ? `<span class="block text-xs text-slate-400 mt-0.5 truncate">beat ${tnCharName(runnerUp)} in the final</span>` : ''}
        </span>
        <span class="text-slate-400 text-sm">${open ? '▲' : '▼'}</span>
      </button>
      ${open ? `<div class="px-4 pb-3 pt-2 border-t border-slate-800 space-y-2.5">${renderTournamentHistoryRounds(rounds)}</div>` : ''}
    </div>
  `;
}

function renderTournamentHistory() {
  const empty = !tournamentHistory.length;
  return `
    ${renderTournamentHeader('<span class="ce-emoji">📜</span> History')}
    <div class="flex-1 min-h-0 overflow-y-auto p-4 no-scrollbar">
      ${empty
        ? '<p class="text-sm text-slate-400 text-center mt-10 leading-relaxed">No finished tournaments yet.<br>Crown a champion and they will be remembered here.</p>'
        : `
          ${renderTournamentLeaderboard()}
          <p class="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">Tournaments</p>
          <div class="space-y-2">${tournamentHistory.map(renderTournamentHistoryEntry).join('')}</div>
        `}
    </div>
  `;
}
