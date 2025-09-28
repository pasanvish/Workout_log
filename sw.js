const CACHE_NAME = 'gym-logger-cache-v1';
const APP_SHELL_URLS = [
    '/',
    '/index.html',
    'https://cdn.tailwindcss.com',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache and caching app shell');
        const requests = APP_SHELL_URLS.map(url => new Request(url, {cache: 'reload'}));
        return cache.addAll(requests);
      })
      .catch(err => {
          console.error('Failed to cache app shell', err);
      })
  );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || event.request.url.startsWith('chrome-extension://')) {
    return;
  }
  
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(event.request);

    if (cachedResponse) {
      return cachedResponse;
    }

    try {
      const networkResponse = await fetch(event.request);
      
      if (networkResponse && (networkResponse.status === 200 || networkResponse.type === 'opaque')) {
        const responseToCache = networkResponse.clone();
        await cache.put(event.request, responseToCache);
      }
      
      return networkResponse;
    } catch (error) {
      console.error('Fetch failed, and no cache available for:', event.request.url, error);
    }
  })());
});
