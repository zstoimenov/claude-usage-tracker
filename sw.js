const CACHE_NAME = "claude-cycle-v24";
const ASSETS = [
  "/claude-usage-tracker/",
  "/claude-usage-tracker/index.html",
  "/claude-usage-tracker/manifest.json",
  "/claude-usage-tracker/icons/icon-192.png",
  "/claude-usage-tracker/icons/icon-512.png"
];

// Install: cache all assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Clicking the "session ended" notification focuses (or opens) the app
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = "/claude-usage-tracker/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes("/claude-usage-tracker/") && "focus" in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});

// Fetch: stale-while-revalidate for this app's own files, so updates arrive
// on the next launch without bumping CACHE_NAME. Cross-origin requests (the
// sync server, the QR library) go straight to the network and are never cached.
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) =>
      cache.match(req, { ignoreSearch: true }).then((cached) => {
        const network = fetch(req)
          .then((res) => {
            if (res && res.ok) cache.put(req, res.clone());
            return res;
          })
          .catch(() => cached);
        if (cached) {
          event.waitUntil(network);
          return cached;
        }
        return network;
      })
    )
  );
});
