# Plan: Trivia Playapp con animaciones y APK Android

Documento de diagnóstico y plan. **No se cambió código.** Fecha: 23/10/2026.

---

## Ficha corta

| | |
|---|---|
| **Qué es el repo** | Prototipo de trivia "estilo Kahoot" (pantalla grande + celulares por QR + consola del presentador), hecho por Javier. Nombre interno: *JAKPOT Trivia*. |
| **Tecnología** | Next.js 14 (web) + Supabase (base de datos, usuarios y tiempo real). |
| **¿Funciona hoy?** | **No.** La compilación falla (verificado) y el script de base de datos tiene errores que impiden aplicarlo en una base nueva. El último deploy en Vercel (proyecto `trivia`) figura en **ERROR**. |
| **¿Es sólido?** | No como producto. Sirve como **borrador y referencia** (modelo de datos, importación de preguntas, temas por cliente). La pantalla del juego hay que rehacerla. |
| **Animaciones hoy** | Ninguna (solo un ícono de "cargando"). |
| **APK hoy** | Nada armado. **Verifiqué que se puede generar un APK desde este entorno de nube** (APK de prueba compilado y firmado en modo prueba). |
| **Recomendación animaciones** | Framer Motion (transiciones) + CSS (cuenta regresiva) + confeti liviano; Lottie solo para piezas de marca. |
| **Recomendación APK** | Capacitor: la misma web empaquetada como app, funcionando **sin internet**. |
| **Primera entrega propuesta** | Un link web con la trivia jugable y animada (preguntas y colores de prueba) para probar en el celular. |
| **Qué necesito de Facundo** | Responder las 6 preguntas (sección 6), la planilla de preguntas y el manual de marca (sección 7). |

---

## 1. Qué hay en el repo (relevamiento)

### 1.1 Documentación y estructura
- No hay `CLAUDE.md` ni `AGENTS.md`. Hay un `README.md` con pasos de instalación en español.
- Unas 2.300 líneas de código. Partes principales:
  - `app/display/...` → pantalla grande (TV) con QR, pregunta actual, reloj y top 5.
  - `app/play/...` → pantalla del jugador en el celular: registro (email + apodo) y botones de respuesta.
  - `app/t/.../host/...` → consola del presentador: elige pregunta, "Start" / "End".
  - `app/admin/...` → panel: crear clientes ("tenants"), juegos, elegir tema, cargar preguntas a mano o por CSV.
  - `app/api/...` → servidor: registrar jugador, recibir respuesta y calcular puntaje, guardar estado.
  - `supabase/schema.sql` → tablas: clientes, juegos, preguntas, jugadores, respuestas, temas, perfiles.
  - `app/evolution/page.tsx` → página de "avance del proyecto" (informativa).
- Historial: 6 commits de Javier del 28/05/2026. Hay una prueba automática de ejemplo (`1+1=2`), nada que pruebe el juego.

### 1.2 Cómo funciona el juego hoy
Es un juego **multijugador en vivo con presentador**: la TV muestra un QR, la gente se registra en su celular, el presentador lanza cada pregunta, todos responden a la vez y el ranking se actualiza en la TV. El puntaje es: puntos base + bonus por responder rápido. Esto **no es** lo mismo que "una tablet donde juega una persona por vez", que es lo que suele implicar un APK de evento (ver pregunta 1 de la sección 6).

### 1.3 Dónde se publica, base de datos y panel
- **Vercel** (cuenta del estudio): hay dos proyectos.
  - `trivia`: último deploy (28/05/2026, misma fecha que el código) en **ERROR**. No pude ver a qué repositorio está conectado.
  - `trivia-evento`: deploy **funcionando** (06/05/2026). **No está claro si es este código u otro**. Hay que preguntarle a Javier.
- **Supabase**: en la cuenta conectada a esta sesión hay 3 proyectos (`Manso_web`, `qentra-dev`, `Valora_dev`), **ninguno de trivia**. Puede estar en una cuenta de Javier. Sin verificar.
- **Panel de administración**: existe pero es básico. Crea clientes y juegos, carga preguntas y elige tema. **No permite crear ni editar temas** (colores/logo): eso hoy se hace a mano en la base de datos.
- **Formato de preguntas actual**: CSV con columnas `idx,text,option_a,option_b,option_c,option_d,correct_index,time_limit_sec,points_base,points_time_factor`. Solo texto, siempre 4 opciones, la correcta se indica como número 0 a 3 (confuso para cargar a mano).

