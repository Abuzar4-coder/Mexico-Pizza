const CACHE_NAME = 'mexico-pizza-v2';
const SHELL_FILES = [
  './index.html',
  './admin.html',
  './kitchen.html',
  './manifest.json',
  './manifest-admin.json',
  './manifest-kitchen.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_FILES)).catch(()=>{})
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

// Network-first for Firebase calls (never cache live data), cache-first for the app shell.
self.addEventListener('fetch', (event) => {
  const url = event.request.url;
  if (url.includes('firestore.googleapis.com') || url.includes('firebasestorage') || url.includes('identitytoolkit') || url.includes('firebaseio.com') || url.includes('google.com')) {
    return; // always go straight to the network for live data and auth, never cache it
  }
  event.respondWith(
    caches.match(event.request).then((cached) => {
      // network-first for our own HTML files so updates show up without a stale cache fight
      if (event.request.mode === 'navigate' || url.endsWith('.html')) {
        return fetch(event.request).then((resp) => {
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resp.clone()));
          return resp;
        }).catch(() => cached);
      }
      if (cached) return cached;
      return fetch(event.request).catch(() => cached);
    })
  );
});
