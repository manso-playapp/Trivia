# Plan: Trivia Playapp con animaciones y APK Android

Documento de diagnóstico y plan. **No se cambió código.** Fecha: 23/10/2026.
Actualizado el mismo día con las primeras respuestas de Facundo (P1 y P2) y el pedido de animaciones de marca.

> **Cliente:** Feller (vende pollitos ponedores; no vende huevos). En este documento solo figura el nombre. Logos, manual, preguntas y datos de jugadores **no se suben al repo**.

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
| **Ya decidido** | Una tablet **Samsung Galaxy Tab A9**, una persona por vez. **5 preguntas** al azar por jugador, **3 opciones**, **15 segundos**. Formulario con nombre, mail y teléfono, **todos opcionales**, con autocompletado del mail. **Sin internet** y **solo en español**. Animaciones con el **pollito** (personaje) y **huevos de consumo** (producto), siempre separados: cuenta 3-2-1, acierto (lluvia de huevos + pollitos caminando), error (huevo que se rompe), final con **felicitación siempre**. Sin premios en pantalla. |
| **Qué necesito de Facundo** | Fecha del evento y cantidad de tablets (sección 9); pollito y huevos ilustrados, licencia de tipografías, logo en vector y preguntas validadas por Feller (sección 7.4). |

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
Es un juego **multijugador en vivo con presentador**: la TV muestra un QR, la gente se registra en su celular, el presentador lanza cada pregunta, todos responden a la vez y el ranking se actualiza en la TV. El puntaje es: puntos base + bonus por responder rápido. Esto **no es** lo mismo que "una tablet donde juega una persona por vez", que es lo que suele implicar un APK de evento (ya respondido: tablet, una persona por vez).

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
- Sonidos opcionales, textos (bienvenida, "¡Correcto!", pantalla final, aviso de privacidad).
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

> **Actualización:** con el evento en noviembre, el plan vigente es el de la **sección 12**. Esta sección queda como referencia del plan completo (sin apuro).

Cada etapa termina con algo que Facundo puede **abrir y probar**. Los plazos son estimados para una persona y dependen de las respuestas de la sección 9.

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

**Ajustes por lo que pidió Facundo:**
- Etapa 1 se arma con un **pollito provisorio** (dibujo simple) para probar ritmo y momentos de las animaciones; en la etapa 2 se reemplaza por el pollito oficial de Feller.
- Las animaciones de marca del pollito (sección 7) se suman a la etapa 2; si las produce el equipo audiovisual, conviene que arranquen en paralelo apenas haya ilustración.
- El formulario opcional con autocompletado (sección 8) va en la etapa 4.

### Decisiones que necesita de Facundo
Fecha del evento y cantidad de tablets (sección 9), y quién habla con Javier por los accesos (Vercel `trivia-evento`, Supabase).

---

## 5. Resumen de la recomendación técnica
- Mantener Next.js + Supabase; reescribir la pantalla de juego y la base de datos con lo aprendido del prototipo.
- Animaciones: **Framer Motion + CSS + confeti**, Lottie opcional para piezas de marca.
- APK: **Capacitor**, funcionando **sin internet** y sincronizando cuando hay conexión.
- La misma trivia queda también como **web con QR** (formato Playapp estándar) sin trabajo extra.

---

## 6. Pantallas y flujo (una persona por tablet)

Confirmado por Facundo: **una tablet (Samsung Galaxy Tab A9), una persona por vez, 5 preguntas por jugador, 15 segundos por pregunta, 3 opciones** (algunas de Verdadero/Falso). Las 5 preguntas salen **al azar** de un banco más grande (la trivia de referencia trae 20), sin repetir dentro de la partida. El recorrido de cada jugador:

