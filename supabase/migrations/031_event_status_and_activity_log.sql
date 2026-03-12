-- 031: Event status field, guest presenter fields, notes, activity log, poll closed_at
-- Required by: Past Events, Live Events, Upcoming Events, Engagement, Recommended Additions

-- 1. Add event_status to event_presentations (auto-computed but admin-overridable)
ALTER TABLE event_presentations
  ADD COLUMN IF NOT EXISTS event_status TEXT NOT NULL DEFAULT 'upcoming'
    CHECK (event_status IN ('upcoming', 'live', 'past')),
  ADD COLUMN IF NOT EXISTS event_status_override BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS session_name TEXT,
  ADD COLUMN IF NOT EXISTS room_location TEXT,
  ADD COLUMN IF NOT EXISTS is_guest_presenter BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS session_end_time TEXT;

-- 2. Add closed_at to conference_polls (for displaying when polling closed)
ALTER TABLE conference_polls
  ADD COLUMN IF NOT EXISTS closed_at TIMESTAMPTZ;

-- 3. Create admin activity log table
CREATE TABLE IF NOT EXISTS admin_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id TEXT,
  admin_email TEXT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  details TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for recent activity queries
CREATE INDEX IF NOT EXISTS idx_activity_log_created ON admin_activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_entity ON admin_activity_log(entity_type, entity_id);

-- 4. Enable RLS on activity log (admin-only read)
ALTER TABLE admin_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on admin_activity_log"
  ON admin_activity_log FOR ALL
  USING (true)
  WITH CHECK (true);
