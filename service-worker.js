const CACHE_NAME = 'ep-vip-v3'; // Versiyon Atlatıldı (Teacher Panel Fix)
const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/login.js',
  '/teacher.js',
  '/student.js',
  '/veli.js'
];

self.addEventListener('install', event => {
  self.skipWaiting(); // Eski SW'yi beklemeden hemen devreye gir
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('activate', event => {
    // Eski cache'leri temizle
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.filter(name => name !== CACHE_NAME)
                          .map(name => caches.delete(name))
            );
        })
    );
});

self.addEventListener('fetch', event => {
  // 🔥 NETWORK-FIRST STRATEJİSİ: Önce internetten en günceli çek, yoksa cache'i kullan.
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});
