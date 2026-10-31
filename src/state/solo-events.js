// Shadow Game events for Solo mode: a scene, a few choices and a result.
// Random outcomes are rolled when you arrive (and saved), so the Millennium Key
// can show them. Each event happens at most once per run; regional events only
// in their own region.
//
// Outcome effects: cost (LP lost), heal, maxLp, chips (±), relic, loseRelic,
// mod (see SOLO_EVENT_MODS), shortcut, fortune, ambush (a duelist spec).
const SOLO_FALLBACK_EVENT = 'spring';

const soloRelicName = id => `<span class="ce-emoji">${SOLO_RELICS[id].icon}</span> ${SOLO_RELICS[id].name}`;
const soloOneRelic = rarity => rollSoloRelics(rarity, 1)[0] || null;
const soloFlip = () => Math.random() < 0.5;
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
        soloChoice('🎲', 'Accept the wager', '50%: +1 ⭐ · 50%: −1000 LP', soloFlip()
          ? soloOutcome('good', 'The stranger bows and hands you a Star Chip.', { chips: 1 })
          : soloOutcome('bad', 'Shadows lash out from under the hood!', { cost: 1000 }), { secret: true }),
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
          soloChoice('✨', 'The Millennium Item', '−2000 LP: a Millennium Item', soloOutcome('meh', '“The Item has chosen you… and taken its price.”', { relic: item, cost: 2000 }), { secret: true, disabled: !item, reason: 'No Item answers you' })
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
        soloChoice('🪙', 'Bet 1 Star Chip', '50%: +2 ⭐ · 50%: −1 ⭐', soloFlip()
          ? soloOutcome('good', 'Heads! He grumbles and pays up.', { chips: 2 })
          : soloOutcome('bad', 'Tails. He pockets your chip with a grin.', { chips: -1 }), { secret: true, disabled: solo.chips < 1, reason: 'You need 1 ⭐ to bet' }),
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
        soloLeave('Move on', 'You leave the spring behind.')
      ]
    })
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
          soloChoice('🙋', 'Hand it in', null, soloOutcome('good', 'The grateful owner gives you a Star Chip.', { chips: 1 }))
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
        soloChoice('🍱', 'Eat it all', null, soloOutcome('meh', 'Delicious… ugh. Maybe too delicious.', { heal: 2000, mod: 'lunch' }))
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
          soloChoice('🔒', 'Seal it', null, soloOutcome('good', 'The rift snaps shut. You feel stronger.', { maxLp: 500 }))
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
        soloChoice('💪', "Listen to Joey's pep talk", null, soloOutcome('good', '“You got the heart of a true duelist!”', { mod: 'pep' }))
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
        soloChoice('⚡', 'Push through the storm', null, soloOutcome('good', 'You find a Star Chip in the mud, but the storm follows you.', { chips: 1, mod: 'storm' }))
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
          soloChoice('⛏️', 'Dig', '50%: a relic · 50%: a Zombie ambush (win for +1 ⭐)', relic && soloFlip()
            ? soloOutcome('good', 'You dig up a card!', { relic })
            : soloOutcome('bad', 'A hand bursts out of the dirt!', { ambush: zombie }), { secret: true }),
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
        soloChoice('✊', 'Take the bet', '50%: +2 ⭐ · 50%: −1000 LP', soloFlip()
          ? soloOutcome('good', 'The right hand! The voice curses.', { chips: 2 })
          : soloOutcome('bad', 'Wrong! Bony fingers drain your life.', { cost: 1000 }), { secret: true }),
        soloLeave('Refuse', '“Coward…”')
      ]
    })
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
  return soloWeighted(Object.fromEntries(ids.map(id => [id, SOLO_EVENTS[id].weight || 1]))) || SOLO_FALLBACK_EVENT;
}

function buildSoloEvent(node) {
  const id = node.event && soloEventOk(node.event, node) ? node.event : soloPickEvent(node);
  solo.seenEvents.push(id);
  const { text, choices } = SOLO_EVENTS[id].build(node);
  return { id, text, choices, picked: null, result: null, ambush: null };
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
  if (!c || c.disabled || ev.picked !== null) return false;
  ev.picked = i;
  const e = c.outcome.effects;
  const parts = [];
  if (e.loseRelic) {
    solo.relics = solo.relics.filter(r => r !== e.loseRelic);
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
  // Costs come last: the Millennium Puzzle may still save you.
  if (e.cost) {
    hurtSoloPlayer(e.cost);
    parts.push(`💔 −${e.cost} LP`);
  }
  if (!Object.keys(e).length) playSound({ name: 'co-bounce' });
  ev.result = { tone: c.outcome.tone, text: [c.outcome.text, ...parts].join('<br>') };
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
