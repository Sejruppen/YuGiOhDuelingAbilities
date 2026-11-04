// Selectable list of abilities shown on the Choose Abilities screen.
// `searchable` (Custom only) tags everything for the ability search box.

// Hieroglyphs (20×24, stroked in currentColor) for the "(Type)" prefix of an
// ability name. Only the Millennium theme shows them, as a carved cartouche.
const ABILITY_KIND_GLYPHS = {
  ankh: '<ellipse cx="10" cy="7.5" rx="3" ry="4"/><path d="M5 12.5H15M10 11.5V22"/>',
  eye: '<g transform="translate(0 -21)"><path d="M3 33Q10 27 17 33Q10 38 3 33ZM3.5 28.5Q10 24.5 16.5 28.5M8 37L6.5 42.5M12 37Q14 41 16 40"/><circle cx="10" cy="32.6" r="1.8" fill="currentColor"/></g>',
  water: '<path transform="translate(0 -41)" d="M2.5 51l2.5-2.5 2.5 2.5 2.5-2.5 2.5 2.5 2.5-2.5 2.5 2.5M2.5 57l2.5-2.5 2.5 2.5 2.5-2.5 2.5 2.5 2.5-2.5 2.5 2.5"/>',
  feather: '<path transform="translate(0 -63)" d="M9 85V65Q15 68 14.5 75Q14 81 9 85M7 85H12"/>',
  djed: '<path transform="translate(0 -87.5)" d="M10 92V107M6 92.5H14M6 95.5H14M6 98.5H14M7 107H13"/>',
  sun: '<circle cx="10" cy="12" r="5"/><circle cx="10" cy="12" r="1.2" fill="currentColor"/>'
};
const ABILITY_KIND_WORDS = [
  ['ankh', ['faith', 'heart', 'spirit', 'soul', 'destiny', 'life', 'hope', 'fate']],
  ['eye', ['magic', 'magician', 'spell', 'mystic', 'illusion', 'mind', 'shadow', 'dark', 'trap']],
  ['water', ['friend', 'bond', 'water', 'sea', 'ocean', 'team', 'together', 'family']],
  ['feather', ['justice', 'honor', 'honour', 'order', 'balance', 'truth', 'wisdom', 'fair', 'pride']],
  ['djed', ['strength', 'power', 'fusion', 'machine', 'defen', 'iron', 'stone', 'wall', 'warrior']],
  ['sun', ['dragon', 'fire', 'light', 'sun', 'fury', 'rage', 'god', 'divine', 'flame', 'burn']]
];

function abilityKindGlyph(kind) {
  const lower = kind.toLowerCase();
  const hit = ABILITY_KIND_WORDS.find(([, words]) => words.some(word => lower.includes(word)));
  if (hit) return hit[0];
  const names = Object.keys(ABILITY_KIND_GLYPHS);
  return names[[...lower].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % names.length];
}

// An ability name with its "(Type)" prefix wrapped so themes can style it;
// elsewhere it still reads "(Faith) Heart of the Cards".
function abilityNameHtml(name) {
  const match = /^\(([^)]+)\)\s*/.exec(name);
  if (!match) return name;
  const kind = match[1];
  const glyph = `<svg class="ab-kind-glyph" viewBox="0 0 20 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ABILITY_KIND_GLYPHS[abilityKindGlyph(kind)]}</svg>`;
  return `<span class="ab-kind">${glyph}<span class="ab-kind-p">(</span>${kind}<span class="ab-kind-p">)</span></span> ${name.slice(match[0].length)}`;
}

