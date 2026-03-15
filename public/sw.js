// Service Worker for Push Notifications
self.addEventListener('push', function(event) {
  console.log('[v0-sw] Push event received');
  
  if (!event.data) {
    console.log('[v0-sw] No data in push event');
    return;
  }

  let data;
  try {
    data = event.data.json();
    console.log('[v0-sw] Push data:', data);
  } catch (e) {
    console.log('[v0-sw] Push data is text');
    data = {
      title: 'Notificación',
      message: event.data.text(),
    };
  }
  
  const options = {
    body: data.message || data.body || 'Nueva notificación',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [100, 50, 100],
    tag: 'notification',
    requireInteraction: true,
    data: {
      url: data.url || '/',
      dateOfArrival: Date.now(),
    },
    actions: [
      { action: 'open', title: 'Abrir' },
      { action: 'close', title: 'Cerrar' },
    ],
  };

  console.log('[v0-sw] Showing notification:', data.title);
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'Notificación', options)
  );
});

self.addEventListener('notificationclick', function(event) {
  console.log('[v0-sw] Notification clicked:', event.action);
  event.notification.close();

  if (event.action === 'close') return;

  const urlToOpen = event.notification.data?.url || '/';
  console.log('[v0-sw] Opening URL:', urlToOpen);

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      console.log('[v0-sw] Found clients:', clientList.length);
      
      // If there's already a window open, focus it
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          console.log('[v0-sw] Focusing existing client');
          return client.focus();
        }
      }
      // Otherwise open a new window
      console.log('[v0-sw] Opening new window');
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

self.addEventListener('install', function(event) {
  console.log('[v0-sw] Service worker installing');
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  console.log('[v0-sw] Service worker activating');
  event.waitUntil(clients.claim());
});
