ALTER TABLE event_presentations ADD COLUMN IF NOT EXISTS event_timezone TEXT DEFAULT 'America/Chicago';
