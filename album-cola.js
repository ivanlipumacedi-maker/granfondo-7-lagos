// Cola de subida del álbum: cada foto se guarda primero en el teléfono (IndexedDB) y se sube cuando hay señal.
// El id de la foto se genera al sacarla y es el id de la fila: si una subida quedó a medias, reintentar no duplica.
(function () {
  const BD = 'rumbo-album', ALMACEN = 'pendientes';
  let bdP = null;
  function bd() {
    if (!bdP) bdP = new Promise((res, rej) => {
      const r = indexedDB.open(BD, 1);
      r.onupgradeneeded = () => r.result.createObjectStore(ALMACEN, { keyPath: 'id' });
      r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
    });
    return bdP;
  }
  async function op(modo, fn) {
    const d = await bd();
    return new Promise((res, rej) => {
      const t = d.transaction(ALMACEN, modo), req = fn(t.objectStore(ALMACEN));
      t.oncomplete = () => res(req?.result); t.onerror = () => rej(t.error); t.onabort = () => rej(t.error);
    });
  }

  function crear({ sb, viaje, alSubir = () => {}, alEstado = () => {} }) {
    const A = window.AlbumLogica, BUCKET = 'album';
    let cuenta = 0, corriendo = false, otraVez = false, intento = 0, timer = null;
    const estado = (e) => { try { alEstado({ ...e, pendientes: cuenta }); } catch (x) { console.error(x); } };
    const contar = async () => { cuenta = await op('readonly', (s) => s.count()); return cuenta; };

    async function subirUna(it) {
      const archivo = A.rutaFoto(viaje, it.id), mini = A.rutaMini(archivo);
      let r = await sb.storage.from(BUCKET).upload(archivo, it.foto, { contentType: 'image/jpeg', upsert: true });
      if (r.error) throw r.error;
      r = await sb.storage.from(BUCKET).upload(mini, it.mini, { contentType: it.mini.type || 'image/webp', upsert: true });
      if (r.error) throw r.error;
      const fila = { id: it.id, viaje, autor: it.autor, archivo, mini, ancho: it.ancho, alto: it.alto, bytes: it.foto.size + it.mini.size, tomada: it.tomada, editada_de: it.editada_de || null };
      const ins = await sb.from('fotos').insert(fila).select('*').single();
      if (ins.error && ins.error.code !== '23505') throw ins.error; // 23505: ya estaba, la subida anterior llegó
      return ins.data || fila;
    }

    async function procesar() {
      if (corriendo) { otraVez = true; return; }
      corriendo = true; clearTimeout(timer);
      try {
        do {
          otraVez = false;
          const items = await op('readonly', (s) => s.getAll());
          cuenta = items.length;
          if (!items.length) { intento = 0; estado({ estado: 'listo' }); break; }
          if (navigator.onLine === false) { estado({ estado: 'sin-senal' }); break; }
          const uso = await sb.rpc('album_uso');
          if (uso.error) throw uso.error;
          items.sort((a, b) => (a.tomada < b.tomada ? -1 : 1));
          for (const it of items) {
            if (A.espacio(Number(uso.data) + it.foto.size, A.LIMITE_BYTES).estado === 'lleno') { estado({ estado: 'lleno' }); return; }
            estado({ estado: 'subiendo' });
            const fila = await subirUna(it);
            uso.data = Number(uso.data) + it.foto.size + it.mini.size;
            await op('readwrite', (s) => s.delete(it.id));
            await contar(); intento = 0;
            try { alSubir(fila); } catch (x) { console.error(x); }
          }
          if (cuenta === 0) estado({ estado: 'listo' });
        } while (otraVez);
      } catch (e) {
        console.error('album: subida pendiente', e);
        estado({ estado: 'reintentando' });
        timer = setTimeout(procesar, A.espera(intento++));
      } finally { corriendo = false; }
    }

    async function agregar(item) {
      await op('readwrite', (s) => s.put(item));
      await contar(); estado({ estado: 'en-cola' });
      procesar();
    }

    addEventListener('online', () => { intento = 0; procesar(); });
    document.addEventListener('visibilitychange', () => { if (!document.hidden) { intento = 0; procesar(); } });
    contar().then(() => procesar()).catch(console.error);
    return { agregar, procesar, pendientes: () => cuenta, contar };
  }

  window.AlbumCola = { crear };
})();
