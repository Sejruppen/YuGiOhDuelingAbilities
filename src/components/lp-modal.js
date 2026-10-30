// LP editor, laid out like the co-op LP panel: type an amount, then Damage or Heal.
const LP_KEYPAD_KEYS = ['1', '2', '3', 'back', '4', '5', '6', '0', '7', '8', '9', '00'];

function renderLpModal() {
  if (!ui.lpModalOpen) return '';
  const value = ui.lpInput;

  return renderModal('closeLpEditor()', `
    <div class="flex items-center justify-between gap-2 mb-3">
      <p class="font-bold text-white"><span class="ce-emoji">❤️</span> Life Points: <span class="lp-value tabular-nums">${getCurrentLp()}</span></p>
      <button onclick="closeLpEditor()" class="text-sm text-slate-400 hover:text-white px-2 py-1">✕ Cancel</button>
    </div>

    <div class="flex flex-col gap-2">
      <div class="flex items-baseline justify-between gap-2 px-1">
        <p class="text-xs text-slate-400">Damage, costs or healing</p>
        <p class="text-3xl font-black text-white tabular-nums">${value || '<span class="text-slate-600">0</span>'}</p>
      </div>
      <div class="grid grid-cols-4 gap-1.5">
        ${LP_KEYPAD_KEYS.map(k => `<button type="button" onclick="lpKey('${k}')" class="py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-lg font-bold text-white">${k === 'back' ? '⌫' : k}</button>`).join('')}
      </div>
      <div class="flex flex-wrap gap-2">
        ${coopBtn('− Damage', 'confirmLpInput(-1)', 'danger', !value)}
        ${coopBtn('+ Heal', 'confirmLpInput(1)', 'primary', !value)}
      </div>
      <div class="flex flex-wrap gap-2">
        ${coopBtn('÷2 Halve', 'halveLpQuick()')}
        ${coopBtn(`Reset (${STARTING_LP})`, 'resetLp()')}
      </div>
    </div>
  `);
}
