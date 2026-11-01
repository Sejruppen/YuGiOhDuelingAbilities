// Solo mode screen ("Duelist's Road"): the intro, the island map, nodes,
// fights against a virtual duelist and the end of a run.
const SOLO_MAP_W = 360;
const SOLO_MAP_H = SOLO_FLOOR.CASTLE * 100 + 20;
// The header 🗺️: hold it for the Field Power Bonus egg (field-power-egg.js).
const SOLO_MAP_ICON = `<span class="solo-map-icon cegg-press" onpointerdown="startStartEggPress(this, 'field-power')" onpointerup="cancelStartEggPress(this)" onpointerleave="cancelStartEggPress(this)" onpointercancel="cancelStartEggPress(this)" oncontextmenu="return false"><span class="ce-emoji">🗺️</span></span>`;

// Start screen entry, below Tournament and Co-op.
function renderSoloButton() {
  const running = isSoloRunActive();
  return `
    <button onclick="if (startEggAllowsClick()) goToSolo()" onpointerdown="startStartEggPress(this, 'paradox-labyrinth')" onpointerup="cancelStartEggPress(this)" onpointerleave="cancelStartEggPress(this)" onpointercancel="cancelStartEggPress(this)" oncontextmenu="return false" class="solo-start-btn cegg-press col-span-2 w-full py-2.5 px-2 rounded-xl border border-emerald-500/50 bg-slate-900/80 hover:bg-slate-800 text-emerald-300 font-bold text-sm leading-tight transition flex items-center justify-center gap-2">
      <span class="text-xl leading-none ce-emoji">🗺️</span>
      <span>Solo: Duelist's Road</span>
      ${running ? '<span class="text-[0.65rem] font-semibold opacity-80">▶ Continue</span>' : ''}
    </button>
  `;
}

function renderSoloView() {
  const views = { menu: renderSoloMenu, how: renderSoloIntro, history: renderSoloHistory };
  const body = views[soloUi.view] || {
    map: renderSoloMapScreen,
    node: renderSoloNode,
    fight: renderSoloFight,
    reward: renderSoloReward,
    victory: renderSoloEnd,
    defeat: renderSoloEnd
  }[solo.phase] || renderSoloIntro;
  return `<div class="solo-screen relative flex-1 min-h-0 flex flex-col">${body()}${!soloUi.view && soloUi.relicInfo ? renderSoloRelicSheet() : ''}${!soloUi.view && soloUi.peek && soloCanPeek() ? renderSoloPeek() : ''}</div>`;
}

// --- Menu and history ---------------------------------------------------------------

