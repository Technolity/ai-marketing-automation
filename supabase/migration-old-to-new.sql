-- =====================================================
-- MIGRATION SCRIPT: Old Schema → New Schema V2
-- =====================================================
-- This script migrates data from the old database structure
-- to the new optimized schema with FUNNELS terminology.
--
-- IMPORTANT: Run this AFTER running schema-redesign-v2.sql
-- IMPORTANT: Backup your database before running this!
-- =====================================================
-- =====================================================
-- STEP 1: MIGRATE USER PROFILES
-- =====================================================
-- Old table already exists, just add new columns
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS max_funnels INTEGER DEFAULT 1,
    ADD COLUMN IF NOT EXISTS current_funnel_count INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS max_seats INTEGER DEFAULT 1,
    ADD COLUMN IF NOT EXISTS current_seat_count INTEGER DEFAULT 0;
-- Set max funnels based on tier
-- Tier 1 (basic): 1 funnel, 1 seat
-- Tier 2 (premium): 3 funnels, 2 seats
-- Tier 3 (enterprise): 10 funnels, 3 seats
-- Admins: unlimited (but we set high numbers for safety)
UPDATE public.user_profiles
SET max_funnels = CASE
        WHEN is_admin = true THEN 9999 -- Unlimited for admin
        WHEN subscription_tier = 'basic' THEN 1
        WHEN subscription_tier = 'premium' THEN 3
        WHEN subscription_tier = 'enterprise' THEN 10
        ELSE 1
    END,
    max_seats = CASE
        WHEN is_admin = true THEN 9999 -- Unlimited for admin
        WHEN subscription_tier = 'basic' THEN 1
        WHEN subscription_tier = 'premium' THEN 2
        WHEN subscription_tier = 'enterprise' THEN 3
        ELSE 1
    END;
-- Rename generation_count to total_generations for clarity (if exists)
DO $$ BEGIN IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'user_profiles'
        AND column_name = 'generation_count'
) THEN
ALTER TABLE public.user_profiles
    RENAME COLUMN generation_count TO total_generations;
END IF;
END $$;
-- =====================================================
-- STEP 2: MIGRATE SAVED SESSIONS → USER FUNNELS
-- =====================================================
-- Each saved_session becomes a user_funnel
INSERT INTO public.user_funnels (
        id,
        user_id,
        funnel_name,
        funnel_description,
        questionnaire_completed,
        questionnaire_completed_at,
        current_step,
        completed_steps,
        vault_generated,
        vault_generated_at,
        vault_generation_status,
        regeneration_counts,
        is_active,
        is_deleted,
        created_at,
        updated_at
    )
SELECT ss.id,
    ss.user_id,
    ss.session_name,
    NULL,
    -- no description in old schema
    ss.is_complete,
    CASE
        WHEN ss.is_complete THEN ss.updated_at
        ELSE NULL
    END,
    ss.current_step,
    ss.completed_steps,
    -- Vault generated if generated_content is not empty
    CASE
        WHEN ss.generated_content IS NOT NULL
        AND ss.generated_content != '{}'::jsonb THEN true
        ELSE false
    END,
    CASE
        WHEN ss.generated_content IS NOT NULL
        AND ss.generated_content != '{}'::jsonb THEN ss.updated_at
        ELSE NULL
    END,
    CASE
        WHEN ss.generated_content IS NOT NULL
        AND ss.generated_content != '{}'::jsonb THEN 'completed'
        ELSE 'not_started'
    END,
    '{}'::jsonb,
    -- Empty regeneration counts
    -- Set most recently updated session as active (limit 1 per user)
    false,
    -- we'll set active in next step
    ss.is_deleted,
    ss.created_at,
    ss.updated_at
FROM public.saved_sessions ss
WHERE NOT ss.is_deleted ON CONFLICT (id) DO NOTHING;
-- Set most recently updated funnel as active for each user
WITH ranked_funnels AS (
    SELECT id,
        user_id,
        ROW_NUMBER() OVER (
            PARTITION BY user_id
            ORDER BY updated_at DESC
        ) as rn
    FROM public.user_funnels
    WHERE NOT is_deleted
)
UPDATE public.user_funnels uf
SET is_active = true
FROM ranked_funnels rf
WHERE uf.id = rf.id
    AND rf.rn = 1;
