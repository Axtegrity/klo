// IMPORTANT: bump this version on every deploy that changes client code.
// The activate handler deletes caches whose name ≠ CACHE_NAME, so bumping
// the version is the only way stale JS/HTML leaves a user's device.
// 2026-04-11: bumped v1→v2 to flush a stale /vault + events bundle that
// was surviving deploys because v1 was static across releases.
const CACHE_NAME = "klo-v2";

// Only pre-cache routes whose HTML is safe to serve from cache on a cold
// load. /vault (and anything else showing dynamic admin-controlled data)
// must NOT live here — pre-caching them means a user who installs the
// PWA sees frozen content until the SW revalidates.
const APP_SHELL = [
  "/",
  "/advisor",
  "/assessments",
  "/feed",
  "/booking",
];

// Install: cache essential app shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(APP_SHELL);
    })
  );
  self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch: network-first for API, cache-first for static assets
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Network-first for API calls
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, clone);
          });
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Cache-first for static assets
  if (
    request.destination === "image" ||
    request.destination === "font" ||
    request.destination === "style" ||
    request.destination === "script" ||
    url.pathname.startsWith("/_next/static/")
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, clone);
          });
          return response;
        });
      })
    );
    return;
  }

  // Network-first for navigation and other requests
  event.respondWith(
    fetch(request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, clone);
        });
        return response;
      })
      .catch(() => caches.match(request))
  );
});

// Push notification received — show notification
self.addEventListener("push", (event) => {
  if (!event.data) return;

  try {
    const payload = event.data.json();
    const options = {
      body: payload.body || "",
      icon: payload.icon || "/icons/icon-192.png",
      badge: payload.badge || "/icons/badge-72.png",
      tag: payload.tag || "klo-notification",
      data: payload.data || {},
      vibrate: [200, 100, 200],
      actions: [{ action: "open", title: "Open" }],
    };

    event.waitUntil(
      self.registration.showNotification(payload.title || "KLO Advisory", options)
    );
  } catch {
    event.waitUntil(
      self.registration.showNotification("KLO Advisory", {
        body: event.data.text(),
        icon: "/icons/icon-192.png",
      })
    );
  }
});

// Notification click — navigate to the target URL
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url = event.notification.data?.url || "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});
