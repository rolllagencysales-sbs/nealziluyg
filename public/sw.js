// Service Worker for EkolZil.io (Smart School Bell)
const CACHE_NAME = 'ekolzil-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/src/main.tsx',
  '/src/App.tsx',
  '/src/index.css'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch(() => {
        // Safe fallback in case some assets fail during development build
        console.warn('Some initial assets failed to cache, proceeding anyway.');
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Cache fallback strategy
self.addEventListener('fetch', (event) => {
  // Only intercept HTTP/S GET requests
  if (!event.request.url.startsWith('http') || event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return networkResponse;
      }).catch(() => {
        // Fallback for offline usage
        return new Response('EkolZil Offline Modu. İnternet bağlantınızı kontrol edin.');
      });
    })
  );
});

// Background Notifications & Sw Message Channel
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'TRIGGER_NOTIFICATION') {
    const { title, body, isStart } = event.data.payload;
    const options = {
      body: body,
      icon: isStart ? '/favicon.ico' : '/favicon.ico',
      badge: isStart ? '/favicon.ico' : '/favicon.ico',
      tag: 'school-bell',
      vibrate: [200, 100, 200, 100, 400],
      requireInteraction: true,
      data: {
        url: self.registration.scope
      }
    };
    
    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  }
});

// Click action on the notification to restore application tab
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === event.notification.data.url && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(event.notification.data.url);
      }
    })
  );
});
