// Solo mode "Duelist's Road": a short Slay the Spire-style run across
// Duelist Kingdom. You play your physical deck, the enemies live on the phone.
const SOLO_STORAGE_KEY = 'ygo_solo';
const SOLO_HISTORY_KEY = 'ygo_solo_history';
const SOLO_HISTORY_MAX = 30;
const SOLO_START_LP = 8000;
const SOLO_MAX_LP = 8000;
const SOLO_START_CHIPS = 2;
const SOLO_GATE_CHIPS = 10;
const SOLO_CAMPFIRE_HEAL = 0.3;
const SOLO_CAMPFIRE_TRAIN = 500;
const SOLO_FIELD_BONUS = 0.3;
const SOLO_MAX_MONSTERS = 5;
// Equips, the face-down card and Toon World share these Spell/Trap zones.
const SOLO_SPELL_ZONES = 5;

// Map: floors 1-11 branch over 4 columns (Beach 1-3, Forest/Meadow 4-7,
// Mountain/Wasteland 8-11), then one node per floor.
// Bump SOLO_MAP_LAYOUT whenever the floors change: older saved runs and history maps no longer fit.
const SOLO_MAP_LAYOUT = 3;
const SOLO_COLS = 4;
const SOLO_WALKS = 4;
const SOLO_BRANCH_FLOORS = 11;
const SOLO_BEACH_FLOORS = 3;
const SOLO_MIDDLE_FLOORS = 7;
const SOLO_FLOOR = { LABYRINTH: 12, CASTLE: 13 };
// Campfires land on mixed floors in this range (never on a special floor), so that
// every path passes 1 to 2 of them and never two in a row.
const SOLO_CAMPFIRE_FLOORS = [4, 10];
const SOLO_CAMPFIRE_CHANCE = 0.12;
const SOLO_CAMPFIRE_MAX = 2;
// Floors that aren't a random mix. 'events' = only Shadow Games (regional ones are likelier),
// 'fork' = a duelist or a Shadow Game, 'gamble' = only roll-heavy Shadow Games.
const SOLO_FLOOR_KINDS = { 1: 'duelist', 3: 'events', 6: 'treasure', 7: 'fork', 11: 'gamble' };
const SOLO_REGIONAL_EVENT_BOOST = 3;
const SOLO_GAMBLE_EVENTS = ['dice', 'duke', 'number', 'well', 'hustler', 'stranger', 'nest', 'grave'];
// Shadow Games that mostly give (giftWeight) or end in a duel (ambushWeight).
const SOLO_GIFT_EVENTS = ['spring', 'friends', 'shadi', 'lunch'];
const SOLO_AMBUSH_EVENTS = ['case', 'nest', 'grave', 'lottery'];
const SOLO_MIXED_ODDS = { duelist: 50, event: 30, elite: 20 };
// Share of mixed nodes (never elites) shown as ❓ until you step on them.
const SOLO_HIDDEN_CHANCE = 0.33;

// Difficulty levels. Easy is the original run, so its values are the constants above.
// Never scaled, because they match the anime: starting Star Chips, the chips needed for the castle
// and the region field bonuses.
//   lpMult / maxAtkBonus  enemy LP (not Pegasus) and how much higher the ATK cap of generic cards is
//   actionBonusDuelist / actionBonusDuelistLate / actionBonusElite  extra cards the enemy plays each turn
//                      (the late bonus comes on top from the second floor tier on; elites include the Paradox Brothers)
//   cardBias           chance that a summon is picked from the stronger half of the deck
//   spellBoost / removalFrom  how much likelier Spells/Traps are, and the floor Spell/Trap removal starts at
//   hideIntents / hideIntentsEye  how many of the enemy's planned moves show as ❓, without and with the Millennium Eye (Infinity = all)
//   mixedOdds / eliteLoosen  node odds on mixed floors; elite rules: 0 = as before, 1 = elites may also land
//                            on the beach, 2 = also back to back and twice in one region
//   floorKinds / hiddenChance  which floors are special, and the share of mixed nodes shown as ❓
//   campfire*          heal share, per-node chance, max per path and whether every path gets one
//   treasureChoices / eliteChoices / commonsOnly  relic offers (commonsOnly = elites offer commons instead of rares)
//   tollMult / giftWeight / ambushWeight  Shadow Game costs and how likely gifts and ambushes are
//   pegasusLp / pegasusPages / pegasusLevel  the final duel (level 0-2 adds mind games)
const SOLO_DIFFICULTY_ORDER = ['easy', 'hard', 'nightmare'];
const SOLO_DEFAULT_DIFFICULTY = 'easy';
const SOLO_DIFFICULTIES = {
  easy: {
    name: 'Easy', icon: '🍼', desc: 'The original road across Duelist Kingdom.',
    lpMult: 1, maxAtkBonus: 0, actionBonusDuelist: 0, actionBonusDuelistLate: 0, actionBonusElite: 0,
    cardBias: 0, spellBoost: 1, removalFrom: 5, hideIntents: 0, hideIntentsEye: 0,
    mixedOdds: SOLO_MIXED_ODDS, eliteLoosen: 0, floorKinds: SOLO_FLOOR_KINDS, hiddenChance: SOLO_HIDDEN_CHANCE,
    campfireHeal: SOLO_CAMPFIRE_HEAL, campfireChance: SOLO_CAMPFIRE_CHANCE, campfireMax: SOLO_CAMPFIRE_MAX, campfireGuarantee: true,
    treasureChoices: 3, eliteChoices: 2, commonsOnly: false,
    tollMult: 1, giftWeight: 1, ambushWeight: 1,
    pegasusLp: 8000, pegasusPages: 3, pegasusLevel: 0
  },
  hard: {
    name: 'Hard', icon: '⚔️', desc: 'Tougher duelists, hidden moves, fewer campfires and a longer book to tear.',
    lpMult: 1.5, maxAtkBonus: 200, actionBonusDuelist: 0, actionBonusDuelistLate: 1, actionBonusElite: 1,
    cardBias: 0.3, spellBoost: 1.5, removalFrom: 3, hideIntents: 1, hideIntentsEye: 0,
    mixedOdds: { duelist: 40, event: 30, elite: 30 }, eliteLoosen: 1,
    floorKinds: { 3: 'events', 6: 'treasure', 7: 'fork', 11: 'gamble' }, hiddenChance: 0.55,
    campfireHeal: 0.15, campfireChance: 0.08, campfireMax: 1, campfireGuarantee: false,
    treasureChoices: 2, eliteChoices: 1, commonsOnly: false,
    tollMult: 1.5, giftWeight: 0.6, ambushWeight: 1.5,
    pegasusLp: 10000, pegasusPages: 4, pegasusLevel: 1
  },
  nightmare: {
    name: 'Nightmare', icon: '💀', desc: 'Extremely punishing. Every duel is a fight for your soul.',
    lpMult: 2.25, maxAtkBonus: 400, actionBonusDuelist: 1, actionBonusDuelistLate: 1, actionBonusElite: 2,
    cardBias: 0.6, spellBoost: 2, removalFrom: 1, hideIntents: Infinity, hideIntentsEye: 1,
    mixedOdds: { duelist: 30, event: 30, elite: 40 }, eliteLoosen: 2,
    floorKinds: { 6: 'treasure', 7: 'fork' }, hiddenChance: 0.8,
    campfireHeal: 0.1, campfireChance: 0.04, campfireMax: 1, campfireGuarantee: false,
    treasureChoices: 1, eliteChoices: 1, commonsOnly: true,
    tollMult: 2, giftWeight: 0.2, ambushWeight: 2,
    pegasusLp: 12000, pegasusPages: 6, pegasusLevel: 2
  }
};
// SOLO_CLEARS_KEY lives in app-themes.js (the Millennium theme reads it before this file loads).
const SOLO_DIFFICULTY_KEY = 'ygo_solo_difficulty';

