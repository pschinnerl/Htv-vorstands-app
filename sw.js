// Service Worker – Badge + Web Push Benachrichtigungen

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim())
})

// ── Web Push (kommt vom Cloudflare Worker, App komplett geschlossen) ─────────
self.addEventListener('push', event => {
  let title = 'HTV Vorstands-App'
  let body  = 'Neue Nachricht'
  let count = 1
  const icon = self.location.origin + '/Htv-vorstands-app/icon-192.png'

  if (event.data) {
    try {
      const data = event.data.json()
      title = data.title || title
      body  = data.body  || body
      if (data.count) count = data.count
    } catch {
      body = event.data.text() || body
    }
  }

  event.waitUntil(
    Promise.all([
      self.registration.showNotification(title, {
        body,
        icon,
        badge: icon,
        tag: 'new-message',
        renotify: true,
        vibrate: [100, 50, 100],
      }),
      // Icon-Badge auf dem Homescreen setzen (iOS 16.4+ / iPadOS 16.4+)
      self.registration.setAppBadge?.(count).catch(() => {}),
    ])
  )
})

// ── Nachrichten vom App-Hauptthread ─────────────────────────────────────────
// Empfängt Nachrichten vom App-Hauptthread
self.addEventListener('message', event => {
  // Badge setzen/löschen (App minimiert oder im Hintergrund)
  if (event.data?.type === 'SET_BADGE') {
    const count = event.data.count ?? 0
    if (count > 0) {
      self.registration.setAppBadge?.(count)
    } else {
      self.registration.clearAppBadge?.()
    }
  }

  // Browser-Benachrichtigung anzeigen
  if (event.data?.type === 'SHOW_NOTIFICATION') {
    const { title, body } = event.data
    event.waitUntil(
      self.registration.showNotification(title || 'Neue Nachricht', {
        body: body || '',
        icon: self.location.origin + '/Htv-vorstands-app/icon-192.png',
        badge: self.location.origin + '/Htv-vorstands-app/icon-192.png',
        tag: 'new-message',
        renotify: true,
        vibrate: [100, 50, 100],
      })
    )
  }
})

// Klick auf Benachrichtigung → App in den Vordergrund
self.addEventListener('notificationclick', event => {
  event.notification.close()
  self.registration.clearAppBadge?.().catch(() => {})
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if (client.url.includes('Htv-vorstands-app') && 'focus' in client) {
          return client.focus()
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow('https://helmstedtertv.github.io/Htv-vorstands-app/')
      }
    })
  )
})
