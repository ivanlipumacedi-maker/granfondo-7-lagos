// Álbum compartido de Rumbo al Sur: grilla por día en vivo, visor, guardar, mandar al chat, editar y borrar.
// Lo arranca build.js con iniciarAlbum({ sb, canal, viaje, yo, nombres }). Necesita AlbumLogica, AlbumCola, Camara, ChatMedios.
(function () {
  const CSS = `
#album .acciones { display: flex; gap: 8px; flex-wrap: wrap }
#album .acciones .btn { flex: 1; text-align: center; cursor: pointer }
#albumEstado { font-size: .88rem; color: var(--muted) }
#albumEstado .barra { height: 5px; border-radius: 3px; background: var(--line); margin-top: 5px; overflow: hidden }
#albumEstado .barra i { display: block; height: 100%; background: var(--accent) }
#albumEstado.aviso .barra i { background: var(--ocre) } #albumEstado.lleno .barra i { background: var(--danger) }
#albumGrilla h4 { margin: 14px 0 6px; font-size: .95rem; color: var(--muted); font-weight: 700 }
#albumGrilla h4:first-letter { text-transform: uppercase }
#albumGrilla .dia { display: grid; grid-template-columns: repeat(3, 1fr); gap: 3px }
#albumGrilla .cel { position: relative; aspect-ratio: 1; background: var(--line); border-radius: 4px; overflow: hidden; padding: 0; border: 0 }
#albumGrilla .cel img { width: 100%; height: 100%; object-fit: cover; display: block }
#albumGrilla .cel i { position: absolute; left: 4px; bottom: 4px; width: 9px; height: 9px; border-radius: 50%; border: 1.5px solid #fff }
#albumGrilla .cel i.A { background: var(--a) } #albumGrilla .cel i.B { background: var(--b) }
#albumGrilla .vacio { color: var(--muted); padding: 16px 0 }
#albumVisor { position: fixed; inset: 0; z-index: 85; background: #000; color: #fff; display: flex; flex-direction: column; touch-action: none }
#albumVisor[hidden] { display: none }
#albumVisor .marco { flex: 1; overflow: hidden; display: grid; place-items: center; position: relative }
#albumVisor .marco img { max-width: 100%; max-height: 100%; object-fit: contain; transform-origin: center; will-change: transform; user-select: none; -webkit-user-drag: none }
#albumVisor .cab { display: flex; align-items: center; gap: 10px; padding: calc(10px + env(safe-area-inset-top, 0px)) 12px 8px }
#albumVisor .cab b { flex: 1; font-size: .95rem; font-weight: 600 }
#albumVisor .cab small { display: block; opacity: .7; font-weight: 400 }
#albumVisor button, #albumVisor a { font: inherit; color: #fff; background: rgba(255,255,255,.12); border: 0; border-radius: 999px; padding: 10px 14px; font-weight: 700; font-size: .9rem; text-decoration: none; white-space: nowrap }
#albumVisor .pie { display: flex; gap: 6px; justify-content: space-between; padding: 10px 10px calc(12px + env(safe-area-inset-bottom, 0px)); flex-wrap: wrap }
/* confirmación de borrado: tarjeta abajo, sobre la foto */
#albumConfirmar { position: absolute; left: 12px; right: 12px; bottom: calc(12px + env(safe-area-inset-bottom, 0px)); background: #1e2a2e; border-radius: 18px; padding: 16px; box-shadow: 0 10px 40px rgba(0,0,0,.6) }
#albumConfirmar[hidden] { display: none }
#albumConfirmar p { margin: 0 0 14px; line-height: 1.4; font-size: .95rem; color: rgba(255,255,255,.8) }
#albumConfirmar p b { display: block; font-size: 1.1rem; color: #fff; margin-bottom: 4px }
#albumConfirmar .fila { display: flex; gap: 8px }
#albumConfirmar .fila button { flex: 1; padding: 12px 14px }
#albumVisor #albumBorrarSi { background: #c0392b }`;

  window.iniciarAlbum = function ({ sb, canal, viaje, yo, nombres }) {
    const A = window.AlbumLogica, M = window.ChatMedios, $ = (id) => document.getElementById(id);
    const raiz = $('album'); if (!raiz) return;
    const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    raiz.innerHTML = `
      <div class="acciones">
        <button type="button" class="btn" id="albumCamara">📷 Abrir cámara</button>
        <label class="btn ghost" for="albumSubir">Subir del celu</label>
        <input type="file" id="albumSubir" accept="image/*" multiple hidden>
      </div>
      <div id="albumEstado"></div>
      <div id="albumGrilla"></div>`;
    document.body.insertAdjacentHTML('beforeend', `
<div id="albumVisor" hidden role="dialog" aria-label="Foto del álbum">
  <div class="cab"><button type="button" id="albumVisorCerrar" aria-label="Volver">←</button><b></b></div>
  <div class="marco"><img alt=""></div>
  <div class="pie">
    <a id="albumGuardar" href="#" download>Guardar en el celu</a>
    <button type="button" id="albumAlChat">Mandar al chat</button>
    <button type="button" id="albumEditar">Editar</button>
    <button type="button" id="albumBorrar">Borrar</button>
  </div>
  <div id="albumConfirmar" hidden role="alertdialog" aria-labelledby="albumConfirmarT">
    <p id="albumConfirmarT"><b>¿Borrar esta foto?</b>Se borra del álbum para los dos. La copia en Google Drive queda guardada.</p>
    <div class="fila"><button type="button" id="albumBorrarNo">Cancelar</button><button type="button" id="albumBorrarSi">Borrar foto</button></div>
  </div>
</div>`);

    let fotos = [], uso = 0, pend = 0, estadoCola = 'listo', actual = null, borrando = false;
    const nom = (k) => nombres()[k] || (k === 'A' ? 'Lipu' : 'Guti');
    const fmtHora = new Intl.DateTimeFormat('es-AR', { timeZone: 'America/Argentina/Buenos_Aires', weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

    function pintarEstado() {
      const e = A.espacio(uso, A.LIMITE_BYTES), el = $('albumEstado');
      el.className = e.estado;
      const mb = (uso / 1048576).toFixed(0);
      let t = `${fotos.length} foto${fotos.length === 1 ? '' : 's'} · espacio en la app: ${mb} MB de 1 GB · todas se copian a Google Drive`;
      if (pend) t += estadoCola === 'sin-senal' ? ` · ${pend} esperando señal` : ` · subiendo ${pend}`;
      if (e.estado === 'aviso') t += ' · queda poco espacio';
      if (e.estado === 'lleno' || estadoCola === 'lleno') t = `Se llenó el espacio del álbum (${e.pct} %). Borren fotos que no quieran para seguir subiendo.` + (pend ? ` Hay ${pend} esperando.` : '');
      el.innerHTML = '';
      const p = document.createElement('div'); p.textContent = t; el.appendChild(p);
      const b = document.createElement('div'); b.className = 'barra'; b.innerHTML = `<i style="width:${e.pct}%"></i>`; el.appendChild(b);
      camara.pendientes(pend);
    }

    async function firmarYPoner(imgs) {
      const rutas = imgs.map((i) => i.dataset.ruta).filter(Boolean);
      if (!rutas.length) return;
      try { await M.firmar(sb, rutas, 'album'); } catch (e) { console.warn('álbum: firmas en espera', e.message); }
      for (const i of imgs) { const u = M.firmada(i.dataset.ruta); if (u && i.getAttribute('src') !== u) i.src = u; }
    }

    function pintar() {
      const g = $('albumGrilla');
      if (!fotos.length) { g.innerHTML = '<p class="vacio">Todavía no hay fotos. Sacá la primera con la cámara o subí las que ya tenés en el celu.</p>'; pintarEstado(); return; }
      g.replaceChildren(...A.porDia(fotos).map((d) => {
        const s = document.createElement('section');
        const h = document.createElement('h4'); h.textContent = d.titulo; s.appendChild(h);
        const grid = document.createElement('div'); grid.className = 'dia';
        for (const f of d.fotos) {
          const b = document.createElement('button'); b.type = 'button'; b.className = 'cel'; b.dataset.id = f.id;
          b.setAttribute('aria-label', `Foto de ${nom(f.autor)}`);
          const i = document.createElement('img'); i.alt = ''; i.loading = 'lazy'; i.dataset.ruta = f.mini; i.dataset.id = f.id;
          const u = M.firmada(f.mini); if (u) i.src = u;
          const pto = document.createElement('i'); pto.className = f.autor === 'B' ? 'B' : 'A';
          b.append(i, pto); grid.appendChild(b);
        }
        s.appendChild(grid); return s;
      }));
      pintarEstado();
      firmarYPoner([...g.querySelectorAll('img')].filter((i) => !M.vigente(i.dataset.ruta)));
    }

    async function cargar() {
      const [r, u] = await Promise.all([sb.from('fotos').select('*').order('tomada', { ascending: false }).limit(1000), sb.rpc('album_uso')]);
      if (r.error) return console.error(r.error);
      fotos = r.data || []; if (!u.error) uso = Number(u.data) || 0;
      pintar(); if (actual && !fotos.some((x) => x.id === actual.id)) salirDeFotoBorrada();
    }
    async function refrescarUso() { const u = await sb.rpc('album_uso'); if (!u.error) { uso = Number(u.data) || 0; pintarEstado(); } }
    let usoTimer = 0; const refrescarUsoLuego = () => { clearTimeout(usoTimer); usoTimer = setTimeout(refrescarUso, 600); };
    window.__albumUso = async () => { await refrescarUso(); return uso; };

    const cola = window.AlbumCola.crear({
      sb, viaje,
      alSubir: (fila) => { fotos = A.fusionar(fotos, fila); pintar(); refrescarUsoLuego(); canal.send({ type: 'broadcast', event: 'album', payload: { fila } }); },
      alEstado: (e) => {
        pend = e.pendientes; estadoCola = e.estado; if (camara) pintarEstado();
        if (e.estado === 'descartada') window.aviso?.('Una foto no se pudo subir (el formato no es válido) y se descartó.');
      },
    });
    const camara = window.Camara.crear({
      cola, yo,
      alTocarUltima: () => { irAlAlbum = true; camara.cerrar(); seguirAlAlbum(); },
      mandarAlChat: (blob) => window.chatEnviarFoto?.(new File([blob], 'foto.jpg', { type: 'image/jpeg' })),
    });
    window.abrirCamara = (op) => camara.abrir(op);
    let irAlAlbum = false;
    function seguirAlAlbum() {
      if (!irAlAlbum || camara.abierta()) return;
      if ($('chatPanel') && !$('chatPanel').hidden) return $('chatCerrar').click(); // el chat se cierra con su propio atrás; seguimos en el popstate
      irAlAlbum = false; window.showTab?.('album'); raiz.scrollIntoView({ block: 'start' });
    }
    // una notificación del chat con la cámara/visor/editor abiertos: se cierran para que el chat quede a la vista
    window.cerrarCapas = () => { if (camara.abierta()) camara.cerrar(); if (window.EditorFoto?.abierto()) window.EditorFoto.cerrar(); if (!visor.hidden) cerrarVisor(); };

    canal.on('broadcast', { event: 'album' }, ({ payload }) => {
      if (payload?.fila?.id && payload.fila.viaje === viaje) { fotos = A.fusionar(fotos, payload.fila); pintar(); refrescarUsoLuego(); }
      if (payload?.borrado) { fotos = A.quitar(fotos, payload.borrado); pintar(); refrescarUso().then(() => cola.procesar()); if (actual?.id === payload.borrado) salirDeFotoBorrada(); }
    });
    document.addEventListener('visibilitychange', () => { if (!document.hidden) cargar(); });
    addEventListener('online', () => { M.reintentarYa(); cargar(); });

    $('albumCamara').addEventListener('click', () => camara.abrir({}));
    $('albumSubir').addEventListener('change', async (e) => {
      const files = [...(e.target.files || [])]; e.target.value = '';
      let malas = 0;
      for (const f of files) {
        try {
          const p = await window.Camara.preparar(f);
          await cola.agregar({ id: crypto.randomUUID(), foto: p.foto, mini: p.mini, media: p.media, ancho: p.ancho, alto: p.alto, autor: yo(), tomada: new Date(f.lastModified || Date.now()).toISOString() });
        } catch (x) { console.error(x); malas++; }
      }
      if (malas) window.aviso?.(malas === 1 ? 'Una foto no se pudo leer.' : `${malas} fotos no se pudieron leer.`);
    });

    /* ---------- visor ---------- */
    const visor = $('albumVisor'), img = visor.querySelector('.marco img');
    let z = { s: 1, x: 0, y: 0 };
    const aplicarZ = () => { img.style.transform = `translate(${z.x}px, ${z.y}px) scale(${z.s})`; };
    function mostrar(f) {
      actual = f; z = { s: 1, x: 0, y: 0 }; aplicarZ();
      visor.querySelector('.cab b').innerHTML = ''; const b = visor.querySelector('.cab b');
      b.append(document.createTextNode(nom(f.autor))); const sm = document.createElement('small'); sm.textContent = fmtHora.format(new Date(f.tomada)); b.appendChild(sm);
      const mini = M.firmada(f.mini); img.src = mini || '';
      $('albumBorrar').hidden = f.autor !== yo(); $('albumConfirmar').hidden = true;
      $('albumAlChat').hidden = !window.chatEnviarFoto;
      const opciones = [A.verFoto(f), f.media, f.mini].filter((x, i, xs) => x && xs.indexOf(x) === i);
      (async () => {
        for (const ruta of opciones) {
          try { await M.firmar(sb, [ruta], 'album'); } catch {}
          const u = M.firmada(ruta); if (!u || actual?.id !== f.id) continue;
          const ok = await new Promise((res) => { const p = new Image(); p.onload = () => res(true); p.onerror = () => res(false); p.src = u; });
          if (actual?.id !== f.id) return;
          if (ok) { img.src = u; $('albumGuardar').href = u; return; } // si la original ya no está (liberada a Drive), sigue con la media
        }
      })();
    }
    function abrirVisor(id) {
      const f = fotos.find((x) => x.id === id); if (!f) return;
      if (!visor.hidden) return mostrar(f); // ya abierto: solo cambia la foto (sin otra entrada de atrás)
      visor.hidden = false; history.pushState({ ...(history.state || {}), albumFoto: 1 }, '', location.hash || location.pathname + location.search);
      mostrar(f);
    }
    function cerrarVisor() { visor.hidden = true; actual = null; img.removeAttribute('src'); $('albumConfirmar').hidden = true; }
    function salirDeFotoBorrada() { if (visor.hidden) return; if (window.EditorFoto?.abierto()) return; /* al volver del editor se cierra */ if (history.state?.albumFoto) history.back(); else cerrarVisor(); }
    $('albumVisorCerrar').addEventListener('click', () => { if (history.state?.albumFoto) history.back(); else cerrarVisor(); });
    addEventListener('popstate', () => {
      if (!visor.hidden && !history.state?.albumFoto) cerrarVisor();
      else if (!visor.hidden && actual && !history.state?.editor && !fotos.some((x) => x.id === actual.id)) setTimeout(salirDeFotoBorrada, 0);
      seguirAlAlbum();
    });
    $('albumGrilla').addEventListener('click', (e) => { const c = e.target.closest('[data-id]'); if (c) abrirVisor(c.dataset.id); });

    // pellizcar, arrastrar con zoom, deslizar para pasar de foto, doble toque para acercar
    const dedos = new Map(); let ini = null, ultimoToque = 0;
    const marco = visor.querySelector('.marco');
    marco.addEventListener('pointerdown', (e) => {
      dedos.set(e.pointerId, { x: e.clientX, y: e.clientY });
      const ps = [...dedos.values()];
      ini = ps.length === 2 ? { d: Math.hypot(ps[0].x - ps[1].x, ps[0].y - ps[1].y), s: z.s, x: z.x, y: z.y } : { px: e.clientX, py: e.clientY, x: z.x, y: z.y, s: z.s, t: Date.now() };
    });
    marco.addEventListener('pointermove', (e) => {
      if (!dedos.has(e.pointerId) || !ini) return; dedos.set(e.pointerId, { x: e.clientX, y: e.clientY });
      const ps = [...dedos.values()];
      if (ps.length === 2 && ini.d) { z.s = Math.min(6, Math.max(1, ini.s * Math.hypot(ps[0].x - ps[1].x, ps[0].y - ps[1].y) / ini.d)); if (z.s === 1) { z.x = 0; z.y = 0; } aplicarZ(); }
      else if (ps.length === 1 && ini.px != null && z.s > 1) { z.x = ini.x + e.clientX - ini.px; z.y = ini.y + e.clientY - ini.py; aplicarZ(); }
    });
    const soltar = (e) => {
      if (!dedos.has(e.pointerId)) return;
      const eraUno = dedos.size === 1 && ini?.px != null; dedos.delete(e.pointerId);
      if (eraUno && e.type === 'pointerup' && z.s === 1 && actual) {
        const dx = e.clientX - ini.px, dy = e.clientY - ini.py;
        if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) { const i = fotos.findIndex((f) => f.id === actual.id), sig = fotos[i + (dx < 0 ? 1 : -1)]; if (sig) mostrar(sig); }
        else if (Math.abs(dx) < 10 && Math.abs(dy) < 10) { if (Date.now() - ultimoToque < 300) { z = { s: 2.5, x: 0, y: 0 }; aplicarZ(); } ultimoToque = Date.now(); }
      } else if (eraUno && e.type === 'pointerup' && z.s > 1 && Math.abs(e.clientX - ini.px) < 10 && Date.now() - ultimoToque < 300) { z = { s: 1, x: 0, y: 0 }; aplicarZ(); }
      else if (eraUno) ultimoToque = Date.now();
      if (!dedos.size) ini = null;
    };
    marco.addEventListener('pointerup', soltar); marco.addEventListener('pointercancel', soltar);

    // la mejor versión que haya en la app: la original, o la media si la original ya se liberó (está en Drive)
    async function blobDe(f) {
      for (const ruta of [A.verFoto(f), f.media].filter((x, i, xs) => x && xs.indexOf(x) === i)) {
        try { await M.firmar(sb, [ruta], 'album'); } catch {}
        const u = M.firmada(ruta); if (!u) continue;
        const r = await fetch(u); if (r.ok) return r.blob();
      }
      throw new Error('sin la foto');
    }
    $('albumGuardar').addEventListener('click', async (e) => {
      e.preventDefault(); if (!actual) return;
      try {
        const b = await blobDe(actual), u = URL.createObjectURL(b), a = document.createElement('a');
        a.href = u; a.download = `rumbo-al-sur-${actual.tomada.slice(0, 10)}-${actual.id.slice(0, 6)}.jpg`; document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(u), 10000);
      } catch (x) { console.error(x); window.aviso?.('No se pudo bajar la foto. Revisá la señal.'); }
    });
    $('albumAlChat').addEventListener('click', async () => {
      if (!actual) return;
      try { const b = await blobDe(actual); window.chatEnviarFoto?.(new File([b], 'foto.jpg', { type: 'image/jpeg' })); window.aviso?.('Mandada al chat.'); }
      catch (x) { console.error(x); window.aviso?.('No se pudo mandar al chat. Revisá la señal.'); }
    });
    let abriendoEditor = false;
    $('albumEditar').addEventListener('click', async () => {
      if (!actual || !window.EditorFoto || abriendoEditor || window.EditorFoto.abierto()) return;
      const f = actual; abriendoEditor = true;
      try {
        const b = await blobDe(f);
        window.EditorFoto.abrir(b, {
          alGuardar: async (editada) => {
            const p = await window.Camara.preparar(editada);
            await cola.agregar({ id: crypto.randomUUID(), foto: p.foto, mini: p.mini, media: p.media, ancho: p.ancho, alto: p.alto, autor: yo(), tomada: new Date().toISOString(), editada_de: f.id });
          },
        });
      } catch (x) { console.error(x); window.aviso?.('No se pudo abrir la foto para editar. Revisá la señal.'); }
      finally { abriendoEditor = false; }
    });
    // Borrar abre una confirmación; recién "Borrar foto" borra (un doble toque sin querer no alcanza)
    $('albumBorrar').addEventListener('click', () => { if (!actual || actual.autor !== yo()) return; $('albumConfirmar').hidden = false; $('albumBorrarNo').focus(); });
    $('albumBorrarNo').addEventListener('click', () => { $('albumConfirmar').hidden = true; });
    $('albumBorrarSi').addEventListener('click', async () => {
      if (!actual || actual.autor !== yo() || borrando) return;
      const f = actual; borrando = true; $('albumConfirmar').hidden = true;
      try {
        const r = await sb.from('fotos').delete().eq('id', f.id).select('id');
        if (r.error || !r.data?.length) { console.error(r.error); return window.aviso?.('No se pudo borrar. Probá de nuevo.'); }
        let rm = await sb.storage.from('album').remove([f.archivo, f.mini, f.media].filter(Boolean));
        if (rm.error) rm = await sb.storage.from('album').remove([f.archivo, f.mini, f.media].filter(Boolean)); // un reintento: si no, el archivo ocupa lugar
        if (rm.error) console.error('álbum: no se pudo borrar el archivo', rm.error);
      } finally { borrando = false; }
      fotos = A.quitar(fotos, f.id); pintar(); refrescarUso().then(() => cola.procesar());
      canal.send({ type: 'broadcast', event: 'album', payload: { borrado: f.id } });
      if (history.state?.albumFoto) history.back(); else cerrarVisor();
    });

    pintar(); cargar();
  };
})();
