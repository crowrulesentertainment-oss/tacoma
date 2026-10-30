"use strict";
const CACHE_NAME = "tacoma-hub-shell-v2-20261029";
const CORE_URLS = [
  "./", "./index.html", "./directory.html", "./businesses.html",
  "./resources.html", "./events.html", "./opportunities.html",
  "./lost-found.html", "./community-alerts.html", "./emergency-resources.html",
  "./chat.html", "./submit.html", "./moderation.html", "./privacy.html",
  "./member.html", "./offline.html", "./manifest.webmanifest",
  "./assets/css/site.css", "./assets/js/config.js", "./assets/js/app.js",
  "./assets/js/member.js", "./assets/img/tacoma-hub-icon.svg"
];
self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await Promise.all(CORE_URLS.map(async path => {
      try {
        const response = await fetch(path, { cache: "reload" });
        if (response.ok) await cache.put(path, response);
      } catch (_) { /* A single optional shell file must not block installation. */ }
    }));
    await self.skipWaiting();
  })());
});
self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith("tacoma-hub-") && key !== CACHE_NAME).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});
self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (/\/rest\/|\/auth\/|\/realtime\//.test(url.pathname)) return;
  if (request.mode === "navigate") {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        if (response.ok) {
          const cache = await caches.open(CACHE_NAME);
          await cache.put(request, response.clone());
        }
        return response;
      } catch (_) {
        return (await caches.match(request)) || (await caches.match("./offline.html")) || Response.error();
      }
    })());
    return;
  }
  const isShellAsset = /\.(?:css|js|svg|png|jpe?g|webp|woff2?)$/i.test(url.pathname) || url.pathname.endsWith("manifest.webmanifest");
  if (!isShellAsset) return;
  event.respondWith((async () => {
    const cached = await caches.match(request);
    const refresh = fetch(request).then(async response => {
      if (response.ok) {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(request, response.clone());
      }
      return response;
    }).catch(() => cached || Response.error());
    return cached || refresh;
  })());
});
