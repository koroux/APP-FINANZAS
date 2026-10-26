-- Run in the SQL editor of your own Supabase project. Contains no credentials.
create table if not exists public.finance_profiles (
 user_id uuid primary key references auth.users(id) on delete cascade,
 data jsonb not null default '{}'::jsonb,
 updated_at timestamptz not null default now()
);
alter table public.finance_profiles enable row level security;
drop policy if exists "Owner reads profile" on public.finance_profiles;
create policy "Owner reads profile" on public.finance_profiles for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "Owner inserts profile" on public.finance_profiles;
create policy "Owner inserts profile" on public.finance_profiles for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "Owner updates profile" on public.finance_profiles;
create policy "Owner updates profile" on public.finance_profiles for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
