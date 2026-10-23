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
| **Primera entrega propuesta** | Lámina del pollito (sáb 24/10) y link web jugable (dom 25/10); APK en la Tab A9 el lun 26/10. Evento: **02/11** (plan de 10 días, sección 12). |
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

> **Actualización:** el evento es el **02/11/2026**; el plan vigente es el de 10 días de la **sección 12**. Esta sección queda como referencia del plan completo (sin apuro).

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
- **Decisión final (evento 02/11)**: el manual no trae el pollito y Mariano no lo va a dibujar. **Lo dibujo yo en SVG por capas** y Feller lo aprueba con una lámina (sección 12.1). Las opciones de arriba quedan como referencia.

### 7.4 Assets que faltan (checklist)
| Asset | Estado | Qué hacer |
|---|---|---|
| Manual de marca de Feller (colores, usos del logo, tipografías, fotos) | ✅ Recibido (queda fuera del repo) | — |
| **Pollito en vector, por capas y poses** (7.3) | ❌ No existe | **Lo dibujo yo en SVG por capas** (12.1); Feller lo aprueba con una lámina. |
| **Huevo de consumo en vector**: entero y roto (cáscara partida + clara y yema). Nunca con un pollito adentro. | ❌ Falta | Lo dibujo yo en SVG, en el mismo estilo del pollito. |
| **Logo en SVG** (versión positiva, negativa blanca y escala de grises) | ❓ Confirmar | Si solo hay PDF o PNG, pedir el original vectorial (AI/SVG/PDF editable). |
| **Tipografías** | ✅ Resuelto (12.1) | Saira es gratuita (SIL OFL): se usa la original. Centrale Sans es comercial: se reemplaza por Fira Sans (SIL OFL). La original queda como mejora posterior. |
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

7. ✅ **Fecha y tablets:** el evento es el **lunes 02/11/2026**, con **2 tablets**; el juego se puede replicar. Plan de 10 días en la sección 12.

Antes se había estimado un mínimo de 4 semanas desde que llegara el dibujo del pollito. Con el evento el 02/11 el calendario se achica (sección 12): el pollito lo dibujo yo en SVG y Feller lo aprueba con una lámina. Lo que tiene que llegar del cliente: el logo, la validación de las preguntas y la aprobación del aviso de privacidad.


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

## 12. Plan de 10 días (evento: lunes 02/11/2026)

> Reemplaza los escenarios A/B anteriores. Datos de Facundo: evento el **02/11**, **2 tablets** Galaxy Tab A9, **sin internet**. El pollito **no existe en vector y no lo dibuja Mariano**: lo dibujo yo en código. **No se escribe código del juego hasta tener el OK de Facundo.**

### 12.1 Decisiones
- **Proyecto limpio** en una carpeta nueva de este repo (`tablet/`), con React + Framer Motion + Capacitor. Es la ruta más corta y segura: el juego vive entero en la tablet, sin servidor ni base de datos. **Del repo de Javier no se reutiliza código**, solo ideas: tema por cliente con colores en variables, importar preguntas desde planilla, modelo pregunta/opciones/correcta. Lo de Javier queda intacto como referencia.
- **Pollito propio en SVG por capas** (cuerpo, ala izquierda y derecha, ojos, pico, patas, cresta), estilo simple y amable, amarillo, con detalles en la paleta de Feller. **Poses**: quieto (respira y parpadea), camina, festeja, sorprendido y saluda. Se anima con Framer Motion y CSS. **Nunca sale de un huevo.**
  - **Cambio barato**: colores, proporciones (cabeza, ojos, pico) y grosor de línea quedan como valores sueltos de un solo archivo. Ajustar según lo que diga Feller lleva minutos, no días.
  - Para aprobar: **una sola lámina (imagen PNG)** con las 5 poses y el pollito junto al logo, que Facundo le pasa a Feller.
- **Tipografías** (licencias verificadas en fuentes públicas):
  - **Saira** es **gratuita y libre** (licencia SIL Open Font License, está en Google Fonts): **se usa la original**. Corrección de lo dicho antes: no era comercial.
  - **Centrale Sans** es comercial (Typedepot). Se reemplaza por **Fira Sans** (también SIL OFL, en Google Fonts), del mismo estilo: humanista, letra alta y abierta. Alternativa: Source Sans 3 (OFL). Cambiarla por la original queda como **mejora posterior** si Feller tiene licencia para app.
  - Las fuentes van dentro del APK con su archivo de licencia, como pide la OFL.
