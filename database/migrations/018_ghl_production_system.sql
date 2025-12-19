-- Migration: GHL Production Integration System
-- Purpose: Store credentials, images, CSS, and track push operations
-- Created: 2025-12-19

-- Table: ghl_credentials (temporary storage until OAuth)
CREATE TABLE IF NOT EXISTS ghl_credentials (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    location_id text NOT NULL,
    access_token text NOT NULL, -- Not encrypted for now, will encrypt with OAuth
    location_name text,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    last_used_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_ghl_credentials_user ON ghl_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_ghl_credentials_active ON ghl_credentials(is_active);

ALTER TABLE ghl_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own GHL credentials" ON ghl_credentials
    FOR ALL USING (auth.uid() = user_id);

-- Table: generated_images (stores AI-generated funnel images)
CREATE TABLE IF NOT EXISTS generated_images (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id uuid REFERENCES saved_sessions(id) ON DELETE CASCADE,

    -- Image metadata
    image_type text NOT NULL, -- 'hero', 'testimonial', 'product', 'feature', 'background'
    image_purpose text, -- Descriptive text like "Fitness coaching hero image"
    prompt_used text, -- The prompt sent to DALL-E

    -- Storage
    supabase_path text NOT NULL, -- Path in Supabase storage
    public_url text NOT NULL, -- Public URL for GHL

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

CREATE INDEX IF NOT EXISTS idx_generated_images_user ON generated_images(user_id);
CREATE INDEX IF NOT EXISTS idx_generated_images_session ON generated_images(session_id);
CREATE INDEX IF NOT EXISTS idx_generated_images_status ON generated_images(status);
CREATE INDEX IF NOT EXISTS idx_generated_images_type ON generated_images(image_type);

ALTER TABLE generated_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own images" ON generated_images
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own images" ON generated_images
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Table: generated_css (stores AI-generated CSS for colors)
CREATE TABLE IF NOT EXISTS generated_css (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id uuid REFERENCES saved_sessions(id) ON DELETE CASCADE,

    -- CSS content
    css_code text NOT NULL,
    color_scheme jsonb NOT NULL, -- { primary, secondary, accent, text, background }

    -- Metadata
    sections_covered text[], -- ['buttons', 'headings', 'backgrounds', 'text']
    is_applied boolean DEFAULT false,

    -- Timestamps
    created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_generated_css_user ON generated_css(user_id);
CREATE INDEX IF NOT EXISTS idx_generated_css_session ON generated_css(session_id);

ALTER TABLE generated_css ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own CSS" ON generated_css
    FOR ALL USING (auth.uid() = user_id);

-- Table: ghl_push_operations (tracks each push operation)
CREATE TABLE IF NOT EXISTS ghl_push_operations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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
    custom_values_pushed jsonb DEFAULT '{}', -- { "headline": "success", "vsl_hook": "failed" }
    snapshot_values_found jsonb DEFAULT '{}', -- Values found in snapshot

    -- Error tracking
    errors jsonb DEFAULT '[]', -- Array of error objects
    warnings jsonb DEFAULT '[]',

    -- Timestamps
    started_at timestamptz DEFAULT now(),
    completed_at timestamptz,
    duration_ms integer
);

CREATE INDEX IF NOT EXISTS idx_ghl_push_ops_user ON ghl_push_operations(user_id);
CREATE INDEX IF NOT EXISTS idx_ghl_push_ops_session ON ghl_push_operations(session_id);
CREATE INDEX IF NOT EXISTS idx_ghl_push_ops_status ON ghl_push_operations(status);
CREATE INDEX IF NOT EXISTS idx_ghl_push_ops_started ON ghl_push_operations(started_at DESC);

ALTER TABLE ghl_push_operations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own push operations" ON ghl_push_operations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own push operations" ON ghl_push_operations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

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

-- Create Supabase storage bucket for images (run this in Supabase dashboard)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('funnel-images', 'funnel-images', true);
--
-- CREATE POLICY "Users can upload own images" ON storage.objects
--     FOR INSERT WITH CHECK (bucket_id = 'funnel-images' AND auth.uid()::text = (storage.foldername(name))[1]);
--
-- CREATE POLICY "Anyone can view images" ON storage.objects
--     FOR SELECT USING (bucket_id = 'funnel-images');
