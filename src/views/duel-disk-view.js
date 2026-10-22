// Secret Duel Disk screen (game logic in src/actions/duel-disk-actions.js).
// renderDuelDiskView() is the full screen; renderDiskBoard() is everything
// inside #disk-root, which the game repaints on its own.

// A one-off animation keyed to a timestamp: while it's still running, a
// negative animation-delay resumes it where it was, so repaints don't restart
// it. `ms` must match the animation's duration in effects.css.
function diskAnim(at, ms, className) {
  if (!at) return { cls: '', style: '' };
  const elapsed = diskNow() - at;
  if (elapsed >= ms) return { cls: '', style: '' };
  return { cls: ` ${className}`, style: `animation-delay: -${Math.round(elapsed)}ms;` };
}

const DISK_DUMMY_SVG = `
  <svg viewBox="0 0 100 110" aria-hidden="true">
    <rect x="46" y="62" width="8" height="46" rx="2" fill="#78350f" stroke="#451a03" stroke-width="1.5"/>
    <rect x="6" y="40" width="88" height="7" rx="3" fill="#92400e" stroke="#451a03" stroke-width="1.5"/>
    <path d="M6 39 l-4 -5 M6 43.5 l-5 0 M6 48 l-4 5 M94 39 l4 -5 M94 43.5 l5 0 M94 48 l4 5" stroke="#facc15" stroke-width="2" stroke-linecap="round"/>
    <path d="M30 34 Q27 66 36 76 L64 76 Q73 66 70 34 Z" fill="#d6b77a" stroke="#7c5a22" stroke-width="2"/>
    <path d="M10 45 L32 39 L32 50 L10 56 Z" fill="#94a3b8" stroke="#fbbf24" stroke-width="1.5"/>
    <path d="M14 47 l4 -1 M20 45.5 l4 -1 M26 44 l4 -1" stroke="#22d3ee" stroke-width="2"/>
    <circle cx="50" cy="55" r="9" fill="#fef2f2" stroke="#b91c1c" stroke-width="2.5"/>
    <circle cx="50" cy="55" r="4" fill="#dc2626"/>
    <path d="M31 67 L69 67" stroke="#92400e" stroke-width="3"/>
    <path d="M38 40 l3 3 M61 45 l3 -2 M41 73 l2 -3 M58 72 l2 2" stroke="#7c5a22" stroke-width="1.2"/>
    <path d="M38 9 l-4 -6 M50 7 l0 -6 M62 9 l4 -6" stroke="#facc15" stroke-width="2" stroke-linecap="round"/>
    <circle cx="50" cy="22" r="15" fill="#e7cf9b" stroke="#7c5a22" stroke-width="2"/>
    <path d="M40 15 l6 6 m0 -6 l-6 6 M54 15 l6 6 m0 -6 l-6 6" stroke="#1c1917" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M41 29 Q50 25 59 29" fill="none" stroke="#1c1917" stroke-width="2" stroke-linecap="round"/>
    <path d="M44 27.5 l0 3 M50 26.5 l0 3 M56 27.5 l0 3" stroke="#1c1917" stroke-width="1.2"/>
  </svg>
`;

const DISK_RESULT_TITLES = { win: 'YOU WIN!', exodia: 'EXODIA!', lose: 'DEFEAT…' };

const diskFrame = def => (def.kind === 'monster' ? (def.effect ? 'effect' : 'normal') : def.kind);

function renderDiskArt(def) {
  const art = typeof def.art === 'function' ? def.art() : `<span class="disk-emoji">${def.art}</span>`;
  return `<div class="disk-art ${def.artClass || ''}${def.flip ? ' is-flipped' : ''}">${art}</div>`;
}

function renderDiskCard(card, faceDown = false) {
  if (faceDown) return '<div class="disk-card is-down"><span class="disk-card-back"></span></div>';
  const def = diskDef(card);
  const foot = def.kind === 'monster'
    ? `<span>Lv${def.level}</span><span>${def.atk}</span>`
    : `<span>${def.kind === 'spell' ? 'SPELL' : 'TRAP'}</span>`;
  return `
    <div class="disk-card disk-card--${diskFrame(def)}">
      <div class="disk-card-name">${def.name}</div>
      <div class="disk-card-art">${renderDiskArt(def)}</div>
      <div class="disk-card-foot">${foot}</div>
    </div>
  `;
}

