-- ============================================================
-- REMEDIATION SCRIPT: Fix is_current_version after atomic migration
-- 
-- WHAT THIS DOES:
--   For every (funnel_id, section_id, field_id) group, picks the
--   BEST row to be is_current_version = true using this priority:
--     1. The row with is_approved = true AND the latest created_at
--     2. If no approved row exists, the row with the latest created_at
--
-- WHY THIS IS SAFE FOR UNAFFECTED USERS:
--   - If a user already has the correct row as is_current_version = true
--     (i.e. their latest/approved row IS the current one), this script
--     will simply re-select that same row. No change happens.
--   - No data is deleted. Only the is_current_version boolean flag moves.
--   - The unique index is dropped temporarily and re-created at the end.
--
-- RUN THIS IN: Supabase SQL Editor (as postgres / service_role)
-- ============================================================

BEGIN;

-- ============================================================
-- STEP 0: Audit BEFORE the fix (run this SELECT first to see impact)
-- Copy-paste this SELECT separately first if you want a before-snapshot
-- ============================================================
-- SELECT 
--   funnel_id,
--   section_id,
--   field_id,
--   COUNT(*) AS total_versions,
--   COUNT(*) FILTER (WHERE is_current_version = true) AS current_count,
--   COUNT(*) FILTER (WHERE is_approved = true) AS approved_count,
--   MAX(created_at) AS latest_edit
-- FROM public.vault_content_fields
-- GROUP BY funnel_id, section_id, field_id
-- HAVING COUNT(*) FILTER (WHERE is_current_version = true) != 1
--    OR (
--      COUNT(*) FILTER (WHERE is_approved = true) > 0
--      AND NOT EXISTS (
--        SELECT 1 FROM public.vault_content_fields sub
--        WHERE sub.funnel_id = vault_content_fields.funnel_id
--          AND sub.section_id = vault_content_fields.section_id
--          AND sub.field_id = vault_content_fields.field_id
--          AND sub.is_current_version = true
--          AND sub.is_approved = true
--      )
--    )
-- ORDER BY funnel_id, section_id, field_id;

-- ============================================================
-- STEP 1: Temporarily drop the unique index so we can move the flag
-- ============================================================
DROP INDEX IF EXISTS public.idx_vault_fields_one_current;

-- ============================================================
-- STEP 2: Set ALL rows to is_current_version = false
-- ============================================================
UPDATE public.vault_content_fields
SET is_current_version = false
WHERE is_current_version = true;

-- ============================================================
-- STEP 3: For each (funnel_id, section_id, field_id) group,
--         pick the BEST row and set it to is_current_version = true.
--
-- Priority logic (via ORDER BY):
--   1. is_approved = true wins over false  (DESC → true first)
--   2. Among ties, latest created_at wins  (DESC → newest first)
--   3. Among ties, highest version wins    (DESC → biggest first)
--
-- DISTINCT ON picks only the first row per group after this ordering,
-- which is exactly the best candidate.
-- ============================================================
UPDATE public.vault_content_fields vcf
SET is_current_version = true
FROM (
    SELECT DISTINCT ON (funnel_id, section_id, field_id) id
    FROM public.vault_content_fields
    ORDER BY
        funnel_id,
        section_id,
        field_id,
        is_approved DESC,       -- approved rows win
        created_at DESC,        -- newest edit wins
        version DESC            -- highest version as final tiebreaker
) best
WHERE vcf.id = best.id;

-- ============================================================
-- STEP 4: Re-create the unique partial index to enforce the constraint
-- ============================================================
CREATE UNIQUE INDEX idx_vault_fields_one_current
ON public.vault_content_fields (funnel_id, section_id, field_id)
WHERE is_current_version = true;

-- ============================================================
-- STEP 5: Verification query — make sure every group has exactly 1 current
-- ============================================================
-- After COMMIT, run this to verify:
-- SELECT 
--   COUNT(*) AS total_groups,
--   COUNT(*) FILTER (
--     WHERE current_count = 1
--   ) AS groups_with_exactly_one_current,
--   COUNT(*) FILTER (
--     WHERE current_count != 1
--   ) AS groups_with_problems
-- FROM (
--   SELECT 
--     funnel_id, section_id, field_id,
--     COUNT(*) FILTER (WHERE is_current_version = true) AS current_count
--   FROM public.vault_content_fields
--   GROUP BY funnel_id, section_id, field_id
-- ) summary;

COMMIT;