- **Panel simple dentro de la app** (menú oculto del operador, con PIN), porque no hay internet:
  - **Preguntas**: importar la planilla (CSV) desde la tablet, activar o desactivar preguntas.
  - **Marca**: colores con selector y vista previa; logo (imagen desde la tablet).
  - **Datos**: exportar ranking y datos a **planilla CSV** (se abre con Excel); borrar el ranking del día.
  - **Replicar**: exportar e importar la configuración, para dejar las 2 tablets iguales en un paso.
- **Valores de fábrica**: el APK sale con preguntas y marca precargadas desde una carpeta **excluida del repo** (en el repo solo hay datos de ejemplo inventados). El APK se comparte en privado (Drive).

### 12.2 Alcance mínimo (lo que entra sí o sí)
Espera → datos opcionales con autocompletado de mail y casilla de permiso → 3-2-1 con el pollito → **5 preguntas al azar, 15 s, 3 opciones** → acierto o error con animación → **felicitación siempre** ("¡Felicitaciones, [nombre]!") con puntaje → ranking del día de esa tablet → **vuelve sola al inicio a los 30 s** sin tocar. Panel del operador (12.1), CSV, funciona sin internet, 2 tablets con el mismo APK.

**Fuera del alcance para el 02/11** (mejoras después del evento): festejos en Lottie, tipografía Centrale Sans original, envío automático a una base de datos y panel web, más variantes de animación, video de atracción.

### 12.3 Día por día
| Día | Trabajo | Entrega para probar |
|---|---|---|
| **vie 23/10** | Plan (este documento). Esperar el OK de Facundo. | — |
| **sáb 24/10** | Proyecto limpio; las pantallas del recorrido sin animaciones; tema configurable; **pollito SVG v1 + lámina**. | **Lámina del pollito** → Facundo se la pasa a Feller. |
| **dom 25/10** | Lógica del juego (5 al azar, 15 s, 3 opciones, puntaje, felicitación, ranking local, reinicio a los 30 s); formulario con autocompletado y casilla de permiso. | **Link web jugable** en el celular (sin animaciones finas). |
| **lun 26/10** | Animaciones: pollito en el 3-2-1; acierto (lluvia de huevos + pollitos caminando, por separado); error (huevo que se rompe, pollito sorprendido al lado); festejo final; espera. Marca Feller y tipografías. | **APK de prueba #1** en una Tab A9. |
| **mar 27/10** | Panel del operador (preguntas, colores, logo, CSV, replicar). Aplicar los cambios de Feller al pollito. Cargar las preguntas validadas. | **APK #2**. |
| **mié 28/10** | Aviso de privacidad aprobado, sonidos, "modo liviano", pulido y corrección de lo que marque Facundo. | **APK #3 = candidato final**. |
| **jue 29/10** | **Facundo prueba en las 2 Tab A9** (12.4). Corrijo lo que aparezca. **Al final del día se congelan las funciones**: después solo se arreglan errores. | Informe de prueba de Facundo. |
| **vie 30/10** | Solo errores. **APK final firmado.** Copia en Drive. | **APK final**. |
| **sáb 31/10** | Instalación en las 2 tablets, ensayo general, prueba de la planilla CSV. | Tablets listas. |
| **dom 01/11** | Reserva: sin cambios salvo algo urgente. Tablets cargadas y en modo stand (11.2). | — |
| **lun 02/11** | **Evento.** Al cerrar, exportar el CSV de cada tablet y unir las dos planillas. | Planilla con los datos. |

### 12.4 Prueba en la Galaxy Tab A9 (no se recorta)
- **Cuándo**: APK #1 el **lunes 26** en al menos una tablet; prueba completa en **las 2 tablets el jueves 29/10** (fecha límite).
- **Cómo**: en modo avión (sin internet), **30 partidas seguidas sin reiniciar**, con y sin datos, con aciertos, errores y tiempos agotados.
- **Aprueba si**: no se cierra ni se traba; animaciones fluidas a simple vista (sin saltos en la lluvia de huevos ni en el festejo); vuelve sola al inicio a los 30 s; el autocompletado de mail funciona con el teclado Samsung; el CSV se abre bien en Excel con nombre, mail, teléfono y puntaje; la app no gira y la pantalla no se apaga.
- Si algo va lento, se activa el "modo liviano" (menos huevos, sin confeti) sin cambiar el diseño.

