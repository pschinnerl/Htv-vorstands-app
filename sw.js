/* Service Worker – Firebase Cloud Messaging (Hintergrund) + Icon-Badge
 *
 * FCM liefert Push-Nachrichten verschlüsselt aus; die Compat-SDK übernimmt
 * Entschlüsselung und ruft onBackgroundMessage auf. Wir zeigen dort die
 * Benachrichtigung und setzen das Homescreen-Badge (iOS/iPadOS 16.4+).
 */

importScripts('https://www.gstatic.com/firebasejs/12.15.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/12.15.0/firebase-messaging-compat.js')

firebase.initializeApp({
  apiKey: 'AIzaSyDbXzuiyhLSvbchvbE95jIVX0XGxWk3hhE',
  authDomain: 'htv-vorstands-app.firebaseapp.com',
  projectId: 'htv-vorstands-app',
  messagingSenderId: '291659147396',
  appId: '1:291659147396:web:3b9607bb2dc6b6bdbb7ad1',
})

const messaging = firebase.messaging()

const ICON = self.location.origin + '/Htv-vorstands-app/icon-192.png'
const APP_URL = 'https://helmstedtertv.github.io/Htv-vorstands-app/'

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()))

// ── FCM-Hintergrundnachrichten (App geschlossen oder im Hintergrund) ─────────
// Wir senden vom Worker reine data-Nachrichten, damit wir Titel/Body/Badge
// selbst steuern können.
messaging.onBackgroundMessage(payload => {
  const data  = payload.data || {}
  const title = data.title || 'HTV Vorstands-App'
  const body  = data.body  || 'Neue Nachricht'
  const count = Number(data.count) || 1

  self.registration.showNotification(title, {
    body,
    icon: ICON,
    badge: ICON,
    tag: 'new-message',
    renotify: true,
    vibrate: [100, 50, 100],
  })
  self.registration.setAppBadge?.(count).catch(() => {})
})

// ── Nachrichten vom App-Hauptthread (Badge setzen/löschen) ───────────────────
self.addEventListener('message', event => {
  if (event.data?.type === 'SET_BADGE') {
    const count = event.data.count ?? 0
    if (count > 0) {
      self.registration.setAppBadge?.(count)
    } else {
      self.registration.clearAppBadge?.()
    }
  }
})

// ── Klick auf Benachrichtigung → App in den Vordergrund, Badge löschen ───────
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
        return self.clients.openWindow(APP_URL)
      }
    })
  )
})
