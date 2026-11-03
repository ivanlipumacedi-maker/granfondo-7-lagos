// Lógica pura de la hoja de ruta (sin DOM). En el navegador queda en window.RutaLogica.
(function (g) {
  const GOOGLE = /^(www\.|maps\.)?google\.(com|[a-z]{2}|com\.[a-z]{2}|co\.[a-z]{2})$/;

  /** Devuelve el link de Google Maps (normalizado) que haya en el texto, o null. Acepta el texto completo que copia Maps al compartir. */
  function linkMaps(texto) {
    const m = String(texto ?? '').match(/https?:\/\/[^\s<>"']+/i);
    if (!m) return null;
    let u; try { u = new URL(m[0]); } catch { return null; }
    if (u.protocol !== 'https:' || u.username || u.password) return null;
    const h = u.hostname.toLowerCase();
    const ok = h === 'maps.app.goo.gl'
      || (h === 'goo.gl' && u.pathname.startsWith('/maps'))
      || (GOOGLE.test(h) && (h.startsWith('maps.') || u.pathname.startsWith('/maps')));
    return ok ? u.href : null;
  }

  const buscarEnMaps = (lugar) => 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(String(lugar ?? '').trim());

  const clave = (p) => (typeof p.orden === 'number' ? p.orden : typeof p.creado === 'number' ? p.creado : 0);
  const ordenar = (ps) => [...ps].sort((a, b) => clave(a) - clave(b));

  /** Intercambio de orden con la vecina (dir -1 = subir, 1 = bajar): [{id, orden}, {id, orden}] o null si está en el borde. */
  function mover(ps, id, dir) {
    const l = ordenar(ps), i = l.findIndex((p) => p.id === id), j = i + dir;
    if (i < 0 || j < 0 || j >= l.length) return null;
    return [{ id: l[i].id, orden: clave(l[j]) }, { id: l[j].id, orden: clave(l[i]) }];
  }

  const R = { linkMaps, buscarEnMaps, ordenar, mover };
  if (typeof module !== 'undefined') module.exports = R; else g.RutaLogica = R;
})(typeof window !== 'undefined' ? window : globalThis);
