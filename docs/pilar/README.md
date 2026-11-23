# Ruleta offline para pantalla — Pilar XV

**Estado: evento realizado el 22/11/2026, confirmado por el usuario.** Se jugó con el control remoto del Fire TV, en un televisor vertical, sin internet.

Web estática en `public/pilar/` empaquetada como app Android. No usa Next ni Supabase. Lo aprendido, pensado para juegos nuevos, está en la [guía de juegos offline](../GUIA-JUEGOS-OFFLINE.md).

## Brief

- Fiesta de quince. Televisor Samsung de 50" en vertical. Sin internet ni señal de celular en el lugar.
- El juego corre en un Fire TV Stick 4K (Fire OS 8, API 30) conectado por HDMI; el televisor es solo la pantalla.
- La persona gira sin cargar datos y siempre gana un premio.
- Premios finales: 35 bolsas, 25 remeras, 20 botellas, 25 pilusos, 15 perfumes (120 en total).
- Estética tipo merch: fondo violeta con luces y destellos, logo en brillantina rosa con relieve, rueda con aro cromado y gajos de brillantina.

## Archivos

| Ruta | Qué es |
| --- | --- |
| `public/pilar/config.js` | Valores de fábrica: premios, cantidades, paleta, PIN y tiempos. Cambiar también `id` para que el dispositivo descarte lo guardado. |
| `public/pilar/index.html`, `style.css`, `app.js` | El juego. Lienzo fijo de 1080×1920 que se escala y rota solo. |
| `public/pilar/assets/` | Fondo, logo y texturas de brillantina (generados por código) y tipografía Playfair Display (licencia OFL incluida). |
| `public/pilar/ruleta-pilar-xv.apk` | Instalador final, versión 1.8. |
| `tools/pilar-apk/` | Contenedor Android mínimo y `build.sh`. `arte.html` + `arte.cjs` regeneran fondo, logo y texturas; el logo vectorial original está en `arte/logo.svg`. |

## Cómo funciona

- **Sorteo**: cada premio pesa según el stock que le queda, así se agotan de forma pareja. Uno en cero no vuelve a salir. Con todo en cero, el botón avisa que se entregaron todos los premios.
- **Stock**: se descuenta al iniciar el giro y se guarda en el dispositivo.
- **Orientación**: en el primer arranque se elige entre tres carteles el que se lee derecho, con toque o con flechas y OK.
- **Modo de juego** (Ajustes → Se juega con): *Control*, el botón central gira y cierra el cartel; *Táctil*, cualquier toque.
- **Panel de operador**:
  - Con control: arriba tres veces seguidas, sin PIN. Flechas mueven el foco, OK activa, Atrás vuelve un paso.
  - Con táctil: mantener apretado el logo 3 segundos, o tocarlo 5 veces, y PIN `1234`.
  - *Premios*: lo que queda, agregar, editar, eliminar, mostrar u ocultar. La rueda se redibuja sola.
  - *Giros*: listado con hora, exportar CSV, deshacer el último, borrar todo y reponer stock.
  - *Ajustes*: modo de juego, diagnóstico de entrada, sonido, tiempos, PIN, reorientar, valores de fábrica.

## Rearmar la APK

```bash
SDK=<carpeta con build-tools 34 y plataforma 34> KEYSTORE=<pilar-test-2.keystore> tools/pilar-apk/build.sh salida.apk
```

La versión 1.8 está firmada con `pilar-test-2.keystore` (alias `pilar`, contraseña `android`, clave de prueba). No está en el repo: se entregó como archivo en la sesión. La clave de las versiones 1.0 a 1.7 se perdió con el entorno de trabajo.

## Qué quedó probado y qué no

- **Probado en el Fire TV, en el evento**: instalación, orientación con el control, giro con el botón central, descuento de stock, panel con flechas.
- **Probado solo en navegador**: coincidencia entre gajo y premio anunciado, reparto exacto del stock, exportación CSV, salida de los campos de texto y botón Atrás (agregados en la 1.8).
- **Sin confirmar**: el sonido en el Fire TV, y el teclado en pantalla al editar un nombre con el control.
- **Táctil, sin probar**: en las pruebas el marco estaba enchufado al televisor y no al Fire TV, así que el Fire TV nunca recibió los toques. Falta probarlo con un cable OTG en "Y" micro-USB.

## Pendientes conocidos

- El acceso al panel con "arriba tres veces" es fácil de acertar por accidente si el control lo tienen los invitados.
- La miniatura en el inicio del Fire TV se ve con recuadro gris: es una limitación del Fire TV para apps instaladas por fuera de la tienda.
- En el evento apareció el aviso de silencio del televisor sobre la pantalla; no viene de la app.
