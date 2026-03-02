"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, X, Crown, Sparkles, ArrowRight, Check } from "lucide-react";
import Link from "next/link";
import type { SubscriptionTier } from "@/hooks/useSubscription";

interface UpgradePromptProps {
  feature: string;
  requiredTier: SubscriptionTier;
  currentTier: SubscriptionTier;
  variant?: "inline" | "banner" | "modal";
}

const tierLabels: Record<SubscriptionTier, string> = {
  free: "Free",
  pro: "Pro",
  executive: "Executive",
};

const tierFeatureHighlights: Record<SubscriptionTier, string[]> = {
  free: [],
  pro: [
    "All assessments with detailed reports",
    "Unlimited AI Advisor queries",
    "Full vault access",
    "Priority support",
  ],
  executive: [
    "Everything in Pro",
    "1-on-1 advisory sessions",
    "Custom assessment frameworks",
    "Executive briefing documents",
  ],
};

const fadeIn = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: "easeOut" as const },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: { duration: 0.2, ease: "easeOut" as const },
  },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.3, ease: "easeOut" as const },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.2, ease: "easeOut" as const },
  },
};

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.2, ease: "easeOut" as const },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.2, ease: "easeOut" as const },
  },
};

function getDismissKey(feature: string, variant: string): string {
  return `klo-upgrade-dismissed-${variant}-${feature.replace(/\s+/g, "-").toLowerCase()}`;
}

export default function UpgradePrompt({
  feature,
  requiredTier,
  currentTier,
  variant = "inline",
}: UpgradePromptProps) {
  const [isDismissed, setIsDismissed] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      const key = getDismissKey(feature, variant);
      return sessionStorage.getItem(key) === "true";
    } catch {
      return false;
    }
  });
  const [mounted] = useState(() => typeof window !== "undefined");

  function dismiss() {
    setIsDismissed(true);
    try {
      const key = getDismissKey(feature, variant);
      sessionStorage.setItem(key, "true");
    } catch {
      // sessionStorage unavailable
    }
  }

  if (!mounted || isDismissed) return null;

  if (variant === "inline") {
    return (
      <motion.div
        variants={fadeIn}
        initial="hidden"
        animate="visible"
        className="bg-klo-dark border border-klo-slate rounded-xl p-5"
      >
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-klo-gold/10 flex items-center justify-center">
            <Lock className="w-5 h-5 text-klo-gold" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-klo-text mb-1">
              {feature}
            </p>
            <p className="text-xs text-klo-muted mb-3">
              This feature requires a{" "}
              <span className="text-klo-gold font-medium">
                {tierLabels[requiredTier]}
              </span>{" "}
              subscription. You are currently on the{" "}
              <span className="font-medium text-klo-text">
                {tierLabels[currentTier]}
              </span>{" "}
              plan.
            </p>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-klo-gold text-klo-dark rounded-lg hover:brightness-110 transition-all duration-200"
            >
              Upgrade to {tierLabels[requiredTier]}
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </motion.div>
    );
  }

  if (variant === "banner") {
    return (
      <AnimatePresence>
        <motion.div
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="relative w-full rounded-xl overflow-hidden border border-klo-gold/20"
          style={{
            background:
              "linear-gradient(135deg, rgba(200,168,78,0.08) 0%, rgba(10,22,40,0.95) 50%, rgba(200,168,78,0.05) 100%)",
          }}
        >
          <div className="flex items-center justify-between gap-4 px-6 py-4">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-9 h-9 rounded-full bg-klo-gold/15 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-klo-gold" />
              </div>
              <div>
                <p className="text-sm font-semibold text-klo-text">
                  Unlock {feature}
                </p>
                <p className="text-xs text-klo-muted">
                  Upgrade to{" "}
                  <span className="text-klo-gold font-medium">
                    {tierLabels[requiredTier]}
                  </span>{" "}
                  to access this feature and more.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <Link
                href="/pricing"
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold bg-klo-gold text-klo-dark rounded-lg hover:brightness-110 transition-all duration-200"
              >
                Upgrade Now
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <button
                onClick={dismiss}
                className="p-1.5 rounded-lg text-klo-muted hover:text-klo-text hover:bg-white/5 transition-colors duration-200"
                aria-label="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // Modal variant
  return (
    <AnimatePresence>
      <motion.div
        variants={overlayVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={(e) => {
          if (e.target === e.currentTarget) dismiss();
        }}
      >
        <motion.div
          variants={scaleIn}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="relative w-full max-w-md bg-klo-navy border border-klo-slate rounded-2xl overflow-hidden shadow-2xl"
        >
          {/* Header gradient */}
          <div
            className="px-6 pt-6 pb-4"
            style={{
              background:
                "linear-gradient(180deg, rgba(200,168,78,0.08) 0%, transparent 100%)",
            }}
          >
            <button
              onClick={dismiss}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-klo-muted hover:text-klo-text hover:bg-white/5 transition-colors duration-200"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-12 h-12 rounded-xl bg-klo-gold/15 flex items-center justify-center mb-4">
              <Crown className="w-6 h-6 text-klo-gold" />
            </div>

            <h3 className="text-lg font-display font-bold text-klo-text mb-1">
              Upgrade to {tierLabels[requiredTier]}
            </h3>
            <p className="text-sm text-klo-muted">
              {feature} requires a {tierLabels[requiredTier]} subscription.
            </p>
          </div>

          {/* Features comparison */}
          <div className="px-6 pb-4">
            <p className="text-xs font-semibold text-klo-muted uppercase tracking-wider mb-3">
              What you get with {tierLabels[requiredTier]}
            </p>
            <ul className="space-y-2.5 mb-6">
              {tierFeatureHighlights[requiredTier].map((feat) => (
                <li
                  key={feat}
                  className="flex items-start gap-2.5 text-sm text-klo-text"
                >
                  <Check className="w-4 h-4 text-klo-gold flex-shrink-0 mt-0.5" />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Actions */}
          <div className="px-6 pb-6 flex gap-3">
            <button
              onClick={dismiss}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-klo-muted border border-klo-slate rounded-xl hover:bg-white/5 transition-colors duration-200"
            >
              Maybe Later
            </button>
            <Link
              href="/pricing"
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-semibold bg-klo-gold text-klo-dark rounded-xl hover:brightness-110 transition-all duration-200"
            >
              View Plans
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
