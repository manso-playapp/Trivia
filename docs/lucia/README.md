# Ruleta Lucía Indumentaria (mobile + QR)

- Juego: `/lucia` (lo que abre el QR)
- Panel: `/lucia/admin` (clave = `LUCIA_ADMIN_SECRET`)

## Puesta en marcha

1. **Supabase** → SQL Editor → pegar y ejecutar todo `supabase/lucia.sql`.
   Crea las tablas, los 8 gajos de ejemplo y la función `lucia_spin`. Se puede volver a correr sin perder datos.
2. **Vercel** → importar el repo `Trivia` y cargar estas variables de entorno:
   - `NEXT_PUBLIC_SUPABASE_URL` → `https://<id-del-proyecto>.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` → Supabase › Project Settings › API (la usan otras páginas del repo para compilar)
   - `SUPABASE_SERVICE_ROLE_KEY` → Supabase › Project Settings › API (secreta, sólo en Vercel)
   - `LUCIA_ADMIN_SECRET` → la clave que quieran para el panel
3. Entrar a `/lucia/admin` → **Ruleta**: nombrar premios, % y stock → Guardar.
4. **QR** → descargar el PNG para imprimir (apunta a `https://<dominio>/lucia`).

## Cómo funciona

- El jugador deja teléfono y mail, acepta bases y toca **Jugar**. El resultado se decide en el servidor
  (función `lucia_spin`), no en el celular.
- Una jugada por teléfono y una por mail. Los teléfonos se normalizan (+54 9 / 0 inicial).
- Cada premio real tiene su **% por tiro**; la suma no puede pasar de 100%. El resto es "Suerte la próxima".
- **Stock** opcional por premio: al llegar a 0 deja de salir y su % pasa a "Suerte la próxima".
- Si gana, se genera el voucher (PNG 1080×1350) con logo, frase, premio, código `LU-XXXXXX` y legales,
  y lo descarga. Si recarga la página, vuelve a ver su resultado (guardado en el navegador).
- Panel: editar gajos/textos, apagar la ruleta, ver jugadores, exportar CSV (Excel), canjear vouchers por código.

## Archivos

- `app/lucia/` páginas (juego y panel) + estilos
- `app/api/lucia/` endpoints
- `components/lucia/Wheel.tsx` ruleta SVG
- `lib/lucia.ts` lógica compartida · `lib/luciaVoucher.ts` voucher · `lib/luciaServer.ts` auth del panel
- `supabase/lucia.sql` base de datos · `public/lucia/` logo sin fondo (negro y blanco)
- `tests/lucia.test.ts`
