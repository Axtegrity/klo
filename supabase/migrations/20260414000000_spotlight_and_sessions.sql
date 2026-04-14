-- Spotlight system: a single curated event gets a numeric countdown and a
-- details card on /events. Per-event show_countdown toggle goes away; spotlight
-- selection is now a global config with auto/manual modes.

-- 1. Legacy per-event countdown columns (show_countdown, show_countdown_title)
-- are intentionally NOT dropped here. Dropping them before Vercel finishes
-- deploying the new code would cause admin saves to 500 against stale client
-- bundles. They're harmless as dead columns; a follow-up migration can remove
-- them once we're sure nothing reads them.

-- 2. Per-event additions: hosting entity + per-event listing visibility.
ALTER TABLE event_presentations
  ADD COLUMN IF NOT EXISTS hosting_entity TEXT;
ALTER TABLE event_presentations
  ADD COLUMN IF NOT EXISTS display_on_events_page BOOLEAN NOT NULL DEFAULT true;

COMMENT ON COLUMN event_presentations.hosting_entity IS
  'Organization hosting the event (e.g., "First Baptist Church"). Optional.';
COMMENT ON COLUMN event_presentations.display_on_events_page IS
  'When false, the event is hidden from the public /events listing (Live/Upcoming/Past). Independent of is_published so events can be archived-but-accessible via direct URL.';

-- 3. Event sessions child table (up to 10 per event).
CREATE TABLE IF NOT EXISTS event_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES event_presentations(id) ON DELETE CASCADE,
  sort_order INT NOT NULL CHECK (sort_order BETWEEN 1 AND 10),
  session_name TEXT NOT NULL,
  start_time TEXT,
  end_time TEXT,
  location TEXT,
  room TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (event_id, sort_order)
);
CREATE INDEX IF NOT EXISTS event_sessions_event_id_idx ON event_sessions(event_id);

ALTER TABLE event_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "event_sessions public read" ON event_sessions;
CREATE POLICY "event_sessions public read" ON event_sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM event_presentations ep
      WHERE ep.id = event_sessions.event_id AND ep.is_published = true
    )
  );

DROP POLICY IF EXISTS "event_sessions service role write" ON event_sessions;
CREATE POLICY "event_sessions service role write" ON event_sessions
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- 4. Site spotlight — singleton row, auto or manual selection.
CREATE TABLE IF NOT EXISTS site_spotlight (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  mode TEXT NOT NULL DEFAULT 'auto' CHECK (mode IN ('auto', 'manual')),
  manual_event_id UUID REFERENCES event_presentations(id) ON DELETE SET NULL,
  show_countdown BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- Safe re-run for existing rows if the table predates the show_countdown column
ALTER TABLE site_spotlight ADD COLUMN IF NOT EXISTS show_countdown BOOLEAN NOT NULL DEFAULT true;
-- Card position relative to the countdown clock.
ALTER TABLE site_spotlight ADD COLUMN IF NOT EXISTS card_position TEXT NOT NULL DEFAULT 'below';
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'site_spotlight_card_position_check') THEN
    ALTER TABLE site_spotlight ADD CONSTRAINT site_spotlight_card_position_check CHECK (card_position IN ('above','below'));
  END IF;
END $$;

-- Per-section visibility toggles on the public /events page.
ALTER TABLE site_spotlight ADD COLUMN IF NOT EXISTS show_live_section BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE site_spotlight ADD COLUMN IF NOT EXISTS show_upcoming_section BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE site_spotlight ADD COLUMN IF NOT EXISTS show_past_section BOOLEAN NOT NULL DEFAULT true;
INSERT INTO site_spotlight (id, mode) VALUES (1, 'auto') ON CONFLICT (id) DO NOTHING;

ALTER TABLE site_spotlight ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "site_spotlight public read" ON site_spotlight;
CREATE POLICY "site_spotlight public read" ON site_spotlight
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "site_spotlight service role write" ON site_spotlight;
CREATE POLICY "site_spotlight service role write" ON site_spotlight
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- 5. Carry forward: for every existing event with session info in the legacy
-- columns, create one event_sessions row so nothing disappears visually.
-- Skip events that already have a sessions row (idempotent re-run).
INSERT INTO event_sessions (event_id, sort_order, session_name, start_time, end_time, room)
SELECT
  ep.id,
  1,
  COALESCE(NULLIF(ep.session_name, ''), ep.title),
  NULLIF(ep.event_time, ''),
  NULLIF(ep.session_end_time, ''),
  NULLIF(ep.room_location, '')
FROM event_presentations ep
WHERE NOT EXISTS (SELECT 1 FROM event_sessions es WHERE es.event_id = ep.id);
