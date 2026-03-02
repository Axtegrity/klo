"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, ChevronLeft, ChevronRight } from "lucide-react";
import Card from "@/components/shared/Card";

/* ------------------------------------------------------------------ */
/*  Data                                                                */
/* ------------------------------------------------------------------ */

interface Testimonial {
  quote: string;
  name: string;
  title: string;
  org: string;
  rating: number;
}

/* NOTE: These are sample testimonials for illustrative purposes only.
   They represent the types of feedback Keith typically receives.
   Replace with verified testimonials as they become available. */
const testimonials: Testimonial[] = [
  {
    quote:
      "Keith brought a level of clarity and energy to our event that resonated deeply with every attendee. His ability to bridge technology and faith is truly exceptional.",
    name: "Conference Organizer",
    title: "Faith & Technology Event",
    org: "Sample Testimonial",
    rating: 5,
  },
  {
    quote:
      "The feedback from our technology summit was overwhelmingly positive. Keith made complex concepts accessible and actionable for our executive audience.",
    name: "Event Director",
    title: "Annual Technology Summit",
    org: "Sample Testimonial",
    rating: 5,
  },
  {
    quote:
      "Keith does not just speak — he transforms the room. His passion for empowering communities through technology is authentic and contagious.",
    name: "Program Coordinator",
    title: "Leadership Conference",
    org: "Sample Testimonial",
    rating: 5,
  },
  {
    quote:
      "Keith presented a compelling vision for digital governance that was both practical and inspiring. Our team immediately began implementing his recommendations.",
    name: "Technology Leader",
    title: "Enterprise Strategy Session",
    org: "Sample Testimonial",
    rating: 5,
  },
  {
    quote:
      "Keith has a rare gift for making technology feel human. His workshop on technology strategy gave our leadership team the confidence and framework to move forward boldly.",
    name: "Ministry Leader",
    title: "Church Technology Workshop",
    org: "Sample Testimonial",
    rating: 5,
  },
  {
    quote:
      "The message on faith-driven innovation left a lasting impact. Our attendees are still talking about the insights and practical steps Keith shared.",
    name: "Events Coordinator",
    title: "Community Impact Event",
    org: "Sample Testimonial",
    rating: 5,
  },
];

/* ------------------------------------------------------------------ */
/*  Animation variants                                                  */
/* ------------------------------------------------------------------ */

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.45, ease: "easeOut" as const },
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -300 : 300,
    opacity: 0,
    transition: { duration: 0.35, ease: "easeOut" as const },
  }),
};

/* ------------------------------------------------------------------ */
/*  Testimonial card                                                    */
/* ------------------------------------------------------------------ */

function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  return (
    <Card className="h-full flex flex-col relative overflow-hidden">
      {/* Left accent bar */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#2764FF] to-[#21B8CD]" />
      <div className="pl-3">
        <div className="flex gap-1 mb-4">
          {Array.from({ length: 5 }).map((_, idx) => (
            <Star
              key={idx}
              size={16}
              className={
                idx < testimonial.rating
                  ? "text-[#C8A84E] fill-[#C8A84E]"
                  : "text-klo-slate"
              }
            />
          ))}
        </div>
        <blockquote className="text-klo-muted text-sm leading-relaxed flex-1">
          &ldquo;{testimonial.quote}&rdquo;
        </blockquote>
        <div className="mt-6 pt-4 border-t border-[#21262D]">
        <p className="text-klo-text text-sm font-semibold">
          {testimonial.name}
        </p>
        <p className="text-klo-muted text-xs mt-0.5">
          {testimonial.title}, {testimonial.org}
        </p>
        </div>
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                      */
/* ------------------------------------------------------------------ */

export default function Testimonials() {
  // On desktop we show 3 at a time, on mobile 1
  const [perPage, setPerPage] = useState(3);
  const [page, setPage] = useState(0);
  const [direction, setDirection] = useState(0);

  const totalPages = Math.ceil(testimonials.length / perPage);

  // Responsive detection
  useEffect(() => {
    function handleResize() {
      setPerPage(window.innerWidth >= 768 ? 3 : 1);
    }
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Reset page if perPage changes and page is out of bounds
  useEffect(() => {
    if (page >= totalPages) {
      setPage(0);
    }
  }, [perPage, page, totalPages]);

  // Auto-rotate every 6 seconds
  const nextPage = useCallback(() => {
    setDirection(1);
    setPage((prev) => (prev + 1) % totalPages);
  }, [totalPages]);

  useEffect(() => {
    const interval = setInterval(nextPage, 6000);
    return () => clearInterval(interval);
  }, [nextPage]);

  const prevPage = () => {
    setDirection(-1);
    setPage((prev) => (prev - 1 + totalPages) % totalPages);
  };

  const goToPage = (idx: number) => {
    setDirection(idx > page ? 1 : -1);
    setPage(idx);
  };

  const visibleTestimonials = testimonials.slice(
    page * perPage,
    page * perPage + perPage
  );

  return (
    <div>
      {/* Carousel area */}
      <div className="relative">
        {/* Prev / Next buttons */}
        <button
          onClick={prevPage}
          aria-label="Previous testimonials"
          className="absolute -left-4 md:-left-6 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-[#161B22] border border-[#21262D] flex items-center justify-center text-klo-muted hover:text-[#2764FF] hover:border-[#2764FF]/40 transition-colors duration-200 cursor-pointer"
        >
          <ChevronLeft size={20} />
        </button>
        <button
          onClick={() => {
            setDirection(1);
            setPage((prev) => (prev + 1) % totalPages);
          }}
          aria-label="Next testimonials"
          className="absolute -right-4 md:-right-6 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-[#161B22] border border-[#21262D] flex items-center justify-center text-klo-muted hover:text-[#2764FF] hover:border-[#2764FF]/40 transition-colors duration-200 cursor-pointer"
        >
          <ChevronRight size={20} />
        </button>

        {/* Cards */}
        <div className="overflow-hidden px-2">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={page}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              {visibleTestimonials.map((t) => (
                <TestimonialCard key={t.name} testimonial={t} />
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation dots */}
      <div className="flex items-center justify-center gap-2 mt-8">
        {Array.from({ length: totalPages }).map((_, idx) => (
          <button
            key={idx}
            onClick={() => goToPage(idx)}
            aria-label={`Go to page ${idx + 1}`}
            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
              idx === page
                ? "bg-[#2764FF] w-6"
                : "bg-klo-slate hover:bg-klo-muted"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
