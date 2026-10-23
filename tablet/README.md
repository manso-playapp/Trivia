# Trivia para tablet (Playapp)

Juego de trivia para una persona por vez, pensado para tablets Android en un stand. Funciona **sin internet**.

- Pantallas: espera → datos opcionales (con autocompletado de mail) → cuenta 3-2-1 → 5 preguntas al azar (15 s, 3 opciones) → felicitación → ranking del día → vuelve sola al inicio.
- Pollito y huevos dibujados en código (`src/components/Chick.tsx`, `Egg.tsx`). Colores y proporciones del pollito se cambian en la configuración.
- Menú del operador: mantener apretado el logo 3 segundos y poner el PIN (de fábrica `1234`).
- **Pack de cliente**: todo lo del cliente vive en `packs/<cliente>/` (excluida del repositorio): `pack.json` (marca, colores, tipografías, pollito, textos, ajustes), `preguntas.csv` y `assets/` (logos y fotos, nombrados en el JSON como `"asset:logo.png"`). Se elige al compilar con `VITE_PACK=<cliente>`; sin packs arranca la demostración. También se puede cambiar todo desde el menú del operador.
- Escenas fijas para aprobar el diseño: abrir el juego con `#escenas` al final de la dirección.

## Comandos

```bash
npm install
npm run dev        # probar en el navegador
npm test           # pruebas
npm run build      # genera dist/ (web y base del APK)
npx cap sync android && (cd android && ./gradlew assembleDebug)   # APK de prueba (requiere Android SDK)
```
