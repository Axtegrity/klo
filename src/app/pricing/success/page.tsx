"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { motion } from "framer-motion";
import { CheckCircle, LayoutDashboard, Lock, BotMessageSquare } from "lucide-react";
import Button from "@/components/shared/Button";

/* ------------------------------------------------------------------ */
/*  Tier metadata                                                      */
/* ------------------------------------------------------------------ */

const tierInfo: Record<
  string,
  { label: string; unlocked: string[]; color: string }
> = {
  pro: {
    label: "Pro",
    unlocked: [
      "All assessments with detailed reports",
      "Full Vault content library",
      "AI Advisor (50 messages/month)",
      "Community feed & discussions",
      "Monthly strategy newsletter",
    ],
    color: "text-klo-gold",
  },
  executive: {
    label: "Executive",
    unlocked: [
      "Everything in Pro",
      "Unlimited AI Advisor access",
      "Private Strategy Rooms",
      "Priority consulting requests",
      "Exclusive executive Vault content",
      "Quarterly 1-on-1 strategy call",
    ],
    color: "text-klo-gold",
  },
};

/* ------------------------------------------------------------------ */
/*  Animations                                                         */
/* ------------------------------------------------------------------ */

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.2,
      ease: "easeOut" as const,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" as const },
  },
};

const checkVariants = {
  hidden: { scale: 0, rotate: -180 },
  visible: {
    scale: 1,
    rotate: 0,
    transition: { type: "spring" as const, stiffness: 200, damping: 15, delay: 0.1 },
  },
};

const ringVariants = {
  hidden: { scale: 0.8, opacity: 0 },
  visible: {
    scale: [0.8, 1.2, 1],
    opacity: [0, 0.5, 0],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      repeatDelay: 2,
      ease: "easeOut" as const,
    },
  },
};

/* ------------------------------------------------------------------ */
/*  Inner Content (uses useSearchParams)                               */
/* ------------------------------------------------------------------ */

function SuccessContent() {
  const searchParams = useSearchParams();
  const tier = searchParams.get("tier") ?? "pro";
  const info = tierInfo[tier] ?? tierInfo.pro;

  return (
    <div className="min-h-screen bg-klo-navy flex items-center justify-center px-4 py-16">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-lg w-full text-center"
      >
        {/* Animated Checkmark */}
        <motion.div variants={itemVariants} className="mb-8 flex justify-center">
          <div className="relative">
            {/* Pulsing Ring */}
            <motion.div
              variants={ringVariants}
              className="absolute inset-0 rounded-full border-2 border-[#2764FF]"
            />
            {/* Check Circle */}
            <motion.div
              variants={checkVariants}
              className="relative flex items-center justify-center w-24 h-24 rounded-full bg-[#2764FF]/15 border-2 border-[#2764FF]"
            >
              <CheckCircle className="h-12 w-12 text-[#2764FF]" />
            </motion.div>
          </div>
        </motion.div>

        {/* Title */}
        <motion.h1
          variants={itemVariants}
          className="font-display text-3xl sm:text-4xl font-bold text-klo-text mb-3"
        >
          Welcome to{" "}
          <span className={info.color}>{info.label}</span>!
        </motion.h1>

        <motion.p
          variants={itemVariants}
          className="text-klo-muted text-lg mb-8"
        >
          Your subscription is active. Here is what you have unlocked:
        </motion.p>

        {/* Unlocked Features */}
        <motion.div
          variants={itemVariants}
          className="bg-[#161B22] border border-[#21262D] rounded-2xl p-6 mb-8 text-left"
        >
          <ul className="space-y-3">
            {info.unlocked.map((feature, i) => (
              <motion.li
                key={feature}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  delay: 0.6 + i * 0.08,
                  duration: 0.35,
                  ease: "easeOut" as const,
                }}
                className="flex items-start gap-3 text-sm"
              >
                <CheckCircle className="h-4 w-4 text-[#2764FF] shrink-0 mt-0.5" />
                <span className="text-klo-text">{feature}</span>
              </motion.li>
            ))}
          </ul>
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col sm:flex-row gap-3 justify-center"
        >
          <Button variant="primary" size="md" href="/profile">
            <LayoutDashboard className="h-4 w-4" />
            Go to Profile
          </Button>
          <Button variant="secondary" size="md" href="/vault">
            <Lock className="h-4 w-4" />
            Explore the Vault
          </Button>
          <Button variant="ghost" size="md" href="/advisor">
            <BotMessageSquare className="h-4 w-4" />
            Try the AI Advisor
          </Button>
        </motion.div>

        {/* Guarantee Note */}
        <motion.p
          variants={itemVariants}
          className="text-klo-muted text-xs mt-8"
        >
          You are covered by our 30-day money-back guarantee. Questions?{" "}
          <a
            href="mailto:info@keithlodom.io"
            className="text-[#2764FF] hover:underline"
          >
            Reach out anytime.
          </a>
        </motion.p>
      </motion.div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page (wrapped in Suspense for useSearchParams)                     */
/* ------------------------------------------------------------------ */

export default function PricingSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-klo-navy flex items-center justify-center">
          <div className="text-klo-muted text-sm">Loading...</div>
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
