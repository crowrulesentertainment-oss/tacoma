"use strict";
const CACHE_NAME = "tacoma-hub-shell-v1";
const CORE_URLS = [
  "./",
  "./index.html",
  "./directory.html",
  "./chat.html",
  "./submit.html",
  "./offline.html",
  "./manifest.webmanifest",
  "./assets/css/site.css",
  "./assets/js/config.js",
  "./assets/js/app.js",
  "./assets/img/tacoma-hub-icon.svg"
];
self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(CORE_URLS)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith("tacoma-hub-") && key !== CACHE_NAME).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.includes("/rest/") || url.pathname.includes("/auth/") || url.pathname.includes("/realtime/")) return;
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).then(response => {
      if (response.ok) {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
      }
      return response;
    }).catch(async () => (await caches.match(request)) || (await caches.match("./offline.html"))));
    return;
  }
  const isShellAsset = /\.(?:css|js|svg|png|webp|woff2?)$/i.test(url.pathname) || url.pathname.endsWith("manifest.webmanifest");
  if (!isShellAsset) return;
  event.respondWith(caches.match(request).then(cached => {
    const fresh = fetch(request).then(response => {
      if (response.ok) caches.open(CACHE_NAME).then(cache => cache.put(request, response.clone()));
      return response;
    }).catch(() => cached);
    return cached || fresh;
  }));
});