// The Millennium Items shelf on the Solo menu: each item lights up after
// `clears` wins against Pegasus on `difficulty`. `unlocks` opens a difficulty
// (soloDifficultyUnlocked) or the Millennium theme (keep in sync with its
// `unlockClears` in app-themes.js). Icons: SOLO_SHELF_ART (solo-view.js).
const SOLO_SHELF = [
  { id: 'puzzle', name: 'Millennium Puzzle', difficulty: 'easy', clears: 1 },
  { id: 'necklace', name: 'Millennium Necklace', difficulty: 'easy', clears: 2, unlocks: 'hard' },
  { id: 'scale', name: 'Millennium Scale', difficulty: 'hard', clears: 1 },
  { id: 'key', name: 'Millennium Key', difficulty: 'hard', clears: 2, unlocks: 'nightmare' },
  { id: 'ring', name: 'Millennium Ring', difficulty: 'nightmare', clears: 1 },
  { id: 'rod', name: 'Millennium Rod', difficulty: 'nightmare', clears: 2 },
  { id: 'eye', name: 'Millennium Eye', difficulty: 'nightmare', clears: 3, unlocks: 'millennium' }
];
const soloTimes = n => (n === 1 ? 'once' : n === 2 ? 'twice' : `${n} times`);

const SOLO_NODE_TYPES = {
  duelist: { icon: '⚔️', label: 'Duelist', desc: 'A wandering duelist. Win for +1 ⭐.' },
  elite: { icon: '👹', label: 'Elite', desc:     'A dangerous veteran duelist. Win for +2 ⭐ and a relic.' },
      treasure: { icon: '🎁', label: 'Treasure', desc: "A lost Duelist's Case. Pick one of its relics." },
  event: { icon: '🌀', label: 'Shadow Game', desc: 'A strange encounter. Choose wisely: some choices are a gamble.' },
  hidden: { icon: '❓', label: 'Unknown', desc: 'Hidden in the mist: a duelist or a Shadow Game. You find out when you get there.' },
  campfire: { icon: '🔥', label: 'Campfire', desc: `Choose one: rest (heal a share of your max LP), train with Joey (+${SOLO_CAMPFIRE_TRAIN} max LP) or polish a relic.` },
  labyrinth: { icon: '🧱', label: 'Labyrinth', desc: `Only if you have fewer than ${SOLO_GATE_CHIPS} ⭐. The Paradox Brothers guard it. Win to get the missing chips.` },
  castle: { icon: '🏰', label: 'Castle', desc: "Pegasus' castle. Win to finish the run." }
};

// Field bonuses follow the anime's Duelist Kingdom terrain rules; `card` is the matching Field Spell.
const SOLO_REGIONS = {
  beach: { name: 'Beach', icon: '🏖️', card: 'Umi', types: ['Aqua', 'Fish', 'Sea Serpent'], titles: ['Fisherman', 'Sailor', 'Beachcomber'] },
  forest: { name: 'Forest', icon: '🌲', card: 'Forest', types: ['Insect', 'Beast', 'Plant', 'Beast-Warrior'], titles: ['Bug Catcher', 'Forest Ranger', 'Beast Tamer'] },
  meadow: { name: 'Meadow', icon: '🌾', card: 'Sogen', types: ['Warrior', 'Beast-Warrior'], titles: ['Knight', 'Squire', 'Swordsman'] },
  mountain: { name: 'Mountain', icon: '⛰️', card: 'Mountain', types: ['Dragon', 'Winged Beast', 'Thunder'], titles: ['Dragon Tamer', 'Mountain Hermit', 'Bird Keeper'] },
  wasteland: { name: 'Wasteland', icon: '💀', card: 'Wasteland', types: ['Zombie', 'Dinosaur', 'Rock'], titles: ['Gravedigger', 'Bone Collector', 'Fossil Hunter'] },
  labyrinth: { name: 'Labyrinth', icon: '🧱', types: [], titles: ['Labyrinth Guard', 'Gatekeeper'] },
  castle: { name: 'Castle', icon: '🏰', types: [], titles: [] }
};

const SOLO_FIRST_NAMES = ['Hiro', 'Aiko', 'Ren', 'Kenji', 'Yuki', 'Sora', 'Daichi', 'Mika', 'Taro', 'Hana', 'Kaito', 'Rin', 'Shun', 'Emi', 'Riku', 'Nao'];