function renderDuelDiskView() {
  ensureDiskGame();
  return `
    <div class="disk-screen flex-1 min-h-0 flex flex-col">
      <header class="disk-header">
        <button type="button" onclick="closeDuelDisk()" class="disk-back">← Back</button>
        <div class="disk-title">Duel Disk</div>
        ${renderSoundIconButton()}
      </header>
      <div id="disk-root" class="disk-root">${renderDiskBoard()}</div>
    </div>
  `;
}

function renderDiskBoard() {
  const error = diskAnim(disk.fx.errorAt, 400, 'is-error');
  return `
    ${renderDiskOpponent()}
    <div class="disk-message${error.cls}" style="${error.style}" aria-live="polite">${disk.message}</div>
    ${renderDiskField()}
    ${renderDiskPlayerBar()}
    ${renderDiskDetail()}
    ${renderDiskHand()}
    ${disk.showGrave ? renderDiskGrave() : ''}
    ${disk.result ? renderDiskResult() : ''}
  `;
}

function renderDiskOpponent() {
  const hit = diskAnim(disk.fx.dummyHitAt, 500, 'is-hit');
  const swing = diskAnim(disk.fx.dummyAttackAt, 700, 'is-attacking');
  const fall = diskAnim(disk.fx.stuckAt, 900, 'is-falling');
  const body = swing.cls ? swing : fall;
  const chips = [];
  if (disk.swords) chips.push(`<span class="disk-chip disk-chip--swords">⚔️ Frozen ×${disk.swords}</span>`);
  if (disk.dummyStuck) chips.push('<span class="disk-chip disk-chip--stuck">🕳️ Stuck in a hole</span>');

  return `
    <div class="disk-opponent">
      <div class="disk-dummy${hit.cls}${disk.dummyStuck ? ' is-stuck' : ''}${disk.swords ? ' is-frozen' : ''}" style="${hit.style}">
        <div class="disk-dummy-hole"></div>
        <div class="disk-dummy-body${body.cls}" style="${body.style}">${DISK_DUMMY_SVG}</div>
      </div>
      <div class="disk-opp-info">
        <div class="disk-opp-row">
          <span class="disk-opp-name">Training Dummy</span>
          <span class="disk-opp-lp"><span data-disk-lp="dummy">${disk.shown.dummy}</span> LP</span>
        </div>
        <div class="disk-lp-bar"><div class="disk-lp-fill" data-disk-fill="dummy" style="width: ${diskLpPercent(disk.shown.dummy)}%"></div></div>
        <div class="disk-chips">${chips.join('')}</div>
      </div>
    </div>
  `;
}

function renderDiskField() {
  const bootElapsed = disk.fx.bootAt ? diskNow() - disk.fx.bootAt : Infinity;
  const booting = bootElapsed < 1600;
  const selected = disk.hand.find(c => c.uid === disk.selected);
  const selectedDef = selected && diskDef(selected);

  return `
    <div class="disk-field">
      <div class="disk-plate${booting ? ' is-booting' : ''}" style="--boot-e: ${booting ? Math.round(bootElapsed) : 0}ms">
        <div class="disk-plate-lights"></div>
        <div class="disk-grid">
          ${disk.monsters.map((m, i) => renderDiskMonsterZone(m, i, selectedDef)).join('')}
          ${renderDiskGraveSlot()}
          ${disk.spells.map((c, i) => renderDiskSpellZone(c, i, selectedDef)).join('')}
          ${renderDiskDeck()}
        </div>
      </div>
    </div>
  `;
}

