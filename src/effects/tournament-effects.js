// Tournament draw: the hand-picked duelists are already face up, then each
// empty spot is a face-down card whose name spins like a slot machine,
// slows down and slams onto a random duelist. Tap "Skip" to reveal them all.
const TN_DRAW_INTRO_MS = 900;
const TN_DRAW_GAP_MS = 380;
// Spins get shorter when there are many spots to fill (~12s in total).
const TN_DRAW_BUDGET_MS = 12000;
const TN_DRAW_SPIN_MIN_MS = 750;
const TN_DRAW_SPIN_MAX_MS = 2200;
const TN_DRAW_TICK_MS = 55;
const TN_CHAMPION_MS = 4600;

const tournamentDraw = { active: false, done: false, fresh: false, revealed: new Set(), timers: [] };

function tnLater(fn, ms) {
  tournamentDraw.timers.push(setTimeout(fn, ms));
}

function startTournamentDraw() {
  cancelTournamentDraw();
  Object.assign(tournamentDraw, { active: true, done: false, fresh: true, revealed: new Set() });
  if (prefersReducedMotion()) {
    revealAllTournamentDraw();
    return;
  }
  playSound({ name: 'tn-draw' });
  tnLater(() => spinTournamentSlot(0), TN_DRAW_INTRO_MS);
}

function cancelTournamentDraw() {
  tournamentDraw.timers.forEach(clearTimeout);
  tournamentDraw.timers = [];
  tournamentDraw.active = false;
}

function revealAllTournamentDraw() {
  tournamentDraw.timers.forEach(clearTimeout);
  tournamentDraw.timers = [];
  tournament.randomIds.forEach(id => tournamentDraw.revealed.add(id));
  tournamentDraw.done = true;
}

function skipTournamentDraw() {
  if (tournamentDraw.done) return;
  revealAllTournamentDraw();
  playSound({ name: 'tn-land' });
  render();
}

function finishTournamentDraw() {
  cancelTournamentDraw();
  tournamentUi.dealBracket = true;
  playSound({ name: 'tn-start' });
  render();
}

const tnSlotEl = id => document.querySelector(`[data-tn-draw="${id}"]`);

function spinTournamentSlot(i) {
  const ids = tournament.randomIds;
  if (!tournamentDraw.active || i >= ids.length) {
    if (tournamentDraw.active) {
      tournamentDraw.done = true;
      document.querySelector('.tn-draw')?.classList.add('tn-draw--done');
      playSound({ name: 'tn-draw-done' });
    }
    return;
  }

  const id = ids[i];
  const spinMs = Math.min(TN_DRAW_SPIN_MAX_MS, Math.max(TN_DRAW_SPIN_MIN_MS, TN_DRAW_BUDGET_MS / ids.length));
  const pool = CHARACTERS.filter(c => !TOURNAMENT_PICK_ONLY_IDS.includes(c.id));
  tnSlotEl(id)?.classList.add('tn-spinning');
  tnSlotEl(id)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });

  // Ticks get further apart (ease-out), like a wheel losing speed.
  let elapsed = 0;
  let last = null;
  const tick = () => {
    const progress = elapsed / spinMs;
    if (progress >= 1) {
      landTournamentSlot(id);
      tnLater(() => spinTournamentSlot(i + 1), TN_DRAW_GAP_MS);
      return;
    }
    let char;
    do char = pool[Math.floor(Math.random() * pool.length)]; while (pool.length > 1 && char === last);
    last = char;
    const el = tnSlotEl(id);
    if (el) {
      el.querySelector('.tn-draw-name').textContent = char.name;
      el.querySelector('.tn-draw-theme').textContent = char.theme;
    }
    playSound({ name: 'tn-tick', progress });
    const wait = TN_DRAW_TICK_MS * (1 + progress * progress * 5);
    elapsed += wait;
    tnLater(tick, wait);
  };
  tick();
}

function landTournamentSlot(id) {
  tournamentDraw.revealed.add(id);
  const el = tnSlotEl(id);
  const char = getTournamentChar(id);
  if (el && char) {
    el.outerHTML = renderTournamentDrawCard(id);
    const landed = tnSlotEl(id);
    landed?.classList.add('tn-landed');
    if (landed) spawnParticles(landed, { type: 'quest', mode: 'spark', count: 12 });
  }
  playSound({ name: 'tn-land' });
}

function celebrateTournamentChampion(id) {
  const char = getTournamentChar(id);
  playSound({ name: 'tn-champion' });
  spawnFx('fx-tn-champ', TN_CHAMPION_MS, {
    html: `
      <div class="tn-champ-rays"></div>
      <div class="tn-champ-box">
        <div class="tn-champ-cup">🏆</div>
        <div class="tn-champ-title">Champion</div>
        <div class="tn-champ-name">${tnEsc(char?.name || '???')}</div>
        <div class="tn-champ-theme">${tnEsc(char?.theme || '')}</div>
      </div>
    `
  });
  // After the overlay, so the confetti rains in front of it.
  spawnParticles(document.body, { type: 'quest', mode: 'rain', count: 46 });
}
