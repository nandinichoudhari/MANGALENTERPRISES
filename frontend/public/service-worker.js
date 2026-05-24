// This service worker acts as a KILL SWITCH to clear all caches for returning users who have a blank screen.

self.addEventListener('install', (event) => {
  self.skipWaiting(); // Force the waiting service worker to become the active service worker.
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          console.log('Clearing old cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(() => self.clients.claim()) // Take control of all pages immediately
  );
});

// Pass through all fetch requests, bypassing any cache.
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});

// ==========================================
// 🔔 BACKGROUND WEB PUSH NOTIFICATION HANDLERS
// ==========================================

self.addEventListener('push', (event) => {
  let data = { title: '🚨 New Order!', body: 'You have received a new order on Mangal Enterprises.' };
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: '🚨 New Order!', body: event.data.text() };
    }
  }

  const options = {
    body: data.body,
    icon: '/logo192.png',
    badge: '/logo192.png',
    vibrate: [100, 50, 100, 50, 300, 100, 300],
    data: {
      url: data.url || '/admin-panel'
    },
    tag: 'mangal-new-order',
    renotify: true,
    requireInteraction: true // Keeps the banner on the screen until clicked
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/admin-panel';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // 1. If an admin dashboard is already open, focus it and navigate
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes('/admin-panel') && 'focus' in client) {
          client.navigate(targetUrl); // Ensure it reloads/goes to the active target
          return client.focus();
        }
      }
      
      // 2. If no dashboard window is open, open a new one in the standalone PWA frame
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

