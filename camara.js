// Cámara a pantalla completa del álbum: zoom, lentes, linterna, tocar para enfocar, exposición, cuadrícula y temporizador.
// window.Camara = { preparar(fuente), crear({ cola, yo, alTocarUltima, mandarAlChat }) -> { abrir({ alChat }), cerrar, abierta } }
(function () {
  const CSS = `
#camara { position: fixed; inset: 0; z-index: 90; background: #000; color: #fff; touch-action: none; user-select: none; -webkit-user-select: none }
#camara[hidden] { display: none }
/* la vista previa muestra la foto entera (3:4 con bandas negras): lo que ves es lo que sale */
#camara video { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain }
#camara video.espejo { transform: scaleX(-1) }
#camara .grilla { position: absolute; inset: 0; pointer-events: none;
  background: linear-gradient(90deg, transparent calc(33.33% - .5px), rgba(255,255,255,.45) calc(33.33% - .5px) calc(33.33% + .5px), transparent calc(33.33% + .5px) calc(66.66% - .5px), rgba(255,255,255,.45) calc(66.66% - .5px) calc(66.66% + .5px), transparent calc(66.66% + .5px)),
              linear-gradient(transparent calc(33.33% - .5px), rgba(255,255,255,.45) calc(33.33% - .5px) calc(33.33% + .5px), transparent calc(33.33% + .5px) calc(66.66% - .5px), rgba(255,255,255,.45) calc(66.66% - .5px) calc(66.66% + .5px), transparent calc(66.66% + .5px)) }
#camara .arriba { position: absolute; top: 0; left: 0; right: 0; display: flex; gap: 6px; align-items: center; padding: calc(10px + env(safe-area-inset-top, 0px)) 10px 10px;
  background: linear-gradient(rgba(0,0,0,.55), transparent) }
#camara .arriba .esp { flex: 1 }
#camara button { font: inherit; color: #fff; background: rgba(0,0,0,.35); border: 0; border-radius: 999px; min-width: 44px; height: 44px; padding: 0 12px; font-size: 1.05rem; font-weight: 700 }
#camara button[aria-pressed="true"] { background: #fff; color: #000 }
#camara .abajo { position: absolute; left: 0; right: 0; bottom: 0; padding: 10px 16px calc(18px + env(safe-area-inset-bottom, 0px)); background: linear-gradient(transparent, rgba(0,0,0,.6)) }
#camara .zooms { display: flex; justify-content: center; gap: 6px; margin-bottom: 8px }
#camara .zooms button { min-width: 40px; height: 34px; font-size: .85rem; padding: 0 8px }
#camara .zooms button.act { background: #fff; color: #000 }
#camara input[type=range] { display: block; width: min(320px, 80%); margin: 0 auto 12px; accent-color: #fff }
#camara .fila { display: flex; align-items: center; justify-content: space-between }
#camara .disparo { width: 76px; height: 76px; border-radius: 50%; background: #fff; border: 5px solid rgba(255,255,255,.45); background-clip: padding-box; padding: 0 }
#camara .disparo:active { transform: scale(.94) }
#camara .ultima { width: 54px; height: 54px; border-radius: 12px; overflow: hidden; padding: 0; position: relative; background: rgba(255,255,255,.15) }
#camara .ultima img { width: 100%; height: 100%; object-fit: cover; display: block }
#camara .ultima span { position: absolute; right: 2px; bottom: 2px; background: #000; border-radius: 8px; font-size: .7rem; padding: 0 5px }
#camara .alchat { position: absolute; left: 12px; bottom: calc(118px + env(safe-area-inset-bottom, 0px)); font-size: .9rem; height: 38px; background: #fff; color: #000 }
#camara .anillo { position: absolute; width: 70px; height: 70px; margin: -35px 0 0 -35px; border: 2px solid #ffd54a; border-radius: 50%; pointer-events: none; opacity: 0; transition: opacity .6s }
#camara .anillo.si { opacity: 1; transition: none }
#camara .cuenta { position: absolute; inset: 0; display: grid; place-items: center; font-size: 7rem; font-weight: 900; text-shadow: 0 2px 20px rgba(0,0,0,.6); pointer-events: none }
#camara .destello { position: absolute; inset: 0; background: #fff; opacity: 0; pointer-events: none }
#camara .destello.si { animation: destello .25s ease-out }
@keyframes destello { from { opacity: .85 } to { opacity: 0 } }
#camara .error { position: absolute; inset: 0; display: grid; place-items: center; padding: 30px; text-align: center; line-height: 1.5 }
@media (prefers-reduced-motion: reduce) { #camara .destello.si { animation: none } }`;

  /** Endereza, achica a 4096 px y genera JPEG 0,9 + miniatura WebP 480 px. Acepta Blob/File. */
  async function preparar(fuente) {
    const A = window.AlbumLogica, M = window.ChatMedios;
    const bm = await createImageBitmap(fuente, { imageOrientation: 'from-image' });
    try {
      const { ancho, alto } = A.escala(bm.width, bm.height, A.MAX_LADO);
      const c = document.createElement('canvas'); c.width = ancho; c.height = alto;
      c.getContext('2d').drawImage(bm, 0, 0, ancho, alto);
      const foto = await new Promise((res) => c.toBlob(res, 'image/jpeg', 0.9));
      const m = A.escala(bm.width, bm.height, 480), cm = document.createElement('canvas'); cm.width = m.ancho; cm.height = m.alto;
      cm.getContext('2d').drawImage(bm, 0, 0, m.ancho, m.alto);
      const mini = await M.aBlob(cm, 0.75);
      const md = A.escala(bm.width, bm.height, 1600), cmd = document.createElement('canvas'); cmd.width = md.ancho; cmd.height = md.alto;
      cmd.getContext('2d').drawImage(bm, 0, 0, md.ancho, md.alto);
      const media = await new Promise((res) => cmd.toBlob(res, 'image/jpeg', 0.82));
      if (!foto || !mini || !media) throw new Error('no se pudo codificar la foto');
      return { foto, mini, media, ancho, alto };
    } finally { bm.close?.(); }
  }

  function crear({ cola, yo, alTocarUltima = () => {}, mandarAlChat = null }) {
    const A = window.AlbumLogica;
    const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    document.body.insertAdjacentHTML('beforeend', `
<div id="camara" hidden role="dialog" aria-label="Cámara">
  <video playsinline muted autoplay></video>
  <div class="grilla" hidden></div>
  <div class="anillo"></div>
  <div class="cuenta" hidden></div>
  <div class="destello"></div>
  <div class="arriba">
    <button type="button" data-c="cerrar" aria-label="Cerrar la cámara">✕</button>
    <span class="esp"></span>
    <button type="button" data-c="luz" aria-label="Linterna" aria-pressed="false" hidden>🔦</button>
    <button type="button" data-c="exp" aria-label="Exposición" aria-pressed="false" hidden>☀</button>
    <button type="button" data-c="grilla" aria-label="Cuadrícula" aria-pressed="false">#</button>
    <button type="button" data-c="timer" aria-label="Temporizador">⏱ 0</button>
  </div>
  <div class="abajo">
    <input type="range" data-c="expRango" aria-label="Exposición" hidden>
    <div class="zooms"></div>
    <input type="range" data-c="zoomRango" aria-label="Zoom" hidden>
    <div class="fila">
      <button type="button" class="ultima" data-c="ultima" aria-label="Ver en el álbum"></button>
      <button type="button" class="disparo" data-c="disparo" aria-label="Sacar foto"></button>
      <button type="button" data-c="lente" aria-label="Cambiar de cámara">🔄</button>
    </div>
  </div>
  <button type="button" class="alchat" data-c="alchat" hidden>Mandar la última al chat</button>
  <div class="error" hidden></div>
</div>`);
    const raiz = document.getElementById('camara'), video = raiz.querySelector('video');
    const q = (c) => raiz.querySelector(`[data-c="${c}"]`);
    let stream = null, track = null, caps = {}, camaras = [], hayFrontal = true, idxCam = 0, gran = null, enGran = false, zoomLuego = null, frontal = false, zoom = 1, ultima = null, alChat = false, ocupado = false, turno = 0, nPend = 0;
    let segs = 0; const TIMERS = [0, 3, 10];
    try { if (localStorage.getItem('camGrilla') === '1') { raiz.querySelector('.grilla').hidden = false; q('grilla').setAttribute('aria-pressed', 'true'); } } catch {}

    const soltar = () => { turno++; stream?.getTracks().forEach((t) => t.stop()); stream = null; track = null; video.srcObject = null; };
    function error(t) { const e = raiz.querySelector('.error'); e.textContent = t; e.hidden = !t; }

    async function encender() {
      soltar(); error(''); const mio = turno;
      const fino = { width: { ideal: 4096 }, height: { ideal: 3072 } };
      const video0 = frontal ? { facingMode: 'user', ...fino } : enGran && gran ? { deviceId: { exact: gran }, ...fino } : camaras[idxCam] ? { deviceId: { exact: camaras[idxCam] }, ...fino } : { facingMode: { ideal: 'environment' }, ...fino };
      let nuevo;
      try { nuevo = await navigator.mediaDevices.getUserMedia({ video: video0, audio: false }); }
      catch (e) {
        if (mio !== turno) return;
        console.error(e);
        return error(e?.name === 'NotAllowedError' ? 'Chrome no tiene permiso para usar la cámara. Tocá el candado de la barra de direcciones, habilitá la cámara y volvé a abrirla.' : 'No se pudo abrir la cámara. Cerrala y probá de nuevo.');
      }
      // mientras pedía la cámara: se cerró, se pasó a segundo plano o se pidió otra lente → esta no sirve
      if (mio !== turno || raiz.hidden || document.hidden) { nuevo.getTracks().forEach((t) => t.stop()); return; }
      stream = nuevo;
      track = stream.getVideoTracks()[0]; video.srcObject = stream; video.classList.toggle('espejo', frontal);
      if (!camaras.length && !frontal) await listarCamaras();
      if (mio !== turno) return;
      caps = track.getCapabilities?.() || {};
      montarControles();
    }

    async function listarCamaras() {
      try {
        const ds = (await navigator.mediaDevices.enumerateDevices()).filter((d) => d.kind === 'videoinput');
        // las traseras primero; Chrome en Android las etiqueta "facing back"
        const traseras = ds.filter((d) => /back|rear|trasera|environment/i.test(d.label));
        camaras = (traseras.length ? traseras : ds).map((d) => d.deviceId);
        hayFrontal = !traseras.length || ds.some((d) => /front|user|frontal/i.test(d.label));
        const actual = track?.getSettings?.().deviceId; idxCam = Math.max(0, camaras.indexOf(actual));
        // si hay una sola trasera extra es la gran angular: va como botón .6× y 🔄 queda para frontal/trasera
        gran = A.lentesTraseras(ds, actual).gran;
        if (gran) { camaras = [actual]; idxCam = 0; }
      } catch (e) { console.error(e); }
    }

    function montarControles() {
      const z = caps.zoom, zs = raiz.querySelector('.zooms'), zr = q('zoomRango');
      zoom = track.getSettings?.().zoom || 1;
      zs.replaceChildren();
      const boton = (txt, ds) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = txt; Object.assign(b.dataset, ds); zs.appendChild(b); return b; };
      if (!frontal && gran) boton('.6×', { lente: 'gran' }).classList.toggle('act', enGran);
      if (!frontal && gran && enGran) { boton('1×', { lente: 'principal' }); zr.hidden = true; }
      else if (z && z.max > z.min) {
        for (const v of A.zoomPasos(z.min, z.max)) {
          const b = document.createElement('button'); b.type = 'button'; b.textContent = (v < 1 ? v.toFixed(1).replace('0.', '.') : v) + '×'; b.dataset.z = v; zs.appendChild(b);
        }
        Object.assign(zr, { min: z.min, max: z.max, step: z.step || 0.1, value: zoom }); zr.hidden = false;
      } else zr.hidden = true;
      marcarZoom();
      if (zoomLuego != null) { const v = zoomLuego; zoomLuego = null; if (v !== 1) ponerZoom(v); }
      q('luz').hidden = !caps.torch; q('luz').setAttribute('aria-pressed', 'false');
      const ex = caps.exposureCompensation, er = q('expRango');
      q('exp').hidden = !(ex && ex.max > ex.min); q('exp').setAttribute('aria-pressed', 'false'); er.hidden = true;
      if (ex) Object.assign(er, { min: ex.min, max: ex.max, step: ex.step || 0.1, value: track.getSettings?.().exposureCompensation ?? 0 });
      q('lente').hidden = camaras.length + (hayFrontal ? 1 : 0) < 2;
    }

    let zPend = null;
    function ponerZoom(v) {
      const z = caps.zoom; if (!z || !track) return;
      zoom = Math.min(z.max, Math.max(z.min, v)); q('zoomRango').value = zoom; marcarZoom();
      if (zPend) return; // un cambio por cuadro
      zPend = requestAnimationFrame(() => { zPend = null; track?.applyConstraints({ advanced: [{ zoom }] }).catch(() => {}); });
    }
    function marcarZoom() { raiz.querySelectorAll('.zooms button[data-z]').forEach((b) => b.classList.toggle('act', Math.abs(Number(b.dataset.z) - zoom) < 0.05)); }

    // pellizcar para zoom, tocar para enfocar
    const dedos = new Map(); let pellizco = null, movio = false;
    video.addEventListener('pointerdown', (e) => { dedos.set(e.pointerId, e); movio = false; if (dedos.size === 2) { const [a, b] = [...dedos.values()]; pellizco = { d: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY), z: zoom }; } });
    video.addEventListener('pointermove', (e) => {
      if (!dedos.has(e.pointerId)) return; dedos.set(e.pointerId, e); movio = true;
      if (pellizco && dedos.size === 2) { const [a, b] = [...dedos.values()]; ponerZoom(pellizco.z * Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY) / pellizco.d); }
    });
    const soltarDedo = (e) => { const eraUno = dedos.size === 1 && !pellizco; dedos.delete(e.pointerId); if (dedos.size < 2) pellizco = null; if (eraUno && !movio && e.type === 'pointerup') enfocar(e); };
    video.addEventListener('pointerup', soltarDedo); video.addEventListener('pointercancel', soltarDedo);

    function enfocar(e) {
      const r = video.getBoundingClientRect(), k = Math.min(r.width / (video.videoWidth || r.width), r.height / (video.videoHeight || r.height));
      const w = (video.videoWidth || r.width) * k, h = (video.videoHeight || r.height) * k;
      const x = Math.min(1, Math.max(0, (e.clientX - r.left - (r.width - w) / 2) / w)), y = Math.min(1, Math.max(0, (e.clientY - r.top - (r.height - h) / 2) / h));
      const an = raiz.querySelector('.anillo'); an.style.left = e.clientX + 'px'; an.style.top = e.clientY + 'px';
      an.classList.add('si'); setTimeout(() => an.classList.remove('si'), 700);
      if (!track || !caps.pointsOfInterest) return;
      const modo = (caps.focusMode || []).includes('single-shot') ? 'single-shot' : (caps.focusMode || []).includes('continuous') ? 'continuous' : undefined;
      track.applyConstraints({ advanced: [{ pointsOfInterest: [{ x: frontal ? 1 - x : x, y }], ...(modo ? { focusMode: modo } : {}) }] }).catch(() => {});
    }

    raiz.addEventListener('click', async (e) => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.lente) { const g = b.dataset.lente === 'gran'; if (g === enGran) return; enGran = g; zoom = 1; return encender(); }
      if (b.dataset.z) return ponerZoom(Number(b.dataset.z));
      switch (b.dataset.c) {
        case 'cerrar': return cerrar();
        case 'luz': { const on = b.getAttribute('aria-pressed') !== 'true'; try { await track.applyConstraints({ advanced: [{ torch: on }] }); b.setAttribute('aria-pressed', String(on)); } catch {} return; }
        case 'exp': { const on = b.getAttribute('aria-pressed') !== 'true'; b.setAttribute('aria-pressed', String(on)); q('expRango').hidden = !on; return; }
        case 'grilla': { const g = raiz.querySelector('.grilla'); g.hidden = !g.hidden; b.setAttribute('aria-pressed', String(!g.hidden)); try { localStorage.setItem('camGrilla', g.hidden ? '0' : '1'); } catch {} return; }
        case 'timer': segs = TIMERS[(TIMERS.indexOf(segs) + 1) % TIMERS.length]; b.textContent = '⏱ ' + segs; return;
        case 'lente':
          enGran = false;
          if (!frontal && idxCam < camaras.length - 1) idxCam++;
          else if (!frontal) frontal = true;
          else { frontal = false; idxCam = 0; }
          return encender();
        case 'disparo': return disparar();
        case 'ultima': if (ultima) alTocarUltima(ultima.id, alChat); return;
        case 'alchat': if (ultima && mandarAlChat) { mandarAlChat(ultima.foto); b.hidden = true; } return;
      }
    });
    q('zoomRango').addEventListener('input', (e) => ponerZoom(Number(e.target.value)));
    q('expRango').addEventListener('input', (e) => track?.applyConstraints({ advanced: [{ exposureCompensation: Number(e.target.value) }] }).catch(() => {}));

    async function disparar() {
      if (!track || ocupado) return;
      ocupado = true;
      try {
        for (let s = segs; s > 0; s--) { const c = raiz.querySelector('.cuenta'); c.hidden = false; c.textContent = s; await new Promise((r) => setTimeout(r, 1000)); if (raiz.hidden || document.hidden || !track) return; }
        if (!track) return;
        raiz.querySelector('.cuenta').hidden = true;
        const d = raiz.querySelector('.destello'); d.classList.remove('si'); void d.offsetWidth; d.classList.add('si');
        let crudo = null;
        try { if ('ImageCapture' in window) crudo = await new ImageCapture(track).takePhoto(); } catch (e) { console.warn('takePhoto', e); }
        if (!crudo) {
          const c = document.createElement('canvas'); c.width = video.videoWidth; c.height = video.videoHeight;
          const g = c.getContext('2d'); if (frontal) { g.translate(c.width, 0); g.scale(-1, 1); } g.drawImage(video, 0, 0);
          crudo = await new Promise((r) => c.toBlob(r, 'image/jpeg', 0.95));
        }
        const p = await preparar(crudo), id = crypto.randomUUID();
        ultima = { id, foto: p.foto };
        const u = q('ultima'); u.innerHTML = `<img alt="Última foto"><span hidden></span>`; const url = URL.createObjectURL(p.mini); u.querySelector('img').src = url; u.querySelector('img').onload = () => URL.revokeObjectURL(url);
        q('alchat').hidden = !(alChat && mandarAlChat); pendientes(nPend);
        await cola.agregar({ id, foto: p.foto, mini: p.mini, media: p.media, ancho: p.ancho, alto: p.alto, autor: yo(), tomada: new Date().toISOString() });
      } catch (e) {
        console.error(e); window.aviso?.('No se pudo guardar la foto. Probá de nuevo.');
      } finally { ocupado = false; raiz.querySelector('.cuenta').hidden = true; }
    }

    function pendientes(n) { nPend = n; const s = q('ultima').querySelector('span'); if (s) { s.hidden = !n; s.textContent = n ? '↑' + n : ''; } }

    function abrir(op = {}) {
      alChat = !!op.alChat; q('alchat').hidden = true;
      raiz.hidden = false;
      const st = { ...(history.state || {}), cam: 1 }; delete st.hoja;
      history[op.reemplazar ? 'replaceState' : 'pushState'](st, '', location.hash || location.pathname + location.search);
      encender();
    }
    function ocultar() { raiz.hidden = true; soltar(); raiz.querySelector('.cuenta').hidden = true; }
    function cerrar() { if (raiz.hidden) return; if (history.state?.cam) history.back(); else ocultar(); }
    addEventListener('popstate', () => { if (!raiz.hidden && !history.state?.cam) ocultar(); });
    document.addEventListener('visibilitychange', () => { if (raiz.hidden) return; if (document.hidden) soltar(); else encender(); });

    return { abrir, cerrar, abierta: () => !raiz.hidden, pendientes, _track: () => track };
  }

  window.Camara = { preparar, crear };
})();
