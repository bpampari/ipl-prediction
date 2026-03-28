create extension if not exists pgcrypto;

create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  max_players integer not null default 8 check (max_players between 1 and 8),
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  phone text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.room_members (
  room_id uuid not null references public.rooms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('admin', 'member')),
  joined_at timestamptz not null default now(),
  primary key (room_id, user_id)
);

create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  team_a text not null,
  team_b text not null,
  match_date date not null,
  actual_winner text,
  settled_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  check (team_a <> team_b),
  check (actual_winner is null or actual_winner = team_a or actual_winner = team_b)
);

create table if not exists public.predictions (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  predicted_team text not null,
  stake integer not null default 50 check (stake = 50),
  points_delta numeric(10,2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (match_id, user_id)
);

insert into public.rooms (slug, name, max_players)
values ('ipl-2026-main', 'IPL 2026 Main Pool', 8)
on conflict (slug) do update
set name = excluded.name,
    max_players = excluded.max_players;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
before update on public.profiles
for each row
execute procedure public.touch_updated_at();

drop trigger if exists predictions_touch_updated_at on public.predictions;
create trigger predictions_touch_updated_at
before update on public.predictions
for each row
execute procedure public.touch_updated_at();

alter table public.rooms enable row level security;
alter table public.profiles enable row level security;
alter table public.room_members enable row level security;
alter table public.matches enable row level security;
alter table public.predictions enable row level security;

drop policy if exists "rooms are readable by authenticated users" on public.rooms;
create policy "rooms are readable by authenticated users"
on public.rooms for select
to authenticated
using (true);

drop policy if exists "profiles are readable by authenticated users" on public.profiles;
create policy "profiles are readable by authenticated users"
on public.profiles for select
to authenticated
using (true);

drop policy if exists "users can insert their own profile" on public.profiles;
create policy "users can insert their own profile"
on public.profiles for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "users can update their own profile" on public.profiles;
create policy "users can update their own profile"
on public.profiles for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "room members visible to authenticated users" on public.room_members;
create policy "room members visible to authenticated users"
on public.room_members for select
to authenticated
using (true);

drop policy if exists "matches are readable by authenticated users" on public.matches;
create policy "matches are readable by authenticated users"
on public.matches for select
to authenticated
using (true);

drop policy if exists "predictions are readable by authenticated users" on public.predictions;
create policy "predictions are readable by authenticated users"
on public.predictions for select
to authenticated
using (true);

create or replace function public.join_default_room(p_room_slug text)
returns public.room_members
language plpgsql
security definer
set search_path = public
as $$
declare
  target_room public.rooms;
  existing_member public.room_members;
  current_count integer;
  assigned_role text;
  auth_user auth.users;
begin
  if auth.uid() is null then
    raise exception 'You must be logged in to join the room.';
  end if;

  select * into target_room from public.rooms where slug = p_room_slug;

  if target_room.id is null then
    raise exception 'Room not found.';
  end if;

  select * into existing_member
  from public.room_members
  where room_id = target_room.id
    and user_id = auth.uid();

  if existing_member.user_id is not null then
    return existing_member;
  end if;

  select count(*) into current_count
  from public.room_members
  where room_id = target_room.id;

  if current_count >= target_room.max_players then
    raise exception 'This room is already full.';
  end if;

  select * into auth_user from auth.users where id = auth.uid();

  insert into public.profiles (id, display_name, phone, avatar_url)
  values (
    auth.uid(),
    coalesce(auth_user.raw_user_meta_data ->> 'full_name', auth_user.raw_user_meta_data ->> 'name', split_part(auth_user.email, '@', 1), auth_user.phone),
    auth_user.phone,
    auth_user.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do update
  set phone = excluded.phone,
      avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url);

  assigned_role := case when current_count = 0 then 'admin' else 'member' end;

  insert into public.room_members (room_id, user_id, role)
  values (target_room.id, auth.uid(), assigned_role)
  returning * into existing_member;

  return existing_member;
end;
$$;

create or replace function public.create_match(
  p_room_slug text,
  p_team_a text,
  p_team_b text,
  p_match_date date
)
returns public.matches
language plpgsql
security definer
set search_path = public
as $$
declare
  target_room public.rooms;
  membership public.room_members;
  inserted_match public.matches;
begin
  if auth.uid() is null then
    raise exception 'You must be logged in.';
  end if;

  select * into target_room from public.rooms where slug = p_room_slug;

  select * into membership
  from public.room_members
  where room_id = target_room.id
    and user_id = auth.uid();

  if membership.role is distinct from 'admin' then
    raise exception 'Only an admin can create matches.';
  end if;

  if lower(trim(p_team_a)) = lower(trim(p_team_b)) then
    raise exception 'Team names must be different.';
  end if;

  insert into public.matches (room_id, team_a, team_b, match_date, created_by)
  values (target_room.id, trim(p_team_a), trim(p_team_b), p_match_date, auth.uid())
  returning * into inserted_match;

  return inserted_match;
end;
$$;

create or replace function public.save_prediction(
  p_match_id uuid,
  p_predicted_team text
)
returns public.predictions
language plpgsql
security definer
set search_path = public
as $$
declare
  target_match public.matches;
  membership public.room_members;
  saved_prediction public.predictions;
begin
  if auth.uid() is null then
    raise exception 'You must be logged in.';
  end if;

  select * into target_match from public.matches where id = p_match_id;

  if target_match.id is null then
    raise exception 'Match not found.';
  end if;

  if target_match.settled_at is not null then
    raise exception 'Predictions are locked for this match.';
  end if;

  if p_predicted_team not in (target_match.team_a, target_match.team_b) then
    raise exception 'Prediction must match one of the teams in this fixture.';
  end if;

  select * into membership
  from public.room_members
  where room_id = target_match.room_id
    and user_id = auth.uid();

  if membership.user_id is null then
    raise exception 'You must join the room before making predictions.';
  end if;

  insert into public.predictions (match_id, user_id, predicted_team, stake, points_delta)
  values (target_match.id, auth.uid(), p_predicted_team, 50, null)
  on conflict (match_id, user_id) do update
  set predicted_team = excluded.predicted_team,
      points_delta = null
  returning * into saved_prediction;

  return saved_prediction;
end;
$$;

create or replace function public.settle_match(
  p_match_id uuid,
  p_actual_winner text
)
returns public.matches
language plpgsql
security definer
set search_path = public
as $$
declare
  target_match public.matches;
  membership public.room_members;
  winning_count integer;
  losing_count integer;
  winner_share numeric(10,2);
begin
  if auth.uid() is null then
    raise exception 'You must be logged in.';
  end if;

  select * into target_match from public.matches where id = p_match_id;

  if target_match.id is null then
    raise exception 'Match not found.';
  end if;

  select * into membership
  from public.room_members
  where room_id = target_match.room_id
    and user_id = auth.uid();

  if membership.role is distinct from 'admin' then
    raise exception 'Only an admin can settle a match.';
  end if;

  if target_match.settled_at is not null then
    raise exception 'This match is already settled.';
  end if;

  if p_actual_winner not in (target_match.team_a, target_match.team_b) then
    raise exception 'Winner must be one of the two teams in the match.';
  end if;

  select count(*) into winning_count
  from public.predictions
  where match_id = target_match.id
    and predicted_team = p_actual_winner;

  select count(*) into losing_count
  from public.predictions
  where match_id = target_match.id
    and predicted_team <> p_actual_winner;

  if winning_count > 0 then
    winner_share := round((losing_count * 50.0) / winning_count, 2);
  else
    winner_share := 0;
  end if;

  update public.predictions
  set points_delta = case
    when predicted_team = p_actual_winner then winner_share
    else -50
  end
  where match_id = target_match.id;

  update public.matches
  set actual_winner = p_actual_winner,
      settled_at = now()
  where id = target_match.id
  returning * into target_match;

  return target_match;
end;
$$;

grant execute on function public.join_default_room(text) to authenticated;
grant execute on function public.create_match(text, text, text, date) to authenticated;
grant execute on function public.save_prediction(uuid, text) to authenticated;
grant execute on function public.settle_match(uuid, text) to authenticated;
