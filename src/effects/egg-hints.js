// Hints for every easter egg (egg-tracker.js EGG_IDS). The Settings screen has
// a "Get a hint" button under the secrets counter: each tap shows the hint for
// a random secret you haven't found yet (never the same one twice in a row).
// The hint closes by itself once that secret is found.
// Hints only nudge in the right direction; they never spell out the steps.
// The title of a hint is always the view the secret lives in, never the secret.
// Spamming the button is itself an egg ("The Hint of the Cards", below).
const HINT_VIEW = {
  start: 'Start screen',
  settings: 'Settings',
  tournament: 'Tournament',
  coop: 'Co-op Boss',
  character: 'Choose Character',
  duel: 'Duel'
};
const TOMB = HINT_VIEW.coop;
const charHint = name => ({ where: HINT_VIEW.character, text: `${name} has more to show than a quick tap reveals. Have you given them a moment of your time?` });

const EGG_HINTS = {
  // Start screen
  'exodia': { where: 'Start screen', text: 'The logo seems to enjoy attention.' },
  'duel-disk': { where: 'Start screen', text: 'A true duelist never rushes into setup. What happens if you hesitate before you start?' },
  'dk-invitation': { where: 'Start screen', text: 'Pegasus likes to send personal invitations. Have you been patient with the tournament?' },
  'friendship-sign': { where: 'Start screen', text: 'Friends stick together. Do you stick with your co-op friends long enough?' },
  'limiter-removal': { where: 'Start screen', text: 'Even the most boring button has a limiter. Some things only break free under steady pressure.' },
  // Settings
  'dizzy': { where: 'Settings', text: 'Can\'t make up your mind about how the app should look? It might not be able to either.' },
  'speaker': { where: 'Settings', text: 'Speakers have feelings too. How much on and off can one speaker take?' },
  'shrink-ray': { where: 'Settings', text: 'Is small ever really small enough? Some people just won\'t take no for an answer.' },
  'obelisk-headroom': { where: 'Settings', text: 'Bigger, BIGGER! Some gods need more headroom than others.' },
  // Tournament setup
  'kuriboh-multiply': { where: 'Tournament', text: 'The tournament is full. But what if more duelists really, really want in?' },
  'rock-paper-scissors': { where: 'Tournament', text: 'Can a tournament get any smaller? What would the last two duelists do about it?' },
  'star-chips': { where: 'Tournament', text: 'Every duelist dreams of the trophy. Have you held on to that dream?' },
  'penalty-dice': { where: 'Tournament', text: 'Eager to get the tournament started? The best duelists know that how you begin can matter more than how fast.' },
  // Co-op setup
  'duel-school': { where: HINT_VIEW.coop, text: 'Every rookie has to learn somewhere. Does the easy road have something to teach you?' },
  'time-to-duel': { where: HINT_VIEW.coop, text: 'It\'s time to d-d-d-duel! But are you a true duelist? Prove you can commit.' },
  'true-name': { where: HINT_VIEW.coop, text: 'The Pharaoh has forgotten something important. Only the bravest will find his tomb and remind him.' },
  'relinquished': { where: HINT_VIEW.coop, text: 'Before you face Pegasus, think twice. Some of his monsters love to absorb things.' },
  'architect': { where: TOMB, text: 'Every tomb has an architect, and this one remembers who built it.' },
  'name-theodor': { where: TOMB, text: 'The tomb knows the boy behind the Theotaur.' },
  'name-tristan': { where: TOMB, text: 'The tomb knows the legend behind Trizze.' },
  'name-otto': { where: TOMB, text: 'Forwards or backwards, this name charges the same way. Brace for a brotherly stampede.' },
  'name-frida': { where: TOMB, text: 'A tiny Mistress sister of All Evil hates not being invited. The tomb is the perfect place for a curse.' },
  'name-marie': { where: TOMB, text: 'Every tomb has a heart. Whose name holds the architect\'s?' },
  // Character select
  'dark-paladin': { where: HINT_VIEW.character, text: 'Theotaur is a fusion of more than you think. Maybe he just needs a moment to come together.' },
  'divine-offering': { where: HINT_VIEW.character, text: 'Trizze\'s legends attract the attention of the gods. Will you give them the time they need?' },
  'char-neutral': charHint('Neutral'),
  'char-custom': charHint('Custom'),
  'char-yugi-dk': charHint('Yugi (Duelist Kingdom)'),
  'char-yugi-bc': charHint('Yugi (Battle City)'),
  'char-kaiba-dk': charHint('Kaiba (Duelist Kingdom)'),
  'char-kaiba-bc': charHint('Kaiba (Battle City)'),
  'char-joey-dk': charHint('Joey (Duelist Kingdom)'),
  'char-joey-bc': charHint('Joey (Battle City)'),
  'char-mai': charHint('Mai Valentine'),
  'char-mako': charHint('Mako Tsunami'),
  'char-bakura': charHint('Bakura'),
  'char-pegasus': charHint('Pegasus'),
  'char-odion': charHint('Odion'),
  'char-ishizu': charHint('Ishizu'),
  'char-marik-1': charHint('Marik (Sadistic Slimes)'),
  'char-marik-2': charHint('Marik (Wrath of the Sun God)'),
  'char-weevil': charHint('Weevil'),
  'char-keith': charHint('Bandit Keith'),
  // Duel screen
  'shadow-realm': { where: 'Duel', text: 'Losing isn\'t always just losing. Sometimes the shadows come to collect.' },
  'screw-the-rules': { where: 'Duel', text: 'Used abilities are used... Just do not get angry about it.' },
  'trap-hole': { where: 'Duel', text: 'Comebacks can be a trap. Don\'t be too quick to spring yours.' },
  'pot-of-greed': { where: 'Duel', text: 'Ever wondered what your Skill really does? Be greedy with your patience.' },
  'gaia': { where: 'Duel', text: 'Quests take time to complete. Some deliveries come by horse.' },
  'mind-crush': { where: 'Duel', text: 'Someone is watching you peek. Do you peek often at your abilities?' },
  'millennium-puzzle': { where: 'Duel', text: 'Your hidden cards are each a piece of something ancient. Lock in and find the right order!' },
  'pharaoh-nap': { where: 'Duel', text: 'Even Pharaohs get sleepy when nothing happens.' },
  'heart-of-the-cards': { where: 'Duel', text: 'Do you believe in the heart of the cards? It starts with believing in yourself.' },
  'time-wizard': { where: 'Duel', text: 'Wish you could turn back time? Starting over takes more than a quick decision.' },
  'end-credits': { where: 'Duel', text: 'Every good story deserves credits. Are you ready to let it end?' },
  // LP modal
  'change-of-heart': { where: 'Life Points', text: 'Your Life Points have a heart. Is it loyal enough to hold on to?' },
  'noah-delete': { where: 'Life Points', text: 'Some duelists keep erasing long after there\'s nothing left.' },
  'kaiba-rip': { where: 'Life Points', text: 'Cutting things in half is a quick job. Some rivals prefer to take their time and make it dramatic.' },

  'kuriboh-dash': { where: 'Life Points', text: 'Lingering on starting over is very common.' },
  // Hints
  'hint-of-the-cards': { where: 'Settings', text: 'Desperate for answers? Grandpa has seen impatient duelists before. Keep asking and he might just hand you one.' }
};

