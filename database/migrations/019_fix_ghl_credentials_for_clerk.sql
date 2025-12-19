-- Migration: Fix GHL credentials for Clerk authentication
-- Purpose: Change user_id from uuid to text to support Clerk user IDs
-- Created: 2025-12-19

-- Drop existing tables if they exist
DROP TABLE IF EXISTS ghl_push_operations CASCADE;
DROP TABLE IF EXISTS generated_css CASCADE;
DROP TABLE IF EXISTS generated_images CASCADE;
DROP TABLE IF EXISTS ghl_credentials CASCADE;

-- Table: ghl_credentials (fixed for Clerk)
CREATE TABLE ghl_credentials (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id text NOT NULL UNIQUE, -- Clerk user ID (text, not uuid)
    location_id text NOT NULL,
    access_token text NOT NULL,
    location_name text,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    last_used_at timestamptz
);

CREATE INDEX idx_ghl_credentials_user ON ghl_credentials(user_id);
CREATE INDEX idx_ghl_credentials_active ON ghl_credentials(is_active);

ALTER TABLE ghl_credentials ENABLE ROW LEVEL SECURITY;

-- RLS policy using Clerk user ID
CREATE POLICY "Users can manage own GHL credentials" ON ghl_credentials
    FOR ALL USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Table: generated_images
CREATE TABLE generated_images (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id text NOT NULL, -- Clerk user ID
    session_id uuid REFERENCES saved_sessions(id) ON DELETE CASCADE,

    -- Image metadata
    image_type text NOT NULL,
    image_purpose text,
    prompt_used text,

    -- Storage
    supabase_path text NOT NULL,
    public_url text NOT NULL,

    -- Image properties
    width integer,
    height integer,
    format text DEFAULT 'png',
    file_size integer,

    -- Generation status
    status text DEFAULT 'generating' CHECK (status IN ('generating', 'completed', 'failed')),
    error_message text,

    -- Timestamps
    created_at timestamptz DEFAULT now(),
    generated_at timestamptz
);

CREATE INDEX idx_generated_images_user ON generated_images(user_id);
CREATE INDEX idx_generated_images_session ON generated_images(session_id);
CREATE INDEX idx_generated_images_status ON generated_images(status);
CREATE INDEX idx_generated_images_type ON generated_images(image_type);

ALTER TABLE generated_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own images" ON generated_images
    FOR SELECT USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can insert own images" ON generated_images
    FOR INSERT WITH CHECK (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can update own images" ON generated_images
    FOR UPDATE USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Table: generated_css
CREATE TABLE generated_css (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id text NOT NULL, -- Clerk user ID
    session_id uuid REFERENCES saved_sessions(id) ON DELETE CASCADE,

    -- CSS content
    css_code text NOT NULL,
    color_scheme jsonb NOT NULL,

    -- Metadata
    sections_covered text[],
    is_applied boolean DEFAULT false,
    fallback_used boolean DEFAULT false,

    -- Timestamps
    created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_generated_css_user ON generated_css(user_id);
CREATE INDEX idx_generated_css_session ON generated_css(session_id);

ALTER TABLE generated_css ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own CSS" ON generated_css
    FOR ALL USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Table: ghl_push_operations
CREATE TABLE ghl_push_operations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id text NOT NULL, -- Clerk user ID
    session_id uuid REFERENCES saved_sessions(id) ON DELETE CASCADE,
    ghl_credential_id uuid REFERENCES ghl_credentials(id) ON DELETE SET NULL,

    -- Operation details
    operation_type text NOT NULL CHECK (operation_type IN ('push_values', 'fetch_snapshot', 'push_images', 'push_css')),
    status text DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed', 'partial')),

    -- Progress tracking
    total_items integer DEFAULT 0,
    completed_items integer DEFAULT 0,
    failed_items integer DEFAULT 0,

    -- Custom values tracking
    custom_values_pushed jsonb DEFAULT '{}',
    snapshot_values_found jsonb DEFAULT '{}',

    -- Error tracking
    errors jsonb DEFAULT '[]',
    warnings jsonb DEFAULT '[]',

    -- Timestamps
    started_at timestamptz DEFAULT now(),
    completed_at timestamptz,
    duration_ms integer
);

CREATE INDEX idx_ghl_push_ops_user ON ghl_push_operations(user_id);
CREATE INDEX idx_ghl_push_ops_session ON ghl_push_operations(session_id);
CREATE INDEX idx_ghl_push_ops_status ON ghl_push_operations(status);
CREATE INDEX idx_ghl_push_ops_started ON ghl_push_operations(started_at DESC);

ALTER TABLE ghl_push_operations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own push operations" ON ghl_push_operations
    FOR SELECT USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can insert own push operations" ON ghl_push_operations
    FOR INSERT WITH CHECK (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can update own push operations" ON ghl_push_operations
    FOR UPDATE USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Update function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_ghl_credentials_updated_at
    BEFORE UPDATE ON ghl_credentials
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Migration completed successfully!';
    RAISE NOTICE 'Tables created: ghl_credentials, generated_images, generated_css, ghl_push_operations';
    RAISE NOTICE 'User ID type changed from uuid to text for Clerk compatibility';
END $$;
