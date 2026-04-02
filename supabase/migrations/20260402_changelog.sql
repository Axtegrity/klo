CREATE TABLE IF NOT EXISTS public.changelog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'feature',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.changelog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "changelog_read_all" ON public.changelog FOR SELECT USING (true);
