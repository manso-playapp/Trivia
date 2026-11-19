/* Ruleta offline para pantalla táctil. Sin dependencias ni red.
   Escrita en JS conservador para WebViews viejos (Fire TV). */
(function () {
  'use strict';
  var CFG = window.RULETA_CONFIG;
  var KEY = 'ruleta:' + CFG.id;
  var N = CFG.gajos.length;
  var PASO = 360 / N;
  var $ = function (id) { return document.getElementById(id); };

  var premios = {};
  CFG.premios.forEach(function (p) { premios[p.id] = p; });

  /* ---------- estado persistente ---------- */
  var mem = {};
  function leer() {
    var e = null;
    try { e = JSON.parse(window.localStorage.getItem(KEY)); } catch (x) { e = mem[KEY] || null; }
    if (!e || !e.resto) e = { resto: {}, log: [], rot: null, sonido: true };
    CFG.premios.forEach(function (p) {
      if (typeof e.resto[p.id] !== 'number') e.resto[p.id] = p.stock;
    });
    return e;
  }
  function guardar() {
    mem[KEY] = est;
    try { window.localStorage.setItem(KEY, JSON.stringify(est)); } catch (x) {}
  }
  var est = leer();

  function totalResto() {
    var t = 0;
    CFG.premios.forEach(function (p) { t += Math.max(0, est.resto[p.id]); });
    return t;
  }

  /* Sorteo: cada premio pesa según lo que le queda, así se agotan parejo. */
  function sortear(azar) {
    var t = totalResto();
    if (t <= 0) return null;
    var r = azar() * t, i, p;
    for (i = 0; i < CFG.premios.length; i++) {
      p = CFG.premios[i];
      r -= Math.max(0, est.resto[p.id]);
      if (r < 0) return p.id;
    }
    return CFG.premios[CFG.premios.length - 1].id;
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

  function pedirOrientacion() {
    $('orientar').className = '';
  }
  function iniciarOrientacion() {
    if (est.rot === null) {
      if (window.innerWidth > window.innerHeight) { pedirOrientacion(); }
      else { est.rot = 0; guardar(); }
    }
    ajustar();
  }
  var ops = document.querySelectorAll('#orientar .op');
  Array.prototype.forEach.call(ops, function (el) {
    tocar(el, function () {
      est.rot = parseInt(el.getAttribute('data-rot'), 10);
      guardar();
      $('orientar').className = 'oculto';
      ajustar();
    });
  });

  /* ---------- toques (sirve táctil, mouse y control remoto) ---------- */
  function tocar(el, fn) {
    var ult = 0;
    function h(ev) {
      var ahora = Date.now();
      if (ev && ev.preventDefault) ev.preventDefault();
      if (ev && ev.stopPropagation) ev.stopPropagation();
      if (ahora - ult < 350) return;
      ult = ahora;
      fn(ev);
    }
    el.addEventListener('touchstart', h, false);
    el.addEventListener('mousedown', h, false);
  }

  /* ---------- rueda ---------- */
  function dibujarRueda() {
    var R = 430, svg = [], i, a0, a1, p, x0, y0, x1, y1, am;
    var rad = function (g) { return (g - 90) * Math.PI / 180; };
    svg.push('<svg xmlns="http://www.w3.org/2000/svg" viewBox="-460 -460 920 920">');
    svg.push('<circle r="456" fill="#2a1838"/><circle r="448" fill="#f0a58a"/><circle r="436" fill="#2a1838"/>');
    for (i = 0; i < N; i++) {
      p = premios[CFG.gajos[i]];
      a0 = rad(i * PASO); a1 = rad((i + 1) * PASO);
      x0 = (R * Math.cos(a0)).toFixed(2); y0 = (R * Math.sin(a0)).toFixed(2);
      x1 = (R * Math.cos(a1)).toFixed(2); y1 = (R * Math.sin(a1)).toFixed(2);
      svg.push('<path d="M0 0L' + x0 + ' ' + y0 + 'A' + R + ' ' + R + ' 0 0 1 ' + x1 + ' ' + y1 + 'Z" fill="' + p.fondo + '" stroke="#2a1838" stroke-width="4"/>');
    }
    for (i = 0; i < N; i++) {
      p = premios[CFG.gajos[i]];
      am = i * PASO + PASO / 2 - 90;
      svg.push('<text transform="rotate(' + am + ') translate(272 0)" text-anchor="middle" dy="19" font-family="Playfair,Georgia,serif" font-weight="800" font-size="56" letter-spacing="2" fill="' + p.texto + '">' + p.nombre.toUpperCase() + '</text>');
    }
    for (i = 0; i < N * 2; i++) {
      a0 = rad(i * PASO / 2);
      svg.push('<circle cx="' + (442 * Math.cos(a0)).toFixed(1) + '" cy="' + (442 * Math.sin(a0)).toFixed(1) + '" r="7" fill="#fff6e6"/>');
    }
    svg.push('</svg>');
    $('rueda').innerHTML = svg.join('');
  }

  var angulo = 0, girando = false, bloqueo = 0;
  var rueda = $('rueda'), puntero = $('puntero');
  var raf = window.requestAnimationFrame || function (f) { return setTimeout(function () { f(Date.now()); }, 16); };

  function ease(t) { var u = 1 - t; return 1 - u * u * u * u; }

  function girar() {
    if (girando || Date.now() < bloqueo) return;
    if (!$('premio').className.match(/oculto/) || !$('admin').className.match(/oculto/) || !$('pin').className.match(/oculto/)) return;
    var id = sortear(Math.random);
    if (!id) { refrescarBoton(); return; }

    /* se descuenta al sortear: si se corta la luz en pleno giro no se regala stock */
    est.resto[id] -= 1;
    est.log.push({ t: Date.now(), p: id });
    guardar();

    var cand = [], i;
    for (i = 0; i < N; i++) if (CFG.gajos[i] === id) cand.push(i);
    var gajo = cand[Math.floor(Math.random() * cand.length)];
    var dentro = (Math.random() - 0.5) * PASO * 0.7;
    var destino = 360 - (gajo * PASO + PASO / 2 + dentro);
    var base = angulo - (angulo % 360);
    var fin = base + 360 * 6 + destino;
    var ini = angulo, dur = 6500, t0 = null, ultTick = Math.floor(ini / PASO);

    girando = true;
    sonarInicio();
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
        tic();
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
    var p = premios[id];
    $('premio-art').innerHTML = p.articulo;
    $('premio-nombre').innerHTML = p.nombre;
    confeti();
    $('premio').className = 'capa';
    fanfarria();
    bloqueo = Date.now() + 1500;
    clearTimeout(cierre);
    cierre = setTimeout(cerrarPremio, 12000);
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
  function audio() {
    if (!est.sonido) return null;
    try {
      if (!ctx) { var AC = window.AudioContext || window.webkitAudioContext; if (AC) ctx = new AC(); }
      if (ctx && ctx.state === 'suspended' && ctx.resume) ctx.resume();
    } catch (x) { ctx = null; }
    return ctx;
  }
  function nota(f, t, d, tipo, vol) {
    var c = audio(); if (!c) return;
    try {
      var o = c.createOscillator(), g = c.createGain(), a = c.currentTime + t;
      o.type = tipo; o.frequency.value = f;
      g.gain.setValueAtTime(vol, a);
      g.gain.exponentialRampToValueAtTime(0.001, a + d);
      o.connect(g); g.connect(c.destination);
      o.start(a); o.stop(a + d + 0.02);
    } catch (x) {}
  }
  function tic() { nota(1500, 0, 0.04, 'square', 0.08); }
  function sonarInicio() { nota(330, 0, 0.18, 'triangle', 0.2); }
  function fanfarria() {
    [523, 659, 784, 1047].forEach(function (f, i) { nota(f, i * 0.13, 0.35, 'triangle', 0.25); });
    nota(1319, 0.55, 0.7, 'triangle', 0.22);
  }

  /* ---------- operador: PIN y panel ---------- */
  var pinTxt = '';
  function abrirPin() {
    if (girando) return;
    pinTxt = ''; pintarPin();
    $('pin').className = 'capa';
  }
  function pintarPin() {
    var s = '', i;
    for (i = 0; i < CFG.pin.length; i++) s += i < pinTxt.length ? '●' : '○';
    $('pin-puntos').innerHTML = s;
  }
  function armarPin() {
    var h = '', orden = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];
    orden.forEach(function (d) { h += '<div data-d="' + d + '">' + d + '</div>'; });
    $('pin-teclas').innerHTML = h;
    Array.prototype.forEach.call($('pin-teclas').children, function (el) {
      tocar(el, function () { tecla(el.getAttribute('data-d')); });
    });
  }
  function tecla(d) {
    pinTxt += d; pintarPin();
    if (pinTxt.length >= CFG.pin.length) {
      if (pinTxt === CFG.pin) { $('pin').className = 'capa oculto'; abrirAdmin(); }
      else { pinTxt = ''; setTimeout(pintarPin, 250); }
    }
  }

  var confirmar = 0;
  function abrirAdmin() { confirmar = 0; pintarAdmin(); $('admin').className = 'capa'; }
  function pintarAdmin() {
    var h = '', dados = 0, ini = 0;
    CFG.premios.forEach(function (p) {
      var d = est.log.filter(function (l) { return l.p === p.id; }).length;
      dados += d; ini += p.stock;
      h += '<tr><td class="n">' + p.nombre + '</td><td class="q">' + est.resto[p.id] + '<small>quedan</small></td><td class="q">' + d +
        '<small>dados</small></td><td class="b"><span class="pm" data-p="' + p.id + '" data-s="-1">−</span><span class="pm" data-p="' + p.id + '" data-s="1">+</span></td></tr>';
    });
    h = '<table>' + h + '</table>';
    $('admin-tabla').innerHTML = h;
    $('admin-total').innerHTML = 'Quedan ' + totalResto() + ' premios · ' + dados + ' giros';
    var u = est.log[est.log.length - 1];
    $('admin-log').innerHTML = u ? 'Último giro: ' + premios[u.p].nombre + ' a las ' + hora(u.t) : 'Todavía no hubo giros';
    $('btn-sonido').innerHTML = 'Sonido: ' + (est.sonido ? 'sí' : 'no');
    $('btn-reiniciar').innerHTML = confirmar ? 'Tocá otra vez para confirmar' : 'Reiniciar stock';
    Array.prototype.forEach.call(document.querySelectorAll('#admin-tabla .pm'), function (el) {
      tocar(el, function () {
        var id = el.getAttribute('data-p');
        est.resto[id] = Math.max(0, est.resto[id] + parseInt(el.getAttribute('data-s'), 10));
        guardar(); pintarAdmin();
      });
    });
  }
  function hora(t) {
    var d = new Date(t), m = d.getMinutes();
    return d.getHours() + ':' + (m < 10 ? '0' : '') + m;
  }
  var acciones = {
    'cerrar-pin': function () { $('pin').className = 'capa oculto'; bloqueo = Date.now() + 600; },
    'cerrar-admin': function () { $('admin').className = 'capa oculto'; bloqueo = Date.now() + 600; refrescarBoton(); },
    'sonido': function () { est.sonido = !est.sonido; guardar(); pintarAdmin(); },
    'deshacer': function () {
      var u = est.log.pop();
      if (u) { est.resto[u.p] += 1; guardar(); }
      pintarAdmin();
    },
    'orientar': function () { $('admin').className = 'capa oculto'; pedirOrientacion(); },
    'reiniciar': function () {
      if (Date.now() - confirmar < 4000) {
        CFG.premios.forEach(function (p) { est.resto[p.id] = p.stock; });
        est.log = []; confirmar = 0; guardar();
      } else { confirmar = Date.now(); }
      pintarAdmin();
    }
  };

  /* ---------- arranque ---------- */
  dibujarRueda();
  armarPin();
  refrescarBoton();
  iniciarOrientacion();

  Array.prototype.forEach.call(document.querySelectorAll('[data-a]'), function (el) {
    tocar(el, function () { acciones[el.getAttribute('data-a')](); });
  });
  tocar($('premio'), cerrarPremio);
  tocar($('pin'), function () {});
  tocar($('admin'), function () {});

  /* mantener apretado el logo 3 s abre el PIN */
  var lp = null;
  function lpIni(ev) { if (ev.stopPropagation) ev.stopPropagation(); if (ev.preventDefault) ev.preventDefault(); clearTimeout(lp); lp = setTimeout(abrirPin, 3000); }
  function lpFin() { clearTimeout(lp); }
  ['touchstart', 'mousedown'].forEach(function (e) { $('logo').addEventListener(e, lpIni, false); });
  ['touchend', 'touchcancel', 'mouseup', 'mouseleave'].forEach(function (e) { $('logo').addEventListener(e, lpFin, false); });

  /* cualquier toque en el resto de la pantalla gira */
  tocar(stage, girar);

  /* control remoto / teclado: OK gira o cierra; arriba x5 abre el PIN */
  var arriba = 0, arribaT = 0;
  document.addEventListener('keydown', function (ev) {
    var k = ev.keyCode;
    if (k === 13 || k === 32) {
      ev.preventDefault();
      if (!$('premio').className.match(/oculto/)) cerrarPremio(); else girar();
    } else if (k === 38) {
      if (Date.now() - arribaT > 1500) arriba = 0;
      arribaT = Date.now(); arriba++;
      if (arriba >= 5) { arriba = 0; abrirPin(); }
    } else if (k >= 48 && k <= 57 && !$('pin').className.match(/oculto/)) {
      tecla(String(k - 48));
    }
  }, false);

  /* para pruebas automáticas */
  window.__ruleta = { est: function () { return est; }, sortear: sortear, girar: girar };
})();
