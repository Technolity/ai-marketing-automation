-- Migration: Add p_is_approved to upsert_vault_field_version RPC
-- This allows admin endpoints (restore, bulk approve, edit+approve)
-- to explicitly set the approval status when creating a new version,
-- instead of always resetting to false.
-- Also makes p_user_id optional (DEFAULT NULL) so admin actions can
-- look up the user_id from user_funnels if not provided.
-- ============================================================

-- Drop the existing function first (CASCADE drops dependent objects)
DROP FUNCTION IF EXISTS public.upsert_vault_field_version(
    UUID, TEXT, TEXT, TEXT, JSONB, TEXT, TEXT, JSONB, BOOLEAN, INTEGER
);

-- Recreate with p_is_approved parameter
CREATE OR REPLACE FUNCTION public.upsert_vault_field_version(
    p_funnel_id UUID,
    p_user_id TEXT DEFAULT NULL,            -- Made optional for admin calls
    p_section_id TEXT DEFAULT NULL,
    p_field_id TEXT DEFAULT NULL,
    p_field_value JSONB DEFAULT NULL,
    p_field_label TEXT DEFAULT NULL,
    p_field_type TEXT DEFAULT NULL,
    p_field_metadata JSONB DEFAULT NULL,
    p_is_custom BOOLEAN DEFAULT false,
    p_display_order INTEGER DEFAULT NULL,
    p_is_approved BOOLEAN DEFAULT false     -- NEW: Allow caller to set approval
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_current RECORD;
    v_new_version INTEGER;
    v_new_id UUID;
    v_action TEXT;
    v_display_order INTEGER;
    v_resolved_user_id TEXT;
BEGIN
    -- ── Resolve user_id ──────────────────────────────────────────
    -- If p_user_id is NULL (admin call), look it up from user_funnels
    IF p_user_id IS NOT NULL THEN
        v_resolved_user_id := p_user_id;
    ELSE
        SELECT uf.user_id INTO v_resolved_user_id
        FROM public.user_funnels uf
        WHERE uf.id = p_funnel_id
        LIMIT 1;

        IF v_resolved_user_id IS NULL THEN
            RAISE EXCEPTION 'Could not resolve user_id for funnel %', p_funnel_id;
        END IF;
    END IF;

    -- ── Lock rows for this field to prevent concurrent modifications ──
    PERFORM 1
    FROM public.vault_content_fields
    WHERE funnel_id = p_funnel_id
        AND section_id = p_section_id
        AND field_id = p_field_id
    FOR UPDATE;

    -- ── Find the current highest version ──
    SELECT * INTO v_current
    FROM public.vault_content_fields
    WHERE funnel_id = p_funnel_id
        AND section_id = p_section_id
        AND field_id = p_field_id
    ORDER BY version DESC
    LIMIT 1;

    IF v_current IS NULL THEN
        -- ── No existing field: create version 1 ──
        v_new_version := 1;
        v_action := 'created';

        -- Determine display_order
        IF p_display_order IS NOT NULL THEN
            v_display_order := p_display_order;
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
            v_resolved_user_id,
            p_section_id,
            p_field_id,
            COALESCE(p_field_label, p_field_id),
            p_field_value,
            COALESCE(p_field_type, 'text'),
            COALESCE(p_field_metadata, '{}'::jsonb),
            p_is_custom,
            COALESCE(p_is_approved, false),  -- Use caller-provided approval status
            v_display_order,
            1,
            true
        )
        RETURNING id INTO v_new_id;

    ELSE
        -- ── Existing field: create new version ──
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
            v_resolved_user_id,
            p_section_id,
            p_field_id,
            COALESCE(p_field_label, v_current.field_label),
            p_field_value,
            COALESCE(p_field_type, v_current.field_type),
            COALESCE(p_field_metadata, v_current.field_metadata),
            COALESCE(p_is_custom, v_current.is_custom),
            COALESCE(p_is_approved, false),  -- Use caller-provided approval status
            COALESCE(p_display_order, v_current.display_order),
            v_new_version,
            true
        )
        RETURNING id INTO v_new_id;
    END IF;

    RETURN jsonb_build_object(
        'id', v_new_id,
        'version', v_new_version,
        'action', v_action,
        'field_id', p_field_id,
        'is_approved', COALESCE(p_is_approved, false),
        'old_version', CASE
            WHEN v_current IS NOT NULL THEN v_current.version
            ELSE NULL
        END
    );
END;
$$;

-- Set ownership and add documentation
ALTER FUNCTION public.upsert_vault_field_version(
    UUID, TEXT, TEXT, TEXT, JSONB, TEXT, TEXT, JSONB, BOOLEAN, INTEGER, BOOLEAN
) OWNER TO postgres;

COMMENT ON FUNCTION public.upsert_vault_field_version IS
    'Atomically upserts a vault field version. Guarantees exactly one is_current_version=true per (funnel_id, section_id, field_id). Supports p_is_approved for admin restore/approve flows.';
