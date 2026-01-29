-- =====================================================
-- POPULATE QUESTIONS MASTER TABLE (Safe Migration v4)
-- =====================================================
-- 1. Ensure ALL required columns exist
DO $$ BEGIN -- Add field_name if missing
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'questions_master'
        AND column_name = 'field_name'
) THEN
ALTER TABLE public.questions_master
ADD COLUMN field_name TEXT;
END IF;
-- Add question_title if missing
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'questions_master'
        AND column_name = 'question_title'
) THEN
ALTER TABLE public.questions_master
ADD COLUMN question_title TEXT;
END IF;
-- Add question_subtitle if missing
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'questions_master'
        AND column_name = 'question_subtitle'
) THEN
ALTER TABLE public.questions_master
ADD COLUMN question_subtitle TEXT;
END IF;
-- Add phase if missing
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'questions_master'
        AND column_name = 'phase'
) THEN
ALTER TABLE public.questions_master
ADD COLUMN phase TEXT;
END IF;
END $$;
-- 2. Ensure STEP_NUMBER has a UNIQUE constraint (Required for ON CONFLICT)
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'questions_master_step_number_key'
) THEN
ALTER TABLE public.questions_master
ADD CONSTRAINT questions_master_step_number_key UNIQUE (step_number);
END IF;
END $$;
-- 3. Populate the table (Explicitly setting ID to avoid not-null constraint errors)
INSERT INTO public.questions_master (
        id,
        step_number,
        field_name,
        question_title,
        question_text,
        question_subtitle,
        category,
        phase,
        input_type,
        display_order
    )
VALUES (
        1,
        1,
        'industry',
        'Industry',
        'What field do you work in?',
        'Foundation of your business',
        'business_info',
        'phase1',
        'select',
        1
    ),
    (
        2,
        2,
        'idealClient',
        'Ideal Client',
        'Who do you help?',
        'WHO you serve',
        'target_audience',
        'phase1',
        'textarea',
        2
    ),
    (
        3,
        3,
        'message',
        'Message',
        'What do you help them with?',
        'WHAT you help them with',
        'core_message',
        'phase1',
        'textarea',
        3
    ),
    (
        4,
        4,
        'coreProblem',
        'Core Problem',
        'What problem are they facing?',
        'Their biggest pain point',
        'problem_definition',
        'phase1',
        'textarea',
        4
    ),
    (
        5,
        5,
        'outcomes',
        'Outcomes',
        'What results do you help them achieve?',
        'Results & benefits',
        'outcomes',
        'phase1',
        'textarea',
        5
    ),
    (
        6,
        6,
        'uniqueAdvantage',
        'Unique Advantage',
        'What makes your approach different?',
        'Your differentiation',
        'differentiation',
        'phase1',
        'textarea',
        6
    ),
    (
        7,
        7,
        'story',
        'Story',
        'Your personal history and mission',
        'Why you do what you do',
        'story',
        'phase1',
        'textarea',
        7
    ),
    (
        8,
        8,
        'testimonials',
        'Testimonials',
        'What client results can you share?',
        'Social proof',
        'social_proof',
        'phase1',
        'textarea',
        8
    ),
    (
        9,
        9,
        'offerProgram',
        'Business Assets',
        'What program or service do you offer?',
        'Your main offer',
        'offer_details',
        'phase1',
        'textarea',
        9
    ),
    (
        10,
        10,
        'deliverables',
        'Deliverables',
        'What do people get when they join?',
        'What''s included',
        'offer_details',
        'phase1',
        'textarea',
        10
    ),
    (
        11,
        11,
        'pricing',
        'Pricing',
        'What do you charge for your service?',
        'Your pricing structure',
        'offer_details',
        'phase1',
        'textarea',
        11
    ),
    (
        12,
        12,
        'assets',
        'Assets',
        'Which marketing assets do you have?',
        'Current marketing assets',
        'assets',
        'phase1',
        'multiselect',
        12
    ),
    (
        13,
        13,
        'revenue',
        'Revenue',
        'What''s your current annual revenue?',
        'Your current revenue level',
        'business_info',
        'phase1',
        'select',
        13
    ),
    (
        14,
        14,
        'brandVoice',
        'Brand Voice',
        'How would you describe your brand personality?',
        'Your brand voice',
        'branding',
        'phase1',
        'textarea',
        14
    ),
    (
        15,
        15,
        'brandColors',
        'Brand Colors',
        'Do you have brand colors or visual style?',
        'Your visual style',
        'branding',
        'phase1',
        'textarea',
        15
    ),
    (
        16,
        16,
        'callToAction',
        'Audience Action',
        'What do you want people to do next?',
        'Your primary call to action',
        'marketing',
        'phase2',
        'textarea',
        16
    ),
    (
        17,
        17,
        'platforms',
        'Platforms',
        'Where do you want to get clients from?',
        'Your target platforms',
        'marketing',
        'phase2',
        'multiselect',
        17
    ),
    (
        18,
        18,
        'goal90Days',
        '90-Day Goal',
        'What is your #1 goal for the next 90 days?',
        'Your immediate focus',
        'goals',
        'phase2',
        'textarea',
        18
    ),
    (
        19,
        19,
        'businessStage',
        'Business Stage',
        'Where are you in your business right now?',
        'Your current business stage',
        'business_info',
        'phase2',
        'select',
        19
    ),
    (
        20,
        20,
        'helpNeeded',
        'Help Needed',
        'What do you need the most help with?',
        'Your biggest challenge',
        'business_info',
        'phase2',
        'textarea',
        20
    ) ON CONFLICT (step_number) DO
UPDATE
SET field_name = EXCLUDED.field_name,
    question_title = EXCLUDED.question_title,
    question_text = EXCLUDED.question_text,
    question_subtitle = EXCLUDED.question_subtitle,
    category = EXCLUDED.category,
    phase = EXCLUDED.phase,
    input_type = EXCLUDED.input_type,
    display_order = EXCLUDED.display_order;
-- 4. Final Cleanup (Optional)
DO $$ BEGIN
ALTER TABLE public.questions_master
ALTER COLUMN field_name
SET NOT NULL;
ALTER TABLE public.questions_master
ALTER COLUMN question_title
SET NOT NULL;
END $$;