| # | Pantalla | Qué pasa | Pollito y huevos |
|---|---|---|---|
| 0 | **Espera / atracción** | Logo de Feller, fondo en movimiento lento, "Tocá para jugar". Es lo que se ve cuando nadie juega. | Pollito quieto que respira, parpadea y mira a los costados. |
| 1 | **Tus datos (opcional)** | Nombre, mail y teléfono, todos opcionales (sección 8). Dos botones: "Jugar" y "Jugar sin dejar datos". | Pollito chico en una esquina. |
| 2 | **Cuenta regresiva 3-2-1** | Números grandes, uno por segundo, y "¡A jugar!". | El pollito acompaña cada número (salta o sostiene el cartel). |
| 3 | **Pregunta** (×5) | "Pregunta 2 de 5", texto, **3 opciones** (o Verdadero/Falso) y reloj de **15 s** que se vacía. | Pollito chico mirando el reloj (sin distraer). |
| 4 | **Respuesta** (1,5-2 s) | Correcta: se pinta + animación de acierto. Incorrecta: la elegida queda marcada, se ilumina la correcta, tono amable. Sin respuesta a tiempo: "¡Se acabó el tiempo!". | Acierto: lluvia de huevos + pollitos que cruzan. Error: un huevo se rompe (ver 7.1). |
| 5 | **Resultado final** | **Siempre felicita**: "¡Felicitaciones, [nombre]!" (o "¡Felicitaciones!" si no dejó nombre), con puntaje y aciertos ("4 de 5"). Nunca "perdiste", ni premios, ganadores o sorteos. | Festejo del pollito con huevos cayendo; más grande con 4 de 5 o más. |
| 6 | **Ranking del día** | Top 10 con nombre (si lo dejó; si no, "Jugador/a"). Se resalta la partida recién jugada. Con 2 tablets sin internet, **cada tablet tiene su propio ranking**. | — |
| 7 | **Vuelta al inicio** | Botón "Jugar de nuevo" y regreso automático a la pantalla 0 a los 15 s. | — |

Reglas de seguridad para el stand:
- Si nadie toca la tablet durante **30 segundos** en cualquier pantalla, vuelve sola al inicio (así nadie deja datos a la vista del siguiente).
- **Menú del operador oculto**: mantener apretado el logo 5 segundos + PIN. Desde ahí: ver cantidad de partidas, forzar envío de datos, borrar el ranking del día, activar o silenciar sonido.
- La tablet se deja "fijada" en la app (función de Android, sin programar nada).

### 6.1 Estilo tomado del video de referencia ("Trivia Nexo")
Lo miré (cuadros sueltos del video, 1 min 44 s, formato vertical). Es una trivia anterior para otra marca. Vale la pena copiar:
- **Pantalla vertical**, fondo del color principal de la marca con una **trama grande y suave del logo** (rombos/formas del isotipo en un tono más claro).
- **Tarjeta blanca** con la pregunta en una franja del color de la marca y el **isotipo en un círculo** "colgado" arriba de la tarjeta.
- **Opciones como botones con borde** y la letra en un circulito (A, B, C); la elegida se rellena con el color de la marca.
- Debajo de la tarjeta, un **ícono grande de ✓ (verde) o ✗ (rojo)** como devolución inmediata.
- **Formulario** "Antes de comenzar, ¡registrate!" con botones rápidos de dominio de mail al costado del campo (Outlook/Gmail): coincide con el autocompletado que pidió Facundo.
- **Pregunta rompehielo** al inicio ("¿Ya conocías la marca?", con Sí/No y emojis): idea opcional para Feller.
- **Final**: puntaje grande dentro de un círculo con estrellas, y una pantalla de "Felicitaciones" con fuegos artificiales en colores de la marca; cierre con "Trivia + logo".

Qué mejorar respecto de esa referencia: allí casi no hay movimiento (cambios de pantalla directos). En Feller se suman el pollito, los huevos, la cuenta regresiva y transiciones suaves. Ojo con el contraste: en Feller el ✓ no puede ser rojo, porque el rojo es el color de la marca; el acierto va en verde o en blanco sobre rojo, y el error en gris (a definir con diseño).

---

## 7. Animaciones del pollito y los huevos (marca Feller)

### 7.1 Catálogo de animaciones
Combina lo que pidió Facundo: el **pollito** como personaje y los **huevos** de su trivia de referencia ("que se llene la pantalla de huevos", "que se rompa un huevo"). 

> **REGLA DE MARCA (aclarada por el cliente):** Feller vende pollitos ponedores, que de grandes ponen **huevos para comer**. Los huevos del juego son **huevos de consumo (alimento), no huevos de incubación**. **Prohibido**: que un pollito salga de un huevo, que un huevo se raje o abra para dejar salir un pollito, o cualquier imagen que sugiera un nacimiento desde el huevo. El pollito (personaje) y los huevos (producto) aparecen siempre **como elementos separados**.
>
> **REGLA DEL CIERRE:** el juego **felicita siempre** al jugador. No hay mensajes de "perdiste", ni ganadores, perdedores, premios o sorteos en pantalla. Solo cambia la intensidad del festejo según el puntaje.