function renderSoloMenu() {
  const active = isSoloRunActive();
  const at = active && solo.at && solo.map.nodes[solo.at];
  const continueSub = active
    ? `Floor ${at ? at.floor : 0}/${SOLO_FLOOR.CASTLE} · ❤️ ${solo.lp} LP · ⭐ ${solo.chips}`
    : 'No run in progress';
  const n = soloHistory.length;
  const wins = soloHistory.filter(e => e.result === 'victory').length;
  const historySub = n ? `${n} run${n === 1 ? '' : 's'} · ${wins} won` : 'No finished runs yet';
  const armed = soloUi.confirmNew;
  return `
    ${renderSoloHeader(`${SOLO_MAP_ICON} Duelist's Road`)}
    <div class="flex-1 min-h-0 overflow-y-auto p-4 no-scrollbar flex flex-col">
     <div class="my-auto flex flex-col gap-3">
      <div class="text-center mb-2">
        <div class="coop-step-icon text-6xl leading-none ce-emoji">🏝️</div>
        <p class="mt-2 text-xl font-black text-white">Welcome to Duelist Kingdom</p>
        <p class="text-sm italic text-emerald-200">"Collect ${SOLO_GATE_CHIPS} Star Chips and the castle doors will open for you."</p>
        <p class="mt-3 text-sm text-slate-300 leading-relaxed">
          A solo run across Pegasus' island. Play your own deck against duelists that live on the phone. Choose your path, collect Star Chips and reach the castle.
        </p>
      </div>
      ${renderSoloRoute(at ? at.floor : 0)}
      ${renderTournamentMenuButton({ icon: '▶️', label: active && solo.name ? `Continue · ${soloEscape(solo.name)}` : 'Continue', sub: continueSub, onclick: 'continueSoloRun()', primary: active, disabled: !active })}
      ${renderTournamentMenuButton({
        icon: '🏝️',
        label: armed ? 'Tap again for a new run' : 'New run',
        sub: armed ? 'The current run will be abandoned' : 'A new map of Duelist Kingdom',
        onclick: 'newSoloRunClick()',
        egg: 'exodia-overboard',
        primary: !active,
        danger: armed
      })}
      ${renderTournamentMenuButton({ icon: '📜', label: 'History', sub: historySub, onclick: 'openSoloHistory()', egg: 'bonz-graveyard' })}
     </div>
    </div>
  `;
}

// The island from beach to castle; [regions, floorFrom, floorTo]. Lights up where the current run is.
const SOLO_ROUTE = [
  [['beach'], 1, SOLO_BEACH_FLOORS],
  [['forest', 'meadow'], SOLO_BEACH_FLOORS + 1, SOLO_MIDDLE_FLOORS],
  [['mountain', 'wasteland'], SOLO_MIDDLE_FLOORS + 1, SOLO_BRANCH_FLOORS],
  [['labyrinth'], SOLO_FLOOR.LABYRINTH, SOLO_FLOOR.LABYRINTH],
  [['castle'], SOLO_FLOOR.CASTLE, SOLO_FLOOR.CASTLE]
];

function renderSoloRoute(floor) {
  const stops = SOLO_ROUTE.map(([regions, from, to]) => {
    const here = floor >= from && floor <= to;
    const passed = floor > to;
    const title = regions.map(r => SOLO_REGIONS[r].name).join(' or ');
    return `
      <span title="${title}" class="flex flex-col items-center gap-0.5 rounded-lg px-1.5 py-1 ${here ? 'bg-amber-500/20 ring-1 ring-amber-400' : ''} ${passed ? 'opacity-40' : ''}">
        ${regions.map(r => `<span class="ce-emoji text-xl leading-none">${SOLO_REGIONS[r].icon}</span>`).join('')}
      </span>`;
  });
  return `
    <div class="flex items-center justify-center gap-1 mb-2 text-slate-500 text-xs" aria-label="The route: beach, forest or meadow, mountain or wasteland, labyrinth, castle">
      ${stops.join('<span aria-hidden="true">›</span>')}
    </div>
  `;
}

const SOLO_RESULTS = {
  victory: { icon: '🏆', text: () => 'Defeated Pegasus', cls: 'text-amber-300' },
  defeat: { icon: '🃏', text: e => `Sealed by ${e.foe} on floor ${e.floor}`, cls: 'text-rose-300' },
  abandoned: { icon: '🏳️', text: e => `Abandoned on floor ${e.floor}`, cls: 'text-slate-400' }
};

function renderSoloHistoryEntry(e) {
  const r = SOLO_RESULTS[e.result] || SOLO_RESULTS.abandoned;
  const open = soloUi.openHistoryId === e.id;
  const relics = (e.relics || []).filter(id => SOLO_RELICS[id]);
  return `
    <div class="rounded-2xl border ${open ? 'border-amber-500/50' : 'border-slate-800'} bg-slate-900/90 overflow-hidden">
      <button onclick="toggleSoloHistoryEntry('${e.id}')" aria-expanded="${open}" class="w-full text-left px-4 py-3 flex items-center gap-3">
        <span class="text-2xl leading-none ce-emoji">${r.icon}</span>
        <span class="flex-1 min-w-0">
          <span class="block text-[0.7rem] text-slate-400 truncate">${tnDate(e.finishedAt)}${e.name ? ` · ${soloEscape(e.hero)}` : ''}</span>
          <span class="block font-black text-white leading-tight truncate">${soloEscape(e.name || e.hero)}</span>
          <span class="block text-xs ${r.cls} truncate">${r.text(e)}</span>
        </span>
        <span class="text-slate-400 text-sm">${open ? '▲' : '▼'}</span>
      </button>
      ${open ? `
        <div class="px-4 pb-4 pt-3 border-t border-slate-800 flex flex-col items-center gap-3">
          <div class="grid grid-cols-3 gap-2 w-full text-center">
            ${soloStat('Duels won', e.duels)}
            ${soloStat('Damage', e.damage)}
            ${soloStat(e.result === 'victory' ? 'LP left' : '⭐ Chips', e.result === 'victory' ? e.lp : e.chips)}
          </div>
          ${relics.length ? `<p class="text-xl tracking-widest text-center">${relics.map(id => `<span class="ce-emoji" title="${SOLO_RELICS[id].name}">${SOLO_RELICS[id].icon}</span>`).join(' ')}</p>` : ''}
          ${e.map && e.map.layout === SOLO_MAP_LAYOUT ? renderSoloMap(true, e) : ''}
        </div>
      ` : ''}
    </div>
  `;
}

function renderSoloHistory() {
  const n = soloHistory.length;
  const wins = soloHistory.filter(e => e.result === 'victory').length;
  const best = Math.max(0, ...soloHistory.map(e => e.damage || 0));
  return `
    ${renderSoloHeader('<span class="ce-emoji">📜</span> History')}
    <div class="flex-1 min-h-0 overflow-y-auto p-4 no-scrollbar">
      ${!n
        ? '<p class="text-sm text-slate-400 text-center mt-10 leading-relaxed">No finished runs yet.<br>Every run, won or lost, will be remembered here.</p>'
        : `
          <div class="grid grid-cols-3 gap-2 text-center mb-5">
            ${soloStat('Runs', n)}
            ${soloStat('Won', wins)}
            ${soloStat('Best damage', best)}
          </div>
          <p class="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">Runs</p>
          <div class="space-y-2">${soloHistory.map(renderSoloHistoryEntry).join('')}</div>
        `}
    </div>
  `;
}

const soloStat = (label, value) => `<div class="rounded-xl bg-slate-900/90 border border-slate-800 px-3 py-2"><p class="text-[0.65rem] uppercase tracking-widest text-slate-400">${label}</p><p class="text-lg font-black text-white">${value}</p></div>`;

// --- Relics -------------------------------------------------------------------------

// Spent relics are greyed out until the next duel (the Puzzle for good).
function soloRelicSpent(id) {
  if (id === 'puzzle') return !!solo.puzzleUsed;
  const f = solo.phase === 'fight' && solo.fight;
  if (!f) return false;
  return soloRelicUsedCount(id) >= soloRelicUses(id) || (id === 'legendary-sword' && f.swordRound === f.round);
}

const soloRarityClass = r => ({ rare: 'text-sky-300', millennium: 'text-amber-300' }[r.rarity] || 'text-slate-400');

function renderSoloRelicBar() {
  if (!solo.relics?.length) return '';
  const relics = solo.relics.map(id => {
    const r = SOLO_RELICS[id];
    return `<button data-solo-relic="${id}" onclick="showSoloRelic('${id}')" aria-label="${r.name}${soloIsPolished(id) ? ' (polished)' : ''}" class="solo-relic solo-relic--${r.rarity} ${soloIsPolished(id) ? 'solo-relic--polished' : ''} ${soloRelicSpent(id) ? 'solo-relic--used' : ''} ${soloUi.relicInfo === id ? 'solo-relic--picked' : ''}"><span class="ce-emoji">${r.icon}</span></button>`;
  }).join('');
  return `<div class="shrink-0 flex flex-wrap gap-1.5 justify-center">${relics}</div>`;
}

const soloRelicOption = id => {
  const r = SOLO_RELICS[id];
  return coopOption({ icon: `<span class="ce-emoji">${r.icon}</span>`, label: `${r.name} <span class="text-[0.6rem] uppercase tracking-widest ${soloRarityClass(r)}">${r.rarity}</span>`, sub: r.text }, `pickSoloRelic('${id}')`);
};

function renderSoloRelicSheet() {
  const id = soloUi.relicInfo;
  const r = SOLO_RELICS[id];
  if (!r || !soloHas(id)) return '';
  const use = id === 'red-medicine' ? coopBtn(`<span class="ce-emoji">🧪</span> Drink (+${soloRelicValue(id)} LP)`, 'useSoloRedMedicine()', 'heal', solo.lp >= solo.maxLp) : '';
  const usesLeft = solo.phase === 'fight' && soloRelicUses(id) > 1 ? soloRelicUses(id) - soloRelicUsedCount(id) : 0;
  return `
    <div class="solo-sheet absolute inset-x-0 bottom-0 z-20 p-4 rounded-t-2xl border-t border-amber-500/50 bg-slate-900/95 backdrop-blur shadow-2xl">
      <div class="flex items-start gap-3">
        <span class="text-4xl leading-none ce-emoji">${r.icon}</span>
        <div class="flex-1 min-w-0">
          <p class="font-black text-white text-lg leading-tight">${r.name}</p>
          <p class="text-[0.65rem] uppercase tracking-widest ${soloRarityClass(r)}">${r.rarity === 'millennium' ? 'Millennium Item' : `${r.rarity} relic`}          ${r.consumable ? ' · used up when used' : ''}${soloIsPolished(id) ? ' · <span class="ce-emoji">✨</span> polished' : ''}</p>
                    <p class="text-sm text-slate-200 mt-1 leading-snug">${soloRelicText(id)}</p>
                    ${soloRelicSpent(id) ? `<p class="text-xs text-amber-200 mt-1">${id === 'puzzle' ? 'Its power is spent for this run.' : 'Already used. It is ready again next duel.'}</p>` : usesLeft === 1 ? '<p class="text-xs text-amber-200 mt-1">Used once. One more use this duel.</p>' : ''}
        </div>
      </div>
      <div class="flex gap-2 mt-3">${coopBtn('Close', 'closeSoloRelic()')}${use}</div>
    </div>
  `;
}

// Counts both sides' turns: the player's round N is turn 2N-1 (2N if the enemy opened).
function renderSoloTurnBadge(f) {
  const enemyFirst = f.first === 'enemy' ? 1 : 0;
  const enemy = f.turn === 'enemy';
  const n = enemy ? 2 * f.round + enemyFirst : 2 * f.round - 1 + enemyFirst;
  return `<div class="text-[0.65rem] font-bold text-slate-400 leading-tight">Turn ${Math.max(1, n)}</div>
    <div class="text-[0.6rem] font-bold uppercase tracking-wide ${enemy ? 'text-rose-400' : 'text-amber-400'}"><span class="ce-emoji">${enemy ? '👁️' : '⚔️'}</span> ${enemy ? 'Enemy' : 'You'}</div>`;
}

function renderSoloHeader(title, right = '') {
  return `
    <header class="shrink-0 px-4 py-3 border-b border-slate-800 flex items-center justify-between gap-2 bg-slate-900/80 backdrop-blur">
      <button onclick="backInSolo()" class="text-slate-300 text-base font-medium px-2 py-1 w-16 text-left">← Back</button>
      <h2 class="text-lg font-bold text-white truncate p-2 -m-2">${title}</h2>
      <div class="w-16 text-right">${right}</div>
    </header>
  `;
}

function renderSoloStatus() {
  const at = solo.at && solo.map.nodes[solo.at];
  const floor = `Floor ${at ? at.floor : 0}/${SOLO_FLOOR.CASTLE}`;
  return `
    <div class="shrink-0 px-4 py-2 flex items-center justify-between gap-2 text-sm font-bold bg-slate-950/70 border-b border-slate-800">
      <span data-solo-me class="text-white tabular-nums"><span class="ce-emoji">❤️</span> ${solo.lp}</span>
      <span class="${solo.chips >= SOLO_GATE_CHIPS ? 'text-amber-300' : 'text-slate-200'}"><span class="ce-emoji">⭐</span> ${solo.chips}/${SOLO_GATE_CHIPS}</span>
      ${soloCanPeek()
        ? `<button onclick="openSoloPeek()" aria-label="Peek at the map" class="-my-1 -mr-2 px-2 py-1 rounded-lg border border-emerald-500/40 bg-slate-800/70 hover:bg-slate-700 text-emerald-200"><span class="ce-emoji">🗺️</span> ${floor}</button>`
        : `<span class="text-slate-400">${floor}</span>`}
    </div>
    ${solo.relics?.length ? `<div class="shrink-0 px-4 py-1.5 bg-slate-950/50 border-b border-slate-800">${renderSoloRelicBar()}</div>` : ''}
  `;
}

// `boost` adds a +30% button for typing your own monster's ATK in a field-bonus region.
function soloKeypad(label, actionsHtml, boost = false) {
  const value = soloUi.input;
  const keys = ['1', '2', '3', 'back', '4', '5', '6', '0', '7', '8', '9', '00'];
  const region = soloRegion();
  const boosted = !!value && soloUi.inputBoosted;
  const boostBtn = boost && region.types.length
    ? `<button type="button" onclick="boostSoloInput()" ${!value || boosted ? 'disabled' : ''} title="${region.name} field bonus" class="shrink-0 rounded-md px-2.5 py-1 text-xs font-bold transition ${boosted ? 'bg-amber-500 text-slate-950' : value ? 'bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/50' : 'bg-slate-900/60 text-slate-600 border border-slate-800'}"><span class="ce-emoji">${region.icon}</span> +${SOLO_FIELD_BONUS * 100}%</button>`
    : '';
  return `
    <div class="flex items-center justify-between gap-2 px-1">
      ${value
        ? '<button type="button" onclick="clearSoloInput()" class="text-xs font-bold text-slate-300 hover:text-white rounded-md bg-slate-800 hover:bg-slate-700 px-2.5 py-1">✕ Clear</button>'
        : `<p class="text-xs text-slate-400">${label}</p>`}
      ${boostBtn ? `<span class="ml-auto">${boostBtn}</span>` : ''}
      <p class="text-3xl font-black text-white tabular-nums">${value ? `${value}${soloInputHasSuffix() ? '<span class="text-slate-600">00</span>' : ''}` : '<span class="text-slate-600">0</span>'}</p>
    </div>
    <div class="grid grid-cols-4 gap-1.5">
      ${keys.map(k => `<button onclick="soloKey('${k}')" class="py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-lg font-bold text-white">${k === 'back' ? '⌫' : k}</button>`).join('')}
    </div>
    <div class="flex flex-wrap gap-2">${actionsHtml}</div>
  `;
}

const soloEscape = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const soloFieldText = region => {
  const r = SOLO_REGIONS[region];
  return r?.types.length ? `${r.types.join(', ')} monsters gain ${SOLO_FIELD_BONUS * 100}% ATK` : 'No field bonus here';
};

// --- Intro --------------------------------------------------------------------------

function renderSoloIntro() {
  return `
    ${renderSoloHeader('<span class="ce-emoji">🏝️</span> New run')}
    <div class="flex-1 min-h-0 overflow-y-auto p-4 no-scrollbar">
      <p class="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">How it works</p>
      <ul class="text-xs text-slate-300 space-y-1.5 leading-relaxed">
        <li><span class="ce-emoji">🗺️</span> Pick a path up the map. Every node is a duel, a treasure or something stranger. A <span class="ce-emoji">❓</span> hides a duelist or a Shadow Game until you get there.</li>
        <li><span class="ce-emoji">🃏</span> Before each duel: shuffle your deck and draw 5. You always go first.</li>
        <li><span class="ce-emoji">❤️</span> You start with ${SOLO_START_LP} LP, and it carries over between duels. Campfires <span class="ce-emoji">🔥</span> along the way let you rest, train or polish a relic.</li>
        <li><span class="ce-emoji">👁️</span> The enemy shows what kind of move it will make next turn. Plan around it!</li>
        <li><span class="ce-emoji">⚔️</span> Attack on the phone: pick a target and enter your monster's ATK. Normal battle rules apply.</li>
        <li><span class="ce-emoji">🛡️</span> Enemy monsters attack you directly. Block with one of your monsters (each one blocks once per turn) or take the hit. Or spring a Trap Card from your hand to negate the attack or destroy the attacker. When the enemy summons a monster, you can also spring a Trap Card to destroy it.</li>
        <li><span class="ce-emoji">🌲</span> Each region has a field: matching monsters gain ${SOLO_FIELD_BONUS * 100}% ATK. That goes for yours too!</li>
        <li><span class="ce-emoji">⭐</span> Start with ${SOLO_START_CHIPS} Star Chips. A duelist gives +1, an elite +2. With fewer than ${SOLO_GATE_CHIPS}, you must go through the Labyrinth.</li>
        <li><span class="ce-emoji">🎁</span> Find relics in treasure chests and win rare ones from elites. Tap a relic to read what it does.</li>
      </ul>
    </div>
    <footer class="shrink-0 p-4 border-t border-slate-800 bg-slate-900/80 space-y-3">
      <input type="text" maxlength="${SOLO_NAME_MAX}" value="${soloEscape(soloUi.runName)}" oninput="soloUi.runName = this.value" placeholder="Name this run (optional)" aria-label="Run name" class="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 focus:border-amber-500 outline-none text-white text-sm placeholder-slate-500">
      <button onclick="startSoloRun()" class="w-full py-4 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-98 text-slate-950 font-bold text-lg shadow-lg shadow-amber-500/20 transition"><span class="ce-emoji">🏝️</span> Set sail</button>
    </footer>
  `;
}

// --- Map ----------------------------------------------------------------------------

const soloMapY = floor => SOLO_MAP_H - 50 - (floor - 1) * 100;

function soloNodePos(n) {
  if (n.col === null) return { x: SOLO_MAP_W / 2, y: soloMapY(n.floor) };
  return { x: 54 + n.col * 84 + n.jx, y: soloMapY(n.floor) + n.jy };
}

// Background bands per region: [region, floorFrom, floorTo, side]. Bottom-up and right before left,
// because each band fades out over the ones drawn before it.
const SOLO_MAP_BANDS = [
  ['beach', 1, SOLO_BEACH_FLOORS, 'all'],
  ['meadow', SOLO_BEACH_FLOORS + 1, SOLO_MIDDLE_FLOORS, 'right'],
  ['forest', SOLO_BEACH_FLOORS + 1, SOLO_MIDDLE_FLOORS, 'left'],
  ['wasteland', SOLO_MIDDLE_FLOORS + 1, SOLO_BRANCH_FLOORS, 'right'],
  ['mountain', SOLO_MIDDLE_FLOORS + 1, SOLO_BRANCH_FLOORS, 'left'],
  ['labyrinth', SOLO_FLOOR.LABYRINTH, SOLO_FLOOR.LABYRINTH, 'all'],
  ['castle', SOLO_FLOOR.CASTLE, SOLO_FLOOR.CASTLE, 'all']
];
const SOLO_MAP_FADE = 36; // how far a band fades down over the band below
const SOLO_MAP_SEAM = 24; // half-width of the blend between left and right regions
let soloMapUid = 0;

// --- Map scenery: flat cartoon art per region, in each band's local coordinates. ---
// `solo-art-fine` marks small details that the mini map and lite mode drop.
const smPeak = (cx, b, w, h) => {
  const t = b - h;
  return `<polygon fill="#5d6a82" points="${cx - w / 2},${b} ${cx},${t} ${cx},${b}"/>`
    + `<polygon fill="#48546b" points="${cx},${t} ${cx + w / 2},${b} ${cx},${b}"/>`
    + `<polygon fill="#e2e8f0" points="${cx},${t} ${cx - 0.15 * w},${t + 0.3 * h} ${cx - 0.06 * w},${t + 0.24 * h} ${cx},${t + 0.32 * h} ${cx + 0.07 * w},${t + 0.25 * h} ${cx + 0.15 * w},${t + 0.3 * h}"/>`;
};
const smCloud = (x, y) => `<g class="solo-art-fine" fill="#e2e8f0" opacity="0.14"><ellipse cx="${x}" cy="${y}" rx="22" ry="7"/><circle cx="${x - 6}" cy="${y - 5}" r="8"/><circle cx="${x + 7}" cy="${y - 4}" r="6"/></g>`;
const smPine = (x, y, s, back) => {
  const [top, low] = back ? ['#1f5730', '#184a28'] : ['#33854a', '#286e3c'];
  return `<rect fill="#4a2f1a" x="${x - 1.5 * s}" y="${y - 6 * s}" width="${3 * s}" height="${6 * s}"/>`
    + `<polygon fill="${low}" points="${x},${y - 24 * s} ${x - 15 * s},${y - 5 * s} ${x + 15 * s},${y - 5 * s}"/>`
    + `<polygon fill="${top}" points="${x},${y - 36 * s} ${x - 11 * s},${y - 17 * s} ${x + 11 * s},${y - 17 * s}"/>`;
};
const smOak = (x, y, s) => `<rect fill="#4a2f1a" x="${x - 2 * s}" y="${y - 10 * s}" width="${4 * s}" height="${10 * s}"/>`
  + `<circle fill="#2a6e38" cx="${x}" cy="${y - 19 * s}" r="${12 * s}"/><circle fill="#3a8f4a" cx="${x - 4 * s}" cy="${y - 23 * s}" r="${6 * s}"/>`;
const smWave = (y, amp = 6, step = 30) => {
  let d = `M0 ${y}Q${step / 2} ${y - amp} ${step} ${y}`;
  for (let x = step * 2; x <= SOLO_MAP_W + step; x += step) d += `T${x} ${y}`;
  return d;
};
const smStar = (x, y, r) => {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const d = i % 2 ? r * 0.45 : r;
    pts.push(`${(x + Math.cos(a) * d).toFixed(1)},${(y + Math.sin(a) * d).toFixed(1)}`);
  }
  return `<polygon fill="#e07a5f" points="${pts.join(' ')}"/>`;
};
const smShell = (x, y) => `<path fill="#f3d6c8" d="M${x - 5} ${y}q5 -10 10 0z"/><path stroke="#c9a08f" stroke-width="0.8" d="M${x} ${y}v-4M${x - 2.5} ${y}l-1 -3M${x + 2.5} ${y}l1 -3"/>`;
const smRock = (x, y, s, [dark, light]) => `<path fill="${dark}" d="M${x} ${y}l${4 * s} ${-8 * s}l${9 * s} ${-3 * s}l${7 * s} ${6 * s}l${2 * s} ${5 * s}z"/>`
  + `<path fill="${light}" d="M${x + 4 * s} ${y - 8 * s}l${9 * s} ${-3 * s}l${7 * s} ${6 * s}l${-8 * s} ${s}z"/>`;
const smPalm = (x, y, flip) => `<g transform="translate(${x} ${y}) scale(${flip ? -1 : 1} 1)">`
  + '<path d="M0 0Q-4 -24 8 -46" stroke="#6b4423" stroke-width="4" stroke-linecap="round" fill="none"/>'
  + '<path fill="#2f7a3c" d="M8 -46q-16 -8 -28 4q14 -4 28 -4zM8 -46q16 -10 28 2q-14 -4 -28 -2zM8 -46q-6 -16 -22 -14q12 2 22 14zM8 -46q10 -14 22 -8q-12 0 -22 8z"/>'
  + '<circle cx="6" cy="-43" r="2.5" fill="#5b3a1e"/></g>';
const smDeadTree = (x, y) => `<path d="M${x} ${y}V${y - 30}M${x} ${y - 16}l-10 -9M${x} ${y - 24}l9 -10M${x} ${y - 30}l-3 -8" stroke="#2a160c" stroke-width="3" stroke-linecap="round" fill="none"/>`;
const smBone = (x, y, deg) => `<g fill="#e7dcc6" transform="translate(${x} ${y}) rotate(${deg})"><rect x="-6" y="-1" width="12" height="2"/><circle cx="-6" cy="-1.5" r="1.8"/><circle cx="-6" cy="1.5" r="1.8"/><circle cx="6" cy="-1.5" r="1.8"/><circle cx="6" cy="1.5" r="1.8"/></g>`;
const smSkull = (x, y) => `<g transform="translate(${x} ${y})"><circle r="7" fill="#e7dcc6"/><rect x="-4" y="3" width="8" height="6" rx="1.5" fill="#e7dcc6"/>`
  + '<circle cx="-2.6" cy="0" r="2" fill="#2f1a10"/><circle cx="2.6" cy="0" r="2" fill="#2f1a10"/><path d="M-0.8 4.5h1.6l-0.8 -1.6z" fill="#2f1a10"/></g>';
const smTufts = (pts, color) => `<path class="solo-art-fine" d="${pts.map(([x, y]) => `M${x} ${y}l2 -6l2 6l2 -5l1 5`).join('')}" stroke="${color}" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`;
const smMounds = (list, color) => `<path fill="${color}" d="${list.map(([a, b, y, h]) => `M${a} ${y}Q${(a + b) / 2} ${y - 2 * h} ${b} ${y}Z`).join('')}"/>`;
const smWheat = (x, y) => [0, 4, 8].map(dx => `<path d="M${x + dx} ${y}v-12" stroke="#b39245" stroke-width="1.2"/><ellipse cx="${x + dx}" cy="${y - 15}" rx="1.6" ry="3.6" fill="#d9b85a"/>`).join('');
const smCastleSide = '<path fill="#12071f" d="M0 120V92H10V64L20 46L30 64V92H40V80L48 66L56 80V102H64V96H68V102H72V96H76V102H80V120Z"/>'
  + '<g class="solo-art-fine" fill="#fbbf24" fill-opacity="0.75"><rect x="17" y="70" width="6" height="8" rx="3"/><rect x="45" y="84" width="6" height="7" rx="3"/></g>';
const smStorm = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})"><g fill="#2b1440"><ellipse cy="4" rx="28" ry="9"/><circle cx="-10" cy="-2" r="10"/><circle cx="9" cy="-4" r="12"/></g>`
  + '<g fill="#3d1f58"><circle cx="-11" cy="-6" r="6"/><circle cx="8" cy="-9" r="7"/></g></g>';

// colors = the band's top and bottom fill; art = scenery ('{id}' becomes the map's unique id prefix).
const SOLO_MAP_ART = {
  beach: {
    colors: ['#8a7446', '#7a6438'],
    art: [
      `<g class="solo-art-fine" fill="none" stroke="#a08757" stroke-width="1.5" stroke-linecap="round"><path d="M28 40q10 -5 20 0M96 96q12 -5 24 0M250 30q10 -5 20 0M170 130q12 -5 24 0M290 172q10 -5 20 0M40 120q8 -4 16 0"/></g>`,
      `<path fill="#6e5832" d="${smWave(206)}V300H0Z"/>`,
      `<path fill="#1f7f8f" d="${smWave(214)}V300H0Z"/>`,
      `<path fill="#19667a" d="${smWave(246, 4, 40)}V300H0Z"/>`,
      `<path fill="#145266" d="${smWave(278, 4, 45)}V300H0Z"/>`,
      `<path fill="none" stroke="#e0f2fe" stroke-opacity="0.6" stroke-width="2.5" stroke-linecap="round" d="${smWave(214)}"/>`,
      '<path class="solo-art-fine" fill="none" stroke="#bae6fd" stroke-opacity="0.45" stroke-width="1.5" stroke-linecap="round" d="M30 262q6 -4 12 0M110 290q6 -4 12 0M190 266q6 -4 12 0M280 292q6 -4 12 0M340 260q6 -4 12 0"/>',
      `<g class="solo-art-fine">${smStar(100, 112, 5)}${smStar(262, 186, 4)}${smShell(190, 92)}${smShell(64, 178)}${smShell(300, 66)}</g>`,
      smRock(318, 206, 1, ['#4b4540', '#6b635a']),
      smPalm(14, 200, false),
      smPalm(348, 118, true)
    ].join('')
  },
  forest: {
    colors: ['#1d4a2b', '#1a4226'],
    art: [
      ...[[12, 40], [96, 30], [170, 62], [22, 140], [95, 118], [166, 172], [10, 252], [92, 222], [172, 284], [22, 352], [98, 322], [160, 398], [56, 402]]
        .map(([x, y]) => smPine(x, y, 0.8, true)),
      '<g class="solo-art-fine" fill="#235d33"><circle cx="110" cy="78" r="6"/><circle cx="118" cy="80" r="5"/><circle cx="14" cy="200" r="6"/><circle cx="22" cy="202" r="4"/><circle cx="150" cy="330" r="6"/><circle cx="158" cy="332" r="5"/></g>',
      ...[[32, 96, 1], [150, 112, 0.9], [72, 192, 1.1], [134, 244, 0.9], [36, 302, 1], [122, 296, 0.8], [78, 384, 1]]
        .map(([x, y, s], i) => (i % 2 ? smPine(x, y, s) : smOak(x, y, s)))
    ].join('')
  },
  meadow: {
    colors: ['#5e6c24', '#53601f'],
    art: [
      smMounds([[0, 110, 196, 23], [90, 190, 120, 20], [24, 150, 300, 22], [100, 200, 392, 24], [-20, 70, 392, 19]], '#687829'),
      smTufts([[30, 60], [70, 80], [150, 40], [36, 230], [160, 180], [80, 260], [140, 350], [32, 330], [100, 140], [60, 372]], '#8ea33a'),
      `<g class="solo-art-fine">${[[30, 92, '#fde047'], [86, 46, '#f9a8d4'], [160, 140, '#ffffff'], [40, 202, '#fde047'], [100, 236, '#f9a8d4'], [170, 290, '#fde047'], [60, 330, '#ffffff'], [130, 384, '#f9a8d4'], [30, 276, '#f9a8d4'], [150, 74, '#fde047']]
        .map(([x, y, c]) => `<circle cx="${x}" cy="${y}" r="2.2" fill="${c}"/>`).join('')}${smWheat(148, 104)}${smWheat(64, 302)}</g>`
    ].join('')
  },
  mountain: {
    colors: ['#3a4558', '#434f64'],
    art: [
      smCloud(120, 22),
      smPeak(40, 80, 90, 70), smPeak(130, 110, 100, 85),
      smPeak(70, 210, 100, 75), smPeak(155, 250, 70, 55),
      smPeak(30, 320, 70, 55), smPeak(115, 385, 120, 85),
      smCloud(60, 262), smCloud(150, 170)
    ].join('')
  },
  wasteland: {
    colors: ['#583322', '#4c2b1c'],
    art: [
      '<path fill="none" stroke="#6e432d" stroke-width="3" stroke-linecap="round" d="M26 150q36 -14 72 0M96 340q40 -14 80 0M70 30q30 -10 60 0M30 250q24 -8 48 0"/>',
      '<path class="solo-art-fine" fill="none" stroke="#2f1a10" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" d="M150 26l-8 10l4 9l-7 8M30 96l10 6l-2 10l9 5M96 196l8 8l-3 9l6 6M34 384l9 -6l8 4l6 -8M166 236l-6 9l5 8"/>',
      smRock(62, 46, 1, ['#4a2c1e', '#6e4a36']), smRock(30, 326, 1.2, ['#4a2c1e', '#6e4a36']), smRock(146, 306, 0.9, ['#4a2c1e', '#6e4a36']),
      smDeadTree(88, 112), smDeadTree(168, 208), smDeadTree(84, 398),
      `<g class="solo-art-fine">${smBone(36, 214, 20)}${smBone(92, 288, -30)}${smBone(150, 140, 60)}</g>`,
      smSkull(160, 72), smSkull(130, 380)
    ].join('')
  },
  labyrinth: {
    colors: ['#3a3346', '#2f2a3a'],
    art: [
      '<rect width="360" height="100" fill="url(#{id}-brick)"/>',
      '<path fill="none" stroke="#5a5172" stroke-width="5" stroke-linecap="square" d="M14 20H70V62M40 42V86H110M100 14V44H130M346 20H290V62M320 42V86H250M260 14V44H230"/>',
      '<g class="solo-art-fine"><circle cx="150" cy="18" r="3.5" fill="#fb923c"/><circle cx="150" cy="17" r="1.6" fill="#fde68a"/><circle cx="210" cy="18" r="3.5" fill="#fb923c"/><circle cx="210" cy="17" r="1.6" fill="#fde68a"/></g>'
    ].join('')
  },
  castle: {
    colors: ['#1c0e30', '#3b1a4d'],
    art: [
      `<g class="solo-art-fine" fill="#f5e6ff" opacity="0.8">${[[24, 18], [72, 40], [112, 12], [150, 30], [214, 14], [250, 38], [330, 16], [350, 52], [96, 70], [262, 80], [8, 40], [188, 22]]
        .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.2"/>`).join('')}</g>`,
      '<path fill="#fde68a" transform="translate(300 30)" d="M0 -12A12 12 0 0 0 0 12A17 17 0 0 1 0 -12Z"/>',
      // Storm clouds, and lightning that flashes behind the castle towers (timed in effects.css).
      '<rect class="solo-flash" width="360" height="120" fill="#c4b5fd"/>',
      '<g class="solo-bolt" fill="none" stroke-linejoin="round" stroke-linecap="round"><path stroke="rgba(196,181,253,0.5)" stroke-width="5" d="M112 14L102 34H111L98 62"/><path stroke="#f5f3ff" stroke-width="1.6" d="M112 14L102 34H111L98 62"/></g>',
      '<g class="solo-bolt solo-bolt--b" fill="none" stroke-linejoin="round" stroke-linecap="round"><path stroke="rgba(196,181,253,0.5)" stroke-width="5" d="M250 20L260 38H251L264 64"/><path stroke="#f5f3ff" stroke-width="1.6" d="M250 20L260 38H251L264 64"/></g>',
      smStorm(40, 10, 1), smStorm(112, 14, 1.2), smStorm(186, 4, 1), smStorm(252, 18, 1.1), smStorm(330, 46, 0.9),
      '<circle cx="180" cy="70" r="52" fill="#a855f7" opacity="0.18"/>',
      smCastleSide,
      `<g transform="translate(360 0) scale(-1 1)">${smCastleSide}</g>`
    ].join('')
  }
};

function renderSoloMapBands() {
  const id = `smap${++soloMapUid}`;
  const half = SOLO_MAP_W / 2;
  const defs = [`<pattern id="${id}-brick" patternUnits="userSpaceOnUse" width="32" height="16"><path d="M0 0.5H32M0 8.5H32M8 0V8M24 8V16" stroke="#26212f" stroke-width="1.2" fill="none"/></pattern>`];
  const rects = [];
  const labels = [];
  SOLO_MAP_BANDS.forEach(([region, from, to, side]) => {
    const top = from === SOLO_FLOOR.CASTLE ? 0 : soloMapY(to) - 50;
    const bottom = from === 1 ? SOLO_MAP_H : soloMapY(from) + 50;
    const x = side === 'right' ? half : 0;
    const w = side === 'all' ? SOLO_MAP_W : half;
    const { colors, art } = SOLO_MAP_ART[region];
    const g = `${id}-${region}`;
    // Every band but the beach runs on past its bottom and fades out over the band below;
    // a right-hand band reaches under its left twin, which fades out over it.
    const fade = from === 1 ? 0 : SOLO_MAP_FADE;
    const rx = side === 'right' ? x - SOLO_MAP_SEAM : x;
    const rw = side === 'all' ? w : w + SOLO_MAP_SEAM;
    const rh = bottom - top + fade;
    defs.push(`<linearGradient id="${g}-fill" gradientUnits="userSpaceOnUse" x1="0" y1="${top}" x2="0" y2="${bottom}"><stop offset="0" stop-color="${colors[0]}"/><stop offset="1" stop-color="${colors[1]}"/></linearGradient>`);
    let mask = '';
    if (fade) {
      const seam = side === 'left'
        ? `<linearGradient id="${g}-h" gradientUnits="userSpaceOnUse" x1="${half - SOLO_MAP_SEAM}" y1="0" x2="${half + SOLO_MAP_SEAM}" y2="0"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000"/></linearGradient>`
        : '';
      defs.push(`<linearGradient id="${g}-v" gradientUnits="userSpaceOnUse" x1="0" y1="${bottom}" x2="0" y2="${bottom + fade}"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#000"/></linearGradient>${seam}`);
      defs.push(`<mask id="${g}-m" maskUnits="userSpaceOnUse" x="0" y="${top}" width="${SOLO_MAP_W}" height="${rh}"><rect x="0" y="${top}" width="${SOLO_MAP_W}" height="${rh}" fill="url(#${g}-v)"/>${seam ? `<rect x="0" y="${top}" width="${SOLO_MAP_W}" height="${rh}" fill="url(#${g}-h)"/>` : ''}</mask>`);
      mask = `mask="url(#${g}-m)"`;
    }
    rects.push(`<g ${mask}><rect x="${rx}" y="${top}" width="${rw}" height="${rh}" fill="url(#${g}-fill)"/><g transform="translate(${x} ${top})">${art.replace(/\{id\}/g, id)}</g></g>`);
    if (side !== 'all' || region === 'beach') {
      const r = SOLO_REGIONS[region];
      labels.push(`<span class="solo-region-label" style="${side === 'right' ? 'right' : 'left'}: 1.5%; top: ${((bottom - 18) / SOLO_MAP_H) * 100}%;"><span class="ce-emoji">${r.icon}</span> ${r.name}</span>`);
    }
  });
  // The sky darkens and reddens from the highlands up to the Labyrinth; the castle's own sky stays clear for the lightning.
  const skyTop = 60;
  const skyBottom = soloMapY(SOLO_MIDDLE_FLOORS) - 50;
  const at = y => ((y - skyTop) / (skyBottom - skyTop)).toFixed(3);
  defs.push(`<linearGradient id="${id}-sky" gradientUnits="userSpaceOnUse" x1="0" y1="${skyTop}" x2="0" y2="${skyBottom}">`
    + `<stop offset="0" stop-color="#3a0820" stop-opacity="0"/><stop offset="${at(140)}" stop-color="#3a0820" stop-opacity="0.45"/>`
    + `<stop offset="${at(380)}" stop-color="#3a0820" stop-opacity="0.2"/><stop offset="1" stop-color="#3a0820" stop-opacity="0"/></linearGradient>`);
  const sky = `<rect y="${skyTop}" width="${SOLO_MAP_W}" height="${skyBottom - skyTop}" fill="url(#${id}-sky)"/>`;
  return { defs: defs.join(''), rects: rects.join(''), sky, labels: labels.join('') };
}

