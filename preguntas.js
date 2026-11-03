// Juego "Preguntas de ruta": una carta a la vez, la misma en los dos celus. Las respuestas se charlan: no se guardan.
// Lo arranca build.js con iniciarPreguntas({ db, yo, nombres }). Necesita PreguntasCartas y PreguntasLogica.
(function () {
  const CSS = `
#preguntas { display: flex; flex-direction: column; gap: 14px }
#preguntas .mazos { display: flex; gap: 8px; overflow-x: auto; scrollbar-width: none; margin: 0 -16px; padding: 2px 16px }
#preguntas .mazos::-webkit-scrollbar { display: none }
#preguntas .mazo { flex: none; border: 0; font: inherit; font-weight: 800; font-size: .9rem; padding: 10px 14px; border-radius: 14px; background: var(--surface); color: var(--ink); box-shadow: inset 0 0 0 1px var(--line); display: flex; gap: 8px; align-items: center }
#preguntas .mazo[aria-pressed="true"] { background: var(--ink); color: var(--bg); box-shadow: none }
#preguntas .mazo .n { font-weight: 600; opacity: .7 }
#preguntas .pila { position: relative; height: 470px; margin-top: 4px }
#preguntas .atras, #pqCarta { position: absolute; inset: 0; border-radius: 28px }
#preguntas .atras { transform: translate(8px, 10px) rotate(2.5deg); background: var(--fondo2); opacity: .55 }
#preguntas .atras.dos { transform: translate(-6px, 16px) rotate(-3deg); opacity: .35 }
#pqCarta { background: var(--fondo); color: var(--tinta); padding: 22px 22px 20px; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 18px 40px -22px rgba(31,42,46,.55);
  transition: transform .35s cubic-bezier(.2,.8,.2,1), opacity .35s }
#pqCarta.sale { transform: translateX(-120%) rotate(-10deg); opacity: 0 }
#pqCarta.entra { transform: translateX(60%) rotate(6deg); opacity: 0; transition: none }
#pqCarta .turno { display: flex; align-items: center; gap: 6px; font-weight: 800; font-size: .9rem; flex-wrap: wrap }
#pqCarta .turno .p { padding: 4px 10px; border-radius: 999px; background: rgba(255,255,255,.8); color: #1f2a2e }
#pqCarta .turno .p.A { box-shadow: inset 0 0 0 2px #0f5e6e } #pqCarta .turno .p.B { box-shadow: inset 0 0 0 2px #b7862a }
#pqCarta .turno .f { opacity: .8; font-weight: 600 }
#pqCarta .dibujo { margin: 24px 0 6px; width: 132px; height: 132px; flex: none; border-radius: 42% 58% 55% 45% / 50% 44% 56% 50%; background: var(--blob);
  display: grid; place-items: center; font-size: 72px; line-height: 1; transform: rotate(-6deg); box-shadow: inset 0 -6px 0 rgba(0,0,0,.06) }
#pqCarta .dibujo span { transform: rotate(6deg) }
#pqCarta .pregunta { font-family: 'Bricolage Grotesque', 'Overpass', sans-serif; font-weight: 700; font-size: clamp(1.45rem, 6.8vw, 1.85rem); line-height: 1.12; letter-spacing: -.015em; margin: 12px 0 0; text-wrap: balance; overflow-wrap: anywhere }
#pqCarta .pie { margin-top: auto; display: flex; justify-content: space-between; gap: 10px; align-items: baseline; font-size: .82rem; font-weight: 600; opacity: .85 }
#preguntas .botones { display: grid; grid-template-columns: 1fr 2fr; gap: 10px; margin-top: 30px }
#preguntas .botones button { font: inherit; font-weight: 800; font-size: 1rem; border-radius: 16px; padding: 15px; border: 0 }
#pqPaso { background: var(--surface); color: var(--ink); box-shadow: inset 0 0 0 2px var(--line) }
#pqSig { background: var(--ink); color: var(--bg) }
#pqBloqueo { border-radius: 28px; background: #c2364a; color: #fff4f1; padding: 26px 22px; text-align: center }
#pqBloqueo[hidden] { display: none }
#pqBloqueo .e { font-size: 64px } #pqBloqueo b { display: block; font-family: 'Bricolage Grotesque', sans-serif; font-size: 1.4rem; margin: 8px 0 }
#preguntas .tog { display: flex; gap: 12px; align-items: center; background: var(--surface); border-radius: 16px; padding: 14px 16px; font-size: .88rem; color: var(--muted); cursor: pointer }
#preguntas .tog b { color: var(--ink); display: block; font-size: .95rem }
#preguntas .tog input { margin-left: auto; width: 24px; height: 24px; accent-color: #c2364a; flex: none }
#preguntas .nuevas { display: flex; flex-direction: column; gap: 8px }
#preguntas .nuevas[hidden] { display: none }
#preguntas .nuevas form { display: flex; gap: 8px }
#preguntas .nuevas input { flex: 1; min-width: 0; font: inherit; font-size: 16px; padding: 10px 12px; border-radius: 12px; border: 1px solid var(--line); background: var(--surface); color: var(--ink) }
#preguntas .nuevas button { font: inherit; font-weight: 800; border: 0; border-radius: 12px; padding: 0 16px; background: var(--accent); color: #fff }
#preguntas .nuevas ul { list-style: none; margin: 0; padding: 0 }
#preguntas .nuevas li { display: flex; gap: 10px; align-items: center; padding: 8px 0; border-bottom: 1px solid var(--line); font-size: .92rem }
#preguntas .nuevas li span:first-child { flex: none } #preguntas .nuevas li .t { flex: 1; min-width: 0; overflow-wrap: anywhere }
@media (prefers-reduced-motion: reduce) { #pqCarta { transition: none } }`;

  // paletas: cada mazo/nivel con su color
  const PAL = {
    n1: { fondo: '#d3ecea', fondo2: '#9fd2cd', tinta: '#123b42', blob: '#ffffff' },
    n2: { fondo: '#f6e3b8', fondo2: '#e7c375', tinta: '#4a3510', blob: '#fff7e3' },
    n3: { fondo: '#e4d6f5', fondo2: '#bfa3e6', tinta: '#3a2263', blob: '#f7f0ff' },
    picantes: { fondo: '#c2364a', fondo2: '#8e1f32', tinta: '#fff4f1', blob: '#ffd7cf' },
    nuestras: { fondo: '#1f2a2e', fondo2: '#40525a', tinta: '#edf1f0', blob: '#2f3f45' },
  };

  window.iniciarPreguntas = function ({ db, yo, nombres }) {
    const Q = window.PreguntasLogica, C = window.PreguntasCartas, $ = (id) => document.getElementById(id);
    const raiz = $('preguntas'); if (!raiz || !db) return;
    const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    raiz.innerHTML = `
      <div class="mazos" role="tablist">
        <button type="button" class="mazo" data-mazo="conocer">🫶 Para conocernos <span class="n"></span></button>
        <button type="button" class="mazo" data-mazo="picantes">🌶️ Picantes <span class="n"></span></button>
        <button type="button" class="mazo" data-mazo="nuestras">✍️ Nuestras <span class="n"></span></button>
      </div>
      <div id="pqBloqueo" hidden><div class="e">🌶️</div><b>Las picantes están bajo llave</b>Aparecen cuando los dos prenden "Mostrar picantes", acá abajo.</div>
      <div class="pila"><div class="atras dos"></div><div class="atras"></div><article id="pqCarta" aria-live="polite"></article></div>
      <div class="botones"><button type="button" id="pqPaso">Paso</button><button type="button" id="pqSig">Siguiente carta</button></div>
      <div class="nuevas" id="pqNuevas" hidden>
        <form id="pqForm" autocomplete="off"><input id="pqNueva" maxlength="140" placeholder="Escribí una pregunta para el mazo" aria-label="Nueva pregunta"><button type="submit" id="pqAgregar">Sumar</button></form>
        <ul id="pqLista"></ul>
      </div>
      <label class="tog"><span><b>Mostrar picantes</b><span id="pqPicTxt"></span></span><input type="checkbox" id="pqPicantes"></label>`;

    let est = {}, existe = false, nuestras = [], quierePicantes = false, ultimaClave = '';
    const nom = (k) => nombres()[k] || (k === 'A' ? 'Lipu' : 'Guti');
    const campoPic = () => (yo() === 'A' ? 'picA' : 'picB');
    const elegido = () => est.mazo || 'conocer';
    // mazo que se ve: las picantes solo si las prendieron los dos
    const mazoVisible = () => (elegido() === 'picantes' && !Q.picantesOk(est) ? 'conocer' : elegido());
    const ordenPic = () => Q.orden(C.PICANTES.length, est.seed || 1);
    function cartas(m) {
      if (m === 'picantes') return ordenPic().map((i) => C.PICANTES[i]);
      if (m === 'nuestras') return nuestras.map((x) => ({ e: x.e || Q.emojiPara(x.texto), q: x.texto, autor: x.autor }));
      return C.CONOCER;
    }

    async function guardar(parche) {
      est = { ...est, ...parche }; pintar();
      const ref = db.doc('juego/preguntas');
      try {
        if (!existe) { await ref.set({ mazo: 'conocer', conocer: 0, picantes: 0, nuestras: 0, seed: Math.floor(Math.random() * 1e9), ...est }); existe = true; return; }
        await ref.merge(parche);
      } catch (e) {
        if (e.code === 'borrada') { existe = false; return guardar(parche); }
        console.error(e); window.aviso?.('No se pudo cambiar la carta. Revisá la señal.');
      }
    }

    function pintar() {
      const m = mazoVisible(), lista = cartas(m), i = Math.min(est[m] || 0, lista.length), carta = lista[i], fin = i >= lista.length;
      // mazos
      raiz.querySelectorAll('[data-mazo]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mazo === (quierePicantes && !Q.picantesOk(est) ? 'picantes' : m))));
      raiz.querySelector('[data-mazo="conocer"] .n').textContent = Math.min((est.conocer || 0) + 1, 36) + '/36';
      raiz.querySelector('[data-mazo="picantes"] .n').textContent = Q.picantesOk(est) ? Math.min((est.picantes || 0) + 1, C.PICANTES.length) + '/' + C.PICANTES.length : '🔒';
      raiz.querySelector('[data-mazo="nuestras"] .n').textContent = String(nuestras.length);
      // picantes bloqueadas (si las pidió)
      const bloqueo = quierePicantes && !Q.picantesOk(est);
      $('pqBloqueo').hidden = !bloqueo;
      raiz.querySelector('.pila').hidden = bloqueo; raiz.querySelector('.botones').hidden = bloqueo;
      $('pqPicantes').checked = !!est[campoPic()];
      const otro = yo() === 'A' ? 'B' : 'A', otroOn = !!est[otro === 'A' ? 'picA' : 'picB'];
      $('pqPicTxt').textContent = Q.picantesOk(est) ? 'Prendidas por los dos.' : `Aparecen solo si los dos las prenden. ${nom(otro)}: ${otroOn ? 'prendido' : 'apagado'}.`;
      $('pqNuevas').hidden = m !== 'nuestras';
      // carta
      const pal = m === 'conocer' ? PAL['n' + Q.nivel(Math.min(i, 35))] : PAL[m];
      const pila = raiz.querySelector('.pila');
      for (const [k, v] of Object.entries(pal)) pila.style.setProperty('--' + k, v);
      const el = $('pqCarta');
      const clave = m + ':' + i + ':' + (carta?.q || '');
      const animar = ultimaClave && clave !== ultimaClave; ultimaClave = clave;
      const llenar = () => {
        el.replaceChildren(); el.dataset.mazo = m; // el mazo cambia junto con el contenido (no al empezar la animación)
        const t = document.createElement('div'); t.className = 'turno';
        const chip = (k) => { const s = document.createElement('span'); s.className = 'p ' + k; s.textContent = nom(k); return s; };
        const txt = (s) => { const x = document.createElement('span'); x.className = 'f'; x.textContent = s; return x; };
        const d = document.createElement('div'); d.className = 'dibujo'; const de = document.createElement('span');
        const p = document.createElement('p'); p.className = 'pregunta';
        const pie = document.createElement('div'); pie.className = 'pie'; const izq = document.createElement('span'), der = document.createElement('span');
        if (fin || !carta) {
          t.append(txt(m === 'nuestras' && !lista.length ? 'Todavía no hay preguntas propias' : '¡Mazo terminado!'));
          de.textContent = m === 'nuestras' && !lista.length ? '✍️' : '🏁';
          p.textContent = m === 'nuestras' && !lista.length ? 'Escriban sus preguntas acá abajo y se suman al mazo.' : 'Llegaron al final. Tocá "Siguiente carta" para volver a empezar.';
          izq.textContent = ''; der.textContent = lista.length ? `${lista.length} de ${lista.length}` : '';
        } else {
          const tu = Q.turno(i, carta);
          if (tu.ambos) t.append(txt('Responden los dos'), chip('A'), chip('B'));
          else t.append(chip(tu.pregunta), txt('le pregunta a'), chip(tu.responde));
          de.textContent = carta.e; p.textContent = carta.q;
          izq.textContent = m === 'conocer' ? 'Nivel ' + Q.nivel(i) + ' de 3' : m === 'picantes' ? 'Picante' : 'La sumó ' + nom(carta.autor);
          der.textContent = `carta ${i + 1} de ${lista.length}`;
        }
        d.appendChild(de); pie.append(izq, der); el.append(t, d, p, pie);
      };
      if (!animar || matchMedia('(prefers-reduced-motion: reduce)').matches) return llenar();
      el.classList.add('sale');
      setTimeout(() => { llenar(); el.classList.remove('sale'); el.classList.add('entra'); requestAnimationFrame(() => requestAnimationFrame(() => el.classList.remove('entra'))); }, 280);
    }

    const avanzar = () => { const m = mazoVisible(); guardar({ [m]: Q.siguiente(est[m] || 0, cartas(m).length), mazo: m }); };
    $('pqSig').addEventListener('click', avanzar);
    $('pqPaso').addEventListener('click', avanzar);
    raiz.querySelector('.mazos').addEventListener('click', (e) => {
      const b = e.target.closest('[data-mazo]'); if (!b) return;
      const m = b.dataset.mazo;
      if (m === 'picantes' && !Q.picantesOk(est)) { quierePicantes = true; return pintar(); }
      quierePicantes = false; guardar({ mazo: m });
    });
    $('pqPicantes').addEventListener('change', (e) => {
      const on = e.target.checked;
      if (on && quierePicantes) guardar({ [campoPic()]: true, mazo: 'picantes' }); // la pidió: si con esto quedan prendidas por los dos, se muestran
      else guardar({ [campoPic()]: on });
    });
    $('pqForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const t = $('pqNueva').value.trim(); if (t.length < 3) return;
      const n = nuestras.length;
      try { await db.collection('preguntas').add({ texto: t.slice(0, 140), autor: yo(), e: Q.emojiPara(t), creado: Date.now() }); }
      catch (err) { console.error(err); return window.aviso?.('No se pudo sumar la pregunta. Revisá la señal.'); }
      $('pqNueva').value = '';
      guardar({ mazo: 'nuestras', nuestras: n }); // se ve enseguida la que acabás de sumar
    });
    $('pqLista').addEventListener('click', (e) => {
      const b = e.target.closest('[data-borrar-pq]'); if (!b) return;
      if (!b.classList.contains('armed')) { b.classList.add('armed'); b.textContent = '¿Borrar?'; setTimeout(() => { b.classList.remove('armed'); b.textContent = '✕'; }, 3000); return; }
      db.doc('preguntas/' + b.dataset.borrarPq).delete().catch(() => window.aviso?.('No se pudo borrar. Probá de nuevo.'));
    });
    function pintarLista() {
      $('pqLista').replaceChildren(...nuestras.map((x) => {
        const li = document.createElement('li'); const e = document.createElement('span'); e.textContent = x.e || Q.emojiPara(x.texto);
        const t = document.createElement('span'); t.className = 't'; t.textContent = x.texto; li.append(e, t);
        if (x.autor === yo()) { const b = document.createElement('button'); b.type = 'button'; b.className = 'x'; b.dataset.borrarPq = x.id; b.textContent = '✕'; b.setAttribute('aria-label', 'Borrar pregunta'); li.appendChild(b); }
        return li;
      }));
    }

    db.doc('juego/preguntas').onSnapshot((d) => {
      existe = d.exists; est = (d.exists && d.data()) || {};
      if (quierePicantes && Q.picantesOk(est)) { quierePicantes = false; if (elegido() !== 'picantes') guardar({ mazo: 'picantes' }); }
      if (elegido() === 'picantes' && Q.picantesOk(est)) quierePicantes = false;
      pintar();
    });
    db.collection('preguntas').orderBy('creado').onSnapshot((q) => { nuestras = q.docs.map((x) => ({ id: x.id, ...x.data() })); pintarLista(); pintar(); });
    db.doc('config/main').onSnapshot(() => pintar()); // nombres
    window.alCambiarSoyPreguntas = () => { pintarLista(); pintar(); };
    pintar();
  };
})();
