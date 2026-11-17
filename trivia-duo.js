// Trivia de a dos (Lipu y Guti), cada uno en su teléfono. Las reglas, el banco y los puntos son los de la Trivia de
// CEDI CLUB (trivia-logica.js y trivia-preguntas.js, copiados tal cual); acá está solo cómo se guarda la partida en el
// doc compartido trivia/partida.
// - Cada cambio sale como { patch, si }: el servidor lo aplica SOLO si la partida sigue como estaba cuando se pidió
//   (docs_merge_si). Así un pedido atrasado (un teléfono que vuelve de otra app) no saltea ni hace retroceder nada.
// - Cada respuesta va en su propio campo (rA_3, rB_3) y cada "ya abrí la pregunta" en vA_3 / vB_3: el servidor
//   mezcla solo el primer nivel, así ninguna escritura pisa a otra.
(function (g) {
  const T = () => g.TriviaLogica;
  const QUIENES = ['A', 'B'];
  const TOPE_SIN_EL_OTRO = 30000; // si el otro no abre la pregunta, se sigue igual a los 30 s

  function nueva(id, yo) {
    return { id, estado: 'espera', creador: yo, jA: yo === 'A', jB: yo === 'B', ids: [], ronda: 0, fase: 'espera' };
  }
  const jugadores = (p) => QUIENES.filter((k) => p && p['j' + k]);
  const respuesta = (p, k, ronda) => (p && p['r' + k + '_' + ronda]) || null;
  const vio = (p, k, ronda) => !!(p && p['v' + k + '_' + ronda]);
  const abierta = (p) => ({ id: p.id, ronda: p.ronda, fase: 'pregunta' });

  function responder(p, k, ronda, op, ms, pregunta) {
    const L = T();
    if (!p || p.estado !== 'jugando' || p.fase !== 'pregunta' || p.ronda !== ronda) return null;
    if (!p['j' + k] || respuesta(p, k, ronda)) return null;
    if (ms > L.PREGUNTA_MS + L.GRACIA_MS) return null;
    const pts = L.puntos(op === pregunta.ok, ms, L.PREGUNTA_MS);
    // el lugar de la respuesta se reserva vacío al abrir la ronda: solo se puede escribir una vez (si dos teléfonos
    // quedaron con el mismo "Soy", el segundo no pisa al primero)
    const campo = 'r' + k + '_' + ronda;
    return { patch: { [campo]: { op, ms: Math.round(ms), pts } }, si: { ...abierta(p), [campo]: null } };
  }
  function marcarVisto(p, k) {
    if (!p || p.estado !== 'jugando' || p.fase !== 'pregunta' || !p['j' + k] || vio(p, k, p.ronda)) return null;
    return { patch: { ['v' + k + '_' + p.ronda]: true }, si: abierta(p) };
  }

  function todosRespondieron(p) {
    const js = jugadores(p);
    return js.length > 0 && js.every((k) => respuesta(p, k, p.ronda));
  }

  const lugares = (ronda) => ({ ['rA_' + ronda]: null, ['rB_' + ronda]: null });
  const revelar = (p) => ({ patch: { fase: 'revelada' }, si: abierta(p) });
  function siguiente(p) {
    const patch = p.ronda < p.ids.length ? { ronda: p.ronda + 1, fase: 'pregunta', ...lugares(p.ronda + 1) } : { fase: 'final', estado: 'final' };
    return { patch, si: { id: p.id, ronda: p.ronda, fase: 'revelada' } };
  }
  // Arranca solo quien la armó: si arrancaban los dos a la vez quedaban preguntas distintas en cada teléfono.
  const arrancar = (p, k, ids) => (p.creador !== k ? null : { patch: { estado: 'jugando', ids, ronda: 1, fase: 'pregunta', ...lugares(1) }, si: { id: p.id, estado: 'espera' } });
  const sumarse = (p, k) => ({ patch: { ['j' + k]: true }, si: { id: p.id, estado: 'espera' } });
  // Terminarla solo puede alguien que está jugando (no quien mira).
  const terminar = (p, k) => (!p['j' + k] ? null : { patch: { estado: 'cancelada', fase: 'final', terminoPor: k }, si: { id: p.id, estado: p.estado } });

  // Cuándo vence la pregunta para el teléfono que avanza (todo en su reloj): 15 s + 1 de gracia desde que la abrió
  // el último de los dos. otroEn = cuándo se enteró de que el otro la abrió (null = todavía no). Si el otro no la
  // abre se espera hasta 30 s, salvo que tampoco haya abierto la anterior (se fue): ahí 15 s, como jugando solo.
  function plazo(yoEn, otroEn, otroAusente) {
    const L = T();
    if (otroEn == null) return yoEn + (otroAusente ? L.PREGUNTA_MS + L.GRACIA_MS : TOPE_SIN_EL_OTRO);
    return Math.max(yoEn, otroEn) + L.PREGUNTA_MS + L.GRACIA_MS;
  }

  const ausente = (p, k) => p.ronda > 1 && !vio(p, k, p.ronda - 1);

  function totales(p) {
    const t = {};
    jugadores(p).forEach((k) => {
      t[k] = Object.keys(p).filter((c) => c.startsWith('r' + k + '_')).reduce((s, c) => s + (Number(p[c] && p[c].pts) || 0), 0);
    });
    return t;
  }

  function resultado(p, yo, nombres) {
    const t = totales(p), js = jugadores(p);
    if (js.length === 1) return 'Hiciste ' + (t[js[0]] || 0).toLocaleString('es-AR') + ' puntos.';
    if (t.A === t.B) return '¡Empate!';
    const gana = t.A > t.B ? 'A' : 'B';
    return gana === yo ? '¡Ganaste!' : 'Ganó ' + nombres[gana] + '.';
  }

  // Fila del historial para el marcador del viaje (solo partidas de a dos que terminaron). Id fijo por partida:
  // escribirla dos veces no la cuenta dos veces.
  function registro(p, ahora) {
    if (p.estado !== 'final' || jugadores(p).length < 2) return null;
    const t = totales(p);
    return { id: 'h-' + p.id, data: { pA: t.A, pB: t.B, fin: ahora } };
  }

  function marcador(historial) {
    const m = { A: 0, B: 0, empates: 0 };
    historial.forEach((h) => { if (h.pA > h.pB) m.A++; else if (h.pB > h.pA) m.B++; else m.empates++; });
    return m;
  }

  // Orden de avance de una partida: espera < pregunta 1 < revelada 1 < pregunta 2 < … < terminada.
  function paso(p) {
    if (p.estado === 'espera') return 0;
    if (p.estado === 'final' || p.estado === 'cancelada') return 1e6;
    return (Number(p.ronda) || 0) * 2 + (p.fase === 'revelada' ? 1 : 0);
  }

  function vistasNuevas(vistas, ids, ahora) {
    const v = { ...(vistas || {}) };
    ids.forEach((id) => { v[id] = ahora; });
    return v;
  }

  const TriviaDuo = { nueva, jugadores, respuesta, vio, responder, marcarVisto, todosRespondieron, revelar, siguiente, arrancar, sumarse, terminar, plazo, ausente, totales, resultado, registro, marcador, paso, vistasNuevas };
  if (typeof module !== 'undefined' && module.exports) module.exports = TriviaDuo;
  else g.TriviaDuo = TriviaDuo;
})(typeof window !== 'undefined' ? window : globalThis);
