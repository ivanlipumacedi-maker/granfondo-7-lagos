// Ranking del viaje: puntos por todo lo que hace cada uno en la app. Lógica pura (sin pantalla ni base): recibe lo
// que ya está guardado y devuelve los puntos de A y de B por rubro. Se calcula siempre de cero con los datos actuales,
// así deshacer algo (desmarcar una misión, borrar una parada) también le saca los puntos.
(function (g) {
  const QUIENES = ['A', 'B'];
  // Valores de cada cosa. "cada" = puntos por unidad.
  const REGLAS = [
    { id: 'mision', nombre: 'Misiones del día', cada: 50, como: 'misión del día cumplida' },
    { id: 'extraHecha', nombre: 'Misiones extra cumplidas', cada: 30, como: 'misión extra cumplida' },
    { id: 'extraPropuesta', nombre: 'Misiones extra propuestas', cada: 10, como: 'misión extra propuesta' },
    { id: 'triviaGanada', nombre: 'Trivia: partidas ganadas', cada: 100, como: 'partida de Trivia ganada (empate: 50 cada uno)' },
    { id: 'triviaJugada', nombre: 'Trivia: partidas jugadas', cada: 20, como: 'partida de Trivia terminada (también jugando solo)' },
    { id: 'bingo', nombre: 'Bingo de ruta', cada: 10, como: 'casilla del bingo que viste vos' },
    { id: 'foto', nombre: 'Fotos del álbum', cada: 5, como: 'foto subida al álbum' },
    { id: 'parada', nombre: 'Itinerario', cada: 15, como: 'parada cargada en la hoja de ruta' },
    { id: 'pregunta', nombre: 'Preguntas propias', cada: 10, como: 'pregunta propia agregada al mazo' },
    { id: 'valija', nombre: 'Qué llevamos', cada: 3, como: 'cosa de la valija que marcaste lista' },
    { id: 'gasto', nombre: 'Cuentas claras', cada: 5, como: 'gasto anotado' },
    { id: 'mensaje', nombre: 'Chat', cada: 1, como: 'mensaje en el chat' },
  ];
  const valido = (k) => k === 'A' || k === 'B';
  const vacio = () => ({ A: 0, B: 0 });
  const sumar = (c, k, n = 1) => { if (valido(k)) c[k] += n; };

  // d: { misiones: {dia: 'A'|'B'}, bingo: {casilla: 'A'|'B'}, extras: [{autor, hecha}], paradas: [{autor}],
  //      valija: [{listo, listoPor}], gastos: [{autor}], preguntas: [{autor}], trivia: [{pA, pB} | {solo: 'A'}],
  //      fotos: {A, B}, mensajes: {A, B} }
  // Devuelve { rubros: [{id, nombre, cada, A, B}] con A/B en puntos, total: {A, B} }.
  function calcular(d) {
    const c = Object.fromEntries(REGLAS.map((r) => [r.id, vacio()]));
    Object.values(d.misiones || {}).forEach((k) => sumar(c.mision, k));
    Object.entries(d.bingo || {}).forEach(([i, k]) => { if (+i !== 12) sumar(c.bingo, k); }); // la del medio es libre
    (d.extras || []).forEach((x) => { sumar(c.extraPropuesta, x.autor); sumar(c.extraHecha, x.hecha); });
    (d.paradas || []).forEach((x) => sumar(c.parada, x.autor));
    (d.valija || []).forEach((x) => { if (x.listo) sumar(c.valija, x.listoPor); });
    (d.gastos || []).forEach((x) => sumar(c.gasto, x.autor));
    (d.preguntas || []).forEach((x) => sumar(c.pregunta, x.autor));
    (d.trivia || []).forEach((h) => {
      if (h.solo) { sumar(c.triviaJugada, h.solo); return; }
      QUIENES.forEach((k) => sumar(c.triviaJugada, k));
      const a = Number(h.pA) || 0, b = Number(h.pB) || 0;
      // en "ganadas" se cuentan medios puntos de partida: empate = media para cada uno (50 pts)
      if (a > b) sumar(c.triviaGanada, 'A', 1); else if (b > a) sumar(c.triviaGanada, 'B', 1); else { sumar(c.triviaGanada, 'A', 0.5); sumar(c.triviaGanada, 'B', 0.5); }
    });
    QUIENES.forEach((k) => { sumar(c.foto, k, Math.max(0, Number(d.fotos?.[k]) || 0)); sumar(c.mensaje, k, Math.max(0, Number(d.mensajes?.[k]) || 0)); });
    const total = vacio();
    const rubros = REGLAS.map((r) => {
      const x = { id: r.id, nombre: r.nombre, cada: r.cada, cant: { ...c[r.id] }, A: Math.round(c[r.id].A * r.cada), B: Math.round(c[r.id].B * r.cada) };
      total.A += x.A; total.B += x.B;
      return x;
    });
    return { rubros, total };
  }

  function frase(total, nombres, yo) {
    const dif = total.A - total.B;
    if (!total.A && !total.B) return 'Todavía nadie sumó puntos. Cumplan la misión de hoy y arranca la carrera.';
    if (!dif) return `Van empatados con ${fmt(total.A)} puntos.`;
    const gana = dif > 0 ? 'A' : 'B', por = Math.abs(dif);
    return gana === yo ? `Vas ganando por ${fmt(por)} puntos.` : `${nombres[gana]} va ganando por ${fmt(por)} puntos.`;
  }
  const fmt = (n) => Math.round(n).toLocaleString('es-AR');

  // Bingo y misiones del día: cada casilla o día va en su propio campo del doc (b3, d7), así dos marcas casi a la vez
  // desde los dos teléfonos no se pisan (el servidor mezcla el primer nivel). null = desmarcada. "viejo" es el mapa
  // con que se guardaban antes (marcas / hechas), que se sigue leyendo debajo.
  function leerMapa(data, viejo, pre) {
    const m = { ...((data && data[viejo]) || {}) };
    Object.entries(data || {}).forEach(([k, v]) => {
      if (!k.startsWith(pre) || !/^\d+$/.test(k.slice(pre.length))) return;
      const i = k.slice(pre.length);
      if (v === 'A' || v === 'B') m[i] = v; else delete m[i];
    });
    return m;
  }

  const RankingLogica = { REGLAS, calcular, frase, fmt, leerMapa };
  if (typeof module !== 'undefined' && module.exports) module.exports = RankingLogica;
  else g.RankingLogica = RankingLogica;
})(typeof window !== 'undefined' ? window : globalThis);
