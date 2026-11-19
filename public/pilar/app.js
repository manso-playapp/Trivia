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
  }
  Array.prototype.forEach.call(document.querySelectorAll('#orientar .op'), function (el) {
    tocar(el, function () {
      est.rot = parseInt(el.getAttribute('data-rot'), 10);
      guardar();
      $('orientar').className = 'oculto';
      ajustar();
    });
  });

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

  function dibujarRueda() {
    armarGajos();
    var R = 424, N = gajos.length, s = [], i, p, c, a0, a1, am, tam, largo;
    s.push('<svg xmlns="http://www.w3.org/2000/svg" viewBox="-460 -460 920 920"><defs>' +
      '<radialGradient id="volumen" cx="0" cy="0" r="424" gradientUnits="userSpaceOnUse">' +
      '<stop offset="0" stop-color="#fff" stop-opacity=".34"/><stop offset=".45" stop-color="#fff" stop-opacity=".05"/>' +
      '<stop offset=".8" stop-color="#000" stop-opacity=".06"/><stop offset="1" stop-color="#000" stop-opacity=".42"/></radialGradient></defs>');
    s.push('<circle r="' + R + '" fill="#1d1640"/>');
    for (i = 0; i < N; i++) {
      p = premio(gajos[i]); c = CFG.paleta[p.color % CFG.paleta.length];
      a0 = rad(i * PASO); a1 = rad((i + 1) * PASO);
      s.push('<path d="M0 0L' + (R * Math.cos(a0)).toFixed(2) + ' ' + (R * Math.sin(a0)).toFixed(2) + 'A' + R + ' ' + R + ' 0 0 1 ' +
        (R * Math.cos(a1)).toFixed(2) + ' ' + (R * Math.sin(a1)).toFixed(2) + 'Z" fill="' + c.fondo + '"/>');
    }
    s.push('<circle r="' + R + '" fill="url(#volumen)"/>');
    /* divisores con relieve: una línea oscura y una clara al lado */
    for (i = 0; i < N; i++) {
      s.push('<g transform="rotate(' + (i * PASO - 90) + ')"><line x1="60" y1="0" x2="' + R + '" y2="0" stroke="#150d2a" stroke-opacity=".75" stroke-width="5"/>' +
        '<line x1="60" y1="3" x2="' + R + '" y2="3" stroke="#fff" stroke-opacity=".35" stroke-width="2"/></g>');
    }
    for (i = 0; i < N; i++) {
      p = premio(gajos[i]); c = CFG.paleta[p.color % CFG.paleta.length];
      am = i * PASO + PASO / 2 - 90;
      largo = p.nombre.length;
      tam = Math.min(58, Math.floor(430 / Math.max(5, largo)), N > 8 ? 40 : 58);
      s.push('<g transform="rotate(' + am + ') translate(268 0)" font-family="Playfair,Georgia,serif" font-weight="800" font-size="' + tam + '" letter-spacing="2" text-anchor="middle">' +
        '<text dy="' + (tam * 0.34 + 4).toFixed(0) + '" fill="#000" fill-opacity=".35">' + esc(p.nombre.toUpperCase()) + '</text>' +
        '<text dy="' + (tam * 0.34).toFixed(0) + '" fill="' + c.texto + '">' + esc(p.nombre.toUpperCase()) + '</text></g>');
    }
    s.push('</svg>');
    $('rueda').innerHTML = s.join('');
  }

  /* Aro metálico, bulones y brillo: fijos, no giran con la rueda. */
  function dibujarAro() {
    var s = [], i, a, x, y;
    s.push('<svg xmlns="http://www.w3.org/2000/svg" viewBox="-460 -460 920 920"><defs>' +
      '<linearGradient id="metal" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".22" stop-color="#b9b3c9"/>' +
      '<stop offset=".45" stop-color="#f3eff9"/><stop offset=".7" stop-color="#7d7691"/><stop offset="1" stop-color="#d9d3e6"/></linearGradient>' +
      '<linearGradient id="metal2" x1="1" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ffffff"/><stop offset=".5" stop-color="#8a839e"/><stop offset="1" stop-color="#efeaf7"/></linearGradient>' +
      '<radialGradient id="bulon" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#fff"/><stop offset=".45" stop-color="#c9c3d8"/><stop offset="1" stop-color="#5d5672"/></radialGradient>' +
      '<linearGradient id="brillo" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".30"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>' +
      '<clipPath id="disco"><circle r="420"/></clipPath></defs>');
    s.push('<g clip-path="url(#disco)"><ellipse cx="-70" cy="-330" rx="430" ry="250" fill="url(#brillo)"/></g>');
    s.push('<circle r="441" fill="none" stroke="#120a24" stroke-width="38"/>');
    s.push('<circle r="441" fill="none" stroke="url(#metal)" stroke-width="32"/>');
    s.push('<circle r="441" fill="none" stroke="url(#metal2)" stroke-width="12"/>');
    s.push('<circle r="424" fill="none" stroke="#120a24" stroke-opacity=".55" stroke-width="5"/>');
    for (i = 0; i < 12; i++) {
      a = rad(i * 30 + 15); x = (441 * Math.cos(a)).toFixed(1); y = (441 * Math.sin(a)).toFixed(1);
      s.push('<circle cx="' + x + '" cy="' + (parseFloat(y) + 2) + '" r="10" fill="#120a24" fill-opacity=".5"/><circle cx="' + x + '" cy="' + y + '" r="9" fill="url(#bulon)"/>');
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
    if (!oculto('premio') || !oculto('admin') || !oculto('pin')) return;
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
    if (totalResto() > 0) { $('boton').className = ''; $('boton-txt').innerHTML = 'Tocá para girar'; }
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
