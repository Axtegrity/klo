"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Crown,
  CreditCard,
  Download,
  ExternalLink,
  HelpCircle,
  Mail,
  Receipt,
  Shield,
  Sparkles,
  Check,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { useSubscription, type SubscriptionTier } from "@/hooks/useSubscription";
import Card from "@/components/shared/Card";
import Badge from "@/components/shared/Badge";
import Button from "@/components/shared/Button";

/* ------------------------------------------------------------------ */
/*  Animation variants                                                 */
/* ------------------------------------------------------------------ */

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      ease: "easeOut" as const,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" as const },
  },
};

/* ------------------------------------------------------------------ */
/*  Tier metadata                                                      */
/* ------------------------------------------------------------------ */

const tierConfig: Record<
  SubscriptionTier,
  { label: string; price: string; badge: "muted" | "cyan" | "gold" }
> = {
  free: { label: "Explorer", price: "$0/mo", badge: "muted" },
  pro: { label: "Pro", price: "$29/mo", badge: "cyan" },
  executive: { label: "Executive", price: "$99/mo", badge: "gold" },
};

/* ------------------------------------------------------------------ */
/*  Mock billing data                                                  */
/* ------------------------------------------------------------------ */

const mockInvoices = [
  { id: "INV-2026-003", date: "Feb 1, 2026", amount: "$29.00", status: "Paid" },
  { id: "INV-2026-002", date: "Jan 1, 2026", amount: "$29.00", status: "Paid" },
  { id: "INV-2025-001", date: "Dec 1, 2025", amount: "$29.00", status: "Paid" },
];

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function ManageSubscriptionPage() {
  const { tier, features, downgradeToFree } = useSubscription();
  const config = tierConfig[tier];
  const isPaid = tier !== "free";

  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  async function handlePortal() {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId: "demo" }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      // Fallback for demo
    } finally {
      setPortalLoading(false);
    }
  }

  function handleCancel() {
    downgradeToFree();
    setShowCancelConfirm(false);
  }

  return (
    <div className="min-h-screen bg-klo-dark">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-8"
        >
          {/* Header */}
          <motion.div variants={itemVariants}>
            <h1 className="text-3xl sm:text-4xl font-display font-bold text-klo-text mb-2">
              Manage Your Subscription
            </h1>
            <p className="text-klo-muted text-base">
              View your plan details, billing history, and account settings.
            </p>
          </motion.div>

          {/* Current Plan Card */}
          <motion.div variants={itemVariants}>
            <Card className="relative overflow-hidden">
              <div
                className="absolute inset-0 opacity-5"
                style={{
                  background:
                    "radial-gradient(ellipse at top right, rgba(39,100,255,0.4), transparent 60%)",
                }}
              />
              <div className="relative">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <p className="text-xs font-semibold text-klo-muted uppercase tracking-wider mb-2">
                      Current Plan
                    </p>
                    <div className="flex items-center gap-3">
                      <h2 className="text-2xl font-display font-bold text-klo-text">
                        {config.label}
                      </h2>
                      <Badge variant={config.badge}>{config.label}</Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-[#2764FF]">
                      {config.price}
                    </p>
                    {isPaid && (
                      <p className="text-xs text-klo-muted mt-1">
                        Next billing: Mar 1, 2026
                      </p>
                    )}
                  </div>
                </div>

                {/* Features list */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6">
                  {features.map((feat) => (
                    <div
                      key={feat}
                      className="flex items-start gap-2 text-sm text-klo-text"
                    >
                      <Check className="w-4 h-4 text-[#2764FF] flex-shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-3">
                  {!isPaid ? (
                    <Button href="/pricing" variant="primary" size="md">
                      <Sparkles className="w-4 h-4" />
                      Upgrade Your Plan
                    </Button>
                  ) : (
                    <>
                      <Button href="/pricing" variant="secondary" size="md">
                        <ArrowRight className="w-4 h-4" />
                        Change Plan
                      </Button>
                      <Button
                        variant="ghost"
                        size="md"
                        onClick={() => setShowCancelConfirm(true)}
                      >
                        Cancel Subscription
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Cancel Confirmation */}
          {showCancelConfirm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{
                opacity: 1,
                height: "auto",
                transition: { duration: 0.3, ease: "easeOut" as const },
              }}
            >
              <Card className="border-red-500/30">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center flex-shrink-0">
                    <Shield className="w-5 h-5 text-red-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-klo-text mb-1">
                      Are you sure you want to cancel?
                    </h3>
                    <p className="text-sm text-klo-muted mb-4">
                      You will lose access to all {config.label} features at the
                      end of your current billing period. This action can be
                      reversed by resubscribing.
                    </p>
                    <div className="flex gap-3">
                      <button
                        onClick={handleCancel}
                        className="px-4 py-2 text-sm font-medium text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/10 transition-colors duration-200"
                      >
                        Yes, Cancel
                      </button>
                      <button
                        onClick={() => setShowCancelConfirm(false)}
                        className="px-4 py-2 text-sm font-medium text-klo-text bg-white/5 rounded-lg hover:bg-white/10 transition-colors duration-200"
                      >
                        Keep My Plan
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}

          {/* Billing Info (paid users only) */}
          {isPaid && (
            <motion.div variants={itemVariants}>
              <Card>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[#2764FF]/10 flex items-center justify-center">
                      <CreditCard className="w-4 h-4 text-[#2764FF]" />
                    </div>
                    <h3 className="text-lg font-display font-semibold text-klo-text">
                      Billing Information
                    </h3>
                  </div>
                  <button
                    onClick={handlePortal}
                    disabled={portalLoading}
                    className="inline-flex items-center gap-1.5 text-sm text-[#2764FF] hover:underline disabled:opacity-50"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    {portalLoading ? "Loading..." : "Manage in Stripe"}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-klo-dark/50 rounded-lg p-4 border border-klo-slate">
                    <p className="text-xs text-klo-muted font-medium uppercase tracking-wider mb-1">
                      Payment Method
                    </p>
                    <p className="text-sm text-klo-text font-medium">
                      Visa ending in 4242
                    </p>
                    <p className="text-xs text-klo-muted mt-0.5">
                      Expires 12/2027
                    </p>
                  </div>
                  <div className="bg-klo-dark/50 rounded-lg p-4 border border-klo-slate">
                    <p className="text-xs text-klo-muted font-medium uppercase tracking-wider mb-1">
                      Billing Email
                    </p>
                    <p className="text-sm text-klo-text font-medium">
                      user@example.com
                    </p>
                    <p className="text-xs text-klo-muted mt-0.5">
                      Invoices sent here
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}

          {/* Billing History (paid users only) */}
          {isPaid && (
            <motion.div variants={itemVariants}>
              <Card>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-9 h-9 rounded-lg bg-[#2764FF]/10 flex items-center justify-center">
                    <Receipt className="w-4 h-4 text-[#2764FF]" />
                  </div>
                  <h3 className="text-lg font-display font-semibold text-klo-text">
                    Billing History
                  </h3>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-klo-slate">
                        <th className="text-left py-3 px-4 text-xs font-semibold text-klo-muted uppercase tracking-wider">
                          Invoice
                        </th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-klo-muted uppercase tracking-wider">
                          Date
                        </th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-klo-muted uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-klo-muted uppercase tracking-wider">
                          Status
                        </th>
                        <th className="text-right py-3 px-4 text-xs font-semibold text-klo-muted uppercase tracking-wider">
                          Download
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {mockInvoices.map((invoice) => (
                        <tr
                          key={invoice.id}
                          className="border-b border-klo-slate/50 hover:bg-white/[0.02] transition-colors"
                        >
                          <td className="py-3 px-4 text-klo-text font-medium">
                            {invoice.id}
                          </td>
                          <td className="py-3 px-4 text-klo-muted">
                            {invoice.date}
                          </td>
                          <td className="py-3 px-4 text-klo-text">
                            {invoice.amount}
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant="green">{invoice.status}</Badge>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button className="inline-flex items-center gap-1 text-[#2764FF] hover:underline text-xs">
                              <Download className="w-3.5 h-3.5" />
                              PDF
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </motion.div>
          )}

          {/* Need Help Card */}
          <motion.div variants={itemVariants}>
            <Card>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-[#2764FF]/10 flex items-center justify-center flex-shrink-0">
                  <HelpCircle className="w-5 h-5 text-[#2764FF]" />
                </div>
                <div>
                  <h3 className="text-base font-display font-semibold text-klo-text mb-1">
                    Need Help?
                  </h3>
                  <p className="text-sm text-klo-muted mb-3">
                    Have questions about your subscription or billing? Our team
                    is here to help.
                  </p>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <a
                      href="mailto:info@keithlodom.io"
                      className="inline-flex items-center gap-1.5 text-[#2764FF] hover:underline"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      info@keithlodom.io
                    </a>
                    <Link
                      href="/consult"
                      className="inline-flex items-center gap-1.5 text-[#2764FF] hover:underline"
                    >
                      <Crown className="w-3.5 h-3.5" />
                      Book A Consultation
                    </Link>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