function renderDiskMonsterZone(monster, i, selectedDef) {
  const valid = selectedDef?.kind === 'monster' && !disk.summoned && (!monster || diskTributesFor(selectedDef) > 0);
  let inner = '';
  let label = `Monster zone ${i + 1}`;

  if (monster) {
    const def = diskDef(monster);
    const rise = diskAnim(monster.bornAt, 900, 'is-rising');
    const strike = diskAnim(monster.attackAt, 750, 'is-striking');
    const buff = diskAnim(monster.buffAt, 700, 'is-buffed');
    label = `${def.name}, ${diskAtk(monster)} ATK${monster.attacked ? ', already attacked' : ', tap to attack'}`;
    inner = `
      <div class="disk-holo${rise.cls}" style="${rise.style}">
        <div class="disk-holo-strike${strike.cls}" style="${strike.style}">
          <div class="disk-holo-art">${renderDiskArt(def)}</div>
        </div>
      </div>
      ${renderDiskCard(monster)}
      <span class="disk-atk${buff.cls}${monster.bonus ? ' is-boosted' : ''}" style="${buff.style}">${diskAtk(monster)}</span>
    `;
  }

  return `<button type="button" class="disk-zone disk-zone--m${monster ? ' has-card' : ''}${monster?.attacked ? ' is-spent' : ''}${valid ? ' is-valid' : ''}" style="--i: ${i}" data-drop="m-${i}" onclick="tapDiskZone('m', ${i})" aria-label="${label}">${inner}</button>`;
}

function renderDiskSpellZone(card, i, selectedDef) {
  const valid = selectedDef && selectedDef.kind !== 'monster' && !card;
  let inner = '';
  let label = `Spell and trap zone ${i + 1}`;

  if (card) {
    const flip = diskAnim(card.flipAt, 600, 'is-flipping');
    const set = diskAnim(card.faceDown ? card.bornAt : null, 400, 'is-setting');
    const wiggle = disk.fx.trapWiggle?.i === i ? diskAnim(disk.fx.trapWiggle.at, 500, 'is-wiggling') : { cls: '', style: '' };
    const anim = flip.cls ? flip : set.cls ? set : wiggle;
    label = card.faceDown ? 'Face-down card' : diskDef(card).name;
    inner = `<div class="disk-zone-card${anim.cls}" style="${anim.style}">${renderDiskCard(card, card.faceDown)}</div>`;
    if (card.id === 'swords' && !card.faceDown) inner += `<span class="disk-counter">${disk.swords}</span>`;
  }

  return `<button type="button" class="disk-zone disk-zone--s${card ? ' has-card' : ''}${valid ? ' is-valid' : ''}" style="--i: ${i + 6}" data-drop="s-${i}" onclick="tapDiskZone('s', ${i})" aria-label="${label}">${inner}</button>`;
}

function renderDiskGraveSlot() {
  const count = disk.graveyard.length;
  const top = disk.graveyard[count - 1];
  return `
    <button type="button" class="disk-gy" style="--i: 5" data-drop="gy" onclick="openDiskGrave()" aria-label="Graveyard, ${count} cards">
      ${top ? `<div class="disk-gy-top">${renderDiskCard(top)}</div>` : '<span class="disk-gy-icon">🪦</span>'}
      <span class="disk-slot-label">GY ${count}</span>
    </button>
  `;
}

function renderDiskDeck() {
  const count = disk.deck.length;
  const shuffle = diskAnim(disk.fx.shuffleAt, 700, 'is-shuffling');
  const ready = disk.needsDraw && !disk.busy && !disk.result;
  return `
    <button type="button" class="disk-deck${ready ? ' is-ready' : ''}${count ? '' : ' is-empty'}${shuffle.cls}" style="--i: 11; ${shuffle.style}" onclick="tapDiskDeck()" onpointerdown="startDiskShuffle()" onpointerup="cancelDiskShuffle()" onpointerleave="cancelDiskShuffle()" onpointercancel="cancelDiskShuffle()" oncontextmenu="return false" aria-label="Deck, ${count} cards${ready ? ', tap to draw' : ''}">
      ${count ? '<span class="disk-deck-stack"></span>' : ''}
      ${ready ? '<span class="disk-draw-tag">DRAW!</span>' : ''}
      <span class="disk-slot-label">${count}</span>
    </button>
  `;
}

function renderDiskPlayerBar() {
  const canEnd = !disk.busy && !disk.result && !disk.needsDraw;
  return `
    <div class="disk-player">
      <div class="disk-me">
        <span class="disk-me-label">YOU</span>
        <span class="disk-me-lp" data-disk-lp="player">${disk.shown.player}</span>
        <span class="disk-me-label">LP</span>
      </div>
      <div class="disk-turn">Turn ${disk.turn}<span>${disk.summoned ? 'Summoned ✓' : 'Summon ready'}</span></div>
      <button type="button" class="disk-end${canEnd ? '' : ' is-off'}" onclick="diskEndTurn()">End Turn ▶</button>
    </div>
  `;
}

