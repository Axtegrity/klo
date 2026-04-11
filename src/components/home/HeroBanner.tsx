"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.3,
    },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
};

const scrollImages = [
  "/images/keith/hero-1.jpg",
  "/images/keith/hero-3.jpg",
  "/images/keith/hero-5.jpg",
];

interface HeroBannerProps {
  headline?: string;
  subheadline?: string;
  backgroundColor?: string | null;
  backgroundImage?: string | null;
  overlayOpacity?: number;
}

export default function HeroBanner({
  headline,
  subheadline,
  backgroundColor,
  backgroundImage,
  overlayOpacity,
}: HeroBannerProps = {}) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Admin overrides: a non-null backgroundColor or backgroundImage from
  // page_configs.hero_config replaces the default Keith photo slideshow.
  const useSlideshow = !backgroundColor && !backgroundImage;

  useEffect(() => {
    if (!useSlideshow) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % scrollImages.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [useSlideshow]);

  // overlayOpacity (0–1) tunes the left-edge darkness of the gradient. Falls
  // back to 0.95 — the original hard-coded value — when admin hasn't set one.
  const leftAlpha = typeof overlayOpacity === "number" ? overlayOpacity : 0.95;
  const midAlpha = leftAlpha * 0.74;
  const rightAlpha = leftAlpha * 0.32;

  return (
    <section
      className="relative min-h-screen flex items-center overflow-hidden bg-[#0D1117]"
      style={{
        clipPath: "inset(0)",
        ...(backgroundColor ? { backgroundColor } : {}),
      }}
    >
      {/* Background: admin-override image, admin-override color, or default Keith slideshow */}
      <div className="absolute inset-0">
        {backgroundImage ? (
          <Image
            src={backgroundImage}
            alt=""
            fill
            priority
            className="object-cover object-top"
            sizes="100vw"
          />
        ) : useSlideshow ? (
          scrollImages.map((src, i) => (
            <motion.div
              key={src}
              className="absolute inset-0"
              animate={{ opacity: i === currentIndex ? 1 : 0 }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
            >
              <Image
                src={src}
                alt="Keith L. Odom"
                fill
                priority={i === 0}
                className="object-cover object-top"
                sizes="100vw"
              />
            </motion.div>
          ))
        ) : null}
      </div>

      {/* Dark gradient overlay */}
      <div
        className="absolute inset-0 z-[1]"
        style={{
          background: `linear-gradient(to right, rgba(13,17,23,${leftAlpha}) 0%, rgba(13,17,23,${midAlpha}) 50%, rgba(13,17,23,${rightAlpha}) 100%)`,
        }}
      />

      {/* Bottom fade to page background */}
      <div
        className="absolute bottom-0 left-0 right-0 h-32 z-[2]"
        style={{
          background:
            "linear-gradient(to top, #0D1117 0%, transparent 100%)",
        }}
      />

      {/* Content */}
      <motion.div
        className="relative z-10 max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 w-full"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="max-w-2xl">
          {/* Label */}
          <motion.p
            variants={fadeUp}
            className="text-xs sm:text-sm uppercase tracking-[0.2em] text-[#8B949E] font-medium mb-6"
          >
            Technology Innovator &bull; Strategic Advisor &bull; Speaker
          </motion.p>

          {/* Name / headline — admin-overridable via page_configs.hero_config */}
          <motion.h1
            variants={fadeUp}
            className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold mb-6 bg-gradient-to-r from-[#2764FF] to-[#21B8CD] bg-clip-text text-transparent"
          >
            {headline || "Keith L. Odom"}
          </motion.h1>

          {/* Tagline / subheadline — admin-overridable */}
          <motion.p
            variants={fadeUp}
            className="text-lg sm:text-xl text-[#E6EDF3] leading-relaxed mb-10 max-w-xl"
          >
            {subheadline ||
              "Empowering organizations with AI-driven strategy and digital transformation"}
          </motion.p>

          {/* CTA buttons */}
          <motion.div
            variants={fadeUp}
            className="flex flex-col sm:flex-row gap-3"
          >
            <Link
              href="/advisor"
              className="group relative inline-flex items-center justify-center px-6 py-4 bg-gradient-to-r from-[#2764FF] to-[#21B8CD] text-white font-bold text-sm uppercase tracking-wider rounded-full transition-all duration-300 hover:shadow-lg hover:shadow-[#2764FF]/25 hover:scale-105 active:scale-[0.98] text-center"
            >
              KLO Intelligence
            </Link>
            <Link
              href="/consult"
              className="inline-flex items-center justify-center px-6 py-4 border-2 border-[#E6EDF3]/30 text-[#E6EDF3] font-bold text-sm uppercase tracking-wider rounded-full transition-all duration-300 hover:border-[#E6EDF3]/60 hover:bg-[#E6EDF3]/5 active:scale-[0.98] text-center"
            >
              Book a Consultation
            </Link>
          </motion.div>
        </div>
      </motion.div>

    </section>
  );
}
