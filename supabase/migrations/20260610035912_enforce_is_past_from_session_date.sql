-- Enforce: a session whose session_date has passed is always past.
-- Trigger fires on INSERT and UPDATE; if session_date < CURRENT_DATE, is_past is
-- forced to true regardless of what was submitted.

CREATE OR REPLACE FUNCTION enforce_is_past_from_date()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.session_date IS NOT NULL AND NEW.session_date < CURRENT_DATE THEN
    NEW.is_past := true;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_enforce_is_past
  BEFORE INSERT OR UPDATE ON strategy_sessions
  FOR EACH ROW EXECUTE FUNCTION enforce_is_past_from_date();

-- Backfill: fix the 4 sessions currently stuck in this state
UPDATE strategy_sessions
SET is_past = true
WHERE session_date < CURRENT_DATE AND is_past = false;
