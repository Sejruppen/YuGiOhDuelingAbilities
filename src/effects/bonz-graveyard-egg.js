// Duelist's Road easter egg: hold "History" for START_EGG_PRESS_MS and Bonz's
// Graveyard opens, a tiny Plants vs. Zombies. "The dead rise to collect your
// past!" Zombies shamble down three lanes towards your History scroll.
//  - Star Chips fall from the sky; tap them to collect. Spend them on cards:
//    Kuriboh (a wall that multiplies into two smaller Kuribohs when it falls),
//    Celtic Guardian (slashes zombies next to him), Dark Magician (Dark Magic
//    Attack bolts up his lane) and Swords of Revealing Light (freezes every
//    zombie for a few seconds, then needs time to recharge).
//  - Zombie, Armored Zombie (tanky), Dragon Zombie (fast, flies over the
//    first monster in its way) and Clown Zombie.
//  - Call of the Haunted: a destroyed zombie leaves a tombstone and rises
//    again once, unless you tap the tombstone to banish it. Your real lost
//    Duelist's Road runs rise from the History first.
//  - Ryou's Destiny Board: every zombie that reaches the scroll adds a letter.
//    In the last wave the Spirit Message also writes itself over time. When
//    F-I-N-A-L is complete, you lose.
//  - Survive three waves and Yugi plays Monster Reborn.
// Sounds: 'bz-*' in COOP_SOUNDS. CSS: "Bonz's Graveyard" in effects.css.
const BZ_SAFETY_MS = 30 * 60 * 1000;
const BZ_COLS = 3;
const BZ_ROWS = 6;
const BZ_TOP = 0.7; // tiles above the grid where zombies appear
const BZ_BOTTOM = 0.8; // the History scroll under the grid
const BZ_H = BZ_TOP + BZ_ROWS + BZ_BOTTOM;
const BZ_START_CHIPS = 6;
const BZ_CHIP_EVERY_S = 3.6;
const BZ_CHIP_LIFE_S = 7;
const BZ_TOMB_S = 4.5; // until a tombstone rises again
const BZ_FREEZE_S = 4;
const BZ_SWORDS_CD_S = 25;
const BZ_BITE_S = 1;
const BZ_HOP_S = 0.45;
const BZ_FIRST_WAVE_S = 7; // the intro banner before wave 1
const BZ_NEXT_WAVE_S = 4;
const BZ_BOARD_EVERY_S = 15; // Destiny Board letters in the last wave
const BZ_FINAL = ['F', 'I', 'N', 'A', 'L'];
const BZ_MAX_HAUNTED = 3; // lost runs that rise at the start

const BZ_CARDS = {
  kuriboh: { name: 'Kuriboh', cost: 2, hp: 8 },
  guardian: { name: 'Celtic Guardian', cost: 3, hp: 5, icon: '🧝', every: 0.9, dmg: 2 },
  magician: { name: 'Dark Magician', cost: 4, hp: 3, icon: '🧙‍♂️', every: 1.5, dmg: 2 },
  swords: { name: 'Swords of Revealing Light', cost: 3, icon: '⚔️', spell: true }
};

const BZ_ZOMBIES = {
  zombie: { hp: 5, speed: 0.3, icon: '🧟' },
  armored: { hp: 12, speed: 0.22, icon: '🧟', extra: '🛡️' },
  dragon: { hp: 6, speed: 0.5, icon: '🐉', extra: '💀', flies: true },
  clown: { hp: 7, speed: 0.34, icon: '🤡' }
};

// [seconds into the wave, zombie type]
const BZ_WAVES = [
  [[2, 'zombie'], [8, 'zombie'], [13, 'zombie'], [17, 'zombie'], [21, 'zombie'], [24, 'zombie']],
  [[2, 'zombie'], [6, 'armored'], [10, 'dragon'], [13, 'zombie'], [16, 'clown'], [20, 'dragon'], [23, 'armored'], [25, 'zombie'], [27, 'zombie']],
  [[2, 'clown'], [3, 'zombie'], [6, 'armored'], [9, 'dragon'], [10, 'zombie'], [13, 'clown'], [16, 'armored'], [18, 'dragon'], [20, 'zombie'], [21, 'zombie'], [24, 'armored'], [26, 'clown']]
];

const BZ_EMOJI_FONT = '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';

const bz = { overlay: null, frame: null, cleanup: null };

