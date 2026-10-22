// Secret Duel Disk mini-game (opened by holding "Start Duel Setup" for 2s, see
// src/effects/duel-disk-easter-egg.js). You duel a Training Dummy:
// - Each turn you draw (tap the deck), may Normal Summon one monster (level
//   5-6 needs one tribute, 7+ two; the weakest monsters are tributed), play
//   or set any number of spells/traps, and attack once with each monster.
// - On its turn the dummy flails at you for more damage every turn. Set traps
//   spring automatically, and a Kuriboh in your hand blocks the hit.
// - Win by bringing the dummy to 0 LP, or by holding all 5 Exodia pieces.
// The game state lives here in memory (not in the app store) and only
// #disk-root is repainted, so the rest of the app isn't re-rendered. One-off
// animations are keyed to timestamps (see diskFresh in duel-disk-view.js) so
// a repaint mid-animation continues it instead of restarting it.
const DISK_LP = 8000;
const DISK_OPENING_HAND = 5;
const DISK_BOOT_MS = 1300;
const DISK_DRAW_GAP_MS = 230;
const DISK_SWORDS_TURNS = 3;
const DISK_DUMMY_BASE_HIT = 500;
const DISK_DUMMY_HIT_STEP = 300;
const DISK_DUMMY_MAX_HIT = 3000;
const DISK_SHUFFLE_HOLD_MS = 700;
const DISK_DRAG_START_PX = 10;

let disk = null;
let diskUid = 0;
const diskTimers = new Set();
const diskLpFrames = {};

const diskNow = () => performance.now();
const diskDef = card => DISK_CARDS[card.id];
const diskAtk = monster => diskDef(monster).atk + (monster.bonus || 0);
const diskFirstEmpty = zones => zones.findIndex(zone => !zone);
const diskTributesFor = def => (def.level >= 7 ? 2 : def.level >= 5 ? 1 : 0);
const diskZoneEl = (row, i) => document.querySelector(`[data-drop="${row}-${i}"]`);

function diskLater(ms, fn) {
  const id = setTimeout(() => {
    diskTimers.delete(id);
    fn();
  }, ms);
  diskTimers.add(id);
}

function clearDiskTimers() {
  diskTimers.forEach(id => clearTimeout(id));
  diskTimers.clear();
}

function shuffleDiskCards(cards) {
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards;
}

function paintDisk() {
  const root = document.getElementById('disk-root');
  if (!root || !disk) return;
  const scroll = root.querySelector('.disk-hand')?.scrollLeft ?? 0;
  root.innerHTML = renderDiskBoard();
  const hand = root.querySelector('.disk-hand');
  if (hand) hand.scrollLeft = scroll;
}

// ---------------------------------------------------------------------------
// Game lifecycle
// ---------------------------------------------------------------------------

function ensureDiskGame() {
  if (!disk) newDiskGame();
}

function newDiskGame() {
  clearDiskTimers();
  cancelDiskDrag();
  disk = {
    deck: shuffleDiskCards(DISK_DECKLIST.map(id => ({ uid: ++diskUid, id }))),
    hand: [],
    monsters: Array(5).fill(null),
    spells: Array(5).fill(null),
    graveyard: [],
    lp: DISK_LP,
    dummyLp: DISK_LP,
    shown: { player: DISK_LP, dummy: DISK_LP },
    turn: 1,
    needsDraw: false,
    summoned: false,
    selected: null,
    busy: true,
    result: null,
    swords: 0,
    dummyStuck: false,
    showGrave: false,
    message: 'Booting duel disk…',
    fx: { bootAt: diskNow() }
  };
  playSound({ name: 'disk-boot' });
  paintDisk();

  diskLater(DISK_BOOT_MS, () => {
    disk.message = "It's time to duel! Drawing your opening hand…";
    drawDiskCards(DISK_OPENING_HAND, () => {
      disk.busy = false;
      disk.message = 'Your turn! Tap a card in your hand — or drag it onto the disk.';
      paintDisk();
    });
  });
}

// Leaving the screen: stop every pending timer so nothing plays off-screen.
function endDiskSession() {
  clearDiskTimers();
  cancelDiskDrag();
  disk = null;
}

