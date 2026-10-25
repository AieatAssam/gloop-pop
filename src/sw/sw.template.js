const VERSION = '__VERSION__';
const PRECACHE = __PRECACHE__;
const AUDIO_FILES = __AUDIO_FILES__;
const CACHE_NAME = `gloop-pop-${VERSION}`;
const AUDIO_CACHE = 'gloop-pop-audio';
const INDEX_URL = new URL('index.html', self.registration.scope).href;

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then(async (names) => {
    await Promise.all(names.filter((name) => name.startsWith('gloop-pop-') && name !== CACHE_NAME && name !== AUDIO_CACHE).map((name) => caches.delete(name)));
    const audioCache = await caches.open(AUDIO_CACHE);
    const allowed = new Set(AUDIO_FILES.map((path) => new URL(path, self.location.origin).pathname));
    const keys = await audioCache.keys();
    await Promise.all(keys.filter((request) => !allowed.has(new URL(request.url).pathname)).map((request) => audioCache.delete(request)));
  }).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  const path = new URL(request.url).pathname;
  const scopePath = new URL(self.registration.scope).pathname;
  if (path.startsWith(`${scopePath}audio/`)) {
    event.respondWith(cacheFirstIn(request, AUDIO_CACHE));
    return;
  }
  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request));
    return;
  }
  if (PRECACHE.includes(new URL(request.url).pathname)) event.respondWith(cacheFirst(request));
});

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await Promise.race([
      fetch(request),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Navigation timed out')), 3000)),
    ]);
    if (response.ok) await cache.put(INDEX_URL, response.clone());
    return response;
  } catch {
    return (await cache.match(INDEX_URL)) || Response.error();
  }
}

async function cacheFirst(request) {
  return cacheFirstIn(request, CACHE_NAME);
}

async function cacheFirstIn(request, name) {
  const cache = await caches.open(name);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) await cache.put(request, response.clone());
  return response;
}
