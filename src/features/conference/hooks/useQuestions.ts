"use client";

import { useState, useEffect, useCallback } from "react";
import { useConferenceRealtime } from "./useConferenceRealtime";
import type { Question } from "../types";

interface UseQuestionsOptions {
  sessionId?: string | null;
  eventId?: string;
}

export function useQuestions(options?: UseQuestionsOptions) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [upvotedQuestions, setUpvotedQuestions] = useState<Set<string>>(new Set());
  const [likedQuestions, setLikedQuestions] = useState<Set<string>>(new Set());
  const [profanityError, setProfanityError] = useState<string[] | null>(null);

  const sessionId = options?.sessionId;
  const eventId = options?.eventId;

  const fetchQuestions = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (sessionId) params.set("session_id", sessionId);
      if (eventId) params.set("event_id", eventId);
      const url = `/api/conference/questions${params.toString() ? `?${params}` : ""}`;
      const res = await fetch(url);
      if (!res.ok) return;
      const data: Question[] = await res.json();
      setQuestions(data);
    } catch {
      // Keep current state
    } finally {
      setLoading(false);
    }
  }, [sessionId, eventId]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  useConferenceRealtime({
    onQuestionsChange: fetchQuestions,
    onUpvotesChange: fetchQuestions,
    onLikesChange: fetchQuestions,
  });

  const submitQuestion = useCallback(
    async (text: string, authorName?: string): Promise<boolean> => {
      setProfanityError(null);
      try {
        const res = await fetch("/api/conference/questions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text,
            author_name: authorName,
            session_id: sessionId || undefined,
          }),
        });

        if (res.status === 422) {
          const data = await res.json();
          if (data.reason === "profanity" && data.flagged) {
            setProfanityError(data.flagged);
          }
          return false;
        }

        if (res.ok) {
          fetchQuestions();
        }
        return res.ok;
      } catch {
        return false;
      }
    },
    [fetchQuestions, sessionId]
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

  const likeQuestion = useCallback(
    async (questionId: string) => {
      if (likedQuestions.has(questionId)) return false;

      try {
        const res = await fetch(`/api/conference/questions/${questionId}/upvote`, {
          method: "POST",
        });

        if (res.ok || res.status === 409) {
          setLikedQuestions((prev) => new Set([...prev, questionId]));
          fetchQuestions();
        }

        return res.ok;
      } catch {
        return false;
      }
    },
    [likedQuestions, fetchQuestions]
  );

  const clearProfanityError = useCallback(() => {
    setProfanityError(null);
  }, []);

  return {
    questions,
    loading,
    submitQuestion,
    upvote,
    likeQuestion,
    upvotedQuestions,
    likedQuestions,
    profanityError,
    clearProfanityError,
    refetch: fetchQuestions,
  };
}
