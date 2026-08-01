-- Lets one account share a show with another, who can then add it to
-- their own list. One-time nudge, not an ongoing sync: after acceptance
-- the two accounts' entries are completely independent, same as if
-- they'd each added the show themselves.

-- Minimal public profile (id + display name only -- nothing from
-- auth.users itself) so the app can list other accounts to share with,
-- without exposing anything sensitive.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Authenticated users can view all profiles"
  on public.profiles for select
  to authenticated
  using (true);

-- Auto-create a profile for every new account, invite-only signups included.
create function public.handle_new_user() returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user ();

-- Backfill for accounts that already existed before this migration.
insert into public.profiles (id, display_name)
select id, coalesce(raw_user_meta_data ->> 'display_name', split_part(email, '@', 1))
from auth.users
on conflict (id) do nothing;

create type share_status as enum ('pending', 'accepted', 'dismissed');

create table public.show_shares (
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

-- One pending share of a given show between the same two people at a time;
-- sharing again after it's been accepted/dismissed is still fine.
create unique index show_shares_unique_pending on public.show_shares (from_user_id, to_user_id, tmdb_id)
where status = 'pending';

alter table public.show_shares enable row level security;

create policy "Users can view shares they sent or received"
  on public.show_shares for select
  using (auth.uid () = from_user_id or auth.uid () = to_user_id);

create policy "Users can send shares from themselves"
  on public.show_shares for insert
  with check (auth.uid () = from_user_id);

create policy "Recipients can update the status of shares sent to them"
  on public.show_shares for update
  using (auth.uid () = to_user_id)
  with check (auth.uid () = to_user_id);
