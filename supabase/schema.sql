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
  updated_at timestamptz not null default now()
);

alter table public.surveys enable row level security;
alter table public.questions enable row level security;
alter table public.responses enable row level security;
alter table public.answers enable row level security;
alter table public.profiles enable row level security;

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
  insert into public.profiles (id, full_name, avatar_url, updated_at)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    null,
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
