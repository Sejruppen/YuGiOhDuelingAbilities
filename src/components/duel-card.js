// In-duel card for a Skill, Comeback or Quest. A card is either hidden,
// being peeked at, or active (revealed / completed).
const LOCK_ICON = `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>`;

function renderDuelCard(abilityType, ability, { isActive, uses, isPeeking }) {
  if (isActive) {
    return abilityType.hasUses
      ? renderRevealedAbilityCard(abilityType, ability, uses)
      : renderCompletedQuestCard(abilityType, ability);
  }

  if (isPeeking) return renderPeekCard(abilityType, ability);

  return renderHiddenCard(abilityType);
}

function renderHiddenCard({ type, label, actionLabel, theme }) {
  // Holding the Skill's Activate button summons Pot of Greed (pot-of-greed-easter-egg.js);
  // holding the Comeback's Activate springs a Trap Hole (trap-hole-easter-egg.js);
  // holding the Quest's Complete sends Gaia the Fierce Knight (gaia-easter-egg.js).
  const holdEggs = {
    skill: { press: 'pot-press', start: 'startPotPress', cancel: 'cancelPotPress', allows: 'potAllowsClick' },
    comeback: { press: 'trap-press', start: 'startTrapPress', cancel: 'cancelTrapPress', allows: 'trapAllowsClick' },
    quest: { press: 'gaia-press', start: 'startGaiaPress', cancel: 'cancelGaiaPress', allows: 'gaiaAllowsClick' }
  };
  const egg = holdEggs[type];
  const actionAttrs = egg
    ? `onclick="if (${egg.allows}()) activateAbility('${type}')" onpointerdown="${egg.start}(this)" onpointerup="${egg.cancel}(this)" onpointerleave="${egg.cancel}(this)" onpointercancel="${egg.cancel}(this)" oncontextmenu="return false"`
    : `onclick="activateAbility('${type}')"`;
  const actionClass = egg ? egg.press : '';
  return `
    <div data-fx-card="${type}" class="duel-card-hidden fx-c-${type} flex-1 rounded-2xl border-2 border-dashed border-slate-700 bg-slate-900/50 p-4 flex flex-col items-center justify-center text-center">
      <div onclick="tapLockMedallion('${type}', this)" class="lock-medallion w-11 h-11 mb-2 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 shadow-inner">
        ${LOCK_ICON}
      </div>
      <h3 class="text-sm font-bold text-slate-300 mb-3.5 tracking-widest uppercase">Secret ${label}</h3>
      <div class="flex gap-2.5 w-full max-w-[240px]">
        <button onclick="togglePeek('${type}')" class="flex-1 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-sm font-bold text-slate-200 transition">Peek</button>
        <button ${actionAttrs} class="${actionClass} flex-1 py-2.5 rounded-lg ${theme.btn} ${theme.btnHover} text-sm font-bold text-white shadow-lg ${theme.shadow} transition">${actionLabel}</button>
      </div>
    </div>
  `;
}

function renderPeekCard(abilityType, ability) {
  const { type, hasUses, actionLabel, theme } = abilityType;
  const usesBadge = hasUses
    ? `<span class="text-xs font-semibold px-2 py-0.5 rounded bg-slate-900/80 text-slate-200 border border-slate-700">${formatMaxUsesBadge(getMaxUses(abilityType, ability))}</span>`
    : '';

  return `
    <div data-fx-card="${type}" class="duel-card-peek fx-c-${type} flex-1 rounded-2xl border border-slate-600 bg-slate-800 p-3.5 flex flex-col justify-center overflow-y-auto relative shadow-inner">
      <div class="absolute inset-0 bg-slate-950/50 pointer-events-none rounded-2xl"></div>
      <div class="relative z-10 flex flex-col h-full">
        <div class="flex items-center justify-between mb-1.5">
          <span class="text-xs font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-700 text-slate-200 border border-slate-600">Sneak Peek</span>
          ${usesBadge}
        </div>
        <h3 class="text-lg font-bold text-white mb-1 leading-snug">${ability.name}</h3>
        <p class="text-sm text-slate-200 leading-snug mb-3">${ability.text}</p>

        <div class="mt-auto flex gap-2">
          <button onclick="togglePeek('${type}')" class="flex-1 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-sm font-bold text-white transition border border-slate-600">Close</button>
          <button onclick="activateAbility('${type}')" class="flex-1 py-2 rounded-lg ${theme.btn} ${theme.btnHover} text-sm font-bold text-white transition">${actionLabel}</button>
        </div>
      </div>
    </div>
  `;
}

