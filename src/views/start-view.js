function renderThemeButton(theme, activeId = getAppTheme().id) {
  if (!isThemeAvailable(theme)) {
    return `<button onclick="teaseTreasureTheme(this)" aria-disabled="true" title="Find every secret to unlock" class="theme-btn-locked py-2 px-1 rounded-lg text-xs font-bold leading-tight transition text-slate-500 border border-dashed border-slate-700"><span class="ce-emoji">🔒</span> ???</button>`;
  }
  const isActive = theme.id === activeId;
  const stateClass = isActive
    ? 'bg-slate-700 text-white shadow'
    : 'text-slate-400 hover:text-slate-200';
  const secretClass = theme.secret ? ' theme-btn-treasure' : '';
  const label = theme.secret ? `<span class="ce-emoji">💎</span> ${theme.label}` : theme.label;
  return `<button onclick="setAppTheme('${theme.id}')" aria-pressed="${isActive}" class="py-2 px-1 rounded-lg text-xs font-bold leading-tight transition ${stateClass}${secretClass}">${label}</button>`;
}

function renderThemePicker() {
  const activeId = getAppTheme().id;

  return `
    <div class="w-full max-w-xs mt-8">
      <p class="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">Theme</p>
      <div class="grid grid-cols-2 gap-1 p-1 rounded-xl bg-slate-900/80 border border-slate-800">
        ${APP_THEMES.map(theme => renderThemeButton(theme, activeId)).join('')}
      </div>
    </div>
  `;
}

function renderScalePicker() {
  const activeId = getUiScale().id;

  return `
    <div class="w-full max-w-xs mt-4">
      <p class="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">Size</p>
      <div class="grid grid-cols-4 gap-1 p-1 rounded-xl bg-slate-900/80 border border-slate-800">
        ${UI_SCALES.map(scale => {
          const isActive = scale.id === activeId;
          const stateClass = isActive
            ? 'bg-slate-700 text-white shadow'
            : 'text-slate-400 hover:text-slate-200';
          return `<button onclick="tapUiScale('${scale.id}')" aria-pressed="${isActive}" class="py-2 px-1 rounded-lg text-xs font-bold leading-tight transition ${stateClass}">${scale.label}</button>`;
        }).join('')}
      </div>
    </div>
  `;
}

function renderStartView() {
  return `
    <div class="start-screen flex-1 min-h-0 flex flex-col bg-gradient-to-b from-slate-900 via-slate-950 to-black">
      <div class="flex-1 min-h-0 overflow-y-auto flex flex-col p-6 text-center">
        <div class="my-auto w-full flex flex-col items-center">
          ${renderLogoEgg()}
          <h1 class="brand-title text-4xl font-extrabold tracking-tight text-white mb-2">Yu-Gi-Oh!</h1>
          <p class="text-amber-400 font-semibold tracking-widest uppercase text-sm mb-8">Character Abilities</p>
          <p class="text-slate-300 text-base max-w-xs mb-10 leading-relaxed">
            Select your character deck, customize your secret loadout of Skill, Comeback, and Quest, and enter the duel.
          </p>
          <button onclick="if (diskAllowsClick()) goToCharacters()" onpointerdown="startDiskPress(this)" onpointerup="cancelDiskPress(this)" onpointerleave="cancelDiskPress(this)" onpointercancel="cancelDiskPress(this)" oncontextmenu="return false" class="disk-press w-full max-w-xs py-4 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-98 text-slate-950 font-bold text-xl shadow-lg shadow-amber-500/20 transition">
            Start Duel Setup
          </button>
          ${renderThemePicker()}
          ${renderScalePicker()}
          ${renderSoundToggle()}
          ${renderEggCounter()}
        </div>
      </div>
    </div>
  `;
}
