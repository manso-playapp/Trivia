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

Siguientes pasos
----------------
1. Persistir estado actual para reconexión tras refresh.
2. Ranking en vivo desde `submissions`.
3. Roles admin/host (profiles) y RLS por tenant/rol.
4. Emails de ganadores (Edge Function + logs).
