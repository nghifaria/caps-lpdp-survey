-- Migration 004: Survey Enhancements Phase 2 (Archive & Duplicate)

-- 1. Add is_archived column
ALTER TABLE public.surveys ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT false;

-- 2. Update view survey_with_question_count to include is_archived
CREATE OR REPLACE VIEW public.survey_with_question_count AS
SELECT 
  s.id,
  s.title,
  s.is_active,
  s.is_archived,
  s.created_at,
  COUNT(q.id) AS question_count
FROM public.surveys s
LEFT JOIN public.questions q ON s.id = q.survey_id
GROUP BY s.id;

-- Ensure permissions on view
GRANT SELECT ON public.survey_with_question_count TO authenticated;
GRANT SELECT ON public.survey_with_question_count TO anon;

-- 3. Create function duplicate_survey
CREATE OR REPLACE FUNCTION public.duplicate_survey(source_survey_id UUID)
RETURNS UUID AS $$
DECLARE
    new_survey_id UUID;
    source_survey RECORD;
    section_record RECORD;
    new_section_id UUID;
BEGIN
    -- Check if source survey exists
    SELECT * INTO source_survey FROM public.surveys WHERE id = source_survey_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Survey % not found', source_survey_id;
    END IF;

    -- Create new survey
    INSERT INTO public.surveys (title, is_active, is_archived)
    VALUES (source_survey.title || ' (Salinan)', false, false)
    RETURNING id INTO new_survey_id;

    -- Loop through sections and copy them
    FOR section_record IN 
        SELECT * FROM public.sections WHERE survey_id = source_survey_id ORDER BY order_index
    LOOP
        -- Insert section and get new section id
        INSERT INTO public.sections (survey_id, title, description, order_index)
        VALUES (new_survey_id, section_record.title, section_record.description, section_record.order_index)
        RETURNING id INTO new_section_id;

        -- Copy questions for this section
        INSERT INTO public.questions (survey_id, section_id, question_text, question_type, options, is_required, branching_logic, order_index)
        SELECT 
            new_survey_id, 
            new_section_id, 
            question_text, 
            question_type, 
            options, 
            is_required, 
            branching_logic, 
            order_index
        FROM public.questions
        WHERE section_id = section_record.id;
        
    END LOOP;

    -- Copy orphan questions (if any)
    INSERT INTO public.questions (survey_id, section_id, question_text, question_type, options, is_required, branching_logic, order_index)
    SELECT 
        new_survey_id, 
        NULL, 
        question_text, 
        question_type, 
        options, 
        is_required, 
        branching_logic, 
        order_index
    FROM public.questions
    WHERE survey_id = source_survey_id AND section_id IS NULL;

    RETURN new_survey_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
