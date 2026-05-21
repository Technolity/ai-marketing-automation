-- Migration 034: Social Auth Tokens for X and Meta
-- Stores encrypted OAuth tokens for X (Twitter) and Meta (Instagram/Facebook) platforms

CREATE TABLE IF NOT EXISTS social_auth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  platform TEXT NOT NULL,  -- 'x', 'instagram', 'facebook'
  access_token TEXT NOT NULL,  -- encrypted with AES-256-CBC
  refresh_token TEXT,  -- for X API (expires after 2 hours without refresh)
  token_expires_at TIMESTAMPTZ,
  connected_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  account_id TEXT,  -- platform-specific ID (e.g., Instagram Business Account ID, X user ID)
  account_username TEXT,  -- @username for X, handle for Instagram
  UNIQUE(user_id, platform),
  FOREIGN KEY (user_id) REFERENCES user_profiles(user_id) ON DELETE CASCADE
);

-- Index for fast lookups by user_id
CREATE INDEX IF NOT EXISTS idx_social_auth_tokens_user_id ON social_auth_tokens(user_id);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_social_auth_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_social_auth_tokens_updated_at
BEFORE UPDATE ON social_auth_tokens
FOR EACH ROW
EXECUTE FUNCTION update_social_auth_tokens_updated_at();

-- Update social_posts to reference X and Instagram tokens optionally
ALTER TABLE IF EXISTS social_posts
ADD COLUMN IF NOT EXISTS auth_token_id UUID REFERENCES social_auth_tokens(id) ON DELETE SET NULL;