| Momento | Animación propuesta | Duración | Técnica |
|---|---|---|---|
| Espera | Pollito "vivo": respira, parpadea, mira a los lados; cada tanto da un saltito. Algún huevo rueda suave por el fondo. | En bucle | SVG por partes |
| **3-2-1** | **Solo el pollito**: rebota con cada número, mira al jugador y en "¡A jugar!" abre las alas. Sin huevos. | 3-4 s | SVG por partes (o Lottie) |
| **Acierto** | **Lluvia de huevos** cayendo desde arriba y, **por separado**, 3 a 5 pollitos que **cruzan caminando** por abajo. Variante alternada: confeti en colores de la marca. | 1,5-2 s | Huevos: imágenes livianas movidas por código. Pollitos: SVG por partes. |
| **Error** | **Un huevo cae y se rompe** (como pidió Facundo), sin nada que salga de él. Al costado, el pollito reacciona amable (se lleva el ala a la cabeza, "¡Casi!"). | 1-1,5 s | Huevo: Lottie o secuencia de cuadros. Pollito: SVG por partes. |
| Sin tiempo | El reloj suena, el pollito se tapa los ojos con las alas. | 1 s | SVG por partes |
| **Final (4 de 5 o más)** | **Festejo grande**: "¡Felicitaciones, [nombre]!", la pantalla se llena de huevos que caen y rebotan, pollitos festejando con alas arriba, puntaje grande. | 3 s | Huevos por código + Lottie del festejo |
| **Final (menos de 4)** | **Festejo más suave**, también con "¡Felicitaciones, [nombre]!": el pollito aplaude, caen algunos huevos, puntaje y "¡Gracias por jugar!". | 2-3 s | SVG por partes o Lottie |

### 7.2 Cómo hacerlas livianas en Android
| Técnica | Qué es | A favor | En contra | Uso recomendado |
|---|---|---|---|---|
| **SVG animado por partes** | El pollito dibujado en vector con las partes separadas (cuerpo, alas, patas, ojos) y animado desde el código. | El más liviano (decenas de KB), nítido en cualquier tamaño, los colores se pueden cambiar. | Movimientos simples (saltos, aleteo, parpadeo, caminata básica). | **Pollito base**: espera, 3-2-1, error, caminata de acierto. |
| **Lottie** | Animación hecha en After Effects y exportada a un archivo que la app reproduce. | Calidad de animación profesional; la puede hacer el equipo de Experiencias Audiovisuales. | Hay que exportarla con cuidado (sin efectos pesados); algo más de peso. | **Piezas especiales**: huevo que se rompe y festejos finales. |
| **Sprites** (secuencia de cuadros) | Varias imágenes PNG/WebP del pollito en distintas posiciones, pasadas rápido como dibujo animado. | Funciona aunque solo tengamos dibujos en PNG. | Pesa más y se ve pixelado si se agranda. | **Plan B** si no hay vector. |
| Canvas / motor de juegos | Dibujar todo cuadro por cuadro con un motor de juegos. | Máxima libertad. | Excesivo para esto, más lento de hacer. | No se usa. |

Reglas para que vaya fluido en una tablet de gama media:
- Una sola animación "pesada" a la vez (por ejemplo, no confeti + caminata + Lottie juntos).
- Lluvia de huevos: hasta ~30 huevos en acierto y ~60 en el final; cada huevo es una imagen chica reutilizada, que solo se mueve y gira (lo más barato para la tablet).
- Cada archivo Lottie por debajo de ~300 KB; imágenes en WebP.
- Todo se carga al abrir la app (y queda dentro del APK), así no hay esperas ni hace falta internet.
- "Modo liviano" automático en equipos lentos: menos partículas, se mantiene el pollito.
- **Prueba obligatoria en la tablet real del evento** antes de cerrar.

