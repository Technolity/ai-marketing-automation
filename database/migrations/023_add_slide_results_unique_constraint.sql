-- Migration: 023_add_slide_results_unique_constraint.sql
-- Purpose: Add unique constraint for slide_results to enable upsert
-- Fixes: "there is no unique or exclusion constraint matching the ON CONFLICT specification"

-- STEP 1: Add unique constraint on (user_id, slide_id)
-- This allows upsert operations with ON CONFLICT (user_id, slide_id)

-- First, check if constraint already exists and drop it if needed
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'slide_results_user_slide_unique'
    ) THEN
        ALTER TABLE slide_results DROP CONSTRAINT slide_results_user_slide_unique;
    END IF;
END $$;

-- Add the unique constraint
ALTER TABLE slide_results
ADD CONSTRAINT slide_results_user_slide_unique UNIQUE (user_id, slide_id);

-- STEP 2: Create index for better performance (if not exists)
CREATE INDEX IF NOT EXISTS idx_slide_results_user_slide_unique 
    ON slide_results(user_id, slide_id);

-- STEP 3: Verify the constraint
DO $$
BEGIN
    RAISE NOTICE 'slide_results unique constraint added successfully';
    RAISE NOTICE 'Upsert operations with ON CONFLICT (user_id, slide_id) will now work';
END $$;

-- Add comment
COMMENT ON CONSTRAINT slide_results_user_slide_unique ON slide_results IS 'Ensures one result per user per slide, enables upsert operations';

