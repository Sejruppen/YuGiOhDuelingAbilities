// Card pool for the secret Duel Disk mini-game (duel-disk-actions.js).
// `art` is an emoji, or a function returning one of the easter-egg SVGs
// (they're defined in other scripts, so they're looked up lazily).
// Monsters: `level` decides tributes (5-6: one, 7+: two), `line` is shouted
// on summon, `attack` when attacking and `voice` picks a summon sound.
const DISK_CARDS = {
  kuriboh: {
    name: 'Kuriboh', kind: 'monster', effect: true, level: 1, atk: 300,
    art: () => NAP_KURIBOH_SVG, artClass: 'disk-kuri-awake', voice: 'kuri',
    line: 'Kuri kuri!', attack: 'Kuri-tackle!',
    text: 'If the dummy attacks while this is in your hand, it multiplies and you take no damage.'
  },
  celtic: {
    name: 'Celtic Guardian', kind: 'monster', level: 4, atk: 1400, art: '🗡️',
    line: 'For the Pharaoh!', attack: 'Elf Sword Slash!',
    text: 'An elf swordsman with a very sharp hairdo.'
  },
  elf: {
    name: 'Mystical Elf', kind: 'monster', effect: true, level: 4, atk: 800, art: '🧝‍♀️',
    line: '✨ A blessing! ✨', attack: 'Gentle prayer…?', onSummon: 'heal',
    text: 'When summoned: her prayer restores 500 of your LP.'
  },
  babyDragon: {
    name: 'Baby Dragon', kind: 'monster', level: 3, atk: 1200, art: '🐲',
    line: 'Rawr!', attack: 'Tiny Flame!',
    text: 'Small, but it bites.'
  },
  timeWizard: {
    name: 'Time Wizard', kind: 'monster', effect: true, level: 2, atk: 500, art: '⏱️',
    line: 'Time Roulette!', attack: 'Tick-tock!', onSummon: 'timeMagic',
    text: 'When summoned: spin the roulette. Hit: the dummy takes 1000. Miss: you take 500.'
  },
  skull: {
    name: 'Summoned Skull', kind: 'monster', level: 6, atk: 2500, art: '💀', voice: 'roar',
    line: 'From the darkness!', attack: 'Lightning Strike!',
    text: 'A fiend wreathed in lightning. Level 6: needs 1 tribute.'
  },
  darkMagician: {
    name: 'Dark Magician', kind: 'monster', level: 7, atk: 2500, art: '🧙‍♂️', voice: 'magic',
    line: 'The ultimate wizard!', attack: 'Dark Magic Attack!',
    text: 'The ultimate wizard in terms of attack and defense. Level 7: needs 2 tributes.'
  },
  gaia: {
    name: 'Gaia the Fierce Knight', kind: 'monster', level: 7, atk: 2300,
    art: () => GAIA_SVG, voice: 'neigh',
    line: 'Neeeigh!', attack: 'Spiral Spear Strike!',
    text: 'A knight whose horse is faster than the wind. Level 7: needs 2 tributes.'
  },
  blueEyes: {
    name: 'Blue-Eyes White Dragon', kind: 'monster', level: 8, atk: 3000, art: '🐉', voice: 'roar',
    line: 'Hrraaagh!', attack: 'Burst Stream of Destruction!',
    text: 'This legendary dragon is a powerful engine of destruction. Level 8: needs 2 tributes.'
  },

  exodia: {
    name: 'Exodia the Forbidden One', kind: 'monster', effect: true, level: 3, atk: 1000, art: '🗿',
    line: '…', attack: 'Forbidden… poke?',
    text: 'Hold all 5 Forbidden pieces in your hand at once and you win the duel.'
  },
  rightArm: {
    name: 'Right Arm of the Forbidden One', kind: 'monster', level: 1, atk: 200, art: '💪', flip: true,
    line: '*flex*', attack: 'Forbidden slap!',
    text: 'A forbidden right arm sealed by magic. Collect all 5 pieces.'
  },
  leftArm: {
    name: 'Left Arm of the Forbidden One', kind: 'monster', level: 1, atk: 200, art: '💪',
    line: '*flex*', attack: 'Forbidden slap!',
    text: 'A forbidden left arm sealed by magic. Collect all 5 pieces.'
  },
  rightLeg: {
    name: 'Right Leg of the Forbidden One', kind: 'monster', level: 1, atk: 200, art: '🦵', flip: true,
    line: '*stomp*', attack: 'Forbidden kick!',
    text: 'A forbidden right leg sealed by magic. Collect all 5 pieces.'
  },
  leftLeg: {
    name: 'Left Leg of the Forbidden One', kind: 'monster', level: 1, atk: 200, art: '🦵',
    line: '*stomp*', attack: 'Forbidden kick!',
    text: 'A forbidden left leg sealed by magic. Collect all 5 pieces.'
  },

  pot: {
    name: 'Pot of Greed', kind: 'spell', art: () => POT_OF_GREED_SVG, artClass: 'disk-pot',
    text: 'Draw 2 cards.'
  },
  reborn: {
    name: 'Monster Reborn', kind: 'spell', art: () => MONSTER_REBORN_SVG,
    text: 'Revive the strongest monster in your Graveyard.'
  },
  cardDestruction: {
    name: 'Card Destruction', kind: 'spell', art: '🔥',
    text: 'Discard your whole hand, then draw the same number of cards.'
  },
  axe: {
    name: 'Axe of Despair', kind: 'spell', art: '🪓',
    text: 'Your strongest monster gains 1000 ATK.'
  },
  swords: {
    name: 'Swords of Revealing Light', kind: 'spell', art: '⚔️',
    text: "Stays on the field: the dummy can't attack for its next 3 turns."
  },

  cylinder: {
    name: 'Magic Cylinder', kind: 'trap', art: '🎩',
    text: 'When the dummy attacks: negate it and fire the damage straight back at the dummy.'
  },
  negate: {
    name: 'Negate Attack', kind: 'trap', art: '🛡️',
    text: 'When the dummy attacks: negate the attack.'
  },
  trapHole: {
    name: 'Trap Hole', kind: 'trap', art: '🕳️',
    text: 'When the dummy attacks: it falls in. Negate the attack, and it skips its next turn too.'
  },
  mirrorForce: {
    name: 'Mirror Force', kind: 'trap', art: '🪞',
    text: 'When the dummy attacks: negate it and shatter the dummy for 1000 damage.'
  }
};

const EXODIA_PIECE_IDS = ['exodia', 'rightArm', 'leftArm', 'rightLeg', 'leftLeg'];

const DISK_DECKLIST = [
  'kuriboh', 'kuriboh', 'celtic', 'celtic', 'elf', 'babyDragon', 'babyDragon', 'timeWizard',
  'skull', 'darkMagician', 'gaia', 'blueEyes',
  ...EXODIA_PIECE_IDS,
  'pot', 'reborn', 'cardDestruction', 'axe', 'swords',
  'cylinder', 'negate', 'trapHole', 'mirrorForce'
];
