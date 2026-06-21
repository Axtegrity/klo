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
  FileText,
  Download,
  Undo2,
  RefreshCw,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
// PollResults and CollectiveResultsChart available if needed for detailed views
import { useConferenceRealtime } from "../hooks/useConferenceRealtime";
import { useSessions } from "../hooks/useSessions";
import type { PollWithVotes } from "../types";

type InputMode = "single" | "batch";

interface PollManagerProps {
  eventId?: string;
  sessionId?: string;
}

export default function PollManager({ eventId, sessionId }: PollManagerProps = {}) {
  const [polls, setPolls] = useState<PollWithVotes[]>([]);
  const [loading, setLoading] = useState(true);
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [batchText, setBatchText] = useState("");
  const [inputMode, setInputMode] = useState<InputMode>("single");
  const [creating, setCreating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addMode, setAddMode] = useState<"upload" | "manual" | null>(null);
  const [pullingBack, setPullingBack] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [filterSessionId, setFilterSessionId] = useState<string>(sessionId ?? "all");
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

  const queuedPolls = (filterSessionId === "all" ? polls : polls.filter((p) => p.session_id === filterSessionId)).filter((p) => !p.is_deployed);

  const pullBackAll = async () => {
    if (!eventId) return;
    setPullingBack(true);
    setError(null);
    try {
      const res = await fetch(`/api/conference/polls/reset?event_id=${eventId}`, { method: "POST" });
      if (res.ok) {
        fetchPolls();
        showSuccess("All polls pulled back — attendees see nothing. Use Present Live to push one at a time.");
      } else {
        const data = await res.json().catch(() => null);
        setError(data?.error || "Failed to pull back polls");
      }
    } catch {
      setError("Network error — try again");
    } finally {
      setPullingBack(false);
    }
  };

  const undeployPoll = async (id: string) => {
    await fetch(`/api/conference/polls/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_deployed: false }),
    });
    fetchPolls();
    showSuccess("Poll moved back to queue.");
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
    : polls.filter((p) => p.session_id === filterSessionId || p.session_id === null);
  const deployedPolls = filteredPolls.filter((p) => p.is_deployed);

  const activePollCount = filteredPolls.filter((p) => p.is_active).length;
  const deployedNotActivePollCount = filteredPolls.filter((p) => p.is_deployed && !p.is_active).length;
  const hasDeployedPolls = deployedPolls.length > 0;

  function PollPreview({ question, options }: { question: string; options: string[] }) {
    const [open, setOpen] = useState(false);
    return (
      <div className="border-t border-white/5">
        <button
          onClick={() => setOpen((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-2 text-xs text-klo-muted hover:text-klo-text transition-colors"
        >
          <span>Preview</span>
          {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
        {open && (
          <div className="px-4 pb-3 space-y-2">
            <p className="text-sm font-medium text-klo-text">{question}</p>
            {options.map((opt, idx) => (
              <div key={idx} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5">
                <span className="w-5 h-5 rounded-full border border-white/20 shrink-0" />
                <span className="text-xs text-klo-muted">{opt}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  const hasPolls = filteredPolls.length > 0;

  if (!hasPolls && !showAddModal && addMode === null) {
    return (
      <div className="flex items-center justify-between py-2">
        <span className="text-xs text-klo-muted">No polls added yet</span>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
          style={{ background: "rgba(39,100,255,0.1)", color: "#60a5fa", border: "1px solid rgba(39,100,255,0.2)" }}
        >
          <Plus size={13} />
          Add Polls
        </button>
      </div>
    );
  }

  if (showAddModal && addMode === null) {
    return (
      <div className="space-y-2">
        <p className="text-xs font-semibold text-klo-muted uppercase tracking-wider">How would you like to add polls?</p>
        <div className="flex flex-col gap-2">
          <button
            onClick={() => { setAddMode("upload"); setShowAddModal(false); }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors hover:bg-white/5"
            style={{ border: "0.5px solid rgba(255,255,255,0.1)" }}
          >
            <Upload size={18} className="text-klo-muted shrink-0" />
            <div>
              <p className="text-sm font-semibold text-klo-text">Upload a file</p>
              <p className="text-xs text-klo-muted">Import from .docx, .pdf, .txt</p>
            </div>
          </button>
          <button
            onClick={() => { setAddMode("manual"); setShowAddModal(false); }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors hover:bg-white/5"
            style={{ border: "0.5px solid rgba(255,255,255,0.1)" }}
          >
            <Plus size={18} className="text-klo-muted shrink-0" />
            <div>
              <p className="text-sm font-semibold text-klo-text">Add manually</p>
              <p className="text-xs text-klo-muted">Type questions one by one</p>
            </div>
          </button>
          <button
            onClick={() => setShowAddModal(false)}
            className="text-xs text-klo-muted hover:text-klo-text transition-colors py-1"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
        {/* Add more button when polls exist */}
        {hasPolls && addMode === null && (
          <div className="flex justify-end">
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
              style={{ background: "rgba(39,100,255,0.05)", color: "#60a5fa", border: "1px solid rgba(39,100,255,0.2)" }}
            >
              <Plus size={13} />
              + Polls
            </button>
          </div>
        )}

        {/* Create form — only shown when addMode is set */}
        {addMode !== null && (
          <div className="flex justify-end mb-2">
            <button
              onClick={() => setAddMode(null)}
              className="text-xs text-klo-muted hover:text-klo-text transition-colors"
            >
              ← Back to polls
            </button>
          </div>
        )}

        {/* ── PULL BACK ALL — emergency banner when polls are live ── */}
      {hasDeployedPolls && eventId && (
        <div className="rounded-2xl p-4 border border-orange-500/40 bg-orange-500/10 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-orange-300">
              {activePollCount > 0
                ? `${activePollCount} poll${activePollCount !== 1 ? "s" : ""} currently LIVE on attendee screens`
                : `${deployedNotActivePollCount} closed poll${deployedNotActivePollCount !== 1 ? "s" : ""} visible to attendees`}
            </p>
            <p className="text-xs text-orange-400/70 mt-0.5">
              Pull back all to clear the screen, then use <strong>Present Live</strong> to push one at a time.
            </p>
          </div>
          <button
            onClick={pullBackAll}
            disabled={pullingBack}
            className="shrink-0 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-white font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {pullingBack ? (
              <>
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Pulling back…
              </>
            ) : (
              <>
                <Undo2 size={16} />
                Pull Back All
              </>
            )}
          </button>
        </div>
      )}

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

      {/* Create section — only shown when addMode is set */}
      {addMode !== null && (
      <div className="glass rounded-2xl p-6 border border-white/5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-klo-text">Create Polls</h3>
          {addMode === "manual" && (
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
          )}
        </div>

        {addMode === "manual" && inputMode === "single" ? (
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
        ) : addMode === "manual" ? (
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
        ) : null}

        {/* File upload — only shown in upload mode */}
        {addMode === "upload" && (
          <div className="mt-4 pt-4 border-t border-white/5">
            <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-klo-slate border border-white/10 text-sm text-klo-muted hover:text-klo-text transition-colors cursor-pointer">
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
        )}
      </div>
      )}

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-[#2764FF]/30 border-t-[#2764FF] rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Unified poll list — Deploy and Pull Back on the same card */}
          {filteredPolls.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-klo-text flex items-center gap-2">
                  <FileText size={16} className="text-klo-muted" />
                  Polls ({filteredPolls.length})
                </h3>
                <div className="flex items-center gap-2">
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
                  {filteredPolls.length > 0 && filteredPolls.some(p => p.is_deployed) && (
                      <button
                        onClick={pullBackAll}
                        disabled={pullingBack}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 hover:bg-yellow-500/20 transition-colors text-xs font-semibold disabled:opacity-50"
                        title="Reset all polls back to queue"
                      >
                        <RefreshCw size={14} />
                        {pullingBack ? "Resetting..." : "Reset All"}
                      </button>
                    )}
                </div>
              </div>

              {filteredPolls.map((poll) => {
                const pollOptions = poll.options as string[];
                const maxVotes = Math.max(...poll.votes);
                return (
                  <div key={poll.id} className="glass rounded-2xl border border-white/5">
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-klo-text">{poll.question}</p>
                          <p className="text-xs text-klo-muted mt-1">
                            {pollOptions.length} options
                            {poll.is_deployed ? (
                              <>
                                {" — "}
                                {poll.totalVotes} vote{poll.totalVotes !== 1 ? "s" : ""}
                                {poll.is_active ? (
                                  <span className="text-emerald-400 ml-1.5">Live</span>
                                ) : (
                                  <span className="text-klo-muted/60 ml-1.5">Closed</span>
                                )}
                              </>
                            ) : (
                              <span className="text-klo-muted/60"> — Queued</span>
                            )}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {poll.is_deployed ? (
                            <>
                              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${poll.is_active ? "text-emerald-400 bg-emerald-500/10" : "text-[#8B949E] bg-white/5"}`}>
                                {poll.is_active ? "Live" : "Closed"}
                              </span>
                            </>
                          ) : (
                            <span className="text-xs text-klo-muted/60 px-2">Queued</span>
                          )}
                          <button
                            onClick={() => deletePoll(poll.id)}
                            className="p-1.5 rounded-lg text-klo-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            title="Delete poll"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Preview — shows question and options before deployment */}
                    {!poll.is_deployed && (
                      <PollPreview options={pollOptions} question={poll.question} />
                    )}

                    {/* Vote results — shown inline once deployed */}
                    {poll.is_deployed && (
                      <div className="px-4 pb-4 border-t border-white/5 pt-3">
                        {poll.totalVotes > 0 ? (
                          <div className="space-y-2">
                            {pollOptions.map((opt, idx) => {
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
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-klo-muted text-center py-4">
              No polls yet. Create polls above and deploy them to attendees.
            </p>
          )}
        </>
      )}
    </div>
  );
}
