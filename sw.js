// Service worker mínimo — apenas para habilitar a instalação do PWA.
// Não faz cache de conteúdo, para não arriscar exibir dados desatualizados
// (progresso, vídeos, acesso liberado etc.).

self.addEventListener('install', function () {
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', function (event) {
  event.respondWith(fetch(event.request));
});
