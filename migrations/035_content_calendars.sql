-- Daily Leads — Content Calendars (persistence)
-- Stores a user's 30-day content calendar (curated-template or AI-seeded) and its
-- per-day items, so calendars + approvals survive across sessions.
-- NOTE: user_id is TEXT (Clerk user ID format: "user_xxx"), NOT UUID.
-- Requires: update_updated_at_column() (exists from migration 032).

-- ─── 1. content_calendars ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS content_calendars (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     TEXT NOT NULL,
  funnel_id   UUID,
  title       TEXT,
  source      TEXT NOT NULL DEFAULT 'template' CHECK (source IN ('template', 'ai')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_content_calendars_user   ON content_calendars (user_id);
CREATE INDEX IF NOT EXISTS idx_content_calendars_funnel ON content_calendars (user_id, funnel_id);

DROP TRIGGER IF EXISTS trg_content_calendars_updated_at ON content_calendars;
CREATE TRIGGER trg_content_calendars_updated_at
  BEFORE UPDATE ON content_calendars
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─── 2. content_calendar_items ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS content_calendar_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  calendar_id   UUID NOT NULL REFERENCES content_calendars(id) ON DELETE CASCADE,
  day_number    INT  NOT NULL,
  category      TEXT,
  angle         TEXT,
  caption       TEXT,
  image_brief   TEXT,
  image_url     TEXT,
  status        TEXT NOT NULL DEFAULT 'idea'
                CHECK (status IN ('idea', 'approved', 'image_generated', 'posted')),
  daily_post_id UUID REFERENCES daily_posts(id) ON DELETE SET NULL,
  template_key  TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_calendar_items_calendar ON content_calendar_items (calendar_id, day_number);

DROP TRIGGER IF EXISTS trg_calendar_items_updated_at ON content_calendar_items;
CREATE TRIGGER trg_calendar_items_updated_at
  BEFORE UPDATE ON content_calendar_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─── GRANTs (required by project policy — see Supabase GRANT deadline) ─────────
GRANT ALL ON public.content_calendars      TO authenticated, service_role;
GRANT ALL ON public.content_calendar_items TO authenticated, service_role;
