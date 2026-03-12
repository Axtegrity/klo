"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart3, MessageSquare, Cloud, MessageSquareOff, Megaphone, X } from "lucide-react";
import { CONFERENCE_TOOL_TABS, type ConferenceToolTab } from "../constants";
import LivePolling from "./LivePolling";
import QuestionList from "./QuestionList";
import QuestionInput from "./QuestionInput";
import WordCloudCanvas from "./WordCloudCanvas";
import WordCloudInput from "./WordCloudInput";
import PresentationModeButton from "./PresentationModeButton";
import InstructionsSection from "./InstructionsSection";
import { usePolls } from "../hooks/usePolls";
import { useQuestions } from "../hooks/useQuestions";
import { useWordCloud } from "../hooks/useWordCloud";
import { useSessions } from "../hooks/useSessions";
import { useConferenceRoles } from "../hooks/useConferenceRoles";
import Card from "@/components/shared/Card";
import { useConferenceRealtime } from "../hooks/useConferenceRealtime";

interface Announcement {
  id: string;
  title: string;
  message: string;
  created_at: string;
}

const TAB_ICONS: Record<ConferenceToolTab, React.ElementType> = {
  polls: BarChart3,
  qa: MessageSquare,
  wordcloud: Cloud,
};

interface ConferenceToolsTabsProps {
  eventId?: string;
  sessionId?: string;
}

export default function ConferenceToolsTabs({ eventId, sessionId }: ConferenceToolsTabsProps = {}) {
  const [activeTab, setActiveTab] = useState<ConferenceToolTab>("polls");
  const { sessions, activeSession } = useSessions(eventId ? { eventId } : undefined);
  const { isAuthenticated } = useConferenceRoles();
  // Use explicit sessionId prop (guest-selected) if provided, otherwise fall back to admin-activated session
  const effectiveSessionId = sessionId ?? activeSession?.id ?? undefined;
  const pollsHook = usePolls({ sessionId: effectiveSessionId, eventId });
  const questionsHook = useQuestions({
    sessionId: effectiveSessionId,
    eventId,
  });
  const wordCloudHook = useWordCloud({ eventId });

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  const fetchAnnouncements = useCallback(async () => {
    try {
      const url = eventId
        ? `/api/conference/announcements?event_id=${eventId}`
        : "/api/conference/announcements";
      const res = await fetch(url);
      if (res.ok) setAnnouncements(await res.json());
    } catch {
      // keep current
    }
  }, [eventId]);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  useConferenceRealtime({ onAnnouncementsChange: fetchAnnouncements });

  const visibleAnnouncements = announcements.filter((a) => !dismissedIds.has(a.id));

  const selectedSession = sessionId ? sessions.find((s) => s.id === sessionId) : activeSession;
  const qaDisabled = selectedSession && !selectedSession.qa_enabled;

  return (
    <div className="space-y-6">
      {/* Announcements banner */}
      <AnimatePresence>
        {visibleAnnouncements.map((a) => (
          <motion.div
            key={a.id}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="rounded-xl bg-gradient-to-r from-[#2764FF]/10 to-[#21B8CD]/10 border border-[#2764FF]/20 p-4 flex items-start gap-3"
          >
            <Megaphone size={18} className="text-[#2764FF] mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-klo-text">{a.title}</p>
              <p className="text-xs text-klo-muted mt-1">{a.message}</p>
            </div>
            <button
              onClick={() => setDismissedIds((prev) => new Set([...prev, a.id]))}
              className="p-1 rounded-lg text-klo-muted hover:text-klo-text transition-colors shrink-0"
            >
              <X size={16} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Tab bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex gap-1 p-1 rounded-xl bg-klo-dark/50 border border-white/5 w-full sm:w-fit overflow-x-auto scrollbar-hide" style={{ scrollbarWidth: "none" }}>
          {CONFERENCE_TOOL_TABS.map((tab) => {
            const Icon = TAB_ICONS[tab.id];
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all shrink-0 ${
                  activeTab === tab.id
                    ? "bg-klo-slate text-klo-text shadow-md"
                    : "text-klo-muted hover:text-klo-text"
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>
        <PresentationModeButton />
      </div>

      {/* Tab content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {activeTab === "polls" && (
          <LivePolling
            polls={pollsHook.visiblePolls}
            loading={pollsHook.loading}
            onVote={pollsHook.vote}
          />
        )}

        {activeTab === "qa" && (
          <>
            {qaDisabled ? (
              <Card className="text-center py-12">
                <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center mx-auto mb-3">
                  <MessageSquareOff size={24} className="text-yellow-400" />
                </div>
                <p className="text-klo-muted text-sm">
                  Q&A is currently disabled for this session.
                </p>
              </Card>
            ) : (
              <div className="space-y-4">
                <QuestionInput
                  onSubmit={questionsHook.submitQuestion}
                  profanityError={questionsHook.profanityError}
                  onClearProfanityError={questionsHook.clearProfanityError}
                />
                <QuestionList
                  questions={questionsHook.questions}
                  loading={questionsHook.loading}
                  onUpvote={questionsHook.upvote}
                  upvotedQuestions={questionsHook.upvotedQuestions}
                  onLike={questionsHook.likeQuestion}
                  likedQuestions={questionsHook.likedQuestions}
                  isAuthenticated={isAuthenticated}
                />
              </div>
            )}
          </>
        )}

        {activeTab === "wordcloud" && (
          <div className="space-y-4">
            <WordCloudInput onSubmit={wordCloudHook.submitWord} />
            <WordCloudCanvas entries={wordCloudHook.entries} loading={wordCloudHook.loading} />
          </div>
        )}
      </motion.div>

      <InstructionsSection />
    </div>
  );
}
