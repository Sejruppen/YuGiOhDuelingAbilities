// Vertical Life Points bar shown beside the duel cards.
function getLpColorClasses(lp) {
  if (lp <= 2000) return 'text-rose-400 border-rose-500/40 from-rose-950/40';
  if (lp <= 4000) return 'text-amber-400 border-amber-500/40 from-amber-950/40';
  return 'text-emerald-400 border-emerald-500/30 from-emerald-950/30';
}

function renderLpBar() {
  const currentLp = getCurrentLp();
  const rotationClass = isLpOnLeft() ? '-rotate-90' : 'rotate-90';
  const criticalClass = currentLp > 0 && currentLp <= 2000 ? 'lp-critical' : '';

  return `
    <div onclick="openLpEditor()" class="lp-bar ${criticalClass} w-16 shrink-0 rounded-2xl border ${getLpColorClasses(currentLp)} bg-gradient-to-b to-slate-900/90 flex flex-col items-center justify-between py-3.5 cursor-pointer active:scale-[0.98] transition select-none relative overflow-hidden shadow-lg">
          <button onclick="toggleLpSide(event)" title="Switch LP Side" class="z-10 w-10 h-9 rounded-lg bg-slate-800/90 hover:bg-slate-700 border border-slate-700 flex items-center justify-center text-slate-200 text-sm font-bold shadow transition">
        ⇄
      </button>

      <div class="flex-1 flex items-center justify-center">
        <div class="${rotationClass} whitespace-nowrap flex items-baseline gap-2.5">
          <span class="text-sm font-extrabold uppercase tracking-widest text-slate-400">LP</span>
          <span class="lp-value text-4xl font-black tracking-wider font-mono">${currentLp}</span>
        </div>
      </div>

      <span class="text-xs font-bold uppercase tracking-widest text-slate-400">Edit</span>
    </div>
  `;
}
