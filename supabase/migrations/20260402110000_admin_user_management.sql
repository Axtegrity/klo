-- Admin user management: disabled flag, audit timestamps, disabled_by
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS disabled boolean DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS disabled_at timestamptz;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS disabled_by text;
