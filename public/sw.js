// Bump CACHE when existing responses need invalidating.
const CACHE = 'gym-logger-v8';
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

async function exerciseVideo(request) {
  const cache = await caches.open(CACHE);
  let response = await cache.match(request.url);
  if (!response) {
    response = await fetch(request.url);
    if (response.status !== 200) return response;
    await cache.put(request.url, response.clone()).catch(() => {});
  }

  const range = request.headers.get('range');
  if (!range) return response;
  const parts = /^bytes=(\d*)-(\d*)$/.exec(range);
  const file = await response.blob();
  const start = parts?.[1] ? Number(parts[1]) : Math.max(0, file.size - Number(parts?.[2]));
  const end = parts?.[1] && parts[2] ? Math.min(Number(parts[2]), file.size - 1) : file.size - 1;
  if (!parts || (!parts[1] && !parts[2]) || start > end) {
    return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${file.size}` } });
  }

  return new Response(file.slice(start, end + 1), {
    status: 206,
    headers: {
      'Content-Type': 'video/mp4',
      'Accept-Ranges': 'bytes',
      'Content-Range': `bytes ${start}-${end}/${file.size}`,
      'Content-Length': String(end + 1 - start),
    },
  });
}

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET' || !request.url.startsWith('http')) return;

  const url = new URL(request.url);
  if (url.origin === self.location.origin && /\/exercise-(?:demos|motion)\/[a-z0-9-]+\.mp4$/.test(url.pathname)) {
    event.respondWith(exerciseVideo(request));
    return;
  }

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
      if (res.status === 200 || res.type === 'opaque') {
        const copy = res.clone();
        caches.open(CACHE).then(cache => cache.put(request, copy));
      }
      return res;
    }))
  );
});
