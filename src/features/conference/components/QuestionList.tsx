"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ChevronUp, Heart, MessageSquare, CheckCircle2, Trophy } from "lucide-react";
import Card from "@/components/shared/Card";
import type { Question } from "../types";

interface QuestionListProps {
  questions: Question[];
  loading: boolean;
  onUpvote: (questionId: string) => Promise<boolean>;
  upvotedQuestions: Set<string>;
  onLike?: (questionId: string) => Promise<boolean>;
  likedQuestions?: Set<string>;
  isAuthenticated?: boolean;
}

export default function QuestionList({
  questions,
  loading,
  onUpvote,
  upvotedQuestions,
  onLike,
  likedQuestions,
  isAuthenticated,
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

  // Determine Top-5 by likes for badge display
  const top5Ids = new Set(
    [...questions]
      .filter((q) => (q.likes ?? 0) > 0)
      .sort((a, b) => (b.likes ?? 0) - (a.likes ?? 0))
      .slice(0, 5)
      .map((q) => q.id)
  );

  return (
    <div className="space-y-3" aria-live="polite">
      <AnimatePresence mode="popLayout">
        {questions.map((q) => {
          const hasUpvoted = upvotedQuestions.has(q.id);
          const hasLiked = likedQuestions?.has(q.id) ?? false;
          const isTop5 = top5Ids.has(q.id);
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
                {/* Upvote button */}
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

                {/* Question content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-klo-text leading-relaxed">{q.text}</p>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
                    <span className="text-xs text-klo-muted">{q.author_name}</span>
                    {q.is_answered && (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
                        <CheckCircle2 size={12} />
                        Answered
                      </span>
                    )}
                    {isTop5 && (
                      <span className="inline-flex items-center gap-1 text-xs text-[#C8A84E]">
                        <Trophy size={12} />
                        Top 5
                      </span>
                    )}
                  </div>
                </div>

                {/* Like button (authenticated users) */}
                {isAuthenticated && onLike && (
                  <button
                    onClick={() => onLike(q.id)}
                    disabled={hasLiked}
                    className={`shrink-0 flex flex-col items-center gap-1 px-2 py-1 rounded-lg transition-colors ${
                      hasLiked
                        ? "bg-red-500/10 cursor-default"
                        : "hover:bg-red-500/10 group"
                    }`}
                  >
                    <Heart
                      size={16}
                      className={`${
                        hasLiked
                          ? "text-red-400 fill-red-400"
                          : "text-klo-muted group-hover:text-red-400"
                      } transition-colors`}
                    />
                    <span className="text-xs font-semibold text-klo-muted">
                      {q.likes ?? 0}
                    </span>
                  </button>
                )}
              </Card>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
