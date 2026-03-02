"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  Minus,
  ChevronDown,
  ShieldCheck,
} from "lucide-react";
import PricingCard from "@/components/shared/PricingCard";
import { SUBSCRIPTION_TIERS } from "@/lib/constants";
import type { SubscriptionTier } from "@/types";

/* ------------------------------------------------------------------ */
/*  Price IDs — replace with real Stripe Price IDs in production       */
/* ------------------------------------------------------------------ */

const PRICE_IDS: Record<string, string> = {
  pro: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID ?? "price_pro_placeholder",
  executive: process.env.NEXT_PUBLIC_STRIPE_EXECUTIVE_PRICE_ID ?? "price_executive_placeholder",
};

/* ------------------------------------------------------------------ */
/*  Animation variants                                                 */
/* ------------------------------------------------------------------ */

const sectionVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" as const },
  },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.15,
      ease: "easeOut" as const,
    },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" as const },
  },
};

/* ------------------------------------------------------------------ */
/*  Comparison table data                                              */
/* ------------------------------------------------------------------ */

interface ComparisonRow {
  feature: string;
  free: string | boolean;
  pro: string | boolean;
  executive: string | boolean;
}

const comparisonData: ComparisonRow[] = [
  { feature: "Church Readiness Assessment", free: true, pro: true, executive: true },
  { feature: "AI Readiness Assessment", free: true, pro: true, executive: true },
  { feature: "Governance Assessment", free: false, pro: true, executive: true },
  { feature: "Cyber Risk Assessment", free: false, pro: true, executive: true },
  { feature: "Detailed Assessment Reports", free: false, pro: true, executive: true },
  { feature: "Community Feed Access", free: "Read-only", pro: true, executive: true },
  { feature: "Vault Content Library", free: "Previews only", pro: true, executive: true },
  { feature: "AI Advisor", free: false, pro: "50 msgs/mo", executive: "Unlimited" },
  { feature: "Strategy Rooms", free: false, pro: false, executive: true },
  { feature: "Priority Consulting", free: false, pro: false, executive: true },
  { feature: "Executive Vault Content", free: false, pro: false, executive: true },
  { feature: "Quarterly Strategy Call", free: false, pro: false, executive: true },
];

/* ------------------------------------------------------------------ */
/*  FAQ data                                                           */
/* ------------------------------------------------------------------ */

interface FAQItem {
  question: string;
  answer: string;
}

const faqItems: FAQItem[] = [
  {
    question: "Can I switch plans at any time?",
    answer:
      "Yes. You can upgrade or downgrade your plan at any time. When you upgrade, you will be charged the prorated difference immediately. When you downgrade, the change takes effect at the end of your current billing period.",
  },
  {
    question: "Is there a free trial for paid plans?",
    answer:
      "We do not offer a traditional free trial, but the Explorer plan gives you a solid taste of the platform at no cost. Plus, all paid plans come with a 30-day money-back guarantee — so you can try risk-free.",
  },
  {
    question: "What payment methods are accepted?",
    answer:
      "We accept all major credit and debit cards (Visa, Mastercard, American Express, Discover) through our secure Stripe payment processor. All transactions are encrypted and PCI-compliant.",
  },
  {
    question: "What happens if my payment fails?",
    answer:
      "If a payment fails, we will retry the charge a few times over the following days. You will receive email notifications with instructions to update your payment method. Your access remains active during the retry period.",
  },
  {
    question: "Can I cancel my subscription?",
    answer:
      "Absolutely. You can cancel anytime from your account settings. Your access continues until the end of the current billing period. There are no cancellation fees or hidden charges.",
  },
];

/* ------------------------------------------------------------------ */
/*  FAQ Accordion Item                                                 */
/* ------------------------------------------------------------------ */

