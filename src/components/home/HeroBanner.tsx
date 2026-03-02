"use client";

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

export default function HeroBanner() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-[#0D1117]">
      {/* Background image with Ken Burns animation */}
      <div className="absolute inset-0 animate-kenburns">
        <Image
          src="/images/keith/KO.jpg"
          alt="Keith L. Odom"
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
      </div>

      {/* Dark gradient overlay */}
      <div
        className="absolute inset-0 z-[1]"
        style={{
          background:
            "linear-gradient(to right, rgba(13,17,23,0.95) 0%, rgba(13,17,23,0.7) 50%, rgba(13,17,23,0.3) 100%)",
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

          {/* Name */}
          <motion.h1
            variants={fadeUp}
            className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold mb-6 bg-gradient-to-r from-[#2764FF] to-[#21B8CD] bg-clip-text text-transparent"
          >
            Keith L. Odom
          </motion.h1>

          {/* Tagline */}
          <motion.p
            variants={fadeUp}
            className="text-lg sm:text-xl text-[#E6EDF3] leading-relaxed mb-10 max-w-xl"
          >
            Empowering organizations with AI-driven strategy and digital
            transformation
          </motion.p>

          {/* CTA buttons */}
          <motion.div
            variants={fadeUp}
            className="flex flex-col sm:flex-row items-start gap-4"
          >
            <Link
              href="/advisor"
              className="inline-flex items-center justify-center px-10 py-4 bg-gradient-to-r from-[#2764FF] to-[#21B8CD] text-white font-bold text-sm uppercase tracking-wider rounded-full transition-all duration-300 hover:shadow-lg hover:shadow-[#2764FF]/25 hover:scale-105 active:scale-[0.98] w-full sm:w-auto"
            >
              Explore AI Advisor
            </Link>
            <Link
              href="/booking"
              className="inline-flex items-center justify-center px-10 py-4 border-2 border-[#E6EDF3]/30 text-[#E6EDF3] font-bold text-sm uppercase tracking-wider rounded-full transition-all duration-300 hover:border-[#E6EDF3]/60 hover:bg-[#E6EDF3]/5 active:scale-[0.98] w-full sm:w-auto"
            >
              Book a Consultation
            </Link>
          </motion.div>
        </div>
      </motion.div>

      {/* Ken Burns keyframes injected via style tag */}
      <style jsx global>{`
        @keyframes kenburns {
          0% {
            transform: scale(1);
          }
          100% {
            transform: scale(1.08);
          }
        }
        .animate-kenburns {
          animation: kenburns 20s ease-out forwards;
        }
      `}</style>
    </section>
  );
}
