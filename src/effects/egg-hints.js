// Hints for every easter egg (egg-tracker.js EGG_IDS). The Settings screen has
// a "Get a hint" button under the secrets counter: each tap shows the hint for
// a random secret you haven't found yet (never the same one twice in a row).
// The hint closes by itself once that secret is found.
// Hints only nudge in the right direction; they never spell out the steps.
// The title of a hint is always the view the secret lives in, never the secret.
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
  'char-weevil': { where: 'Character select', text: charHint('Weevil') },
  'char-keith': { where: 'Character select', text: charHint('Bandit Keith') },
  // Duel screen
  'full-heal': { where: 'Duel', text: 'Can a duelist ever be too healthy? Some cups overflow.' },
  'shadow-realm': { where: 'Duel', text: 'Losing isn\'t always just losing. Sometimes the shadows come to collect.' },
  'last-stand': { where: 'Duel', text: 'If 50 damage is the lowest amount of damage you can take, could there be a way of getting lower from that point?' },
  'tiny-violin': { where: 'Duel', text: 'Hanging on by a thread? Someone might play you a sad little song if you are at the lowest point possible.' },
  'screw-the-rules': { where: 'Duel', text: 'Used abilities are used... Just do not get angry about it.' },
  'trap-hole': { where: 'Duel', text: 'Comebacks can be a trap. Don\'t be too quick to spring yours.' },
  'pot-of-greed': { where: 'Duel', text: 'Ever wondered what your Skill really does? Be greedy with your patience.' },
  'gaia': { where: 'Duel', text: 'Quests take time to complete. Some deliveries come by horse.' },
  'mind-crush': { where: 'Duel', text: 'Someone is watching you peek. Do you peek often at your abilities?' },
  'millennium-puzzle': { where: 'Duel', text: 'Your hidden cards are each a piece of something ancient. Lock in and find the right order!' },
  'pharaoh-nap': { where: 'Duel', text: 'Even Pharaohs get sleepy when nothing happens.' },
  'heart-of-the-cards': { where: 'Duel', text: 'Do you believe in the heart of the cards? It starts with believing in yourself.' },
  'time-wizard': { where: 'Duel', text: 'Wish you could turn back time? Starting over takes more than a quick decision.' },
  'end-credits': { where: 'Duel', text: 'Every good story deserves credits. Are you ready to let it end?' }
};

eggTracker.hintId = null;

const getUnfoundEggIds = () => EGG_IDS.filter(id => !eggTracker.found.has(id));

function getHintCandidates() {
  return getUnfoundEggIds().filter(id => id !== eggTracker.hintId && EGG_HINTS[id]);
}

// The Settings button's onclick.
function showEggHint() {
  const candidates = getHintCandidates();
  if (!candidates.length) return;
  eggTracker.hintId = candidates[Math.floor(Math.random() * candidates.length)];
  render();
}

function clearEggHint(id) {
  if (id === undefined || eggTracker.hintId === id) eggTracker.hintId = null;
}

function renderEggHint() {
  if (allEggsFound()) return '';
  const hint = eggTracker.hintId ? EGG_HINTS[eggTracker.hintId] : null;
  const canAsk = getHintCandidates().length > 0;
  const button = canAsk ? `
    <button type="button" onclick="showEggHint()" class="w-full max-w-xs mt-2 py-2 px-4 rounded-xl text-xs font-bold transition border bg-slate-900/80 border-slate-800 text-amber-300 hover:bg-slate-800">
      <span class="ce-emoji">💡</span> ${hint ? 'Another hint' : 'Get a hint'}
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
