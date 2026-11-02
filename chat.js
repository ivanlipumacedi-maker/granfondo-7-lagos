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
.adj { width: 42px; height: 42px; border-radius: 50%; display: grid; place-items: center; font-size: 1.3rem; cursor: pointer; flex: none; background: var(--bg); border: 1px solid var(--line) }
.burbuja.media { padding: 3px 3px 4px }
.burbuja.media .hora { padding: 0 6px }
img.foto { display: block; border-radius: 13px; max-width: min(250px, 62vw); max-height: 320px; object-fit: cover; background: var(--line); cursor: zoom-in }
.burbuja.subiendo { opacity: .65 }
.burbuja .estado { font-size: .75rem; padding: 2px 6px; opacity: .8 }
#chatVisor { position: absolute; inset: 0; z-index: 3; background: rgba(0,0,0,.92); display: grid; place-items: center }
#chatVisor[hidden] { display: none }
#chatVisor img { max-width: 100%; max-height: 100%; object-fit: contain }
.audio { display: flex; align-items: center; gap: 9px; min-width: min(230px, 60vw); padding: 6px 8px 2px }
.audio .play { width: 36px; height: 36px; border-radius: 50%; border: 0; background: var(--ink); color: var(--bg); font-size: .95rem; flex: none }
.msg.mio .audio .play { background: var(--bg); color: var(--ink) }
.audio .avance { flex: 1; height: 4px; border-radius: 2px; background: color-mix(in srgb, currentColor 25%, transparent); overflow: hidden }
.audio .avance i { display: block; height: 100%; width: 0; background: currentColor }
.audio .dur { font-size: .78rem; min-width: 32px; text-align: right; font-variant-numeric: tabular-nums }
#chatForm { position: relative }
#chatGrabando { position: absolute; left: 10px; right: 60px; top: 8px; bottom: calc(8px + env(safe-area-inset-bottom, 0px)); display: flex; align-items: center; gap: 10px;
  padding: 0 14px; border-radius: 20px; background: var(--bg); border: 1px solid var(--line); font-weight: 600 }
#chatGrabando[hidden] { display: none }
#chatGrabando .rec { width: 10px; height: 10px; border-radius: 50%; background: var(--danger, #d2453a); animation: latido 1s infinite }
#chatGrabando .cancelar { margin-left: auto; color: var(--muted); font-weight: 400; font-size: .85rem }
#chatGrabando.soltar .cancelar { color: var(--danger, #d2453a); font-weight: 700 }
@keyframes latido { 50% { opacity: .25 } }
#chatEnviar.grabando { transform: scale(1.25); background: var(--danger, #d2453a) }
.av { overflow: hidden }
.av img, .seg button img { width: 100%; height: 100%; object-fit: cover; display: block }
.seg button img { width: 22px; height: 22px; border-radius: 50%; display: inline-block; vertical-align: middle; margin: -3px 6px -3px -6px }
#perfilBloque { display: flex; align-items: center; gap: 14px; margin: 4px 0 16px; flex-wrap: wrap }
#perfilBloque .av { width: 64px; height: 64px; border-radius: 50%; display: grid; place-items: center; font-weight: 800; font-size: 1.5rem; color: var(--bg) }
#perfilBloque .acc { display: flex; gap: 8px; flex-wrap: wrap }
#recorte { position: fixed; inset: 0; z-index: 70; background: rgba(8,12,14,.97); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 18px; padding: 20px }
#recorte[hidden] { display: none }
#recorte canvas { width: min(300px, 80vw); height: min(300px, 80vw); border-radius: 50%; touch-action: none; cursor: grab; box-shadow: 0 0 0 3px var(--accent) }
#recorte p { color: #fff; margin: 0; font-size: .9rem; opacity: .85 }
#recorte input[type=range] { width: min(300px, 80vw) }
#recorte .acc { display: flex; gap: 10px }
.burbuja.sticker { background: none !important; border: 0 !important; padding: 0 }
.burbuja.sticker .hora { color: var(--muted); text-align: right; opacity: 1 }
img.stk { display: block; width: 140px; height: 140px; object-fit: contain; -webkit-user-drag: none }
.msg.mio .burbuja.sticker .hora { color: var(--muted) }
#chatStickers { position: absolute; left: 0; right: 0; bottom: 0; height: min(60%, 460px); z-index: 2; background: var(--surface); border-top: 1px solid var(--line);
  border-radius: 16px 16px 0 0; box-shadow: 0 -10px 30px rgba(0,0,0,.35); display: flex; flex-direction: column; padding-bottom: env(safe-area-inset-bottom, 0px) }