// --- "The Hint of the Cards" ---------------------------------------------------
// Spamming "Get a hint" (taps at most HC_TAP_GAP_MS apart) swaps the real hints
// for silly fake ones after HC_FAKE_AFTER taps. At HC_TAPS Grandpa Muto shows
// up with the only hint he'll give: an easter egg.
const HC_TAP_GAP_MS = 600;
const HC_FAKE_AFTER = 8;
const HC_TAPS = 30;
const HC_MS = 7000;
const HC_FAKE_HINTS = [
  { where: 'Duel', text: 'Play Exodia, the Forbidden One. Win. That\'s not a hint, that\'s just good advice.' },
  { where: 'Kaiba Corp', text: 'Screw the hints!' },
  { where: 'Shadow Realm', text: 'The hint was sent to the Shadow Realm. It\'s not coming back.' },
  { where: 'Duelist Kingdom', text: 'Pegasus already knows which egg you\'re looking for. He\'s just not telling you.' },
  { where: 'The phone', text: 'Try shaking your phone. (Nothing happens. You just look silly.)' },
  { where: 'The Pharaoh\'s tomb', text: 'The true name of the Pharaoh is… <i>(signal lost)</i>' },
  { where: 'Domino City', text: 'Grandpa says: stop tapping and go outside.' },
  { where: 'Settings', text: 'Drink some water. You\'ve been tapping for a while.' },
  { where: 'The Hint Button', text: 'Get a hint. <i>(you are here)</i>' },
  { where: 'Bakura\'s mind', text: 'You think you\'re looking for eggs. The eggs are looking for you.' },
  { where: 'Téa\'s speech', text: 'The real easter egg was the friends we made along the way. ♥' },
  { where: 'Nowhere', text: 'This hint is a Trap Card! <span class="ce-emoji">🃏</span>' }
];

