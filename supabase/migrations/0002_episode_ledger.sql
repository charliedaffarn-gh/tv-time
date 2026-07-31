-- Episode-level watched tracking, replacing the single current_season/
-- current_episode pointer with a ledger so individual episodes can be
-- marked independently of watch order.

create table public.watched_episodes (
  id uuid primary key default gen_random_uuid(),
  user_show_id uuid not null references public.user_shows (id) on delete cascade,
  season_number integer not null,
  episode_number integer not null,
  watched_at timestamptz not null default now(),
  unique (user_show_id, season_number, episode_number)
);

alter table public.watched_episodes enable row level security;

create policy "Users can view their own watched episodes"
  on public.watched_episodes for select
  using (
    exists (
      select 1 from public.user_shows
      where user_shows.id = watched_episodes.user_show_id
        and user_shows.user_id = auth.uid ()
    )
  );

create policy "Users can insert their own watched episodes"
  on public.watched_episodes for insert
  with check (
    exists (
      select 1 from public.user_shows
      where user_shows.id = watched_episodes.user_show_id
        and user_shows.user_id = auth.uid ()
    )
  );

create policy "Users can delete their own watched episodes"
  on public.watched_episodes for delete using (
    exists (
      select 1 from public.user_shows
      where user_shows.id = watched_episodes.user_show_id
        and user_shows.user_id = auth.uid ()
    )
  );

-- Best-effort backfill: episode counts for whole prior seasons live in TMDB,
-- not this database, so this only backfills within the season each show was
-- actually on. Anything from fully-completed earlier seasons will need
-- re-checking in the new episode list.
insert into public.watched_episodes (user_show_id, season_number, episode_number)
select us.id, us.current_season, ep.episode_number
from public.user_shows us
  cross join lateral generate_series(1, us.current_episode) as ep (episode_number)
where us.current_season > 0
  and us.current_episode > 0
on conflict do nothing;

alter table public.user_shows
  drop column current_season,
  drop column current_episode;