function renderCompletedQuestCard({ type, label, theme }, ability) {
  return renderActiveCard({
    type,
    containerClass: getActiveContainerClass(theme),
    badgeClass: `${theme.bg} ${theme.text} ${theme.border}`,
    badgeText: `${label} - Completed`,
    controlsHtml: `<button onclick="toggleQuestCompleted(false)" class="text-xs font-semibold text-slate-300 hover:text-white px-2.5 py-1 rounded bg-slate-950/60 border border-slate-800 transition">Undo</button>`,
    ability
  });
}

function renderRevealedAbilityCard(abilityType, ability, uses) {
  const { type, label, theme } = abilityType;
  const maxUses = getMaxUses(abilityType, ability); // number or null (unlimited)
  const hasLimit = typeof maxUses === 'number';
  const isExhausted = hasLimit && uses >= maxUses;

  return renderActiveCard({
    type,
    containerClass: isExhausted
      ? 'duel-card-exhausted flex-1 rounded-2xl border border-slate-700 bg-slate-900/50 p-3.5 flex flex-col justify-center overflow-y-auto relative opacity-75 grayscale-[70%] transition-all'
      : getActiveContainerClass(theme),
    badgeClass: isExhausted
      ? 'bg-slate-800 text-slate-400 border-slate-700'
      : `${theme.bg} ${theme.text} ${theme.border}`,
    badgeText: `${label} - ${isExhausted ? 'Used' : 'Active'}`,
    controlsHtml: `
      <div class="flex items-center gap-1.5">
        <button onclick="hideAbility('${type}')" title="Activated by mistake? Hide it again" class="text-xs font-semibold text-slate-300 hover:text-white px-2.5 py-1 rounded bg-slate-950/60 border border-slate-800 transition">Hide</button>
        ${hasLimit ? renderUsageCounter(type, uses, maxUses, isExhausted) : renderUnlimitedBadge()}
      </div>
    `,
    watermarkHtml: isExhausted ? renderUsedWatermark() : '',
    cardAttrs: isExhausted ? `onclick="tapUsedCard('${type}', event)"` : '',
    ability
  });
}

function getActiveContainerClass(theme) {
  return `duel-card-active flex-1 rounded-2xl border ${theme.glow} bg-gradient-to-b ${theme.grad} to-slate-900/90 p-3.5 flex flex-col justify-center overflow-y-auto shadow-lg ${theme.shadow} transition-all`;
}

function renderActiveCard({ type, containerClass, badgeClass, badgeText, controlsHtml, watermarkHtml = '', cardAttrs = '', ability }) {
  return `
    <div data-fx-card="${type}" class="fx-c-${type} ${containerClass}" ${cardAttrs}>
      ${watermarkHtml}
      <div class="relative z-10 flex flex-col h-full">
        <div class="flex items-center justify-between mb-1.5">
          <span class="text-xs font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded border ${badgeClass}">${badgeText}</span>
          ${controlsHtml}
        </div>
        <h3 class="text-lg font-bold text-white mb-1 leading-snug">${ability.name}</h3>
        <p class="text-sm text-slate-100 leading-snug">${ability.text}</p>
      </div>
    </div>
  `;
}

function renderUsageCounter(type, uses, maxUses, isExhausted) {
  return `
    <div class="flex items-center gap-1.5 bg-slate-950/80 rounded-lg p-1 border border-slate-800 shadow-inner">
      <button onclick="changeUses('${type}', -1)" class="w-7 h-7 flex items-center justify-center rounded bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 text-sm font-bold transition" ${uses <= 0 ? 'disabled' : ''}>-</button>
      <span class="uses-count text-xs font-bold text-slate-200 w-9 text-center">${uses} / ${maxUses}</span>
      <button onclick="changeUses('${type}', 1)" class="w-7 h-7 flex items-center justify-center rounded bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 text-sm font-bold transition" ${isExhausted ? 'disabled' : ''}>+</button>
    </div>
  `;
}

function renderUnlimitedBadge() {
  return `<span class="text-xs font-bold text-slate-200 px-2.5 py-1 rounded-lg bg-slate-950/80 border border-slate-800">∞ Unlimited</span>`;
}

function renderUsedWatermark() {
  return `<div class="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden"><span class="used-watermark text-6xl font-black text-slate-100/5 -rotate-12 tracking-widest uppercase">USED</span></div>`;
}