eggTracker.hintId = null;
eggTracker.fakeHint = -1;
const hintSpam = { taps: 0, lastAt: 0, coolTimer: null };
// The button heats up as a spam streak nears HC_TAPS (see renderEggHint).
const HC_HEAT_FROM = 3;
const HC_HEAT_LABELS = [[24, 'GIVE ME THE HINT!!!'], [18, 'HINTS!! NOW!!'], [13, 'MORE HINTS!!'], [HC_FAKE_AFTER + 1, 'More hints!'], [HC_HEAT_FROM + 1, 'Another hint!']];

const getUnfoundEggIds = () => EGG_IDS.filter(id => !eggTracker.found.has(id));

function getHintCandidates() {
  return getUnfoundEggIds().filter(id => id !== eggTracker.hintId && EGG_HINTS[id]);
}

// The Settings button's onclick.
function showEggHint() {
  const candidates = getHintCandidates();
  if (!candidates.length) return;
  const now = Date.now();
  hintSpam.taps = now - hintSpam.lastAt <= HC_TAP_GAP_MS ? hintSpam.taps + 1 : 1;
  hintSpam.lastAt = now;
  // Cool the button back down once the streak is broken.
  clearTimeout(hintSpam.coolTimer);
  hintSpam.coolTimer = setTimeout(() => {
    hintSpam.taps = 0;
    render();
  }, HC_TAP_GAP_MS + 50);

  if (hintSpam.taps >= HC_TAPS) {
    clearTimeout(hintSpam.coolTimer);
    hintSpam.taps = 0;
    eggTracker.fakeHint = -1;
    render();
    playHintOfTheCardsEgg();
    return;
  }
  if (hintSpam.taps > HC_FAKE_AFTER) {
    let next;
    do next = Math.floor(Math.random() * HC_FAKE_HINTS.length); while (next === eggTracker.fakeHint);
    eggTracker.fakeHint = next;
  } else {
    eggTracker.fakeHint = -1;
    eggTracker.hintId = candidates[Math.floor(Math.random() * candidates.length)];
  }
  render();
}

function clearEggHint(id) {
  if (id === undefined || eggTracker.hintId === id) eggTracker.hintId = null;
}