// Duel Monsters-era cards with their real stats. Each region has 16: 12 of level 4 or lower, then 4 of level 5+.
// Elites have 12 (8 low, 4 high) plus their special cards.
const SOLO_MONSTERS = {
  beach: [
    { name: 'Root Water', type: 'Fish', atk: 900, def: 800, icon: '🐟' },
    { name: 'Fire Kraken', type: 'Aqua', atk: 1600, def: 1500, icon: '🦑' },
    { name: 'Enchanting Mermaid', type: 'Fish', atk: 1200, def: 900, icon: '🧜‍♀️' },
    { name: 'Aqua Madoor', type: 'Spellcaster', atk: 1200, def: 2000, icon: '💧' },
    { name: 'Water Omotics', type: 'Aqua', atk: 1400, def: 1200, icon: '🌊' },
    { name: 'Great White', type: 'Fish', atk: 1600, def: 800, icon: '🦈' },
    { name: 'Bottom Dweller', type: 'Fish', atk: 1650, def: 1700, icon: '🐡' },
    { name: '7 Colored Fish', type: 'Fish', atk: 1800, def: 800, icon: '🐠' },
    { name: 'Kairyu-Shin', type: 'Sea Serpent', atk: 1800, def: 1500, icon: '🐉' },
    { name: 'Giant Red Seasnake', type: 'Aqua', atk: 1800, def: 800, icon: '🐍' },
    { name: 'High Tide Gyojin', type: 'Aqua', atk: 1650, def: 1300, icon: '🔱' },
    { name: 'Jellyfish', type: 'Aqua', atk: 1200, def: 1500, icon: '🪼' },
    { name: 'Tongyo', type: 'Fish', atk: 1350, def: 800, icon: '🎣' },
    { name: 'Sea Serpent Warrior of Darkness', type: 'Sea Serpent', atk: 1800, def: 1500, icon: '🌑' },
    { name: 'Spike Seadra', type: 'Sea Serpent', atk: 1600, def: 1300, icon: '🦎' },
    { name: 'Deepsea Shark', type: 'Fish', atk: 1900, def: 1600, icon: '🦈' }
  ],
  forest: [
    { name: 'Basic Insect', type: 'Insect', atk: 500, def: 700, icon: '🐞' },
    { name: 'Killer Needle', type: 'Insect', atk: 1200, def: 1000, icon: '🐝' },
    { name: 'Silver Fang', type: 'Beast', atk: 1200, def: 800, icon: '🐺' },
    { name: 'Darkworld Thorns', type: 'Plant', atk: 1200, def: 900, icon: '🌵' },
    { name: 'Mystic Horseman', type: 'Beast', atk: 1300, def: 1550, icon: '🐴' },
    { name: 'Hercules Beetle', type: 'Insect', atk: 1500, def: 2000, icon: '🪲' },
    { name: 'Trent', type: 'Plant', atk: 1500, def: 1800, icon: '🌳' },
    { name: 'Leogun', type: 'Beast', atk: 1750, def: 1550, icon: '🦁' },
    { name: 'Flying Kamakiri #2', type: 'Insect', atk: 1500, def: 800, icon: '🦗' },
    { name: 'Girochin Kuwagata', type: 'Insect', atk: 1700, def: 1000, icon: '🦂' },
    { name: 'Kuwagata α', type: 'Insect', atk: 1250, def: 1000, icon: '🪳' },
    { name: 'Bean Soldier', type: 'Plant', atk: 1400, def: 1300, icon: '🫘' },
    { name: 'Mystic Tomato', type: 'Plant', atk: 1400, def: 1100, icon: '🍅' },
    { name: 'Gazelle the King of Mythical Beasts', type: 'Beast', atk: 1500, def: 1200, icon: '🦌' },
    { name: 'Great Angus', type: 'Beast', atk: 1800, def: 600, icon: '🐃' },
    { name: 'Queen of Autumn Leaves', type: 'Plant', atk: 1800, def: 1500, icon: '🍂' }
  ],
  meadow: [
    { name: 'Swordsman of Landstar', type: 'Warrior', atk: 500, def: 1200, icon: '🗡️' },
    { name: 'Battle Warrior', type: 'Warrior', atk: 700, def: 1000, icon: '🥊' },
    { name: 'Giant Soldier of Stone', type: 'Rock', atk: 1300, def: 2000, icon: '🗿' },
    { name: 'Celtic Guardian', type: 'Warrior', atk: 1400, def: 1200, icon: '⚔️' },
    { name: 'Kojikocy', type: 'Warrior', atk: 1500, def: 1200, icon: '🛡️' },
    { name: 'Axe Raider', type: 'Warrior', atk: 1700, def: 1150, icon: '🪓' },
    { name: 'Battle Ox', type: 'Beast-Warrior', atk: 1700, def: 1000, icon: '🐂' },
    { name: 'Panther Warrior', type: 'Beast-Warrior', atk: 2000, def: 1600, icon: '🐆' },
    { name: 'Beaver Warrior', type: 'Beast-Warrior', atk: 1200, def: 1500, icon: '🦫' },
    { name: 'Warrior Dai Grepher', type: 'Warrior', atk: 1700, def: 1600, icon: '🤺' },
    { name: 'Beautiful Headhuntress', type: 'Warrior', atk: 1600, def: 800, icon: '🏹' },
    { name: 'Alpha the Magnet Warrior', type: 'Rock', atk: 1400, def: 1700, icon: '🧲' },
    { name: 'Battle Steer', type: 'Beast-Warrior', atk: 1800, def: 1300, icon: '🐃' },
    { name: 'Ansatsu', type: 'Warrior', atk: 1700, def: 1200, icon: '🥷' },
    { name: 'Rude Kaiser', type: 'Beast-Warrior', atk: 1800, def: 1600, icon: '🦍' },
    { name: 'Stone Ogre Grotto', type: 'Rock', atk: 1600, def: 1500, icon: '🪨' }
  ],
  mountain: [
    { name: 'Baby Dragon', type: 'Dragon', atk: 1200, def: 700, icon: '🐲' },
    { name: 'Harpie Lady', type: 'Winged Beast', atk: 1300, def: 1400, icon: '🪶' },
    { name: 'Winged Dragon, Guardian of the Fortress #1', type: 'Dragon', atk: 1400, def: 1200, icon: '🐉' },
    { name: 'Faith Bird', type: 'Winged Beast', atk: 1500, def: 1100, icon: '🦅' },
    { name: 'Koumori Dragon', type: 'Dragon', atk: 1500, def: 1200, icon: '🦇' },
    { name: 'Thunder Dragon', type: 'Thunder', atk: 1600, def: 1500, icon: '⚡' },
    { name: 'Crawling Dragon', type: 'Dragon', atk: 1600, def: 1400, icon: '🐊' },
    { name: 'Kaminari Attack', type: 'Thunder', atk: 1900, def: 1400, icon: '🌩️' },
    { name: 'Blackland Fire Dragon', type: 'Dragon', atk: 1500, def: 800, icon: '🔥' },
    { name: 'Luster Dragon', type: 'Dragon', atk: 1900, def: 1600, icon: '💎' },
    { name: 'Lesser Dragon', type: 'Dragon', atk: 1200, def: 1000, icon: '🦎' },
    { name: 'Skull Red Bird', type: 'Winged Beast', atk: 1550, def: 1200, icon: '🐦' },
    { name: 'Blue-Winged Crown', type: 'Winged Beast', atk: 1600, def: 1200, icon: '🦜' },
    { name: 'Sonic Duck', type: 'Winged Beast', atk: 1700, def: 700, icon: '🦆' },
    { name: 'Tripwire Beast', type: 'Thunder', atk: 1200, def: 1300, icon: '🪤' },
    { name: 'Curse of Dragon', type: 'Dragon', atk: 2000, def: 1500, icon: '🐲' }
  ],
  wasteland: [
    { name: 'Skull Servant', type: 'Zombie', atk: 300, def: 200, icon: '💀' },
    { name: 'Clown Zombie', type: 'Zombie', atk: 1350, def: 0, icon: '🤡' },
    { name: 'Armored Zombie', type: 'Zombie', atk: 1500, def: 0, icon: '🧟' },
    { name: 'Uraby', type: 'Dinosaur', atk: 1500, def: 800, icon: '🦖' },
    { name: 'Dragon Zombie', type: 'Zombie', atk: 1600, def: 0, icon: '🦴' },
    { name: 'Sword Arm of Dragon', type: 'Dinosaur', atk: 1750, def: 2030, icon: '🦕' },
    { name: 'Megazowler', type: 'Dinosaur', atk: 1800, def: 2000, icon: '🦏' },
    { name: 'Crawling Dragon #2', type: 'Dinosaur', atk: 1600, def: 1200, icon: '🐊' },
    { name: 'Kabazauls', type: 'Dinosaur', atk: 1700, def: 1500, icon: '🦛' },
    { name: 'Mammoth Graveyard', type: 'Dinosaur', atk: 1200, def: 800, icon: '🦣' },
    { name: 'Gilasaurus', type: 'Dinosaur', atk: 1400, def: 400, icon: '🦎' },
    { name: 'Master Kyonshee', type: 'Zombie', atk: 1750, def: 1000, icon: '🧧' },
    { name: 'Wandering Mummy', type: 'Zombie', atk: 1500, def: 1500, icon: '🏺' },
    { name: 'Regenerating Mummy', type: 'Zombie', atk: 1800, def: 1500, icon: '🩹' },
    { name: 'Giant Axe Mummy', type: 'Zombie', atk: 1700, def: 2000, icon: '🪓' },
    { name: 'Vampire Lord', type: 'Zombie', atk: 2000, def: 1500, icon: '🧛' }
  ]
};

