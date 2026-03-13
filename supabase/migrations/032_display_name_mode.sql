-- Add display_name_mode to control what the engagement page shows as the main heading
ALTER TABLE event_presentations
  ADD COLUMN IF NOT EXISTS display_name_mode TEXT NOT NULL DEFAULT 'event'
  CHECK (display_name_mode IN ('event', 'session'));

COMMENT ON COLUMN event_presentations.display_name_mode IS 'Controls engagement page heading: event = conference_name, session = session title';
