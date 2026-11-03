// Lógica pura de la hoja de ruta (sin DOM). En el navegador queda en window.RutaLogica.
(function (g) {
  // solo dominios de Google de verdad (no cualquier "google.com.xx" que podría registrar otro)
  const TLD = new Set(['com', 'com.ar', 'cl', 'com.uy', 'com.py', 'com.bo', 'com.pe', 'com.br', 'com.mx', 'es', 'co', 'com.co', 'com.ec', 'co.ve', 'us', 'co.uk', 'fr', 'it', 'de']);
  const esGoogle = (h) => { const m = h.match(/^(?:www\.|maps\.)?google\.(.+)$/); return !!m && TLD.has(m[1]); };

  /** Devuelve el link de Google Maps (normalizado) que haya en el texto, o null. Acepta el texto completo que copia Maps al compartir. */
  function linkMaps(texto) {
    const m = String(texto ?? '').match(/https?:\/\/[^\s<>"']+/i);
    if (!m) return null;
    let u; try { u = new URL(m[0]); } catch { return null; }
    if (u.protocol !== 'https:' || u.username || u.password) return null;
    const h = u.hostname.toLowerCase();
    const ok = h === 'maps.app.goo.gl'
      || (h === 'goo.gl' && u.pathname.startsWith('/maps'))
      || (esGoogle(h) && (h.startsWith('maps.') || u.pathname.startsWith('/maps')));
    return ok ? u.href : null;
  }

  const buscarEnMaps = (lugar) => 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(String(lugar ?? '').trim());

  const clave = (p) => (typeof p.orden === 'number' ? p.orden : typeof p.creado === 'number' ? p.creado : 0);
  const ordenar = (ps) => [...ps].sort((a, b) => clave(a) - clave(b));

  /** Cambios de orden para subir (dir -1) o bajar (1) una parada: [{id, orden, movida?}] o null si está en el borde.
   *  Normalmente intercambia con la vecina; si hay órdenes repetidos (datos viejos, cambios cruzados) renumera toda la lista. */
  function mover(ps, id, dir) {
    const l = ordenar(ps), i = l.findIndex((p) => p.id === id), j = i + dir;
    if (i < 0 || j < 0 || j >= l.length) return null;
    const claves = l.map(clave);
    if (new Set(claves).size === claves.length) return [{ id: l[i].id, orden: claves[j], movida: true }, { id: l[j].id, orden: claves[i] }];
    [l[i], l[j]] = [l[j], l[i]];
    return l.map((p, k) => ({ id: p.id, orden: (k + 1) * 1000, ...(p.id === id ? { movida: true } : {}) }));
  }

  /** Km escritos en el celu: acepta coma decimal; vacío, negativo o inválido = 0. */
  function km(t) { const n = Number(String(t ?? '').trim().replace(',', '.')); return Number.isFinite(n) && n > 0 ? n : 0; }

  const R = { linkMaps, buscarEnMaps, ordenar, mover, km };
  if (typeof module !== 'undefined') module.exports = R; else g.RutaLogica = R;
})(typeof window !== 'undefined' ? window : globalThis);
