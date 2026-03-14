-- Add event_id to conference_word_cloud and conference_announcements
-- so entries are scoped per-event instead of globally shared.

-- Word Cloud
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'conference_word_cloud' AND column_name = 'event_id'
  ) THEN
    ALTER TABLE conference_word_cloud
      ADD COLUMN event_id UUID REFERENCES event_presentations(id) ON DELETE CASCADE;

    CREATE INDEX IF NOT EXISTS idx_word_cloud_event_id
      ON conference_word_cloud(event_id);
  END IF;
END $$;

-- Announcements
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'conference_announcements' AND column_name = 'event_id'
  ) THEN
    ALTER TABLE conference_announcements
      ADD COLUMN event_id UUID REFERENCES event_presentations(id) ON DELETE CASCADE;

    CREATE INDEX IF NOT EXISTS idx_announcements_event_id
      ON conference_announcements(event_id);
  END IF;
END $$;

-- Update the word cloud RPC to accept an optional event_id filter
CREATE OR REPLACE FUNCTION get_word_cloud_counts(p_event_id UUID DEFAULT NULL)
RETURNS TABLE(word TEXT, count BIGINT) AS $$
  SELECT LOWER(w.word) AS word, COUNT(*) AS count
  FROM conference_word_cloud w
  WHERE (p_event_id IS NULL OR w.event_id = p_event_id)
  GROUP BY LOWER(w.word)
  ORDER BY count DESC;
$$ LANGUAGE sql STABLE;
