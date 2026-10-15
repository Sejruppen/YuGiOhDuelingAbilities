const CHARACTERS = [
  {
    id: 'neutral',
    name: 'Neutral (Custom Deck)',
    era: 'Universal',
    skills: [
      { name: 'Tactical Rearrangement', text: 'Once per turn: You can shuffle 1 card from your hand into your deck, then draw 1 new card.', maxUses: null },
      { name: 'Vitality', text: 'Start the duel with 1000 extra Life Points.', maxUses: 1 },
      { name: 'Field Dominance', text: 'Once per duel, if your opponent controls a monster and you control none: Special Summon 1 Level 4 or lower monster from your hand.', maxUses: 1 },
      { name: 'Recycle', text: 'Once per duel: You can add 1 Spell or Trap Card from your Graveyard to your hand.', maxUses: 1 },
      { name: 'Adrenaline Rush', text: 'Once per turn: Target 1 face-up monster you control; it gains 500 ATK until the end of the turn.', maxUses: null }
    ],
    comebacks: [
      { name: 'Desperate Draw', text: 'Requirement: You have 2000 or fewer Life Points. Draw 2 cards. (Once per duel).', maxUses: 1 },
      { name: 'The Turning Point', text: 'Requirement: Your opponent controls 3 or more monsters and you control 0. Destroy all monsters on the opponent\'s side of the field.', maxUses: 1 },
      { name: 'Miracle Rebirth', text: 'Requirement: Your Life Points are less than half of your opponent\'s. Special Summon 1 monster from either player\'s Graveyard to your side of the field.', maxUses: 1 },
      { name: 'Shield of Hope', text: 'Requirement: You would take battle damage that would reduce your Life Points to 0. Your Life Points become 100 instead, and the Battle Phase ends immediately.', maxUses: 1 },
      { name: 'The Equalizer', text: 'Requirement: Your opponent has 3 or more cards in their hand than you. Draw cards until you have the same number of cards in your hand as your opponent.', maxUses: 1 }
    ],
    quests: [
      { name: 'The Attacker', text: 'Quest: Inflict battle damage to your opponent in 3 different battles. Reward: Draw 1 card.' },
      { name: 'The Defender', text: 'Quest: Successfully activate and resolve 3 Trap Cards during the duel. Reward: Gain 2000 Life Points.' },
      { name: 'Master Summoner', text: 'Quest: Special Summon 5 or more monsters during the same turn. Reward: Add 1 card of your choice from your deck to your hand.' },
      { name: 'The Survivor', text: 'Quest: Have your Life Points reduced to under 1000, and survive until the start of your next turn. Reward: Destroy 1 card of your choice on the field.' },
      { name: 'Resource Gatherer', text: 'Quest: Have 5 or more cards in your hand at the end of your turn. Reward: You can look at the opponent\'s hand and send 1 card from it to the Graveyard.' }
    ]
  },
  {
    id: 'yugi-dk',
    name: 'Yugi Muto',
    era: 'Duelist Kingdom',
    skills: [
      { name: '(Faith) Heart of the Cards', text: '1x per duel. Draw a card of your choice from your deck instead of a random one.', maxUses: 1 },
      { name: '(Friendship) Kuriboh\'s Shield', text: '1x per duel. Discard one card from your hand to halve all battle damage for one turn.', maxUses: 1 },
      { name: '(Magic) Magical Dimension', text: '1x per duel. Return one Spell Card from your Graveyard to your hand.', maxUses: 1 }
    ],
    comebacks: [
      { name: '(Faith) Pharaoh\'s Wrath', text: 'Requirement: Under 1000 LP. Cancel a direct attack and draw 2 cards.', maxUses: 1 },
      { name: '(Friendship) Bonds of Friendship', text: 'Requirement: You are behind on LP and have an empty field. Special Summon a Level 4 or lower monster from your deck. It cannot be destroyed this turn.', maxUses: 1 },
      { name: '(Magic) Mystic Swap', text: 'Requirement: Your field is empty, the opponent has monsters. Destroy the opponent\'s strongest monster and Special Summon a Spellcaster from your hand.', maxUses: 1 }
    ],
    quests: [
      { name: '(Faith) Soul of the Duelist', text: 'Quest: Survive 3 turns without losing LP. Reward: You draw 2 cards in your Draw Phase instead of 1.' },
      { name: '(Friendship) Unity', text: 'Quest: Have 3 monsters of different Types in your Graveyard. Reward: All your monsters gain a permanent +400 ATK.' },
      { name: '(Magic) Master\'s Call', text: 'Quest: Get "Dark Magician" on the field. Reward: Your Spellcasters cannot be targeted by your opponent\'s Trap Cards.' }
    ]
  },
  {
    id: 'yugi-bc',
    name: 'Yugi Muto',
    era: 'Battle City',
    skills: [
      { name: '(Divine) Wrath of the Heavens', text: '1x per duel. Force one of the opponent\'s monsters into Defense Position.', maxUses: 1 },
      { name: '(Synergy) Magnetic Pull', text: '1x per duel. Add a Level 4 or lower Rock- or Warrior-monster from your deck to your hand.', maxUses: 1 },
      { name: '(Master) Apprentice\'s Call', text: '1x per duel. Send a card from your hand to the Graveyard to Special Summon "Dark Magician Girl" from your hand.', maxUses: 1 }
    ],
    comebacks: [
      { name: '(Divine) Awakening of Thunder', text: 'Requirement: You are under 2000 LP. Draw cards until you have 5 cards in your hand. Skip your next Draw Phase.', maxUses: 1 },
      { name: '(Synergy) Magnetic Shield', text: 'Requirement: The opponent attacks for game. Cancel the attack and Special Summon up to 2 Normal Monsters from your Graveyard in Defense Position.', maxUses: 1 },
      { name: '(Master) Dark Magic', text: 'Requirement: The opponent has at least 3 cards on the field, you have 0. Banish one Spell Card from your Graveyard to destroy all cards on the opponent\'s field.', maxUses: 1 }
    ],
    quests: [
      { name: '(Divine) Arrival of God', text: 'Quest: Have 5 or more cards in your hand at the end of your turn. Reward: Your Level 7 or higher monsters cannot be destroyed by card effects.' },
      { name: '(Synergy) United Strength', text: 'Quest: Have 3 monsters on the field at the same time. Reward: Once per turn, your monsters cannot be destroyed in battle.' },
      { name: '(Master) Mastery of Magic', text: 'Quest: Activate 3 Spell Cards in one turn. Reward: The opponent takes 300 damage every time you activate a Spell Card.' }
    ]
  },
  {
    id: 'kaiba-dk',
    name: 'Seto Kaiba',
    era: 'Duelist Kingdom',
    skills: [
      { name: '(Resources) Money is Power', text: '1x per duel. Draw 2 cards. You cannot attack this turn.', maxUses: 1 },
      { name: '(Dragons) Dragon Call', text: '1x per duel. Normal Summon a Dragon-monster without paying Tribute.', maxUses: 1 },
      { name: '(Psychology) Intimidation', text: '1x per duel. The opponent must play with their hand revealed during their next turn.', maxUses: 1 }
    ],
    comebacks: [
      { name: '(Resources) Ruthless Buyout', text: 'Requirement: You are behind by 4000+ LP. Take control of the opponent\'s strongest monster for the rest of the duel.', maxUses: 1 },
      { name: '(Dragons) Wrath of the White Dragon', text: 'Requirement: The opponent attacks you directly. Special Summon "Blue-Eyes White Dragon" from your deck.', maxUses: 1 },
      { name: '(Psychology) Total Meltdown', text: 'Requirement: You have 0 cards in your hand and under 1500 LP. The opponent must discard their entire hand to the Graveyard.', maxUses: 1 }
    ],
    quests: [
      { name: '(Resources) Monopoly', text: 'Quest: Force the opponent to have 0 cards in their hand. Reward: The opponent can only Set 1 card per turn.' },
      { name: '(Dragons) Ultimate Dragon Lord', text: 'Quest: Have two "Blue-Eyes White Dragon" (or monsters with 3000+ ATK) on the field. Reward: Your dragons inflict piercing damage.' },
      { name: '(Psychology) Dominance', text: 'Quest: Destroy 3 of the opponent\'s monsters in battle. Reward: Every time the opponent Normal Summons, they lose 500 LP.' }
    ]
  },
  {
    id: 'kaiba-bc',
    name: 'Seto Kaiba',
    era: 'Battle City',
    skills: [
      { name: '(Destruction) Virus Infection', text: '1x per duel. Destroy a random card in the opponent\'s hand.', maxUses: 1 },
      { name: '(Technology) XYZ-Combination', text: '1x per duel. Equip a Machine-monster with another Machine-monster from your hand to give it +500 ATK.', maxUses: 1 },
      { name: '(Divine) Shadow of the Obelisk', text: '1x per duel. One of your monsters gains +1000 ATK until the end of the turn, but is then destroyed.', maxUses: 1 }
    ],
    comebacks: [
      { name: '(Destruction) Shattered Deck', text: 'Requirement: You take 2000+ damage in one turn. The opponent must send the top 5 cards of their deck to the Graveyard.', maxUses: 1 },
      { name: '(Technology) Emergency Fusion System', text: 'Requirement: Your field is empty. Special Summon 2 Level 4 Machine-monsters from your Graveyard.', maxUses: 1 },
      { name: '(Divine) Fist of Fury', text: 'Requirement: You are under 1000 LP. Destroy all monsters on the opponent\'s side of the field.', maxUses: 1 }
    ],
    quests: [
      { name: '(Destruction) Systematic Breakdown', text: 'Quest: Send 10 of the opponent\'s cards to the Graveyard. Reward: The opponent cannot draw a card in their Draw Phase unless they pay 500 LP.' },
      { name: '(Technology) The Perfect Machine', text: 'Quest: Get a Fusion- or Boss-monster on the field. Reward: Your Machine-monsters are immune to Traps.' },
      { name: '(Divine) Absolute Power', text: 'Quest: Tribute 3 monsters during the duel. Reward: The opponent cannot activate effects in the Battle Phase.' }
    ]
  },
  {
    id: 'joey-dk',
    name: 'Joey Wheeler',
    era: 'Duelist Kingdom',
    skills: [
      { name: '(Luck) Stroke of Luck', text: '1x per duel. Reroll a die roll or a coin toss.', maxUses: 1 },
      { name: '(Warriors) Flaming Will', text: '1x per duel. A Warrior-monster gains +500 ATK for one turn.', maxUses: 1 },
      { name: '(Grit) Brooklyn Guts', text: '1x per duel. If you would take battle damage, you take 0 instead.', maxUses: 1 }
    ],
    comebacks: [
      { name: '(Luck) All on Red', text: 'Requirement: The opponent attacks for game. Flip a coin. Heads: You win the duel! Tails: You lose.', maxUses: 1 },
      { name: '(Warriors) Comrade\'s Shield', text: 'Requirement: Your field is empty. Special Summon "Flame Swordsman" (or your strongest Level 4/5 monster) from the Graveyard in Defense Position.', maxUses: 1 },
      { name: '(Grit) Get Up!', text: 'Requirement: You have under 500 LP. Draw 3 cards. You can Normal Summon twice this turn.', maxUses: 1 }
    ],
    quests: [
      { name: '(Luck) Jackpot', text: 'Quest: Get two successful coin tosses/die rolls. Reward: Every time you Normal Summon, flip a coin. If Heads, draw a card.' },
      { name: '(Warriors) True Warrior', text: 'Quest: Have 3 Warrior-monsters in your Graveyard. Reward: Your Warriors gain +400 ATK.' },
      { name: '(Grit) Never Surrender', text: 'Quest: Take damage in 3 consecutive turns without losing. Reward: Your monsters can attack directly for half damage.' }
    ]
  },
  {
    id: 'joey-bc',
    name: 'Joey Wheeler',
    era: 'Battle City',
    skills: [
      { name: '(Red-Eyes) Black Dragon Call', text: '1x per duel. Send a "Red-Eyes" card from your deck to the Graveyard to draw a card.', maxUses: 1 },
      { name: '(Gambling) Dice Roll', text: '1x per duel. Roll a die. Multiply the result by 100 and give it as ATK to a monster for the rest of the turn.', maxUses: 1 },
      { name: '(Traps) Psycho-Shock', text: '1x per duel. Force the opponent to flip a face-down Trap Card (if possible, it is not activated, but sent to the Graveyard).', maxUses: 1 }
    ],
    comebacks: [
      { name: '(Red-Eyes) Rebirth of the Dragon', text: 'Requirement: You have fewer LP than the opponent. Special Summon "Red-Eyes Black Dragon" from your Graveyard.', maxUses: 1 },
      { name: '(Gambling) Desperation of the Lucky Blacksmith', text: 'Requirement: You are under 1000 LP. Roll a die. Destroy cards on the opponent\'s field equal to the roll divided by 2 (rounded down).', maxUses: 1 },
      { name: '(Traps) Graverobber', text: 'Requirement: The opponent has at least two Spells/Traps, and you have 0. Activate one Trap- or Spell Card directly from the opponent\'s Graveyard as if it were your own.', maxUses: 1 }
    ],
    quests: [
      { name: '(Red-Eyes) Power of Potential', text: 'Quest: Equip a monster with an Equip Spell twice. Reward: Your equipped monsters inflict double battle damage.' },
      { name: '(Gambling) High Roller', text: 'Quest: Roll a 5 or 6 on a die (or get two Heads in a row). Reward: Every time you roll a die, you may choose the result instead.' },
      { name: '(Traps) Presence of Jinzo', text: 'Quest: Destroy 3 of the opponent\'s Trap Cards. Reward: The opponent cannot activate Traps in the Battle Phase.' }
    ]
  },
  {
    id: 'mai',
    name: 'Mai Valentine',
    era: 'Character Deck',
    skills: [
      { name: '(Harpies) Harpie Swarm', text: '1x per duel. Draw a card for each "Harpie" (or WIND-monster) on the field.', maxUses: 1 },
      { name: '(Amazons) Amazon\'s Pride', text: '1x per duel. Force two monsters to battle (even in your Main Phase).', maxUses: 1 },
      { name: '(Scouting) Perfume Tactics', text: '1x per duel. Look at the top two cards of the opponent\'s deck and return them in any order.', maxUses: 1 }
    ],
    comebacks: [
      { name: '(Harpies) Feather Storm', text: 'Requirement: You receive a direct attack. Cancel the attack and return all of the opponent\'s Spells/Traps to their hand.', maxUses: 1 },
      { name: '(Amazons) Ambush', text: 'Requirement: You are under 1500 LP. Special Summon 2 WIND/EARTH monsters from your hand.', maxUses: 1 },
      { name: '(Scouting) Mirror Wall', text: 'Requirement: One of your monsters is attacked. Permanently halve the ATK of all the opponent\'s current monsters on the field.', maxUses: 1 }
    ],
    quests: [
      { name: '(Harpies) Air Supremacy', text: 'Quest: Have 3 WIND monsters on the field. Reward: WIND monsters can attack the opponent directly for half damage.' },
      { name: '(Amazons) Tribe\'s Honor', text: 'Quest: Your monsters survive 3 battles. Reward: All battle damage you take from battles involving your monsters is inflicted to the opponent instead.' },
      { name: '(Scouting) Foresight', text: 'Quest: Guess the top card of your deck correctly during your Draw Phase. Reward: You may look at the opponent\'s hand once per turn.' }
    ]
  },
  {
    id: 'mako',
    name: 'Mako Tsunami',
    era: 'Character Deck',
    skills: [
      { name: '(The Sea) The Tide', text: '1x per duel. Add "Umi" (or a variant) from your deck to your hand.', maxUses: 1 },
      { name: '(Fish) Fisherman\'s Patience', text: '1x per duel. Make a WATER-monster immune to battle destruction for one turn.', maxUses: 1 },
      { name: '(Assassination) Stealth Attack', text: '1x per duel. A WATER-monster can attack directly this turn, but the battle damage is halved.', maxUses: 1 }
    ],
    comebacks: [
      { name: '(The Sea) Tsunami', text: 'Requirement: You are under 2000 LP and Umi is on the field. Destroy all monsters on the field (except WATER-monsters).', maxUses: 1 },
      { name: '(Fish) The Legendary Fisherman', text: 'Requirement: The opponent attacks for game. Special Summon your strongest WATER-monster from your deck.', maxUses: 1 },
      { name: '(Assassination) Whirlpool', text: 'Requirement: Your field is empty. Return up to 2 of the opponent\'s monsters to their hand.', maxUses: 1 }
    ],
    quests: [
      { name: '(The Sea) Ruler of the Seas', text: 'Quest: Have Umi active on the field for 3 consecutive turns. Reward: Your WATER-monsters gain +500 ATK and DEF.' },
      { name: '(Fish) The Big Catch', text: 'Quest: Destroy a monster with 2500+ ATK in battle. Reward: Every time you destroy a monster, draw a card.' },
      { name: '(Assassination) Terror of the Deep', text: 'Quest: Perform 2 successful direct attacks. Reward: The opponent must discard a card every time they take battle damage.' }
    ]
  },
  {
    id: 'bakura',
    name: 'Bakura',
    era: 'Character Deck',
    skills: [
      { name: '(Occult) Pact of the Shadow Realm', text: '1x per duel. Swap Life Points with the opponent if theirs are higher (You can swap a maximum difference of 2000 LP).', maxUses: 1 },
      { name: '(Zombies) Return of the Undead', text: '1x per duel. Special Summon a Zombie/Fiend-monster from your Graveyard with its effects negated.', maxUses: 1 },
      { name: '(Destruction) Dark Temptation', text: '1x per duel. Send the top 3 cards from both players\' decks to the Graveyard.', maxUses: 1 }
    ],
    comebacks: [
      { name: '(Occult) Shadow of the Destiny Board', text: 'Requirement: You are under 1000 LP. The opponent now has exactly 3 turns to win. If they fail, you automatically win the duel.', maxUses: 1 },
      { name: '(Zombies) Mass Resurrection', text: 'Requirement: Your field is empty. Special Summon as many Zombie/Fiend-monsters from your Graveyard as possible in Defense Position. They are discarded in the End Phase.', maxUses: 1 },
      { name: '(Destruction) Soul Thief', text: 'Requirement: The opponent declares an attack, and you are behind on LP. Banish 5 cards from the opponent\'s Graveyard. You gain 300 LP per card.', maxUses: 1 }
    ],
    quests: [
      { name: '(Occult) Power of the Millennium Ring', text: 'Quest: The opponent must have over 10 cards in their Graveyard. Reward: You can look at the opponent\'s Set cards at any time.' },
      { name: '(Zombies) Necro-Lord', text: 'Quest: Have 5 monsters in your Graveyard. Reward: Your Zombie/Fiend-monsters can tribute the opponent\'s LP instead of their own ATK when attacking (burn instead of battle).' },
      { name: '(Destruction) Total Purge', text: 'Quest: Get the opponent\'s deck under 15 cards. Reward: During the opponent\'s Standby Phase, they must send the top card of their deck to the Graveyard.' }
    ]
  },
  {
    id: 'pegasus',
    name: 'Maximillion Pegasus',
    era: 'Character Deck',
    skills: [
      { name: '(Cartoons) Toon World', text: '1x per duel. Add "Toon World" (or a Toon-monster) from your deck to your hand.', maxUses: 1 },
      { name: '(Mind Reading) Millennium Eye', text: '1x per duel. Force the opponent to reveal their hand until your next End Phase.', maxUses: 1 },
      { name: '(Absorption) Illusionist\'s Grip', text: '1x per duel. Render one of the opponent\'s monsters unable to attack during their next turn.', maxUses: 1 }
    ],
    comebacks: [
      { name: '(Cartoons) The Great Spectacle', text: 'Requirement: The opponent attacks one of your monsters. Turn the attack into a direct attack, then draw 2 cards.', maxUses: 1 },
      { name: '(Mind Reading) Delusion', text: 'Requirement: The opponent activates a lethal effect or attack. Guess which card they drew at the start of the turn. If you guess correctly, the move is canceled and the card is destroyed.', maxUses: 1 },
      { name: '(Absorption) Relinquished\'s Hunger', text: 'Requirement: The opponent has at least 2 boss monsters. Take control of the opponent\'s strongest monster and equip it to one of your monsters (your monster gains its ATK).', maxUses: 1 }
    ],
    quests: [
      { name: '(Cartoons) Creator\'s Masterpiece', text: 'Quest: Have 2 Toon-monsters on the field at the same time. Reward: Your Toon-monsters do not require LP to attack and cannot be targeted.' },
      { name: '(Mind Reading) Perfect Prediction', text: 'Quest: Guess a type of hidden card (Spell/Trap/Monster) correctly 2 times. Reward: The opponent must announce out loud what they draw in their Draw Phase for the rest of the game.' },
      { name: '(Absorption) Soul Eater', text: 'Quest: Have "Relinquished" (or an Illusion-monster) survive for 2 turns. Reward: The opponent takes all battle damage that your monsters would normally take.' }
    ]
  },
  {
    id: 'odion',
    name: 'Odion',
    era: 'Character Deck',
    skills: [
      { name: '(Traps) Trap Master', text: '1x per duel. Set a Trap Card from your Graveyard. It is banished when it leaves the field.', maxUses: 1 },
      { name: '(Temple) King\'s Protection', text: '1x per duel. Your Trap Cards cannot be destroyed by the opponent\'s effects for one turn.', maxUses: 1 },
      { name: '(Endurance) Stamina', text: '1x per duel. Gain 1000 Life Points.', maxUses: 1 }
    ],
    comebacks: [
      { name: '(Traps) Trap Hell', text: 'Requirement: The opponent attacks directly. Activate all Trap Cards in your Graveyard that can stop or affect the attack, as if they were on the field.', maxUses: 1 },
      { name: '(Temple) Serket\'s Wrath', text: 'Requirement: You are under 1000 LP. Special Summon 2 Trap-monsters directly from your deck.', maxUses: 1 },
      { name: '(Endurance) Sandstorm', text: 'Requirement: The opponent has 3+ monsters, you have 0. Change all of the opponent\'s monsters to Defense Position and permanently halve their DEF.', maxUses: 1 }
    ],
    quests: [
      { name: '(Traps) The Labyrinth', text: 'Quest: Activate 4 Trap Cards during the duel. Reward: Every time you activate a Trap, you gain 500 LP.' },
      { name: '(Temple) The Sacred Beast', text: 'Quest: Special Summon a Trap-monster. Reward: Your Trap-monsters cannot be destroyed in battle.' },
      { name: '(Endurance) Unwavering', text: 'Quest: Survive an attack with under 500 LP remaining. Reward: You take no effect damage (burn damage) for the rest of the game.' }
    ]
  },
  {
    id: 'ishizu',
    name: 'Ishizu Ishtar',
    era: 'Character Deck',
    skills: [
      { name: '(Future) Millennium Necklace', text: '1x per duel. Look at the top 3 cards of the opponent\'s deck. Rearrange them however you like.', maxUses: 1 },
      { name: '(Gravekeepers) Gravekeeper\'s Call', text: '1x per duel. Add "Necrovalley" or a "Gravekeeper\'s" card from your deck to your hand.', maxUses: 1 },
      { name: '(Reversal) Twist of Fate', text: '1x per duel. If the opponent gains LP, you gain the same amount.', maxUses: 1 }
    ],
    comebacks: [
      { name: '(Future) Foreseen Doom', text: 'Requirement: The opponent declares an attack that will win the game. Cancel the attack. Then swap your hand with the top 5 cards of your deck.', maxUses: 1 },
      { name: '(Gravekeepers) Pharaoh\'s Curse', text: 'Requirement: You have 0 LP. (Activates as a Death-save). You survive with 100 LP, and the opponent\'s entire Graveyard is banished.', maxUses: 1 },
      { name: '(Reversal) Exchange of the Spirit', text: 'Requirement: Both players have at least 10 cards in their Graveyard, and you are behind on LP. Both players swap their deck with their Graveyard (shuffled).', maxUses: 1 }
    ],
    quests: [
      { name: '(Future) The Seer', text: 'Quest: Accurately predict which card the opponent will draw in their next Draw Phase (announce it during your turn). Reward: The opponent must play with their hand revealed.' },
      { name: '(Gravekeepers) Guardian of the Valley', text: 'Quest: Have "Necrovalley" and at least one Gravekeeper on the field. Reward: Cards in the Graveyards cannot be affected or moved by the opponent at all.' },
      { name: '(Reversal) Karma', text: 'Quest: Lose at least 2000 LP via card effects. Reward: All effect damage you take is reflected back to the opponent\'s LP.' }
    ]
  },
  {
    id: 'marik',
    name: 'Marik Ishtar',
    era: 'Character Deck',
    skills: [
      { name: '(Torture) Shadow Game', text: '1x per duel. The opponent takes 500 damage for each card they have in their hand.', maxUses: 1 },
      { name: '(Slime) Immortal Mass', text: '1x per duel. Create one "Slime Token" (Aqua/WATER/Level 1/ATK 500/DEF 500) in Defense Position.', maxUses: 1 },
      { name: '(Mind Control) Brainwash', text: '1x per duel. Take control of a Level 4 or lower monster from the opponent until the End Phase.', maxUses: 1 }
    ],
    comebacks: [
      { name: '(Torture) Hidden Pain', text: 'Requirement: You take battle damage. The opponent takes twice the amount of damage you just took.', maxUses: 1 },
      { name: '(Slime) Reconstruction', text: 'Requirement: The opponent destroys your strongest monster. Special Summon "Revival Jam" (or a Slime-monster) and draw 2 cards.', maxUses: 1 },
      { name: '(Ra) Wrath of the Sun God', text: 'Requirement: You are under 1000 LP. Pay all your LP except 1. Destroy the opponent\'s entire field, and the opponent takes 1000 damage for each destroyed card.', maxUses: 1 }
    ],
    quests: [
      { name: '(Torture) Master of Pain', text: 'Quest: Inflict effect damage to the opponent 3 times in one turn. Reward: The opponent loses 500 LP in their Standby Phase.' },
      { name: '(Slime) The Impenetrable Wall', text: 'Quest: Have a Slime-Token or Revival Jam survive 3 battles. Reward: Your monsters cannot be destroyed in battle.' },
      { name: '(Ra) Divine Sacrifice', text: 'Quest: Tribute 3 monsters for one Tribute Summon. Reward: The monster you summoned is unaffected by Spells and Traps.' }
    ]
  },
  {
    id: 'weevil',
    name: 'Weevil Underwood',
    era: 'Character Deck',
    skills: [
      { name: '(Insects) The Swarm', text: '1x per duel. Special Summon a Level 3 or lower Insect-monster from your hand.', maxUses: 1 },
      { name: '(Parasite) Infection', text: '1x per duel. Shuffle "Parasite Paracide" (or another Insect) from your deck into the opponent\'s deck.', maxUses: 1 },
      { name: '(Evolution) Pupation', text: '1x per duel. Swap an Insect-monster on the field with an Insect-monster from your deck that is 1 Level higher.', maxUses: 1 }
    ],
    comebacks: [
      { name: '(Insects) Pest Invasion', text: 'Requirement: You receive a direct attack. The opponent takes 300 damage for each Insect-monster in your Graveyard. The attack does not stop, but the damage might kill the opponent first.', maxUses: 1 },
      { name: '(Parasite) Disease Outbreak', text: 'Requirement: The opponent Normal Summons a Boss-monster. Equip the monster with an Insect from your hand. The monster loses 1000 ATK and cannot attack.', maxUses: 1 },
      { name: '(Evolution) Perfect Moth Awakening', text: 'Requirement: You have under 1500 LP and an empty field. Special Summon your strongest Insect-monster directly from your deck (ignores "Petit Moth" rules).', maxUses: 1 }
    ],
    quests: [
      { name: '(Insects) The Hive', text: 'Quest: Have 5 Insect-monsters on the field/in the Graveyard. Reward: Your Insect-monsters gain +500 ATK.' },
      { name: '(Parasite) Curse of the Forest', text: 'Quest: The opponent draws and plays a card you have infected (or an Insect). Reward: All monsters on the field become Insect-type, and you draw 2 cards.' },
      { name: '(Evolution) The Final Stage', text: 'Quest: Have an Insect survive 4 consecutive turns. Reward: You can destroy a card on the field for free once per turn.' }
    ]
  },
  {
    id: 'keith',
    name: 'Bandit Keith',
    era: 'Character Deck',
    skills: [
      { name: '(Cheating) Card up the Sleeve', text: '1x per duel. Swap a card in your hand with the bottom card of your deck.', maxUses: 1 },
      { name: '(Machines) Heavy Arsenal', text: '1x per duel. A Machine-monster gains +700 ATK this turn, but cannot attack directly.', maxUses: 1 },
      { name: '(Gambling) Russian Roulette', text: '1x per duel. Target a card on the opponent\'s field. Roll a die. 1-4: Destroy the card. 5-6: You take 1000 damage.', maxUses: 1 }
    ],
    comebacks: [
      { name: '(Cheating) Ambush Steal', text: 'Requirement: The opponent activates a crucial Spell/Trap Card. Cancel the activation and take the card into your own hand.', maxUses: 1 },
      { name: '(Machines) Slot Machine Emergency Spin', text: 'Requirement: You take a direct attack. Special Summon 3 "Coin Tokens" in Defense Position. If they are destroyed, you draw one card per token.', maxUses: 1 },
      { name: '(Gambling) All or Nothing', text: 'Requirement: You have 0 cards in your hand. Draw 3 cards. If you do not win this turn, you automatically lose in the End Phase.', maxUses: 1 }
    ],
    quests: [
      { name: '(Cheating) Bandit King', text: 'Quest: Take control of one of the opponent\'s monsters. Reward: You may look at the top card of the opponent\'s deck at any time.' },
      { name: '(Machines) Arms Race', text: 'Quest: Equip a Machine-monster with 2 Equip Cards. Reward: Your Machines inflict piercing damage and cannot be targeted.' },
      { name: '(Gambling) Blessing in Disguise', text: 'Quest: Lose LP from your own card effects 3 times. Reward: Every time the opponent draws a card outside their Draw Phase, they take 800 damage.' }
    ]
  }
];
