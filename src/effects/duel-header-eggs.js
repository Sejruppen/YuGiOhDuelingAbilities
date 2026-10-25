// Duel-screen header easter eggs. Hold Reset or End for HEADER_EGG_PRESS_MS
// (the button trembles and glows) and instead of resetting/ending:
//
//   Reset -> Time Wizard: the roulette spins, lands on 💀, gets "nudged" onto
//            ⏪, and the whole duel rewinds like a VHS tape (scanlines,
//            "⏪ REWIND", LP rolling back)... then the tape clunks back to
//            ▶ PLAY with everything exactly as it was. "Time Magic! …nope,
//            still losing." Timeline: TW_MS, "TIME WIZARD" in effects.css.
//   End   -> End credits: an anime-style credit roll starring your duelist,
//            your deck and your (possibly redacted) abilities, with a cheesy
//            outro song. Tap or Escape skips. Nothing is actually ended.
//
// The click that follows the hold is swallowed. Sounds: 'time-wizard',
// 'end-credits' and 'end-credits-stop' in sounds.js (HEADER_EGG_SOUNDS).
const HEADER_EGG_PRESS_MS = 2000;
const TW_MS = 5000;
// Keep in sync with the `cr-*` timings in effects.css.
const CREDITS_MS = 21000;
const CREDITS_SKIP_GRACE_MS = 600;

const headerEgg = { timer: null, busy: false, swallowClick: false, credits: null };

function startHeaderEggPress(el, kind) {
  headerEgg.swallowClick = false;
  if (headerEgg.busy) return;
  clearTimeout(headerEgg.timer);
  el.classList.add('hdr-charging');
  headerEgg.timer = setTimeout(() => {
    el.classList.remove('hdr-charging');
    if (kind === 'reset') playTimeWizardRewind();
    else if (kind === 'end') rollEndCredits();
  }, HEADER_EGG_PRESS_MS);
}

function cancelHeaderEggPress(el) {
  clearTimeout(headerEgg.timer);
  el.classList.remove('hdr-charging');
}

// Reset's / End's onclick asks this first: false right after a hold.
function headerEggAllowsClick() {
  if (!headerEgg.swallowClick) return true;
  headerEgg.swallowClick = false;
  return false;
}

