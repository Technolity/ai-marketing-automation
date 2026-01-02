-- Migration: Create vault_content table (existing system)
-- Created: 2026-01-03
-- Purpose: Support existing content generation system
-- Note: This runs BEFORE 001_vault_content_fields.sql

-- Create vault_content table (original JSON blob system)
CREATE TABLE IF NOT EXISTS vault_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  funnel_id UUID NOT NULL REFERENCES public.user_funnels(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  section_id TEXT NOT NULL,
  section_title TEXT NOT NULL,
  content JSONB NOT NULL,
  prompt_used TEXT,
  phase INTEGER DEFAULT 1,
  status TEXT DEFAULT 'generated',
  numeric_key INTEGER,
  is_locked BOOLEAN DEFAULT FALSE,
  is_current_version BOOLEAN DEFAULT TRUE,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

  UNIQUE(funnel_id, section_id, version)
);

-- Indexes for performance
DROP INDEX IF EXISTS idx_vault_content_funnel;
CREATE INDEX idx_vault_content_funnel ON vault_content(funnel_id);

DROP INDEX IF EXISTS idx_vault_content_funnel_section;
CREATE INDEX idx_vault_content_funnel_section ON vault_content(funnel_id, section_id);

DROP INDEX IF EXISTS idx_vault_content_current;
CREATE INDEX idx_vault_content_current ON vault_content(funnel_id, is_current_version);

DROP INDEX IF EXISTS idx_vault_content_status;
CREATE INDEX idx_vault_content_status ON vault_content(funnel_id, status);

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_vault_content_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update timestamp
DROP TRIGGER IF EXISTS vault_content_updated_at ON vault_content;
CREATE TRIGGER vault_content_updated_at
  BEFORE UPDATE ON vault_content
  FOR EACH ROW
  EXECUTE FUNCTION update_vault_content_timestamp();

-- Comments for documentation
COMMENT ON TABLE vault_content IS 'Stores generated vault content as JSON blobs (legacy system)';
COMMENT ON COLUMN vault_content.content IS 'JSON blob containing all fields for the section';
COMMENT ON COLUMN vault_content.status IS 'generated, approved, rejected';
COMMENT ON COLUMN vault_content.is_current_version IS 'TRUE for latest version of this section';
