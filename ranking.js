// Pestaña "Ranking": puntos de cada uno por todo lo que hace en la app (misiones, juegos, fotos, itinerario…).
// Lo arranca build.js con iniciarRanking({ db, sb, canal, yo, nombres }). Las cuentas están en ranking-logica.js.
(function () {
  const CSS = `
#ranking { display: flex; flex-direction: column; gap: 14px }
#ranking .podio { display: grid; grid-template-columns: 1fr 1fr; gap: 10px }
#ranking .lado { background: var(--surface); border-radius: 18px; padding: 14px 16px; display: flex; flex-direction: column; gap: 4px; box-shadow: inset 0 0 0 1px var(--line); min-width: 0 }
#ranking .lado.punta { box-shadow: inset 0 0 0 2px var(--k) }
#ranking .lado .q { font-weight: 800; color: var(--k); display: flex; gap: 6px; align-items: center; overflow-wrap: anywhere }
#ranking .lado .n { font-size: 2.1rem; font-weight: 800; line-height: 1.05; letter-spacing: -.02em; font-variant-numeric: tabular-nums }
#ranking .lado small { color: var(--muted) }
#ranking .lado.A { --k: var(--a) } #ranking .lado.B { --k: var(--b) }
#ranking .frase { font-weight: 800; font-size: 1.1rem; margin: 0 }
#ranking .barra { display: flex; height: 10px; border-radius: 999px; overflow: hidden; background: var(--line) }
#ranking .barra i { display: block; height: 100% } #ranking .barra .A { background: var(--a) } #ranking .barra .B { background: var(--b) }
#ranking table { width: 100%; border-collapse: collapse; font-size: .95rem }
#ranking th, #ranking td { padding: 8px 4px; border-bottom: 1px solid var(--line); text-align: right; font-variant-numeric: tabular-nums }
#ranking th:first-child, #ranking td:first-child { text-align: left }
#ranking thead th { font-size: .85rem; color: var(--muted); font-weight: 700 }
#ranking td .c { display: block; color: var(--muted); font-size: .78rem }
#ranking td.gana { font-weight: 800 }
#ranking details { background: var(--surface); border-radius: 16px; padding: 12px 16px }
#ranking summary { font-weight: 800; cursor: pointer; min-height: 32px; display: flex; align-items: center }
#ranking details ul { margin: 8px 0 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 6px }
#ranking details li { display: grid; grid-template-columns: 64px 1fr; gap: 8px; font-size: .92rem }
#ranking details li b { text-align: right; font-variant-numeric: tabular-nums }
`;
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  window.iniciarRanking = function ({ db, sb, canal, yo, nombres }) {
    const raiz = document.getElementById('ranking');
    if (!raiz || !window.RankingLogica) return;
    const R = window.RankingLogica;
    const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    const d = { misiones: {}, bingo: {}, extras: [], paradas: [], valija: [], gastos: [], preguntas: [], trivia: [], fotos: {}, mensajes: {} };
    let ultimo = '';

    function pintar() {
      const n = nombres(), k = yo(), r = R.calcular(d), t = r.total;
      const punta = t.A === t.B ? null : t.A > t.B ? 'A' : 'B';
      const suma = t.A + t.B;
      const lado = (q) => `<div class="lado ${q} ${punta === q ? 'punta' : ''}"><span class="q">${punta === q ? '🏆 ' : ''}${esc(n[q])}${q === k ? ' <small>(vos)</small>' : ''}</span><span class="n">${R.fmt(t[q])}</span><small>puntos</small></div>`;
      const filas = r.rubros.filter((x) => x.A || x.B).map((x) => {
        const cel = (q) => `<td class="${x[q] > x[q === 'A' ? 'B' : 'A'] ? 'gana' : ''}">${R.fmt(x[q])}<span class="c">${cant(x.cant[q])}</span></td>`;
        return `<tr><td>${esc(x.nombre)}</td>${cel('A')}${cel('B')}</tr>`;
      }).join('');
      const html = `<div class="podio">${lado('A')}${lado('B')}</div>`
        + (suma ? `<div class="barra" aria-hidden="true"><i class="A" style="width:${(t.A / suma) * 100}%"></i><i class="B" style="width:${(t.B / suma) * 100}%"></i></div>` : '')
        + `<p class="frase" aria-live="polite">${esc(R.frase(t, n, k))}</p>`
        + (filas ? `<table><thead><tr><th>Dónde sumó cada uno</th><th>${esc(n.A)}</th><th>${esc(n.B)}</th></tr></thead><tbody>${filas}</tbody></table>` : '')
        + `<details><summary>Cómo se suman los puntos</summary><ul>${R.REGLAS.map((x) => `<li><b>+${x.cada}</b><span>por cada ${esc(x.como)}</span></li>`).join('')}</ul>`
        + `<p class="hint">Suma quien lo hizo desde su teléfono (fijate que arriba diga tu nombre en "Soy"). Si se deshace, se descuenta. Lo que se cargó en el itinerario, la valija y los gastos antes de que existiera el ranking no tiene anotado quién fue, así que no suma.</p></details>`;
      if (html !== ultimo) { const abierto = raiz.querySelector('details')?.open; ultimo = html; raiz.innerHTML = html; if (abierto) raiz.querySelector('details').open = true; }
    }
    const cant = (c) => (c ? (Number.isInteger(c) ? c : String(c).replace('.', ',')) + '×' : '');

    const lista = (q) => q.docs.map((x) => x.data());
    db.doc('juego/misiones').onSnapshot((s) => { d.misiones = R.leerMapa(s.exists && s.data(), 'hechas', 'd'); pintar(); });
    db.doc('juego/bingo').onSnapshot((s) => { d.bingo = R.leerMapa(s.exists && s.data(), 'marcas', 'b'); pintar(); });
    ['extras', 'paradas', 'valija', 'gastos', 'preguntas'].forEach((col) => db.collection(col).onSnapshot((q) => { d[col] = lista(q); pintar(); }));
    db.collection('trivia').onSnapshot((q) => { d.trivia = q.docs.filter((x) => x.id.startsWith('h-')).map((x) => x.data()); pintar(); });

    // Fotos y mensajes viven en sus propias tablas: se cuentan al abrir la pestaña, al volver a la app y cuando el
    // otro sube algo (aviso por el canal). Sin polling.
    let tCuenta = 0;
    const ACCIONES_CHAT = ['nuevo', 'cambio'];
    async function contar() {
      try {
        const cuenta = (tabla, k, filtro) => { let q = sb.from(tabla).select('id', { count: 'exact', head: true }).eq('autor', k); if (filtro) q = filtro(q); return q; };
        const sinBorrados = (q) => q.neq('tipo', 'eliminado');
        const soloOriginales = (q) => q.is('editada_de', null); // guardar una edición crea otra foto: no suma de nuevo
        const rs = await Promise.all([cuenta('fotos', 'A', soloOriginales), cuenta('fotos', 'B', soloOriginales), cuenta('mensajes', 'A', sinBorrados), cuenta('mensajes', 'B', sinBorrados)]);
        if (rs.some((x) => x.error)) throw rs.find((x) => x.error).error;
        d.fotos = { A: rs[0].count || 0, B: rs[1].count || 0 }; d.mensajes = { A: rs[2].count || 0, B: rs[3].count || 0 };
        pintar();
      } catch (e) { console.error(e); } // sin señal: queda lo último que se contó
    }
    const contarLuego = () => { clearTimeout(tCuenta); tCuenta = setTimeout(contar, 1500); };
    if (canal) { canal.on('broadcast', { event: 'album' }, contarLuego); canal.on('broadcast', { event: 'chat' }, ({ payload }) => { if (ACCIONES_CHAT.includes(payload?.accion)) contarLuego(); }); } // con el chat, solo mensajes nuevos o cambiados (no "escribiendo…" ni leídos)
    document.addEventListener('visibilitychange', () => { if (!document.hidden) contarLuego(); });
    document.getElementById('tabs')?.addEventListener('click', (e) => { if (e.target.closest('[data-t="ranking"]')) contar(); });
    window.alCambiarSoyRanking = pintar;
    pintar(); contar();
  };
})();
