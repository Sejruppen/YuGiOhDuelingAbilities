// Start screen easter egg: hold "Solo: Duelist's Road" for START_EGG_PRESS_MS
// and the Paradox Brothers' Labyrinth opens, a small top-down maze game.
// Every run is a fresh random maze in the dark: you (the Millennium Puzzle)
// only see a few tiles around you, and the Puzzle in the HUD glows brighter
// the closer you are to the exit.
//  - Wall Shadow hides in a few walls. Come close and the wall flickers, then
//    a shadow claw lunges into the corridor next to it for a moment.
//  - Picking up the first Star Chip wakes Jirai Gumo. Every so often it drops
//    from the ceiling in a corridor in line with you, takes aim and charges
//    straight at you (a little slower than you run). Dodge out of its line
//    and it slams into a wall, climbs back up and is gone for a while.
//  - "Paradox!": every so often the brothers swap your left and right.
//  - At the exit, Para and Dox guard two doors: one leads out, one to the
//    Shadow Realm. One brother always lies, the other always tells the truth,
//    and you get ONE question. Only "Which door would your brother say is the
//    exit?" helps: it always points at the wrong door.
// Escaping saves the best Star Chip count. Sounds: 'lb-*' in COOP_SOUNDS.
// CSS: "Paradox Labyrinth" in effects.css.
const LB_SAFETY_MS = 30 * 60 * 1000;
const LB_CELLS_W = 6;
const LB_CELLS_H = 9;
const LB_W = LB_CELLS_W * 2 + 1; // tiles
const LB_H = LB_CELLS_H * 2 + 1;
const LB_STEP_S = 0.14; // seconds per tile
const LB_SPIDER_STEP_S = 0.16; // charging, a little slower than the player
const LB_EXTRA_LOOPS = 7; // walls knocked out after carving, so there are side paths to dodge into
const LB_CHIPS = 5;
const LB_SHADOWS = 4;
const LB_SHADOW_RANGE = 3; // tiles (Manhattan) that wake a Wall Shadow
const LB_SHADOW_WARN_S = 0.55;
const LB_SHADOW_LUNGE_S = 0.9;
const LB_SHADOW_REST_S = 2.5;
const LB_SPIDER_FIRST_S = 0.6; // after the first Star Chip
const LB_SPIDER_DROP_S = 0.9;
const LB_SPIDER_AIM_S = 0.45;
const LB_SPIDER_CLIMB_S = 1;
const LB_SPIDER_GONE_S = [5, 9];
const LB_SPIDER_RETRY_S = 0.8; // no straight corridor to land in: look again soon
const LB_SPIDER_LINE = [3, 6]; // tiles between you and where it lands
const LB_PARADOX_FIRST_S = 9;
const LB_PARADOX_GAP_S = [10, 15];
const LB_PARADOX_S = 4;
const LB_FOG_IN = 2.2; // tiles
const LB_FOG_OUT = 3.8;
const LB_END_DELAY_MS = 900;
const LB_DOOR_OPEN_MS = 1100;
const LB_BEST_KEY = 'ygo_lb_best';
const LB_DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
const LB_BROS = ['Para', 'Dox'];

// answer(truthful, exit) -> the door (0 left, 1 right) the asked brother names.
const LB_QUESTIONS = [
  { text: '"Which door is the exit?"', answer: (truthful, exit) => (truthful ? exit : 1 - exit) },
  {
    text: '"Which door would your brother say is the exit?"',
    answer: (truthful, exit) => {
      const brotherSays = truthful ? 1 - exit : exit;
      return truthful ? brotherSays : 1 - brotherSays;
    }
  },
  { text: '"Are you the one who lies?"', answer: null }
];
const LB_WISE_QUESTION = 1;

const LB_PUZZLE_SVG = `
  <svg viewBox="0 0 40 40" aria-hidden="true">
    <path d="M4 8 H36 L20 36 Z" fill="#fbbf24" stroke="#78350f" stroke-width="2.5" stroke-linejoin="round"/>
    <ellipse cx="20" cy="16" rx="6" ry="3.2" fill="#78350f"/>
    <circle cx="20" cy="16" r="1.6" fill="#fef3c7"/>
  </svg>
`;

