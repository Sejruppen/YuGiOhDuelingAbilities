// Co-op Boss mode: the phone lies between both fields and the players team up
// against a boss. Player 1 sits at the bottom of the screen, Player 2 at the
// top (their half is rotated 180°).
const COOP_PLAYER_LP = 8000;
const COOP_BOND_MAX = 10;
// While a player is down, the boss hits 20% harder.
const COOP_FALLEN_MULT = 1.2;
const COOP_REVIVE_LP = 2000;
const COOP_BOND_COSTS = { foresight: 2, shield: 3, revive: 5, protect: 2 };
const COOP_CATCH_PENALTY = 1000;

const COOP_DIFFICULTIES = {
  rookie: {
    label: 'Rookie', icon: '🌱', bossLp: 12000, bond: 3, bondRate: 1, sealRounds: 4,
    desc: 'Pegasus has 12,000 LP. You start with 3 Bond.'
  },
  duelist: {
    label: 'Duelist', icon: '⚔️', bossLp: 16000, bond: 1, bondRate: 1, sealRounds: 3,
    desc: 'Pegasus has 16,000 LP. The real challenge.'
  },
  pharaoh: {
    label: 'Pharaoh', icon: '👑', bossLp: 20000, bond: 0, bondRate: 0.5, sealRounds: 2, silent: true,
    desc: '20,000 LP. Bond fills at half speed, and you may never talk about your hands.'
  }
};

const COOP_ENCOUNTERS = [
  { id: 'pegasus', icon: '👁️', name: 'Pegasus', title: 'The Millennium Eye', blurb: 'Mind games, Toons and a man who knows your hand.' },
  { id: 'ra', icon: '🔥', name: 'The Winged Dragon of Ra', title: 'Battle City Finals', blurb: 'Coming soon', locked: true },
  { id: 'exodia', icon: '⛓️', name: 'Exodia', title: 'The Forbidden One', blurb: 'Coming soon', locked: true }
];

const PEGASUS = {
  pages: 4,
  pageMinAtk: 1500,
  maxToons: 3,
  // Final Read starts when Pegasus drops to this share of his LP.
  finalReadAt: 0.25,
  restrictBonus: 500,
  restrictMin: 1500,
  restrictCooldown: 2,
  glare: 1500,
  finalGlare: 2000,
  barrage: 1000,
  cheatBonus: 1000,
  banquetHeal: 1000
};

// target: who the Toon attacks (always directly, ignoring monsters).
const PEGASUS_TOONS = {
  mermaid: { name: 'Toon Mermaid', short: 'Mermaid', icon: '🧜‍♀️', atk: 1400, target: 'lowest', rule: 'hits the lowest LP' },
  skull: { name: 'Toon Summoned Skull', short: 'Skull', icon: '💀', atk: 2500, target: 'highest', rule: 'hits the highest LP' },
  dmg: { name: 'Toon Dark Magician Girl', short: 'DMG', icon: '🪄', atk: 2000, target: 'random', stealBond: 1, rule: 'random player, steals 1 Bond' },
  barrel: { name: 'Toon Barrel Dragon', short: 'Barrel', icon: '🔫', atk: 2600, target: 'random', barrels: 3, rule: '3 barrels, 1000 each on a coin flip' },
  gemini: { name: 'Toon Gemini Elf', short: 'Gemini', icon: '👯', atk: 1900, target: 'both', each: 1000, rule: '1000 to both players' }
};

const PEGASUS_BUNNY = { name: 'Funny Bunny', short: 'Bunny', icon: '🐰', atk: 100, rule: 'Pegasus takes no damage while it hops around' };

// Stage 3 bluffs: Pegasus shows two of these, only one is real.
const PEGASUS_BLUFFS = {
  glare: { icon: '👁️', text: `Millennium Glare: ${PEGASUS.finalGlare} to the highest LP` },
  crush: { icon: '🧠', text: 'Mind Crush: a random player discards 2 cards' },
  barrage: { icon: '🌪️', text: `Illusion Barrage: ${PEGASUS.barrage} to both players` }
};

