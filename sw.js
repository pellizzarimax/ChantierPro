// Service Worker ChantiersPro - Mode hors ligne
const CACHE_NAME = 'chantierspro-v1';
const ASSETS = [
  './',
  './chantierspro.html',
  'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS).catch(() => {});
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  // Toujours réseau d'abord, cache en fallback
  e.respondWith(
    fetch(e.request)
      .then(response => {
        // Mettre en cache les ressources réussies
        if(response && response.status === 200 && response.type === 'basic') {
          const cloned = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, cloned));
        }
        return response;
      })
      .catch(() => {
        // Hors ligne : utiliser le cache
        return caches.match(e.request).then(cached => {
          return cached || new Response('Hors ligne - données en cache local', {
            headers: {'Content-Type': 'text/plain'}
          });
        });
      })
  );
});
