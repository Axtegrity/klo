"use client";

import { motion } from "framer-motion";
import { Zap } from "lucide-react";
import Button from "@/components/shared/Button";

interface UsageMeterProps {
  usageCount: number;
  usageLimit: number;
}

export default function UsageMeter({
  usageCount,
  usageLimit,
}: UsageMeterProps) {
  const atLimit = usageCount >= usageLimit;
  const pct = Math.min((usageCount / usageLimit) * 100, 100);

  return (
    <div className="px-4 py-3 border-t border-klo-slate">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs text-klo-muted">
          {usageCount} of {usageLimit} queries used this month
        </span>
        {atLimit && (
          <Zap size={12} className="text-[#2764FF] animate-pulse" />
        )}
      </div>

      {/* Progress bar */}
      <div className="h-1.5 w-full bg-klo-dark rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-[#2764FF]"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>

      {atLimit && (
        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="text-xs text-klo-muted leading-snug">
            Upgrade to <strong className="text-[#2764FF]">Pro</strong> for 50
            queries/month
          </p>
          <Button size="sm" href="/pricing" className="text-xs shrink-0">
            Upgrade
          </Button>
        </div>
      )}
    </div>
  );
}
