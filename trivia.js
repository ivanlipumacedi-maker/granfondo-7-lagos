// Pestaña Trivia: la misma de CEDI CLUB (banco, 10 preguntas 4/4/2, 15 s, 1000→500 puntos por rapidez, 8 s de
// revelación, sin repetir preguntas ya vistas) pero de a dos y sin servidor de juego: el estado vive en el doc
// compartido trivia/partida (ver trivia-duo.js) y cada teléfono mide su propio tiempo desde que ABRE la pregunta.
// Los pasos automáticos (revelar, pasar) los da el teléfono de quien armó la partida; el otro, 5 s después si el
// primero no lo hizo. Todo cambio va con condición (mergeSi), así un pedido atrasado no rompe nada.
// Lo arranca build.js con iniciarTrivia({ db, yo, nombres }). Necesita TriviaLogica, TriviaPreguntas y TriviaDuo.
(function () {
  const CSS = `
#trivia { --ok: #1f7a4c; display: flex; flex-direction: column; gap: 14px }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) #trivia { --ok: #5cc98b } }
:root[data-theme="dark"] #trivia { --ok: #5cc98b }
#trivia .cuerpo { display: flex; flex-direction: column; gap: 14px }
#trivia .sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap }
#trivia .como { margin: -6px 0 0; color: var(--muted); font-size: .88rem }
#trivia .marcador { display: flex; gap: 14px; flex-wrap: wrap; align-items: baseline; font-weight: 800 }
#trivia .marcador .A { color: var(--a) } #trivia .marcador .B { color: var(--b) } #trivia .marcador small { color: var(--muted); font-weight: 600 }
#trivia .caja { background: var(--surface); border: 1px solid var(--line); border-radius: 16px; padding: 16px; display: flex; flex-direction: column; gap: 12px }
#trivia .caja p { margin: 0 }
#trivia .btn-t { font: inherit; font-weight: 800; font-size: 1rem; border: 0; border-radius: 14px; padding: 14px; background: var(--accent); color: #fff; width: 100% }
#trivia .btn-t:disabled { opacity: .5 }
#trivia .link-t { font: inherit; font-size: .88rem; border: 0; background: none; color: var(--muted); text-decoration: underline; align-self: center; padding: 10px; min-height: 44px }
#trivia .link-t.armado { color: var(--danger, #c0392b); font-weight: 800 }
#trivia .cab { scroll-margin-top: 10px; display: flex; justify-content: space-between; align-items: baseline; font-weight: 800 }
#trivia .reloj { font-variant-numeric: tabular-nums; color: var(--accent) }
#trivia .barra { height: 6px; border-radius: 99px; background: var(--line); overflow: hidden }
#trivia .barra span { display: block; height: 100%; background: var(--accent); transition: width .25s linear }
#trivia .barra.rev span { background: var(--muted) }
#trivia .carta { background: var(--ink); color: var(--bg); border-radius: 22px; padding: 18px 18px 22px }
#trivia .carta .meta { display: flex; justify-content: space-between; font-size: .8rem; font-weight: 700; opacity: .85; text-transform: uppercase; letter-spacing: .04em }
#trivia .carta .q { font-family: 'Bricolage Grotesque', 'Overpass', sans-serif; font-weight: 700; font-size: clamp(1.2rem, 5.4vw, 1.5rem); line-height: 1.2; margin: 10px 0 0; text-wrap: balance; overflow-wrap: anywhere }
#trivia .ops { display: flex; flex-direction: column; gap: 8px }
#trivia .op { font: inherit; text-align: left; display: flex; gap: 12px; align-items: center; border: 0; border-radius: 14px; padding: 10px 14px; min-height: 50px; background: var(--surface); color: var(--ink); box-shadow: inset 0 0 0 1.5px var(--line) }
#trivia .op .l { flex: none; width: 28px; height: 28px; border-radius: 50%; display: grid; place-items: center; font-weight: 800; font-size: .85rem; background: var(--bg); box-shadow: inset 0 0 0 1px var(--line) }
#trivia .op .t { flex: 1; min-width: 0; overflow-wrap: anywhere }
#trivia .op .quien { display: flex; gap: 4px; flex: none }
#trivia .op .quien b { font-size: .72rem; padding: 2px 7px; border-radius: 99px; color: #fff }
#trivia .op .quien b.A { background: var(--a) } #trivia .op .quien b.B { background: var(--b) }
#trivia .op.elegida { box-shadow: inset 0 0 0 2.5px var(--accent) }
#trivia .op.bien { background: #1f7a4c; color: #fff; box-shadow: none } #trivia .op.bien .l { background: rgba(255,255,255,.25); box-shadow: none }
#trivia .op.mal { background: #b03a2e; color: #fff; box-shadow: none } #trivia .op.mal .l { background: rgba(255,255,255,.25); box-shadow: none }
#trivia .op.apagada { opacity: .55 }
#trivia .op:disabled { cursor: default }
#trivia .estado { color: var(--muted); font-size: .92rem; text-align: center; margin: 0 }
#trivia .res { font-weight: 800; font-size: 1.1rem; text-align: center; margin: 0 }
#trivia .res.bien { color: var(--ok) } #trivia .res.mal { color: var(--danger, #c0392b) }
#trivia .tabla { display: flex; flex-direction: column; gap: 6px }
#trivia .tabla div { display: flex; justify-content: space-between; align-items: baseline; padding: 8px 12px; border-radius: 12px; background: var(--surface); font-weight: 700 }
#trivia .tabla div.A { box-shadow: inset 4px 0 0 var(--a) } #trivia .tabla div.B { box-shadow: inset 4px 0 0 var(--b) }
#trivia .tabla small { color: var(--ok); font-weight: 800; margin-left: 6px }
#trivia .grande { font-family: 'Bricolage Grotesque', 'Overpass', sans-serif; font-size: 1.8rem; font-weight: 800; text-align: center; margin: 4px 0 }
#tabs [data-t="trivia"].llama::after { content: ''; display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: var(--danger, #c0392b); margin-left: 6px; vertical-align: middle }`;
  const LETRAS = ['A', 'B', 'C', 'D'];
  const CATS = { general: 'Cultura general', deportes: 'Deportes', argentina: 'Argentina', tecnologia: 'Tecnología', 'cine-musica': 'Cine, series y música', comida: 'Comida y asado', geografia: 'Geografía', historia: 'Historia' };
  const DIFS = { 1: 'Fácil', 2: 'Media', 3: 'Difícil' };
  const RESPALDO_MS = 5000; // el teléfono que no armó la partida avanza solo si el otro no lo hizo en este margen

  window.iniciarTrivia = function ({ db, yo, nombres }) {
    const L = window.TriviaLogica, D = window.TriviaDuo, $ = (id) => document.getElementById(id);
    const raiz = $('trivia'); if (!raiz || !db || !L || !D || !window.TriviaPreguntas) return;
    const banco = window.TriviaPreguntas, porId = new Map(banco.map((q) => [q.id, q]));
    const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    raiz.innerHTML = '<div class="cuerpo"></div><p class="sr" aria-live="polite"></p>';
    const cuerpo = raiz.querySelector('.cuerpo'), vivo = raiz.querySelector('.sr'), tab = document.querySelector('#tabs [data-t="trivia"]');
    const ref = db.doc('trivia/partida');
    let p = null, vistas = {}, historial = [], cargado = false, ocupado = false, ultimoHtml = '', ultimaVista = null, armadoHasta = 0;
    let tic = null, tAuto = null, claveAuto = null, anunciado = null;
    const registrados = new Set();
    // cuándo abrió este teléfono cada pregunta / revelación y cuándo se enteró de que la abrió el otro (Date.now()).
    // Guardadas en el teléfono: recargar (o que Android cierre la pestaña) no le regala otros 15 s a nadie.
    let marcas = (() => { try { return JSON.parse(localStorage.getItem('trivia-marcas') || '{}'); } catch { return {}; } })();
    const guardarMarcas = () => {
      if (p) marcas = Object.fromEntries(Object.entries(marcas).filter(([k]) => k.startsWith(p.id + ':'))); // solo la partida actual
      try { localStorage.setItem('trivia-marcas', JSON.stringify(marcas)); } catch {}
    };
    let enviando = false, ultimoVisto = 0, avisadoVencido = null;
    const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const otro = () => (yo() === 'A' ? 'B' : 'A');
    const pts = (n) => Number(n || 0).toLocaleString('es-AR');
    const clave = () => p && p.id + ':' + p.ronda + ':' + p.fase;
    const juego = () => !!p && D.jugadores(p).includes(yo());
    const visible = () => !document.hidden && !!raiz.offsetParent;
    const pregunta = () => porId.get(p.ids[p.ronda - 1]) || { p: 'Pregunta no encontrada', ops: ['—', '—', '—', '—'], ok: 0, cat: '', dif: 0 };
    const inicio = () => marcas[clave() + ':yo'] || null;
    function abrir() { // la pregunta (o la revelación) empieza a contar para mí cuando la veo
      const k = clave() + ':yo';
      if (marcas[k] || !(p.fase === 'revelada' || visible())) return;
      marcas[k] = Date.now(); guardarMarcas();
      mandarVisto();
    }
    function mandarVisto() { // "ya la abrí": el otro teléfono lo usa para saber cuándo vence; se reintenta si falla
      const v = juego() && D.marcarVisto(p, yo());
      if (v) { ultimoVisto = Date.now(); ref.mergeSi(v.patch, v.si).catch(() => {}); }
    }
    const desde = () => (inicio() ? Date.now() - inicio() : 0);
    const limite = () => (p.fase === 'pregunta' ? L.PREGUNTA_MS : L.REVELADA_MS);
    const restante = () => Math.max(0, limite() - desde());

    async function guardar(fn) {
      if (ocupado) return; ocupado = true; pintar();
      try { await fn(); } catch (e) { console.error(e); window.aviso?.('No se pudo guardar. Probá de nuevo.'); }
      ocupado = false; pintar();
    }
    const cambiar = (c) => (c ? ref.mergeSi(c.patch, c.si) : Promise.resolve(null));

    // ---------- acciones ----------
    // Con condición: si mientras tanto el otro armó una partida, no se la pisa.
    const nuevaPartida = () => guardar(async () => {
      if (!(await ref.reemplazarSi(D.nueva(Date.now().toString(36), yo()), p ? { id: p.id } : null))) window.aviso?.('Mientras tanto se armó otra partida: fijate abajo.');
    });
    const sumarme = () => guardar(async () => { if (!(await cambiar(D.sumarse(p, yo())))) window.aviso?.('Esa partida ya arrancó o la cancelaron.'); });
    const terminarla = () => guardar(async () => { if (!(await cambiar(D.terminar(p, yo())))) window.aviso?.('La partida ya había cambiado: fijate cómo quedó.'); });
    function arrancar() {
      const ids = L.elegirSinRepetir(banco, L.PREGUNTAS_POR_PARTIDA, vistas, (Math.random() * 2 ** 32) >>> 0).map((q) => q.id);
      return guardar(async () => {
        if (await cambiar(D.arrancar(p, yo(), ids))) await db.doc('trivia/vistas').set(D.vistasNuevas(vistas, ids, Date.now()));
      });
    }
    async function responder(op) {
      const c = D.responder(p, yo(), p.ronda, op, desde(), pregunta());
      if (!c) return;
      const optimista = { ...p, ...c.patch }; p = optimista; enviando = true; pintar();   // se ve al toque; el servidor confirma
      let r = null, fallo = false;
      try { r = await ref.mergeSi(c.patch, c.si); } catch (e) { console.error(e); fallo = true; }
      enviando = false;
      if (r) { programar(); return; }
      // No quedó confirmada. Si la pantalla sigue mostrando MI versión optimista, la saco para poder reintentar; si lo
      // que se ve ya vino del servidor (por ejemplo, el corte fue después de guardarla), se respeta.
      if (p === optimista) { const sin = { ...p }; delete sin['r' + yo() + '_' + optimista.ronda]; p = sin; pintar(); }
      programar();
      if (!D.respuesta(p, yo(), optimista.ronda)) window.aviso?.(fallo ? 'No se pudo mandar tu respuesta. Probá de nuevo.' : 'Se terminó el tiempo: esta no suma.');
    }
    // Revelar / pasar. Con condición: si el otro ya lo hizo (o la partida cambió) no hace nada.
    function avanzar(k) {
      if (!p || clave() !== k) return;
      const c = p.fase === 'pregunta' ? D.revelar(p) : p.fase === 'revelada' ? D.siguiente(p) : null;
      // sin señal: se reintenta a los 2 s (si no, la pregunta vencida quedaba trabada sin botón para seguir)
      if (c) cambiar(c).catch(() => { if (clave() === k) { claveAuto = null; setTimeout(programar, 2000); } });
    }

    // ---------- tiempo ----------
    function programar() {
      if (document.hidden) return;
      const k = p && p.estado === 'jugando' && juego() && (p.fase === 'pregunta' || p.fase === 'revelada') && inicio() ? clave() : null;
      const solo = k && D.jugadores(p).length === 1;
      const todos = !!k && !enviando && p.fase === 'pregunta' && D.todosRespondieron(p); // con la mía ya confirmada
      const otroVio = !!k && p.fase === 'pregunta' && (solo || D.vio(p, otro(), p.ronda));
      const kAuto = k && k + (todos ? ':todos' : '') + (otroVio ? ':vio' : '');
      if (kAuto === claveAuto) return;
      clearTimeout(tAuto); claveAuto = kAuto; if (!k) return;
      const extra = p.creador === yo() || !D.jugadores(p).includes(p.creador) ? 0 : RESPALDO_MS;
      let vence;
      if (todos) vence = Date.now() + 600;
      else if (p.fase === 'revelada') vence = inicio() + L.REVELADA_MS;
      else {
        const ko = clave() + ':otro';
        if (otroVio && !marcas[ko]) { marcas[ko] = solo ? inicio() : Date.now(); guardarMarcas(); }
        vence = D.plazo(inicio(), otroVio ? marcas[ko] : null, D.ausente(p, otro()));
      }
      tAuto = setTimeout(() => avanzar(k), Math.max(0, vence - Date.now()) + extra);
    }
    function reloj() {
      if (!p || p.estado !== 'jugando') return;
      if (!inicio()) { abrir(); if (inicio()) { pintar(); programar(); } return; }
      if (p.fase === 'pregunta' && juego() && !D.vio(p, yo(), p.ronda) && Date.now() - ultimoVisto > 3000) mandarVisto();
      const r = cuerpo.querySelector('.reloj'), b = cuerpo.querySelector('.barra span');
      if (!r) return;
      const ms = restante();
      r.textContent = p.fase === 'pregunta' ? Math.ceil(ms / 1000) + ' s' : (ms > 0 ? 'Sigue en ' + Math.ceil(ms / 1000) + ' s' : 'Pasando…');
      if (b) b.style.width = (ms / limite()) * 100 + '%';
      if (p.fase === 'pregunta' && ms <= 0) {
        if (cuerpo.querySelector('.op:not([disabled])')) pintar();
        if (avisadoVencido !== clave() && juego() && !D.respuesta(p, yo(), p.ronda)) { avisadoVencido = clave(); vivo.textContent = 'Se terminó el tiempo.'; }
      }
    }
    document.addEventListener('visibilitychange', () => {
      // en segundo plano los timers se congelan y al volver saldrían con datos viejos: se cancelan y se
      // reprograman con la lectura que hace la app al volver
      if (document.hidden) { clearTimeout(tAuto); claveAuto = null; }
      // al volver: se reprograma con la lectura nueva; si esa lectura no llega (sin señal), igual a los 1,5 s (los
      // pedidos van con condición, así que uno viejo no rompe nada)
      else setTimeout(() => { claveAuto = null; programar(); }, 1500);
    });

    // ---------- vistas ----------
    function marcadorHtml() {
      if (!historial.some((h) => !h.solo)) return '';
      const n = nombres(), m = D.marcador(historial);
      return `<div class="marcador" aria-label="Partidas ganadas en el viaje"><span class="A">${esc(n.A)} ${m.A}</span><span class="B">${esc(n.B)} ${m.B}</span>${m.empates ? `<small>${m.empates} empate${m.empates > 1 ? 's' : ''}</small>` : ''}<small>· partidas ganadas en el viaje</small></div>`;
    }
    const comoHtml = () => `<p class="como">Jugás como <b>${esc(nombres()[yo()])}</b>.</p>`;
    function tablaHtml(conRonda) {
      const n = nombres(), t = D.totales(p);
      return '<div class="tabla">' + D.jugadores(p).sort((a, b) => (t[b] - t[a])).map((k) => {
        const r = conRonda ? D.respuesta(p, k, p.ronda) : null;
        return `<div class="${k}"><span>${esc(n[k])}${k === yo() ? ' (vos)' : ''}${r && r.pts ? `<small>+${pts(r.pts)}</small>` : ''}</span><span>${pts(t[k])}</span></div>`;
      }).join('') + '</div>';
    }
    const botonTerminar = (txt) => Date.now() < armadoHasta
      ? `<button type="button" class="link-t armado" data-t="terminar">¿Seguro? Tocá de nuevo para ${p.estado === 'espera' ? 'cancelarla' : 'terminarla'}</button>`
      : `<button type="button" class="link-t" data-t="terminar">${txt}</button>`;
    function vistaInicio() {
      const n = nombres();
      let html = '';
      if (p && p.estado === 'final') html += `<div class="caja"><p class="grande">${esc(D.resultado(p, yo(), n))}</p>${tablaHtml(false)}</div>`;
      else if (p && p.estado === 'cancelada' && p.terminoPor && p.terminoPor !== yo()) html += `<p class="estado">${esc(n[p.terminoPor])} terminó la partida.</p>`;
      return html + `<div class="caja"><p>10 preguntas de cultura general, deportes, Argentina, cine, comida, geografía e historia. Cada uno responde en su teléfono: tienen 15 segundos y cuanto más rápido, más puntos. Las preguntas no se repiten hasta que se terminen las ${banco.length}.</p>
        <button type="button" class="btn-t" data-t="nueva">${p && p.estado === 'final' ? 'Otra partida' : 'Nueva partida'}</button></div>`;
    }
    function vistaEspera() {
      const n = nombres(), yoEstoy = !!p['j' + yo()], elOtro = !!p['j' + otro()], armo = p.creador === yo();
      if (!yoEstoy) return `<div class="caja"><p><b>${esc(n[p.creador])}</b> armó una partida de Trivia.</p>
        <button type="button" class="btn-t" data-t="sumarme">Sumarme</button></div>`;
      if (!armo) return `<div class="caja"><p>Estás anotado. Esperando que <b>${esc(n[p.creador])}</b> la arranque.</p>${botonTerminar('Cancelar la partida')}</div>`;
      return `<div class="caja"><p>${elOtro ? `Ya están los dos. Cuando quieran, arrancá.` : `Esperando a <b>${esc(n[otro()])}</b>: avisale que entre a la pestaña Trivia y toque Sumarme.`}</p>
        <button type="button" class="btn-t" data-t="arrancar">${elOtro ? 'Arrancar' : 'Jugar solo'}</button>${botonTerminar('Cancelar la partida')}</div>`;
    }
    function vistaPregunta() {
      const n = nombres(), q = pregunta(), rev = p.fase === 'revelada', mia = D.respuesta(p, yo(), p.ronda);
      const vencido = !rev && inicio() && restante() <= 0;
      const ops = q.ops.map((txt, i) => {
        let c = 'op';
        if (rev) c += i === q.ok ? ' bien' : (mia && mia.op === i ? ' mal' : ' apagada');
        else if (mia && mia.op === i) c += ' elegida';
        const quien = rev ? D.jugadores(p).filter((k) => D.respuesta(p, k, p.ronda)?.op === i).map((k) => `<b class="${k}">${esc(n[k])}</b>`).join('') : '';
        return `<button type="button" class="${c}" data-op="${i}" ${rev || mia || vencido || !juego() || !inicio() ? 'disabled' : ''} aria-pressed="${!!(mia && mia.op === i)}"><span class="l">${LETRAS[i]}</span><span class="t">${esc(txt)}</span>${quien ? `<span class="quien">${quien}</span>` : ''}</button>`;
      }).join('');
      let pie;
      if (!juego()) pie = `<p class="estado">${esc(n[D.jugadores(p)[0]])} está jugando solo. Cuando termine pueden armar una de a dos.</p>`;
      else if (!rev) {
        const faltan = D.jugadores(p).filter((k) => !D.respuesta(p, k, p.ronda));
        const otroNoAbrio = D.jugadores(p).length > 1 && !D.vio(p, otro(), p.ronda);
        pie = `<p class="estado">${mia ? (faltan.length ? (otroNoAbrio ? (D.ausente(p, otro()) ? `Respondiste. ${esc(n[otro()])} parece que no está: si no vuelve, pueden terminarla.` : `Respondiste. ${esc(n[otro()])} todavía no abrió la pregunta…`) : `Respondiste. Esperando a ${esc(n[faltan[0]])}…`) : 'Respondieron los dos.') : vencido ? 'Se terminó el tiempo.' : 'Elegí una opción.'}</p>`;
      } else {
        const bien = mia && mia.op === q.ok;
        pie = `<p class="res ${bien ? 'bien' : 'mal'}">${!mia ? 'No respondiste: esta no suma.' : bien ? `¡Bien! +${pts(mia.pts)} puntos` : `Esta vez no. La correcta era la ${LETRAS[q.ok]}.`}</p>`
          + (p.creador === yo() || !D.jugadores(p).includes(p.creador) ? `<button type="button" class="btn-t" data-t="siguiente">${p.ronda < p.ids.length ? 'Siguiente pregunta' : 'Ver cómo terminó'}</button>` : '')
          + tablaHtml(true);
      }
      return `<div class="cab"><span>Pregunta ${p.ronda} de ${p.ids.length}</span><span class="reloj" aria-hidden="true"></span></div>
        <div class="barra${rev ? ' rev' : ''}" aria-hidden="true"><span></span></div>
        <div class="carta"><div class="meta"><span>${esc(CATS[q.cat] || q.cat)}</span><span>${esc(DIFS[q.dif] || '')}</span></div><p class="q">${esc(q.p)}</p></div>
        <div class="ops" role="group" aria-label="Opciones">${ops}</div>${pie}${juego() ? botonTerminar('Terminar la partida') : ''}`;
    }

    function anunciar() { // lector de pantalla: una vez por pregunta y por revelación (la región no se repinta)
      if (!p || p.estado !== 'jugando' || anunciado === clave()) return;
      anunciado = clave();
      const q = pregunta(), mia = D.respuesta(p, yo(), p.ronda);
      vivo.textContent = p.fase === 'pregunta' ? `Pregunta ${p.ronda} de ${p.ids.length}, 15 segundos: ${q.p}`
        : (!mia ? 'No respondiste.' : mia.op === q.ok ? `Bien, más ${mia.pts} puntos.` : `No. La correcta era: ${q.ops[q.ok]}.`);
    }

    function pintar() {
      if (!cargado) return;
      if (p && p.estado === 'jugando') abrir();
      let html;
      if (!p || p.estado === 'final' || p.estado === 'cancelada') html = vistaInicio();
      else if (p.estado === 'espera') html = vistaEspera();
      else html = vistaPregunta();
      const enJuego = p && (p.estado === 'espera' || p.estado === 'jugando');
      html = marcadorHtml() + (enJuego && D.jugadores(p).includes(yo()) ? comoHtml() : '') + html + (ocupado ? '<!--ocupado-->' : '');
      // solo si cambió algo: repintar debajo del dedo se come el toque (y le saca el foco al lector de pantalla)
      if (html !== ultimoHtml) {
        ultimoHtml = html; cuerpo.innerHTML = html;
        if (ocupado) cuerpo.querySelectorAll('[data-t]').forEach((b) => { b.disabled = true; });
        // pregunta nueva: que se vean la pregunta y las 4 opciones sin tener que bajar (15 s no dan para scrollear)
        const cab = cuerpo.querySelector('.cab');
        if (cab && p.fase === 'pregunta' && clave() !== ultimaVista && visible()) { ultimaVista = clave(); cab.scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); }
      }
      anunciar();
      // puntito en la pestaña: te están esperando o hay una partida tuya andando
      if (tab) tab.classList.toggle('llama', !!p && ((p.estado === 'espera' && !p['j' + yo()]) || (p.estado === 'jugando' && juego())));
      reloj();
      const jugando = p && p.estado === 'jugando';
      if (jugando && !tic) tic = setInterval(reloj, 250); else if (!jugando) { clearInterval(tic); tic = null; }
    }

    cuerpo.addEventListener('click', (e) => {
      const op = e.target.closest('[data-op]'); if (op && !op.disabled) return responder(Number(op.dataset.op));
      const b = e.target.closest('[data-t]'); if (!b || b.disabled) return;
      const t = b.dataset.t;
      if (t === 'nueva') nuevaPartida();
      else if (t === 'sumarme') sumarme();
      else if (t === 'arrancar') arrancar();
      else if (t === 'siguiente') avanzar(clave());
      else if (t === 'terminar') {
        if (Date.now() < armadoHasta) { armadoHasta = 0; return terminarla(); }
        armadoHasta = Date.now() + 3000; pintar(); setTimeout(pintar, 3050);
      }
    });

    db.collection('trivia').onSnapshot((q) => {
      const docs = new Map(q.docs.map((d) => [d.id, d.data()]));
      const nueva = docs.get('partida') || null;
      // la misma partida nunca vuelve para atrás (una lectura vieja)
      if (!(p && nueva && nueva.id === p.id && D.paso(nueva) < D.paso(p))) p = nueva;
      vistas = docs.get('vistas') || {};
      historial = [...docs].filter(([id]) => id.startsWith('h-')).map(([, d]) => d);
      cargado = true;
      // al terminar de a dos, la deja en el historial (id fijo: si la anotan los dos queda una sola). Un intento por
      // partida: si falla no se reintenta en cada lectura.
      if (p && !docs.has('h-' + p.id) && !registrados.has(p.id)) {
        const r = D.registro(p, Date.now());
        if (r) { registrados.add(p.id); db.doc('trivia/' + r.id).set(r.data).catch((e) => console.error(e)); }
      }
      pintar();
      programar();
    });
    db.doc('config/main').onSnapshot(() => pintar()); // nombres
    window.alCambiarSoyTrivia = () => {
      claveAuto = null; ultimoHtml = ''; pintar(); if (p) programar();
      if (p && p.estado === 'jugando') window.aviso?.(`Ahora jugás la Trivia como ${nombres()[yo()]}.`);
    };
  };
})();
