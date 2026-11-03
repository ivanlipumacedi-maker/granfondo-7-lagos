// Service worker de Rumbo al Sur: notificaciones push y caché de la IA de borrado (para usarla sin señal).
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

// La IA (worker, onnxruntime y modelo) se guarda la primera vez que se usa y después se sirve desde el teléfono.
const CACHE_IA = 'rumbo-ia-v1';
const esIA = (u) => u.origin === self.location.origin && /\/(ia-worker\.js|vendor\/ort\/[^/]+|modelos\/[^/]+\.onnx)$/.test(u.pathname);
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const u = new URL(e.request.url);
  if (!esIA(u)) return; // el resto de la app va directo a la red, como siempre
  const clave = u.origin + u.pathname; // sin ?v=
  e.respondWith((async () => {
    const cache = await caches.open(CACHE_IA);
    const guardada = await cache.match(clave);
    if (guardada) return guardada;
    const r = await fetch(e.request);
    if (r.ok) e.waitUntil(cache.put(clave, r.clone()));
    return r;
  })());
});

self.addEventListener('push', (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch { d = { body: e.data && e.data.text() }; }
  e.waitUntil((async () => {
    if (d.tipo === 'chat') await marcarEntregado().catch(() => {});
    // Si tenés la app abierta en pantalla, el cambio ya lo ves en vivo: no hace falta avisar.
    if (d.tipo === 'cambio' || d.tipo === 'chat') {
      const ventanas = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      const visibles = ventanas.filter((v) => v.visibilityState === 'visible');
      // Con la app a la vista no se avisa: el chat/la franja ya lo muestran en vivo (con badge).
      if (visibles.length) return;
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

async function marcarEntregado() {
  const r = await (await caches.open('rumbo-config')).match('./__chat'); if (!r) return;
  const { viaje, quien, url, key } = await r.json(); if (!viaje || !quien || !url || !key) return;
  const h = { apikey: key, Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' };
  const res = await fetch(url + '/rest/v1/rpc/chat_marcar', { method: 'POST', headers: { ...h, 'x-viaje': viaje }, body: JSON.stringify({ p_quien: quien, p_entregado: new Date().toISOString(), p_leido: null, p_visto: false }) });
  if (!res.ok) return;
  const fila = await res.json();
  await fetch(url + '/realtime/v1/api/broadcast', { method: 'POST', headers: h, body: JSON.stringify({ messages: [{ topic: 'viaje-' + viaje, event: 'chat', payload: { accion: 'estado', fila } }] }) });
}

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const destino = self.registration.scope + (e.notification.tag === 'chat' ? '#chat' : '');
  e.waitUntil((async () => {
    const ventanas = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const abierta = ventanas.find((v) => v.url.startsWith(self.registration.scope));
    if (abierta) {
      if (e.notification.tag === 'chat' && !abierta.url.endsWith('#chat')) abierta.postMessage({ abrir: 'chat' });
      return abierta.focus();
    }
    return self.clients.openWindow(destino);
  })());
});
