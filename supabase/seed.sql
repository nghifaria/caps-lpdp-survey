do $$
declare
  survey_id uuid;
begin
  insert into public.surveys (title, is_active)
  values ('Survei Kepuasan Layanan LPDP 2026', true)
  returning id into survey_id;

  insert into public.questions (
    survey_id,
    question_text,
    question_type,
    options,
    is_required,
    branching_logic
  )
  values
    (
      survey_id,
      'Nama Lengkap Awardee',
      'short_text',
      null,
      true,
      null
    ),
    (
      survey_id,
      'Asal Provinsi',
      'dropdown',
      '["Jakarta","Jawa Barat","Jawa Tengah","Jawa Timur"]'::jsonb,
      true,
      null
    ),
    (
      survey_id,
      'Kepuasan Layanan Monitoring',
      'dual_likert',
      null,
      true,
      '{
        "show_reason_if": {
          "field": "score_performance",
          "operator": "<",
          "value": 3,
          "target": "reason"
        }
      }'::jsonb
    );
end $$;