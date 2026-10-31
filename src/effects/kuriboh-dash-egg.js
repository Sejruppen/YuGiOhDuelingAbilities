// LP modal easter egg: hold "Reset (8000)" for LP_EGG_PRESS_MS and "Kuriboh
// Dash" opens, a Geometry Dash style one-tap runner. Kuriboh (the cube)
// rolls through the Shadow Realm to a chiptune beat. Tap or hold to jump
// (holding re-jumps on landing), and tap through the Millennium Eye rings to
// jump in mid-air. Gold pads launch you high. Magenta Trap spikes, face-down
// card walls and Trap Holes end the attempt ("Kuri-kuri!"), and every death
// multiplies another Kuriboh into the crowd in the background. Reaching the
// end: "LEVEL COMPLETE", MULTIPLY! and a Kuriboh swarm. The LP are untouched.
// Sounds: 'kd-start', 'kd-beat' (scheduled one beat ahead, so the music stops
// on death), 'kd-orb', 'kd-pad', 'kd-death', 'kd-win' (HEADER_EGG_SOUNDS).
// CSS: "KURIBOH DASH" in effects.css.
const KD_SAFETY_MS = 30 * 60 * 1000;
const KD_VIEW_W = 10; // tiles across the canvas
const KD_VIEW_H = 7.5;
const KD_GROUND_Y = 6; // tiles from the top of the canvas to the floor
const KD_PLAYER_SCREEN_X = 2.6;
const KD_SPEED = 8.5; // tiles per second
const KD_GRAVITY = 80;
const KD_JUMP_V = 18.8; // peak ~2.2 tiles, ~4 tiles long
const KD_ORB_V = 18.8;
const KD_PAD_V = 26.5;
const KD_STEP = 1 / 120;
const KD_RESPAWN_MS = 900;
const KD_BEAT_S = 0.4; // 150 BPM
const KD_CROWD_MAX = 40;
const KD_START_RUN = 8; // empty tiles before the first segment
const KD_END_RUN = 10;

// The level, segment by segment. Rows go top -> bottom; the last row is the
// floor ('=' floor, '_' Trap Hole) and the one above it sits on the floor.
//   ^ Trap spike   # face-down card (solid)   o Millennium Eye ring   p pad
const KD_SEGMENTS = [
  [
    '                        ',
    '          ^         ^   ',
    '========================'
  ],
  [
    '                    ##    ',
    '     ^^       ########    ',
    '=========================='
  ],
  [
    '                        ',
    '======___=======___=====',
  ],
  [
    '         o              ',
    '                        ',
    '======_______===========',
  ],
  [
    '            ###         ',
    '            ###         ',
    '        p   ###         ',
    '========================',
  ],
  [
    '      ###   ###   ###        ',
    '=====_________________=======',
  ],
  [
    '                ^                ',
    '    ^^      ##########     ^^^   ',
    '================================='
  ]
];

function kdBuildLevel() {
  const height = Math.max(...KD_SEGMENTS.map(s => s.length)) - 1;
  const cols = [];
  const empty = () => ({ floor: true, cells: Array(height).fill(' ') });
  for (let i = 0; i < KD_START_RUN; i++) cols.push(empty());
  KD_SEGMENTS.forEach(rows => {
    const floor = rows[rows.length - 1];
    const above = rows.slice(0, -1).reverse(); // y = 0 first
    const width = Math.max(...rows.map(r => r.length));
    for (let x = 0; x < width; x++) {
      const col = empty();
      col.floor = floor[x] !== '_';
      above.forEach((row, y) => { col.cells[y] = row[x] || ' '; });
      cols.push(col);
    }
  });
  for (let i = 0; i < KD_END_RUN; i++) cols.push(empty());
  return { cols, goal: cols.length - KD_END_RUN + 2 };
}

const KD_LEVEL = kdBuildLevel();

const kdCell = (x, y) => KD_LEVEL.cols[x]?.cells[y] || ' ';
const kdHasFloor = x => x < 0 || x >= KD_LEVEL.cols.length || KD_LEVEL.cols[x].floor;
const kdOverlap = (ax, ay, aw, ah, bx, by, bw, bh) => ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;