### 12.5 No se recorta
1. Prueba en la Tab A9 real (12.4).
2. **Cifras de las preguntas validadas por Feller** (antes del martes 27).
3. **Aviso de privacidad y casilla de permiso**, con el texto aprobado por Feller.
4. **Regla de marca**: huevos de consumo, nunca un pollito saliendo de un huevo, felicitación siempre, sin premios.
5. APK firmado, con la llave de firma fuera del repo y copia del APK para reinstalar en el stand.

### 12.6 Riesgos
- **Pollito hecho en código**: se ve más simple que una ilustración profesional. Se mitiga con estilo plano y amable, y con ajustes rápidos según Feller.
- **Feller tarda en aprobar** (pollito, preguntas, aviso): si el martes 27 no hay respuesta, se sigue con lo que hay y se cambia hasta el jueves 29.
- **Tablets no disponibles para probar**: sin probar en el equipo real no se puede asegurar la fluidez.

### 12.7 Qué necesito de Facundo en las próximas 48 h (hasta el domingo 25/10)
| # | Pedido | Sugerencia lista para un "sí" |
|---|---|---|
| 1 | **OK para arrancar** con esta ruta. | Sí: proyecto limpio, pollito dibujado por mí en SVG, Saira original + Fira Sans en lugar de Centrale Sans, panel dentro de la app. |
| 2 | **Tablets para probar.** | Sí: tengo las 2 Tab A9; instalo el APK en una el lunes 26 y pruebo las dos el jueves 29. |
| 3 | **Validación de preguntas.** | Sí: mando hoy o mañana las 20 preguntas a Feller y pido respuesta para el martes 27. |
| 4 | **Aviso de privacidad.** | Sí: usá un texto base corto; se lo paso a Feller junto con las preguntas y lo aprueba el martes 27. |
| 5 | **Logo.** | Sí: compartí la carpeta de Drive con el manual y el logo (o el PDF del manual) para que lo saque de ahí; si Feller manda el vector, se reemplaza. |
| 6 | **Aprobación del pollito.** | Sí: le paso a Feller la lámina el sábado 24 o el domingo 25 y pido respuesta para el martes 27. |

---

## 13. Fase 2: Playapp Trivia como producto

> Para después del evento de Feller. No frena esa entrega. Lo que ya quedó listo en la versión de Feller: el juego (el "motor") lee **todo lo del cliente desde un único pack** (`packs/<cliente>/`: `pack.json` con marca, colores, tipografías, pollito, textos y ajustes; `preguntas.csv`; carpeta `assets/` con logos y fotos). Feller es el pack n.º 1. Un cliente nuevo es un pack nuevo, sin tocar el motor.

### 13.1 Arquitectura recomendada
- **Un motor, muchos packs.** El motor es el juego que ya existe (`tablet/`). Cada cliente aporta su pack. Las escenas (espera, datos, 3-2-1, pregunta, acierto, error, felicitación, ranking) son las mismas; cambian la marca, el personaje, los textos y los tiempos.
- **Tres salidas desde el mismo pack:**
  1. **Web instalable (PWA)** para PC con TV táctil o kiosco: se abre en Chrome en pantalla completa y queda instalada como app. Funciona sin internet una vez instalada. Es la opción más barata y la primera que conviene.
  2. **APK Android** con Capacitor (lo que ya se usa para Feller).
  3. **Instalable de escritorio** (Windows) con Electron o Tauri: solo si un cliente necesita que no se vea el navegador o que arranque solo al prender la PC. Se puede postergar: la PWA en modo kiosco de Chrome cubre casi todos los casos.
- **El personaje** también va en el pack: hoy es el pollito dibujado en código y con colores configurables; para otros clientes se suma un "personaje por defecto" o se reemplaza por ilustraciones del cliente (por capas, mismo esquema de poses).

