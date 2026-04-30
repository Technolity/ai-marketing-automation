-- Slot-based funnels: allows multi-funnel isolation per user
-- Tier limits enforced in application code:
--   starter = 1 slot, growth = 3 slots, scale = 10 slots, admin = unlimited

ALTER TABLE user_funnels
  ADD COLUMN IF NOT EXISTS slot_index INTEGER DEFAULT 1 NOT NULL;

-- Basic sanity CHECK — slot must be positive
ALTER TABLE user_funnels
  ADD CONSTRAINT chk_slot_index_positive CHECK (slot_index >= 1);

-- One funnel per slot per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_slot_per_user
  ON user_funnels(user_id, slot_index);

ALTER TABLE ghl_push_operations
  ADD COLUMN IF NOT EXISTS slot_index INTEGER DEFAULT 1;

-- Tracks which slot groups have been created in GHL + stores value IDs
CREATE TABLE IF NOT EXISTS ghl_slot_custom_value_ids (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     TEXT NOT NULL,
  location_id TEXT NOT NULL,
  slot_index  INTEGER NOT NULL,
  ghl_key     TEXT NOT NULL,
  ghl_id      TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, location_id, slot_index, ghl_key)
);

CREATE INDEX IF NOT EXISTS idx_ghl_slot_cv_ids_lookup
  ON ghl_slot_custom_value_ids(user_id, location_id, slot_index);
