-- ADD multi-day support to event_presentations
-- DO NOT modify any other columns on this table

ALTER TABLE event_presentations
  ADD COLUMN IF NOT EXISTS start_date DATE,
  ADD COLUMN IF NOT EXISTS end_date DATE;

-- Backfill from existing event_date column
UPDATE event_presentations
SET
  start_date = event_date::DATE,
  end_date   = event_date::DATE
WHERE start_date IS NULL AND event_date IS NOT NULL;

-- Soft validation index (not a hard constraint to avoid breaking existing rows)
CREATE INDEX IF NOT EXISTS idx_ep_start_date ON event_presentations(start_date);
CREATE INDEX IF NOT EXISTS idx_ep_end_date   ON event_presentations(end_date);

COMMENT ON COLUMN event_presentations.start_date IS 'First day of multi-day event. Drives keynote display on Events page.';
COMMENT ON COLUMN event_presentations.end_date   IS 'Last day of multi-day event. Same as start_date for single-day events.';