function endDiskGame(kind, reason) {
  if (!disk || disk.result) return;
  clearDiskTimers();
  cancelDiskDrag();
  disk.result = { kind, reason };
  disk.busy = false;
  disk.selected = null;
  disk.showGrave = false;
  playSound({ name: kind === 'lose' ? 'disk-lose' : 'disk-win' });
  paintDisk();
  if (kind !== 'lose') spawnParticles(null, { type: 'quest', mode: 'rain', count: 60 });
}

// ---------------------------------------------------------------------------
// Messages and guards
// ---------------------------------------------------------------------------

function diskHint(message) {
  disk.message = message;
  paintDisk();
}

function diskError(message) {
  disk.message = message;
  disk.fx.errorAt = diskNow();
  playSound({ name: 'disk-error' });
  paintDisk();
  return false;
}

// Can the player take an action right now? Explains why not if it's because
// they still have to draw.
function diskCanAct() {
  if (!disk || disk.busy || disk.result) return false;
  if (disk.needsDraw) return diskError('Draw a card first — tap your deck!');
  return true;
}

// Speech bubble (summon lines, Pot of Greed...) above an element.
function diskSay(anchor, text) {
  if (!anchor) return;
  const { x, y, h } = getCenter(anchor);
  spawnFx('disk-say', 1700, {
    vars: { '--x': `${x.toFixed(0)}px`, '--y': `${(y - h / 2).toFixed(0)}px` },
    html: `<span>${text}</span>`
  });
}

// ---------------------------------------------------------------------------
// Drawing and the deck
// ---------------------------------------------------------------------------

function drawDiskCards(count, done) {
  if (count <= 0) {
    if (!checkDiskExodia()) done?.();
    return;
  }
  if (!disk.deck.length) {
    endDiskGame('lose', "Your deck ran out of cards — you decked out!");
    return;
  }
  const card = disk.deck.pop();
  card.drawnAt = diskNow();
  disk.hand.push(card);
  playSound({ name: 'disk-draw' });
  paintDisk();
  const hand = document.querySelector('.disk-hand');
  if (hand) hand.scrollLeft = hand.scrollWidth;
  diskLater(DISK_DRAW_GAP_MS, () => drawDiskCards(count - 1, done));
}

const diskShuffle = { timer: null, swallowClick: false };

function tapDiskDeck() {
  if (diskShuffle.swallowClick) {
    diskShuffle.swallowClick = false;
    return;
  }
  if (!disk || disk.busy || disk.result) return;
  if (!disk.needsDraw) {
    diskError('You already drew this turn. (Hold the deck to shuffle it.)');
    return;
  }
  disk.needsDraw = false;
  disk.busy = true;
  disk.selected = null;
  drawDiskCards(1, () => {
    disk.busy = false;
    disk.message = 'Summon, set or activate cards — then End Turn.';
    paintDisk();
  });
}

function startDiskShuffle() {
  diskShuffle.swallowClick = false;
  clearTimeout(diskShuffle.timer);
  if (!disk || disk.busy || disk.result || disk.deck.length < 2) return;
  diskShuffle.timer = setTimeout(() => {
    diskShuffle.swallowClick = true;
    shuffleDiskCards(disk.deck);
    disk.fx.shuffleAt = diskNow();
    disk.message = 'Shuffled! The heart of the cards is listening…';
    playSound({ name: 'disk-shuffle' });
    paintDisk();
  }, DISK_SHUFFLE_HOLD_MS);
}

function cancelDiskShuffle() {
  clearTimeout(diskShuffle.timer);
}

// ---------------------------------------------------------------------------
// Exodia
// ---------------------------------------------------------------------------

function checkDiskExodia() {
  if (!disk || disk.result) return false;
  if (!EXODIA_PIECE_IDS.every(id => disk.hand.some(card => card.id === id))) return false;

  disk.busy = true;
  disk.selected = null;
  disk.message = 'All five Forbidden pieces are in your hand… EXODIA, OBLITERATE!';
  paintDisk();
  const head = disk.hand.find(card => card.id === 'exodia');
  const source = document.querySelector(`[data-hand-uid="${head.uid}"]`) || document.querySelector('.disk-dummy');
  summonExodia(source);
  diskLater(EXODIA_WHITEOUT_MS, () => {
    disk.dummyLp = 0;
    disk.shown.dummy = 0;
    endDiskGame('exodia', 'Exodia the Forbidden One obliterated the Training Dummy. Instant win!');
  });
  return true;
}

