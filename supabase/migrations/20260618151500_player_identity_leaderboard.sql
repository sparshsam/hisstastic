-- Hiss-Tastic player identity and global leaderboard.
-- Score history intentionally remains local-only and is not modeled here.
-- Anonymous writes are constrained to the locally generated player_id carried
-- in the x-player-id request header. This is not account authentication, but
-- it narrows normal public-client writes to the app's anonymous identity model.

create extension if not exists pgcrypto;

create table if not exists public.players (
  id uuid primary key,
  username text not null check (
    length(username) between 3 and 24
    and username ~ '^[A-Za-z0-9 _-]+$'
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.leaderboard_scores (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  username text not null check (
    length(username) between 3 and 24
    and username ~ '^[A-Za-z0-9 _-]+$'
  ),
  best_score integer not null check (best_score between 0 and 150000000),
  updated_at timestamptz not null default now(),
  unique (player_id)
);

create index if not exists leaderboard_scores_best_score_idx
  on public.leaderboard_scores (best_score desc, updated_at asc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists players_set_updated_at on public.players;
create trigger players_set_updated_at
before update on public.players
for each row execute function public.set_updated_at();

drop trigger if exists leaderboard_scores_set_updated_at on public.leaderboard_scores;
create trigger leaderboard_scores_set_updated_at
before update on public.leaderboard_scores
for each row execute function public.set_updated_at();

create or replace function public.keep_highest_leaderboard_score()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'UPDATE' and new.best_score < old.best_score then
    new.best_score = old.best_score;
  end if;
  return new;
end;
$$;

drop trigger if exists leaderboard_scores_keep_highest on public.leaderboard_scores;
create trigger leaderboard_scores_keep_highest
before update on public.leaderboard_scores
for each row execute function public.keep_highest_leaderboard_score();

create or replace function public.request_player_id()
returns uuid
language plpgsql
stable
as $$
declare
  raw_player_id text;
begin
  raw_player_id := coalesce(current_setting('request.headers', true), '{}')::json ->> 'x-player-id';

  if raw_player_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
    return raw_player_id::uuid;
  end if;

  return null;
exception
  when others then
    return null;
end;
$$;

alter table public.players enable row level security;
alter table public.leaderboard_scores enable row level security;

alter table public.players force row level security;
alter table public.leaderboard_scores force row level security;

revoke all on public.players from anon, authenticated;
revoke all on public.leaderboard_scores from anon, authenticated;

grant insert, update on public.players to anon, authenticated;
grant insert, update on public.leaderboard_scores to anon, authenticated;
grant select (id, username) on public.players to anon, authenticated;
grant select (username, best_score, updated_at) on public.leaderboard_scores to anon, authenticated;
grant execute on function public.request_player_id() to anon, authenticated;

drop policy if exists "Players are publicly readable" on public.players;
drop policy if exists "Players are readable only for matching anonymous identity" on public.players;
create policy "Players are readable only for matching anonymous identity"
on public.players
for select
to anon, authenticated
using (public.request_player_id() = id);

drop policy if exists "Anonymous players can register" on public.players;
create policy "Anonymous players can register"
on public.players
for insert
to anon, authenticated
with check (public.request_player_id() = id);

drop policy if exists "Anonymous players can update profile snapshot" on public.players;
create policy "Anonymous players can update profile snapshot"
on public.players
for update
to anon, authenticated
using (public.request_player_id() = id)
with check (public.request_player_id() = id);

drop policy if exists "Leaderboard is publicly readable" on public.leaderboard_scores;
drop policy if exists "Leaderboard display fields are publicly readable" on public.leaderboard_scores;
create policy "Leaderboard display fields are publicly readable"
on public.leaderboard_scores
for select
to anon, authenticated
using (true);

drop policy if exists "Anonymous players can insert leaderboard best" on public.leaderboard_scores;
create policy "Anonymous players can insert leaderboard best"
on public.leaderboard_scores
for insert
to anon, authenticated
with check (
  best_score between 0 and 150000000
  and public.request_player_id() = player_id
  and exists (
    select 1
    from public.players
    where players.id = leaderboard_scores.player_id
      and players.username = leaderboard_scores.username
  )
);

drop policy if exists "Anonymous players can update leaderboard best" on public.leaderboard_scores;
create policy "Anonymous players can update leaderboard best"
on public.leaderboard_scores
for update
to anon, authenticated
using (public.request_player_id() = player_id)
with check (
  best_score between 0 and 150000000
  and public.request_player_id() = player_id
  and exists (
    select 1
    from public.players
    where players.id = leaderboard_scores.player_id
      and players.username = leaderboard_scores.username
  )
);