// --- Map atmosphere (live map only): looping particles per region and a mist layer for parallax. ---
// [kind, x, y, w, h, count, seconds]: particles start somewhere in the box (map units); each loops in about `seconds`.
const SOLO_MAP_PARTICLES = [
  ['spray', 10, 1050, 340, 250, 8, 3],
  ['gull', 0, 1060, 0, 160, 1, 22],
  ['firefly', 14, 650, 150, 350, 8, 6],
  ['petal', 200, 640, 150, 340, 8, 7],
  ['snow', 6, 230, 168, 300, 10, 7],
  ['dust', 200, 250, 150, 340, 6, 6],
  ['ember', 200, 300, 150, 280, 2, 3.5],
  ['ember', 147, 132, 6, 4, 2, 3],
  ['ember', 207, 132, 6, 4, 2, 3],
  ['wisp', 20, 20, 300, 80, 5, 9]
];
// [left %, top %, width %] in the mist layer, which is 130% of the map's height.
const SOLO_MAP_MIST = [[-10, 2, 70], [50, 12, 60], [5, 24, 55], [45, 35, 65], [-5, 47, 60], [50, 58, 55], [0, 70, 65], [45, 81, 60], [5, 92, 55]];
const SM_GULL = '<svg viewBox="0 0 16 6"><path d="M1 5Q4 1 8 4Q12 1 15 5" fill="none" stroke="#f8fafc" stroke-width="1.5" stroke-linecap="round"/></svg>';
// The same seed gives the same particles on every render, so nothing jumps when you tap the map.
const smRand = n => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

