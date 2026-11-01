// Shadow Game events for Solo mode: a scene, a few choices and a result.
// Gambles use PHYSICAL dice and coins: you roll, then tap the result and the
// choice's table maps it to an outcome (the app never simulates a roll). The
// Millennium Key shows which outcomes are possible, never which one you get.
// Each event happens at most once per run; regional events only in their own region.
//
// A gamble choice has `roll` ({ dice: 'coin' | 'd6', pick?, versus?, bonus? }) and a
// `table` of { on, outcome }. `on` lists what it answers to: 'heads'/'tails', the
// faces 1-6, 'hit'/'miss' (you named `pick` numbers first) or 'win'/'lose' (you
// roll against `versus`; ties are rolled again).
//
// Outcome effects: cost (LP lost), heal, maxLp, chips (±), relic, loseRelic,
// mod (see SOLO_EVENT_MODS), shortcut, fortune, ambush (a duelist spec),
// video (the Toon Pegasus will open with).
const SOLO_FALLBACK_EVENT = 'spring';

const soloRelicName = id => `<span class="ce-emoji">${SOLO_RELICS[id].icon}</span> ${SOLO_RELICS[id].name}`;
const soloOneRelic = rarity => rollSoloRelics(rarity, 1)[0] || null;
const soloTradeable = () => solo.relics.filter(id => SOLO_RELICS[id].rarity !== 'millennium');
const soloOutcome = (tone, text, effects = {}) => ({ tone, text, effects });

// What an outcome does, in short ("−1000 LP · +1 ⭐").
function soloEffectText(e = {}) {
  const parts = [];
  if (e.loseRelic) parts.push(`lose ${soloRelicName(e.loseRelic)}`);
  if (e.cost) parts.push(`−${e.cost} LP`);
  if (e.heal) parts.push(`+${e.heal} LP`);
  if (e.maxLp) parts.push(`+${e.maxLp} max LP`);
  if (e.chips) parts.push(`${e.chips > 0 ? '+' : '−'}${Math.abs(e.chips)} ⭐`);
  if (e.relic) parts.push(soloRelicName(e.relic));
  if (e.mod) parts.push(SOLO_EVENT_MODS[e.mod].text);
  if (e.shortcut) parts.push('skip the next floor');
  if (e.fortune) parts.push('see the Shadow Games ahead');
  if (e.ambush) parts.push(`a duel against ${e.ambush.name} (${e.ambush.lp} LP)`);
  if (e.video) parts.push("see Pegasus' first Toon");
  return parts.join(' · ') || 'Nothing happens.';
}

// `sub` is what you see; leave it null to show the effects. Secret choices
// hide their outcome unless you hold the Millennium Key.
const soloChoice = (icon, label, sub, outcome, extra = {}) => ({
  icon, label, outcome, ...extra,
  sub: sub ?? soloEffectText(outcome.effects),
  reveal: soloEffectText(outcome.effects)
});
const soloLeave = (label, text) => soloChoice('🚶', label, 'Nothing happens.', soloOutcome('meh', text));

const soloOn = (on, outcome) => ({ on: [].concat(on), outcome });
const soloCoin = () => ({ dice: 'coin' });
const soloD6 = (extra = {}) => ({ dice: 'd6', ...extra });
// A relic outcome that falls back to other effects when no relic is left to give.
const soloGive = (id, fallback) => (id ? { relic: id } : fallback);
// The ante every outcome of a gamble costs (LP, or Star Chips on top of what it already does).
const soloAnte = (table, { cost = 0, chips = 0 }) => table.map(t => ({
  ...t,
  outcome: { ...t.outcome, effects: { ...t.outcome.effects, cost: (t.outcome.effects.cost || 0) + cost, chips: (t.outcome.effects.chips || 0) - chips } }
}));

// A gamble shows a teaser; the Key adds what could happen.
const soloGamble = (icon, label, teaser, roll, table, extra = {}) => ({
  icon, label, roll, table, secret: true, sub: teaser,
  reveal: [...new Set(table.map(t => soloEffectText(t.outcome.effects)))].join(' / '),
  ...extra
});

// The fortune effect needs Shadow Games still ahead of you.
const soloFortuneOr = (node, fallback) => (soloUnseenEventNodes(node).length ? { fortune: true } : fallback);

// Event nodes further up the road that nobody has foreseen yet.
const soloUnseenEventNodes = node => Object.values(solo.map.nodes)
  .filter(n => n.type === 'event' && n.floor > node.floor && !n.event && !solo.path.includes(n.id));

// Tristan's Shortcut lands two floors up.
const soloShortcutTargets = node => {
  const next = from => solo.map.edges.filter(([a]) => from.includes(a)).map(([, b]) => b);
  return next(next([node.id]));
};

