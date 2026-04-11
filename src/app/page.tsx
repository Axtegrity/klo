import HeroBanner from "@/components/home/HeroBanner";
import SurveyCTA from "@/components/home/SurveyCTA";
import LatestBrief from "@/components/home/LatestBrief";
import TrendingTopics from "@/components/home/TrendingTopics";
import FeaturedInsight from "@/components/home/FeaturedInsight";
import AIToolOfTheWeek from "@/components/home/AIToolOfTheWeek";
import QuickAssessmentCTA from "@/components/home/QuickAssessmentCTA";
import UpcomingKeynote from "@/components/home/UpcomingKeynote";
import TestimonialsSection from "@/components/home/TestimonialsSection";
import FadeInOnScroll from "@/components/shared/FadeInOnScroll";
import { getPageConfig } from "@/lib/page-config-server";

// Force dynamic so admin edits to page_configs reflect immediately
export const dynamic = "force-dynamic";

export default async function Home() {
  const pageConfig = await getPageConfig("home");
  const hero = pageConfig?.hero_config;

  return (
    <>
      {/* Hero — full width. Admin-overridable via page_configs.hero_config */}
      <HeroBanner
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
            <LatestBrief />
          </FadeInOnScroll>
          <FadeInOnScroll delay={0.1}>
            <TrendingTopics />
          </FadeInOnScroll>
          <FadeInOnScroll delay={0.05}>
            <FeaturedInsight />
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
    </>
  );
}
