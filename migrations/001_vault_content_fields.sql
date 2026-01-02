-- Migration: Granular Field-Level Vault Storage
-- Created: 2026-01-03
-- Purpose: Enable individual field editing, AI feedback, and custom field addition
-- Fixed: References user_funnels (not saved_sessions)
-- Create vault_content_fields table
CREATE TABLE IF NOT EXISTS vault_content_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  funnel_id UUID NOT NULL REFERENCES public.user_funnels(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  -- Clerk user ID for ownership
  section_id TEXT NOT NULL,
  -- 'idealClient', 'message', 'story', etc.
  field_id TEXT NOT NULL,
  -- 'bestIdealClient', 'top3Challenges', or UUID for custom fields
  field_label TEXT NOT NULL,
  -- Display label (e.g., "Best Ideal Client (1 sentence)")
  field_value JSONB NOT NULL,
  -- Supports text, arrays, objects
  field_type TEXT NOT NULL,
  -- 'text', 'textarea', 'array', 'custom'
  field_metadata JSONB,
  -- Store maxLength, rows, minItems, etc.
  is_custom BOOLEAN DEFAULT FALSE,
  -- User-added field vs predefined
  is_approved BOOLEAN DEFAULT FALSE,
  -- Field-level approval
  is_current_version BOOLEAN DEFAULT TRUE,
  -- Track current vs historical versions
  display_order INTEGER DEFAULT 0,
  -- Order of fields in UI
  version INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  -- Ensure one field per funnel/section/field combo per version
  UNIQUE(funnel_id, section_id, field_id, version)
);
-- Indexes for performance
DROP INDEX IF EXISTS idx_vault_fields_funnel_section;
CREATE INDEX idx_vault_fields_funnel_section ON vault_content_fields(funnel_id, section_id);
DROP INDEX IF EXISTS idx_vault_fields_lookup;
CREATE INDEX idx_vault_fields_lookup ON vault_content_fields(funnel_id, section_id, field_id);
DROP INDEX IF EXISTS idx_vault_fields_custom;
CREATE INDEX idx_vault_fields_custom ON vault_content_fields(funnel_id, section_id, is_custom);
-- Add version tracking index
DROP INDEX IF EXISTS idx_vault_fields_version;
CREATE INDEX idx_vault_fields_version ON vault_content_fields(funnel_id, section_id, version DESC);
-- Add current version index for fast lookups
DROP INDEX IF EXISTS idx_vault_fields_current;
CREATE INDEX idx_vault_fields_current ON vault_content_fields(funnel_id, section_id, is_current_version);
-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_vault_field_timestamp() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = timezone('utc'::text, now());
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- Trigger to auto-update timestamp
DROP TRIGGER IF EXISTS vault_fields_updated_at ON vault_content_fields;
CREATE TRIGGER vault_fields_updated_at BEFORE
UPDATE ON vault_content_fields FOR EACH ROW EXECUTE FUNCTION update_vault_field_timestamp();
-- Comments for documentation
COMMENT ON TABLE vault_content_fields IS 'Stores individual vault content fields with version history and custom field support';
COMMENT ON COLUMN vault_content_fields.field_value IS 'JSONB field storing text (string), arrays, or objects';
COMMENT ON COLUMN vault_content_fields.is_custom IS 'TRUE if user manually added this field, FALSE if predefined in schema';
COMMENT ON COLUMN vault_content_fields.display_order IS 'Order in which fields appear in UI (0-based)';
-- =====================================================
-- Row Level Security (RLS) Policies
-- =====================================================
-- Enable RLS
ALTER TABLE vault_content_fields ENABLE ROW LEVEL SECURITY;
-- Policy: Users can view their own fields
DROP POLICY IF EXISTS "Users can view own vault fields" ON vault_content_fields;
CREATE POLICY "Users can view own vault fields" ON vault_content_fields FOR
SELECT USING (
    user_id = auth.uid()::text
    OR user_id = current_setting('request.headers', true)::json->>'x-user-id'
  );
-- Policy: Users can insert their own fields
DROP POLICY IF EXISTS "Users can insert own vault fields" ON vault_content_fields;
CREATE POLICY "Users can insert own vault fields" ON vault_content_fields FOR
INSERT WITH CHECK (
    user_id = auth.uid()::text
    OR user_id = current_setting('request.headers', true)::json->>'x-user-id'
  );
-- Policy: Users can update their own fields
DROP POLICY IF EXISTS "Users can update own vault fields" ON vault_content_fields;
CREATE POLICY "Users can update own vault fields" ON vault_content_fields FOR
UPDATE USING (
    user_id = auth.uid()::text
    OR user_id = current_setting('request.headers', true)::json->>'x-user-id'
  );
-- Policy: Users can delete their own fields
DROP POLICY IF EXISTS "Users can delete own vault fields" ON vault_content_fields;
CREATE POLICY "Users can delete own vault fields" ON vault_content_fields FOR DELETE USING (
  user_id = auth.uid()::text
  OR user_id = current_setting('request.headers', true)::json->>'x-user-id'
);
-- Service role bypass (for API operations)
DROP POLICY IF EXISTS "Service role has full access to vault fields" ON vault_content_fields;
CREATE POLICY "Service role has full access to vault fields" ON vault_content_fields FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');