const SOLO_EVENTS = {
  stranger: {
    name: 'The Hooded Stranger', icon: '🥷',
    build: () => ({
      text: '“A wager, duelist? One Star Chip… or a piece of your soul.”',
      choices: [
        soloGamble('🎲', 'Accept the wager', 'A coin spins in the shadows. One side shines, the other bites.', soloCoin(), [
          soloOn('heads', soloOutcome('good', 'The stranger bows and hands you a Star Chip.', { chips: 1 })),
          soloOn('tails', soloOutcome('bad', 'Shadows lash out from under the hood!', { cost: 1000 }))
        ]),
        soloLeave('Refuse', 'You walk past. A soft laugh follows you.')
      ]
    })
  },
  shadi: {
    name: "Shadi's Test", icon: '⚖️',
    when: () => !solo.millennium,
    build: () => {
      const gift = soloOneRelic('common');
      const item = soloOneRelic('millennium');
      return {
        text: 'Shadi appears out of thin air. “Your soul will be weighed, duelist. Choose.”',
        choices: [
          soloChoice('💧', 'The water of the Nile', null, soloOutcome('good', 'The water is cool and clear.', { heal: 1000 })),
          soloChoice('🎁', 'The gift of the tomb', 'A common relic', soloOutcome('good', 'Shadi nods slowly.', { relic: gift }), { secret: true, disabled: !gift, reason: 'The tomb is empty' }),
          soloChoice('✨', 'The Millennium Item', '−2000 LP: a Millennium Item', soloOutcome('meh', '“The Item has chosen you… and taken its price.”', { relic: item, cost: 2000 }), { secret: true, disabled: !item, reason: 'No Item answers you' }),
          soloGamble('⚖️', 'Let the scales decide', 'The scales tremble. Shadi smiles. “Let fate weigh your soul.”', soloD6(), [
            soloOn([1, 2], soloOutcome('meh', 'The scales tip back and forth… and settle on nothing.')),
            soloOn([3, 4], soloOutcome('good', 'The scales drop a gift into your hands.', soloGive(gift, { heal: 1000 }))),
            soloOn(5, soloOutcome('good', 'The scales pour you a cup of Nile water.', { heal: 1000 })),
            soloOn(6, soloOutcome('good', 'The scales glow gold. The Item is yours, free of charge!', soloGive(item, { maxLp: 500 })))
          ])
        ]
      };
    }
  },
  hunter: {
    name: "The Rare Hunter's Offer", icon: '🦹',
    build: () => {
      const wants = soloPick(soloTradeable());
      const sells = soloOneRelic('rare');
      return {
        text: '“I collect rare cards, duelist. Let\'s make a deal.”',
        choices: [
          soloChoice(wants ? `<span class="ce-emoji">${SOLO_RELICS[wants].icon}</span>` : '🤝', wants ? `Trade your ${SOLO_RELICS[wants].name}` : 'Trade a relic', null,
            soloOutcome('meh', 'He snatches it and tosses you two Star Chips.', wants ? { loseRelic: wants, chips: 2 } : {}), { disabled: !wants, reason: 'You have nothing he wants' }),
          soloChoice(sells ? `<span class="ce-emoji">${SOLO_RELICS[sells].icon}</span>` : '💰', sells ? `Buy his ${SOLO_RELICS[sells].name}` : 'Buy a card', sells ? `−1 ⭐ · ${SOLO_RELICS[sells].text}` : '',
            soloOutcome('good', '“A pleasure doing business.”', { chips: -1, relic: sells }), { disabled: !sells || solo.chips < 1, reason: sells ? 'You need 1 ⭐' : 'He has nothing left to sell' }),
          soloGamble('🃏', 'Haggle', 'You lean in. “How about a better deal?” He narrows his eyes behind the mask.', soloCoin(), [
            soloOn('heads', soloOutcome('good', 'He grins. “You drive a hard bargain.” The card is yours for free.', { relic: sells })),
            soloOn('tails', soloOutcome('bad', '“Insulting.” He pockets a Star Chip for his trouble.', { chips: -1 }))
          ], { disabled: !sells || solo.chips < 1, reason: sells ? 'You need 1 ⭐' : 'He has nothing left to sell' }),
          soloLeave('Refuse', '“Your loss, duelist.”')
        ]
      };
    }
  },
  hustler: {
    name: 'The Star Chip Hustler', icon: '🪙',
    build: () => ({
      text: 'A hustler flips a Star Chip. “Double or nothing, pal. Heads you win.”',
      choices: [
        soloGamble('🪙', 'Bet 1 Star Chip', 'The chip glints as it flips. “Call it in the air, pal!”', soloCoin(), [
          soloOn('heads', soloOutcome('good', 'Heads! He grumbles and pays up.', { chips: 2 })),
          soloOn('tails', soloOutcome('bad', 'Tails. He pockets your chip with a grin.', { chips: -1 }))
        ], { disabled: solo.chips < 1, reason: 'You need 1 ⭐ to bet' }),
        soloLeave('Walk away', '“Chicken!”')
      ]
    })
  },
  spring: {
    name: 'The Hidden Spring', icon: '⛲',
    build: () => ({
      text: 'Hidden among the rocks, a clear spring bubbles up from the ground.',
      choices: [
        soloChoice('💧', 'Drink', null, soloOutcome('good', 'You feel refreshed.', { heal: 1000 })),
        soloGamble('🌫️', 'Drink from the deep pool', 'Beneath the spring, a darker pool shimmers. It hums to you.', soloCoin(), [
          soloOn('heads', soloOutcome('good', 'The water glows and fills you with warmth.', { heal: 2000 })),
          soloOn('tails', soloOutcome('bad', 'Brackish. Your stomach turns.', { cost: 500 }))
        ]),
        soloLeave('Move on', 'You leave the spring behind.')
      ]
    })
  },
  video: {
    name: "Pegasus's Video", icon: '📼',
    when: () => !solo.video,
    build: () => {
      const toon = soloPick(SOLO_PEGASUS.toons);
      return {
        text: 'A VCR crackles to life on a tree stump. “Hello, duelist! Care to see a little preview of our duel?”',
        choices: [
          soloChoice('📺', 'Watch it to the end', null, soloOutcome('meh', `The tape shows ${toon.icon} ${toon.name}… then Pegasus' Eye glows and your head spins.`, { cost: 500, video: toon.name })),
          soloGamble('⏩', 'Fast-forward the tape', 'You jab the button. The tape whirs. Something flickers on the screen…', soloD6(), [
            soloOn([1, 2, 3], soloOutcome('meh', 'Static. The tape chews itself up before you see a thing.')),
            soloOn([4, 5, 6], soloOutcome('good', `You catch ${toon.icon} ${toon.name} before the Eye can glow. Lucky!`, { video: toon.name }))
          ]),
          soloLeave('Smash the tape', '“How rude!” the tape squeals as it cracks.')
        ]
      };
    }
  },
  hats: {
    name: 'Magical Hats', icon: '🎩',
    build: () => {
      const rare = soloOneRelic('rare');
      const common = soloOneRelic('common');
      const prizes = shuffled([
        soloOutcome('good', 'A rare card!', rare ? { relic: rare } : { chips: 1 }),
        soloOutcome('good', 'A card!', common ? { relic: common } : { heal: 1000 }),
        soloOutcome('bad', 'A trap! The hat bites.', { cost: 1500 })
      ]);
      return {
        text: 'Three hats sit on a stump. A voice whispers: “One hides a rare card, one a card… and one a trap.”',
        choices: [
          ...['left', 'middle', 'right'].map((side, i) => soloChoice('🎩', `The ${side} hat`, 'A rare relic, a relic or −1500 LP', prizes[i], { secret: true })),
          soloGamble('🌀', 'Spin the hats', 'You spin the hats until even you lose track. Then you snatch one…', soloD6(), [
            soloOn([1, 2], soloOutcome('bad', 'A trap! The hat bites.', { cost: 1500 })),
            soloOn([3, 4], soloOutcome('good', 'A card!', soloGive(common, { heal: 1000 }))),
            soloOn([5, 6], soloOutcome('good', 'A rare card!', soloGive(rare, { chips: 1 })))
          ]),
          soloLeave("Don't touch them", 'You leave the hats alone.')
        ]
      };
    }
  },
  mokuba: {
    name: 'Mokuba in Trouble', icon: '👦',
    build: () => {
      const reward = soloOneRelic('rare');
      return {
        text: 'Thugs have cornered Mokuba. “Help! My big brother will pay you back!”',
        choices: [
          soloChoice('🛡️', 'Pay the thugs off', '−1 ⭐ · Kaiba pays you back', soloOutcome('good', 'Kaiba sends a card with a curt note: “We\'re even.”', reward ? { chips: -1, relic: reward } : { chips: -1, heal: 2000 }), { secret: true, disabled: solo.chips < 1, reason: 'You need 1 ⭐' }),
          soloGamble('🏃', 'Chase the thugs off', 'You roll up your sleeves. Mokuba pleads. The thugs crack their knuckles…', soloD6(), [
            soloOn([1, 2], soloOutcome('bad', 'The thugs flatten you before Mokuba slips away.', { cost: 1000 })),
            soloOn([3, 4], soloOutcome('good', 'The thugs flee. Mokuba presses a Star Chip into your hand.', { chips: 1 })),
            soloOn([5, 6], soloOutcome('good', 'You send them packing! Kaiba hears of it and sends a card.', soloGive(reward, { chips: 2 })))
          ]),
          soloLeave('Look away', "You walk on. You'll feel bad about this later.")
        ]
      };
    }
  },
  case: {
    name: "The Lost Duelist's Case", icon: '💼',
    build: node => {
      const relic = soloOneRelic('common');
      const owner = { name: soloName(node.region), icon: '😠', lp: 1500 };
      return {
        text: "A Duelist's Case lies in the grass. Its owner can't be far away…",
        choices: [
          soloChoice('🔓', 'Open it', 'A relic, but the owner comes back for it', soloOutcome('meh', '“Hey! That\'s mine!” The owner wants a duel.', { relic, ambush: owner }), { secret: true }),
          soloChoice('🙋', 'Hand it in', null, soloOutcome('good', 'The grateful owner gives you a Star Chip.', { chips: 1 })),
          soloGamble('🎰', 'Crack the lock', 'A tiny padlock, a steady hand… and footsteps in the distance.', soloCoin(), [
            soloOn('heads', soloOutcome('good', 'Click! You slip away with the card before anyone notices.', soloGive(relic, { chips: 1 }))),
            soloOn('tails', soloOutcome('bad', '“Thief!” The owner is back, and furious.', { ambush: { ...owner, lp: owner.lp + 500 } }))
          ])
        ]
      };
    }
  },
  fortune: {
    name: 'The Fortune Teller', icon: '🔮',
    when: node => soloUnseenEventNodes(node).length > 0,
    build: () => ({
      text: '“Cross my palm with life force, dearie, and I\'ll show you the road ahead.”',
      choices: [
        soloChoice('🔮', 'Pay 500 LP', '−500 LP · See every Shadow Game further up the road', soloOutcome('good', 'The crystal ball clouds over, then clears…', { cost: 500, fortune: true })),
        soloGamble('🃏', 'Draw her tarot card', 'She fans out a deck. “Let the cards choose for you, dearie…”', soloD6(), [
          soloOn([1, 2], soloOutcome('bad', 'The Tower! She cackles as the lights flicker and your life force drains.', { cost: 500 })),
          soloOn([3, 4], soloOutcome('good', 'The Star! The crystal ball clears, no charge.', { fortune: true })),
          soloOn([5, 6], soloOutcome('good', 'The Wheel of Fortune! She shows you the road, and slips you a Star Chip.', { fortune: true, chips: 1 }))
        ]),
        soloLeave('No thanks', '“The cards will wait for you…”')
      ]
    })
  },
  lunch: {
    name: "Joey's Lunch", icon: '🍙',
    build: () => ({
      text: 'Joey waves a huge lunch box at you. “Eat up! Ya can\'t duel on an empty stomach!”',
      choices: [
        soloChoice('🍙', 'Take a bite', null, soloOutcome('good', 'Not bad at all!', { heal: 1000 })),
        soloChoice('🍱', 'Eat it all', null, soloOutcome('meh', 'Delicious… ugh. Maybe too delicious.', { heal: 2000, mod: 'lunch' })),
        soloGamble('🍟', 'Fight Joey for his fries', 'Joey clutches the fries. “Over my dead body!” His eyes narrow.', soloCoin(), [
          soloOn('heads', soloOutcome('good', 'You snatch the fries! Joey sulks, but they taste amazing.', { heal: 2000 })),
          soloOn('tails', soloOutcome('bad', 'Joey bonks you on the head with the lunch box.', { cost: 500 }))
        ])
      ]
    })
  },
  rift: {
    name: 'The Shadow Realm Rift', icon: '🌀', weight: 0.4,
    when: () => !solo.millennium && soloTradeable().length > 0,
    build: () => {
      const lose = soloPick(soloTradeable());
      const item = soloOneRelic('millennium');
      return {
        text: 'A tear in the air leaks purple mist. Something ancient glows inside…',
        choices: [
          soloChoice('✋', 'Reach in', `Lose your ${SOLO_RELICS[lose].name} for a Millennium Item`, soloOutcome('meh', 'The mist takes its price, and leaves something golden in your hand.', { loseRelic: lose, relic: item }), { secret: true }),
          soloChoice('🔒', 'Seal it', null, soloOutcome('good', 'The rift snaps shut. You feel stronger.', { maxLp: 500 })),
          soloGamble('🌀', 'Dive in', 'You step to the edge. The mist whispers your name. Something whispers back…', soloD6(), [
            soloOn([1, 2], soloOutcome('bad', 'The mist drags something from your pack and gives nothing back.', { loseRelic: lose })),
            soloOn([3, 4, 5], soloOutcome('good', 'The mist parts and a golden glow settles in your hand.', soloGive(item, { maxLp: 500 }))),
            soloOn(6, soloOutcome('good', 'The rift roars, then bows. A golden Item and a rush of power!', { ...soloGive(item, {}), maxLp: 500 }))
          ])
        ]
      };
    }
  },
  stump: {
    name: 'A Star Chip on a Stump', icon: '🪵', region: 'forest',
    build: () => ({
      text: 'A Star Chip sits on a tree stump in a quiet clearing. It looks… far too easy.',
      choices: [
        soloChoice('⭐', 'Take it', null, soloOutcome('meh', 'A buzzing rises behind you. Heh heh heh…', { chips: 1, mod: 'insect' })),
        soloGamble('🪤', 'Check for traps first', 'You crouch and study the stump. Something rustles in the leaves…', soloD6(), [
          soloOn([1, 2], soloOutcome('meh', 'A buzzing rises behind you anyway. Heh heh heh…', { chips: 1, mod: 'insect' })),
          soloOn([3, 4, 5, 6], soloOutcome('good', 'Clean! You pocket the Star Chip and tiptoe away.', { chips: 1 }))
        ]),
        soloLeave('Leave it', 'Better safe than sorry.')
      ]
    })
  },
  swarm: {
    name: 'The Kuriboh Swarm', icon: '🧸', region: 'forest',
    build: () => ({
      text: 'Dozens of Kuriboh tumble out of the bushes. Kuri kuri! They look hungry.',
      choices: [
        soloChoice('🍪', 'Feed them', null, soloOutcome('good', 'They follow you, cooing happily.', { cost: 500, mod: 'swarm' })),
        soloGamble('🧸', 'Join the swarm', 'You flop into the fluffy pile. Kuri kuri kuri!', soloD6(), [
          soloOn([1, 2], soloOutcome('bad', 'They nibble your pockets empty and your ankles too.', { cost: 500 })),
          soloOn([3, 4, 5], soloOutcome('good', 'They adopt you. A swarm will cover for you.', { mod: 'swarm' })),
          soloOn(6, soloOutcome('good', 'They adore you! A swarm follows you, and they leave you a snack.', { mod: 'swarm', heal: 500 }))
        ]),
        soloLeave('Shoo them away', 'Kuri… They scatter.')
      ]
    })
  },
  friends: {
    name: "Friends' Campfire", icon: '🏕️', region: 'meadow',
    build: () => ({
      text: 'Yugi, Joey, Téa and Tristan sit around a campfire. “Hey! Come join us!”',
      choices: [
        soloChoice('🔥', 'Rest with them', null, soloOutcome('good', 'Téa gives a speech about friendship. You feel better.', { heal: 1500 })),
        soloChoice('💪', "Listen to Joey's pep talk", null, soloOutcome('good', '“You got the heart of a true duelist!”', { mod: 'pep' })),
        soloGamble('🃏', 'Challenge Joey to a duel', 'Joey cracks his knuckles. “Yer on! Winner takes the chip!”', soloCoin(), [
          soloOn('heads', soloOutcome('good', 'You win! Joey grins and tosses you a Star Chip and a pep talk.', { chips: 1, mod: 'pep' })),
          soloOn('tails', soloOutcome('bad', '“Ha! Better luck next time!” Joey wins and you lose some pride.', { cost: 500 }))
        ])
      ]
    })
  },
  shortcut: {
    name: "Tristan's Shortcut", icon: '🏍️', region: 'meadow',
    when: node => soloShortcutTargets(node).length > 0,
    build: () => ({
      text: 'Tristan knows a shortcut over the cliffs. “Trust me, it\'s totally safe!” It is not.',
      choices: [
        soloChoice('🧗', 'Take the shortcut', null, soloOutcome('meh', 'You scrape your knees, but you skip ahead.', { cost: 1000, shortcut: true })),
        soloGamble('🏍️', "Ride Tristan's bike", 'Tristan tosses you the keys. “What could go wrong?” Everything. Probably.', soloD6(), [
          soloOn([1, 2], soloOutcome('bad', 'You crash into a bush. The bike is fine. You are not.', { cost: 1500 })),
          soloOn([3, 4, 5], soloOutcome('good', 'Vroom! You skip ahead without a scratch.', { shortcut: true })),
          soloOn(6, soloOutcome('good', 'Perfect landing! You skip ahead and find a Star Chip in the grass.', { shortcut: true, chips: 1 }))
        ]),
        soloLeave('Stay on the path', '“Suit yourself!”')
      ]
    })
  },
  nest: {
    name: "The Dragon's Nest", icon: '🐉', region: 'mountain',
    when: () => rollSoloRelics('rare', 1).length > 0,
    build: () => {
      const relic = soloOneRelic('rare');
      return {
        text: 'A dragon sleeps on a pile of glittering cards. Its tail twitches.',
        choices: [
          soloChoice('🤫', 'Sneak in', '−1000 LP · A rare relic', soloOutcome('meh', 'It wakes just as you grab a card! You escape, singed.', { relic, cost: 1000 }), { secret: true }),
          soloGamble('🐉', 'Wake the dragon', 'You clear your throat. One golden eye cracks open…', soloCoin(), [
            soloOn('heads', soloOutcome('good', 'The dragon bows its great head and offers you a card from its hoard.', soloGive(relic, { chips: 2 }))),
            soloOn('tails', soloOutcome('bad', 'The dragon roars and a tamer leaps from its back!', { ambush: { name: 'The Dragon Tamer', icon: '🐲', lp: 2000, chips: 1, only: 'Dragon' } }))
          ]),
          soloLeave('Let it sleep', 'You tiptoe away.')
        ]
      };
    }
  },
  storm: {
    name: 'The Thunderstorm', icon: '⛈️', region: 'mountain',
    build: () => ({
      text: 'Lightning cracks over the peaks. The path ahead is soaked.',
      choices: [
        soloChoice('🕳️', 'Wait in a cave', null, soloOutcome('meh', 'You shiver through the night.', { cost: 500 })),
        soloChoice('⚡', 'Push through the storm', null, soloOutcome('good', 'You find a Star Chip in the mud, but the storm follows you.', { chips: 1, mod: 'storm' })),
        soloGamble('🌩️', 'Climb the peak', 'Thunder rolls. The summit glows with static. Is that a Star Chip up there?', soloD6(), [
          soloOn([1, 2], soloOutcome('bad', 'A bolt strikes right behind you! Your hair stands on end.', { cost: 1500 })),
          soloOn([3, 4, 5], soloOutcome('good', 'You reach the top and find a Star Chip, sizzling.', { chips: 1 })),
          soloOn(6, soloOutcome('good', 'The lightning charges you instead of hurting you! And there is a Star Chip.', { chips: 1, maxLp: 500 }))
        ])
      ]
    })
  },
  grave: {
    name: 'The Open Grave', icon: '⚰️', region: 'wasteland',
    build: () => {
      const relic = soloOneRelic('common');
      const zombie = { name: 'The Gravekeeper', icon: '🧟', lp: 1000, chips: 1, only: 'Zombie' };
      return {
        text: 'A fresh grave. Something glints in the dirt…',
        choices: [
          soloGamble('⛏️', 'Dig', 'The soil is loose. Something glints below… or something stirs.', soloCoin(), [
            soloOn('heads', soloOutcome('good', 'You dig up a card!', soloGive(relic, { chips: 1 }))),
            soloOn('tails', soloOutcome('bad', 'A hand bursts out of the dirt!', { ambush: zombie }))
          ]),
          soloLeave('Leave the dead alone', 'Wise.')
        ]
      };
    }
  },
  bet: {
    name: "Bonz's Bet", icon: '💀', region: 'wasteland',
    build: () => ({
      text: 'A rattling voice from behind a tombstone: “Bet you can\'t guess which hand the bone is in!”',
      choices: [
        soloGamble('✊', 'Take the bet', 'Two bony fists rise from behind the tombstone. “Pick a hand, pick a hand…”', soloCoin(), [
          soloOn('heads', soloOutcome('good', 'The right hand! The voice curses.', { chips: 2 })),
          soloOn('tails', soloOutcome('bad', 'Wrong! Bony fingers drain your life.', { cost: 1000 }))
        ]),
        soloLeave('Refuse', '“Coward…”')
      ]
    })
  },
  toll: {
    name: "The Rare Hunters' Toll", icon: '🚧',
    build: () => ({
      text: 'Hooded figures block the road. “Nobody passes for free, duelist. Pay up… one way or another.”',
      choices: [
        soloChoice('⭐', 'Pay with a Star Chip', '−1 ⭐', soloOutcome('bad', 'They snatch the chip and wave you through.', { chips: -1 }), { disabled: solo.chips < 1, reason: 'You have no ⭐ to pay with' }),
        soloChoice('🥊', 'Pay with your life force', '−1000 LP', soloOutcome('bad', 'They rough you up, then let you pass. “Toll paid.”', { cost: 1000 }))
      ]
    })
  },
  dice: {
    name: "Joey's Lucky Dice", icon: '🎲',
    build: () => {
      const gift = soloOneRelic('common');
      const jackpot = soloOneRelic('rare');
      return {
        text: 'Joey rattles a die in his fist. “Luck of the dice, pal! Roll it and see what ya get!”',
        choices: [
          soloGamble('🎲', 'Roll the dice', 'Six faces, six fates. Joey grins: “One of them is a dragon!”', soloD6(), [
            soloOn(1, soloOutcome('bad', 'Snake eyes! The die rolls into a puddle and Joey\'s luck splashes onto you.', { cost: 1000 })),
            soloOn(2, soloOutcome('good', 'A Star Chip rolls out of Joey\'s pocket along with the die.', { chips: 1 })),
            soloOn(3, soloOutcome('good', 'Joey shares his lunch to celebrate.', { heal: 1500 })),
            soloOn(4, soloOutcome('good', 'Joey pulls a card from behind your ear.', soloGive(gift, { heal: 1000 }))),
            soloOn(5, soloOutcome('good', '“Ya got the heart of a duelist!” Joey pumps you up.', { mod: 'pep' })),
            soloOn(6, soloOutcome('good', 'Red-Eyes! Joey is stunned and hands over his best card.', soloGive(jackpot, { chips: 2 })))
          ]),
          soloGamble('🪙', "Bet on Joey's lucky streak", 'Joey flips a coin and winks. “Heads I win, tails ya lose!”', soloCoin(), [
            soloOn('heads', soloOutcome('good', 'Heads! Joey sulks and pays up.', { chips: 1 })),
            soloOn('tails', soloOutcome('bad', 'Tails! Joey laughs and slaps you on the back, hard.', { cost: 500 }))
          ]),
          soloLeave('Walk away', '“Aw, c\'mon! Ya just don\'t believe in luck!”')
        ]
      };
    }
  },
  duke: {
    name: "Duke's Dungeon Dice", icon: '🎰',
    build: () => {
      const duel = [
        soloOn('win', soloOutcome('good', 'Your die beats his! Duke slams the board.', { chips: 2 })),
        soloOn('lose', soloOutcome('bad', 'His die beats yours. Duke scoops up your Star Chip.', { chips: -1 }))
      ];
      const broke = { disabled: solo.chips < 1, reason: 'You need 1 ⭐ to play' };
      return {
        text: 'Duke Devlin sets up a game board and two dice. “Roll one against me, and let\'s see who gets lucky.”',
        choices: [
          soloGamble('🎲', 'Challenge Duke', 'Two dice, one winner. Roll yours, then roll his. Higher wins.', soloD6({ versus: 'Duke' }), duel, broke),
          soloGamble('🧪', 'Slip him a loaded die', 'You slide a suspicious die onto the board. It costs a little life force to calm your nerves.',
            soloD6({ versus: 'Duke', bonus: 1 }), soloAnte(duel, { cost: 500 }), broke),
          soloLeave('Decline', '“Scared? Maybe next time.”')
        ]
      };
    }
  },
  number: {
    name: "The Gambler's Number", icon: '🔢',
    build: () => {
      const jackpot = soloOneRelic('rare');
      return {
        text: 'A shady gambler holds up a die. “Name your number, friend. If it comes up… I pay.”',
        choices: [
          soloGamble('1️⃣', 'Name one number', 'Pick a number, hold your breath, roll. Fortune loves the bold.', soloD6({ pick: 1 }), [
            soloOn('hit', soloOutcome('good', 'Your number! The gambler turns pale and hands over his prize.', soloGive(jackpot, { chips: 2 }))),
            soloOn('miss', soloOutcome('bad', '“Not today, friend.” He takes his due.', { cost: 500 }))
          ]),
          soloGamble('2️⃣', 'Name two numbers', 'Hedge your bets. Two numbers. Better odds, smaller prize.', soloD6({ pick: 2 }), [
            soloOn('hit', soloOutcome('good', 'One of your numbers! He slides you a Star Chip.', { chips: 1 })),
            soloOn('miss', soloOutcome('bad', '“Neither!” He takes his due.', { cost: 500 }))
          ]),
          soloLeave('Decline', '“Pity. Fortune was in the air.”')
        ]
      };
    }
  },
  rigged: {
    name: "Bandit Keith's Coin", icon: '🪙', region: 'meadow',
    build: () => ({
      text: 'Bandit Keith spins a coin on his thumb. “Call it, kid. Totally fair. Would I lie to you?” He would.',
      choices: [
        soloGamble('🅷', 'Call heads', 'The coin gleams. Heads pays big. Keith smirks, which is never good.', soloCoin(), [
          soloOn('heads', soloOutcome('good', 'Heads! Keith scowls and tosses you two Star Chips.', { chips: 2 })),
          soloOn('tails', soloOutcome('bad', 'Tails. Keith pistol-whips you with his smile.', { cost: 1000 }))
        ]),
        soloGamble('🆃', 'Call tails', 'Safer, smaller. Keith raises an eyebrow. “Chicken.”', soloCoin(), [
          soloOn('tails', soloOutcome('good', 'Tails! Keith grumbles and hands over a Star Chip.', { chips: 1 })),
          soloOn('heads', soloOutcome('bad', 'Heads. Keith laughs and flicks you with the coin.', { cost: 500 }))
        ]),
        soloLeave('Walk away', '“Smart kid. Or scared. Hard to tell.”')
      ]
    })
  },
  bugrace: {
    name: "Weevil's Bug Race", icon: '🐛', region: 'forest',
    build: () => ({
      text: 'Weevil sets up a tiny racetrack of twigs. “Pick a bug, any bug. It\'ll lose, naturally.”',
      choices: [
        soloGamble('🐞', 'Back a bug', 'Six little racers. One chip says yours is the fastest.', soloD6(), [
          soloOn([1, 2], soloOutcome('bad', 'Your bug gets eaten by a bird. Weevil cackles and takes your chip.', { chips: -1 })),
          soloOn([3, 4], soloOutcome('meh', 'Your bug crosses the line last. Weevil sniffs and gives your chip back.')),
          soloOn([5, 6], soloOutcome('good', 'Your bug wins by a whisker! Weevil pays up, muttering.', { chips: 2 }))
        ], { disabled: solo.chips < 1, reason: 'You need 1 ⭐ to bet' }),
        soloGamble('🤏', 'Nudge a bug along', 'Nobody is looking. A tiny flick of the finger…', soloCoin(), [
          soloOn('heads', soloOutcome('good', 'Nobody saw! You collect a Star Chip from the winnings.', { chips: 1 })),
          soloOn('tails', soloOutcome('bad', 'Weevil saw. His bugs swarm you, and he remembers your face.', { cost: 500, mod: 'insect' }))
        ]),
        soloLeave('Walk on', '“Pity. I do love an audience.”')
      ]
    })
  },
  bottle: {
    name: 'A Message in a Bottle', icon: '🍾', region: 'beach',
    build: node => {
      const prize = soloOneRelic('common');
      return {
        text: 'A bottle bobs in the surf, a scrap of paper curled inside. The cork is stuck fast.',
        choices: [
          soloGamble('🍾', 'Open it', 'The cork pops. Whatever is inside has been waiting a long time.', soloD6(), [
            soloOn(1, soloOutcome('bad', 'A curse! Purple smoke billows out and stings your eyes.', { cost: 1000 })),
            soloOn([2, 3], soloOutcome('good', 'A treasure map! It marks Shadow Games on the road ahead.', soloFortuneOr(node, { chips: 1 }))),
            soloOn(4, soloOutcome('good', 'A Star Chip slides out with the paper.', { chips: 1 })),
            soloOn(5, soloOutcome('good', 'A bottled potion. It tastes like strawberries.', { heal: 1000 })),
            soloOn(6, soloOutcome('good', 'A card, sealed with wax!', soloGive(prize, { chips: 1 })))
          ]),
          soloLeave('Throw it back', 'The bottle bobs away. Somebody else can have it.')
        ]
      };
    }
  },
  fishing: {
    name: "Mako's Fishing Contest", icon: '🎣', region: 'beach',
    build: () => {
      const prize = soloOneRelic('rare');
      return {
        text: 'Mako Tsunami grins and holds out a spare fishing rod. “Think ya can out-fish the Ocean Master?”',
        choices: [
          soloGamble('🎣', 'Cast a line', 'The bobber dips. Is it a minnow or a monster?', soloD6(), [
            soloOn(1, soloOutcome('bad', 'You hook your own shirt and fall into the shallows.', { cost: 500 })),
            soloOn([2, 3], soloOutcome('good', 'A tasty fish! You grill it on the beach.', { heal: 500 })),
            soloOn([4, 5], soloOutcome('good', 'A fat catch! Mako pays you a Star Chip for it.', { chips: 1 })),
            soloOn(6, soloOutcome('good', 'A legendary catch! Mako falls over, and gives you his prize.', soloGive(prize, { chips: 2 })))
          ]),
          soloGamble('🌊', 'Cast into deep water', 'Far out, where the water is dark. Bigger fish. Bigger bite.', soloCoin(), [
            soloOn('heads', soloOutcome('good', 'A monster bite! Mako cheers and hands you two Star Chips.', { chips: 2 })),
            soloOn('tails', soloOutcome('bad', 'The line snaps and whips your face.', { cost: 500 }))
          ]),
          soloLeave('Leave', '“Landlubber!” Mako laughs.')
        ]
      };
    }
  },
  tide: {
    name: 'The Tide Pool', icon: '🌊', region: 'beach',
    build: () => ({
      text: 'A tide pool glitters between the rocks. Something shiny sits at the bottom.',
      choices: [
        soloGamble('🤲', 'Reach in', 'You roll up your sleeve. The water is cold. Something moves…', soloCoin(), [
          soloOn('heads', soloOutcome('good', 'You pull out a Star Chip!', { chips: 1 })),
          soloOn('tails', soloOutcome('bad', 'A crab clamps onto your finger!', { cost: 1000 }))
        ]),
        soloChoice('💦', 'Splash around', null, soloOutcome('good', 'You splash about like a kid. It helps.', { heal: 500 })),
        soloLeave('Walk on', 'You leave the pool to the crabs.')
      ]
    })
  },
  egg: {
    name: 'The Dragon Egg', icon: '🥚', region: 'mountain',
    build: () => {
      const prize = soloOneRelic('rare');
      return {
        text: 'A speckled egg, big as a boulder, sits in a nest of ash. It is warm. It trembles.',
        choices: [
          soloGamble('🔥', 'Incubate it', 'You curl around the egg for the night. Something knocks from inside.', soloD6(), [
            soloOn([1, 2], soloOutcome('meh', 'A dud. The egg cracks open and nothing hatches.')),
            soloOn([3, 4, 5], soloOutcome('good', 'A baby dragon hatches and breathes warm life into you.', { maxLp: 500 })),
            soloOn(6, soloOutcome('good', 'A dragon hatches and curls up at your feet, leaving a card.', soloGive(prize, { maxLp: 1000 })))
          ]),
          soloChoice('🔨', 'Smash it', null, soloOutcome('meh', 'Yolk everywhere. You find a Star Chip in the shell.', { chips: 1 })),
          soloLeave('Leave it', 'You tiptoe away.')
        ]
      };
    }
  },
  lottery: {
    name: 'The Skull Servant Lottery', icon: '🎟️', region: 'wasteland',
    build: () => {
      const prize = soloOneRelic('common');
      const zombie = { name: 'The Skull Servant', icon: '💀', lp: 1000, chips: 1, only: 'Zombie' };
      return {
        text: 'A Skull Servant rattles a bag of bones. “Draw a bone, mortal. Some of them are lucky.”',
        choices: [
          soloGamble('🦴', 'Draw a bone', 'Six bones in the bag. Five of them look friendly.', soloD6(), [
            soloOn([1, 2], soloOutcome('bad', 'The bone is hollow. And it screams.', { ambush: zombie })),
            soloOn([3, 4], soloOutcome('good', 'A Star Chip hides inside the bone!', { chips: 1 })),
            soloOn(5, soloOutcome('good', 'A card is rolled up inside the bone.', soloGive(prize, { chips: 1 }))),
            soloOn(6, soloOutcome('good', 'A golden bone! The Skull Servant bows low.', { chips: 2 }))
          ]),
          soloLeave('Refuse', 'The Skull Servant shrugs with a clatter.')
        ]
      };
    }
  },
  arm: {
    name: "Tristan's Arm Wrestle", icon: '💪', region: 'meadow',
    build: () => ({
      text: 'Tristan slams his elbow on a rock. “Arm wrestle! Loser buys lunch!”',
      choices: [
        soloGamble('💪', 'Arm wrestle Tristan', 'Elbows down. Roll for yourself, then roll for him. Higher roll wins.', soloD6({ versus: 'Tristan' }), [
          soloOn('win', soloOutcome('good', 'You slam his hand to the rock! Tristan is amazed, and pumped up for you.', { chips: 1, mod: 'pep' })),
          soloOn('lose', soloOutcome('bad', 'Tristan slams your hand to the rock. Ow.', { cost: 500 }))
        ]),
        soloChoice('📣', 'Cheer him on', null, soloOutcome('good', 'Tristan feels great and shares his snacks.', { heal: 500 }))
      ]
    })
  },
  well: {
    name: 'The Wishing Well', icon: '🪣',
    build: () => {
      const prize = soloOneRelic('rare');
      return {
        text: 'An old stone well stands alone on the road. A faded sign reads: “Toss a Star Chip, make a wish.”',
        choices: [
          soloGamble('🪙', 'Toss a Star Chip', 'The chip tumbles into the dark. A long pause. Then a splash… and a glow.', soloD6(), soloAnte([
            soloOn(1, soloOutcome('bad', 'The well coughs it back up with a shower of dark water.', { cost: 1000 })),
            soloOn([2, 3], soloOutcome('meh', 'Nothing happens. Your wish drifts away.')),
            soloOn(4, soloOutcome('good', 'A warm light washes over you.', { heal: 1500 })),
            soloOn(5, soloOutcome('good', 'Two Star Chips float up from the dark!', { chips: 2 })),
            soloOn(6, soloOutcome('good', 'The well glows gold and a card floats up!', soloGive(prize, { chips: 2 })))
          ], { chips: 1 }), { disabled: solo.chips < 1, reason: 'You need 1 ⭐' }),
          soloChoice('🥛', 'Drink from the well', null, soloOutcome('good', 'The water is cold and sweet.', { heal: 500 }))
        ]
      };
    }
  }
};

