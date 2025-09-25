// MINIMAL Service Worker - PWA features disabled for compute efficiency
// Only essential push notifications remain

// Push notification event (only essential feature)
self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : 'New notification from CalmKaaj',
    icon: '/logo-main.png?v=ck1',
    badge: '/logo-main.png?v=ck1',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '1'
    },
    actions: [
      {
        action: 'explore',
        title: 'Open CalmKaaj',
        icon: '/logo-main.png?v=ck1'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/logo-main.png?v=ck1'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('CalmKaaj', options)
  );
});

// Notification click event
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Message event for communication with main thread
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// DISABLED: All caching, background sync, and offline features removed to reduce compute usage
// DISABLED: Install event - cache resources
// DISABLED: Fetch event - serve from cache with network fallback  
// DISABLED: Activate event - clean up old caches
// DISABLED: Background sync for offline actions