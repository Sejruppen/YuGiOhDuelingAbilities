const ABILITIES_SCROLL_CONTAINER_ID = 'abilities-scroll-container';

function renderAbilitiesView(char) {
  const lastIndex = ABILITY_TYPE_ORDER.length - 1;

  return `
    <header class="px-4 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-900/80 backdrop-blur">
      <button onclick="goToCharacters()" class="text-slate-300 text-base font-medium px-2 py-1">← Characters</button>
      <div class="text-center">
        <h2 class="text-base font-bold text-white leading-tight">${char.name}</h2>
        <p class="text-xs text-amber-400 leading-tight mt-0.5">${char.era}</p>
      </div>
      <div class="w-20"></div>
    </header>

    <div id="${ABILITIES_SCROLL_CONTAINER_ID}" class="flex-1 overflow-y-auto p-4 space-y-6 no-scrollbar">
      ${ABILITY_TYPE_ORDER.map((abilityType, idx) =>
        renderAbilityPickerSection(abilityType, char[abilityType.listKey], idx + 1, idx === lastIndex ? 'pb-4' : '')
      ).join('')}
    </div>

    <footer class="p-3 border-t border-slate-800 bg-slate-900/90">
      <button onclick="startDuel()" class="w-full py-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-lg shadow-lg shadow-amber-500/20">
        Lock Loadout & Start Duel
      </button>
    </footer>
  `;
}
