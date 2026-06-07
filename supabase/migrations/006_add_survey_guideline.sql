-- Migration to add guideline column to surveys table
alter table public.surveys add column if not exists guideline text;
