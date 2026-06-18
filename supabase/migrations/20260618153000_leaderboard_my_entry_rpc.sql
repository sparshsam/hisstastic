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
