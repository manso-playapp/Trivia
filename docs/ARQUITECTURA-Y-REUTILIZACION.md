# Mapa del repo y reutilización

El repositorio conserva dos líneas de juego: **trivia** (motor Next/Supabase y la implementación de Feller, con su versión de tablet) y **juegos offline para pantallas** (ruleta de Pilar XV: web estática empaquetada como APK, táctil o con control remoto). Para arrancar un juego offline nuevo, ver la [guía de juegos offline](GUIA-JUEGOS-OFFLINE.md). Hoy no es una librería empaquetada ni una plantilla completamente parametrizada.

| Carpeta | Qué contiene | Qué conservamos para otros proyectos |
| --- | --- | --- |
| `app/play/`, `app/display/`, `app/t/`, `app/admin/`, `app/api/` | Motor Next.js: jugador, pantalla, host, administración y endpoints | Base de rutas y flujo de partida, registro, respuestas y puntuación. Requiere configurar y validar el backend por proyecto. |
| `lib/`, `types/`, `components/ThemeStyle.tsx` | Clientes, tipos, helpers y tema | Estructura técnica y mecanismo de temas. Los helpers de Feller son específicos. |
| `supabase/schema.sql` | Esquema SQL, funciones y políticas iniciales | Punto de partida del backend multi-tenant. No asumir que es una plataforma nueva lista para producción sin revisión. |
| `app/feller/`, `data/feller.ts`, `lib/feller.ts`, `components/feller/` | Implementación Next simple de la trivia Feller | Referencia editable de mecánica, feedback y personajes; cambiar branding, contenidos y reglas para otro cliente. |
| `preview/pollito/assets/` | Juego de tablet compilado | Referencia de la versión del evento. No reemplaza el fuente original de la app. |
| `tools/feller-apk/` | Rearmado, firma y parches documentados de APK | Procedimiento técnico reutilizable; el bundle, las reglas y los assets requieren adaptación. La clave de firma queda fuera del repo. |
| `public/feller-led/vertical/` | Promo final Feller de 90 s con tres preguntas | Patrón de animación, composición y línea de tiempo; no copiar contenidos y marca como si fueran genéricos. |
| `public/feller-led/assets/` | Logo, foto, fuentes con licencias y SVG extraídos | Las fuentes conservan sus licencias. El logo, la foto y el material de Feller pertenecen a este proyecto. |
| `tools/render-feller-vertical.cjs` | Captura del navegador y exportación MP4 en nativo/alta | Pipeline de render, validación de loop y exportación reproducible. Hoy contiene rutas, tamaños y verificaciones de Feller: adaptarlas al reutilizar. |
| `public/feller-led/index.html`, `promo.*`, `preview/feller.html` | Prototipos anteriores | Referencia histórica. No son la pieza audiovisual final. |
| `docs/feller/` | Cierre, enlaces, manifiesto y vistas finales | Archivo de este cliente; punto de entrada para retomar. |
| `app/lucia/`, `app/api/lucia/`, `components/lucia/`, `lib/lucia*.ts`, `supabase/lucia.sql`, `public/lucia/`, `docs/lucia/` | Ruleta mobile por QR de Lucía Indumentaria. **Migrada a otro repo (PlayApp) el 14/11/2026.** | Nada: es código sin uso. Lo único vigente es la redirección de `/lucia` en `next.config.js`, que sostiene el QR impreso; no quitarla. |
| `public/pilar/`, `tools/pilar-apk/`, `docs/pilar/` | **Ruleta offline para pantalla** (cliente Pilar XV): web estática empaquetada como APK para Fire TV o tablet, sin red ni backend, con modo control remoto y modo táctil | Juego completo, contenedor Android y arte generado por código. Base recomendada para juegos offline nuevos: ver [docs/pilar/README.md](pilar/README.md) y la [guía](GUIA-JUEGOS-OFFLINE.md). |
| `tests/` | Pruebas existentes del repo | Conservar y ampliar según cambien las reglas del juego. |
| `exports/` | Videos y capturas generados localmente | Fuera de Git; finales en Drive, registrados en el manifiesto. |

## Cómo arrancar otro cliente

1. Reutilizar el motor Next, el esquema de datos y el pipeline de exportación que correspondan al nuevo alcance.
2. Crear una carpeta propia de cliente para contenidos, reglas, imágenes y temas, sin sobrescribir Feller.
3. Para una promo nueva, copiar el patrón de línea de tiempo y ajustar la composición, la duración, el tamaño y las verificaciones del exportador. No está automatizado aún como generador multi-cliente.
4. Para una app de tablet mantenible, obtener el proyecto fuente original del artefacto compilado o implementar la nueva app sobre el motor Next; no confundir ambos productos.
5. Mantener fuentes y documentación en Git; archivar entregables pesados en la carpeta del cliente y registrar enlaces, dimensiones y hashes.

## Qué no se guardó en Git

Videos renderizados, capturas temporales, ZIP de trabajo, `node_modules`, `.next`, variables privadas y claves de firma. Los assets necesarios para reproducir la promo sí se guardan, junto con las licencias de fuentes.
