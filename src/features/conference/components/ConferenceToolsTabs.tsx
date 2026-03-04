"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { BarChart3, MessageSquare, Cloud } from "lucide-react";
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

const TAB_ICONS: Record<ConferenceToolTab, React.ElementType> = {
  polls: BarChart3,
  qa: MessageSquare,
  wordcloud: Cloud,
};

export default function ConferenceToolsTabs() {
  const [activeTab, setActiveTab] = useState<ConferenceToolTab>("polls");
  const pollsHook = usePolls();
  const questionsHook = useQuestions();
  const wordCloudHook = useWordCloud();

  return (
    <div className="space-y-6">
      {/* Tab bar */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex gap-1 p-1 rounded-xl bg-klo-dark/50 border border-white/5 w-fit">
          {CONFERENCE_TOOL_TABS.map((tab) => {
            const Icon = TAB_ICONS[tab.id];
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
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
          <div className="space-y-4">
            <QuestionInput onSubmit={questionsHook.submitQuestion} />
            <QuestionList
              questions={questionsHook.questions}
              loading={questionsHook.loading}
              onUpvote={questionsHook.upvote}
              upvotedQuestions={questionsHook.upvotedQuestions}
            />
          </div>
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