function renderSoloAtmosphere() {
  let seed = 0;
  const r = () => smRand(++seed);
  const parts = SOLO_MAP_PARTICLES.flatMap(([kind, x, y, w, h, count, secs]) => Array.from({ length: fxCount(count) }, () => {
    const left = ((x + r() * w) / SOLO_MAP_W) * 100;
    const top = ((y + r() * h) / SOLO_MAP_H) * 100;
    const d = secs * (0.8 + r() * 0.4);
    const style = `left:${left.toFixed(1)}%;top:${top.toFixed(2)}%;--d:${d.toFixed(2)}s;--o:${(r() * d).toFixed(2)}s;--dx:${Math.round((r() - 0.5) * 40)}px`;
    return `<i class="solo-p solo-p--${kind}" style="${style}">${kind === 'gull' ? SM_GULL : ''}</i>`;
  })).join('');
  const mist = SOLO_MAP_MIST.map(([x, y, w], i) => `<i style="left:${x}%;top:${y}%;width:${w}%;--o:${i * 7}s"></i>`).join('');
  return `<div class="solo-atmo" aria-hidden="true">${parts}<div class="solo-mist" style="--sm-par:${soloMistOffset()}px">${mist}</div></div>`;
}

function soloEdgeWalked(a, b, path = solo.path) {
  const i = path.indexOf(a);
  return i >= 0 && path[i + 1] === b;
}

// `mini` = a small read-only map (end screen and history); `run` = whose route to draw;
// `peek` = the full map, read-only, in the peek sheet (tapping a node only shows its info).
function renderSoloMap(mini = false, run = solo, peek = false) {
  const { nodes, edges } = run.map;
  const reachable = mini ? [] : soloReachable();
  const ahead = mini ? new Set() : soloAhead(reachable);
  const bands = renderSoloMapBands();

  // With Tristan's Shortcut your choices are two floors up, so light both hops of the way there.
  const hops = !mini && solo.shortcut
    ? new Set(edges.filter(([a, b]) => a === run.at && edges.some(([c, d]) => c === b && reachable.includes(d))).map(([, b]) => b))
    : new Set();
  // Soft S-curves: every path leaves and enters its nodes vertically. Trail first, highlights on top.
  const trails = [];
  const highlights = [];
  edges.forEach(([a, b]) => {
    const p = soloNodePos(nodes[a]);
    const q = soloNodePos(nodes[b]);
    const m = (p.y + q.y) / 2;
    const d = `d="M${p.x} ${p.y}C${p.x} ${m} ${q.x} ${m} ${q.x} ${q.y}"`;
    const walked = soloEdgeWalked(a, b, run.path);
    const open = (a === run.at && (reachable.includes(b) || hops.has(b))) || (hops.has(a) && reachable.includes(b));
    const cut = !walked && !open && !(ahead.has(a) && ahead.has(b));
    // Dirt trail in the lowlands, stepping stones in the highlands, ink on the way into Pegasus' domain.
    const kind = ['labyrinth', 'castle'].includes(nodes[b].region) ? 'ink'
      : ['beach', 'forest', 'meadow'].includes(nodes[a].region) ? 'dirt' : 'stone';
    trails.push(kind === 'ink'
      ? `<g class="solo-edge solo-edge--ink ${cut ? 'solo-edge--cut' : ''}"><path class="solo-edge-a" ${d}/><path class="solo-edge-b" ${d}/></g>`
      : `<g class="solo-edge solo-edge--${kind} ${cut ? 'solo-edge--cut' : ''}">${kind === 'stone' ? `<path class="solo-edge-bed" ${d}/>` : ''}<path class="solo-edge-a" ${d}/><path class="solo-edge-b" ${d}/><path class="solo-edge-c" ${d}/></g>`);
    if (walked) highlights.push(`<path class="solo-edge-glow" ${d}/><path class="solo-edge-gold" ${d}/>`);
    else if (open) highlights.push(`<path class="solo-edge-dots" ${d}/>`);
  });
  const lines = `${trails.join('')}<g class="solo-edge">${highlights.join('')}</g>`;

  // The map scrolls to where you stand; before floor 1 that is the beach.
  const focusId = run.at || reachable[0];
  const buttons = Object.values(nodes).map(n => {
    const { x, y } = soloNodePos(n);
    const look = mini ? n.type : soloNodeLook(n, run);
    const t = SOLO_NODE_TYPES[look];
    const state = n.id === run.at ? 'current'
      : run.path.includes(n.id) ? 'visited'
        : reachable.includes(n.id) ? 'reachable'
          : ahead.has(n.id) ? 'ahead' : 'cut';
    const special = n.col === null ? 'solo-node--special' : '';
    const pos = `style="left: ${(x / SOLO_MAP_W) * 100}%; top: ${(y / SOLO_MAP_H) * 100}%;"`;
    // Layers: glow (type aura) < frame (shape, rim and fill) < icon. The state ring is the node's ::after.
    const stamp = state === 'visited' ? '<span class="solo-node-stamp" aria-hidden="true">✓</span>' : '';
    const inner = `<span class="solo-node-glow"></span><span class="solo-node-frame"></span><span class="solo-node-icon ce-emoji">${t.icon}</span>${stamp}`;
    if (mini) return `<span class="solo-node solo-node--${state} solo-node--${look} ${special}" ${pos}>${inner}</span>`;
    const picked = (peek ? soloUi.peekNode : soloUi.preview) === n.id;
    return `
      <button onclick="${peek ? 'tapSoloPeekNode' : 'tapSoloNode'}('${n.id}')" ${n.id === focusId ? (peek ? 'data-solo-peek-focus' : 'data-solo-focus') : ''} aria-label="${t.label}"
        class="solo-node solo-node--${state} solo-node--${look} ${special} ${picked ? 'solo-node--picked' : ''}"
        ${pos}>${inner}</button>
    `;
  }).join('');

  const focusKey = `${solo.at}`;
  if (!mini && !peek && soloUi.mapFocus !== focusKey) {
    soloUi.mapFocus = focusKey;
    setTimeout(() => document.querySelector('[data-solo-focus]')?.scrollIntoView({ block: 'center' }));
  }

  return `
    <div class="solo-map ${mini ? 'solo-map--mini' : ''} relative mx-auto w-full" style="max-width: ${mini ? 200 : SOLO_MAP_W + 40}px; aspect-ratio: ${SOLO_MAP_W} / ${SOLO_MAP_H};${mini ? '' : ` --sm-t: -${(performance.now() / 1000).toFixed(2)}s;`}" ${mini ? 'aria-hidden="true"' : ''}>
      <svg class="absolute inset-0 w-full h-full" viewBox="0 0 ${SOLO_MAP_W} ${SOLO_MAP_H}" preserveAspectRatio="none" aria-hidden="true">
        <defs>${bands.defs}</defs>
        ${bands.rects}
        ${bands.sky}
        ${lines}
      </svg>
      ${mini || peek ? '' : renderSoloAtmosphere()}
      ${bands.labels}
      ${buttons}
    </div>
  `;
}

// A node's info sheet. From the peek it has no Go button and sits above the peek sheet.
function renderSoloPreview(id = soloUi.preview, peek = false) {
  const n = solo.map.nodes[id];
  if (!n) return '';
  const look = soloNodeLook(n);
  const t = SOLO_NODE_TYPES[look];
  const r = SOLO_REGIONS[n.region];
  const reachable = soloReachable().includes(n.id);
  let note = '';
  if (n.id === 'labyrinth' && solo.chips >= SOLO_GATE_CHIPS) note = `You have ${SOLO_GATE_CHIPS} ⭐: you can skip the Labyrinth.`;
  else if (n.id === 'castle' && solo.chips < SOLO_GATE_CHIPS) note = `The doors are shut. You need ${SOLO_GATE_CHIPS} ⭐.`;
  else if (n.id === solo.at && peek) note = 'You are here.';
  else if (solo.path.includes(n.id)) note = 'You have been here.';
  else if (!reachable) note = "You can't reach this from where you stand.";
  else if (peek) note = 'You can go here next.';
  const fight = ['duelist', 'elite', 'labyrinth', 'castle'].includes(look);
  const eliteId = n.type === 'elite' ? n.elite || soloEliteFor(n.region) : n.type === 'labyrinth' ? 'paradox' : null;
  const e = eliteId && SOLO_ELITES[eliteId];
  return `
    <div class="${!peek || soloUi.peekSlide === 'node' ? 'solo-sheet' : ''} absolute inset-x-0 bottom-0 ${peek ? 'z-40' : 'z-20'} p-4 rounded-t-2xl border-t border-amber-500/50 bg-slate-900/95 backdrop-blur shadow-2xl">
      <div class="flex items-start gap-3">
        <span class="text-4xl leading-none ce-emoji">${t.icon}</span>
        <div class="flex-1 min-w-0">
          <p class="font-black text-white text-lg leading-tight">${t.label}</p>
          <p class="text-xs text-slate-400"><span class="ce-emoji">${r.icon}</span> ${r.name} · Floor ${n.floor}</p>
          <p class="text-sm text-slate-200 mt-1 leading-snug">${t.desc}</p>
          ${e ? `<p class="text-sm text-rose-200 mt-1 leading-snug"><span class="ce-emoji">${e.icon}</span> <b>${e.name}</b> ${e.plural ? 'wait' : 'waits'} here. ${e.gimmick}</p>` : ''}
          ${n.type === 'event' && n.event && !solo.path.includes(n.id) ? `<p class="text-sm text-violet-200 mt-1 leading-snug"><span class="ce-emoji">🔮</span> The Fortune Teller saw <span class="ce-emoji">${SOLO_EVENTS[n.event].icon}</span> <b>${SOLO_EVENTS[n.event].name}</b> here.</p>` : ''}
          ${fight && r.types.length ? `<p class="text-xs text-emerald-300 mt-1">Field: ${soloFieldText(n.region)}.</p>` : ''}
          ${note ? `<p class="text-xs text-amber-200 mt-1">${note}</p>` : ''}
        </div>
      </div>
      <div class="flex gap-2 mt-3">
        ${coopBtn('Close', peek ? 'closeSoloPeekNode()' : 'closeSoloPreview()')}
        ${reachable && !peek ? coopBtn('Go ➜', 'goSoloNode()', 'primary') : ''}
      </div>
    </div>
  `;
}

