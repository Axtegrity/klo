"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ChevronUp, MessageSquare, CheckCircle2 } from "lucide-react";
import Card from "@/components/shared/Card";
import type { Question } from "../types";

interface QuestionListProps {
  questions: Question[];
  loading: boolean;
  onUpvote: (questionId: string) => Promise<boolean>;
  upvotedQuestions: Set<string>;
}

export default function QuestionList({
  questions,
  loading,
  onUpvote,
  upvotedQuestions,
}: QuestionListProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-[#2764FF]/30 border-t-[#2764FF] rounded-full animate-spin" />
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <Card className="text-center py-12">
        <div className="w-12 h-12 rounded-xl bg-[#2764FF]/10 flex items-center justify-center mx-auto mb-3">
          <MessageSquare size={24} className="text-[#2764FF]" />
        </div>
        <p className="text-klo-muted text-sm">
          No questions yet. Be the first to ask!
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-3" aria-live="polite">
      <AnimatePresence mode="popLayout">
        {questions.map((q) => {
          const hasUpvoted = upvotedQuestions.has(q.id);
          return (
            <motion.div
              key={q.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <Card className="flex items-start gap-4">
                <button
                  onClick={() => onUpvote(q.id)}
                  disabled={hasUpvoted}
                  className={`shrink-0 flex flex-col items-center gap-1 px-2 py-1 rounded-lg transition-colors ${
                    hasUpvoted
                      ? "bg-[#2764FF]/10 cursor-default"
                      : "hover:bg-[#2764FF]/10 group"
                  }`}
                >
                  <ChevronUp
                    size={16}
                    className={`${
                      hasUpvoted
                        ? "text-[#2764FF]"
                        : "text-klo-muted group-hover:text-[#2764FF]"
                    } transition-colors`}
                  />
                  <span className="text-xs font-semibold text-klo-gold">
                    {q.upvotes}
                  </span>
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-klo-text leading-relaxed">{q.text}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-klo-muted">{q.author_name}</span>
                    {q.is_answered && (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
                        <CheckCircle2 size={12} />
                        Answered
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