// Floor tiers for generic duelists. Elites and the castle have their own.
const SOLO_TIERS = [
  { maxFloor: 4, lp: 1500, maxAtk: 1400 },
  { maxFloor: 8, lp: 2000, maxAtk: 1800 },
  { maxFloor: 99, lp: 2500, maxAtk: 2000 }
];
const SOLO_ELITE = { lp: 4000, maxAtk: 2000, actions: 2, chips: 2 };

// Anime elites. Each has a fixed deck, a personality and a gimmick.
//   minRound  the card only shows up from that round (aces)
//   unique    never twice on the field; special = only via the gimmick
//   pos       always summoned in this position
// One elite per region (Mako on the beach); Bandit Keith can show up in any region instead.
const SOLO_KEITH_CHANCE = 0.2;
const SOLO_ELITES = {
  mako: {
    name: 'Mako Tsunami', icon: '🎣', region: 'beach', personality: 'aggressive', specialCard: "Fortress Whale's Oath",
    quote: "Ahoy, landlubber! I'm the Ocean Master, and the sea is about to swallow you whole!",
    gimmick: "🐋 Fortress Whale's Oath: he sacrifices two of his sea monsters (Fish, Aqua or Sea Serpent) to summon Fortress Whale (2900 ATK).",
    monsters: [
      { name: 'Island Turtle', type: 'Aqua', atk: 1000, def: 2000, icon: '🐢' },
      { name: 'Jellyfish', type: 'Aqua', atk: 1200, def: 1500, icon: '🪼' },
      { name: 'Mother Grizzly', type: 'Beast-Warrior', atk: 1400, def: 1000, icon: '🐻' },
      { name: 'Great White', type: 'Fish', atk: 1600, def: 800, icon: '🦈' },
      { name: 'Great White', type: 'Fish', atk: 1600, def: 800, icon: '🦈' },
      { name: '7 Colored Fish', type: 'Fish', atk: 1800, def: 800, icon: '🐠' },
      { name: 'Giant Red Seasnake', type: 'Aqua', atk: 1800, def: 800, icon: '🐍' },
      { name: 'Kairyu-Shin', type: 'Sea Serpent', atk: 1800, def: 1500, icon: '🐉' },
      { name: 'The Legendary Fisherman', type: 'Warrior', atk: 1850, def: 1600, icon: '🎣', minRound: 2, unique: true },
      { name: 'Amphibian Beast', type: 'Fish', atk: 2400, def: 2000, icon: '🐸', minRound: 3, unique: true },
      { name: 'Fortress Whale', type: 'Fish', atk: 2900, def: 2150, icon: '🐋', special: true }
    ]
  },
  weevil: {
    name: 'Weevil Underwood', icon: '🐛', region: 'forest', personality: 'trickster', specialCard: 'Cocoon of Evolution',
    quote: 'Heh heh heh… my insects are hungry, and you look delicious!',
    gimmick: '🥚 Cocoon of Evolution: a cocoon hatches into Great Moth (2600 ATK) after 2 of his turns, unless you destroy it first.',
    monsters: [
      { name: 'Basic Insect', type: 'Insect', atk: 500, def: 700, icon: '🐞' },
      { name: 'Petit Moth', type: 'Insect', atk: 300, def: 200, icon: '🐛' },
      { name: 'Kumootoko', type: 'Insect', atk: 700, def: 1400, icon: '🕷️' },
      { name: 'Killer Needle', type: 'Insect', atk: 1200, def: 1000, icon: '🐝' },
      { name: 'Flying Kamakiri #1', type: 'Insect', atk: 1400, def: 900, icon: '🦗' },
      { name: 'Flying Kamakiri #2', type: 'Insect', atk: 1500, def: 800, icon: '🦗' },
      { name: 'Giant Flea', type: 'Insect', atk: 1500, def: 1200, icon: '🦟' },
      { name: 'Neo Bug', type: 'Insect', atk: 1800, def: 1700, icon: '🐜', minRound: 2 },
      { name: 'Hercules Beetle', type: 'Insect', atk: 1500, def: 2000, icon: '🪲' },
      { name: 'Hunter Spider', type: 'Insect', atk: 1600, def: 1400, icon: '🕸️', minRound: 2 },
      { name: 'Kwagar Hercules', type: 'Insect', atk: 1900, def: 1700, icon: '🪲', minRound: 2, unique: true },
      { name: 'Insect Queen', type: 'Insect', atk: 2200, def: 2400, icon: '👑', minRound: 3, unique: true }
    ]
  },
  mai: {
    name: 'Mai Valentine', icon: '💅', region: 'meadow', personality: 'aggressive', specialCard: 'Elegant Egotist',
    quote: "Don't take it personally, hon. My Harpies just love a fresh target.",
    gimmick: '🪞 Elegant Egotist: turns a Harpie Lady into Harpie Lady Sisters (1950 ATK).',
    monsters: [
      { name: 'Harpie Lady', type: 'Winged Beast', atk: 1300, def: 1400, icon: '🪶' },
      { name: 'Harpie Lady', type: 'Winged Beast', atk: 1300, def: 1400, icon: '🪶' },
      { name: 'Harpie Lady', type: 'Winged Beast', atk: 1300, def: 1400, icon: '🪶' },
      { name: 'Faith Bird', type: 'Winged Beast', atk: 1500, def: 1100, icon: '🕊️' },
      { name: 'Skull Red Bird', type: 'Winged Beast', atk: 1550, def: 1200, icon: '🐦' },
      { name: 'Blue-Winged Crown', type: 'Winged Beast', atk: 1600, def: 1200, icon: '🦜' },
      { name: 'Sacred Crane', type: 'Winged Beast', atk: 1600, def: 400, icon: '🦢' },
      { name: 'Birdface', type: 'Winged Beast', atk: 1600, def: 1600, icon: '🐓' },
      { name: 'Winged Sage Falcos', type: 'Winged Beast', atk: 1700, def: 1200, icon: '🦉' },
      { name: 'Cyber Harpie', type: 'Winged Beast', atk: 1800, def: 1300, icon: '🦅' },
      { name: 'Peacock', type: 'Winged Beast', atk: 1700, def: 1500, icon: '🦚', minRound: 2 },
      { name: 'Queen Bird', type: 'Winged Beast', atk: 1200, def: 2000, icon: '🐤', minRound: 2 },
      { name: 'Punished Eagle', type: 'Winged Beast', atk: 2100, def: 1800, icon: '🦅', minRound: 3, unique: true },
      { name: "Harpie's Pet Dragon", type: 'Dragon', atk: 2000, def: 2500, icon: '🐉', minRound: 3, unique: true },
      { name: 'Harpie Lady Sisters', type: 'Winged Beast', atk: 1950, def: 2100, icon: '👯‍♀️', minRound: 3, unique: true }
    ]
  },
  rex: {
    name: 'Rex Raptor', icon: '🦖', region: 'mountain', personality: 'aggressive',
    quote: 'Dinosaurs ruled the earth, and they rule this duel too!',
    gimmick: '🦖 When your field is empty, his Dinosaurs attack twice.',
    monsters: [
      { name: 'Uraby', type: 'Dinosaur', atk: 1500, def: 800, icon: '🦖' },
      { name: 'Mammoth Graveyard', type: 'Dinosaur', atk: 1200, def: 800, icon: '🦣' },
      { name: 'Gilasaurus', type: 'Dinosaur', atk: 1400, def: 400, icon: '🦎' },
      { name: 'Mad Sword Beast', type: 'Dinosaur', atk: 1400, def: 1200, icon: '🗡️' },
      { name: 'Hyper Hammerhead', type: 'Dinosaur', atk: 1500, def: 1200, icon: '🔨' },
      { name: 'Two-Headed King Rex', type: 'Dinosaur', atk: 1600, def: 1200, icon: '🦕' },
      { name: 'Crawling Dragon #2', type: 'Dinosaur', atk: 1600, def: 1200, icon: '🐊' },
      { name: 'Kabazauls', type: 'Dinosaur', atk: 1700, def: 1500, icon: '🦛' },
      { name: 'Sword Arm of Dragon', type: 'Dinosaur', atk: 1750, def: 2030, icon: '🦕' },
      { name: 'Megazowler', type: 'Dinosaur', atk: 1800, def: 2000, icon: '🦏', minRound: 2 },
      { name: 'Black Tyranno', type: 'Dinosaur', atk: 2600, def: 1800, icon: '🦖', minRound: 3, unique: true },
      { name: 'Red-Eyes Black Dragon', type: 'Dragon', atk: 2400, def: 2000, icon: '🐲', minRound: 3, unique: true }
    ]
  },
  bonz: {
    name: 'Bonz', icon: '⚰️', region: 'wasteland', personality: 'wall',
    quote: 'Welcome to my graveyard… you will be staying a while.',
    gimmick: "🧟 His Zombies rise again on his next turn after they're destroyed (once each).",
    monsters: [
      { name: 'Skull Servant', type: 'Zombie', atk: 300, def: 200, icon: '💀' },
      { name: 'Clown Zombie', type: 'Zombie', atk: 1350, def: 0, icon: '🤡' },
      { name: 'Armored Zombie', type: 'Zombie', atk: 1500, def: 0, icon: '🧟' },
      { name: 'Wandering Mummy', type: 'Zombie', atk: 1500, def: 1500, icon: '🏺' },
      { name: 'Vampire Lady', type: 'Zombie', atk: 1550, def: 1550, icon: '🧛‍♀️' },
      { name: 'Dragon Zombie', type: 'Zombie', atk: 1600, def: 0, icon: '🦴' },
      { name: 'Master Kyonshee', type: 'Zombie', atk: 1750, def: 1000, icon: '🧧' },
      { name: 'Regenerating Mummy', type: 'Zombie', atk: 1800, def: 1500, icon: '🩹' },
      { name: 'Shadow Ghoul', type: 'Zombie', atk: 1600, def: 1300, icon: '👻', minRound: 2 },
      { name: 'Pumpking the King of Ghosts', type: 'Zombie', atk: 1800, def: 2000, icon: '🎃', minRound: 2 },
      { name: 'Patrician of Darkness', type: 'Zombie', atk: 2000, def: 1400, icon: '🕯️', minRound: 3, unique: true },
      { name: 'Ryu Kokki', type: 'Zombie', atk: 2400, def: 2000, icon: '👹', minRound: 3, unique: true }
    ]
  },
  keith: {
    name: 'Bandit Keith', icon: '🕶️', region: null, personality: 'trickster',
    quote: "Listen up, punk. Here's a lesson in American dueling!",
    gimmick: '🃏 Once per duel he plays a card up his sleeve, without warning.',
    monsters: [
      { name: 'Gradius', type: 'Machine', atk: 1200, def: 800, icon: '🚀' },
      { name: 'Giga-Tech Wolf', type: 'Machine', atk: 1200, def: 1400, icon: '🐺' },
      { name: 'Cyber Soldier of Darkworld', type: 'Machine', atk: 1400, def: 1200, icon: '🦾' },
      { name: 'Ground Attacker Bugroth', type: 'Machine', atk: 1500, def: 1000, icon: '🚜' },
      { name: 'Robotic Knight', type: 'Machine', atk: 1600, def: 1800, icon: '🤖' },
      { name: 'Guardian of the Throne Room', type: 'Machine', atk: 1650, def: 1600, icon: '🏛️' },
      { name: 'X-Head Cannon', type: 'Machine', atk: 1800, def: 1500, icon: '🔫' },
      { name: 'Mechanicalchaser', type: 'Machine', atk: 1850, def: 800, icon: '⚙️' },
      { name: 'Slot Machine', type: 'Machine', atk: 2000, def: 2300, icon: '🎰' },
      { name: 'Spikebot', type: 'Machine', atk: 1800, def: 1700, icon: '📌', minRound: 2 },
      { name: 'Launcher Spider', type: 'Machine', atk: 2200, def: 2500, icon: '🕷️', minRound: 2, unique: true },
      { name: 'Metal Dragon', type: 'Machine', atk: 1850, def: 1700, icon: '🐲', minRound: 3, unique: true },
      { name: 'Barrel Dragon', type: 'Machine', atk: 2600, def: 2200, icon: '🔫', special: true }
    ]
  },
  paradox: {
    name: 'Paradox Brothers', icon: '👬', region: 'labyrinth', personality: 'wall', plural: true, specialCard: 'Polymerization: Gate Guardian',
    quote: 'Two doors, two brothers, one way out. Only one of us tells the truth…',
    gimmick: '🚪 With Sanga, Kazejin and Suijin on the field, they fuse into Gate Guardian (3750 ATK). Labyrinth Wall (0/3000) guards them.',
    monsters: [
      { name: 'Labyrinth Wall', type: 'Rock', atk: 0, def: 3000, icon: '🧱', unique: true, pos: 'def' },
      { name: 'Guardian of the Labyrinth', type: 'Warrior', atk: 1000, def: 1200, icon: '💂' },
      { name: 'The Statue of Easter Island', type: 'Rock', atk: 1100, def: 1400, icon: '🗿' },
      { name: 'Giant Soldier of Stone', type: 'Rock', atk: 1300, def: 2000, icon: '🪨' },
      { name: 'Legendary Jujitsu Master', type: 'Rock', atk: 1300, def: 1800, icon: '🥋' },
      { name: 'Alpha the Magnet Warrior', type: 'Rock', atk: 1400, def: 1700, icon: '🧲' },
      { name: 'Destroyer Golem', type: 'Rock', atk: 1500, def: 1000, icon: '🛠️' },
      { name: 'Gamma the Magnet Warrior', type: 'Rock', atk: 1500, def: 1800, icon: '🧲' },
      { name: 'Beta the Magnet Warrior', type: 'Rock', atk: 1700, def: 1600, icon: '🧲' },
      { name: 'Sanga of the Thunder', type: 'Thunder', atk: 2600, def: 2200, icon: '⚡', unique: true },
      { name: 'Kazejin', type: 'Spellcaster', atk: 2400, def: 2200, icon: '🌪️', unique: true },
      { name: 'Suijin', type: 'Aqua', atk: 2500, def: 2400, icon: '🌊', unique: true },
      // The trio twice, so the gimmick still has a fair chance among the walls
      { name: 'Sanga of the Thunder', type: 'Thunder', atk: 2600, def: 2200, icon: '⚡', unique: true },
      { name: 'Kazejin', type: 'Spellcaster', atk: 2400, def: 2200, icon: '🌪️', unique: true },
      { name: 'Suijin', type: 'Aqua', atk: 2500, def: 2400, icon: '🌊', unique: true },
      { name: 'Gate Guardian', type: 'Warrior', atk: 3750, def: 3400, icon: '🗿', special: true }
    ]
  }
};
// Cards the gimmicks bring in.
const SOLO_GIMMICK_CARDS = {
  cocoon: { name: 'Cocoon of Evolution', type: 'Insect', atk: 0, def: 2000, icon: '🥚' },
  moth: { name: 'Great Moth', type: 'Insect', atk: 2600, def: 2500, icon: '🦋' },
  sisters: { name: 'Harpie Lady Sisters', type: 'Winged Beast', atk: 1950, def: 2100, icon: '👯‍♀️' },
  nuzzler: { name: 'Malevolent Nuzzler', atk: 700 }
};
const SOLO_COCOON_TURNS = 2;
const SOLO_SPECIAL_WEIGHT = 6;
// Bandit Keith's sleeve card: from round 2, 50% each turn, surely by round 4.
const SOLO_SLEEVE = { fromRound: 2, chance: 0.5, byRound: 4 };
const SOLO_PARADOX_TRIO = ['Sanga of the Thunder', 'Kazejin', 'Suijin'];
// Mako sacrifices this many sea monsters for Fortress Whale.
const SOLO_OATH_TRIBUTES = 2;