### 1.4 Verificaciones que hice (en una copia, fuera del repo)
| Chequeo | Resultado |
|---|---|
| Instalar dependencias exactas (`npm ci`) | **Falla**: el archivo de versiones (`package-lock.json`) no coincide con `package.json`. Con `npm install` sí instala. |
| Compilar para producción (`next build`) | **Falla** por 2 errores de revisión de código (variables sin usar). |
| Revisión de tipos (`tsc`) | **Falla**: falta la definición de tipos de `papaparse` (3 errores). |
| Pruebas (`vitest`) | Pasa, pero es solo la prueba de ejemplo. |
| Script de base de datos | **No se puede aplicar en una base nueva** (leído, no ejecutado): usa `create policy if not exists`, que Postgres no acepta; la función `is_super_admin` está mal escrita (le falta `select`); y crea un permiso sobre la tabla `themes` antes de crearla. |

### 1.5 Problemas de seguridad y lógica (leídos en el código)
- **Cualquiera puede responder por otro**: la respuesta se identifica solo con el email, sin comprobar que sea esa persona.
- **La consola del presentador se puede usar sin permiso** si no se configura la clave `HOST_ADMIN_SECRET`; y si se configura, la consola no la envía, así que deja de guardar el estado **y muestra "iniciada" igual**.
- El inicio de sesión siempre redirige a un juego de demo fijo (`/t/demo/host/demo-game`).
- Los jugadores pueden recibir el estado del juego antes de que termine de cargar la lista de preguntas (puede no mostrar la pregunta).
- Datos personales (emails) sin texto de consentimiento ni forma de borrarlos.

### 1.6 Veredicto
**El código de base no es sólido.** Es un prototipo prolijo en intención, pero no compila, la base de datos no se puede crear tal cual, tiene agujeros de seguridad y fue pensado para otro formato de juego (presentador + TV). Lo que conviene:

| Reutilizar (como idea o con arreglos) | Rehacer |
|---|---|
| Tecnología: Next.js + Supabase (está bien elegida y el estudio ya usa ambas). | Pantalla del juego del jugador (desde cero, con animaciones). |
| Modelo de datos: clientes → juegos → preguntas → jugadores → respuestas. | Script de base de datos (reescribirlo limpio y probarlo). |
| Idea de "tema por cliente" con colores en variables. | Cálculo de puntaje y validación (más seguro, y que funcione sin internet). |
| Importación de preguntas desde planilla. | Editor de temas en el panel (hoy no existe). |
| QR + pantalla grande, para una versión "en vivo" futura. | Ranking (pensado para el formato que elija Facundo). |

---

## 2. Plan de animaciones

### 2.1 Opciones
| Opción | Para qué sirve | Peso | Veredicto |
|---|---|---|---|
| **CSS puro** | Reloj, pulsos, brillos, entradas simples. | 0 | **Sí**, para lo repetitivo (reloj). Lo más liviano. |
| **Framer Motion** (librería "motion") | Transiciones entre pantallas, botones que entran, puntaje que sube, ranking que se reordena. Se lleva perfecto con el código actual (React). | ~30-40 KB | **Sí, base principal.** |
| **Confeti liviano** (`canvas-confetti`) | Festejo de acierto y final. | ~6 KB | **Sí.** Con colores del cliente. |
| **Lottie** (animaciones hechas en After Effects) | Intro de marca, mascota, logo animado. Las puede producir el equipo (Experiencias Audiovisuales). | ~60 KB + cada archivo | **Opcional**, solo para 1-3 piezas de marca. |
| **Phaser / canvas** (motor de videojuegos) | Juegos de acción con física. | ~1 MB | **No.** Para una trivia es excesivo y obliga a rehacer todo. |

