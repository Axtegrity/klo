"use client";

import { useState, useEffect, useCallback } from "react";
import { CheckCircle2, EyeOff, Trash2 } from "lucide-react";
import type { Question } from "../types";

export default function QuestionModerator() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchQuestions = useCallback(async () => {
    try {
      // Admin fetch gets all questions (uses service role which bypasses RLS)
      const res = await fetch("/api/conference/questions");
      if (res.ok) setQuestions(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const updateQuestion = async (id: string, updates: Partial<Question>) => {
    await fetch(`/api/conference/questions/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    fetchQuestions();
  };

  const deleteQuestion = async (id: string) => {
    await fetch(`/api/conference/questions/${id}`, { method: "DELETE" });
    fetchQuestions();
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="w-6 h-6 border-2 border-[#2764FF]/30 border-t-[#2764FF] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {questions.map((q) => (
        <div
          key={q.id}
          className={`glass rounded-2xl p-4 border ${
            q.is_answered ? "border-emerald-500/20" : "border-white/5"
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm text-klo-text">{q.text}</p>
              <div className="flex items-center gap-3 mt-2 text-xs text-klo-muted">
                <span>{q.author_name}</span>
                <span>{q.upvotes} upvotes</span>
                {q.is_answered && (
                  <span className="text-emerald-400">Answered</span>
                )}
                {q.is_hidden && <span className="text-red-400">Hidden</span>}
              </div>
            </div>
            <div className="flex items-center gap-1">
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
                onClick={() => deleteQuestion(q.id)}
                className="p-2 rounded-lg text-klo-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
                title="Delete question"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        </div>
      ))}
      {questions.length === 0 && (
        <p className="text-sm text-klo-muted text-center py-4">No questions submitted yet</p>
      )}
    </div>
  );
}
