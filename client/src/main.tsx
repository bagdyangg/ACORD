import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Register Service Worker for PWA with cache clearing
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
        
        // Check for updates every 30 seconds
        setInterval(() => {
          registration.update();
        }, 30000);
        
        // Handle updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New service worker is available, refresh to activate
                console.log('New service worker available, refreshing...');
                window.location.reload();
              }
            });
          }
        });
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
  
  // Clear cache on first load if needed
  if (localStorage.getItem('cache-cleared') !== 'v1.1.1') {
    caches.keys().then(names => {
      names.forEach(name => {
        caches.delete(name);
      });
    });
    localStorage.setItem('cache-cleared', 'v1.1.1');
    console.log('Cache cleared for new version');
  }
}

createRoot(document.getElementById("root")!).render(<App />);
