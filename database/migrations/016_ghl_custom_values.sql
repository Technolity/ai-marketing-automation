-- ============================================
-- GHL Custom Value Mappings Migration
-- Phase 0: MVP with Snapshot Templates
-- ============================================
-- Table to store mapped custom values for GHL integration
CREATE TABLE IF NOT EXISTS public.ghl_custom_value_mappings (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id uuid REFERENCES public.saved_sessions(id) ON DELETE
    SET NULL,
        -- Custom values as JSONB
        custom_values jsonb NOT NULL DEFAULT '{}',
        -- Metadata
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now()
);
-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ghl_custom_values_user ON public.ghl_custom_value_mappings(user_id);
CREATE INDEX IF NOT EXISTS idx_ghl_custom_values_session ON public.ghl_custom_value_mappings(session_id);
CREATE INDEX IF NOT EXISTS idx_ghl_custom_values_created ON public.ghl_custom_value_mappings(created_at DESC);
-- Enable RLS
ALTER TABLE public.ghl_custom_value_mappings ENABLE ROW LEVEL SECURITY;
-- RLS Policies
-- Users can manage their own mappings
CREATE POLICY "Users can manage own GHL custom values" ON public.ghl_custom_value_mappings FOR ALL USING (auth.uid() = user_id);
-- Note: Admins access via service_role key which bypasses RLS
-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_ghl_custom_values_updated_at() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER ghl_custom_values_updated_at BEFORE
UPDATE ON public.ghl_custom_value_mappings FOR EACH ROW EXECUTE FUNCTION update_ghl_custom_values_updated_at();
-- Grant permissions
GRANT ALL ON public.ghl_custom_value_mappings TO authenticated;
GRANT ALL ON public.ghl_custom_value_mappings TO service_role;