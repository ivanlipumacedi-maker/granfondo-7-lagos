// Chat de Lipu y Guti (etapa 1): franja fija abajo + panel a pantalla completa.
// Lo arranca build.js con iniciarChat({ sb, canal, viaje, yo, nombres }). Necesita window.ChatLogica.
(function () {
  const CSS = `
#chatBarra { position: fixed; left: 0; right: 0; bottom: 0; z-index: 40; background: var(--surface); border-top: 1px solid var(--line);
  padding: 8px 14px calc(8px + env(safe-area-inset-bottom, 0px)); cursor: pointer; box-shadow: 0 -6px 18px rgba(0,0,0,.18) }
#chatBarra .in { max-width: 760px; margin: 0 auto; display: flex; align-items: center; gap: 12px; min-height: 48px }
#chatBarra .av, #chatPanel .av { width: 38px; height: 38px; border-radius: 50%; display: grid; place-items: center; font-weight: 800; color: var(--bg); flex: none }
#chatBarra .tx { flex: 1; min-width: 0 }
#chatBarra .nom { font-weight: 700; font-size: .95rem }
#chatBarra .ult { color: var(--muted); font-size: .88rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis }
#chatBarra .bur { position: relative; width: 44px; height: 44px; border-radius: 50%; background: var(--accent); display: grid; place-items: center; font-size: 1.25rem; flex: none }
#chatBadge { position: absolute; top: -4px; right: -4px; min-width: 20px; height: 20px; padding: 0 5px; border-radius: 10px; background: var(--danger, #d2453a); color: #fff;
  font-size: .72rem; font-weight: 800; display: grid; place-items: center; border: 2px solid var(--surface) }
#chatPanel { position: fixed; inset: 0; z-index: 60; background: var(--bg); display: flex; flex-direction: column }
#chatPanel[hidden] { display: none }
#chatPanel header { display: flex; align-items: center; gap: 12px; padding: calc(10px + env(safe-area-inset-top, 0px)) 12px 10px; background: var(--surface); border-bottom: 1px solid var(--line) }
#chatPanel header button { background: none; border: 0; color: var(--ink); font-size: 1.5rem; padding: 4px 8px; line-height: 1 }
#chatPanel header b { font-size: 1.05rem }
#chatLista { flex: 1; overflow-y: auto; padding: 12px 12px 6px; display: flex; flex-direction: column; gap: 6px; overscroll-behavior: contain }
#chatLista::before { content: ""; flex: 1 }
#chatLista .vacio { margin: auto; color: var(--muted); text-align: center; padding: 20px }
#chatMas { align-self: center; margin-bottom: 6px }
.msg { display: flex; flex-direction: column; max-width: 80% }
.msg.mio { align-self: flex-end; align-items: flex-end }
.msg.otro { align-self: flex-start; align-items: flex-start }
.burbuja { padding: 7px 11px 5px; border-radius: 16px; background: var(--surface); border: 1px solid var(--line); user-select: none; -webkit-user-select: none;
  -webkit-touch-callout: none; touch-action: manipulation }
.msg.mio .burbuja { color: var(--bg); border: 0 }
.msg.mio.A .burbuja { background: var(--a) } .msg.mio.B .burbuja { background: var(--b) }
.msg.mio .burbuja { border-bottom-right-radius: 5px } .msg.otro .burbuja { border-bottom-left-radius: 5px }
.burbuja .txt { white-space: pre-wrap; overflow-wrap: anywhere; font-size: .97rem; line-height: 1.35 }
.burbuja .hora { display: block; text-align: right; font-size: .68rem; opacity: .7; margin-top: 2px }
.burbuja.sel { outline: 2px solid var(--accent); outline-offset: 2px }
.reacs { margin-top: -4px; background: var(--surface); border: 1px solid var(--line); border-radius: 12px; padding: 0 6px; font-size: .85rem; position: relative; z-index: 1 }
#chatForm { display: flex; align-items: flex-end; gap: 8px; padding: 8px 10px calc(8px + env(safe-area-inset-bottom, 0px)); background: var(--surface); border-top: 1px solid var(--line) }
#chatTexto { flex: 1; resize: none; border: 1px solid var(--line); border-radius: 20px; padding: 9px 14px; background: var(--bg); color: var(--ink); font: inherit; max-height: 130px; line-height: 1.3 }
#chatEnviar { width: 42px; height: 42px; border-radius: 50%; border: 0; background: var(--accent); color: var(--bg); font-size: 1.1rem; flex: none }
#chatEnviar:disabled { opacity: .5 }
#chatAcciones { position: absolute; left: 0; right: 0; bottom: 0; background: var(--surface); border-top: 1px solid var(--line); border-radius: 16px 16px 0 0;
  padding: 14px 14px calc(14px + env(safe-area-inset-bottom, 0px)); box-shadow: 0 -10px 30px rgba(0,0,0,.35); z-index: 2 }
#chatAcciones[hidden] { display: none }
#chatAcciones .reac { display: flex; justify-content: space-around; margin-bottom: 12px }
#chatAcciones .reac button { font-size: 1.7rem; background: none; border: 0; border-radius: 50%; width: 48px; height: 48px }
#chatAcciones .reac button.mia { background: var(--accent-soft, rgba(77,189,183,.2)) }
#chatAcciones .fila { display: flex; gap: 10px; justify-content: flex-end }
#chatBorrar.armed { background: var(--danger, #d2453a); border-color: var(--danger, #d2453a); color: #fff }
`;

  window.iniciarChat = function ({ sb, canal, viaje, yo, nombres }) {
    const L = window.ChatLogica;
    const $ = (id) => document.getElementById(id);
    const otro = () => (yo() === 'A' ? 'B' : 'A');
    const CAMPOS = 'id,autor,tipo,texto,reacciones,creado';
    let lista = [], hayMas = false, selId = null, timer = null;
    if (!localStorage.getItem('chatVisto')) localStorage.setItem('chatVisto', String(Date.now()));
    const visto = () => Number(localStorage.getItem('chatVisto')) || 0;
    const marcarVisto = () => localStorage.setItem('chatVisto', String(Date.now()));
    const abierto = () => !$('chatPanel').hidden;

    const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    document.body.insertAdjacentHTML('beforeend', `
<div id="chatBarra" role="button" tabindex="0" aria-label="Abrir chat"><div class="in">
  <div class="av" aria-hidden="true"></div>
  <div class="tx"><div class="nom"></div><div class="ult"></div></div>
  <div class="bur" aria-hidden="true">💬<span id="chatBadge" hidden></span></div>
</div></div>
<section id="chatPanel" hidden aria-label="Chat">
  <header><button type="button" id="chatCerrar" aria-label="Volver">←</button><div class="av" aria-hidden="true"></div><b class="nom"></b></header>
  <div id="chatLista"></div>
  <form id="chatForm" autocomplete="off">
    <textarea id="chatTexto" rows="1" maxlength="${L.MAX_TEXTO}" placeholder="Mensaje" aria-label="Mensaje"></textarea>
    <button type="submit" id="chatEnviar" aria-label="Enviar">➤</button>
  </form>
  <div id="chatAcciones" hidden>
    <div class="reac">${L.REACCIONES.map((r) => `<button type="button" data-reac="${r}" aria-label="Reaccionar ${r}">${r}</button>`).join('')}</div>
    <div class="fila"><button type="button" class="btn ghost" id="chatBorrar" hidden>Borrar</button><button type="button" class="btn ghost" id="chatCancelar">Cancelar</button></div>
  </div>
</section>`);

    const ajustarPadding = () => { document.body.style.paddingBottom = ($('chatBarra').offsetHeight + 8) + 'px'; };
    window.addEventListener('resize', ajustarPadding);

    /* ---------- pintar ---------- */
    function pintarCabeceras() {
      const n = nombres(), o = otro();
      document.querySelectorAll('#chatBarra .av, #chatPanel .av').forEach((e) => { e.textContent = (n[o] || '?').trim().charAt(0).toUpperCase(); e.style.background = `var(--${o.toLowerCase()})`; });
      document.querySelectorAll('#chatBarra .nom, #chatPanel .nom').forEach((e) => { e.textContent = n[o] || '?'; });
      const ult = lista[lista.length - 1];
      $('chatBarra').querySelector('.ult').textContent = ult ? (ult.autor === yo() ? 'Vos: ' : '') + L.resumen(ult) : `Escribile a ${n[o] || 'tu compañero'} 💬`;
      const nl = abierto() ? 0 : L.noLeidos(lista, yo(), visto());
      $('chatBadge').hidden = !nl; $('chatBadge').textContent = nl > 99 ? '99+' : String(nl);
      ajustarPadding();
    }
    function pintarLista() {
      const cont = $('chatLista');
      const alFondo = cont.scrollHeight - cont.scrollTop - cont.clientHeight < 120;
      cont.replaceChildren();
      if (hayMas) { const b = document.createElement('button'); b.type = 'button'; b.id = 'chatMas'; b.className = 'link'; b.textContent = 'Ver anteriores'; cont.appendChild(b); }
      if (!lista.length) { const p = document.createElement('p'); p.className = 'vacio'; p.textContent = 'Todavía no hay mensajes. ¡Mandá el primero! 🚗'; cont.appendChild(p); }
      for (const m of lista) {
        const fila = document.createElement('div'); fila.className = `msg ${m.autor === yo() ? 'mio' : 'otro'} ${m.autor}`; fila.dataset.id = m.id;
        const bur = document.createElement('div'); bur.className = 'burbuja' + (m.id === selId ? ' sel' : ''); bur.dataset.id = m.id;
        const txt = document.createElement('div'); txt.className = 'txt'; txt.textContent = m.texto || L.resumen(m);
        const hora = document.createElement('span'); hora.className = 'hora'; hora.textContent = L.horaCorta(m.creado);
        bur.append(txt, hora); fila.appendChild(bur);
        const rs = Object.values(m.reacciones || {});
        if (rs.length) { const r = document.createElement('div'); r.className = 'reacs'; r.textContent = rs[0] === rs[1] ? `${rs[0]} 2` : rs.join(' '); fila.appendChild(r); }
        cont.appendChild(fila);
      }
      if (alFondo) cont.scrollTop = cont.scrollHeight;
    }
    const pintar = () => { pintarCabeceras(); if (abierto()) pintarLista(); };
    window.alCambiarSoyChat = pintar;

    /* ---------- datos ---------- */
    const avisar = (accion, payload) => canal.send({ type: 'broadcast', event: 'chat', payload: { accion, ...payload } });
    async function cargar(antesDe) {
      let q = sb.from('mensajes').select(CAMPOS).eq('viaje', viaje).order('creado', { ascending: false }).limit(50);
      if (antesDe) q = q.lt('creado', antesDe);
      const { data, error } = await q;
      if (error) { console.error(error); return; }
      hayMas = data.length === 50;
      for (const m of data) lista = L.fusionar(lista, m);
      if (abierto()) marcarVisto();
      pintar();
    }
    canal.on('broadcast', { event: 'chat' }, ({ payload: p }) => {
      if (!p) return;
      if ((p.accion === 'nuevo' || p.accion === 'cambio') && p.m?.id) lista = L.fusionar(lista, p.m);
      else if (p.accion === 'borrado' && p.id) lista = L.quitar(lista, p.id);
      else return;
      if (abierto()) marcarVisto();
      pintar();
    });
    document.addEventListener('visibilitychange', () => { if (!document.hidden) cargar(); });

    async function enviar() {
      const t = $('chatTexto').value;
      if (!L.textoValido(t)) return;
      $('chatEnviar').disabled = true;
      const { data, error } = await sb.from('mensajes').insert({ viaje, autor: yo(), texto: t.trim() }).select(CAMPOS).single();
      $('chatEnviar').disabled = false;
      if (error) { console.error(error); window.aviso?.('No se pudo mandar el mensaje. Revisá la conexión y probá de nuevo.'); return; }
      $('chatTexto').value = ''; autoAlto();
      lista = L.fusionar(lista, data); marcarVisto();
      const cont = $('chatLista'); pintar(); cont.scrollTop = cont.scrollHeight;
      avisar('nuevo', { m: data });
    }

    /* ---------- abrir / cerrar ---------- */
    function abrirPanel() {
      if (abierto()) return;
      if (location.hash !== '#chat') history.pushState({ chat: 1 }, '', '#chat');
      $('chatPanel').hidden = false; document.documentElement.style.overflow = 'hidden';
      marcarVisto(); pintar();
      const cont = $('chatLista'); cont.scrollTop = cont.scrollHeight;
    }
    function cerrarPanel() { cerrarAcciones(); $('chatPanel').hidden = true; document.documentElement.style.overflow = ''; marcarVisto(); pintar(); }
    $('chatBarra').addEventListener('click', abrirPanel);
    $('chatBarra').addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); abrirPanel(); } });
    $('chatCerrar').addEventListener('click', () => { if (history.state?.chat) history.back(); else { history.replaceState(null, '', location.pathname); cerrarPanel(); } });
    window.addEventListener('popstate', () => { if (location.hash === '#chat') abrirPanel(); else if (abierto()) cerrarPanel(); });
    navigator.serviceWorker?.addEventListener('message', (e) => { if (e.data?.abrir === 'chat') abrirPanel(); });

    /* ---------- escribir ---------- */
    function autoAlto() { const t = $('chatTexto'); t.style.height = 'auto'; t.style.height = Math.min(t.scrollHeight, 130) + 'px'; }
    $('chatTexto').addEventListener('input', autoAlto);
    $('chatTexto').addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar(); } });
    $('chatForm').addEventListener('submit', (e) => { e.preventDefault(); enviar(); });

    /* ---------- reacciones y borrar (mantener apretado) ---------- */
    function abrirAcciones(id) {
      const m = lista.find((x) => x.id === id); if (!m) return;
      selId = id; pintarLista();
      document.querySelectorAll('#chatAcciones [data-reac]').forEach((b) => b.classList.toggle('mia', m.reacciones?.[yo()] === b.dataset.reac));
      const borrar = $('chatBorrar'); borrar.hidden = m.autor !== yo(); borrar.classList.remove('armed'); borrar.textContent = 'Borrar';
      $('chatAcciones').hidden = false;
    }
    function cerrarAcciones() { $('chatAcciones').hidden = true; if (selId) { selId = null; if (abierto()) pintarLista(); } }
    const cancelarTimer = () => { clearTimeout(timer); timer = null; };
    $('chatLista').addEventListener('pointerdown', (e) => {
      const b = e.target.closest('.burbuja'); if (!b) return;
      cancelarTimer(); timer = setTimeout(() => { timer = null; navigator.vibrate?.(15); abrirAcciones(b.dataset.id); }, 500);
    });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => $('chatLista').addEventListener(ev, cancelarTimer));
    $('chatLista').addEventListener('scroll', cancelarTimer, { passive: true });
    $('chatLista').addEventListener('contextmenu', (e) => { const b = e.target.closest('.burbuja'); if (b) { e.preventDefault(); cancelarTimer(); abrirAcciones(b.dataset.id); } });
    $('chatLista').addEventListener('click', (e) => { if (e.target.id === 'chatMas') cargar(lista[0]?.creado); });
    $('chatCancelar').addEventListener('click', cerrarAcciones);
    $('chatAcciones').addEventListener('click', async (e) => {
      const b = e.target.closest('[data-reac]'); if (!b || !selId) return;
      const id = selId, m = lista.find((x) => x.id === id); cerrarAcciones(); if (!m) return;
      const reacciones = L.alternarReaccion(m.reacciones, yo(), b.dataset.reac);
      lista = L.fusionar(lista, { ...m, reacciones }); pintar();
      const { data, error } = await sb.from('mensajes').update({ reacciones }).eq('id', id).select(CAMPOS).single();
      if (error) { console.error(error); lista = L.fusionar(lista, m); pintar(); window.aviso?.('No se pudo reaccionar. Probá de nuevo.'); return; }
      lista = L.fusionar(lista, data); pintar(); avisar('cambio', { m: data });
    });
    $('chatBorrar').addEventListener('click', async () => {
      const btn = $('chatBorrar');
      if (!btn.classList.contains('armed')) { btn.classList.add('armed'); btn.textContent = '¿Borrar? Tocá de nuevo'; return; }
      const id = selId; cerrarAcciones(); if (!id) return;
      const { error } = await sb.from('mensajes').delete().eq('id', id);
      if (error) { console.error(error); window.aviso?.('No se pudo borrar. Probá de nuevo.'); return; }
      lista = L.quitar(lista, id); pintar(); avisar('borrado', { id });
    });

    pintar();
    cargar();
    if (location.hash === '#chat') { history.replaceState(null, '', location.pathname); abrirPanel(); }
  };
})();