function soloEventOk(id, node) {
  const e = SOLO_EVENTS[id];
  return !!e && (!e.region || e.region === node.region) && (!e.when || e.when(node));
}

// Events already seen, or foreseen by the Fortune Teller for another node.
function soloPickEvent(node) {
  const taken = new Set([
    ...solo.seenEvents,
    ...Object.values(solo.map.nodes).filter(n => n.event && n.id !== node.id && !solo.path.includes(n.id)).map(n => n.event)
  ]);
  const ids = Object.keys(SOLO_EVENTS).filter(id => !taken.has(id) && soloEventOk(id, node));
  // The gamble floor only draws roll-heavy events (any event if those run out).
  const gambles = node.kind === 'gamble' ? ids.filter(id => SOLO_GAMBLE_EVENTS.includes(id)) : [];
  const pool = gambles.length ? gambles : ids;
  // Event-only floors favour the region's own Shadow Games.
  const weight = id => (SOLO_EVENTS[id].weight || 1) * (node.kind === 'events' && SOLO_EVENTS[id].region ? SOLO_REGIONAL_EVENT_BOOST : 1);
  return soloWeighted(Object.fromEntries(pool.map(id => [id, weight(id)]))) || SOLO_FALLBACK_EVENT;
}

function buildSoloEvent(node) {
  const id = node.event && soloEventOk(node.event, node) ? node.event : soloPickEvent(node);
  solo.seenEvents.push(id);
  const { text, choices } = SOLO_EVENTS[id].build(node);
  return { id, text, choices, picked: null, rolling: null, result: null, ambush: null };
}

