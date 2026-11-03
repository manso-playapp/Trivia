#!/usr/bin/env bash
# Arma y firma la APK de Trivia Feller con el bundle actual de preview/pollito/assets
# y la portada nueva (tools/feller-apk/assets/hero-pollitos-BYSwqALi.png).
# Uso:  ./make-apk.sh <apk_base> <feller.keystore> [salida.apk]
#   apk_base:  trivia-feller-v0.12.apk (Drive, carpeta compartida con el cliente)
#   keystore:  feller.keystore (alias "feller", contraseña "android"; NO está en el repo)
# Necesita: python3, java/javac (JDK 11+) y salida a dl.google.com (para bajar apksig una vez).
set -euo pipefail
BASE=${1:?falta la APK base}; KEY=${2:?falta el keystore}; OUT=${3:-trivia-feller.apk}
HERE=$(cd "$(dirname "$0")" && pwd); ASSETS="$HERE/../../preview/pollito/assets"
WORK=$(mktemp -d); trap 'rm -rf "$WORK"' EXIT
JAR="$HERE/.apksig-8.5.2.jar"
if [ ! -f "$JAR" ]; then
  curl -fsSL -o "$JAR" https://dl.google.com/android/maven2/com/android/tools/build/apksig/8.5.2/apksig-8.5.2.jar
fi
python3 "$HERE/build.py" "$BASE" "$WORK/sin_firmar.apk" "$ASSETS" "$HERE/assets/hero-pollitos-BYSwqALi.png"
cp "$HERE/Sign.java" "$WORK/"; (cd "$WORK" && javac -cp "$JAR" Sign.java)
java -cp "$WORK:$JAR" Sign "$OUT" "$WORK/sin_firmar.apk" "$KEY"
echo "APK lista: $OUT"