// Pegasus guards the castle: three stages by LP (Toon World, the Millennium
// Eye, the Final Read). `weights` per stage pick his intents.
const SOLO_PEGASUS = {
  name: 'Pegasus J. Crawford', title: 'Final duel', icon: '👁️', lp: 8000, personality: 'trickster',
  // The stage LPs below are for his base LP (8000); other difficulties scale them (soloPegasusStages).
  stage2At: 5000,
  stage3At: 2000,
  actions: { 1: 2, 2: 2, 3: 3 },
  pageMinAtk: 1500,
  maxToons: 3,
  crushMiss: 1000,
  glare: 1500,
  finalGlare: 2000,
  barrage: 1000,
  barrels: 3,
  barrelHit: 1000,
  cardTypes: ['Monster', 'Spell', 'Trap'],
  weights: {
    1: { summon: 5, trap: 2, bunny: 2, equip: 1 },
    2: { summon: 3, crush: 3, glare: 3, trap: 1, equip: 1 },
    3: { summon: 2, crush: 2, glare: 2, equip: 1 }
  },
  toons: [
    { name: 'Toon Mermaid', type: 'Toon', atk: 1400, def: 1500, icon: '🧜‍♀️', pos: 'atk', toon: true, unique: true },
    { name: 'Toon Summoned Skull', type: 'Toon', atk: 2500, def: 1200, icon: '💀', pos: 'atk', toon: true, unique: true },
    { name: 'Toon Dark Magician Girl', type: 'Toon', atk: 2000, def: 1700, icon: '🪄', pos: 'atk', toon: true, unique: true, seal: true },
    { name: 'Toon Barrel Dragon', type: 'Toon', atk: 2600, def: 2200, icon: '🔫', pos: 'atk', toon: true, unique: true, barrels: true },
    { name: 'Toon Gemini Elf', type: 'Toon', atk: 1900, def: 900, icon: '👯', pos: 'atk', toon: true, unique: true, hits: 2, hitAtk: 1000 }
  ],
  // When Toon World is gone (or three Toons are out) he plays these instead.
  deck: [
    { name: 'Dark Rabbit', type: 'Beast', atk: 1100, def: 1500, icon: '🐇' },
    { name: 'Illusionist Faceless Mage', type: 'Spellcaster', atk: 1200, def: 2200, icon: '🎭' },
    { name: 'Bickuribox', type: 'Fiend', atk: 2300, def: 2000, icon: '🎁' }
  ],
  bunny: { name: 'Funny Bunny', type: 'Beast', atk: 100, def: 100, icon: '🐰', pos: 'def', bunny: true },
  restrict: { name: 'Thousand-Eyes Restrict', type: 'Spellcaster', icon: '🧿', unique: true },
  bluffs: {
    glare: { icon: '👁️', text: 'Millennium Glare ({finalGlare} damage)' },
    crush: { icon: '🧠', text: 'Mind Crush' },
    barrage: { icon: '🌪️', text: 'Illusion Barrage (1000 damage)' }
  },
  cutscenes: {
    intro: {
      quote: "Welcome to my castle, little duelist! Let's see if you can survive my Toon World.",
      rules: [
        '📖 Toon World: his Toons attack you directly and <b>can\'t be blocked</b>. While the book stands, they can\'t be destroyed by battle and Pegasus takes <b>no damage at all</b>.',
        '📄 Attack Toon World with 1500+ ATK to tear out one of its pages. Only when the last page is gone (it takes every Toon with it) can you hurt Pegasus.',
        '🐰 While Funny Bunny hops around, Pegasus takes no damage.',
        '👁️ At {stage2} LP his Millennium Eye opens. At {stage3} LP comes the Final Read.'
      ]
    },
    stage2: {
      icon: '👁️', title: 'The Millennium Eye opens',
      quote: "Enough playtime. Let's see what's in that pretty little head of yours…",
      rules: [
        '❓ You can no longer see his next moves. A Millennium Eye of your own would cancel his.',
        '🧠 Mind Crush: he names a card type. Discard one, or if you have none, he read you wrong and takes {crushMiss}.',
        '👁️ Millennium Glare: {glare} damage straight to your LP.'
      ]
    },
    stage3: {
      icon: '🃏', title: 'The Final Read',
      quote: 'Your soul will make a lovely addition to my collection!',
      rules: [
        '🧿 Thousand-Eyes Restrict absorbs your strongest monster and takes its ATK.',
        '🎭 He bluffs: he shows two moves, but only one is real.{bluffs2}',
        '⚡ {actions3} actions every turn. Finish him!'
      ]
    }
  },
  win: '"Impossible! My Millennium Eye… it could not read the heart of your cards!"',
  lose: '"Don\'t worry, you will look lovely in my card collection!"',
  eyeLine: '"Another Millennium Eye?! You see through me as I see through you…"'
};

