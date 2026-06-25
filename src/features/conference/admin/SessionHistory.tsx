"use client";

import { useState, useEffect, useCallback } from "react";
import { Archive, ChevronDown, ChevronUp, BarChart2, Download } from "lucide-react";
import type { SessionSnapshot } from "../types";
import PublicPollResults from "../components/PublicPollResults";

interface SessionHistoryProps {
  eventId: string;
}

interface SnapshotListItem {
  id: string;
  session_id: string | null;
  event_id: string | null;
  created_at: string;
  created_by: string | null;
  session_title: string | null;
}

export default function SessionHistory({ eventId }: SessionHistoryProps) {
  const [snapshots, setSnapshots] = useState<SnapshotListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [detailCache, setDetailCache] = useState<Record<string, SessionSnapshot>>({});
  const [detailLoading, setDetailLoading] = useState<string | null>(null);

  const fetchSnapshots = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/conference/snapshots?event_id=${eventId}`
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error || "Failed to load history");
        return;
      }
      const data: SnapshotListItem[] = await res.json();
      setSnapshots(data);
    } catch {
      setError("Failed to load history");
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => { fetchSnapshots(); }, [fetchSnapshots]);

  const toggleExpand = async (id: string) => {
    if (expanded === id) {
      setExpanded(null);
      return;
    }

    setExpanded(id);

    // Load detail if not cached
    if (!detailCache[id]) {
      setDetailLoading(id);
      try {
        const res = await fetch(`/api/conference/snapshots/${id}`);
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          setError(body.error || "Failed to load snapshot");
          return;
        }
        const data: SessionSnapshot = await res.json();
        setDetailCache((prev) => ({ ...prev, [id]: data }));
      } catch {
        setError("Failed to load snapshot details");
      } finally {
        setDetailLoading(null);
      }
    }
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });

  const downloadCSV = (snapshot: SessionSnapshot) => {
    const rows: string[][] = [];
    rows.push(["Session", snapshot.snapshot_data.session.title]);
    rows.push(["Ended", formatDate(snapshot.snapshot_data.session.ended_at)]);
    rows.push(["Attendees", String(snapshot.snapshot_data.attendee_count)]);
    rows.push([]);
    rows.push(["POLLS"]);
    rows.push(["Question", "Option", "Votes", "Percentage"]);
    for (const poll of snapshot.snapshot_data.polls) {
      poll.options.forEach((opt, idx) => {
        rows.push([
          poll.question,
          opt,
          String(poll.votes[idx] ?? 0),
          `${poll.percentages[idx] ?? 0}%`,
        ]);
      });
      rows.push(["", "Total Votes", String(poll.total_votes), ""]);
      rows.push([]);
    }
    if (snapshot.snapshot_data.questions.length > 0) {
      rows.push(["Q&A"]);
      rows.push(["Question", "Upvotes"]);
      for (const q of snapshot.snapshot_data.questions) {
        rows.push([q.text, String(q.upvotes)]);
      }
    }
    const csv = rows
      .map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${snapshot.snapshot_data.session.title.replace(/\s+/g, "-")}-results.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-[#2764FF]/30 border-t-[#2764FF] rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl px-4 py-3 bg-red-500/10 border border-red-500/20">
        <p className="text-sm text-red-400">{error}</p>
      </div>
    );
  }

  if (snapshots.length === 0) {
    return (
      <div className="glass rounded-2xl p-8 border border-white/5 text-center">
        <Archive size={32} className="text-klo-muted mx-auto mb-3" />
        <p className="text-sm text-klo-muted mb-1">No session archives yet.</p>
        <p className="text-xs text-klo-muted">
          End a session using the &ldquo;End Session&rdquo; button in Present Live mode to archive results here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-base font-semibold text-klo-text">Session History</h3>
        <span className="text-xs text-klo-muted">
          — {snapshots.length} archived session{snapshots.length !== 1 ? "s" : ""}
        </span>
      </div>

      {snapshots.map((snap) => {
        const isOpen = expanded === snap.id;
        const detail = detailCache[snap.id];
        const isLoadingDetail = detailLoading === snap.id;

        return (
          <div
            key={snap.id}
            className="glass rounded-2xl border border-white/5 overflow-hidden"
          >
            {/* Summary row */}
            <button
              onClick={() => toggleExpand(snap.id)}
              className="w-full flex items-center gap-4 px-4 py-4 text-left hover:bg-white/[0.02] transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-[#2764FF]/10 flex items-center justify-center shrink-0">
                <Archive size={15} className="text-[#2764FF]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-klo-text truncate">
                  {snap.session_title ?? "Untitled Session"}
                </p>
                <p className="text-xs text-klo-muted">{formatDate(snap.created_at)}</p>
              </div>
              {/* Poll / Q counts from detail cache or placeholder */}
              {detail ? (
                <div className="flex items-center gap-3 text-xs text-klo-muted shrink-0">
                  <span className="flex items-center gap-1">
                    <BarChart2 size={11} />
                    {detail.snapshot_data.polls.length} polls
                  </span>
                  <span>
                    {detail.snapshot_data.questions.length} Q&amp;As
                  </span>
                </div>
              ) : null}
              <span className="shrink-0 ml-2 text-klo-muted">
                {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </span>
            </button>

            {/* Expanded detail */}
            {isOpen && (
              <div className="border-t border-white/5 px-4 pb-4 pt-3">
                {isLoadingDetail && (
                  <div className="flex items-center justify-center py-6">
                    <div className="w-5 h-5 border-2 border-[#2764FF]/30 border-t-[#2764FF] rounded-full animate-spin" />
                  </div>
                )}
                {!isLoadingDetail && detail && (
                  <div className="space-y-5">
                      <button
                        onClick={() => downloadCSV(detail)}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                        style={{ background: "rgba(39,100,255,0.1)", color: "#60a5fa", border: "1px solid rgba(39,100,255,0.2)" }}
                      >
                        <Download size={12} />
                        Download CSV
                      </button>
                    {/* Meta row */}
                    <div className="flex flex-wrap gap-4 text-xs text-klo-muted">
                      <span>
                        Ended: {formatDate(detail.snapshot_data.session.ended_at)}
                      </span>
                      {detail.snapshot_data.attendee_count > 0 && (
                        <span>{detail.snapshot_data.attendee_count} attendees</span>
                      )}
                    </div>

                    {/* Polls */}
                    {detail.snapshot_data.polls.length > 0 ? (
                      <PublicPollResults
                        polls={detail.snapshot_data.polls}
                        sessionTitle={detail.snapshot_data.session.title}
                        endedAt={detail.snapshot_data.session.ended_at}
                      />
                    ) : (
                      <p className="text-xs text-klo-muted">No polls in this session.</p>
                    )}

                    {/* Files */}
                    {detail.snapshot_data.files && detail.snapshot_data.files.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-klo-muted uppercase tracking-wider mb-2">
                          Files
                        </p>
                        <div className="space-y-1.5">
                          {detail.snapshot_data.files.map((f, fIdx) => (
                            <a
                              key={fIdx}
                              href={f.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-xs text-[#2764FF] hover:text-[#2764FF]/80 transition-colors"
                            >
                              <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-[#2764FF]/10 shrink-0">{f.file_type}</span>
                              <span className="truncate">{f.file_name}</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Questions summary */}
                    {detail.snapshot_data.questions.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-klo-muted uppercase tracking-wider mb-2">
                          Q&amp;A ({detail.snapshot_data.questions.length})
                        </p>
                        <div className="space-y-1">
                          {detail.snapshot_data.questions
                            .sort((a, b) => b.upvotes - a.upvotes)
                            .slice(0, 5)
                            .map((q, qIdx) => (
                              <div
                                key={qIdx}
                                className="flex items-start gap-2 text-xs text-klo-muted"
                              >
                                <span className="shrink-0 mt-0.5 text-klo-muted/50">
                                  {q.upvotes > 0 ? `+${q.upvotes}` : ""}
                                </span>
                                <span className="line-clamp-2">{q.text}</span>
                              </div>
                            ))}
                          {detail.snapshot_data.questions.length > 5 && (
                            <p className="text-xs text-klo-muted/50">
                              + {detail.snapshot_data.questions.length - 5} more
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
