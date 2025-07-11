import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Register Service Worker for PWA with aggressive cache clearing
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // First, unregister any existing service workers
    navigator.serviceWorker.getRegistrations().then(registrations => {
      registrations.forEach(registration => {
        registration.unregister();
      });
    });
    
    // Clear all caches before registering new SW
    caches.keys().then(names => {
      names.forEach(name => {
        caches.delete(name);
      });
    });
    
    // Register new service worker with error handling
    navigator.serviceWorker.register('/sw.js', {
      scope: '/',
      updateViaCache: 'none'
    })
      .then((registration) => {
        console.log('SW registered: ', registration);
        
        // Check for updates every 60 seconds with error handling
        setInterval(() => {
          registration.update().catch(err => {
            // Silently ignore SW update errors to prevent spam
            console.debug('SW update check failed:', err.message);
          });
        }, 60000);
        
        // Handle updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed') {
                // Force immediate reload for new service worker
                console.log('New service worker available, force reloading...');
                caches.keys().then(names => {
                  names.forEach(name => caches.delete(name));
                  window.location.reload(true);
                });
              }
            });
          }
        });
      })
      .catch((registrationError) => {
        console.warn('SW registration failed:', registrationError.message);
        // Don't retry to avoid error spam
      });
  });
  
  // Clear cache on first load if needed - more aggressive approach
  const currentVersion = 'v1.2.3';
  const lastClearedVersion = localStorage.getItem('cache-cleared');
  
  if (lastClearedVersion !== currentVersion) {
    console.log(`🧹 Cache version mismatch: ${lastClearedVersion} -> ${currentVersion}`);
    
    // Clear everything aggressively
    Promise.all([
      // Clear all caches
      caches.keys().then(names => {
        console.log('🗑️ Deleting all caches:', names);
        return Promise.all(names.map(name => caches.delete(name)));
      }),
      // Clear storage
      new Promise(resolve => {
        localStorage.clear();
        sessionStorage.clear();
        resolve(null);
      }),
      // Unregister all service workers
      navigator.serviceWorker.getRegistrations().then(registrations => {
        console.log('🚫 Unregistering old service workers:', registrations.length);
        return Promise.all(registrations.map(reg => reg.unregister()));
      })
    ]).then(() => {
      localStorage.setItem('cache-cleared', currentVersion);
      console.log(`✅ Cache cleared for new version ${currentVersion}`);
      
      // Force hard reload after clearing everything
      window.location.href = window.location.href + '?nocache=' + Date.now();
    });
  }
  
  // Check for version updates every 30 seconds (more reasonable)
  setInterval(() => {
    fetch('/version.json?t=' + Date.now())
      .then(res => res.json())
      .then(data => {
        if (data.version !== currentVersion.replace('v', '')) {
          console.log('🔄 New version detected, clearing cache...');
          caches.keys().then(names => {
            names.forEach(name => caches.delete(name));
            window.location.reload(true);
          });
        }
      })
      .catch(() => {}); // Ignore fetch errors
  }, 30000);
}

createRoot(document.getElementById("root")!).render(<App />);
