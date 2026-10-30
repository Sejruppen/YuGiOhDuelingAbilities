---
name: easter-egg
description: Add, change or brainstorm easter eggs, secrets, hold-to-trigger surprises and cutscenes in the Yu-Gi-Oh! Dueling Abilities PWA. Use for any request about eggs, secrets, the egg tracker or hints, the Pharaoh's tomb (true name), the family name eggs, or Pegasus co-op cutscenes.
---

# Easter eggs in Yu-Gi-Oh! Dueling Abilities

Read `.github/copilot-instructions.md` first. Its rules apply here too: global scripts, grep before declaring, no commits, bump the `sw.js` cache.

## Brainstorming

When the owner says "jam", "ideas" or "what could we do for X", reply with a numbered list (usually 5–10) of short, funny pitches and stop there. Good pitches have these qualities:
- They reference the Yu-Gi-Oh! Duel Monsters anime: memes, card names, catchphrases, "Screw the rules", "Heart of the cards", the Shadow Realm, Pegasus, Kaiba, Joey, Téa's friendship speeches and so on.
- They are triggered by something a player might do anyway: hold a button for 2s, spam a button, reach an extreme value, or pick the smallest or largest option.
- They pay off visually (a full-screen overlay) and with a synthesised sound.

## Checklist for implementing an egg

1. **Pick an id** (kebab-case) and add it to `EGG_IDS` in `src/effects/egg-tracker.js`, in the group for the screen it lives on.
   - `EGG_TOTAL` derives from the list automatically. Finding every egg unlocks the Treasure theme and plays the Pharaoh finale (`pharaoh-finale.js`).
2. **Add a hint** to `EGG_HINTS` in `src/effects/egg-hints.js`.
   - `where` is the view name only, never the secret.
   - `text` is a vague nudge that never spells out the steps.
3. **Trigger:**
   - **Hold for 2s** on start, tournament or co-op setup buttons: add a `kind` to `startStartEggPress` in `src/effects/start-button-eggs.js`.
     - The button's markup needs pointer handlers calling `startStartEggPress(this, '<kind>')` / `cancelStartEggPress(this)`.
     - Its `onclick` must start with `if (!startEggAllowsClick()) return;`.
     - `.cegg-charging` gives the gold charging glow.
   - **Other screens** have their own `start*Press` / `cancel*Press` pairs (character, header, trap hole, gaia and so on). Copy the nearest one.
   - **State-based eggs** (LP values, spamming) are detected in `effects.js` / `life-point-actions.js` by diffing old and new state.
4. **Effect:** a function `play<Name>Egg()` that calls `markEggFound('<id>')`, plays a sound and spawns the overlay:
   ```js
   const overlay = spawnFx('fx-cegg fx-<prefix>', LIFETIME_MS, { html: `...` });
   if (!overlay) return; // reduced motion: the sound has already played
   ```
   - Use `ceRange(n, i => html)`, `ceRand`, `cePick` for particles, `restartClass` to replay an animation, and `<span class="ce-emoji">` for emoji.
   - Show text for both players when it matters: the bottom copy upright, the top copy rotated 180°.
   - Put the effect in a new file in `src/effects/` or extend a related one. A **new file must be registered in `index.html` and `sw.js`**.
5. **Sound:** add `'<id>': t => { ... }` to `COOP_SOUNDS` in `src/effects/sounds.js` (it is spread into every theme kit).
   - Build it from the existing helpers.
   - Time the sound to the CSS timeline, since it cannot be stopped once it plays.
6. **CSS:** add a `/* --- <Screen> <trigger>: "<Name>" (<ms>) --- */` section in `effects.css` near related eggs.
   - Prefix every class with a short unique prefix (`tg-`, `ot-`, `pg-` and so on). Grep first to make sure it's free.
   - Note the timeline in the header comment (e.g. `1% = 50ms`).
7. **Ship:** bump the cache in `sw.js` and tell the owner to reload twice. Say it is untested and ready to commit.

## Where the eggs live

