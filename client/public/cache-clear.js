// Emergency cache clearing script
// This can be loaded directly in browser to force cache clear

(function() {
  'use strict';
  
  console.log('🧹 Starting emergency cache clear...');
  
  // 1. Clear all caches
  if ('caches' in window) {
    caches.keys().then(function(names) {
      names.forEach(function(name) {
        console.log('Deleting cache:', name);
        caches.delete(name);
      });
    });
  }
  
  // 2. Clear localStorage
  if (typeof Storage !== 'undefined') {
    localStorage.clear();
    console.log('localStorage cleared');
  }
  
  // 3. Clear sessionStorage
  if (typeof Storage !== 'undefined') {
    sessionStorage.clear();
    console.log('sessionStorage cleared');
  }
  
  // 4. Unregister service worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(function(registrations) {
      registrations.forEach(function(registration) {
        console.log('Unregistering SW:', registration);
        registration.unregister();
      });
    });
  }
  
  console.log('🎉 Cache clear complete! Refreshing page...');
  
  // 5. Force refresh
  setTimeout(function() {
    window.location.reload(true);
  }, 1000);
  
})();