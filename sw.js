// Service worker mínimo para habilitar la instalación de la PWA.
// No guarda contenido en caché para evitar datos desactualizados
// (progreso, videos, acceso habilitado, etc.).

self.addEventListener('install', function () {
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', function (event) {
  event.respondWith(fetch(event.request));
});