| Screen | Ids | Files |
|---|---|---|
| Start screen | `exodia` (logo), `duel-disk` (Duel Disk minigame), `dk-invitation` and `friendship-sign` (hold Tournament / Co-op), `limiter-removal` (hold Settings) | `logo-easter-egg.js`, `duel-disk-easter-egg.js`, `start-button-eggs.js` |
| Settings | `dizzy` (theme spam), `speaker` (sound toggle spam), `shrink-ray` / `obelisk-headroom` (UI size extremes), `hint-of-the-cards` (spam "Get a hint": fake hints after 8 quick taps, Grandpa at 30) | `theme-dizzy-easter-egg.js`, `speaker-easter-egg.js`, `size-eggs.js`, `egg-hints.js` |
| Tournament setup | `kuriboh-multiply` (over max players), `rock-paper-scissors` (under min), `star-chips` (hold 🏆), `penalty-dice` (hold Draw) | `tournament-size-eggs.js`, `dice-duel-egg.js` |
| Co-op setup | `duel-school` (hold Rookie), `time-to-duel` (hold Duelist), `true-name` (hold Pharaoh: the tomb), `relinquished` (hold Face Pegasus), `architect` plus `name-*` (typed on the tomb keyboard) | `start-button-eggs.js`, `true-name-egg.js`, `name-eggs.js` |
| Abilities | `dark-paladin`, `divine-offering` | their own files |
| Duel | `shadow-realm`, `screw-the-rules`, `trap-hole`, `pot-of-greed`, `gaia`, `mind-crush`, `millennium-puzzle`, `pharaoh-nap`, `heart-of-the-cards`, `time-wizard` / `end-credits` (header holds) | `*-easter-egg.js`, `duel-header-eggs.js` |
| Character select | `char-<id>` (hold a character for 2s), one per deck | `character-eggs*.js` |

## The Pharaoh's tomb (`true-name-egg.js`)

- Holding the Pharaoh difficulty shakes the screen and opens an Egyptian input with an on-screen stone keyboard. The physical keyboard is not used.
- The player gets **one** try (there is no leave button):
  - `ATEM` triggers a celebration.
  - A wrong name shows "What a shame…" and the tomb closes.
- Names in the `NAME_EGGS` map in `name-eggs.js`, and `ATN_ARCHITECT`, fire **as soon as they are spelled**, without pressing Speak. `revealNameEgg(name)` handles them:
  - It adds `is-guest is-guest--<name>`.
  - After `NAME_EGG_CLOSABLE_MS` it adds `is-closable`, after which a tap closes the tomb. It auto-closes at `egg.ms`.
  - Always clear `atnEgg.timer` so leftover timers can't close a new tomb.

### Family (names used in eggs; keep them affectionate)

- **MATHIAS**: the owner, "the architect of this tomb". The Eye winks and a developer scroll unrolls.
- **MARIE**: his wife. Love theme: roses, a heartbeat Eye, the card "Marie", "Mathias ♥ Marie".
- **THEODOR**: son who plays the **"Teotaur"** deck (a bull/minotaur theme). His egg is the Dark Paladin: a moonlit lightning reveal, random dragons pumping his ATK, DRAGON SLAYER BLADE splitting the sky and the knighting of "Sir Theodor".
- **TRISTAN**: son who plays the **"Trizze"** deck. His egg has Magical Hats revealing a travel-size Blue-Eyes, plus United We Stand.
- **OTTO**: a giant 🦏 charges across the screen.
- **FRIDA**: a small Maleficent-style girl with an evil laugh, a curse and a raven.

To add another name, add an entry to `NAME_EGGS`, an id to `EGG_IDS` and `EGG_HINTS`, a `'name-<x>'` sound and a CSS block.

## Co-op Boss: Pegasus

- The data lives in `src/config/coop-pegasus.js`:
  - `COOP_ENCOUNTERS`, `COOP_DIFFICULTIES` (Rookie, Duelist, Pharaoh).
  - `PEGASUS_CUTSCENES`: the rule cards shown at each phase.
- State lives in `src/state/coop-store.js`: `coop.cutscene` is `'intro'`, `'stage2'` or `'stage3'`. The `'victory'` scene is played straight from `coopVictory()` over the end screen and fires the `co-victory` fanfare when it ends.
- Actions live in `src/actions/coop-actions.js`, with UI state in `coopUi`. Settings has a reset for co-op progress with a per-boss, per-difficulty wins view.
- **Cutscenes** (`src/effects/pegasus-cutscenes.js`, CSS section "PEGASUS CUTSCENES", sounds `'pg-scene-*'`) play before each rule card, hooked in `renderCoopBattle` in `coop-view.js`.
  - `PEGASUS_SVG` is a detailed SVG Pegasus. Its animatable parts are `pg-arm-point`, `pg-arm-glass`, `pg-glass`, `pg-lock` (hair over the Millennium Eye), `pg-meye`, `pg-brow`, `pg-mouth` and `pg-mouth-open`.
  - Each scene in `PG_SCENES` is a timeline of `[ms, s => ...]` steps:
    - `s.pose('cls')` adds a pose class to the overlay, and `'-cls'` removes it.
    - `s.say(text)` shows the speech bubbles for both players.
    - `s.end()` finishes the scene.
  - Tapping skips the scene. Under reduced motion it falls back to the old `co-start` / `co-stage` sounds.
  - To add a pose, add a class step and a `.fx-pg.<pose> ...` CSS rule.
