"use client";

import { Clock } from "lucide-react";
import { useSeminarMode } from "../hooks/useSeminarMode";

interface SeminarModeGateProps {
  children: React.ReactNode;
  eventId?: string;
}

export default function SeminarModeGate({ children, eventId }: SeminarModeGateProps) {
  const { seminarMode, loading } = useSeminarMode(eventId);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-6 h-6 border-2 border-[#2764FF]/30 border-t-[#2764FF] rounded-full animate-spin" />
      </div>
    );
  }

  // When seminar mode is OFF: render absolutely nothing — no containers, no placeholders
  if (!seminarMode.active) {
    return null;
  }

  return <>{children}</>;
}