// Kuriboh, drawn once into a sprite: a fuzzy brown ball, huge eyes, green claws.
function kdMakeKuribohSprite(px) {
  const c = document.createElement('canvas');
  c.width = c.height = px;
  const g = c.getContext('2d');
  g.translate(px / 2, px / 2);
  g.scale(px / 100, px / 100);
  const claw = (x, y, flip) => {
    g.fillStyle = '#4d7c0f';
    g.strokeStyle = '#1a2e05';
    g.lineWidth = 2.5;
    g.beginPath();
    g.ellipse(x, y, 11, 7, flip * 0.3, 0, Math.PI * 2);
    g.fill();
    g.stroke();
  };
  claw(-24, 40, -1);
  claw(24, 40, 1);
  g.fillStyle = '#6b3d16';
  g.strokeStyle = '#2b1606';
  g.lineWidth = 3;
  g.beginPath();
  for (let i = 0; i <= 28; i++) {
    const a = (i / 28) * Math.PI * 2;
    const r = i % 2 ? 40 : 47;
    g.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  g.closePath();
  g.fill();
  g.stroke();
  g.fillStyle = '#8a5524';
  g.beginPath();
  g.arc(-6, -8, 30, 0, Math.PI * 2);
  g.fill();
  [-15, 15].forEach(x => {
    g.fillStyle = '#fff';
    g.strokeStyle = '#2b1606';
    g.lineWidth = 2.5;
    g.beginPath();
    g.ellipse(x, -4, 13, 17, 0, 0, Math.PI * 2);
    g.fill();
    g.stroke();
    g.fillStyle = '#134e4a';
    g.beginPath();
    g.ellipse(x + 2, -1, 8, 11, 0, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#fff';
    g.beginPath();
    g.arc(x + 5, -6, 3.2, 0, Math.PI * 2);
    g.fill();
  });
  g.strokeStyle = '#2b1606';
  g.lineWidth = 2.5;
  g.beginPath();
  g.arc(0, 16, 6, 0.15 * Math.PI, 0.85 * Math.PI);
  g.stroke();
  return c;
}

const kd = { overlay: null, frame: null };

function playKuribohDashEgg() {
  lpEgg.swallowClick = true;
  markEggFound('kuriboh-dash');
  playSound({ name: 'kd-start' });

  const overlay = spawnFx('fx-cegg fx-kd', KD_SAFETY_MS, {
    html: `
      <div class="kd-bg"></div>
      <div class="kd-wrap">
        <div class="kd-hud">
          <span class="kd-attempt">Attempt 1</span>
          <span class="kd-bar"><span class="kd-fill"></span></span>
          <span class="kd-pct">0%</span>
          <button type="button" class="kd-quit" aria-label="Back to the duel">✕</button>
        </div>
        <div class="kd-stage">
          <canvas class="kd-canvas"></canvas>
          <div class="kd-win">
            <b class="kd-win-title">Level Complete!</b>
            <span class="kd-win-card">Multiply!</span>
            <span class="kd-win-sub"></span>
            <span class="kd-win-btns">
              <button type="button" class="kd-btn kd-btn--again">↻ Again</button>
              <button type="button" class="kd-btn kd-btn--back">Back to the duel</button>
            </span>
          </div>
        </div>
        <p class="kd-help">Tap or hold to jump <span class="ce-emoji">👆</span> Mind the Trap Holes!</p>
      </div>
    `
  });
  if (!overlay) return; // reduced motion: the sound has already played

  lpEgg.busy = true;
  kd.overlay = overlay;
  kdStartGame(overlay);
}

function kdStartGame(overlay) {
  const canvas = overlay.querySelector('.kd-canvas');
  const g = canvas.getContext('2d');
  const hud = {
    attempt: overlay.querySelector('.kd-attempt'),
    fill: overlay.querySelector('.kd-fill'),
    pct: overlay.querySelector('.kd-pct'),
    winSub: overlay.querySelector('.kd-win-sub')
  };
  const game = {
    attempt: 1, best: 0, holding: false, sprite: null, tile: 40, dpr: 1,
    crowd: [], bits: [], swarm: [], deathText: '', deathAt: 0,
    last: performance.now(), acc: 0, time: 0, nextBeatAt: 0, beat: 0
  };

  const resize = () => {
    const w = Math.min(canvas.parentElement.clientWidth, 720);
    game.tile = w / KD_VIEW_W;
    game.dpr = Math.min(window.devicePixelRatio || 1, FX_LITE ? 1.5 : 2);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${game.tile * KD_VIEW_H}px`;
    canvas.width = Math.round(w * game.dpr);
    canvas.height = Math.round(game.tile * KD_VIEW_H * game.dpr);
    game.sprite = kdMakeKuribohSprite(Math.ceil(game.tile * game.dpr * 1.1));
  };

  const reset = () => {
    Object.assign(game, { x: 0, y: 0, vy: 0, rot: 0, grounded: true, state: 'run', orbs: new Set(), pads: new Set(), runTime: 0 });
    hud.attempt.textContent = `Attempt ${game.attempt}`;
    game.nextBeatAt = 0;
    game.beat = 0;
  };

  const die = reason => {
    game.state = 'dead';
    game.deathAt = game.time;
    game.deathText = reason === 'pit' ? 'Trap Hole!' : cePick(['Kuri-kuri!', 'Kuriii…!', 'Kuri?!']);
    const cx = game.x + 0.5;
    const cy = game.y + 0.5;
    game.bits = Array.from({ length: fxCount(18) }, () => ({
      x: cx, y: cy, vx: ceRand(-6, 6), vy: ceRand(2, 12), s: ceRand(0.08, 0.2)
    }));
    if (game.crowd.length < KD_CROWD_MAX) {
      game.crowd.push({ x: ceRand(0.3, KD_VIEW_W - 0.3), y: ceRand(1.2, KD_GROUND_Y - 2.6), s: ceRand(0.35, 0.6), ph: ceRand(0, 6), born: game.time });
    }
    playSound({ name: 'kd-death', pit: reason === 'pit' });
    setTimeout(() => {
      if (!overlay.isConnected) return;
      game.attempt += 1;
      reset();
    }, KD_RESPAWN_MS);
  };

  const win = () => {
    game.state = 'won';
    game.best = 100;
    overlay.classList.add('is-won');
    hud.winSub.textContent = game.attempt === 1
      ? 'First try! The Heart of the Cards is strong with you.'
      : `${game.attempt} attempts. ${game.attempt - 1} Kuriboh${game.attempt === 2 ? '' : 's'} multiplied along the way.`;
    game.swarm = Array.from({ length: fxCount(36) }, (_, i) => ({
      x: game.x + 0.5, y: game.y + 0.5, vx: ceRand(-7, 7), vy: ceRand(6, 16), s: ceRand(0.35, 0.75), r: ceRand(-6, 6), d: i * 0.02
    }));
    playSound({ name: 'kd-win' });
  };

  const jump = v => {
    game.vy = v;
    game.grounded = false;
  };

  // One fixed physics step. Kuriboh's box: [x, x+1] x [y, y+1] in tiles.
  const step = dt => {
    const prevY = game.y;
    game.vy -= KD_GRAVITY * dt;
    game.y += game.vy * dt;
    game.x += KD_SPEED * dt;
    game.grounded = false;

    const x0 = Math.floor(game.x);
    for (let cx = x0 - 1; cx <= x0 + 2; cx++) {
      for (let cy = Math.max(0, Math.floor(game.y) - 1); cy <= Math.floor(game.y) + 2; cy++) {
        const cell = kdCell(cx, cy);
        if (cell === '#' && kdOverlap(game.x + 0.06, game.y, 0.88, 0.92, cx, cy, 1, 1)) {
          const top = cy + 1;
          if (game.vy <= 0 && prevY >= top - 0.3) {
            game.y = top;
            game.vy = 0;
            game.grounded = true;
          } else {
            return die('wall');
          }
        } else if (cell === '^' && kdOverlap(game.x + 0.18, game.y + 0.1, 0.64, 0.72, cx + 0.32, cy, 0.36, 0.6)) {
          return die('spike');
        } else if (cell === 'o' && !game.orbs.has(`${cx},${cy}`) && game.holding
          && kdOverlap(game.x - 0.1, game.y - 0.1, 1.2, 1.2, cx - 0.1, cy - 0.1, 1.2, 1.2)) {
          game.orbs.add(`${cx},${cy}`);
          jump(KD_ORB_V);
          playSound({ name: 'kd-orb' });
        } else if (cell === 'p' && !game.pads.has(cx) && kdOverlap(game.x + 0.1, game.y, 0.8, 0.5, cx, cy, 1, 0.3)) {
          game.pads.add(cx);
          jump(KD_PAD_V);
          playSound({ name: 'kd-pad' });
        }
      }
    }

    const onFloor = kdHasFloor(Math.floor(game.x + 0.12)) || kdHasFloor(Math.floor(game.x + 0.88));
    if (game.y <= 0 && prevY >= -0.3 && onFloor && game.vy <= 0) {
      game.y = 0;
      game.vy = 0;
      game.grounded = true;
    }
    if (game.y < -0.6) return die('pit');

    if (game.grounded) {
      game.rot = Math.round(game.rot / (Math.PI / 2)) * (Math.PI / 2);
      if (game.holding) jump(KD_JUMP_V);
    } else {
      game.rot += dt * Math.PI * 2.1;
    }

    const pct = Math.min(100, Math.floor((game.x / KD_LEVEL.goal) * 100));
    game.best = Math.max(game.best, pct);
    if (game.x >= KD_LEVEL.goal) win();
  };

  // Music: one beat at a time, slightly ahead, so it stops with the run.
  const scheduleMusic = () => {
    if (typeof sfxCtx === 'undefined' || !sfxCtx || game.state !== 'run') return;
    const now = sfxCtx.currentTime;
    if (game.nextBeatAt < now) game.nextBeatAt = now + 0.05;
    while (game.nextBeatAt < now + 0.12) {
      playSound({ name: 'kd-beat', at: game.nextBeatAt, beat: game.beat });
      game.nextBeatAt += KD_BEAT_S;
      game.beat += 1;
    }
  };

  const draw = () => {
    const T = game.tile * game.dpr;
    const W = canvas.width;
    const H = canvas.height;
    const camX = (game.state === 'won' ? Math.min(game.x, KD_LEVEL.goal) : game.x) - KD_PLAYER_SCREEN_X;
    const sx = wx => (wx - camX) * T;
    const sy = wy => (KD_GROUND_Y - wy) * T;
    const pulse = game.state === 'run' ? Math.pow(1 - ((game.runTime % KD_BEAT_S) / KD_BEAT_S), 3) : 0;

    const sky = g.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#1e0b3a');
    sky.addColorStop(0.7, `rgb(${76 + pulse * 30} 29 ${149 + pulse * 30})`);
    sky.addColorStop(1, '#0b0418');
    g.fillStyle = sky;
    g.fillRect(0, 0, W, H);

    // Parallax pyramids and the Millennium Eye.
    g.fillStyle = 'rgb(15 5 30 / 0.55)';
    for (let i = -1; i < 6; i++) {
      const base = (i * 6 - (camX * 0.2) % 6) * T;
      g.beginPath();
      g.moveTo(base, sy(0));
      g.lineTo(base + 2.2 * T, sy(2.6 + (i % 2) * 0.8));
      g.lineTo(base + 4.4 * T, sy(0));
      g.fill();
    }
    g.save();
    g.globalAlpha = 0.25 + pulse * 0.25;
    g.strokeStyle = '#fbbf24';
    g.lineWidth = T * 0.06;
    g.beginPath();
    g.ellipse(W * 0.78, T * 1.3, T * 0.8, T * 0.42, 0, 0, Math.PI * 2);
    g.stroke();
    g.fillStyle = '#fbbf24';
    g.beginPath();
    g.arc(W * 0.78, T * 1.3, T * 0.22, 0, Math.PI * 2);
    g.fill();
    g.restore();

    // The multiplied Kuriboh crowd (one per death).
    game.crowd.forEach(k => {
      const pop = Math.min(1, (game.time - k.born) / 0.3);
      const s = k.s * T * (pop < 1 ? 0.3 + pop * 0.9 : 1 + pulse * 0.08);
      g.globalAlpha = 0.55;
      g.drawImage(game.sprite, k.x * T - s / 2, (k.y + Math.sin(game.time * 4 + k.ph) * 0.15) * T - s / 2, s, s);
    });
    g.globalAlpha = 1;

    // Level tiles.
    const from = Math.floor(camX) - 1;
    const to = Math.ceil(camX + KD_VIEW_W) + 1;
    g.fillStyle = '#1a0a2e';
    g.fillRect(0, sy(0), W, H - sy(0));
    for (let x = from; x <= to; x++) {
      if (!kdHasFloor(x)) {
        const hole = g.createLinearGradient(0, sy(0), 0, H);
        hole.addColorStop(0, '#000');
        hole.addColorStop(1, 'rgb(134 25 143 / 0.6)');
        g.fillStyle = hole;
        g.fillRect(sx(x), sy(0), T + 1, H - sy(0));
        continue;
      }
      g.fillStyle = x % 2 ? '#2a1250' : '#24104a';
      g.fillRect(sx(x), sy(0), T + 1, T * 1.5);
      g.fillStyle = '#fbbf24';
      g.fillRect(sx(x), sy(0), T + 1, T * 0.05);
      for (let y = 0; y < KD_LEVEL.cols[x]?.cells.length; y++) kdDrawCell(g, kdCell(x, y), sx(x), sy(y + 1), T, game, `${x},${y}`, x);
    }
    const goalX = sx(KD_LEVEL.goal);
    if (goalX < W + T) {
      const portal = g.createLinearGradient(goalX - T, 0, goalX + T, 0);
      portal.addColorStop(0, 'rgb(251 191 36 / 0)');
      portal.addColorStop(0.5, 'rgb(253 230 138 / 0.85)');
      portal.addColorStop(1, 'rgb(251 191 36 / 0)');
      g.fillStyle = portal;
      g.fillRect(goalX - T, 0, T * 2, sy(0));
    }

    // "Attempt N" painted in the world at the start, like the real thing.
    g.fillStyle = 'rgb(255 255 255 / 0.85)';
    g.font = `900 ${T * 0.62}px Cinzel, serif`;
    g.textAlign = 'left';
    g.fillText(`Attempt ${game.attempt}`, sx(KD_PLAYER_SCREEN_X + 1.2), sy(3.4));

    if (game.state !== 'dead') {
      const s = T * 1.1;
      g.save();
      g.translate(sx(game.x + 0.5), sy(game.y + 0.5));
      g.rotate(game.rot);
      g.drawImage(game.sprite, -s / 2, -s / 2, s, s);
      g.restore();
    } else {
      const age = game.time - game.deathAt;
      g.fillStyle = '#6b3d16';
      game.bits.forEach(b => {
        g.beginPath();
        g.arc(sx(b.x + b.vx * age), sy(b.y + b.vy * age - 20 * age * age), b.s * T, 0, Math.PI * 2);
        g.fill();
      });
      g.globalAlpha = Math.max(0, 1 - age / 0.9);
      g.fillStyle = '#fff';
      g.strokeStyle = '#3b0764';
      g.lineWidth = T * 0.1;
      g.font = `900 ${T * 0.7}px Cinzel, serif`;
      g.textAlign = 'center';
      const tx = sx(game.x + 0.5);
      const ty = sy(game.y + 1.8 + age);
      g.strokeText(game.deathText, tx, ty);
      g.fillText(game.deathText, tx, ty);
      g.globalAlpha = 1;
    }

    if (game.state === 'won') {
      const age = game.time - game.wonAt;
      game.swarm.forEach(k => {
        const t = Math.max(0, age - k.d);
        const s = k.s * T * Math.min(1, t * 4);
        g.save();
        g.translate(sx(k.x + k.vx * t), sy(k.y + k.vy * t - 9 * t * t));
        g.rotate(k.r * t);
        g.drawImage(game.sprite, -s / 2, -s / 2, s, s);
        g.restore();
      });
    }

    const pct = game.state === 'won' ? 100 : Math.min(100, Math.floor((game.x / KD_LEVEL.goal) * 100));
    hud.fill.style.width = `${pct}%`;
    hud.pct.textContent = game.best > pct ? `${pct}% · best ${game.best}%` : `${pct}%`;
  };

  const loop = now => {
    if (!overlay.isConnected) return kdClose();
    const dt = Math.min(0.05, (now - game.last) / 1000);
    game.last = now;
    game.time += dt;
    if (game.state === 'run') {
      game.acc += dt;
      while (game.acc >= KD_STEP && game.state === 'run') {
        step(KD_STEP);
        game.runTime += KD_STEP;
        game.acc -= KD_STEP;
      }
      if (game.state === 'won') game.wonAt = game.time;
      scheduleMusic();
    } else {
      game.acc = 0;
    }
    draw();
    kd.frame = requestAnimationFrame(loop);
  };

  const press = e => {
    if (e.target.closest('button')) return;
    e.preventDefault();
    game.holding = true;
  };
  const release = () => { game.holding = false; };
  const key = e => {
    if (e.code !== 'Space' && e.code !== 'ArrowUp') return;
    e.preventDefault();
    game.holding = e.type === 'keydown';
  };
  overlay.addEventListener('pointerdown', press);
  window.addEventListener('pointerup', release);
  window.addEventListener('pointercancel', release);
  window.addEventListener('keydown', key);
  window.addEventListener('keyup', key);
  window.addEventListener('resize', resize);
  overlay.querySelector('.kd-quit').addEventListener('click', kdClose);
  overlay.querySelector('.kd-btn--back').addEventListener('click', kdClose);
  overlay.querySelector('.kd-btn--again').addEventListener('click', () => {
    overlay.classList.remove('is-won');
    game.attempt = 1;
    game.best = 0;
    game.crowd = [];
    game.holding = false;
    reset();
    playSound({ name: 'kd-start' });
  });
  kd.cleanup = () => {
    window.removeEventListener('pointerup', release);
    window.removeEventListener('pointercancel', release);
    window.removeEventListener('keydown', key);
    window.removeEventListener('keyup', key);
    window.removeEventListener('resize', resize);
  };

  resize();
  reset();
  kd.frame = requestAnimationFrame(loop);
}

function kdDrawCell(g, cell, x, y, T, game, id, col) {
  if (cell === '#') {
    // A face-down card back: brown, gold rim, the dark swirl oval.
    g.fillStyle = '#7c4a1e';
    g.fillRect(x + T * 0.04, y + T * 0.04, T * 0.92, T * 0.92);
    g.strokeStyle = '#fbbf24';
    g.lineWidth = T * 0.06;
    g.strokeRect(x + T * 0.07, y + T * 0.07, T * 0.86, T * 0.86);
    g.fillStyle = '#1c0f05';
    g.beginPath();
    g.ellipse(x + T / 2, y + T / 2, T * 0.26, T * 0.32, 0, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = '#b45309';
    g.lineWidth = T * 0.03;
    g.beginPath();
    g.ellipse(x + T / 2, y + T / 2, T * 0.16, T * 0.2, 0.6, 0, Math.PI * 1.5);
    g.stroke();
  } else if (cell === '^') {
    g.fillStyle = '#be185d';
    g.strokeStyle = '#fdf2f8';
    g.lineWidth = T * 0.05;
    g.beginPath();
    g.moveTo(x + T * 0.1, y + T);
    g.lineTo(x + T * 0.5, y + T * 0.08);
    g.lineTo(x + T * 0.9, y + T);
    g.closePath();
    g.fill();
    g.stroke();
  } else if (cell === 'o') {
    const used = game.orbs.has(id);
    const r = T * (0.38 + (used ? 0 : Math.sin(game.time * 8) * 0.04));
    g.save();
    g.globalAlpha = used ? 0.35 : 1;
    g.shadowColor = '#fde047';
    g.shadowBlur = T * 0.4;
    g.strokeStyle = '#fde047';
    g.lineWidth = T * 0.09;
    g.beginPath();
    g.arc(x + T / 2, y + T / 2, r, 0, Math.PI * 2);
    g.stroke();
    g.shadowBlur = 0;
    g.lineWidth = T * 0.05;
    g.beginPath();
    g.ellipse(x + T / 2, y + T / 2, r * 0.6, r * 0.32, 0, 0, Math.PI * 2);
    g.stroke();
    g.fillStyle = '#fde047';
    g.beginPath();
    g.arc(x + T / 2, y + T / 2, r * 0.18, 0, Math.PI * 2);
    g.fill();
    g.restore();
  } else if (cell === 'p') {
    const used = game.pads.has(col);
    g.fillStyle = used ? '#a16207' : '#facc15';
    g.shadowColor = '#facc15';
    g.shadowBlur = used ? 0 : T * 0.3;
    g.beginPath();
    g.ellipse(x + T / 2, y + T, T * 0.42, T * 0.2, 0, Math.PI, Math.PI * 2);
    g.fill();
    g.shadowBlur = 0;
  }
}

function kdClose() {
  cancelAnimationFrame(kd.frame);
  kd.cleanup?.();
  kd.cleanup = null;
  kd.overlay?.remove();
  kd.overlay = null;
  lpEgg.busy = false;
  // The overlay covered the button, so the hold's click may never have arrived.
  lpEgg.swallowClick = false;
}
