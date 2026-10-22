// Cracks appear in the icon as the speaker strains (speaker-easter-egg.js).
const SPEAKER_CRACKS = [
  'M7 9.5 l1.5 2 -1 1.5',
  'M10 6.5 l-1 3 1.5 1.5 -1 2.5',
  'M11 13 l-2 1.5 1 2 -1.5 1.5',
  'M5 13.5 l2 -0.5 1 1.5'
];

function renderSoundIcon(on, strain = 0) {
  const waves = on
    ? '<path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/>'
    : '<path d="M16 9l5 6"/><path d="M21 9l-5 6"/>';
  const crackCount = Math.min(SPEAKER_CRACKS.length, Math.floor(strain / 2));
  const cracks = SPEAKER_CRACKS.slice(0, crackCount)
    .map(d => `<path class="speaker-crack" d="${d}" stroke-width="1.3"/>`).join('');
  return `
    <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M4 9h3l5-4v14l-5-4H4z" fill="currentColor"/>${waves}${cracks}
    </svg>
  `;
}

// Full-width toggle for the start screen.
function renderSoundToggle() {
  const on = isSoundOn();
  const stateClass = on ? 'text-slate-200' : 'text-slate-500';
  const label = speakerEgg.dead ? 'Sound 🪦' : `Sound ${on ? 'On' : 'Off'}`;
  return `
    <button data-sound-btn onclick="toggleSound()" aria-pressed="${on}" style="${getSpeakerStyle()}" class="w-full max-w-xs mt-3 py-2 flex items-center justify-center gap-2 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-bold transition ${stateClass} ${getSpeakerClass()}">
      ${renderSoundIcon(on, getSpeakerStrain())} ${label}
    </button>
  `;
}

// Compact icon button for the duel header.
function renderSoundIconButton() {
  const on = isSoundOn();
  const label = on ? 'Mute sound' : 'Turn sound on';
  return `
    <button data-sound-btn onclick="toggleSound()" aria-pressed="${on}" aria-label="${label}" title="${label}" style="${getSpeakerStyle()}" class="${on ? 'text-slate-300' : 'text-slate-500'} border border-slate-700 rounded-lg p-1.5 ${getSpeakerClass()}">
      ${renderSoundIcon(on, getSpeakerStrain())}
    </button>
  `;
}