// The map peek: a tall sheet over a node or reward screen, opened from the status bar's Floor button.
function renderSoloPeek() {
  return `
    <div class="absolute inset-0 z-30 bg-black/60" onclick="closeSoloPeek()" aria-hidden="true"></div>
    <div class="${soloUi.peekSlide === 'map' ? 'solo-sheet' : ''} absolute inset-x-0 bottom-0 z-30 h-[88%] flex flex-col rounded-t-2xl border-t border-emerald-500/50 bg-slate-900/95 backdrop-blur shadow-2xl">
      <div class="shrink-0 px-4 pt-3 pb-2 flex items-center justify-between gap-2 border-b border-slate-800">
        <div class="min-w-0">
          <p class="font-black text-white leading-tight"><span class="ce-emoji">🗺️</span> Duelist's Road</p>
          <p class="text-xs text-slate-400">Just a peek. Finish here first, then pick your path.</p>
        </div>
        <button onclick="closeSoloPeek()" aria-label="Close the map" class="shrink-0 text-slate-300 hover:text-white text-xl px-2">✕</button>
      </div>
      <div data-solo-peek-scroll class="flex-1 min-h-0 overflow-y-auto no-scrollbar px-2 py-3">
        ${renderSoloMap(false, solo, true)}
      </div>
      <div class="shrink-0 p-3 border-t border-slate-800 flex">${coopBtn('Close', 'closeSoloPeek()')}</div>
    </div>
    ${soloUi.peekNode ? renderSoloPreview(soloUi.peekNode, true) : ''}
  `;
}

function renderSoloLegend() {
  const rows = Object.values(SOLO_NODE_TYPES).map(t => `
    <li class="flex items-start gap-2"><span class="text-xl leading-none ce-emoji">${t.icon}</span><span><b class="text-white">${t.label}</b> <span class="text-slate-400">${t.desc}</span></span></li>
  `).join('');
  return `
    <div class="solo-sheet absolute inset-x-0 bottom-0 z-20 p-4 rounded-t-2xl border-t border-amber-500/50 bg-slate-900/95 backdrop-blur shadow-2xl max-h-[70%] overflow-y-auto no-scrollbar">
      <p class="font-black text-white mb-2">Map legend</p>
      <ul class="text-xs space-y-2 leading-snug">${rows}</ul>
      <div class="flex mt-3">${coopBtn('Close', 'toggleSoloLegend()')}</div>
    </div>
  `;
}

function renderSoloMapScreen() {
  return `
    ${renderSoloHeader(`${SOLO_MAP_ICON} Duelist's Road`, `<button onclick="toggleSoloLegend()" aria-label="Map legend" class="text-slate-300 text-lg px-2">ⓘ</button>`)}
    ${renderSoloStatus()}
    <div class="solo-map-scroll flex-1 min-h-0 overflow-y-auto no-scrollbar px-2 py-3" onscroll="soloMapParallax(this)">
      ${renderSoloMap()}
      <div class="flex justify-center mt-4 mb-2">
        <button onclick="abandonSoloClick()" class="text-xs font-semibold px-3 py-1.5 rounded-lg ${soloUi.confirmAbandon ? 'bg-rose-600 text-white' : 'text-slate-400 bg-slate-800/70'}">${soloUi.confirmAbandon ? 'Tap again to abandon the run' : 'Abandon run'}</button>
      </div>
    </div>
    ${soloUi.preview ? renderSoloPreview() : soloUi.legend ? renderSoloLegend() : ''}
  `;
}

// --- Campfire, treasure and events --------------------------------------------------

function renderSoloNode() {
  const n = solo.map.nodes[solo.node];
  const t = SOLO_NODE_TYPES[n.type];
  let body;
  let buttons;
  if (n.type === 'campfire') {
    return renderSoloCampfire(n, t);
  } else if (n.type === 'treasure') {
    const ids = solo.offer?.ids || [];
    if (solo.nodeResult) {
      body = `<div class="coop-toast coop-toast--good rounded-lg px-3 py-2 text-sm leading-snug">${solo.nodeResult}</div>`;
      buttons = coopBtn('Continue ➜', 'leaveSoloNode()', 'primary');
    } else if (ids.length) {
      body = `<p class="text-sm text-slate-300">Someone lost their Duelist's Case. You may take one card.</p><div class="w-full max-w-sm space-y-2 text-left">${ids.map(soloRelicOption).join('')}</div>`;
      buttons = coopBtn('Leave it', 'leaveSoloNode()');
    } else {
      body = '<p class="text-sm text-slate-300">The case is empty. Someone got here first.</p>';
      buttons = coopBtn('Continue ➜', 'leaveSoloNode()', 'primary');
    }
  } else if (n.type === 'event' && solo.event) {
    return renderSoloEvent(n, t);
  } else {
    body = '<p class="text-sm text-slate-300">The mist clears. Whatever was here is gone.</p>';
    buttons = coopBtn('Continue ➜', 'leaveSoloNode()', 'primary');
  }
  return `
    ${renderSoloHeader(`<span class="ce-emoji">${t.icon}</span> ${t.label}`)}
    ${renderSoloStatus()}
    <div class="flex-1 min-h-0 overflow-y-auto no-scrollbar p-6 flex flex-col items-center justify-center text-center gap-3">
      <div class="coop-step-in coop-step-icon text-7xl leading-none ce-emoji solo-node-icon--${n.type}">${t.icon}</div>
      <p class="text-2xl font-black text-white">${t.label}</p>
      ${body}
      <div class="flex gap-2 w-full max-w-xs mt-2">${buttons}</div>
    </div>
  `;
}

// The campfire: pick one of rest, train with Joey or polish a relic.
function renderSoloCampfire(n, t) {
  let body;
  if (solo.nodeResult) {
    body = `<div class="coop-toast coop-toast--good rounded-lg px-3 py-2 text-sm leading-snug w-full max-w-sm">${solo.nodeResult}</div>
      <div class="flex gap-2 w-full max-w-xs mt-2">${coopBtn('Continue ➜', 'leaveSoloNode()', 'primary')}</div>`;
  } else if (soloUi.polishing) {
    const options = soloPolishable().map(id => {
      const r = SOLO_RELICS[id];
      return coopOption({ icon: `<span class="ce-emoji">${r.icon}</span>`, label: r.name, sub: `<span class="text-amber-300"><span class="ce-emoji">✨</span> ${r.polish.text}</span>` }, `soloPolishClick('${id}')`);
    }).join('');
    body = `<p class="text-sm text-slate-300 max-w-sm">Which relic do you polish? It stays upgraded for the rest of the run.</p>
      <div class="w-full max-w-sm space-y-2 text-left">${options}</div>
      <div class="flex gap-2 w-full max-w-xs mt-2">${coopBtn('← Back', 'closeSoloPolish()')}</div>`;
  } else {
    const ring = soloHas('ring') ? ' <span class="ce-emoji">💍</span> The Millennium Ring keeps you from resting well.' : '';
    const options = [
      coopOption({ icon: '<span class="ce-emoji">🔥</span>', label: 'Rest', sub: `Heal ${soloRestAmount()} LP (${soloCampfireHeal() * 100}% of your max LP).${ring}`, disabled: solo.lp >= solo.maxLp, reason: 'Your LP is already full.' }, 'soloRestClick()'),
      coopOption({ icon: '<span class="ce-emoji">💪</span>', label: 'Train with Joey', sub: `+${SOLO_CAMPFIRE_TRAIN} max LP for the rest of the run (and heal ${SOLO_CAMPFIRE_TRAIN}).` }, 'soloTrainClick()'),
      coopOption({ icon: '<span class="ce-emoji">✨</span>', label: 'Polish a relic', sub: 'Upgrade one of your relics for the rest of the run.', disabled: !soloPolishable().length, reason: solo.relics.length ? "None of your relics can be polished." : 'You have no relics to polish yet.' }, 'openSoloPolish()')
    ].join('');
    body = `<p class="text-sm text-slate-200 italic max-w-sm leading-snug">Yugi and his friends wave you over to their fire. There's time for one thing before the night is over.</p>
      <div class="w-full max-w-sm space-y-2 text-left mt-1">${options}</div>`;
  }
  return `
    ${renderSoloHeader(`<span class="ce-emoji">${t.icon}</span> ${t.label}`)}
    ${renderSoloStatus()}
    <div class="flex-1 min-h-0 overflow-y-auto no-scrollbar p-6 flex flex-col items-center justify-center text-center gap-3">
      <div class="coop-step-in coop-step-icon text-7xl leading-none ce-emoji solo-node-icon--campfire">${t.icon}</div>
      <p class="text-[0.7rem] font-bold uppercase tracking-widest text-orange-300"><span class="ce-emoji">${SOLO_REGIONS[n.region].icon}</span> ${SOLO_REGIONS[n.region].name}</p>
      <p class="text-2xl font-black text-white -mt-2">${t.label}</p>
      ${body}
    </div>
  `;
}

// A Shadow Game: the scene, the choices (the Millennium Key reveals secret
// outcomes), then the result.
function renderSoloEvent(n, t) {
  const ev = solo.event;
  const e = SOLO_EVENTS[ev.id];
  const key = soloHas('key');
  let body;
  if (ev.result) {
    body = `<div class="coop-toast coop-toast--${ev.result.tone} rounded-lg px-3 py-2 text-sm leading-snug w-full max-w-sm">${ev.result.text}</div>
      <div class="flex gap-2 w-full max-w-xs mt-2">${ev.ambush ? coopBtn("⚔️ It's time to duel!", 'soloAmbushClick()', 'danger') : coopBtn('Continue ➜', 'leaveSoloNode()', 'primary')}</div>`;
  } else if (ev.rolling) {
    body = renderSoloRoll(ev);
  } else {
    const options = ev.choices.map((c, i) => {
      const sub = c.secret && key ? `${c.sub}<br><span class="text-amber-300"><span class="ce-emoji">🗝️</span> ${c.roll ? `Could be: ${c.reveal}` : c.reveal}</span>` : c.sub;
      const roll = c.roll ? ` <span class="ce-emoji">${c.roll.dice === 'coin' ? '🪙' : '🎲'}</span>` : '';
      return coopOption({ icon: `<span class="ce-emoji">${c.icon}</span>`, label: c.label + roll, sub, disabled: c.disabled, reason: c.reason }, `pickSoloEventChoice(${i})`);
    }).join('');
    body = `<p class="text-sm text-slate-200 italic max-w-sm leading-snug">${ev.text}</p><div class="w-full max-w-sm space-y-2 text-left mt-1">${options}</div>`;
  }
  return `
    ${renderSoloHeader(`<span class="ce-emoji">${t.icon}</span> ${t.label}`)}
    ${renderSoloStatus()}
    <div class="flex-1 min-h-0 overflow-y-auto no-scrollbar p-6 flex flex-col items-center justify-center text-center gap-3">
      <div class="coop-step-in coop-step-icon text-7xl leading-none ce-emoji solo-node-icon--event">${e.icon}</div>
      <p class="text-[0.7rem] font-bold uppercase tracking-widest text-violet-300"><span class="ce-emoji">${SOLO_REGIONS[n.region].icon}</span> Shadow Game</p>
      <p class="text-2xl font-black text-white -mt-2">${e.name}</p>
      ${body}
    </div>
  `;
}