### 2.2 Qué animaciones tienen sentido
1. **Pantalla de inicio** ("tocá para jugar"): logo del cliente con respiración suave + fondo en movimiento lento. Atrae gente en un stand.
2. **Pregunta que entra**: número de pregunta grande → la pregunta aparece → las opciones entran una tras otra (0,1 s de diferencia).
3. **Cuenta regresiva**: barra o anillo que se vacía; cambia a color de alerta y late en los últimos 5 segundos.
4. **Acierto**: la opción se pinta de verde, rebote corto, "+150" que sube y confeti chico.
5. **Error**: sacudida corta de la opción elegida, se marca en rojo y se ilumina la correcta.
6. **Puntaje**: contador que sube número a número.
7. **Pantalla final**: puntaje grande, confeti mayor, "quedaste 4° del día".
8. **Ranking**: filas que entran y se reordenan; el jugador actual resaltado.
9. **Transiciones** entre pantallas: deslizamientos/fundidos de menos de medio segundo.
10. **Sonidos** (opcional, con volumen configurable): tic del reloj, acierto, error, festejo.

### 2.3 Rendimiento en Android de gama media
- Animar solo **posición, tamaño y transparencia** (lo que el celular resuelve con la placa de video). Evitar sombras grandes y desenfoques animados.
- Confeti: limitar cantidad de partículas (~80) y duración (~2 s).
- Imágenes de fondo comprimidas (WebP) y tipografías en formato liviano (WOFF2).
- **"Modo liviano"** automático: si el equipo es lento o el usuario pidió menos movimiento en su celular, se reducen efectos.
- Meta: animaciones fluidas (60 cuadros por segundo) en un teléfono tipo Samsung Galaxy A de 2-3 años. **Hay que probarlo en un equipo real**: desde la nube no puedo medirlo.

### 2.4 Branding del cliente sin tocar código (tema configurable)
Cada juego tiene un **tema** guardado en la base de datos y editable desde el panel:
- Colores: fondo, texto, principal, acierto, error, botones (con selector de color y **vista previa**).
- Tipografías: títulos y textos (se suben los archivos del manual).
- Logo (versión clara y oscura), fondo (imagen o video corto), mascota/Lottie opcional.
- Sonidos opcionales, textos (bienvenida, "¡Correcto!", pantalla final, bases legales).
- El juego lee el tema al arrancar. En el APK el tema queda **guardado dentro** para funcionar sin internet, y se actualiza cuando hay conexión.

Hoy el repo tiene la mitad de esto (colores en un JSON, logo y fondo), pero sin editor y sin tipografías.

---

## 3. Plan para el APK Android

### 3.1 Opciones
| Opción | Cómo es | A favor | En contra | Esfuerzo |
|---|---|---|---|---|
| **Capacitor** (recomendada) | La web del juego se mete dentro de una app Android. | Un solo código para web y APK. **Funciona sin internet.** Se instala directo en tablets sin Play Store. Acceso a pantalla completa, sonido, mantener pantalla encendida. | Hay que adaptar la web para que no dependa del servidor (ver 3.3). | Medio-bajo |
| **TWA / PWA** (la web "instalada") | La app es un acceso a la web publicada. | Muy simple; se actualiza sola. | **Necesita internet** sí o sí; TWA exige verificar el dominio y Chrome en el equipo. Menos control para modo kiosco. | Bajo |
| **Reescribir** (Flutter / React Native / Unity) | App nativa desde cero. | Máximo rendimiento. | Dos códigos (web y app), mucho más tiempo, nada se reutiliza. Innecesario para una trivia. | Alto |

### 3.2 Qué se necesita
- **Para APK de prueba**: nada de Facundo. **Lo verifiqué**: en este entorno de nube instalé las herramientas de Android (SDK 35, Java 21) en una carpeta temporal y compilé un APK de prueba con Capacitor (4 MB, firmado en modo prueba). Detalle: el primer intento falló porque el servidor de descargas de Java (Maven) rechazó por exceso de pedidos; al reintentar funcionó. **No lo probé en un teléfono real** (no hay equipo físico acá).
- **Para APK final (firmado)**: una "llave de firma" (archivo + contraseña). **No va al repo.** Opciones: la guarda Facundo y se la carga como dato secreto del entorno, o se firma en su compu. Si se pierde la llave, no se puede actualizar la app instalada (habría que desinstalar y reinstalar).
- **Cuenta de Google Play** (USD 25, pago único): **solo si** se quiere publicar en la tienda. Para tablets de un evento alcanza con pasar el archivo APK e instalarlo ("permitir orígenes desconocidos").
- **Android Studio en la compu de Facundo**: **no hace falta** para generar el APK. Solo sería útil para depurar en un equipo conectado por cable.
- **Modo kiosco** (que el jugador no salga de la app): para un evento alcanza con la función de Android "Fijar pantalla" (sin programar nada). Algo más cerrado requiere configuración extra del equipo.

