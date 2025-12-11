-- Migration: 002_knowledge_base.sql
-- Creates knowledge base content table for RAG system
CREATE TABLE IF NOT EXISTS knowledge_base (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    industry TEXT NOT NULL,
    content_type TEXT NOT NULL CHECK (
        content_type IN (
            'Guide',
            'Article',
            'Template',
            'Resource',
            'Research',
            'Framework',
            'Case Study',
            'Checklist'
        )
    ),
    content TEXT NOT NULL,
    tags TEXT [] DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Indexes for search and filtering
CREATE INDEX IF NOT EXISTS idx_knowledge_base_industry ON knowledge_base(industry);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_content_type ON knowledge_base(content_type);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_active ON knowledge_base(is_active);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_tags ON knowledge_base USING GIN(tags);
-- Auto-update updated_at
DROP TRIGGER IF EXISTS update_knowledge_base_updated_at ON knowledge_base;
CREATE TRIGGER update_knowledge_base_updated_at BEFORE
UPDATE ON knowledge_base FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- Enable Row Level Security
ALTER TABLE knowledge_base ENABLE ROW LEVEL SECURITY;
-- Drop existing policies
DROP POLICY IF EXISTS "Admins full access" ON knowledge_base;
DROP POLICY IF EXISTS "Premium users read" ON knowledge_base;
-- Admins can do everything
CREATE POLICY "Admins full access" ON knowledge_base FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM user_profiles
        WHERE id = auth.uid()
            AND is_admin = TRUE
    )
);
-- Premium and Enterprise users can read active content (for RAG)
CREATE POLICY "Premium users read" ON knowledge_base FOR
SELECT USING (
        is_active = TRUE
        AND EXISTS (
            SELECT 1
            FROM user_profiles
            WHERE id = auth.uid()
                AND subscription_tier IN ('premium', 'enterprise')
        )
    );
COMMENT ON TABLE knowledge_base IS 'Industry-specific content for RAG-powered generation. Only available to Premium+ users.';