// `when` decides if the card can be drawn right now.
const PEGASUS_FATES = [
  { id: 'bunny', icon: '🐰', name: 'Funny Bunny', text: "A Funny Bunny hops onto Pegasus' field. While it's there, Pegasus and Toon World take no damage.", when: c => !c.guardians.some(g => g.kind === 'bunny') },
  { id: 'dark-rabbit', icon: '🐇', name: 'Dark Rabbit', text: 'Pegasus giggles. The players swap LP!', when: c => c.players.every(p => !isCoopDown(p)) && c.players[0].lp !== c.players[1].lp },
  { id: 'cheat', icon: '🃏', name: 'Pegasus Cheats', text: `Pegasus' next attack gets +${PEGASUS.cheatBonus} ATK.` },
  { id: 'banquet', icon: '🍗', name: 'Banquet of Millions', text: `Both players draw 1 card. Pegasus regains ${PEGASUS.banquetHeal} LP.`, when: c => c.boss.stage >= 2 },
  { id: 'kaiba', icon: '🐉', name: "Kaiba's Soul", text: "Pegasus is busy gloating over Kaiba's soul. +2 Bond." },
  { id: 'rewrite', icon: '📖', name: 'Rewrite the Story', text: 'Toon World restores a page.', when: c => c.boss.stage === 1 && c.pages < PEGASUS.pages },
  { id: 'contents', icon: '📚', name: 'Toon Table of Contents', text: 'Pegasus summons an extra Toon next turn.', when: c => c.boss.stage === 1 },
  { id: 'heart', icon: '✨', name: 'Heart of the Cards', text: 'Each player draws 1 card.' },
  { id: 'shuffle', icon: '🔀', name: "Yugi's Mind Shuffle", text: "Pegasus' next Mind Read fails.", when: c => c.boss.stage >= 2 },
  { id: 'monologue', icon: '🎭', name: 'Villain Monologue', text: 'Pegasus delivers a very long speech about Cyndia. Nothing happens. Thank you, Pegasus.' }
];

const PEGASUS_CUTSCENES = {
  intro: {
    icon: '👁️',
    title: 'Pegasus J. Crawford',
    quote: "Welcome to my Toon World! Two duelists against little old me? How delightful!",
    rules: [
      '📖 Toon World shields Pegasus. Rip out its 4 pages: attack the book with 1500+ ATK, or destroy a Spell/Trap.',
      '🤪 Toons attack you directly. One hit only squashes them — they are destroyed only if BOTH of you hit them in the same round.',
      '◆ Bond fills when you work together. Spend it to shield, revive and peek at the future.',
      '📱 Player 1 sits at the bottom, Player 2 at the top. Read Pegasus\' next move before you play!'
    ]
  },
  stage2: {
    icon: '👁️',
    title: 'The Millennium Eye opens',
    quote: "Enough playtime. Let's see what's in those pretty little heads of yours…",
    rules: [
      '🤫 Silence: no talking about your hands! Use the signal buttons. Your partner may call you out for 1000 LP.',
      '👁️ Mind Read: each turn Pegasus names a card type. The read player must discard one, unless their partner protects them.',
      '🔒 Thousand-Eyes Restrict absorbs a monster. Its owner can\'t attack until Restrict is gone.',
      '🪤 Restrict can only be attacked when its eye is open: activate any Trap to open it.'
    ]
  },
  stage3: {
    icon: '🃏',
    title: 'The Final Read',
    quote: 'Your souls will make a lovely addition to my collection!',
    rules: [
      '⏳ Soul Seal: when the countdown runs out, the player with the lower LP is sealed in a card.',
      '🎭 Pegasus bluffs. He shows two moves, but only one is real.',
      '👁️ Each turn he picks a player who must play with their hand face-up.',
      '⚔️ Restrict is gone. Hit Pegasus with everything you have!'
    ]
  }
};
