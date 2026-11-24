// Bump CACHE when the caching logic changes; app updates are picked up automatically.
const CACHE = 'gym-logger-v3';
const SHELL = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png', './icon.svg'];

self.addEventListener('install', event => {
  // Also precache the hashed bundles index.html points at, so the first visit already works offline.
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    const html = await (await fetch('./index.html', { cache: 'reload' })).text();
    const assets = [...html.matchAll(/(?:src|href)="\.?\/?(assets\/[^"]+)"/g)].map(m => './' + m[1]);
    await cache.addAll([...SHELL, ...assets]);
  })());
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET' || !request.url.startsWith('http')) return;

  // Pages: network first so new deploys show up, cached copy when offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE).then(cache => cache.put('./index.html', copy));
          return res;
        })
        .catch(() => caches.match('./index.html', { ignoreVary: true }))
    );
    return;
  }

  // Assets (hashed JS/CSS, icons, fonts): cache first, fill cache on first fetch.
  event.respondWith(
    // ignoreVary: Vite's crossorigin tags send an Origin header the precached copies lack.
    caches.match(request, { ignoreVary: true }).then(cached => cached || fetch(request).then(res => {
      if (res.ok || res.type === 'opaque') {
        const copy = res.clone();
        caches.open(CACHE).then(cache => cache.put(request, copy));
      }
      return res;
    }))
  );
});
