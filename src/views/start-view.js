function renderStartView() {
  return `
    <div class="flex-1 flex flex-col items-center justify-center p-6 text-center bg-gradient-to-b from-slate-900 via-slate-950 to-black">
      <img src="./logo.jpg" alt="Yu-Gi-Oh! Companion Icon" class="w-32 h-32 mb-6 rounded-full border-2 border-amber-500/40 shadow-xl shadow-emerald-500/10 object-cover" />
      <h1 class="text-4xl font-extrabold tracking-tight text-white mb-2">Yu-Gi-Oh!</h1>
      <p class="text-amber-400 font-semibold tracking-widest uppercase text-sm mb-8">Character Abilities</p>
      <p class="text-slate-300 text-base max-w-xs mb-10 leading-relaxed">
        Select your character deck, customize your secret loadout of Skill, Comeback, and Quest, and enter the duel.
      </p>
      <button onclick="goToCharacters()" class="w-full max-w-xs py-4 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-98 text-slate-950 font-bold text-xl shadow-lg shadow-amber-500/20 transition">
        Start Duel Setup
      </button>
    </div>
  `;
}
