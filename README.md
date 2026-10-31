# Yu-Gi-Oh! Dueling Abilities

A mobile-first Progressive Web App (PWA) for physical Yu-Gi-Oh! duels. Each duelist picks a character deck, secretly chooses a **Skill**, a **Comeback** and a **Quest**, and tracks their Life Points during the duel. The app also runs knockout **Tournaments**, a two-player **Co-op Boss** mode against Pegasus, and hides dozens of easter eggs.

It is a family hobby project: vanilla JavaScript, no build step, installable and fully offline.

## Features

- **Duel companion:** pick a character and abilities, then duel with three cards (Skill, Comeback, Quest) and a vertical Life Points bar. Skills track their uses, Comebacks are revealed when activated, and Quests are marked as completed. Cards can be peeked at, the LP bar can sit on either side, and an accidental activation can be undone. The LP editor keeps a log of every change, and Undo takes back the latest one.
- **Characters** (`data.js`):
  - **Neutral:** freestyle abilities for any deck.
  - **Family decks:** Theotaur (Dark Paladin's Legion) and Trizze (Legends Assembled).
  - **Anime decks:** Yugi, Kaiba and Joey (Duelist Kingdom and Battle City), Mai, Mako, Bakura, Pegasus, Odion, Ishizu, Marik (two decks), Weevil and Bandit Keith.
  - **Custom:** mix and match every ability from every character, grouped by source, with a search bar that matches name, effect text or duelist. Built automatically, so new characters show up here.
- **Tournament:** single-elimination bracket. Choose the size, hand-pick duelists (the rest are drawn at random with a draw animation), then tap the winner of each duel. Byes are seeded classically, only one deck per duelist can enter, and a result can be changed until the winner plays again.
- **Co-op Boss:** the phone lies between both fields while two players team up against Pegasus across three stages (Toon World, Millennium Eye, Final Read). Player 2's half of the screen is rotated 180°. Includes shared Bond actions (Foresight, Shield, Revive, Protect), silence rules and cutscenes.
- **Settings:** theme (Dark, Light, Power of Chaos, plus a secret Treasure theme), UI size (four steps), sound on or off, co-op progress reset, and the secrets tracker with hints. Everything is saved on the device.
- **Effects and sound:** every theme has its own animations and synthesised sound kit (Web Audio, no audio files). Honours "reduce motion" and switches to a lighter effects mode on low-end phones.
- **Easter eggs:** many hidden secrets (hold-to-trigger buttons, family names, anime references). Finding them all unlocks the Treasure theme. See `.github/skills/easter-egg/SKILL.md` before adding new ones.

## Project structure

- `index.html`: app shell. Loads every script as a global `<script>` in order (no modules or bundler). Tailwind comes from the CDN.
- `app.js`: entry point. `render()` rebuilds the current screen from the state.
- `data.js`: every character and their Skills, Comebacks and Quests.
- `styles.css`: global styles, mobile touch tweaks and the themes.
- `effects.css`: all animations, grouped by section comments.
- `src/config/`: constants and screens, ability types, themes, UI sizes, the Tailwind config, the co-op boss data (`coop-pegasus.js`) and the Duel Disk cards.
- `src/state/`: persistent state in `localStorage` and selectors (`store.js` for the duel, `tournament-store.js`, `coop-store.js`).
- `src/actions/`: global functions called from inline `onclick=` handlers (navigation, duel, Life Points, tournament, co-op, settings, Duel Disk).
- `src/components/`: reusable UI (duel card, ability picker, LP bar, LP editor, modals, sound toggle).
- `src/views/`: one file per screen (start, character, abilities, duel, tournament, co-op, settings, Duel Disk). Each returns an HTML string.
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
- A new script must be added to **both** `index.html` (load order matters) and the precache list in `sw.js`.
- All scripts share one global scope, so search for a name before declaring a new `const` or `function`.
- After every change, bump `CACHE_NAME` in `sw.js` (`ygo-skills-mvp-vNNN`) and reload the app twice: the first reload installs the new service worker.

