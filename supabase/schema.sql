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

alter table public.surveys enable row level security;
alter table public.questions enable row level security;
alter table public.responses enable row level security;
alter table public.answers enable row level security;

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
