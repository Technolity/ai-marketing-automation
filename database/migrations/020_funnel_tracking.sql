-- Migration: 020_funnel_tracking.sql
-- Purpose: Track launched GHL funnels and their URLs
-- Created: 2024

-- Create ghl_funnels table to store launched funnel information
CREATE TABLE IF NOT EXISTS ghl_funnels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL,
    session_id UUID REFERENCES saved_sessions(id) ON DELETE SET NULL,
    funnel_name TEXT NOT NULL,
    funnel_type TEXT NOT NULL,
    funnel_url TEXT NOT NULL,
    ghl_funnel_id TEXT, -- GHL's internal funnel ID
    ghl_location_id TEXT, -- GHL location ID
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'archived')),
    metadata JSONB DEFAULT '{}',
    launched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_ghl_funnels_user_id ON ghl_funnels(user_id);
CREATE INDEX IF NOT EXISTS idx_ghl_funnels_session_id ON ghl_funnels(session_id);
CREATE INDEX IF NOT EXISTS idx_ghl_funnels_status ON ghl_funnels(status);
CREATE INDEX IF NOT EXISTS idx_ghl_funnels_launched_at ON ghl_funnels(launched_at DESC);

-- Enable RLS
ALTER TABLE ghl_funnels ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their own funnels
CREATE POLICY "Users can view own funnels"
    ON ghl_funnels FOR SELECT
    USING (user_id = auth.uid()::text OR user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- RLS Policy: Users can insert their own funnels
CREATE POLICY "Users can insert own funnels"
    ON ghl_funnels FOR INSERT
    WITH CHECK (user_id = auth.uid()::text OR user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- RLS Policy: Users can update their own funnels
CREATE POLICY "Users can update own funnels"
    ON ghl_funnels FOR UPDATE
    USING (user_id = auth.uid()::text OR user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- RLS Policy: Admins can see all funnels
CREATE POLICY "Admins can view all funnels"
    ON ghl_funnels FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid()::text
            AND user_tier = 'admin'
        )
    );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_ghl_funnels_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS trigger_ghl_funnels_updated_at ON ghl_funnels;
CREATE TRIGGER trigger_ghl_funnels_updated_at
    BEFORE UPDATE ON ghl_funnels
    FOR EACH ROW
    EXECUTE FUNCTION update_ghl_funnels_updated_at();

-- Comments for documentation
COMMENT ON TABLE ghl_funnels IS 'Tracks launched GHL funnels and their URLs';
COMMENT ON COLUMN ghl_funnels.user_id IS 'Clerk user ID who owns this funnel';
COMMENT ON COLUMN ghl_funnels.session_id IS 'Reference to the saved_session used to create this funnel';
COMMENT ON COLUMN ghl_funnels.funnel_name IS 'User-friendly name for the funnel';
COMMENT ON COLUMN ghl_funnels.funnel_type IS 'Type of funnel (e.g., free_book, webinar, vsl)';
COMMENT ON COLUMN ghl_funnels.funnel_url IS 'Public URL where the funnel is accessible';
COMMENT ON COLUMN ghl_funnels.ghl_funnel_id IS 'GoHighLevel internal funnel ID';
COMMENT ON COLUMN ghl_funnels.ghl_location_id IS 'GoHighLevel location ID';
COMMENT ON COLUMN ghl_funnels.status IS 'Current status: active, paused, or archived';
COMMENT ON COLUMN ghl_funnels.metadata IS 'Additional funnel data (pages, conversion data, etc.)';

