// Button-only modal for editing LP (no keyboard needed).
const LP_STEPS = [1000, 500, 100, 50];

function renderLpStepButton(delta) {
  const isNegative = delta < 0;
  const colorClass = isNegative
    ? 'bg-rose-950/60 border-rose-500/30 text-rose-300'
    : 'bg-emerald-950/60 border-emerald-500/30 text-emerald-300';
  const label = isNegative ? `${delta}` : `+${delta}`;

  return `<button type="button" onclick="adjustLpQuick(${delta})" class="py-3 rounded-lg ${colorClass} border text-sm font-bold active:scale-95 transition">${label}</button>`;
}

function renderLpModal() {
  if (!ui.lpModalOpen) return '';

  return renderModal('closeLpEditor()', `
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-base font-extrabold uppercase tracking-wider text-amber-400">Life Points</h3>
      <button onclick="closeLpEditor()" class="text-slate-300 hover:text-white text-base font-bold px-2.5 py-0.5 rounded bg-slate-800 border border-slate-700">✕</button>
    </div>

    <div class="space-y-4">
      <div class="w-full text-center text-5xl font-black font-mono py-4 rounded-xl bg-slate-950 border border-slate-800 text-white shadow-inner select-none">
        ${getCurrentLp()}
      </div>

      <div class="grid grid-cols-4 gap-1.5">
        ${LP_STEPS.map(step => renderLpStepButton(-step)).join('')}
      </div>

      <div class="grid grid-cols-4 gap-1.5">
        ${LP_STEPS.map(step => renderLpStepButton(step)).join('')}
      </div>

      <div class="grid grid-cols-2 gap-1.5">
        <button type="button" onclick="halveLpQuick()" class="py-3 rounded-lg bg-indigo-950/60 border border-indigo-500/30 text-indigo-300 text-sm font-bold active:scale-95 transition">÷2 (Halve)</button>
        <button type="button" onclick="resetLp()" class="py-3 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-sm font-bold active:scale-95 transition">Reset (${STARTING_LP})</button>
      </div>

      <button type="button" onclick="closeLpEditor()" class="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-base shadow-lg shadow-amber-500/20 transition">
        Done
      </button>
    </div>
  `);
}
