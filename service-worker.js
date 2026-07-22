const CACHE_NAME = 'kitaplik-cache-v3';
const FILES_TO_CACHE = [
  './index.html',
  './manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(FILES_TO_CACHE))
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
  // Google Books API isteklerine hiç dokunma
  if (event.request.url.includes('googleapis.com')) {
    return;
  }

  // HTML sayfası: ÖNCE İNTERNETTEN dene (her zaman en güncel kodu al).
  // İnternet yoksa (çevrimdışıysa) önbellekten göster.
  if (event.request.mode === 'navigate' || event.request.url.endsWith('.html') || event.request.url.endsWith('/')) {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resClone));
          return res;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Diğer dosyalar (ikon, manifest vb.): önce önbellek, yoksa internet
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
