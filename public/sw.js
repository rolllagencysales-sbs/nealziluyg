// public/sw.js
self.addEventListener('push', function (event) {
    const data = event.data ? event.data.json() : { title: 'Ders!', body: 'Dersin başlıyor!' };
    
    const options = {
        body: data.body,
        icon: '/icon.png', // Sitedeki ikonun yolu
        vibrate: [500, 110, 500, 110, 450, 110, 200, 110], // Alarm titreşimi
        data: { url: '/' },
        tag: 'lesson-alarm',
        renotify: true
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

self.addEventListener('notificationclick', function (event) {
    event.notification.close();
    event.waitUntil(clients.openWindow(event.notification.data.url));
});