import { Star } from "lucide-react";
import { getApprovedTestimonials } from "@/lib/marketing-server";

// Server component — fetches approved testimonials and renders them on the
// home page. Returns null when there are no approved entries so the page
// degrades gracefully instead of showing an empty section.
export default async function TestimonialsSection() {
  const testimonials = await getApprovedTestimonials(6);
  if (testimonials.length === 0) return null;

  return (
    <section>
      {/* Section heading — matches FeaturedInsight / TrendingTopics pattern */}
      <div className="flex items-center gap-4 mb-8">
        <span className="w-10 h-1 bg-gradient-to-r from-[#2764FF] to-[#21B8CD] rounded-full" />
        <h2 className="font-display text-3xl sm:text-4xl font-bold bg-gradient-to-r from-[#E6EDF3] to-[#8B949E] bg-clip-text text-transparent uppercase tracking-wide">
          What Organizers Are Saying
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {testimonials.map((t) => (
          <figure
            key={t.id}
            className="relative bg-[#161B22] border border-[#21262D] rounded-xl p-6 transition-all duration-300 hover:border-[#2764FF]/30 hover:shadow-[0_0_30px_rgba(39,100,255,0.1)] flex flex-col"
          >
            {/* Star rating */}
            <div
              className="flex items-center gap-1 mb-4"
              aria-label={`Rated ${t.rating} out of 5 stars`}
            >
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={
                    i < t.rating
                      ? "w-4 h-4 fill-[#C8A84E] text-[#C8A84E]"
                      : "w-4 h-4 text-[#30363D]"
                  }
                  aria-hidden="true"
                />
              ))}
            </div>

            {/* Quote */}
            <blockquote className="text-sm sm:text-base text-[#E6EDF3] leading-relaxed flex-1">
              &ldquo;{t.quote}&rdquo;
            </blockquote>

            {/* Attribution */}
            {t.organizer_name && (
              <figcaption className="mt-5 pt-4 border-t border-[#21262D] text-xs font-medium uppercase tracking-wide text-[#8B949E]">
                {t.organizer_name}
              </figcaption>
            )}
          </figure>
        ))}
      </div>
    </section>
  );
}
