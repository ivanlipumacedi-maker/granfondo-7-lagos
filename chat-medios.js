// Medios del chat de Rumbo al Sur: compresión de fotos, URLs firmadas, grabación de audio y recorte de perfil.
// Queda en window.ChatMedios. Necesita window.ChatLogica.
(function () {
  const L = window.ChatLogica;
  const BUCKET = 'chat', VIDA_S = 3600, MARGEN_MS = 5 * 60 * 1000;

  function aBlob(canvas, calidad) {
    return new Promise((res) => canvas.toBlob((b) => {
      if (b && b.type === 'image/webp') return res(b);
      canvas.toBlob((j) => res(j), 'image/jpeg', calidad); // si el navegador no codifica WebP
    }, 'image/webp', calidad));
  }

  /** Achica la foto (lado largo ≤ max), la endereza según EXIF y la pasa a WebP. */
  async function comprimirImagen(file, max = 1600, calidad = 0.8) {
    const bm = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const { ancho, alto } = L.escalar(bm.width, bm.height, max);
    const c = document.createElement('canvas'); c.width = ancho; c.height = alto;
    c.getContext('2d').drawImage(bm, 0, 0, ancho, alto);
    bm.close?.();
    const blob = await aBlob(c, calidad);
    return { blob, ancho, alto, tipo: blob.type };
  }

  /** URLs firmadas con caché; se renuevan cuando faltan menos de 5 minutos.
   *  Sin red: backoff global (no se reintenta hasta reintentarYa() o 30 s). Ruta inexistente: no se repide. */
  const cache = new Map(), rotas = new Set();
  let esperarHasta = 0;
  const BACKOFF_MS = 30 * 1000;
  const vigente = (p) => (cache.get(p)?.vence ?? 0) - Date.now() > MARGEN_MS;
  const puedeFirmar = (p) => !!p && !rotas.has(p) && Date.now() >= esperarHasta;
  const reintentarYa = () => { esperarHasta = 0; };
  async function firmar(sb, paths) {
    const faltan = [...new Set(paths)].filter((p) => p && !vigente(p) && !rotas.has(p));
    if (faltan.length) {
      if (Date.now() < esperarHasta) throw new Error('esperando para reintentar firmas');
      let res;
      try { res = await sb.storage.from(BUCKET).createSignedUrls(faltan, VIDA_S); }
      catch (e) { esperarHasta = Date.now() + BACKOFF_MS; throw e; }
      if (res.error) { esperarHasta = Date.now() + BACKOFF_MS; throw res.error; }
      const ahora = Date.now();
      for (const d of res.data || []) {
        if (d.signedUrl && !d.error) cache.set(d.path, { url: d.signedUrl, vence: ahora + VIDA_S * 1000 });
        else if (d.path) rotas.add(d.path);
      }
    }
    return new Map(paths.filter((p) => firmada(p)).map((p) => [p, firmada(p)]));
  }
  const firmada = (p) => { const c = cache.get(p); return c && c.vence > Date.now() ? c.url : null; };
  const rutaMini = (p) => p.replace(/\.webp$/, '.t.webp');

  /** Recorta un cuadrado de lado×lado. x, y = centro del recorte en px de la imagen; zoom ≥ 1 sobre el lado corto. */
  async function recortarCuadrado(bm, { x, y, zoom }, lado = 400, calidad = 0.85) {
    const corte = Math.min(bm.width, bm.height) / Math.max(1, zoom);
    const sx = Math.min(Math.max(0, x - corte / 2), bm.width - corte), sy = Math.min(Math.max(0, y - corte / 2), bm.height - corte);
    const c = document.createElement('canvas'); c.width = lado; c.height = lado;
    c.getContext('2d').drawImage(bm, sx, sy, corte, corte, 0, 0, lado, lado);
    return aBlob(c, calidad);
  }

  /** Grabadora de audio (webm/opus). iniciar() rechaza con Error('sin-permiso') si no hay micrófono. */
  function grabadora() {
    let rec = null, stream = null, partes = [], t0 = 0;
    const tipo = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4'].find((t) => window.MediaRecorder?.isTypeSupported?.(t)) || '';
    const soltar = () => { stream?.getTracks().forEach((t) => t.stop()); stream = null; };
    return {
      async iniciar() {
        if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) throw new Error('sin-soporte');
        try { stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } }); }
        catch (e) { throw new Error(e?.name === 'NotAllowedError' || e?.name === 'SecurityError' ? 'sin-permiso' : 'sin-mic'); }
        partes = [];
        try { rec = new MediaRecorder(stream, tipo ? { mimeType: tipo, audioBitsPerSecond: 32000 } : undefined); }
        catch (e) { soltar(); throw new Error('sin-soporte'); }
        rec.ondataavailable = (e) => { if (e.data.size) partes.push(e.data); };
        rec.start(250); t0 = performance.now();
      },
      ms: () => (rec && rec.state === 'recording' ? performance.now() - t0 : 0),
      detener() {
        return new Promise((res) => {
          if (!rec || rec.state === 'inactive') { soltar(); return res(null); }
          const ms = performance.now() - t0;
          rec.onstop = () => { soltar(); res({ blob: new Blob(partes, { type: (rec.mimeType || 'audio/webm').split(';')[0] }), ms }); };
          rec.stop();
        });
      },
      cancelar() { if (rec && rec.state !== 'inactive') { rec.onstop = null; rec.stop(); } soltar(); partes = []; },
    };
  }

  window.ChatMedios = { BUCKET, comprimirImagen, firmar, firmada, vigente, puedeFirmar, reintentarYa, rutaMini, recortarCuadrado, grabadora };
})();
