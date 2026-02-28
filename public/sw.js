const CACHE_NAME = 'expense-tracker-pro-v1.0.4';
const STATIC_CACHE_NAME = 'expense-tracker-static-v1.0.4';
const DYNAMIC_CACHE_NAME = 'expense-tracker-dynamic-v1.0.4';

// Files to cache for offline functionality
const STATIC_FILES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/favicon-16x16.png',
  '/favicon-32x32.png',
  '/pwa-192x192.png',
  '/pwa-512x512.png'
];

// Install event - cache static files
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching static files');
        return cache.addAll(STATIC_FILES);
      })
      .then(() => {
        console.log('Service Worker: Static files cached successfully');
        // Skip waiting to activate immediately
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker: Error caching static files', error);
      })
  );
});

// Listen for skip waiting message
self.addEventListener('message', (event) => {
  if (event.data && event.data.action === 'skipWaiting') {
    console.log('Service Worker: Skip waiting requested');
    self.skipWaiting();
  }
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE_NAME && cacheName !== DYNAMIC_CACHE_NAME) {
              console.log('Service Worker: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Activated successfully');
        return self.clients.claim();
      })
  );
});

// Fetch event - Network First strategy for updates
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const { url, method } = request;

  // Only handle GET requests
  if (method !== 'GET') {
    return;
  }

  // Skip non-http requests
  if (!url.startsWith('http')) {
    return;
  }

  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        // Check if response is valid
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          // If network fails, try cache
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
              console.log('Service Worker: Network failed, serving from cache', url);
              return cachedResponse;
            }
            return networkResponse;
          });
        }

        // Clone the response for caching
        const responseToCache = networkResponse.clone();

        // Cache the response if it should be cached
        caches.open(DYNAMIC_CACHE_NAME)
          .then((cache) => {
            if (shouldCache(url)) {
              console.log('Service Worker: Caching network response', url);
              cache.put(request, responseToCache);
            }
          });

        return networkResponse;
      })
      .catch((error) => {
        console.log('Service Worker: Network request failed, trying cache', url, error);
        
        // Try to get from cache
        return caches.match(request)
          .then((cachedResponse) => {
            if (cachedResponse) {
              console.log('Service Worker: Serving from cache (offline)', url);
              return cachedResponse;
            }
            
            // Return offline page for navigation requests
            if (request.mode === 'navigate') {
              return caches.match('/index.html');
            }
            
            // Return a custom offline response for API requests
            if (url.includes('/api/')) {
      return new Response(
                JSON.stringify({
                  error: 'Offline',
                  message: 'Você está offline. Algumas funcionalidades podem estar limitadas.',
                  offline: true
                }),
                {
                  status: 503,
                  statusText: 'Service Unavailable',
                  headers: {
                    'Content-Type': 'application/json'
                  }
                }
              );
            }
            
            throw error;
          });
      })
  );
});

// Helper function to determine if URL should be cached
function shouldCache(url) {
  // Cache static assets
  if (url.includes('.js') || url.includes('.css') || url.includes('.png') || 
      url.includes('.jpg') || url.includes('.jpeg') || url.includes('.svg') || 
      url.includes('.ico') || url.includes('.woff') || url.includes('.woff2')) {
    return true;
  }
  
  // Cache API responses (optional - be careful with this)
  if (url.includes('/api/transactions') || url.includes('/api/categories')) {
    return true;
  }
  
  return false;
}

// Background sync for offline data
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Sync offline data when connection is restored
      syncOfflineData()
    );
  }
});

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push notification received');
  
  const options = {
    body: event.data ? event.data.text() : 'Nova notificação do Controle Financeiro',
    icon: '/pwa-192x192.png',
    badge: '/favicon-32x32.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'open',
        title: 'Abrir App',
        icon: '/pwa-192x192.png'
      },
      {
        action: 'close',
        title: 'Fechar',
        icon: '/favicon-32x32.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Controle Financeiro', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked');
  
  event.notification.close();

  if (event.action === 'open') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Helper function to sync offline data
async function syncOfflineData() {
  try {
    // Get offline data from IndexedDB or localStorage
    const offlineData = await getOfflineData();
    
    if (offlineData && offlineData.length > 0) {
      console.log('Service Worker: Syncing offline data', offlineData.length, 'items');
      
      // Sync each offline transaction
      for (const item of offlineData) {
        try {
          await syncTransaction(item);
        } catch (error) {
          console.error('Service Worker: Error syncing item', item, error);
        }
      }
      
      // Clear offline data after successful sync
      await clearOfflineData();
    }
  } catch (error) {
    console.error('Service Worker: Error syncing offline data', error);
  }
}

// Helper functions for offline data management
async function getOfflineData() {
  // This would typically read from IndexedDB
  // For now, return empty array
  return [];
}

async function syncTransaction(transaction) {
  // This would sync the transaction to the server
  console.log('Service Worker: Syncing transaction', transaction);
}

async function clearOfflineData() {
  // This would clear the offline data after successful sync
  console.log('Service Worker: Clearing offline data');
}