### 7.3 Qué necesito del diseño
- **Ilustración oficial del pollito**, si existe en el manual de Feller: en vector (AI, SVG o PDF editable), **con las partes en capas separadas**: cabeza, cuerpo, ala izquierda, ala derecha, patas, ojos abiertos y cerrados, pico.
- **Poses** (si se dibujan aparte): parado, saltando, festejando con alas arriba, caminando (2 a 4 posiciones de patas), cabeza ladeada, saludando, sosteniendo un cartel.
- **Si no hay pollito oficial**, opciones en orden de preferencia:
  1. Lo dibuja **Mariano Bordon** siguiendo el manual de Feller, en capas, y **Feller lo aprueba** (crear una mascota es una decisión de marca).
  2. El equipo audiovisual lo anima en After Effects a partir de ese dibujo (para los Lottie).
  3. Último recurso: ilustración de banco de imágenes con licencia, adaptada a los colores de la marca, con aprobación del cliente.
- Mientras tanto, el prototipo usa un pollito provisorio.
- **Novedad**: el manual de marca de Feller que llegó **no incluye el pollito ilustrado**. Hay que pedírselo a Feller o encargarlo a Mariano (opción 1).

### 7.4 Assets que faltan (checklist)
| Asset | Estado | Qué hacer |
|---|---|---|
| Manual de marca de Feller (colores, usos del logo, tipografías, fotos) | ✅ Recibido (queda fuera del repo) | — |
| **Pollito en vector, por capas y poses** (7.3) | ❌ No está en el manual | Pedirlo a Feller; si no hay, lo dibuja Mariano y Feller lo aprueba. |
| **Huevo de consumo en vector**: entero y roto (cáscara partida + clara y yema). Nunca con un pollito adentro. | ❌ Falta | Lo dibuja Mariano en el mismo estilo del pollito. |
| **Logo en SVG** (versión positiva, negativa blanca y escala de grises) | ❓ Confirmar | Si solo hay PDF o PNG, pedir el original vectorial (AI/SVG/PDF editable). |
| **Tipografías con licencia para app** | ❌ Las dos del manual son comerciales | Pedir a Feller la licencia (que cubra "app" o "embebida"); si no la tiene, proponer alternativas gratuitas parecidas de Google Fonts y que Feller elija. |
| Sonidos (acierto, error, reloj, festejo) | Opcional | Banco de sonidos con licencia o producción propia del equipo audiovisual. |
| Fotos de marca para fondos (pollitos en granja) | Opcional | Del material de Feller, en alta resolución. |
| Preguntas validadas | 🟡 20 preguntas en la trivia de referencia | Que **Feller valide las cifras** (gramos de proteína, consumo anual, pesos, etc.) antes del evento. |

---

## 8. Formulario opcional y datos de los jugadores

### 8.1 Cómo se ve y funciona
- Tres campos, todos con la etiqueta "(opcional)": **Nombre**, **Mail**, **Teléfono**. Se puede jugar sin completar nada.
- Campos y botones grandes, pensados para el dedo, y que el teclado de la tablet no los tape.
- **Nombre**: hasta 30 letras. Es el que aparece en el ranking. Filtro básico de palabras ofensivas.
- **Mail con autocompletado** (pedido por Facundo):
  - Mientras se escribe la primera parte (por ejemplo, "juan"), aparecen botones con sugerencias completas: `juan@gmail.com`, `juan@hotmail.com`, `juan@outlook.com`, `juan@yahoo.com`. Un toque y queda escrito.
  - Al escribir la "@", aparecen los 4 dominios; si sigue escribiendo ("@ho"), queda solo el que coincide (hotmail.com).
  - Corrección de errores comunes: si escribe "gmial.com" o "hotmial.com", pregunta "¿Quisiste decir gmail.com?".
  - Se abre el teclado especial de mail (con la "@" a mano).
  - Si el mail quedó mal escrito, se avisa con suavidad y se puede corregir o dejar vacío; nunca impide jugar.
- **Teléfono**: teclado numérico, con ejemplo "Ej.: 351 555 1234". Solo se revisa que tenga una cantidad razonable de números.

### 8.2 Aviso y permiso (datos personales de terceros)
- Si deja **mail o teléfono**, aparece una casilla **sin tildar**: "Acepto que Feller me contacte con novedades y promociones. Ver aviso de privacidad." Si no la tilda, juega igual pero **no se guardan** su mail ni su teléfono.
- Debajo, un aviso de una línea: quién guarda los datos (Feller), para qué, cómo pedir que se borren; con un QR o link al texto completo.
- El texto final lo tiene que **aprobar Feller** (o su asesor legal). Se piden datos personales en Argentina (Ley 25.326 de protección de datos), así que conviene que Feller confirme si ya tiene registrada su base de contactos y su política de privacidad. **Esto no es asesoramiento legal**, es lo que hay que revisar.