// ---------------------------------------------------------------------------
// Selecting, dragging and dropping hand cards
// ---------------------------------------------------------------------------

function selectDiskCard(uid) {
  if (!disk || disk.busy || disk.result) return;
  disk.selected = disk.selected === uid ? null : uid;
  paintDisk();
}

// Plays a hand card onto a target: 'm' / 's' (first free zone), 'm-2' /
// 's-0' (a specific zone) or 'gy' (discard).
function diskPlay(uid, target) {
  if (!diskCanAct()) return;
  const card = disk.hand.find(c => c.uid === uid);
  if (!card) return;
  const def = diskDef(card);
  const [row, index] = target.split('-');
  const zone = index === undefined ? null : Number(index);

  if (row === 'gy') return discardDiskCard(card);
  if (row === 'm') {
    if (def.kind !== 'monster') return diskError(`${def.name} is a ${def.kind} — it goes in the bottom row.`);
    return summonDiskMonster(card, zone);
  }
  if (def.kind === 'monster') return diskError('Monsters go in the monster zones (top row).');
  return def.kind === 'trap' ? setDiskCard(card, zone) : activateDiskSpell(card, zone);
}

function diskSet(uid) {
  if (!diskCanAct()) return;
  const card = disk.hand.find(c => c.uid === uid);
  if (card) setDiskCard(card, null);
}

function tapDiskZone(row, i) {
  if (!disk || disk.busy || disk.result) return;
  const zones = row === 'm' ? disk.monsters : disk.spells;
  const selected = disk.hand.find(c => c.uid === disk.selected);

  if (selected) {
    const def = diskDef(selected);
    // Tapping an occupied zone that the selected card can't use acts on that
    // zone's card instead (attack / activate).
    const canReplace = row === 'm' && def.kind === 'monster' && diskTributesFor(def) > 0;
    if (!zones[i] || canReplace) return diskPlay(selected.uid, `${row}-${i}`);
    disk.selected = null;
  }

  if (row === 'm') {
    if (disk.monsters[i]) return attackWithDiskMonster(i);
    return diskHint('Select a monster in your hand, then tap a zone — or drag it here.');
  }
  if (disk.spells[i]) return tapDiskSpellZone(i);
  diskHint('Spells and traps go in this row.');
}

function openDiskGrave() {
  if (!disk || disk.result) return;
  if (disk.selected !== null && !disk.busy) return diskPlay(disk.selected, 'gy');
  disk.showGrave = true;
  paintDisk();
}

function closeDiskGrave() {
  if (!disk) return;
  disk.showGrave = false;
  paintDisk();
}

const diskDrag = { uid: null, pointerId: null, x: 0, y: 0, active: false, ghost: null, source: null, hover: null };

function diskCardDown(event, uid) {
  if (event.button > 0 || !disk || disk.busy || disk.result) return;
  cancelDiskDrag();
  Object.assign(diskDrag, { uid, pointerId: event.pointerId, x: event.clientX, y: event.clientY, active: false, source: event.currentTarget });
  window.addEventListener('pointermove', diskCardMove);
  window.addEventListener('pointerup', diskCardUp);
  window.addEventListener('pointercancel', cancelDiskDrag);
}