// The physical roll: you flip or roll for real and tap what it showed.
function renderSoloRoll(ev) {
  const st = ev.rolling;
  const c = ev.choices[st.i];
  const r = c.roll;
  const quote = v => (typeof v === 'string' ? `'${v}'` : v);
  const faceBtn = (v, label, handler, picked = false) => `<button onclick="${handler}(${quote(v)})" class="${r.dice === 'coin' ? 'flex-1 py-4' : 'py-3'} rounded-xl font-black text-xl transition border ${picked ? 'bg-amber-500 border-amber-400 text-slate-950' : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-white'}">${label}</button>`;
  const dieBtns = (handler, showPicks = false) => `<div class="grid grid-cols-3 gap-2 w-full">${[1, 2, 3, 4, 5, 6].map(n => faceBtn(n, n, handler, showPicks && st.picks.includes(n))).join('')}</div>`;
  let prompt;
  let buttons;
  if (r.pick && !st.locked) {
    const ready = st.picks.length === r.pick;
    prompt = ready
      ? `You chose ${st.picks.join(' and ')}. Lock ${r.pick === 1 ? 'it' : 'them'} in, then roll.`
      : `Choose ${r.pick === 1 ? 'your number' : `${r.pick} numbers`} first, then roll the die.`;
    buttons = `${dieBtns('soloEventNumberClick', true)}
      ${ready ? `<button onclick="lockSoloRollClick()" class="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-98 text-slate-950 font-bold transition"><span class="ce-emoji">🔒</span> Lock in</button>` : ''}`;
  } else if (r.dice === 'coin') {
    prompt = 'Flip a real coin, then tap the side it landed on.';
    buttons = `<div class="flex gap-2 w-full">${faceBtn('heads', '<span class="ce-emoji">🪙</span> Heads', 'soloEventRollClick')}${faceBtn('tails', '<span class="ce-emoji">🪙</span> Tails', 'soloEventRollClick')}</div>`;
  } else if (r.versus) {
    const loaded = r.bonus ? ` (your loaded die adds +${r.bonus})` : '';
    prompt = st.you === null
      ? `${st.tie ? 'A tie! Roll again. ' : ''}Roll YOUR die and tap the result${loaded}.`
      : `You rolled ${st.you}. Now roll ${r.versus}'s die and tap the result.`;
    buttons = dieBtns('soloEventRollClick');
  } else {
    prompt = r.pick ? `You chose ${st.picks.join(' and ')}. Roll the die and tap the result.` : 'Roll a real die, then tap the number it landed on.';
    buttons = dieBtns('soloEventRollClick');
  }
  return `
    <div class="w-full max-w-sm space-y-3">
      <p class="text-lg font-black text-white"><span class="ce-emoji">${c.icon}</span> ${c.label}</p>
      <p class="text-sm text-slate-300 italic leading-snug">${c.sub}</p>
      <p class="text-sm font-bold text-amber-300"><span class="ce-emoji">${r.dice === 'coin' ? '🪙' : '🎲'}</span> ${prompt}</p>
      ${buttons}
      <div class="flex gap-2 pt-1">${coopBtn('← Back', 'cancelSoloRollClick()')}</div>
    </div>`;
}

// --- Fight --------------------------------------------------------------------------

function renderSoloFight() {
  const f = solo.fight;
  const kind = { duelist: 'Duelist', elite: 'Elite', gate: 'Labyrinth guard', ambush: 'Ambush', boss: f.title || 'Castle guard' }[f.kind];
  const p = SOLO_PERSONALITIES[f.personality];
  return `
    ${renderSoloHeader(`<span class="ce-emoji">${f.icon}</span> ${kind}`, renderSoloTurnBadge(f))}
    <div class="flex-1 min-h-0 overflow-y-auto no-scrollbar px-3 pt-3 flex flex-col gap-2">
      ${renderSoloEnemyBoard(f, p)}
      ${renderSoloRelicBar()}
    </div>
    <div class="shrink-0 max-h-[60%] overflow-y-auto no-scrollbar p-3 flex flex-col gap-2">
      ${f.turn === 'enemy' ? renderSoloStepCard() : soloUi.panel ? renderSoloPanel() : renderSoloPlayer(f)}
    </div>
    ${f.intro ? renderSoloFightIntro(f, kind, p) : f.cutscene ? renderSoloCutscene(f) : ''}
  `;
}

// Pegasus moves to his next stage mid-duel.
function renderSoloCutscene(f) {
  const c = SOLO_PEGASUS.cutscenes[f.cutscene];
  if (!c) return '';
  return `
    <div class="solo-intro solo-cutscene fixed inset-0 z-50 flex flex-col backdrop-blur overflow-y-auto no-scrollbar p-6">
      <div class="my-auto flex flex-col items-center text-center gap-2">
        <div class="coop-cut-icon text-7xl leading-none ce-emoji">${c.icon}</div>
        <p class="text-[0.7rem] font-bold uppercase tracking-widest text-fuchsia-300">${f.name} · ${f.lp} LP</p>
        <p class="text-2xl font-black text-white">${c.title}</p>
        <p class="text-sm italic text-amber-100 max-w-sm">“${c.quote}”</p>
        <ul class="text-left text-sm text-slate-200 space-y-1.5 max-w-sm leading-snug mt-2">${c.rules.map(l => `<li>${soloEmojiLead(l)}</li>`).join('')}</ul>
        <button onclick="dismissSoloCutscene()" class="mt-3 px-8 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-lg">Continue ➜</button>
      </div>
    </div>
  `;
}

// Wraps the emoji a line starts with ("📖 Toon World…").
const soloEmojiLead = s => s.replace(/^(\S+)\s/, '<span class="ce-emoji">$1</span> ');
const SOLO_PEGASUS_STAGES = ['Toon World', 'Millennium Eye', 'Final Read'];

function renderSoloEnemyBoard(f, p) {
  const pct = Math.max(0, (f.lp / f.maxLp) * 100);
  const r = soloRegion(f.region);
  const g = f.pegasus;
  const monsters = f.monsters.map(m => {
    const st = soloStats(m, f);
    const boosted = soloBoosted(f, m);
    return `
      <div class="solo-monster solo-monster--${m.pos} rounded-xl border px-2 py-1.5 flex items-center gap-2">
        <span class="text-2xl leading-none ce-emoji">${m.icon}</span>
        <span class="flex-1 min-w-0">
          <span class="block text-xs font-bold text-white truncate">${m.name}</span>
          <span class="block text-[0.7rem] tabular-nums">
            <b class="${m.pos === 'atk' ? 'text-rose-300' : 'text-slate-400'}">${st.atk}</b><span class="text-slate-500"> / </span><b class="${m.pos === 'def' ? 'text-sky-300' : 'text-slate-400'}">${st.def}</b>
            ${boosted ? `<span class="ce-emoji" title="Field bonus">${r.icon}</span>` : ''}${m.equip ? `<span class="text-amber-300"> +${m.equip}⚔️</span>` : ''}${m.bound ? '<span class="ce-emoji" title="Spellbinding Circle: can\'t attack"> 🔯</span>' : ''}${m.hatch ? `<span class="text-amber-200" title="Hatches into Great Moth"> <span class="ce-emoji">🦋</span> in ${m.hatch}</span>` : ''}            ${m.risen ? '<span class="ce-emoji" title="Risen: stays dead next time"> 🧟</span>' : ''}${m.toon ? '<span class="ce-emoji" title="Toon: attacks directly and can\'t be blocked"> 🤪</span>' : ''}
          </span>
        </span>
        <span class="text-[0.6rem] font-black uppercase ${m.pos === 'atk' ? 'text-rose-300' : 'text-sky-300'}">${m.pos === 'atk' ? '⚔️ ATK' : '🛡️ DEF'}</span>
      </div>
    `;
  }).join('');
  const trap = f.trap ? '<div class="solo-trap rounded-xl border border-violet-500/60 bg-violet-950/40 px-2 py-1.5 flex items-center gap-2 text-xs font-bold text-violet-200"><span class="text-2xl leading-none ce-emoji">🂠</span>Face-down card</div>' : '';
  const book = soloToonWorldUp(f)
    ? `<div class="solo-book rounded-xl border border-fuchsia-500/60 bg-fuchsia-950/40 px-2 py-1.5 flex items-center gap-2 text-xs font-bold text-fuchsia-200"><span class="text-2xl leading-none ce-emoji">📖</span><span class="flex-1">Toon World</span><span class="ce-emoji" title="${g.pages} pages left">${'📄'.repeat(g.pages)}</span></div>`
    : '';
  const where = g ? `<span class="text-fuchsia-300">Stage ${g.stage}: ${SOLO_PEGASUS_STAGES[g.stage - 1]}</span>` : `<span class="ce-emoji">${r.icon}</span> ${r.name}`;
  return `
    <section class="solo-enemy rounded-2xl border border-rose-500/30 bg-slate-950/80 p-3">
      <div class="flex items-center gap-2">
        <span class="text-3xl leading-none ce-emoji">${f.icon}</span>
        <div class="flex-1 min-w-0">
          <p class="font-black text-white truncate">${f.name}</p>
          <p class="text-[0.65rem] text-slate-400"><span class="ce-emoji">${p.icon}</span> ${p.label} · ${where}</p>
        </div>
      </div>
      <div data-solo-enemy class="relative mt-2 h-5 rounded-full bg-slate-800 overflow-hidden">
        <div class="h-full bg-gradient-to-r from-rose-600 to-amber-500 transition-all duration-500" style="width: ${pct}%"></div>
        <span class="absolute inset-0 flex items-center justify-center text-xs font-black text-white drop-shadow">${f.lp} / ${f.maxLp} LP</span>
      </div>
      <div class="mt-2 grid grid-cols-1 gap-1.5">
        ${monsters || trap || book ? book + monsters + trap : '<p class="text-xs text-slate-400 italic text-center py-1">No monsters. Attack directly!</p>'}
      </div>
      ${f.monsters.some(m => m.bunny) ? '<p class="text-[0.65rem] text-pink-300 mt-2 text-center"><span class="ce-emoji">🐰</span> Funny Bunny is out: Pegasus takes no damage.</p>' : ''}
      ${r.types.length ? `<p class="text-[0.65rem] text-emerald-300/90 mt-2 text-center">Field: ${soloFieldText(f.region)}. Yours too!</p>` : ''}
    </section>
  `;
}

// With the Millennium Eye the intents name the exact cards.
function soloIntentDetail(f, action, peek = {}) {
  const base = SOLO_ACTIONS[action].label;
  if (action === 'summon' && peek.card) {
    const c = peek.card;
    const st = soloStats(c, f);
    return `Summon <span class="ce-emoji">${c.icon}</span> <b>${c.name}</b> (${peek.pos === 'atk' ? `${st.atk} ATK, Attack Position` : `${st.def} DEF, Defense Position`})`;
  }
  if (action === 'equip' && peek.equip) return `Equip <b>${peek.equip.name}</b> (+${peek.equip.atk} ATK)`;
  if (action === 'trap') return 'Set a <b>face-down card</b>';
  if (action === 'removal') {
    const r = soloCards(f).removal;
    return `<b>${r.name}</b>: ${r.text.toLowerCase().replace(/\.$/, '')}`;
  }
  if (action === 'heal') {
    const h = soloCards(f).heal;
    return `<b>${h.name}</b> (+${h.lp} LP)`;
  }
  const special = f.elite && SOLO_ELITES[f.elite]?.specialCard;
  if (action === 'special' && special) return `Play <b>${special}</b>`;
  if (action === 'crush' && peek.cardType) return `<b>Mind Crush</b>: you must discard a <b>${peek.cardType}</b> card`;
  if (action === 'glare') return `<b>Millennium Glare</b>: ${soloGlareDamage(f)} damage to your LP`;
  if (action === 'bluff' && peek.options) {
    const fake = peek.options.find(o => o !== peek.real);
    const real = peek.real === 'crush' ? `Mind Crush (<b>${peek.cardType}</b>)` : SOLO_PEGASUS.bluffs[peek.real].text;
    return `<b>${real}</b> <span class="text-slate-400">(the ${SOLO_PEGASUS.bluffs[fake].text} is a bluff)</span>`;
  }
  return base;
}

// Pegasus' bluff shows both moves; only one of them is real.
const soloBluffText = peek => peek.options.map(o => `<span class="ce-emoji">${SOLO_PEGASUS.bluffs[o].icon}</span> ${SOLO_PEGASUS.bluffs[o].text}`).join(' <i class="text-slate-400">or</i> ');

function soloIntentLines(f) {
  const eye = soloHas('eye');
  const g = f.pegasus;
  // Stage 2: his Millennium Eye hides his moves, unless you hold one too.
  if (g?.stage === 2 && !eye) return f.intents.map(() => ({ icon: '❓', label: '???' }));
  const lines = f.intents.map((a, i) => {
    const pk = f.peek?.[i] || {};
    if (a === 'bluff' && !eye && pk.options) return { icon: '🎭', label: soloBluffText(pk) };
    const detail = eye || (f.video && f.round === 1 && a === 'summon');
    return { ...SOLO_ACTIONS[a], label: detail ? soloIntentDetail(f, a, pk) : SOLO_ACTIONS[a].label };
  });
  if (g?.stage === 2) lines.unshift({ icon: '👁️', label: `<i class="text-amber-200">${SOLO_PEGASUS.eyeLine}</i>` });
  return lines;
}

