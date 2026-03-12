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
  Download,
} from "lucide-react";
// PollResults and CollectiveResultsChart available if needed for detailed views
import { useConferenceRealtime } from "../hooks/useConferenceRealtime";
import { useSessions } from "../hooks/useSessions";
import type { PollWithVotes, ConferenceSession } from "../types";

type InputMode = "single" | "batch";

interface PollManagerProps {
  eventId?: string;
}

export default function PollManager({ eventId }: PollManagerProps = {}) {
  const [polls, setPolls] = useState<PollWithVotes[]>([]);
  const [loading, setLoading] = useState(true);
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [batchText, setBatchText] = useState("");
  const [inputMode, setInputMode] = useState<InputMode>("single");
  const [creating, setCreating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [filterSessionId, setFilterSessionId] = useState<string>("all");
  const [exporting, setExporting] = useState(false);
  const { sessions } = useSessions({ eventId });

  const fetchPolls = useCallback(async () => {
    try {
      const url = eventId
        ? `/api/conference/polls?event_id=${eventId}`
        : "/api/conference/polls";
      const res = await fetch(url);
      if (res.ok) setPolls(await res.json());
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useConferenceRealtime({ onPollsChange: fetchPolls, onVotesChange: fetchPolls });

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
        body: JSON.stringify({
          question: question.trim(),
          options: validOptions,
          ...(filterSessionId !== "all" ? { session_id: filterSessionId } : {}),
          ...(eventId ? { event_id: eventId } : {}),
        }),
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
        body: JSON.stringify({
          questions,
          ...(filterSessionId !== "all" ? { session_id: filterSessionId } : {}),
          ...(eventId ? { event_id: eventId } : {}),
        }),
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
      if (eventId) formData.append("event_id", eventId);
      if (filterSessionId !== "all") formData.append("session_id", filterSessionId);
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

  const [deployedSet, setDeployedSet] = useState<Set<string>>(new Set());
  const [deployingId, setDeployingId] = useState<string | null>(null);
  const [deployingAll, setDeployingAll] = useState(false);

  const queuedPolls = (filterSessionId === "all" ? polls : polls.filter((p) => p.session_id === filterSessionId)).filter((p) => !p.is_deployed);

  const deployPoll = async (id: string) => {
    // If already deployed in this session, confirm before re-deploying
    if (deployedSet.has(id)) {
      if (!confirm("This poll has already been deployed. Are you sure you want to deploy it again?")) return;
    }
    setDeployingId(id);
    try {
      await fetch(`/api/conference/polls/${id}/deploy`, { method: "POST" });
      setDeployedSet((prev) => new Set(prev).add(id));
      showSuccess("Poll deployed!");
      fetchPolls();
    } finally {
      setDeployingId(null);
    }
  };

  const deployAllPolls = async () => {
    if (queuedPolls.length === 0) return;
    setDeployingAll(true);
    try {
      await Promise.all(
        queuedPolls.map((p) =>
          fetch(`/api/conference/polls/${p.id}/deploy`, { method: "POST" })
        )
      );
      setDeployedSet((prev) => {
        const next = new Set(prev);
        queuedPolls.forEach((p) => next.add(p.id));
        return next;
      });
      showSuccess(`${queuedPolls.length} poll${queuedPolls.length !== 1 ? "s" : ""} deployed!`);
      fetchPolls();
    } finally {
      setDeployingAll(false);
    }
  };

  const togglePoll = async (id: string, field: "is_active" | "show_results", value: boolean) => {
    // Confirmation prompt when closing a poll (deactivating)
    if (field === "is_active" && value === false) {
      const confirmed = window.confirm(
        "Are you sure you want to close this poll? Once closed, no more votes can be submitted."
      );
      if (!confirmed) return;
    }

    const body: Record<string, unknown> = { [field]: value };
    // Set closed_at timestamp when deactivating a poll
    if (field === "is_active" && value === false) {
      body.closed_at = new Date().toISOString();
    }

    await fetch(`/api/conference/polls/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    fetchPolls();
  };

  const deletePoll = async (id: string) => {
    await fetch(`/api/conference/polls/${id}`, { method: "DELETE" });
    fetchPolls();
  };

  const handleExportPDF = async () => {
    const target = (filterSessionId === "all"
      ? polls
      : polls.filter((p) => p.session_id === filterSessionId)
    ).filter((p) => p.is_deployed);

    if (target.length === 0) return;
    setExporting(true);
    try {
      const res = await fetch("/api/conference/polls/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ polls: target }),
      });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `klo-poll-results-${Date.now()}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("Failed to export PDF");
    } finally {
      setExporting(false);
    }
  };

  const filteredPolls = filterSessionId === "all"
    ? polls
    : polls.filter((p) => p.session_id === filterSessionId);
  const deployedPolls = filteredPolls.filter((p) => p.is_deployed);

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

      {/* Session filter */}
      {sessions.length > 0 && (
        <div className="glass rounded-2xl p-4 border border-white/5">
          <label className="text-xs font-medium text-klo-muted block mb-2">Session</label>
          <select
            value={filterSessionId}
            onChange={(e) => setFilterSessionId(e.target.value)}
            className="w-full bg-klo-dark border border-white/10 rounded-lg px-4 py-2.5 text-sm text-klo-text focus:outline-none focus:border-[#2764FF]/50"
          >
            <option value="all">All Sessions</option>
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>{s.title}</option>
            ))}
          </select>
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
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-klo-text flex items-center gap-2">
                  <FileText size={16} className="text-klo-muted" />
                  Poll Queue ({queuedPolls.length})
                </h3>
                <button
                  onClick={deployAllPolls}
                  disabled={deployingAll}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:brightness-110 transition-colors text-xs font-semibold disabled:opacity-50"
                  title="Deploy all queued polls at once"
                >
                  <Rocket size={14} />
                  {deployingAll ? "Deploying..." : `Deploy All (${queuedPolls.length})`}
                </button>
              </div>
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
                        disabled={deployingId === poll.id || deployingAll}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors text-xs font-medium disabled:opacity-50"
                        title="Deploy to attendees"
                      >
                        <Rocket size={14} />
                        {deployingId === poll.id ? "Deploying..." : "Deploy"}
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

          {/* Results — one unified view */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-klo-text flex items-center gap-2">
                <Rocket size={16} className="text-emerald-400" />
                Results ({deployedPolls.length} poll{deployedPolls.length !== 1 ? "s" : ""})
              </h3>
              {deployedPolls.length > 0 && (
                <button
                  onClick={handleExportPDF}
                  disabled={exporting}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2764FF]/10 text-[#2764FF] hover:bg-[#2764FF]/20 transition-colors text-xs font-medium disabled:opacity-40"
                >
                  <Download size={14} />
                  {exporting ? "Exporting..." : "Download PDF"}
                </button>
              )}
            </div>

            {deployedPolls.length === 0 ? (
              <p className="text-sm text-klo-muted text-center py-4">
                No deployed polls yet. Create and deploy polls from the queue above.
              </p>
            ) : (
              <div className="glass rounded-2xl border border-white/5 divide-y divide-white/5">
                {deployedPolls.map((poll) => {
                  const options = poll.options as string[];
                  const maxVotes = Math.max(...poll.votes);
                  return (
                    <div key={poll.id} className="p-4 space-y-3">
                      {/* Question header + controls */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-klo-text">{poll.question}</p>
                          <p className="text-xs text-klo-muted mt-0.5">
                            {poll.totalVotes} vote{poll.totalVotes !== 1 ? "s" : ""}
                            {poll.is_active ? (
                              <span className="text-emerald-400 ml-2">Live</span>
                            ) : (
                              <span className="text-klo-muted/60 ml-2">Closed</span>
                            )}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => togglePoll(poll.id, "is_active", !poll.is_active)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              poll.is_active
                                ? "text-emerald-400 hover:bg-emerald-500/10"
                                : "text-klo-muted hover:bg-white/5"
                            }`}
                            title={poll.is_active ? "Close poll" : "Reopen poll"}
                          >
                            {poll.is_active ? <Power size={14} /> : <PowerOff size={14} />}
                          </button>
                          <button
                            onClick={() => togglePoll(poll.id, "show_results", !poll.show_results)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              poll.show_results
                                ? "text-[#2764FF] hover:bg-[#2764FF]/10"
                                : "text-klo-muted hover:bg-white/5"
                            }`}
                            title={poll.show_results ? "Visible to attendees" : "Hidden from attendees"}
                          >
                            {poll.show_results ? <Eye size={14} /> : <EyeOff size={14} />}
                          </button>
                          <button
                            onClick={() => deletePoll(poll.id)}
                            className="p-1.5 rounded-lg text-klo-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            title="Delete poll"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Inline results — always visible */}
                      {poll.totalVotes > 0 ? (
                        <div className="space-y-2">
                          {options.map((opt, idx) => {
                            const votes = poll.votes[idx] || 0;
                            const pct = poll.totalVotes > 0 ? Math.round((votes / poll.totalVotes) * 100) : 0;
                            const isLeading = votes === maxVotes && maxVotes > 0;
                            return (
                              <div key={idx}>
                                <div className="flex items-center justify-between text-xs mb-0.5">
                                  <span className={isLeading ? "text-klo-text font-semibold" : "text-klo-muted"}>
                                    {opt}
                                  </span>
                                  <span className={isLeading ? "text-klo-text font-semibold" : "text-klo-muted"}>
                                    {votes} ({pct}%)
                                  </span>
                                </div>
                                <div className="w-full h-2 rounded-full bg-white/5">
                                  <div
                                    className="h-full rounded-full transition-all duration-500"
                                    style={{
                                      width: `${pct}%`,
                                      backgroundColor: isLeading ? "#D4A853" : "#2764FF",
                                      opacity: isLeading ? 1 : 0.6,
                                    }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-xs text-klo-muted/60">No votes yet</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
