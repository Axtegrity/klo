"use client";

import { useState, useEffect, useCallback } from "react";
import {
  CheckCircle2,
  EyeOff,
  Trash2,
  Archive,
  RotateCcw,
  Eye,
  Send,
  Layers,
  Radio,
} from "lucide-react";
import { useConferenceRealtime } from "../hooks/useConferenceRealtime";
import { useSessions } from "../hooks/useSessions";
import type { Question, ConferenceSession } from "../types";

interface QuestionModeratorProps {
  eventId?: string;
}

type ReleaseMode = ConferenceSession["release_mode"];

function ModeBanner({
  mode,
  waiting,
  released,
}: {
  mode: ReleaseMode;
  waiting: number;
  released: number;
}) {
  if (mode === "all") {
    return (
      <div className="flex items-center justify-between rounded-xl px-4 py-3 bg-emerald-500/10 border border-emerald-500/20">
        <div className="flex items-center gap-2">
          <Radio size={14} className="text-emerald-400" />
          <span className="text-sm font-semibold text-emerald-400">Show All</span>
          <span className="text-xs text-emerald-400/70">
            — questions appear instantly for attendees
          </span>
        </div>
        <span className="text-xs text-emerald-400/70">{waiting + released} total</span>
      </div>
    );
  }

  if (mode === "hide_all") {
    return (
      <div className="flex items-center justify-between rounded-xl px-4 py-3 bg-red-500/10 border border-red-500/20">
        <div className="flex items-center gap-2">
          <EyeOff size={14} className="text-red-400" />
          <span className="text-sm font-semibold text-red-400">Hide All</span>
          <span className="text-xs text-red-400/70">
            — all questions are hidden from attendees
          </span>
        </div>
        <span className="text-xs text-red-400/70">{waiting + released} collected</span>
      </div>
    );
  }

  // single
  return (
    <div className="flex items-center justify-between rounded-xl px-4 py-3 bg-[#2764FF]/10 border border-[#2764FF]/20">
      <div className="flex items-center gap-2">
        <Send size={14} className="text-[#2764FF]" />
        <span className="text-sm font-semibold text-[#2764FF]">Single Release</span>
        <span className="text-xs text-[#2764FF]/70">
          — tap Release to send a question to attendees
        </span>
      </div>
      <div className="flex items-center gap-3 text-xs">
        {waiting > 0 && (
          <span className="text-yellow-400 font-semibold">{waiting} waiting</span>
        )}
        {released > 0 && (
          <span className="text-emerald-400">{released} released</span>
        )}
      </div>
    </div>
  );
}