function renderEggHint() {
  if (allEggsFound()) return '';
  const hint = eggTracker.fakeHint >= 0 ? HC_FAKE_HINTS[eggTracker.fakeHint] : eggTracker.hintId ? EGG_HINTS[eggTracker.hintId] : null;
  const canAsk = getHintCandidates().length > 0;
  const heat = Math.max(0, Math.min(1, (hintSpam.taps - HC_HEAT_FROM) / (HC_TAPS - 1 - HC_HEAT_FROM)));
  const heatLabel = HC_HEAT_LABELS.find(([from]) => hintSpam.taps >= from)?.[1];
  const button = canAsk ? `
    <button type="button" onclick="showEggHint()" class="${heat ? 'hc-heat ' : ''}w-full max-w-xs mt-2 py-2 px-4 rounded-xl text-xs font-bold transition border bg-slate-900/80 border-slate-800 text-amber-300 hover:bg-slate-800"${heat ? ` style="--heat: ${heat.toFixed(3)};"` : ''}>
      <span class="ce-emoji">💡</span> ${heatLabel || (hint ? 'Another hint' : 'Get a hint')}
    </button>` : '';
  const card = hint ? `
    <div class="egg-hint w-full max-w-xs mt-2 px-3 py-2.5 rounded-xl bg-amber-950/30 border border-amber-500/30 text-left" role="status">
      <p class="text-[10px] font-semibold uppercase tracking-widest text-amber-400"><span class="ce-emoji">💡</span> ${hint.where}</p>
      <p class="mt-1 text-xs text-slate-200 leading-relaxed">${hint.text}</p>
    </div>` : '';
  return button + card;
}

const missingEggHints = EGG_IDS.filter(id => !EGG_HINTS[id]);
if (missingEggHints.length) console.warn('Easter eggs without a hint:', missingEggHints);

// Grandpa Muto, pleased with himself: bandana, grey tufts, bushy brows, happy
// closed eyes, moustache and goatee, in shirt and overalls. .hc-arm starts
// tucked behind his back and swings up around the shoulder (88, 100).
const HC_GRANDPA_SVG = `
  <svg class="hc-svg" viewBox="0 0 120 160" aria-hidden="true">
    <g class="hc-arm">
      <path d="M88 100 L103 58" stroke="#a3b18a" stroke-width="13" stroke-linecap="round" />
      <circle cx="105" cy="52" r="7.5" fill="#f5c9a0" />
    </g>
    <path d="M28 160 L31 106 Q60 88 92 106 L94 160 Z" fill="#a3b18a" />
    <path d="M40 160 L42 118 L80 118 L82 160 Z" fill="#2563eb" />
    <path d="M42 120 L38 100 M80 120 L84 100" stroke="#2563eb" stroke-width="5" stroke-linecap="round" />
    <circle cx="44" cy="124" r="2" fill="#fde68a" />
    <circle cx="78" cy="124" r="2" fill="#fde68a" />
    <rect x="54" y="78" width="12" height="14" fill="#e8b48a" />
    <ellipse cx="60" cy="58" rx="22" ry="25" fill="#f5c9a0" />
    <path d="M38 52 L26 45 L32 55 L23 60 L37 63 Z M82 52 L94 45 L88 55 L97 60 L83 63 Z" fill="#e5e7eb" />
    <path d="M37 50 Q37 30 60 30 Q83 30 83 50 Q60 41 37 50 Z" fill="#475569" />
    <path d="M82 44 L97 37 L93 50 Z M82 47 L95 55 L87 57 Z" fill="#475569" />
    <path d="M43 53 Q49 48 55 52 M65 51 Q71 45 77 50" stroke="#e5e7eb" stroke-width="3.5" stroke-linecap="round" fill="none" />
    <path class="hc-eyes" d="M46 59 Q50 55.5 54 59 M66 59 Q70 55.5 74 59" stroke="#1f2937" stroke-width="2.2" stroke-linecap="round" fill="none" />
    <ellipse cx="45" cy="66" rx="4" ry="2.4" fill="#f87171" opacity="0.45" />
    <ellipse cx="75" cy="66" rx="4" ry="2.4" fill="#f87171" opacity="0.45" />
    <ellipse cx="60" cy="65" rx="3.6" ry="3" fill="#e8b48a" />
    <path d="M52 75 Q60 81 68 75" stroke="#7f1d1d" stroke-width="2.2" stroke-linecap="round" fill="none" />
    <path d="M45 72 Q53 65 60 69 Q67 65 75 72 Q67 71 60 73 Q53 71 45 72 Z" fill="#e5e7eb" />
    <path d="M54 80 Q60 95 66 80 Q60 83 54 80 Z" fill="#e5e7eb" />
  </svg>`;

