// --- STATE MANAGEMENT ---
const STORAGE_KEY = 'ygo_duel_state';

const defaultState = {
  screen: 'start', // 'start' | 'character' | 'abilities' | 'duel'
  characterId: null,
  selectedSkill: null,
  selectedComeback: null,
  selectedQuest: null,
  skillRevealed: false,
  comebackRevealed: false,
  questRevealed: false,
  skillUses: 0,
  comebackUses: 0,
  questUses: 0
};

// Persistent state across reloads
let state = JSON.parse(localStorage.getItem(STORAGE_KEY)) || { ...defaultState };

// Transient state (resets if the browser reloads)
let peekState = {
  skill: false,
  comeback: false,
  quest: false
};

function setState(patch) {
  state = { ...state, ...patch };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  render();
}

function getSelectedCharacter() {
  return CHARACTERS.find(c => c.id === state.characterId);
}

function formatMaxUsesBadge(maxUses, type) {
  if (type === 'quest') return 'Quest';
  if (maxUses === null || maxUses === undefined) return 'Unlimited';
  return `${maxUses}x Duel`;
}

// --- NAVIGATION & ACTIONS ---
function goToCharacters() {
  setState({
    screen: 'character',
    characterId: null,
    selectedSkill: null,
    selectedComeback: null,
    selectedQuest: null,
    skillRevealed: false,
    comebackRevealed: false,
    questRevealed: false,
    skillUses: 0,
    comebackUses: 0,
    questUses: 0
  });
  peekState = { skill: false, comeback: false, quest: false };
}

function selectCharacter(id) {
  setState({
    screen: 'abilities',
    characterId: id,
    selectedSkill: 0,
    selectedComeback: 0,
    selectedQuest: 0,
    skillRevealed: false,
    comebackRevealed: false,
    questRevealed: false,
    skillUses: 0,
    comebackUses: 0,
    questUses: 0
  });
  peekState = { skill: false, comeback: false, quest: false };
}

function pickAbility(type, index) {
  if (type === 'skill') setState({ selectedSkill: index });
  if (type === 'comeback') setState({ selectedComeback: index });
  if (type === 'quest') setState({ selectedQuest: index });
}

function startDuel() {
  setState({ screen: 'duel' });
}

function resetApp() {
  setState({ ...defaultState });
  peekState = { skill: false, comeback: false, quest: false };
}

// --- IN-DUEL CARD ACTIONS ---
function togglePeek(type) {
  peekState[type] = !peekState[type];
  render();
}

function activateAbility(type) {
  setState({ 
    [`${type}Revealed`]: true,
    [`${type}Uses`]: (state[`${type}Uses`] || 0) + 1
  });
  peekState[type] = false; 
}

function changeUses(type, delta) {
  const current = state[`${type}Uses`] || 0;
  setState({ [`${type}Uses`]: Math.max(0, current + delta) });
}

// --- VIEW TEMPLATES ---
function renderStartScreen() {
  return `
    <div class="flex-1 flex flex-col items-center justify-center p-6 text-center bg-gradient-to-b from-slate-900 via-slate-950 to-black">
      <div class="w-20 h-20 mb-6 rounded-2xl bg-amber-500/10 border border-amber-500/40 flex items-center justify-center shadow-lg shadow-amber-500/10">
        <span class="text-4xl">千年</span>
      </div>
      <h1 class="text-3xl font-extrabold tracking-tight text-white mb-2">Yu-Gi-Oh!</h1>
      <p class="text-amber-400 font-semibold tracking-widest uppercase text-xs mb-8">Character Deck Companion</p>
      <p class="text-slate-400 text-sm max-w-xs mb-10">
        Select your character deck, customize your secret loadout of Skill, Comeback, and Quest, and enter the duel.
      </p>
      <button onclick="goToCharacters()" class="w-full max-w-xs py-4 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-98 text-slate-950 font-bold text-lg shadow-lg shadow-amber-500/20 transition">
        Start Duel Setup
      </button>
    </div>
  `;
}

