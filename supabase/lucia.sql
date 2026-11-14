-- ============================================================
-- Lucía Indumentaria — Ruleta mobile (QR)
-- Ejecutar completo en el SQL Editor del proyecto de Supabase.
-- Es idempotente: se puede volver a correr sin perder datos.
-- ============================================================

create extension if not exists pgcrypto;

-- Configuración general (una sola fila, id = 1)
create table if not exists lucia_settings (
  id smallint primary key default 1 check (id = 1),
  active boolean not null default true,
  voucher_phrase text not null default 'Ganaste en tu próxima compra',
  valid_until date not null default '2026-12-31',
  legal_text text not null default 'No acumulable con otras promociones. Válido hasta el 31/12/2026.',
  updated_at timestamptz not null default now()
);

-- Mails de prueba (separados por coma): juegan sin registrarse ni descontar stock
alter table lucia_settings add column if not exists test_emails text not null default '';

-- Los 8 gajos de la ruleta (position 0 = primer gajo arriba, sentido horario)
create table if not exists lucia_segments (
  position smallint primary key check (position between 0 and 7),
  label text not null,
  kind text not null check (kind in ('prize', 'lose')),
  -- % de probabilidad por tiro (sólo aplica a premios reales).
  -- La suma de premios debe ser <= 100; el resto es "suerte la próxima".
  probability numeric(5,2) not null default 0 check (probability >= 0 and probability <= 100),
  -- Stock disponible del premio. null = ilimitado. Al llegar a 0 deja de salir.
  stock integer check (stock is null or stock >= 0),
  color text not null default '#98A584',
  updated_at timestamptz not null default now()
);

-- Jugadores (uno por teléfono y uno por mail)
create table if not exists lucia_players (
  id uuid primary key default gen_random_uuid(),
  phone text not null unique,
  email text not null unique,
  won boolean not null,
  segment_position smallint,
  prize_label text,
  voucher_code text unique,
  redeemed_at timestamptz,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists lucia_players_created_idx on lucia_players (created_at desc);

-- Seguridad: sin políticas públicas. Sólo el backend (service role) accede.
alter table lucia_settings enable row level security;
alter table lucia_segments enable row level security;
alter table lucia_players enable row level security;

-- Datos iniciales (no pisa lo que ya esté cargado)
insert into lucia_settings (id) values (1) on conflict (id) do nothing;

insert into lucia_segments (position, label, kind, probability, stock, color) values
  (0, 'Premio 1',          'prize', 10, null, '#98A584'),
  (1, 'Suerte la próxima', 'lose',   0, null, '#F6F4EC'),
  (2, 'Premio 2',          'prize', 10, null, '#76845F'),
  (3, 'Suerte la próxima', 'lose',   0, null, '#E4E7D8'),
  (4, 'Premio 3',          'prize', 10, null, '#98A584'),
  (5, 'Suerte la próxima', 'lose',   0, null, '#F6F4EC'),
  (6, 'Premio 4',          'prize', 10, null, '#76845F'),
  (7, 'Suerte la próxima', 'lose',   0, null, '#E4E7D8')
on conflict (position) do nothing;

-- ------------------------------------------------------------
-- Tiro de ruleta: se decide en el servidor, de forma atómica.
-- Devuelve jsonb con el resultado o con { error }.
-- ------------------------------------------------------------
create or replace function lucia_spin(p_phone text, p_email text, p_user_agent text default null)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_settings lucia_settings%rowtype;
  v_seg lucia_segments%rowtype;
  v_r numeric;
  v_acc numeric := 0;
  v_pos smallint := null;
  v_label text := null;
  v_won boolean := false;
  v_code text := null;
  v_alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_i int;
begin
  select * into v_settings from lucia_settings where id = 1;
  if not found or not v_settings.active then
    return jsonb_build_object('error', 'inactive');
  end if;

  -- Bloquea los gajos: serializa los tiros (stock y unicidad consistentes)
  perform 1 from lucia_segments for update;

  if exists (select 1 from lucia_players where phone = p_phone) then
    return jsonb_build_object('error', 'already_played', 'field', 'phone');
  end if;
  if exists (select 1 from lucia_players where email = p_email) then
    return jsonb_build_object('error', 'already_played', 'field', 'email');
  end if;

  -- Sorteo ponderado entre premios reales con stock
  v_r := random() * 100;
  for v_seg in
    select * from lucia_segments
    where kind = 'prize' and probability > 0 and (stock is null or stock > 0)
    order by position
  loop
    v_acc := v_acc + v_seg.probability;
    if v_r < v_acc then
      v_pos := v_seg.position;
      v_label := v_seg.label;
      v_won := true;
      exit;
    end if;
  end loop;

  if v_won then
    update lucia_segments set stock = stock - 1
      where position = v_pos and stock is not null;

    -- Código único tipo LU-7KQ4ZP (sin caracteres ambiguos 0/O, 1/I)
    loop
      v_code := 'LU-';
      for v_i in 1..6 loop
        v_code := v_code || substr(v_alphabet, 1 + (get_byte(gen_random_bytes(1), 0) % 32), 1);
      end loop;
      exit when not exists (select 1 from lucia_players where voucher_code = v_code);
    end loop;
  else
    select position, label into v_pos, v_label
      from lucia_segments where kind = 'lose'
      order by random() limit 1;
    if v_pos is null then
      return jsonb_build_object('error', 'misconfigured');
    end if;
  end if;

  insert into lucia_players (phone, email, won, segment_position, prize_label, voucher_code, user_agent)
  values (p_phone, p_email, v_won, v_pos, v_label, v_code, left(p_user_agent, 300));

  return jsonb_build_object(
    'position', v_pos,
    'label', v_label,
    'won', v_won,
    'code', v_code,
    'phrase', v_settings.voucher_phrase,
    'legal', v_settings.legal_text,
    'valid_until', v_settings.valid_until
  );
exception
  when unique_violation then
    return jsonb_build_object('error', 'already_played');
end;
$$;

revoke all on function lucia_spin(text, text, text) from public, anon, authenticated;
grant execute on function lucia_spin(text, text, text) to service_role;