#chatStickers[hidden] { display: none }
#chatStickers .tabs2 { display: flex; gap: 6px; padding: 10px 12px 6px; align-items: center }
#chatStickers .tabs2 button { border: 1px solid var(--line); background: none; color: var(--ink); border-radius: 999px; padding: 5px 14px; font-weight: 600 }
#chatStickers .tabs2 button[aria-selected="true"] { background: var(--ink); color: var(--bg) }
#chatStickers .tabs2 .cerrar { margin-left: auto; border: 0; font-size: 1.2rem }
#chatStickers .cuerpo { flex: 1; overflow-y: auto; padding: 6px 12px 12px }
#chatStickers .grilla { display: grid; grid-template-columns: repeat(auto-fill, minmax(84px, 1fr)); gap: 8px }
#chatStickers .grilla > * { aspect-ratio: 1; border-radius: 12px; display: grid; place-items: center; position: relative }
#chatStickers .grilla > .link, #chatStickers .grilla > .nota { aspect-ratio: auto; justify-self: center }
#chatStickers .grilla img { width: 100%; height: 100%; object-fit: contain; cursor: pointer }
#chatStickers .crear { border: 2px dashed var(--line); color: var(--muted); font-weight: 700; cursor: pointer; text-align: center; font-size: .85rem }
#chatStickers .quitar { position: absolute; top: -6px; right: -6px; width: 24px; height: 24px; border-radius: 50%; border: 0; background: var(--danger, #d2453a); color: #fff; font-weight: 800 }
#chatStickers .nota { color: var(--muted); font-size: .85rem; text-align: center; padding: 14px 6px }
#chatStickers input[type=search] { width: 100%; border: 1px solid var(--line); border-radius: 20px; padding: 8px 14px; background: var(--bg); color: var(--ink); margin-bottom: 8px; font: inherit }
#chatStickers .giphy { font-size: .72rem; color: var(--muted); text-align: right; padding: 4px 2px 0; letter-spacing: .03em }
#stickerEditor { position: fixed; inset: 0; z-index: 70; background: rgba(8,12,14,.97); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px; padding: 20px }
#stickerEditor[hidden] { display: none }
#stickerEditor canvas { width: min(280px, 74vw); height: min(280px, 74vw); touch-action: none; cursor: grab; background: repeating-conic-gradient(#2a373d 0 25%, #1a2328 0 50%) 0 0 / 20px 20px; border-radius: 14px }
#stickerEditor p { color: #fff; margin: 0; font-size: .9rem; opacity: .85 }
#stickerEditor input[type=text] { width: min(280px, 74vw); border-radius: 10px; border: 1px solid var(--line); padding: 9px 12px; font: inherit; text-transform: uppercase }
#stickerEditor input[type=range] { width: min(280px, 74vw) }
#stickerEditor .acc { display: flex; gap: 10px }
#chatEnviar { touch-action: none; width: 42px; height: 42px; height: 42px; border-radius: 50%; border: 0; background: var(--accent); color: var(--bg); font-size: 1.1rem; flex: none }
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

  window.iniciarChat = function ({ sb, canal, viaje, yo, nombres, db }) {
    const L = window.ChatLogica;
    const $ = (id) => document.getElementById(id);
    const otro = () => (yo() === 'A' ? 'B' : 'A');
    const CAMPOS = 'id,autor,tipo,texto,reacciones,creado,archivo,ancho,alto,duracion_ms';
    const M = window.ChatMedios, medios = new Map(); // id → nodo de foto/audio, se reusa entre redibujos
    let presionLargaHasta = 0; // el click que sigue a una presión larga no abre el visor
    let lista = [], hayMas = false, selId = null, timer = null, enviando = false;
    const TAM = 50, tactil = matchMedia('(pointer: coarse)').matches;
    const sinHash = () => location.pathname + location.search;
    if (!localStorage.getItem('chatVisto')) localStorage.setItem('chatVisto', String(Date.now()));
    const visto = () => Number(localStorage.getItem('chatVisto')) || 0;
    const marcarVisto = () => { if (!document.hidden) localStorage.setItem('chatVisto', String(Math.max(visto(), L.ultimoCreado(lista)))); };
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
    <label class="adj" for="chatFoto" aria-label="Mandar foto">📷</label><button type="button" class="adj" id="chatStickersBtn" aria-label="Stickers">😀</button><input type="file" id="chatFoto" accept="image/*" hidden>
    <textarea id="chatTexto" rows="1" enterkeyhint="enter" maxlength="${L.MAX_TEXTO}" placeholder="Mensaje" aria-label="Mensaje"></textarea>
    <button type="submit" id="chatEnviar" aria-label="Grabar audio">🎤</button>
    <div id="chatGrabando" hidden><span class="rec"></span><span class="t">0:00</span><span class="cancelar">◀ deslizá para cancelar</span></div>
  </form>
  <div id="chatVisor" hidden role="dialog" aria-label="Foto"><img alt=""></div>
  <div id="chatStickers" hidden role="dialog" aria-label="Stickers">
    <div class="tabs2" role="tablist"><button type="button" data-stab="nuestros" aria-selected="true">Nuestros</button><button type="button" data-stab="giphy" aria-selected="false">GIPHY</button>
      <button type="button" class="cerrar" id="chatStickersCerrar" aria-label="Cerrar">✕</button></div>
    <div class="cuerpo" data-spanel="nuestros"><div class="grilla"></div><input type="file" id="stickerInput" accept="image/*" hidden></div>
    <div class="cuerpo" data-spanel="giphy" hidden><input type="search" id="giphyQ" placeholder="Buscá: homero, messi, shrek…" aria-label="Buscar en GIPHY" enterkeyhint="search"><div class="grilla"></div><div class="giphy">Powered by GIPHY</div></div>
  </div>
  <div id="chatAcciones" hidden>
    <div class="reac">${L.REACCIONES.map((r) => `<button type="button" data-reac="${r}" aria-label="Reaccionar ${r}">${r}</button>`).join('')}</div>
    <div class="fila"><button type="button" class="btn ghost" id="chatCopiar">Copiar</button><button type="button" class="btn ghost" id="chatBorrar" hidden>Borrar</button><button type="button" class="btn ghost" id="chatCancelar">Cancelar</button></div>
  </div>
</section>`);

    const ajustarPadding = () => { document.body.style.paddingBottom = ($('chatBarra').offsetHeight + 8) + 'px'; };
    window.addEventListener('resize', ajustarPadding);

    /* ---------- pintar ---------- */
    function pintarCabeceras() {
      const n = nombres(), o = otro();
      document.querySelectorAll('#chatBarra .av, #chatPanel .av').forEach((e) => pintarAvatar(e, o));
      pintarAvatar($('perfilAv'), yo());
      document.querySelectorAll('#soy [data-soy]').forEach((b) => {
        const url = avatarDe(b.dataset.soy), img = b.querySelector('img');
        if (url && img?.dataset.u !== url) { const i = img || document.createElement('img'); i.alt = ''; i.src = url; i.dataset.u = url; if (!img) b.prepend(i); }
        else if (!url && img) img.remove();
      });
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
        const hora = document.createElement('span'); hora.className = 'hora'; hora.textContent = L.horaCorta(m.creado);
        if (m.tipo === 'sticker') {
          bur.classList.add('sticker', 'media'); if (m.subiendo) bur.classList.add('subiendo');
          bur.appendChild(nodoSticker(m));
        } else if (m.tipo === 'foto' || m.tipo === 'audio') {
          bur.classList.add('media'); if (m.subiendo) bur.classList.add('subiendo');
          bur.appendChild(m.tipo === 'foto' ? nodoFoto(m) : nodoAudio(m));
          if (m.subiendo) { const e = document.createElement('div'); e.className = 'estado'; e.textContent = 'Subiendo…'; bur.appendChild(e); }
        } else { const txt = document.createElement('div'); txt.className = 'txt'; txt.textContent = m.texto || L.resumen(m); bur.appendChild(txt); }
        bur.appendChild(hora); fila.appendChild(bur);
        const rs = Object.values(m.reacciones || {});
        if (rs.length) { const r = document.createElement('div'); r.className = 'reacs'; r.textContent = rs[0] === rs[1] ? `${rs[0]} 2` : rs.join(' '); fila.appendChild(r); }
        cont.appendChild(fila);
      }
      if (alFondo) cont.scrollTop = cont.scrollHeight;
    }
    const pintar = () => { pintarCabeceras(); if (abierto()) pintarLista(); };

    /* ---------- foto de perfil: doc perfil/<A|B> = { foto: path|null, v } ---------- */
    const perfiles = { A: null, B: null };
    function avatarDe(k) { const p = perfiles[k]?.foto; return p ? M.firmada(p) : null; }
    window.avatarDe = avatarDe;
    function pintarAvatar(el, k) {
      if (!el) return;
      const url = avatarDe(k), n = nombres();
      el.style.background = `var(--${k.toLowerCase()})`;
      const img = el.querySelector('img');
      if (url) { if (img?.dataset.u !== url) { const i = document.createElement('img'); i.alt = ''; i.src = url; i.dataset.u = url; i.onerror = () => { i.remove(); el.textContent = (n[k] || '?').trim().charAt(0).toUpperCase(); }; el.replaceChildren(i); } }
      else { el.textContent = (n[k] || '?').trim().charAt(0).toUpperCase(); }
    }
    if (db) for (const k of ['A', 'B']) db.doc('perfil/' + k).onSnapshot((d) => {
      perfiles[k] = d.exists ? d.data() : null;
      const p = perfiles[k]?.foto;
      if (p) M.firmar(sb, [p]).then(pintar).catch(console.error); else pintar();
    });

    const ajustes = document.querySelector('[data-p="ajustes"]');
    ajustes?.querySelector('h3')?.insertAdjacentHTML('afterend', `
<div id="perfilBloque"><div class="av" id="perfilAv" aria-hidden="true"></div>
  <div><div style="font-weight:700">Tu foto</div><div class="hint">Se ve en el chat y en "Soy".</div>
  <div class="acc" style="margin-top:8px"><label class="btn" id="fotoPerfilBtn" for="fotoPerfilInput">Elegir foto</label>
  <button type="button" class="btn ghost" id="fotoPerfilQuitar">Quitar foto</button></div></div>
  <input type="file" id="fotoPerfilInput" accept="image/*" hidden></div>`);
    document.body.insertAdjacentHTML('beforeend', `
<div id="recorte" hidden role="dialog" aria-label="Acomodá tu foto"><p>Arrastrá para acomodarla</p><canvas width="600" height="600"></canvas>
  <input type="range" id="recorteZoom" min="1" max="4" step="0.01" value="1" aria-label="Zoom">
  <div class="acc"><button type="button" class="btn ghost" id="recorteCancelar">Cancelar</button><button type="button" class="btn" id="recorteUsar">Usar esta foto</button></div></div>`);

    let rc = null; // { bm, cx, cy, zoom }
    function dibujarRecorte() {
      const cv = document.querySelector('#recorte canvas'), { bm, zoom } = rc;
      const corte = Math.min(bm.width, bm.height) / zoom;
      rc.cx = Math.min(Math.max(corte / 2, rc.cx), bm.width - corte / 2); rc.cy = Math.min(Math.max(corte / 2, rc.cy), bm.height - corte / 2);
      cv.getContext('2d').drawImage(bm, rc.cx - corte / 2, rc.cy - corte / 2, corte, corte, 0, 0, cv.width, cv.height);
    }
    const cerrarRecorte = () => { $('recorte').hidden = true; rc?.bm.close?.(); rc = null; };
    $('fotoPerfilInput').addEventListener('change', async (e) => {
      const file = e.target.files?.[0]; e.target.value = ''; if (!file) return;
      try { const bm = await createImageBitmap(file, { imageOrientation: 'from-image' }); rc = { bm, cx: bm.width / 2, cy: bm.height / 2, zoom: 1 }; }
      catch (err) { console.error(err); window.aviso?.('No se pudo abrir esa imagen.'); return; }
      $('recorteZoom').value = 1; $('recorte').hidden = false; dibujarRecorte();
      history.pushState({ recorte: 1 }, '');
    });
    $('recorteZoom').addEventListener('input', (e) => { if (rc) { rc.zoom = Number(e.target.value); dibujarRecorte(); } });
    { const cv = document.querySelector('#recorte canvas'); let px = 0, py = 0, arrastrando = false;
      cv.addEventListener('pointerdown', (e) => { arrastrando = true; px = e.clientX; py = e.clientY; cv.setPointerCapture(e.pointerId); });
      cv.addEventListener('pointermove', (e) => {
        if (!arrastrando || !rc) return;
        const escala = (Math.min(rc.bm.width, rc.bm.height) / rc.zoom) / cv.getBoundingClientRect().width;
        rc.cx -= (e.clientX - px) * escala; rc.cy -= (e.clientY - py) * escala; px = e.clientX; py = e.clientY; dibujarRecorte();
      });
      ['pointerup', 'pointercancel'].forEach((ev) => cv.addEventListener(ev, () => { arrastrando = false; })); }
    $('recorteCancelar').addEventListener('click', () => { if (history.state?.recorte) history.back(); else cerrarRecorte(); });
    window.addEventListener('popstate', () => { if (!$('recorte').hidden && !history.state?.recorte) cerrarRecorte(); });
    $('recorteUsar').addEventListener('click', async () => {
      if (!rc) return;
      const b = $('recorteUsar'); b.disabled = true;
      try {
        const blob = await M.recortarCuadrado(rc.bm, { x: rc.cx, y: rc.cy, zoom: rc.zoom }, 400, 0.85);
        const k = yo(), anterior = perfiles[k]?.foto, archivo = L.rutaArchivo(viaje, 'perfil', k + '-' + Date.now());
        const up = await sb.storage.from(M.BUCKET).upload(archivo, blob, { contentType: blob.type });
        if (up.error) throw up.error;
        try { await db.doc('perfil/' + k).set({ foto: archivo, v: Date.now() }); }
        catch (err) { sb.storage.from(M.BUCKET).remove([archivo]); throw err; }
        M.firmar(sb, [archivo]).then(pintar).catch(() => {});
        if (anterior) sb.storage.from(M.BUCKET).remove([anterior]);
        if (history.state?.recorte) history.back(); else cerrarRecorte();
      } catch (err) { console.error(err); window.aviso?.('No se pudo guardar la foto. Probá de nuevo.'); }
      finally { b.disabled = false; }
    });
    $('fotoPerfilQuitar').addEventListener('click', async () => {
      const k = yo(), anterior = perfiles[k]?.foto; if (!anterior) return;
      try { await db.doc('perfil/' + k).set({ foto: null, v: Date.now() }); sb.storage.from(M.BUCKET).remove([anterior]); }
      catch (err) { console.error(err); window.aviso?.('No se pudo quitar la foto.'); }
    });

    /* ---------- fotos y audios ---------- */
    // ruta que muestra cada burbuja: las fotos usan su miniatura liviana, el visor usa el original
    const rutaDe = (m) => (m.tipo === 'foto' ? M.rutaMini(m.archivo) : m.archivo);
    const porFirmar = new Set(); let firmando = false;
    function pedirFirma(path) {
      if (!M.puedeFirmar(path)) return; // sin señal: espera (backoff); rota: no se repide
      porFirmar.add(path);
      if (firmando) return;
      firmando = true;
      setTimeout(async () => {
        const paths = [...porFirmar]; porFirmar.clear();
        try { await M.firmar(sb, paths); } catch (e) { console.warn('firmas en espera:', e.message); }
        firmando = false;
        for (const [id, nodo] of medios) { const m = lista.find((x) => x.id === id); if (m && paths.includes(rutaDe(m))) ponerSrc(nodo, m); }
        if (!$('chatStickers').hidden) pintarNuestros();
      }, 0);
    }
    function ponerSrc(nodo, m) {
      const el = nodo.tagName === 'IMG' ? nodo : nodo.querySelector('audio');
      if (m.local) { if (!el.getAttribute('src')) el.src = m.local; return; }
      const ruta = rutaDe(m), actual = el.getAttribute('src');
      if (el.dataset.ruta === ruta && actual && !actual.startsWith('blob:') && M.vigente(ruta)) return; // ya tiene su firmada vigente
      const url = M.firmada(ruta);
      if (url && url !== actual && !(el.tagName === 'AUDIO' && !el.paused)) { el.src = url; el.dataset.ruta = ruta; }
      if (!M.vigente(ruta)) pedirFirma(ruta);
    }
    // volver a tener señal o volver a la app: se reintenta lo que quedó esperando
    const reintentar = () => { M.reintentarYa(); pintar(); };
    window.addEventListener('online', reintentar);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) reintentar(); });
    // borrados remotos o reconciliados: se corta el audio y se suelta el nodo
    function limpiarMedios() {
      for (const [id, nodo] of medios) if (!id.startsWith('tmp-') && !lista.some((x) => x.id === id)) { nodo.querySelector?.('audio')?.pause(); medios.delete(id); }
    }
    function nodoSticker(m) {
      let img = medios.get(m.id);
      if (!img) { img = document.createElement('img'); img.className = 'stk'; img.alt = 'Sticker'; img.loading = 'lazy'; img.draggable = false; medios.set(m.id, img); }
      img.dataset.id = m.id;
      if (m.externo) { if (img.getAttribute('src') !== m.externo) img.src = m.externo; } else ponerSrc(img, m);
      return img;
    }
    function nodoFoto(m) {
      let img = medios.get(m.id);
      if (!img) {
        img = document.createElement('img'); img.className = 'foto'; img.alt = 'Foto'; img.decoding = 'async'; img.loading = 'lazy'; img.draggable = false;
        img.addEventListener('error', () => { // URL vencida u objeto que falta: se re-firma una vez
          const mm = lista.find((x) => x.id === img.dataset.id); if (!mm || img.dataset.reintento) return;
          img.dataset.reintento = '1'; img.removeAttribute('src'); M.reintentarYa(); pedirFirma(rutaDe(mm));
        });
        img.addEventListener('load', () => { delete img.dataset.reintento; });
        medios.set(m.id, img);
      }
      if (m.ancho && m.alto) img.style.aspectRatio = m.ancho + ' / ' + m.alto;
      img.style.width = m.alto > m.ancho ? 'min(190px, 48vw)' : 'min(250px, 62vw)';
      img.dataset.id = m.id; ponerSrc(img, m);
      return img;
    }
    let sonando = null;
    function nodoAudio(m) {
      let d = medios.get(m.id);
      if (!d) {
        d = document.createElement('div'); d.className = 'audio';
        const play = document.createElement('button'); play.type = 'button'; play.className = 'play'; play.textContent = '▶'; play.setAttribute('aria-label', 'Reproducir audio');
        const av = document.createElement('div'); av.className = 'avance'; av.appendChild(document.createElement('i'));
        const dur = document.createElement('span'); dur.className = 'dur';
        const au = document.createElement('audio'); au.preload = 'metadata';
        au.addEventListener('timeupdate', () => { const total = au.duration && isFinite(au.duration) ? au.duration * 1000 : Number(d.dataset.ms) || 1; av.firstChild.style.width = Math.min(100, (au.currentTime * 1000 / total) * 100) + '%'; dur.textContent = L.duracionTexto(au.currentTime * 1000); });
        au.addEventListener('play', () => { play.textContent = '⏸'; play.setAttribute('aria-label', 'Pausar audio'); });
        const parar = () => { play.textContent = '▶'; play.setAttribute('aria-label', 'Reproducir audio'); };
        au.addEventListener('pause', parar);
        au.addEventListener('ended', () => { parar(); au.currentTime = 0; av.firstChild.style.width = '0'; dur.textContent = L.duracionTexto(Number(d.dataset.ms)); });
        d.append(play, av, dur, au); medios.set(m.id, d);
      }
      d.dataset.ms = m.duracion_ms || 0; d.dataset.id = m.id;
      const au = d.querySelector('audio');
      if (au.paused) d.querySelector('.dur').textContent = L.duracionTexto(m.duracion_ms);
      ponerSrc(d, m);
      return d;
    }
    function tocarAudio(d) {
      const au = d.querySelector('audio');
      if (!au.paused) return au.pause();
      if (sonando && sonando !== au) sonando.pause();
      sonando = au;
      const m = lista.find((x) => x.id === d.dataset.id);
      const ir = () => au.play().catch((e) => { console.error(e); window.aviso?.('No se pudo reproducir el audio.'); });
      if (!m || m.local || M.vigente(m.archivo)) { if (m && !au.getAttribute('src')) ponerSrc(d, m); return ir(); }
      M.reintentarYa();
      M.firmar(sb, [m.archivo]).then(() => { const t = au.currentTime; au.src = M.firmada(m.archivo); au.dataset.ruta = m.archivo; au.currentTime = t; ir(); })
        .catch(() => window.aviso?.('No se pudo cargar el audio. Revisá la conexión.'));
    }

    /* ---------- grabar audio: mantener 🎤, soltar envía, deslizar a la izquierda cancela ---------- */
    let rec = null, x0 = 0, cancelado = false, soltado = false, reloj = null;
    const modoMic = () => !$('chatTexto').value.trim();
    function actualizarBoton() {
      const mic = modoMic(), b = $('chatEnviar');
      b.textContent = mic ? '🎤' : '➤'; b.setAttribute('aria-label', mic ? 'Mantené apretado para grabar un audio' : 'Enviar');
    }
    $('chatTexto').addEventListener('input', actualizarBoton);
    function terminarUi() { clearInterval(reloj); reloj = null; $('chatGrabando').hidden = true; $('chatGrabando').classList.remove('soltar'); $('chatEnviar').classList.remove('grabando'); }
    $('chatEnviar').addEventListener('pointerdown', async (e) => {
      if (!modoMic() || rec) return;
      e.preventDefault();
      try { $('chatEnviar').setPointerCapture(e.pointerId); } catch {}
      x0 = e.clientX; cancelado = false; soltado = false;
      const r = M.grabadora(); rec = r;
      try { await r.iniciar(); }
      catch (err) {
        rec = null; terminarUi();
        window.aviso?.(err.message === 'sin-permiso' ? 'Para mandar audios, permití el micrófono en Chrome (candado de la barra ▸ Micrófono).'
          : err.message === 'sin-mic' ? 'No se encontró micrófono, o lo está usando otra app (¿una llamada?).'
          : 'Este navegador no puede grabar audios.');
        return;
      }
      if (soltado || cancelado) { r.cancelar(); rec = null; return; }
      navigator.vibrate?.(20);
      $('chatEnviar').classList.add('grabando'); $('chatGrabando').hidden = false;
      reloj = setInterval(() => {
        $('chatGrabando').querySelector('.t').textContent = L.duracionTexto(r.ms());
        if (r.ms() >= L.AUDIO_MAX_MS) finalizar(); // tope de 2 minutos: se manda solo
      }, 200);
    });
    $('chatEnviar').addEventListener('pointermove', (e) => {
      if (!rec || !reloj) return;
      const lejos = e.clientX - x0 < -80;
      $('chatGrabando').classList.toggle('soltar', lejos);
      if (lejos && !cancelado) { cancelado = true; rec.cancelar(); rec = null; terminarUi(); navigator.vibrate?.([10, 40, 10]); }
    });
    async function finalizar() {
      soltado = true;
      const r = rec; if (!r) return; rec = null; terminarUi();
      const res = await r.detener();
      if (!res || cancelado || !L.audioValido(Math.min(res.ms, L.AUDIO_MAX_MS))) return;
      enviarAudio(res.blob, Math.round(Math.min(res.ms, L.AUDIO_MAX_MS)));
    }
    $('chatEnviar').addEventListener('pointerup', () => { soltado = true; if (rec && reloj) finalizar(); });
    const cancelarGrabacion = () => { soltado = true; cancelado = true; if (rec) { rec.cancelar(); rec = null; } terminarUi(); };
    $('chatEnviar').addEventListener('pointercancel', cancelarGrabacion); // cortina, llamada entrante, gesto del sistema
    document.addEventListener('visibilitychange', () => { if (document.hidden && (rec || reloj)) cancelarGrabacion(); });
    async function enviarAudio(blob, ms) {
      const tmp = { id: 'tmp-a' + Date.now(), autor: yo(), tipo: 'audio', creado: new Date().toISOString(), reacciones: {}, subiendo: true, duracion_ms: ms, local: URL.createObjectURL(blob) };
      lista = L.fusionar(lista, tmp); pintar(); $('chatLista').scrollTop = $('chatLista').scrollHeight;
      try {
        const archivo = L.rutaArchivo(viaje, 'audio', crypto.randomUUID());
        const up = await sb.storage.from(M.BUCKET).upload(archivo, blob, { contentType: blob.type || 'audio/webm' });
        if (up.error) throw up.error;
        const { data, error } = await sb.from('mensajes').insert({ viaje, autor: yo(), tipo: 'audio', archivo, duracion_ms: ms }).select(CAMPOS).single();
        if (error) { sb.storage.from(M.BUCKET).remove([archivo]); throw error; }
        medios.delete(tmp.id);
        lista = L.fusionar(L.quitar(lista, tmp.id), data); marcarVisto(); pintar();
        avisar('nuevo', { m: data });
      } catch (e) {
        console.error(e); lista = L.quitar(lista, tmp.id); medios.delete(tmp.id); pintar();
        window.aviso?.('No se pudo mandar el audio. Revisá la conexión y probá de nuevo.');
      } finally { URL.revokeObjectURL(tmp.local); }
    }

    async function enviarFoto(file) {
      if (!file) return;
      const tmp = { id: 'tmp-' + Date.now(), autor: yo(), tipo: 'foto', creado: new Date().toISOString(), reacciones: {}, subiendo: true, local: URL.createObjectURL(file), ancho: 4, alto: 3 };
      lista = L.fusionar(lista, tmp); pintar(); $('chatLista').scrollTop = $('chatLista').scrollHeight;
      let c, mini;
      try { c = await M.comprimirImagen(file, 1600, 0.8); mini = await M.comprimirImagen(file, 480, 0.7); }
      catch (e) {
        console.error(e); lista = L.quitar(lista, tmp.id); medios.delete(tmp.id); pintar(); URL.revokeObjectURL(tmp.local);
        return window.aviso?.('No se pudo leer esa foto. Probá con otra.');
      }
      Object.assign(tmp, { ancho: c.ancho, alto: c.alto }); pintar();
      const archivo = L.rutaArchivo(viaje, 'foto', crypto.randomUUID()), archivoMini = M.rutaMini(archivo);
      try {
        const up = await sb.storage.from(M.BUCKET).upload(archivo, c.blob, { contentType: c.tipo });
        if (up.error) throw up.error;
        const upMini = await sb.storage.from(M.BUCKET).upload(archivoMini, mini.blob, { contentType: mini.tipo });
        if (upMini.error) { sb.storage.from(M.BUCKET).remove([archivo]); throw upMini.error; }
        const { data, error } = await sb.from('mensajes').insert({ viaje, autor: yo(), tipo: 'foto', archivo, ancho: c.ancho, alto: c.alto }).select(CAMPOS).single();
        if (error) { sb.storage.from(M.BUCKET).remove([archivo, archivoMini]); throw error; }
        medios.delete(tmp.id);
        lista = L.fusionar(L.quitar(lista, tmp.id), data); marcarVisto(); pintar();
        avisar('nuevo', { m: data });
      } catch (e) {
        console.error(e); lista = L.quitar(lista, tmp.id); medios.delete(tmp.id); pintar();
        window.aviso?.('No se pudo mandar la foto. Revisá la conexión y probá de nuevo.');
      } finally { URL.revokeObjectURL(tmp.local); }
    }
    $('chatFoto').addEventListener('change', (e) => { const f = e.target.files?.[0]; e.target.value = ''; enviarFoto(f); });

    /* ---------- stickers: selector (Nuestros / GIPHY) y editor ---------- */
    let stickers = [], editando = false;
    if (db) db.collection('stickers').orderBy('creado', 'desc').onSnapshot((q) => {
      stickers = q.docs.map((d) => ({ id: d.id, ...d.data() }));
      M.firmar(sb, stickers.map((x) => x.archivo)).catch(() => {}).finally(() => { if (!$('chatStickers').hidden) pintarNuestros(); });
    });
    function pintarNuestros() {
      const g = document.querySelector('[data-spanel="nuestros"] .grilla'); g.replaceChildren();
      const crear = document.createElement('label'); crear.className = 'crear'; crear.htmlFor = 'stickerInput'; crear.textContent = '+ Crear'; g.appendChild(crear);
      for (const st of stickers) {
        const d = document.createElement('div'); const url = M.firmada(st.archivo);
        const img = document.createElement('img'); img.alt = 'Sticker'; img.loading = 'lazy'; img.draggable = false; img.dataset.archivo = st.archivo;
        if (url) img.src = url; else pedirFirma(st.archivo);
        d.appendChild(img);
        if (editando) { const x = document.createElement('button'); x.type = 'button'; x.className = 'quitar'; x.dataset.quitarStk = st.id; x.textContent = '✕'; x.setAttribute('aria-label', 'Quitar sticker'); d.appendChild(x); }
        g.appendChild(d);
      }
      if (stickers.length) { const e = document.createElement('button'); e.type = 'button'; e.className = 'link'; e.id = 'stkEditar'; e.textContent = editando ? 'Listo' : 'Quitar algunos'; e.style.gridColumn = '1 / -1'; g.appendChild(e); }
      else { const p = document.createElement('p'); p.className = 'nota'; p.style.gridColumn = '1 / -1'; p.textContent = 'Todavía no hay stickers. Creá el primero con una foto.'; g.appendChild(p); }
    }
    function abrirStickers() {
      cerrarAcciones(); editando = false;
      $('chatStickers').hidden = false; history.pushState({ chat: 1, stk: 1 }, '', '#chat');
      mostrarTabStk(localStorage.getItem('stkTab') || 'nuestros');
    }
    const ocultarStickers = () => { $('chatStickers').hidden = true; };
    const cerrarStickers = () => { if (!$('chatStickers').hidden && history.state?.stk) history.back(); else ocultarStickers(); };
    function mostrarTabStk(t) {
      document.querySelectorAll('#chatStickers [data-stab]').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.stab === t)));
      document.querySelectorAll('#chatStickers [data-spanel]').forEach((p) => { p.hidden = p.dataset.spanel !== t; });
      localStorage.setItem('stkTab', t);
      if (t === 'nuestros') pintarNuestros(); else window.alAbrirGiphy?.();
    }
    $('chatStickersBtn').addEventListener('click', abrirStickers);
    $('chatStickersCerrar').addEventListener('click', cerrarStickers);
    document.querySelector('#chatStickers .tabs2').addEventListener('click', (e) => { const b = e.target.closest('[data-stab]'); if (b) mostrarTabStk(b.dataset.stab); });
    async function mandarSticker(fuente) {
      cerrarStickers();
      const { data, error } = await sb.from('mensajes').insert({ viaje, autor: yo(), tipo: 'sticker', ...fuente }).select(CAMPOS).single();
      if (error) { console.error(error); return window.aviso?.('No se pudo mandar el sticker. Revisá la conexión.'); }
      lista = L.fusionar(lista, data); marcarVisto(); pintar(); $('chatLista').scrollTop = $('chatLista').scrollHeight;
      avisar('nuevo', { m: data });
    }
    window.mandarStickerExterno = (url) => mandarSticker({ externo: url });
    document.querySelector('[data-spanel="nuestros"] .grilla').addEventListener('click', async (e) => {
      if (e.target.id === 'stkEditar') { editando = !editando; return pintarNuestros(); }
      const q = e.target.closest('[data-quitar-stk]');
      if (q) {
        const st = stickers.find((x) => x.id === q.dataset.quitarStk); if (!st) return;
        await db.doc('stickers/' + st.id).delete().catch(console.error);
        const { data: usos } = await sb.from('mensajes').select('id').eq('archivo', st.archivo).limit(1);
        if (!usos?.length) sb.storage.from(M.BUCKET).remove([st.archivo]); // si algún mensaje lo usa, el archivo queda
        return;
      }
      const img = e.target.closest('img[data-archivo]'); if (img && !editando) mandarSticker({ archivo: img.dataset.archivo });
    });

    // editor: recorte cuadrado + texto
    let ed = null;
    document.body.insertAdjacentHTML('beforeend', `
<div id="stickerEditor" hidden role="dialog" aria-label="Crear sticker"><p>Arrastrá para acomodarlo</p><canvas width="512" height="512"></canvas>
  <input type="range" id="stickerZoom" min="1" max="4" step="0.01" value="1" aria-label="Zoom">
  <input type="text" id="stickerTexto" maxlength="30" placeholder="Texto (opcional)" aria-label="Texto del sticker">
  <div class="acc"><button type="button" class="btn ghost" id="stickerCancelar">Cancelar</button><button type="button" class="btn" id="stickerGuardar">Guardar y mandar</button></div></div>`);
    let dibujando = false, otraVez = false;
    async function dibujarEd() {
      if (!ed) return;
      if (dibujando) { otraVez = true; return; } // se redibuja al terminar, con el último estado
      dibujando = true; otraVez = false;
      const corte = Math.min(ed.bm.width, ed.bm.height) / ed.zoom;
      ed.cx = Math.min(Math.max(corte / 2, ed.cx), ed.bm.width - corte / 2); ed.cy = Math.min(Math.max(corte / 2, ed.cy), ed.bm.height - corte / 2);
      const blob = await M.hacerSticker(ed.bm, { x: ed.cx, y: ed.cy, zoom: ed.zoom }, $('stickerTexto').value);
      const bm = await createImageBitmap(blob); const cv = document.querySelector('#stickerEditor canvas'), g = cv.getContext('2d');
      g.clearRect(0, 0, cv.width, cv.height); g.drawImage(bm, 0, 0); bm.close?.();
      dibujando = false;
      if (otraVez) dibujarEd();
    }
    const cerrarEditor = () => { $('stickerEditor').hidden = true; ed?.bm.close?.(); ed = null; };
    $('stickerInput').addEventListener('change', async (e) => {
      const file = e.target.files?.[0]; e.target.value = ''; if (!file) return;
      try { const bm = await createImageBitmap(file, { imageOrientation: 'from-image' }); ed = { bm, cx: bm.width / 2, cy: bm.height / 2, zoom: 1 }; }
      catch (err) { console.error(err); return window.aviso?.('No se pudo abrir esa imagen.'); }
      $('stickerTexto').value = ''; $('stickerZoom').value = 1; $('stickerEditor').hidden = false; dibujarEd();
      history.pushState({ chat: 1, stk: 1, stked: 1 }, '', '#chat');
    });
    $('stickerZoom').addEventListener('input', (e) => { if (ed) { ed.zoom = Number(e.target.value); dibujarEd(); } });
    $('stickerTexto').addEventListener('input', () => dibujarEd());
    { const cv = document.querySelector('#stickerEditor canvas'); let px = 0, py = 0, arr = false;
      cv.addEventListener('pointerdown', (e) => { arr = true; px = e.clientX; py = e.clientY; cv.setPointerCapture(e.pointerId); });
      cv.addEventListener('pointermove', (e) => {
        if (!arr || !ed) return;
        const esc = (Math.min(ed.bm.width, ed.bm.height) / ed.zoom) / cv.getBoundingClientRect().width;
        ed.cx -= (e.clientX - px) * esc; ed.cy -= (e.clientY - py) * esc; px = e.clientX; py = e.clientY; dibujarEd();
      });
      ['pointerup', 'pointercancel'].forEach((ev) => cv.addEventListener(ev, () => { arr = false; })); }
    $('stickerCancelar').addEventListener('click', () => { if (history.state?.stked) history.back(); else cerrarEditor(); });
    $('stickerGuardar').addEventListener('click', async () => {
      if (!ed) return; const b = $('stickerGuardar'); b.disabled = true;
      const archivo = L.rutaArchivo(viaje, 'sticker', crypto.randomUUID());
      try {
        const blob = await M.hacerSticker(ed.bm, { x: ed.cx, y: ed.cy, zoom: ed.zoom }, $('stickerTexto').value);
        const up = await sb.storage.from(M.BUCKET).upload(archivo, blob, { contentType: 'image/webp' });
        if (up.error) throw up.error;
        const id = archivo.split('/').pop().replace('.webp', '');
        try { await db.doc('stickers/' + id).set({ archivo, autor: yo(), creado: Date.now() }); }
        catch (err) { sb.storage.from(M.BUCKET).remove([archivo]); throw err; }
        cerrarEditor(); ocultarStickers();
        if (history.state?.stked) history.go(-2); else if (history.state?.stk) history.back();
        mandarSticker({ archivo });
      } catch (err) { console.error(err); window.aviso?.('No se pudo guardar el sticker. Probá de nuevo.'); }
      finally { b.disabled = false; }
    });

    async function abrirVisor(id) {
      const m = lista.find((x) => x.id === id); if (!m) return;
      const img = $('chatVisor').querySelector('img');
      img.src = medios.get(id)?.src || ''; // la miniatura mientras llega el original
      $('chatVisor').hidden = false;
      history.pushState({ chat: 1, foto: 1 }, '', '#chat');
      if (m.local) return;
      try { M.reintentarYa(); await M.firmar(sb, [m.archivo]); if (!$('chatVisor').hidden) img.src = M.firmada(m.archivo); }
      catch (e) { console.warn(e); }
    }
    const cerrarVisor = () => { $('chatVisor').hidden = true; $('chatVisor').querySelector('img').removeAttribute('src'); };
    $('chatVisor').addEventListener('click', () => { if (history.state?.foto) history.back(); else cerrarVisor(); });
    window.alCambiarSoyChat = pintar;

    /* ---------- datos ---------- */
    const avisar = (accion, payload) => canal.send({ type: 'broadcast', event: 'chat', payload: { accion, ...payload } });
    async function cargar(antesDe) {
      let q = sb.from('mensajes').select(CAMPOS).eq('viaje', viaje).order('creado', { ascending: false }).limit(TAM);
      if (antesDe) q = q.lt('creado', antesDe);
      const { data, error } = await q;
      if (error) { console.error(error); return; }
      const cont = $('chatLista'), altoAntes = cont.scrollHeight, arriba = cont.scrollTop;
      if (antesDe) { for (const m of data) lista = L.fusionar(lista, m); hayMas = data.length === TAM; }
      else {
        // ¿ya había cargado páginas más viejas que esta? entonces "hay más" lo decidió la paginación
        const corte = data.length ? Date.parse(data[data.length - 1].creado) : 0;
        const tieneViejos = lista.some((m) => Date.parse(m.creado) < corte);
        hayMas = data.length < TAM ? false : (tieneViejos ? hayMas : true);
        lista = L.reconciliar(lista, data, TAM); limpiarMedios();
      }
      if (abierto()) marcarVisto();
      pintar();
      if (antesDe) cont.scrollTop = arriba + (cont.scrollHeight - altoAntes); // que no salte al anteponer
    }
    canal.on('broadcast', { event: 'chat' }, ({ payload: p }) => {
      if (!p) return;
      if ((p.accion === 'nuevo' || p.accion === 'cambio') && p.m?.id) lista = L.fusionar(lista, p.m);
      else if (p.accion === 'borrado' && p.id) { lista = L.quitar(lista, p.id); limpiarMedios(); }
      else return;
      if (abierto()) marcarVisto();
      pintar();
    });
    document.addEventListener('visibilitychange', () => { if (!document.hidden) cargar(); });

    async function enviar() {
      const t = $('chatTexto').value;
      if (enviando || !L.textoValido(t)) return;
      enviando = true; $('chatEnviar').disabled = true;
      $('chatTexto').value = ''; autoAlto(); actualizarBoton();
      const { data, error } = await sb.from('mensajes').insert({ viaje, autor: yo(), texto: t.trim() }).select(CAMPOS).single();
      enviando = false; $('chatEnviar').disabled = false;
      if (error) {
        console.error(error);
        if (!$('chatTexto').value) { $('chatTexto').value = t; autoAlto(); actualizarBoton(); }
        window.aviso?.('No se pudo mandar el mensaje. Revisá la conexión y probá de nuevo.'); return;
      }
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
    function cerrarPanel() { ocultarAcciones(); ocultarStickers(); cerrarEditor(); $('chatPanel').hidden = true; document.documentElement.style.overflow = ''; marcarVisto(); pintar(); }
    $('chatBarra').addEventListener('click', abrirPanel);
    $('chatBarra').addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); abrirPanel(); } });
    $('chatCerrar').addEventListener('click', () => { if (history.state?.chat) history.back(); else { history.replaceState(null, '', sinHash()); cerrarPanel(); } });
    window.addEventListener('popstate', () => {
      if (!$('stickerEditor').hidden && !history.state?.stked) { cerrarEditor(); if (location.hash === '#chat' && history.state?.stk) return; }
      if (!$('chatStickers').hidden && !history.state?.stk) { ocultarStickers(); if (location.hash === '#chat') return; }
      if (!$('chatVisor').hidden && !history.state?.foto) { cerrarVisor(); if (location.hash === '#chat') return; }
      if (!$('chatAcciones').hidden && !history.state?.acc) { ocultarAcciones(); if (location.hash === '#chat') return; }
      if (location.hash === '#chat') abrirPanel(); else if (abierto()) cerrarPanel();
    });
    navigator.serviceWorker?.addEventListener('message', (e) => { if (e.data?.abrir === 'chat') abrirPanel(); });

    /* ---------- escribir ---------- */
    function autoAlto() { const t = $('chatTexto'); t.style.height = 'auto'; t.style.height = Math.min(t.scrollHeight, 130) + 'px'; }
    $('chatTexto').addEventListener('input', autoAlto);
    $('chatTexto').addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey && !tactil) { e.preventDefault(); enviar(); } });
    $('chatForm').addEventListener('submit', (e) => { e.preventDefault(); if (!modoMic()) enviar(); });

    /* ---------- reacciones y borrar (mantener apretado) ---------- */
    function abrirAcciones(id) {
      const m = lista.find((x) => x.id === id); if (!m) return;
      selId = id; pintarLista();
      document.querySelectorAll('#chatAcciones [data-reac]').forEach((b) => b.classList.toggle('mia', m.reacciones?.[yo()] === b.dataset.reac));
      $('chatCopiar').hidden = !m.texto;
      const borrar = $('chatBorrar'); borrar.hidden = m.autor !== yo(); borrar.classList.remove('armed'); borrar.textContent = 'Borrar';
      $('chatAcciones').hidden = false;
      history.pushState({ chat: 1, acc: 1 }, '', '#chat');
    }
    function ocultarAcciones() { $('chatAcciones').hidden = true; if (selId) { selId = null; if (abierto()) pintarLista(); } }
    function cerrarAcciones() { const habia = !$('chatAcciones').hidden; ocultarAcciones(); if (habia && history.state?.acc) history.back(); }
    const cancelarTimer = () => { clearTimeout(timer); timer = null; };
    $('chatLista').addEventListener('pointerdown', (e) => {
      const b = e.target.closest('.burbuja'); if (!b) return;
      cancelarTimer(); timer = setTimeout(() => { timer = null; presionLargaHasta = Date.now() + 700; navigator.vibrate?.(15); abrirAcciones(b.dataset.id); }, 500);
    });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => $('chatLista').addEventListener(ev, cancelarTimer));
    $('chatLista').addEventListener('scroll', cancelarTimer, { passive: true });
    $('chatLista').addEventListener('contextmenu', (e) => { const b = e.target.closest('.burbuja'); if (b) { e.preventDefault(); cancelarTimer(); abrirAcciones(b.dataset.id); } });
    $('chatLista').addEventListener('click', (e) => {
      if (e.target.id === 'chatMas') return cargar(lista[0]?.creado);
      const pl = e.target.closest('.audio .play'); if (pl) return tocarAudio(pl.closest('.audio'));
      const f = e.target.closest('img.foto'); if (f && Date.now() > presionLargaHasta) abrirVisor(f.dataset.id);
    });
    $('chatCancelar').addEventListener('click', cerrarAcciones);
    $('chatCopiar').addEventListener('click', () => { const m = lista.find((x) => x.id === selId); cerrarAcciones(); if (m?.texto) navigator.clipboard?.writeText(m.texto).catch(() => {}); });
    $('chatAcciones').addEventListener('click', async (e) => {
      const b = e.target.closest('[data-reac]'); if (!b || !selId) return;
      const id = selId, m = lista.find((x) => x.id === id); cerrarAcciones(); if (!m) return;
      const reacciones = L.alternarReaccion(m.reacciones, yo(), b.dataset.reac);
      lista = L.fusionar(lista, { ...m, reacciones }); pintar();
      const { data, error } = await sb.rpc('reaccionar', { p_id: id, p_quien: yo(), p_emoji: b.dataset.reac });
      if (error) { console.error(error); lista = L.fusionar(lista, m); pintar(); window.aviso?.('No se pudo reaccionar. Probá de nuevo.'); return; }
      lista = L.fusionar(lista, data); pintar(); avisar('cambio', { m: data });
    });
    $('chatBorrar').addEventListener('click', async () => {
      const btn = $('chatBorrar');
      if (!btn.classList.contains('armed')) { btn.classList.add('armed'); btn.textContent = '¿Borrar? Tocá de nuevo'; return; }
      const id = selId; cerrarAcciones(); if (!id) return;
      const { error } = await sb.from('mensajes').delete().eq('id', id);
      if (error) { console.error(error); window.aviso?.('No se pudo borrar. Probá de nuevo.'); return; }
      const borrado = lista.find((x) => x.id === id);
      medios.get(id)?.querySelector?.('audio')?.pause();
      lista = L.quitar(lista, id); medios.delete(id); pintar(); avisar('borrado', { id });
      if (borrado?.archivo) sb.storage.from(M.BUCKET).remove(borrado.tipo === 'foto' ? [borrado.archivo, M.rutaMini(borrado.archivo)] : [borrado.archivo]).then(({ error }) => { if (error) console.error(error); });
    });

    pintar();
    cargar();
    if (location.hash === '#chat') { history.replaceState(null, '', sinHash()); abrirPanel(); }
  };
})();
