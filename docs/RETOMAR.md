# Retomar la trivia de Feller

Guía para seguir el trabajo en otra sesión o en otra compu, sin depender de lo que quedó en la sesión anterior.

- **Rama:** `claude/plan-trivia` (nunca `main`, sin PR).
- **Plan completo y decisiones:** `docs/plan-trivia.md`.
- **Código del juego:** carpeta `tablet/`.
- **Versión entregada:** APK `trivia-feller-v0.11.apk` (versionName 0.11, versionCode 11). La vista web publicada coincide con ese APK.

---

## 1. Qué está hecho

| Tema | Estado |
|---|---|
| **Juego** | Una persona por tablet: portada → datos opcionales (nombre, mail con sugerencias de dominio, teléfono y casilla de permiso) → cuenta 3-2-1 → **5 preguntas al azar** del banco, **15 s**, 3 opciones (o V/F) → acierto / error → **felicitación siempre** (sin premios ni "perdiste") → ranking del día → vuelve sola al inicio a los 30 s sin tocar. |
| **Marca Feller** | Rojo #ED3237, gris #727376, blanco; logo; foto de pollitos en la portada; banda roja inclinada; tipografías Saira (original, libre) y Fira Sans (en lugar de Centrale Sans, que es paga). |
| **Portada** | Variante A elegida por Facundo (logo grande arriba, foto en banda inclinada, «Trivia» chico junto al botón). La B se elige en el menú del operador → Marca. |
| **Pollito** | Dibujado en código (SVG por capas) con los colores de la foto de la web. Frente: quieto, saltitos, picotea, sorprendido, inclina la cabeza. Perfil: camina. **No vuela ni aletea.** |
| **Animaciones** | Acierto: manada de 8 pollitos de perfil caminando de izquierda a derecha + banda que barre. Error: pollito sorprendido + «¡Casi!» (alternativa: pollito tímido). Final: manada de 10 + papel picado. **Sin huevos** (regla de marca: los huevos son de consumo, nunca nace un pollito de un huevo). |
| **Sonido** | Propio, generado por código (sin archivos ni licencias). Tic 3-2-1, arranque, campanita + «pío», error suave, festejo, toque en botones. Respaldo con audio HTML si el navegador bloquea Web Audio. Volumen 0-100, silencio y música opcional en el menú. Facundo confirmó que se escucha en iPhone. |
| **Pantallas** | Se adaptan a cualquier tamaño (verificado en 360×640, 390×844, 412×915, 800×1280 y acostado 640×360 / 844×390). |
| **Datos** | Se guardan en la tablet (sin internet). Planilla CSV desde el menú → Partidas → «Exportar ahora» (abre Compartir y queda en Documentos). Copia automática después de cada partida en `Documentos/Trivia/`. Aviso de partidas sin exportar. |
| **Menú del operador** | Mantener apretado el logo 3 s + PIN (de fábrica `1234`): partidas, preguntas (planilla CSV), marca, pollito, ajustes, sonido, copiar configuración a la otra tablet. |
| **Escenas fijas** | Agregar `#escenas` al final del enlace de la web: todas las pantallas para aprobar diseño. |
| **Vista web** | https://claude.ai/artifact/QHtrbnVFozP9e5mc5DybK7 (privada, cuenta grupomanso). |

---

## 2. El pack de cliente (Feller)

Todo lo del cliente vive en **`tablet/packs/feller/`**, que está **excluida del repositorio** (`.gitignore`). El juego solo lee ese pack; un cliente nuevo es un pack nuevo.

```
tablet/packs/feller/
├── pack.json        marca, colores, tipografías, pollito, textos y ajustes
├── preguntas.csv    las 20 preguntas (columnas: id, pregunta, opcion_a, opcion_b, opcion_c, correcta, tipo, tiempo_seg, activa)
└── assets/
    ├── logo.png            logo a color (fondos claros)
    ├── logo-negativo.png   logo en blanco (fondo rojo)
    ├── hero-pollitos.png   foto de portada A
    ├── hero-mano.png       foto de portada B
    └── banda-pollitos.png  foto de reserva
```

En `pack.json` las imágenes se nombran como `"asset:logo.png"`.

**Copia del pack:** artifact privado de la cuenta grupomanso: https://claude.ai/artifact/L1mBYbUfjfXcZM11tSuERE. Para recuperarlo en una sesión nueva, leer ese artifact con la herramienta Artifact (`action: read`, con `path` para cada archivo) y guardarlo en `tablet/packs/feller/`.