-- Update funnel count for each user
UPDATE public.user_profiles up
SET current_funnel_count = (
        SELECT COUNT(*)
        FROM public.user_funnels uf
        WHERE uf.user_id = up.id
            AND NOT uf.is_deleted
    );
-- =====================================================
-- STEP 3: MIGRATE ANSWERS → QUESTIONNAIRE RESPONSES
-- =====================================================
-- Old: answers stored as JSONB in saved_sessions.answers
-- New: normalized rows in questionnaire_responses
-- First, ensure questions_master is populated (should be done by schema-redesign-v2.sql)
-- Extract answers from saved_sessions and insert into questionnaire_responses
DO $$
DECLARE session_record RECORD;
question_record RECORD;
answer_value TEXT;
BEGIN -- Loop through each funnel (former saved_session)
FOR session_record IN
SELECT id,
    user_id,
    answers,
    created_at
FROM public.saved_sessions
WHERE NOT is_deleted
    AND answers IS NOT NULL LOOP -- Loop through each question in questions_master
    FOR question_record IN
SELECT id,
    step_number,
    field_name,
    input_type
FROM public.questions_master
ORDER BY step_number LOOP -- Extract answer from JSONB based on field_name
    answer_value := session_record.answers->>question_record.field_name;
-- Only insert if answer exists
IF answer_value IS NOT NULL
AND answer_value != '' THEN
INSERT INTO public.questionnaire_responses (
        funnel_id,
        user_id,
        question_id,
        step_number,
        answer_text,
        answer_selection,
        answer_selections,
        answer_json,
        answered_at,
        updated_at
    )
VALUES (
        session_record.id,
        session_record.user_id,
        question_record.id,
        question_record.step_number,
        -- Handle based on input type
        CASE
            WHEN question_record.input_type = 'textarea' THEN answer_value
            ELSE NULL
        END,
        CASE
            WHEN question_record.input_type = 'select' THEN answer_value
            ELSE NULL
        END,
        -- For multiselect, try to parse JSON array
        CASE
            WHEN question_record.input_type = 'multiselect' THEN CASE
                WHEN answer_value LIKE '[%]' THEN ARRAY(
                    SELECT jsonb_array_elements_text(answer_value::jsonb)
                )
                ELSE ARRAY [answer_value]
            END
            ELSE NULL
        END,
        session_record.answers->question_record.field_name,
        session_record.created_at,
        session_record.created_at
    ) ON CONFLICT (funnel_id, question_id) DO NOTHING;
END IF;
END LOOP;
END LOOP;
END $$;
-- =====================================================
-- STEP 4: MIGRATE SLIDE RESULTS → VAULT CONTENT
-- =====================================================
-- Old: slide_results table with slide_id (numeric key)
-- New: vault_content with section_id, versioning, phases
-- Mapping of slide_id to section_id and metadata
DO $$
DECLARE result_record RECORD;
vault_section_id TEXT;
vault_section_title TEXT;
vault_phase TEXT;
funnel_id_val UUID;
BEGIN FOR result_record IN
SELECT sr.*,
    uf.id as funnel_id_val
FROM public.slide_results sr -- Join to find the funnel (we'll use the user's active funnel, or most recent)
    LEFT JOIN LATERAL (
        SELECT id
        FROM public.user_funnels
        WHERE user_id = sr.user_id
            AND NOT is_deleted
        ORDER BY is_active DESC,
            updated_at DESC
        LIMIT 1
    ) uf ON true