// A proper decorated easter egg with the Eye of Wdjat on it.
const HC_EGG_SVG = `
  <svg class="hc-egg-svg" viewBox="0 0 60 76" aria-hidden="true">
    <defs>
      <linearGradient id="hc-g-egg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#c084fc" /><stop offset="1" stop-color="#6d28d9" />
      </linearGradient>
      <clipPath id="hc-clip-egg"><path d="M30 2 C47 2 58 32 58 48 C58 64 46 74 30 74 C14 74 2 64 2 48 C2 32 13 2 30 2 Z" /></clipPath>
    </defs>
    <path d="M30 2 C47 2 58 32 58 48 C58 64 46 74 30 74 C14 74 2 64 2 48 C2 32 13 2 30 2 Z" fill="url(#hc-g-egg)" stroke="#3b0764" stroke-width="1.5" />
    <g clip-path="url(#hc-clip-egg)">
      <path d="M0 24 L6 18 L12 24 L18 18 L24 24 L30 18 L36 24 L42 18 L48 24 L54 18 L60 24 L60 29 L54 23 L48 29 L42 23 L36 29 L30 23 L24 29 L18 23 L12 29 L6 23 L0 29 Z" fill="#fbbf24" />
      <rect x="0" y="58" width="60" height="5" fill="#fbbf24" />
      <circle cx="10" cy="66" r="2" fill="#fde68a" /><circle cx="22" cy="68" r="2" fill="#fde68a" />
      <circle cx="38" cy="68" r="2" fill="#fde68a" /><circle cx="50" cy="66" r="2" fill="#fde68a" />
    </g>
    <path d="M17 42 Q30 32 43 42 Q30 50 17 42 Z" fill="#fef3c7" stroke="#1f2937" stroke-width="1.6" />
    <circle cx="30" cy="42" r="4" fill="#1f2937" />
    <path d="M14 37 Q30 28 46 37 M27 47 L24 55 Q22 58 19 56 M33 47 Q38 53 42 53" stroke="#1f2937" stroke-width="1.6" stroke-linecap="round" fill="none" />
    <ellipse cx="20" cy="14" rx="4" ry="7" fill="#fff" opacity="0.35" transform="rotate(20 20 14)" />
  </svg>`;

const HC_CARDS = 10;

function playHintOfTheCardsEgg() {
  markEggFound('hint-of-the-cards');
  playSound({ name: 'hint-of-the-cards' });

  spawnFx('fx-cegg fx-hc', HC_MS + 100, {
    html: `
      <div class="hc-dim"></div>
      ${ceRange(HC_CARDS, i => {
        const a = (i / HC_CARDS) * Math.PI * 2 + ceRand(-0.3, 0.3);
        return `<span class="hc-card" style="--dx: ${(Math.cos(a) * 60).toFixed(0)}vw; --dy: ${(Math.sin(a) * 50).toFixed(0)}vh; --r: ${ceRand(-400, 400).toFixed(0)}deg;"><span class="ce-emoji">💡</span>Hint</span>`;
      })}
      <div class="hc-gramps">
        <span class="hc-say hc-say--1 ce-bubble">Enough, enough, young duelist!</span>
        <span class="hc-say hc-say--2 ce-bubble">The only egg you get from me is…</span>
        <span class="hc-say hc-say--3 ce-bubble">…this one. <span class="ce-emoji">😉</span></span>
        <span class="hc-rays"></span>
        <span class="hc-body">${HC_GRANDPA_SVG}</span>
        <span class="hc-egg">${HC_EGG_SVG}</span>
        ${ceRange(5, i => `<span class="hc-spark ce-emoji" style="--a: ${i * 72}deg; --d: ${(i * 90 + 3950)}ms;">✨</span>`)}
      </div>
      <div class="cegg-toast hc-toast">The Hint of the Cards<small>Grandpa's only hint: you just found an egg.</small></div>
    `
  });
}
