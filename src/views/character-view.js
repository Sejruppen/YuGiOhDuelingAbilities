function renderCharacterOption(char) {
  const isNeutral = char.id === NEUTRAL_CHARACTER_ID;
  const cardClass = isNeutral ? 'bg-indigo-950/40 border-indigo-500/40' : 'bg-slate-900/90 border-slate-800';
  const eraClass = isNeutral ? 'text-indigo-300' : 'text-amber-400/90';

  return `
    <button onclick="selectCharacter('${char.id}')" class="w-full text-left p-4 rounded-xl border ${cardClass} hover:border-amber-500/50 active:scale-[0.99] transition flex items-center justify-between">
      <div>
        <div class="font-bold text-white text-lg">${char.name}</div>
        <div class="text-sm ${eraClass} mt-0.5">${char.era}</div>
      </div>
      <span class="text-slate-400 text-xl">→</span>
    </button>
  `;
}

function renderCharacterView() {
  return `
    <header class="px-4 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-900/80 backdrop-blur">
      <button onclick="resetApp()" class="text-slate-300 text-base font-medium px-2 py-1">← Back</button>
      <h2 class="text-lg font-bold text-white">Choose Character</h2>
      <div class="w-14"></div>
    </header>
    <div class="fx-stagger flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
      ${CHARACTERS.map(renderCharacterOption).join('')}
    </div>
  `;
}
