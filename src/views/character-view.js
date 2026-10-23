// Hold-for-2s easter eggs hidden on character cards. A function, because the
// egg scripts (which define the ids) load after this view.
function getCharacterEgg(id) {
  if (id === PALADIN_CHARACTER_ID) return { cls: 'paladin-press', start: 'startPaladinPress(this)', cancel: 'cancelPaladinPress(this)', allows: 'paladinAllowsClick()' };
  if (id === DIVINE_CHARACTER_ID) return { cls: 'divine-press', start: 'startDivinePress(this)', cancel: 'cancelDivinePress(this)', allows: 'divineAllowsClick()' };
  if (hasCharacterEgg(id)) return { cls: 'cegg-press', start: `startCharEggPress(this, '${id}')`, cancel: 'cancelCharEggPress(this)', allows: 'charEggAllowsClick()' };
  return null;
}

function renderCharacterOption(char) {
  const isNeutral = char.id === NEUTRAL_CHARACTER_ID;
  const isCustom = char.id === CUSTOM_CHARACTER_ID;
  const cardClass = isNeutral
    ? 'bg-indigo-950/40 border-indigo-500/40'
    : isCustom ? 'bg-gradient-to-r from-amber-950/50 via-fuchsia-950/40 to-sky-950/50 border-amber-500/40' : 'bg-slate-900/90 border-slate-800';
  const themeClass = isNeutral ? 'text-indigo-300' : isCustom ? 'text-fuchsia-300' : 'text-amber-400/90';
  const egg = getCharacterEgg(char.id);
  const clickAttrs = egg
    ? `onclick="if (${egg.allows}) selectCharacter('${char.id}')" onpointerdown="${egg.start}" onpointerup="${egg.cancel}" onpointerleave="${egg.cancel}" onpointercancel="${egg.cancel}" oncontextmenu="return false"`
    : `onclick="selectCharacter('${char.id}')"`;

  return `
    <button ${clickAttrs} class="${egg ? `${egg.cls} ` : ''}w-full text-left p-4 rounded-xl border ${cardClass} hover:border-amber-500/50 active:scale-[0.99] transition flex items-center justify-between">
      <div>
        <div class="font-bold text-white text-lg">${char.name}</div>
        <div class="text-sm ${themeClass} mt-0.5">${char.theme}</div>
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