### 8.3 Dónde se guardan y qué se hace con ellos
1. **En la tablet**, dentro de la app, apenas termina la partida (funciona sin internet).
2. Cuando hay conexión, **se envían solos** a la base de datos del estudio (Supabase), y se borran de la tablet una vez confirmados.
3. Solo se ven desde el **panel de administración, con usuario y contraseña**. Desde ahí se descarga la planilla (Excel/CSV) para entregarle a Feller.
4. En pantalla nunca se muestran mails ni teléfonos: el ranking muestra solo el nombre.
5. Se guardan hasta el fin de la campaña (o el plazo que defina Feller) y luego se borran. Se puede borrar a una persona puntual si lo pide.
6. **Nada de esto va al repo**: ni datos de jugadores, ni planillas exportadas.

---

## 9. Preguntas para Facundo

**Ya respondidas:**
1. ✅ **Dónde se juega:** en una tablet, una persona por vez.
2. ✅ **Datos y ranking:** nombre, mail y teléfono, los tres opcionales; mail con autocompletado de dominios comunes.
3. ✅ **Preguntas:** 5 por jugador, 3 opciones (algunas Verdadero/Falso), al azar de un banco (hoy 20).
4. ✅ **Tiempos:** 15 segundos por pregunta.
- ✅ **Tablet:** Samsung Galaxy Tab A9 (sección 11).
5. ✅ **Internet:** se juega **sin internet**.
6. ✅ **Idioma:** solo español. El cierre **felicita siempre**, sin premios en pantalla.

7. ✅ **Fecha y tablets:** el evento es **en noviembre** (día exacto a confirmar), con **2 tablets**; el juego se puede replicar. Ver el plan para noviembre en la sección 12.

**Contexto (antes de la respuesta):**
- **Fecha y cantidad de tablets:** ¿qué día es el evento y cuántas tablets se usan? Sugerencia: una sola Galaxy Tab A9, y tener el APK listo y probado en ella al menos una semana antes.

**Para qué se necesita la fecha** (en una línea, para pasarle a Facundo): *con la fecha armamos el calendario hacia atrás: el pollito aprobado por Feller unas 3 semanas antes, las preguntas validadas 2 semanas antes y la app final probada en la tablet 1 semana antes; como mínimo necesitamos unas 4 semanas desde que llega el dibujo del pollito.*

**Para qué se necesita la cantidad de tablets:** con una sola, el ranking y los datos quedan juntos en ese equipo; con dos o más, sin internet, cada tablet tiene su propio ranking y los datos se juntan después en el panel.

---

## 10. Qué necesito para empezar

**Ya llegó:** la trivia de referencia (20 preguntas y requisitos) y el manual de marca de Feller. **Falta:** el pollito ilustrado y los huevos (7.3 y 7.4), la licencia de tipografías, el logo en vector y la validación de las preguntas por parte de Feller. Para las preguntas nuevas o corregidas, usar la planilla de abajo (con 3 opciones, `opcion_d` queda vacía).

### 10.1 Preguntas: planilla propuesta
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

### 10.2 Manual de marca
- El **PDF del manual**.
- **Logos** en SVG (o PNG con fondo transparente, mínimo 2000 px): versión color, blanca y negra.
- **Colores** en código HEX (si el manual los tiene, alcanza).
- **Tipografías**: los archivos (.ttf/.otf/.woff2) **y confirmar que la licencia permite usarlas en una app**. Si no, elegimos una gratuita parecida.
- Opcional: fondos, íconos, mascota, video/animación de marca, sonido o jingle.

### 10.3 Cómo enviarlo
Por una **carpeta de Drive** compartida (no al repo). En el repo solo quedan ejemplos inventados, salvo que Facundo autorice otra cosa.

### 10.4 Accesos
- Que Javier confirme dónde está el proyecto de **Supabase** de esta trivia (o creamos uno nuevo en la cuenta del estudio) y qué código corre en **`trivia-evento`** de Vercel.

---

## 11. Tablet del evento: Samsung Galaxy Tab A9

### 11.1 Datos del equipo
Fuentes: fichas técnicas públicas (GSMArena y otras). No pude comprobarlo en el equipo ni en la página oficial de Samsung.

