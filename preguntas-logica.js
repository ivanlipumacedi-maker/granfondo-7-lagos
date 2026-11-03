// Lógica pura del juego "Preguntas de ruta" (sin DOM). En el navegador queda en window.PreguntasLogica.
(function (g) {
  /** quién pregunta y quién responde en la carta i (alterna); o los dos */
  const turno = (i, carta) => (carta?.ambos ? { ambos: true } : i % 2 === 0 ? { pregunta: 'A', responde: 'B' } : { pregunta: 'B', responde: 'A' });
  /** nivel de "para conocernos" (12 por nivel) */
  const nivel = (i) => Math.min(3, Math.floor(i / 12) + 1);
  /** índice siguiente: después de la última viene el cierre (= total); desde el cierre, vuelve a empezar */
  const siguiente = (i, total) => (total <= 0 ? 0 : i >= total ? 0 : i + 1);
  const picantesOk = (e) => !!(e?.picA && e?.picB);

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

  const Q = { turno, nivel, siguiente, picantesOk, orden, emojiPara };
  if (typeof module !== 'undefined') module.exports = Q; else g.PreguntasLogica = Q;
})(typeof window !== 'undefined' ? window : globalThis);
