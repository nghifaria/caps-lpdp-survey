-- ============================================================
-- Migration 002: Buat tabel sections
--               + Tambah section_id ke questions
--               + Migrasi data lama ke section "Umum"
-- ============================================================

-- 1. Buat tabel sections
CREATE TABLE IF NOT EXISTS public.sections (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id   uuid        NOT NULL REFERENCES public.surveys(id) ON DELETE CASCADE,
  title       text        NOT NULL,
  description text,
  order_index integer     NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- 2. Aktifkan Row Level Security
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
DROP POLICY IF EXISTS "sections_select_public"  ON public.sections;
DROP POLICY IF EXISTS "sections_insert_admin"   ON public.sections;
DROP POLICY IF EXISTS "sections_update_admin"   ON public.sections;
DROP POLICY IF EXISTS "sections_delete_admin"   ON public.sections;

CREATE POLICY "sections_select_public"
  ON public.sections FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "sections_insert_admin"
  ON public.sections FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "sections_update_admin"
  ON public.sections FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "sections_delete_admin"
  ON public.sections FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- 4. Tambah kolom section_id ke questions (nullable — backward compatible)
ALTER TABLE public.questions
  ADD COLUMN IF NOT EXISTS section_id uuid REFERENCES public.sections(id) ON DELETE SET NULL;

-- 5. Migrasi data lama:
--    Buat satu section "Umum" untuk setiap survei yang sudah ada,
--    lalu assign semua pertanyaan lama ke section tersebut.
INSERT INTO public.sections (survey_id, title, order_index, created_at)
SELECT DISTINCT survey_id, 'Umum', 0, now()
FROM public.questions
WHERE section_id IS NULL
ON CONFLICT DO NOTHING;

-- 6. Assign pertanyaan lama ke section "Umum" milik survey-nya
UPDATE public.questions q
SET section_id = s.id
FROM public.sections s
WHERE s.survey_id = q.survey_id
  AND s.title = 'Umum'
  AND q.section_id IS NULL;