| Dato | Valor | Qué significa para el juego |
|---|---|---|
| Pantalla | 8,7" LCD, **1340 × 800**, 60 Hz | Pantalla chica de tablet: textos y botones grandes. Se diseña **vertical** (como la referencia Nexo); 60 Hz = la meta es animación fluida a 60 cuadros por segundo. |
| Procesador | MediaTek Helio G99 (gama media, 2022) | Alcanza para todo lo de la sección 7 si se respetan las reglas de 7.2. |
| Memoria | 4 u 8 GB de RAM (según versión); 64/128 GB | Hay que probar en la versión de **4 GB** (el peor caso). El APK va a pesar pocos MB. |
| Android | Salió con Android 13; según GSMArena se actualiza hasta Android 16 | El APK (Capacitor) funciona desde Android 6 en adelante: **no hay problema de versión**. |
| Batería | 5100 mAh | Para un día de stand: **dejarla enchufada** y con "pantalla siempre encendida" dentro de la app. |

### 11.2 Requisitos y preparación de la tablet
- **Orientación**: vertical fija (la app no gira).
- **Antes del evento** (con wifi): actualizar Android y, sobre todo, la app **"Android System WebView"** desde Play Store. El juego se dibuja con ese componente; una versión vieja puede trabar animaciones.
- **Instalación**: copiar el APK y permitir "instalar apps desconocidas" (no hace falta Play Store).
- **Modo stand**: brillo alto fijo, sonido a volumen medio, "fijar pantalla" activado, notificaciones silenciadas, ahorro de batería apagado.
- **Rendimiento**: medir en la tablet real (con las herramientas de desarrollador de Android) que el acierto, el error y el final no bajen de ~50 cuadros por segundo. Si bajan, se activa el "modo liviano" (menos huevos, sin confeti) sin cambiar el diseño.
- **Prueba final**: 30 partidas seguidas sin reiniciar, para descartar que se ponga lenta con el uso.

---

## 12. Plan para noviembre (2 tablets, sin internet)

Datos de Facundo: **evento en noviembre, 2 tablets**, el juego se puede replicar. Hoy es viernes 23/10: quedan **entre 2 y 5 semanas** según el día exacto.

### 12.1 Cómo funcionan las 2 tablets
- Las dos tienen **la misma app instalada** (mismo APK), con las mismas preguntas y la misma marca.
- Funcionan **solas, sin internet** y sin conectarse entre sí. **Cada una tiene su propio ranking del día.**
- Los datos (nombre, mail y teléfono de quien dio permiso, puntaje, fecha y hora, número de tablet) quedan guardados en cada tablet.
- **Cómo se juntan**: desde el menú oculto del operador, cada tablet **genera una planilla** (CSV, se abre con Excel). Se pasa por cable USB o, cuando haya wifi, por mail o Drive. Las dos planillas se unen en una sola, y la planilla dice de qué tablet viene cada fila.
- El envío automático a una base de datos y un panel web quedan como **extra** del escenario B (12.4). En el escenario A no hacen falta.
- Si se quiere replicar el juego en más tablets, se instala el mismo APK: no cambia nada.

### 12.2 ¿Reutilizar el repo de Javier o empezar limpio?
**Recomendación: empezar un proyecto limpio**, dentro de este mismo repositorio en una carpeta nueva, y dejar el código de Javier como referencia.
- Lo de Javier está pensado para jugar **en vivo con internet** (servidor, base de datos, presentador). Lo de noviembre es lo contrario: **una app que funciona sola en la tablet, sin internet**. Para adaptarlo habría que desarmar casi todo.
- Además hoy no compila y tiene problemas de seguridad (sección 1). Arreglarlo cuesta días que no tenemos y no suma al juego de la tablet.
- Un proyecto limpio y chico (React + Capacitor, la misma tecnología web) se arma rápido y va directo al APK. **Ya verifiqué que el APK se puede generar desde acá.**
- Del repo de Javier se aprovechan las ideas: tema por cliente, importar preguntas desde planilla y modelo de datos (para cuando se sume el panel).

