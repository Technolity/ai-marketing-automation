-- ============================================================
-- REMEDIATION: Restore is_approved for auto-populated fields
-- ============================================================
-- 
-- Run date:  2026-03-02
-- Context:   When vault_content_fields were auto-populated from 
--            vault_content, the populateVaultFields function 
--            hardcoded is_approved = false, losing the approval
--            status of sections already approved in vault_content.
--
-- Safety:
--   - Only updates version=1 (auto-populated, never user-edited)
--   - Only updates is_current_version = true (active row)
--   - Only updates is_approved = false (currently broken)
--   - Only where the matching vault_content has status = 'approved'
-- 
-- Impact: 71 users, 15,950 fields
-- ============================================================

UPDATE public.vault_content_fields AS vcf
SET is_approved = true,
    updated_at = NOW()
FROM public.vault_content AS vc
WHERE vc.funnel_id = vcf.funnel_id
  AND vc.section_id = vcf.section_id
  AND vc.is_current_version = true
  AND vc.status = 'approved'
  AND vcf.is_current_version = true
  AND vcf.version = 1
  AND vcf.is_approved = false;
