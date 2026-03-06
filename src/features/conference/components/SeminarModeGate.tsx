"use client";

import { Clock } from "lucide-react";
import { useSeminarMode } from "../hooks/useSeminarMode";

interface SeminarModeGateProps {
  children: React.ReactNode;
}

export default function SeminarModeGate({ children }: SeminarModeGateProps) {
  const { seminarMode, loading } = useSeminarMode();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-6 h-6 border-2 border-[#2764FF]/30 border-t-[#2764FF] rounded-full animate-spin" />
      </div>
    );
  }

  if (!seminarMode.active) {
    return (
      <div className="relative">
        <div className="opacity-30 pointer-events-none select-none blur-[2px]">
          {children}
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="glass rounded-2xl p-6 sm:p-8 border border-white/10 text-center w-[calc(100%-2rem)] max-w-md mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-[#2764FF]/10 flex items-center justify-center mx-auto mb-4">
              <Clock size={28} className="text-[#2764FF]" />
            </div>
            <h3 className="font-display text-xl font-bold text-klo-text mb-2">
              Conference Tools Inactive
            </h3>
            <p className="text-sm text-klo-muted leading-relaxed">
              Interactive tools will be activated by the presenter when the session begins.
              Check back soon!
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
