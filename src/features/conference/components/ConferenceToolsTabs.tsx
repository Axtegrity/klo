"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { BarChart3, MessageSquare, Cloud, MessageSquareOff } from "lucide-react";
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

const TAB_ICONS: Record<ConferenceToolTab, React.ElementType> = {
  polls: BarChart3,
  qa: MessageSquare,
  wordcloud: Cloud,
};

export default function ConferenceToolsTabs() {
  const [activeTab, setActiveTab] = useState<ConferenceToolTab>("polls");
  const { activeSession } = useSessions();
  const { isAuthenticated } = useConferenceRoles();
  const pollsHook = usePolls();
  const questionsHook = useQuestions({
    sessionId: activeSession?.id ?? undefined,
  });
  const wordCloudHook = useWordCloud();

  const qaDisabled = activeSession && !activeSession.qa_enabled;

  return (
    <div className="space-y-6">
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
            polls={pollsHook.activePolls}
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