WHERE sr.ai_output IS NOT NULL
    AND sr.ai_output != '{}'::jsonb LOOP -- Map slide_id to section metadata
    vault_section_id := CASE
        result_record.slide_id
        WHEN 1 THEN 'idealClient'
        WHEN 2 THEN 'message'
        WHEN 3 THEN 'story'
        WHEN 4 THEN 'offer'
        WHEN 5 THEN 'salesScripts'
        WHEN 6 THEN 'freeGift' -- Changed from leadMagnet!
        WHEN 7 THEN 'vsl'
        WHEN 8 THEN 'emails'
        WHEN 9 THEN 'facebookAds'
        WHEN 10 THEN 'funnelCopy'
        WHEN 11 THEN 'contentIdeas'
        WHEN 12 THEN 'program12Month'
        WHEN 13 THEN 'youtubeShow'
        WHEN 14 THEN 'contentPillars'
        WHEN 15 THEN 'bio'
        WHEN 16 THEN 'appointmentReminders'
        ELSE NULL
    END;
vault_section_title := CASE
    result_record.slide_id
    WHEN 1 THEN 'Ideal Client'
    WHEN 2 THEN 'Message'
    WHEN 3 THEN 'Story'
    WHEN 4 THEN 'Offer & Pricing'
    WHEN 5 THEN 'Sales Script'
    WHEN 6 THEN 'Free Gift' -- Changed from Lead Magnet!
    WHEN 7 THEN 'Marketing Funnel'
    WHEN 8 THEN '15-Day Email Sequence'
    WHEN 9 THEN 'Facebook Ads'
    WHEN 10 THEN 'Funnel Page Copy'
    WHEN 11 THEN 'Content Ideas'
    WHEN 12 THEN '12-Month Program'
    WHEN 13 THEN 'YouTube Show'
    WHEN 14 THEN 'Content Pillars'
    WHEN 15 THEN 'Professional Bio'
    WHEN 16 THEN 'Appointment Reminders'
    ELSE NULL
END;
vault_phase := CASE
    WHEN result_record.slide_id BETWEEN 1 AND 6 THEN 'phase1'
    WHEN result_record.slide_id BETWEEN 7 AND 16 THEN 'phase2'
    ELSE 'phase1'
END;
-- Skip if no mapping found
CONTINUE
WHEN vault_section_id IS NULL;
-- Insert into vault_content
INSERT INTO public.vault_content (
        funnel_id,
        user_id,
        section_id,
        section_title,
        numeric_key,
        phase,
        version,
        is_current_version,
        content,
        status,
        approved_at,
        is_locked,
        unlocked_at,
        created_at,
        updated_at
    )
VALUES (
        COALESCE(result_record.funnel_id_val, gen_random_uuid()),
        -- fallback to new UUID if no funnel found
        result_record.user_id,
        vault_section_id,
        vault_section_title,
        result_record.slide_id,
        vault_phase,
        1,
        -- initial version
        true,
        -- current version
        result_record.ai_output,
        CASE
            WHEN result_record.approved THEN 'approved'
            ELSE 'draft'
        END,
        CASE
            WHEN result_record.approved THEN result_record.updated_at
            ELSE NULL
        END,
        false,
        -- unlocked since it exists
        result_record.created_at,
        result_record.created_at,
        result_record.updated_at
    ) ON CONFLICT (funnel_id, section_id, is_current_version)
WHERE is_current_version = true DO NOTHING;
END LOOP;
END $$;
-- =====================================================
-- STEP 5: UPDATE VAULT STATUS IN USER FUNNELS
-- =====================================================
-- Mark funnels as having vault content if they have any vault_content entries
UPDATE public.user_funnels uf
SET vault_generated = true,
    vault_generation_status = 'completed',
    vault_generated_at = (
        SELECT MIN(created_at)
        FROM public.vault_content vc
        WHERE vc.funnel_id = uf.id
    )
WHERE EXISTS (
        SELECT 1
        FROM public.vault_content vc
        WHERE vc.funnel_id = uf.id
    );
-- Mark Phase 1 as approved if all Phase 1 sections are approved
UPDATE public.user_funnels uf
SET phase1_approved = true,
    phase1_approved_at = (
        SELECT MAX(approved_at)
        FROM public.vault_content vc
        WHERE vc.funnel_id = uf.id
            AND vc.phase = 'phase1'
            AND vc.status = 'approved'
    )
