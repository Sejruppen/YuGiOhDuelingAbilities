# Yu-Gi-Oh! Character Deck Companion (MVP)

A mobile-first Progressive Web App (PWA) built to manage custom **Skills**, **Comebacks**, and **Quests** for physical Yu-Gi-Oh! anime character decks and custom constructed decks.

## Project Structure
- `index.html`: App shell and script/style imports.
- `styles.css`: Custom global styles and mobile touch adjustments.
- `data.js`: Complete dataset of all 15 anime characters + Neutral custom deck abilities (`Skills`, `Comebacks`, and `Quests`).
- `app.js`: State management (`localStorage`), navigation actions, and screen view templates.
- `manifest.json`: Web App Manifest for Android standalone full-screen installation.
- `sw.js`: Service Worker for offline caching.

## App Flow
1. **Start Screen:** Landing page to start a new duel setup.
2. **Choose Character Screen:** Pick between 15 anime character decks or **Neutral (Custom Deck)**.
3. **Choose Abilities Screen:** Secretly select 1 *Skill*, 1 *Comeback*, and 1 *Quest*.
4. **Duel Screen:** Divided into 3 vertical sections tailored for mobile portrait view, displaying your active Skill, Comeback, and Quest during the duel.