### 3.3 ¿Internet o sin internet?
- **Sin internet (recomendado para kiosco)**: preguntas, tema y animaciones viajan dentro del APK. Cada partida y los datos del jugador se guardan en la tablet y **se suben solos** cuando vuelve la conexión. El ranking del día se calcula en la tablet.
- **Con internet**: hace falta para un **ranking compartido en vivo** entre varias tablets o con celulares por QR, y para cambiar preguntas a distancia en medio del evento.
- Consecuencia técnica: la versión APK no puede usar las "funciones de servidor" que tiene hoy el repo (`app/api`). El juego debe funcionar solo en el dispositivo, y la sincronización se hace directo con Supabase con reglas seguras.

---

## 4. Plan de trabajo por etapas

Cada etapa termina con algo que Facundo puede **abrir y probar**. Los plazos son estimados para una persona y dependen de las respuestas de la sección 6.

| # | Entrega | Qué puede probar Facundo | Estimado |
|---|---|---|---|
| 0 | **Base sana**: que compile, versiones al día, script de base de datos que se aplique, cerrar los agujeros de seguridad, publicar en Vercel. | Un link que abre (aunque sea el juego viejo). | 1-2 días |
| 1 | **Prototipo jugable animado** (preguntas y colores de ejemplo, sin registro). Todas las animaciones de la sección 2.2. | Link para jugar en su celular. Opina sobre ritmo y animaciones. | 3-4 días |
| 2 | **Marca del cliente + sus preguntas**: tema configurable, editor en el panel, carga por planilla. | El juego con la cara del cliente. Ideal para mostrarle al cliente. | 2-3 días |
| 3 | **APK de prueba** instalable. | Lo instala en una tablet/celular y lo prueba sin internet. | 1-2 días |
| 4 | **Registro + ranking + exportación** (nombre/email/tel con consentimiento, ranking del día, descarga a planilla desde el panel). | Juega varias veces, ve el ranking, descarga los datos. | 2-3 días |
| 5 | **Cierre**: sincronización sin internet, modo kiosco, APK firmado, prueba en el equipo real del evento, ajustes. | APK final + ensayo general. | 2-3 días |

**Orden recomendado**: 0 → 1 → 2 → 3 → 4 → 5. El APK va recién en la etapa 3 a propósito: primero conviene acordar cómo se ve y se siente el juego (más barato de cambiar en la web), y empaquetarlo es rápido porque ya verifiqué que funciona.

### Riesgos
- **Formato de juego equivocado**: el repo es "en vivo con presentador"; si el evento es "tablet, una persona por vez", cambia el diseño. Por eso es la pregunta 1.
- **Equipos del evento**: tablets muy viejas o baratas pueden trabar las animaciones. Probar en el equipo real lo antes posible.
- **Tipografía del manual**: muchas fuentes comerciales necesitan **licencia para usarse en apps**. Confirmar con el cliente.
- **Datos personales**: si se piden email/teléfono, hace falta texto de consentimiento (Ley 25.326) y decidir quién guarda y cuánto tiempo.
- **Datos del cliente en el repo**: por regla no se suben preguntas, logos ni manual al repo sin aviso. Propuesta: viven en Supabase / una carpeta de Drive, y en el repo solo ejemplos ficticios.
- **Accesos**: no encontré el proyecto Supabase de esta trivia ni sé qué código corre en `trivia-evento`. Hay que pedirle a Javier.
- **Descargas desde la nube**: el servidor de Maven rechazó pedidos una vez; si se repite, el APK se puede generar en otro momento o en la compu de Facundo.

### Decisiones que necesita de Facundo
Las 6 preguntas de la sección 6, más: fecha del evento (define si todo entra) y quién habla con Javier por los accesos (Vercel `trivia-evento`, Supabase).