function diskCardMove(event) {
  if (event.pointerId !== diskDrag.pointerId) return;
  if (!diskDrag.active) {
    if (Math.hypot(event.clientX - diskDrag.x, event.clientY - diskDrag.y) < DISK_DRAG_START_PX) return;
    if (!diskCanAct()) return cancelDiskDrag();
    diskDrag.active = true;
    const rect = diskDrag.source.getBoundingClientRect();
    const ghost = document.createElement('div');
    ghost.className = 'disk-ghost';
    ghost.style.width = `${rect.width}px`;
    ghost.innerHTML = diskDrag.source.innerHTML;
    document.body.appendChild(ghost);
    diskDrag.ghost = ghost;
    diskDrag.source.classList.add('is-dragging');
    disk.selected = diskDrag.uid;
    document.querySelectorAll('.disk-zone, .disk-gy').forEach(el => el.classList.add('is-drag-target'));
  }
  const { ghost } = diskDrag;
  const tilt = Math.max(-12, Math.min(12, (event.clientX - diskDrag.x) * 0.08));
  ghost.style.transform = `translate(${event.clientX - ghost.offsetWidth / 2}px, ${event.clientY - ghost.offsetHeight * 0.65}px) rotate(${tilt}deg) scale(1.08)`;

  const hover = document.elementFromPoint(event.clientX, event.clientY)?.closest('[data-drop]') || null;
  if (hover !== diskDrag.hover) {
    diskDrag.hover?.classList.remove('is-drop-hover');
    hover?.classList.add('is-drop-hover');
    diskDrag.hover = hover;
  }
}

function diskCardUp(event) {
  if (event.pointerId !== diskDrag.pointerId) return;
  const { uid, active, hover } = diskDrag;
  cancelDiskDrag();
  if (!active) return selectDiskCard(uid);
  if (hover) diskPlay(uid, hover.dataset.drop);
  else paintDisk();
}

function cancelDiskDrag() {
  window.removeEventListener('pointermove', diskCardMove);
  window.removeEventListener('pointerup', diskCardUp);
  window.removeEventListener('pointercancel', cancelDiskDrag);
  diskDrag.ghost?.remove();
  diskDrag.source?.classList.remove('is-dragging');
  diskDrag.hover?.classList.remove('is-drop-hover');
  document.querySelectorAll('.is-drag-target').forEach(el => el.classList.remove('is-drag-target'));
  Object.assign(diskDrag, { uid: null, pointerId: null, active: false, ghost: null, source: null, hover: null });
}

// ---------------------------------------------------------------------------
// Monsters
// ---------------------------------------------------------------------------

function removeFromDiskHand(card) {
  disk.hand = disk.hand.filter(c => c !== card);
  if (disk.selected === card.uid) disk.selected = null;
}

function sendToDiskGrave(card, row, i) {
  spawnParticles(diskZoneEl(row, i), { type: 'comeback', mode: 'spark', count: 12 });
  if (row === 'm') disk.monsters[i] = null;
  else disk.spells[i] = null;
  disk.graveyard.push({ uid: card.uid, id: card.id });
  playSound({ name: 'disk-graveyard' });
}

function discardDiskCard(card) {
  removeFromDiskHand(card);
  disk.graveyard.push(card);
  disk.message = `${diskDef(card).name} was sent to the Graveyard.`;
  playSound({ name: 'disk-graveyard' });
  paintDisk();
  spawnParticles(document.querySelector('.disk-gy'), { type: 'comeback', mode: 'spark', count: 12 });
}

function summonDiskMonster(card, zone) {
  const def = diskDef(card);
  if (disk.summoned) return diskError('You already summoned a monster this turn.');

  const need = diskTributesFor(def);
  const onField = disk.monsters.map((m, i) => (m ? i : -1)).filter(i => i >= 0);
  if (onField.length < need) {
    return diskError(`${def.name} needs ${need} tribute${need > 1 ? 's' : ''}. Summon smaller monsters first!`);
  }

  const tributes = [];
  if (zone !== null && disk.monsters[zone]) {
    if (!need) return diskError('That zone is taken.');
    tributes.push(zone);
  }
  onField
    .filter(i => !tributes.includes(i))
    .sort((a, b) => diskAtk(disk.monsters[a]) - diskAtk(disk.monsters[b]))
    .slice(0, need - tributes.length)
    .forEach(i => tributes.push(i));

  const target = zone ?? (need ? tributes[0] : diskFirstEmpty(disk.monsters));
  if (target === -1) return diskError('Your monster zones are full.');

  disk.summoned = true;
  removeFromDiskHand(card);

  if (!tributes.length) {
    placeDiskMonster(card, target);
    return;
  }
  const names = tributes.map(i => diskDef(disk.monsters[i]).name);
  tributes.forEach(i => sendToDiskGrave(disk.monsters[i], 'm', i));
  disk.busy = true;
  disk.message = `Tributing ${names.join(' & ')}…`;
  playSound({ name: 'disk-tribute' });
  paintDisk();
  diskLater(600, () => {
    disk.busy = false;
    placeDiskMonster(card, target);
  });
}

