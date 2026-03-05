-- Add schedule display fields to conference_sessions
ALTER TABLE conference_sessions ADD COLUMN IF NOT EXISTS speaker text;
ALTER TABLE conference_sessions ADD COLUMN IF NOT EXISTS room text;
ALTER TABLE conference_sessions ADD COLUMN IF NOT EXISTS time_label text;
ALTER TABLE conference_sessions ADD COLUMN IF NOT EXISTS sort_order int DEFAULT 0;

-- Key-value settings table for conference config
CREATE TABLE IF NOT EXISTS conference_settings (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz DEFAULT now()
);
