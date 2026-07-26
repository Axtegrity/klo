import HeroBanner from "@/components/home/HeroBanner";
import LiveSessionGate from "@/components/home/LiveSessionGate";
import SurveyCTA from "@/components/home/SurveyCTA";
import LatestBrief from "@/components/home/LatestBrief";
import TrendingTopics from "@/components/home/TrendingTopics";
import FeaturedInsight, { type LatestVaultItem } from "@/components/home/FeaturedInsight";
import AIToolOfTheWeek from "@/components/home/AIToolOfTheWeek";
import QuickAssessmentCTA from "@/components/home/QuickAssessmentCTA";
import UpcomingKeynote from "@/components/home/UpcomingKeynote";
import TestimonialsSection from "@/components/home/TestimonialsSection";
import FadeInOnScroll from "@/components/shared/FadeInOnScroll";
import { getPageConfig, type TrendingConfig } from "@/lib/page-config-server";
import { getServiceSupabase } from "@/lib/supabase";

// Force dynamic so admin edits to page_configs reflect immediately
export const dynamic = "force-dynamic";

async function getTrendingTopicsFromFeaturedArticles(
  adminHeading?: string
): Promise<TrendingConfig | null> {
  try {
    const supabase = getServiceSupabase();
    const { data: featured, error } = await supabase
      .from("vault_content")
      .select("category")
      .eq("featured_in_feed", true)
      .eq("visibility", "published");

    if (error) {
      console.error("[getTrendingTopicsFromFeaturedArticles]", error);
      return null;
    }

    if (!featured || featured.length === 0) return null;

    // Filter out empty categories to prevent broken trending buttons
    const validCategories = featured.filter((item) => item.category?.trim());
    if (validCategories.length === 0) return null;

    // Count articles per category
    const categoryCounts = validCategories.reduce(
      (acc: Record<string, number>, item: { category: string }) => {
        acc[item.category] = (acc[item.category] || 0) + 1;
        return acc;
      },
      {}
    );

    // Get top 5 categories by count
    const topCategories = Object.entries(categoryCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([category]) => category);

    // Return null if no featured articles
    if (topCategories.length === 0) return null;

    // Build trending config from featured categories (1 to 5, depending on how many Keith featured)
    return {
      heading: adminHeading ?? "Trending in Tech & Faith",
      topic1: topCategories[0],
      topic2: topCategories[1],
      topic3: topCategories[2],
      topic4: topCategories[3],
      topic5: topCategories[4],
    };
  } catch (err) {
    console.error("[getTrendingTopicsFromFeaturedArticles]", err);
    return null;
  }
}

// Featured Insight: auto-populate from the most recently published Vault
// article instead of relying solely on admin-configured content. Purely
// additive — src/components/home/FeaturedInsight.tsx falls back to
// insight_config/DEFAULTS exactly as before whenever this returns null
// (e.g. no vault_content rows are published yet).
async function getLatestVaultItem(): Promise<LatestVaultItem | null> {
  try {
    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from("vault_content")
      .select("title, excerpt, slug, category, tier_required")
      .eq("visibility", "published")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("[getLatestVaultItem]", error);
      return null;
    }

    return data as LatestVaultItem | null;
  } catch (err) {
    console.error("[getLatestVaultItem]", err);
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
  // Pull trending topics from featured vault articles (Keith's star selections)
  const trendingConfig   = (await getTrendingTopicsFromFeaturedArticles(pageConfig?.trending_config?.heading)) ?? pageConfig?.trending_config ?? null;
  const insightConfig    = pageConfig?.insight_config    ?? null;
  const toolConfig       = pageConfig?.tool_config       ?? null;
  const assessmentConfig = pageConfig?.assessment_config ?? null;

  const featuredInsightImage =
    sectionImages?.featuredInsight?.backgroundType === "image"
      ? (sectionImages.featuredInsight.backgroundRef ?? null)
      : null;
  const latestVaultItem = await getLatestVaultItem();

  return (
    <>
      <LiveSessionGate />
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
          <FadeInOnScroll delay={0}>
            <UpcomingKeynote />
          </FadeInOnScroll>
          <SurveyCTA />
          <FadeInOnScroll delay={0.05}>
            <LatestBrief backgroundImage={latestBriefImage} briefConfig={briefConfig} />
          </FadeInOnScroll>
          <FadeInOnScroll delay={0.1}>
            <TrendingTopics trendingConfig={trendingConfig} />
          </FadeInOnScroll>
          <FadeInOnScroll delay={0.05}>
            <FeaturedInsight
              backgroundImage={featuredInsightImage}
              insightConfig={insightConfig}
              latestVaultItem={latestVaultItem}
            />
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
        </div>
      </div>
    </>
  );
}