function playBonzGraveyardEgg() {
  markEggFound('bonz-graveyard');
  playSound({ name: 'bz-start' });

  const kuriIcon = kdMakeKuribohSprite(96).toDataURL();
  const card = (id, icon) => `
    <button type="button" class="bz-card${BZ_CARDS[id].spell ? ' bz-card--spell' : ''}" data-card="${id}">
      <span class="bz-card-art">${icon}</span>
      <span class="bz-card-name">${BZ_CARDS[id].name}</span>
      <span class="bz-card-cost"><span class="ce-emoji">⭐</span>${BZ_CARDS[id].cost}</span>
      <span class="bz-card-cd"></span>
    </button>`;
  const overlay = spawnFx('fx-cegg fx-bz', BZ_SAFETY_MS, {
    html: `
      <div class="bz-bg"></div>
      <div class="bz-wrap">
        <div class="bz-hud">
          <span class="bz-title">Bonz's Graveyard</span>
          <span class="bz-wave">Wave 1/${BZ_WAVES.length}</span>
          <span class="bz-chips"><span class="ce-emoji">⭐</span> <span class="bz-chips-n">${BZ_START_CHIPS}</span></span>
          <button type="button" class="bz-quit" aria-label="Leave the graveyard">✕</button>
        </div>
        <div class="bz-board" title="Ryou's Destiny Board">${BZ_FINAL.map(l => `<span class="bz-letter">${l}</span>`).join('')}</div>
        <div class="bz-stage">
          <canvas class="bz-canvas"></canvas>
          <div class="bz-banner"><b class="bz-banner-title"></b><span class="bz-banner-sub"></span></div>
          <div class="bz-end">
            <span class="bz-end-art"></span>
            <b class="bz-end-title"></b>
            <span class="bz-end-sub"></span>
            <span class="bz-end-btns">
              <button type="button" class="bz-btn bz-btn--again">↻ Again</button>
              <button type="button" class="bz-btn bz-btn--back">Leave</button>
            </span>
          </div>
        </div>
        <div class="bz-tray">
          ${card('kuriboh', `<img src="${kuriIcon}" alt="">`)}
          ${card('guardian', '<span class="ce-emoji">🧝</span>')}
          ${card('magician', '<span class="ce-emoji">🧙‍♂️</span>')}
          ${card('swords', '<span class="ce-emoji">⚔️</span>')}
        </div>
        <p class="bz-help">Pick a card, tap a square. Tap <span class="ce-emoji">⭐</span> to collect. Tap <span class="ce-emoji">🪦</span> before the dead rise again!</p>
      </div>
    `
  });
  if (!overlay) return; // reduced motion: the sound has already played

  startEgg.busy = true;
  bz.overlay = overlay;
  bzStartGame(overlay);
}

// Emoji drawn once into a small canvas, so the game doesn't re-render text every frame.
const bzEmojiCache = new Map();
function bzEmoji(char, px) {
  const key = `${char}@${px}`;
  if (bzEmojiCache.has(key)) return bzEmojiCache.get(key);
  const c = document.createElement('canvas');
  c.width = c.height = px;
  const g = c.getContext('2d');
  g.font = `${Math.round(px * 0.82)}px ${BZ_EMOJI_FONT}`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(char, px / 2, px * 0.54);
  bzEmojiCache.set(key, c);
  return c;
}

function bzLostRuns() {
  return typeof soloHistory === 'undefined' ? 0 : soloHistory.filter(e => e.result !== 'victory').length;
}

// --- The game ---------------------------------------------------------------------