// What each difficulty's pegasusLevel adds to the final duel (see SOLO_DIFFICULTIES).
//   actions   extra actions per stage      glare  extra Glare damage
//   mind      weight multiplier of Mind Crush and Glare      maxToons  Toons out at once
//   crushMiss  damage he takes when you have no card of the named type      bluffs  bluffs per turn in stage 3
const SOLO_PEGASUS_LEVELS = [
  { actions: { 1: 0, 2: 0, 3: 0 }, glare: 0, mind: 1, maxToons: 3, crushMiss: 1000, bluffs: 1 },
  { actions: { 1: 1, 2: 0, 3: 0 }, glare: 500, mind: 1.5, maxToons: 4, crushMiss: 1000, bluffs: 1 },
  { actions: { 1: 1, 2: 1, 3: 1 }, glare: 1000, mind: 2, maxToons: 5, crushMiss: 500, bluffs: 2 }
];

// Enemy actions. `weights` per personality pick the intents.
const SOLO_ACTIONS = {
  summon: { icon: '🃏', label: 'Summon a monster' },
  equip: { icon: '⚔️', label: 'Power up a monster' },
  trap: { icon: '🪤', label: 'Set a trap' },
  removal: { icon: '💥', label: 'Destroy one of your monsters' },
  heal: { icon: '💚', label: 'Restore LP' },
  special: { icon: '✨', label: 'Play a special card' },
  toonworld: { icon: '📖', label: 'Play Toon World' },
  bunny: { icon: '🐰', label: 'Summon Funny Bunny' },
  crush: { icon: '🧠', label: 'Mind Crush: name a card type you must discard' },
  glare: { icon: '👁️', label: 'Millennium Glare: damage to your LP' },
  restrict: { icon: '🧿', label: 'Thousand-Eyes Restrict: absorb your strongest monster' },
  bluff: { icon: '🎭', label: 'Bluff' }
};

