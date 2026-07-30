-- Each row is one show on one user's tracker. Row Level Security below is
-- what actually enforces "every account only ever sees its own shows" --
-- not application code, so it holds even if a future client has a bug.

create type show_status as enum ('library', 'watching', 'finished');

create table if not exists public.user_shows (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  tmdb_id integer not null,
  title text not null,
  poster_path text,
  status show_status not null default 'library',
  current_season integer not null default 0,
  current_episode integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, tmdb_id)
);

alter table public.user_shows enable row level security;

create policy "Users can view their own shows"
  on public.user_shows for select
  using (auth.uid () = user_id);

create policy "Users can insert their own shows"
  on public.user_shows for insert
  with check (auth.uid () = user_id);

create policy "Users can update their own shows"
  on public.user_shows for update
  using (auth.uid () = user_id)
  with check (auth.uid () = user_id);

create policy "Users can delete their own shows"
  on public.user_shows for delete using (auth.uid () = user_id);

create or replace function public.set_updated_at () returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger user_shows_set_updated_at
  before update on public.user_shows
  for each row
  execute function public.set_updated_at ();
