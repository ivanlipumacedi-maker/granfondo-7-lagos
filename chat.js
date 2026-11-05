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
/* rosa de Guti (B) solo en el chat; en el resto de la app B sigue con --b. Claro: rosa intenso bajo texto claro; oscuro: rosa suave bajo texto oscuro */
#chatPanel { --rosa: #c2185b }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) #chatPanel { --rosa: #f48fb1 } }
:root[data-theme="dark"] #chatPanel { --rosa: #f48fb1 }
#chatPanel header { display: flex; align-items: center; gap: 12px; padding: calc(10px + env(safe-area-inset-top, 0px)) 12px 10px; background: var(--surface); border-bottom: 1px solid var(--line) }
#chatPanel header button { background: none; border: 0; color: var(--ink); font-size: 1.5rem; padding: 4px 8px; line-height: 1 }
#chatPanel header b { font-size: 1.05rem }
#chatLista { flex: 1; overflow-y: auto; padding: 12px 12px 6px; display: flex; flex-direction: column; gap: 6px; overscroll-behavior: contain; scrollbar-width: none }
#chatLista::-webkit-scrollbar { display: none } /* sin la rayita gris de la barra de desplazamiento al lado del micrófono */
#chatLista::before { content: ""; flex: 1 }
#chatLista .vacio { margin: auto; color: var(--muted); text-align: center; padding: 20px }
#chatMas { align-self: center; margin-bottom: 6px }
.msg { display: flex; flex-direction: column; max-width: 80% }
.msg.resaltado .burbuja { animation: resaltar 1.6s ease-out }
@keyframes resaltar { 0%, 40% { box-shadow: 0 0 0 4px var(--accent) } 100% { box-shadow: 0 0 0 0 transparent } }
.burbuja .cita { display: block; width: 100%; text-align: left; font: inherit; color: inherit; background: rgba(0,0,0,.12); border: 0; border-left: 4px solid var(--rosa); border-radius: 8px; padding: 4px 8px; margin: 1px 0 4px; cursor: pointer }
.burbuja .cita.A { border-left-color: var(--a) }
.msg.mio .burbuja .cita { border-left-color: rgba(255,255,255,.75); background: rgba(0,0,0,.16) }
.burbuja .cita b { display: block; font-size: .78rem }
.burbuja .cita span { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; font-size: .85rem; opacity: .85; overflow-wrap: anywhere }
.burbuja.media .cita { margin: 2px 2px 4px; width: calc(100% - 4px) }
#chatCita { display: flex; align-items: center; gap: 10px; padding: 8px 12px; background: var(--surface); border-top: 1px solid var(--line) }
#chatCita[hidden] { display: none }
#chatCita .t { flex: 1; min-width: 0; border-left: 4px solid var(--accent); padding-left: 8px }
#chatCita b { display: block; font-size: .8rem; color: var(--accent) }
#chatCita span { display: block; font-size: .88rem; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis }
#chatCita button { background: none; border: 0; color: var(--muted); font-size: 1.2rem; padding: 4px 8px }
.msg.mio { align-self: flex-end; align-items: flex-end }
.msg.otro { align-self: flex-start; align-items: flex-start }
.burbuja { padding: 7px 11px 5px; border-radius: 16px; background: var(--surface); border: 1px solid var(--line); user-select: none; -webkit-user-select: none;
  -webkit-touch-callout: none; touch-action: pan-y pinch-zoom } /* el gesto horizontal (deslizar para responder) llega a la página; el zoom con dos dedos sigue */
