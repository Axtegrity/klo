-- Conference Presentations: files Keith uploads for seminar attendees
CREATE TABLE IF NOT EXISTS conference_presentations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'General',
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS conference_presentation_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  presentation_id UUID NOT NULL REFERENCES conference_presentations(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_conf_pres_published ON conference_presentations(is_published);
CREATE INDEX idx_conf_pres_files_pres ON conference_presentation_files(presentation_id);

-- RLS
ALTER TABLE conference_presentations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conference_presentation_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read published presentations"
  ON conference_presentations FOR SELECT
  USING (is_published = true);

CREATE POLICY "Service role full access presentations"
  ON conference_presentations FOR ALL
  USING (true) WITH CHECK (true);

CREATE POLICY "Public read presentation files"
  ON conference_presentation_files FOR SELECT
  USING (true);

CREATE POLICY "Service role full access presentation files"
  ON conference_presentation_files FOR ALL
  USING (true) WITH CHECK (true);
