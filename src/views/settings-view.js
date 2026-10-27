// Settings screen: theme, size, sound and the secrets counter (moved off the
// start screen so it fits on a phone without scrolling).
function renderSettingsButton() {
  const done = allEggsFound();
  return `
    <button onclick="goToSettings()" class="settings-start-btn w-full max-w-xs mt-3 py-2.5 px-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:bg-slate-800 text-slate-200 text-sm font-bold transition flex items-center justify-between gap-2">
      <span><span class="ce-emoji">⚙️</span> Settings</span>
      <span class="text-xs font-semibold text-slate-400"><span class="ce-emoji">${done ? '👑' : '🥚'}</span> ${getFoundEggCount()} / ${EGG_TOTAL}</span>
    </button>
  `;
}

function renderSettingsView() {
  return `
    <div class="start-screen settings-screen flex-1 min-h-0 flex flex-col bg-gradient-to-b from-slate-900 via-slate-950 to-black">
      <header class="px-4 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-900/80 backdrop-blur">
        <button onclick="leaveSettings()" class="text-slate-300 text-base font-medium px-2 py-1 w-16 text-left">← Back</button>
        <h2 class="text-lg font-bold text-white">Settings</h2>
        <div class="w-16"></div>
      </header>
      <div class="flex-1 min-h-0 overflow-y-auto flex flex-col p-6">
        <div class="w-full flex flex-col items-center text-center">
          ${renderThemePicker()}
          ${renderScalePicker()}
          <p class="w-full max-w-xs mt-6 -mb-1 text-xs font-semibold uppercase tracking-widest text-slate-400">Sound</p>
          ${renderSoundToggle()}
          <p class="w-full max-w-xs mt-6 -mb-1 text-xs font-semibold uppercase tracking-widest text-slate-400">Co-op Boss</p>
          ${renderCoopResetButton()}
          <p class="w-full max-w-xs mt-6 -mb-2 text-xs font-semibold uppercase tracking-widest text-slate-400">Secrets</p>
          ${renderEggCounter()}
          ${renderEggResetButton()}
        </div>
      </div>
    </div>
  `;
}
