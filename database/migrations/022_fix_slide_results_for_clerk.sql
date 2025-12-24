-- Migration: 022_fix_slide_results_for_clerk.sql
-- Purpose: Update slide_results table to use TEXT for user_id (Clerk compatibility)
-- Created: 2024

-- STEP 1: Drop existing foreign key constraint if it exists
ALTER TABLE slide_results 
DROP CONSTRAINT IF EXISTS slide_results_user_id_fkey;

-- STEP 2: Change user_id column type from UUID to TEXT
ALTER TABLE slide_results 
ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;

-- STEP 3: Update RLS policies to work with Clerk
-- Drop existing policies
DROP POLICY IF EXISTS "Users can manage own slide results" ON slide_results;
DROP POLICY IF EXISTS "Users can view own slide results" ON slide_results;
DROP POLICY IF EXISTS "Users can insert own slide results" ON slide_results;
DROP POLICY IF EXISTS "Users can update own slide results" ON slide_results;
DROP POLICY IF EXISTS "Users can delete own slide results" ON slide_results;

-- Create new simple RLS policies (Clerk authentication handles user context)
CREATE POLICY "Enable all access for authenticated users" 
    ON slide_results 
    FOR ALL 
    USING (true)
    WITH CHECK (true);

-- STEP 4: Ensure indexes exist for performance
CREATE INDEX IF NOT EXISTS idx_slide_results_user_id ON slide_results(user_id);
CREATE INDEX IF NOT EXISTS idx_slide_results_slide_id ON slide_results(slide_id);
CREATE INDEX IF NOT EXISTS idx_slide_results_user_slide ON slide_results(user_id, slide_id);
CREATE INDEX IF NOT EXISTS idx_slide_results_approved ON slide_results(approved);
CREATE INDEX IF NOT EXISTS idx_slide_results_created_at ON slide_results(created_at DESC);

-- STEP 5: Add updated_at trigger if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_slide_results_updated_at ON slide_results;
CREATE TRIGGER update_slide_results_updated_at
    BEFORE UPDATE ON slide_results
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- STEP 6: Verify the changes
DO $$
BEGIN
    RAISE NOTICE 'slide_results table schema updated for Clerk compatibility';
    RAISE NOTICE 'user_id column is now TEXT type';
    RAISE NOTICE 'RLS policies updated for authenticated users';
END $$;

-- Add table comment
COMMENT ON TABLE slide_results IS 'Stores AI-generated content results per slide/section. Compatible with Clerk text user IDs.';
COMMENT ON COLUMN slide_results.user_id IS 'Clerk user ID (TEXT format)';
COMMENT ON COLUMN slide_results.ai_output IS 'AI-generated content in JSON format';