// Puts a monster on the field (Normal Summon or Monster Reborn).
function placeDiskMonster(card, zone) {
  const def = diskDef(card);
  disk.monsters[zone] = { uid: card.uid, id: card.id, bonus: 0, attacked: false, bornAt: diskNow() };
  disk.message = `${def.name} summoned! (${def.atk} ATK)`;
  playSound({ name: 'disk-summon', level: def.level, voice: def.voice });
  paintDisk();

  const el = diskZoneEl('m', zone);
  const { x, y } = getCenter(el);
  spawnFx('disk-beam', 1000, { vars: { '--x': `${x.toFixed(0)}px`, '--y': `${y.toFixed(0)}px` } });
  spawnParticles(el, { type: 'skill', mode: 'burst', count: 8 + def.level * 2 });
  diskSay(el, def.line);

  if (def.onSummon) {
    disk.busy = true;
    diskLater(900, () => {
      disk.busy = false;
      DISK_ON_SUMMON[def.onSummon](zone);
    });
  }
}

const DISK_ON_SUMMON = {
  heal() {
    disk.message = "Mystical Elf's prayer restores 500 LP.";
    healDiskPlayer(500);
  },
  timeMagic(zone) {
    disk.busy = true;
    disk.message = 'Time Roulette… spinning…';
    playSound({ name: 'disk-roulette' });
    paintDisk();
    diskLater(1100, () => {
      disk.busy = false;
      if (Math.random() < 0.5) {
        diskSay(diskZoneEl('m', zone), '🎯 Hit!');
        disk.message = 'Time Magic! The dummy ages a thousand years. (-1000)';
        damageDummy(1000);
      } else {
        diskSay(diskZoneEl('m', zone), '💥 Miss!');
        disk.message = 'Time Magic backfired! (-500)';
        damageDiskPlayer(500);
      }
    });
  }
};

function attackWithDiskMonster(i) {
  if (!diskCanAct()) return;
  const monster = disk.monsters[i];
  const def = diskDef(monster);
  if (monster.attacked) return diskError(`${def.name} already attacked this turn.`);

  monster.attacked = true;
  monster.attackAt = diskNow();
  disk.busy = true;
  disk.selected = null;
  disk.message = `${def.name}: ${def.attack}`;
  playSound({ name: 'disk-attack', level: def.level });
  paintDisk();
  diskSay(diskZoneEl('m', i), def.attack);

  diskLater(330, () => damageDummy(diskAtk(monster)));
  diskLater(800, () => {
    if (!disk.dummyLp) return;
    disk.busy = false;
    paintDisk();
  });
}

// ---------------------------------------------------------------------------
// Life points
// ---------------------------------------------------------------------------

function countDiskLp(who, to) {
  cancelAnimationFrame(diskLpFrames[who]);
  const game = disk;
  const from = game.shown[who];
  if (prefersReducedMotion() || from === to) {
    game.shown[who] = to;
    paintDiskLp(who);
    return;
  }
  const startedAt = diskNow();
  const step = now => {
    if (game !== disk) return;
    const progress = Math.min(1, (now - startedAt) / LP_COUNT_DURATION_MS);
    game.shown[who] = Math.round(from + (to - from) * (1 - Math.pow(1 - progress, 3)));
    paintDiskLp(who);
    if (progress < 1) diskLpFrames[who] = requestAnimationFrame(step);
  };
  diskLpFrames[who] = requestAnimationFrame(step);
}

function paintDiskLp(who) {
  const value = disk.shown[who];
  document.querySelectorAll(`[data-disk-lp="${who}"]`).forEach(el => { el.textContent = value; });
  document.querySelectorAll(`[data-disk-fill="${who}"]`).forEach(el => { el.style.width = `${diskLpPercent(value)}%`; });
}

const diskLpPercent = lp => Math.max(0, Math.min(100, (lp / DISK_LP) * 100));

