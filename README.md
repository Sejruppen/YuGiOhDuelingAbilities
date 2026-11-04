# Yu-Gi-Oh! Dueling Abilities

A mobile-first Progressive Web App (PWA) for physical Yu-Gi-Oh! duels. Each duelist picks a character deck, secretly chooses a **Skill**, a **Comeback** and a **Quest**, and tracks their Life Points during the duel. The app also runs knockout **Tournaments**, a two-player **Co-op Boss** mode against Pegasus, a **Solo** roguelike run across Duelist Kingdom, and hides dozens of easter eggs.

It is a family hobby project: vanilla JavaScript, no build step, installable and fully offline.

## Features

- **Duel companion:** pick a character and abilities, then duel with three cards (Skill, Comeback, Quest) and a vertical Life Points bar. Skills track their uses, Comebacks are revealed when activated, and Quests are marked as completed. Cards can be peeked at, the LP bar can sit on either side, and an accidental activation can be undone. The LP editor keeps a log of every change, and Undo takes back the latest one.
- **Characters** (`data.js`):
  - **Neutral:** freestyle abilities for any deck.
  - **Family decks:** Theotaur (Dark Paladin's Legion) and Trizze (Legends Assembled).
  - **Anime decks:** Yugi, Kaiba and Joey (Duelist Kingdom and Battle City), Mai, Mako, Bakura, Pegasus, Odion, Ishizu, Marik (two decks), Weevil and Bandit Keith.
  - **Custom:** mix and match every ability from every character, grouped by source, with a search bar that matches name, effect text or duelist. Built automatically, so new characters show up here.
- **Tournament:** opens on a menu with Continue, New and History. Single-elimination bracket: choose the size, hand-pick duelists (the rest are drawn at random with a draw animation), then tap the winner of each duel. Byes are seeded classically, only one deck per duelist can enter, and a result can be changed until the winner plays again. Finished tournaments are kept in a history with a Hall of Fame (titles per duelist) and every result.
- **Co-op Boss:** the phone lies between both fields while two players team up against Pegasus across three stages (Toon World, Millennium Eye, Final Read). Player 2's half of the screen is rotated 180°. Includes shared Bond actions (Foresight, Shield, Revive, Protect), silence rules and cutscenes.
- **Solo: Duelist's Road:** a short Slay the Spire-style run for one player. Opens on a menu with Continue, New run and History (every won, lost or abandoned run with its stats, relics and route, filterable by difficulty). Every new run picks a difficulty: 🍼 Easy (the road described here), ⚔️ Hard (opened by the Millennium Necklace: tougher enemies with more LP and moves, hidden intents, fewer campfires and relic choices, pricier Shadow Games, elites on the beach and a 10,000 LP Pegasus with a 4-page book) or 💀 Nightmare (opened by the Millennium Key: everything harsher still, every enemy move hidden, most nodes behind ❓, one relic choice, and a 12,000 LP Pegasus with a 6-page book and extra mind games). Star Chips, the castle gate and field bonuses never change, as in the anime. Pick a path up a 13-floor map of Duelist Kingdom (Beach, Forest, Meadow, Mountain, Wasteland; a few floors are special: a Shadow Games-only floor on the Beach, a duelist-or-Shadow-Game fork before the mountains and a gambler's floor right before the Labyrinth), duel virtual duelists with your physical deck, collect Star Chips and reach the castle. Every path passes one or two campfires (🔥) on floors 4–10, where you pick one: rest (heal 30%), train with Joey (+500 max LP) or polish a relic (bigger numbers, or twice per duel instead of once). Fewer than 10 Star Chips sends you through the Labyrinth first. Enemies show their next move, regions give field bonuses, and LP carries over between duels. The duel's region is the field, shown in a strip under the header (Umi on the beach, Sogen on the meadow…), and its bonus counts for both of you. Block with one of your monsters or spring a Trap Card, lower an enemy monster's ATK or DEF (from the Effect menu on your turn, or mid-attack on theirs; until the end of the turn or while it stays on the field), negate the Spells the enemy plays (equip, removal, healing, Toon World) and negate their face-down Trap when you attack. The enemy's cards lie on a playmat (three monster zones and three Spell/Trap zones, widening to five each once they have a fourth card in a row): summons, position changes and destroyed cards animate, and tapping a card shows what it does, or on your turn aims your attack at it (or, for a Spell/Trap, lets you destroy it). Equip Spells are real cards in the Spell/Trap zones: destroy one and its monster loses that card's ATK, and they break when their monster leaves the field. When the Spell/Trap zones are full, the enemy summons instead of equipping or setting. Every duel starts with rock-paper-scissors: win and you choose who goes first, lose and the enemy chooses (mostly by personality). Pegasus reads your mind with his Millennium Eye and always wins. Whoever opens can't attack (or draw) on their first turn, and tapping their cards only shows what they do. A banner sweeps across at the start of every turn, yours and the enemy's, with the Draw Phase count (relics like Card of Sanctity change it) and turn-start reminders. Elites are anime duelists with their own decks and gimmicks (Mako's Fortress Whale, Weevil's Cocoon, Mai's Harpies, Rex's Dinosaurs, Bonz' Zombies, Bandit Keith's sleeve), and the Paradox Brothers guard the Labyrinth. Treasure chests and elites give relics (Mirror Force, Pot of Greed, Kuriboh Charm…) that bend the rules. Shadow Games (🌀 nodes) offer wagers, gifts, tolls and ambushes, and most have a gamble where you roll a real die or flip a real coin and tap the result (the app never rolls for you, and the Millennium Key only hints at what could happen). About a third of the duels and Shadow Games hide behind ❓ until you get there. During a Shadow Game, treasure, campfire or relic reward, tap the 🗺️ Floor button in the status bar to peek at the map (read-only) before you choose. The five Millennium Items are powerful relics with a price. Pegasus waits in the castle in three stages: Toon World (unblockable Toons, and Pegasus takes no damage until every page of the book is torn out), the Millennium Eye (hidden moves, Mind Crush) and the Final Read (Thousand-Eyes Restrict and bluffs). Lose and your soul is sealed in a card. The Solo menu has a shelf of the seven Millennium Items that light up as you beat Pegasus (tap one to see how, hold a lit one to replay its cutscene), and your wins per difficulty: Puzzle (Easy ×1, given by Yami Yugi), Necklace (Easy ×2: Ishizu shows a vision of the harder road and opens Hard), Scale (Hard ×1: Shadi weighs your heart), Key (Hard ×2: Shadi's Key opens the door to your soul, and the Nightmare road behind it), Ring (Nightmare ×1: Yami Bakura's Ring points to you), Rod (Nightmare ×2: Marik's Rod fails to control your mind) and Eye (Nightmare ×3: the finale, Pegasus loses everything and surrenders his Eye, then a thank-you card unlocks the Millennium theme; tap once to skip to the card).
- **Settings:** theme (Dark, Light, Power of Chaos, plus a secret Treasure theme and the Millennium theme, earned with the Millennium Eye in Solo; in a duel the Millennium theme turns hidden abilities into stone tablets etched with an Item (Skill: Puzzle, Comeback: Ring, Quest: Scale) that appears when activated, peeks into Necklace visions, LP into a sand-filled cartouche with carved digits that crumble on damage, opens the Eye wider as your LP drops and turns the duel into a Shadow Game under 1000 LP (purple mist, a red Eye); everywhere it adds torchlight, stone doors between screens, hieroglyph friezes, papyrus abilities with their type in a carved cartouche, sarcophagus character cards, the sun disc of Ra on Home and a golden ankh or scarab on every tap), UI size (four steps), sound on or off, co-op progress and tournament history resets, and the secrets tracker with hints. Everything is saved on the device.
- **Android back button:** closes the open popup first, then goes back a screen. It also closes or skips full-screen egg games and cutscenes. During a duel it asks to reset instead of leaving, and on the start screen you press back twice to exit (`src/actions/back-button.js`).
- **Effects and sound:** every theme has its own animations and synthesised sound kit (Web Audio, no audio files). Honours "reduce motion" and switches to a lighter effects mode on low-end phones.
- **Easter eggs:** many hidden secrets (hold-to-trigger buttons, family names, anime references). Finding them all unlocks the Treasure theme. See `.github/skills/easter-egg/SKILL.md` before adding new ones.

## Non-goals

The app stays simple on purpose. These features will not be added:

- **Coin flips or dice rolls in the regular duel:** in the normal duel screen (with abilities) it's more fun to do them in real life. This doesn't cover game modes like Solo, where the app may decide things such as who starts a duel.
- **Token or counter trackers:** they're clearer on the actual field.
- **Duel tracking** (who won, or the other player's LP): each player uses their own phone for their own abilities and LP.
- **Match tracker:** a match is at most 3 duels, which is too few to need tracking.
- **Ability creator or editor:** it would need a way to store abilities and would complicate the app structure for no real gain. Keep it simple.
- **Phone-specific features** such as haptics or notifications: it's a simple PWA.
- **Backup and restore:** it adds complexity.

## Project structure

- `index.html`: app shell. Loads every script as a global `<script>` in order (no modules or bundler). Tailwind comes from the CDN.
- `app.js`: entry point. `render()` rebuilds the current screen from the state.
- `data.js`: every character and their Skills, Comebacks and Quests.
- `styles.css`: global styles, mobile touch tweaks and the themes.
- `effects.css`: all animations, grouped by section comments.
- `src/config/`: constants and screens, ability types, themes, UI sizes, the Tailwind config, the co-op boss data (`coop-pegasus.js`), the solo mode data (`solo-config.js`) and the Duel Disk cards.
- `src/state/`: persistent state in `localStorage` and selectors (`store.js` for the duel, `tournament-store.js`, `coop-store.js`, `solo-store.js` with the solo map and fight engine, `solo-events.js` with the Shadow Game events, `solo-pegasus.js` with the solo Pegasus boss).
- `src/actions/`: global functions called from inline `onclick=` handlers (navigation, duel, Life Points, tournament, co-op, solo, settings, Duel Disk).
- `src/components/`: reusable UI (duel card, ability picker, LP bar, LP editor, modals, sound toggle).
- `src/views/`: one file per screen (start, character, abilities, duel, tournament, co-op, solo, settings, Duel Disk). Each returns an HTML string.
- `src/effects/effects.js`: the effects engine. It compares the state before and after each render and spawns `fx-*` overlays.
- `src/effects/sounds.js`: all sounds, synthesised per theme.
- `src/effects/*-egg*.js`, `*-cutscenes.js`, `pharaoh-finale.js`: easter eggs, the egg tracker and hints, and the co-op cutscenes.
- `src/utils/`: small formatting helpers.
- `img/`: pre-rendered Exodia artwork. Re-export it with `tools/export-exodia-art.js` after changing the drawing.
- `manifest.json`, `icon.jpg`, `logo.jpg`: PWA manifest and icons.
- `sw.js`: service worker that precaches every file for offline use.
- `src/service-worker-registration.js`: registers the service worker and reloads when it updates.

## Development

- There is no build step, test suite or linter. Serve the folder with any static file server and open it on a phone.
- To run the app, use `npx serve .` from the repository root.
- A new script must be added to **both** `index.html` (load order matters) and the precache list in `sw.js`.
- All scripts share one global scope, so search for a name before declaring a new `const` or `function`.
- After every change, bump `CACHE_NAME` in `sw.js` (`ygo-skills-mvp-vNNN`) and reload the app twice: the first reload installs the new service worker.

