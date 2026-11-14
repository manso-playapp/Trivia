# Tipo de juego: Ruleta mobile por QR

Primer cliente: **Lucía Indumentaria** (Santa Fe). Estado al 14/11/2026: **en producción**.

Es un tipo de juego distinto de la trivia del repo: no usa tótem, pantalla ni operador. La persona escanea un QR impreso, juega todo en su celular y, si gana, descarga un voucher.

## Enlaces

| Qué | Dónde |
| --- | --- |
| Juego (lo que abre el QR) | https://trivia-mansos-projects-7d8ae3d2.vercel.app/lucia |
| Panel | https://trivia-mansos-projects-7d8ae3d2.vercel.app/lucia/admin (clave = `LUCIA_ADMIN_SECRET`) |
| QR para imprimir | `public/lucia/qr-lucia-ruleta.jpg` (también se descarga desde el panel → QR, en JPG o PNG) |
| Base de datos | Supabase, proyecto `qsqhbzwtidqxxeaoepcl` |
| Hosting | Vercel, proyecto `trivia` (equipo mansos-projects), rama `main` = producción |

El QR codifica la URL fija de producción: no vence ni cambia mientras no cambie el dominio.

## Flujo del jugador

1. **Formulario:** teléfono, mail, link a Instagram + tilde "Ya sigo a Lucía" (no se puede comprobar), aceptación de bases → **Ingresar al juego**. Se valida antes (`/api/lucia/check`): avisa si ese teléfono o mail ya jugó. En Android/escritorio pide pantalla completa (Safari de iPhone no lo permite).
2. **Ruleta:** 8 gajos + botón **Girar**. El resultado lo decide el servidor (función SQL `lucia_spin`), nunca el celular.
3. **Resultado:**
   - Premio → voucher PNG (1080×1350) con logo, frase, premio, código `LU-XXXXXX` y legales; botón de descarga y de compartir.
   - Sin premio → placa "Suerte la próxima".
   - El resultado queda guardado en el celular; si el participante se elimina desde el panel, al reabrir se borra esa copia (`/api/lucia/verify`).

## Panel (`/lucia/admin`)

- **Ruleta:** por gajo, nombre, tipo (premio real / suerte la próxima), **% por tiro**, **stock** (vacío = ilimitado; en 0 deja de salir) y color. Frase del voucher, vencimiento, texto legal, pausa de la ruleta y **mails de prueba**.
- **Mails de prueba** (separados por coma): juegan todas las veces que quieran, no se registran, no descuentan stock y el voucher sale con código `PRUEBA-XXXX` (no canjeable).
- **Jugadores:** lista, búsqueda, totales por premio, exportar CSV (Excel en español), **eliminar participante**.
- **Canjear:** buscar código y marcarlo como canjeado (o deshacer).
- **QR:** descarga JPG/PNG apuntando a la URL de producción.

## Reglas del sorteo

- Cada premio real tiene su % por tiro; la suma no puede pasar de 100. El resto es "suerte la próxima".
- Un premio sin stock deja de salir y su % pasa a "suerte la próxima".
- Una jugada por teléfono y una por mail. Los teléfonos se normalizan (`+54 9 342…`, `0342…` y `342…` cuentan igual).

## Archivos

| Archivo | Qué es |
| --- | --- |
| `app/lucia/page.tsx`, `app/lucia/lucia.css`, `app/lucia/layout.tsx` | Juego (formulario → ruleta → resultado) y estilos |
| `app/lucia/admin/page.tsx` | Panel |
| `app/api/lucia/` | `config` (gajos públicos), `check`, `spin`, `verify`, `admin/config`, `admin/players` (lista, CSV, eliminar), `admin/voucher` (canje) |
| `components/lucia/Wheel.tsx` | Ruleta SVG (aro perlado, puntero central fijo) |
| `lib/lucia.ts` | Lógica compartida: validaciones, sorteo, rotación, paleta, URL pública |
| `lib/luciaVoucher.ts` | Dibujo del voucher en canvas |
| `lib/luciaServer.ts` | Auth del panel (`x-admin-secret`) |
| `supabase/lucia.sql` | Tablas, RLS y `lucia_spin`. Idempotente: se puede volver a ejecutar |
| `public/lucia/` | Logos sin fondo (crema, verde, negro, blanco), foto de fondo, QR |
| `tests/lucia.test.ts` | Pruebas de la lógica |

## Variables de entorno (Vercel)

`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `LUCIA_ADMIN_SECRET`. Después de cambiarlas hay que volver a publicar.

## Cómo hacerlo para otro cliente

Hoy el juego está armado para Lucía (nombres `lucia_*`, rutas `/lucia`). Para un cliente nuevo:

1. Copiar `app/lucia`, `app/api/lucia`, `components/lucia`, `lib/lucia*.ts`, `supabase/lucia.sql` y `tests/lucia.test.ts` con el nombre del cliente, y renombrar tablas, función SQL, rutas y la clave de `localStorage`.
2. Cambiar marca: logos en `public/<cliente>/`, foto de fondo, paleta (`BRAND` en `lib/<cliente>.ts` y variables en el CSS), tipografía, textos, Instagram y `*_PUBLIC_URL`.
3. Ejecutar el SQL en Supabase, cargar la variable de clave del panel en Vercel, publicar y generar el QR desde el panel.
4. Probar con un **mail de prueba** antes de imprimir el QR.

Siguiente paso posible: parametrizarlo como juego multi-cliente (una tabla de campañas con marca y gajos) en lugar de copiar carpetas.

## Lecciones

- Next.js 14 cachea los `fetch` en rutas GET: el cliente de Supabase usa `cache: 'no-store'` y las rutas `fetchCache = 'force-no-store'`. Sin eso el panel y la ruleta muestran datos viejos.
- Supabase instala `pgcrypto` en el schema `extensions`: la función SQL usa `search_path = public, extensions`.
- La protección de Vercel (Deployment Protection) tiene que estar apagada o limitada a previews, si no el QR pide login.
- No hacer pruebas que guarden configuración contra la base real: pisan lo que cargó el cliente. Usar mails de prueba.
