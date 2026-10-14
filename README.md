# Yu-Gi-Oh! Character Deck Companion (MVP)

A mobile-optimized Progressive Web App (PWA) designed to manage custom character abilities (**Skills**, **Comebacks**, and **Quests**) for physical Yu-Gi-Oh! duels using anime character decks or custom-built decks.

## App Flow (MVP)
1. **Start Screen:** Landing screen to initialize a new duel setup.
2. **Choose Character Screen:** Select between 15 anime character decks (Duelist Kingdom / Battle City eras) or **Neutral (Custom Deck)** for custom-constructed decks.
3. **Choose Abilities Screen:** Secretly select 1 *Skill*, 1 *Comeback*, and 1 *Quest* for the chosen character.
4. **Duel Screen:** Split into 3 vertical sections tailored for mobile portrait mode (`100dvh`), displaying your active loadout throughout the duel.

## Project Structure
- `index.html` – Complete application UI, state management (`localStorage`), and character dataset.
- `manifest.json` – Web App Manifest enabling standalone full-screen mode on Android.
- `sw.js` – Service Worker providing offline caching and enabling PWA installation in Chrome.

## How to Host & Install on Android
1. Create a public GitHub repository and upload `index.html`, `manifest.json`, `sw.js`, and `README.md` to the root directory.
2. Navigate to **Settings → Pages** in your GitHub repository and set the **Branch** to `main` (root).
3. Open the generated `https://<your-username>.github.io/<repo-name>/` URL in Google Chrome on your Android phone.
4. Tap the browser menu (three dots in the top-right corner) and select **Install app** (or *Add to Home screen*).
