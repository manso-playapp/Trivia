# Trivia Feller — cómo rearmar la APK

Estado al cierre de la sesión (31/10/2026): app "Trivia del Pollito" con los ajustes del PDF de correcciones.
La app web ya compilada está en `preview/pollito/assets/` (`index-CQe1EuY2.js` y `index-B_pW4tvJ.css`).
Es también el contenido del artefacto "Trivia del Pollito" (claude.ai) y de la APK `trivia-feller-v0.12.apk`.

## Qué falta (lo manda el cliente)
- Foto de portada (persona sosteniendo un huevo): reemplaza `assets/public/assets/hero-mano-*.png` / `hero-pollitos-*.png`
  de la APK (la portada usa `attractLayout:"a"` → `hero-pollitos`). La solapa "Marca" se sacó del panel de operador.
- Preguntas definitivas (más cortas, algunas visuales, con explicación): hoy son 20 preguntas del pack, embebidas en el
  bundle como CSV (constante con encabezado `id,pregunta,opcion_a,...`). Columna opcional `explicacion`.
  También se pueden cargar a mano desde Panel → Preguntas.

## Rearmar la APK
1. Bajar de Drive la APK base (`trivia-feller-v0.11.apk`, carpeta compartida con el cliente) o usar la v0.12.
2. Modificar los archivos de `assets/public/assets/` que haga falta (bundle JS/CSS, imágenes).
3. Armar y alinear (reemplaza los archivos indicados dentro de la APK y quita la firma vieja):
   `python3 build.py base.apk sin_firmar.apk <carpeta_con_assets_nuevos>`
4. Firmar con apksig (jar de Google Maven: `com/android/tools/build/apksig/8.5.2/apksig-8.5.2.jar`):
   `javac -cp apksig.jar Sign.java && java -cp .:apksig.jar Sign salida.apk sin_firmar.apk feller.keystore`
   (alias `feller`, contraseña `android`; clave de PRUEBA, no es secreta de producción).
5. La clave `feller.keystore` NO está en este repo (es público). Se la entregó a grupomanso@gmail.com como archivo
   adjunto (`feller-test.keystore`) para que la guarde; no se pudo subir a Drive desde la sesión.
   Con esa misma clave la APK nueva se instala encima de la v0.12 sin desinstalar. Si no está, hay que generar
   otra (`keytool -genkeypair ... -alias feller`) y desinstalar antes de instalar. La v0.11 estaba firmada con
   otra clave (debug) que no se pudo recuperar.

## `patches/`
Scripts que se aplicaron sobre el bundle original de la v0.11 (`patch.py` … `patch6.py` y `panel.js`).
Sirven de documentación de qué se cambió (`patch7.py`: portada dentro del panel blanco y contador de premios automático). El bundle actual ya los incluye: para cambios nuevos, editar
`preview/pollito/assets/index-CQe1EuY2.js` directamente.

## Notas
- PIN del operador por defecto: 1234 (mantener apretado el logo 3 s).
- "Aciertos para ganar": 3 (fácil) / 4 (difícil), en Panel → Ajustes.
- La APK no se probó en un dispositivo; sí se verificó la firma (v1+v2+v3) y que los archivos internos coinciden.
