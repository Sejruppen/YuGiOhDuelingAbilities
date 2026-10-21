function getSelectedAbility(char, abilityType) {
  return char[abilityType.listKey][state[abilityType.selectionKey] ?? 0];
}

function renderDuelHeader(char) {
  return `
    <header class="px-4 py-2.5 border-b border-slate-800 flex items-center justify-between bg-slate-900 shrink-0">
      <div class="flex items-center gap-1.5">
        <button onclick="editLoadout()" class="text-sm font-medium text-slate-300 border border-slate-700 rounded-lg px-3 py-1">← Edit</button>
        ${renderSoundIconButton()}
      </div>
      <div class="heart-press text-center" title="Hold to believe..." onpointerdown="startHeartPress(this)" onpointerup="cancelHeartPress(this)" onpointerleave="cancelHeartPress(this)" onpointercancel="cancelHeartPress(this)" oncontextmenu="return false">
        <div class="text-base font-bold text-white leading-tight">${char.name}</div>
        <div class="text-xs text-amber-400 leading-tight">${char.theme}</div>
      </div>
      <div class="flex items-center gap-1.5">
        <button onclick="openResetConfirm()" class="text-sm font-medium text-amber-300 border border-amber-500/30 bg-amber-950/30 rounded-lg px-3 py-1">Reset</button>
        <button onclick="resetApp()" class="text-sm font-medium text-rose-400 border border-rose-500/30 bg-rose-950/30 rounded-lg px-3 py-1">End</button>
      </div>
    </header>
  `;
}

function renderDuelView(char) {
  const { skill, comeback, quest } = ABILITY_TYPES;

  return `
    ${renderDuelHeader(char)}

    <main class="flex-1 flex ${isLpOnLeft() ? 'flex-row' : 'flex-row-reverse'} gap-2.5 p-2.5 overflow-hidden">
      ${renderLpBar()}

      <div class="duel-cards fx-stagger flex-1 flex flex-col gap-2.5 overflow-hidden">
        ${renderDuelCard(skill, getSelectedAbility(char, skill), {
          isActive: state.skillRevealed,
          uses: state.skillUses,
          isPeeking: ui.peek.skill
        })}
        ${renderDuelCard(comeback, getSelectedAbility(char, comeback), {
          isActive: state.comebackRevealed,
          uses: state.comebackUses,
          isPeeking: ui.peek.comeback
        })}
        ${renderDuelCard(quest, getSelectedAbility(char, quest), {
          isActive: state.questCompleted,
          uses: 0,
          isPeeking: ui.peek.quest
        })}
      </div>
    </main>

    ${renderLpModal()}
    ${renderResetModal()}
  `;
}