// The Fortune Teller names the Shadow Games on the road ahead.
function soloTellFortune() {
  const here = solo.map.nodes[solo.node];
  const lines = soloUnseenEventNodes(here).sort((a, b) => a.floor - b.floor).map(n => {
    n.event = soloPickEvent(n);
    const e = SOLO_EVENTS[n.event];
    return `🔮 Floor ${n.floor}: <span class="ce-emoji">${e.icon}</span> ${e.name}`;
  });
  return lines.join('<br>');
}

function chooseSoloEvent(i) {
  const ev = solo.event;
  const c = ev?.choices[i];
  if (!c || c.disabled || ev.picked !== null || ev.rolling) return false;
  if (c.roll) {
    ev.rolling = { i, picks: [], locked: false, you: null, tie: false, at: Date.now() };
    return true;
  }
  ev.picked = i;
  applySoloOutcome(ev, c.outcome);
  return true;
}

// The result buttons appear right where you just tapped, so a quick double-tap
// must not count as a roll.
const SOLO_ROLL_TAP_GUARD_MS = 450;
const soloRollGuarded = st => Date.now() - (st.at || 0) < SOLO_ROLL_TAP_GUARD_MS;

// You say your number(s) before you roll (gambles with `pick`), then lock them in.
function pickSoloRollNumber(n) {
  const st = solo.event?.rolling;
  const roll = st && solo.event.choices[st.i].roll;
  if (!roll?.pick || st.locked) return false;
  if (st.picks.includes(n)) st.picks = st.picks.filter(p => p !== n);
  else if (st.picks.length < roll.pick) st.picks = [...st.picks, n];
  else return false;
  return true;
}

