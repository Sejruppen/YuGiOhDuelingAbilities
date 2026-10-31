// LP editor, laid out like the co-op LP panel: type an amount, then Damage or Heal.
// The LP log sits in a column on the right; tapping an entry reuses its amount,
// and Undo above it takes back the newest change.
const LP_KEYPAD_KEYS = ['1', '2', '3', 'back', '4', '5', '6', '0', '7', '8', '9', '00'];

function renderLpLogEntry(entry, index) {
  const isDamage = entry.delta < 0;
  const color = isDamage ? 'text-rose-400' : 'text-emerald-400';
  const label = entry.reset ? 'Reset' : `${isDamage ? '−' : '+'}${Math.abs(entry.delta)}`;
  return `
    <button type="button" onclick="useLpLogEntry(${index})" class="w-full text-right rounded-lg bg-slate-800/60 hover:bg-slate-700 px-1.5 py-1 leading-tight">
      <span class="block text-sm font-bold tabular-nums ${entry.reset ? 'text-slate-300' : color}">${label}</span>
      <span class="block text-[0.65rem] text-slate-500 tabular-nums">→ ${entry.lp}</span>
    </button>
  `;
}

function renderLpLog() {
  const log = state.lpLog || [];
  return `
    <div class="w-[4.5rem] shrink-0 flex flex-col">
      <p class="text-xs text-slate-400 text-right px-1 mb-1">Log</p>
      <button type="button" onclick="undoLastLp()" ${log.length ? '' : 'disabled'} title="Undo the last change" class="w-full mb-1 rounded-lg px-1.5 py-1 text-xs font-bold transition border border-slate-700 ${log.length ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-slate-900/60 text-slate-600'}">↶ Undo</button>
      <div class="relative flex-1 min-h-0">
        <div class="absolute inset-0 overflow-y-auto no-scrollbar flex flex-col gap-1">
          ${log.length ? log.map(renderLpLogEntry).join('') : '<p class="text-[0.65rem] text-slate-600 text-right px-1">No changes yet</p>'}
        </div>
      </div>
    </div>
  `;
}

function renderLpModal() {
  if (!ui.lpModalOpen) return '';
  const value = ui.lpInput;
  const display = value
    ? `${value}${hasLpInputSuffix() ? '<span class="text-slate-600">00</span>' : ''}`
    : '<span class="text-slate-600">0</span>';

  return renderModal('closeLpEditor()', `
    <div class="flex items-center justify-between gap-2 mb-3">
      <p class="font-bold text-white"><span class="ce-emoji cegg-press lp-heart-press" onpointerdown="startLpEggPress(this, 'heart')" onpointerup="cancelLpEggPress(this)" onpointerleave="cancelLpEggPress(this)" onpointercancel="cancelLpEggPress(this)" oncontextmenu="return false">❤️</span> Life Points: <span class="lp-value tabular-nums">${getCurrentLp()}</span></p>
      <button onclick="closeLpEditor()" class="text-sm text-slate-400 hover:text-white px-2 py-1">✕ Cancel</button>
    </div>

    <div class="flex gap-3">
    <div class="flex-1 min-w-0 flex flex-col gap-2">
      <div class="flex items-center justify-between gap-2 px-1">
        ${value
          ? '<button type="button" onclick="clearLpInput()" class="text-xs font-bold text-slate-300 hover:text-white rounded-md bg-slate-800 hover:bg-slate-700 px-2.5 py-1">✕ Clear</button>'
          : '<p class="text-xs text-slate-400">Damage, costs or healing</p>'}
        <p class="text-3xl font-black text-white tabular-nums">${display}</p>
      </div>
      <div class="grid grid-cols-4 gap-1.5">
        ${LP_KEYPAD_KEYS.map(k => `<button type="button" onclick="lpKey('${k}')" class="py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-lg font-bold text-white">${k === 'back' ? '⌫' : k}</button>`).join('')}
      </div>
      <div class="flex gap-2 [&>button]:min-w-0 [&>button]:px-1">
        ${coopBtn('+ Heal', 'confirmLpInput(1)', 'heal', !value)}
        ${coopBtn('− Damage', 'confirmLpInput(-1)', 'danger', !value)}
      </div>
      <div class="flex gap-2 [&>button]:min-w-0 [&>button]:px-1">
        <button type="button" onclick="if (lpEggAllowsClick()) halveLpQuick()" onpointerdown="startLpEggPress(this, 'halve')" onpointerup="cancelLpEggPress(this)" onpointerleave="cancelLpEggPress(this)" onpointercancel="cancelLpEggPress(this)" oncontextmenu="return false" class="cegg-press flex-1 min-w-0 py-2.5 px-1 rounded-xl font-bold text-sm transition bg-slate-800 hover:bg-slate-700 text-white border border-slate-700">÷2 Halve</button>
        <button type="button" onclick="if (lpEggAllowsClick()) resetLp()" onpointerdown="startLpEggPress(this, 'reset')" onpointerup="cancelLpEggPress(this)" onpointerleave="cancelLpEggPress(this)" onpointercancel="cancelLpEggPress(this)" oncontextmenu="return false" class="cegg-press flex-1 min-w-0 py-2.5 px-1 rounded-xl font-bold text-sm transition bg-slate-800 hover:bg-slate-700 text-white border border-slate-700">Reset (${STARTING_LP})</button>
      </div>
    </div>
    ${renderLpLog()}
    </div>
  `, 'max-w-sm !p-4');
}