function damageDummy(amount) {
  disk.dummyLp = Math.max(0, disk.dummyLp - amount);
  disk.fx.dummyHitAt = diskNow();
  playSound({ name: 'disk-hit', amount });
  paintDisk();
  const dummy = document.querySelector('.disk-dummy');
  spawnFloatText(dummy, `-${amount}`, 'damage');
  spawnParticles(dummy, { type: 'comeback', mode: 'burst', count: 14 });
  countDiskLp('dummy', disk.dummyLp);
  if (!disk.dummyLp) {
    disk.busy = true;
    diskLater(700, () => endDiskGame('win', `The Training Dummy has been defeated on turn ${disk.turn}!`));
  }
}

function damageDiskPlayer(amount) {
  disk.lp = Math.max(0, disk.lp - amount);
  playSound({ name: 'disk-hurt' });
  paintDisk();
  spawnFloatText(document.querySelector('.disk-me-lp'), `-${amount}`, 'damage');
  spawnOverlay('damage', 'damage', 700);
  restartClass(document.getElementById('app'), 'fx-shake', 600);
  countDiskLp('player', disk.lp);
  if (!disk.lp) {
    disk.busy = true;
    diskLater(800, () => endDiskGame('lose', 'The Training Dummy knocked your LP down to 0. Even dummies have their day.'));
  }
}

function healDiskPlayer(amount) {
  disk.lp += amount;
  playSound({ name: 'disk-heal' });
  paintDisk();
  const lp = document.querySelector('.disk-me-lp');
  spawnFloatText(lp, `+${amount}`, 'heal');
  spawnParticles(lp, { type: 'heal', mode: 'rise', count: 14 });
  countDiskLp('player', disk.lp);
}

// ---------------------------------------------------------------------------
// Spells and traps
// ---------------------------------------------------------------------------

function setDiskCard(card, zone) {
  const def = diskDef(card);
  const target = zone ?? diskFirstEmpty(disk.spells);
  if (target === -1) return diskError('Your Spell & Trap zones are full.');
  if (disk.spells[target]) return diskError('That zone is taken.');

  removeFromDiskHand(card);
  disk.spells[target] = { uid: card.uid, id: card.id, faceDown: true, bornAt: diskNow() };
  disk.message = def.kind === 'trap'
    ? 'You set a card face-down. It springs when the dummy attacks…'
    : 'You set a card face-down. Tap it to activate it later.';
  playSound({ name: 'disk-set' });
  paintDisk();
}

// Why a spell can't be activated right now (or null if it can).
function diskSpellBlocked(card) {
  switch (card.id) {
    case 'reborn':
      if (!disk.graveyard.some(c => diskDef(c).kind === 'monster')) return 'There are no monsters in your Graveyard to revive.';
      if (diskFirstEmpty(disk.monsters) === -1) return 'Your monster zones are full.';
      return null;
    case 'axe':
      return disk.monsters.some(Boolean) ? null : 'Axe of Despair needs a monster on your field to equip.';
    case 'swords':
      return disk.swords > 0 ? 'The Swords of Revealing Light are already shining.' : null;
    case 'cardDestruction':
      return disk.hand.some(c => c.uid !== card.uid) ? null : 'Your hand is empty — there is nothing to destroy.';
    default:
      return null;
  }
}

function activateDiskSpell(card, zone) {
  const blocked = diskSpellBlocked(card);
  if (blocked) return diskError(blocked);
  const target = zone ?? diskFirstEmpty(disk.spells);
  if (target === -1) return diskError('Your Spell & Trap zones are full.');
  if (disk.spells[target]) return diskError('That zone is taken.');

  removeFromDiskHand(card);
  const placed = { uid: card.uid, id: card.id, faceDown: false, bornAt: diskNow(), flipAt: diskNow() };
  disk.spells[target] = placed;
  resolveDiskSpell(placed, target);
}

function tapDiskSpellZone(i) {
  const card = disk.spells[i];
  const def = diskDef(card);
  if (!card.faceDown) {
    const left = card.id === 'swords' ? ` (${disk.swords} turn${disk.swords === 1 ? '' : 's'} left)` : '';
    return diskHint(`${def.name}: ${def.text}${left}`);
  }
  if (def.kind === 'trap') {
    disk.fx.trapWiggle = { i, at: diskNow() };
    return diskHint(`Your face-down ${def.name} springs by itself when the dummy attacks.`);
  }
  if (!diskCanAct()) return;
  const blocked = diskSpellBlocked(card);
  if (blocked) return diskError(blocked);
  card.faceDown = false;
  card.flipAt = diskNow();
  resolveDiskSpell(card, i);
}

