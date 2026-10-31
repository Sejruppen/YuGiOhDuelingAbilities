// Solo mode screen ("Duelist's Road"): the intro, the island map, nodes,
// fights against a virtual duelist and the end of a run.
const SOLO_MAP_W = 360;
const SOLO_MAP_H = 820;

// Start screen entry, below Tournament and Co-op.
function renderSoloButton() {
  const running = isSoloRunActive();
  return `
    <button onclick="goToSolo()" class="solo-start-btn col-span-2 w-full py-2.5 px-2 rounded-xl border border-emerald-500/50 bg-slate-900/80 hover:bg-slate-800 text-emerald-300 font-bold text-sm leading-tight transition flex items-center justify-center gap-2">
      <span class="text-xl leading-none ce-emoji">🗺️</span>
      <span>Solo: Duelist's Road</span>
      ${running ? '<span class="text-[0.65rem] font-semibold opacity-80">▶ Continue</span>' : ''}
    </button>
  `;
}

function renderSoloView() {
  const body = {
    map: renderSoloMapScreen,
    node: renderSoloNode,
    fight: renderSoloFight,
    reward: renderSoloReward,
    victory: renderSoloEnd,
    defeat: renderSoloEnd
  }[solo.phase] || renderSoloIntro;
  return `<div class="solo-screen relative flex-1 min-h-0 flex flex-col">${body()}${soloUi.relicInfo ? renderSoloRelicSheet() : ''}</div>`;
}

const soloStat = (label, value) => `<div class="rounded-xl bg-slate-900/90 border border-slate-800 px-3 py-2"><p class="text-[0.65rem] uppercase tracking-widest text-slate-400">${label}</p><p class="text-lg font-black text-white">${value}</p></div>`;

// --- Relics -------------------------------------------------------------------------

// Spent relics are greyed out until the next duel (the Puzzle for good).
function soloRelicSpent(id) {
  if (id === 'puzzle') return !!solo.puzzleUsed;
  const f = solo.phase === 'fight' && solo.fight;
  if (!f) return false;
  return !!f.relicUsed?.[id] || (id === 'legendary-sword' && f.swordRound === f.round);
}

const soloRarityClass = r => ({ rare: 'text-sky-300', millennium: 'text-amber-300' }[r.rarity] || 'text-slate-400');

