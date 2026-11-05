// Lógica pura del juego "Preguntas de ruta" (sin DOM). En el navegador queda en window.PreguntasLogica.
(function (g) {
  /** quién pregunta y quién responde en la carta i (alterna); o los dos */
  const turno = (i, carta) => (carta?.ambos ? { ambos: true } : i % 2 === 0 ? { pregunta: 'A', responde: 'B' } : { pregunta: 'B', responde: 'A' });
  /** nivel de "para conocernos" (12 por nivel) */
  const nivel = (i) => Math.min(3, Math.floor(i / 12) + 1);
  /** índice siguiente: después de la última viene el cierre (= total); desde el cierre, vuelve a empezar */
  const siguiente = (i, total) => (total <= 0 ? 0 : i >= total ? 0 : i + 1);
  // candados: cada mazo con llave se abre solo si los dos prenden la suya ("nuestras" no tiene)
  const CANDADO = { conocer: ['conA', 'conB'], picantes: ['picA', 'picB'] };
  const abierto = (e, m) => { const c = CANDADO[m]; return !c || !!(e?.[c[0]] && e?.[c[1]]); };
  const campo = (m, yo) => CANDADO[m]?.[yo === 'A' ? 0 : 1];
  const picantesOk = (e) => abierto(e, 'picantes');
  /** mazo que se ve: el elegido si está abierto; si no, el primero abierto */
  const visible = (e) => { const m = e?.mazo || 'conocer'; return abierto(e, m) ? m : ['conocer', 'picantes', 'nuestras'].find((x) => abierto(e, x)); };

  /** orden mezclado y reproducible (los dos celus ven el mismo con la misma semilla) */
  function orden(n, semilla) {
    let s = semilla >>> 0;
    const azar = () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    const a = Array.from({ length: n }, (_, i) => i);
    for (let i = n - 1; i > 0; i--) { const j = Math.floor(azar() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }

  const CLAVES = [
    [/mate|cebar|ceba/i, '🧉'], [/canci|m[uú]sica|tema|cantar/i, '🎶'], [/auto|ruta|viaje|manej/i, '🚗'], [/lago|agua|nadar/i, '🌊'],
    [/monta|cerro|nieve/i, '🏔️'], [/comer|comida|cena|asado/i, '🍽️'], [/beso|besar/i, '💋'], [/amor|querer|quer[eé]s/i, '❤️'],
    [/bici|pedal|carrera|fondo/i, '🚴'], [/foto/i, '📸'], [/vino|cerveza|brindar/i, '🍷'], [/miedo/i, '😱'], [/so[nñ]a/i, '💭'],
  ];
  const VARIOS = ['✍️', '💭', '🌄', '🌟', '🧭', '🎈'];
  function emojiPara(texto) {
    for (const [re, e] of CLAVES) if (re.test(texto)) return e;
    let h = 0; for (const ch of String(texto)) h = (h * 31 + ch.codePointAt(0)) >>> 0;
    return VARIOS[h % VARIOS.length];
  }

  const par = (q) => ({ pregunta: q, responde: q === 'A' ? 'B' : 'A' });
  /** quién elige la gente para la carta i del mazo m (o null si todavía no eligieron esa) */
  const eleccion = (e, m, i) => (e?.elige && e.elige.m === m && e.elige.i === i && (e.elige.q === 'A' || e.elige.q === 'B') ? e.elige.q : null);
  /**
   * quién pregunta según el modo: 'turnos' (alterna), 'azar' (sorteado pero parejo: cada 4 cartas 2 y 2,
   * igual en los dos celus por la semilla) o 'elegir' (lo eligen ellos; sin elección → { elegir: true }).
   * Las cartas de "responden los dos" no cambian.
   */
  function turnoModo(modo, i, carta, { seed = 1, elige = null } = {}) {
    if (carta?.ambos) return { ambos: true };
    if (modo === 'azar') {
      const b = Math.floor(i / 4), mezcla = orden(4, (seed ^ Math.imul(b + 1, 0x9e3779b1)) >>> 0);
      return par(mezcla[i % 4] < 2 ? 'A' : 'B');
    }
    if (modo === 'elegir') return elige ? par(elige) : { elegir: true };
    return turno(i, carta);
  }

  const Q = { turnoModo, eleccion, turno, nivel, siguiente, picantesOk, abierto, campo, visible, orden, emojiPara };
  if (typeof module !== 'undefined') module.exports = Q; else g.PreguntasLogica = Q;
})(typeof window !== 'undefined' ? window : globalThis);
