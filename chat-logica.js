// Lógica pura del chat de Rumbo al Sur (sin DOM). En el navegador queda en window.ChatLogica.
(function (g) {
  const REACCIONES = ['❤️', '😂', '😮', '😢', '👍', '🔥'];
  const MAX_TEXTO = 2000;

  const textoValido = (s) => { const t = String(s ?? '').trim(); return t.length >= 1 && t.length <= MAX_TEXTO; };

  function resumen(m) {
    if (m.tipo === 'foto') return '📷 Foto';
    if (m.tipo === 'audio') return '🎤 Audio';
    if (m.tipo === 'sticker') return 'Sticker';
    const t = String(m.texto ?? '').trim();
    return t.length > 80 ? t.slice(0, 79) + '…' : t;
  }

  const porFecha = (a, b) => Date.parse(a.creado) - Date.parse(b.creado);
  const fusionar = (lista, m) => [...lista.filter((x) => x.id !== m.id), m].sort(porFecha);
  const quitar = (lista, id) => lista.filter((x) => x.id !== id);
  const noLeidos = (lista, yo, vistoHasta) => lista.filter((m) => m.autor !== yo && Date.parse(m.creado) > vistoHasta).length;

  function alternarReaccion(reacciones, yo, emoji) {
    const r = { ...(reacciones || {}) };
    if (r[yo] === emoji) delete r[yo]; else r[yo] = emoji;
    return r;
  }

  const horaCorta = (iso) => new Date(iso).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: 'America/Argentina/Buenos_Aires' });

  const ultimoCreado = (lista) => lista.reduce((max, m) => Math.max(max, Date.parse(m.creado) || 0), 0);

  // recientes = la última página que devolvió el servidor (tam = tamaño de página). Lo que el servidor
  // ya no tiene en ese tramo (borrado mientras no escuchábamos) desaparece; lo más viejo cargado se conserva.
  function reconciliar(lista, recientes, tam) {
    if (recientes.length < tam) return [...recientes].sort(porFecha);
    const corte = Math.min(...recientes.map((m) => Date.parse(m.creado)));
    return [...lista.filter((m) => Date.parse(m.creado) < corte), ...recientes].sort(porFecha);
  }

  const L = { REACCIONES, MAX_TEXTO, textoValido, resumen, fusionar, quitar, noLeidos, alternarReaccion, horaCorta, ultimoCreado, reconciliar };
  if (typeof module !== 'undefined' && module.exports) module.exports = L; else g.ChatLogica = L;
})(this);
