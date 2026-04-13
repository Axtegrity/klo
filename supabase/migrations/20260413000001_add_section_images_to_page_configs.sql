-- Add section_images column to page_configs.
-- PR #55 wrote code that references page_configs.section_images but omitted
-- this column. Every save was returning 500 due to a Supabase schema-cache miss.
-- Additive only — safe to apply on a live database.

ALTER TABLE page_configs
  ADD COLUMN IF NOT EXISTS section_images JSONB DEFAULT NULL;
