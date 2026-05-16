create extension if not exists pgcrypto;

create table if not exists public.surveys (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  survey_id uuid not null references public.surveys (id) on delete cascade,
  question_text text not null,
  question_type text not null,
  options jsonb,
  is_required boolean not null default false,
  branching_logic jsonb
);

create table if not exists public.responses (
  id uuid primary key default gen_random_uuid(),
  survey_id uuid not null references public.surveys (id) on delete cascade,
  submitted_at timestamptz not null default now()
);

create table if not exists public.answers (
  id uuid primary key default gen_random_uuid(),
  response_id uuid not null references public.responses (id) on delete cascade,
  question_id uuid not null references public.questions (id) on delete cascade,
  text_value text,
  score_performance integer,
  score_importance integer,
  reason text
);

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  avatar_url text,
  role text not null default 'awardee',
  updated_at timestamptz not null default now()
);

alter table public.surveys enable row level security;
alter table public.questions enable row level security;
alter table public.responses enable row level security;
alter table public.answers enable row level security;
alter table public.profiles enable row level security;

alter table public.profiles
  add column if not exists role text;

update public.profiles
set role = coalesce(role, 'awardee');

alter table public.profiles
  alter column role set default 'awardee';

alter table public.profiles
  alter column role set not null;

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

grant execute on function public.is_admin() to authenticated;

create or replace function public.list_profiles_for_admin()
returns table (
  id uuid,
  full_name text,
  email text,
  role text,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not public.is_admin() then
    raise exception 'Only admins can list users.';
  end if;

  return query
    select
      profiles.id,
      profiles.full_name::text,
      users.email::text,
      profiles.role::text,
      profiles.updated_at
    from public.profiles as profiles
    join auth.users as users on users.id = profiles.id
    order by profiles.updated_at desc;
end;
$$;

grant execute on function public.list_profiles_for_admin() to authenticated;

create or replace function public.set_user_role(target_user_id uuid, next_role text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Only admins can change user roles.';
  end if;

  if target_user_id = auth.uid() then
    raise exception 'Admins cannot change their own role.';
  end if;

  update public.profiles
  set role = next_role
  where id = target_user_id;

  return true;
end;
$$;

grant execute on function public.set_user_role(uuid, text) to authenticated;

create or replace function public.set_survey_status(survey_id uuid, next_status boolean)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Only admins can update survey status.';
  end if;

  update public.surveys
  set is_active = next_status
  where id = survey_id;

  return true;
end;
$$;

grant execute on function public.set_survey_status(uuid, boolean) to authenticated;

create or replace function public.prevent_role_changes()
returns trigger
language plpgsql
as $$
begin
  if new.role is distinct from old.role and not public.is_admin() then
    raise exception 'Only admins can change user roles.';
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_role_changes on public.profiles;

create trigger enforce_role_changes
  before update on public.profiles
  for each row execute procedure public.prevent_role_changes();

create policy "surveys_select_authenticated"
  on public.surveys
  for select
  to authenticated
  using (true);

create policy "surveys_select_public"
  on public.surveys
  for select
  to anon, authenticated
  using (true);

create policy "surveys_update_authenticated"
  on public.surveys
  for update
  to authenticated
  using (true)
  with check (true);

create policy "surveys_insert_admin"
  on public.surveys
  for insert
  to authenticated
  with check (public.is_admin());

create policy "surveys_delete_admin"
  on public.surveys
  for delete
  to authenticated
  using (public.is_admin());

create policy "questions_select_public"
  on public.questions
  for select
  to anon, authenticated
  using (true);

create policy "responses_select_authenticated"
  on public.responses
  for select
  to authenticated
  using (true);

create policy "responses_insert_public"
  on public.responses
  for insert
  to anon, authenticated
  with check (true);

create policy "answers_select_authenticated"
  on public.answers
  for select
  to authenticated
  using (true);

create policy "answers_insert_public"
  on public.answers
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "profiles_update_admin" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;

create policy "profiles_select_own"
  on public.profiles
  for select
  to authenticated
  using (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "profiles_update_admin"
  on public.profiles
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "profiles_insert_own"
  on public.profiles
  for insert
  to authenticated
  with check (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url, role, updated_at)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    null,
    'awardee',
    now()
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "avatars_public_read"
  on storage.objects
  for select
  to public
  using (bucket_id = 'avatars');

create policy "avatars_authenticated_upload"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'avatars');

create or replace function public.get_survey_response_count(survey_uuid uuid)
returns bigint
language sql
security definer
set search_path = public
as $$
  select count(*)::bigint
  from public.responses
  where survey_id = survey_uuid;
$$;

grant execute on function public.get_survey_response_count(uuid) to anon, authenticated;
