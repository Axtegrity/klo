"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2, Loader2, Eye, EyeOff } from "lucide-react";
import Modal from "@/components/shared/Modal";
import { useToast } from "@/contexts/ToastContext";
import type { StrategySessionRow } from "@/lib/supabase";

// ── Form state ────────────────────────────────────────────────────────────────

interface SessionFormState {
  slug: string;
  title: string;
  description: string;
  date: string;
  session_date: string;
  time: string;
  facilitator: string;
  total_seats: number;
  attendees_override: string;
  is_past: boolean;
  tier: "pro" | "executive";
  topics: string; // comma-separated
  replay_url: string;
  notes_url: string;
  published: boolean;
}

const EMPTY_FORM: SessionFormState = {
  slug: "",
  title: "",
  description: "",
  date: "",
  session_date: "",
  time: "",
  facilitator: "",
  total_seats: 20,
  attendees_override: "",
  is_past: false,
  tier: "pro",
  topics: "",
  replay_url: "",
  notes_url: "",
  published: false,
};

function sessionToForm(s: StrategySessionRow): SessionFormState {
  return {
    slug: s.slug,
    title: s.title,
    description: s.description ?? "",
    date: s.date ?? "",
    session_date: s.session_date ?? "",
    time: s.time ?? "",
    facilitator: s.facilitator ?? "",
    total_seats: s.total_seats,
    attendees_override: s.attendees_override != null ? String(s.attendees_override) : "",
    is_past: s.is_past,
    tier: s.tier,
    topics: s.topics.join(", "),
    replay_url: s.replay_url ?? "",
    notes_url: s.notes_url ?? "",
    published: s.published,
  };
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 200);
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function StrategyRoomsAdminTab() {
  const { toast } = useToast();
  const [sessions, setSessions] = useState<(StrategySessionRow & { registered_count: number })[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [editingSession, setEditingSession] = useState<StrategySessionRow | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState<SessionFormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/strategy-rooms");
      if (!res.ok) throw new Error("Failed to load sessions");
      const data = await res.json();
      setSessions(data.data ?? []);
    } catch (err) {
      toast("error", err instanceof Error ? err.message : "Failed to load sessions");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  function openCreate() {
    setForm(EMPTY_FORM);
    setIsCreating(true);
  }

  function openEdit(session: StrategySessionRow) {
    setForm(sessionToForm(session));
    setEditingSession(session);
  }

  function closeModal() {
    setIsCreating(false);
    setEditingSession(null);
  }

  function handleTitleChange(title: string) {
    setForm((prev) => ({
      ...prev,
      title,
      // Auto-populate slug only when creating and slug hasn't been manually edited
      ...(isCreating && prev.slug === slugify(prev.title) ? { slug: slugify(title) } : {}),
    }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const topicsArray = form.topics
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const payload: Record<string, unknown> = {
        slug: form.slug.trim(),
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        date: form.date.trim() || undefined,
        session_date: form.session_date.trim() || undefined,
        time: form.time.trim() || undefined,
        facilitator: form.facilitator.trim() || undefined,
        total_seats: form.total_seats,
        is_past: form.is_past,
        tier: form.tier,
        topics: topicsArray,
        published: form.published,
      };

      if (form.attendees_override.trim() !== "") {
        payload.attendees_override = parseInt(form.attendees_override, 10);
      }
      if (form.replay_url.trim()) payload.replay_url = form.replay_url.trim();
      if (form.notes_url.trim()) payload.notes_url = form.notes_url.trim();

      let res: Response;
      if (isCreating) {
        res = await fetch("/api/admin/strategy-rooms", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else if (editingSession) {
        res = await fetch(`/api/admin/strategy-rooms/${editingSession.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        return;
      }

      if (!res.ok) {
        const data = await res.json();
        toast("error", data.error ?? "Save failed");
        return;
      }

      toast("success", isCreating ? "Session created." : "Session updated.");
      closeModal();
      await fetchSessions();
    } catch (err) {
      toast("error", err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handlePublishToggle(session: StrategySessionRow) {
    setTogglingId(session.id);
    try {
      const res = await fetch(`/api/admin/strategy-rooms/${session.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: !session.published }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast("error", data.error ?? "Toggle failed");
        return;
      }
      toast("success", session.published ? "Session unpublished." : "Session published.");
      await fetchSessions();
    } catch {
      toast("error", "Toggle failed");
    } finally {
      setTogglingId(null);
    }
  }

  async function handleDelete(session: StrategySessionRow) {
    // First click sets confirmDeleteId — the row renders inline confirm/cancel buttons.
    // Actual delete only fires when the user clicks the "Confirm" button.
    if (confirmDeleteId !== session.id) {
      setConfirmDeleteId(session.id);
      return;
    }
    setConfirmDeleteId(null);
    setDeletingId(session.id);
    try {
      const res = await fetch(`/api/admin/strategy-rooms/${session.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        toast("error", data.error ?? "Delete failed");
        return;
      }
      toast("success", "Session deleted.");
      await fetchSessions();
    } catch {
      toast("error", "Delete failed");
    } finally {
      setDeletingId(null);
    }
  }

  const modalOpen = isCreating || !!editingSession;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-klo-text">Strategy Rooms</h2>
          <p className="text-sm text-klo-muted mt-0.5">Manage sessions and registrations</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#2764FF]/15 border border-[#2764FF]/30 text-[#2764FF] hover:bg-[#2764FF]/25 transition-colors text-sm font-medium min-h-[44px]"
        >
          <Plus size={16} />
          New Session
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-klo-gold animate-spin" />
        </div>
      )}

      {/* Sessions table */}
      {!loading && (
        <div className="glass rounded-2xl border border-white/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left px-6 py-4 text-klo-muted font-medium">Title</th>
                  <th className="text-left px-6 py-4 text-klo-muted font-medium hidden sm:table-cell">Date</th>
                  <th className="text-left px-6 py-4 text-klo-muted font-medium hidden md:table-cell">Tier</th>
                  <th className="text-left px-6 py-4 text-klo-muted font-medium hidden md:table-cell">Seats</th>
                  <th className="text-left px-6 py-4 text-klo-muted font-medium">Published</th>
                  <th className="px-6 py-4 w-24 text-right text-klo-muted font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sessions.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-klo-muted">
                      No sessions yet. Click "New Session" to create one.
                    </td>
                  </tr>
                )}
                {sessions.map((session) => (
                  <tr
                    key={session.id}
                    className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-6 py-4">
                      <p className="text-klo-text font-medium leading-snug">{session.title}</p>
                      <p className="text-xs text-klo-muted mt-0.5">{session.slug}</p>
                    </td>
                    <td className="px-6 py-4 text-klo-muted hidden sm:table-cell">
                      {session.date ?? "—"}
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                          session.tier === "executive"
                            ? "bg-klo-gold/20 text-klo-gold"
                            : "bg-blue-500/20 text-blue-400"
                        }`}
                      >
                        {session.tier}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-klo-muted hidden md:table-cell">
                      {session.registered_count}/{session.total_seats}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handlePublishToggle(session)}
                        disabled={togglingId === session.id}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${
                          session.published
                            ? "bg-green-500/15 text-green-400 hover:bg-green-500/25"
                            : "bg-white/10 text-klo-muted hover:bg-white/20"
                        }`}
                        title={session.published ? "Click to unpublish" : "Click to publish"}
                      >
                        {togglingId === session.id ? (
                          <Loader2 size={11} className="animate-spin" />
                        ) : session.published ? (
                          <Eye size={11} />
                        ) : (
                          <EyeOff size={11} />
                        )}
                        {session.published ? "Live" : "Draft"}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      {confirmDeleteId === session.id ? (
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-xs text-klo-muted whitespace-nowrap">Are you sure?</span>
                          <button
                            onClick={() => handleDelete(session)}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white/5 text-klo-muted hover:bg-white/10 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEdit(session)}
                            className="p-2 rounded-lg text-klo-muted hover:text-klo-text hover:bg-white/5 transition-colors"
                            aria-label="Edit session"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={() => handleDelete(session)}
                            disabled={deletingId === session.id}
                            className="p-2 rounded-lg text-klo-muted hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                            aria-label="Delete session"
                          >
                            {deletingId === session.id ? (
                              <Loader2 size={15} className="animate-spin" />
                            ) : (
                              <Trash2 size={15} />
                            )}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={isCreating ? "New Strategy Room Session" : "Edit Session"}
        size="lg"
      >
        <div className="space-y-5">
          {/* Title */}
          <div>
            <label className="block text-xs text-klo-muted mb-1.5">
              Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="AI Governance for Faith Organizations"
              className="w-full px-4 py-2.5 rounded-xl bg-klo-dark border border-white/10 text-klo-text placeholder:text-klo-muted text-sm focus:outline-none focus:border-klo-gold/50"
            />
          </div>

          {/* Slug */}
          <div>
            <label className="block text-xs text-klo-muted mb-1.5">
              Slug <span className="text-red-400">*</span>
              <span className="ml-1 text-klo-muted/60">(URL identifier, lowercase letters/numbers/hyphens)</span>
            </label>
            <input
              type="text"
              value={form.slug}
              onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
              placeholder="ai-governance-faith"
              className="w-full px-4 py-2.5 rounded-xl bg-klo-dark border border-white/10 text-klo-text placeholder:text-klo-muted text-sm focus:outline-none focus:border-klo-gold/50 font-mono"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs text-klo-muted mb-1.5">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              placeholder="Describe this session..."
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl bg-klo-dark border border-white/10 text-klo-text placeholder:text-klo-muted text-sm focus:outline-none focus:border-klo-gold/50 resize-none"
            />
          </div>

          {/* Date label + Session date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-klo-muted mb-1.5">Date Label</label>
              <input
                type="text"
                value={form.date}
                onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
                placeholder="May 15, 2026"
                className="w-full px-4 py-2.5 rounded-xl bg-klo-dark border border-white/10 text-klo-text placeholder:text-klo-muted text-sm focus:outline-none focus:border-klo-gold/50"
              />
            </div>
            <div>
              <label className="block text-xs text-klo-muted mb-1.5">Session Date</label>
              <input
                type="date"
                value={form.session_date}
                onChange={(e) => setForm((p) => ({ ...p, session_date: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl bg-klo-dark border border-white/10 text-klo-text placeholder:text-klo-muted text-sm focus:outline-none focus:border-klo-gold/50"
              />
            </div>
          </div>

          {/* Time + Facilitator */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-klo-muted mb-1.5">Time</label>
              <input
                type="text"
                value={form.time}
                onChange={(e) => setForm((p) => ({ ...p, time: e.target.value }))}
                placeholder="2:00 PM EST"
                className="w-full px-4 py-2.5 rounded-xl bg-klo-dark border border-white/10 text-klo-text placeholder:text-klo-muted text-sm focus:outline-none focus:border-klo-gold/50"
              />
            </div>
            <div>
              <label className="block text-xs text-klo-muted mb-1.5">Facilitator</label>
              <input
                type="text"
                value={form.facilitator}
                onChange={(e) => setForm((p) => ({ ...p, facilitator: e.target.value }))}
                placeholder="Keith L. Odom"
                className="w-full px-4 py-2.5 rounded-xl bg-klo-dark border border-white/10 text-klo-text placeholder:text-klo-muted text-sm focus:outline-none focus:border-klo-gold/50"
              />
            </div>
          </div>

          {/* Total Seats + Tier */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-klo-muted mb-1.5">
                Total Seats <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                min={1}
                max={1000}
                value={form.total_seats}
                onChange={(e) => setForm((p) => ({ ...p, total_seats: parseInt(e.target.value, 10) || 20 }))}
                className="w-full px-4 py-2.5 rounded-xl bg-klo-dark border border-white/10 text-klo-text text-sm focus:outline-none focus:border-klo-gold/50"
              />
            </div>
            <div>
              <label className="block text-xs text-klo-muted mb-1.5">
                Tier <span className="text-red-400">*</span>
              </label>
              <select
                value={form.tier}
                onChange={(e) => setForm((p) => ({ ...p, tier: e.target.value as "pro" | "executive" }))}
                className="w-full px-4 py-2.5 rounded-xl bg-klo-dark border border-white/10 text-klo-text text-sm focus:outline-none focus:border-klo-gold/50"
              >
                <option value="pro">Pro</option>
                <option value="executive">Executive</option>
              </select>
            </div>
          </div>

          {/* Topics */}
          <div>
            <label className="block text-xs text-klo-muted mb-1.5">
              Topics <span className="text-klo-muted/60">(comma-separated)</span>
            </label>
            <input
              type="text"
              value={form.topics}
              onChange={(e) => setForm((p) => ({ ...p, topics: e.target.value }))}
              placeholder="AI Governance, Ethics, Faith Organizations"
              className="w-full px-4 py-2.5 rounded-xl bg-klo-dark border border-white/10 text-klo-text placeholder:text-klo-muted text-sm focus:outline-none focus:border-klo-gold/50"
            />
          </div>

          {/* Is Past toggle */}
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <div
                onClick={() => setForm((p) => ({ ...p, is_past: !p.is_past }))}
                className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer ${
                  form.is_past ? "bg-[#2764FF]" : "bg-white/10"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                    form.is_past ? "translate-x-5" : ""
                  }`}
                />
              </div>
              <span className="text-sm text-klo-text">Past session</span>
            </label>
          </div>

          {/* Past-session-only fields */}
          {form.is_past && (
            <div className="space-y-4 pl-4 border-l border-white/10">
              <div>
                <label className="block text-xs text-klo-muted mb-1.5">
                  Attendees Override <span className="text-klo-muted/60">(optional display count)</span>
                </label>
                <input
                  type="number"
                  min={0}
                  value={form.attendees_override}
                  onChange={(e) => setForm((p) => ({ ...p, attendees_override: e.target.value }))}
                  placeholder="22"
                  className="w-full px-4 py-2.5 rounded-xl bg-klo-dark border border-white/10 text-klo-text text-sm focus:outline-none focus:border-klo-gold/50"
                />
              </div>
              <div>
                <label className="block text-xs text-klo-muted mb-1.5">Replay URL</label>
                <input
                  type="url"
                  value={form.replay_url}
                  onChange={(e) => setForm((p) => ({ ...p, replay_url: e.target.value }))}
                  placeholder="https://..."
                  className="w-full px-4 py-2.5 rounded-xl bg-klo-dark border border-white/10 text-klo-text placeholder:text-klo-muted text-sm focus:outline-none focus:border-klo-gold/50"
                />
              </div>
              <div>
                <label className="block text-xs text-klo-muted mb-1.5">Notes URL</label>
                <input
                  type="url"
                  value={form.notes_url}
                  onChange={(e) => setForm((p) => ({ ...p, notes_url: e.target.value }))}
                  placeholder="https://..."
                  className="w-full px-4 py-2.5 rounded-xl bg-klo-dark border border-white/10 text-klo-text placeholder:text-klo-muted text-sm focus:outline-none focus:border-klo-gold/50"
                />
              </div>
            </div>
          )}

          {/* Published toggle */}
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <div
                onClick={() => setForm((p) => ({ ...p, published: !p.published }))}
                className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer ${
                  form.published ? "bg-green-500" : "bg-white/10"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                    form.published ? "translate-x-5" : ""
                  }`}
                />
              </div>
              <span className="text-sm text-klo-text">Published (visible to users)</span>
            </label>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2 border-t border-white/5">
            <button
              onClick={closeModal}
              className="px-4 py-2 rounded-xl text-sm text-klo-muted hover:text-klo-text transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !form.title.trim() || !form.slug.trim()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2764FF]/20 border border-[#2764FF]/30 text-[#2764FF] hover:bg-[#2764FF]/30 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : null}
              {saving ? "Saving..." : isCreating ? "Create Session" : "Save Changes"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
