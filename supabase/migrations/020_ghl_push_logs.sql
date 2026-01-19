-- GHL Push Logs Table
-- Tracks all custom value push operations to GHL
CREATE TABLE IF NOT EXISTS ghl_push_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    funnel_id UUID NOT NULL REFERENCES user_funnels(id) ON DELETE CASCADE,
    section TEXT NOT NULL,
    -- 'funnelCopy', 'colors', 'emails', 'sms', 'media'
    values_pushed INTEGER NOT NULL DEFAULT 0,
    success BOOLEAN NOT NULL DEFAULT true,
    error JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Index for efficient queries
CREATE INDEX IF NOT EXISTS idx_ghl_push_logs_user_funnel ON ghl_push_logs(user_id, funnel_id);
CREATE INDEX IF NOT EXISTS idx_ghl_push_logs_created ON ghl_push_logs(created_at DESC);
-- RLS Policies
ALTER TABLE ghl_push_logs ENABLE ROW LEVEL SECURITY;
-- Users can only see their own push logs
CREATE POLICY ghl_push_logs_select_own ON ghl_push_logs FOR
SELECT USING (user_id = auth.uid()::text);
-- Users can insert their own push logs
CREATE POLICY ghl_push_logs_insert_own ON ghl_push_logs FOR
INSERT WITH CHECK (user_id = auth.uid()::text);
-- Grant access to service role
GRANT ALL ON ghl_push_logs TO service_role;