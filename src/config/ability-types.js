const THEMES = {
  sky: {
    bg: 'bg-sky-500/20',
    text: 'text-sky-300',
    border: 'border-sky-500/30',
    glow: 'border-sky-500/40',
    grad: 'from-sky-950/40',
    btn: 'bg-sky-600',
    btnHover: 'hover:bg-sky-500',
    shadow: 'shadow-sky-900/20',
    selected: 'bg-sky-950/50 border-sky-400 shadow-sm shadow-sky-500/10'
  },
  rose: {
    bg: 'bg-rose-500/20',
    text: 'text-rose-300',
    border: 'border-rose-500/30',
    glow: 'border-rose-500/40',
    grad: 'from-rose-950/40',
    btn: 'bg-rose-600',
    btnHover: 'hover:bg-rose-500',
    shadow: 'shadow-rose-900/20',
    selected: 'bg-rose-950/50 border-rose-400 shadow-sm shadow-rose-500/10'
  },
  amber: {
    bg: 'bg-amber-500/20',
    text: 'text-amber-300',
    border: 'border-amber-500/30',
    glow: 'border-amber-500/40',
    grad: 'from-amber-950/40',
    btn: 'bg-amber-600',
    btnHover: 'hover:bg-amber-500',
    shadow: 'shadow-amber-900/20',
    selected: 'bg-amber-950/50 border-amber-400 shadow-sm shadow-amber-500/10'
  }
};

// Describes each ability category: where it lives in the character data,
// which state key holds the selection, and how it is presented.
const ABILITY_TYPES = {
  skill: {
    type: 'skill',
    label: 'Skill',
    listKey: 'skills',
    selectionKey: 'selectedSkill',
    hasUses: true,
    actionLabel: 'Activate',
    theme: THEMES.sky
  },
  comeback: {
    type: 'comeback',
    label: 'Comeback',
    listKey: 'comebacks',
    selectionKey: 'selectedComeback',
    hasUses: true,
    actionLabel: 'Activate',
    theme: THEMES.rose
  },
  quest: {
    type: 'quest',
    label: 'Quest',
    listKey: 'quests',
    selectionKey: 'selectedQuest',
    hasUses: false,
    actionLabel: 'Complete',
    theme: THEMES.amber
  }
};

const ABILITY_TYPE_ORDER = [ABILITY_TYPES.skill, ABILITY_TYPES.comeback, ABILITY_TYPES.quest];
