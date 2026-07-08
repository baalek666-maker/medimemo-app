// MediMémo Service Worker
const CACHE_NAME = 'medimemo-v1'
const RUNTIME_CACHE = 'medimemo-runtime-v1'

const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/icon-192x192.png',
  '/icon-512x512.png'
]

// Install: precache app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  )
})

// Activate: cleanup old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter(k => k !== CACHE_NAME && k !== RUNTIME_CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  )
})

// Fetch: cache-first for assets, network-first for API
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  if (url.pathname.startsWith('/api/')) {
    // Network-first for API
    event.respondWith(
      fetch(request).catch(() => caches.match(request))
    )
    return
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached
      return caches.open(RUNTIME_CACHE).then((cache) =>
        fetch(request).then((response) => {
          if (response.ok) cache.put(request, response.clone())
          return response
        }).catch(() => caches.match('/index.html'))
      )
    })
  )
})

// Push notification handler (for future web-push integration)
self.addEventListener('push', (event) => {
  let data = { title: 'MediMémo', body: 'Il est l'heure de prendre vos médicaments.' }
  try {
    if (event.data) data = event.data.json()
  } catch (e) {}

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      tag: 'medimemo-reminder',
      requireInteraction: true,
      vibrate: [200, 100, 200],
      data: { url: '/' }
    })
  )
})

// Notification click: open the app
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      if (clientList.length > 0) return clientList[0].focus()
      return clients.openWindow('/')
    })
  )
})

// Background sync for missed doses (placeholder)
self.addEventListener('sync', (event) => {
  if (event.tag === 'check-missed-doses') {
    event.waitUntil(
      fetch('/api/notifications/check', { method: 'POST' })
    )
  }
})
