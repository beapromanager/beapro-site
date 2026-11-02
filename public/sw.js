/**
 * The smallest service worker that makes the game installable.
 *
 * Chrome will not offer "add to home screen" at all without one, which is why
 * the install prompt never appeared. It deliberately does NOT cache: this game
 * ships several times a day, and a caching worker is the classic way to leave
 * players staring at last week's build with no idea why. Every request goes
 * straight to the network exactly as it would without a worker.
 *
 * If offline play is ever wanted, that is a deliberate feature with a version
 * stamp and a cache bust, not something to smuggle in here.
 */
self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', event => {
  // take over any tab already open, and clear anything a previous worker cached
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.map(n => caches.delete(n)));
    await self.clients.claim();
  })());
});

// a fetch handler has to exist for the app to count as installable. This one is
// a pass through on purpose.
//
// It answers nothing and stores nothing, for anything: not the game, not /ops/ (the owner's dashboard, which has no worker
// of its own and whose pages and numbers must never be kept on a phone), and not the counting worker. No respondWith, and
// no use of the browser's cache storage at all. scripts/ops-check.mts holds this still.
self.addEventListener('fetch', () => { /* straight to the network */ });