function resolveDiskSpell(card, zone) {
  const def = diskDef(card);
  disk.busy = true;
  disk.selected = null;
  disk.message = `${def.name}!`;
  playSound({ name: 'disk-spell' });
  paintDisk();
  spawnParticles(diskZoneEl('s', zone), { type: 'quest', mode: 'burst', count: 14 });
  diskLater(650, () => DISK_SPELLS[card.id](card, zone, () => finishDiskSpell(card)));
}

function finishDiskSpell(card) {
  if (!disk || disk.result) return;
  const zone = disk.spells.indexOf(card);
  if (zone >= 0 && card.id !== 'swords') sendToDiskGrave(card, 's', zone);
  disk.busy = false;
  paintDisk();
}

const DISK_SPELLS = {
  pot(card, zone, done) {
    diskSay(diskZoneEl('s', zone), 'It allows me to draw two cards.');
    drawDiskCards(2, () => {
      diskSay(diskZoneEl('s', zone), "…that's literally all.");
      disk.message = "Pot of Greed: you drew 2 cards. That's literally all.";
      done();
    });
  },
  reborn(card, zone, done) {
    const best = disk.graveyard
      .filter(c => diskDef(c).kind === 'monster')
      .sort((a, b) => diskDef(b).atk - diskDef(a).atk)[0];
    disk.graveyard.splice(disk.graveyard.indexOf(best), 1);
    placeDiskMonster(best, diskFirstEmpty(disk.monsters));
    disk.message = `Monster Reborn! ${diskDef(best).name} returns from the Graveyard!`;
    done();
  },
  cardDestruction(card, zone, done) {
    const count = disk.hand.length;
    spawnParticles(document.querySelector('.disk-hand'), { type: 'comeback', mode: 'burst', count: 24 });
    disk.graveyard.push(...disk.hand.splice(0));
    disk.message = `Card Destruction! ${count} card${count === 1 ? '' : 's'} burn to the Graveyard…`;
    playSound({ name: 'disk-graveyard' });
    paintDisk();
    diskLater(700, () => drawDiskCards(count, () => {
      disk.message = `…and you draw ${count} fresh card${count === 1 ? '' : 's'}.`;
      done();
    }));
  },
  axe(card, zone, done) {
    let best = -1;
    disk.monsters.forEach((m, i) => {
      if (m && (best < 0 || diskAtk(m) > diskAtk(disk.monsters[best]))) best = i;
    });
    const monster = disk.monsters[best];
    monster.bonus += 1000;
    monster.buffAt = diskNow();
    disk.message = `Axe of Despair! ${diskDef(monster).name} now has ${diskAtk(monster)} ATK.`;
    playSound({ name: 'disk-heal' });
    paintDisk();
    spawnFloatText(diskZoneEl('m', best), '+1000', 'heal');
    done();
  },
  swords(card, zone, done) {
    disk.swords = DISK_SWORDS_TURNS;
    disk.fx.swordsAt = diskNow();
    disk.message = "Swords of Revealing Light! The dummy can't attack for 3 turns.";
    const { x, y } = getCenter(document.querySelector('.disk-dummy'));
    spawnFx('disk-swords-fall', 1600, {
      vars: { '--x': `${x.toFixed(0)}px`, '--y': `${y.toFixed(0)}px` },
      html: Array.from({ length: 7 }, (_, i) => `<span style="--i: ${i}">🗡️</span>`).join('')
    });
    done();
  }
};

// ---------------------------------------------------------------------------
// Turns and the dummy
// ---------------------------------------------------------------------------

function diskEndTurn() {
  if (!diskCanAct()) return;
  disk.busy = true;
  disk.selected = null;
  disk.message = "The dummy's turn…";
  playSound({ name: 'disk-turn' });
  paintDisk();
  diskLater(800, dummyTurn);
}

