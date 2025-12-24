-- ============================================
-- MIGRATION 024: Generated Images Table
-- ============================================
-- Purpose: Store AI-generated images for funnels
-- Used by: lib/ghl/funnelImageGenerator.js
-- ============================================

-- Create generated_images table
CREATE TABLE IF NOT EXISTS generated_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    session_id UUID REFERENCES saved_sessions(id) ON DELETE CASCADE,
    
    -- Image metadata
    image_type TEXT NOT NULL,  -- e.g., 'author_photo', 'product_mockup', 'book_cover'
    funnel_type TEXT NOT NULL,  -- e.g., 'vsl-funnel', 'free-book-funnel'
    
    -- Storage paths
    image_url TEXT NOT NULL,     -- Storage path in Supabase
    public_url TEXT NOT NULL,    -- Public accessible URL
    storage_path TEXT NOT NULL,  -- Full storage path
    
    -- Generation details
    prompt_used TEXT,            -- DALL-E prompt used
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'generating', 'completed', 'failed')),
    error_message TEXT,          -- Error if generation failed
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_generated_images_user_id ON generated_images(user_id);
CREATE INDEX IF NOT EXISTS idx_generated_images_session_id ON generated_images(session_id);
CREATE INDEX IF NOT EXISTS idx_generated_images_funnel_type ON generated_images(funnel_type);
CREATE INDEX IF NOT EXISTS idx_generated_images_status ON generated_images(status);
CREATE INDEX IF NOT EXISTS idx_generated_images_image_type ON generated_images(image_type);

-- Create unique constraint to prevent duplicate images
CREATE UNIQUE INDEX IF NOT EXISTS idx_generated_images_unique 
    ON generated_images(user_id, session_id, image_type, funnel_type);

-- Enable RLS
ALTER TABLE generated_images ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view own generated images" ON generated_images;
CREATE POLICY "Users can view own generated images" ON generated_images
    FOR SELECT USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

DROP POLICY IF EXISTS "Users can insert own generated images" ON generated_images;
CREATE POLICY "Users can insert own generated images" ON generated_images
    FOR INSERT WITH CHECK (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

DROP POLICY IF EXISTS "Users can update own generated images" ON generated_images;
CREATE POLICY "Users can update own generated images" ON generated_images
    FOR UPDATE USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

DROP POLICY IF EXISTS "Users can delete own generated images" ON generated_images;
CREATE POLICY "Users can delete own generated images" ON generated_images
    FOR DELETE USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Add comment
COMMENT ON TABLE generated_images IS 'Stores AI-generated images for funnel templates (DALL-E 3 via OpenAI)';

