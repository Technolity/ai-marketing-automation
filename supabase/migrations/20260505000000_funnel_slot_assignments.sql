-- One slot per funnel, enforced at DB level
-- FK with CASCADE so slot auto-releases when funnel is deleted
CREATE TABLE IF NOT EXISTS funnel_slot_assignments (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  funnel_id   UUID NOT NULL REFERENCES user_funnels(id) ON DELETE CASCADE,
  user_id     TEXT NOT NULL,
  slot_index  INTEGER NOT NULL CHECK (slot_index >= 3 AND slot_index <= 12),
  location_id TEXT NOT NULL,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_user_slot_location UNIQUE (user_id, slot_index, location_id)
);
CREATE INDEX IF NOT EXISTS idx_fsa_funnel_id ON funnel_slot_assignments(funnel_id);
CREATE INDEX IF NOT EXISTS idx_fsa_user_id   ON funnel_slot_assignments(user_id);
ALTER TABLE funnel_slot_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_select_own_slot_assignments" ON funnel_slot_assignments
  FOR SELECT USING (user_id = auth.uid()::text);
CREATE POLICY "users_insert_own_slot_assignments" ON funnel_slot_assignments
  FOR INSERT WITH CHECK (user_id = auth.uid()::text);
CREATE POLICY "users_delete_own_slot_assignments" ON funnel_slot_assignments
  FOR DELETE USING (user_id = auth.uid()::text);
CREATE POLICY "service_role_all_slot_assignments" ON funnel_slot_assignments
  USING (true) WITH CHECK (true);