function renderCharacterScreen() {
  return `
    <header class="px-4 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-900/80 backdrop-blur">
      <button onclick="resetApp()" class="text-slate-400 text-sm font-medium px-2 py-1">← Back</button>
      <h2 class="text-base font-bold text-white">Choose Character</h2>
      <div class="w-12"></div>
    </header>
    <div class="flex-1 overflow-y-auto p-4 space-y-2.5 no-scrollbar">
      ${CHARACTERS.map(char => `
        <button onclick="selectCharacter('${char.id}')" class="w-full text-left p-4 rounded-xl border ${char.id === 'neutral' ? 'bg-indigo-950/40 border-indigo-500/40' : 'bg-slate-900/90 border-slate-800'} hover:border-amber-500/50 active:scale-[0.99] transition flex items-center justify-between">
          <div>
            <div class="font-bold text-white text-base">${char.name}</div>
            <div class="text-xs ${char.id === 'neutral' ? 'text-indigo-300' : 'text-amber-400/90'} mt-0.5">${char.era}</div>
          </div>
          <span class="text-slate-500 text-lg">→</span>
        </button>
      `).join('')}
    </div>
  `;
}

function renderAbilitiesScreen(char) {
  return `
    <header class="px-4 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-900/80 backdrop-blur">
      <button onclick="goToCharacters()" class="text-slate-400 text-sm font-medium px-2 py-1">← Characters</button>
      <div class="text-center">
        <h2 class="text-sm font-bold text-white leading-tight">${char.name}</h2>
        <p class="text-[11px] text-amber-400 leading-tight">${char.era}</p>
      </div>
      <div class="w-16"></div>
    </header>

    <div id="abilities-scroll-container" class="flex-1 overflow-y-auto p-4 space-y-6 no-scrollbar">
      <!-- SKILLS -->
      <section>
        <div class="flex items-center gap-2 mb-2.5">
          <span class="px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">1. Choose Skill</span>
        </div>
        <div class="space-y-2">
          ${char.skills.map((s, idx) => `
            <div onclick="pickAbility('skill', ${idx})" class="p-3.5 rounded-xl border transition cursor-pointer ${state.selectedSkill === idx ? 'bg-sky-950/50 border-sky-400 shadow-sm shadow-sky-500/10' : 'bg-slate-900/60 border-slate-800 opacity-75'}">
              <div class="flex items-center justify-between gap-2 mb-1">
                <div class="font-bold text-sm text-white">${s.name}</div>
                <span class="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 shrink-0">${formatMaxUsesBadge(s.maxUses, 'skill')}</span>
              </div>
              <div class="text-xs text-slate-300 leading-relaxed">${s.text}</div>
            </div>
          `).join('')}
        </div>
      </section>

      <!-- COMEBACKS -->
      <section>
        <div class="flex items-center gap-2 mb-2.5">
          <span class="px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">2. Choose Comeback</span>
        </div>
        <div class="space-y-2">
          ${char.comebacks.map((c, idx) => `
            <div onclick="pickAbility('comeback', ${idx})" class="p-3.5 rounded-xl border transition cursor-pointer ${state.selectedComeback === idx ? 'bg-rose-950/50 border-rose-400 shadow-sm shadow-rose-500/10' : 'bg-slate-900/60 border-slate-800 opacity-75'}">
              <div class="flex items-center justify-between gap-2 mb-1">
                <div class="font-bold text-sm text-white">${c.name}</div>
                <span class="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 shrink-0">${formatMaxUsesBadge(c.maxUses, 'comeback')}</span>
              </div>
              <div class="text-xs text-slate-300 leading-relaxed">${c.text}</div>
            </div>
          `).join('')}
        </div>
      </section>

      <!-- QUESTS -->
      <section class="pb-4">
        <div class="flex items-center gap-2 mb-2.5">
          <span class="px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">3. Choose Quest</span>
        </div>
        <div class="space-y-2">
          ${char.quests.map((q, idx) => `
            <div onclick="pickAbility('quest', ${idx})" class="p-3.5 rounded-xl border transition cursor-pointer ${state.selectedQuest === idx ? 'bg-amber-950/50 border-amber-400 shadow-sm shadow-amber-500/10' : 'bg-slate-900/60 border-slate-800 opacity-75'}">
              <div class="flex items-center justify-between gap-2 mb-1">
                <div class="font-bold text-sm text-white">${q.name}</div>
                <span class="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 shrink-0">${formatMaxUsesBadge(q.maxUses, 'quest')}</span>
              </div>
              <div class="text-xs text-slate-300 leading-relaxed">${q.text}</div>
            </div>
          `).join('')}
        </div>
      </section>
    </div>

    <footer class="p-3 border-t border-slate-800 bg-slate-900/90">
      <button onclick="startDuel()" class="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-base shadow-lg shadow-amber-500/20">
        Lock Loadout & Start Duel
      </button>
    </footer>
  `;
}

