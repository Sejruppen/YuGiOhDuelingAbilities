const CACHE_NAME = 'ygo-skills-mvp-v112';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './effects.css',
  './data.js',
  './src/config/tailwind-config.js',
  './src/config/app-themes.js',
  './src/config/ui-scale.js',
  './src/config/constants.js',
  './src/config/ability-types.js',
  './src/state/store.js',
  './src/state/tournament-store.js',
  './src/config/coop-pegasus.js',
  './src/state/coop-store.js',
  './src/utils/format.js',
  './src/actions/navigation-actions.js',
  './src/actions/duel-actions.js',
  './src/actions/life-point-actions.js',
  './src/actions/tournament-actions.js',
  './src/actions/coop-actions.js',
  './src/actions/settings-actions.js',
  './src/components/modal.js',
  './src/components/ability-picker.js',
  './src/components/duel-card.js',
  './src/components/lp-bar.js',
  './src/components/lp-modal.js',
  './src/components/reset-modal.js',
  './src/components/sound-toggle.js',
  './src/views/start-view.js',
  './src/views/character-view.js',
  './src/views/abilities-view.js',
  './src/views/duel-view.js',
  './src/views/tournament-view.js',
  './src/views/coop-view.js',
  './src/views/settings-view.js',
  './src/effects/sounds.js',
  './src/effects/effects.js',
  './src/effects/logo-easter-egg.js',
  './src/effects/heal-easter-egg.js',
  './src/effects/shadow-realm-easter-egg.js',
  './src/effects/last-stand-easter-egg.js',
  './src/effects/tiny-violin-easter-egg.js',
  './src/effects/heart-of-the-cards-easter-egg.js',
  './src/effects/screw-the-rules-easter-egg.js',
  './src/effects/mind-crush-easter-egg.js',
  './src/effects/theme-dizzy-easter-egg.js',
  './src/effects/pharaoh-nap-easter-egg.js',
  './src/effects/millennium-puzzle-easter-egg.js',
  './src/effects/speaker-easter-egg.js',
  './src/effects/pot-of-greed-easter-egg.js',
  './src/effects/trap-hole-easter-egg.js',
  './src/effects/gaia-easter-egg.js',
  './src/config/duel-disk-cards.js',
  './src/actions/duel-disk-actions.js',
  './src/views/duel-disk-view.js',
  './src/effects/duel-disk-easter-egg.js',
  './src/effects/dark-paladin-easter-egg.js',
  './src/effects/divine-offering-easter-egg.js',
  './src/effects/character-eggs.js',
  './src/effects/character-eggs-heroes.js',
  './src/effects/character-eggs-villains.js',
  './src/effects/magical-hats-easter-egg.js',
  './src/effects/duel-header-eggs.js',
  './src/effects/size-eggs.js',
  './src/effects/egg-tracker.js',
  './src/effects/egg-hints.js',
  './src/effects/pharaoh-finale.js',
  './src/effects/tournament-effects.js',
  './src/effects/coop-effects.js',
  './src/effects/start-button-eggs.js',
  './src/effects/tournament-size-eggs.js',
  './src/effects/dice-duel-egg.js',
  './src/effects/true-name-egg.js',
  './src/effects/name-eggs.js',
  './src/effects/pegasus-cutscenes.js',
  './src/service-worker-registration.js',
  './app.js',
  './manifest.json',
  './icon.jpg'
];

// Cache versions up to v76 belong to app code without the update banner; that
// code reloads by itself when a new worker takes over, so skip the wait once.
const isPreBannerCache = (key) => {
  const match = /^ygo-skills-mvp-v(\d+)$/.exec(key);
  return !!match && Number(match[1]) <= 76;
};

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    // Bypass the HTTP cache so a new version never stores stale files.
    await cache.addAll(ASSETS.map((url) => new Request(url, { cache: 'reload' })));
    if ((await caches.keys()).some(isPreBannerCache)) self.skipWaiting();
  })());
});

// Sent by the update banner's "Update" button.
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
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