function renderSoloPlayer(f) {
  const toast = soloUi.toast;
  const action = (icon, label, onclick, disabled) => `
    <button onclick="${onclick}" ${disabled ? 'disabled' : ''} class="rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 py-2 text-white transition disabled:opacity-35">
      <span class="block text-lg leading-none ce-emoji">${icon}</span><span class="block text-[0.7rem] font-bold mt-0.5">${label}</span>
    </button>
  `;
  const intents = soloIntentLines(f);
  if (f.grave?.length) intents.unshift({ icon: '🧟', label: `Raise ${f.grave.map(m => m.name).join(', ')} from the Graveyard` });
  if (f.monsters.some(m => m.hatch === 1)) intents.unshift({ icon: '🦋', label: 'Hatch the cocoon into Great Moth' });
  return `
    <div class="rounded-xl border border-rose-500/30 bg-rose-950/20 px-3 py-2">
      <p class="text-[0.65rem] font-bold uppercase tracking-widest text-rose-300 mb-1"><span class="ce-emoji">👁️</span> Next turn the enemy will</p>
      ${intents.map(a => `<p class="text-xs text-slate-200 leading-snug"><span class="mr-1 ce-emoji">${a.icon}</span>${a.label}</p>`).join('')}
      <p class="text-xs text-slate-200 leading-snug"><span class="mr-1 ce-emoji">⚔️</span>Attack with every monster in Attack Position</p>
    </div>
    <div class="coop-panel coop-panel--active rounded-2xl p-3 flex flex-col gap-2 mt-auto">
      <div class="flex items-center justify-between gap-2">
        <div class="min-w-0">
          <p class="text-xs font-bold uppercase tracking-widest text-amber-400">You</p>
          <p class="text-sm font-semibold text-slate-200 truncate">${f.battleOver ? (f.first === 'player' && f.round === 1 ? '🚫 You go first: no attack this turn' : '🪤 Your Battle Phase is over') : '⚔️ Your turn'}</p>
        </div>
        <button data-solo-me onclick="openSoloPanel('lp')" class="text-3xl font-black tabular-nums px-2 text-white">${solo.lp}</button>
      </div>
      ${toast ? `<div class="coop-toast coop-toast--${toast.tone} rounded-lg px-3 py-2 text-sm leading-snug">${toast.text}</div>` : ''}
      <div class="grid grid-cols-3 gap-1.5">
        ${action('⚔️', 'Attack', "openSoloPanel('attack')", f.battleOver)}
        ${action('✨', 'Effect', "openSoloPanel('effect')")}
        <button onclick="endSoloTurnClick()" class="coop-end-turn rounded-xl bg-amber-500 hover:bg-amber-400 py-2 text-slate-950 transition"><span class="block text-lg leading-none">➜</span><span class="block text-[0.7rem] font-black mt-0.5">End turn</span></button>
      </div>
      ${soloUi.undo.length ? `<button onclick="undoSolo()" class="self-center text-xs text-slate-400 hover:text-white px-2 py-1">↩️ Undo last step</button>` : ''}
    </div>
  `;
}

function renderSoloPanelShell(title, body) {
  return `
    <div class="coop-panel coop-panel--active rounded-2xl p-3 flex flex-col gap-2 mt-auto">
      <div class="flex items-center justify-between gap-2">
        <p class="font-bold text-white">${title}</p>
        <button onclick="closeSoloPanel()" class="text-sm text-slate-400 hover:text-white px-2 py-1">✕ Cancel</button>
      </div>
      ${body}
    </div>
  `;
}

const soloMonsterOption = (m, onclick) => {
  const st = soloStats(m);
  const sub = m.pos === 'atk' ? `${st.atk} ATK · Attack Position` : `${st.def} DEF · Defense Position`;
  return coopOption({ icon: m.icon, label: m.name, sub }, onclick);
};

function renderSoloPanel() {
  const f = solo.fight;
  const panel = soloUi.panel;

  if (panel.type === 'attack') {
    if (!panel.target) {
      const bookUp = soloToonWorldUp(f);
      const options = f.monsters.length
        ? f.monsters.map(m => soloMonsterOption(m, `setSoloPanel({ target: '${m.uid}' })`)).join('')
        : bookUp ? '' : coopOption({ icon: f.icon, label: 'Direct attack', sub: `${f.name} has no monsters` }, "setSoloPanel({ target: 'direct' })");
      const book = bookUp
        ? coopOption({ icon: '📖', label: 'Toon World', sub: `${f.pegasus.pages} page${f.pegasus.pages === 1 ? '' : 's'} left · ${SOLO_PEGASUS.pageMinAtk}+ ATK tears one out · shields Pegasus` }, "setSoloPanel({ target: 'book' })")
        : '';
      return renderSoloPanelShell('⚔️ Attack: choose a target', options + book);
    }
    const book = panel.target === 'book';
    const m = panel.target !== 'direct' && !book && soloMonster(Number(panel.target));
    const title = book ? '⚔️ 📖 Toon World' : m ? `⚔️ ${m.icon} ${m.name}` : '⚔️ Direct attack';
    const bonuses = [];
    if (book) bonuses.push(`<span class="ce-emoji">📄</span> ${SOLO_PEGASUS.pageMinAtk}+ ATK tears out a page. No damage to Pegasus.`);
    else if (soloToonWorldUp(f)) bonuses.push(`<span class="ce-emoji">📖</span> Toon World shields Pegasus: no battle damage to him.`);
    if (soloHas('legendary-sword') && f.swordRound !== f.round) bonuses.push(`<span class="ce-emoji">🗡️</span> Legendary Sword adds +${soloRelicValue('legendary-sword')} to this attack.`);
    if (f.pep) bonuses.push(`<span class="ce-emoji">💪</span> Pep talk adds +${f.pep} to this attack.`);
    if (f.lunch) bonuses.push(`<span class="ce-emoji">🍙</span> Full stomach: −${SOLO_EVENT_MODS.lunch.value} on this attack.`);
    const axe = soloRelicReady('axe')
      ? `<button onclick="toggleSoloAxe()" aria-pressed="${!!panel.axe}" class="w-full py-1.5 rounded-lg text-xs font-bold ${panel.axe ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300 border border-slate-700'}"><span class="ce-emoji">🪓</span> Axe of Despair +${SOLO_RELICS.axe.value} ${panel.axe ? '(on)' : '(off)'}</button>`
      : '';
    return renderSoloPanelShell(title, axe + bonuses.map(b => `<p class="text-xs text-amber-200">${b}</p>`).join('') + soloKeypad("Your attacking monster's ATK",
      coopBtn('← Back', 'setSoloPanel({ target: null })') + coopBtn('⚔️ Attack!', 'confirmSoloAttack()', 'primary', !soloUi.input), true));
  }

  if (panel.type === 'effect') {
    if (!panel.kind) {
      const options = [
        coopOption({ icon: '💥', label: 'Destroy a monster', sub: 'Raigeki, Fissure, Dark Hole…', disabled: !f.monsters.length, reason: 'The enemy has no monsters' }, "setSoloPanel({ kind: 'destroy' })"),
        coopOption({ icon: '🌪️', label: 'Destroy a Spell/Trap', sub: 'Mystical Space Typhoon, Harpie\'s Feather Duster…', disabled: !f.trap && !f.monsters.some(m => m.equip), reason: 'The enemy has no face-down or equip card' }, "setSoloPanel({ kind: 'spelltrap' })"),
        coopOption({ icon: '🔥', label: 'Burn damage', sub: 'Damage straight to the enemy\'s LP', disabled: soloToonWorldUp(f), reason: 'Toon World shields Pegasus: tear out all its pages first' }, "setSoloPanel({ kind: 'burn' })")
      ];
      if (soloHas('raigeki')) {
        options.unshift(coopOption({ icon: '<span class="ce-emoji">⚡</span>', label: 'Raigeki (relic)', sub: "Destroy all the enemy's monsters. Used up.", disabled: !f.monsters.length, reason: 'The enemy has no monsters' }, 'confirmSoloRaigeki()'));
      }
      return renderSoloPanelShell('✨ Card effect', options.join(''));
    }
    if (panel.kind === 'destroy') {
      return renderSoloPanelShell('💥 Destroy which monster?', f.monsters.map(m => soloMonsterOption(m, `confirmSoloDestroy(${m.uid})`)).join('') +
        `<div class="flex">${coopBtn('← Back', 'setSoloPanel({ kind: null })')}</div>`);
    }
    if (panel.kind === 'spelltrap') {
      const trap = f.trap ? coopOption({ icon: '🂠', label: 'Face-down card', sub: 'Set Spell/Trap Card' }, 'confirmSoloDestroyTrap()') : '';
      const equips = f.monsters.filter(m => m.equip).map(m => coopOption({ icon: m.icon, label: `${m.name}'s equip`, sub: `+${m.equip} ATK` }, `confirmSoloDestroyEquip(${m.uid})`)).join('');
      return renderSoloPanelShell('🌪️ Destroy which card?', trap + equips +
        `<div class="flex">${coopBtn('← Back', 'setSoloPanel({ kind: null })')}</div>`);
    }
    if (panel.kind === 'burn') {
      return renderSoloPanelShell('🔥 Burn damage', soloKeypad('Damage on the card',
        coopBtn('← Back', 'setSoloPanel({ kind: null })') + coopBtn('🔥 Burn!', 'confirmSoloBurn()', 'primary', !soloUi.input)));
    }
  }

  if (panel.type === 'lp') {
    return renderSoloPanelShell(`❤️ Your LP: ${solo.lp}`, soloKeypad('Costs, self-damage or healing',
      coopBtn('− Damage', 'confirmSoloLp(-1)', 'danger', !soloUi.input) + coopBtn('+ Heal', 'confirmSoloLp(1)', 'primary', !soloUi.input)));
  }

  return renderSoloPlayer(f);
}

function renderSoloStepCard() {
  const f = solo.fight;
  const step = soloStep();
  if (!step) return '';
  // The step card animates in only when a new step comes up.
  const key = `${f.round}:${f.stepIndex}:${step.sub || ''}`;
  const fresh = key !== soloUi.shownStep;
  soloUi.shownStep = key;

  const row = buttons => `<div class="flex flex-wrap gap-2 justify-center">${buttons.join('')}</div>`;
  const text = (t, cls = 'text-slate-200') => (t ? `<p class="text-sm text-center leading-snug ${cls}">${t}</p>` : '');
  const title = `
    <div class="text-center ${fresh ? 'coop-step-in' : ''}">
      <div class="coop-step-icon text-5xl leading-none ce-emoji">${step.icon}</div>
      <p class="mt-1 text-lg font-black text-white leading-tight">${step.title}</p>
    </div>
  `;
  const cont = coopBtn('Continue ➜', 'soloContinueStep()', 'primary');
  let body;

  if (step.sub === 'done') {
    body = title + `<div class="coop-toast coop-toast--${step.result?.tone || 'meh'} rounded-lg px-3 py-2 text-sm text-center leading-snug">${step.result?.text || ''}</div>` + row([cont]);
  } else if (step.sub === 'rex') {
    body = title + `<div class="coop-toast coop-toast--${step.result?.tone || 'meh'} rounded-lg px-3 py-2 text-sm text-center leading-snug">${step.result?.text || ''}</div>` +
      text('<span class="ce-emoji">🦖</span> Rex Raptor: <b>is your field empty of monsters?</b> Then his Dinosaur attacks again!', 'text-amber-200') +
      row([coopBtn('No, I have monsters', 'soloRexAgainClick(false)'), coopBtn(`🦖 Yes, take ${step.atk}`, 'soloRexAgainClick(true)', 'danger')]);
  } else if (step.kind === 'info') {
    const trapBtn = step.type === 'summon' && step.summonUid ? coopBtn('<span class="ce-emoji">🪤</span> Trap: destroy monster', 'soloTrapSummonClick()') : '';
    body = title + text(step.text) + text(step.note, 'text-xs text-rose-300') + row([trapBtn, cont]);
  } else if (step.kind === 'attack' && step.sub === 'block') {
    const pos = soloUi.blockPos;
    const toggle = ['atk', 'def'].map(p => `<button onclick="setSoloBlockPos('${p}')" class="flex-1 py-1.5 rounded-lg text-xs font-bold ${pos === p ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300'}">${p === 'atk' ? 'Attack position' : 'Defense position'}</button>`).join('');
    body = `<p class="text-sm font-bold text-white text-center"><span class="ce-emoji">${step.icon}</span> ${step.title.replace(' directly!', '')} (${step.atk})</p><div class="flex gap-2">${toggle}</div>` +
      soloKeypad(`Your blocking monster's ${pos.toUpperCase()}`, coopBtn('← Back', 'cancelSoloBlock()') + coopBtn('🛡️ Block', 'confirmSoloBlock()', 'primary', !soloUi.input), pos === 'atk');
  } else if (step.kind === 'attack') {
    const waboku = soloWabokuActive();
    const relics = SOLO_DEFENSE_RELICS.filter(soloRelicReady).map(id => coopBtn(`<span class="ce-emoji">${SOLO_RELICS[id].icon}</span> ${SOLO_RELICS[id].name}`, `soloRelicDefendClick('${id}')`));
    if (f.swarm) relics.push(coopBtn('<span class="ce-emoji">🧸</span> Kuriboh Swarm', "soloRelicDefendClick('swarm')"));
    body = title + text(step.toon ? `ATK <b class="text-rose-300">${step.atk}</b>. <span class="ce-emoji">🤪</span> Toons can't be blocked!` : `ATK <b class="text-rose-300">${step.atk}</b>. Each of your monsters can block once per turn.`) +
      text(step.note, 'text-xs text-fuchsia-300') +
      (waboku ? text('🛐 Waboku protects you this turn: no battle damage.', 'text-xs text-emerald-300') : '') +
      row([step.toon ? '' : coopBtn('🛡️ Block with a monster', 'startSoloBlock()', 'primary'), waboku ? coopBtn('🛐 Take 0', 'soloTakeHitClick()') : coopBtn(`💔 Take ${step.atk}`, 'soloTakeHitClick()', 'danger')]) +
      row([coopBtn('<span class="ce-emoji">🪤</span> Trap: negate attack', "soloTrapDefendClick('negate')"), coopBtn('<span class="ce-emoji">🪞</span> Trap: destroy attacker', "soloTrapDefendClick('destroy')")]) +
      (relics.length ? row(relics) : '');
  } else if (step.kind === 'crush') {
    body = title + text(`His Millennium Eye reads your hand and names <b>${step.cardType}</b>. Discard a ${step.cardType} card.`) +
      text(step.bluffNote, 'text-xs text-rose-300') +
      text(`No ${step.cardType} card in your hand? He read you wrong and takes ${SOLO_PEGASUS.crushMiss}.`, 'text-xs text-slate-400') +
      row([coopBtn('🗑️ I discarded one', 'soloCrushClick(true)', 'danger'), coopBtn('🙅 I have none', 'soloCrushClick(false)', 'primary')]);
  } else if (step.kind === 'restrict') {
    body = title + text('It absorbs your strongest monster. Remove it from your field: Restrict takes its ATK.') +
      soloKeypad("Your strongest monster's ATK", coopBtn('🙅 No monsters', 'soloAbsorbClick(true)') + coopBtn('🧿 Absorb', 'soloAbsorbClick(false)', 'primary', !soloUi.input), true);
  } else {
    body = title + row([cont]);
  }

  return `
    <div class="coop-panel coop-panel--boss rounded-2xl p-3 flex flex-col gap-2 mt-auto">
      <div class="flex items-center justify-between text-xs">
        <span class="font-bold uppercase tracking-widest text-rose-300"><span class="ce-emoji">${f.icon}</span> Enemy turn · ${f.stepIndex + 1}/${f.steps.length}</span>
        <span data-solo-me class="font-bold tabular-nums text-white">You · ${solo.lp} LP</span>
      </div>
      ${body}
      ${soloUi.undo.length ? `<button onclick="undoSolo()" class="self-center text-xs text-slate-400 hover:text-white px-2 py-1">↩️ Undo last step</button>` : ''}
    </div>
  `;
}

