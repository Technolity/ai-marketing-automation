-- Add section column to ghl_slot_custom_value_ids
-- Was missing from initial migration, causing silent upsert failures

ALTER TABLE ghl_slot_custom_value_ids
  ADD COLUMN IF NOT EXISTS section TEXT;
