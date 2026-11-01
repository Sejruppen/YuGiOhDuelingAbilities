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
const SOLO_FIELD_BONUS = 0.3;
const SOLO_MAX_MONSTERS = 5;

// Map: floors 1-8 branch over 4 columns (Beach 1-2, Forest/Meadow 3-5,
// Mountain/Wasteland 6-8), then one node per floor.
const SOLO_COLS = 4;
const SOLO_WALKS = 4;
const SOLO_BRANCH_FLOORS = 8;
const SOLO_FLOOR = { CAMPFIRE: 9, LABYRINTH: 10, CASTLE: 11 };
const SOLO_TREASURE_FLOOR = 5;
const SOLO_MIXED_ODDS = { duelist: 50, event: 30, elite: 20 };
// Share of mixed nodes (never elites) shown as ❓ until you step on them.
const SOLO_HIDDEN_CHANCE = 0.33;

const SOLO_NODE_TYPES = {
  duelist: { icon: '⚔️', label: 'Duelist', desc: 'A wandering duelist. Win for +1 ⭐.' },
  elite: { icon: '👹', label: 'Elite', desc:   'A dangerous veteran duelist. Win for +2 ⭐ and a rare relic.' },
    treasure: { icon: '🎁', label: 'Treasure', desc: "A lost Duelist's Case. Pick 1 of 3 relics." },
  event: { icon: '🌀', label: 'Shadow Game', desc: 'A strange encounter. Choose wisely: some choices are a gamble.' },
  hidden: { icon: '❓', label: 'Unknown', desc: 'Hidden in the mist: a duelist or a Shadow Game. You find out when you get there.' },
  campfire: { icon: '🔥', label: 'Campfire', desc: `Rest before the castle. Heal ${SOLO_CAMPFIRE_HEAL * 100}% of your max LP.` },
  labyrinth: { icon: '🧱', label: 'Labyrinth', desc: `Only if you have fewer than ${SOLO_GATE_CHIPS} ⭐. The Paradox Brothers guard it. Win to get the missing chips.` },
  castle: { icon: '🏰', label: 'Castle', desc: "Pegasus' castle. Win to finish the run." }
};

// Field bonuses follow the anime's Duelist Kingdom terrain rules.
const SOLO_REGIONS = {
  beach: { name: 'Beach', icon: '🏖️', types: ['Aqua', 'Fish', 'Sea Serpent'], titles: ['Fisherman', 'Sailor', 'Beachcomber'] },
  forest: { name: 'Forest', icon: '🌲', types: ['Insect', 'Beast', 'Plant', 'Beast-Warrior'], titles: ['Bug Catcher', 'Forest Ranger', 'Beast Tamer'] },
  meadow: { name: 'Meadow', icon: '🌾', types: ['Warrior', 'Beast-Warrior'], titles: ['Knight', 'Squire', 'Swordsman'] },
  mountain: { name: 'Mountain', icon: '⛰️', types: ['Dragon', 'Winged Beast', 'Thunder'], titles: ['Dragon Tamer', 'Mountain Hermit', 'Bird Keeper'] },
  wasteland: { name: 'Wasteland', icon: '💀', types: ['Zombie', 'Dinosaur', 'Rock'], titles: ['Gravedigger', 'Bone Collector', 'Fossil Hunter'] },
  campfire: { name: 'Campfire', icon: '🔥', types: [], titles: [] },
  labyrinth: { name: 'Labyrinth', icon: '🧱', types: [], titles: ['Labyrinth Guard', 'Gatekeeper'] },
  castle: { name: 'Castle', icon: '🏰', types: [], titles: [] }
};

const SOLO_FIRST_NAMES = ['Hiro', 'Aiko', 'Ren', 'Kenji', 'Yuki', 'Sora', 'Daichi', 'Mika', 'Taro', 'Hana', 'Kaito', 'Rin', 'Shun', 'Emi', 'Riku', 'Nao'];

