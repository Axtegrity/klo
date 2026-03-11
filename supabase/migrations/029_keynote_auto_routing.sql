-- Add keynote_session_id to event_presentations
-- This is auto-populated by trigger — never set manually

ALTER TABLE event_presentations
  ADD COLUMN IF NOT EXISTS keynote_session_id UUID REFERENCES conference_sessions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_ep_keynote_session ON event_presentations(keynote_session_id);

-- Function: set keynote_session_id to the earliest session for this event
-- Fires when conference_sessions rows are inserted or updated
-- Uses event_id FK (added in migration 024) to link sessions to events

CREATE OR REPLACE FUNCTION auto_set_keynote_session()
RETURNS TRIGGER AS $$
DECLARE
  first_session_id UUID;
BEGIN
  -- Skip if no event linked
  IF NEW.event_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Find the earliest session for this event by scheduled_at, then sort_order
  SELECT id INTO first_session_id
  FROM conference_sessions
  WHERE event_id = NEW.event_id
  ORDER BY scheduled_at ASC NULLS LAST, sort_order ASC, id ASC
  LIMIT 1;

  IF first_session_id IS NOT NULL THEN
    UPDATE event_presentations
    SET keynote_session_id = first_session_id
    WHERE id = NEW.event_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER set_keynote_on_session_change
  AFTER INSERT OR UPDATE ON conference_sessions
  FOR EACH ROW EXECUTE FUNCTION auto_set_keynote_session();
