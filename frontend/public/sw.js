// Clean up and unregister any stale Service Worker on localhost
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    self.registration.unregister().then(() => {
      return self.clients.matchAll();
    }).then((clients) => {
      clients.forEach((client) => client.navigate(client.url));
    })
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    fetch(event.request).catch(() => {
      // Return a basic fallback response instead of rejecting promise to avoid TypeError
      return new Response("", { status: 503, statusText: "Service Unavailable" });
    })
  );
});

