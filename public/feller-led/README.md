# Feller — promo LED, versión 2

Promo para atraer participantes al stand. Resolución de trabajo: **1088 × 768**, pendiente de confirmar con la ficha o referencia de la pantalla. **24 segundos, 30 fps, sin audio, reproducción en loop.**

## Secuencia

| Tiempo | Plano |
| --- | --- |
| 0–4,4 s | «¿Cuánto sabés del huevo?» con texto animado, pollito y huevos |
| 4,4–6,8 s | Cuenta regresiva 3–2–1 con pollitos saltando |
| 6,8–12,4 s | Pregunta de ejemplo con opciones, reloj y selección automática |
| 12,4–15,4 s | «¡Correcto!» y festejo |
| 15,4–18 s | «PENSÁ. ELEGÍ. ¡JUGÁ!» con pollitos caminando |
| 18–24 s | «Vení al stand de Feller. ¡Jugá la trivia!» |

Los cambios de plano usan un barrido con forma de huevo. El fondo, los personajes, las letras y los festejos se animan con una línea de tiempo determinista. Es una simulación promocional: no registra participantes, no requiere base de datos ni muestra datos reales.

## Tipografías y marca

Por indicación del usuario se usan **las tipografías de la trivia**: **Fira Sans 700/800** para títulos y **Saira 400** para textos. La combinación se verificó en `Ik.headingFont` y `Ik.bodyFont` del artefacto compilado. Los WOFF2 están incluidos localmente, con sus licencias OFL.

El manual indica Centrale Sans Regular/Bold y Saira Regular. Centrale Sans no fue suministrada y no se simula; el usuario eligió usar la combinación de la trivia en esta revisión.

- Rojo y logo oficiales: [Manual Feller 2022](https://drive.google.com/file/d/1JtAksmlnCngWDTDWfHz5BGXqcY3vCAap/view). Logo positivo extraído del PDF, sin reconstruir sus letras.
- Pollitos de frente, caminando y huevos: SVG originales de `preview/pollito/assets/index-CQe1EuY2.js`, extraídos con `tools/extract-feller-art.cjs`. Se conservan las formas y los colores del artefacto.
- Pregunta: «¿Cuántos gramos de proteína aporta un huevo?» y opciones 6/8/12 gramos, tomadas del pack de preguntas del mismo artefacto (respuesta A).
- La foto de marca de la primera propuesta se conserva en assets, pero no se utiliza en la versión 2.

## Vista web

Con el servidor del repo: `npm run dev` → `/feller-led/index.html`. También puede servirse esta carpeta con cualquier servidor estático. Conserva la proporción al cambiar el tamaño de la ventana.

`window.renderAt(segundos)` permite revisar cualquier instante; `?capture=1` desactiva el reloj automático. `window.PROMO` expone duración, formato y fuentes para el exportador.

## Exportación

Desde la raíz del repo:

```sh
node tools/render-feller-led.cjs
```

Requiere Playwright disponible para Node, Chromium (`/usr/bin/chromium`, configurable con `CHROMIUM_PATH`) y FFmpeg. El script sirve los archivos localmente, verifica fuentes y recursos y captura 720 cuadros del navegador. Genera un MP4 H.264, yuv420p, con faststart y sin audio. Las salidas nuevas están en `exports/feller-led/v2/`; el MP4 anterior se conserva en `exports/feller-led/v1/`.

Para revisar solo los seis planos:

```sh
SNAPSHOTS_ONLY=1 node tools/render-feller-led.cjs
```

Validar la resolución definitiva con el operador LED antes de la entrega técnica.
