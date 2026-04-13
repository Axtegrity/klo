"use client";

// HomeEditor — client component that wraps the home page content tree with
// EditModeProvider and renders the sticky EditorTopBar.
//
// The server component (page.tsx) fetches page_configs and passes the initial
// hero + section_images here. We render the real home page components with
// editMode=true so EditableImage wrappers activate their overlays.

import { useState, useEffect } from "react";
import { EditModeProvider, useEditMode } from "@/contexts/EditModeContext";
import EditorTopBar from "./EditorTopBar";
import EditableImage from "@/components/shared/EditableImage";
import HeroBanner from "@/components/home/HeroBanner";
import LatestBrief from "@/components/home/LatestBrief";
import FeaturedInsight from "@/components/home/FeaturedInsight";
import SurveyCTA from "@/components/home/SurveyCTA";
import TrendingTopics from "@/components/home/TrendingTopics";
import AIToolOfTheWeek from "@/components/home/AIToolOfTheWeek";
import QuickAssessmentCTA from "@/components/home/QuickAssessmentCTA";
import UpcomingKeynote from "@/components/home/UpcomingKeynote";
import TestimonialsSection from "@/components/home/TestimonialsSection";
import FadeInOnScroll from "@/components/shared/FadeInOnScroll";
import type { HeroConfig, SectionImages } from "@/lib/page-config-server";
import type { ViewportSize } from "@/types/creative-studio";

// Viewport widths for the preview frame clamp
const VIEWPORT_WIDTHS: Record<ViewportSize, string> = {
  390: "390px",
  768: "768px",
  1440: "1440px",
};

// ─── Inner content — consumes EditModeContext ─────────────────────────────────

function HomeEditorContent() {
  const { editMode, pendingChanges } = useEditMode();
  const [viewport, setViewport] = useState<ViewportSize>(1440);
  const [showTooltip, setShowTooltip] = useState(false);

  // First-visit tooltip: show once, auto-dismiss after 6s or on first click.
  useEffect(() => {
    const key = "klo-editor-tooltip-dismissed";
    if (typeof window !== "undefined" && !localStorage.getItem(key)) {
      setShowTooltip(true);
      const t = setTimeout(() => {
        setShowTooltip(false);
        localStorage.setItem(key, "1");
      }, 6000);
      return () => clearTimeout(t);
    }
  }, []);

  const dismissTooltip = () => {
    setShowTooltip(false);
    if (typeof window !== "undefined") {
      localStorage.setItem("klo-editor-tooltip-dismissed", "1");
    }
  };

  // Resolve display values from pending changes
  const hero = pendingChanges.hero_config;
  const sectionImages = pendingChanges.section_images;

  const heroBackgroundImage =
    hero?.backgroundType === "image" ? (hero.backgroundRef ?? null) : null;
  const heroBackgroundColor =
    hero?.backgroundType === "color" ? (hero.backgroundRef ?? null) : null;

  const latestBriefImage =
    sectionImages?.latestBrief?.backgroundType === "image"
      ? (sectionImages.latestBrief.backgroundRef ?? null)
      : null;

  const featuredInsightImage =
    sectionImages?.featuredInsight?.backgroundType === "image"
      ? (sectionImages.featuredInsight.backgroundRef ?? null)
      : null;

  return (
    <>
      <EditorTopBar viewport={viewport} onViewportChange={setViewport} />

      {/* Editor chrome — pushes content below sticky bar */}
      <div className="pt-14 min-h-screen bg-[#0A0C10]">
        {/* Viewport preview frame */}
        <div
          className="mx-auto transition-all duration-300 origin-top"
          style={{ maxWidth: VIEWPORT_WIDTHS[viewport] }}
          onClick={showTooltip ? dismissTooltip : undefined}
        >
          {/* First-visit tooltip */}
          {showTooltip && editMode && (
            <div
              className="
                sticky top-16 z-50 mx-4 mt-4 mb-2
                flex items-center gap-3
                p-3 rounded-xl
                bg-[#2764FF]/15 border border-[#2764FF]/30
                text-sm text-[#E6EDF3]
                animate-in fade-in duration-300
              "
            >
              <span className="text-lg">👆</span>
              <span>Click any picture to change it.</span>
              <button
                onClick={dismissTooltip}
                className="ml-auto text-[#8B949E] hover:text-[#E6EDF3] text-xs min-h-[32px] px-2"
              >
                Got it
              </button>
            </div>
          )}

          {/* Hero — wrapped in EditableImage */}
          <EditableImage
            slot="hero"
            label="Hero background"
            currentUrl={heroBackgroundImage}
          >
            <HeroBanner
              headline={hero?.headline || undefined}
              subheadline={hero?.subheadline || undefined}
              backgroundColor={heroBackgroundColor}
              backgroundImage={heroBackgroundImage}
              overlayOpacity={hero?.overlayOpacity}
            />
          </EditableImage>

          {/* Remaining sections */}
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 bg-[#0D1117] overflow-hidden">
            <div className="absolute top-[20%] -left-40 h-80 w-80 rounded-full bg-[#2764FF]/[0.07] blur-[100px]" />
            <div className="absolute top-[60%] -right-40 h-80 w-80 rounded-full bg-[#21B8CD]/[0.07] blur-[100px]" />
            <div className="absolute top-[85%] -left-20 h-60 w-60 rounded-full bg-[#8840FF]/[0.05] blur-[100px]" />
            <div className="py-16 space-y-20">
              <SurveyCTA />
              <FadeInOnScroll delay={0}>
                <UpcomingKeynote />
              </FadeInOnScroll>

              {/* Latest Brief — wrapped */}
              <FadeInOnScroll delay={0.05}>
                <EditableImage
                  slot="latestBrief"
                  label="Latest Brief watermark"
                  currentUrl={latestBriefImage}
                >
                  <LatestBrief backgroundImage={latestBriefImage} />
                </EditableImage>
              </FadeInOnScroll>

              <FadeInOnScroll delay={0.1}>
                <TrendingTopics />
              </FadeInOnScroll>

              {/* Featured Insight — wrapped */}
              <FadeInOnScroll delay={0.05}>
                <EditableImage
                  slot="featuredInsight"
                  label="Featured Insight watermark"
                  currentUrl={featuredInsightImage}
                >
                  <FeaturedInsight backgroundImage={featuredInsightImage} />
                </EditableImage>
              </FadeInOnScroll>

              <FadeInOnScroll delay={0.1}>
                <AIToolOfTheWeek />
              </FadeInOnScroll>
              <FadeInOnScroll delay={0.05}>
                <TestimonialsSection />
              </FadeInOnScroll>
              <FadeInOnScroll delay={0.05}>
                <QuickAssessmentCTA />
              </FadeInOnScroll>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Exported HomeEditor — provides context ───────────────────────────────────

interface HomeEditorProps {
  initialHeroConfig: HeroConfig | null;
  initialSectionImages: SectionImages | null;
}

export default function HomeEditor({
  initialHeroConfig,
  initialSectionImages,
}: HomeEditorProps) {
  return (
    <EditModeProvider
      initialHeroConfig={initialHeroConfig}
      initialSectionImages={initialSectionImages}
    >
      <HomeEditorContent />
    </EditModeProvider>
  );
}
