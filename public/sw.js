const CACHE_NAME = "koskalak-v2";

self.addEventListener("install", (event) => {
  // Take over from any already-installed worker on the next activate, rather
  // than waiting for every open tab to close — a stale cache-first "/" is
  // exactly what makes a landed change look like it "doesn't work".
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Basic offline shell
      return cache.addAll([
        "/",
        "/manifest.json",
        "/favicon.ico"
      ]);
    })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then((names) =>
        Promise.all(names.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))),
      ),
      self.clients.claim(),
    ]),
  );
});

self.addEventListener("fetch", (event) => {
  // Only handle GET requests
  if (event.request.method !== "GET") return;
  // Ignore API and server actions for caching
  if (event.request.url.includes("/api/") || event.request.url.includes("?_rsc=")) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Return cached response immediately if available
      if (cachedResponse) {
        // Fetch in background to update cache
        event.waitUntil(
          fetch(event.request).then((response) => {
            if (response && response.status === 200) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, response);
              });
            }
          }).catch(() => {})
        );
        return cachedResponse;
      }

      // If not in cache, fetch from network
      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200 || response.type !== "basic") {
          return response;
        }

        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      }).catch(() => {
        // Return a generic fallback if needed, currently we just let it fail
        return new Response("Offline", { status: 503, statusText: "Service Unavailable" });
      });
    })
  );
});