### 13.2 Panel web
- **Quién carga:** recomendado empezar con que **lo carga Manso** (equipo de Comunicación 360°) y el cliente solo revisa y aprueba. El autoservicio del cliente viene después, cuando el panel esté probado.
- **Qué tiene:** clientes y juegos; editor de marca con vista previa en vivo (colores, logo, tipografía, personaje); carga de preguntas por planilla; textos y aviso de privacidad; botón **"Exportar"** (web, APK); y una página con las escenas fijas para que el cliente apruebe (como `#escenas` de hoy).
- **Roles:** administrador de Manso (todo), editor de Manso (sus clientes), cliente (ver y aprobar; más adelante, editar sus preguntas).
- **Base de datos y archivos:** Supabase (el estudio ya lo usa): tablas de clientes, juegos, packs (versionados), usuarios y partidas sincronizadas; almacenamiento de logos y fotos en Supabase Storage. Un pack exportado es un archivo `.zip` (JSON + assets) que también sirve para respaldo.
- **Exportación automática:**
  - **Web/PWA:** totalmente automatizable: el panel genera el pack, un proceso de compilación (GitHub Actions o Vercel) arma la web y la publica en una dirección del cliente.
  - **APK:** automatizable con GitHub Actions (compila con el pack y entrega el archivo). Lo que **no** conviene automatizar sin cuidado es la **firma** del APK final: la llave de firma tiene que guardarse como secreto del sistema de compilación, con copia de seguridad fuera de él. Publicar en Google Play sigue siendo manual (revisión de Google).
  - **Escritorio (Windows):** automatizable, pero el instalador sin firma digital muestra advertencias; firmar cuesta dinero por año.
- **Partidas y datos:** cada dispositivo sigue funcionando sin internet; cuando hay conexión, envía las partidas al panel. El cliente descarga su planilla desde ahí.

### 13.3 Qué se reutiliza del trabajo de Javier (ideas, no código)
- Modelo de datos cliente → juego → preguntas → jugadores → respuestas, y temas por cliente.
- Importar preguntas desde planilla.
- **Modo en vivo** (presentador + pantalla grande + celulares por QR): sirve como segundo producto para eventos con público. Se rehace sobre el motor nuevo cuando haya demanda.
- No se reutiliza su código: hoy no compila, su base de datos no se puede crear tal cual y tiene problemas de seguridad (sección 1).

### 13.4 Costos y riesgos
- **Costos fijos estimados:** Supabase y Vercel tienen planes gratuitos que alcanzan para empezar; con varios clientes, planes pagos de alrededor de USD 20-25 por mes cada uno. Cuenta de Google Play: USD 25 una sola vez (solo si se publica en la tienda). Firma de instalador de Windows: pago anual (solo si se hace la versión de escritorio). *Precios de referencia; confirmarlos al contratar.*
- **Firma del APK:** si se pierde la llave, no se pueden actualizar las apps instaladas. Guardarla en dos lugares seguros.
- **Licencias de tipografías:** muchas fuentes de marca no permiten usarse dentro de apps. Regla del producto: usar la fuente del cliente solo con licencia para app; si no, una gratuita parecida (como con Feller).
- **Datos de jugadores:** son datos personales de terceros. El cliente es el responsable de la base; Manso la procesa. Hace falta un texto de consentimiento aprobado por cada cliente, guardar solo lo necesario, plazo de borrado y acceso con usuario y contraseña. No es asesoramiento legal: conviene una revisión legal única para el modelo de producto.
- **Rendimiento:** cada personaje o animación nueva se prueba en una tablet de gama media antes de venderla.

### 13.5 Plan por etapas (una persona, estimado)
| Etapa | Qué incluye | Esfuerzo |
|---|---|---|
| 1. Motor prolijo | Ordenar el código de Feller como motor: packs con formato fijo y validado, personaje intercambiable, documentación del pack. | 1 semana |
| 2. Web instalable (PWA) | Salida web instalable y sin internet para PC y TV táctil, modo kiosco. | 3-5 días |
| 3. Exportación automática | Compilación automática web + APK desde un pack (GitHub Actions), con firma segura. | 1 semana |
| 4. Panel web (uso interno de Manso) | Clientes, editor de marca con vista previa, preguntas, escenas para aprobar, botón Exportar, partidas sincronizadas. | 3-4 semanas |
| 5. Autoservicio del cliente | Acceso del cliente para editar preguntas y descargar sus datos. | 2 semanas |
| 6. Escritorio (opcional) | Instalable de Windows, solo si un cliente lo pide. | 1 semana |

Total para vender el producto con panel interno (etapas 1 a 4): **unas 6 a 8 semanas** de una persona. *Estimación; se ajusta después de la etapa 1.*

### 13.6 Decisiones para Facundo
1. **¿Primero panel interno (lo usa Manso) y después autoservicio del cliente?** *Sugerencia: sí.*
2. **¿La salida para PC y TV táctil arranca como web instalable (PWA) y el instalable de Windows queda solo para quien lo pida?** *Sugerencia: sí.*
3. **¿Seguimos con Supabase + Vercel (lo que ya usa el estudio) para el panel y las exportaciones?** *Sugerencia: sí.*