// Duel Monsters-era cards with their real stats.
const SOLO_MONSTERS = {
  beach: [
    { name: 'Root Water', type: 'Fish', atk: 900, def: 800, icon: '🐟' },
    { name: 'Fiend Kraken', type: 'Aqua', atk: 1200, def: 1400, icon: '🦑' },
    { name: 'Enchanting Mermaid', type: 'Fish', atk: 1200, def: 900, icon: '🧜‍♀️' },
    { name: 'Aqua Madoor', type: 'Spellcaster', atk: 1200, def: 2000, icon: '💧' },
    { name: 'Water Omotics', type: 'Aqua', atk: 1400, def: 1200, icon: '🌊' },
    { name: 'Great White', type: 'Fish', atk: 1600, def: 800, icon: '🦈' },
    { name: 'Bottom Dweller', type: 'Fish', atk: 1650, def: 1700, icon: '🐡' },
    { name: '7 Colored Fish', type: 'Fish', atk: 1800, def: 800, icon: '🐠' },
    { name: 'Kairyu-Shin', type: 'Sea Serpent', atk: 1800, def: 1500, icon: '🐉' }
  ],
  forest: [
    { name: 'Basic Insect', type: 'Insect', atk: 500, def: 700, icon: '🐞' },
    { name: 'Killer Needle', type: 'Insect', atk: 1200, def: 1000, icon: '🐝' },
    { name: 'Silver Fang', type: 'Beast', atk: 1200, def: 800, icon: '🐺' },
    { name: 'Darkworld Thorns', type: 'Plant', atk: 1200, def: 900, icon: '🌵' },
    { name: 'Mystic Horseman', type: 'Beast', atk: 1300, def: 1550, icon: '🐴' },
    { name: 'Hercules Beetle', type: 'Insect', atk: 1500, def: 2000, icon: '🪲' },
    { name: 'Trent', type: 'Plant', atk: 1500, def: 1800, icon: '🌳' },
    { name: 'Leogun', type: 'Beast', atk: 1750, def: 1550, icon: '🦁' }
  ],
  meadow: [
    { name: 'Swordsman of Landstar', type: 'Warrior', atk: 500, def: 1200, icon: '🗡️' },
    { name: 'Battle Warrior', type: 'Warrior', atk: 700, def: 1000, icon: '🥊' },
    { name: 'Giant Soldier of Stone', type: 'Rock', atk: 1300, def: 2000, icon: '🗿' },
    { name: 'Celtic Guardian', type: 'Warrior', atk: 1400, def: 1200, icon: '⚔️' },
    { name: 'Kojikocy', type: 'Warrior', atk: 1500, def: 1200, icon: '🛡️' },
    { name: 'Axe Raider', type: 'Warrior', atk: 1700, def: 1150, icon: '🪓' },
    { name: 'Battle Ox', type: 'Beast-Warrior', atk: 1700, def: 1000, icon: '🐂' },
    { name: 'Panther Warrior', type: 'Beast-Warrior', atk: 2000, def: 1600, icon: '🐆' }
  ],
  mountain: [
    { name: 'Baby Dragon', type: 'Dragon', atk: 1200, def: 700, icon: '🐲' },
    { name: 'Harpie Lady', type: 'Winged Beast', atk: 1300, def: 1400, icon: '🪶' },
    { name: 'Winged Dragon, Guardian of the Fortress #1', type: 'Dragon', atk: 1400, def: 1200, icon: '🐉' },
    { name: 'Faith Bird', type: 'Winged Beast', atk: 1500, def: 1100, icon: '🦅' },
    { name: 'Koumori Dragon', type: 'Dragon', atk: 1500, def: 1200, icon: '🦇' },
    { name: 'Thunder Dragon', type: 'Thunder', atk: 1600, def: 1500, icon: '⚡' },
    { name: 'Crawling Dragon', type: 'Dragon', atk: 1600, def: 1400, icon: '🐊' },
    { name: 'Kaminari Attack', type: 'Thunder', atk: 1900, def: 1400, icon: '🌩️' }
  ],
  wasteland: [
    { name: 'Skull Servant', type: 'Zombie', atk: 300, def: 200, icon: '💀' },
    { name: 'Clown Zombie', type: 'Zombie', atk: 1350, def: 0, icon: '🤡' },
    { name: 'Armored Zombie', type: 'Zombie', atk: 1500, def: 0, icon: '🧟' },
    { name: 'Uraby', type: 'Dinosaur', atk: 1500, def: 800, icon: '🦖' },
    { name: 'Dragon Zombie', type: 'Zombie', atk: 1600, def: 0, icon: '🦴' },
    { name: 'Sword Arm of Dragon', type: 'Dinosaur', atk: 1750, def: 2030, icon: '🦕' },
    { name: 'Megazowler', type: 'Dinosaur', atk: 1800, def: 2000, icon: '🦏' }
  ]
};

