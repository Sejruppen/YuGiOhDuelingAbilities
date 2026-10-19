// Selectable list of abilities shown on the Choose Abilities screen.
function renderAbilityPickerSection(abilityType, abilities, step, extraClass = '') {
  const { label, theme, selectionKey } = abilityType;

  return `
    <section${extraClass ? ` class="${extraClass}"` : ''}>
      <div class="flex items-center gap-2 mb-3">
        <span class="px-2.5 py-1 text-xs font-bold uppercase tracking-wider rounded ${theme.bg} ${theme.text} border ${theme.border}">${step}. Choose ${label}</span>
      </div>
      <div class="space-y-2.5">
        ${abilities.map((ability, idx) => renderAbilityOption(abilityType, ability, idx, state[selectionKey] === idx)).join('')}
      </div>
    </section>
  `;
}

function renderAbilityOption(abilityType, ability, index, isSelected) {
  const { type, theme, hasUses } = abilityType;
  const stateClass = isSelected ? `is-selected ${theme.selected}` : 'bg-slate-900/60 border-slate-800 opacity-75';

  const titleHtml = hasUses
    ? `
      <div class="flex items-center justify-between gap-2 mb-1.5">
        <div class="font-bold text-base text-white">${ability.name}</div>
        <span class="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 shrink-0">${formatMaxUsesBadge(ability.maxUses)}</span>
      </div>
    `
    : `<div class="font-bold text-base text-white mb-1.5">${ability.name}</div>`;

  return `
    <div onclick="pickAbility('${type}', ${index})" data-fx-pick="${type}-${index}" class="fx-c-${type} p-4 rounded-xl border transition cursor-pointer ${stateClass}">
      ${titleHtml}
      <div class="text-sm text-slate-200 leading-relaxed">${ability.text}</div>
    </div>
  `;
}