// One of the twins: bald, kanji on the forehead (Para 迷, Dox 宮 = "labyrinth"),
// a high meander collar, black sleeves and crossed arms. Dox's body is
// mirrored so they face each other; the kanji stays readable.
const lbBrotherSvg = ({ robe, collar, cuff, kanji, grin, flip }) => `
  <svg viewBox="0 0 80 100" aria-hidden="true">
    <g stroke="#0f172a" stroke-linejoin="round" stroke-linecap="round"${flip ? ' transform="translate(80 0) scale(-1 1)"' : ''}>
      <path d="M4 100 C4 80 12 70 26 66 L54 66 C68 70 76 80 76 100 Z" fill="${robe}" stroke-width="2"/>
      <path d="M52 67 L33 82 M24 68 L18 100" fill="none" stroke="#f1f5f9" stroke-width="2.4"/>
      <path d="M33 50 L33 60 L47 60 L47 50 Z" fill="#b98556" stroke-width="1.5"/>
      <path d="M27 56 L27 69 Q40 74 53 69 L53 56 Q40 61 27 56 Z" fill="${collar}" stroke-width="2"/>
      <path d="M30 67 v-4 h4 v2.4 h-2 M37 68 v-4 h4 v2.4 h-2 M44 67 v-4 h4 v2.4 h-2" fill="none" stroke-width="1.1"/>
      <path d="M68 74 C60 84 36 86 16 83 L15 93 C36 96 62 93 73 84 Z" fill="#27272a" stroke-width="2"/>
      <path d="M6 81 L18 82 L17 94 L5 93 Z" fill="${cuff}" stroke-width="1.6"/>
      <circle cx="5" cy="87.5" r="4.6" fill="#d6a06f" stroke-width="1.6"/>
      <path d="M11 73 C19 86 44 88 62 86 L62 96 C42 98 16 95 6 83 Z" fill="#3f3f46" stroke-width="2"/>
      <path d="M61 85 L73 85 L73 97 L61 97 Z" fill="${cuff}" stroke-width="1.6"/>
      <circle cx="75" cy="91" r="4.6" fill="#d6a06f" stroke-width="1.6"/>
      <ellipse cx="23" cy="36" rx="3.4" ry="5.5" fill="#c8915f" stroke-width="1.6"/>
      <ellipse cx="57" cy="36" rx="3.4" ry="5.5" fill="#c8915f" stroke-width="1.6"/>
      <path d="M23 31 C22 14 30 7 40 7 C50 7 58 14 57 31 C57 45 50 55 40 56 C30 55 23 45 23 31 Z" fill="#d9a877" stroke-width="2"/>
      <path d="M50 12 C56 18 58 28 55 40 C53 48 48 53 42 55 C50 46 53 30 50 12 Z" fill="#b98556" stroke="none"/>
      <ellipse cx="34" cy="15" rx="6" ry="3.2" fill="#fff" opacity="0.3" stroke="none"/>
      <path d="M27 31 L37 35 M43 35 L53 31" fill="none" stroke-width="2.8"/>
      <path d="M29 37.5 Q33 35.5 37 38 Q33 39.5 29 37.5 Z M43 38 Q47 35.5 51 37.5 Q47 39.5 43 38 Z" fill="#fff" stroke-width="1.2"/>
      <circle cx="35" cy="37.7" r="1.3" fill="#0f172a" stroke="none"/>
      <circle cx="49" cy="37.7" r="1.3" fill="#0f172a" stroke="none"/>
      <path d="M41 38 L38.5 45.5 L42 46" fill="none" stroke-width="1.4"/>
      <path d="M29 44 Q30 48 32 50 M51 43 Q52 46 51 48" fill="none" stroke-width="1.1"/>
      ${grin
        ? '<path d="M32 49 Q41 55 50 47 Q42 51 32 49 Z" fill="#fff" stroke-width="1.6"/>'
        : '<path d="M33 50 Q42 53 50 47" fill="none" stroke-width="1.8"/>'}
    </g>
    <text x="40" y="24" text-anchor="middle" font-size="10" font-weight="900" fill="#0f172a"
      font-family="'Noto Sans CJK JP', 'Hiragino Sans', 'Yu Gothic', 'Microsoft YaHei', sans-serif">${kanji}</text>
  </svg>
`;
const LB_PARA_SVG = lbBrotherSvg({ robe: '#c8743f', collar: '#9a4f22', cuff: '#ecc9a0', kanji: '迷', grin: true, flip: false });
const LB_DOX_SVG = lbBrotherSvg({ robe: '#4fb37f', collar: '#2f8a5b', cuff: '#bfe8d2', kanji: '宮', grin: false, flip: true });

const lb = { overlay: null, frame: null, cleanup: null };

function playParadoxLabyrinthEgg() {
  markEggFound('paradox-labyrinth');
  playSound({ name: 'lb-start' });

  const door = (i, name) => `
    <button type="button" class="lb-door" data-door="${i}" disabled>
      <span class="lb-door-glow"></span>
      <span class="lb-leaf lb-leaf--l"></span>
      <span class="lb-leaf lb-leaf--r"></span>
      <span class="lb-door-name">${name}</span>
    </button>
  `;
  const overlay = spawnFx('fx-cegg fx-lb', LB_SAFETY_MS, {
    html: `
      <div class="lb-bg"></div>
      <div class="lb-wrap">
        <div class="lb-hud">
          <span class="lb-title">The Labyrinth</span>
          <span class="lb-chips"><span class="ce-emoji">⭐</span> <span class="lb-chips-n">0/${LB_CHIPS}</span></span>
          <span class="lb-puzzle" title="The Millennium Puzzle glows near the exit">${LB_PUZZLE_SVG}</span>
          <button type="button" class="lb-quit" aria-label="Leave the Labyrinth">✕</button>
        </div>
        <div class="lb-stage">
          <canvas class="lb-canvas"></canvas>
          <div class="lb-paradox"><b>Paradox!</b><span>Left is right and right is left!</span></div>
          <div class="lb-riddle">
            <div class="lb-doors">${door(0, 'Left door')}${door(1, 'Right door')}</div>
            <div class="lb-bros">
              <button type="button" class="lb-bro" data-bro="0">${LB_PARA_SVG}<b>Para</b></button>
              <button type="button" class="lb-bro" data-bro="1">${LB_DOX_SVG}<b>Dox</b></button>
            </div>
            <p class="lb-say"></p>
            <div class="lb-asks"></div>
          </div>
          <div class="lb-end">
            <span class="lb-end-bros">
              <span class="lb-end-bro lb-end-bro--l">${LB_PARA_SVG}</span>
              <span class="lb-end-bro lb-end-bro--r">${LB_DOX_SVG}</span>
            </span>
            <b class="lb-end-title"></b>
            <span class="lb-end-sub"></span>
            <span class="lb-end-btns">
              <button type="button" class="lb-btn lb-btn--again">↻ New maze</button>
              <button type="button" class="lb-btn lb-btn--back">Leave</button>
            </span>
          </div>
        </div>
        <div class="lb-pad">
          <button type="button" class="lb-key lb-key--up" data-dir="up" aria-label="Up">▲</button>
          <button type="button" class="lb-key lb-key--left" data-dir="left" aria-label="Left">◀</button>
          <button type="button" class="lb-key lb-key--down" data-dir="down" aria-label="Down">▼</button>
          <button type="button" class="lb-key lb-key--right" data-dir="right" aria-label="Right">▶</button>
        </div>
        <p class="lb-help">Grab the <span class="ce-emoji">⭐</span> and find the gate. Something sleeps on the ceiling…</p>
      </div>
    `
  });
  if (!overlay) return; // reduced motion: the sound has already played

  startEgg.busy = true;
  lb.overlay = overlay;
  lbStartGame(overlay);
}

