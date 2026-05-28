JAKPOT Trivia — Arranque Progresivo
===================================

Estructura inicial con Next.js (App Router) y Supabase. Incluye rutas mínimas para Display y Play, config base y un esquema SQL inicial.

Pasos de Setup (local)
----------------------

1) Variables de entorno
   - Copiá `.env.example` a `.env.local` y completá:
     - `NEXT_PUBLIC_SUPABASE_URL=`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY=`
     - `SUPABASE_SERVICE_ROLE_KEY=` (solo en servidor / Vercel, no exponer en cliente)
     - `HOST_ADMIN_SECRET=` (opcional; si se define, protege `/api/host/state`)
     - `NEXT_PUBLIC_BASE_URL=` (opcional; fuerza el dominio del QR, ej: `https://tudominio.com`)
     - `NEXT_PUBLIC_LAN_IP=` (opcional; tu IP LAN, para que el QR reemplace `localhost` por tu IP en desarrollo)

2) Dependencias
   - Instalación (requiere red):
     - npm: `npm install`
     - o pnpm: `pnpm install`

3) Ejecutar en desarrollo
   - `npm run dev` y abrir http://localhost:3000
- Páginas:
  - Display: `/display/demo/demo-game` (QR + estado en vivo)
  - Móvil: `/play/{tenantSlug}/{gameSlug}` (registro cliente + respuestas)
  - Host: `/t/{tenantSlug}/host/{gameSlug}` (Start/End vía Realtime)
  - Super Admin: `/admin` (gestión tenants) y `/admin/tenants/{tenantSlug}` (juegos)

4) Supabase (inicial)
   - Crear proyecto en Supabase y configurar Auth/Storage luego.
   - Aplicar `supabase/schema.sql` en SQL Editor (incluye RLS mínima para `players` y función `get_public_questions`).
   - Crea un tenant y un juego de prueba (status = 'published'):
     ```sql
     insert into public.tenants (name, slug, contact_email) values ('Demo Store', 'demo', 'demo@example.com');
     insert into public.games (tenant_id, slug, name, status) 
     select id, 'demo-game', 'Demo Trivia', 'published' from public.tenants where slug='demo';
     ```

Realtime, estado y leaderboard
------------------------------
- Realtime canal: `game-{id}` con `start_question` / `end_question`.
- Persistencia: `/api/host/state` guarda `games.current_question_idx` y `question_ends_at`.
  - Si `HOST_ADMIN_SECRET` está definido, enviar header `x-admin-key: <secret>`.
- Display/Play: hidratan estado desde DB al cargar, y luego siguen Realtime.
- Leaderboard: `get_leaderboard(game_id, limit)` suma `submissions` y ordena por puntaje.

Theming / Branding
------------------
- Tabla `themes` con `css_vars` (JSON) y assets (`logo_url`, `bg_url`).
- `games.theme_id` selecciona el tema aplicado.
- Display aplica tema server‑side; Play lo aplica client‑side.
- Ejemplo de `css_vars` (JSON):
  `{ "--accent": "#ff3e00", "--bg": "#000000", "--fg": "#ffffff" }`

Seed de tema demo:
```sql
insert into public.themes (tenant_id, name, css_vars)
select id, 'Demo Theme', '{"--accent":"#22c55e","--bg":"#0b1020","--fg":"#f8fafc"}'::jsonb
from public.tenants where slug='demo';

update public.games g
set theme_id = t.id
from public.themes t
where g.slug='demo-game' and t.tenant_id = g.tenant_id;
```

Validaciones de respuestas
-------------------------
- El endpoint `POST /api/answer` valida:
  - Juego publicado y tenant activo.
  - Pregunta enviada coincide con `games.current_question_idx`.
  - Ventana activa: `games.question_ends_at > now()`.
  - Una respuesta por jugador/pregunta (constraint único).
- Puntuación: `points_base + points_time_factor * segundos_restantes` para respuestas correctas.

Siguientes pasos
----------------
1. Persistir estado actual para reconexión tras refresh.
2. Ranking en vivo desde `submissions`.
3. Roles admin/host (profiles) y RLS por tenant/rol.
4. Emails de ganadores (Edge Function + logs).
Notas sobre QR
--------------
- Por defecto, el QR usa el host/protocolo de la request.
- Si definís `NEXT_PUBLIC_BASE_URL`, el QR usará ese dominio fijo.
- Si no hay `BASE_URL` y el host es `localhost`, intentamos reemplazar por tu IP LAN automáticamente. También podés fijarla con `NEXT_PUBLIC_LAN_IP`.
SMTP / Auth (admins/hosts)
-------------------------
- Configurá SMTP en Supabase (Authentication → SMTP) para magic links/OTP.
- SITE URL: definí la URL de tu app (local o prod) para que el enlace redirija correctamente.
- Perfil: al crear un usuario, el trigger `handle_new_user` inserta en `public.profiles` con `role='host'`.
- Login: `/login` (ingresa email, llega magic link).
- Host protegido: `/t/{tenant}/host/{game}` requiere sesión activa.

Promover usuario a super_admin (SQL)
-----------------------------------
Tras iniciar sesión por magic link, obtené tu `auth.uid()` y promovelo:
```sql
update public.profiles set role = 'super_admin' where id = auth.uid();
```
Luego recargá `/admin`.