function lockSoloRollNumbers() {
  const st = solo.event?.rolling;
  const roll = st && solo.event.choices[st.i].roll;
  if (!roll?.pick || st.locked || st.picks.length !== roll.pick) return false;
  st.locked = true;
  st.at = Date.now();
  return true;
}

// Put the dice or coin away again (nothing happened yet).
function cancelSoloRoll() {
  if (!solo.event?.rolling || solo.event.result || soloRollGuarded(solo.event.rolling)) return false;
  solo.event.rolling = null;
  return true;
}

// The player taps what the physical coin or die showed: 'heads'/'tails' or 1-6.
// A versus roll takes two taps (yours, then theirs), and ties are rolled again.
function soloEventRoll(face) {
  const ev = solo.event;
  const st = ev?.rolling;
  const roll = st && ev.choices[st.i].roll;
  if (!roll || ev.result || soloRollGuarded(st)) return false;
  if (roll.pick && !st.locked) return false;
  let key = face;
  if (roll.pick) key = st.picks.includes(face) ? 'hit' : 'miss';
  if (roll.versus) {
    if (st.you === null) {
      st.you = face;
      st.tie = false;
      st.at = Date.now();
      return true;
    }
    const mine = st.you + (roll.bonus || 0);
    if (mine === face) {
      st.you = null;
      st.tie = true;
      st.at = Date.now();
      return true;
    }
    key = mine > face ? 'win' : 'lose';
  }
  const entry = ev.choices[st.i].table.find(t => t.on.includes(key));
  if (!entry) return false;
  ev.picked = st.i;
  ev.rolling = null;
  applySoloOutcome(ev, entry.outcome);
  return true;
}