**De dónde salió cada cosa:**
- Logos (alta calidad, extraídos del manual de marca): artifact https://claude.ai/artifact/DNnWvFNLTkqf8AScCWgNf6 (`feller_logo_color.png`, `feller_logo_blanco.png`) y el mismo lugar tiene `preguntas_feller.csv`.
- Fotos: web pública de Feller, `https://feller.com.ar/wp-content/uploads/2020/03/03.pollitosmedio.png`, `.../5.mano_.png`, `.../07.polllitos-cercaperformance2.png` (bajan con un navegador o `curl` con user-agent de Chrome).
- Colores y tipografías: manual de marca de Feller (lo tiene Facundo).
- Preguntas: enviadas por Feller a Facundo, ya aprobadas.

---

## 3. Cómo compilar

### Requisitos
- **Node.js 22** y npm.
- **JDK 21** (Java).
- **Android SDK** con `platform-tools`, `platforms;android-35` y `build-tools;35.0.0`. No hace falta Android Studio.

Instalar el SDK sin Android Studio (Linux):
```bash
mkdir -p ~/android-sdk/cmdline-tools && cd ~/android-sdk
curl -o clt.zip https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip
unzip -q clt.zip -d cmdline-tools && mv cmdline-tools/cmdline-tools cmdline-tools/latest
export ANDROID_HOME=~/android-sdk
yes | cmdline-tools/latest/bin/sdkmanager --licenses
cmdline-tools/latest/bin/sdkmanager "platform-tools" "platforms;android-35" "build-tools;35.0.0"
```

### Pasos
```bash
cd tablet
npm ci                      # dependencias
# copiar el pack de Feller a tablet/packs/feller/ (sección 2)
npm test                    # pruebas
npm run build               # genera dist/ (web)
npx cap sync android        # copia la web al proyecto Android
echo "sdk.dir=$ANDROID_HOME" > android/local.properties
cd android && ./gradlew assembleDebug --max-workers=1
# APK: tablet/android/app/build/outputs/apk/debug/app-debug.apk
```
- Antes de cada versión nueva, subir `versionCode` y `versionName` en `tablet/android/app/build.gradle`.
- Si Gradle falla con **error 429** (Maven Central rechaza por exceso de pedidos), esperar un minuto y repetir: los archivos ya bajados quedan guardados.
- Sin el pack, el juego compila igual con la marca de demostración.

### Publicar la vista web
El contenido de `tablet/dist/` se publica como artifact con la herramienta Artifact: una página con `<link>` al CSS y `<script type="module">` al JS principal (los nombres están en `dist/index.html`) y el resto de `dist/assets/` en `files`, actualizando la URL de la sección 1.

---

## 4. Llave de firma (importante)

- Todas las versiones hasta la 0.11 están firmadas con la **llave de prueba** que Android genera sola (`~/.android/debug.keystore`, en la sesión anterior). Esa llave **no está guardada en ningún lado**.
- Una versión nueva firmada con **otra** llave no se puede instalar encima: hay que **desinstalar** la app, y eso **borra las partidas guardadas**. Por eso, **exportar la planilla antes de cualquier actualización**.
- **Antes del evento:** crear una llave de firma fija (release), guardarla en dos lugares seguros (nunca en el repo) y firmar con ella la versión final. Decisión pendiente de Facundo: dónde se guarda.

---

## 5. Pendientes e ideas

**Para el evento (Feller):**
1. **Probar en la Galaxy Tab A9 real** (las 2 tablets): fluidez, 30 partidas seguidas en modo avión, sonido, exportar planilla, copia automática en `Documentos/Trivia/` (no verificada en un equipo real).
2. **Llave de firma fija** (sección 4) y APK final firmado con ella.
3. Poner «Tablet 2» en Ajustes de la segunda tablet, y practicar unir las dos planillas.
4. Aviso de privacidad: el texto provisorio se muestra a Feller con la demo; cargar el definitivo desde el menú → Marca.
5. Fecha del evento: a confirmar (se habló del 02/11/2026).
6. Subir el APK a la carpeta privada de Drive «Trivia Feller / APK» (https://drive.google.com/drive/folders/1RsidE8HbsvabH0MAwxopqxHp-bi4uQRA): desde la sesión no se pudo (el archivo es muy grande para la conexión con Drive); hacerlo a mano.

**Después del evento:**
- **Fase 2: Playapp Trivia como producto** (sección 13 de `docs/plan-trivia.md`): motor + packs, web instalable para PC y TV táctil, APK automático, panel web.
- Tipografía Centrale Sans original si Feller tiene licencia para app.
- Pollito definitivo si Feller aprueba un diseño propio (el actual se cambia por colores y proporciones desde el menú → Pollito).
- Envío automático de partidas a una base de datos cuando haya internet.
