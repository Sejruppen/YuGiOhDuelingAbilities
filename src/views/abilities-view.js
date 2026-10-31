const ABILITIES_SCROLL_CONTAINER_ID = 'abilities-scroll-container';
const ABILITY_SEARCH_INPUT_ID = 'ability-search-input';

// Custom pools every ability, so it gets a live search box above the lists.
function renderAbilitySearchBar() {
  return `
    <div class="px-4 py-2.5 border-b border-slate-800 bg-slate-900/60">
      <div class="relative">
        <span class="ce-emoji absolute left-3 top-1/2 -translate-y-1/2 text-sm pointer-events-none opacity-70">🔍</span>
        <input id="${ABILITY_SEARCH_INPUT_ID}" type="text" inputmode="search" enterkeyhint="search" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"
          value="${tnEsc(ui.abilitySearch)}" oninput="setAbilitySearch(this.value)" onkeydown="if (event.key === 'Enter') this.blur()"
          placeholder="Search name, effect or duelist…" aria-label="Search abilities"
          class="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-base text-white placeholder:text-slate-500 focus:outline-none focus:border-fuchsia-400/70">
        <button type="button" data-search-clear onclick="clearAbilitySearch()" aria-label="Clear search" class="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 text-slate-400 hover:text-white"${ui.abilitySearch ? '' : ' hidden'}>✕</button>
      </div>
    </div>
  `;
}

function renderAbilitiesView(char) {
  const lastIndex = ABILITY_TYPE_ORDER.length - 1;
  const searchable = char.id === CUSTOM_CHARACTER_ID;

  return `
    <header class="px-4 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-900/80 backdrop-blur">
      <button onclick="goToCharacters()" class="text-slate-300 text-base font-medium px-2 py-1">← Characters</button>
      <div class="text-center">
        <h2 class="text-base font-bold text-white leading-tight">${char.name}</h2>
        <p class="text-xs text-amber-400 leading-tight mt-0.5">${char.theme}</p>
      </div>
      <div class="w-20"></div>
    </header>
    ${searchable ? renderAbilitySearchBar() : ''}

    <div id="${ABILITIES_SCROLL_CONTAINER_ID}" class="fx-stagger flex-1 overflow-y-auto p-4 space-y-6 no-scrollbar">
      ${ABILITY_TYPE_ORDER.map((abilityType, idx) =>
        renderAbilityPickerSection(abilityType, char[abilityType.listKey], idx + 1, idx === lastIndex ? 'pb-4' : '', searchable)
      ).join('')}
    </div>

    <footer class="p-3 border-t border-slate-800 bg-slate-900/90">
      <button onclick="startDuel()" class="w-full py-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-lg shadow-lg shadow-amber-500/20">
        Lock Loadout & Start Duel
      </button>
    </footer>
  `;
}
