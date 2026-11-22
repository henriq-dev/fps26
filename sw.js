const VERSION = 'P52';
const CACHE_NAME = 'arena-fps-v8-p52';
const CORE = [
  './', './index.html', './style.css', './three.min.js', './script.js', './app.js',
  './industrial-materials.js', './perf-telemetry.js', './weapons.js', './enemies.js', './upgrades.js', './maps.js', './incursion.js', './terminal-props.js', './deck.js',
  './pathfinding.js', './tactics.js', './progression.js', './audio.js', './manifest.json', './icon.svg',
  './icon-192.png', './icon-512.png', './icon-maskable-512.png', './apple-touch-icon.png'
];

// P49: a nova versão instala em segundo plano e fica "waiting" até o jogador aceitar o aviso (sem trocar no meio da partida).
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(CORE)));
});

self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
  else if (event.data === 'GET_VERSION' && event.source) event.source.postMessage({ type: 'VERSION', version: VERSION });
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(
    keys.filter(key => key.startsWith('arena-fps-') && key !== CACHE_NAME).map(key => caches.delete(key))
  )).then(() => self.clients.claim()));
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  event.respondWith(caches.match(request).then(cached => cached || fetch(request).then(response => {
    if (!response || response.status !== 200 || response.type !== 'basic') return response;
    const copy = response.clone();
    caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
    return response;
  }).catch(() => request.mode === 'navigate' ? caches.match('./index.html') : Response.error())));
});