function renderSoloFightIntro(f, kind, p) {
  const r = soloRegion(f.region);
  const lines = [
    `<span class="ce-emoji">🃏</span> Shuffle your deck, clear your field and draw ${soloHas('pot-of-greed') ? `<b>${5 + soloRelicValue('pot-of-greed')}</b> cards (<span class="ce-emoji">🏺</span> Pot of Greed)` : '5 cards'}.`,
    `<span class="ce-emoji">✊</span> Rock-paper-scissors decides who goes first. Whoever opens can't attack on their first turn.`,
    `<span class="ce-emoji">❤️</span> Your LP: <b>${solo.lp}</b>.`,
    `<span class="ce-emoji">${r.icon}</span> ${r.types.length ? `${r.name} field: ${soloFieldText(f.region)}. Yours too!` : 'No field bonus here.'}`,
    `<span class="ce-emoji">${p.icon}</span> They look <b>${p.label.toLowerCase()}</b>.`
  ];
  if (f.chips) lines.push(`<span class="ce-emoji">⭐</span> Win to earn ${f.chips} Star Chip${f.chips === 1 ? '' : 's'}.`);
  if (f.kind === 'elite') lines.push('<span class="ce-emoji">🎁</span> Win to choose a rare relic.');
  const e = f.elite && SOLO_ELITES[f.elite];
  if (e) lines.unshift(`<span class="text-rose-200">${e.gimmick}</span>`);
  if (f.pegasus) lines.unshift(...SOLO_PEGASUS.cutscenes.intro.rules.map(l => `<span class="text-fuchsia-200">${soloEmojiLead(l)}</span>`));
  if (f.video) lines.push(`<span class="ce-emoji">📼</span> <span class="text-violet-200">His tape gave it away: he opens with <b>${f.video}</b>.</span>`);
  const quote = e ? e.quote : f.pegasus ? SOLO_PEGASUS.cutscenes.intro.quote : '';
  if (soloHas('swords')) lines.push("<span class=\"ce-emoji\">🌟</span> Swords of Revealing Light: they can't attack on their first turn.");
  if (soloHas('spellbinding')) lines.push("<span class=\"ce-emoji\">🔯</span> Spellbinding Circle: their first monster can't attack.");
  if (soloHas('sanctity')) lines.push('<span class="ce-emoji">🃏</span> Card of Sanctity: you draw 2 cards in every Draw Phase.');
  (f.mods || []).forEach(k => lines.push(`<span class="ce-emoji">${SOLO_EVENT_MODS[k].icon}</span> <span class="text-violet-200">${SOLO_EVENT_MODS[k].text}</span>`));
  if (soloHas('eye')) lines.push(`<span class="ce-emoji">👁️</span> The Millennium Eye costs ${Math.min(SOLO_RELICS.eye.value, solo.lp - 1)} LP when the duel starts.`);
  return `
    <div class="solo-intro fixed inset-0 z-50 flex flex-col bg-slate-950/95 backdrop-blur overflow-y-auto no-scrollbar p-6">
      <div class="my-auto flex flex-col items-center text-center gap-2">
        <div class="coop-cut-icon text-7xl leading-none ce-emoji">${f.icon}</div>
        <p class="text-[0.7rem] font-bold uppercase tracking-widest text-rose-300">${kind}</p>
        <p class="text-2xl font-black text-white">${f.name}</p>
        <p class="text-sm text-slate-300">${f.maxLp} LP</p>
        ${quote ? `<p class="text-sm italic text-amber-100 max-w-sm">“${quote}”</p>` : ''}
        ${f.rps ? renderSoloRps(f) : `
          <ul class="text-left text-sm text-slate-200 space-y-1.5 max-w-sm leading-snug mt-2">${lines.map(l => `<li>${l}</li>`).join('')}</ul>
          <button onclick="startSoloRpsClick()" class="mt-3 px-8 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-lg"><span class="ce-emoji">✊✋✌️</span> Rock, paper, scissors!</button>
        `}
      </div>
    </div>
  `;
}

// Rock-paper-scissors for who goes first. A win lets you choose; a loss lets the enemy choose.
function renderSoloRps(f) {
  const r = f.rps;
  const btn = (label, onclick, cls = 'bg-amber-500 hover:bg-amber-400 text-slate-950') => `<button onclick="${onclick}" class="px-6 py-3 rounded-xl font-bold text-lg ${cls}">${label}</button>`;
  const throws = r.you ? `<p class="text-6xl leading-none mt-2 ce-emoji">${SOLO_RPS[r.you].icon} <span class="text-2xl text-slate-400">vs</span> ${SOLO_RPS[r.foe].icon}</p>` : '';
  const wrap = body => `<div class="flex flex-col items-center gap-3 mt-3 max-w-sm">${throws}${body}</div>`;
  const text = (t, cls = 'text-slate-200') => `<p class="text-sm leading-snug ${cls}">${t}</p>`;

  if (!r.result) {
    const options = Object.entries(SOLO_RPS).map(([k, v]) => `<button onclick="soloRpsClick('${k}')" aria-label="${v.label}" class="w-20 h-20 rounded-2xl bg-slate-800 border border-slate-600 hover:bg-slate-700 text-5xl leading-none ce-emoji">${v.icon}</button>`).join('');
    return wrap(text('Rock, paper, scissors… <b>throw!</b>', 'text-lg font-bold text-white') + `<div class="flex gap-3">${options}</div>`);
  }
  if (r.result === 'tie') return wrap(text('A tie! Again.', 'text-lg font-bold text-white') + btn('Throw again', 'soloRpsAgainClick()'));
  if (r.result === 'win') {
    return wrap(text('You win! Who goes first?', 'text-lg font-bold text-emerald-300') +
      text('Whoever goes first can\'t attack on their first turn.', 'text-xs text-slate-400') +
      `<div class="flex flex-wrap gap-2 justify-center">${btn('I go first', "startSoloDuel('player')")}${btn(`${f.name} ${f.plural ? 'go' : 'goes'} first`, "startSoloDuel('enemy')", 'bg-slate-700 hover:bg-slate-600 text-white')}</div>`);
  }
  const enemy = r.first === 'enemy';
  return wrap(text(`${f.name} ${f.plural ? 'win' : 'wins'}…`, 'text-lg font-bold text-rose-300') +
    text(enemy ? `${f.name} ${f.plural ? 'choose' : 'chooses'} to <b>go first</b>. They can't attack on their first turn, and you play second.` : `${f.name} ${f.plural ? 'let' : 'lets'} you <b>go first</b>. You can't attack on your first turn.`) +
    btn("It's time to duel!", `startSoloDuel('${r.first}')`));
}

// --- Reward and the end of a run ----------------------------------------------------

function renderSoloReward() {
  const r = solo.reward;
  const gate = r.kind === 'gate';
  const ids = solo.offer?.ids || [];
  const taken = r.relic && SOLO_RELICS[r.relic];
  return `
    ${renderSoloStatus()}
    <div class="coop-end coop-end--win flex-1 min-h-0 overflow-y-auto no-scrollbar p-6 flex flex-col items-center text-center gap-3">
      <div class="my-auto w-full flex flex-col items-center gap-3">
        <div class="coop-end-icon text-7xl leading-none ce-emoji">${gate ? '🚪' : '⭐'}</div>
        <h2 class="text-2xl font-black text-white">${r.name} ${r.plural ? 'are' : 'is'} defeated!</h2>
        <p class="text-sm text-slate-300">${gate ? 'The Labyrinth opens. The castle is straight ahead.' : r.chips ? 'They hand over their Star Chips.' : 'You fought them off.'}</p>
        ${r.chips ? `<p class="text-3xl font-black text-amber-300">+${r.chips} <span class="ce-emoji">⭐</span></p>` : ''}
        ${r.healed ? `<p class="text-sm text-emerald-300"><span class="ce-emoji">🌿</span> Dian Keto Charm: +${r.healed} LP</p>` : ''}
        <p class="text-sm text-slate-400">${solo.chips}/${SOLO_GATE_CHIPS} Star Chips · ${solo.lp} LP left</p>
        ${ids.length ? `<p class="text-xs font-semibold uppercase tracking-widest text-sky-300 mt-2">Choose a rare relic</p><div class="w-full max-w-sm space-y-2 text-left">${ids.map(soloRelicOption).join('')}</div>` : ''}
        ${taken ? `<div class="coop-toast coop-toast--good rounded-lg px-3 py-2 text-sm"><span class="ce-emoji">${taken.icon}</span> You take the ${taken.name}!</div>` : ''}
        ${ids.length
          ? '<button onclick="soloContinueReward()" class="w-full max-w-xs py-2 text-slate-400 hover:text-white text-sm">Skip the relic</button>'
          : '<button onclick="soloContinueReward()" class="w-full max-w-xs mt-3 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-lg transition">Back to the map ➜</button>'}
      </div>
    </div>
  `;
}

function renderSoloEnd() {
  const win = solo.phase === 'victory';
  const at = solo.at && solo.map?.nodes[solo.at];
  const heroName = soloHeroName();
  // Lose and your soul is sealed in a card, like in the anime.
  const top = win
    ? `<div class="coop-end-icon text-7xl leading-none ce-emoji">🏆</div>
      <h2 class="text-3xl font-black text-white">Pegasus is defeated!</h2>
      <p class="text-sm italic text-amber-100 max-w-xs">${SOLO_PEGASUS.win}</p>
      <p class="text-sm italic text-emerald-200 max-w-xs">"You have proven yourself a true duelist of Duelist Kingdom!"</p>`
    : `<div class="solo-sealed-card" aria-label="${heroName} is sealed in a card">
        <p class="solo-sealed-card__name">${heroName}</p>
        <div class="solo-sealed-card__art"><span class="ce-emoji">😱</span></div>
        <p class="solo-sealed-card__text">Sealed by ${solo.fight?.name || 'a Shadow Game'}</p>
      </div>
      <h2 class="text-3xl font-black text-white">Your run is over…</h2>
      <p class="text-sm italic text-emerald-200 max-w-xs">${solo.fight?.pegasus ? SOLO_PEGASUS.lose : '"Every duelist falls. Get back up, shuffle your deck and try again!"'}</p>`;
  return `
    <div class="coop-end ${win ? 'coop-end--win' : 'coop-end--lose'} flex-1 min-h-0 overflow-y-auto p-6 flex flex-col items-center justify-center text-center gap-3">
      ${top}
      <div class="grid grid-cols-3 gap-2 w-full max-w-xs mt-2">
        ${soloStat('Duels won', solo.stats?.duels ?? 0)}
        ${soloStat('Damage', solo.stats?.damage ?? 0)}
        ${soloStat(win ? 'LP left' : 'Floor', win ? solo.lp : at ? at.floor : 0)}
      </div>
      ${solo.relics?.length ? `<p class="text-2xl tracking-widest">${solo.relics.map(id => `<span class="ce-emoji" title="${SOLO_RELICS[id].name}">${SOLO_RELICS[id].icon}</span>`).join(' ')}</p>` : ''}
      ${solo.map ? renderSoloMap(true) : ''}
      <div class="flex flex-col gap-2 w-full max-w-xs mt-3">
        ${!win && soloUi.undo.length ? '<button onclick="undoSolo()" class="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold transition">↩️ Undo last step</button>' : ''}
        <button onclick="startSoloRun()" class="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-lg transition"><span class="ce-emoji">🏝️</span> New run</button>
        <button onclick="soloBackToMenu()" class="w-full py-2 text-slate-400 hover:text-white text-sm">Back to menu</button>
      </div>
    </div>
  `;
}
