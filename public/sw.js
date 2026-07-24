// Minimal service worker: satisfies PWA installability requirements
// (Chrome/Android install prompt, Trusted Web Activity for Google Play).
// MyMemo needs a live connection for auth/video/payments, so this does not
// attempt full offline support - it just passes requests through.
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request));
});