export default function QuestionModerator({ eventId }: QuestionModeratorProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [archivedQuestions, setArchivedQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [showArchived, setShowArchived] = useState(false);
  const [releasingAll, setReleasingAll] = useState(false);

  const { activeSession } = useSessions(eventId ? { eventId } : undefined);
  const releaseMode: ReleaseMode = activeSession?.release_mode ?? "single";

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

  const releaseAll = async () => {
    const unreleased = questions.filter((q) => !q.released && !q.is_hidden);
    if (unreleased.length === 0) return;
    setReleasingAll(true);
    try {
      await Promise.all(
        unreleased.map((q) =>
          fetch(`/api/conference/questions/${q.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ released: true }),
          })
        )
      );
      fetchQuestions();
    } finally {
      setReleasingAll(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="w-6 h-6 border-2 border-[#2764FF]/30 border-t-[#2764FF] rounded-full animate-spin" />
      </div>
    );
  }

  const waiting = questions.filter((q) => !q.released && !q.is_hidden).length;
  const released = questions.filter((q) => q.released).length;

  const renderQuestion = (q: Question, isArchived: boolean) => {
    const isWaiting = !q.released && !q.is_hidden && !isArchived;

    return (
      <div
        key={q.id}
        className={`glass rounded-2xl p-4 border transition-all ${
          isArchived
            ? "border-yellow-500/20 opacity-70"
            : isWaiting && releaseMode === "single"
            ? "border-[#2764FF]/20 bg-[#2764FF]/[0.03]"
            : q.is_answered
            ? "border-emerald-500/20"
            : "border-white/5"
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm text-klo-text">{q.text}</p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-klo-muted">
              <span>{q.author_name}</span>
              <span>{q.upvotes} upvotes</span>
              {q.is_answered && (
                <span className="text-emerald-400">Answered</span>
              )}
              {q.is_hidden && <span className="text-red-400">Hidden</span>}
              {q.released && !isArchived && (
                <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                  <Eye size={10} />
                  Visible to attendees
                </span>
              )}
              {isArchived && <span className="text-yellow-400">Archived</span>}
            </div>
          </div>

          {isArchived ? (
            <div className="flex items-center gap-1">
              <button
                onClick={() => updateQuestion(q.id, { archive: false })}
                className="p-2 rounded-lg text-klo-muted hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                title="Restore"
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
            </div>
          ) : (
            <div className="flex items-center gap-1 flex-wrap justify-end">
              {/* Mark answered */}
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

              {/* Hide from attendees */}
              <button
                onClick={() => updateQuestion(q.id, { is_hidden: !q.is_hidden })}
                className={`p-2 rounded-lg transition-colors ${
                  q.is_hidden
                    ? "text-red-400 hover:bg-red-500/10"
                    : "text-klo-muted hover:bg-white/5"
                }`}
                title={q.is_hidden ? "Unhide" : "Hide from attendees"}
              >
                <EyeOff size={16} />
              </button>

              {/* Release button — single mode only, not shown for hidden questions */}
              {releaseMode === "single" && !q.is_hidden && (
                q.released ? (
                  <button
                    onClick={() => updateQuestion(q.id, { released: false })}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 transition-colors"
                    title="Pull back — hide from attendees"
                  >
                    <Eye size={12} />
                    Released
                  </button>
                ) : (
                  <button
                    onClick={() => updateQuestion(q.id, { released: true })}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#2764FF] text-white hover:brightness-110 transition-colors shadow-sm"
                    title="Send to attendees"
                  >
                    <Send size={12} />
                    Release
                  </button>
                )
              )}

              {/* Archive */}
              <button
                onClick={() => updateQuestion(q.id, { archive: true })}
                className="p-2 rounded-lg text-klo-muted hover:text-yellow-400 hover:bg-yellow-500/10 transition-colors"
                title="Archive"
              >
                <Archive size={16} />
              </button>

              {/* Delete */}
              <button
                onClick={() => deleteQuestion(q.id)}
                className="p-2 rounded-lg text-klo-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
                title="Delete"
              >
                <Trash2 size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Mode banner — always visible */}
      <ModeBanner mode={releaseMode} waiting={waiting} released={released} />

      {/* Release All shortcut — single mode only, when there are waiting questions */}
      {releaseMode === "single" && waiting > 0 && (
        <button
          onClick={releaseAll}
          disabled={releasingAll}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#2764FF]/10 border border-[#2764FF]/20 text-[#2764FF] text-sm font-medium hover:bg-[#2764FF]/20 transition-colors disabled:opacity-50"
        >
          <Layers size={14} />
          {releasingAll ? "Releasing…" : `Release all ${waiting} waiting`}
        </button>
      )}

      {/* Question list */}
      {questions.length === 0 ? (
        <p className="text-sm text-klo-muted text-center py-6">
          No questions submitted yet
        </p>
      ) : (
        <div className="space-y-3">
          {questions.map((q) => renderQuestion(q, false))}
        </div>
      )}

      {/* Archived section */}
      <button
        onClick={() => setShowArchived(!showArchived)}
        className="inline-flex items-center gap-2 text-sm text-klo-muted hover:text-klo-text transition-colors mt-2"
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
