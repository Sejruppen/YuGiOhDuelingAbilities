function renderThemePicker() {
  const activeId = getAppTheme().id;

  return `
    <div class="w-full max-w-xs mt-8">
      <p class="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">Theme</p>
      <div class="grid grid-cols-3 gap-1 p-1 rounded-xl bg-slate-900/80 border border-slate-800">
        ${APP_THEMES.map(theme => {
          const isActive = theme.id === activeId;
          const stateClass = isActive
            ? 'bg-slate-700 text-white shadow'
            : 'text-slate-400 hover:text-slate-200';
          return `<button onclick="setAppTheme('${theme.id}')" aria-pressed="${isActive}" class="py-2 px-1 rounded-lg text-xs font-bold leading-tight transition ${stateClass}">${theme.label}</button>`;
        }).join('')}
      </div>
    </div>
  `;
}

function renderStartView() {
  return `
    <div class="start-screen flex-1 flex flex-col items-center justify-center p-6 text-center bg-gradient-to-b from-slate-900 via-slate-950 to-black">
      <img src="./logo.jpg" alt="Yu-Gi-Oh! Companion Icon" class="w-32 h-32 mb-6 rounded-full border-2 border-amber-500/40 shadow-xl shadow-emerald-500/10 object-cover" />
      <h1 class="brand-title text-4xl font-extrabold tracking-tight text-white mb-2">Yu-Gi-Oh!</h1>
      <p class="text-amber-400 font-semibold tracking-widest uppercase text-sm mb-8">Character Abilities</p>
      <p class="text-slate-300 text-base max-w-xs mb-10 leading-relaxed">
        Select your character deck, customize your secret loadout of Skill, Comeback, and Quest, and enter the duel.
      </p>
      <button onclick="goToCharacters()" class="w-full max-w-xs py-4 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-98 text-slate-950 font-bold text-xl shadow-lg shadow-amber-500/20 transition">
        Start Duel Setup
      </button>
      ${renderThemePicker()}
      ${renderSoundToggle()}
    </div>
  `;
}
