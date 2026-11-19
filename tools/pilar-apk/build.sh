#!/usr/bin/env bash
# Arma la APK de la ruleta Pilar XV a partir de public/pilar.
# Uso: SDK=<carpeta con android-14 (build-tools 34) y android-34 (plataforma)> KEYSTORE=<clave.keystore> ./build.sh salida.apk
# Descargas: https://dl.google.com/android/repository/build-tools_r34-linux.zip y platform-34-ext7_r03.zip
set -euo pipefail
AQUI="$(cd "$(dirname "$0")" && pwd)"; WEB="$AQUI/../../public/pilar"
BT="$SDK/android-14"; JAR="$SDK/android-34/android.jar"; OUT="$(realpath "${1:-ruleta-pilar.apk}")"
T="$(mktemp -d)"; trap 'rm -rf "$T"' EXIT
mkdir -p "$T/assets/pilar" "$T/cls" "$T/dex"
cp -r "$WEB"/index.html "$WEB"/style.css "$WEB"/app.js "$WEB"/config.js "$WEB"/assets "$T/assets/pilar/"
"$BT/aapt2" compile --dir "$AQUI/res" -o "$T/res.zip"
"$BT/aapt2" link -o "$T/base.apk" -I "$JAR" --manifest "$AQUI/AndroidManifest.xml" -A "$T/assets" "$T/res.zip"
javac -source 8 -target 8 -nowarn -cp "$JAR" -d "$T/cls" $(find "$AQUI/src" -name '*.java') 2>/dev/null
"$BT/d8" --min-api 22 --lib "$JAR" --output "$T/dex" $(find "$T/cls" -name '*.class')
(cd "$T/dex" && zip -q -j "$T/base.apk" classes.dex)
"$BT/zipalign" -f 4 "$T/base.apk" "$T/al.apk"
"$BT/apksigner" sign --ks "$KEYSTORE" --ks-pass pass:android --ks-key-alias pilar --out "$OUT" "$T/al.apk"
"$BT/apksigner" verify --verbose "$OUT" | head -5
