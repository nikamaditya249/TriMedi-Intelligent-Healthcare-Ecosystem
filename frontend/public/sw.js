// Immediately unregister and deactivate this Service Worker
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    self.registration.unregister().then(() => {
      return self.clients.claim();
    })
  );
});

// DO NOT add a fetch event listener.
// Without a fetch listener, the service worker does not intercept any HTTP/navigation requests.
