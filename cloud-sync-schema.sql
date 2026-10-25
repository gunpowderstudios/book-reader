-- Run in Supabase SQL editor. Requires Supabase Auth (email magic links).
create table if not exists public.reading_positions (
  user_id uuid not null references auth.users(id) on delete cascade,
  book_id text not null,
  chapter_index integer not null default 0 check (chapter_index >= 0),
  paragraph_index integer not null default 0 check (paragraph_index >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, book_id)
);
alter table public.reading_positions enable row level security;
revoke all on public.reading_positions from anon;
grant select, insert, update, delete on public.reading_positions to authenticated;
drop policy if exists "read own book progress" on public.reading_positions;
drop policy if exists "write own book progress" on public.reading_positions;
drop policy if exists "update own book progress" on public.reading_positions;
create policy "read own book progress" on public.reading_positions
 for select to authenticated using ((select auth.uid()) = user_id);
create policy "write own book progress" on public.reading_positions
 for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "update own book progress" on public.reading_positions
 for update to authenticated using ((select auth.uid()) = user_id)
 with check ((select auth.uid()) = user_id);
