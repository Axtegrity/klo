-- ============================================================
-- Creative Studio — Media, Theme, Animation, Audio, Page Config
-- Template-ready: no KLO-specific FKs, fully portable
-- ============================================================

-- ------------------------------------------------------------
-- 1. media_assets
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS media_assets (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  original_name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  public_url   TEXT NOT NULL,
  mime_type    TEXT NOT NULL,
  size_bytes   BIGINT NOT NULL,
  width        INT,
  height       INT,
  duration_ms  INT,
  folder       TEXT NOT NULL DEFAULT 'uncategorized',
  tags         TEXT[] DEFAULT '{}',
  alt_text     TEXT,
  asset_type   TEXT NOT NULL CHECK (asset_type IN ('image','video','audio','graphic')),
  uploaded_by  TEXT NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_media_assets_folder  ON media_assets(folder);
CREATE INDEX IF NOT EXISTS idx_media_assets_type    ON media_assets(asset_type);
CREATE INDEX IF NOT EXISTS idx_media_assets_tags    ON media_assets USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_media_assets_created ON media_assets(created_at DESC);

ALTER TABLE media_assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "media_assets_public_read"   ON media_assets FOR SELECT USING (true);
CREATE POLICY "media_assets_service_write" ON media_assets FOR ALL USING (true) WITH CHECK (true);

-- ------------------------------------------------------------
-- 2. animation_presets
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS animation_presets (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  slug         TEXT NOT NULL UNIQUE,
  category     TEXT NOT NULL CHECK (category IN ('fade','slide','bounce','scale','parallax','custom')),
  config       JSONB NOT NULL,
  is_system    BOOLEAN DEFAULT false,
  preview_css  TEXT,
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_anim_presets_category ON animation_presets(category);

ALTER TABLE animation_presets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "animation_presets_public_read"   ON animation_presets FOR SELECT USING (true);
CREATE POLICY "animation_presets_service_write" ON animation_presets FOR ALL USING (true) WITH CHECK (true);

-- Seed system presets
INSERT INTO animation_presets (name, slug, category, config, is_system) VALUES
  ('Fade In',        'fade-in',       'fade',     '{"initial":{"opacity":0},"animate":{"opacity":1},"transition":{"duration":0.5,"ease":"easeOut"},"trigger":"load"}'::jsonb, true),
  ('Fade Up',        'fade-up',       'fade',     '{"initial":{"opacity":0,"y":24},"animate":{"opacity":1,"y":0},"transition":{"duration":0.5,"ease":"easeOut"},"trigger":"scroll"}'::jsonb, true),
  ('Slide In Left',  'slide-left',    'slide',    '{"initial":{"opacity":0,"x":-40},"animate":{"opacity":1,"x":0},"transition":{"duration":0.4,"ease":"easeOut"},"trigger":"scroll"}'::jsonb, true),
  ('Slide In Right', 'slide-right',   'slide',    '{"initial":{"opacity":0,"x":40},"animate":{"opacity":1,"x":0},"transition":{"duration":0.4,"ease":"easeOut"},"trigger":"scroll"}'::jsonb, true),
  ('Scale Up',       'scale-up',      'scale',    '{"initial":{"opacity":0,"scale":0.9},"animate":{"opacity":1,"scale":1},"transition":{"duration":0.4,"ease":"easeOut"},"trigger":"scroll"}'::jsonb, true),
  ('Bounce In',      'bounce-in',     'bounce',   '{"initial":{"opacity":0,"scale":0.8},"animate":{"opacity":1,"scale":1},"transition":{"duration":0.6,"ease":"backOut"},"trigger":"load"}'::jsonb, true),
  ('Parallax Slow',  'parallax-slow', 'parallax', '{"initial":{},"animate":{},"scrollY":{"offset":["start end","end start"],"outputY":["-20%","20%"]},"trigger":"scroll"}'::jsonb, true)
ON CONFLICT (slug) DO NOTHING;

-- ------------------------------------------------------------
-- 3. theme_config
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS theme_config (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL DEFAULT 'Default',
  is_active       BOOLEAN DEFAULT false,
  colors          JSONB NOT NULL DEFAULT '{}'::jsonb,
  typography      JSONB NOT NULL DEFAULT '{}'::jsonb,
  buttons         JSONB NOT NULL DEFAULT '{}'::jsonb,
  dark_mode       BOOLEAN DEFAULT true,
  custom_css      TEXT DEFAULT NULL,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE theme_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "theme_config_public_read"   ON theme_config FOR SELECT USING (true);
CREATE POLICY "theme_config_service_write" ON theme_config FOR ALL USING (true) WITH CHECK (true);

-- ------------------------------------------------------------
-- 4. audio_assets
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audio_assets (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  public_url   TEXT NOT NULL,
  size_bytes   BIGINT NOT NULL,
  duration_ms  INT,
  assigned_to  TEXT[] DEFAULT '{}',
  autoplay     BOOLEAN DEFAULT false,
  loop         BOOLEAN DEFAULT true,
  volume       NUMERIC(3,2) DEFAULT 0.50 CHECK (volume >= 0 AND volume <= 1),
  uploaded_by  TEXT NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audio_assets_assigned ON audio_assets USING GIN(assigned_to);

ALTER TABLE audio_assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audio_assets_public_read"   ON audio_assets FOR SELECT USING (true);
CREATE POLICY "audio_assets_service_write" ON audio_assets FOR ALL USING (true) WITH CHECK (true);

-- ------------------------------------------------------------
-- 5. page_configs
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS page_configs (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_slug           TEXT NOT NULL UNIQUE,
  page_label          TEXT NOT NULL,
  hero_config         JSONB DEFAULT '{}'::jsonb,
  layout_config       JSONB DEFAULT '{}'::jsonb,
  sections            JSONB DEFAULT '[]'::jsonb,
  animation_preset_id UUID REFERENCES animation_presets(id) ON DELETE SET NULL,
  audio_asset_id      UUID REFERENCES audio_assets(id) ON DELETE SET NULL,
  theme_overrides     JSONB DEFAULT NULL,
  meta_title          TEXT,
  meta_description    TEXT,
  published           BOOLEAN DEFAULT true,
  updated_by          TEXT,
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_page_configs_slug    ON page_configs(page_slug);
CREATE INDEX IF NOT EXISTS idx_page_configs_updated ON page_configs(updated_at DESC);

ALTER TABLE page_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "page_configs_public_read"   ON page_configs FOR SELECT USING (true);
CREATE POLICY "page_configs_service_write" ON page_configs FOR ALL USING (true) WITH CHECK (true);

-- Seed known pages
INSERT INTO page_configs (page_slug, page_label) VALUES
  ('home',            'Home'),
  ('vault',           'Content Vault'),
  ('advisor',         'AI Advisor'),
  ('assessments',     'Assessments'),
  ('booking',         'Booking'),
  ('strategy-rooms',  'Strategy Rooms'),
  ('events',          'Events'),
  ('marketplace',     'Marketplace')
ON CONFLICT (page_slug) DO NOTHING;

-- ------------------------------------------------------------
-- Auto-update updated_at triggers
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION cs_touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DO $$ BEGIN
  CREATE TRIGGER set_media_assets_updated_at BEFORE UPDATE ON media_assets
    FOR EACH ROW EXECUTE FUNCTION cs_touch_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER set_animation_presets_updated_at BEFORE UPDATE ON animation_presets
    FOR EACH ROW EXECUTE FUNCTION cs_touch_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER set_theme_config_updated_at BEFORE UPDATE ON theme_config
    FOR EACH ROW EXECUTE FUNCTION cs_touch_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER set_audio_assets_updated_at BEFORE UPDATE ON audio_assets
    FOR EACH ROW EXECUTE FUNCTION cs_touch_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER set_page_configs_updated_at BEFORE UPDATE ON page_configs
    FOR EACH ROW EXECUTE FUNCTION cs_touch_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
