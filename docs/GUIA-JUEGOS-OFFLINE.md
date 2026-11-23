# Guía: juegos offline para pantallas (táctil y con control remoto)

Lo aprendido con la trivia de Feller (tablets) y la ruleta de Pilar XV (televisor + Fire TV), para arrancar juegos nuevos en cualquiera de las dos direcciones sin repetir los tropiezos.

## Las dos direcciones

| | A. Táctil | B. Pantalla + control remoto |
| --- | --- | --- |
| Dónde se juega | Tablet Android, o TV con marco táctil | Televisor común |
| Qué ejecuta el juego | La tablet; o una PC / TV box Android conectada al TV | Fire TV Stick por HDMI |
| Cómo juega la gente | Toca la pantalla | Aprieta el botón central del control |
| Referencia en el repo | Trivia Feller (`preview/pollito/`, `tools/feller-apk/`) | Ruleta Pilar XV (`public/pilar/`, `tools/pilar-apk/`) |
| Estado | Usada en evento, en tablets | Usada en evento, 22/11/2026 |

Las dos comparten la misma idea: **una web estática sin red, empaquetada como APK**. La ruleta de Pilar ya trae los dos modos (Ajustes → "Se juega con": Control / Táctil), así que es la base recomendada para juegos nuevos en ambas direcciones.

## Qué hardware sirve para qué

- **El televisor nunca ejecuta el juego.** Un Samsung con Tizen no abre HTML ni apps desde un pen drive; el USB solo reproduce fotos, música y video. Siempre hace falta un equipo aparte por HDMI.
- **El marco táctil se enchufa al equipo que ejecuta el juego, no al televisor.** Conectado al TV, mueve el puntero del TV y el equipo no recibe nada. Este fue el error que más tiempo costó en Pilar.
- **Tablet Android**: el caso más simple. Táctil nativo, se instala la APK y listo.
- **PC o mini PC + marco táctil**: la opción más segura para TV táctil. Los marcos están hechos para Windows. El juego corre en Chrome a pantalla completa (F11) con la pantalla en vertical.
- **TV box Android genérica + marco táctil**: debería tomar el marco como pantalla táctil. No probado.
- **Fire TV + marco táctil**: no probado con el marco bien conectado. Necesita un cable OTG en "Y" micro-USB con alimentación, porque el stick tiene un solo puerto.
- **Fire TV + control remoto**: probado y funcionando. Es la salida cuando no hay táctil.
- **Sin internet en el lugar**: el juego no necesita red, pero **instalar sí**. Toda instalación o actualización se hace antes, con wifi.

## Base técnica (carpeta `public/pilar/`)

- **Sin dependencias ni compilación**: `index.html`, `style.css`, `app.js`, `config.js` y `assets/`. Se abre con doble clic en un navegador para probar.
- **Lienzo fijo de 1080×1920** que se escala y rota por código. Un Fire TV siempre emite en horizontal: con el televisor en vertical, el juego se dibuja rotado. En el primer arranque se elige la orientación y queda guardada.
- **JavaScript y CSS conservadores** (sin `gap` en flex, `clamp`, `aspect-ratio`, encadenamiento opcional) para WebViews viejos.
- **Estado en `localStorage`**, guardado en cada acción: stock, registro de jugadas, orientación y ajustes sobreviven a apagar el equipo.
- **`config.js` son los valores de fábrica.** Lo guardado en el dispositivo manda sobre ellos. Para que un cambio de fábrica se aplique en un equipo que ya tiene datos, hay que cambiar el `id`; eso reinicia stock y jugadas, pero conserva la orientación.
- **Panel de operador** con solapas (Premios, Giros, Ajustes), pasos − / +, confirmación en dos toques y exportación CSV. Es el mismo criterio del panel de la trivia de Feller.
- **Sonido sintetizado** con Web Audio: no hay archivos de audio.
- **Arte generado por código** (`tools/pilar-apk/arte.html` + `arte.cjs`): fondo, texturas y logo con relieve salen de un script reproducible. Todo lo estático se entrega ya rasterizado para no cargar al equipo.

## Entrada: lo que hay que cubrir

- **Toque y mouse**: escuchar `touchstart` y `mousedown`, con antirrebote.
- **Control remoto**: llega como teclado. Botón central = Enter (13), flechas = 37 a 40. El botón Atrás se intercepta en el contenedor Android y se reenvía a la web.
- **Todo el panel tiene que poder manejarse con flechas y OK**, con un foco bien visible. Si no, sin táctil no hay forma de corregir stock en el lugar.
- **Campos de texto**: son una trampa con control remoto. Al entrar a uno, las flechas dejan de navegar. Hay que dar salida explícita (arriba, abajo, OK y Atrás salen del campo). Aun así, escribir con el control es incómodo: cargar nombres antes del evento.
- **No hay "mantener apretado" ni PIN numérico con control**: el acceso al panel es una secuencia de flechas (hoy, arriba tres veces).
- **Botón Home**: saca del juego y no se puede bloquear. Tapar los botones que no se usan o dejar el control a un anfitrión.
- **Diagnóstico de entrada** (Ajustes): muestra los dispositivos conectados y cuenta los eventos que llegan. Si al tocar todos los contadores quedan en cero, el equipo no recibe el marco: revisar dónde está enchufado antes de tocar código.

