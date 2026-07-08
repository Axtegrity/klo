ALTER TABLE vault_content
  ADD COLUMN IF NOT EXISTS featured_in_feed BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_vault_content_featured_in_feed
  ON vault_content(published_at DESC, created_at DESC)
  WHERE featured_in_feed = true AND visibility = 'published';
