// public/sw.js
self.addEventListener('install', (event) => {
  console.log('Service Worker installed')
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  console.log('Service Worker activated')
  event.waitUntil(self.clients.claim())
})

self.addEventListener('push', (event) => {
  const data = event.data?.json() || { title: 'Baizona', body: 'Taarifa mpya!' }
  
  const options = {
    body: data.body,
    icon: '/logo-192.png',
    badge: '/badge.png',
    vibrate: [200, 100, 200],
    tag: 'baizona-notification',
    requireInteraction: true,
    data: { url: data.url || '/' },
    actions: [
      { action: 'open', title: '🔓 Fungua' },
      { action: 'close', title: '❌ Funga' }
    ]
  }
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  if (event.action === 'open') {
    event.waitUntil(
      self.clients.openWindow(event.notification.data.url)
    )
  }
})