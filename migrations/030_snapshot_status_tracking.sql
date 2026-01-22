-- Migration 030: Add Snapshot Status Tracking
-- Adds columns to track snapshot import status more accurately
-- Add snapshot status columns to ghl_subaccounts
ALTER TABLE ghl_subaccounts
ADD COLUMN IF NOT EXISTS snapshot_import_status TEXT DEFAULT 'pending',
    ADD COLUMN IF NOT EXISTS snapshot_import_error TEXT;
-- Create index on snapshot status for faster filtering
CREATE INDEX IF NOT EXISTS idx_ghl_subaccounts_snapshot_status ON ghl_subaccounts(snapshot_import_status);
-- Add comments
COMMENT ON COLUMN ghl_subaccounts.snapshot_import_status IS 'Status of snapshot import: pending, completed, failed, pending_verification';
COMMENT ON COLUMN ghl_subaccounts.snapshot_import_error IS 'Error message if snapshot import failed';
-- Update existing records to have proper status
UPDATE ghl_subaccounts
SET snapshot_import_status = CASE
        WHEN snapshot_imported = true THEN 'completed'
        WHEN snapshot_imported = false THEN 'failed'
        ELSE 'pending'
    END
WHERE snapshot_import_status = 'pending';