---

## 5. Resumen de la recomendación técnica
- Mantener Next.js + Supabase; reescribir la pantalla de juego y la base de datos con lo aprendido del prototipo.
- Animaciones: **Framer Motion + CSS + confeti**, Lottie opcional para piezas de marca.
- APK: **Capacitor**, funcionando **sin internet** y sincronizando cuando hay conexión.
- La misma trivia queda también como **web con QR** (formato Playapp estándar) sin trabajo extra.

---

## 6. Preguntas imprescindibles para Facundo

Cada una trae una respuesta sugerida: si está de acuerdo, alcanza con un "sí".

1. **¿Dónde y cómo se juega?**
   *Sugerencia:* en 1-2 tablets propias en un stand (modo kiosco), **una persona por vez**. Más adelante, opcional, el mismo juego por QR en el celular de la gente.
2. **¿Cómo funciona el ranking y qué datos se piden?**
   *Sugerencia:* ranking **del día**, por puntaje (aciertos + rapidez). Al final se pide nombre (obligatorio) y email o teléfono (opcional, con casilla de consentimiento). Top 10 en pantalla; descarga en planilla desde el panel.
3. **¿Cuántas preguntas y de qué tipo?**
   *Sugerencia:* banco de **30 a 50 preguntas**; cada partida toma **10 al azar**. Opción múltiple de 4 opciones (y algunas verdadero/falso). Texto, con imagen opcional.
4. **¿Tiempos?**
   *Sugerencia:* **15 segundos por pregunta**, partida de 2-3 minutos, más puntos cuanto más rápido. Después de cada respuesta se muestra la correcta 2 segundos.
5. **¿Tiene que funcionar sin internet?**
   *Sugerencia:* **sí**, sin internet; los datos se suben solos cuando haya conexión. El ranking compartido entre tablets queda para una versión con internet.
6. **¿Idioma y premios?**
   *Sugerencia:* **solo español**. Premio al mejor puntaje del día (lo entrega el stand); el juego solo muestra el ranking, no maneja premios.

---

## 7. Qué necesito para empezar

### 7.1 Preguntas: planilla propuesta
Google Sheets o Excel, una fila por pregunta. **Primera fila = estos títulos:**

| id | pregunta | opcion_a | opcion_b | opcion_c | opcion_d | correcta | tipo | tiempo_seg | imagen | explicacion | activa |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | ¿En qué año se fundó la empresa? | 1985 | 1990 | 1995 | 2000 | B | multiple | 15 | | Se fundó en 1990 en Córdoba. | si |
| 2 | La empresa tiene presencia en 5 países. | Verdadero | Falso | | | A | vf | 10 | | | si |
| 3 | ¿Cuál de estos es nuestro producto? | (texto) | (texto) | (texto) | (texto) | D | multiple | | producto3.jpg | | si |

- `correcta`: la **letra** (A, B, C o D). Así no hay confusión.
- `tipo`: `multiple` o `vf`.
- `tiempo_seg`, `imagen`, `explicacion`: opcionales (vacío = valor general).
- `activa`: `si`/`no`, para apagar una pregunta sin borrarla.
- Imágenes: en una carpeta aparte con el mismo nombre de archivo que figura en la planilla.
- *(Los ejemplos de arriba son inventados.)*

### 7.2 Manual de marca
- El **PDF del manual**.
- **Logos** en SVG (o PNG con fondo transparente, mínimo 2000 px): versión color, blanca y negra.
- **Colores** en código HEX (si el manual los tiene, alcanza).
- **Tipografías**: los archivos (.ttf/.otf/.woff2) **y confirmar que la licencia permite usarlas en una app**. Si no, elegimos una gratuita parecida.
- Opcional: fondos, íconos, mascota, video/animación de marca, sonido o jingle, bases y condiciones del concurso.

### 7.3 Cómo enviarlo
Por una **carpeta de Drive** compartida (no al repo). En el repo solo quedan ejemplos inventados, salvo que Facundo autorice otra cosa.

### 7.4 Accesos
- Que Javier confirme dónde está el proyecto de **Supabase** de esta trivia (o creamos uno nuevo en la cuenta del estudio) y qué código corre en **`trivia-evento`** de Vercel.