### 12.3 Orden de trabajo (etapas cortas)
| Etapa | Entrega | Fecha objetivo | Cómo se prueba |
|---|---|---|---|
| **1. Juego completo** | Pantalla de espera, datos opcionales con autocompletado de mail, 3-2-1, **5 preguntas al azar, 15 s, 3 opciones**, **una animación por momento** (hecha en código), marca Feller (colores, logo, tipografía provisoria), final **siempre con felicitación**, ranking del día, menú del operador con planilla. Con las 20 preguntas de referencia y un **pollito provisorio**. | **viernes 30/10** | Link para jugar en el celular **y APK de prueba** para instalar en la Tab A9 que tiene Facundo. |
| **2. Marca definitiva** | Pollito y huevos dibujados por Mariano y aprobados por Feller, preguntas con cifras validadas, aviso de privacidad aprobado, sonidos, ajustes de lo que Facundo marque. | **viernes 6/11** | APK nuevo en la Tab A9: prueba de fluidez y de las 30 partidas. |
| **3. Versión final** | APK firmado, instalado en **las 2 tablets**, ensayo general y prueba de la planilla de datos. | **lunes 9/11** (escenario A) o una semana antes del evento (B) | Ensayo con las 2 tablets como en el stand. |
| 4. Extras (solo B) | Ver 12.4. | antes del 20/11 | — |

### 12.4 Dos escenarios
| | **A: evento en la 1.ª quincena (≈ 2-3 semanas)** | **B: evento en la 2.ª quincena (≈ 4-5 semanas)** |
|---|---|---|
| **Entra** | Etapas 1, 2 y 3: juego completo, marca Feller, pollito y huevos, animaciones de cada momento, 2 tablets, planilla de datos. | Todo lo de A, más: festejos más elaborados en **Lottie** (equipo audiovisual), **tipografías originales** si llega la licencia, **envío automático** de datos a una base y **panel web** para ver y descargar, más variantes de animación para que no se repita, video de atracción en la pantalla de espera. |
| **Se recorta** | Pollito dibujado por **Mariano** (sin esperar que Feller mande uno; Feller solo aprueba). **Tipografías gratuitas parecidas** (Google Fonts) en vez de esperar licencias. Animaciones **simples hechas en código**, sin Lottie. Datos por **planilla manual** desde cada tablet, sin panel web ni envío automático. | Casi nada; solo lo que no llegue a aprobarse a tiempo. |
| **Fecha límite para "congelar" la app** | 3 días antes del evento | 1 semana antes del evento |

**Lo que NO se recorta en ningún escenario:**
1. **Probar en la Galaxy Tab A9 real** (y en las 2 tablets antes del evento): fluidez y 30 partidas seguidas.
2. **Que Feller valide las cifras de las preguntas** (gramos de proteína, consumo anual, pesos, etc.).
3. **Aviso de privacidad y casilla de permiso** para mail y teléfono, con texto aprobado por Feller.
4. **Regla de marca**: huevos de consumo, nunca un pollito saliendo de un huevo, cierre siempre con felicitación y sin premios.
5. **APK firmado y la llave de firma guardada a salvo** (fuera del repo), con copia del APK por si hay que reinstalar en el stand.

### 12.5 Qué necesito de Facundo esta semana
| Para cuándo | Qué | Por qué |
|---|---|---|
| **lunes 26/10** | **Día exacto del evento** (o al menos la quincena). | Define el escenario A o B. Mientras tanto se trabaja como si fuera A (el más corto). |
| **lunes 26/10** | **OK para que Mariano dibuje el pollito y el huevo** ya, y avisar a Feller que lo va a aprobar. Si Feller tiene un pollito propio, que lo mande ese mismo día. | Es lo que más tarda; el resto avanza en paralelo. Boceto el miércoles 28/10 y aprobación de Feller el viernes 30/10. |
| **martes 27/10** | Pedir a Feller el **logo en vector** (AI, SVG o PDF editable). | Para que se vea nítido en la tablet. |
| **martes 27/10** | Decidir **tipografías**: ¿Feller tiene licencia para app? Si no hay respuesta ese día, se usan alternativas gratuitas parecidas. | Evita frenar el diseño. |
| **miércoles 28/10** | Mandarle a Feller **las 20 preguntas para validar cifras** y el **texto del aviso de privacidad** para aprobar. Respuesta antes del **martes 3/11**. | Son las dos cosas que no se recortan y dependen del cliente. |
| **viernes 30/10** | **Instalar el APK de prueba en la Tab A9** (o mandarme quién la tiene) y jugar 5 partidas. | Primera prueba de fluidez en el equipo real. |

**Datos del cliente**: preguntas, logos y manual no se suben al repo. Para armar el APK se cargan desde una carpeta excluida del repo, y el APK se comparte en forma privada (Drive).
