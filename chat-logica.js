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

  const L = { REACCIONES, MAX_TEXTO, textoValido, resumen, fusionar, quitar, noLeidos, alternarReaccion, horaCorta };
  if (typeof module !== 'undefined' && module.exports) module.exports = L; else g.ChatLogica = L;
})(this);