function renderDiskDetail() {
  const card = disk.hand.find(c => c.uid === disk.selected);
  if (!card) {
    return '<div class="disk-detail is-hint">Tap a card to inspect it · drag it onto the disk to play it · tap your monsters to attack · hold the deck to shuffle</div>';
  }

  const def = diskDef(card);
  const stats = def.kind === 'monster' ? `Level ${def.level} · ${def.atk} ATK` : def.kind === 'spell' ? 'Spell Card' : 'Trap Card';
  const button = (label, call, cls = '', title = '') =>
    `<button type="button" class="disk-action ${cls}" onclick="${call}"${title ? ` title="${title}" aria-label="${title}"` : ''}>${label}</button>`;
  const actions = [];
  if (def.kind === 'monster') {
    const need = diskTributesFor(def);
    actions.push(button(need ? `Tribute ×${need}` : 'Summon', `diskPlay(${card.uid}, 'm')`, 'is-primary'));
  } else if (def.kind === 'spell') {
    actions.push(button('Activate', `diskPlay(${card.uid}, 's')`, 'is-primary'));
    actions.push(button('Set', `diskSet(${card.uid})`));
  } else {
    actions.push(button('Set', `diskSet(${card.uid})`, 'is-primary'));
  }
  actions.push(button('🪦', `diskPlay(${card.uid}, 'gy')`, 'is-discard', 'Discard'));

  return `
    <div class="disk-detail disk-detail--${diskFrame(def)}">
      <div class="disk-detail-info">
        <div class="disk-detail-name">${def.name} <span>${stats}</span></div>
        <div class="disk-detail-text">${def.text}</div>
      </div>
      <div class="disk-detail-actions">${actions.join('')}</div>
    </div>
  `;
}

function renderDiskHand() {
  if (!disk.hand.length) {
    return `<div class="disk-hand is-empty"><span>${disk.busy ? '' : 'Your hand is empty'}</span></div>`;
  }
  const cards = disk.hand.map(card => {
    const drawn = diskAnim(card.drawnAt, 500, 'is-drawn');
    const selected = card.uid === disk.selected;
    // Keyboard "clicks" have detail 0; pointer taps are handled by diskCardDown.
    return `<button type="button" class="disk-hand-card${selected ? ' is-selected' : ''}${drawn.cls}" style="${drawn.style}" data-hand-uid="${card.uid}" onpointerdown="diskCardDown(event, ${card.uid})" onclick="if (event.detail === 0) selectDiskCard(${card.uid})" oncontextmenu="return false" aria-pressed="${selected}" aria-label="${diskDef(card).name}">${renderDiskCard(card)}</button>`;
  }).join('');
  return `<div class="disk-hand no-scrollbar">${cards}</div>`;
}

function renderDiskGrave() {
  const cards = [...disk.graveyard].reverse();
  const list = cards.length
    ? `<div class="disk-grave-grid">${cards.map(c => `<div class="disk-grave-card">${renderDiskCard(c)}</div>`).join('')}</div>`
    : '<p class="disk-grave-empty">Nothing here yet. 🪦</p>';
  return `
    <div class="disk-modal" onclick="if (event.target === this) closeDiskGrave()">
      <div class="disk-modal-panel">
        <div class="disk-modal-head">
          <span>Graveyard (${cards.length})</span>
          <button type="button" class="disk-modal-close" onclick="closeDiskGrave()" aria-label="Close">✕</button>
        </div>
        ${list}
      </div>
    </div>
  `;
}

function renderDiskResult() {
  const { kind, reason } = disk.result;
  return `
    <div class="disk-result disk-result--${kind}">
      <div class="disk-result-panel">
        <div class="disk-result-title">${DISK_RESULT_TITLES[kind]}</div>
        <p class="disk-result-text">${reason}</p>
        <p class="disk-result-stats">Turns: ${disk.turn} · Your LP: ${disk.lp}</p>
        <div class="disk-result-actions">
          <button type="button" class="disk-action is-primary" onclick="newDiskGame()">Duel again</button>
          <button type="button" class="disk-action" onclick="closeDuelDisk()">Back to start</button>
        </div>
      </div>
    </div>
  `;
}
