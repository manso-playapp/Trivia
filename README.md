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

2) Dependencias
   - Instalación (requiere red):
     - npm: `npm install`
     - o pnpm: `pnpm install`

3) Ejecutar en desarrollo
   - `npm run dev` y abrir http://localhost:3000
- Páginas:
  - Display: `/display/demo/demo-game`
  - Móvil: `/play/{tenantSlug}/{gameSlug}` (registro cliente + respuestas)

4) Supabase (inicial)
   - Crear proyecto en Supabase y configurar Auth/Storage luego.
   - Aplicar `supabase/schema.sql` en SQL Editor (incluye RLS mínima para `players` y función `get_public_questions`).
   - Crea un tenant y un juego de prueba (status = 'published'):
     ```sql
     insert into public.tenants (name, slug, contact_email) values ('Demo Store', 'demo', 'demo@example.com');
     insert into public.games (tenant_id, slug, name, status) 
     select id, 'demo-game', 'Demo Trivia', 'published' from public.tenants where slug='demo';
     ```

Qué sigue
---------
1. Realtime: canal `game-{id}` y eventos (start/end/tick) para sincronizar TV y móvil.
2. UI de host con controles y estado actual.
3. Roles admin/host (profiles) y RLS por tenant/rol.
4. Emails con Edge Functions.
