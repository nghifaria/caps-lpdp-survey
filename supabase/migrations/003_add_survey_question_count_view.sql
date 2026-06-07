-- ============================================================
-- Migration 003: View survey_with_question_count
--               Menghitung jumlah pertanyaan per survei secara
--               efisien dalam satu query (eliminasi N+1 problem)
-- ============================================================

CREATE OR REPLACE VIEW public.survey_with_question_count AS
  SELECT
    s.id,
    s.title,
    s.is_active,
    s.created_at,
    COUNT(q.id)::integer AS question_count
  FROM public.surveys s
  LEFT JOIN public.questions q ON q.survey_id = s.id
  GROUP BY s.id, s.title, s.is_active, s.created_at;

-- Grant akses ke view untuk pengguna authenticated dan anon
GRANT SELECT ON public.survey_with_question_count TO authenticated, anon;
