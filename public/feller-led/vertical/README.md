# Feller — promo vertical con tres preguntas

Máster de **544 × 768 px**, **90 segundos**, **30 fps**, H.264/yuv420p, sin audio. Para una mitad de la pantalla; el proveedor coloca dos copias idénticas y sincronizadas, lado a lado, en 1088 × 768. No espejar ni estirar una sola copia al ancho completo.

## Secuencia continua de 90 segundos

La secuencia ya no repite un ejemplo de 15 segundos. Contiene tres preguntas distintas del pack del artefacto, con 15 segundos de pantalla de pregunta y seis segundos de festejo por ejemplo:

| Tiempo | Contenido |
| --- | --- |
| 0–6 s | «¿Cuánto sabés del huevo?» |
| 6–21 s | Ejemplo 1: proteína; respuesta A, 6 gramos |
| 21–27 s | Acierto y festejo |
| 27–42 s | Ejemplo 2: peso promedio; respuesta B, 60 gramos |
| 42–48 s | Acierto y festejo |
| 48–63 s | Ejemplo 3: componente de la cáscara; respuesta C, calcio |
| 63–69 s | Acierto y festejo |
| 69–87 s | Invitación al stand y a jugar por premios; titulares alternados |
| 87–90 s | Vuelta animada a la portada |

Cada ejemplo permite leer las opciones antes de mostrar el toque y el acierto. Se conservan las animaciones de texto, la tablet con perspectiva, las opciones escalonadas, los personajes, los efectos de acierto y el fondo animado.

## Colores del juego verificados

La promo anterior usaba amarillo como resaltado. Esta versión replica el estado correcto del artefacto `preview/pollito/assets/index-CQe1EuY2.js` y su CSS:

- `Ik.correct = #ED3237`, asignado a `--ok`.
- `.option.is-correct`: fondo y borde `var(--ok)`, texto blanco.
- Letra de respuesta sustituida por una marca de acierto con borde y trazo blancos.
- Opciones restantes atenuadas al 45%.
- En el juego, la respuesta incorrecta usa `#727376`; esta promo muestra tres aciertos.

Las fuentes son Fira Sans y Saira, según la combinación de la trivia elegida por el usuario. El logo es el oficial extraído del manual; pollitos y huevos son los SVG originales del artefacto.

## Loop y margen

El último cuadro vuelve al primero. La exportación incluye los dos extremos de la línea de tiempo periódica y compara capturas PNG para exigir coincidencia exacta. El MP4 tiene compresión con pérdida.

Se reservan 48 px laterales para textos importantes. La curva aproximada de 25 cm sobre 4 m equivale a unos 68 px centrales del lienzo completo: alrededor de 34 px por mitad. El operador aplica el mapa real de paneles.

## Vista y exportación

Vista: `/feller-led/vertical/index.html`.

```sh
node tools/render-feller-vertical.cjs
```

Requiere Node, Playwright, Chromium y FFmpeg. Captura 2700 cuadros de una secuencia completa de 90 s. Verifica tres preguntas diferentes, las tres respuestas seleccionadas, los colores calculados, las tipografías, los recursos y la igualdad de primer y último cuadro.

Salida: `exports/feller-led/tres-preguntas-90s/feller-promo-3-preguntas-544x768-90s.mp4`.

`window.renderAt(segundos)` permite revisar cualquier instante. `?capture=1` pausa el reloj automático. `SNAPSHOTS_ONLY=1` genera vistas y ejecuta las verificaciones, sin exportar el video.

## Exportar en alta resolución

```sh
npm run feller:export:high
```

Renderiza desde la animación a **1088 × 1536 px** (escala 2×), con capturas PNG y codificación H.264 CRF 16. Conserva 90 s y 30 fps, tres preguntas y loop. Es un máster vertical; el formato nativo para cada mitad LED sigue siendo 544 × 768.

El archivo se guarda en `exports/feller-led/alta-90s/feller-promo-3-preguntas-1088x1536-90s-alta.mp4`. Para otra carpeta: `QUALITY=high node tools/render-feller-vertical.cjs /ruta/de/salida`.

Se necesita Playwright disponible para Node, Chromium y FFmpeg. `CHROMIUM_PATH` permite elegir el ejecutable; si no hay un Chromium de sistema, se usa el instalado por Playwright.
