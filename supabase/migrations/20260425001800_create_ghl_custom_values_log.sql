-- Migration: Create ghl_custom_values_log table
-- Stores every custom value pushed to GHL via the admin bulk-create tool,
-- along with the GHL-assigned ID, for future reference and audit.

CREATE TABLE IF NOT EXISTS public.ghl_custom_values_log (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    location_id     TEXT NOT NULL,
    custom_value_name  TEXT NOT NULL,
    custom_value_id    TEXT,          -- GHL-assigned ID (returned from create/update)
    custom_value_value TEXT,          -- The value pushed (truncated at 10k chars)
    action          TEXT NOT NULL DEFAULT 'created',  -- 'created' or 'updated'
    created_by      TEXT NOT NULL,    -- Clerk user ID of the admin who ran it
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),

    -- Composite unique constraint for upsert deduplication
    CONSTRAINT uq_location_custom_value UNIQUE (location_id, custom_value_name)
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_gcvl_location ON public.ghl_custom_values_log (location_id);
CREATE INDEX IF NOT EXISTS idx_gcvl_created_by ON public.ghl_custom_values_log (created_by);
CREATE INDEX IF NOT EXISTS idx_gcvl_created_at ON public.ghl_custom_values_log (created_at DESC);

-- Enable RLS
ALTER TABLE public.ghl_custom_values_log ENABLE ROW LEVEL SECURITY;

-- Only service role can access (admin API routes use service role key)
CREATE POLICY "Service role full access" ON public.ghl_custom_values_log
    FOR ALL
    USING (true)
    WITH CHECK (true);
