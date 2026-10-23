# Trivia para tablet (Playapp)

Juego de trivia para una persona por vez, pensado para tablets Android en un stand. Funciona **sin internet**.

- Pantallas: espera → datos opcionales (con autocompletado de mail) → cuenta 3-2-1 → 5 preguntas al azar (15 s, 3 opciones) → felicitación → ranking del día → vuelve sola al inicio.
- Pollito y huevos dibujados en código (`src/components/Chick.tsx`, `Egg.tsx`). Colores y proporciones del pollito se cambian en la configuración.
- Menú del operador: mantener apretado el logo 3 segundos y poner el PIN (de fábrica `1234`).
- La marca y las preguntas de cada cliente se cargan desde el menú del operador. **No se guardan en el repositorio.**

## Comandos

```bash
npm install
npm run dev        # probar en el navegador
npm test           # pruebas
npm run build      # genera dist/ (web y base del APK)
```