function renderSoloRelicBar() {
  if (!solo.relics?.length) return '';
  const relics = solo.relics.map(id => {
    const r = SOLO_RELICS[id];
    return `<button data-solo-relic="${id}" onclick="showSoloRelic('${id}')" aria-label="${r.name}" class="solo-relic solo-relic--${r.rarity} ${soloRelicSpent(id) ? 'solo-relic--used' : ''} ${soloUi.relicInfo === id ? 'solo-relic--picked' : ''}"><span class="ce-emoji">${r.icon}</span></button>`;
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
  const use = id === 'red-medicine' ? coopBtn(`<span class="ce-emoji">🧪</span> Drink (+${r.value} LP)`, 'useSoloRedMedicine()', 'heal', solo.lp >= solo.maxLp) : '';
  return `
    <div class="solo-sheet absolute inset-x-0 bottom-0 z-20 p-4 rounded-t-2xl border-t border-amber-500/50 bg-slate-900/95 backdrop-blur shadow-2xl">
      <div class="flex items-start gap-3">
        <span class="text-4xl leading-none ce-emoji">${r.icon}</span>
        <div class="flex-1 min-w-0">
          <p class="font-black text-white text-lg leading-tight">${r.name}</p>
          <p class="text-[0.65rem] uppercase tracking-widest ${soloRarityClass(r)}">${r.rarity === 'millennium' ? 'Millennium Item' : `${r.rarity} relic`}${r.consumable ? ' · used up when used' : ''}</p>
          <p class="text-sm text-slate-200 mt-1 leading-snug">${r.text}</p>
          ${soloRelicSpent(id) ? `<p class="text-xs text-amber-200 mt-1">${id === 'puzzle' ? 'Its power is spent for this run.' : 'Already used. It is ready again next duel.'}</p>` : ''}
        </div>
      </div>
      <div class="flex gap-2 mt-3">${coopBtn('Close', 'closeSoloRelic()')}${use}</div>
    </div>
  `;
}

function renderSoloHeader(title, right = '') {
  return `
    <header class="shrink-0 px-4 py-3 border-b border-slate-800 flex items-center justify-between gap-2 bg-slate-900/80 backdrop-blur">
      <button onclick="backInSolo()" class="text-slate-300 text-base font-medium px-2 py-1 w-16 text-left">← Back</button>
      <h2 class="text-lg font-bold text-white truncate">${title}</h2>
      <div class="w-16 text-right">${right}</div>
    </header>
  `;
}

function renderSoloStatus() {
  const at = solo.at && solo.map.nodes[solo.at];
  return `
    <div class="shrink-0 px-4 py-2 flex items-center justify-between gap-2 text-sm font-bold bg-slate-950/70 border-b border-slate-800">
      <span data-solo-me class="text-white tabular-nums"><span class="ce-emoji">❤️</span> ${solo.lp}</span>
      <span class="${solo.chips >= SOLO_GATE_CHIPS ? 'text-amber-300' : 'text-slate-200'}"><span class="ce-emoji">⭐</span> ${solo.chips}/${SOLO_GATE_CHIPS}</span>
      <span class="text-slate-400">Floor ${at ? at.floor : 0}/${SOLO_FLOOR.CASTLE}</span>
    </div>
    ${solo.relics?.length ? `<div class="shrink-0 px-4 py-1.5 bg-slate-950/50 border-b border-slate-800">${renderSoloRelicBar()}</div>` : ''}
  `;
}

function soloKeypad(label, actionsHtml) {
  const value = soloUi.input;
  const keys = ['1', '2', '3', 'back', '4', '5', '6', '0', '7', '8', '9', '00'];
  return `
    <div class="flex items-baseline justify-between gap-2 px-1">
      <p class="text-xs text-slate-400">${label}</p>
      <p class="text-3xl font-black text-white tabular-nums">${value || '<span class="text-slate-600">0</span>'}</p>
    </div>
    <div class="grid grid-cols-4 gap-1.5">
      ${keys.map(k => `<button onclick="soloKey('${k}')" class="py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-lg font-bold text-white">${k === 'back' ? '⌫' : k}</button>`).join('')}
    </div>
    <div class="flex flex-wrap gap-2">${actionsHtml}</div>
  `;
}

const soloFieldText = region => {
  const r = SOLO_REGIONS[region];
  return r?.types.length ? `${r.types.join(', ')} monsters gain ${SOLO_FIELD_BONUS * 100}% ATK` : 'No field bonus here';
};

// --- Intro --------------------------------------------------------------------------

function renderSoloIntro() {
  return `
    ${renderSoloHeader('<span class="ce-emoji">🗺️</span> Duelist\'s Road')}
    <div class="flex-1 min-h-0 overflow-y-auto p-4 no-scrollbar">
      <div class="text-center mb-4">
        <div class="coop-step-icon text-6xl leading-none ce-emoji">🏝️</div>
        <p class="mt-2 text-xl font-black text-white">Welcome to Duelist Kingdom</p>
        <p class="text-sm italic text-emerald-200">"Collect ${SOLO_GATE_CHIPS} Star Chips and the castle doors will open for you."</p>
      </div>
      <p class="text-sm text-slate-300 leading-relaxed mb-5">
        A solo run across Pegasus' island. Play your own deck against duelists that live on the phone. Choose your path, collect Star Chips and reach the castle.
      </p>
      <p class="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">How it works</p>
      <ul class="text-xs text-slate-300 space-y-1.5 leading-relaxed">
        <li><span class="ce-emoji">🗺️</span> Pick a path up the map. Every node is a duel, a treasure or something stranger.</li>
        <li><span class="ce-emoji">🃏</span> Before each duel: shuffle your deck and draw 5. You always go first.</li>
        <li><span class="ce-emoji">❤️</span> You start with ${SOLO_START_LP} LP, and it carries over between duels. Rest at the campfire before the castle.</li>
        <li><span class="ce-emoji">👁️</span> The enemy shows what kind of move it will make next turn. Plan around it!</li>
        <li><span class="ce-emoji">⚔️</span> Attack on the phone: pick a target and enter your monster's ATK. Normal battle rules apply.</li>
        <li><span class="ce-emoji">🛡️</span> Enemy monsters attack you directly. Block with one of your monsters (each one blocks once per turn) or take the hit.</li>
        <li><span class="ce-emoji">🌲</span> Each region has a field: matching monsters gain ${SOLO_FIELD_BONUS * 100}% ATK. That goes for yours too!</li>
        <li><span class="ce-emoji">⭐</span> Start with ${SOLO_START_CHIPS} Star Chips. A duelist gives +1, an elite +2. With fewer than ${SOLO_GATE_CHIPS}, you must go through the Labyrinth.</li>
        <li><span class="ce-emoji">🎁</span> Find relics in treasure chests and win rare ones from elites. Tap a relic to read what it does.</li>
      </ul>
    </div>
    <footer class="shrink-0 p-4 border-t border-slate-800 bg-slate-900/80">
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

// Background bands per region: [region, floorFrom, floorTo, side].
const SOLO_MAP_BANDS = [
  ['beach', 1, 1, 'all'],
  ['forest', 2, 3, 'left'],
  ['meadow', 2, 3, 'right'],
  ['mountain', 4, 5, 'left'],
  ['wasteland', 4, 5, 'right'],
  ['campfire', 6, 6, 'all'],
  ['labyrinth', 7, 7, 'all'],
  ['castle', 8, 8, 'all']
];

function renderSoloMapBands() {
  const half = SOLO_MAP_W / 2;
  const rects = [];
  const labels = [];
  SOLO_MAP_BANDS.forEach(([region, from, to, side]) => {
    const top = from === SOLO_FLOOR.CASTLE ? 0 : soloMapY(to) - 50;
    const bottom = from === 1 ? SOLO_MAP_H : soloMapY(from) + 50;
    const x = side === 'right' ? half : 0;
    const w = side === 'all' ? SOLO_MAP_W : half;
    rects.push(`<rect class="solo-band solo-band--${region}" x="${x}" y="${top}" width="${w}" height="${bottom - top}" />`);
    if (side !== 'all' || region === 'beach') {
      const r = SOLO_REGIONS[region];
      labels.push(`<span class="solo-region-label" style="${side === 'right' ? 'right' : 'left'}: 1.5%; top: ${((bottom - 18) / SOLO_MAP_H) * 100}%;"><span class="ce-emoji">${r.icon}</span> ${r.name}</span>`);
    }
  });
  return { rects: rects.join(''), labels: labels.join('') };
}

function soloEdgeWalked(a, b) {
  const i = solo.path.indexOf(a);
  return i >= 0 && solo.path[i + 1] === b;
}

function renderSoloMap() {
  const { nodes, edges } = solo.map;
  const reachable = soloReachable();
  const bands = renderSoloMapBands();

  const lines = edges.map(([a, b]) => {
    const p = soloNodePos(nodes[a]);
    const q = soloNodePos(nodes[b]);
    const walked = soloEdgeWalked(a, b);
    const open = a === solo.at && reachable.includes(b);
    return `<line class="solo-edge ${walked ? 'solo-edge--walked' : open ? 'solo-edge--open' : ''}" x1="${p.x}" y1="${p.y}" x2="${q.x}" y2="${q.y}" />`;
  }).join('');

  // The map scrolls to where you stand; before floor 1 that is the beach.
  const focusId = solo.at || reachable[0];
  const buttons = Object.values(nodes).map(n => {
    const { x, y } = soloNodePos(n);
    const t = SOLO_NODE_TYPES[n.type];
    const state = n.id === solo.at ? 'current' : solo.path.includes(n.id) ? 'visited' : reachable.includes(n.id) ? 'reachable' : 'dim';
    const special = n.col === null ? 'solo-node--special' : '';
    return `
      <button onclick="tapSoloNode('${n.id}')" ${n.id === focusId ? 'data-solo-focus' : ''} aria-label="${t.label}"
        class="solo-node solo-node--${state} solo-node--${n.type} ${special} ${soloUi.preview === n.id ? 'solo-node--picked' : ''}"
        style="left: ${(x / SOLO_MAP_W) * 100}%; top: ${(y / SOLO_MAP_H) * 100}%;">
        <span class="ce-emoji">${t.icon}</span>
      </button>
    `;
  }).join('');

  const focusKey = `${solo.at}`;
  if (soloUi.mapFocus !== focusKey) {
    soloUi.mapFocus = focusKey;
    setTimeout(() => document.querySelector('[data-solo-focus]')?.scrollIntoView({ block: 'center' }));
  }

  return `
    <div class="solo-map relative mx-auto w-full" style="max-width: ${SOLO_MAP_W + 40}px; aspect-ratio: ${SOLO_MAP_W} / ${SOLO_MAP_H};">
      <svg class="absolute inset-0 w-full h-full" viewBox="0 0 ${SOLO_MAP_W} ${SOLO_MAP_H}" preserveAspectRatio="none" aria-hidden="true">
        ${bands.rects}
        ${lines}
      </svg>
      ${bands.labels}
      ${buttons}
    </div>
  `;
}

function renderSoloPreview() {
  const n = solo.map.nodes[soloUi.preview];
  if (!n) return '';
  const t = SOLO_NODE_TYPES[n.type];
  const r = SOLO_REGIONS[n.region];
  const reachable = soloReachable().includes(n.id);
  let note = '';
  if (n.id === 'labyrinth' && solo.chips >= SOLO_GATE_CHIPS) note = `You have ${SOLO_GATE_CHIPS} ⭐: you can skip the Labyrinth.`;
  else if (n.id === 'castle' && solo.chips < SOLO_GATE_CHIPS) note = `The doors are shut. You need ${SOLO_GATE_CHIPS} ⭐.`;
  else if (solo.path.includes(n.id)) note = 'You have been here.';
  else if (!reachable) note = "You can't reach this from where you stand.";
  const fight = ['duelist', 'elite', 'labyrinth', 'castle'].includes(n.type);
  const eliteId = n.type === 'elite' ? n.elite || soloEliteFor(n.region) : n.type === 'labyrinth' ? 'paradox' : null;
  const e = eliteId && SOLO_ELITES[eliteId];
  return `
    <div class="solo-sheet absolute inset-x-0 bottom-0 z-20 p-4 rounded-t-2xl border-t border-amber-500/50 bg-slate-900/95 backdrop-blur shadow-2xl">
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
        ${coopBtn('Close', 'closeSoloPreview()')}
        ${reachable ? coopBtn('Go ➜', 'goSoloNode()', 'primary') : ''}
      </div>
    </div>
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
    ${renderSoloHeader('<span class="ce-emoji">🗺️</span> Duelist\'s Road', `<button onclick="toggleSoloLegend()" aria-label="Map legend" class="text-slate-300 text-lg px-2">ⓘ</button>`)}
    ${renderSoloStatus()}
    <div class="solo-map-scroll flex-1 min-h-0 overflow-y-auto no-scrollbar px-2 py-3">
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
    body = solo.nodeResult
      ? `<div class="coop-toast coop-toast--good rounded-lg px-3 py-2 text-sm leading-snug">${solo.nodeResult}</div>`
      : `<p class="text-sm text-slate-300">The castle looms above you. Rest by the fire to recover ${soloCampfireHeal() * 100}% of your max LP.</p>${soloHas('ring') ? '<p class="text-xs text-amber-200"><span class="ce-emoji">💍</span> The Millennium Ring keeps you from resting well.</p>' : ''}`;
    buttons = solo.nodeResult ? coopBtn('Continue ➜', 'leaveSoloNode()', 'primary') : coopBtn('<span class="ce-emoji">🔥</span> Rest', 'soloRestClick()', 'heal');
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
  } else {
    const options = ev.choices.map((c, i) => {
      const sub = c.secret && key ? `${c.sub}<br><span class="text-amber-300"><span class="ce-emoji">🗝️</span> ${c.reveal}</span>` : c.sub;
      return coopOption({ icon: `<span class="ce-emoji">${c.icon}</span>`, label: c.label, sub, disabled: c.disabled, reason: c.reason }, `pickSoloEventChoice(${i})`);
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

// --- Fight --------------------------------------------------------------------------

function renderSoloFight() {
  const f = solo.fight;
  const kind = { duelist: 'Duelist', elite: 'Elite', gate: 'Labyrinth guard', ambush: 'Ambush', boss: f.title || 'Castle guard' }[f.kind];
  const p = SOLO_PERSONALITIES[f.personality];
  return `
    ${renderSoloHeader(`<span class="ce-emoji">${f.icon}</span> ${kind}`, `<span class="text-[0.65rem] font-bold text-slate-400">Turn ${f.round}</span>`)}
    <div class="flex-1 min-h-0 overflow-y-auto no-scrollbar p-3 flex flex-col gap-2">
      ${renderSoloEnemyBoard(f, p)}
      ${renderSoloRelicBar()}
      ${f.turn === 'enemy' ? renderSoloStepCard() : soloUi.panel ? renderSoloPanel() : renderSoloPlayer(f)}
    </div>
    ${f.intro ? renderSoloFightIntro(f, kind, p) : ''}
  `;
}

function renderSoloEnemyBoard(f, p) {
  const pct = Math.max(0, (f.lp / f.maxLp) * 100);
  const r = soloRegion(f.region);
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
            ${boosted ? `<span class="ce-emoji" title="Field bonus">${r.icon}</span>` : ''}${m.equip ? `<span class="text-amber-300"> +${m.equip}⚔️</span>` : ''}${m.bound ? '<span class="ce-emoji" title="Spellbinding Circle: can\'t attack"> 🔯</span>' : ''}${m.hatch ? `<span class="text-amber-200" title="Hatches into Great Moth"> <span class="ce-emoji">🦋</span> in ${m.hatch}</span>` : ''}${m.risen ? '<span class="ce-emoji" title="Risen: stays dead next time"> 🧟</span>' : ''}
          </span>
        </span>
        <span class="text-[0.6rem] font-black uppercase ${m.pos === 'atk' ? 'text-rose-300' : 'text-sky-300'}">${m.pos === 'atk' ? '⚔️ ATK' : '🛡️ DEF'}</span>
      </div>
    `;
  }).join('');
  const trap = f.trap ? '<div class="solo-trap rounded-xl border border-violet-500/60 bg-violet-950/40 px-2 py-1.5 flex items-center gap-2 text-xs font-bold text-violet-200"><span class="text-2xl leading-none ce-emoji">🂠</span>Face-down card</div>' : '';
  return `
    <section class="solo-enemy rounded-2xl border border-rose-500/30 bg-slate-950/80 p-3">
      <div class="flex items-center gap-2">
        <span class="text-3xl leading-none ce-emoji">${f.icon}</span>
        <div class="flex-1 min-w-0">
          <p class="font-black text-white truncate">${f.name}</p>
          <p class="text-[0.65rem] text-slate-400"><span class="ce-emoji">${p.icon}</span> ${p.label} · <span class="ce-emoji">${r.icon}</span> ${r.name}</p>
        </div>
      </div>
      <div data-solo-enemy class="relative mt-2 h-5 rounded-full bg-slate-800 overflow-hidden">
        <div class="h-full bg-gradient-to-r from-rose-600 to-amber-500 transition-all duration-500" style="width: ${pct}%"></div>
        <span class="absolute inset-0 flex items-center justify-center text-xs font-black text-white drop-shadow">${f.lp} / ${f.maxLp} LP</span>
      </div>
      <div class="mt-2 grid grid-cols-1 gap-1.5">
        ${monsters || trap ? monsters + trap : '<p class="text-xs text-slate-400 italic text-center py-1">No monsters. Attack directly!</p>'}
      </div>
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
  if (action === 'trap') return `Set <b>${SOLO_TRAP.name}</b>`;
  if (action === 'removal') return `<b>${SOLO_REMOVAL.name}</b>: ${SOLO_REMOVAL.text.toLowerCase().replace(/\.$/, '')}`;
  if (action === 'heal') return `<b>${SOLO_HEAL.name}</b> (+${SOLO_HEAL.lp} LP)`;
  const special = f.elite && SOLO_ELITES[f.elite]?.specialCard;
  if (action === 'special' && special) return `Play <b>${special}</b>`;
  return base;
}

function renderSoloPlayer(f) {
  const toast = soloUi.toast;
  const action = (icon, label, onclick, disabled) => `
    <button onclick="${onclick}" ${disabled ? 'disabled' : ''} class="rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 py-2 text-white transition disabled:opacity-35">
      <span class="block text-lg leading-none ce-emoji">${icon}</span><span class="block text-[0.7rem] font-bold mt-0.5">${label}</span>
    </button>
  `;
  const eye = soloHas('eye');
  const intents = f.intents.map((a, i) => ({ ...SOLO_ACTIONS[a], label: eye ? soloIntentDetail(f, a, f.peek?.[i]) : SOLO_ACTIONS[a].label }));
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
          <p class="text-sm font-semibold text-slate-200 truncate">${f.battleOver ? '🪤 Your Battle Phase is over' : '⚔️ Your turn'}</p>
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
      const options = f.monsters.length
        ? f.monsters.map(m => soloMonsterOption(m, `setSoloPanel({ target: '${m.uid}' })`)).join('')
        : coopOption({ icon: f.icon, label: 'Direct attack', sub: `${f.name} has no monsters` }, "setSoloPanel({ target: 'direct' })");
      return renderSoloPanelShell('⚔️ Attack: choose a target', options);
    }
    const m = panel.target !== 'direct' && soloMonster(Number(panel.target));
    const title = m ? `⚔️ ${m.icon} ${m.name}` : '⚔️ Direct attack';
    const bonuses = [];
    if (soloHas('legendary-sword') && f.swordRound !== f.round) bonuses.push(`<span class="ce-emoji">🗡️</span> Legendary Sword adds +${SOLO_RELICS['legendary-sword'].value} to this attack.`);
    if (f.pep) bonuses.push(`<span class="ce-emoji">💪</span> Pep talk adds +${f.pep} to this attack.`);
    if (f.lunch) bonuses.push(`<span class="ce-emoji">🍙</span> Full stomach: −${SOLO_EVENT_MODS.lunch.value} on this attack.`);
    const axe = soloRelicReady('axe')
      ? `<button onclick="toggleSoloAxe()" aria-pressed="${!!panel.axe}" class="w-full py-1.5 rounded-lg text-xs font-bold ${panel.axe ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300 border border-slate-700'}"><span class="ce-emoji">🪓</span> Axe of Despair +${SOLO_RELICS.axe.value} ${panel.axe ? '(on)' : '(off)'}</button>`
      : '';
    return renderSoloPanelShell(title, axe + bonuses.map(b => `<p class="text-xs text-amber-200">${b}</p>`).join('') + soloKeypad("Your attacking monster's ATK",
      coopBtn('← Back', 'setSoloPanel({ target: null })') + coopBtn('⚔️ Attack!', 'confirmSoloAttack()', 'primary', !soloUi.input)));
  }

  if (panel.type === 'effect') {
    if (!panel.kind) {
      const options = [
        coopOption({ icon: '💥', label: 'Destroy a monster', sub: 'Raigeki, Fissure, Dark Hole…', disabled: !f.monsters.length, reason: 'The enemy has no monsters' }, "setSoloPanel({ kind: 'destroy' })"),
        coopOption({ icon: '🌪️', label: 'Destroy the face-down card', sub: 'Mystical Space Typhoon, Harpie\'s Feather Duster…', disabled: !f.trap, reason: 'The enemy has no face-down card' }, 'confirmSoloDestroyTrap()'),
        coopOption({ icon: '🔥', label: 'Burn damage', sub: 'Damage straight to the enemy\'s LP' }, "setSoloPanel({ kind: 'burn' })")
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
    body = title + text(step.text) + text(step.note, 'text-xs text-rose-300') + row([cont]);
  } else if (step.kind === 'attack' && step.sub === 'block') {
    const pos = soloUi.blockPos;
    const toggle = ['atk', 'def'].map(p => `<button onclick="setSoloBlockPos('${p}')" class="flex-1 py-1.5 rounded-lg text-xs font-bold ${pos === p ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300'}">${p === 'atk' ? 'Attack position' : 'Defense position'}</button>`).join('');
    body = `<p class="text-sm font-bold text-white text-center"><span class="ce-emoji">${step.icon}</span> ${step.title.replace(' directly!', '')} (${step.atk})</p><div class="flex gap-2">${toggle}</div>` +
      soloKeypad(`Your blocking monster's ${pos.toUpperCase()}`, coopBtn('← Back', 'cancelSoloBlock()') + coopBtn('🛡️ Block', 'confirmSoloBlock()', 'primary', !soloUi.input));
  } else if (step.kind === 'attack') {
    const waboku = soloWabokuActive();
    const relics = SOLO_DEFENSE_RELICS.filter(soloRelicReady).map(id => coopBtn(`<span class="ce-emoji">${SOLO_RELICS[id].icon}</span> ${SOLO_RELICS[id].name}`, `soloRelicDefendClick('${id}')`));
    if (f.swarm) relics.push(coopBtn('<span class="ce-emoji">🧸</span> Kuriboh Swarm', "soloRelicDefendClick('swarm')"));
    body = title + text(`ATK <b class="text-rose-300">${step.atk}</b>. Each of your monsters can block once per turn.`) +
      (waboku ? text('🛐 Waboku protects you this turn: no battle damage.', 'text-xs text-emerald-300') : '') +
      row([coopBtn('🛡️ Block with a monster', 'startSoloBlock()', 'primary'), waboku ? coopBtn('🛐 Take 0', 'soloTakeHitClick()') : coopBtn(`💔 Take ${step.atk}`, 'soloTakeHitClick()', 'danger')]) +
      (relics.length ? row(relics) : '');
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
    `<span class="ce-emoji">🃏</span> Shuffle your deck, clear your field and draw ${soloHas('pot-of-greed') ? '<b>6</b> cards (<span class="ce-emoji">🏺</span> Pot of Greed)' : '5 cards'}.`,
    `<span class="ce-emoji">⚔️</span> You go first.`,
    `<span class="ce-emoji">❤️</span> Your LP: <b>${solo.lp}</b>.`,
    `<span class="ce-emoji">${r.icon}</span> ${r.types.length ? `${r.name} field: ${soloFieldText(f.region)}. Yours too!` : 'No field bonus here.'}`,
    `<span class="ce-emoji">${p.icon}</span> They look <b>${p.label.toLowerCase()}</b>.`
  ];
  if (f.chips) lines.push(`<span class="ce-emoji">⭐</span> Win to earn ${f.chips} Star Chip${f.chips === 1 ? '' : 's'}.`);
  if (f.kind === 'elite') lines.push('<span class="ce-emoji">🎁</span> Win to choose a rare relic.');
  const e = f.elite && SOLO_ELITES[f.elite];
  if (e) lines.unshift(`<span class="text-rose-200">${e.gimmick}</span>`);
  if (soloHas('swords')) lines.push("<span class=\"ce-emoji\">🌟</span> Swords of Revealing Light: they can't attack on their first turn.");
  if (soloHas('spellbinding')) lines.push("<span class=\"ce-emoji\">🔯</span> Spellbinding Circle: their first monster can't attack.");
  (f.mods || []).forEach(k => lines.push(`<span class="ce-emoji">${SOLO_EVENT_MODS[k].icon}</span> <span class="text-violet-200">${SOLO_EVENT_MODS[k].text}</span>`));
  if (soloHas('eye')) lines.push(`<span class="ce-emoji">👁️</span> The Millennium Eye costs ${Math.min(SOLO_RELICS.eye.value, solo.lp - 1)} LP when the duel starts.`);
  return `
    <div class="solo-intro fixed inset-0 z-50 flex flex-col bg-slate-950/95 backdrop-blur overflow-y-auto no-scrollbar p-6">
      <div class="my-auto flex flex-col items-center text-center gap-2">
        <div class="coop-cut-icon text-7xl leading-none ce-emoji">${f.icon}</div>
        <p class="text-[0.7rem] font-bold uppercase tracking-widest text-rose-300">${kind}</p>
        <p class="text-2xl font-black text-white">${f.name}</p>
        <p class="text-sm text-slate-300">${f.maxLp} LP</p>
        ${e ? `<p class="text-sm italic text-amber-100 max-w-sm">“${e.quote}”</p>` : ''}
        <ul class="text-left text-sm text-slate-200 space-y-1.5 max-w-sm leading-snug mt-2">${lines.map(l => `<li>${l}</li>`).join('')}</ul>
        <button onclick="startSoloDuel()" class="mt-3 px-8 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-lg">It's time to duel!</button>
      </div>
    </div>
  `;
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
  return `
    <div class="coop-end ${win ? 'coop-end--win' : 'coop-end--lose'} flex-1 min-h-0 overflow-y-auto p-6 flex flex-col items-center justify-center text-center gap-3">
      <div class="coop-end-icon text-7xl leading-none ce-emoji">${win ? '🏆' : '🃏'}</div>
      <h2 class="text-3xl font-black text-white">${win ? 'The castle is yours!' : 'Your run is over…'}</h2>
      <p class="text-sm italic text-emerald-200 max-w-xs">${win ? '"You have proven yourself a true duelist of Duelist Kingdom!"' : '"Every duelist falls. Get back up, shuffle your deck and try again!"'}</p>
      <div class="grid grid-cols-3 gap-2 w-full max-w-xs mt-2">
        ${soloStat('Duels won', solo.stats?.duels ?? 0)}
        ${soloStat('Damage', solo.stats?.damage ?? 0)}
        ${soloStat(win ? 'LP left' : 'Floor', win ? solo.lp : at ? at.floor : 0)}
      </div>
      ${solo.relics?.length ? `<p class="text-2xl tracking-widest">${solo.relics.map(id => `<span class="ce-emoji" title="${SOLO_RELICS[id].name}">${SOLO_RELICS[id].icon}</span>`).join(' ')}</p>` : ''}
      <div class="flex flex-col gap-2 w-full max-w-xs mt-3">
        ${!win && soloUi.undo.length ? '<button onclick="undoSolo()" class="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold transition">↩️ Undo last step</button>' : ''}
        <button onclick="startSoloRun()" class="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-lg transition"><span class="ce-emoji">🏝️</span> New run</button>
        <button onclick="soloBackToStartScreen()" class="w-full py-2 text-slate-400 hover:text-white text-sm">Back to start</button>
      </div>
    </div>
  `;
}
