-- Esquema inicial mínimo (iteraremos en siguientes pasos)

-- Extensiones comunes (Supabase ya suele tenerlas)
create extension if not exists pgcrypto;

create table if not exists public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  contact_email text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.games (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  slug text not null,
  name text not null,
  status text not null default 'draft',
  config jsonb not null default '{}',
  current_question_idx int,
  question_ends_at timestamptz,
  created_at timestamptz not null default now(),
  unique (tenant_id, slug)
);

create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  idx int not null,
  text text not null,
  options jsonb not null,
  correct_index int not null,
  time_limit_sec int not null default 20,
  points_base int not null default 100,
  points_time_factor int not null default 2,
  created_at timestamptz not null default now(),
  unique (game_id, idx)
);A

-- Perfiles (admins/hosts). Futuro: enlazar a auth.users
create table if not exists public.profiles (
  id uuid primary key,
  tenant_id uuid references public.tenants(id) on delete set null,
  role text not null check (role in ('super_admin','tenant_admin','host')),
  display_name text,
  created_at timestamptz not null default now()
);

-- Jugadores (no requieren auth). Se relacionan por juego
create table if not exists public.players (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  email text not null,
  nickname text not null,
  device_fingerprint text,
  created_at timestamptz not null default now(),
  unique (game_id, email)
);

-- Respuestas de jugadores
create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  selected_index int not null,
  submitted_at timestamptz not null default now(),
  is_correct boolean,
  score_awarded int,
  unique (player_id, question_id)
);

-- Habilitar RLS
alter table public.tenants enable row level security;
alter table public.games enable row level security;
alter table public.questions enable row level security;
alter table public.profiles enable row level security;
alter table public.players enable row level security;
alter table public.submissions enable row level security;

-- Políticas mínimas seguras
-- 1) Tenants/Games/Questions: sin acceso público por ahora (solo service role)

-- Lectura pública mínima necesaria para registro por slug
create policy if not exists "tenants_select_public_active"
on public.tenants
for select
to anon
using (active = true);

create policy if not exists "games_select_public_published"
on public.games
for select
to anon
using (status = 'published');

-- 2) Permitir crear players desde cliente anon SI el juego está publicado
create policy "players_insert_anon_if_game_published"
on public.players
for insert
to anon
with check (
  exists (
    select 1 from public.games g
    where g.id = players.game_id and g.status = 'published'
  )
);

-- 3) Bloquear select/update/delete de players para anon (por defecto denegado)
--    Admins podrán acceder con service role o políticas futuras.

-- 4) submissions: por ahora sin inserción pública (se añadirá política posterior)

-- Función segura para exponer preguntas sin la respuesta correcta
create or replace function public.get_public_questions(p_game_id uuid)
returns table (
  id uuid,
  game_id uuid,
  idx int,
  text text,
  options jsonb,
  time_limit_sec int
)
language sql
security definer
set search_path = public
as $$
  select q.id, q.game_id, q.idx, q.text, q.options, q.time_limit_sec
  from public.questions q
  join public.games g on g.id = q.game_id
  where q.game_id = p_game_id and g.status = 'published';
$$;

grant execute on function public.get_public_questions(uuid) to anon;

-- Leaderboard (sólo lectura, sin datos sensibles)
create or replace function public.get_leaderboard(p_game_id uuid, p_limit int default 10)
returns table (
  player_id uuid,
  nickname text,
  total_score int,
  rank int
)
language sql
security definer
set search_path = public
as $$
  with scores as (
    select s.player_id, sum(coalesce(s.score_awarded,0)) as total_score
    from public.submissions s
    join public.players p on p.id = s.player_id
    where p.game_id = p_game_id
    group by s.player_id
  ), ranked as (
    select player_id, total_score,
           rank() over (order by total_score desc, player_id asc) as r
    from scores
  )
  select r.player_id, p.nickname, r.total_score, r.r
  from ranked r
  join public.players p on p.id = r.player_id
  order by r.r asc
  limit p_limit;
$$;

grant execute on function public.get_leaderboard(uuid, int) to anon;
