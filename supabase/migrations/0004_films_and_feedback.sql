-- Films get their own table rather than a media_type column bolted onto
-- user_shows: the two are different enough (no episodes, two states not
-- three) that a shared table would need conditionals wrapping most of its
-- rows anyway, and this way the existing, already-live TV data/RLS is
-- completely untouched by this migration.

create type film_status as enum ('to_watch', 'watched');

create table public.user_films (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  tmdb_id integer not null,
  title text not null,
  poster_path text,
  status film_status not null default 'to_watch',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, tmdb_id)
);

alter table public.user_films enable row level security;

create policy "Users can view their own films"
  on public.user_films for select
  using (auth.uid () = user_id);

create policy "Users can insert their own films"
  on public.user_films for insert
  with check (auth.uid () = user_id);

create policy "Users can update their own films"
  on public.user_films for update
  using (auth.uid () = user_id)
  with check (auth.uid () = user_id);

create policy "Users can delete their own films"
  on public.user_films for delete using (auth.uid () = user_id);

create trigger user_films_set_updated_at
  before update on public.user_films
  for each row
  execute function public.set_updated_at ();

-- Schema only for now -- no sharing UI ships with this migration. Added
-- alongside user_films because it's a near-identical copy of the
-- already-proven show_shares pattern, cheap to include now vs. a second
-- migration later. Reuses share_status from 0003_sharing.sql; the state
-- machine is identical, no reason for the two flows to diverge.
create table public.film_shares (
  id uuid primary key default gen_random_uuid(),
  from_user_id uuid not null references public.profiles (id) on delete cascade,
  to_user_id uuid not null references public.profiles (id) on delete cascade,
  tmdb_id integer not null,
  title text not null,
  poster_path text,
  status share_status not null default 'pending',
  created_at timestamptz not null default now(),
  check (from_user_id <> to_user_id)
);

create unique index film_shares_unique_pending on public.film_shares (from_user_id, to_user_id, tmdb_id)
where status = 'pending';

alter table public.film_shares enable row level security;

create policy "Users can view film shares they sent or received"
  on public.film_shares for select
  using (auth.uid () = from_user_id or auth.uid () = to_user_id);

create policy "Users can send film shares from themselves"
  on public.film_shares for insert
  with check (auth.uid () = from_user_id);

create policy "Recipients can update the status of film shares sent to them"
  on public.film_shares for update
  using (auth.uid () = to_user_id)
  with check (auth.uid () = to_user_id);

-- Simple feedback box: submit-only from the app, read directly in the
-- Supabase dashboard (which bypasses RLS) rather than through app code --
-- so there's deliberately no select/update/delete policy here. Any insert
-- that tried to .select() the row back would fail outright with no select
-- policy to satisfy the RETURNING clause, so lib/feedback.ts must not
-- chain .select() after the insert.
create table public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  message text not null check (char_length(trim(message)) > 0),
  created_at timestamptz not null default now()
);

alter table public.feedback enable row level security;

create policy "Users can submit feedback"
  on public.feedback for insert
  with check (auth.uid () = user_id);
