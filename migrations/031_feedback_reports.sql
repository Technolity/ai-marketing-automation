-- Feedback Reports Table
-- Stores user-submitted bug reports, feedback, and feature requests

CREATE TABLE IF NOT EXISTS feedback_reports (
  id            UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  email         TEXT        NOT NULL,
  type          TEXT        NOT NULL CHECK (type IN ('bug', 'feedback', 'feature')),
  description   TEXT        NOT NULL,
  image_urls    TEXT[]      DEFAULT '{}',
  status        TEXT        NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'resolved')),
  admin_note    TEXT,
  resolved_by   TEXT,
  resolved_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feedback_status     ON feedback_reports(status);
CREATE INDEX IF NOT EXISTS idx_feedback_type       ON feedback_reports(type);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback_reports(created_at DESC);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_feedback_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_feedback_updated_at
  BEFORE UPDATE ON feedback_reports
  FOR EACH ROW EXECUTE FUNCTION update_feedback_updated_at();
