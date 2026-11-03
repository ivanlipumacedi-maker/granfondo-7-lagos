// Editor de fotos del álbum: "Borrar con IA" (pincel + MI-GAN en el teléfono) y "Ajustar y filtros" (Filerobot Image Editor, MIT).
// window.EditorFoto.abrir(blob, { alGuardar(blobEditado) }). Guardar crea una foto nueva: la original no se toca.
(function () {
  const CSS = `
#editorFoto { position: fixed; inset: 0; z-index: 95; background: #111; color: #fff; display: flex; flex-direction: column }
#editorFoto[hidden] { display: none }
#editorFoto .cab { display: flex; align-items: center; gap: 8px; padding: calc(10px + env(safe-area-inset-top, 0px)) 10px 8px }
#editorFoto .cab b { flex: 1; font-weight: 700 }
#editorFoto button { font: inherit; color: #fff; background: rgba(255,255,255,.12); border: 0; border-radius: 999px; padding: 10px 14px; font-weight: 700; font-size: .9rem }
#editorFoto button:disabled { opacity: .45 }
#editorFoto #editorGuardar { background: #4dbdb7; color: #062a2a }
#editorFoto .modos { display: flex; gap: 6px; padding: 0 10px 8px }
#editorFoto .modos button { flex: 1 }
#editorFoto .modos button[aria-pressed="true"] { background: #fff; color: #111 }
#editorFoto .lienzo { flex: 1; position: relative; display: grid; place-items: center; overflow: hidden; touch-action: none; min-height: 0 }
#editorFoto .lienzo canvas { grid-area: 1 / 1; max-width: 100%; max-height: 100%; object-fit: contain }
#editorFoto .lienzo canvas.mascara { opacity: .55; cursor: crosshair }
#editorFoto .fr { flex: 1; min-height: 0; background: #fff; color: #222 }
#editorFoto .herr { display: flex; align-items: center; gap: 8px; padding: 10px 10px calc(12px + env(safe-area-inset-bottom, 0px)); flex-wrap: wrap }
#editorFoto .herr label { display: flex; align-items: center; gap: 6px; font-size: .85rem; flex: 1; min-width: 140px }
#editorFoto .herr input[type=range] { flex: 1; accent-color: #fff }
#editorFoto .nota { width: 100%; font-size: .85rem; opacity: .8; min-height: 1.2em }`;

  // Textos del editor de Filerobot, en castellano
  const TRAD = {
    save: 'Guardar', saveAs: 'Guardar como', back: 'Volver', loading: 'Cargando…', cancel: 'Cancelar', apply: 'Aplicar', confirm: 'Confirmar',
    warning: 'Atención', discardChanges: 'Descartar cambios', resetOperations: 'Deshacer todo', undoTitle: 'Deshacer', redoTitle: 'Rehacer',
    showImageTitle: 'Ver la original', zoomInTitle: 'Acercar', zoomOutTitle: 'Alejar', toggleZoomMenuTitle: 'Zoom',
    changesLoseWarningHint: 'Si tocás "Deshacer todo" se pierden los cambios. ¿Seguimos?', discardChangesWarningHint: 'Si cerrás, se pierde el último cambio.',
    adjustTab: 'Recortar y girar', finetuneTab: 'Ajustes', filtersTab: 'Filtros', watermarkTab: 'Marca', annotateTabLabel: 'Dibujar', resize: 'Tamaño', resizeTab: 'Tamaño',
    cropTool: 'Recortar', original: 'Original', custom: 'Libre', square: 'Cuadrado', landscape: 'Horizontal', portrait: 'Vertical', ellipse: 'Elipse',
    rotateTool: 'Girar', flipX: 'Espejar ↔', unFlipX: 'Espejar ↔', flipY: 'Espejar ↕', unFlipY: 'Espejar ↕',
    brightnessTool: 'Brillo', contrastTool: 'Contraste', hsvTool: 'Color', hue: 'Tono', brightness: 'Brillo', saturation: 'Saturación', value: 'Luz',
    blurTool: 'Desenfoque', warmthTool: 'Calidez', blur: 'Desenfoque', textTool: 'Texto', penTool: 'Lápiz', lineTool: 'Línea', arrowTool: 'Flecha',
    rectangleTool: 'Rectángulo', ellipseTool: 'Elipse', polygonTool: 'Polígono', imageTool: 'Imagen', size: 'Tamaño', opacity: 'Opacidad', stroke: 'Borde',
    shadow: 'Sombra', position: 'Posición', fontFamily: 'Letra', width: 'Ancho', height: 'Alto', resetSize: 'Volver al tamaño original',
    resizeWidthTitle: 'Ancho en píxeles', resizeHeightTitle: 'Alto en píxeles', toggleRatioLockTitle: 'Mantener proporción', tabsMenu: 'Menú', download: 'Bajar',
  };

  let fiePromesa = null;
  const cargarFilerobot = () => fiePromesa || (fiePromesa = new Promise((res, rej) => {
    if (window.FilerobotImageEditor) return res(window.FilerobotImageEditor);
    const s = document.createElement('script'); s.src = 'vendor/filerobot-4.8.1.min.js';
    s.onload = () => res(window.FilerobotImageEditor); s.onerror = () => { fiePromesa = null; rej(new Error('No se pudo cargar el editor. Revisá la señal.')); };
    document.head.appendChild(s);
  }));

  let worker = null;
  const ia = () => worker || (worker = new Worker('ia-worker.js'));

  let raiz = null;
  function montar() {
    if (raiz) return;
    const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    document.body.insertAdjacentHTML('beforeend', `
<div id="editorFoto" hidden role="dialog" aria-label="Editar foto">
  <div class="cab"><button type="button" id="editorCancelar" aria-label="Cancelar">✕</button><b>Editar foto</b><button type="button" id="editorGuardar">Guardar copia</button></div>
  <div class="modos"><button type="button" id="editorModoIA" aria-pressed="false">✨ Borrar con IA</button><button type="button" id="editorModoAjustes" aria-pressed="false">🎚️ Ajustar y filtros</button></div>
  <div class="lienzo"><canvas class="foto"></canvas><canvas class="mascara" hidden></canvas></div>
  <div class="fr" hidden></div>
  <div class="herr" data-h="ia" hidden>
    <label>Pincel <input type="range" id="editorPincel" min="10" max="120" value="40"></label>
    <button type="button" id="editorDeshacer">Deshacer trazo</button>
    <button type="button" id="editorBorrarIA">Borrar lo pintado</button>
    <div class="nota" id="editorNota">Pintá con el dedo lo que querés borrar.</div>
  </div>
</div>`);
    raiz = document.getElementById('editorFoto');
  }

  function abrir(blob, { alGuardar }) {
    montar();
    const $ = (id) => document.getElementById(id);
    const foto = raiz.querySelector('canvas.foto'), masc = raiz.querySelector('canvas.mascara'), fr = raiz.querySelector('.fr'), herr = raiz.querySelector('[data-h="ia"]');
    let trazos = [], trazo = null, fie = null, refDatos = {}, modo = null, ocupado = false, cambios = false;
    const ctl = new AbortController(), on = (el, ev, fn) => el.addEventListener(ev, fn, { signal: ctl.signal });
    raiz.dataset.ia = '';
    $('editorNota').textContent = 'Pintá con el dedo lo que querés borrar.';

    createImageBitmap(blob, { imageOrientation: 'from-image' }).then((bm) => {
      foto.width = masc.width = bm.width; foto.height = masc.height = bm.height;
      foto.getContext('2d').drawImage(bm, 0, 0); bm.close?.();
    }).catch(() => { window.aviso?.('No se pudo abrir la foto.'); cerrar(); });

    raiz.hidden = false; history.pushState({ ...(history.state || {}), editor: 1 }, '', location.hash || location.pathname + location.search);

    function pintarMascara() {
      const g = masc.getContext('2d'); g.clearRect(0, 0, masc.width, masc.height);
      g.strokeStyle = '#ff2d55'; g.lineCap = g.lineJoin = 'round';
      for (const t of trazos) { g.lineWidth = t.w; g.beginPath(); t.p.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); if (t.p.length === 1) g.lineTo(t.p[0][0] + 0.1, t.p[0][1]); g.stroke(); }
    }
    const punto = (e) => { const r = masc.getBoundingClientRect(); return [(e.clientX - r.left) * masc.width / r.width, (e.clientY - r.top) * masc.height / r.height]; };
    on(masc, 'pointerdown', (e) => { if (ocupado) return; masc.setPointerCapture(e.pointerId); const r = masc.getBoundingClientRect(); trazo = { w: Number($('editorPincel').value) * masc.width / r.width, p: [punto(e)] }; trazos.push(trazo); pintarMascara(); });
    on(masc, 'pointermove', (e) => { if (!trazo) return; trazo.p.push(punto(e)); pintarMascara(); });
    const fin = () => { trazo = null; };
    on(masc, 'pointerup', fin); on(masc, 'pointercancel', fin);
    on($('editorDeshacer'), 'click', () => { trazos.pop(); pintarMascara(); });

    function ponerModo(m) {
      modo = m;
      $('editorModoIA').setAttribute('aria-pressed', String(m === 'ia')); $('editorModoAjustes').setAttribute('aria-pressed', String(m === 'ajustes'));
      herr.hidden = m !== 'ia'; masc.hidden = m !== 'ia';
      raiz.querySelector('.lienzo').hidden = m === 'ajustes'; fr.hidden = m !== 'ajustes';
      if (m === 'ajustes') abrirAjustes(); else cerrarAjustes(true);
    }
    on($('editorModoIA'), 'click', () => ponerModo('ia'));
    on($('editorModoAjustes'), 'click', () => ponerModo('ajustes'));

    on($('editorBorrarIA'), 'click', () => {
      if (ocupado || !trazos.length) return;
      ocupado = true; $('editorBorrarIA').disabled = true; raiz.dataset.ia = 'trabajando';
      const W = foto.width, H = foto.height;
      // máscara: lo pintado (agrandado 6 px para que no queden bordes) = 0, el resto = 255
      const mc = document.createElement('canvas'); mc.width = W; mc.height = H; const mg = mc.getContext('2d');
      mg.strokeStyle = '#fff'; mg.lineCap = mg.lineJoin = 'round';
      for (const t of trazos) { mg.lineWidth = t.w + 12; mg.beginPath(); t.p.forEach(([x, y], i) => (i ? mg.lineTo(x, y) : mg.moveTo(x, y))); if (t.p.length === 1) mg.lineTo(t.p[0][0] + 0.1, t.p[0][1]); mg.stroke(); }
      const md = mg.getImageData(0, 0, W, H).data, px = foto.getContext('2d').getImageData(0, 0, W, H).data, N = W * H;
      const img = new Uint8Array(3 * N), mask = new Uint8Array(N);
      for (let i = 0; i < N; i++) { img[i] = px[i * 4]; img[N + i] = px[i * 4 + 1]; img[2 * N + i] = px[i * 4 + 2]; mask[i] = md[i * 4 + 3] > 0 ? 0 : 255; }
      const w = ia();
      $('editorNota').textContent = 'Borrando…';
      w.onmessage = ({ data: d }) => {
        if (d.tipo === 'progreso') { $('editorNota').textContent = d.preparando ? 'Preparando la IA…' : `Bajando la IA (solo la primera vez): ${Math.round(d.bajado / 1048576)} de ${Math.round(d.total / 1048576)} MB`; return; }
        ocupado = false; $('editorBorrarIA').disabled = false;
        if (d.tipo === 'error') { console.error(d.msg); raiz.dataset.ia = 'error'; $('editorNota').textContent = 'No se pudo borrar. Revisá la señal (la primera vez hay que bajar la IA) y probá de nuevo.'; return; }
        const out = foto.getContext('2d').createImageData(W, H), o = out.data, r = d.res;
        for (let i = 0; i < N; i++) { o[i * 4] = r[i]; o[i * 4 + 1] = r[N + i]; o[i * 4 + 2] = r[2 * N + i]; o[i * 4 + 3] = 255; }
        foto.getContext('2d').putImageData(out, 0, 0);
        trazos = []; pintarMascara(); cambios = true; raiz.dataset.ia = 'listo';
        $('editorNota').textContent = 'Listo. Podés pintar otra cosa o guardar.';
      };
      w.postMessage({ img, mask, W, H }, [img.buffer, mask.buffer]);
    });

    async function abrirAjustes() {
      if (fie) return;
      try {
        const FIE = await cargarFilerobot(); if (modo !== 'ajustes') return;
        const fuente = await new Promise((r) => foto.toBlob(r, 'image/jpeg', 0.95)), url = URL.createObjectURL(fuente);
        const { TABS } = FIE; refDatos = {};
        fie = new FIE(fr, {
          source: url, useBackendTranslations: false, translations: TRAD, language: 'en',
          tabsIds: [TABS.ADJUST, TABS.FINETUNE, TABS.FILTERS, TABS.ANNOTATE, TABS.RESIZE], defaultTabId: TABS.FINETUNE,
          defaultSavedImageType: 'jpeg', defaultSavedImageQuality: 0.92, savingPixelRatio: 1, previewPixelRatio: window.devicePixelRatio || 1,
          getCurrentImgDataFnRef: refDatos, closeAfterSave: false, onBeforeSave: () => false,
          onSave: (o) => { if (o?.imageCanvas) terminar(o.imageCanvas); },
          theme: { typography: { fontFamily: 'system-ui, sans-serif' } },
        });
        fie.render({ onClose: () => {} });
        fie._url = url;
      } catch (e) { console.error(e); window.aviso?.(e.message || 'No se pudo abrir el editor.'); ponerModo('ia'); }
    }
    // al salir de "Ajustar", lo editado pasa al lienzo para seguir (o guardar)
    function cerrarAjustes(aplicar) {
      if (!fie) return;
      if (aplicar) { try { const d = refDatos.current?.({}); const c = d?.imageData?.imageCanvas; if (c) { foto.width = masc.width = c.width; foto.height = masc.height = c.height; foto.getContext('2d').drawImage(c, 0, 0); cambios = true; } } catch (e) { console.error(e); } }
      try { fie.terminate(); } catch {}
      URL.revokeObjectURL(fie._url); fie = null; fr.innerHTML = '';
    }

    async function terminar(canvas) {
      if (ocupado) return; ocupado = true; $('editorGuardar').disabled = true;
      try {
        const b = await new Promise((r) => canvas.toBlob(r, 'image/jpeg', 0.92));
        await alGuardar(b);
        window.aviso?.('Guardada como foto nueva en el álbum.');
        cerrar();
      } catch (e) { console.error(e); window.aviso?.('No se pudo guardar. Probá de nuevo.'); }
      finally { ocupado = false; $('editorGuardar').disabled = false; }
    }
    on($('editorGuardar'), 'click', () => {
      if (modo === 'ajustes' && fie) { const d = refDatos.current?.({}); const c = d?.imageData?.imageCanvas; if (c) return terminar(c); }
      terminar(foto);
    });

    function ocultar() { cerrarAjustes(false); ctl.abort(); raiz.hidden = true; trazos = []; if (worker && ocupado) { worker.terminate(); worker = null; } ocupado = false; }
    function cerrar() { if (raiz.hidden) return; if (history.state?.editor) history.back(); else ocultar(); }
    on($('editorCancelar'), 'click', cerrar);
    on(window, 'popstate', () => { if (!raiz.hidden && !history.state?.editor) ocultar(); });
    ponerModo('ia');
    void cambios;
  }

  window.EditorFoto = { abrir };
})();