.msg.mio .burbuja { color: var(--bg); border: 0 }
.msg.mio.A .burbuja { background: var(--a) } .msg.mio.B .burbuja { background: var(--rosa) }
.msg.mio .burbuja { border-bottom-right-radius: 5px } .msg.otro .burbuja { border-bottom-left-radius: 5px }
.burbuja .txt { white-space: pre-wrap; overflow-wrap: anywhere; font-size: .97rem; line-height: 1.35 }
.burbuja .hora { display: block; text-align: right; font-size: .68rem; opacity: .7; margin-top: 2px; white-space: nowrap }
.burbuja .hora .tilde { margin-left: 3px; font-weight: 800; letter-spacing: -3px; display: inline-block; padding-right: 3px }
/* verde "leído" que se vea sobre cada burbuja: claro sobre el lago oscuro, oscuro sobre las burbujas claras */
.burbuja .hora .tilde.t-leido { opacity: 1; color: #0a6b2c }
.msg.A .burbuja .hora .tilde.t-leido, .msg.mio.B .burbuja .hora .tilde.t-leido { color: #7dffa8 }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) .msg.A .burbuja .hora .tilde.t-leido, :root:not([data-theme="light"]) .msg.mio.B .burbuja .hora .tilde.t-leido { color: #0a6b2c } }
:root[data-theme="dark"] .msg.A .burbuja .hora .tilde.t-leido, :root[data-theme="dark"] .msg.mio.B .burbuja .hora .tilde.t-leido { color: #0a6b2c }
.msg.mio .burbuja .hora { opacity: .85 }
.burbuja.eliminado .txt { font-style: italic; opacity: .7 }
#chatPanel header .tit { flex: 1; min-width: 0; display: flex; flex-direction: column; line-height: 1.15 }
#chatPanel header .tit small { font-size: .78rem; color: var(--muted); min-height: 1em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis }
#chatPanel header .tit small.escribe { color: var(--accent); font-weight: 700 }
#chatPanel header button.ico { font-size: 1.15rem; padding: 6px }
#chatFijado { display: flex; align-items: center; gap: 10px; padding: 7px 12px; background: var(--surface); border-bottom: 1px solid var(--line); cursor: pointer }
#chatFijado[hidden], #chatBuscar[hidden], #chatDestacados[hidden], #chatAjustes[hidden] { display: none }
#chatAjustes { position: absolute; left: 0; right: 0; top: var(--cab, 62px); bottom: 0; z-index: 4; background: var(--bg); display: flex; flex-direction: column }
#chatAjustes .barra { display: flex; gap: 8px; align-items: center; padding: 8px 10px; background: var(--surface); border-bottom: 1px solid var(--line) }
#chatAjustes .barra b { flex: 1 } #chatAjustes .barra button { background: none; border: 0; color: var(--ink); font-size: 1.2rem; padding: 4px 8px }
#chatAjustes .op { display: flex; gap: 14px; align-items: flex-start; padding: 14px 16px; border-bottom: 1px solid var(--line); cursor: pointer }
#chatAjustes .op input { width: 22px; height: 22px; margin-top: 2px; accent-color: var(--accent); flex: none }
#chatAjustes .op b { display: block; font-size: .98rem } #chatAjustes .op small { display: block; color: var(--muted); font-size: .85rem; margin-top: 2px }
#chatAjustes .nota { color: var(--muted); font-size: .85rem; padding: 14px 16px; margin: 0 }
#chatFijado div { flex: 1; min-width: 0 } #chatFijado b { display: block; font-size: .75rem; color: var(--accent) }
#chatFijado .t { display: block; font-size: .88rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis }
#chatFijado button { background: none; border: 0; color: var(--muted); font-size: 1.1rem; padding: 4px 6px }
#chatBuscar, #chatDestacados { position: absolute; left: 0; right: 0; top: var(--cab, 62px); bottom: 0; z-index: 4; background: var(--bg); display: flex; flex-direction: column }
#chatBuscar .barra, #chatDestacados .barra { display: flex; gap: 8px; align-items: center; padding: 8px 10px; background: var(--surface); border-bottom: 1px solid var(--line) }
#chatBuscar input { flex: 1; font: inherit; font-size: 16px; padding: 9px 12px; border-radius: 20px; border: 1px solid var(--line); background: var(--bg); color: var(--ink) }
#chatBuscar .barra button, #chatDestacados .barra button { background: none; border: 0; color: var(--ink); font-size: 1.2rem; padding: 4px 8px }
#chatDestacados .barra b { flex: 1 }
.res { flex: 1; overflow-y: auto; padding: 4px 0 }
.res button { display: block; width: 100%; text-align: left; font: inherit; color: var(--ink); background: none; border: 0; border-bottom: 1px solid var(--line); padding: 10px 14px }
.res button small { display: block; color: var(--muted); font-size: .78rem }
.res button mark { background: color-mix(in srgb, var(--accent) 35%, transparent); color: inherit; border-radius: 3px }
.res p { color: var(--muted); padding: 16px; margin: 0 }
#chatAcciones .fila { flex-wrap: wrap }
.burbuja.sel { outline: 2px solid var(--accent); outline-offset: 2px }
.reacs { margin-top: -4px; background: var(--surface); border: 1px solid var(--line); border-radius: 12px; padding: 0 6px; font-size: .85rem; position: relative; z-index: 1 }
#chatForm { display: flex; align-items: flex-end; gap: 8px; padding: 8px 10px calc(8px + env(safe-area-inset-bottom, 0px)); background: var(--surface); border-top: 1px solid var(--line) }
#chatTexto { flex: 1; resize: none; border: 1px solid var(--line); border-radius: 20px; padding: 9px 14px; background: var(--bg); color: var(--ink); font: inherit; max-height: 130px; line-height: 1.3 }
.adj { width: 42px; height: 42px; border-radius: 50%; display: grid; place-items: center; font-size: 1.3rem; cursor: pointer; flex: none; background: var(--bg); border: 1px solid var(--line) }
#chatFotoHoja { position: absolute; left: 10px; bottom: calc(66px + env(safe-area-inset-bottom, 0px)); z-index: 3; background: var(--surface); border: 1px solid var(--line); border-radius: 14px; padding: 6px; display: flex; flex-direction: column; box-shadow: 0 8px 24px rgba(0,0,0,.25) }
#chatFotoHoja[hidden] { display: none }
#chatFotoHoja button, #chatFotoHoja label { font: inherit; text-align: left; background: none; border: 0; color: var(--ink); padding: 11px 14px; border-radius: 10px; cursor: pointer; font-weight: 600 }
#chatFotoHoja button:active, #chatFotoHoja label:active { background: var(--line) }
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
    const CAMPOS = 'id,autor,tipo,texto,reacciones,creado,archivo,ancho,alto,duracion_ms,externo,responde_a,editado';
    const M = window.ChatMedios, medios = new Map(); // id → nodo de foto/audio, se reusa entre redibujos
    let presionLargaHasta = 0; // el click que sigue a una presión larga no abre el visor
    let desliz = null; // deslizar para responder (se declara acá: pintarLista lo cancela al redibujar)
    function soltarDesliz() { if (desliz) { desliz.b.style.transform = ''; desliz = null; } }
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
  <header><button type="button" id="chatCerrar" aria-label="Volver">←</button><div class="av" aria-hidden="true"></div><div class="tit"><b class="nom"></b><small id="chatSub"></small></div><button type="button" class="ico" id="chatBuscarBtn" aria-label="Buscar en el chat">🔍</button><button type="button" class="ico" id="chatDestBtn" aria-label="Mensajes destacados">⭐</button><button type="button" class="ico" id="chatMenuBtn" aria-label="Ajustes del chat">☰</button></header>
  <div id="chatFijado" hidden role="button" tabindex="0"><span aria-hidden="true">📌</span><div><b>Mensaje fijado</b><span class="t"></span></div><button type="button" id="chatDesfijar" aria-label="Desfijar">✕</button></div>
  <div id="chatBuscar" hidden role="dialog" aria-label="Buscar en el chat"><div class="barra"><input id="chatBuscarQ" type="search" enterkeyhint="search" placeholder="Buscar en el chat" aria-label="Buscar en el chat"><button type="button" id="chatBuscarCerrar" aria-label="Cerrar">✕</button></div><div class="res"></div></div>
  <div id="chatAjustes" hidden role="dialog" aria-label="Ajustes del chat"><div class="barra"><b>Privacidad del chat</b><button type="button" id="chatAjustesCerrar" aria-label="Cerrar">✕</button></div>
    <label class="op"><input type="checkbox" data-priv="leido"><span><b>Confirmaciones de lectura</b><small>Tildes verdes cuando se ve un mensaje. Si las apagás, no las mandás ni las ves (como en WhatsApp).</small></span></label>
    <label class="op"><input type="checkbox" data-priv="ultimaVez"><span><b>Últ. vez y en línea</b><small>Si lo apagás, no mostrás cuándo estás en línea y tampoco ves la del otro.</small></span></label>
    <label class="op"><input type="checkbox" data-priv="escribiendo"><span><b>"Escribiendo…"</b><small>Si lo apagás, no se ve cuando escribís y tampoco ves cuando escribe el otro.</small></span></label>
    <p class="nota">Cada uno elige lo suyo. Los dos tildes grises (llegó) se ven siempre.</p></div>
  <div id="chatDestacados" hidden role="dialog" aria-label="Destacados"><div class="barra"><b>⭐ Destacados</b><button type="button" id="chatDestCerrar" aria-label="Cerrar">✕</button></div><div class="res"></div></div>
  <div id="chatLista"></div>
  <div id="chatCita" hidden><div class="t"><b></b><span></span></div><button type="button" id="chatCitaQuitar" aria-label="Cancelar respuesta">✕</button></div>
  <form id="chatForm" autocomplete="off">
    <button type="button" class="adj" id="chatFotoBtn" aria-label="Mandar foto" aria-expanded="false">📷</button><button type="button" class="adj" id="chatStickersBtn" aria-label="Stickers">😀</button><input type="file" id="chatFoto" accept="image/*" hidden>
    <textarea id="chatTexto" rows="1" enterkeyhint="enter" maxlength="${L.MAX_TEXTO}" placeholder="Mensaje" aria-label="Mensaje"></textarea>
    <button type="submit" id="chatEnviar" aria-label="Grabar audio">🎤</button>
    <div id="chatGrabando" hidden><span class="rec"></span><span class="t">0:00</span><span class="cancelar">◀ deslizá para cancelar</span></div>
  </form>
  <div id="chatFotoHoja" hidden role="menu"><button type="button" id="chatFotoCamara" role="menuitem">📷 Abrir cámara</button><label for="chatFoto" role="menuitem">🖼️ Elegir de la galería</label></div>
  <div id="chatVisor" hidden role="dialog" aria-label="Foto"><img alt=""></div>
  <div id="chatStickers" hidden role="dialog" aria-label="Stickers">
    <div class="tabs2" role="tablist"><button type="button" data-stab="nuestros" aria-selected="true">Nuestros</button><button type="button" data-stab="giphy" aria-selected="false">GIPHY</button>
      <button type="button" class="cerrar" id="chatStickersCerrar" aria-label="Cerrar">✕</button></div>
    <div class="cuerpo" data-spanel="nuestros"><div class="grilla"></div><input type="file" id="stickerInput" accept="image/*" hidden></div>
    <div class="cuerpo" data-spanel="giphy" hidden><input type="search" id="giphyQ" placeholder="Buscá: homero, messi, shrek…" aria-label="Buscar en GIPHY" enterkeyhint="search"><div class="grilla"></div><div class="giphy">Powered by GIPHY</div></div>
  </div>
  <div id="chatAcciones" hidden>
    <div class="reac">${L.REACCIONES.map((r) => `<button type="button" data-reac="${r}" aria-label="Reaccionar ${r}">${r}</button>`).join('')}</div>
    <div class="fila"><button type="button" class="btn ghost" id="chatResponder">Responder</button><button type="button" class="btn ghost" id="chatCopiar">Copiar</button><button type="button" class="btn ghost" id="chatEditar" hidden>Editar</button><button type="button" class="btn ghost" id="chatFijar">Fijar</button><button type="button" class="btn ghost" id="chatDestacar">Destacar</button><button type="button" class="btn ghost" id="chatBorrarMio">Eliminar para mí</button><button type="button" class="btn ghost" id="chatBorrar" hidden>Eliminar para todos</button><button type="button" class="btn ghost" id="chatCancelar">Cancelar</button></div>
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
      const visibles = lista.filter((m) => !ocultos.has(m.id)), ult = visibles[visibles.length - 1];
      $('chatBarra').querySelector('.ult').textContent = ult ? (ult.autor === yo() ? 'Vos: ' : '') + L.resumen(ult) : `Escribile a ${n[o] || 'tu compañero'} 💬`;
      const nl = abierto() ? 0 : L.noLeidos(visibles, yo(), visto());
      $('chatBadge').hidden = !nl; $('chatBadge').textContent = nl > 99 ? '99+' : String(nl);
      ajustarPadding();
    }
    function pintarLista() {
      const cont = $('chatLista');
      const alFondo = cont.scrollHeight - cont.scrollTop - cont.clientHeight < 120;
      // un redibujo en medio de un deslizamiento no lo corta: se pasa a la burbuja nueva del mismo mensaje (abajo)
      cont.replaceChildren();
      if (hayMas) { const b = document.createElement('button'); b.type = 'button'; b.id = 'chatMas'; b.className = 'link'; b.textContent = 'Ver anteriores'; cont.appendChild(b); }
      if (!lista.length) { const p = document.createElement('p'); p.className = 'vacio'; p.textContent = 'Todavía no hay mensajes. ¡Mandá el primero! 🚗'; cont.appendChild(p); }
      for (const m of lista) {
        if (ocultos.has(m.id)) continue; // eliminado para mí
        const fila = document.createElement('div'); fila.className = `msg ${m.autor === yo() ? 'mio' : 'otro'} ${m.autor}` + (m.id === resaltadoId && Date.now() < resaltadoHasta ? ' resaltado' : ''); fila.dataset.id = m.id;
        const bur = document.createElement('div'); bur.className = 'burbuja' + (m.id === selId ? ' sel' : ''); bur.dataset.id = m.id;
        const hora = document.createElement('span'); hora.className = 'hora'; hora.textContent = (destacados.has(m.id) && m.tipo !== 'eliminado' ? '⭐ ' : '') + (m.editado ? 'Editado ' : '') + L.horaCorta(m.creado);
        const ti = L.tilde(m, yo(), permite('leido') ? estados[otro()] : { ...estados[otro()], leido: null });
        if (ti) { const t = document.createElement('span'); t.className = 'tilde t-' + ti; t.textContent = ti === 'reloj' ? '🕓' : ti === 'enviado' ? '✓' : '✓✓'; t.setAttribute('aria-label', { reloj: 'Enviando', enviado: 'Enviado', entregado: 'Entregado', leido: 'Leído' }[ti]); hora.appendChild(t); }
        if (m.responde_a && m.tipo !== 'eliminado') bur.appendChild(nodoCita(m.responde_a));
        if (m.tipo === 'sticker') {
          bur.classList.add('sticker', 'media'); if (m.subiendo) bur.classList.add('subiendo');
          bur.appendChild(nodoSticker(m));
        } else if (m.tipo === 'foto' || m.tipo === 'audio') {
          bur.classList.add('media'); if (m.subiendo) bur.classList.add('subiendo');
          bur.appendChild(m.tipo === 'foto' ? nodoFoto(m) : nodoAudio(m));
          if (m.subiendo) { const e = document.createElement('div'); e.className = 'estado'; e.textContent = 'Subiendo…'; bur.appendChild(e); }
        } else { if (m.tipo === 'eliminado') { bur.classList.add('eliminado'); medios.delete(m.id); } const txt = document.createElement('div'); txt.className = 'txt'; txt.textContent = m.tipo === 'eliminado' ? L.resumen(m) : m.texto || L.resumen(m); bur.appendChild(txt); }
        bur.appendChild(hora); fila.appendChild(bur);
        const rs = m.tipo === 'eliminado' ? [] : Object.values(m.reacciones || {});
        if (rs.length) { const r = document.createElement('div'); r.className = 'reacs'; r.textContent = rs[0] === rs[1] ? `${rs[0]} 2` : rs.join(' '); fila.appendChild(r); }
        cont.appendChild(fila);
      }
      if (alFondo) cont.scrollTop = cont.scrollHeight;
      if (desliz) { const nb = [...cont.querySelectorAll('.burbuja')].find((x) => x.dataset.id === desliz.id); if (nb) { desliz.b = nb; if (desliz.dx > 10) nb.style.transform = `translateX(${Math.min(desliz.dx, 80)}px)`; } else desliz = null; }
    }
    const pintar = () => { pintarCabeceras(); pintarSub(); pintarFijado(); if (abierto()) pintarLista(); marcarEstado(); };

    /* ---------- tildes: entregado / leído (chat_estado) ---------- */
    const estados = { A: null, B: null };
    // privacidad de cada uno: si uno apaga algo, ninguno de los dos lo ve (regla de WhatsApp)
    const priv = { A: {}, B: {} };
    const miPriv = (k) => priv[yo()]?.[k] !== false;
    const permite = (k) => priv.A?.[k] !== false && priv.B?.[k] !== false;
    if (db) for (const k of ['A', 'B']) db.doc('chatpriv/' + k).onSnapshot((d) => { priv[k] = (d.exists && d.data()) || {}; privCargado[k] = true; presente(); pintar(); pintarAjustes(); });
    function pintarAjustes() { document.querySelectorAll('#chatAjustes [data-priv]').forEach((c) => { c.checked = miPriv(c.dataset.priv); }); }
    let marcado = { ent: 0, lei: 0 }, marcando = false, otraMarca = false, otraVisto = false, sinLeerHastaAbrir = false;
    const privCargado = { A: false, B: false };
    const maxDelOtro = () => lista.reduce((mx, m) => (m.autor === otro() && !String(m.id).startsWith('tmp-') ? Math.max(mx, Date.parse(m.creado)) : mx), 0);
    async function cargarEstados() {
      const { data, error } = await sb.from('chat_estado').select('*');
      if (error) return console.warn('estado del chat', error.message);
      for (const e of data || []) estados[e.quien] = e;
      pintar();
    }
    async function marcarEstado(visto) {
      if (marcando) { otraMarca = true; otraVisto = otraVisto || !!visto; return; }
      // leído solo con el chat a la vista (sin búsqueda, destacados, ajustes, visor, stickers ni cámara encima),
      // con mis ajustes ya cargados y no justo después de cambiar "Soy"
      const tapado = ['chatBuscar', 'chatDestacados', 'chatAjustes', 'chatVisor', 'chatStickers', 'camara', 'albumVisor', 'editorFoto'].some((x) => $(x) && !$(x).hidden);
      const hasta = maxDelOtro(), leyendo = abierto() && !document.hidden && !tapado && !sinLeerHastaAbrir && privCargado[yo()] && miPriv('leido');
      if (visto && !miPriv('ultimaVez')) visto = false;
      const ent = hasta > marcado.ent ? hasta : 0, lei = leyendo && hasta > marcado.lei ? hasta : 0;
      if (!ent && !lei && !visto) return;
      marcando = true;
      try {
        const { data, error } = await sb.rpc('chat_marcar', { p_quien: yo(), p_entregado: ent ? new Date(ent).toISOString() : null, p_leido: lei ? new Date(lei).toISOString() : null, p_visto: !!visto });
        if (error) throw error;
        if (ent) marcado.ent = ent; if (lei) marcado.lei = lei;
        estados[yo()] = data; avisar('estado', { fila: data });
      } catch (e) { console.warn('no se pudo marcar el estado', e.message); }
      finally { marcando = false; if (otraMarca) { const v = otraVisto; otraMarca = false; otraVisto = false; marcarEstado(v); } }
    }
    // el service worker marca "entregado" cuando llega el aviso con la app cerrada: necesita saber el viaje y quién soy
    function guardarParaAvisos() {
      try { caches.open('rumbo-config').then((c) => c.put('./__chat', new Response(JSON.stringify({ viaje, quien: yo(), url: sb.supabaseUrl, key: sb.supabaseKey }), { headers: { 'Content-Type': 'application/json' } }))).catch(() => {}); } catch {}
    }
    guardarParaAvisos();

    /* ---------- en línea / últ. vez / escribiendo ---------- */
    let enLinea = false, escribeHasta = 0, ultimoEscribo = 0;
    function pintarSub() {
      const el = $('chatSub'); if (!el) return;
      const escribe = Date.now() < escribeHasta && permite('escribiendo');
      el.classList.toggle('escribe', escribe);
      el.textContent = escribe ? 'escribiendo…' : !permite('ultimaVez') ? '' : enLinea ? 'en línea' : L.ultimaVez(estados[otro()]?.visto_en);
    }
    canal.on('presence', { event: 'sync' }, () => {
      try { enLinea = Object.values(canal.presenceState()).flat().some((p) => p.quien === otro()); } catch { enLinea = false; }
      pintarSub();
    });
    // presencia: solo se avisa cuando cambia (cada track de más hace que el canal se reconecte y se pierdan mensajes)
    let enPresencia = null;
    function presente() {
      if (!privCargado[yo()]) return; // se vuelve a llamar cuando llegan mis ajustes
      const quiero = !document.hidden && miPriv('ultimaVez');
      if (quiero === enPresencia) return;
      if (miPriv('ultimaVez') && (quiero || enPresencia !== null)) marcarEstado(true); // últ. vez = al abrir y al irse
      enPresencia = quiero;
      if (quiero) canal.track?.({ quien: yo() })?.catch?.(() => {}); else canal.untrack?.()?.catch?.(() => {});
    }
    document.addEventListener('visibilitychange', presente);
    setTimeout(presente, 1500);
    // el canal se reconectó (mala señal): la presencia se perdió y pudieron perderse estados
    window.alSuscribirCanal = () => { enPresencia = null; presente(); cargarEstados(); };

    /* ---------- fijado (compartido) y destacados / eliminados para mí (de este teléfono) ---------- */
    let fijadoId = null, pidiendoFijo = false;
    if (db) db.doc('chatfijo/actual').onSnapshot((d) => { fijadoId = d.exists ? d.data()?.id || null : null; pintarFijado(); });
    function pintarFijado() {
      const el = $('chatFijado'); if (!el) return;
      const o = fijadoId && originalDe(fijadoId);
      el.hidden = !fijadoId || o === null || (o && o.tipo === 'eliminado') || ocultos.has(fijadoId);
      if (!el.hidden) el.querySelector('.t').textContent = o ? L.resumen(o) : '…';
      if (fijadoId && o === undefined && !pidiendoFijo) { pidiendoFijo = true; traerMensajes([fijadoId]).finally(() => { pidiendoFijo = false; }); } // uno a la vez; si falla, espera (citasEsperaHasta)
    }
    async function traerMensajes(ids) {
      if (!ids.length || Date.now() < citasEsperaHasta) return;
      const { data, error } = await sb.from('mensajes').select('id,autor,tipo,texto,creado').in('id', ids);
      if (error) { citasEsperaHasta = Date.now() + 30000; return; }
      for (const id of ids) citados.set(id, (data || []).find((x) => x.id === id) || null);
      pintar();
    }
    const claveLocal = (k) => 'chat' + k + ':' + viaje;
    const leerSet = (k) => { try { return new Set(JSON.parse(localStorage.getItem(claveLocal(k)) || '[]')); } catch { return new Set(); } };
    const guardarSet = (k, s) => { try { localStorage.setItem(claveLocal(k), JSON.stringify([...s])); } catch {} };
    const destacados = leerSet('Destacados'), ocultos = leerSet('Ocultos');

    /* ---------- responder citando ---------- */
    let citando = null; const citados = new Map(); let buscandoCitas = false, citasEsperaHasta = 0; // citados: id → mensaje (o null si ya no existe)
    let resaltadoId = null, resaltadoHasta = 0;
    function originalDe(id) { return lista.find((x) => x.id === id) || citados.get(id); }
    function nodoCita(id) {
      const o = originalDe(id), c = document.createElement('button'); c.type = 'button'; c.className = 'cita' + (o ? ' ' + o.autor : ''); c.dataset.cita = id;
      const b = document.createElement('b'); b.textContent = o ? (o.autor === yo() ? 'Vos' : nombres()[o.autor] || '') : '';
      const sp = document.createElement('span'); sp.textContent = o === undefined ? '…' : L.textoCita(o);
      c.append(b, sp);
      if (o === undefined && Date.now() >= citasEsperaHasta) buscarCitas();
      return c;
    }
    async function buscarCitas() {
      if (buscandoCitas || Date.now() < citasEsperaHasta) return;
      const ids = L.citasFaltantes(lista, citados); if (!ids.length) return;
      buscandoCitas = true;
      try {
        const { data, error } = await sb.from('mensajes').select('id,autor,tipo,texto,creado').in('id', ids);
        if (error) throw error;
        for (const id of ids) citados.set(id, (data || []).find((x) => x.id === id) || null);
      } catch (e) {
        console.warn('citas en espera', e.message);
        citasEsperaHasta = Date.now() + 30000; // se reintenta en 30 s, o antes si vuelve la señal o la app
        return;
      } finally { buscandoCitas = false; }
      if (abierto()) pintarLista();
    }
    function responder(id) {
      const o = originalDe(id); if (!o) return;
      if (editandoMsg) { editandoMsg = null; $('chatTexto').value = ''; autoAlto(); actualizarBoton(); } // responder cancela la edición
      citando = id;
      $('chatCita').querySelector('b').textContent = 'Respondiendo a ' + (o.autor === yo() ? 'vos' : nombres()[o.autor] || '');
      $('chatCita').querySelector('span').textContent = L.textoCita(o);
      $('chatCita').hidden = false; $('chatTexto').focus();
    }
    let editandoMsg = null;
    function quitarCita() { citando = null; if (editandoMsg) { editandoMsg = null; $('chatTexto').value = ''; autoAlto?.(); actualizarBoton?.(); } $('chatCita').hidden = true; }
    function editar(id) {
      const m = lista.find((x) => x.id === id); if (!m || !L.puedeEditar(m, yo())) return;
      citando = null; editandoMsg = id;
      $('chatCita').querySelector('b').textContent = 'Editando mensaje'; $('chatCita').querySelector('span').textContent = m.texto;
      $('chatCita').hidden = false; $('chatTexto').value = m.texto; autoAlto(); actualizarBoton(); $('chatTexto').focus();
    }
    async function guardarEdicion() {
      const id = editandoMsg, t = $('chatTexto').value;
      if (!L.textoValido(t)) return;
      enviando = true;
      const { data, error } = await sb.rpc('editar_mensaje', { p_id: id, p_texto: t });
      enviando = false;
      if (error) { console.error(error); return window.aviso?.(error.code === 'P0002' ? 'Ya no se puede editar: pasaron los 15 minutos.' : 'No se pudo editar. Probá de nuevo.'); }
      const fila = Array.isArray(data) ? data[0] : data;
      editandoMsg = null; $('chatCita').hidden = true; $('chatTexto').value = ''; autoAlto(); actualizarBoton();
      if (fila) { lista = L.fusionar(lista, fila); pintar(); avisar('cambio', { m: fila }); }
    }
    // al mandar: se usa la cita actual y se limpia solo si salió bien
    // al mandar: se toma la cita y la barra se va enseguida (lo siguiente que escriba no hereda la cita)
    const usarCita = () => { const c = citando; quitarCita(); return c; };
    const devolverCita = (c) => { if (c && !citando && originalDe(c)) responder(c); };
    const citaUsada = () => {};
    /** insert de un mensaje; si la cita fue rechazada (el original ya no existe), sale sin cita y avisa */
    async function insertarMensaje(fila) {
      let r = await sb.from('mensajes').insert(fila).select(CAMPOS).single();
      if (r.error && fila.responde_a && ['23514', '22P02'].includes(r.error.code)) {
        citados.set(fila.responde_a, null);
        window.aviso?.('El mensaje que citabas se borró: se mandó sin la cita.');
        r = await sb.from('mensajes').insert({ ...fila, responde_a: null }).select(CAMPOS).single();
      }
      return r;
    }
    $('chatCitaQuitar').addEventListener('click', quitarCita);
    async function irAlOriginal(id) {
      if (citados.get(id) === null) return window.aviso?.('Ese mensaje se borró.');
      // si es más viejo que lo cargado, se traen páginas hasta llegar (con tope)
      for (let i = 0; i < 20 && !lista.some((x) => x.id === id) && hayMas; i++) await cargar(lista[0]?.creado);
      const fila = [...$('chatLista').querySelectorAll('.msg')].find((x) => x.dataset.id === id); // (acá CSS es la hoja de estilos del chat, no window.CSS)
      if (!fila) return window.aviso?.('No encontré ese mensaje.');
      resaltadoId = id; resaltadoHasta = Date.now() + 1700;
      fila.scrollIntoView({ block: 'center', behavior: 'smooth' });
      fila.classList.remove('resaltado'); void fila.offsetWidth; fila.classList.add('resaltado');
      setTimeout(() => { if (resaltadoId === id && Date.now() >= resaltadoHasta) document.querySelectorAll('#chatLista .msg.resaltado').forEach((x) => x.classList.remove('resaltado')); }, 1750);
    }

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
    const reintentar = () => { M.reintentarYa(); citasEsperaHasta = 0; pintar(); };
    window.addEventListener('online', reintentar);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) reintentar(); });
    // borrados remotos o reconciliados: se corta el audio y se suelta el nodo
    function limpiarMedios() {
      for (const [id, nodo] of medios) if (!id.startsWith('tmp-') && !lista.some((x) => x.id === id)) { nodo.querySelector?.('audio')?.pause(); medios.delete(id); }
    }
    function nodoSticker(m) {
      let img = medios.get(m.id);
      if (!img) {
        img = document.createElement('img'); img.className = 'stk'; img.alt = 'Sticker'; img.loading = 'lazy'; img.draggable = false;
        img.addEventListener('error', () => {
          const mm = lista.find((x) => x.id === img.dataset.id); if (!mm?.archivo || img.dataset.reintento) return;
          img.dataset.reintento = '1'; img.removeAttribute('src'); M.reintentarYa(); pedirFirma(mm.archivo);
        });
        img.addEventListener('load', () => { delete img.dataset.reintento; });
        medios.set(m.id, img);
      }
      img.dataset.id = m.id;
      if (m.externo) { if (L.externoValido(m.externo) && img.getAttribute('src') !== m.externo) img.src = m.externo; } // lo que llega por broadcast también se valida
      else ponerSrc(img, m);
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
      const cita = usarCita();
      const tmp = { id: 'tmp-a' + Date.now(), autor: yo(), tipo: 'audio', creado: new Date().toISOString(), reacciones: {}, subiendo: true, duracion_ms: ms, local: URL.createObjectURL(blob), responde_a: cita };
      lista = L.fusionar(lista, tmp); pintar(); $('chatLista').scrollTop = $('chatLista').scrollHeight;
      try {
        const archivo = L.rutaArchivo(viaje, 'audio', crypto.randomUUID());
        const up = await sb.storage.from(M.BUCKET).upload(archivo, blob, { contentType: blob.type || 'audio/webm' });
        if (up.error) throw up.error;
        const { data, error } = await insertarMensaje({ viaje, autor: yo(), tipo: 'audio', archivo, duracion_ms: ms, responde_a: cita });
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
      const cita = usarCita();
      const tmp = { id: 'tmp-' + Date.now(), autor: yo(), tipo: 'foto', creado: new Date().toISOString(), reacciones: {}, subiendo: true, local: URL.createObjectURL(file), ancho: 4, alto: 3, responde_a: cita };
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
        const { data, error } = await insertarMensaje({ viaje, autor: yo(), tipo: 'foto', archivo, ancho: c.ancho, alto: c.alto, responde_a: cita });
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
    window.chatEnviarFoto = enviarFoto;
    // 📷: cámara del álbum (si está) o la galería
    // la hoja tiene su lugar en el historial: atrás la cierra sin cerrar el chat
    function mostrarHoja(si) { $('chatFotoHoja').hidden = !si; $('chatFotoBtn').setAttribute('aria-expanded', String(si)); }
    function abrirHoja() { mostrarHoja(true); history.pushState({ ...(history.state || {}), chat: 1, hoja: 1 }, '', '#chat'); }
    function cerrarHoja() { if ($('chatFotoHoja').hidden) return; if (history.state?.hoja) history.back(); else mostrarHoja(false); }
    const editandoAviso = () => { if (!editandoMsg) return false; window.aviso?.('Terminá o cancelá la edición primero (✕ arriba del teclado).'); return true; };
    $('chatFotoBtn').addEventListener('click', () => { if (editandoAviso()) return; if (!window.abrirCamara) return $('chatFoto').click(); if ($('chatFotoHoja').hidden) abrirHoja(); else cerrarHoja(); });
    $('chatFotoCamara').addEventListener('click', () => { mostrarHoja(false); window.abrirCamara?.({ alChat: true, reemplazar: !!history.state?.hoja }); });
    $('chatFotoHoja').querySelector('label').addEventListener('click', () => setTimeout(cerrarHoja, 0));
    document.addEventListener('pointerdown', (e) => { if (!$('chatFotoHoja').hidden && !e.target.closest('#chatFotoHoja, #chatFotoBtn')) cerrarHoja(); });

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
    $('chatStickersBtn').addEventListener('click', () => { if (!editandoAviso()) abrirStickers(); });
    $('chatStickersCerrar').addEventListener('click', cerrarStickers);
    document.querySelector('#chatStickers .tabs2').addEventListener('click', (e) => { const b = e.target.closest('[data-stab]'); if (b) mostrarTabStk(b.dataset.stab); });
    async function mandarSticker(fuente) {
      cerrarStickers();
      const cita = usarCita();
      const { data, error } = await insertarMensaje({ viaje, autor: yo(), tipo: 'sticker', ...fuente, responde_a: cita });
      if (error) devolverCita(cita);
      if (error) { console.error(error); return window.aviso?.('No se pudo mandar el sticker. Revisá la conexión.'); }
      lista = L.fusionar(lista, data); marcarVisto(); pintar(); $('chatLista').scrollTop = $('chatLista').scrollHeight;
      avisar('nuevo', { m: data });
    }
    window.mandarStickerExterno = (url) => mandarSticker({ externo: url });

    // GIPHY: búsqueda con debounce, sin reintentos automáticos (la cuota gratis es chica)
    const panelG = document.querySelector('[data-spanel="giphy"]'), grillaG = panelG.querySelector('.grilla');
    let ultimaQ = null, timerG = null, turnoG = 0;
    const notaG = (t) => { const p = document.createElement('p'); p.className = 'nota'; p.style.gridColumn = '1 / -1'; p.textContent = t; grillaG.replaceChildren(p); };
    async function buscarG(q) {
      const clave = window.GIPHY_KEY;
      if (!clave) return notaG('Falta configurar GIPHY.');
      if (q === ultimaQ) return; ultimaQ = q;
      const turno = ++turnoG; notaG('Buscando…');
      try {
        const res = await M.buscarGiphy(clave, q);
        if (turno !== turnoG) return;
        if (!res.length) return notaG('No encontré stickers para eso. Probá con otra palabra.');
        grillaG.replaceChildren(...res.map((g) => { const d = document.createElement('div'); const i = document.createElement('img'); i.src = g.url; i.alt = g.titulo; i.loading = 'lazy'; i.draggable = false; i.dataset.externo = g.url; d.appendChild(i); return d; }));
      } catch (e) {
        if (turno !== turnoG) return;
        ultimaQ = null; // se puede reintentar escribiendo de nuevo
        notaG(e.message === 'cuota' ? 'Se alcanzó el límite de GIPHY por esta hora. Probá más tarde o usá "Nuestros".'
          : e.message === 'clave' ? 'La clave de GIPHY no es válida.' : 'No se pudo conectar con GIPHY. Revisá la señal.');
      }
    }
    window.alAbrirGiphy = () => { if (!window.GIPHY_KEY) return notaG('Falta configurar GIPHY.'); if (ultimaQ === null) buscarG($('giphyQ').value.trim()); };
    $('giphyQ').addEventListener('input', () => { clearTimeout(timerG); timerG = setTimeout(() => buscarG($('giphyQ').value.trim()), 400); });
    $('giphyQ').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); clearTimeout(timerG); buscarG($('giphyQ').value.trim()); } });
    grillaG.addEventListener('click', (e) => { const i = e.target.closest('img[data-externo]'); if (i) mandarSticker({ externo: i.dataset.externo }); });
    document.querySelector('[data-spanel="nuestros"] .grilla').addEventListener('click', async (e) => {
      if (e.target.id === 'stkEditar') { editando = !editando; return pintarNuestros(); }
      const q = e.target.closest('[data-quitar-stk]');
      if (q) {
        // Doble toque, como borrar un mensaje. El archivo nunca se borra: lo pueden estar usando mensajes (pesa ~30 KB).
        if (!q.classList.contains('armed')) { q.classList.add('armed'); q.textContent = '?'; setTimeout(() => { q.classList.remove('armed'); q.textContent = '✕'; }, 3000); return; }
        try { await db.doc('stickers/' + q.dataset.quitarStk).delete(); }
        catch (err) { console.error(err); window.aviso?.('No se pudo quitar el sticker. Probá de nuevo.'); }
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
    let cuadro = 0;
    function dibujarEd() { // un dibujo por frame, directo en el canvas
      if (!ed || cuadro) return;
      cuadro = requestAnimationFrame(() => {
        cuadro = 0; if (!ed) return;
        const corte = Math.min(ed.bm.width, ed.bm.height) / ed.zoom;
        ed.cx = Math.min(Math.max(corte / 2, ed.cx), ed.bm.width - corte / 2); ed.cy = Math.min(Math.max(corte / 2, ed.cy), ed.bm.height - corte / 2);
        const cv = document.querySelector('#stickerEditor canvas');
        M.pintarSticker(cv.getContext('2d'), ed.bm, { x: ed.cx, y: ed.cy, zoom: ed.zoom }, $('stickerTexto').value, cv.width);
      });
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
      const miEd = ed, archivo = L.rutaArchivo(viaje, 'sticker', crypto.randomUUID());
      try {
        const blob = await M.hacerSticker(ed.bm, { x: ed.cx, y: ed.cy, zoom: ed.zoom }, $('stickerTexto').value);
        const up = await sb.storage.from(M.BUCKET).upload(archivo, blob, { contentType: blob.type });
        if (up.error) throw up.error;
        if (ed !== miEd) { sb.storage.from(M.BUCKET).remove([archivo]); return; } // apretó atrás mientras subía: se cancela
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
    // la página lo llama en cada redibujo del encabezado (también al recargar la config): solo se cancela la respuesta si cambió quién soy
    let soyAntes = yo();
    window.alCambiarSoyChat = () => { if (yo() !== soyAntes) { soyAntes = yo(); quitarCita(); marcado = { ent: 0, lei: 0 }; sinLeerHastaAbrir = true; enPresencia = null; presente(); guardarParaAvisos(); } pintar(); };

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
        if (citando && !lista.some((x) => x.id === citando) && !citados.get(citando)) quitarCita();
      }
      if (abierto()) marcarVisto();
      pintar();
      if (antesDe) cont.scrollTop = arriba + (cont.scrollHeight - altoAntes); // que no salte al anteponer
    }
    canal.on('broadcast', { event: 'chat' }, ({ payload: p }) => {
      if (!p) return;
      if (p.accion === 'estado' && p.fila?.quien) { estados[p.fila.quien] = p.fila; pintar(); return; }
      if (p.accion === 'escribiendo') { if (p.quien === otro()) { escribeHasta = Date.now() + 4000; pintarSub(); setTimeout(pintarSub, 4100); } return; }
      if (p.accion === 'nuevo' && p.m?.autor === otro()) escribeHasta = 0;
      if (p.accion === 'cambio' && p.m?.id && !lista.some((x) => x.id === p.m.id)) { if (citados.has(p.m.id)) { citados.set(p.m.id, p.m); pintar(); } return; }
      if ((p.accion === 'nuevo' || p.accion === 'cambio') && p.m?.id) lista = L.fusionar(lista, p.m);
      else if (p.accion === 'borrado' && p.id) { lista = L.quitar(lista, p.id); citados.set(p.id, null); if (citando === p.id) quitarCita(); limpiarMedios(); }
      else return;
      if (abierto()) marcarVisto();
      pintar();
    });
    document.addEventListener('visibilitychange', () => { if (!document.hidden) cargar(); });

    async function enviar() {
      const t = $('chatTexto').value;
      if (enviando || !L.textoValido(t)) return;
      if (editandoMsg) return guardarEdicion();
      enviando = true; $('chatEnviar').disabled = true;
      $('chatTexto').value = ''; autoAlto(); actualizarBoton();
      const cita = usarCita();
      const { data, error } = await insertarMensaje({ viaje, autor: yo(), texto: t.trim(), responde_a: cita });
      if (error) devolverCita(cita);
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
      $('chatPanel').hidden = false; document.documentElement.style.overflow = 'hidden'; sinLeerHastaAbrir = false;
      marcarVisto(); pintar();
      const cont = $('chatLista'); cont.scrollTop = cont.scrollHeight;
    }
    function cerrarPanel() { ocultarAcciones(); ocultarStickers(); cerrarEditor(); mostrarHoja(false); $('chatBuscar').hidden = true; $('chatDestacados').hidden = true; $('chatAjustes').hidden = true; $('chatPanel').hidden = true; document.documentElement.style.overflow = ''; marcarVisto(); pintar(); }
    $('chatBarra').addEventListener('click', abrirPanel);
    $('chatBarra').addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); abrirPanel(); } });
    $('chatCerrar').addEventListener('click', () => { if (history.state?.chat) history.back(); else { history.replaceState(null, '', sinHash()); cerrarPanel(); } });
    window.addEventListener('popstate', () => {
      if (!$('chatFotoHoja').hidden && !history.state?.hoja) { mostrarHoja(false); if (location.hash === '#chat') return; }
      for (const capa of ['chatBuscar', 'chatDestacados', 'chatAjustes']) if (!$(capa).hidden && history.state?.capa !== capa) { $(capa).hidden = true; marcarEstado(); if (location.hash === '#chat') return; }
      if (!$('stickerEditor').hidden && !history.state?.stked) { cerrarEditor(); if (location.hash === '#chat' && history.state?.stk) return; }
      if (!$('chatStickers').hidden && !history.state?.stk) { ocultarStickers(); if (location.hash === '#chat') return; }
      if (!$('chatVisor').hidden && !history.state?.foto) { cerrarVisor(); if (location.hash === '#chat') return; }
      if (!$('chatAcciones').hidden && !history.state?.acc) { ocultarAcciones(); if (location.hash === '#chat') return; }
      if (location.hash === '#chat') abrirPanel(); else if (abierto()) cerrarPanel();
    });
    navigator.serviceWorker?.addEventListener('message', (e) => { if (e.data?.abrir === 'chat') { window.cerrarCapas?.(); abrirPanel(); } });

    /* ---------- escribir ---------- */
    function autoAlto() { const t = $('chatTexto'); t.style.height = 'auto'; t.style.height = Math.min(t.scrollHeight, 130) + 'px'; }
    $('chatTexto').addEventListener('input', autoAlto);
    $('chatTexto').addEventListener('input', () => { if (!editandoMsg && privCargado[yo()] && miPriv('escribiendo') && $('chatTexto').value.trim() && Date.now() - ultimoEscribo > 2500) { ultimoEscribo = Date.now(); avisar('escribiendo', { quien: yo() }); } });
    $('chatTexto').addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey && !tactil) { e.preventDefault(); enviar(); } });
    $('chatForm').addEventListener('submit', (e) => { e.preventDefault(); if (!modoMic()) enviar(); });

    /* ---------- reacciones y borrar (mantener apretado) ---------- */
    function abrirAcciones(id) {
      const m = lista.find((x) => x.id === id); if (!m) return;
      selId = id; pintarLista();
      document.querySelectorAll('#chatAcciones [data-reac]').forEach((b) => b.classList.toggle('mia', m.reacciones?.[yo()] === b.dataset.reac));
      $('chatCopiar').hidden = !m.texto;
      $('chatResponder').hidden = id.startsWith('tmp-');
      const borrar = $('chatBorrar'); borrar.hidden = m.autor !== yo() || m.tipo === 'eliminado' || id.startsWith('tmp-'); borrar.classList.remove('armed'); borrar.textContent = 'Eliminar para todos';
      $('chatEditar').hidden = !L.puedeEditar(m, yo());
      $('chatFijar').hidden = m.tipo === 'eliminado' || id.startsWith('tmp-'); $('chatFijar').textContent = fijadoId === id ? 'Desfijar' : 'Fijar';
      $('chatDestacar').hidden = m.tipo === 'eliminado' || id.startsWith('tmp-'); $('chatDestacar').textContent = destacados.has(id) ? 'Quitar destacado' : 'Destacar';
      $('chatBorrarMio').hidden = id.startsWith('tmp-');
      $('chatAcciones').querySelector('.reac').hidden = m.tipo === 'eliminado';
      if (m.tipo === 'eliminado') { $('chatResponder').hidden = true; $('chatCopiar').hidden = true; }
      $('chatAcciones').hidden = false;
      history.pushState({ chat: 1, acc: 1 }, '', '#chat');
    }
    function ocultarAcciones() { $('chatAcciones').hidden = true; if (selId) { selId = null; if (abierto()) pintarLista(); } }
    function cerrarAcciones() { const habia = !$('chatAcciones').hidden; ocultarAcciones(); if (habia && history.state?.acc) history.back(); }
    const cancelarTimer = () => { clearTimeout(timer); timer = null; };
    $('chatLista').addEventListener('pointerdown', (e) => {
      const b = e.target.closest('.burbuja'); if (!b) return;
      cancelarTimer(); timer = setTimeout(() => { timer = null; if (desliz) desliz.menu = true; /* se abrió el menú: ya no es un deslizamiento */ presionLargaHasta = Date.now() + 700; navigator.vibrate?.(15); abrirAcciones(b.dataset.id); }, 500);
    });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => $('chatLista').addEventListener(ev, cancelarTimer));
    $('chatLista').addEventListener('scroll', cancelarTimer, { passive: true });
    $('chatLista').addEventListener('contextmenu', (e) => { const b = e.target.closest('.burbuja'); if (b) { e.preventDefault(); cancelarTimer(); abrirAcciones(b.dataset.id); } });
    $('chatLista').addEventListener('click', (e) => {
      if (e.target.id === 'chatMas') return cargar(lista[0]?.creado);
      const ci = e.target.closest('.cita[data-cita]'); if (ci) return irAlOriginal(ci.dataset.cita);
      const pl = e.target.closest('.audio .play'); if (pl) return tocarAudio(pl.closest('.audio'));
      const f = e.target.closest('img.foto'); if (f && Date.now() > presionLargaHasta) abrirVisor(f.dataset.id);
    });
    $('chatCancelar').addEventListener('click', cerrarAcciones);
    $('chatResponder').addEventListener('click', () => { const id = selId; cerrarAcciones(); if (id) responder(id); });
    // deslizar una burbuja a la derecha = responder (como en WhatsApp)
    $('chatLista').addEventListener('pointerdown', (e) => { const b = e.target.closest('.burbuja'); if (b && !b.dataset.id.startsWith('tmp-')) desliz = { b, id: b.dataset.id, x: e.clientX, y: e.clientY, dx: 0 }; });
    $('chatLista').addEventListener('pointermove', (e) => {
      if (!desliz) return;
      const dx = e.clientX - desliz.x, dy = e.clientY - desliz.y;
      if (Math.abs(dy) > 30 && Math.abs(dy) > dx) { desliz.b.style.transform = ''; desliz = null; return; }
      if (dx > 10) { cancelarTimer(); desliz.dx = dx; desliz.b.style.transform = `translateX(${Math.min(dx, 80)}px)`; }
    });
    const finDesliz = (e) => {
      if (!desliz) return;
      const { b, id, dx, menu } = desliz; desliz = null;
      b.style.transition = 'transform .15s'; b.style.transform = ''; setTimeout(() => { b.style.transition = ''; }, 160);
      // solo un dedo que se levanta confirma (no un gesto cancelado, como el atrás de Android), y no si ya se abrió el menú
      if (e.type === 'pointerup' && dx > 60 && !menu && $('chatAcciones').hidden) { presionLargaHasta = Date.now() + 400; navigator.vibrate?.(10); responder(id); }
    };
    window.addEventListener('pointerup', finDesliz); $('chatLista').addEventListener('pointercancel', finDesliz); // salirse del borde no corta el gesto: cuenta dónde se levanta el dedo
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
    $('chatEditar').addEventListener('click', () => { const id = selId; cerrarAcciones(); if (id) editar(id); });
    $('chatBorrarMio').addEventListener('click', () => { const id = selId; cerrarAcciones(); if (!id) return; ocultos.add(id); guardarSet('Ocultos', ocultos); if (citando === id || editandoMsg === id) quitarCita(); pintar(); });
    $('chatDestacar').addEventListener('click', () => { const id = selId; cerrarAcciones(); if (!id) return; if (destacados.has(id)) destacados.delete(id); else destacados.add(id); guardarSet('Destacados', destacados); pintar(); });
    $('chatFijar').addEventListener('click', () => { const id = selId; cerrarAcciones(); if (!id || !db) return; db.doc('chatfijo/actual').set({ id: fijadoId === id ? null : id }).catch((e) => { console.error(e); window.aviso?.('No se pudo fijar. Probá de nuevo.'); }); });
    $('chatDesfijar').addEventListener('click', (e) => { e.stopPropagation(); db?.doc('chatfijo/actual').set({ id: null }); });
    $('chatFijado').addEventListener('click', () => { if (fijadoId) irAlOriginal(fijadoId); });

    /* ---------- buscar en el chat y destacados (capas con su lugar en el historial) ---------- */
    function abrirCapa(id) {
      const otra = ['chatBuscar', 'chatDestacados', 'chatAjustes'].find((x) => !$(x).hidden);
      if (otra === id) return; // ya abierta (doble toque)
      if (otra) { $(otra).hidden = true; $(id).hidden = false; history.replaceState({ chat: 1, capa: id }, '', '#chat'); return; }
      $(id).hidden = false; $('chatPanel').style.setProperty('--cab', $('chatPanel').querySelector('header').offsetHeight + 'px'); history.pushState({ chat: 1, capa: id }, '', '#chat'); }
    function cerrarCapa(id) { if ($(id).hidden) return; if (history.state?.capa === id) history.back(); else $(id).hidden = true; }
    const filaRes = (m, marca) => {
      const b = document.createElement('button'); b.type = 'button'; b.dataset.ir = m.id;
      const sm = document.createElement('small'); sm.textContent = (m.autor === yo() ? 'Vos' : nombres()[m.autor] || '') + ' · ' + new Date(m.creado).toLocaleString('es-AR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
      const t = document.createElement('span'), txt = m.tipo === 'texto' ? m.texto : L.resumen(m);
      if (marca) { const i = txt.toLowerCase().indexOf(marca.toLowerCase()); if (i >= 0) { const mk = document.createElement('mark'); mk.textContent = txt.slice(i, i + marca.length); t.append(txt.slice(0, i), mk, txt.slice(i + marca.length)); } else t.textContent = txt; } else t.textContent = txt;
      b.append(sm, t); return b;
    };
    let buscarTimer = 0, turnoBusca = 0;
    $('chatBuscarBtn').addEventListener('click', () => { abrirCapa('chatBuscar'); $('chatBuscarQ').value = ''; $('chatBuscar').querySelector('.res').replaceChildren(); $('chatBuscarQ').focus(); });
    $('chatBuscarCerrar').addEventListener('click', () => cerrarCapa('chatBuscar'));
    $('chatBuscarQ').addEventListener('input', () => { clearTimeout(buscarTimer); buscarTimer = setTimeout(buscar, 300); });
    async function buscar() {
      const q = $('chatBuscarQ').value.trim(), patron = L.patronBusqueda(q), res = $('chatBuscar').querySelector('.res'), turno = ++turnoBusca;
      if (!patron) return res.replaceChildren();
      const { data, error } = await sb.from('mensajes').select('id,autor,tipo,texto,creado').eq('tipo', 'texto').ilike('texto', patron).order('creado', { ascending: false }).limit(50);
      if (turno !== turnoBusca) return;
      if (error) { const p = document.createElement('p'); p.textContent = 'No se pudo buscar. Revisá la señal.'; return res.replaceChildren(p); }
      const xs = (data || []).filter((m) => !ocultos.has(m.id));
      if (!xs.length) { const p = document.createElement('p'); p.textContent = 'No hay mensajes con eso.'; return res.replaceChildren(p); }
      res.replaceChildren(...xs.map((m) => filaRes(m, q)));
    }
    $('chatDestBtn').addEventListener('click', async () => {
      abrirCapa('chatDestacados');
      const res = $('chatDestacados').querySelector('.res'), ids = [...destacados];
      if (!ids.length) { const p = document.createElement('p'); p.textContent = 'Todavía no destacaste mensajes. Mantené apretado uno y tocá Destacar.'; return res.replaceChildren(p); }
      const { data, error } = await sb.from('mensajes').select('id,autor,tipo,texto,creado').in('id', ids).order('creado', { ascending: false });
      if (error) { const p = document.createElement('p'); p.textContent = 'No se pudieron traer. Revisá la señal.'; return res.replaceChildren(p); }
      const xs = (data || []).filter((m) => m.tipo !== 'eliminado' && !ocultos.has(m.id));
      if (!xs.length) { const p = document.createElement('p'); p.textContent = 'Los mensajes destacados se eliminaron.'; return res.replaceChildren(p); }
      res.replaceChildren(...xs.map((m) => filaRes(m)));
    });
    $('chatDestCerrar').addEventListener('click', () => cerrarCapa('chatDestacados'));
    $('chatMenuBtn').addEventListener('click', () => { pintarAjustes(); abrirCapa('chatAjustes'); });
    $('chatAjustesCerrar').addEventListener('click', () => cerrarCapa('chatAjustes'));
    $('chatAjustes').addEventListener('change', (e) => {
      const c = e.target.closest('[data-priv]'); if (!c || !db) return;
      priv[yo()] = { ...priv[yo()], [c.dataset.priv]: c.checked }; presente(); pintar();
      db.doc('chatpriv/' + yo()).set(priv[yo()]).catch((err) => { console.error(err); window.aviso?.('No se pudo guardar el ajuste. Probá de nuevo.'); });
    });
    for (const capa of ['chatBuscar', 'chatDestacados']) $(capa).addEventListener('click', (e) => {
      const b = e.target.closest('[data-ir]'); if (!b) return;
      const id = b.dataset.ir; cerrarCapa(capa); setTimeout(() => irAlOriginal(id), 60);
    });

    $('chatBorrar').addEventListener('click', async () => {
      const btn = $('chatBorrar');
      if (!btn.classList.contains('armed')) { btn.classList.add('armed'); btn.textContent = '¿Eliminar para todos? Tocá de nuevo'; return; }
      const id = selId; cerrarAcciones(); if (!id) return;
      const { data: res, error } = await sb.rpc('eliminar_mensaje', { p_id: id });
      if (error) { console.error(error); window.aviso?.('No se pudo eliminar. Probá de nuevo.'); return; }
      medios.get(id)?.querySelector?.('audio')?.pause(); medios.delete(id);
      if (citando === id || editandoMsg === id) quitarCita();
      lista = L.fusionar(lista, res.fila); citados.set(id, res.fila); if (destacados.delete(id)) guardarSet('Destacados', destacados); pintar(); avisar('cambio', { m: res.fila });
      if (fijadoId === id) db?.doc('chatfijo/actual').set({ id: null });
      // los archivos de stickers no se borran (los usan otros mensajes y "Nuestros")
      if (res.archivo_antes && res.tipo_antes !== 'sticker') sb.storage.from(M.BUCKET).remove(res.tipo_antes === 'foto' ? [res.archivo_antes, M.rutaMini(res.archivo_antes)] : [res.archivo_antes]).then(({ error }) => { if (error) console.error(error); });
    });

    pintar();
    cargar();
    cargarEstados();
    document.addEventListener('visibilitychange', () => { if (!document.hidden) cargarEstados(); });
    if (location.hash === '#chat') { history.replaceState(null, '', sinHash()); abrirPanel(); }
  };
})();
