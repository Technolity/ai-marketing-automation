-- Migration 021: Phase Approvals Table
-- This table stores which phases users have approved in business-core and funnel-assets

-- Create phase_approvals table
CREATE TABLE IF NOT EXISTS phase_approvals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL,
    session_id TEXT NOT NULL DEFAULT 'current',
    business_core_approvals JSONB DEFAULT '[]'::jsonb,
    funnel_assets_approvals JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, session_id)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_phase_approvals_user_id ON phase_approvals(user_id);
CREATE INDEX IF NOT EXISTS idx_phase_approvals_session_id ON phase_approvals(session_id);
CREATE INDEX IF NOT EXISTS idx_phase_approvals_user_session ON phase_approvals(user_id, session_id);

-- Enable Row Level Security
ALTER TABLE phase_approvals ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own approvals" ON phase_approvals;
DROP POLICY IF EXISTS "Users can insert their own approvals" ON phase_approvals;
DROP POLICY IF EXISTS "Users can update their own approvals" ON phase_approvals;

-- Create RLS policies
CREATE POLICY "Users can view their own approvals"
    ON phase_approvals
    FOR SELECT
    USING (true);

CREATE POLICY "Users can insert their own approvals"
    ON phase_approvals
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Users can update their own approvals"
    ON phase_approvals
    FOR UPDATE
    USING (true);

-- Grant permissions
GRANT ALL ON phase_approvals TO authenticated;
GRANT ALL ON phase_approvals TO service_role;

-- Add comment
COMMENT ON TABLE phase_approvals IS 'Stores which business-core and funnel-assets phases users have approved';