// Reusable component for rendering the 3 distinct states of a card
function renderDuelCard(type, label, ability, isRevealed, uses, isPeeking, theme) {
  const maxUses = ability.maxUses; // number or null (unlimited)
  const hasLimit = typeof maxUses === 'number';
  const isExhausted = hasLimit && uses >= maxUses;

  const actionText = (type === 'quest') ? 'Complete' : 'Activate';
  
  let statusText = '';
  if (type === 'quest') {
    statusText = isExhausted ? 'COMPLETED' : 'IN PROGRESS';
  } else {
    statusText = isExhausted ? 'USED' : 'ACTIVE';
  }

  if (isRevealed) {
    const containerStyle = isExhausted 
      ? `flex-1 rounded-2xl border border-slate-700 bg-slate-900/50 p-4 flex flex-col justify-center overflow-y-auto relative opacity-75 grayscale-[70%] transition-all` 
      : `flex-1 rounded-2xl border ${theme.glow} bg-gradient-to-b ${theme.grad} to-slate-900/90 p-4 flex flex-col justify-center overflow-y-auto shadow-lg ${theme.shadow} transition-all`;
      
    const badgeStyle = isExhausted 
      ? `bg-slate-800 text-slate-400 border-slate-700` 
      : `${theme.bg} ${theme.text} ${theme.border}`;

    const usageControlHtml = hasLimit ? `
      <div class="flex items-center gap-1.5 bg-slate-950/80 rounded-lg p-1 border border-slate-800 shadow-inner">
        <button onclick="changeUses('${type}', -1)" class="w-6 h-6 flex items-center justify-center rounded bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition" ${uses <= 0 ? 'disabled' : ''}>-</button>
        <span class="text-[10px] font-bold text-slate-300 w-8 text-center">${uses} / ${maxUses}</span>
        <button onclick="changeUses('${type}', 1)" class="w-6 h-6 flex items-center justify-center rounded bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition" ${isExhausted ? 'disabled' : ''}>+</button>
      </div>
    ` : `
      <span class="text-[10px] font-bold text-slate-300 px-2 py-1 rounded-lg bg-slate-950/80 border border-slate-800">∞ Unlimited</span>
    `;

    return `
      <div class="${containerStyle}">
        ${isExhausted ? '<div class="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden"><span class="text-5xl font-black text-slate-100/5 -rotate-12 tracking-widest uppercase">' + statusText + '</span></div>' : ''}
        <div class="relative z-10 flex flex-col h-full">
          <div class="flex items-center justify-between mb-2">
            <span class="text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded border ${badgeStyle}">${label} - ${statusText}</span>
            ${usageControlHtml}
          </div>
          <h3 class="text-base font-bold text-white mb-1">${ability.name}</h3>
          <p class="text-xs text-slate-200 leading-relaxed">${ability.text}</p>
        </div>
      </div>
    `;
  }

  if (isPeeking) {
    return `
      <div class="flex-1 rounded-2xl border border-slate-600 bg-slate-800 p-4 flex flex-col justify-center overflow-y-auto relative shadow-inner">
        <div class="absolute inset-0 bg-slate-950/50 pointer-events-none rounded-2xl"></div>
        <div class="relative z-10 flex flex-col h-full">
          <div class="flex items-center justify-between mb-2">
            <span class="text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded bg-slate-700 text-slate-300 border border-slate-600">Sneak Peek</span>
            <span class="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-900/80 text-slate-300 border border-slate-700">${formatMaxUsesBadge(maxUses, type)}</span>
          </div>
          <h3 class="text-base font-bold text-white mb-1">${ability.name}</h3>
          <p class="text-xs text-slate-300 leading-relaxed mb-4">${ability.text}</p>
          
          <div class="mt-auto flex gap-2">
            <button onclick="togglePeek('${type}')" class="flex-1 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-xs font-bold text-white transition border border-slate-600">Close</button>
            <button onclick="activateAbility('${type}')" class="flex-1 py-2 rounded-lg ${theme.btn} ${theme.btnHover} text-xs font-bold text-white transition">${actionText}</button>
          </div>
        </div>
      </div>
    `;
  }

  // Hidden State
  return `
    <div class="flex-1 rounded-2xl border-2 border-dashed border-slate-700 bg-slate-900/50 p-4 flex flex-col items-center justify-center text-center">
      <div class="w-10 h-10 mb-2 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-500 shadow-inner">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
      </div>
      <h3 class="text-xs font-bold text-slate-400 mb-4 tracking-widest uppercase">Secret ${label}</h3>
      <div class="flex gap-2 w-full max-w-[220px]">
        <button onclick="togglePeek('${type}')" class="flex-1 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-300 transition">Peek</button>
        <button onclick="activateAbility('${type}')" class="flex-1 py-2.5 rounded-lg ${theme.btn} ${theme.btnHover} text-xs font-bold text-white shadow-lg ${theme.shadow} transition">${actionText}</button>
      </div>
    </div>
  `;
}

