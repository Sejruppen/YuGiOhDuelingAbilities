const CHARACTERS = [
  {
    id: 'neutral',
    name: 'Neutral (Custom Deck)',
    theme: 'Freestyle',
    skills: [
      { name: 'Tactical Rearrangement', text: 'You can shuffle 1 card from your hand into your deck, then draw 1 new card.', maxUses: 3 },
      { name: 'Vitality', text: 'Start the duel with 3000 extra Life Points.', maxUses: null },
      { name: 'Field Dominance', text: 'If your opponent controls a monster and you control none: Special Summon 1 Level 4 or lower monster from your hand.', maxUses: 1 },
      { name: 'Recycle', text: 'You can add 1 Spell or Trap Card from your Graveyard to your hand.', maxUses: 1 },
      { name: 'Adrenaline Rush', text: 'Target 1 face-up monster you control; it gains 500 ATK until the end of the turn.', maxUses: 3 }
    ],
    comebacks: [
      { name: 'Desperate Draw', text: 'Requirement: You have 2000 or fewer Life Points. Draw 2 cards.' },
      { name: 'The Turning Point', text: 'Requirement: Your opponent controls 3 or more monsters and you control 0. Destroy all monsters on the opponent\'s side of the field.' },
      { name: 'Miracle Rebirth', text: 'Requirement: Your Life Points are less than half of your opponent\'s. Special Summon 1 monster from either player\'s Graveyard to your side of the field.' },
      { name: 'Shield of Hope', text: 'Requirement: You would take battle damage that would reduce your Life Points to 0. Your Life Points become 100 instead, and the Battle Phase ends immediately.' },
      { name: 'The Equalizer', text: 'Requirement: Your opponent has 3 or more cards in their hand than you. Draw cards until you have the same number of cards in your hand as your opponent.' }
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
    id: 'theotaur',
    name: 'Theotaur',
    theme: 'Dark Paladin\'s Legion',
    skills: [
      { name: '(Fusion) The Masters Apprentice', text: 'You can discard 1 card; add 1 "Polymerization" card from your Deck to your hand or reveal 1 Fusion monster in your Extra Deck; Add 1 of the Fusion Materials whose name is specifically listed on that monster from your Deck or GY to your hand', maxUses: 1 },
      { name: '(Bond of Dragon) The dragontamers call', text: 'Discard 1 Dragon monster; Draw 1 card.', maxUses: 3 },
      { name: '(Illusion) Magical Transformation', text: 'Choose 1 monster on your side of the field. The monsters name is treated as either "Dark Magician" or "Buster Blader" until the end of the turn.', maxUses: 1 }
    ],
    comebacks: [
      { name: '(Miracle) Ultimate Magical Fusion', text: 'Requirement: Your LP is 2000 or lower and your opponent has a monster with the highest ATK on the field. Special Summon "Dark Paladin" by Banishing the Fusion Materials needed from your GY' },
      { name: '(Revenge) Dragonslayers Wrath', text: 'Requirement: Your opponent declares an attack that will make you lose 2000 or more LP. Negate the attack. Destroy all your opponents monsters with the same Type as the attacking monster and Special Summon Buster Blader from your Hand or GY.' },
      { name: '(Grit) The Paladin\'s Last Bastion', text: 'Requirement: Your LP are lower than your opponent\'s LP and your opponent activates a Spell or Trap card that would destroy 1 or more of your monsters. Discard 1 card; Negate and destroy the activated card. For the rest of the turn you take no battle damage.' }
    ],
    quests: [
      { name: '(Magic Guardian) The Perfect Counterspell', text: 'Quest: Negate the activation of 2 Spell cards (e.g. with the effect of "Dark Paladin"). Reward: Every time you activate a spell card; gain 500 LP' },
      { name: '(The Dragonslayers Heir) Slaying the Beast', text: 'Quest: Destroy 3 of your opponent\'s monsters by battle with a Warrior or Spellcaster monster. Reward: Attacks from Dragons and Fusion monsters on your side of the field inflicts Piercing Damage' },
      { name: '(Trinity) The Three Pillars', text: 'Quest: Have at least 1 monster of each of these 3 types in your GY: Dragon, Spellcaster and Warrior at the same time. Reward: Level 7 or higher monsters on your side of the field cannot be targeted by card effects' }
    ]
  },
  {
    id: 'trizze',
    name: 'Trizze',
    theme: 'Legends Assembled',
    skills: [
      { name: '(White Dragon) The Legend Comes to Life', text: 'Reveal 1 "Blue-Eyes White Dragon" in your hand; add 1 "Polymerization" or "Future Fusion" from your Deck to your hand.', maxUses: 1 },
      { name: '(Sky God) Divine Offering', text: 'You can treat 1 monster you control as 2 Tributes for the Tribute Summon of a Divine-Beast monster.', maxUses: 1 },
      { name: '(Cybernetic) Machine Assembly', text: 'If you control a Machine monster: Add 1 Machine monster from your Deck to your hand.', maxUses: 1 },
      { name: '(Illusion) Master of Traps', text: 'Set 1 "Magical Hats" or "Spellbinding Circle" directly from your Deck to your Spell & Trap Zone.', maxUses: 1 },
      { name: '(Arsenal) Overwhelming Power', text: 'Send 1 card from your hand to the GY; add 1 "United We Stand" or "Mage Power" from your Deck to your hand.', maxUses: 1 }
    ],
    comebacks: [
      { name: '(White Dragon) The Legend Comes to Life', text: 'Requirement: You have 2000 or less LP. Special Summon 1 "Blue-Eyes White Dragon" from your hand or GY. It cannot attack directly this turn.' },
      { name: '(Sky God) Divine Offering', text: 'Requirement: Your LP is lower than your opponent\'s and they control 2 or more monsters. Draw 2 cards. You can only Normal Summon Divine-Beast monsters this turn.' },
      { name: '(Cybernetic) Machine Assembly', text: 'Requirement: You have 2000 or less LP and control no monsters. Special Summon 1 "Cyber Dragon" from your Deck or GY, and if you do, it gains 1000 ATK until the end of the turn.' },
      { name: '(Illusion) Master of Traps', text: 'Requirement: You take battle damage that leaves you with 2000 or less LP. Set 1 "Mirror Force" or "Draining Shield" directly from your GY; it can be activated this turn.' },
      { name: '(Arsenal) Overwhelming Power', text: 'Requirement: Your LP is 2000 or less and an opponent controls a monster with 3000 or more ATK. Equip 1 "Solitary Sword of Poison" from your Deck to a monster you control.' }
    ],
    quests: [
      { name: '(White Dragon) The Legend Comes to Life', text: 'Quest: Fusion Summon "Blue-Eyes Ultimate Dragon". Reward: "Blue-Eyes" monsters you control are unaffected by your opponent\'s Trap Cards.' },
      { name: '(Sky God) Divine Offering', text: 'Quest: Successfully Tribute Summon a Divine-Beast monster. Reward: Your opponent cannot activate cards or effects when your Divine-Beast monsters attack.' },
      { name: '(Cybernetic) Machine Assembly', text: 'Quest: Destroy 3 monsters by battle using Machine monsters. Reward: Once per turn, you can negate the activation of an opponent\'s Spell/Trap card that targets a Machine monster you control.' },
      { name: '(Illusion) Master of Traps', text: 'Quest: Successfully resolve 3 Trap Cards. Reward: Your opponent takes 500 damage each time they attack directly.' },
      { name: '(Arsenal) Overwhelming Power', text: 'Quest: Control a monster equipped with 2 or more Equip Spells. Reward: Equipped monsters you control inflict piercing battle damage.' }
    ]
  },
  {
    id: 'yugi-dk',
    name: 'Yugi Muto (Duelist Kingdom)',
    theme: 'Heart of the Cards',
    skills: [
      { name: '(Faith) Heart of the Cards', text: 'Draw a card of your choice from your deck instead of a random one.', maxUses: 3 },
      { name: '(Friendship) Kuriboh\'s Shield', text: 'Discard one card from your hand to halve all battle damage for one turn.', maxUses: 1 },
      { name: '(Magic) Magical Dimension', text: 'Return one Spell Card from your Graveyard to your hand.', maxUses: 1 }
    ],
    comebacks: [
      { name: '(Faith) Pharaoh\'s Wrath', text: 'Requirement: You have 2000 or lower LP. Cancel a direct attack and draw 2 cards.' },
      { name: '(Friendship) Bonds of Friendship', text: 'Requirement: You are behind on LP and have an empty field. Special Summon a Level 4 or lower monster from your deck. It cannot be destroyed this turn.' },
      { name: '(Magic) Ritualistic Demise', text: 'Requirement: Your opponent has 3000 LP more than you. Add 1 Ritual monster or 1 Ritual spell card from your deck to your hand.' }
    ],
    quests: [
      { name: '(Faith) Soul of the Duelist', text: 'Quest: Survive 3 turns without losing LP. Reward: You draw 2 cards in your Draw Phase instead of 1.' },
      { name: '(Friendship) Unity', text: 'Quest: Have 3 monsters of different Types in your Graveyard. Reward: All your monsters gain a permanent +400 ATK.' },
      { name: '(Magic) Master\'s Call', text: 'Quest: Get "Dark Magician" on the field. Reward: Your Spellcasters cannot be targeted by your opponent\'s Trap Cards.' }
    ]
  },
  {
    id: 'yugi-bc',
    name: 'Yugi Muto (Battle City)',
    theme: 'Magician\'s Force',
    skills: [
      { name: '(Magnet) Magnetic Attraction', text: 'When you Normal Summon "Alpha", "Beta" or "Gamma the Magnet Warrior": Add 1 Magnet Warrior with a different name from your Deck to your hand.', maxUses: 2 },
      { name: '(Knights) Royal Summons', text: 'Add 1 "Queen\'s Knight" or "King\'s Knight" from your Deck to your hand.', maxUses: 2 },
      { name: '(Magic) Master and Apprentice', text: 'Reveal "Dark Magician" or "Dark Magician Girl" in your hand; add the other one from your Deck to your hand.', maxUses: 1 },
      { name: '(Mythic) Unholy Pact', text: 'You can Special Summon 1 Level 5 or 6 Fiend monster in Defense Position.', maxUses: 2 },
      { name: '(Divine) Tribute to the Gods', text: 'You can Tribute Summon a monster that requires 3 Tributes using only 2.', maxUses: 1 },
    ],
    comebacks: [
      { name: '(Magnet) Magna Assembly', text: 'Requirement: You have 2000 or less LP and "Alpha", "Beta" and "Gamma the Magnet Warrior" are in your GY. Shuffle them into your Deck; Special Summon "Valkyrion the Magna Warrior" from your hand or Deck ignoring it\'s Summoning condition.' },
      { name: '(Knights) Avenging Blade', text: 'Requirement: You have 2000 or less LP and a monster you control is destroyed by battle. Special Summon "Jack\'s Knight" from your Deck or GY; it gains ATK equal to the destroyed monster\'s ATK until the end of your next turn.' },
      { name: '(Magic) Dragon Slayer\'s Edge', text: 'Requirement: Your LP is lower than your opponent\'s and they control a monster with higher ATK than all of yours. Add "Buster Blader" from your Deck or GY to your hand; you can Normal Summon it without Tributing this turn.' },
      { name: '(Mythic) Rise of the Chimera', text: 'Requirement: You have 2000 or less LP and "Berfomet" and "Gazelle the King of Mythical Beasts" are in your GY. Banish them; Special Summon "Chimera the Flying Mythical Beast" from your Extra Deck.' },
      { name: '(Divine) Call of the Sky Dragon', text: 'Requirement: You have 2000 or less LP, control no monsters and have "Slifer the Sky Dragon" in your hand. Special Summon it, ignoring its Summoning conditions. It cannot attack this turn.' },
    ],
    quests: [
      { name: '(Magnet) Unbreakable Wall', text: 'Quest: Summon 3 different "Magnet Warrior" monsters. Reward: Your Rock Type monsters gain 300 ATK and DEF.' },
      { name: '(Knights) Loyal Court', text: 'Quest: Control 3 Warrior monsters at the same time. Reward: Your Warrior monsters cannot be destroyed by battle.' },
      { name: '(Magic) The Paladin\'s Oath', text: 'Quest: Fusion Summon "Dark Paladin". Reward: Once per turn, "Dark Paladin" can negate a Spell Card without discarding.' },
      { name: '(Mythic) The Beast Reborn', text: 'Quest: Resolve the effect of "Chimera the Flying Mythical Beast" after it is destroyed. Reward: Once per turn, when a Fiend or Beast you control is destroyed by battle, inflict 500 damage to your opponent.' },
      { name: '(Divine) Infinite Power', text: 'Quest: "Slifer the Sky Dragon" reaches 5000 or more ATK. Reward: You have no hand size limit, and you draw 2 cards in your Draw Phase instead of 1.' },
    ]
  },
  {
    id: 'kaiba-dk',
    name: 'Seto Kaiba (Duelist Kingdom)',
    theme: 'Legend of Blue Eyes',
    skills: [
      { name: '(Resources) Money is Power', text: 'Draw 1 cards. You cannot attack this turn.', maxUses: 3 },
      { name: '(Dragons) Dragon Call', text: 'Normal Summon a Dragon-monster without paying Tribute.', maxUses: 1 },
      { name: '(Psychology) Intimidation', text: 'The opponent must play with their hand revealed during their next turn.', maxUses: 2 }
    ],
    comebacks: [
      { name: '(Resources) Ruthless Buyout', text: 'Requirement: You are behind by 4000 or more LP. Take control of the opponent\'s strongest monster for the rest of the duel.' },
      { name: '(Dragons) Wrath of the White Dragon', text: 'Requirement: The opponent attacks you directly. After the damage step; Special Summon "Blue-Eyes White Dragon" from your deck.' },
      { name: '(Psychology) Total Meltdown', text: 'Requirement: You have 0 cards in your hand and under 3000 LP. The opponent must discard their entire hand to the Graveyard.' }
    ],
    quests: [
      { name: '(Resources) Monopoly', text: 'Quest: Force the opponent to have 0 cards in their hand. Reward: The opponent can only Set 1 card per turn.' },
      { name: '(Dragons) Ultimate Dragon Lord', text: 'Quest: Have two "Blue-Eyes White Dragon" (or monsters with 3000+ ATK) on the field. Reward: Your dragons inflict piercing damage.' },
      { name: '(Psychology) Dominance', text: 'Quest: Destroy 3 of the opponent\'s monsters in battle. Reward: Every time the opponent Normal Summons, they lose 500 LP.' }
    ]
  },
  {
    id: 'kaiba-bc',
    name: 'Seto Kaiba (Battle City)',
    theme: 'Obelisk\'s Arsenal',
    skills: [
      { name: '(Destruction) Virus Infection', text: 'Once per turn: Destroy a random card in the opponent\'s hand.', maxUses: 2 },
      { name: '(Technology) XYZ-Combination', text: 'Equip a Machine-monster with another Machine-monster from your GY to give it +500 ATK.', maxUses: 2 },
      { name: '(Divine) Shadow of the Obelisk', text: 'One of your monsters gains +1000 ATK until the end of the turn, but is then destroyed.', maxUses: 2 }
    ],
    comebacks: [
      { name: '(Destruction) Shattered Deck', text: 'Requirement: You take 2000+ damage in one turn. The opponent must send the top 5 cards of their deck to the Graveyard.' },
      { name: '(Technology) Emergency Fusion System', text: 'Requirement: Your field is empty. Special Summon 2 Level 4 Machine-monsters from your Graveyard.' },
      { name: '(Divine) Fist of Fury', text: 'Requirement: You are under 1000 LP. Destroy all monsters in Attack Position on the opponent\'s side of the field.' }
    ],
    quests: [
      { name: '(Destruction) Systematic Breakdown', text: 'Quest: Send 10 of the opponent\'s cards to the Graveyard. Reward: The opponent cannot draw a card in their Draw Phase unless they pay 500 LP.' },
      { name: '(Technology) The Perfect Machine', text: 'Quest: Get a Fusion monster on the field. Reward: Your Machine type monsters are immune to Traps.' },
      { name: '(Divine) Absolute Power', text: 'Quest: Tribute 3 monsters during the duel. Reward: The opponent cannot activate effects in the Battle Phase.' }
    ]
  },
  {
    id: 'joey-dk',
    name: 'Joey Wheeler (Duelist Kingdom)',
    theme: 'Brooklyn Underdog',
    skills: [
      { name: '(Luck) Stroke of Luck', text: 'Reroll a die roll or a coin toss.', maxUses: 1 },
      { name: '(Warriors) Flaming Will', text: 'Once per turn: Lose 500 LP; a Warrior monster gains +500 ATK for one turn.', maxUses: 3 },
      { name: '(Grit) Brooklyn Guts', text: 'If you would take battle damage, you take 0 instead.', maxUses: 3 }
    ],
    comebacks: [
      { name: '(Luck) All on Red', text: 'Requirement: The opponent attacks for game and you have 10 or more cards in your GY. Roll a die. 1: You lose the duel. 2-3: Negate the attack. 4-5: Negate the attack and destroy the attacking monster. 6: You win the duel!' },
      { name: '(Warriors) Comrade\'s Shield', text: 'Requirement: Your field is empty and your opponent have 3 or more monsters. Special Summon "Flame Swordsman" from your Extra Deck' },
      { name: '(Grit) Get Up!', text: 'Requirement: You have under 2000 LP. Draw 3 cards. You can Normal Summon thrice this turn.' }
    ],
    quests: [
      { name: '(Luck) Jackpot', text: 'Quest: Get two of either successful coin tosses or die rolls of 5 or 6. Reward: Every time you Normal Summon, flip a coin. If Heads, draw a card.' },
      { name: '(Warriors) True Warrior', text: 'Quest: Have 3 Warrior-monsters in your Graveyard. Reward: "Special Summon "Giltia the D. Knight" from your Extra Deck.' },
      { name: '(Grit) Never Surrender', text: 'Quest: Take damage in 3 different turns without losing. Reward: Your monsters can attack directly for half damage.' }
    ]
  },
  {
    id: 'joey-bc',
    name: 'Joey Wheeler (Battle City)',
    theme: 'Red-Eyes Gamble',
    skills: [
      { name: '(Fusion) Dragon Nursery', text: 'Reveal "Thousand Dragon" or "Alligator\'s Sword Dragon" in your Extra Deck; add 1 fusion material listed on the Fusion monster from your Deck to your hand.', maxUses: 2 },
      { name: '(Warriors) Battle Formation', text: 'If you control a Warrior or Beast-Warrior: Special Summon 1 Level 4 or lower Warrior or Beast-Warrior from your hand.', maxUses: 2 },
      { name: '(Luck) Stroke of Luck', text: 'Reroll a die roll or a coin toss.', maxUses: 1 },
      { name: '(Red-Eyes) Black Dragon Bond', text: 'Send 1 card from your hand to the GY; add "Red-Eyes Black Dragon" from your Deck to your hand.', maxUses: 1 },
      { name: '(Jinzo) Trap Sacrifice', text: 'You can Tribute 1 face-down Trap Card you control instead of a monster to Tribute Summon "Jinzo".', maxUses: 1 }
    ],
    comebacks: [
      { name: '(Fusion) Swamp Ambush', text: 'Requirement: Your opponent controls more monsters than you, and you control "Baby Dragon" or "Alligator\'s Sword". Send it and the other Fusion Material from your hand or Deck to the GY; Special Summon "Alligator\'s Sword Dragon" from your Extra Deck. It can attack directly this turn.' },
      { name: '(Warriors) Iron Resolve', text: 'Requirement: You have 1500 or less LP and your opponent controls a monster with higher ATK than all of yours. Special Summon "Gearfried the Iron Knight" from your hand, Deck or GY. It gains 1000 ATK and cannot be destroyed by battle until the end of the turn.' },
      { name: '(Luck) Lady Luck\'s Favor', text: 'Requirement: You have 1000 or less LP. Your next coin tosses is Heads, and your next die roll is 6.' },
      { name: '(Red-Eyes) Dragon\'s Awakening', text: 'Requirement: You control no monsters and your opponent controls 2 or more. Special Summon "Red-Eyes Black Dragon" from your hand or GY. It gains 400 ATK for each monster your opponent controls until the end of the turn.' },
      { name: '(Jinzo) Hidden Arsenal', text: 'Requirement: You have 1500 or less LP and 2 or more Trap Cards in your GY. Set 1 Trap Card from your GY. It can be activated this turn.' }
    ],
    quests: [
      { name: '(Fusion) Master of Time', text: 'Quest: Get Heads on the effect of "Time Wizard". Reward: Special Summon "Thousand Dragon" from your Extra Deck' },
      { name: '(Warriors) Band of Brothers', text: 'Quest: Control 3 Warrior or Beast-Warrior monsters at the same time. Reward: Your Warriors and Beast-Warriors gain 200 ATK for each other Warrior or Beast-Warrior you control.' },
      { name: '(Luck) Snake Eyes', text: 'Quest: Roll a 1 on a die. Reward: Whenever you roll a 1, 2 or a 3, you can treat it as a 6.' },
      { name: '(Red-Eyes) Underdog Dragon', text: 'Quest: Summon "Red-Eyes Black Dragon" while your LP is lower than your opponent\'s. Reward: While your LP is lower than your opponent\'s, "Red-Eyes Black Dragon" gains ATK equal to the difference (max 1500).' },
      { name: '(Jinzo) Psychic Dominion', text: 'Quest: Keep "Jinzo" on the field for 3 of your turns. Reward: Your opponent cannot Set Trap Cards.' },
    ]
  },
  {
    id: 'mai',
    name: 'Mai Valentine',
    theme: 'Harpie Hunting Ground',
    skills: [
      { name: '(Harpies) Harpie Swarm', text: 'Draw a card for each "Harpie" (or WIND-monster) on the field.', maxUses: 1 },
      { name: '(Amazons) Amazon\'s Pride', text: 'Force two monsters to battle (even in your Main Phase).', maxUses: 2 },
      { name: '(Scouting) Perfume Tactics', text: 'Once per turn: Look at the top two cards of your deck and return them in any order.', maxUses: 6 }
    ],
    comebacks: [
      { name: '(Harpies) Feather Storm', text: 'Requirement: You receive a direct attack. Cancel the attack and destroy all of the Spells/Traps on the opponents side of the field' },
      { name: '(Amazons) Ambush', text: 'Requirement: You are under 1500 LP. Special Summon 2 WIND/EARTH monsters from your hand.' },
      { name: '(Scouting) Mirror Wall', text: 'Requirement: One of your monsters is attacked. Permanently halve the ATK of all the opponent\'s current monsters on the field.' }
    ],
    quests: [
      { name: '(Harpies) Air Supremacy', text: 'Quest: Have 3 WIND monsters on the field. Reward: WIND monsters can attack the opponent directly for half damage.' },
      { name: '(Amazons) Tribe\'s Honor', text: 'Quest: Thrice a monster you control has survived a battle. Reward: All battle damage you take from battles involving your monsters is inflicted to the opponent instead.' },
      { name: '(Scouting) Perfect Setup', text: 'Quest: Use the "Perfume Tactics" thrice. Reward: "Perfume Tactics" looks at the top 3 cards instead of 2.' },
    ]
  },
  {
    id: 'mako',
    name: 'Mako Tsunami',
    theme: 'Ruler of the Deep',
    skills: [
      { name: '(The Sea) The Tide', text: 'Add "Umi" (or a variant) from your deck to your hand.', maxUses: 1 },
      { name: '(Fish) Fisherman\'s Patience', text: 'Normal Summon a level 5 or 6 Water monster without paying Tribute.', maxUses: 1 },
      { name: '(Assassination) Stealth Attack', text: 'A WATER-monster can attack directly this turn, but the battle damage is halved.', maxUses: 3 }
    ],
    comebacks: [
      { name: '(The Sea) Tsunami', text: 'Requirement: You are under 2000 LP and Umi is on the field. Destroy all monsters on the field except WATER monsters.' },
      { name: '(Fish) The Legendary Fisherman', text: 'Requirement: The opponent attacks for game. Negate the attack and Special Summon a level 5 Water monster from your deck.' },
      { name: '(Assassination) Whirlpool', text: 'Requirement: Your field is empty. Return up to 2 of the opponent\'s monsters to their hand.' }
    ],
    quests: [
      { name: '(The Sea) Ruler of the Seas', text: 'Quest: Have Umi active on the field for 3 consecutive turns. Reward: Your WATER-monsters gain +500 ATK and DEF.' },
      { name: '(Fish) The Big Catch', text: 'Quest: Destroy a monster with 2500+ ATK in battle. Reward: Every time you destroy a monster, draw a card.' },
      { name: '(Assassination) Shadows in the Water', text: 'Quest: Your opponent attacks a face-down WATER monster 3 times. Reward: Reward: Once per turn, take all WATER monsters you control in Attack Position, shuffle them and Set them face-down in Attack Position. Then do the same with your WATER monsters in Defense Position. Your opponent can\'t look at them, and they\'re flipped face-up when they attack or are attacked.' },
    ]
  },
  {
    id: 'bakura',
    name: 'Bakura',
    theme: 'Shadow Realm Occult',
    skills: [
      { name: '(Occult) Pact of the Shadow Realm', text: 'Flip a coin; if Heads: Swap Life Points with the opponent if theirs are higher. If Tails: you loose 1000 LP', maxUses: 2 },
      { name: '(Zombies) Return of the Undead', text: 'Special Summon a Zombie/Fiend-monster from your Graveyard with its effects negated.', maxUses: 2 },
      { name: '(Destruction) Dark Temptation', text: 'Once per turn: Send the top 3 cards from both players\' decks to the Graveyard.', maxUses: 5 },
      { name: '(Necrofear) Dark Sanctuary Rite', text: 'Banish 1 Fiend monster from your Graveyard; add "Dark Necrofear" from your Deck to your hand.', maxUses: 1 },
      { name: '(Possession) Change of Heart', text: 'Take control of 1 monster your opponent controls until the End Phase. You cannot attack your opponents\'s LP directly this turn.', maxUses: 1 },
      { name: '(Millennium Ring) Contract with the Dark Master', text: 'Send 1 Fiend monster from your hand or Deck to the Graveyard; add "Dark Master - Zorc" or "Contract with the Dark Master" from your Deck to your hand.', maxUses: 1 },
    ],
    comebacks: [
      { name: '(Occult) Shadow of the Destiny Board', text: 'Requirement: You are under 1000 LP. The opponent now has exactly 3 turns to win. If they fail, you automatically win the duel.' },
      { name: '(Zombies) Mass Resurrection', text: 'Requirement: Your field is empty. Special Summon as many Zombie/Fiend-monsters from your Graveyard as possible in Defense Position. They are sent to the GY in the End Phase.' },
      { name: '(Destruction) Soul Thief', text: 'Requirement: The opponent declares an attack, and you are behind on LP. Banish up to 5 cards from the opponent\'s Graveyard. You gain 300 LP per card.' },
      { name: '(Necrofear) Vengeful Possession', text: 'Requirement: A Fiend monster you control is destroyed by your opponents card. Take control of 1 face-up monster your opponent controls until the end of their next turn.' },
      { name: '(Possession) Soul Figurine', text: 'Requirement: Your opponent initiates an attack that would reduce your LP to 0. Negate the attack and banish the attacking monster and all copies on your opponent\'s side of the field, their Deck and GY.' },
      { name: '(Millennium Ring) Descent of the Dark Master', text: 'Requirement: You have 2000 or less LP and your opponent controls 2 or more monsters. Banish Fiend monsters from your Graveyard whose total Levels equal 8 or more; Ritual Summon "Dark Master - Zorc" from your hand or Graveyard.' },
    ],
    quests: [
      { name: '(Occult) Fading Souls', text: 'Quest: Destroy 3 of the opponent\'s monsters in battle. Reward: Whenever your opponent\'s monsters are destroyed in battle banish them instead of sending them to the GY.' },
      { name: '(Zombies) Necro-Lord', text: 'Quest: Have 5 monsters in your Graveyard. Reward: Once per turn; your Zombie and Fiend monsters can be tributed to inflict their ATK as damage to your opponent\'s LP.' },
      { name: '(Destruction) Total Purge', text: 'Quest: Get the opponent\'s deck under 15 cards. Reward: During the opponent\'s Standby Phase, they must send the top card of their deck to the Graveyard.' },
      { name: '(Necrofear) Three Fiends\' Offering', text: 'Quest: Banish 3 Fiend monsters from your Graveyard during the duel. Reward: Your opponent takes 500 damage whenever a Fiend monster you control is destroyed.' },
      { name: '(Possession) Monster World', text: 'Quest: Take control of your opponent\'s monsters 2 times during the duel. Reward: Once per turn, when your opponent declares an attack, roll a die. On a 1 or 2, the attack is negated and the attacking monster loses 500 ATK permanently.' },
      { name: '(Millennium Ring) Master of the Monster World', text: 'Quest: Ritual Summon "Dark Master - Zorc" and resolve its die roll effect 2 times. Reward: When you roll a 6 for the effect of "Dark Master - Zorc", treat it as a 3 instead.' }
    ]
  },
  {
    id: 'pegasus',
    name: 'Maximillion Pegasus',
    theme: 'Toon Kingdom',
    skills: [
      { name: '(Cartoons) Toon World', text: 'Activate Toon world without paying LP.', maxUses: 2 },
      { name: '(Millennium Eye) Mind Reading', text: 'Your opponent play with their hand revealed', maxUses: null },
      { name: '(Absorption) Illusionist\'s Grip', text: 'Render the opponent\'s monsters unable to attack during their next turn.', maxUses: 1 }
    ],
    comebacks: [
      { name: '(Cartoons) The Great Spectacle', text: 'Requirement: The opponent attacks one of your monsters. Turn the attack into a direct attack, then draw a card.' },
      { name: '(Millennium Eye) Penalty Game: Sealed Tape', text: 'Requirement: Your opponent declares an attack that would reduce your LP to 0. Negate the attack, banish the attacking monster face-down and end the Battle Phase. Return it to your opponent\'s field during the End Phase of your next turn.' },
      { name: '(Absorption) Relinquished\'s Hunger', text: 'Requirement: The opponent has at least 2 level 5 or higher monsters. Take control of one of the opponent\'s monster and equip it to one of your monsters (your monster gains its ATK). The equipped monster cannot attack' }
    ],
    quests: [
      { name: '(Cartoons) Creator\'s Masterpiece', text: 'Quest: Have 3 Toon-monsters on the field at the same time. Reward: Your Toon-monsters can attack the turn they are summoned' },
      { name: '(Millennium Eye) Penalty Game', text: 'Quest: Your opponent\'s LP is half or less of yours. Reward: Monsters your opponent controls that would be destroyed are banished face-down instead.' },
      { name: '(Absorption) Soul Eater', text: 'Quest: Have "Relinquished" (or an Illusion-monster) survive for 2 turns. Reward: Whenever your monsters are destroyed by battle your opponent takes the battle damage instead of you (Does not include direct attacks).' }
    ]
  },
  {
    id: 'odion',
    name: 'Odion',
    theme: 'Temple of Traps',
    skills: [
      { name: '(Trap Monsters) Living Traps', text: 'Once per turn: Discard 1 card; add 1 "Embodiment of Apophis" from your deck or GY to your hand.', maxUses: 3 },
      { name: '(Temple of the Kings) Keeper of the Temple', text: 'Add "Temple of the Kings" from your Deck or Graveyard to your hand.', maxUses: 1 },
      { name: '(Anubis) Jackal\'s Calling', text: 'Discard 1 card; add 1 "Anubis" card from your Deck to your hand.', maxUses: 1 },
      { name: '(Continuous) Eternal Ruling', text: 'Add 1 Continuous Spell or Continuous Trap Card from your Graveyard to your hand.', maxUses: 2 },
      { name: '(Divine Punishment) Imitation of the Divine', text: 'Tribute 3 monsters; Deal damage to your opponent equal to the combined original ATK of the Tributed monsters. During the End Phase Lose 3000 LP', maxUses: 1 },
    ],
    comebacks: [
      { name: '(Trap Monsters) Wall of Living Stone', text: 'Requirement: Your opponent declares an attack while you control no monsters. Special Summon up to 2 Trap Monster cards from your GY in Defense Position.' },
      { name: '(Temple of the Kings) Serket Awakens', text: 'Requirement: You have 2000 or less LP, and you control "Temple of the Kings". Special Summon "Mystical Beast of Serket" from your hand, Deck or Graveyard. It cannot be destroyed by battle this turn. During the End Phase, destroy "Mystical Beast of Serket".' },
      { name: '(Anubis) Scales of Judgment', text: 'Requirement: Your opponent activates an effect (Either Monster, Spell or Trap) that would destroy 1 or more of your cards. Negate and destroy it.' },
      { name: '(Continuous) Unbreakable Laws', text: 'Requirement: Your opponent activates a card or effect that would destroy 2 or more Continuous Spell/Trap Cards you control. Negate it. Your Continuous Spell/Trap Cards cannot be destroyed until the end of your next turn.' },
      { name: '(Divine Punishment) Wrath of the Heavens', text: 'Requirement: Your opponent declares an attack that would reduce your LP to 0. Destroy all monsters on the field, then halve your LP.' },
    ],
    quests: [
      { name: '(Trap Monsters) Army of the Ancients', text: 'Quest: Special Summon 3 Trap Monsters during the duel. Reward: Your Trap Monsters gain 500 ATK and DEF and cannot be targeted by your opponent\'s monster effects.' },
      { name: '(Temple of the Kings) The Scorpion\'s Feast', text: 'Quest: Have "Mystical Beast of Serket" destroy 2 monsters by battle. Reward: "Mystical Beast of Serket" is no longer shuffled into the Deck when you do not control "Temple of the Kings", and cannot be targeted by Spell Cards.' },
      { name: '(Anubis) Weighing of the Heart', text: 'Quest: Activate 3 "Anubis" cards during the duel. Reward: Your opponent cannot activate the effects of cards in their Graveyard.' },
      { name: '(Continuous) Fortress of Decrees', text: 'Quest: Control 3 face-up Continuous Spell/Trap Cards at the same time. Reward: Monsters you control gain 200 ATK for each face-up Continuous Spell/Trap Card you control.' },
      { name: '(Divine Punishment) Struck by Lightning', text: 'Quest: Have 1000 or less LP. Reward: During your Standby Phase your opponent loses 500 LP.' },
    ]
  },
  {
    id: 'ishizu',
    name: 'Ishizu Ishtar',
    theme: 'Gravekeeper\'s Prophecy',
    skills: [
      { name: '(Future) Millennium Necklace', text: 'Look at the top 3 cards of the opponent\'s deck. Rearrange them however you like.', maxUses: 1 },
      { name: '(Gravekeepers) Gravekeeper\'s Call', text: 'Add "Necrovalley" or a "Gravekeeper\'s" card from your deck to your hand.', maxUses: 1 },
      { name: '(Reversal) Twist of Fate', text: 'If the opponent gains LP, you gain the same amount.', maxUses: 1 }
    ],
    comebacks: [
      { name: '(Future) Foreseen Doom', text: 'Requirement: The opponent declares an attack that will win the game. Cancel the attack. Then swap your hand with the top 5 cards of your deck.' },
      { name: '(Gravekeepers) Pharaoh\'s Curse', text: 'Requirement: You have 0 LP. (Activates as a Death-save). You survive with 100 LP, and the opponent\'s entire Graveyard is banished.' },
      { name: '(Reversal) Exchange of the Spirit', text: 'Requirement: Both players have at least 10 cards in their Graveyard, and you are behind on LP. Both players swap their deck with their Graveyard (shuffled).' }
    ],
    quests: [
      { name: '(Future) The Seer', text: 'Quest: Accurately predict which card the opponent will draw in their next Draw Phase (announce it during your turn). Reward: The opponent must play with their hand revealed.' },
      { name: '(Gravekeepers) Guardian of the Valley', text: 'Quest: Have "Necrovalley" and at least one Gravekeeper on the field. Reward: Cards in the Graveyards cannot be affected or moved by the opponent at all.' },
      { name: '(Reversal) Karma', text: 'Quest: Lose at least 2000 LP via card effects. Reward: All effect damage you take is reflected back to the opponent\'s LP.' }
    ]
  },
  {
    id: 'marik-1',
    name: 'Marik Ishtar',
    theme: 'Sadistic Slimes',
    skills: [
      { name: '(Torture) Shadow Game', text: 'The opponent takes 500 damage for each card they have in their hand.', maxUses: 1 },
      { name: '(Slime) Immortal Mass', text: 'Create one "Slime Token" (Aqua/WATER/Level 1/ATK 500/DEF 500) in Defense Position.', maxUses: 1 },
      { name: '(Mind Control) Brainwash', text: 'Take control of a Level 4 or lower monster from the opponent until the End Phase.', maxUses: 1 }
    ],
    comebacks: [
      { name: '(Torture) Hidden Pain', text: 'Requirement: You take battle damage. The opponent takes twice the amount of damage you just took.' },
      { name: '(Slime) Reconstruction', text: 'Requirement: The opponent destroys your strongest monster. Special Summon "Revival Jam" (or a Slime-monster) and draw 2 cards.' },
      { name: '(Ra) Wrath of the Sun God', text: 'Requirement: You are under 1000 LP. Pay all your LP except 1. Destroy the opponent\'s entire field, and the opponent takes 1000 damage for each destroyed card.' }
    ],
    quests: [
      { name: '(Torture) Master of Pain', text: 'Quest: Inflict effect damage to the opponent 3 times in one turn. Reward: The opponent loses 500 LP in their Standby Phase.' },
      { name: '(Slime) The Impenetrable Wall', text: 'Quest: Have a Slime-Token or Revival Jam survive 3 battles. Reward: Your monsters cannot be destroyed in battle.' },
      { name: '(Ra) Divine Sacrifice', text: 'Quest: Tribute 3 monsters for one Tribute Summon. Reward: The monster you summoned is unaffected by Spells and Traps.' }
    ]
  },
  {
    id: 'marik-2',
    name: 'Marik Ishtar',
    theme: 'Wrath of the Sun God',
    skills: [
      { name: '(Torture) Shadow Game', text: 'The opponent takes 500 damage for each card they have in their hand.', maxUses: 1 },
      { name: '(Slime) Immortal Mass', text: 'Create one "Slime Token" (Aqua/WATER/Level 1/ATK 500/DEF 500) in Defense Position.', maxUses: 1 },
      { name: '(Mind Control) Brainwash', text: 'Take control of a Level 4 or lower monster from the opponent until the End Phase.', maxUses: 1 }
    ],
    comebacks: [
      { name: '(Torture) Hidden Pain', text: 'Requirement: You take battle damage. The opponent takes twice the amount of damage you just took.' },
      { name: '(Slime) Reconstruction', text: 'Requirement: The opponent destroys your strongest monster. Special Summon "Revival Jam" (or a Slime-monster) and draw 2 cards.' },
      { name: '(Ra) Wrath of the Sun God', text: 'Requirement: You are under 1000 LP. Pay all your LP except 1. Destroy the opponent\'s entire field, and the opponent takes 1000 damage for each destroyed card.' }
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
    theme: 'Insect Plague',
    skills: [
      { name: '(Insects) The Swarm', text: 'Special Summon a Level 3 or lower Insect-monster from your hand.', maxUses: 1 },
      { name: '(Parasite) Infection', text: 'Shuffle "Parasite Paracide" (or another Insect) from your deck into the opponent\'s deck.', maxUses: 1 },
      { name: '(Evolution) Pupation', text: 'Swap an Insect-monster on the field with an Insect-monster from your deck that is 1 Level higher.', maxUses: 1 }
    ],
    comebacks: [
      { name: '(Insects) Pest Invasion', text: 'Requirement: You receive a direct attack. The opponent takes 300 damage for each Insect-monster in your Graveyard. The attack does not stop, but the damage might kill the opponent first.' },
      { name: '(Parasite) Disease Outbreak', text: 'Requirement: The opponent Normal Summons a Boss-monster. Equip the monster with an Insect from your hand. The monster loses 1000 ATK and cannot attack.' },
      { name: '(Evolution) Perfect Moth Awakening', text: 'Requirement: You have under 1500 LP and an empty field. Special Summon your strongest Insect-monster directly from your deck (ignores "Petit Moth" rules).' }
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
    theme: 'Heavy Metal Raiders',
    skills: [
      { name: '(Cheating) Card up the Sleeve', text: 'Swap a card in your hand with the bottom card of your deck.', maxUses: 1 },
      { name: '(Machines) Heavy Arsenal', text: 'A Machine-monster gains +700 ATK this turn, but cannot attack directly.', maxUses: 1 },
      { name: '(Gambling) Russian Roulette', text: 'Target a card on the opponent\'s field. Roll a die. 1-4: Destroy the card. 5-6: You take 1000 damage.', maxUses: 1 }
    ],
    comebacks: [
      { name: '(Cheating) Ambush Steal', text: 'Requirement: The opponent activates a crucial Spell/Trap Card. Cancel the activation and take the card into your own hand.' },
      { name: '(Machines) Slot Machine Emergency Spin', text: 'Requirement: You take a direct attack. Special Summon 3 "Coin Tokens" in Defense Position. If they are destroyed, you draw one card per token.' },
      { name: '(Gambling) All or Nothing', text: 'Requirement: You have 0 cards in your hand. Draw 3 cards. If you do not win this turn, you automatically lose in the End Phase.' }
    ],
    quests: [
      { name: '(Cheating) Bandit King', text: 'Quest: Take control of one of the opponent\'s monsters. Reward: You may look at the top card of the opponent\'s deck at any time.' },
      { name: '(Machines) Arms Race', text: 'Quest: Equip a Machine-monster with 2 Equip Cards. Reward: Your Machines inflict piercing damage and cannot be targeted.' },
      { name: '(Gambling) Blessing in Disguise', text: 'Quest: Lose LP from your own card effects 3 times. Reward: Every time the opponent draws a card outside their Draw Phase, they take 800 damage.' }
    ]
  }
];
