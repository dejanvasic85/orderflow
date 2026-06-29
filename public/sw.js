// Minimal service worker for installability.
//
// This intentionally does NOT cache app responses. The app is SSR-rendered on
// Cloudflare Workers and serves authenticated, frequently-changing data — caching
// here would risk serving stale or cross-user content. Its only job is to satisfy
// the PWA install criteria so phones show the "Add to Home Screen" / install prompt.
//
// If offline support is added later, do it deliberately with a Workbox precache
// manifest for static assets + an offline fallback, not by blanket-caching fetches.

self.addEventListener("install", () => {
  // Activate this worker immediately rather than waiting for old tabs to close.
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  // Take control of open pages as soon as the worker activates.
  event.waitUntil(self.clients.claim());
});

// A fetch handler is required for the install prompt to be offered. We pass every
// request straight through to the network — no caching, no interception of bytes.
self.addEventListener("fetch", () => {
  // Intentionally a no-op: requests fall through to the default network behaviour.
});
