-- ============================================================
-- Migration 001: Tambah order_index ke tabel questions
--               + RLS policy untuk UPDATE questions oleh admin
-- ============================================================

-- 1. Tambah kolom order_index (nullable sementara untuk isi data dulu)
ALTER TABLE public.questions
  ADD COLUMN IF NOT EXISTS order_index integer;

-- 2. Isi order_index berdasarkan urutan abjad question_text per survey
--    (backward-compatible: data lama tetap terjaga)
WITH numbered AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY survey_id
      ORDER BY question_text
    ) - 1 AS rn
  FROM public.questions
  WHERE order_index IS NULL
)
UPDATE public.questions
SET order_index = numbered.rn
FROM numbered
WHERE public.questions.id = numbered.id;

-- 3. Set default dan NOT NULL setelah data terisi
ALTER TABLE public.questions
  ALTER COLUMN order_index SET DEFAULT 0,
  ALTER COLUMN order_index SET NOT NULL;

-- 4. Tambah RLS policy UPDATE untuk admin
--    (sebelumnya tidak ada, menyebabkan edit pertanyaan selalu gagal)
DROP POLICY IF EXISTS "questions_update_admin" ON public.questions;

CREATE POLICY "questions_update_admin"
  ON public.questions
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
