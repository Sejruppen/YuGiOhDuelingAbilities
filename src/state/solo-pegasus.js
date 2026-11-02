// Solo mode: Pegasus, the castle boss. Three stages by LP:
//   1 Toon World: unblockable Toons that survive battle (and shield him from
//     battle damage) while the book stands;
//     attack the book (1500+ ATK) to tear its pages. Funny Bunny shields him.
//   2 Millennium Eye: his intents show ??? (your own Millennium Eye cancels it),
//     Mind Crush and Millennium Glare.
//   3 Final Read: Thousand-Eyes Restrict absorbs your strongest monster, and
//     he bluffs (two moves shown, one real). Three actions a turn.
// fight.pegasus = { stage, toonWorld (played), pages, bunny (used), restrict (used) }.
const newSoloPegasus = () => ({ stage: 1, toonWorld: false, pages: SOLO_PEGASUS.pages, bunny: false, restrict: false });

const soloToonWorldUp = f => !!f?.pegasus?.toonWorld && f.pegasus.pages > 0;

// Toons while the book stands (max 3 out), otherwise his other cards.
// `taken` = monster names on the field plus the ones already planned.
function soloPegasusPool(f, { toonWorld = soloToonWorldUp(f), taken = f.monsters.map(m => m.name) } = {}) {
  const toons = SOLO_PEGASUS.toons;
  const out = toons.filter(t => taken.includes(t.name)).length;
  const free = toons.filter(t => !taken.includes(t.name));
  return toonWorld && out < SOLO_PEGASUS.maxToons && free.length ? free : SOLO_PEGASUS.deck;
}

function buildPegasusIntents(f) {
  const g = f.pegasus;
  if (!g.toonWorld) return ['toonworld', 'summon'];
  const w = SOLO_PEGASUS.weights[g.stage];
  const intents = [];
  if (g.stage === 3 && !g.restrict) intents.push('restrict');
  if (g.stage === 3) intents.push('bluff');
  let monsters = f.monsters.length + (intents.includes('restrict') ? 1 : 0);
  let trap = f.trap;
  let bunny = g.bunny;
  while (intents.length < SOLO_PEGASUS.actions[g.stage]) {
    const action = soloWeighted({
      ...w,
      summon: monsters < SOLO_MAX_MONSTERS ? w.summon : 0,
      equip: monsters ? w.equip || 0 : 0,
      trap: trap ? 0 : w.trap || 0,
      bunny: bunny || monsters >= SOLO_MAX_MONSTERS ? 0 : w.bunny || 0
    }) || 'equip';
    if (action === 'summon' || action === 'bunny') monsters++;
    if (action === 'trap') trap = true;
    if (action === 'bunny') bunny = true;
    intents.push(action);
  }
  return intents;
}

// Two of the three bluffs, in random order; one of them is real.
function soloPegasusBluff() {
  const options = shuffled(Object.keys(SOLO_PEGASUS.bluffs)).slice(0, 2);
  return { options, real: soloPick(options), cardType: soloPick(SOLO_PEGASUS.cardTypes) };
}

const soloGlareDamage = f => (f.pegasus.stage === 3 ? SOLO_PEGASUS.finalGlare : SOLO_PEGASUS.glare);

// Pegasus's Video (a Shadow Game) gives away his first Toon.
function soloApplyVideo(f) {
  const toon = SOLO_PEGASUS.toons.find(t => t.name === solo.video);
  const i = f.intents.indexOf('summon');
  if (toon && i >= 0) f.peek[i] = { card: toon, pos: 'atk' };
  f.video = solo.video;
  solo.video = null;
}

// Moves to the next stage when his LP drops low enough (stages can be skipped).
function soloPegasusStage(f) {
  const g = f.pegasus;
  const stage = f.lp <= SOLO_PEGASUS.stage3At ? 3 : f.lp <= SOLO_PEGASUS.stage2At ? 2 : 1;
  if (stage <= g.stage) return;
  g.stage = stage;
  f.cutscene = `stage${stage}`;
  playSound({ name: 'co-stage' });
  if (f.turn === 'player') planSoloTurn(f);
}

// Your attack on Toon World tears out a page.
function soloTearPage(atk) {
  const f = solo.fight;
  const g = f.pegasus;
  if (!soloToonWorldUp(f)) return null;
  if (atk < SOLO_PEGASUS.pageMinAtk) {
    playSound({ name: 'co-bounce' });
    return { tone: 'meh', text: `📖 ${atk} ATK bounces off the cover. You need ${SOLO_PEGASUS.pageMinAtk}+ ATK to tear a page.`, negated: true };
  }
  g.pages--;
  playSound({ name: 'co-page' });
  if (g.pages > 0) return { tone: 'good', text: `📄 You tear out a page! Toon World has ${g.pages} page${g.pages === 1 ? '' : 's'} left.` };
  const count = destroySoloMonsters(m => m.toon);
  playSound({ name: 'co-book' });
  return { tone: 'good', text: `📖 The last page tears! Toon World falls apart${count ? ` and takes ${count === 1 ? 'its Toon' : `all ${count} Toons`} with it` : ''}.` };
}

// Toon Dark Magician Girl seals one of your ready relics for the rest of the duel.
function soloToonSeal(f) {
  const ids = [...SOLO_DEFENSE_RELICS, 'axe'].filter(soloRelicReady);
  if (!ids.length) return '';
  const id = soloPick(ids);
  f.relicUsed = { ...f.relicUsed, [id]: soloRelicUses(id) };
  flashSoloRelic(id);
  return `🪄 Her magic seals your ${SOLO_RELICS[id].icon} ${SOLO_RELICS[id].name} for this duel!`;
}