function FAQAccordion({ item }: { item: FAQItem }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-klo-slate">
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex items-center justify-between w-full py-5 text-left gap-4 group cursor-pointer"
      >
        <span className="font-display text-base font-semibold text-klo-text group-hover:text-[#2764FF] transition-colors">
          {item.question}
        </span>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.25, ease: "easeOut" as const }}
        >
          <ChevronDown className="h-5 w-5 text-klo-muted shrink-0" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{
              height: "auto",
              opacity: 1,
              transition: { duration: 0.3, ease: "easeOut" as const },
            }}
            exit={{
              height: 0,
              opacity: 0,
              transition: { duration: 0.2, ease: "easeOut" as const },
            }}
            className="overflow-hidden"
          >
            <p className="text-klo-muted text-sm leading-relaxed pb-5">
              {item.answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Comparison Cell                                                    */
/* ------------------------------------------------------------------ */

function ComparisonCell({ value }: { value: string | boolean }) {
  if (value === true) {
    return <Check className="h-4 w-4 text-[#2764FF] mx-auto" />;
  }
  if (value === false) {
    return <Minus className="h-4 w-4 text-klo-muted/40 mx-auto" />;
  }
  return (
    <span className="text-xs text-klo-text font-medium">{value}</span>
  );
}

/* ------------------------------------------------------------------ */
/*  Page Component                                                     */
/* ------------------------------------------------------------------ */

export default function PricingPage() {
  const router = useRouter();
  const [loadingTier, setLoadingTier] = useState<string | null>(null);

  async function handleSelect(tier: SubscriptionTier) {
    if (tier.slug === "free") {
      router.push("/auth/signup");
      return;
    }

    setLoadingTier(tier.slug);

    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priceId: PRICE_IDS[tier.slug],
          tier: tier.slug,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create checkout session");
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Checkout error:", error);
      setLoadingTier(null);
    }
  }

  return (
    <div className="min-h-screen bg-klo-navy">
      {/* ---------------------------------------------------------- */}
      {/*  Hero Header                                                */}
      {/* ---------------------------------------------------------- */}
      <section className="relative overflow-hidden pt-24 pb-14 px-4">
        <div className="absolute inset-0 bg-gradient-to-b from-[#2764FF]/5 via-transparent to-transparent pointer-events-none" />
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="relative z-10 max-w-3xl mx-auto text-center"
        >
          <motion.h1
            variants={fadeUp}
            className="font-display text-5xl sm:text-6xl font-bold text-klo-text mb-4"
          >
            Choose Your{" "}
            <span className="bg-gradient-to-r from-[#2764FF] to-[#21B8CD] bg-clip-text text-transparent">Plan</span>
          </motion.h1>
          <motion.p
            variants={fadeUp}
            className="text-klo-muted text-lg max-w-xl mx-auto"
          >
            Unlock the full KLO experience. From foundational assessments to
            unlimited AI advisory and private strategy sessions, there is a plan
            for every stage of your journey.
          </motion.p>
        </motion.div>
      </section>

      {/* ---------------------------------------------------------- */}
      {/*  Pricing Cards                                              */}
      {/* ---------------------------------------------------------- */}
      <section className="px-4 pb-20">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
          {SUBSCRIPTION_TIERS.map((tier, i) => (
            <PricingCard
              key={tier.slug}
              tier={tier}
              index={i}
              onSelect={handleSelect}
              loading={loadingTier === tier.slug}
            />
          ))}
        </div>
      </section>

      {/* ---------------------------------------------------------- */}
      {/*  Comparison Table                                           */}
      {/* ---------------------------------------------------------- */}
      <motion.section
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        className="px-4 pb-20"
      >
        <div className="max-w-4xl mx-auto">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-klo-text text-center mb-10">
            Feature Comparison
          </h2>

          <div className="overflow-x-auto -mx-4 px-4">
            <table className="w-full min-w-[540px] text-sm">
              <thead>
                <tr className="border-b border-klo-slate">
                  <th className="text-left py-4 pr-4 text-klo-muted font-medium">
                    Feature
                  </th>
                  {SUBSCRIPTION_TIERS.map((t) => (
                    <th
                      key={t.slug}
                      className={`py-4 px-3 text-center font-display font-bold ${
                        t.highlighted ? "text-[#2764FF]" : "text-klo-text"
                      }`}
                    >
                      {t.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparisonData.map((row) => (
                  <tr
                    key={row.feature}
                    className="border-b border-klo-slate/50 hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="py-3.5 pr-4 text-klo-text">
                      {row.feature}
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <ComparisonCell value={row.free} />
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <ComparisonCell value={row.pro} />
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <ComparisonCell value={row.executive} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </motion.section>

      {/* ---------------------------------------------------------- */}
      {/*  FAQ                                                        */}
      {/* ---------------------------------------------------------- */}
      <motion.section
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        className="px-4 pb-20"
      >
        <div className="max-w-2xl mx-auto">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-klo-text text-center mb-10">
            Frequently Asked Questions
          </h2>
          <div>
            {faqItems.map((item) => (
              <FAQAccordion key={item.question} item={item} />
            ))}
          </div>
        </div>
      </motion.section>

      {/* ---------------------------------------------------------- */}
      {/*  Money-back Guarantee                                       */}
      {/* ---------------------------------------------------------- */}
      <motion.section
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="px-4 pb-24"
      >
        <div className="max-w-xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#2764FF]/15 border border-[#2764FF]/30 mb-4">
            <ShieldCheck className="h-7 w-7 text-[#2764FF]" />
          </div>
          <h3 className="font-display text-xl font-bold text-klo-text mb-2">
            30-Day Money-Back Guarantee
          </h3>
          <p className="text-klo-muted text-sm leading-relaxed">
            Not satisfied? No problem. If any paid plan does not meet your
            expectations within the first 30 days, we will issue a full
            refund — no questions asked. Your investment is completely
            risk-free.
          </p>
        </div>
      </motion.section>
    </div>
  );
}