function renderAbilityPickerSection(abilityType, abilities, step, extraClass = '', searchable = false) {
  const { label, theme, selectionKey } = abilityType;
  const query = searchable ? ui.abilitySearch : '';

  // Custom's pool is tagged by source character: each run of one source is a group with a header.
  const groups = [];
  abilities.forEach((ability, idx) => {
    const last = groups[groups.length - 1];
    if (last && last.source === ability.source) last.indexes.push(idx);
    else groups.push({ source: ability.source, indexes: [idx] });
  });

  let sectionHits = 0;
  const groupsHtml = groups.map(group => {
    let hits = 0;
    const options = group.indexes.map(idx => {
      const haystack = getAbilitySearchText(abilities[idx]);
      const visible = abilityMatchesSearch(haystack, query);
      if (visible) hits++;
      const searchAttrs = searchable ? ` data-search="${tnEsc(haystack)}"${visible ? '' : ' hidden'}` : '';
      return renderAbilityOption(abilityType, abilities[idx], idx, state[selectionKey] === idx, searchAttrs);
    }).join('');
    sectionHits += hits;
    const header = group.source
      ? `<div class="pt-2 text-xs font-bold uppercase tracking-wider text-slate-400">${group.source}</div>`
      : '';
    return `<div${searchable ? ' data-search-group' : ''} class="space-y-2.5"${hits ? '' : ' hidden'}>${header}${options}</div>`;
  }).join('');

  const emptyHtml = searchable
    ? `<p data-search-empty class="text-sm text-slate-500 italic"${sectionHits ? ' hidden' : ''}>No ${label} matches your search.</p>`
    : '';

  return `
    <section${searchable ? ' data-search-section' : ''}${extraClass ? ` class="${extraClass}"` : ''}>
      <div class="flex items-center gap-2 mb-3">
        <span class="px-2.5 py-1 text-xs font-bold uppercase tracking-wider rounded ${theme.bg} ${theme.text} border ${theme.border}">${step}. Choose ${label}</span>
      </div>
      <div class="space-y-2.5">
        ${groupsHtml}
        ${emptyHtml}
      </div>
    </section>
  `;
}

// Lower-cased name, effect text and source duelist: what the search matches against.
function getAbilitySearchText(ability) {
  return `${ability.name} ${ability.text} ${ability.source || ''}`.replace(/<[^>]*>/g, ' ').toLowerCase();
}

// Every word of the query must appear somewhere ("kaiba quest", "draw 2").
function abilityMatchesSearch(haystack, query) {
  return String(query || '').toLowerCase().split(/\s+/).filter(Boolean).every(word => haystack.includes(word));
}

// Filters the rendered picker in place, so typing never re-renders and the
// keyboard stays open. Re-renders (e.g. picking) apply the same filter in markup.
function applyAbilitySearch() {
  const query = ui.abilitySearch;
  document.querySelectorAll('[data-search-section]').forEach(section => {
    let sectionHits = 0;
    section.querySelectorAll('[data-search-group]').forEach(group => {
      let hits = 0;
      group.querySelectorAll('[data-search]').forEach(option => {
        option.hidden = !abilityMatchesSearch(option.dataset.search, query);
        if (!option.hidden) hits++;
      });
      group.hidden = !hits;
      sectionHits += hits;
    });
    const empty = section.querySelector('[data-search-empty]');
    if (empty) empty.hidden = sectionHits > 0;
  });
  const clear = document.querySelector('[data-search-clear]');
  if (clear) clear.hidden = !query;
}

function renderAbilityOption(abilityType, ability, index, isSelected, extraAttrs = '') {
  const { type, theme, hasUses } = abilityType;
  const stateClass = isSelected ? `is-selected ${theme.selected}` : 'bg-slate-900/60 border-slate-800 opacity-75';

  const titleHtml = hasUses
    ? `
      <div class="flex items-center justify-between gap-2 mb-1.5">
        <div class="font-bold text-base text-white">${abilityNameHtml(ability.name)}</div>
        <span class="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 shrink-0">${formatMaxUsesBadge(getMaxUses(abilityType, ability))}</span>
      </div>
    `
    : `<div class="font-bold text-base text-white mb-1.5">${abilityNameHtml(ability.name)}</div>`;

  return `
    <div onclick="pickAbility('${type}', ${index})"${extraAttrs} data-fx-pick="${type}-${index}" class="fx-c-${type} p-4 rounded-xl border transition cursor-pointer ${stateClass}">
      ${titleHtml}
      <div class="text-sm text-slate-200 leading-relaxed">${ability.text}</div>
    </div>
  `;
}