## Empaquetar como APK (`tools/pilar-apk/`)

Contenedor Android mínimo, sin Gradle ni Android Studio: una actividad con un WebView a pantalla completa que carga la carpeta web desde los assets.

```bash
SDK=<carpeta con build-tools 34 y plataforma 34> KEYSTORE=<clave.keystore> tools/pilar-apk/build.sh salida.apk
```

- **Herramientas**: `build-tools_r34-linux.zip` y `platform-34-ext7_r03.zip`, de `dl.google.com/android/repository/`. Más Java (javac, keytool).
- **Clases internas**: el `d8` de build-tools 34 falla con clases internas y anónimas. Cada clase va en su propio archivo.
- **Versión**: subir `versionCode` en `AndroidManifest.xml` en cada entrega.
- **Clave de firma**: una APK solo se instala encima de otra si están firmadas con la misma clave. Si se pierde, hay que desinstalar antes, y eso borra stock y ajustes. La clave no va al repo: guardarla en la carpeta del cliente.
- **Pantalla siempre encendida**: el contenedor ya lo pide. El apagado automático del televisor se desactiva en el menú del propio TV.
- **Para otro juego**: copiar `public/pilar/` y `tools/pilar-apk/` con otro nombre, y cambiar el nombre del paquete (manifiesto y carpetas de `src/`), el título, la ruta de assets en `MainActivity` y `build.sh`, el ícono y el `id` de `config.js`. Todavía no es una plantilla parametrizada.

## Instalar en un Fire TV

1. Configuración → Mi Fire TV → Información → apretar siete veces sobre el nombre, hasta que aparezcan las Opciones para desarrolladores.
2. Instalar **Downloader** desde la tienda.
3. Opciones para desarrolladores → Instalar apps desconocidas → activar Downloader. Si se reinstala Downloader, hay que volver a activarlo.
4. En Downloader, pestaña **Home**: escribir la dirección de la APK y Go. No usar la pestaña Browser: pide el plan pago y traba las descargas.
5. Instalar y abrir.

- **Dirección de descarga**: sirve el archivo crudo de GitHub mientras el repo sea público. GitHub tarda hasta unos cinco minutos en entregar una versión recién subida; conviene comprobar la huella antes de avisar.
- **Con iPhone no hay atajo**: las apps para mandar archivos al Fire TV son para Android o computadora.
- **Abrir sin internet**: Configuración → Aplicaciones → Administrar aplicaciones instaladas → la app → Iniciar aplicación.
- **Si la app queda trabada**: misma pantalla → Forzar detención → Iniciar. No se pierde lo guardado.
- **Miniatura en el inicio**: el Fire TV muestra las apps instaladas por fuera de la tienda con un recuadro gris y el ícono encajado en un cuadrado. No se puede llenar el recuadro como las apps de la tienda; usar un ícono cuadrado para que no se deforme.

## Diseño

- Pedir de entrada: logo vectorial, referencia estética y si va con fondo escenográfico o tipo merch. En Pilar la primera versión fue plana y con paisaje; la aprobada fue tipo merch, con brillantina, relieve y cromados.
- El volumen se logra con capas: canto del disco desplazado, sombra, degradado radial, facetas por gajo y un aro con reflejos que no gira.
- Textos de la rueda siempre legibles: contorno oscuro sobre texturas.
- El texto del botón depende del modo: "Tocá para girar" o "Apretá el botón del centro".

## Lista antes del evento

1. Instalar y probar en el equipo real, con wifi, al menos un día antes.
2. Probar la entrada real: táctil o control, en la posición final de la pantalla.
3. Elegir la orientación y verificar que quede guardada al reabrir.
4. Cargar premios, nombres y cantidades definitivos.
5. Girar varias veces, revisar el descuento en el panel y después **Giros → Borrar todo y reponer stock**.
6. Confirmar volumen y que no quede el aviso de silencio del televisor en pantalla.
7. Desactivar el apagado automático del televisor.
8. Practicar cómo reabrir la app sin internet y cómo forzar su detención.
9. Guardar la APK final y la clave de firma en la carpeta del cliente.

## Sobre la trivia de Feller en tablets

- En el repo está el **juego compilado** (`preview/pollito/assets/`), no su proyecto fuente. Se modifica con parches sobre el bundle y se rearma la APK según `tools/feller-apk/README.md`. La APK del evento (v0.13) está en Drive: ver `docs/feller/CIERRE-2026-11-04.md`.
- Sirve como referencia de mecánica, flujo y panel de operador, que funcionó bien y sin internet.
- Para una trivia táctil nueva y mantenible, conviene escribirla sobre la base de Pilar (web estática con fuente legible + contenedor propio) y tomar de Feller las reglas, el panel de preguntas y el flujo de partida.
