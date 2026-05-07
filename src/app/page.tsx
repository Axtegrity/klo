import HeroBanner from "@/components/home/HeroBanner";
import SurveyCTA from "@/components/home/SurveyCTA";
import LatestBrief from "@/components/home/LatestBrief";
import TrendingTopics from "@/components/home/TrendingTopics";
import FeaturedInsight from "@/components/home/FeaturedInsight";
import AIToolOfTheWeek from "@/components/home/AIToolOfTheWeek";
import QuickAssessmentCTA from "@/components/home/QuickAssessmentCTA";
import UpcomingKeynote from "@/components/home/UpcomingKeynote";
import UpcomingStrategyRoom from "@/components/home/UpcomingStrategyRoom";
import TestimonialsSection from "@/components/home/TestimonialsSection";
import FadeInOnScroll from "@/components/shared/FadeInOnScroll";
import { getPageConfig, type StrategyConfig } from "@/lib/page-config-server";
import { getServiceSupabase } from "@/lib/supabase";

// Force dynamic so admin edits to page_configs reflect immediately
export const dynamic = "force-dynamic";

async function getNextStrategySession(): Promise<StrategyConfig | null> {
  try {
    const supabase = getServiceSupabase();

    const { data: session } = await supabase
      .from("strategy_sessions")
      .select("id, slug, title, date, description, total_seats")
      .eq("published", true)
      .eq("is_past", false)
      .order("session_date", { ascending: true, nullsFirst: false })
      .limit(1)
      .maybeSingle();

    if (!session) return null;

    const { count: regCount } = await supabase
      .from("strategy_registrations")
      .select("*", { count: "exact", head: true })
      .eq("session_id", session.id)
      .eq("status", "registered");

    const seatsRemaining = session.total_seats - (regCount ?? 0);

    return {
      heading: "Next Strategy Room",
      title: session.title,
      date: session.date ?? "",
      description: session.description ?? "",
      seats: `${seatsRemaining} of ${session.total_seats}`,
      cta: "Register",
      link: `/strategy-rooms/${session.slug}`,
    };
  } catch {
    return null;
  }
}

export default async function Home() {
  const pageConfig = await getPageConfig("home");
  const hero = pageConfig?.hero_config;
  const sectionImages = pageConfig?.section_images;

  // Resolve section background images — use admin override when set, otherwise
  // each component falls back to its own hardcoded default.
  const latestBriefImage =
    sectionImages?.latestBrief?.backgroundType === "image"
      ? (sectionImages.latestBrief.backgroundRef ?? null)
      : null;
  const briefConfig      = pageConfig?.brief_config      ?? null;
  const trendingConfig   = pageConfig?.trending_config   ?? null;
  const insightConfig    = pageConfig?.insight_config    ?? null;
  const toolConfig       = pageConfig?.tool_config       ?? null;
  const assessmentConfig = pageConfig?.assessment_config ?? null;
  const strategyConfig   = pageConfig?.strategy_config   ?? null;

  const featuredInsightImage =
    sectionImages?.featuredInsight?.backgroundType === "image"
      ? (sectionImages.featuredInsight.backgroundRef ?? null)
      : null;

  // Auto-pull next upcoming published session for the home page card.
  // Falls back to admin-authored strategy_config, then to component defaults.
  const autoStrategyConfig = await getNextStrategySession();
  const effectiveStrategyConfig = autoStrategyConfig ?? strategyConfig;

  return (
    <>
      {/* Hero — full width. Admin-overridable via page_configs.hero_config */}
      <HeroBanner
        label={hero?.label || undefined}
        headline={hero?.headline || undefined}
        subheadline={hero?.subheadline || undefined}
        backgroundColor={hero?.backgroundType === "color" ? hero?.backgroundRef : null}
        backgroundImage={hero?.backgroundType === "image" ? hero?.backgroundRef : null}
        overlayOpacity={hero?.overlayOpacity}
      />

      {/* Remaining sections — contained and spaced */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 bg-[#0D1117] overflow-hidden">
        {/* Decorative gradient orbs */}
        <div className="absolute top-[20%] -left-40 h-80 w-80 rounded-full bg-[#2764FF]/[0.07] blur-[100px]" />
        <div className="absolute top-[60%] -right-40 h-80 w-80 rounded-full bg-[#21B8CD]/[0.07] blur-[100px]" />
        <div className="absolute top-[85%] -left-20 h-60 w-60 rounded-full bg-[#8840FF]/[0.05] blur-[100px]" />
        <div className="py-16 space-y-20">
          <SurveyCTA />
          <FadeInOnScroll delay={0}>
            <UpcomingKeynote />
          </FadeInOnScroll>
          <FadeInOnScroll delay={0.05}>
            <LatestBrief backgroundImage={latestBriefImage} briefConfig={briefConfig} />
          </FadeInOnScroll>
          <FadeInOnScroll delay={0.1}>
            <TrendingTopics trendingConfig={trendingConfig} />
          </FadeInOnScroll>
          <FadeInOnScroll delay={0.05}>
            <FeaturedInsight backgroundImage={featuredInsightImage} insightConfig={insightConfig} />
          </FadeInOnScroll>
          <FadeInOnScroll delay={0.1}>
            <AIToolOfTheWeek toolConfig={toolConfig} />
          </FadeInOnScroll>
          <FadeInOnScroll delay={0.05}>
            <TestimonialsSection />
          </FadeInOnScroll>
          <FadeInOnScroll delay={0.05}>
            <QuickAssessmentCTA assessmentConfig={assessmentConfig} />
          </FadeInOnScroll>
          {strategyConfig?.visible !== false && (
            <FadeInOnScroll delay={0.05}>
              <UpcomingStrategyRoom strategyConfig={effectiveStrategyConfig} />
            </FadeInOnScroll>
          )}
        </div>
      </div>
    </>
  );
}
