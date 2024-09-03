// src\sw\sw_reg.js
import preloadModules from './sw_reg_preload.js';

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    preloadModules().then(() => {
      navigator.serviceWorker.register('/sw.js').then((registration) => {
        console.log('Service Worker registered with scope:', registration.scope);
      }).catch((error) => {
        console.error('Service Worker registration failed:', error);
      });
    });
  });
}