function renderDuelScreen(char) {
  const skill = char.skills[state.selectedSkill ?? 0];
  const comeback = char.comebacks[state.selectedComeback ?? 0];
  const quest = char.quests[state.selectedQuest ?? 0];

  const skyTheme = { bg: 'bg-sky-500/20', text: 'text-sky-300', border: 'border-sky-500/30', glow: 'border-sky-500/40', grad: 'from-sky-950/40', btn: 'bg-sky-600', btnHover: 'hover:bg-sky-500', shadow: 'shadow-sky-900/20' };
  const roseTheme = { bg: 'bg-rose-500/20', text: 'text-rose-300', border: 'border-rose-500/30', glow: 'border-rose-500/40', grad: 'from-rose-950/40', btn: 'bg-rose-600', btnHover: 'hover:bg-rose-500', shadow: 'shadow-rose-900/20' };
  const amberTheme = { bg: 'bg-amber-500/20', text: 'text-amber-300', border: 'border-amber-500/30', glow: 'border-amber-500/40', grad: 'from-amber-950/40', btn: 'bg-amber-600', btnHover: 'hover:bg-amber-500', shadow: 'shadow-amber-900/20' };

  return `
    <header class="px-4 py-2.5 border-b border-slate-800 flex items-center justify-between bg-slate-900 shrink-0">
      <button onclick="setState({ screen: 'abilities' })" class="text-xs text-slate-400 border border-slate-700 rounded-lg px-2.5 py-1">← Edit</button>
      <div class="text-center">
        <div class="text-xs font-bold text-white">${char.name}</div>
        <div class="text-[10px] text-amber-400">${char.era}</div>
      </div>
      <button onclick="resetApp()" class="text-xs text-rose-400 border border-rose-500/30 bg-rose-950/30 rounded-lg px-2.5 py-1">End</button>
    </header>

    <main class="flex-1 flex flex-col gap-2.5 p-2.5 overflow-hidden">
      ${renderDuelCard('skill', 'Skill', skill, state.skillRevealed, state.skillUses, peekState.skill, skyTheme)}
      ${renderDuelCard('comeback', 'Comeback', comeback, state.comebackRevealed, state.comebackUses, peekState.comeback, roseTheme)}
      ${renderDuelCard('quest', 'Quest', quest, state.questRevealed, state.questUses, peekState.quest, amberTheme)}
    </main>
  `;
}

// --- MAIN RENDERER ---
function render() {
  const app = document.getElementById('app');

  let scrollPos = 0;
  const scrollContainer = document.getElementById('abilities-scroll-container');
  if (scrollContainer) {
    scrollPos = scrollContainer.scrollTop;
  }

  if (state.screen === 'start') {
    app.innerHTML = renderStartScreen();
    return;
  }

  if (state.screen === 'character') {
    app.innerHTML = renderCharacterScreen();
    return;
  }

  const char = getSelectedCharacter();
  if (!char) {
    resetApp();
    return;
  }

  if (state.screen === 'abilities') {
    app.innerHTML = renderAbilitiesScreen(char);
    const newScrollContainer = document.getElementById('abilities-scroll-container');
    if (newScrollContainer) {
      newScrollContainer.scrollTop = scrollPos;
    }
    return;
  }

  if (state.screen === 'duel') {
    app.innerHTML = renderDuelScreen(char);
  }
}

// --- INITIALIZE & PWA SERVICE WORKER ---
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}

render();

