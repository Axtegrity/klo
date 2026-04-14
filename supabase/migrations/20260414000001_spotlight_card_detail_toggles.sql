-- Per-element visibility toggles for the spotlight card on /events.
-- Default true so existing behavior is preserved.
ALTER TABLE site_spotlight
  ADD COLUMN IF NOT EXISTS card_show_host BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS card_show_event_name BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS card_show_session_subtitle BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS card_show_meta BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS card_show_sessions_list BOOLEAN NOT NULL DEFAULT true;

COMMENT ON COLUMN site_spotlight.card_show_host IS 'Show "Hosted by X" on the spotlight card (only renders if hosting_entity is also set on the event).';
COMMENT ON COLUMN site_spotlight.card_show_event_name IS 'Show the event/conference name as the card heading.';
COMMENT ON COLUMN site_spotlight.card_show_session_subtitle IS 'Show the italic session subtitle below the event name (only when session_name differs).';
COMMENT ON COLUMN site_spotlight.card_show_meta IS 'Show the date and location row.';
COMMENT ON COLUMN site_spotlight.card_show_sessions_list IS 'Show the lower block listing every session (name, time, room).';
