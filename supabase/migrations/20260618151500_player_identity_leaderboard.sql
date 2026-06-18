-- Hiss-Tastic player identity and global leaderboard.
-- Score history intentionally remains local-only and is not modeled here.

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
  best_score integer not null check (best_score >= 0),
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

alter table public.players enable row level security;
alter table public.leaderboard_scores enable row level security;

grant select, insert, update on public.players to anon, authenticated;
grant select, insert, update on public.leaderboard_scores to anon, authenticated;

drop policy if exists "Players are publicly readable" on public.players;
create policy "Players are publicly readable"
on public.players
for select
to anon, authenticated
using (true);

drop policy if exists "Anonymous players can register" on public.players;
create policy "Anonymous players can register"
on public.players
for insert
to anon, authenticated
with check (true);

drop policy if exists "Anonymous players can update profile snapshot" on public.players;
create policy "Anonymous players can update profile snapshot"
on public.players
for update
to anon, authenticated
using (true)
with check (true);

drop policy if exists "Leaderboard is publicly readable" on public.leaderboard_scores;
create policy "Leaderboard is publicly readable"
on public.leaderboard_scores
for select
to anon, authenticated
using (true);

drop policy if exists "Anonymous players can insert leaderboard best" on public.leaderboard_scores;
create policy "Anonymous players can insert leaderboard best"
on public.leaderboard_scores
for insert
to anon, authenticated
with check (true);

drop policy if exists "Anonymous players can update leaderboard best" on public.leaderboard_scores;
create policy "Anonymous players can update leaderboard best"
on public.leaderboard_scores
for update
to anon, authenticated
using (true)
with check (true);
