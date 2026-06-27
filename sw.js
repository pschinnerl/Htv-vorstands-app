// Service Worker – Badge-Update auch wenn App im Hintergrund ist

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim())
})

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