function dummyTurn() {
  if (disk.swords > 0) {
    disk.swords--;
    disk.fx.swordsAt = diskNow();
    disk.message = disk.swords
      ? `The Swords of Revealing Light hold the dummy in place! (${disk.swords} turn${disk.swords === 1 ? '' : 's'} left)`
      : 'The dummy is frozen one last time… the Swords of Revealing Light fade away.';
    playSound({ name: 'disk-spell' });
    if (!disk.swords) {
      const zone = disk.spells.findIndex(c => c && c.id === 'swords');
      if (zone >= 0) sendToDiskGrave(disk.spells[zone], 's', zone);
    }
    paintDisk();
    diskLater(1500, startDiskTurn);
    return;
  }

  if (disk.dummyStuck) {
    disk.dummyStuck = false;
    disk.message = 'The dummy spends its turn climbing out of the Trap Hole…';
    playSound({ name: 'disk-climb' });
    paintDisk();
    diskLater(1500, startDiskTurn);
    return;
  }

  const damage = Math.min(DISK_DUMMY_MAX_HIT, DISK_DUMMY_BASE_HIT + (disk.turn - 1) * DISK_DUMMY_HIT_STEP);
  disk.fx.dummyAttackAt = diskNow();
  disk.message = `The dummy flails wildly at you! (${damage} damage)`;
  playSound({ name: 'disk-dummy-attack' });
  paintDisk();
  diskLater(600, () => resolveDummyAttack(damage));
}

function resolveDummyAttack(damage) {
  const trapZone = disk.spells.findIndex(c => c && c.faceDown && diskDef(c).kind === 'trap');
  if (trapZone >= 0) {
    const trap = disk.spells[trapZone];
    const def = diskDef(trap);
    trap.faceDown = false;
    trap.flipAt = diskNow();
    disk.message = `Trap card activate — ${def.name}!`;
    playSound({ name: 'disk-trap' });
    paintDisk();
    spawnFx('disk-trap-banner', 1500, { html: `<strong>TRAP CARD!</strong><span>${def.name}</span>` });
    diskLater(900, () => {
      DISK_TRAPS[trap.id](damage);
      diskLater(900, () => {
        const zone = disk.spells.indexOf(trap);
        if (zone >= 0) sendToDiskGrave(trap, 's', zone);
        paintDisk();
        diskLater(700, startDiskTurn);
      });
    });
    return;
  }

  const kuriboh = disk.hand.find(c => c.id === 'kuriboh');
  if (kuriboh) {
    removeFromDiskHand(kuriboh);
    disk.graveyard.push(kuriboh);
    disk.message = 'Kuriboh multiplies and takes the hit for you!';
    playSound({ name: 'disk-kuriboh' });
    paintDisk();
    spawnFx('disk-swarm', 1900, {
      html: Array.from({ length: 9 }, (_, i) =>
        `<div class="disk-swarm-kuri disk-kuri-awake" style="--i: ${i}; --sx: ${rand(-1, 1).toFixed(2)}">${NAP_KURIBOH_SVG}</div>`
      ).join('')
    });
    diskLater(1900, startDiskTurn);
    return;
  }

  damageDiskPlayer(damage);
  if (disk.lp > 0) diskLater(1200, startDiskTurn);
}

const DISK_TRAPS = {
  cylinder(damage) {
    disk.message = 'Magic Cylinder! The attack is fired straight back at the dummy!';
    damageDummy(damage);
  },
  negate() {
    disk.message = 'Negate Attack! The swing whiffs harmlessly.';
    playSound({ name: 'disk-negate' });
    paintDisk();
  },
  trapHole() {
    disk.dummyStuck = true;
    disk.fx.stuckAt = diskNow();
    disk.message = 'Trap Hole! The dummy falls in and loses its next turn.';
    playSound({ name: 'disk-fall' });
    paintDisk();
  },
  mirrorForce() {
    disk.message = 'Mirror Force! The dummy shatters… then stubbornly glues itself back together.';
    damageDummy(1000);
  }
};

function startDiskTurn() {
  if (!disk || disk.result) return;
  disk.turn++;
  disk.summoned = false;
  disk.monsters.forEach(m => { if (m) m.attacked = false; });
  disk.needsDraw = true;
  disk.busy = false;
  disk.message = `Turn ${disk.turn} — tap your deck to draw!`;
  playSound({ name: 'disk-turn' });
  paintDisk();
}
