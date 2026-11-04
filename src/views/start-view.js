function renderThemeButton(theme, activeId = getAppTheme().id) {
  // Earned in Solo mode: a wide tile, sealed until Pegasus falls on that difficulty.
  if (theme.unlock && !isThemeAvailable(theme)) {
    return `<button onclick="teaseMillenniumTheme(this)" aria-disabled="true" title="Beat Pegasus 3 times on Nightmare to unlock" class="theme-btn-sealed col-span-2 py-2 px-1 rounded-lg text-xs font-bold leading-tight transition text-slate-500 border border-dashed border-slate-700"><span class="ce-emoji">🔒</span> ??? <span class="ce-emoji">👁️</span></button>`;
  }
  if (!isThemeAvailable(theme)) {
    return `<button onclick="teaseTreasureTheme(this)" aria-disabled="true" title="Find every secret to unlock" class="theme-btn-locked py-2 px-1 rounded-lg text-xs font-bold leading-tight transition text-slate-500 border border-dashed border-slate-700"><span class="ce-emoji">🔒</span> ???</button>`;
  }
  const isActive = theme.id === activeId;
  const stateClass = isActive
    ? 'bg-slate-700 text-white shadow'
    : 'text-slate-400 hover:text-slate-200';
  const secretClass = theme.secret ? ' theme-btn-treasure' : theme.unlock ? ` theme-btn-${theme.id} col-span-2` : '';
  const label = theme.secret ? `<span class="ce-emoji">💎</span> ${theme.label}` : theme.unlock ? `<span class="ce-emoji">👁️</span> ${theme.label}` : theme.label;
  return `<button onclick="setAppTheme('${theme.id}')" aria-pressed="${isActive}" class="py-2 px-1 rounded-lg text-xs font-bold leading-tight transition ${stateClass}${secretClass}">${label}</button>`;
}

function renderSeasonalThemeButton(theme, activeId) {
  const isActive = theme.id === activeId;
  return `
    <button onclick="setAppTheme('${theme.id}')" aria-pressed="${isActive}" class="theme-btn-seasonal theme-btn-${theme.id} col-span-2 py-2.5 px-2 rounded-lg text-xs font-bold leading-tight transition">
      <span class="ce-emoji">${theme.season.emoji}</span> ${theme.label} <span class="theme-seasonal-new">NEW</span>
      <span class="block text-[0.65rem] font-semibold opacity-80 mt-0.5">Available all ${theme.season.monthName}</span>
    </button>
  `;
}

function renderSeasonalBanner() {
  const theme = getActiveSeasonTheme();
  if (!theme) return '';
  return `
    <button onclick="goToSettings()" class="seasonal-banner seasonal-banner--${theme.id} w-full max-w-xs mt-1 px-5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition">
      <span class="seasonal-banner-arrow">↑</span>
      <span><span class="ce-emoji">${theme.season.emoji}</span> New: ${theme.label} theme</span>
    </button>
  `;
}

function renderThemePicker() {
  const activeId = getAppTheme().id;
  const regularThemes = APP_THEMES.filter(theme => !theme.season);
  const seasonTheme = getActiveSeasonTheme();

  return `
    <div class="w-full max-w-xs mt-2">
      <p class="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">Theme</p>
      <div class="grid grid-cols-2 gap-1 p-1 rounded-xl bg-slate-900/80 border border-slate-800">
        ${regularThemes.map(theme => renderThemeButton(theme, activeId)).join('')}
        ${seasonTheme ? renderSeasonalThemeButton(seasonTheme, activeId) : ''}
      </div>
    </div>
  `;
}

function renderScalePicker() {
  const activeId = getUiScale().id;

  return `
    <div class="w-full max-w-xs mt-6">
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
    <div class="start-screen start-screen--home flex-1 min-h-0 flex flex-col bg-gradient-to-b from-slate-900 via-slate-950 to-black">
      <div class="flex-1 min-h-0 overflow-y-auto flex flex-col p-6 text-center">
        <div class="start-hero my-auto w-full flex flex-col items-center">
          <div class="ra-disc" aria-hidden="true"></div>
          ${renderLogoEgg()}
          <h1 class="brand-title text-4xl font-extrabold tracking-tight text-white mb-2">Yu-Gi-Oh!</h1>
          <p class="text-amber-400 font-semibold tracking-widest uppercase text-sm mb-5">Character Abilities</p>
          <p class="text-slate-300 text-sm max-w-xs mb-6 leading-relaxed">
            Pick a character, choose your Skill, Comeback and Quest, and track Life Points in the duel. Run a knockout Tournament, team up against a Co-op Boss, or walk the Duelist's Road alone.
          </p>
          <button onclick="if (diskAllowsClick()) goToCharacters()" onpointerdown="startDiskPress(this)" onpointerup="cancelDiskPress(this)" onpointerleave="cancelDiskPress(this)" onpointercancel="cancelDiskPress(this)" oncontextmenu="return false" class="disk-press w-full max-w-xs py-4 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-98 text-slate-950 font-bold text-xl shadow-lg shadow-amber-500/20 transition">
            Start Duel Setup
          </button>
          <div class="w-full max-w-xs mt-3 grid grid-cols-2 gap-3">
            ${renderTournamentButton()}
            ${renderCoopButton()}
            ${renderSoloButton()}
          </div>
          ${renderSettingsButton()}
          ${renderSeasonalBanner()}
        </div>
      </div>
    </div>
  `;
}