// --- The maze ---------------------------------------------------------------------

const lbIsOpen = (open, x, y) => y >= 0 && y < LB_H && x >= 0 && x < LB_W && open[y][x];
const lbPos = e => ({ x: e.fx + (e.x - e.fx) * e.p, y: e.fy + (e.y - e.fy) * e.p });

function lbShuffle(list) {
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

// A depth-first maze on a cell grid (cells sit on odd tiles), plus a few
// extra openings so there are loops to run around.
function lbCarveMaze() {
  const open = Array.from({ length: LB_H }, () => Array(LB_W).fill(false));
  const seen = new Set([`0,${LB_CELLS_H - 1}`]);
  const stack = [[0, LB_CELLS_H - 1]];
  open[LB_H - 2][1] = true;
  while (stack.length) {
    const [cx, cy] = stack[stack.length - 1];
    const next = Object.values(LB_DIRS)
      .map(([dx, dy]) => [cx + dx, cy + dy])
      .filter(([x, y]) => x >= 0 && y >= 0 && x < LB_CELLS_W && y < LB_CELLS_H && !seen.has(`${x},${y}`));
    if (!next.length) {
      stack.pop();
      continue;
    }
    const [nx, ny] = cePick(next);
    seen.add(`${nx},${ny}`);
    open[ny * 2 + 1][nx * 2 + 1] = true;
    open[cy + ny + 1][cx + nx + 1] = true;
    stack.push([nx, ny]);
  }
  const walls = [];
  for (let y = 1; y < LB_H - 1; y++) {
    for (let x = 1; x < LB_W - 1; x++) {
      if (!open[y][x] && x % 2 !== y % 2) walls.push([x, y]);
    }
  }
  lbShuffle(walls).slice(0, LB_EXTRA_LOOPS).forEach(([x, y]) => { open[y][x] = true; });
  return open;
}

// Path distance (in tiles) from one tile to every other; Infinity for walls.
function lbDistances(open, sx, sy) {
  const dist = Array.from({ length: LB_H }, () => Array(LB_W).fill(Infinity));
  dist[sy][sx] = 0;
  const queue = [[sx, sy]];
  for (let i = 0; i < queue.length; i++) {
    const [x, y] = queue[i];
    Object.values(LB_DIRS).forEach(([dx, dy]) => {
      const nx = x + dx;
      const ny = y + dy;
      if (lbIsOpen(open, nx, ny) && dist[ny][nx] === Infinity) {
        dist[ny][nx] = dist[y][x] + 1;
        queue.push([nx, ny]);
      }
    });
  }
  return dist;
}

// Star Chips prefer dead ends, so collecting them is a detour.
function lbPlaceChips(open, start, exit, fromStart) {
  const cells = [];
  for (let y = 1; y < LB_H; y += 2) {
    for (let x = 1; x < LB_W; x += 2) {
      if ((x === exit.x && y === exit.y) || fromStart[y][x] < 4) continue;
      const ways = Object.values(LB_DIRS).filter(([dx, dy]) => lbIsOpen(open, x + dx, y + dy)).length;
      cells.push({ x, y, deadEnd: ways === 1 });
    }
  }
  lbShuffle(cells).sort((a, b) => b.deadEnd - a.deadEnd);
  return new Set(cells.slice(0, LB_CHIPS).map(c => `${c.x},${c.y}`));
}

// A Wall Shadow lives in wall tile (wx, wy) and lunges into corridor (cx, cy).
function lbPlaceShadows(open, exit, fromStart) {
  const spots = [];
  for (let y = 0; y < LB_H; y++) {
    for (let x = 0; x < LB_W; x++) {
      if (open[y][x]) continue;
      Object.values(LB_DIRS).forEach(([dx, dy]) => {
        const cx = x + dx;
        const cy = y + dy;
        if (!lbIsOpen(open, cx, cy) || fromStart[cy][cx] < 5) return;
        if (Math.abs(cx - exit.x) + Math.abs(cy - exit.y) < 3) return;
        spots.push({ wx: x, wy: y, cx, cy });
      });
    }
  }
  const picked = [];
  lbShuffle(spots).forEach(s => {
    if (picked.length >= LB_SHADOWS) return;
    if (picked.some(p => Math.abs(p.cx - s.cx) + Math.abs(p.cy - s.cy) < 6)) return;
    picked.push({ ...s, state: 'idle', t: 0, restUntil: 0 });
  });
  return picked;
}

function lbBest() {
  try {
    return Number(localStorage.getItem(LB_BEST_KEY)) || 0;
  } catch {
    return 0;
  }
}

function lbSaveBest(n) {
  try {
    localStorage.setItem(LB_BEST_KEY, String(n));
  } catch {}
}

// --- The game ---------------------------------------------------------------------

function lbStartGame(overlay) {
  const canvas = overlay.querySelector('.lb-canvas');
  const stage = overlay.querySelector('.lb-stage');
  const g = canvas.getContext('2d');
  const ui = {
    chipsBox: overlay.querySelector('.lb-chips'),
    chips: overlay.querySelector('.lb-chips-n'),
    puzzle: overlay.querySelector('.lb-puzzle'),
    say: overlay.querySelector('.lb-say'),
    asks: overlay.querySelector('.lb-asks'),
    endTitle: overlay.querySelector('.lb-end-title'),
    endSub: overlay.querySelector('.lb-end-sub')
  };
  const view = { tile: 24, dpr: 1, maze: null };
  let game = null;
  let last = performance.now();

  const resize = () => {
    const maxW = Math.min(overlay.querySelector('.lb-wrap').clientWidth - 8, 520);
    const maxH = window.innerHeight - 210; // HUD, arrow pad and help line
    view.tile = Math.max(12, Math.floor(Math.min(maxW / LB_W, maxH / LB_H)));
    view.dpr = Math.min(window.devicePixelRatio || 1, FX_LITE ? 1.5 : 2);
    canvas.style.width = `${view.tile * LB_W}px`;
    canvas.style.height = `${view.tile * LB_H}px`;
    canvas.width = Math.round(view.tile * LB_W * view.dpr);
    canvas.height = Math.round(view.tile * LB_H * view.dpr);
    if (game) view.maze = lbPaintMaze(game.open, view.tile * view.dpr);
  };

  const paintPuzzle = () => {
    const d = game.toExit[game.pl.y][game.pl.x];
    const near = Math.max(0, Math.min(1, 1 - d / game.maxExit));
    ui.puzzle.style.setProperty('--lb-glow', near.toFixed(2));
  };

  const newGame = () => {
    const open = lbCarveMaze();
    const start = { x: 1, y: LB_H - 2 };
    const exit = { x: LB_W - 2, y: 1 };
    const fromStart = lbDistances(open, start.x, start.y);
    const toExit = lbDistances(open, exit.x, exit.y);
    game = {
      open, exit, toExit,
      maxExit: toExit[start.y][start.x],
      chips: lbPlaceChips(open, start, exit, fromStart),
      shadows: lbPlaceShadows(open, exit, fromStart),
      got: 0,
      pl: { x: start.x, y: start.y, fx: start.x, fy: start.y, p: 1 },
      held: null, queued: null, spider: null,
      time: 0, paradoxAt: LB_PARADOX_FIRST_S, paradoxUntil: 0,
      state: 'play', riddle: null
    };
    overlay.classList.remove('is-riddle', 'is-end', 'is-won', 'is-paradox');
    ui.chips.textContent = `0/${LB_CHIPS}`;
    view.maze = lbPaintMaze(open, view.tile * view.dpr);
    paintPuzzle();
  };

  const showEnd = (won, title, sub) => {
    ui.endTitle.textContent = title;
    ui.endSub.textContent = sub;
    overlay.classList.toggle('is-won', won);
    overlay.classList.add('is-end');
  };

  const die = reason => {
    if (game.state !== 'play') return;
    const run = game;
    game.state = 'dead';
    overlay.classList.remove('is-paradox');
    restartClass(stage, 'is-hit', 600);
    playSound({ name: 'lb-death', reason });
    setTimeout(() => {
      if (game !== run || !overlay.isConnected) return;
      showEnd(false,
        reason === 'spider' ? 'Jirai Gumo got you!' : 'The Wall Shadow got you!',
        'Para & Dox: "Hehehe… nobody escapes our Labyrinth!"');
    }, LB_END_DELAY_MS);
  };

  // Jirai Gumo lands in a straight corridor 3-6 tiles from you, facing you.
  const dropSpider = sp => {
    const spots = [];
    Object.entries(LB_DIRS).forEach(([, [dx, dy]]) => {
      for (let k = 1; k <= LB_SPIDER_LINE[1]; k++) {
        const x = game.pl.x + dx * k;
        const y = game.pl.y + dy * k;
        if (!lbIsOpen(game.open, x, y)) break;
        if (k >= LB_SPIDER_LINE[0] && !(x === game.exit.x && y === game.exit.y)) spots.push({ x, y, dir: [-dx, -dy] });
      }
    });
    if (!spots.length) {
      sp.t = 0;
      sp.wait = LB_SPIDER_RETRY_S;
      return;
    }
    const spot = cePick(spots);
    Object.assign(sp, { state: 'drop', t: 0, x: spot.x, y: spot.y, fx: spot.x, fy: spot.y, p: 1, dir: spot.dir, steps: 0 });
    playSound({ name: 'lb-drop' });
    const run = game;
    setTimeout(() => {
      if (game === run) restartClass(stage, 'is-quake', 450);
    }, LB_SPIDER_DROP_S * 1000 - 50);
  };

  // --- The riddle ---
  const openRiddle = () => {
    game.state = 'riddle';
    game.held = null;
    game.riddle = { exit: Math.random() < 0.5 ? 0 : 1, liar: Math.random() < 0.5 ? 0 : 1, bro: null, q: null, asked: false, picked: false };
    overlay.querySelectorAll('.lb-door').forEach(el => {
      el.disabled = true;
      el.className = 'lb-door';
    });
    overlay.querySelectorAll('.lb-bro').forEach(el => {
      el.disabled = false;
      el.className = 'lb-bro';
    });
    ui.say.innerHTML = '"One door leads out. The other leads to the Shadow Realm! One of us always tells the truth… and one of us always lies!"<small>Tap a brother to ask him ONE question.</small>';
    ui.asks.innerHTML = '';
    overlay.classList.remove('is-paradox');
    overlay.classList.add('is-riddle');
    playSound({ name: 'lb-door' });
  };

  const pickBrother = b => {
    const r = game.riddle;
    r.bro = b;
    overlay.querySelectorAll('.lb-bro').forEach((el, i) => {
      el.disabled = true;
      el.classList.toggle('is-asked', i === b);
      el.classList.toggle('is-dim', i !== b);
    });
    ui.say.innerHTML = `${LB_BROS[b]}: "Ask away… if you dare!"`;
    ui.asks.innerHTML = lbShuffle([0, 1, 2])
      .map(q => `<button type="button" class="lb-ask" data-q="${q}">${LB_QUESTIONS[q].text}</button>`)
      .join('');
    playSound({ name: 'lb-ask' });
  };

  const askQuestion = q => {
    const r = game.riddle;
    r.asked = true;
    r.q = q;
    overlay.querySelectorAll('.lb-ask').forEach(el => {
      el.disabled = true;
      el.classList.toggle('is-picked', Number(el.dataset.q) === q);
    });
    const name = LB_BROS[r.bro];
    const { answer } = LB_QUESTIONS[q];
    if (answer) {
      const door = answer(r.bro !== r.liar, r.exit);
      overlay.querySelector(`.lb-door[data-door="${door}"]`).classList.add('is-pointed');
      ui.say.innerHTML = `${name}: "The ${door ? 'right' : 'left'} door!"<small>Now choose a door.</small>`;
    } else {
      ui.say.innerHTML = `${name}: "No! Hehehe…"<br>${LB_BROS[1 - r.bro]}: "That's what we'd both say!"<small>Hmm. Now choose a door.</small>`;
    }
    overlay.querySelectorAll('.lb-door').forEach(el => { el.disabled = false; });
    playSound({ name: 'lb-ask' });
  };

  const pickDoor = d => {
    const r = game.riddle;
    const run = game;
    r.picked = true;
    const out = d === r.exit;
    overlay.querySelectorAll('.lb-door').forEach(el => { el.disabled = true; });
    overlay.querySelector(`.lb-door[data-door="${d}"]`).classList.add('is-open', out ? 'is-exit' : 'is-doom');
    playSound({ name: 'lb-door' });
    setTimeout(() => {
      if (game !== run || !overlay.isConnected) return;
      overlay.classList.remove('is-riddle');
      if (out) {
        game.state = 'won';
        const best = Math.max(lbBest(), game.got);
        lbSaveBest(best);
        playSound({ name: 'lb-win' });
        const luck = r.q === LB_WISE_QUESTION ? 'The Pharaoh would be proud.' : 'Lucky guess… or the Heart of the Cards?';
        showEnd(true, 'We\'ve been… outdueled!', `⭐ ${game.got}/${LB_CHIPS} Star Chips (best ${best}). ${luck}`);
      } else {
        game.state = 'lost';
        playSound({ name: 'lb-doom' });
        showEnd(false, 'Welcome to the Shadow Realm!', `Wrong door! ${LB_BROS[r.liar]} was the liar. Hehehe…`);
      }
    }, LB_DOOR_OPEN_MS);
  };

  const onRiddleClick = e => {
    const r = game.riddle;
    if (!r || game.state !== 'riddle') return;
    const bro = e.target.closest('.lb-bro');
    const ask = e.target.closest('.lb-ask');
    const door = e.target.closest('.lb-door');
    if (bro && r.bro === null) pickBrother(Number(bro.dataset.bro));
    else if (ask && !r.asked) askQuestion(Number(ask.dataset.q));
    else if (door && r.asked && !r.picked) pickDoor(Number(door.dataset.door));
  };

  // --- Movement ---
  const tryMove = () => {
    const pl = game.pl;
    let dir = game.held || game.queued;
    game.queued = null;
    if (!dir) return false;
    if (game.time < game.paradoxUntil && (dir === 'left' || dir === 'right')) dir = dir === 'left' ? 'right' : 'left';
    const [dx, dy] = LB_DIRS[dir];
    if (!lbIsOpen(game.open, pl.x + dx, pl.y + dy)) return false;
    Object.assign(pl, { fx: pl.x, fy: pl.y, x: pl.x + dx, y: pl.y + dy, p: 0 });
    return true;
  };

  const arrive = () => {
    const pl = game.pl;
    paintPuzzle();
    if (game.chips.delete(`${pl.x},${pl.y}`)) {
      game.got += 1;
      ui.chips.textContent = `${game.got}/${LB_CHIPS}`;
      restartClass(ui.chipsBox, 'is-bump', 400);
      playSound({ name: 'lb-chip' });
      if (!game.spider) game.spider = { state: 'gone', t: 0, wait: LB_SPIDER_FIRST_S };
    }
    if (pl.x === game.exit.x && pl.y === game.exit.y) openRiddle();
  };

  // gone -> drop (from the ceiling) -> aim -> charge (straight, until a wall)
  // -> climb (back up the wall) -> gone.
  const updateSpider = dt => {
    const sp = game.spider;
    if (!sp) return;
    sp.t += dt;
    if (sp.state === 'gone') {
      if (sp.t >= sp.wait) dropSpider(sp);
    } else if (sp.state === 'drop') {
      if (sp.t >= LB_SPIDER_DROP_S) Object.assign(sp, { state: 'aim', t: 0 });
    } else if (sp.state === 'aim') {
      if (sp.t >= LB_SPIDER_AIM_S) Object.assign(sp, { state: 'charge', t: 0 });
    } else if (sp.state === 'charge') {
      sp.p += dt / LB_SPIDER_STEP_S;
      if (sp.p < 1) return;
      const [dx, dy] = sp.dir;
      if (!lbIsOpen(game.open, sp.x + dx, sp.y + dy)) {
        Object.assign(sp, { state: 'climb', t: 0, p: 1 });
        playSound({ name: 'lb-climb' });
        return;
      }
      Object.assign(sp, { fx: sp.x, fy: sp.y, x: sp.x + dx, y: sp.y + dy, p: Math.min(sp.p - 1, 0.5) });
      sp.steps += 1;
      if (sp.steps % 3 === 0) playSound({ name: 'lb-skitter' });
    } else if (sp.t >= LB_SPIDER_CLIMB_S) {
      Object.assign(sp, { state: 'gone', t: 0, wait: ceRand(...LB_SPIDER_GONE_S) });
    }
  };

  const updateShadows = dt => {
    const pos = lbPos(game.pl);
    game.shadows.forEach(s => {
      s.t += dt;
      if (s.state === 'idle') {
        if (game.time >= s.restUntil && Math.abs(game.pl.x - s.cx) + Math.abs(game.pl.y - s.cy) <= LB_SHADOW_RANGE) {
          s.state = 'warn';
          s.t = 0;
          playSound({ name: 'lb-warn' });
        }
      } else if (s.state === 'warn') {
        if (s.t >= LB_SHADOW_WARN_S) {
          s.state = 'lunge';
          s.t = 0;
          playSound({ name: 'lb-lunge' });
        }
      } else {
        if (s.t > 0.08 && Math.hypot(pos.x - s.cx, pos.y - s.cy) < 0.6) die('shadow');
        if (s.t >= LB_SHADOW_LUNGE_S) {
          s.state = 'idle';
          s.restUntil = game.time + LB_SHADOW_REST_S;
        }
      }
    });
  };

  const update = dt => {
    game.time += dt;
    if (game.state !== 'play') return;

    if (game.time >= game.paradoxAt) {
      game.paradoxUntil = game.time + LB_PARADOX_S;
      game.paradoxAt = game.paradoxUntil + ceRand(...LB_PARADOX_GAP_S);
      overlay.classList.add('is-paradox');
      playSound({ name: 'lb-paradox' });
    } else if (game.time >= game.paradoxUntil && overlay.classList.contains('is-paradox')) {
      overlay.classList.remove('is-paradox');
    }

    const pl = game.pl;
    let spare = 0;
    if (pl.p < 1) {
      pl.p += dt / LB_STEP_S;
      if (pl.p >= 1) {
        spare = Math.min(pl.p - 1, 0.5);
        pl.p = 1;
        arrive();
      }
    }
    if (game.state !== 'play') return;
    if (pl.p >= 1 && tryMove()) pl.p = spare;

    updateSpider(dt);
    updateShadows(dt);
    const sp = game.spider;
    if (sp && (sp.state === 'aim' || sp.state === 'charge')) {
      const a = lbPos(pl);
      const b = lbPos(sp);
      if (Math.hypot(a.x - b.x, a.y - b.y) < 0.6) die('spider');
    }
  };

  const draw = () => {
    const T = view.tile * view.dpr;
    const W = canvas.width;
    const H = canvas.height;
    const t = game.time;
    g.clearRect(0, 0, W, H);
    if (view.maze) g.drawImage(view.maze, 0, 0);

    lbDrawGate(g, game.exit.x * T, game.exit.y * T, T);
    game.chips.forEach(key => {
      const [x, y] = key.split(',').map(Number);
      lbDrawStar(g, (x + 0.5) * T, (y + 0.5) * T, T * (0.3 + Math.sin(t * 5 + x) * 0.03), t);
    });
    game.shadows.forEach(s => lbDrawShadow(g, s, T));

    const pp = lbPos(game.pl);
    if (game.state !== 'dead') lbDrawPlayer(g, (pp.x + 0.5) * T, (pp.y + 0.5) * T, T);

    const sp = game.spider;
    const spLook = sp && sp.state !== 'gone' && lbSpiderLook(sp, T);
    if (spLook) lbDrawSpider(g, spLook, T, t);

    // The dark: only a small circle around the Puzzle is lit.
    const fx = (pp.x + 0.5) * T;
    const fy = (pp.y + 0.5) * T;
    const fog = g.createRadialGradient(fx, fy, LB_FOG_IN * T, fx, fy, LB_FOG_OUT * T);
    fog.addColorStop(0, 'rgb(3 2 8 / 0)');
    fog.addColorStop(1, 'rgb(3 2 8 / 0.97)');
    g.fillStyle = fog;
    g.fillRect(0, 0, W, H);

    // What still shows through the dark: the gate's glow and glowing eyes.
    const gx = (game.exit.x + 0.5) * T;
    const gy = (game.exit.y + 0.5) * T;
    const glow = g.createRadialGradient(gx, gy, 0, gx, gy, T * 1.2);
    glow.addColorStop(0, `rgb(253 230 138 / ${0.35 + Math.sin(t * 3) * 0.1})`);
    glow.addColorStop(1, 'rgb(253 230 138 / 0)');
    g.fillStyle = glow;
    g.fillRect(gx - T * 1.2, gy - T * 1.2, T * 2.4, T * 2.4);
    game.shadows.forEach(s => {
      if (s.state !== 'idle') lbDrawEyes(g, (s.wx + 0.5) * T, (s.wy + 0.45) * T, T * 0.16, T * 0.07, '#e879f9');
    });
    if (spLook) lbDrawSpider(g, spLook, T, t, true);
  };

  const loop = now => {
    if (!overlay.isConnected) return lbClose();
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    update(dt);
    draw();
    lb.frame = requestAnimationFrame(loop);
  };

  // --- Input ---
  const releaseKeys = () => overlay.querySelectorAll('.lb-key.is-down').forEach(k => k.classList.remove('is-down'));
  const holdKey = key => {
    releaseKeys();
    game.held = game.queued = key.dataset.dir;
    key.classList.add('is-down');
  };
  const press = e => {
    const key = e.target.closest('.lb-key');
    if (!key) return;
    e.preventDefault();
    holdKey(key);
  };
  // Sliding a finger from one arrow to another switches direction.
  const slide = e => {
    if (!game.held) return;
    const key = document.elementFromPoint(e.clientX, e.clientY)?.closest('.lb-key');
    if (key && key.dataset.dir !== game.held) holdKey(key);
  };
  const release = () => {
    game.held = null;
    releaseKeys();
  };
  const KEYS = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', KeyW: 'up', KeyS: 'down', KeyA: 'left', KeyD: 'right' };
  const key = e => {
    const dir = KEYS[e.code];
    if (!dir) return;
    e.preventDefault();
    if (e.type === 'keydown') game.held = game.queued = dir;
    else if (game.held === dir) game.held = null;
  };
  overlay.addEventListener('pointerdown', press);
  overlay.addEventListener('pointermove', slide);
  overlay.addEventListener('contextmenu', e => e.preventDefault());
  overlay.querySelector('.lb-riddle').addEventListener('click', onRiddleClick);
  window.addEventListener('pointerup', release);
  window.addEventListener('pointercancel', release);
  window.addEventListener('keydown', key);
  window.addEventListener('keyup', key);
  window.addEventListener('resize', resize);
  overlay.querySelector('.lb-quit').addEventListener('click', lbClose);
  overlay.querySelector('.lb-btn--back').addEventListener('click', lbClose);
  overlay.querySelector('.lb-btn--again').addEventListener('click', () => {
    newGame();
    playSound({ name: 'lb-start' });
  });
  lb.cleanup = () => {
    window.removeEventListener('pointerup', release);
    window.removeEventListener('pointercancel', release);
    window.removeEventListener('keydown', key);
    window.removeEventListener('keyup', key);
    window.removeEventListener('resize', resize);
  };

  resize();
  newGame();
  lb.frame = requestAnimationFrame(loop);
}

// --- Drawing ----------------------------------------------------------------------

// The static maze, painted once: dark floor and grey-blue Labyrinth Wall blocks.
function lbPaintMaze(open, T) {
  const c = document.createElement('canvas');
  c.width = Math.ceil(LB_W * T);
  c.height = Math.ceil(LB_H * T);
  const g = c.getContext('2d');
  g.fillStyle = '#0c0a14';
  g.fillRect(0, 0, c.width, c.height);
  for (let y = 0; y < LB_H; y++) {
    for (let x = 0; x < LB_W; x++) {
      const px = x * T;
      const py = y * T;
      if (open[y][x]) {
        g.fillStyle = (x + y) % 2 ? '#1a1626' : '#16121f';
        g.fillRect(px, py, T + 0.5, T + 0.5);
        continue;
      }
      g.fillStyle = '#4b4f6b';
      g.fillRect(px, py, T + 0.5, T + 0.5);
      g.strokeStyle = '#2a2c40';
      g.lineWidth = Math.max(1, T * 0.05);
      const off = y % 2 ? 0.3 : 0.7;
      g.beginPath();
      g.moveTo(px, py + T / 2);
      g.lineTo(px + T, py + T / 2);
      g.moveTo(px + T * off, py);
      g.lineTo(px + T * off, py + T / 2);
      g.moveTo(px + T * (1 - off), py + T / 2);
      g.lineTo(px + T * (1 - off), py + T);
      g.stroke();
      if (lbIsOpen(open, x, y - 1)) {
        g.fillStyle = '#8a8fb5';
        g.fillRect(px, py, T + 0.5, T * 0.08);
      }
      if (lbIsOpen(open, x, y + 1)) {
        g.fillStyle = '#25273a';
        g.fillRect(px, py + T * 0.84, T + 0.5, T * 0.16);
      }
    }
  }
  return c;
}

function lbDrawGate(g, x, y, T) {
  g.fillStyle = '#3b2a12';
  g.fillRect(x + T * 0.1, y + T * 0.1, T * 0.8, T * 0.85);
  g.strokeStyle = '#fbbf24';
  g.lineWidth = T * 0.07;
  g.strokeRect(x + T * 0.1, y + T * 0.1, T * 0.8, T * 0.85);
  g.beginPath();
  g.moveTo(x + T / 2, y + T * 0.1);
  g.lineTo(x + T / 2, y + T * 0.95);
  g.stroke();
}

function lbDrawStar(g, x, y, r, t) {
  g.save();
  g.translate(x, y);
  g.rotate(Math.sin(t * 2 + x) * 0.2);
  g.shadowColor = '#fde047';
  g.shadowBlur = r;
  g.fillStyle = '#facc15';
  g.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.45 : r;
    g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  g.closePath();
  g.fill();
  g.restore();
}

// You: a glowing Millennium Puzzle with the Eye of Wdjat.
function lbDrawPlayer(g, x, y, T) {
  const r = T * 0.36;
  g.save();
  g.translate(x, y);
  g.shadowColor = '#fde047';
  g.shadowBlur = T * 0.5;
  g.fillStyle = '#fbbf24';
  g.beginPath();
  g.moveTo(-r, -r * 0.7);
  g.lineTo(r, -r * 0.7);
  g.lineTo(0, r * 0.95);
  g.closePath();
  g.fill();
  g.shadowBlur = 0;
  g.strokeStyle = '#78350f';
  g.lineWidth = T * 0.06;
  g.stroke();
  g.fillStyle = '#78350f';
  g.beginPath();
  g.ellipse(0, -r * 0.2, r * 0.32, r * 0.16, 0, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#fef3c7';
  g.beginPath();
  g.arc(0, -r * 0.2, r * 0.09, 0, Math.PI * 2);
  g.fill();
  g.restore();
}

// Wall Shadow: the wall flickers ('warn'), then a shadow claw reaches out of
// it into the corridor ('lunge') and pulls back.
function lbDrawShadow(g, s, T) {
  if (s.state === 'idle') return;
  if (s.state === 'warn') {
    g.save();
    g.globalAlpha = 0.35 + 0.4 * Math.abs(Math.sin(s.t * 28));
    g.fillStyle = '#1e0b2e';
    g.fillRect(s.wx * T, s.wy * T, T, T);
    g.restore();
    return;
  }
  const grow = Math.min(1, s.t / 0.1);
  const shrink = Math.min(1, Math.max(0, (LB_SHADOW_LUNGE_S - s.t) / 0.2));
  const len = T * (0.3 + grow * shrink * 1.05);
  g.save();
  g.translate((s.wx + 0.5) * T, (s.wy + 0.5) * T);
  g.rotate(Math.atan2(s.cy - s.wy, s.cx - s.wx));
  g.fillStyle = 'rgb(30 8 46 / 0.95)';
  g.strokeStyle = '#a855f7';
  g.lineWidth = T * 0.04;
  g.beginPath();
  g.moveTo(0, -T * 0.42);
  g.quadraticCurveTo(len * 0.6, -T * 0.4, len, -T * 0.3);
  g.lineTo(len - T * 0.12, -T * 0.1);
  g.lineTo(len + T * 0.05, 0);
  g.lineTo(len - T * 0.12, T * 0.1);
  g.lineTo(len, T * 0.3);
  g.quadraticCurveTo(len * 0.6, T * 0.4, 0, T * 0.42);
  g.closePath();
  g.fill();
  g.stroke();
  g.restore();
}

// Where and how Jirai Gumo is drawn. It faces its charge direction, hangs on
// a silk thread while dropping, and on 'climb' bumps the wall, then climbs
// back up its thread and fades out.
function lbSpiderLook(sp, T) {
  const pos = lbPos(sp);
  const [dx, dy] = sp.dir;
  const look = {
    x: (pos.x + 0.5) * T, y: (pos.y + 0.5) * T, angle: Math.atan2(dx, -dy),
    drop: sp.state === 'drop' ? Math.max(0, 1 - sp.t / LB_SPIDER_DROP_S) : 0,
    alpha: 1, thread: sp.state === 'drop', walking: sp.state === 'charge'
  };
  if (sp.state === 'climb') {
    const k = Math.min(1, sp.t / LB_SPIDER_CLIMB_S);
    const bump = Math.min(1, k / 0.25);
    const rise = Math.max(0, (k - 0.25) / 0.75);
    look.x += dx * T * 0.35 * bump;
    look.y += dy * T * 0.35 * bump - rise * rise * T * 3;
    look.angle *= 1 - Math.min(1, rise * 3);
    look.alpha = 1 - Math.max(0, (k - 0.5) / 0.5);
    look.thread = rise > 0;
    look.walking = rise > 0;
  }
  return look;
}

// Jirai Gumo: a big yellow and black banded spider (drawn facing up, then
// rotated). eyesOnly draws just its glowing red eyes, on top of the dark.
function lbDrawSpider(g, o, T, t, eyesOnly) {
  const fall = o.drop * o.drop * T * 5;
  g.save();
  g.globalAlpha = o.alpha;
  if (!eyesOnly && o.thread) {
    g.strokeStyle = 'rgb(226 232 240 / 0.6)';
    g.lineWidth = T * 0.03;
    g.beginPath();
    g.moveTo(o.x, 0);
    g.lineTo(o.x, o.y - fall);
    g.stroke();
  }
  if (!eyesOnly && o.drop > 0) {
    const k = 1 - o.drop * 0.7;
    g.fillStyle = `rgb(0 0 0 / ${0.5 * (1 - o.drop)})`;
    g.beginPath();
    g.ellipse(o.x, o.y + T * 0.3, T * 0.45 * k, T * 0.15 * k, 0, 0, Math.PI * 2);
    g.fill();
  }
  g.translate(o.x, o.y - fall);
  g.rotate(o.angle);
  g.scale(T / 100, T / 100);
  if (!eyesOnly) {
    g.strokeStyle = '#1c1917';
    g.lineWidth = 7;
    g.lineCap = 'round';
    for (let side = -1; side <= 1; side += 2) {
      for (let i = 0; i < 4; i++) {
        const wig = o.walking ? Math.sin(t * 22 + i * 1.7 + side) * 8 : 0;
        const by = -18 + i * 12;
        g.beginPath();
        g.moveTo(side * 12, by);
        g.lineTo(side * 40, by - 18 + wig);
        g.lineTo(side * 54, by + 10 + wig);
        g.stroke();
      }
    }
    g.lineWidth = 4;
    g.fillStyle = '#ca8a04';
    g.beginPath();
    g.ellipse(0, 18, 24, 28, 0, 0, Math.PI * 2);
    g.fill();
    g.save();
    g.clip();
    g.fillStyle = '#1c1917';
    [12, 24, 36].forEach(yy => g.fillRect(-26, yy, 52, 5));
    g.restore();
    g.stroke();
    g.fillStyle = '#78350f';
    g.beginPath();
    g.ellipse(0, -16, 18, 16, 0, 0, Math.PI * 2);
    g.fill();
    g.stroke();
    g.fillStyle = '#f5f5f4';
    [-1, 1].forEach(side => {
      g.beginPath();
      g.moveTo(side * 9, -29);
      g.lineTo(side * 3, -29);
      g.lineTo(side * 6, -40);
      g.closePath();
      g.fill();
    });
  }
  g.shadowColor = '#ef4444';
  g.shadowBlur = T * 0.15;
  g.fillStyle = '#ef4444';
  [[-10, -18], [-4, -23], [4, -23], [10, -18]].forEach(([x, y]) => {
    g.beginPath();
    g.arc(x, y, 3.4, 0, Math.PI * 2);
    g.fill();
  });
  g.restore();
}

// A Wall Shadow's two glowing eyes, drawn on top of the dark.
function lbDrawEyes(g, x, y, gap, r, color) {
  g.save();
  g.shadowColor = color;
  g.shadowBlur = r * 4;
  g.fillStyle = color;
  [-gap, gap].forEach(dx => {
    g.beginPath();
    g.arc(x + dx, y, r, 0, Math.PI * 2);
    g.fill();
  });
  g.restore();
}

function lbClose() {
  cancelAnimationFrame(lb.frame);
  lb.cleanup?.();
  lb.cleanup = null;
  lb.overlay?.remove();
  lb.overlay = null;
  startEgg.busy = false;
  // The overlay covered the button, so the hold's click may never have arrived.
  startEgg.swallowClick = false;
}
