"use client";

import { useState, useEffect, useCallback } from "react";
import { CheckCircle2, EyeOff, Trash2, Archive, RotateCcw, Eye } from "lucide-react";
import { useConferenceRealtime } from "../hooks/useConferenceRealtime";
import type { Question } from "../types";

interface QuestionModeratorProps {
  eventId?: string;
}

export default function QuestionModerator({ eventId }: QuestionModeratorProps = {}) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [archivedQuestions, setArchivedQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [showArchived, setShowArchived] = useState(false);

  const fetchQuestions = useCallback(async () => {
    try {
      const params = new URLSearchParams({ admin: "true" });
      if (eventId) params.set("event_id", eventId);
      const res = await fetch(`/api/conference/questions?${params}`);
      if (res.ok) setQuestions(await res.json());
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  const fetchArchived = useCallback(async () => {
    try {
      const params = new URLSearchParams({ admin: "true", archived: "true" });
      if (eventId) params.set("event_id", eventId);
      const res = await fetch(`/api/conference/questions?${params}`);
      if (res.ok) setArchivedQuestions(await res.json());
    } catch {
      // ignore
    }
  }, [eventId]);

  useConferenceRealtime({
    onQuestionsChange: fetchQuestions,
    onUpvotesChange: fetchQuestions,
    onLikesChange: fetchQuestions,
  });

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  useEffect(() => {
    if (showArchived) fetchArchived();
  }, [showArchived, fetchArchived]);

  const updateQuestion = async (id: string, updates: Record<string, unknown>) => {
    await fetch(`/api/conference/questions/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    fetchQuestions();
    if (showArchived) fetchArchived();
  };

  const deleteQuestion = async (id: string) => {
    await fetch(`/api/conference/questions/${id}`, { method: "DELETE" });
    fetchQuestions();
    if (showArchived) fetchArchived();
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="w-6 h-6 border-2 border-[#2764FF]/30 border-t-[#2764FF] rounded-full animate-spin" />
      </div>
    );
  }

  const renderQuestion = (q: Question, isArchived: boolean) => (
    <div
      key={q.id}
      className={`glass rounded-2xl p-4 border ${
        isArchived
          ? "border-yellow-500/20 opacity-70"
          : q.is_answered
          ? "border-emerald-500/20"
          : "border-white/5"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-klo-text">{q.text}</p>
          <div className="flex items-center gap-3 mt-2 text-xs text-klo-muted">
            <span>{q.author_name}</span>
            <span>{q.upvotes} upvotes</span>
            <span>{q.likes ?? 0} likes</span>
            {q.is_answered && <span className="text-emerald-400">Answered</span>}
            {q.is_hidden && <span className="text-red-400">Hidden</span>}
            {!q.released && <span className="text-yellow-400">Unreleased</span>}
            {isArchived && <span className="text-yellow-400">Archived</span>}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {isArchived ? (
            <>
              <button
                onClick={() => updateQuestion(q.id, { archive: false })}
                className="p-2 rounded-lg text-klo-muted hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                title="Restore from archive"
              >
                <RotateCcw size={16} />
              </button>
              <button
                onClick={() => deleteQuestion(q.id)}
                className="p-2 rounded-lg text-klo-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
                title="Delete permanently"
              >
                <Trash2 size={16} />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => updateQuestion(q.id, { is_answered: !q.is_answered })}
                className={`p-2 rounded-lg transition-colors ${
                  q.is_answered
                    ? "text-emerald-400 hover:bg-emerald-500/10"
                    : "text-klo-muted hover:bg-white/5"
                }`}
                title={q.is_answered ? "Unmark answered" : "Mark answered"}
              >
                <CheckCircle2 size={16} />
              </button>
              <button
                onClick={() => updateQuestion(q.id, { is_hidden: !q.is_hidden })}
                className={`p-2 rounded-lg transition-colors ${
                  q.is_hidden
                    ? "text-yellow-400 hover:bg-yellow-500/10"
                    : "text-klo-muted hover:bg-white/5"
                }`}
                title={q.is_hidden ? "Show question" : "Hide question"}
              >
                <EyeOff size={16} />
              </button>
              <button
                onClick={() => updateQuestion(q.id, { released: !q.released })}
                className={`p-2 rounded-lg transition-colors ${
                  q.released
                    ? "text-[#2764FF] hover:bg-[#2764FF]/10"
                    : "text-klo-muted hover:bg-white/5"
                }`}
                title={q.released ? "Unrelease question" : "Release question"}
              >
                <Eye size={16} />
              </button>
              <button
                onClick={() => updateQuestion(q.id, { archive: true })}
                className="p-2 rounded-lg text-klo-muted hover:text-yellow-400 hover:bg-yellow-500/10 transition-colors"
                title="Archive question"
              >
                <Archive size={16} />
              </button>
              <button
                onClick={() => deleteQuestion(q.id)}
                className="p-2 rounded-lg text-klo-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
                title="Delete question"
              >
                <Trash2 size={16} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-3">
      {/* Active questions */}
      {questions.map((q) => renderQuestion(q, false))}

      {questions.length === 0 && (
        <p className="text-sm text-klo-muted text-center py-4">No questions submitted yet</p>
      )}

      {/* Archived section */}
      <button
        onClick={() => setShowArchived(!showArchived)}
        className="inline-flex items-center gap-2 text-sm text-klo-muted hover:text-klo-text transition-colors mt-4"
      >
        <Archive size={16} />
        {showArchived ? "Hide" : "Show"} Archived ({archivedQuestions.length})
      </button>

      {showArchived && archivedQuestions.length > 0 && (
        <div className="space-y-3 pl-2 border-l-2 border-yellow-500/20">
          {archivedQuestions.map((q) => renderQuestion(q, true))}
        </div>
      )}
    </div>
  );
}
