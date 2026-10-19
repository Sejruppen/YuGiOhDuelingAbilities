const CACHE_NAME = 'ygo-skills-mvp-v16';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './effects.css',
  './data.js',
  './src/config/tailwind-config.js',
  './src/config/app-themes.js',
  './src/config/constants.js',
  './src/config/ability-types.js',
  './src/state/store.js',
  './src/utils/format.js',
  './src/actions/navigation-actions.js',
  './src/actions/duel-actions.js',
  './src/actions/life-point-actions.js',
  './src/components/modal.js',
  './src/components/ability-picker.js',
  './src/components/duel-card.js',
  './src/components/lp-bar.js',
  './src/components/lp-modal.js',
  './src/components/reset-modal.js',
  './src/views/start-view.js',
  './src/views/character-view.js',
  './src/views/abilities-view.js',
  './src/views/duel-view.js',
  './src/effects/effects.js',
  './src/service-worker-registration.js',
  './app.js',
  './manifest.json',
  './icon.jpg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});