// Pegasus' own enemy steps (called from prepareSoloStepType).
function soloPegasusStep(step, f, info) {
  const g = f.pegasus;
  switch (step.type) {
    case 'toonworld':
      g.toonWorld = true;
      g.pages = SOLO_PEGASUS.pages;
      playSound({ name: 'co-book' });
      return info('📖', 'Toon World!', "Pegasus opens his book and the pages come to life. Toons attack you directly and can't be blocked.", `Tear out its ${SOLO_PEGASUS.pages} pages: attack the book with ${SOLO_PEGASUS.pageMinAtk}+ ATK.`);
    case 'bunny': {
      if (g.bunny || f.monsters.length >= SOLO_MAX_MONSTERS) return false;
      g.bunny = true;
      const b = SOLO_PEGASUS.bunny;
      f.monsters.push({ ...b, uid: f.nextUid++, equips: [] });
      playSound({ name: 'co-toon' });
      return info(b.icon, `${b.name}!`, `${b.icon} ${b.name} (${b.atk} ATK / ${b.def} DEF) hops onto his field in <b>Defense Position</b>.`, 'While it hops around, Pegasus takes no damage. Destroy it first!');
    }
    case 'glare': {
      const amount = soloGlareDamage(f);
      playSound({ name: 'co-eye' });
      hurtSoloPlayer(amount);
      return info('👁️', 'Millennium Glare!', `His Eye burns into your soul. You take ${amount}.`);
    }
    case 'barrage':
      playSound({ name: 'co-eye' });
      hurtSoloPlayer(SOLO_PEGASUS.barrage);
      return info('🌪️', 'Illusion Barrage!', `Toon-shaped illusions rain down on you. You take ${SOLO_PEGASUS.barrage}.`);
    case 'crush':
      playSound({ name: 'co-eye' });
      Object.assign(step, { kind: 'crush', icon: '🧠', title: 'Mind Crush!', cardType: step.peek?.cardType || soloPick(SOLO_PEGASUS.cardTypes), sub: null });
      return true;
    case 'bluff': {
      const pk = step.peek?.options ? step.peek : soloPegasusBluff();
      const fake = pk.options.find(o => o !== pk.real);
      Object.assign(step, { type: pk.real, peek: { cardType: pk.cardType }, bluffNote: `🎭 The ${SOLO_PEGASUS.bluffs[fake].text} was a bluff!` });
      return prepareSoloStepType(step, f);
    }
    case 'restrict':
      if (g.restrict) return false;
      playSound({ name: 'co-restrict' });
      Object.assign(step, { kind: 'restrict', icon: SOLO_PEGASUS.restrict.icon, title: `${SOLO_PEGASUS.restrict.name}!`, sub: null });
      return true;
    case 'barrel': {
      const m = soloMonster(step.uid);
      if (!m || m.pos !== 'atk' || m.bound) return false;
      const shots = Array.from({ length: SOLO_PEGASUS.barrels }, () => Math.random() < 0.5);
      const hits = shots.filter(Boolean).length;
      playSound({ name: 'co-barrel' });
      if (hits) hurtSoloPlayer(hits * SOLO_PEGASUS.barrelHit);
      return info(m.icon, `${m.name} spins its barrels!`, shots.map(s => (s ? '💥 Bang!' : '💨 Miss!')).join(' '), hits ? `You take ${hits * SOLO_PEGASUS.barrelHit}.` : 'All three miss!');
    }
    default:
      return false;
  }
}

// Mind Crush (honour system): you discard a card of the named type, or he read you wrong.
function soloMindCrush(had) {
  const step = soloStep();
  if (!step || step.kind !== 'crush' || step.sub) return;
  if (had) {
    playSound({ name: 'co-destroy' });
    return finishSoloStep({ tone: 'bad', text: `🧠 You discard a ${step.cardType} card.` });
  }
  const dealt = damageSoloEnemy(SOLO_PEGASUS.crushMiss);
  if (solo.phase === 'fight') finishSoloStep({ tone: 'good', text: `🧠 Nothing there! His Millennium Eye was wrong. Pegasus takes ${dealt}.` });
}

// Thousand-Eyes Restrict takes the ATK of your strongest monster (0 = you had none).
function soloAbsorb(value) {
  const step = soloStep();
  const f = solo.fight;
  if (!step || step.kind !== 'restrict' || step.sub) return;
  f.pegasus.restrict = true;
  let note = '';
  if (f.monsters.length >= SOLO_MAX_MONSTERS) {
    const weak = f.monsters.reduce((a, b) => (soloStats(b, f).atk < soloStats(a, f).atk ? b : a));
    f.monsters = f.monsters.filter(m => m.uid !== weak.uid);
    note = ` ${weak.name} leaves his field to make room.`;
  }
  f.monsters.push({ ...SOLO_PEGASUS.restrict, atk: value, def: 0, uid: f.nextUid++, pos: value ? 'atk' : 'def', equips: [] });
  playSound({ name: 'co-summon' });
  finishSoloStep(value
    ? { tone: 'bad', text: `🧿 Your strongest monster is absorbed! Remove it from your field. Restrict now has ${value} ATK.${note}` }
    : { tone: 'meh', text: `🧿 Restrict finds nothing to absorb. It waits in Defense Position with 0 ATK.${note}` });
}
