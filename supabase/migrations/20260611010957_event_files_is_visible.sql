-- 20260611000002: Add is_visible to event_files
-- Controls whether a file is shown to attendees on the conference page,
-- events page, and in the vault past presentations section.
-- Default false — Keith explicitly toggles files on when ready.
ALTER TABLE event_files ADD COLUMN IF NOT EXISTS is_visible boolean DEFAULT false;
