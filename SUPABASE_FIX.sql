-- RUN THIS IN YOUR SUPABASE SQL EDITOR
-- 1. Add funnel_approved to phase_approvals
ALTER TABLE phase_approvals
ADD COLUMN IF NOT EXISTS funnel_approved BOOLEAN DEFAULT FALSE;
-- 2. Add intake_data to saved_sessions (used by regenerate and refine APIs)
ALTER TABLE saved_sessions
ADD COLUMN IF NOT EXISTS intake_data JSONB DEFAULT '{}'::jsonb;
-- 3. Ensure results_data column exists (used to store regenerated content)
ALTER TABLE saved_sessions
ADD COLUMN IF NOT EXISTS results_data JSONB DEFAULT '{}'::jsonb;
-- 4. Ensure generated_content column exists
ALTER TABLE saved_sessions
ADD COLUMN IF NOT EXISTS generated_content JSONB DEFAULT '{}'::jsonb;
-- 5. Update saved_sessions with existing data
UPDATE saved_sessions
SET intake_data = onboarding_data
WHERE (
        intake_data = '{}'::jsonb
        OR intake_data IS NULL
    )
    AND onboarding_data IS NOT NULL;
UPDATE saved_sessions
SET intake_data = answers
WHERE (
        intake_data = '{}'::jsonb
        OR intake_data IS NULL
    )
    AND answers IS NOT NULL;
-- 6. Sync results_data with generated_content if empty
UPDATE saved_sessions
SET results_data = generated_content
WHERE (
        results_data = '{}'::jsonb
        OR results_data IS NULL
    )
    AND generated_content IS NOT NULL
    AND generated_content != '{}'::jsonb;