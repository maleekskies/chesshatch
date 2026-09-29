// A deliberately simple, hand-rolled service worker, there's no
// vite-plugin-pwa here (no network access to install it in this
// sandbox), so this is plain runtime caching rather than a build-time
// precache manifest. Practical effect: Chess Hatch becomes installable
// immediately, and becomes usable offline once you've opened it while
// online at least once (the shell + whatever pages you've visited get
// cached as you go), not offline-capable from a completely fresh
// install with zero prior network access. That's a real, honest
// limitation worth knowing, not full offline-first from square one.
const CACHE_NAME = "chesshatch-v1";
const CORE_ASSETS = ["/", "/manifest.webmanifest", "/icon-192.png", "/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  // Only ever cache Chess Hatch's own same-origin static assets, never
  // Supabase API calls or anything cross-origin. That guarantees you
  // always see live account/game data, never a stale cached response
  // for anything that matters.
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // A synthetic last-resort response. respondWith() must always
  // resolve to a real Response, never undefined, or the browser
  // throws "Failed to convert value to Response" and the whole
  // request fails outright instead of degrading gracefully. This is
  // only ever reached when both the cache and the network have
  // nothing to offer (e.g. a completely fresh install with zero
  // connectivity, hitting a page that was never visited online).
  function offlineFallback() {
    return new Response(
      "You're offline and this page hasn't been loaded before, so there's nothing cached for it yet.",
      { status: 503, headers: { "Content-Type": "text/plain" } }
    );
  }

  if (request.mode === "navigate") {
    // Network-first for page loads, falling back to the cached shell,
    // then the specific cached page, then the synthetic response
    // above, in that order, when offline.
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() =>
          caches.match("/").then((shell) => shell || caches.match(request)).then((cached) => cached || offlineFallback())
        )
    );
    return;
  }

  // Cache-first for everything else (JS/CSS bundles, images, fonts),
  // falling back to network, then the synthetic response above if
  // both the cache and the network come up empty.
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached || offlineFallback());
    })
  );
});
