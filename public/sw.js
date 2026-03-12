const CACHE_NAME = 'linker-v2'
const PRECACHE_URLS = [
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // Never cache API calls, Edge Functions, or HTML pages
  if (
    url.pathname === '/' ||
    url.pathname.startsWith('/perfil') ||
    url.pathname.startsWith('/descubrir') ||
    url.pathname.startsWith('/conexiones') ||
    event.request.url.includes('/rest/') ||
    event.request.url.includes('/functions/') ||
    event.request.headers.get('accept')?.includes('text/html')
  ) {
    return
  }

  // Stale-while-revalidate for static assets only
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetched = fetch(event.request).then((response) => {
        if (event.request.method === 'GET' && response.status === 200) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
        }
        return response
      })
      return cached || fetched
    })
  )
})