const hdrEsc = value => String(value ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

// --- Reset: Time Wizard ---------------------------------------------------------

const TW_SLOTS = ['⏪', '💀', '⏩', '💀', '🃏', '💀'];

function playTimeWizardRewind() {
  const overlay = spawnFx('fx-tw', TW_MS + 100, {
    html: `
      <div class="tw-tint"></div>
      <div class="tw-scan"></div>
      <div class="tw-band"></div>
      <div class="tw-flash"></div>
      <div class="tw-osd tw-osd--rew">⏪ REWIND</div>
      <div class="tw-osd tw-osd--time">--:--:--</div>
      <div class="tw-osd tw-osd--play">▶ PLAY</div>
      <div class="tw-wizard">
        <span class="tw-mage ce-emoji">🧙</span>
        <div class="tw-dial">
          ${TW_SLOTS.map((icon, i) => `<span class="tw-slot ce-emoji" style="--a: ${i * 60}deg;">${icon}</span>`).join('')}
          <span class="tw-needle"></span>
          <span class="tw-hub"></span>
        </div>
        <span class="tw-magic">TIME MAGIC!</span>
      </div>
      <div class="cegg-toast">Time Magic! …nope, still losing.<small>Time Wizard's warranty does not cover bad draws.</small></div>
    `
  });
  if (!overlay) return;

  headerEgg.busy = true;
  headerEgg.swallowClick = true;
  markEggFound('time-wizard');
  playSound({ name: 'time-wizard' });

  const app = document.getElementById('app');
  const realLp = getCurrentLp();
  const rewindStart = TW_MS * 0.38;
  const rewindEnd = TW_MS * 0.66;
  const clock = overlay.querySelector('.tw-osd--time');
  let seconds = 60 * Math.round(ceRand(18, 42)) + Math.round(ceRand(0, 59));
  let frame = null;
  let clockTimer = null;

  const paintClock = () => {
    const pad = n => String(n).padStart(2, '0');
    clock.textContent = `00:${pad(Math.floor(seconds / 60))}:${pad(seconds % 60)}`;
  };
  paintClock();

  setTimeout(() => {
    app?.classList.add('tw-rewinding');
    clockTimer = setInterval(() => {
      seconds = Math.max(0, seconds - Math.round(ceRand(9, 23)));
      paintClock();
    }, 60);
    // The LP counter "rewinds" towards the starting LP, with VHS jitter.
    const startedAt = performance.now();
    const span = rewindEnd - rewindStart;
    const step = now => {
      const p = Math.min(1, (now - startedAt) / span);
      const jitter = p < 1 ? Math.round(ceRand(-40, 40)) : 0;
      paintLp(Math.max(0, Math.round(realLp + (STARTING_LP - realLp) * p) + jitter));
      frame = p < 1 ? requestAnimationFrame(step) : null;
    };
    frame = requestAnimationFrame(step);
  }, rewindStart);

  setTimeout(() => {
    app?.classList.remove('tw-rewinding');
    clearInterval(clockTimer);
    if (frame) cancelAnimationFrame(frame);
    // ▶ PLAY: right back where we were.
    paintLp(getCurrentLp());
  }, rewindEnd);

  setTimeout(() => {
    headerEgg.busy = false;
  }, TW_MS);
}

// --- End: end credits -------------------------------------------------------------

function buildCreditsHtml() {
  const char = getSelectedCharacter() || { name: 'A Mysterious Duelist', theme: '' };
  const { skill, comeback, quest } = ABILITY_TYPES;
  const nameOf = type => (char[type.listKey] ? getSelectedAbility(char, type)?.name : null) || '???';
  const lp = getCurrentLp();

  const others = CHARACTERS
    .filter(c => c.id !== char.id && c.id !== CUSTOM_CHARACTER_ID)
    .map(c => c.name)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3);

  const row = (role, name) => `<div class="cr-row"><span class="cr-role">${role}</span><span class="cr-name">${name}</span></div>`;
  const section = (title, rows) => `<div class="cr-section"><h3>${title}</h3>${rows.join('')}</div>`;

  const lpRole = lp >= STARTING_LP ? 'as the Untouchables' : lp > 1000 ? 'as the Survivors' : 'as the Last Ones Standing';

  return `
    <div class="cr-title">
      <small>Yu-Gi-Oh!</small>
      DUELING ABILITIES
      <em>Episode ∞: "${hdrEsc(char.name)} vs. Fate"</em>
    </div>
    ${section('Starring', [
      row(hdrEsc(char.name), 'as Themself'),
      row('Your Deck', 'as Disappointment'),
      row(`${lp} Life Points`, lpRole),
      row(state.skillRevealed ? hdrEsc(nameOf(skill)) : '[REDACTED]', 'as the Secret Skill'),
      row(state.comebackRevealed ? hdrEsc(nameOf(comeback)) : '[CLASSIFIED]', 'as "Plan B"'),
      row(state.questCompleted ? hdrEsc(nameOf(quest)) : 'The Quest', state.questCompleted ? 'as Mission Accomplished' : 'as Unfinished Business')
    ])}
    ${section('Guest Appearances', [
      row('Exodia', '4 of 5 pieces (one couldn\'t make it)'),
      row('Kuriboh', 'Stunt Double'),
      row('Pot of Greed', 'Role Unknown'),
      row('Time Wizard', 'Continuity Consultant')
    ])}
    ${section('Crew', [
      row('Hair Stylist', 'Yugi\'s Hair (self-managed)'),
      row('Legal Department', '"Screw the rules" — S. Kaiba'),
      row('Shuffling Consultant', 'Bandit Keith (not recommended)'),
      row('Friendship Speeches', 'Téa Gardner'),
      row('Heart of the Cards', 'Grandpa Muto'),
      row('Catering', 'Joey Wheeler (ate it all)')
    ])}
    ${others.length ? section('Special Thanks', [
      `<div class="cr-row cr-row--solo">${others.map(hdrEsc).join(', ')}<br>for showing up</div>`
    ]) : ''}
    <div class="cr-fine">
      <p>No Kuribohs were harmed in the making of this duel.</p>
      <p>Filmed on location at your kitchen table.</p>
      <p>Any resemblance to a good draw is purely coincidental.</p>
    </div>
  `;
}

function rollEndCredits() {
  const overlay = spawnFx('fx-credits', CREDITS_MS + 100, {
    html: `
      <div class="cr-roll">${buildCreditsHtml()}</div>
      <div class="cr-end">
        <strong>THE END</strong>
        <span class="cr-q">…?</span>
        <div class="cr-next">
          <small>Next time on Yu-Gi-Oh!</small>
          You actually press End.
        </div>
      </div>
      <div class="cr-skip-hint">Tap to skip</div>
    `
  });
  if (!overlay) return;

  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-label', 'End credits. Tap to skip.');
  headerEgg.busy = true;
  headerEgg.swallowClick = true;
  markEggFound('end-credits');
  playSound({ name: 'end-credits' });

  const openedAt = performance.now();
  const finish = () => {
    if (headerEgg.credits !== overlay) return;
    headerEgg.credits = null;
    headerEgg.busy = false;
    document.removeEventListener('keydown', onKey);
  };
  const skip = () => {
    if (headerEgg.credits !== overlay || performance.now() - openedAt < CREDITS_SKIP_GRACE_MS) return;
    playSound({ name: 'end-credits-stop' });
    overlay.classList.add('cr-skipping');
    finish();
    setTimeout(() => overlay.remove(), 450);
  };
  const onKey = event => {
    if (event.key === 'Escape') skip();
  };

  headerEgg.credits = overlay;
  overlay.addEventListener('click', skip);
  document.addEventListener('keydown', onKey);
  setTimeout(finish, CREDITS_MS);
}
