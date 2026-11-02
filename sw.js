// Service worker de Rumbo al Sur: solo muestra las notificaciones push.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

self.addEventListener('push', (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch { d = { body: e.data && e.data.text() }; }
  e.waitUntil((async () => {
    // Si tenés la app abierta en pantalla, el cambio ya lo ves en vivo: no hace falta avisar.
    if (d.tipo === 'cambio') {
      const ventanas = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      if (ventanas.some((v) => v.visibilityState === 'visible')) return;
    }
    await self.registration.showNotification(d.title || 'Rumbo al Sur', {
      body: d.body || '',
      tag: d.tag,
      renotify: !!d.tag,
      icon: 'icon-192.png',
      badge: 'badge-96.png',
      lang: 'es-AR',
    });
  })());
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil((async () => {
    const ventanas = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const abierta = ventanas.find((v) => v.url.startsWith(self.registration.scope));
    if (abierta) return abierta.focus();
    return self.clients.openWindow(self.registration.scope);
  })());
});
