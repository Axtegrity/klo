"use client";

import { useState, useEffect, useCallback } from "react";
import { useConferenceRealtime } from "./useConferenceRealtime";
import type { Question } from "../types";

export function useQuestions() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [upvotedQuestions, setUpvotedQuestions] = useState<Set<string>>(new Set());

  const fetchQuestions = useCallback(async () => {
    try {
      const res = await fetch("/api/conference/questions");
      if (!res.ok) return;
      const data: Question[] = await res.json();
      setQuestions(data);
    } catch {
      // Keep current state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  useConferenceRealtime({
    onQuestionsChange: fetchQuestions,
    onUpvotesChange: fetchQuestions,
  });

  const submitQuestion = useCallback(
    async (text: string, authorName?: string) => {
      try {
        const res = await fetch("/api/conference/questions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, author_name: authorName }),
        });

        if (res.ok) {
          fetchQuestions();
        }
        return res.ok;
      } catch {
        return false;
      }
    },
    [fetchQuestions]
  );

  const upvote = useCallback(
    async (questionId: string) => {
      if (upvotedQuestions.has(questionId)) return false;

      try {
        const res = await fetch(`/api/conference/questions/${questionId}/upvote`, {
          method: "POST",
        });

        if (res.ok || res.status === 409) {
          setUpvotedQuestions((prev) => new Set([...prev, questionId]));
          fetchQuestions();
        }

        return res.ok;
      } catch {
        return false;
      }
    },
    [upvotedQuestions, fetchQuestions]
  );

  return { questions, loading, submitQuestion, upvote, upvotedQuestions, refetch: fetchQuestions };
}
