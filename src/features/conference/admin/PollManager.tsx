"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, Eye, EyeOff, Power, PowerOff } from "lucide-react";
import type { Poll } from "../types";

export default function PollManager() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [creating, setCreating] = useState(false);

  const fetchPolls = useCallback(async () => {
    try {
      const res = await fetch("/api/conference/polls");
      if (res.ok) setPolls(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPolls();
  }, [fetchPolls]);

  const addOption = () => setOptions((prev) => [...prev, ""]);

  const updateOption = (index: number, value: string) => {
    setOptions((prev) => prev.map((o, i) => (i === index ? value : o)));
  };

  const removeOption = (index: number) => {
    if (options.length <= 2) return;
    setOptions((prev) => prev.filter((_, i) => i !== index));
  };

  const createPoll = async () => {
    const validOptions = options.filter((o) => o.trim());
    if (!question.trim() || validOptions.length < 2) return;

    setCreating(true);
    try {
      const res = await fetch("/api/conference/polls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: question.trim(), options: validOptions }),
      });
      if (res.ok) {
        setQuestion("");
        setOptions(["", ""]);
        fetchPolls();
      }
    } finally {
      setCreating(false);
    }
  };

  const togglePoll = async (id: string, field: "is_active" | "show_results", value: boolean) => {
    await fetch(`/api/conference/polls/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    });
    fetchPolls();
  };

  const deletePoll = async (id: string) => {
    await fetch(`/api/conference/polls/${id}`, { method: "DELETE" });
    fetchPolls();
  };

  return (
    <div className="space-y-6">
      {/* Create new poll */}
      <div className="glass rounded-2xl p-6 border border-white/5">
        <h3 className="text-sm font-semibold text-klo-text mb-4">Create Poll</h3>
        <div className="space-y-3">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Poll question..."
            className="w-full bg-klo-dark border border-white/10 rounded-lg px-4 py-2.5 text-sm text-klo-text placeholder:text-klo-muted focus:outline-none focus:border-[#2764FF]/50"
          />
          {options.map((opt, i) => (
            <div key={i} className="flex gap-2">
              <input
                type="text"
                value={opt}
                onChange={(e) => updateOption(i, e.target.value)}
                placeholder={`Option ${i + 1}`}
                className="flex-1 bg-klo-dark border border-white/10 rounded-lg px-4 py-2.5 text-sm text-klo-text placeholder:text-klo-muted focus:outline-none focus:border-[#2764FF]/50"
              />
              {options.length > 2 && (
                <button
                  onClick={() => removeOption(i)}
                  className="p-2.5 text-klo-muted hover:text-red-400 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))}
          <div className="flex gap-3">
            <button
              onClick={addOption}
              className="inline-flex items-center gap-1.5 text-xs text-klo-muted hover:text-klo-text transition-colors"
            >
              <Plus size={14} /> Add option
            </button>
          </div>
          <button
            onClick={createPoll}
            disabled={creating || !question.trim() || options.filter((o) => o.trim()).length < 2}
            className="w-full px-4 py-2.5 bg-gradient-to-r from-[#2764FF] to-[#21B8CD] text-white font-semibold text-sm rounded-lg hover:brightness-110 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {creating ? "Creating..." : "Create Poll"}
          </button>
        </div>
      </div>

      {/* Existing polls */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-[#2764FF]/30 border-t-[#2764FF] rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-3">
          {polls.map((poll) => (
            <div key={poll.id} className="glass rounded-2xl p-4 border border-white/5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-klo-text truncate">{poll.question}</p>
                  <p className="text-xs text-klo-muted mt-1">
                    {(poll.options as string[]).length} options
                    {poll.is_active ? " — Active" : " — Closed"}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => togglePoll(poll.id, "is_active", !poll.is_active)}
                    className={`p-2 rounded-lg transition-colors ${
                      poll.is_active
                        ? "text-emerald-400 hover:bg-emerald-500/10"
                        : "text-klo-muted hover:bg-white/5"
                    }`}
                    title={poll.is_active ? "Close poll" : "Reopen poll"}
                  >
                    {poll.is_active ? <Power size={16} /> : <PowerOff size={16} />}
                  </button>
                  <button
                    onClick={() => togglePoll(poll.id, "show_results", !poll.show_results)}
                    className={`p-2 rounded-lg transition-colors ${
                      poll.show_results
                        ? "text-[#2764FF] hover:bg-[#2764FF]/10"
                        : "text-klo-muted hover:bg-white/5"
                    }`}
                    title={poll.show_results ? "Hide results" : "Show results"}
                  >
                    {poll.show_results ? <Eye size={16} /> : <EyeOff size={16} />}
                  </button>
                  <button
                    onClick={() => deletePoll(poll.id)}
                    className="p-2 rounded-lg text-klo-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    title="Delete poll"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {polls.length === 0 && (
            <p className="text-sm text-klo-muted text-center py-4">No polls created yet</p>
          )}
        </div>
      )}
    </div>
  );
}
