# Copilot instructions: Yu-Gi-Oh! Dueling Abilities

A mobile-first PWA that two players use side by side during physical Yu-Gi-Oh! duels. It tracks Life Points and shows each player's custom Skill, Comeback and Quest (see `README.md`). It also has a Tournament mode, a Co-op Boss mode (Pegasus) and dozens of hidden easter eggs. The app is a hobby project for the owner (Mathias) and his family, and the tone is playful and full of anime references.

## Working agreement

- **Never commit, push or change git history.** Read-only git commands are fine. When you finish, say the changes are ready to commit.
- **Don't use the terminal unless it's strictly necessary.** Use the file tools (view, grep, glob, edit, create) instead. There is no build step, test suite or linter, and the owner tests on his phone.
  - Don't run syntax checks (`node --check`), scripts, servers or other "verification" commands. Re-read your edits with view instead.
  - If a task really can't be done without the terminal, ask the owner first and explain why.
- Keep replies short. When asked to "come up with ideas" or "jam", brainstorm a numbered list and do not implement anything until the owner picks.
- **After every change that ships:**
  1. Bump `CACHE_NAME` in `sw.js` (`ygo-skills-mvp-vNNN`).
  2. Tell the owner to reload twice (the service worker updates on the first reload).

## Architecture

- Vanilla JS with **global scripts and no modules or bundler**. Tailwind comes from the CDN (`src/config/tailwind-config.js`), and the fonts are Cinzel and Cinzel Decorative.
- Every script is listed in **both** `index.html` (load order matters) **and** the `sw.js` precache list. A new file must be added to both.
- All top-level names share one global scope. **Grep for a name before declaring a new `const` or `function`**, because a duplicate `const` breaks the whole file silently.
- Rendering: `render()` in `app.js` rebuilds the current view from `state` (`src/state/store.js`). The views in `src/views/` return HTML strings, and inline `onclick=` handlers call global functions in `src/actions/`.
- Folders and files:
  - `src/state/`: persistent state (`localStorage`) and selectors (`store.js`, `tournament-store.js`, `coop-store.js`).
  - `src/config/`: constants, themes (`app-themes.js`), co-op boss data (`coop-pegasus.js`) and Duel Disk cards.
  - `src/effects/effects.js`: the effects engine. It diffs state before and after each render and spawns `fx-*` overlays. Key helpers:
    - `spawnFx(className, lifetimeMs, { vars, html })` returns `null` under reduced motion.
    - `restartClass(el, cls, ms)`
    - `getFxLayer()`
    - `prefersReducedMotion()`
    - `FX_LITE` / `fxCount(n)`: lite mode on low-end phones (≤4 cores or ≤4 GB). `fxCount` halves particle counts, and `html.fx-lite` lets CSS drop heavy layers.
  - `src/effects/sounds.js`: all audio, **synthesised with Web Audio (no audio files)**.
    - `playSound({ name })` looks the name up in the current theme's kit.
    - `COOP_SOUNDS` is spread into every kit, and egg sounds usually live there.
    - Reusable building blocks include `tone`, `noise`, `bell`, `chord`, `arpeggio`, `boom`, `brass`, `choir`, `darkBus`, `darkCluster`, `healPad`, `ceWhoosh`, `cardFlip`, `boing`, `pegasusLaugh`, `eyeHum`, `bigHeartbeat`, `monsterRoar` and `midi(n)`. Grep before writing a new one.
  - `effects.css`: every animation, grouped by section comments (`/* --- Name --- */`). Theme-agnostic egg overlays use the base `.fx-cegg`: fixed, `inset: 0`, `pointer-events: none`, inside `#fx-layer` at z-index 60.
  - `styles.css`: global styles and themes (Dark, Light, Power of Chaos, and the secret Treasure/gold theme unlocked by finding every egg).
- Two players share one phone, sitting opposite each other. **Player 2's UI is rotated 180°** (top half), and full-screen scenes show their text twice, once upright and once rotated.

## Conventions

- Respect `prefersReducedMotion()`. Overlays return `null` from `spawnFx`, and the code must fall back gracefully, for example by playing only a sound.
- Wrap emoji in `<span class="ce-emoji">` so they render with the colour-emoji font.
- Two-tap confirm for destructive buttons: the first tap arms the button ("Tap again to …") with a 3s timer, and the second tap acts. See `resetEggs` and `resetCoopProgress`.
- Comment only what needs explaining. Each effect file starts with a short header describing what the effect does.

## CSS and JS gotchas learned the hard way

- When two animations on one element animate the same property, the later one wins while active. Use `forwards` (not `both`) on the later one so it doesn't apply during its delay.
- Filter or transform lists with different functions interpolate discretely (they jump instead of animating).
- `.fx-cegg .ce-at` uses the `translate` property, so keyframe `transform`s compose with it rather than overwrite it.
- `someUndeclaredFn?.()` still throws a ReferenceError. Optional chaining only guards properties, not undeclared globals.
- A sound that is already playing cannot be stopped, so skipping a scene does not silence it.
- For SVG part animations use `transform-box: view-box` with pixel `transform-origin` (viewBox units), or `fill-box` for self-centred flips.

## Easter eggs

Use the **`easter-egg` skill** (`.github/skills/easter-egg/SKILL.md`) whenever you add or change an easter egg, cutscene or secret. It covers the tracker, hints, triggers, the catalogue and the family names.