const SOLO_PERSONALITIES = {
  aggressive: { icon: '🗡️', label: 'Aggressive', rps: 'rock', firstChance: 0.85, weights: { summon: 5, equip: 4, trap: 1, removal: 2, heal: 1 } },
  wall: { icon: '🛡️', label: 'Wall', rps: 'paper', firstChance: 0.4, weights: { summon: 5, equip: 1, trap: 2, removal: 1, heal: 3 } },
  trickster: { icon: '🎭', label: 'Trickster', rps: 'scissors', firstChance: 0.6, weights: { summon: 4, equip: 2, trap: 4, removal: 2, heal: 1 } }
};

// Where the enemy summons each monster, by name. Attack and Defense monsters are
// always summoned that way. Any monster not listed here can go either way.
const SOLO_ROLE_ATK = [
  'Great White', '7 Colored Fish', 'Kairyu-Shin', 'Giant Red Seasnake', 'High Tide Gyojin', 'Sea Serpent Warrior of Darkness', 'Spike Seadra', 'Deepsea Shark',
  'Mother Grizzly', 'The Legendary Fisherman', 'Amphibian Beast', 'Fortress Whale',
  'Leogun', 'Flying Kamakiri #2', 'Girochin Kuwagata', 'Gazelle the King of Mythical Beasts', 'Great Angus', 'Queen of Autumn Leaves',
  'Flying Kamakiri #1', 'Giant Flea', 'Neo Bug', 'Hunter Spider', 'Kwagar Hercules', 'Insect Queen',
  'Kojikocy', 'Axe Raider', 'Battle Ox', 'Panther Warrior', 'Warrior Dai Grepher', 'Beautiful Headhuntress', 'Battle Steer', 'Ansatsu', 'Rude Kaiser', 'Stone Ogre Grotto',
  'Harpie Lady', 'Faith Bird', 'Skull Red Bird', 'Blue-Winged Crown', 'Sacred Crane', 'Winged Sage Falcos', 'Cyber Harpie', 'Peacock', 'Punished Eagle', "Harpie's Pet Dragon", 'Harpie Lady Sisters',
  'Koumori Dragon', 'Thunder Dragon', 'Crawling Dragon', 'Kaminari Attack', 'Blackland Fire Dragon', 'Luster Dragon', 'Sonic Duck', 'Curse of Dragon',
  'Uraby', 'Gilasaurus', 'Mad Sword Beast', 'Hyper Hammerhead', 'Two-Headed King Rex', 'Crawling Dragon #2', 'Kabazauls', 'Sword Arm of Dragon', 'Megazowler', 'Black Tyranno', 'Red-Eyes Black Dragon',
  'Clown Zombie', 'Armored Zombie', 'Dragon Zombie', 'Master Kyonshee', 'Regenerating Mummy', 'Giant Axe Mummy', 'Vampire Lord',
  'Vampire Lady', 'Shadow Ghoul', 'Pumpking the King of Ghosts', 'Patrician of Darkness', 'Ryu Kokki',
  'Cyber Soldier of Darkworld', 'Ground Attacker Bugroth', 'Robotic Knight', 'Guardian of the Throne Room', 'X-Head Cannon', 'Mechanicalchaser', 'Slot Machine', 'Spikebot', 'Launcher Spider', 'Metal Dragon',
  'Destroyer Golem', 'Sanga of the Thunder', 'Kazejin', 'Suijin', 'Bickuribox'
];
const SOLO_ROLE_DEF = [
  'Aqua Madoor', 'Jellyfish', 'Island Turtle', 'Hercules Beetle', 'Trent', 'Petit Moth', 'Kumootoko',
  'Swordsman of Landstar', 'Battle Warrior', 'Giant Soldier of Stone', 'Alpha the Magnet Warrior',
  'Queen Bird', 'Skull Servant', 'The Statue of Easter Island', 'Legendary Jujitsu Master', 'Illusionist Faceless Mage'
];

// Rock-paper-scissors before each duel. The winner picks who goes first (the enemy mostly picks
// by personality, see firstChance). Whoever goes first can't attack on their first turn.
const SOLO_RPS = {
  rock: { icon: '✊', label: 'Rock', beats: 'scissors' },
  paper: { icon: '✋', label: 'Paper', beats: 'rock' },
  scissors: { icon: '✌️', label: 'Scissors', beats: 'paper' }
};
const SOLO_RPS_FAVOURITE = 0.4;

// Spells and Traps. Generic duelists share one set; each elite and Pegasus has
// their own (from the anime), found by soloCards(). Equips with `only` need a
// monster of those types on the field. Trap kinds: negate (attack negated, Battle
// Phase ends), halve (the attacker's ATK is halved), destroy (an attacker with
// 1000+ ATK is destroyed), burn (you take 300). A null removal/heal means the
// duelist never uses that action.
const SOLO_GENERIC_CARDS = {
  equips: [
    { name: 'Legendary Sword', atk: 300 },
    { name: 'Black Pendant', atk: 500 },
    { name: 'Sword of Deep-Seated', atk: 500 },
    { name: 'Malevolent Nuzzler', atk: 700 }
  ],
  trap: { name: 'Negate Attack', kind: 'negate', text: 'Your attack is negated and your Battle Phase ends.' },
  removal: { name: 'Fissure', text: 'Destroy your face-up monster with the lowest ATK.' },
  heal: { name: "Goblin's Secret Remedy", lp: 600 }
};
const SOLO_OWNER_CARDS = {
  mako: {
    equips: [
      { name: 'Power of Kaishin', atk: 500, only: ['Aqua', 'Fish', 'Sea Serpent'] },
      { name: 'Legendary Sword', atk: 300 }
    ],
    trap: { name: 'Tornado Wall', kind: 'negate', text: 'Your attack is negated and your Battle Phase ends.' },
    removal: null,
    heal: null
  },
  weevil: {
    equips: [
      { name: 'Armor with Laser Cannon', atk: 500, only: ['Insect'] },
      { name: 'Lev. 2 Power Boost', atk: 300 }
    ],
    trap: { name: 'Parasite Worm', kind: 'negate', text: 'Your attack is negated and your Battle Phase ends.' },
    removal: { name: 'Eradicating Aerosol', text: 'Destroy your face-up monster with the lowest ATK.' },
    heal: null
  },
  mai: {
    equips: [
      { name: 'Rose Whip', atk: 300 },
      { name: 'Cyber Shield', atk: 500, only: ['Winged Beast', 'Warrior'] }
    ],
    trap: { name: 'Mirror Wall', kind: 'halve', text: 'Your attacking monster has its ATK halved for this attack.' },
    removal: { name: "Harpie's Feather Duster", text: 'Destroy your face-up monster with the lowest ATK.' },
    heal: null
  },
  rex: {
    equips: [
      { name: 'Dragon Nails', atk: 500, only: ['Dinosaur', 'Dragon'] },
      { name: 'Wasteland', atk: 300 }
    ],
    trap: { name: 'Bottomless Trap Hole', kind: 'destroy', text: 'Your attacking monster is destroyed if it has 1000 or more ATK.' },
    removal: null,
    heal: { name: 'Jurassic Heart', lp: 600 }
  },
  bonz: {
    equips: [
      { name: 'Call of the Haunted', atk: 500, only: ['Zombie'] },
      { name: 'Premature Burial', atk: 300 }
    ],
    trap: { name: 'Skull Invitation', kind: 'burn', text: 'You take 300 damage, then your attack continues.' },
    removal: null,
    heal: null
  },
  keith: {
    equips: [
      { name: 'Machine Conversion Factory', atk: 300, only: ['Machine'] },
      { name: 'Metalmorph', atk: 500 }
    ],
    trap: { name: 'Magic Metal Force', kind: 'halve', text: 'Your attacking monster has its ATK halved for this attack.' },
    removal: { name: 'Pillager', text: 'Destroy your face-up monster with the lowest ATK.' },
    heal: null
  },
  paradox: {
    equips: [{ name: 'Labyrinth Wall', atk: 500 }],
    trap: { name: 'Riryoku', kind: 'halve', text: 'Your attacking monster has its ATK halved for this attack.' },
    removal: null,
    heal: null
  },
  pegasus: {
    equips: [
      { name: 'Toon Kingdom', atk: 500 },
      { name: 'Legendary Sword', atk: 300 }
    ],
    trap: { name: 'Magic Cylinder', kind: 'negate', text: 'Your attack is negated and your Battle Phase ends.' },
    removal: null,
    heal: null
  }
};

