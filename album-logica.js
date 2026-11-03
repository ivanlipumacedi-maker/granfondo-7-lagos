// Lógica pura del álbum (sin DOM). En el navegador queda en window.AlbumLogica.
(function (g) {
  const LIMITE_BYTES = 1024 * 1024 * 1024; // plan gratis de Supabase: 1 GB de Storage
  const MAX_LADO = 4096;

  const rutaFoto = (viaje, id) => `${viaje}/album/${id}.jpg`;
  const rutaMini = (ruta) => ruta.replace(/\.jpg$/, '.t.webp');
  const rutaMedia = (ruta) => ruta.replace(/\.jpg$/, '.m.jpg'); // 1600 px: queda siempre en la app
  /** qué mostrar en grande: la original si sigue en la app; si se liberó (está en Drive), la media; si no hay, la miniatura */
  const verFoto = (f) => (!f.liberada ? f.archivo : f.media || f.mini);

  function escala(w, h, max = MAX_LADO) {
    const f = Math.min(1, max / Math.max(w, h));
    return { ancho: Math.round(w * f), alto: Math.round(h * f) };
  }

  const fmtDia = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/Buenos_Aires', year: 'numeric', month: '2-digit', day: '2-digit' });
  const fmtTitulo = new Intl.DateTimeFormat('es-AR', { timeZone: 'America/Argentina/Buenos_Aires', weekday: 'long', day: 'numeric', month: 'long' });
  const porTomada = (a, b) => Date.parse(b.tomada) - Date.parse(a.tomada);

  function porDia(fotos) {
    const grupos = new Map();
    for (const f of [...fotos].sort(porTomada)) {
      const d = new Date(f.tomada), dia = fmtDia.format(d);
      if (!grupos.has(dia)) grupos.set(dia, { dia, titulo: fmtTitulo.format(d).replace(',', ''), fotos: [] });
      grupos.get(dia).fotos.push(f);
    }
    return [...grupos.values()];
  }

  function espacio(uso, limite = LIMITE_BYTES) {
    const r = uso / limite;
    return { pct: Math.min(100, Math.round(r * 100)), estado: r >= 1 ? 'lleno' : r >= 0.9 ? 'aviso' : 'ok' };
  }

  const fusionar = (lista, f) => [...lista.filter((x) => x.id !== f.id), f].sort(porTomada);
  const quitar = (lista, id) => lista.filter((x) => x.id !== id);
  const espera = (intento) => Math.min(60000, 2000 * 2 ** intento);

  function zoomPasos(min, max) {
    if (!(max > min)) return [];
    const p = [1, 2, 5, 10].filter((v) => v >= min && v <= max);
    if (min < 1) p.unshift(Math.round(min * 10) / 10);
    if (max > p[p.length - 1]) p.push(Math.round(max * 10) / 10);
    return p;
  }

  const A = { LIMITE_BYTES, MAX_LADO, rutaFoto, rutaMini, rutaMedia, verFoto, escala, porDia, espacio, fusionar, quitar, espera, zoomPasos };
  if (typeof module !== 'undefined') module.exports = A; else g.AlbumLogica = A;
})(typeof window !== 'undefined' ? window : globalThis);
