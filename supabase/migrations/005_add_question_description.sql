-- Migration to add description column to questions table
alter table public.questions add column if not exists description text;
