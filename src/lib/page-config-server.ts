// Server-side helper for loading page_configs rows from Supabase.
// Used by page components to read admin-authored hero, layout, animation,
// and audio settings at render time.

import { getServiceSupabase } from "@/lib/supabase";

export interface HeroConfig {
  headline: string;
  subheadline: string;
  backgroundType: "color" | "image" | "video";
  backgroundRef: string | null;
  overlayOpacity: number;
}

export interface LayoutConfig {
  columns: 1 | 2 | 3 | 4;
  spacing: "tight" | "normal" | "loose";
  padding: "none" | "sm" | "md" | "lg";
  maxWidthPx: number;
}

export interface SectionImageConfig {
  backgroundType: "image" | "color";
  backgroundRef: string | null;
  overlayOpacity?: number;
}

export interface SectionImages {
  latestBrief?: SectionImageConfig;
  featuredInsight?: SectionImageConfig;
}

export interface BriefConfig {
  title: string;
  date: string;
  excerpt: string;
  link: string;
  cta: string;
}

export interface TrendingConfig {
  heading: string;
  topic1: string;
  topic2: string;
  topic3: string;
  topic4: string;
  topic5: string;
}

export interface InsightConfig {
  category: string;
  title: string;
  description: string;
  link: string;
  cta: string;
}

export interface ToolConfig {
  name: string;
  category: string;
  description: string;
  why: string;
  link: string;
}

export interface AssessmentConfig {
  heading: string;
  subheading: string;
}

export interface PageConfigRow {
  id: string;
  page_slug: string;
  page_label: string;
  hero_config: HeroConfig | null;
  layout_config: LayoutConfig | null;
  sections: unknown[];
  section_images?: SectionImages | null;
  brief_config?: BriefConfig | null;
  trending_config?: TrendingConfig | null;
  insight_config?: InsightConfig | null;
  tool_config?: ToolConfig | null;
  assessment_config?: AssessmentConfig | null;
  animation_preset_id: string | null;
  audio_asset_id: string | null;
  meta_title: string | null;
  meta_description: string | null;
  published: boolean;
}

/**
 * Fetch a page_configs row by slug. Returns null if not found.
 * Used in server components to read admin-authored page settings.
 */
export async function getPageConfig(slug: string): Promise<PageConfigRow | null> {
  try {
    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from("page_configs")
      .select("*")
      .eq("page_slug", slug)
      .maybeSingle();

    if (error || !data) return null;
    return data as PageConfigRow;
  } catch (err) {
    console.error(`[getPageConfig ${slug}]`, err);
    return null;
  }
}

/**
 * Fetch an animation preset by ID (for page-level animation_preset_id references).
 */
export async function getAnimationPreset(id: string | null) {
  if (!id) return null;
  try {
    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from("animation_presets")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) return null;
    return data;
  } catch {
    return null;
  }
}

/**
 * Fetch an audio asset by ID (for page-level audio_asset_id references).
 */
export async function getAudioAsset(id: string | null) {
  if (!id) return null;
  try {
    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from("audio_assets")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) return null;
    return data;
  } catch {
    return null;
  }
}