function applySoloOutcome(ev, outcome) {
  const e = outcome.effects;
  const parts = [];
  if (e.loseRelic) {
    dropSoloRelic(e.loseRelic);
    parts.push(`${soloRelicName(e.loseRelic)} is gone.`);
  }
  if (e.chips) {
    solo.chips = Math.max(0, solo.chips + e.chips);
    parts.push(`⭐ ${e.chips > 0 ? '+' : '−'}${Math.abs(e.chips)} Star Chip${Math.abs(e.chips) === 1 ? '' : 's'}`);
  }
  if (e.relic) {
    gainSoloRelic(e.relic);
    parts.push(`You get the ${soloRelicName(e.relic)}!`);
  }
  if (e.heal) {
    const healed = healSoloPlayer(e.heal);
    parts.push(healed ? `💚 +${healed} LP` : '💚 Your LP is already full.');
  }
  if (e.maxLp) {
    solo.maxLp += e.maxLp;
    healSoloPlayer(e.maxLp);
    parts.push(`❤️ +${e.maxLp} max LP`);
  }
  if (e.mod) {
    solo.mods = { ...solo.mods, [e.mod]: true };
    parts.push(`<span class="ce-emoji">${SOLO_EVENT_MODS[e.mod].icon}</span> ${SOLO_EVENT_MODS[e.mod].text}`);
  }
  if (e.shortcut) {
    solo.shortcut = true;
    parts.push('🏍️ Your next step skips a floor.');
  }
  if (e.fortune) parts.push(soloTellFortune());
  if (e.ambush) ev.ambush = e.ambush;
  if (e.video) {
    solo.video = e.video;
    parts.push("📼 You know which Toon Pegasus opens with.");
  }
  // Costs come last: the Millennium Puzzle may still save you.
  if (e.cost) {
    hurtSoloPlayer(e.cost);
    parts.push(`💔 −${e.cost} LP`);
  }
  if (!Object.keys(e).length) playSound({ name: 'co-bounce' });
  ev.result = { tone: outcome.tone, text: [outcome.text, ...parts].join('<br>') };
  return true;
}

// Some Shadow Games end in a duel. Win it and you're back on the map.
function startSoloAmbush() {
  const ev = solo.event;
  const node = solo.map.nodes[solo.node];
  if (!ev?.ambush || !node || solo.phase !== 'node') return false;
  solo.fight = createSoloFight({ type: 'ambush', floor: node.floor, region: node.region, ambush: ev.ambush });
  solo.phase = 'fight';
  solo.node = null;
  solo.event = null;
  playSound({ name: 'co-start' });
  return true;
}
