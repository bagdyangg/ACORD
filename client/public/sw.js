// Version the cache to force updates
const CACHE_VERSION = 'v1.2.5';
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

// Fetch events - Network First strategy with aggressive cache busting
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle API requests - NO CACHING for any API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request, {
        cache: 'no-store',
        headers: {
          ...request.headers,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      })
        .then((response) => {
          // Never cache API responses - always serve fresh
          const newHeaders = new Headers(response.headers);
          newHeaders.set('Cache-Control', 'no-cache, no-store, must-revalidate');
          newHeaders.set('Pragma', 'no-cache');
          newHeaders.set('Expires', '0');
          
          return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: newHeaders
          });
        })
        .catch((error) => {
          console.error('API request failed:', error);
          // No cache fallback for APIs - always return network error
          return new Response(JSON.stringify({
            error: 'Network Error',
            message: 'Unable to reach server. Please check your connection.'
          }), {
            status: 503,
            statusText: 'Service Unavailable',
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache, no-store, must-revalidate'
            }
          });
        })
    );
    return;
  }

  // Handle navigation requests - Network first with cache busting
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request, {
        cache: 'reload'
      })
        .then((response) => {
          if (response.ok) {
            // Add cache-busting headers to navigation responses
            const newHeaders = new Headers(response.headers);
            newHeaders.set('Cache-Control', 'no-cache, must-revalidate');
            newHeaders.set('Expires', '0');
            
            return new Response(response.body, {
              status: response.status,
              statusText: response.statusText,
              headers: newHeaders
            });
          }
          return response;
        })
        .catch(() => {
          // Return basic offline page if network fails
          return new Response(`
            <html>
              <head>
                <meta charset="utf-8">
                <title>ACORD - Connection Error</title>
                <style>
                  body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f5f5f5; }
                  .container { max-width: 400px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                  button { background: #007bff; color: white; border: none; padding: 12px 24px; border-radius: 6px; font-size: 16px; cursor: pointer; margin: 5px; }
                  button:hover { background: #0056b3; }
                  .emergency { background: #dc3545; }
                  .emergency:hover { background: #c82333; }
                </style>
              </head>
              <body>
                <div class="container">
                  <h1>🔌 ACORD Unavailable</h1>
                  <p>Cannot connect to the lunch ordering system.</p>
                  <p>Please check your internet connection.</p>
                  <button onclick="window.location.reload(true)">Try Again</button>
                  <br>
                  <button class="emergency" onclick="clearEverythingAndRetry()">Clear Cache & Retry</button>
                </div>
                <script>
                  function clearEverythingAndRetry() {
                    if ('caches' in window) {
                      caches.keys().then(names => {
                        Promise.all(names.map(name => caches.delete(name)))
                          .then(() => {
                            localStorage.clear();
                            sessionStorage.clear();
                            window.location.reload(true);
                          });
                      });
                    } else {
                      localStorage.clear();
                      sessionStorage.clear();
                      window.location.reload(true);
                    }
                  }
                </script>
              </body>
            </html>
          `, {
            headers: {
              'Content-Type': 'text/html',
              'Cache-Control': 'no-cache, no-store, must-revalidate'
            }
          });
        })
    );
    return;
  }

  // Handle static assets - Network first with cache busting
  event.respondWith(
    fetch(request, {
      cache: 'reload'
    })
      .then((response) => {
        if (response.ok) {
          // Add cache-busting headers to static assets
          const newHeaders = new Headers(response.headers);
          newHeaders.set('Cache-Control', 'no-cache, must-revalidate');
          
          return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: newHeaders
          });
        }
        return response;
      })
      .catch(() => {
        // No cache fallback for static assets - ensures fresh content
        return new Response('Resource not available', {
          status: 404,
          statusText: 'Not Found',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate'
          }
        });
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