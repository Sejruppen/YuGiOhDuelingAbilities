// Solo mode "Duelist's Road": a short Slay the Spire-style run across
// Duelist Kingdom. You play your physical deck, the enemies live on the phone.
const SOLO_STORAGE_KEY = 'ygo_solo';
const SOLO_START_LP = 8000;
const SOLO_MAX_LP = 8000;
const SOLO_START_CHIPS = 2;
const SOLO_GATE_CHIPS = 6;
const SOLO_CAMPFIRE_HEAL = 0.3;
const SOLO_FIELD_BONUS = 0.3;
const SOLO_MAX_MONSTERS = 5;

// Map: floors 1-5 branch over 4 columns, then one node per floor.
const SOLO_COLS = 4;
const SOLO_WALKS = 4;
const SOLO_BRANCH_FLOORS = 5;
const SOLO_FLOOR = { CAMPFIRE: 6, LABYRINTH: 7, CASTLE: 8 };
const SOLO_TREASURE_FLOOR = 3;
const SOLO_MIXED_ODDS = { duelist: 50, event: 30, elite: 20 };

const SOLO_NODE_TYPES = {
  duelist: { icon: '⚔️', label: 'Duelist', desc: 'A wandering duelist. Win for +1 ⭐.' },
  elite: { icon: '👹', label: 'Elite', desc:   'A dangerous veteran duelist. Win for +2 ⭐ and a rare relic.' },
    treasure: { icon: '🎁', label: 'Treasure', desc: "A lost Duelist's Case. Pick 1 of 3 relics." },
  event: { icon: '❓', label: 'Shadow Game', desc: 'Something strange is going on here…' },
  campfire: { icon: '🔥', label: 'Campfire', desc: `Rest before the castle. Heal ${SOLO_CAMPFIRE_HEAL * 100}% of your max LP.` },
  labyrinth: { icon: '🧱', label: 'Labyrinth', desc: `Only if you have fewer than ${SOLO_GATE_CHIPS} ⭐. Win to get the missing chips.` },
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
  { maxFloor: 2, lp: 1500, maxAtk: 1400 },
  { maxFloor: 4, lp: 2000, maxAtk: 1800 },
  { maxFloor: 99, lp: 2500, maxAtk: 2000 }
];
const SOLO_ELITE = { lp: 4000, maxAtk: 2000, actions: 2, chips: 2 };
// Stand-in until Pegasus arrives: his bodyguard guards the castle.
const SOLO_CASTLE_GUARD = { name: 'Croquet', title: "Pegasus' bodyguard", icon: '🎩', lp: 6000, maxAtk: 2000, actions: 2 };

// Enemy actions. `weights` per personality pick the intents.
const SOLO_ACTIONS = {
  summon: { icon: '🃏', label: 'Summon a monster' },
  equip: { icon: '⚔️', label: 'Power up a monster' },
  trap: { icon: '🪤', label: 'Set a trap' },
  removal: { icon: '💥', label: 'Destroy one of your monsters' },
  heal: { icon: '💚', label: 'Restore LP' }
};

const SOLO_PERSONALITIES = {
  aggressive: { icon: '🗡️', label: 'Aggressive', atkChance: 0.9, weights: { summon: 5, equip: 4, trap: 1, removal: 2, heal: 1 } },
  wall: { icon: '🛡️', label: 'Wall', atkChance: 0.4, weights: { summon: 5, equip: 1, trap: 2, removal: 1, heal: 3 } },
  trickster: { icon: '🎭', label: 'Trickster', atkChance: 0.65, weights: { summon: 4, equip: 2, trap: 4, removal: 2, heal: 1 } }
};

const SOLO_EQUIPS = [
  { name: 'Legendary Sword', atk: 300 },
  { name: 'Black Pendant', atk: 500 },
  { name: 'Sword of Deep-Seated', atk: 500 },
  { name: 'Malevolent Nuzzler', atk: 700 }
];
const SOLO_TRAP = { name: 'Negate Attack', text: 'Your attack is negated and your Battle Phase ends.' };
const SOLO_REMOVAL = { name: 'Fissure', text: 'Destroy your face-up monster with the lowest ATK.' };
const SOLO_REMOVAL_FROM_FLOOR = 3;
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
  raigeki: { name: 'Raigeki', icon: '⚡', rarity: 'rare', consumable: true, text: "Use once, on your turn (✨ Effect): destroy all the enemy's monsters." }
};
// Relics offered as buttons when an enemy monster attacks.
const SOLO_DEFENSE_RELICS = ['kuriboh', 'waboku', 'cylinder', 'mirror-force'];
