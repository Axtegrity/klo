"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Power,
  PowerOff,
  Upload,
  Rocket,
  FileText,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import PollResults from "../components/PollResults";
import type { PollWithVotes } from "../types";

type InputMode = "single" | "batch";

export default function PollManager() {
  const [polls, setPolls] = useState<PollWithVotes[]>([]);
  const [loading, setLoading] = useState(true);
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [batchText, setBatchText] = useState("");
  const [inputMode, setInputMode] = useState<InputMode>("single");
  const [creating, setCreating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [expandedResults, setExpandedResults] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

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

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setError(null);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const createSinglePoll = async () => {
    const validOptions = options.filter((o) => o.trim());
    if (!question.trim() || validOptions.length < 2) return;

    setCreating(true);
    setError(null);
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
        showSuccess("Poll created and added to queue!");
      } else {
        const data = await res.json().catch(() => null);
        setError(data?.error || `Failed to create poll (${res.status})`);
      }
    } catch (err) {
      setError("Network error — check your connection and try again.");
      console.error("Create poll error:", err);
    } finally {
      setCreating(false);
    }
  };

  const createBatchPolls = async () => {
    const lines = batchText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    const questions = lines
      .map((line) => {
        const parts = line.split("|").map((p) => p.trim()).filter(Boolean);
        if (parts.length < 3) return null;
        return { question: parts[0], options: parts.slice(1) };
      })
      .filter(Boolean) as { question: string; options: string[] }[];

    if (questions.length === 0) {
      setError("No valid questions found. Use the format: Question | Option1 | Option2");
      return;
    }

    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/conference/polls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questions }),
      });
      if (res.ok) {
        setBatchText("");
        fetchPolls();
        showSuccess(`${questions.length} poll${questions.length > 1 ? "s" : ""} created and added to queue!`);
      } else {
        const data = await res.json().catch(() => null);
        setError(data?.error || `Failed to create batch (${res.status})`);
      }
    } catch (err) {
      setError("Network error — check your connection and try again.");
      console.error("Batch create error:", err);
    } finally {
      setCreating(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/conference/polls/upload", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        fetchPolls();
        showSuccess(`${Array.isArray(data) ? data.length : 0} poll${Array.isArray(data) && data.length !== 1 ? "s" : ""} imported from file!`);
      } else {
        const data = await res.json().catch(() => null);
        setError(data?.error || `File upload failed (${res.status})`);
      }
    } catch (err) {
      setError("Network error — check your connection and try again.");
      console.error("File upload error:", err);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const deployPoll = async (id: string) => {
    await fetch(`/api/conference/polls/${id}/deploy`, { method: "POST" });
    fetchPolls();
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

  const toggleResults = (id: string) => {
    setExpandedResults((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const queuedPolls = polls.filter((p) => !p.is_deployed);
  const deployedPolls = polls.filter((p) => p.is_deployed);

  return (
    <div className="space-y-6">
      {/* Feedback messages */}
      {error && (
        <div className="rounded-xl p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}
      {successMsg && (
        <div className="rounded-xl p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
          {successMsg}
        </div>
      )}

      {/* Create section */}
      <div className="glass rounded-2xl p-6 border border-white/5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-klo-text">Create Polls</h3>
          <div className="flex gap-1 p-0.5 rounded-lg bg-klo-dark/50 border border-white/5">
            <button
              onClick={() => setInputMode("single")}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                inputMode === "single"
                  ? "bg-klo-slate text-klo-text"
                  : "text-klo-muted hover:text-klo-text"
              }`}
            >
              Single
            </button>
            <button
              onClick={() => setInputMode("batch")}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                inputMode === "batch"
                  ? "bg-klo-slate text-klo-text"
                  : "text-klo-muted hover:text-klo-text"
              }`}
            >
              Batch
            </button>
          </div>
        </div>

        {inputMode === "single" ? (
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
              onClick={createSinglePoll}
              disabled={creating || !question.trim() || options.filter((o) => o.trim()).length < 2}
              className="w-full px-4 py-2.5 bg-gradient-to-r from-[#2764FF] to-[#21B8CD] text-white font-semibold text-sm rounded-lg hover:brightness-110 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {creating ? "Creating..." : "Create Poll (Queued)"}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <textarea
              value={batchText}
              onChange={(e) => setBatchText(e.target.value)}
              placeholder={"Question 1 | Option A | Option B | Option C\nQuestion 2 | Yes | No\nQuestion 3 | Agree | Neutral | Disagree"}
              rows={6}
              className="w-full bg-klo-dark border border-white/10 rounded-lg px-4 py-2.5 text-sm text-klo-text placeholder:text-klo-muted focus:outline-none focus:border-[#2764FF]/50 font-mono"
            />
            <p className="text-xs text-klo-muted">
              One question per line. Format: Question | Option1 | Option2 | ...
            </p>
            <button
              onClick={createBatchPolls}
              disabled={creating || !batchText.trim()}
              className="w-full px-4 py-2.5 bg-gradient-to-r from-[#2764FF] to-[#21B8CD] text-white font-semibold text-sm rounded-lg hover:brightness-110 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {creating ? "Creating..." : "Create Batch (Queued)"}
            </button>
          </div>
        )}

        {/* File upload */}
        <div className="mt-4 pt-4 border-t border-white/5">
          <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-klo-slate border border-white/10 text-sm text-klo-muted hover:text-klo-text transition-colors cursor-pointer">
            <Upload size={16} />
            {uploading ? "Uploading..." : "Upload File"}
            <input
              type="file"
              accept=".txt,.pdf,.doc,.docx,.xls,.xlsx"
              onChange={handleFileUpload}
              className="hidden"
              disabled={uploading}
            />
          </label>
          <span className="ml-3 text-xs text-klo-muted">
            Upload any survey or poll document (.txt, .pdf, .doc, .docx, .xls, .xlsx)
          </span>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-[#2764FF]/30 border-t-[#2764FF] rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Poll Queue */}
          {queuedPolls.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-klo-text flex items-center gap-2">
                <FileText size={16} className="text-klo-muted" />
                Poll Queue ({queuedPolls.length})
              </h3>
              {queuedPolls.map((poll) => (
                <div key={poll.id} className="glass rounded-2xl p-4 border border-white/5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-klo-text truncate">{poll.question}</p>
                      <p className="text-xs text-klo-muted mt-1">
                        {(poll.options as string[]).length} options — Queued
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => deployPoll(poll.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors text-xs font-medium"
                        title="Deploy to attendees"
                      >
                        <Rocket size={14} /> Deploy
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
            </div>
          )}

          {/* Deployed / Active Polls */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-klo-text flex items-center gap-2">
              <Rocket size={16} className="text-emerald-400" />
              Deployed Polls ({deployedPolls.length})
            </h3>
            {deployedPolls.map((poll) => (
              <div key={poll.id} className="glass rounded-2xl p-4 border border-white/5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-klo-text truncate">{poll.question}</p>
                    <p className="text-xs text-klo-muted mt-1">
                      {(poll.options as string[]).length} options
                      {poll.is_active ? " — Active" : " — Closed"}
                      {" — "}{poll.totalVotes} vote{poll.totalVotes !== 1 ? "s" : ""}
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
                      title={poll.show_results ? "Hide results from attendees" : "Show results to attendees"}
                    >
                      {poll.show_results ? <Eye size={16} /> : <EyeOff size={16} />}
                    </button>
                    <button
                      onClick={() => toggleResults(poll.id)}
                      className="p-2 rounded-lg text-klo-muted hover:text-klo-text hover:bg-white/5 transition-colors"
                      title={expandedResults.has(poll.id) ? "Hide results" : "View results"}
                    >
                      {expandedResults.has(poll.id) ? (
                        <ChevronUp size={16} />
                      ) : (
                        <ChevronDown size={16} />
                      )}
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
                {expandedResults.has(poll.id) && (
                  <div className="mt-4 pt-4 border-t border-white/5">
                    <PollResults poll={poll} />
                  </div>
                )}
              </div>
            ))}
            {deployedPolls.length === 0 && (
              <p className="text-sm text-klo-muted text-center py-4">
                No deployed polls yet. Create and deploy polls from the queue above.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
