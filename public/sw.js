const CACHE = "stockpilot-v1";
const OFFLINE = "Offline — check your connection";

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (e) => {
  e.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (e) => {
  e.respondWith(networkFirst(e.request));
});

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    if (request.mode === "navigate") {
      return new Response(OFFLINE, { status: 503, headers: { "Content-Type": "text/plain" } });
    }
    return new Response(OFFLINE, { status: 503 });
  }
}
