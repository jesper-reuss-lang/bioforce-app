/* Einkaufsplaner – Service Worker
   Sorgt für Offline-Betrieb und Installierbarkeit als PWA.
   Wenn du die App änderst: CACHE-Version unten hochzählen (v1 -> v2),
   damit die neue Version sicher ausgeliefert wird. */
const CACHE = 'einkaufsplaner-v5';
const ASSETS = [
  './',
  './index.html',
  './Einkaufsplaner.html',
  './manifest.json',
  './icon.svg'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) { return c.addAll(ASSETS); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; })
        .map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;

  // HTML-Seiten: zuerst Netz (für Updates), bei Offline aus dem Cache
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then(function (res) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(req, copy); });
        return res;
      }).catch(function () {
        return caches.match(req).then(function (r) {
          return r || caches.match('./Einkaufsplaner.html');
        });
      })
    );
    return;
  }

  // Übrige Dateien: zuerst Cache, sonst Netz
  e.respondWith(
    caches.match(req).then(function (c) {
      return c || fetch(req).then(function (res) {
        var copy = res.clone();
        caches.open(CACHE).then(function (x) { x.put(req, copy); });
        return res;
      }).catch(function () { return undefined; });
    })
  );
});