// Relics: Treasure offers commons, an elite win rares (how many: see SOLO_DIFFICULTIES). `value` is the
// relic's number (LP, ATK). Consumables vanish when used.
// `polish` = the campfire upgrade: a new `value`, or `uses` per duel (instead of once), plus its text.
const SOLO_RELICS = {
  'dian-keto': { name: 'Dian Keto Charm', icon: '🌿', rarity: 'common', value: 500, text: 'After every duel you win, heal 500 LP.', polish: { value: 1000, text: 'After every duel you win, heal 1000 LP.' } },
  'red-medicine': { name: 'Red Medicine', icon: '🧪', rarity: 'common', value: 1500, consumable: true, text: 'Use once, any time: heal 1500 LP.', polish: { value: 3000, text: 'Use once, any time: heal 3000 LP.' } },
  'legendary-sword': { name: 'Legendary Sword', icon: '🗡️', rarity: 'common', value: 300, text: 'Your first attack each turn gets +300 ATK. Added automatically.', polish: { value: 600, text: 'Your first attack each turn gets +600 ATK. Added automatically.' } },
  kuriboh: { name: 'Kuriboh Charm', icon: '🧸', rarity: 'common', text: 'Once per duel, Kuriboh takes an enemy attack for you: 0 damage.', polish: { uses: 2, text: 'Twice per duel, Kuriboh takes an enemy attack for you: 0 damage.' } },
  'pot-of-greed': { name: 'Pot of Greed', icon: '🏺', rarity: 'common', value: 1, text: 'Draw 6 cards instead of 5 when a duel starts.', polish: { value: 2, text: 'Draw 7 cards instead of 5 when a duel starts.' } },
  'duelist-glove': { name: 'Duelist Glove', icon: '🧤', rarity: 'common', text: 'Gives you +1 ⭐ when you take it.' },
  spellbinding: { name: 'Spellbinding Circle', icon: '🔯', rarity: 'common', text: "The enemy's first monster each duel can't attack." },
  elf: { name: "Mystical Elf's Blessing", icon: '🧝', rarity: 'common', value: 1000, text: '+1000 max LP, and heal 1000 LP when you take it.' },
  axe: { name: 'Axe of Despair', icon: '🪓', rarity: 'rare', value: 1000, text: 'Once per duel: one attack gets +1000 ATK. Switch it on when you attack.', polish: { uses: 2, text: 'Twice per duel: one attack gets +1000 ATK. Switch it on when you attack.' } },
  waboku: { name: 'Waboku', icon: '🛐', rarity: 'rare', text: 'Once per duel, when attacked: you take no battle damage for the rest of the turn.', polish: { uses: 2, text: 'Twice per duel, when attacked: you take no battle damage for the rest of the turn.' } },
  cylinder: { name: 'Magic Cylinder', icon: '🌀', rarity: 'rare', text: "Once per duel, when attacked: the attack hits the enemy's LP instead.", polish: { uses: 2, text: "Twice per duel, when attacked: the attack hits the enemy's LP instead." } },
  sanctity: { name: 'Card of Sanctity', icon: '🃏', rarity: 'rare', value: 1, text: 'Draw 2 cards instead of 1 in every one of your Draw Phases.' },
  swords: { name: 'Swords of Revealing Light', icon: '🌟', rarity: 'rare', text: "The enemy can't attack on its first turn of each duel." },
  'mirror-force': { name: 'Mirror Force', icon: '🪞', rarity: 'rare', text: "Once per duel, when attacked: destroy all the enemy's Attack Position monsters.", polish: { uses: 2, text: "Twice per duel, when attacked: destroy all the enemy's Attack Position monsters." } },
  raigeki: { name: 'Raigeki', icon: '⚡', rarity: 'rare', consumable: true, text: "Use once, on your turn (✨ Effect): destroy all the enemy's monsters." },
  // Millennium Items: max one per run, and all but the Puzzle have a price.
  puzzle: { name: 'Millennium Puzzle', icon: '🔺', rarity: 'millennium', value: 1000, text: 'Once per run, when your LP would hit 0, you survive with 1000 LP.' },
  eye: { name: 'Millennium Eye', icon: '👁️', rarity: 'millennium', value: 500, text: "See exactly which cards the enemy will play. Costs 500 LP at the start of every duel." },
  rod: { name: 'Millennium Rod', icon: '🪄', rarity: 'millennium', value: 1000, text: "Once per duel, when attacked: the attacker turns on its owner. They take its ATK and it's destroyed. Costs 1000 max LP when you take it." },
  ring: { name: 'Millennium Ring', icon: '💍', rarity: 'millennium', text: "The enemy's first face-down card each duel is destroyed as it is set. The campfire heals only half." },
  key: { name: 'Millennium Key', icon: '🗝️', rarity: 'millennium', text: 'See the outcome of every Shadow Game choice before you pick. Costs 1 ⭐ when you take it.' }
};
// Relics offered as buttons when an enemy monster attacks.
const SOLO_DEFENSE_RELICS = ['kuriboh', 'waboku', 'cylinder', 'mirror-force', 'rod'];
// Chance that one of an elite's two rare relics is a Millennium Item instead.
const SOLO_MILLENNIUM_CHANCE = 0.25;

// Shadow Game effects that wait for your next duel.
const SOLO_EVENT_MODS = {
  insect: { icon: '🐝', text: 'Your next enemy starts with Killer Needle on the field.' },
  storm: { icon: '⛈️', value: 500, text: 'Your next enemy has +500 LP.' },
  pep: { icon: '💪', value: 500, text: 'Next duel, all your attacks get +500 ATK.' },
  lunch: { icon: '🍙', value: 500, text: 'Next duel, your first attack gets −500 ATK.' },
  swarm: { icon: '🧸', text: 'Next duel, the Kuriboh swarm blocks one attack for you.' }
};
