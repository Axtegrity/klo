-- Inquiries table: stores booking & consultation form submissions
CREATE TABLE IF NOT EXISTS inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('booking', 'consultation')),
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'contacted', 'archived')),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  organization TEXT,
  event_name TEXT,
  event_date TEXT,
  event_type TEXT,
  budget_range TEXT,
  audience_size TEXT,
  message TEXT,
  industry TEXT,
  location TEXT,
  area_of_interest TEXT,
  organization_size TEXT,
  current_challenge TEXT,
  timeline TEXT,
  previous_consultant TEXT,
  additional_details TEXT,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX idx_inquiries_type ON inquiries (type);
CREATE INDEX idx_inquiries_status ON inquiries (status);
CREATE INDEX idx_inquiries_created_at ON inquiries (created_at DESC);

-- RLS: admin-only access
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin read inquiries"
  ON inquiries FOR SELECT
  USING (auth.role() = 'service_role');

CREATE POLICY "Admin update inquiries"
  ON inquiries FOR UPDATE
  USING (auth.role() = 'service_role');
