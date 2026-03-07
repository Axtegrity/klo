"use client";

import { motion } from "framer-motion";
import { Loader2, Radio } from "lucide-react";
import type { ConferenceSession } from "../types";

interface SessionSelectCardProps {
  sessions: ConferenceSession[];
  loading: boolean;
  onSelect: (session: ConferenceSession) => void;
  eventTitle?: string;
}

export default function SessionSelectCard({
  sessions,
  loading,
  onSelect,
  eventTitle,
}: SessionSelectCardProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={24} className="animate-spin text-[#2764FF]" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-md mx-auto"
    >
      <div className="glass rounded-2xl p-6 sm:p-8 border border-white/10">
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-[#2764FF]/10 flex items-center justify-center mx-auto mb-4">
            <Radio size={28} className="text-[#2764FF]" />
          </div>
          <h2 className="font-display text-xl font-bold text-klo-text mb-2">
            Select a Session
          </h2>
          {eventTitle && (
            <p className="text-sm text-klo-gold font-medium mb-1">{eventTitle}</p>
          )}
          <p className="text-sm text-klo-muted">
            Choose which session you&apos;d like to join.
          </p>
        </div>

        <div className="space-y-3">
          {sessions.map((session) => (
            <button
              key={session.id}
              onClick={() => onSelect(session)}
              className="w-full text-left p-4 rounded-xl bg-klo-dark border border-white/10 hover:border-[#2764FF]/40 hover:bg-[#2764FF]/5 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-[#2764FF]/50 group-hover:bg-[#2764FF] transition-colors shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-klo-text truncate">
                    {session.title}
                  </p>
                  {session.description && (
                    <p className="text-xs text-klo-muted mt-0.5 truncate">
                      {session.description}
                    </p>
                  )}
                  {(session.speaker || session.time_label || session.room) && (
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-[11px] text-klo-muted/70">
                      {session.time_label && <span>{session.time_label}</span>}
                      {session.speaker && <span>{session.speaker}</span>}
                      {session.room && <span>{session.room}</span>}
                    </div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
