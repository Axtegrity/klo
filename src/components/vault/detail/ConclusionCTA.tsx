"use client";

import { MessageSquare } from "lucide-react";
import FadeInOnScroll from "@/components/shared/FadeInOnScroll";
import Button from "@/components/shared/Button";

interface ConclusionCTAProps {
  conclusion: string;
}

export default function ConclusionCTA({ conclusion }: ConclusionCTAProps) {
  return (
    <div className="space-y-8">
      {/* Conclusion paragraph */}
      <FadeInOnScroll>
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-1 h-8 rounded-full bg-gradient-to-b from-[#2764FF] to-[#21B8CD]" />
            <h2 className="font-display text-xl font-bold text-klo-text">
              Conclusion
            </h2>
          </div>
          <p className="text-klo-muted text-base leading-relaxed">
            {conclusion}
          </p>
        </div>
      </FadeInOnScroll>

      {/* CTA card */}
      <FadeInOnScroll delay={0.1}>
        <div className="p-8 rounded-xl bg-[#011A5E]/30 border border-[#0E3783]/50">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-klo-gold/10 flex items-center justify-center shrink-0">
              <MessageSquare size={22} className="text-klo-gold" />
            </div>
            <div className="flex-1">
              <h3 className="font-display text-lg font-semibold text-klo-text mb-1">
                Need personalized guidance?
              </h3>
              <p className="text-sm text-klo-muted">
                Book a one-on-one consultation with Keith L. Odom to discuss how
                these frameworks apply to your organization.
              </p>
            </div>
            <Button
              variant="primary"
              href="/consult"
              size="md"
              className="shrink-0"
            >
              Book a Consultation
            </Button>
          </div>
        </div>
      </FadeInOnScroll>
    </div>
  );
}
