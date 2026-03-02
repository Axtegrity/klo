import HeroBanner from "@/components/home/HeroBanner";
import LatestBrief from "@/components/home/LatestBrief";
import TrendingTopics from "@/components/home/TrendingTopics";
import FeaturedInsight from "@/components/home/FeaturedInsight";
import AIToolOfTheWeek from "@/components/home/AIToolOfTheWeek";
import QuickAssessmentCTA from "@/components/home/QuickAssessmentCTA";
import UpcomingKeynote from "@/components/home/UpcomingKeynote";
import UpcomingStrategyRoom from "@/components/home/UpcomingStrategyRoom";
import FadeInOnScroll from "@/components/shared/FadeInOnScroll";

export default function Home() {
  return (
    <>
      {/* Hero — full width, no container constraints */}
      <HeroBanner />

      {/* Remaining sections — contained and spaced */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 bg-[#0D1117] overflow-hidden">
        {/* Decorative gradient orbs */}
        <div className="absolute top-[20%] -left-40 h-80 w-80 rounded-full bg-[#2764FF]/[0.07] blur-[100px]" />
        <div className="absolute top-[60%] -right-40 h-80 w-80 rounded-full bg-[#21B8CD]/[0.07] blur-[100px]" />
        <div className="absolute top-[85%] -left-20 h-60 w-60 rounded-full bg-[#8840FF]/[0.05] blur-[100px]" />
        <div className="py-16 space-y-20">
          <FadeInOnScroll delay={0}>
            <LatestBrief />
          </FadeInOnScroll>
          <FadeInOnScroll delay={0.05}>
            <TrendingTopics />
          </FadeInOnScroll>
          <FadeInOnScroll delay={0.1}>
            <FeaturedInsight />
          </FadeInOnScroll>
          <FadeInOnScroll delay={0.05}>
            <AIToolOfTheWeek />
          </FadeInOnScroll>
          <FadeInOnScroll delay={0.1}>
            <QuickAssessmentCTA />
          </FadeInOnScroll>
          <FadeInOnScroll delay={0.05}>
            <UpcomingKeynote />
          </FadeInOnScroll>
          <FadeInOnScroll delay={0.1}>
            <UpcomingStrategyRoom />
          </FadeInOnScroll>
        </div>
      </div>
    </>
  );
}
