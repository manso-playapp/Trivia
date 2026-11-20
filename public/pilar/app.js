/* Ruleta offline para pantalla táctil. Sin dependencias ni red.
   Escrita en JS conservador para WebViews viejos (Fire TV).
   El panel de operador sigue el de la trivia de tablet: solapas, pasos − / +, confirmación en dos toques y exportación CSV. */
(function () {
  'use strict';
  var CFG = window.RULETA_CONFIG;
  var KEY = 'ruleta:' + CFG.id;
  var $ = function (id) { return document.getElementById(id); };
  var oculto = function (id) { return /oculto/.test($(id).className); };

  /* ---------- estado persistente ---------- */
  var mem = null;
  function deFabrica() {
    return {
      premios: CFG.premios.map(function (p, i) {
        return { id: 'p' + i, nombre: p.nombre, articulo: p.articulo, stock: p.stock, resto: p.stock, activo: true, color: i % CFG.paleta.length };
      }),
      log: [], rot: null, sonido: true, pin: CFG.pin, giro: CFG.segundosGiro, cartel: CFG.segundosCartel, sig: CFG.premios.length
    };
  }
  function leer() {
    var e = null;
    try { e = JSON.parse(window.localStorage.getItem(KEY)); } catch (x) { e = mem; }
    return (e && e.premios) ? e : deFabrica();
  }
  function guardar() {
    mem = est;
    try { window.localStorage.setItem(KEY, JSON.stringify(est)); } catch (x) {}
  }
  var est = leer();

  function premio(id) {
    for (var i = 0; i < est.premios.length; i++) if (est.premios[i].id === id) return est.premios[i];
    return null;
  }
  function activos() { return est.premios.filter(function (p) { return p.activo; }); }
  function totalResto() {
    var t = 0;
    activos().forEach(function (p) { t += Math.max(0, p.resto); });
    return t;
  }
  function dados(id) { return est.log.filter(function (l) { return l.p === id; }).length; }

  /* Sorteo: cada premio pesa según lo que le queda, así se agotan parejo. */
  function sortear(azar) {
    var lista = activos(), t = totalResto(), i;
    if (t <= 0) return null;
    var r = azar() * t;
    for (i = 0; i < lista.length; i++) {
      r -= Math.max(0, lista[i].resto);
      if (r < 0) return lista[i].id;
    }
    return lista[lista.length - 1].id;
  }

  /* ---------- lienzo: escala y rotación ---------- */
  var stage = $('stage');
  function ajustar() {
    var W = window.innerWidth, H = window.innerHeight;
    var rot = est.rot || 0;
    var lado = (rot === 90 || rot === 270);
    var s = lado ? Math.min(W / 1920, H / 1080) : Math.min(W / 1080, H / 1920);
    stage.style.transform = 'rotate(' + rot + 'deg) scale(' + s + ')';
  }
  window.addEventListener('resize', ajustar);
  function pedirOrientacion() { $('orientar').className = ''; }

  /* ---------- toques (sirve táctil, mouse y control remoto) ---------- */
  function tocar(el, fn) {
    var ult = 0;
    function h(ev) {
      var t = ev.target, ahora = Date.now();
      ev.stopPropagation();
      if (t && (t.tagName === 'INPUT')) return; /* dejar que el campo tome el foco */
      ev.preventDefault();
      if (document.activeElement && document.activeElement.blur && document.activeElement.tagName === 'INPUT') document.activeElement.blur();
      if (ahora - ult < 300) return;
      ult = ahora;
      fn(ev);
    }
    el.addEventListener('touchstart', h, false);
    el.addEventListener('mousedown', h, false);
    el.__toque = h;
  }

  /* Marcos táctiles que el Fire TV toma como mouse: el dedo solo mueve el puntero, sin clic.
     Cada "salto" del puntero (movimiento tras una pausa) se trata como un toque en ese lugar. */
  var pulsoReal = Date.now() + 800, movT = 0, movTimer = null, movX = 0, movY = 0, ultSint = 0, logoToques = [];
  function toqueEn(x, y) {
    var ahora = Date.now(), el = document.elementFromPoint(x, y), nodo = el;
    if (!el || ahora - pulsoReal < 700 || ahora - ultSint < 450) return;
    ultSint = ahora;
    if (el.id === 'logo') {
      logoToques.push(ahora);
      logoToques = logoToques.filter(function (t) { return ahora - t < 4000; });
      if (logoToques.length >= 5) { logoToques = []; abrirPin(); }
      return;
    }
    if (el.tagName === 'INPUT') { el.focus(); return; }
    while (nodo && !nodo.__toque) nodo = nodo.parentNode;
    if (nodo) nodo.__toque({ target: el, stopPropagation: function () {}, preventDefault: function () {} });
  }
  function saltoPuntero(x, y) {
    var ahora = Date.now(), nuevo = ahora - movT > 250;
    movT = ahora; movX = x; movY = y;
    if (nuevo) { clearTimeout(movTimer); movTimer = setTimeout(function () { toqueEn(movX, movY); }, 120); }
  }
  if (window.Android) {
    window.__puntero = saltoPuntero;
    document.addEventListener('mousemove', function (ev) { saltoPuntero(ev.clientX, ev.clientY); }, true);
    ['touchstart', 'mousedown'].forEach(function (e) {
      document.addEventListener(e, function () { pulsoReal = Date.now(); clearTimeout(movTimer); }, true);
    });
  }
  var ops = document.querySelectorAll('#orientar .op'), opSel = 0;
  function marcarOp() {
    Array.prototype.forEach.call(ops, function (el, i) { el.className = 'op' + (i === opSel ? ' sel' : ''); });
  }
  function elegirOp(el) {
    est.rot = parseInt(el.getAttribute('data-rot'), 10);
    guardar();
    $('orientar').className = 'oculto';
    ajustar();
  }
  Array.prototype.forEach.call(ops, function (el) { tocar(el, function () { elegirOp(el); }); });
  marcarOp();

  /* ---------- rueda ---------- */
  var gajos = [], PASO = 60;
  function armarGajos() {
    var a = activos(), i = 0;
    gajos = [];
    if (!a.length) return;
    while (gajos.length < 6 || gajos.length % a.length) { gajos.push(a[i % a.length].id); i++; }
    PASO = 360 / gajos.length;
  }
  var rad = function (g) { return (g - 90) * Math.PI / 180; };

  var XL = 'xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"';
  function dibujarRueda() {
    armarGajos();
    var R = 416, N = gajos.length, s = [], i, p, c, am, tam, nom;
    var a1 = rad(PASO), x1 = (R * Math.cos(a1)).toFixed(2), y1 = (R * Math.sin(a1)).toFixed(2);
    var cuna = 'M0 0L0 ' + (-R) + 'A' + R + ' ' + R + ' 0 0 1 ' + x1 + ' ' + y1 + 'Z';
    s.push('<svg ' + XL + ' viewBox="-460 -460 920 920"><defs>');
    ['rosa', 'violeta'].forEach(function (t) {
      s.push('<pattern id="tx-' + t + '" patternUnits="userSpaceOnUse" width="420" height="420"><image xlink:href="assets/brillo-' + t + '.jpg" width="420" height="420"/></pattern>');
    });
    /* cada gajo es una faceta: un borde con luz y el otro en sombra */
    s.push('<linearGradient id="faceta" gradientUnits="userSpaceOnUse" x1="0" y1="' + (-R * 0.7) + '" x2="' + (R * 0.7 * Math.sin(PASO * Math.PI / 180)).toFixed(1) + '" y2="' + (-R * 0.7 * Math.cos(PASO * Math.PI / 180)).toFixed(1) + '">' +
      '<stop offset="0" stop-color="#fff" stop-opacity=".42"/><stop offset=".3" stop-color="#fff" stop-opacity=".06"/>' +
      '<stop offset=".7" stop-color="#000" stop-opacity=".05"/><stop offset="1" stop-color="#12002a" stop-opacity=".5"/></linearGradient>' +
      '<radialGradient id="volumen" cx="0" cy="0" r="' + R + '" gradientUnits="userSpaceOnUse">' +
      '<stop offset="0" stop-color="#fff" stop-opacity=".38"/><stop offset=".4" stop-color="#fff" stop-opacity=".04"/>' +
      '<stop offset=".78" stop-color="#000" stop-opacity=".05"/><stop offset=".93" stop-color="#0c0020" stop-opacity=".45"/><stop offset="1" stop-color="#0c0020" stop-opacity=".8"/></radialGradient></defs>');
    s.push('<circle r="' + R + '" fill="#1b0633"/>');
    for (i = 0; i < N; i++) {
      p = premio(gajos[i]); c = CFG.paleta[p.color % CFG.paleta.length];
      s.push('<g transform="rotate(' + (i * PASO) + ')"><path d="' + cuna + '" fill="' + (c.tex ? 'url(#tx-' + c.tex + ')' : c.fondo) + '"/><path d="' + cuna + '" fill="url(#faceta)"/>' +
        '<line x1="0" y1="-70" x2="0" y2="' + (-R) + '" stroke="#12002a" stroke-opacity=".8" stroke-width="6"/><line x1="3.5" y1="-70" x2="3.5" y2="' + (-R) + '" stroke="#fff" stroke-opacity=".55" stroke-width="2"/></g>');
    }
    s.push('<circle r="' + R + '" fill="url(#volumen)"/>');
    for (i = 0; i < N; i++) {
      p = premio(gajos[i]); c = CFG.paleta[p.color % CFG.paleta.length];
      am = i * PASO + PASO / 2 - 90; nom = esc(p.nombre.toUpperCase());
      tam = Math.min(60, Math.floor(430 / Math.max(5, p.nombre.length)), N > 8 ? 42 : 60);
      s.push('<g transform="rotate(' + am + ') translate(262 0)" font-family="Playfair,Georgia,serif" font-weight="800" font-size="' + tam + '" letter-spacing="2" text-anchor="middle">' +
        '<text dy="' + (tam * 0.34 + 5).toFixed(0) + '" fill="#12002a" fill-opacity=".55">' + nom + '</text>' +
        (c.tex ? '<text dy="' + (tam * 0.34).toFixed(0) + '" fill="none" stroke="#3a0a52" stroke-width="7" stroke-linejoin="round">' + nom + '</text>' : '') +
        '<text dy="' + (tam * 0.34).toFixed(0) + '" fill="' + c.texto + '">' + nom + '</text></g>');
    }
    s.push('</svg>');
    $('rueda').innerHTML = s.join('');
  }

  /* Aro cromado, bulones y reflejos: fijos, no giran con la rueda. */
  function dibujarAro() {
    var s = [], i, a, x, y;
    s.push('<svg ' + XL + ' viewBox="-460 -460 920 920"><defs>' +
      '<linearGradient id="cromo" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".12" stop-color="#cfc6e6"/><stop offset=".26" stop-color="#6d6390"/>' +
      '<stop offset=".4" stop-color="#ffffff"/><stop offset=".55" stop-color="#b9afd6"/><stop offset=".72" stop-color="#4f4672"/><stop offset=".86" stop-color="#e9e3f7"/><stop offset="1" stop-color="#8d83ad"/></linearGradient>' +
      '<linearGradient id="cromo2" x1="1" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ffffff"/><stop offset=".35" stop-color="#7a7099"/><stop offset=".6" stop-color="#f5f0ff"/><stop offset="1" stop-color="#5d5380"/></linearGradient>' +
      '<radialGradient id="bulon" cx=".35" cy=".28" r=".85"><stop offset="0" stop-color="#fff"/><stop offset=".4" stop-color="#d6cfe8"/><stop offset="1" stop-color="#3f365c"/></radialGradient>' +
      '<linearGradient id="reflejo" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".36"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>' +
      '<clipPath id="disco"><circle r="414"/></clipPath></defs>');
    s.push('<g clip-path="url(#disco)"><ellipse cx="-90" cy="-360" rx="460" ry="270" fill="url(#reflejo)"/><ellipse cx="150" cy="470" rx="380" ry="130" fill="#fff" fill-opacity=".07"/></g>');
    s.push('<circle r="436" fill="none" stroke="#0e0320" stroke-width="50"/>');
    s.push('<circle r="436" fill="none" stroke="url(#cromo)" stroke-width="44"/>');
    s.push('<circle r="436" fill="none" stroke="url(#cromo2)" stroke-width="18"/>');
    s.push('<circle r="456" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="2"/>');
    s.push('<circle r="415" fill="none" stroke="#0e0320" stroke-opacity=".7" stroke-width="6"/>');
    s.push('<path d="M-392 -190A436 436 0 0 1 -150 -410" fill="none" stroke="#fff" stroke-opacity=".9" stroke-width="7" stroke-linecap="round"/>');
    s.push('<path d="M380 215A436 436 0 0 1 240 364" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="5" stroke-linecap="round"/>');
    for (i = 0; i < 16; i++) {
      a = rad(i * 22.5 + 11.25); x = (436 * Math.cos(a)).toFixed(1); y = 436 * Math.sin(a);
      s.push('<circle cx="' + x + '" cy="' + (y + 3).toFixed(1) + '" r="12" fill="#0e0320" fill-opacity=".6"/><circle cx="' + x + '" cy="' + y.toFixed(1) + '" r="11" fill="url(#bulon)"/>');
    }
    s.push('</svg>');
    $('aro').innerHTML = s.join('');
  }

  var angulo = 0, girando = false, bloqueo = 0;
  var rueda = $('rueda'), puntero = $('puntero');
  var raf = window.requestAnimationFrame || function (f) { return setTimeout(function () { f(Date.now()); }, 16); };
  function ease(t) { var u = 1 - t; return 1 - u * u * u * u; }

  function girar() {
    if (girando || Date.now() < bloqueo) return;
    if (!oculto('premio') || !oculto('admin') || !oculto('pin') || !oculto('orientar')) return;
    var id = sortear(Math.random);
    if (!id) { refrescarBoton(); return; }

    /* se descuenta al sortear: si se corta la luz en pleno giro no se regala stock */
    premio(id).resto -= 1;
    est.log.push({ t: Date.now(), p: id, n: premio(id).nombre });
    guardar();

    var cand = [], i;
    for (i = 0; i < gajos.length; i++) if (gajos[i] === id) cand.push(i);
    var gajo = cand[Math.floor(Math.random() * cand.length)];
    var dentro = (Math.random() - 0.5) * PASO * 0.7;
    var destino = 360 - (gajo * PASO + PASO / 2 + dentro);
    var fin = angulo - (angulo % 360) + 360 * Math.max(3, Math.round(est.giro)) + destino;
    var ini = angulo, dur = est.giro * 1000, t0 = null, ultTick = Math.floor(ini / PASO);

    girando = true;
    nota(330, 0, 0.18, 'triangle', 0.2);
    $('boton').className = 'apagado';
    $('boton-txt').innerHTML = '¡Suerte!';

    function paso(ts) {
      if (t0 === null) t0 = ts;
      var t = Math.min(1, (ts - t0) / dur);
      angulo = ini + (fin - ini) * ease(t);
      rueda.style.transform = 'rotate(' + angulo.toFixed(2) + 'deg)';
      var k = Math.floor(angulo / PASO);
      if (k !== ultTick) {
        ultTick = k;
        nota(1500, 0, 0.04, 'square', 0.08);
        puntero.style.transform = 'rotate(-14deg)';
        setTimeout(function () { puntero.style.transform = 'rotate(0deg)'; }, 70);
      }
      if (t < 1) { raf(paso); }
      else { angulo = fin % 360; girando = false; setTimeout(function () { mostrarPremio(id); }, 450); }
    }
    raf(paso);
  }

  /* ---------- premio ---------- */
  var cierre = null;
  function mostrarPremio(id) {
    var p = premio(id);
    $('premio-art').innerHTML = esc(p.articulo);
    $('premio-nombre').innerHTML = esc(p.nombre);
    $('premio-nombre').style.fontSize = Math.min(170, Math.floor(1500 / Math.max(6, p.nombre.length))) + 'px';
    confeti();
    $('premio').className = 'capa';
    [523, 659, 784, 1047].forEach(function (f, i) { nota(f, i * 0.13, 0.35, 'triangle', 0.25); });
    nota(1319, 0.55, 0.7, 'triangle', 0.22);
    bloqueo = Date.now() + 1500;
    clearTimeout(cierre);
    cierre = setTimeout(cerrarPremio, est.cartel * 1000);
  }
  function cerrarPremio() {
    if (Date.now() < bloqueo) return;
    clearTimeout(cierre);
    $('premio').className = 'capa oculto';
    $('confeti').innerHTML = '';
    bloqueo = Date.now() + 600;
    refrescarBoton();
  }
  function confeti() {
    var col = ['#f6cfae', '#dc7f92', '#8a5bb5', '#fff6e6', '#f0a58a'], h = '', i;
    for (i = 0; i < 46; i++) {
      h += '<i style="left:' + Math.floor(Math.random() * 1060) + 'px;background:' + col[i % col.length] +
        ';animation-duration:' + (2.4 + Math.random() * 2.6).toFixed(2) + 's;animation-delay:' + (Math.random() * 1.2).toFixed(2) + 's"></i>';
    }
    $('confeti').innerHTML = h;
  }
  function refrescarBoton() {
    if (totalResto() > 0) { $('boton').className = ''; $('boton-txt').innerHTML = '¡Tocá para girar!'; }
    else { $('boton').className = 'apagado'; $('boton-txt').innerHTML = '¡Se entregaron todos los premios!'; }
  }

  /* ---------- sonido (sintetizado, sin archivos) ---------- */
  var ctx = null;
  function nota(f, t, d, tipo, vol) {
    if (!est.sonido) return;
    try {
      if (!ctx) { var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return; ctx = new AC(); }
      if (ctx.state === 'suspended' && ctx.resume) ctx.resume();
      var o = ctx.createOscillator(), g = ctx.createGain(), a = ctx.currentTime + t;
      o.type = tipo; o.frequency.value = f;
      g.gain.setValueAtTime(vol, a);
      g.gain.exponentialRampToValueAtTime(0.001, a + d);
      o.connect(g); g.connect(ctx.destination);
      o.start(a); o.stop(a + d + 0.02);
    } catch (x) {}
  }

  /* ---------- operador: PIN ---------- */
  var pinTxt = '';
  function abrirPin() {
    if (girando) return;
    pinTxt = ''; pintarPin();
    $('pin').className = 'capa';
  }
  function pintarPin() {
    var s = '', i;
    for (i = 0; i < est.pin.length; i++) s += i < pinTxt.length ? '●' : '○';
    $('pin-puntos').innerHTML = s;
  }
  function tecla(d) {
    pinTxt += d; pintarPin();
    if (pinTxt.length >= est.pin.length) {
      if (pinTxt === est.pin) { $('pin').className = 'capa oculto'; abrirAdmin(); }
      else { pinTxt = ''; setTimeout(pintarPin, 250); }
    }
  }
  (function () {
    var h = '';
    '1234567890'.split('').forEach(function (d) { h += '<div data-d="' + d + '">' + d + '</div>'; });
    $('pin-teclas').innerHTML = h;
  })();
  tocar($('pin'), function (ev) {
    var d = ev.target.getAttribute && ev.target.getAttribute('data-d');
    if (d) tecla(d);
    else if (ev.target.getAttribute('data-a') === 'cerrar-pin') { $('pin').className = 'capa oculto'; bloqueo = Date.now() + 600; }
  });

  /* ---------- operador: panel con solapas ---------- */
  var tab = 'premios', editando = null, confirma = '', aviso = '';
  var TABS = [['premios', 'Premios'], ['giros', 'Giros'], ['ajustes', 'Ajustes']];

  function esc(t) { return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); }
  function hora(t) {
    var d = new Date(t), m = d.getMinutes();
    return d.getHours() + ':' + (m < 10 ? '0' : '') + m;
  }
  function paso(etq, valor, accion, extra) {
    return '<div class="opx-row"><span class="opx-etq">' + etq + '</span><span class="opx-paso">' +
      '<i data-a="' + accion + '" data-s="-1"' + (extra || '') + '>−</i><b>' + valor + '</b><i data-a="' + accion + '" data-s="1"' + (extra || '') + '>+</i></span></div>';
  }
  function confirmable(accion, texto, textoSi, extra) {
    var k = accion + (extra || '');
    return '<span class="opx-btn ' + (confirma === k ? 'rojo' : '') + '" data-a="' + accion + '"' + (extra ? ' data-p="' + extra + '"' : '') + '>' + (confirma === k ? textoSi : texto) + '</span>';
  }

  function abrirAdmin() { tab = 'premios'; editando = null; confirma = ''; aviso = ''; pintarAdmin(); $('admin').className = 'capa'; }

  function pintarAdmin() {
    var h = '', i;
    for (i = 0; i < TABS.length; i++) h += '<span data-a="tab" data-p="' + TABS[i][0] + '" class="' + (tab === TABS[i][0] ? 'on' : '') + '">' + TABS[i][1] + '</span>';
    $('opx-tabs').innerHTML = h;
    h = '';

    if (tab === 'premios' && editando) {
      var e = editando;
      h += '<div class="opx-form"><label>Nombre del premio</label><input id="f-nombre" maxlength="18" value="' + esc(e.nombre) + '">' +
        '<div class="opx-row"><span class="opx-etq">Se anuncia como</span><span class="opx-seg">' +
        '<i data-a="art" data-p="un" class="' + (e.articulo === 'un' ? 'on' : '') + '">un</i><i data-a="art" data-p="una" class="' + (e.articulo === 'una' ? 'on' : '') + '">una</i></span></div>' +
        paso('Cantidad total', e.stock, 'f-stock') + paso('De a diez', '±10', 'f-stock', ' data-m="10"') +
        '<div class="opx-acc"><span class="opx-btn pri" data-a="f-guardar">Guardar</span><span class="opx-btn" data-a="f-cancelar">Cancelar</span>' +
        (e.id ? confirmable('f-eliminar', 'Eliminar', 'Sí, eliminar') : '') + '</div></div>';
    } else if (tab === 'premios') {
      h += '<div class="opx-bar"><span><b>' + totalResto() + '</b> premios por entregar</span><span class="opx-btn pri" data-a="agregar">+ Agregar</span></div>';
      est.premios.forEach(function (p) {
        h += '<div class="opx-item' + (p.activo ? '' : ' off') + '"><div class="opx-nom"><b>' + esc(p.nombre) + '</b><small>' + dados(p.id) + ' entregados de ' + p.stock + '</small></div>' +
          '<span class="opx-paso"><i data-a="resto" data-s="-1" data-p="' + p.id + '">−</i><b>' + p.resto + '</b><i data-a="resto" data-s="1" data-p="' + p.id + '">+</i></span>' +
          '<span class="opx-btn chico" data-a="editar" data-p="' + p.id + '">Editar</span>' +
          '<span class="opx-pill ' + (p.activo ? 'on' : '') + '" data-a="activo" data-p="' + p.id + '">' + (p.activo ? 'Sí' : 'No') + '</span></div>';
      });
      h += '<p class="opx-nota">El número es lo que queda de cada premio. "Sí / No" lo muestra o lo saca de la rueda.</p>';
    } else if (tab === 'giros') {
      h += '<div class="opx-bar"><span><b>' + est.log.length + '</b> giros</span><span><span class="opx-btn" data-a="exportar">Exportar</span> ' +
        confirmable('deshacer', 'Deshacer último', 'Sí, deshacer') + '</span></div>';
      if (aviso) h += '<p class="opx-aviso">' + esc(aviso) + '</p>';
      if (!est.log.length) h += '<p class="opx-nota">Todavía no hay giros.</p>';
      est.log.slice(-9).reverse().forEach(function (l, k) {
        h += '<div class="opx-linea"><span>' + (est.log.length - k) + '</span><b>' + esc(l.n || '') + '</b><span>' + hora(l.t) + '</span></div>';
      });
      h += '<div class="opx-acc">' + confirmable('borrar', 'Borrar todo y reponer stock', 'Sí, borrar todo') + '</div>';
    } else {
      h += '<div class="opx-row"><span class="opx-etq">Sonido</span><span class="opx-pill ' + (est.sonido ? 'on' : '') + '" data-a="sonido">' + (est.sonido ? 'Sí' : 'No') + '</span></div>' +
        paso('Segundos de giro', est.giro, 'giro') + paso('Segundos del cartel de premio', est.cartel, 'cartel') +
        '<div class="opx-row"><span class="opx-etq">PIN</span><input id="f-pin" class="corto" maxlength="6" inputmode="numeric" value="' + esc(est.pin) + '"><span class="opx-btn chico" data-a="pin-guardar">Guardar</span></div>' +
        '<div class="opx-row"><span class="opx-etq">Pantalla</span><span class="opx-btn chico" data-a="orientar">Reorientar</span></div>' +
        '<div class="opx-acc">' + confirmable('fabrica', 'Volver a los valores de fábrica', 'Sí, restablecer') + '</div>';
      if (aviso) h += '<p class="opx-aviso">' + esc(aviso) + '</p>';
    }
    $('opx-cuerpo').innerHTML = h;
  }

  function leerForm() { var el = $('f-nombre'); if (el && editando) editando.nombre = el.value; }
  function csv() {
    var f = ['numero,fecha,hora,premio'];
    est.log.forEach(function (l, i) {
      var d = new Date(l.t);
      f.push((i + 1) + ',' + d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2) + ',' + hora(l.t) + ',"' + String(l.n || '').replace(/"/g, '""') + '"');
    });
    return f.join('\r\n') + '\r\n';
  }
  function exportar() {
    var nombre = 'giros-' + CFG.id + '-' + new Date().toISOString().slice(0, 10) + '.csv', txt = csv();
    try {
      if (window.Android && window.Android.guardar) { aviso = 'Guardado en ' + window.Android.guardar(nombre, txt); return; }
      var a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob(['﻿' + txt], { type: 'text/csv' }));
      a.download = nombre; document.body.appendChild(a); a.click(); document.body.removeChild(a);
      aviso = 'Archivo descargado: ' + nombre;
    } catch (x) { aviso = 'No se pudo guardar el archivo.'; }
  }

  var acciones = {
    tab: function (p) { tab = p; editando = null; },
    cerrar: function () { $('admin').className = 'capa oculto'; bloqueo = Date.now() + 600; dibujarRueda(); refrescarBoton(); },
    resto: function (p, s) { var q = premio(p); q.resto = Math.max(0, Math.min(999, q.resto + s)); },
    activo: function (p) { var q = premio(p); q.activo = !q.activo; },
    editar: function (p) { var q = premio(p); editando = { id: q.id, nombre: q.nombre, articulo: q.articulo, stock: q.stock }; },
    agregar: function () { editando = { id: null, nombre: '', articulo: 'un', stock: 10 }; },
    art: function (p) { editando.articulo = p; },
    'f-stock': function (p, s, m) { editando.stock = Math.max(0, Math.min(999, editando.stock + s * m)); },
    'f-cancelar': function () { editando = null; },
    'f-guardar': function () {
      var e = editando, q;
      e.nombre = e.nombre.replace(/^\s+|\s+$/g, '');
      if (!e.nombre) return;
      if (e.id) {
        q = premio(e.id);
        q.resto = Math.max(0, q.resto + (e.stock - q.stock));
        q.nombre = e.nombre; q.articulo = e.articulo; q.stock = e.stock;
      } else {
        est.premios.push({ id: 'p' + est.sig, nombre: e.nombre, articulo: e.articulo, stock: e.stock, resto: e.stock, activo: true, color: est.sig % CFG.paleta.length });
        est.sig += 1;
      }
      editando = null;
    },
    'f-eliminar': function () {
      est.premios = est.premios.filter(function (q) { return q.id !== editando.id; });
      editando = null;
    },
    exportar: function () { exportar(); },
    deshacer: function () {
      var u = est.log.pop(), q = u && premio(u.p);
      if (q) q.resto += 1;
    },
    borrar: function () { est.log = []; est.premios.forEach(function (q) { q.resto = q.stock; }); },
    sonido: function () { est.sonido = !est.sonido; },
    giro: function (p, s) { est.giro = Math.max(3, Math.min(12, est.giro + s)); },
    cartel: function (p, s) { est.cartel = Math.max(4, Math.min(30, est.cartel + s)); },
    'pin-guardar': function () {
      var v = $('f-pin').value.replace(/\D/g, '');
      if (v.length >= 4) { est.pin = v; aviso = 'PIN guardado.'; } else { aviso = 'El PIN necesita al menos 4 números.'; }
    },
    orientar: function () { $('admin').className = 'capa oculto'; dibujarRueda(); refrescarBoton(); pedirOrientacion(); },
    fabrica: function () { var r = est.rot; est = deFabrica(); est.rot = r; }
  };
  var DOBLE = { 'f-eliminar': 1, deshacer: 1, borrar: 1, fabrica: 1 };

  tocar($('admin'), function (ev) {
    var el = ev.target, a = null;
    while (el && el !== $('admin')) { a = el.getAttribute('data-a'); if (a) break; el = el.parentNode; }
    if (!a) return;
    leerForm();
    var p = el.getAttribute('data-p'), s = parseInt(el.getAttribute('data-s') || '0', 10), m = parseInt(el.getAttribute('data-m') || '1', 10);
    var k = a + (DOBLE[a] && p ? p : '');
    if (a !== 'exportar' && a !== 'pin-guardar') aviso = '';
    if (DOBLE[a] && confirma !== k) { confirma = k; pintarAdmin(); return; }
    confirma = '';
    acciones[a](p, s, m);
    guardar();
    if (a !== 'cerrar' && a !== 'orientar') pintarAdmin();
  });

  /* ---------- arranque ---------- */
  dibujarRueda();
  dibujarAro();
  refrescarBoton();
  if (est.rot === null) {
    if (window.innerWidth > window.innerHeight) pedirOrientacion();
    else { est.rot = 0; guardar(); }
  }
  ajustar();

  tocar($('premio'), cerrarPremio);

  /* mantener apretado el logo 3 s abre el PIN */
  var lp = null;
  function lpIni(ev) { ev.stopPropagation(); ev.preventDefault(); clearTimeout(lp); lp = setTimeout(abrirPin, 3000); }
  function lpFin() { clearTimeout(lp); }
  ['touchstart', 'mousedown'].forEach(function (e) { $('logo').addEventListener(e, lpIni, false); });
  ['touchend', 'touchcancel', 'mouseup', 'mouseleave'].forEach(function (e) { $('logo').addEventListener(e, lpFin, false); });

  /* cualquier toque en el resto de la pantalla gira */
  tocar(stage, girar);

  /* control remoto / teclado: OK gira o cierra; arriba x5 abre el PIN */
  var arriba = 0, arribaT = 0;
  document.addEventListener('keydown', function (ev) {
    var k = ev.keyCode;
    if (ev.target && ev.target.tagName === 'INPUT') return;
    if (!oculto('orientar')) {
      ev.preventDefault();
      if (k === 13 || k === 32) elegirOp(ops[opSel]);
      else if (k >= 37 && k <= 40) { opSel = (opSel + (k === 37 || k === 38 ? ops.length - 1 : 1)) % ops.length; marcarOp(); }
      return;
    }
    if (k === 13 || k === 32) {
      ev.preventDefault();
      if (!oculto('premio')) cerrarPremio(); else girar();
    } else if (k === 38) {
      if (Date.now() - arribaT > 1500) arriba = 0;
      arribaT = Date.now(); arriba++;
      if (arriba >= 5) { arriba = 0; abrirPin(); }
    } else if (k >= 48 && k <= 57 && !oculto('pin')) {
      tecla(String(k - 48));
    }
  }, false);

  /* para pruebas automáticas */
  window.__ruleta = { est: function () { return est; }, sortear: sortear, gajos: function () { return gajos; }, csv: csv };
})();
