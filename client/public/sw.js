// Version the cache to force updates
const CACHE_VERSION = 'v1.1.1';
const STATIC_CACHE = `acord-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `acord-dynamic-${CACHE_VERSION}`;

// Install service worker
self.addEventListener('install', (event) => {
  // Skip waiting to activate new service worker immediately
  self.skipWaiting();
});

// Activate service worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            // Delete ALL old caches to force fresh start
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        // Take control of all clients immediately
        return self.clients.claim();
      })
  );
});

// Fetch events - Network First strategy to prevent stale cache issues
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle API requests - Always network first, no caching for auth/critical data
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Only cache non-critical API responses
          if (response.ok && url.pathname.includes('/api/dishes')) {
            const responseClone = response.clone();
            caches.open(DYNAMIC_CACHE)
              .then((cache) => {
                cache.put(request, responseClone);
              });
          }
          return response;
        })
        .catch(() => {
          // Only fallback to cache for dishes API
          if (url.pathname.includes('/api/dishes')) {
            return caches.match(request);
          }
          // For other APIs, return network error
          return new Response('Network Error', {
            status: 503,
            statusText: 'Service Unavailable'
          });
        })
    );
    return;
  }

  // Handle navigation requests - Network first, cache fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            // Cache successful navigation responses
            const responseClone = response.clone();
            caches.open(STATIC_CACHE)
              .then((cache) => {
                cache.put(request, responseClone);
              });
          }
          return response;
        })
        .catch(() => {
          // Fallback to cached version only if network fails
          return caches.match(request)
            .then((cachedResponse) => {
              return cachedResponse || caches.match('/');
            });
        })
    );
    return;
  }

  // Handle static assets - Network first to get latest versions
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const responseClone = response.clone();
          caches.open(STATIC_CACHE)
            .then((cache) => {
              cache.put(request, responseClone);
            });
        }
        return response;
      })
      .catch(() => {
        return caches.match(request);
      })
  );
});

// Background sync for offline orders
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync-orders') {
    event.waitUntil(syncOrders());
  }
});

async function syncOrders() {
  try {
    // Get pending orders from IndexedDB and sync them
    const orders = await getPendingOrders();
    for (const order of orders) {
      await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(order)
      });
    }
    await clearPendingOrders();
  } catch (error) {
    console.error('Failed to sync orders:', error);
  }
}

// Placeholder functions for IndexedDB operations
async function getPendingOrders() {
  // Implementation would use IndexedDB to store pending orders
  return [];
}

async function clearPendingOrders() {
  // Implementation would clear pending orders from IndexedDB
}