WHERE (
        SELECT COUNT(*)
        FROM public.vault_content vc
        WHERE vc.funnel_id = uf.id
            AND vc.phase = 'phase1'
            AND vc.is_current_version = true
            AND vc.status = 'approved'
    ) >= 6;
-- All 6 Phase 1 sections approved
-- Unlock Phase 2 if Phase 1 is approved
UPDATE public.user_funnels
SET phase2_unlocked = phase1_approved,
    phase2_unlocked_at = phase1_approved_at
WHERE phase1_approved = true;
-- =====================================================
-- STEP 6: CLEANUP (OPTIONAL - KEEP OLD TABLES FOR SAFETY)
-- =====================================================
-- DON'T DROP old tables immediately - keep for rollback safety
-- After confirming migration success (1-2 weeks), you can drop:
-- DROP TABLE IF EXISTS public.saved_sessions CASCADE;
-- DROP TABLE IF EXISTS public.slide_results CASCADE;
-- DROP TABLE IF EXISTS public.intake_answers CASCADE;
-- Instead, rename them for archival:
DO $$ BEGIN IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_name = 'saved_sessions'
) THEN
ALTER TABLE public.saved_sessions
    RENAME TO saved_sessions_old;
END IF;
IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_name = 'slide_results'
) THEN
ALTER TABLE public.slide_results
    RENAME TO slide_results_old;
END IF;
IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_name = 'intake_answers'
) THEN
ALTER TABLE public.intake_answers
    RENAME TO intake_answers_old;
END IF;
END $$;
-- =====================================================
-- STEP 7: VERIFICATION QUERIES
-- =====================================================
-- Run these to verify migration success:
-- Check user profiles updated
SELECT id,
    email,
    subscription_tier,
    is_admin,
    max_funnels,
    current_funnel_count,
    max_seats
FROM public.user_profiles
LIMIT 5;
-- Check funnels created
SELECT uf.id,
    uf.user_id,
    uf.funnel_name,
    uf.questionnaire_completed,
    uf.vault_generated,
    uf.is_active
FROM public.user_funnels uf
LIMIT 5;
-- Check questionnaire responses
SELECT qr.funnel_id,
    qm.step_number,
    qm.field_name,
    qr.answer_text,
    qr.answer_selection,
    qr.answer_selections
FROM public.questionnaire_responses qr
    JOIN public.questions_master qm ON qr.question_id = qm.id
ORDER BY qr.funnel_id,
    qm.step_number
LIMIT 20;
-- Check vault content
SELECT vc.funnel_id,
    vc.section_id,
    vc.section_title,
    vc.phase,
    vc.status,
    vc.is_current_version,
    vc.is_locked
FROM public.vault_content vc
WHERE vc.is_current_version = true
ORDER BY vc.funnel_id,
    vc.numeric_key
LIMIT 20;
-- Check counts match
SELECT 'Old Sessions' as table_name,
    COUNT(*) as count
FROM public.saved_sessions_old
WHERE NOT is_deleted
UNION ALL
SELECT 'New Funnels' as table_name,
    COUNT(*) as count
FROM public.user_funnels
WHERE NOT is_deleted
UNION ALL
SELECT 'Old Slide Results' as table_name,
    COUNT(*) as count
FROM public.slide_results_old
UNION ALL
SELECT 'New Vault Content (current)' as table_name,
    COUNT(*) as count
FROM public.vault_content
WHERE is_current_version = true;
-- =====================================================
-- END OF MIGRATION
-- =====================================================
-- Post-migration checklist:
-- ✅ Verify user_profiles has new columns (max_funnels, max_seats)
-- ✅ Verify user_funnels has all sessions migrated
-- ✅ Verify questionnaire_responses has all answers
-- ✅ Verify vault_content has all generated content
-- ✅ Verify admin users have unlimited (9999) limits
-- ✅ Test application with new schema
-- ✅ Monitor for issues for 1-2 weeks
-- ✅ After confidence, drop old tables (saved_sessions_old, etc.)