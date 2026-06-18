-- Return the current player's own leaderboard entry with exact rank.
-- Identifies the player via x-player-id request header (server-side only).
-- No player_id is exposed in the response.
-- Called by the app when viewing the Global leaderboard tab.

create or replace function public.get_my_leaderboard_entry()
returns table (
  username text,
  best_score integer,
  rank bigint,
  updated_at timestamptz
)
language plpgsql
stable
security definer
as $$
declare
  _player_id uuid;
begin
  _player_id := public.request_player_id();
  if _player_id is null then
    return;
  end if;

  return query
  select
    ls.username,
    ls.best_score,
    count(*) filter (where r.best_score > ls.best_score
                       or (r.best_score = ls.best_score and r.updated_at < ls.updated_at)) + 1 as rank,
    ls.updated_at
  from public.leaderboard_scores ls
  left join public.leaderboard_scores r on true
  where ls.player_id = _player_id
  group by ls.username, ls.best_score, ls.updated_at;
end;
$$;

grant execute on function public.get_my_leaderboard_entry() to anon, authenticated;

-- Server-side upsert: insert or update the current player's leaderboard entry.
-- Reads player_id from x-player-id header; returns nothing on success.
-- Keeps the highest score via the keep_highest_leaderboard_score trigger.
create or replace function public.upsert_my_leaderboard_score(
  p_best_score integer,
  p_username text
)
returns void
language plpgsql
security definer
as $$
declare
  _player_id uuid;
begin
  _player_id := public.request_player_id();
  if _player_id is null then
    raise exception 'Missing or invalid x-player-id header';
  end if;

  insert into public.leaderboard_scores (player_id, username, best_score)
  values (_player_id, p_username, p_best_score)
  on conflict (player_id) do update
    set best_score = greatest(leaderboard_scores.best_score, excluded.best_score),
        username = excluded.username,
        updated_at = now();
end;
$$;

grant execute on function public.upsert_my_leaderboard_score(integer, text) to anon, authenticated;
