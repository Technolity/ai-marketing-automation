-- ============================================
-- COMPLETE DATABASE SETUP FOR VAULT PERSISTENCE
-- Run this ONCE in Supabase SQL Editor
-- ============================================
-- This script ensures all required columns exist
-- and properly syncs data without any data loss
-- ============================================
-- ============================================
-- STEP 1: SAVED_SESSIONS TABLE - Core Storage
-- ============================================
-- Add all required JSONB columns for content storage
ALTER TABLE saved_sessions
ADD COLUMN IF NOT EXISTS results_data JSONB DEFAULT '{}'::jsonb;
ALTER TABLE saved_sessions
ADD COLUMN IF NOT EXISTS generated_content JSONB DEFAULT '{}'::jsonb;
ALTER TABLE saved_sessions
ADD COLUMN IF NOT EXISTS intake_data JSONB DEFAULT '{}'::jsonb;
ALTER TABLE saved_sessions
ADD COLUMN IF NOT EXISTS onboarding_data JSONB DEFAULT '{}'::jsonb;
ALTER TABLE saved_sessions
ADD COLUMN IF NOT EXISTS answers JSONB DEFAULT '{}'::jsonb;
-- Add metadata columns
ALTER TABLE saved_sessions
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
ALTER TABLE saved_sessions
ADD COLUMN IF NOT EXISTS is_complete BOOLEAN DEFAULT FALSE;
ALTER TABLE saved_sessions
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE saved_sessions
ADD COLUMN IF NOT EXISTS current_step INTEGER DEFAULT 0;
ALTER TABLE saved_sessions
ADD COLUMN IF NOT EXISTS completed_steps JSONB DEFAULT '[]'::jsonb;
-- Add timestamps if missing
ALTER TABLE saved_sessions
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE saved_sessions
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
-- ============================================
-- STEP 2: PHASE_APPROVALS TABLE
-- ============================================
-- Create table if not exists
CREATE TABLE IF NOT EXISTS phase_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    session_id UUID REFERENCES saved_sessions(id) ON DELETE CASCADE,
    business_core_approvals JSONB DEFAULT '[]'::jsonb,
    funnel_assets_approvals JSONB DEFAULT '[]'::jsonb,
    funnel_approved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- Add funnel_approved column if table already exists
ALTER TABLE phase_approvals
ADD COLUMN IF NOT EXISTS funnel_approved BOOLEAN DEFAULT FALSE;
-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_phase_approvals_user_session ON phase_approvals(user_id, session_id);
-- ============================================
-- STEP 3: DATA SYNCHRONIZATION
-- ============================================
-- Sync results_data from generated_content where empty
UPDATE saved_sessions
SET results_data = generated_content
WHERE (
        results_data IS NULL
        OR results_data = '{}'::jsonb
    )
    AND generated_content IS NOT NULL
    AND generated_content != '{}'::jsonb;
-- Sync generated_content from results_data where empty  
UPDATE saved_sessions
SET generated_content = results_data
WHERE (
        generated_content IS NULL
        OR generated_content = '{}'::jsonb
    )
    AND results_data IS NOT NULL
    AND results_data != '{}'::jsonb;
-- Sync intake_data from onboarding_data
UPDATE saved_sessions
SET intake_data = onboarding_data
WHERE (
        intake_data IS NULL
        OR intake_data = '{}'::jsonb
    )
    AND onboarding_data IS NOT NULL
    AND onboarding_data != '{}'::jsonb;
-- Sync intake_data from answers if still empty
UPDATE saved_sessions
SET intake_data = answers
WHERE (
        intake_data IS NULL
        OR intake_data = '{}'::jsonb
    )
    AND answers IS NOT NULL
    AND answers != '{}'::jsonb;
-- ============================================
-- STEP 4: RLS POLICIES (Optional but Recommended)
-- ============================================
-- Enable RLS on saved_sessions if not already
ALTER TABLE saved_sessions ENABLE ROW LEVEL SECURITY;
-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own sessions" ON saved_sessions;
DROP POLICY IF EXISTS "Users can insert own sessions" ON saved_sessions;
DROP POLICY IF EXISTS "Users can update own sessions" ON saved_sessions;
DROP POLICY IF EXISTS "Users can delete own sessions" ON saved_sessions;
-- Create policies (these use service role key so they're permissive)
CREATE POLICY "Users can view own sessions" ON saved_sessions FOR
SELECT USING (true);
CREATE POLICY "Users can insert own sessions" ON saved_sessions FOR
INSERT WITH CHECK (true);
CREATE POLICY "Users can update own sessions" ON saved_sessions FOR
UPDATE USING (true);
CREATE POLICY "Users can delete own sessions" ON saved_sessions FOR DELETE USING (true);
-- Enable RLS on phase_approvals
ALTER TABLE phase_approvals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own approvals" ON phase_approvals;
CREATE POLICY "Users can manage own approvals" ON phase_approvals FOR ALL USING (true);
-- ============================================
-- STEP 5: VERIFICATION QUERY
-- ============================================
-- Run this to verify the setup
SELECT column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'saved_sessions'
ORDER BY ordinal_position;
-- ============================================
-- SUCCESS! Your database is now ready.
-- ============================================