// ============================================================
// Creative Studio — Shared TypeScript interfaces
// Template-ready: no project-specific references
// ============================================================

// -------------------------------------------------------
// Media Library
// -------------------------------------------------------
export type AssetType = "image" | "video" | "audio" | "graphic";

export interface MediaAsset {
  id: string;
  name: string;
  original_name: string;
  storage_path: string;
  public_url: string;
  mime_type: string;
  size_bytes: number;
  width: number | null;
  height: number | null;
  duration_ms: number | null;
  folder: string;
  tags: string[];
  alt_text: string | null;
  asset_type: AssetType;
  uploaded_by: string;
  created_at: string;
  updated_at: string;
}

// -------------------------------------------------------
// Animation
// -------------------------------------------------------
export type AnimationCategory =
  | "fade"
  | "slide"
  | "bounce"
  | "scale"
  | "parallax"
  | "custom";

export type AnimationTrigger = "load" | "scroll" | "hover" | "tap";

export interface AnimationVariantConfig {
  initial: Record<string, unknown>;
  animate: Record<string, unknown>;
  exit?: Record<string, unknown>;
  transition: {
    duration: number;
    delay?: number;
    ease: string;
    repeat?: number;
  };
  trigger: AnimationTrigger;
  scrollY?: {
    offset: [string, string];
    outputY: [string, string];
  };
}

export interface AnimationPreset {
  id: string;
  name: string;
  slug: string;
  category: AnimationCategory;
  config: AnimationVariantConfig;
  is_system: boolean;
  preview_css: string | null;
  created_at: string;
  updated_at: string;
}

// -------------------------------------------------------
// Theme
// -------------------------------------------------------
export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  muted: string;
  gold: string;
  [key: string]: string;
}

export interface ThemeTypography {
  bodyFont: string;
  displayFont: string;
  baseSizeRem: number;
  scaleRatio: number;
  weights: {
    body: number;
    heading: number;
  };
}

export interface ThemeButtons {
  radiusPx: number;
  shadowPx: number;
  hoverScale: number;
  variant: "solid" | "ghost" | "outline";
}

export interface ThemeConfig {
  id: string;
  name: string;
  is_active: boolean;
  colors: ThemeColors;
  typography: ThemeTypography;
  buttons: ThemeButtons;
  dark_mode: boolean;
  custom_css: string | null;
  created_at: string;
  updated_at: string;
}

// -------------------------------------------------------
// Audio
// -------------------------------------------------------
export interface AudioAsset {
  id: string;
  name: string;
  storage_path: string;
  public_url: string;
  size_bytes: number;
  duration_ms: number | null;
  assigned_to: string[];
  autoplay: boolean;
  loop: boolean;
  volume: number;
  uploaded_by: string;
  created_at: string;
  updated_at: string;
}

// -------------------------------------------------------
// Page Config
// -------------------------------------------------------
export type SectionType =
  | "text"
  | "image"
  | "video"
  | "cta"
  | "testimonial"
  | "spacer";

export type ColumnCount = 1 | 2 | 3 | 4;
export type Spacing = "tight" | "normal" | "loose";
export type Padding = "none" | "sm" | "md" | "lg";
export type BackgroundType = "color" | "image" | "video";
export type ViewportSize = 390 | 768 | 1440;

export interface HeroConfig {
  headline: string;
  subheadline: string;
  backgroundType: BackgroundType;
  backgroundRef: string | null;
  overlayOpacity: number;
}

export interface LayoutConfig {
  columns: ColumnCount;
  spacing: Spacing;
  padding: Padding;
  maxWidthPx: number;
}

export interface SectionBlock {
  id: string;
  type: SectionType;
  order: number;
  visible: boolean;
  config: Record<string, unknown>;
}

export interface PageConfig {
  id: string;
  page_slug: string;
  page_label: string;
  hero_config: HeroConfig;
  layout_config: LayoutConfig;
  sections: SectionBlock[];
  animation_preset_id: string | null;
  audio_asset_id: string | null;
  theme_overrides: Partial<ThemeColors> | null;
  meta_title: string | null;
  meta_description: string | null;
  published: boolean;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

// -------------------------------------------------------
// Studio Panel navigation
// -------------------------------------------------------
export type StudioPanel =
  | "media-library"
  | "animation-builder"
  | "layout-editor"
  | "music-manager"
  | "theme-designer"
  | "page-composer";
