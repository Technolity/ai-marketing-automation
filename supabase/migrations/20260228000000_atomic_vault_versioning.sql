-- Migration: Atomic Vault Field Versioning
-- Fixes race conditions where concurrent PATCH calls could leave
-- duplicate or zero rows with is_current_version = true.
-- ============================================================
-- STEP 1: Clean up existing data inconsistencies
-- For each (funnel_id, section_id, field_id) group, ensure
-- exactly one row has is_current_version = true (the highest version).
-- ============================================================
-- First, set ALL rows to false
UPDATE public.vault_content_fields
SET is_current_version = false
WHERE is_current_version = true
    AND id NOT IN (
        -- Keep only the row with the highest version per field group
        SELECT DISTINCT ON (funnel_id, section_id, field_id) id
        FROM public.vault_content_fields
        ORDER BY funnel_id,
            section_id,
            field_id,
            version DESC
    );
-- Then, ensure the highest version row IS marked true
UPDATE public.vault_content_fields vcf
SET is_current_version = true
FROM (
        SELECT DISTINCT ON (funnel_id, section_id, field_id) id
        FROM public.vault_content_fields
        ORDER BY funnel_id,
            section_id,
            field_id,
            version DESC
    ) highest
WHERE vcf.id = highest.id
    AND vcf.is_current_version = false;
-- ============================================================
-- STEP 2: Create a partial unique index to enforce the constraint
-- that only ONE row per (funnel_id, section_id, field_id) can have
-- is_current_version = true at any time.
-- ============================================================
CREATE UNIQUE INDEX IF NOT EXISTS idx_vault_fields_one_current ON public.vault_content_fields (funnel_id, section_id, field_id)
WHERE is_current_version = true;
-- ============================================================
-- STEP 3: Atomic RPC function for upserting a vault field version.
-- Runs inside a single transaction so the old version is marked
-- false and the new version is inserted atomically.
-- ============================================================
CREATE OR REPLACE FUNCTION public.upsert_vault_field_version(
        p_funnel_id UUID,
        p_user_id TEXT,
        p_section_id TEXT,
        p_field_id TEXT,
        p_field_value JSONB,
        p_field_label TEXT DEFAULT NULL,
        p_field_type TEXT DEFAULT NULL,
        p_field_metadata JSONB DEFAULT NULL,
        p_is_custom BOOLEAN DEFAULT false,
        p_display_order INTEGER DEFAULT NULL
    ) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_current RECORD;
v_new_version INTEGER;
v_new_id UUID;
v_action TEXT;
v_display_order INTEGER;
BEGIN -- Lock the rows for this field to prevent concurrent modifications
PERFORM 1
FROM public.vault_content_fields
WHERE funnel_id = p_funnel_id
    AND section_id = p_section_id
    AND field_id = p_field_id FOR
UPDATE;
-- Find the current highest version
SELECT * INTO v_current
FROM public.vault_content_fields
WHERE funnel_id = p_funnel_id
    AND section_id = p_section_id
    AND field_id = p_field_id
ORDER BY version DESC
LIMIT 1;
IF v_current IS NULL THEN -- No existing field: create version 1
v_new_version := 1;
v_action := 'created';
-- Determine display_order
IF p_display_order IS NOT NULL THEN v_display_order := p_display_order;
ELSE
SELECT COALESCE(MAX(display_order), 0) + 1 INTO v_display_order
FROM public.vault_content_fields
WHERE funnel_id = p_funnel_id
    AND section_id = p_section_id;
END IF;
INSERT INTO public.vault_content_fields (
        funnel_id,
        user_id,
        section_id,
        field_id,
        field_label,
        field_value,
        field_type,
        field_metadata,
        is_custom,
        is_approved,
        display_order,
        version,
        is_current_version
    )
VALUES (
        p_funnel_id,
        p_user_id,
        p_section_id,
        p_field_id,
        COALESCE(p_field_label, p_field_id),
        p_field_value,
        COALESCE(p_field_type, 'text'),
        COALESCE(p_field_metadata, '{}'::jsonb),
        p_is_custom,
        false,
        v_display_order,
        1,
        true
    )
RETURNING id INTO v_new_id;
ELSE -- Existing field: create new version
v_new_version := v_current.version + 1;
v_action := 'updated';
-- Mark ALL existing versions as non-current (safety)
UPDATE public.vault_content_fields
SET is_current_version = false
WHERE funnel_id = p_funnel_id
    AND section_id = p_section_id
    AND field_id = p_field_id
    AND is_current_version = true;
-- Insert the new version
INSERT INTO public.vault_content_fields (
        funnel_id,
        user_id,
        section_id,
        field_id,
        field_label,
        field_value,
        field_type,
        field_metadata,
        is_custom,
        is_approved,
        display_order,
        version,
        is_current_version
    )
VALUES (
        p_funnel_id,
        p_user_id,
        p_section_id,
        p_field_id,
        COALESCE(p_field_label, v_current.field_label),
        p_field_value,
        COALESCE(p_field_type, v_current.field_type),
        COALESCE(p_field_metadata, v_current.field_metadata),
        COALESCE(p_is_custom, v_current.is_custom),
        false,
        -- reset approval on edit
        COALESCE(p_display_order, v_current.display_order),
        v_new_version,
        true
    )
RETURNING id INTO v_new_id;
END IF;
RETURN jsonb_build_object(
    'id',
    v_new_id,
    'version',
    v_new_version,
    'action',
    v_action,
    'field_id',
    p_field_id,
    'old_version',
    CASE
        WHEN v_current IS NOT NULL THEN v_current.version
        ELSE NULL
    END
);
END;
$$;
ALTER FUNCTION public.upsert_vault_field_version(
    UUID,
    TEXT,
    TEXT,
    TEXT,
    JSONB,
    TEXT,
    TEXT,
    JSONB,
    BOOLEAN,
    INTEGER
) OWNER TO postgres;
COMMENT ON FUNCTION public.upsert_vault_field_version IS 'Atomically upserts a vault field version. Guarantees exactly one is_current_version=true per (funnel_id, section_id, field_id).';