function bzStartGame(overlay) {
  const canvas = overlay.querySelector('.bz-canvas');
  const stage = overlay.querySelector('.bz-stage');
  const g = canvas.getContext('2d');
  const ui = {
    wave: overlay.querySelector('.bz-wave'),
    chips: overlay.querySelector('.bz-chips-n'),
    chipsBox: overlay.querySelector('.bz-chips'),
    letters: [...overlay.querySelectorAll('.bz-letter')],
    banner: overlay.querySelector('.bz-banner'),
    bannerTitle: overlay.querySelector('.bz-banner-title'),
    bannerSub: overlay.querySelector('.bz-banner-sub'),
    cards: [...overlay.querySelectorAll('.bz-card')],
    endArt: overlay.querySelector('.bz-end-art'),
    endTitle: overlay.querySelector('.bz-end-title'),
    endSub: overlay.querySelector('.bz-end-sub')
  };
  const view = { tile: 60, dpr: 1, bg: null, kuri: null };
  const sfxAt = {};
  let game = null;
  let last = performance.now();

  // Some sounds (bites, hits) would fire many times a second; space them out.
  const sfx = (name, gap = 0, extra = {}) => {
    const now = performance.now();
    if (gap && now - (sfxAt[name] || 0) < gap * 1000) return;
    sfxAt[name] = now;
    playSound({ name, ...extra });
  };

  const resize = () => {
    const maxW = Math.min(overlay.querySelector('.bz-wrap').clientWidth - 16, 420);
    const maxH = window.innerHeight - 250; // HUD, board, card tray and help line
    view.tile = Math.max(36, Math.floor(Math.min(maxW / BZ_COLS, maxH / BZ_H)));
    view.dpr = Math.min(window.devicePixelRatio || 1, FX_LITE ? 1.5 : 2);
    canvas.style.width = `${view.tile * BZ_COLS}px`;
    canvas.style.height = `${view.tile * BZ_H}px`;
    canvas.width = Math.round(view.tile * BZ_COLS * view.dpr);
    canvas.height = Math.round(view.tile * BZ_H * view.dpr);
    const T = view.tile * view.dpr;
    view.bg = bzPaintGraveyard(T);
    view.kuri = kdMakeKuribohSprite(Math.ceil(T * 0.9));
  };

  const banner = (title, sub = '') => {
    ui.bannerTitle.textContent = title;
    ui.bannerSub.textContent = sub;
    restartClass(ui.banner, 'is-show', 2800);
  };

  const paintChips = () => { ui.chips.textContent = game.chips; };

  let trayKey = '';
  const paintTray = () => {
    const key = `${game.chips}|${game.selected}|${Math.ceil(game.swordsCd)}`;
    if (key === trayKey) return;
    trayKey = key;
    ui.cards.forEach(btn => {
      const id = btn.dataset.card;
      const cd = id === 'swords' ? game.swordsCd : 0;
      btn.classList.toggle('is-picked', game.selected === id);
      btn.classList.toggle('is-poor', game.chips < BZ_CARDS[id].cost || cd > 0);
      btn.style.setProperty('--cd', (cd / BZ_SWORDS_CD_S).toFixed(3));
      btn.querySelector('.bz-card-cd').textContent = cd > 0 ? Math.ceil(cd) : '';
    });
  };

  const newGame = () => {
    const haunted = Math.min(BZ_MAX_HAUNTED, bzLostRuns());
    game = {
      state: 'play', time: 0, wave: 0, waveT: -BZ_FIRST_WAVE_S, spawned: 0,
      chips: BZ_START_CHIPS, chipT: 1.5, selected: null, swordsCd: 0, freeze: 0,
      letters: 0, boardT: 0,
      grid: Array.from({ length: BZ_COLS }, () => Array(BZ_ROWS).fill(null)),
      zombies: [], bolts: [], tombs: [], stars: [], fx: [], killed: 0, banished: 0
    };
    // Your lost runs rise from the History first.
    for (let i = 0; i < haunted; i++) {
      game.tombs.push({ lane: i % BZ_COLS, y: ceRand(1.2, 2.8), type: 'zombie', t: BZ_FIRST_WAVE_S + 1.5 + i * 0.6, haunted: true });
    }
    overlay.classList.remove('is-end', 'is-won', 'is-lost');
    ui.letters.forEach(l => l.classList.remove('is-lit'));
    ui.wave.textContent = `Wave 1/${BZ_WAVES.length}`;
    trayKey = '';
    paintChips();
    paintTray();
    banner('"The dead rise to collect your past!"', haunted
      ? `Bonz digs up your ${haunted === 1 ? 'lost run' : `${haunted} lost runs`}. Banish ${haunted === 1 ? 'it' : 'them'}!`
      : 'Protect your History from the graveyard!');
  };

  const pop = (lane, y, text, color = '#fde68a') => {
    game.fx.push({ kind: 'text', x: lane + 0.5, y, text, color, life: 1, max: 1 });
  };
  const burst = (x, y, color, n = 10) => {
    for (let i = 0; i < fxCount(n); i++) {
      game.fx.push({ kind: 'dot', x, y, vx: ceRand(-1.6, 1.6), vy: ceRand(-2.2, 0.4), color, life: 0.6, max: 0.6, s: ceRand(0.04, 0.09) });
    }
  };

  const spawnZombie = (type, lane, y = -0.5, risen = false) => {
    const def = BZ_ZOMBIES[type];
    const hp = risen ? Math.ceil(def.hp / 2) : def.hp;
    game.zombies.push({ type, lane, y, hp, max: hp, bite: 0, hurt: 0, hop: null, hopped: false, risen, wob: ceRand(0, 6) });
  };

  const addLetter = why => {
    if (game.state !== 'play') return;
    game.letters += 1;
    ui.letters.slice(0, game.letters).forEach(l => l.classList.add('is-lit'));
    restartClass(stage, 'is-hit', 600);
    sfx('bz-letter', 0, { n: game.letters });
    if (game.letters >= BZ_FINAL.length) return lose();
    banner(`"${BZ_FINAL.slice(0, game.letters).join('')}…"`, why === 'leak' ? 'A zombie reached your History!' : 'The Destiny Board writes another letter…');
  };

  const end = won => {
    game.state = won ? 'won' : 'lost';
    game.selected = null;
    trayKey = '';
    paintTray();
    overlay.classList.add('is-end', won ? 'is-won' : 'is-lost');
  };

  const win = () => {
    end(true);
    ui.endArt.innerHTML = '<span class="bz-reborn">☥</span><span class="bz-bonz ce-emoji">💀</span>';
    ui.endTitle.textContent = 'Monster Reborn!';
    const clean = game.letters ? `The Destiny Board only got to "${BZ_FINAL.slice(0, game.letters).join('')}".` : 'Not a single letter on the Destiny Board!';
    ui.endSub.textContent = `Your History is safe and Bonz fainted… again. ${clean}`;
    sfx('bz-win');
  };

  const lose = () => {
    end(false);
    ui.endArt.innerHTML = '<span class="bz-bonz ce-emoji">💀</span>';
    ui.endTitle.textContent = 'F · I · N · A · L';
    ui.endSub.textContent = '"Your soul is mine!" The Destiny Board is complete and your History belongs to the graveyard.';
    sfx('bz-lose');
  };

  const killZombie = z => {
    game.zombies.splice(game.zombies.indexOf(z), 1);
    game.killed += 1;
    burst(z.lane + 0.5, z.y, '#86efac', 12);
    sfx('bz-zdie', 0.15);
    // Call of the Haunted: it comes back once unless the tombstone is banished.
    if (!z.risen) game.tombs.push({ lane: z.lane, y: Math.max(0.3, Math.min(BZ_ROWS - 0.5, z.y)), type: z.type, t: BZ_TOMB_S });
  };

  const hurtZombie = (z, dmg) => {
    z.hp -= dmg;
    z.hurt = 0.15;
    if (z.hp <= 0) killZombie(z);
  };

  const killMonster = (lane, row) => {
    const m = game.grid[lane][row];
    game.grid[lane][row] = null;
    burst(lane + 0.5, row + 0.5, m.kind === 'kuriboh' ? '#a16207' : '#c4b5fd', 12);
    if (m.kind === 'kuriboh' && !m.small) {
      // Multiply! One small Kuriboh where it fell, another behind it.
      game.grid[lane][row] = { kind: 'kuriboh', small: true, hp: 4, max: 4, cd: 0, hurt: 0, born: game.time };
      if (row + 1 < BZ_ROWS && !game.grid[lane][row + 1]) {
        game.grid[lane][row + 1] = { kind: 'kuriboh', small: true, hp: 4, max: 4, cd: 0, hurt: 0, born: game.time };
      }
      pop(lane, row + 0.2, 'Multiply!', '#fde68a');
      sfx('bz-kuri');
    } else {
      sfx('bz-mdie', 0.2);
    }
  };

  // The first monster in the zombie's lane that is still ahead of it.
  const blocker = z => {
    const col = game.grid[z.lane];
    for (let r = 0; r < BZ_ROWS; r++) {
      if (col[r] && z.y < r + 0.5) return z.y + 0.35 >= r + 0.1 ? r : -1;
    }
    return -1;
  };

  const updateZombies = dt => {
    const frozen = game.freeze > 0;
    [...game.zombies].forEach(z => {
      z.hurt = Math.max(0, z.hurt - dt);
      if (z.hop) {
        z.hop.t += dt;
        const k = Math.min(1, z.hop.t / BZ_HOP_S);
        z.y = z.hop.from + (z.hop.to - z.hop.from) * k;
        if (k >= 1) z.hop = null;
        return;
      }
      if (frozen) return;
      const r = blocker(z);
      if (r >= 0) {
        if (BZ_ZOMBIES[z.type].flies && !z.hopped) {
          z.hopped = true;
          z.hop = { from: z.y, to: r + 1.2, t: 0 };
          sfx('bz-hop', 0.2);
          return;
        }
        z.bite -= dt;
        if (z.bite <= 0) {
          z.bite = BZ_BITE_S;
          const m = game.grid[z.lane][r];
          m.hp -= 1;
          m.hurt = 0.15;
          sfx('bz-bite', 0.18);
          if (m.hp <= 0) killMonster(z.lane, r);
        }
        return;
      }
      z.y += BZ_ZOMBIES[z.type].speed * dt;
      if (z.y > BZ_ROWS + 0.15) {
        game.zombies.splice(game.zombies.indexOf(z), 1);
        burst(z.lane + 0.5, BZ_ROWS, '#a855f7', 14);
        addLetter('leak');
      }
    });
  };

  const updateMonsters = dt => {
    game.grid.forEach((col, lane) => col.forEach((m, row) => {
      if (!m) return;
      m.hurt = Math.max(0, m.hurt - dt);
      m.swing = Math.max(0, (m.swing || 0) - dt);
      if (m.kind === 'kuriboh') return;
      m.cd -= dt;
      if (m.cd > 0) return;
      const def = BZ_CARDS[m.kind];
      if (m.kind === 'guardian') {
        const near = game.zombies
          .filter(z => z.lane === lane && !z.hop && z.y > row - 0.95 && z.y < row + 1.4)
          .sort((a, b) => Math.abs(a.y - row - 0.5) - Math.abs(b.y - row - 0.5))[0];
        if (!near) return;
        m.cd = def.every;
        m.swing = 0.22;
        sfx('bz-slash', 0.12);
        hurtZombie(near, def.dmg);
      } else if (m.kind === 'magician') {
        if (!game.zombies.some(z => z.lane === lane && z.y < row + 0.4 && z.y > -0.6)) return;
        m.cd = def.every;
        m.swing = 0.25;
        game.bolts.push({ lane, y: row + 0.2, dmg: def.dmg });
        sfx('bz-bolt', 0.12);
      }
    }));
  };

  const updateBolts = dt => {
    game.bolts = game.bolts.filter(b => {
      b.y -= 7 * dt;
      const hit = game.zombies.find(z => z.lane === b.lane && !z.hop && Math.abs(z.y - b.y) < 0.4);
      if (hit) {
        burst(b.lane + 0.5, b.y, '#e879f9', 6);
        sfx('bz-hit', 0.1);
        hurtZombie(hit, b.dmg);
        return false;
      }
      return b.y > -BZ_TOP - 0.2;
    });
  };

  const updateTombs = dt => {
    game.tombs = game.tombs.filter(tb => {
      tb.t -= dt;
      if (tb.t > 0) return true;
      spawnZombie(tb.type, tb.lane, tb.y, true);
      burst(tb.lane + 0.5, tb.y, '#a855f7', 10);
      pop(tb.lane, tb.y - 0.3, tb.haunted ? 'Your past!' : 'Call of the Haunted!', '#e9d5ff');
      sfx('bz-rise', 0.3);
      return false;
    });
  };

  const updateStars = dt => {
    game.chipT -= dt;
    if (game.chipT <= 0) {
      game.chipT = BZ_CHIP_EVERY_S;
      game.stars.push({ x: ceRand(0.35, BZ_COLS - 0.35), y: -BZ_TOP + 0.2, to: ceRand(0.6, BZ_ROWS - 0.8), life: BZ_CHIP_LIFE_S });
    }
    game.stars = game.stars.filter(s => {
      if (s.y < s.to) s.y = Math.min(s.to, s.y + 1.8 * dt);
      else s.life -= dt;
      return s.life > 0;
    });
  };

  const updateWaves = dt => {
    game.waveT += dt;
    const list = BZ_WAVES[game.wave];
    while (game.spawned < list.length && list[game.spawned][0] <= game.waveT) {
      spawnZombie(list[game.spawned][1], Math.floor(Math.random() * BZ_COLS));
      game.spawned += 1;
      sfx('bz-groan', 0.6);
    }
    const isLast = game.wave === BZ_WAVES.length - 1;
    if (isLast && game.waveT > 0) {
      game.boardT += dt;
      if (game.boardT >= BZ_BOARD_EVERY_S) {
        game.boardT = 0;
        addLetter('board');
        if (game.state !== 'play') return;
      }
    }
    if (game.spawned < list.length || game.zombies.length || game.tombs.length) return;
    if (isLast) return win();
    game.wave += 1;
    game.spawned = 0;
    game.waveT = -BZ_NEXT_WAVE_S;
    ui.wave.textContent = `Wave ${game.wave + 1}/${BZ_WAVES.length}`;
    const final = game.wave === BZ_WAVES.length - 1;
    banner(final ? 'Final wave!' : `Wave ${game.wave + 1}`, final ? 'Bakura sets the Destiny Board. Hurry before it spells FINAL!' : 'More dead are rising…');
    sfx(final ? 'bz-board' : 'bz-wave');
  };

  const update = dt => {
    game.time += dt;
    game.fx = game.fx.filter(p => {
      p.life -= dt;
      if (p.kind === 'dot') {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 5 * dt;
      } else {
        p.y -= 0.6 * dt;
      }
      return p.life > 0;
    });
    if (game.state !== 'play') return;
    game.freeze = Math.max(0, game.freeze - dt);
    game.swordsCd = Math.max(0, game.swordsCd - dt);
    updateStars(dt);
    updateTombs(dt);
    updateMonsters(dt);
    updateBolts(dt);
    updateZombies(dt);
    if (game.state === 'play') updateWaves(dt);
    paintTray();
  };

  const draw = () => {
    const T = view.tile * view.dpr;
    const t = game.time;
    const X = lane => (lane + 0.5) * T;
    const Y = y => (BZ_TOP + y) * T;
    g.clearRect(0, 0, canvas.width, canvas.height);
    if (view.bg) g.drawImage(view.bg, 0, 0);

    // Where the picked card can go.
    if (game.selected && !BZ_CARDS[game.selected].spell) {
      const pulse = 0.35 + Math.sin(t * 6) * 0.15;
      g.strokeStyle = `rgb(253 230 138 / ${pulse})`;
      g.lineWidth = T * 0.03;
      game.grid.forEach((col, lane) => col.forEach((m, row) => {
        if (!m) g.strokeRect(lane * T + T * 0.08, Y(row) + T * 0.08, T * 0.84, T * 0.84);
      }));
    }

    game.tombs.forEach(tb => bzDrawTomb(g, X(tb.lane), Y(tb.y), T, tb.t / (tb.haunted ? BZ_FIRST_WAVE_S + 1.5 : BZ_TOMB_S), t));

    game.grid.forEach((col, lane) => col.forEach((m, row) => {
      if (m) bzDrawMonster(g, m, X(lane), Y(row + 0.5), T, t, view.kuri);
    }));

    game.bolts.forEach(b => {
      g.save();
      g.shadowColor = '#e879f9';
      g.shadowBlur = FX_LITE ? 0 : T * 0.3;
      g.fillStyle = '#f5d0fe';
      g.beginPath();
      g.arc(X(b.lane), Y(b.y), T * 0.11, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = 'rgb(192 38 211 / 0.5)';
      g.beginPath();
      g.ellipse(X(b.lane), Y(b.y) + T * 0.16, T * 0.06, T * 0.16, 0, 0, Math.PI * 2);
      g.fill();
      g.restore();
    });

    game.zombies.forEach(z => bzDrawZombie(g, z, X(z.lane), Y(z.y), T, t, game.freeze > 0));

    // Swords of Revealing Light: three glowing swords pin the lanes.
    if (game.freeze > 0) {
      const a = Math.min(1, game.freeze / 0.5, (BZ_FREEZE_S - game.freeze) / 0.25 + 0.2);
      g.save();
      g.globalAlpha = a;
      g.fillStyle = 'rgb(254 249 195 / 0.12)';
      g.fillRect(0, Y(0), canvas.width, T * BZ_ROWS);
      for (let lane = 0; lane < BZ_COLS; lane++) bzDrawSword(g, X(lane), Y(0.8 + lane * 0.15), T);
      g.restore();
    }

    game.stars.forEach(s => {
      g.save();
      g.globalAlpha = Math.min(1, s.life / 1.2);
      lbDrawStar(g, s.x * T, Y(s.y), T * (0.22 + Math.sin(t * 5 + s.x) * 0.02), t);
      g.restore();
    });

    game.fx.forEach(p => {
      g.globalAlpha = Math.max(0, p.life / p.max);
      if (p.kind === 'dot') {
        g.fillStyle = p.color;
        g.beginPath();
        g.arc(p.x * T, Y(p.y), p.s * T, 0, Math.PI * 2);
        g.fill();
      } else {
        g.fillStyle = p.color;
        g.strokeStyle = '#1e0b3a';
        g.lineWidth = T * 0.06;
        g.font = `900 ${T * 0.24}px Cinzel, serif`;
        g.textAlign = 'center';
        g.strokeText(p.text, p.x * T, Y(p.y));
        g.fillText(p.text, p.x * T, Y(p.y));
      }
    });
    g.globalAlpha = 1;
  };

  const loop = now => {
    if (!overlay.isConnected) return bzClose();
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    update(dt);
    draw();
    bz.frame = requestAnimationFrame(loop);
  };

  // --- Input ---
  const tapField = e => {
    if (game.state !== 'play') return;
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const wx = ((e.clientX - rect.left) / rect.width) * BZ_COLS;
    const wy = ((e.clientY - rect.top) / rect.height) * BZ_H - BZ_TOP;
    const lane = Math.floor(wx);
    if (lane < 0 || lane >= BZ_COLS) return;

    const star = game.stars.find(s => Math.hypot(s.x - wx, s.y - wy) < 0.55);
    if (star) {
      game.stars.splice(game.stars.indexOf(star), 1);
      game.chips += 1;
      paintChips();
      restartClass(ui.chipsBox, 'is-bump', 400);
      burst(star.x, star.y, '#fde047', 8);
      sfx('bz-chip');
      return;
    }
    const tomb = game.tombs.find(tb => tb.lane === lane && Math.abs(tb.y - wy) < 0.6);
    if (tomb) {
      game.tombs.splice(game.tombs.indexOf(tomb), 1);
      game.banished += 1;
      burst(lane + 0.5, tomb.y, '#e0f2fe', 12);
      pop(lane, tomb.y - 0.3, 'Banished!', '#bae6fd');
      sfx('bz-banish');
      return;
    }
    const row = Math.floor(wy);
    const pick = game.selected && BZ_CARDS[game.selected];
    if (!pick || pick.spell || row < 0 || row >= BZ_ROWS || game.grid[lane][row] || game.chips < pick.cost) return;
    game.chips -= pick.cost;
    game.grid[lane][row] = { kind: game.selected, hp: pick.hp, max: pick.hp, cd: 0.3, hurt: 0, born: game.time };
    burst(lane + 0.5, row + 0.5, '#fde68a', 8);
    sfx('bz-place', 0, { card: game.selected });
    if (game.chips < pick.cost) game.selected = null;
    paintChips();
    paintTray();
  };

  const onCard = e => {
    const btn = e.target.closest('.bz-card');
    if (!btn || game.state !== 'play') return;
    const id = btn.dataset.card;
    const def = BZ_CARDS[id];
    if (def.spell) {
      if (game.chips < def.cost || game.swordsCd > 0) return sfx('bz-nope', 0.2);
      game.chips -= def.cost;
      game.swordsCd = BZ_SWORDS_CD_S;
      game.freeze = BZ_FREEZE_S;
      game.selected = null;
      paintChips();
      paintTray();
      restartClass(stage, 'is-swords', 900);
      sfx('bz-swords');
      return;
    }
    if (game.selected === id) game.selected = null;
    else if (game.chips >= def.cost) game.selected = id;
    else return sfx('bz-nope', 0.2);
    paintTray();
  };

  canvas.addEventListener('pointerdown', tapField);
  overlay.addEventListener('contextmenu', e => e.preventDefault());
  overlay.querySelector('.bz-tray').addEventListener('click', onCard);
  window.addEventListener('resize', resize);
  overlay.querySelector('.bz-quit').addEventListener('click', bzClose);
  overlay.querySelector('.bz-btn--back').addEventListener('click', bzClose);
  overlay.querySelector('.bz-btn--again').addEventListener('click', () => {
    newGame();
    playSound({ name: 'bz-start' });
  });
  bz.cleanup = () => window.removeEventListener('resize', resize);

  resize();
  newGame();
  bz.frame = requestAnimationFrame(loop);
}

// --- Drawing ----------------------------------------------------------------------

// The static graveyard, painted once per size: a moonlit sky with crooked
// headstones on top, a dark grass grid and the History scroll at the bottom.
function bzPaintGraveyard(T) {
  const c = document.createElement('canvas');
  c.width = Math.round(T * BZ_COLS);
  c.height = Math.round(T * BZ_H);
  const g = c.getContext('2d');
  const W = c.width;
  const top = BZ_TOP * T;

  const sky = g.createLinearGradient(0, 0, 0, top);
  sky.addColorStop(0, '#0b0418');
  sky.addColorStop(1, '#2e1065');
  g.fillStyle = sky;
  g.fillRect(0, 0, W, top);
  g.fillStyle = 'rgb(254 249 195 / 0.85)';
  g.beginPath();
  g.arc(W * 0.82, top * 0.42, T * 0.18, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#0b0418';
  g.beginPath();
  g.arc(W * 0.85, top * 0.36, T * 0.16, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#1e1b2e';
  [0.12, 0.38, 0.6].forEach((x, i) => {
    const w = T * 0.22;
    const h = T * (0.3 + (i % 2) * 0.08);
    g.save();
    g.translate(W * x, top);
    g.rotate((i - 1) * 0.12);
    g.beginPath();
    g.moveTo(-w / 2, 0);
    g.lineTo(-w / 2, -h + w / 2);
    g.arc(0, -h + w / 2, w / 2, Math.PI, 0);
    g.lineTo(w / 2, 0);
    g.fill();
    g.restore();
  });

  for (let lane = 0; lane < BZ_COLS; lane++) {
    for (let row = 0; row < BZ_ROWS; row++) {
      g.fillStyle = (lane + row) % 2 ? '#1a2e1f' : '#15261a';
      g.fillRect(lane * T, top + row * T, T, T);
    }
  }
  g.strokeStyle = 'rgb(134 239 172 / 0.12)';
  g.lineWidth = T * 0.02;
  g.setLineDash([T * 0.08, T * 0.08]);
  for (let lane = 1; lane < BZ_COLS; lane++) {
    g.beginPath();
    g.moveTo(lane * T, top);
    g.lineTo(lane * T, top + BZ_ROWS * T);
    g.stroke();
  }
  g.setLineDash([]);
  const fog = g.createLinearGradient(0, top, 0, top + T * 1.2);
  fog.addColorStop(0, 'rgb(168 85 247 / 0.25)');
  fog.addColorStop(1, 'rgb(168 85 247 / 0)');
  g.fillStyle = fog;
  g.fillRect(0, top, W, T * 1.2);

  // The History scroll, unrolled along the bottom.
  const sy = top + BZ_ROWS * T;
  const sh = BZ_BOTTOM * T;
  g.fillStyle = '#0b0418';
  g.fillRect(0, sy, W, sh);
  const paper = g.createLinearGradient(0, sy, 0, sy + sh);
  paper.addColorStop(0, '#fde68a');
  paper.addColorStop(1, '#d6a85c');
  g.fillStyle = paper;
  g.fillRect(T * 0.18, sy + sh * 0.18, W - T * 0.36, sh * 0.64);
  g.fillStyle = '#b45309';
  [T * 0.12, W - T * 0.12].forEach(x => {
    g.beginPath();
    g.ellipse(x, sy + sh / 2, T * 0.1, sh * 0.38, 0, 0, Math.PI * 2);
    g.fill();
  });
  g.fillStyle = '#78350f';
  g.font = `900 ${sh * 0.36}px Cinzel, serif`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText('Your History', W / 2, sy + sh / 2 + 1);
  return c;
}

function bzHpBar(g, x, y, w, k, color) {
  g.fillStyle = 'rgb(0 0 0 / 0.6)';
  g.fillRect(x - w / 2, y, w, w * 0.12);
  g.fillStyle = color;
  g.fillRect(x - w / 2, y, w * Math.max(0, k), w * 0.12);
}

function bzDrawMonster(g, m, x, y, T, t, kuri) {
  const age = t - m.born;
  const s = Math.min(1, age / 0.2) * (m.small ? 0.62 : 1);
  g.save();
  g.translate(x, y);
  if (m.hurt > 0) g.translate(Math.sin(t * 90) * T * 0.04, 0);
  if (m.kind === 'kuriboh') {
    const k = T * 0.9 * s;
    const bob = Math.sin(t * 4 + x) * T * 0.03;
    g.drawImage(kuri, -k / 2, -k / 2 + bob, k, k);
  } else {
    const def = BZ_CARDS[m.kind];
    const lean = m.swing > 0 ? -0.25 : 0;
    g.rotate(lean);
    const img = bzEmoji(def.icon, Math.ceil(T * 0.8));
    const k = T * 0.8 * s;
    g.drawImage(img, -k / 2, -k / 2, k, k);
    g.rotate(-lean);
    if (m.kind === 'guardian' && m.swing > 0) {
      g.strokeStyle = `rgb(224 242 254 / ${m.swing / 0.22})`;
      g.lineWidth = T * 0.07;
      g.beginPath();
      g.arc(0, -T * 0.2, T * 0.45, -Math.PI * 0.85, -Math.PI * 0.15);
      g.stroke();
    }
    if (m.kind === 'magician' && m.swing > 0) {
      g.fillStyle = `rgb(232 121 249 / ${m.swing / 0.25})`;
      g.beginPath();
      g.arc(T * 0.22, -T * 0.32, T * 0.12, 0, Math.PI * 2);
      g.fill();
    }
  }
  if (m.hp < m.max) bzHpBar(g, 0, T * 0.38, T * 0.6, m.hp / m.max, '#4ade80');
  g.restore();
}

function bzDrawZombie(g, z, x, y, T, t, frozen) {
  const def = BZ_ZOMBIES[z.type];
  const size = T * (z.type === 'armored' ? 0.86 : 0.78);
  const lift = z.hop ? Math.sin((z.hop.t / BZ_HOP_S) * Math.PI) * T * 0.7 : 0;
  const sway = frozen ? 0 : Math.sin(t * 3 + z.wob) * 0.12;
  g.save();
  g.translate(x, y - lift);
  g.rotate(sway);
  if (z.risen && !FX_LITE) {
    g.shadowColor = '#a855f7';
    g.shadowBlur = T * 0.3;
  }
  if (z.risen) g.globalAlpha = 0.85;
  g.drawImage(bzEmoji(def.icon, Math.ceil(size)), -size / 2, -size / 2, size, size);
  g.shadowBlur = 0;
  if (def.extra) {
    const e = size * 0.45;
    g.drawImage(bzEmoji(def.extra, Math.ceil(e)), z.type === 'armored' ? size * 0.05 : -e * 0.9, z.type === 'armored' ? 0 : -size * 0.5, e, e);
  }
  if (z.hurt > 0) {
    g.globalAlpha = z.hurt / 0.15 * 0.6;
    g.fillStyle = '#fff';
    g.beginPath();
    g.arc(0, 0, size * 0.42, 0, Math.PI * 2);
    g.fill();
  }
  g.globalAlpha = 1;
  if (frozen) {
    g.strokeStyle = 'rgb(254 240 138 / 0.85)';
    g.lineWidth = T * 0.04;
    g.beginPath();
    g.arc(0, 0, size * 0.5, 0, Math.PI * 2);
    g.stroke();
  }
  g.rotate(-sway);
  if (z.hp < z.max) bzHpBar(g, 0, -size * 0.62, T * 0.55, z.hp / z.max, '#f87171');
  g.restore();
}

// A tombstone with Call of the Haunted's purple ring, which runs out as the
// zombie gets ready to rise.
function bzDrawTomb(g, x, y, T, left, t) {
  const w = T * 0.42;
  const h = T * 0.5;
  const shake = left < 0.3 ? Math.sin(t * 50) * T * 0.025 : 0;
  g.save();
  g.translate(x + shake, y);
  g.strokeStyle = 'rgb(168 85 247 / 0.9)';
  g.lineWidth = T * 0.05;
  g.beginPath();
  g.arc(0, 0, T * 0.4, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.max(0, left));
  g.stroke();
  g.fillStyle = '#6b7280';
  g.strokeStyle = '#1f2937';
  g.lineWidth = T * 0.03;
  g.beginPath();
  g.moveTo(-w / 2, h / 2);
  g.lineTo(-w / 2, -h / 2 + w / 2);
  g.arc(0, -h / 2 + w / 2, w / 2, Math.PI, 0);
  g.lineTo(w / 2, h / 2);
  g.closePath();
  g.fill();
  g.stroke();
  g.fillStyle = '#1f2937';
  g.font = `900 ${T * 0.13}px Cinzel, serif`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText('RIP', 0, -h * 0.02);
  g.fillStyle = 'rgb(232 121 249 / 0.9)';
  [-1, 1].forEach(s => {
    g.beginPath();
    g.arc(s * w * 0.18, h * 0.62, T * 0.035, 0, Math.PI * 2);
    g.fill();
  });
  g.restore();
}

function bzDrawSword(g, x, y, T) {
  g.save();
  g.translate(x, y);
  g.shadowColor = '#fde047';
  g.shadowBlur = FX_LITE ? 0 : T * 0.4;
  g.fillStyle = '#fefce8';
  g.beginPath();
  g.moveTo(0, T * 0.55);
  g.lineTo(-T * 0.06, -T * 0.25);
  g.lineTo(T * 0.06, -T * 0.25);
  g.closePath();
  g.fill();
  g.fillStyle = '#facc15';
  g.fillRect(-T * 0.2, -T * 0.3, T * 0.4, T * 0.07);
  g.fillRect(-T * 0.04, -T * 0.5, T * 0.08, T * 0.2);
  g.restore();
}

function bzClose() {
  cancelAnimationFrame(bz.frame);
  bz.cleanup?.();
  bz.cleanup = null;
  bz.overlay?.remove();
  bz.overlay = null;
  startEgg.busy = false;
  // The overlay covered the button, so the hold's click may never have arrived.
  startEgg.swallowClick = false;
}
