function renderResetModal() {
  if (!ui.resetModalOpen) return '';

  return renderModal('closeResetConfirm()', `
    <h3 class="text-base font-extrabold uppercase tracking-wider text-amber-400 mb-2">Reset Duel?</h3>
    <p class="text-sm text-slate-200 leading-relaxed mb-5">LP will be set to ${STARTING_LP} and all abilities will be hidden and unused.</p>
    <div class="flex gap-2">
      <button type="button" onclick="closeResetConfirm()" class="flex-1 py-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 font-bold text-sm transition">Cancel</button>
      <button type="button" onclick="resetDuel()" class="flex-1 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition">Reset</button>
    </div>
  `);
}
