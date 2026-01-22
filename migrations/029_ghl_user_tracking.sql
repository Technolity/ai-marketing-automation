-- Migration: Add GHL User Tracking to ghl_subaccounts
-- Purpose: Track GHL User account creation for each TedOS user
-- Date: 2026-01-22
-- Add columns to track GHL User creation
ALTER TABLE ghl_subaccounts
ADD COLUMN IF NOT EXISTS ghl_user_id TEXT;
ALTER TABLE ghl_subaccounts
ADD COLUMN IF NOT EXISTS ghl_user_created BOOLEAN DEFAULT FALSE;
ALTER TABLE ghl_subaccounts
ADD COLUMN IF NOT EXISTS ghl_user_created_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE ghl_subaccounts
ADD COLUMN IF NOT EXISTS ghl_user_email TEXT;
ALTER TABLE ghl_subaccounts
ADD COLUMN IF NOT EXISTS ghl_user_role TEXT DEFAULT 'admin';
ALTER TABLE ghl_subaccounts
ADD COLUMN IF NOT EXISTS ghl_user_creation_error TEXT;
ALTER TABLE ghl_subaccounts
ADD COLUMN IF NOT EXISTS ghl_user_invited BOOLEAN DEFAULT FALSE;
ALTER TABLE ghl_subaccounts
ADD COLUMN IF NOT EXISTS ghl_user_invite_sent_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE ghl_subaccounts
ADD COLUMN IF NOT EXISTS ghl_user_last_retry_at TIMESTAMP WITH TIME ZONE;
-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ghl_subaccounts_user_id ON ghl_subaccounts(user_id);
CREATE INDEX IF NOT EXISTS idx_ghl_subaccounts_ghl_user_id ON ghl_subaccounts(ghl_user_id);
CREATE INDEX IF NOT EXISTS idx_ghl_subaccounts_ghl_user_created ON ghl_subaccounts(ghl_user_created);
-- Create admin settings table for auto-create toggle
CREATE TABLE IF NOT EXISTS admin_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    setting_key TEXT UNIQUE NOT NULL,
    setting_value JSONB NOT NULL,
    updated_by TEXT,
    -- user_id who last updated
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Insert default auto-create setting (OFF)
INSERT INTO admin_settings (setting_key, setting_value)
VALUES (
        'ghl_auto_create_users',
        '{"enabled": false, "enabled_at": null, "enabled_by": null}'::jsonb
    ) ON CONFLICT (setting_key) DO NOTHING;
-- Add comments for documentation
COMMENT ON COLUMN ghl_subaccounts.ghl_user_id IS 'GHL User ID created for this TedOS user';
COMMENT ON COLUMN ghl_subaccounts.ghl_user_created IS 'Whether GHL User account has been created';
COMMENT ON COLUMN ghl_subaccounts.ghl_user_email IS 'Email used for GHL User account';
COMMENT ON COLUMN ghl_subaccounts.ghl_user_role IS 'Role assigned to GHL User (default: admin)';
COMMENT ON COLUMN ghl_subaccounts.ghl_user_creation_error IS 'Error message if user creation failed';
COMMENT ON COLUMN ghl_subaccounts.ghl_user_invited IS 'Whether welcome email was sent to user';
COMMENT ON TABLE admin_settings IS 'Global admin settings for TedOS platform';