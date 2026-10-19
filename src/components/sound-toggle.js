function renderSoundIcon(on) {
  const waves = on
    ? '<path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/>'
    : '<path d="M16 9l5 6"/><path d="M21 9l-5 6"/>';
  return `
    <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M4 9h3l5-4v14l-5-4H4z" fill="currentColor"/>${waves}
    </svg>
  `;
}

// Full-width toggle for the start screen.
function renderSoundToggle() {
  const on = isSoundOn();
  const stateClass = on ? 'text-slate-200' : 'text-slate-500';
  return `
    <button onclick="toggleSound()" aria-pressed="${on}" class="w-full max-w-xs mt-3 py-2 flex items-center justify-center gap-2 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-bold transition ${stateClass}">
      ${renderSoundIcon(on)} Sound ${on ? 'On' : 'Off'}
    </button>
  `;
}

// Compact icon button for the duel header.
function renderSoundIconButton() {
  const on = isSoundOn();
  const label = on ? 'Mute sound' : 'Turn sound on';
  return `
    <button onclick="toggleSound()" aria-pressed="${on}" aria-label="${label}" title="${label}" class="${on ? 'text-slate-300' : 'text-slate-500'} border border-slate-700 rounded-lg p-1.5">
      ${renderSoundIcon(on)}
    </button>
  `;
}