// Floor tiers for generic duelists. Elites and the castle have their own.
const SOLO_TIERS = [
  { maxFloor: 3, lp: 1500, maxAtk: 1400 },
  { maxFloor: 6, lp: 2000, maxAtk: 1800 },
  { maxFloor: 99, lp: 2500, maxAtk: 2000 }
];
const SOLO_ELITE = { lp: 4000, maxAtk: 2000, actions: 2, chips: 2 };

// Anime elites. Each has a fixed deck, a personality and a gimmick.
//   minRound  the card only shows up from that round (aces)
//   unique    never twice on the field; special = only via the gimmick
//   pos       always summoned in this position
// One elite per region; Bandit Keith can show up in any region instead.
const SOLO_KEITH_CHANCE = 0.2;
const SOLO_ELITES = {
  weevil: {
    name: 'Weevil Underwood', icon: '🐛', region: 'forest', personality: 'trickster', specialCard: 'Cocoon of Evolution',
    quote: 'Heh heh heh… my insects are hungry, and you look delicious!',
    gimmick: '🥚 Cocoon of Evolution: a cocoon hatches into Great Moth (2600 ATK) after 2 of his turns, unless you destroy it first.',
    monsters: [
      { name: 'Basic Insect', type: 'Insect', atk: 500, def: 700, icon: '🐞' },
      { name: 'Kumootoko', type: 'Insect', atk: 700, def: 1400, icon: '🕷️' },
      { name: 'Killer Needle', type: 'Insect', atk: 1200, def: 1000, icon: '🐝' },
      { name: 'Flying Kamakiri #1', type: 'Insect', atk: 1400, def: 900, icon: '🦗' },
      { name: 'Hercules Beetle', type: 'Insect', atk: 1500, def: 2000, icon: '🪲' },
      { name: 'Neo Bug', type: 'Insect', atk: 1800, def: 1700, icon: '🐜', minRound: 2 }
    ]
  },
  mai: {
    name: 'Mai Valentine', icon: '💅', region: 'meadow', personality: 'aggressive', specialCard: 'Elegant Egotist',
    quote: "Don't take it personally, hon. My Harpies just love a fresh target.",
    gimmick: '🪞 Elegant Egotist: turns a Harpie Lady into Harpie Lady Sisters (1950 ATK).',
    monsters: [
      { name: 'Harpie Lady', type: 'Winged Beast', atk: 1300, def: 1400, icon: '🪶' },
      { name: 'Harpie Lady', type: 'Winged Beast', atk: 1300, def: 1400, icon: '🪶' },
      { name: 'Cyber Harpie', type: 'Winged Beast', atk: 1800, def: 1300, icon: '🦅' },
      { name: "Harpie's Pet Dragon", type: 'Dragon', atk: 2000, def: 2500, icon: '🐉', minRound: 3, unique: true }
    ]
  },
  rex: {
    name: 'Rex Raptor', icon: '🦖', region: 'mountain', personality: 'aggressive',
    quote: 'Dinosaurs ruled the earth, and they rule this duel too!',
    gimmick: '🦖 When your field is empty, his Dinosaurs attack twice.',
    monsters: [
      { name: 'Uraby', type: 'Dinosaur', atk: 1500, def: 800, icon: '🦖' },
      { name: 'Two-Headed King Rex', type: 'Dinosaur', atk: 1600, def: 1200, icon: '🦕' },
      { name: 'Sword Arm of Dragon', type: 'Dinosaur', atk: 1750, def: 2030, icon: '🦕' },
      { name: 'Megazowler', type: 'Dinosaur', atk: 1800, def: 2000, icon: '🦏' },
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
      { name: 'Dragon Zombie', type: 'Zombie', atk: 1600, def: 0, icon: '🦴' },
      { name: 'Ryu Kokki', type: 'Zombie', atk: 2400, def: 2000, icon: '👹', minRound: 3, unique: true }
    ]
  },
  keith: {
    name: 'Bandit Keith', icon: '🕶️', region: null, personality: 'trickster',
    quote: "Listen up, punk. Here's a lesson in American dueling!",
    gimmick: '🃏 Once per duel he plays a card up his sleeve, without warning.',
    monsters: [
      { name: 'Robotic Knight', type: 'Machine', atk: 1600, def: 1800, icon: '🤖' },
      { name: 'Mechanicalchaser', type: 'Machine', atk: 1850, def: 800, icon: '⚙️' },
      { name: 'Slot Machine', type: 'Machine', atk: 2000, def: 2300, icon: '🎰' },
      { name: 'Launcher Spider', type: 'Machine', atk: 2200, def: 2500, icon: '🕷️', minRound: 2, unique: true },
      { name: 'Barrel Dragon', type: 'Machine', atk: 2600, def: 2200, icon: '🔫', special: true }
    ]
  },
  paradox: {
    name: 'Paradox Brothers', icon: '👬', region: 'labyrinth', personality: 'wall', plural: true, specialCard: 'Polymerization: Gate Guardian',
    quote: 'Two doors, two brothers, one way out. Only one of us tells the truth…',
    gimmick: '🚪 With Sanga, Kazejin and Suijin on the field, they fuse into Gate Guardian (3750 ATK). Labyrinth Wall (0/3000) guards them.',
    monsters: [
      { name: 'Labyrinth Wall', type: 'Rock', atk: 0, def: 3000, icon: '🧱', unique: true, pos: 'def' },
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

// Pegasus guards the castle: three stages by LP (Toon World, the Millennium
// Eye, the Final Read). `weights` per stage pick his intents.
const SOLO_PEGASUS = {
  name: 'Pegasus J. Crawford', title: 'Final duel', icon: '👁️', lp: 8000, personality: 'trickster',
  stage2At: 5000,
  stage3At: 2000,
  actions: { 1: 2, 2: 2, 3: 3 },
  pages: 4,
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
    glare: { icon: '👁️', text: 'Millennium Glare (2000 damage)' },
    crush: { icon: '🧠', text: 'Mind Crush' },
    barrage: { icon: '🌪️', text: 'Illusion Barrage (1000 damage)' }
  },
  cutscenes: {
    intro: {
      quote: "Welcome to my castle, little duelist! Let's see if you can survive my Toon World.",
      rules: [
        '📖 Toon World: his Toons attack you directly and <b>can\'t be blocked</b>. While the book stands, they can\'t be destroyed by battle and Pegasus takes no battle damage from them.',
        '📄 Attack Toon World with 1500+ ATK to tear out one of its 4 pages. The last page takes every Toon with it.',
        '🐰 While Funny Bunny hops around, Pegasus takes no damage.',
        '👁️ At 5000 LP his Millennium Eye opens. At 2000 LP comes the Final Read.'
      ]
    },
    stage2: {
      icon: '👁️', title: 'The Millennium Eye opens',
      quote: "Enough playtime. Let's see what's in that pretty little head of yours…",
      rules: [
        '❓ You can no longer see his next moves. A Millennium Eye of your own would cancel his.',
        '🧠 Mind Crush: he names a card type. Discard one, or if you have none, he read you wrong and takes 1000.',
        '👁️ Millennium Glare: 1500 damage straight to your LP.'
      ]
    },
    stage3: {
      icon: '🃏', title: 'The Final Read',
      quote: 'Your soul will make a lovely addition to my collection!',
      rules: [
        '🧿 Thousand-Eyes Restrict absorbs your strongest monster and takes its ATK.',
        '🎭 He bluffs: he shows two moves, but only one is real.',
        '⚡ Three actions every turn. Finish him!'
      ]
    }
  },
  win: '"Impossible! My Millennium Eye… it could not read the heart of your cards!"',
  lose: '"Don\'t worry, you will look lovely in my card collection!"',
  eyeLine: '"Another Millennium Eye?! You see through me as I see through you…"'
};

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
  aggressive: { icon: '🗡️', label: 'Aggressive', atkChance: 0.9, rps: 'rock', firstChance: 0.85, weights: { summon: 5, equip: 4, trap: 1, removal: 2, heal: 1 } },
  wall: { icon: '🛡️', label: 'Wall', atkChance: 0.4, rps: 'paper', firstChance: 0.4, weights: { summon: 5, equip: 1, trap: 2, removal: 1, heal: 3 } },
  trickster: { icon: '🎭', label: 'Trickster', atkChance: 0.65, rps: 'scissors', firstChance: 0.6, weights: { summon: 4, equip: 2, trap: 4, removal: 2, heal: 1 } }
};

// Rock-paper-scissors before each duel. The winner picks who goes first (the enemy mostly picks
// by personality, see firstChance). Whoever goes first can't attack on their first turn.
const SOLO_RPS = {
  rock: { icon: '✊', label: 'Rock', beats: 'scissors' },
  paper: { icon: '✋', label: 'Paper', beats: 'rock' },
  scissors: { icon: '✌️', label: 'Scissors', beats: 'paper' }
};
const SOLO_RPS_FAVOURITE = 0.4;

const SOLO_EQUIPS = [
  { name: 'Legendary Sword', atk: 300 },
  { name: 'Black Pendant', atk: 500 },
  { name: 'Sword of Deep-Seated', atk: 500 },
  { name: 'Malevolent Nuzzler', atk: 700 }
];
const SOLO_TRAP = { name: 'Negate Attack', text: 'Your attack is negated and your Battle Phase ends.' };
const SOLO_REMOVAL = { name: 'Fissure', text: 'Destroy your face-up monster with the lowest ATK.' };
const SOLO_REMOVAL_FROM_FLOOR = 4;
const SOLO_HEAL = { name: "Goblin's Secret Remedy", lp: 600 };

// Relics: Treasure offers 3 commons, an elite win 2 rares. `value` is the
// relic's number (LP, ATK). Consumables vanish when used.
const SOLO_TREASURE_CHOICES = 3;
const SOLO_ELITE_CHOICES = 2;
const SOLO_RELICS = {
  'dian-keto': { name: 'Dian Keto Charm', icon: '🌿', rarity: 'common', value: 500, text: 'After every duel you win, heal 500 LP.' },
  'red-medicine': { name: 'Red Medicine', icon: '🧪', rarity: 'common', value: 1500, consumable: true, text: 'Use once, any time: heal 1500 LP.' },
  'legendary-sword': { name: 'Legendary Sword', icon: '🗡️', rarity: 'common', value: 300, text: 'Your first attack each turn gets +300 ATK. Added automatically.' },
  kuriboh: { name: 'Kuriboh Charm', icon: '🧸', rarity: 'common', text: 'Once per duel, Kuriboh takes an enemy attack for you: 0 damage.' },
  'pot-of-greed': { name: 'Pot of Greed', icon: '🏺', rarity: 'common', text: 'Draw 6 cards instead of 5 when a duel starts.' },
  'duelist-glove': { name: 'Duelist Glove', icon: '🧤', rarity: 'common', text: 'Gives you +1 ⭐ when you take it.' },
  spellbinding: { name: 'Spellbinding Circle', icon: '🔯', rarity: 'common', text: "The enemy's first monster each duel can't attack." },
  elf: { name: "Mystical Elf's Blessing", icon: '🧝', rarity: 'common', value: 1000, text: '+1000 max LP, and heal 1000 LP when you take it.' },
  axe: { name: 'Axe of Despair', icon: '🪓', rarity: 'rare', value: 1000, text: 'Once per duel: one attack gets +1000 ATK. Switch it on when you attack.' },
  waboku: { name: 'Waboku', icon: '🛐', rarity: 'rare', text: 'Once per duel, when attacked: you take no battle damage for the rest of the turn.' },
  cylinder: { name: 'Magic Cylinder', icon: '🌀', rarity: 'rare', text: "Once per duel, when attacked: the attack hits the enemy's LP instead." },
  swords: { name: 'Swords of Revealing Light', icon: '🌟', rarity: 'rare', text: "The enemy can't attack on its first turn of each duel." },
  'mirror-force': { name: 'Mirror Force', icon: '🪞', rarity: 'rare', text: "Once per duel, when attacked: destroy all the enemy's Attack Position monsters." },
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
