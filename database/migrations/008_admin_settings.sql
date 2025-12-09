-- Create admin_settings table
CREATE TABLE IF NOT EXISTS admin_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    setting_key VARCHAR(255) UNIQUE NOT NULL,
    setting_value JSONB NOT NULL,
    updated_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_admin_settings_key ON admin_settings(setting_key);

-- Enable RLS
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can read settings
CREATE POLICY "Admins can read settings"
    ON admin_settings
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.user_id = auth.uid()
            AND user_profiles.user_tier = 'admin'
        )
    );

-- Policy: Only admins can insert settings
CREATE POLICY "Admins can insert settings"
    ON admin_settings
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.user_id = auth.uid()
            AND user_profiles.user_tier = 'admin'
        )
    );

-- Policy: Only admins can update settings
CREATE POLICY "Admins can update settings"
    ON admin_settings
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.user_id = auth.uid()
            AND user_profiles.user_tier = 'admin'
        )
    );

-- Insert default settings
INSERT INTO admin_settings (setting_key, setting_value) VALUES
    ('general', '{"siteName": "TedOS", "siteDescription": "AI Marketing Automation Platform", "userRegistration": true, "maintenanceMode": false}'::jsonb),
    ('user_management', '{"autoApproveContent": false, "maxUsersPerTier": {"basic": 1000, "premium": 500, "enterprise": 100}}'::jsonb),
    ('notifications', '{"emailNotifications": true, "adminEmail": "admin@tedos.com"}'::jsonb),
    ('security', '{"require2FA": false, "allowAPIAccess": true}'::jsonb),
    ('advanced', '{"apiEndpoint": "https://api.tedos.com", "webhookUrl": "", "customCSS": ""}'::jsonb)
ON CONFLICT (setting_key) DO NOTHING;

-- Create function to update timestamp
CREATE OR REPLACE FUNCTION update_admin_settings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update timestamp
CREATE TRIGGER admin_settings_updated_at
    BEFORE UPDATE ON admin_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_admin_settings_timestamp();
